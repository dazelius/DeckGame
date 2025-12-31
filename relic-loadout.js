// ==========================================
// 유물 장착 시스템 (고고학자 엘프)
// ==========================================

const RelicLoadoutSystem = {
    // 저장 키
    storageKey: 'lordofnight_relic_loadout',
    unlockedKey: 'lordofnight_unlocked_relics',
    slotsKey: 'lordofnight_relic_slots',
    
    // 최대/현재 슬롯 수
    maxSlots: 3,
    currentSlots: 1, // 초기 1개
    
    // 장착된 유물 ID 배열
    equippedRelics: [],
    
    // 해금된 유물 ID 배열
    unlockedRelics: [],
    
    // ==========================================
    // 유물 데이터 가져오기 (relics.js의 relicDatabase 참조)
    // ==========================================
    getRelicData(relicId) {
        // relics.js의 relicDatabase에서 가져옴
        if (typeof relicDatabase !== 'undefined' && relicDatabase[relicId]) {
            const relic = relicDatabase[relicId];
            return {
                id: relicId,
                name: relic.name_kr || relic.name,
                nameEn: relic.name,
                description: relic.description_kr || relic.description,
                descriptionEn: relic.description,
                icon: relic.icon,
                isImageIcon: relic.isImageIcon || false,
                rarity: relic.rarity || 'common'
            };
        }
        return null;
    },
    
    // 모든 유물 ID 목록
    getAllRelicIds() {
        if (typeof relicDatabase !== 'undefined') {
            return Object.keys(relicDatabase);
        }
        return [];
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.loadData();
        this.injectStyles();
        console.log('[RelicLoadout] 유물 장착 시스템 초기화 완료');
    },
    
    // ==========================================
    // 데이터 저장/로드
    // ==========================================
    loadData() {
        // 해금된 유물
        const savedUnlocked = localStorage.getItem(this.unlockedKey);
        if (savedUnlocked) {
            this.unlockedRelics = JSON.parse(savedUnlocked);
        } else {
            // 기본: 용사의 증표만 해금
            this.unlockedRelics = ['heroMedal'];
            this.saveUnlocked();
        }
        
        // 장착된 유물
        const savedEquipped = localStorage.getItem(this.storageKey);
        if (savedEquipped) {
            this.equippedRelics = JSON.parse(savedEquipped);
        } else {
            // 기본: 용사의 증표 장착
            this.equippedRelics = ['heroMedal'];
            this.saveEquipped();
        }
        
        // 슬롯 수
        const savedSlots = localStorage.getItem(this.slotsKey);
        if (savedSlots) {
            this.currentSlots = parseInt(savedSlots);
        } else {
            this.currentSlots = 1;
            this.saveSlots();
        }
    },
    
    saveEquipped() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.equippedRelics));
    },
    
    saveUnlocked() {
        localStorage.setItem(this.unlockedKey, JSON.stringify(this.unlockedRelics));
    },
    
    saveSlots() {
        localStorage.setItem(this.slotsKey, this.currentSlots.toString());
    },
    
    // ==========================================
    // 유물 해금/장착
    // ==========================================
    isUnlocked(relicId) {
        return this.unlockedRelics.includes(relicId);
    },
    
    unlockRelic(relicId) {
        if (!this.unlockedRelics.includes(relicId)) {
            this.unlockedRelics.push(relicId);
            this.saveUnlocked();
            console.log(`[RelicLoadout] 유물 해금: ${relicId}`);
            return true;
        }
        return false;
    },
    
    isEquipped(relicId) {
        return this.equippedRelics.includes(relicId);
    },
    
    equipRelic(relicId) {
        if (!this.isUnlocked(relicId)) {
            console.log(`[RelicLoadout] 해금되지 않은 유물: ${relicId}`);
            return false;
        }
        
        if (this.equippedRelics.length >= this.currentSlots) {
            console.log(`[RelicLoadout] 슬롯 부족 (${this.equippedRelics.length}/${this.currentSlots})`);
            return false;
        }
        
        if (this.isEquipped(relicId)) {
            console.log(`[RelicLoadout] 이미 장착됨: ${relicId}`);
            return false;
        }
        
        this.equippedRelics.push(relicId);
        this.saveEquipped();
        console.log(`[RelicLoadout] 유물 장착: ${relicId}`);
        return true;
    },
    
    unequipRelic(relicId) {
        const index = this.equippedRelics.indexOf(relicId);
        if (index > -1) {
            this.equippedRelics.splice(index, 1);
            this.saveEquipped();
            console.log(`[RelicLoadout] 유물 해제: ${relicId}`);
            return true;
        }
        return false;
    },
    
    // 슬롯 확장
    expandSlot() {
        if (this.currentSlots < this.maxSlots) {
            this.currentSlots++;
            this.saveSlots();
            console.log(`[RelicLoadout] 슬롯 확장: ${this.currentSlots}/${this.maxSlots}`);
            return true;
        }
        return false;
    },
    
    // ==========================================
    // 던전 입장 시 유물 적용
    // ==========================================
    applyEquippedRelics() {
        console.log('[RelicLoadout] 장착된 유물 적용:', this.equippedRelics);
        
        if (typeof RelicSystem === 'undefined') {
            console.error('[RelicLoadout] RelicSystem이 없습니다!');
            return;
        }
        
        // 기존 유물 클리어
        RelicSystem.ownedRelics = [];
        
        // 장착된 유물 추가 (addRelic 사용, silent=true로 팝업 없이)
        this.equippedRelics.forEach(relicId => {
            // 먼저 RelicSystem의 relicDatabase에 있는지 확인
            if (typeof relicDatabase !== 'undefined' && relicDatabase[relicId]) {
                RelicSystem.addRelic(relicId, true); // silent mode
                console.log(`[RelicLoadout] 유물 추가 (게임 DB): ${relicId}`);
            } else {
                // 없으면 loadout 데이터로 직접 추가
                const relicData = this.getRelicData(relicId);
                if (relicData) {
                    const gameRelic = this.convertToGameRelic(relicData);
                    RelicSystem.ownedRelics.push(gameRelic);
                    console.log(`[RelicLoadout] 유물 추가 (로컬): ${relicId}`);
                }
            }
        });
        
        // UI 업데이트
        RelicSystem.updateRelicUI();
        
        // 효과 적용 (HP 증가 등)
        this.applyPassiveEffects();
        
        console.log('[RelicLoadout] 최종 보유 유물:', RelicSystem.ownedRelics.map(r => r.name));
    },
    
    // 게임 유물 형식으로 변환
    convertToGameRelic(relicData) {
        return {
            id: relicData.id,
            name: relicData.name,
            description: relicData.description,
            icon: relicData.icon,
            rarity: relicData.rarity,
            // 효과 함수들 추가
            onAcquire: relicData.effect?.type === 'maxHp' ? (state) => {
                state.player.maxHp += relicData.effect.value;
                state.player.hp += relicData.effect.value;
            } : null
        };
    },
    
    // 패시브 효과 적용 (onAcquire에서 처리되지 않는 효과만)
    applyPassiveEffects() {
        // 대부분의 효과는 relicDatabase의 onAcquire에서 처리됨
        // 여기서는 추가 패시브만 처리
        this.equippedRelics.forEach(relicId => {
            const relicData = this.getRelicData(relicId);
            if (!relicData) return;
            
            const effect = relicData.effect;
            
            // relicDatabase에 없는 유물의 효과만 직접 적용
            if (typeof relicDatabase !== 'undefined' && relicDatabase[relicId]) {
                // 게임 DB에 있으면 onAcquire에서 처리됨
                return;
            }
            
            switch (effect.type) {
                case 'maxHp':
                    if (typeof gameState !== 'undefined') {
                        gameState.player.maxHp += effect.value;
                        gameState.player.hp += effect.value;
                        console.log(`[RelicLoadout] HP +${effect.value} 적용 (로컬)`);
                    }
                    break;
                    
                case 'energyPerTurn':
                    if (typeof gameState !== 'undefined') {
                        gameState.maxEnergy = (gameState.maxEnergy || 3) + effect.value;
                        console.log(`[RelicLoadout] 최대 에너지 +${effect.value} 적용`);
                    }
                    break;
            }
        });
    },
    
    // ==========================================
    // UI: 유물 선택 모달
    // ==========================================
    showRelicSelectModal() {
        const modal = document.createElement('div');
        modal.className = 'event-modal relic-loadout-modal';
        modal.id = 'relic-loadout-modal';
        
        const lang = typeof LanguageSystem !== 'undefined' ? LanguageSystem.currentLanguage : 'kr';
        
        // 장착된 유물 효과 HTML
        let equippedHtml = '';
        if (this.equippedRelics.length > 0) {
            this.equippedRelics.forEach(relicId => {
                const relic = this.getRelicData(relicId);
                if (!relic) return;
                const name = lang === 'en' ? relic.nameEn : relic.name;
                const desc = lang === 'en' ? relic.descriptionEn : relic.description;
                
                const iconHtml = relic.isImageIcon 
                    ? `<img src="${relic.icon}" class="equipped-icon-img" onerror="this.outerHTML='${relic.icon}'">`
                    : relic.icon;
                equippedHtml += `
                    <div class="equipped-relic-item rarity-${relic.rarity}">
                        <span class="equipped-icon">${iconHtml}</span>
                        <div class="equipped-info">
                            <span class="equipped-name">${name}</span>
                            <span class="equipped-effect">${desc}</span>
                        </div>
                        <button class="unequip-btn" data-relic-id="${relicId}">해제</button>
                    </div>
                `;
            });
        } else {
            equippedHtml = '<div class="no-equipped">장착된 유물이 없습니다</div>';
        }
        
        // 유물 목록 HTML
        let relicsHtml = '';
        this.getAllRelicIds().forEach(relicId => {
            const relic = this.getRelicData(relicId);
            if (!relic) return;
            const isUnlocked = this.isUnlocked(relic.id);
            const isEquipped = this.isEquipped(relic.id);
            const name = lang === 'en' ? relic.nameEn : relic.name;
            const desc = lang === 'en' ? relic.descriptionEn : relic.description;
            
            relicsHtml += `
                <div class="loadout-relic ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''} rarity-${relic.rarity}"
                     data-relic-id="${relic.id}">
                    <div class="relic-icon-wrapper">
                        ${relic.isImageIcon 
                            ? `<img src="${relic.icon}" class="relic-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"><span class="relic-emoji" style="display:none">${relic.icon}</span>` 
                            : `<span class="relic-emoji">${relic.icon}</span>`}
                        ${!isUnlocked ? '<div class="relic-lock">🔒</div>' : ''}
                        ${isEquipped ? '<div class="relic-check">✓</div>' : ''}
                    </div>
                    <div class="relic-info">
                        <div class="relic-name">${isUnlocked ? name : '???'}</div>
                        <div class="relic-desc">${isUnlocked ? desc : '아직 발견되지 않은 유물'}</div>
                    </div>
                </div>
            `;
        });
        
        // 랜덤 대사 선택
        const dialogues = [
            "던전 밑에는 다양한 유물들이 있어요.",
            "이 유물들은 오래된 문명의 흔적이죠.",
            "조심하세요, 강력한 유물일수록 위험해요.",
            "이 유물이 당신을 지켜줄 거예요.",
            "더 깊은 던전에서 희귀한 유물을 찾을 수 있답니다.",
            "유물의 힘을 믿으세요!",
            "오늘은 어떤 유물을 가져가실 건가요?"
        ];
        const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        
        modal.innerHTML = `
            <div class="event-content loadout-content">
                <!-- 좌측: 캐릭터 영역 -->
                <div class="loadout-character-area">
                    <div class="character-container">
                        <img src="elderelf.png" class="character-sprite" alt="고고학자" onerror="this.src='hero.png'">
                    </div>
                    <div class="character-dialogue">
                        <div class="dialogue-bubble">
                            <span class="dialogue-text">${randomDialogue}</span>
                        </div>
                        <div class="character-name">고고학자 엘프</div>
                    </div>
                </div>
                
                <!-- 우측: 유물 패널 -->
                <div class="loadout-panel">
                    <!-- 헤더 (고정) -->
                    <div class="loadout-header">
                        <div class="loadout-title-area">
                            <h2 class="loadout-title">🏺 유물 보관소</h2>
                        </div>
                        <button class="loadout-close-btn" id="loadout-close">✕</button>
                    </div>
                    
                    <!-- 장착된 유물 (고정) -->
                    <div class="equipped-section">
                        <div class="equipped-header">
                            <span class="equipped-title">⚔️ 장착 중</span>
                            <span class="slots-count">${this.equippedRelics.length} / ${this.currentSlots}</span>
                        </div>
                        <div class="equipped-list">
                            ${equippedHtml}
                        </div>
                    </div>
                    
                    <!-- 스크롤 영역: 유물 목록 -->
                    <div class="loadout-scroll-area">
                        <div class="collection-header">
                            <span class="collection-title">📦 유물 컬렉션</span>
                            <span class="collection-count">${this.unlockedRelics.length} / ${this.getAllRelicIds().length} 해금</span>
                        </div>
                        <div class="loadout-relics-grid">
                            ${relicsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // 닫기 버튼
        modal.querySelector('#loadout-close').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
        
        // 이벤트 위임으로 처리 (모달 새로고침 없이)
        modal.addEventListener('click', (e) => {
            // 해제 버튼 클릭
            const unequipBtn = e.target.closest('.unequip-btn');
            if (unequipBtn) {
                e.stopPropagation();
                const relicId = unequipBtn.dataset.relicId;
                this.unequipRelic(relicId);
                this.updateModalUI(modal);
                return;
            }
            
            // 유물 클릭
            const relicEl = e.target.closest('.loadout-relic.unlocked');
            if (relicEl) {
                const relicId = relicEl.dataset.relicId;
                
                if (this.isEquipped(relicId)) {
                    // 해제
                    this.unequipRelic(relicId);
                } else {
                    // 장착
                    if (this.equippedRelics.length >= this.currentSlots) {
                        this.showMessage('슬롯이 부족합니다!');
                        return;
                    }
                    this.equipRelic(relicId);
                }
                
                // UI만 업데이트 (모달 유지)
                this.updateModalUI(modal);
            }
        });
    },
    
    // ==========================================
    // 모달 UI 업데이트 (새로고침 없이)
    // ==========================================
    updateModalUI(modal) {
        const lang = typeof LanguageSystem !== 'undefined' ? LanguageSystem.currentLanguage : 'kr';
        
        // 장착된 유물 목록 업데이트
        const equippedList = modal.querySelector('.equipped-list');
        if (equippedList) {
            let equippedHtml = '';
            if (this.equippedRelics.length > 0) {
                this.equippedRelics.forEach(relicId => {
                    const relic = this.getRelicData(relicId);
                    if (!relic) return;
                    const name = lang === 'en' ? relic.nameEn : relic.name;
                    const desc = lang === 'en' ? relic.descriptionEn : relic.description;
                    
                    const iconHtml = relic.isImageIcon 
                        ? `<img src="${relic.icon}" class="equipped-icon-img" onerror="this.outerHTML='${relic.icon}'">`
                        : relic.icon;
                    equippedHtml += `
                        <div class="equipped-relic-item rarity-${relic.rarity}">
                            <span class="equipped-icon">${iconHtml}</span>
                            <div class="equipped-info">
                                <span class="equipped-name">${name}</span>
                                <span class="equipped-effect">${desc}</span>
                            </div>
                            <button class="unequip-btn" data-relic-id="${relicId}">해제</button>
                        </div>
                    `;
                });
            } else {
                equippedHtml = '<div class="no-equipped">장착된 유물이 없습니다</div>';
            }
            equippedList.innerHTML = equippedHtml;
        }
        
        // 슬롯 카운트 업데이트
        const slotsCount = modal.querySelector('.slots-count');
        if (slotsCount) {
            slotsCount.textContent = `${this.equippedRelics.length} / ${this.currentSlots}`;
        }
        
        // 유물 그리드 업데이트 (장착 상태 표시)
        modal.querySelectorAll('.loadout-relic').forEach(el => {
            const relicId = el.dataset.relicId;
            const isEquipped = this.isEquipped(relicId);
            
            el.classList.toggle('equipped', isEquipped);
            
            // 체크 마크 업데이트
            const iconWrapper = el.querySelector('.relic-icon-wrapper');
            let checkMark = iconWrapper.querySelector('.relic-check');
            
            if (isEquipped && !checkMark) {
                checkMark = document.createElement('div');
                checkMark.className = 'relic-check';
                checkMark.textContent = '✓';
                iconWrapper.appendChild(checkMark);
            } else if (!isEquipped && checkMark) {
                checkMark.remove();
            }
        });
    },
    
    showMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'loadout-message';
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(239, 68, 68, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 100001;
            animation: msgPop 0.3s ease-out;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    },
    
    // ==========================================
    // CSS 스타일
    // ==========================================
    injectStyles() {
        if (document.getElementById('relic-loadout-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'relic-loadout-styles';
        style.textContent = `
            .relic-loadout-modal .loadout-content {
                max-width: 950px;
                max-height: 85vh;
                display: flex;
                flex-direction: row;
                overflow: hidden;
                gap: 0;
                padding: 0;
            }
            
            /* 좌측: 캐릭터 영역 */
            .loadout-character-area {
                width: 280px;
                background: linear-gradient(180deg, rgba(88, 28, 135, 0.3) 0%, rgba(30, 27, 75, 0.5) 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 30px 20px;
                border-right: 1px solid rgba(168, 85, 247, 0.3);
                flex-shrink: 0;
            }
            
            .character-container {
                position: relative;
                margin-bottom: 20px;
            }
            
            .character-sprite {
                width: 180px;
                height: 180px;
                object-fit: contain;
                image-rendering: pixelated;
                animation: characterIdle 1.5s ease-in-out infinite;
                filter: drop-shadow(0 10px 30px rgba(168, 85, 247, 0.4));
            }
            
            @keyframes characterIdle {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            
            .character-dialogue {
                text-align: center;
                width: 100%;
            }
            
            .dialogue-bubble {
                position: relative;
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                border: 2px solid #a855f7;
                border-radius: 15px;
                padding: 15px 18px;
                margin-bottom: 15px;
                box-shadow: 0 5px 20px rgba(168, 85, 247, 0.3);
            }
            
            .dialogue-bubble::after {
                content: '';
                position: absolute;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                border-left: 12px solid transparent;
                border-right: 12px solid transparent;
                border-bottom: 12px solid #a855f7;
            }
            
            .dialogue-bubble::before {
                content: '';
                position: absolute;
                top: -8px;
                left: 50%;
                transform: translateX(-50%);
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-bottom: 10px solid #1e1b4b;
                z-index: 1;
            }
            
            .dialogue-text {
                color: #e9d5ff;
                font-size: 0.95rem;
                line-height: 1.5;
                display: block;
            }
            
            .character-name {
                color: #c4b5fd;
                font-size: 1.1rem;
                font-weight: bold;
                text-shadow: 0 2px 10px rgba(168, 85, 247, 0.5);
            }
            
            /* 우측: 유물 패널 */
            .loadout-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                padding: 20px;
            }
            
            /* 헤더 (고정) */
            .loadout-header {
                display: flex;
                align-items: center;
                gap: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
            }
            
            .loadout-title-area {
                flex: 1;
            }
            
            .loadout-title {
                color: #a855f7;
                font-size: 1.4rem;
                margin-bottom: 0;
            }
            
            .loadout-close-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                background: rgba(100, 116, 139, 0.3);
                color: #94a3b8;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .loadout-close-btn:hover {
                background: rgba(239, 68, 68, 0.5);
                color: #fff;
            }
            
            /* 반응형: 좁은 화면에서 캐릭터 숨기기 */
            @media (max-width: 800px) {
                .loadout-character-area {
                    display: none;
                }
                
                .relic-loadout-modal .loadout-content {
                    max-width: 550px;
                }
            }
            
            /* 장착된 유물 섹션 (고정) */
            .equipped-section {
                background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 12px;
                padding: 12px;
                margin: 15px 0;
                flex-shrink: 0;
            }
            
            .equipped-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .equipped-title {
                color: #a855f7;
                font-weight: bold;
                font-size: 1rem;
            }
            
            .slots-count {
                color: #c4b5fd;
                font-size: 0.9rem;
                font-weight: bold;
            }
            
            .equipped-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .equipped-relic-item {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0, 0, 0, 0.3);
                padding: 10px 12px;
                border-radius: 8px;
                border-left: 4px solid #9ca3af;
            }
            
            .equipped-relic-item.rarity-common { border-left-color: #9ca3af; }
            .equipped-relic-item.rarity-uncommon { border-left-color: #22c55e; }
            .equipped-relic-item.rarity-rare { border-left-color: #3b82f6; }
            .equipped-relic-item.rarity-legendary { border-left-color: #f59e0b; }
            
            .equipped-icon {
                font-size: 1.8rem;
            }
            
            .equipped-icon-img {
                width: 28px;
                height: 28px;
                object-fit: contain;
            }
            
            .equipped-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .equipped-name {
                color: #fff;
                font-weight: bold;
                font-size: 0.95rem;
            }
            
            .equipped-effect {
                color: #22c55e;
                font-size: 0.8rem;
            }
            
            .unequip-btn {
                padding: 5px 12px;
                border: 1px solid #ef4444;
                background: rgba(239, 68, 68, 0.2);
                color: #fca5a5;
                border-radius: 6px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .unequip-btn:hover {
                background: rgba(239, 68, 68, 0.4);
                color: #fff;
            }
            
            .no-equipped {
                color: #64748b;
                text-align: center;
                padding: 15px;
                font-style: italic;
            }
            
            /* 스크롤 영역 */
            .loadout-scroll-area {
                flex: 1;
                overflow-y: auto;
                padding-right: 5px;
                margin-top: 10px;
            }
            
            .loadout-scroll-area::-webkit-scrollbar {
                width: 6px;
            }
            
            .loadout-scroll-area::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }
            
            .loadout-scroll-area::-webkit-scrollbar-thumb {
                background: #4a5568;
                border-radius: 3px;
            }
            
            .collection-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .collection-title {
                color: #94a3b8;
                font-weight: bold;
                font-size: 0.95rem;
            }
            
            .collection-count {
                color: #64748b;
                font-size: 0.8rem;
            }
            
            .loadout-relics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 8px;
            }
            
            .loadout-relic {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid #374151;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .loadout-relic:hover {
                background: rgba(168, 85, 247, 0.1);
                border-color: #a855f7;
            }
            
            .loadout-relic.locked {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .loadout-relic.locked:hover {
                background: rgba(0, 0, 0, 0.3);
                border-color: #374151;
            }
            
            .loadout-relic.equipped {
                background: rgba(168, 85, 247, 0.2);
                border-color: #a855f7;
            }
            
            .loadout-relic.rarity-common { border-left: 4px solid #9ca3af; }
            .loadout-relic.rarity-uncommon { border-left: 4px solid #22c55e; }
            .loadout-relic.rarity-rare { border-left: 4px solid #3b82f6; }
            .loadout-relic.rarity-legendary { border-left: 4px solid #f59e0b; }
            
            .relic-icon-wrapper {
                position: relative;
                width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                flex-shrink: 0;
            }
            
            .relic-icon-wrapper .relic-img {
                width: 35px;
                height: 35px;
                object-fit: contain;
                image-rendering: pixelated;
            }
            
            .relic-icon-wrapper .relic-emoji {
                font-size: 1.8rem;
            }
            
            .relic-lock {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.3rem;
                background: rgba(0, 0, 0, 0.7);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
            }
            
            .relic-check {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 20px;
                height: 20px;
                background: #22c55e;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                color: white;
                font-weight: bold;
            }
            
            .relic-info {
                flex: 1;
                min-width: 0;
            }
            
            .relic-name {
                font-weight: bold;
                color: #fff;
                margin-bottom: 2px;
                font-size: 0.9rem;
            }
            
            .relic-desc {
                font-size: 0.75rem;
                color: #94a3b8;
                line-height: 1.3;
            }
            
            @keyframes msgPop {
                0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
                100% { transform: translateX(-50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
};

// 전역 접근
window.RelicLoadoutSystem = RelicLoadoutSystem;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    RelicLoadoutSystem.init();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    RelicLoadoutSystem.init();
}

console.log('[RelicLoadout] 유물 장착 시스템 로드 완료');

