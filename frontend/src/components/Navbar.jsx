import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaGraduationCap, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const adminLinks = [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/subjects', label: 'Subjects' },
        { to: '/admin/questions', label: 'Questions' },
        { to: '/admin/exams', label: 'Exams' },
        { to: '/admin/students', label: 'Students' },
    ];

    const studentLinks = [
        { to: '/student/dashboard', label: 'Dashboard' },
    ];

    const links = isAdmin ? adminLinks : studentLinks;

    return (
        <header className="navbar-wrapper">
            <nav className="navbar-container">
                {/* Brand Logo */}
                <Link to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} className="navbar-brand">
                    <div className="navbar-logo-badge">
                        <FaGraduationCap />
                    </div>
                    <div className="navbar-brand-text">
                        <span className="navbar-brand-title">Exam Portal</span>
                    </div>
                </Link>

                {/* Center Navigation Links */}
                <div className="navbar-nav">
                    {links.map((link) => {
                        const isActive = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="nav-item-label">{link.label}</span>
                                {isActive && <span className="nav-active-pill" />}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Profile & Actions */}
                <div className="navbar-actions">
                    <div className="user-profile-pill">
                        <div className="user-avatar-ring">
                            <span className="user-avatar-initial">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                        </div>
                        <div className="user-meta">
                            <span className="user-name">{user.name || 'User'}</span>
                            <span className="user-role-tag">{isAdmin ? 'Admin' : 'Student'}</span>
                        </div>
                    </div>

                    <div className="navbar-divider" />

                    <button
                        onClick={handleLogout}
                        className="navbar-signout-btn"
                        title="Sign Out"
                    >
                        <FaSignOutAlt className="signout-icon" />
                        <span>Logout</span>
                    </button>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        className="mobile-menu-trigger"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation"
                    >
                        {mobileOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </nav>

            {/* Mobile Navigation Drawer */}
            {mobileOpen && (
                <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
                    <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-nav-top">
                            <div className="user-profile-pill">
                                <div className="user-avatar-ring">
                                    <span className="user-avatar-initial">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                </div>
                                <div className="user-meta">
                                    <span className="user-name">{user.name || 'User'}</span>
                                    <span className="user-role-tag">{isAdmin ? 'Admin' : 'Student'}</span>
                                </div>
                            </div>
                            <button
                                className="mobile-close-btn"
                                onClick={() => setMobileOpen(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="mobile-nav-links">
                            {links.map((link) => {
                                const isActive = location.pathname === link.to;
                                return (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mobile-nav-bottom">
                            <button onClick={handleLogout} className="mobile-signout-btn">
                                <FaSignOutAlt />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Navbar;
