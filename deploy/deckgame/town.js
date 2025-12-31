// ==========================================
// 마을 시스템 (Town) - 트리스트람 스타일 월드맵
// ==========================================

const TownSystem = {
    // 초기화
    init() {
        this.createTownScreen();
    },
    
    // 마을 화면 생성
    createTownScreen() {
        const townScreen = document.createElement('div');
        townScreen.id = 'town-screen';
        townScreen.className = 'town-screen';
        
        townScreen.innerHTML = `
            <div class="town-worldmap">
                <!-- 배경 레이어 -->
                <div class="worldmap-bg"></div>
                <div class="worldmap-overlay"></div>
                <div class="worldmap-fog"></div>
                
                <!-- 화톳불 광원 효과 -->
                <div class="worldmap-firelight"></div>
                
                <!-- 불씨 파티클 -->
                <div class="worldmap-embers">
                    <div class="ember"></div>
                    <div class="ember"></div>
                    <div class="ember"></div>
                    <div class="ember"></div>
                    <div class="ember"></div>
                    <div class="ember"></div>
                    <div class="ember"></div>
                    <div class="ember"></div>
                </div>
                
                <!-- 재 파티클 -->
                <div class="worldmap-ash">
                    <div class="ash"></div>
                    <div class="ash"></div>
                    <div class="ash"></div>
                    <div class="ash"></div>
                    <div class="ash"></div>
                    <div class="ash"></div>
                </div>
                
                <!-- 마을 이름 -->
                <div class="town-header">
                    <h1 class="town-name">화톳불</h1>
                    <p class="town-subtitle">BONFIRE LIT</p>
                </div>
                
                <!-- 중앙: 던전 입구 (메인) -->
                <div class="worldmap-location dungeon-gate" id="town-dungeon">
                    <div class="location-structure">
                        <div class="dungeon-portal"></div>
                        <img src="monster.png" alt="던전" class="location-img" onerror="this.style.display='none'">
                    </div>
                    <div class="location-glow red"></div>
                    <div class="location-label">
                        <span class="label-icon">⚔️</span>
                        <span class="label-text">던전 입구</span>
                    </div>
                    <div class="location-hint">클릭하여 모험 시작!</div>
                </div>
                
                <!-- NPC 위치들 (원형 배치) -->
                <div class="worldmap-location npc-spot hoodgirl-spot ${this.isNpcRescued('hoodgirl') ? 'unlocked' : 'locked'}" id="town-npc-hoodgirl">
                    <div class="location-structure">
                        <div class="npc-house"></div>
                        <img src="hoodgirl.png" alt="후드 소녀" class="npc-sprite" onerror="this.style.display='none'">
                        ${!this.isNpcRescued('hoodgirl') ? '<div class="npc-lock-overlay"><span>🔒</span></div>' : ''}
                    </div>
                    <div class="location-glow pink"></div>
                    <div class="location-label">
                        <span class="label-icon">👤</span>
                        <span class="label-text">${this.isNpcRescued('hoodgirl') ? '후드 소녀' : '???'}</span>
                    </div>
                </div>
                
                <!-- 대장장이 NPC -->
                <div class="worldmap-location npc-spot blacksmith-spot ${this.isNpcRescued('blacksmith') ? 'unlocked' : 'locked'}" id="town-npc-blacksmith">
                    <div class="location-structure">
                        <div class="npc-house forge"></div>
                        <img src="blacksmith.png" alt="대장장이" class="npc-sprite" onerror="this.style.display='none'">
                        ${!this.isNpcRescued('blacksmith') ? '<div class="npc-lock-overlay"><span>🔒</span></div>' : ''}
                    </div>
                    <div class="location-glow orange"></div>
                    <div class="location-label">
                        <span class="label-icon">🔨</span>
                        <span class="label-text">${this.isNpcRescued('blacksmith') ? '대장장이' : '???'}</span>
                    </div>
                </div>
                
                <!-- 고고학자 엘프 NPC (항상 해금) -->
                <div class="worldmap-location npc-spot archaeologist-spot unlocked" id="town-npc-archaeologist">
                    <div class="location-structure">
                        <img src="elderelf.png" alt="고고학자" class="npc-sprite" onerror="this.style.display='none'">
                    </div>
                    <div class="location-glow purple"></div>
                    <div class="location-label">
                        <span class="label-icon">🏺</span>
                        <span class="label-text">고고학자</span>
                    </div>
                </div>
                
                <!-- 현자 NPC (전직소) - 항상 해금 -->
                <div class="worldmap-location npc-spot sage-spot unlocked" id="town-npc-sage">
                    <div class="location-structure">
                        <div class="sage-tower"></div>
                        <div class="sage-icon">
                            <img src="hoodgirl.png" alt="현자" class="sage-character-img">
                        </div>
                    </div>
                    <div class="location-glow blue"></div>
                    <div class="location-label">
                        <span class="label-icon">✨</span>
                        <span class="label-text">현자</span>
                    </div>
                    <div class="location-hint">직업 변경</div>
                </div>
                
                <!-- 미래 NPC 자리 (잠김) -->
                <div class="worldmap-location npc-spot future-npc locked" id="future-npc-1">
                    <div class="location-structure">
                        <div class="npc-house ruined"></div>
                        <div class="npc-lock-overlay"><span>🔒</span></div>
                    </div>
                    <div class="location-label">
                        <span class="label-text">???</span>
                    </div>
                </div>
                
                <!-- 타이틀로 돌아가기 -->
                <button class="town-back-btn" id="town-back">
                    <span>🏠</span> 타이틀로
                </button>
                
                <!-- 길 장식 -->
                <svg class="town-paths" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path class="path-line" d="M50,50 L50,25" />
                    <path class="path-line" d="M50,50 L25,35" />
                    <path class="path-line" d="M50,50 L75,35" />
                    <path class="path-line" d="M50,50 L20,60" />
                    <path class="path-line" d="M50,50 L80,60" />
                    <path class="path-line" d="M50,50 L35,75" />
                    <path class="path-line" d="M50,50 L65,75" />
                </svg>
            </div>
        `;
        
        document.body.appendChild(townScreen);
        
        // 이벤트 리스너
        this.setupEventListeners();
    },
    
    // NPC 구출 여부 확인
    isNpcRescued(npcId) {
        if (typeof RescueSystem !== 'undefined') {
            return RescueSystem.isRescued(npcId);
        }
        const saved = localStorage.getItem('lordofnight_rescued');
        const rescued = saved ? JSON.parse(saved) : {};
        return rescued[npcId] || false;
    },
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 던전 입구
        document.getElementById('town-dungeon').addEventListener('click', () => {
            this.enterDungeon();
        });
        
        // 타이틀로 돌아가기
        document.getElementById('town-back').addEventListener('click', () => {
            this.backToTitle();
        });
        
        // 후드 소녀 NPC
        document.getElementById('town-npc-hoodgirl').addEventListener('click', () => {
            if (this.isNpcRescued('hoodgirl')) {
                // HoodShop 시스템 사용
                if (typeof HoodShop !== 'undefined') {
                    HoodShop.open();
                } else {
                    this.openCharacterUpgrade(); // 폴백
                }
            } else {
                this.showLockedNpcMessage('hoodgirl');
            }
        });
        
        // 대장장이 NPC
        document.getElementById('town-npc-blacksmith').addEventListener('click', () => {
            if (this.isNpcRescued('blacksmith')) {
                this.openBlacksmith();
            } else {
                this.showLockedNpcMessage('blacksmith');
            }
        });
        
        // 고고학자 엘프 NPC (유물 장착)
        document.getElementById('town-npc-archaeologist').addEventListener('click', () => {
            this.openArchaeologist();
        });
        
        // 현자 NPC (전직소)
        document.getElementById('town-npc-sage')?.addEventListener('click', () => {
            this.openSage();
        });
        
        // 미래 NPC (준비중)
        document.getElementById('future-npc-1').addEventListener('click', () => {
            this.showLockedNpcMessage('future');
        });
    },
    
    // 현자 (전직소) 열기
    openSage() {
        if (typeof JobSystem !== 'undefined') {
            JobSystem.openJobChangeUI();
        } else {
            console.error('[Town] JobSystem not found');
        }
    },
    
    // 잠긴 NPC 메시지
    showLockedNpcMessage(npcId) {
        const messages = {
            hoodgirl: '던전 1층에서 고블린에게 잡혀있습니다.\n구출하면 마을에서 만날 수 있습니다.',
            blacksmith: '엘리트 던전에서 가시 수호자에게 잡혀있습니다.\n구출하면 마을에서 만날 수 있습니다.',
            future: '아직 발견되지 않은 장소입니다.\n더 깊은 던전을 탐험해보세요.'
        };
        
        const modal = document.createElement('div');
        modal.className = 'town-modal locked-npc-modal';
        modal.innerHTML = `
            <div class="town-modal-content">
                <div class="locked-npc-icon">🔒</div>
                <h2 class="modal-title">???</h2>
                <p class="locked-npc-message">${messages[npcId] || '아직 만나지 못한 인물입니다.'}</p>
                <button class="modal-close-btn">닫기</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
    },
    
    // 캐릭터 강화 (다크소울 스타일)
    selectedUpgradeIndex: 0,
    
    openCharacterUpgrade() {
        const upgrades = this.getUpgrades();
        this.selectedUpgradeIndex = 0;
        
        // 업그레이드 데이터
        this.upgradeData = [
            { type: 'maxHp', icon: '♥', name: '생명력 강화', desc: '최대 체력이 5 증가합니다.', cost: 100, amount: 5, max: 50, current: upgrades.maxHp || 0 },
            { type: 'energy', icon: '◆', name: '에너지 강화', desc: '시작 에너지가 1 증가합니다.', cost: 500, amount: 1, max: 2, current: upgrades.energy || 0 },
            { type: 'draw', icon: '▣', name: '드로우 강화', desc: '턴 시작 시 1장 더 뽑습니다.', cost: 400, amount: 1, max: 2, current: upgrades.draw || 0 },
            { type: 'startBlock', icon: '⬡', name: '시작 방어력', desc: '전투 시작 시 방어력 3 획득.', cost: 150, amount: 3, max: 15, current: upgrades.startBlock || 0 }
        ];
        
        const modal = document.createElement('div');
        modal.id = 'ds-upgrade-modal';
        modal.className = 'ds-upgrade-modal';
        modal.innerHTML = `
            <div class="ds-backdrop"></div>
            <div class="ds-upgrade-container">
                <!-- 왼쪽: 캐릭터 + 업그레이드 목록 -->
                <div class="ds-upgrade-left">
                    <div class="ds-title">
                        <span class="ds-title-line"></span>
                        <h1>강화</h1>
                        <span class="ds-title-line"></span>
                    </div>
                    
                    <div class="ds-upgrade-character">
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
                <div class="ds-upgrade-right" id="ds-upgrade-detail">
                    ${this.renderDSUpgradeDetail(0)}
                </div>
            </div>
            
            <!-- 골드 표시 -->
            <div class="ds-gold-display">
                <span class="ds-gold-icon">💰</span>
                <span class="ds-gold-value">${GoldSystem.getGold().toLocaleString()}</span>
            </div>
            
            <!-- 닫기 버튼 -->
            <button class="ds-close" onclick="TownSystem.closeUpgradeUI()">
                <span>×</span>
            </button>
        `;
        
        document.body.appendChild(modal);
        this.injectUpgradeStyles();
        
        // 키보드 이벤트
        this.upgradeKeyHandler = (e) => this.handleUpgradeKeyPress(e);
        document.addEventListener('keydown', this.upgradeKeyHandler);
        
        // 애니메이션
        requestAnimationFrame(() => {
            modal.classList.add('active');
            this.selectDSUpgrade(0);
        });
    },
    
    closeUpgradeUI() {
        const modal = document.getElementById('ds-upgrade-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 400);
        }
        if (this.upgradeKeyHandler) {
            document.removeEventListener('keydown', this.upgradeKeyHandler);
        }
    },
    
    handleUpgradeKeyPress(e) {
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.selectedUpgradeIndex = Math.max(0, this.selectedUpgradeIndex - 1);
                this.selectDSUpgrade(this.selectedUpgradeIndex);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.selectedUpgradeIndex = Math.min(this.upgradeData.length - 1, this.selectedUpgradeIndex + 1);
                this.selectDSUpgrade(this.selectedUpgradeIndex);
                break;
            case 'Enter':
                e.preventDefault();
                this.purchaseUpgrade(this.selectedUpgradeIndex);
                break;
            case 'Escape':
                e.preventDefault();
                this.closeUpgradeUI();
                break;
        }
    },
    
    renderDSUpgradeList() {
        return this.upgradeData.map((up, index) => {
            const isMaxed = up.current >= up.max;
            return `
                <div class="ds-upgrade-item ${isMaxed ? 'maxed' : ''}"
                     data-index="${index}"
                     onclick="TownSystem.selectDSUpgrade(${index})">
                    <span class="ds-upgrade-icon">${up.icon}</span>
                    <span class="ds-upgrade-name">${up.name}</span>
                    ${isMaxed ? '<span class="ds-maxed-mark">MAX</span>' : ''}
                </div>
            `;
        }).join('');
    },
    
    selectDSUpgrade(index) {
        this.selectedUpgradeIndex = index;
        
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
        const up = this.upgradeData[index];
        const isMaxed = up.current >= up.max;
        const canAfford = GoldSystem.getGold() >= up.cost;
        const progressPercent = (up.current / up.max) * 100;
        
        return `
            <div class="ds-upgrade-detail-content">
                <div class="ds-upgrade-header">
                    <span class="ds-upgrade-big-icon">${up.icon}</span>
                    <div class="ds-upgrade-title">
                        <h2>${up.name}</h2>
                    </div>
                </div>
                
                <div class="ds-divider"></div>
                
                <p class="ds-upgrade-desc">${up.desc}</p>
                
                <!-- 진행 상황 -->
                <div class="ds-progress-section">
                    <div class="ds-progress-label">
                        <span>진행도</span>
                        <span>+${up.current} / +${up.max}</span>
                    </div>
                    <div class="ds-progress-bar">
                        <div class="ds-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                
                <!-- 비용 -->
                <div class="ds-cost-section">
                    <span class="ds-cost-label">비용</span>
                    <span class="ds-cost-value ${!canAfford && !isMaxed ? 'insufficient' : ''}">
                        ${isMaxed ? '—' : `💰 ${up.cost.toLocaleString()}`}
                    </span>
                </div>
                
                <!-- 효과 -->
                <div class="ds-effect-section">
                    <span class="ds-effect-label">효과</span>
                    <span class="ds-effect-value">${up.icon} +${up.amount}</span>
                </div>
                
                <!-- 구매 버튼 -->
                <button class="ds-purchase-btn ${isMaxed ? 'maxed' : ''} ${!canAfford ? 'disabled' : ''}" 
                        onclick="TownSystem.purchaseUpgrade(${index})"
                        ${isMaxed || !canAfford ? 'disabled' : ''}>
                    ${isMaxed ? '최대 강화' : (!canAfford ? '골드 부족' : '강화하기')}
                </button>
            </div>
        `;
    },
    
    purchaseUpgrade(index) {
        const up = this.upgradeData[index];
        if (up.current >= up.max) return;
        
        if (GoldSystem.spendGold(up.cost)) {
            const upgrades = this.getUpgrades();
            upgrades[up.type] = (upgrades[up.type] || 0) + up.amount;
            this.saveUpgrades(upgrades);
            
            // 데이터 갱신
            up.current = upgrades[up.type];
            
            // 성공 효과
            this.showUpgradeEffect(up.type, up.amount);
            
            // UI 갱신
            document.getElementById('ds-upgrade-list').innerHTML = this.renderDSUpgradeList();
            this.selectDSUpgrade(index);
            
            // 골드 갱신
            document.querySelector('.ds-gold-value').textContent = GoldSystem.getGold().toLocaleString();
            
            this.updatePlayerStatus();
            GoldSystem.updateDisplay();
        }
    },
    
    injectUpgradeStyles() {
        if (document.getElementById('ds-upgrade-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ds-upgrade-styles';
        style.textContent = `
            /* 다크소울 스타일 업그레이드 UI */
            .ds-upgrade-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            
            .ds-upgrade-modal.active {
                opacity: 1;
            }
            
            .ds-upgrade-modal .ds-backdrop {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%);
            }
            
            .ds-upgrade-modal .ds-title {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .ds-upgrade-modal .ds-title h1 {
                margin: 0;
                font-family: 'Cinzel', 'Times New Roman', serif;
                font-size: 1.8rem;
                font-weight: 400;
                color: #c8b896;
                letter-spacing: 8px;
                text-transform: uppercase;
            }
            
            .ds-upgrade-modal .ds-title-line {
                flex: 1;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(180, 160, 120, 0.5), transparent);
            }
            
            .ds-upgrade-modal .ds-hint {
                margin-top: auto;
                padding-top: 30px;
                display: flex;
                gap: 24px;
                font-size: 0.75rem;
                color: #5a5040;
                font-family: 'Cinzel', serif;
                letter-spacing: 1px;
            }
            
            .ds-upgrade-modal .ds-divider {
                height: 1px;
                background: linear-gradient(90deg, rgba(180, 160, 120, 0.5), transparent);
                margin: 24px 0;
            }
            
            .ds-upgrade-modal .ds-close {
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
            
            .ds-upgrade-modal .ds-close:hover {
                border-color: #d4af37;
                color: #c8b896;
            }
            
            .ds-upgrade-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                padding: 60px 80px;
                box-sizing: border-box;
            }
            
            /* 왼쪽 패널 */
            .ds-upgrade-left {
                width: 320px;
                display: flex;
                flex-direction: column;
                padding-right: 60px;
                border-right: 1px solid rgba(180, 160, 120, 0.3);
            }
            
            .ds-upgrade-character {
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
            
            .ds-upgrade-list {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .ds-upgrade-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 14px 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-left: 2px solid transparent;
            }
            
            .ds-upgrade-item:hover:not(.maxed) {
                background: rgba(255, 255, 255, 0.03);
            }
            
            .ds-upgrade-item.selected {
                background: rgba(255, 255, 255, 0.05);
                border-left-color: #d4af37;
            }
            
            .ds-upgrade-item.selected .ds-upgrade-name {
                color: #f5e6c4;
            }
            
            .ds-upgrade-item.maxed {
                opacity: 0.4;
            }
            
            .ds-upgrade-icon {
                font-size: 1.4rem;
                color: #d4af37;
                width: 30px;
                text-align: center;
            }
            
            .ds-upgrade-name {
                flex: 1;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #a09080;
                letter-spacing: 2px;
                transition: color 0.2s;
            }
            
            .ds-maxed-mark {
                font-size: 0.7rem;
                color: #6a6050;
                letter-spacing: 1px;
            }
            
            /* 오른쪽 패널 */
            .ds-upgrade-right {
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
                letter-spacing: 1px;
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
            
            /* 비용/효과 섹션 */
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
            
            .ds-purchase-btn:disabled,
            .ds-purchase-btn.maxed,
            .ds-purchase-btn.disabled {
                opacity: 0.4;
                cursor: not-allowed;
                border-color: rgba(100, 90, 70, 0.3);
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
            
            /* 반응형 - 태블릿 */
            @media (max-width: 1024px) {
                .ds-upgrade-container {
                    padding: 40px;
                    flex-direction: column;
                    overflow-y: auto;
                }
                
                .ds-upgrade-left {
                    width: 100%;
                    border-right: none;
                    border-bottom: 1px solid rgba(180, 160, 120, 0.3);
                    padding-right: 0;
                    padding-bottom: 30px;
                    margin-bottom: 30px;
                }
                
                .ds-upgrade-character {
                    height: 150px;
                }
                
                .ds-hoodgirl-img {
                    max-height: 130px;
                }
                
                .ds-upgrade-list {
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .ds-upgrade-item {
                    padding: 10px 16px;
                    border-left: none;
                    border-bottom: 2px solid transparent;
                }
                
                .ds-upgrade-item.selected {
                    border-bottom-color: #d4af37;
                }
                
                .ds-hint {
                    display: none;
                }
                
                .ds-upgrade-right {
                    padding-left: 0;
                }
            }
            
            /* 반응형 - 모바일 */
            @media (max-width: 600px) {
                .ds-upgrade-container {
                    padding: 20px;
                    padding-top: 80px;
                }
                
                .ds-upgrade-character {
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
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 강화 효과 표시
    showUpgradeEffect(type, amount) {
        const icons = {
            maxHp: '❤️',
            energy: '⚡',
            draw: '🃏',
            startBlock: '🛡️'
        };
        
        const popup = document.createElement('div');
        popup.className = 'upgrade-popup';
        popup.innerHTML = `${icons[type]} +${amount}`;
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
    
    // 고고학자 열기 (유물 장착)
    openArchaeologist() {
        if (typeof RelicLoadoutSystem !== 'undefined') {
            RelicLoadoutSystem.showRelicSelectModal();
        } else {
            this.showMessage('유물 시스템을 불러오는 중...');
        }
    },
    
    // 대장장이 열기 (카드 강화) - 다크소울 스타일
    openBlacksmith() {
        this.blacksmithSelectedIndex = 0;
        this.blacksmithDeck = this.getPlayerDeck() || [];
        
        const modal = document.createElement('div');
        modal.className = 'ds-blacksmith-modal';
        modal.id = 'ds-blacksmith-modal';
        modal.innerHTML = this.renderDSBlacksmithContent();
        
        document.body.appendChild(modal);
        this.injectBlacksmithStyles();
        
        // 키보드 이벤트
        this.blacksmithKeyHandler = (e) => this.handleBlacksmithKeyPress(e);
        document.addEventListener('keydown', this.blacksmithKeyHandler);
        
        // 애니메이션
        requestAnimationFrame(() => {
            modal.classList.add('active');
            this.selectBlacksmithCard(0);
        });
    },
    
    closeBlacksmith() {
        const modal = document.getElementById('ds-blacksmith-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 400);
        }
        if (this.blacksmithKeyHandler) {
            document.removeEventListener('keydown', this.blacksmithKeyHandler);
        }
    },
    
    handleBlacksmithKeyPress(e) {
        const deck = this.blacksmithDeck;
        if (!deck || deck.length === 0) return;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.blacksmithSelectedIndex = Math.max(0, this.blacksmithSelectedIndex - 1);
                this.selectBlacksmithCard(this.blacksmithSelectedIndex);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.blacksmithSelectedIndex = Math.min(deck.length - 1, this.blacksmithSelectedIndex + 1);
                this.selectBlacksmithCard(this.blacksmithSelectedIndex);
                break;
            case 'Enter':
                e.preventDefault();
                this.performDSUpgrade();
                break;
            case 'Escape':
                e.preventDefault();
                this.closeBlacksmith();
                break;
        }
    },
    
    renderDSBlacksmithContent() {
        return `
            <div class="ds-backdrop"></div>
            <div class="ds-blacksmith-container">
                <!-- 왼쪽: 대장장이 + 카드 목록 -->
                <div class="ds-blacksmith-left">
                    <div class="ds-title">
                        <span class="ds-title-line"></span>
                        <h1>카드 강화</h1>
                        <span class="ds-title-line"></span>
                    </div>
                    
                    <div class="ds-blacksmith-character">
                        <img src="blacksmith.png" alt="대장장이" class="ds-blacksmith-img">
                    </div>
                    
                    <div class="ds-card-list" id="ds-card-list">
                        ${this.renderDSCardList()}
                    </div>
                    
                    <div class="ds-hint">
                        <span>↑↓ 선택</span>
                        <span>ENTER 강화</span>
                        <span>ESC 닫기</span>
                    </div>
                </div>
                
                <!-- 오른쪽: 카드 비교 -->
                <div class="ds-blacksmith-right" id="ds-card-detail">
                    ${this.renderDSCardDetail(0)}
                </div>
            </div>
            
            <!-- 골드 표시 -->
            <div class="ds-gold-display">
                <span class="ds-gold-icon">💰</span>
                <span class="ds-gold-value" id="ds-blacksmith-gold">${GoldSystem.getGold().toLocaleString()}</span>
            </div>
            
            <!-- 닫기 버튼 -->
            <button class="ds-close" onclick="TownSystem.closeBlacksmith()">
                <span>×</span>
            </button>
        `;
    },
    
    renderDSCardList() {
        const deck = this.blacksmithDeck;
        if (!deck || deck.length === 0) {
            return '<div class="ds-no-cards">덱에 카드가 없습니다.</div>';
        }
        
        return deck.map((card, index) => {
            const canUpgrade = CardUpgradeSystem.canUpgrade(card.id) && !CardUpgradeSystem.isUpgraded(card.id);
            const isUpgraded = CardUpgradeSystem.isUpgraded(card.id);
            const typeColor = card.type === 'attack' ? '#b54a4a' : '#4a6ab5';
            
            return `
                <div class="ds-card-item ${isUpgraded ? 'upgraded' : ''} ${canUpgrade ? 'upgradable' : ''}"
                     data-index="${index}"
                     onclick="TownSystem.selectBlacksmithCard(${index})">
                    <span class="ds-card-cost" style="background: ${typeColor}">${card.cost}</span>
                    <span class="ds-card-name">${card.name}</span>
                    ${isUpgraded ? '<span class="ds-upgraded-mark">✦</span>' : ''}
                    ${canUpgrade ? '<span class="ds-can-upgrade">⚒</span>' : ''}
                </div>
            `;
        }).join('');
    },
    
    selectBlacksmithCard(index) {
        const deck = this.blacksmithDeck;
        if (!deck || index >= deck.length) return;
        
        this.blacksmithSelectedIndex = index;
        
        // 리스트 선택 표시
        document.querySelectorAll('.ds-card-item').forEach((el, i) => {
            el.classList.toggle('selected', i === index);
        });
        
        // 선택된 항목 스크롤
        const selectedEl = document.querySelector('.ds-card-item.selected');
        selectedEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // 상세 정보 업데이트
        const detail = document.getElementById('ds-card-detail');
        if (detail) {
            detail.innerHTML = this.renderDSCardDetail(index);
        }
    },
    
    renderDSCardDetail(index) {
        const deck = this.blacksmithDeck;
        if (!deck || deck.length === 0) {
            return '<div class="ds-no-selection">카드가 없습니다.</div>';
        }
        
        const card = deck[index];
        if (!card) return '';
        
        const canUpgrade = CardUpgradeSystem.canUpgrade(card.id) && !CardUpgradeSystem.isUpgraded(card.id);
        const isUpgraded = CardUpgradeSystem.isUpgraded(card.id);
        const cost = CardUpgradeSystem.getUpgradeCost(card.id);
        const canAfford = GoldSystem.getGold() >= cost;
        
        // 이미 강화됨
        if (isUpgraded) {
            return `
                <div class="ds-card-detail-content">
                    <div class="ds-card-display-single">
                        <div class="ds-large-card upgraded">
                            <div class="ds-lc-cost">${card.cost}</div>
                            <div class="ds-lc-icon">${this.getCardIconHtml(card)}</div>
                            <div class="ds-lc-name">${card.name}</div>
                            <div class="ds-lc-desc">${card.description}</div>
                            <div class="ds-lc-upgraded-badge">강화됨</div>
                        </div>
                    </div>
                    <div class="ds-status-message upgraded">
                        <span>✦</span> 이미 강화된 카드입니다
                    </div>
                </div>
            `;
        }
        
        // 강화 불가
        if (!canUpgrade) {
            return `
                <div class="ds-card-detail-content">
                    <div class="ds-card-display-single">
                        <div class="ds-large-card">
                            <div class="ds-lc-cost">${card.cost}</div>
                            <div class="ds-lc-icon">${this.getCardIconHtml(card)}</div>
                            <div class="ds-lc-name">${card.name}</div>
                            <div class="ds-lc-desc">${card.description}</div>
                        </div>
                    </div>
                    <div class="ds-status-message cannot">
                        <span>—</span> 강화할 수 없는 카드입니다
                    </div>
                </div>
            `;
        }
        
        // 강화 가능 - 비교 표시
        const comparison = CardUpgradeSystem.getComparisonData(card.id);
        
        // 비교 데이터가 없으면 현재 카드만 표시
        if (!comparison || !comparison.base || !comparison.upgraded) {
            return `
                <div class="ds-card-detail-content">
                    <div class="ds-card-display-single">
                        <div class="ds-large-card">
                            <div class="ds-lc-cost">${card.cost}</div>
                            <div class="ds-lc-icon">${this.getCardIconHtml(card)}</div>
                            <div class="ds-lc-name">${card.name}</div>
                            <div class="ds-lc-desc">${card.description}</div>
                        </div>
                    </div>
                    <div class="ds-status-message">
                        <span>⚒</span> 강화 데이터 준비 중...
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="ds-card-detail-content">
                <div class="ds-card-comparison">
                    <!-- 기존 카드 -->
                    <div class="ds-comparison-card">
                        <div class="ds-comparison-label">현재</div>
                        <div class="ds-large-card">
                            <div class="ds-lc-cost">${comparison.base.cost}</div>
                            <div class="ds-lc-icon">${this.getCardIconHtml(comparison.base)}</div>
                            <div class="ds-lc-name">${comparison.base.name}</div>
                            <div class="ds-lc-desc">${comparison.base.description}</div>
                        </div>
                    </div>
                    
                    <!-- 화살표 -->
                    <div class="ds-comparison-arrow">
                        <span class="ds-arrow-icon">⚒</span>
                    </div>
                    
                    <!-- 강화 후 카드 -->
                    <div class="ds-comparison-card">
                        <div class="ds-comparison-label">강화 후</div>
                        <div class="ds-large-card upgraded">
                            <div class="ds-lc-cost">${comparison.upgraded.cost}</div>
                            <div class="ds-lc-icon">${this.getCardIconHtml(comparison.upgraded)}</div>
                            <div class="ds-lc-name">${comparison.upgraded.name}</div>
                            <div class="ds-lc-desc">${comparison.upgraded.description}</div>
                        </div>
                    </div>
                </div>
                
                <!-- 비용 -->
                <div class="ds-upgrade-cost">
                    <span class="ds-cost-label">강화 비용</span>
                    <span class="ds-cost-value ${!canAfford ? 'insufficient' : ''}">💰 ${cost.toLocaleString()}</span>
                </div>
                
                <!-- 강화 버튼 -->
                <button class="ds-forge-btn ${!canAfford ? 'disabled' : ''}" 
                        onclick="TownSystem.performDSUpgrade()"
                        ${!canAfford ? 'disabled' : ''}>
                    ${!canAfford ? '골드 부족' : '강화하기'}
                </button>
            </div>
        `;
    },
    
    performDSUpgrade() {
        const card = this.blacksmithDeck[this.blacksmithSelectedIndex];
        if (!card) return;
        
        const canUpgrade = CardUpgradeSystem.canUpgrade(card.id) && !CardUpgradeSystem.isUpgraded(card.id);
        if (!canUpgrade) return;
        
        const cost = CardUpgradeSystem.getUpgradeCost(card.id);
        if (GoldSystem.getGold() < cost) return;
        
        // 골드 차감
        GoldSystem.addGold(-cost);
        
        // 카드 강화
        const upgradedCard = CardUpgradeSystem.createUpgradedCard(card.id);
        if (upgradedCard) {
            this.blacksmithDeck[this.blacksmithSelectedIndex] = upgradedCard;
            this.savePlayerDeck(this.blacksmithDeck);
            
            // 🔨 망치 강화 연출!
            this.showForgeHammerEffect(card.id, () => {
                // UI 갱신
                document.getElementById('ds-card-list').innerHTML = this.renderDSCardList();
                document.getElementById('ds-blacksmith-gold').textContent = GoldSystem.getGold().toLocaleString();
                this.selectBlacksmithCard(this.blacksmithSelectedIndex);
            });
        }
    },
    
    showDSForgeEffect(callback) {
        const effect = document.createElement('div');
        effect.className = 'ds-forge-effect';
        effect.innerHTML = `
            <div class="ds-forge-flash"></div>
            <div class="ds-forge-text">강화 완료!</div>
        `;
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
            if (callback) callback();
        }, 800);
    },
    
    // 🔨 대장장이 망치 강화 연출
    showForgeHammerEffect(cardId, callback) {
        const comparison = CardUpgradeSystem.getComparisonData(cardId);
        if (!comparison) {
            console.warn('[Forge] 비교 데이터 없음:', cardId);
            if (callback) callback();
            return;
        }
        
        this.injectForgeUpgradeStyles();
        
        const overlay = document.createElement('div');
        overlay.className = 'forge-upgrade-overlay';
        overlay.innerHTML = `
            <div class="forge-upgrade-scene">
                <!-- 배경 불꽃 -->
                <div class="forge-fire-bg"></div>
                
                <!-- 모루 -->
                <div class="forge-anvil">
                    <div class="anvil-body">🪨</div>
                    <div class="anvil-glow"></div>
                </div>
                
                <!-- 원래 카드 (모루 위) -->
                <div class="forge-card-on-anvil">
                    <div class="forge-base-card">
                        <div class="fc-cost">${comparison.base.cost}</div>
                        <div class="fc-icon">${this.getCardIconHtml(comparison.base)}</div>
                        <div class="fc-name">${comparison.base.name}</div>
                    </div>
                </div>
                
                <!-- 망치 -->
                <div class="forge-hammer">🔨</div>
                
                <!-- 타격 이펙트 -->
                <div class="forge-impact-effects">
                    <div class="impact-ring"></div>
                    <div class="impact-sparks"></div>
                </div>
                
                <!-- 타격 텍스트 -->
                <div class="forge-hit-text"></div>
                
                <!-- 변형된 카드 (결과) -->
                <div class="forge-upgraded-card hidden">
                    <div class="upgraded-glow"></div>
                    <div class="forge-result-card">
                        <div class="fc-cost">${comparison.upgraded.cost}</div>
                        <div class="fc-icon">${this.getCardIconHtml(comparison.upgraded)}</div>
                        <div class="fc-name">${comparison.upgraded.name}</div>
                    </div>
                    <div class="upgrade-aura"></div>
                </div>
                
                <!-- 완료 텍스트 -->
                <div class="forge-complete-text hidden">
                    <span class="complete-icon">⚒️</span>
                    <span class="complete-main">강화 완료!</span>
                    <span class="complete-sub">${comparison.upgraded.name}</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 애니메이션 시퀀스
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            
            const hammer = overlay.querySelector('.forge-hammer');
            const hitText = overlay.querySelector('.forge-hit-text');
            const impact = overlay.querySelector('.forge-impact-effects');
            const baseCard = overlay.querySelector('.forge-base-card');
            const upgradedSection = overlay.querySelector('.forge-upgraded-card');
            const completeText = overlay.querySelector('.forge-complete-text');
            const scene = overlay.querySelector('.forge-upgrade-scene');
            
            // 1단계: 망치 1타 (400ms)
            setTimeout(() => {
                this.playHammerHit(hammer, hitText, impact, baseCard, scene, '땅!', 1);
            }, 400);
            
            // 2단계: 망치 2타 (900ms)
            setTimeout(() => {
                this.playHammerHit(hammer, hitText, impact, baseCard, scene, '땅!', 2);
            }, 900);
            
            // 3단계: 망치 3타 - 강타 (1400ms)
            setTimeout(() => {
                this.playHammerHit(hammer, hitText, impact, baseCard, scene, '땅!!', 3);
            }, 1400);
            
            // 4단계: 카드 변환 (2000ms)
            setTimeout(() => {
                baseCard.classList.add('transforming');
                overlay.querySelector('.forge-card-on-anvil').classList.add('burning');
                
                // 스파크 폭발
                this.createSparkBurst(scene);
            }, 2000);
            
            // 5단계: 업그레이드 카드 등장 (2500ms)
            setTimeout(() => {
                overlay.querySelector('.forge-card-on-anvil').classList.add('hidden');
                upgradedSection.classList.remove('hidden');
                upgradedSection.classList.add('reveal');
                
                // 완료 텍스트
                setTimeout(() => {
                    completeText.classList.remove('hidden');
                    completeText.classList.add('show');
                }, 300);
            }, 2500);
            
            // 6단계: 종료 (3800ms)
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                    if (callback) callback();
                }, 400);
            }, 3800);
        });
    },
    
    // 망치 타격 연출
    playHammerHit(hammer, hitText, impact, card, scene, text, hitNum) {
        // 망치 내려치기
        hammer.classList.add('striking');
        
        setTimeout(() => {
            hammer.classList.remove('striking');
            hammer.classList.add('hit');
            
            // 충격파
            impact.classList.add('active');
            
            // 카드 흔들림
            card.classList.add('shake');
            
            // 타격 텍스트
            hitText.textContent = text;
            hitText.className = 'forge-hit-text show hit-' + hitNum;
            
            // 화면 흔들림
            scene?.classList.add('screen-shake');
            
            // 효과 제거
            setTimeout(() => {
                hammer.classList.remove('hit');
                impact.classList.remove('active');
                card.classList.remove('shake');
                hitText.classList.remove('show');
                scene?.classList.remove('screen-shake');
            }, 200);
        }, 150);
    },
    
    // 스파크 폭발 생성
    createSparkBurst(scene) {
        const sparkCount = 20;
        
        for (let i = 0; i < sparkCount; i++) {
            const spark = document.createElement('div');
            spark.className = 'forge-spark-particle';
            const angle = (i / sparkCount) * 360;
            const distance = 80 + Math.random() * 120;
            const duration = 0.4 + Math.random() * 0.4;
            
            spark.style.cssText = `
                --angle: ${angle}deg;
                --distance: ${distance}px;
                --duration: ${duration}s;
                --delay: ${Math.random() * 0.1}s;
            `;
            scene.appendChild(spark);
            
            setTimeout(() => spark.remove(), 1000);
        }
    },
    
    injectBlacksmithStyles() {
        if (document.getElementById('ds-blacksmith-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ds-blacksmith-styles';
        style.textContent = `
            /* 다크소울 스타일 대장장이 UI */
            .ds-blacksmith-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            
            .ds-blacksmith-modal.active {
                opacity: 1;
            }
            
            .ds-blacksmith-modal .ds-backdrop {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%);
            }
            
            .ds-blacksmith-modal .ds-title {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .ds-blacksmith-modal .ds-title h1 {
                margin: 0;
                font-family: 'Cinzel', serif;
                font-size: 1.6rem;
                color: #c8b896;
                letter-spacing: 6px;
            }
            
            .ds-blacksmith-modal .ds-title-line {
                flex: 1;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(180, 160, 120, 0.5), transparent);
            }
            
            .ds-blacksmith-modal .ds-hint {
                margin-top: auto;
                padding-top: 20px;
                display: flex;
                gap: 20px;
                font-size: 0.75rem;
                color: #5a5040;
                font-family: 'Cinzel', serif;
            }
            
            .ds-blacksmith-modal .ds-close {
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
            
            .ds-blacksmith-modal .ds-close:hover {
                border-color: #d4af37;
                color: #c8b896;
            }
            
            .ds-blacksmith-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                padding: 60px 80px;
                box-sizing: border-box;
            }
            
            /* 왼쪽 패널 */
            .ds-blacksmith-left {
                width: 300px;
                display: flex;
                flex-direction: column;
                padding-right: 40px;
                border-right: 1px solid rgba(180, 160, 120, 0.3);
            }
            
            .ds-blacksmith-character {
                display: flex;
                justify-content: center;
                align-items: flex-end;
                height: 160px;
                margin-bottom: 20px;
                background: radial-gradient(ellipse at bottom, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            }
            
            .ds-blacksmith-img {
                max-height: 140px;
                image-rendering: pixelated;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
            }
            
            .ds-card-list {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 2px;
                overflow-y: auto;
                padding-right: 8px;
            }
            
            .ds-card-list::-webkit-scrollbar {
                width: 4px;
            }
            
            .ds-card-list::-webkit-scrollbar-thumb {
                background: rgba(212, 175, 55, 0.3);
            }
            
            .ds-card-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-left: 2px solid transparent;
            }
            
            .ds-card-item:hover {
                background: rgba(255, 255, 255, 0.03);
            }
            
            .ds-card-item.selected {
                background: rgba(255, 255, 255, 0.05);
                border-left-color: #d4af37;
            }
            
            .ds-card-item.upgraded {
                opacity: 0.5;
            }
            
            .ds-card-item.upgradable {
                background: rgba(212, 175, 55, 0.05);
            }
            
            .ds-card-cost {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: bold;
                color: #fff;
            }
            
            .ds-card-name {
                flex: 1;
                font-size: 0.9rem;
                color: #a09080;
            }
            
            .ds-card-item.selected .ds-card-name {
                color: #f5e6c4;
            }
            
            .ds-upgraded-mark {
                color: #d4af37;
                font-size: 0.8rem;
            }
            
            .ds-can-upgrade {
                color: #d4af37;
                font-size: 0.9rem;
            }
            
            /* 오른쪽 패널 */
            .ds-blacksmith-right {
                flex: 1;
                padding-left: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ds-card-detail-content {
                width: 100%;
                max-width: 600px;
            }
            
            .ds-card-comparison {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 30px;
                margin-bottom: 40px;
            }
            
            .ds-comparison-card {
                text-align: center;
            }
            
            .ds-comparison-label {
                font-size: 0.85rem;
                color: #6a6050;
                margin-bottom: 12px;
                letter-spacing: 2px;
            }
            
            .ds-comparison-arrow {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            
            .ds-arrow-icon {
                font-size: 2rem;
                color: #d4af37;
            }
            
            /* 큰 카드 */
            .ds-large-card {
                width: 160px;
                height: 220px;
                background: linear-gradient(160deg, #252535 0%, #15151f 100%);
                border: 2px solid #4a4a6a;
                border-radius: 10px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
            }
            
            .ds-large-card.upgraded {
                border-color: #d4af37;
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
            }
            
            .ds-lc-cost {
                position: absolute;
                top: -10px;
                left: -10px;
                width: 30px;
                height: 30px;
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #1a1a1a;
            }
            
            .ds-lc-icon {
                font-size: 2.5rem;
                margin: 10px 0;
            }
            
            .ds-lc-icon img {
                width: 50px;
                height: 50px;
            }
            
            .ds-lc-name {
                font-size: 0.95rem;
                font-weight: bold;
                color: #f5e6c4;
                margin-bottom: 8px;
                text-align: center;
            }
            
            .ds-lc-desc {
                font-size: 0.7rem;
                color: #a09080;
                text-align: center;
                line-height: 1.4;
            }
            
            .ds-lc-upgraded-badge {
                position: absolute;
                bottom: 10px;
                background: rgba(212, 175, 55, 0.2);
                border: 1px solid rgba(212, 175, 55, 0.5);
                color: #d4af37;
                padding: 3px 10px;
                font-size: 0.7rem;
            }
            
            .ds-card-display-single {
                display: flex;
                justify-content: center;
                margin-bottom: 30px;
            }
            
            .ds-status-message {
                text-align: center;
                font-size: 1rem;
                padding: 20px;
                border: 1px solid rgba(180, 160, 120, 0.2);
            }
            
            .ds-status-message.upgraded {
                color: #d4af37;
            }
            
            .ds-status-message.cannot {
                color: #6a6050;
            }
            
            /* 비용 & 버튼 */
            .ds-upgrade-cost {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 0;
                border-top: 1px solid rgba(180, 160, 120, 0.2);
                border-bottom: 1px solid rgba(180, 160, 120, 0.2);
                margin-bottom: 24px;
            }
            
            .ds-cost-label {
                font-size: 0.9rem;
                color: #6a6050;
                letter-spacing: 2px;
            }
            
            .ds-cost-value {
                font-family: 'Cinzel', serif;
                font-size: 1.3rem;
                color: #d4af37;
            }
            
            .ds-cost-value.insufficient {
                color: #b54a4a;
            }
            
            .ds-forge-btn {
                width: 100%;
                padding: 18px 32px;
                background: transparent;
                border: 1px solid rgba(212, 175, 55, 0.5);
                color: #c8b896;
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                letter-spacing: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .ds-forge-btn:hover:not(:disabled) {
                background: rgba(212, 175, 55, 0.1);
                border-color: #d4af37;
                color: #f5e6c4;
                box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
            }
            
            .ds-forge-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            
            /* 골드 표시 */
            .ds-blacksmith-modal .ds-gold-display {
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
            
            .ds-blacksmith-modal .ds-gold-icon {
                font-size: 1.3rem;
            }
            
            .ds-blacksmith-modal .ds-gold-value {
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #d4af37;
                letter-spacing: 2px;
            }
            
            /* 강화 효과 */
            .ds-forge-effect {
                position: fixed;
                inset: 0;
                z-index: 20000;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            }
            
            .ds-forge-flash {
                position: absolute;
                inset: 0;
                background: rgba(212, 175, 55, 0.3);
                animation: forgeFlash 0.8s ease-out;
            }
            
            .ds-forge-text {
                font-family: 'Cinzel', serif;
                font-size: 3rem;
                color: #f5e6c4;
                text-shadow: 0 0 40px rgba(212, 175, 55, 0.8);
                animation: forgeText 0.8s ease-out;
            }
            
            @keyframes forgeFlash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            @keyframes forgeText {
                0% { transform: scale(0.5); opacity: 0; }
                30% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 0; }
            }
            
            /* 반응형 */
            @media (max-width: 1024px) {
                .ds-blacksmith-container {
                    padding: 40px;
                    flex-direction: column;
                    overflow-y: auto;
                }
                
                .ds-blacksmith-left {
                    width: 100%;
                    border-right: none;
                    border-bottom: 1px solid rgba(180, 160, 120, 0.3);
                    padding-right: 0;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                
                .ds-blacksmith-character {
                    height: 120px;
                }
                
                .ds-card-list {
                    max-height: 150px;
                }
                
                .ds-blacksmith-modal .ds-hint {
                    display: none;
                }
                
                .ds-blacksmith-right {
                    padding-left: 0;
                }
                
                .ds-card-comparison {
                    flex-direction: column;
                    gap: 20px;
                }
                
                .ds-comparison-arrow {
                    transform: rotate(90deg);
                }
            }
            
            @media (max-width: 600px) {
                .ds-blacksmith-container {
                    padding: 20px;
                    padding-top: 80px;
                }
                
                .ds-large-card {
                    width: 130px;
                    height: 180px;
                }
                
                .ds-lc-icon {
                    font-size: 2rem;
                }
                
                .ds-blacksmith-modal .ds-close {
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
    
    // 카드 강화 실행 (새 버전)
    performCardUpgradeNew(cardIndex, modal) {
        const card = this.blacksmithDeck[cardIndex];
        if (!card) return;
        
        const cost = CardUpgradeSystem.getUpgradeCost(card.id);
        
        if (GoldSystem.getGold() < cost) {
            this.showUpgradeMessage('골드가 부족합니다!', 'error');
            return;
        }
        
        // 골드 차감
        GoldSystem.addGold(-cost);
        
        // 카드 강화
        const upgradedCard = CardUpgradeSystem.createUpgradedCard(card.id);
        if (upgradedCard) {
            this.blacksmithDeck[cardIndex] = upgradedCard;
            this.savePlayerDeck(this.blacksmithDeck);
            
            // 강화 효과 표시
            this.showUpgradeEffectNew(modal, card.id, () => {
                // UI 업데이트
                modal.querySelector('#blacksmith-gold').textContent = GoldSystem.getGold().toLocaleString();
                
                // 슬라이더 재렌더링
                this.renderSliderCards(modal);
                this.updateSelectedCardPanel(modal);
            });
        }
    },
    
    // 강화 효과 (새 버전) - 대장장이 망치 연출
    showUpgradeEffectNew(modal, cardId, callback) {
        const comparison = CardUpgradeSystem.getComparisonData(cardId);
        if (!comparison) {
            if (callback) callback();
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'forge-upgrade-overlay';
        overlay.innerHTML = `
            <div class="forge-upgrade-scene">
                <!-- 배경 불꽃 -->
                <div class="forge-fire-bg"></div>
                
                <!-- 모루 -->
                <div class="forge-anvil">
                    <div class="anvil-body">🪨</div>
                    <div class="anvil-glow"></div>
                </div>
                
                <!-- 원래 카드 (모루 위) -->
                <div class="forge-card-on-anvil">
                    <div class="forge-base-card">
                        <div class="fc-cost">${comparison.base.cost}</div>
                        <div class="fc-icon">${this.getCardIconHtml(comparison.base)}</div>
                        <div class="fc-name">${comparison.base.name}</div>
                    </div>
                </div>
                
                <!-- 망치 -->
                <div class="forge-hammer">🔨</div>
                
                <!-- 타격 이펙트 -->
                <div class="forge-impact-effects">
                    <div class="impact-ring"></div>
                    <div class="impact-sparks"></div>
                </div>
                
                <!-- 타격 텍스트 -->
                <div class="forge-hit-text"></div>
                
                <!-- 변형된 카드 (결과) -->
                <div class="forge-upgraded-card hidden">
                    <div class="upgraded-glow"></div>
                    <div class="forge-result-card">
                        <div class="fc-cost">${comparison.upgraded.cost}</div>
                        <div class="fc-icon">${this.getCardIconHtml(comparison.upgraded)}</div>
                        <div class="fc-name">${comparison.upgraded.name}</div>
                    </div>
                    <div class="upgrade-aura"></div>
                </div>
                
                <!-- 완료 텍스트 -->
                <div class="forge-complete-text hidden">
                    <span class="complete-icon">⚒️</span>
                    <span class="complete-main">강화 완료!</span>
                    <span class="complete-sub">${comparison.upgraded.name}</span>
                </div>
            </div>
        `;
        
        modal.appendChild(overlay);
        this.injectForgeUpgradeStyles();
        
        // 애니메이션 시퀀스
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            
            const hammer = overlay.querySelector('.forge-hammer');
            const hitText = overlay.querySelector('.forge-hit-text');
            const impact = overlay.querySelector('.forge-impact-effects');
            const baseCard = overlay.querySelector('.forge-base-card');
            const upgradedSection = overlay.querySelector('.forge-upgraded-card');
            const completeText = overlay.querySelector('.forge-complete-text');
            
            // 1단계: 망치 1타 (400ms)
            setTimeout(() => {
                this.playForgeHit(hammer, hitText, impact, baseCard, '땅!', 1);
            }, 400);
            
            // 2단계: 망치 2타 (900ms)
            setTimeout(() => {
                this.playForgeHit(hammer, hitText, impact, baseCard, '땅!', 2);
            }, 900);
            
            // 3단계: 망치 3타 - 강타 (1400ms)
            setTimeout(() => {
                this.playForgeHit(hammer, hitText, impact, baseCard, '땅!!', 3);
            }, 1400);
            
            // 4단계: 카드 변환 (2000ms)
            setTimeout(() => {
                baseCard.classList.add('transforming');
                overlay.querySelector('.forge-card-on-anvil').classList.add('burning');
                
                // 스파크 폭발
                this.createForgeSparkBurst(overlay);
            }, 2000);
            
            // 5단계: 업그레이드 카드 등장 (2500ms)
            setTimeout(() => {
                overlay.querySelector('.forge-card-on-anvil').classList.add('hidden');
                upgradedSection.classList.remove('hidden');
                upgradedSection.classList.add('reveal');
                
                // 완료 텍스트
                setTimeout(() => {
                    completeText.classList.remove('hidden');
                    completeText.classList.add('show');
                }, 300);
            }, 2500);
            
            // 6단계: 종료 (3800ms)
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                    if (callback) callback();
                }, 400);
            }, 3800);
        });
    },
    
    // 망치 타격 연출
    playForgeHit(hammer, hitText, impact, card, text, hitNum) {
        // 망치 내려치기
        hammer.classList.add('striking');
        
        setTimeout(() => {
            hammer.classList.remove('striking');
            hammer.classList.add('hit');
            
            // 충격파
            impact.classList.add('active');
            
            // 카드 흔들림
            card.classList.add('shake');
            
            // 타격 텍스트
            hitText.textContent = text;
            hitText.className = 'forge-hit-text show hit-' + hitNum;
            
            // 화면 흔들림
            document.querySelector('.forge-upgrade-scene')?.classList.add('screen-shake');
            
            // 효과 제거
            setTimeout(() => {
                hammer.classList.remove('hit');
                impact.classList.remove('active');
                card.classList.remove('shake');
                hitText.classList.remove('show');
                document.querySelector('.forge-upgrade-scene')?.classList.remove('screen-shake');
            }, 200);
        }, 150);
    },
    
    // 스파크 폭발 생성
    createForgeSparkBurst(overlay) {
        const scene = overlay.querySelector('.forge-upgrade-scene');
        const sparkCount = 20;
        
        for (let i = 0; i < sparkCount; i++) {
            const spark = document.createElement('div');
            spark.className = 'forge-spark-particle';
            const angle = (i / sparkCount) * 360;
            const distance = 80 + Math.random() * 120;
            const duration = 0.4 + Math.random() * 0.4;
            
            spark.style.cssText = `
                --angle: ${angle}deg;
                --distance: ${distance}px;
                --duration: ${duration}s;
                --delay: ${Math.random() * 0.1}s;
            `;
            scene.appendChild(spark);
            
            setTimeout(() => spark.remove(), 1000);
        }
    },
    
    // 대장장이 강화 스타일 주입
    injectForgeUpgradeStyles() {
        if (document.getElementById('forge-upgrade-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'forge-upgrade-styles';
        style.textContent = `
            .forge-upgrade-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.95);
                z-index: 100001;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .forge-upgrade-overlay.visible {
                opacity: 1;
            }
            
            .forge-upgrade-overlay.fade-out {
                opacity: 0;
            }
            
            .forge-upgrade-scene {
                position: relative;
                width: 500px;
                height: 450px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .forge-upgrade-scene.screen-shake {
                animation: screenShake 0.15s ease;
            }
            
            @keyframes screenShake {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(-8px, 4px); }
                50% { transform: translate(8px, -4px); }
                75% { transform: translate(-4px, 8px); }
            }
            
            /* 배경 불꽃 */
            .forge-fire-bg {
                position: absolute;
                bottom: 0;
                width: 100%;
                height: 200px;
                background: radial-gradient(ellipse at bottom center, 
                    rgba(255, 100, 0, 0.3) 0%, 
                    rgba(255, 50, 0, 0.1) 50%,
                    transparent 80%);
                animation: fireFlicker 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes fireFlicker {
                0% { opacity: 0.6; transform: scaleY(1); }
                100% { opacity: 1; transform: scaleY(1.05); }
            }
            
            /* 모루 */
            .forge-anvil {
                position: absolute;
                bottom: 80px;
                font-size: 4rem;
                filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));
            }
            
            .anvil-glow {
                position: absolute;
                inset: -20px;
                background: radial-gradient(circle, rgba(255, 150, 50, 0.4) 0%, transparent 70%);
                animation: anvilGlow 1s ease-in-out infinite alternate;
            }
            
            @keyframes anvilGlow {
                0% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            /* 모루 위 카드 */
            .forge-card-on-anvil {
                position: absolute;
                bottom: 150px;
                z-index: 10;
                transition: all 0.3s ease;
            }
            
            .forge-card-on-anvil.burning {
                filter: brightness(2) saturate(0.5);
                animation: cardBurn 0.5s ease forwards;
            }
            
            .forge-card-on-anvil.hidden {
                opacity: 0;
                transform: scale(0.5);
            }
            
            @keyframes cardBurn {
                0% { filter: brightness(1); }
                50% { filter: brightness(3) hue-rotate(30deg); }
                100% { filter: brightness(0) saturate(0); opacity: 0; }
            }
            
            .forge-base-card, .forge-result-card {
                width: 120px;
                height: 160px;
                background: linear-gradient(145deg, #2a2a3a 0%, #1a1a25 100%);
                border: 2px solid #4a4a5a;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 10px;
                box-shadow: 0 5px 30px rgba(0,0,0,0.6);
            }
            
            .forge-base-card.shake {
                animation: cardShake 0.15s ease;
            }
            
            @keyframes cardShake {
                0%, 100% { transform: translateX(0) rotate(0deg); }
                25% { transform: translateX(-6px) rotate(-2deg); }
                75% { transform: translateX(6px) rotate(2deg); }
            }
            
            .forge-base-card.transforming {
                animation: cardTransform 0.5s ease forwards;
            }
            
            @keyframes cardTransform {
                0% { transform: scale(1); filter: brightness(1); }
                50% { transform: scale(1.2); filter: brightness(3) saturate(2); }
                100% { transform: scale(0); filter: brightness(5); opacity: 0; }
            }
            
            .fc-cost {
                position: absolute;
                top: 5px;
                left: 5px;
                width: 24px;
                height: 24px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 0.9rem;
                color: white;
            }
            
            .fc-icon {
                font-size: 2.5rem;
                margin-bottom: 8px;
            }
            
            .fc-icon img {
                width: 50px;
                height: 50px;
                object-fit: contain;
            }
            
            .fc-name {
                font-family: 'Cinzel', serif;
                font-size: 0.75rem;
                color: #d4af37;
                text-align: center;
                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
            }
            
            /* 망치 */
            .forge-hammer {
                position: absolute;
                top: 50px;
                right: 120px;
                font-size: 5rem;
                transform: rotate(-45deg);
                transform-origin: bottom right;
                filter: drop-shadow(0 5px 15px rgba(0,0,0,0.8));
                z-index: 20;
                transition: transform 0.15s ease;
            }
            
            .forge-hammer.striking {
                transform: rotate(-90deg) scale(1.1);
            }
            
            .forge-hammer.hit {
                transform: rotate(-10deg) scale(0.95);
            }
            
            /* 충격 이펙트 */
            .forge-impact-effects {
                position: absolute;
                bottom: 160px;
                pointer-events: none;
                opacity: 0;
            }
            
            .forge-impact-effects.active {
                opacity: 1;
            }
            
            .impact-ring {
                position: absolute;
                width: 20px;
                height: 20px;
                border: 3px solid #ff9500;
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
            }
            
            .forge-impact-effects.active .impact-ring {
                animation: impactRing 0.3s ease-out forwards;
            }
            
            @keyframes impactRing {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(8); opacity: 0; }
            }
            
            .impact-sparks {
                position: absolute;
                width: 4px;
                height: 4px;
            }
            
            .forge-impact-effects.active .impact-sparks {
                animation: impactSparks 0.2s ease-out;
            }
            
            @keyframes impactSparks {
                0% { box-shadow: 
                    0 0 #ff9500, 10px -20px #ffcc00, -10px -15px #ff6600,
                    20px -10px #ffaa00, -15px -25px #ff8800, 5px -30px #ffdd00;
                }
                100% { box-shadow: 
                    0 0 transparent, 30px -60px transparent, -30px -45px transparent,
                    60px -30px transparent, -45px -75px transparent, 15px -90px transparent;
                }
            }
            
            /* 타격 텍스트 */
            .forge-hit-text {
                position: absolute;
                bottom: 280px;
                font-family: 'Black Han Sans', 'Noto Sans KR', sans-serif;
                font-size: 3rem;
                color: #ff6b00;
                text-shadow: 
                    0 0 20px #ff9500,
                    0 0 40px #ff6600,
                    2px 2px 0 #000,
                    -2px -2px 0 #000;
                opacity: 0;
                transform: scale(0.5);
                z-index: 30;
            }
            
            .forge-hit-text.show {
                animation: hitTextPop 0.3s ease-out forwards;
            }
            
            .forge-hit-text.hit-3 {
                font-size: 4rem;
                color: #ffcc00;
                text-shadow: 
                    0 0 30px #ffdd00,
                    0 0 60px #ff9900,
                    3px 3px 0 #000;
            }
            
            @keyframes hitTextPop {
                0% { opacity: 0; transform: scale(0.5) translateY(20px); }
                50% { opacity: 1; transform: scale(1.3) translateY(-10px); }
                100% { opacity: 0; transform: scale(1) translateY(-30px); }
            }
            
            /* 업그레이드된 카드 */
            .forge-upgraded-card {
                position: absolute;
                bottom: 150px;
                z-index: 15;
                opacity: 0;
                transform: scale(0.3);
            }
            
            .forge-upgraded-card.hidden {
                display: none;
            }
            
            .forge-upgraded-card.reveal {
                display: block;
                animation: cardReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            
            @keyframes cardReveal {
                0% { opacity: 0; transform: scale(0.3) translateY(50px); }
                60% { opacity: 1; transform: scale(1.15) translateY(-20px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            
            .forge-result-card {
                border-color: #d4af37;
                box-shadow: 
                    0 0 30px rgba(212, 175, 55, 0.6),
                    0 0 60px rgba(212, 175, 55, 0.3),
                    inset 0 0 20px rgba(255, 215, 0, 0.1);
                background: linear-gradient(145deg, #3a3a4a 0%, #252530 100%);
            }
            
            .upgraded-glow {
                position: absolute;
                inset: -30px;
                background: radial-gradient(circle, rgba(212, 175, 55, 0.5) 0%, transparent 70%);
                animation: upgradedGlow 1s ease-in-out infinite alternate;
                z-index: -1;
            }
            
            @keyframes upgradedGlow {
                0% { opacity: 0.6; transform: scale(1); }
                100% { opacity: 1; transform: scale(1.1); }
            }
            
            .upgrade-aura {
                position: absolute;
                inset: -5px;
                border: 2px solid transparent;
                border-radius: 12px;
                background: linear-gradient(45deg, transparent, rgba(255,215,0,0.3), transparent) border-box;
                animation: auraRotate 2s linear infinite;
            }
            
            @keyframes auraRotate {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            
            /* 스파크 파티클 */
            .forge-spark-particle {
                position: absolute;
                width: 6px;
                height: 6px;
                background: #ffcc00;
                border-radius: 50%;
                bottom: 170px;
                left: 50%;
                box-shadow: 0 0 10px #ff9900, 0 0 20px #ff6600;
                animation: sparkFly var(--duration) ease-out var(--delay) forwards;
            }
            
            @keyframes sparkFly {
                0% { 
                    transform: translate(-50%, 0) rotate(0deg);
                    opacity: 1;
                }
                100% { 
                    transform: 
                        translate(
                            calc(-50% + cos(var(--angle)) * var(--distance)), 
                            calc(sin(var(--angle)) * var(--distance) * -1)
                        ) 
                        rotate(720deg);
                    opacity: 0;
                }
            }
            
            /* 완료 텍스트 */
            .forge-complete-text {
                position: absolute;
                bottom: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                opacity: 0;
                transform: translateY(20px);
            }
            
            .forge-complete-text.hidden {
                display: none;
            }
            
            .forge-complete-text.show {
                display: flex;
                animation: completeShow 0.5s ease-out forwards;
            }
            
            @keyframes completeShow {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .complete-icon {
                font-size: 2rem;
                animation: iconBounce 0.5s ease;
            }
            
            @keyframes iconBounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }
            
            .complete-main {
                font-family: 'Cinzel', serif;
                font-size: 1.8rem;
                color: #d4af37;
                text-shadow: 0 0 20px rgba(212, 175, 55, 0.8);
                letter-spacing: 4px;
            }
            
            .complete-sub {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1rem;
                color: #aaa;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 타입명 가져오기
    getTypeName(type) {
        const names = {
            'attack': '공격',
            'skill': '스킬',
            'power': '파워',
            'status': '상태',
            'curse': '저주'
        };
        return names[type] || type;
    },
    
    // 카드 아이콘 HTML 가져오기
    getCardIconHtml(card) {
        if (card.icon.includes('<img')) {
            return card.icon;
        }
        return `<span class="card-emoji-icon">${card.icon}</span>`;
    },
    
    // HTML 태그 제거
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/<br>/g, ' ');
    },
    
    // 플레이어 덱 가져오기
    getPlayerDeck() {
        // 게임 상태에서 덱 가져오기
        if (typeof gameState !== 'undefined' && gameState.fullDeck && gameState.fullDeck.length > 0) {
            return gameState.fullDeck;
        }
        
        // 저장된 덱이 있으면 가져오기
        const savedDeck = localStorage.getItem('lordofnight_player_deck');
        if (savedDeck) {
            try {
                const parsed = JSON.parse(savedDeck);
                if (parsed && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.warn('저장된 덱 파싱 실패:', e);
            }
        }
        
        // 없으면 스타터 덱으로 초기화
        if (typeof buildStarterDeck === 'function') {
            const deckIds = buildStarterDeck();
            // 카드 ID 배열을 카드 객체 배열로 변환
            const deck = deckIds.map(cardId => {
                return createCard(cardId);
            }).filter(card => card !== null);
            
            this.savePlayerDeck(deck);
            return deck;
        }
        
        return [];
    },
    
    // 플레이어 덱 저장
    savePlayerDeck(deck) {
        // 카드 ID만 저장 (함수는 JSON으로 저장 불가)
        const deckIds = deck.map(card => {
            if (typeof card === 'string') return card;
            return card.id;
        });
        
        localStorage.setItem('lordofnight_player_deck', JSON.stringify(deckIds));
        console.log('[Town] 덱 저장:', deckIds.join(', '));
        
        // gameState에는 카드 객체 유지
        if (typeof gameState !== 'undefined') {
            gameState.fullDeck = [...deck];
        }
    },
    
    // 카드 강화 이벤트 설정
    setupCardUpgradeEvents(modal) {
        modal.querySelectorAll('.upgrade-card-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                const cardId = btn.dataset.cardId;
                this.performCardUpgrade(cardId, modal);
            });
        });
    },
    
    // 카드 강화 실행
    performCardUpgrade(cardId, modal) {
        const cost = CardUpgradeSystem.getUpgradeCost(cardId);
        
        if (GoldSystem.getGold() < cost) {
            this.showUpgradeMessage('골드가 부족합니다!', 'error');
            return;
        }
        
        // 골드 차감
        GoldSystem.addGold(-cost);
        
        // 덱에서 해당 카드 찾아서 강화
        const deck = this.getPlayerDeck();
        const cardIndex = deck.findIndex(card => card.id === cardId && !CardUpgradeSystem.isUpgraded(card.id));
        
        if (cardIndex === -1) {
            this.showUpgradeMessage('강화할 카드를 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 강화 실행
        const upgradedCard = CardUpgradeSystem.createUpgradedCard(cardId);
        if (upgradedCard) {
            deck[cardIndex] = upgradedCard;
            this.savePlayerDeck(deck);
            
            // 강화 효과 표시
            this.showUpgradeEffect(modal, cardId);
            
            // UI 업데이트
            setTimeout(() => {
                modal.querySelector('#card-upgrade-list').innerHTML = this.generateUpgradeCardList();
                modal.querySelector('.gold-value').textContent = GoldSystem.getGold().toLocaleString();
                this.setupCardUpgradeEvents(modal);
            }, 800);
        }
    },
    
    // 강화 효과 표시
    showUpgradeEffect(modal, cardId) {
        const comparison = CardUpgradeSystem.getComparisonData(cardId);
        
        // 강화 완료 오버레이
        const overlay = document.createElement('div');
        overlay.className = 'upgrade-success-overlay';
        overlay.innerHTML = `
            <div class="upgrade-success-content">
                <div class="upgrade-sparks"></div>
                <div class="upgraded-card-display">
                    <div class="card-mini upgraded large">
                        <div class="card-mini-cost">${comparison.upgraded.cost}</div>
                        <div class="card-mini-icon">${this.getCardIconHtml(comparison.upgraded)}</div>
                        <div class="card-mini-name">${comparison.upgraded.name}</div>
                    </div>
                </div>
                <div class="upgrade-success-text">강화 완료!</div>
            </div>
        `;
        
        modal.querySelector('.blacksmith-content').appendChild(overlay);
        
        // 애니메이션 후 제거
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 300);
        }, 700);
    },
    
    // 강화 메시지 표시
    showUpgradeMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `upgrade-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('visible'));
        
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },
    
    // 마을 표시 (인트로 없이)
    show() {
        console.log('[Town] show() 호출됨');
        this._showTownScreen();
    },
    
    // 마을 표시 (인트로 애니메이션 포함)
    showWithIntro(fromDungeon = false) {
        console.log('[Town] showWithIntro() 호출됨');
        this.playTownIntro(fromDungeon, () => {
            this._showTownScreen();
        });
    },
    
    // 실제 마을 화면 표시 로직
    _showTownScreen() {
        this.isVisible = true;
        
        const townScreen = document.getElementById('town-screen');
        if (townScreen) {
            townScreen.style.display = 'flex';
            townScreen.classList.add('visible');
            townScreen.classList.remove('leaving');
            
            try {
                if (typeof GoldSystem !== 'undefined') {
                    GoldSystem.updateDisplay();
                }
            } catch (e) {
                console.error('[Town] GoldSystem 에러:', e);
            }
            
            try {
                this.updatePlayerStatus();
            } catch (e) {
                console.error('[Town] updatePlayerStatus 에러:', e);
            }
            
            try {
                this.updateNpcStatus();
            } catch (e) {
                console.error('[Town] updateNpcStatus 에러:', e);
            }
            
            // TopBar 표시 및 업데이트
            if (typeof TopBar !== 'undefined') {
                TopBar.show();
                document.body.classList.add('has-topbar');
            }
            
            console.log('[Town] 마을 화면 표시 완료');
        } else {
            console.error('[Town] town-screen 요소를 찾을 수 없음');
        }
    },
    
    // 마을 도착 인트로 애니메이션
    playTownIntro(fromDungeon, callback) {
        const introOverlay = document.createElement('div');
        introOverlay.className = 'town-intro-overlay';
        introOverlay.innerHTML = `
            <div class="town-intro-vignette"></div>
            <div class="town-intro-fog fog-1"></div>
            <div class="town-intro-fog fog-2"></div>
            <div class="town-intro-letterbox top"></div>
            <div class="town-intro-letterbox bottom"></div>
            <div class="town-intro-content">
                <div class="town-intro-line top-line"></div>
                <div class="town-intro-subtitle">${fromDungeon ? 'RETURNED FROM THE ABYSS' : 'SANCTUARY FOUND'}</div>
                <div class="town-intro-title">어둠의 마을</div>
                <div class="town-intro-subtitle-en">DARK VILLAGE</div>
                <div class="town-intro-line bottom-line"></div>
            </div>
            <div class="town-intro-particles"></div>
        `;
        
        // 파티클 생성
        const particlesContainer = introOverlay.querySelector('.town-intro-particles');
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'town-intro-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 3}s`;
            particle.style.animationDuration = `${4 + Math.random() * 3}s`;
            particlesContainer.appendChild(particle);
        }
        
        document.body.appendChild(introOverlay);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            introOverlay.classList.add('active');
        });
        
        // 3초 후 페이드아웃
        setTimeout(() => {
            introOverlay.classList.add('fade-out');
            
            setTimeout(() => {
                introOverlay.remove();
                if (callback) callback();
            }, 1000);
        }, 2500);
    },
    
    // NPC 상태 업데이트
    updateNpcStatus() {
        // 후드 소녀
        this.updateSingleNpcStatus('hoodgirl', '후드 소녀');
        
        // 대장장이
        this.updateSingleNpcStatus('blacksmith', '대장장이');
    },
    
    // 단일 NPC 상태 업데이트
    updateSingleNpcStatus(npcId, displayName) {
        const npcSpot = document.getElementById(`town-npc-${npcId}`);
        if (npcSpot) {
            const isRescued = this.isNpcRescued(npcId);
            npcSpot.classList.toggle('unlocked', isRescued);
            npcSpot.classList.toggle('locked', !isRescued);
            
            const lockOverlay = npcSpot.querySelector('.npc-lock-overlay');
            if (isRescued && lockOverlay) {
                lockOverlay.remove();
            } else if (!isRescued && !lockOverlay) {
                const overlay = document.createElement('div');
                overlay.className = 'npc-lock-overlay';
                overlay.innerHTML = '<span>🔒</span>';
                npcSpot.querySelector('.location-structure').appendChild(overlay);
            }
            
            const labelText = npcSpot.querySelector('.label-text');
            if (labelText) {
                labelText.textContent = isRescued ? displayName : '???';
            }
        }
    },
    
    // 마을 숨기기
    hide() {
        this.isVisible = false;
        
        const townScreen = document.getElementById('town-screen');
        if (townScreen) {
            townScreen.classList.remove('visible');
            setTimeout(() => {
                townScreen.style.display = 'none';
            }, 300);
        }
    },
    
    // 플레이어 상태 업데이트
    updatePlayerStatus() {
        const stats = PlayerBaseStats.getFinalStats();
        document.getElementById('town-max-hp').textContent = stats.maxHp;
        document.getElementById('town-energy').textContent = stats.maxEnergy;
        document.getElementById('town-draw').textContent = stats.drawPerTurn;
    },
    
    // 업그레이드 가져오기 (PlayerBaseStats 위임)
    getUpgrades() {
        return PlayerBaseStats.getUpgrades();
    },
    
    // 업그레이드 저장 (PlayerBaseStats 위임)
    saveUpgrades(upgrades) {
        PlayerBaseStats.saveUpgrades(upgrades);
    },
    
    // 던전 입장
    enterDungeon() {
        // 화면 전환 효과
        const townScreen = document.getElementById('town-screen');
        townScreen.classList.add('leaving');
        
        setTimeout(() => {
            this.hide();
            
            // 🏺 장착된 유물 적용
            if (typeof RelicLoadoutSystem !== 'undefined') {
                RelicLoadoutSystem.applyEquippedRelics();
            }
            
            // 던전 인트로 화면 표시
            this.showDungeonIntro(() => {
                // 인트로 후 맵 시스템 시작
                if (typeof MapSystem !== 'undefined' && MapSystem.startGame) {
                    MapSystem.startGame();
                } else if (typeof startBattle === 'function') {
                    // 맵 시스템이 없으면 바로 전투
                    const gameContainer = document.querySelector('.game-container');
                    if (gameContainer) gameContainer.style.display = 'flex';
                    startBattle();
                }
            });
        }, 500);
    },
    
    // 던전 인트로 화면 (다크소울 스타일)
    showDungeonIntro(callback) {
        // 스테이지 정보 가져오기
        const stageData = typeof StageData !== 'undefined' 
            ? StageData.getStage(1) 
            : { name: '어둠의 던전' };
        const dungeonName = stageData?.name || '어둠의 던전';
        
        const intro = document.createElement('div');
        intro.className = 'ds-dungeon-intro';
        intro.innerHTML = `
            <div class="ds-intro-vignette"></div>
            <div class="ds-intro-fog"></div>
            <div class="ds-intro-text-container">
                <div class="ds-intro-line top"></div>
                <h1 class="ds-intro-title">${dungeonName}</h1>
                <div class="ds-intro-line bottom"></div>
                <p class="ds-intro-subtitle">어둠 속으로</p>
            </div>
        `;
        
        document.body.appendChild(intro);
        this.injectDungeonIntroStyles();
        
        // 애니메이션 시퀀스
        requestAnimationFrame(() => {
            // 1. 배경 페이드인
            intro.classList.add('phase-1');
            
            // 2. 텍스트 페이드인 (0.8초 후)
            setTimeout(() => {
                intro.classList.add('phase-2');
            }, 800);
            
            // 3. 부제목 페이드인 (1.6초 후)
            setTimeout(() => {
                intro.classList.add('phase-3');
            }, 1600);
            
            // 4. 전체 페이드아웃 (3초 후)
            setTimeout(() => {
                intro.classList.add('phase-out');
                
                // 5. 콜백 실행 (3.8초 후)
                setTimeout(() => {
                    intro.remove();
                    if (callback) callback();
                }, 800);
            }, 3000);
        });
    },
    
    // 던전 인트로 스타일 주입
    injectDungeonIntroStyles() {
        if (document.getElementById('ds-dungeon-intro-style')) return;
        
        const style = document.createElement('style');
        style.id = 'ds-dungeon-intro-style';
        style.textContent = `
            /* 다크소울 스타일 던전 인트로 */
            .ds-dungeon-intro {
                position: fixed;
                inset: 0;
                z-index: 99999;
                background: #000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .ds-dungeon-intro.phase-1 {
                opacity: 1;
            }
            
            .ds-dungeon-intro.phase-out {
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            /* 비네팅 효과 */
            .ds-intro-vignette {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, 
                    transparent 20%, 
                    rgba(0, 0, 0, 0.4) 60%,
                    rgba(0, 0, 0, 0.8) 100%);
                pointer-events: none;
            }
            
            /* 안개 효과 */
            .ds-intro-fog {
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at 20% 80%, rgba(60, 50, 40, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 20%, rgba(60, 50, 40, 0.1) 0%, transparent 40%);
                animation: fogDrift 8s ease-in-out infinite;
                pointer-events: none;
            }
            
            @keyframes fogDrift {
                0%, 100% { transform: translateX(0) translateY(0); }
                50% { transform: translateX(20px) translateY(-10px); }
            }
            
            /* 텍스트 컨테이너 */
            .ds-intro-text-container {
                position: relative;
                text-align: center;
                z-index: 1;
            }
            
            /* 장식 라인 */
            .ds-intro-line {
                width: 0;
                height: 1px;
                margin: 0 auto;
                background: linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(180, 160, 120, 0.6) 20%,
                    rgba(212, 175, 55, 0.8) 50%,
                    rgba(180, 160, 120, 0.6) 80%,
                    transparent 100%);
                transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .ds-intro-line.top {
                margin-bottom: 30px;
            }
            
            .ds-intro-line.bottom {
                margin-top: 30px;
                margin-bottom: 20px;
            }
            
            .ds-dungeon-intro.phase-2 .ds-intro-line {
                width: 300px;
            }
            
            /* 메인 타이틀 */
            .ds-intro-title {
                font-family: 'Cinzel', 'Cormorant Garamond', 'Times New Roman', serif;
                font-size: 4rem;
                font-weight: 400;
                letter-spacing: 20px;
                color: #e8dcc4;
                text-shadow: 
                    0 0 40px rgba(212, 175, 55, 0.4),
                    0 0 80px rgba(212, 175, 55, 0.2),
                    0 4px 8px rgba(0, 0, 0, 0.8);
                margin: 0;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 1s ease, transform 1s ease;
            }
            
            .ds-dungeon-intro.phase-2 .ds-intro-title {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* 부제목 */
            .ds-intro-subtitle {
                font-family: 'Cinzel', serif;
                font-size: 1.4rem;
                font-weight: 400;
                letter-spacing: 12px;
                color: rgba(180, 160, 120, 0.8);
                text-transform: uppercase;
                margin: 0;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.8s ease, transform 0.8s ease;
            }
            
            .ds-dungeon-intro.phase-3 .ds-intro-subtitle {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* 반응형 */
            @media (max-width: 768px) {
                .ds-intro-title {
                    font-size: 2.5rem;
                    letter-spacing: 12px;
                }
                
                .ds-intro-subtitle {
                    font-size: 1rem;
                    letter-spacing: 8px;
                }
                
                .ds-dungeon-intro.phase-2 .ds-intro-line {
                    width: 200px;
                }
                
                .ds-intro-line.top {
                    margin-bottom: 20px;
                }
                
                .ds-intro-line.bottom {
                    margin-top: 20px;
                    margin-bottom: 15px;
                }
            }
            
            @media (max-width: 480px) {
                .ds-intro-title {
                    font-size: 1.8rem;
                    letter-spacing: 8px;
                }
                
                .ds-intro-subtitle {
                    font-size: 0.85rem;
                    letter-spacing: 6px;
                }
                
                .ds-dungeon-intro.phase-2 .ds-intro-line {
                    width: 150px;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    // 상점 열기
    openShop() {
        const modal = document.createElement('div');
        modal.className = 'town-modal shop-modal';
        
        const upgrades = this.getUpgrades();
        
        modal.innerHTML = `
            <div class="town-modal-content shop-content">
                <div class="modal-header">
                    <h2 class="modal-title">🏪 상점</h2>
                    <div class="modal-gold">
                        <span class="gold-icon">💰</span>
                        <span class="gold-display-value">${GoldSystem.getGold().toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="shop-items">
                    <div class="shop-item ${upgrades.maxHp >= 50 ? 'maxed' : ''}" data-type="maxHp" data-cost="100">
                        <div class="item-icon">❤️</div>
                        <div class="item-info">
                            <div class="item-name">최대 체력 +5</div>
                            <div class="item-desc">영구적으로 최대 체력이 증가합니다.</div>
                            <div class="item-progress">현재: +${upgrades.maxHp || 0} / 최대: +50</div>
                        </div>
                        <div class="item-cost">${upgrades.maxHp >= 50 ? '최대' : '💰 100'}</div>
                    </div>
                    
                    <div class="shop-item ${upgrades.energy >= 2 ? 'maxed' : ''}" data-type="energy" data-cost="500">
                        <div class="item-icon">⚡</div>
                        <div class="item-info">
                            <div class="item-name">시작 에너지 +1</div>
                            <div class="item-desc">게임 시작 시 에너지가 1 증가합니다.</div>
                            <div class="item-progress">현재: +${upgrades.energy || 0} / 최대: +2</div>
                        </div>
                        <div class="item-cost">${upgrades.energy >= 2 ? '최대' : '💰 500'}</div>
                    </div>
                    
                    <div class="shop-item ${upgrades.draw >= 2 ? 'maxed' : ''}" data-type="draw" data-cost="400">
                        <div class="item-icon">🃏</div>
                        <div class="item-info">
                            <div class="item-name">시작 드로우 +1</div>
                            <div class="item-desc">턴 시작 시 카드를 1장 더 뽑습니다.</div>
                            <div class="item-progress">현재: +${upgrades.draw || 0} / 최대: +2</div>
                        </div>
                        <div class="item-cost">${upgrades.draw >= 2 ? '최대' : '💰 400'}</div>
                    </div>
                </div>
                
                <button class="modal-close-btn">닫기</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // 아이템 구매
        modal.querySelectorAll('.shop-item:not(.maxed)').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const cost = parseInt(item.dataset.cost);
                
                if (GoldSystem.spendGold(cost)) {
                    const upgrades = this.getUpgrades();
                    upgrades[type] = (upgrades[type] || 0) + 5;
                    if (type === 'energy' || type === 'draw') {
                        upgrades[type] = (upgrades[type] || 0) - 4; // +1로 조정
                    }
                    this.saveUpgrades(upgrades);
                    
                    // 성공 효과
                    item.classList.add('purchased');
                    setTimeout(() => {
                        modal.classList.remove('visible');
                        setTimeout(() => {
                            modal.remove();
                            this.openShop(); // 새로고침
                        }, 300);
                    }, 500);
                    
                    this.updatePlayerStatus();
                    GoldSystem.updateDisplay();
                } else {
                    // 골드 부족
                    item.classList.add('shake');
                    setTimeout(() => item.classList.remove('shake'), 500);
                }
            });
        });
        
        // 닫기
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
    },
    
    // 덱 관리
    openDeckManager() {
        const modal = document.createElement('div');
        modal.className = 'town-modal deck-modal';
        
        modal.innerHTML = `
            <div class="town-modal-content deck-content">
                <div class="modal-header">
                    <h2 class="modal-title">🃏 덱 관리</h2>
                </div>
                
                <div class="deck-info">
                    <p class="coming-soon">🚧 덱 관리 기능은 준비 중입니다!</p>
                    <p class="coming-soon-desc">던전에서 획득한 카드를 관리하고 덱을 구성할 수 있습니다.</p>
                </div>
                
                <button class="modal-close-btn">닫기</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
    },
    
    // 유물 보관함
    openRelicVault() {
        const modal = document.createElement('div');
        modal.className = 'town-modal relic-modal';
        
        modal.innerHTML = `
            <div class="town-modal-content relic-content">
                <div class="modal-header">
                    <h2 class="modal-title">💎 유물 보관함</h2>
                </div>
                
                <div class="relic-info">
                    <p class="coming-soon">🚧 유물 보관함 기능은 준비 중입니다!</p>
                    <p class="coming-soon-desc">던전에서 발견한 유물들을 확인할 수 있습니다.</p>
                </div>
                
                <button class="modal-close-btn">닫기</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
    },
    
    // 타이틀로 돌아가기
    backToTitle() {
        this.hide();
        if (typeof TitleSystem !== 'undefined') {
            TitleSystem.showTitle();
        }
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    TownSystem.init();
    
    // 마을 인트로 스타일 주입
    const townIntroStyles = document.createElement('style');
    townIntroStyles.textContent = `
        /* 마을 인트로 오버레이 */
        .town-intro-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.8s ease;
        }
        
        .town-intro-overlay.active {
            opacity: 1;
        }
        
        .town-intro-overlay.fade-out {
            opacity: 0;
        }
        
        /* 비네트 */
        .town-intro-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 100%);
            pointer-events: none;
        }
        
        /* 안개 */
        .town-intro-fog {
            position: absolute;
            inset: 0;
            opacity: 0.3;
            pointer-events: none;
        }
        
        .town-intro-fog.fog-1 {
            background: linear-gradient(135deg, transparent 40%, rgba(100, 80, 60, 0.3) 50%, transparent 60%);
            animation: townFogMove1 8s ease-in-out infinite;
        }
        
        .town-intro-fog.fog-2 {
            background: linear-gradient(225deg, transparent 40%, rgba(80, 60, 40, 0.2) 50%, transparent 60%);
            animation: townFogMove2 10s ease-in-out infinite;
        }
        
        @keyframes townFogMove1 {
            0%, 100% { transform: translateX(-5%) translateY(-5%); }
            50% { transform: translateX(5%) translateY(5%); }
        }
        
        @keyframes townFogMove2 {
            0%, 100% { transform: translateX(5%) translateY(-5%); }
            50% { transform: translateX(-5%) translateY(5%); }
        }
        
        /* 레터박스 */
        .town-intro-letterbox {
            position: absolute;
            left: 0;
            right: 0;
            height: 12%;
            background: #000;
            z-index: 2;
        }
        
        .town-intro-letterbox.top { top: 0; }
        .town-intro-letterbox.bottom { bottom: 0; }
        
        /* 컨텐츠 */
        .town-intro-content {
            position: relative;
            z-index: 3;
            text-align: center;
            opacity: 0;
            transform: translateY(20px);
            animation: townIntroContentFadeIn 1s ease 0.5s forwards;
        }
        
        @keyframes townIntroContentFadeIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* 라인 */
        .town-intro-line {
            width: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #c9a55c, transparent);
            margin: 15px auto;
            animation: townLineExpand 1.5s ease 0.8s forwards;
        }
        
        @keyframes townLineExpand {
            to { width: 300px; }
        }
        
        /* 서브타이틀 */
        .town-intro-subtitle {
            font-family: 'Cinzel', serif;
            font-size: clamp(0.7rem, 2vw, 0.9rem);
            color: #8a7a5a;
            letter-spacing: 6px;
            margin-bottom: 15px;
            opacity: 0;
            animation: townTextFadeIn 1s ease 1s forwards;
        }
        
        /* 메인 타이틀 */
        .town-intro-title {
            font-family: 'Cinzel', serif;
            font-size: clamp(2rem, 6vw, 3.5rem);
            color: #c9a55c;
            letter-spacing: 8px;
            text-shadow: 
                0 0 30px rgba(201, 165, 92, 0.5),
                0 0 60px rgba(201, 165, 92, 0.3),
                0 4px 8px rgba(0, 0, 0, 0.8);
            opacity: 0;
            animation: townTitleFadeIn 1.5s ease 1.2s forwards;
        }
        
        @keyframes townTitleFadeIn {
            0% {
                opacity: 0;
                transform: scale(0.9);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        /* 영문 서브타이틀 */
        .town-intro-subtitle-en {
            font-family: 'Cinzel', serif;
            font-size: clamp(0.6rem, 1.5vw, 0.8rem);
            color: #6a5a4a;
            letter-spacing: 8px;
            margin-top: 10px;
            opacity: 0;
            animation: townTextFadeIn 1s ease 1.5s forwards;
        }
        
        @keyframes townTextFadeIn {
            to { opacity: 1; }
        }
        
        /* 파티클 */
        .town-intro-particles {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
        }
        
        .town-intro-particle {
            position: absolute;
            bottom: -20px;
            width: 3px;
            height: 3px;
            background: #c9a55c;
            border-radius: 50%;
            opacity: 0.6;
            animation: townParticleRise 5s ease-in-out infinite;
        }
        
        @keyframes townParticleRise {
            0% {
                transform: translateY(0) scale(1);
                opacity: 0;
            }
            10% {
                opacity: 0.6;
            }
            90% {
                opacity: 0.3;
            }
            100% {
                transform: translateY(-100vh) scale(0.5);
                opacity: 0;
            }
        }
        
        /* 반응형 */
        @media (max-width: 768px) {
            .town-intro-letterbox { height: 8%; }
            .town-intro-line { max-width: 200px; }
        }
        
        @media (max-width: 480px) {
            .town-intro-subtitle { letter-spacing: 3px; }
            .town-intro-title { letter-spacing: 4px; }
            .town-intro-subtitle-en { letter-spacing: 4px; }
        }
    `;
    document.head.appendChild(townIntroStyles);
});

console.log('[Town] 마을 시스템 로드 완료');

