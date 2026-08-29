import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Timer from '../components/Timer';
import CodeEditor from '../components/CodeEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import FaceMonitor from '../components/FaceMonitor';
import { examAPI, resultAPI } from '../services/api';
import {
    FaChevronLeft,
    FaChevronRight,
    FaBookmark,
    FaRegBookmark,
    FaCheck,
    FaPlay,
    FaShieldAlt,
    FaExclamationTriangle,
    FaCopy,
    FaEraser,
    FaCode,
    FaListUl,
    FaTh,
    FaTimes,
    FaCheckCircle,
    FaQuestionCircle
} from 'react-icons/fa';
import './ExamInterface.css';

function ExamInterface() {
    const { examId } = useParams();
    const navigate = useNavigate();

    // Core state
    const [exam, setExam] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [startTime] = useState(Date.now());
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showInstructions, setShowInstructions] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);

    // Proctoring
    const [proctoringViolations, setProctoringViolations] = useState(0);
    const proctoringTerminatedRef = useRef(false);

    useEffect(() => {
        fetchExam();

        // Right-click prevention
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);

        // Tab switch detection
        const handleVisibilityChange = () => {
            if (document.hidden && !showInstructions) {
                setTabSwitchCount(prev => prev + 1);
                alert('⚠️ Tab switching is recorded.');
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [showInstructions]);

    // Keyboard Shortcuts (← / →, 1-4, A-D, M for flag)
    useEffect(() => {
        if (showInstructions || !exam || showSubmitModal) return;

        const handleKeyDown = (e) => {
            const tag = e.target.tagName.toLowerCase();
            const isInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable || e.target.closest('.monaco-editor');

            if (e.key === 'Escape') {
                setShowSubmitModal(false);
                return;
            }

            if (isInput) return;

            // Prev / Next
            if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
                e.preventDefault();
                setCurrentQuestionIndex(prev => prev - 1);
            } else if (e.key === 'ArrowRight' && currentQuestionIndex < exam.questions.length - 1) {
                e.preventDefault();
                setCurrentQuestionIndex(prev => prev + 1);
            }

            // Flag toggle
            if (e.key === 'm' || e.key === 'M') {
                const currentQ = exam.questions[currentQuestionIndex];
                if (currentQ) toggleFlag(currentQ._id);
            }

            // Option selection for MCQ
            const currentQ = exam.questions[currentQuestionIndex];
            if (currentQ && currentQ.type !== 'coding' && currentQ.options) {
                const key = e.key.toUpperCase();
                let chosen = null;
                if (['A', 'B', 'C', 'D'].includes(key)) {
                    const idx = key.charCodeAt(0) - 65;
                    if (idx < currentQ.options.length) chosen = key;
                } else if (['1', '2', '3', '4'].includes(e.key)) {
                    const idx = parseInt(e.key, 10) - 1;
                    if (idx < currentQ.options.length) chosen = String.fromCharCode(65 + idx);
                }

                if (chosen) {
                    e.preventDefault();
                    handleAnswer(currentQ._id, chosen);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showInstructions, exam, currentQuestionIndex, showSubmitModal]);

    const fetchExam = async () => {
        try {
            const response = await examAPI.getById(examId);
            if (!response.data.exam || !response.data.exam.questions?.length) {
                setError('Exam not found or has no questions.');
                return;
            }
            setExam(response.data.exam);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load exam.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleClearAnswer = (questionId) => {
        setAnswers(prev => {
            const updated = { ...prev };
            delete updated[questionId];
            return updated;
        });
    };

    const toggleFlag = (questionId) => {
        setFlaggedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    const handleSaveAndNext = (questionId) => {
        if (currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleMarkAndNext = (questionId) => {
        toggleFlag(questionId);
        if (currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleCopyTestCase = (text, idx) => {
        navigator.clipboard.writeText(text || '');
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    };

    const handleSubmit = async (isAuto = false) => {
        setSubmitting(true);
        setShowSubmitModal(false);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);

        const formattedAnswers = exam.questions.map(q => ({
            questionId: q._id,
            userAnswer: answers[q._id] || ''
        }));

        try {
            const response = await resultAPI.submit({
                examId,
                answers: formattedAnswers,
                timeTaken,
                tabSwitchCount,
                proctoringTerminated: isAuto || proctoringTerminatedRef.current
            });
            navigate(`/student/result/${response.data.result.id}`);
        } catch (err) {
            alert('Submission error: ' + (err.response?.data?.message || err.message));
            setSubmitting(false);
        }
    };

    const handleProctoringTerminate = () => {
        proctoringTerminatedRef.current = true;
        alert('⚠️ Exam terminated due to proctoring violation. Auto-submitting...');
        handleSubmit(true);
    };

    const answeredCount = exam ? exam.questions.filter(q => answers[q._id] && answers[q._id].toString().trim()).length : 0;
    const flaggedCount = exam ? exam.questions.filter(q => flaggedQuestions[q._id]).length : 0;
    const unansweredCount = exam ? exam.questions.length - answeredCount : 0;

    // Loading State
    if (loading) return <LoadingSpinner />;

    // Error State
    if (error) {
        return (
            <div className="apt-instructions-wrapper">
                <div className="apt-card" style={{ textAlign: 'center', maxWidth: '440px' }}>
                    <FaExclamationTriangle style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Unable to Load Exam</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
                    <button className="btn-apt-primary" onClick={() => navigate('/student/dashboard')}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    // Instructions Screen
    if (showInstructions) {
        return (
            <div className="apt-instructions-wrapper">
                <div className="apt-card instructions-card">
                    <div className="inst-header">
                        <span className="inst-tag">{exam.subject?.name || 'Assessment'}</span>
                        <h1>{exam.title}</h1>
                        <p>{exam.description || 'Answer the questions within the allotted time limit.'}</p>
                    </div>

                    <div className="inst-stats">
                        <div className="inst-stat-box">
                            <span className="inst-val">{exam.duration}m</span>
                            <span className="inst-lbl">Duration</span>
                        </div>
                        <div className="inst-stat-box">
                            <span className="inst-val">{exam.questions.length}</span>
                            <span className="inst-lbl">Questions</span>
                        </div>
                        <div className="inst-stat-box">
                            <span className="inst-val">{exam.totalMarks}</span>
                            <span className="inst-lbl">Total Marks</span>
                        </div>
                    </div>

                    <div className="inst-rules">
                        <h3>Quick Instructions</h3>
                        <ul>
                            <li>Click any option or press <kbd>A</kbd>, <kbd>B</kbd>, <kbd>C</kbd>, <kbd>D</kbd> on your keyboard.</li>
                            <li>Use the Question Palette on the right to jump to any question instantly.</li>
                            <li>Answers are automatically saved as you go.</li>
                            <li>Click <strong>Submit Exam</strong> when you are finished.</li>
                        </ul>
                    </div>

                    <button className="btn-apt-primary start-btn" onClick={() => setShowInstructions(false)}>
                        <FaPlay style={{ fontSize: '0.8rem' }} /> Start Exam
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];
    const isCoding = currentQuestion?.type === 'coding';
    const isFlagged = Boolean(flaggedQuestions[currentQuestion._id]);

    return (
        <div className="apt-exam-root">
            {/* Webcam Proctoring */}
            <FaceMonitor
                active={!showInstructions}
                onViolation={(c) => setProctoringViolations(c)}
                onTerminate={handleProctoringTerminate}
            />

            {/* ─── Top Bar ─── */}
            <header className="apt-top-bar">
                <div className="top-bar-left">
                    <span className="apt-subject-pill">{exam.subject?.name || 'Exam'}</span>
                    <h2 className="apt-exam-title">{exam.title}</h2>
                </div>

                <div className="top-bar-right">
                    <Timer duration={exam.duration} onTimeUp={() => handleSubmit(true)} />
                    <button
                        type="button"
                        className="btn-apt-submit"
                        onClick={() => setShowSubmitModal(true)}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </header>

            {/* ─── Main Aptitude Body ─── */}
            <main className="apt-main-layout">
                {isCoding ? (
                    /* ─── Coding Layout ─── */
                    <div className="apt-coding-wrapper">
                        {/* Left: Problem Pane */}
                        <div className="apt-problem-pane">
                            <div className="pane-header-row">
                                <div className="q-badge-group">
                                    <span className="q-badge">Question {currentQuestionIndex + 1}</span>
                                    <span className="q-tag-code"><FaCode /> Coding</span>
                                    <span className="q-marks-tag">{currentQuestion.marks} Marks</span>
                                </div>
                                <button
                                    type="button"
                                    className={`btn-flag-pill ${isFlagged ? 'flagged' : ''}`}
                                    onClick={() => toggleFlag(currentQuestion._id)}
                                >
                                    {isFlagged ? <FaBookmark /> : <FaRegBookmark />}
                                    <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
                                </button>
                            </div>

                            <div className="problem-text-scroll">
                                <h3 className="section-heading">Problem Description</h3>
                                <div className="problem-body-text">
                                    {currentQuestion.questionText}
                                </div>

                                {currentQuestion.testCases?.length > 0 && (
                                    <div className="sample-cases-block">
                                        <h4 className="sample-heading">
                                            Test Cases ({currentQuestion.testCases.length} Total • {currentQuestion.testCases.filter(tc => !tc.isHidden).length} Public, {currentQuestion.testCases.filter(tc => tc.isHidden).length} Hidden)
                                        </h4>

                                        {currentQuestion.testCases.map((tc, idx) => {
                                            const isHidden = tc.isHidden;
                                            return isHidden ? (
                                                <div key={idx} className="sample-case-box hidden-case-entry">
                                                    <div className="sample-case-top">
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '700' }}>
                                                            🔒 Test Case {idx + 1} (Hidden)
                                                        </span>
                                                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>
                                                            Evaluated on execution
                                                        </span>
                                                    </div>
                                                    <div className="sample-case-row">
                                                        <span className="sample-lbl">Input</span>
                                                        <pre style={{ fontStyle: 'italic', color: '#64748b' }}>[Hidden Input]</pre>
                                                    </div>
                                                    <div className="sample-case-row">
                                                        <span className="sample-lbl">Output</span>
                                                        <pre style={{ fontStyle: 'italic', color: '#64748b' }}>[Hidden Output]</pre>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div key={idx} className="sample-case-box">
                                                    <div className="sample-case-top">
                                                        <span>Example {idx + 1}</span>
                                                        <button
                                                            type="button"
                                                            className="btn-copy-sm"
                                                            onClick={() => handleCopyTestCase(tc.input, idx)}
                                                        >
                                                            {copiedIdx === idx ? <><FaCheck /> Copied</> : <><FaCopy /> Copy Input</>}
                                                        </button>
                                                    </div>
                                                    <div className="sample-case-row">
                                                        <span className="sample-lbl">Input</span>
                                                        <pre>{tc.input || '(empty)'}</pre>
                                                    </div>
                                                    <div className="sample-case-row">
                                                        <span className="sample-lbl">Output</span>
                                                        <pre>{tc.output || '(empty)'}</pre>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="pane-footer-bar">
                                <button
                                    type="button"
                                    className="btn-prev"
                                    disabled={currentQuestionIndex === 0}
                                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                >
                                    <FaChevronLeft /> Previous
                                </button>
                                <span className="status-label">
                                    {answers[currentQuestion._id] ? '✓ Code Saved' : '○ Not answered'}
                                </span>
                                <button
                                    type="button"
                                    className="btn-next"
                                    disabled={currentQuestionIndex === exam.questions.length - 1}
                                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                >
                                    Next <FaChevronRight />
                                </button>
                            </div>
                        </div>

                        {/* Right: Code Editor */}
                        <div className="apt-editor-pane">
                            <CodeEditor
                                language={exam.subject?.language || 'python'}
                                initialCode={answers[currentQuestion._id] || ''}
                                testCases={currentQuestion.testCases}
                                onCodeChange={(code) => handleAnswer(currentQuestion._id, code)}
                            />
                        </div>
                    </div>
                ) : (
                    /* ─── Aptitude / MCQ Comfortable 2-Column Layout ─── */
                    <div className="apt-mcq-layout">
                        {/* Left Column: Question & Options (Comfortable, large, legible) */}
                        <div className="apt-question-area">
                            <div className="apt-question-card">
                                {/* Question Top Bar */}
                                <div className="apt-q-header">
                                    <div className="apt-q-meta">
                                        <span className="apt-q-number">Question {currentQuestionIndex + 1}</span>
                                        <span className="apt-q-marks">{currentQuestion.marks} Marks</span>
                                    </div>

                                    <div className="apt-q-actions">
                                        <button
                                            type="button"
                                            className={`btn-flag-pill ${isFlagged ? 'flagged' : ''}`}
                                            onClick={() => toggleFlag(currentQuestion._id)}
                                            title="Bookmark for review (M)"
                                        >
                                            {isFlagged ? <FaBookmark /> : <FaRegBookmark />}
                                            <span>{isFlagged ? 'Marked for Review' : 'Mark for Review'}</span>
                                        </button>

                                        {answers[currentQuestion._id] && (
                                            <button
                                                type="button"
                                                className="btn-clear-pill"
                                                onClick={() => handleClearAnswer(currentQuestion._id)}
                                                title="Clear option"
                                            >
                                                <FaEraser /> Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Question Statement */}
                                <div className="apt-q-text">
                                    {currentQuestion.questionText}
                                </div>

                                {/* Options List */}
                                <div className="apt-options-list">
                                    {(currentQuestion.options || []).map((option, index) => {
                                        const letter = String.fromCharCode(65 + index);
                                        const isSelected = answers[currentQuestion._id] === letter;

                                        return (
                                            <div
                                                key={index}
                                                className={`apt-option-row ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleAnswer(currentQuestion._id, letter)}
                                            >
                                                <div className="apt-option-bullet">
                                                    {letter}
                                                </div>
                                                <div className="apt-option-body">
                                                    {option}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Action Row */}
                                <div className="apt-bottom-actions">
                                    <div className="bottom-left">
                                        <button
                                            type="button"
                                            className="btn-apt-secondary"
                                            disabled={currentQuestionIndex === 0}
                                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                        >
                                            <FaChevronLeft /> Previous
                                        </button>
                                    </div>

                                    <div className="bottom-right">
                                        <button
                                            type="button"
                                            className="btn-apt-review"
                                            onClick={() => handleMarkAndNext(currentQuestion._id)}
                                        >
                                            <FaBookmark /> Mark & Next
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-apt-primary-save"
                                            onClick={() => handleSaveAndNext(currentQuestion._id)}
                                        >
                                            Save & Next <FaChevronRight />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Always Visible Question Palette Grid */}
                        <div className="apt-sidebar-palette">
                            <div className="palette-box">
                                <div className="palette-header">
                                    <h3>Question Palette</h3>
                                    <span className="palette-count">{answeredCount}/{exam.questions.length}</span>
                                </div>

                                {/* Legend Chips */}
                                <div className="palette-chips-row">
                                    <div className="chip answered">
                                        <span className="chip-count">{answeredCount}</span> Answered
                                    </div>
                                    <div className="chip not-answered">
                                        <span className="chip-count">{unansweredCount}</span> Unanswered
                                    </div>
                                    <div className="chip flagged">
                                        <span className="chip-count">{flaggedCount}</span> Flagged
                                    </div>
                                </div>

                                {/* Questions Matrix Grid */}
                                <div className="palette-matrix">
                                    {exam.questions.map((q, idx) => {
                                        const isAns = Boolean(answers[q._id]?.toString().trim());
                                        const isFlg = Boolean(flaggedQuestions[q._id]);
                                        const isCur = idx === currentQuestionIndex;

                                        let statusClass = 'unanswered';
                                        if (isAns) statusClass = 'answered';
                                        if (isFlg) statusClass = 'flagged';

                                        return (
                                            <button
                                                key={q._id || idx}
                                                type="button"
                                                className={`matrix-btn ${statusClass} ${isCur ? 'active' : ''}`}
                                                onClick={() => setCurrentQuestionIndex(idx)}
                                                title={`Question ${idx + 1}`}
                                            >
                                                {idx + 1}
                                                {isFlg && <span className="flag-corner"></span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ─── Submit Confirmation Modal ─── */}
            {showSubmitModal && (
                <div className="apt-modal-overlay" onClick={() => setShowSubmitModal(false)}>
                    <div className="apt-submit-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-icon-wrap">
                            <FaShieldAlt />
                        </div>
                        <h3>Submit Exam</h3>
                        <p>Are you sure you want to finish and submit your exam?</p>

                        <div className="modal-summary-grid">
                            <div className="summary-item answered">
                                <span className="summary-number">{answeredCount}</span>
                                <span className="summary-text">Answered</span>
                            </div>
                            <div className="summary-item unanswered">
                                <span className="summary-number">{unansweredCount}</span>
                                <span className="summary-text">Unanswered</span>
                            </div>
                            <div className="summary-item flagged">
                                <span className="summary-number">{flaggedCount}</span>
                                <span className="summary-text">Flagged</span>
                            </div>
                        </div>

                        {unansweredCount > 0 && (
                            <div className="unanswered-warning">
                                <FaExclamationTriangle />
                                <span>You have <strong>{unansweredCount} unanswered questions</strong>.</span>
                            </div>
                        )}

                        <div className="modal-btn-row">
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => setShowSubmitModal(false)}
                            >
                                Back to Exam
                            </button>
                            <button
                                type="button"
                                className="btn-modal-confirm"
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Confirm Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExamInterface;
