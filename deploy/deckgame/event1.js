// ==========================================
// Shadow Deck - 이벤트 1: 운명의 카드 (타로 미니게임)
// 다크소울 스타일 UI
// ==========================================

const TarotEvent = {
    // 상태
    isActive: false,
    selectedCount: 0,
    maxSelections: 3,
    cards: [],
    revealedCards: [],
    currentRoom: null,
    stylesInjected: false,
    isSelecting: false, // 선택 중 플래그 (연출 겹침 방지)
    
    // 초기화 (페이지 로드 시 스타일 미리 주입)
    init() {
        this.injectStyles();
        this.stylesInjected = true;
        console.log('[TarotEvent] 스타일 미리 주입 완료');
    },
    
    // 타로카드 정의
    tarotCards: {
        // 축복의 카드 (6종)
        star: {
            id: 'star',
            name: '희망의 별',
            nameEn: 'The Star',
            numeral: 'XVII',
            type: 'blessing',
            description: 'HP 30% 회복',
            effect: (ctx) => {
                const heal = Math.floor(gameState.player.maxHp * 0.3);
                gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + heal);
                return `HP +${heal}`;
            }
        },
        magician: {
            id: 'magician',
            name: '마술사',
            nameEn: 'The Magician',
            numeral: 'I',
            type: 'blessing',
            description: '랜덤 카드 1장 강화',
            effect: (ctx) => {
                if (gameState.deck && gameState.deck.length > 0) {
                    const idx = Math.floor(Math.random() * gameState.deck.length);
                    const card = gameState.deck[idx];
                    if (card && !card.upgraded) {
                        card.upgraded = true;
                        const oldName = card.name;
                        card.name = card.name + '+';
                        
                        // 강화 연출
                        if (typeof CardAnimation !== 'undefined') {
                            const cardType = card.type === 'attack' || card.type?.id === 'attack' ? 'attack' : 'skill';
                            CardAnimation.cardUpgrade({
                                cost: card.cost,
                                cardType: cardType,
                                icon: card.icon || '⚔️',
                                name: card.name,
                                description: card.description || ''
                            });
                        }
                        
                        if (typeof IncantationSystem !== 'undefined' && IncantationSystem.isActive) {
                            IncantationSystem.addStacks(5);
                            return `${card.name} 강화 + 영창 +5`;
                        }
                        return `${card.name} 강화`;
                    }
                }
                return '강화 실패';
            }
        },
        emperor: {
            id: 'emperor',
            name: '황제',
            nameEn: 'The Emperor',
            numeral: 'IV',
            type: 'blessing',
            description: '영구 힘 +1',
            effect: (ctx) => {
                if (!gameState.player.permanentStrength) {
                    gameState.player.permanentStrength = 0;
                }
                gameState.player.permanentStrength += 1;
                return '영구 힘 +1';
            }
        },
        empress: {
            id: 'empress',
            name: '여제',
            nameEn: 'The Empress',
            numeral: 'III',
            type: 'blessing',
            description: '최대 HP +5',
            effect: (ctx) => {
                gameState.player.maxHp += 5;
                gameState.player.hp += 5;
                return '최대 HP +5';
            }
        },
        wheel: {
            id: 'wheel',
            name: '운명의 수레바퀴',
            nameEn: 'Wheel of Fortune',
            numeral: 'X',
            type: 'blessing',
            description: '30~80 골드 획득',
            effect: (ctx) => {
                const gold = 30 + Math.floor(Math.random() * 51);
                if (typeof GoldSystem !== 'undefined') {
                    GoldSystem.addGold(gold, '타로카드');
                } else {
                    gameState.gold = (gameState.gold || 0) + gold;
                }
                return `+${gold} 골드`;
            }
        },
        chariot: {
            id: 'chariot',
            name: '전차',
            nameEn: 'The Chariot',
            numeral: 'VII',
            type: 'blessing',
            description: '다음 전투 에너지 +2',
            effect: (ctx) => {
                if (!gameState.nextBattleBuffs) {
                    gameState.nextBattleBuffs = {};
                }
                gameState.nextBattleBuffs.bonusEnergy = (gameState.nextBattleBuffs.bonusEnergy || 0) + 2;
                return '다음 전투 에너지 +2';
            }
        },
        highPriestess: {
            id: 'highPriestess',
            name: '여사제',
            nameEn: 'The High Priestess',
            numeral: 'II',
            type: 'blessing',
            description: '다음 전투 첫 턴 카드 +2 드로우',
            effect: (ctx) => {
                if (!gameState.nextBattleBuffs) {
                    gameState.nextBattleBuffs = {};
                }
                gameState.nextBattleBuffs.bonusDraw = (gameState.nextBattleBuffs.bonusDraw || 0) + 2;
                return '다음 전투 첫 턴 드로우 +2';
            }
        },
        hermit: {
            id: 'hermit',
            name: '은둔자',
            nameEn: 'The Hermit',
            numeral: 'IX',
            type: 'blessing',
            description: '희귀 카드 1장 획득',
            effect: (ctx) => {
                // 희귀 카드 풀에서 랜덤 선택
                const rareCards = [];
                if (typeof cardDatabase !== 'undefined') {
                    Object.values(cardDatabase).forEach(card => {
                        if (card.rarity === 'rare' || card.rarity?.id === 'rare') {
                            rareCards.push(card);
                        }
                    });
                }
                
                if (rareCards.length > 0) {
                    const randomCard = rareCards[Math.floor(Math.random() * rareCards.length)];
                    const newCard = { ...randomCard };
                    if (gameState.deck) {
                        gameState.deck.push(newCard);
                    }
                    
                    // 카드 획득 연출
                    if (typeof CardAnimation !== 'undefined') {
                        CardAnimation.cardToDeck({
                            cost: newCard.cost || 1,
                            cardType: newCard.type === 'attack' || newCard.type?.id === 'attack' ? 'attack' : 'skill',
                            icon: newCard.icon || '⚔️',
                            name: newCard.name,
                            description: newCard.description || ''
                        });
                    }
                    
                    return `희귀 카드 "${newCard.name}" 획득`;
                }
                return '희귀 카드를 찾지 못함';
            }
        },
        world: {
            id: 'world',
            name: '세계',
            nameEn: 'The World',
            numeral: 'XXI',
            type: 'blessing',
            description: '랜덤 유물 1개 획득',
            effect: (ctx) => {
                // 유물 시스템에서 랜덤 유물 획득
                if (typeof RelicSystem !== 'undefined' && typeof relicDatabase !== 'undefined') {
                    // 소유하지 않은 유물 필터링
                    const ownedIds = RelicSystem.ownedRelics.map(r => r.id);
                    const availableRelics = Object.values(relicDatabase).filter(r => !ownedIds.includes(r.id));
                    
                    if (availableRelics.length > 0) {
                        const randomRelic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                        RelicSystem.addRelic(randomRelic.id);
                        
                        // 유물 획득 연출
                        if (typeof TopBar !== 'undefined') {
                            TopBar.updateRelics();
                        }
                        
                        return `유물 "${randomRelic.name}" 획득!`;
                    }
                }
                
                // 유물 대신 골드 보상
                const bonusGold = 50;
                if (typeof GoldSystem !== 'undefined') {
                    GoldSystem.addGold(bonusGold, '세계 카드');
                } else {
                    gameState.gold = (gameState.gold || 0) + bonusGold;
                }
                return `모든 유물 보유 중... +${bonusGold} 골드`;
            }
        },
        
        // 저주의 카드 (4종)
        death: {
            id: 'death',
            name: '죽음',
            nameEn: 'Death',
            numeral: 'XIII',
            type: 'curse',
            description: '현재 HP 20% 손실 (5% 확률로 사신 출현)',
            effect: (ctx) => {
                const damage = Math.floor(gameState.player.hp * 0.2);
                gameState.player.hp = Math.max(1, gameState.player.hp - damage);
                
                // 5% 확률로 사신 전투 발생
                if (Math.random() < 0.05) {
                    TarotEvent.triggerDeathBattle = true;
                    return `HP -${damage}... 사신이 다가온다`;
                }
                
                return `HP -${damage}`;
            }
        },
        tower: {
            id: 'tower',
            name: '탑',
            nameEn: 'The Tower',
            numeral: 'XVI',
            type: 'curse',
            description: '랜덤 카드 1장 소멸',
            effect: (ctx) => {
                if (typeof JobSystem !== 'undefined' && JobSystem.currentJob === 'knight') {
                    return '기사: 저항 성공';
                }
                if (gameState.deck && gameState.deck.length > 0) {
                    const idx = Math.floor(Math.random() * gameState.deck.length);
                    const removed = gameState.deck.splice(idx, 1)[0];
                    
                    // 소멸 연출
                    if (removed && typeof CardAnimation !== 'undefined') {
                        const cardType = removed.type === 'attack' || removed.type?.id === 'attack' ? 'attack' : 'skill';
                        CardAnimation.cardExhaust({
                            cost: removed.cost || 0,
                            cardType: cardType,
                            icon: removed.icon || '⚔️',
                            name: removed.name || '카드',
                            description: removed.description || ''
                        });
                    }
                    
                    return `${removed?.name || '카드'} 소멸`;
                }
                return '소멸할 카드 없음';
            }
        },
        devil: {
            id: 'devil',
            name: '악마',
            nameEn: 'The Devil',
            numeral: 'XV',
            type: 'curse',
            description: '저주 카드 "속박" 획득',
            effect: (ctx) => {
                const curseCard = {
                    id: 'curse_binding',
                    name: '속박',
                    type: 'curse',
                    cost: -1,
                    icon: '⛓',
                    description: '사용 불가. 매 턴 1 피해.',
                    playable: false,
                    unplayable: true
                };
                if (gameState.deck) {
                    gameState.deck.push(curseCard);
                }
                
                // 저주 획득 연출
                if (typeof CardAnimation !== 'undefined') {
                    CardAnimation.curseCardToDeck({
                        cost: -1,
                        icon: '⛓',
                        name: '속박',
                        description: '사용 불가. 매 턴 1 피해.'
                    });
                }
                
                return '저주 "속박" 획득';
            }
        },
        moon: {
            id: 'moon',
            name: '달',
            nameEn: 'The Moon',
            numeral: 'XVIII',
            type: 'curse',
            description: '다음 전투 드로우 -2',
            effect: (ctx) => {
                if (!gameState.nextBattleDebuffs) {
                    gameState.nextBattleDebuffs = {};
                }
                gameState.nextBattleDebuffs.drawPenalty = (gameState.nextBattleDebuffs.drawPenalty || 0) + 2;
                return '다음 전투 드로우 -2';
            }
        }
    },
    
    // 점성술사 대사 (다크소울 스타일 - 의미심장하고 철학적)
    dialogues: {
        intro: [
            "...오래 기다렸다. 그대의 별이 이곳으로 이끌었으니.",
            "운명이란... 피하려 할수록 가까워지는 것.",
            "세 개의 진실이 그대를 기다린다. 두려워 말거라.",
            "별은 거짓을 말하지 않아... 다만, 우리가 듣고 싶은 것만 들을 뿐.",
            "자, 선택하거라. 운명은 기다려주지 않는다.",
            "모든 여정에는 끝이 있고... 모든 선택에는 대가가 있지."
        ],
        good: [
            "빛이 그대를 선택했군... 이번만은.",
            "축복받은 자여, 하지만 교만하지 마라.",
            "좋은 징조야... 별이 미소 짓고 있어.",
            "그대의 불꽃은 아직 꺼지지 않았구나.",
            "희망이란... 가장 어두운 밤에 가장 밝게 빛나는 법.",
            "운명이 손을 내밀었어. 놓치지 마."
        ],
        bad: [
            "...미안하군. 하지만 이것 또한 길의 일부.",
            "어둠을 마주한 자만이 진정한 빛을 알 수 있다.",
            "고통은 스승이 되기도 하지... 잊지 마라.",
            "별조차 때로는 추락하는 법이야.",
            "슬퍼하지 마. 끝은 새로운 시작의 씨앗이니까.",
            "시련이 없는 영웅은 없다... 이겨내거라."
        ],
        allGood: "세 번의 축복이라... 별들이 그대를 총애하는군. 흔치 않은 일이야. 부디, 이 은총을 헛되이 하지 마라.",
        allBad: "세 번의 시련... 무거운 운명이로군. 하지만 기억해라. 가장 깊은 어둠 속에서 불사조는 태어나는 법. 이것으로 위로를 삼거라.",
        leave: "가거라, 여행자여. 별은 언제나 그대를 비추고 있을 터... 우리는 다시 만나게 될 거야. 운명이 그러하다면.",
        peek: "그림자 속에서 진실을 훔치려 하는군... 좋아, 한 가닥 실마리를 보여주지.",
        ending: [
            "운명은 정해졌다... 하지만 길은 그대가 만드는 것.",
            "별이 그대의 여정을 지켜보리라...",
            "다음에 만날 때, 그대는 달라져 있겠지.",
            "이제 가거라. 그대의 별이 부르고 있다."
        ]
    },
    
    // ==========================================
    // 이벤트 시작
    // ==========================================
    open(room) {
        if (this.isActive) return;
        
        // 스타일이 없으면 먼저 주입
        if (!this.stylesInjected) {
            this.injectStyles();
            this.stylesInjected = true;
        }
        
        this.isActive = true;
        this.currentRoom = room;
        this.selectedCount = 0;
        this.revealedCards = [];
        
        // 즉시 화면 가리기 (배틀 화면 안 보이게)
        this.showTransitionOverlay();
        
        // 맵 UI 숨기기
        if (typeof MapSystem !== 'undefined' && MapSystem.hideMap) {
            MapSystem.hideMap();
        }
        
        // 카드 셔플 (좋은 카드 3장 + 나쁜 카드 2장)
        this.shuffleCards();
        
        // 인트로 표시 후 UI 생성
        this.showIntro();
        
        console.log('[TarotEvent] 운명의 카드 이벤트 시작');
    },
    
    // 전환 오버레이 (배틀 화면 가리기)
    showTransitionOverlay() {
        // 전투 화면 및 모든 게임 UI 숨기기
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.visibility = 'hidden';
        }
        
        // Incantation UI 숨기기
        const incantationUI = document.querySelector('.incantation-container');
        if (incantationUI) incantationUI.style.visibility = 'hidden';
        
        // 턴 표시 숨기기
        const turnDisplay = document.querySelector('.turn-display');
        if (turnDisplay) turnDisplay.style.visibility = 'hidden';
        
        // 기타 UI 숨기기
        document.querySelectorAll('.energy-display, .deck-count, .discard-count, .enemy-turn-banner').forEach(el => {
            if (el) el.style.visibility = 'hidden';
        });
        
        // 오버레이 생성 (최상위 레이어)
        const overlay = document.createElement('div');
        overlay.id = 'tarot-transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: #050310;
            z-index: 999999;
            opacity: 1;
        `;
        document.body.appendChild(overlay);
    },
    
    // 인트로 화면
    showIntro() {
        const intro = document.createElement('div');
        intro.id = 'tarot-intro';
        intro.className = 'tarot-intro show'; // 즉시 보이도록 show 클래스 포함
        intro.innerHTML = `
            <div class="tarot-intro-bg"></div>
            <div class="tarot-intro-content">
                <div class="tarot-intro-stars">✦ ✧ ✦</div>
                <div class="tarot-intro-title">점성술사와의 만남</div>
                <div class="tarot-intro-subtitle">THE ASTROLOGER</div>
                <div class="tarot-intro-line"></div>
            </div>
        `;
        
        document.body.appendChild(intro);
        
        // 전환 오버레이 즉시 제거 (인트로가 위에 있으므로)
        const overlay = document.getElementById('tarot-transition-overlay');
        if (overlay) overlay.remove();
        
        // 2.5초 후에 메인 UI 미리 생성 (배경 연속성 유지)
        setTimeout(() => {
            this.createUI();
        }, 2500);
        
        // 3초 후 인트로 fade-out
        setTimeout(() => {
            intro.classList.add('fade-out');
            setTimeout(() => {
                intro.remove();
            }, 800);
        }, 3000);
    },
    
    // 카드 셔플
    shuffleCards() {
        const goodCards = ['star', 'magician', 'emperor', 'empress', 'wheel', 'chariot', 'highPriestess', 'hermit', 'world'];
        const normalBadCards = ['tower', 'devil', 'moon'];  // 일반 저주 카드
        
        // 좋은 카드 3장 랜덤 선택
        const selectedGood = this.shuffleArray([...goodCards]).slice(0, 3);
        
        // 나쁜 카드 2장 랜덤 선택 (일반 저주 카드에서)
        const selectedBad = this.shuffleArray([...normalBadCards]).slice(0, 2);
        
        // 죽음 카드는 15% 확률로만 등장 (일반 저주 카드 1장 대체)
        if (Math.random() < 0.15) {
            selectedBad[Math.floor(Math.random() * selectedBad.length)] = 'death';
            console.log('[Tarot] 죽음 카드 등장!');
        }
        
        // 합쳐서 셔플 (총 5장)
        this.cards = this.shuffleArray([...selectedGood, ...selectedBad]);
    },
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    
    // ==========================================
    // UI 생성 (다크소울 스타일)
    // ==========================================
    createUI() {
        // 기존 UI 제거
        const existing = document.getElementById('tarot-event');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'tarot-event';
        container.className = 'tarot-event';
        
        // 도적 직업이면 엿보기 가능
        const isRogue = typeof JobSystem !== 'undefined' && JobSystem.currentJob === 'rogue';
        const peekButton = isRogue ? `
            <button class="tarot-peek-btn" id="tarot-peek" onclick="TarotEvent.peekCard()">
                그림자 응시 (도적)
            </button>
        ` : '';
        
        container.innerHTML = `
            <div class="tarot-backdrop">
                <div class="tarot-stars"></div>
                <div class="tarot-constellation"></div>
            </div>
            <div class="tarot-container">
                <!-- 왼쪽: 포트레이트 -->
                <div class="tarot-left-panel">
                    <div class="tarot-portrait-wrapper">
                        <div class="tarot-portrait-aura"></div>
                        <img src="magic_girl_potrait.png" class="tarot-portrait-img" alt="점성술사">
                    </div>
                    <div class="tarot-npc-name">점 성 술 사</div>
                </div>
                
                <!-- 오른쪽: 대사 + 카드 -->
                <div class="tarot-right-panel">
                    <!-- 대사 -->
                    <div class="tarot-speech">
                        <div class="tarot-dialogue" id="tarot-dialogue">
                            "${this.getRandomDialogue('intro')}"
                        </div>
                    </div>
                    
                    <!-- 결과 영역 -->
                    <div class="tarot-results hidden" id="tarot-results"></div>
                    
                    <!-- 카드 영역 -->
                    <div class="tarot-card-area">
                        <div class="tarot-cards" id="tarot-cards">
                            ${this.cards.map((cardId, index) => this.renderCard(cardId, index)).join('')}
                        </div>
                        
                        <!-- 선택 오브 -->
                        <div class="tarot-selections">
                            <div class="tarot-sel-orbs">
                                ${[...Array(this.maxSelections)].map((_, i) => 
                                    `<span class="tarot-orb ${i < (this.maxSelections - this.selectedCount) ? 'active' : ''}"></span>`
                                ).join('')}
                            </div>
                            <span class="tarot-sel-label">운명의 선택</span>
                        </div>
                    </div>
                    
                    <!-- 하단 버튼 -->
                    <div class="tarot-footer">
                        ${peekButton}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        this.injectStyles();
        
        // 카드 클릭 이벤트
        this.bindCardEvents();
        
        // 등장 애니메이션
        requestAnimationFrame(() => container.classList.add('show'));
    },
    
    renderCard(cardId, index) {
        const card = this.tarotCards[cardId];
        const isBlessing = card.type === 'blessing';
        return `
            <div class="tarot-card" data-index="${index}" data-card-id="${cardId}">
                <div class="tarot-card-inner">
                    <div class="tarot-card-front">
                        <div class="tarot-card-back-design">
                            <div class="tarot-back-border"></div>
                            <div class="tarot-back-symbol">⟡</div>
                            <div class="tarot-back-corner tl">✧</div>
                            <div class="tarot-back-corner tr">✧</div>
                            <div class="tarot-back-corner bl">✧</div>
                            <div class="tarot-back-corner br">✧</div>
                        </div>
                    </div>
                    <div class="tarot-card-back ${card.type}">
                        <div class="tarot-card-numeral">${card.numeral}</div>
                        <div class="tarot-card-name">${card.name}</div>
                        <div class="tarot-card-eng">${card.nameEn}</div>
                        <div class="tarot-card-divider"></div>
                        <div class="tarot-card-desc">${card.description}</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    bindCardEvents() {
        const cards = document.querySelectorAll('.tarot-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.selectCard(index);
            });
        });
    },
    
    // ==========================================
    // 카드 선택
    // ==========================================
    selectCard(index) {
        // 선택 중이면 무시 (연출 겹침 방지)
        if (this.isSelecting) return;
        if (this.selectedCount >= this.maxSelections) return;
        
        const cardEl = document.querySelector(`.tarot-card[data-index="${index}"]`);
        if (!cardEl || cardEl.classList.contains('revealed')) return;
        
        // 선택 잠금 (2초간)
        this.isSelecting = true;
        setTimeout(() => {
            this.isSelecting = false;
        }, 2000);
        
        const cardId = cardEl.dataset.cardId;
        const card = this.tarotCards[cardId];
        
        // ☠️ 죽음 카드면 즉시 사신 연출 시작!
        if (cardId === 'death') {
            console.log('[Death] 죽음 카드 선택됨!');
            
            // 카드 뒤집기
            cardEl.classList.add('revealed');
            
            // 효과 발동 (HP 감소)
            card.effect();
            
            // 점성술사 대사
            this.updateDialogue("...안 돼..!");
            
            // 1초 후 연출 시작
            setTimeout(() => {
                console.log('[Death] 연출 시작!');
                this.showDeathCardScene();
            }, 1000);
            return;
        }
        
        // 카드 뒤집기
        cardEl.classList.add('revealed');
        this.selectedCount++;
        this.revealedCards.push(card);
        
        // 선택 오브 업데이트
        this.updateSelectionOrbs();
        
        // 파티클 효과
        this.spawnParticles(cardEl, card.type);
        
        // VFX 효과 (축복/저주에 따라 다름)
        this.playEffectVFX(card.type, cardEl);
        
        // 0.5초 후 대사 → 효과 순서로 표시
        setTimeout(() => {
            // 1. 먼저 대사 변경
            const dialogueType = card.type === 'blessing' ? 'good' : 'bad';
            this.updateDialogue(this.getRandomDialogue(dialogueType));
            
            // 2. 0.8초 후 효과 발동 및 결과 표시
            setTimeout(() => {
                const result = card.effect();
                this.showResult(card, result);
                
                // UI 업데이트 (HP 등 반영)
                if (typeof TopBar !== 'undefined') {
                    TopBar.update();
                }
                if (typeof updateUI === 'function') {
                    try { updateUI(); } catch(e) {}
                }
                
                // 모든 선택 완료 체크
                if (this.selectedCount >= this.maxSelections) {
                    this.checkFinalResult();
                }
            }, 800);
        }, 500);
    },
    
    // ==========================================
    // 죽음 카드 연출 화면 (간소화)
    // ==========================================
    showDeathCardScene() {
        console.log('[Death] showDeathCardScene 시작');
        
        // 타로 이벤트 UI 페이드아웃
        const tarotEvent = document.getElementById('tarot-event');
        if (tarotEvent) {
            tarotEvent.style.transition = 'opacity 0.5s';
            tarotEvent.style.opacity = '0';
        }
        
        // 화면 어두워지고 속삭임만 표시
        const scene = document.createElement('div');
        scene.id = 'death-card-scene';
        scene.innerHTML = `
            <div class="dcs-bg"></div>
            <div class="dcs-whisper">...너를 찾았다...</div>
        `;
        
        // 스타일
        const style = document.createElement('style');
        style.id = 'dcs-style';
        style.textContent = `
            #death-card-scene {
                position: fixed;
                inset: 0;
                z-index: 99999999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .dcs-bg {
                position: absolute;
                inset: 0;
                background: #000;
                opacity: 0;
                animation: dcsBgFade 0.5s ease forwards;
            }
            @keyframes dcsBgFade {
                to { opacity: 0.98; }
            }
            .dcs-whisper {
                position: relative;
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                color: #8b0000;
                text-shadow: 0 0 40px #8b0000, 0 0 80px #4b0082;
                letter-spacing: 10px;
                opacity: 0;
                transform: scale(0.5);
                animation: dcsWhisperShow 2s ease 0.3s forwards;
            }
            @keyframes dcsWhisperShow {
                0% { opacity: 0; transform: scale(0.5); }
                30% { opacity: 1; transform: scale(1.2); }
                70% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(1.3); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(scene);
        
        // 화면 흔들림
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(12, 500);
        }
        
        // 2.5초 후 사신 전투 시작
        setTimeout(() => {
            console.log('[Death] 사신 전투 시작');
            
            // 연출 제거
            scene.remove();
            const styleEl = document.getElementById('dcs-style');
            if (styleEl) styleEl.remove();
            
            // 타로 이벤트 UI 완전 제거
            if (tarotEvent) tarotEvent.remove();
            
            // 상태 초기화
            this.isActive = false;
            this.cards = [];
            this.revealedCards = [];
            this.selectedCount = 0;
            this.currentRoom = null;
            this.triggerDeathBattle = false;
            
            // 사신 전투!
            this.startDeathBattle();
        }, 2500);
    },
    
    // ==========================================
    // 즉시 사신 등장 (레거시)
    // ==========================================
    triggerImmediateDeathSequence(cardEl) {
        console.log('[TarotEvent] 죽음 카드 연출 시작!');
        
        // 점성술사 공포 대사
        this.updateDialogue("...안 돼..!");
        
        // 전체 화면 덮는 연출 컨테이너
        const deathScene = document.createElement('div');
        deathScene.id = 'death-scene';
        deathScene.innerHTML = `
            <style>
                #death-scene {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0);
                    transition: background 0.5s ease;
                }
                #death-scene.active {
                    background: rgba(0,0,0,0.95);
                }
                #death-scene .death-card {
                    width: 250px;
                    height: 380px;
                    background: linear-gradient(180deg, #1a0a0a 0%, #0a0505 100%);
                    border: 4px solid #8b0000;
                    border-radius: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 50px rgba(139, 0, 0, 0.8), 0 0 100px rgba(75, 0, 130, 0.5);
                    transform: scale(0);
                    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                    animation: cardPulse 0.5s ease-in-out infinite;
                }
                #death-scene.active .death-card {
                    transform: scale(1);
                }
                #death-scene.shatter .death-card {
                    transform: scale(0);
                    opacity: 0;
                    filter: blur(20px);
                    transition: all 0.5s ease;
                }
                @keyframes cardPulse {
                    0%, 100% { box-shadow: 0 0 50px rgba(139, 0, 0, 0.8), 0 0 100px rgba(75, 0, 130, 0.5); }
                    50% { box-shadow: 0 0 80px rgba(139, 0, 0, 1), 0 0 150px rgba(75, 0, 130, 0.8); }
                }
                #death-scene .numeral {
                    font-family: 'Cinzel', serif;
                    font-size: 4rem;
                    font-weight: 900;
                    color: #8b0000;
                    text-shadow: 0 0 30px #8b0000;
                }
                #death-scene .name {
                    font-family: 'Noto Sans KR', sans-serif;
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: #fef3c7;
                    text-shadow: 0 0 20px rgba(254, 243, 199, 0.8);
                    letter-spacing: 15px;
                    margin: 10px 0;
                }
                #death-scene .eng {
                    font-family: 'Cinzel', serif;
                    font-size: 1rem;
                    color: #6b7280;
                    letter-spacing: 10px;
                }
                #death-scene .skull {
                    font-size: 4rem;
                    margin-top: 20px;
                    animation: skullBob 1s ease-in-out infinite;
                }
                @keyframes skullBob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                #death-scene .whisper {
                    position: absolute;
                    font-family: 'Cinzel', serif;
                    font-size: 2rem;
                    color: #8b0000;
                    text-shadow: 0 0 30px #8b0000;
                    opacity: 0;
                    letter-spacing: 8px;
                }
                #death-scene.shatter .whisper {
                    animation: whisperShow 1.5s ease forwards;
                }
                @keyframes whisperShow {
                    0% { opacity: 0; transform: scale(0.5); }
                    30% { opacity: 1; transform: scale(1.2); }
                    70% { opacity: 1; }
                    100% { opacity: 0; transform: scale(1.5); }
                }
            </style>
            <div class="death-card">
                <div class="numeral">XIII</div>
                <div class="name">죽음</div>
                <div class="eng">DEATH</div>
                <div class="skull">💀</div>
            </div>
            <div class="whisper">...너를 찾았다...</div>
        `;
        document.body.appendChild(deathScene);
        
        // 화면 흔들림
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(10, 300);
        }
        
        // 애니메이션 시작
        setTimeout(() => deathScene.classList.add('active'), 50);
        
        // 1.5초 후 카드 깨지고 속삭임
        setTimeout(() => {
            deathScene.classList.add('shatter');
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(20, 500);
            }
        }, 1500);
        
        // 3초 후 전투 시작
        setTimeout(() => {
            deathScene.remove();
            
            // 이벤트 UI 제거
            const container = document.getElementById('tarot-event-container');
            if (container) container.remove();
            
            // 상태 초기화
            this.isActive = false;
            this.cards = [];
            this.revealedCards = [];
            this.selectedCount = 0;
            this.currentRoom = null;
            this.triggerDeathBattle = false;
            
            console.log('[TarotEvent] 사신 전투 시작!');
            // 사신 전투 시작
            this.startDeathBattle();
        }, 3000);
    },
    
    // 죽음 카드 연출 스타일 주입
    injectDeathSequenceStyles() {
        if (document.getElementById('death-sequence-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'death-sequence-styles';
        style.textContent = `
            .death-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0);
                z-index: 10000;
                transition: background 0.5s ease;
            }
            .death-overlay.active {
                background: rgba(0, 0, 0, 0.95);
            }
            
            .death-card-zoom {
                transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
                transform-origin: center center;
            }
            .death-card-zoom.zooming {
                left: 50% !important;
                top: 50% !important;
                width: 300px !important;
                height: 450px !important;
                transform: translate(-50%, -50%);
            }
            
            .death-card-inner {
                width: 100%;
                height: 100%;
                background: linear-gradient(180deg, #1a0a0a 0%, #0a0505 100%);
                border: 3px solid #8b0000;
                border-radius: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-shadow: 
                    0 0 50px rgba(139, 0, 0, 0.8),
                    0 0 100px rgba(75, 0, 130, 0.5),
                    inset 0 0 50px rgba(139, 0, 0, 0.3);
                animation: deathCardPulse 0.5s ease-in-out infinite;
            }
            
            @keyframes deathCardPulse {
                0%, 100% { box-shadow: 0 0 50px rgba(139, 0, 0, 0.8), 0 0 100px rgba(75, 0, 130, 0.5); }
                50% { box-shadow: 0 0 80px rgba(139, 0, 0, 1), 0 0 150px rgba(75, 0, 130, 0.8); }
            }
            
            .death-card-numeral {
                font-family: 'Cinzel', serif;
                font-size: 4rem;
                font-weight: 900;
                color: #8b0000;
                text-shadow: 0 0 30px #8b0000;
                margin-bottom: 10px;
            }
            
            .death-card-name {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 2.5rem;
                font-weight: 900;
                color: #fef3c7;
                text-shadow: 0 0 20px rgba(254, 243, 199, 0.8);
                letter-spacing: 15px;
            }
            
            .death-card-eng {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #6b7280;
                letter-spacing: 10px;
                margin-top: 5px;
            }
            
            .death-card-skull {
                font-size: 5rem;
                margin-top: 20px;
                animation: skullFloat 1s ease-in-out infinite;
            }
            
            @keyframes skullFloat {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-10px) scale(1.1); }
            }
            
            .death-card-zoom.shatter {
                animation: cardShatter 0.5s ease-out forwards;
            }
            
            @keyframes cardShatter {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0); opacity: 0; filter: blur(20px); }
            }
            
            .death-whisper {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                color: #8b0000;
                text-shadow: 0 0 30px #8b0000, 0 0 60px #4b0082;
                z-index: 10002;
                animation: whisperReveal 1.5s ease-out forwards;
                letter-spacing: 10px;
            }
            
            @keyframes whisperReveal {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); letter-spacing: 30px; }
                30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                70% { opacity: 1; transform: translate(-50%, -50%) scale(1); letter-spacing: 10px; }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); letter-spacing: 5px; }
            }
        `;
        document.head.appendChild(style);
    },
    
    // ==========================================
    // 사신 등장 시퀀스 (레거시)
    // ==========================================
    triggerDeathSequence() {
        // 점성술사 대사 변경
        this.updateDialogue("...운이 좋지 않군요. 죽음이 당신을 원합니다.");
        
        // 1.5초 후 점성술사 퇴장 및 사신 연출
        setTimeout(() => {
            this.updateDialogue("도망치세요... 아니, 이미 늦었군요.");
            
            // 화면 어두워지기
            const overlay = document.createElement('div');
            overlay.className = 'death-sequence-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0);
                z-index: 9998;
                transition: background 1s ease;
                pointer-events: none;
            `;
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                overlay.style.background = 'rgba(0, 0, 0, 0.9)';
            }, 100);
            
            // 2초 후 이벤트 UI 제거 및 사신 전투 시작
            setTimeout(() => {
                // 이벤트 UI 제거
                const container = document.getElementById('tarot-event-container');
                if (container) {
                    container.style.opacity = '0';
                    container.style.transition = 'opacity 0.5s';
                    setTimeout(() => container.remove(), 500);
                }
                
                // 오버레이 제거
                overlay.remove();
                
                // 상태 초기화
                this.isActive = false;
                this.cards = [];
                this.revealedCards = [];
                this.selectedCount = 0;
                this.currentRoom = null;
                this.triggerDeathBattle = false;
                
                // 사신 전투 시작
                this.startDeathBattle();
            }, 2000);
        }, 1500);
    },
    
    // VFX 효과 재생
    playEffectVFX(type, cardEl) {
        const rect = cardEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (type === 'blessing') {
            // 축복 VFX: 황금빛 상승 광선 + 별빛
            this.createBlessingVFX(centerX, centerY);
            this.shakeNPC('blessing');
        } else {
            // 저주 VFX: 어두운 균열 + 그림자
            this.createCurseVFX(centerX, centerY);
            this.shakeNPC('curse');
        }
        
        // 화면 플래시
        this.screenFlash(type);
    },
    
    createBlessingVFX(x, y) {
        // 상승하는 빛줄기
        for (let i = 0; i < 8; i++) {
            const beam = document.createElement('div');
            beam.className = 'tarot-vfx-beam blessing';
            beam.style.left = x + 'px';
            beam.style.top = y + 'px';
            beam.style.setProperty('--angle', (i * 45) + 'deg');
            beam.style.setProperty('--delay', (i * 0.05) + 's');
            document.body.appendChild(beam);
            setTimeout(() => beam.remove(), 1000);
        }
        
        // 별빛 파티클
        for (let i = 0; i < 15; i++) {
            const star = document.createElement('div');
            star.className = 'tarot-vfx-star';
            star.innerHTML = '✦';
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.setProperty('--tx', (Math.random() - 0.5) * 300 + 'px');
            star.style.setProperty('--ty', -100 - Math.random() * 150 + 'px');
            star.style.setProperty('--delay', (Math.random() * 0.3) + 's');
            star.style.setProperty('--size', (0.8 + Math.random() * 0.8) + 'rem');
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 1500);
        }
        
        // 원형 확산 링
        const ring = document.createElement('div');
        ring.className = 'tarot-vfx-ring blessing';
        ring.style.left = x + 'px';
        ring.style.top = y + 'px';
        document.body.appendChild(ring);
        setTimeout(() => ring.remove(), 800);
    },
    
    createCurseVFX(x, y) {
        // 균열 효과
        for (let i = 0; i < 6; i++) {
            const crack = document.createElement('div');
            crack.className = 'tarot-vfx-crack';
            crack.style.left = x + 'px';
            crack.style.top = y + 'px';
            crack.style.setProperty('--angle', (i * 60 + Math.random() * 20) + 'deg');
            crack.style.setProperty('--length', (50 + Math.random() * 80) + 'px');
            document.body.appendChild(crack);
            setTimeout(() => crack.remove(), 800);
        }
        
        // 떨어지는 그림자 파티클
        for (let i = 0; i < 12; i++) {
            const shadow = document.createElement('div');
            shadow.className = 'tarot-vfx-shadow';
            shadow.style.left = x + (Math.random() - 0.5) * 100 + 'px';
            shadow.style.top = y + 'px';
            shadow.style.setProperty('--ty', 100 + Math.random() * 100 + 'px');
            shadow.style.setProperty('--delay', (Math.random() * 0.2) + 's');
            document.body.appendChild(shadow);
            setTimeout(() => shadow.remove(), 1200);
        }
        
        // 어두운 펄스
        const pulse = document.createElement('div');
        pulse.className = 'tarot-vfx-ring curse';
        pulse.style.left = x + 'px';
        pulse.style.top = y + 'px';
        document.body.appendChild(pulse);
        setTimeout(() => pulse.remove(), 800);
    },
    
    shakeNPC(type) {
        const panel = document.querySelector('.tarot-left-panel');
        if (panel) {
            panel.classList.add('shake-' + type);
            setTimeout(() => panel.classList.remove('shake-' + type), 600);
        }
    },
    
    screenFlash(type) {
        const flash = document.createElement('div');
        flash.className = 'tarot-screen-flash ' + type;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 400);
    },
    
    updateSelectionOrbs() {
        const orbs = document.querySelectorAll('.tarot-orb');
        orbs.forEach((orb, i) => {
            if (i >= (this.maxSelections - this.selectedCount)) {
                orb.classList.remove('active');
                orb.classList.add('used');
            }
        });
    },
    
    showResult(card, result) {
        const resultsEl = document.getElementById('tarot-results');
        resultsEl.classList.remove('hidden');
        
        const resultItem = document.createElement('div');
        resultItem.className = `tarot-result-item ${card.type}`;
        resultItem.innerHTML = `
            <span class="result-numeral">${card.numeral}</span>
            <span class="result-name">${card.name}</span>
            <span class="result-arrow">→</span>
            <span class="result-text">${result}</span>
        `;
        resultsEl.appendChild(resultItem);
        
        // 애니메이션
        requestAnimationFrame(() => resultItem.classList.add('show'));
    },
    
    checkFinalResult() {
        const blessingCount = this.revealedCards.filter(c => c.type === 'blessing').length;
        const curseCount = this.revealedCards.filter(c => c.type === 'curse').length;
        
        // 1.5초 후 최종 결과 대사
        setTimeout(() => {
            if (blessingCount === 3) {
                // 3연속 축복 - 보너스!
                this.updateDialogue(this.dialogues.allGood);
                this.playTripleVFX('blessing');
                
                // 1초 후 보너스 지급
                setTimeout(() => {
                    this.giveBonus();
                }, 1000);
            } else if (curseCount === 3) {
                // 3연속 저주 - 위로
                this.updateDialogue(this.dialogues.allBad);
                this.playTripleVFX('curse');
                
                // 1초 후 위로금 지급
                setTimeout(() => {
                    this.giveConsolation();
                }, 1000);
            } else {
                // 일반 종료
                this.updateDialogue(this.dialogues.leave);
            }
            
            // 3초 후 엔딩 연출 시작
            setTimeout(() => {
                this.playEndingSequence();
            }, 2500);
        }, 1500);
    },
    
    // 엔딩 연출
    playEndingSequence() {
        const container = document.getElementById('tarot-event');
        if (!container) return;
        
        // 버튼 숨기기
        const footer = container.querySelector('.tarot-footer');
        if (footer) {
            footer.style.opacity = '0';
            footer.style.pointerEvents = 'none';
        }
        
        // 2초 후 페이드아웃 시작
        setTimeout(() => {
            // 엔딩 대사 선택
            const endingMessage = this.dialogues.ending[Math.floor(Math.random() * this.dialogues.ending.length)];
            
            // 엔딩 오버레이 추가
            const ending = document.createElement('div');
            ending.className = 'tarot-ending';
            ending.innerHTML = `
                <div class="tarot-ending-text">
                    <div class="tarot-ending-stars">✦ ✧ ✦</div>
                    <div class="tarot-ending-message">"${endingMessage}"</div>
                </div>
            `;
            container.appendChild(ending);
            
            // 페이드인
            requestAnimationFrame(() => {
                ending.classList.add('show');
            });
            
            // 1.5초 후 완전 종료
            setTimeout(() => {
                this.close();
            }, 1500);
        }, 1500);
    },
    
    playTripleVFX(type) {
        const container = document.querySelector('.tarot-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (type === 'blessing') {
            // 축복 대폭발
            for (let i = 0; i < 30; i++) {
                const star = document.createElement('div');
                star.className = 'tarot-vfx-star';
                star.innerHTML = ['✦', '★', '✧', '◆'][Math.floor(Math.random() * 4)];
                star.style.left = centerX + 'px';
                star.style.top = centerY + 'px';
                star.style.setProperty('--tx', (Math.random() - 0.5) * 600 + 'px');
                star.style.setProperty('--ty', (Math.random() - 0.5) * 400 + 'px');
                star.style.setProperty('--delay', (Math.random() * 0.5) + 's');
                star.style.setProperty('--size', (1 + Math.random() * 1.5) + 'rem');
                document.body.appendChild(star);
                setTimeout(() => star.remove(), 2000);
            }
            
            // 큰 링 3개
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const ring = document.createElement('div');
                    ring.className = 'tarot-vfx-ring blessing';
                    ring.style.left = centerX + 'px';
                    ring.style.top = centerY + 'px';
                    ring.style.animationDuration = '1.2s';
                    document.body.appendChild(ring);
                    setTimeout(() => ring.remove(), 1200);
                }, i * 200);
            }
        } else {
            // 저주 어둠 확산
            for (let i = 0; i < 20; i++) {
                const shadow = document.createElement('div');
                shadow.className = 'tarot-vfx-shadow';
                shadow.style.left = centerX + (Math.random() - 0.5) * 400 + 'px';
                shadow.style.top = centerY - 100 + 'px';
                shadow.style.setProperty('--ty', 200 + Math.random() * 200 + 'px');
                shadow.style.setProperty('--delay', (Math.random() * 0.8) + 's');
                shadow.style.width = (15 + Math.random() * 15) + 'px';
                shadow.style.height = shadow.style.width;
                document.body.appendChild(shadow);
                setTimeout(() => shadow.remove(), 2000);
            }
            
            // 균열 폭발
            for (let i = 0; i < 12; i++) {
                const crack = document.createElement('div');
                crack.className = 'tarot-vfx-crack';
                crack.style.left = centerX + 'px';
                crack.style.top = centerY + 'px';
                crack.style.setProperty('--angle', (i * 30) + 'deg');
                crack.style.setProperty('--length', (80 + Math.random() * 100) + 'px');
                document.body.appendChild(crack);
                setTimeout(() => crack.remove(), 1000);
            }
        }
        
        // 큰 화면 플래시
        const flash = document.createElement('div');
        flash.className = 'tarot-screen-flash ' + type;
        flash.style.animationDuration = '0.8s';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 800);
    },
    
    giveBonus() {
        // 랜덤 유물 지급
        if (typeof RelicSystem !== 'undefined') {
            const relics = Object.keys(RelicSystem.relics || {});
            if (relics.length > 0) {
                const randomRelic = relics[Math.floor(Math.random() * relics.length)];
                RelicSystem.addRelic(randomRelic);
                this.showResult({ numeral: '★', name: '특별 보상', type: 'blessing' }, '유물 획득!');
            }
        }
    },
    
    giveConsolation() {
        // 위로 골드
        const gold = 50;
        if (typeof GoldSystem !== 'undefined') {
            GoldSystem.addGold(gold, '위로금');
        } else {
            gameState.gold = (gameState.gold || 0) + gold;
        }
        this.showResult({ numeral: '◆', name: '위로의 선물', type: 'blessing' }, `+${gold} 골드`);
    },
    
    // ==========================================
    // 도적 전용: 엿보기
    // ==========================================
    peekCard() {
        const peekBtn = document.getElementById('tarot-peek');
        if (!peekBtn || peekBtn.disabled) return;
        
        // 한 번만 사용 가능
        peekBtn.disabled = true;
        peekBtn.style.opacity = '0.5';
        
        // 안 뒤집은 카드 중 하나 랜덤 엿보기
        const unrevealedCards = document.querySelectorAll('.tarot-card:not(.revealed)');
        if (unrevealedCards.length === 0) return;
        
        const randomCard = unrevealedCards[Math.floor(Math.random() * unrevealedCards.length)];
        const cardId = randomCard.dataset.cardId;
        const card = this.tarotCards[cardId];
        
        // 잠깐 보여주기
        randomCard.classList.add('peeking');
        this.updateDialogue(`${this.dialogues.peek} — ${card.numeral} ${card.name}`);
        
        setTimeout(() => {
            randomCard.classList.remove('peeking');
        }, 2000);
    },
    
    // ==========================================
    // 떠나기
    // ==========================================
    leave() {
        this.updateDialogue(this.dialogues.leave);
        
        setTimeout(() => {
            // 방 클리어 처리
            if (this.currentRoom) {
                this.currentRoom.cleared = true;
            }
            
            this.close();
        }, 500);
    },
    
    close() {
        const container = document.getElementById('tarot-event');
        if (container) {
            container.classList.remove('show');
            setTimeout(() => container.remove(), 300);
        }
        
        // 방 클리어 처리
        if (this.currentRoom) {
            this.currentRoom.cleared = true;
            if (typeof MapSystem !== 'undefined') {
                MapSystem.roomsCleared++;
                MapSystem.updateUI();
                MapSystem.renderMinimap();
            }
        }
        
        // 죽음 카드로 인한 전투 체크
        const shouldBattle = this.triggerDeathBattle;
        
        this.isActive = false;
        this.cards = [];
        this.revealedCards = [];
        this.selectedCount = 0;
        this.currentRoom = null;
        this.triggerDeathBattle = false;
        this.isSelecting = false;
        
        // 사신 전투 발생!
        if (shouldBattle) {
            this.startDeathBattle();
            return;
        }
        
        // 맵으로 돌아가기
        if (typeof MapSystem !== 'undefined') {
            MapSystem.showMap();
        }
    },
    
    // 사신 전투
    startDeathBattle() {
        // 다크소울 스타일 사신 등장 연출
        const warning = document.createElement('div');
        warning.className = 'reaper-intro-overlay';
        warning.innerHTML = `
            <div class="reaper-dim"></div>
            <div class="reaper-vignette"></div>
            <div class="reaper-letterbox top"></div>
            <div class="reaper-letterbox bottom"></div>
            <div class="reaper-fog"></div>
            <div class="reaper-text-container">
                <div class="reaper-subtitle">운명이 당신을 찾았다</div>
                <div class="reaper-line left"></div>
                <div class="reaper-title">사신</div>
                <div class="reaper-line right"></div>
                <div class="reaper-subtitle-bottom">DEATH APPROACHES</div>
            </div>
        `;
        
        // 스타일 주입
        if (!document.getElementById('reaper-intro-styles')) {
            const style = document.createElement('style');
            style.id = 'reaper-intro-styles';
            style.textContent = `
                .reaper-intro-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    pointer-events: none;
                }
                
                .reaper-dim {
                    position: absolute;
                    inset: 0;
                    background: #000;
                    opacity: 0;
                    transition: opacity 1s ease;
                }
                
                .reaper-vignette {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at center, transparent 20%, rgba(30, 0, 0, 0.8) 100%);
                    opacity: 0;
                    transition: opacity 1.5s ease;
                }
                
                .reaper-letterbox {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 0;
                    background: #000;
                    transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .reaper-letterbox.top { top: 0; }
                .reaper-letterbox.bottom { bottom: 0; }
                
                .reaper-fog {
                    position: absolute;
                    inset: 0;
                    background: 
                        radial-gradient(ellipse at 20% 80%, rgba(75, 0, 130, 0.3) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 70%, rgba(139, 0, 0, 0.3) 0%, transparent 50%);
                    opacity: 0;
                    animation: reaperFogMove 4s ease-in-out infinite;
                    transition: opacity 2s ease;
                }
                
                @keyframes reaperFogMove {
                    0%, 100% { transform: translateX(-5%) scale(1.1); }
                    50% { transform: translateX(5%) scale(1); }
                }
                
                .reaper-text-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    opacity: 0;
                    transition: opacity 0.8s ease;
                }
                
                .reaper-subtitle {
                    font-family: 'Noto Sans KR', sans-serif;
                    font-size: 1rem;
                    color: #8b0000;
                    letter-spacing: 8px;
                    margin-bottom: 20px;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.8s ease;
                }
                
                .reaper-title {
                    font-family: 'Cinzel', serif;
                    font-size: 4rem;
                    font-weight: 900;
                    color: #fef3c7;
                    text-shadow: 
                        0 0 30px rgba(139, 0, 0, 0.8),
                        0 0 60px rgba(75, 0, 130, 0.6),
                        0 4px 8px rgba(0, 0, 0, 0.9);
                    letter-spacing: 20px;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .reaper-line {
                    position: absolute;
                    top: 50%;
                    width: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #8b0000, #fbbf24, #8b0000, transparent);
                    transition: width 1s ease;
                }
                .reaper-line.left { right: 100%; margin-right: 30px; }
                .reaper-line.right { left: 100%; margin-left: 30px; }
                
                .reaper-subtitle-bottom {
                    font-family: 'Cinzel', serif;
                    font-size: 0.9rem;
                    color: #6b7280;
                    letter-spacing: 12px;
                    margin-top: 25px;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.8s ease 0.3s;
                }
                
                /* 페이즈 애니메이션 */
                .reaper-intro-overlay.phase-1 .reaper-dim { opacity: 0.95; }
                .reaper-intro-overlay.phase-1 .reaper-letterbox { height: 12%; }
                .reaper-intro-overlay.phase-1 .reaper-vignette { opacity: 1; }
                .reaper-intro-overlay.phase-1 .reaper-fog { opacity: 1; }
                
                .reaper-intro-overlay.phase-2 .reaper-text-container { opacity: 1; }
                .reaper-intro-overlay.phase-2 .reaper-subtitle { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
                .reaper-intro-overlay.phase-2 .reaper-title { 
                    opacity: 1; 
                    transform: scale(1); 
                }
                .reaper-intro-overlay.phase-2 .reaper-line { width: 150px; }
                .reaper-intro-overlay.phase-2 .reaper-subtitle-bottom { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
                
                .reaper-intro-overlay.phase-out .reaper-dim { opacity: 0; transition: opacity 0.8s ease; }
                .reaper-intro-overlay.phase-out .reaper-text-container { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(1.1); 
                }
                .reaper-intro-overlay.phase-out .reaper-letterbox { height: 0; }
                .reaper-intro-overlay.phase-out .reaper-vignette { opacity: 0; }
                .reaper-intro-overlay.phase-out .reaper-fog { opacity: 0; }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(warning);
        
        // 화면 흔들림
        if (typeof EffectSystem !== 'undefined') {
            setTimeout(() => EffectSystem.screenShake(5, 500), 500);
            setTimeout(() => EffectSystem.screenShake(10, 800), 1500);
        }
        
        requestAnimationFrame(() => {
            warning.classList.add('phase-1');
            setTimeout(() => warning.classList.add('phase-2'), 800);
            
            setTimeout(() => {
                warning.classList.add('phase-out');
                setTimeout(() => {
                    warning.remove();
                    
                    // 사신 전투 시작 (이벤트 보스 - 층 이동 없음)
                    if (typeof gameState !== 'undefined') {
                        gameState.currentBattleType = 'event_boss'; // 일반 boss와 구분
                        gameState.isEventBoss = true; // 이벤트 보스 플래그
                        gameState.assignedMonsters = [{
                            name: 'reaper',
                            isBoss: true,
                            isEventBoss: true // 이벤트 보스 표시
                        }];
                    }
                    
                    if (typeof startBattle === 'function') {
                        startBattle();
                    } else if (typeof MapSystem !== 'undefined') {
                        MapSystem.showMap();
                    }
                }, 1000);
            }, 3500);
        });
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    getRandomDialogue(type) {
        const dialogues = this.dialogues[type];
        if (Array.isArray(dialogues)) {
            return dialogues[Math.floor(Math.random() * dialogues.length)];
        }
        return dialogues || '';
    },
    
    updateDialogue(text) {
        const dialogueEl = document.getElementById('tarot-dialogue');
        if (dialogueEl) {
            dialogueEl.style.opacity = '0';
            setTimeout(() => {
                dialogueEl.innerHTML = `"${text}"`;
                dialogueEl.style.opacity = '1';
            }, 200);
        }
    },
    
    spawnParticles(cardEl, type) {
        const rect = cardEl.getBoundingClientRect();
        // 다크소울 스타일: 축복은 금색, 저주는 보라/어두운 색
        const colors = type === 'blessing' 
            ? ['#d4af37', '#b8860b', '#8b7355'] 
            : ['#4a1942', '#2d1b30', '#1a0a15'];
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'tarot-particle';
            particle.style.left = rect.left + rect.width / 2 + 'px';
            particle.style.top = rect.top + rect.height / 2 + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.setProperty('--tx', (Math.random() - 0.5) * 150 + 'px');
            particle.style.setProperty('--ty', (Math.random() - 0.5) * 150 + 'px');
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1200);
        }
    },
    
    // ==========================================
    // 스타일 주입 (다크소울 스타일)
    // ==========================================
    injectStyles() {
        if (document.getElementById('tarot-event-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tarot-event-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
            
            /* 인트로 화면 */
            .tarot-intro {
                position: fixed;
                inset: 0;
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                background: #050310;
            }
            
            .tarot-intro.show {
                opacity: 1;
                transition: none;
            }
            
            .tarot-intro.fade-out {
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .tarot-intro-bg {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, #140a23 0%, #050310 100%);
            }
            
            .tarot-intro-content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: introReveal 1.5s ease-out forwards;
            }
            
            @keyframes introReveal {
                0% { opacity: 0; transform: translateY(30px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .tarot-intro-stars {
                font-size: 1.5rem;
                color: #b090d0;
                letter-spacing: 1em;
                margin-bottom: 25px;
                animation: introStars 2s ease-in-out infinite;
            }
            
            @keyframes introStars {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; text-shadow: 0 0 20px rgba(180, 150, 220, 0.8); }
            }
            
            .tarot-intro-title {
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                font-weight: 600;
                color: #d0c0e0;
                letter-spacing: 0.4em;
                text-shadow: 0 0 40px rgba(180, 150, 220, 0.5);
                margin-bottom: 15px;
            }
            
            .tarot-intro-subtitle {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #8070a0;
                letter-spacing: 0.5em;
                margin-bottom: 30px;
            }
            
            .tarot-intro-line {
                width: 200px;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(180, 150, 220, 0.5), transparent);
                animation: introLine 1.5s ease-out forwards;
            }
            
            @keyframes introLine {
                0% { width: 0; opacity: 0; }
                100% { width: 200px; opacity: 1; }
            }
            
            /* 엔딩 화면 */
            .tarot-ending {
                position: absolute;
                inset: 0;
                background: rgba(5, 3, 10, 0);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100;
                opacity: 0;
                transition: all 1.2s ease;
            }
            
            .tarot-ending.show {
                opacity: 1;
                background: rgba(5, 3, 10, 0.9);
            }
            
            .tarot-ending-text {
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: translateY(20px);
                opacity: 0;
                animation: endingTextReveal 1s ease-out 0.3s forwards;
            }
            
            @keyframes endingTextReveal {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .tarot-ending-stars {
                font-size: 1.2rem;
                color: #a080c0;
                letter-spacing: 0.8em;
                margin-bottom: 20px;
                animation: endingStarsPulse 1.5s ease-in-out infinite;
            }
            
            @keyframes endingStarsPulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; text-shadow: 0 0 15px rgba(160, 130, 200, 0.8); }
            }
            
            .tarot-ending-message {
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                color: #c0b0d0;
                letter-spacing: 0.3em;
                text-shadow: 0 0 30px rgba(150, 120, 200, 0.4);
                font-style: italic;
            }
            
            .tarot-event {
                position: fixed;
                inset: 0;
                z-index: 9999998;
                opacity: 0;
                transition: opacity 0.5s ease;
                font-family: 'Cinzel', serif;
                background: #050310;
            }
            
            .tarot-event.show {
                opacity: 1;
            }
            
            .tarot-backdrop {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center top, #0f0a19 0%, #050310 100%);
                overflow: hidden;
            }
            
            /* 별 배경 */
            .tarot-stars {
                position: absolute;
                inset: 0;
                background-image: 
                    radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.3), transparent),
                    radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.2), transparent),
                    radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.4), transparent),
                    radial-gradient(2px 2px at 130px 80px, rgba(255, 255, 255, 0.2), transparent),
                    radial-gradient(1px 1px at 160px 120px, rgba(255, 255, 255, 0.3), transparent);
                background-size: 200px 150px;
                animation: twinkle 4s ease-in-out infinite;
            }
            
            @keyframes twinkle {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
            }
            
            /* 별자리 라인 */
            .tarot-constellation {
                position: absolute;
                inset: 0;
                opacity: 0.15;
                background-image: 
                    linear-gradient(45deg, transparent 45%, rgba(180, 150, 255, 0.3) 50%, transparent 55%),
                    linear-gradient(-45deg, transparent 45%, rgba(180, 150, 255, 0.2) 50%, transparent 55%);
                background-size: 60px 60px;
            }
            
            .tarot-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: row;
                padding: 40px;
                overflow: hidden;
                gap: 40px;
            }
            
            /* 왼쪽 패널: 포트레이트 */
            .tarot-left-panel {
                flex: 0 0 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            
            .tarot-portrait-wrapper {
                position: relative;
                width: 100%;
                max-width: 650px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .tarot-portrait-aura {
                position: absolute;
                width: 150%;
                height: 150%;
                background: radial-gradient(ellipse at center, rgba(150, 100, 200, 0.35) 0%, rgba(100, 60, 150, 0.15) 50%, transparent 70%);
                animation: portraitAura 5s ease-in-out infinite;
                pointer-events: none;
            }
            
            @keyframes portraitAura {
                0%, 100% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.15); opacity: 1; }
            }
            
            .tarot-portrait-img {
                width: 100%;
                max-width: 600px;
                height: auto;
                max-height: 85vh;
                object-fit: contain;
                image-rendering: pixelated;
                filter: brightness(1.1) drop-shadow(0 0 50px rgba(150, 100, 200, 0.6));
                position: relative;
                z-index: 1;
                animation: portraitFloat 6s ease-in-out infinite;
            }
            
            @keyframes portraitFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-12px); }
            }
            
            .tarot-npc-name {
                margin-top: 25px;
                font-size: 1.4rem;
                color: #c0a0d0;
                letter-spacing: 0.6em;
                text-shadow: 0 0 30px rgba(150, 120, 200, 0.7);
                text-align: center;
            }
            
            /* 오른쪽 패널: 대사 + 카드 */
            .tarot-right-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 20px 0;
            }
            
            /* 대사 영역 */
            .tarot-speech {
                margin-bottom: 20px;
            }
            
            .tarot-dialogue {
                padding: 20px 30px;
                background: rgba(15, 10, 25, 0.9);
                border: 1px solid rgba(150, 120, 200, 0.3);
                border-left: 3px solid rgba(150, 120, 200, 0.6);
                color: #d0c0e0;
                font-size: 1.1rem;
                font-style: italic;
                line-height: 1.7;
                transition: opacity 0.3s;
            }
            
            /* 카드 영역 */
            .tarot-card-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            /* 포트레이트 반응 애니메이션 */
            .tarot-left-panel.shake-blessing .tarot-portrait-img {
                animation: portraitShakeBlessing 0.6s ease-out;
            }
            
            .tarot-left-panel.shake-curse .tarot-portrait-img {
                animation: portraitShakeCurse 0.6s ease-out;
            }
            
            @keyframes portraitShakeBlessing {
                0%, 100% { transform: translateY(0) scale(1); filter: brightness(1.1); }
                30% { transform: translateY(-15px) scale(1.03); filter: brightness(1.4); }
                60% { transform: translateY(-8px) scale(1.01); filter: brightness(1.25); }
            }
            
            @keyframes portraitShakeCurse {
                0%, 100% { transform: translate(0, 0); filter: brightness(1.1); }
                20% { transform: translate(-8px, 2px); filter: brightness(0.8) hue-rotate(-15deg); }
                40% { transform: translate(8px, -2px); filter: brightness(0.85) hue-rotate(-10deg); }
                60% { transform: translate(-4px, 1px); filter: brightness(0.9); }
                80% { transform: translate(4px, -1px); filter: brightness(1); }
            }
            
            /* 카드 영역 */
            .tarot-cards {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
                perspective: 1000px;
            }
            
            .tarot-card {
                width: 110px;
                height: 165px;
                cursor: pointer;
                transition: transform 0.4s ease, box-shadow 0.3s ease;
                flex-shrink: 0;
            }
            
            .tarot-card:hover:not(.revealed) {
                transform: translateY(-15px) scale(1.05);
                z-index: 10;
            }
            
            .tarot-card:hover:not(.revealed) .tarot-card-front {
                box-shadow: 0 20px 50px rgba(150, 120, 200, 0.5);
            }
            
            .tarot-card.revealed {
                cursor: default;
            }
            
            .tarot-card.revealed {
                transform: translateY(-8px);
            }
            
            .tarot-card-inner {
                position: relative;
                width: 100%;
                height: 100%;
                transition: transform 0.7s ease;
                transform-style: preserve-3d;
            }
            
            .tarot-card.revealed .tarot-card-inner {
                transform: rotateY(180deg);
            }
            
            .tarot-card.peeking .tarot-card-inner {
                transform: rotateY(180deg);
            }
            
            .tarot-card-front, .tarot-card-back {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
            }
            
            /* 카드 뒷면 (뒤집기 전) */
            .tarot-card-front {
                background: linear-gradient(145deg, #1a1525 0%, #0d0a15 100%);
                border: 1px solid rgba(150, 120, 200, 0.4);
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
            }
            
            .tarot-card-back-design {
                width: 90%;
                height: 90%;
                border: 1px solid rgba(150, 120, 200, 0.2);
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                background: radial-gradient(ellipse at center, rgba(100, 80, 150, 0.1), transparent);
            }
            
            .tarot-back-border {
                position: absolute;
                inset: 6px;
                border: 1px solid rgba(150, 120, 200, 0.1);
                border-radius: 3px;
            }
            
            .tarot-back-symbol {
                font-size: 2.2rem;
                color: #b090d0;
                opacity: 0.7;
                animation: symbolGlow 3s ease-in-out infinite;
            }
            
            .tarot-back-corner {
                position: absolute;
                font-size: 0.7rem;
                color: rgba(150, 120, 200, 0.35);
            }
            .tarot-back-corner.tl { top: 2px; left: 4px; }
            .tarot-back-corner.tr { top: 2px; right: 4px; }
            .tarot-back-corner.bl { bottom: 2px; left: 4px; }
            .tarot-back-corner.br { bottom: 2px; right: 4px; }
            
            @keyframes symbolGlow {
                0%, 100% { opacity: 0.5; text-shadow: 0 0 15px rgba(150, 120, 200, 0.4); }
                50% { opacity: 0.9; text-shadow: 0 0 25px rgba(150, 120, 200, 0.7); }
            }
            
            /* 카드 앞면 (뒤집은 후) */
            .tarot-card-back {
                transform: rotateY(180deg);
                padding: 12px 8px;
                justify-content: flex-start;
                padding-top: 20px;
            }
            
            .tarot-card-back.blessing {
                background: linear-gradient(145deg, #1a1815 0%, #0f0d0a 100%);
                border: 1px solid rgba(212, 175, 55, 0.5);
            }
            
            .tarot-card-back.curse {
                background: linear-gradient(145deg, #1a1218 0%, #0a070a 100%);
                border: 1px solid rgba(100, 60, 80, 0.5);
            }
            
            .tarot-card-numeral {
                font-size: 1.8rem;
                font-weight: 600;
                margin-bottom: 6px;
            }
            
            .tarot-card-back.blessing .tarot-card-numeral {
                color: #d4af37;
                text-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
            }
            
            .tarot-card-back.curse .tarot-card-numeral {
                color: #8b4060;
                text-shadow: 0 0 15px rgba(139, 64, 96, 0.5);
            }
            
            .tarot-card-name {
                font-size: 0.85rem;
                font-weight: 600;
                color: #c4b090;
                margin-bottom: 2px;
                letter-spacing: 0.08em;
            }
            
            .tarot-card-eng {
                font-size: 0.6rem;
                color: #6a5a45;
                margin-bottom: 10px;
                letter-spacing: 0.03em;
            }
            
            .tarot-card-divider {
                width: 50%;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
                margin-bottom: 10px;
            }
            
            .tarot-card-back.curse .tarot-card-divider {
                background: linear-gradient(90deg, transparent, rgba(139, 64, 96, 0.3), transparent);
            }
            
            .tarot-card-desc {
                font-size: 0.65rem;
                color: #8a7a65;
                text-align: center;
                line-height: 1.4;
                font-style: italic;
                padding: 0 5px;
            }
            
            /* 선택 오브 */
            .tarot-selections {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .tarot-sel-label {
                font-size: 0.75rem;
                color: #8070a0;
                letter-spacing: 0.2em;
            }
            
            .tarot-sel-orbs {
                display: flex;
                gap: 12px;
            }
            
            .tarot-orb {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 1px solid rgba(150, 120, 200, 0.4);
                background: transparent;
                transition: all 0.4s ease;
            }
            
            .tarot-orb.active {
                background: radial-gradient(circle, #c0a0e0 0%, #8060b0 100%);
                box-shadow: 0 0 10px rgba(150, 120, 200, 0.6);
                animation: orbPulse 2s ease-in-out infinite;
            }
            
            @keyframes orbPulse {
                0%, 100% { box-shadow: 0 0 6px rgba(150, 120, 200, 0.4); }
                50% { box-shadow: 0 0 12px rgba(150, 120, 200, 0.8); }
            }
            
            .tarot-orb.used {
                background: rgba(20, 15, 30, 0.6);
                border-color: rgba(80, 60, 100, 0.2);
                box-shadow: none;
                animation: none;
            }
            
            /* 결과 영역 */
            .tarot-results {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(10, 5, 20, 0.5);
                border: 1px solid rgba(150, 120, 200, 0.15);
            }
            
            .tarot-results.hidden {
                display: none;
            }
            
            .tarot-result-item {
                padding: 12px 15px;
                display: flex;
                align-items: center;
                gap: 12px;
                opacity: 0;
                transform: translateX(-10px);
                transition: all 0.4s ease;
                border-left: 3px solid;
                background: rgba(20, 15, 30, 0.8);
            }
            
            .tarot-result-item.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .tarot-result-item.blessing {
                border-left-color: #d4af37;
            }
            
            .tarot-result-item.curse {
                border-left-color: #9050a0;
            }
            
            .result-numeral {
                font-size: 1rem;
                font-weight: 600;
                min-width: 40px;
                color: #8070a0;
            }
            
            .result-name {
                font-size: 0.9rem;
                color: #c0b0d0;
                min-width: 100px;
            }
            
            .result-arrow {
                color: #6050a0;
                font-size: 0.9rem;
            }
            
            .result-text {
                font-size: 0.95rem;
                font-weight: 600;
            }
            
            .tarot-result-item.blessing .result-text {
                color: #d4af37;
            }
            
            .tarot-result-item.curse .result-text {
                color: #c06080;
            }
            
            /* 하단 버튼 */
            .tarot-footer {
                display: flex;
                gap: 15px;
                margin-top: auto;
                padding-top: 15px;
            }
            
            .tarot-leave-btn, .tarot-peek-btn {
                padding: 12px 30px;
                border: 1px solid rgba(150, 120, 200, 0.3);
                background: rgba(20, 15, 35, 0.7);
                color: #a090c0;
                font-family: 'Cinzel', serif;
                font-size: 0.85rem;
                letter-spacing: 0.12em;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .tarot-leave-btn:hover {
                background: rgba(150, 120, 200, 0.2);
                border-color: rgba(150, 120, 200, 0.5);
                color: #c0b0e0;
            }
            
            .tarot-leave-btn.complete {
                border-color: rgba(212, 175, 55, 0.5);
                color: #d4af37;
                background: rgba(212, 175, 55, 0.1);
            }
            
            .tarot-leave-btn.disabled,
            .tarot-leave-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
                color: #555;
                border-color: rgba(80, 60, 100, 0.2);
            }
            
            .tarot-leave-btn.disabled:hover,
            .tarot-leave-btn:disabled:hover {
                background: rgba(20, 15, 35, 0.7);
                border-color: rgba(80, 60, 100, 0.2);
                color: #555;
            }
            
            .tarot-peek-btn {
                border-color: rgba(100, 180, 150, 0.3);
                color: #90c0b0;
            }
            
            .tarot-peek-btn:hover {
                background: rgba(100, 180, 150, 0.2);
                border-color: rgba(100, 180, 150, 0.5);
                color: #a0e0d0;
            }
            
            .tarot-peek-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            
            /* 파티클 */
            .tarot-particle {
                position: fixed;
                width: 4px;
                height: 4px;
                pointer-events: none;
                animation: particleFly 1.2s ease-out forwards;
                z-index: 9999999;
            }
            
            @keyframes particleFly {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0.8;
                }
                100% {
                    transform: translate(var(--tx), var(--ty)) scale(0);
                    opacity: 0;
                }
            }
            
            /* VFX 효과 */
            .tarot-screen-flash {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 99999999;
                animation: screenFlash 0.4s ease-out forwards;
            }
            
            .tarot-screen-flash.blessing {
                background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.3) 0%, transparent 70%);
            }
            
            .tarot-screen-flash.curse {
                background: radial-gradient(ellipse at center, rgba(80, 20, 40, 0.4) 0%, transparent 70%);
            }
            
            @keyframes screenFlash {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            /* 축복 빛줄기 */
            .tarot-vfx-beam {
                position: fixed;
                width: 3px;
                height: 80px;
                pointer-events: none;
                z-index: 9999999;
                transform-origin: center bottom;
                transform: rotate(var(--angle)) translateY(-40px);
                animation: beamShoot 0.8s ease-out forwards;
                animation-delay: var(--delay);
            }
            
            .tarot-vfx-beam.blessing {
                background: linear-gradient(to top, rgba(212, 175, 55, 0.8), transparent);
                box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
            }
            
            @keyframes beamShoot {
                0% { height: 0; opacity: 1; }
                50% { height: 120px; opacity: 1; }
                100% { height: 120px; opacity: 0; transform: rotate(var(--angle)) translateY(-100px); }
            }
            
            /* 별빛 파티클 */
            .tarot-vfx-star {
                position: fixed;
                pointer-events: none;
                z-index: 9999999;
                font-size: var(--size);
                color: #d4af37;
                text-shadow: 0 0 10px rgba(212, 175, 55, 0.8);
                animation: starFloat 1.2s ease-out forwards;
                animation-delay: var(--delay);
                opacity: 0;
            }
            
            @keyframes starFloat {
                0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 0; }
                20% { opacity: 1; transform: scale(1); }
                100% { transform: translate(var(--tx), var(--ty)) rotate(180deg) scale(0.3); opacity: 0; }
            }
            
            /* 확산 링 */
            .tarot-vfx-ring {
                position: fixed;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999999;
                transform: translate(-50%, -50%);
                animation: ringExpand 0.8s ease-out forwards;
            }
            
            .tarot-vfx-ring.blessing {
                border: 2px solid rgba(212, 175, 55, 0.8);
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(212, 175, 55, 0.2);
            }
            
            .tarot-vfx-ring.curse {
                border: 2px solid rgba(139, 64, 96, 0.8);
                box-shadow: 0 0 20px rgba(139, 64, 96, 0.4), inset 0 0 20px rgba(60, 20, 40, 0.3);
            }
            
            @keyframes ringExpand {
                0% { width: 20px; height: 20px; opacity: 1; }
                100% { width: 250px; height: 250px; opacity: 0; }
            }
            
            /* 저주 균열 */
            .tarot-vfx-crack {
                position: fixed;
                width: 3px;
                height: var(--length);
                pointer-events: none;
                z-index: 9999999;
                background: linear-gradient(to bottom, rgba(139, 64, 96, 0.9), rgba(60, 20, 40, 0.5), transparent);
                transform-origin: center top;
                transform: rotate(var(--angle));
                animation: crackGrow 0.6s ease-out forwards;
            }
            
            @keyframes crackGrow {
                0% { height: 0; opacity: 1; }
                60% { height: var(--length); opacity: 1; }
                100% { height: var(--length); opacity: 0; }
            }
            
            /* 그림자 낙하 */
            .tarot-vfx-shadow {
                position: fixed;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999999;
                background: radial-gradient(circle, rgba(60, 20, 40, 0.8), transparent);
                animation: shadowFall 1s ease-in forwards;
                animation-delay: var(--delay);
                opacity: 0;
            }
            
            @keyframes shadowFall {
                0% { transform: translateY(0) scale(1); opacity: 0; }
                20% { opacity: 0.8; }
                100% { transform: translateY(var(--ty)) scale(0.3); opacity: 0; }
            }
            
            /* 반응형 */
            @media (max-width: 1100px) {
                .tarot-left-panel {
                    flex: 0 0 40%;
                }
                
                .tarot-portrait-img {
                    max-width: 500px;
                }
            }
            
            @media (max-width: 900px) {
                .tarot-container {
                    flex-direction: column;
                    padding: 20px;
                    gap: 20px;
                }
                
                .tarot-left-panel {
                    flex: 0 0 auto;
                    flex-direction: row;
                    gap: 25px;
                    align-items: center;
                }
                
                .tarot-portrait-wrapper {
                    max-width: 180px;
                }
                
                .tarot-portrait-img {
                    max-width: 170px;
                    max-height: 200px;
                }
                
                .tarot-npc-name {
                    margin-top: 0;
                    font-size: 1.1rem;
                    letter-spacing: 0.4em;
                }
                
                .tarot-right-panel {
                    padding: 10px 0;
                }
                
                .tarot-dialogue {
                    font-size: 0.95rem;
                    padding: 15px 20px;
                }
                
                .tarot-card {
                    width: 90px;
                    height: 135px;
                }
                
                .tarot-cards {
                    gap: 8px;
                }
            }
            
            @media (max-width: 600px) {
                .tarot-left-panel {
                    flex-direction: column;
                }
                
                .tarot-portrait-wrapper {
                    max-width: 140px;
                }
                
                .tarot-portrait-img {
                    max-width: 130px;
                }
                
                .tarot-card {
                    width: 70px;
                    height: 105px;
                }
                
                .tarot-card-numeral {
                    font-size: 1.3rem;
                }
                
                .tarot-card-name {
                    font-size: 0.7rem;
                }
                
                .tarot-card-eng {
                    display: none;
                }
                
                .tarot-card-desc {
                    font-size: 0.55rem;
                }
                
                .tarot-dialogue {
                    font-size: 0.85rem;
                    padding: 12px 15px;
                }
                
                .tarot-footer {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .tarot-leave-btn, .tarot-peek-btn {
                    width: 100%;
                    text-align: center;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 접근
window.TarotEvent = TarotEvent;

// EventSystem에 등록 (eventsystem.js가 먼저 로드된 경우)
if (typeof EventSystem !== 'undefined') {
    EventSystem.register('tarot', {
        id: 'tarot',
        name: '점성술사',
        description: '운명의 카드를 뽑아 축복 또는 저주를 받는다.',
        icon: '🔮',
        weight: 100, // 현재 유일한 이벤트
        isFullscreen: true,
        condition: () => true,
        execute: (room) => TarotEvent.open(room)
    });
    console.log('[Event1] EventSystem에 점성술사 이벤트 등록 완료');
}

// 페이지 로드 시 스타일 미리 주입
TarotEvent.init();

console.log('[Event1] 운명의 카드 이벤트 로드 완료');
