const challenges_ar = [
    {
        id: 1,
        title: "المرحلة الأولى: أساسيات الصلاة",
        questions: [
            { type: 'multiple_choice', text: "كم عدد ركعات صلاة الفجر؟", options: ["ركعتان", "4 ركعات", "3 ركعات", "ركعة واحدة"], correctIndex: 0 },
            { type: 'true_false', text: "صلاة العيد لها أذان وإقامة مثل الصلوات الخمس", options: ["صح", "خطأ"], correctIndex: 1 },
            { type: 'multiple_choice', text: "ما هي القبلة التي يتوجه إليها المسلمون في الصلاة؟", options: ["المسجد الأقصى", "المسجد النبوي", "الكعبة المشرفة", "جبل أحد"], correctIndex: 2 },
            { type: 'fill_blank', text: "الصلاة هي الركن ____ من أركان الإسلام", options: ["الأول", "الثاني", "الثالث", "الرابع"], correctIndex: 1 },
            { type: 'multiple_choice', text: "أي صلاة من الصلوات الخمس لا تقصر في السفر؟", options: ["الفجر", "الظهر", "المغرب", "العشاء"], correctIndex: 2 },
            { type: 'true_false', text: "تجوز الصلاة بالتيمم إذا كان الماء باردًا جدًا ولا يوجد ما يسخنه ويخاف الضرر", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "ماذا يقول المصلي في السجود؟", options: ["سبحان ربي العظيم", "سبحان ربي الأعلى", "سمع الله لمن حمده", "التحيات لله"], correctIndex: 1 },
            { type: 'fill_blank', text: "عدد الصلوات المفروضة في اليوم والليلة ____ صلوات", options: ["ثلاث", "أربع", "خمس", "ست"], correctIndex: 2 },
            { type: 'true_false', text: "النية شرط لصحة الصلاة", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "أول ما يحاسب عليه العبد يوم القيامة من عمله هو:", options: ["الزكاة", "الصيام", "الصلاة", "الحج"], correctIndex: 2 }
        ]
    },
    {
        id: 2,
        title: "المرحلة الثانية: الوضوء والطهارة",
        questions: [
            { type: 'multiple_choice', text: "أي من التالي لا يعتبر من نواقض الوضوء؟", options: ["النوم العميق", "أكل لحم الإبل", "قص الأظافر", "خروج الريح"], correctIndex: 2 },
            { type: 'fill_blank', text: "عدد فرائض الوضوء ____ فرائض", options: ["أربعة", "خمسة", "ستة", "سبعة"], correctIndex: 2 },
            { type: 'true_false', text: "الماء المستعمل هو الماء الذي تساقط من الأعضاء أثناء الوضوء", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "ما حكم المسح على الخفين للمقيم؟", options: ["يوم وليلة", "ثلاثة أيام بلياليها", "صلاة واحدة", "أسبوع كامل"], correctIndex: 0 },
            { type: 'true_false', text: "يجب غسل الرجلين إلى الكعبين في الوضوء", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "إذا لم يجد المسلم الماء للوضوء فإنه ____", options: ["يصلي طالباً", "يؤخر الصلاة", "يتيمم", "يسقط الصلاة"], correctIndex: 2 },
            { type: 'multiple_choice', text: "أي مما يلي يوجب الغسل؟", options: ["النوم", "خروج الريح", "الجنابة", "الرعاف"], correctIndex: 2 },
            { type: 'true_false', text: "لمس النجاسة لا ينقض الوضوء ولكن يجب غسل موضع النجاسة", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "الترتيب بين أعضاء الوضوء حكمه:", options: ["سنة", "فرض", "مستحب", "مباح"], correctIndex: 1 },
            { type: 'fill_blank', text: "من سنن الوضوء ____", options: ["غسل الوجه", "مسح الرأس", "السواك", "غسل الرجلين"], correctIndex: 2 }
        ]
    },
    {
        id: 3,
        title: "المرحلة الثالثة: سنن الصلاة",
        questions: [
            { type: 'true_false', text: "دعاء الاستفتاح في الصلاة ركن من أركان الصلاة", options: ["صح", "خطأ"], correctIndex: 1 },
            { type: 'multiple_choice', text: "متى يقرأ التشهد الأول في الصلاة الرباعية؟", options: ["بعد الركعة الأولى", "بعد الركعة الثانية", "بعد الركعة الثالثة", "بعد الركعة الرابعة"], correctIndex: 1 },
            { type: 'fill_blank', text: "حكم رفع اليدين عند تكبيرة الإحرام هو ____", options: ["سنة", "واجب", "ركن", "مكروه"], correctIndex: 0 },
            { type: 'multiple_choice', text: "وضع اليد اليمنى على اليسرى في الصلاة يكون:", options: ["فوق السرة", "على الصدر", "تحت السرة", "كل ما سبق وارد"], correctIndex: 3 },
            { type: 'true_false', text: "قراءة سورة بعد الفاتحة في الركعتين الأوليين سنة", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "أي من هذه الأفعال يعتبر من سنن الصلاة؟", options: ["قراءة الفاتحة", "الركوع", "النظر إلى موضع السجود", "التسليم"], correctIndex: 2 },
            { type: 'fill_blank', text: "يقول المصلي عند الرفع من الركوع: سمع الله ____", options: ["أكبر", "لمن حمده", "العظيم", "الأعلى"], correctIndex: 1 },
            { type: 'true_false', text: "جلسة الاستراحة تكون بعد السجدة الثانية من الركعة الأولى والثالثة", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "حكم التأمين (قول آمين) بعد الفاتحة:", options: ["واجب", "سنة", "ركن", "مكروه"], correctIndex: 1 },
            { type: 'fill_blank', text: "الافتراش يكون في الجلوس بين السجدتين وفي ____", options: ["التشهد الأول", "التشهد الأخير", "القيام", "الركوع"], correctIndex: 0 }
        ]
    },
    {
        id: 4,
        title: "المرحلة الرابعة: أوقات الصلاة",
        questions: [
            { type: 'multiple_choice', text: "متى يبدأ وقت صلاة الظهر؟", options: ["من طلوع الشمس", "من زوال الشمس", "عند اصفرار الشمس", "عند غروب الشمس"], correctIndex: 1 },
            { type: 'true_false', text: "وقت صلاة الضحى يبدأ من طلوع الفجر", options: ["صح", "خطأ"], correctIndex: 1 },
            { type: 'fill_blank', text: "يمتد وقت صلاة العشاء إلى ____ الليل", options: ["ثلث", "نصف", "ربع", "سدس"], correctIndex: 1 },
            { type: 'multiple_choice', text: "متى ينتهي وقت صلاة الفجر؟", options: ["بطلوع الشمس", "بزوال الشمس", "بغروب الشمس", "بمنتصف النهار"], correctIndex: 0 },
            { type: 'true_false', text: "يكره الصلاة عند استواء الشمس في كبد السماء", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "ما هي الصلاة الوسطى المذكورة في القرآن؟", options: ["الفجر", "الظهر", "العصر", "العشاء"], correctIndex: 2 },
            { type: 'fill_blank', text: "يدرك المصلي الصلاة إذا أدرك ____ قبل خروج الوقت", options: ["التشهد", "السجود", "ركعة", "التكبير"], correctIndex: 2 },
            { type: 'true_false', text: "يجوز تأخير الصلاة عن وقتها بدون عذر", options: ["صح", "خطأ"], correctIndex: 1 },
            { type: 'multiple_choice', text: "وقت الضرورة لصلاة العصر يمتد حتى:", options: ["اصفرار الشمس", "غروب الشمس", "وقت العشاء", "منتصف الليل"], correctIndex: 1 },
            { type: 'fill_blank', text: "أفضل الأعمال الصلاة على ____", options: ["وقتها", "سجادتها", "الكرسي", "السرير"], correctIndex: 0 }
        ]
    },
    {
        id: 5,
        title: "المرحلة الخامسة: أحكام السهو",
        questions: [
            { type: 'multiple_choice', text: "متى يكون سجود السهو قبل السلام؟", options: ["إذا كان عن نقص", "إذا كان عن زيادة", "في الحالتين", "لا يوجد سجود سهو قبل السلام"], correctIndex: 0 },
            { type: 'true_false', text: "إذا شك المصلي في عدد الركعات يبني على الأكثر", options: ["صح", "خطأ"], correctIndex: 1 },
            { type: 'fill_blank', text: "سجود السهو لترك سنة من السنن غير المؤكدة (مثل قراءة سورة بعد الفاتحة) هو____", options: ["واجب", "مستحب", "لا يشرع", "مكروه"], correctIndex: 2 },
            { type: 'multiple_choice', text: "إذا سلم المصلي قبل إتمام صلاته ناسيًا، ماذا يفعل؟", options: ["يعيد الصلاة كاملة", "يكمل ما فاته ويسجد للسهو", "يستغفر فقط", "لا شيء عليه"], correctIndex: 1 },
            { type: 'true_false', text: "سجود السهو سجدتان مثل سجود الصلاة", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "إذا زاد المصلي ركعة ناسيًا، فمتى يسجد للسهو؟", options: ["قبل السلام", "بعد السلام", "أثناء التشهد", "لا يسجد"], correctIndex: 1 },
            { type: 'fill_blank', text: "من نسي التشهد الأول وقام للثالثة واستتم قائماً فإنه ____", options: ["يرجع ويجلس", "يكمل صلاته ولا يرجع", "يقطع صلاته", "يجلس فوراً"], correctIndex: 1 },
            { type: 'true_false', text: "تعمد زيادة ركن فعلي في الصلاة يبطلها", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'multiple_choice', text: "محل سجود السهو:", options: ["كله قبل السلام", "كله بعد السلام", "فيه تفصيل", "لا يسجد"], correctIndex: 2 },
            { type: 'fill_blank', text: "السهو في الصلاة هو ____ في شيء منها", options: ["الشك", "الترك", "الغفلة", "النسيان"], correctIndex: 3 }
        ]
    },
    {
        id: 6,
        title: "المرحلة السادسة: الصيام",
        questions: [
            { type: 'multiple_choice', text: "في أي شهر يجب على المسلمين صيام الفريضة؟", options: ["شعبان", "رمضان", "شوال", "ذو الحجة"], correctIndex: 1 },
            { type: 'true_false', text: "يبدأ وقت الصيام من طلوع الشمس إلى غروبها", options: ["صح", "خطأ (من الفجر)"], correctIndex: 1 },
            { type: 'fill_blank', text: "الصيام هو الركن ____ من أركان الإسلام", options: ["الأول", "الثاني", "الثالث", "الرابع"], correctIndex: 3 },
            { type: 'multiple_choice', text: "ما اسم الوجبة التي يتناولها الصائم قبل الفجر؟", options: ["الإفطار", "العشاء", "السحور", "الغداء"], correctIndex: 2 },
            { type: 'true_false', text: "النيّة في صيام الفريضة شرط ويجب أن تكون قبل الفجر", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "يفطر الصائم عند سماع أذان صلاة ____", options: ["العصر", "المغرب", "العشاء", "الفجر"], correctIndex: 1 },
            { type: 'multiple_choice', text: "أي ليلة في رمضان هي خير من ألف شهر؟", options: ["ليلة الجمعة", "ليلة النصف من رمضان", "ليلة القدر", "ليلة العيد"], correctIndex: 2 },
            { type: 'true_false', text: "الأكل أو الشرب ناسيًا يبطل الصيام ويجب إعادته", options: ["صح", "خطأ (يتم صومه)"], correctIndex: 1 },
            { type: 'multiple_choice', text: "ما هي الزكاة التي تخرج قبل صلاة عيد الفطر؟", options: ["زكاة المال", "زكاة الفطر", "زكاة الذهب", "الصدقة الجارية"], correctIndex: 1 },
            { type: 'fill_blank', text: "الصيام يعلمنا الصبر والشعور بحال ____", options: ["الأغنياء", "الفقراء", "المسافرين", "المرضى"], correctIndex: 1 }
        ]
    },
    {
        id: 7,
        title: "المرحلة السابعة: الزكاة والصدقة",
        questions: [
            { type: 'multiple_choice', text: "الزكاة هي الركن ____ من أركان الإسلام", options: ["الأول", "الثاني", "الثالث", "الخامس"], correctIndex: 2 },
            { type: 'true_false', text: "تجب الزكاة على كل مسلم مهما كان مقدار ماله", options: ["صح", "خطأ (فقط من ملك النصاب)"], correctIndex: 1 },
            { type: 'fill_blank', text: "المقدار المحدد من المال الذي إذا ملكه المسلم وجبت فيه الزكاة يسمى ____", options: ["الدين", "النصاب", "الخراج", "الجزية"], correctIndex: 1 },
            { type: 'multiple_choice', text: "إلى من تصرف الزكاة؟", options: ["الأغنياء", "الفقراء والمساكين", "بناء المساجد فقط", "للسفر والسياحة"], correctIndex: 1 },
            { type: 'true_false', text: "صدقة التطوع غير واجبة ويمكن إخراجها في أي وقت", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "نسبة زكاة المال (الذهب والفضة والعملات) هي ____ بالمئة", options: ["1%", "2.5%", "5%", "10%"], correctIndex: 1 },
            { type: 'multiple_choice', text: "من هو الخليفة الذي قاتل الممتنعين عن أداء الزكاة؟", options: ["عمر بن الخطاب", "علي بن أبي طالب", "أبو بكر الصديق", "عثمان بن عفان"], correctIndex: 2 },
            { type: 'true_false', text: "الزكاة تطهر النفس والمال وتزيد البركة", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "الصدقة ____ هي التي يستمر أجرها بعد وفاة الإنسان", options: ["المؤقتة", "الجارية", "السرية", "العامة"], correctIndex: 1 },
            { type: 'multiple_choice', text: "من أفضل أنواع الصدقات كما ذكر النبي صلى الله عليه وسلم:", options: ["بناء بيت", "سقي الماء", "شراء ملابس", "السفر"], correctIndex: 1 }
        ]
    },
    {
        id: 8,
        title: "المرحلة الثامنة: الحج والعمرة",
        questions: [
            { type: 'multiple_choice', text: "يجب الحج على المسلم مرة واحدة في العمر بشرط:", options: ["الشباب", "الغنى الفاحش", "الاستطاعة", "أن يكون إماماً"], correctIndex: 2 },
            { type: 'true_false', text: "يمكن أداء فريضة الحج في أي شهر من شهور السنة", options: ["صح", "خطأ (فقط في ذي الحجة)"], correctIndex: 1 },
            { type: 'fill_blank', text: "الدخول في نية الحج أو العمرة مع لبس ملابس معينة يسمى ____", options: ["التحلل", "الإحرام", "التلبية", "الاستلام"], correctIndex: 1 },
            { type: 'multiple_choice', text: "المشي بين الصفا والمروة سبعة أشواط يسمى:", options: ["الطواف", "السعي", "الرمي", "المبيت"], correctIndex: 1 },
            { type: 'true_false', text: "الوقوف بعرفة هو أعظم أركان الحج", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "الدوران حول الكعبة سبعة أشواط يسمى ____", options: ["السعي", "الطواف", "الهرولة", "الوقوف"], correctIndex: 1 },
            { type: 'multiple_choice', text: "أين يرمي الحجاج الجمرات؟", options: ["في مكة", "في منى", "في عرفات", "في المدينة"], correctIndex: 1 },
            { type: 'true_false', text: "يجوز أداء العمرة أكثر من مرة في السنة الواحدة", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "يقع الحجر الأسود في الركن ____ من الكعبة المشرفة", options: ["الشمالي", "اليماني", "الشرقي", "الغربي"], correctIndex: 2 },
            { type: 'multiple_choice', text: "في أي شهر هجري يكون موسم الحج؟", options: ["رمضان", "رجب", "ذو الحجة", "محرم"], correctIndex: 2 }
        ]
    },
    {
        id: 9,
        title: "المرحلة التاسعة: السيرة النبوية",
        questions: [
            { type: 'multiple_choice', text: "أين ولد النبي محمد صلى الله عليه وسلم؟", options: ["المدينة المنورة", "مكة المكرمة", "الطائف", "القدس"], correctIndex: 1 },
            { type: 'true_false', text: "توفي والد النبي صلى الله عليه وسلم قبل ولادته", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "لقب النبي صلى الله عليه وسلم قبل البعثة بـ ____", options: ["الفاروق", "الصديق", "الصادق الأمين", "ذو النورين"], correctIndex: 2 },
            { type: 'multiple_choice', text: "كم كان عمر النبي صلى الله عليه وسلم عندما نزل عليه الوحي لأول مرة؟", options: ["25 سنة", "40 سنة", "33 سنة", "63 سنة"], correctIndex: 1 },
            { type: 'true_false', text: "أول من آمن بالنبي صلى الله عليه وسلم من الرجال هو أبو بكر الصديق", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "تسمى هجرة النبي صلى الله عليه وسلم وأصحابه من مكة إلى المدينة بـ ____", options: ["الرحلة", "الهجرة", "البيعة", "الفتح"], correctIndex: 1 },
            { type: 'multiple_choice', text: "ما هي أول غزوة في الإسلام؟", options: ["غزوة أحد", "غزوة الخندق", "غزوة بدر", "غزوة خيبر"], correctIndex: 2 },
            { type: 'true_false', text: "حج النبي صلى الله عليه وسلم حجة واحدة تسمى حجة الوداع", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "الغار الذي نزل فيه الوحي لأول مرة هو غار ____", options: ["ثور", "حراء", "الرحمة", "الكهف"], correctIndex: 1 },
            { type: 'multiple_choice', text: "من كان رفيق النبي صلى الله عليه وسلم في رحلة الهجرة؟", options: ["عمر بن الخطاب", "علي بن أبي طالب", "أبو بكر الصديق", "عثمان بن عفان"], correctIndex: 2 }
        ]
    },
    {
        id: 10,
        title: "المرحلة العاشرة: الأخلاق والآداب الإسلامية",
        questions: [
            { type: 'multiple_choice', text: "قال النبي صلى الله عليه وسلم: إنما بعثت لأتمم ____", options: ["مكارم الأخلاق", "العبادات", "المعاملات", "الفتوحات"], correctIndex: 0 },
            { type: 'true_false', text: "الغيبة (ذكر الآخرين بما يكرهون) جائزة إذا كان الشخص سيئاً فعلاً", options: ["صح", "خطأ (محرمة)"], correctIndex: 1 },
            { type: 'fill_blank', text: "تبسمك في وجه أخيك ____", options: ["واجب", "صدقة", "مباح", "مكروه"], correctIndex: 1 },
            { type: 'multiple_choice', text: "ماذا يجب أن يقول المسلم عندما يقابل أخاه المسلم؟", options: ["صباح الخير", "السلام عليكم", "كيف حالك", "أهلاً بك"], correctIndex: 1 },
            { type: 'true_false', text: "الصدق يهدي إلى البر، والبر يهدي إلى الجنة", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لـ ____", options: ["أهله", "نفسه", "أصدقائه", "جيرانه"], correctIndex: 1 },
            { type: 'multiple_choice', text: "بر الوالدين في الإسلام يعتبر:", options: ["مستحباً", "مباحاً", "واجباً ومن أعظم القربات", "اختيارياً"], correctIndex: 2 },
            { type: 'true_false', text: "إفشاء الأسرار وعدم حفظ الأمانة من علامات المنافق", options: ["صح", "خطأ"], correctIndex: 0 },
            { type: 'fill_blank', text: "ما زال جبريل يوصيني بالـ ____ حتى ظننت أنه سيورثه", options: ["الصديق", "الجار", "الأخ", "اليتيم"], correctIndex: 1 },
            { type: 'multiple_choice', text: "أي من هذه الخصال يعتبر من آيات المنافق كما ذكر النبي صلى الله عليه وسلم؟", options: ["إذا حدث كذب", "إذا صلى أسرع", "إذا تصدق جهراً", "إذا مشى تكبر"], correctIndex: 0 }
        ]
    }
];

const challenges_en = [
    {
        id: 1,
        title: "Stage 1: Prayer Basics",
        questions: [
            { type: 'multiple_choice', text: "How many Rakaat in Fajr prayer?", options: ["2 Rakaat", "4 Rakaat", "3 Rakaat", "1 Rakah"], correctIndex: 0 },
            { type: 'true_false', text: "Eid prayer has Adhan and Iqamah like daily prayers", options: ["True", "False"], correctIndex: 1 },
            { type: 'multiple_choice', text: "What is the Qibla direction Muslims face in prayer?", options: ["Al-Aqsa Mosque", "Prophet's Mosque", "The Kaaba", "Mount Uhud"], correctIndex: 2 },
            { type: 'fill_blank', text: "Prayer is the ____ pillar of Islam", options: ["First", "Second", "Third", "Fourth"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Which of the 5 prayers is NOT shortened during travel?", options: ["Fajr", "Dhuhr", "Maghrib", "Isha"], correctIndex: 2 },
            { type: 'true_false', text: "Tayammum is allowed if water is cold and cannot be heated, fearing harm", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "What does one say in Sujood?", options: ["Subhana Rabbiyal Adheem", "Subhana Rabbiyal A'la", "Sami Allahu Liman Hamidah", "At-Tahiyyatu Lillah"], correctIndex: 1 },
            { type: 'fill_blank', text: "Number of obligatory prayers in a day and night is ____", options: ["Three", "Four", "Five", "Six"], correctIndex: 2 },
            { type: 'true_false', text: "Intention (Niyyah) is a condition for prayer validity", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "The first thing a servant is held accountable for on Day of Judgment is:", options: ["Zakat", "Fasting", "Prayer", "Hajj"], correctIndex: 2 }
        ]
    },
    {
        id: 2,
        title: "Stage 2: Wudhu and Purity",
        questions: [
            { type: 'multiple_choice', text: "Which of these does NOT invalidate Wudhu?", options: ["Deep Sleep", "Eating Camel Meat", "Cutting Nails", "Passing Wind"], correctIndex: 2 },
            { type: 'fill_blank', text: "Number of obligatory acts (Faraid) of Wudhu is ____", options: ["Four", "Five", "Six", "Seven"], correctIndex: 2 },
            { type: 'true_false', text: "Used water is water that dripped from limbs during Wudhu", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "Duration of wiping over socks for a resident?", options: ["Day and Night", "Three Days", "One Prayer", "One Week"], correctIndex: 0 },
            { type: 'true_false', text: "Feet must be washed up to the ankles in Wudhu", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "If water is not found, a Muslim performs ____", options: ["Pray seeking", "Delay prayer", "Tayammum", "Drop prayer"], correctIndex: 2 },
            { type: 'multiple_choice', text: "Which of these requires Ghusl?", options: ["Sleep", "Wind", "Janabah", "Nosebleed"], correctIndex: 2 },
            { type: 'true_false', text: "Touching impurity doesn't invalidate Wudhu, but the spot must be washed", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "Order between Wudhu limbs is:", options: ["Sunnah", "Fard", "Mustahabb", "Permissible"], correctIndex: 1 },
            { type: 'fill_blank', text: "A Sunnah of Wudhu is ____", options: ["Washing Face", "Wiping Head", "Siwak", "Washing Feet"], correctIndex: 2 }
        ]
    },
    {
        id: 3,
        title: "Stage 3: Prayer Sunnahs",
        questions: [
            { type: 'true_false', text: "Opening Dua is a Pillar of prayer", options: ["True", "False"], correctIndex: 1 },
            { type: 'multiple_choice', text: "When is the First Tashahhud read in 4-rakat prayer?", options: ["After 1st Rakah", "After 2nd Rakah", "After 3rd Rakah", "After 4th Rakah"], correctIndex: 1 },
            { type: 'fill_blank', text: "Raising hands at Takbirat al-Ihram is ____", options: ["Sunnah", "Wajib", "Pillar", "Disliked"], correctIndex: 0 },
            { type: 'multiple_choice', text: "Placing Right hand over Left is done:", options: ["Above Navel", "On Chest", "Below Navel", "All above reported"], correctIndex: 3 },
            { type: 'true_false', text: "Reciting Surah after Fatiha in first two rakahs is Sunnah", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "Which act is Sunnah?", options: ["Fatiha", "Ruku", "Looking at Sujood spot", "Taslim"], correctIndex: 2 },
            { type: 'fill_blank', text: "Upon rising from Ruku say: Sami Allahu ____", options: ["Akbar", "Liman Hamidah", "Adheem", "A'la"], correctIndex: 1 },
            { type: 'true_false', text: "Sitting of Rest (Istirahah) is after 2nd prostration of 1st and 3rd rakah", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "Saying Ameen after Fatiha is:", options: ["Wajib", "Sunnah", "Pillar", "Disliked"], correctIndex: 1 },
            { type: 'fill_blank', text: "Iftirash sitting is done between prostrations and in ____", options: ["First Tashahhud", "Last Tashahhud", "Standing", "Ruku"], correctIndex: 0 }
        ]
    },
    {
        id: 4,
        title: "Stage 4: Prayer Times",
        questions: [
            { type: 'multiple_choice', text: "When does Dhuhr time start?", options: ["Sunrise", "Zenith (Zawal)", "Yellowing Sun", "Sunset"], correctIndex: 1 },
            { type: 'true_false', text: "Duha time starts from Fajr", options: ["True", "False"], correctIndex: 1 },
            { type: 'fill_blank', text: "Isha time extends to ____ of night", options: ["Third", "Half", "Quarter", "Sixth"], correctIndex: 1 },
            { type: 'multiple_choice', text: "When does Fajr time end?", options: ["Sunrise", "Zenith", "Sunset", "Midday"], correctIndex: 0 },
            { type: 'true_false', text: "It is disliked to pray when sun is at absolute zenith", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "What is the Middle Prayer mentioned in Quran?", options: ["Fajr", "Dhuhr", "Asr", "Isha"], correctIndex: 2 },
            { type: 'fill_blank', text: "One catches the prayer if he catches a ____ before time ends", options: ["Tashahhud", "Sujood", "Rakah", "Takbir"], correctIndex: 2 },
            { type: 'true_false', text: "Delaying prayer beyond time without excuse is permissible", options: ["True", "False"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Necessity time for Asr extends to:", options: ["Yellowing Sun", "Sunset", "Isha", "Midnight"], correctIndex: 1 },
            { type: 'fill_blank', text: "Best deed is Prayer on ____", options: ["Time", "Carpet", "Chair", "Bed"], correctIndex: 0 }
        ]
    },
    {
        id: 5,
        title: "Stage 5: Forgetfulness (Sahw)",
        questions: [
            { type: 'multiple_choice', text: "When is Sujood Sahw before Salam?", options: ["For Deficiency", "For Addition", "Both cases", "Never"], correctIndex: 0 },
            { type: 'true_false', text: "If in doubt about number of rakahs, build on the greater number", options: ["True", "False"], correctIndex: 1 },
            { type: 'fill_blank', text: "Sujood Sahw for leaving non-emphasized Sunnah is ____", options: ["Wajib", "Recommended", "Not Prescribed", "Disliked"], correctIndex: 2 },
            { type: 'multiple_choice', text: "If one salams before completion forgetfully?", options: ["Repeat whole prayer", "Complete what missed & Sujood", "Seek forgiveness only", "Nothing"], correctIndex: 1 },
            { type: 'true_false', text: "Sujood Sahw is two prostrations", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "If added a Rakah forgetfully, Sujood is:", options: ["Before Salam", "After Salam", "During Tashahhud", "None"], correctIndex: 1 },
            { type: 'fill_blank', text: "Forgot First Tashahhud and stood up fully, then ____", options: ["Return and Sit", "Continue & Don't Return", "Stop Prayer", "Sit Immediately"], correctIndex: 1 },
            { type: 'true_false', text: "Intentional addition of action pillar invalidates prayer", options: ["True", "False"], correctIndex: 0 },
            { type: 'multiple_choice', text: "Place of Sujood Sahw:", options: ["All before Salam", "All after Salam", "Detailed", "No Sujood"], correctIndex: 2 },
            { type: 'fill_blank', text: "Sahw in prayer is ____ in it", options: ["Doubt", "Leaving", "Negligence", "Forgetfulness"], correctIndex: 3 }
        ]
    },
    {
        id: 6,
        title: "Stage 6: Fasting",
        questions: [
            { type: 'multiple_choice', text: "In which month is Fasting obligatory?", options: ["Sha'ban", "Ramadan", "Shawwal", "Dhul Hijjah"], correctIndex: 1 },
            { type: 'true_false', text: "Fasting time starts from Sunrise", options: ["True", "False (From Fajr)"], correctIndex: 1 },
            { type: 'fill_blank', text: "Fasting is the ____ pillar of Islam", options: ["1st", "2nd", "3rd", "4th"], correctIndex: 3 },
            { type: 'multiple_choice', text: "Meal eaten before Fajr is called?", options: ["Iftar", "Dinner", "Suhoor", "Lunch"], correctIndex: 2 },
            { type: 'true_false', text: "Niyyah is a condition and must be before Fajr for obligatory fast", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "Break fast when hearing Adhan of ____", options: ["Asr", "Maghrib", "Isha", "Fajr"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Night better than 1000 months?", options: ["Friday Night", "Mid-Ramadan", "Laylat al-Qadr", "Eid Night"], correctIndex: 2 },
            { type: 'true_false', text: "Eating/Drinking forgetfully invalidates fast", options: ["True", "False"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Zakat paid before Eid al-Fitr prayer?", options: ["Zakat al-Mal", "Zakat al-Fitr", "Gold Zakat", "Sadaqah"], correctIndex: 1 },
            { type: 'fill_blank', text: "Fasting teaches patience and feeling for ____", options: ["Rich", "Poor", "Travelers", "Sick"], correctIndex: 1 }
        ]
    },
    {
        id: 7,
        title: "Stage 7: Zakat & Charity",
        questions: [
            { type: 'multiple_choice', text: "Zakat is the ____ pillar of Islam", options: ["1st", "2nd", "3rd", "5th"], correctIndex: 2 },
            { type: 'true_false', text: "Zakat is due on every Muslim regardless of wealth", options: ["True", "False"], correctIndex: 1 },
            { type: 'fill_blank', text: "The limit amount making Zakat obligatory is ____", options: ["Debt", "Nisab", "Kharaj", "Jizya"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Who receives Zakat?", options: ["Rich", "Poor/Needy", "Mosques only", "Travel/Tourism"], correctIndex: 1 },
            { type: 'true_false', text: "Voluntary Charity is not obligatory and can be given anytime", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "Rate of Zakat on money is ____ %", options: ["1%", "2.5%", "5%", "10%"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Caliph who fought withholderson Zakat?", options: ["Umar", "Ali", "Abu Bakr", "Uthman"], correctIndex: 2 },
            { type: 'true_false', text: "Zakat purifies soul and wealth", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "Charity that continues after death is ____", options: ["Temporary", "Jariyah", "Secret", "Public"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Best charity mentioned by Prophet?", options: ["Building house", "Providing Water", "Clothes", "Travel"], correctIndex: 1 }
        ]
    },
    {
        id: 8,
        title: "Stage 8: Hajj & Umrah",
        questions: [
            { type: 'multiple_choice', text: "Hajj is obligatory once in lifetime on condition of:", options: ["Youth", "Extreme Wealth", "Ability", "Being Imam"], correctIndex: 2 },
            { type: 'true_false', text: "Hajj can be performed in any month", options: ["True", "False (Only Dhul Hijjah)"], correctIndex: 1 },
            { type: 'fill_blank', text: "Entering Niyyah with special clothes is ____", options: ["Tahalul", "Ihram", "Talbiyah", "Istilam"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Walking between Safa & Marwa 7 times is:", options: ["Tawaf", "Sa'i", "Ramy", "Mabit"], correctIndex: 1 },
            { type: 'true_false', text: "Standing at Arafat is the greatest pillar", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "Circling Kaaba 7 times is ____", options: ["Sa'i", "Tawaf", "Jogging", "Standing"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Where are Jamarat thrown?", options: ["Makkah", "Mina", "Arafat", "Madinah"], correctIndex: 1 },
            { type: 'true_false', text: "Umrah allowed multiple times a year", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "Black Stone is in ____ corner of Kaaba", options: ["North", "Yemeni", "Eastern", "West"], correctIndex: 2 },
            { type: 'multiple_choice', text: "In which Hijri month is Hajj?", options: ["Ramadan", "Rajab", "Dhul Hijjah", "Muharram"], correctIndex: 2 }
        ]
    },
    {
        id: 9,
        title: "Stage 9: Seerah",
        questions: [
            { type: 'multiple_choice', text: "Where was Prophet Muhammad (PBUH) born?", options: ["Madinah", "Makkah", "Taif", "Jerusalem"], correctIndex: 1 },
            { type: 'true_false', text: "His father died before his birth", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "His title before revelation was ____", options: ["Faruq", "Siddiq", "Sadiq Amin", "Dhun-Nurayn"], correctIndex: 2 },
            { type: 'multiple_choice', text: "Age at first revelation?", options: ["25", "40", "33", "63"], correctIndex: 1 },
            { type: 'true_false', text: "First man to believe was Abu Bakr", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "Migration to Madinah is called ____", options: ["Trip", "Hijrah", "Pledge", "Conquest"], correctIndex: 1 },
            { type: 'multiple_choice', text: "First battle in Islam?", options: ["Uhud", "Khandaq", "Badr", "Khaybar"], correctIndex: 2 },
            { type: 'true_false', text: "Prophet performed only one Hajj (Farewell)", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "Cave of first revelation is ____", options: ["Thawr", "Hira", "Mercy", "Kahf"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Companion in Hijrah?", options: ["Umar", "Ali", "Abu Bakr", "Uthman"], correctIndex: 2 }
        ]
    },
    {
        id: 10,
        title: "Stage 10: Islamic Manners",
        questions: [
            { type: 'multiple_choice', text: "Prophet said: I was sent to perfect ____", options: ["Good Manners", "Worship", "Transactions", "Conquests"], correctIndex: 0 },
            { type: 'true_false', text: "Backbiting is allowed if true", options: ["True", "False"], correctIndex: 1 },
            { type: 'fill_blank', text: "Smiling in brother's face is ____", options: ["Duty", "Charity", "Permissible", "Disliked"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Greeting upon meeting?", options: ["Good Morning", "Salam Alaykum", "How are you", "Welcome"], correctIndex: 1 },
            { type: 'true_false', text: "Truth leads to Piety, Piety to Paradise", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "None believes until he loves for brother what he loves for ____", options: ["Family", "Self", "Friends", "Neighbors"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Kindness to parents is:", options: ["Recommended", "Permissible", "Obligatory", "Optional"], correctIndex: 2 },
            { type: 'true_false', text: "Releasing secrets is sign of Hypocrisy", options: ["True", "False"], correctIndex: 0 },
            { type: 'fill_blank', text: "Gabriel advised me about ____ until I thought he'd give him inheritance", options: ["Friend", "Neighbor", "Brother", "Orphan"], correctIndex: 1 },
            { type: 'multiple_choice', text: "Sign of Hypocrite?", options: ["Lies when speaks", "Prays fast", "Gives openly", "Walks proudly"], correctIndex: 0 }
        ]
    }
];

export function getChallenges(lang) {
    return lang === 'ar' ? challenges_ar : challenges_en;
}
