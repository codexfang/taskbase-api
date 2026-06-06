const express = require('express');
const cors = require('cors');
const path = require('path');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/debug', async (_req, res) => {
  try {
    const db = require('./database/client');
    const tasks = await db.query('SELECT name FROM sqlite_master WHERE type=\'table\'');
    const result = await db.query('SELECT * FROM tasks LIMIT 1');
    res.json({ ok: true, tables: tasks, sample: result, cwd: process.cwd(), dir: __dirname });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  }
});

const frontendPath = path.join(__dirname, '..', '..');
app.use(express.static(frontendPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
