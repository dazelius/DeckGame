// ==========================================
// Shadow Deck - 도박꾼의 유령 이벤트
// "운명의 카드" - 하이로우 도박
// ==========================================

const GamblerEvent = {
    isActive: false,
    currentRoom: null,
    selectedReward: null,
    currentRisk: null,
    currentCard: null,
    wins: 0,             // 맞춘 횟수
    lives: 2,            // 목숨 (2번까지 실수 가능)
    maxWins: 3,          // 3번 맞추면 승리
    maxLives: 2,         // 최대 목숨
    isAllIn: false,      // ALL-IN 모드
    
    // 도박꾼 대사
    dialogues: {
        greeting: [
            "...허허, 또 다른 영혼이 찾아왔군.",
            "크크크... 도박 좀 하고 가겠나, 친구?",
            "운명을 시험해볼 용기가 있나?"
        ],
        askReward: [
            "뭘 원하나? 골라봐.",
            "욕심을 말해봐... 뭘 걸고 싶지?",
            "오늘 네가 탐내는 건 뭐지?"
        ],
        riskAnnounce: [
            "크크... 그 대가는...",
            "좋지, 하지만 대가가 있어.",
            "탐욕에는 대가가 따르는 법..."
        ],
        gameStart: [
            "자, 시작하지.",
            "운명의 카드를 뽑아볼까...",
            "네 운을 시험해보자."
        ],
        askHighLow: [
            "다음 카드는... 높을까? 낮을까?",
            "자, 골라봐. HIGH? LOW?",
            "네 선택은?"
        ],
        correct: [
            "오...! 맞췄군!",
            "크크, 운이 좋아...",
            "아직 살아있네..."
        ],
        wrong: [
            "크크크크크... 안됐군.",
            "운명은 잔인한 법이지.",
            "그것이 도박이야, 친구."
        ],
        win: [
            "허...! 대단하군! 네가 이겼어.",
            "오랜만에 보는 행운아로군...",
            "가져가라, 네가 이겼다."
        ],
        giveUp: [
            "현명한 선택일 수도... 아닐 수도.",
            "겁쟁이인가, 현명한 건가...",
            "흥, 다음에 보자."
        ],
        taunt: [
            "계속할 용기가 있나?",
            "여기서 멈출 텐가? 아까운데...",
            "한 번 더? 아니면 도망칠 건가?"
        ],
        outro: [
            "도박꾼은 유유히 사라졌다...",
            "유령은 어둠 속으로 녹아들었다...",
            "안개처럼, 도박꾼은 흩어졌다..."
        ],
        allInAsk: [
            "...아니면, 모든 걸 걸어볼 텐가?",
            "크크크... 목숨까지 걸 용기가 있나?",
            "진정한 도박꾼이 되고 싶다면..."
        ],
        allInAccept: [
            "호오...! 정말로...? 목숨을 거는 건가?!",
            "크크크크크! 좋아! 이게 진짜 도박이지!",
            "대단한 배짱이군...! 좋다!"
        ],
        allInWin: [
            "...믿을 수가 없군. 네가... 이겼다.",
            "크크... 진정한 도박꾼이로군.",
            "가져가라. 내 모든 것을..."
        ],
        allInLose: [
            "크크크크크크크!! 끝이다, 친구!!",
            "이것이 도박의 끝이지... 안녕!",
            "목숨을 건 자의 최후로군..."
        ]
    },
    
    // 보상 옵션 (플레이어가 선택)
    rewardOptions: [
        {
            id: 'gold_small',
            icon: '💰',
            name: '골드 주머니',
            desc: '80 Gold',
            tier: 1,
            apply: () => {
                if (typeof gameState !== 'undefined') {
                    gameState.gold = (gameState.gold || 0) + 80;
                    if (typeof TopBar !== 'undefined') TopBar.updateGold();
                }
                return '+80 Gold';
            }
        },
        {
            id: 'gold_big',
            icon: '💎',
            name: '보물 상자',
            desc: '200 Gold',
            tier: 3,
            apply: () => {
                if (typeof gameState !== 'undefined') {
                    gameState.gold = (gameState.gold || 0) + 200;
                    if (typeof TopBar !== 'undefined') TopBar.updateGold();
                }
                return '+200 Gold';
            }
        },
        {
            id: 'heal',
            icon: '❤️',
            name: '생명력',
            desc: 'HP 30 회복',
            tier: 1,
            apply: () => {
                if (typeof gameState !== 'undefined') {
                    const healed = Math.min(30, gameState.player.maxHp - gameState.player.hp);
                    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 30);
                    if (typeof TopBar !== 'undefined') TopBar.updateHP();
                    return `+${healed} HP`;
                }
                return '+30 HP';
            }
        },
        {
            id: 'remove_card',
            icon: '🔥',
            name: '카드 소각',
            desc: '덱에서 카드 1장 제거',
            tier: 2,
            apply: () => {
                // 카드 제거 UI 표시
                if (typeof CardRemovalUI !== 'undefined') {
                    setTimeout(() => CardRemovalUI.show(), 500);
                    return '카드를 선택하여 제거하세요!';
                } else if (typeof gameState !== 'undefined' && gameState.deck && gameState.deck.length > 0) {
                    // 기본 카드 중 하나 자동 제거
                    const basicCards = gameState.deck.filter(c => c.rarity === 'basic' || c.rarity === 'common');
                    if (basicCards.length > 0) {
                        const toRemove = basicCards[0];
                        const idx = gameState.deck.indexOf(toRemove);
                        if (idx > -1) gameState.deck.splice(idx, 1);
                        return `${toRemove.name} 제거됨!`;
                    }
                }
                return '카드 제거 완료!';
            }
        },
        {
            id: 'card',
            icon: '🃏',
            name: '운명의 카드',
            desc: '랜덤 카드 획득',
            tier: 2,
            actualCard: null,
            generate: function() {
                if (typeof cardDatabase !== 'undefined') {
                    const cards = Object.entries(cardDatabase).filter(([id, card]) => 
                        card.rarity === 'uncommon' || card.rarity === 'rare'
                    );
                    if (cards.length > 0) {
                        this.actualCard = cards[Math.floor(Math.random() * cards.length)];
                        this.desc = this.actualCard[1].name;
                    }
                }
            },
            apply: function() {
                if (this.actualCard && typeof createCard === 'function') {
                    const [cardId, cardData] = this.actualCard;
                    const newCard = createCard(cardId);
                    if (newCard && gameState.deck) {
                        gameState.deck.push(newCard);
                    }
                    return `${cardData.name} 획득!`;
                }
                return '카드 획득!';
            }
        },
        {
            id: 'relic',
            icon: '🏆',
            name: '유물',
            desc: '랜덤 유물',
            tier: 3,
            actualRelic: null,
            generate: function() {
                if (typeof relicDatabase !== 'undefined') {
                    const relics = Object.entries(relicDatabase).filter(([id, relic]) => {
                        if (typeof RelicSystem !== 'undefined' && RelicSystem.ownedRelics) {
                            return !RelicSystem.ownedRelics.some(r => r.id === id);
                        }
                        return true;
                    });
                    if (relics.length > 0) {
                        this.actualRelic = relics[Math.floor(Math.random() * relics.length)];
                        this.desc = this.actualRelic[1].name || this.actualRelic[0];
                    }
                }
            },
            apply: function() {
                if (this.actualRelic && typeof RelicSystem !== 'undefined') {
                    const [relicId, relicData] = this.actualRelic;
                    RelicSystem.addRelic(relicId);
                    if (typeof TopBar !== 'undefined') TopBar.updateRelics();
                    return `${relicData.name || relicId} 획득!`;
                }
                return '유물 획득!';
            }
        }
    ],
    
    // 저주 카드 정의
    curseCards: {
        regret: {
            id: 'curse_regret',
            name: '후회',
            type: 'curse',
            cost: -1,
            icon: '😢',
            description: '사용 불가. 손에 있으면 카드 뽑기 -1.',
            playable: false,
            unplayable: true
        },
        greed: {
            id: 'curse_greed',
            name: '탐욕',
            type: 'curse',
            cost: -1,
            icon: '💸',
            description: '사용 불가. 전투 종료 시 10 Gold 손실.',
            playable: false,
            unplayable: true
        },
        doubt: {
            id: 'curse_doubt',
            name: '의심',
            type: 'curse',
            cost: -1,
            icon: '❓',
            description: '사용 불가. 손에 있으면 방어력 -3.',
            playable: false,
            unplayable: true
        },
        pain: {
            id: 'curse_pain',
            name: '고통',
            type: 'curse',
            cost: -1,
            icon: '🩸',
            description: '사용 불가. 매 턴 시작 시 2 피해.',
            playable: false,
            unplayable: true
        }
    },
    
    // 리스크 옵션 (도박꾼이 선택 - 티어에 따라)
    riskOptions: {
        1: [  // 낮은 보상
            { icon: '💔', desc: 'HP 15 손실', apply: () => {
                if (typeof gameState !== 'undefined') {
                    gameState.player.hp = Math.max(1, gameState.player.hp - 15);
                    if (typeof TopBar !== 'undefined') TopBar.updateHP();
                }
                return '-15 HP';
            }},
            { icon: '💰', desc: '40 Gold 손실', apply: () => {
                if (typeof gameState !== 'undefined') {
                    gameState.gold = Math.max(0, (gameState.gold || 0) - 40);
                    if (typeof TopBar !== 'undefined') TopBar.updateGold();
                }
                return '-40 Gold';
            }},
            { icon: '😢', desc: '저주: 후회', apply: function() {
                return GamblerEvent.addCurseCard('regret');
            }}
        ],
        2: [  // 중간 보상
            { icon: '💔', desc: 'HP 25 손실', apply: () => {
                if (typeof gameState !== 'undefined') {
                    gameState.player.hp = Math.max(1, gameState.player.hp - 25);
                    if (typeof TopBar !== 'undefined') TopBar.updateHP();
                }
                return '-25 HP';
            }},
            { icon: '💸', desc: '저주: 탐욕', apply: function() {
                return GamblerEvent.addCurseCard('greed');
            }},
            { icon: '❓', desc: '저주: 의심', apply: function() {
                return GamblerEvent.addCurseCard('doubt');
            }}
        ],
        3: [  // 높은 보상
            { icon: '💀', desc: '최대 HP -8', apply: () => {
                if (typeof gameState !== 'undefined') {
                    gameState.player.maxHp = Math.max(10, gameState.player.maxHp - 8);
                    gameState.player.hp = Math.min(gameState.player.hp, gameState.player.maxHp);
                    if (typeof TopBar !== 'undefined') TopBar.updateHP();
                }
                return '최대 HP -8';
            }},
            { icon: '🩸', desc: '저주: 고통', apply: function() {
                return GamblerEvent.addCurseCard('pain');
            }},
            { icon: '💔', desc: 'HP 35 손실', apply: () => {
                if (typeof gameState !== 'undefined') {
                    gameState.player.hp = Math.max(1, gameState.player.hp - 35);
                    if (typeof TopBar !== 'undefined') TopBar.updateHP();
                }
                return '-35 HP';
            }}
        ]
    },
    
    // 저주 카드 추가 함수
    addCurseCard(curseType) {
        const curse = this.curseCards[curseType];
        if (!curse) return '저주 실패...';
        
        if (typeof gameState !== 'undefined' && gameState.deck) {
            // 새 저주 카드 객체 생성
            const curseCard = {
                ...curse,
                instanceId: `${curse.id}_${Date.now()}`
            };
            gameState.deck.push(curseCard);
            return `저주: ${curse.name} 획득...`;
        }
        return '저주 카드 획득...';
    },
    
    // 카드 덱 (하이로우용)
    cardDeck: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
    cardSuits: ['♠️', '♥️', '♦️', '♣️'],
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.injectStyles();
        console.log('[GamblerEvent] 초기화 완료');
    },
    
    // ==========================================
    // 이벤트 시작
    // ==========================================
    start(room) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentRoom = room;
        this.selectedReward = null;
        this.currentRisk = null;
        this.currentCard = null;
        this.wins = 0;
        this.lives = this.maxLives;
        
        // TopBar 표시
        if (typeof TopBar !== 'undefined') {
            TopBar.show();
            TopBar.update();
        }
        
        // 보상 생성 (카드/유물은 미리 생성)
        this.rewardOptions.forEach(r => {
            if (r.generate) r.generate();
        });
        
        // 인트로 먼저 표시
        this.showIntro();
        console.log('[GamblerEvent] 시작');
    },
    
    // ==========================================
    // 인트로 화면
    // ==========================================
    showIntro() {
        const intro = document.createElement('div');
        intro.id = 'gambler-intro';
        intro.className = 'gambler-intro show';
        intro.innerHTML = `
            <div class="gambler-intro-bg"></div>
            <div class="gambler-intro-content">
                <div class="gambler-intro-icon">🎲</div>
                <div class="gambler-intro-title">도박꾼의 유령</div>
                <div class="gambler-intro-subtitle">GAMBLER'S GHOST</div>
                <div class="gambler-intro-line"></div>
            </div>
        `;
        
        document.body.appendChild(intro);
        
        // 2.5초 후 메인 UI 생성
        setTimeout(() => {
            this.createUI();
        }, 2500);
        
        // 3초 후 인트로 페이드아웃
        setTimeout(() => {
            intro.classList.add('fade-out');
            setTimeout(() => {
                intro.remove();
            }, 800);
        }, 3000);
    },
    
    // ==========================================
    // UI 생성
    // ==========================================
    createUI() {
        const existing = document.querySelector('.gambler-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'gambler-overlay';
        
        // 현재 직업 스프라이트 가져오기
        let playerSprite = 'hero.png';
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob && JobSystem.jobs[JobSystem.currentJob]) {
            playerSprite = JobSystem.jobs[JobSystem.currentJob].sprite || 'hero.png';
        }
        
        overlay.innerHTML = `
            <div class="gambler-letterbox top"></div>
            <div class="gambler-letterbox bottom"></div>
            <div class="gambler-bg"></div>
            <div class="gambler-vignette"></div>
            <div class="gambler-particles"></div>
            
            <!-- 왼쪽: 도박꾼 캐릭터 -->
            <div class="duel-character left-char">
                <img src="char_gambler.png" alt="도박꾼의 유령" class="duel-portrait">
                <div class="char-glow left-glow"></div>
            </div>
            
            <!-- 오른쪽: 플레이어 캐릭터 -->
            <div class="duel-character right-char">
                <img src="${playerSprite}" alt="플레이어" class="duel-portrait player-portrait">
                <div class="char-glow right-glow"></div>
            </div>
            
            <div class="gambler-container">
                <!-- 헤더 -->
                <div class="gambler-header">
                    <h1 class="gambler-title">GAMBLER'S GHOST</h1>
                    <p class="gambler-subtitle">도박꾼의 유령</p>
                </div>
                
                <!-- 대화창 -->
                <div class="dialogue-area">
                    <div class="dialogue-box">
                        <span class="dialogue-text"></span>
                    </div>
                </div>
                
                <!-- 보상 선택 영역 -->
                <div class="reward-selection hidden">
                    <div class="selection-title">무엇을 원하는가?</div>
                    <div class="reward-grid"></div>
                </div>
                
                <!-- 리스크 표시 -->
                <div class="risk-display hidden">
                    <div class="stakes-container">
                        <div class="stake-box reward-stake">
                            <div class="stake-label">🏆 보상</div>
                            <div class="stake-content"></div>
                        </div>
                        <div class="vs-text">VS</div>
                        <div class="stake-box risk-stake">
                            <div class="stake-label">💀 대가</div>
                            <div class="stake-content"></div>
                        </div>
                    </div>
                    <div class="game-rule">
                        <span class="rule-icon">🃏</span>
                        <span class="rule-text">3번 연속으로 맞추면 승리!</span>
                    </div>
                </div>
                
                <!-- 게임 영역 -->
                <div class="game-area hidden">
                    <div class="game-status">
                        <div class="status-item wins-display">
                            <span class="status-label">성공</span>
                            <div class="status-dots wins-dots">
                                <span class="status-dot win-dot"></span>
                                <span class="status-dot win-dot"></span>
                                <span class="status-dot win-dot"></span>
                            </div>
                        </div>
                        <div class="status-divider">│</div>
                        <div class="status-item lives-display">
                            <span class="status-label">목숨</span>
                            <div class="status-dots lives-dots">
                                <span class="status-dot life-dot">💀</span>
                                <span class="status-dot life-dot">💀</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cards-display">
                        <div class="card-slot current">
                            <div class="playing-card"></div>
                        </div>
                        <div class="card-slot next">
                            <div class="playing-card back">?</div>
                        </div>
                    </div>
                    
                    <div class="choice-buttons">
                        <button class="choice-btn high" data-choice="high">
                            <span class="btn-icon">⬆️</span>
                            <span class="btn-label">HIGH</span>
                            <span class="btn-desc">더 높다</span>
                        </button>
                        <button class="choice-btn low" data-choice="low">
                            <span class="btn-icon">⬇️</span>
                            <span class="btn-label">LOW</span>
                            <span class="btn-desc">더 낮다</span>
                        </button>
                    </div>
                </div>
                
                <!-- 결과 영역 -->
                <div class="result-area hidden">
                    <div class="result-icon"></div>
                    <div class="result-text"></div>
                    <div class="result-detail"></div>
                </div>
                
                <!-- 버튼 영역 -->
                <div class="action-buttons hidden">
                    <button class="action-btn accept">도박한다</button>
                    <button class="action-btn decline">거절한다</button>
                    <button class="action-btn all-in">🎲 ALL-IN 🎲</button>
                </div>
                
                <!-- 아웃트로 -->
                <div class="outro-text hidden"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            this.startParticles();
            this.playIntro();
        });
        
        this.bindEvents(overlay);
    },
    
    bindEvents(overlay) {
        // 보상 선택
        overlay.querySelector('.reward-grid').addEventListener('click', (e) => {
            const rewardEl = e.target.closest('.reward-option');
            if (rewardEl) {
                this.selectReward(rewardEl.dataset.id);
            }
        });
        
        // 도박 수락/거절/ALL-IN
        overlay.querySelector('.action-btn.accept').addEventListener('click', () => this.acceptGamble());
        overlay.querySelector('.action-btn.decline').addEventListener('click', () => this.declineGamble());
        overlay.querySelector('.action-btn.all-in').addEventListener('click', () => this.acceptAllIn());
        
        // 하이로우 선택
        overlay.querySelector('.choice-btn.high').addEventListener('click', () => this.makeChoice('high'));
        overlay.querySelector('.choice-btn.low').addEventListener('click', () => this.makeChoice('low'));
        
    },
    
    // ==========================================
    // 인트로
    // ==========================================
    async playIntro() {
        const dialogueText = document.querySelector('.dialogue-text');
        
        // 인사
        await this.typeText(dialogueText, this.getRandomDialogue('greeting'));
        await this.wait(1500);
        
        // 보상 선택 요청
        await this.typeText(dialogueText, this.getRandomDialogue('askReward'));
        await this.wait(500);
        
        // 보상 선택 UI 표시
        this.showRewardSelection();
    },
    
    // ==========================================
    // 보상 선택 UI
    // ==========================================
    showRewardSelection() {
        const grid = document.querySelector('.reward-grid');
        const selection = document.querySelector('.reward-selection');
        
        // 6개 중 랜덤 3개 선택
        const shuffled = [...this.rewardOptions].sort(() => Math.random() - 0.5);
        const displayRewards = shuffled.slice(0, 3);
        
        grid.innerHTML = displayRewards.map(reward => `
            <div class="reward-option tier-${reward.tier}" data-id="${reward.id}">
                <div class="reward-glow"></div>
                <div class="reward-icon-wrap">
                    <span class="reward-icon">${reward.icon}</span>
                </div>
                <div class="reward-info">
                    <span class="reward-name">${reward.name}</span>
                    <span class="reward-desc">${reward.desc}</span>
                </div>
                <div class="reward-tier">${'◆'.repeat(reward.tier)}</div>
            </div>
        `).join('');
        
        selection.classList.remove('hidden');
        selection.classList.add('show');
    },
    
    // ==========================================
    // 보상 선택
    // ==========================================
    async selectReward(rewardId) {
        const reward = this.rewardOptions.find(r => r.id === rewardId);
        if (!reward) return;
        
        this.selectedReward = reward;
        
        // 선택 표시
        document.querySelectorAll('.reward-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === rewardId);
        });
        
        await this.wait(300);
        
        // 보상 선택 숨기기
        document.querySelector('.reward-selection').classList.add('hidden');
        
        const dialogueText = document.querySelector('.dialogue-text');
        
        // 도박꾼이 리스크 발표
        await this.typeText(dialogueText, this.getRandomDialogue('riskAnnounce'));
        await this.wait(800);
        
        // 리스크 선택 (도박꾼이 티어에 맞게 선택)
        const risks = this.riskOptions[reward.tier];
        this.currentRisk = risks[Math.floor(Math.random() * risks.length)];
        
        // 리스크 표시
        this.showRiskDisplay();
        
        await this.wait(1200);
        
        // 수락/거절 버튼 표시
        document.querySelector('.action-buttons').classList.remove('hidden');
    },
    
    // ==========================================
    // 리스크 표시
    // ==========================================
    showRiskDisplay() {
        const display = document.querySelector('.risk-display');
        
        // 보상
        display.querySelector('.reward-stake .stake-content').innerHTML = `
            <span class="stake-icon">${this.selectedReward.icon}</span>
            <span class="stake-text">${this.selectedReward.desc}</span>
        `;
        
        // 리스크
        display.querySelector('.risk-stake .stake-content').innerHTML = `
            <span class="stake-icon">${this.currentRisk.icon}</span>
            <span class="stake-text">${this.currentRisk.desc}</span>
        `;
        
        display.classList.remove('hidden');
        display.classList.add('show');
    },
    
    // ==========================================
    // 도박 수락
    // ==========================================
    async acceptGamble() {
        document.querySelector('.action-buttons').classList.add('hidden');
        document.querySelector('.risk-display').classList.add('hidden');
        
        const dialogueText = document.querySelector('.dialogue-text');
        await this.typeText(dialogueText, this.getRandomDialogue('gameStart'));
        await this.wait(800);
        
        // 게임 시작
        this.startGame();
    },
    
    // ==========================================
    // 도박 거절
    // ==========================================
    async declineGamble() {
        document.querySelector('.action-buttons').classList.add('hidden');
        document.querySelector('.risk-display').classList.add('hidden');
        
        const dialogueText = document.querySelector('.dialogue-text');
        await this.typeText(dialogueText, this.getRandomDialogue('giveUp'));
        await this.wait(1500);
        
        // 간단한 아웃트로 (거절)
        await this.playOutroSimple();
    },
    
    // ==========================================
    // ALL-IN 수락 (목숨을 건 도박)
    // ==========================================
    async acceptAllIn() {
        document.querySelector('.action-buttons').classList.add('hidden');
        document.querySelector('.risk-display').classList.add('hidden');
        
        this.isAllIn = true;
        this.lives = 1; // ALL-IN은 1번 틀리면 끝
        this.maxWins = 5; // 5번 연속 맞춰야 함
        
        const dialogueText = document.querySelector('.dialogue-text');
        await this.typeText(dialogueText, this.getRandomDialogue('allInAccept'));
        await this.wait(1000);
        
        // ALL-IN 리스크/보상 표시
        const display = document.querySelector('.risk-display');
        display.querySelector('.reward-stake .stake-content').innerHTML = `
            <span class="stake-icon">🎰</span>
            <span class="stake-text">겜블러 직업 획득!</span>
        `;
        display.querySelector('.risk-stake .stake-content').innerHTML = `
            <span class="stake-icon">💀</span>
            <span class="stake-text">사망 (게임 오버)</span>
        `;
        display.classList.remove('hidden');
        display.classList.add('show', 'all-in-mode');
        
        await this.wait(2000);
        display.classList.add('hidden');
        
        await this.typeText(dialogueText, "5연승을 해야 네가 이긴다... 크크크!");
        await this.wait(1000);
        
        // 게임 시작
        this.startGame();
    },
    
    // 간단한 아웃트로 (거절 시)
    async playOutroSimple() {
        const overlay = document.querySelector('.gambler-overlay');
        if (overlay) overlay.classList.add('fading-content');
        
        await this.wait(500);
        
        const outro = document.createElement('div');
        outro.id = 'gambler-outro';
        outro.className = 'gambler-outro';
        outro.innerHTML = `
            <div class="gambler-outro-bg"></div>
            <div class="gambler-outro-content">
                <div class="outro-flavor-only">${this.getRandomDialogue('outro')}</div>
            </div>
        `;
        
        document.body.appendChild(outro);
        requestAnimationFrame(() => outro.classList.add('show'));
        
        await this.wait(2500);
        
        outro.classList.add('fade-out');
        await this.wait(800);
        outro.remove();
        
        this.close();
    },
    
    // ==========================================
    // 게임 시작
    // ==========================================
    async startGame() {
        this.wins = 0;
        
        // ALL-IN 모드면 lives 유지, 아니면 maxLives 사용
        if (!this.isAllIn) {
            this.lives = this.maxLives;
        }
        
        // UI 업데이트 (dot 개수 동적 생성)
        this.updateGameStatusUI();
        this.updateStatusDisplay();
        
        document.querySelector('.game-area').classList.remove('hidden');
        
        // 첫 카드 뽑기
        this.drawCard();
        
        const dialogueText = document.querySelector('.dialogue-text');
        await this.typeText(dialogueText, this.getRandomDialogue('askHighLow'));
    },
    
    // ==========================================
    // 카드 뽑기
    // ==========================================
    drawCard() {
        const value = this.cardDeck[Math.floor(Math.random() * this.cardDeck.length)];
        const suit = this.cardSuits[Math.floor(Math.random() * 4)];
        const isRed = suit === '♥️' || suit === '♦️';
        
        this.currentCard = {
            value,
            suit,
            numericValue: this.getCardValue(value),
            display: `${suit}${value}`,
            isRed
        };
        
        // 카드 표시
        const cardEl = document.querySelector('.card-slot.current .playing-card');
        cardEl.textContent = this.currentCard.display;
        cardEl.className = `playing-card ${isRed ? 'red' : 'black'}`;
        cardEl.classList.add('flip-in');
        
        // 상태 표시 업데이트
        this.updateStatusDisplay();
    },
    
    getCardValue(value) {
        if (value === 'A') return 1;
        if (value === 'J') return 11;
        if (value === 'Q') return 12;
        if (value === 'K') return 13;
        return parseInt(value);
    },
    
    // 카드 강조 표시
    showComparison(currentVal, nextVal) {
        // 두 카드 모두 크게 강조
        const currentCard = document.querySelector('.card-slot.current .playing-card');
        const nextCard = document.querySelector('.card-slot.next .playing-card');
        
        if (currentCard) currentCard.classList.add('spotlight');
        if (nextCard) nextCard.classList.add('spotlight');
        
        // 2초 후 효과 제거
        setTimeout(() => {
            if (currentCard) currentCard.classList.remove('spotlight');
            if (nextCard) nextCard.classList.remove('spotlight');
        }, 2000);
    },
    
    // 게임 상태 UI 동적 생성 (maxWins에 맞춰)
    updateGameStatusUI() {
        const winsContainer = document.querySelector('.wins-dots');
        const livesContainer = document.querySelector('.lives-dots');
        
        if (winsContainer) {
            // 승리 dot 동적 생성
            winsContainer.innerHTML = '';
            for (let i = 0; i < this.maxWins; i++) {
                const dot = document.createElement('span');
                dot.className = 'status-dot win-dot';
                winsContainer.appendChild(dot);
            }
        }
        
        if (livesContainer) {
            // 목숨 dot 동적 생성
            const livesCount = this.isAllIn ? 1 : this.maxLives;
            livesContainer.innerHTML = '';
            for (let i = 0; i < livesCount; i++) {
                const dot = document.createElement('span');
                dot.className = 'status-dot life-dot';
                dot.textContent = '💀';
                livesContainer.appendChild(dot);
            }
        }
        
        // ALL-IN 모드면 스타일 변경
        const gameStatus = document.querySelector('.game-status');
        if (gameStatus) {
            gameStatus.classList.toggle('all-in-mode', this.isAllIn);
        }
    },
    
    updateStatusDisplay() {
        // 승리 표시
        const winDots = document.querySelectorAll('.win-dot');
        winDots.forEach((dot, i) => {
            dot.classList.toggle('filled', i < this.wins);
        });
        
        // 목숨 표시
        const lifeDots = document.querySelectorAll('.life-dot');
        lifeDots.forEach((dot, i) => {
            dot.classList.toggle('lost', i >= this.lives);
        });
    },
    
    // ==========================================
    // 플레이어 선택 (HIGH / LOW)
    // ==========================================
    async makeChoice(choice) {
        // 버튼 비활성화
        document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);
        
        const dialogueText = document.querySelector('.dialogue-text');
        
        // 다음 카드 뽑기
        const nextValue = this.cardDeck[Math.floor(Math.random() * this.cardDeck.length)];
        const nextSuit = this.cardSuits[Math.floor(Math.random() * 4)];
        const nextNumeric = this.getCardValue(nextValue);
        const isRed = nextSuit === '♥️' || nextSuit === '♦️';
        
        // 다음 카드 공개 애니메이션
        const nextCardEl = document.querySelector('.card-slot.next .playing-card');
        nextCardEl.classList.add('revealing');
        await this.wait(500);
        
        nextCardEl.textContent = `${nextSuit}${nextValue}`;
        nextCardEl.className = `playing-card ${isRed ? 'red' : 'black'} revealed`;
        
        await this.wait(800);
        
        // 결과 판정
        const isHigher = nextNumeric > this.currentCard.numericValue;
        const isLower = nextNumeric < this.currentCard.numericValue;
        const isSame = nextNumeric === this.currentCard.numericValue;
        
        // 비교 결과 표시
        this.showComparison(this.currentCard.numericValue, nextNumeric);
        
        // 무승부 처리
        if (isSame) {
            await this.typeText(dialogueText, `${this.currentCard.numericValue} vs ${nextNumeric}... 무승부! 다시 해보자.`);
            await this.wait(1200);
            
            // 카드 이동 후 다시
            this.currentCard = {
                value: nextValue,
                suit: nextSuit,
                numericValue: nextNumeric,
                display: `${nextSuit}${nextValue}`,
                isRed
            };
            
            const currentCardEl = document.querySelector('.card-slot.current .playing-card');
            currentCardEl.textContent = this.currentCard.display;
            currentCardEl.className = `playing-card ${isRed ? 'red' : 'black'}`;
            
            nextCardEl.textContent = '?';
            nextCardEl.className = 'playing-card back';
            
            document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = false);
            return;
        }
        
        let correct = false;
        if (choice === 'high' && isHigher) {
            correct = true;
        } else if (choice === 'low' && isLower) {
            correct = true;
        }
        
        if (correct) {
            // 정답!
            this.wins++;
            this.updateStatusDisplay();
            
            // 효과
            nextCardEl.classList.add('correct');
            
            await this.typeText(dialogueText, this.getRandomDialogue('correct'));
            await this.wait(800);
            
            if (this.wins >= this.maxWins) {
                // 승리!
                this.winGame();
            } else {
                // 계속 진행
                await this.continueGame(nextValue, nextSuit, nextNumeric, isRed, nextCardEl);
            }
        } else {
            // 오답!
            this.lives--;
            this.updateStatusDisplay();
            
            nextCardEl.classList.add('wrong');
            
            await this.typeText(dialogueText, this.getRandomDialogue('wrong'));
            await this.wait(1000);
            
            if (this.lives <= 0) {
                // 목숨 다 소진 - 패배
                this.loseGame();
            } else {
                // 아직 목숨 남음 - 계속
                await this.typeText(dialogueText, `목숨이 ${this.lives}개 남았다... 계속할 텐가?`);
                await this.wait(500);
                await this.continueGame(nextValue, nextSuit, nextNumeric, isRed, nextCardEl);
            }
        }
    },
    
    // ==========================================
    // 계속 진행
    // ==========================================
    async continueGame(nextValue, nextSuit, nextNumeric, isRed, nextCardEl) {
        const dialogueText = document.querySelector('.dialogue-text');
        
        await this.typeText(dialogueText, this.getRandomDialogue('taunt'));
        
        // 카드 이동
        await this.wait(500);
        this.currentCard = {
            value: nextValue,
            suit: nextSuit,
            numericValue: nextNumeric,
            display: `${nextSuit}${nextValue}`,
            isRed
        };
        
        // UI 리셋
        const currentCardEl = document.querySelector('.card-slot.current .playing-card');
        currentCardEl.textContent = this.currentCard.display;
        currentCardEl.className = `playing-card ${isRed ? 'red' : 'black'}`;
        
        nextCardEl.textContent = '?';
        nextCardEl.className = 'playing-card back';
        
        // 버튼 활성화
        document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = false);
    },
    
    // ==========================================
    // 승리
    // ==========================================
    async winGame() {
        document.querySelector('.game-area').classList.add('hidden');
        
        const dialogueText = document.querySelector('.dialogue-text');
        
        if (this.isAllIn) {
            // ALL-IN 승리! 겜블러 직업 획득
            await this.typeText(dialogueText, this.getRandomDialogue('allInWin'));
            await this.wait(1500);
            
            // 겜블러 직업 언락
            this.unlockGamblerJob();
            
            await this.playOutro(true, '🎰 겜블러 직업 획득!', 'allin');
        } else {
            await this.typeText(dialogueText, this.getRandomDialogue('win'));
            
            // 보상 지급
            const resultMessage = this.selectedReward.apply();
            
            await this.wait(1500);
            
            // 아웃트로 (보상 표시) + 연출 유형 전달
            await this.playOutro(true, resultMessage, this.selectedReward.id);
        }
    },
    
    // ==========================================
    // 패배
    // ==========================================
    async loseGame() {
        document.querySelector('.game-area').classList.add('hidden');
        
        const dialogueText = document.querySelector('.dialogue-text');
        
        if (this.isAllIn) {
            // ALL-IN 패배! 사망
            await this.typeText(dialogueText, this.getRandomDialogue('allInLose'));
            await this.wait(2000);
            
            await this.playAllInDeath();
        } else {
            await this.typeText(dialogueText, this.getRandomDialogue('wrong'));
            
            // 리스크 적용
            const riskMessage = this.currentRisk.apply();
            
            await this.wait(1500);
            
            // 아웃트로 (패널티 표시)
            await this.playOutro(false, riskMessage);
        }
    },
    
    // ==========================================
    // 겜블러 직업 언락
    // ==========================================
    unlockGamblerJob() {
        // JobSystem에 겜블러 직업 언락
        if (typeof JobSystem !== 'undefined' && JobSystem.jobs && JobSystem.jobs.gambler) {
            JobSystem.jobs.gambler.unlocked = true;
            
            // localStorage에 저장
            const savedJobs = localStorage.getItem('shadowDeck_jobs');
            let jobData = savedJobs ? JSON.parse(savedJobs) : { currentJob: 'warrior', unlockedJobs: [] };
            if (!jobData.unlockedJobs) jobData.unlockedJobs = [];
            if (!jobData.unlockedJobs.includes('gambler')) {
                jobData.unlockedJobs.push('gambler');
            }
            localStorage.setItem('shadowDeck_jobs', JSON.stringify(jobData));
            
            console.log('[GamblerEvent] 겜블러 직업 언락!');
        }
        
        // 업적/플래그 저장
        localStorage.setItem('lordofnight_gambler_unlocked', 'true');
    },
    
    // ==========================================
    // ALL-IN 사망 연출
    // ==========================================
    async playAllInDeath() {
        const overlay = document.querySelector('.gambler-overlay');
        if (overlay) overlay.classList.add('fading-content');
        
        await this.wait(500);
        
        // 사망 화면
        const death = document.createElement('div');
        death.className = 'gambler-death-screen';
        death.innerHTML = `
            <div class="death-bg"></div>
            <div class="death-content">
                <div class="death-icon">💀</div>
                <div class="death-text">YOU DIED</div>
                <div class="death-sub">도박꾼의 유혹에 넘어갔다...</div>
                <div class="death-flavor">${this.getRandomDialogue('allInLose')}</div>
            </div>
        `;
        
        document.body.appendChild(death);
        requestAnimationFrame(() => death.classList.add('show'));
        
        await this.wait(3000);
        
        // 게임 오버 처리
        this.isActive = false;
        this.isAllIn = false;
        
        // 모든 UI 제거
        document.querySelectorAll('.gambler-overlay, .gambler-intro, .gambler-outro, .gambler-death-screen').forEach(el => el.remove());
        
        // 패배 처리 호출
        if (typeof handleDefeatAndReturnToTown === 'function') {
            handleDefeatAndReturnToTown();
        } else if (typeof gameState !== 'undefined') {
            gameState.player.hp = 0;
            if (typeof updateUI === 'function') updateUI();
            if (typeof showDefeatScreen === 'function') showDefeatScreen();
        }
    },
    
    // ==========================================
    // 아웃트로 (인트로와 동일한 서식)
    // ==========================================
    async playOutro(isWin = false, rewardText = '', rewardType = '') {
        // 기존 UI 페이드아웃
        const overlay = document.querySelector('.gambler-overlay');
        if (overlay) overlay.classList.add('fading-content');
        
        await this.wait(500);
        
        // 아웃트로 화면 생성
        const outro = document.createElement('div');
        outro.id = 'gambler-outro';
        outro.className = 'gambler-outro';
        
        if (isWin) {
            outro.innerHTML = `
                <div class="gambler-outro-bg win"></div>
                <div class="gambler-outro-content">
                    <div class="outro-result-icon">✨</div>
                    <div class="outro-result-text">VICTORY</div>
                    <div class="outro-reward">
                        <span class="reward-label">획득</span>
                        <span class="reward-value">${rewardText}</span>
                    </div>
                    <div class="outro-line"></div>
                    <div class="outro-flavor">${this.getRandomDialogue('outro')}</div>
                </div>
            `;
        } else {
            outro.innerHTML = `
                <div class="gambler-outro-bg lose"></div>
                <div class="gambler-outro-content">
                    <div class="outro-result-icon lose">💀</div>
                    <div class="outro-result-text lose">DEFEATED</div>
                    <div class="outro-penalty">
                        <span class="penalty-value">${rewardText}</span>
                    </div>
                    <div class="outro-line"></div>
                    <div class="outro-flavor">${this.getRandomDialogue('outro')}</div>
                </div>
            `;
        }
        
        // 승리 시 보상 유형에 따른 연출 추가
        if (isWin && rewardType) {
            setTimeout(() => {
                this.playRewardEffect(rewardType, rewardText);
            }, 800);
        }
        
        document.body.appendChild(outro);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            outro.classList.add('show');
        });
        
        await this.wait(3500);
        
        // 페이드아웃 후 종료
        outro.classList.add('fade-out');
        await this.wait(800);
        outro.remove();
        
        this.close();
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    getRandomDialogue(category) {
        const list = this.dialogues[category];
        return list[Math.floor(Math.random() * list.length)];
    },
    
    async typeText(element, text) {
        element.textContent = '';
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await this.wait(40);
        }
    },
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    startParticles() {
        const container = document.querySelector('.gambler-particles');
        if (!container) return;
        
        this.particleInterval = setInterval(() => {
            const particle = document.createElement('div');
            particle.className = 'ghost-particle';
            particle.style.left = `${Math.random() * 100}%`;
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 4000);
        }, 400);
    },
    
    // ==========================================
    // 보상 연출
    // ==========================================
    playRewardEffect(rewardType, rewardText) {
        const outroContent = document.querySelector('.gambler-outro-content');
        if (!outroContent) return;
        
        const rewardEl = outroContent.querySelector('.outro-reward');
        if (!rewardEl) return;
        
        const startRect = rewardEl.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        
        // 골드 보상
        if (rewardType === 'gold' || rewardType === 'gold_big') {
            this.playGoldToTopBarEffect(startX, startY);
        }
        // 카드 보상
        else if (rewardType === 'card_random') {
            this.playCardToDeckEffect(startX, startY);
        }
        // HP 회복
        else if (rewardType === 'heal') {
            this.playHealEffect(startX, startY);
        }
        // 카드 소각
        else if (rewardType === 'burn_card') {
            this.playBurnEffect(startX, startY);
        }
    },
    
    // 골드 → TopBar 연출
    playGoldToTopBarEffect(startX, startY) {
        const goldEl = document.getElementById('tb-gold');
        if (!goldEl) return;
        
        const endRect = goldEl.getBoundingClientRect();
        const endX = endRect.left + endRect.width / 2;
        const endY = endRect.top + endRect.height / 2;
        
        // 여러 개의 코인 생성
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'reward-fly-coin';
                coin.innerHTML = '💰';
                coin.style.cssText = `
                    position: fixed;
                    left: ${startX + (Math.random() - 0.5) * 60}px;
                    top: ${startY + (Math.random() - 0.5) * 40}px;
                    font-size: 1.5rem;
                    z-index: 9999999;
                    pointer-events: none;
                    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
                `;
                document.body.appendChild(coin);
                
                requestAnimationFrame(() => {
                    coin.style.left = `${endX}px`;
                    coin.style.top = `${endY}px`;
                    coin.style.transform = 'scale(0.5)';
                    coin.style.opacity = '0.5';
                });
                
                setTimeout(() => {
                    coin.remove();
                    // TopBar 골드 반짝임
                    if (i === 7 && goldEl) {
                        goldEl.style.animation = 'goldFlash 0.5s ease';
                        setTimeout(() => goldEl.style.animation = '', 500);
                    }
                }, 600);
            }, i * 80);
        }
    },
    
    // 카드 → 덱 연출
    playCardToDeckEffect(startX, startY) {
        const deckX = window.innerWidth - 100;
        const deckY = window.innerHeight - 80;
        
        const card = document.createElement('div');
        card.className = 'reward-fly-card';
        card.innerHTML = '🃏';
        card.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            font-size: 3rem;
            z-index: 9999999;
            pointer-events: none;
            transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.8));
        `;
        document.body.appendChild(card);
        
        requestAnimationFrame(() => {
            card.style.left = `${deckX}px`;
            card.style.top = `${deckY}px`;
            card.style.transform = 'scale(0.3) rotate(360deg)';
        });
        
        setTimeout(() => {
            card.remove();
            // 덱 도착 효과
            const deckEffect = document.createElement('div');
            deckEffect.innerHTML = `<div style="
                position: fixed;
                left: ${deckX}px;
                top: ${deckY}px;
                transform: translate(-50%, -50%);
                width: 80px;
                height: 80px;
                background: radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%);
                border-radius: 50%;
                z-index: 9999999;
                animation: deckGlowPulse 0.5s ease-out forwards;
            "></div>`;
            document.body.appendChild(deckEffect);
            setTimeout(() => deckEffect.remove(), 500);
        }, 700);
    },
    
    // HP 회복 연출
    playHealEffect(startX, startY) {
        const hpFill = document.getElementById('tb-hp-fill');
        if (!hpFill) return;
        
        const endRect = hpFill.getBoundingClientRect();
        const endX = endRect.left + endRect.width / 2;
        const endY = endRect.top + endRect.height / 2;
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.innerHTML = '❤️';
                heart.style.cssText = `
                    position: fixed;
                    left: ${startX + (Math.random() - 0.5) * 40}px;
                    top: ${startY + (Math.random() - 0.5) * 30}px;
                    font-size: 1.3rem;
                    z-index: 9999999;
                    pointer-events: none;
                    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8));
                `;
                document.body.appendChild(heart);
                
                requestAnimationFrame(() => {
                    heart.style.left = `${endX}px`;
                    heart.style.top = `${endY}px`;
                    heart.style.transform = 'scale(0.5)';
                });
                
                setTimeout(() => {
                    heart.remove();
                    if (i === 4 && hpFill) {
                        hpFill.style.animation = 'hpFlash 0.5s ease';
                        setTimeout(() => hpFill.style.animation = '', 500);
                    }
                }, 500);
            }, i * 100);
        }
    },
    
    // 카드 소각 연출
    playBurnEffect(startX, startY) {
        const burn = document.createElement('div');
        burn.innerHTML = '🔥';
        burn.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            font-size: 4rem;
            z-index: 9999999;
            pointer-events: none;
            animation: burnFlare 1s ease-out forwards;
            filter: drop-shadow(0 0 30px rgba(255, 100, 0, 0.9));
        `;
        document.body.appendChild(burn);
        
        setTimeout(() => burn.remove(), 1000);
    },
    
    // ==========================================
    // 종료
    // ==========================================
    close() {
        const overlay = document.querySelector('.gambler-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 500);
        }
        
        if (this.particleInterval) clearInterval(this.particleInterval);
        
        this.isActive = false;
        this.isAllIn = false;
        this.maxWins = 3; // 기본값 복원
        
        if (this.currentRoom) {
            this.currentRoom.cleared = true;
        }
        
        if (typeof MapSystem !== 'undefined') {
            MapSystem.showMap();
        }
    },
    
    // ==========================================
    // 스타일
    // ==========================================
    injectStyles() {
        if (document.getElementById('gambler-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'gambler-styles';
        style.textContent = `
            /* ==========================================
               도박꾼의 유령 - 다크소울 스타일
               ========================================== */
            
            /* 인트로 화면 */
            .gambler-intro {
                position: fixed;
                inset: 0;
                z-index: 8000;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #000;
                opacity: 0;
            }
            
            .gambler-intro.show {
                opacity: 1;
                transition: none;
            }
            
            .gambler-intro.fade-out {
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .gambler-intro-bg {
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at center, rgba(88, 28, 135, 0.3) 0%, transparent 50%),
                    url('gambler.png') center center / cover no-repeat;
                filter: brightness(0.4) blur(3px);
            }
            
            .gambler-intro-content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: gamblerIntroReveal 1.5s ease-out forwards;
            }
            
            @keyframes gamblerIntroReveal {
                0% { opacity: 0; transform: translateY(30px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            .gambler-intro-icon {
                font-size: 4rem;
                margin-bottom: 30px;
                animation: introIconAppear 1.5s ease-out forwards;
                filter: drop-shadow(0 0 30px rgba(168, 85, 247, 0.8));
            }
            
            @keyframes introIconAppear {
                0% { opacity: 0; transform: scale(0.3) rotate(-180deg); }
                60% { opacity: 1; transform: scale(1.2) rotate(10deg); }
                100% { opacity: 1; transform: scale(1) rotate(0deg); }
            }
            
            /* 보상 연출 애니메이션 */
            @keyframes goldFlash {
                0%, 100% { filter: none; }
                50% { filter: drop-shadow(0 0 15px rgba(255, 215, 0, 1)); transform: scale(1.2); }
            }
            
            @keyframes hpFlash {
                0%, 100% { filter: none; }
                50% { filter: drop-shadow(0 0 15px rgba(74, 222, 128, 1)); box-shadow: 0 0 20px rgba(74, 222, 128, 0.8); }
            }
            
            @keyframes deckGlowPulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
            
            @keyframes burnFlare {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 1; }
                100% { transform: scale(0.5) translateY(-50px); opacity: 0; }
            }
            
            .gambler-intro-title {
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                font-weight: 600;
                color: #c9a0e8;
                letter-spacing: 0.4em;
                text-shadow: 0 0 40px rgba(168, 85, 247, 0.5);
                margin-bottom: 15px;
            }
            
            .gambler-intro-subtitle {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #7060a0;
                letter-spacing: 0.5em;
                margin-bottom: 30px;
            }
            
            .gambler-intro-line {
                width: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.6), transparent);
                animation: gamblerIntroLine 1.5s ease-out forwards;
            }
            
            @keyframes gamblerIntroLine {
                0% { width: 0; opacity: 0; }
                100% { width: 200px; opacity: 1; }
            }
            
            .gambler-overlay {
                position: fixed;
                inset: 0;
                background: #000;
                z-index: 8000;
                opacity: 0;
                transition: opacity 0.5s ease;
                padding-top: 60px;
            }
            .gambler-overlay.visible { opacity: 1; }
            
            /* 레터박스 */
            .gambler-letterbox {
                position: absolute;
                left: 0;
                width: 100%;
                height: 5%;
                background: #000;
                z-index: 20;
            }
            .gambler-letterbox.top { top: 0; }
            .gambler-letterbox.bottom { bottom: 0; }
            
            /* 배경 */
            .gambler-bg {
                position: fixed;
                inset: 0;
                z-index: 0;
                background: url('gambler.png') center center / cover no-repeat;
            }
            .gambler-bg::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(to bottom, 
                    rgba(0, 0, 0, 0.5) 0%, 
                    rgba(0, 0, 0, 0.2) 30%,
                    rgba(0, 0, 0, 0.3) 70%,
                    rgba(0, 0, 0, 0.6) 100%
                );
            }
            
            .gambler-vignette {
                position: fixed;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 100%);
                pointer-events: none;
                z-index: 2;
            }
            
            /* 파티클 */
            .gambler-particles {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 3;
                overflow: hidden;
            }
            .ghost-particle {
                position: absolute;
                bottom: -10px;
                width: 4px;
                height: 4px;
                background: rgba(168, 85, 247, 0.6);
                border-radius: 50%;
                animation: particleFloat 4s ease-out forwards;
                box-shadow: 0 0 8px rgba(168, 85, 247, 0.4);
            }
            @keyframes particleFloat {
                to { transform: translateY(-100vh); opacity: 0; }
            }
            
            /* 컨테이너 */
            .gambler-container {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 80px 40px 60px;
                z-index: 10;
                overflow-y: auto;
            }
            
            /* 헤더 */
            .gambler-header {
                text-align: center;
                margin-bottom: 15px;
            }
            .gambler-title {
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                color: #a855f7;
                text-shadow: 0 0 40px rgba(168, 85, 247, 0.6);
                letter-spacing: 8px;
                margin: 0;
            }
            .gambler-subtitle {
                font-family: 'Noto Sans KR', sans-serif;
                color: #555;
                font-size: 0.85rem;
                margin: 5px 0 0;
            }
            
            /* 대결 구도 캐릭터 */
            .duel-character {
                position: fixed;
                bottom: 0;
                width: 350px;
                height: 85%;
                z-index: 5;
                pointer-events: none;
            }
            
            .left-char {
                left: 0;
                animation: leftCharAppear 0.8s ease-out forwards;
            }
            
            .right-char {
                right: 0;
                animation: rightCharAppear 0.8s ease-out forwards;
            }
            
            @keyframes leftCharAppear {
                0% { transform: translateX(-100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes rightCharAppear {
                0% { transform: translateX(100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            
            .duel-portrait {
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: bottom center;
                filter: drop-shadow(0 0 15px rgba(0, 0, 0, 0.8));
            }
            
            .left-char .duel-portrait {
                filter: 
                    drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))
                    drop-shadow(0 0 40px rgba(168, 85, 247, 0.3));
            }
            
            .right-char .duel-portrait {
                filter: 
                    drop-shadow(0 0 20px rgba(74, 222, 128, 0.5))
                    drop-shadow(0 0 40px rgba(74, 222, 128, 0.3));
                transform: scaleX(-1);
            }
            
            .char-glow {
                position: absolute;
                bottom: 0;
                width: 100%;
                height: 50%;
                pointer-events: none;
            }
            
            .left-glow {
                background: radial-gradient(ellipse at bottom left, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
                left: 0;
            }
            
            .right-glow {
                background: radial-gradient(ellipse at bottom right, rgba(74, 222, 128, 0.3) 0%, transparent 70%);
                right: 0;
            }
            
            /* 대화창 */
            .dialogue-area {
                margin-bottom: 20px;
                width: 100%;
                max-width: 500px;
            }
            .dialogue-box {
                background: rgba(0, 0, 0, 0.5);
                border-top: 1px solid rgba(168, 85, 247, 0.3);
                border-bottom: 1px solid rgba(168, 85, 247, 0.3);
                padding: 18px 30px;
                text-align: center;
                min-height: 24px;
            }
            .dialogue-text {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.05rem;
                color: #d4c4a8;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
                line-height: 1.6;
            }
            
            /* ==========================================
               보상 선택 - 카드 스타일
               ========================================== */
            .reward-selection {
                width: 100%;
                max-width: 550px;
            }
            .reward-selection.hidden { display: none; }
            .reward-selection.show { animation: fadeSlideIn 0.4s ease; }
            
            .selection-title {
                font-family: 'Cinzel', serif;
                font-size: 0.85rem;
                color: #666;
                text-align: center;
                letter-spacing: 5px;
                margin-bottom: 20px;
                text-transform: uppercase;
            }
            
            .reward-grid {
                display: flex;
                justify-content: center;
                gap: 20px;
            }
            
            .reward-option {
                position: relative;
                width: 140px;
                height: 190px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, rgba(25, 22, 35, 0.95) 0%, rgba(15, 12, 25, 0.98) 100%);
                border: 2px solid rgba(80, 60, 100, 0.5);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                overflow: hidden;
            }
            
            /* 빛나는 효과 */
            .reward-glow {
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            .reward-option:hover .reward-glow {
                opacity: 1;
            }
            
            .reward-option:hover {
                transform: translateY(-8px) scale(1.02);
                border-color: rgba(168, 85, 247, 0.7);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.5),
                    0 0 30px rgba(168, 85, 247, 0.2);
            }
            .reward-option.selected {
                border-color: #a855f7;
                box-shadow: 
                    0 0 0 2px rgba(168, 85, 247, 0.3),
                    0 0 40px rgba(168, 85, 247, 0.4);
                background: linear-gradient(180deg, rgba(88, 28, 135, 0.4) 0%, rgba(40, 20, 70, 0.6) 100%);
            }
            
            .reward-icon-wrap {
                width: 70px;
                height: 70px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
                border-radius: 50%;
            }
            .reward-option .reward-icon {
                font-size: 2.8rem;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
                transition: transform 0.3s ease;
            }
            .reward-option:hover .reward-icon {
                transform: scale(1.15);
            }
            
            .reward-info {
                text-align: center;
            }
            .reward-option .reward-name {
                display: block;
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                color: #d4c4a8;
                letter-spacing: 1px;
                margin-bottom: 6px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }
            .reward-option .reward-desc {
                display: block;
                font-size: 0.75rem;
                color: #888;
            }
            
            .reward-tier {
                position: absolute;
                bottom: 10px;
                font-size: 0.55rem;
                color: #555;
                letter-spacing: 3px;
            }
            
            /* 티어별 스타일 */
            .reward-option.tier-1 {
                border-color: rgba(100, 100, 100, 0.4);
            }
            .reward-option.tier-1 .reward-tier { color: #666; }
            
            .reward-option.tier-2 {
                border-color: rgba(96, 165, 250, 0.4);
            }
            .reward-option.tier-2 .reward-glow {
                background: radial-gradient(circle at center, rgba(96, 165, 250, 0.15) 0%, transparent 50%);
            }
            .reward-option.tier-2:hover {
                border-color: rgba(96, 165, 250, 0.8);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.5),
                    0 0 30px rgba(96, 165, 250, 0.25);
            }
            .reward-option.tier-2 .reward-name { color: #93c5fd; }
            .reward-option.tier-2 .reward-tier { color: #60a5fa; }
            
            .reward-option.tier-3 {
                border-color: rgba(251, 191, 36, 0.4);
            }
            .reward-option.tier-3 .reward-glow {
                background: radial-gradient(circle at center, rgba(251, 191, 36, 0.15) 0%, transparent 50%);
            }
            .reward-option.tier-3:hover {
                border-color: rgba(251, 191, 36, 0.8);
                box-shadow: 
                    0 15px 40px rgba(0, 0, 0, 0.5),
                    0 0 35px rgba(251, 191, 36, 0.3);
            }
            .reward-option.tier-3 .reward-name {
                color: #fcd34d;
                text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
            }
            .reward-option.tier-3 .reward-tier { color: #fbbf24; }
            
            /* ==========================================
               리스크 표시 (극적 VS 연출)
               ========================================== */
            .risk-display {
                width: 100%;
                max-width: 700px;
                padding: 20px;
            }
            .risk-display.hidden { display: none; }
            .risk-display.show { animation: riskAppear 0.6s ease; }
            
            @keyframes riskAppear {
                0% { opacity: 0; transform: scale(0.8); }
                50% { transform: scale(1.02); }
                100% { opacity: 1; transform: scale(1); }
            }
            
            .stakes-container {
                display: flex;
                align-items: stretch;
                justify-content: center;
                gap: 30px;
                margin-bottom: 25px;
                position: relative;
            }
            
            .stake-box {
                flex: 1;
                max-width: 250px;
                padding: 30px 25px;
                background: rgba(10, 10, 15, 0.95);
                border-radius: 16px;
                text-align: center;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .stake-box::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
            }
            
            .stake-box.reward-stake {
                border: 2px solid rgba(74, 222, 128, 0.5);
                box-shadow: 
                    0 0 30px rgba(74, 222, 128, 0.2),
                    inset 0 0 40px rgba(74, 222, 128, 0.05);
                animation: rewardPulse 2s ease-in-out infinite;
            }
            
            .stake-box.reward-stake::before {
                background: linear-gradient(90deg, transparent, #4ade80, transparent);
            }
            
            .stake-box.risk-stake {
                border: 2px solid rgba(239, 68, 68, 0.5);
                box-shadow: 
                    0 0 30px rgba(239, 68, 68, 0.2),
                    inset 0 0 40px rgba(239, 68, 68, 0.05);
                animation: riskPulse 2s ease-in-out infinite;
            }
            
            .stake-box.risk-stake::before {
                background: linear-gradient(90deg, transparent, #ef4444, transparent);
            }
            
            @keyframes rewardPulse {
                0%, 100% { box-shadow: 0 0 30px rgba(74, 222, 128, 0.2), inset 0 0 40px rgba(74, 222, 128, 0.05); }
                50% { box-shadow: 0 0 50px rgba(74, 222, 128, 0.4), inset 0 0 60px rgba(74, 222, 128, 0.1); }
            }
            
            @keyframes riskPulse {
                0%, 100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.2), inset 0 0 40px rgba(239, 68, 68, 0.05); }
                50% { box-shadow: 0 0 50px rgba(239, 68, 68, 0.4), inset 0 0 60px rgba(239, 68, 68, 0.1); }
            }
            
            .stake-label {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                font-weight: 600;
                letter-spacing: 2px;
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .stake-box.reward-stake .stake-label {
                color: #4ade80;
                text-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
            }
            
            .stake-box.risk-stake .stake-label {
                color: #ef4444;
                text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
            }
            
            .stake-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            
            .stake-icon { 
                font-size: 3rem;
                filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.3));
                animation: iconFloat 3s ease-in-out infinite;
            }
            
            @keyframes iconFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            
            .stake-text {
                font-size: 1.1rem;
                font-weight: 600;
                color: #fff;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            }
            
            .vs-text {
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                font-weight: 700;
                color: #a855f7;
                text-shadow: 
                    0 0 20px rgba(168, 85, 247, 0.8),
                    0 0 40px rgba(168, 85, 247, 0.5);
                animation: vsPulse 1.5s ease-in-out infinite;
                align-self: center;
            }
            
            @keyframes vsPulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 1; }
            }
            
            .game-rule {
                text-align: center;
                padding: 18px 25px;
                background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
                border-radius: 12px;
                border: 1px solid rgba(168, 85, 247, 0.3);
                box-shadow: 0 0 20px rgba(168, 85, 247, 0.1);
            }
            
            .rule-icon { 
                margin-right: 10px;
                font-size: 1.2rem;
            }
            
            .rule-text {
                font-size: 1rem;
                color: #c4b5fd;
                font-weight: 500;
                letter-spacing: 1px;
            }
            
            /* ==========================================
               게임 영역
               ========================================== */
            .game-area {
                width: 100%;
                max-width: 400px;
            }
            .game-area.hidden { display: none; }
            
            /* 게임 상태 표시 */
            .game-status {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin-bottom: 25px;
                padding: 12px 25px;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 8px;
                border: 1px solid rgba(100, 80, 120, 0.3);
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .status-label {
                font-size: 0.75rem;
                color: #666;
                letter-spacing: 2px;
            }
            .status-dots {
                display: flex;
                gap: 8px;
            }
            .status-divider {
                color: #333;
                font-size: 1.2rem;
            }
            
            /* 승리 점 */
            .win-dot {
                width: 18px;
                height: 18px;
                border: 2px solid rgba(74, 222, 128, 0.4);
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            .win-dot.filled {
                background: #4ade80;
                border-color: #4ade80;
                box-shadow: 0 0 12px rgba(74, 222, 128, 0.6);
            }
            
            /* 목숨 */
            .life-dot {
                font-size: 1.2rem;
                transition: all 0.3s ease;
                filter: grayscale(0) brightness(1);
            }
            .life-dot.lost {
                filter: grayscale(1) brightness(0.3);
                opacity: 0.4;
            }
            
            /* 카드 표시 */
            .cards-display {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin-bottom: 30px;
                position: relative;
            }
            
            .card-slot {
                perspective: 600px;
            }
            
            .playing-card {
                width: 90px;
                height: 130px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                font-weight: bold;
                background: linear-gradient(145deg, #f5f5f0, #e8e8e0);
                border-radius: 10px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.5);
                transition: transform 0.4s ease;
            }
            .playing-card.red { color: #dc2626; }
            .playing-card.black { color: #1f2937; }
            
            .playing-card.back {
                background: linear-gradient(145deg, #2d1f4e, #1a1230);
                color: #a855f7;
                font-size: 2.5rem;
                border: 2px solid rgba(168, 85, 247, 0.3);
            }
            
            .playing-card.flip-in {
                animation: cardFlipIn 0.5s ease;
            }
            .playing-card.revealing {
                animation: cardReveal 0.5s ease forwards;
            }
            .playing-card.correct {
                box-shadow: 0 0 30px rgba(74, 222, 128, 0.6);
                border: 2px solid #4ade80;
            }
            .playing-card.wrong {
                box-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
                border: 2px solid #ef4444;
            }
            
            /* 카드 스포트라이트 */
            .playing-card.spotlight {
                transform: scale(1.15);
                box-shadow: 0 0 40px rgba(255, 255, 255, 0.4);
                z-index: 10;
            }
            
            @keyframes cardFlipIn {
                0% { transform: rotateY(90deg); }
                100% { transform: rotateY(0deg); }
            }
            @keyframes cardReveal {
                0% { transform: rotateY(180deg); }
                100% { transform: rotateY(0deg); }
            }
            
            /* 선택 버튼 */
            .choice-buttons {
                display: flex;
                justify-content: center;
                gap: 20px;
            }
            
            .choice-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px 35px;
                background: rgba(20, 18, 30, 0.9);
                border: 2px solid rgba(100, 80, 120, 0.4);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.25s ease;
            }
            .choice-btn:hover:not(:disabled) {
                transform: translateY(-3px);
            }
            .choice-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .choice-btn.high:hover:not(:disabled) {
                border-color: #4ade80;
                box-shadow: 0 8px 25px rgba(74, 222, 128, 0.3);
            }
            .choice-btn.low:hover:not(:disabled) {
                border-color: #f87171;
                box-shadow: 0 8px 25px rgba(248, 113, 113, 0.3);
            }
            
            .btn-icon { font-size: 1.8rem; margin-bottom: 8px; }
            .btn-label {
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                color: #c9b896;
                letter-spacing: 3px;
            }
            .btn-desc {
                font-size: 0.75rem;
                color: #666;
                margin-top: 4px;
            }
            
            .choice-btn.high:hover .btn-label { color: #4ade80; }
            .choice-btn.low:hover .btn-label { color: #f87171; }
            
            /* ==========================================
               결과 영역
               ========================================== */
            .result-area {
                text-align: center;
            }
            .result-area.hidden { display: none; }
            .result-area.show { animation: resultPop 0.5s ease; }
            
            @keyframes resultPop {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .result-icon {
                font-size: 4rem;
                margin-bottom: 15px;
            }
            .result-icon.win {
                animation: winGlow 1s ease-in-out infinite alternate;
            }
            .result-icon.lose {
                animation: loseShake 0.5s ease;
            }
            
            @keyframes winGlow {
                from { filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.4)); }
                to { filter: drop-shadow(0 0 40px rgba(251, 191, 36, 0.8)); }
            }
            @keyframes loseShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            .result-text {
                font-family: 'Cinzel', serif;
                font-size: 2.2rem;
                letter-spacing: 8px;
                margin-bottom: 15px;
            }
            .result-text.win {
                color: #fbbf24;
                text-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
            }
            .result-text.lose {
                color: #ef4444;
                text-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
            }
            
            .result-detail {
                font-size: 1.1rem;
            }
            .result-detail.reward { color: #4ade80; }
            .result-detail.risk { color: #f87171; }
            
            /* ==========================================
               버튼
               ========================================== */
            .action-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 20px;
            }
            .action-buttons.hidden { display: none; }
            
            .action-btn {
                padding: 18px 60px;
                background: rgba(20, 18, 30, 0.95);
                border: 2px solid rgba(100, 80, 120, 0.5);
                border-radius: 8px;
                font-family: 'Cinzel', serif;
                font-size: 1.15rem;
                letter-spacing: 4px;
                cursor: pointer;
                transition: all 0.25s ease;
                position: relative;
            }
            
            .action-btn.accept {
                color: #4ade80;
                border-color: rgba(74, 222, 128, 0.5);
                text-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
            }
            .action-btn.accept:hover {
                background: rgba(74, 222, 128, 0.15);
                border-color: #4ade80;
                box-shadow: 0 0 25px rgba(74, 222, 128, 0.3);
                transform: translateY(-2px);
            }
            
            .action-btn.decline {
                color: #a89080;
                border-color: rgba(120, 100, 90, 0.4);
            }
            .action-btn.decline:hover {
                background: rgba(100, 80, 70, 0.2);
                border-color: #a89080;
                color: #c9b8a0;
            }
            
            /* ALL-IN 버튼 */
            .action-btn.all-in {
                color: #ff4444;
                border-color: rgba(255, 68, 68, 0.6);
                background: linear-gradient(180deg, rgba(255, 0, 0, 0.1) 0%, rgba(139, 0, 0, 0.2) 100%);
                font-weight: bold;
                text-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
                animation: allInPulse 1.5s ease-in-out infinite;
            }
            .action-btn.all-in:hover {
                background: linear-gradient(180deg, rgba(255, 0, 0, 0.3) 0%, rgba(139, 0, 0, 0.4) 100%);
                border-color: #ff4444;
                box-shadow: 0 0 30px rgba(255, 68, 68, 0.5), inset 0 0 20px rgba(255, 0, 0, 0.2);
                color: #ff6666;
                transform: translateY(-2px) scale(1.02);
            }
            @keyframes allInPulse {
                0%, 100% { box-shadow: 0 0 10px rgba(255, 68, 68, 0.3); }
                50% { box-shadow: 0 0 25px rgba(255, 68, 68, 0.6); }
            }
            
            /* ALL-IN 모드 표시 */
            .risk-display.all-in-mode .stake-box {
                animation: allInStakeGlow 0.5s ease infinite alternate;
            }
            .risk-display.all-in-mode .reward-stake {
                border-color: #ffd700 !important;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.5) !important;
            }
            .risk-display.all-in-mode .risk-stake {
                border-color: #ff0000 !important;
                box-shadow: 0 0 30px rgba(255, 0, 0, 0.5) !important;
            }
            @keyframes allInStakeGlow {
                0% { transform: scale(1); }
                100% { transform: scale(1.02); }
            }
            
            /* ALL-IN 게임 상태 */
            .game-status.all-in-mode {
                background: linear-gradient(180deg, rgba(139, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%) !important;
                border-color: #8b0000 !important;
                box-shadow: 0 0 20px rgba(139, 0, 0, 0.4);
            }
            .game-status.all-in-mode .status-label {
                color: #ff6666;
            }
            .game-status.all-in-mode::before {
                content: '🎲 ALL-IN 🎲';
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.8rem;
                color: #ff4444;
                text-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
                animation: allInLabel 1s ease infinite;
            }
            @keyframes allInLabel {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            /* 사망 화면 */
            .gambler-death-screen {
                position: fixed;
                inset: 0;
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            .gambler-death-screen.show {
                opacity: 1;
            }
            .death-bg {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, #1a0000 0%, #000 70%);
            }
            .death-content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: deathReveal 1s ease-out forwards;
            }
            @keyframes deathReveal {
                0% { opacity: 0; transform: scale(0.8); }
                100% { opacity: 1; transform: scale(1); }
            }
            .death-icon {
                font-size: 6rem;
                margin-bottom: 20px;
                animation: deathIconPulse 1s ease infinite;
            }
            @keyframes deathIconPulse {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px #ff0000); }
                50% { transform: scale(1.1); filter: drop-shadow(0 0 40px #ff0000); }
            }
            .death-text {
                font-family: 'Cinzel', serif;
                font-size: 4rem;
                color: #8b0000;
                text-shadow: 0 0 30px rgba(139, 0, 0, 0.8);
                letter-spacing: 15px;
                margin-bottom: 20px;
            }
            .death-sub {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.2rem;
                color: #666;
                margin-bottom: 30px;
            }
            .death-flavor {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1rem;
                color: #444;
                font-style: italic;
            }
            
            /* 컨텐츠 페이드 */
            .gambler-overlay.fading-content .gambler-container {
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            /* 아웃트로 화면 (인트로와 동일 서식) */
            .gambler-outro {
                position: fixed;
                inset: 0;
                z-index: 8000;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #000;
                opacity: 0;
            }
            
            .gambler-outro.show {
                opacity: 1;
                transition: opacity 0.5s ease;
            }
            
            .gambler-outro.fade-out {
                opacity: 0;
                transition: opacity 0.8s ease;
            }
            
            .gambler-outro-bg {
                position: absolute;
                inset: 0;
                background: url('gambler.png') center center / cover no-repeat;
                filter: brightness(0.3) blur(5px);
            }
            .gambler-outro-bg.win {
                filter: brightness(0.4) blur(3px) saturate(1.2);
            }
            .gambler-outro-bg.lose {
                filter: brightness(0.2) blur(5px) saturate(0.5);
            }
            
            .gambler-outro-content {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                animation: outroReveal 0.8s ease-out forwards;
            }
            
            @keyframes outroReveal {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            
            /* 결과 아이콘 */
            .outro-result-icon {
                font-size: 4rem;
                margin-bottom: 20px;
                animation: outroIconPulse 1.5s ease-in-out infinite;
            }
            .outro-result-icon.lose {
                animation: outroIconShake 0.5s ease;
            }
            
            @keyframes outroIconPulse {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5)); }
                50% { transform: scale(1.1); filter: drop-shadow(0 0 40px rgba(255, 215, 0, 0.8)); }
            }
            
            @keyframes outroIconShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            
            /* 결과 텍스트 */
            .outro-result-text {
                font-family: 'Cinzel', serif;
                font-size: 3rem;
                font-weight: 700;
                color: #ffd700;
                letter-spacing: 0.5em;
                text-shadow: 0 0 50px rgba(255, 215, 0, 0.6);
                margin-bottom: 25px;
            }
            .outro-result-text.lose {
                color: #dc2626;
                text-shadow: 0 0 30px rgba(220, 38, 38, 0.5);
            }
            
            /* 보상 표시 */
            .outro-reward {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 20px 50px;
                background: rgba(255, 215, 0, 0.1);
                border: 2px solid rgba(255, 215, 0, 0.4);
                border-radius: 10px;
                margin-bottom: 25px;
                animation: rewardGlow 1.5s ease-in-out infinite alternate;
            }
            
            @keyframes rewardGlow {
                from { box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
                to { box-shadow: 0 0 40px rgba(255, 215, 0, 0.5); }
            }
            
            .reward-label {
                font-size: 0.85rem;
                color: #aaa;
                letter-spacing: 3px;
            }
            .reward-value {
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                color: #4ade80;
                text-shadow: 0 0 15px rgba(74, 222, 128, 0.5);
            }
            
            /* 패널티 표시 */
            .outro-penalty {
                padding: 15px 40px;
                margin-bottom: 25px;
            }
            .penalty-value {
                font-family: 'Cinzel', serif;
                font-size: 1.3rem;
                color: #f87171;
                text-shadow: 0 0 15px rgba(248, 113, 113, 0.5);
            }
            
            /* 구분선 */
            .outro-line {
                width: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent);
                margin-bottom: 25px;
                animation: outroLine 1s ease-out 0.3s forwards;
            }
            
            @keyframes outroLine {
                to { width: 200px; }
            }
            
            /* 플레이버 텍스트 */
            .outro-flavor {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1rem;
                color: #888;
                font-style: italic;
                text-shadow: 0 2px 5px rgba(0, 0, 0, 0.8);
            }
            
            .outro-flavor-only {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.2rem;
                color: #a89080;
                font-style: italic;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
                letter-spacing: 2px;
            }
            
            /* ==========================================
               애니메이션 & 유틸
               ========================================== */
            @keyframes fadeSlideIn {
                from { opacity: 0; transform: translateY(15px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .hidden { display: none !important; }
            
            /* 반응형 */
            @media (max-width: 600px) {
                .gambler-intro-title { font-size: 1.8rem; letter-spacing: 0.2em; }
                .gambler-intro-subtitle { font-size: 0.8rem; letter-spacing: 0.3em; }
                .gambler-intro-icon { font-size: 3rem; }
                .stakes-container { flex-direction: column; gap: 20px; }
                .stake-box { max-width: 100%; width: 200px; }
                .vs-text { font-size: 1.5rem; }
                .duel-character { width: 180px; height: 55%; }
                .duel-character.left-char { left: -20px; }
                .duel-character.right-char { right: -20px; }
                
                .gambler-container { padding: 60px 15px 40px; }
                .gambler-title { font-size: 1.4rem; letter-spacing: 4px; }
                .reward-grid { gap: 12px; }
                .reward-option { 
                    width: 100px; 
                    height: 145px;
                }
                .reward-icon-wrap { width: 50px; height: 50px; margin-bottom: 8px; }
                .reward-option .reward-icon { font-size: 2rem; }
                .reward-option .reward-name { font-size: 0.75rem; }
                .reward-option .reward-desc { font-size: 0.65rem; }
                .playing-card { width: 70px; height: 100px; font-size: 1.5rem; }
                .cards-display { gap: 20px; }
                .choice-btn { padding: 15px 25px; }
                .stakes-container { flex-direction: column; gap: 15px; }
                .stake-box { max-width: 100%; width: 150px; }
                .vs-text { display: none; }
            }
            
            @media (max-width: 400px) {
                .reward-option { 
                    width: 90px; 
                    height: 130px;
                }
                .reward-icon-wrap { width: 45px; height: 45px; }
                .reward-option .reward-icon { font-size: 1.8rem; }
            }
        `;
        document.head.appendChild(style);
    }
};

// 전역
window.GamblerEvent = GamblerEvent;

// 초기화
document.addEventListener('DOMContentLoaded', () => GamblerEvent.init());

// EventSystem 등록
if (typeof EventSystem !== 'undefined') {
    EventSystem.register('gambler', {
        id: 'gambler',
        name: '도박꾼의 유령',
        description: '운명을 시험하는 도박을 제안한다.',
        icon: '👻',
        weight: 100,  // 점성술사와 동일한 확률
        isFullscreen: true,
        condition: () => true,
        execute: (room) => GamblerEvent.start(room)
    });
    console.log('[GamblerEvent] EventSystem에 등록 완료!');
} else {
    console.error('[GamblerEvent] EventSystem이 없어서 등록 실패!');
}

console.log('[GamblerEvent] 로드 완료');
