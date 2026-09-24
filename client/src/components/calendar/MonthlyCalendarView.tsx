import React, { useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { Task } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Briefcase,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  AlertCircle,
  Home,
  UserCheck,
} from 'lucide-react';

interface MonthlyCalendarViewProps {
  onOpenTaskModal: (task?: Task | null, defaultDate?: string) => void;
  onOpenShiftModal: () => void;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  onOpenTaskModal,
  onOpenShiftModal,
}) => {
  const { user, users } = useAuth();
  const { toggleTask } = useTasks();
  const {
    year,
    month,
    shifts,
    sharedTasks,
    selectedDate,
    setSelectedDate,
    prevMonth,
    nextMonth,
    toggleShift,
  } = useCalendar();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calcular días del mes actual y desfase del primer día
  const firstDayOfMonth = new Date(year, month - 1, 1);
  // getDay(): 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  // Ajustar para que Lunes sea 0 y Domingo sea 6
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper para formatear YYYY-MM-DD
  const formatDateStr = (dayNum: number) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  };

  // Turnos y tareas filtradas para el día seleccionado
  const selectedDateShifts = shifts.filter((s) => s.date === selectedDate);
  const selectedDateTasks = sharedTasks.filter((t) => t.due_date === selectedDate);

  // Fecha seleccionada formateada amigablemente
  const selectedDateObj = new Date(`${selectedDate}T00:00:00`);
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Contenedor Principal del Calendario */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-getram border border-[#DBE2E9]">
        {/* Cabecera del Calendario */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00205B]">
              <CalendarIcon className="w-5 h-5 text-[#2b67f6]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#10203A] font-main tracking-tight capitalize">
                {monthNames[month - 1]} {year}
              </h2>
              <p className="text-xs text-[#657184] font-secondary">
                Turnos de trabajo familiares (2x2) y tareas del mes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón para generar turnos 2x2 automáticos */}
            <button
              type="button"
              onClick={onOpenShiftModal}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#00205B] rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs font-main"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#2b67f6]" />
              <span>Generar Turnos 2x2</span>
            </button>

            {/* Controles de navegación de mes */}
            <div className="flex items-center bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl p-0.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-[#657184] hover:text-[#10203A] transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setSelectedDate(now.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-1 text-[11px] font-black text-[#00205B] hover:bg-white rounded-lg transition-colors font-main"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-[#657184] hover:text-[#10203A] transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Leyenda de Familiares */}
        <div className="mb-4 pb-4 border-b border-[#DBE2E9] flex flex-wrap items-center gap-3 text-xs font-secondary">
          <span className="text-[11px] font-bold text-[#657184] uppercase tracking-wider">
            Leyenda de Turnos:
          </span>
          {users.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-white shadow-2xs"
              style={{ borderColor: `${member.color}40` }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: member.color }}
              />
              <span>{member.avatar}</span>
              <span className="text-[#10203A]">{member.name}</span>
            </span>
          ))}
          <span className="text-[11px] text-[#657184] ml-auto hidden sm:inline">
            💡 Pincha cualquier día para ver detalles o marcar tu turno
          </span>
        </div>

        {/* Cuadrícula del Calendario */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Encabezados de días de la semana */}
          {daysOfWeek.map((day, idx) => (
            <div
              key={day}
              className={`text-center py-1.5 text-[11px] font-black uppercase tracking-wider font-secondary ${
                idx >= 5 ? 'text-blue-600' : 'text-[#657184]'
              }`}
            >
              {day}
            </div>
          ))}

          {/* Celdas vacías previas al día 1 */}
          {Array.from({ length: startingDayIndex }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="h-20 sm:h-24 rounded-2xl bg-slate-50/40 border border-transparent"
            />
          ))}

          {/* Días del mes */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = formatDateStr(dayNum);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            // Turnos y tareas de este día específico
            const dayShifts = shifts.filter((s) => s.date === dateStr);
            const dayTasks = sharedTasks.filter((t) => t.due_date === dateStr);

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 relative group ${
                  isSelected
                    ? 'border-[#00205B] ring-2 ring-[#00205B]/20 bg-blue-50/30 shadow-md'
                    : isToday
                    ? 'border-[#2b67f6] bg-blue-50/20 hover:border-[#00205B]/40'
                    : 'border-[#DBE2E9] bg-white hover:border-[#00205B]/40 hover:bg-[#F4F6F9]'
                }`}
              >
                {/* Número del día */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-main ${
                      isToday
                        ? 'bg-[#2b67f6] text-white shadow-xs'
                        : isSelected
                        ? 'bg-[#00205B] text-white'
                        : 'text-[#10203A]'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Indicador de tareas si existen */}
                  {dayTasks.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#00205B] ring-2 ring-white" title={`${dayTasks.length} tareas compartidas`} />
                  )}
                </div>

                {/* Badges de Turnos de Trabajo */}
                <div className="w-full space-y-1 overflow-hidden mt-1">
                  {dayShifts.slice(0, 2).map((shift) => (
                    <div
                      key={shift.id}
                      className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 text-white shadow-2xs"
                      style={{ backgroundColor: shift.color || shift.user_color }}
                      title={`${shift.user_name}: ${shift.title}`}
                    >
                      <span className="text-[10px] shrink-0">{shift.user_avatar}</span>
                      <span className="truncate">{shift.user_name}</span>
                    </div>
                  ))}

                  {dayShifts.length > 2 && (
                    <div className="text-[9px] font-bold text-[#657184] text-center">
                      +{dayShifts.length - 2} más
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel de Detalle del Día Seleccionado (Al pinchar en el calendario) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-getram border border-[#DBE2E9] space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DBE2E9] gap-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#657184] block mb-1">
              Día Seleccionado en el Calendario
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#00205B] font-main capitalize">
              {formattedSelectedDate}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenTaskModal(null, selectedDate)}
              className="px-3.5 py-2 bg-[#00205B] hover:bg-[#071b43] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all font-main cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Tarea para este Día</span>
            </button>
          </div>
        </div>

        {/* Sección: Estado de Disponibilidad de la Familia en este Día */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-[#657184] mb-3 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#00205B]" />
            <span>Disponibilidad y Turnos de Trabajo en Casa:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((member) => {
              const memberShift = selectedDateShifts.find((s) => s.user_id === member.id);
              const isWorking = !!memberShift;

              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isWorking
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{member.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#10203A] font-main">
                          {member.name}
                        </span>
                        {member.id === user?.id && (
                          <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-1.5 py-0.2 rounded">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-secondary font-bold mt-0.5">
                        {isWorking ? (
                          <span className="text-rose-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            {memberShift.title} (No está en casa)
                          </span>
                        ) : (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Home className="w-3 h-3 text-emerald-600" />
                            En casa / Libre
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón rápido para alternar turno con un clic */}
                  <button
                    type="button"
                    onClick={() => toggleShift(selectedDate, member.id)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border font-main cursor-pointer ${
                      isWorking
                        ? 'bg-white text-rose-700 border-rose-300 hover:bg-rose-100'
                        : 'bg-white text-[#00205B] border-[#DBE2E9] hover:border-[#00205B]'
                    }`}
                  >
                    {isWorking ? 'Quitar Turno' : '+ Marcar Turno'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección: Tareas Compartidas para este Día */}
        <div className="pt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#657184] mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#138a57]" />
            <span>Tareas Compartidas programadas para hoy ({selectedDateTasks.length}):</span>
          </h4>

          {selectedDateTasks.length === 0 ? (
            <div className="p-6 bg-[#F4F6F9] border border-dashed border-[#DBE2E9] rounded-2xl text-center text-xs text-[#657184]">
              No hay tareas compartidas programadas para este día.{' '}
              <button
                type="button"
                onClick={() => onOpenTaskModal(null, selectedDate)}
                className="text-[#00205B] font-bold underline hover:text-[#2b67f6] ml-1"
              >
                Crear una tarea ahora
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-white shadow-2xs ${
                    task.is_completed ? 'border-[#DBE2E9] opacity-60' : 'border-[#DBE2E9]'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className="text-[#657184] hover:text-[#00205B] shrink-0"
                    >
                      {task.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#138a57]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#DBE2E9]" />
                      )}
                    </button>
                    <span
                      className={`text-xs sm:text-sm font-bold truncate ${
                        task.is_completed ? 'line-through text-[#657184]' : 'text-[#10203A]'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: task.creator_color || '#00205B' }}
                  >
                    {task.creator_avatar} {task.creator_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
