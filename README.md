# Salatk (صلاتك)

`Salatk` هو تطبيق ويب تقدمي (PWA) موجّه لمتابعة العبادة والحياة اليومية للمسلم. المشروع اليوم لم يعد مجرد متتبع صلوات؛ بل صار منصة فيها تتبع الصلوات والقضاء، العادات، المهام اليومية، تنظيم الوقت بحسب مواقيت الصلاة، تحديات تعليمية، أذكار، متجر سمات، نظام نقاط، لوحة صدارة، وإدارة للمستخدمين والإشعارات.

يعتمد المشروع على:

- واجهة أمامية ثابتة مبنية بـ `HTML + CSS + Vanilla JavaScript`
- `Supabase` للمصادقة، قاعدة البيانات، الـ Realtime، و Edge Functions
- `Service Worker` للتخزين المؤقت وتجربة الـ PWA
- اختبارات `Vitest` و `Playwright`

## ما الذي يقدمه المشروع حالياً

- تتبع الصلوات الخمس اليومية مع حساب المواقيت عبر `Adhan.js`
- حساب التاريخ الهجري وعرضه داخل الواجهة
- تسجيل الصلاة كـ `done` أو `missed` مع تأثير مباشر على النقاط
- إدارة الصلوات الفائتة `Qada` مع دعم تاريخ معلوم أو غير معلوم
- متتبع عادات من نوع:
  - عادات طاعة
  - عادات معصية مع احتساب أيام التجنب والسلاسل
- نظام مهام يومية مع أولوية، إكمال، إعادة فتح، وترحيل تلقائي للمهام المتأخرة
- صفحة تنظيم وقت يومي/أسبوعي مقسمة بحسب الفترات بين الصلوات
- ربط العناصر عبر "متغيرات" متزامنة مع السحابة بحيث يفعّل إنجاز عنصر عناصر أخرى مرتبطة به عبر الصلوات والعادات والمهام والخطط الزمنية
- صفحة إحصائيات تشمل:
  - مجموع النقاط
  - عدد الصلوات المؤداة والمفوّتة
  - إجمالي الركعات
  - مؤشرات العادات
  - نسبة الإنجاز الأسبوعية
- لوحة صدارة مبنية على View في قاعدة البيانات
- صفحة تحديات تعليمية متعددة المراحل مع حفظ آخر مرحلة مكتملة
- صفحة أذكار مع مكافآت نقاط تدريجية
- متجر سمات مع شراء السمات بالنقاط وتطبيقها فوراً
- إعدادات حساب شاملة:
  - تعديل الملف الشخصي
  - تغيير كلمة المرور
  - إدارة الخصوصية في لوحة الصدارة
  - تفعيل/إلغاء Web Push
  - اللغة
  - السمة
  - الموقع
  - طريقة حساب المواقيت
  - المذهب
  - تخصيص عناصر شريط التنقل
  - نظام الإحالة `Referral`
- لوحة إدارة للمشرف تتضمن:
  - استعراض المستخدمين
  - البحث والتصفية
  - تعديل الملفات الشخصية
  - الحظر وفك الحظر
  - حذف المستخدم
  - إرسال إشعار فردي أو جماعي
  - مراجعة سجلات التدقيق `Audit Logs`

## البنية التقنية الحالية

### الواجهة الأمامية

- نقطة الدخول الرئيسية هي `index.html`
- لا يوجد bundler أو build step للتطبيق نفسه؛ المشروع يُخدَّم كملفات ثابتة
- أغلب الكود يستخدم نمط `window` globals والسكربتات الكلاسيكية
- الاستثناء الأبرز هو `js/pages/challenge.js` الذي يُحمّل كـ ES module
- التنقل يتم عبر hash routing داخل `js/app.js`

### مصدر البيانات

- مصدر الحقيقة الأساسي الآن هو `Supabase`
- ملفات `js/db.js` و `js/data-manager.js` و `js/services/migration-service.js` موجودة أساساً للتوافق الخلفي
- `SyncManager` يعمل في نمط cloud-only ويستخدم Realtime لتحديث الواجهة

### التخزين المحلي

بعض البيانات ما زالت تحتفظ بنسخة محلية في `localStorage` كـ cache أو fallback للأداء:

- تخصيص شريط التنقل
- نسخ سريعة لبعض الإعدادات والجلسة لأداء أفضل
- نسخ محلية لكل مستخدم كـ fallback لروابط المتغيرات وحالة إنجاز بطاقات تنظيم الوقت

### الكاش والأداء

- `sw.js` يطبّق تخزيناً مؤقتاً لملفات الواجهة والـ PWA assets
- طلبات `Supabase` تُترك للشبكة مباشرة لتجنب بيانات قديمة
- `PageDataCache` يضيف caching داخل الواجهة لبعض الصفحات الثقيلة مثل:
  - `settings`
  - `statistics`
  - `leaderboard`
  - `habits`
  - `store`

## المصادقة وإدارة الصلاحيات

- واجهة الدخول والتسجيل تعتمد على `username + password`
- داخلياً، يحوّل المشروع اسم المستخدم إلى بريد شكلي من النمط `username@salatk.local`
- الملف الشخصي الحقيقي للمستخدم يُخزَّن في جدول `profiles`
- صلاحية الإدارة ليست عامة؛ يوجد تحقق مزدوج:
  - منطق واجهة في `AuthManager.isAdmin()`
  - تحقق قاعدة بيانات عبر RPC وسياسات `RLS`

مهم: هذا المشروع يحتوي حالياً على هوية مدير hard-coded في الكود والمايغريشنز. إذا كنت ستستخدمه في مشروع جديد أو fork، فعدّل إعدادات المدير في:

- `js/auth-manager.js`
- مايغريشنز الإدارة داخل `supabase/migrations/`

## الصفحات والمسارات

| المسار | الغرض |
| --- | --- |
| `#login` / `#signup` | تسجيل الدخول وإنشاء الحساب |
| `#daily-prayers` | صلوات اليوم |
| `#qada-prayers` | الصلاة الفائتة |
| `#habits` | متتبع العادات |
| `#daily-tasks` | المهام اليومية |
| `#time-management` | تنظيم الوقت اليومي/الأسبوعي |
| `#statistics` | الإحصائيات |
| `#leaderboard` | لوحة الصدارة |
| `#store` | متجر السمات |
| `#settings` | الإعدادات والحساب |
| `#athkar` | الأذكار |
| `#challenge` | التحديات التعليمية |
| `#more` | قائمة الصفحات الثانوية |
| `#admin` | لوحة الإدارة للمشرف |

## هيكل المشروع

```text
.
├── index.html
├── styles.css
├── sw.js
├── assets/
├── components/
├── js/
│   ├── app.js
│   ├── auth-manager.js
│   ├── prayer-manager.js
│   ├── notification-manager.js
│   ├── sync-manager.js
│   ├── variable-manager.js
│   ├── services/
│   │   ├── admin-service.js
│   │   ├── habit-service.js
│   │   ├── page-data-cache.js
│   │   ├── points-service.js
│   │   ├── prayer-service.js
│   │   ├── push-service.js
│   │   ├── settings-service.js
│   │   ├── task-service.js
│   │   ├── time-plan-service.js
│   │   └── variable-service.js
│   └── pages/
│       ├── admin.js
│       ├── athkar.js
│       ├── auth.js
│       ├── challenge.js
│       ├── daily-prayers.js
│       ├── daily-tasks.js
│       ├── habits.js
│       ├── leaderboard.js
│       ├── more.js
│       ├── qada-prayers.js
│       ├── settings.js
│       ├── statistics.js
│       ├── store.js
│       └── time-management.js
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   ├── migrations/
│   └── functions/
└── tests/
```

## قاعدة البيانات في Supabase

### الجداول الأساسية

- `profiles`
- `prayer_records`
- `qada_prayers`
- `habits`
- `habit_history`
- `points_history`
- `user_settings`
- `locations`
- `tasks`
- `owned_themes`
- `time_plans`
- `variable_links`

ملاحظة: جدول `time_plans` يتضمن أيضاً حقول حالة مثل `is_done` و`done_at` لبطاقات تنظيم الوقت، وجدول `variable_links` يخزن روابط المتغيرات لكل عنصر بشكل منفصل لكل مستخدم.

### جداول الإدارة والإشعارات

- `admin_users`
- `user_access_status`
- `user_push_subscriptions`
- `user_notifications`
- `admin_audit_logs`

### الـ Views والوظائف المهمة

- `leaderboard`
- `admin_user_directory`
- `is_current_user_admin`

المشروع يستخدم `RLS` بشكل واسع، مع سياسات تمنع المستخدمين المحظورين من الوصول إلى كثير من الجداول.

## Edge Functions

المشروع يحتوي حالياً على ثلاث وظائف في `supabase/functions/`:

- `admin-users`
  - إدارة المستخدمين
  - الحظر وفك الحظر
  - تعديل الملف الشخصي
  - حذف المستخدم
- `admin-notifications`
  - إرسال إشعار فردي أو جماعي
  - Web Push عند توفر مفاتيح VAPID
  - fallback إلى `user_notifications` عند غياب الاشتراك أو إعدادات الـ Push
- `push-subscriptions`
  - حفظ وإلغاء اشتراكات Web Push للمستخدمين

مهم: في `supabase/config.toml` قيمة `verify_jwt = false` لهذه الوظائف، لكن التحقق من هوية المستخدم يتم يدوياً داخل `supabase/functions/_shared/auth.ts`. إذا غيّرت هذا التصميم، تأكد أن الإعدادات والكود ما زالا متوافقين.

## الإعداد المحلي

### المتطلبات

- `Node.js` و `npm`
- `Supabase CLI` إذا كنت تريد تشغيل قاعدة البيانات والوظائف محلياً

### 1. تثبيت الحزم

```bash
npm install
```

### 2. إعداد الواجهة الأمامية

الواجهة تقرأ إعداداتها من `js/config.js`. إذا كنت ستعمل على مشروع Supabase مختلف، حدّث القيم التالية:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `WEB_PUSH_VAPID_PUBLIC_KEY`

يمكنك أيضاً استخدام `js/config.example.js` كمرجع، أو حقن override عبر `window.__SALATK_CONFIG__` قبل تحميل `js/config.js` في بيئات الاختبار.

### 3. تشغيل الواجهة محلياً

```bash
npx http-server . -p 4173 -c-1
```

ثم افتح:

```text
http://127.0.0.1:4173
```

### 4. تشغيل Supabase محلياً

```bash
npm run supabase:start
npm run supabase:reset
```

بعدها استخرج متغيرات الاتصال:

```bash
npx supabase status -o env
```

واستخدم القيم الناتجة لتحديث `js/config.js` عند الحاجة.

ملاحظة: `supabase/config.toml` مضبوط بالفعل على:

- `site_url = http://127.0.0.1:4173`
- redirect URLs محلية للمنفذ `4173`

## متغيرات البيئة المهمة

### للواجهة الأمامية

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `WEB_PUSH_VAPID_PUBLIC_KEY`

### لـ Edge Functions

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEB_PUSH_VAPID_PUBLIC_KEY`
- `WEB_PUSH_VAPID_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT`

إذا لم تُضبط مفاتيح VAPID، ستبقى إشعارات الإدارة قادرة على الوصول للمستخدمين عبر سجل `user_notifications` كبديل داخل التطبيق، لكن Web Push الفعلي لن يعمل.

## الاختبارات

### أوامر الاختبار

```bash
npm run test:unit
npm run test:dom
npm run test:sw
npm run test:integration
npm run test:integration:local
npm run test:e2e
npm run coverage
npm test
```

### ماذا تغطي؟

- `test:unit`
  - منطق الخدمات والموديولات المنفصلة
- `test:dom`
  - سلامة تحميل الملفات وتفاعل الصفحات مع الـ DOM
- `test:sw`
  - سلوك الـ Service Worker
- `test:integration`
  - تكامل حقيقي مع `Supabase` عند توفر `SUPABASE_URL` و `SUPABASE_ANON_KEY`
- `test:integration:local`
  - يشغّل `Supabase` محلياً، يعيد ضبط القاعدة، ثم ينفذ اختبارات التكامل
- `test:e2e`
  - سيناريوهات متصفح كاملة عبر `Playwright`

مهم: `npm test` يشغّل unit + dom + sw + integration. اختبارات التكامل تُتخطى تلقائياً إذا لم تكن متغيرات البيئة الخاصة بـ Supabase متوفرة.

## ملاحظات مهمة للمطورين

- التطبيق اليوم cloud-first، وليس local-first.
- `js/db.js` stub فقط، وليس قاعدة بيانات محلية فعلية.
- حالة إنجاز بطاقات `time-management` متزامنة مع `Supabase` مع fallback محلي لكل مستخدم.
- نظام "المتغيرات" الذي يربط الصلوات والعادات والمهام والخطط الزمنية متزامن مع `Supabase` مع fallback محلي لكل مستخدم.
- إعدادات الموقع الافتراضية تعود إلى `Jerusalem` إن لم يكن لدى المستخدم موقع محفوظ.
- `Service Worker` يخبّئ الملفات الثابتة، لذلك عند تعديل الملفات الأمامية قد تحتاج إلى تحديث الـ cache version أو مسح الكاش أثناء التطوير.
- بعض ملفات التوافق الخلفي ما زالت موجودة لتفادي كسر الكود القديم، لذلك ليست كل الملفات تعبّر عن المسار المعماري الحالي بنفس الدرجة.

## ملخص سريع للبنية الحالية

- الواجهة: تطبيق ثابت بدون build step
- البيانات: `Supabase Postgres`
- المصادقة: `Supabase Auth` مع username-to-email mapping
- التزامن: `Supabase Realtime`
- الإشعارات: local notifications + Web Push + in-app fallback
- الأداء: `Service Worker` + `PageDataCache`
- الاختبارات: `Vitest` + `Playwright`

آخر تحديث لهذا الملف: `2026-03-24`
