import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { resultAPI } from '../services/api';
import {
    FaCheckCircle, FaTimesCircle, FaClock, FaClipboardCheck,
    FaExchangeAlt, FaListAlt
} from 'react-icons/fa';
import './ResultView.css';

function ResultView() {
    const { resultId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResult();
    }, []);

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
    if (!result) return <div>Result not found</div>;

    const passed = result.percentage >= 40;
    const correctCount = result.answers.filter(a => a.isCorrect).length;

    return (
        <div className="rv-page">
            <Navbar />

            {/* Hero Score Section */}
            <div className={`rv-hero ${passed ? 'pass' : 'fail'}`}>
                <div className="rv-hero-content">
                    <div className="rv-exam-title">{result.exam?.title}</div>
                    <div className="rv-score-ring">
                        <div className="rv-score-pct">{result.percentage.toFixed(1)}%</div>
                        <div className="rv-score-label">Score</div>
                    </div>
                    <div className="rv-score-detail">
                        {result.totalScore} / {result.exam?.totalMarks} marks
                    </div>
                    <span className={`rv-status-badge ${passed ? 'pass' : 'fail'}`}>
                        {passed
                            ? <><FaCheckCircle /> PASSED</>
                            : <><FaTimesCircle /> FAILED</>
                        }
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="rv-stats-wrap">
                <div className="rv-stats-grid">
                    <div className="rv-stat blue">
                        <div className="rv-stat-icon blue"><FaClock /></div>
                        <div className="rv-stat-value">{result.timeTaken}s</div>
                        <p className="rv-stat-label">Time Taken</p>
                    </div>
                    <div className="rv-stat green">
                        <div className="rv-stat-icon green"><FaClipboardCheck /></div>
                        <div className="rv-stat-value">{correctCount}/{result.answers.length}</div>
                        <p className="rv-stat-label">Correct Answers</p>
                    </div>
                    <div className="rv-stat amber">
                        <div className="rv-stat-icon amber"><FaExchangeAlt /></div>
                        <div className="rv-stat-value">{result.tabSwitchCount}</div>
                        <p className="rv-stat-label">Tab Switches</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="rv-content">
                <div className="rv-section-head">
                    <div className="rv-section-icon"><FaListAlt /></div>
                    <h2 className="rv-section-title">Answer Review</h2>
                </div>

                {result.answers.map((answer, index) => (
                    <div key={index} className="rv-answer">
                        {/* Left accent */}
                        <div className={`rv-answer-accent ${answer.isCorrect ? 'correct' : 'wrong'}`} />

                        {/* Header */}
                        <div className="rv-answer-head">
                            <div className="rv-answer-num">
                                <span className={`rv-q-num ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                    {index + 1}
                                </span>
                                <span className="rv-q-label">Question {index + 1}</span>
                            </div>
                            <div className="rv-answer-badges">
                                <span className={`rv-a-badge ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                    {answer.isCorrect
                                        ? <><FaCheckCircle /> Correct</>
                                        : <><FaTimesCircle /> Incorrect</>
                                    }
                                </span>
                                <span className="rv-a-badge marks">
                                    {answer.marksObtained} / {answer.question?.marks} marks
                                </span>
                            </div>
                        </div>

                        {/* Question text */}
                        <div className="rv-question-text">{answer.question?.questionText}</div>

                        {/* MCQ */}
                        {answer.question?.type === 'mcq' ? (
                            <div className="rv-mcq-answers">
                                <div className={`rv-mcq-row your ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                    <span className="rv-mcq-indicator">Your Answer:</span>
                                    <span className={`rv-mcq-value ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                                        {answer.userAnswer}
                                    </span>
                                </div>
                                <div className="rv-mcq-row answer">
                                    <span className="rv-mcq-indicator">Correct:</span>
                                    <span className="rv-mcq-value answer">
                                        {answer.question?.correctAnswer}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* Coding */
                            <div>
                                <div className="rv-code-label">Your Code:</div>
                                <pre className="rv-code-block">{answer.userAnswer}</pre>

                                {answer.executionResult && (
                                    <>
                                        <div className="rv-test-summary">
                                            Test Results: {answer.executionResult.passedTests} / {answer.executionResult.totalTests} passed
                                        </div>
                                        {answer.executionResult.testResults?.map((test, i) => (
                                            <div key={i} className={`rv-test-item ${test.passed ? 'passed' : 'failed'}`}>
                                                <div className={`rv-test-title ${test.passed ? 'pass' : 'fail'}`}>
                                                    {test.passed ? <FaCheckCircle /> : <FaTimesCircle />}
                                                    Test Case {i + 1}
                                                </div>
                                                <div className="rv-test-detail">
                                                    <div>Input: {test.input || '(none)'}</div>
                                                    <div>Expected: {test.expectedOutput}</div>
                                                    <div>Got: {test.actualOutput}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ResultView;
