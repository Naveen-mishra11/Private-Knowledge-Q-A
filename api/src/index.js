const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;
const PY_RAG_URL = process.env.PY_RAG_URL || "http://localhost:8000";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function normalizeOrigin(o) {
  if (!o) return o;
  // Remove trailing slash for reliable comparisons
  return o.endsWith("/") ? o.slice(0, -1) : o;
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.length === 0) return true;
  if (ALLOWED_ORIGINS.includes("*")) return true;
  const n = normalizeOrigin(origin);
  return ALLOWED_ORIGINS.map(normalizeOrigin).includes(n);
}

const documentsRouter = require("./routes/documents");
const qaRouter = require("./routes/qa");

app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / curl / server-to-server
      if (isOriginAllowed(origin)) return cb(null, true);
      // Returning an error causes the response to have no CORS headers.
      // Instead, block by returning false (browser will block) but API can still respond.
      return cb(null, false);
    },
    credentials: false,
  })
);

// Preflight
app.options("*", cors());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "api", time: new Date().toISOString() });
});

app.set("PY_RAG_URL", PY_RAG_URL);

app.use("/documents", documentsRouter);
app.use("/qa", qaRouter);

app.get("/status", async (req, res) => {
  const status = {
    ok: true,
    api: { ok: true },
    mongo: { ok: false },
    rag: { ok: false },
    llm: { ok: false },
  };

  // Mongo
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      status.mongo.ok = true;
    }
  } catch (e) {
    status.mongo = { ok: false, error: e.message };
    status.ok = false;
  }

  // RAG health
  try {
    const r = await fetch(`${PY_RAG_URL}/health`);
    status.rag.ok = r.ok;
    if (!r.ok) status.ok = false;
  } catch (e) {
    status.rag = { ok: false, error: e.message };
    status.ok = false;
  }

  // LLM health (via python)
  try {
    const r = await fetch(`${PY_RAG_URL}/llm-health`);
    status.llm.ok = r.ok;
    if (!r.ok) status.ok = false;
  } catch (e) {
    status.llm = { ok: false, error: e.message };
    status.ok = false;
  }

  res.status(status.ok ? 200 : 503).json(status);
});

async function start() {
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI env var");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log(`PY_RAG_URL=${PY_RAG_URL}`);
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message || "Internal Server Error" });
});

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
