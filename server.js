const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Conexión a MongoDB Atlas ──────────────────────────────────────────────────
if (!MONGODB_URI) {
  console.error("❌ ERROR CRÍTICO: La variable de entorno MONGODB_URI no está configurada.");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('🔌 Conectado exitosamente a MongoDB Atlas'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err.message));

// Definición del Esquema del Partido (Permite cualquier campo flexible como venías usando)
const PartidoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  colA: String,
  medio: String,
  fechaStr: String,
  manera: String,
  tipo: String,
  modalidad: String,
  rol: String,
  equipo1: String,
  gol1: String,
  gol2: String,
  equipo2: String,
  competencia: String,
  jornada: String,
  estadio: String,
  status: String,
  isSpecial: Boolean,
  isCustom: Boolean
}, { strict: false, timestamps: true });

const Partido = mongoose.model('Partido', PartidoSchema);

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET /api/partidos — Devuelve todos los partidos desde MongoDB
app.get('/api/partidos', async (req, res) => {
  try {
    const partidos = await Partido.find({}).lean();
    res.json({ ok: true, total: partidos.length, data: partidos });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos — REEMPLAZA todos los partidos (Usado en importación limpia)
app.post('/api/partidos', async (req, res) => {
  try {
    const nuevosPartidos = req.body;
    if (!Array.isArray(nuevosPartidos)) {
      return res.status(400).json({ ok: false, error: 'Se esperaba un array de partidos' });
    }
    
    // Borrar todo el contenido previo e insertar lo nuevo de manera atómica
    await Partido.deleteMany({});
    if (nuevosPartidos.length > 0) {
      await Partido.insertMany(nuevosPartidos);
    }
    
    res.json({ ok: true, total: nuevosPartidos.length, message: 'Base de datos reemplazada con éxito' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos/merge — SUMA nuevos registros sin duplicar IDs existentes
app.post('/api/partidos/merge', async (req, res) => {
  try {
    const nuevos = req.body;
    if (!Array.isArray(nuevos)) {
      return res.status(400).json({ ok: false, error: 'Se esperaba un array' });
    }
    
    let ingresados = 0;
    for (const p of nuevos) {
      if (!p.id) continue;
      // upsert: true hace que si existe lo actualice, si no existe lo cree
      await Partido.findOneAndUpdate({ id: p.id }, p, { upsert: true });
      ingresados++;
    }
    
    const totalActual = await Partido.countDocuments();
    res.json({ ok: true, total: totalActual, insertedOrUpdated: ingresados });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos/one — Agrega o edita un único partido (Formulario manual)
app.post('/api/partidos/one', async (req, res) => {
  try {
    const { partido } = req.body;
    if (!partidó || !partido.id) {
      return res.status(400).json({ ok: false, error: 'Partido o ID inválido' });
    }
    
    const guardado = await Partido.findOneAndUpdate({ id: partido.id }, partido, { upsert: true, new: true });
    const totalActual = await Partido.countDocuments();
    
    res.json({ ok: true, total: totalActual, partido: guardado });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/partidos/:id — Elimina un partido por su ID único
app.delete('/api/partidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Partido.deleteOne({ id: id });
    
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Partido no encontrado' });
    }
    
    const totalActual = await Partido.countDocuments();
    res.json({ ok: true, total: totalActual, message: `Partido con ID ${id} eliminado correctamente` });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Catch-all → Redirección Frontend (SPA) ───────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
