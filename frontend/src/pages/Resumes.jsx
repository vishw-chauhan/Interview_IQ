import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, UploadCloud, Trash2, Sparkles } from 'lucide-react';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchRoles } from '../services/roles.service.js';
import { uploadResume, fetchResumes, deleteResume } from '../services/resume.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';
import { formatBytes } from '../utils/formatBytes.js';
import './Resumes.css';

const ACCEPTED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only PDF, DOC and DOCX files are supported.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'File is too large. Maximum size is 5MB.';
  }
  return '';
}

function ResumeCard({ resume, onDelete, isDeleting }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="card resume-card">
      <div className="resume-card__icon">
        <FileText size={20} aria-hidden="true" />
      </div>

      <div className="resume-card__info">
        <p className="resume-card__name" title={resume.originalName}>
          {resume.originalName}
        </p>
        <p className="resume-card__meta">
          {resume.targetRoleName || 'No target role'} · {formatBytes(resume.fileSize)} ·{' '}
          {new Date(resume.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="resume-card__actions">
        <Button variant="secondary" disabled title="Coming in Phase 5">
          <Sparkles size={15} aria-hidden="true" />
          Analyze
        </Button>

        {confirming ? (
          <div className="resume-card__confirm">
            <span>Delete this resume?</span>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button onClick={() => onDelete(resume.id)} loading={isDeleting} className="btn--danger">
              Confirm
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="resume-card__delete-btn"
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${resume.originalName}`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Resumes() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [roles, setRoles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const [resumes, setResumes] = useState([]);
  const [listStatus, setListStatus] = useState('loading'); // loading | ready | error
  const [listError, setListError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user?.targetRoleId) {
      setTargetRoleId(String(user.targetRoleId));
    }
    fetchRoles()
      .then(setRoles)
      .catch(() => {
        /* role dropdown just stays empty; upload can still proceed without a role */
      });
  }, [user]);

  const loadResumes = useCallback(async () => {
    setListStatus('loading');
    setListError('');
    try {
      const data = await fetchResumes();
      setResumes(data);
      setListStatus('ready');
    } catch (error) {
      setListError(getErrorMessage(error, 'Could not load your resumes.'));
      setListStatus('error');
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  function pickFile(file) {
    if (!file) return;
    const error = validateFile(file);
    setFileError(error);
    setSelectedFile(error ? null : file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragActive(false);
    pickFile(event.dataTransfer.files?.[0]);
  }

  async function handleUpload(event) {
    event.preventDefault();
    setUploadError('');

    if (!selectedFile) {
      setFileError('Choose a resume file first.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadResume({ file: selectedFile, targetRoleId: targetRoleId || undefined });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadResumes();
    } catch (error) {
      setUploadError(getErrorMessage(error, 'Could not upload your resume.'));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((resume) => resume.id !== id));
    } catch (error) {
      setListError(getErrorMessage(error, 'Could not delete this resume.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="resumes-page">
      <div>
        <h1>Resumes</h1>
        <p className="resumes-page__subtitle">Upload a resume and select your target role.</p>
      </div>

      <form className="card resume-upload" onSubmit={handleUpload}>
        <div
          className={`dropzone ${isDragActive ? 'dropzone--active' : ''} ${selectedFile ? 'dropzone--filled' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="dropzone__input"
            onChange={(event) => pickFile(event.target.files?.[0])}
          />
          <UploadCloud size={24} aria-hidden="true" />
          {selectedFile ? (
            <p className="dropzone__filename">{selectedFile.name}</p>
          ) : (
            <>
              <p>Click to browse or drag a file here</p>
              <p className="dropzone__hint">PDF, DOC or DOCX, up to 5MB</p>
            </>
          )}
        </div>
        {fileError && <span className="form-field__error">{fileError}</span>}

        <div className="form-field">
          <label htmlFor="targetRoleId">Target role</label>
          <select
            id="targetRoleId"
            value={targetRoleId}
            onChange={(event) => setTargetRoleId(event.target.value)}
            disabled={isUploading}
          >
            <option value="">Select a role (optional)</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {uploadError && (
          <p className="form-error-banner" role="alert">
            {uploadError}
          </p>
        )}

        <Button type="submit" loading={isUploading} disabled={!selectedFile}>
          Upload resume
        </Button>
      </form>

      <section className="resumes-list">
        <h2 className="resumes-list__title">Your resumes</h2>

        {listStatus === 'loading' && (
          <div className="resumes-list__grid">
            {[1, 2].map((key) => (
              <div className="card resume-card resume-card--skeleton" key={key}>
                <Skeleton style={{ width: 38, height: 38, borderRadius: 10 }} />
                <div className="resume-card__info">
                  <Skeleton style={{ width: '60%', height: 14, marginBottom: 8 }} />
                  <Skeleton style={{ width: '40%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {listStatus === 'error' && (
          <p className="form-error-banner" role="alert">
            {listError}
          </p>
        )}

        {listStatus === 'ready' && resumes.length === 0 && (
          <div className="card">
            <EmptyState
              icon={FileText}
              title="No resumes yet"
              description="Upload your first resume above to get started."
            />
          </div>
        )}

        {listStatus === 'ready' && resumes.length > 0 && (
          <>
            {listError && (
              <p className="form-error-banner" role="alert">
                {listError}
              </p>
            )}
            <div className="resumes-list__grid">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onDelete={handleDelete}
                  isDeleting={deletingId === resume.id}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}