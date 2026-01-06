// ========================================
// i18n - Internationalization System
// ========================================

const translations = {
    ar: {
        // App
        app_name: 'صلاتك',
        app_description: 'تطبيق لمساعدتك على الالتزام بالصلوات وبناء عادات عبادية',

        // Navigation
        nav_daily_prayers: 'صلوات اليوم',
        nav_qada_prayers: 'الصلاة الفائتة',
        nav_habits: 'متتبع العادات',
        nav_statistics: 'الإحصائيات',
        nav_leaderboard: 'لوحة الصدارة',
        nav_store: 'المتجر',
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
        variable: 'متغير',

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
        reset_decision: 'إعادة تعيين القرار',

        // Daily Prayers Page
        daily_prayers_title: 'صلوات اليوم',
        daily_prayers_subtitle: 'سجل صلواتك اليومية واكسب النقاط',
        today: 'اليوم',
        previous_day: 'اليوم السابق',
        next_day: 'اليوم التالي',
        prayer_not_done: 'لم تؤد بعد',
        prayer_done: 'تمت',
        prayer_missed: 'فاتت',

        // Qada Prayers Page
        qada_prayers_title: 'الصلاة الفائتة',
        qada_prayers_subtitle: 'اقض صلواتك الفائتة لتقليل رصيدك',
        total_rakaat: 'إجمالي الركعات',
        no_qada_prayers: 'الحمد لله! لا توجد صلوات فائتة',
        qada_empty_message: 'استمر في المحافظة على صلواتك اليومية في وقتها',
        add_qada_prayer: 'إضافة صلوات فائتة',
        prayer_type: 'نوع الصلاة',
        prayer_count: 'عدد الصلوات',
        optional_date: 'التاريخ (اختياري)',
        date_unknown: 'غير معروف',
        add_multiple_hint: 'يمكنك إضافة عدة صلوات من نفس النوع دفعة واحدة',
        empty_date_hint: 'اترك فارغاً إذا كنت لا تتذكر التاريخ',
        invalid_count: 'يرجى إدخال عدد صحيح',
        count_too_large: 'العدد كبير جداً',
        added_prayers_success: 'تمت إضافة {count} صلاة {prayer}',

        // Habits Page
        habits_title: 'متتبع العادات',
        habits_subtitle: 'ابن عادات إيمانية وتخلص من العادات السيئة',
        worship_habit: 'عبادة',
        sin_habit: 'معصية',
        habit_name: 'اسم العادة',
        habit_type: 'نوع العادة',
        add_new_habit: 'إضافة عادة جديدة',
        mark_done: 'تم الأداء',
        mark_committed: 'ارتكبت',
        mark_avoided: 'تركت',
        streak: 'سلسلة',
        days: 'يوم',
        no_habits: 'لا توجد عادات مضافة',
        habits_empty_message: 'ابدأ بإضافة عادة جديدة لتتبعها',

        // Statistics Page
        statistics_title: 'الإحصائيات',
        statistics_subtitle: 'تابع تقدمك الإيماني وإنجازاتك',
        prayers_performed: 'الصلوات المؤداة',
        prayers_missed: 'الصلوات الفائتة',
        total_rakaat_prayed: 'إجمالي الركعات',
        worship_count: 'إجمالي العبادات',
        days_without_sin: 'أيام بدون معاصي',
        weekly_progress: 'التقدم الأسبوعي',
        monthly_progress: 'التقدم الشهري',
        completion_rate: 'نسبة الإنجاز',
        points_to_next_level: '{points} نقطة للمستوى التالي',

        // Settings Page
        settings_title: 'الإعدادات',
        settings_subtitle: 'خصص تجربتك بما يناسبك',
        theme: 'المظهر',
        theme_light: 'فاتح',
        theme_dark: 'داكن',
        theme_auto: 'تلقائي',
        language: 'اللغة',
        language_ar: 'العربية',
        language_en: 'English',
        location_settings: 'إعدادات الموقع',
        calculation_settings: 'إعدادات الحساب',
        calculation_method: 'طريقة الحساب',
        madhab: 'المذهب',
        save_settings: 'حفظ الإعدادات',
        method_umm_al_qura: 'أم القرى',
        method_muslim_world_league: 'رابطة العالم الإسلامي',
        method_egyptian: 'الهيئة العامة المصرية للمساحة',
        method_karachi: 'جامعة العلوم الإسلامية بكراتشي',
        method_uae: 'الإمارات العربية المتحدة',
        method_north_america: 'أمريكا الشمالية (ISNA)',
        method_kuwait: 'الكويت',
        method_qatar: 'قطر',
        method_singapore: 'سنغافورة',
        method_other: 'أخرى',
        madhab_shafi: 'شافعي / مالكي / حنبلي',
        madhab_hanafi: 'حنفي',
        latitude: 'خط العرض',
        longitude: 'خط الطول',
        region: 'المنطقة / المحافظة',
        select_region: 'اختر المنطقة',
        save_location: 'حفظ الموقع يدوياً',
        auto_location: 'تحديد الموقع تلقائياً',
        location_updated: 'تم تحديث الموقع بنجاح',
        manual_mode_on: 'تم تفعيل الموقع اليدوي',
        auto_mode_on: 'تم تفعيل التحديد التلقائي للموقع',
        data_management: 'إدارة البيانات',
        about: 'حول التطبيق',
        version: 'الإصدار',
        download_app: 'لتنزيل التطبيق الخاص بالهاتف',
        error_invalid_input: 'البيانات المدخلة غير صحيحة',
        error_importing: 'حدث خطأ أثناء استيراد البيانات',

        // Points
        your_points: 'رصيد نقاطك',
        points_history: 'سجل النقاط',
        level: 'المستوى',
        new: 'جديد',
        beginner: 'مبتدئ',
        intermediate: 'متوسط',
        excellent: 'ممتاز',
        legendary: 'أسطوري',
        heroic: 'بطولي',
        royal: 'ملكي',
        miraculous: 'إعجازي',
        absolute_classifier: 'مصنف مطلق',

        // Messages
        prayer_performed_message: 'بارك الله فيك! تم تسجيل الصلاة',
        prayer_missed_message: 'تم تسجيل الصلاة كفائتة، بادر بقضائها',
        qada_made_up_message: 'أحسنت! تم قضاء الصلاة بنجاح',
        habit_added_message: 'تمت إضافة العادة بنجاح',
        habit_deleted_message: 'تم حذف العادة',
        habit_marked_message: 'تم تحديث سجل العادة',
        data_exported_message: 'تم تصدير البيانات بنجاح',
        data_imported_message: 'تم استيراد البيانات بنجاح',
        data_cleared_message: 'تم مسح جميع البيانات بنجاح',
        confirm_delete: 'هل أنت متأكد من الحذف؟',
        confirm_clear_all: 'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.',
        loading_message: 'يرجى الانتظار، جاري تحديد مواقيت الصلاة في منطقتك...',
        error_location: 'تعذر تحديد الموقع',
        error_calculation: 'خطأ في حساب مواقيت الصلاة',
        notifications_title: 'الإشعارات',
        notification_permission_title: 'تفعيل الإشعارات',
        notification_permission_body: 'هل ترغب بتفعيل التنبيهات لأوقات الصلاة؟',
        time_for_prayer: 'حان الآن موعد أذان {prayer}',
        click_to_open: 'اضغط لفتح التطبيق',
        test_notification: 'إشعار تجريبي',

        // v1.3.0 Features
        change_decision: 'تغيير القرار',
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
        hijri_suffix: 'هـ',

        jan: 'يناير', feb: 'فبراير', mar: 'مارس', apr: 'أبريل', may: 'مايو', jun: 'يونيو',
        jul: 'يوليو', aug: 'أغسطس', sep: 'سبتمبر', oct: 'أكتوبر', nov: 'نوفمبر', dec: 'ديسمبر',

        // Hijri Months
        h_month_1: 'محرم', h_month_2: 'صفر', h_month_3: 'ربيع الأول', h_month_4: 'ربيع الثاني',
        h_month_5: 'جمادى الأولى', h_month_6: 'جمادى الثانية', h_month_7: 'رجب', h_month_8: 'شعبان',
        h_month_9: 'رمضان', h_month_10: 'شوال', h_month_11: 'ذو القعدة', h_month_12: 'ذو الحجة',

        // Short days
        day_0: 'ح', day_1: 'ن', day_2: 'ث', day_3: 'ر', day_4: 'خ', day_5: 'ج', day_6: 'س',

        // Auth
        login_title: 'تسجيل الدخول',
        signup_title: 'إنشاء حساب',
        login_subtitle: 'أهلاً بك مجدداً في صلاتك',
        signup_subtitle: 'ابدأ رحلتك الإيمانية معنا اليوم',
        username_label: 'اسم المستخدم',
        password_label: 'كلمة المرور',
        full_name_label: 'الاسم الكامل',
        username_placeholder: 'username',
        password_placeholder: '••••••••',
        full_name_placeholder: 'أدخل اسمك الكامل',
        login_button: 'دخول',
        signup_button: 'تسجيل',
        loading_auth: 'جاري التحقق',
        no_account_text: 'ليس لديك حساب؟',
        have_account_text: 'لديك حساب بالفعل؟',
        signup_link: 'سجل الآن',
        login_link: 'سجل دخولك',
        login_success: 'تم تسجيل الدخول بنجاح',
        signup_success: 'تم إنشاء الحساب بنجاح',
        username_too_short: 'اسم المستخدم قصير جداً',

        // Leaderboard
        nav_leaderboard: 'لوحة الصدارة',
        leaderboard_title: 'لوحة الصدارة',
        leaderboard_subtitle: 'تنافس مع الآخرين في فعل الخيرات',
        rank_header: 'الترتيب',
        user_header: 'المستخدم',
        points_header: 'النقاط',
        no_leaderboard_data: 'لا يوجد متسابقون بعد، كن الأول!',
        error_fetching_leaderboard: 'حدث خطأ أثناء جلب ترتيب المتسابقين',

        // Account
        account_settings: 'إدارة الحساب',
        logout_button: 'تسجيل الخروج',
        logged_in_as: 'مسجل الدخول باسم',
        edit_profile: 'تعديل الملف الشخصي',
        full_name: 'الاسم الكامل',
        bio: 'نبذة عني',
        save_profile: 'حفظ الملف الشخصي',
        cancel: 'إلغاء',
        profile_updated: 'تم تحديث الملف الشخصي بنجاح',
        account_stats: 'إحصائيات الحساب',
        member_since: 'عضو منذ',
        total_prayers: 'إجمالي الصلوات',
        total_habits: 'إجمالي العادات',
        current_streak: 'السلسلة الحالية',
        days: 'أيام',
        change_password: 'تغيير كلمة المرور',
        current_password: 'كلمة المرور الحالية',
        new_password: 'كلمة المرور الجديدة',
        confirm_password: 'تأكيد كلمة المرور',
        password_changed: 'تم تغيير كلمة المرور بنجاح',
        password_mismatch: 'كلمات المرور غير متطابقة',
        delete_account: 'حذف الحساب',
        delete_account_warning: 'تحذير: سيتم حذف جميع بياناتك نهائياً',
        confirm_delete_account: 'هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه.',
        account_deleted: 'تم حذف الحساب بنجاح',

        // Sync & Data
        force_sync: 'تزامن قسري',
        syncing_message: 'جاري المزامنة...',
        sync_success: 'تمت المزامنة بنجاح',
        sync_error: 'فشل التزامن',
        error_general: 'حدث خطأ ما، يرجى المحاولة لاحقاً',

        // Leaderboard Errors & Help
        error_login_required: 'يجب تسجيل الدخول لعرض لوحة المتصدرين',
        error_leaderboard_disabled: 'لوحة المتصدرين غير مُفعّلة. يرجى تشغيل سكريبت SQL: supabase_leaderboard_view.sql',
        error_sql_help_title: 'خطأ في تحميل البيانات',
        error_sql_help_intro: 'خطوات الإصلاح:',
        sql_step_1: 'افتح لوحة تحكم Supabase',
        sql_step_2: 'انتقل إلى SQL Editor',
        sql_step_3: 'قم بتشغيل الملف: supabase_leaderboard_view.sql',
        sql_step_4: 'أعد تحميل الصفحة',
        progress_header: 'الإنجاز',
        you: 'أنت',

        // Date Suffixes
        short_day: 'ي',
        short_month: 'ش',
        short_year: 'س',

        // Referral System
        referral_section_title: 'نظام المشاركة',
        your_referral_code: 'كود المشاركة الخاص بك',
        referral_code_hint: 'شارك كودك مع أصدقائك واكسب 7 نقاط لكل منكما!',
        enter_referral_code: 'أدخل كود صديق',
        apply_code_button: 'تفعيل الكود',
        referral_code_applied: 'تم تفعيل الكود بنجاح! حصلت أنت وصديقك على 7 نقاط',
        error_already_referred: 'لقد قمت بالفعل باستخدام كود مشاركة من قبل',
        error_own_code: 'لا يمكنك استخدام كودك الخاص',
        error_invalid_code: 'هذا الكود غير صحيح',
        share_app_button: 'مشاركة التطبيق',
        share_message: 'حمل تطبيق صلاتك من هنا واكسب 7 نقاط باستخدام كودي: {code} \n https://salatk-app.pages.dev/',

        // Store
        store_title: 'متجر الثيمات والتصاميم',
        store_subtitle: 'خصص مظهر تطبيقك واجعل تجربتك فريدة',
        premium_designs: 'تصاميم مميزة',
        owned: 'ممتلك',
        apply: 'تطبيق',
        buy: 'شراء',
        free: 'مجاني',
        theme_light_desc: 'التصميم الفاتح الكلاسيكي المريح للعين في النهار',
        theme_dark_desc: 'التصميم الداكن الأنيق المريح للعين في الليل',
        points_short: 'نقطة',
        insufficient_points: 'عذراً، ليس لديك نقاط كافية لشراء هذا الثيم',
        purchase_success: 'تم شراء الثيم بنجاح! يمكنك الآن تطبيقه',
        purchase_confirm: 'هل أنت متأكد من رغبتك في شراء "{name}" مقابل {price} نقطة؟',
        Emerald: 'زمردي',
        'Midnight Blue': 'أزرق منتصف الليل',
        'Night Sky': 'سماء الليل',
        'Dark Sun': 'شمس الظلام',
        'Metal Knight': 'الفارس المعدني',
        'Premium emerald green theme': 'ثيم أخضر زمردي فاخر',
        'Deep blue night theme': 'ثيم أزرق ليلي عميق',
        'Sparkling stars night theme': 'ثيم النجوم المتلألئة والليل الهادئ',
        'Night mode with golden stars': 'الوضع الليلي مع نجوم ذهبية متألقة',
        'Polished steel and armor theme': 'ثيم الفولاذ المصقول والدروع الحديدية',
    },

    en: {
        // App
        app_name: 'Salatk',
        app_description: 'An app to help you stay committed to prayers and build worship habits',

        // Navigation
        nav_daily_prayers: "Daily Prayers",
        nav_qada_prayers: 'Missed Prayers',
        nav_habits: 'Habit Tracker',
        nav_statistics: 'Statistics',
        nav_leaderboard: 'Leaderboard',
        nav_store: 'Store',
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
        variable: 'variable',

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
        reset_decision: 'Reset Decision',

        // Daily Prayers Page
        daily_prayers_title: "Daily Prayers",
        daily_prayers_subtitle: 'Track your daily prayers and earn points',
        today: 'Today',
        previous_day: 'Previous Day',
        next_day: 'Next Day',
        prayer_not_done: 'Not performed yet',
        prayer_done: 'Completed',
        prayer_missed: 'Missed',

        // Qada Prayers Page
        qada_prayers_title: 'Missed Prayers',
        qada_prayers_subtitle: 'Make up your missed prayers to clear your list',
        total_rakaat: 'Total Rakaat',
        no_qada_prayers: 'Alhamdulillah! No missed prayers',
        qada_empty_message: 'Keep maintaining your daily prayers on time',
        add_qada_prayer: 'Add Missed Prayers',
        prayer_type: 'Prayer Type',
        prayer_count: 'Number of Prayers',
        optional_date: 'Date (Optional)',
        date_unknown: 'Unknown',
        add_multiple_hint: 'You can add multiple prayers of the same type at once',
        empty_date_hint: 'Leave empty if you don\'t remember the date',
        invalid_count: 'Please enter a valid count',
        count_too_large: 'Count is too large',
        added_prayers_success: 'Added {count} {prayer} prayers',

        // Habits Page
        habits_title: 'Habit Tracker',
        habits_subtitle: 'Build spiritual habits and eliminate bad ones',
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
        no_habits: 'No habits added',
        habits_empty_message: 'Start by adding a new habit to track',

        // Statistics Page
        statistics_title: 'Statistics',
        statistics_subtitle: 'Track your spiritual progress and achievements',
        prayers_performed: 'Prayers Performed',
        prayers_missed: 'Prayers Missed',
        total_rakaat_prayed: 'Total Rakaat',
        worship_count: 'Total Worship',
        days_without_sin: 'Days Without Sin',
        weekly_progress: 'Weekly Progress',
        monthly_progress: 'Monthly Progress',
        completion_rate: 'Completion Rate',
        points_to_next_level: '{points} points to next level',

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
        calculation_settings: 'Calculation Settings',
        calculation_method: 'Calculation Method',
        madhab: 'Madhab',
        save_settings: 'Save Settings',
        method_umm_al_qura: 'Umm Al-Qura',
        method_muslim_world_league: 'Muslim World League',
        method_egyptian: 'Egyptian General Authority of Survey',
        method_karachi: 'University of Islamic Sciences, Karachi',
        method_uae: 'UAE',
        method_north_america: 'North America (ISNA)',
        method_kuwait: 'Kuwait',
        method_qatar: 'Qatar',
        method_singapore: 'Singapore',
        method_other: 'Other',
        madhab_shafi: 'Shafi / Maliki / Hanbali',
        madhab_hanafi: 'Hanafi',
        latitude: 'Latitude',
        longitude: 'Longitude',
        region: 'Region / Governorate',
        select_region: 'Select Region',
        save_location: 'Save Manual Location',
        auto_location: 'Auto-Detect Location',
        location_updated: 'Location updated successfully',
        manual_mode_on: 'Manual location mode enabled',
        auto_mode_on: 'Auto-detect location enabled',
        data_management: 'Data Management',
        about: 'About',
        version: 'Version',
        download_app: 'To download the mobile app',
        error_invalid_input: 'Invalid input data',
        error_importing: 'Error occurred while importing data',

        // Points
        your_points: 'Your Points',
        points_history: 'Points History',
        level: 'Level',
        new: 'New',
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        excellent: 'Excellent',
        legendary: 'Legendary',
        heroic: 'Heroic',
        royal: 'Royal',
        miraculous: 'Miraculous',
        absolute_classifier: 'Absolute Classifier',

        // Messages
        prayer_performed_message: 'Barakallahu feek! Prayer recorded',
        prayer_missed_message: 'Prayer recorded as missed, try to make it up',
        qada_made_up_message: 'Well done! Prayer made up successfully',
        habit_added_message: 'Habit added successfully',
        habit_deleted_message: 'Habit deleted',
        habit_marked_message: 'Habit history updated',
        data_exported_message: 'Data exported successfully',
        data_imported_message: 'Data imported successfully',
        data_cleared_message: 'All data cleared successfully',
        confirm_delete: 'Are you sure you want to delete?',
        confirm_clear_all: 'Are you sure you want to clear all data? This action cannot be undone.',
        loading_message: 'Please wait, determining prayer times...',
        error_location: 'Could not determine location',
        error_calculation: 'Error calculating prayer times',
        notifications_title: 'Notifications',
        notification_permission_title: 'Enable Notifications',
        notification_permission_body: 'Do you want to enable prayer time alerts?',
        time_for_prayer: 'It is now time for {prayer} prayer',
        click_to_open: 'Click to open app',
        test_notification: 'Test Notification',

        // v1.3.0 Features
        change_decision: 'Change Decision',
        edit_qada: 'Edit Missed Prayer',
        remove_qada: 'Remove from Qada',
        last_7_days_only: 'Modifications allowed for the last 7 days only',
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
        hijri_suffix: 'AH',

        jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
        jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',

        // Hijri Months
        h_month_1: 'Muharram', h_month_2: 'Safar', h_month_3: 'Rabi\' al-Awwal', h_month_4: 'Rabi\' al-Thani',
        h_month_5: 'Jumada al-Ula', h_month_6: 'Jumada al-Akhirah', h_month_7: 'Rajab', h_month_8: 'Sha\'ban',
        h_month_9: 'Ramadan', h_month_10: 'Shawwal', h_month_11: 'Dhu al-Qi\'dah', h_month_12: 'Dhu al-Hijjah',

        // Short days
        day_0: 'Su', day_1: 'Mo', day_2: 'Tu', day_3: 'We', day_4: 'Th', day_5: 'Fr', day_6: 'Sa',

        // Auth
        login_title: 'Login',
        signup_title: 'Sign Up',
        login_subtitle: 'Welcome back to Salatk',
        signup_subtitle: 'Start your spiritual journey today',
        username_label: 'Username',
        password_label: 'Password',
        full_name_label: 'Full Name',
        username_placeholder: 'username',
        password_placeholder: '••••••••',
        full_name_placeholder: 'Enter your full name',
        login_button: 'Login',
        signup_button: 'Sign Up',
        loading_auth: 'Verifying',
        no_account_text: 'Don\'t have an account?',
        have_account_text: 'Already have an account?',
        signup_link: 'Sign up now',
        login_link: 'Login now',
        login_success: 'Login successful',
        signup_success: 'Account created successfully',
        username_too_short: 'Username too short',

        // Leaderboard
        nav_leaderboard: 'Leaderboard',
        leaderboard_title: 'Leaderboard',
        leaderboard_subtitle: 'Compete with others in doing good',
        rank_header: 'Rank',
        user_header: 'User',
        points_header: 'Points',
        no_leaderboard_data: 'No competitors yet, be the first!',
        error_fetching_leaderboard: 'Error fetching leaderboard',

        // Account
        account_settings: 'Account Management',
        logout_button: 'Logout',
        logged_in_as: 'Logged in as',
        edit_profile: 'Edit Profile',
        full_name: 'Full Name',
        bio: 'Bio',
        save_profile: 'Save Profile',
        cancel: 'Cancel',
        profile_updated: 'Profile updated successfully',
        account_stats: 'Account Statistics',
        member_since: 'Member since',
        total_prayers: 'Total Prayers',
        total_habits: 'Total Habits',
        current_streak: 'Current Streak',
        days: 'days',
        change_password: 'Change Password',
        current_password: 'Current Password',
        new_password: 'New Password',
        confirm_password: 'Confirm Password',
        password_changed: 'Password changed successfully',
        password_mismatch: 'Passwords do not match',
        delete_account: 'Delete Account',
        delete_account_warning: 'Warning: All your data will be permanently deleted',
        confirm_delete_account: 'Are you sure you want to delete your account? This action cannot be undone.',
        account_deleted: 'Account deleted successfully',

        // Sync & Data
        force_sync: 'Force Sync',
        syncing_message: 'Syncing...',
        sync_success: 'Sync complete',
        sync_error: 'Sync failed',
        error_general: 'Something went wrong, please try again later',

        // Leaderboard Errors & Help
        error_login_required: 'You must be logged in to view the leaderboard',
        error_leaderboard_disabled: 'Leaderboard is disabled. Please run SQL script: supabase_leaderboard_view.sql',
        error_sql_help_title: 'Error Loading Data',
        error_sql_help_intro: 'Fix Steps:',
        sql_step_1: 'Open Supabase Dashboard',
        sql_step_2: 'Go to SQL Editor',
        sql_step_3: 'Run file: supabase_leaderboard_view.sql',
        sql_step_4: 'Reload Page',
        progress_header: 'Progress',
        you: 'You',

        // Date Suffixes
        short_day: 'd',
        short_month: 'm',
        short_year: 'y',

        // Referral System
        referral_section_title: 'Referral System',
        your_referral_code: 'Your Referral Code',
        referral_code_hint: 'Share your code with friends and both of you get 7 points!',
        enter_referral_code: "Enter Friend's Code",
        apply_code_button: 'Apply Code',
        referral_code_applied: 'Code applied successfully! You and your friend got 7 points',
        error_already_referred: 'You have already used a referral code',
        error_own_code: 'You cannot use your own code',
        error_invalid_code: 'This code is invalid',
        share_app_button: 'Share App',
        share_message: 'Download Salatk app and get 7 points using my code: {code} \n https://salatk-app.pages.dev/',

        // Store
        store_title: 'Themes & Designs Store',
        store_subtitle: 'Customize your app appearance',
        premium_designs: 'Premium Designs',
        owned: 'Owned',
        apply: 'Apply',
        buy: 'Buy',
        free: 'Free',
        theme_light_desc: 'Classic light design for comfortable daytime use',
        theme_dark_desc: 'Elegant dark design for comfortable nighttime use',
        points_short: 'pts',
        insufficient_points: 'Sorry, you don\'t have enough points to buy this theme',
        purchase_success: 'Theme purchased successfully! You can now apply it',
        purchase_confirm: 'Are you sure you want to buy "{name}" for {price} points?',
        Emerald: 'Emerald',
        'Midnight Blue': 'Midnight Blue',
        'Night Sky': 'Night Sky',
        'Dark Sun': 'Dark Sun',
        'Metal Knight': 'Metal Knight',
        'Premium emerald green theme': 'Premium emerald green theme',
        'Deep blue night theme': 'Deep blue night theme',
        'Sparkling stars night theme': 'Sparkling stars night theme',
        'Night mode with golden stars': 'Night mode with golden stars',
        'Polished steel and armor theme': 'Polished steel and armor theme',
    }
};

// Current language
let currentLanguage = localStorage.getItem('salatk_language') || 'ar';

// Get translation
function t(key) {
    if (!translations[currentLanguage]) return key;
    return translations[currentLanguage][key] || key;
}

// Set language
function setLanguage(lang) {
    if (lang === currentLanguage && document.documentElement.lang === lang) return;
    currentLanguage = lang;
    localStorage.setItem('salatk_language', lang);
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
