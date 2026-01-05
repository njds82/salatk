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
                text: "تجوز الصلاة بدون طهارة إذا كان الماء باردًا جدًا ولا يوجد ما يسخنه ويخاف الضرر",
                options: ["صح (يتيمم)", "خطأ"],
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
                text: "سجود السهو لترك سنة من سنن الصلاة ____",
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
    }
];
