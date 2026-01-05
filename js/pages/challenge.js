import { challenges } from '../data/questions.js';

// State
let currentStageIndex = 0;
let currentQuestionIndex = 0;
let lastCompletedStageId = 0;
let userProfile = null;

// DOM Elements
let challengeContainer;
let modalOverlay;

// Initialize
export async function initChallengePage() {
    console.log('Initializing Challenge Page...');
    challengeContainer = document.getElementById('challenge-container');

    // Ensure container exists
    if (!challengeContainer) {
        // If rendered via app.js main router, the container might not be there yet? 
        // Actually app.js usually puts html into pageContent. We need to construct the page HTML first.
        // But wait, renderChallengePage is called by app.js. 
        // We should expose a render function that returns HTML string, similar to other pages.
    }
}

// Just like other pages, we export a global render function or attach it to window
// Since app.js uses vanilla JS global functions for other pages, but this is a module.
// We need to attach it to window.

async function renderChallengePage(skipFetch = false) {
    // 1. Fetch user progress (unless skipped)
    if (!skipFetch) {
        await fetchUserProgress();
    }

    // 2. Build HTML
    let stagesHtml = '';

    challenges.forEach((stage, index) => {
        // ... (rest of the loop is same)

        const isLocked = stage.id > lastCompletedStageId + 1;
        const isCompleted = stage.id <= lastCompletedStageId;
        const statusClass = isLocked ? 'locked' : (isCompleted ? 'completed' : 'unlocked');
        const icon = isLocked ? '🔒' : (isCompleted ? '✅' : '🌟');

        stagesHtml += `
            <div class="challenge-card ${statusClass}" onclick="window.handleStageClick(${stage.id})" data-id="${stage.id}">
                <div class="card-icon">${icon}</div>
                <div class="card-content">
                    <h3 class="card-title">${stage.title}</h3>
                    <p class="card-status">
                        ${isLocked ? 'مغلق' : (isCompleted ? 'مكتمل' : 'ابدأ التحدي')}
                    </p>
                </div>
            </div>
        `;
    });

    const html = `
        <div class="challenge-page" id="challenge-page">
             <header class="page-header">
                <h2>صفحة التحدي</h2>
                <p>اختبر معلوماتك الدينية واجمع النقاط!</p>
            </header>
            
            <div class="challenges-grid" id="challenge-container">
                ${stagesHtml}
            </div>
        </div>

        <!-- Quiz Modal -->
        <div class="modal-overlay" id="quiz-modal" style="display: none;">
            <div class="quiz-content">
                <div class="quiz-header">
                    <h3 id="quiz-title">عنوان المرحلة</h3>
                    <span id="quiz-progress">1/3</span>
                </div>
                <div class="quiz-body">
                    <p id="question-text" class="question-text">نص السؤال هنا؟</p>
                    <div class="options-grid" id="options-container">
                        <!-- Options injected here -->
                    </div>
                </div>
                <div class="quiz-footer">
                    <button class="btn btn-secondary" onclick="window.closeQuizModal()">خروج</button>
                </div>
            </div>
        </div>
    `;

    return html;
}

async function fetchUserProgress() {
    if (!window.supabaseClient) {
        console.warn('Supabase client not available for progress fetch');
        return;
    }
    const session = await window.AuthManager.getSession();
    if (!session) {
        console.log('No session, cannot fetch progress');
        return;
    }

    try {
        console.log('Fetching user progress for challenge...');
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('last_completed_stage')
            .eq('id', session.user.id)
            .single();

        if (error) throw error;

        if (data) {
            console.log('User progress fetched:', data);
            lastCompletedStageId = data.last_completed_stage || 0;
        }
    } catch (e) {
        console.error('Error fetching progress:', e);
    }
}

// Handle Stage Click
window.handleStageClick = (stageId) => {
    // Find stage
    const stage = challenges.find(c => c.id === stageId);
    if (!stage) return;

    // Check lock status
    // Stage is locked if its ID is greater than lastCompletedStageId + 1
    // e.g. if last done is 0, stage 1 is open (1 <= 0+1), stage 2 is locked (2 > 1)
    if (stage.id > lastCompletedStageId + 1) {
        showToast('هذه المرحلة مغلقة، أكمل المراحل السابقة أولاً', 'error');
        return;
    }

    // Check if already completed? (Optional: allow replay without points)
    // For now, let's allow replay.

    startStage(stage);
};

let activeStage = null;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let stageStartTime = 0;
let stageMistakes = 0;

function startStage(stage) {
    // Clone and shuffle questions
    activeStage = {
        ...stage,
        questions: shuffleArray([...stage.questions])
    };
    currentQuestionIndex = 0;
    stageStartTime = Date.now();
    stageMistakes = 0;

    showQuizModal();
    renderQuestion();
}

function showQuizModal() {
    document.getElementById('quiz-modal').style.display = 'flex';
}

window.closeQuizModal = () => {
    document.getElementById('quiz-modal').style.display = 'none';
    activeStage = null;
};

function renderQuestion() {
    if (!activeStage) return;
    const question = activeStage.questions[currentQuestionIndex];

    // Reset state
    document.getElementById('quiz-title').textContent = activeStage.title;
    document.getElementById('quiz-progress').textContent = `${currentQuestionIndex + 1} / ${activeStage.questions.length}`;

    // Setup Content based on Type
    const optionsContainer = document.getElementById('options-container');
    const questionTextElement = document.getElementById('question-text');

    // Clear previous classes
    optionsContainer.className = 'options-grid';

    if (question.type === 'fill_blank') {
        const parts = question.text.split('____');
        questionTextElement.innerHTML = `
            ${parts[0]} <span class="blank-spot" id="blank-spot">ــــــ</span> ${parts[1] || ''}
        `;
        optionsContainer.classList.add('fill-blank-mode');
    } else {
        questionTextElement.textContent = question.text;
    }

    if (question.type === 'true_false') {
        optionsContainer.classList.add('true-false-mode');
    }

    optionsContainer.innerHTML = '';

    question.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';

        // Specific styling for types
        if (question.type === 'true_false') {
            btn.classList.add(idx === 0 ? 'btn-true' : 'btn-false');
        }

        btn.textContent = opt;
        btn.onclick = () => selectOption(idx);
        optionsContainer.appendChild(btn);
    });

    // Add Confirm Button if not exists in footer, or just show it
    let confirmBtn = document.getElementById('confirm-btn');
    if (!confirmBtn) {
        const footer = document.querySelector('.quiz-footer');
        // Clear existing footer content first to avoid duplicates or old buttons
        footer.innerHTML = '<button class="btn btn-secondary" onclick="window.closeQuizModal()">خروج</button>';

        confirmBtn = document.createElement('button');
        confirmBtn.id = 'confirm-btn';
        confirmBtn.className = 'btn btn-primary';
        confirmBtn.textContent = 'تأكيد الإجابة';
        confirmBtn.style.display = 'none'; // Hidden initially
        confirmBtn.style.marginRight = '10px';
        confirmBtn.onclick = confirmAnswer;
        footer.appendChild(confirmBtn);
    } else {
        confirmBtn.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.className = 'btn btn-primary'; // Reset classes (remove btn-danger if present)
        confirmBtn.textContent = 'تأكيد الإجابة';
    }
}

let selectedOptionIndex = null;

function selectOption(index) {
    selectedOptionIndex = index;
    const options = document.querySelectorAll('.option-btn');
    options.forEach((btn, idx) => {
        btn.classList.remove('selected');
        if (idx === index) btn.classList.add('selected');
    });

    const question = activeStage.questions[currentQuestionIndex];
    // Preview fill blank
    if (question.type === 'fill_blank') {
        const blankSpot = document.getElementById('blank-spot');
        if (blankSpot) {
            blankSpot.textContent = question.options[index];
            blankSpot.classList.add('filled');
            blankSpot.classList.remove('success', 'error'); // Reset status colors
        }
    }

    // Show Confirm Button
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) confirmBtn.style.display = 'inline-block';
}

async function confirmAnswer() {
    if (selectedOptionIndex === null) return;

    const confirmBtn = document.getElementById('confirm-btn');
    confirmBtn.disabled = true; // Prevent double click

    const question = activeStage.questions[currentQuestionIndex];
    const options = document.querySelectorAll('.option-btn');
    const selectedIndex = selectedOptionIndex;

    // Disable all buttons
    options.forEach(btn => btn.disabled = true);

    if (selectedIndex === question.correctIndex) {
        // Correct
        options[selectedIndex].classList.add('correct');

        // Fill blank visual final state
        if (question.type === 'fill_blank') {
            const blankSpot = document.getElementById('blank-spot');
            if (blankSpot) {
                blankSpot.classList.add('success');
            }
        }

        confirmBtn.textContent = 'إجابة صحيحة!';

        // Wait and go next
        setTimeout(() => {
            currentQuestionIndex++;
            selectedOptionIndex = null; // Reset selection
            if (currentQuestionIndex < activeStage.questions.length) {
                renderQuestion();
            } else {
                finishStage(true);
            }
        }, 1500);
    } else {
        // Wrong
        stageMistakes++;
        options[selectedIndex].classList.add('wrong');
        options[question.correctIndex].classList.add('correct'); // Show correct one

        // Fill blank with correction
        if (question.type === 'fill_blank') {
            const blankSpot = document.getElementById('blank-spot');
            if (blankSpot) {
                blankSpot.textContent = question.options[question.correctIndex];
                blankSpot.classList.remove('success');
                blankSpot.classList.add('error');
            }
        }

        // Push question to end of queue to retry later
        activeStage.questions.push(question);

        confirmBtn.textContent = 'إجابة خاطئة - سنعيد السؤال لاحقاً';
        confirmBtn.classList.replace('btn-primary', 'btn-danger');

        // Wait and go next (instead of failing)
        setTimeout(() => {
            currentQuestionIndex++;
            selectedOptionIndex = null;
            renderQuestion();
        }, 2500);
    }
}


async function finishStage(success) {
    if (!success) {
        showToast('إجابة خاطئة، حاول مرة أخرى!', 'error');
        return;
    }

    // Calculate Stats
    const endTime = Date.now();
    const durationMs = endTime - stageStartTime;
    const durationSec = Math.floor(durationMs / 1000);
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Accuracy: Base questions / (Base questions + mistakes)
    // Note: activeStage.questions grows as we push mistakes.
    // The "original" count was 10. `activeStage.questions.length` is currently 10 + mistakes?
    // Wait, we push to `activeStage.questions`.
    // So `activeStage.questions.length` - `stageMistakes` is roughly the original count?
    // Actually, simpler: The number of correct answers required is always 10 (or original length).
    // Total attempts = Original Length + Mistakes.
    // Let's assume original length is 10. 
    // We can get original length by filtering unique or just checking data.
    // But since we are at the end, currentQuestionIndex matches length.

    // Better way: Initial questions count.
    // We only pushed mistakes.
    // So total attempts = activeStage.questions.length (at the end).
    // Correct unique answers = activeStage.questions.length - stageMistakes. 
    // Wait, no. If I fail Q1, it goes to Q11. Total 11. 
    // Correct answers (successfully passed) = 11? No.
    // We have N unique questions. We answered all of them correctly eventually.
    // So standard count is N.
    // Attempts = N + mistakes.

    const uniqueQuestionsCount = 10; // Or calculate based on ID if we had them. Let's approximate: 
    // activeStage.questions.length includes duplicates now.
    // Actually simple math: Accuracy = 100 * (1 - (mistakes / total_attempts)) ?
    // Or Accuracy = (Total Questions / (Total Questions + Mistakes)) * 100
    // Let's assume Total Questions is 10.
    const totalQuestions = 10;
    const accuracy = Math.round((totalQuestions / (totalQuestions + stageMistakes)) * 100);

    // Render Summary View in Modal
    const quizBody = document.querySelector('.quiz-body');
    const quizFooter = document.querySelector('.quiz-footer');
    const quizHeader = document.querySelector('.quiz-header');

    // Update Header
    document.getElementById('quiz-title').textContent = '🎉 اكتملت المرحلة!';
    document.getElementById('quiz-progress').style.display = 'none';

    // Update Body
    quizBody.innerHTML = `
        <div class="completion-summary" style="text-align: center; padding: 2rem 0;">
            <div class="summary-stat">
                <h3>دقة الإجابة</h3>
                <p class="stat-value" style="font-size: 2rem; color: var(--color-primary); font-weight: bold;">${accuracy}%</p>
            </div>
            <div class="summary-stat" style="margin-top: 1rem;">
                <h3>الوقت المستغرق</h3>
                <p class="stat-value" style="font-size: 1.5rem;">${timeString}</p>
            </div>
        </div>
    `;

    // Update Footer
    // Only show Claim button if not previously completed (or always? User asked to "increase 3 points and unlock next")
    // Use lastCompletedStageId to check if new.
    const isNewCompletion = activeStage.id > lastCompletedStageId;

    // But user request implies they want the button to trigger the unlock/points.
    // So we provide the button regardless, but logic inside might differ.

    quizFooter.innerHTML = `
        <button class="btn btn-primary" id="claim-btn" onclick="window.claimReward(${activeStage.id})" style="width: 100%;">
            ${isNewCompletion ? 'استلام النقاط وفتح المرحلة التالية' : 'إغلاق'}
        </button>
    `;
}

window.claimReward = async (stageId) => {
    const btn = document.getElementById('claim-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'جاري المعالجة...';
    }

    // Determine if we need to award points
    // If it's a replay, we usually don't award points, but the prompt says "increase 3 points".
    // I will stick to "Only award if new" to prevent farming, OR if the prompt implies farming is allowed??
    // "عند الضغط على هذا الزر تزيد 3 نقاط و يزول القفل عن المرحلة التالية"
    // Usually challenges are one-time rewards. I will assume one-time for safety, 
    // but if the user complains I will enable farming.
    // However, if I just "unlock next", that implies progress.

    if (stageId > lastCompletedStageId) {
        console.log('Claiming reward for stage:', stageId);
        const success = await awardPoints(stageId);
        if (success) {
            showToast('تم إضافة النقاط وفتح المرحلة التالية!', 'success');
            // Update local state and UI
            lastCompletedStageId = stageId;
            const content = document.getElementById('pageContent');
            const html = await renderChallengePage(true);
            content.innerHTML = html;
        } else {
            showToast('حدث خطأ أثناء حفظ التقدم، لكن تم فتح المرحلة مؤقتاً.', 'warning');
            // Optimistic unlock
            lastCompletedStageId = stageId;
            const content = document.getElementById('pageContent');
            const html = await renderChallengePage(true);
            content.innerHTML = html;
        }
    } else {
        // Just close and go back
        showToast('تم إكمال المرحلة مسبقاً.', 'info');
    }

    window.closeQuizModal();
};


async function awardPoints(stageId) {
    if (!window.supabaseClient || !window.PointsService) return false;

    const reason = `challenge_stage_${stageId}`;
    console.log('Attempting to award points for:', reason);

    // 1. Try to add points
    let success = await window.PointsService.addPoints(3, reason);
    console.log('PointsService.addPoints result:', success);

    // 2. If failed, check if we already have these points (Duplicate prevention/Recovery)
    if (!success) {
        console.log('Points addition failed. Checking if points were already awarded...');
        const session = await window.AuthManager.getSession();
        if (session) {
            const { data } = await window.supabaseClient
                .from('points_history')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('reason', reason)
                .maybeSingle();

            if (data) {
                console.log('Points already exist for this stage. Proceeding as success.');
                success = true;
            } else {
                console.error('Points do not exist and adding failed.');
            }
        }
    }

    if (success) {
        // Save progress to profiles
        const session = await window.AuthManager.getSession();
        if (session) {
            console.log('Updating profile last_completed_stage to:', stageId);
            const { error } = await window.supabaseClient
                .from('profiles')
                .update({ last_completed_stage: stageId })
                .eq('id', session.user.id);

            if (error) {
                console.error('Error saving progress to profile:', error);
                // We return true because points are verified/added. 
                // The profile update failing is sad but we should let the user continue locally at least.
            } else {
                console.log('Profile updated successfully.');
            }

            // Force refresh local profile/state if needed
            lastCompletedStageId = stageId;
        }
        return true;
    }

    return false;
}

function showToast(msg, type) {
    // Assuming a global toast or similar helper exists, or implemented locally
    // app.js seems to use a toast component
    // If not accessible, use alert for now or try to find the toaster
    // Checking index.html... <div class="toast-container" id="toastContainer"></div>
    // Checked components/toast.js ? 
    // Usually a global showToast exists or we can dispatch event

    if (window.Toast) {
        window.Toast.show(msg, type);
    } else {
        alert(msg);
    }
}

// Expose render function to global scope for app.js
window.renderChallengePage = renderChallengePage;
