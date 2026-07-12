export interface SnsAccount {
  provider: string;
  linked: boolean;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  email?: string;
  color: string;
  archived: boolean;
}

export interface Guest {
  name: string;
  email?: string;
  submitted: boolean;
  schedule: Record<string, boolean>; // key format: `W[week_num]-[day_name]-[time_slot]` e.g. "W1-화-18:00"
}

export interface Session {
  id: string | number;
  title: string;
  category: string;
  color: string;
  startDate: string;
  endDate: string;
  time_interval: number; // 30, 60, 120 (in minutes)
  guestMode: 'unspecified' | 'specified';
  status: '조율 중' | '확정';
  confirmedSlot: string | string[] | null;
  is_deleted: boolean;
  archived: boolean;
  duration: '1week' | '4weeks';
  guests: Guest[];
  expiry: string; // ISO datetime string: '2026-07-10T18:00'
  preventDuplicate: boolean;
  allowGuestMutation: boolean;
  adminEmails: string[];
  viewerEmails: string[];
}
