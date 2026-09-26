import { Task } from '../types';

export class NotificationService {
  private static instance: NotificationService;
  private intervalId: any = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Comprobar si el navegador o PWA soporta notificaciones
  public isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Obtener estado actual del permiso
  public getPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  // Solicitar permiso de notificaciones (debe ser llamado por acción de usuario)
  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.playChime();
        await this.showNotification('🔔 Notificaciones Activadas', {
          body: 'Tareas Metatron te avisará de tus tareas programadas y turnos familiares.',
          tag: 'welcome-notification',
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al solicitar permiso de notificaciones:', err);
      return false;
    }
  }

  // Reproducir un sonido de campana sutil con la Web Audio API
  public playChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  // Mostrar notificación a través del Service Worker de la PWA
  public async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (this.getPermission() !== 'granted') return;

    this.playChime();

    // Intentar vibración si está soportada
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 100, 150]);
      } catch {}
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      ...options,
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, defaultOptions);
          return;
        }
      }
    } catch (err) {
      console.warn('Fallo al mostrar por ServiceWorker, usando API directa:', err);
    }

    // Fallback estándar
    try {
      new Notification(title, defaultOptions);
    } catch (err) {
      console.error('Error al emitir notificación:', err);
    }
  }

  // Revisar si hay tareas que venzan en el momento actual
  public checkDueTasks(tasks: Task[]): void {
    if (this.getPermission() !== 'granted' || !tasks.length) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    for (const task of tasks) {
      if (task.is_completed) continue;
      if (!task.due_date) continue;

      // Si la tarea tiene fecha hoy
      if (task.due_date === todayStr) {
        let isDueNow = false;

        if (task.due_time) {
          const [h, m] = task.due_time.split(':').map(Number);
          const taskTotalMinutes = h * 60 + m;
          // Si está dentro de los últimos 15 minutos o en el minuto actual
          const diff = currentTotalMinutes - taskTotalMinutes;
          if (diff >= 0 && diff <= 15) {
            isDueNow = true;
          }
        } else {
          // Si no tiene hora específica pero es para hoy, avisar una vez al día
          isDueNow = true;
        }

        if (isDueNow) {
          const cacheKey = `notified_task_${task.id}_${todayStr}_${task.due_time || 'any'}`;
          if (!localStorage.getItem(cacheKey)) {
            localStorage.setItem(cacheKey, 'true');
            const timeDesc = task.due_time ? `Hora: ${task.due_time}` : 'Vence hoy';
            this.showNotification(`⏰ Tarea Pendiente: ${task.title}`, {
              body: `${timeDesc} · Prioridad ${task.priority.toUpperCase()}${task.description ? ' - ' + task.description : ''}`,
              tag: `task-due-${task.id}`,
            });
          }
        }
      }
    }
  }

  // Iniciar monitoreo continuo cada 30 segundos
  public startMonitoring(getTasks: () => Task[]) {
    if (this.intervalId) clearInterval(this.intervalId);

    // Comprobar de inmediato
    this.checkDueTasks(getTasks());

    // Comprobar cada 30 segundos
    this.intervalId = setInterval(() => {
      this.checkDueTasks(getTasks());
    }, 30000);
  }

  public stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const notificationService = NotificationService.getInstance();
