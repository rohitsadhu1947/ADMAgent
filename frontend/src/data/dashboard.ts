import { FunnelData, RegionalData, TrendDataPoint } from './types';

// === HERO STATS - Tells the Axis Max Life story ===
export const heroStats = {
  totalAgents: 103847,          // 1 Lakh+ agents
  activeAgents: 2077,           // ~2% active
  activationRate: 2.0,          // The number we want to change
  activationRateTarget: 15.0,   // Where we want to go
  admsActive: 847,              // ADMs on payroll
  avgResponseTime: 14.2,        // Current: 14 days (bad)
  avgResponseTimeTarget: 2.5,   // Target: 2.5 days
  dormantAgents: 98420,         // 98K+ dormant
  atRiskAgents: 2150,           // Recently dropped off
  contactedThisWeek: 342,       // With new platform
  feedbackCollected: 89,        // Low - showing the gap
  policiesSoldThisMonth: 1834,
  admCostPerYear: 350000,       // ₹3.5L per ADM
  totalAdmCost: 296450000,      // ₹29.6 Cr total spend
  revenuePerActiveAgent: 180000, // ₹1.8L avg per active agent
};

// === ACTIVATION FUNNEL - Shows the massive drop-off ===
export const funnelData: FunnelData[] = [
  { stage: 'Total Agents', count: 103847, percentage: 100, color: '#64748B' },
  { stage: 'Dormant', count: 98420, percentage: 94.8, color: '#EF4444' },
  { stage: 'Contacted (by ADMs)', count: 15200, percentage: 14.6, color: '#F59E0B' },
  { stage: 'Engaged', count: 4800, percentage: 4.6, color: '#8B5CF6' },
  { stage: 'Trained', count: 2900, percentage: 2.8, color: '#3B82F6' },
  { stage: 'Active (Punching Policies)', count: 2077, percentage: 2.0, color: '#10B981' },
];

// === PROJECTED FUNNEL - With Platform (show the improvement) ===
export const projectedFunnelData: FunnelData[] = [
  { stage: 'Total Agents', count: 103847, percentage: 100, color: '#64748B' },
  { stage: 'Dormant', count: 72893, percentage: 70.2, color: '#EF4444' },
  { stage: 'Contacted (by ADMs)', count: 62308, percentage: 60.0, color: '#F59E0B' },
  { stage: 'Engaged', count: 28038, percentage: 27.0, color: '#8B5CF6' },
  { stage: 'Trained', count: 20769, percentage: 20.0, color: '#3B82F6' },
  { stage: 'Active (Punching Policies)', count: 15577, percentage: 15.0, color: '#10B981' },
];

// === REGIONAL DATA - Indian cities ===
export const regionalData: RegionalData[] = [
  { city: 'Mumbai', region: 'West', total_agents: 14200, active_agents: 312, activation_rate: 2.2 },
  { city: 'Delhi NCR', region: 'North', total_agents: 12800, active_agents: 268, activation_rate: 2.1 },
  { city: 'Bangalore', region: 'South', total_agents: 9500, active_agents: 209, activation_rate: 2.2 },
  { city: 'Chennai', region: 'South', total_agents: 8200, active_agents: 148, activation_rate: 1.8 },
  { city: 'Kolkata', region: 'East', total_agents: 7800, active_agents: 148, activation_rate: 1.9 },
  { city: 'Hyderabad', region: 'South', total_agents: 8500, active_agents: 187, activation_rate: 2.2 },
  { city: 'Pune', region: 'West', total_agents: 6500, active_agents: 143, activation_rate: 2.2 },
  { city: 'Ahmedabad', region: 'West', total_agents: 5500, active_agents: 99, activation_rate: 1.8 },
  { city: 'Jaipur', region: 'North', total_agents: 4800, active_agents: 86, activation_rate: 1.8 },
  { city: 'Lucknow', region: 'North', total_agents: 4200, active_agents: 76, activation_rate: 1.8 },
  { city: 'Kochi', region: 'South', total_agents: 3800, active_agents: 84, activation_rate: 2.2 },
  { city: 'Chandigarh', region: 'North', total_agents: 3200, active_agents: 58, activation_rate: 1.8 },
];

// === DORMANCY REASONS - The heart of the problem ===
export const dormancyReasonsData = [
  { reason: 'Competition (LIC/Others)', count: 24605, percentage: 25.0, color: '#EF4444' },
  { reason: 'Commission Concerns', count: 19684, percentage: 20.0, color: '#F59E0B' },
  { reason: 'Product Complexity', count: 16747, percentage: 17.0, color: '#8B5CF6' },
  { reason: 'System/Portal Issues', count: 12795, percentage: 13.0, color: '#EC4899' },
  { reason: 'Poor ADM Support', count: 9858, percentage: 10.0, color: '#3B82F6' },
  { reason: 'Personal Reasons', count: 7874, percentage: 8.0, color: '#6B7280' },
  { reason: 'Market Conditions', count: 6857, percentage: 7.0, color: '#14B8A6' },
];

// === TREND DATA - Showing potential with platform adoption ===
export const trendData: TrendDataPoint[] = [
  // Before platform (flat/declining)
  { date: 'Jan 1', activations: 2, contacts: 12, feedbacks: 3, positive: 1, negative: 2 },
  { date: 'Jan 3', activations: 1, contacts: 8, feedbacks: 2, positive: 1, negative: 1 },
  { date: 'Jan 5', activations: 3, contacts: 15, feedbacks: 5, positive: 2, negative: 3 },
  { date: 'Jan 7', activations: 1, contacts: 10, feedbacks: 3, positive: 1, negative: 2 },
  { date: 'Jan 9', activations: 2, contacts: 11, feedbacks: 4, positive: 2, negative: 2 },
  { date: 'Jan 11', activations: 0, contacts: 6, feedbacks: 2, positive: 1, negative: 1 },
  { date: 'Jan 13', activations: 1, contacts: 9, feedbacks: 3, positive: 1, negative: 2 },
  { date: 'Jan 15', activations: 2, contacts: 13, feedbacks: 4, positive: 2, negative: 2 },
  // Platform pilot begins (showing uptick)
  { date: 'Jan 17', activations: 4, contacts: 22, feedbacks: 9, positive: 5, negative: 4 },
  { date: 'Jan 19', activations: 6, contacts: 28, feedbacks: 14, positive: 8, negative: 6 },
  { date: 'Jan 21', activations: 8, contacts: 35, feedbacks: 18, positive: 11, negative: 7 },
  { date: 'Jan 23', activations: 7, contacts: 32, feedbacks: 16, positive: 10, negative: 6 },
  { date: 'Jan 25', activations: 10, contacts: 40, feedbacks: 22, positive: 15, negative: 7 },
  { date: 'Jan 27', activations: 12, contacts: 45, feedbacks: 25, positive: 18, negative: 7 },
  { date: 'Jan 29', activations: 11, contacts: 42, feedbacks: 23, positive: 16, negative: 7 },
  { date: 'Jan 31', activations: 14, contacts: 48, feedbacks: 28, positive: 20, negative: 8 },
  { date: 'Feb 2', activations: 16, contacts: 55, feedbacks: 32, positive: 24, negative: 8 },
  { date: 'Feb 4', activations: 18, contacts: 60, feedbacks: 35, positive: 26, negative: 9 },
  { date: 'Feb 6', activations: 15, contacts: 52, feedbacks: 30, positive: 22, negative: 8 },
  { date: 'Feb 8', activations: 20, contacts: 65, feedbacks: 38, positive: 28, negative: 10 },
  { date: 'Feb 10', activations: 22, contacts: 70, feedbacks: 42, positive: 32, negative: 10 },
  { date: 'Feb 12', activations: 24, contacts: 75, feedbacks: 45, positive: 35, negative: 10 },
  { date: 'Feb 14', activations: 28, contacts: 82, feedbacks: 50, positive: 40, negative: 10 },
  { date: 'Feb 16', activations: 32, contacts: 90, feedbacks: 55, positive: 44, negative: 11 },
];

// === RECENT ACTIVITY - Live-looking feed ===
export const recentActivity = [
  { id: 1, type: 'activation' as const, text: 'Suresh Patel (Mumbai) moved to Active - first policy in 8 months!', adm: 'Rakesh Oberoi', time: '2 min ago', icon: 'check-circle' },
  { id: 2, type: 'call' as const, text: 'Follow-up call completed with Meena Iyer (Pune)', adm: 'Rakesh Oberoi', time: '8 min ago', icon: 'phone' },
  { id: 3, type: 'feedback' as const, text: 'Feedback captured: Vikram Singh reports portal login issues', adm: 'Priyanka Chauhan', time: '12 min ago', icon: 'message-square' },
  { id: 4, type: 'training' as const, text: 'Nandini Rao completed Smart Term Plan training (95%)', adm: 'Nandini Rao', time: '18 min ago', icon: 'graduation-cap' },
  { id: 5, type: 'engagement' as const, text: 'Amit Kumar (Ahmedabad) re-engaged after commission clarification', adm: 'Rakesh Oberoi', time: '25 min ago', icon: 'user-check' },
  { id: 6, type: 'call' as const, text: 'Priyanka contacted 3 dormant agents in Noida', adm: 'Priyanka Chauhan', time: '35 min ago', icon: 'phone' },
  { id: 7, type: 'feedback' as const, text: 'AI flagged: 15 agents in Chennai reporting same portal issue', adm: 'System', time: '42 min ago', icon: 'alert-triangle' },
  { id: 8, type: 'activation' as const, text: 'Ravi Verma (Delhi) punched first ULIP policy', adm: 'Priyanka Chauhan', time: '1 hr ago', icon: 'trophy' },
  { id: 9, type: 'training' as const, text: 'Group training: SWAG Plan webinar - 12 ADMs attended', adm: 'System', time: '1.5 hrs ago', icon: 'users' },
  { id: 10, type: 'engagement' as const, text: 'Dormant agent Kavita Sharma (Jaipur) responded to WhatsApp outreach', adm: 'Priyanka Chauhan', time: '2 hrs ago', icon: 'user-plus' },
];

// === IMPACT METRICS - Before vs After with Platform ===
export const impactMetrics = [
  { metric: 'Agent Activation Rate', before: '2%', after: '15%', improvement: '7.5x', icon: 'trending-up' },
  { metric: 'ADM Daily Contacts', before: '5-8', after: '15-20', improvement: '2.5x', icon: 'phone' },
  { metric: 'Feedback Capture Rate', before: '~5%', after: '~85%', improvement: '17x', icon: 'message-square' },
  { metric: 'Follow-up Compliance', before: '~20%', after: '~90%', improvement: '4.5x', icon: 'calendar' },
  { metric: 'First Contact Time', before: '14 days', after: '48 hrs', improvement: '7x faster', icon: 'clock' },
  { metric: 'Product Knowledge Score', before: '35%', after: '82%', improvement: '2.3x', icon: 'book' },
];

// === COST IMPACT ===
export const costImpact = {
  currentAdmCost: 29.6,       // ₹29.6 Cr (847 ADMs × ₹3.5L)
  revenuePerActiveAgent: 1.8, // ₹1.8L per active agent per year
  currentRevenue: 37.4,       // ₹37.4 Cr (2077 × ₹1.8L)
  projectedRevenue: 280.4,    // ₹280.4 Cr (15577 × ₹1.8L)
  incrementalRevenue: 243.0,  // ₹243 Cr additional
  roiMultiple: 8.2,           // 8.2x ROI on platform investment
};
