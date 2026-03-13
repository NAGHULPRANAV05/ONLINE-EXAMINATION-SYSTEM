import { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaPlay, FaSpinner, FaFlask } from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import { codeAPI } from '../services/api';

function CodeEditor({ language, initialCode = '', testCases = [], onCodeChange }) {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState(null);

    const handleCodeChange = (value) => {
        setCode(value);
        if (onCodeChange) {
            onCodeChange(value);
        }
    };

    const runCode = async () => {
        if (!code.trim()) {
            setOutput('Please write some code first!');
            return;
        }

        setIsRunning(true);
        setOutput('Running code...');
        setTestResults(null);

        try {
            const response = await codeAPI.execute({
                language,
                code,
                testCases
            });

            const result = response.data.result;
            setTestResults(result);

            const passedCount = result.passedTests;
            const totalCount = result.totalTests;
            setOutput(`Passed: ${passedCount}/${totalCount} test cases`);
        } catch (error) {
            setOutput(`Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    // SVG progress ring helpers
    const radius = 17;
    const circumference = 2 * Math.PI * radius;
    const getStrokeDashoffset = (passed, total) => {
        if (total === 0) return circumference;
        return circumference - (passed / total) * circumference;
    };

    const getRingClass = (passed, total) => {
        if (passed === total) return 'all-pass';
        if (passed === 0) return 'none-pass';
        return 'partial';
    };

    return (
        <div className="code-editor-container">
            {/* Toolbar */}
            <div className="code-editor-toolbar">
                <div className="code-editor-lang-badge">
                    <span className="lang-dot"></span>
                    {language.toUpperCase()}
                </div>
                <button
                    onClick={runCode}
                    disabled={isRunning}
                    className={`code-editor-run-btn ${isRunning ? 'running' : ''}`}
                >
                    {isRunning ? (
                        <>
                            <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                            Running…
                        </>
                    ) : (
                        <>
                            <FaPlay style={{ fontSize: '0.7rem' }} />
                            Run Code
                        </>
                    )}
                </button>
            </div>

            {/* Monaco Editor */}
            <div className="code-editor-body">
                <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        fontLigatures: true,
                        padding: { top: 12 },
                        renderLineHighlight: 'gutter',
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                    }}
                />
            </div>

            {/* Test Results Panel */}
            {testResults && testResults.testResults && testResults.testResults.length > 0 ? (
                <div className="test-results-panel">
                    {/* Summary header */}
                    <div className="test-results-summary">
                        <div className="test-results-title">
                            <FaFlask className="results-icon" style={{ color: '#818cf8' }} />
                            Test Results
                        </div>
                        <div className="test-results-stats">
                            <span className="test-stat-badge passed">
                                <FaCheckCircle className="stat-icon" />
                                {testResults.passedTests} Passed
                            </span>
                            {testResults.totalTests - testResults.passedTests > 0 && (
                                <span className="test-stat-badge failed">
                                    <FaTimesCircle className="stat-icon" />
                                    {testResults.totalTests - testResults.passedTests} Failed
                                </span>
                            )}
                            {/* Progress ring */}
                            <div className="test-progress-ring">
                                <svg width="42" height="42" viewBox="0 0 42 42">
                                    <circle className="ring-bg" cx="21" cy="21" r={radius} />
                                    <circle
                                        className={`ring-fill ${getRingClass(testResults.passedTests, testResults.totalTests)}`}
                                        cx="21" cy="21" r={radius}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={getStrokeDashoffset(testResults.passedTests, testResults.totalTests)}
                                    />
                                </svg>
                                <div className="ring-text">
                                    {testResults.passedTests}/{testResults.totalTests}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Individual test results */}
                    <div className="test-results-list">
                        {testResults.testResults.map((test, index) => (
                            <div key={index} className={`test-result-item ${test.passed ? 'passed' : 'failed'}`}>
                                <div className="test-result-header">
                                    <div className="test-result-label">
                                        {test.passed
                                            ? <FaCheckCircle className="result-icon pass" />
                                            : <FaTimesCircle className="result-icon fail" />
                                        }
                                        <span className="result-name">Test Case {index + 1}</span>
                                    </div>
                                    <span className={`test-result-status ${test.passed ? 'pass' : 'fail'}`}>
                                        {test.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                </div>
                                <div className="test-result-detail">
                                    <div className="test-detail-block">
                                        <span className="test-detail-label">Input</span>
                                        <div className="test-detail-value">
                                            {test.input || '(no input)'}
                                        </div>
                                    </div>
                                    <div className="test-detail-block">
                                        <span className="test-detail-label">Expected</span>
                                        <div className={`test-detail-value ${test.passed ? 'match' : ''}`}>
                                            {test.expectedOutput}
                                        </div>
                                    </div>
                                    <div className="test-detail-block">
                                        <span className="test-detail-label">Output</span>
                                        <div className={`test-detail-value ${test.passed ? 'match' : 'mismatch'}`}>
                                            {test.actualOutput}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : output ? (
                <div className="code-output-console">
                    <pre className={output.startsWith('Error') ? 'output-error' : ''}>
                        {output}
                    </pre>
                </div>
            ) : (
                <div className="code-output-empty">
                    Click "Run Code" to execute and see test results
                </div>
            )}
        </div>
    );
}

export default CodeEditor;
