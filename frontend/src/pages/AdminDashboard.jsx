import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { subjectAPI, examAPI, resultAPI } from '../services/api';
import {
    FaUserTie, FaBookOpen, FaQuestionCircle, FaClipboardList,
    FaUsers, FaFileAlt, FaLayerGroup, FaChartLine, FaGraduationCap,
    FaTrophy, FaLightbulb, FaCog, FaArrowUp, FaCheckCircle,
    FaCalendarAlt, FaShieldAlt, FaRocket
} from 'react-icons/fa';
import './AdminDashboard.css';

function AdminDashboard() {
    const [stats, setStats] = useState({
        subjects: 0,
        exams: 0,
        students: 0,
        avgScore: 0
    });
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [subjectsRes, examsRes, analyticsRes] = await Promise.all([
                subjectAPI.getAll(),
                examAPI.getAll(),
                resultAPI.getAnalytics()
            ]);

            setStats({
                subjects: subjectsRes.data.count,
                exams: examsRes.data.count,
                students: analyticsRes.data.analytics.totalStudents,
                avgScore: analyticsRes.data.analytics.averageScore
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="ad-page">
            <Navbar />

            {/* -------- Hero Section -------- */}
            <div className="ad-hero">
                {/* Decorative circles */}
                <div className="ad-hero-decor ad-hero-decor-1" />
                <div className="ad-hero-decor ad-hero-decor-2" />
                <div className="ad-hero-decor ad-hero-decor-3" />

                <div className="ad-hero-content">
                    <div className="ad-hero-row">
                        <div className="ad-hero-left">
                            <div className="ad-greeting-badge">
                                <FaRocket /> Admin Control Center
                            </div>
                            <h1>{getGreeting()}, {user.name || 'Admin'} 👋</h1>
                            <p className="ad-hero-subtitle">
                                Here's what's happening with your examination platform today. Manage everything from one place.
                            </p>
                            <div className="ad-datetime">
                                <FaCalendarAlt /> {formatDate()}
                            </div>
                        </div>
                        <div className="ad-hero-right">
                            <div className="ad-avatar">
                                <FaUserTie />
                            </div>
                            <span className="ad-role-badge">
                                <FaShieldAlt style={{ marginRight: 4, fontSize: '0.6rem' }} /> Administrator
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* -------- Stats Cards -------- */}
            <div className="ad-stats-section">
                <div className="ad-stats-grid">
                    <div className="ad-stat-card blue">
                        <div className="ad-stat-top">
                            <div className="ad-stat-icon blue">
                                <FaLayerGroup />
                            </div>
                            <span className="ad-stat-trend up">
                                <FaArrowUp /> Active
                            </span>
                        </div>
                        <div className="ad-stat-value">{stats.subjects}</div>
                        <p className="ad-stat-label">Total Subjects</p>
                    </div>

                    <div className="ad-stat-card indigo">
                        <div className="ad-stat-top">
                            <div className="ad-stat-icon indigo">
                                <FaClipboardList />
                            </div>
                            <span className="ad-stat-trend up">
                                <FaArrowUp /> Live
                            </span>
                        </div>
                        <div className="ad-stat-value">{stats.exams}</div>
                        <p className="ad-stat-label">Total Exams</p>
                    </div>

                    <div className="ad-stat-card amber">
                        <div className="ad-stat-top">
                            <div className="ad-stat-icon amber">
                                <FaUsers />
                            </div>
                            <span className="ad-stat-trend up">
                                <FaArrowUp /> Growing
                            </span>
                        </div>
                        <div className="ad-stat-value">{stats.students}</div>
                        <p className="ad-stat-label">Total Students</p>
                    </div>

                    <div className="ad-stat-card emerald">
                        <div className="ad-stat-top">
                            <div className="ad-stat-icon emerald">
                                <FaTrophy />
                            </div>
                            <span className="ad-stat-trend neutral">
                                Avg.
                            </span>
                        </div>
                        <div className="ad-stat-value">{stats.avgScore}%</div>
                        <p className="ad-stat-label">Average Score</p>
                    </div>
                </div>
            </div>

            {/* -------- Content -------- */}
            <div className="ad-content">

                {/* Quick Actions */}
                <div className="ad-section-header">
                    <div>
                        <h2 className="ad-section-title">
                            <span className="ad-section-title-icon"><FaRocket /></span>
                            Quick Actions
                        </h2>
                        <p className="ad-section-subtitle">Jump into any module to manage your platform</p>
                    </div>
                </div>

                <div className="ad-actions-grid">
                    <Link to="/admin/subjects" className="ad-action-card">
                        <div className="ad-action-icon subjects">
                            <FaBookOpen />
                        </div>
                        <div className="ad-action-info">
                            <div className="ad-action-title">Manage Subjects</div>
                            <p className="ad-action-desc">Add, edit, or delete subjects. Organize your curriculum and study topics.</p>
                            <div className="ad-action-meta">
                                <span className="ad-action-chip"><FaLayerGroup /> {stats.subjects} subjects</span>
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/questions" className="ad-action-card">
                        <div className="ad-action-icon questions">
                            <FaQuestionCircle />
                        </div>
                        <div className="ad-action-info">
                            <div className="ad-action-title">Question Bank</div>
                            <p className="ad-action-desc">Create and manage multiple choice, coding, and theory questions.</p>
                            <div className="ad-action-meta">
                                <span className="ad-action-chip"><FaCheckCircle /> MCQ & Code</span>
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/exams" className="ad-action-card">
                        <div className="ad-action-icon exams">
                            <FaClipboardList />
                        </div>
                        <div className="ad-action-info">
                            <div className="ad-action-title">Manage Exams</div>
                            <p className="ad-action-desc">Create, publish and schedule exams. Configure time limits and rules.</p>
                            <div className="ad-action-meta">
                                <span className="ad-action-chip"><FaClipboardList /> {stats.exams} exams</span>
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/students" className="ad-action-card">
                        <div className="ad-action-icon students">
                            <FaUsers />
                        </div>
                        <div className="ad-action-info">
                            <div className="ad-action-title">Student Monitoring</div>
                            <p className="ad-action-desc">View student performance, results, and proctoring activity logs.</p>
                            <div className="ad-action-meta">
                                <span className="ad-action-chip"><FaUsers /> {stats.students} students</span>
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/materials" className="ad-action-card">
                        <div className="ad-action-icon materials">
                            <FaFileAlt />
                        </div>
                        <div className="ad-action-info">
                            <div className="ad-action-title">Study Materials</div>
                            <p className="ad-action-desc">Upload PDFs, notes, and YouTube links as learning resources for students.</p>
                            <div className="ad-action-meta">
                                <span className="ad-action-chip"><FaFileAlt /> Files & Links</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Bottom Row — Tips + System Info */}
                <div className="ad-bottom-row">
                    <div className="ad-info-card">
                        <div className="ad-info-header">
                            <div className="ad-info-header-icon tips">
                                <FaLightbulb />
                            </div>
                            <h3>Quick Tips</h3>
                        </div>
                        <ul className="ad-tip-list">
                            <li className="ad-tip-item">
                                <span className="ad-tip-bullet">1</span>
                                <span>Create subjects first, then add questions under each subject.</span>
                            </li>
                            <li className="ad-tip-item">
                                <span className="ad-tip-bullet">2</span>
                                <span>Build your question bank before creating exams for smooth setup.</span>
                            </li>
                            <li className="ad-tip-item">
                                <span className="ad-tip-bullet">3</span>
                                <span>Monitor student activity in real-time during active exams.</span>
                            </li>
                            <li className="ad-tip-item">
                                <span className="ad-tip-bullet">4</span>
                                <span>Upload study materials to help students prepare for exams.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="ad-info-card">
                        <div className="ad-info-header">
                            <div className="ad-info-header-icon system">
                                <FaCog />
                            </div>
                            <h3>System Overview</h3>
                        </div>
                        <div className="ad-system-item">
                            <span className="ad-system-label">Platform Status</span>
                            <span className="ad-system-value">
                                <span className="ad-status-dot green"></span> Online
                            </span>
                        </div>
                        <div className="ad-system-item">
                            <span className="ad-system-label">Active Exams</span>
                            <span className="ad-system-value">{stats.exams}</span>
                        </div>
                        <div className="ad-system-item">
                            <span className="ad-system-label">Enrolled Students</span>
                            <span className="ad-system-value">{stats.students}</span>
                        </div>
                        <div className="ad-system-item">
                            <span className="ad-system-label">Performance</span>
                            <span className="ad-system-value">{stats.avgScore}% avg</span>
                        </div>
                        <div className="ad-system-item">
                            <span className="ad-system-label">Question Types</span>
                            <span className="ad-system-value">MCQ & Coding</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
