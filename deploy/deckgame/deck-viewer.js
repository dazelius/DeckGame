// ==========================================
// Shadow Deck - 덱 뷰어 시스템
// 드로우 덱 / 버린 카드 더미 확인
// ==========================================

const DeckViewer = {
    isOpen: false,
    currentView: null, // 'draw' | 'discard' | 'exhaust'
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.injectStyles();
        this.bindEvents();
        console.log('[DeckViewer] 덱 뷰어 초기화 완료');
    },
    
    // ==========================================
    // 이벤트 바인딩
    // ==========================================
    bindEvents() {
        // 드로우 덱 클릭
        const drawPile = document.getElementById('draw-pile');
        if (drawPile) {
            drawPile.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDrawPile();
            });
            drawPile.style.cursor = 'pointer';
        }
        
        // 버린 카드 더미 클릭
        const discardPile = document.getElementById('discard-pile');
        if (discardPile) {
            discardPile.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDiscardPile();
            });
            discardPile.style.cursor = 'pointer';
        }
    },
    
    // ==========================================
    // 드로우 덱 보기
    // ==========================================
    showDrawPile() {
        if (typeof gameState === 'undefined') return;
        
        const cards = gameState.drawPile || [];
        this.show('draw', cards, 'DRAW PILE', '');
    },
    
    // ==========================================
    // 버린 카드 더미 보기
    // ==========================================
    showDiscardPile() {
        if (typeof gameState === 'undefined') return;
        
        const cards = gameState.discardPile || [];
        this.show('discard', cards, 'DISCARD', '');
    },
    
    // ==========================================
    // 소멸 카드 더미 보기
    // ==========================================
    showExhaustPile() {
        if (typeof gameState === 'undefined') return;
        
        const cards = gameState.exhaustPile || [];
        this.show('exhaust', cards, 'EXHAUST', '');
    },
    
    // ==========================================
    // 뷰어 표시
    // ==========================================
    show(type, cards, title, icon) {
        this.isOpen = true;
        this.currentView = type;
        
        // 기존 뷰어 제거
        this.close(false);
        
        // 오버레이 생성
        const overlay = document.createElement('div');
        overlay.className = 'deck-viewer-overlay';
        overlay.id = 'deck-viewer';
        
        overlay.innerHTML = `
            <div class="deck-viewer-container">
                <div class="deck-viewer-header">
                    <div class="deck-viewer-title">
                        <span>${title}</span>
                        <span class="deck-viewer-count">${cards.length}</span>
                    </div>
                    <button class="deck-viewer-close" onclick="DeckViewer.close()">X</button>
                </div>
                
                <div class="deck-viewer-tabs">
                    <button class="deck-viewer-tab ${type === 'draw' ? 'active' : ''}" onclick="DeckViewer.showDrawPile()">
                        드로우 <span class="tab-count">${gameState.drawPile?.length || 0}</span>
                    </button>
                    <button class="deck-viewer-tab ${type === 'discard' ? 'active' : ''}" onclick="DeckViewer.showDiscardPile()">
                        버림 <span class="tab-count">${gameState.discardPile?.length || 0}</span>
                    </button>
                    <button class="deck-viewer-tab ${type === 'exhaust' ? 'active' : ''}" onclick="DeckViewer.showExhaustPile()">
                        소멸 <span class="tab-count">${gameState.exhaustPile?.length || 0}</span>
                    </button>
                </div>
                
                <div class="deck-viewer-cards">
                    ${cards.length > 0 ? this.renderCards(cards) : this.renderEmpty(type)}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 배경 클릭으로 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
        
        // ESC로 닫기
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    },
    
    // ==========================================
    // 카드 렌더링
    // ==========================================
    renderCards(cards) {
        // 카드를 타입별로 정렬
        const sortedCards = [...cards].sort((a, b) => {
            const typeOrder = { attack: 0, skill: 1, power: 2, curse: 3, status: 4 };
            const typeA = a.type?.id || a.type || 'skill';
            const typeB = b.type?.id || b.type || 'skill';
            return (typeOrder[typeA] || 5) - (typeOrder[typeB] || 5);
        });
        
        return sortedCards.map((card, index) => {
            const cardType = card.type?.id || card.type || 'skill';
            const isUpgraded = card.upgraded || card.name?.includes('+');
            
            return `
                <div class="deck-viewer-card ${cardType} ${isUpgraded ? 'upgraded' : ''}" 
                     onclick="DeckViewer.showCardDetail(${index})"
                     data-card-index="${index}">
                    <div class="viewer-card-cost">${card.cost ?? 0}</div>
                    <div class="viewer-card-name">${card.name || '???'}${isUpgraded ? '+' : ''}</div>
                </div>
            `;
        }).join('');
    },
    
    // ==========================================
    // 빈 상태 렌더링
    // ==========================================
    renderEmpty(type) {
        const messages = {
            draw: '비어있음',
            discard: '비어있음',
            exhaust: '비어있음'
        };
        
        return `
            <div class="deck-viewer-empty">
                <div class="empty-text">${messages[type] || '비어있음'}</div>
            </div>
        `;
    },
    
    // ==========================================
    // 기본 아이콘 (미사용)
    // ==========================================
    getDefaultIcon(type) {
        return '';
    },
    
    // ==========================================
    // 카드 상세 보기
    // ==========================================
    showCardDetail(index) {
        if (!this.currentView || typeof gameState === 'undefined') return;
        
        let cards;
        switch (this.currentView) {
            case 'draw': cards = gameState.drawPile; break;
            case 'discard': cards = gameState.discardPile; break;
            case 'exhaust': cards = gameState.exhaustPile; break;
            default: return;
        }
        
        const card = cards?.[index];
        if (!card) return;
        
        // 기존 팝업 제거
        const existingPopup = document.querySelector('.card-detail-popup');
        if (existingPopup) existingPopup.remove();
        
        // 카드 타입
        const cardType = card.type?.id || card.type || 'skill';
        const isUpgraded = card.upgraded || card.name?.includes('+');
        
        // 카드 상세 팝업
        const detail = document.createElement('div');
        detail.className = 'card-detail-popup';
        detail.innerHTML = `
            <div class="detail-row">
                <span class="detail-cost">${card.cost ?? 0}</span>
                <span class="detail-name">${card.name || '???'}${isUpgraded ? ' <span class="upgraded-mark">+</span>' : ''}</span>
            </div>
            <div class="detail-desc">${card.description || '효과 없음'}</div>
            <div class="detail-footer">
                <span class="detail-type type-${cardType}">${this.getTypeName(cardType)}</span>
            </div>
        `;
        
        // 클릭하면 닫기
        detail.addEventListener('click', (e) => {
            e.stopPropagation();
            detail.remove();
        });
        
        document.body.appendChild(detail);
        
        // 3초 후 자동 제거
        if (this.detailTimeout) clearTimeout(this.detailTimeout);
        this.detailTimeout = setTimeout(() => {
            if (detail.parentNode) {
                detail.classList.add('fade-out');
                setTimeout(() => detail.remove(), 200);
            }
        }, 3000);
    },
    
    // ==========================================
    // 타입 이름
    // ==========================================
    getTypeName(type) {
        const names = {
            attack: '공격',
            skill: '스킬',
            power: '파워',
            curse: '저주',
            status: '상태이상'
        };
        return names[type] || type;
    },
    
    // ==========================================
    // 닫기
    // ==========================================
    close(animate = true) {
        const overlay = document.getElementById('deck-viewer');
        if (!overlay) return;
        
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
        
        overlay.remove();
        
        this.isOpen = false;
        this.currentView = null;
    },
    
    // ==========================================
    // 스타일 주입 (Dark Souls Style)
    // ==========================================
    injectStyles() {
        if (document.getElementById('deck-viewer-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'deck-viewer-styles';
        style.textContent = `
            /* ==========================================
               Dark Souls Style - Deck Viewer
               ========================================== */
            
            /* 오버레이 */
            .deck-viewer-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.85);
                z-index: 9000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* 컨테이너 */
            .deck-viewer-container {
                background: #0d0d0d;
                border: 2px solid #b8a068;
                width: 90%;
                max-width: 700px;
                max-height: 75vh;
                display: flex;
                flex-direction: column;
                position: relative;
            }
            
            /* 헤더 */
            .deck-viewer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #333;
            }
            
            .deck-viewer-title {
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #b8a068;
                letter-spacing: 2px;
            }
            
            .deck-viewer-count {
                font-size: 1rem;
                color: #666;
            }
            
            .deck-viewer-close {
                background: transparent;
                border: 1px solid #444;
                color: #888;
                cursor: pointer;
                font-size: 1.2rem;
                padding: 8px 12px;
            }
            
            .deck-viewer-close:hover {
                color: #fff;
                border-color: #b8a068;
            }
            
            /* 탭 */
            .deck-viewer-tabs {
                display: flex;
                border-bottom: 1px solid #333;
            }
            
            .deck-viewer-tab {
                flex: 1;
                padding: 14px 12px;
                background: transparent;
                border: none;
                border-bottom: 3px solid transparent;
                color: #666;
                cursor: pointer;
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .deck-viewer-tab:hover {
                color: #aaa;
                background: #111;
            }
            
            .deck-viewer-tab.active {
                color: #b8a068;
                border-bottom-color: #b8a068;
                background: #151515;
            }
            
            .tab-count {
                font-size: 0.9rem;
            }
            
            /* 카드 리스트 */
            .deck-viewer-cards {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            /* 스크롤바 */
            .deck-viewer-cards::-webkit-scrollbar {
                width: 8px;
            }
            
            .deck-viewer-cards::-webkit-scrollbar-track {
                background: #111;
            }
            
            .deck-viewer-cards::-webkit-scrollbar-thumb {
                background: #444;
            }
            
            /* 개별 카드 */
            .deck-viewer-card {
                background: #111;
                border: 1px solid #222;
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
            }
            
            .deck-viewer-card:hover {
                background: #1a1a1a;
                border-color: #b8a068;
            }
            
            .deck-viewer-card.attack { border-left: 3px solid #c75050; }
            .deck-viewer-card.skill { border-left: 3px solid #5080c7; }
            .deck-viewer-card.power { border-left: 3px solid #8050c7; }
            .deck-viewer-card.curse { border-left: 3px solid #505050; }
            
            .deck-viewer-card.upgraded .viewer-card-name {
                color: #6abe6a;
            }
            
            .viewer-card-cost {
                width: 28px;
                height: 28px;
                background: #1a1a1a;
                border: 1px solid #b8a068;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                color: #b8a068;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            .viewer-card-name {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.1rem;
                color: #ccc;
                flex: 1;
            }
            
            .deck-viewer-card:hover .viewer-card-name {
                color: #fff;
            }
            
            /* 빈 상태 */
            .deck-viewer-empty {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
            }
            
            .empty-text {
                font-size: 1.1rem;
                color: #666;
            }
            
            /* 카드 상세 팝업 */
            .card-detail-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #0a0a0a;
                border: 2px solid #b8a068;
                padding: 20px 24px;
                z-index: 99999;
                min-width: 320px;
                max-width: 400px;
                cursor: pointer;
            }
            
            .card-detail-popup.fade-out {
                opacity: 0;
            }
            
            .detail-row {
                display: flex;
                align-items: center;
                gap: 14px;
                margin-bottom: 14px;
                padding-bottom: 14px;
                border-bottom: 1px solid #333;
            }
            
            .detail-cost {
                width: 36px;
                height: 36px;
                background: #b8a068;
                color: #0a0a0a;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                font-weight: bold;
            }
            
            .detail-name {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.3rem;
                color: #fff;
            }
            
            .upgraded-mark {
                color: #4ade80;
            }
            
            .detail-desc {
                font-size: 1.1rem;
                color: #bbb;
                line-height: 1.7;
                margin-bottom: 14px;
            }
            
            .detail-footer {
                text-align: right;
            }
            
            .detail-type {
                font-size: 0.9rem;
                color: #888;
            }
            
            .detail-type.type-attack { color: #c75050; }
            .detail-type.type-skill { color: #5080c7; }
            .detail-type.type-power { color: #8050c7; }
            .detail-type.type-curse { color: #666; }
            
            /* 반응형 */
            @media (max-width: 600px) {
                .deck-viewer-container {
                    width: 95%;
                    max-height: 85vh;
                }
                
                .deck-viewer-tab {
                    font-size: 0.9rem;
                    padding: 12px 8px;
                }
                
                .viewer-card-name {
                    font-size: 1rem;
                }
                
                .card-detail-popup {
                    min-width: 280px;
                    max-width: 350px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 등록
window.DeckViewer = DeckViewer;

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DeckViewer.init());
} else {
    DeckViewer.init();
}

console.log('[DeckViewer] 덱 뷰어 시스템 로드됨');

