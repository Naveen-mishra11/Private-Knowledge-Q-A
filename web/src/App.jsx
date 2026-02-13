import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Documents from "./pages/Documents";
import Ask from "./pages/Ask";
import Status from "./pages/Status";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/status" element={<Status />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
