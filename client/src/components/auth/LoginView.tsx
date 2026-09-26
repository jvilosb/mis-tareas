import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PulseBadge } from '../common/PulseBadge';
import { Lock, User, Eye, EyeOff, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { needsSetup, login, setup } = useAuth();

  // Estados para Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estados para Setup inicial
  const [name, setName] = useState('');
  const [color, setColor] = useState('#00205B');
  const [avatar, setAvatar] = useState('👨‍💻');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predefinedColors = [
    '#00205B', // Getram Navy
    '#2b67f6', // Azul eléctrico
    '#e11d48', // Rosa carmín
    '#7c3aed', // Violeta
    '#059669', // Verde esmeralda
    '#d97706', // Ámbar
  ];

  const predefinedAvatars = ['👨‍💻', '👩‍💼', '👧', '👦', '🏡', '⭐'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (needsSetup) {
        if (!name.trim() || !username.trim() || !password.trim()) {
          throw new Error('Por favor completa todos los campos.');
        }
        await setup(username, name, password, color, avatar);
      } else {
        if (!username.trim() || !password.trim()) {
          throw new Error('Por favor ingresa usuario y contraseña.');
        }
        await login(username, password, rememberMe);
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden bg-[#F4F6F9]">
      {/* Fondo con destello radial sutil estilo status.getram.cl */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-[#00205B]/10 to-transparent pointer-events-none rounded-full blur-3xl -z-10" />

      {/* Contenedor Principal */}
      <div className="w-full max-w-[460px] z-10">
        {/* Banner Hero estilo status.getram.cl */}
        <div className="bg-gradient-to-br from-[#00205B] to-[#0d2f70] text-white rounded-t-3xl p-7 relative overflow-hidden shadow-getram-hero border border-white/10">
          {/* Círculos decorativos de fondo */}
          <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-[#71a0ff]/20 pointer-events-none blur-xl" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-[#31d991]/15 pointer-events-none blur-lg" />

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              {/* Marca */}
              <div className="flex items-center gap-2.5">
                <img src="/icons/icon-192.png" alt="Tareas Metatron" className="w-7 h-7 rounded-lg object-cover shadow-xs border border-white/20" />
                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#cddcff]">
                  TAREAS METATRON · PLATAFORMA
                </span>
              </div>

              {/* Badge de pulso dinámico */}
              <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 flex items-center gap-2 text-[10px] font-black tracking-wider text-[#54e3a2]">
                <span className="w-2 h-2 rounded-full bg-[#54e3a2] relative">
                  <span className="animate-ping absolute inset-0 rounded-full bg-[#54e3a2] opacity-75" />
                </span>
                <span>{needsSetup ? 'NUEVA INSTALACIÓN' : 'SISTEMA PRIVADO'}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 leading-tight font-main">
              {needsSetup ? 'Configuración Inicial' : 'Control de Tareas y Turnos'}
            </h1>

            <p className="text-xs sm:text-sm text-[#d9e3f6] font-secondary leading-relaxed">
              {needsSetup
                ? 'Crea tu usuario maestro de administrador para iniciar tu espacio familiar.'
                : 'Acceso privado individual y sincronización familiar para Mac, iPhone e iPad.'}
            </p>
          </div>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-white rounded-b-3xl p-7 shadow-getram border-x border-b border-[#DBE2E9]">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5 font-secondary animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-secondary">
            {needsSetup && (
              <>
                <div>
                  <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
                    Tu Nombre Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej: Coke"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 pl-10 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-sm text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] focus:ring-2 focus:ring-[#00205B]/10 transition-all"
                    />
                    <Sparkles className="w-4 h-4 text-[#657184] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Selector de color y avatar */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
                      Tu Color Distintivo
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {predefinedColors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            color === c ? 'scale-110 border-[#10203A] shadow-sm' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
                      Tu Avatar
                    </label>
                    <div className="flex gap-1 flex-wrap">
                      {predefinedAvatars.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAvatar(a)}
                          className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center border transition-all ${
                            avatar === a ? 'bg-blue-50 border-[#00205B]' : 'bg-[#F4F6F9] border-[#DBE2E9]'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
                Usuario {needsSetup && '(para iniciar sesión)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="ej: coke"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-sm text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] focus:ring-2 focus:ring-[#00205B]/10 transition-all"
                />
                <User className="w-4 h-4 text-[#657184] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-[#657184] uppercase tracking-wider mb-1.5">
                Contraseña o PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 bg-[#F4F6F9] border border-[#DBE2E9] rounded-xl text-sm text-[#10203A] font-main focus:bg-white focus:outline-none focus:border-[#00205B] focus:ring-2 focus:ring-[#00205B]/10 transition-all"
                />
                <Lock className="w-4 h-4 text-[#657184] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#657184] hover:text-[#10203A] p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox de sesión persistente (clave para iPhone/iPad) */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#DBE2E9] text-[#00205B] focus:ring-[#00205B] accent-[#00205B]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-[#10203A] block">
                    Recordar en este equipo
                  </span>
                  <span className="text-[11px] text-[#657184] leading-tight block">
                    Sesión activa durante 30 días en tu Mac, iPhone o iPad.
                  </span>
                </div>
              </label>
            </div>

            {/* Botón de Acción */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-[#00205B] hover:bg-[#071b43] active:bg-[#0d2f70] text-white font-black text-sm tracking-wide rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer font-main"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : needsSetup ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#54e3a2]" />
                  <span>CREAR CUENTA MAESTRA</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#71a0ff]" />
                  <span>ENTRAR A MI PANEL</span>
                </>
              )}
            </button>
          </form>

          {/* Pie de tarjeta */}
          <div className="mt-6 pt-5 border-t border-[#DBE2E9] flex items-center justify-between text-[11px] text-[#657184] font-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#138a57]" />
              <span>Base SQLite Cifrada Local</span>
            </span>
            <span className="font-semibold text-[#00205B]">v1.0 PWA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
