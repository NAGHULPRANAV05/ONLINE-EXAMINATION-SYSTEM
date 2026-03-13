import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { resultAPI } from '../services/api';
import {
    FaTrash, FaUsers, FaClipboardCheck, FaCheckCircle,
    FaTimesCircle, FaBookOpen, FaChartBar, FaListAlt
} from 'react-icons/fa';
import './StudentMonitoring.css';

function StudentMonitoring() {
    const [results, setResults] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resultsRes, analyticsRes] = await Promise.all([
                resultAPI.getAll(),
                resultAPI.getAnalytics()
            ]);
            setResults(resultsRes.data.results);
            setAnalytics(analyticsRes.data.analytics);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this result?')) return;
        try {
            await resultAPI.delete(id);
            setResults(results.filter(r => r._id !== id));
            const analyticsRes = await resultAPI.getAnalytics();
            setAnalytics(analyticsRes.data.analytics);
        } catch (error) {
            alert('Error deleting result: ' + (error.response?.data?.message || error.message));
        }
    };

    const getScoreClass = (pct) => {
        if (pct >= 70) return 'high';
        if (pct >= 40) return 'medium';
        return 'low';
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="sm-mon-page">
            <Navbar />

            {/* Hero */}
            <div className="sm-mon-hero">
                <div className="sm-mon-hero-content">
                    <div className="sm-mon-hero-icon">
                        <FaUsers />
                    </div>
                    <h1>Student Monitoring</h1>
                    <p className="sm-mon-hero-sub">Track student performance, results and analytics across all exams</p>
                </div>
            </div>

            {/* Stats Cards */}
            {analytics && (
                <div className="sm-mon-stats-wrap">
                    <div className="sm-mon-stats-grid">
                        <div className="sm-mon-stat purple">
                            <div className="sm-mon-stat-top">
                                <div className="sm-mon-stat-icon purple"><FaUsers /></div>
                            </div>
                            <div className="sm-mon-stat-value">{analytics.totalStudents}</div>
                            <p className="sm-mon-stat-label">Total Students</p>
                        </div>

                        <div className="sm-mon-stat blue">
                            <div className="sm-mon-stat-top">
                                <div className="sm-mon-stat-icon blue"><FaClipboardCheck /></div>
                            </div>
                            <div className="sm-mon-stat-value">{analytics.totalExamsTaken}</div>
                            <p className="sm-mon-stat-label">Exams Taken</p>
                        </div>

                        <div className="sm-mon-stat green">
                            <div className="sm-mon-stat-top">
                                <div className="sm-mon-stat-icon green"><FaCheckCircle /></div>
                            </div>
                            <div className="sm-mon-stat-value">{analytics.passCount}</div>
                            <p className="sm-mon-stat-label">Passed</p>
                        </div>

                        <div className="sm-mon-stat red">
                            <div className="sm-mon-stat-top">
                                <div className="sm-mon-stat-icon red"><FaTimesCircle /></div>
                            </div>
                            <div className="sm-mon-stat-value">{analytics.failCount}</div>
                            <p className="sm-mon-stat-label">Failed</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="sm-mon-content">
                {/* Subject-wise Performance */}
                {analytics && analytics.subjectPerformance && analytics.subjectPerformance.length > 0 && (
                    <>
                        <div className="sm-mon-section-head">
                            <div className="sm-mon-section-icon perf"><FaChartBar /></div>
                            <h2 className="sm-mon-section-title">Subject Performance</h2>
                        </div>
                        <div className="sm-mon-perf-grid">
                            {analytics.subjectPerformance.map((subject) => (
                                <div key={subject._id} className="sm-mon-perf-card">
                                    <div className="sm-mon-perf-name">
                                        <span className="sm-mon-perf-name-icon"><FaBookOpen /></span>
                                        {subject.subjectName}
                                    </div>
                                    <div className="sm-mon-score-bar-wrap">
                                        <div className="sm-mon-score-label">
                                            <span>Average Score</span>
                                            <span className={`sm-mon-pct ${getScoreClass(subject.avgScore)}`}>
                                                {subject.avgScore.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="sm-mon-score-track">
                                            <div
                                                className={`sm-mon-score-fill ${getScoreClass(subject.avgScore)}`}
                                                style={{ width: `${Math.min(subject.avgScore, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="sm-mon-perf-meta">
                                        <span>Attempts</span>
                                        <span className="sm-mon-perf-attempts">
                                            <FaClipboardCheck /> {subject.totalAttempts}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Recent Results Table */}
                <div className="sm-mon-section-head">
                    <div className="sm-mon-section-icon results"><FaListAlt /></div>
                    <h2 className="sm-mon-section-title">Recent Results</h2>
                </div>
                <div className="sm-mon-table-wrap">
                    <table className="sm-mon-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Exam</th>
                                <th>Subject</th>
                                <th>Score</th>
                                <th>Percentage</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="sm-mon-empty-row">
                                        No results yet. Students haven't taken any exams.
                                    </td>
                                </tr>
                            ) : (
                                results.map((result) => (
                                    <tr key={result._id}>
                                        <td className="sm-mon-student-name">{result.student?.name}</td>
                                        <td className="sm-mon-exam-title">{result.exam?.title}</td>
                                        <td>{result.subject?.name}</td>
                                        <td style={{ fontWeight: 600 }}>{result.totalScore}</td>
                                        <td>
                                            <span className={`sm-mon-pct ${getScoreClass(result.percentage)}`}>
                                                {result.percentage.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`sm-mon-badge ${result.percentage >= 40 ? 'pass' : 'fail'}`}>
                                                {result.percentage >= 40 ? 'Pass' : 'Fail'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                            {new Date(result.submittedAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                className="sm-mon-del-btn"
                                                onClick={() => handleDelete(result._id)}
                                                title="Delete result"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default StudentMonitoring;
