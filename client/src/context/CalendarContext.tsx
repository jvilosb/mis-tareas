import React, { createContext, useContext, useState, useEffect } from 'react';
import { CalendarShift, Task } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CalendarContextType {
  year: number;
  month: number;
  shifts: CalendarShift[];
  sharedTasks: Task[];
  selectedDate: string; // YYYY-MM-DD
  loading: boolean;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
  setSelectedDate: (d: string) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  refreshMonth: () => Promise<void>;
  toggleShift: (date: string, userId?: number, title?: string, color?: string) => Promise<void>;
  batch2x2: (userId: number, startDate: string, daysCount?: number, workDays?: number, restDays?: number, title?: string) => Promise<void>;
  deleteShift: (id: number) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [shifts, setShifts] = useState<CalendarShift[]>([]);
  const [sharedTasks, setSharedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshMonth = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.calendar.getMonth(year, month);
      setShifts(data.shifts);
      setSharedTasks(data.sharedTasks);
    } catch (err) {
      console.error('Error al cargar calendario del mes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshMonth();
    }
  }, [user, year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const toggleShift = async (date: string, userId?: number, title?: string, color?: string) => {
    await api.calendar.toggleShift({
      date,
      user_id: userId || user?.id,
      title,
      color,
    });
    await refreshMonth();
  };

  const batch2x2 = async (
    userId: number,
    startDate: string,
    daysCount = 60,
    workDays = 2,
    restDays = 2,
    title?: string
  ) => {
    await api.calendar.batch2x2({
      user_id: userId,
      start_date: startDate,
      days_count: daysCount,
      work_days: workDays,
      rest_days: restDays,
      title,
    });
    await refreshMonth();
  };

  const deleteShift = async (id: number) => {
    await api.calendar.deleteShift(id);
    await refreshMonth();
  };

  return (
    <CalendarContext.Provider
      value={{
        year,
        month,
        shifts,
        sharedTasks,
        selectedDate,
        loading,
        setYear,
        setMonth,
        setSelectedDate,
        prevMonth,
        nextMonth,
        refreshMonth,
        toggleShift,
        batch2x2,
        deleteShift,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar debe ser usado dentro de un CalendarProvider');
  }
  return context;
};
