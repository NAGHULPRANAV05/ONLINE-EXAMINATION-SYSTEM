import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Timer from '../components/Timer';
import CodeEditor from '../components/CodeEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import FaceMonitor from '../components/FaceMonitor';
import { examAPI, resultAPI } from '../services/api';
import {
    FaExclamationTriangle,
    FaChevronLeft,
    FaChevronRight,
    FaVideo,
    FaClock,
    FaQuestionCircle,
    FaTrophy,
    FaPlay,
    FaCheckCircle,
    FaPaperPlane,
    FaShieldAlt,
    FaKeyboard,
    FaBan,
    FaSyncAlt,
    FaFlask
} from 'react-icons/fa';
import './ExamInterface.css';

function ExamInterface() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [startTime] = useState(Date.now());
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showInstructions, setShowInstructions] = useState(true);
    const [proctoringViolations, setProctoringViolations] = useState(0);
    const [proctoringTerminated, setProctoringTerminated] = useState(false);
    const proctoringTerminatedRef = useRef(false);

    useEffect(() => {
        fetchExam();

        // Disable right-click
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);

        // Tab switch detection
        const handleVisibilityChange = () => {
            if (document.hidden && !showInstructions) {
                setTabSwitchCount(prev => prev + 1);
                alert('Warning: Tab switching is being monitored!');
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [showInstructions]);

    // Keyboard navigation
    useEffect(() => {
        if (showInstructions || !exam) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
                setCurrentQuestionIndex(prev => prev - 1);
            } else if (e.key === 'ArrowRight' && currentQuestionIndex < exam.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showInstructions, exam, currentQuestionIndex]);

    const fetchExam = async () => {
        try {
            const response = await examAPI.getById(examId);

            if (!response.data.exam) {
                setError('Exam not found');
                return;
            }

            if (!response.data.exam.questions || response.data.exam.questions.length === 0) {
                setError('This exam has no questions');
                return;
            }

            setExam(response.data.exam);
        } catch (error) {
            console.error('Error fetching exam:', error);
            setError(error.response?.data?.message || 'Failed to load exam. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId, answer) => {
        setAnswers({
            ...answers,
            [questionId]: answer
        });
    };

    const handleSubmit = async (isProctoring = false) => {
        if (!isProctoring && !window.confirm('Are you sure you want to submit the exam?')) return;

        setSubmitting(true);
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
                proctoringTerminated: isProctoring || proctoringTerminatedRef.current
            });

            navigate(`/student/result/${response.data.result.id}`);
        } catch (error) {
            alert('Error submitting exam: ' + (error.response?.data?.message || error.message));
            setSubmitting(false);
        }
    };

    const handleProctoringViolation = (count) => {
        setProctoringViolations(count);
    };

    const handleProctoringTerminate = () => {
        setProctoringTerminated(true);
        proctoringTerminatedRef.current = true;
        alert('⚠️ Exam terminated due to proctoring violations! Your exam will be auto-submitted.');
        handleSubmit(true);
    };

    const getAnsweredCount = useCallback(() => {
        if (!exam) return 0;
        return exam.questions.filter(q => answers[q._id]).length;
    }, [exam, answers]);

    // ─── Loading ────────────────────────────────────
    if (loading) return <LoadingSpinner />;

    // ─── Error State ────────────────────────────────
    if (error) {
        return (
            <>
                <Navbar />
                <div className="exam-instructions-wrapper">
                    <div className="exam-instructions-card" style={{ textAlign: 'center', maxWidth: '520px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f87171' }}>
                            <FaExclamationTriangle />
                        </div>
                        <h2 style={{ color: '#f87171', marginBottom: '0.75rem' }}>Something went wrong</h2>
                        <p style={{ fontSize: '1.05rem', color: '#64748b', marginBottom: '2rem' }}>{error}</p>
                        <button
                            onClick={() => navigate('/student/dashboard')}
                            className="exam-start-btn"
                            style={{ maxWidth: '280px', margin: '0 auto' }}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!exam) return <div>Exam not found</div>;

    // ─── Instructions Screen ────────────────────────
    if (showInstructions) {
        return (
            <>
                <Navbar />
                <div className="exam-instructions-wrapper">
                    <div className="exam-instructions-card">
                        <h1>{exam.title}</h1>
                        <p className="exam-desc">{exam.description}</p>

                        {/* Quick info grid */}
                        <div className="exam-info-grid">
                            <div className="exam-info-item">
                                <span className="info-icon">⏱️</span>
                                <span className="info-value">{exam.duration}</span>
                                <span className="info-label">Minutes</span>
                            </div>
                            <div className="exam-info-item">
                                <span className="info-icon">📝</span>
                                <span className="info-value">{exam.questions.length}</span>
                                <span className="info-label">Questions</span>
                            </div>
                            <div className="exam-info-item">
                                <span className="info-icon">🏆</span>
                                <span className="info-value">{exam.totalMarks}</span>
                                <span className="info-label">Total Marks</span>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="exam-rules-section">
                            <h3>
                                <FaShieldAlt style={{ color: '#2563eb' }} />
                                Exam Guidelines
                            </h3>
                            <ul className="exam-rules-list">
                                <li>
                                    <span className="rule-icon" style={{ color: '#10b981' }}>✓</span>
                                    Your answers are saved automatically as you go
                                </li>
                                <li>
                                    <span className="rule-icon" style={{ color: '#10b981' }}>✓</span>
                                    Use the navigation dots or arrow keys ← → to move between questions
                                </li>
                                <li>
                                    <span className="rule-icon" style={{ color: '#10b981' }}>✓</span>
                                    The exam will auto-submit when the timer reaches zero
                                </li>
                                <li>
                                    <span className="rule-icon" style={{ color: '#f59e0b' }}>⚠</span>
                                    Do not switch tabs — tab switches are being monitored
                                </li>
                                <li>
                                    <span className="rule-icon" style={{ color: '#f59e0b' }}>⚠</span>
                                    Right-click has been disabled during the exam
                                </li>
                                <li className="rule-danger">
                                    <span className="rule-icon"><FaVideo /></span>
                                    Camera will monitor your head position — looking away may result in exam termination
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setShowInstructions(false)}
                            className="exam-start-btn"
                        >
                            <FaPlay style={{ fontSize: '0.9rem' }} />
                            Begin Exam
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];

    // Safety check
    if (!currentQuestion) {
        return (
            <>
                <Navbar />
                <div className="exam-instructions-wrapper">
                    <div className="exam-instructions-card" style={{ textAlign: 'center', maxWidth: '520px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f87171' }}>
                            <FaExclamationTriangle />
                        </div>
                        <h2 style={{ color: '#f87171', marginBottom: '0.75rem' }}>No Questions Available</h2>
                        <p style={{ fontSize: '1.05rem', color: '#64748b', marginBottom: '2rem' }}>
                            This exam does not have any questions yet. Please contact your administrator.
                        </p>
                        <button
                            onClick={() => navigate('/student/dashboard')}
                            className="exam-start-btn"
                            style={{ maxWidth: '280px', margin: '0 auto' }}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // Check if question is a populated object or just an ID
    if (typeof currentQuestion === 'string' || !currentQuestion.questionText) {
        return (
            <>
                <Navbar />
                <div className="exam-instructions-wrapper">
                    <div className="exam-instructions-card" style={{ textAlign: 'center', maxWidth: '520px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f87171' }}>
                            <FaSyncAlt />
                        </div>
                        <h2 style={{ color: '#f87171', marginBottom: '0.75rem' }}>Questions Not Loaded</h2>
                        <p style={{ fontSize: '1.05rem', color: '#64748b', marginBottom: '2rem' }}>
                            Questions could not be loaded properly. Please go back and try again.
                        </p>
                        <button
                            onClick={() => navigate('/student/dashboard')}
                            className="exam-start-btn"
                            style={{ maxWidth: '280px', margin: '0 auto' }}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const isCodingQuestion = currentQuestion.type === 'coding';
    const answeredCount = getAnsweredCount();
    const progressPercent = (answeredCount / exam.questions.length) * 100;

    return (
        <>
            {/* Face Monitor */}
            <FaceMonitor
                active={!showInstructions}
                onViolation={handleProctoringViolation}
                onTerminate={handleProctoringTerminate}
            />

            {/* ─── Exam Header ─────────────────────────────── */}
            <div className="exam-header">
                <div className="exam-header-left">
                    <h2 className="exam-header-title">{exam.title}</h2>
                    <span className="exam-q-counter">
                        {currentQuestionIndex + 1} / {exam.questions.length}
                    </span>
                </div>

                {/* Question navigator dots */}
                <div className="exam-header-center">
                    <div className="exam-progress-dots">
                        {exam.questions.map((q, idx) => (
                            <button
                                key={idx}
                                className={`progress-dot ${idx === currentQuestionIndex ? 'active' : ''} ${answers[q._id] ? 'answered' : ''}`}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                title={`Question ${idx + 1}${answers[q._id] ? ' (answered)' : ''}`}
                            >
                                {answers[q._id] ? '✓' : idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="exam-header-right">
                    <Timer duration={exam.duration} onTimeUp={() => handleSubmit()} />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={submitting}
                        className="exam-submit-btn"
                    >
                        <FaPaperPlane />
                        {submitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="exam-progress-bar-wrapper">
                <div className="exam-progress-bar" style={{ width: `${progressPercent}%` }} />
            </div>

            {/* ─── Exam Body ───────────────────────────────── */}
            <div className="exam-body">
                {isCodingQuestion ? (
                    /* ─── Coding Question Layout ──────────── */
                    <div className="exam-coding-layout">
                        {/* Left: Problem Statement */}
                        <div className="exam-problem-panel">
                            <div className="exam-problem-header">
                                <div className="exam-question-meta">
                                    <span className="badge badge-primary">
                                        Q{currentQuestionIndex + 1}
                                    </span>
                                    <span className="badge badge-success">CODING</span>
                                    <span className="badge badge-warning">
                                        {currentQuestion.marks} marks
                                    </span>
                                </div>
                                <div className="exam-nav-arrows">
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                        disabled={currentQuestionIndex === 0}
                                        className="exam-nav-arrow"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                        disabled={currentQuestionIndex === exam.questions.length - 1}
                                        className="exam-nav-arrow"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>

                            <div className="exam-problem-body">
                                <h3>Problem Statement</h3>
                                <div className="exam-problem-text">
                                    {currentQuestion.questionText}
                                </div>

                                {currentQuestion.testCases && currentQuestion.testCases.length > 0 && (
                                    <div className="exam-testcases">
                                        <h4>
                                            <FaFlask style={{ color: '#6366f1' }} />
                                            Sample Test Cases
                                        </h4>
                                        {currentQuestion.testCases.slice(0, 2).map((tc, index) => (
                                            <div key={index} className="testcase-card">
                                                <div className="testcase-label">Test Case {index + 1}</div>
                                                <div className="testcase-row">
                                                    <div className="testcase-row-label">Input</div>
                                                    <pre>{tc.input}</pre>
                                                </div>
                                                <div className="testcase-row">
                                                    <div className="testcase-row-label">Expected Output</div>
                                                    <pre>{tc.output}</pre>
                                                </div>
                                            </div>
                                        ))}
                                        {currentQuestion.testCases.length > 2 && (
                                            <p className="testcase-more">
                                                + {currentQuestion.testCases.length - 2} more test case(s) will be evaluated
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Code Editor */}
                        <div className="exam-editor-panel">
                            <div className="exam-editor-body">
                                <CodeEditor
                                    language={exam.subject.language}
                                    initialCode={answers[currentQuestion._id] || ''}
                                    testCases={currentQuestion.testCases}
                                    onCodeChange={(code) => handleAnswer(currentQuestion._id, code)}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ─── MCQ Question Layout ─────────────── */
                    <div className="exam-mcq-wrapper">
                        <div className="exam-mcq-card">
                            {/* Question Header */}
                            <div className="exam-question-header">
                                <div className="exam-question-meta">
                                    <span className="badge badge-primary">
                                        Question {currentQuestionIndex + 1} of {exam.questions.length}
                                    </span>
                                    <span className="badge badge-primary">MCQ</span>
                                    <span className="badge badge-warning">
                                        {currentQuestion.marks} marks
                                    </span>
                                </div>
                                <div className="exam-nav-arrows">
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                        disabled={currentQuestionIndex === 0}
                                        className="exam-nav-arrow"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                        disabled={currentQuestionIndex === exam.questions.length - 1}
                                        className="exam-nav-arrow"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>

                            {/* Question Text */}
                            <div className="exam-question-text">
                                {currentQuestion.questionText}
                            </div>

                            {/* Options */}
                            <div className="exam-options-list">
                                {(currentQuestion.options || []).map((option, index) => {
                                    const optionLetter = String.fromCharCode(65 + index);
                                    const isSelected = answers[currentQuestion._id] === optionLetter;
                                    return (
                                        <label
                                            key={index}
                                            className={`exam-option ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleAnswer(currentQuestion._id, optionLetter)}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${currentQuestion._id}`}
                                                value={optionLetter}
                                                checked={isSelected}
                                                onChange={() => {}}
                                            />
                                            <div className="exam-option-indicator">
                                                {isSelected ? <FaCheckCircle style={{ fontSize: '1rem' }} /> : optionLetter}
                                            </div>
                                            <span className="exam-option-text">{option}</span>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* Bottom navigation */}
                            <div className="exam-bottom-nav">
                                <div className="exam-bottom-nav-info">
                                    <span className="exam-answered-count">
                                        <strong>{answeredCount}</strong> of {exam.questions.length} answered
                                    </span>
                                </div>
                                <div className="exam-nav-arrows">
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                        disabled={currentQuestionIndex === 0}
                                        className="exam-nav-arrow"
                                        style={{ width: '42px', height: '42px' }}
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                        disabled={currentQuestionIndex === exam.questions.length - 1}
                                        className="exam-nav-arrow"
                                        style={{ width: '42px', height: '42px' }}
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Keyboard shortcut hints */}
            <div className="exam-keyboard-hints">
                <span className="keyboard-hint">
                    <kbd>←</kbd><kbd>→</kbd> Navigate
                </span>
            </div>
        </>
    );
}

export default ExamInterface;
