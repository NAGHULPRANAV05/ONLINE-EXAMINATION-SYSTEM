function LoadingSpinner({ size = 'md', message }) {
    const sizeClass = size === 'sm' ? 'spinner-sm' : '';

    return (
        <div style={styles.container}>
            <div className={`spinner ${sizeClass}`}></div>
            {message && <p style={styles.message}>{message}</p>}
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3.5rem 2rem',
        minHeight: '45vh',
        gap: '1rem'
    },
    message: {
        color: '#64748b',
        fontSize: '0.95rem',
        fontWeight: '500'
    }
};

export default LoadingSpinner;
