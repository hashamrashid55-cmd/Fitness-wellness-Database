require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const authRoutes = require('./routes/auth');
const apiRoutes  = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'FitCore API' }));
app.use('/api/auth', authRoutes);
app.use('/api',      apiRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀 FitCore server running on http://localhost:${PORT}`));
