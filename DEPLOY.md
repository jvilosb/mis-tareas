# 🚀 Guía de Despliegue, Migración y PWA de RamTask

Esta guía detalla paso a paso cómo probar RamTask localmente en tu Mac, cómo subirlo a GitHub, cómo desplegarlo en tu VPS con Docker y cómo instalarlo como aplicación nativa en tu Mac, iPhone e iPad.

---

## 1. Probar localmente en tu Mac

Para levantar la aplicación en tu Mac ahora mismo:

```bash
# Entrar a la carpeta del proyecto
cd "/Users/coke/Documents/Antigravity/Proyecto Tareas"

# Iniciar en modo desarrollo (recarga en caliente para cliente y servidor)
npm run dev
```

Abre tu navegador en `http://localhost:5173`. En tu primera visita, verás la pantalla de **Configuración Inicial** donde podrás crear tu cuenta maestra de administrador.

Para probar la versión final de producción en tu Mac:
```bash
npm run build
npm start
```
Y abre `http://localhost:3000`.

---

## 2. Subir el proyecto a GitHub

Tus datos personales y base de datos están protegidos por `.gitignore` y **nunca** se subirán a GitHub.

1. Ve a [GitHub](https://github.com/new) y crea un nuevo repositorio (se sugiere **Privado**), por ejemplo llamado `ramtask`.
2. En tu terminal ejecuta:
```bash
cd "/Users/coke/Documents/Antigravity/Proyecto Tareas"

# Si no está inicializado git:
git init
git add .
git commit -m "feat: initial commit - RamTask PWA con Docker"

# Vincular con tu repositorio de GitHub:
git remote add origin https://github.com/TU_USUARIO/ramtask.git
git branch -M main
git push -u origin main
```

---

## 3. Despliegue en tu VPS con Docker

En cualquier servidor VPS con Ubuntu o Debian (Hetzner, DigitalOcean, Contabo, AWS, etc.):

### Requisitos previos en el VPS:
Instalar Docker y Docker Compose (si no lo tienes instalado aún):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Paso a paso:
```bash
# 1. Clona tu repositorio en el VPS
git clone https://github.com/TU_USUARIO/ramtask.git
cd ramtask

# 2. Crea tu archivo de entorno
cp .env.example .env

# 3. Levanta la aplicación con Docker Compose
docker compose up -d --build
```

La app estará corriendo en el puerto `3000`.

---

## 4. Configurar Dominio y HTTPS (Necesario para PWA en iPhone/iPad)

Apple iOS exige que una web tenga **HTTPS con certificado SSL válido** para poder instalarse como PWA en iPhone o iPad.

### Opción A: Con Caddy (Recomendada - SSL 100% Automático)
1. Edita el archivo `Caddyfile` en el VPS y pon tu dominio real:
   ```caddyfile
   tareas.tudominio.com {
       reverse_proxy ramtask:3000
   }
   ```
2. En `docker-compose.yml`, descomenta las líneas del servicio `caddy`.
3. Reinicia los contenedores:
   ```bash
   docker compose up -d
   ```
Caddy generará y renovará automáticamente tu certificado SSL con Let's Encrypt sin hacer nada más.

### Opción B: Si ya usas Nginx en tu VPS
Crea una configuración en `/etc/nginx/sites-available/ramtask`:
```nginx
server {
    server_name tareas.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Y genera el certificado SSL con:
```bash
sudo certbot --nginx -d tareas.tudominio.com
```

---

## 5. Cómo Instalar la PWA en tus Equipos

### En iPhone e iPad:
1. Abre tu navegador **Safari** e ingresa a tu dominio HTTPS (ej: `https://tareas.tudominio.com`).
2. Toca el botón **Compartir** en la barra inferior (el cuadrado con la flecha hacia arriba).
3. Desplázate hacia abajo y selecciona **"Añadir a pantalla de inicio"** (Add to Home Screen).
4. Elige el nombre (RamTask) y toca **"Añadir"**.
5. ¡Listo! Se abrirá como una aplicación nativa independiente, a pantalla completa, respetando el notch/isla dinámica y sin barras de navegación del explorador.

### En Mac (macOS Sonoma / Safari):
1. En Safari, visita `https://tareas.tudominio.com`.
2. Ve al menú superior **Archivo** -> **"Añadir al Dock..."**.
3. Tendrás RamTask en tu Dock funcionando como una aplicación de escritorio nativa de macOS.

---

## 6. Migrar a otro VPS en el futuro (2 minutos)

Toda la información (tareas, turnos 2x2, contraseñas y familiares) reside en el directorio `./data`.

Para migrar a un nuevo servidor:
1. En el nuevo VPS, clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/ramtask.git
   cd ramtask
   ```
2. Copia tu carpeta `./data` desde el VPS antiguo al nuevo con `scp`:
   ```bash
   scp -r ./data usuario@nuevo-vps:/ruta/ramtask/data
   ```
3. En el nuevo VPS ejecuta:
   ```bash
   docker compose up -d
   ```
¡Listo! Todo tu historial y configuración estará disponible al instante sin perder nada.

---

## 7. Actualizaciones futuras

Cuando hagas cambios en el código y los subas a GitHub, actualizar tu VPS es tan fácil como:
```bash
git pull
docker compose up -d --build
```
Tus datos en `./data` permanecerán 100% intactos.
