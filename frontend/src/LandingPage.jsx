import { useEffect, useRef, useState } from 'react';

/* ─── Animated gradient orbs ────────────────────────────────────────────── */
function Orb({ className }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-30 animate-pulse pointer-events-none ${className}`}
    />
  );
}

/* ─── Floating stat badge ────────────────────────────────────────────────── */
function StatBadge({ value, label, delay = '0s' }) {
  return (
    <div
      className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 text-white"
      style={{ animation: `floatUp 0.7s ease both`, animationDelay: delay }}
    >
      <span className="text-3xl font-black tracking-tight">{value}</span>
      <span className="text-xs text-white/70 font-medium mt-0.5">{label}</span>
    </div>
  );
}

/* ─── Feature pill ───────────────────────────────────────────────────────── */
function FeaturePill({ emoji, text }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
      <span>{emoji}</span> {text}
    </span>
  );
}

/* ─── Portal Card ────────────────────────────────────────────────────────── */
function PortalCard({ href, accentFrom, accentTo, icon, title, subtitle, description, cta, features, delay = '0s' }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: delay, animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) both' }}
      className="group relative flex flex-col rounded-3xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_64px_rgba(0,0,0,0.4)] cursor-pointer no-underline"
    >
      {/* Gradient top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${accentFrom} ${accentTo} transition-all duration-500 ${hovered ? 'h-2' : ''}`} />

      {/* Card body */}
      <div className="flex flex-col flex-1 p-8">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 bg-gradient-to-br ${accentFrom} ${accentTo} shadow-lg transition-transform duration-300 ${hovered ? 'scale-110 rotate-3' : ''}`}
        >
          {icon}
        </div>

        {/* Subtitle tag */}
        <span className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">{subtitle}</span>

        {/* Title */}
        <h2 className="text-2xl font-black text-white mb-3 leading-tight">{title}</h2>

        {/* Description */}
        <p className="text-white/60 text-sm leading-relaxed flex-1">{description}</p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mt-5 mb-6">
          {features.map((f) => (
            <FeaturePill key={f.text} emoji={f.emoji} text={f.text} />
          ))}
        </div>

        {/* CTA */}
        <div
          className={`flex items-center justify-between bg-gradient-to-r ${accentFrom} ${accentTo} text-white font-bold px-5 py-3.5 rounded-xl transition-all duration-300 ${hovered ? 'gap-3' : 'gap-2'}`}
        >
          <span>{cta}</span>
          <span className={`text-xl transition-transform duration-300 ${hovered ? 'translate-x-1' : ''}`}>→</span>
        </div>
      </div>

      {/* Hover glow overlay */}
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${accentFrom} ${accentTo} opacity-0 transition-opacity duration-500 pointer-events-none ${hovered ? 'opacity-5' : ''}`}
      />
    </a>
  );
}

/* ─── Animated counter ───────────────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        let start = 0;
        const step = target / 60;
        const id = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(id); }
          else setVal(Math.floor(start));
        }, 16);
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Main Landing Page ──────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #a78bfa, #60a5fa, #34d399, #60a5fa, #a78bfa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 15px) scale(0.97); }
        }
        .drift { animation: drift 12s ease-in-out infinite; }
        .drift-alt { animation: drift 16s ease-in-out infinite reverse; }
      `}</style>

      <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden flex flex-col">

        {/* ── Background orbs ─────────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="drift absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-3xl" />
          <div className="drift-alt absolute bottom-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-600/15 blur-3xl" />
          <div className="drift absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* ── Nav ─────────────────────────────────────────────────────── */}
        <nav
          className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5"
          style={{ animation: 'floatUp 0.5s ease both' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-lg shadow-lg shadow-violet-500/30">
              🧠
            </div>
            <span className="text-white font-black text-lg tracking-tight">ResumeAI</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="#/candidate" className="text-white/60 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
              Candidate
            </a>
            <a
              href="#/hr"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/20"
            >
              HR Portal
            </a>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold px-4 py-2 rounded-full mb-8 tracking-wider uppercase"
            style={{ animation: 'floatUp 0.5s ease both' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI-Powered Resume Intelligence Platform
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6 max-w-4xl"
            style={{ animation: 'floatUp 0.6s ease both' }}
          >
            Hire Smarter.{' '}
            <br />
            <span className="shimmer-text">Apply Smarter.</span>
          </h1>

          {/* Sub-headline */}
          <p
            className="text-white/50 text-lg md:text-xl max-w-2xl leading-relaxed mb-12"
            style={{ animation: 'floatUp 0.7s ease both' }}
          >
            One platform. Two powerful portals. Upload resumes, get instant ATS scores, and
            let our AI rank, compare, and surface your best candidates — all in seconds.
          </p>

          {/* Stats row */}
          <div
            className="flex flex-wrap justify-center gap-4 mb-16"
            style={{ animation: 'floatUp 0.8s ease both' }}
          >
            <StatBadge value={<><AnimatedNumber target={98} />%</>} label="Parse Accuracy" />
            <StatBadge value={<><AnimatedNumber target={3} />s</>} label="Avg Analysis Time" />
            <StatBadge value={<><AnimatedNumber target={50} />+</>} label="Skills Detected" />
            <StatBadge value="Groq LPU™" label="Powered By" />
          </div>
        </section>

        {/* ── Portal Cards ─────────────────────────────────────────────── */}
        <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto w-full">
          <p
            className="text-center text-white/30 text-xs font-bold uppercase tracking-widest mb-8"
            style={{ animation: 'floatUp 0.85s ease both' }}
          >
            Choose Your Portal
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Portal */}
            <PortalCard
              href="#/candidate"
              accentFrom="from-blue-500"
              accentTo="to-cyan-500"
              icon="📄"
              subtitle="Job Seekers"
              title="Candidate Portal"
              description="Upload your resume and receive a detailed ATS score, skill gap analysis, strength & weakness breakdown, and personalized role recommendations — powered by Llama 3.3 70B."
              cta="Analyze My Resume"
              delay="0.1s"
              features={[
                { emoji: '📊', text: 'ATS Score' },
                { emoji: '🎯', text: 'Role Match %' },
                { emoji: '⚡', text: 'Instant Analysis' },
                { emoji: '🔍', text: 'Skill Gap Report' },
              ]}
            />

            {/* HR Portal */}
            <PortalCard
              href="#/hr"
              accentFrom="from-violet-500"
              accentTo="to-purple-500"
              icon="🏢"
              subtitle="Hiring Teams"
              title="HR Dashboard"
              description="Get a bird's-eye view of your entire candidate pipeline. Sort by ATS score, filter by skills, compare candidates side-by-side, and make data-driven hiring decisions with confidence."
              cta="Open HR Dashboard"
              delay="0.2s"
              features={[
                { emoji: '📋', text: 'Pipeline View' },
                { emoji: '🔀', text: 'Compare Candidates' },
                { emoji: '🏷️', text: 'Filter by Skills' },
                { emoji: '📈', text: 'Rank by Score' },
              ]}
            />
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="relative z-10 px-6 pb-24 max-w-5xl mx-auto w-full">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
            <p className="text-center text-white/30 text-xs font-bold uppercase tracking-widest mb-10">
              How It Works
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: '⬆️', title: 'Upload Resume', desc: 'Drop any PDF resume into the candidate portal. Uploaded securely to Azure Blob Storage.' },
                { step: '02', icon: '🤖', title: 'AI Parses & Scores', desc: 'PDFBox extracts text; Groq\'s Llama 3.3 70B analyzes skills, experience, and fit in seconds.' },
                { step: '03', icon: '📊', title: 'HR Reviews & Ranks', desc: 'HR team accesses ranked candidates, filters by skills, and compares profiles side-by-side.' },
              ].map(({ step, icon, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                      {icon}
                    </div>
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">
                      {step.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="relative z-10 border-t border-white/5 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs">
              🧠
            </div>
            <span className="text-white/40 text-sm font-medium">ResumeAI · AI Resume Parser</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#/candidate" className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors">
              Candidate Portal
            </a>
            <a href="#/hr" className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors">
              HR Dashboard
            </a>
            <span className="text-white/20 text-xs">
              Powered by Groq · Azure · Spring Boot
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
