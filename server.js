const express   = require('express');
const mongoose  = require('mongoose');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI; // set in Render → Environment

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Schema ───────────────────────────────────────────────────────────────────
const partidoSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  customId:    String,
  colA:        String,
  medio:       String,
  fechaStr:    String,
  manera:      String,
  tipo:        String,
  modalidad:   String,
  rol:         String,
  equipo1:     String,
  gol1:        String,
  gol2:        String,
  equipo2:     String,
  competencia: String,
  jornada:     String,
  estadio:     String,
  status:      { type: String, default: 'valid' },
  isSpecial:   { type: Boolean, default: false },
  isCustom:    { type: Boolean, default: false }
}, { _id: false, versionKey: false });

const Partido = mongoose.model('Partido', partidoSchema);

// ─── Connect ──────────────────────────────────────────────────────────────────
async function conectar() {
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI no definida. Configurala en Render → Environment.');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  console.log('✅  MongoDB Atlas conectado');
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET /api/partidos
app.get('/api/partidos', async (req, res) => {
  try {
    const partidos = await Partido.find({}).lean();
    res.json({ ok: true, total: partidos.length, data: partidos });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos — reemplaza TODA la colección
app.post('/api/partidos', async (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) return res.status(400).json({ ok: false, error: 'Se esperaba un array' });

    await Partido.deleteMany({});
    if (body.length > 0) await Partido.insertMany(body, { ordered: false });
    res.json({ ok: true, total: body.length, message: 'Base de datos reemplazada correctamente' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos/merge — agrega nuevos sin borrar los existentes (dedup por id)
app.post('/api/partidos/merge', async (req, res) => {
  try {
    const incoming = req.body;
    if (!Array.isArray(incoming)) return res.status(400).json({ ok: false, error: 'Se esperaba un array' });

    let added = 0;
    for (const p of incoming) {
      const result = await Partido.updateOne(
        { id: p.id },
        { $setOnInsert: p },
        { upsert: true }
      );
      if (result.upsertedCount > 0) added++;
    }
    const total = await Partido.countDocuments();
    res.json({ ok: true, total, added, message: `${added} nuevos registros agregados. Total: ${total}` });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos/one — agrega o actualiza un único partido
app.post('/api/partidos/one', async (req, res) => {
  try {
    const partido = req.body;
    if (!partido?.id) return res.status(400).json({ ok: false, error: 'Partido sin id' });

    await Partido.replaceOne({ id: partido.id }, partido, { upsert: true });
    const total = await Partido.countDocuments();
    res.json({ ok: true, total, partido });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/partidos/:id
app.delete('/api/partidos/:id', async (req, res) => {
  try {
    const result = await Partido.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ ok: false, error: 'Partido no encontrado' });
    const total = await Partido.countDocuments();
    res.json({ ok: true, total, message: `Partido ${req.params.id} eliminado` });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Catch-all → SPA ──────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
conectar().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  MPS Dashboard en http://localhost:${PORT}`);
  });
});
