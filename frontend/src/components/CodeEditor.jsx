import { useState, useEffect } from 'react';
import {
    FaPlay,
    FaSpinner,
    FaUndo,
    FaCheckCircle,
    FaTimesCircle,
    FaChevronUp,
    FaChevronDown,
    FaLock,
    FaTerminal
} from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import { codeAPI } from '../services/api';

const STARTER_TEMPLATES = {
    python: `# Python 3 Solution
import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Write your solution here
    

if __name__ == '__main__':
    solve()
`,
    cpp: `// C++17 Solution
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}
`,
    c: `// C Solution
#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your solution here
    
    return 0;
}
`,
    java: `// Java Solution
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
        
        scanner.close();
    }
}
`
};

function CodeEditor({ language = 'python', initialCode = '', testCases = [], onCodeChange }) {
    const langKey = (language || 'python').toLowerCase();
    const defaultTemplate = STARTER_TEMPLATES[langKey] || STARTER_TEMPLATES.python;

    const [code, setCode] = useState(initialCode && initialCode.trim() ? initialCode : defaultTemplate);
    const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
    const [isConsoleOpen, setIsConsoleOpen] = useState(true);
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Custom Input state
    const [customInput, setCustomInput] = useState('');
    const [customOutput, setCustomOutput] = useState('');
    const [isCustomRunning, setIsCustomRunning] = useState(false);

    // Execution states
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (initialCode && initialCode.trim() && initialCode !== code) {
            setCode(initialCode);
        } else if (!code && defaultTemplate) {
            setCode(defaultTemplate);
        }
    }, [initialCode]);

    const handleCodeChange = (value) => {
        const val = value || '';
        setCode(val);
        if (onCodeChange) onCodeChange(val);
    };

    const handleReset = () => {
        if (window.confirm('Reset code to initial template?')) {
            const template = STARTER_TEMPLATES[langKey] || STARTER_TEMPLATES.python;
            setCode(template);
            if (onCodeChange) onCodeChange(template);
            setTestResults(null);
            setErrorMessage('');
        }
    };

    // Run against test cases (both public and hidden)
    const runCode = async () => {
        if (!code.trim()) {
            setErrorMessage('Please write some code first.');
            return;
        }

        setIsRunning(true);
        setErrorMessage('');
        setTestResults(null);
        setIsConsoleOpen(true);
        setShowCustomInput(false);

        try {
            const response = await codeAPI.execute({
                language: langKey,
                code,
                testCases: testCases && testCases.length > 0 ? testCases : [{ input: '', output: '' }]
            });

            const result = response.data.result;
            setTestResults(result);
            setSelectedCaseIdx(0);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || error.message || 'Execution error occurred');
        } finally {
            setIsRunning(false);
        }
    };

    // Run custom input
    const runCustom = async () => {
        if (!code.trim()) {
            setCustomOutput('Please write some code first.');
            return;
        }

        setIsCustomRunning(true);
        setCustomOutput('Running...');

        try {
            const response = await codeAPI.execute({
                language: langKey,
                code,
                testCases: [{ input: customInput, output: '' }]
            });

            const result = response.data.result;
            if (result?.testResults?.[0]) {
                setCustomOutput(result.testResults[0].actualOutput || '(No output)');
            } else {
                setCustomOutput('Execution completed.');
            }
        } catch (error) {
            setCustomOutput('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsCustomRunning(false);
        }
    };

    const getMonacoLanguage = () => {
        if (langKey === 'cpp' || langKey === 'c') return 'cpp';
        if (langKey === 'python') return 'python';
        if (langKey === 'java') return 'java';
        return 'plaintext';
    };

    const casesToDisplay = testResults?.testResults || testCases;
    const activeCase = casesToDisplay[selectedCaseIdx] || null;
    const isCurrentHidden = activeCase?.isHidden || (selectedCaseIdx >= 2 && !testResults);

    return (
        <div className="clean-editor-wrapper">
            {/* Simple Clean Toolbar */}
            <div className="clean-editor-toolbar">
                <div className="editor-lang-tag">
                    <span className="lang-indicator-dot"></span>
                    <span>{langKey.toUpperCase()}</span>
                </div>

                <div className="editor-actions">
                    <button
                        type="button"
                        className={`btn-editor-action ${showCustomInput ? 'active' : ''}`}
                        onClick={() => {
                            setShowCustomInput(prev => !prev);
                            setIsConsoleOpen(true);
                        }}
                    >
                        <FaTerminal style={{ fontSize: '0.72rem' }} />
                        <span>Custom Input</span>
                    </button>

                    <button
                        type="button"
                        className="btn-editor-action"
                        onClick={handleReset}
                        title="Reset code template"
                    >
                        <FaUndo style={{ fontSize: '0.72rem' }} />
                        <span>Reset</span>
                    </button>

                    <button
                        type="button"
                        className="btn-editor-run"
                        onClick={runCode}
                        disabled={isRunning}
                    >
                        {isRunning ? (
                            <>
                                <FaSpinner className="spin" />
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <FaPlay style={{ fontSize: '0.68rem' }} />
                                <span>Run Code</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="clean-editor-area">
                <Editor
                    height="100%"
                    language={getMonacoLanguage()}
                    value={code}
                    onChange={handleCodeChange}
                    theme="light"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        fontFamily: "'JetBrains Mono', Consolas, monospace",
                        fontLigatures: true,
                        padding: { top: 12, bottom: 12 },
                        renderLineHighlight: 'all',
                        smoothScrolling: true,
                        tabSize: 4,
                        wordWrap: 'on'
                    }}
                />
            </div>

            {/* Simple Bottom Console / Test Panel */}
            <div className={`clean-console ${!isConsoleOpen ? 'collapsed' : ''}`}>
                {/* Console Bar */}
                <div className="clean-console-header">
                    {!showCustomInput ? (
                        <div className="console-case-tabs">
                            {casesToDisplay.map((tc, idx) => {
                                const isHidden = tc.isHidden || (idx >= 2 && !testResults);
                                const hasRun = Boolean(testResults);
                                const isPassed = tc.passed;

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`case-pill-btn ${selectedCaseIdx === idx ? 'active' : ''} ${hasRun ? (isPassed ? 'pass' : 'fail') : ''}`}
                                        onClick={() => setSelectedCaseIdx(idx)}
                                    >
                                        {hasRun && (
                                            isPassed ? <FaCheckCircle className="pill-icon pass" /> : <FaTimesCircle className="pill-icon fail" />
                                        )}
                                        <span>Case {idx + 1}</span>
                                        {isHidden && <FaLock className="pill-lock-icon" title="Hidden Test Case" />}
                                    </button>
                                );
                            })}

                            {testResults && (
                                <span className={`console-score-badge ${testResults.passedTests === testResults.totalTests ? 'all-pass' : 'some-fail'}`}>
                                    {testResults.passedTests} / {testResults.totalTests} Passed
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="console-custom-header">
                            <span>Standard Input / Output Console</span>
                        </div>
                    )}

                    <button
                        type="button"
                        className="btn-toggle-console"
                        onClick={() => setIsConsoleOpen(prev => !prev)}
                        title={isConsoleOpen ? 'Collapse' : 'Expand'}
                    >
                        {isConsoleOpen ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>

                {/* Console Body */}
                {isConsoleOpen && (
                    <div className="clean-console-body">
                        {errorMessage ? (
                            <div className="console-error-box">
                                {errorMessage}
                            </div>
                        ) : showCustomInput ? (
                            /* Custom Input/Output Split */
                            <div className="custom-input-wrap">
                                <div className="custom-box">
                                    <span className="case-lbl">Input (stdin)</span>
                                    <textarea
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value)}
                                        placeholder="Type standard input here..."
                                        rows={3}
                                        className="custom-textarea"
                                    />
                                    <button
                                        type="button"
                                        className="btn-run-stdin"
                                        onClick={runCustom}
                                        disabled={isCustomRunning}
                                    >
                                        {isCustomRunning ? 'Executing...' : 'Run with Custom Input'}
                                    </button>
                                </div>
                                <div className="custom-box">
                                    <span className="case-lbl">Output</span>
                                    <pre className="custom-output-pre">
                                        {customOutput || '(Output will appear here)'}
                                    </pre>
                                </div>
                            </div>
                        ) : activeCase ? (
                            isCurrentHidden ? (
                                /* Hidden Test Case View: Only Shows Passed / Failed */
                                <div className="hidden-case-card">
                                    <div className="hidden-case-top">
                                        <div className="hidden-tag">
                                            <FaLock /> Hidden Test Case #{selectedCaseIdx + 1}
                                        </div>
                                        <span className="hidden-note">
                                            Inputs & expected outputs are hidden to verify overall algorithm correctness
                                        </span>
                                    </div>

                                    <div className="hidden-status-row">
                                        {testResults ? (
                                            <div className={`hidden-result-pill ${activeCase.passed ? 'passed' : 'failed'}`}>
                                                {activeCase.passed ? <FaCheckCircle /> : <FaTimesCircle />}
                                                <span>{activeCase.passed ? 'TEST CASE PASSED' : 'TEST CASE FAILED'}</span>
                                            </div>
                                        ) : (
                                            <div className="hidden-unrun-pill">
                                                <span>🔒 Not evaluated yet — Click "Run Code" to test</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Public Test Case View */
                                <div className="public-case-grid">
                                    <div className="case-col">
                                        <span className="case-lbl">Input</span>
                                        <pre className="case-box-pre">{activeCase.input || '(empty)'}</pre>
                                    </div>
                                    <div className="case-col">
                                        <span className="case-lbl">Expected Output</span>
                                        <pre className="case-box-pre">{activeCase.expectedOutput || activeCase.output || '(empty)'}</pre>
                                    </div>
                                    {testResults && (
                                        <div className="case-col">
                                            <span className="case-lbl">Your Output</span>
                                            <pre className={`case-box-pre ${activeCase.passed ? 'pass-box' : 'fail-box'}`}>
                                                {activeCase.actualOutput || '(no output)'}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className="console-empty">
                                Click <strong>"Run Code"</strong> to test your solution.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CodeEditor;
