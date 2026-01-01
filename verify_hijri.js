
const translations = {
    ar: {
        hijri_suffix: 'هـ',
        h_month_1: 'محرم', h_month_2: 'صفر', h_month_3: 'ربيع الأول', h_month_4: 'ربيع الثاني',
        h_month_5: 'جمادى الأولى', h_month_6: 'جمادى الثانية', h_month_7: 'رجب', h_month_8: 'شعبان',
        h_month_9: 'رمضان', h_month_10: 'شوال', h_month_11: 'ذو القعدة', h_month_12: 'ذو الحجة',
    },
    en: {
        hijri_suffix: 'AH',
        h_month_1: 'Muharram', h_month_2: 'Safar', h_month_3: 'Rabi\' al-Awwal', h_month_4: 'Rabi\' al-Thani',
        h_month_5: 'Jumada al-Ula', h_month_6: 'Jumada al-Akhirah', h_month_7: 'Rajab', h_month_8: 'Sha\'ban',
        h_month_9: 'Ramadan', h_month_10: 'Shawwal', h_month_11: 'Dhu al-Qi\'dah', h_month_12: 'Dhu al-Hijjah',
    }
};

let currentLanguage = 'ar';
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Optimized Hijri date function
function getHijriDate(date = new Date()) {
    try {
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
        const month = parseInt(hijriParts.month);
        const year = parseInt(hijriParts.year);

        const monthKey = `h_month_${month}`;
        const monthName = t(monthKey);

        return {
            year: year,
            month: month - 1,
            day: day,
            formatted: `${day} ${monthName} ${year}${t('hijri_suffix')}`
        };
    } catch (e) {
        return { error: e.message };
    }
}

const testDates = [
    '2026-01-01', // Should be 12 Rajab 1447
    '2024-03-11', // Should be ~1 Ramadan 1445
    '2024-04-10', // Should be ~1 Shawwal 1445
];

testDates.forEach(dateStr => {
    const date = new Date(dateStr);
    console.log(`Gregorian: ${dateStr}`);
    currentLanguage = 'ar';
    console.log(`Arabic: ${getHijriDate(date).formatted}`);
    currentLanguage = 'en';
    console.log(`English: ${getHijriDate(date).formatted}`);
    console.log('---');
});
