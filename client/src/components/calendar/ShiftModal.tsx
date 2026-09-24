import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCalendar } from '../../context/CalendarContext';
import { X, Calendar, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose }) => {
  const { user, users } = useAuth();
  const { batch2x2 } = useCalendar();

  const [selectedUserId, setSelectedUserId] = useState<number>(user?.id || 1);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workDays, setWorkDays] = useState(2);
  const [restDays, setRestDays] = useState(2);
  const [daysCount, setDaysCount] = useState(60); // 2 meses
  const [title, setTitle] = useState('Turno de Trabajo (2x2)');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);

    try {
      await batch2x2(selectedUserId, startDate, daysCount, workDays, restDays, title);
      const selectedMember = users.find((u) => u.id === selectedUserId);
      setSuccessMessage(
        `¡Turnos generados con éxito para ${selectedMember?.name || 'el familiar'}! Se han marcado en el calendario con su color distintivo.`
      );
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Error al generar los turnos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071b43]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#DBE2E9] overflow-hidden flex flex-col">
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-[#00205B] to-[#0d2f70] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-[#71a0ff]" />
            <h2 className="text-lg font-black tracking-tight font-main">
              Generar Turno de Trabajo (2x2)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4 font-secondary">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Seleccionar qué familiar trabaja */}
          <div>
            <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-2">
              ¿Quién tiene este turno de trabajo?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedUserId(member.id)}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                    selectedUserId === member.id
                      ? 'bg-blue-50/70 border-[#00205B] shadow-sm'
                      : 'bg-[#F4F6F9] border-[#DBE2E9] hover:bg-white'
                  }`}
                >
                  <span className="text-xl">{member.avatar}</span>
                  <div className="text-left overflow-hidden">
                    <span className="block text-xs font-black text-[#10203A] truncate">
                      {member.name}
                    </span>
                    <span
                      className="block text-[10px] font-bold uppercase truncate"
                      style={{ color: member.color }}
                    >
                      ● Color activo
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha de inicio */}
          <div>
            <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#657184]" />
              <span>Primer día de trabajo del ciclo</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-sm text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] transition-all"
            />
          </div>

          {/* Patrón de días (Por defecto 2x2) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1">
                Días de Trabajo Seguidos
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={workDays}
                onChange={(e) => setWorkDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-sm text-center font-black font-main text-[#00205B]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1">
                Días de Descanso (En Casa)
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={restDays}
                onChange={(e) => setRestDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-sm text-center font-black font-main text-[#138a57]"
              />
            </div>
          </div>

          {/* Etiqueta del turno */}
          <div>
            <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
              Etiqueta visible en el calendario
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-xs text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] transition-all"
            />
          </div>

          {/* Período de proyección */}
          <div>
            <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
              Proyectar durante
            </label>
            <select
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-xs text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B]"
            >
              <option value="30">30 días (1 mes)</option>
              <option value="60">60 días (2 meses recomendados)</option>
              <option value="90">90 días (3 meses)</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DBE2E9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#657184] hover:text-[#10203A] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#00205B] hover:bg-[#071b43] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer font-main"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#54e3a2]" />
              <span>{loading ? 'GENERANDO...' : 'GENERAR EN EL MAPA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
