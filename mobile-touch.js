// ==========================================
// Mobile Touch System
// 모바일 터치 인터랙션 시스템 (가로 모드 전용)
// ==========================================

const MobileTouchSystem = {
    isMobile: false,
    selectedCardIndex: null,
    selectedCardEl: null,
    rotateOverlay: null,
    
    // 초기화
    init() {
        // 모바일 감지
        this.isMobile = this.detectMobile();
        
        if (this.isMobile) {
            console.log('[Mobile] 모바일 디바이스 감지됨 (가로 모드 전용)');
            this.setupMobileUI();
            this.setupTouchEvents();
            this.setupOrientationCheck();
        }
    },
    
    // 모바일 디바이스 감지
    detectMobile() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches ||
            window.innerWidth <= 900
        );
    },
    
    // 화면 방향 체크
    setupOrientationCheck() {
        this.checkOrientation();
        window.addEventListener('orientationchange', () => this.checkOrientation());
        window.addEventListener('resize', () => this.checkOrientation());
    },
    
    // 방향 확인 및 안내 표시
    checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        const isSmallScreen = window.innerWidth <= 480;  // 더 작은 화면에서만
        const isVerySmallHeight = window.innerHeight < 500;  // 높이가 너무 작으면
        
        // 세로 모드이고 너무 작은 화면일 때만 회전 안내
        // 일반 세로 모드는 지원함
        if (isPortrait && isSmallScreen && isVerySmallHeight) {
            this.showRotateOverlay();
        } else {
            this.hideRotateOverlay();
        }
    },
    
    // 회전 안내 오버레이 표시
    showRotateOverlay() {
        if (this.rotateOverlay) return;
        
        this.rotateOverlay = document.createElement('div');
        this.rotateOverlay.className = 'rotate-overlay';
        this.rotateOverlay.innerHTML = `
            <div class="rotate-icon">📱</div>
            <div class="rotate-text">Rotate to Landscape</div>
            <div class="rotate-subtext">가로 모드로 전환해주세요</div>
        `;
        document.body.appendChild(this.rotateOverlay);
    },
    
    // 회전 안내 오버레이 숨김
    hideRotateOverlay() {
        if (this.rotateOverlay) {
            this.rotateOverlay.remove();
            this.rotateOverlay = null;
        }
    },
    
    // 모바일 UI 설정
    setupMobileUI() {
        document.body.classList.add('mobile-device');
        
        // 스크롤 완전 방지
        this.preventScroll();
        
        // 카드 사용 안내 UI 추가
        const guideEl = document.createElement('div');
        guideEl.id = 'mobile-card-guide';
        guideEl.className = 'mobile-card-guide hidden';
        guideEl.innerHTML = '<span class="guide-text">Select target</span>';
        document.body.appendChild(guideEl);
        
        // 선택 취소 버튼
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'mobile-cancel-btn';
        cancelBtn.className = 'mobile-cancel-btn hidden';
        cancelBtn.textContent = '✕ Cancel';
        cancelBtn.addEventListener('click', () => this.cancelSelection());
        document.body.appendChild(cancelBtn);
        
        // CSS 추가
        this.injectMobileStyles();
    },
    
    // 스크롤 완전 방지
    preventScroll() {
        // 터치 스크롤 방지
        document.body.addEventListener('touchmove', (e) => {
            // 모달이나 스크롤 가능한 요소 제외
            if (!e.target.closest('.modal-content, .log-entries')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // 더블 탭 줌 방지
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        // 핀치 줌 방지
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
    },
    
    // 모바일 전용 CSS
    injectMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 모바일 디바이스 클래스 */
            .mobile-device .card {
                cursor: pointer;
            }
            
            /* 선택된 카드 */
            .card.mobile-selected {
                transform: translateY(-30px) scale(1.15) !important;
                box-shadow: 0 15px 40px rgba(251, 191, 36, 0.6), 
                            0 0 30px rgba(251, 191, 36, 0.4) !important;
                border-color: #fbbf24 !important;
                z-index: 100 !important;
                animation: mobileSelectedPulse 1s ease-in-out infinite;
            }
            
            @keyframes mobileSelectedPulse {
                0%, 100% { 
                    box-shadow: 0 15px 40px rgba(251, 191, 36, 0.6), 
                                0 0 30px rgba(251, 191, 36, 0.4);
                }
                50% { 
                    box-shadow: 0 20px 50px rgba(251, 191, 36, 0.8), 
                                0 0 50px rgba(251, 191, 36, 0.6);
                }
            }
            
            /* 타겟 가이드 */
            .mobile-card-guide {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: #fbbf24;
                padding: 15px 30px;
                border-radius: 30px;
                border: 2px solid #fbbf24;
                font-size: 1.1rem;
                font-weight: bold;
                z-index: 9999;
                animation: guideAppear 0.3s ease-out;
                pointer-events: none;
            }
            
            @keyframes guideAppear {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            
            .mobile-card-guide.hidden {
                display: none;
            }
            
            /* 취소 버튼 */
            .mobile-cancel-btn {
                position: fixed;
                bottom: 260px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(239, 68, 68, 0.9);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 1rem;
                font-weight: bold;
                z-index: 9998;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .mobile-cancel-btn:active {
                transform: translateX(-50%) scale(0.95);
                background: rgba(220, 38, 38, 1);
            }
            
            .mobile-cancel-btn.hidden {
                display: none;
            }
            
            /* 타겟 가능 표시 */
            .mobile-device .enemy-unit.mobile-targetable {
                animation: targetablePulse 1s ease-in-out infinite;
                cursor: pointer;
            }
            
            @keyframes targetablePulse {
                0%, 100% {
                    box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
                }
                50% {
                    box-shadow: 0 0 40px rgba(34, 197, 94, 0.8);
                }
            }
            
            .mobile-device .player-side.mobile-targetable {
                animation: selfTargetablePulse 1s ease-in-out infinite;
                cursor: pointer;
            }
            
            @keyframes selfTargetablePulse {
                0%, 100% {
                    filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.5));
                }
                50% {
                    filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.8));
                }
            }
            
            /* 모바일 가로 모드 */
            @media (max-width: 900px) and (orientation: landscape) {
                .mobile-cancel-btn {
                    bottom: 140px;
                    padding: 8px 16px;
                    font-size: 0.85rem;
                }
                
                .mobile-card-guide {
                    padding: 10px 20px;
                    font-size: 0.9rem;
                }
            }
            
            @media (max-height: 400px) and (orientation: landscape) {
                .mobile-cancel-btn {
                    bottom: 110px;
                    padding: 6px 12px;
                    font-size: 0.75rem;
                }
                
                .mobile-card-guide {
                    padding: 8px 16px;
                    font-size: 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    // 터치 이벤트 설정
    setupTouchEvents() {
        // 카드 탭 이벤트
        document.addEventListener('click', (e) => {
            const cardEl = e.target.closest('.card');
            
            // 카드 탭
            if (cardEl && !cardEl.classList.contains('disabled') && !cardEl.classList.contains('unplayable')) {
                e.preventDefault();
                e.stopPropagation();
                this.onCardTap(cardEl);
                return;
            }
            
            // 적 탭 (카드 선택 상태에서)
            if (this.selectedCardIndex !== null) {
                const enemyEl = e.target.closest('.enemy-unit');
                if (enemyEl && !enemyEl.classList.contains('dead')) {
                    e.preventDefault();
                    this.onTargetTap('enemy', enemyEl);
                    return;
                }
                
                // 플레이어 탭
                const playerEl = e.target.closest('#player');
                if (playerEl) {
                    e.preventDefault();
                    this.onTargetTap('self', playerEl);
                    return;
                }
                
                // 다른 곳 탭하면 선택 취소
                if (!cardEl) {
                    this.cancelSelection();
                }
            }
        }, true);
    },
    
    // 카드 탭 처리
    onCardTap(cardEl) {
        if (!gameState.isPlayerTurn) return;
        
        const index = parseInt(cardEl.dataset.index);
        const card = gameState.hand[index];
        
        if (!card) return;
        if (card.cost > gameState.player.energy) return;
        
        // 이미 선택된 카드 다시 탭하면 선택 해제
        if (this.selectedCardIndex === index) {
            this.cancelSelection();
            return;
        }
        
        // 새 카드 선택
        this.selectCard(index, cardEl, card);
    },
    
    // 카드 선택
    selectCard(index, cardEl, card) {
        // 이전 선택 해제
        this.clearSelection();
        
        this.selectedCardIndex = index;
        this.selectedCardEl = cardEl;
        
        cardEl.classList.add('mobile-selected');
        
        // 타겟 표시
        const targetType = CardDragSystem.getCardTarget(card);
        this.highlightTargets(targetType);
        
        // UI 표시
        document.getElementById('mobile-card-guide')?.classList.remove('hidden');
        document.getElementById('mobile-cancel-btn')?.classList.remove('hidden');
    },
    
    // 타겟 탭 처리
    onTargetTap(targetType, targetEl) {
        if (this.selectedCardIndex === null) return;
        
        const card = gameState.hand[this.selectedCardIndex];
        const cardTargetType = CardDragSystem.getCardTarget(card);
        
        // 적 공격
        if (targetType === 'enemy' && cardTargetType === 'enemy') {
            const enemyIndex = parseInt(targetEl.dataset.index);
            if (!isNaN(enemyIndex)) {
                selectEnemy(enemyIndex);
            }
            this.executeCard();
            return;
        }
        
        // 자기 자신에게 사용
        if (targetType === 'self' && cardTargetType === 'self') {
            this.executeCard();
            return;
        }
    },
    
    // 카드 실행
    executeCard() {
        if (this.selectedCardIndex === null) return;
        
        const index = this.selectedCardIndex;
        this.cancelSelection();
        
        // 카드 사용
        playCard(index);
    },
    
    // 선택 취소
    cancelSelection() {
        this.clearSelection();
        
        document.getElementById('mobile-card-guide')?.classList.add('hidden');
        document.getElementById('mobile-cancel-btn')?.classList.add('hidden');
    },
    
    // 선택 초기화
    clearSelection() {
        if (this.selectedCardEl) {
            this.selectedCardEl.classList.remove('mobile-selected');
        }
        
        this.selectedCardIndex = null;
        this.selectedCardEl = null;
        
        this.clearTargetHighlights();
    },
    
    // 타겟 하이라이트
    highlightTargets(targetType) {
        if (targetType === 'enemy') {
            const container = document.getElementById('enemies-container');
            if (container) {
                container.querySelectorAll('.enemy-unit').forEach(el => {
                    if (!el.classList.contains('dead')) {
                        el.classList.add('mobile-targetable');
                    }
                });
            }
        } else if (targetType === 'self') {
            const playerEl = document.querySelector('.player-side');
            if (playerEl) {
                playerEl.classList.add('mobile-targetable');
            }
        }
    },
    
    // 타겟 하이라이트 제거
    clearTargetHighlights() {
        document.querySelectorAll('.mobile-targetable').forEach(el => {
            el.classList.remove('mobile-targetable');
        });
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    MobileTouchSystem.init();
});

// 윈도우 리사이즈 시 모바일 감지 업데이트
window.addEventListener('resize', () => {
    const wasMobile = MobileTouchSystem.isMobile;
    MobileTouchSystem.isMobile = MobileTouchSystem.detectMobile();
    
    if (MobileTouchSystem.isMobile && !wasMobile) {
        MobileTouchSystem.setupMobileUI();
        MobileTouchSystem.setupTouchEvents();
        document.body.classList.add('mobile-device');
    } else if (!MobileTouchSystem.isMobile && wasMobile) {
        document.body.classList.remove('mobile-device');
    }
});

console.log('[MobileTouchSystem] 로드 완료');

