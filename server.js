const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'partidos.json');

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo partidos.json:', e.message);
    return [];
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET /api/partidos — devuelve todos los partidos
app.get('/api/partidos', (req, res) => {
  try {
    const partidos = readDB();
    res.json({ ok: true, total: partidos.length, data: partidos });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos — reemplaza TODO el array (usado al importar con "reemplazar")
app.post('/api/partidos', (req, res) => {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: 'Se esperaba un array de partidos' });
    }
    writeDB(body);
    res.json({ ok: true, total: body.length, message: 'Base de datos actualizada correctamente' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos/merge — agrega los nuevos al array existente (importar "sumar")
app.post('/api/partidos/merge', (req, res) => {
  try {
    const incoming = req.body;
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ ok: false, error: 'Se esperaba un array de partidos' });
    }
    const existing = readDB();
    // Dedup por id: preserva los existentes y agrega los que no estén
    const existingIds = new Set(existing.map(p => p.id));
    const newOnes = incoming.filter(p => !existingIds.has(p.id));
    const merged = [...existing, ...newOnes];
    writeDB(merged);
    res.json({
      ok: true,
      total: merged.length,
      added: newOnes.length,
      message: `${newOnes.length} nuevos registros agregados. Total: ${merged.length}`
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/partidos/one — agrega o actualiza un único partido
app.post('/api/partidos/one', (req, res) => {
  try {
    const partido = req.body;
    if (!partido || typeof partido !== 'object') {
      return res.status(400).json({ ok: false, error: 'Partido inválido' });
    }
    const partidos = readDB();
    const idx = partidos.findIndex(p => p.id === partido.id);
    if (idx >= 0) {
      partidos[idx] = partido; // actualizar
    } else {
      partidos.push(partido);  // agregar
    }
    writeDB(partidos);
    res.json({ ok: true, total: partidos.length, partido });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/partidos/:id — elimina un partido por id
app.delete('/api/partidos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const partidos = readDB();
    const filtered = partidos.filter(p => p.id !== id);
    if (filtered.length === partidos.length) {
      return res.status(404).json({ ok: false, error: 'Partido no encontrado' });
    }
    writeDB(filtered);
    res.json({ ok: true, total: filtered.length, message: `Partido ${id} eliminado` });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Catch-all → SPA ──────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  MPS Dashboard corriendo en http://localhost:${PORT}`);
  console.log(`📁  Base de datos: ${DB_PATH}`);
  console.log(`📊  Partidos cargados: ${readDB().length}`);
});
