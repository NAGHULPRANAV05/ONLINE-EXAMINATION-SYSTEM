const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide exam title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide exam description'],
        trim: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please specify subject']
    },
    duration: {
        type: Number,
        required: [true, 'Please specify duration in minutes'],
        min: 1
    },
    totalMarks: {
        type: Number,
        required: [true, 'Please specify total marks']
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);
