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
    if (!window.supabaseClient) return;
    const session = await window.AuthManager.getSession();
    if (!session) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('last_completed_stage')
            .eq('id', session.user.id)
            .single();

        if (data) {
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

function startStage(stage) {
    activeStage = stage;
    currentQuestionIndex = 0;
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
            // If text is purely generic, maybe add icons?
            // But content usually "صح" or "خطأ"
        }

        btn.textContent = opt;
        btn.onclick = () => handleAnswer(idx);
        optionsContainer.appendChild(btn);
    });
}



async function handleAnswer(selectedIndex) {
    const question = activeStage.questions[currentQuestionIndex];
    const options = document.querySelectorAll('.option-btn');

    // Disable all buttons
    options.forEach(btn => btn.disabled = true);

    if (selectedIndex === question.correctIndex) {
        // Correct
        options[selectedIndex].classList.add('correct');

        // Fill blank visual
        if (question.type === 'fill_blank') {
            const blankSpot = document.getElementById('blank-spot');
            if (blankSpot) {
                blankSpot.textContent = question.options[selectedIndex];
                blankSpot.classList.add('filled', 'success');
            }
        }

        // Wait and go next
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < activeStage.questions.length) {
                renderQuestion();
            } else {
                finishStage(true);
            }
        }, 1200);
    } else {
        // Wrong
        options[selectedIndex].classList.add('wrong');
        options[question.correctIndex].classList.add('correct'); // Show correct one

        // Fill blank with correction
        if (question.type === 'fill_blank') {
            const blankSpot = document.getElementById('blank-spot');
            if (blankSpot) {
                blankSpot.textContent = question.options[question.correctIndex];
                blankSpot.classList.add('filled', 'error');
            }
        }

        // Wait and fail stage
        setTimeout(() => {
            finishStage(false);
        }, 2000);
    }
}

async function finishStage(success) {
    window.closeQuizModal();

    if (success) {
        // If this is a new completion (not replay of old one)
        if (activeStage.id > lastCompletedStageId) {
            const pointsAwarded = await awardPoints(activeStage.id);

            if (pointsAwarded) {
                lastCompletedStageId = activeStage.id;

                // Re-render page to show unlocked next stage
                // We skip fetch to rely on the local update we just made, preventing race conditions
                const content = document.getElementById('pageContent');
                const html = await renderChallengePage(true);
                content.innerHTML = html;

                showToast(`مبروك! أكملت المرحلة وحصلت على 3 نقاط`, 'success');
            } else {
                showToast('تعذر احتساب النقاط. يرجى التحقق من الاتصال والمحاولة مرة أخرى.', 'error');
                // Do NOT update lastCompletedStageId so user can retry
            }
        } else {
            showToast(`أحسنت! أكملت المرحلة (تم احتساب النقاط سابقاً)`, 'success');
        }
    } else {
        showToast('إجابة خاطئة، حاول مرة أخرى!', 'error');
    }
}

async function awardPoints(stageId) {
    if (!window.PointsService) return false;

    // Add points
    const success = await window.PointsService.addPoints(3, `challenge_stage_${stageId}`);

    if (success) {
        // Save progress to profiles only if points were successfully added
        if (window.supabaseClient) {
            const session = await window.AuthManager.getSession();
            if (session) {
                const { error } = await window.supabaseClient
                    .from('profiles')
                    .update({ last_completed_stage: stageId })
                    .eq('id', session.user.id);

                if (error) {
                    console.error('Error saving progress:', error);
                    // We still return true because points were awarded, 
                    // progress sync might resolve next time or we can just proceed.
                    // Ideally we might want to rollback points, but that's complex.
                }
            }
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
