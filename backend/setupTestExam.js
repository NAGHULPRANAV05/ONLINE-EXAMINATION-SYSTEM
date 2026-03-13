const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Question = require('./models/Question');
const Exam = require('./models/Exam');
require('dotenv').config();

async function createTestExam() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a Theory Subject
        let theorySubject = await Subject.findOne({ name: 'General Knowledge' });
        if (!theorySubject) {
            theorySubject = await Subject.create({
                name: 'General Knowledge',
                description: 'Test your general knowledge',
                category: 'theory'
            });
            console.log('Created Theory Subject');
        }

        // Create MCQ Questions
        const mcqQuestions = [
            {
                subject: theorySubject._id,
                questionText: 'What is the capital of France?',
                type: 'mcq',
                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                correctAnswer: 'C',
                marks: 5,
                difficulty: 'easy'
            },
            {
                subject: theorySubject._id,
                questionText: 'Which planet is known as the Red Planet?',
                type: 'mcq',
                options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
                correctAnswer: 'B',
                marks: 5,
                difficulty: 'easy'
            },
            {
                subject: theorySubject._id,
                questionText: 'What is the largest ocean on Earth?',
                type: 'mcq',
                options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
                correctAnswer: 'D',
                marks: 5,
                difficulty: 'easy'
            },
            {
                subject: theorySubject._id,
                questionText: 'Who wrote "Romeo and Juliet"?',
                type: 'mcq',
                options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
                correctAnswer: 'B',
                marks: 5,
                difficulty: 'medium'
            },
            {
                subject: theorySubject._id,
                questionText: 'What is the chemical symbol for Gold?',
                type: 'mcq',
                options: ['Go', 'Gd', 'Au', 'Ag'],
                correctAnswer: 'C',
                marks: 5,
                difficulty: 'medium'
            }
        ];

        // Delete old questions and create new ones
        await Question.deleteMany({ subject: theorySubject._id });
        const createdQuestions = await Question.insertMany(mcqQuestions);
        console.log(`Created ${createdQuestions.length} MCQ questions`);

        // Get admin user
        const User = require('./models/User');
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin found. Please register an admin first.');
            process.exit(1);
        }

        // Create the exam
        await Exam.deleteMany({ title: 'General Knowledge Quiz' });
        const exam = await Exam.create({
            title: 'General Knowledge Quiz',
            description: 'Test your general knowledge with this fun quiz!',
            subject: theorySubject._id,
            questions: createdQuestions.map(q => q._id),
            duration: 15,
            totalMarks: 25,
            passingMarks: 15,
            instructions: 'Answer all questions. Each question carries 5 marks.',
            isActive: true,
            createdBy: admin._id
        });
        console.log('Created Exam:', exam.title);

        // Also create a Programming Subject with Coding Questions
        let codingSubject = await Subject.findOne({ name: 'Python Basics' });
        if (!codingSubject) {
            codingSubject = await Subject.create({
                name: 'Python Basics',
                description: 'Basic Python programming',
                category: 'programming',
                language: 'python'
            });
            console.log('Created Programming Subject');
        }

        // Create Coding Questions
        const codingQuestions = [
            {
                subject: codingSubject._id,
                questionText: 'Write a function that returns the sum of two numbers.\n\nExample:\nInput: 3, 5\nOutput: 8',
                type: 'coding',
                marks: 10,
                difficulty: 'easy',
                testCases: [
                    { input: '3\n5', output: '8', isHidden: false },
                    { input: '10\n20', output: '30', isHidden: false },
                    { input: '-5\n5', output: '0', isHidden: true }
                ]
            },
            {
                subject: codingSubject._id,
                questionText: 'Write a function to check if a number is even or odd.\n\nPrint "Even" if the number is even, otherwise print "Odd".\n\nExample:\nInput: 4\nOutput: Even',
                type: 'coding',
                marks: 10,
                difficulty: 'easy',
                testCases: [
                    { input: '4', output: 'Even', isHidden: false },
                    { input: '7', output: 'Odd', isHidden: false },
                    { input: '0', output: 'Even', isHidden: true }
                ]
            }
        ];

        await Question.deleteMany({ subject: codingSubject._id });
        const createdCodingQuestions = await Question.insertMany(codingQuestions);
        console.log(`Created ${createdCodingQuestions.length} Coding questions`);

        // Create coding exam
        await Exam.deleteMany({ title: 'Python Coding Test' });
        const codingExam = await Exam.create({
            title: 'Python Coding Test',
            description: 'Test your Python programming skills with coding challenges!',
            subject: codingSubject._id,
            questions: createdCodingQuestions.map(q => q._id),
            duration: 30,
            totalMarks: 20,
            passingMarks: 10,
            instructions: 'Write Python code to solve each problem. Your code will be automatically tested.',
            isActive: true,
            createdBy: admin._id
        });
        console.log('Created Coding Exam:', codingExam.title);

        console.log('\n✅ Test data created successfully!');
        console.log('\n📋 Available Exams:');
        console.log('1. General Knowledge Quiz (5 MCQ questions, 15 mins)');
        console.log('2. Python Coding Test (2 coding questions, 30 mins)');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestExam();
