import { useState } from 'react';
import { Camera, Mic, Circle, Square, RotateCcw, AlertTriangle, FileAudio } from 'lucide-react';
import Button from './Button.jsx';
import './MediaPanel.css';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

export default function MediaPanel({ media, onTranscribe, onTranscribed }) {
  const {
    permissionStatus,
    permissionError,
    recordingStatus,
    elapsedSeconds,
    audioBlob,
    audioUrl,
    requestAccess,
    attachVideoEl,
    startRecording,
    stopRecording,
    resetRecording,
  } = media;

  const [transcribeStatus, setTranscribeStatus] = useState('idle'); // idle | loading | error
  const [transcribeError, setTranscribeError] = useState('');

  async function handleUseRecording() {
    if (!audioBlob) return;
    setTranscribeStatus('loading');
    setTranscribeError('');
    try {
      const { transcript, confidence, words } = await onTranscribe(audioBlob);
      setTranscribeStatus('idle');
      onTranscribed(transcript, confidence, words);
    } catch (error) {
      setTranscribeStatus('error');
      const message =
        error?.response?.status === 422
          ? "We couldn't hear anything clearly in that recording. Please try again or type your answer instead."
          : error?.response?.data?.message || 'Could not transcribe this recording. Please try again.';
      setTranscribeError(message);
    }
  }

  if (permissionStatus === 'idle') {
    return (
      <div className="media-panel media-panel--prompt">
        <Camera size={22} aria-hidden="true" />
        <p>Enable your camera and microphone to record your answers.</p>
        <Button variant="secondary" onClick={requestAccess}>
          Enable camera &amp; microphone
        </Button>
        <p className="media-panel__note">Optional — you can still type your answers without this.</p>
      </div>
    );
  }

  if (permissionStatus === 'requesting') {
    return (
      <div className="media-panel media-panel--prompt">
        <p>Requesting camera and microphone access…</p>
      </div>
    );
  }

  if (['denied', 'no-device', 'unsupported', 'error'].includes(permissionStatus)) {
    return (
      <div className="media-panel media-panel--error">
        <AlertTriangle size={20} aria-hidden="true" />
        <p>{permissionError}</p>
        {permissionStatus !== 'unsupported' && (
          <Button variant="secondary" onClick={requestAccess}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="media-panel">
      <div className="media-panel__preview">
        <video ref={attachVideoEl} autoPlay muted playsInline className="media-panel__video" />
        {recordingStatus === 'recording' && (
          <span className="media-panel__recording-badge">
            <Circle size={8} fill="currentColor" aria-hidden="true" />
            REC {formatTime(elapsedSeconds)}
          </span>
        )}
      </div>

      <div className="media-panel__controls">
        {recordingStatus === 'idle' && (
          <Button onClick={startRecording}>
            <Mic size={16} aria-hidden="true" />
            Record answer
          </Button>
        )}

        {recordingStatus === 'recording' && (
          <Button onClick={stopRecording} className="btn--danger">
            <Square size={16} aria-hidden="true" />
            Stop recording
          </Button>
        )}

        {recordingStatus === 'stopped' && (
          <>
            <audio controls src={audioUrl} className="media-panel__audio" />
            <Button onClick={handleUseRecording} loading={transcribeStatus === 'loading'}>
              <FileAudio size={16} aria-hidden="true" />
              Use this recording
            </Button>
            <Button variant="secondary" onClick={resetRecording} disabled={transcribeStatus === 'loading'}>
              <RotateCcw size={16} aria-hidden="true" />
              Re-record
            </Button>
          </>
        )}
      </div>

      {transcribeError && (
        <p className="form-error-banner" role="alert">
          {transcribeError}
        </p>
      )}

      <p className="media-panel__note">
        {recordingStatus === 'stopped'
          ? '"Use this recording" transcribes your speech into the answer box below, where you can review and edit it before submitting.'
          : 'Record your answer, then transcribe it into text, or simply type your answer below.'}
      </p>
    </div>
  );
}