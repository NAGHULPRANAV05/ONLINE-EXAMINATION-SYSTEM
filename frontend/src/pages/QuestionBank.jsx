import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import { subjectAPI, questionAPI } from '../services/api';
import {
    FaRobot, FaPlus, FaTrashAlt, FaTimes, FaQuestionCircle,
    FaCode, FaListUl, FaBookOpen, FaStar, FaCheckCircle, FaSearch
} from 'react-icons/fa';
import './QuestionBank.css';

function QuestionBank() {
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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
            setQuestions(questionsRes.data.questions);
            setSubjects(subjectsRes.data.subjects);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
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
            subject: '',
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

    const mcqCount = questions.filter(q => q.type === 'mcq').length;
    const codingCount = questions.filter(q => q.type === 'coding').length;

    const filteredQuestions = questions.filter(q =>
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="qb-page">
            <Navbar />

            {/* Hero */}
            <div className="qb-hero">
                <div className="qb-hero-content">
                    <div>
                        <div className="qb-hero-icon"><FaQuestionCircle /></div>
                        <h1>Question Bank</h1>
                        <p className="qb-hero-sub">Create and manage questions for your exams</p>
                        <div className="qb-hero-stats">
                            <span className="qb-hero-pill"><FaQuestionCircle /> {questions.length} Total</span>
                            <span className="qb-hero-pill"><FaListUl /> {mcqCount} MCQ</span>
                            <span className="qb-hero-pill"><FaCode /> {codingCount} Coding</span>
                        </div>
                    </div>
                    <div className="qb-hero-btns">
                        <button className="qb-hero-btn ai" onClick={() => setShowAIGenerator(true)}>
                            <FaRobot /> Generate with AI
                        </button>
                        <button className="qb-hero-btn add" onClick={() => setShowModal(true)}>
                            <FaPlus /> Add Question
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="qb-content">
                {/* Search bar */}
                {questions.length > 0 && (
                    <div className="qb-search">
                        <FaSearch className="qb-search-icon" />
                        <input
                            type="text"
                            placeholder="Search questions by text, subject, type or difficulty..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                {filteredQuestions.length === 0 ? (
                    <div className="qb-empty">
                        <div className="qb-empty-icon"><FaQuestionCircle /></div>
                        <h3>{questions.length === 0 ? 'No questions yet' : 'No matching questions'}</h3>
                        <p>{questions.length === 0 ? 'Add your first question manually or generate with AI!' : 'Try a different search term.'}</p>
                    </div>
                ) : (
                    <div className="qb-grid">
                        {filteredQuestions.map((question) => (
                            <div key={question._id} className="qb-card">
                                {/* Left accent */}
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

                                {/* Question text */}
                                <div className="qb-card-question">{question.questionText}</div>

                                {/* MCQ preview */}
                                {question.type === 'mcq' && question.options && (
                                    <div className="qb-mcq-preview">
                                        {question.options.map((opt, i) => (
                                            <div key={i} className={`qb-mcq-opt ${question.correctAnswer === String.fromCharCode(65 + i) ? 'correct' : ''}`}>
                                                <span className="qb-mcq-letter">{String.fromCharCode(65 + i)}</span>
                                                {opt}
                                                {question.correctAnswer === String.fromCharCode(65 + i) && (
                                                    <FaCheckCircle style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#059669' }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Coding preview */}
                                {question.type === 'coding' && question.testCases && (
                                    <div className="qb-code-preview">
                                        <FaCode /> {question.testCases.length} test case{question.testCases.length !== 1 ? 's' : ''}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="qb-card-footer">
                                    <span className="qb-card-subject">
                                        <FaBookOpen /> {question.subject?.name}
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

            {/* Add Question Modal */}
            {showModal && (
                <div className="qb-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="qb-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="qb-modal-head">
                            <h2 className="qb-modal-title">Add Question</h2>
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
                                                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Question Text</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.questionText}
                                        onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                        required
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
                                        <div className="form-group" style={{ marginTop: '0.6rem' }}>
                                            <label className="form-label">Correct Answer</label>
                                            <select
                                                className="form-select"
                                                value={formData.correctAnswer}
                                                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Answer</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        {formData.testCases.map((tc, i) => (
                                            <div key={i} className="qb-tc-block">
                                                <div className="qb-tc-head">
                                                    <span className="qb-tc-num">{i + 1}</span>
                                                    Test Case {i + 1}
                                                </div>
                                                <div className="qb-tc-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Input</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={tc.input}
                                                            onChange={(e) => {
                                                                const newTCs = [...formData.testCases];
                                                                newTCs[i].input = e.target.value;
                                                                setFormData({ ...formData, testCases: newTCs });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Output</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
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
                                            + Add Test Case
                                        </button>
                                    </div>
                                )}

                                <div className="qb-modal-btns">
                                    <button type="submit" className="qb-submit-btn">
                                        Create Question
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

            {/* AI Generator */}
            {showAIGenerator && (
                <AIQuestionGenerator
                    subjects={subjects}
                    onQuestionsGenerated={fetchData}
                    onClose={() => setShowAIGenerator(false)}
                />
            )}
        </div>
    );
}

export default QuestionBank;
