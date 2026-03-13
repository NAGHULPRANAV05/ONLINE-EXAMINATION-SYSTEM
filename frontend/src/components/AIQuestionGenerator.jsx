import { useState } from 'react';
import { FaRobot, FaSyncAlt, FaMagic, FaCheckCircle, FaCheck } from 'react-icons/fa';
import { questionAPI } from '../services/api';

function AIQuestionGenerator({ subjects, onQuestionsGenerated, onClose }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'mcq',
        topic: '',
        subject: '',
        difficulty: 'medium',
        count: 5,
        language: 'any'
    });
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGeneratedQuestions([]);
        setSelectedQuestions([]);

        try {
            const response = await questionAPI.generateWithAI(formData);
            const questions = response.data.questions;
            setGeneratedQuestions(questions);
            // Select all by default
            setSelectedQuestions(questions.map((_, index) => index));
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSelected = async () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question to save');
            return;
        }

        setLoading(true);
        try {
            const questionsToSave = selectedQuestions.map(index => generatedQuestions[index]);

            // Save each question
            for (const question of questionsToSave) {
                await questionAPI.create(question);
            }

            alert(`Successfully saved ${questionsToSave.length} question(s)!`);
            onQuestionsGenerated();
            onClose();
        } catch (error) {
            alert('Error saving questions: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestionSelection = (index) => {
        setSelectedQuestions(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
                <h2><FaRobot style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Generate Questions with AI</h2>

                {generatedQuestions.length === 0 ? (
                    <form onSubmit={handleGenerate}>
                        <div className="form-group">
                            <label className="form-label">Question Type</label>
                            <select
                                className="form-select"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="mcq">Multiple Choice (MCQ)</option>
                                <option value="coding">Coding Problem</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Topic</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., JavaScript Arrays, Binary Search, Recursion"
                                value={formData.topic}
                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                required
                            />
                            <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
                                Be specific for better results
                            </small>
                        </div>

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

                        {formData.type === 'mcq' && (
                            <div className="form-group">
                                <label className="form-label">Number of Questions</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.count}
                                    onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                                    min="1"
                                    max="10"
                                    required
                                />
                            </div>
                        )}

                        {formData.type === 'coding' && (
                            <div className="form-group">
                                <label className="form-label">Preferred Language (Optional)</label>
                                <select
                                    className="form-select"
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                >
                                    <option value="any">Any Language</option>
                                    <option value="Python">Python</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Java">Java</option>
                                    <option value="C++">C++</option>
                                    <option value="C">C</option>
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                disabled={loading}
                            >
                                {loading ? <><FaSyncAlt style={{ marginRight: '0.3rem', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} /> Generating...</> : <><FaMagic style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Generate</>}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-outline"
                                style={{ flex: 1 }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                            <p style={{ margin: 0, color: '#22c55e' }}>
                                <FaCheckCircle style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Generated {generatedQuestions.length} question(s). Select the ones you want to save.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <button
                                onClick={() => setSelectedQuestions(generatedQuestions.map((_, i) => i))}
                                className="btn btn-outline btn-sm"
                                style={{ marginRight: '0.5rem' }}
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setSelectedQuestions([])}
                                className="btn btn-outline btn-sm"
                            >
                                Deselect All
                            </button>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                            {generatedQuestions.map((question, index) => (
                                <div
                                    key={index}
                                    className="card"
                                    style={{
                                        marginBottom: '1rem',
                                        border: selectedQuestions.includes(index) ? '2px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.2)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => toggleQuestionSelection(index)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedQuestions.includes(index)}
                                            onChange={() => toggleQuestionSelection(index)}
                                            style={{ marginTop: '0.25rem' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <span className={`badge ${question.type === 'mcq' ? 'badge-primary' : 'badge-success'}`}>
                                                    {question.type.toUpperCase()}
                                                </span>
                                                <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>
                                                    {question.difficulty}
                                                </span>
                                                <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>
                                                    {question.marks} marks
                                                </span>
                                            </div>
                                            <h4 style={{ marginBottom: '0.75rem' }}>{question.questionText}</h4>

                                            {question.type === 'mcq' && (
                                                <div>
                                                    {question.options.map((opt, i) => (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                padding: '0.5rem',
                                                                marginBottom: '0.25rem',
                                                                background: question.correctAnswer === String.fromCharCode(65 + i) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(241, 245, 249, 0.8)',
                                                                borderRadius: '0.25rem',
                                                                fontSize: '0.875rem'
                                                            }}
                                                        >
                                                            <strong>{String.fromCharCode(65 + i)}:</strong> {opt}
                                                            {question.correctAnswer === String.fromCharCode(65 + i) && <FaCheck style={{ color: '#4ade80', marginLeft: '0.3rem', verticalAlign: 'middle' }} />}
                                                        </div>
                                                    ))}
                                                    {question.explanation && (
                                                        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                                                            <strong>Explanation:</strong> {question.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {question.type === 'coding' && (
                                                <div>
                                                    <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                                                        <strong>Test Cases:</strong> {question.testCases.length}
                                                    </p>
                                                    {question.testCases.slice(0, 2).map((tc, i) => (
                                                        <div key={i} style={{ fontSize: '0.75rem', marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(241, 245, 249, 0.8)', borderRadius: '0.25rem' }}>
                                                            <div><strong>Input:</strong> {tc.input}</div>
                                                            <div><strong>Output:</strong> {tc.output}</div>
                                                        </div>
                                                    ))}
                                                    {question.testCases.length > 2 && (
                                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                            + {question.testCases.length - 2} more test case(s)
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleSaveSelected}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                disabled={loading || selectedQuestions.length === 0}
                            >
                                {loading ? 'Saving...' : `Save Selected (${selectedQuestions.length})`}
                            </button>
                            <button
                                onClick={() => setGeneratedQuestions([])}
                                className="btn btn-outline"
                                style={{ flex: 1 }}
                                disabled={loading}
                            >
                                Generate Again
                            </button>
                            <button
                                onClick={onClose}
                                className="btn btn-outline"
                                disabled={loading}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AIQuestionGenerator;
