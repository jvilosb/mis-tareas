import React, { useState, useEffect } from 'react';
import { Task, TaskPriority } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { X, Calendar, Clock, Flag, Users, Check, AlertCircle } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultShared?: boolean;
  defaultDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultShared = false,
  defaultDate,
}) => {
  const { user, users } = useAuth();
  const { createTask, updateTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isShared, setIsShared] = useState(defaultShared);
  const [sharedWithIds, setSharedWithIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.due_date || '');
      setDueTime(taskToEdit.due_time || '');
      setIsShared(taskToEdit.is_shared === 1);
      setSharedWithIds(taskToEdit.shared_with ? taskToEdit.shared_with.map((u) => u.id) : []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('media');
      setDueDate(defaultDate || '');
      setDueTime('');
      setIsShared(defaultShared);
      setSharedWithIds([]);
    }
    setError(null);
  }, [taskToEdit, isOpen, defaultShared, defaultDate]);

  if (!isOpen) return null;

  const handleToggleMember = (memberId: number) => {
    setSharedWithIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título de la tarea es obligatorio.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_date: dueDate || null,
          due_time: dueTime || null,
          is_shared: isShared ? 1 : 0,
          shared_with_ids: isShared ? sharedWithIds : [],
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_date: dueDate || null,
          due_time: dueTime || null,
          is_shared: isShared ? 1 : 0,
          shared_with_ids: isShared ? sharedWithIds : [],
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071b43]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#DBE2E9] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-[#00205B] to-[#0d2f70] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#71a0ff]" />
            <h2 className="text-lg font-black tracking-tight font-main">
              {taskToEdit ? 'Editar Tarea' : 'Nueva Tarea'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 font-secondary flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector Personal vs Compartida */}
          <div className="flex bg-[#F4F6F9] p-1.5 rounded-2xl border border-[#DBE2E9]">
            <button
              type="button"
              onClick={() => setIsShared(false)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                !isShared
                  ? 'bg-white text-[#00205B] shadow-sm border border-[#DBE2E9]'
                  : 'text-[#657184] hover:text-[#10203A]'
              }`}
            >
              <span>👤 Tarea Personal</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                Privada
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsShared(true)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                isShared
                  ? 'bg-[#00205B] text-white shadow-sm'
                  : 'text-[#657184] hover:text-[#10203A]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Tarea Compartida</span>
            </button>
          </div>

          {/* Si es compartida, seleccionar con quién */}
          {isShared && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#00205B]">
                <span>Compartir con:</span>
                <span className="text-[10px] text-[#657184] font-normal">
                  {sharedWithIds.length === 0 ? '(Visible para toda la familia)' : `(${sharedWithIds.length} seleccionados)`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {users
                  .filter((u) => u.id !== user?.id)
                  .map((member) => {
                    const isSelected = sharedWithIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleToggleMember(member.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#00205B] text-white border-[#00205B] shadow-sm'
                            : 'bg-white text-[#10203A] border-[#DBE2E9] hover:border-[#00205B]'
                        }`}
                      >
                        <span>{member.avatar}</span>
                        <span>{member.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#54e3a2]" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
              Título de la Tarea *
            </label>
            <input
              type="text"
              required
              placeholder="¿Qué necesitas hacer?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-sm text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] focus:ring-2 focus:ring-[#00205B]/10 transition-all"
            />
          </div>

          {/* Notas o descripción */}
          <div>
            <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
              Notas adicionales (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Detalles, enlaces o recordatorios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-sm text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] focus:ring-2 focus:ring-[#00205B]/10 transition-all resize-none"
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-[#657184]" />
              <span>Prioridad</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: 'baja', label: 'Baja', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                  { id: 'media', label: 'Media', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { id: 'alta', label: 'Alta', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                  { id: 'urgente', label: 'Urgente', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    priority === p.id
                      ? `${p.color} ring-2 ring-[#00205B] shadow-sm font-black`
                      : 'bg-[#F4F6F9] border-[#DBE2E9] text-[#657184] hover:bg-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha y Hora de vencimiento (para vincular al calendario) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#657184]" />
                <span>Fecha (Calendario)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-xs text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#657184]" />
                <span>Hora (opcional)</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-xs text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] transition-all"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DBE2E9]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-[#657184] hover:text-[#10203A] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#00205B] hover:bg-[#071b43] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer font-main"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{taskToEdit ? 'GUARDAR CAMBIOS' : 'CREAR TAREA'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
