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

const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
