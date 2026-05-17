const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = process.env.ESCAPE_ROOM_DB_FILE || path.join(__dirname, 'data', 'db.json');

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const seed = {
  users: [
    { user_id: 1, name: 'Олена Коваль', email: 'olena.koval@example.com', password: 'ClientPass2026!', phone: '+380671234567', role: 'client' },
    { user_id: 2, name: 'Ігор Мельник', email: 'ihor.melnyk@example.com', password: 'GameMaster2026!', phone: '+380671112233', role: 'gamemaster' },
    { user_id: 3, name: 'Тетяна Бойко', email: 'tetiana.boiko@example.com', password: 'TechPass2026!', phone: '+380672223344', role: 'technician' },
    { user_id: 4, name: 'Адміністратор', email: 'admin@escaperoom.ua', password: 'AdminPass2026!', phone: '+380673334455', role: 'admin' }
  ],
  rooms: [
    { room_id: 1, name: 'Таємниця замку', description: 'Класичний квест у середньовічному замку', capacity: 6, duration_minutes: 60, difficulty: 'medium', price_per_person: 350, status: 'active', hourly_slots: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
    { room_id: 2, name: 'Лабораторія шаленого вченого', description: 'Науково-фантастичний квест для команди', capacity: 4, duration_minutes: 60, difficulty: 'hard', price_per_person: 400, status: 'active', hourly_slots: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
    { room_id: 3, name: 'Піратська бухта', description: 'Пошук скарбу на кораблі з пастками', capacity: 5, duration_minutes: 75, difficulty: 'easy', price_per_person: 320, status: 'active', hourly_slots: ['11:00', '13:00', '15:00', '17:00', '19:00'] }
  ],
  bookings: [
    { booking_id: 10, user_id: 1, room_id: 1, date: '2026-05-15', time_slot: '18:00', participants: 3, status: 'confirmed', total_price: 1050, created_at: '2026-05-10T10:30:00.000Z' },
    { booking_id: 11, user_id: 2, room_id: 2, date: '2026-05-16', time_slot: '20:00', participants: 4, status: 'pending', total_price: 1600, created_at: '2026-05-11T12:10:00.000Z' }
  ],
  maintenance: [
    { maintenance_id: 5, room_id: 2, reported_by: 'Ігор Мельник', description: 'Не працює замок на скриньці з підказками', status: 'new', assigned_to: '', created_at: '2026-04-28T10:30:00.000Z', resolved_at: null }
  ],
  records: [
    { record_id: 20, booking_id: 10, room_id: 1, team_name: 'Невловимі', members: ['Олена', 'Петро', 'Марія'], completion_time_seconds: 2340, hints_used: 1, success: true, created_at: '2026-05-15T19:05:00.000Z' },
    { record_id: 21, booking_id: null, room_id: 1, team_name: 'Dream Team', members: ['Андрій', 'Наталія'], completion_time_seconds: 2715, hints_used: 2, success: true, created_at: '2026-05-14T19:05:00.000Z' },
    { record_id: 22, booking_id: null, room_id: 2, team_name: 'Хіміки', members: ['Софія', 'Максим'], completion_time_seconds: 3180, hints_used: 3, success: true, created_at: '2026-05-12T18:20:00.000Z' }
  ],
  adminLog: []
};

function ensureDb() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  let changed = false;
  for (const user of seed.users) {
    const existing = db.users?.find(item => item.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      existing.name = user.name;
      existing.password = user.password;
      existing.role = user.role;
      changed = true;
    } else {
      db.users = db.users || [];
      db.users.push(user);
      changed = true;
    }
  }
  if (!Array.isArray(db.adminLog)) {
    db.adminLog = [];
    changed = true;
  }
  if (changed) fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function nextId(items, field) {
  return items.reduce((max, item) => Math.max(max, Number(item[field]) || 0), 0) + 1;
}

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function roomName(db, roomId) {
  return db.rooms.find(room => Number(room.room_id) === Number(roomId))?.name || `Кімната ${roomId}`;
}

function roomStatus(db, roomId) {
  const hasActiveRepair = db.maintenance.some(item => Number(item.room_id) === Number(roomId) && item.status === 'in-progress');
  return hasActiveRepair ? 'maintenance' : db.rooms.find(room => Number(room.room_id) === Number(roomId))?.status || 'active';
}

function enrichBooking(db, booking) {
  return { ...booking, room_name: roomName(db, booking.room_id) };
}

function logAction(db, type, description) {
  db.adminLog.unshift({ log_id: nextId(db.adminLog, 'log_id'), type, description, created_at: new Date().toISOString() });
}

app.post('/api/users/register', (req, res) => {
  const db = readDb();
  const { name, email, password, phone, role } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Вкажіть імʼя, email і пароль' });
  if (db.users.some(user => user.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Користувач з таким email вже існує' });
  const user = { user_id: nextId(db.users, 'user_id'), name, email, password, phone: phone || '', role: role || 'client' };
  db.users.push(user);
  logAction(db, 'user.register', `Зареєстровано користувача ${email}`);
  writeDb(db);
  res.status(201).json(publicUser(user));
});

app.post('/api/users/login', (req, res) => {
  const db = readDb();
  const { email, password } = req.body || {};
  const user = db.users.find(item => item.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || user.password !== password) return res.status(401).json({ error: 'Невірний email або пароль' });
  res.json({ token: `demo-token-${user.user_id}`, user_id: user.user_id, name: user.name, role: user.role });
});

app.get('/api/users/:user_id', (req, res) => {
  const db = readDb();
  const user = db.users.find(item => Number(item.user_id) === Number(req.params.user_id));
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
  res.json(publicUser(user));
});

app.get('/api/rooms', (req, res) => {
  const db = readDb();
  res.json(db.rooms.map(room => ({ ...room, status: roomStatus(db, room.room_id) })));
});

app.get('/api/rooms/:room_id', (req, res) => {
  const db = readDb();
  const room = db.rooms.find(item => Number(item.room_id) === Number(req.params.room_id));
  if (!room) return res.status(404).json({ error: 'Кімнату не знайдено' });
  res.json({ ...room, status: roomStatus(db, room.room_id) });
});

app.post('/api/rooms', (req, res) => {
  const db = readDb();
  const room = {
    room_id: nextId(db.rooms, 'room_id'),
    name: req.body.name,
    description: req.body.description || '',
    capacity: Number(req.body.capacity) || 1,
    duration_minutes: Number(req.body.duration_minutes) || 60,
    difficulty: req.body.difficulty || 'medium',
    price_per_person: Number(req.body.price_per_person) || 0,
    status: 'active',
    hourly_slots: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
  };
  db.rooms.push(room);
  writeDb(db);
  res.status(201).json(room);
});

app.patch('/api/rooms/:room_id', (req, res) => {
  const db = readDb();
  const room = db.rooms.find(item => Number(item.room_id) === Number(req.params.room_id));
  if (!room) return res.status(404).json({ error: 'Кімнату не знайдено' });
  Object.assign(room, req.body, { room_id: room.room_id });
  writeDb(db);
  res.json({ ...room, status: roomStatus(db, room.room_id) });
});

app.post('/api/bookings', (req, res) => {
  const db = readDb();
  const { user_id, room_id, date, time_slot, participants } = req.body || {};
  const room = db.rooms.find(item => Number(item.room_id) === Number(room_id));
  if (!room || !date || !time_slot || !participants) return res.status(400).json({ error: 'Оберіть кімнату, дату, час і кількість учасників' });
  if (roomStatus(db, room_id) !== 'active') return res.status(409).json({ error: 'Кімната тимчасово недоступна через технічне обслуговування' });
  if (!room.hourly_slots.includes(time_slot)) return res.status(400).json({ error: 'Цей часовий слот недоступний для кімнати' });
  const isTaken = db.bookings.some(item => Number(item.room_id) === Number(room_id) && item.date === date && item.time_slot === time_slot && item.status !== 'cancelled');
  if (isTaken) return res.status(409).json({ error: 'Цей слот вже заброньовано' });
  const booking = { booking_id: nextId(db.bookings, 'booking_id'), user_id: Number(user_id) || 1, room_id: Number(room_id), date, time_slot, participants: Number(participants), status: 'confirmed', total_price: Number(participants) * Number(room.price_per_person), created_at: new Date().toISOString() };
  db.bookings.unshift(booking);
  writeDb(db);
  res.status(201).json(enrichBooking(db, booking));
});

app.get('/api/bookings/user/:user_id', (req, res) => {
  const db = readDb();
  res.json(db.bookings.filter(item => Number(item.user_id) === Number(req.params.user_id)).map(item => enrichBooking(db, item)));
});

app.get('/api/bookings/:booking_id', (req, res) => {
  const db = readDb();
  const booking = db.bookings.find(item => Number(item.booking_id) === Number(req.params.booking_id));
  if (!booking) return res.status(404).json({ error: 'Бронювання не знайдено' });
  res.json(enrichBooking(db, booking));
});

app.delete('/api/bookings/:booking_id', (req, res) => {
  const db = readDb();
  const booking = db.bookings.find(item => Number(item.booking_id) === Number(req.params.booking_id));
  if (!booking) return res.status(404).json({ error: 'Бронювання не знайдено' });
  booking.status = 'cancelled';
  writeDb(db);
  res.json(enrichBooking(db, booking));
});

app.get('/api/admin/bookings', (req, res) => {
  const db = readDb();
  res.json(db.bookings.map(item => enrichBooking(db, item)));
});

app.patch('/api/admin/bookings/:booking_id', (req, res) => {
  const db = readDb();
  const booking = db.bookings.find(item => Number(item.booking_id) === Number(req.params.booking_id));
  if (!booking) return res.status(404).json({ error: 'Бронювання не знайдено' });
  Object.assign(booking, req.body);
  writeDb(db);
  res.json(enrichBooking(db, booking));
});

app.post('/api/maintenance', (req, res) => {
  const db = readDb();
  const item = { maintenance_id: nextId(db.maintenance, 'maintenance_id'), room_id: Number(req.body.room_id), reported_by: req.body.reported_by, description: req.body.description, status: 'new', created_at: new Date().toISOString(), resolved_at: null };
  db.maintenance.unshift(item);
  writeDb(db);
  res.status(201).json({ ...item, room_name: roomName(db, item.room_id) });
});

app.get('/api/maintenance', (req, res) => {
  const db = readDb();
  res.json(db.maintenance.map(item => ({ ...item, room_name: roomName(db, item.room_id) })));
});

app.patch('/api/maintenance/:maintenance_id', (req, res) => {
  const db = readDb();
  const item = db.maintenance.find(entry => Number(entry.maintenance_id) === Number(req.params.maintenance_id));
  if (!item) return res.status(404).json({ error: 'Заявку не знайдено' });
  Object.assign(item, req.body);
  item.resolved_at = item.status === 'done' ? new Date().toISOString() : null;
  writeDb(db);
  res.json({ ...item, room_name: roomName(db, item.room_id) });
});

app.post('/api/records', (req, res) => {
  const db = readDb();
  const room = db.rooms.find(item => Number(item.room_id) === Number(req.body.room_id));
  if (!room || !req.body.team_name || !req.body.completion_time_seconds) return res.status(400).json({ error: 'Оберіть кімнату, команду і час проходження' });
  const record = { record_id: nextId(db.records, 'record_id'), booking_id: req.body.booking_id ? Number(req.body.booking_id) : null, room_id: Number(req.body.room_id), team_name: req.body.team_name, members: Array.isArray(req.body.members) ? req.body.members : [], completion_time_seconds: Number(req.body.completion_time_seconds), hints_used: Number(req.body.hints_used) || 0, success: Boolean(req.body.success), created_at: new Date().toISOString() };
  db.records.push(record);
  writeDb(db);
  res.status(201).json({ ...record, room_name: room.name });
});

app.get('/api/records/room/:room_id', (req, res) => {
  const db = readDb();
  res.json(db.records
    .filter(record => Number(record.room_id) === Number(req.params.room_id))
    .sort((a, b) => (a.success === b.success ? Number(a.completion_time_seconds) - Number(b.completion_time_seconds) : a.success ? -1 : 1)));
});

app.get('/api/records', (req, res) => {
  const db = readDb();
  res.json(db.records.map(record => ({ ...record, room_name: roomName(db, record.room_id) })));
});

app.get('/api/admin/users', (req, res) => {
  const db = readDb();
  res.json(db.users.map(publicUser));
});

app.get('/api/analytics', (req, res) => {
  const db = readDb();
  res.json({
    rooms: db.rooms.length,
    bookings: db.bookings.length,
    maintenance: db.maintenance.filter(item => item.status !== 'done').length,
    records: db.records.length,
    revenue: db.bookings.filter(item => item.status !== 'cancelled').reduce((sum, item) => sum + Number(item.total_price || 0), 0)
  });
});

ensureDb();
const server = app.listen(PORT, () => console.log(`Сервер запущено на http://localhost:${PORT}`));
module.exports = { app, server };
