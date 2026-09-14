export const particleComputeWGSL = `
struct SimParams {
  dt: f32,
  gravity: f32,
  gravityEnabled: u32,
  damping: f32,
  worldWidth: f32,
  worldHeight: f32,
  particleCount: u32,
  maxSpeedReference: f32,
  wallCount: u32,
  subSteps: u32,
  pad1: u32,
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
};

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read> particlesIn: array<Particle>;
@group(0) @binding(2) var<storage, read_write> particlesOut: array<Particle>;
@group(0) @binding(3) var<storage, read> walls: array<WallData>;

@compute @workgroup_size(64)
fn cs_integrate(@builtin(global_invocation_id) global_id: vec3u) {
  let idx = global_id.x;
  if (idx >= params.particleCount) {
    return;
  }

  var p = particlesIn[idx];

  // 1. Gravity acceleration
  if (params.gravityEnabled != 0u) {
    p.vel.y += params.gravity * params.dt;
  }

  // 2. Continuous Collision Detection (CCD) Ray-vs-Segment swept test
  let oldPos = p.pos;
  let moveVec = p.vel * params.dt;
  var candidatePos = oldPos + moveVec;

  var earliestT = 2.0;
  var hitWallIdx = -1;
  var hitNormal = vec2f(0.0, 0.0);
  var hitEffRad = 0.0;

  for (var i = 0u; i < params.wallCount; i++) {
    let w = walls[i];
    if (w.wallType == 1u && w.isOpen != 0u) {
      continue;
    }
    if (w.wallType == 3u && w.isOpen != 0u && abs(w.allowedDir) < 0.01) {
      continue;
    }

    let effRad = p.radius + w.thickness * 0.5;
    let seg = w.p2 - w.p1;
    let denom = moveVec.x * seg.y - moveVec.y * seg.x;

    if (abs(denom) > 1e-6) {
      let dx = w.p1.x - oldPos.x;
      let dy = w.p1.y - oldPos.y;
      let t = (dx * seg.y - dy * seg.x) / denom;
      let u = (dx * moveVec.y - dy * moveVec.x) / denom;

      let wallLen = length(seg);
      let eps = select(0.0, effRad / wallLen, wallLen > 0.0);

      if (t >= 0.0 && t <= 1.0 && u >= -eps && u <= 1.0 + eps) {
        let vDotN = dot(p.vel, w.normal);
        let isOneWay = (w.wallType == 2u) || (w.wallType == 3u && w.isOpen != 0u);
        if (isOneWay && (vDotN * w.allowedDir > 0.0)) {
          // Free passage
        } else if (t < earliestT) {
          earliestT = t;
          hitWallIdx = i32(i);
          hitNormal = select(-w.normal, w.normal, vDotN < 0.0);
          hitEffRad = effRad;
        }
      }
    }
  }

  if (hitWallIdx >= 0) {
    let w = walls[u32(hitWallIdx)];
    let hitPos = oldPos + moveVec * earliestT;
    let velAlongNormal = dot(p.vel, hitNormal);

    if (velAlongNormal < 0.0) {
      p.vel = p.vel - 2.0 * velAlongNormal * hitNormal;

      if (w.conductivity > 0.0) {
        let kB = 35.0;
        let targetSpeedSq = (2.0 * kB * w.temperature) / p.mass;
        let curSpeedSq = dot(p.vel, p.vel);
        let alpha = w.conductivity * 0.8;
        let blendSq = (1.0 - alpha) * curSpeedSq + alpha * targetSpeedSq;
        let factor = select(1.0, sqrt(blendSq / curSpeedSq), curSpeedSq > 0.001);
        p.vel *= factor;
      }

      p.vel *= params.damping;
    }

    let remainT = (1.0 - earliestT) * params.dt;
    candidatePos = hitPos + hitNormal * (hitEffRad + 0.05) + p.vel * remainT;
  }

  p.pos = candidatePos;

  // 3. Proximity / resting contact fallback
  for (var i = 0u; i < params.wallCount; i++) {
    let w = walls[i];
    if (w.wallType == 1u && w.isOpen != 0u) {
      continue;
    }
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
    if (distSq < effRad * effRad && distSq > 1e-8) {
      let dist = sqrt(distSq);
      let norm = diff / dist;
      p.pos = closest + norm * (effRad + 0.05);
      let vn = dot(p.vel, norm);
      if (vn < 0.0) {
        p.vel = p.vel - 2.0 * vn * norm * params.damping;
      }
    }
  }

  // 4. World boundary reflections (0..worldWidth, 0..worldHeight)
  let r = p.radius;
  if (p.pos.x - r < 0.0) {
    p.pos.x = r;
    p.vel.x = -p.vel.x * params.damping;
  } else if (p.pos.x + r > params.worldWidth) {
    p.pos.x = params.worldWidth - r;
    p.vel.x = -p.vel.x * params.damping;
  }

  if (p.pos.y - r < 0.0) {
    p.pos.y = r;
    p.vel.y = -p.vel.y * params.damping;
  } else if (p.pos.y + r > params.worldHeight) {
    p.pos.y = params.worldHeight - r;
    p.vel.y = -p.vel.y * params.damping;
  }

  // 5. Normalized speed for colormap sampling
  let speed = length(p.vel);
  let maxRef = max(1.0, params.maxSpeedReference);
  p.speedNorm = clamp(speed / maxRef, 0.0, 1.0);

  particlesOut[idx] = p;
}
`;
