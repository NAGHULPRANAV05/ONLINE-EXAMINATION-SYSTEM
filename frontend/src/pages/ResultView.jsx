import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { resultAPI } from '../services/api';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaClipboardCheck,
    FaExchangeAlt, FaListAlt, FaTrophy, FaArrowLeft, FaPrint,
    FaShieldAlt, FaCode, FaAward, FaExclamationTriangle
} from 'react-icons/fa';
import './ResultView.css';

function ResultView() {
    const { resultId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'wrong' | 'code'

    useEffect(() => {
        fetchResult();
    }, [resultId]);

    const fetchResult = async () => {
        try {
            const response = await resultAPI.getById(resultId);
            setResult(response.data.result);
        } catch (error) {
            console.error('Error fetching result:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!result) return (
        <div className="rv-not-found">
            <h2>Result Not Found</h2>
            <button className="rv-btn-back" onClick={() => navigate('/student/dashboard')}>
                <FaArrowLeft /> Back to Dashboard
            </button>
        </div>
    );

    const passed = result.percentage >= 40;
    const correctCount = result.answers ? result.answers.filter(a => a.isCorrect).length : 0;
    const totalQuestions = result.answers ? result.answers.length : 0;
    const incorrectCount = totalQuestions - correctCount;
    const codingQuestionsCount = result.answers ? result.answers.filter(a => a.question?.type === 'code' || a.executionResult).length : 0;

    // Format time: seconds to MM:SS or Xm Ys
    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs}s`;
    };

    // Calculate Grade Tier
    const getGradeTier = (pct) => {
        if (pct >= 90) return { grade: 'A+', label: 'Outstanding Distinction', color: '#10b981' };
        if (pct >= 80) return { grade: 'A', label: 'Excellent Performance', color: '#10b981' };
        if (pct >= 70) return { grade: 'B+', label: 'Very Good', color: '#3b82f6' };
        if (pct >= 60) return { grade: 'B', label: 'Good Standing', color: '#3b82f6' };
        if (pct >= 50) return { grade: 'C', label: 'Satisfactory', color: '#f59e0b' };
        if (pct >= 40) return { grade: 'D', label: 'Pass', color: '#f59e0b' };
        return { grade: 'F', label: 'Needs Improvement', color: '#ef4444' };
    };

    const gradeInfo = getGradeTier(result.percentage || 0);

    // Filter answers list
    const filteredAnswers = (result.answers || []).filter(a => {
        if (filter === 'correct') return a.isCorrect;
        if (filter === 'wrong') return !a.isCorrect;
        if (filter === 'code') return a.question?.type === 'code' || a.executionResult;
        return true;
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="rv-page">
            {/* Quick Action Navigation Bar */}
            <div className="rv-nav-actions">
                <button className="rv-action-btn back" onClick={() => navigate('/student/dashboard')}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <div className="rv-action-right">
                    <button className="rv-action-btn print" onClick={handlePrint}>
                        <FaPrint /> Print / Save Scorecard
                    </button>
                </div>
            </div>

            {/* Hero Score Section */}
            <div className={`rv-hero ${passed ? 'pass' : 'fail'}`}>
                <div className="rv-hero-ambient" />
                <div className="rv-hero-grid" />

                <div className="rv-hero-content">
                    <div className="rv-report-tag">
                        <FaAward className="rv-report-icon" />
                        <span>Official Assessment Performance Report</span>
                    </div>

                    <h1 className="rv-exam-title">{result.exam?.title || 'Examination Assessment'}</h1>
                    
                    {/* Score Central Display */}
                    <div className="rv-score-wrapper">
                        <div className="rv-score-gauge-container">
                            {/* Ambient Breathing Halo */}
                            <div className={`rv-score-halo ${passed ? 'pass' : 'fail'}`} />

                            <div className="rv-score-ring">
                                <svg className="rv-score-svg" viewBox="0 0 200 200">
                                    <defs>
                                        <linearGradient id="rvPassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#06b6d4" />
                                            <stop offset="45%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#34d399" />
                                        </linearGradient>
                                        <linearGradient id="rvFailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#f43f5e" />
                                            <stop offset="50%" stopColor="#ef4444" />
                                            <stop offset="100%" stopColor="#fb923c" />
                                        </linearGradient>
                                        <filter id="rvGlow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="4" result="blur" />
                                            <feMerge>
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Outer Telemetry Dash Track */}
                                    <circle
                                        className="rv-svg-outer-track"
                                        cx="100"
                                        cy="100"
                                        r="94"
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.12)"
                                        strokeWidth="1.5"
                                        strokeDasharray="3 6"
                                    />

                                    {/* Inner Base Track */}
                                    <circle
                                        className="rv-svg-bg"
                                        cx="100"
                                        cy="100"
                                        r="80"
                                    />

                                    {/* Animated Progress Arc */}
                                    <circle
                                        className={`rv-svg-progress ${passed ? 'pass' : 'fail'}`}
                                        cx="100"
                                        cy="100"
                                        r="80"
                                        strokeDasharray="502.65"
                                        strokeDashoffset={502.65 - (502.65 * Math.min(Math.max(result.percentage, 0), 100)) / 100}
                                        filter="url(#rvGlow)"
                                    />
                                </svg>

                                {/* Frosted Glass Inner Dial */}
                                <div className="rv-score-inner">
                                    <span className="rv-score-dial-tag">SCORE ACCURACY</span>
                                    <div className="rv-score-pct-box">
                                        <span className="rv-score-pct-num">{result.percentage.toFixed(1)}</span>
                                        <span className="rv-score-pct-sym">%</span>
                                    </div>
                                    <div className={`rv-score-grade-pill ${passed ? 'pass' : 'fail'}`}>
                                        <FaAward className="rv-grade-icon" />
                                        <span>Grade {gradeInfo.grade}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rv-hero-meta">
                            <div className="rv-score-detail">
                                <span className="rv-score-nums">{result.totalScore}</span>
                                <span className="rv-score-slash">/</span>
                                <span className="rv-score-total">{result.exam?.totalMarks || 100} Marks</span>
                            </div>

                            <div className={`rv-status-badge ${passed ? 'pass' : 'fail'}`}>
                                {passed ? (
                                    <>
                                        <FaCheckCircle className="rv-badge-icon" />
                                        <span>PASSED • {gradeInfo.label.toUpperCase()}</span>
                                    </>
                                ) : (
                                    <>
                                        <FaTimesCircle className="rv-badge-icon" />
                                        <span>FAILED • RE-ATTEMPT RECOMMENDED</span>
                                    </>
                                )}
                            </div>

                            {result.proctoringTerminated && (
                                <div className="rv-proctor-warning">
                                    <FaExclamationTriangle /> Exam terminated early by Proctor Sentinel
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Stats Cards Grid */}
            <div className="rv-stats-wrap">
                <div className="rv-stats-grid">
                    {/* Time Stat */}
                    <div className="rv-stat blue">
                        <div className="rv-stat-header">
                            <div className="rv-stat-icon blue"><FaClock /></div>
                            <span className="rv-stat-pill">Duration</span>
                        </div>
                        <div className="rv-stat-value">{formatTime(result.timeTaken)}</div>
                        <p className="rv-stat-label">Total Time Allocated</p>
                        <div className="rv-stat-footer">Recorded active session</div>
                    </div>

                    {/* Correct Answers Stat */}
                    <div className="rv-stat green">
                        <div className="rv-stat-header">
                            <div className="rv-stat-icon green"><FaClipboardCheck /></div>
                            <span className="rv-stat-pill success">
                                {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}% Accuracy
                            </span>
                        </div>
                        <div className="rv-stat-value">{correctCount} <span className="rv-stat-sub">/ {totalQuestions}</span></div>
                        <p className="rv-stat-label">Correct Responses</p>
                        <div className="rv-stat-progress-bar">
                            <div 
                                className="rv-progress-fill" 
                                style={{ width: `${totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Proctor Integrity Stat */}
                    <div className={`rv-stat ${result.tabSwitchCount > 2 ? 'red' : 'amber'}`}>
                        <div className="rv-stat-header">
                            <div className={`rv-stat-icon ${result.tabSwitchCount > 2 ? 'red' : 'amber'}`}>
                                <FaExchangeAlt />
                            </div>
                            <span className={`rv-stat-pill ${result.tabSwitchCount > 0 ? 'warning' : 'safe'}`}>
                                {result.tabSwitchCount === 0 ? 'Clean Record' : `${result.tabSwitchCount} Events`}
                            </span>
                        </div>
                        <div className="rv-stat-value">{result.tabSwitchCount}</div>
                        <p className="rv-stat-label">Tab Switch Detections</p>
                        <div className="rv-stat-footer">
                            <FaShieldAlt className="rv-footer-icon" /> AI Proctor Sentinel
                        </div>
                    </div>

                    {/* Achievement Tier */}
                    <div className="rv-stat purple">
                        <div className="rv-stat-header">
                            <div className="rv-stat-icon purple"><FaTrophy /></div>
                            <span className="rv-stat-pill purple">Tier</span>
                        </div>
                        <div className="rv-stat-value" style={{ color: gradeInfo.color }}>
                            {gradeInfo.grade}
                        </div>
                        <p className="rv-stat-label">{gradeInfo.label}</p>
                        <div className="rv-stat-footer">Passing threshold: 40%</div>
                    </div>
                </div>
            </div>

            {/* Answer Breakdown & Filter Section */}
            <div className="rv-content">
                <div className="rv-section-top">
                    <div className="rv-section-head">
                        <div className="rv-section-icon"><FaListAlt /></div>
                        <div>
                            <h2 className="rv-section-title">Detailed Question Review</h2>
                            <p className="rv-section-desc">Comprehensive breakdown of your answers, solutions, and test cases</p>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="rv-filter-bar">
                        <button 
                            className={`rv-filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({totalQuestions})
                        </button>
                        <button 
                            className={`rv-filter-btn correct ${filter === 'correct' ? 'active' : ''}`}
                            onClick={() => setFilter('correct')}
                        >
                            <span className="rv-filter-dot green" /> Correct ({correctCount})
                        </button>
                        <button 
                            className={`rv-filter-btn wrong ${filter === 'wrong' ? 'active' : ''}`}
                            onClick={() => setFilter('wrong')}
                        >
                            <span className="rv-filter-dot red" /> Incorrect ({incorrectCount})
                        </button>
                        {codingQuestionsCount > 0 && (
                            <button 
                                className={`rv-filter-btn code ${filter === 'code' ? 'active' : ''}`}
                                onClick={() => setFilter('code')}
                            >
                                <FaCode className="rv-filter-icon" /> Coding ({codingQuestionsCount})
                            </button>
                        )}
                    </div>
                </div>

                {filteredAnswers.length === 0 ? (
                    <div className="rv-empty-filter">
                        <p>No questions match the selected filter category.</p>
                    </div>
                ) : (
                    filteredAnswers.map((answer, index) => {
                        const questionNum = (result.answers || []).indexOf(answer) + 1;
                        const isMCQ = answer.question?.type === 'mcq' || (!answer.question?.type && !answer.executionResult);

                        return (
                            <div key={index} className={`rv-answer ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                {/* Left Gradient Accent Line */}
                                <div className={`rv-answer-accent ${answer.isCorrect ? 'correct' : 'wrong'}`} />

                                <div className="rv-answer-body">
                                    {/* Header */}
                                    <div className="rv-answer-head">
                                        <div className="rv-answer-num">
                                            <span className={`rv-q-num ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                                Q{questionNum}
                                            </span>
                                            <span className="rv-q-label">Question {questionNum}</span>
                                            <span className="rv-type-pill">
                                                {isMCQ ? 'Multiple Choice' : 'Code Challenge'}
                                            </span>
                                        </div>
                                        <div className="rv-answer-badges">
                                            <span className={`rv-a-badge ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                                {answer.isCorrect ? (
                                                    <><FaCheckCircle /> Correct</>
                                                ) : (
                                                    <><FaTimesCircle /> Incorrect</>
                                                )}
                                            </span>
                                            <span className="rv-a-badge marks">
                                                {answer.marksObtained || 0} / {answer.question?.marks || 1} Marks
                                            </span>
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="rv-question-text">
                                        {answer.question?.questionText || 'Question statement'}
                                    </div>

                                    {/* MCQ Answer View */}
                                    {isMCQ ? (
                                        <div className="rv-mcq-answers">
                                            <div className={`rv-mcq-row your ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                                <div className="rv-mcq-head">
                                                    <span className="rv-mcq-indicator">Your Response</span>
                                                    {answer.isCorrect ? (
                                                        <FaCheckCircle className="rv-mcq-icon green" />
                                                    ) : (
                                                        <FaTimesCircle className="rv-mcq-icon red" />
                                                    )}
                                                </div>
                                                <div className={`rv-mcq-value ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                                    {answer.userAnswer !== undefined && answer.userAnswer !== null && answer.userAnswer !== '' 
                                                        ? String(answer.userAnswer) 
                                                        : '(No answer provided)'}
                                                </div>
                                            </div>

                                            <div className="rv-mcq-row answer">
                                                <div className="rv-mcq-head">
                                                    <span className="rv-mcq-indicator">Correct Answer</span>
                                                    <FaCheckCircle className="rv-mcq-icon green" />
                                                </div>
                                                <div className="rv-mcq-value answer">
                                                    {answer.question?.correctAnswer !== undefined 
                                                        ? String(answer.question?.correctAnswer) 
                                                        : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Code Sandbox Answer View */
                                        <div className="rv-code-container">
                                            <div className="rv-code-header">
                                                <div className="rv-code-dots">
                                                    <span className="rv-dot red" />
                                                    <span className="rv-dot yellow" />
                                                    <span className="rv-dot green" />
                                                </div>
                                                <span className="rv-code-lang">Submitted Solution</span>
                                            </div>

                                            <pre className="rv-code-block">
                                                <code>{answer.userAnswer || '// No code submitted'}</code>
                                            </pre>

                                            {answer.executionResult && (
                                                <div className="rv-test-suite">
                                                    <div className="rv-test-summary">
                                                        <span className="rv-test-summary-title">Execution Test Cases</span>
                                                        <span className={`rv-test-summary-pill ${answer.executionResult.passedTests === answer.executionResult.totalTests ? 'all-passed' : 'has-failures'}`}>
                                                            {answer.executionResult.passedTests} / {answer.executionResult.totalTests} Test Cases Passed
                                                        </span>
                                                    </div>

                                                    <div className="rv-test-grid">
                                                        {answer.executionResult.testResults?.map((test, i) => (
                                                            <div key={i} className={`rv-test-card ${test.passed ? 'passed' : 'failed'}`}>
                                                                <div className={`rv-test-title ${test.passed ? 'pass' : 'fail'}`}>
                                                                    {test.passed ? <FaCheckCircle /> : <FaTimesCircle />}
                                                                    <span>Test Case #{i + 1}</span>
                                                                    <span className="rv-test-status-tag">{test.passed ? 'PASSED' : 'FAILED'}</span>
                                                                </div>
                                                                <div className="rv-test-detail">
                                                                    <div className="rv-test-row">
                                                                        <span className="rv-test-param">Input:</span>
                                                                        <code>{test.input || '(none)'}</code>
                                                                    </div>
                                                                    <div className="rv-test-row">
                                                                        <span className="rv-test-param">Expected:</span>
                                                                        <code>{test.expectedOutput}</code>
                                                                    </div>
                                                                    <div className="rv-test-row">
                                                                        <span className="rv-test-param">Actual Output:</span>
                                                                        <code>{test.actualOutput}</code>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default ResultView;
