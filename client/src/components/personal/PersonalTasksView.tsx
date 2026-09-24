import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Task } from '../../types';
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Calendar,
  Clock,
  Flag,
  Trash2,
  Edit2,
  Sparkles,
  Lock,
} from 'lucide-react';

interface PersonalTasksViewProps {
  onOpenTaskModal: (task?: Task | null) => void;
}

export const PersonalTasksView: React.FC<PersonalTasksViewProps> = ({ onOpenTaskModal }) => {
  const { personalTasks, createTask, toggleTask, deleteTask, loading } = useTasks();
  const [quickTitle, setQuickTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [search, setSearch] = useState('');

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      await createTask({
        title: quickTitle.trim(),
        is_shared: 0,
        priority: 'media',
      });
      setQuickTitle('');
    } catch (err: any) {
      alert(err.message || 'Error al crear la tarea rápida');
    }
  };

  const filteredTasks = personalTasks.filter((task) => {
    if (filter === 'pending' && task.is_completed) return false;
    if (filter === 'completed' && !task.is_completed) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        (task.description && task.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = personalTasks.filter((t) => !t.is_completed).length;
  const completedCount = personalTasks.filter((t) => t.is_completed).length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Urgente
          </span>
        );
      case 'alta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
            Alta
          </span>
        );
      case 'baja':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
            Baja
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            Media
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Cabecera de la Sección con Estilo status.getram.cl */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-getram border border-[#DBE2E9] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black uppercase tracking-wider text-[#00205B] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#00205B]" />
                <span>Espacio 100% Privado</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#10203A] tracking-tight font-main">
              Tareas Personales
            </h1>
            <p className="text-xs sm:text-sm text-[#657184] font-secondary mt-1">
              Organiza tus pendientes individuales. Solo tú puedes ver y gestionar estas tareas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#F4F6F9] border border-[#DBE2E9] rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-2xl font-black text-[#00205B] font-main leading-tight">
                {pendingCount}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#657184]">
                Pendientes
              </span>
            </div>
            <div className="bg-[#F4F6F9] border border-[#DBE2E9] rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-2xl font-black text-[#138a57] font-main leading-tight">
                {completedCount}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#657184]">
                Listas
              </span>
            </div>
          </div>
        </div>

        {/* Input Rápido de Tareas */}
        <form onSubmit={handleQuickAdd} className="mt-6 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Escribe una tarea y presiona Enter para agregarla..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#F4F6F9] border border-[#DBE2E9] rounded-2xl text-sm text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] focus:ring-2 focus:ring-[#00205B]/10 transition-all placeholder:text-[#657184]/70"
            />
          </div>
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-5 py-3 bg-[#00205B] hover:bg-[#071b43] active:bg-[#0d2f70] text-white rounded-2xl font-black text-xs tracking-wider flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 font-main cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">AGREGAR</span>
          </button>
        </form>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Píldoras de filtro */}
        <div className="flex bg-white p-1 rounded-2xl border border-[#DBE2E9] shadow-sm font-secondary">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'pending'
                ? 'bg-[#00205B] text-white shadow-sm'
                : 'text-[#657184] hover:text-[#10203A]'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'completed'
                ? 'bg-[#00205B] text-white shadow-sm'
                : 'text-[#657184] hover:text-[#10203A]'
            }`}
          >
            Completadas ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#00205B] text-white shadow-sm'
                : 'text-[#657184] hover:text-[#10203A]'
            }`}
          >
            Todas ({personalTasks.length})
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar en mis tareas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2 pl-9 bg-white border border-[#DBE2E9] rounded-xl text-xs text-[#10203A] font-main focus:outline-none focus:border-[#00205B] shadow-sm"
          />
          <Search className="w-4 h-4 text-[#657184] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#DBE2E9] shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#edf3ff] text-[#00205B] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-[#10203A] font-main">
              {filter === 'completed'
                ? 'No tienes tareas completadas aún'
                : 'No hay tareas pendientes'}
            </h3>
            <p className="text-xs text-[#657184] font-secondary max-w-sm mx-auto mt-1">
              {filter === 'completed'
                ? 'Cuando marques tareas como listas aparecerán en este registro.'
                : '¡Buen trabajo! Disfruta de tu tiempo o escribe una nueva tarea arriba.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-sm flex items-start justify-between gap-3 group hover:shadow-getram-hover ${
                task.is_completed
                  ? 'border-[#DBE2E9]/60 opacity-60 bg-slate-50/50'
                  : 'border-[#DBE2E9] hover:border-[#00205B]/30'
              }`}
            >
              {/* Checkbox y Contenido */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleTask(task)}
                  className="mt-0.5 text-[#657184] hover:text-[#00205B] transition-colors shrink-0"
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#138a57]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#DBE2E9] hover:text-[#00205B]" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-sm sm:text-base font-bold font-main truncate ${
                        task.is_completed ? 'line-through text-[#657184]' : 'text-[#10203A]'
                      }`}
                    >
                      {task.title}
                    </span>
                    {getPriorityBadge(task.priority)}
                  </div>

                  {task.description && (
                    <p className="text-xs text-[#657184] font-secondary line-clamp-2 mb-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Metadatos: Fecha / Hora */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#657184] font-secondary">
                    {task.due_date && (
                      <span className="flex items-center gap-1 font-semibold text-[#00205B] bg-blue-50/80 px-2 py-0.5 rounded-lg border border-blue-100">
                        <Calendar className="w-3 h-3 text-[#2b67f6]" />
                        <span>{task.due_date}</span>
                        {task.due_time && (
                          <span className="text-[#657184] ml-1">({task.due_time})</span>
                        )}
                      </span>
                    )}

                    {task.is_completed && task.completed_at && (
                      <span className="text-[10px] text-emerald-700">
                        Completada el {new Date(task.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción (Editar / Eliminar) */}
              <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenTaskModal(task)}
                  className="p-1.5 text-[#657184] hover:text-[#00205B] rounded-lg hover:bg-[#F4F6F9] transition-colors"
                  title="Editar tarea"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Eliminar esta tarea personal?')) {
                      deleteTask(task.id);
                    }
                  }}
                  className="p-1.5 text-[#657184] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
