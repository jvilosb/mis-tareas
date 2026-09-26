import { Task, User, MonthData } from '../types';

const API_BASE = '/api';

// La sesión viaja en una cookie httpOnly (no accesible desde JavaScript).
// No guardamos el token en localStorage para que un XSS no pueda robar la sesión.

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Envía la cookie de sesión httpOnly
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error en el servidor (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Autenticación y Familia
  auth: {
    me: () => request<{ needsSetup: boolean; user: User | null }>('/auth/me'),
    setup: (body: any) => request<{ user: User }>('/auth/setup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
    getUsers: () => request<{ users: User[] }>('/auth/users'),
    createUser: (body: any) => request<{ user: User }>('/auth/users', { method: 'POST', body: JSON.stringify(body) }),
    deleteUser: (id: number) => request<{ success: boolean }>(`/auth/users/${id}`, { method: 'DELETE' }),
    updateUser: (id: number, body: any) => request<{ user: User }>(`/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },

  // Tareas
  tasks: {
    getPersonal: (status = 'all', search = '') =>
      request<{ tasks: Task[] }>(`/tasks/personal?status=${status}&search=${encodeURIComponent(search)}`),
    getShared: (status = 'all', search = '', memberId?: number) => {
      let url = `/tasks/shared?status=${status}&search=${encodeURIComponent(search)}`;
      if (memberId) url += `&memberId=${memberId}`;
      return request<{ tasks: Task[] }>(url);
    },
    create: (body: Partial<Task> & { shared_with_ids?: number[] }) =>
      request<{ task: Task }>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Task> & { shared_with_ids?: number[] }) =>
      request<{ task: Task }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: number) => request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // Calendario y Turnos de Trabajo
  calendar: {
    getMonth: (year: number, month: number) =>
      request<MonthData>(`/calendar/month?year=${year}&month=${month}`),
    toggleShift: (body: { user_id?: number; date: string; title?: string; color?: string; type?: string; notes?: string }) =>
      request<{ action: 'created' | 'deleted'; shift?: any }>('/calendar/shift', { method: 'POST', body: JSON.stringify(body) }),
    batch2x2: (body: { user_id: number; start_date: string; days_count?: number; work_days?: number; rest_days?: number; title?: string }) =>
      request<{ success: boolean; message: string; created_dates: string[] }>('/calendar/shift/batch-2x2', { method: 'POST', body: JSON.stringify(body) }),
    deleteShift: (id: number) =>
      request<{ success: boolean; id: number }>(`/calendar/shift/${id}`, { method: 'DELETE' }),
  },

  // Respaldo
  backup: {
    exportUrl: `${API_BASE}/backup/export`,
    importData: (data: any) =>
      request<{ success: boolean; message: string }>('/backup/import', { method: 'POST', body: JSON.stringify(data) }),
  },
};
