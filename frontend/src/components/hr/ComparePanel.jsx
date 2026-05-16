import React from 'react';

/**
 * ComparePanel — shows side-by-side comparison of selected candidates.
 * Receives `result` from POST /api/hr/compare.
 */
export default function ComparePanel({ result, onBack }) {
  const { candidates = [], topCandidate } = result;

  if (!candidates.length) {
    return (
      <div className="compare-empty">
        <p>No comparison data available.</p>
        <button className="btn-secondary" onClick={onBack}>← Back</button>
      </div>
    );
  }

  // ── Render a list field ────────────────────────────────────────────────
  const ListField = ({ items }) => (
    <ul className="compare-list">
      {(items || []).length === 0
        ? <li className="muted">None</li>
        : (items || []).map((s, i) => <li key={i}>{s}</li>)}
    </ul>
  );

  // ── Score badge ───────────────────────────────────────────────────────
  const ScoreBadge = ({ value, suffix = '' }) => {
    const val = value ?? '—';
    const color = val >= 75 ? '#22c55e' : val >= 50 ? '#f59e0b' : '#ef4444';
    return (
      <div className="compare-score-badge" style={{ borderColor: color }}>
        <span className="compare-score-num" style={{ color }}>{val}{suffix}</span>
      </div>
    );
  };

  return (
    <div className="compare-panel">
      {/* Header */}
      <div className="compare-header">
        <button className="btn-ghost" onClick={onBack}>← Back to Candidates</button>
        <h2>Candidate Comparison</h2>
        {topCandidate && (
          <div className="compare-winner">
            🏆 Top Candidate: <code>{topCandidate.slice(0, 8)}...</code>
          </div>
        )}
      </div>

      {/* Scrollable columns */}
      <div className="compare-grid" style={{ gridTemplateColumns: `200px repeat(${candidates.length}, 1fr)` }}>
        {/* Label column */}
        <div className="compare-col compare-col--label">
          <div className="compare-cell compare-header-cell">Field</div>
          <div className="compare-cell">Candidate ID</div>
          <div className="compare-cell">Status</div>
          <div className="compare-cell compare-section">Scores</div>
          <div className="compare-cell">ATS Score</div>
          <div className="compare-cell">Role Match %</div>
          <div className="compare-cell">ATS Category</div>
          <div className="compare-cell compare-section">Skills</div>
          <div className="compare-cell">Technical Skills</div>
          <div className="compare-cell">Soft Skills</div>
          <div className="compare-cell compare-section">Analysis</div>
          <div className="compare-cell">Strengths</div>
          <div className="compare-cell">Weaknesses</div>
          <div className="compare-cell">Missing Skills</div>
          <div className="compare-cell compare-section">Background</div>
          <div className="compare-cell">Education</div>
          <div className="compare-cell">Experience</div>
          <div className="compare-cell">Recommended Roles</div>
        </div>

        {/* One column per candidate */}
        {candidates.map((c, idx) => {
          const isTop = c.trackingId === topCandidate;
          return (
            <div
              key={c.trackingId}
              className={`compare-col ${isTop ? 'compare-col--winner' : ''}`}
            >
              <div className="compare-cell compare-header-cell">
                Candidate {idx + 1} {isTop && '🏆'}
              </div>

              <div className="compare-cell">
                <code className="tracking-id" title={c.trackingId}>
                  {c.trackingId?.slice(0, 8)}...
                </code>
              </div>

              <div className="compare-cell">
                <span className={`status-badge status-badge--${c.status}`}>{c.status}</span>
              </div>

              {/* Section label spacer */}
              <div className="compare-cell compare-section" />

              <div className="compare-cell"><ScoreBadge value={c.atsScore} /></div>
              <div className="compare-cell"><ScoreBadge value={c.roleMatchPercentage} suffix="%" /></div>
              <div className="compare-cell">{c.atsCategory || '—'}</div>

              <div className="compare-cell compare-section" />

              <div className="compare-cell"><ListField items={c.technicalSkills} /></div>
              <div className="compare-cell"><ListField items={c.softSkills} /></div>

              <div className="compare-cell compare-section" />

              <div className="compare-cell"><ListField items={c.strengths} /></div>
              <div className="compare-cell"><ListField items={c.weaknesses} /></div>
              <div className="compare-cell"><ListField items={c.missingSkills} /></div>

              <div className="compare-cell compare-section" />

              <div className="compare-cell">{c.education || '—'}</div>
              <div className="compare-cell">{c.experience || '—'}</div>
              <div className="compare-cell"><ListField items={c.recommendedRoles} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
