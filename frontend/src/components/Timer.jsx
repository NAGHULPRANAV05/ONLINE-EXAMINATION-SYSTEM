import { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';

function Timer({ duration, onTimeUp }) {
    const [timeLeft, setTimeLeft] = useState(duration * 60);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isCritical = timeLeft <= 300; // Under 5 mins
    const isWarning = timeLeft <= 600 && !isCritical; // 5-10 mins

    return (
        <div className={`clean-timer ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`} title="Time Remaining">
            <FaClock className="timer-icon" />
            <span className="timer-time">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
        </div>
    );
}

export default Timer;
