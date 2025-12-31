// ==========================================
// Shadow Deck - 유물 UI 시스템
// ==========================================

const RelicUI = {
    container: null,
    tooltip: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[RelicUI] Initializing...');
        this.createContainer();
        this.createTooltip();
        console.log('[RelicUI] Initialized, container:', this.container ? 'OK' : 'FAIL');
    },
    
    // ==========================================
    // 유물 컨테이너 생성
    // ==========================================
    createContainer() {
        // 기존 컨테이너 제거
        const existing = document.getElementById('relic-display');
        if (existing) {
            existing.remove();
        }
        
        // 새 컨테이너 생성 (헤더 없이 아이콘만)
        this.container = document.createElement('div');
        this.container.id = 'relic-display';
        this.container.className = 'relic-display';
        this.container.innerHTML = `<div class="relic-list"></div>`;
        
        // body에 직접 추가 (z-index로 위에 표시)
        document.body.appendChild(this.container);
        
        console.log('[RelicUI] Container created and appended to body');
    },
    
    // ==========================================
    // 툴팁 생성
    // ==========================================
    createTooltip() {
        // 기존 툴팁 제거
        const existing = document.getElementById('relic-tooltip');
        if (existing) existing.remove();
        
        // 새 툴팁 생성
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'relic-tooltip';
        this.tooltip.className = 'relic-tooltip';
        this.tooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-icon"></span>
                <span class="tooltip-name"></span>
            </div>
            <div class="tooltip-rarity"></div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-description"></div>
        `;
        
        document.body.appendChild(this.tooltip);
    },
    
    // ==========================================
    // 유물 목록 업데이트
    // ==========================================
    updateRelicList(relics) {
        // 컨테이너가 없으면 생성
        if (!this.container || !document.body.contains(this.container)) {
            this.createContainer();
        }
        
        const listEl = this.container.querySelector('.relic-list');
        if (!listEl) {
            console.error('[RelicUI] relic-list not found');
            return;
        }
        
        console.log('[RelicUI] Updating list with', relics ? relics.length : 0, 'relics');
        
        if (!relics || relics.length === 0) {
            const isKr = typeof LanguageSystem !== 'undefined' && LanguageSystem.currentLang === 'kr';
            listEl.innerHTML = `<div class="relic-empty">${isKr ? '없음' : 'None'}</div>`;
            return;
        }
        
        listEl.innerHTML = relics.map((relic, index) => {
            const iconContent = relic.isImageIcon 
                ? `<img src="${relic.icon}" alt="${relic.name}" class="relic-icon-img">`
                : relic.icon;
            return `
                <div class="relic-slot" 
                     data-relic-id="${relic.id}"
                     data-relic-index="${index}">
                    <div class="relic-slot-bg"></div>
                    <div class="relic-slot-icon">${iconContent}</div>
                    <div class="relic-slot-shine"></div>
                </div>
            `;
        }).join('');
        
        // 이벤트 리스너 추가
        listEl.querySelectorAll('.relic-slot').forEach(slot => {
            slot.addEventListener('mouseenter', (e) => this.showTooltip(e, slot));
            slot.addEventListener('mouseleave', () => this.hideTooltip());
            slot.addEventListener('mousemove', (e) => this.moveTooltip(e));
        });
        
        console.log('[RelicUI] List updated, slots:', listEl.querySelectorAll('.relic-slot').length);
    },
    
    // ==========================================
    // 툴팁 표시
    // ==========================================
    showTooltip(event, slotEl) {
        const relicId = slotEl.dataset.relicId;
        const relic = relicDatabase[relicId];
        
        if (!relic) return;
        
        // 툴팁 내용 업데이트 (언어 시스템 적용)
        const name = typeof LanguageSystem !== 'undefined' 
            ? LanguageSystem.getName(relic) : relic.name;
        const desc = typeof LanguageSystem !== 'undefined' 
            ? LanguageSystem.getDescription(relic) : relic.description;
        
        // 아이콘 (이미지 또는 텍스트)
        const tooltipIcon = this.tooltip.querySelector('.tooltip-icon');
        if (relic.isImageIcon) {
            tooltipIcon.innerHTML = `<img src="${relic.icon}" alt="${name}" class="tooltip-icon-img">`;
        } else {
            tooltipIcon.textContent = relic.icon;
        }
        this.tooltip.querySelector('.tooltip-name').textContent = name;
        this.tooltip.querySelector('.tooltip-rarity').textContent = this.getRarityText(relic.rarity);
        this.tooltip.querySelector('.tooltip-rarity').className = `tooltip-rarity ${relic.rarity}`;
        this.tooltip.querySelector('.tooltip-description').textContent = desc;
        
        // 위치 설정
        this.moveTooltip(event);
        
        // 표시
        this.tooltip.classList.add('visible');
    },
    
    // ==========================================
    // 툴팁 이동
    // ==========================================
    moveTooltip(event) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const padding = 15;
        
        let x = event.clientX + padding;
        let y = event.clientY + padding;
        
        // 화면 오른쪽 넘어가면 왼쪽에 표시
        if (x + tooltipRect.width > window.innerWidth - padding) {
            x = event.clientX - tooltipRect.width - padding;
        }
        
        // 화면 아래 넘어가면 위에 표시
        if (y + tooltipRect.height > window.innerHeight - padding) {
            y = event.clientY - tooltipRect.height - padding;
        }
        
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    },
    
    // ==========================================
    // 툴팁 숨기기
    // ==========================================
    hideTooltip() {
        this.tooltip.classList.remove('visible');
    },
    
    // ==========================================
    // 희귀도 텍스트
    // ==========================================
    getRarityText(rarity) {
        const isKr = typeof LanguageSystem !== 'undefined' && LanguageSystem.currentLang === 'kr';
        
        const rarityMapEn = {
            'starter': 'Starter',
            'common': 'Common',
            'uncommon': 'Uncommon',
            'rare': 'Rare',
            'legendary': 'Legendary'
        };
        
        const rarityMapKr = {
            'starter': '시작',
            'common': '일반',
            'uncommon': '고급',
            'rare': '희귀',
            'legendary': '전설'
        };
        
        const map = isKr ? rarityMapKr : rarityMapEn;
        return map[rarity] || rarity;
    },
    
    // ==========================================
    // 유물 획득 애니메이션
    // ==========================================
    showAcquireAnimation(relic) {
        const isKr = typeof LanguageSystem !== 'undefined' && LanguageSystem.currentLang === 'kr';
        const name = typeof LanguageSystem !== 'undefined' 
            ? LanguageSystem.getName(relic) : relic.name;
        const desc = typeof LanguageSystem !== 'undefined' 
            ? LanguageSystem.getDescription(relic) : relic.description;
        const label = isKr ? '유물 획득!' : 'Relic Acquired!';
        
        // 아이콘 (이미지 또는 텍스트)
        const iconContent = relic.isImageIcon 
            ? `<img src="${relic.icon}" alt="${name}" class="acquire-icon-img">`
            : relic.icon;
        
        // 화면 중앙 팝업
        const popup = document.createElement('div');
        popup.className = 'relic-acquire-popup';
        popup.innerHTML = `
            <div class="acquire-glow"></div>
            <div class="acquire-icon">${iconContent}</div>
            <div class="acquire-label">${label}</div>
            <div class="acquire-name">${name}</div>
            <div class="acquire-desc">${desc}</div>
        `;
        
        document.body.appendChild(popup);
        
        // 애니메이션 후 제거
        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => popup.remove(), 500);
        }, 2000);
        
        // 유물 슬롯 하이라이트
        setTimeout(() => {
            const slot = document.querySelector(`[data-relic-id="${relic.id}"]`);
            if (slot) {
                slot.classList.add('new-relic');
                setTimeout(() => slot.classList.remove('new-relic'), 2000);
            }
        }, 500);
    },
    
    // ==========================================
    // 유물 획득 이펙트 (silent=false 일 때 호출)
    // ==========================================
    showAcquireEffect(relic) {
        this.showAcquireAnimation(relic);
    }
};

// ==========================================
// RelicSystem의 UI 메서드 오버라이드
// ==========================================

// 기존 updateRelicUI 오버라이드
RelicSystem.updateRelicUI = function() {
    console.log('[RelicSystem] updateRelicUI called, relics:', this.ownedRelics.length);
    
    // RelicUI가 초기화되지 않았으면 초기화
    if (!RelicUI.container || !document.body.contains(RelicUI.container)) {
        RelicUI.init();
    }
    
    RelicUI.updateRelicList(this.ownedRelics);
};

// 페이지 로드 완료 후 초기화 보장
document.addEventListener('DOMContentLoaded', () => {
    console.log('[RelicUI] DOMContentLoaded triggered');
    
    // 약간의 지연 후 UI 업데이트 (다른 스크립트가 로드된 후)
    setTimeout(() => {
        console.log('[RelicUI] Delayed init check...');
        
        // 컨테이너가 없으면 초기화
        if (!RelicUI.container || !document.body.contains(RelicUI.container)) {
            console.log('[RelicUI] Container missing, initializing...');
            RelicUI.init();
        }
        
        // 유물이 있으면 UI 업데이트
        if (typeof RelicSystem !== 'undefined' && RelicSystem.ownedRelics && RelicSystem.ownedRelics.length > 0) {
            console.log('[RelicUI] Found', RelicSystem.ownedRelics.length, 'relics, updating UI...');
            RelicUI.updateRelicList(RelicSystem.ownedRelics);
        }
    }, 1000);
});

// ==========================================
// CSS 스타일
// ==========================================
const relicUIStyles = document.createElement('style');
relicUIStyles.textContent = `
    /* 유물 디스플레이 컨테이너 */
    .relic-display {
        position: fixed !important;
        top: 65px !important;
        left: 15px !important;
        z-index: 99999 !important;
        pointer-events: auto;
    }
    
    .relic-list {
        display: flex;
        flex-wrap: nowrap;
        gap: 5px;
    }
    
    .relic-empty {
        font-size: 0.8rem;
        color: #6b7280;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
    }
    
    /* 유물 슬롯 */
    .relic-slot {
        position: relative;
        width: 40px;
        height: 40px;
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .relic-slot:hover {
        transform: scale(1.2);
        z-index: 10;
    }
    
    .relic-slot-bg {
        position: absolute;
        inset: 0;
        background: linear-gradient(145deg, #3a3a50 0%, #1a1a28 100%);
        border: 2px solid #fbbf24;
        border-radius: 10px;
        box-shadow: 
            0 0 15px rgba(251, 191, 36, 0.3),
            inset 0 0 10px rgba(0, 0, 0, 0.5);
    }
    
    .relic-slot:hover .relic-slot-bg {
        border-color: #fcd34d;
        box-shadow: 
            0 0 25px rgba(251, 191, 36, 0.5),
            inset 0 0 10px rgba(0, 0, 0, 0.5);
    }
    
    .relic-slot-icon {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        z-index: 1;
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
    }
    
    .relic-icon-img {
        width: 32px;
        height: 32px;
        object-fit: contain;
        image-rendering: pixelated;
    }
    
    .tooltip-icon-img {
        width: 24px;
        height: 24px;
        object-fit: contain;
        image-rendering: pixelated;
        vertical-align: middle;
    }
    
    .relic-slot-shine {
        position: absolute;
        top: 3px;
        left: 3px;
        right: 3px;
        height: 40%;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
        border-radius: 8px 8px 50% 50%;
        pointer-events: none;
    }
    
    /* 새 유물 획득 효과 */
    .relic-slot.new-relic {
        animation: newRelicPulse 0.5s ease-in-out infinite alternate;
    }
    
    @keyframes newRelicPulse {
        from {
            transform: scale(1);
            filter: brightness(1);
        }
        to {
            transform: scale(1.1);
            filter: brightness(1.3);
        }
    }
    
    /* 툴팁 */
    .relic-tooltip {
        position: fixed;
        z-index: 10000;
        min-width: 250px;
        max-width: 300px;
        padding: 15px;
        background: linear-gradient(145deg, #2a2a3e 0%, #151520 100%);
        border: 2px solid #fbbf24;
        border-radius: 12px;
        box-shadow: 
            0 0 30px rgba(0, 0, 0, 0.8),
            0 0 20px rgba(251, 191, 36, 0.2);
        pointer-events: none;
        opacity: 0;
        transform: scale(0.9);
        transition: opacity 0.15s ease, transform 0.15s ease;
    }
    
    .relic-tooltip.visible {
        opacity: 1;
        transform: scale(1);
    }
    
    .tooltip-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 5px;
    }
    
    .tooltip-icon {
        font-size: 2rem;
        filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.5));
    }
    
    .tooltip-name {
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        font-weight: 700;
        color: #fbbf24;
        text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
    }
    
    .tooltip-rarity {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 3px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 10px;
    }
    
    .tooltip-rarity.starter {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
        border: 1px solid rgba(34, 197, 94, 0.3);
    }
    
    .tooltip-rarity.common {
        background: rgba(156, 163, 175, 0.2);
        color: #9ca3af;
        border: 1px solid rgba(156, 163, 175, 0.3);
    }
    
    .tooltip-rarity.uncommon {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    .tooltip-rarity.rare {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.3);
    }
    
    .tooltip-rarity.legendary {
        background: rgba(168, 85, 247, 0.2);
        color: #a855f7;
        border: 1px solid rgba(168, 85, 247, 0.3);
    }
    
    .tooltip-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.3) 50%, transparent 100%);
        margin: 10px 0;
    }
    
    .tooltip-description {
        font-size: 0.9rem;
        color: #d1d5db;
        line-height: 1.5;
    }
    
    /* 유물 획득 팝업 */
    .relic-acquire-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 60px;
        background: linear-gradient(145deg, rgba(40, 40, 60, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%);
        border: 3px solid #fbbf24;
        border-radius: 20px;
        box-shadow: 0 0 100px rgba(251, 191, 36, 0.4);
        animation: acquirePopupIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    
    .relic-acquire-popup.fade-out {
        animation: acquirePopupOut 0.5s ease-in forwards;
    }
    
    @keyframes acquirePopupIn {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }
    
    @keyframes acquirePopupOut {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
        }
    }
    
    .acquire-glow {
        position: absolute;
        inset: -50px;
        background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
        animation: acquireGlow 1s ease-in-out infinite alternate;
        pointer-events: none;
    }
    
    @keyframes acquireGlow {
        from { opacity: 0.5; transform: scale(1); }
        to { opacity: 1; transform: scale(1.1); }
    }
    
    .acquire-icon {
        font-size: 5rem;
        margin-bottom: 15px;
        animation: acquireIconBounce 0.5s ease-out;
        filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.8));
    }
    
    .acquire-icon-img {
        width: 80px;
        height: 80px;
        object-fit: contain;
        image-rendering: pixelated;
    }
    
    @keyframes acquireIconBounce {
        0% { transform: scale(0) rotate(-20deg); }
        60% { transform: scale(1.3) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); }
    }
    
    .acquire-label {
        font-family: 'Cinzel', serif;
        font-size: 1rem;
        font-weight: 700;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 3px;
        margin-bottom: 5px;
    }
    
    .acquire-name {
        font-family: 'Cinzel', serif;
        font-size: 1.8rem;
        font-weight: 900;
        color: #fbbf24;
        text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        margin-bottom: 15px;
    }
    
    .acquire-desc {
        font-size: 1rem;
        color: #d1d5db;
        text-align: center;
        max-width: 250px;
        line-height: 1.4;
    }
`;
document.head.appendChild(relicUIStyles);

// 디버깅용 글로벌 함수
window.debugRelicUI = function() {
    console.log('=== Relic UI Debug ===');
    console.log('RelicUI.container:', RelicUI.container);
    console.log('Container in DOM:', document.body.contains(RelicUI.container));
    console.log('RelicSystem.ownedRelics:', RelicSystem.ownedRelics);
    console.log('relic-display element:', document.getElementById('relic-display'));
    
    // 강제 업데이트
    if (RelicSystem.ownedRelics.length > 0) {
        RelicSystem.updateRelicUI();
        console.log('Forced UI update');
    }
};

console.log('[RelicUI] Loaded');

