import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBookOpen, FaFolderOpen, FaSearch, FaCode,
    FaBrain, FaChevronRight, FaVideo, FaGraduationCap
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { subjectAPI } from '../services/api';
import './StudentSubjects.css';

function StudentSubjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        subjectAPI.getAll({ isActive: true })
            .then(res => setSubjects(res.data.subjects || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = subjects.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const getCatClass = (cat = '') => {
        const c = cat.toLowerCase();
        if (c.includes('prog')) return 'programming';
        if (c.includes('apt')) return 'aptitude';
        if (c.includes('theo')) return 'theory';
        return 'default';
    };

    const getCatIcon = (cat = '') => {
        const c = cat.toLowerCase();
        if (c.includes('prog')) return <FaCode />;
        if (c.includes('apt')) return <FaBrain />;
        if (c.includes('theo')) return <FaBookOpen />;
        return <FaGraduationCap />;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="ss-page">
            {/* Hero */}
            <div className="ss-hero">
                <div className="ss-hero-inner">
                    <div className="ss-hero-icon"><FaBookOpen /></div>
                    <div className="ss-hero-text">
                        <h1>Subjects</h1>
                        <p>Explore your academic subjects, notes, and video lectures</p>
                    </div>
                    <div className="ss-search-wrap">
                        <FaSearch className="ss-search-icon" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search subjects…"
                        />
                    </div>
                </div>
            </div>

            {/* Subject Content */}
            <div className="ss-content">
                <p className="ss-count">{filtered.length} subject{filtered.length !== 1 ? 's' : ''} available</p>

                {filtered.length === 0 ? (
                    <div className="ss-empty">No subjects match your search.</div>
                ) : (
                    <div className="ss-subjects-grid">
                        {filtered.map((subject, i) => {
                            const catClass = getCatClass(subject.category);
                            return (
                                <div
                                    key={subject._id}
                                    className={`ss-subject-card cat-${catClass}`}
                                    style={{ animationDelay: `${i * 0.04}s` }}
                                >
                                    {/* Top colorful accent bar */}
                                    <div className={`ss-card-accent ${catClass}`} />

                                    {/* Card Header with Badges */}
                                    <div className="ss-card-badges">
                                        <span className={`ss-cat-badge ${catClass}`}>
                                            {getCatIcon(subject.category)} {subject.category || 'General'}
                                        </span>
                                        <span className="ss-badge active-status">
                                            <span className="ss-dot" /> ACTIVE
                                        </span>
                                        {subject.code && (
                                            <span className="ss-code-badge">{subject.code}</span>
                                        )}
                                    </div>

                                    {/* Subject Title & Description */}
                                    <h3 className="ss-subject-name">{subject.name}</h3>
                                    <p className="ss-subject-desc">{subject.description || 'Access notes, presentations, and recorded video lectures.'}</p>

                                    {/* Quick Info Tags */}
                                    <div className="ss-card-meta">
                                        <span className="ss-meta-item">
                                            <FaFolderOpen /> Study Notes
                                        </span>
                                        <span className="ss-meta-item">
                                            <FaVideo /> Video Lectures
                                        </span>
                                    </div>

                                    {/* Action Button */}
                                    <div className="ss-card-footer">
                                        <button
                                            className="ss-notes-btn"
                                            onClick={() => navigate(`/student/materials/${encodeURIComponent(subject.name)}`)}
                                        >
                                            <FaFolderOpen /> View Notes & Materials
                                            <FaChevronRight className="ss-arrow-icon" />
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

export default StudentSubjects;
