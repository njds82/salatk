// ========================================
// Points Manager
// ========================================

// Get user level based on points
function getUserLevel(points) {
    if (points < 50) return 'beginner';
    if (points < 150) return 'intermediate';
    if (points < 300) return 'advanced';
    return 'expert';
}

// Get points for next level
function getPointsForNextLevel(currentPoints) {
    if (currentPoints < 50) return 50 - currentPoints;
    if (currentPoints < 150) return 150 - currentPoints;
    if (currentPoints < 300) return 300 - currentPoints;
    return 0;
}

// Get level progress percentage
function getLevelProgress(points) {
    let current, next;

    if (points < 50) {
        current = 0;
        next = 50;
    } else if (points < 150) {
        current = 50;
        next = 150;
    } else if (points < 300) {
        current = 150;
        next = 300;
    } else {
        return 100;
    }

    return ((points - current) / (next - current)) * 100;
}

// Update points display in header
function updatePointsDisplay() {
    const pointsData = getPoints();
    const pointsValue = document.getElementById('pointsValue');

    if (pointsValue) {
        pointsValue.textContent = pointsData.total;
    }
}
