import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Target, Map, PenTool, MessageSquare, Briefcase, Zap } from 'lucide-react';

import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import RewrittenResume from './pages/RewrittenResume';
import Roadmap from './pages/Roadmap';
import Tracker from './pages/Tracker';
import CoverLetter from './pages/CoverLetter';
import InterviewPrep from './pages/InterviewPrep';

function Sidebar() {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Upload JD & Resume' },
    { path: '/analysis', icon: <Target size={20} />, label: 'Gap Analysis' },
    { path: '/rewrite', icon: <PenTool size={20} />, label: 'Resume Optimizer' },
    { path: '/cover-letter', icon: <FileText size={20} />, label: 'Cover Letter' },
    { path: '/interview', icon: <MessageSquare size={20} />, label: 'Interview Prep' },
    { path: '/roadmap', icon: <Map size={20} />, label: 'Learning Roadmap' },
    { path: '/tracker', icon: <Briefcase size={20} />, label: 'Application Tracker' },
  ];

  return (
    <div className="w-64 bg-navy-900 text-slate-300 min-h-screen flex flex-col fixed border-r border-slate-700 h-full shadow-xl">
      <div className="flex items-center gap-3 mb-8 px-5 py-6 border-b border-navy-800">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg">
          CL
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex flex-col leading-tight">
          CareerLens
          <span className="text-orange-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">Groq API Edition</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1.5">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${active
                ? 'bg-gradient-to-r from-navy-800 to-navy-800/50 text-orange-400 font-semibold shadow-sm border border-navy-800/80'
                : 'hover:bg-navy-800/40 hover:text-white border border-transparent'
                }`}
            >
              <div className={`${active ? 'text-orange-400' : 'text-slate-400'}`}>
                {item.icon}
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-5 text-[11px] text-slate-500 text-center border-t border-navy-800/50 bg-navy-900/50">
        <div className="flex items-center justify-center gap-1.5 mb-1.5 font-medium text-slate-400">
          <Zap size={12} className="text-orange-400" />
          Powered by Groq API
        </div>
        llama-3.3-70b-versatile<br />Ultra-fast cloud inference.
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-orange-200 selection:text-orange-900">
        <Sidebar />
        <main className="flex-1 p-10 ml-64 overflow-y-auto">
          <div className="max-w-6xl mx-auto min-h-full">
            <Routes>
              <Route path="/" element={<Upload />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/rewrite" element={<RewrittenResume />} />
              <Route path="/cover-letter" element={<CoverLetter />} />
              <Route path="/interview" element={<InterviewPrep />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/tracker" element={<Tracker />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
