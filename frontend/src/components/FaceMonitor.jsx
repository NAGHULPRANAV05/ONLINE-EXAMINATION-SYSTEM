import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { FaVideo, FaExclamationTriangle, FaCheckCircle, FaUsers, FaUserSlash } from 'react-icons/fa';

const MAX_VIOLATIONS = 3;
const DETECTION_INTERVAL_MS = 300; // Fast 300ms checks (~3.3 scans per second)
const NO_FACE_TIMEOUT_MS = 2000; // 2 seconds threshold before recording no-head violation
const YAW_THRESHOLD = 0.14; // Strict & sensitive threshold for slight left / right head turns
const VIOLATION_COOLDOWN_MS = 2500; // Cooldown to avoid registering 5 violations in a single second

function FaceMonitor({ onViolation, onTerminate, active }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const noFaceTimerRef = useRef(null);
    const violationCountRef = useRef(0);
    const lastViolationTimeRef = useRef(0);
    const isWarmedUpRef = useRef(false);

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
                    video: {
                        width: { ideal: 320 },
                        height: { ideal: 240 },
                        facingMode: 'user'
                    }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play().catch(console.warn);
                        setCameraReady(true);
                        setStatus('monitoring');
                        // 1.5s warmup buffer for video camera exposure to initialize
                        setTimeout(() => {
                            isWarmedUpRef.current = true;
                        }, 1500);
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

    // Handle violation with cooldown
    const triggerViolation = useCallback((message) => {
        const now = Date.now();
        setWarningMessage(message);

        // Enforce cooldown so 1 incident doesn't consume all 3 violation strikes immediately
        if (now - lastViolationTimeRef.current > VIOLATION_COOLDOWN_MS) {
            lastViolationTimeRef.current = now;
            violationCountRef.current += 1;
            const count = violationCountRef.current;
            setViolationCount(count);
            setStatus('violation');

            if (onViolation) onViolation(count);

            if (count >= MAX_VIOLATIONS) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
                if (onTerminate) onTerminate();
                return;
            }
        } else {
            setStatus('violation');
        }

        // Reset warning state after 2.5 seconds if exam not terminated
        setTimeout(() => {
            if (violationCountRef.current < MAX_VIOLATIONS) {
                setStatus('monitoring');
                setWarningMessage('');
            }
        }, 2500);
    }, [onViolation, onTerminate]);

    // Run high-sensitivity face & head detection loop
    useEffect(() => {
        if (!cameraReady || !active) return;

        const detectFace = async () => {
            const video = videoRef.current;
            if (!video || video.paused || video.ended || video.readyState < 2) return;

            try {
                const detections = await faceapi
                    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 224,
                        scoreThreshold: 0.22 // High-sensitivity detection
                    }))
                    .withFaceLandmarks();

                // Skip during camera warmup
                if (!isWarmedUpRef.current) return;

                // 1. HEAD / FACE NOT VISIBLE
                if (!detections || detections.length === 0) {
                    setStatus('no-face');
                    setWarningMessage('Head is not visible! Please face the camera.');

                    if (!noFaceTimerRef.current) {
                        noFaceTimerRef.current = setTimeout(() => {
                            triggerViolation('Head is not visible in the camera! (Violation)');
                            noFaceTimerRef.current = null;
                        }, NO_FACE_TIMEOUT_MS);
                    }
                    return;
                }

                // Head is visible — clear no-face timer
                if (noFaceTimerRef.current) {
                    clearTimeout(noFaceTimerRef.current);
                    noFaceTimerRef.current = null;
                }

                // 2. TWO OR MORE MEMBERS PRESENT
                if (detections.length >= 2) {
                    triggerViolation(`Two or more members detected (${detections.length} people)! Only 1 candidate allowed.`);
                    return;
                }

                // 3. SLIGHT HEAD TURN LEFT / RIGHT
                const detection = detections[0];
                const landmarks = detection.landmarks;
                const positions = landmarks.positions;

                // Key landmark points
                const nose = positions[30];      // Nose tip
                const leftEye = positions[36];    // Left eye outer corner
                const rightEye = positions[45];   // Right eye outer corner

                // Calculate face width & nose center offset for yaw ratio
                const faceWidth = rightEye.x - leftEye.x;
                const faceCenterX = (leftEye.x + rightEye.x) / 2;
                const noseOffsetX = nose.x - faceCenterX;

                // Yaw ratio: how far the nose is turned relative to face width
                const yawRatio = faceWidth > 0 ? (noseOffsetX / faceWidth) : 0;

                // High sensitivity head turn check (slight left or right)
                if (Math.abs(yawRatio) > YAW_THRESHOLD) {
                    const direction = yawRatio > 0 ? 'Right' : 'Left';
                    triggerViolation(`Head turned ${direction}! Please look straight at the screen.`);
                    return;
                }

                // Normal monitoring state
                if (violationCountRef.current < MAX_VIOLATIONS && status !== 'violation') {
                    setStatus('monitoring');
                    setWarningMessage('');
                }
            } catch (err) {
                console.warn('Face detection cycle error:', err);
            }
        };

        intervalRef.current = setInterval(detectFace, DETECTION_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (noFaceTimerRef.current) clearTimeout(noFaceTimerRef.current);
        };
    }, [cameraReady, active, triggerViolation, status]);

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
        'no-face': '#ef4444'
    };

    const statusLabels = {
        loading: 'Loading Camera...',
        monitoring: 'Camera Active',
        warning: 'Warning',
        violation: `Violation ${violationCount}/${MAX_VIOLATIONS}`,
        'no-face': 'Head Not Visible'
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
                        ) : status === 'no-face' ? (
                            <FaUserSlash style={{ marginRight: '0.3rem', fontSize: '0.65rem' }} />
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
                <div className={`face-monitor-warning ${status === 'violation' || status === 'no-face' ? 'face-monitor-warning-danger' : 'face-monitor-warning-caution'}`}>
                    <FaExclamationTriangle style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                    <span>{warningMessage}</span>
                    {violationCount > 0 && (
                        <span className="face-monitor-warning-count">
                            Violation {violationCount} of {MAX_VIOLATIONS}
                        </span>
                    )}
                </div>
            )}
        </>
    );
}

export default FaceMonitor;
