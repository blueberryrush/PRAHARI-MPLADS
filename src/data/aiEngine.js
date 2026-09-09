// AI/ML Engine - Simulated algorithms for MPLADS anomaly detection
import { projects, agencies, benchmarks } from './mockData.js';

// ============================================================
// 1. ANOMALY DETECTION (Z-Score Based)
// ============================================================
export function detectAnomalies(projectList = projects) {
  const costs = projectList.map(p => p.spentAmount / p.sanctionedAmount);
  const mean = costs.reduce((a, b) => a + b, 0) / costs.length;
  const stdDev = Math.sqrt(costs.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / costs.length);

  return projectList.map(p => {
    const ratio = p.spentAmount / p.sanctionedAmount;
    const zScore = (ratio - mean) / stdDev;
    const isAnomaly = Math.abs(zScore) > 1.5;
    const severity = Math.abs(zScore) > 3 ? 'critical' : Math.abs(zScore) > 2 ? 'high' : Math.abs(zScore) > 1.5 ? 'medium' : 'low';
    return { ...p, zScore: Number(zScore.toFixed(2)), isDetectedAnomaly: isAnomaly, severity, costRatio: Number((ratio * 100).toFixed(1)) };
  });
}

// ============================================================
// 2. DUPLICATE DETECTION (Levenshtein + Feature Matching)
// ============================================================
function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function nameSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

function featureSimilarity(pA, pB) {
  let score = 0;
  let weights = 0;

  // Same sector (weight: 3)
  if (pA.sector === pB.sector) { score += 3; } weights += 3;
  // Same state (weight: 2)
  if (pA.state === pB.state) { score += 2; } weights += 2;
  // Same district (weight: 2)
  if (pA.district === pB.district) { score += 2; } weights += 2;
  // Same agency (weight: 1.5)
  if (pA.agency === pB.agency) { score += 1.5; } weights += 1.5;
  // Similar cost (within 20%)
  const costDiff = Math.abs(pA.sanctionedAmount - pB.sanctionedAmount) / Math.max(pA.sanctionedAmount, pB.sanctionedAmount);
  if (costDiff < 0.2) { score += 2; } weights += 2;
  // Similar timeline
  const timeA = new Date(pA.expectedCompletion) - new Date(pA.startDate);
  const timeB = new Date(pB.expectedCompletion) - new Date(pB.startDate);
  const timeDiff = Math.abs(timeA - timeB) / Math.max(timeA, timeB);
  if (timeDiff < 0.2) { score += 1.5; } weights += 1.5;

  return score / weights;
}

export function detectDuplicates(projectList = projects, threshold = 0.65) {
  const duplicates = [];
  for (let i = 0; i < projectList.length; i++) {
    for (let j = i + 1; j < projectList.length; j++) {
      const nameScore = nameSimilarity(projectList[i].name, projectList[j].name);
      const featureScore = featureSimilarity(projectList[i], projectList[j]);
      const combinedScore = nameScore * 0.4 + featureScore * 0.6;

      if (combinedScore >= threshold) {
        duplicates.push({
          projectA: projectList[i],
          projectB: projectList[j],
          nameScore: Number((nameScore * 100).toFixed(1)),
          featureScore: Number((featureScore * 100).toFixed(1)),
          combinedScore: Number((combinedScore * 100).toFixed(1)),
          isCrossConstituency: projectList[i].constituency !== projectList[j].constituency,
        });
      }
    }
  }
  return duplicates.sort((a, b) => b.combinedScore - a.combinedScore);
}

// ============================================================
// 3. RISK SCORING (Multi-factor weighted)
// ============================================================
export function calculateRiskScore(project) {
  let score = 0;
  const factors = [];

  // Cost variance (weight: 30)
  const costVariance = (project.spentAmount - project.sanctionedAmount) / project.sanctionedAmount;
  if (costVariance > 0.5) { score += 30; factors.push(`Cost overrun: ${(costVariance * 100).toFixed(0)}%`); }
  else if (costVariance > 0.3) { score += 20; factors.push(`Cost overrun: ${(costVariance * 100).toFixed(0)}%`); }
  else if (costVariance > 0.1) { score += 10; factors.push(`Minor cost overrun: ${(costVariance * 100).toFixed(0)}%`); }

  // Progress mismatch (weight: 25)
  const progressGap = project.financialProgress - project.physicalProgress;
  if (progressGap > 80) { score += 25; factors.push(`Progress mismatch: Financial ${project.financialProgress}% vs Physical ${project.physicalProgress}%`); }
  else if (progressGap > 50) { score += 18; factors.push(`Progress gap: ${progressGap}%`); }
  else if (progressGap > 30) { score += 10; factors.push(`Minor progress gap: ${progressGap}%`); }

  // Timeline delay (weight: 20)
  if (project.status === 'delayed') {
    const expected = new Date(project.expectedCompletion);
    const now = new Date();
    const delayDays = Math.floor((now - expected) / (1000 * 60 * 60 * 24));
    if (delayDays > 180) { score += 20; factors.push(`Severely delayed: ${delayDays} days`); }
    else if (delayDays > 90) { score += 15; factors.push(`Significantly delayed: ${delayDays} days`); }
    else if (delayDays > 30) { score += 10; factors.push(`Delayed: ${delayDays} days`); }
    else { score += 5; factors.push(`Slightly delayed`); }
  }

  // Agency history (weight: 15)
  const agency = agencies.find(a => a.id === project.agency);
  if (agency) {
    if (agency.riskScore > 70) { score += 15; factors.push(`High-risk agency: ${agency.name}`); }
    else if (agency.riskScore > 50) { score += 10; factors.push(`Medium-risk agency: ${agency.name}`); }
    else if (agency.riskScore > 30) { score += 5; factors.push(`Low-risk agency`); }
  }

  // Anomaly flag (weight: 10)
  if (project.isAnomaly) { score += 10; factors.push('Pre-flagged anomaly'); }

  const level = score >= 70 ? 'critical' : score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low';
  return { score: Math.min(score, 100), level, factors };
}

// ============================================================
// 4. COMPARISON ENGINE (Benchmark deviation detection)
// ============================================================
export function compareProjects(projectA, projectB) {
  const costDiff = ((projectB.spentAmount - projectA.spentAmount) / projectA.spentAmount * 100);
  const timeA = projectA.actualCompletion
    ? (new Date(projectA.actualCompletion) - new Date(projectA.startDate)) / (1000 * 60 * 60 * 24 * 30)
    : (new Date(projectA.expectedCompletion) - new Date(projectA.startDate)) / (1000 * 60 * 60 * 24 * 30);
  const timeB = projectB.actualCompletion
    ? (new Date(projectB.actualCompletion) - new Date(projectB.startDate)) / (1000 * 60 * 60 * 24 * 30)
    : (new Date() - new Date(projectB.startDate)) / (1000 * 60 * 60 * 24 * 30);
  const timeDiff = ((timeB - timeA) / timeA * 100);

  const benchmark = benchmarks[projectA.sector] || { costThreshold: 0.4, timeThreshold: 0.5 };
  const costRedFlag = Math.abs(costDiff) > benchmark.costThreshold * 100;
  const timeRedFlag = Math.abs(timeDiff) > benchmark.timeThreshold * 100;
  const isRedFlag = costRedFlag || timeRedFlag;

  return {
    projectA,
    projectB,
    costDiff: Number(costDiff.toFixed(1)),
    timeDiff: Number(timeDiff.toFixed(1)),
    timeAMonths: Number(timeA.toFixed(1)),
    timeBMonths: Number(timeB.toFixed(1)),
    costRedFlag,
    timeRedFlag,
    isRedFlag,
    reasons: [
      ...(costRedFlag ? [`Cost deviation of ${costDiff.toFixed(1)}% exceeds ${(benchmark.costThreshold * 100)}% threshold`] : []),
      ...(timeRedFlag ? [`Time deviation of ${timeDiff.toFixed(1)}% exceeds ${(benchmark.timeThreshold * 100)}% threshold`] : []),
    ],
  };
}

export function findRedFlagScenarios(projectList = projects) {
  const scenarios = [];
  const grouped = {};

  // Group projects by sector
  projectList.forEach(p => {
    if (!grouped[p.sector]) grouped[p.sector] = [];
    grouped[p.sector].push(p);
  });

  // Compare within groups
  Object.keys(grouped).forEach(sector => {
    const group = grouped[sector];
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        // Only compare if costs are in similar range (within 50% of each other)
        const costRatio = Math.min(group[i].sanctionedAmount, group[j].sanctionedAmount) / Math.max(group[i].sanctionedAmount, group[j].sanctionedAmount);
        if (costRatio >= 0.5) {
          const comparison = compareProjects(group[i], group[j]);
          if (comparison.isRedFlag) {
            scenarios.push(comparison);
          }
        }
      }
    }
  });

  return scenarios.sort((a, b) => Math.abs(b.costDiff) + Math.abs(b.timeDiff) - Math.abs(a.costDiff) - Math.abs(a.timeDiff));
}

// ============================================================
// 5. AGENCY PROFILING (Composite score)
// ============================================================
export function profileAgency(agencyId) {
  const agency = agencies.find(a => a.id === agencyId);
  if (!agency) return null;

  const agencyProjects = projects.filter(p => p.agency === agencyId);
  const completed = agencyProjects.filter(p => p.status === 'completed');
  const delayed = agencyProjects.filter(p => p.status === 'delayed');
  const anomalous = agencyProjects.filter(p => p.isAnomaly);

  const avgCostDeviation = agencyProjects.reduce((sum, p) => {
    return sum + Math.abs((p.spentAmount - p.sanctionedAmount) / p.sanctionedAmount);
  }, 0) / (agencyProjects.length || 1);

  const shouldRedFlag = agency.riskScore >= 70 || agency.redFlags >= 5 || delayed.length > agencyProjects.length * 0.5;

  const recommendation = shouldRedFlag
    ? `🚩 RED FLAG RECOMMENDED: ${agency.name} shows ${agency.redFlags} red flags, ${agency.riskScore}% risk score, and ${delayed.length}/${agencyProjects.length} delayed projects. Immediate review required.`
    : agency.riskScore >= 40
      ? `⚠️ MONITOR CLOSELY: ${agency.name} has elevated risk indicators. ${agency.redFlags} red flags. Performance trend is ${agency.trend[5] > agency.trend[0] ? 'improving' : 'declining'}.`
      : `✅ CLEARED: ${agency.name} is performing within acceptable parameters. ${agency.redFlags} minor flags. Eligible for new project assignments.`;

  return {
    ...agency,
    projects: agencyProjects,
    completedCount: completed.length,
    delayedCount: delayed.length,
    anomalousCount: anomalous.length,
    avgCostDeviation: Number((avgCostDeviation * 100).toFixed(1)),
    shouldRedFlag,
    recommendation,
  };
}

// ============================================================
// 6. BOTTLENECK PREDICTION (Trend extrapolation)
// ============================================================
export function predictBottlenecks(projectList = projects) {
  return projectList
    .filter(p => p.status === 'in_progress' || p.status === 'delayed')
    .map(p => {
      const startDate = new Date(p.startDate);
      const expectedEnd = new Date(p.expectedCompletion);
      const now = new Date();
      const totalDuration = expectedEnd - startDate;
      const elapsed = now - startDate;
      const elapsedRatio = elapsed / totalDuration;
      const expectedProgress = Math.min(elapsedRatio * 100, 100);
      const progressGap = expectedProgress - p.physicalProgress;

      let riskLevel = 'on_track';
      let predictedDelayDays = 0;

      if (progressGap > 40) {
        riskLevel = 'critical';
        predictedDelayDays = Math.round((progressGap / 100) * (totalDuration / (1000 * 60 * 60 * 24)) * 1.5);
      } else if (progressGap > 20) {
        riskLevel = 'at_risk';
        predictedDelayDays = Math.round((progressGap / 100) * (totalDuration / (1000 * 60 * 60 * 24)));
      } else if (progressGap > 5) {
        riskLevel = 'at_risk';
        predictedDelayDays = Math.round((progressGap / 100) * (totalDuration / (1000 * 60 * 60 * 24)) * 0.5);
      }

      if (p.status === 'delayed') {
        riskLevel = 'critical';
        predictedDelayDays = Math.max(predictedDelayDays, 30);
      }

      return {
        ...p,
        expectedProgress: Number(expectedProgress.toFixed(1)),
        progressGap: Number(progressGap.toFixed(1)),
        riskLevel,
        predictedDelayDays,
        probability: riskLevel === 'critical' ? 0.85 : riskLevel === 'at_risk' ? 0.6 : 0.2,
      };
    })
    .sort((a, b) => b.predictedDelayDays - a.predictedDelayDays);
}

// ============================================================
// 7. SUMMARY STATISTICS
// ============================================================
export function getDashboardStats(projectList = projects) {
  const total = projectList.length;
  const completed = projectList.filter(p => p.status === 'completed').length;
  const delayed = projectList.filter(p => p.status === 'delayed').length;
  const inProgress = projectList.filter(p => p.status === 'in_progress').length;
  const redFlagged = projectList.filter(p => p.isAnomaly).length;

  const totalSanctioned = projectList.reduce((sum, p) => sum + p.sanctionedAmount, 0);
  const totalSpent = projectList.reduce((sum, p) => sum + p.spentAmount, 0);
  const utilizationRate = (totalSpent / totalSanctioned * 100);

  return {
    totalProjects: total,
    completedProjects: completed,
    delayedProjects: delayed,
    inProgressProjects: inProgress,
    redFlagged,
    completionRate: Number((completed / total * 100).toFixed(1)),
    totalSanctioned,
    totalSpent,
    utilizationRate: Number(utilizationRate.toFixed(1)),
  };
}

// Sector-wise breakdown
export function getSectorBreakdown(projectList = projects) {
  const sectorMap = {};
  projectList.forEach(p => {
    if (!sectorMap[p.sector]) {
      sectorMap[p.sector] = { count: 0, totalSanctioned: 0, totalSpent: 0, completed: 0, delayed: 0 };
    }
    sectorMap[p.sector].count++;
    sectorMap[p.sector].totalSanctioned += p.sanctionedAmount;
    sectorMap[p.sector].totalSpent += p.spentAmount;
    if (p.status === 'completed') sectorMap[p.sector].completed++;
    if (p.status === 'delayed') sectorMap[p.sector].delayed++;
  });
  return Object.entries(sectorMap).map(([sector, data]) => ({ sector, ...data }));
}
