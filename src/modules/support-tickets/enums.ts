export enum TicketCategory {
  BUG = 'bug',
  TECHNICAL_ISSUE = 'technical_issue',
  DASHBOARD_PROBLEM = 'dashboard_problem',
  MISSING_FEATURE = 'missing_feature',
  IMPROVEMENT_REQUEST = 'improvement_request',
  QUESTION = 'question',
  ONBOARDING_HELP = 'onboarding_help',
  KNOWLEDGE_REQUEST = 'knowledge_request',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}
