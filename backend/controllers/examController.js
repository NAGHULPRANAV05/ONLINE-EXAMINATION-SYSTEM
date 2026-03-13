const Exam = require('../models/Exam');
const Question = require('../models/Question');

// @desc    Create exam
// @route   POST /api/exams
// @access  Private/Admin
exports.createExam = async (req, res) => {
    try {
        const { title, description, subject, duration, questions, difficulty } = req.body;

        // Calculate total marks
        const questionDocs = await Question.find({ _id: { $in: questions } });
        const totalMarks = questionDocs.reduce((sum, q) => sum + q.marks, 0);

        const exam = await Exam.create({
            title,
            description,
            subject,
            duration,
            totalMarks,
            questions,
            difficulty,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
exports.getAllExams = async (req, res) => {
    try {
        const { subject, isActive } = req.query;

        const filter = {};
        if (subject) filter.subject = subject;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const exams = await Exam.find(filter)
            .populate('subject', 'name category')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: exams.length,
            exams
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private
exports.getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('subject', 'name category language')
            .populate('questions');

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        // Convert to object so we can modify it
        const examObj = exam.toObject();

        // Filter out any null/unpopulated questions
        examObj.questions = examObj.questions.filter(q => q && typeof q === 'object' && q.questionText);

        // If user is student, hide correct answers
        if (req.user.role === 'student') {
            examObj.questions = examObj.questions.map(question => {
                if (question.type === 'mcq') {
                    delete question.correctAnswer;
                }
                return question;
            });
        }

        res.status(200).json({
            success: true,
            exam: examObj
        });
    } catch (error) {
        console.error('Error in getExamById:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
exports.updateExam = async (req, res) => {
    try {
        // If questions are being updated, recalculate total marks
        if (req.body.questions) {
            const questionDocs = await Question.find({ _id: { $in: req.body.questions } });
            req.body.totalMarks = questionDocs.reduce((sum, q) => sum + q.marks, 0);
        }

        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Exam updated successfully',
            exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
exports.deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Exam deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Publish/Unpublish exam
// @route   PATCH /api/exams/:id/publish
// @access  Private/Admin
exports.publishExam = async (req, res) => {
    try {
        const { isActive } = req.body;

        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        );

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Exam ${isActive ? 'published' : 'unpublished'} successfully`,
            exam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
