export const particleComputeWGSL = `
struct SimParams {
  dt: f32, gravity: f32, gravityEnabled: u32, damping: f32,
  particleCount: u32, maxSpeedReference: f32, wallCount: u32, subSteps: u32,
  boundsEnabled: u32, cellSize: f32, gridTableSize: u32, sinkCount: u32,
  boundMin: vec2f, boundMax: vec2f,
  simModel: u32, pad2: u32, pad3: u32, pad4: u32,
};

struct Particle {
  pos: vec2f, vel: vec2f, radius: f32, mass: f32, speedNorm: f32, pad: f32,
};

struct WallData {
  p1: vec2f, p2: vec2f, normal: vec2f, thickness: f32,
  isOpen: u32, wallType: u32, allowedDir: f32,
  temperature: f32, conductivity: f32, vel: vec2f, pad: vec2f,
};

struct SinkData {
  minPos: vec2f, maxPos: vec2f,
  isActive: u32, direction: u32, tempFilterMode: u32, filterTemperature: f32,
  pad1: vec2f, pad2: vec2f,
};

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read> particlesIn: array<Particle>;
@group(0) @binding(2) var<storage, read_write> particlesOut: array<Particle>;
@group(0) @binding(3) var<storage, read> walls: array<WallData>;
@group(0) @binding(4) var<storage, read_write> cellHeads: array<atomic<i32>>;
@group(0) @binding(5) var<storage, read_write> particleNext: array<i32>;
@group(0) @binding(6) var<storage, read_write> bestPartners: array<i32>;
@group(0) @binding(7) var<storage, read> sinks: array<SinkData>;

fn hashCell(cx: i32, cy: i32, tableSize: u32) -> u32 {
  let p1 = 73856093u;
  let p2 = 19349663u;
  let ux = bitcast<u32>(cx);
  let uy = bitcast<u32>(cy);
  return ((ux * p1) ^ (uy * p2)) % tableSize;
}

@compute @workgroup_size(64)
fn cs_clear_grid(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx < params.gridTableSize) {
    atomicStore(&cellHeads[idx], -1);
  }
}

@compute @workgroup_size(64)
fn cs_build_grid(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) {
    return;
  }
  let p = particlesIn[idx];
  if (p.radius <= 0.0 || p.pos.x < -50000.0) {
    particleNext[idx] = -1;
    return;
  }
  let cx = i32(floor(p.pos.x / params.cellSize));
  let cy = i32(floor(p.pos.y / params.cellSize));
  let cellIdx = hashCell(cx, cy, params.gridTableSize);
  let prevHead = atomicExchange(&cellHeads[cellIdx], i32(idx));
  particleNext[idx] = prevHead;
}

@compute @workgroup_size(64)
fn cs_find_pairs(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  let p = particlesIn[idx];
  if (p.radius <= 0.0 || p.pos.x < -50000.0) {
    bestPartners[idx] = -1;
    return;
  }
  let cx = i32(floor(p.pos.x / params.cellSize));
  let cy = i32(floor(p.pos.y / params.cellSize));

  var bestPartner = -1;
  var maxApproach = 0.0;
  var visitedBuckets: array<u32, 9>;
  var visitedCount = 0u;

  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      let nCellIdx = hashCell(cx + dx, cy + dy, params.gridTableSize);
      var alreadyVisited = false;
      for (var v = 0u; v < visitedCount; v++) {
        if (visitedBuckets[v] == nCellIdx) {
          alreadyVisited = true;
          break;
        }
      }
      if (alreadyVisited) { continue; }
      visitedBuckets[visitedCount] = nCellIdx;
      visitedCount++;

      var otherIdx = atomicLoad(&cellHeads[nCellIdx]);
      var loopSteps = 0;
      while (otherIdx >= 0 && loopSteps < 48) {
        if (otherIdx != i32(idx)) {
          let pOther = particlesIn[u32(otherIdx)];
          let diff = p.pos - pOther.pos;
          let distSq = dot(diff, diff);
          let minDist = p.radius + pOther.radius;
          if (distSq < minDist * minDist && distSq > 1e-4) {
            let dist = sqrt(distSq);
            let n = diff / dist;
            let relVel = p.vel - pOther.vel;
            let vRelN = dot(relVel, n);
            if (vRelN < 0.0) {
              let approach = -vRelN;
              if (approach > maxApproach) {
                maxApproach = approach;
                bestPartner = otherIdx;
              }
            }
          }
        }
        otherIdx = particleNext[u32(otherIdx)];
        loopSteps++;
      }
    }
  }
  bestPartners[idx] = bestPartner;
}

@compute @workgroup_size(64)
fn cs_integrate(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  var p = particlesIn[idx];
  if (p.radius <= 0.0 || p.pos.x < -50000.0) {
    particlesOut[idx] = p;
    return;
  }
  let startPos = p.pos;

  // 1. Gravity acceleration
  if (params.gravityEnabled != 0u) {
    p.vel.y += params.gravity * params.dt;
  }

  // 2. Particle-Particle Mutual Elastic Collision (Newton III Strict Conservation)
  if (params.simModel == 1u) {
    // Real Gas: Lennard-Jones 6-12 potential
    let cx = i32(floor(p.pos.x / params.cellSize));
    let cy = i32(floor(p.pos.y / params.cellSize));
    var ljForce = vec2f(0.0, 0.0);
    var visitedBuckets: array<u32, 9>;
    var visitedCount = 0u;

    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        let nCellIdx = hashCell(cx + dx, cy + dy, params.gridTableSize);
        var alreadyVisited = false;
        for (var v = 0u; v < visitedCount; v++) {
          if (visitedBuckets[v] == nCellIdx) {
            alreadyVisited = true;
            break;
          }
        }
        if (alreadyVisited) { continue; }
        visitedBuckets[visitedCount] = nCellIdx;
        visitedCount++;

        var otherIdx = atomicLoad(&cellHeads[nCellIdx]);
        var loopSteps = 0;
        while (otherIdx >= 0 && loopSteps < 32) {
          if (otherIdx != i32(idx)) {
            let pOther = particlesIn[u32(otherIdx)];
            let diff = p.pos - pOther.pos;
            let distSq = dot(diff, diff);
            let sigma = (p.radius + pOther.radius) * 0.9;
            let sigmaSq = sigma * sigma;
            let rCutSq = sigmaSq * 6.25;
            if (distSq < rCutSq && distSq > 1e-4) {
              let invDistSq = 1.0 / distSq;
              let s_r2 = sigmaSq * invDistSq;
              let s_r6 = s_r2 * s_r2 * s_r2;
              let s_r12 = s_r6 * s_r6;
              let epsilon = 30.0;
              var forceOverDist = 24.0 * epsilon * (2.0 * s_r12 - s_r6) * invDistSq;
              let fSq = forceOverDist * forceOverDist * distSq;
              if (fSq > 1000000.0) {
                let dist = sqrt(distSq);
                forceOverDist = select(-1000.0, 1000.0, forceOverDist > 0.0) / dist;
              }
              ljForce += diff * (forceOverDist / p.mass);
            }
          }
          otherIdx = particleNext[u32(otherIdx)];
          loopSteps++;
        }
      }
    }
    p.vel += ljForce * params.dt;
  } else {
    // Ideal Gas: Mutual Pairwise Elastic Impulse
    let partnerIdx = bestPartners[idx];
    if (partnerIdx >= 0) {
      let partnerOfOther = bestPartners[u32(partnerIdx)];
      if (partnerOfOther == i32(idx)) {
        let pOther = particlesIn[u32(partnerIdx)];
        let diff = p.pos - pOther.pos;
        let distSq = dot(diff, diff);
        let minDist = p.radius + pOther.radius;
        if (distSq < minDist * minDist && distSq > 1e-4) {
          let dist = sqrt(distSq);
          let n = diff / dist;
          let relVel = p.vel - pOther.vel;
          let vRelN = dot(relVel, n);
          if (vRelN < 0.0) {
            let mTotal = p.mass + pOther.mass;
            let impulse = 2.0 * vRelN / mTotal;
            p.vel -= impulse * pOther.mass * n;
            let overlap = (minDist - dist) * 0.5;
            p.pos += n * overlap;
          }
        }
      }
    }
  }

  // 3. Wall Continuous Collision Detection (CCD) Ray-vs-Segment
  let moveVec = (p.pos - startPos) + p.vel * params.dt;
  var candidatePos = startPos + moveVec;
  var earliestT = 2.0;
  var hitWallIdx = -1;
  var hitNormal = vec2f(0.0, 0.0);
  var hitEffRad = 0.0;
  var hitWallVel = vec2f(0.0, 0.0);

  for (var i = 0u; i < params.wallCount; i++) {
    let w = walls[i];
    if (w.wallType == 1u && w.isOpen != 0u) { continue; }
    let vRel = p.vel - w.vel;
    let vDotN = dot(vRel, w.normal);
    let isOneWay = (w.wallType == 2u) || (w.wallType == 3u && w.isOpen != 0u);
    if (isOneWay && (vDotN * w.allowedDir > 0.0)) { continue; }

    let effRad = p.radius + w.thickness * 0.5;
    let seg = w.p2 - w.p1;
    let segLenSq = dot(seg, seg);
    if (segLenSq < 1e-6) { continue; }

    let vx = moveVec.x - w.vel.x * params.dt;
    let vy = moveVec.y - w.vel.y * params.dt;
    let wx = seg.x;
    let wy = seg.y;
    let denom = vx * wy - vy * wx;

    if (abs(denom) > 1e-6) {
      let dx13 = w.p1.x - startPos.x;
      let dy13 = w.p1.y - startPos.y;
      let t = (dx13 * wy - dy13 * wx) / denom;
      let u = (dx13 * vy - dy13 * vx) / denom;
      let wallLen = sqrt(segLenSq);
      let eps = effRad / wallLen;

      if (t >= 0.0 && t <= 1.0 && u >= -eps && u <= 1.0 + eps && t < earliestT) {
        let hStart = dot(startPos - w.p1, w.normal);
        var norm = select(-w.normal, w.normal, hStart >= 0.0);
        if (abs(hStart) < 1e-4) { norm = select(-w.normal, w.normal, vDotN < 0.0); }
        earliestT = t;
        hitWallIdx = i32(i);
        hitNormal = norm;
        hitEffRad = effRad;
        hitWallVel = w.vel;
      }
    }
  }

  if (hitWallIdx >= 0) {
    let w = walls[u32(hitWallIdx)];
    let vRel = p.vel - hitWallVel;
    let velAlongNormal = dot(vRel, hitNormal);
    if (velAlongNormal < 0.0) {
      // Elastic bounce with moving wall (Piston PV work)
      p.vel -= 2.0 * velAlongNormal * hitNormal;
      if (w.conductivity > 0.0) {
        let kB = 35.0;
        let targetSpeedSq = (2.0 * kB * w.temperature) / p.mass;
        let curSpeedSq = dot(p.vel, p.vel);
        let alpha = w.conductivity * 0.8;
        let blendSq = (1.0 - alpha) * curSpeedSq + alpha * targetSpeedSq;
        let factor = select(1.0, sqrt(blendSq / curSpeedSq), curSpeedSq > 0.001);
        p.vel *= factor;
      }
    }
    let hitPoint = startPos + moveVec * earliestT;
    let remainT = (1.0 - earliestT) * params.dt;
    candidatePos = hitPoint + hitNormal * (hitEffRad + 0.05) + p.vel * remainT;
  }
  p.pos = candidatePos;

  // 4. Proximity nudge (resting contact or corner entry)
  for (var i = 0u; i < params.wallCount; i++) {
    if (i32(i) == hitWallIdx) { continue; }
    let w = walls[i];
    if (w.wallType == 1u && w.isOpen != 0u) { continue; }
    let effRad = p.radius + w.thickness * 0.5;
    let seg = w.p2 - w.p1;
    let segLenSq = dot(seg, seg);
    var u_proj = 0.0;
    if (segLenSq > 1e-6) {
      u_proj = clamp(dot(p.pos - w.p1, seg) / segLenSq, 0.0, 1.0);
    }
    let closest = w.p1 + seg * u_proj;
    let diff = p.pos - closest;
    let distSq = dot(diff, diff);
    if (distSq < effRad * effRad && distSq > 1e-6) {
      let dist = sqrt(distSq);
      let norm = diff / dist;
      p.pos = closest + norm * (effRad + 0.05);
      let vRel = p.vel - w.vel;
      let vn = dot(vRel, norm);
      if (vn < 0.0) {
        p.vel -= 2.0 * vn * norm;
      }
    }
  }

  // 4b. Sink (Absorber) Absorption
  for (var s = 0u; s < params.sinkCount; s++) {
    let sk = sinks[s];
    if (sk.isActive == 0u) { continue; }
    if (p.pos.x >= sk.minPos.x && p.pos.x <= sk.maxPos.x &&
        p.pos.y >= sk.minPos.y && p.pos.y <= sk.maxPos.y) {
      var canAbsorb = true;
      if (sk.direction == 1u && p.vel.x <= 0.0) { canAbsorb = false; }
      else if (sk.direction == 2u && p.vel.x >= 0.0) { canAbsorb = false; }
      else if (sk.direction == 3u && p.vel.y <= 0.0) { canAbsorb = false; }
      else if (sk.direction == 4u && p.vel.y >= 0.0) { canAbsorb = false; }

      if (canAbsorb && sk.tempFilterMode != 0u) {
        let kB = 35.0;
        let vSq = dot(p.vel, p.vel);
        let pTemp = (p.mass * vSq) / (2.0 * kB);
        if (sk.tempFilterMode == 1u && pTemp < sk.filterTemperature) { canAbsorb = false; }
        else if (sk.tempFilterMode == 2u && pTemp > sk.filterTemperature) { canAbsorb = false; }
      }

      if (canAbsorb) {
        p.pos = vec2f(-99999.0, -99999.0);
        p.vel = vec2f(0.0, 0.0);
        p.radius = 0.0;
        break;
      }
    }
  }

  // 5. Bounds (Splash Mode)
  if (params.boundsEnabled != 0u) {
    let r = p.radius;
    if (p.pos.x - r < params.boundMin.x) {
      p.pos.x = params.boundMin.x + r;
      p.vel.x = abs(p.vel.x) * params.damping;
    } else if (p.pos.x + r > params.boundMax.x) {
      p.pos.x = params.boundMax.x - r;
      p.vel.x = -abs(p.vel.x) * params.damping;
    }
    if (p.pos.y - r < params.boundMin.y) {
      p.pos.y = params.boundMin.y + r;
      p.vel.y = abs(p.vel.y) * params.damping;
    } else if (p.pos.y + r > params.boundMax.y) {
      p.pos.y = params.boundMax.y - r;
      p.vel.y = -abs(p.vel.y) * params.damping;
    }
  }

  // 6. Colormap Normalized Speed
  let speed = length(p.vel);
  let maxRef = max(1.0, params.maxSpeedReference);
  p.speedNorm = clamp(speed / maxRef, 0.0, 1.0);

  particlesOut[idx] = p;
}
`;
