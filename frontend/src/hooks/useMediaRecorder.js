import { useCallback, useEffect, useRef, useState } from 'react';

const CANDIDATE_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

function pickSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || null;
}

/**
 * Manages getUserMedia + MediaRecorder for one interview session page.
 * permissionStatus: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'no-device' | 'error'
 * recordingStatus: 'idle' | 'recording' | 'stopped'
 */
export function useMediaRecorder() {
  const [permissionStatus, setPermissionStatus] = useState('idle');
  const [permissionError, setPermissionError] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');

  const streamRef = useRef(null);
  const videoElRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    stopTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  }, [stopTimer]);

  // Clean up camera/mic and any object URL when the component unmounts,
  // so the browser's recording indicator turns off and memory is freed.
  useEffect(() => {
    return () => {
      releaseStream();
      setAudioUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return '';
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAccess = useCallback(async () => {
    setPermissionError('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus('unsupported');
      return;
    }
    if (!pickSupportedMimeType()) {
      setPermissionStatus('unsupported');
      setPermissionError('Your browser does not support audio recording. Try Chrome or Edge.');
      return;
    }

    setPermissionStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoElRef.current) {
        videoElRef.current.srcObject = stream;
      }
      setPermissionStatus('granted');
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setPermissionError('Camera and microphone access was denied. Allow access in your browser settings to continue.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionStatus('no-device');
        setPermissionError('No camera or microphone was found on this device.');
      } else {
        setPermissionStatus('error');
        setPermissionError('Could not access your camera and microphone. Please try again.');
      }
    }
  }, []);

  const attachVideoEl = useCallback((el) => {
    videoElRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    const mimeType = pickSupportedMimeType();
    if (!mimeType) {
      setPermissionStatus('unsupported');
      return;
    }

    // Only record the audio track — video never leaves the browser (Phase 0 decision).
    const audioOnlyStream = new MediaStream(streamRef.current.getAudioTracks());
    const recorder = new MediaRecorder(audioOnlyStream, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setAudioBlob(blob);
      setAudioUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return URL.createObjectURL(blob);
      });
    };

    recorder.start();
    recorderRef.current = recorder;
    setRecordingStatus('recording');
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    stopTimer();
    setRecordingStatus('stopped');
  }, [stopTimer]);

  // Called when moving to a new question: discard the previous recording
  // and get ready to record a fresh one for the next question.
  const resetRecording = useCallback(() => {
    stopTimer();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    setRecordingStatus('idle');
    setElapsedSeconds(0);
    setAudioBlob(null);
    setAudioUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return '';
    });
  }, [stopTimer]);

  return {
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
    releaseStream,
  };
}