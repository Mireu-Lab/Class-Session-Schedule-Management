import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[EXPRESS REQUEST] ${req.method} ${req.url}`);
  next();
});

// In-Memory Database matching Go Structs & React Defaults
let categories = [
  { id: 'CAT-1', name: 'DataBase 세션', color: 'bg-blue-600', archived: false },
  { id: 'CAT-2', name: '합주/공연 조율', color: 'bg-emerald-500', archived: false },
  { id: 'CAT-3', name: 'Programming 세션', color: 'bg-indigo-600', archived: false },
  { id: 'CAT-4', name: 'Server 세션', color: 'bg-slate-700', archived: false }
];

let sessions = [
  {
    id: 1,
    title: '정기 오케스트라 합주 조율',
    category: '합주/공연 조율',
    color: 'bg-emerald-500',
    startDate: '2026-07-01',
    endDate: '2026-07-07',
    time_interval: 60,
    guestMode: 'unspecified',
    status: '조율 중',
    confirmedSlot: null,
    is_deleted: false,
    archived: false,
    duration: '1week',
    guests: [
      { name: '김동현', submitted: true, schedule: { 'W1-Mon-18:00': true, 'W1-Mon-19:00': true } },
      { name: '이영희', submitted: true, schedule: { 'W1-Mon-19:00': true, 'W1-Wed-20:00': true } }
    ],
    expiry: '2026-07-07T18:00',
    preventDuplicate: true,
    allowGuestMutation: true,
    adminEmails: ['dh.lee@company.com'],
    viewerEmails: []
  },
  {
    id: 2,
    title: '4주 집중 DB 테크 세미나',
    category: 'DataBase 세션',
    color: 'bg-blue-600',
    startDate: '2026-07-01',
    endDate: '2026-07-28',
    time_interval: 60,
    guestMode: 'specified',
    status: '확정',
    confirmedSlot: 'W2-Wed-09:00',
    is_deleted: false,
    archived: false,
    duration: '4weeks',
    guests: [
      { name: '박지성', submitted: true, schedule: { 'W2-Wed-09:00': true, 'W3-Mon-14:00': true } },
      { name: '손흥민', submitted: false, schedule: {} }
    ],
    expiry: '2026-07-28T18:00',
    preventDuplicate: true,
    allowGuestMutation: true,
    adminEmails: ['dh.lee@company.com'],
    viewerEmails: []
  }
];

// Auth check utility (mirrors Go AuthMiddleware)
const getRequestEmail = (req: express.Request): string => {
  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.startsWith('dev-token-')) {
      return token.substring(10).trim();
    }
  }
  return 'dh.lee@company.com'; // Default fallback
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', language: 'typescript-express' });
});

// Categories Endpoints
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const newCat = req.body;
  if (!newCat.id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }
  const idx = categories.findIndex(c => c.id === newCat.id);
  if (idx !== -1) {
    categories[idx] = newCat;
  } else {
    categories.push(newCat);
  }
  res.json(newCat);
});

app.delete('/api/categories/:id', (req, res) => {
  const id = req.params.id;
  categories = categories.filter(c => c.id !== id);
  res.json({ message: 'Category deleted successfully' });
});

// Sessions Endpoints
app.get('/api/sessions', (req, res) => {
  // Only return non-deleted sessions
  const activeSessions = sessions.filter(s => !s.is_deleted);
  res.json(activeSessions);
});

app.get('/api/sessions/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sess = sessions.find(s => s.id === id);
  if (!sess) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(sess);
});

app.post('/api/sessions', (req, res) => {
  const newSess = req.body;
  newSess.id = newSess.id || Date.now();
  sessions.push(newSess);
  res.json(newSess);
});

app.put('/api/sessions/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const updatedSess = req.body;
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }
  sessions[idx] = { ...sessions[idx], ...updatedSess, id }; // Keep original numeric ID format
  res.json(sessions[idx]);
});

app.delete('/api/sessions/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }
  // Soft-delete / Archive logic
  sessions[idx].is_deleted = true;
  sessions[idx].archived = true;
  res.json({ message: 'Session archived/deleted successfully' });
});

// Guest Submit Endpoints
app.post('/api/sessions/:id/guests', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const inputGuest = req.body;
  const sess = sessions.find(s => s.id === id);
  if (!sess) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Find or insert guest schedule
  const guests = sess.guests || [];
  const idx = guests.findIndex(g => g.name === inputGuest.name);
  if (idx !== -1) {
    guests[idx] = inputGuest;
  } else {
    guests.push(inputGuest);
  }
  sess.guests = guests;
  res.json(sess);
});

// Serve frontend static assets from built directory
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Fallback all non-API paths to serve frontend's index.html (React Router support)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
