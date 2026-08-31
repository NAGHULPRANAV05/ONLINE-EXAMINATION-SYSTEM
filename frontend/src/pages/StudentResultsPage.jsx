import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTrophy, FaEye, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { resultAPI } from '../services/api';
import './StudentResultsPage.css';

function StudentResultsPage() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        resultAPI.getStudentResults(user.id)
            .then(res => setResults(res.data.results || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingSpinner />;

    const passed = results.filter(r => r.percentage >= 40).length;
    const failed = results.length - passed;
    const avg = results.length
        ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)
        : 0;
    const best = results.length
        ? Math.max(...results.map(r => r.percentage)).toFixed(1)
        : 0;

    return (
        <div className="srp-page">
            <div className="srp-hero">
                <div className="srp-hero-inner">
                    <div className="srp-hero-icon"><FaTrophy /></div>
                    <div>
                        <h1>My Results</h1>
                        <p>All your exam attempts and scores</p>
                    </div>
                </div>
            </div>

            {/* Summary stats */}
            {results.length > 0 && (
                <div className="srp-stats-wrap">
                    <div className="srp-stats-grid">
                        <div className="srp-stat">
                            <span className="srp-stat-val">{results.length}</span>
                            <span className="srp-stat-lbl">Total Attempts</span>
                        </div>
                        <div className="srp-stat green">
                            <span className="srp-stat-val">{passed}</span>
                            <span className="srp-stat-lbl">Passed</span>
                        </div>
                        <div className="srp-stat red">
                            <span className="srp-stat-val">{failed}</span>
                            <span className="srp-stat-lbl">Failed</span>
                        </div>
                        <div className="srp-stat blue">
                            <span className="srp-stat-val">{avg}%</span>
                            <span className="srp-stat-lbl">Average Score</span>
                        </div>
                        <div className="srp-stat purple">
                            <span className="srp-stat-val">{best}%</span>
                            <span className="srp-stat-lbl">Best Score</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="srp-content">
                {results.length === 0 ? (
                    <div className="srp-empty">
                        <FaTrophy className="srp-empty-icon" />
                        <p>You haven't attempted any exams yet.</p>
                        <Link to="/student/exams" className="srp-empty-btn">Browse Exams</Link>
                    </div>
                ) : (
                    <div className="srp-list">
                        {results.map((result, i) => {
                            const pass = result.percentage >= 40;
                            return (
                                <div className={`srp-card ${pass ? 'pass' : 'fail'}`} key={result._id} style={{ animationDelay: `${i * 0.04}s` }}>
                                    <div className="srp-card-icon">
                                        {pass ? <FaCheckCircle className="srp-icon pass" /> : <FaTimesCircle className="srp-icon fail" />}
                                    </div>
                                    <div className="srp-card-info">
                                        <h3 className="srp-exam-name">{result.exam?.title || 'Exam'}</h3>
                                        <div className="srp-meta">
                                            <span><FaClock /> {new Date(result.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span>Score: <strong>{result.totalScore}/{result.exam?.totalMarks || 0}</strong></span>
                                            {result.tabSwitchCount > 0 && <span className="srp-violation">⚠️ {result.tabSwitchCount} tab switch{result.tabSwitchCount !== 1 ? 'es' : ''}</span>}
                                        </div>
                                    </div>
                                    <div className="srp-score-ring">
                                        <div className={`srp-pct ${pass ? 'pass' : 'fail'}`}>
                                            {result.percentage.toFixed(1)}%
                                        </div>
                                        <span className={`srp-verdict ${pass ? 'pass' : 'fail'}`}>{pass ? 'PASS' : 'FAIL'}</span>
                                    </div>
                                    <Link to={`/student/result/${result._id}`} className="srp-view-btn">
                                        <FaEye /> Details
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentResultsPage;
