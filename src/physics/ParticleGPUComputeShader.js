export const particleComputeWGSL = `
struct SimParams {
  dt: f32,
  gravity: f32,
  gravityEnabled: u32,
  damping: f32,
  particleCount: u32,
  maxSpeedReference: f32,
  wallCount: u32,
  subSteps: u32,
  boundsEnabled: u32,
  cellSize: f32,
  gridCols: u32,
  gridRows: u32,
  gridOrigin: vec2f,
  boundMin: vec2f,
  boundMax: vec2f,
  simModel: u32,
  pad2: u32,
};

struct Particle {
  pos: vec2f,
  vel: vec2f,
  radius: f32,
  mass: f32,
  speedNorm: f32,
  pad: f32,
};

struct WallData {
  p1: vec2f,
  p2: vec2f,
  normal: vec2f,
  thickness: f32,
  isOpen: u32,
  wallType: u32,
  allowedDir: f32,
  temperature: f32,
  conductivity: f32,
  vel: vec2f,
  pad: vec2f,
};

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read> particlesIn: array<Particle>;
@group(0) @binding(2) var<storage, read_write> particlesOut: array<Particle>;
@group(0) @binding(3) var<storage, read> walls: array<WallData>;
@group(0) @binding(4) var<storage, read_write> cellHeads: array<atomic<i32>>;
@group(0) @binding(5) var<storage, read_write> particleNext: array<i32>;
@group(0) @binding(6) var<storage, read_write> bestPartners: array<i32>;

@compute @workgroup_size(64)
fn cs_clear_grid(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  let totalCells = params.gridCols * params.gridRows;
  if (idx < totalCells) {
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
  let rawX = i32(floor((p.pos.x - params.gridOrigin.x) / params.cellSize));
  let rawY = i32(floor((p.pos.y - params.gridOrigin.y) / params.cellSize));
  if (rawX >= 0 && rawX < i32(params.gridCols) && rawY >= 0 && rawY < i32(params.gridRows)) {
    let cellIdx = u32(rawY * i32(params.gridCols) + rawX);
    let prevHead = atomicExchange(&cellHeads[cellIdx], i32(idx));
    particleNext[idx] = prevHead;
  } else {
    particleNext[idx] = -1;
  }
}

@compute @workgroup_size(64)
fn cs_find_pairs(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  let p = particlesIn[idx];
  let cellX = i32(floor((p.pos.x - params.gridOrigin.x) / params.cellSize));
  let cellY = i32(floor((p.pos.y - params.gridOrigin.y) / params.cellSize));

  var bestPartner = -1;
  var maxApproach = 0.0;

  if (cellX >= 0 && cellX < i32(params.gridCols) && cellY >= 0 && cellY < i32(params.gridRows)) {
    for (var dy = -1; dy <= 1; dy++) {
      let ny = cellY + dy;
      if (ny < 0 || ny >= i32(params.gridRows)) { continue; }
      for (var dx = -1; dx <= 1; dx++) {
        let nx = cellX + dx;
        if (nx < 0 || nx >= i32(params.gridCols)) { continue; }
        let nCellIdx = u32(ny * i32(params.gridCols) + nx);
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
  }
  bestPartners[idx] = bestPartner;
}

@compute @workgroup_size(64)
fn cs_integrate(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  var p = particlesIn[idx];
  let startPos = p.pos;

  // 1. Gravity acceleration
  if (params.gravityEnabled != 0u) {
    p.vel.y += params.gravity * params.dt;
  }

  // 2. Particle-Particle Mutual Elastic Collision (Newton III Strict Conservation)
  if (params.simModel == 1u) {
    // Real Gas: Lennard-Jones 6-12 potential
    let cellX = i32(floor((p.pos.x - params.gridOrigin.x) / params.cellSize));
    let cellY = i32(floor((p.pos.y - params.gridOrigin.y) / params.cellSize));
    if (cellX >= 0 && cellX < i32(params.gridCols) && cellY >= 0 && cellY < i32(params.gridRows)) {
      var ljForce = vec2f(0.0, 0.0);
      for (var dy = -1; dy <= 1; dy++) {
        let ny = cellY + dy;
        if (ny < 0 || ny >= i32(params.gridRows)) { continue; }
        for (var dx = -1; dx <= 1; dx++) {
          let nx = cellX + dx;
          if (nx < 0 || nx >= i32(params.gridCols)) { continue; }
          let nCellIdx = u32(ny * i32(params.gridCols) + nx);
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
    }
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
