import React, { useRef, useState } from 'react';

export default function UploadSection({ onUpload }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFiles = (files) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf');
    setSelectedFiles(pdfs);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleUploadClick = () => {
    if (selectedFiles.length === 0) return;
    onUpload(selectedFiles);
    setSelectedFiles([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="upload-section">
      <h2 className="section-title">Upload Resumes</h2>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="drop-zone-icon">📄</div>
        <p className="drop-zone-text">
          {dragging ? 'Drop PDFs here!' : 'Drag & drop PDFs here, or click to browse'}
        </p>
        <p className="drop-zone-hint">Supports multiple PDF files</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="file-preview">
          <p className="file-preview-title">{selectedFiles.length} file(s) ready:</p>
          <ul className="file-list">
            {selectedFiles.map((f, i) => (
              <li key={i} className="file-item">
                <span className="file-icon">📋</span>
                <span className="file-name">{f.name}</span>
                <span className="file-size">({(f.size / 1024).toFixed(1)} KB)</span>
              </li>
            ))}
          </ul>
          <button className="btn-upload" onClick={handleUploadClick}>
            🚀 Upload {selectedFiles.length} Resume{selectedFiles.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
