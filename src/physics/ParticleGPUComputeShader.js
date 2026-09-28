// Shared memory layout between the WGSL kernels and the JS coordinator.
// Every buffer offset below is expressed in 32-bit words.
export const GPU_LAYOUT = (() => {
  const L = {
    WG: 64,
    PARTICLE_FLOATS: 8,
    CAPACITY: 1000000,     // particle slots per ping-pong buffer
    MAX_WALLS: 512,
    MAX_SINKS: 64,
    MAX_REGULATORS: 16,
    MAX_SENSORS: 16,
    MAX_THERMAL_ZONES: 16, // heat exchangers + regenerator matrices
    MAX_SLICES: 512,       // thermal zone temperature slots (regenerator slices)
    ZONE_WORDS: 12,
    WALL_EV_STRIDE: 10,    // impulseFront, impulseBack, heatIn, heatOut, conductance (each lo,hi)
    SLICE_EV_STRIDE: 6,    // heatIn, heatOut, conductance (each lo,hi)
    TELEM_SCALARS: 12,     // N, KE, vx+, vx-, vy+, vy-, mvx+, mvx-, mvy+, mvy-, m, |v|
    HIST_BINS: 64,
    HIST_BIN_WIDTH: 10,    // px/s per histogram bin
    KE_SCALE: 4,           // fixed-point scales for atomic accumulation
    V_SCALE: 16,
    MV_SCALE: 4,
    M_SCALE: 64,
    EV_SCALE: 16,
    G_SCALE: 256           // coupling conductance (alpha * 1.5 kB per wall hit, alpha * kB per volume exchange)
  };
  // Counters: [wall events][slice heat] are cleared on every readback; the rest persists.
  L.SLICE_HEAT_BASE = L.MAX_WALLS * L.WALL_EV_STRIDE;
  L.SINK_ABS_BASE = L.SLICE_HEAT_BASE + L.MAX_SLICES * L.SLICE_EV_STRIDE;
  L.REG_QUOTA_BASE = L.SINK_ABS_BASE + L.MAX_SINKS;
  L.COMPACT_IDX = L.REG_QUOTA_BASE + L.MAX_REGULATORS;
  L.SUBSTEP_IDX = L.COMPACT_IDX + 1; // index of the running substep within a frame
  L.COUNTER_WORDS = L.SUBSTEP_IDX + 1;

  L.ZONE_SINK_BASE = 0;
  L.ZONE_REG_BASE = L.MAX_SINKS;
  L.ZONE_SENSOR_BASE = L.MAX_SINKS + L.MAX_REGULATORS;
  L.ZONE_THERMAL_BASE = L.ZONE_SENSOR_BASE + L.MAX_SENSORS;
  L.MAX_ZONES = L.ZONE_THERMAL_BASE + L.MAX_THERMAL_ZONES;

  L.TELEM_TARGETS = 1 + L.MAX_SENSORS; // target 0 = global system
  L.WG_TARGET_STRIDE = L.TELEM_SCALARS + L.HIST_BINS;
  L.WG_REG_BASE = L.TELEM_TARGETS * L.WG_TARGET_STRIDE;
  L.WG_ACC_SIZE = L.WG_REG_BASE + L.MAX_REGULATORS;
  L.STAT_TARGET_STRIDE = 2 * L.TELEM_SCALARS + L.HIST_BINS;
  L.STAT_REG_BASE = L.TELEM_TARGETS * L.STAT_TARGET_STRIDE;
  L.STAT_WORDS = L.STAT_REG_BASE + L.MAX_REGULATORS;
  return Object.freeze(L);
})();

// Wrapped so the layout alias does not leak into the bundled global scope.
export const particleComputeWGSL = ((L) => `
struct SimParams {
  dt: f32, gravity: f32, gravityEnabled: u32, damping: f32,
  particleCount: u32, maxSpeedReference: f32, wallCount: u32, subSteps: u32,
  boundsEnabled: u32, cellSize: f32, gridTableSize: u32, sinkCount: u32,
  boundMin: vec2f, boundMax: vec2f,
  simModel: u32, regulatorCount: u32, sensorCount: u32, thermalZoneCount: u32,
};

struct Particle {
  pos: vec2f, vel: vec2f, radius: f32, mass: f32, speedNorm: f32, pad: f32,
};

struct WallData {
  p1: vec2f, p2: vec2f, normal: vec2f, thickness: f32,
  isOpen: u32, wallType: u32, allowedDir: f32,
  temperature: f32, conductivity: f32, vel: vec2f, pad: vec2f,
};

// Axis-aligned zone shared by sinks, regulators, sensor chambers and thermal
// zones. Thermal zones reuse fields: direction = slice axis (0: y, 1: x),
// tempFilterMode = slice count, filterTemperature = conductivity,
// maxCount = first slot in thermalTemps, pad0 = 1 if slice heat is recorded.
struct ZoneData {
  minPos: vec2f, maxPos: vec2f,
  isActive: u32, direction: u32, tempFilterMode: u32, filterTemperature: f32,
  maxCount: u32, pad0: u32, pad1: u32, pad2: u32,
};

const KB: f32 = 35.0;
const WG_SIZE: u32 = ${L.WG}u;
const WALL_EV_STRIDE: u32 = ${L.WALL_EV_STRIDE}u;
const SLICE_EV_STRIDE: u32 = ${L.SLICE_EV_STRIDE}u;
const SLICE_HEAT_BASE: u32 = ${L.SLICE_HEAT_BASE}u;
const PARTNER_BASE: u32 = ${L.CAPACITY}u;
const ZONE_THERMAL_BASE: u32 = ${L.ZONE_THERMAL_BASE}u;
const SINK_ABS_BASE: u32 = ${L.SINK_ABS_BASE}u;
const REG_QUOTA_BASE: u32 = ${L.REG_QUOTA_BASE}u;
const COMPACT_IDX: u32 = ${L.COMPACT_IDX}u;
const SUBSTEP_IDX: u32 = ${L.SUBSTEP_IDX}u;
const ZONE_SINK_BASE: u32 = ${L.ZONE_SINK_BASE}u;
const ZONE_REG_BASE: u32 = ${L.ZONE_REG_BASE}u;
const ZONE_SENSOR_BASE: u32 = ${L.ZONE_SENSOR_BASE}u;
const TELEM_SCALARS: u32 = ${L.TELEM_SCALARS}u;
const HIST_BINS: u32 = ${L.HIST_BINS}u;
const HIST_BIN_WIDTH: f32 = ${L.HIST_BIN_WIDTH}.0;
const WG_TARGET_STRIDE: u32 = ${L.WG_TARGET_STRIDE}u;
const WG_REG_BASE: u32 = ${L.WG_REG_BASE}u;
const WG_ACC_SIZE: u32 = ${L.WG_ACC_SIZE}u;
const STAT_TARGET_STRIDE: u32 = ${L.STAT_TARGET_STRIDE}u;
const STAT_REG_BASE: u32 = ${L.STAT_REG_BASE}u;
const KE_SCALE: f32 = ${L.KE_SCALE}.0;
const V_SCALE: f32 = ${L.V_SCALE}.0;
const MV_SCALE: f32 = ${L.MV_SCALE}.0;
const M_SCALE: f32 = ${L.M_SCALE}.0;
const EV_SCALE: f32 = ${L.EV_SCALE}.0;
const G_SCALE: f32 = ${L.G_SCALE}.0;
// Per-particle fixed-point cap: WG_SIZE * FX_MAX must stay below 2^32 so a
// workgroup-local u32 accumulator can never overflow.
const FX_MAX: f32 = 6.0e7;

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read> particlesIn: array<Particle>;
@group(0) @binding(2) var<storage, read_write> particlesOut: array<Particle>;
@group(0) @binding(3) var<storage, read> walls: array<WallData>;
@group(0) @binding(4) var<storage, read_write> cellHeads: array<atomic<i32>>;
// gridLinks[i] = next particle in cell list, gridLinks[PARTNER_BASE + i] = best collision partner
@group(0) @binding(5) var<storage, read_write> gridLinks: array<i32>;
@group(0) @binding(6) var<storage, read> thermalTemps: array<f32>;
@group(0) @binding(7) var<storage, read> zones: array<ZoneData>;
@group(0) @binding(8) var<storage, read_write> counters: array<atomic<u32>>;
@group(0) @binding(9) var<storage, read_write> stats: array<atomic<u32>>;

var<workgroup> wgAcc: array<atomic<u32>, ${L.WG_ACC_SIZE}>;
var<workgroup> wgLiveCount: atomic<u32>;
var<workgroup> wgBase: u32;

fn hashCell(cx: i32, cy: i32, tableSize: u32) -> u32 {
  let p1 = 73856093u;
  let p2 = 19349663u;
  let ux = bitcast<u32>(cx);
  let uy = bitcast<u32>(cy);
  return ((ux * p1) ^ (uy * p2)) % tableSize;
}

fn isDead(p: Particle) -> bool {
  return p.radius <= 0.0 || p.pos.x < -50000.0;
}

fn deadParticle(mass: f32) -> Particle {
  return Particle(vec2f(-99999.0, -99999.0), vec2f(0.0, 0.0), 0.0, mass, 0.0, 0.0);
}

fn inZone(pos: vec2f, z: ZoneData) -> bool {
  return pos.x >= z.minPos.x && pos.x <= z.maxPos.x && pos.y >= z.minPos.y && pos.y <= z.maxPos.y;
}

fn fx(x: f32, scale: f32) -> u32 {
  return u32(clamp(x * scale + 0.5, 0.0, FX_MAX));
}

// 64-bit accumulation emulated with a (lo, hi) pair of u32 atomics.
fn addCounter64(idx: u32, v: u32) {
  let old = atomicAdd(&counters[idx], v);
  if (old > 0xFFFFFFFFu - v) { atomicAdd(&counters[idx + 1u], 1u); }
}

fn addStat64(idx: u32, v: u32) {
  let old = atomicAdd(&stats[idx], v);
  if (old > 0xFFFFFFFFu - v) { atomicAdd(&stats[idx + 1u], 1u); }
}

// \`front\`: the particle is on the side the wall normal points to.
// Heat (signed, split into in/out channels) plus coupling conductance at \`base\`.
fn recordHeat(base: u32, heatIntoElement: f32, conductance: f32) {
  if (heatIntoElement > 0.0) {
    addCounter64(base, fx(heatIntoElement, EV_SCALE));
  } else if (heatIntoElement < 0.0) {
    addCounter64(base + 2u, fx(-heatIntoElement, EV_SCALE));
  }
  if (conductance > 0.0) { addCounter64(base + 4u, fx(conductance, G_SCALE)); }
}

fn recordWallEvent(wallIdx: u32, impulse: f32, heatIntoWall: f32, conductance: f32, front: bool) {
  let base = wallIdx * WALL_EV_STRIDE;
  let imp = fx(impulse, EV_SCALE);
  if (imp > 0u) { addCounter64(base + select(2u, 0u, front), imp); }
  recordHeat(base + 4u, heatIntoWall, conductance);
}

// Reflects a particle off a (possibly moving, possibly conductive) wall and
// records the momentum and heat exchanged so the CPU can drive pistons,
// relief valves and wall temperatures from it.
fn wallBounce(vel: vec2f, mass: f32, n: vec2f, wallIdx: u32) -> vec2f {
  let w = walls[wallIdx];
  let vn = dot(vel - w.vel, n);
  if (vn >= 0.0) { return vel; }
  var v = vel - 2.0 * vn * n;
  var heatIntoWall = 0.0;
  var conductance = 0.0;
  if (w.conductivity > 0.0) {
    let curSpeedSq = dot(v, v);
    if (curSpeedSq > 0.001) {
      // Wall hits sample the flux-weighted distribution, whose mean energy in 2D is
      // 1.5 kB T (not kB T), so the target is 1.5 kB T_wall; otherwise gas in contact
      // with a wall would settle at T_wall / 1.5.
      let targetSpeedSq = (3.0 * KB * w.temperature) / mass;
      let alpha = min(1.0, w.conductivity * 0.8);
      let blendSq = (1.0 - alpha) * curSpeedSq + alpha * targetSpeedSq;
      v *= sqrt(blendSq / curSpeedSq);
      heatIntoWall = 0.5 * mass * (curSpeedSq - blendSq);
      conductance = alpha * 1.5 * KB;
    }
  }
  recordWallEvent(wallIdx, 2.0 * mass * (-vn), heatIntoWall, conductance, dot(n, w.normal) > 0.0);
  return v;
}

fn isOneWayWall(w: WallData) -> bool {
  return (w.wallType == 2u) || (w.wallType == 3u && w.isOpen != 0u);
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
  if (isDead(p)) {
    gridLinks[idx] = -1;
    return;
  }
  let cx = i32(floor(p.pos.x / params.cellSize));
  let cy = i32(floor(p.pos.y / params.cellSize));
  let cellIdx = hashCell(cx, cy, params.gridTableSize);
  let prevHead = atomicExchange(&cellHeads[cellIdx], i32(idx));
  gridLinks[idx] = prevHead;
}

@compute @workgroup_size(64)
fn cs_find_pairs(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  let p = particlesIn[idx];
  if (isDead(p)) {
    gridLinks[PARTNER_BASE + idx] = -1;
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
        otherIdx = gridLinks[u32(otherIdx)];
        loopSteps++;
      }
    }
  }
  gridLinks[PARTNER_BASE + idx] = bestPartner;
}

@compute @workgroup_size(64)
fn cs_integrate(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  var p = particlesIn[idx];
  if (isDead(p)) {
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
          otherIdx = gridLinks[u32(otherIdx)];
          loopSteps++;
        }
      }
    }
    p.vel += ljForce * params.dt;
  } else {
    // Ideal Gas: Mutual Pairwise Elastic Impulse
    let partnerIdx = gridLinks[PARTNER_BASE + idx];
    if (partnerIdx >= 0) {
      let partnerOfOther = gridLinks[PARTNER_BASE + u32(partnerIdx)];
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
  // Walls are uploaded at their frame-start position; moving walls (piston
  // faces) advance by vel * dt per substep so they sweep rather than jump.
  let wallTime = f32(atomicLoad(&counters[SUBSTEP_IDX])) * params.dt;
  let moveVec = (p.pos - startPos) + p.vel * params.dt;
  var candidatePos = startPos + moveVec;
  var earliestT = 2.0;
  var hitWallIdx = -1;
  var hitNormal = vec2f(0.0, 0.0);
  var hitEffRad = 0.0;

  for (var i = 0u; i < params.wallCount; i++) {
    let w = walls[i];
    if (w.wallType == 1u && w.isOpen != 0u) { continue; }
    let vRel = p.vel - w.vel;
    let vDotN = dot(vRel, w.normal);
    if (isOneWayWall(w) && (vDotN * w.allowedDir > 0.0)) { continue; }

    let effRad = p.radius + w.thickness * 0.5;
    let wp1 = w.p1 + w.vel * wallTime;
    let seg = w.p2 - w.p1;
    let segLenSq = dot(seg, seg);
    if (segLenSq < 1e-6) { continue; }

    let vx = moveVec.x - w.vel.x * params.dt;
    let vy = moveVec.y - w.vel.y * params.dt;
    let wx = seg.x;
    let wy = seg.y;
    let denom = vx * wy - vy * wx;

    if (abs(denom) > 1e-6) {
      let dx13 = wp1.x - startPos.x;
      let dy13 = wp1.y - startPos.y;
      let t = (dx13 * wy - dy13 * wx) / denom;
      let u = (dx13 * vy - dy13 * vx) / denom;
      let wallLen = sqrt(segLenSq);
      let eps = effRad / wallLen;

      if (t >= 0.0 && t <= 1.0 && u >= -eps && u <= 1.0 + eps && t < earliestT) {
        let hStart = dot(startPos - wp1, w.normal);
        var norm = select(-w.normal, w.normal, hStart >= 0.0);
        if (abs(hStart) < 1e-4) { norm = select(-w.normal, w.normal, vDotN < 0.0); }
        earliestT = t;
        hitWallIdx = i32(i);
        hitNormal = norm;
        hitEffRad = effRad;
      }
    }
  }

  if (hitWallIdx >= 0) {
    p.vel = wallBounce(p.vel, p.mass, hitNormal, u32(hitWallIdx));
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
    if (isOneWayWall(w) && (dot(p.vel - w.vel, w.normal) * w.allowedDir > 0.0)) { continue; }
    let effRad = p.radius + w.thickness * 0.5;
    let wp1 = w.p1 + w.vel * (wallTime + params.dt);
    let seg = w.p2 - w.p1;
    let segLenSq = dot(seg, seg);
    var u_proj = 0.0;
    if (segLenSq > 1e-6) {
      u_proj = clamp(dot(p.pos - wp1, seg) / segLenSq, 0.0, 1.0);
    }
    let closest = wp1 + seg * u_proj;
    let diff = p.pos - closest;
    let distSq = dot(diff, diff);
    if (distSq < effRad * effRad && distSq > 1e-6) {
      let dist = sqrt(distSq);
      let norm = diff / dist;
      p.pos = closest + norm * (effRad + 0.05);
      p.vel = wallBounce(p.vel, p.mass, norm, i);
    }
  }

  // 4a. Permeable thermal zones: heat exchangers (isothermal) and regenerator
  // slices (finite capacity, heat recorded per slice)
  for (var t = 0u; t < params.thermalZoneCount; t++) {
    let z = zones[ZONE_THERMAL_BASE + t];
    if (z.isActive == 0u || !inZone(p.pos, z)) { continue; }
    let curSpeedSq = dot(p.vel, p.vel);
    if (curSpeedSq < 0.0001) { continue; }
    let sliceCount = max(z.tempFilterMode, 1u);
    var frac = (p.pos.y - z.minPos.y) / max(z.maxPos.y - z.minPos.y, 1e-3);
    if (z.direction == 1u) { frac = (p.pos.x - z.minPos.x) / max(z.maxPos.x - z.minPos.x, 1e-3); }
    let slice = min(u32(clamp(frac, 0.0, 0.9999) * f32(sliceCount)), sliceCount - 1u);
    let slot = z.maxCount + slice;
    let targetSpeedSq = (2.0 * KB * max(5.0, thermalTemps[slot])) / max(0.01, p.mass);
    let alpha = min(1.0, z.filterTemperature * 6.0 * params.dt);
    let blendSq = (1.0 - alpha) * curSpeedSq + alpha * targetSpeedSq;
    if (blendSq > 0.0) {
      p.vel *= sqrt(blendSq / curSpeedSq);
      if (z.pad0 != 0u) {
        recordHeat(SLICE_HEAT_BASE + slot * SLICE_EV_STRIDE, 0.5 * p.mass * (curSpeedSq - blendSq), alpha * KB);
      }
    }
  }

  // 4b. Sink (Absorber) Absorption with atomic per-sink capacity accounting
  for (var s = 0u; s < params.sinkCount; s++) {
    let z = zones[ZONE_SINK_BASE + s];
    if (z.isActive == 0u || !inZone(p.pos, z)) { continue; }
    if (z.direction == 1u && p.vel.x <= 0.0) { continue; }
    if (z.direction == 2u && p.vel.x >= 0.0) { continue; }
    if (z.direction == 3u && p.vel.y <= 0.0) { continue; }
    if (z.direction == 4u && p.vel.y >= 0.0) { continue; }
    if (z.tempFilterMode != 0u) {
      let pTemp = (p.mass * dot(p.vel, p.vel)) / (2.0 * KB);
      if (z.tempFilterMode == 1u && pTemp < z.filterTemperature) { continue; }
      if (z.tempFilterMode == 2u && pTemp > z.filterTemperature) { continue; }
    }
    let slot = SINK_ABS_BASE + s;
    let old = atomicAdd(&counters[slot], 1u);
    if (z.maxCount != 0u && old >= z.maxCount) {
      atomicSub(&counters[slot], 1u);
      continue;
    }
    particlesOut[idx] = deadParticle(p.mass);
    return;
  }

  // 4c. Regulator extraction: consume the per-frame removal quota set by the CPU
  for (var r = 0u; r < params.regulatorCount; r++) {
    let z = zones[ZONE_REG_BASE + r];
    if (!inZone(p.pos, z)) { continue; }
    let q = REG_QUOTA_BASE + r;
    let cur = atomicLoad(&counters[q]);
    if (cur == 0u || cur >= 0x80000000u) { continue; }
    let old = atomicSub(&counters[q], 1u);
    if (old >= 1u && old < 0x80000000u) {
      particlesOut[idx] = deadParticle(p.mass);
      return;
    }
    atomicAdd(&counters[q], 1u);
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

fn accumulateTarget(t: u32, p: Particle, speed: f32, ke: f32) {
  let b = t * WG_TARGET_STRIDE;
  atomicAdd(&wgAcc[b], 1u);
  atomicAdd(&wgAcc[b + 1u], fx(ke, KE_SCALE));
  if (p.vel.x >= 0.0) { atomicAdd(&wgAcc[b + 2u], fx(p.vel.x, V_SCALE)); }
  else { atomicAdd(&wgAcc[b + 3u], fx(-p.vel.x, V_SCALE)); }
  if (p.vel.y >= 0.0) { atomicAdd(&wgAcc[b + 4u], fx(p.vel.y, V_SCALE)); }
  else { atomicAdd(&wgAcc[b + 5u], fx(-p.vel.y, V_SCALE)); }
  let mv = p.mass * p.vel;
  if (mv.x >= 0.0) { atomicAdd(&wgAcc[b + 6u], fx(mv.x, MV_SCALE)); }
  else { atomicAdd(&wgAcc[b + 7u], fx(-mv.x, MV_SCALE)); }
  if (mv.y >= 0.0) { atomicAdd(&wgAcc[b + 8u], fx(mv.y, MV_SCALE)); }
  else { atomicAdd(&wgAcc[b + 9u], fx(-mv.y, MV_SCALE)); }
  atomicAdd(&wgAcc[b + 10u], fx(p.mass, M_SCALE));
  atomicAdd(&wgAcc[b + 11u], fx(speed, V_SCALE));
  let bin = min(u32(speed / HIST_BIN_WIDTH), HIST_BINS - 1u);
  atomicAdd(&wgAcc[b + TELEM_SCALARS + bin], 1u);
}

// Telemetry reduction: global + per-sensor sums, speed histograms and
// regulator zone counts. Workgroup-local atomics first, then one global
// atomic per non-zero channel per workgroup.
@compute @workgroup_size(64)
fn cs_telemetry(@builtin(global_invocation_id) global_id: vec3u,
                @builtin(local_invocation_index) lid: u32) {
  for (var i = lid; i < WG_ACC_SIZE; i += WG_SIZE) {
    atomicStore(&wgAcc[i], 0u);
  }
  workgroupBarrier();

  let idx = global_id.x;
  if (idx < params.particleCount) {
    let p = particlesIn[idx];
    if (!isDead(p)) {
      let speedSq = dot(p.vel, p.vel);
      let speed = sqrt(speedSq);
      let ke = 0.5 * p.mass * speedSq;
      accumulateTarget(0u, p, speed, ke);
      for (var s = 0u; s < params.sensorCount; s++) {
        if (inZone(p.pos, zones[ZONE_SENSOR_BASE + s])) {
          accumulateTarget(1u + s, p, speed, ke);
        }
      }
      for (var r = 0u; r < params.regulatorCount; r++) {
        if (inZone(p.pos, zones[ZONE_REG_BASE + r])) {
          atomicAdd(&wgAcc[WG_REG_BASE + r], 1u);
        }
      }
    }
  }
  workgroupBarrier();

  for (var i = lid; i < WG_ACC_SIZE; i += WG_SIZE) {
    let v = atomicLoad(&wgAcc[i]);
    if (v == 0u) { continue; }
    if (i >= WG_REG_BASE) {
      atomicAdd(&stats[STAT_REG_BASE + (i - WG_REG_BASE)], v);
      continue;
    }
    let t = i / WG_TARGET_STRIDE;
    let c = i % WG_TARGET_STRIDE;
    if (c < TELEM_SCALARS) {
      addStat64(t * STAT_TARGET_STRIDE + c * 2u, v);
    } else {
      atomicAdd(&stats[t * STAT_TARGET_STRIDE + 2u * TELEM_SCALARS + (c - TELEM_SCALARS)], v);
    }
  }
}

// Runs once after each substep so moving walls know how far they have advanced.
@compute @workgroup_size(1)
fn cs_advance_substep() {
  atomicAdd(&counters[SUBSTEP_IDX], 1u);
}

// Stream compaction: live particles are packed to the front of particlesOut.
@compute @workgroup_size(64)
fn cs_compact(@builtin(global_invocation_id) global_id: vec3u,
              @builtin(local_invocation_index) lid: u32) {
  if (lid == 0u) { atomicStore(&wgLiveCount, 0u); }
  workgroupBarrier();

  let idx = global_id.x;
  var alive = false;
  var p: Particle;
  if (idx < params.particleCount) {
    p = particlesIn[idx];
    alive = !isDead(p);
  }
  var localSlot = 0u;
  if (alive) { localSlot = atomicAdd(&wgLiveCount, 1u); }
  workgroupBarrier();

  if (lid == 0u) {
    wgBase = atomicAdd(&counters[COMPACT_IDX], atomicLoad(&wgLiveCount));
  }
  workgroupBarrier();

  if (alive) { particlesOut[wgBase + localSlot] = p; }
}

// Marks every slot behind the compacted range as dead.
@compute @workgroup_size(64)
fn cs_compact_tail(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) { return; }
  if (idx >= atomicLoad(&counters[COMPACT_IDX])) {
    particlesOut[idx] = deadParticle(1.0);
  }
}
`)(GPU_LAYOUT);
