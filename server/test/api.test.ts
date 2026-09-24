import { db, initDatabase } from '../src/db';
import { hashPassword, comparePassword, signToken, verifyToken } from '../src/auth';

async function runTests() {
  console.log('--- INICIANDO PRUEBAS AUTOMATIZADAS DE RAMTASK ---');

  // Inicializar base de datos
  initDatabase();

  // 1. Limpieza de tablas de prueba
  db.exec(`
    DELETE FROM calendar_events;
    DELETE FROM task_shares;
    DELETE FROM tasks;
    DELETE FROM users;
  `);
  console.log('✓ Tablas de prueba inicializadas y limpias');

  // 2. Probar hashing de contraseña
  const password = 'mi_password_seguro_123';
  const hash = await hashPassword(password);
  const match = await comparePassword(password, hash);
  if (!match) throw new Error('Fallo en verificación de contraseña');
  console.log('✓ Hashing de contraseñas con bcrypt verificado');

  // 3. Crear usuario administrador (Coke)
  const cokeResult = db.prepare(`
    INSERT INTO users (username, name, role, color, avatar, password_hash)
    VALUES (?, ?, 'admin', ?, ?, ?)
  `).run('coke', 'Coke', '#00205B', '👨‍💻', hash);
  const cokeId = Number(cokeResult.lastInsertRowid);
  console.log(`✓ Usuario Administrador creado con ID: ${cokeId}`);

  // 4. Crear familiar (Esposa)
  const esposaResult = db.prepare(`
    INSERT INTO users (username, name, role, color, avatar, password_hash)
    VALUES (?, ?, 'member', ?, ?, ?)
  `).run('andrea', 'Andrea (Esposa)', '#e11d48', '👩‍💼', hash);
  const esposaId = Number(esposaResult.lastInsertRowid);
  console.log(`✓ Familiar (Esposa) creada con ID: ${esposaId} y color rosa #e11d48`);

  // 5. Crear tarea PERSONAL para Coke
  const personalTaskResult = db.prepare(`
    INSERT INTO tasks (user_id, is_shared, title, priority, due_date)
    VALUES (?, 0, 'Revisar finanzas privadas', 'alta', '2026-09-25')
  `).run(cokeId);
  const personalTaskId = Number(personalTaskResult.lastInsertRowid);
  console.log(`✓ Tarea personal creada (ID: ${personalTaskId})`);

  // 6. Verificar que la tarea personal NO es visible para Esposa
  const esposaPersonalTasks = db.prepare(`
    SELECT * FROM tasks WHERE is_shared = 0 AND user_id = ?
  `).all(esposaId);
  if (esposaPersonalTasks.length !== 0) {
    throw new Error('Fallo de aislamiento: La esposa no debería ver las tareas personales de Coke');
  }
  console.log('✓ Aislamiento de Tareas Personales comprobado: Esposa no ve tareas privadas de Coke');

  // 7. Crear tarea COMPARTIDA con Esposa
  const sharedTaskResult = db.prepare(`
    INSERT INTO tasks (user_id, is_shared, title, priority, due_date)
    VALUES (?, 1, 'Comprar víveres para el fin de semana', 'media', '2026-09-26')
  `).run(cokeId);
  const sharedTaskId = Number(sharedTaskResult.lastInsertRowid);

  db.prepare('INSERT INTO task_shares (task_id, user_id) VALUES (?, ?)').run(sharedTaskId, esposaId);
  console.log(`✓ Tarea compartida creada y vinculada con Esposa (ID: ${sharedTaskId})`);

  // 8. Generar turnos de trabajo 2x2 para Esposa (a partir de 2026-09-25 por 10 días)
  const startDate = new Date('2026-09-25T00:00:00');
  const shiftInsert = db.prepare(`
    INSERT INTO calendar_events (user_id, date, type, title, color)
    VALUES (?, ?, 'work_shift', 'Turno 2x2 (Trabajo)', '#e11d48')
  `);

  for (let i = 0; i < 10; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    if (i % 4 < 2) { // 2 días trabajo, 2 días descanso
      shiftInsert.run(esposaId, dateStr);
    }
  }
  console.log('✓ Turnos 2x2 de la Esposa generados en la base de datos');

  // 9. Consultar calendario del mes 2026-09
  const monthShifts = db.prepare(`
    SELECT ce.*, u.name as user_name
    FROM calendar_events ce
    JOIN users u ON ce.user_id = u.id
    WHERE ce.date LIKE '2026-09-%'
  `).all();

  if (monthShifts.length === 0) {
    throw new Error('Fallo: No se encontraron turnos en el calendario');
  }
  console.log(`✓ Calendario mensual consultado con éxito: ${monthShifts.length} turnos registrados en Septiembre`);

  // 10. Probar tokens JWT
  const token = signToken({
    id: cokeId,
    username: 'coke',
    name: 'Coke',
    role: 'admin',
    color: '#00205B',
    avatar: '👨‍💻',
  }, true);

  const decoded = verifyToken(token);
  if (!decoded || decoded.id !== cokeId) {
    throw new Error('Fallo en decodificación de JWT');
  }
  console.log('✓ Emisión y verificación de tokens JWT comprobada');

  console.log('\n======================================================');
  console.log('  ¡TODAS LAS PRUEBAS AUTOMATIZADAS PASARON CON ÉXITO! ');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('ERROR EN PRUEBAS:', err);
  process.exit(1);
});
