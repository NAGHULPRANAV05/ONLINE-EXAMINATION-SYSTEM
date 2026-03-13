const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        userAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        marksObtained: Number,
        executionResult: {
            testResults: [{
                input: String,
                expectedOutput: String,
                actualOutput: String,
                passed: Boolean
            }],
            totalTests: Number,
            passedTests: Number
        }
    }],
    totalScore: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    timeTaken: {
        type: Number,
        required: true
    },
    tabSwitchCount: {
        type: Number,
        default: 0
    },
    proctoringTerminated: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Result', resultSchema);
