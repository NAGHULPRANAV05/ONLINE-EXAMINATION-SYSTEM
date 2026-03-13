const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Execute code with test cases
exports.executeCode = async (language, code, testCases) => {
    const results = [];
    let totalTests = testCases.length;
    let passedTests = 0;

    for (const testCase of testCases) {
        try {
            const result = await runSingleTest(language, code, testCase);
            results.push(result);
            if (result.passed) passedTests++;
        } catch (error) {
            results.push({
                input: testCase.input,
                expectedOutput: testCase.output,
                actualOutput: error.message,
                passed: false,
                error: true
            });
        }
    }

    return {
        testResults: results,
        totalTests,
        passedTests
    };
};

// Run a single test case
async function runSingleTest(language, code, testCase) {
    const tmpDir = path.join(__dirname, '..', 'tmp');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileId = `${timestamp}_${randomId}`;

    let filePath, compiledPath, command;

    try {
        switch (language) {
            case 'c':
                filePath = path.join(tmpDir, `${fileId}.c`);
                compiledPath = path.join(tmpDir, `${fileId}.exe`);
                await fs.writeFile(filePath, code);

                // Compile
                await execPromise(`gcc "${filePath}" -o "${compiledPath}"`);

                // Execute
                command = `"${compiledPath}"`;
                break;

            case 'cpp':
                filePath = path.join(tmpDir, `${fileId}.cpp`);
                compiledPath = path.join(tmpDir, `${fileId}.exe`);
                await fs.writeFile(filePath, code);

                // Compile
                await execPromise(`g++ "${filePath}" -o "${compiledPath}"`);

                // Execute
                command = `"${compiledPath}"`;
                break;

            case 'java':
                const className = extractJavaClassName(code);
                filePath = path.join(tmpDir, `${className}.java`);
                await fs.writeFile(filePath, code);

                // Compile
                await execPromise(`javac "${filePath}"`);

                // Execute
                command = `java -cp "${tmpDir}" ${className}`;
                break;

            case 'python':
                filePath = path.join(tmpDir, `${fileId}.py`);
                await fs.writeFile(filePath, code);

                // Execute
                command = `python "${filePath}"`;
                break;

            default:
                throw new Error('Unsupported language');
        }

        // Run with input
        const output = await execPromise(command, testCase.input, 5000);
        const actualOutput = output.trim();
        const expectedOutput = testCase.output.trim();
        const passed = actualOutput === expectedOutput;

        // Cleanup
        await cleanup(language, filePath, compiledPath, tmpDir, extractJavaClassName(code));

        return {
            input: testCase.input,
            expectedOutput,
            actualOutput,
            passed
        };
    } catch (error) {
        // Cleanup on error
        try {
            await cleanup(language, filePath, compiledPath, tmpDir, extractJavaClassName(code));
        } catch (cleanupError) {
            // Ignore cleanup errors
        }

        return {
            input: testCase.input,
            expectedOutput: testCase.output,
            actualOutput: error.message,
            passed: false,
            error: true
        };
    }
}

// Execute command with input and timeout
function execPromise(command, input = '', timeout = 5000) {
    return new Promise((resolve, reject) => {
        const process = exec(command, { timeout }, (error, stdout, stderr) => {
            if (error) {
                if (error.killed) {
                    reject(new Error('Time limit exceeded'));
                } else {
                    reject(new Error(stderr || error.message));
                }
            } else {
                resolve(stdout);
            }
        });

        if (input) {
            process.stdin.write(input);
            process.stdin.end();
        }
    });
}

// Extract Java class name from code
function extractJavaClassName(code) {
    const match = code.match(/public\s+class\s+(\w+)/);
    return match ? match[1] : 'Main';
}

// Cleanup temporary files
async function cleanup(language, filePath, compiledPath, tmpDir, className) {
    try {
        if (filePath) await fs.unlink(filePath).catch(() => { });

        if (language === 'c' || language === 'cpp') {
            if (compiledPath) await fs.unlink(compiledPath).catch(() => { });
        }

        if (language === 'java') {
            const classFile = path.join(tmpDir, `${className}.class`);
            await fs.unlink(classFile).catch(() => { });
        }
    } catch (error) {
        // Ignore cleanup errors
    }
}
