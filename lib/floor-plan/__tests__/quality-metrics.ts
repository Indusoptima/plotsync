/**
 * Quality Metrics Dashboard
 * Real-time monitoring of floor plan generation quality
 */

export interface QualityMetrics {
  // Generation metrics
  specificationPassRate: number; // Percentage of specs passing validation
  layoutSuccessRate: number; // Percentage of successful layouts
  averageGenerationTime: number; // Seconds
  
  // Quality metrics
  averageOverlapCount: number; // Average overlaps per plan
  averageAdjacencyScore: number; // 0-100
  averageLabelCollisionRate: number; // Percentage
  
  // Optimization metrics
  averageOptimizationIterations: number;
  averageQualityScore: number; // 0-100
  
  // Breakdown
  scoreBreakdown: {
    areaCompliance: number;
    adjacencySatisfaction: number;
    compactness: number;
    alignment: number;
    naturalLight: number;
  };
  
  // Alerts
  alerts: Array<{
    type: 'error' | 'warning' | 'info';
    metric: string;
    threshold: number;
    actual: number;
    message: string;
  }>;
}

export class QualityMetricsDashboard {
  private metrics: {
    specValidations: Array<{ passed: boolean; timestamp: number }>;
    layouts: Array<{ 
      success: boolean; 
      overlapCount: number; 
      score: number; 
      iterations: number;
      timestamp: number;
      scoreBreakdown: any;
    }>;
    labels: Array<{ collisions: number; total: number; timestamp: number }>;
    generationTimes: Array<{ duration: number; timestamp: number }>;
  };

  private thresholds = {
    specificationPassRate: 90,
    layoutSuccessRate: 85,
    averageOverlapCount: 0.5,
    averageAdjacencyScore: 80,
    labelCollisionRate: 5,
    generationTimeP95: 25000 // 25 seconds
  };

  constructor() {
    this.metrics = {
      specValidations: [],
      layouts: [],
      labels: [],
      generationTimes: []
    };
  }

  /**
   * Record specification validation
   */
  recordSpecValidation(passed: boolean) {
    this.metrics.specValidations.push({
      passed,
      timestamp: Date.now()
    });
    
    // Keep only last 100 entries
    if (this.metrics.specValidations.length > 100) {
      this.metrics.specValidations.shift();
    }
  }

  /**
   * Record layout generation
   */
  recordLayout(data: {
    success: boolean;
    overlapCount: number;
    score: number;
    iterations: number;
    scoreBreakdown: any;
  }) {
    this.metrics.layouts.push({
      ...data,
      timestamp: Date.now()
    });
    
    if (this.metrics.layouts.length > 100) {
      this.metrics.layouts.shift();
    }
  }

  /**
   * Record label placement
   */
  recordLabelPlacement(collisions: number, total: number) {
    this.metrics.labels.push({
      collisions,
      total,
      timestamp: Date.now()
    });
    
    if (this.metrics.labels.length > 100) {
      this.metrics.labels.shift();
    }
  }

  /**
   * Record generation time
   */
  recordGenerationTime(duration: number) {
    this.metrics.generationTimes.push({
      duration,
      timestamp: Date.now()
    });
    
    if (this.metrics.generationTimes.length > 100) {
      this.metrics.generationTimes.shift();
    }
  }

  /**
   * Get current quality metrics
   */
  getMetrics(): QualityMetrics {
    const alerts: QualityMetrics['alerts'] = [];
    
    // Calculate specification pass rate
    const specValidations = this.metrics.specValidations;
    const specificationPassRate = specValidations.length > 0
      ? (specValidations.filter(s => s.passed).length / specValidations.length) * 100
      : 100;
    
    if (specificationPassRate < this.thresholds.specificationPassRate) {
      alerts.push({
        type: 'warning',
        metric: 'Specification Pass Rate',
        threshold: this.thresholds.specificationPassRate,
        actual: specificationPassRate,
        message: `Specification pass rate (${specificationPassRate.toFixed(1)}%) below threshold (${this.thresholds.specificationPassRate}%)`
      });
    }
    
    // Calculate layout success rate
    const layouts = this.metrics.layouts;
    const layoutSuccessRate = layouts.length > 0
      ? (layouts.filter(l => l.success).length / layouts.length) * 100
      : 100;
    
    if (layoutSuccessRate < this.thresholds.layoutSuccessRate) {
      alerts.push({
        type: 'error',
        metric: 'Layout Success Rate',
        threshold: this.thresholds.layoutSuccessRate,
        actual: layoutSuccessRate,
        message: `Layout success rate (${layoutSuccessRate.toFixed(1)}%) below threshold (${this.thresholds.layoutSuccessRate}%)`
      });
    }
    
    // Calculate average overlap count
    const averageOverlapCount = layouts.length > 0
      ? layouts.reduce((sum, l) => sum + l.overlapCount, 0) / layouts.length
      : 0;
    
    if (averageOverlapCount > this.thresholds.averageOverlapCount) {
      alerts.push({
        type: 'error',
        metric: 'Average Overlap Count',
        threshold: this.thresholds.averageOverlapCount,
        actual: averageOverlapCount,
        message: `Average overlap count (${averageOverlapCount.toFixed(2)}) exceeds threshold (${this.thresholds.averageOverlapCount})`
      });
    }
    
    // Calculate average adjacency score
    const averageAdjacencyScore = layouts.length > 0
      ? layouts.reduce((sum, l) => sum + (l.scoreBreakdown?.adjacencySatisfaction || 0), 0) / layouts.length
      : 0;
    
    if (averageAdjacencyScore < this.thresholds.averageAdjacencyScore) {
      alerts.push({
        type: 'warning',
        metric: 'Adjacency Score',
        threshold: this.thresholds.averageAdjacencyScore,
        actual: averageAdjacencyScore,
        message: `Average adjacency score (${averageAdjacencyScore.toFixed(1)}) below threshold (${this.thresholds.averageAdjacencyScore})`
      });
    }
    
    // Calculate label collision rate
    const labels = this.metrics.labels;
    const averageLabelCollisionRate = labels.length > 0
      ? labels.reduce((sum, l) => sum + (l.collisions / l.total) * 100, 0) / labels.length
      : 0;
    
    if (averageLabelCollisionRate > this.thresholds.labelCollisionRate) {
      alerts.push({
        type: 'warning',
        metric: 'Label Collision Rate',
        threshold: this.thresholds.labelCollisionRate,
        actual: averageLabelCollisionRate,
        message: `Label collision rate (${averageLabelCollisionRate.toFixed(1)}%) exceeds threshold (${this.thresholds.labelCollisionRate}%)`
      });
    }
    
    // Calculate average generation time
    const times = this.metrics.generationTimes;
    const averageGenerationTime = times.length > 0
      ? times.reduce((sum, t) => sum + t.duration, 0) / times.length / 1000
      : 0;
    
    // Calculate P95 generation time
    const sortedTimes = [...times].sort((a, b) => a.duration - b.duration);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95Time = sortedTimes.length > 0 ? sortedTimes[p95Index]?.duration || 0 : 0;
    
    if (p95Time > this.thresholds.generationTimeP95) {
      alerts.push({
        type: 'info',
        metric: 'Generation Time P95',
        threshold: this.thresholds.generationTimeP95 / 1000,
        actual: p95Time / 1000,
        message: `P95 generation time (${(p95Time / 1000).toFixed(1)}s) exceeds threshold (${this.thresholds.generationTimeP95 / 1000}s)`
      });
    }
    
    // Calculate score breakdown
    const scoreBreakdown = layouts.length > 0 ? {
      areaCompliance: layouts.reduce((sum, l) => sum + (l.scoreBreakdown?.areaCompliance || 0), 0) / layouts.length,
      adjacencySatisfaction: layouts.reduce((sum, l) => sum + (l.scoreBreakdown?.adjacencySatisfaction || 0), 0) / layouts.length,
      compactness: layouts.reduce((sum, l) => sum + (l.scoreBreakdown?.compactness || 0), 0) / layouts.length,
      alignment: layouts.reduce((sum, l) => sum + (l.scoreBreakdown?.alignment || 0), 0) / layouts.length,
      naturalLight: layouts.reduce((sum, l) => sum + (l.scoreBreakdown?.naturalLight || 0), 0) / layouts.length
    } : {
      areaCompliance: 0,
      adjacencySatisfaction: 0,
      compactness: 0,
      alignment: 0,
      naturalLight: 0
    };
    
    // Calculate average optimization iterations
    const averageOptimizationIterations = layouts.length > 0
      ? layouts.reduce((sum, l) => sum + l.iterations, 0) / layouts.length
      : 0;
    
    // Calculate average quality score
    const averageQualityScore = layouts.length > 0
      ? layouts.reduce((sum, l) => sum + l.score, 0) / layouts.length
      : 0;
    
    return {
      specificationPassRate,
      layoutSuccessRate,
      averageGenerationTime,
      averageOverlapCount,
      averageAdjacencyScore,
      averageLabelCollisionRate,
      averageOptimizationIterations,
      averageQualityScore,
      scoreBreakdown,
      alerts
    };
  }

  /**
   * Generate dashboard report
   */
  generateReport(): string {
    const metrics = this.getMetrics();
    
    let report = '=== Floor Plan Generation Quality Dashboard ===\n\n';
    
    report += '📊 GENERATION METRICS\n';
    report += `Specification Pass Rate: ${metrics.specificationPassRate.toFixed(1)}%\n`;
    report += `Layout Success Rate: ${metrics.layoutSuccessRate.toFixed(1)}%\n`;
    report += `Average Generation Time: ${metrics.averageGenerationTime.toFixed(2)}s\n\n`;
    
    report += '🎯 QUALITY METRICS\n';
    report += `Average Overlap Count: ${metrics.averageOverlapCount.toFixed(2)}\n`;
    report += `Average Adjacency Score: ${metrics.averageAdjacencyScore.toFixed(1)}\n`;
    report += `Label Collision Rate: ${metrics.averageLabelCollisionRate.toFixed(1)}%\n`;
    report += `Average Quality Score: ${metrics.averageQualityScore.toFixed(1)}/100\n\n`;
    
    report += '⚙️ OPTIMIZATION METRICS\n';
    report += `Average Iterations: ${metrics.averageOptimizationIterations.toFixed(0)}\n\n`;
    
    report += '📈 SCORE BREAKDOWN\n';
    report += `  Area Compliance: ${metrics.scoreBreakdown.areaCompliance.toFixed(1)}\n`;
    report += `  Adjacency Satisfaction: ${metrics.scoreBreakdown.adjacencySatisfaction.toFixed(1)}\n`;
    report += `  Compactness: ${metrics.scoreBreakdown.compactness.toFixed(1)}\n`;
    report += `  Alignment: ${metrics.scoreBreakdown.alignment.toFixed(1)}\n`;
    report += `  Natural Light: ${metrics.scoreBreakdown.naturalLight.toFixed(1)}\n\n`;
    
    if (metrics.alerts.length > 0) {
      report += '⚠️ ALERTS\n';
      metrics.alerts.forEach(alert => {
        const icon = alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
        report += `${icon} [${alert.type.toUpperCase()}] ${alert.message}\n`;
      });
      report += '\n';
    } else {
      report += '✅ All metrics within acceptable thresholds\n\n';
    }
    
    return report;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      specValidations: [],
      layouts: [],
      labels: [],
      generationTimes: []
    };
  }

  /**
   * Get metrics for specific time window (in milliseconds)
   */
  getMetricsForWindow(windowMs: number): QualityMetrics {
    const cutoff = Date.now() - windowMs;
    
    // Filter metrics within time window
    const originalMetrics = { ...this.metrics };
    
    this.metrics.specValidations = this.metrics.specValidations.filter(m => m.timestamp >= cutoff);
    this.metrics.layouts = this.metrics.layouts.filter(m => m.timestamp >= cutoff);
    this.metrics.labels = this.metrics.labels.filter(m => m.timestamp >= cutoff);
    this.metrics.generationTimes = this.metrics.generationTimes.filter(m => m.timestamp >= cutoff);
    
    const windowMetrics = this.getMetrics();
    
    // Restore original metrics
    this.metrics = originalMetrics;
    
    return windowMetrics;
  }
}

export const qualityMetricsDashboard = new QualityMetricsDashboard();
