// ==========================================
// 전투 테스트 시스템 - Battle Test System
// 다크소울 스타일 몬스터 테스트 메뉴
// ==========================================

const BattleTestSystem = {
    _pendingGimmicks: [],
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[BattleTestSystem] 초기화');
    },
    
    // ==========================================
    // 몬스터 테스트 메뉴 표시
    // ==========================================
    showTestMenu(options = {}) {
        const { onClose, hideMap } = options;
        
        // 모든 몬스터 목록 가져오기
        const allMonsters = [
            { category: '일반 몬스터', monsters: typeof enemyDatabase !== 'undefined' ? enemyDatabase.filter(e => !e.isSplitForm) : [] },
            { category: '엘리트 몬스터', monsters: typeof eliteDatabase !== 'undefined' ? eliteDatabase : [] },
            { category: '보스 몬스터', monsters: typeof bossDatabase !== 'undefined' ? bossDatabase : [] }
        ];
        
        // 다중 적 프리셋
        const multiEnemyPresets = [
            { name: '고블린 습격', monsters: ['goblinRogue', 'goblinRogue', 'goblinArcher'], type: 'normal' },
            { name: '고블린 주술단', monsters: ['goblinShaman', 'goblinRogue', 'goblinArcher'], type: 'normal' },
            { name: '슬라임 웨이브', monsters: ['shadowSlime', 'shadowSlime', 'shadowSlime'], type: 'normal' },
            { name: '혼합 무리', monsters: ['goblinRogue', 'shadowSlime', 'skeletonWarrior'], type: 'normal' },
            { name: '해골 부대', monsters: ['skeletonWarrior', 'skeletonWarrior'], type: 'normal' },
            { name: '야수 팩', monsters: ['direWolf', 'direWolf', 'direWolf'], type: 'normal' },
            { name: '독거미 둥지', monsters: ['poisonSpider', 'poisonSpider'], type: 'normal' },
            { name: '불꽃 군단', monsters: ['fireElemental', 'fireElemental', 'fireElemental'], type: 'normal' },
            { name: '엘리트 도전', monsters: ['thornGuardian', 'doppelganger'], type: 'elite' },
            { name: '거미 여왕', monsters: ['spiderQueen'], type: 'boss' },
            { name: '고블린 왕', monsters: ['goblinKing'], type: 'boss' },
            { name: '화염왕', monsters: ['fireKing'], type: 'boss' },
        ];
        
        let monstersHtml = '';
        
        // === 다중 적 프리셋 섹션 ===
        monstersHtml += `
            <div class="test-category multi-enemy-section">
                <h3 class="category-title">다중 적 전투</h3>
                <div class="monster-list preset-list">
        `;
        
        multiEnemyPresets.forEach((preset, idx) => {
            const typeClass = preset.type === 'boss' ? 'preset-boss' : preset.type === 'elite' ? 'preset-elite' : '';
            monstersHtml += `
                <button class="monster-test-btn multi-preset ${typeClass}" 
                        data-preset-idx="${idx}">
                    <span class="monster-name">${preset.name}</span>
                    <span class="monster-count">${preset.monsters.length}체</span>
                </button>
            `;
        });
        
        monstersHtml += `</div></div>`;
        
        // === 커스텀 다중 적 섹션 ===
        monstersHtml += `
            <div class="test-category custom-multi-section">
                <h3 class="category-title">커스텀 편성</h3>
                <div class="custom-multi-controls">
                    <select id="custom-monster-select" class="custom-select">
                        <option value="">몬스터 선택</option>
        `;
        
        allMonsters.forEach(category => {
            if (category.monsters.length === 0) return;
            monstersHtml += `<optgroup label="${category.category}">`;
            category.monsters.forEach(m => {
                monstersHtml += `<option value="${m.id}">${m.name} (HP ${m.maxHp})</option>`;
            });
            monstersHtml += `</optgroup>`;
        });
        
        monstersHtml += `
                    </select>
                    <button class="add-monster-btn" id="add-monster-btn">추가</button>
                </div>
                <div class="selected-monsters" id="selected-monsters">
                    <span class="placeholder">몬스터를 추가하세요 (최대 5체)</span>
                </div>
                <button class="start-custom-btn" id="start-custom-battle" disabled>
                    전투 시작
                </button>
            </div>
        `;
        
        // === 기믹 섹션 ===
        monstersHtml += `
            <div class="test-category gimmick-section">
                <h3 class="category-title">전장 기믹</h3>
                <p class="gimmick-hint">선택한 기믹이 전투에 배치됩니다</p>
                <div class="gimmick-buttons">
                    <button class="gimmick-toggle-btn" data-gimmick="explosiveBarrel">
                        <span class="gimmick-name">폭발 배럴</span>
                        <span class="gimmick-desc">적 전체 15 피해</span>
                    </button>
                    <button class="gimmick-toggle-btn" data-gimmick="poisonBarrel">
                        <span class="gimmick-name">독 배럴</span>
                        <span class="gimmick-desc">적 전체 독 3</span>
                    </button>
                    <button class="gimmick-toggle-btn" data-gimmick="healingCrystal">
                        <span class="gimmick-name">치유 수정</span>
                        <span class="gimmick-desc">HP 20 회복</span>
                    </button>
                    <button class="gimmick-toggle-btn" data-gimmick="shieldGenerator">
                        <span class="gimmick-name">방어 장치</span>
                        <span class="gimmick-desc">매턴 적 방어 +5</span>
                    </button>
                </div>
                <div class="selected-gimmicks" id="selected-gimmicks">
                    <span class="placeholder">없음</span>
                </div>
            </div>
        `;
        
        // === 단일 몬스터 섹션 ===
        allMonsters.forEach(category => {
            if (category.monsters.length === 0) return;
            
            monstersHtml += `<div class="test-category">
                <h3 class="category-title">${category.category}</h3>
                <div class="monster-list">`;
            
            category.monsters.forEach(m => {
                const isBoss = category.category === '보스 몬스터';
                const isElite = category.category === '엘리트 몬스터';
                monstersHtml += `
                    <button class="monster-test-btn ${isBoss ? 'boss' : ''} ${isElite ? 'elite' : ''}" 
                            data-monster-id="${m.id}"
                            data-battle-type="${isBoss ? 'boss' : isElite ? 'elite' : 'normal'}">
                        <span class="monster-name">${m.name}</span>
                        <span class="monster-hp">HP ${m.maxHp}</span>
                    </button>
                `;
            });
            
            monstersHtml += `</div></div>`;
        });
        
        const modal = document.createElement('div');
        modal.className = 'event-modal monster-test-modal ds-modal';
        modal.innerHTML = `
            <div class="event-content test-content ds-content">
                <div class="ds-title-border"></div>
                <h2 class="event-title ds-title">전투 시험</h2>
                <p class="test-desc ds-desc">도전할 적을 선택하라</p>
                <div class="test-monsters-container ds-scroll">
                    ${monstersHtml}
                </div>
                <button class="ds-btn secondary" id="test-cancel">돌아가기</button>
                <div class="ds-bottom-border"></div>
            </div>
        `;
        
        // 스타일 추가
        this.injectStyles();
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // 커스텀 다중 적 상태
        const customMonsters = [];
        const selectedMonstersEl = modal.querySelector('#selected-monsters');
        const startCustomBtn = modal.querySelector('#start-custom-battle');
        
        // 기믹 선택 상태
        const selectedGimmicks = [];
        const selectedGimmicksEl = modal.querySelector('#selected-gimmicks');
        
        const updateGimmickUI = () => {
            if (selectedGimmicks.length === 0) {
                selectedGimmicksEl.innerHTML = '<span class="placeholder">없음</span>';
            } else {
                selectedGimmicksEl.innerHTML = selectedGimmicks.map(g => `
                    <span class="selected-gimmick-tag">
                        ${g === 'explosiveBarrel' ? '폭발' : 
                          g === 'poisonBarrel' ? '독' : 
                          g === 'healingCrystal' ? '치유' : '방어'}
                    </span>
                `).join('');
            }
        };
        
        // 기믹 토글 버튼
        modal.querySelectorAll('.gimmick-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const gimmickId = btn.dataset.gimmick;
                const idx = selectedGimmicks.indexOf(gimmickId);
                
                if (idx >= 0) {
                    selectedGimmicks.splice(idx, 1);
                    btn.classList.remove('active');
                } else {
                    selectedGimmicks.push(gimmickId);
                    btn.classList.add('active');
                }
                
                updateGimmickUI();
            });
        });
        
        // 기믹 배열을 저장
        this._pendingGimmicks = selectedGimmicks;
        
        const updateCustomUI = () => {
            if (customMonsters.length === 0) {
                selectedMonstersEl.innerHTML = '<span class="placeholder">몬스터를 추가하세요 (최대 5체)</span>';
                startCustomBtn.disabled = true;
            } else {
                selectedMonstersEl.innerHTML = customMonsters.map((m, i) => `
                    <span class="selected-monster-tag" data-idx="${i}">
                        ${m.name} <button class="remove-monster">×</button>
                    </span>
                `).join('');
                startCustomBtn.disabled = false;
                
                // 삭제 버튼
                selectedMonstersEl.querySelectorAll('.remove-monster').forEach((btn, i) => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        customMonsters.splice(i, 1);
                        updateCustomUI();
                    });
                });
            }
        };
        
        // 몬스터 추가 버튼
        modal.querySelector('#add-monster-btn').addEventListener('click', () => {
            const select = modal.querySelector('#custom-monster-select');
            const monsterId = select.value;
            if (!monsterId) return;
            if (customMonsters.length >= 5) {
                alert('최대 5마리까지 추가 가능합니다!');
                return;
            }
            
            // 몬스터 이름 찾기
            let monsterName = monsterId;
            allMonsters.forEach(cat => {
                const found = cat.monsters.find(m => m.id === monsterId);
                if (found) monsterName = found.name;
            });
            
            customMonsters.push({ id: monsterId, name: monsterName });
            select.value = '';
            updateCustomUI();
        });
        
        // 커스텀 전투 시작
        startCustomBtn.addEventListener('click', () => {
            if (customMonsters.length === 0) return;
            modal.remove();
            if (hideMap) hideMap();
            this.startMultiEnemyBattle(customMonsters.map(m => m.id), 'normal');
        });
        
        // 프리셋 버튼 클릭
        modal.querySelectorAll('.multi-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.presetIdx);
                const preset = multiEnemyPresets[idx];
                modal.remove();
                if (hideMap) hideMap();
                this.startMultiEnemyBattle(preset.monsters, preset.type);
            });
        });
        
        // 단일 몬스터 버튼 클릭
        modal.querySelectorAll('.monster-test-btn:not(.multi-preset)').forEach(btn => {
            btn.addEventListener('click', () => {
                const monsterId = btn.dataset.monsterId;
                const battleType = btn.dataset.battleType;
                if (!monsterId) return;
                modal.remove();
                if (hideMap) hideMap();
                this.startSingleBattle(monsterId, battleType);
            });
        });
        
        // 닫기 버튼
        modal.querySelector('#test-cancel').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                if (onClose) onClose();
            }, 300);
        });
    },
    
    // ==========================================
    // 다중 적 전투 시작
    // ==========================================
    startMultiEnemyBattle(monsterIds, battleType) {
        console.log(`[BattleTest] 다중 적 테스트 시작:`, monsterIds, battleType);
        
        // gameState 설정
        if (typeof gameState !== 'undefined') {
            gameState.currentBattleType = battleType;
            gameState.assignedMonsters = monsterIds.map(id => ({
                name: id,
                isBoss: battleType === 'boss',
                isElite: battleType === 'elite'
            }));
            
            // 전투 시작
            if (typeof startBattle === 'function') {
                startBattle();
                
                // 기믹 추가
                this.addPendingGimmicks();
            } else {
                alert('startBattle 함수를 찾을 수 없습니다!');
            }
        } else {
            alert('gameState를 찾을 수 없습니다!');
        }
    },
    
    // ==========================================
    // 단일 전투 시작
    // ==========================================
    startSingleBattle(monsterId, battleType) {
        console.log(`[BattleTest] 단일 테스트 시작: ${monsterId} (${battleType})`);
        
        // 몬스터 데이터 찾기
        const monsterData = typeof findEnemyByName === 'function' ? findEnemyByName(monsterId) : null;
        if (!monsterData) {
            alert(`몬스터를 찾을 수 없습니다: ${monsterId}`);
            return;
        }
        
        // gameState 설정
        if (typeof gameState !== 'undefined') {
            gameState.currentBattleType = battleType;
            gameState.assignedMonsters = [{
                name: monsterId,
                isBoss: battleType === 'boss',
                isElite: battleType === 'elite'
            }];
            
            // 전투 시작
            if (typeof startBattle === 'function') {
                startBattle();
                
                // 기믹 추가
                this.addPendingGimmicks();
            } else {
                alert('startBattle 함수를 찾을 수 없습니다!');
            }
        } else {
            alert('gameState를 찾을 수 없습니다!');
        }
    },
    
    // ==========================================
    // 선택된 기믹 추가
    // ==========================================
    addPendingGimmicks() {
        if (!this._pendingGimmicks || this._pendingGimmicks.length === 0) return;
        
        if (typeof GimmickSystem !== 'undefined') {
            setTimeout(() => {
                GimmickSystem.init();
                const gimmickData = this._pendingGimmicks.map((id, i) => ({
                    id: id,
                    position: i  // 숫자 인덱스로 몬스터와 교차 배치
                }));
                GimmickSystem.addGimmicksToBattle(gimmickData);
                console.log('[BattleTest] 기믹 추가:', this._pendingGimmicks);
                this._pendingGimmicks = [];
            }, 500);
        }
    },
    
    // ==========================================
    // 스타일 주입 - 다크소울 스타일
    // ==========================================
    injectStyles() {
        if (document.getElementById('battle-test-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'battle-test-styles';
        style.textContent = `
            /* ========================================
               다크소울 스타일 모달
               ======================================== */
            
            .ds-modal {
                background: rgba(0, 0, 0, 0.95) !important;
            }
            
            .ds-content {
                background: linear-gradient(180deg, #0a0a0a 0%, #141414 50%, #0a0a0a 100%) !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                box-shadow: 
                    inset 0 0 80px rgba(0, 0, 0, 0.8),
                    0 0 40px rgba(0, 0, 0, 0.9) !important;
                position: relative;
                padding: 30px 25px !important;
                max-width: 700px !important;
            }
            
            .ds-title-border {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 60%;
                height: 2px;
                background: linear-gradient(90deg, transparent, #c9a227, transparent);
            }
            
            .ds-bottom-border {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 60%;
                height: 2px;
                background: linear-gradient(90deg, transparent, #3d3225, transparent);
            }
            
            .ds-title {
                font-family: 'Times New Roman', serif !important;
                font-size: 1.8rem !important;
                font-weight: 400 !important;
                color: #c9a227 !important;
                text-transform: uppercase;
                letter-spacing: 4px;
                text-shadow: 0 2px 10px rgba(201, 162, 39, 0.3);
                margin-bottom: 5px !important;
                text-align: center;
            }
            
            .ds-desc {
                font-family: 'Times New Roman', serif !important;
                font-size: 0.9rem !important;
                color: #8a8a8a !important;
                letter-spacing: 1px;
                text-align: center;
                margin-bottom: 20px !important;
            }
            
            .ds-scroll {
                max-height: 55vh;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: #3d3225 #0a0a0a;
            }
            
            .ds-scroll::-webkit-scrollbar {
                width: 6px;
            }
            
            .ds-scroll::-webkit-scrollbar-track {
                background: #0a0a0a;
            }
            
            .ds-scroll::-webkit-scrollbar-thumb {
                background: #3d3225;
            }
            
            /* 카테고리 섹션 */
            .ds-modal .test-category {
                background: transparent !important;
                border: 1px solid #2a2520 !important;
                border-radius: 0 !important;
                padding: 15px !important;
                margin-bottom: 15px !important;
            }
            
            .ds-modal .category-title {
                font-family: 'Times New Roman', serif !important;
                font-size: 1rem !important;
                font-weight: 400 !important;
                color: #a08050 !important;
                letter-spacing: 2px;
                text-transform: uppercase;
                border-bottom: 1px solid #2a2520;
                padding-bottom: 8px;
                margin-bottom: 12px !important;
            }
            
            /* 몬스터 버튼 */
            .ds-modal .monster-test-btn {
                background: linear-gradient(180deg, #1a1816 0%, #0f0e0d 100%) !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                color: #b0a090 !important;
                padding: 10px 12px !important;
                transition: all 0.2s ease !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 4px !important;
            }
            
            .ds-modal .monster-test-btn:hover {
                background: linear-gradient(180deg, #2a2520 0%, #1a1816 100%) !important;
                border-color: #c9a227 !important;
                color: #c9a227 !important;
                box-shadow: 0 0 15px rgba(201, 162, 39, 0.15) !important;
            }
            
            .ds-modal .monster-test-btn.boss {
                border-color: #8b0000 !important;
            }
            
            .ds-modal .monster-test-btn.boss:hover {
                border-color: #ff4444 !important;
                color: #ff6666 !important;
                box-shadow: 0 0 15px rgba(255, 68, 68, 0.2) !important;
            }
            
            .ds-modal .monster-test-btn.elite {
                border-color: #4a3d7a !important;
            }
            
            .ds-modal .monster-test-btn.elite:hover {
                border-color: #8b7fd4 !important;
                color: #a099e0 !important;
            }
            
            .ds-modal .monster-name {
                font-family: 'Times New Roman', serif !important;
                font-size: 0.85rem !important;
                letter-spacing: 1px;
            }
            
            .ds-modal .monster-hp,
            .ds-modal .monster-count {
                font-size: 0.7rem !important;
                color: #6a6050 !important;
            }
            
            /* 프리셋 리스트 */
            .ds-modal .preset-list {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
                gap: 8px !important;
            }
            
            .ds-modal .multi-preset.preset-boss {
                border-color: #8b0000 !important;
            }
            
            .ds-modal .multi-preset.preset-elite {
                border-color: #4a3d7a !important;
            }
            
            /* 커스텀 컨트롤 */
            .ds-modal .custom-multi-controls {
                display: flex !important;
                gap: 8px !important;
                margin-bottom: 12px !important;
            }
            
            .ds-modal .custom-select {
                flex: 1 !important;
                background: #0f0e0d !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                color: #b0a090 !important;
                padding: 10px !important;
                font-family: 'Times New Roman', serif !important;
            }
            
            .ds-modal .custom-select:focus {
                outline: none !important;
                border-color: #c9a227 !important;
            }
            
            .ds-modal .add-monster-btn {
                background: linear-gradient(180deg, #2a2520 0%, #1a1816 100%) !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                color: #a08050 !important;
                padding: 10px 16px !important;
                font-family: 'Times New Roman', serif !important;
                letter-spacing: 1px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .ds-modal .add-monster-btn:hover {
                border-color: #c9a227 !important;
                color: #c9a227 !important;
            }
            
            .ds-modal .selected-monsters {
                background: #0a0908 !important;
                border: 1px solid #2a2520 !important;
                border-radius: 0 !important;
                padding: 10px !important;
                min-height: 45px !important;
                margin-bottom: 10px !important;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
            }
            
            .ds-modal .selected-monsters .placeholder {
                color: #4a4540 !important;
                font-style: normal !important;
                font-family: 'Times New Roman', serif !important;
            }
            
            .ds-modal .selected-monster-tag {
                background: #2a2520 !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                color: #b0a090 !important;
                padding: 5px 10px !important;
                font-family: 'Times New Roman', serif !important;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .ds-modal .remove-monster {
                background: transparent !important;
                border: 1px solid #5a4a40 !important;
                border-radius: 0 !important;
                color: #8a7a70 !important;
                width: 16px !important;
                height: 16px !important;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .ds-modal .remove-monster:hover {
                border-color: #c9a227 !important;
                color: #c9a227 !important;
                background: transparent !important;
            }
            
            .ds-modal .start-custom-btn {
                background: linear-gradient(180deg, #2a2520 0%, #1a1816 100%) !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                color: #a08050 !important;
                font-family: 'Times New Roman', serif !important;
                letter-spacing: 2px;
                text-transform: uppercase;
                padding: 12px !important;
                width: 100%;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .ds-modal .start-custom-btn:disabled {
                background: #0f0e0d !important;
                border-color: #2a2520 !important;
                color: #4a4540 !important;
                cursor: not-allowed;
            }
            
            .ds-modal .start-custom-btn:not(:disabled):hover {
                border-color: #c9a227 !important;
                color: #c9a227 !important;
                box-shadow: 0 0 20px rgba(201, 162, 39, 0.15) !important;
                transform: none !important;
            }
            
            /* 기믹 섹션 */
            .ds-modal .gimmick-section {
                background: transparent !important;
                border: 1px solid #2a2520 !important;
            }
            
            .ds-modal .gimmick-hint {
                color: #5a5040 !important;
                font-size: 0.8rem !important;
                font-family: 'Times New Roman', serif !important;
                margin-bottom: 12px !important;
            }
            
            .ds-modal .gimmick-buttons {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 8px !important;
                margin-bottom: 12px !important;
            }
            
            .ds-modal .gimmick-toggle-btn {
                background: linear-gradient(180deg, #1a1816 0%, #0f0e0d 100%) !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                color: #8a7a60 !important;
                padding: 12px 10px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 4px !important;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .ds-modal .gimmick-toggle-btn:hover {
                border-color: #c9a227 !important;
                color: #c9a227 !important;
            }
            
            .ds-modal .gimmick-toggle-btn.active {
                background: linear-gradient(180deg, #3d3225 0%, #2a2520 100%) !important;
                border-color: #c9a227 !important;
                color: #c9a227 !important;
                box-shadow: inset 0 0 20px rgba(201, 162, 39, 0.1) !important;
            }
            
            .ds-modal .gimmick-name {
                font-family: 'Times New Roman', serif !important;
                font-size: 0.85rem !important;
                font-weight: normal !important;
                letter-spacing: 1px;
            }
            
            .ds-modal .gimmick-desc {
                font-size: 0.7rem !important;
                opacity: 0.7 !important;
            }
            
            .ds-modal .selected-gimmicks {
                background: #0a0908 !important;
                border: 1px solid #2a2520 !important;
                border-radius: 0 !important;
                padding: 10px !important;
                min-height: 35px !important;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
            }
            
            .ds-modal .selected-gimmicks .placeholder {
                color: #4a4540 !important;
                font-style: normal !important;
                font-family: 'Times New Roman', serif !important;
            }
            
            .ds-modal .selected-gimmick-tag {
                background: #2a2520 !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                color: #c9a227 !important;
                padding: 4px 10px !important;
                font-family: 'Times New Roman', serif !important;
            }
            
            /* 닫기 버튼 */
            .ds-btn {
                background: transparent !important;
                border: 1px solid #3d3225 !important;
                border-radius: 0 !important;
                color: #8a7a70 !important;
                font-family: 'Times New Roman', serif !important;
                font-size: 0.9rem !important;
                letter-spacing: 2px;
                text-transform: uppercase;
                padding: 12px 30px !important;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 15px !important;
            }
            
            .ds-btn:hover {
                border-color: #c9a227 !important;
                color: #c9a227 !important;
            }
            
            @keyframes tagAppear {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
};

// 전역 노출
window.BattleTestSystem = BattleTestSystem;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    BattleTestSystem.init();
});

console.log('[BattleTestSystem] battle-test.js 로드 완료');
