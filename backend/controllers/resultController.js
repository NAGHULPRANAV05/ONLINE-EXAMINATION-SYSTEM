const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');
const { executeCode } = require('../services/codeExecutor');

// @desc    Submit exam
// @route   POST /api/results/submit
// @access  Private
exports.submitExam = async (req, res) => {
    try {
        const { examId, answers, timeTaken, tabSwitchCount, proctoringTerminated } = req.body;

        console.log('📝 Exam submission received:', { examId, answersCount: answers?.length, timeTaken, tabSwitchCount });

        // Get exam with questions
        const exam = await Exam.findById(examId).populate('questions subject');

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        if (!exam.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Exam is not active'
            });
        }

        // Determine subject ID (handle both populated object and raw ObjectId)
        const subjectId = exam.subject && exam.subject._id ? exam.subject._id : exam.subject;

        if (!subjectId) {
            return res.status(400).json({
                success: false,
                message: 'Exam has no associated subject'
            });
        }

        // Evaluate answers
        const evaluatedAnswers = [];
        let totalScore = 0;

        for (const answer of answers) {
            const question = exam.questions.find(q => q._id.toString() === answer.questionId);

            if (!question) continue;

            let isCorrect = false;
            let marksObtained = 0;
            let executionResult = null;

            if (question.type === 'mcq') {
                // MCQ evaluation
                isCorrect = answer.userAnswer === question.correctAnswer;
                marksObtained = isCorrect ? question.marks : 0;
            } else if (question.type === 'coding') {
                // Coding question evaluation
                try {
                    const language = exam.subject && exam.subject.language ? exam.subject.language : 'python';
                    executionResult = await executeCode(language, answer.userAnswer, question.testCases);

                    // Calculate partial marks
                    const passPercentage = executionResult.totalTests > 0
                        ? executionResult.passedTests / executionResult.totalTests
                        : 0;
                    marksObtained = Math.round(passPercentage * question.marks);
                    isCorrect = executionResult.passedTests === executionResult.totalTests;
                } catch (error) {
                    console.error('❌ Code execution error:', error.message);
                    executionResult = {
                        testResults: [],
                        totalTests: question.testCases ? question.testCases.length : 0,
                        passedTests: 0,
                        error: error.message
                    };
                }
            }

            totalScore += marksObtained;

            evaluatedAnswers.push({
                question: question._id,
                userAnswer: answer.userAnswer,
                isCorrect,
                marksObtained,
                executionResult
            });
        }

        // Calculate percentage (handle zero totalMarks)
        const percentage = exam.totalMarks > 0 ? (totalScore / exam.totalMarks) * 100 : 0;

        // Create result
        const result = await Result.create({
            student: req.user.id,
            exam: examId,
            subject: subjectId,
            answers: evaluatedAnswers,
            totalScore,
            percentage,
            timeTaken: timeTaken || 0,
            tabSwitchCount: tabSwitchCount || 0,
            proctoringTerminated: proctoringTerminated || false
        });

        console.log('✅ Exam submitted successfully:', { resultId: result._id, totalScore, percentage });

        res.status(201).json({
            success: true,
            message: 'Exam submitted successfully',
            result: {
                id: result._id,
                totalScore,
                percentage,
                totalMarks: exam.totalMarks
            }
        });
    } catch (error) {
        console.error('❌ Exam submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get student results
// @route   GET /api/results/student/:studentId
// @access  Private
exports.getStudentResults = async (req, res) => {
    try {
        const studentId = req.params.studentId;

        // Students can only view their own results
        if (req.user.role === 'student' && req.user.id !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const results = await Result.find({ student: studentId })
            .populate('exam', 'title')
            .populate('subject', 'name')
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get result by ID
// @route   GET /api/results/:id
// @access  Private
exports.getResultById = async (req, res) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('student', 'name email')
            .populate('exam', 'title totalMarks')
            .populate('subject', 'name')
            .populate('answers.question');

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not found'
            });
        }

        // Students can only view their own results
        if (req.user.role === 'student' && req.user.id !== result.student._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all results (Admin)
// @route   GET /api/results
// @access  Private/Admin
exports.getAllResults = async (req, res) => {
    try {
        const { subject, exam } = req.query;

        const filter = {};
        if (subject) filter.subject = subject;
        if (exam) filter.exam = exam;

        const results = await Result.find(filter)
            .populate('student', 'name email')
            .populate('exam', 'title')
            .populate('subject', 'name')
            .sort({ submittedAt: -1 });

        res.status(200).json({
            success: true,
            count: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get analytics (Admin)
// @route   GET /api/results/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
    try {
        // Total students
        const totalStudents = await User.countDocuments({ role: 'student' });

        // Total exams taken
        const totalExamsTaken = await Result.countDocuments();

        // Average score
        const avgResult = await Result.aggregate([
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: '$percentage' }
                }
            }
        ]);

        const averageScore = avgResult.length > 0 ? avgResult[0].avgScore : 0;

        // Subject-wise performance
        const subjectPerformance = await Result.aggregate([
            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subject',
                    foreignField: '_id',
                    as: 'subjectInfo'
                }
            },
            {
                $unwind: '$subjectInfo'
            },
            {
                $group: {
                    _id: '$subject',
                    subjectName: { $first: '$subjectInfo.name' },
                    avgScore: { $avg: '$percentage' },
                    totalAttempts: { $sum: 1 }
                }
            },
            {
                $sort: { avgScore: -1 }
            }
        ]);

        // Pass/Fail statistics (assuming 40% is passing)
        const passCount = await Result.countDocuments({ percentage: { $gte: 40 } });
        const failCount = await Result.countDocuments({ percentage: { $lt: 40 } });

        res.status(200).json({
            success: true,
            analytics: {
                totalStudents,
                totalExamsTaken,
                averageScore: averageScore.toFixed(2),
                passCount,
                failCount,
                subjectPerformance
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete result
// @route   DELETE /api/results/:id
// @access  Private/Admin
exports.deleteResult = async (req, res) => {
    try {
        const result = await Result.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Result deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
