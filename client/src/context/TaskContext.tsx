import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface TaskContextType {
  personalTasks: Task[];
  sharedTasks: Task[];
  loading: boolean;
  refreshTasks: () => Promise<void>;
  createTask: (data: Partial<Task> & { shared_with_ids?: number[] }) => Promise<Task>;
  updateTask: (id: number, data: Partial<Task> & { shared_with_ids?: number[] }) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [sharedTasks, setSharedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [personalRes, sharedRes] = await Promise.all([
        api.tasks.getPersonal('all'),
        api.tasks.getShared('all'),
      ]);
      setPersonalTasks(personalRes.tasks);
      setSharedTasks(sharedRes.tasks);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshTasks();
    } else {
      setPersonalTasks([]);
      setSharedTasks([]);
    }
  }, [user]);

  const createTask = async (data: Partial<Task> & { shared_with_ids?: number[] }) => {
    const res = await api.tasks.create(data);
    if (data.is_shared) {
      setSharedTasks((prev) => [res.task, ...prev]);
    } else {
      setPersonalTasks((prev) => [res.task, ...prev]);
    }
    return res.task;
  };

  const updateTask = async (id: number, data: Partial<Task> & { shared_with_ids?: number[] }) => {
    const res = await api.tasks.update(id, data);
    const updated = res.task;

    if (updated.is_shared) {
      setSharedTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } else {
      setPersonalTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  };

  const deleteTask = async (id: number) => {
    await api.tasks.delete(id);
    setPersonalTasks((prev) => prev.filter((t) => t.id !== id));
    setSharedTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.is_completed ? 0 : 1;
    await updateTask(task.id, { is_completed: newStatus });
  };

  return (
    <TaskContext.Provider
      value={{
        personalTasks,
        sharedTasks,
        loading,
        refreshTasks,
        createTask,
        updateTask,
        deleteTask,
        toggleTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks debe ser usado dentro de un TaskProvider');
  }
  return context;
};
