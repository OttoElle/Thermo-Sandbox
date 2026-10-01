// Custom dashboard chart (right sidebar): a ChartView for a target + metric.
// Kept as a class with (id, target, metric, canvas) / render(engine) because
// tests construct it via window.DashboardChart.
import { ChartView } from './ChartView.js';

export class DashboardChart {
  constructor(id, target, metric, canvas = null) {
    this.id = id;
    this.target = target;
    this.metric = metric;
    this.view = canvas ? new ChartView(canvas, { target, metric }) : null;
  }

  attach(canvas) {
    this.view = new ChartView(canvas, { target: this.target, metric: this.metric });
  }

  getTitle() {
    return this.view ? this.view.title() : new ChartView(document.createElement('canvas'), { target: this.target, metric: this.metric }).title();
  }

  render(engine) {
    this.view?.render(engine);
  }
}
