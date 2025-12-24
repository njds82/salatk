// ========================================
// i18n - Internationalization System
// ========================================

const translations = {
    ar: {
        // App
        app_name: 'صلاتك',

        // Navigation
        nav_daily_prayers: 'صلوات اليوم',
        nav_qada_prayers: 'الصلاة الفائتة',
        nav_habits: 'متتبع العادات',
        nav_statistics: 'الإحصائيات',
        nav_settings: 'الإعدادات',

        // Prayer names
        fajr: 'الفجر',
        duha: 'الضحى',
        dhuhr: 'الظهر',
        asr: 'العصر',
        maghrib: 'المغرب',
        isha: 'العشاء',
        qiyam: 'قيام الليل',

        // Prayer details
        rakaat: 'ركعة',
        rakaat_plural: 'ركعات',
        points: 'نقطة',
        points_plural: 'نقاط',

        // Actions
        performed: 'أديت',
        missed: 'تركت',
        made_up: 'قضيت الصلاة',
        add_habit: 'إضافة عادة',
        edit: 'تعديل',
        delete: 'حذف',
        save: 'حفظ',
        cancel: 'إلغاء',
        confirm: 'تأكيد',
        close: 'إغلاق',
        export_data: 'تصدير البيانات',
        import_data: 'استيراد البيانات',
        clear_all: 'مسح الكل',

        // Daily Prayers Page
        daily_prayers_title: 'صلوات اليوم',
        daily_prayers_subtitle: 'سجل صلواتك اليومية واكسب النقاط',
        today: 'اليوم',
        prayer_not_done: 'لم تؤد بعد',
        prayer_done: 'تمت',
        prayer_missed: 'فاتت',

        // Qada Prayers Page
        qada_prayers_title: 'الصلاة الفائتة',
        qada_prayers_subtitle: 'اقض صلواتك الفائتة',
        total_rakaat: 'إجمالي الركعات',
        no_qada_prayers: 'الحمد لله! لا توجد صلوات فائتة',
        qada_empty_message: 'استمر في المحافظة على صلواتك اليومية',
        add_qada_prayer: 'إضافة صلوات فائتة',
        prayer_type: 'نوع الصلاة',
        prayer_count: 'عدد الصلوات',
        optional_date: 'التاريخ (اختياري)',
        date_unknown: 'غير معروف',


        // Habits Page
        habits_title: 'متتبع العادات',
        habits_subtitle: 'ابن عادات جيدة وتخلص من السيئة',
        worship_habit: 'عبادة',
        sin_habit: 'معصية',
        habit_name: 'اسم العادة',
        habit_type: 'نوع العادة',
        add_new_habit: 'إضافة عادة جديدة',
        mark_done: 'تم',
        mark_committed: 'ارتكبت',
        mark_avoided: 'تركت',
        streak: 'سلسلة',
        days: 'يوم',
        no_habits: 'لا توجد عادات',
        habits_empty_message: 'ابدأ بإضافة عادة جديدة',

        // Statistics Page
        statistics_title: 'الإحصائيات',
        statistics_subtitle: 'تابع تقدمك وإنجازاتك',
        prayers_performed: 'الصلوات المؤداة',
        prayers_missed: 'الصلوات الفائتة',
        total_rakaat_prayed: 'إجمالي الركعات',
        worship_count: 'العبادات',
        days_without_sin: 'أيام بدون معاصي',
        weekly_progress: 'التقدم الأسبوعي',
        monthly_progress: 'التقدم الشهري',
        completion_rate: 'نسبة الإنجاز',

        // Settings Page
        settings_title: 'الإعدادات',
        settings_subtitle: 'خصص تجربة استخدامك',
        theme: 'المظهر',
        theme_light: 'فاتح',
        theme_dark: 'داكن',
        theme_auto: 'تلقائي',
        language: 'اللغة',
        language_ar: 'العربية',
        language_en: 'English',
        location_settings: 'إعدادات الموقع',
        latitude: 'خط العرض',
        longitude: 'خط الطول',
        save_location: 'حفظ الموقع يدوياً',
        auto_location: 'تحديد الموقع تلقائياً',
        location_updated: 'تم تحديث الموقع بنجاح',
        manual_mode_on: 'تم تفعيل الموقع اليدوي',
        auto_mode_on: 'تم تفعيل التحديد التلقائي للموقع',
        data_management: 'إدارة البيانات',
        about: 'حول التطبيق',
        version: 'الإصدار',
        download_app: 'لتنزيل التطبيق الخاص بالآندرويد',

        // Points
        your_points: 'نقاطك',
        points_history: 'سجل النقاط',
        level: 'المستوى',
        beginner: 'مبتدئ',
        intermediate: 'متقدم',
        advanced: 'محسن',
        expert: 'متقن',

        // Messages
        prayer_performed_message: 'بارك الله فيك! تمت إضافة الصلاة',
        prayer_missed_message: 'تم تسجيل الصلاة كفائتة',
        qada_made_up_message: 'أحسنت! تم قضاء الصلاة',
        habit_added_message: 'تمت إضافة العادة',
        habit_deleted_message: 'تم حذف العادة',
        habit_marked_message: 'تم تحديث العادة',
        data_exported_message: 'تم تصدير البيانات',
        data_imported_message: 'تم استيراد البيانات',
        data_cleared_message: 'تم مسح جميع البيانات',
        confirm_delete: 'هل أنت متأكد من الحذف؟',
        confirm_clear_all: 'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
        confirm_logout: 'هل أنت متأكد من تسجيل الخروج؟',
        loading_message: 'يرجى الانتظار لبضع ثوان، جاري محاولة تحديد مواقيت الصلاة في منطقتك...',

        // v1.3.0 Features
        change_decision: 'تغيير القرار',
        reset_decision: 'إعادة تعيين',
        edit_qada: 'تعديل الصلاة الفائتة',
        remove_qada: 'إزالة من القضاء',
        last_7_days_only: 'يمكن التعديل لآخر 7 أيام فقط',
        select_date: 'اختر التاريخ',
        history_navigation: 'سجل الأيام السابقة',
        undo_success: 'تم التراجع عن القرار بنجاح',

        // Date
        saturday: 'السبت',
        sunday: 'الأحد',
        monday: 'الاثنين',
        tuesday: 'الثلاثاء',
        wednesday: 'الأربعاء',
        thursday: 'الخميس',
        friday: 'الجمعة',

        // Auth
        login_title: 'تسجيل الدخول',
        signup_title: 'إنشاء حساب',
        full_name: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        confirm_password: 'تأكيد كلمة المرور',
        login_btn: 'دخول',
        signup_btn: 'إنشاء حساب',
        no_account: 'ليس لديك حساب؟',
        have_account: 'لديك حساب بالفعل؟',
        logout: 'تسجيل الخروج',
        invalid_email: 'البريد الإلكتروني غير صالح',
        password_mismatch: 'كلمات المرور غير متطابقة',
        auth_error: 'خطأ في اسم المستخدم أو كلمة المرور',
        signup_success: 'تم إنشاء الحساب بنجاح',
        field_required: 'هذا الحقل مطلوب',
    },

    en: {
        // App
        app_name: 'Salatk',

        // Navigation
        nav_daily_prayers: "Today's Prayers",
        nav_qada_prayers: 'Missed Prayers',
        nav_habits: 'Habit Tracker',
        nav_statistics: 'Statistics',
        nav_settings: 'Settings',

        // Prayer names
        fajr: 'Fajr',
        duha: 'Duha',
        dhuhr: 'Dhuhr',
        asr: 'Asr',
        maghrib: 'Maghrib',
        isha: 'Isha',
        qiyam: 'Qiyam al-Layl',

        // Prayer details
        rakaat: 'rakah',
        rakaat_plural: 'rakaat',
        points: 'point',
        points_plural: 'points',

        // Actions
        performed: 'Performed',
        missed: 'Missed',
        made_up: 'Made Up',
        add_habit: 'Add Habit',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        close: 'Close',
        export_data: 'Export Data',
        import_data: 'Import Data',
        clear_all: 'Clear All',

        // Daily Prayers Page
        daily_prayers_title: "Today's Prayers",
        daily_prayers_subtitle: 'Track your daily prayers and earn points',
        today: 'Today',
        prayer_not_done: 'Not performed yet',
        prayer_done: 'Completed',
        prayer_missed: 'Missed',

        // Qada Prayers Page
        qada_prayers_title: 'Missed Prayers',
        qada_prayers_subtitle: 'Make up your missed prayers',
        total_rakaat: 'Total Rakaat',
        no_qada_prayers: 'Alhamdulillah! No missed prayers',
        qada_empty_message: 'Keep maintaining your daily prayers',
        add_qada_prayer: 'Add Missed Prayers',
        prayer_type: 'Prayer Type',
        prayer_count: 'Number of Prayers',
        optional_date: 'Date (Optional)',
        date_unknown: 'Unknown',


        // Habits Page
        habits_title: 'Habit Tracker',
        habits_subtitle: 'Build good habits and eliminate bad ones',
        worship_habit: 'Worship',
        sin_habit: 'Sin',
        habit_name: 'Habit Name',
        habit_type: 'Habit Type',
        add_new_habit: 'Add New Habit',
        mark_done: 'Done',
        mark_committed: 'Committed',
        mark_avoided: 'Avoided',
        streak: 'Streak',
        days: 'days',
        no_habits: 'No habits',
        habits_empty_message: 'Start by adding a new habit',

        // Statistics Page
        statistics_title: 'Statistics',
        statistics_subtitle: 'Track your progress and achievements',
        prayers_performed: 'Prayers Performed',
        prayers_missed: 'Prayers Missed',
        total_rakaat_prayed: 'Total Rakaat',
        worship_count: 'Worship Count',
        days_without_sin: 'Days Without Sin',
        weekly_progress: 'Weekly Progress',
        monthly_progress: 'Monthly Progress',
        completion_rate: 'Completion Rate',

        // Settings Page
        settings_title: 'Settings',
        settings_subtitle: 'Customize your experience',
        theme: 'Theme',
        theme_light: 'Light',
        theme_dark: 'Dark',
        theme_auto: 'Auto',
        language: 'Language',
        language_ar: 'العربية',
        language_en: 'English',
        location_settings: 'Location Settings',
        latitude: 'Latitude',
        longitude: 'Longitude',
        save_location: 'Save Manual Location',
        auto_location: 'Auto-Detect Location',
        location_updated: 'Location updated successfully',
        manual_mode_on: 'Manual location mode enabled',
        auto_mode_on: 'Auto-detect location enabled',
        data_management: 'Data Management',
        about: 'About',
        version: 'Version',
        download_app: 'Download Android app',

        // Points
        your_points: 'Your Points',
        points_history: 'Points History',
        level: 'Level',
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        expert: 'Expert',

        // Messages
        prayer_performed_message: 'Barakallahu feek! Prayer added',
        prayer_missed_message: 'Prayer recorded as missed',
        qada_made_up_message: 'Well done! Prayer made up',
        habit_added_message: 'Habit added',
        habit_deleted_message: 'Habit deleted',
        habit_marked_message: 'Habit updated',
        data_exported_message: 'Data exported',
        data_imported_message: 'Data imported',
        data_cleared_message: 'All data cleared',
        confirm_delete: 'Are you sure you want to delete?',
        confirm_clear_all: 'Are you sure you want to clear all data? This action cannot be undone.',
        confirm_logout: 'Are you sure you want to logout?',
        loading_message: 'Please wait a few seconds, locating...',

        // v1.3.0 Features
        change_decision: 'Change Decision',
        reset_decision: 'Reset Decision',
        edit_qada: 'Edit Missed Prayer',
        remove_qada: 'Remove from Qada',
        last_7_days_only: 'Modifications allowed for last 7 days only',
        select_date: 'Select Date',
        history_navigation: 'History Navigation',
        undo_success: 'Decision undone successfully',

        // Date
        saturday: 'Saturday',
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',

        // Auth
        login_title: 'Login',
        signup_title: 'Sign Up',
        full_name: 'Full Name',
        email: 'Email',
        username: 'Username',
        password: 'Password',
        confirm_password: 'Confirm Password',
        login_btn: 'Login',
        signup_btn: 'Sign Up',
        no_account: "Don't have an account?",
        have_account: 'Already have an account?',
        logout: 'Logout',
        invalid_email: 'Invalid email address',
        password_mismatch: 'Passwords do not match',
        auth_error: 'Invalid username or password',
        signup_success: 'Account created successfully',
        field_required: 'This field is required',
    }
};

// Get user-specific language key
const getLangKey = () => {
    return AuthManager.getUserKey('salatk_language');
};

// Current language
let currentLanguage = localStorage.getItem(getLangKey()) || 'ar';

// Get translation
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Set language
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem(getLangKey(), lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    updatePageTranslations();
}

// Update all translations on page
function updatePageTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });

    // Update lang toggle button
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.querySelector('.lang-text').textContent = currentLanguage === 'ar' ? 'EN' : 'ع';
    }

    // Trigger custom event for components to update
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

// Get current language
function getCurrentLanguage() {
    return currentLanguage;
}

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLanguage);
});
