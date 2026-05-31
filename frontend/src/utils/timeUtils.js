export const timeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    const elapsed = now - past;

    if (elapsed < msPerMinute) {
        return 'Just now';
    } else if (elapsed < msPerHour) {
        const minutes = Math.floor(elapsed / msPerMinute);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (elapsed < msPerDay) {
        const hours = Math.floor(elapsed / msPerHour);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (elapsed < msPerDay * 7) {
        const days = Math.floor(elapsed / msPerDay);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (elapsed < msPerDay * 30) {
        const weeks = Math.floor(elapsed / (msPerDay * 7));
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (elapsed < msPerDay * 180) { // Approx 6 months
        const months = Math.floor(elapsed / msPerMonth);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        // After 6 months, show exact date format (e.g., Jan 12, 2025)
        return past.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
};
