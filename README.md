# Salatk (صلاتك) 🕌

**Salatk** هو تطبيق ويب تقدمي (PWA) يساعد المستخدم على:
- متابعة الصلوات اليومية.
- إدارة صلوات القضاء.
- تتبع العادات.
- إدارة المهام اليومية.
- التحفيز عبر نظام نقاط ولوحة صدارة.

يعتمد التطبيق على **Supabase** مع مزامنة لحظية، وبنية Frontend تعتمد على JavaScript modules بنمط `window` globals.

---

## 📑 الفهرس
1. [خارطة الملفات (File Map)](#-خارطة-الملفات-file-map)
2. [شرح الوحدات (Modules)](#-شرح-الوحدات-modules)
3. [قاعدة البيانات (Database Schema)](#-قاعدة-البيانات-database-schema)
4. [الاتصالات والعلاقات (Connections & Relationships)](#-الاتصالات-والعلاقات-connections--relationships)
5. [الثوابت الأساسية (Core Constants)](#-الثوابت-الأساسية-core-constants)
6. [العمليات الرئيسية (Core Flows)](#-العمليات-الرئيسية-core-flows)
7. [مراجعة الكود (Code Review Snapshot)](#-مراجعة-الكود-code-review-snapshot)

---

## 📂 خارطة الملفات (File Map)

```text
/home/loid/code/salatk/
├── index.html                  # نقطة الدخول وترتيب تحميل السكربتات
├── styles.css                  # التنسيقات العامة والثيمات
├── sw.js                       # Service Worker
├── supabase_tasks.sql          # SQL لإنشاء جدول المهام وسياساته
├── verify_hijri.js             # سكربت تحقق مستقل للتاريخ الهجري
├── components/                 # مكونات واجهة قابلة لإعادة الاستخدام
│   ├── toast.js
│   ├── modal.js
│   ├── prayer-card.js
│   ├── habit-card.js
│   ├── charts.js
│   └── points-display.js
├── assets/images/logo.png
└── js/
    ├── app.js                  # الـ Router + bootstrap للتطبيق
    ├── auth-manager.js
    ├── prayer-manager.js
    ├── notification-manager.js
    ├── sync-manager.js
    ├── data-manager.js         # واجهة توافق قديمة (legacy facade)
    ├── points-manager.js
    ├── date-utils.js
    ├── i18n.js
    ├── db.js
    ├── config.js
    ├── config.example.js
    ├── supabaseClient.js
    ├── ui-helpers.js
    ├── data/questions.js
    ├── services/
    │   ├── prayer-service.js
    │   ├── habit-service.js
    │   ├── points-service.js
    │   ├── settings-service.js
    │   ├── task-service.js
    │   └── migration-service.js   # موجود لكن غير مفعّل افتراضياً
    └── pages/
        ├── auth.js
        ├── daily-prayers.js
        ├── qada-prayers.js
        ├── habits.js
        ├── daily-tasks.js
        ├── statistics.js
        ├── leaderboard.js
        ├── store.js
        ├── athkar.js
        ├── challenge.js
        ├── settings.js
        └── more.js
```

---

## 📘 شرح الوحدات (Modules)

### 1) Managers
- **`AuthManager` (`js/auth-manager.js`)**  
  مسؤول عن تسجيل الدخول/الخروج وإدارة الـ session والملف الشخصي.

- **`PrayerManager` (`js/prayer-manager.js`)**  
  يحسب المواقيت (Adhan.js)، ويدير الفحص الدوري للصلاة الفائتة (`checkAndMarkMissedPrayers`).

- **`NotificationManager` (`js/notification-manager.js`)**  
  يدير أذونات الإشعارات وجدولة التنبيه للصلاة القادمة.

- **`SyncManager` (`js/sync-manager.js`)**  
  يدير الاشتراك في تغييرات Supabase (Realtime) وتحديث الواجهة عند التغييرات.

### 2) Services
- **`PrayerService`**: CRUD للصلوات + قضاء + احتساب/إرجاع نقاط الصلاة.
- **`HabitService`**: إدارة العادات وسجلّها اليومي.
- **`PointsService`**: مجموع النقاط + سجل النقاط + الإضافة عبر `upsert`.
- **`SettingsService`**: إعدادات اللغة/الثيم/الحساب الشرعي/الموقع.
- **`TaskService`**: إدارة المهام اليومية (إنشاء/تعديل/إكمال/ترحيل/تنظيف).

### 3) UI/Pages
- ملفات `js/pages/*` تولّد HTML للصفحات وتربط أحداثها.
- `js/ui-helpers.js` يوفر تحديثات جزئية للواجهة (مثل تحديث بطاقة صلاة/عادة دون إعادة تحميل الصفحة بالكامل).

---

## 🗄 قاعدة البيانات (Database Schema)

التطبيق يعتمد على **Supabase (PostgreSQL)**. الجداول/العناصر الأساسية:

### 1) `profiles`
- `id` (UUID، مرتبط بـ `auth.users`)
- `username`, `full_name`
- `referral_code`, `referred_by`
- `is_public` (للظهور في لوحة الصدارة)

### 2) `prayer_records`
- `user_id`, `date`, `prayer_key`, `status`, `recorded_at`
- فهرس/قيد فريد على (user_id, date, prayer_key)

### 3) `qada_prayers`
- `id`, `user_id`, `original_date`, `prayer_key`, `rakaat`, `is_manual`, `recorded_at`

### 4) `points_history`
- `id`, `user_id`, `amount`, `reason`, `recorded_at`

### 5) `user_settings`
- `user_id`, `theme`, `language`, `calculation_method`, `madhab`, إعدادات إضافية مرتبطة بالموقع

### 6) `tasks`
- `id`, `user_id`, `title`, `priority`, `due_date`, `status`
- `completed_at`, `rollover_count`, `created_at`, `updated_at`
- تفاصيل الإنشاء والسياسات في `supabase_tasks.sql`

### 7) `leaderboard` (View)
- View تُستخدم لجلب `total_points` وترتيب المستخدمين.

---

## 🔗 الاتصالات والعلاقات (Connections & Relationships)

1. **Client → Supabase**  
   عبر `js/supabaseClient.js` (REST للعمليات + Realtime عبر channels).

2. **العلاقات**  
   أغلب الجداول مرتبطة بالمستخدم عبر `user_id`/`id`.

3. **RLS**  
   سياسات Row Level Security تقيّد وصول كل مستخدم إلى بياناته.

---

## 🔢 الثوابت الأساسية (Core Constants)

- **`PRAYERS`** في `js/services/prayer-service.js`  
  تعريف الصلوات (الاسم، الركعات، النقاط).

- **`RANKS`** في `js/points-manager.js`  
  تعريف مستويات النقاط.

- **الثيمات** في `styles.css`  
  تُفعل عبر `data-theme` على `<html>` (مثل: `light`, `dark`, `emerald`, `midnight`, ...).

---

## ⚙️ العمليات الرئيسية (Core Flows)

### 1) دورة الصلاة
1. `PrayerManager` يحسب المواقيت بناءً على الإعدادات والموقع.
2. المستخدم يحدد حالة الصلاة (`done` أو `missed`) من الواجهة.
3. `PrayerService.markPrayer`:
   - يحدّث `prayer_records`.
   - يضيف/يخصم النقاط عبر `PointsService`.
   - يضيف/يحذف سجل القضاء حسب الحالة.

### 2) دورة المهام اليومية
1. إنشاء/تعديل/حذف/إكمال المهمة عبر `TaskService`.
2. عند الإكمال تُضاف نقطة (بنمط idempotent id: `task:<taskId>`).
3. توجد عمليات صيانة تلقائية (ترحيل المهام المتأخرة، تنظيف المكتملة القديمة).

### 3) النقاط ولوحة الصدارة
- إجمالي النقاط يُقرأ من `leaderboard` مع fallback إلى جمع `points_history`.
- تحديث الواجهة يتم عبر event `pointsUpdated` واشتراكات Realtime.

---

## 🔍 مراجعة الكود (Code Review Snapshot)

هذه خلاصة مراجعة شاملة على كود الواجهة والمنطق التشغيلي (Managers/Services/Pages):

### نقاط القوة الحالية
- فصل منطقي جيد بين `Managers` و`Services` و`Pages`.
- تدفق واضح للعمليات الأساسية (الصلاة/العادات/المهام).
- وجود Realtime integration عبر `SyncManager`.
- وجود دوال حماية نصية في صفحة المهام (`escapeTaskText`) يمنع حقن HTML هناك.

### مخاطر/ديون تقنية معروفة (تحتاج معالجة)
1. **XSS محتمل في أجزاء متعددة**  
   بعض القيم القادمة من المستخدم/قاعدة البيانات تُحقن مباشرة داخل `innerHTML` أو template literals بدون تعقيم كافٍ.
2. **عدم توحيد مفتاح اللغة في LocalStorage**  
   يوجد استخدام مختلط بين `salatk_lang` و`salatk_language` مما قد يسبب سلوك حفظ/استرجاع غير متسق.
3. **إعادة تهيئة PrayerManager قد تنشئ أكثر من interval**  
   `PrayerManager.init()` يستدعي `startMissedPrayersCheck()` دون حراسة واضحة لمنع تكرار المؤقت.
4. **قائمة كاش Service Worker غير متزامنة بالكامل مع ملفات runtime**  
   بعض السكربتات المحملة في `index.html` غير موجودة في `ASSETS_TO_CACHE`.
5. **ملف الإعدادات الحساس (`js/config.js`) موجود داخل المستودع**  
   مع أن المفتاح `anon/publishable`، الأفضل تشغيلياً أن يُحقن عبر بيئة نشر وليس commit مباشر.

### سياسة المراجعة المستمرة
- أي ميزة جديدة تعتمد نصوصًا مُدخلة من المستخدم يجب أن تستخدم تعقيمًا مركزيًا قبل العرض.
- أي تغيير في `index.html` (script list) يجب أن ينعكس مباشرة في `sw.js`.
- توحيد مصدر الحقيقة للّغة/الثيم داخل طبقة `SettingsService`.

---
*تم التحديث بتاريخ: 2026-02-23*
