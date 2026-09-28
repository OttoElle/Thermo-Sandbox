// Simulation units shared by the CPU physics, the WGSL kernels (templated in
// ParticleGPUComputeShader.js) and the analytics.

// Boltzmann constant in simulation units (px, px/s, mass 1): a 2D gas at
// temperature T has mean kinetic energy kB·T per particle.
export const KB = 35.0;

// Side length of the square world in px; also the default simulation bounds.
export const WORLD_SIZE = 2500;

// Displayed pressure of N particles in area A: P = N/A · kB·T · PRESSURE_SCALE.
export const PRESSURE_SCALE = 100;

export function idealGasPressure(count, area, temperature) {
  return (count / (area || 1)) * KB * temperature * PRESSURE_SCALE;
}
