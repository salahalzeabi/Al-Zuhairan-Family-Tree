import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.resolve(__dirname, '../public/uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => file.mimetype.startsWith('image/')
    ? cb(null, true)
    : cb(new Error('Only images are allowed')),
});

app.post('/api/upload', upload.array('files'), (req, res) => {
  const files = (req.files || []).map(f => ({
    name: f.filename,
    url: `/uploads/${f.filename}`,
    size: f.size,
    type: f.mimetype,
  }));
  res.json({ files });
});

app.get('/api/files', (_, res) => {
  const names = fs.readdirSync(UPLOAD_DIR).filter(n => !n.startsWith('.'));
  const files = names.map(name => ({ name, url: `/uploads/${name}` }));
  res.json({ files });
});

app.delete('/api/files/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const filePath = path.join(UPLOAD_DIR, name);
  if (!filePath.startsWith(UPLOAD_DIR)) return res.status(400).json({ error: 'Bad path' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ ok: true });
});

app.post('/api/files/delete-bulk', (req, res) => {
  const { names = [] } = req.body || {};
  let deleted = 0;
  names.forEach(n => {
    const safe = path.basename(n);
    const p = path.join(UPLOAD_DIR, safe);
    if (p.startsWith(UPLOAD_DIR) && fs.existsSync(p)) {
      fs.unlinkSync(p);
      deleted++;
    }
  });
  res.json({ deleted });
});

const DATA_DIR = path.resolve(__dirname, './data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    members: [],
    settings: {},
    auth: { users: [], resetTokens: [] }
  }, null, 2));
}
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}


(function seedAdmin() {
  const db = readDB();
  db.auth ||= { users: [], resetTokens: [] };
  if (!db.auth.users.length) {
    const hash = bcrypt.hashSync('admin', 10);
    db.auth.users.push({
      id: 'admin-local',
      email: 'salahalzeabi@gmail.com',
      username: 'admin',
      passwordHash: hash,
      created_at: new Date().toISOString()
    });
    writeDB(db);
    console.log('Seeded default user: salahalzeabi@gmail.com / admin');
  }
})();


const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendResetEmail(to, link) {
  if (!transporter) {
    console.log('--- Password reset link (dev) ---');
    console.log(link);
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'إعادة ضبط كلمة المرور',
    html: `<p>اضغط الرابط لإعادة ضبط كلمة المرور:</p>
           <p><a href="${link}">${link}</a></p>
           <p>سينتهي الرابط خلال ساعة.</p>`
  });
}

app.get('/api/members', (req, res) => {
  const db = readDB();
  res.json({ members: db.members });
});

app.post('/api/members', (req, res) => {
  const { name, image_url, parent_id = null } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const db = readDB();
  const member = {
    id: randomUUID(),
    name,
    image_url: image_url || '/assets/members/default.svg',
    parent_id,
    created_at: new Date().toISOString(),
  };
  db.members.push(member);
  writeDB(db);
  res.status(201).json({ member });
});

app.patch('/api/members/:id', (req, res) => {
  const db = readDB();
  const idx = db.members.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });

  const { name, image_url } = req.body || {};
  if (name !== undefined) db.members[idx].name = name;
  if (image_url !== undefined) db.members[idx].image_url = image_url;

  writeDB(db);
  res.json({ member: db.members[idx] });
});

app.delete('/api/members/:id', (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const hasChildren = db.members.some(m => m.parent_id === id);
  if (hasChildren) return res.status(409).json({ error: 'HAS_CHILDREN' });

  const before = db.members.length;
  db.members = db.members.filter(m => m.id !== id);
  if (db.members.length === before) return res.status(404).json({ error: 'not found' });

  writeDB(db);
  res.json({ ok: true });
});


app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json({ settings: db.settings });
});

app.put('/api/settings', (req, res) => {
  const { key, value } = req.body || {};
  if (!key) return res.status(400).json({ error: 'key is required' });

  const db = readDB();
  db.settings[key] = value;
  writeDB(db);
  res.json({ ok: true, settings: db.settings });
});


app.post('/api/auth/signup', async (req, res) => {
  const { email, password, username } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' });

  const db = readDB();
  if (db.auth.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'EMAIL_EXISTS' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: randomUUID(),
    email,
    username: username || email.split('@')[0],
    passwordHash,
    created_at: new Date().toISOString()
  };
  db.auth.users.push(user);
  writeDB(db);

  res.json({ user: { id: user.id, email: user.email, username: user.username } });
});

// تسجيل دخول
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();
  const user = db.auth.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  res.json({ user: { id: user.id, email: user.email, username: user.username } });
});


app.post('/api/auth/request-reset', async (req, res) => {
  const { email } = req.body || {};
  const db = readDB();
  const user = db.auth.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    
    return res.json({ ok: true });
  }

  const token = randomUUID();
  const expiresAt = Date.now() + 60 * 60 * 1000; 
  db.auth.resetTokens.push({ token, email: user.email, expiresAt });
  writeDB(db);

  const link = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendResetEmail(user.email, link);
  res.json({ ok: true });
});


app.post('/api/auth/reset', async (req, res) => {
  const { token, newPassword } = req.body || {};
  const db = readDB();
  const rec = db.auth.resetTokens.find(t => t.token === token);
  if (!rec || rec.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'TOKEN_INVALID_OR_EXPIRED' });
  }

  const idx = db.auth.users.findIndex(u => u.email === rec.email);
  if (idx === -1) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  db.auth.users[idx].passwordHash = await bcrypt.hash(newPassword, 10);
  db.auth.resetTokens = db.auth.resetTokens.filter(t => t.token !== token);
  writeDB(db);

  res.json({ ok: true });
});


app.patch('/api/auth/username', (req, res) => {
  const { email, username } = req.body || {};
  if (!email || !username) return res.status(400).json({ error: 'BAD_REQUEST' });

  const db = readDB();
  const user = db.auth.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

  user.username = username;
  writeDB(db);
  res.json({ ok: true, user: { id: user.id, email: user.email, username: user.username } });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Local server → http://localhost:${PORT}`));
