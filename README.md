# MPS Dashboard — Servidor Node.js + Express

Dashboard de análisis de partidos de Maxi Padrón Sanchez con persistencia real en servidor.

## Estructura del proyecto

```
mps-dashboard/
├── server.js          ← Servidor Express (API REST)
├── package.json       ← Dependencias (solo express)
├── partidos.json      ← Base de datos (tu fuente de verdad)
└── public/
    └── index.html     ← Frontend completo (Tailwind + Chart.js)
```

## Instalación y uso

```bash
npm install
npm start
```

El servidor arranca en **http://localhost:3000** (o el puerto `PORT` de la variable de entorno).

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/partidos` | Devuelve todos los partidos del JSON |
| `POST` | `/api/partidos` | **Reemplaza** toda la base con el array enviado |
| `POST` | `/api/partidos/merge` | **Agrega** nuevos registros (dedup por `id`) |
| `POST` | `/api/partidos/one` | Agrega o actualiza un único partido |
| `DELETE` | `/api/partidos/:id` | Elimina un partido por `id` |

## Deploy en Replit

1. Sube todos los archivos a tu Replit.
2. En **Replit → Run**, el comando configurado es `node server.js`.
3. La variable `PORT` es inyectada automáticamente por Replit.
4. El archivo `partidos.json` actúa como base de datos persistente.

## Importar datos (nueva funcionalidad)

Al usar el botón **Importar datos**, se abre un diálogo que pregunta:

- **Sumar** → Agrega los nuevos registros sin borrar los existentes (usa `/api/partidos/merge`)
- **Reemplazar** → Borra todo y reemplaza con los datos importados (usa `POST /api/partidos`)

## Formato de partidos.json

```json
[
  {
    "id": "raw_1",
    "colA": "",
    "medio": "El Titular Deportes",
    "fechaStr": "10/3/2024",
    "manera": "Designado",
    "tipo": "Transmisión",
    "modalidad": "Remoto",
    "rol": "Vesturario local (ambos)",
    "equipo1": "Defensa y Justicia",
    "gol1": "2",
    "gol2": "1",
    "equipo2": "Unión",
    "competencia": "Copa De La liga",
    "jornada": "10",
    "estadio": "",
    "status": "valid",
    "isSpecial": false,
    "isCustom": false
  }
]
```

### Campo `status`
- `"valid"` → Acreditación aprobada
- `"rejected"` → Rechazada o revocada
- `"suspended"` → Suspendida
