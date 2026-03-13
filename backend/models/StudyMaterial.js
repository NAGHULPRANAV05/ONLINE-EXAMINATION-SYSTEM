const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    subjectName: {
        type: String,
        required: [true, 'Please provide a subject name'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Please provide a department'],
        trim: true
    },
    yearSemester: {
        type: String,
        required: [true, 'Please provide year/semester'],
        trim: true
    },
    // 'file' or 'link'
    materialType: {
        type: String,
        enum: ['file', 'link'],
        default: 'file'
    },
    // File fields (only for materialType === 'file')
    fileName: {
        type: String
    },
    filePath: {
        type: String
    },
    fileSize: {
        type: Number
    },
    fileType: {
        type: String
    },
    // YouTube link (only for materialType === 'link')
    youtubeUrl: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
