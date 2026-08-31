import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import {
    FaGraduationCap, FaEnvelope, FaLock,
    FaExclamationCircle, FaEye, FaEyeSlash, FaShieldAlt
} from 'react-icons/fa';
import './Login.css';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
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
            navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setGoogleLoading(true);
        try {
            const response = await authAPI.googleAuth(credentialResponse.credential);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google sign-in was cancelled or failed. Please try again.');
    };

    return (
        <div className="lp-root">
            {/* Background decoration */}
            <div className="lp-bg">
                <div className="lp-orb lp-orb-1" />
                <div className="lp-orb lp-orb-2" />
                <div className="lp-orb lp-orb-3" />
                <div className="lp-grid" />
            </div>

            {/* Centered Card */}
            <div className="lp-card">
                {/* Top accent */}
                <div className="lp-accent-bar" />

                <div className="lp-body">
                    {/* Logo + Brand */}
                    <div className="lp-brand">
                        <div className="lp-logo">
                            <FaGraduationCap />
                        </div>
                        <h1 className="lp-title">Exam Portal</h1>
                        <p className="lp-subtitle">Sign in to continue to your dashboard</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="lp-error">
                            <FaExclamationCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="lp-form">
                        <div className={`lp-field ${focusedField === 'email' ? 'focused' : ''}`}>
                            <label htmlFor="lp-email">Email Address</label>
                            <div className="lp-input-wrap">
                                <FaEnvelope className="lp-icon" />
                                <input
                                    id="lp-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@institution.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField('')}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className={`lp-field ${focusedField === 'password' ? 'focused' : ''}`}>
                            <label htmlFor="lp-password">Password</label>
                            <div className="lp-input-wrap">
                                <FaLock className="lp-icon" />
                                <input
                                    id="lp-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField('')}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="lp-eye"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label="Toggle password"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="login-submit-btn"
                            type="submit"
                            className="lp-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className="lp-spinner" /> Signing in…</>
                            ) : (
                                <>Sign In <span className="lp-arrow">→</span></>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="lp-divider">
                        <span>or continue with</span>
                    </div>

                    {/* Google SSO Button (Placed below sign in) */}
                    <div className="lp-google-wrap">
                        {googleLoading ? (
                            <div className="lp-google-loading">
                                <span className="lp-spinner lp-spinner-dark" />
                                <span>Signing in with Google…</span>
                            </div>
                        ) : (
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap={false}
                                theme="outline"
                                size="large"
                                width="100%"
                                text="signin_with"
                                shape="rectangular"
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <p className="lp-footer">
                        Don't have an account?{' '}
                        <Link to="/register" id="login-register-link">Create one</Link>
                    </p>

                    <div className="lp-secure">
                        <FaShieldAlt /> 256-bit SSL encrypted
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
