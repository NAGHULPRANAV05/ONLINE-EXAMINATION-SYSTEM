import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { FaGraduationCap } from 'react-icons/fa';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student'
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

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            await authAPI.register(registerData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}><FaGraduationCap style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Exam Portal</h1>
                <h2 style={styles.subtitle}>Register</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <select
                            name="role"
                            className="form-select"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p style={styles.footer}>
                    Already have an account? <Link to="/login" style={styles.link}>Login</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#f0f4ff'
    },
    card: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '2.5rem',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)'
    },
    title: {
        textAlign: 'center',
        marginBottom: '0.5rem',
        color: '#2563eb'
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: '2rem',
        color: '#64748b'
    },
    error: {
        background: '#fef2f2',
        color: '#dc2626',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        border: '1px solid #fecaca'
    },
    footer: {
        textAlign: 'center',
        marginTop: '1.5rem',
        color: '#64748b'
    },
    link: {
        color: '#2563eb',
        textDecoration: 'none',
        fontWeight: 600
    }
};

export default Register;
