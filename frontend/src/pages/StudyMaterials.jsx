import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { materialAPI } from '../services/api';
import { FaBookReader, FaDownload, FaSearch, FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileArchive, FaFileAlt, FaCalendarAlt, FaBuilding, FaBookOpen } from 'react-icons/fa';

function StudyMaterials() {
    const [materials, setMaterials] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [materials, searchTerm, filterDept, filterYear]);

    const fetchMaterials = async () => {
        try {
            const res = await materialAPI.getAll();
            setMaterials(res.data.materials);
        } catch (err) {
            console.error('Error fetching materials:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...materials];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(m =>
                m.title.toLowerCase().includes(term) ||
                m.subjectName.toLowerCase().includes(term) ||
                m.description.toLowerCase().includes(term)
            );
        }
        if (filterDept) {
            result = result.filter(m => m.department === filterDept);
        }
        if (filterYear) {
            result = result.filter(m => m.yearSemester === filterYear);
        }
        setFiltered(result);
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
            console.error('Error downloading material:', err);
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
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const departments = [...new Set(materials.map(m => m.department))];
    const years = [...new Set(materials.map(m => m.yearSemester))];

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <Navbar />
            <div className="container" style={{ padding: '2rem 0' }}>
                <h1><FaBookReader style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Study Materials</h1>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                    Browse and download study materials shared by your faculty.
                </p>

                {/* Filters */}
                <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label className="form-label" style={{ marginBottom: '0.3rem' }}>
                                <FaSearch style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Search
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by title or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="form-label" style={{ marginBottom: '0.3rem' }}>
                                <FaBuilding style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Department
                            </label>
                            <select
                                className="form-select"
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label" style={{ marginBottom: '0.3rem' }}>
                                <FaCalendarAlt style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Year/Semester
                            </label>
                            <select
                                className="form-select"
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                            >
                                <option value="">All Years</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results count */}
                <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Showing {filtered.length} of {materials.length} materials
                </p>

                {/* Materials Grid */}
                {filtered.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <FaBookOpen style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
                        <h3>No materials found</h3>
                        <p style={{ color: '#64748b' }}>
                            {materials.length === 0
                                ? 'No study materials have been uploaded yet.'
                                : 'Try adjusting your search or filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-2">
                        {filtered.map((material) => (
                            <div key={material._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div className="flex items-center gap-sm" style={{ marginBottom: '0.75rem' }}>
                                        {getFileIcon(material.fileType)}
                                        <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                            {material.fileType}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 'auto' }}>
                                            {formatFileSize(material.fileSize)}
                                        </span>
                                    </div>

                                    <h3 style={{ marginBottom: '0.5rem' }}>{material.title}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                        {material.description}
                                    </p>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <span className="badge badge-primary">
                                            <FaBookOpen style={{ marginRight: '0.25rem', verticalAlign: 'middle', fontSize: '0.7rem' }} />
                                            {material.subjectName}
                                        </span>
                                        <span className="badge badge-warning">
                                            <FaBuilding style={{ marginRight: '0.25rem', verticalAlign: 'middle', fontSize: '0.7rem' }} />
                                            {material.department}
                                        </span>
                                        <span className="badge badge-success">
                                            <FaCalendarAlt style={{ marginRight: '0.25rem', verticalAlign: 'middle', fontSize: '0.7rem' }} />
                                            {material.yearSemester}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between" style={{ paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        {new Date(material.createdAt).toLocaleDateString()}
                                        {material.uploadedBy?.name && ` • ${material.uploadedBy.name}`}
                                    </span>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleDownload(material)}
                                        disabled={downloading === material._id}
                                    >
                                        <FaDownload />
                                        {downloading === material._id ? 'Downloading...' : 'Download'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default StudyMaterials;
