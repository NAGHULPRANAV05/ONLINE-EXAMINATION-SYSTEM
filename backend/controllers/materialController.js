const StudyMaterial = require('../models/StudyMaterial');
const path = require('path');
const fs = require('fs');

// Upload a new study material (file or YouTube link)
exports.uploadMaterial = async (req, res) => {
    try {
        const { title, description, subjectName, department, yearSemester, materialType, youtubeUrl } = req.body;

        if (!title || !description || !subjectName || !department || !yearSemester) {
            // Remove uploaded file if validation fails
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: title, description, subjectName, department, yearSemester'
            });
        }

        const type = materialType || 'file';

        if (type === 'link') {
            if (!youtubeUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a YouTube URL'
                });
            }

            const material = await StudyMaterial.create({
                title,
                description,
                subjectName,
                department,
                yearSemester,
                materialType: 'link',
                youtubeUrl,
                uploadedBy: req.user._id
            });

            return res.status(201).json({ success: true, material });
        }

        // File upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const material = await StudyMaterial.create({
            title,
            description,
            subjectName,
            department,
            yearSemester,
            materialType: 'file',
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            fileType: path.extname(req.file.originalname).slice(1).toLowerCase(),
            uploadedBy: req.user._id
        });

        res.status(201).json({ success: true, material });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Error uploading material',
            error: error.message
        });
    }
};

// Get all study materials
exports.getAllMaterials = async (req, res) => {
    try {
        const { subjectName, department, yearSemester } = req.query;
        const filter = {};

        if (subjectName) filter.subjectName = { $regex: subjectName, $options: 'i' };
        if (department) filter.department = { $regex: department, $options: 'i' };
        if (yearSemester) filter.yearSemester = yearSemester;

        const materials = await StudyMaterial.find(filter)
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: materials.length, materials });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching materials',
            error: error.message
        });
    }
};

// Get single study material
exports.getMaterialById = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id)
            .populate('uploadedBy', 'name');

        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        res.json({ success: true, material });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching material',
            error: error.message
        });
    }
};

// Update study material
exports.updateMaterial = async (req, res) => {
    try {
        let material = await StudyMaterial.findById(req.params.id);

        if (!material) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        const updateData = {};
        const fields = ['title', 'description', 'subjectName', 'department', 'yearSemester', 'youtubeUrl'];
        fields.forEach(field => {
            if (req.body[field]) updateData[field] = req.body[field];
        });

        // If a new file is uploaded, replace the old one
        if (req.file) {
            if (material.filePath && fs.existsSync(material.filePath)) {
                fs.unlinkSync(material.filePath);
            }
            updateData.fileName = req.file.originalname;
            updateData.filePath = req.file.path;
            updateData.fileSize = req.file.size;
            updateData.fileType = path.extname(req.file.originalname).slice(1).toLowerCase();
        }

        material = await StudyMaterial.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('uploadedBy', 'name');

        res.json({ success: true, material });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({
            success: false,
            message: 'Error updating material',
            error: error.message
        });
    }
};

// Delete study material
exports.deleteMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);

        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        // Delete file from disk if it's a file material
        if (material.materialType === 'file' && material.filePath && fs.existsSync(material.filePath)) {
            fs.unlinkSync(material.filePath);
        }

        await StudyMaterial.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting material',
            error: error.message
        });
    }
};

// Download study material file
exports.downloadMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);

        if (!material || material.materialType !== 'file') {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        if (!fs.existsSync(material.filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        res.download(material.filePath, material.fileName);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error downloading material',
            error: error.message
        });
    }
};

// View study material file inline (browser preview)
exports.viewMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);

        if (!material || material.materialType !== 'file') {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        if (!fs.existsSync(material.filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on server' });
        }

        const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'zip': 'application/zip'
        };

        const contentType = mimeTypes[material.fileType] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${material.fileName}"`);

        const fileStream = fs.createReadStream(material.filePath);
        fileStream.pipe(res);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error viewing material',
            error: error.message
        });
    }
};
