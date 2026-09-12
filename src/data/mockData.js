// Comprehensive mock data for MPLADS Dashboard prototype

export const states = [
  'Uttar Pradesh', 'Maharashtra', 'Bihar', 'Madhya Pradesh', 'Rajasthan',
  'Tamil Nadu', 'Karnataka', 'Gujarat', 'West Bengal', 'Odisha',
];

export const sectors = [
  'Roads & Bridges', 'Drinking Water', 'Education', 'Health',
  'Sanitation', 'Community Hall', 'Electrification', 'Irrigation',
  'Sports Infrastructure', 'Digital Infrastructure',
];

export const constituencies = [
  { name: 'Ghaziabad', state: 'Uttar Pradesh', district: 'Ghaziabad' },
  { name: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi' },
  { name: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' },
  { name: 'Mumbai North', state: 'Maharashtra', district: 'Mumbai' },
  { name: 'Pune', state: 'Maharashtra', district: 'Pune' },
  { name: 'Patna Sahib', state: 'Bihar', district: 'Patna' },
  { name: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  { name: 'Jaipur', state: 'Rajasthan', district: 'Jaipur' },
  { name: 'Chennai South', state: 'Tamil Nadu', district: 'Chennai' },
  { name: 'Bangalore South', state: 'Karnataka', district: 'Bangalore' },
  { name: 'Ahmedabad East', state: 'Gujarat', district: 'Ahmedabad' },
  { name: 'Kolkata North', state: 'West Bengal', district: 'Kolkata' },
  { name: 'Bhubaneswar', state: 'Odisha', district: 'Khordha' },
];

export const constituencyCoords = {
  'Ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'Varanasi': { lat: 25.3176, lng: 82.9739 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Mumbai North': { lat: 19.0760, lng: 72.8777 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Patna Sahib': { lat: 25.5941, lng: 85.1376 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Chennai South': { lat: 13.0827, lng: 80.2707 },
  'Bangalore South': { lat: 12.9716, lng: 77.5946 },
  'Ahmedabad East': { lat: 23.0225, lng: 72.5714 },
  'Kolkata North': { lat: 22.5726, lng: 88.3639 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
};

export const agencies = [
  { id: 'AG001', name: 'National Highways Construction Corp', type: 'Central PSU', riskScore: 18, totalProjects: 34, onTimeRate: 91, withinBudgetRate: 88, qualityScore: 92, redFlags: 0, status: 'low', trend: [85,87,89,90,91,92], history: ['Excellent track record', 'ISO certified', 'No complaints'] },
  { id: 'AG002', name: 'State PWD - Uttar Pradesh', type: 'State Dept', riskScore: 42, totalProjects: 67, onTimeRate: 72, withinBudgetRate: 65, qualityScore: 71, redFlags: 3, status: 'medium', trend: [78,75,73,71,72,70], history: ['3 delayed projects in 2024', 'Budget overrun in Varanasi bridge', 'Under investigation for material quality'] },
  { id: 'AG003', name: 'Rural Development Agency - Bihar', type: 'State Agency', riskScore: 73, totalProjects: 45, onTimeRate: 52, withinBudgetRate: 48, qualityScore: 55, redFlags: 7, status: 'high', trend: [65,62,58,55,53,52], history: ['Multiple cost overruns', 'Poor quality reports', 'Delayed 7 projects beyond deadline', 'Red flagged twice in 2023', 'Under CAG audit'] },
  { id: 'AG004', name: 'Municipal Corp - Mumbai', type: 'Municipal Body', riskScore: 25, totalProjects: 28, onTimeRate: 85, withinBudgetRate: 82, qualityScore: 87, redFlags: 1, status: 'low', trend: [80,82,84,85,86,87], history: ['Generally reliable', 'One minor compliance issue in 2023'] },
  { id: 'AG005', name: 'District Rural Dev. Agency - MP', type: 'District Agency', riskScore: 56, totalProjects: 38, onTimeRate: 63, withinBudgetRate: 60, qualityScore: 65, redFlags: 4, status: 'medium', trend: [70,68,65,64,63,62], history: ['Declining performance trend', 'Fund diversion allegations', '4 red flags in last 2 years'] },
  { id: 'AG006', name: 'Rajasthan Construction Corp', type: 'State PSU', riskScore: 31, totalProjects: 22, onTimeRate: 81, withinBudgetRate: 78, qualityScore: 80, redFlags: 1, status: 'low', trend: [76,77,79,80,81,82], history: ['Improving performance', 'One delayed project resolved'] },
  { id: 'AG007', name: 'Tamil Nadu Housing Board', type: 'State Board', riskScore: 22, totalProjects: 31, onTimeRate: 88, withinBudgetRate: 85, qualityScore: 89, redFlags: 0, status: 'low', trend: [83,85,86,87,88,89], history: ['Consistent high performer', 'Award winning agency'] },
  { id: 'AG008', name: 'Karnataka Rural Infrastructure', type: 'State Agency', riskScore: 38, totalProjects: 25, onTimeRate: 76, withinBudgetRate: 73, qualityScore: 75, redFlags: 2, status: 'medium', trend: [72,73,74,75,76,76], history: ['Two budget overruns in 2024', 'Generally satisfactory'] },
  { id: 'AG009', name: 'Gujarat Water Supply Board', type: 'State Board', riskScore: 20, totalProjects: 19, onTimeRate: 89, withinBudgetRate: 90, qualityScore: 91, redFlags: 0, status: 'low', trend: [86,87,88,89,90,91], history: ['Model agency', 'Zero complaints', 'Ahead of schedule'] },
  { id: 'AG010', name: 'West Bengal PWD', type: 'State Dept', riskScore: 48, totalProjects: 42, onTimeRate: 68, withinBudgetRate: 62, qualityScore: 67, redFlags: 3, status: 'medium', trend: [72,70,69,68,67,66], history: ['Declining performance', '3 projects under quality review', 'Staff shortage reported'] },
  { id: 'AG011', name: 'Odisha Works Department', type: 'State Dept', riskScore: 35, totalProjects: 20, onTimeRate: 80, withinBudgetRate: 77, qualityScore: 78, redFlags: 1, status: 'low', trend: [75,76,77,78,79,80], history: ['Steady improvement', 'One minor delay'] },
  { id: 'AG012', name: 'Sunrise Constructions Pvt Ltd', type: 'Private', riskScore: 85, totalProjects: 15, onTimeRate: 40, withinBudgetRate: 35, qualityScore: 42, redFlags: 9, status: 'critical', trend: [55,50,48,45,42,40], history: ['Multiple fraud allegations', 'Ghost projects reported', 'Blacklisted in 2 states', 'Under CBI investigation', 'Funds misappropriation', '9 red flags in 18 months'] },
  { id: 'AG013', name: 'Golden Infrastructure Ltd', type: 'Private', riskScore: 78, totalProjects: 12, onTimeRate: 45, withinBudgetRate: 40, qualityScore: 48, redFlags: 6, status: 'high', trend: [58,55,52,50,47,45], history: ['Cost overruns exceeding 60%', 'Poor material quality detected', 'Substandard work in 4 projects', 'Shell company links suspected'] },
  { id: 'AG014', name: 'Bharat Construction Services', type: 'Private', riskScore: 29, totalProjects: 18, onTimeRate: 83, withinBudgetRate: 80, qualityScore: 84, redFlags: 1, status: 'low', trend: [79,80,81,82,83,84], history: ['Reliable contractor', 'Good quality reports'] },
  { id: 'AG015', name: 'District Engineering Cell - Rajasthan', type: 'District Agency', riskScore: 44, totalProjects: 16, onTimeRate: 69, withinBudgetRate: 66, qualityScore: 70, redFlags: 2, status: 'medium', trend: [73,72,71,70,69,68], history: ['Two budget overruns', 'Staffing issues reported'] },
];

const baseProjects = [
  // Roads
  { id: 'PRJ001', name: 'Village Road Construction - Varanasi Block A', sector: 'Roads & Bridges', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', agency: 'AG002', sanctionedAmount: 1200000, spentAmount: 1180000, expectedCost: 1200000, sanctionDate: '2024-01-15', startDate: '2024-02-01', expectedCompletion: '2024-08-01', actualCompletion: '2024-07-28', status: 'completed', physicalProgress: 100, financialProgress: 98, isAnomaly: false, description: 'Construction of 2km village connecting road with proper drainage' },
  { id: 'PRJ002', name: 'Village Road Construction - Varanasi Block B', sector: 'Roads & Bridges', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', agency: 'AG003', sanctionedAmount: 1200000, spentAmount: 2200000, expectedCost: 1200000, sanctionDate: '2024-01-20', startDate: '2024-03-01', expectedCompletion: '2024-09-01', actualCompletion: null, status: 'delayed', physicalProgress: 55, financialProgress: 183, isAnomaly: true, description: 'Construction of 2km village connecting road - SIMILAR CONDITIONS as PRJ001 but massive overrun' },
  { id: 'PRJ003', name: 'Bridge Repair - Lucknow Gomti', sector: 'Roads & Bridges', constituency: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', agency: 'AG002', sanctionedAmount: 2500000, spentAmount: 2700000, expectedCost: 2500000, sanctionDate: '2023-11-01', startDate: '2023-12-01', expectedCompletion: '2024-06-01', actualCompletion: '2024-08-15', status: 'completed', physicalProgress: 100, financialProgress: 108, isAnomaly: false, description: 'Repair and strengthening of pedestrian bridge over Gomti river' },
  { id: 'PRJ004', name: 'Rural Road Widening - Patna', sector: 'Roads & Bridges', constituency: 'Patna Sahib', state: 'Bihar', district: 'Patna', agency: 'AG003', sanctionedAmount: 1800000, spentAmount: 3100000, expectedCost: 1800000, sanctionDate: '2024-02-01', startDate: '2024-04-01', expectedCompletion: '2024-10-01', actualCompletion: null, status: 'delayed', physicalProgress: 38, financialProgress: 172, isAnomaly: true, description: 'Widening of 3km rural road to accommodate two-lane traffic' },
  { id: 'PRJ005', name: 'Highway Connector - Bhopal Ring Road', sector: 'Roads & Bridges', constituency: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', agency: 'AG005', sanctionedAmount: 3500000, spentAmount: 3200000, expectedCost: 3500000, sanctionDate: '2024-03-01', startDate: '2024-04-15', expectedCompletion: '2025-01-15', actualCompletion: null, status: 'in_progress', physicalProgress: 72, financialProgress: 91, isAnomaly: false, description: '4km connector road to Bhopal ring road' },

  // Drinking Water
  { id: 'PRJ006', name: 'Tube Well Installation - Varanasi Rural', sector: 'Drinking Water', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', agency: 'AG002', sanctionedAmount: 500000, spentAmount: 480000, expectedCost: 500000, sanctionDate: '2024-04-01', startDate: '2024-05-01', expectedCompletion: '2024-08-01', actualCompletion: '2024-07-20', status: 'completed', physicalProgress: 100, financialProgress: 96, isAnomaly: false, description: 'Installation of 10 tube wells in rural Varanasi villages' },
  { id: 'PRJ007', name: 'Water Pipeline - Mumbai North Ward 5', sector: 'Drinking Water', constituency: 'Mumbai North', state: 'Maharashtra', district: 'Mumbai', agency: 'AG004', sanctionedAmount: 2000000, spentAmount: 1950000, expectedCost: 2000000, sanctionDate: '2024-01-10', startDate: '2024-02-15', expectedCompletion: '2024-07-15', actualCompletion: '2024-07-10', status: 'completed', physicalProgress: 100, financialProgress: 97, isAnomaly: false, description: '5km water pipeline for Ward 5 residential area' },
  { id: 'PRJ008', name: 'Water Treatment Plant - Jaipur', sector: 'Drinking Water', constituency: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', agency: 'AG006', sanctionedAmount: 4500000, spentAmount: 4200000, expectedCost: 4500000, sanctionDate: '2023-10-01', startDate: '2023-11-15', expectedCompletion: '2024-09-15', actualCompletion: null, status: 'in_progress', physicalProgress: 85, financialProgress: 93, isAnomaly: false, description: 'Small water treatment plant for Jaipur rural' },

  // Education
  { id: 'PRJ009', name: 'Primary School Building - Pune Rural', sector: 'Education', constituency: 'Pune', state: 'Maharashtra', district: 'Pune', agency: 'AG004', sanctionedAmount: 3000000, spentAmount: 2900000, expectedCost: 3000000, sanctionDate: '2024-02-01', startDate: '2024-03-01', expectedCompletion: '2024-12-01', actualCompletion: null, status: 'in_progress', physicalProgress: 78, financialProgress: 96, isAnomaly: false, description: '4-room primary school building with toilets and playground' },
  { id: 'PRJ010', name: 'School Toilet Complex - Patna District', sector: 'Education', constituency: 'Patna Sahib', state: 'Bihar', district: 'Patna', agency: 'AG003', sanctionedAmount: 800000, spentAmount: 1400000, expectedCost: 800000, sanctionDate: '2024-03-01', startDate: '2024-05-01', expectedCompletion: '2024-09-01', actualCompletion: null, status: 'delayed', physicalProgress: 30, financialProgress: 175, isAnomaly: true, description: 'Construction of toilet complex in government school' },
  { id: 'PRJ011', name: 'Digital Learning Center - Chennai', sector: 'Education', constituency: 'Chennai South', state: 'Tamil Nadu', district: 'Chennai', agency: 'AG007', sanctionedAmount: 2500000, spentAmount: 2300000, expectedCost: 2500000, sanctionDate: '2024-01-15', startDate: '2024-02-15', expectedCompletion: '2024-08-15', actualCompletion: '2024-08-10', status: 'completed', physicalProgress: 100, financialProgress: 92, isAnomaly: false, description: 'Smart classroom with 30 computers and internet connectivity' },
  { id: 'PRJ012', name: 'Library Building - Kolkata', sector: 'Education', constituency: 'Kolkata North', state: 'West Bengal', district: 'Kolkata', agency: 'AG010', sanctionedAmount: 1500000, spentAmount: 1600000, expectedCost: 1500000, sanctionDate: '2024-04-01', startDate: '2024-06-01', expectedCompletion: '2024-12-01', actualCompletion: null, status: 'in_progress', physicalProgress: 60, financialProgress: 106, isAnomaly: false, description: 'Community library with reading hall and book storage' },

  // Health
  { id: 'PRJ013', name: 'Primary Health Center - Varanasi', sector: 'Health', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', agency: 'AG002', sanctionedAmount: 4000000, spentAmount: 3800000, expectedCost: 4000000, sanctionDate: '2023-12-01', startDate: '2024-01-15', expectedCompletion: '2024-10-15', actualCompletion: null, status: 'in_progress', physicalProgress: 82, financialProgress: 95, isAnomaly: false, description: 'Construction of primary health center with OPD and pharmacy' },
  { id: 'PRJ014', name: 'Health Sub-Center - Bhopal Rural', sector: 'Health', constituency: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', agency: 'AG012', sanctionedAmount: 1500000, spentAmount: 2800000, expectedCost: 1500000, sanctionDate: '2024-01-01', startDate: '2024-03-01', expectedCompletion: '2024-09-01', actualCompletion: null, status: 'delayed', physicalProgress: 25, financialProgress: 186, isAnomaly: true, description: 'Health sub-center in rural area — FLAGGED: contractor under investigation' },
  { id: 'PRJ015', name: 'Ambulance Station - Ahmedabad', sector: 'Health', constituency: 'Ahmedabad East', state: 'Gujarat', district: 'Ahmedabad', agency: 'AG009', sanctionedAmount: 2000000, spentAmount: 1850000, expectedCost: 2000000, sanctionDate: '2024-02-01', startDate: '2024-03-01', expectedCompletion: '2024-09-01', actualCompletion: '2024-08-20', status: 'completed', physicalProgress: 100, financialProgress: 92, isAnomaly: false, description: 'Ambulance station with parking and staff quarters' },

  // Sanitation
  { id: 'PRJ016', name: 'Community Toilet Block - Lucknow', sector: 'Sanitation', constituency: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', agency: 'AG002', sanctionedAmount: 600000, spentAmount: 580000, expectedCost: 600000, sanctionDate: '2024-05-01', startDate: '2024-06-01', expectedCompletion: '2024-10-01', actualCompletion: '2024-09-25', status: 'completed', physicalProgress: 100, financialProgress: 96, isAnomaly: false, description: '20-seat community toilet block with water supply' },
  { id: 'PRJ017', name: 'Drainage System - Patna Ward 12', sector: 'Sanitation', constituency: 'Patna Sahib', state: 'Bihar', district: 'Patna', agency: 'AG013', sanctionedAmount: 2200000, spentAmount: 3800000, expectedCost: 2200000, sanctionDate: '2024-02-15', startDate: '2024-04-15', expectedCompletion: '2024-10-15', actualCompletion: null, status: 'delayed', physicalProgress: 42, financialProgress: 172, isAnomaly: true, description: 'Underground drainage in Ward 12 - FLAGGED: massive cost overrun by Golden Infrastructure' },
  { id: 'PRJ018', name: 'Waste Management Center - Bangalore', sector: 'Sanitation', constituency: 'Bangalore South', state: 'Karnataka', district: 'Bangalore', agency: 'AG008', sanctionedAmount: 3000000, spentAmount: 2800000, expectedCost: 3000000, sanctionDate: '2024-01-01', startDate: '2024-02-01', expectedCompletion: '2024-10-01', actualCompletion: null, status: 'in_progress', physicalProgress: 88, financialProgress: 93, isAnomaly: false, description: 'Solid waste management and composting center' },

  // Community Hall
  { id: 'PRJ019', name: 'Community Hall - Jaipur Rural', sector: 'Community Hall', constituency: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', agency: 'AG006', sanctionedAmount: 2500000, spentAmount: 2400000, expectedCost: 2500000, sanctionDate: '2024-03-01', startDate: '2024-04-01', expectedCompletion: '2024-12-01', actualCompletion: null, status: 'in_progress', physicalProgress: 70, financialProgress: 96, isAnomaly: false, description: 'Multi-purpose community hall with stage and seating for 200' },
  { id: 'PRJ020', name: 'Panchayat Bhavan - Varanasi', sector: 'Community Hall', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', agency: 'AG002', sanctionedAmount: 1800000, spentAmount: 1750000, expectedCost: 1800000, sanctionDate: '2024-04-01', startDate: '2024-05-01', expectedCompletion: '2024-11-01', actualCompletion: null, status: 'in_progress', physicalProgress: 65, financialProgress: 97, isAnomaly: false, description: 'Panchayat building with meeting hall and office rooms' },

  // Electrification
  { id: 'PRJ021', name: 'Solar Street Lighting - Bhubaneswar', sector: 'Electrification', constituency: 'Bhubaneswar', state: 'Odisha', district: 'Khordha', agency: 'AG011', sanctionedAmount: 1500000, spentAmount: 1400000, expectedCost: 1500000, sanctionDate: '2024-03-15', startDate: '2024-04-15', expectedCompletion: '2024-09-15', actualCompletion: '2024-09-10', status: 'completed', physicalProgress: 100, financialProgress: 93, isAnomaly: false, description: '50 solar street lights along main village road' },
  { id: 'PRJ022', name: 'Village Electrification - MP Rural', sector: 'Electrification', constituency: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', agency: 'AG012', sanctionedAmount: 2000000, spentAmount: 3500000, expectedCost: 2000000, sanctionDate: '2024-01-01', startDate: '2024-03-01', expectedCompletion: '2024-08-01', actualCompletion: null, status: 'delayed', physicalProgress: 35, financialProgress: 175, isAnomaly: true, description: 'Rural electrification project — FLAGGED: Sunrise Constructions, known fraud agency' },

  // Irrigation
  { id: 'PRJ023', name: 'Check Dam Construction - Gujarat', sector: 'Irrigation', constituency: 'Ahmedabad East', state: 'Gujarat', district: 'Ahmedabad', agency: 'AG009', sanctionedAmount: 3500000, spentAmount: 3300000, expectedCost: 3500000, sanctionDate: '2023-11-01', startDate: '2023-12-15', expectedCompletion: '2024-08-15', actualCompletion: '2024-08-01', status: 'completed', physicalProgress: 100, financialProgress: 94, isAnomaly: false, description: 'Small check dam for rainwater harvesting' },
  { id: 'PRJ024', name: 'Canal Lining - Rajasthan', sector: 'Irrigation', constituency: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', agency: 'AG015', sanctionedAmount: 2800000, spentAmount: 2600000, expectedCost: 2800000, sanctionDate: '2024-02-01', startDate: '2024-03-15', expectedCompletion: '2024-11-15', actualCompletion: null, status: 'in_progress', physicalProgress: 68, financialProgress: 92, isAnomaly: false, description: '3km irrigation canal lining with concrete' },

  // Sports Infrastructure
  { id: 'PRJ025', name: 'Cricket Ground - Chennai Suburb', sector: 'Sports Infrastructure', constituency: 'Chennai South', state: 'Tamil Nadu', district: 'Chennai', agency: 'AG007', sanctionedAmount: 2000000, spentAmount: 1900000, expectedCost: 2000000, sanctionDate: '2024-01-01', startDate: '2024-02-01', expectedCompletion: '2024-08-01', actualCompletion: '2024-07-25', status: 'completed', physicalProgress: 100, financialProgress: 95, isAnomaly: false, description: 'Development of cricket ground with pavilion and fencing' },
  { id: 'PRJ026', name: 'Multipurpose Sports Complex - Pune', sector: 'Sports Infrastructure', constituency: 'Pune', state: 'Maharashtra', district: 'Pune', agency: 'AG004', sanctionedAmount: 4500000, spentAmount: 4300000, expectedCost: 4500000, sanctionDate: '2023-09-01', startDate: '2023-10-15', expectedCompletion: '2024-07-15', actualCompletion: '2024-07-20', status: 'completed', physicalProgress: 100, financialProgress: 95, isAnomaly: false, description: 'Indoor sports complex with basketball court, gym, and changing rooms' },

  // Digital Infrastructure
  { id: 'PRJ027', name: 'WiFi Hotspot - Kolkata North', sector: 'Digital Infrastructure', constituency: 'Kolkata North', state: 'West Bengal', district: 'Kolkata', agency: 'AG010', sanctionedAmount: 1000000, spentAmount: 1100000, expectedCost: 1000000, sanctionDate: '2024-04-01', startDate: '2024-05-15', expectedCompletion: '2024-09-15', actualCompletion: null, status: 'in_progress', physicalProgress: 75, financialProgress: 110, isAnomaly: false, description: 'Public WiFi hotspots at 5 community locations' },
  { id: 'PRJ028', name: 'CSC Center Setup - Bhubaneswar', sector: 'Digital Infrastructure', constituency: 'Bhubaneswar', state: 'Odisha', district: 'Khordha', agency: 'AG011', sanctionedAmount: 800000, spentAmount: 750000, expectedCost: 800000, sanctionDate: '2024-05-01', startDate: '2024-06-01', expectedCompletion: '2024-10-01', actualCompletion: '2024-09-28', status: 'completed', physicalProgress: 100, financialProgress: 93, isAnomaly: false, description: 'Common Service Center with 10 computers and internet' },

  // More projects for comparison scenarios
  { id: 'PRJ029', name: 'Village Road - Lucknow Block C', sector: 'Roads & Bridges', constituency: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', agency: 'AG001', sanctionedAmount: 1200000, spentAmount: 1150000, expectedCost: 1200000, sanctionDate: '2024-01-10', startDate: '2024-02-10', expectedCompletion: '2024-08-10', actualCompletion: '2024-07-30', status: 'completed', physicalProgress: 100, financialProgress: 95, isAnomaly: false, description: '2km village road - standard specs, completed on time' },
  { id: 'PRJ030', name: 'Village Road - Patna Block D', sector: 'Roads & Bridges', constituency: 'Patna Sahib', state: 'Bihar', district: 'Patna', agency: 'AG012', sanctionedAmount: 1200000, spentAmount: 2800000, expectedCost: 1200000, sanctionDate: '2024-01-15', startDate: '2024-03-15', expectedCompletion: '2024-09-15', actualCompletion: null, status: 'delayed', physicalProgress: 40, financialProgress: 233, isAnomaly: true, description: '2km village road - SAME SPECS but 133% cost overrun, contractor flagged' },

  // Additional projects for sector variety
  { id: 'PRJ031', name: 'Community Toilet - Mumbai Ward 8', sector: 'Sanitation', constituency: 'Mumbai North', state: 'Maharashtra', district: 'Mumbai', agency: 'AG004', sanctionedAmount: 700000, spentAmount: 680000, expectedCost: 700000, sanctionDate: '2024-06-01', startDate: '2024-07-01', expectedCompletion: '2024-11-01', actualCompletion: null, status: 'in_progress', physicalProgress: 55, financialProgress: 97, isAnomaly: false, description: 'Community toilet block with handwash station' },
  { id: 'PRJ032', name: 'PHC Equipment - Bangalore Rural', sector: 'Health', constituency: 'Bangalore South', state: 'Karnataka', district: 'Bangalore', agency: 'AG008', sanctionedAmount: 1500000, spentAmount: 1400000, expectedCost: 1500000, sanctionDate: '2024-05-01', startDate: '2024-06-01', expectedCompletion: '2024-10-01', actualCompletion: '2024-09-25', status: 'completed', physicalProgress: 100, financialProgress: 93, isAnomaly: false, description: 'Medical equipment for PHC including X-ray and ECG machine' },
  { id: 'PRJ033', name: 'Anganwadi Center - Gujarat Rural', sector: 'Education', constituency: 'Ahmedabad East', state: 'Gujarat', district: 'Ahmedabad', agency: 'AG009', sanctionedAmount: 1000000, spentAmount: 950000, expectedCost: 1000000, sanctionDate: '2024-03-01', startDate: '2024-04-01', expectedCompletion: '2024-09-01', actualCompletion: '2024-08-28', status: 'completed', physicalProgress: 100, financialProgress: 95, isAnomaly: false, description: 'Model anganwadi center with play area and kitchen' },

  // Duplicate-like projects across constituencies
  { id: 'PRJ034', name: 'Tube Well Installation - Lucknow Rural', sector: 'Drinking Water', constituency: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', agency: 'AG002', sanctionedAmount: 500000, spentAmount: 490000, expectedCost: 500000, sanctionDate: '2024-04-05', startDate: '2024-05-05', expectedCompletion: '2024-08-05', actualCompletion: '2024-08-01', status: 'completed', physicalProgress: 100, financialProgress: 98, isAnomaly: false, description: 'Installation of 10 tube wells in rural Lucknow villages — SIMILAR to PRJ006' },
  { id: 'PRJ035', name: 'Solar Street Lights - Patna Rural', sector: 'Electrification', constituency: 'Patna Sahib', state: 'Bihar', district: 'Patna', agency: 'AG013', sanctionedAmount: 1500000, spentAmount: 2700000, expectedCost: 1500000, sanctionDate: '2024-03-20', startDate: '2024-05-20', expectedCompletion: '2024-09-20', actualCompletion: null, status: 'delayed', physicalProgress: 45, financialProgress: 180, isAnomaly: true, description: '50 solar street lights — SIMILAR to PRJ021 but 80% overrun by Golden Infrastructure' },

  // More anomalous projects
  { id: 'PRJ036', name: 'Community Hall - Patna Rural', sector: 'Community Hall', constituency: 'Patna Sahib', state: 'Bihar', district: 'Patna', agency: 'AG003', sanctionedAmount: 2500000, spentAmount: 4200000, expectedCost: 2500000, sanctionDate: '2024-01-01', startDate: '2024-03-01', expectedCompletion: '2024-09-01', actualCompletion: null, status: 'delayed', physicalProgress: 48, financialProgress: 168, isAnomaly: true, description: 'Community hall project with massive cost and time overrun' },
  { id: 'PRJ037', name: 'School Renovation - MP Rural', sector: 'Education', constituency: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', agency: 'AG012', sanctionedAmount: 1800000, spentAmount: 3200000, expectedCost: 1800000, sanctionDate: '2024-02-01', startDate: '2024-04-01', expectedCompletion: '2024-10-01', actualCompletion: null, status: 'delayed', physicalProgress: 30, financialProgress: 177, isAnomaly: true, description: 'School renovation by Sunrise Constructions — FLAGGED for fund misuse' },

  // More clean projects for balance
  { id: 'PRJ038', name: 'Playground Development - Chennai', sector: 'Sports Infrastructure', constituency: 'Chennai South', state: 'Tamil Nadu', district: 'Chennai', agency: 'AG007', sanctionedAmount: 1200000, spentAmount: 1150000, expectedCost: 1200000, sanctionDate: '2024-05-01', startDate: '2024-06-01', expectedCompletion: '2024-11-01', actualCompletion: null, status: 'in_progress', physicalProgress: 72, financialProgress: 95, isAnomaly: false, description: 'Children playground with modern equipment and safety surfacing' },
  { id: 'PRJ039', name: 'Rainwater Harvesting - Bangalore', sector: 'Irrigation', constituency: 'Bangalore South', state: 'Karnataka', district: 'Bangalore', agency: 'AG008', sanctionedAmount: 900000, spentAmount: 850000, expectedCost: 900000, sanctionDate: '2024-04-01', startDate: '2024-05-01', expectedCompletion: '2024-09-01', actualCompletion: '2024-08-25', status: 'completed', physicalProgress: 100, financialProgress: 94, isAnomaly: false, description: 'Community rainwater harvesting system with storage tank' },
  { id: 'PRJ040', name: 'Bus Shelter Construction - Pune', sector: 'Roads & Bridges', constituency: 'Pune', state: 'Maharashtra', district: 'Pune', agency: 'AG014', sanctionedAmount: 400000, spentAmount: 380000, expectedCost: 400000, sanctionDate: '2024-06-01', startDate: '2024-07-01', expectedCompletion: '2024-10-01', actualCompletion: '2024-09-28', status: 'completed', physicalProgress: 100, financialProgress: 95, isAnomaly: false, description: '5 bus shelters with seating and solar lighting' },

  // Extra projects for statistics
  { id: 'PRJ041', name: 'Water Tank Construction - Jaipur', sector: 'Drinking Water', constituency: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', agency: 'AG006', sanctionedAmount: 1800000, spentAmount: 1750000, expectedCost: 1800000, sanctionDate: '2024-04-01', startDate: '2024-05-01', expectedCompletion: '2024-11-01', actualCompletion: null, status: 'in_progress', physicalProgress: 62, financialProgress: 97, isAnomaly: false, description: 'Overhead water tank for 500 households' },
  { id: 'PRJ042', name: 'Footpath Construction - Mumbai', sector: 'Roads & Bridges', constituency: 'Mumbai North', state: 'Maharashtra', district: 'Mumbai', agency: 'AG004', sanctionedAmount: 900000, spentAmount: 870000, expectedCost: 900000, sanctionDate: '2024-03-01', startDate: '2024-04-01', expectedCompletion: '2024-08-01', actualCompletion: '2024-07-28', status: 'completed', physicalProgress: 100, financialProgress: 96, isAnomaly: false, description: '1km tiled footpath with handrails and lighting' },
  { id: 'PRJ043', name: 'Sewage Treatment - Ahmedabad', sector: 'Sanitation', constituency: 'Ahmedabad East', state: 'Gujarat', district: 'Ahmedabad', agency: 'AG009', sanctionedAmount: 5000000, spentAmount: 4700000, expectedCost: 5000000, sanctionDate: '2023-09-01', startDate: '2023-10-01', expectedCompletion: '2024-08-01', actualCompletion: '2024-07-28', status: 'completed', physicalProgress: 100, financialProgress: 94, isAnomaly: false, description: 'Mini sewage treatment plant for colony of 200 houses' },
  { id: 'PRJ044', name: 'PHC Renovation - Kolkata', sector: 'Health', constituency: 'Kolkata North', state: 'West Bengal', district: 'Kolkata', agency: 'AG010', sanctionedAmount: 2200000, spentAmount: 2400000, expectedCost: 2200000, sanctionDate: '2024-02-01', startDate: '2024-03-15', expectedCompletion: '2024-10-15', actualCompletion: null, status: 'in_progress', physicalProgress: 58, financialProgress: 109, isAnomaly: false, description: 'Renovation of existing PHC with new OPD wing' },
  { id: 'PRJ045', name: 'Community Kitchen - Bhubaneswar', sector: 'Community Hall', constituency: 'Bhubaneswar', state: 'Odisha', district: 'Khordha', agency: 'AG011', sanctionedAmount: 1200000, spentAmount: 1100000, expectedCost: 1200000, sanctionDate: '2024-05-01', startDate: '2024-06-01', expectedCompletion: '2024-12-01', actualCompletion: null, status: 'in_progress', physicalProgress: 50, financialProgress: 91, isAnomaly: false, description: 'Community kitchen for mid-day meal program' },

  // Ghost/suspicious projects
  { id: 'PRJ046', name: 'Bore Well Installation - Bihar Rural', sector: 'Drinking Water', constituency: 'Patna Sahib', state: 'Bihar', district: 'Patna', agency: 'AG012', sanctionedAmount: 600000, spentAmount: 590000, expectedCost: 600000, sanctionDate: '2024-01-01', startDate: '2024-02-01', expectedCompletion: '2024-05-01', actualCompletion: '2024-04-28', status: 'completed', physicalProgress: 100, financialProgress: 98, isAnomaly: true, description: 'SUSPICIOUS: Project marked complete but no geo-tagged photos uploaded. By flagged contractor.' },
  { id: 'PRJ047', name: 'Bore Well Installation - Bihar Rural Block 2', sector: 'Drinking Water', constituency: 'Patna Sahib', state: 'Bihar', district: 'Patna', agency: 'AG012', sanctionedAmount: 600000, spentAmount: 585000, expectedCost: 600000, sanctionDate: '2024-01-05', startDate: '2024-02-05', expectedCompletion: '2024-05-05', actualCompletion: '2024-04-30', status: 'completed', physicalProgress: 100, financialProgress: 97, isAnomaly: true, description: 'POTENTIAL DUPLICATE of PRJ046 — same agency, same specs, same constituency, 5 days apart' },

  // More for statistics
  { id: 'PRJ048', name: 'Street Light Installation - Varanasi', sector: 'Electrification', constituency: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', agency: 'AG014', sanctionedAmount: 1000000, spentAmount: 950000, expectedCost: 1000000, sanctionDate: '2024-06-01', startDate: '2024-07-01', expectedCompletion: '2024-11-01', actualCompletion: null, status: 'in_progress', physicalProgress: 45, financialProgress: 95, isAnomaly: false, description: '40 LED street lights on main market road' },
  { id: 'PRJ049', name: 'Boundary Wall - Lucknow School', sector: 'Education', constituency: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', agency: 'AG002', sanctionedAmount: 400000, spentAmount: 380000, expectedCost: 400000, sanctionDate: '2024-07-01', startDate: '2024-08-01', expectedCompletion: '2024-11-01', actualCompletion: null, status: 'in_progress', physicalProgress: 35, financialProgress: 95, isAnomaly: false, description: 'Boundary wall for government primary school' },
  { id: 'PRJ050', name: 'Hand Pump Repair - MP Villages', sector: 'Drinking Water', constituency: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal', agency: 'AG005', sanctionedAmount: 300000, spentAmount: 280000, expectedCost: 300000, sanctionDate: '2024-04-01', startDate: '2024-05-01', expectedCompletion: '2024-07-01', actualCompletion: '2024-06-28', status: 'completed', physicalProgress: 100, financialProgress: 93, isAnomaly: false, description: 'Repair and maintenance of 15 hand pumps in rural villages' },
];

export const ghaziabadDemoProjects = [
  {
    id: 'PRJ_GZB_01',
    name: 'Village Road Improvement - Ghaziabad',
    sector: 'Roads & Bridges',
    constituency: 'Ghaziabad',
    state: 'Uttar Pradesh',
    district: 'Ghaziabad',
    agency: 'AG002',
    sanctionedAmount: 2200000,
    spentAmount: 2200000,
    expectedCost: 2200000,
    sanctionDate: '2024-02-10',
    startDate: '2024-03-01',
    expectedCompletion: '2024-11-30',
    actualCompletion: null,
    status: 'in_progress',
    physicalProgress: 75,
    financialProgress: 88,
    estimatedSiteProgress: 55,
    isAnomaly: true,
    latitude: 28.6842,
    longitude: 77.4668,
    description: '2km village road improvement with bituminous surface and culvert reconstruction. AI visual estimation indicates potential progress mismatch (75% reported vs 55% site estimate).'
  },
  {
    id: 'PRJ_GZB_02',
    name: 'Community Hall Construction - Raj Nagar',
    sector: 'Community Hall',
    constituency: 'Ghaziabad',
    state: 'Uttar Pradesh',
    district: 'Ghaziabad',
    agency: 'AG002',
    sanctionedAmount: 2500000,
    spentAmount: 2100000,
    expectedCost: 2500000,
    sanctionDate: '2024-01-15',
    startDate: '2024-02-15',
    expectedCompletion: '2024-12-15',
    actualCompletion: null,
    status: 'in_progress',
    physicalProgress: 60,
    financialProgress: 84,
    estimatedSiteProgress: 60,
    isAnomaly: false,
    latitude: 28.6932,
    longitude: 77.4758,
    description: 'Multi-purpose community hall with solar lighting, rainwater harvesting, and seating for 250 citizens.'
  },
  {
    id: 'PRJ_GZB_03',
    name: 'Drainage Improvement - Mohan Nagar',
    sector: 'Sanitation',
    constituency: 'Ghaziabad',
    state: 'Uttar Pradesh',
    district: 'Ghaziabad',
    agency: 'AG013',
    sanctionedAmount: 1800000,
    spentAmount: 2300000,
    expectedCost: 1800000,
    sanctionDate: '2023-11-20',
    startDate: '2024-01-10',
    expectedCompletion: '2024-08-30',
    actualCompletion: null,
    status: 'delayed',
    physicalProgress: 45,
    financialProgress: 128,
    estimatedSiteProgress: 40,
    isAnomaly: true,
    latitude: 28.6312,
    longitude: 77.4228,
    description: 'Underground stormwater covered drainage to prevent monsoon waterlogging along transit junction.'
  },
  {
    id: 'PRJ_GZB_04',
    name: 'Government School Infrastructure - Kavi Nagar',
    sector: 'Education',
    constituency: 'Ghaziabad',
    state: 'Uttar Pradesh',
    district: 'Ghaziabad',
    agency: 'AG001',
    sanctionedAmount: 1500000,
    spentAmount: 1450000,
    expectedCost: 1500000,
    sanctionDate: '2023-12-05',
    startDate: '2024-01-05',
    expectedCompletion: '2024-07-30',
    actualCompletion: '2024-07-25',
    status: 'completed',
    physicalProgress: 100,
    financialProgress: 97,
    estimatedSiteProgress: 100,
    isAnomaly: false,
    latitude: 28.7242,
    longitude: 77.5038,
    description: 'Smart classroom wing with 4 additional rooms, composite science lab, and sanitation facilities.'
  },
];

export const projects = [
  ...ghaziabadDemoProjects,
  ...baseProjects.map((p, idx) => {
    if (p.latitude != null && p.longitude != null) return p;
    const base = constituencyCoords[p.constituency] || { lat: 25.3176, lng: 82.9739 };
    const latOffset = ((idx % 7) - 3) * 0.015;
    const lngOffset = (((idx * 3) % 7) - 3) * 0.015;
    return {
      ...p,
      latitude: Number((base.lat + latOffset).toFixed(4)),
      longitude: Number((base.lng + lngOffset).toFixed(4)),
      estimatedSiteProgress: p.estimatedSiteProgress ?? (p.isAnomaly ? Math.max(20, (p.physicalProgress || 70) - 20) : p.physicalProgress),
    };
  }),
];

// Fund utilization data by state (in Crores)
export const stateFundData = [
  { state: 'Uttar Pradesh', released: 245, utilized: 198, unspent: 47, projects: 156, completionRate: 68 },
  { state: 'Maharashtra', released: 189, utilized: 172, unspent: 17, projects: 98, completionRate: 82 },
  { state: 'Bihar', released: 167, utilized: 112, unspent: 55, projects: 134, completionRate: 48 },
  { state: 'Madhya Pradesh', released: 145, utilized: 118, unspent: 27, projects: 89, completionRate: 62 },
  { state: 'Rajasthan', released: 132, utilized: 115, unspent: 17, projects: 76, completionRate: 75 },
  { state: 'Tamil Nadu', released: 156, utilized: 148, unspent: 8, projects: 82, completionRate: 88 },
  { state: 'Karnataka', released: 128, utilized: 112, unspent: 16, projects: 71, completionRate: 78 },
  { state: 'Gujarat', released: 142, utilized: 135, unspent: 7, projects: 68, completionRate: 91 },
  { state: 'West Bengal', released: 134, utilized: 108, unspent: 26, projects: 88, completionRate: 62 },
  { state: 'Odisha', released: 98, utilized: 85, unspent: 13, projects: 54, completionRate: 80 },
];

// Monthly fund utilization trend (last 24 months)
export const monthlyTrend = [
  { month: 'Jan 2023', released: 45, utilized: 32 },
  { month: 'Feb 2023', released: 48, utilized: 35 },
  { month: 'Mar 2023', released: 62, utilized: 48 },
  { month: 'Apr 2023', released: 55, utilized: 42 },
  { month: 'May 2023', released: 51, utilized: 40 },
  { month: 'Jun 2023', released: 58, utilized: 45 },
  { month: 'Jul 2023', released: 63, utilized: 50 },
  { month: 'Aug 2023', released: 67, utilized: 55 },
  { month: 'Sep 2023', released: 72, utilized: 60 },
  { month: 'Oct 2023', released: 78, utilized: 65 },
  { month: 'Nov 2023', released: 82, utilized: 68 },
  { month: 'Dec 2023', released: 75, utilized: 62 },
  { month: 'Jan 2024', released: 68, utilized: 55 },
  { month: 'Feb 2024', released: 72, utilized: 58 },
  { month: 'Mar 2024', released: 85, utilized: 70 },
  { month: 'Apr 2024', released: 78, utilized: 65 },
  { month: 'May 2024', released: 82, utilized: 68 },
  { month: 'Jun 2024', released: 88, utilized: 72 },
  { month: 'Jul 2024', released: 92, utilized: 78 },
  { month: 'Aug 2024', released: 95, utilized: 82 },
  { month: 'Sep 2024', released: 98, utilized: 85 },
  { month: 'Oct 2024', released: 102, utilized: 88 },
  { month: 'Nov 2024', released: 105, utilized: 92 },
  { month: 'Dec 2024', released: 100, utilized: 88 },
];

// Alerts data
export const alerts = [
  { id: 'ALT001', type: 'critical', title: 'Massive Cost Overrun Detected', message: 'PRJ002 (Village Road - Varanasi Block B) has 83% cost overrun with only 55% physical completion. Agency AG003 is under review.', project: 'PRJ002', timestamp: '2024-09-07T14:30:00', read: false },
  { id: 'ALT002', type: 'critical', title: 'Suspected Fraud - Ghost Project', message: 'PRJ046 and PRJ047 appear to be duplicate projects by same agency (Sunrise Constructions). No geo-tagged verification photos found.', project: 'PRJ046', timestamp: '2024-09-07T12:15:00', read: false },
  { id: 'ALT003', type: 'warning', title: 'Agency Red Flag Threshold Exceeded', message: 'Sunrise Constructions Pvt Ltd (AG012) has exceeded 8 red flags. Immediate review recommended.', project: null, timestamp: '2024-09-07T10:00:00', read: false },
  { id: 'ALT004', type: 'warning', title: 'Comparison Alert: Road Projects', message: 'PRJ030 costs 133% more than PRJ001 for identical specifications. Red flag scenario detected.', project: 'PRJ030', timestamp: '2024-09-06T16:45:00', read: false },
  { id: 'ALT005', type: 'info', title: 'Bottleneck Predicted', message: 'PRJ005 (Highway Connector - Bhopal) predicted to miss deadline by 3 weeks due to monsoon season impact.', project: 'PRJ005', timestamp: '2024-09-06T14:00:00', read: true },
  { id: 'ALT006', type: 'critical', title: 'Fund Diversion Suspected', message: 'PRJ014 (Health Sub-Center - Bhopal Rural) shows 86% financial progress but only 25% physical progress. Immediate investigation required.', project: 'PRJ014', timestamp: '2024-09-06T11:30:00', read: false },
  { id: 'ALT007', type: 'warning', title: 'Delayed Project Cluster', message: '5 projects in Patna Sahib constituency are delayed beyond expected completion. District Authority review needed.', project: null, timestamp: '2024-09-05T15:00:00', read: true },
  { id: 'ALT008', type: 'info', title: 'Performance Improvement', message: 'Tamil Nadu Housing Board (AG007) has achieved 88% on-time delivery rate. Recommended for more projects.', project: null, timestamp: '2024-09-05T10:00:00', read: true },
  { id: 'ALT009', type: 'warning', title: 'Budget Overrun Warning', message: 'PRJ017 (Drainage System - Patna) has exceeded sanctioned amount by 72%. Golden Infrastructure Ltd flagged.', project: 'PRJ017', timestamp: '2024-09-04T16:00:00', read: true },
  { id: 'ALT010', type: 'info', title: 'Quarterly Report Due', message: 'Quarterly MPLADS utilization report for Q3 2024 is due by September 15, 2024.', project: null, timestamp: '2024-09-04T09:00:00', read: true },
];

// Benchmark data for comparison analysis
export const benchmarks = {
  'Roads & Bridges': { avgCostPerKm: 600000, avgTimeMonths: 6, costThreshold: 0.4, timeThreshold: 0.5 },
  'Drinking Water': { avgCostPerUnit: 50000, avgTimeMonths: 3, costThreshold: 0.35, timeThreshold: 0.4 },
  'Education': { avgCostPerRoom: 750000, avgTimeMonths: 8, costThreshold: 0.3, timeThreshold: 0.4 },
  'Health': { avgCostPerCenter: 2000000, avgTimeMonths: 9, costThreshold: 0.35, timeThreshold: 0.45 },
  'Sanitation': { avgCostPerUnit: 35000, avgTimeMonths: 4, costThreshold: 0.4, timeThreshold: 0.5 },
  'Community Hall': { avgCostPerHall: 2500000, avgTimeMonths: 8, costThreshold: 0.3, timeThreshold: 0.4 },
  'Electrification': { avgCostPerLight: 30000, avgTimeMonths: 5, costThreshold: 0.35, timeThreshold: 0.45 },
  'Irrigation': { avgCostPerProject: 2000000, avgTimeMonths: 8, costThreshold: 0.35, timeThreshold: 0.5 },
  'Sports Infrastructure': { avgCostPerFacility: 2000000, avgTimeMonths: 7, costThreshold: 0.3, timeThreshold: 0.4 },
  'Digital Infrastructure': { avgCostPerCenter: 900000, avgTimeMonths: 4, costThreshold: 0.3, timeThreshold: 0.4 },
};

// Bottleneck prediction data
export const bottleneckData = [
  { projectId: 'PRJ005', type: 'seasonal', predictedDelay: 21, probability: 0.72, description: 'Monsoon season expected to halt construction for 3 weeks', recommendation: 'Pre-position materials and adjust workforce schedule before monsoon onset' },
  { projectId: 'PRJ009', type: 'agency_capacity', predictedDelay: 14, probability: 0.58, description: 'Agency handling 3 concurrent projects with limited workforce', recommendation: 'Consider deploying additional labor from nearby district agency pool' },
  { projectId: 'PRJ019', type: 'funding', predictedDelay: 30, probability: 0.65, description: 'Next tranche of funds pending state government approval', recommendation: 'Escalate fund release request to State Nodal Authority immediately' },
  { projectId: 'PRJ020', type: 'regulatory', predictedDelay: 45, probability: 0.45, description: 'Land ownership dispute for adjacent plot may halt expansion', recommendation: 'Initiate parallel land acquisition process through District Collector' },
  { projectId: 'PRJ024', type: 'seasonal', predictedDelay: 28, probability: 0.68, description: 'Extreme heat in Rajasthan limiting work hours', recommendation: 'Shift to early morning and evening work schedules' },
  { projectId: 'PRJ027', type: 'agency_capacity', predictedDelay: 10, probability: 0.52, description: 'Technical staff shortage for fiber optic installation', recommendation: 'Engage specialized subcontractor for technical installation work' },
  { projectId: 'PRJ031', type: 'funding', predictedDelay: 20, probability: 0.6, description: 'Fund utilization certificate pending from previous project', recommendation: 'Submit pending UCs within 7 days to release next installment' },
  { projectId: 'PRJ041', type: 'regulatory', predictedDelay: 35, probability: 0.55, description: 'Environmental clearance for water tank location under review', recommendation: 'Prepare alternative site documentation as backup plan' },
];
