const express = require("express");
const { z } = require("zod");

const router = express.Router();

const schema = z.object({
  question: z.string().trim().min(1).max(2000),
  topK: z.number().int().min(1).max(10).optional(),
});

router.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid input", details: parsed.error.flatten() });
  }

  const pyUrl = req.app.get("PY_RAG_URL");
  try {
    const r = await fetch(`${pyUrl}/qa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: parsed.data.question, top_k: parsed.data.topK }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(502).json({ ok: false, error: "RAG service error", details: data });
    }
    return res.json({ ok: true, ...data });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Could not reach RAG service", details: e.message });
  }
});

module.exports = router;
