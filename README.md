# 📋 RamTask

> Aplicación de tareas personales, tareas compartidas y calendario familiar con turnos de trabajo (2x2), auto-hospedada con **Docker** e instalable como **PWA** en macOS, iPhone e iPad.

Inspirada en el diseño moderno, limpio y corporativo de `status.getram.cl` (fuentes *Lato*, *Mulish*, *Inter*, azul marino `#00205B` y badges dinámicos con animación de pulso).

---

## ✨ Características Principales

- 👤 **Tareas Personales (100% Privadas)**: Cada miembro registrado tiene su propio espacio confidencial para pendientes personales que nadie más puede ver.
- 👥 **Tareas Compartidas Familiares**: Coordina las tareas del hogar con tu esposa e hijos, indicando quién la completó y asignando miembros específicos.
- 📅 **Calendario Mensual Interactivo & Turnos 2x2**:
  - Mapa mensual visual de tareas compartidas.
  - **Detector de Turnos de Trabajo**: Tu esposa (o tú) puede marcar días de trabajo con un clic o generar automáticamente el patrón **2x2** (2 días trabajo, 2 días descanso).
  - Los días de trabajo se colorean con el tono distintivo de cada familiar para saber de un vistazo cuándo no estará en casa.
- 📱 **Progressive Web App (PWA)**:
  - Instalable en pantalla de inicio de iPhone e iPad sin App Store.
  - Añadible al Dock en macOS como app de escritorio independiente.
  - Soporte para safe-area (notch e isla dinámica de iPhone).
  - Caché offline mediante Service Worker.
- 🐳 **Docker-First & Migración Fácil**:
  - Despliegue en 1 comando: `docker compose up -d`.
  - Persistencia de datos en `./data/tasks.db` con SQLite en modo WAL.
  - Migración entre cualquier VPS en 2 minutos simplemente copiando la carpeta `./data`.
- 🔐 **Privacidad y Seguridad**:
  - Hashing de contraseñas con `bcrypt`.
  - Sesiones persistentes (30 días) para evitar logins molestos en dispositivos móviles.
  - `.gitignore` estricto para proteger la base de datos personal al subir a GitHub.
  - Exportación e importación completa en formato JSON.

---

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite, VitePWA (Workbox).
- **Backend**: Node.js, Express, SQLite (`better-sqlite3`), JWT, Cookie-parser, Helmet.
- **Contenerización**: Docker (Alpine multi-stage), Docker Compose, Caddy.

---

## 🚀 Inicio Rápido (Local)

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# O compilar y correr versión de producción
npm run build
npm start
```
Abre `http://localhost:3000` en tu navegador.

Para instrucciones de despliegue en VPS, consulta [DEPLOY.md](./DEPLOY.md).
