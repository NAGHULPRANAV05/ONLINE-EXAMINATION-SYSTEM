const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a subject name'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    category: {
        type: String,
        enum: ['theory', 'programming'],
        required: [true, 'Please specify category']
    },
    language: {
        type: String,
        enum: ['c', 'cpp', 'java', 'python'],
        required: function () {
            return this.category === 'programming';
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
