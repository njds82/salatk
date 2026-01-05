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
            }
        ]
    }
];
