import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { subjectAPI, examAPI, resultAPI } from '../services/api';
import {
    FaClock, FaClipboardList,
    FaBookOpen, FaGraduationCap, FaChartLine, FaPlay, FaTrophy, FaEye
} from 'react-icons/fa';
import './StudentDashboard.css';

function StudentDashboard() {
    const [subjects, setSubjects] = useState([]);
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subjectsRes, examsRes, resultsRes] = await Promise.all([
                subjectAPI.getAll({ isActive: true }),
                examAPI.getAll({ isActive: true }),
                resultAPI.getStudentResults(user.id)
            ]);

            setSubjects(subjectsRes.data.subjects || []);
            setExams(examsRes.data.exams || []);
            setResults(resultsRes.data.results || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCatClass = (cat) => {
        if (cat === 'programming') return 'programming';
        if (cat === 'aptitude') return 'aptitude';
        return 'default';
    };

    if (loading) return <LoadingSpinner />;

    const avgScore = results.length > 0
        ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)
        : 0;

    return (
        <div className="sd-page">
            {/* Hero */}
            <div className="sd-hero">
                <div className="sd-hero-content">
                    <h1>
                        Welcome, <span>{user.name}</span>!{' '}
                        <span className="sd-hero-wave">👋</span>
                    </h1>
                    <p className="sd-hero-sub">Ready to take your exams? Select an exam below to get started.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="sd-stats-wrap">
                <div className="sd-stats-grid">
                    <div className="sd-stat blue">
                        <div className="sd-stat-icon blue"><FaBookOpen /></div>
                        <div className="sd-stat-value">{subjects.length}</div>
                        <p className="sd-stat-label">Available Subjects</p>
                    </div>
                    <div className="sd-stat indigo">
                        <div className="sd-stat-icon indigo"><FaClipboardList /></div>
                        <div className="sd-stat-value">{exams.length}</div>
                        <p className="sd-stat-label">Active Exams</p>
                    </div>
                    <div className="sd-stat amber">
                        <div className="sd-stat-icon amber"><FaChartLine /></div>
                        <div className="sd-stat-value">{avgScore}%</div>
                        <p className="sd-stat-label">Average Score</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="sd-content">
                {/* Subjects */}
                <div className="sd-section-head">
                    <div className="sd-section-icon blue"><FaBookOpen /></div>
                    <h2 className="sd-section-title">Subjects</h2>
                </div>
                <div className="sd-subjects-grid">
                    {subjects.map((subject) => (
                        <div key={subject._id} className="sd-subject-card">
                            <span className={`sd-cat-badge ${getCatClass(subject.category)}`}>
                                {subject.category}
                            </span>
                            <h3 className="sd-subject-name">{subject.name}</h3>
                            <p className="sd-subject-desc">{subject.description}</p>
                        </div>
                    ))}
                </div>

                {/* Exams */}
                <div className="sd-section-head">
                    <div className="sd-section-icon green"><FaGraduationCap /></div>
                    <h2 className="sd-section-title">Available Exams</h2>
                </div>
                {exams.length === 0 ? (
                    <div className="sd-empty">No active exams at the moment.</div>
                ) : (
                    <div className="sd-exams-grid">
                        {exams.map((exam) => (
                            <div key={exam._id} className="sd-exam-card">
                                <div className="sd-exam-badges">
                                    <span className="sd-badge subject">{exam.subject?.name}</span>
                                    <span className={`sd-badge ${exam.difficulty}`}>{exam.difficulty}</span>
                                </div>
                                <h3 className="sd-exam-title">{exam.title}</h3>
                                <p className="sd-exam-desc">{exam.description}</p>
                                <div className="sd-exam-meta">
                                    <span className="sd-exam-meta-item"><FaClock /> {exam.duration} min</span>
                                    <span className="sd-exam-meta-item"><FaClipboardList /> {exam.totalMarks} marks</span>
                                </div>
                                <Link to={`/student/exam/${exam._id}`} className="sd-start-btn">
                                    <FaPlay /> Start Exam
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recent Results */}
                {results.length > 0 && (
                    <>
                        <div className="sd-section-head">
                            <div className="sd-section-icon purple"><FaTrophy /></div>
                            <h2 className="sd-section-title">Recent Results</h2>
                        </div>
                        <div className="sd-results-grid">
                            {results.slice(0, 4).map((result) => (
                                <div key={result._id} className="sd-result-card">
                                    <h4 className="sd-result-exam">{result.exam?.title}</h4>
                                    <div className="sd-result-row">
                                        <span className="sd-result-score">
                                            Score: {result.totalScore}/{result.exam?.totalMarks || 0}
                                        </span>
                                        <span className={`sd-pct-badge ${result.percentage >= 40 ? 'pass' : 'fail'}`}>
                                            {result.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                    <Link to={`/student/result/${result._id}`} className="sd-result-link">
                                        <FaEye /> View Details
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;
