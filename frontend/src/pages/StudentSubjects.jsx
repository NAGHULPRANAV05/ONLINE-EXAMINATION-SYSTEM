import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBookOpen, FaSearch, FaChevronRight
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

    const getCatClass = (cat) => {
        if (cat === 'programming') return 'programming';
        if (cat === 'aptitude') return 'aptitude';
        return 'default';
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
                        <p>Browse subjects and access study materials</p>
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

            {/* Subject Grid */}
            <div className="ss-content">
                <p className="ss-count">{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</p>

                {filtered.length === 0 ? (
                    <div className="ss-empty">No subjects found.</div>
                ) : (
                    <div className="ss-grid">
                        {filtered.map((s, i) => (
                            <div className="ss-card" key={s._id} style={{ animationDelay: `${i * 0.04}s` }}>
                                <div className="ss-card-body">
                                    <div className="ss-card-top">
                                        <span className={`ss-cat-badge ${getCatClass(s.category)}`}>
                                            {s.category}
                                        </span>
                                        {s.code && <span className="ss-code">{s.code}</span>}
                                    </div>

                                    <h3 className="ss-card-name">{s.name}</h3>
                                    <p className="ss-card-desc">{s.description || 'No description provided.'}</p>

                                    <div className="ss-card-footer">
                                        <span className="ss-footer-pill">Active</span>
                                        <button
                                            className="ss-mat-btn"
                                            onClick={() => navigate(`/student/materials/${encodeURIComponent(s.name)}`)}
                                        >
                                            <FaBookOpen className="ss-mat-btn-icon" />
                                            View Materials
                                            <FaChevronRight className="ss-mat-btn-arrow" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentSubjects;
