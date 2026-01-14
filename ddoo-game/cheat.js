// =====================================================
// Cheat System - 개발용 치트 시스템
// =====================================================

const CheatSystem = {
    game: null,
    modal: null,
    isOpen: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        this.createModal();
        this.setupKeyBindings();
        console.log('[CheatSystem] 초기화 완료 - F4: 메뉴, F1: 코스트, F2: 체력, F3: 적 처치, F5: 마우스 트레일');
    },
    
    // ==========================================
    // 키 바인딩
    // ==========================================
    setupKeyBindings() {
        window.addEventListener('keydown', (e) => {
            // Ctrl+D: 카드 선택 GUI
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleModal();
            }
            
            // Ctrl+Z: 코스트 회복 (대체 단축키)
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.restoreCost();
            }
            
            // F1: 코스트 회복
            if (e.key === 'F1') {
                e.preventDefault();
                this.restoreCost();
            }
            
            // F2: 체력 회복
            if (e.key === 'F2') {
                e.preventDefault();
                this.restoreHP();
            }
            
            // F3: 모든 적 처치
            if (e.key === 'F3') {
                e.preventDefault();
                this.killAllEnemies();
            }
            
            // F4: 치트 메뉴 열기
            if (e.key === 'F4') {
                e.preventDefault();
                this.toggleModal();
            }
            
            // F5: 마우스 트레일 토글
            if (e.key === 'F5') {
                e.preventDefault();
                this.toggleMouseTrail();
            }
            
            // ESC: 모달 닫기
            if (e.key === 'Escape' && this.isOpen) {
                this.closeModal();
            }
        });
    },
    
    // ==========================================
    // 모달 생성
    // ==========================================
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'cheat-modal';
        modal.innerHTML = `
            <div class="cheat-overlay"></div>
            <div class="cheat-panel">
                <div class="cheat-header">
                    <h2>🎮 치트 메뉴</h2>
                    <button class="cheat-close">✕</button>
                </div>
                <div class="cheat-tabs">
                    <button class="cheat-tab active" data-tab="cards">카드 추가</button>
                    <button class="cheat-tab" data-tab="monsters">몬스터 소환</button>
                    <button class="cheat-tab" data-tab="quick">퀵 치트</button>
                </div>
                <div class="cheat-content">
                    <div class="cheat-tab-content active" id="cheat-cards">
                        <div class="cheat-card-grid"></div>
                    </div>
                    <div class="cheat-tab-content" id="cheat-monsters">
                        <div class="cheat-monster-grid"></div>
                    </div>
                    <div class="cheat-tab-content" id="cheat-quick">
                        <div class="cheat-quick-buttons">
                            <button class="cheat-btn" data-action="cost">
                                <span class="cheat-icon">⚡</span>
                                <span>코스트 회복 (Ctrl+Z / F1)</span>
                            </button>
                            <button class="cheat-btn" data-action="hp">
                                <span class="cheat-icon">❤️</span>
                                <span>체력 회복 (F2)</span>
                            </button>
                            <button class="cheat-btn" data-action="kill">
                                <span class="cheat-icon">💀</span>
                                <span>적 전멸 (F3)</span>
                            </button>
                            <button class="cheat-btn" data-action="draw">
                                <span class="cheat-icon">🃏</span>
                                <span>카드 5장 드로우</span>
                            </button>
                            <button class="cheat-btn" data-action="block">
                                <span class="cheat-icon">🛡️</span>
                                <span>방어력 +20</span>
                            </button>
                            <button class="cheat-btn" data-action="damage">
                                <span class="cheat-icon">⚔️</span>
                                <span>적 전체 10 대미지</span>
                            </button>
                            <button class="cheat-btn" data-action="allcards">
                                <span class="cheat-icon">📚</span>
                                <span>모든 카드 1장씩</span>
                            </button>
                        </div>
                        <div class="cheat-lang-section">
                            <div class="cheat-section-title">🌐 언어 설정</div>
                            <div class="cheat-lang-buttons">
                                <button class="cheat-lang-btn" data-lang="ko">한국어</button>
                                <button class="cheat-lang-btn" data-lang="en">English</button>
                                <button class="cheat-lang-btn" data-lang="ja">日本語</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modal = modal;
        
        // 이벤트 연결
        modal.querySelector('.cheat-close').onclick = () => this.closeModal();
        modal.querySelector('.cheat-overlay').onclick = () => this.closeModal();
        
        // 탭 전환
        modal.querySelectorAll('.cheat-tab').forEach(tab => {
            tab.onclick = () => this.switchTab(tab.dataset.tab);
        });
        
        // 퀵 치트 버튼
        modal.querySelectorAll('.cheat-btn').forEach(btn => {
            btn.onclick = () => this.executeQuickCheat(btn.dataset.action);
        });
        
        // 언어 선택 버튼
        modal.querySelectorAll('.cheat-lang-btn').forEach(btn => {
            btn.onclick = () => this.changeLanguage(btn.dataset.lang);
        });
        
        // 현재 언어 활성화 표시
        this.updateLangButtons();
        
        // 스타일 추가
        this.addStyles();
    },
    
    // ==========================================
    // 스타일 추가
    // ==========================================
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #cheat-modal {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 10000;
            }
            
            #cheat-modal.open {
                display: block;
            }
            
            .cheat-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .cheat-panel {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #e94560;
                border-radius: 16px;
                box-shadow: 0 0 40px rgba(233, 69, 96, 0.3);
                overflow: hidden;
            }
            
            .cheat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: rgba(233, 69, 96, 0.1);
                border-bottom: 1px solid rgba(233, 69, 96, 0.3);
            }
            
            .cheat-header h2 {
                margin: 0;
                font-size: 1.3rem;
                color: #e94560;
            }
            
            .cheat-close {
                background: none;
                border: none;
                color: #888;
                font-size: 1.5rem;
                cursor: pointer;
                transition: color 0.2s;
            }
            
            .cheat-close:hover {
                color: #e94560;
            }
            
            .cheat-tabs {
                display: flex;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .cheat-tab {
                flex: 1;
                padding: 12px;
                background: none;
                border: none;
                color: #888;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .cheat-tab:hover {
                color: #fff;
                background: rgba(255,255,255,0.05);
            }
            
            .cheat-tab.active {
                color: #e94560;
                border-bottom: 2px solid #e94560;
            }
            
            .cheat-content {
                padding: 16px;
                max-height: 50vh;
                overflow-y: auto;
            }
            
            .cheat-tab-content {
                display: none;
            }
            
            .cheat-tab-content.active {
                display: block;
            }
            
            .cheat-card-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 10px;
            }
            
            .cheat-card {
                padding: 12px 8px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .cheat-card:hover {
                background: rgba(233, 69, 96, 0.2);
                border-color: #e94560;
                transform: translateY(-2px);
            }
            
            .cheat-card-icon {
                font-size: 1.5rem;
                margin-bottom: 4px;
            }
            
            .cheat-card-name {
                font-size: 0.85rem;
                color: #fff;
                margin-bottom: 2px;
            }
            
            .cheat-card-cost {
                font-size: 0.75rem;
                color: #fbbf24;
            }
            
            .cheat-card.attack { border-left: 3px solid #ef4444; }
            .cheat-card.skill { border-left: 3px solid #22c55e; }
            .cheat-card.summon { border-left: 3px solid #3b82f6; }
            
            .cheat-monster-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                gap: 10px;
            }
            
            .cheat-monster {
                padding: 14px 10px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .cheat-monster:hover {
                background: rgba(139, 92, 246, 0.2);
                border-color: #8b5cf6;
                transform: translateY(-2px);
            }
            
            .cheat-monster-icon {
                font-size: 1.8rem;
                margin-bottom: 6px;
            }
            
            .cheat-monster-name {
                font-size: 0.9rem;
                color: #fff;
                margin-bottom: 3px;
            }
            
            .cheat-monster-hp {
                font-size: 0.75rem;
                color: #ef4444;
            }
            
            .cheat-quick-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }
            
            .cheat-btn {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 16px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: #fff;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .cheat-btn:hover {
                background: rgba(233, 69, 96, 0.2);
                border-color: #e94560;
            }
            
            .cheat-icon {
                font-size: 1.3rem;
            }
            
            .cheat-toast {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                background: rgba(233, 69, 96, 0.9);
                color: #fff;
                border-radius: 8px;
                font-size: 0.9rem;
                z-index: 10001;
                animation: cheatToastIn 0.3s ease-out;
            }
            
            @keyframes cheatToastIn {
                from { opacity: 0; transform: translate(-50%, 20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }
            
            .cheat-lang-section {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            
            .cheat-section-title {
                font-size: 0.85rem;
                color: #888;
                margin-bottom: 12px;
            }
            
            .cheat-lang-buttons {
                display: flex;
                gap: 10px;
            }
            
            .cheat-lang-btn {
                flex: 1;
                padding: 10px 16px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 6px;
                color: #aaa;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .cheat-lang-btn:hover {
                background: rgba(100, 150, 200, 0.2);
                border-color: #6699cc;
                color: #fff;
            }
            
            .cheat-lang-btn.active {
                background: rgba(100, 150, 200, 0.3);
                border-color: #6699cc;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    },
    
    // ==========================================
    // 모달 열기/닫기
    // ==========================================
    toggleModal() {
        if (this.isOpen) {
            this.closeModal();
        } else {
            this.openModal();
        }
    },
    
    openModal() {
        if (this.game.state.phase !== 'prepare') {
            this.showToast('준비 페이즈에서만 사용 가능!');
            return;
        }
        
        this.refreshCardList();
        this.refreshMonsterList();
        this.modal.classList.add('open');
        this.isOpen = true;
    },
    
    closeModal() {
        this.modal.classList.remove('open');
        this.isOpen = false;
    },
    
    // ==========================================
    // 탭 전환
    // ==========================================
    switchTab(tabName) {
        this.modal.querySelectorAll('.cheat-tab').forEach(t => t.classList.remove('active'));
        this.modal.querySelectorAll('.cheat-tab-content').forEach(c => c.classList.remove('active'));
        
        this.modal.querySelector(`.cheat-tab[data-tab="${tabName}"]`).classList.add('active');
        this.modal.querySelector(`#cheat-${tabName}`).classList.add('active');
    },
    
    // ==========================================
    // 카드 목록 갱신
    // ==========================================
    refreshCardList() {
        const grid = this.modal.querySelector('.cheat-card-grid');
        grid.innerHTML = '';
        
        if (typeof CardSystem === 'undefined' || !CardSystem.cards) {
            console.warn('[Cheat] CardSystem 또는 cards 없음!');
            return;
        }
        
        const cardCount = Object.keys(CardSystem.cards).length;
        console.log(`[Cheat] 카드 목록 갱신: ${cardCount}개 카드 (hook 포함: ${!!CardSystem.cards.hook})`);
        
        const cardIcons = {
            attack: '⚔️',
            skill: '🛡️',
            summon: '✨'
        };
        
        for (const [cardId, card] of Object.entries(CardSystem.cards)) {
            const localName = typeof Localization !== 'undefined' 
                ? Localization.getCard(cardId)?.name || card.name 
                : card.name;
            
            const cardEl = document.createElement('div');
            cardEl.className = `cheat-card ${card.type}`;
            cardEl.innerHTML = `
                <div class="cheat-card-icon">${cardIcons[card.type] || '🃏'}</div>
                <div class="cheat-card-name">${localName}</div>
                <div class="cheat-card-cost">${card.cost} 코스트</div>
            `;
            cardEl.onclick = () => this.addCard(cardId);
            grid.appendChild(cardEl);
        }
    },
    
    // ==========================================
    // 카드 추가
    // ==========================================
    addCard(cardId) {
        if (this.game.state.phase !== 'prepare') {
            this.showToast('준비 페이즈에서만 사용 가능!');
            return;
        }
        
        const card = CardSystem.getCard(cardId);
        if (!card) return;
        
        this.game.state.hand.push(cardId);
        this.game.renderHand();
        
        const localName = typeof Localization !== 'undefined' 
            ? Localization.getCard(cardId)?.name || card.name 
            : card.name;
        
        this.showToast(`${localName} 추가됨!`);
    },
    
    // ==========================================
    // 몬스터 목록 갱신
    // ==========================================
    refreshMonsterList() {
        const grid = this.modal.querySelector('.cheat-monster-grid');
        grid.innerHTML = '';
        
        if (typeof MonsterPatterns === 'undefined' || !MonsterPatterns.patterns) {
            console.warn('[Cheat] MonsterPatterns 없음!');
            return;
        }
        
        const monsterIcons = {
            goblin: '👺',
            goblinArcher: '🏹',
            goblinShaman: '🔮',
            orc: '👹',
            skeleton: '💀',
            skeletonMage: '🧙',
            bigSlime: '🫧',
            slime: '💧',
            miniSlime: '💦'
        };
        
        for (const [monsterId, pattern] of Object.entries(MonsterPatterns.patterns)) {
            const monsterEl = document.createElement('div');
            monsterEl.className = 'cheat-monster';
            monsterEl.innerHTML = `
                <div class="cheat-monster-icon">${monsterIcons[monsterId] || '👾'}</div>
                <div class="cheat-monster-name">${pattern.nameKo || pattern.name}</div>
                <div class="cheat-monster-hp">HP: ${pattern.stats?.hp || '?'}</div>
            `;
            monsterEl.onclick = () => this.spawnMonster(monsterId);
            grid.appendChild(monsterEl);
        }
    },
    
    // ==========================================
    // 몬스터 소환
    // ==========================================
    async spawnMonster(monsterId) {
        if (this.game.state.phase !== 'prepare') {
            this.showToast('준비 페이즈에서만 사용 가능!');
            return;
        }
        
        // 랜덤 위치에 소환
        const arena = this.game.arena;
        const x = arena.playerZoneX + Math.floor(Math.random() * (arena.width - arena.playerZoneX));
        const z = Math.floor(Math.random() * arena.depth);
        
        const unit = await this.game.spawnEnemy(monsterId, z, x);
        
        if (unit) {
            const pattern = MonsterPatterns.getPattern(monsterId);
            this.showToast(`${pattern?.nameKo || monsterId} 소환!`);
        } else {
            this.showToast('소환 실패 (빈 칸 없음)');
        }
    },
    
    // ==========================================
    // 퀵 치트 실행
    // ==========================================
    executeQuickCheat(action) {
        switch (action) {
            case 'cost':
                this.restoreCost();
                break;
            case 'hp':
                this.restoreHP();
                break;
            case 'kill':
                this.killAllEnemies();
                break;
            case 'draw':
                this.drawCards();
                break;
            case 'block':
                this.addBlock();
                break;
            case 'damage':
                this.damageAllEnemies();
                break;
            case 'allcards':
                this.addAllCards();
                break;
        }
    },
    
    // ==========================================
    // 치트 기능들
    // ==========================================
    restoreCost() {
        this.game.state.cost = this.game.state.maxCost;
        this.game.updateCostUI();
        this.game.renderHand(false); // 카드 활성화 상태 갱신
        this.showToast('코스트 회복!');
    },
    
    restoreHP() {
        const hero = this.game.state.hero;
        if (hero) {
            hero.hp = hero.maxHp;
            this.game.updateHPUI();
            this.game.updateUnitHPBar(hero);
            this.showToast('체력 회복!');
        }
    },
    
    toggleMouseTrail() {
        if (typeof MouseTrail !== 'undefined') {
            MouseTrail.toggle();
            this.showToast(MouseTrail.enabled ? '마우스 트레일 ON' : '마우스 트레일 OFF');
        }
    },
    
    killAllEnemies() {
        this.game.state.enemyUnits.forEach(e => {
            if (e.hp > 0) this.game.killUnit(e);
        });
        this.showToast('모든 적 처치!');
    },
    
    drawCards() {
        if (this.game.state.phase !== 'prepare') {
            this.showToast('준비 페이즈에서만 사용 가능!');
            return;
        }
        this.game.drawCards(5);
        this.game.renderHand();
        this.showToast('5장 드로우!');
    },
    
    addBlock() {
        if (typeof ShieldSystem !== 'undefined' && this.game.state.hero) {
            ShieldSystem.addShield(this.game.state.hero, 20);
        } else {
            this.game.state.heroBlock += 20;
            if (this.game.state.hero) {
                this.game.state.hero.block = this.game.state.heroBlock;
                this.game.updateUnitHPBar(this.game.state.hero);
            }
            this.game.updateBlockUI();
        }
        this.showToast('+20 방어력!');
    },
    
    damageAllEnemies() {
        this.game.state.enemyUnits.forEach(e => {
            if (e.hp > 0) {
                this.game.dealDamage(e, 10);
            }
        });
        this.showToast('적 전체 10 대미지!');
    },
    
    addAllCards() {
        if (this.game.state.phase !== 'prepare') {
            this.showToast('준비 페이즈에서만 사용 가능!');
            return;
        }
        
        if (typeof CardSystem === 'undefined' || !CardSystem.cards) {
            this.showToast('CardSystem 없음!');
            return;
        }
        
        let count = 0;
        for (const cardId of Object.keys(CardSystem.cards)) {
            this.game.state.hand.push(cardId);
            count++;
        }
        
        this.game.renderHand();
        this.showToast(`모든 카드 ${count}장 추가됨!`);
    },
    
    // ==========================================
    // 토스트 메시지
    // ==========================================
    showToast(message) {
        const existing = document.querySelector('.cheat-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'cheat-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    },
    
    // ==========================================
    // 언어 설정
    // ==========================================
    changeLanguage(lang) {
        if (typeof Localization !== 'undefined') {
            Localization.setLanguage(lang);
            this.updateLangButtons();
            
            // UI 갱신
            if (typeof Localization.updateAllUI === 'function') {
                Localization.updateAllUI();
            }
            
            const langNames = { ko: '한국어', en: 'English', ja: '日本語' };
            this.showToast(`언어: ${langNames[lang] || lang}`);
        } else {
            console.warn('[Cheat] Localization 시스템 없음!');
        }
    },
    
    updateLangButtons() {
        if (!this.modal) return;
        
        const currentLang = typeof Localization !== 'undefined' 
            ? Localization.currentLanguage || 'ko' 
            : 'ko';
            
        this.modal.querySelectorAll('.cheat-lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    }
};

console.log('[CheatSystem] 치트 시스템 로드 완료');
