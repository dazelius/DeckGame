// ==========================================
// 후드 소녀 상점 시스템 (캐릭터 강화)
// ==========================================

const HoodShop = {
    // 강화 아이템 정의 (레벨별 비용)
    upgrades: {
        maxHp: {
            name: '생명력 강화',
            icon: '❤️',
            desc: '최대 체력이 5 증가합니다.',
            amount: 5,          // 레벨당 증가량
            maxLevel: 10,       // 최대 레벨
            costs: [10, 15, 25, 40, 60, 85, 115, 150, 200, 250]  // 레벨별 비용
        },
        energy: {
            name: '에너지 강화',
            icon: '⚡',
            desc: '시작 에너지가 1 증가합니다.',
            amount: 1,
            maxLevel: 2,
            costs: [300, 600]
        },
        draw: {
            name: '드로우 강화',
            icon: '🃏',
            desc: '턴 시작 시 1장 더 뽑습니다.',
            amount: 1,
            maxLevel: 2,
            costs: [250, 500]
        },
        startBlock: {
            name: '시작 방어력',
            icon: '🛡️',
            desc: '전투 시작 시 방어력 3 획득.',
            amount: 3,
            maxLevel: 5,
            costs: [50, 80, 120, 180, 250]
        }
    },
    
    // ==========================================
    // 강화 레벨 가져오기
    // ==========================================
    getUpgrades() {
        const saved = localStorage.getItem('lordofnight_upgrades');
        return saved ? JSON.parse(saved) : {};
    },
    
    saveUpgrades(upgrades) {
        localStorage.setItem('lordofnight_upgrades', JSON.stringify(upgrades));
    },
    
    // 특정 강화의 현재 레벨
    getUpgradeLevel(type) {
        const upgrades = this.getUpgrades();
        const upgradeInfo = this.upgrades[type];
        if (!upgradeInfo) return 0;
        
        const currentValue = upgrades[type] || 0;
        return Math.floor(currentValue / upgradeInfo.amount);
    },
    
    // 다음 레벨 비용 가져오기
    getNextCost(type) {
        const currentLevel = this.getUpgradeLevel(type);
        const upgradeInfo = this.upgrades[type];
        
        if (!upgradeInfo || currentLevel >= upgradeInfo.maxLevel) {
            return null; // 최대 레벨
        }
        
        return upgradeInfo.costs[currentLevel];
    },
    
    // 최대 레벨인지 확인
    isMaxLevel(type) {
        const currentLevel = this.getUpgradeLevel(type);
        const upgradeInfo = this.upgrades[type];
        return upgradeInfo && currentLevel >= upgradeInfo.maxLevel;
    },
    
    // ==========================================
    // 강화 구매
    // ==========================================
    purchaseUpgrade(type) {
        const cost = this.getNextCost(type);
        if (cost === null) return false; // 최대 레벨
        
        if (!GoldSystem.spendGold(cost)) {
            return false; // 골드 부족
        }
        
        const upgrades = this.getUpgrades();
        const upgradeInfo = this.upgrades[type];
        upgrades[type] = (upgrades[type] || 0) + upgradeInfo.amount;
        this.saveUpgrades(upgrades);
        
        return true;
    },
    
    // ==========================================
    // 상점 UI 열기 (다크소울 스타일)
    // ==========================================
    selectedIndex: 0,
    upgradeKeys: ['maxHp', 'energy', 'draw', 'startBlock'],
    
    open() {
        this.selectedIndex = 0;
        
        const modal = document.createElement('div');
        modal.className = 'ds-hoodshop-modal';
        modal.id = 'hoodshop-modal';
        modal.innerHTML = this.renderDSContent();
        
        document.body.appendChild(modal);
        this.injectDSStyles();
        
        // 키보드 이벤트
        this.keyHandler = (e) => this.handleKeyPress(e);
        document.addEventListener('keydown', this.keyHandler);
        
        // 애니메이션
        requestAnimationFrame(() => {
            modal.classList.add('active');
            this.selectUpgrade(0);
        });
    },
    
    close() {
        const modal = document.getElementById('hoodshop-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 400);
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    },
    
    handleKeyPress(e) {
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                this.selectUpgrade(this.selectedIndex);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.upgradeKeys.length - 1, this.selectedIndex + 1);
                this.selectUpgrade(this.selectedIndex);
                break;
            case 'Enter':
                e.preventDefault();
                this.buySelected();
                break;
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
        }
    },
    
    // 다크소울 스타일 컨텐츠 렌더링
    renderDSContent() {
        const currentGold = GoldSystem.getGold();
        
        return `
            <div class="ds-backdrop"></div>
            <div class="ds-hoodshop-container">
                <!-- 왼쪽: 캐릭터 + 업그레이드 목록 -->
                <div class="ds-hoodshop-left">
                    <div class="ds-title">
                        <span class="ds-title-line"></span>
                        <h1>강화</h1>
                        <span class="ds-title-line"></span>
                    </div>
                    
                    <div class="ds-hoodshop-character">
                        <img src="hoodgirl.png" alt="후드 소녀" class="ds-hoodgirl-img">
                    </div>
                    
                    <div class="ds-upgrade-list" id="ds-upgrade-list">
                        ${this.renderDSUpgradeList()}
                    </div>
                    
                    <div class="ds-hint">
                        <span>↑↓ 선택</span>
                        <span>ENTER 구매</span>
                        <span>ESC 닫기</span>
                    </div>
                </div>
                
                <!-- 오른쪽: 상세 정보 -->
                <div class="ds-hoodshop-right" id="ds-upgrade-detail">
                    ${this.renderDSUpgradeDetail(0)}
                </div>
            </div>
            
            <!-- 골드 표시 -->
            <div class="ds-gold-display">
                <span class="ds-gold-icon">💰</span>
                <span class="ds-gold-value" id="ds-gold-value">${currentGold.toLocaleString()}</span>
            </div>
            
            <!-- 닫기 버튼 -->
            <button class="ds-close" onclick="HoodShop.close()">
                <span>×</span>
            </button>
        `;
    },
    
    renderDSUpgradeList() {
        const dsIcons = { maxHp: '♥', energy: '◆', draw: '▣', startBlock: '⬡' };
        
        return this.upgradeKeys.map((type, index) => {
            const info = this.upgrades[type];
            const isMax = this.isMaxLevel(type);
            return `
                <div class="ds-upgrade-item ${isMax ? 'maxed' : ''}"
                     data-index="${index}"
                     onclick="HoodShop.selectUpgrade(${index})">
                    <span class="ds-upgrade-icon">${dsIcons[type]}</span>
                    <span class="ds-upgrade-name">${info.name}</span>
                    ${isMax ? '<span class="ds-maxed-mark">MAX</span>' : ''}
                </div>
            `;
        }).join('');
    },
    
    selectUpgrade(index) {
        this.selectedIndex = index;
        
        // 리스트 선택 표시
        document.querySelectorAll('.ds-upgrade-item').forEach((el, i) => {
            el.classList.toggle('selected', i === index);
        });
        
        // 상세 정보 업데이트
        const detail = document.getElementById('ds-upgrade-detail');
        if (detail) {
            detail.innerHTML = this.renderDSUpgradeDetail(index);
        }
    },
    
    renderDSUpgradeDetail(index) {
        const dsIcons = { maxHp: '♥', energy: '◆', draw: '▣', startBlock: '⬡' };
        const type = this.upgradeKeys[index];
        const info = this.upgrades[type];
        const currentLevel = this.getUpgradeLevel(type);
        const nextCost = this.getNextCost(type);
        const isMax = this.isMaxLevel(type);
        const canAfford = nextCost !== null && GoldSystem.getGold() >= nextCost;
        const currentValue = this.getUpgrades()[type] || 0;
        const maxValue = info.amount * info.maxLevel;
        const progressPercent = (currentLevel / info.maxLevel) * 100;
        
        return `
            <div class="ds-upgrade-detail-content">
                <div class="ds-upgrade-header">
                    <span class="ds-upgrade-big-icon">${dsIcons[type]}</span>
                    <div class="ds-upgrade-title">
                        <h2>${info.name}</h2>
                        <span class="ds-level-badge">Lv.${currentLevel}</span>
                    </div>
                </div>
                
                <div class="ds-divider"></div>
                
                <p class="ds-upgrade-desc">${info.desc}</p>
                
                <!-- 진행 상황 -->
                <div class="ds-progress-section">
                    <div class="ds-progress-label">
                        <span>진행도</span>
                        <span>레벨 ${currentLevel} / ${info.maxLevel}</span>
                    </div>
                    <div class="ds-progress-bar">
                        <div class="ds-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="ds-progress-value">+${currentValue} / +${maxValue}</div>
                </div>
                
                <!-- 비용 -->
                <div class="ds-cost-section">
                    <span class="ds-cost-label">비용</span>
                    <span class="ds-cost-value ${!canAfford && !isMax ? 'insufficient' : ''}">
                        ${isMax ? '—' : `💰 ${nextCost?.toLocaleString()}`}
                    </span>
                </div>
                
                <!-- 효과 -->
                <div class="ds-effect-section">
                    <span class="ds-effect-label">효과</span>
                    <span class="ds-effect-value">${dsIcons[type]} +${info.amount}</span>
                </div>
                
                <!-- 구매 버튼 -->
                <button class="ds-purchase-btn ${isMax ? 'maxed' : ''} ${!canAfford ? 'disabled' : ''}" 
                        onclick="HoodShop.buySelected()"
                        ${isMax || !canAfford ? 'disabled' : ''}>
                    ${isMax ? '최대 강화' : (!canAfford ? '골드 부족' : '강화하기')}
                </button>
            </div>
        `;
    },
    
    buySelected() {
        const type = this.upgradeKeys[this.selectedIndex];
        
        if (this.purchaseUpgrade(type)) {
            const info = this.upgrades[type];
            this.showUpgradeEffect(info.icon, info.amount);
            
            // UI 갱신
            document.getElementById('ds-upgrade-list').innerHTML = this.renderDSUpgradeList();
            this.selectUpgrade(this.selectedIndex);
            document.getElementById('ds-gold-value').textContent = GoldSystem.getGold().toLocaleString();
            
            // 플레이어 상태 업데이트
            if (typeof TownSystem !== 'undefined') {
                TownSystem.updatePlayerStatus();
            }
            GoldSystem.updateDisplay();
        }
    },
    
    // 다크소울 스타일 CSS 주입
    injectDSStyles() {
        if (document.getElementById('ds-hoodshop-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ds-hoodshop-styles';
        style.textContent = `
            /* 다크소울 스타일 후드샵 UI */
            .ds-hoodshop-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            
            .ds-hoodshop-modal.active {
                opacity: 1;
            }
            
            .ds-hoodshop-modal .ds-backdrop {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%);
            }
            
            .ds-hoodshop-modal .ds-title {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .ds-hoodshop-modal .ds-title h1 {
                margin: 0;
                font-family: 'Cinzel', serif;
                font-size: 1.8rem;
                font-weight: 400;
                color: #c8b896;
                letter-spacing: 8px;
            }
            
            .ds-hoodshop-modal .ds-title-line {
                flex: 1;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(180, 160, 120, 0.5), transparent);
            }
            
            .ds-hoodshop-modal .ds-hint {
                margin-top: auto;
                padding-top: 30px;
                display: flex;
                gap: 24px;
                font-size: 0.75rem;
                color: #5a5040;
                font-family: 'Cinzel', serif;
            }
            
            .ds-hoodshop-modal .ds-divider {
                height: 1px;
                background: linear-gradient(90deg, rgba(180, 160, 120, 0.5), transparent);
                margin: 24px 0;
            }
            
            .ds-hoodshop-modal .ds-close {
                position: absolute;
                top: 30px;
                right: 40px;
                width: 50px;
                height: 50px;
                background: transparent;
                border: 1px solid rgba(180, 160, 120, 0.3);
                color: #6a6050;
                font-size: 2rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ds-hoodshop-modal .ds-close:hover {
                border-color: #d4af37;
                color: #c8b896;
            }
            
            .ds-hoodshop-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                padding: 60px 80px;
                box-sizing: border-box;
            }
            
            /* 왼쪽 패널 */
            .ds-hoodshop-left {
                width: 320px;
                display: flex;
                flex-direction: column;
                padding-right: 60px;
                border-right: 1px solid rgba(180, 160, 120, 0.3);
            }
            
            .ds-hoodshop-character {
                display: flex;
                justify-content: center;
                align-items: flex-end;
                height: 200px;
                margin-bottom: 30px;
                background: radial-gradient(ellipse at bottom, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            }
            
            .ds-hoodgirl-img {
                max-height: 180px;
                image-rendering: pixelated;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
            }
            
            .ds-hoodshop-modal .ds-upgrade-list {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .ds-hoodshop-modal .ds-upgrade-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 14px 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-left: 2px solid transparent;
            }
            
            .ds-hoodshop-modal .ds-upgrade-item:hover:not(.maxed) {
                background: rgba(255, 255, 255, 0.03);
            }
            
            .ds-hoodshop-modal .ds-upgrade-item.selected {
                background: rgba(255, 255, 255, 0.05);
                border-left-color: #d4af37;
            }
            
            .ds-hoodshop-modal .ds-upgrade-item.selected .ds-upgrade-name {
                color: #f5e6c4;
            }
            
            .ds-hoodshop-modal .ds-upgrade-item.maxed {
                opacity: 0.4;
            }
            
            .ds-hoodshop-modal .ds-upgrade-icon {
                font-size: 1.4rem;
                color: #d4af37;
                width: 30px;
                text-align: center;
            }
            
            .ds-hoodshop-modal .ds-upgrade-name {
                flex: 1;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #a09080;
                letter-spacing: 2px;
                transition: color 0.2s;
            }
            
            .ds-hoodshop-modal .ds-maxed-mark {
                font-size: 0.7rem;
                color: #6a6050;
            }
            
            /* 오른쪽 패널 */
            .ds-hoodshop-right {
                flex: 1;
                padding-left: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ds-upgrade-detail-content {
                width: 100%;
                max-width: 450px;
            }
            
            .ds-upgrade-header {
                display: flex;
                align-items: center;
                gap: 24px;
                margin-bottom: 24px;
            }
            
            .ds-upgrade-big-icon {
                font-size: 4rem;
                color: #d4af37;
                filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.3));
            }
            
            .ds-upgrade-title h2 {
                margin: 0;
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                font-weight: 400;
                color: #f5e6c4;
                letter-spacing: 4px;
            }
            
            .ds-level-badge {
                display: inline-block;
                margin-top: 8px;
                padding: 4px 12px;
                background: rgba(212, 175, 55, 0.2);
                border: 1px solid rgba(212, 175, 55, 0.4);
                font-family: 'Cinzel', serif;
                font-size: 0.85rem;
                color: #d4af37;
            }
            
            .ds-upgrade-desc {
                font-size: 1rem;
                color: #a09080;
                line-height: 1.6;
                margin: 0 0 30px;
            }
            
            /* 진행 바 */
            .ds-progress-section {
                margin-bottom: 24px;
            }
            
            .ds-progress-label {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 0.85rem;
                color: #6a6050;
            }
            
            .ds-progress-bar {
                height: 8px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(180, 160, 120, 0.3);
            }
            
            .ds-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #d4af37 0%, #f5e6c4 100%);
                transition: width 0.3s ease;
            }
            
            .ds-progress-value {
                margin-top: 6px;
                font-size: 0.8rem;
                color: #6a6050;
                text-align: right;
            }
            
            /* 비용/효과 */
            .ds-cost-section, .ds-effect-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid rgba(180, 160, 120, 0.15);
            }
            
            .ds-cost-label, .ds-effect-label {
                font-size: 0.85rem;
                color: #6a6050;
                letter-spacing: 2px;
            }
            
            .ds-cost-value {
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #d4af37;
            }
            
            .ds-cost-value.insufficient {
                color: #b54a4a;
            }
            
            .ds-effect-value {
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #f5e6c4;
            }
            
            /* 구매 버튼 */
            .ds-purchase-btn {
                width: 100%;
                padding: 18px 32px;
                margin-top: 30px;
                background: transparent;
                border: 1px solid rgba(212, 175, 55, 0.5);
                color: #c8b896;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                letter-spacing: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .ds-purchase-btn:hover:not(:disabled) {
                background: rgba(212, 175, 55, 0.1);
                border-color: #d4af37;
                color: #f5e6c4;
                box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
            }
            
            .ds-purchase-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            
            /* 골드 표시 */
            .ds-gold-display {
                position: absolute;
                top: 30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 24px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(212, 175, 55, 0.4);
            }
            
            .ds-gold-icon {
                font-size: 1.3rem;
            }
            
            .ds-gold-value {
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #d4af37;
                letter-spacing: 2px;
            }
            
            /* 반응형 */
            @media (max-width: 1024px) {
                .ds-hoodshop-container {
                    padding: 40px;
                    flex-direction: column;
                    overflow-y: auto;
                }
                
                .ds-hoodshop-left {
                    width: 100%;
                    border-right: none;
                    border-bottom: 1px solid rgba(180, 160, 120, 0.3);
                    padding-right: 0;
                    padding-bottom: 30px;
                    margin-bottom: 30px;
                }
                
                .ds-hoodshop-character {
                    height: 150px;
                }
                
                .ds-hoodgirl-img {
                    max-height: 130px;
                }
                
                .ds-hoodshop-modal .ds-upgrade-list {
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .ds-hoodshop-modal .ds-upgrade-item {
                    padding: 10px 16px;
                    border-left: none;
                    border-bottom: 2px solid transparent;
                }
                
                .ds-hoodshop-modal .ds-upgrade-item.selected {
                    border-bottom-color: #d4af37;
                }
                
                .ds-hoodshop-modal .ds-hint {
                    display: none;
                }
                
                .ds-hoodshop-right {
                    padding-left: 0;
                }
            }
            
            @media (max-width: 600px) {
                .ds-hoodshop-container {
                    padding: 20px;
                    padding-top: 80px;
                }
                
                .ds-hoodshop-character {
                    height: 120px;
                }
                
                .ds-hoodgirl-img {
                    max-height: 100px;
                }
                
                .ds-upgrade-big-icon {
                    font-size: 2.5rem;
                }
                
                .ds-upgrade-title h2 {
                    font-size: 1.4rem;
                }
                
                .ds-gold-display {
                    top: 15px;
                    padding: 8px 16px;
                }
                
                .ds-hoodshop-modal .ds-close {
                    top: 15px;
                    right: 15px;
                    width: 40px;
                    height: 40px;
                    font-size: 1.5rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 강화 효과 표시
    showUpgradeEffect(icon, amount) {
        const popup = document.createElement('div');
        popup.className = 'upgrade-popup';
        popup.innerHTML = `${icon} +${amount}`;
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            color: #fbbf24;
            text-shadow: 0 0 30px rgba(251, 191, 36, 0.8);
            z-index: 3001;
            animation: upgradePopup 1s ease-out forwards;
            pointer-events: none;
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    },
    
    // ==========================================
    // 총 강화 비용 (정보용)
    // ==========================================
    getTotalCostForType(type) {
        const upgradeInfo = this.upgrades[type];
        if (!upgradeInfo) return 0;
        return upgradeInfo.costs.reduce((sum, cost) => sum + cost, 0);
    },
    
    // 전체 강화 초기화 (디버그용)
    resetAll() {
        localStorage.removeItem('lordofnight_upgrades');
        console.log('[HoodShop] 모든 강화 초기화됨');
    }
};

// 전역 접근
window.HoodShop = HoodShop;

console.log('[HoodShop] 후드 소녀 상점 시스템 로드 완료');

