import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { materialAPI } from '../services/api';
import { FaFileAlt, FaUpload, FaEdit, FaTrash, FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileArchive, FaTimes, FaPlus } from 'react-icons/fa';

function StudyMaterialManagement() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subjectName: '',
        department: '',
        yearSemester: '',
        file: null
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

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

    const resetForm = () => {
        setFormData({ title: '', description: '', subjectName: '', department: '', yearSemester: '', file: null });
        setEditingMaterial(null);
        setError('');
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (material) => {
        setFormData({
            title: material.title,
            description: material.description,
            subjectName: material.subjectName,
            department: material.department,
            yearSemester: material.yearSemester,
            file: null
        });
        setEditingMaterial(material);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('subjectName', formData.subjectName);
            data.append('department', formData.department);
            data.append('yearSemester', formData.yearSemester);
            if (formData.file) {
                data.append('file', formData.file);
            }

            if (editingMaterial) {
                await materialAPI.update(editingMaterial._id, data);
            } else {
                if (!formData.file) {
                    setError('Please select a file to upload');
                    setSubmitting(false);
                    return;
                }
                await materialAPI.upload(data);
            }

            setShowModal(false);
            resetForm();
            fetchMaterials();
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this material?')) return;
        try {
            await materialAPI.delete(id);
            fetchMaterials();
        } catch (err) {
            console.error('Error deleting material:', err);
        }
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf': return <FaFilePdf style={{ color: '#ef4444' }} />;
            case 'doc': case 'docx': return <FaFileWord style={{ color: '#2563eb' }} />;
            case 'ppt': case 'pptx': return <FaFilePowerpoint style={{ color: '#f59e0b' }} />;
            case 'zip': return <FaFileArchive style={{ color: '#8b5cf6' }} />;
            default: return <FaFileAlt style={{ color: '#64748b' }} />;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    if (loading) return <LoadingSpinner />;

    return (
        <>
            <Navbar />
            <div className="container" style={{ padding: '2rem 0' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h1><FaFileAlt style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Study Materials</h1>
                        <p style={{ color: '#64748b' }}>Upload and manage study materials for students.</p>
                    </div>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <FaPlus /> Upload Material
                    </button>
                </div>

                {materials.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <FaUpload style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
                        <h3>No materials uploaded yet</h3>
                        <p style={{ color: '#64748b' }}>Click "Upload Material" to add your first study material.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>File</th>
                                    <th>Title</th>
                                    <th>Subject</th>
                                    <th>Department</th>
                                    <th>Year/Sem</th>
                                    <th>Size</th>
                                    <th>Uploaded</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map((material) => (
                                    <tr key={material._id}>
                                        <td style={{ fontSize: '1.25rem' }}>{getFileIcon(material.fileType)}</td>
                                        <td>
                                            <strong>{material.title}</strong>
                                            <br />
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{material.fileName}</span>
                                        </td>
                                        <td><span className="badge badge-primary">{material.subjectName}</span></td>
                                        <td>{material.department}</td>
                                        <td>{material.yearSemester}</td>
                                        <td>{formatFileSize(material.fileSize)}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {new Date(material.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => openEditModal(material)}
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(material._id)}
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ marginBottom: 0 }}>
                                {editingMaterial ? 'Edit Material' : 'Upload Material'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                                padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Data Structures Notes Chapter 1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the material"
                                    required
                                    style={{ minHeight: '80px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Subject Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.subjectName}
                                        onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                                        placeholder="e.g. Data Structures"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Department *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. Computer Science"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Year / Semester *</label>
                                <select
                                    className="form-select"
                                    value={formData.yearSemester}
                                    onChange={(e) => setFormData({ ...formData, yearSemester: e.target.value })}
                                    required
                                >
                                    <option value="">Select Year/Semester</option>
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

                            <div className="form-group">
                                <label className="form-label">
                                    File {editingMaterial ? '(leave empty to keep current file)' : '*'}
                                </label>
                                <input
                                    type="file"
                                    className="form-input"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    style={{ padding: '0.5rem' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Accepted: PDF, DOC, DOCX, PPT, PPTX, ZIP (max 50 MB)
                                </span>
                            </div>

                            <div className="flex gap-sm" style={{ marginTop: '1.5rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                                    {submitting ? 'Uploading...' : (editingMaterial ? 'Update Material' : 'Upload Material')}
                                </button>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default StudyMaterialManagement;
