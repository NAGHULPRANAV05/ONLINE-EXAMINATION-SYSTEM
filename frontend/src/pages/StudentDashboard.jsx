import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { subjectAPI, examAPI, resultAPI } from '../services/api';
import {
    AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    FaClock, FaClipboardList, FaBookOpen, FaGraduationCap,
    FaChartLine, FaPlay, FaTrophy, FaEye, FaCheckCircle,
    FaTimesCircle, FaFire, FaStar
} from 'react-icons/fa';
import './StudentDashboard.css';

/* ── tiny helpers ── */
const fmt = (n) => parseFloat((n || 0).toFixed(1));

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

function StudentDashboard() {
    const [subjects, setSubjects] = useState([]);
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [subjectsRes, examsRes, resultsRes] = await Promise.all([
                subjectAPI.getAll({ isActive: true }),
                examAPI.getAll({ isActive: true }),
                resultAPI.getStudentResults(user.id)
            ]);
            setSubjects(subjectsRes.data.subjects || []);
            setExams(examsRes.data.exams || []);
            setResults(resultsRes.data.results || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    /* ── derived stats ── */
    const totalAttempts = results.length;
    const passed  = results.filter(r => r.percentage >= 40).length;
    const failed  = totalAttempts - passed;
    const avgScore = totalAttempts
        ? fmt(results.reduce((s, r) => s + r.percentage, 0) / totalAttempts)
        : 0;
    const bestScore = totalAttempts
        ? fmt(Math.max(...results.map(r => r.percentage)))
        : 0;
    const passRate = totalAttempts ? fmt((passed / totalAttempts) * 100) : 0;

    /* ── chart data ── */
    // Score trend (last 8 results chronological)
    const trendData = [...results]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-8)
        .map((r, i) => ({
            name: `#${i + 1}`,
            score: fmt(r.percentage),
            label: r.exam?.title?.substring(0, 14) || `Exam ${i + 1}`
        }));

    // Pass / Fail pie
    const pieData = [
        { name: 'Passed', value: passed },
        { name: 'Failed', value: failed },
    ].filter(d => d.value > 0);

    // Per-subject average
    const subjectMap = {};
    results.forEach(r => {
        const name = r.exam?.subject?.name || 'Other';
        if (!subjectMap[name]) subjectMap[name] = { total: 0, count: 0 };
        subjectMap[name].total += r.percentage;
        subjectMap[name].count += 1;
    });
    const subjectData = Object.entries(subjectMap).map(([name, { total, count }]) => ({
        name: name.length > 12 ? name.slice(0, 12) + '…' : name,
        avg: fmt(total / count)
    }));

    /* ── recent 3 results ── */
    const recent = [...results]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

    /* ── upcoming exams ── */
    const attemptedIds = new Set(results.map(r => r.exam?._id || r.exam));
    const upcoming = exams.filter(e => !attemptedIds.has(e._id)).slice(0, 3);

    return (
        <div className="sd-page">
            {/* ── Hero ── */}
            <div className="sd-hero">
                <div className="sd-hero-content">
                    <h1>
                        Welcome back, <span>{user.name}</span>!{' '}
                        <span className="sd-hero-wave">👋</span>
                    </h1>
                    <p className="sd-hero-sub">Here's your learning snapshot for today.</p>
                </div>
            </div>

            {/* ── KPI Stats ── */}
            <div className="sd-stats-wrap">
                <div className="sd-stats-grid">
                    <div className="sd-stat blue">
                        <div className="sd-stat-icon blue"><FaBookOpen /></div>
                        <div className="sd-stat-value">{subjects.length}</div>
                        <p className="sd-stat-label">Subjects</p>
                    </div>
                    <div className="sd-stat indigo">
                        <div className="sd-stat-icon indigo"><FaClipboardList /></div>
                        <div className="sd-stat-value">{exams.length}</div>
                        <p className="sd-stat-label">Active Exams</p>
                    </div>
                    <div className="sd-stat amber">
                        <div className="sd-stat-icon amber"><FaChartLine /></div>
                        <div className="sd-stat-value">{avgScore}%</div>
                        <p className="sd-stat-label">Avg Score</p>
                    </div>
                    <div className="sd-stat emerald">
                        <div className="sd-stat-icon emerald"><FaCheckCircle /></div>
                        <div className="sd-stat-value">{passRate}%</div>
                        <p className="sd-stat-label">Pass Rate</p>
                    </div>
                    <div className="sd-stat purple">
                        <div className="sd-stat-icon purple"><FaStar /></div>
                        <div className="sd-stat-value">{bestScore}%</div>
                        <p className="sd-stat-label">Best Score</p>
                    </div>
                    <div className="sd-stat rose">
                        <div className="sd-stat-icon rose"><FaFire /></div>
                        <div className="sd-stat-value">{totalAttempts}</div>
                        <p className="sd-stat-label">Attempts</p>
                    </div>
                </div>
            </div>

            {/* ── Charts ── */}
            <div className="sd-content">
                {totalAttempts === 0 ? (
                    /* No data yet – nudge */
                    <div className="sd-no-data-card">
                        <div className="sd-no-data-icon">🎯</div>
                        <h3>No exam data yet</h3>
                        <p>Take your first exam to see your performance analytics here!</p>
                        <Link to="/student/exams" className="sd-cta-btn">
                            <FaPlay /> Browse Exams
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Row 1: Score Trend + Pie */}
                        <div className="sd-charts-row">
                            {/* Area chart – score trend */}
                            <div className="sd-chart-card wide">
                                <div className="sd-chart-head">
                                    <h3>Score Trend</h3>
                                    <span className="sd-chart-sub">Last {trendData.length} attempts</span>
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={trendData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                                            formatter={(v) => [`${v}%`, 'Score']}
                                        />
                                        <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Pie – pass/fail */}
                            <div className="sd-chart-card narrow">
                                <div className="sd-chart-head">
                                    <h3>Pass / Fail</h3>
                                    <span className="sd-chart-sub">{totalAttempts} total</span>
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                                            paddingAngle={4} dataKey="value">
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => [v, 'Exams']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                                        <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* centre label */}
                                <div className="sd-pie-centre">
                                    <span className="sd-pie-pct">{passRate}%</span>
                                    <span className="sd-pie-lbl">Pass Rate</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Subject bar chart (only if > 1 subject) */}
                        {subjectData.length > 0 && (
                            <div className="sd-chart-card full">
                                <div className="sd-chart-head">
                                    <h3>Average Score by Subject</h3>
                                    <span className="sd-chart-sub">Your performance breakdown</span>
                                </div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={subjectData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                                            formatter={(v) => [`${v}%`, 'Avg Score']}
                                        />
                                        <Bar dataKey="avg" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                )}

                {/* ── Bottom two-col ── */}
                <div className="sd-bottom-row">
                    {/* Recent Results */}
                    <div className="sd-bottom-card">
                        <div className="sd-section-head">
                            <div className="sd-section-icon purple"><FaTrophy /></div>
                            <h2 className="sd-section-title">Recent Results</h2>
                            <Link to="/student/results" className="sd-see-all">See all →</Link>
                        </div>
                        {recent.length === 0 ? (
                            <p className="sd-mini-empty">No results yet.</p>
                        ) : (
                            <div className="sd-mini-list">
                                {recent.map(result => {
                                    const pass = result.percentage >= 40;
                                    return (
                                        <div className="sd-mini-item" key={result._id}>
                                            <div className={`sd-mini-dot ${pass ? 'pass' : 'fail'}`} />
                                            <div className="sd-mini-info">
                                                <span className="sd-mini-title">{result.exam?.title || 'Exam'}</span>
                                                <span className="sd-mini-sub">{result.totalScore}/{result.exam?.totalMarks || 0} marks</span>
                                            </div>
                                            <div className="sd-mini-right">
                                                <span className={`sd-mini-pct ${pass ? 'pass' : 'fail'}`}>{result.percentage.toFixed(1)}%</span>
                                                <Link to={`/student/result/${result._id}`} className="sd-mini-link"><FaEye /></Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Exams */}
                    <div className="sd-bottom-card">
                        <div className="sd-section-head">
                            <div className="sd-section-icon green"><FaGraduationCap /></div>
                            <h2 className="sd-section-title">Upcoming Exams</h2>
                            <Link to="/student/exams" className="sd-see-all">See all →</Link>
                        </div>
                        {upcoming.length === 0 ? (
                            <p className="sd-mini-empty">All exams attempted! 🎉</p>
                        ) : (
                            <div className="sd-mini-list">
                                {upcoming.map(exam => (
                                    <div className="sd-mini-item" key={exam._id}>
                                        <div className="sd-mini-dot blue" />
                                        <div className="sd-mini-info">
                                            <span className="sd-mini-title">{exam.title}</span>
                                            <span className="sd-mini-sub"><FaClock /> {exam.duration} min · {exam.totalMarks} marks</span>
                                        </div>
                                        <Link to={`/student/exam/${exam._id}`} className="sd-mini-start">
                                            <FaPlay />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
