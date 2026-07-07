export type NotificationCategory = 'users' | 'offers' | 'knowledge' | 'badges' | 'settings' | 'reports' | 'system';

interface NotificationMeta {
  category: NotificationCategory;
  icon: string;
  color: string;
}

/** Single source of truth for icon/color/category per notification type, so callers only pass a `type`. */
export const NOTIFICATION_META: Record<string, NotificationMeta> = {
  // Users
  new_collecteur: { category: 'users', icon: 'UserPlus', color: '#3b82f6' },
  new_recycleur: { category: 'users', icon: 'UserPlus', color: '#3b82f6' },
  new_user: { category: 'users', icon: 'UserPlus', color: '#3b82f6' },
  user_verified: { category: 'users', icon: 'UserCheck', color: '#4d9538' },
  user_updated: { category: 'users', icon: 'User', color: '#3b82f6' },
  user_deleted: { category: 'users', icon: 'UserX', color: '#c41539' },
  user_suspended: { category: 'users', icon: 'Ban', color: '#c41539' },
  user_reactivated: { category: 'users', icon: 'UserCheck', color: '#4d9538' },

  // Offers
  offer_created: { category: 'offers', icon: 'Package', color: '#4d9538' },
  offer_updated: { category: 'offers', icon: 'Package', color: '#3b82f6' },
  offer_approved: { category: 'offers', icon: 'CheckCircle', color: '#4d9538' },
  offer_rejected: { category: 'offers', icon: 'XCircle', color: '#c41539' },
  offer_expired: { category: 'offers', icon: 'Clock', color: '#9ca3af' },
  offer_deleted: { category: 'offers', icon: 'Trash2', color: '#c41539' },

  // Savoir-faire (knowledge)
  article_created: { category: 'knowledge', icon: 'BookOpen', color: '#4d9538' },
  article_updated: { category: 'knowledge', icon: 'BookOpen', color: '#3b82f6' },
  article_published: { category: 'knowledge', icon: 'BookOpen', color: '#4d9538' },
  article_unpublished: { category: 'knowledge', icon: 'BookOpen', color: '#9ca3af' },
  article_deleted: { category: 'knowledge', icon: 'Trash2', color: '#c41539' },

  // Badges
  badge_created: { category: 'badges', icon: 'Award', color: '#f5c518' },
  badge_updated: { category: 'badges', icon: 'Award', color: '#3b82f6' },
  badge_awarded: { category: 'badges', icon: 'Award', color: '#f5c518' },
  badge_deleted: { category: 'badges', icon: 'Trash2', color: '#c41539' },

  // Settings
  settings_updated: { category: 'settings', icon: 'Settings', color: '#038543' },

  // Reports
  report: { category: 'reports', icon: 'AlertTriangle', color: '#c41539' },
  report_approved: { category: 'reports', icon: 'CheckCircle', color: '#4d9538' },
  report_rejected: { category: 'reports', icon: 'XCircle', color: '#9ca3af' },

  // System (generic fallback, no automated trigger wired yet — see project notes)
  system: { category: 'system', icon: 'Bell', color: '#038543' },
};

export const DEFAULT_NOTIFICATION_META: NotificationMeta = { category: 'system', icon: 'Bell', color: '#4d9538' };
