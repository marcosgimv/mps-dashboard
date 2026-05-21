/**
 * seed.js — Carga partidos.json en MongoDB Atlas (ejecutar UNA SOLA VEZ)
 * Uso: MONGO_URI="mongodb+srv://..." node seed.js
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('❌  Falta MONGO_URI'); process.exit(1); }

const partidoSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  customId:    String, colA: String, medio: String, fechaStr: String,
  manera: String, tipo: String, modalidad: String, rol: String,
  equipo1: String, gol1: String, gol2: String, equipo2: String,
  competencia: String, jornada: String, estadio: String,
  status: { type: String, default: 'valid' },
  isSpecial: { type: Boolean, default: false },
  isCustom:  { type: Boolean, default: false }
}, { _id: false, versionKey: false });

const Partido = mongoose.model('Partido', partidoSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Conectado a MongoDB Atlas');

  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'partidos.json'), 'utf-8'));
  console.log(`📦  ${data.length} partidos encontrados en partidos.json`);

  await Partido.deleteMany({});
  console.log('🗑️   Colección limpiada');

  await Partido.insertMany(data, { ordered: false });
  const total = await Partido.countDocuments();
  console.log(`✅  ${total} partidos insertados en MongoDB Atlas`);

  await mongoose.disconnect();
  console.log('🔌  Desconectado. ¡Listo!');
}

seed().catch(e => { console.error('❌  Error:', e.message); process.exit(1); });
