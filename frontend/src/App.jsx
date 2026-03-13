import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ExamInterface from './pages/ExamInterface';
import ResultView from './pages/ResultView';
import AdminDashboard from './pages/AdminDashboard';
import SubjectManagement from './pages/SubjectManagement';
import QuestionBank from './pages/QuestionBank';
import ExamManagement from './pages/ExamManagement';
import StudentMonitoring from './pages/StudentMonitoring';
import StudyMaterialManagement from './pages/StudyMaterialManagement';
import StudyMaterials from './pages/StudyMaterials';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Routes */}
            <Route
                path="/student/dashboard"
                element={
                    <ProtectedRoute role="student">
                        <StudentDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/exam/:examId"
                element={
                    <ProtectedRoute role="student">
                        <ExamInterface />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/result/:resultId"
                element={
                    <ProtectedRoute role="student">
                        <ResultView />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/student/materials"
                element={
                    <ProtectedRoute role="student">
                        <StudyMaterials />
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/subjects"
                element={
                    <ProtectedRoute role="admin">
                        <SubjectManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/questions"
                element={
                    <ProtectedRoute role="admin">
                        <QuestionBank />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/exams"
                element={
                    <ProtectedRoute role="admin">
                        <ExamManagement />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/students"
                element={
                    <ProtectedRoute role="admin">
                        <StudentMonitoring />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/materials"
                element={
                    <ProtectedRoute role="admin">
                        <StudyMaterialManagement />
                    </ProtectedRoute>
                }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;
