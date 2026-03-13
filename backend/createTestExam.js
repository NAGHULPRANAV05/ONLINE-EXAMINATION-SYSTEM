// Script to create a test coding exam
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Import models
const Subject = require('./models/Subject');
const Question = require('./models/Question');
const Exam = require('./models/Exam');
const User = require('./models/User');

async function createTestCodingExam() {
    try {
        console.log('\n🚀 Creating test coding exam...\n');

        // 1. Find any admin user
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('⚠️  No admin user found. Creating one...');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            admin = await User.create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('✅ Created admin user:', admin.email);
            console.log('   Password: admin123');
        } else {
            console.log('✅ Found admin user:', admin.email);
        }

        // 2. Create a programming subject
        let subject = await Subject.findOne({ code: 'PROG101' });
        if (!subject) {
            subject = await Subject.create({
                name: 'Programming Fundamentals',
                code: 'PROG101',
                description: 'Introduction to programming concepts and problem solving',
                category: 'programming',
                language: 'python',
                createdBy: admin._id
            });
            console.log('✅ Created subject:', subject.name);
        } else {
            console.log('✅ Found existing subject:', subject.name);
        }

        // 3. Create coding questions
        const codingQuestions = [];

        // Question 1: Two Sum
        const q1 = await Question.create({
            type: 'coding',
            subject: subject._id,
            difficulty: 'easy',
            questionText: `Two Sum Problem

Write a function that takes an array of integers and a target sum, and returns the indices of two numbers that add up to the target.

Input Format:
- First line: space-separated integers (the array)
- Second line: target integer

Output Format:
- Two space-separated indices (0-indexed)

Constraints:
- 2 ≤ array length ≤ 1000
- -10^9 ≤ array[i] ≤ 10^9
- Exactly one solution exists

Example:
Input: 
2 7 11 15
9

Output:
0 1

Explanation: nums[0] + nums[1] = 2 + 7 = 9`,
            testCases: [
                { input: '2 7 11 15\n9', output: '0 1' },
                { input: '3 2 4\n6', output: '1 2' },
                { input: '3 3\n6', output: '0 1' }
            ],
            marks: 5,
            createdBy: admin._id
        });
        codingQuestions.push(q1);
        console.log('✅ Created Question 1: Two Sum');

        // Question 2: Palindrome Check
        const q2 = await Question.create({
            type: 'coding',
            subject: subject._id,
            difficulty: 'easy',
            questionText: `Palindrome Checker

Write a function to check if a given string is a palindrome (reads the same forwards and backwards).

Input Format:
- A single string (may contain spaces and punctuation)

Output Format:
- "true" if palindrome, "false" otherwise
- Ignore spaces, punctuation, and case

Constraints:
- 1 ≤ string length ≤ 1000

Example:
Input: A man a plan a canal Panama
Output: true

Input: race a car
Output: false`,
            testCases: [
                { input: 'A man a plan a canal Panama', output: 'true' },
                { input: 'race a car', output: 'false' },
                { input: 'racecar', output: 'true' }
            ],
            marks: 5,
            createdBy: admin._id
        });
        codingQuestions.push(q2);
        console.log('✅ Created Question 2: Palindrome Check');

        // Question 3: Fibonacci
        const q3 = await Question.create({
            type: 'coding',
            subject: subject._id,
            difficulty: 'medium',
            questionText: `Fibonacci Number

Write a function to calculate the nth Fibonacci number.

The Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21...

Input Format:
- A single integer n (0-indexed)

Output Format:
- The nth Fibonacci number

Constraints:
- 0 ≤ n ≤ 30

Example:
Input: 6
Output: 8

Explanation: F(6) = 8 (sequence: 0,1,1,2,3,5,8)`,
            testCases: [
                { input: '0', output: '0' },
                { input: '1', output: '1' },
                { input: '6', output: '8' },
                { input: '10', output: '55' }
            ],
            marks: 10,
            createdBy: admin._id
        });
        codingQuestions.push(q3);
        console.log('✅ Created Question 3: Fibonacci');

        // 4. Create exam
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // Valid for 7 days

        const exam = await Exam.create({
            title: 'Python Coding Challenge',
            description: 'Test your Python programming skills with these coding problems',
            subject: subject._id,
            questions: codingQuestions.map(q => q._id),
            duration: 60, // 60 minutes
            totalMarks: codingQuestions.reduce((sum, q) => sum + q.marks, 0),
            startDate,
            endDate,
            isActive: true,
            createdBy: admin._id
        });

        console.log('✅ Created exam:', exam.title);
        console.log('\n📊 Exam Details:');
        console.log('   - ID:', exam._id);
        console.log('   - Questions:', exam.questions.length);
        console.log('   - Total Marks:', exam.totalMarks);
        console.log('   - Duration:', exam.duration, 'minutes');
        console.log('   - Status:', exam.isActive ? 'Active ✅' : 'Inactive ❌');

        console.log('\n🎯 TO ACCESS THE EXAM:');
        console.log('   1. Go to: http://localhost:3000');
        console.log('   2. Login as student (or create a student account)');
        console.log('   3. You will see "Python Coding Challenge" in available exams');
        console.log('   4. Click "Start Exam" to see the split-screen layout!');
        console.log('\n   OR directly go to:');
        console.log(`   http://localhost:3000/student/exam/${exam._id}`);
        console.log('\n✨ Done! The coding exam is ready to test.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
createTestCodingExam();
