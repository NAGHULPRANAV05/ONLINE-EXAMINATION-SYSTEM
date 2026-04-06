import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { subjectAPI, materialAPI } from '../services/api';
import {
    FaArrowLeft, FaUpload, FaEdit, FaTrash, FaFilePdf, FaFileWord,
    FaFilePowerpoint, FaFileArchive, FaFileAlt, FaTimes, FaPlus,
    FaFolderOpen, FaDownload, FaEye, FaYoutube, FaSearch, FaBook,
    FaCode, FaLayerGroup, FaCloudUploadAlt, FaCheckCircle
} from 'react-icons/fa';
import './SubjectManagement.css';

function SubjectManagement() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'theory',
        language: ''
    });

    // Materials state
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [uploadSubmitting, setUploadSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        department: '',
        yearSemester: '',
        materialType: 'file',
        file: null,
        youtubeUrl: ''
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await subjectAPI.getAll();
            setSubjects(response.data.subjects);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSubject) {
                await subjectAPI.update(editingSubject._id, formData);
            } else {
                await subjectAPI.create(formData);
            }
            setShowModal(false);
            setEditingSubject(null);
            setFormData({ name: '', description: '', category: 'theory', language: '' });
            fetchSubjects();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            description: subject.description,
            category: subject.category,
            language: subject.language || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;
        try {
            await subjectAPI.delete(id);
            fetchSubjects();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    // --- Materials functions ---
    const openSubjectMaterials = async (subject) => {
        setSelectedSubject(subject);
        setMaterialsLoading(true);
        try {
            const res = await materialAPI.getAll({ subjectName: subject.name });
            setMaterials(res.data.materials);
        } catch (err) {
            console.error('Error fetching materials:', err);
        } finally {
            setMaterialsLoading(false);
        }
    };

    const goBackToSubjects = () => {
        setSelectedSubject(null);
        setMaterials([]);
    };

    const resetUploadForm = () => {
        setUploadForm({ title: '', description: '', department: '', yearSemester: '', materialType: 'file', file: null, youtubeUrl: '' });
        setEditingMaterial(null);
        setUploadError('');
    };

    const openUploadModal = () => {
        resetUploadForm();
        setShowUploadModal(true);
    };

    const openEditMaterialModal = (material) => {
        setUploadForm({
            title: material.title,
            description: material.description,
            department: material.department,
            yearSemester: material.yearSemester,
            materialType: material.materialType || 'file',
            file: null,
            youtubeUrl: material.youtubeUrl || ''
        });
        setEditingMaterial(material);
        setShowUploadModal(true);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        setUploadSubmitting(true);
        setUploadError('');

        try {
            const data = new FormData();
            data.append('title', uploadForm.title);
            data.append('description', uploadForm.description);
            data.append('subjectName', selectedSubject.name);
            data.append('department', uploadForm.department);
            data.append('yearSemester', uploadForm.yearSemester);
            data.append('materialType', uploadForm.materialType);

            if (uploadForm.materialType === 'link') {
                if (!uploadForm.youtubeUrl) {
                    setUploadError('Please provide a YouTube URL');
                    setUploadSubmitting(false);
                    return;
                }
                // Ensure the URL always has https:// so browser doesn't treat it as a local path
                let ytUrl = uploadForm.youtubeUrl.trim();
                if (ytUrl && !/^https?:\/\//i.test(ytUrl)) {
                    ytUrl = 'https://' + ytUrl;
                }
                data.append('youtubeUrl', ytUrl);
            } else {
                if (uploadForm.file) {
                    data.append('file', uploadForm.file);
                } else if (!editingMaterial) {
                    setUploadError('Please select a file to upload');
                    setUploadSubmitting(false);
                    return;
                }
            }

            if (editingMaterial) {
                await materialAPI.update(editingMaterial._id, data);
            } else {
                await materialAPI.upload(data);
            }

            setShowUploadModal(false);
            resetUploadForm();
            openSubjectMaterials(selectedSubject);
        } catch (err) {
            setUploadError(err.response?.data?.message || 'An error occurred');
        } finally {
            setUploadSubmitting(false);
        }
    };

    const handleDeleteMaterial = async (id) => {
        if (!window.confirm('Are you sure you want to delete this material?')) return;
        try {
            await materialAPI.delete(id);
            openSubjectMaterials(selectedSubject);
        } catch (err) {
            console.error('Error deleting material:', err);
        }
    };

    const handleDownload = async (material) => {
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
        }
    };

    const getFileIconClass = (type) => {
        switch (type) {
            case 'pdf': return 'pdf';
            case 'doc': case 'docx': return 'doc';
            case 'ppt': case 'pptx': return 'ppt';
            case 'zip': return 'zip';
            default: return 'default';
        }
    };

    const getFileIconComponent = (type) => {
        switch (type) {
            case 'pdf': return <FaFilePdf />;
            case 'doc': case 'docx': return <FaFileWord />;
            case 'ppt': case 'pptx': return <FaFilePowerpoint />;
            case 'zip': return <FaFileArchive />;
            default: return <FaFileAlt />;
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

    // Filtered subjects
    const filteredSubjects = subjects.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterCategory === 'all' || s.category === filterCategory;
        return matchesSearch && matchesFilter;
    });

    const theoryCount = subjects.filter(s => s.category === 'theory').length;
    const programmingCount = subjects.filter(s => s.category === 'programming').length;

    if (loading) return <LoadingSpinner />;

    // =========================================
    // MATERIALS VIEW
    // =========================================
    if (selectedSubject) {
        return (
            <div className="sm-page">
                <Navbar />

                {/* Hero */}
                <div className="sm-materials-hero">
                    <div className="sm-hero-content">
                        <button onClick={goBackToSubjects} className="sm-back-btn">
                            <FaArrowLeft /> Back to Subjects
                        </button>

                        <div className="sm-hero-top">
                            <div>
                                <div className="sm-materials-title">
                                    <div className="sm-materials-title-icon">
                                        <FaFolderOpen />
                                    </div>
                                    {selectedSubject.name}
                                </div>
                                <p className="sm-materials-subtitle">
                                    Study materials &amp; resources — {materials.length} item{materials.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button className="sm-add-btn" onClick={openUploadModal}>
                                <FaPlus /> Add Material
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="sm-content">
                    {materialsLoading ? (
                        <LoadingSpinner />
                    ) : materials.length === 0 ? (
                        <div className="sm-mat-empty">
                            <div className="sm-mat-empty-icon">
                                <FaCloudUploadAlt />
                            </div>
                            <h3>No materials yet</h3>
                            <p>Click "Add Material" to upload notes, PDFs, or YouTube links for this subject.</p>
                        </div>
                    ) : (
                        <div className="sm-mat-grid">
                            {materials.map((material) => (
                                <div key={material._id} className="sm-mat-card">
                                    {/* Card top — icon + type */}
                                    <div className="sm-mat-card-top">
                                        {material.materialType === 'link' ? (
                                            <div className="sm-mat-icon youtube">
                                                <FaYoutube />
                                            </div>
                                        ) : (
                                            <div className={`sm-mat-icon ${getFileIconClass(material.fileType)}`}>
                                                {getFileIconComponent(material.fileType)}
                                            </div>
                                        )}
                                        <div className="sm-mat-type-info">
                                            <span className={`sm-mat-type-badge ${material.materialType === 'link' ? 'youtube-type' : 'file-type'}`}>
                                                {material.materialType === 'link' ? 'YouTube' : material.fileType?.toUpperCase()}
                                            </span>
                                            {material.fileSize && (
                                                <span className="sm-mat-size">{formatFileSize(material.fileSize)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title & desc */}
                                    <h4 className="sm-mat-card-title">{material.title}</h4>
                                    <p className="sm-mat-card-desc">{material.description}</p>

                                    {/* YouTube embed */}
                                    {material.materialType === 'link' && getYoutubeEmbedUrl(material.youtubeUrl) && (
                                        <div className="sm-youtube-embed">
                                            <iframe
                                                src={getYoutubeEmbedUrl(material.youtubeUrl)}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                title={material.title}
                                            />
                                        </div>
                                    )}

                                    {/* Tags */}
                                    <div className="sm-mat-tags">
                                        {material.department && <span className="sm-mat-tag dept">{material.department}</span>}
                                        {material.yearSemester && <span className="sm-mat-tag sem">{material.yearSemester}</span>}
                                    </div>

                                    {/* Footer */}
                                    <div className="sm-mat-card-bottom">
                                        <span className="sm-mat-date">
                                            {new Date(material.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="sm-mat-actions">
                                            {material.materialType === 'link' ? (
                                                <a href={material.youtubeUrl} target="_blank" rel="noopener noreferrer"
                                                    className="sm-mat-action-btn youtube-link" title="Open on YouTube">
                                                    <FaYoutube />
                                                </a>
                                            ) : (
                                                <>
                                                    <button className="sm-mat-action-btn view"
                                                        onClick={() => window.open(materialAPI.getViewUrl(material._id), '_blank')}
                                                        title="View">
                                                        <FaEye />
                                                    </button>
                                                    <button className="sm-mat-action-btn download"
                                                        onClick={() => handleDownload(material)}
                                                        title="Download">
                                                        <FaDownload />
                                                    </button>
                                                </>
                                            )}
                                            <button className="sm-mat-action-btn edit"
                                                onClick={() => openEditMaterialModal(material)} title="Edit">
                                                <FaEdit />
                                            </button>
                                            <button className="sm-mat-action-btn delete"
                                                onClick={() => handleDeleteMaterial(material._id)} title="Delete">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload / Edit Material Modal */}
                {showUploadModal && (
                    <div className="sm-modal-overlay" onClick={() => setShowUploadModal(false)}>
                        <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="sm-modal-header">
                                <h2>{editingMaterial ? '✏️ Edit Material' : '📤 Add Material'}</h2>
                                <button className="sm-modal-close" onClick={() => setShowUploadModal(false)}>
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="sm-modal-body">
                                <div className="sm-subject-badge-info">
                                    <FaFolderOpen /> Subject: <strong>{selectedSubject.name}</strong>
                                </div>

                                {/* Material type toggle */}
                                {!editingMaterial && (
                                    <div className="sm-type-toggle">
                                        <button
                                            type="button"
                                            onClick={() => setUploadForm({ ...uploadForm, materialType: 'file' })}
                                            className={`sm-type-toggle-btn ${uploadForm.materialType === 'file' ? 'active' : ''}`}
                                        >
                                            <FaUpload /> File Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUploadForm({ ...uploadForm, materialType: 'link' })}
                                            className={`sm-type-toggle-btn ${uploadForm.materialType === 'link' ? 'active youtube' : ''}`}
                                        >
                                            <FaYoutube /> YouTube Link
                                        </button>
                                    </div>
                                )}

                                {uploadError && (
                                    <div className="sm-error-msg">⚠️ {uploadError}</div>
                                )}

                                <form onSubmit={handleUploadSubmit}>
                                    <div className="sm-form-group">
                                        <label className="sm-form-label">Title *</label>
                                        <input type="text" className="sm-form-input"
                                            value={uploadForm.title}
                                            onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                            placeholder="e.g. Unit 1 — Introduction to Data Structures"
                                            required />
                                    </div>

                                    <div className="sm-form-group">
                                        <label className="sm-form-label">Description *</label>
                                        <textarea className="sm-form-textarea"
                                            value={uploadForm.description}
                                            onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                            placeholder="Brief description of the material"
                                            required />
                                    </div>

                                    <div className="sm-form-row">
                                        <div className="sm-form-group">
                                            <label className="sm-form-label">Department *</label>
                                            <input type="text" className="sm-form-input"
                                                value={uploadForm.department}
                                                onChange={(e) => setUploadForm({ ...uploadForm, department: e.target.value })}
                                                placeholder="e.g. Computer Science"
                                                required />
                                        </div>
                                        <div className="sm-form-group">
                                            <label className="sm-form-label">Year / Semester *</label>
                                            <select className="sm-form-select"
                                                value={uploadForm.yearSemester}
                                                onChange={(e) => setUploadForm({ ...uploadForm, yearSemester: e.target.value })}
                                                required>
                                                <option value="">Select</option>
                                                <option value="1st Year - Sem 1">1st Year - Sem 1</option>
                                                <option value="1st Year - Sem 2">1st Year - Sem 2</option>
                                                <option value="2nd Year - Sem 3">2nd Year - Sem 3</option>
                                                <option value="2nd Year - Sem 4">2nd Year - Sem 4</option>
                                                <option value="3rd Year - Sem 5">3rd Year - Sem 5</option>
                                                <option value="3rd Year - Sem 6">3rd Year - Sem 6</option>
                                                <option value="4th Year - Sem 7">4th Year - Sem 7</option>
                                                <option value="4th Year - Sem 8">4th Year - Sem 8</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* File or YouTube input */}
                                    {uploadForm.materialType === 'link' ? (
                                        <div className="sm-form-group">
                                            <label className="sm-form-label">
                                                <FaYoutube style={{ color: '#ef4444', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                                                YouTube URL *
                                            </label>
                                            <input type="url" className="sm-form-input"
                                                value={uploadForm.youtubeUrl}
                                                onChange={(e) => setUploadForm({ ...uploadForm, youtubeUrl: e.target.value })}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                required />
                                        </div>
                                    ) : (
                                        <div className="sm-form-group">
                                            <label className="sm-form-label">
                                                File {editingMaterial ? '(leave empty to keep current)' : '*'}
                                            </label>
                                            <div className="sm-file-drop" style={{ position: 'relative' }}>
                                                <div className="sm-file-drop-icon"><FaCloudUploadAlt /></div>
                                                <div className="sm-file-drop-text">
                                                    Click to browse or drag & drop
                                                </div>
                                                <div className="sm-file-drop-hint">
                                                    PDF, DOC, DOCX, PPT, PPTX, ZIP (max 50 MB)
                                                </div>
                                                <input type="file"
                                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                                />
                                            </div>
                                            {uploadForm.file && (
                                                <div className="sm-file-selected">
                                                    <FaCheckCircle /> {uploadForm.file.name}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="sm-modal-actions">
                                        <button type="submit" className="sm-btn sm-btn-primary" disabled={uploadSubmitting}>
                                            {uploadSubmitting
                                                ? 'Saving...'
                                                : (editingMaterial
                                                    ? 'Update Material'
                                                    : (uploadForm.materialType === 'link' ? 'Add YouTube Link' : 'Upload File')
                                                )}
                                        </button>
                                        <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setShowUploadModal(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // =========================================
    // SUBJECTS LIST VIEW
    // =========================================
    return (
        <div className="sm-page">
            <Navbar />

            {/* Hero Header */}
            <div className="sm-hero">
                <div className="sm-hero-content">
                    <div className="sm-hero-top">
                        <div>
                            <div className="sm-hero-icon">
                                <FaLayerGroup />
                            </div>
                            <h1>Subject Management</h1>
                            <p>Organize subjects and manage study materials in one place</p>

                            <div className="sm-stats-bar">
                                <div className="sm-stat-chip">
                                    <FaBook /> {subjects.length} Total Subjects
                                </div>
                                <div className="sm-stat-chip">
                                    <FaBook /> {theoryCount} Theory
                                </div>
                                <div className="sm-stat-chip">
                                    <FaCode /> {programmingCount} Programming
                                </div>
                            </div>
                        </div>
                        <button className="sm-add-btn" onClick={() => {
                            setEditingSubject(null);
                            setFormData({ name: '', description: '', category: 'theory', language: '' });
                            setShowModal(true);
                        }}>
                            <FaPlus /> Add Subject
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="sm-content">
                {/* Search & Filters */}
                <div className="sm-search-bar">
                    <FaSearch className="sm-search-icon" />
                    <input
                        type="text"
                        placeholder="Search subjects by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="sm-filter-chips">
                        <span
                            className={`sm-filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('all')}
                        >All</span>
                        <span
                            className={`sm-filter-chip ${filterCategory === 'theory' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('theory')}
                        >Theory</span>
                        <span
                            className={`sm-filter-chip ${filterCategory === 'programming' ? 'active' : ''}`}
                            onClick={() => setFilterCategory('programming')}
                        >Programming</span>
                    </div>
                </div>

                {/* Subject cards */}
                {filteredSubjects.length === 0 ? (
                    <div className="sm-empty">
                        <div className="sm-empty-icon">
                            <FaLayerGroup />
                        </div>
                        <h3>{searchQuery || filterCategory !== 'all' ? 'No matching subjects' : 'No subjects yet'}</h3>
                        <p>{searchQuery || filterCategory !== 'all'
                            ? 'Try adjusting your search or filter criteria.'
                            : 'Get started by adding your first subject!'
                        }</p>
                    </div>
                ) : (
                    <div className="sm-grid">
                        {filteredSubjects.map((subject) => (
                            <div key={subject._id} className="sm-card">
                                {/* Card header */}
                                <div className="sm-card-header">
                                    <div className="sm-card-badges">
                                        <span className={`sm-badge ${subject.category === 'programming' ? 'sm-badge-programming' : 'sm-badge-theory'}`}>
                                            {subject.category === 'programming' ? <><FaCode style={{ marginRight: 4, fontSize: '0.65rem' }} /> Programming</> : <><FaBook style={{ marginRight: 4, fontSize: '0.65rem' }} /> Theory</>}
                                        </span>
                                        {subject.language && (
                                            <span className="sm-badge sm-badge-lang">{subject.language}</span>
                                        )}
                                    </div>
                                    <div className="sm-card-actions-mini">
                                        <button className="sm-action-btn" onClick={() => handleEdit(subject)} title="Edit">
                                            <FaEdit />
                                        </button>
                                        <button className="sm-action-btn danger" onClick={() => handleDelete(subject._id)} title="Delete">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                {/* Title & description */}
                                <h3 className="sm-card-title">{subject.name}</h3>
                                <p className="sm-card-desc">{subject.description}</p>

                                {/* Footer */}
                                <div className="sm-card-footer">
                                    <button className="sm-materials-btn" onClick={() => openSubjectMaterials(subject)}>
                                        <FaFolderOpen /> View Materials
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Subject Add/Edit Modal */}
            {showModal && (
                <div className="sm-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sm-modal-header">
                            <h2>{editingSubject ? '✏️ Edit Subject' : '📚 Add Subject'}</h2>
                            <button className="sm-modal-close" onClick={() => setShowModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="sm-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Subject Name</label>
                                    <input type="text" className="sm-form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Data Structures & Algorithms"
                                        required />
                                </div>
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Description</label>
                                    <textarea className="sm-form-textarea"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief overview of what this subject covers"
                                        required />
                                </div>
                                <div className="sm-form-group">
                                    <label className="sm-form-label">Category</label>
                                    <select className="sm-form-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="theory">📖 Theory</option>
                                        <option value="programming">💻 Programming</option>
                                    </select>
                                </div>
                                {formData.category === 'programming' && (
                                    <div className="sm-form-group">
                                        <label className="sm-form-label">Programming Language</label>
                                        <select className="sm-form-select"
                                            value={formData.language}
                                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                            required>
                                            <option value="">Select Language</option>
                                            <option value="c">C</option>
                                            <option value="cpp">C++</option>
                                            <option value="java">Java</option>
                                            <option value="python">Python</option>
                                        </select>
                                    </div>
                                )}
                                <div className="sm-modal-actions">
                                    <button type="submit" className="sm-btn sm-btn-primary">
                                        {editingSubject ? 'Update Subject' : 'Create Subject'}
                                    </button>
                                    <button type="button" className="sm-btn sm-btn-ghost" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubjectManagement;
