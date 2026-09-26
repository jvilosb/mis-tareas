/*
 * Pruebas de seguridad (integración HTTP) para RamTask.
 *
 * Cada prueba está diseñada para FALLAR antes de las correcciones de autorización
 * aplicadas en server/src/routes/* y server/src/auth.ts, y PASAR después:
 *   T1  member no puede crear usuarios (ni admins)
 *   T2  member no puede borrar usuarios
 *   T3  member no puede exportar el respaldo (admin sí)
 *   T4  member no puede crear/generar turnos de otro usuario
 *   T5  member no puede borrar turnos de otro usuario
 *   T6  al borrar un usuario, su sesión deja de ser válida (revalidación)
 *   T7  el servidor no arranca sin JWT_SECRET (fail-fast)
 *   T8  el login está limitado (rate limiting)
 *   T9  regresión: GET /tasks/personal responde 200 e incluye la tarea creada
 *   T10 sin credenciales -> 401
 *
 * Uso:  npm --workspace=server run test:security
 */
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER_ENTRY = path.join(__dirname, '..', 'dist', 'index.js');
const JWT_SECRET = 'test_secret_security_suite_1234567890_abcdef';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ramtask-sec-'));
const dbPath = path.join(tmpDir, 'sec.db');

let server = null;
let passed = 0;
let failed = 0;

function ok(name, cond) {
  if (cond) {
    passed++;
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    console.log(`  \u2717 ${name}`);
  }
}

async function req(method, url, { body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const setCookie = res.headers.get('set-cookie') || '';
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json, cookie: setCookie.split(';')[0] };
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return true;
    } catch {
      /* aún no responde */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function main() {
  console.log('--- PRUEBAS DE SEGURIDAD RAMTASK ---');

  server = spawn('node', [SERVER_ENTRY], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT), JWT_SECRET, DB_PATH: dbPath },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

  assert.ok(await waitForServer(), 'El servidor no arrancó (¿falta compilar dist/?).');
  console.log('  \u00b7 servidor en marcha\n');

  // Preparación: admin + member
  const setup = await req('POST', '/api/auth/setup', {
    body: { username: 'admin', name: 'Admin', password: 'adminpass123' },
  });
  ok('Preparación: setup crea admin (201)', setup.status === 201);
  const adminCookie = setup.cookie;

  const created = await req('POST', '/api/auth/users', {
    cookie: adminCookie,
    body: { username: 'bob', name: 'Bob', password: 'bobpass123' },
  });
  ok('Preparación: admin crea member (201)', created.status === 201);

  const login = await req('POST', '/api/auth/login', {
    body: { username: 'bob', password: 'bobpass123' },
  });
  ok('Preparación: login member (200)', login.status === 200);
  const bobCookie = login.cookie;

  // T10: sin credenciales
  const t10 = await req('GET', '/api/tasks/personal');
  ok('T10 sin credenciales -> 401', t10.status === 401);

  // T1
  const t1 = await req('POST', '/api/auth/users', {
    cookie: bobCookie,
    body: { username: 'evil', name: 'Evil', password: 'evilpass123', role: 'admin' },
  });
  ok('T1 member NO puede crear usuarios (403)', t1.status === 403);

  // T2
  const t2 = await req('DELETE', '/api/auth/users/1', { cookie: bobCookie });
  ok('T2 member NO puede borrar usuarios (403)', t2.status === 403);

  // T3 member / T3b admin
  const t3 = await req('GET', '/api/backup/export', { cookie: bobCookie });
  ok('T3 member NO puede exportar respaldo (403)', t3.status === 403);
  const t3b = await req('GET', '/api/backup/export', { cookie: adminCookie });
  ok('T3b admin SÍ puede exportar (200)', t3b.status === 200);

  // T4
  const t4 = await req('POST', '/api/calendar/shift', {
    cookie: bobCookie,
    body: { user_id: 1, date: '2026-09-30' },
  });
  ok('T4 member NO puede crear turno de otro (403)', t4.status === 403);

  const t4b = await req('POST', '/api/calendar/shift/batch-2x2', {
    cookie: bobCookie,
    body: { user_id: 1, start_date: '2026-10-01', days_count: 10 },
  });
  ok('T4b member NO puede generar turnos de otro (403)', t4b.status === 403);

  // T5
  const adminShift = await req('POST', '/api/calendar/shift', {
    cookie: adminCookie,
    body: { date: '2026-09-29' },
  });
  const shiftId = adminShift.json && adminShift.json.shift ? adminShift.json.shift.id : null;
  ok('Preparación: admin crea su turno (201)', adminShift.status === 201 && !!shiftId);
  const t5 = await req('DELETE', `/api/calendar/shift/${shiftId}`, { cookie: bobCookie });
  ok('T5 member NO puede borrar turno de otro (403)', t5.status === 403);

  // T9 regresión del bug de SQL (listado de tareas)
  await req('POST', '/api/tasks', { cookie: adminCookie, body: { title: 'Tarea de prueba', is_shared: 0 } });
  const t9 = await req('GET', '/api/tasks/personal', { cookie: adminCookie });
  ok(
    'T9 listado de tareas personales responde 200 con la tarea',
    t9.status === 200 && Array.isArray(t9.json.tasks) && t9.json.tasks.some((t) => t.title === 'Tarea de prueba')
  );

  // T6 revalidación: admin borra a bob (id 2) y la sesión de bob deja de valer
  const delBob = await req('DELETE', '/api/auth/users/2', { cookie: adminCookie });
  ok('Preparación: admin borra a member (200)', delBob.status === 200);
  const t6 = await req('GET', '/api/tasks/personal', { cookie: bobCookie });
  ok('T6 sesión de usuario borrado -> 401', t6.status === 401);

  // T8 rate limiting
  let rateLimited = false;
  for (let i = 0; i < 45; i++) {
    const r = await req('POST', '/api/auth/login', { body: { username: 'nope', password: 'wrong' } });
    if (r.status === 429) {
      rateLimited = true;
      break;
    }
  }
  ok('T8 login limitado por rate limit (429)', rateLimited);

  // T7 fail-fast sin JWT_SECRET
  const noSecret = spawn('node', [SERVER_ENTRY], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '3998', JWT_SECRET: '', DB_PATH: dbPath },
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  const exit = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve('STILL_RUNNING'), 8000);
    noSecret.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
  if (exit === 'STILL_RUNNING') noSecret.kill('SIGKILL');
  ok('T7 arranca sin JWT_SECRET y falla rápido (exit != 0)', typeof exit === 'number' && exit !== 0);

  console.log(`\n  Resultado: ${passed} OK, ${failed} fallidas`);

  if (server) server.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 400));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('ERROR EN PRUEBAS DE SEGURIDAD:', err);
  if (server) server.kill();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  process.exit(1);
});
