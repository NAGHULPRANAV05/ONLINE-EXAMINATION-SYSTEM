const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['mcq', 'coding'],
        required: [true, 'Please specify question type']
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please specify subject']
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    questionText: {
        type: String,
        required: [true, 'Please provide question text'],
        trim: true
    },
    // For MCQ questions
    options: {
        type: [String],
        required: function () {
            return this.type === 'mcq';
        },
        validate: {
            validator: function (v) {
                return this.type !== 'mcq' || (v && v.length >= 2);
            },
            message: 'MCQ must have at least 2 options'
        }
    },
    correctAnswer: {
        type: String,
        required: function () {
            return this.type === 'mcq';
        }
    },
    // For coding questions
    testCases: {
        type: [{
            input: String,
            output: String
        }],
        required: function () {
            return this.type === 'coding';
        },
        validate: {
            validator: function (v) {
                return this.type !== 'coding' || (v && v.length >= 1);
            },
            message: 'Coding question must have at least 1 test case'
        }
    },
    marks: {
        type: Number,
        required: [true, 'Please specify marks'],
        min: 1
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);
