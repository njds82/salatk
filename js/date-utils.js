// ========================================
// Date Utilities
// ========================================

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    const now = new Date();
    return formatDate(now);
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get day name
function getDayName(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

// Format display date
function formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = t(getDayName(date));

    if (getCurrentLanguage() === 'ar') {
        return `${dayName} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } else {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${dayName}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
}

// Check if date is today
function isToday(dateStr) {
    return dateStr === getCurrentDate();
}

// Get Hijri date (simplified - using approximation)
// For accurate Hijri dates, you would need a proper library
function getHijriDate(date = new Date()) {
    // This is a simplified approximation
    // For production, use a library like moment-hijri
    const gregorianYear = date.getFullYear();
    const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);

    const monthNames = [
        'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
        'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];

    // Simplified calculation - not accurate for production
    const approximateMonth = date.getMonth();
    const approximateDay = date.getDate();

    return {
        year: hijriYear,
        month: approximateMonth % 12,
        day: approximateDay,
        formatted: `${approximateDay} ${monthNames[approximateMonth % 12]} ${hijriYear}هـ`
    };
}

// Parse date string
function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
}

// Compare dates
function compareDates(date1, date2) {
    const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
    return d1.getTime() - d2.getTime();
}

// Get days difference
function getDaysDifference(date1, date2) {
    const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get week dates (last 7 days)
function getWeekDates() {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(formatDate(date));
    }
    return dates;
}

// Get month dates (last 30 days)
function getMonthDates() {
    const dates = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(formatDate(date));
    }
    return dates;
}

// Format time (HH:MM)
function formatTime(date = new Date()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Get timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Check if date can be edited (last 7 days)
function canEditDate(dateStr) {
    const date = parseDate(dateStr);
    const today = parseDate(getCurrentDate());
    const diff = getDaysDifference(date, today);
    return diff <= 7;
}
