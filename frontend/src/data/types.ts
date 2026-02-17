export type LifecycleState = 'dormant' | 'contacted' | 'engaged' | 'trained' | 'active' | 'at_risk';

export type DormancyReason =
  | 'no_leads'
  | 'low_commission'
  | 'personal_issues'
  | 'product_confusion'
  | 'poor_support'
  | 'market_competition'
  | 'tech_issues'
  | 'lack_of_training';

export type InteractionType = 'call' | 'whatsapp' | 'email' | 'visit' | 'training' | 'follow_up';
export type InteractionOutcome = 'positive' | 'neutral' | 'negative' | 'no_response';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type FeedbackCategory = 'product' | 'commission' | 'support' | 'training' | 'technology' | 'market' | 'personal';

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  region: string;
  lifecycle_state: LifecycleState;
  dormancy_reason: DormancyReason | null;
  assigned_adm: string;
  last_active: string;
  policies_sold_last_quarter: number;
  policies_sold_current: number;
  activation_date: string | null;
  risk_score: number;
  avatar_initials: string;
}

export interface ADM {
  id: string;
  name: string;
  email: string;
  region: string;
  city: string;
  phone: string;
  agents_assigned: number;
  capacity: number;
  activation_rate: number;
  agents_activated: number;
  calls_today: number;
  calls_this_week: number;
  avg_response_time: number;
  avatar_initials: string;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  score: number;
}

export interface Interaction {
  id: string;
  adm_id: string;
  adm_name: string;
  agent_id: string;
  agent_name: string;
  type: InteractionType;
  outcome: InteractionOutcome;
  notes: string;
  timestamp: string;
  duration_minutes: number | null;
}

export interface Feedback {
  id: string;
  agent_id: string;
  agent_name: string;
  adm_id: string;
  adm_name: string;
  category: FeedbackCategory;
  sentiment: SentimentType;
  dormancy_reason: DormancyReason | null;
  text: string;
  timestamp: string;
  resolved: boolean;
  region: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  category: string;
  description: string;
  total_lessons: number;
  avg_completion_rate: number;
  avg_quiz_score: number;
  enrolled_adms: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
}

export interface ADMTrainingProgress {
  adm_id: string;
  adm_name: string;
  module_id: string;
  module_title: string;
  progress: number;
  quiz_score: number | null;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RegionalData {
  city: string;
  region: string;
  total_agents: number;
  active_agents: number;
  activation_rate: number;
}

export interface TrendDataPoint {
  date: string;
  activations: number;
  contacts: number;
  feedbacks: number;
  positive: number;
  negative: number;
}
