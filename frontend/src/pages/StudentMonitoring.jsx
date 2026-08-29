import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { resultAPI } from '../services/api';
import {
    FaTrash, FaUsers, FaClipboardCheck, FaCheckCircle,
    FaTimesCircle, FaBookOpen, FaChartBar, FaListAlt,
    FaArrowLeft, FaSearch, FaUserGraduate, FaExternalLinkAlt,
    FaTrophy, FaCalendarAlt, FaChevronRight, FaFilter
} from 'react-icons/fa';
import './StudentMonitoring.css';

function StudentMonitoring() {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    // State for viewing a specific student's results
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [examSearch, setExamSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pass' | 'fail'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resultsRes, analyticsRes] = await Promise.all([
                resultAPI.getAll(),
                resultAPI.getAnalytics()
            ]);
            setResults(resultsRes.data.results || []);
            setAnalytics(analyticsRes.data.analytics);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group all exam results by student
    const groupedStudents = useMemo(() => {
        const studentMap = {};

        results.forEach((result) => {
            const studentId = result.student?._id || result.student?.name || 'unknown';
            const studentName = result.student?.name || 'Unknown Student';
            const studentEmail = result.student?.email || 'N/A';

            if (!studentMap[studentId]) {
                studentMap[studentId] = {
                    id: studentId,
                    name: studentName,
                    email: studentEmail,
                    results: [],
                    passedCount: 0,
                    failedCount: 0,
                    totalScoreSum: 0,
                    totalPercentageSum: 0,
                    bestPercentage: 0,
                    latestAttemptDate: result.submittedAt
                };
            }

            const studentObj = studentMap[studentId];
            studentObj.results.push(result);

            const isPass = (result.percentage || 0) >= 40;
            if (isPass) {
                studentObj.passedCount += 1;
            } else {
                studentObj.failedCount += 1;
            }

            studentObj.totalScoreSum += result.totalScore || 0;
            studentObj.totalPercentageSum += result.percentage || 0;

            if ((result.percentage || 0) > studentObj.bestPercentage) {
                studentObj.bestPercentage = result.percentage || 0;
            }

            if (new Date(result.submittedAt) > new Date(studentObj.latestAttemptDate)) {
                studentObj.latestAttemptDate = result.submittedAt;
            }
        });

        return Object.values(studentMap).map((student) => ({
            ...student,
            examsCount: student.results.length,
            avgPercentage: student.results.length ? (student.totalPercentageSum / student.results.length) : 0,
        })).sort((a, b) => new Date(b.latestAttemptDate) - new Date(a.latestAttemptDate));
    }, [results]);

    // Currently selected student object
    const selectedStudent = useMemo(() => {
        if (!selectedStudentId) return null;
        return groupedStudents.find(s => s.id === selectedStudentId) || null;
    }, [groupedStudents, selectedStudentId]);

    // Filtered student list for directory view
    const filteredStudents = useMemo(() => {
        if (!studentSearch.trim()) return groupedStudents;
        const q = studentSearch.toLowerCase();
        return groupedStudents.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        );
    }, [groupedStudents, studentSearch]);

    // Filtered exam results for selected student view
    const filteredStudentResults = useMemo(() => {
        if (!selectedStudent) return [];
        return selectedStudent.results.filter(r => {
            const matchesSearch = !examSearch.trim() ||
                (r.exam?.title || '').toLowerCase().includes(examSearch.toLowerCase()) ||
                (r.subject?.name || '').toLowerCase().includes(examSearch.toLowerCase());

            const isPass = (r.percentage || 0) >= 40;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'pass' && isPass) ||
                (statusFilter === 'fail' && !isPass);

            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    }, [selectedStudent, examSearch, statusFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this result?')) return;
        try {
            await resultAPI.delete(id);
            const updated = results.filter(r => r._id !== id);
            setResults(updated);

            const analyticsRes = await resultAPI.getAnalytics();
            setAnalytics(analyticsRes.data.analytics);

            // If selected student has no more results, return to students directory
            if (selectedStudentId) {
                const remainingForStudent = updated.filter(r => (r.student?._id || r.student?.name) === selectedStudentId);
                if (remainingForStudent.length === 0) {
                    setSelectedStudentId(null);
                }
            }
        } catch (error) {
            alert('Error deleting result: ' + (error.response?.data?.message || error.message));
        }
    };

    const getScoreClass = (pct) => {
        if (pct >= 70) return 'high';
        if (pct >= 40) return 'medium';
        return 'low';
    };

    const getInitials = (name) => {
        if (!name) return 'S';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
                    <h1>Student Monitoring & Results</h1>
                    <p className="sm-mon-hero-sub">
                        {selectedStudent
                            ? `Viewing complete exam records and test performance for ${selectedStudent.name}`
                            : 'Track student directory, performance metrics, and individual exam histories'}
                    </p>
                </div>
            </div>

            {/* Top Analytics Stats Grid */}
            {analytics && !selectedStudent && (
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

            {/* Content Area */}
            <div className="sm-mon-content">

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 1: STUDENTS DIRECTORY (Grouped by Student)
                   ════════════════════════════════════════════════════════════════════════ */}
                {!selectedStudent && (
                    <>
                        {/* Subject-wise Performance Cards */}
                        {analytics && analytics.subjectPerformance && analytics.subjectPerformance.length > 0 && (
                            <div className="sm-mon-perf-section">
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
                            </div>
                        )}

                        {/* Students Directory Header & Search */}
                        <div className="sm-mon-section-head-split">
                            <div className="sm-mon-section-head">
                                <div className="sm-mon-section-icon results"><FaUserGraduate /></div>
                                <div>
                                    <h2 className="sm-mon-section-title">Student Records & Results</h2>
                                    <p className="sm-mon-section-subtitle">Click on any student to view their full exam history</p>
                                </div>
                            </div>

                            <div className="sm-mon-search-box">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search student by name or email..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                                {studentSearch && (
                                    <button
                                        type="button"
                                        className="btn-clear-search"
                                        onClick={() => setStudentSearch('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Students Directory Table */}
                        <div className="sm-mon-table-wrap">
                            <table className="sm-mon-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Exams Taken</th>
                                        <th>Pass / Fail</th>
                                        <th>Average Score</th>
                                        <th>Best Score</th>
                                        <th>Latest Attempt</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="sm-mon-empty-row">
                                                {groupedStudents.length === 0
                                                    ? "No student records found yet. Students haven't submitted any exams."
                                                    : "No students matching your search query."}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="sm-mon-clickable-row"
                                                onClick={() => setSelectedStudentId(student.id)}
                                            >
                                                <td>
                                                    <div className="sm-student-profile-cell">
                                                        <div className="sm-avatar-circle">
                                                            {getInitials(student.name)}
                                                        </div>
                                                        <div className="sm-student-info">
                                                            <span className="sm-student-name-text">
                                                                {student.name}
                                                            </span>
                                                            <span className="sm-student-email-text">
                                                                {student.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="sm-exam-count-badge">
                                                        <FaClipboardCheck style={{ marginRight: 4 }} />
                                                        {student.examsCount} {student.examsCount === 1 ? 'Exam' : 'Exams'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="sm-pass-fail-ratio">
                                                        <span className="ratio-pass">
                                                            <FaCheckCircle /> {student.passedCount}
                                                        </span>
                                                        <span className="ratio-sep">•</span>
                                                        <span className="ratio-fail">
                                                            <FaTimesCircle /> {student.failedCount}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div className="sm-avg-wrap">
                                                        <span className={`sm-mon-pct ${getScoreClass(student.avgPercentage)}`}>
                                                            {student.avgPercentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="sm-best-score">
                                                        <FaTrophy style={{ color: '#f59e0b', marginRight: 4 }} />
                                                        {student.bestPercentage.toFixed(1)}%
                                                    </span>
                                                </td>

                                                <td className="sm-date-cell">
                                                    <FaCalendarAlt style={{ marginRight: 5, color: 'var(--text-muted)' }} />
                                                    {new Date(student.latestAttemptDate).toLocaleDateString()}
                                                </td>

                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        type="button"
                                                        className="btn-view-student-results"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedStudentId(student.id);
                                                        }}
                                                    >
                                                        <span>View Results</span>
                                                        <FaChevronRight className="btn-arrow" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 2: INDIVIDUAL STUDENT RESULTS DETAIL VIEW
                   ════════════════════════════════════════════════════════════════════════ */}
                {selectedStudent && (
                    <div className="sm-student-detail-view">

                        {/* Top Back Navigation Bar */}
                        <div className="sm-detail-nav-bar">
                            <button
                                type="button"
                                className="btn-back-to-students"
                                onClick={() => setSelectedStudentId(null)}
                            >
                                <FaArrowLeft />
                                <span>Back to All Students</span>
                            </button>

                            <div className="sm-breadcrumb">
                                <span>Students</span>
                                <span className="sep">/</span>
                                <span className="current">{selectedStudent.name}</span>
                            </div>
                        </div>

                        {/* Student Profile Card & Summary Metrics */}
                        <div className="sm-student-header-card">
                            <div className="sm-student-header-left">
                                <div className="sm-avatar-large">
                                    {getInitials(selectedStudent.name)}
                                </div>
                                <div className="sm-header-details">
                                    <h2>{selectedStudent.name}</h2>
                                    <p className="sm-header-email">{selectedStudent.email}</p>
                                    <span className="sm-student-role-tag">Student Assessment Profile</span>
                                </div>
                            </div>

                            <div className="sm-student-metrics-row">
                                <div className="metric-box">
                                    <span className="metric-val">{selectedStudent.examsCount}</span>
                                    <span className="metric-lbl">Total Attempts</span>
                                </div>
                                <div className="metric-box pass">
                                    <span className="metric-val">{selectedStudent.passedCount}</span>
                                    <span className="metric-lbl">Passed</span>
                                </div>
                                <div className="metric-box fail">
                                    <span className="metric-val">{selectedStudent.failedCount}</span>
                                    <span className="metric-lbl">Failed</span>
                                </div>
                                <div className="metric-box avg">
                                    <span className="metric-val">{selectedStudent.avgPercentage.toFixed(1)}%</span>
                                    <span className="metric-lbl">Avg Score</span>
                                </div>
                                <div className="metric-box best">
                                    <span className="metric-val">{selectedStudent.bestPercentage.toFixed(1)}%</span>
                                    <span className="metric-lbl">Best Score</span>
                                </div>
                            </div>
                        </div>

                        {/* Results Controls Toolbar */}
                        <div className="sm-results-toolbar">
                            <div className="sm-toolbar-left">
                                <div className="sm-mon-section-head" style={{ marginBottom: 0 }}>
                                    <div className="sm-mon-section-icon results"><FaListAlt /></div>
                                    <h3 className="sm-mon-section-title">Exam Attempts & Scorecards</h3>
                                </div>
                            </div>

                            <div className="sm-toolbar-right">
                                {/* Filter Tabs */}
                                <div className="sm-filter-pills">
                                    <button
                                        type="button"
                                        className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setStatusFilter('all')}
                                    >
                                        All ({selectedStudent.results.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill pass ${statusFilter === 'pass' ? 'active' : ''}`}
                                        onClick={() => setStatusFilter('pass')}
                                    >
                                        Passed ({selectedStudent.passedCount})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill fail ${statusFilter === 'fail' ? 'active' : ''}`}
                                        onClick={() => setStatusFilter('fail')}
                                    >
                                        Failed ({selectedStudent.failedCount})
                                    </button>
                                </div>

                                {/* Exam Search */}
                                <div className="sm-exam-search-box">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Filter by exam or subject..."
                                        value={examSearch}
                                        onChange={(e) => setExamSearch(e.target.value)}
                                    />
                                    {examSearch && (
                                        <button
                                            type="button"
                                            className="btn-clear-search"
                                            onClick={() => setExamSearch('')}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Results Table for Selected Student */}
                        <div className="sm-mon-table-wrap">
                            <table className="sm-mon-table">
                                <thead>
                                    <tr>
                                        <th>Exam Title</th>
                                        <th>Subject</th>
                                        <th>Score</th>
                                        <th>Percentage</th>
                                        <th>Status</th>
                                        <th>Submitted On</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudentResults.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="sm-mon-empty-row">
                                                No exam attempts found matching the selected filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudentResults.map((result) => (
                                            <tr key={result._id}>
                                                <td>
                                                    <div className="sm-exam-cell">
                                                        <span className="sm-mon-exam-title">
                                                            {result.exam?.title || 'Exam Assessment'}
                                                        </span>
                                                        {result.proctoringTerminated && (
                                                            <span className="sm-proc-term-tag">Proctoring Terminated</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="sm-subject-pill">
                                                        {result.subject?.name || 'General'}
                                                    </span>
                                                </td>

                                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {result.totalScore} Marks
                                                </td>

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

                                                <td className="sm-date-cell">
                                                    {new Date(result.submittedAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                    <span className="sm-time-sub">
                                                        {new Date(result.submittedAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </td>

                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="sm-actions-cell">
                                                        <button
                                                            type="button"
                                                            className="btn-view-scorecard"
                                                            onClick={() => navigate(`/student/result/${result._id}`)}
                                                            title="View detailed scorecard and answers"
                                                        >
                                                            <FaExternalLinkAlt />
                                                            <span>Scorecard</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="sm-mon-del-btn"
                                                            onClick={() => handleDelete(result._id)}
                                                            title="Delete this result"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentMonitoring;
