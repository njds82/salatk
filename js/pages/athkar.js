
// ========================================
// Athkar Page Component
// ========================================

const ATHKAR_LIST = [
    "أستغفر الله العظيم و أتوب إليه",
    "لا حول ولا قوة إلّا بالله",
    "اللهم صلِّ و سلِّم على سيدنا محمد",
    "سبحان الله",
    "الحمد لله",
    "لا إله إلّا الله",
    "الله أكبر",
    "سبحان الله و بحمده",
    "سبحان الله العظيم",
    "سبحان الله و بحمده عدد خلقه و رضا نفسه و زنة عرشه و مداد كلماته",
    "يا حي يا قيوم برحمتك أستغيث أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين",
    "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    "اللّهُـمَّ إِنِّـي أَسْأَلُـكَ عِلْمـاً نافِعـاً ، وَرِزْقـاً طَيِّبـاً ، وَعَمَـلاً مُتَقَبَّـلاً"
];

let currentAthkarIndex = 0;
let athkarSessionCount = 0; // Counts "reads" in this session or total
let pointsAwardedForCurrentSet = false;

async function renderAthkarPage() {
    return `
        <div class="page-header center-text">
            <h2 class="page-title" data-i18n="nav_athkar">الأذكار</h2>
            <p class="page-subtitle" data-i18n="athkar_subtitle">رطب لسانك بذكر الله</p>
        </div>

        <div class="athkar-container">
            <div class="athkar-card glass" id="athkarCard">
                <div class="athkar-text" id="athkarText">
                    ${ATHKAR_LIST[currentAthkarIndex]}
                </div>
                
                <div class="athkar-actions">
                    <button class="icon-btn large-icon" id="prevAthkar">
                        <svg width="24" height="24" viewBox="0 0 24 24" class="rtl-flip">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    
                    <button class="btn btn-primary lg-btn pulse-effect" id="readBtn">
                        <span data-i18n="read_btn">قرأت</span>
                        <span class="count-badge" id="readCountBadge">0</span>
                    </button>

                    <button class="icon-btn large-icon" id="nextAthkar">
                        <svg width="24" height="24" viewBox="0 0 24 24" class="rtl-flip">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="athkar-progress">
                <p data-i18n="athkar_progress_hint">اقرأ 10 أذكار لتكسب نقطة</p>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="athkarProgressFill" style="width: 0%"></div>
                </div>
            </div>
        </div>
    `;
}

// Function called after the page is injected into DOM
function setupAthkarListeners() {
    const textEl = document.getElementById('athkarText');
    const prevBtn = document.getElementById('prevAthkar');
    const nextBtn = document.getElementById('nextAthkar');
    const readBtn = document.getElementById('readBtn');
    const badge = document.getElementById('readCountBadge');
    const progressBar = document.getElementById('athkarProgressFill');

    // Reset session count on page load if desired, or keep it.
    // Let's keep it 0 for fresh start each page visit or persistence?
    // User requested "Click 10 times increases point". Implies session based.
    athkarSessionCount = 0;
    updateProgressUI();

    function updateText(direction) {
        // Animation
        textEl.style.opacity = '0';
        textEl.style.transform = direction === 'next' ? 'translateX(20px)' : 'translateX(-20px)';

        setTimeout(() => {
            textEl.textContent = ATHKAR_LIST[currentAthkarIndex];
            textEl.style.opacity = '1';
            textEl.style.transform = 'translateX(0)';
        }, 200);
    }

    prevBtn.addEventListener('click', () => {
        currentAthkarIndex = (currentAthkarIndex - 1 + ATHKAR_LIST.length) % ATHKAR_LIST.length;
        updateText('prev');
    });

    nextBtn.addEventListener('click', () => {
        currentAthkarIndex = (currentAthkarIndex + 1) % ATHKAR_LIST.length;
        updateText('next');
    });

    readBtn.addEventListener('click', () => {
        athkarSessionCount++;

        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);

        // Animate button
        readBtn.classList.add('clicked');
        setTimeout(() => readBtn.classList.remove('clicked'), 100);

        // Check for points
        if (athkarSessionCount % 10 === 0) {
            PointsService.addPoints(1, 'athkar_read');
            showToast(t('point_earned_athkar'), 'success');

            // Celebration effect
            const card = document.getElementById('athkarCard');
            card.classList.add('celebrate');
            setTimeout(() => card.classList.remove('celebrate'), 500);
        }

        updateProgressUI();
    });

    function updateProgressUI() {
        const progress = (athkarSessionCount % 10) * 10;
        progressBar.style.width = `${progress}%`;
        badge.textContent = athkarSessionCount;

        if (progress === 0 && athkarSessionCount > 0) {
            progressBar.style.backgroundColor = 'var(--color-success)';
            setTimeout(() => {
                progressBar.style.width = '0%';
                progressBar.style.backgroundColor = 'var(--color-primary)';
            }, 500);
        }
    }

    // Swipe support
    let touchStartX = 0;
    const card = document.getElementById('athkarCard');

    card.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    card.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            // Swipe Left (Next)
            currentAthkarIndex = (currentAthkarIndex + 1) % ATHKAR_LIST.length;
            updateText('next');
        } else if (touchEndX - touchStartX > 50) {
            // Swipe Right (Prev)
            currentAthkarIndex = (currentAthkarIndex - 1 + ATHKAR_LIST.length) % ATHKAR_LIST.length;
            updateText('prev');
        }
    });
}

// Attach listeners when page renders
window.addEventListener('pageRendered', (e) => {
    if (e.detail.page === 'athkar') {
        setupAthkarListeners();
    }
});
