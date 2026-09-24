import React from 'react';

interface PulseBadgeProps {
  label?: string;
  status?: 'ok' | 'warn' | 'down';
  className?: string;
}

export const PulseBadge: React.FC<PulseBadgeProps> = ({
  label = 'SISTEMA OPERATIVO · PRIVADO',
  status = 'ok',
  className = '',
}) => {
  const getColors = () => {
    switch (status) {
      case 'warn':
        return {
          bg: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
          dot: 'bg-amber-500',
          ring: 'border-amber-500/30',
        };
      case 'down':
        return {
          bg: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
          dot: 'bg-rose-500',
          ring: 'border-rose-500/30',
        };
      default:
        return {
          bg: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
          dot: 'bg-emerald-400',
          ring: 'border-emerald-400/40',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${colors.bg} ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.dot}`}
        ></span>
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.dot}`}></span>
      </span>
      <span>{label}</span>
    </div>
  );
};
