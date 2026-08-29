import { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import { subjectAPI, questionAPI } from '../services/api';
import {
    FaRobot, FaPlus, FaTrashAlt, FaTimes, FaQuestionCircle,
    FaCode, FaListUl, FaBookOpen, FaStar, FaCheckCircle, FaSearch,
    FaArrowLeft, FaChevronRight, FaFolder, FaLayerGroup, FaFilter
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

            // Search filter
            const matchesSearch = !questionSearch.trim() ||
                q.questionText.toLowerCase().includes(questionSearch.toLowerCase());

            // Type filter
            const matchesType = typeFilter === 'all' || q.type === typeFilter;

            // Difficulty filter
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

    const totalMCQs = questions.filter(q => q.type === 'mcq').length;
    const totalCoding = questions.filter(q => q.type === 'coding').length;

    return (
        <div className="qb-page">
            <Navbar />

            {/* Hero Header */}
            <div className="qb-hero">
                <div className="qb-hero-content">
                    <div>
                        <div className="qb-hero-icon"><FaQuestionCircle /></div>
                        <h1>
                            {selectedSubject
                                ? `${selectedSubject.name} — Question Bank`
                                : 'Subject Question Banks'}
                        </h1>
                        <p className="qb-hero-sub">
                            {selectedSubject
                                ? `Manage, add, and generate questions specifically for ${selectedSubject.name}`
                                : 'Select a subject to view and manage its question repository'}
                        </p>
                        <div className="qb-hero-stats">
                            <span className="qb-hero-pill"><FaLayerGroup /> {subjects.length} Subjects</span>
                            <span className="qb-hero-pill"><FaQuestionCircle /> {questions.length} Total Questions</span>
                            <span className="qb-hero-pill"><FaListUl /> {totalMCQs} MCQs</span>
                            <span className="qb-hero-pill"><FaCode /> {totalCoding} Coding</span>
                        </div>
                    </div>
                    <div className="qb-hero-btns">
                        <button
                            className="qb-hero-btn ai"
                            onClick={() => setShowAIGenerator(true)}
                        >
                            <FaRobot /> Generate with AI
                        </button>
                        <button
                            className="qb-hero-btn add"
                            onClick={() => handleOpenAddModal(selectedSubjectId)}
                        >
                            <FaPlus /> Add Question
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="qb-content">

                {/* ════════════════════════════════════════════════════════════════════════
                    VIEW 1: SUBJECT DIRECTORY (Select Subject to Open its Questions)
                   ════════════════════════════════════════════════════════════════════════ */}
                {!selectedSubject && (
                    <>
                        {/* Search & Header */}
                        <div className="qb-section-head-split">
                            <div>
                                <h2 className="qb-section-title">
                                    <FaFolder className="title-icon" /> Select Subject
                                </h2>
                                <p className="qb-section-sub">Choose a subject to view, add, or edit its questions</p>
                            </div>

                            <div className="qb-search-wrap">
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
                            <div className="qb-empty">
                                <div className="qb-empty-icon"><FaFolder /></div>
                                <h3>No subjects found</h3>
                                <p>No subjects match your search. Create subjects in Subject Management first.</p>
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
                                                <span className={`qb-subject-type-badge ${isCode ? 'code' : 'apt'}`}>
                                                    {subject.language ? subject.language.toUpperCase() : (subject.type || 'MCQ').toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="qb-subject-card-body">
                                                <h3 className="qb-subject-name">{subject.name}</h3>
                                                {subject.code && <span className="qb-subject-code">{subject.code}</span>}
                                                <p className="qb-subject-desc">
                                                    {subject.description || 'Comprehensive question bank and assessments.'}
                                                </p>
                                            </div>

                                            <div className="qb-subject-stats-bar">
                                                <div className="stat-pill total">
                                                    <FaQuestionCircle />
                                                    <span>{stats.total} Questions</span>
                                                </div>
                                                <div className="stat-pill mcq">
                                                    <FaListUl />
                                                    <span>{stats.mcq} MCQ</span>
                                                </div>
                                                <div className="stat-pill coding">
                                                    <FaCode />
                                                    <span>{stats.coding} Code</span>
                                                </div>
                                            </div>

                                            <div className="qb-subject-card-footer">
                                                <button
                                                    type="button"
                                                    className="btn-open-subject-qb"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSubjectId(subject._id);
                                                    }}
                                                >
                                                    <span>Open Question Bank</span>
                                                    <FaChevronRight className="arrow-icon" />
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
                    VIEW 2: INSIDE SUBJECT QUESTION BANK
                   ════════════════════════════════════════════════════════════════════════ */}
                {selectedSubject && (
                    <div className="qb-subject-detail-view">

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
                            <div className="qb-header-card-left">
                                <div className={`qb-header-avatar ${selectedSubject.language ? 'code' : 'apt'}`}>
                                    {selectedSubject.language ? <FaCode /> : <FaBookOpen />}
                                </div>
                                <div>
                                    <div className="qb-header-title-row">
                                        <h2>{selectedSubject.name}</h2>
                                        <span className="qb-subject-type-badge">
                                            {selectedSubject.language ? selectedSubject.language.toUpperCase() : (selectedSubject.type || 'MCQ').toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="qb-header-desc">
                                        {selectedSubject.description || 'Subject question repository for student exams.'}
                                    </p>
                                </div>
                            </div>

                            <div className="qb-header-card-right">
                                <div className="qb-stats-counter-row">
                                    <div className="stat-counter">
                                        <span className="count-num">{subjectStatsMap[selectedSubject._id]?.total || 0}</span>
                                        <span className="count-lbl">Total Questions</span>
                                    </div>
                                    <div className="stat-counter mcq">
                                        <span className="count-num">{subjectStatsMap[selectedSubject._id]?.mcq || 0}</span>
                                        <span className="count-lbl">MCQs</span>
                                    </div>
                                    <div className="stat-counter code">
                                        <span className="count-num">{subjectStatsMap[selectedSubject._id]?.coding || 0}</span>
                                        <span className="count-lbl">Coding</span>
                                    </div>
                                </div>

                                <div className="qb-header-btn-row">
                                    <button
                                        type="button"
                                        className="btn-header-action add"
                                        onClick={() => handleOpenAddModal(selectedSubject._id)}
                                    >
                                        <FaPlus /> Add to {selectedSubject.name}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-header-action ai"
                                        onClick={() => setShowAIGenerator(true)}
                                    >
                                        <FaRobot /> AI Generate
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Controls Toolbar (Search & Filter Tabs) */}
                        <div className="qb-controls-bar">
                            <div className="qb-filter-tabs">
                                <button
                                    type="button"
                                    className={`tab-btn ${typeFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('all')}
                                >
                                    All Types ({subjectStatsMap[selectedSubject._id]?.total || 0})
                                </button>
                                <button
                                    type="button"
                                    className={`tab-btn ${typeFilter === 'mcq' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('mcq')}
                                >
                                    <FaListUl style={{ marginRight: 4 }} /> MCQs ({subjectStatsMap[selectedSubject._id]?.mcq || 0})
                                </button>
                                <button
                                    type="button"
                                    className={`tab-btn ${typeFilter === 'coding' ? 'active' : ''}`}
                                    onClick={() => setTypeFilter('coding')}
                                >
                                    <FaCode style={{ marginRight: 4 }} /> Coding ({subjectStatsMap[selectedSubject._id]?.coding || 0})
                                </button>
                            </div>

                            <div className="qb-controls-right">
                                <div className="qb-diff-select-wrap">
                                    <FaFilter className="filter-icon" />
                                    <select
                                        value={diffFilter}
                                        onChange={(e) => setDiffFilter(e.target.value)}
                                        className="qb-diff-select"
                                    >
                                        <option value="all">All Difficulties</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>

                                <div className="qb-question-search-box">
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

                        {/* Questions List/Grid for This Subject */}
                        {subjectQuestions.length === 0 ? (
                            <div className="qb-empty">
                                <div className="qb-empty-icon"><FaQuestionCircle /></div>
                                <h3>No questions found in {selectedSubject.name}</h3>
                                <p>
                                    {questionSearch || typeFilter !== 'all' || diffFilter !== 'all'
                                        ? 'No questions matched your current filter criteria.'
                                        : `Start building your ${selectedSubject.name} question bank by adding questions or generating with AI.`}
                                </p>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        className="qb-hero-btn add"
                                        style={{ background: '#2563eb', color: '#fff' }}
                                        onClick={() => handleOpenAddModal(selectedSubject._id)}
                                    >
                                        <FaPlus /> Add Question
                                    </button>
                                    <button
                                        type="button"
                                        className="qb-hero-btn ai"
                                        style={{ background: '#7c3aed', color: '#fff' }}
                                        onClick={() => setShowAIGenerator(true)}
                                    >
                                        <FaRobot /> Generate with AI
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="qb-grid">
                                {subjectQuestions.map((question) => (
                                    <div key={question._id} className="qb-card">
                                        <div className={`qb-card-accent ${question.type}`} />

                                        {/* Badges */}
                                        <div className="qb-badges">
                                            <span className={`qb-badge ${question.type}`}>
                                                {question.type === 'mcq' ? <FaListUl /> : <FaCode />}
                                                {question.type.toUpperCase()}
                                            </span>
                                            <span className={`qb-badge ${question.difficulty}`}>
                                                {question.difficulty}
                                            </span>
                                            <span className="qb-badge marks">
                                                <FaStar /> {question.marks} marks
                                            </span>
                                        </div>

                                        {/* Question Text */}
                                        <div className="qb-card-question">{question.questionText}</div>

                                        {/* MCQ preview */}
                                        {question.type === 'mcq' && question.options && (
                                            <div className="qb-mcq-preview">
                                                {question.options.map((opt, i) => (
                                                    <div key={i} className={`qb-mcq-opt ${question.correctAnswer === String.fromCharCode(65 + i) ? 'correct' : ''}`}>
                                                        <span className="qb-mcq-letter">{String.fromCharCode(65 + i)}</span>
                                                        <span className="qb-mcq-opt-text">{opt}</span>
                                                        {question.correctAnswer === String.fromCharCode(65 + i) && (
                                                            <FaCheckCircle style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#059669', flexShrink: 0 }} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Coding preview */}
                                        {question.type === 'coding' && question.testCases && (
                                            <div className="qb-code-preview">
                                                <FaCode /> {question.testCases.length} test case{question.testCases.length !== 1 ? 's' : ''} configured
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="qb-card-footer">
                                            <span className="qb-card-subject">
                                                <FaBookOpen /> {selectedSubject.name}
                                            </span>
                                            <button className="qb-del-btn" onClick={() => handleDelete(question._id)}>
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
                    <div className="qb-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="qb-modal-head">
                            <div>
                                <h2 className="qb-modal-title">Add New Question</h2>
                                {selectedSubject && (
                                    <span className="qb-modal-sub-tag">Adding to: {selectedSubject.name}</span>
                                )}
                            </div>
                            <button className="qb-modal-close" onClick={() => setShowModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="qb-modal-body">
                            <form onSubmit={handleSubmit}>
                                {/* Type toggle */}
                                <div className="qb-type-toggle">
                                    <button
                                        type="button"
                                        className={`qb-type-btn ${formData.type === 'mcq' ? 'active mcq' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'mcq' })}
                                    >
                                        <FaListUl style={{ marginRight: '0.3rem' }} /> MCQ
                                    </button>
                                    <button
                                        type="button"
                                        className={`qb-type-btn ${formData.type === 'coding' ? 'active coding' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'coding' })}
                                    >
                                        <FaCode style={{ marginRight: '0.3rem' }} /> Coding
                                    </button>
                                </div>

                                <div className="qb-form-row2">
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <select
                                            className="form-select"
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

                                    <div className="qb-form-row2">
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
                                        <div className="form-group">
                                            <label className="form-label">Marks</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.marks}
                                                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Question Statement</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Enter the problem statement or question text..."
                                        value={formData.questionText}
                                        onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                        required
                                        rows={4}
                                    />
                                </div>

                                {formData.type === 'mcq' ? (
                                    <>
                                        <div className="qb-options-grid">
                                            {formData.options.map((opt, i) => (
                                                <div key={i} className="qb-option-wrap">
                                                    <span className="qb-option-letter">{String.fromCharCode(65 + i)}</span>
                                                    <input
                                                        type="text"
                                                        className="form-input qb-option-input"
                                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
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
                                        <div className="form-group" style={{ marginTop: '0.85rem' }}>
                                            <label className="form-label">Correct Option</label>
                                            <select
                                                className="form-select"
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
                                    </>
                                ) : (
                                    <div>
                                        <label className="form-label">Sample Test Cases</label>
                                        {formData.testCases.map((tc, i) => (
                                            <div key={i} className="qb-tc-block">
                                                <div className="qb-tc-head">
                                                    <span className="qb-tc-num">{i + 1}</span>
                                                    <span>Test Case {i + 1}</span>
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
                                                <div className="qb-tc-row">
                                                    <div className="form-group">
                                                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Input (stdin)</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
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
                                                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Expected Output</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
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
                                            className="qb-add-tc-btn"
                                            onClick={() => setFormData({ ...formData, testCases: [...formData.testCases, { input: '', output: '' }] })}
                                        >
                                            + Add Another Test Case
                                        </button>
                                    </div>
                                )}

                                <div className="qb-modal-btns">
                                    <button type="submit" className="qb-submit-btn">
                                        Save Question
                                    </button>
                                    <button type="button" className="qb-cancel-btn" onClick={() => setShowModal(false)}>
                                        Cancel
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
