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
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthName = t(months[date.getMonth()]);
        return `${dayName}, ${monthName} ${date.getDate()}, ${date.getFullYear()}`;
    }
}

// Check if date is today
function isToday(dateStr) {
    return dateStr === getCurrentDate();
}

// Get Hijri date using Intl.DateTimeFormat (Accurate)
function getHijriDate(date = new Date()) {
    try {
        // Use islamic-uma (Umm al-Qura) for Saudi Arabia/Middle East standard
        // Use nu-latn to ensure we get Western digits (0-9) for parsing
        const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-uma-nu-latn', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });

        const parts = formatter.formatToParts(date);
        const hijriParts = {};
        parts.forEach(part => {
            if (part.type !== 'literal') {
                hijriParts[part.type] = part.value;
            }
        });

        const day = parseInt(hijriParts.day);
        const month = parseInt(hijriParts.month); // 1-indexed
        const year = parseInt(hijriParts.year);

        const monthKey = `h_month_${month}`;
        const monthName = t(monthKey);

        return {
            year: year,
            month: month - 1, // 0-indexed for consistency
            day: day,
            formatted: `${day} ${monthName} ${year}${t('hijri_suffix')}`
        };
    } catch (e) {
        console.error('Hijri date calculation error:', e);
        // Fallback approximation (still better than nothing)
        const gregorianYear = date.getFullYear();
        const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);
        const approxMonth = date.getMonth();
        const monthKey = `h_month_${(approxMonth % 12) + 1}`;

        return {
            year: hijriYear,
            month: approxMonth,
            day: date.getDate(),
            formatted: `${date.getDate()} ${t(monthKey)} ${hijriYear}${t('hijri_suffix')}`
        };
    }
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
