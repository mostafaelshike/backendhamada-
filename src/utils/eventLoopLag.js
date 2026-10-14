const { monitorEventLoopDelay } = require('perf_hooks');

class EventLoopHealthMonitor {
  constructor(resolution = 20, maxLagThresholdMs = 50) {
    this.maxLagThresholdMs = maxLagThresholdMs;
    try {
      this.histogram = monitorEventLoopDelay({ resolution });
      this.histogram.enable();
      this.enabled = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  getMetrics() {
    if (!this.enabled) {
      return { status: 'unsupported' };
    }

    const min = (this.histogram.min / 1e6).toFixed(2);
    const mean = (this.histogram.mean / 1e6).toFixed(2);
    const p50 = (this.histogram.percentile(50) / 1e6).toFixed(2);
    const p95 = (this.histogram.percentile(95) / 1e6).toFixed(2);
    const p99 = (this.histogram.percentile(99) / 1e6).toFixed(2);
    const max = (this.histogram.max / 1e6).toFixed(2);

    return {
      minMs: parseFloat(min),
      meanMs: parseFloat(mean),
      p50Ms: parseFloat(p50),
      p95Ms: parseFloat(p95),
      p99Ms: parseFloat(p99),
      maxMs: parseFloat(max),
      isHealthy: parseFloat(p99) < this.maxLagThresholdMs,
    };
  }
}

module.exports = new EventLoopHealthMonitor();
