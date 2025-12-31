// ========================================
// Points Manager
// ========================================

// Rank definitions
const RANKS = [
    { name: 'new', min: 0, max: 49 },
    { name: 'beginner', min: 50, max: 149 },
    { name: 'intermediate', min: 150, max: 299 },
    { name: 'excellent', min: 300, max: 999 },
    { name: 'legendary', min: 1000, max: 2999 },
    { name: 'heroic', min: 3000, max: 6999 },
    { name: 'royal', min: 7000, max: 14999 },
    { name: 'miraculous', min: 15000, max: 29999 },
    { name: 'absolute_classifier', min: 30000, max: Infinity }
];

// Get user level based on points
function getUserLevel(points) {
    const rank = RANKS.find(r => points >= r.min && points <= r.max);
    return rank ? rank.name : 'new';
}

// Get points for next level
function getPointsForNextLevel(currentPoints) {
    const rank = RANKS.find(r => currentPoints >= r.min && currentPoints <= r.max);
    if (!rank || rank.max === Infinity) return 0;
    return (rank.max + 1) - currentPoints;
}

// Get level progress percentage
function getLevelProgress(points) {
    const rank = RANKS.find(r => points >= r.min && points <= r.max);

    if (!rank || rank.max === Infinity) return 100;

    const range = (rank.max + 1) - rank.min;
    const progress = points - rank.min;

    return (progress / range) * 100;
}

// Update points display in header
async function updatePointsDisplay() {
    const totalPoints = await PointsService.getTotal();
    const pointsValue = document.getElementById('pointsValue');

    if (pointsValue) {
        pointsValue.textContent = totalPoints;
    }

    // Dispatch event for other components (like Leaderboard) to react
    window.dispatchEvent(new CustomEvent('pointsUpdated', {
        detail: { totalPoints }
    }));
}

// Global listener to ensure header stays in sync
window.addEventListener('pointsUpdated', (e) => {
    const pointsValue = document.getElementById('pointsValue');
    if (pointsValue && e.detail && e.detail.totalPoints !== undefined) {
        pointsValue.textContent = e.detail.totalPoints.toLocaleString();
    }
});
