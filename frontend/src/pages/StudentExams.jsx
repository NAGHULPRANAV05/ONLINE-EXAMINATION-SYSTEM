import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaGraduationCap, FaClock, FaClipboardList,
    FaPlay, FaSearch, FaRedo, FaBookOpen, FaStar,
    FaFilter, FaChevronDown
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { examAPI, resultAPI } from '../services/api';
import './StudentExams.css';

function StudentExams() {
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [diffFilter, setDiffFilter] = useState('all');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            examAPI.getAll({ isActive: true }),
            resultAPI.getStudentResults(user.id)
        ]).then(([examRes, resultRes]) => {
            setExams(examRes.data.exams || []);
            setResults(resultRes.data.results || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const attemptedIds = new Set(results.map(r => r.exam?._id || r.exam));

    const filtered = exams.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
            (e.subject?.name || '').toLowerCase().includes(search.toLowerCase());
        const matchDiff = diffFilter === 'all' || e.difficulty === diffFilter;
        return matchSearch && matchDiff;
    });

    /* Enter fullscreen then navigate to exam */
    const handleStartExam = async (examId) => {
        try {
            const el = document.documentElement;
            if (el.requestFullscreen) await el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        } catch (err) {
            console.warn('Fullscreen denied:', err);
        }
        navigate(`/student/exam/${examId}`);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="se-page">
            {/* Hero */}
            <div className="se-hero">
                <div className="se-hero-inner">
                    <div className="se-hero-icon"><FaGraduationCap /></div>
                    <div className="se-hero-text">
                        <h1>Available Exams</h1>
                        <p>{exams.length} active exam{exams.length !== 1 ? 's' : ''} ready for you</p>
                    </div>
                    <div className="se-controls">
                        <div className="se-search-wrap">
                            <FaSearch className="se-search-icon" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search exams…"
                            />
                        </div>
                        <div className="se-filter-wrap">
                            <FaFilter className="se-filter-icon" />
                            <select
                                className="se-filter"
                                value={diffFilter}
                                onChange={e => setDiffFilter(e.target.value)}
                            >
                                <option value="all">All Levels</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                            <FaChevronDown className="se-chevron-icon" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="se-content">
                {filtered.length === 0 ? (
                    <div className="se-empty">No exams match your filters.</div>
                ) : (
                    <div className="se-grid">
                        {filtered.map((exam, i) => {
                            const attempted = attemptedIds.has(exam._id);
                            return (
                                <div
                                    className="se-card"
                                    key={exam._id}
                                    style={{ animationDelay: `${i * 0.04}s` }}
                                >
                                    {/* Top green accent line */}
                                    <div className="se-card-accent" />

                                    {/* Body */}
                                    <div className="se-card-body">
                                        <div className="se-card-badges">
                                            <span className="se-badge subject">
                                                <FaBookOpen /> {exam.subject?.name}
                                            </span>
                                            <span className={`se-badge ${exam.difficulty}`}>
                                                {exam.difficulty}
                                            </span>
                                            <span className="se-badge active-status">
                                                <span className="se-dot" /> ACTIVE
                                            </span>
                                            {attempted && (
                                                <span className="se-badge attempted-tag">
                                                    ✓ Attempted
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="se-card-title">{exam.title}</h3>
                                        <p className="se-card-desc">{exam.description || 'No additional instructions provided.'}</p>

                                        <div className="se-card-meta">
                                            <span className="se-meta-item"><FaClock /> {exam.duration} min</span>
                                            <span className="se-meta-item"><FaStar /> {exam.totalMarks} marks</span>
                                            <span className="se-meta-item"><FaClipboardList /> {exam.questions?.length || 0} questions</span>
                                        </div>

                                        <div className="se-fs-notice">
                                            <span>🔒 Full-screen mode enforced</span>
                                        </div>
                                    </div>

                                    {/* Footer with button */}
                                    <div className="se-card-footer">
                                        <button
                                            className={`se-start-btn ${attempted ? 'retry' : ''}`}
                                            onClick={() => handleStartExam(exam._id)}
                                        >
                                            {attempted ? <FaRedo /> : <FaPlay />}
                                            {attempted ? 'Retake Exam' : 'Start Exam'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentExams;
