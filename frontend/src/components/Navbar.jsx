import { Link, useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaSignOutAlt } from 'react-icons/fa';

function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <div className="container" style={styles.container}>
                <Link to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} style={styles.logo}>
                    <h2><FaGraduationCap style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Exam Portal</h2>
                </Link>

                <div style={styles.menu}>
                    {isAdmin ? (
                        <>
                            <Link to="/admin/dashboard" style={styles.link}>Dashboard</Link>
                            <Link to="/admin/subjects" style={styles.link}>Subjects</Link>
                            <Link to="/admin/questions" style={styles.link}>Questions</Link>
                            <Link to="/admin/exams" style={styles.link}>Exams</Link>
                            <Link to="/admin/students" style={styles.link}>Students</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/student/dashboard" style={styles.link}>Dashboard</Link>
                        </>
                    )}

                    <div style={styles.userInfo}>
                        <span style={styles.userName}>{user.name}</span>
                        <button onClick={handleLogout} className="btn btn-outline btn-sm">
                            <FaSignOutAlt style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.75rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    logo: {
        textDecoration: 'none',
        color: '#2563eb'
    },
    menu: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem'
    },
    link: {
        color: '#475569',
        textDecoration: 'none',
        fontWeight: 500,
        transition: 'color 0.2s ease'
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginLeft: '1rem',
        paddingLeft: '1rem',
        borderLeft: '1px solid #e2e8f0'
    },
    userName: {
        color: '#1e293b',
        fontWeight: 600
    }
};

export default Navbar;
