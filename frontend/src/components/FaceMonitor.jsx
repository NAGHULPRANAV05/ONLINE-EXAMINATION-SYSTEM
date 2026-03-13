import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { FaVideo, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const MAX_VIOLATIONS = 3;
const DETECTION_INTERVAL_MS = 400;
const NO_FACE_TIMEOUT_MS = 4000;
const YAW_THRESHOLD = 0.18; // ratio threshold for left/right head turn (lower = more sensitive)

function FaceMonitor({ onViolation, onTerminate, active }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const noFaceTimerRef = useRef(null);
    const violationCountRef = useRef(0);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [status, setStatus] = useState('loading'); // loading, monitoring, warning, violation, no-face
    const [violationCount, setViolationCount] = useState(0);
    const [warningMessage, setWarningMessage] = useState('');
    const [error, setError] = useState(null);

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error('Failed to load face detection models:', err);
                setError('Failed to load face detection models. Please refresh.');
            }
        };
        loadModels();
    }, []);

    // Start camera
    useEffect(() => {
        if (!modelsLoaded || !active) return;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setCameraReady(true);
                        setStatus('monitoring');
                    };
                }
            } catch (err) {
                console.error('Camera access denied:', err);
                setError('Camera access is required for this exam. Please allow camera access and refresh.');
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [modelsLoaded, active]);

    // Handle violation
    const triggerViolation = useCallback((message) => {
        violationCountRef.current += 1;
        const count = violationCountRef.current;
        setViolationCount(count);
        setStatus('violation');
        setWarningMessage(message);

        if (onViolation) onViolation(count);

        if (count >= MAX_VIOLATIONS) {
            // Stop detection and terminate
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
            if (onTerminate) onTerminate();
            return;
        }

        // Reset warning after 2 seconds
        setTimeout(() => {
            if (violationCountRef.current < MAX_VIOLATIONS) {
                setStatus('monitoring');
                setWarningMessage('');
            }
        }, 2000);
    }, [onViolation, onTerminate]);

    // Run face detection loop
    useEffect(() => {
        if (!cameraReady || !active) return;

        const detectFace = async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            try {
                const detections = await faceapi
                    .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 224,
                        scoreThreshold: 0.4
                    }))
                    .withFaceLandmarks();

                if (!detections || detections.length === 0) {
                    // No face detected — start no-face timer
                    if (!noFaceTimerRef.current) {
                        setStatus('no-face');
                        setWarningMessage('Face not detected! Please look at the screen.');
                        noFaceTimerRef.current = setTimeout(() => {
                            triggerViolation('Face not detected for too long!');
                            noFaceTimerRef.current = null;
                        }, NO_FACE_TIMEOUT_MS);
                    }
                    return;
                }

                // Face detected — clear no-face timer
                if (noFaceTimerRef.current) {
                    clearTimeout(noFaceTimerRef.current);
                    noFaceTimerRef.current = null;
                }

                // Multiple faces detected — violation
                if (detections.length > 1) {
                    triggerViolation(`Multiple faces detected (${detections.length})! Only one person allowed.`);
                    return;
                }

                // Analyze head pose using landmarks of the single face
                const detection = detections[0];
                const landmarks = detection.landmarks;
                const positions = landmarks.positions;

                // Key landmark points for head pose estimation
                const nose = positions[30];      // Nose tip
                const leftEye = positions[36];    // Left eye outer corner
                const rightEye = positions[45];   // Right eye outer corner
                const chin = positions[8];        // Chin bottom

                // Calculate face width and nose offset for yaw estimation
                const faceWidth = rightEye.x - leftEye.x;
                const faceCenterX = (leftEye.x + rightEye.x) / 2;
                const noseOffsetX = nose.x - faceCenterX;

                // Yaw ratio: how far the nose is off-center relative to face width
                const yawRatio = noseOffsetX / faceWidth;

                // Check if looking down: nose tip is significantly below eye line
                const eyeLineY = (leftEye.y + rightEye.y) / 2;
                const noseDropRatio = (nose.y - eyeLineY) / faceWidth;
                const isLookingDown = noseDropRatio > 0.55;

                // Determine if head is turned too far left or right
                if (Math.abs(yawRatio) > YAW_THRESHOLD && !isLookingDown) {
                    const direction = yawRatio > 0 ? 'right' : 'left';
                    triggerViolation(`Head turned ${direction}! Please face the screen.`);
                } else {
                    // All good
                    if (violationCountRef.current < MAX_VIOLATIONS) {
                        setStatus('monitoring');
                        setWarningMessage('');
                    }
                }
            } catch (err) {
                console.error('Face detection error:', err);
            }
        };

        intervalRef.current = setInterval(detectFace, DETECTION_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
        };
    }, [cameraReady, active, triggerViolation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    if (error) {
        return (
            <div className="face-monitor-error">
                <FaExclamationTriangle style={{ marginRight: '0.5rem' }} />
                {error}
            </div>
        );
    }

    if (!active) return null;

    const statusColors = {
        loading: '#94a3b8',
        monitoring: '#10b981',
        warning: '#f59e0b',
        violation: '#ef4444',
        'no-face': '#f59e0b'
    };

    const statusLabels = {
        loading: 'Loading...',
        monitoring: 'Monitoring',
        warning: 'Warning',
        violation: `Violation ${violationCount}/${MAX_VIOLATIONS}`,
        'no-face': 'Face Not Detected'
    };

    return (
        <>
            {/* Camera Preview Overlay */}
            <div className="face-monitor-overlay">
                <div className="face-monitor-video-container">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '0.5rem',
                            transform: 'scaleX(-1)'
                        }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Status indicator */}
                    <div className="face-monitor-status" style={{
                        background: statusColors[status],
                    }}>
                        {status === 'monitoring' ? (
                            <FaCheckCircle style={{ marginRight: '0.3rem', fontSize: '0.65rem' }} />
                        ) : (
                            <FaExclamationTriangle style={{ marginRight: '0.3rem', fontSize: '0.65rem' }} />
                        )}
                        <span>{statusLabels[status]}</span>
                    </div>

                    {/* Violation counter */}
                    {violationCount > 0 && (
                        <div className="face-monitor-violation-badge">
                            {violationCount}/{MAX_VIOLATIONS}
                        </div>
                    )}
                </div>
            </div>

            {/* Warning Banner */}
            {warningMessage && (
                <div className={`face-monitor-warning ${status === 'violation' ? 'face-monitor-warning-danger' : 'face-monitor-warning-caution'}`}>
                    <FaExclamationTriangle style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                    <span>{warningMessage}</span>
                    {violationCount > 0 && (
                        <span className="face-monitor-warning-count">
                            Warning {violationCount} of {MAX_VIOLATIONS}
                        </span>
                    )}
                </div>
            )}
        </>
    );
}

export default FaceMonitor;
