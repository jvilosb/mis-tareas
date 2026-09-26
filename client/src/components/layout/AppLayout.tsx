import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ActiveTab, Task } from '../../types';
import { PulseBadge } from '../common/PulseBadge';
import { PersonalTasksView } from '../personal/PersonalTasksView';
import { SharedTasksView } from '../shared/SharedTasksView';
import { MonthlyCalendarView } from '../calendar/MonthlyCalendarView';
import { TaskModal } from '../tasks/TaskModal';
import { ShiftModal } from '../calendar/ShiftModal';
import { SettingsModal } from '../settings/SettingsModal';
import {
  User as UserIcon,
  Users,
  Calendar,
  Settings,
  LogOut,
  Plus,
  Shield,
  Bell,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { personalTasks, sharedTasks } = useTasks();

  const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskModalDefaultShared, setTaskModalDefaultShared] = useState(false);
  const [taskModalDefaultDate, setTaskModalDefaultDate] = useState<string | undefined>();
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const pendingPersonal = personalTasks.filter((t) => !t.is_completed).length;
  const pendingShared = sharedTasks.filter((t) => !t.is_completed).length;

  const handleOpenTaskModal = (task?: Task | null, defaultDate?: string) => {
    setTaskToEdit(task || null);
    setTaskModalDefaultShared(activeTab === 'shared');
    setTaskModalDefaultDate(defaultDate);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#00205B] selection:text-white pb-24 sm:pb-8">
      {/* Barra de Navegación Superior estilo status.getram.cl */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DBE2E9] shadow-xs pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo y Marca */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <img src="/icons/icon-192.png" alt="Tareas Metatron" className="w-7 h-7 rounded-lg object-cover shadow-xs border border-[#DBE2E9]" />
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#00205B] font-main">
                TAREAS METATRON
              </span>
            </div>
            <PulseBadge label="SISTEMA ACTIVO" className="hidden sm:inline-flex" />
          </div>

          {/* Navegación Central de Escritorio */}
          <nav className="hidden md:flex items-center bg-[#F4F6F9] p-1 rounded-2xl border border-[#DBE2E9] font-secondary">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`py-1.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'personal'
                  ? 'bg-[#00205B] text-white shadow-xs'
                  : 'text-[#657184] hover:text-[#10203A]'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Tareas Personales</span>
              {pendingPersonal > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'personal' ? 'bg-white/20 text-white' : 'bg-[#DBE2E9] text-[#10203A]'
                  }`}
                >
                  {pendingPersonal}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shared')}
              className={`py-1.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'shared'
                  ? 'bg-[#00205B] text-white shadow-xs'
                  : 'text-[#657184] hover:text-[#10203A]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tareas Compartidas</span>
              {pendingShared > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'shared' ? 'bg-white/20 text-white' : 'bg-[#DBE2E9] text-[#10203A]'
                  }`}
                >
                  {pendingShared}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`py-1.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'calendar'
                  ? 'bg-[#00205B] text-white shadow-xs'
                  : 'text-[#657184] hover:text-[#10203A]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario y Turnos</span>
            </button>
          </nav>

          {/* Menú de Usuario y Acciones */}
          <div className="flex items-center gap-2">
            {/* Perfil del usuario actual */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F6F9] border border-[#DBE2E9]">
              <span className="text-base">{user?.avatar}</span>
              <span className="text-xs font-black text-[#10203A] font-main hidden sm:inline">
                {user?.name}
              </span>
              <span
                className="w-2 h-2 rounded-full hidden sm:inline"
                style={{ backgroundColor: user?.color }}
                title="Tu color de calendario"
              />
            </div>

            {/* Botón de Notificaciones */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl text-[#657184] hover:text-[#00205B] hover:bg-[#F4F6F9] transition-colors"
              title="Avisos y Notificaciones"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Botón de Ajustes */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl text-[#657184] hover:text-[#00205B] hover:bg-[#F4F6F9] transition-colors"
              title="Configuración y Familia"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Botón de Cerrar Sesión */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl text-[#657184] hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {activeTab === 'personal' && (
          <PersonalTasksView onOpenTaskModal={(t) => handleOpenTaskModal(t)} />
        )}

        {activeTab === 'shared' && (
          <SharedTasksView
            onOpenTaskModal={(t) => handleOpenTaskModal(t)}
            onGoToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'calendar' && (
          <MonthlyCalendarView
            onOpenTaskModal={(t, defaultDate) => handleOpenTaskModal(t, defaultDate)}
            onOpenShiftModal={() => setIsShiftModalOpen(true)}
          />
        )}
      </main>

      {/* Barra de Navegación Inferior para Móviles (iPhone / iPad) con Safe-Area */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#DBE2E9] safe-bottom shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 font-secondary">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'personal' ? 'text-[#00205B] font-black' : 'text-[#657184]'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px]">Personales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shared')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'shared' ? 'text-[#00205B] font-black' : 'text-[#657184]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Compartidas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'calendar' ? 'text-[#00205B] font-black' : 'text-[#657184]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Calendario</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[#657184]"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Ajustes</span>
          </button>
        </div>
      </div>

      {/* Botón Flotante para "+ Nueva Tarea" en Móviles */}
      <button
        type="button"
        onClick={() => handleOpenTaskModal()}
        className="md:hidden fixed right-5 bottom-20 z-40 w-12 h-12 rounded-full bg-[#00205B] hover:bg-[#071b43] text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
        title="Crear nueva tarea"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modales */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        defaultShared={taskModalDefaultShared}
        defaultDate={taskModalDefaultDate}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};
