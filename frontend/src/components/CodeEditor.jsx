import { useState, useEffect } from 'react';
import {
    FaPlay,
    FaSpinner,
    FaUndo,
    FaCheckCircle,
    FaTimesCircle,
    FaChevronUp,
    FaChevronDown,
    FaFlask,
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
    const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'custom'
    const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
    const [isConsoleOpen, setIsConsoleOpen] = useState(true);

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
        if (window.confirm('Reset code to default template?')) {
            const template = STARTER_TEMPLATES[langKey] || STARTER_TEMPLATES.python;
            setCode(template);
            if (onCodeChange) onCodeChange(template);
            setTestResults(null);
            setErrorMessage('');
        }
    };

    // Run against sample test cases
    const runCode = async () => {
        if (!code.trim()) {
            setErrorMessage('Please write some code first.');
            return;
        }

        setIsRunning(true);
        setErrorMessage('');
        setTestResults(null);
        setIsConsoleOpen(true);
        setActiveTab('tests');

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

    // Run with custom stdin
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

    const currentCase = testResults?.testResults?.[selectedCaseIdx] || null;

    return (
        <div className="clean-editor-wrapper">
            {/* Minimal Toolbar */}
            <div className="clean-editor-toolbar">
                <div className="editor-lang-tag">
                    <span className="lang-indicator-dot"></span>
                    <span>{langKey.toUpperCase()}</span>
                </div>

                <div className="editor-actions">
                    <button
                        type="button"
                        className="btn-editor-action"
                        onClick={handleReset}
                        title="Reset code template"
                    >
                        <FaUndo style={{ fontSize: '0.75rem' }} />
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
                                <FaPlay style={{ fontSize: '0.7rem' }} />
                                <span>Run Code</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor Container */}
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

            {/* Minimal Console Panel */}
            <div className={`clean-console ${!isConsoleOpen ? 'collapsed' : ''}`}>
                {/* Console Bar */}
                <div className="clean-console-header">
                    <div className="console-tabs">
                        <button
                            type="button"
                            className={`c-tab ${activeTab === 'tests' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('tests'); setIsConsoleOpen(true); }}
                        >
                            <FaFlask />
                            <span>Test Cases</span>
                            {testResults && (
                                <span className={`c-badge ${testResults.passedTests === testResults.totalTests ? 'pass' : 'fail'}`}>
                                    {testResults.passedTests}/{testResults.totalTests} Passed
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            className={`c-tab ${activeTab === 'custom' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('custom'); setIsConsoleOpen(true); }}
                        >
                            <FaTerminal />
                            <span>Custom Input</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        className="btn-toggle-console"
                        onClick={() => setIsConsoleOpen(prev => !prev)}
                        title={isConsoleOpen ? 'Collapse Console' : 'Expand Console'}
                    >
                        {isConsoleOpen ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>

                {/* Console Content */}
                {isConsoleOpen && (
                    <div className="clean-console-body">
                        {errorMessage ? (
                            <div className="console-error-box">
                                {errorMessage}
                            </div>
                        ) : activeTab === 'tests' ? (
                            testResults ? (
                                <div className="tests-view">
                                    <div className="test-case-pills">
                                        {testResults.testResults.map((tc, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className={`case-pill ${selectedCaseIdx === idx ? 'active' : ''} ${tc.passed ? 'pass' : 'fail'}`}
                                                onClick={() => setSelectedCaseIdx(idx)}
                                            >
                                                {tc.passed ? <FaCheckCircle /> : <FaTimesCircle />}
                                                <span>Case {idx + 1}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {currentCase && (
                                        <div className="case-content-grid">
                                            <div className="case-col">
                                                <span className="case-col-title">Input</span>
                                                <pre className="case-pre">{currentCase.input || '(empty)'}</pre>
                                            </div>
                                            <div className="case-col">
                                                <span className="case-col-title">Expected Output</span>
                                                <pre className="case-pre">{currentCase.expectedOutput || '(empty)'}</pre>
                                            </div>
                                            <div className="case-col">
                                                <span className="case-col-title">Your Output</span>
                                                <pre className={`case-pre ${currentCase.passed ? 'match' : 'mismatch'}`}>
                                                    {currentCase.actualOutput || '(no output)'}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="console-placeholder">
                                    Click <strong>"Run Code"</strong> to test your solution against test cases.
                                </div>
                            )
                        ) : (
                            /* Custom Input Tab */
                            <div className="custom-input-view">
                                <div className="custom-split">
                                    <div className="custom-col">
                                        <span className="case-col-title">Standard Input</span>
                                        <textarea
                                            value={customInput}
                                            onChange={(e) => setCustomInput(e.target.value)}
                                            placeholder="Enter standard input..."
                                            className="custom-input-box"
                                            rows={3}
                                        />
                                        <button
                                            type="button"
                                            onClick={runCustom}
                                            disabled={isCustomRunning}
                                            className="btn-run-custom"
                                        >
                                            {isCustomRunning ? 'Running...' : 'Run with Input'}
                                        </button>
                                    </div>
                                    <div className="custom-col">
                                        <span className="case-col-title">Standard Output</span>
                                        <pre className="custom-output-box">
                                            {customOutput || '(Output will appear here)'}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CodeEditor;
