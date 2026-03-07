# Salatk (صلاتك) 🕌

**Salatk** هو أسلوب لحياة المسلم، وهو تطبيق ويب تقدمي (PWA) يوفر أدوات متكاملة مثل:

- متابعة الصلوات اليومية وقضاء الفائت منها.
- إدارة الوقت عبر خطط يومية وأسبوعية متزامنة مع مواقيت الصلاة.
- تتبع العادات والمهام اليومية.
- نظام إشعارات Push وتنبيهات برمجية.
- التحفيز عبر نظام نقاط متطور ولوحة صدارة عالمية.

يعتمد التطبيق على **Supabase** مع مزامنة لحظية، وبنية Frontend تعتمد على JavaScript modules بنمط `window` globals لتسهيل التواصل بين الوحدات.

---

## 📑 الفهرس

1. [خارطة الملفات (File Map)](#-خارطة-الملفات-file-map)
2. [شرح الوحدات (Modules)](#-شرح-الوحدات-modules)
3. [قاعدة البيانات (Database Schema)](#-قاعدة-البيانات-database-schema)
4. [الاتصالات والعلاقات (Connections & Relationships)](#-الاتصالات-والعلاقات-connections--relationships)
5. [الثوابت الأساسية (Core Constants)](#-الثوابت-الأساسية-core-constants)
6. [العمليات الرئيسية (Core Flows)](#-العمليات-الرئيسية-core-flows)
7. [مراجعة الكود (Code Review Snapshot)](#-مراجعة-الكود-code-review-snapshot)
8. [الاختبارات (Testing & QA)](#-testing--qa)

---

## 📂 خارطة الملفات (File Map)

```text
/home/loid/code/salatk/
├── index.html                  # نقطة الدخول وترتيب تحميل السكربتات
├── styles.css                  # التنسيقات العامة والسمات (Themes)
├── sw.js                       # Service Worker لإدارة الـ Offline والـ Push
├── sitemap.xml / robots.txt    # ملفات تحسين محركات البحث (SEO)
├── components/                 # مكونات واجهة قابلة لإعادة الاستخدام
│   ├── toast.js                # نظام التنبيهات المنبثقة
│   ├── modal.js                # إدارة النوافذ المنبثقة
│   ├── prayer-card.js / habit-card.js
│   └── points-display.js       # عرض النقاط في الهيدر
└── js/
    ├── app.js                  # الـ Router + إدارة التنقل (Navigation)
    ├── auth-manager.js         # إدارة الجلسة والتحقق من الهوية
    ├── prayer-manager.js       # حساب المواقيت (Adhan.js) والتحقق من الفوات
    ├── notification-manager.js # إدارة التنبيهات المحلية والـ Schedule
    ├── sync-manager.js         # المزامنة اللحظية (Realtime)
    ├── ui-helpers.js           # دوال مساعدة لتحديث الـ DOM وتعقيم النصوص
    ├── services/
    │   ├── admin-service.js    # عمليات الإدارة (حظر، إشعارات، سجلات)
    │   ├── push-service.js     # إدارة اشتراكات Web Push
    │   ├── time-plan-service.js # إدارة الخطط الزمنية
    │   ├── page-data-cache.js  # نظام الذاكرة المخبئية للصفحات الثقيلة
    │   └── task-service.js / point-service.js ...
    └── pages/
        ├── admin.js            # لوحة تحكم المدير
        ├── time-management.js # إدارة الوقت (يومي/أسبوعي)
        ├── daily-prayers.js / qada-prayers.js
        ├── habits.js / daily-tasks.js
        ├── leaderboard.js / statistics.js
        └── settings.js         # الإعدادات الشاملة (لغة، سمة، حساب شرعي)
```

---

## 📘 شرح الوحدات (Modules)

### 1) الإدارة والأمان (Admin & Security)

- **`AdminService`**: يوفر واجهة لإدارة المستخدمين، حظر الحسابات، إرسال إشعارات جماعية، والاطلاع على سجلات التدقيق (Audit Logs).
- **`PushService`**: يدير تسجيل الـ Service Worker Subscription وتخزينها في Supabase لإرسال تنبيهات Push حقيقية.

### 2) إدارة الوقت والأداء (Performance & Time)

- **`TimePlanService`**: يتيح للمستخدم تنظيم يومه بناءً على مواقيت الصلاة، مع إمكانية تحويل الخطط الأسبوعية إلى يومية بضغطة زر.
- **`PageDataCache`**: يقلل من زمن التحميل عبر تخزين نسخة من HTML الصفحات الثقيلة (مثل الإحصائيات) وتحديثها فقط عند تغيير البيانات الحساسة (مثل النقاط).

### 3) تجربة المستخدم (UX Customization)

- **إدارة التنقل**: يمكن للمستخدم تخصيص ترتيب أيقونات التنقل السفلية وإخفاء/إظهار الصفحات حسب رغبته.

---

## 🗄 قاعدة البيانات (Database Schema)

### 1) جداول الأمان والإدارة

- **`admin_users`**: قائمة المعرفات التي تملك صلاحية الوصول للوحة الإدارة.
- **`user_access_status`**: تتبع حالة الحظر (is_blocked) وأسبابها.
- **`admin_audit_logs`**: سجل بكل العمليات الحساسة التي قام بها المديرون.

### 2) جداول الميزات الجديدة

- **`time_plans`**: تخزن الخطط اليومية (مرتبطة بتاريخ) والأسبوعية (مرتبطة بيوم أسبوع).
- **`user_push_subscriptions`**: مفاتيح التشفير لاتصالات الـ Push.
- **`user_notifications`**: سجل الإشعارات الواردة للمستخدم لعرضها في مركز التنبيهات.

---

## 🔢 الثوابت الأساسية (Core Constants)

- **`VALID_PAGES`** في `js/app.js`: تحدد المسارات المسموح بها في الـ Router.
- **`PAGE_CACHE_TTLS_MS`** في `js/services/page-data-cache.js`: مدد صلاحية الذاكرة المخبئية لكل صفحة.
- **`NAV_PREFS_KEY`**: مفتاح تخزين تفضيلات ترتيب القائمة في LocalStorage.

---

## ⚙️ العمليات الرئيسية (Core Flows)

### 1) دورة الإدارة والرقابة

1. يتم التحقق من صلاحية `isAdmin` عند محاولة دخول صفحة `/admin`.
2. يتم منع المستخدمين المحظورين (`user_access_status`) من دخول التطبيق فوراً عبر `AuthManager`.

### 2) دورة الخطط الزمنية

1. يتم جلب مواقيت الصلاة لليوم المختار كمرجع.
2. يتم عرض المهام/الخطط بين فترات الصلاة (مثلاً: بين الفجر والضحى).

---

## 🔍 مراجعة الكود (Code Review Snapshot)

### ✅ تحسينات تمت معالجتها

- **تعقيم النصوص (XSS Protection)**: تمت إضافة دوال `escapeHtml` و `escapeTaskText` في معظم الصفحات التي تعرض مدخلات المستخدم.
- **تقليل طلبات الشبكة**: استخدام `PageDataCache` قلل من تكرار استدعاءات API في الصفحات الإحصائية.
- **تحسين SEO**: إضافة Sitemap و Meta Tags ديناميكية في `index.html`.

### ⚠️ نقاط تحتاج انتباه

- **اتساق الذاكرة المخبئية**: التأكد من أن `invalidatePage` تُستدعى في كل مكان يتم فيه تحديث البيانات المرتبطة بتلك الصفحة.
- **Service Worker Versioning**: الحاجة لتحديث الـ cache version عند كل تعديل في ملفات الـ `js`.

---

## 🧪 Testing & QA

- `npm run test:unit`: اختبارات المنطق البرمجي للخدمات.
- `npm run test:dom`: اختبارات تفاعل الصفحة مع مكونات الـ DOM.
- `npm run test:e2e`: اختبارات سيناريوهات المستخدم الكاملة (Playwright).
- `npm run coverage`: قياس تغطية الاختبارات لملفات الخدمات.

---

_آخر تحديث: 2026-03-06_
