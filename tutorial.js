// ==========================================
// Shadow Deck - 미니멀 튜토리얼 시스템
// 절차적 X, 행동 유도 O
// ==========================================

const Tutorial = {
    // 튜토리얼 완료 여부
    completed: false,
    currentStep: 0,
    isActive: false,
    
    // 단계 정의 (최소한의 힌트만)
    steps: [
        {
            id: 'drag-card',
            trigger: 'battle-start',
            message: '카드를 드래그해서 적에게!',
            highlight: '.hand .card',
            arrow: 'up',
            condition: () => document.querySelector('.hand .card')
        },
        {
            id: 'end-turn',
            trigger: 'card-played',
            message: '턴 종료',
            highlight: '#end-turn-btn',
            arrow: 'left',
            delay: 500
        }
    ],
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        // 로컬 스토리지에서 완료 여부 확인
        this.completed = localStorage.getItem('tutorial_completed') === 'true';
        
        if (this.completed) {
            console.log('[Tutorial] 이미 완료됨 - 스킵');
            return;
        }
        
        this.injectStyles();
        console.log('[Tutorial] 초기화 완료');
    },
    
    // 스타일 주입
    injectStyles() {
        if (document.getElementById('tutorial-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
            /* 튜토리얼 힌트 */
            .tutorial-hint {
                position: fixed;
                z-index: 99999;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #ffd700;
                border-radius: 10px;
                padding: 12px 20px;
                color: #fff;
                font-size: 1.1rem;
                font-weight: bold;
                text-align: center;
                pointer-events: none;
                animation: tutorialPulse 1.5s ease-in-out infinite;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
            }
            
            .tutorial-hint::after {
                content: '';
                position: absolute;
                width: 0;
                height: 0;
                border: 10px solid transparent;
            }
            
            .tutorial-hint.arrow-up::after {
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                border-top-color: #ffd700;
            }
            
            .tutorial-hint.arrow-down::after {
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                border-bottom-color: #ffd700;
            }
            
            .tutorial-hint.arrow-left::after {
                right: -20px;
                top: 50%;
                transform: translateY(-50%);
                border-left-color: #ffd700;
            }
            
            .tutorial-hint.arrow-right::after {
                left: -20px;
                top: 50%;
                transform: translateY(-50%);
                border-right-color: #ffd700;
            }
            
            @keyframes tutorialPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.9; }
            }
            
            /* 하이라이트 */
            .tutorial-highlight {
                position: relative;
                z-index: 99998 !important;
            }
            
            .tutorial-highlight::before {
                content: '';
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                border: 3px solid #ffd700;
                border-radius: 10px;
                animation: highlightPulse 1s ease-in-out infinite;
                pointer-events: none;
                z-index: -1;
            }
            
            @keyframes highlightPulse {
                0%, 100% { box-shadow: 0 0 10px #ffd700; }
                50% { box-shadow: 0 0 25px #ffd700, 0 0 40px #ffd700; }
            }
            
            /* 스킵 버튼 */
            .tutorial-skip {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 99999;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid #666;
                color: #888;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s;
            }
            
            .tutorial-skip:hover {
                color: #fff;
                border-color: #ffd700;
            }
            
            /* 딤 오버레이 (선택적) */
            .tutorial-dim {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.3);
                z-index: 99990;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    },
    
    // ==========================================
    // 튜토리얼 시작
    // ==========================================
    start() {
        if (this.completed || this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
        
        // 스킵 버튼 추가
        this.addSkipButton();
        
        // 첫 번째 힌트 표시
        this.showStep(0);
        
        console.log('[Tutorial] 시작');
    },
    
    // 스킵 버튼
    addSkipButton() {
        if (document.getElementById('tutorial-skip')) return;
        
        const skipBtn = document.createElement('button');
        skipBtn.id = 'tutorial-skip';
        skipBtn.className = 'tutorial-skip';
        skipBtn.textContent = '튜토리얼 스킵';
        skipBtn.onclick = () => this.complete();
        document.body.appendChild(skipBtn);
    },
    
    // ==========================================
    // 단계 표시
    // ==========================================
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }
        
        const step = this.steps[stepIndex];
        
        // 조건 확인
        if (step.condition && !step.condition()) {
            // 조건 충족 대기
            setTimeout(() => this.showStep(stepIndex), 100);
            return;
        }
        
        // 딜레이
        if (step.delay) {
            setTimeout(() => this._displayHint(step), step.delay);
        } else {
            this._displayHint(step);
        }
    },
    
    _displayHint(step) {
        // 기존 힌트 제거
        this.clearHints();
        
        // 타겟 요소 찾기
        const targetEl = document.querySelector(step.highlight);
        if (!targetEl) {
            console.warn('[Tutorial] 타겟 없음:', step.highlight);
            return;
        }
        
        // 하이라이트 추가
        targetEl.classList.add('tutorial-highlight');
        
        // 힌트 박스 생성
        const hint = document.createElement('div');
        hint.className = `tutorial-hint arrow-${step.arrow || 'down'}`;
        hint.id = 'tutorial-hint';
        hint.textContent = step.message;
        document.body.appendChild(hint);
        
        // 위치 계산
        const rect = targetEl.getBoundingClientRect();
        
        switch (step.arrow) {
            case 'up':
                hint.style.left = `${rect.left + rect.width / 2}px`;
                hint.style.top = `${rect.top - 60}px`;
                hint.style.transform = 'translateX(-50%)';
                break;
            case 'down':
                hint.style.left = `${rect.left + rect.width / 2}px`;
                hint.style.top = `${rect.bottom + 15}px`;
                hint.style.transform = 'translateX(-50%)';
                break;
            case 'left':
                hint.style.left = `${rect.left - 20}px`;
                hint.style.top = `${rect.top + rect.height / 2}px`;
                hint.style.transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                hint.style.left = `${rect.right + 20}px`;
                hint.style.top = `${rect.top + rect.height / 2}px`;
                hint.style.transform = 'translateY(-50%)';
                break;
        }
        
        this.currentStep = this.steps.indexOf(step);
    },
    
    // ==========================================
    // 이벤트 트리거
    // ==========================================
    trigger(eventName) {
        if (!this.isActive || this.completed) return;
        
        const currentStep = this.steps[this.currentStep];
        if (!currentStep) return;
        
        // 다음 단계로
        const nextStepIndex = this.steps.findIndex(
            (s, i) => i > this.currentStep && s.trigger === eventName
        );
        
        if (nextStepIndex !== -1) {
            this.showStep(nextStepIndex);
        } else if (eventName === 'card-played' && this.currentStep === 0) {
            // 카드 플레이 후 턴 종료 힌트
            this.showStep(1);
        } else if (eventName === 'turn-ended' && this.currentStep >= 1) {
            // 턴 종료 후 완료
            this.complete();
        }
    },
    
    // ==========================================
    // 힌트 정리
    // ==========================================
    clearHints() {
        // 힌트 박스 제거
        const hint = document.getElementById('tutorial-hint');
        if (hint) hint.remove();
        
        // 하이라이트 제거
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    },
    
    // ==========================================
    // 튜토리얼 완료
    // ==========================================
    complete() {
        this.completed = true;
        this.isActive = false;
        
        // 정리
        this.clearHints();
        
        const skipBtn = document.getElementById('tutorial-skip');
        if (skipBtn) skipBtn.remove();
        
        // 저장
        localStorage.setItem('tutorial_completed', 'true');
        
        console.log('[Tutorial] 완료!');
    },
    
    // ==========================================
    // 리셋 (디버그용)
    // ==========================================
    reset() {
        localStorage.removeItem('tutorial_completed');
        this.completed = false;
        this.isActive = false;
        this.currentStep = 0;
        console.log('[Tutorial] 리셋됨');
    }
};

// ==========================================
// 자동 초기화
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    Tutorial.init();
});

// 전역 접근용
window.Tutorial = Tutorial;

