const Question = require('../models/Question');

// @desc    Create question
// @route   POST /api/questions
// @access  Private/Admin
exports.createQuestion = async (req, res) => {
    try {
        const question = await Question.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            question
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private
exports.getAllQuestions = async (req, res) => {
    try {
        const { subject, type, difficulty } = req.query;

        const filter = {};
        if (subject) filter.subject = subject;
        if (type) filter.type = type;
        if (difficulty) filter.difficulty = difficulty;

        const questions = await Question.find(filter)
            .populate('subject', 'name category')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: questions.length,
            questions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get question by ID
// @route   GET /api/questions/:id
// @access  Private
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate('subject', 'name category');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            question
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private/Admin
exports.updateQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            question
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Generate questions using AI
// @route   POST /api/questions/generate-ai
// @access  Private/Admin
exports.generateAIQuestions = async (req, res) => {
    try {
        const { type, topic, subject, difficulty, count, language } = req.body;

        // Validation
        if (!type || !topic || !subject || !difficulty) {
            return res.status(400).json({
                success: false,
                message: 'Please provide type, topic, subject, and difficulty'
            });
        }

        if (!['mcq', 'coding'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "mcq" or "coding"'
            });
        }

        const aiService = require('../services/aiService');
        const Subject = require('../models/Subject');

        // Get subject details
        const subjectDoc = await Subject.findById(subject);
        if (!subjectDoc) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        let generatedQuestions = [];

        if (type === 'mcq') {
            const questionCount = count || 5;
            const mcqQuestions = await aiService.generateMCQQuestions(
                topic,
                subjectDoc.name,
                difficulty,
                questionCount
            );

            generatedQuestions = mcqQuestions.map(q => ({
                type: 'mcq',
                subject: subject,
                difficulty: difficulty,
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
                explanation: q.explanation
            }));
        } else {
            const codingQuestion = await aiService.generateCodingQuestion(
                topic,
                difficulty,
                language || 'any'
            );

            generatedQuestions = [{
                type: 'coding',
                subject: subject,
                difficulty: difficulty,
                questionText: codingQuestion.questionText,
                testCases: codingQuestion.testCases,
                marks: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15,
                hints: codingQuestion.hints
            }];
        }

        res.status(200).json({
            success: true,
            message: `Generated ${generatedQuestions.length} ${type} question(s)`,
            questions: generatedQuestions
        });
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate questions with AI',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

