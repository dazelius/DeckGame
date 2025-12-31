// ==========================================
// Shadow Deck - Top Bar UI 시스템
// ==========================================

const TopBar = {
    // 상태
    isVisible: false,
    container: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.createContainer();
        this.injectStyles();
        console.log('[TopBar] 상단 바 시스템 초기화 완료');
    },
    
    // ==========================================
    // 컨테이너 생성
    // ==========================================
    createContainer() {
        // 기존 제거
        const existing = document.getElementById('top-bar');
        if (existing) existing.remove();
        
        const topBar = document.createElement('div');
        topBar.id = 'top-bar';
        topBar.className = 'top-bar';
        topBar.innerHTML = `
            <!-- 왼쪽: 플레이어 상태 -->
            <div class="tb-left">
                <div class="tb-hp-container">
                    <div class="tb-hp-bar">
                        <div class="tb-hp-fill" id="tb-hp-fill"></div>
                    </div>
                    <span class="tb-hp-text" id="tb-hp-text">35/50</span>
                </div>
                <div class="tb-gold">
                    <span class="tb-gold-icon">💰</span>
                    <span class="tb-gold-value" id="tb-gold">0</span>
                </div>
                <div class="tb-memory">
                    <span class="tb-memory-icon">🔮</span>
                    <span class="tb-memory-value" id="tb-memory">0</span>
                </div>
            </div>
            
            <!-- 중앙: 던전 정보 -->
            <div class="tb-center">
                <span class="tb-location" id="tb-location">마을</span>
            </div>
            
            <!-- 오른쪽: 유물 & 상태 -->
            <div class="tb-right">
                <div class="tb-buffs" id="tb-buffs"></div>
                <div class="tb-relics" id="tb-relics"></div>
            </div>
        `;
        
        topBar.style.display = 'none';
        document.body.appendChild(topBar);
        this.container = topBar;
    },
    
    // ==========================================
    // 표시/숨기기
    // ==========================================
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            this.isVisible = true;
            this.update();
        }
    },
    
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    },
    
    // ==========================================
    // 전체 업데이트
    // ==========================================
    update() {
        if (!this.isVisible) return;
        
        this.updateHP();
        this.updateGold();
        this.updateMemory();
        this.updateLocation();
        this.updateRelics();
        this.updateBuffs();
    },
    
    // ==========================================
    // HP 업데이트
    // ==========================================
    updateHP() {
        const hp = gameState?.player?.hp || 0;
        const maxHp = gameState?.player?.maxHp || 50;
        const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
        
        const fillEl = document.getElementById('tb-hp-fill');
        const textEl = document.getElementById('tb-hp-text');
        
        if (fillEl) {
            fillEl.style.width = `${percent}%`;
            
            // HP 색상 변화
            if (percent <= 25) {
                fillEl.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
            } else if (percent <= 50) {
                fillEl.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
            } else {
                fillEl.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
            }
        }
        
        if (textEl) {
            textEl.textContent = `${hp}/${maxHp}`;
        }
    },
    
    // ==========================================
    // 골드 업데이트
    // ==========================================
    updateGold() {
        const gold = (typeof GoldSystem !== 'undefined' ? GoldSystem.getTotalGold() : gameState?.gold) || 0;
        const goldEl = document.getElementById('tb-gold');
        
        if (goldEl) {
            goldEl.textContent = gold.toLocaleString();
        }
    },
    
    // ==========================================
    // 기억 업데이트
    // ==========================================
    updateMemory() {
        const memory = (typeof ExtractionResult !== 'undefined' ? ExtractionResult.getMemory() : 0);
        const memoryEl = document.getElementById('tb-memory');
        
        if (memoryEl) {
            memoryEl.textContent = memory.toLocaleString();
        }
    },
    
    // ==========================================
    // 위치 정보 업데이트
    // ==========================================
    updateLocation() {
        const locationEl = document.getElementById('tb-location');
        if (!locationEl) return;
        
        // 맵이 보이면 던전 정보 표시
        if (typeof MapSystem !== 'undefined' && MapSystem.isMapVisible) {
            const stageData = typeof StageData !== 'undefined' 
                ? StageData.getStage(MapSystem.currentStage) 
                : null;
            const stageName = stageData?.name || '던전';
            const floor = MapSystem.currentFloor || 1;
            locationEl.textContent = `${stageName} B${floor}F`;
        } 
        // 전투 중이면 전투 정보
        else if (gameState?.enemies?.length > 0) {
            const battleType = gameState.currentBattleType || 'normal';
            const typeText = {
                'normal': '전투',
                'elite': '엘리트 전투',
                'boss': '보스 전투'
            };
            locationEl.textContent = typeText[battleType] || '전투';
        }
        // 마을
        else if (typeof TownSystem !== 'undefined' && TownSystem.isVisible) {
            locationEl.textContent = '마을';
        }
        else {
            locationEl.textContent = '';
        }
    },
    
    // ==========================================
    // 유물 업데이트
    // ==========================================
    updateRelics() {
        const relicsEl = document.getElementById('tb-relics');
        if (!relicsEl) return;
        
        const relics = gameState?.relics || [];
        
        if (relics.length === 0) {
            relicsEl.innerHTML = '';
            return;
        }
        
        let html = '';
        relics.forEach(relic => {
            const relicData = typeof relicDatabase !== 'undefined' ? relicDatabase[relic.id] : null;
            if (relicData) {
                html += `
                    <div class="tb-relic" title="${relicData.name}: ${relicData.description}">
                        <span class="tb-relic-icon">${relicData.icon}</span>
                    </div>
                `;
            }
        });
        
        relicsEl.innerHTML = html;
    },
    
    // ==========================================
    // 버프/디버프 업데이트
    // ==========================================
    updateBuffs() {
        const buffsEl = document.getElementById('tb-buffs');
        if (!buffsEl) return;
        
        const player = gameState?.player;
        if (!player?.buffs || player.buffs.length === 0) {
            buffsEl.innerHTML = '';
            return;
        }
        
        let html = '';
        player.buffs.forEach(buff => {
            const buffDef = typeof BuffSystem !== 'undefined' && BuffSystem.buffDefinitions 
                ? BuffSystem.buffDefinitions[buff.id] 
                : null;
            
            if (buffDef) {
                const isDebuff = buffDef.type === 'debuff';
                html += `
                    <div class="tb-buff ${isDebuff ? 'debuff' : ''}" title="${buffDef.name}: ${buffDef.description}">
                        <span class="tb-buff-icon">${buffDef.icon}</span>
                        <span class="tb-buff-stacks">${buff.stacks || buff.duration || ''}</span>
                    </div>
                `;
            }
        });
        
        buffsEl.innerHTML = html;
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('topbar-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'topbar-styles';
        style.textContent = `
            /* Top Bar 컨테이너 */
            .top-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 48px;
                background: linear-gradient(180deg, 
                    rgba(0, 0, 0, 0.95) 0%, 
                    rgba(0, 0, 0, 0.85) 100%);
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 15px;
                z-index: 9000;
                font-family: 'Noto Sans KR', sans-serif;
                box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
            }
            
            /* 왼쪽 영역 */
            .tb-left {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            /* HP 바 */
            .tb-hp-container {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .tb-hp-bar {
                width: 120px;
                height: 14px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 7px;
                overflow: hidden;
            }
            
            .tb-hp-fill {
                height: 100%;
                background: linear-gradient(90deg, #22c55e, #4ade80);
                border-radius: 6px;
                transition: width 0.3s ease, background 0.3s ease;
                box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
            }
            
            .tb-hp-text {
                font-size: 0.85rem;
                color: #e8e8e8;
                font-weight: 600;
                min-width: 60px;
            }
            
            /* 골드 */
            .tb-gold {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .tb-gold-icon {
                font-size: 1rem;
            }
            
            .tb-gold-value {
                font-size: 0.9rem;
                color: #fbbf24;
                font-weight: 600;
            }
            
            /* 기억 */
            .tb-memory {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-left: 15px;
                padding-left: 15px;
                border-left: 1px solid rgba(168, 85, 247, 0.3);
            }
            
            .tb-memory-icon {
                font-size: 1rem;
            }
            
            .tb-memory-value {
                font-size: 0.9rem;
                color: #c084fc;
                font-weight: 600;
            }
            
            /* 중앙: 위치 정보 */
            .tb-center {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
            }
            
            .tb-location {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #d4af37;
                letter-spacing: 2px;
            }
            
            /* 오른쪽 영역 */
            .tb-right {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            /* 버프 영역 */
            .tb-buffs {
                display: flex;
                gap: 4px;
            }
            
            .tb-buff {
                position: relative;
                width: 28px;
                height: 28px;
                background: rgba(74, 222, 128, 0.2);
                border: 1px solid rgba(74, 222, 128, 0.5);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: help;
            }
            
            .tb-buff.debuff {
                background: rgba(239, 68, 68, 0.2);
                border-color: rgba(239, 68, 68, 0.5);
            }
            
            .tb-buff-icon {
                font-size: 0.9rem;
            }
            
            .tb-buff-stacks {
                position: absolute;
                bottom: -2px;
                right: -2px;
                font-size: 0.65rem;
                color: #fff;
                background: rgba(0, 0, 0, 0.8);
                padding: 0 3px;
                border-radius: 3px;
                font-weight: bold;
            }
            
            /* 유물 영역 */
            .tb-relics {
                display: flex;
                gap: 4px;
            }
            
            .tb-relic {
                width: 30px;
                height: 30px;
                background: rgba(212, 175, 55, 0.15);
                border: 1px solid rgba(212, 175, 55, 0.4);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: help;
                transition: all 0.2s ease;
            }
            
            .tb-relic:hover {
                background: rgba(212, 175, 55, 0.3);
                border-color: rgba(212, 175, 55, 0.7);
                transform: translateY(-2px);
            }
            
            .tb-relic-icon {
                font-size: 1rem;
            }
            
            /* 맵/마을 화면 위치 조정 (fixed 요소) */
            body.has-topbar #map-screen,
            body.has-topbar .town-screen {
                top: 48px;
            }
            
            /* 게임 컨테이너 여백 */
            body.has-topbar .game-container {
                padding-top: 48px;
            }
            
            /* 모바일 대응 */
            @media (max-width: 768px) {
                .top-bar {
                    height: 44px;
                    padding: 0 10px;
                }
                
                .tb-hp-bar {
                    width: 80px;
                    height: 12px;
                }
                
                .tb-hp-text {
                    font-size: 0.75rem;
                    min-width: 50px;
                }
                
                .tb-gold-value {
                    font-size: 0.8rem;
                }
                
                .tb-location {
                    font-size: 0.85rem;
                }
                
                .tb-buff, .tb-relic {
                    width: 26px;
                    height: 26px;
                }
                
                body.has-topbar #map-screen,
                body.has-topbar .town-screen {
                    top: 44px;
                }
                
                body.has-topbar .game-container {
                    padding-top: 44px;
                }
            }
            
            @media (max-width: 480px) {
                .tb-left {
                    gap: 12px;
                }
                
                .tb-hp-bar {
                    width: 60px;
                }
                
                .tb-center {
                    display: none;
                }
                
                .tb-buffs {
                    max-width: 80px;
                    overflow: hidden;
                }
                
                .tb-relics {
                    max-width: 100px;
                    overflow-x: auto;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// 전역 접근
window.TopBar = TopBar;

// DOMContentLoaded 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    TopBar.init();
});

console.log('[TopBar] 상단 바 시스템 로드 완료');

