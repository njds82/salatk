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

// Get Hijri date using accurate algorithm (based on Umm al-Qura calendar)
function getHijriDate(date = new Date()) {
    try {
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();

        let m = month + 1;
        let y = year;
        if (m < 3) {
            y -= 1;
            m += 12;
        }

        const a = Math.floor(y / 100);
        let b = 2 - a + Math.floor(a / 4);
        if (y < 1583) b = 0;
        if (y === 1582) {
            if (m > 10) b = -10;
            if (m === 10) {
                b = 0;
                if (day > 4) b = -10;
            }
        }

        let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

        b = 0;
        if (jd > 2299160) {
            const a2 = Math.floor((jd - 1867216.25) / 36524.25);
            b = 1 + a2 - Math.floor(a2 / 4);
        }

        // Islamic calendar calculation
        const iyear = 10631 / 30;
        const epochastro = 1948084;
        const shift1 = 8.01 / 60;

        let z = jd - epochastro;
        const cyc = Math.floor(z / 10631);
        z = z - 10631 * cyc;
        const j = Math.floor((z - shift1) / iyear);
        const iy = 30 * cyc + j;
        z = z - Math.floor(j * iyear + shift1);
        let im = Math.floor((z + 28.5001) / 29.5);
        if (im === 13) im = 12;
        const id = Math.floor(z - Math.floor(29.5001 * im - 29)) - 1;

        const monthKey = `h_month_${im}`;
        const monthName = t(monthKey);

        return {
            year: iy,
            month: im - 1, // 0-indexed for consistency
            day: id,
            formatted: `${id} ${monthName} ${iy}${t('hijri_suffix')}`
        };
    } catch (e) {
        console.error('Hijri date calculation error:', e);
        // Fallback to approximation
        const gregorianYear = date.getFullYear();
        const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);
        const approxMonth = date.getMonth() + 1;
        const monthKey = `h_month_${((approxMonth - 1) % 12) + 1}`;
        const monthName = t(monthKey);

        return {
            year: hijriYear,
            month: (approxMonth - 1) % 12,
            day: date.getDate(),
            formatted: `${date.getDate()} ${monthName} ${hijriYear}${t('hijri_suffix')}`
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
