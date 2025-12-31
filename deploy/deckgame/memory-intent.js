// ==========================================
// 메모리 의도 시스템
// 메모리 레벨이 낮을수록 적 의도가 감춰짐
// ==========================================

const MemoryIntent = {
    // 설정
    config: {
        // 레벨별 의도 감춤 확률 (0 = 0%, 1 = 100%)
        // 메모리 레벨이 높을수록 감춰짐 (환각/광기)
        hideChance: {
            0: 0,      // 0% 감춤 (정상)
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0.1,    // 10% 감춤 시작
            6: 0.2,    // 20%
            7: 0.35,   // 35%
            8: 0.5,    // 50%
            9: 0.7,    // 70%
            10: 0.85   // 85% 감춤 (광기)
        }
    },
    
    // 절규하는 메시지들
    hiddenMessages: [
        // 공포
        '...도망쳐',
        '죽여줘...',
        '아파...',
        '...보고있어',
        '뒤를봐',
        // 불안
        '왜...?',
        '...숨어',
        '끝이야',
        '늦었어',
        '...피가',
        // 광기
        '■■■',
        '...찢어',
        '같이가자',
        'RUN',
        'HELP',
        // 절규
        '살려...',
        '...안돼',
        '제발...',
        '...너도',
        '곧...'
    ],
    
    // 현재 감춰진 적들의 인덱스
    hiddenIntents: new Set(),
    
    // 원본 의도 저장
    originalIntents: new Map(),
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.injectStyles();
        console.log('[MemoryIntent] 의도 감춤 시스템 초기화');
    },
    
    // ==========================================
    // 턴 시작 시 의도 감춤 결정
    // ==========================================
    onTurnStart() {
        this.hiddenIntents.clear();
        this.originalIntents.clear();
        
        // 기존 메시지 루프 정지
        this.messageLoops.forEach((_, index) => this.stopMessageLoop(index));
        
        // 현재 메모리 레벨
        const memoryLevel = typeof MemoryVisual !== 'undefined' ? MemoryVisual.level : 0;
        const hideChance = this.config.hideChance[memoryLevel] ?? 0;
        
        // 레벨 5 미만이면 감춤 없음
        if (memoryLevel < 5) {
            return;
        }
        
        // 각 적에 대해 의도 감춤 여부 결정
        if (typeof gameState !== 'undefined' && gameState.enemies) {
            gameState.enemies.forEach((enemy, index) => {
                if (!enemy || enemy.hp <= 0) return;
                
                // 확률 체크 - 확률 성공하면 감춤
                if (Math.random() < hideChance) {
                    this.hiddenIntents.add(index);
                }
            });
        }
        
        // 약간의 딜레이 후 UI 업데이트 (DOM이 업데이트된 후)
        setTimeout(() => {
            this.updateAllIntents();
        }, 100);
        
        if (this.hiddenIntents.size > 0) {
            console.log(`[MemoryIntent] 감춰진 의도: ${this.hiddenIntents.size}개 (레벨 ${memoryLevel}, 감춤 확률 ${Math.round(hideChance * 100)}%)`);
        }
    },
    
    // ==========================================
    // 의도가 감춰졌는지 확인
    // ==========================================
    isIntentHidden(enemyIndex) {
        return this.hiddenIntents.has(enemyIndex);
    },
    
    // ==========================================
    // 모든 적 의도 업데이트
    // ==========================================
    updateAllIntents() {
        // 다중 적 시스템
        document.querySelectorAll('.enemy-unit').forEach((enemyEl) => {
            const index = parseInt(enemyEl.dataset.index);
            if (isNaN(index)) return;
            
            const intentDisplay = enemyEl.querySelector('.enemy-intent-display');
            if (!intentDisplay) return;
            
            if (this.isIntentHidden(index)) {
                this.hideIntentElement(intentDisplay, index);
            } else {
                this.showIntentElement(intentDisplay, index);
            }
        });
    },
    
    // ==========================================
    // 의도 숨기기
    // ==========================================
    hideIntentElement(intentDisplay, index) {
        if (!intentDisplay) return;
        
        // 원본 저장
        if (!this.originalIntents.has(index)) {
            this.originalIntents.set(index, intentDisplay.innerHTML);
        }
        
        // 랜덤 절규 메시지 선택
        const message = this.hiddenMessages[Math.floor(Math.random() * this.hiddenMessages.length)];
        
        // 감춰진 상태로 교체 (절규 메시지)
        intentDisplay.innerHTML = `
            <span class="intent-hidden-display">
                <span class="intent-hidden-text">${message}</span>
            </span>
        `;
        
        intentDisplay.classList.add('intent-is-hidden');
        
        // 메시지 변경 루프 (계속 바뀜)
        this.startMessageLoop(intentDisplay, index);
    },
    
    // 메시지 변경 루프
    messageLoops: new Map(),
    
    startMessageLoop(intentDisplay, index) {
        // 기존 루프 정지
        this.stopMessageLoop(index);
        
        const loop = setInterval(() => {
            if (!this.hiddenIntents.has(index)) {
                this.stopMessageLoop(index);
                return;
            }
            
            const textEl = intentDisplay.querySelector('.intent-hidden-text');
            if (textEl) {
                // 페이드 아웃
                textEl.classList.add('fading');
                
                setTimeout(() => {
                    // 새 메시지
                    textEl.textContent = this.hiddenMessages[Math.floor(Math.random() * this.hiddenMessages.length)];
                    textEl.classList.remove('fading');
                }, 300);
            }
        }, 2000 + Math.random() * 1500);
        
        this.messageLoops.set(index, loop);
    },
    
    stopMessageLoop(index) {
        if (this.messageLoops.has(index)) {
            clearInterval(this.messageLoops.get(index));
            this.messageLoops.delete(index);
        }
    },
    
    // ==========================================
    // 의도 보이기
    // ==========================================
    showIntentElement(intentDisplay, index) {
        if (!intentDisplay) return;
        
        // 메시지 루프 정지
        this.stopMessageLoop(index);
        
        // 원본 복원
        if (this.originalIntents.has(index)) {
            intentDisplay.innerHTML = this.originalIntents.get(index);
            this.originalIntents.delete(index);
        }
        
        intentDisplay.classList.remove('intent-is-hidden');
    },
    
    // ==========================================
    // 특정 적 의도 강제 공개
    // ==========================================
    revealIntent(enemyIndex) {
        this.hiddenIntents.delete(enemyIndex);
        
        const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
        if (enemyEl) {
            const intentDisplay = enemyEl.querySelector('.enemy-intent-display');
            if (intentDisplay) {
                this.showIntentElement(intentDisplay, enemyIndex);
                
                // 공개 효과
                intentDisplay.classList.add('intent-revealed');
                setTimeout(() => {
                    intentDisplay.classList.remove('intent-revealed');
                }, 500);
            }
        }
        
        console.log(`[MemoryIntent] 적 ${enemyIndex} 의도 공개`);
    },
    
    // ==========================================
    // 모든 적 의도 공개
    // ==========================================
    revealAllIntents() {
        // 원본 복원
        document.querySelectorAll('.enemy-unit').forEach((enemyEl) => {
            const index = parseInt(enemyEl.dataset.index);
            if (isNaN(index)) return;
            
            const intentDisplay = enemyEl.querySelector('.enemy-intent-display');
            if (intentDisplay) {
                this.showIntentElement(intentDisplay, index);
                
                // 공개 효과
                intentDisplay.classList.add('intent-revealed');
                setTimeout(() => {
                    intentDisplay.classList.remove('intent-revealed');
                }, 500);
            }
        });
        
        this.hiddenIntents.clear();
        console.log('[MemoryIntent] 모든 의도 공개');
    },
    
    // ==========================================
    // 모든 적 의도 감추기 (디버그용)
    // ==========================================
    hideAllIntents() {
        if (typeof gameState === 'undefined' || !gameState.enemies) return;
        
        // 모든 원본 저장 먼저
        document.querySelectorAll('.enemy-unit').forEach((enemyEl) => {
            const index = parseInt(enemyEl.dataset.index);
            if (isNaN(index)) return;
            
            const intentDisplay = enemyEl.querySelector('.enemy-intent-display');
            if (intentDisplay && !this.originalIntents.has(index)) {
                this.originalIntents.set(index, intentDisplay.innerHTML);
            }
        });
        
        // 모든 적 감추기
        gameState.enemies.forEach((enemy, index) => {
            if (enemy && enemy.hp > 0) {
                this.hiddenIntents.add(index);
            }
        });
        
        this.updateAllIntents();
        console.log('[MemoryIntent] 모든 의도 감춤');
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('memory-intent-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'memory-intent-styles';
        style.textContent = `
            /* 감춰진 의도 표시 - 절규 스타일 */
            .intent-hidden-display {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 6px 14px;
                background: linear-gradient(135deg, rgba(40, 0, 0, 0.9) 0%, rgba(60, 20, 20, 0.85) 100%);
                border: 1px solid rgba(139, 0, 0, 0.6);
                border-radius: 4px;
                animation: intentScream 3s ease-in-out infinite;
                position: relative;
                overflow: hidden;
            }
            
            .intent-hidden-display::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, transparent 0%, rgba(139, 0, 0, 0.2) 50%, transparent 100%);
                animation: intentScanline 2s linear infinite;
            }
            
            @keyframes intentScanline {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .intent-hidden-text {
                font-family: 'Cinzel', serif;
                font-size: 0.95rem;
                color: #c44;
                text-shadow: 
                    0 0 5px rgba(200, 50, 50, 0.8),
                    0 0 10px rgba(139, 0, 0, 0.5);
                letter-spacing: 1px;
                animation: intentTextPulse 1.5s ease-in-out infinite;
                transition: opacity 0.3s ease;
            }
            
            .intent-hidden-text.fading {
                opacity: 0;
                transform: scale(0.9);
            }
            
            @keyframes intentScream {
                0%, 100% { 
                    transform: scale(1);
                    box-shadow: 
                        0 0 10px rgba(139, 0, 0, 0.4),
                        inset 0 0 15px rgba(0, 0, 0, 0.5);
                }
                50% { 
                    transform: scale(1.02);
                    box-shadow: 
                        0 0 20px rgba(139, 0, 0, 0.6),
                        inset 0 0 20px rgba(0, 0, 0, 0.4);
                }
            }
            
            @keyframes intentTextPulse {
                0%, 100% { 
                    opacity: 0.8;
                    text-shadow: 
                        0 0 5px rgba(200, 50, 50, 0.8),
                        0 0 10px rgba(139, 0, 0, 0.5);
                }
                50% { 
                    opacity: 1;
                    text-shadow: 
                        0 0 8px rgba(255, 80, 80, 0.9),
                        0 0 15px rgba(200, 50, 50, 0.7),
                        0 0 25px rgba(139, 0, 0, 0.4);
                }
            }
            
            /* 감춰진 상태 마커 */
            .intent-is-hidden {
                position: relative;
            }
            
            .intent-is-hidden::before {
                content: '';
                position: absolute;
                inset: -8px;
                background: radial-gradient(ellipse at center, rgba(80, 0, 0, 0.3) 0%, transparent 70%);
                pointer-events: none;
                animation: intentBloodMist 4s ease-in-out infinite;
                border-radius: 8px;
            }
            
            @keyframes intentBloodMist {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.1); }
            }
            
            /* 의도 공개 효과 */
            .intent-revealed {
                animation: intentRevealFlash 0.5s ease-out !important;
            }
            
            @keyframes intentRevealFlash {
                0% {
                    transform: scale(1.5);
                    filter: brightness(2) drop-shadow(0 0 20px gold);
                }
                100% {
                    transform: scale(1);
                    filter: brightness(1) drop-shadow(0 0 0 transparent);
                }
            }
            
            /* 랜덤 떨림 (일부 메시지) */
            .intent-hidden-display:nth-child(odd) .intent-hidden-text {
                animation: intentTextPulse 1.5s ease-in-out infinite, intentTremble 0.1s linear infinite;
            }
            
            @keyframes intentTremble {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-1px); }
                75% { transform: translateX(1px); }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// ==========================================
// 전역 등록
// ==========================================
window.MemoryIntent = MemoryIntent;

// ==========================================
// 초기화
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    MemoryIntent.init();
});

console.log('[MemoryIntent] 의도 감춤 시스템 로드됨');
