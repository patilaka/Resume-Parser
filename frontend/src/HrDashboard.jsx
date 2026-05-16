import React, { useState, useEffect, useCallback } from 'react';
import UploadSection from './components/hr/UploadSection';
import CandidateTable from './components/hr/CandidateTable';
import ComparePanel from './components/hr/ComparePanel';
import './hr-dashboard.css';

const API_BASE = 'http://localhost:8080/api/hr';

export default function HrDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'ranked' | 'compare'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [compareResult, setCompareResult] = useState(null);
  const [filterSkill, setFilterSkill] = useState('');
  const [notification, setNotification] = useState(null);

  // ── Fetch helpers ───────────────────────────────────────────────────────
  const fetchCandidates = useCallback(async (endpoint = '/candidates') => {
    setLoading(true);
    try {
      const url = filterSkill && endpoint === '/candidates'
        ? `${API_BASE}/filter?skill=${encodeURIComponent(filterSkill)}`
        : `${API_BASE}${endpoint}`;
      const res = await fetch(url);
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      showNotification('Failed to fetch candidates: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filterSkill]);

  useEffect(() => {
    if (activeTab === 'candidates') fetchCandidates('/candidates');
    else if (activeTab === 'ranked') fetchCandidates('/rank');
  }, [activeTab, fetchCandidates]);

  // ── Notification helper ─────────────────────────────────────────────────
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Upload handler ──────────────────────────────────────────────────────
  const handleUpload = async (files) => {
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));

    try {
      showNotification(`Uploading ${files.length} file(s)...`, 'info');
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      const results = await res.json();
      const succeeded = results.filter(r => r.status === 'PROCESSING').length;
      showNotification(`✓ ${succeeded}/${files.length} resumes uploaded & processing started.`, 'success');
      setTimeout(() => fetchCandidates('/candidates'), 1500);
    } catch (err) {
      showNotification('Upload failed: ' + err.message, 'error');
    }
  };

  // ── Compare handler ─────────────────────────────────────────────────────
  const handleCompare = async () => {
    if (selectedIds.size < 2) {
      showNotification('Select at least 2 candidates to compare.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      setCompareResult(data);
      setActiveTab('compare');
    } catch (err) {
      showNotification('Compare failed: ' + err.message, 'error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="hr-app">
      {/* Header */}
      <header className="hr-header">
        <div className="hr-header-inner">
          <div className="hr-logo">
            <span className="hr-logo-icon">🎯</span>
            <div>
              <h1>HR Resume Portal</h1>
              <p>AI-powered resume analysis & ranking</p>
            </div>
          </div>
          <div className="hr-header-stats">
            <div className="stat-chip">
              <span className="stat-num">{candidates.length}</span>
              <span className="stat-label">Candidates</span>
            </div>
            <div className="stat-chip">
              <span className="stat-num">{candidates.filter(c => c.status === 'COMPLETED').length}</span>
              <span className="stat-label">Analyzed</span>
            </div>
            <div className="stat-chip">
              <span className="stat-num">{selectedIds.size}</span>
              <span className="stat-label">Selected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`hr-notification hr-notification--${notification.type}`}>
          {notification.message}
        </div>
      )}

      <main className="hr-main">
        {/* Upload Section */}
        <UploadSection onUpload={handleUpload} />

        {/* Tabs */}
        <div className="hr-tabs">
          <button
            className={`hr-tab ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => { setActiveTab('candidates'); setFilterSkill(''); }}
          >
            All Candidates
          </button>
          <button
            className={`hr-tab ${activeTab === 'ranked' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranked')}
          >
            🏆 Ranked by Score
          </button>
          <button
            className={`hr-tab ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
            disabled={!compareResult}
          >
            ⚖️ Compare {selectedIds.size > 0 && `(${selectedIds.size})`}
          </button>
        </div>

        {/* Filter Bar (shown on candidates tab) */}
        {activeTab === 'candidates' && (
          <div className="hr-filter-bar">
            <input
              className="hr-filter-input"
              type="text"
              placeholder="🔍 Filter by skill (e.g. Java, React, Python)..."
              value={filterSkill}
              onChange={e => setFilterSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchCandidates('/candidates')}
            />
            <button className="btn-secondary" onClick={() => fetchCandidates('/candidates')}>
              Filter
            </button>
            {filterSkill && (
              <button className="btn-ghost" onClick={() => { setFilterSkill(''); fetchCandidates('/candidates'); }}>
                Clear
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleCompare}
              disabled={selectedIds.size < 2}
            >
              ⚖️ Compare Selected ({selectedIds.size})
            </button>
          </div>
        )}

        {activeTab === 'ranked' && (
          <div className="hr-filter-bar">
            <button
              className="btn-primary"
              onClick={handleCompare}
              disabled={selectedIds.size < 2}
            >
              ⚖️ Compare Selected ({selectedIds.size})
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === 'compare' && compareResult ? (
          <ComparePanel result={compareResult} onBack={() => setActiveTab('candidates')} />
        ) : (
          <CandidateTable
            candidates={candidates}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onRefresh={() => fetchCandidates(activeTab === 'ranked' ? '/rank' : '/candidates')}
          />
        )}
      </main>
    </div>
  );
}
