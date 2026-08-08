import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import Overview from "./pages/Overview.jsx";
import People from "./pages/People.jsx";
import PersonDetail from "./pages/PersonDetail.jsx";
import Jobs from "./pages/Jobs.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import SkillMap from "./pages/SkillMap.jsx";
import Pathway from "./pages/Pathway.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/people" element={<People />} />
          <Route path="/people/:id" element={<PersonDetail />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/skills" element={<SkillMap />} />
          <Route path="/pathway" element={<Pathway />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-border py-6 text-center text-faint text-xs font-mono">
        SkillPath — a graph data model on CognoDB · built for the Wexa AI take-home
      </footer>
    </div>
  );
}
