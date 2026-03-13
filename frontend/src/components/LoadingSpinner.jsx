function LoadingSpinner({ size = 'md' }) {
    const sizeClass = size === 'sm' ? 'spinner-sm' : '';

    return (
        <div style={styles.container}>
            <div className={`spinner ${sizeClass}`}></div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem'
    }
};

export default LoadingSpinner;
