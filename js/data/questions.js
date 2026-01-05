export const challenges = [
    {
        id: 1,
        title: "المرحلة الأولى: أساسيات الصلاة",
        questions: [
            {
                type: 'multiple_choice',
                text: "كم عدد ركعات صلاة الفجر؟",
                options: ["ركعتان", "4 ركعات", "3 ركعات", "ركعة واحدة"],
                correctIndex: 0
            },
            {
                type: 'true_false',
                text: "صلاة العيد لها أذان وإقامة مثل الصلوات الخمس",
                options: ["صح", "خطأ"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "ما هي القبلة التي يتوجه إليها المسلمون في الصلاة؟",
                options: ["المسجد الأقصى", "المسجد النبوي", "الكعبة المشرفة", "جبل أحد"],
                correctIndex: 2
            },
            {
                type: 'fill_blank',
                text: "الصلاة هي الركن ____ من أركان الإسلام",
                options: ["الأول", "الثاني", "الثالث", "الرابع"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "أي صلاة من الصلوات الخمس لا تقصر في السفر؟",
                options: ["الفجر", "الظهر", "المغرب", "العشاء"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "تجوز الصلاة بالتيمم إذا كان الماء باردًا جدًا ولا يوجد ما يسخنه ويخاف الضرر",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "ماذا يقول المصلي في السجود؟",
                options: ["سبحان ربي العظيم", "سبحان ربي الأعلى", "سمع الله لمن حمده", "التحيات لله"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "عدد الصلوات المفروضة في اليوم والليلة ____ صلوات",
                options: ["ثلاث", "أربع", "خمس", "ست"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "النية شرط لصحة الصلاة",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "أول ما يحاسب عليه العبد يوم القيامة من عمله هو:",
                options: ["الزكاة", "الصيام", "الصلاة", "الحج"],
                correctIndex: 2
            }
        ]
    },
    {
        id: 2,
        title: "المرحلة الثانية: الوضوء والطهارة",
        questions: [
            {
                type: 'multiple_choice',
                text: "أي من التالي لا يعتبر من نواقض الوضوء؟",
                options: ["النوم العميق", "أكل لحم الإبل", "قص الأظافر", "خروج الريح"],
                correctIndex: 2
            },
            {
                type: 'fill_blank',
                text: "عدد فرائض الوضوء ____ فرائض",
                options: ["أربعة", "خمسة", "ستة", "سبعة"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "الماء المستعمل هو الماء الذي تساقط من الأعضاء أثناء الوضوء",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "ما حكم المسح على الخفين للمقيم؟",
                options: ["يوم وليلة", "ثلاثة أيام بلياليها", "صلاة واحدة", "أسبوع كامل"],
                correctIndex: 0
            },
            {
                type: 'true_false',
                text: "يجب غسل الرجلين إلى الكعبين في الوضوء",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "إذا لم يجد المسلم الماء للوضوء فإنه ____",
                options: ["يصلي طالباً", "يؤخر الصلاة", "يتيمم", "يسقط الصلاة"],
                correctIndex: 2
            },
            {
                type: 'multiple_choice',
                text: "أي مما يلي يوجب الغسل؟",
                options: ["النوم", "خروج الريح", "الجنابة", "الرعاف"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "لمس النجاسة لا ينقض الوضوء ولكن يجب غسل موضع النجاسة",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "الترتيب بين أعضاء الوضوء حكمه:",
                options: ["سنة", "فرض", "مستحب", "مباح"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "من سنن الوضوء ____",
                options: ["غسل الوجه", "مسح الرأس", "السواك", "غسل الرجلين"],
                correctIndex: 2
            }
        ]
    },
    {
        id: 3,
        title: "المرحلة الثالثة: سنن الصلاة",
        questions: [
            {
                type: 'true_false',
                text: "دعاء الاستفتاح في الصلاة ركن من أركان الصلاة",
                options: ["صح", "خطأ"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "متى يقرأ التشهد الأول في الصلاة الرباعية؟",
                options: ["بعد الركعة الأولى", "بعد الركعة الثانية", "بعد الركعة الثالثة", "بعد الركعة الرابعة"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "حكم رفع اليدين عند تكبيرة الإحرام هو ____",
                options: ["سنة", "واجب", "ركن", "مكروه"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "وضع اليد اليمنى على اليسرى في الصلاة يكون:",
                options: ["فوق السرة", "على الصدر", "تحت السرة", "كل ما سبق وارد"],
                correctIndex: 3
            },
            {
                type: 'true_false',
                text: "قراءة سورة بعد الفاتحة في الركعتين الأوليين سنة",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "أي من هذه الأفعال يعتبر من سنن الصلاة؟",
                options: ["قراءة الفاتحة", "الركوع", "النظر إلى موضع السجود", "التسليم"],
                correctIndex: 2
            },
            {
                type: 'fill_blank',
                text: "يقول المصلي عند الرفع من الركوع: سمع الله ____",
                options: ["أكبر", "لمن حمده", "العظيم", "الأعلى"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "جلسة الاستراحة تكون بعد السجدة الثانية من الركعة الأولى والثالثة",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "حكم التأمين (قول آمين) بعد الفاتحة:",
                options: ["واجب", "سنة", "ركن", "مكروه"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "الافتراش يكون في الجلوس بين السجدتين وفي ____",
                options: ["التشهد الأول", "التشهد الأخير", "القيام", "الركوع"],
                correctIndex: 0
            }
        ]
    },
    {
        id: 4,
        title: "المرحلة الرابعة: أوقات الصلاة",
        questions: [
            {
                type: 'multiple_choice',
                text: "متى يبدأ وقت صلاة الظهر؟",
                options: ["من طلوع الشمس", "من زوال الشمس", "عند اصفرار الشمس", "عند غروب الشمس"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "وقت صلاة الضحى يبدأ من طلوع الفجر",
                options: ["صح", "خطأ"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "يمتد وقت صلاة العشاء إلى ____ الليل",
                options: ["ثلث", "نصف", "ربع", "سدس"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "متى ينتهي وقت صلاة الفجر؟",
                options: ["بطلوع الشمس", "بزوال الشمس", "بغروب الشمس", "بمنتصف النهار"],
                correctIndex: 0
            },
            {
                type: 'true_false',
                text: "يكره الصلاة عند استواء الشمس في كبد السماء",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "ما هي الصلاة الوسطى المذكورة في القرآن؟",
                options: ["الفجر", "الظهر", "العصر", "العشاء"],
                correctIndex: 2
            },
            {
                type: 'fill_blank',
                text: "يدرك المصلي الصلاة إذا أدرك ____ قبل خروج الوقت",
                options: ["التشهد", "السجود", "ركعة", "التكبير"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "يجوز تأخير الصلاة عن وقتها بدون عذر",
                options: ["صح", "خطأ"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "وقت الضرورة لصلاة العصر يمتد حتى:",
                options: ["اصفرار الشمس", "غروب الشمس", "وقت العشاء", "منتصف الليل"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "أفضل الأعمال الصلاة على ____",
                options: ["وقتها", "سجادتها", "الكرسي", "السرير"],
                correctIndex: 0
            }
        ]
    },
    {
        id: 5,
        title: "المرحلة الخامسة: أحكام السهو",
        questions: [
            {
                type: 'multiple_choice',
                text: "متى يكون سجود السهو قبل السلام؟",
                options: ["إذا كان عن نقص", "إذا كان عن زيادة", "في الحالتين", "لا يوجد سجود سهو قبل السلام"],
                correctIndex: 0
            },
            {
                type: 'true_false',
                text: "إذا شك المصلي في عدد الركعات يبني على الأكثر",
                options: ["صح", "خطأ"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "سجود السهو لترك سنة من السنن غير المؤكدة (مثل قراءة سورة بعد الفاتحة) هو____",
                options: ["واجب", "مستحب", "لا يشرع", "مكروه"],
                correctIndex: 2
            },
            {
                type: 'multiple_choice',
                text: "إذا سلم المصلي قبل إتمام صلاته ناسيًا، ماذا يفعل؟",
                options: ["يعيد الصلاة كاملة", "يكمل ما فاته ويسجد للسهو", "يستغفر فقط", "لا شيء عليه"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "سجود السهو سجدتان مثل سجود الصلاة",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "إذا زاد المصلي ركعة ناسيًا، فمتى يسجد للسهو؟",
                options: ["قبل السلام", "بعد السلام", "أثناء التشهد", "لا يسجد"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "من نسي التشهد الأول وقام للثالثة واستتم قائماً فإنه ____",
                options: ["يرجع ويجلس", "يكمل صلاته ولا يرجع", "يقطع صلاته", "يجلس فوراً"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "تعمد زيادة ركن فعلي في الصلاة يبطلها",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'multiple_choice',
                text: "محل سجود السهو:",
                options: ["كله قبل السلام", "كله بعد السلام", "فيه تفصيل", "لا يسجد"],
                correctIndex: 2
            },
            {
                type: 'fill_blank',
                text: "السهو في الصلاة هو ____ في شيء منها",
                options: ["الشك", "الترك", "الغفلة", "النسيان"],
                correctIndex: 3
            }
        ]
    },
    {
        id: 6,
        title: "المرحلة السادسة: الصيام",
        questions: [
            {
                type: 'multiple_choice',
                text: "في أي شهر يجب على المسلمين صيام الفريضة؟",
                options: ["شعبان", "رمضان", "شوال", "ذو الحجة"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "يبدأ وقت الصيام من طلوع الشمس إلى غروبها",
                options: ["صح", "خطأ (من الفجر)"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "الصيام هو الركن ____ من أركان الإسلام",
                options: ["الأول", "الثاني", "الثالث", "الرابع"],
                correctIndex: 3
            },
            {
                type: 'multiple_choice',
                text: "ما اسم الوجبة التي يتناولها الصائم قبل الفجر؟",
                options: ["الإفطار", "العشاء", "السحور", "الغداء"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "النيّة في صيام الفريضة شرط ويجب أن تكون قبل الفجر",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "يفطر الصائم عند سماع أذان صلاة ____",
                options: ["العصر", "المغرب", "العشاء", "الفجر"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "أي ليلة في رمضان هي خير من ألف شهر؟",
                options: ["ليلة الجمعة", "ليلة النصف من رمضان", "ليلة القدر", "ليلة العيد"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "الأكل أو الشرب ناسيًا يبطل الصيام ويجب إعادته",
                options: ["صح", "خطأ (يتم صومه)"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "ما هي الزكاة التي تخرج قبل صلاة عيد الفطر؟",
                options: ["زكاة المال", "زكاة الفطر", "زكاة الذهب", "الصدقة الجارية"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "الصيام يعلمنا الصبر والشعور بحال ____",
                options: ["الأغنياء", "الفقراء", "المسافرين", "المرضى"],
                correctIndex: 1
            }
        ]
    },
    {
        id: 7,
        title: "المرحلة السابعة: الزكاة والصدقة",
        questions: [
            {
                type: 'multiple_choice',
                text: "الزكاة هي الركن ____ من أركان الإسلام",
                options: ["الأول", "الثاني", "الثالث", "الخامس"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "تجب الزكاة على كل مسلم مهما كان مقدار ماله",
                options: ["صح", "خطأ (فقط من ملك النصاب)"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "المقدار المحدد من المال الذي إذا ملكه المسلم وجبت فيه الزكاة يسمى ____",
                options: ["الدين", "النصاب", "الخراج", "الجزية"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "إلى من تصرف الزكاة؟",
                options: ["الأغنياء", "الفقراء والمساكين", "بناء المساجد فقط", "للسفر والسياحة"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "صدقة التطوع غير واجبة ويمكن إخراجها في أي وقت",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "نسبة زكاة المال (الذهب والفضة والعملات) هي ____ بالمئة",
                options: ["1%", "2.5%", "5%", "10%"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "من هو الخليفة الذي قاتل الممتنعين عن أداء الزكاة؟",
                options: ["عمر بن الخطاب", "علي بن أبي طالب", "أبو بكر الصديق", "عثمان بن عفان"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "الزكاة تطهر النفس والمال وتزيد البركة",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "الصدقة ____ هي التي يستمر أجرها بعد وفاة الإنسان",
                options: ["المؤقتة", "الجارية", "السرية", "العامة"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "من أفضل أنواع الصدقات كما ذكر النبي صلى الله عليه وسلم:",
                options: ["بناء بيت", "سقي الماء", "شراء ملابس", "السفر"],
                correctIndex: 1
            }
        ]
    },
    {
        id: 8,
        title: "المرحلة الثامنة: الحج والعمرة",
        questions: [
            {
                type: 'multiple_choice',
                text: "يجب الحج على المسلم مرة واحدة في العمر بشرط:",
                options: ["الشباب", "الغنى الفاحش", "الاستطاعة", "أن يكون إماماً"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "يمكن أداء فريضة الحج في أي شهر من شهور السنة",
                options: ["صح", "خطأ (فقط في ذي الحجة)"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "الدخول في نية الحج أو العمرة مع لبس ملابس معينة يسمى ____",
                options: ["التحلل", "الإحرام", "التلبية", "الاستلام"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "المشي بين الصفا والمروة سبعة أشواط يسمى:",
                options: ["الطواف", "السعي", "الرمي", "المبيت"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "الوقوف بعرفة هو أعظم أركان الحج",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "الدوران حول الكعبة سبعة أشواط يسمى ____",
                options: ["السعي", "الطواف", "الهرولة", "الوقوف"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "أين يرمي الحجاج الجمرات؟",
                options: ["في مكة", "في منى", "في عرفات", "في المدينة"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "يجوز أداء العمرة أكثر من مرة في السنة الواحدة",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "يقع الحجر الأسود في الركن ____ من الكعبة المشرفة",
                options: ["الشمالي", "اليماني", "الشرقي", "الغربي"],
                correctIndex: 2
            },
            {
                type: 'multiple_choice',
                text: "في أي شهر هجري يكون موسم الحج؟",
                options: ["رمضان", "رجب", "ذو الحجة", "محرم"],
                correctIndex: 2
            }
        ]
    },
    {
        id: 9,
        title: "المرحلة التاسعة: السيرة النبوية",
        questions: [
            {
                type: 'multiple_choice',
                text: "أين ولد النبي محمد صلى الله عليه وسلم؟",
                options: ["المدينة المنورة", "مكة المكرمة", "الطائف", "القدس"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "توفي والد النبي صلى الله عليه وسلم قبل ولادته",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "لقب النبي صلى الله عليه وسلم قبل البعثة بـ ____",
                options: ["الفاروق", "الصديق", "الصادق الأمين", "ذو النورين"],
                correctIndex: 2
            },
            {
                type: 'multiple_choice',
                text: "كم كان عمر النبي صلى الله عليه وسلم عندما نزل عليه الوحي لأول مرة؟",
                options: ["25 سنة", "40 سنة", "33 سنة", "63 سنة"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "أول من آمن بالنبي صلى الله عليه وسلم من الرجال هو أبو بكر الصديق",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "تسمى هجرة النبي صلى الله عليه وسلم وأصحابه من مكة إلى المدينة بـ ____",
                options: ["الرحلة", "الهجرة", "البيعة", "الفتح"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "ما هي أول غزوة في الإسلام؟",
                options: ["غزوة أحد", "غزوة الخندق", "غزوة بدر", "غزوة خيبر"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "حج النبي صلى الله عليه وسلم حجة واحدة تسمى حجة الوداع",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "الغار الذي نزل فيه الوحي لأول مرة هو غار ____",
                options: ["ثور", "حراء", "الرحمة", "الكهف"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "من كان رفيق النبي صلى الله عليه وسلم في رحلة الهجرة؟",
                options: ["عمر بن الخطاب", "علي بن أبي طالب", "أبو بكر الصديق", "عثمان بن عفان"],
                correctIndex: 2
            }
        ]
    },
    {
        id: 10,
        title: "المرحلة العاشرة: الأخلاق والآداب الإسلامية",
        questions: [
            {
                type: 'multiple_choice',
                text: "قال النبي صلى الله عليه وسلم: إنما بعثت لأتمم ____",
                options: ["مكارم الأخلاق", "العبادات", "المعاملات", "الفتوحات"],
                correctIndex: 0
            },
            {
                type: 'true_false',
                text: "الغيبة (ذكر الآخرين بما يكرهون) جائزة إذا كان الشخص سيئاً فعلاً",
                options: ["صح", "خطأ (محرمة)"],
                correctIndex: 1
            },
            {
                type: 'fill_blank',
                text: "تبسمك في وجه أخيك ____",
                options: ["واجب", "صدقة", "مباح", "مكروه"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "ماذا يجب أن يقول المسلم عندما يقابل أخاه المسلم؟",
                options: ["صباح الخير", "السلام عليكم", "كيف حالك", "أهلاً بك"],
                correctIndex: 1
            },
            {
                type: 'true_false',
                text: "الصدق يهدي إلى البر، والبر يهدي إلى الجنة",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لـ ____",
                options: ["أهله", "نفسه", "أصدقائه", "جيرانه"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "بر الوالدين في الإسلام يعتبر:",
                options: ["مستحباً", "مباحاً", "واجباً ومن أعظم القربات", "اختيارياً"],
                correctIndex: 2
            },
            {
                type: 'true_false',
                text: "إفشاء الأسرار وعدم حفظ الأمانة من علامات المنافق",
                options: ["صح", "خطأ"],
                correctIndex: 0
            },
            {
                type: 'fill_blank',
                text: "ما زال جبريل يوصيني بالـ ____ حتى ظننت أنه سيورثه",
                options: ["الصديق", "الجار", "الأخ", "اليتيم"],
                correctIndex: 1
            },
            {
                type: 'multiple_choice',
                text: "أي من هذه الخصال يعتبر من آيات المنافق كما ذكر النبي صلى الله عليه وسلم؟",
                options: ["إذا حدث كذب", "إذا صلى أسرع", "إذا تصدق جهراً", "إذا مشى تكبر"],
                correctIndex: 0
            }
        ]
    }
];
