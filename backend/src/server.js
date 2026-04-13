require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDb } = require('./db/database');

const usersRouter     = require('./routes/users');
const visaRouter      = require('./routes/visa');
const travelRouter    = require('./routes/travel');
const documentsRouter = require('./routes/documents');
const companyRouter   = require('./routes/company');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ImmigAI Backend',
    sponsors: {
      lexisnexis:   process.env.LEXISNEXIS_API_KEY   ? 'connected' : 'using CourtListener (free alt)',
      filevine:     process.env.FILEVINE_API_KEY      ? 'connected' : 'using local PDF (free alt)',
      huggingface:  process.env.USE_HUGGINGFACE_EMBEDDINGS === 'true' ? 'connected' : 'using OpenAI embeddings (alt)',
      normai:       process.env.NORMAI_API_KEY        ? 'connected' : 'using built-in rules engine (alt)',
      trustFoundry: process.env.TRUST_FOUNDRY_API_KEY ? 'connected' : 'using built-in trust layer (alt)'
    }
  });
});

app.use('/api/users',     usersRouter);
app.use('/api/visa',      visaRouter);
app.use('/api/travel',    travelRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/company',   companyRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

async function start() {
  await initDb();          // load / create SQLite DB before accepting requests
  await require('./db/migrate').run?.() // run schema if exported, else it self-runs on require

  app.listen(PORT, () => {
    console.log(`\n🚀 ImmigAI backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
