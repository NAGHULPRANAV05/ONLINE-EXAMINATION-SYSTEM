import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { subjectAPI, examAPI, resultAPI, materialAPI } from '../services/api';
import {
    FaHandPeace, FaClock, FaClipboardList, FaArrowLeft, FaFolderOpen,
    FaDownload, FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileArchive,
    FaFileAlt, FaBookOpen, FaBuilding, FaCalendarAlt, FaSearch, FaEye,
    FaYoutube, FaGraduationCap, FaChartLine, FaPlay, FaTrophy, FaStar
} from 'react-icons/fa';
import './StudentDashboard.css';

function StudentDashboard() {
    const [subjects, setSubjects] = useState([]);
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Materials state
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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

            setSubjects(subjectsRes.data.subjects);
            setExams(examsRes.data.exams);
            setResults(resultsRes.data.results);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Materials functions ---
    const openSubjectMaterials = async (subject) => {
        setSelectedSubject(subject);
        setMaterialsLoading(true);
        setSearchTerm('');
        try {
            const res = await materialAPI.getAll({ subjectName: subject.name });
            setMaterials(res.data.materials);
        } catch (err) {
            console.error('Error fetching materials:', err);
        } finally {
            setMaterialsLoading(false);
        }
    };

    const goBack = () => {
        setSelectedSubject(null);
        setMaterials([]);
        setSearchTerm('');
    };

    const handleDownload = async (material) => {
        setDownloading(material._id);
        try {
            const res = await materialAPI.download(material._id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', material.fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download file');
        } finally {
            setDownloading(null);
        }
    };

    const getFileIcon = (type) => {
        const size = '1.5rem';
        switch (type) {
            case 'pdf': return <FaFilePdf style={{ color: '#ef4444', fontSize: size }} />;
            case 'doc': case 'docx': return <FaFileWord style={{ color: '#2563eb', fontSize: size }} />;
            case 'ppt': case 'pptx': return <FaFilePowerpoint style={{ color: '#f59e0b', fontSize: size }} />;
            case 'zip': return <FaFileArchive style={{ color: '#8b5cf6', fontSize: size }} />;
            default: return <FaFileAlt style={{ color: '#64748b', fontSize: size }} />;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const getYoutubeEmbedUrl = (url) => {
        if (!url) return '';
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : '';
    };

    const getCatClass = (cat) => {
        if (cat === 'programming') return 'programming';
        if (cat === 'aptitude') return 'aptitude';
        return 'default';
    };

    const filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

    const avgScore = results.length > 0
        ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)
        : 0;

    // --- Materials view ---
    if (selectedSubject) {
        return (
            <div className="sd-page">
                <Navbar />

                {/* Materials Hero */}
                <div className="sd-mat-hero">
                    <div className="sd-mat-hero-content">
                        <button onClick={goBack} className="sd-back-btn">
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                        <h1>
                            <FaFolderOpen style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            {selectedSubject.name} — Notes
                        </h1>
                        <p className="sd-mat-hero-sub">Study materials for {selectedSubject.name}</p>
                    </div>
                </div>

                <div className="sd-mat-content">
                    {/* Search */}
                    {materials.length > 3 && (
                        <div className="sd-mat-search">
                            <FaSearch className="sd-mat-search-icon" />
                            <input
                                type="text"
                                placeholder="Search materials..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}

                    {materialsLoading ? (
                        <LoadingSpinner />
                    ) : filteredMaterials.length === 0 ? (
                        <div className="sd-mat-empty">
                            <div className="sd-mat-empty-icon"><FaBookOpen /></div>
                            <h3>{materials.length === 0 ? 'No materials available' : 'No results found'}</h3>
                            <p style={{ color: 'var(--text-muted)' }}>
                                {materials.length === 0
                                    ? 'No study materials have been uploaded for this subject yet.'
                                    : 'Try a different search term.'}
                            </p>
                        </div>
                    ) : (
                        <div className="sd-mat-grid">
                            {filteredMaterials.map((material) => (
                                <div key={material._id} className="sd-mat-card">
                                    <div>
                                        {material.materialType === 'link' ? (
                                            <>
                                                <div className="sd-mat-type-row">
                                                    <FaYoutube style={{ color: '#ef4444', fontSize: '1.5rem' }} />
                                                    <span className="sd-mat-type-badge youtube">YouTube</span>
                                                </div>
                                                <h3 className="sd-mat-title">{material.title}</h3>
                                                <p className="sd-mat-desc">{material.description}</p>
                                                {getYoutubeEmbedUrl(material.youtubeUrl) && (
                                                    <div className="sd-mat-video">
                                                        <iframe
                                                            src={getYoutubeEmbedUrl(material.youtubeUrl)}
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            title={material.title}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="sd-mat-type-row">
                                                    {getFileIcon(material.fileType)}
                                                    <span className={`sd-mat-type-badge ${material.fileType === 'pdf' ? 'pdf' : material.fileType?.startsWith('doc') ? 'doc' : material.fileType?.startsWith('ppt') ? 'ppt' : 'other'}`}>
                                                        {material.fileType}
                                                    </span>
                                                    <span className="sd-mat-size">{formatFileSize(material.fileSize)}</span>
                                                </div>
                                                <h3 className="sd-mat-title">{material.title}</h3>
                                                <p className="sd-mat-desc">{material.description}</p>
                                            </>
                                        )}

                                        <div className="sd-mat-tags">
                                            <span className="sd-mat-tag dept">
                                                <FaBuilding style={{ marginRight: '0.15rem', verticalAlign: 'middle', fontSize: '0.55rem' }} />
                                                {material.department}
                                            </span>
                                            <span className="sd-mat-tag sem">
                                                <FaCalendarAlt style={{ marginRight: '0.15rem', verticalAlign: 'middle', fontSize: '0.55rem' }} />
                                                {material.yearSemester}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="sd-mat-footer">
                                        <span className="sd-mat-date">
                                            {new Date(material.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="sd-mat-actions">
                                            {material.materialType === 'link' ? (
                                                <a href={material.youtubeUrl} target="_blank" rel="noopener noreferrer"
                                                    className="sd-mat-action-btn watch">
                                                    <FaYoutube /> Watch
                                                </a>
                                            ) : (
                                                <>
                                                    <button
                                                        className="sd-mat-action-btn view"
                                                        onClick={() => window.open(materialAPI.getViewUrl(material._id), '_blank')}
                                                    >
                                                        <FaEye /> View
                                                    </button>
                                                    <button
                                                        className="sd-mat-action-btn download"
                                                        onClick={() => handleDownload(material)}
                                                        disabled={downloading === material._id}
                                                    >
                                                        <FaDownload />
                                                        {downloading === material._id ? '...' : 'Download'}
                                                    </button>
                                                </>
                                            )}
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

    // --- Main dashboard ---
    return (
        <div className="sd-page">
            <Navbar />

            {/* Hero */}
            <div className="sd-hero">
                <div className="sd-hero-content">
                    <h1>
                        Welcome, <span>{user.name}</span>!{' '}
                        <span className="sd-hero-wave">👋</span>
                    </h1>
                    <p className="sd-hero-sub">Ready to take your exams? Select a subject below to get started.</p>
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
                            <button className="sd-notes-btn" onClick={() => openSubjectMaterials(subject)}>
                                <FaFolderOpen /> View Notes
                            </button>
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
