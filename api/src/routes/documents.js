const express = require("express");
const multer = require("multer");
const { z } = require("zod");

const Document = require("../models/Document");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.get("/", async (req, res, next) => {
  try {
    const docs = await Document.find({}, { text: 0 }).sort({ createdAt: -1 });
    res.json({ ok: true, documents: docs });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, document: doc });
  } catch (e) {
    next(e);
  }
});

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: "Missing file" });

    if (file.mimetype !== "text/plain") {
      return res.status(400).json({ ok: false, error: "Only .txt files supported" });
    }

    const text = file.buffer.toString("utf-8").trim();
    if (!text) return res.status(400).json({ ok: false, error: "File is empty" });

    const doc = await Document.create({
      name: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      text,
    });

    // Call Python ingestion
    const pyUrl = req.app.get("PY_RAG_URL");
    let ingest;
    try {
      const r = await fetch(`${pyUrl}/ingest/${doc._id.toString()}`, { method: "POST" });
      ingest = await r.json().catch(() => ({ ok: r.ok }));
      if (!r.ok) {
        return res.status(502).json({ ok: false, error: "Ingestion failed", details: ingest });
      }
    } catch (e) {
      return res.status(502).json({ ok: false, error: "Could not reach RAG service", details: e.message });
    }

    res.status(201).json({ ok: true, document: { ...doc.toObject(), text: undefined }, ingest });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
