import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, role }) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
}

export default ProtectedRoute;
