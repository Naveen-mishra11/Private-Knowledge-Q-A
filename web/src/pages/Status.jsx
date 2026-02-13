import { useEffect, useState } from "react";
import { getHealth, getStatus } from "../lib/api";

function Badge({ ok }) {
  return <span className={ok ? "ok" : "bad"}>{ok ? "OK" : "DOWN"}</span>;
}

export default function Status() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const h = await getHealth();
      const s = await getStatus();
      setHealth(h);
      setStatus(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Status</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Health checks for backend, database, and LLM connection.
      </p>

      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <button className="btn" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="row">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>API</h3>
          {health ? (
            <div>
              <div>
                <Badge ok={true} /> <span className="muted">{health.service}</span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                time: {health.time}
              </div>
            </div>
          ) : (
            <div className="muted">No data</div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Dependencies</h3>
          {status ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div>
                <Badge ok={status.mongo?.ok} /> MongoDB
              </div>
              <div>
                <Badge ok={status.rag?.ok} /> Python (FastAPI)
              </div>
              <div>
                <Badge ok={status.llm?.ok} /> Gemini LLM
              </div>
            </div>
          ) : (
            <div className="muted">No data</div>
          )}
        </div>
      </div>

      {status ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Raw</h3>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(status, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
