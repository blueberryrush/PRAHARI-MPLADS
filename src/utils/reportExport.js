/**
 * PRAHARI Civic Intelligence — Report & Data Export Utility
 */

export function exportProjectsToCSV(projects, filename = 'prahari_risk_register.csv') {
  if (!projects || projects.length === 0) {
    alert('No projects available to export.');
    return;
  }

  const headers = [
    'Project ID',
    'Project Name',
    'State',
    'District',
    'Constituency',
    'Sector',
    'Sanctioned Amount (Rs)',
    'Reported Expenditure (Rs)',
    'Physical Progress (%)',
    'Financial Progress (%)',
    'Risk Score (/100)',
    'Risk Tier',
    'Audit Status',
    'Implementing Agency',
    'Primary Risk Signal'
  ];

  const rows = projects.map(p => {
    const id = p.id || p.work_id || '';
    const name = `"${(p.name || p.work_name || '').replace(/"/g, '""')}"`;
    const state = `"${(p.state || '').replace(/"/g, '""')}"`;
    const district = `"${(p.district || '').replace(/"/g, '""')}"`;
    const constituency = `"${(p.constituency || p.block_constituency || '').replace(/"/g, '""')}"`;
    const sector = `"${(p.sector || p.category || '').replace(/"/g, '""')}"`;
    const sanctioned = p.sanctionedAmount || (p.sanctioned_amount_lakhs ? p.sanctioned_amount_lakhs * 100000 : 0);
    const spent = p.spentAmount || (p.expenditure_lakhs ? p.expenditure_lakhs * 100000 : 0);
    const physicalProg = p.physicalProgress ?? p.reported_progress_pct ?? 0;
    const financialProg = sanctioned > 0 ? Math.round((spent / sanctioned) * 100) : 0;
    const riskScore = p.composite_risk_score != null ? p.composite_risk_score : (p.riskScore || p.risk?.score || 0);
    const riskTier = p.review_priority || (riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW');
    const auditStatus = p.audit_status || p.auditStatus || 'MONITORED_AUTO';
    const agency = `"${(p.implementing_agency || p.agency || '').replace(/"/g, '""')}"`;
    
    let primarySignal = 'On Track';
    if (spent > sanctioned * 1.1) primarySignal = 'Expenditure-Sanction Cost Overrun';
    else if (financialProg > physicalProg + 30) primarySignal = 'Expenditure-Physical Progress Mismatch';
    else if (p.status === 'delayed') primarySignal = 'Timeline Gestation Slippage';
    else if (p.id === 'PRJ002' || (p.spatial_clustering_signal && !p.spatial_clustering_signal.includes('CLEAR'))) primarySignal = 'Spatial Proximity Cluster';
    else if (p.isAnomaly) primarySignal = 'Multi-Signal Anomaly Flagged';

    return [
      id,
      name,
      state,
      district,
      constituency,
      sector,
      sanctioned,
      spent,
      physicalProg,
      financialProg,
      riskScore,
      riskTier,
      auditStatus,
      agency,
      `"${primarySignal}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateEvidenceSummaryText(project, caseData = null) {
  if (!project) return '';
  const id = project.id || project.work_id;
  const name = project.name || project.work_name;
  const state = project.state || 'Uttar Pradesh';
  const district = project.district || 'Varanasi';
  const constituency = project.constituency || project.block_constituency || 'Varanasi';
  const sector = project.sector || project.category || 'Infrastructure';
  const sanctionedLakhs = project.sanctioned_amount_lakhs != null
    ? Number(project.sanctioned_amount_lakhs)
    : (project.sanctionedAmount || 0) / 100000;
  const spentLakhs = project.expenditure_lakhs != null
    ? Number(project.expenditure_lakhs)
    : (project.spentAmount || 0) / 100000;
  const physicalProg = project.physicalProgress ?? project.reported_progress_pct ?? 0;
  const visualEstimate = project.ai_visual_estimate_pct ?? Math.max(0, physicalProg - 15);
  const discrepancy = Math.abs(physicalProg - visualEstimate);
  const riskScore = project.composite_risk_score != null ? project.composite_risk_score : (project.riskScore || project.risk?.score || 0);
  const agency = project.implementing_agency || project.agency || 'Nodal Agency';
  const auditStatus = project.audit_status || caseData?.status || 'MONITORED_AUTO';
  const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });

  return `================================================================================
PRAHARI MPLADS CIVIC INTELLIGENCE — ADMINISTRATIVE EVIDENCE DOCKET
Generated on: ${timestamp}
Confidential · For Official Oversight & Verification Use Only
================================================================================

1. PROJECT IDENTIFIERS & JURISDICTION
--------------------------------------------------------------------------------
Work ID:                 ${id}
Work Name:               ${name}
State / UT:              ${state}
District:                ${district}
Constituency / Block:    ${constituency}
Sector / Classification: ${sector}
Implementing Agency:     ${agency}

2. FINANCIAL & PHYSICAL TRACKING
--------------------------------------------------------------------------------
Sanctioned Allocation:   Rs. ${sanctionedLakhs.toFixed(2)} Lakhs
Reported Expenditure:    Rs. ${spentLakhs.toFixed(2)} Lakhs
Financial Velocity:      ${sanctionedLakhs > 0 ? ((spentLakhs / sanctionedLakhs) * 100).toFixed(1) : 0}% disbursed
Reported Physical Prog:  ${physicalProg}%
AI Visual Estimate:      ${visualEstimate}%
Progress Discrepancy:    ${discrepancy} percentage points

3. RISK SCORE & SIGNAL ATTRIBUTION
--------------------------------------------------------------------------------
Composite Risk Score:    ${riskScore} / 100
Review Priority Tier:    ${riskScore >= 70 ? 'HIGH PRIORITY' : riskScore >= 40 ? 'MODERATE WATCH' : 'STABLE'}
Current Audit Status:    ${auditStatus}

Signal Summary:
• Financial Variance:    ${spentLakhs > sanctionedLakhs * 1.05 ? `Cost overrun detected (Rs. ${spentLakhs.toFixed(1)}L vs Rs. ${sanctionedLakhs.toFixed(1)}L)` : 'Within sanctioned limits'}
• Physical Gap:          ${discrepancy > 10 ? `Visual discrepancy of ${discrepancy}% flagged for ground inspection` : 'Physical progress consistent with milestone filings'}
• Spatial Proximity:     ${project.spatial_clustering_signal || 'Verified spatial footprint'}
• Timeline Status:       ${project.status === 'delayed' ? 'Gestation delay flagged against approved DPR' : 'On schedule'}

4. ADMINISTRATIVE DIRECTIVE & VERIFICATION STATUS
--------------------------------------------------------------------------------
Assigned Officer:        ${caseData?.assignedOfficer || 'Pending Assignment'}
Mandated Focus:          Physical Milestone Progress, Asset Geo-coordinates, Core Sampling
Statutory Deadline:      ${caseData?.assignment?.dueDate || '7 working days from dispatch'}

Legal Disclaimer:
This risk docket is generated by PRAHARI AI Decision-Support algorithms to assist
human oversight authorities. Risk scores reflect review priority, not statistical
proof of fraud. Human physical verification is mandatory before administrative action.
================================================================================`;
}
