import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { resultAPI, userAPI } from '../services/api';
import {
    FaTrash, FaUsers, FaClipboardCheck, FaCheckCircle,
    FaTimesCircle, FaBookOpen, FaChartBar, FaListAlt,
    FaArrowLeft, FaSearch, FaUserGraduate, FaExternalLinkAlt,
    FaTrophy, FaCalendarAlt, FaChevronRight, FaBan, FaCheck,
    FaUserPlus, FaTimes, FaLock, FaEnvelope, FaUser
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

    // Add Student Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [newStudentPassword, setNewStudentPassword] = useState('');
    const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
    const [addStudentError, setAddStudentError] = useState('');

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

    // Create a new student account
    const handleCreateStudent = async (e) => {
        e.preventDefault();
        setAddStudentError('');

        if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPassword.trim()) {
            setAddStudentError('Please fill in all fields (Name, Email, and Password).');
            return;
        }

        if (newStudentPassword.length < 6) {
            setAddStudentError('Password must be at least 6 characters long.');
            return;
        }

        setIsSubmittingStudent(true);
        try {
            await userAPI.createStudent({
                name: newStudentName.trim(),
                email: newStudentEmail.trim().toLowerCase(),
                password: newStudentPassword
            });

            // Reset form and close modal
            setNewStudentName('');
            setNewStudentEmail('');
            setNewStudentPassword('');
            setIsAddModalOpen(false);
            fetchData();
        } catch (error) {
            setAddStudentError(error.response?.data?.message || error.message || 'Failed to create student');
        } finally {
            setIsSubmittingStudent(false);
        }
    };

    // Delete a student account permanently
    const handleDeleteStudent = async (studentId, studentName) => {
        const msg = `Are you sure you want to PERMANENTLY DELETE student "${studentName}"?\n\nThis will remove their portal account and all associated examination records.`;
        if (!window.confirm(msg)) return;

        try {
            await userAPI.deleteStudent(studentId);
            if (selectedStudentId === studentId) {
                setSelectedStudentId(null);
            }
            fetchData();
        } catch (error) {
            alert('Error deleting student: ' + (error.response?.data?.message || error.message));
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

    const handleDeleteResult = async (id) => {
        if (!window.confirm('Are you sure you want to delete this exam result?')) return;
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
        <div className="sm-mon-page">
            <Navbar />

            {/* Standard Hero Banner */}
            <div className="sm-mon-hero">
                <div className="sm-mon-hero-content">
                    <div className="sm-mon-hero-icon">
                        <FaUsers />
                    </div>
                    <h1>Student Monitoring & Control</h1>
                    <p className="sm-mon-hero-sub">
                        {selectedStudent
                            ? `Viewing complete exam records, performance metrics, and access privileges for ${selectedStudent.name}`
                            : 'Track student performance, assessment results, and manage student accounts and access'}
                    </p>
                </div>
            </div>

            {/* Top Analytics Stats Grid (Overlapping Hero) */}
            {analytics && !selectedStudent && (
                <div className="sm-mon-stats-wrap">
                    <div className="sm-mon-stats-grid">
                        <div className="sm-mon-stat purple">
                            <div className="sm-mon-stat-top">
                                <div className="sm-mon-stat-icon purple"><FaUsers /></div>
                            </div>
                            <div className="sm-mon-stat-value">{groupedStudents.length}</div>
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

            {/* Main Content Area */}
            <div className="sm-mon-content">

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 1: STUDENTS DIRECTORY (Default)
                   ════════════════════════════════════════════════════════════════════════ */}
                {!selectedStudent && (
                    <>
                        {/* Subject Performance Section */}
                        {analytics?.subjectPerformance?.length > 0 && (
                            <div className="sm-mon-section-wrap">
                                <div className="sm-mon-section-head">
                                    <div className="sm-mon-section-icon subjects"><FaBookOpen /></div>
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
                                    <h2 className="sm-mon-section-title">Student Records & Access Control</h2>
                                    <p className="sm-mon-section-subtitle">Manage student accounts, control login access, and review assessment records</p>
                                </div>
                            </div>

                            <div className="sm-mon-filter-controls">
                                <button
                                    type="button"
                                    className="btn-add-student-primary"
                                    onClick={() => {
                                        setAddStudentError('');
                                        setIsAddModalOpen(true);
                                    }}
                                >
                                    <FaUserPlus />
                                    <span>Add Student</span>
                                </button>

                                <div className="sm-status-pills">
                                    <button
                                        type="button"
                                        className={`sm-pill-btn ${accountStatusFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setAccountStatusFilter('all')}
                                    >
                                        All ({groupedStudents.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`sm-pill-btn ${accountStatusFilter === 'active' ? 'active' : ''}`}
                                        onClick={() => setAccountStatusFilter('active')}
                                    >
                                        Active ({activeCount})
                                    </button>
                                    <button
                                        type="button"
                                        className={`sm-pill-btn ${accountStatusFilter === 'blocked' ? 'active' : ''}`}
                                        onClick={() => setAccountStatusFilter('blocked')}
                                    >
                                        Blocked ({blockedCount})
                                    </button>
                                </div>

                                <div className="sm-mon-search-box">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
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
                        </div>

                        {/* Students Directory Table */}
                        <div className="sm-mon-table-wrap">
                            <table className="sm-mon-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Portal Access</th>
                                        <th>Exams Taken</th>
                                        <th>Pass / Fail</th>
                                        <th>Average Score</th>
                                        <th>Best Score</th>
                                        <th>Latest Attempt</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="sm-mon-empty-row">
                                                {groupedStudents.length === 0
                                                    ? "No registered students found. Click '+ Add Student' to create an account."
                                                    : "No students matching your search criteria."}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr
                                                key={student.id}
                                                className={`sm-mon-clickable-row ${student.isBlocked ? 'is-blocked-row' : ''}`}
                                                onClick={() => setSelectedStudentId(student.id)}
                                            >
                                                <td>
                                                    <div className="sm-student-profile-cell">
                                                        <div className={`sm-avatar-circle ${student.isBlocked ? 'blocked' : ''}`}>
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
                                                    <span className={`sm-access-tag ${student.isBlocked ? 'blocked' : 'active'}`}>
                                                        {student.isBlocked ? (
                                                            <>
                                                                <FaBan /> Blocked
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaCheckCircle /> Active
                                                            </>
                                                        )}
                                                    </span>
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
                                                        {student.examsCount > 0 ? (
                                                            <span className={`sm-mon-pct ${getScoreClass(student.avgPercentage)}`}>
                                                                {student.avgPercentage.toFixed(1)}%
                                                            </span>
                                                        ) : (
                                                            <span className="sm-muted-text">-</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    {student.examsCount > 0 ? (
                                                        <span className="sm-best-score">
                                                            <FaTrophy style={{ color: '#f59e0b', marginRight: 4 }} />
                                                            {student.bestPercentage.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="sm-muted-text">-</span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="sm-date-text">
                                                        {student.latestAttemptDate ? (
                                                            <>
                                                                <FaCalendarAlt style={{ marginRight: 4, color: '#94a3b8' }} />
                                                                {new Date(student.latestAttemptDate).toLocaleDateString(undefined, {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </>
                                                        ) : (
                                                            <span className="sm-muted-text">No attempts</span>
                                                        )}
                                                    </span>
                                                </td>

                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="sm-action-btns" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className={`btn-block-toggle ${student.isBlocked ? 'unblock' : 'block'}`}
                                                            onClick={() => handleToggleBlock(student.id, student.isBlocked, student.name)}
                                                            title={student.isBlocked ? "Allow student to log in" : "Block student from logging in"}
                                                        >
                                                            {student.isBlocked ? (
                                                                <>
                                                                    <FaCheck /> Unblock
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FaBan /> Block
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-view-results"
                                                            onClick={() => setSelectedStudentId(student.id)}
                                                            title="View student exam results"
                                                        >
                                                            <span>Results</span>
                                                            <FaChevronRight className="btn-arrow" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-delete-student"
                                                            onClick={() => handleDeleteStudent(student.id, student.name)}
                                                            title={`Delete ${student.name}'s account`}
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
                    </>
                )}

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 2: INDIVIDUAL STUDENT RESULTS DETAIL
                   ════════════════════════════════════════════════════════════════════════ */}
                {selectedStudent && (
                    <div className="sm-student-detail-view">

                        {/* Top Back Navigation Bar */}
                        <div className="sm-detail-nav-bar">
                            <button
                                type="button"
                                className="btn-back-to-directory"
                                onClick={() => {
                                    setSelectedStudentId(null);
                                    setExamSearch('');
                                    setStatusFilter('all');
                                }}
                            >
                                <FaArrowLeft />
                                <span>Back to Students Directory</span>
                            </button>

                            <div className="sm-detail-breadcrumb">
                                <span>Students</span>
                                <span className="sep">/</span>
                                <span className="current">{selectedStudent.name}</span>
                            </div>
                        </div>

                        {/* Student Profile Overview Card */}
                        <div className={`sm-student-profile-card ${selectedStudent.isBlocked ? 'is-blocked-card' : ''}`}>
                            <div className="profile-card-left">
                                <div className={`profile-large-avatar ${selectedStudent.isBlocked ? 'blocked' : ''}`}>
                                    {getInitials(selectedStudent.name)}
                                </div>
                                <div className="profile-info-block">
                                    <div className="profile-name-row">
                                        <h2 className="profile-name">{selectedStudent.name}</h2>
                                        <span className={`sm-access-tag ${selectedStudent.isBlocked ? 'blocked' : 'active'}`}>
                                            {selectedStudent.isBlocked ? (
                                                <>
                                                    <FaBan /> Blocked from Portal
                                                </>
                                            ) : (
                                                <>
                                                    <FaCheckCircle /> Active Account
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <p className="profile-email">{selectedStudent.email}</p>
                                </div>
                            </div>

                            <div className="profile-card-right">
                                <div className="profile-stats-cluster">
                                    <div className="cluster-item">
                                        <span className="cluster-val">{selectedStudent.examsCount}</span>
                                        <span className="cluster-lbl">Exams Taken</span>
                                    </div>
                                    <div className="cluster-item">
                                        <span className="cluster-val pass">{selectedStudent.passedCount}</span>
                                        <span className="cluster-lbl">Passed</span>
                                    </div>
                                    <div className="cluster-item">
                                        <span className="cluster-val fail">{selectedStudent.failedCount}</span>
                                        <span className="cluster-lbl">Failed</span>
                                    </div>
                                    <div className="cluster-item highlight">
                                        <span className="cluster-val">{selectedStudent.avgPercentage.toFixed(1)}%</span>
                                        <span className="cluster-lbl">Avg Score</span>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button
                                        type="button"
                                        className={`btn-profile-block ${selectedStudent.isBlocked ? 'unblock' : 'block'}`}
                                        onClick={() => handleToggleBlock(selectedStudent.id, selectedStudent.isBlocked, selectedStudent.name)}
                                    >
                                        {selectedStudent.isBlocked ? (
                                            <>
                                                <FaCheck /> Unblock Access
                                            </>
                                        ) : (
                                            <>
                                                <FaBan /> Block Access
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-profile-delete"
                                        onClick={() => handleDeleteStudent(selectedStudent.id, selectedStudent.name)}
                                        title={`Delete ${selectedStudent.name}`}
                                    >
                                        <FaTrash /> Delete Student
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filters for this student's exam results */}
                        <div className="sm-detail-controls-row">
                            <div className="sm-detail-tabs">
                                <button
                                    type="button"
                                    className={`detail-tab ${statusFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('all')}
                                >
                                    All Exams ({selectedStudent.results.length})
                                </button>
                                <button
                                    type="button"
                                    className={`detail-tab ${statusFilter === 'pass' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('pass')}
                                >
                                    Passed ({selectedStudent.passedCount})
                                </button>
                                <button
                                    type="button"
                                    className={`detail-tab ${statusFilter === 'fail' ? 'active' : ''}`}
                                    onClick={() => setStatusFilter('fail')}
                                >
                                    Failed ({selectedStudent.failedCount})
                                </button>
                            </div>

                            <div className="sm-detail-search">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search exam or subject..."
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

                        {/* Detailed Exam Results Table */}
                        <div className="sm-mon-table-wrap">
                            <table className="sm-mon-table">
                                <thead>
                                    <tr>
                                        <th>Exam Title</th>
                                        <th>Subject</th>
                                        <th>Score</th>
                                        <th>Percentage</th>
                                        <th>Status</th>
                                        <th>Time Taken</th>
                                        <th>Date & Time</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudentResults.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="sm-mon-empty-row">
                                                {selectedStudent.results.length === 0
                                                    ? `${selectedStudent.name} hasn't attempted any exams yet.`
                                                    : 'No exam attempts matched your filter.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudentResults.map((result) => {
                                            const isPass = (result.percentage || 0) >= 40;
                                            return (
                                                <tr key={result._id}>
                                                    <td>
                                                        <div className="sm-exam-title-cell">
                                                            <FaListAlt className="exam-title-icon" />
                                                            <span className="exam-title-text">
                                                                {result.exam?.title || 'General Examination'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span className="sm-subject-pill">
                                                            <FaBookOpen style={{ marginRight: 4 }} />
                                                            {result.subject?.name || 'General'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="sm-score-text">
                                                            {result.totalScore}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="sm-score-bar-inline">
                                                            <div className="sm-score-track sm">
                                                                <div
                                                                    className={`sm-mon-score-fill ${getScoreClass(result.percentage)}`}
                                                                    style={{ width: `${Math.min(result.percentage || 0, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className={`sm-mon-pct ${getScoreClass(result.percentage)}`}>
                                                                {(result.percentage || 0).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <span className={`sm-status-chip ${isPass ? 'pass' : 'fail'}`}>
                                                            {isPass ? <FaCheckCircle /> : <FaTimesCircle />}
                                                            {isPass ? 'PASSED' : 'FAILED'}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="sm-time-text">
                                                            {Math.floor((result.timeTaken || 0) / 60)}m {(result.timeTaken || 0) % 60}s
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="sm-date-text">
                                                            <FaCalendarAlt style={{ marginRight: 4, color: '#94a3b8' }} />
                                                            {new Date(result.submittedAt).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </td>

                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="sm-row-actions">
                                                            <button
                                                                type="button"
                                                                className="btn-scorecard-link"
                                                                onClick={() => navigate(`/student/result/${result._id}`)}
                                                                title="View detailed scorecard & answers"
                                                            >
                                                                <FaExternalLinkAlt /> Scorecard
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn-mon-delete"
                                                                onClick={() => handleDeleteResult(result._id)}
                                                                title="Delete this attempt"
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

            {/* ════════════════════════════════════════════════════════════════════════
                ADD STUDENT MODAL
               ════════════════════════════════════════════════════════════════════════ */}
            {isAddModalOpen && (
                <div className="sm-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
                    <div className="sm-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="sm-modal-header">
                            <div className="modal-header-icon">
                                <FaUserPlus />
                            </div>
                            <div>
                                <h3 className="modal-title">Register New Student</h3>
                                <p className="modal-sub">Create credentials for a student to log in and take assessments</p>
                            </div>
                            <button
                                type="button"
                                className="btn-modal-close"
                                onClick={() => setIsAddModalOpen(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {addStudentError && (
                            <div className="sm-modal-alert error">
                                {addStudentError}
                            </div>
                        )}

                        <form onSubmit={handleCreateStudent} className="sm-modal-form">
                            <div className="form-group">
                                <label className="form-lbl">
                                    <FaUser style={{ marginRight: 4 }} /> Student Full Name
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Manjunath R"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-lbl">
                                    <FaEnvelope style={{ marginRight: 4 }} /> Email Address
                                </label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="e.g. manjunath@example.com"
                                    value={newStudentEmail}
                                    onChange={(e) => setNewStudentEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-lbl">
                                    <FaLock style={{ marginRight: 4 }} /> Password
                                </label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="At least 6 characters"
                                    value={newStudentPassword}
                                    onChange={(e) => setNewStudentPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="sm-modal-footer">
                                <button
                                    type="button"
                                    className="btn-modal-cancel"
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isSubmittingStudent}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-modal-submit"
                                    disabled={isSubmittingStudent}
                                >
                                    {isSubmittingStudent ? 'Creating...' : 'Create Student Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentMonitoring;
