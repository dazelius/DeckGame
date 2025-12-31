// ==========================================
// 보물 상자 시스템
// ==========================================

const TreasureSystem = {
    // 보물 확률 설정
    REWARD_CHANCES: {
        CARD: 0.35,      // 35% - 카드 3개 중 1개 선택
        RELIC: 0.25,     // 25% - 유물 1개 획득
        GOLD: 0.25,      // 25% - 골드 획득
        MIMIC: 0.15      // 15% - 미믹 몬스터
    },
    
    // 드래그 상태
    isDragging: false,
    dragStartY: 0,
    currentDragY: 0,
    chestOpened: false,
    requiredDrag: 150, // 필요한 드래그 거리
    
    // 현재 방 참조
    currentRoom: null,
    
    // ==========================================
    // 보물상자 열기
    // ==========================================
    open(room) {
        this.currentRoom = room;
        this.chestOpened = false;
        this.isDragging = false;
        
        // 다크소울 스타일 모달 생성
        const modal = document.createElement('div');
        modal.className = 'treasure-modal ds-treasure';
        modal.id = 'treasure-modal';
        modal.innerHTML = this.renderTreasureScreen();
        
        document.body.appendChild(modal);
        this.injectStyles();
        
        // 이벤트 바인딩
        this.bindDragEvents(modal);
        
        // 애니메이션
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    },
    
    // ==========================================
    // 보물 화면 렌더링
    // ==========================================
    renderTreasureScreen() {
        return `
            <div class="ds-treasure-backdrop"></div>
            <div class="ds-treasure-container">
                <!-- 제목 -->
                <div class="ds-treasure-title">
                    <h1>보물 상자</h1>
                </div>
                
                <!-- 보물상자 영역 -->
                <div class="ds-chest-area" id="chest-area">
                    <div class="ds-chest-wrapper" id="chest-wrapper">
                        <div class="ds-chest" id="treasure-chest">
                            <img src="chest.png" alt="보물상자" class="chest-img chest-closed" id="chest-closed" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">
                            <img src="chest_open.png" alt="열린 상자" class="chest-img chest-open" id="chest-open">
                            <span class="chest-fallback">📦</span>
                            <div class="chest-glow" id="chest-glow"></div>
                            <div class="chest-particles" id="chest-particles"></div>
                        </div>
                        
                        <!-- 드래그 인디케이터 -->
                        <div class="ds-drag-indicator" id="drag-indicator">
                            <div class="drag-arrow">↑</div>
                            <div class="drag-text">위로 드래그하여 열기</div>
                            <div class="drag-progress">
                                <div class="drag-progress-fill" id="drag-progress-fill"></div>
                            </div>
                        </div>
                    </div>
                    <div class="ds-light-rays" id="light-rays"></div>
                </div>
                
                <!-- 힌트 -->
                <div class="ds-treasure-hint" id="treasure-hint">
                    상자를 위로 드래그하여 열어보세요
                </div>
                
                <!-- 보상 오버레이 (보상 표시 시 배경 가림) -->
                <div class="ds-reward-overlay hidden" id="reward-overlay"></div>
                
                <!-- 보상 영역 -->
                <div class="ds-reward-area hidden" id="reward-area">
                    <!-- 동적으로 채워짐 -->
                </div>
            </div>
            
            <!-- 닫기 버튼 -->
            <button class="ds-close hidden" id="treasure-close" onclick="TreasureSystem.close()">
                <span>×</span>
            </button>
        `;
    },
    
    // ==========================================
    // 드래그 이벤트 바인딩
    // ==========================================
    bindDragEvents(modal) {
        const chestArea = modal.querySelector('#chest-area');
        const chestWrapper = modal.querySelector('#chest-wrapper');
        
        // 마우스 이벤트
        chestArea.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));
        
        // 터치 이벤트
        chestArea.addEventListener('touchstart', (e) => this.startDrag(e));
        document.addEventListener('touchmove', (e) => this.onDrag(e));
        document.addEventListener('touchend', (e) => this.endDrag(e));
    },
    
    startDrag(e) {
        if (this.chestOpened) return;
        
        this.isDragging = true;
        this.dragStartY = e.clientY || e.touches?.[0]?.clientY || 0;
        this.currentDragY = 0;
        
        const chest = document.getElementById('treasure-chest');
        chest?.classList.add('grabbing');
    },
    
    onDrag(e) {
        if (!this.isDragging || this.chestOpened) return;
        
        const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
        const deltaY = this.dragStartY - currentY; // 위로 드래그하면 양수
        
        this.currentDragY = Math.max(0, deltaY); // 위로만 드래그 가능
        
        // 진행률 업데이트
        const progress = Math.min(1, this.currentDragY / this.requiredDrag);
        this.updateDragProgress(progress);
        
        // 뚜껑 기울기 업데이트
        this.updateLidAngle(progress);
        
        // 열기 완료
        if (progress >= 1) {
            this.openChest();
        }
    },
    
    endDrag(e) {
        if (!this.isDragging || this.chestOpened) return;
        
        this.isDragging = false;
        
        const chest = document.getElementById('treasure-chest');
        chest?.classList.remove('grabbing');
        
        // 열지 못했으면 리셋
        if (this.currentDragY < this.requiredDrag) {
            this.resetDrag();
        }
    },
    
    updateDragProgress(progress) {
        const fill = document.getElementById('drag-progress-fill');
        if (fill) {
            fill.style.width = `${progress * 100}%`;
        }
    },
    
    updateLidAngle(progress) {
        // 닫힌 상자 → 열린 상자 전환 (점진적)
        const chestClosed = document.getElementById('chest-closed');
        const chestOpen = document.getElementById('chest-open');
        const chestGlow = document.getElementById('chest-glow');
        const chest = document.getElementById('treasure-chest');
        
        if (chestClosed && chestOpen) {
            // 상자가 점점 열리는 효과
            chestClosed.style.opacity = 1 - progress;
            chestOpen.style.opacity = progress;
        }
        
        if (chest) {
            // 살짝 흔들리며 위로 올라가는 효과
            const shake = Math.sin(progress * 15) * (progress * 2);
            const lift = progress * 10; // 위로 살짝 올라감
            const scale = 1 + progress * 0.08;
            chest.style.transform = `translateX(${shake}px) translateY(-${lift}px) scale(${scale})`;
        }
        
        if (chestGlow) {
            // 빛이 점점 강해지고 커짐 (황금색 유지)
            const intensity = 0.3 + progress * 0.7;
            const size = 1 + progress * 1.2;
            chestGlow.style.opacity = intensity;
            chestGlow.style.transform = `translateX(-50%) scale(${size})`;
        }
        
        // 빛 파티클 (진행률에 따라 빈도/크기 증가)
        if (progress > 0.2 && Math.random() < progress * 0.25) {
            this.spawnProgressParticle(progress);
        }
    },
    
    // 진행률에 따른 파티클 생성
    spawnProgressParticle(progress) {
        const container = document.getElementById('chest-particles');
        if (!container) return;
        
        const particle = document.createElement('div');
        particle.className = 'light-particle';
        
        // 진행률에 따라 파티클 크기와 밝기 증가
        const x = Math.random() * 100 - 50;
        const baseSize = 3 + progress * 6;
        const size = baseSize + Math.random() * 4;
        const duration = 0.6 + Math.random() * 0.4;
        const brightness = 0.7 + progress * 0.3;
        
        particle.style.cssText = `
            left: calc(50% + ${x}px);
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255, 215, 100, ${brightness}) 0%, rgba(255, 180, 50, ${brightness * 0.5}) 50%, transparent 70%);
            animation-duration: ${duration}s;
        `;
        
        container.appendChild(particle);
        setTimeout(() => particle.remove(), duration * 1000);
    },
    
    // 빛 파티클 생성
    spawnLightParticle() {
        const container = document.getElementById('chest-particles');
        if (!container) return;
        
        const particle = document.createElement('div');
        particle.className = 'light-particle';
        
        // 랜덤 위치 및 크기
        const x = Math.random() * 120 - 60;
        const size = 4 + Math.random() * 8;
        const duration = 0.8 + Math.random() * 0.6;
        const delay = Math.random() * 0.2;
        
        particle.style.cssText = `
            left: calc(50% + ${x}px);
            width: ${size}px;
            height: ${size}px;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        
        container.appendChild(particle);
        
        // 애니메이션 끝나면 제거
        setTimeout(() => particle.remove(), (duration + delay) * 1000);
    },
    
    // 빛 파티클 폭발 (상자 열릴 때)
    burstLightParticles() {
        const container = document.getElementById('chest-particles');
        if (!container) return;
        
        // 많은 파티클 한번에 생성
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'light-particle burst';
            
            const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.3;
            const distance = 30 + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance - 30; // 위쪽으로 편향
            const size = 6 + Math.random() * 10;
            const duration = 0.6 + Math.random() * 0.4;
            const delay = Math.random() * 0.15;
            
            particle.style.cssText = `
                --end-x: ${x}px;
                --end-y: ${y}px;
                width: ${size}px;
                height: ${size}px;
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
            `;
            
            container.appendChild(particle);
            setTimeout(() => particle.remove(), (duration + delay) * 1000);
        }
        
        // 추가 상승 파티클
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'light-particle rising';
                
                const x = Math.random() * 100 - 50;
                const size = 3 + Math.random() * 6;
                const duration = 1 + Math.random() * 0.5;
                
                particle.style.cssText = `
                    left: calc(50% + ${x}px);
                    width: ${size}px;
                    height: ${size}px;
                    animation-duration: ${duration}s;
                `;
                
                container.appendChild(particle);
                setTimeout(() => particle.remove(), duration * 1000);
            }, i * 50);
        }
    },
    
    resetDrag() {
        this.currentDragY = 0;
        
        // 부드럽게 리셋
        const chestClosed = document.getElementById('chest-closed');
        const chestOpen = document.getElementById('chest-open');
        const chestGlow = document.getElementById('chest-glow');
        const chest = document.getElementById('treasure-chest');
        const fill = document.getElementById('drag-progress-fill');
        
        if (chestClosed && chestOpen) {
            chestClosed.style.transition = 'opacity 0.3s ease';
            chestOpen.style.transition = 'opacity 0.3s ease';
            chestClosed.style.opacity = 1;
            chestOpen.style.opacity = 0;
            setTimeout(() => {
                chestClosed.style.transition = '';
                chestOpen.style.transition = '';
            }, 300);
        }
        
        if (chest) {
            chest.style.transition = 'transform 0.3s ease';
            chest.style.transform = 'translateX(0) translateY(0) scale(1)';
            setTimeout(() => {
                chest.style.transition = '';
            }, 300);
        }
        
        if (chestGlow) {
            chestGlow.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            chestGlow.style.opacity = 0.3;
            chestGlow.style.transform = 'translateX(-50%) scale(1)';
            setTimeout(() => {
                chestGlow.style.transition = '';
            }, 300);
        }
        
        if (fill) {
            fill.style.width = '0%';
        }
        
        // 파티클 정리
        const particles = document.getElementById('chest-particles');
        if (particles) particles.innerHTML = '';
    },
    
    // ==========================================
    // 상자 열기
    // ==========================================
    openChest() {
        if (this.chestOpened) return;
        this.chestOpened = true;
        this.isDragging = false;
        
        // 열린 상자 완전히 표시
        const chestClosed = document.getElementById('chest-closed');
        const chestOpen = document.getElementById('chest-open');
        const chest = document.getElementById('treasure-chest');
        const chestGlow = document.getElementById('chest-glow');
        const chestWrapper = document.getElementById('chest-wrapper');
        
        if (chestClosed) chestClosed.style.opacity = 0;
        if (chestOpen) chestOpen.style.opacity = 1;
        
        // 상자 영역을 위로 이동 (보상 영역과 겹치지 않게)
        if (chestWrapper) {
            chestWrapper.style.transition = 'transform 0.6s ease-out';
            chestWrapper.style.transform = 'translateY(-80px)';
        }
        
        // 상자 열기 애니메이션 (살짝 커짐)
        if (chest) {
            chest.style.transition = 'transform 0.5s ease-out';
            chest.style.transform = 'scale(1.1)';
        }
        
        // 빛 강하게
        if (chestGlow) {
            chestGlow.style.transition = 'all 0.5s ease-out';
            chestGlow.style.opacity = 1;
            chestGlow.style.transform = 'translateX(-50%) scale(2)';
        }
        
        // 빛 파티클 폭발
        this.burstLightParticles();
        
        // 빛 이펙트
        const lightRays = document.getElementById('light-rays');
        lightRays?.classList.add('active');
        
        // 힌트 숨기기
        const hint = document.getElementById('treasure-hint');
        const dragIndicator = document.getElementById('drag-indicator');
        hint?.classList.add('hidden');
        dragIndicator?.classList.add('hidden');
        
        // 상자 빛남 클래스
        chest?.classList.add('opened');
        
        // 보상 결정 및 표시
        setTimeout(() => {
            this.determineReward();
        }, 800);
    },
    
    // ==========================================
    // 보상 섹션 표시 (오버레이로 배경 가림)
    // ==========================================
    showRewardSection() {
        const overlay = document.getElementById('reward-overlay');
        const rewardArea = document.getElementById('reward-area');
        
        // 오버레이 표시 (80% 어둡게)
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        
        // 보상 영역 표시
        if (rewardArea) {
            rewardArea.classList.remove('hidden');
        }
        
        // 닫기 버튼 표시
        document.getElementById('treasure-close')?.classList.remove('hidden');
        
        // 힌트 숨기기
        const hint = document.getElementById('treasure-hint');
        if (hint) hint.style.display = 'none';
    },
    
    // ==========================================
    // 보상 결정
    // ==========================================
    determineReward() {
        const roll = Math.random();
        let cumulativeChance = 0;
        let rewardType = 'GOLD';
        
        for (const [type, chance] of Object.entries(this.REWARD_CHANCES)) {
            cumulativeChance += chance;
            if (roll < cumulativeChance) {
                rewardType = type;
                break;
            }
        }
        
        console.log(`[Treasure] 보상 타입: ${rewardType}`);
        
        switch (rewardType) {
            case 'CARD':
                this.showCardReward();
                break;
            case 'RELIC':
                this.showRelicReward();
                break;
            case 'GOLD':
                this.showGoldReward();
                break;
            case 'MIMIC':
                this.showMimicEncounter();
                break;
        }
    },
    
    // ==========================================
    // 카드 보상 (3개 중 1개 선택)
    // ==========================================
    showCardReward() {
        // 랜덤 카드 3개 선택
        const cards = this.getRandomCards(3);
        
        const rewardArea = document.getElementById('reward-area');
        if (!rewardArea) return;
        
        rewardArea.innerHTML = `
            <div class="ds-reward-title">카드 획득!</div>
            <div class="ds-reward-subtitle">하나를 선택하세요</div>
            <div class="ds-card-choices">
                ${cards.map((card, i) => `
                    <div class="ds-card-choice" data-card-id="${card.id}" data-index="${i}">
                        <div class="ds-card-inner">
                            <div class="ds-card-cost">${card.cost}</div>
                            <div class="ds-card-icon">${this.getCardIconHtml(card)}</div>
                            <div class="ds-card-name">${card.name}</div>
                            <div class="ds-card-type ${card.type}">${card.type === 'attack' ? '공격' : '스킬'}</div>
                            <div class="ds-card-desc">${card.description || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="ds-skip-btn" onclick="TreasureSystem.skipReward()">건너뛰기</button>
        `;
        
        // 보상 섹션 표시 & 상자 축소
        this.showRewardSection();
        
        // 카드 선택 이벤트
        rewardArea.querySelectorAll('.ds-card-choice').forEach(el => {
            el.addEventListener('click', () => {
                const cardId = el.dataset.cardId;
                this.selectCard(cardId);
            });
        });
        
        // 닫기 버튼 표시
        document.getElementById('treasure-close')?.classList.remove('hidden');
    },
    
    getRandomCards(count) {
        const cards = [];
        const cardPool = [];
        
        // 카드 데이터베이스에서 가져오기
        if (typeof cardDatabase !== 'undefined') {
            Object.values(cardDatabase).forEach(card => {
                if (card.rarity !== 'starter' && card.rarity !== 'special') {
                    cardPool.push(card);
                }
            });
        }
        
        // 랜덤 선택
        const shuffled = [...cardPool].sort(() => Math.random() - 0.5);
        for (let i = 0; i < count && i < shuffled.length; i++) {
            cards.push(shuffled[i]);
        }
        
        // 카드가 없으면 기본 카드
        if (cards.length === 0) {
            cards.push({ id: 'strike', name: '강타', cost: 1, type: 'attack', icon: '⚔️', description: '6 피해' });
            cards.push({ id: 'defend', name: '방어', cost: 1, type: 'skill', icon: '🛡️', description: '5 방어도' });
            cards.push({ id: 'slash', name: '베기', cost: 2, type: 'attack', icon: '🗡️', description: '12 피해' });
        }
        
        return cards;
    },
    
    selectCard(cardId) {
        // 덱에 카드 추가 (gameState.deck에 직접 추가)
        const cardData = typeof cardDatabase !== 'undefined' ? cardDatabase[cardId] : null;
        
        if (cardData) {
            // gameState.deck에 추가
            if (typeof gameState !== 'undefined' && gameState.deck) {
                gameState.deck.push({...cardData});
                
                // fullDeck도 업데이트 (있으면)
                if (gameState.fullDeck) {
                    gameState.fullDeck.push({...cardData});
                }
                
                console.log(`[Treasure] 카드 획득: ${cardData.name}`);
                this.showRewardMessage(`${cardData.name} 획득!`, '🃏');
            }
        }
        
        this.completeReward();
    },
    
    getCardIconHtml(card) {
        if (!card.icon) return '❓';
        if (card.icon.includes('<img')) return card.icon;
        if (card.icon.endsWith('.png') || card.icon.endsWith('.jpg')) {
            return `<img src="${card.icon}" alt="${card.name}" class="card-icon-img">`;
        }
        return card.icon;
    },
    
    // ==========================================
    // 유물 보상
    // ==========================================
    showRelicReward() {
        const relic = this.getRandomRelic();
        
        const rewardArea = document.getElementById('reward-area');
        if (!rewardArea) return;
        
        const iconHtml = relic.isImageIcon 
            ? `<img src="${relic.icon}" class="ds-relic-icon-img">` 
            : relic.icon;
        
        rewardArea.innerHTML = `
            <div class="ds-relic-reward">
                <div class="ds-relic-display">
                    <div class="ds-relic-icon-large">${iconHtml}</div>
                    <div class="ds-relic-name">${relic.name_kr || relic.name}</div>
                    <div class="ds-relic-desc">${relic.description_kr || relic.description}</div>
                </div>
            </div>
            <button class="ds-confirm-btn" onclick="TreasureSystem.claimRelic('${relic.id}')">획득</button>
        `;
        
        // 보상 섹션 표시 & 상자 축소
        this.showRewardSection();
        
        rewardArea.classList.remove('hidden');
    },
    
    getRandomRelic() {
        // RelicSystem에서 랜덤 유물 가져오기
        if (typeof getRandomRelicReward === 'function') {
            return getRandomRelicReward('uncommon') || this.getDefaultRelic();
        }
        
        if (typeof relicDatabase !== 'undefined') {
            const relics = Object.values(relicDatabase).filter(r => r.rarity !== 'starter');
            if (relics.length > 0) {
                return relics[Math.floor(Math.random() * relics.length)];
            }
        }
        
        return this.getDefaultRelic();
    },
    
    getDefaultRelic() {
        return {
            id: 'treasureGem',
            name: 'Treasure Gem',
            name_kr: '보물 보석',
            icon: '💎',
            description: 'A mysterious gem from the treasure chest.',
            description_kr: '보물 상자에서 발견한 신비로운 보석.'
        };
    },
    
    claimRelic(relicId) {
        if (typeof RelicSystem !== 'undefined' && typeof RelicSystem.addRelic === 'function') {
            // RelicSystem.addRelic은 relicId(문자열)를 받음
            RelicSystem.addRelic(relicId);
            
            const relic = typeof relicDatabase !== 'undefined' ? relicDatabase[relicId] : null;
            const relicName = relic ? (relic.name_kr || relic.name) : relicId;
            
            console.log(`[Treasure] 유물 획득: ${relicName}`);
            this.showRewardMessage(`${relicName} 획득!`, '💎');
        }
        
        this.completeReward();
    },
    
    // ==========================================
    // 골드 보상
    // ==========================================
    showGoldReward() {
        const goldAmount = this.randomRange(40, 100);
        
        const rewardArea = document.getElementById('reward-area');
        if (!rewardArea) return;
        
        rewardArea.innerHTML = `
            <div class="ds-reward-title">금화 발견!</div>
            <div class="ds-gold-reward">
                <div class="ds-gold-pile">
                    <span class="ds-gold-icon">💰</span>
                    <span class="ds-gold-amount">+${goldAmount}</span>
                </div>
            </div>
            <button class="ds-confirm-btn" onclick="TreasureSystem.claimGold(${goldAmount})">획득</button>
        `;
        
        // 보상 섹션 표시 & 상자 축소
        this.showRewardSection();
    },
    
    claimGold(amount) {
        if (typeof GoldSystem !== 'undefined') {
            GoldSystem.addGold(amount);
        }
        gameState.gold = (gameState.gold || 0) + amount;
        
        console.log(`[Treasure] 골드 획득: ${amount}`);
        this.showRewardMessage(`${amount} 골드 획득!`, '💰');
        
        this.completeReward();
    },
    
    // ==========================================
    // 미믹 조우
    // ==========================================
    showMimicEncounter() {
        const rewardArea = document.getElementById('reward-area');
        const overlay = document.getElementById('reward-overlay');
        if (!rewardArea) return;
        
        // 상자를 미믹으로 변환하는 애니메이션
        const chest = document.getElementById('treasure-chest');
        chest?.classList.add('mimic-transform');
        
        setTimeout(() => {
            // 80% 오버레이 표시
            if (overlay) {
                overlay.classList.remove('hidden');
            }
            
            rewardArea.innerHTML = `
                <div class="ds-mimic-warning">
                    <img src="mimic.png" class="ds-mimic-img" alt="미믹" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="ds-mimic-icon-fallback" style="display:none;">👾</div>
                    <div class="ds-mimic-title">미믹이다!</div>
                    <div class="ds-mimic-desc">보물 상자가 몬스터였습니다!</div>
                </div>
                <button class="ds-battle-btn" onclick="TreasureSystem.startMimicBattle()">
                    ⚔️ 전투 시작
                </button>
            `;
            
            rewardArea.classList.remove('hidden');
        }, 500);
    },
    
    startMimicBattle() {
        // 모달만 닫기 (맵으로 돌아가지 않음)
        const modal = document.getElementById('treasure-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 400);
        }
        
        // 맵 숨기기
        if (typeof MapSystem !== 'undefined') {
            MapSystem.hideMap();
        }
        
        // 미믹 전투 설정
        if (typeof gameState !== 'undefined') {
            gameState.currentBattleType = 'mimic';
            gameState.mimicReward = true; // 미믹 클리어 시 유물 보상
            gameState.assignedMonsters = [{
                name: 'mimic',
                isBoss: false,
                isElite: false,
                isMimic: true
            }];
            
            // 전투 시작
            if (typeof startBattle === 'function') {
                startBattle();
            }
        }
    },
    
    // 미믹 전투 승리 후 호출
    onMimicVictory() {
        // 유물 보상
        const relic = this.getRandomRelic();
        
        if (typeof RelicSystem !== 'undefined' && typeof RelicSystem.addRelic === 'function' && relic) {
            RelicSystem.addRelic(relic.id);
            console.log(`[Treasure] 미믹 클리어 유물: ${relic.name_kr || relic.name}`);
        }
        
        // 방 클리어 처리
        if (this.currentRoom) {
            this.currentRoom.cleared = true;
            if (typeof MapSystem !== 'undefined') {
                MapSystem.roomsCleared++;
            }
        }
        
        gameState.mimicReward = false;
    },
    
    // ==========================================
    // 보상 완료
    // ==========================================
    completeReward() {
        // 방 클리어 처리
        if (this.currentRoom) {
            this.currentRoom.cleared = true;
            if (typeof MapSystem !== 'undefined') {
                MapSystem.roomsCleared++;
                MapSystem.updateUI();
                MapSystem.renderMinimap();
            }
        }
        
        this.close();
    },
    
    skipReward() {
        this.completeReward();
    },
    
    close() {
        const modal = document.getElementById('treasure-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                
                // 맵 화면으로 돌아가기
                if (typeof MapSystem !== 'undefined') {
                    MapSystem.showMap();
                }
            }, 400);
        }
    },
    
    showRewardMessage(text, icon) {
        const msg = document.createElement('div');
        msg.className = 'ds-reward-message';
        msg.innerHTML = `<span class="msg-icon">${icon}</span><span>${text}</span>`;
        document.body.appendChild(msg);
        
        requestAnimationFrame(() => msg.classList.add('visible'));
        
        setTimeout(() => {
            msg.classList.remove('visible');
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    randomRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('treasure-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'treasure-styles';
        style.textContent = `
            /* 보물 상자 모달 */
            .ds-treasure {
                position: fixed;
                inset: 0;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            
            .ds-treasure.active {
                opacity: 1;
            }
            
            .ds-treasure-backdrop {
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.8) 100%),
                    url('dungeon_tile.png') center center / contain no-repeat,
                    #0a0a0f;
                image-rendering: pixelated;
            }
            
            .ds-treasure-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 30px 20px;
                z-index: 50;
            }
            
            /* 제목 */
            .ds-treasure-title {
                display: flex;
                align-items: center;
                gap: 20px;
                margin-bottom: 10px;
                margin-bottom: 40px;
            }
            
            .ds-treasure-title h1 {
                margin: 0;
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                color: #d4af37;
                letter-spacing: 8px;
                text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
            }
            
            .title-line {
                width: 80px;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.6), transparent);
            }
            
            /* 상자 영역 */
            .ds-chest-area {
                position: relative;
                width: 250px;
                height: 220px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: grab;
                user-select: none;
            }
            
            .ds-chest-wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            /* 상자 */
            .ds-chest {
                position: relative;
                width: 200px;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ds-chest.grabbing {
                cursor: grabbing;
            }
            
            .ds-chest.opened {
                animation: chestOpenPulse 0.8s ease-out forwards;
            }
            
            @keyframes chestOpenPulse {
                0% { transform: translateY(-20px) scale(1.15); }
                50% { transform: translateY(-30px) scale(1.2); }
                100% { transform: translateY(-20px) scale(1.15); }
            }
            
            /* 상자 이미지 - 겹쳐서 표시 */
            .chest-img {
                position: absolute;
                max-width: 180px;
                max-height: 180px;
                image-rendering: pixelated;
                filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5));
                transition: opacity 0.1s ease;
            }
            
            .chest-closed {
                opacity: 1;
                z-index: 2;
            }
            
            .chest-open {
                opacity: 0;
                z-index: 1;
            }
            
            /* 이미지 없을 때 폴백 */
            .ds-chest.no-image .chest-fallback {
                display: flex !important;
            }
            
            .chest-fallback {
                display: none;
                width: 150px;
                height: 150px;
                font-size: 100px;
                align-items: center;
                justify-content: center;
                position: absolute;
            }
            
            /* 바닥 빛 */
            .chest-glow {
                position: absolute;
                bottom: -30px;
                left: 50%;
                transform: translateX(-50%);
                width: 220px;
                height: 120px;
                background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.5) 0%, transparent 70%);
                opacity: 0.3;
                pointer-events: none;
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            
            /* 빛 파티클 컨테이너 */
            .chest-particles {
                position: absolute;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: visible;
            }
            
            /* 빛 파티클 - 기본 상승 */
            .light-particle {
                position: absolute;
                bottom: 50%;
                left: 50%;
                background: radial-gradient(circle, #fff 0%, #ffd700 50%, transparent 100%);
                border-radius: 50%;
                opacity: 0;
                animation: particleRise 1s ease-out forwards;
            }
            
            @keyframes particleRise {
                0% {
                    opacity: 0;
                    transform: translate(-50%, 0) scale(0);
                }
                20% {
                    opacity: 1;
                    transform: translate(-50%, 0) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -120px) scale(0.5);
                }
            }
            
            /* 빛 파티클 - 폭발 */
            .light-particle.burst {
                animation: particleBurst 0.8s ease-out forwards;
            }
            
            @keyframes particleBurst {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                    left: 50%;
                    top: 50%;
                }
                100% {
                    opacity: 0;
                    transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(0.3);
                    left: 50%;
                    top: 50%;
                }
            }
            
            /* 빛 파티클 - 계속 상승 */
            .light-particle.rising {
                bottom: 30%;
                animation: particleRising 1.5s ease-out forwards;
            }
            
            @keyframes particleRising {
                0% {
                    opacity: 0;
                    transform: translate(-50%, 0) scale(0.5);
                }
                30% {
                    opacity: 1;
                    transform: translate(-50%, -20px) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -150px) scale(0.2);
                }
            }
            
            /* 드래그 인디케이터 */
            .ds-drag-indicator {
                margin-top: 30px;
                text-align: center;
                transition: opacity 0.3s ease;
            }
            
            .ds-drag-indicator.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .drag-arrow {
                font-size: 2rem;
                color: #d4af37;
                animation: arrowBounce 1s ease-in-out infinite;
            }
            
            @keyframes arrowBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .drag-text {
                font-size: 0.9rem;
                color: #8a7a5a;
                margin: 10px 0;
                letter-spacing: 2px;
            }
            
            .drag-progress {
                width: 150px;
                height: 4px;
                background: rgba(100, 80, 50, 0.3);
                border-radius: 2px;
                margin: 0 auto;
                overflow: hidden;
            }
            
            .drag-progress-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #d4af37, #f5e6c4);
                transition: width 0.1s ease;
            }
            
            /* 빛 이펙트 */
            .ds-light-rays {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 400px;
                height: 400px;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            .ds-light-rays.active {
                opacity: 1;
                animation: lightRaysRotate 3s linear infinite;
            }
            
            .ds-light-rays::before {
                content: '';
                position: absolute;
                inset: 0;
                background: conic-gradient(from 0deg, transparent, rgba(212, 175, 55, 0.3), transparent, rgba(212, 175, 55, 0.3), transparent);
                border-radius: 50%;
            }
            
            @keyframes lightRaysRotate {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            /* 보상 오버레이 - 80% 어둡게 배경 가림 */
            .ds-reward-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 100;
                animation: overlayFadeIn 0.4s ease-out;
            }
            
            .ds-reward-overlay.hidden {
                display: none;
            }
            
            @keyframes overlayFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* 보상 영역 - 화면 중앙에 표시 */
            .ds-reward-area {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 101;
                text-align: center;
                width: 100%;
                max-width: 700px;
                padding: 40px 20px;
                animation: rewardAppear 0.4s ease-out;
            }
            
            .ds-reward-area.hidden {
                display: none;
            }
            
            @keyframes rewardAppear {
                from { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            
            .ds-reward-title {
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                color: #d4af37;
                margin-bottom: 10px;
                text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
            }
            
            .ds-reward-subtitle {
                font-size: 1rem;
                color: #8a7a5a;
                margin-bottom: 30px;
            }
            
            /* 카드 선택 */
            .ds-card-choices {
                display: flex;
                gap: 20px;
                justify-content: center;
                margin-bottom: 20px;
            }
            
            .ds-card-choice {
                width: 140px;
                height: 200px;
                background: linear-gradient(160deg, #252535 0%, #15151f 100%);
                border: 2px solid #4a4a6a;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                padding: 10px;
            }
            
            .ds-card-choice:hover {
                transform: translateY(-10px);
                border-color: #d4af37;
                box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
            }
            
            .ds-card-inner {
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .ds-card-cost {
                position: absolute;
                top: -8px;
                left: -8px;
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: #1a1a1a;
            }
            
            .ds-card-icon {
                font-size: 2.5rem;
                margin: 15px 0 10px;
            }
            
            .ds-card-icon img {
                width: 50px;
                height: 50px;
            }
            
            .ds-card-name {
                font-size: 0.9rem;
                font-weight: bold;
                color: #f5e6c4;
                margin-bottom: 5px;
            }
            
            .ds-card-type {
                font-size: 0.7rem;
                padding: 2px 8px;
                border-radius: 10px;
                margin-bottom: 8px;
            }
            
            .ds-card-type.attack {
                background: rgba(239, 68, 68, 0.3);
                color: #f87171;
            }
            
            .ds-card-type.skill {
                background: rgba(59, 130, 246, 0.3);
                color: #60a5fa;
            }
            
            .ds-card-desc {
                font-size: 0.7rem;
                color: #8a7a5a;
                text-align: center;
                line-height: 1.3;
            }
            
            /* 유물 보상 */
            .ds-relic-reward {
                margin-bottom: 30px;
            }
            
            .ds-relic-display {
                text-align: center;
            }
            
            .ds-relic-icon-large {
                font-size: 4rem;
                margin-bottom: 15px;
                filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
            }
            
            .ds-relic-icon-large img {
                width: 80px;
                height: 80px;
            }
            
            .ds-relic-name {
                font-family: 'Cinzel', serif;
                font-size: 1.4rem;
                color: #f5e6c4;
                margin-bottom: 10px;
            }
            
            .ds-relic-desc {
                font-size: 0.9rem;
                color: #8a7a5a;
                max-width: 300px;
                margin: 0 auto;
            }
            
            /* 골드 보상 */
            .ds-gold-reward {
                margin-bottom: 30px;
            }
            
            .ds-gold-pile {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }
            
            .ds-gold-icon {
                font-size: 4rem;
                animation: goldShine 1s ease-in-out infinite;
            }
            
            @keyframes goldShine {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.3); }
            }
            
            .ds-gold-amount {
                font-family: 'Cinzel', serif;
                font-size: 3rem;
                color: #d4af37;
                text-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
            }
            
            /* 미믹 */
            .ds-chest.mimic-transform {
                animation: mimicShake 0.5s ease-in-out;
            }
            
            @keyframes mimicShake {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-5deg); }
                75% { transform: rotate(5deg); }
            }
            
            .ds-mimic-warning {
                margin-bottom: 30px;
            }
            
            .ds-mimic-img {
                width: 180px;
                height: 180px;
                object-fit: contain;
                image-rendering: pixelated;
                animation: mimicAppear 0.5s ease-out, mimicPulse 1s ease-in-out infinite;
                filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.6)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.3));
            }
            
            @keyframes mimicAppear {
                0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
                50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            
            .ds-mimic-icon-fallback {
                font-size: 5rem;
                animation: mimicPulse 1s ease-in-out infinite;
            }
            
            @keyframes mimicPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .ds-mimic-title {
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                color: #ef4444;
                margin: 15px 0;
                text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
            }
            
            .ds-mimic-desc {
                font-size: 1rem;
                color: #f87171;
            }
            
            /* 버튼들 */
            .ds-confirm-btn, .ds-battle-btn, .ds-skip-btn {
                padding: 15px 40px;
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                letter-spacing: 3px;
                border: 1px solid;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }
            
            .ds-confirm-btn {
                background: transparent;
                border-color: rgba(212, 175, 55, 0.5);
                color: #c8b896;
            }
            
            .ds-confirm-btn:hover {
                background: rgba(212, 175, 55, 0.1);
                border-color: #d4af37;
                color: #f5e6c4;
                box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
            }
            
            .ds-battle-btn {
                background: rgba(239, 68, 68, 0.2);
                border-color: #ef4444;
                color: #f87171;
            }
            
            .ds-battle-btn:hover {
                background: rgba(239, 68, 68, 0.3);
                box-shadow: 0 0 30px rgba(239, 68, 68, 0.3);
            }
            
            .ds-skip-btn {
                background: transparent;
                border-color: rgba(100, 80, 60, 0.5);
                color: #6a6050;
                font-size: 0.9rem;
                padding: 10px 25px;
            }
            
            .ds-skip-btn:hover {
                border-color: #8a7a5a;
                color: #a09080;
            }
            
            /* 힌트 */
            .ds-treasure-hint {
                position: absolute;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.85rem;
                color: #5a5040;
                letter-spacing: 2px;
                transition: opacity 0.3s ease;
            }
            
            .ds-treasure-hint.hidden {
                opacity: 0;
            }
            
            /* 닫기 버튼 */
            .ds-treasure .ds-close {
                position: fixed;
                top: 30px;
                right: 40px;
                width: 50px;
                height: 50px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(180, 160, 120, 0.3);
                color: #6a6050;
                z-index: 102;
                font-size: 2rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .ds-treasure .ds-close:hover {
                border-color: #d4af37;
                color: #c8b896;
            }
            
            .ds-treasure .ds-close.hidden {
                display: none;
            }
            
            /* 보상 메시지 */
            .ds-reward-message {
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #d4af37;
                padding: 15px 30px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #f5e6c4;
                z-index: 20000;
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .ds-reward-message.visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            .msg-icon {
                font-size: 1.5rem;
            }
            
            /* 반응형 */
            @media (max-width: 600px) {
                .ds-card-choices {
                    flex-direction: column;
                    align-items: center;
                }
                
                .ds-card-choice {
                    width: 120px;
                    height: 170px;
                }
                
                .ds-treasure-title h1 {
                    font-size: 1.5rem;
                    letter-spacing: 4px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 접근
window.TreasureSystem = TreasureSystem;

console.log('[Treasure] 보물 상자 시스템 로드 완료');

