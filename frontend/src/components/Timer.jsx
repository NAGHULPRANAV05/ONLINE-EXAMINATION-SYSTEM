import { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';

function Timer({ duration, onTimeUp }) {
    const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const getColor = () => {
        if (timeLeft > 600) return '#4ade80'; // Green
        if (timeLeft > 300) return '#fbbf24'; // Yellow
        return '#f87171'; // Red
    };

    return (
        <div style={{ ...styles.timer, color: getColor() }}>
            <div style={styles.icon}><FaClock /></div>
            <div style={styles.time}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
        </div>
    );
}

const styles = {
    timer: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        background: 'rgba(241, 245, 249, 0.9)',
        borderRadius: '0.5rem',
        fontSize: '1.5rem',
        fontWeight: 700,
        border: '2px solid currentColor'
    },
    icon: {
        fontSize: '1.75rem'
    },
    time: {
        fontFamily: 'monospace'
    }
};

export default Timer;
