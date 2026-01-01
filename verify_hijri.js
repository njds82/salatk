
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

// Hijri conversion using accurate algorithm (based on Umm al-Qura calendar)
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
            month: im - 1,
            day: id,
            formatted: `${id} ${monthName} ${iy}${t('hijri_suffix')}`
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
