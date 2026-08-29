import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { resultAPI, userAPI } from '../services/api';
import {
    FaTrash, FaUsers, FaClipboardCheck, FaCheckCircle,
    FaTimesCircle, FaBookOpen, FaChartBar, FaListAlt,
    FaArrowLeft, FaSearch, FaUserGraduate, FaExternalLinkAlt,
    FaTrophy, FaCalendarAlt, FaChevronRight, FaBan, FaCheck
} from 'react-icons/fa';
import './StudentMonitoring.css';

function StudentMonitoring() {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [registeredStudents, setRegisteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for viewing a specific student's results
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [examSearch, setExamSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pass' | 'fail'
    const [accountStatusFilter, setAccountStatusFilter] = useState('all'); // 'all' | 'active' | 'blocked'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resultsRes, analyticsRes, studentsRes] = await Promise.all([
                resultAPI.getAll(),
                resultAPI.getAnalytics(),
                userAPI.getAllStudents()
            ]);
            setResults(resultsRes.data.results || []);
            setAnalytics(analyticsRes.data.analytics);
            setRegisteredStudents(studentsRes.data.students || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle block / unblock student
    const handleToggleBlock = async (studentId, currentBlockedState, studentName) => {
        const action = currentBlockedState ? 'UNBLOCK' : 'BLOCK';
        const msg = currentBlockedState
            ? `Are you sure you want to UNBLOCK ${studentName}? They will be able to log in to the exam portal again.`
            : `Are you sure you want to BLOCK ${studentName}? They will NOT be able to log in to the exam portal.`;

        if (!window.confirm(msg)) return;

        try {
            await userAPI.toggleBlockStudent(studentId, { isBlocked: !currentBlockedState });
            fetchData();
        } catch (error) {
            alert('Error updating student status: ' + (error.response?.data?.message || error.message));
        }
    };

    // Group all exam results by student and merge with registered students list
    const groupedStudents = useMemo(() => {
        const studentMap = {};

        // 1. Initialize with all registered students
        registeredStudents.forEach((student) => {
            studentMap[student._id] = {
                id: student._id,
                name: student.name,
                email: student.email,
                isBlocked: Boolean(student.isBlocked),
                results: [],
                passedCount: 0,
                failedCount: 0,
                totalScoreSum: 0,
                totalPercentageSum: 0,
                bestPercentage: 0,
                latestAttemptDate: null
            };
        });

        // 2. Attach exam results
        results.forEach((result) => {
            const sId = result.student?._id || result.student?.name || 'unknown';
            const studentName = result.student?.name || 'Unknown Student';
            const studentEmail = result.student?.email || 'N/A';

            if (!studentMap[sId]) {
                studentMap[sId] = {
                    id: sId,
                    name: studentName,
                    email: studentEmail,
                    isBlocked: false,
                    results: [],
                    passedCount: 0,
                    failedCount: 0,
                    totalScoreSum: 0,
                    totalPercentageSum: 0,
                    bestPercentage: 0,
                    latestAttemptDate: result.submittedAt
                };
            }

            const studentObj = studentMap[sId];
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

            if (!studentObj.latestAttemptDate || new Date(result.submittedAt) > new Date(studentObj.latestAttemptDate)) {
                studentObj.latestAttemptDate = result.submittedAt;
            }
        });

        return Object.values(studentMap).map((student) => ({
            ...student,
            examsCount: student.results.length,
            avgPercentage: student.results.length ? (student.totalPercentageSum / student.results.length) : 0,
        })).sort((a, b) => {
            if (a.latestAttemptDate && b.latestAttemptDate) {
                return new Date(b.latestAttemptDate) - new Date(a.latestAttemptDate);
            }
            if (a.latestAttemptDate) return -1;
            if (b.latestAttemptDate) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [registeredStudents, results]);

    // Currently selected student object
    const selectedStudent = useMemo(() => {
        if (!selectedStudentId) return null;
        return groupedStudents.find(s => s.id === selectedStudentId) || null;
    }, [groupedStudents, selectedStudentId]);

    // Filtered student list for directory view
    const filteredStudents = useMemo(() => {
        return groupedStudents.filter(s => {
            const matchesSearch = !studentSearch.trim() ||
                s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.email.toLowerCase().includes(studentSearch.toLowerCase());

            const matchesStatus =
                accountStatusFilter === 'all' ||
                (accountStatusFilter === 'active' && !s.isBlocked) ||
                (accountStatusFilter === 'blocked' && s.isBlocked);

            return matchesSearch && matchesStatus;
        });
    }, [groupedStudents, studentSearch, accountStatusFilter]);

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
            fetchData();
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

    const blockedCount = groupedStudents.filter(s => s.isBlocked).length;
    const activeCount = groupedStudents.length - blockedCount;

    return (
        <div className="sm-neat-page">
            <Navbar />

            {/* Simple Clean Header */}
            <div className="sm-neat-header">
                <div className="sm-neat-container">
                    <div className="sm-header-flex">
                        <div>
                            {selectedStudent ? (
                                <div className="sm-breadcrumb-nav">
                                    <button
                                        type="button"
                                        className="btn-back-link"
                                        onClick={() => {
                                            setSelectedStudentId(null);
                                            setExamSearch('');
                                            setStatusFilter('all');
                                        }}
                                    >
                                        <FaArrowLeft /> All Students
                                    </button>
                                    <span className="sep">/</span>
                                    <span className="current-student">{selectedStudent.name}</span>
                                </div>
                            ) : (
                                <>
                                    <h1 className="sm-page-title">Student Management & Results</h1>
                                    <p className="sm-page-sub">Monitor student assessment results and manage portal login access</p>
                                </>
                            )}
                        </div>

                        {!selectedStudent && (
                            <div className="sm-quick-stats">
                                <span className="stat-tag total">{groupedStudents.length} Students</span>
                                <span className="stat-tag active">{activeCount} Active</span>
                                {blockedCount > 0 && (
                                    <span className="stat-tag blocked">{blockedCount} Blocked</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="sm-neat-container sm-neat-body">

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 1: CLEAN STUDENTS DIRECTORY (Default)
                   ════════════════════════════════════════════════════════════════════════ */}
                {!selectedStudent && (
                    <div className="sm-card-box">
                        {/* Filter and Search Bar */}
                        <div className="sm-controls-row">
                            <div className="sm-filter-pills">
                                <button
                                    type="button"
                                    className={`pill-btn ${accountStatusFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setAccountStatusFilter('all')}
                                >
                                    All ({groupedStudents.length})
                                </button>
                                <button
                                    type="button"
                                    className={`pill-btn ${accountStatusFilter === 'active' ? 'active' : ''}`}
                                    onClick={() => setAccountStatusFilter('active')}
                                >
                                    Active ({activeCount})
                                </button>
                                <button
                                    type="button"
                                    className={`pill-btn ${accountStatusFilter === 'blocked' ? 'active' : ''}`}
                                    onClick={() => setAccountStatusFilter('blocked')}
                                >
                                    Blocked ({blockedCount})
                                </button>
                            </div>

                            <div className="sm-search-input-wrap">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by student name or email..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                                {studentSearch && (
                                    <button
                                        type="button"
                                        className="btn-clear-x"
                                        onClick={() => setStudentSearch('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Clean Students Table */}
                        <div className="sm-table-responsive">
                            <table className="sm-clean-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Status</th>
                                        <th>Exams Taken</th>
                                        <th>Pass / Fail</th>
                                        <th>Average Score</th>
                                        <th>Best Score</th>
                                        <th>Latest Exam</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="empty-table-cell">
                                                No students found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className={`student-row ${student.isBlocked ? 'blocked-row' : ''}`}
                                                onClick={() => setSelectedStudentId(student.id)}
                                            >
                                                {/* Student Name & Email */}
                                                <td>
                                                    <div className="student-profile-cell">
                                                        <div className={`avatar-badge ${student.isBlocked ? 'blocked' : ''}`}>
                                                            {getInitials(student.name)}
                                                        </div>
                                                        <div className="student-names">
                                                            <strong className="name-text">{student.name}</strong>
                                                            <span className="email-text">{student.email}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td>
                                                    <span className={`status-badge ${student.isBlocked ? 'blocked' : 'active'}`}>
                                                        {student.isBlocked ? <FaBan /> : <FaCheckCircle />}
                                                        <span>{student.isBlocked ? 'Blocked' : 'Active'}</span>
                                                    </span>
                                                </td>

                                                {/* Exams Count */}
                                                <td>
                                                    <span className="exam-count-chip">
                                                        <FaClipboardCheck /> {student.examsCount} {student.examsCount === 1 ? 'Exam' : 'Exams'}
                                                    </span>
                                                </td>

                                                {/* Pass / Fail */}
                                                <td>
                                                    <div className="pass-fail-flex">
                                                        <span className="pf-pass">✓ {student.passedCount}</span>
                                                        <span className="pf-sep">/</span>
                                                        <span className="pf-fail">✗ {student.failedCount}</span>
                                                    </div>
                                                </td>

                                                {/* Avg Score */}
                                                <td>
                                                    {student.examsCount > 0 ? (
                                                        <span className={`score-badge ${getScoreClass(student.avgPercentage)}`}>
                                                            {student.avgPercentage.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>

                                                {/* Best Score */}
                                                <td>
                                                    {student.examsCount > 0 ? (
                                                        <span className="best-score-text">
                                                            <FaTrophy className="trophy-icon" />
                                                            {student.bestPercentage.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>

                                                {/* Latest Exam Date */}
                                                <td>
                                                    <span className="date-subtext">
                                                        {student.latestAttemptDate ? (
                                                            new Date(student.latestAttemptDate).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })
                                                        ) : (
                                                            'No attempts'
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="actions-flex" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className={`btn-access-toggle ${student.isBlocked ? 'unblock' : 'block'}`}
                                                            onClick={() => handleToggleBlock(student.id, student.isBlocked, student.name)}
                                                            title={student.isBlocked ? "Allow student to log in" : "Block student from portal"}
                                                        >
                                                            {student.isBlocked ? <FaCheck /> : <FaBan />}
                                                            <span>{student.isBlocked ? 'Unblock' : 'Block'}</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-open-results"
                                                            onClick={() => setSelectedStudentId(student.id)}
                                                        >
                                                            <span>Results</span>
                                                            <FaChevronRight className="arrow-icon" />
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

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 2: INDIVIDUAL STUDENT RESULTS (Clean & Simple)
                   ════════════════════════════════════════════════════════════════════════ */}
                {selectedStudent && (
                    <div className="sm-detail-box">
                        {/* Clean Student Header Card */}
                        <div className={`sm-student-banner ${selectedStudent.isBlocked ? 'blocked-banner' : ''}`}>
                            <div className="banner-student-left">
                                <div className={`avatar-badge lg ${selectedStudent.isBlocked ? 'blocked' : ''}`}>
                                    {getInitials(selectedStudent.name)}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h2 className="banner-name">{selectedStudent.name}</h2>
                                        <span className={`status-badge ${selectedStudent.isBlocked ? 'blocked' : 'active'}`}>
                                            {selectedStudent.isBlocked ? <FaBan /> : <FaCheckCircle />}
                                            <span>{selectedStudent.isBlocked ? 'Blocked' : 'Active'}</span>
                                        </span>
                                    </div>
                                    <p className="banner-email">{selectedStudent.email}</p>
                                </div>
                            </div>

                            <div className="banner-student-right">
                                <div className="banner-stat-pills">
                                    <div className="b-stat-pill">
                                        <span className="num">{selectedStudent.examsCount}</span>
                                        <span className="lbl">Exams Taken</span>
                                    </div>
                                    <div className="b-stat-pill pass">
                                        <span className="num">{selectedStudent.passedCount}</span>
                                        <span className="lbl">Passed</span>
                                    </div>
                                    <div className="b-stat-pill fail">
                                        <span className="num">{selectedStudent.failedCount}</span>
                                        <span className="lbl">Failed</span>
                                    </div>
                                    <div className="b-stat-pill avg">
                                        <span className="num">{selectedStudent.avgPercentage.toFixed(1)}%</span>
                                        <span className="lbl">Average</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={`btn-access-toggle lg ${selectedStudent.isBlocked ? 'unblock' : 'block'}`}
                                    onClick={() => handleToggleBlock(selectedStudent.id, selectedStudent.isBlocked, selectedStudent.name)}
                                >
                                    {selectedStudent.isBlocked ? <FaCheck /> : <FaBan />}
                                    <span>{selectedStudent.isBlocked ? 'Unblock Student' : 'Block Student'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Exam Results Table Header and Filter */}
                        <div className="sm-controls-row" style={{ marginTop: '1.25rem' }}>
                            <div className="sm-filter-pills">
                                <button
                                    type="button"
                                    className={`pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('all')}
                                >
                                    All Exams ({selectedStudent.results.length})
                                </button>
                                <button
                                    type="button"
                                    className={`pill-btn ${statusFilter === 'pass' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('pass')}
                                >
                                    Passed ({selectedStudent.passedCount})
                                </button>
                                <button
                                    type="button"
                                    className={`pill-btn ${statusFilter === 'fail' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('fail')}
                                >
                                    Failed ({selectedStudent.failedCount})
                                </button>
                            </div>

                            <div className="sm-search-input-wrap sm">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search exam..."
                                    value={examSearch}
                                    onChange={(e) => setExamSearch(e.target.value)}
                                />
                                {examSearch && (
                                    <button
                                        type="button"
                                        className="btn-clear-x"
                                        onClick={() => setExamSearch('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Exam Results Table */}
                        <div className="sm-table-responsive">
                            <table className="sm-clean-table">
                                <thead>
                                    <tr>
                                        <th>Exam Title</th>
                                        <th>Subject</th>
                                        <th>Score</th>
                                        <th>Percentage</th>
                                        <th>Result</th>
                                        <th>Time Taken</th>
                                        <th>Submitted On</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudentResults.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="empty-table-cell">
                                                {selectedStudent.results.length === 0
                                                    ? `${selectedStudent.name} hasn't taken any exams yet.`
                                                    : 'No exam attempts match your filter.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudentResults.map((result) => {
                                            const isPass = (result.percentage || 0) >= 40;
                                            return (
                                                <tr key={result._id}>
                                                    <td>
                                                        <strong className="exam-title">{result.exam?.title || 'Examination'}</strong>
                                                    </td>

                                                    <td>
                                                        <span className="subject-tag">
                                                            <FaBookOpen /> {result.subject?.name || 'General'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="score-val">{result.totalScore}</span>
                                                    </td>

                                                    <td>
                                                        <span className={`score-badge ${getScoreClass(result.percentage)}`}>
                                                            {(result.percentage || 0).toFixed(1)}%
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className={`status-badge ${isPass ? 'active' : 'blocked'}`}>
                                                            {isPass ? <FaCheckCircle /> : <FaTimesCircle />}
                                                            <span>{isPass ? 'PASSED' : 'FAILED'}</span>
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="date-subtext">
                                                            {Math.floor((result.timeTaken || 0) / 60)}m {(result.timeTaken || 0) % 60}s
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="date-subtext">
                                                            {new Date(result.submittedAt).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </td>

                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="actions-flex">
                                                            <button
                                                                type="button"
                                                                className="btn-open-scorecard"
                                                                onClick={() => navigate(`/student/result/${result._id}`)}
                                                            >
                                                                <FaExternalLinkAlt /> Scorecard
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn-del-icon"
                                                                onClick={() => handleDelete(result._id)}
                                                                title="Delete result"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
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
