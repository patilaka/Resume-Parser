import React, { useState } from 'react';

const STATUS_COLORS = {
  COMPLETED: '#22c55e',
  PROCESSING: '#f59e0b',
  FAILED: '#ef4444',
};

const STATUS_ICONS = {
  COMPLETED: '✅',
  PROCESSING: '⏳',
  FAILED: '❌',
};

export default function CandidateTable({
  candidates,
  loading,
  selectedIds,
  onToggleSelect,
  onRefresh,
}) {
  const [sortField, setSortField] = useState('atsScore');
  const [sortDir, setSortDir] = useState('desc');
  const [expanded, setExpanded] = useState(null);

  // ── Sort logic ────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const sorted = [...candidates].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (typeof valA === 'number') {
      return sortDir === 'asc' ? valA - valB : valB - valA;
    }
    return sortDir === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // ── Score bar component ───────────────────────────────────────────────
  const ScoreBar = ({ value, max = 100, color = '#6366f1' }) => (
    <div className="score-bar-wrap">
      <div
        className="score-bar-fill"
        style={{ width: `${((value ?? 0) / max) * 100}%`, background: color }}
      />
      <span className="score-bar-label">{value ?? '—'}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner" />
        <p>Loading candidates...</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="table-empty">
        <p>No candidates found.</p>
        <button className="btn-secondary" onClick={onRefresh}>Refresh</button>
      </div>
    );
  }

  return (
    <div className="candidate-table-wrap">
      <div className="table-toolbar">
        <span className="table-count">{candidates.length} candidate(s)</span>
        <button className="btn-ghost" onClick={onRefresh}>🔄 Refresh</button>
      </div>

      <div className="table-scroll">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Select</th>
              <th onClick={() => toggleSort('trackingId')}>
                ID <SortIcon field="trackingId" />
              </th>
              <th>Status</th>
              <th onClick={() => toggleSort('atsScore')}>
                ATS Score <SortIcon field="atsScore" />
              </th>
              <th onClick={() => toggleSort('roleMatchPercentage')}>
                Role Match % <SortIcon field="roleMatchPercentage" />
              </th>
              <th>Technical Skills</th>
              <th>Recommended Roles</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <React.Fragment key={c.trackingId}>
                <tr className={selectedIds.has(c.trackingId) ? 'row-selected' : ''}>
                  {/* Checkbox */}
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.trackingId)}
                      disabled={c.status !== 'COMPLETED'}
                      onChange={() => onToggleSelect(c.trackingId)}
                      className="hr-checkbox"
                    />
                  </td>

                  {/* ID */}
                  <td>
                    <span className="tracking-id" title={c.trackingId}>
                      {c.trackingId?.slice(0, 8)}...
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className="status-badge"
                      style={{ background: STATUS_COLORS[c.status] + '22', color: STATUS_COLORS[c.status] }}
                    >
                      {STATUS_ICONS[c.status]} {c.status}
                    </span>
                  </td>

                  {/* ATS Score */}
                  <td>
                    {c.status === 'COMPLETED' ? (
                      <ScoreBar value={c.atsScore} color="#6366f1" />
                    ) : <span className="muted">—</span>}
                  </td>

                  {/* Role Match */}
                  <td>
                    {c.status === 'COMPLETED' ? (
                      <ScoreBar value={c.roleMatchPercentage} color="#22c55e" />
                    ) : <span className="muted">—</span>}
                  </td>

                  {/* Technical Skills */}
                  <td>
                    <div className="skill-tags">
                      {(c.technicalSkills || []).slice(0, 4).map((s, i) => (
                        <span key={i} className="skill-tag">{s}</span>
                      ))}
                      {(c.technicalSkills || []).length > 4 && (
                        <span className="skill-tag skill-tag--more">
                          +{c.technicalSkills.length - 4}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Recommended Roles */}
                  <td>
                    <div className="role-list">
                      {(c.recommendedRoles || []).slice(0, 2).map((r, i) => (
                        <span key={i} className="role-tag">{r}</span>
                      ))}
                    </div>
                  </td>

                  {/* Expand */}
                  <td>
                    {c.status === 'COMPLETED' && (
                      <button
                        className="btn-expand"
                        onClick={() => setExpanded(expanded === c.trackingId ? null : c.trackingId)}
                      >
                        {expanded === c.trackingId ? '▲ Hide' : '▼ Show'}
                      </button>
                    )}
                  </td>
                </tr>

                {/* Expanded row */}
                {expanded === c.trackingId && (
                  <tr className="row-expanded">
                    <td colSpan={8}>
                      <div className="expanded-content">
                        <div className="exp-grid">
                          <div className="exp-col">
                            <h4>💪 Strengths</h4>
                            <ul>{(c.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                          </div>
                          <div className="exp-col">
                            <h4>⚠️ Weaknesses</h4>
                            <ul>{(c.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                          </div>
                          <div className="exp-col">
                            <h4>📚 Missing Skills</h4>
                            <ul>{(c.missingSkills || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                          </div>
                          <div className="exp-col">
                            <h4>🎓 Education</h4>
                            <p>{c.education || '—'}</p>
                            <h4 style={{ marginTop: 12 }}>💼 Experience</h4>
                            <p>{c.experience || '—'}</p>
                          </div>
                        </div>
                        {c.summary && (
                          <div className="exp-summary">
                            <h4>📝 Summary</h4>
                            <p>{c.summary}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
