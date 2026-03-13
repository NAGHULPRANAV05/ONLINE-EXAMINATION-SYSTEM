const Subject = require('../models/Subject');

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private/Admin
exports.createSubject = async (req, res) => {
    try {
        const { name, description, category, language } = req.body;

        const subjectData = { name, description, category };
        // Only include language for programming subjects and when it's not empty
        if (category === 'programming' && language) {
            subjectData.language = language;
        }

        const subject = await Subject.create(subjectData);

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            subject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
exports.getAllSubjects = async (req, res) => {
    try {
        const { category, isActive } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const subjects = await Subject.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: subjects.length,
            subjects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Public
exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.status(200).json({
            success: true,
            subject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
exports.updateSubject = async (req, res) => {
    try {
        const updateData = { ...req.body };
        // Strip language if category is not programming or language is empty
        if (updateData.category !== 'programming' || !updateData.language) {
            delete updateData.language;
        }
        // If switching from programming to theory, unset the language field
        if (updateData.category === 'theory') {
            updateData.$unset = { language: 1 };
            delete updateData.language;
        }

        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subject updated successfully',
            subject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
