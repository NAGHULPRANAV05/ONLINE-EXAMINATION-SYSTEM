import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { subjectAPI, examAPI, questionAPI } from '../services/api';
import {
    FaClock, FaClipboardList, FaQuestionCircle, FaPlus, FaTrashAlt,
    FaToggleOn, FaToggleOff, FaBookOpen, FaStar, FaRocket, FaTimes
} from 'react-icons/fa';
import './ExamManagement.css';

function ExamManagement() {
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        duration: 60,
        difficulty: 'medium',
        questions: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [examsRes, subjectsRes, questionsRes] = await Promise.all([
                examAPI.getAll(),
                subjectAPI.getAll(),
                questionAPI.getAll()
            ]);
            setExams(examsRes.data.exams);
            setSubjects(subjectsRes.data.subjects);
            setQuestions(questionsRes.data.questions);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await examAPI.create(formData);
            setShowModal(false);
            setFormData({ title: '', description: '', subject: '', duration: 60, difficulty: 'medium', questions: [] });
            fetchData();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handlePublish = async (id, isActive) => {
        try {
            await examAPI.publish(id, !isActive);
            fetchData();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this exam?')) return;
        try {
            await examAPI.delete(id);
            fetchData();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const toggleQuestion = (qId) => {
        setFormData({
            ...formData,
            questions: formData.questions.includes(qId)
                ? formData.questions.filter(id => id !== qId)
                : [...formData.questions, qId]
        });
    };

    if (loading) return <LoadingSpinner />;

    const filteredQuestions = questions.filter(q => q.subject?._id === formData.subject);
    const activeExams = exams.filter(e => e.isActive).length;
    const totalMarks = exams.reduce((sum, e) => sum + (e.totalMarks || 0), 0);

    return (
        <div className="em-page">
            <Navbar />

            {/* Hero */}
            <div className="em-hero">
                <div className="em-hero-content">
                    <div>
                        <div className="em-hero-icon"><FaClipboardList /></div>
                        <h1>Exam Management</h1>
                        <p className="em-hero-sub">Create, publish and manage your examinations</p>
                        <div className="em-hero-stats">
                            <span className="em-hero-pill"><FaClipboardList /> {exams.length} Total</span>
                            <span className="em-hero-pill"><FaRocket /> {activeExams} Active</span>
                            <span className="em-hero-pill"><FaStar /> {totalMarks} Marks</span>
                        </div>
                    </div>
                    <button className="em-create-btn" onClick={() => setShowModal(true)}>
                        <FaPlus /> Create Exam
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="em-content">
                {exams.length === 0 ? (
                    <div className="em-empty">
                        <div className="em-empty-icon"><FaClipboardList /></div>
                        <h3>No exams yet</h3>
                        <p>Create your first exam to get started!</p>
                    </div>
                ) : (
                    <div className="em-grid">
                        {exams.map((exam) => (
                            <div key={exam._id} className="em-card">
                                {/* Accent bar */}
                                <div className={`em-card-accent ${exam.isActive ? 'active' : 'inactive'}`} />

                                {/* Badges */}
                                <div className="em-badges">
                                    <span className="em-badge subject">
                                        <FaBookOpen style={{ fontSize: '0.55rem' }} /> {exam.subject?.name}
                                    </span>
                                    <span className={`em-badge ${exam.difficulty}`}>{exam.difficulty}</span>
                                    <span className={`em-badge ${exam.isActive ? 'active-status' : 'inactive-status'}`}>
                                        <span className={`em-status-dot ${exam.isActive ? 'on' : 'off'}`} />
                                        {exam.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Title & desc */}
                                <h3 className="em-card-title">{exam.title}</h3>
                                <p className="em-card-desc">{exam.description}</p>

                                {/* Meta */}
                                <div className="em-meta">
                                    <span className="em-meta-item"><FaClock /> {exam.duration} min</span>
                                    <span className="em-meta-item"><FaStar /> {exam.totalMarks} marks</span>
                                    <span className="em-meta-item"><FaQuestionCircle /> {exam.questions?.length} questions</span>
                                </div>

                                {/* Actions */}
                                <div className="em-actions">
                                    <button
                                        className={`em-publish-btn ${exam.isActive ? 'unpublish' : 'publish'}`}
                                        onClick={() => handlePublish(exam._id, exam.isActive)}
                                    >
                                        {exam.isActive ? <><FaToggleOff /> Unpublish</> : <><FaToggleOn /> Publish</>}
                                    </button>
                                    <button className="em-del-btn" onClick={() => handleDelete(exam._id)}>
                                        <FaTrashAlt /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="em-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="em-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="em-modal-head">
                            <h2 className="em-modal-title">Create New Exam</h2>
                            <button className="em-modal-close" onClick={() => setShowModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="em-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Exam Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Midterm Python Exam"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of the exam..."
                                        required
                                    />
                                </div>

                                <div className="em-form-row2">
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <select
                                            className="form-select"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value, questions: [] })}
                                            required
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map((s) => (
                                                <option key={s._id} value={s._id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Duration (minutes)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Difficulty</label>
                                    <select
                                        className="form-select"
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                                {formData.subject && (
                                    <div className="form-group">
                                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Select Questions</span>
                                            <span className={`em-selected-count ${formData.questions.length > 0 ? 'has' : 'none'}`}>
                                                {formData.questions.length} selected
                                            </span>
                                        </label>
                                        <div className="em-q-list">
                                            {filteredQuestions.length === 0 ? (
                                                <p className="em-q-empty">No questions for this subject yet.</p>
                                            ) : (
                                                filteredQuestions.map((q) => (
                                                    <label
                                                        key={q._id}
                                                        className={`em-q-item ${formData.questions.includes(q._id) ? 'selected' : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="em-q-checkbox"
                                                            checked={formData.questions.includes(q._id)}
                                                            onChange={() => toggleQuestion(q._id)}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div className="em-q-text">{q.questionText}</div>
                                                            <div className="em-q-meta">
                                                                <span className={`em-q-type-badge ${q.type}`}>
                                                                    {q.type.toUpperCase()}
                                                                </span>
                                                                {q.marks} marks • {q.difficulty}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="em-modal-btns">
                                    <button type="submit" className="em-submit-btn" disabled={formData.questions.length === 0}>
                                        Create Exam
                                    </button>
                                    <button type="button" className="em-cancel-btn" onClick={() => setShowModal(false)}>
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

export default ExamManagement;
