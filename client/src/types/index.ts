export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'member';
  color: string;
  avatar: string;
  created_at?: string;
}

export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface Task {
  id: number;
  user_id: number;
  is_shared: number; // 0 = Personal, 1 = Compartida
  title: string;
  description?: string | null;
  priority: TaskPriority;
  due_date?: string | null; // YYYY-MM-DD
  due_time?: string | null; // HH:MM
  is_completed: number; // 0 o 1
  completed_by?: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_color?: string;
  creator_avatar?: string;
  completer_name?: string;
  completer_color?: string;
  shared_with?: { id: number; name: string; color: string; avatar: string }[];
}

export interface CalendarShift {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  type: 'work_shift' | 'off' | 'event';
  title: string;
  color: string;
  notes?: string | null;
  created_at?: string;
  user_name: string;
  user_color: string;
  user_avatar: string;
}

export interface MonthData {
  year: number;
  month: number;
  shifts: CalendarShift[];
  sharedTasks: Task[];
}

export type ActiveTab = 'personal' | 'shared' | 'calendar';
