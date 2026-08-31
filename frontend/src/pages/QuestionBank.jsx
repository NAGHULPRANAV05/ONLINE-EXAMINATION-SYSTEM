import { useState, useEffect, useMemo } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import { subjectAPI, questionAPI } from '../services/api';
import {
    FaRobot, FaPlus, FaTrashAlt, FaTimes, FaQuestionCircle,
    FaCode, FaListUl, FaBookOpen, FaStar, FaCheckCircle, FaSearch,
    FaArrowLeft, FaChevronRight, FaFilter, FaLayerGroup
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

    const default6TestCases = [
        { input: '', output: '', isHidden: false },
        { input: '', output: '', isHidden: false },
        { input: '', output: '', isHidden: true },
        { input: '', output: '', isHidden: true },
        { input: '', output: '', isHidden: true },
        { input: '', output: '', isHidden: true }
    ];

    const [formData, setFormData] = useState({
        type: 'mcq',
        subject: '',
        difficulty: 'medium',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        testCases: default6TestCases,
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
            testCases: [
                { input: '', output: '', isHidden: false },
                { input: '', output: '', isHidden: false },
                { input: '', output: '', isHidden: true },
                { input: '', output: '', isHidden: true },
                { input: '', output: '', isHidden: true },
                { input: '', output: '', isHidden: true }
            ],
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
            testCases: [
                { input: '', output: '', isHidden: false },
                { input: '', output: '', isHidden: false },
                { input: '', output: '', isHidden: true },
                { input: '', output: '', isHidden: true },
                { input: '', output: '', isHidden: true },
                { input: '', output: '', isHidden: true }
            ],
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

    const totalMCQs = questions.filter(q => q.type === 'mcq').length;
    const totalCoding = questions.filter(q => q.type === 'coding').length;

    return (
        <div className="qb-page">
            {/* Standard Hero Banner */}
            <div className="qb-hero">
                <div className="qb-hero-content">
                    <div className="qb-hero-left">
                        <div className="qb-hero-icon">
                            <FaQuestionCircle />
                        </div>
                        <h1>
                            {selectedSubject
                                ? `${selectedSubject.name} — Question Bank`
                                : 'Question Bank'}
                        </h1>
                        <p className="qb-hero-sub">
                            {selectedSubject
                                ? `Manage, add, and generate questions specifically for ${selectedSubject.name}`
                                : 'Organized repository of questions categorized by subject for examination creation'}
                        </p>
                        <div className="qb-hero-stats">
                            <span className="qb-hero-pill"><FaLayerGroup /> {subjects.length} Subjects</span>
                            <span className="qb-hero-pill"><FaQuestionCircle /> {questions.length} Questions</span>
                            <span className="qb-hero-pill"><FaListUl /> {totalMCQs} MCQs</span>
                            <span className="qb-hero-pill"><FaCode /> {totalCoding} Coding</span>
                        </div>
                    </div>

                    <div className="qb-hero-btns">
                        <button
                            type="button"
                            className="qb-hero-btn ai"
                            onClick={() => setShowAIGenerator(true)}
                        >
                            <FaRobot /> Generate with AI
                        </button>
                        <button
                            type="button"
                            className="qb-hero-btn add"
                            onClick={() => handleOpenAddModal(selectedSubjectId)}
                        >
                            <FaPlus /> Add Question
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="qb-content">

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 1: SUBJECT DIRECTORY (Select Subject)
                   ════════════════════════════════════════════════════════════════════════ */}
                {!selectedSubject && (
                    <>
                        <div className="qb-section-head-split">
                            <div className="qb-section-head">
                                <div className="qb-section-icon"><FaBookOpen /></div>
                                <div>
                                    <h2 className="qb-section-title">Select Subject</h2>
                                    <p className="qb-section-subtitle">Choose a subject to manage its question repository</p>
                                </div>
                            </div>

                            <div className="qb-search-box">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search subject by name or code..."
                                    value={subjectSearch}
                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                />
                                {subjectSearch && (
                                    <button
                                        type="button"
                                        className="btn-clear-search"
                                        onClick={() => setSubjectSearch('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Subject Cards Grid */}
                        {filteredSubjects.length === 0 ? (
                            <div className="qb-empty-card">
                                <div className="qb-empty-icon"><FaBookOpen /></div>
                                <h3>No subjects found</h3>
                                <p>Create subjects in Subject Management first to organize your questions.</p>
                            </div>
                        ) : (
                            <div className="qb-subject-grid">
                                {filteredSubjects.map((subject) => {
                                    const stats = subjectStatsMap[subject._id] || { total: 0, mcq: 0, coding: 0 };
                                    const isCode = subject.type === 'coding' || subject.language;

                                    return (
                                        <div
                                            key={subject._id}
                                            className="qb-subject-card"
                                            onClick={() => setSelectedSubjectId(subject._id)}
                                        >
                                            <div className="qb-subject-card-top">
                                                <div className={`qb-subject-icon ${isCode ? 'code' : 'apt'}`}>
                                                    {isCode ? <FaCode /> : <FaBookOpen />}
                                                </div>
                                                <span className={`qb-type-tag ${isCode ? 'coding' : 'mcq'}`}>
                                                    {subject.language ? subject.language.toUpperCase() : (subject.type || 'MCQ').toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="qb-subject-card-body">
                                                <h3 className="qb-subject-name">{subject.name}</h3>
                                                {subject.code && <span className="qb-subject-code">{subject.code}</span>}
                                                <p className="qb-subject-desc">
                                                    {subject.description || 'Subject question bank and assessment items.'}
                                                </p>
                                            </div>

                                            <div className="qb-subject-stats-bar">
                                                <span className="stat-chip total">
                                                    <FaQuestionCircle /> {stats.total} Questions
                                                </span>
                                                <span className="stat-chip">
                                                    <FaListUl /> {stats.mcq} MCQ
                                                </span>
                                                <span className="stat-chip">
                                                    <FaCode /> {stats.coding} Code
                                                </span>
                                            </div>

                                            <div className="qb-subject-card-footer">
                                                <button
                                                    type="button"
                                                    className="btn-open-qb"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSubjectId(subject._id);
                                                    }}
                                                >
                                                    <span>Open Question Bank</span>
                                                    <FaChevronRight className="btn-arrow" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 2: INSIDE SUBJECT QUESTIONS
                   ════════════════════════════════════════════════════════════════════════ */}
                {selectedSubject && (
                    <div className="qb-detail-view">

                        {/* Top Back Navigation Bar */}
                        <div className="qb-detail-nav-bar">
                            <button
                                type="button"
                                className="btn-back-to-subjects"
                                onClick={() => {
                                    setSelectedSubjectId(null);
                                    setQuestionSearch('');
                                    setTypeFilter('all');
                                    setDiffFilter('all');
                                }}
                            >
                                <FaArrowLeft />
                                <span>Back to All Subjects</span>
                            </button>

                            <div className="qb-breadcrumb">
                                <span>Question Bank</span>
                                <span className="sep">/</span>
                                <span className="current">{selectedSubject.name}</span>
                            </div>
                        </div>

                        {/* Subject Header Card */}
                        <div className="qb-subject-header-card">
                            <div className="qb-header-left">
                                <div className={`qb-header-avatar ${selectedSubject.language ? 'code' : 'apt'}`}>
                                    {selectedSubject.language ? <FaCode /> : <FaBookOpen />}
                                </div>
                                <div>
                                    <div className="qb-title-row">
                                        <h2>{selectedSubject.name}</h2>
                                        <span className={`qb-type-tag ${selectedSubject.language ? 'coding' : 'mcq'}`}>
                                            {selectedSubject.language ? selectedSubject.language.toUpperCase() : (selectedSubject.type || 'MCQ').toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="qb-header-desc">
                                        {selectedSubject.description || 'Subject question repository for student exams.'}
                                    </p>
                                </div>
                            </div>

                            <div className="qb-header-right">
                                <div className="qb-metrics-row">
                                    <div className="metric-box">
                                        <span className="metric-val">{subjectStatsMap[selectedSubject._id]?.total || 0}</span>
                                        <span className="metric-lbl">Total</span>
                                    </div>
                                    <div className="metric-box mcq">
                                        <span className="metric-val">{subjectStatsMap[selectedSubject._id]?.mcq || 0}</span>
                                        <span className="metric-lbl">MCQs</span>
                                    </div>
                                    <div className="metric-box code">
                                        <span className="metric-val">{subjectStatsMap[selectedSubject._id]?.coding || 0}</span>
                                        <span className="metric-lbl">Coding</span>
                                    </div>
                                </div>

                                <div className="qb-header-btns">
                                    <button
                                        type="button"
                                        className="btn-header-add"
                                        onClick={() => handleOpenAddModal(selectedSubject._id)}
                                    >
                                        <FaPlus /> Add Question
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-header-ai"
                                        onClick={() => setShowAIGenerator(true)}
                                    >
                                        <FaRobot /> AI Generate
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter and Search Controls */}
                        <div className="qb-controls-row">
                            <div className="qb-filter-pills">
                                <button
                                    type="button"
                                    className={`filter-pill ${typeFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('all')}
                                >
                                    All ({subjectStatsMap[selectedSubject._id]?.total || 0})
                                </button>
                                <button
                                    type="button"
                                    className={`filter-pill ${typeFilter === 'mcq' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('mcq')}
                                >
                                    MCQs ({subjectStatsMap[selectedSubject._id]?.mcq || 0})
                                </button>
                                <button
                                    type="button"
                                    className={`filter-pill ${typeFilter === 'coding' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('coding')}
                                >
                                    Coding ({subjectStatsMap[selectedSubject._id]?.coding || 0})
                                </button>
                            </div>

                            <div className="qb-controls-right">
                                <div className="qb-diff-select-box">
                                    <FaFilter className="filter-icon" />
                                    <select
                                        value={diffFilter}
                                        onChange={(e) => setDiffFilter(e.target.value)}
                                        className="diff-select"
                                    >
                                        <option value="all">All Difficulties</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                                <div className="qb-question-search">
                                    <FaSearch className="search-icon" />
                                    <input
                                        type="text"
                                        placeholder={`Search in ${selectedSubject.name}...`}
                                        value={questionSearch}
                                        onChange={(e) => setQuestionSearch(e.target.value)}
                                    />
                                    {questionSearch && (
                                        <button
                                            type="button"
                                            className="btn-clear-search"
                                            onClick={() => setQuestionSearch('')}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Questions Cards Grid */}
                        {subjectQuestions.length === 0 ? (
                            <div className="qb-empty-card">
                                <div className="qb-empty-icon"><FaQuestionCircle /></div>
                                <h3>No questions found in {selectedSubject.name}</h3>
                                <p>
                                    {questionSearch || typeFilter !== 'all' || diffFilter !== 'all'
                                        ? 'No questions matched your filter criteria.'
                                        : `Start adding questions for ${selectedSubject.name} or generate with AI.`}
                                </p>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        className="btn-header-add"
                                        onClick={() => handleOpenAddModal(selectedSubject._id)}
                                    >
                                        <FaPlus /> Add Question
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-header-ai"
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
                                                <span className="q-num-badge">Q{idx + 1}</span>
                                                <span className={`qb-badge ${question.type}`}>
                                                    {question.type === 'mcq' ? <FaListUl /> : <FaCode />}
                                                    {question.type.toUpperCase()}
                                                </span>
                                                <span className={`qb-badge ${question.difficulty}`}>
                                                    {question.difficulty}
                                                </span>
                                            </div>
                                            <span className="qb-badge marks">
                                                <FaStar /> {question.marks} marks
                                            </span>
                                        </div>

                                        <div className="qb-q-text">
                                            {question.questionText}
                                        </div>

                                        {/* MCQ options preview */}
                                        {question.type === 'mcq' && question.options && (
                                            <div className="qb-mcq-options-list">
                                                {question.options.map((opt, i) => {
                                                    const letter = String.fromCharCode(65 + i);
                                                    const isCorrect = question.correctAnswer === letter;
                                                    return (
                                                        <div key={i} className={`qb-mcq-opt-item ${isCorrect ? 'correct' : ''}`}>
                                                            <span className="opt-letter-bullet">{letter}</span>
                                                            <span className="opt-text">{opt}</span>
                                                            {isCorrect && (
                                                                <FaCheckCircle style={{ color: '#059669', fontSize: '0.75rem', marginLeft: 'auto', flexShrink: 0 }} />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Coding preview */}
                                        {question.type === 'coding' && question.testCases && (
                                            <div className="qb-code-info">
                                                <FaCode /> {question.testCases.length} test case{question.testCases.length !== 1 ? 's' : ''} configured
                                            </div>
                                        )}

                                        <div className="qb-q-footer">
                                            <span className="q-footer-subject">
                                                <FaBookOpen style={{ marginRight: 4 }} />
                                                {selectedSubject.name}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn-delete-q"
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
                    <div className="qb-modal-container" onClick={(e) => e.stopPropagation()}>
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
                                {/* Type Selector */}
                                <div className="modal-type-tabs">
                                    <button
                                        type="button"
                                        className={`btn-type-option ${formData.type === 'mcq' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'mcq' })}
                                    >
                                        <FaListUl /> Multiple Choice (MCQ)
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn-type-option ${formData.type === 'coding' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'coding' })}
                                    >
                                        <FaCode /> Coding Problem
                                    </button>
                                </div>

                                <div className="modal-form-grid3">
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
                                        placeholder="Enter the problem statement or question text..."
                                        value={formData.questionText}
                                        onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                        required
                                        rows={3}
                                    />
                                </div>

                                {formData.type === 'mcq' ? (
                                    <div className="mcq-section">
                                        <label className="form-lbl">Options</label>
                                        <div className="mcq-options-grid">
                                            {formData.options.map((opt, i) => (
                                                <div key={i} className="mcq-input-wrap">
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
                                            <label className="form-lbl">Correct Option</label>
                                            <select
                                                className="form-control"
                                                value={formData.correctAnswer}
                                                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Correct Option</option>
                                                <option value="A">Option A</option>
                                                <option value="B">Option B</option>
                                                <option value="C">Option C</option>
                                                <option value="D">Option D</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="coding-section">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                            <label className="form-lbl" style={{ margin: 0 }}>
                                                Test Cases ({formData.testCases.length} total • {formData.testCases.filter(t => !t.isHidden).length} Public, {formData.testCases.filter(t => t.isHidden).length} Hidden)
                                            </label>
                                            <button
                                                type="button"
                                                className="btn-quick-6tc"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    testCases: [
                                                        { input: '', output: '', isHidden: false },
                                                        { input: '', output: '', isHidden: false },
                                                        { input: '', output: '', isHidden: true },
                                                        { input: '', output: '', isHidden: true },
                                                        { input: '', output: '', isHidden: true },
                                                        { input: '', output: '', isHidden: true }
                                                    ]
                                                })}
                                            >
                                                ⚡ 6 Standard Cases
                                            </button>
                                        </div>

                                        {formData.testCases.map((tc, i) => (
                                            <div key={i} className={`tc-box ${tc.isHidden ? 'hidden-case' : 'public-case'}`}>
                                                <div className="tc-header">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                        <span>Test Case #{i + 1}</span>
                                                        <button
                                                            type="button"
                                                            className={`btn-toggle-hidden ${tc.isHidden ? 'is-hidden' : 'is-public'}`}
                                                            onClick={() => {
                                                                const newTCs = [...formData.testCases];
                                                                newTCs[i].isHidden = !newTCs[i].isHidden;
                                                                setFormData({ ...formData, testCases: newTCs });
                                                            }}
                                                            title="Click to toggle Public / Hidden"
                                                        >
                                                            {tc.isHidden ? '🔒 Hidden' : '👁️ Public'}
                                                        </button>
                                                    </div>

                                                    {formData.testCases.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="btn-del-tc"
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
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                                        <label className="form-lbl-sub">Input (stdin)</label>
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
                                                    <div className="form-group" style={{ marginBottom: 0 }}>
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

                                        <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.35rem' }}>
                                            <button
                                                type="button"
                                                className="btn-add-tc"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    testCases: [...formData.testCases, { input: '', output: '', isHidden: formData.testCases.length >= 2 }]
                                                })}
                                            >
                                                + Add Test Case
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit">
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
