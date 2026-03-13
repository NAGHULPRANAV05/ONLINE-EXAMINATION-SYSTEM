const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate demo MCQ questions (used when API key is not configured)
 */
function generateDemoMCQQuestions(topic, subjectName, difficulty, count) {
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push({
            questionText: `[DEMO] Sample ${difficulty} question about ${topic} in ${subjectName}?`,
            options: [
                `Option A for ${topic}`,
                `Option B for ${topic}`,
                `Option C for ${topic}`,
                `Option D for ${topic}`
            ],
            correctAnswer: ['A', 'B', 'C', 'D'][i % 4],
            explanation: `This is a demo question. Get a real Gemini API key from https://aistudio.google.com/app/apikey to generate actual AI-powered questions.`
        });
    }
    return questions;
}

/**
 * Generate demo coding question (used when API key is not configured)
 */
function generateDemoCodingQuestion(topic, difficulty, language) {
    return {
        questionText: `[DEMO] ${difficulty.toUpperCase()} Coding Problem: ${topic}

Write a ${language !== 'any' ? language : 'program'} to solve the following problem related to ${topic}.

Input Format:
- First line contains an integer N

Output Format:
- Print the result

Constraints:
- 1 ≤ N ≤ 1000

Example:
Input: 5
Output: 10

Note: This is a DEMO question. Get a real Gemini API key from https://aistudio.google.com/app/apikey to generate actual AI-powered coding problems.`,
        testCases: [
            { input: '5', output: '10' },
            { input: '10', output: '20' },
            { input: '1', output: '2' }
        ],
        hints: 'This is a demo question for testing purposes. Configure your GEMINI_API_KEY to get real AI-generated questions.'
    };
}


/**
 * Generate MCQ questions using AI
 * @param {string} topic - Topic for questions
 * @param {string} subjectName - Subject name
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {number} count - Number of questions to generate
 * @returns {Promise<Array>} Array of generated questions
 */
exports.generateMCQQuestions = async (topic, subjectName, difficulty, count = 5) => {
    try {
        // DEMO MODE: If no API key, generate sample questions
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.log('⚠️  DEMO MODE: Generating sample questions (API key not configured)');
            return generateDemoMCQQuestions(topic, subjectName, difficulty, count);
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Generate ${count} multiple choice questions about "${topic}" for the subject "${subjectName}".
Difficulty level: ${difficulty}

Requirements:
- Each question should be clear and unambiguous
- Provide exactly 4 options (A, B, C, D)
- Only one option should be correct
- Include a brief explanation for the correct answer

Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks, just pure JSON):
[
  {
    "questionText": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "A",
    "explanation": "Brief explanation why this is correct"
  }
]

Generate exactly ${count} questions in this format.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the JSON response
        let questions;
        try {
            // Remove markdown code blocks if present
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            questions = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', text);
            throw new Error('AI returned invalid JSON format');
        }

        // Validate the response structure
        if (!Array.isArray(questions)) {
            throw new Error('AI response is not an array');
        }

        // Validate each question
        const validatedQuestions = questions.map((q, index) => {
            if (!q.questionText || !Array.isArray(q.options) || !q.correctAnswer) {
                throw new Error(`Invalid question structure at index ${index}`);
            }

            if (q.options.length !== 4) {
                throw new Error(`Question ${index} must have exactly 4 options`);
            }

            if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
                throw new Error(`Question ${index} has invalid correct answer: ${q.correctAnswer}`);
            }

            return {
                questionText: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || 'No explanation provided'
            };
        });

        return validatedQuestions;
    } catch (error) {
        console.error('Error generating MCQ questions:', error);
        throw error;
    }
};

/**
 * Generate a coding question using AI
 * @param {string} topic - Topic for the coding question
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {string} language - Programming language (optional)
 * @returns {Promise<Object>} Generated coding question
 */
exports.generateCodingQuestion = async (topic, difficulty, language = 'any') => {
    try {
        // DEMO MODE: If no API key, generate sample question
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.log('⚠️  DEMO MODE: Generating sample coding question (API key not configured)');
            return generateDemoCodingQuestion(topic, difficulty, language);
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const languageNote = language !== 'any' ? `The solution should be implementable in ${language}.` : '';

        const prompt = `Generate a coding problem about "${topic}".
Difficulty level: ${difficulty}
${languageNote}

Requirements:
- Clear problem statement
- Input/output format specification
- Constraints
- At least 3 test cases with input and expected output
- Test cases should cover edge cases

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just pure JSON):
{
  "questionText": "Problem statement with input/output format and constraints",
  "testCases": [
    {
      "input": "test input",
      "output": "expected output"
    }
  ],
  "hints": "Optional hints for solving the problem"
}

The questionText should include:
1. Problem description
2. Input format
3. Output format
4. Constraints
5. Example (optional)

Generate exactly 1 coding question in this format.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the JSON response
        let question;
        try {
            // Remove markdown code blocks if present
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            question = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', text);
            throw new Error('AI returned invalid JSON format');
        }

        // Validate the response structure
        if (!question.questionText || !Array.isArray(question.testCases)) {
            throw new Error('Invalid coding question structure');
        }

        if (question.testCases.length < 1) {
            throw new Error('Coding question must have at least 1 test case');
        }

        // Validate test cases
        question.testCases.forEach((tc, index) => {
            if (!tc.input || !tc.output) {
                throw new Error(`Test case ${index} is missing input or output`);
            }
        });

        return {
            questionText: question.questionText,
            testCases: question.testCases,
            hints: question.hints || ''
        };
    } catch (error) {
        console.error('Error generating coding question:', error);
        throw error;
    }
};
