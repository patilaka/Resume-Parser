import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  UploadCloud, CheckCircle, Clock, XCircle,
  ChevronDown, ChevronUp, Zap, Target, BookOpen,
  AlertTriangle, TrendingUp, Award, Briefcase, Brain
} from 'lucide-react';

const API = 'http://localhost:8080/api/resumes';

// ── Helpers ──────────────────────────────────────────────────────────────────
const categoryColor = (cat) => {
  switch ((cat || '').toLowerCase()) {
    case 'excellent': return { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: '#10b981' };
    case 'good':      return { bg: 'bg-blue-100',    text: 'text-blue-700',    ring: '#3b82f6' };
    case 'average':   return { bg: 'bg-amber-100',   text: 'text-amber-700',   ring: '#f59e0b' };
    case 'poor':      return { bg: 'bg-red-100',     text: 'text-red-700',     ring: '#ef4444' };
    default:          return { bg: 'bg-slate-100',   text: 'text-slate-700',   ring: '#94a3b8' };
  }
};

const scoreColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

// ── ATS Score Circle ──────────────────────────────────────────────────────────
function ScoreCircle({ score, category }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const fill = ((score || 0) / 100) * circ;
  const color = scoreColor(score);
  const cat = categoryColor(category);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="rotate-[-90deg]" width="128" height="128" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{score ?? '–'}</span>
          <span className="text-xs text-slate-400 font-medium">/ 100</span>
        </div>
      </div>
      {category && (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cat.bg} ${cat.text}`}>
          {category}
        </span>
      )}
      <p className="text-xs text-slate-500 font-medium">ATS Score</p>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, label, color = '#3b82f6' }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Skill Tag ─────────────────────────────────────────────────────────────────
function SkillTag({ label, type = 'tech' }) {
  const styles = type === 'tech'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-purple-50 text-purple-700 border-purple-200';
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${styles}`}>
      {label}
    </span>
  );
}

// ── Candidate Card ────────────────────────────────────────────────────────────
function CandidateCard({ c }) {
  const [open, setOpen] = useState(false);
  const cat = categoryColor(c.atsCategory);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex gap-5 items-start">
        {/* Score circle */}
        <div className="shrink-0">
          <ScoreCircle score={c.atsScore} category={c.atsCategory} />
        </div>

        {/* Middle info */}
        <div className="flex-1 min-w-0">
          {/* Status + ID */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
              c.status?.startsWith('FAILED') ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>{c.status}</span>
            <span className="text-xs text-slate-400 font-mono truncate max-w-[160px]" title={c.trackingId}>
              #{c.trackingId?.slice(0, 8)}
            </span>
          </div>

          {/* Summary */}
          {c.summary && (
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-3">{c.summary}</p>
          )}

          {/* Role match bar */}
          {c.roleMatchPercentage != null && c.recommendedRoles?.length > 0 && (
            <div className="mb-3">
              <ProgressBar
                value={c.roleMatchPercentage}
                label={`Top Match: ${c.recommendedRoles[0]}`}
                color={scoreColor(c.roleMatchPercentage)}
              />
            </div>
          )}

          {/* Tech skills */}
          {c.technicalSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {c.technicalSkills.slice(0, 6).map(s => <SkillTag key={s} label={s} type="tech" />)}
              {c.technicalSkills.length > 6 && (
                <span className="px-2.5 py-1 text-xs text-slate-400">+{c.technicalSkills.length - 6} more</span>
              )}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          className="shrink-0 p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Expanded detail panel */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Experience & Education */}
          <div className="space-y-4">
            {c.experience && (
              <Section icon={<Briefcase className="h-4 w-4" />} title="Experience" color="text-blue-600">
                <p className="text-sm text-slate-600">{c.experience}</p>
              </Section>
            )}
            {c.education && (
              <Section icon={<BookOpen className="h-4 w-4" />} title="Education" color="text-indigo-600">
                <p className="text-sm text-slate-600">{c.education}</p>
              </Section>
            )}
            {c.softSkills?.length > 0 && (
              <Section icon={<Brain className="h-4 w-4" />} title="Soft Skills" color="text-purple-600">
                <div className="flex flex-wrap gap-1.5">
                  {c.softSkills.map(s => <SkillTag key={s} label={s} type="soft" />)}
                </div>
              </Section>
            )}
            {c.projects?.length > 0 && (
              <Section icon={<Zap className="h-4 w-4" />} title="Projects" color="text-cyan-600">
                <ul className="space-y-1">
                  {c.projects.map((p, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-cyan-500 shrink-0">▸</span>{p}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          <div className="space-y-4">
            {/* Strengths */}
            {c.strengths?.length > 0 && (
              <Section icon={<Award className="h-4 w-4" />} title="Strengths" color="text-emerald-600">
                <ul className="space-y-1">
                  {c.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Weaknesses */}
            {c.weaknesses?.length > 0 && (
              <Section icon={<AlertTriangle className="h-4 w-4" />} title="Weaknesses" color="text-red-500">
                <ul className="space-y-1">
                  {c.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-1.5">
                      <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />{w}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Improvements */}
            {c.improvements?.length > 0 && (
              <Section icon={<TrendingUp className="h-4 w-4" />} title="Improvements" color="text-amber-600">
                <ul className="space-y-2">
                  {c.improvements.map((imp, i) => (
                    <li key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-amber-800">
                      🚀 {imp}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Recommended Roles */}
            {c.recommendedRoles?.length > 0 && (
              <Section icon={<Target className="h-4 w-4" />} title="Recommended Roles" color="text-blue-600">
                <div className="flex flex-wrap gap-1.5">
                  {c.recommendedRoles.map((r, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">
                      {r}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Missing Skills */}
            {c.missingSkills?.length > 0 && (
              <Section icon={<Zap className="h-4 w-4" />} title="Missing Skills to Learn" color="text-orange-600">
                <div className="flex flex-wrap gap-1.5">
                  {c.missingSkills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
                {c.learningSuggestions?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {c.learningSuggestions.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <span className="text-orange-400">→</span>{s}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {/* ATS Keywords */}
            {c.atsKeywords?.length > 0 && (
              <Section icon={<Brain className="h-4 w-4" />} title="Missing ATS Keywords" color="text-slate-600">
                <div className="flex flex-wrap gap-1.5">
                  {c.atsKeywords.map((k, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-xs font-mono">
                      {k}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Section wrapper ──────────────────────────────────────────────────
function Section({ icon, title, color, children }) {
  return (
    <div>
      <h4 className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>
        {icon}{title}
      </h4>
      {children}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile]             = useState(null);
  const [trackingId, setTrackingId] = useState(null);
  const [status, setStatus]         = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver]     = useState(false);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/`);
      setCandidates(res.data.sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0)));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchCandidates(); }, []);

  useEffect(() => {
    if (!trackingId || status !== 'PROCESSING') return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/${trackingId}/status`);
        setStatus(res.data.status);
        if (res.data.status !== 'PROCESSING') {
          clearInterval(interval);
          fetchCandidates();
        }
      } catch (e) { console.error(e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [trackingId, status]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    setStatus('STARTING...');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTrackingId(res.data.trackingId);
      setStatus(res.data.status);
    } catch (err) {
      console.error(err);
      setStatus('UPLOAD FAILED');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') setFile(dropped);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-blue-600 text-white rounded-xl p-2.5">
              <Brain className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Resume Parser</h1>
          </div>
          <p className="text-slate-500 ml-14">Full ATS analysis powered by Groq · Llama 3.3 70B</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Upload Panel */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Upload Resume</h2>

              <form onSubmit={handleUpload}>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    dragOver ? 'border-blue-400 bg-blue-50' : 'border-blue-200 bg-blue-50/40 hover:bg-blue-50'
                  }`}
                >
                  <UploadCloud className={`mx-auto h-10 w-10 mb-3 transition-colors ${dragOver ? 'text-blue-500' : 'text-blue-300'}`} />
                  <input
                    type="file" accept="application/pdf"
                    className="hidden" id="file-upload"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-semibold text-sm hover:underline">
                    Browse or Drag & Drop
                  </label>
                  {file
                    ? <p className="text-xs text-emerald-600 font-medium mt-2 truncate">✓ {file.name}</p>
                    : <p className="text-xs text-slate-400 mt-2">PDF files up to 10MB</p>
                  }
                </div>

                <button
                  type="submit"
                  disabled={!file || isUploading || status === 'PROCESSING'}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 rounded-xl font-semibold text-sm transition-all"
                >
                  {isUploading ? 'Uploading...' : status === 'PROCESSING' ? '⏳ Analyzing...' : 'Analyze Resume'}
                </button>
              </form>

              {/* Status */}
              {trackingId && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    {status === 'PROCESSING' && <Clock className="animate-spin h-4 w-4 text-amber-500" />}
                    {status === 'COMPLETED'  && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    {status?.startsWith('FAILED') && <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm font-semibold text-slate-700">{status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">#{trackingId.slice(0, 8)}</p>
                </div>
              )}

              {/* Stats bar */}
              {candidates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Pipeline Stats</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-slate-800">{candidates.length}</p>
                      <p className="text-xs text-slate-400">Total</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-black text-emerald-700">
                        {candidates.filter(c => c.status === 'COMPLETED').length}
                      </p>
                      <p className="text-xs text-emerald-500">Analyzed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Pipeline */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Candidate Pipeline</h2>
              <button onClick={fetchCandidates} className="text-xs text-blue-500 hover:underline">
                ↻ Refresh
              </button>
            </div>

            {candidates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
                <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No resumes analyzed yet</p>
                <p className="text-sm mt-1">Upload a PDF to see full ATS analysis</p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map(c => <CandidateCard key={c.id} c={c} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
