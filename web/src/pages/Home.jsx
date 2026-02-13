import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Private Knowledge Q&A</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Upload a few <strong>.txt</strong> documents, ask questions, and get answers with citations.
      </p>

      <div className="row">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>1) Upload documents</h3>
          <p className="muted">
            Add text files up to 5MB. They’re chunked + embedded by the Python service.
          </p>
          <Link to="/documents" className="btn" style={{ display: "inline-block" }}>
            Go to Documents
          </Link>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>2) Ask a question</h3>
          <p className="muted">
            The app retrieves the most relevant chunks and asks Gemini to answer using only that context.
          </p>
          <Link to="/ask" className="btn" style={{ display: "inline-block" }}>
            Go to Ask
          </Link>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>3) Check system status</h3>
        <p className="muted">Backend health (Node + Mongo + Python + Gemini connectivity).</p>
        <Link to="/status" className="btn" style={{ display: "inline-block" }}>
          Go to Status
        </Link>
      </div>
    </div>
  );
}
