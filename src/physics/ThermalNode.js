// Thermal node for solid thermal conduction in walls, pistons and matrices
export class ThermalNode {
  constructor(initialTemp = 300, heatCapacity = 100, conductivity = 0.5) {
    this.temperature = initialTemp;
    this.heatCapacity = Math.max(1, heatCapacity);
    this.conductivity = Math.max(0, Math.min(1, conductivity)); // 0 = adiabatic, 1 = ideal conductor
    this.heatFluxAccumulator = 0; // Joules exchanged in current timestep
  }

  addHeat(energyJoules) {
    this.heatFluxAccumulator += energyJoules;
  }

  update(dt) {
    if (dt > 0 && this.heatCapacity > 0) {
      this.temperature += this.heatFluxAccumulator / this.heatCapacity;
      this.heatFluxAccumulator = 0;
      // Prevent unphysical negative temperatures
      if (this.temperature < 5) this.temperature = 5;
    }
  }

  // Conduct heat to another node
  conductTo(otherNode, contactConductance = 1.0, dt = 0.016) {
    if (this.conductivity <= 0 || otherNode.conductivity <= 0) return;
    const effConductivity = (this.conductivity + otherNode.conductivity) * 0.5 * contactConductance;
    const deltaT = otherNode.temperature - this.temperature;
    const heatFlowRate = effConductivity * deltaT * 50; // Heat flow coefficient
    const heatTransferred = heatFlowRate * dt;

    this.addHeat(heatTransferred);
    otherNode.addHeat(-heatTransferred);
  }
}
