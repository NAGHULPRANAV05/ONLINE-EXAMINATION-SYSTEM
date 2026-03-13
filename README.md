# Online Examination Portal

A complete, production-ready full-stack online examination system with secure authentication, role-based access control, MCQ and coding exams with auto-evaluation, and comprehensive analytics.

## 🌟 Features

### 🔐 Authentication
- JWT-based secure authentication
- Role-based access (Admin & Student)
- Password hashing with bcrypt
- Protected routes

### 👨‍💼 Admin Features
- Dashboard with system statistics
- Subject management (CRUD operations)
- Question bank (MCQ & Coding questions)
- Exam creation and management
- Publish/unpublish exams
- Student performance monitoring
- Analytics dashboard

### 👨‍🎓 Student Features
- Personal dashboard with performance stats
- Browse subjects and available exams
- Take exams with timer
- MCQ and coding questions support
- In-browser code editor (Monaco Editor)
- Real-time code execution with test cases
- View detailed results
- Performance history

### 💻 Code Execution Engine
- Supports: C, C++, Java, Python
- Test case evaluation
- Automatic scoring
- Timeout handling (5 seconds)
- Error capture and display

### 🔒 Exam Security
- Tab switch detection with warnings
- Right-click disabled during exams
- Auto-submit on timeout
- Answer auto-save
- Tab switch count tracking

## 🛠️ Technology Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT for authentication
- bcrypt for password hashing
- child_process for code execution

### Frontend
- React.js 18
- Vite (build tool)
- React Router (navigation)
- Axios (API calls)
- Monaco Editor (code editing)
- Vanilla CSS (modern design)

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** - [Download](https://www.mongodb.com/try/download/community)
3. **Compilers** (for code execution):
   - **GCC/G++** (for C/C++) - Install MinGW on Windows
   - **Java JDK** - [Download](https://www.oracle.com/java/technologies/downloads/)
   - **Python 3** - [Download](https://www.python.org/downloads/)

## 🚀 Installation & Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/exam-portal
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:
```bash
mongod
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Server runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:3000`

## 📖 Usage Guide

### Initial Setup

1. **Register Admin Account**
   - Go to `http://localhost:3000/register`
   - Fill in details and select role: **Admin**
   - Click "Create Account"

2. **Create Subjects** (Admin)
   - Login as admin
   - Navigate to "Subjects"
   - Click "+ Add Subject"
   - Create subjects (both theory and programming)

3. **Create Questions** (Admin)
   - Go to "Questions"
   - Click "+ Add Question"
   - Select type (MCQ or Coding)
   - Fill in question details
   - For coding questions, add test cases

4. **Create Exams** (Admin)
   - Go to "Exams"
   - Click "+ Create Exam"
   - Fill in exam details
   - Select questions from the list
   - Click "Publish" to make it available

5. **Student Registration**
   - Register with role: **Student**
   - Login and view available exams

6. **Take Exam** (Student)
   - Select an exam
   - Read instructions
   - Start exam
   - Answer questions (MCQ or write code)
   - Submit when done

7. **View Results** (Student)
   - See score and percentage
   - Review answers
   - Check test case results for coding questions

## 📁 Project Structure

```
QUIZ/
├── backend/
│   ├── controllers/      # Request handlers
│   ├── models/          # Database schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (code execution)
│   ├── middleware/      # Auth middleware
│   ├── tmp/            # Temporary code files
│   ├── server.js       # Main server file
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

## 🎨 Design Features

- **Dark Theme** with vibrant gradients
- **Glassmorphism** effects
- **Responsive Design** (mobile + desktop)
- **Smooth Animations** and transitions
- **Modern UI Components**

## 🔒 Security Features

1. Password hashing with bcrypt (10 salt rounds)
2. JWT authentication with 7-day expiration
3. Role-based access control
4. Protected API endpoints
5. Input validation
6. CORS configuration
7. Code execution timeout limits
8. Tab switch monitoring

## 📊 Database Schema

### Collections
- **users**: Authentication and user data
- **subjects**: Subject information
- **questions**: MCQ and coding questions
- **exams**: Exam configuration
- **results**: Student results and analytics

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

### Code Execution Errors
- Verify compilers are installed and in PATH
- Test: `gcc --version`, `g++ --version`, `java -version`, `python --version`

### Port Already in Use
- Change ports in `.env` (backend) and `vite.config.js` (frontend)

## 🚀 Production Deployment

For production deployment:

1. Update environment variables
2. Use MongoDB Atlas for database
3. Implement Docker for code execution isolation
4. Add HTTPS/SSL certificates
5. Configure CORS for production domain
6. Build frontend: `npm run build`
7. Use process manager (PM2) for backend

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject (admin)
- `PUT /api/subjects/:id` - Update subject (admin)
- `DELETE /api/subjects/:id` - Delete subject (admin)

### Questions
- `GET /api/questions` - Get questions
- `POST /api/questions` - Create question (admin)
- `DELETE /api/questions/:id` - Delete question (admin)

### Exams
- `GET /api/exams` - Get exams
- `POST /api/exams` - Create exam (admin)
- `PATCH /api/exams/:id/publish` - Publish/unpublish (admin)
- `DELETE /api/exams/:id` - Delete exam (admin)

### Code Execution
- `POST /api/code/execute` - Execute code with test cases

### Results
- `POST /api/results/submit` - Submit exam
- `GET /api/results/student/:id` - Get student results
- `GET /api/results/analytics` - Get analytics (admin)

## 🎓 Educational Value

This project demonstrates:
- Full-stack development
- RESTful API design
- Authentication & authorization
- Database modeling
- Code execution sandboxing
- Modern UI/UX design
- State management
- Security best practices

## 📄 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for education**
