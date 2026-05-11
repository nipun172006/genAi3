import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ---------------------------------------------------------------------------
// ProgressBar component
// Shows a bar filling from 0→target%, then snaps to 100% on complete.
// ---------------------------------------------------------------------------
function ProgressBar({ progress, label, isComplete, isError }) {
  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-pct">{Math.round(progress)}%</span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${isComplete ? 'complete' : ''} ${isError ? 'error-fill' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {isComplete && !isError && (
        <p className="progress-done">✅ Done!</p>
      )}
      {isError && (
        <p className="progress-done error-msg">❌ Failed. Check server.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook: useSimulatedProgress
// Simulates a realistic-looking progress that climbs to ~85%, then waits
// until you call `finish()` to snap to 100%.
// ---------------------------------------------------------------------------
function useSimulatedProgress() {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const intervalRef = useRef(null);

  const start = () => {
    setProgress(0);
    setIsComplete(false);
    setIsError(false);

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          clearInterval(intervalRef.current);
          return 85;
        }
        // Accelerates fast at start, slows as it approaches 85
        const increment = (85 - prev) * 0.08 + Math.random() * 3;
        return Math.min(prev + increment, 85);
      });
    }, 200);
  };

  const finish = () => {
    clearInterval(intervalRef.current);
    setProgress(100);
    setIsComplete(true);
  };

  const fail = () => {
    clearInterval(intervalRef.current);
    setIsError(true);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setProgress(0);
    setIsComplete(false);
    setIsError(false);
  };

  return { progress, isComplete, isError, start, finish, fail, reset };
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
function App() {
  // Upload state
  const [files, setFiles] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [showUploadBar, setShowUploadBar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploadProgress = useSimulatedProgress();

  // Ask state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [showAskBar, setShowAskBar] = useState(false);
  const askProgress = useSimulatedProgress();

  // 1. Handle File Selection
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // 2. Handle File Upload
  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));

    setIsUploading(true);
    setShowUploadBar(true);
    uploadProgress.start();

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      uploadProgress.finish();
      setUploadedDocs(prev => [...prev, ...response.data.files]);
      setFiles([]);

      // Hide bar after 2 seconds
      setTimeout(() => setShowUploadBar(false), 2000);
    } catch (error) {
      console.error(error);
      uploadProgress.fail();
      setTimeout(() => setShowUploadBar(false), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Handle Asking Questions
  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    setAnswer('');
    setShowAskBar(true);
    askProgress.reset();
    // Small delay so state clears before starting
    setTimeout(() => askProgress.start(), 50);

    try {
      const response = await axios.post(`${API_URL}/api/ask`, { question });
      askProgress.finish();

      // Show 100% for 1 second, then reveal the answer
      setTimeout(() => {
        setShowAskBar(false);
        setAnswer(response.data.answer);
        askProgress.reset();
      }, 1000);
    } catch (error) {
      console.error(error);
      askProgress.fail();
      setTimeout(() => setShowAskBar(false), 3000);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="notebook-container">
      {/* Sidebar for Sources */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>My NotebookLM</h2>
        </div>

        <div className="upload-container">
          <h3>Add Sources</h3>
          <p className="subtitle">Upload PDFs or CSVs to chat with them</p>

          <label className="file-upload-wrapper">
            <input
              type="file"
              multiple
              accept="application/pdf,.csv"
              onChange={handleFileChange}
            />
            <div className="upload-box">
              <span className="upload-icon">📄</span>
              <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Select PDFs or CSVs'}</span>
            </div>
          </label>

          <button
            className="btn-upload"
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? 'Processing...' : 'Upload & Embed'}
          </button>

          {/* Upload Progress Bar */}
          {showUploadBar && (
            <ProgressBar
              progress={uploadProgress.progress}
              label={isUploading ? 'Embedding documents...' : 'Upload complete'}
              isComplete={uploadProgress.isComplete}
              isError={uploadProgress.isError}
            />
          )}
        </div>

        <div className="sources-list-container">
          <h3>Your Sources ({uploadedDocs.length})</h3>
          {uploadedDocs.length === 0 ? (
            <p className="empty-sources">No sources uploaded yet.</p>
          ) : (
            <ul className="sources-list">
              {uploadedDocs.map((doc, index) => (
                <li key={index} className="source-item">
                  <span className="source-icon">{doc.type === 'csv' ? '📊' : '📌'}</span>
                  <div className="source-info">
                    <span className="source-name">{doc.filename}</span>
                    <span className="source-size">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <div className="chat-content">
          {/* Ask Progress Bar overlay */}
          {showAskBar && (
            <div className="ask-progress-wrapper">
              <ProgressBar
                progress={askProgress.progress}
                label={isAsking ? 'Searching documents & generating answer...' : 'Answer ready!'}
                isComplete={askProgress.isComplete}
                isError={askProgress.isError}
              />
            </div>
          )}

          {!showAskBar && answer ? (
            <div className="message ai-message">
              <div className="message-header">
                <span className="ai-icon">✨</span>
                <strong>AI Assistant</strong>
              </div>
              <div className="message-body">{answer}</div>
            </div>
          ) : !showAskBar && (
            <div className="welcome-screen">
              <h1>Welcome to My NotebookLM</h1>
              <p>Upload your documents on the left, then ask questions below to extract insights.</p>
            </div>
          )}
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder={uploadedDocs.length > 0 ? 'Ask anything about your documents...' : 'Upload a document first...'}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              disabled={uploadedDocs.length === 0 || isAsking}
            />
            <button
              className="btn-ask"
              onClick={handleAsk}
              disabled={isAsking || !question.trim() || uploadedDocs.length === 0}
            >
              {isAsking ? <span className="spinner"></span> : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
