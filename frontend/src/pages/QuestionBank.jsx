import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import { subjectAPI, questionAPI } from '../services/api';
import {
    FaRobot, FaPlus, FaTrashAlt, FaTimes, FaQuestionCircle,
    FaCode, FaListUl, FaBookOpen, FaStar, FaCheckCircle, FaSearch,
    FaArrowLeft, FaChevronRight, FaFilter
} from 'react-icons/fa';
import './QuestionBank.css';

function QuestionBank() {
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [showAIGenerator, setShowAIGenerator] = useState(false);

    // Search and filter states
    const [subjectSearch, setSubjectSearch] = useState('');
    const [questionSearch, setQuestionSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'mcq' | 'coding'
    const [diffFilter, setDiffFilter] = useState('all'); // 'all' | 'easy' | 'medium' | 'hard'

    const [formData, setFormData] = useState({
        type: 'mcq',
        subject: '',
        difficulty: 'medium',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        testCases: [{ input: '', output: '' }],
        marks: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [questionsRes, subjectsRes] = await Promise.all([
                questionAPI.getAll(),
                subjectAPI.getAll()
            ]);
            setQuestions(questionsRes.data.questions || []);
            setSubjects(subjectsRes.data.subjects || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Aggregate stats per subject
    const subjectStatsMap = useMemo(() => {
        const stats = {};
        subjects.forEach(s => {
            stats[s._id] = { total: 0, mcq: 0, coding: 0 };
        });

        questions.forEach(q => {
            const sId = q.subject?._id || q.subject;
            if (sId && stats[sId]) {
                stats[sId].total += 1;
                if (q.type === 'mcq') stats[sId].mcq += 1;
                if (q.type === 'coding') stats[sId].coding += 1;
            }
        });

        return stats;
    }, [subjects, questions]);

    // Selected subject object
    const selectedSubject = useMemo(() => {
        if (!selectedSubjectId) return null;
        return subjects.find(s => s._id === selectedSubjectId) || null;
    }, [subjects, selectedSubjectId]);

    // Filtered subjects in directory view
    const filteredSubjects = useMemo(() => {
        if (!subjectSearch.trim()) return subjects;
        const q = subjectSearch.toLowerCase();
        return subjects.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.code || '').toLowerCase().includes(q) ||
            (s.description || '').toLowerCase().includes(q)
        );
    }, [subjects, subjectSearch]);

    // Filtered questions for the selected subject
    const subjectQuestions = useMemo(() => {
        if (!selectedSubjectId) return [];
        return questions.filter(q => {
            const sId = q.subject?._id || q.subject;
            if (sId !== selectedSubjectId) return false;

            const matchesSearch = !questionSearch.trim() ||
                q.questionText.toLowerCase().includes(questionSearch.toLowerCase());

            const matchesType = typeFilter === 'all' || q.type === typeFilter;
            const matchesDiff = diffFilter === 'all' || q.difficulty === diffFilter;

            return matchesSearch && matchesType && matchesDiff;
        });
    }, [questions, selectedSubjectId, questionSearch, typeFilter, diffFilter]);

    const handleOpenAddModal = (preselectedSubjectId) => {
        setFormData({
            type: 'mcq',
            subject: preselectedSubjectId || selectedSubjectId || (subjects[0]?._id || ''),
            difficulty: 'medium',
            questionText: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            testCases: [{ input: '', output: '' }],
            marks: 1
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await questionAPI.create(formData);
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'mcq',
            subject: selectedSubjectId || '',
            difficulty: 'medium',
            questionText: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            testCases: [{ input: '', output: '' }],
            marks: 1
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await questionAPI.delete(id);
            fetchData();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="qb-page-simple">
            <Navbar />

            {/* Simple Clean Top Header */}
            <div className="qb-header-bar">
                <div className="qb-container">
                    <div className="qb-header-flex">
                        <div>
                            {selectedSubject ? (
                                <div className="qb-nav-breadcrumb">
                                    <button
                                        type="button"
                                        className="btn-back-link"
                                        onClick={() => {
                                            setSelectedSubjectId(null);
                                            setQuestionSearch('');
                                            setTypeFilter('all');
                                            setDiffFilter('all');
                                        }}
                                    >
                                        <FaArrowLeft /> All Subjects
                                    </button>
                                    <span className="breadcrumb-sep">/</span>
                                    <span className="breadcrumb-current">{selectedSubject.name}</span>
                                </div>
                            ) : (
                                <>
                                    <h1 className="qb-title">Question Bank</h1>
                                    <p className="qb-subtitle">Select a subject to view and manage its question repository</p>
                                </>
                            )}
                        </div>

                        <div className="qb-header-actions">
                            <button
                                type="button"
                                className="btn-simple-ai"
                                onClick={() => setShowAIGenerator(true)}
                            >
                                <FaRobot /> Generate with AI
                            </button>
                            <button
                                type="button"
                                className="btn-simple-add"
                                onClick={() => handleOpenAddModal(selectedSubjectId)}
                            >
                                <FaPlus /> Add Question
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="qb-container qb-body-wrap">

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 1: SIMPLE SUBJECT DIRECTORY (Default)
                   ════════════════════════════════════════════════════════════════════════ */}
                {!selectedSubject && (
                    <>
                        {/* Search and Summary Row */}
                        <div className="qb-toolbar-row">
                            <div className="qb-search-input-wrap">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search subject by name..."
                                    value={subjectSearch}
                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                />
                                {subjectSearch && (
                                    <button
                                        type="button"
                                        className="btn-clear-x"
                                        onClick={() => setSubjectSearch('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            <span className="qb-count-label">
                                {subjects.length} Subjects • {questions.length} Total Questions
                            </span>
                        </div>

                        {/* Subject Cards Grid */}
                        {filteredSubjects.length === 0 ? (
                            <div className="qb-empty-box">
                                <FaQuestionCircle className="empty-icon" />
                                <h3>No subjects found</h3>
                                <p>Create subjects in Subject Management to start adding questions.</p>
                            </div>
                        ) : (
                            <div className="qb-card-grid">
                                {filteredSubjects.map((subject) => {
                                    const stats = subjectStatsMap[subject._id] || { total: 0, mcq: 0, coding: 0 };
                                    const isCode = subject.type === 'coding' || subject.language;

                                    return (
                                        <div
                                            key={subject._id}
                                            className="qb-item-card"
                                            onClick={() => setSelectedSubjectId(subject._id)}
                                        >
                                            <div className="qb-card-header">
                                                <div className={`qb-card-icon ${isCode ? 'code' : 'mcq'}`}>
                                                    {isCode ? <FaCode /> : <FaBookOpen />}
                                                </div>
                                                <span className="qb-card-tag">
                                                    {subject.language ? subject.language.toUpperCase() : (subject.type || 'MCQ').toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="qb-card-info">
                                                <h3 className="qb-card-title">{subject.name}</h3>
                                                <p className="qb-card-desc">
                                                    {subject.description || 'Subject question repository.'}
                                                </p>
                                            </div>

                                            <div className="qb-card-stats-row">
                                                <span className="qb-stat-pill total">
                                                    {stats.total} Questions
                                                </span>
                                                <span className="qb-stat-pill sub">
                                                    {stats.mcq} MCQ
                                                </span>
                                                <span className="qb-stat-pill sub">
                                                    {stats.coding} Coding
                                                </span>
                                            </div>

                                            <div className="qb-card-bottom">
                                                <span className="qb-enter-text">
                                                    Open Questions <FaChevronRight className="enter-arrow" />
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 2: INSIDE SUBJECT QUESTIONS (Clean & Simple)
                   ════════════════════════════════════════════════════════════════════════ */}
                {selectedSubject && (
                    <div className="qb-detail-container">

                        {/* Subject Top Banner */}
                        <div className="qb-subject-banner">
                            <div className="banner-left">
                                <h2>{selectedSubject.name}</h2>
                                <p>{selectedSubject.description || 'Subject questions collection'}</p>
                            </div>

                            <div className="banner-right">
                                <div className="banner-stats">
                                    <div className="b-stat">
                                        <span className="b-num">{subjectStatsMap[selectedSubject._id]?.total || 0}</span>
                                        <span className="b-lbl">Total</span>
                                    </div>
                                    <div className="b-stat">
                                        <span className="b-num">{subjectStatsMap[selectedSubject._id]?.mcq || 0}</span>
                                        <span className="b-lbl">MCQs</span>
                                    </div>
                                    <div className="b-stat">
                                        <span className="b-num">{subjectStatsMap[selectedSubject._id]?.coding || 0}</span>
                                        <span className="b-lbl">Coding</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filter and Search Bar */}
                        <div className="qb-filter-bar">
                            <div className="filter-group">
                                <button
                                    type="button"
                                    className={`btn-filter ${typeFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('all')}
                                >
                                    All ({subjectStatsMap[selectedSubject._id]?.total || 0})
                                </button>
                                <button
                                    type="button"
                                    className={`btn-filter ${typeFilter === 'mcq' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('mcq')}
                                >
                                    MCQ ({subjectStatsMap[selectedSubject._id]?.mcq || 0})
                                </button>
                                <button
                                    type="button"
                                    className={`btn-filter ${typeFilter === 'coding' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('coding')}
                                >
                                    Coding ({subjectStatsMap[selectedSubject._id]?.coding || 0})
                                </button>
                            </div>

                            <div className="filter-right">
                                <div className="select-wrap">
                                    <FaFilter className="sel-icon" />
                                    <select
                                        value={diffFilter}
                                        onChange={(e) => setDiffFilter(e.target.value)}
                                        className="simple-select"
                                    >
                                        <option value="all">All Difficulties</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                                <div className="search-wrap-sm">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={questionSearch}
                                        onChange={(e) => setQuestionSearch(e.target.value)}
                                    />
                                    {questionSearch && (
                                        <button
                                            type="button"
                                            className="btn-clear-x"
                                            onClick={() => setQuestionSearch('')}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Question Cards Grid */}
                        {subjectQuestions.length === 0 ? (
                            <div className="qb-empty-box">
                                <FaQuestionCircle className="empty-icon" />
                                <h3>No questions found in {selectedSubject.name}</h3>
                                <p>Click "Add Question" to create your first question or "Generate with AI".</p>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        className="btn-simple-add"
                                        onClick={() => handleOpenAddModal(selectedSubject._id)}
                                    >
                                        <FaPlus /> Add Question
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-simple-ai"
                                        onClick={() => setShowAIGenerator(true)}
                                    >
                                        <FaRobot /> Generate with AI
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="qb-questions-grid">
                                {subjectQuestions.map((question, idx) => (
                                    <div key={question._id} className="qb-q-card">
                                        <div className="qb-q-card-top">
                                            <div className="q-badge-row">
                                                <span className="q-index-pill">Q{idx + 1}</span>
                                                <span className={`q-type-tag ${question.type}`}>
                                                    {question.type === 'mcq' ? <FaListUl /> : <FaCode />}
                                                    {question.type.toUpperCase()}
                                                </span>
                                                <span className={`q-diff-tag ${question.difficulty}`}>
                                                    {question.difficulty}
                                                </span>
                                            </div>
                                            <span className="q-marks-pill">
                                                <FaStar /> {question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}
                                            </span>
                                        </div>

                                        <div className="qb-q-text">
                                            {question.questionText}
                                        </div>

                                        {/* MCQ options preview */}
                                        {question.type === 'mcq' && question.options && (
                                            <div className="qb-q-options">
                                                {question.options.map((opt, i) => {
                                                    const letter = String.fromCharCode(65 + i);
                                                    const isCorrect = question.correctAnswer === letter;
                                                    return (
                                                        <div key={i} className={`qb-q-opt-row ${isCorrect ? 'correct' : ''}`}>
                                                            <span className="opt-letter">{letter}</span>
                                                            <span className="opt-text">{opt}</span>
                                                            {isCorrect && (
                                                                <span className="opt-correct-chip">Correct</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Coding test cases preview */}
                                        {question.type === 'coding' && question.testCases && (
                                            <div className="qb-q-code-summary">
                                                <FaCode /> {question.testCases.length} test case{question.testCases.length !== 1 ? 's' : ''} configured
                                            </div>
                                        )}

                                        <div className="qb-q-footer">
                                            <span className="q-footer-subj">{selectedSubject.name}</span>
                                            <button
                                                type="button"
                                                className="btn-q-delete"
                                                onClick={() => handleDelete(question._id)}
                                                title="Delete question"
                                            >
                                                <FaTrashAlt /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Question Modal */}
            {showModal && (
                <div className="qb-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="qb-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="qb-modal-header">
                            <div>
                                <h2 className="modal-title">Add New Question</h2>
                                {selectedSubject && (
                                    <span className="modal-subtag">Subject: {selectedSubject.name}</span>
                                )}
                            </div>
                            <button
                                type="button"
                                className="btn-modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="qb-modal-body">
                            <form onSubmit={handleSubmit}>
                                {/* Type selector */}
                                <div className="modal-type-row">
                                    <button
                                        type="button"
                                        className={`btn-type-tab ${formData.type === 'mcq' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'mcq' })}
                                    >
                                        <FaListUl /> Multiple Choice (MCQ)
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn-type-tab ${formData.type === 'coding' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'coding' })}
                                    >
                                        <FaCode /> Coding Problem
                                    </button>
                                </div>

                                <div className="modal-form-grid">
                                    <div className="form-group">
                                        <label className="form-lbl">Subject</label>
                                        <select
                                            className="form-control"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map((s) => (
                                                <option key={s._id} value={s._id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-lbl">Difficulty</label>
                                        <select
                                            className="form-control"
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-lbl">Marks</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.marks}
                                            onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-lbl">Question Statement</label>
                                    <textarea
                                        className="form-control textarea"
                                        placeholder="Enter the question or problem statement..."
                                        value={formData.questionText}
                                        onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                        required
                                        rows={3}
                                    />
                                </div>

                                {formData.type === 'mcq' ? (
                                    <div className="mcq-options-container">
                                        <label className="form-lbl">Options & Correct Answer</label>
                                        <div className="mcq-options-grid">
                                            {formData.options.map((opt, i) => (
                                                <div key={i} className="mcq-opt-input-row">
                                                    <span className="opt-badge">{String.fromCharCode(65 + i)}</span>
                                                    <input
                                                        type="text"
                                                        className="form-control opt-input"
                                                        placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...formData.options];
                                                            newOpts[i] = e.target.value;
                                                            setFormData({ ...formData, options: newOpts });
                                                        }}
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="form-group" style={{ marginTop: '0.75rem' }}>
                                            <label className="form-lbl">Select Correct Option</label>
                                            <select
                                                className="form-control"
                                                value={formData.correctAnswer}
                                                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                                required
                                            >
                                                <option value="">Choose Correct Option</option>
                                                <option value="A">Option A</option>
                                                <option value="B">Option B</option>
                                                <option value="C">Option C</option>
                                                <option value="D">Option D</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="coding-cases-container">
                                        <label className="form-lbl">Test Cases</label>
                                        {formData.testCases.map((tc, i) => (
                                            <div key={i} className="tc-box">
                                                <div className="tc-header">
                                                    <span>Test Case #{i + 1}</span>
                                                    {formData.testCases.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="btn-tc-remove"
                                                            onClick={() => {
                                                                const filtered = formData.testCases.filter((_, idx) => idx !== i);
                                                                setFormData({ ...formData, testCases: filtered });
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="tc-grid">
                                                    <div className="form-group">
                                                        <label className="form-lbl-sub">Standard Input (stdin)</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="e.g. 5 10"
                                                            value={tc.input}
                                                            onChange={(e) => {
                                                                const newTCs = [...formData.testCases];
                                                                newTCs[i].input = e.target.value;
                                                                setFormData({ ...formData, testCases: newTCs });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-lbl-sub">Expected Output</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="e.g. 15"
                                                            value={tc.output}
                                                            onChange={(e) => {
                                                                const newTCs = [...formData.testCases];
                                                                newTCs[i].output = e.target.value;
                                                                setFormData({ ...formData, testCases: newTCs });
                                                            }}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            className="btn-add-tc"
                                            onClick={() => setFormData({ ...formData, testCases: [...formData.testCases, { input: '', output: '' }] })}
                                        >
                                            + Add Test Case
                                        </button>
                                    </div>
                                )}

                                <div className="modal-actions-row">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-save">
                                        Save Question
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Generator Modal */}
            {showAIGenerator && (
                <AIQuestionGenerator
                    subjects={subjects}
                    defaultSubjectId={selectedSubjectId}
                    onQuestionsGenerated={fetchData}
                    onClose={() => setShowAIGenerator(false)}
                />
            )}
        </div>
    );
}

export default QuestionBank;
