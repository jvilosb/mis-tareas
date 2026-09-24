import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  X,
  Users,
  Database,
  Smartphone,
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Shield,
  Apple,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, users, refreshUsers } = useAuth();
  const [activeTab, setActiveTab] = useState<'family' | 'backup' | 'pwa'>('family');

  // Formulario nuevo familiar
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [color, setColor] = useState('#e11d48'); // Color rosa/morado por defecto para esposa
  const [avatar, setAvatar] = useState('👩‍💼');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const predefinedColors = [
    '#e11d48', // Rosa carmín
    '#00205B', // Getram Navy
    '#2b67f6', // Azul eléctrico
    '#7c3aed', // Violeta
    '#059669', // Verde esmeralda
    '#d97706', // Ámbar
    '#0284c7', // Celeste
    '#db2777', // Fucsia
  ];

  const predefinedAvatars = ['👩‍💼', '👨‍💻', '👧', '👦', '👵', '👴', '⭐', '🏡'];

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Completa todos los campos del nuevo familiar.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.auth.createUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        color,
        avatar,
        role: 'member',
      });
      await refreshUsers();
      setName('');
      setUsername('');
      setPassword('');
      setMessage({ type: 'ok', text: `¡Familiar ${name} agregado con éxito!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al agregar familiar' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!confirm(`¿Eliminar la cuenta de ${memberName}?`)) return;

    try {
      await api.auth.deleteUser(memberId);
      await refreshUsers();
      setMessage({ type: 'ok', text: `Cuenta de ${memberName} eliminada.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al eliminar' });
    }
  };

  const handleExportBackup = () => {
    window.location.href = api.backup.exportUrl;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.backup.importData(json);
        alert('Copia de seguridad restaurada con éxito.');
        window.location.reload();
      } catch (err: any) {
        alert('Error al importar el archivo JSON: ' + (err.message || 'Archivo inválido'));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071b43]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-[#DBE2E9] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-[#00205B] to-[#0d2f70] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#71a0ff]" />
            <h2 className="text-lg font-black tracking-tight font-main">
              Configuración y Familia
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex bg-[#F4F6F9] border-b border-[#DBE2E9] p-1.5 font-secondary text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('family')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'family'
                ? 'bg-white text-[#00205B] shadow-xs'
                : 'text-[#657184] hover:text-[#10203A]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Familiares ({users.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'backup'
                ? 'bg-white text-[#00205B] shadow-xs'
                : 'text-[#657184] hover:text-[#10203A]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Copia de Seguridad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pwa'
                ? 'bg-white text-[#00205B] shadow-xs'
                : 'text-[#657184] hover:text-[#10203A]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar PWA</span>
          </button>
        </div>

        {/* Contenido según Pestaña */}
        <div className="p-6 overflow-y-auto space-y-5 font-secondary flex-1">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* TAB 1: GESTIÓN DE FAMILIARES */}
          {activeTab === 'family' && (
            <div className="space-y-5">
              {/* Lista actual de familiares */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#657184] mb-2.5">
                  Miembros Registrados en tu Hogar
                </h4>
                <div className="space-y-2">
                  {users.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl border border-[#DBE2E9] bg-[#F4F6F9] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{member.avatar}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#10203A] font-main">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-[#657184]">(@{member.username})</span>
                            {member.role === 'admin' && (
                              <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: member.color }}
                            />
                            <span className="text-[10px] font-bold" style={{ color: member.color }}>
                              Color de turnos en calendario
                            </span>
                          </div>
                        </div>
                      </div>

                      {user?.role === 'admin' && member.id !== user?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Eliminar familiar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulario para agregar familiar */}
              {user?.role === 'admin' && (
                <form
                  onSubmit={handleAddMember}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 bg-blue-50/20 space-y-3.5"
                >
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#00205B] flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#2b67f6]" />
                    <span>Agregar Nuevo Familiar (Esposa, Hijos)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1">
                        Nombre Visible
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Andrea"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#DBE2E9] rounded-xl text-xs text-[#10203A] font-main focus:outline-none focus:border-[#00205B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1">
                        Usuario (login)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ej: andrea"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#DBE2E9] rounded-xl text-xs text-[#10203A] font-main focus:outline-none focus:border-[#00205B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1">
                      Contraseña o PIN para este familiar
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DBE2E9] rounded-xl text-xs text-[#10203A] font-main focus:outline-none focus:border-[#00205B]"
                    />
                  </div>

                  {/* Selector de color y avatar */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1">
                        Color en Calendario
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {predefinedColors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-5 h-5 rounded-full border-2 transition-transform ${
                              color === c ? 'scale-110 border-[#10203A] shadow-xs' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#657184] uppercase tracking-wider mb-1">
                        Avatar
                      </label>
                      <div className="flex gap-1 flex-wrap">
                        {predefinedAvatars.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setAvatar(a)}
                            className={`w-6 h-6 text-xs rounded-lg flex items-center justify-center border transition-all ${
                              avatar === a
                                ? 'bg-blue-50 border-[#00205B]'
                                : 'bg-white border-[#DBE2E9]'
                            }`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#00205B] hover:bg-[#071b43] text-white text-xs font-black rounded-xl shadow-xs transition-all font-main cursor-pointer"
                  >
                    {loading ? 'AGREGANDO...' : '+ REGISTRAR FAMILIAR'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: COPIA DE SEGURIDAD (BACKUP) */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-[#10203A] leading-relaxed">
                <span className="font-bold text-[#00205B] block mb-1">
                  📦 Respaldo Total de Datos y Tareas
                </span>
                Puedes exportar todas tus tareas y turnos a un archivo JSON en cualquier momento para
                guardarlo en tu Mac o migrarlo a otro VPS.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="p-4 rounded-2xl border border-[#DBE2E9] bg-white hover:border-[#00205B] hover:bg-[#F4F6F9] text-left transition-all group flex flex-col justify-between h-28"
                >
                  <Download className="w-5 h-5 text-[#2b67f6] mb-2" />
                  <div>
                    <span className="block text-xs font-black text-[#10203A] font-main">
                      Descargar Respaldo JSON
                    </span>
                    <span className="text-[10px] text-[#657184]">
                      Descarga un archivo con todas las tareas y turnos.
                    </span>
                  </div>
                </button>

                <label className="p-4 rounded-2xl border border-[#DBE2E9] bg-white hover:border-[#00205B] hover:bg-[#F4F6F9] text-left transition-all group flex flex-col justify-between h-28 cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-[#138a57] mb-2" />
                  <div>
                    <span className="block text-xs font-black text-[#10203A] font-main">
                      Restaurar desde JSON
                    </span>
                    <span className="text-[10px] text-[#657184]">
                      Sube un archivo de respaldo para restaurar datos.
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-4 rounded-2xl border border-[#DBE2E9] bg-[#F4F6F9] text-xs space-y-1 text-[#657184]">
                <span className="font-bold text-[#10203A] block">Ubicación física en tu VPS:</span>
                <code className="text-[11px] bg-white px-2 py-0.5 rounded border border-[#DBE2E9] block font-mono text-[#00205B]">
                  ./data/tasks.db
                </code>
                <span className="text-[11px] block mt-1">
                  En Docker, basta con copiar esa carpeta para llevarte todo a cualquier otro servidor.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: GUÍA DE INSTALACIÓN PWA */}
          {activeTab === 'pwa' && (
            <div className="space-y-4 text-xs font-secondary">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00205B] to-[#0d2f70] text-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <Apple className="w-5 h-5 text-[#71a0ff]" />
                  <span className="font-black text-sm font-main">
                    Instalar en Apple (Mac, iPhone, iPad)
                  </span>
                </div>
                <p className="text-[11px] text-[#d9e3f6] leading-relaxed">
                  RamTask es una Progressive Web App (PWA) de última generación. No necesitas App Store:
                  se instala directamente en tu pantalla de inicio o dock como una app nativa.
                </p>
              </div>

              <div className="space-y-3">
                {/* Paso a paso iPhone / iPad */}
                <div className="p-4 rounded-2xl border border-[#DBE2E9] bg-white space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-xs text-[#00205B] font-main">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#00205B] flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>En iPhone e iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside text-[#657184] text-[11px] space-y-1 pl-1">
                    <li>Abre esta web en <b>Safari</b> desde tu iPhone o iPad.</li>
                    <li>Pulsa el botón de <b>Compartir</b> (el icono con la flecha hacia arriba ⎋).</li>
                    <li>Desplázate hacia abajo y selecciona <b>"Añadir a pantalla de inicio"</b>.</li>
                    <li>Pulsa "Añadir". ¡Listo! La app aparecerá con su icono en tu pantalla de inicio.</li>
                  </ol>
                </div>

                {/* Paso a paso Mac */}
                <div className="p-4 rounded-2xl border border-[#DBE2E9] bg-white space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-xs text-[#00205B] font-main">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-[#00205B] flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>En Mac (macOS Sonoma / Safari / Chrome):</span>
                  </div>
                  <ol className="list-decimal list-inside text-[#657184] text-[11px] space-y-1 pl-1">
                    <li>En Safari, haz clic en el menú superior <b>Archivo</b>.</li>
                    <li>Selecciona <b>"Añadir al Dock..."</b>.</li>
                    <li>
                      Se creará una app independiente en tu Dock que abre en ventana dedicada sin barras de navegación.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
