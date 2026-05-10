import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // State for Upload Section
  const [files, setFiles] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // State for Chat Section
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // 1. Handle File Selection
  const handleFileChange = (e) => {
    // Convert FileList to Array
    setFiles(Array.from(e.target.files));
  };

  // 2. Handle File Upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('Please select at least one file.');
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    setIsUploading(true);
    setUploadStatus('');

    try {
      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setUploadStatus(`Successfully processed ${files.length} document(s)!`);
      
      // Add the newly uploaded files to our sources list
      setUploadedDocs(prev => [...prev, ...response.data.files]);
      
      // Clear the file input state
      setFiles([]);
    } catch (error) {
      console.error(error);
      setUploadStatus('Upload failed. Is the server running?');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Handle Asking Questions
  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    setAnswer('');

    try {
      const response = await axios.post('http://localhost:5001/api/ask', {
        question: question,
      });
      setAnswer(response.data.answer);
    } catch (error) {
      console.error(error);
      setAnswer('Failed to get answer. Is the server running?');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="notebook-container">
      {/* Sidebar for Sources */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>NotebookLM Clone</h2>
        </div>

        <div className="upload-container">
          <h3>Add Sources</h3>
          <p className="subtitle">Upload PDFs to chat with them</p>
          
          <label className="file-upload-wrapper">
            <input 
              type="file" 
              multiple 
              accept="application/pdf" 
              onChange={handleFileChange} 
            />
            <div className="upload-box">
              <span className="upload-icon">📄</span>
              <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Select PDFs'}</span>
            </div>
          </label>

          <button 
            className="btn-upload" 
            onClick={handleUpload} 
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? 'Processing...' : 'Upload & Embed'}
          </button>
          
          {uploadStatus && (
            <p className={uploadStatus.includes('failed') ? 'status-text error' : 'status-text success'}>
              {uploadStatus}
            </p>
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
                  <span className="source-icon">📌</span>
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
          {answer ? (
            <div className="message ai-message">
              <div className="message-header">
                <span className="ai-icon">✨</span>
                <strong>AI Assistant</strong>
              </div>
              <div className="message-body">{answer}</div>
            </div>
          ) : (
            <div className="welcome-screen">
              <h1>Welcome to your Notebook</h1>
              <p>Upload your documents on the left, then ask questions below to extract insights.</p>
            </div>
          )}
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <input 
              type="text" 
              placeholder={uploadedDocs.length > 0 ? "Ask anything about your documents..." : "Upload a document first..."}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              disabled={uploadedDocs.length === 0}
            />
            <button 
              className="btn-ask" 
              onClick={handleAsk} 
              disabled={isAsking || !question.trim() || uploadedDocs.length === 0}
            >
              {isAsking ? (
                <span className="spinner"></span>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
