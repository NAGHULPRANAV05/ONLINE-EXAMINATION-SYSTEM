import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaBookOpen, FaArrowLeft, FaFilePdf, FaFileWord,
    FaFilePowerpoint, FaYoutube, FaFile, FaDownload,
    FaExternalLinkAlt, FaSearch
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { materialAPI } from '../services/api';
import './StudentMaterialsPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ── helper: extract YouTube URL from any material field ── */
const extractYouTubeUrl = (mat) => {
    if (!mat) return null;
    if (mat.youtubeUrl) return mat.youtubeUrl;

    const candidates = [
        mat.filePath,
        mat.fileName,
        mat.description,
        mat.title
    ].filter(Boolean);

    for (const str of candidates) {
        const match = str.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)[^\s"'<>]+/i);
        if (match) return match[0];
    }
    return null;
};

/* ── helper: extract YouTube ID ── */
const getYTId = (url = '') => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i);
    if (match) return match[1];
    const vMatch = url.match(/[?&]v=([\w-]{11})/i);
    if (vMatch) return vMatch[1];
    return null;
};

/* ── icon per file type ── */
const TypeIcon = ({ material }) => {
    const ytUrl = extractYouTubeUrl(material);
    const isYT = Boolean(ytUrl) || material.materialType === 'link' || material.fileType === 'youtube';
    if (isYT) return <FaYoutube className="smp-icon yt" />;

    const type = (material.fileType || '').toLowerCase();
    const map = {
        pdf: <FaFilePdf className="smp-icon pdf" />,
        doc: <FaFileWord className="smp-icon doc" />,
        docx: <FaFileWord className="smp-icon doc" />,
        ppt: <FaFilePowerpoint className="smp-icon ppt" />,
        pptx: <FaFilePowerpoint className="smp-icon ppt" />,
    };
    return map[type] || <FaFile className="smp-icon other" />;
};

function StudentMaterialsPage() {
    const { subjectName } = useParams();
    const decodedSubject = decodeURIComponent(subjectName || '');
    const navigate = useNavigate();

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!decodedSubject) {
            setLoading(false);
            return;
        }
        materialAPI.getAll({ subjectName: decodedSubject })
            .then(res => setMaterials(res.data.materials || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [decodedSubject]);

    const token = localStorage.getItem('token');
    const getViewUrl = (id) => `${API_URL}/materials/${id}/view?token=${token}`;
    const getDownloadUrl = (id) => `${API_URL}/materials/${id}/download?token=${token}`;

    const filtered = materials.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="smp-page">
            {/* Hero */}
            <div className="smp-hero">
                <div className="smp-hero-inner">
                    <button className="smp-back-btn" onClick={() => navigate('/student/subjects')}>
                        <FaArrowLeft /> Back to Subjects
                    </button>

                    <div className="smp-hero-title-row">
                        <div className="smp-hero-icon"><FaBookOpen /></div>
                        <div className="smp-hero-text">
                            <h1>{decodedSubject} — Materials</h1>
                            <p>{materials.length} study material{materials.length !== 1 ? 's' : ''} available</p>
                        </div>
                    </div>

                    <div className="smp-search-wrap">
                        <FaSearch className="smp-search-icon" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search materials…"
                        />
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="smp-content">
                {filtered.length === 0 ? (
                    <div className="smp-empty">
                        <FaBookOpen className="smp-empty-icon" />
                        <h3>No materials found</h3>
                        <p>{search ? 'No materials match your search.' : 'No materials have been uploaded for this subject yet.'}</p>
                        <Link to="/student/subjects" className="smp-empty-btn">
                            Browse Other Subjects
                        </Link>
                    </div>
                ) : (
                    <div className="smp-grid">
                        {filtered.map((mat, i) => {
                            const detectedUrl = extractYouTubeUrl(mat);
                            const isYT = Boolean(detectedUrl) || mat.materialType === 'link' || mat.fileType === 'youtube';
                            const ytUrl = detectedUrl || mat.youtubeUrl || '';
                            const ytId = getYTId(ytUrl);

                            return (
                                <div className="smp-card" key={mat._id} style={{ animationDelay: `${i * 0.04}s` }}>
                                    <div className="smp-card-header">
                                        <TypeIcon material={mat} />
                                        <div className="smp-header-info">
                                            <span className="smp-badge">
                                                {isYT ? 'YOUTUBE' : (mat.fileType || 'DOCUMENT').toUpperCase()}
                                            </span>
                                            <h3 className="smp-title">{mat.title}</h3>
                                        </div>
                                    </div>

                                    {mat.description && (
                                        <p className="smp-desc">{mat.description}</p>
                                    )}

                                    {/* Video Player */}
                                    {isYT && ytId && (
                                        <div className="smp-video-wrap">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${ytId}`}
                                                title={mat.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="smp-card-footer">
                                        {isYT ? (
                                            <a
                                                href={ytUrl || `https://www.youtube.com/watch?v=${ytId}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="smp-btn primary"
                                            >
                                                <FaYoutube /> Watch on YouTube
                                            </a>
                                        ) : (
                                            <div className="smp-btn-group">
                                                <a
                                                    href={getViewUrl(mat._id)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="smp-btn secondary"
                                                >
                                                    <FaExternalLinkAlt /> View
                                                </a>
                                                <a
                                                    href={getDownloadUrl(mat._id)}
                                                    download
                                                    className="smp-btn primary"
                                                >
                                                    <FaDownload /> Download
                                                </a>
                                            </div>
                                        )}
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

export default StudentMaterialsPage;
