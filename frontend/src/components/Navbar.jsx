import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaGraduationCap, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    const navRef = useRef(null);
    const itemRefs = useRef({});
    const [pillStyle, setPillStyle] = useState({ left: 4, width: 0, opacity: 0 });

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
        { to: '/student/dashboard',  label: 'Dashboard' },
        { to: '/student/subjects',   label: 'Subjects' },
        { to: '/student/exams',      label: 'Available Exams' },
        { to: '/student/results',    label: 'My Results' },
    ];

    const links = isAdmin ? adminLinks : studentLinks;

    // Find active link
    const activeLink = (() => {
        const path = location.pathname;

        // Custom subpage mappings
        if (path.startsWith('/student/materials')) {
            return '/student/subjects';
        }
        if (path.startsWith('/student/result/')) {
            return '/student/results';
        }

        const found = links.find(link => {
            if (link.to === '/admin/dashboard' || link.to === '/student/dashboard') {
                return path === link.to;
            }
            return path === link.to || path.startsWith(link.to);
        });

        return found ? found.to : links[0]?.to;
    })();

    const movePillTo = (linkTo) => {
        const el = itemRefs.current[linkTo];
        const nav = navRef.current;
        if (el && nav) {
            const navRect = nav.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            setPillStyle({
                left: elRect.left - navRect.left,
                width: elRect.width,
                opacity: 1
            });
        }
    };

    // Snap pill to active on route change
    useEffect(() => {
        const timer = setTimeout(() => movePillTo(activeLink), 20);
        window.addEventListener('resize', () => movePillTo(activeLink));
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', () => movePillTo(activeLink));
        };
    }, [activeLink, location.pathname]);

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

                {/* === Stationary Capsule Track with Liquid Water Pill === */}
                <div className="navbar-nav" ref={navRef}>
                    {/* Liquid pill — moves purely inside the fixed track */}
                    <span
                        className="nav-liquid-pill"
                        style={{
                            left: pillStyle.left,
                            width: pillStyle.width,
                            opacity: pillStyle.opacity
                        }}
                    />

                    {links.map((link) => {
                        const isActive = link.to === activeLink;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                ref={(el) => { itemRefs.current[link.to] = el; }}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onMouseEnter={() => movePillTo(link.to)}
                                onMouseLeave={() => movePillTo(activeLink)}
                            >
                                {link.label}
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

                    <button onClick={handleLogout} className="navbar-signout-btn" title="Sign Out">
                        <FaSignOutAlt className="signout-icon" />
                        <span>Logout</span>
                    </button>

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
                            <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="mobile-nav-links">
                            {links.map((link) => {
                                const isActive = link.to === activeLink;
                                return (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {link.label}
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
