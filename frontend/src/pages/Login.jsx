import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
    FaGraduationCap, FaEnvelope, FaLock, FaExclamationCircle,
    FaClipboardCheck, FaShieldAlt, FaChartLine
} from 'react-icons/fa';
import './Login.css';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(formData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
            navigate(redirectPath);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Left — Branding */}
            <div className="login-brand">
                <div className="login-brand-content">
                    <div className="login-brand-icon">
                        <FaGraduationCap />
                    </div>
                    <h1>Exam Portal</h1>
                    <p className="login-brand-sub">
                        A powerful online examination platform for students and administrators
                    </p>

                    <div className="login-features">
                        <div className="login-feature">
                            <div className="login-feature-icon"><FaClipboardCheck /></div>
                            <span className="login-feature-text">Create and manage exams with MCQ & coding questions</span>
                        </div>
                        <div className="login-feature">
                            <div className="login-feature-icon"><FaShieldAlt /></div>
                            <span className="login-feature-text">Secure proctoring with tab-switch detection</span>
                        </div>
                        <div className="login-feature">
                            <div className="login-feature-icon"><FaChartLine /></div>
                            <span className="login-feature-text">Real-time analytics and performance tracking</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right — Form */}
            <div className="login-form-panel">
                <div className="login-form-wrap">
                    <div className="login-form-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to your account to continue</p>
                    </div>

                    {error && (
                        <div className="login-error">
                            <FaExclamationCircle /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="login-input-group">
                            <label className="login-label">Email</label>
                            <div className="login-input-wrap">
                                <FaEnvelope className="login-input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    className="login-input"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-input-group">
                            <label className="login-label">Password</label>
                            <div className="login-input-wrap">
                                <FaLock className="login-input-icon" />
                                <input
                                    type="password"
                                    name="password"
                                    className="login-input"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="login-divider"><span>or</span></div>

                    <p className="login-footer">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
