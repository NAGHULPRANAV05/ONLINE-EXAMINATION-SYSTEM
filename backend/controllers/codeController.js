const { executeCode } = require('../services/codeExecutor');

// @desc    Execute code with test cases
// @route   POST /api/code/execute
// @access  Private
exports.executeCodeController = async (req, res) => {
    try {
        const { language, code, testCases } = req.body;

        // Validate input
        if (!language || !code || !testCases || !Array.isArray(testCases)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide language, code, and test cases'
            });
        }

        // Validate language
        const supportedLanguages = ['c', 'cpp', 'java', 'python'];
        if (!supportedLanguages.includes(language)) {
            return res.status(400).json({
                success: false,
                message: 'Unsupported language. Supported: c, cpp, java, python'
            });
        }

        // Execute code
        const result = await executeCode(language, code, testCases);

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Code execution error',
            error: error.message
        });
    }
};
