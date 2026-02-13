import { NavLink, Outlet } from "react-router-dom";
import "./layout.css";

export default function Layout() {
  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brand">
          <div className="brandTitle">Private Knowledge Q&A</div>
          <div className="brandSub">MERN + Python (FastAPI) + Gemini</div>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}
            >Home</NavLink
          >
          <NavLink to="/documents" className={({ isActive }) => (isActive ? "active" : "")}
            >Documents</NavLink
          >
          <NavLink to="/ask" className={({ isActive }) => (isActive ? "active" : "")}
            >Ask</NavLink
          >
          <NavLink to="/status" className={({ isActive }) => (isActive ? "active" : "")}
            >Status</NavLink
          >
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

    </div>
  );
}
