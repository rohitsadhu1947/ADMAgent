import { TrainingModule, ADMTrainingProgress } from './types';

export const trainingModules: TrainingModule[] = [
  { id: 'TM001', title: 'Term Insurance Fundamentals', category: 'Term Life', description: 'Core concepts of term insurance, rider benefits, and sales techniques', total_lessons: 8, avg_completion_rate: 85, avg_quiz_score: 78, enrolled_adms: 5, difficulty: 'beginner', duration_hours: 4 },
  { id: 'TM002', title: 'ULIP Product Mastery', category: 'ULIP', description: 'Deep dive into ULIP products, fund options, NAV calculations, and suitability analysis', total_lessons: 12, avg_completion_rate: 72, avg_quiz_score: 71, enrolled_adms: 5, difficulty: 'advanced', duration_hours: 8 },
  { id: 'TM003', title: 'Health Insurance Essentials', category: 'Health', description: 'Health insurance products, claim process, and customer objection handling', total_lessons: 6, avg_completion_rate: 90, avg_quiz_score: 82, enrolled_adms: 4, difficulty: 'beginner', duration_hours: 3 },
  { id: 'TM004', title: 'Retirement Planning Solutions', category: 'Pension', description: 'Annuity products, pension plans, and retirement corpus calculation', total_lessons: 10, avg_completion_rate: 65, avg_quiz_score: 68, enrolled_adms: 3, difficulty: 'intermediate', duration_hours: 6 },
  { id: 'TM005', title: 'Child Education Plans', category: 'Child Plans', description: 'Education planning products, money-back features, and milestone benefits', total_lessons: 7, avg_completion_rate: 78, avg_quiz_score: 75, enrolled_adms: 4, difficulty: 'intermediate', duration_hours: 4 },
  { id: 'TM006', title: 'Digital Sales Toolkit', category: 'Technology', description: 'Mobile app training, e-proposal submission, and digital KYC process', total_lessons: 5, avg_completion_rate: 60, avg_quiz_score: 65, enrolled_adms: 5, difficulty: 'beginner', duration_hours: 2.5 },
  { id: 'TM007', title: 'Objection Handling Masterclass', category: 'Sales Skills', description: 'Advanced objection handling techniques for insurance sales', total_lessons: 8, avg_completion_rate: 88, avg_quiz_score: 80, enrolled_adms: 5, difficulty: 'intermediate', duration_hours: 5 },
  { id: 'TM008', title: 'Regulatory Compliance', category: 'Compliance', description: 'IRDAI regulations, mis-selling prevention, and documentation requirements', total_lessons: 6, avg_completion_rate: 95, avg_quiz_score: 88, enrolled_adms: 5, difficulty: 'beginner', duration_hours: 3 },
];

export const admTrainingProgress: ADMTrainingProgress[] = [
  // Rakesh Oberoi (ADM001)
  { adm_id: 'ADM001', adm_name: 'Rakesh Oberoi', module_id: 'TM001', module_title: 'Term Insurance Fundamentals', progress: 100, quiz_score: 92, completed: true, started_at: '2023-12-01', completed_at: '2023-12-15' },
  { adm_id: 'ADM001', adm_name: 'Rakesh Oberoi', module_id: 'TM002', module_title: 'ULIP Product Mastery', progress: 100, quiz_score: 85, completed: true, started_at: '2023-12-16', completed_at: '2024-01-05' },
  { adm_id: 'ADM001', adm_name: 'Rakesh Oberoi', module_id: 'TM003', module_title: 'Health Insurance Essentials', progress: 100, quiz_score: 88, completed: true, started_at: '2024-01-06', completed_at: '2024-01-10' },
  { adm_id: 'ADM001', adm_name: 'Rakesh Oberoi', module_id: 'TM004', module_title: 'Retirement Planning Solutions', progress: 75, quiz_score: null, completed: false, started_at: '2024-01-11', completed_at: null },
  { adm_id: 'ADM001', adm_name: 'Rakesh Oberoi', module_id: 'TM006', module_title: 'Digital Sales Toolkit', progress: 100, quiz_score: 78, completed: true, started_at: '2023-11-20', completed_at: '2023-11-28' },
  { adm_id: 'ADM001', adm_name: 'Rakesh Oberoi', module_id: 'TM007', module_title: 'Objection Handling Masterclass', progress: 100, quiz_score: 90, completed: true, started_at: '2023-12-10', completed_at: '2023-12-20' },
  { adm_id: 'ADM001', adm_name: 'Rakesh Oberoi', module_id: 'TM008', module_title: 'Regulatory Compliance', progress: 100, quiz_score: 95, completed: true, started_at: '2023-11-15', completed_at: '2023-11-20' },

  // Priyanka Chauhan (ADM002)
  { adm_id: 'ADM002', adm_name: 'Priyanka Chauhan', module_id: 'TM001', module_title: 'Term Insurance Fundamentals', progress: 100, quiz_score: 88, completed: true, started_at: '2023-12-05', completed_at: '2023-12-18' },
  { adm_id: 'ADM002', adm_name: 'Priyanka Chauhan', module_id: 'TM002', module_title: 'ULIP Product Mastery', progress: 60, quiz_score: null, completed: false, started_at: '2024-01-02', completed_at: null },
  { adm_id: 'ADM002', adm_name: 'Priyanka Chauhan', module_id: 'TM005', module_title: 'Child Education Plans', progress: 100, quiz_score: 82, completed: true, started_at: '2023-12-20', completed_at: '2024-01-02' },
  { adm_id: 'ADM002', adm_name: 'Priyanka Chauhan', module_id: 'TM006', module_title: 'Digital Sales Toolkit', progress: 100, quiz_score: 72, completed: true, started_at: '2023-11-25', completed_at: '2023-12-01' },
  { adm_id: 'ADM002', adm_name: 'Priyanka Chauhan', module_id: 'TM007', module_title: 'Objection Handling Masterclass', progress: 100, quiz_score: 85, completed: true, started_at: '2023-12-15', completed_at: '2023-12-28' },
  { adm_id: 'ADM002', adm_name: 'Priyanka Chauhan', module_id: 'TM008', module_title: 'Regulatory Compliance', progress: 100, quiz_score: 92, completed: true, started_at: '2023-11-18', completed_at: '2023-11-25' },

  // Anand Krishnamurthy (ADM003)
  { adm_id: 'ADM003', adm_name: 'Anand Krishnamurthy', module_id: 'TM001', module_title: 'Term Insurance Fundamentals', progress: 100, quiz_score: 75, completed: true, started_at: '2023-12-10', completed_at: '2023-12-22' },
  { adm_id: 'ADM003', adm_name: 'Anand Krishnamurthy', module_id: 'TM003', module_title: 'Health Insurance Essentials', progress: 100, quiz_score: 80, completed: true, started_at: '2024-01-03', completed_at: '2024-01-08' },
  { adm_id: 'ADM003', adm_name: 'Anand Krishnamurthy', module_id: 'TM004', module_title: 'Retirement Planning Solutions', progress: 40, quiz_score: null, completed: false, started_at: '2024-01-10', completed_at: null },
  { adm_id: 'ADM003', adm_name: 'Anand Krishnamurthy', module_id: 'TM007', module_title: 'Objection Handling Masterclass', progress: 100, quiz_score: 72, completed: true, started_at: '2023-12-22', completed_at: '2024-01-05' },
  { adm_id: 'ADM003', adm_name: 'Anand Krishnamurthy', module_id: 'TM008', module_title: 'Regulatory Compliance', progress: 100, quiz_score: 85, completed: true, started_at: '2023-11-20', completed_at: '2023-11-28' },

  // Nandini Rao (ADM004)
  { adm_id: 'ADM004', adm_name: 'Nandini Rao', module_id: 'TM001', module_title: 'Term Insurance Fundamentals', progress: 100, quiz_score: 90, completed: true, started_at: '2023-12-01', completed_at: '2023-12-12' },
  { adm_id: 'ADM004', adm_name: 'Nandini Rao', module_id: 'TM002', module_title: 'ULIP Product Mastery', progress: 100, quiz_score: 82, completed: true, started_at: '2023-12-13', completed_at: '2024-01-02' },
  { adm_id: 'ADM004', adm_name: 'Nandini Rao', module_id: 'TM003', module_title: 'Health Insurance Essentials', progress: 100, quiz_score: 85, completed: true, started_at: '2024-01-03', completed_at: '2024-01-08' },
  { adm_id: 'ADM004', adm_name: 'Nandini Rao', module_id: 'TM005', module_title: 'Child Education Plans', progress: 85, quiz_score: null, completed: false, started_at: '2024-01-09', completed_at: null },
  { adm_id: 'ADM004', adm_name: 'Nandini Rao', module_id: 'TM006', module_title: 'Digital Sales Toolkit', progress: 100, quiz_score: 70, completed: true, started_at: '2023-11-22', completed_at: '2023-11-30' },
  { adm_id: 'ADM004', adm_name: 'Nandini Rao', module_id: 'TM008', module_title: 'Regulatory Compliance', progress: 100, quiz_score: 90, completed: true, started_at: '2023-11-15', completed_at: '2023-11-22' },

  // Sourav Ganguly (ADM005)
  { adm_id: 'ADM005', adm_name: 'Sourav Ganguly', module_id: 'TM001', module_title: 'Term Insurance Fundamentals', progress: 100, quiz_score: 70, completed: true, started_at: '2023-12-08', completed_at: '2023-12-20' },
  { adm_id: 'ADM005', adm_name: 'Sourav Ganguly', module_id: 'TM002', module_title: 'ULIP Product Mastery', progress: 30, quiz_score: null, completed: false, started_at: '2024-01-08', completed_at: null },
  { adm_id: 'ADM005', adm_name: 'Sourav Ganguly', module_id: 'TM006', module_title: 'Digital Sales Toolkit', progress: 100, quiz_score: 55, completed: true, started_at: '2023-12-01', completed_at: '2023-12-10' },
  { adm_id: 'ADM005', adm_name: 'Sourav Ganguly', module_id: 'TM007', module_title: 'Objection Handling Masterclass', progress: 50, quiz_score: null, completed: false, started_at: '2024-01-05', completed_at: null },
  { adm_id: 'ADM005', adm_name: 'Sourav Ganguly', module_id: 'TM008', module_title: 'Regulatory Compliance', progress: 100, quiz_score: 80, completed: true, started_at: '2023-11-22', completed_at: '2023-12-01' },
];
