// ==========================================
// Shadow Deck - 게임 로직
// ==========================================

// ==========================================
// 🛡️ 인텐트 안전 체크 시스템
// ==========================================
let intentSafetyCheckInterval = null;

function startIntentSafetyCheck() {
    // 이미 실행 중이면 중복 방지
    if (intentSafetyCheckInterval) return;
    
    console.log('[IntentSafety] 🛡️ 안전 체크 시스템 시작');
    
    intentSafetyCheckInterval = setInterval(() => {
        if (!gameState || !gameState.enemies) return;
        if (gameState.intentsHidden) return; // 인텐트가 숨김 상태면 체크 안함
        
        gameState.enemies.forEach((enemy, index) => {
            if (enemy.hp <= 0 || enemy.isBroken) return; // 죽은 적이나 브레이크 상태는 건너뛰기
            
            const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
            if (!enemyEl) return;
            
            const intentEl = enemyEl.querySelector('.enemy-intent-display');
            if (!intentEl) return;
            
            // 인텐트가 비어있거나 숨겨져 있으면 강제 복구
            const isHidden = intentEl.style.display === 'none' || 
                             intentEl.style.visibility === 'hidden' ||
                             intentEl.style.opacity === '0';
            const isEmpty = !intentEl.innerHTML || intentEl.innerHTML.trim() === '';
            
            if ((isHidden || isEmpty) && enemy.intent) {
                console.log(`[IntentSafety] ⚠️ ${enemy.name} 인텐트 복구! (${enemy.intent} ${enemy.intentValue})`);
                
                // 스타일 복구
                intentEl.style.display = '';
                intentEl.style.visibility = 'visible';
                intentEl.style.opacity = '1';
                intentEl.classList.remove('is-broken', 'intent-hidden');
                
                // 내용 채우기
                if (isEmpty && typeof getIntentIcon === 'function') {
                    intentEl.innerHTML = getIntentIcon(
                        enemy.intent, 
                        enemy.intentValue, 
                        enemy.intentHits || 1,
                        enemy.intentBleed || 0,
                        enemy.intentName,
                        enemy.intentIcon
                    );
                }
            }
        });
    }, 500); // 500ms마다 체크
}

function stopIntentSafetyCheck() {
    if (intentSafetyCheckInterval) {
        clearInterval(intentSafetyCheckInterval);
        intentSafetyCheckInterval = null;
        console.log('[IntentSafety] 🛑 안전 체크 시스템 중지');
    }
}

// ==========================================
// 플레이어 초기화
// ==========================================
function initializePlayer() {
    const stats = PlayerBaseStats.getFinalStats();
    
    gameState.player = {
        name: "용사",
        maxHp: stats.maxHp,
        hp: stats.maxHp,
        block: stats.startBlock,
        energy: stats.startEnergy,
        maxEnergy: stats.maxEnergy,
        blind: 0,
        vulnerable: 0,
        taunt: 0  // 도발: 방어도 생성량 감소
    };
    
    console.log('[Game] 플레이어 초기화:', gameState.player);
}

// 게임 상태
const gameState = {
    player: null, // initializePlayer()에서 초기화됨
    // 턴 내 카드 사용 추적
    turnStats: {
        attackCardsPlayed: 0,
        skillCardsPlayed: 0,
        totalCardsPlayed: 0
    },
    enemy: null, // 현재 타겟 적 (하위 호환성)
    enemies: [], // 다중 적 배열
    selectedEnemyIndex: 0, // 선택된 적 인덱스
    deck: [],
    hand: [],
    drawPile: [],
    discardPile: [],
    turn: 1,
    isPlayerTurn: true,
    isPlayingCard: false, // 카드 플레이 중 플래그 (중복 클릭 방지)
    battleCount: 1,
    victoryProcessing: false // 승리 처리 중복 방지 플래그
};

// 적 데이터베이스
// 몬스터 데이터는 monster.js에서 관리

// DOM 요소
const elements = {
    playerHpBar: document.getElementById('player-hp-bar'),
    playerHpText: document.getElementById('player-hp-text'),
    playerBlock: document.getElementById('player-block'),
    playerBlockContainer: document.getElementById('player-block-container'),
    enemyHpBar: document.getElementById('enemy-hp-bar'),
    enemyHpText: document.getElementById('enemy-hp-text'),
    enemyBlock: document.getElementById('enemy-block'),
    enemyBlockContainer: document.getElementById('enemy-block-container'),
    enemyIntent: document.getElementById('enemy-intent'),
    intentIcon: document.getElementById('intent-icon'),
    intentValue: document.getElementById('intent-value'),
    enemyName: document.getElementById('enemy-name'),
    enemySprite: document.getElementById('enemy-sprite'),
    energyText: document.getElementById('energy-text'),
    hand: document.getElementById('hand'),
    drawCount: document.getElementById('draw-count'),
    discardCount: document.getElementById('discard-count'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    logEntries: document.getElementById('log-entries'),
    modal: document.getElementById('game-modal'),
    modalIcon: document.getElementById('modal-icon'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalBtn: document.getElementById('modal-btn'),
    rewardSection: document.getElementById('reward-section'),
    rewardCard: document.getElementById('reward-card'),
    player: document.getElementById('player'),
    enemy: document.getElementById('enemy'),
    battleNum: document.getElementById('battle-num'),
    turnText: document.getElementById('turn-text')
};

// ==========================================
// 게임 초기화
// ==========================================
function initGame() {
    // 플레이어 스탯 초기화 (PlayerBaseStats에서 가져옴)
    initializePlayer();
    
    // 덱 구성 - 저장된 강화 덱이 있으면 사용, 없으면 기본 덱
    gameState.deck = loadPlayerDeck();
    gameState.fullDeck = [...gameState.deck]; // 전체 덱 백업
    gameState.gold = 0;
    
    // 유물 시스템 초기화 및 시작 유물 획득
    if (typeof RelicSystem !== 'undefined') {
        RelicSystem.init();
        
        // 유물 UI 초기화
        if (typeof RelicUI !== 'undefined') {
            RelicUI.init();
        }
        
        // 스타터 유물 지급
        if (typeof grantStarterRelics === 'function') {
            grantStarterRelics();
        }
        
        // 스타터 조력자 지급
        if (typeof grantStarterAlly === 'function') {
            grantStarterAlly();
        }
    }
    
    // 테스트 모드일 경우 자동 전투 시작 안함
    if (window.testMode) {
        console.log('[Game] Test mode - waiting for manual battle start');
        return;
    }
    
    // 타이틀 시스템이 있으면 타이틀에서 시작, 없으면 맵으로 바로 시작
    if (typeof TitleSystem !== 'undefined') {
        // 타이틀 시스템이 맵 시작을 처리함
        console.log('[Game] 타이틀 시스템 감지 - 타이틀에서 시작');
    } else if (typeof MapSystem !== 'undefined') {
        MapSystem.startGame();
    } else {
        // 맵 시스템 없으면 바로 전투
        startBattle();
    }
}

// ==========================================
// 플레이어 덱 로드 (강화된 카드 포함)
// ==========================================
function loadPlayerDeck() {
    // 저장된 덱이 있으면 로드
    const savedDeck = localStorage.getItem('lordofnight_player_deck');
    if (savedDeck) {
        try {
            const parsed = JSON.parse(savedDeck);
            if (parsed && parsed.length > 0) {
                console.log('[Game] 저장된 덱 로드 시도:', parsed);
                
                // 저장된 덱의 카드 ID로 카드 객체 재생성
                const loadedDeck = parsed.map(card => {
                    // 카드 객체인 경우 ID 추출
                    const cardId = typeof card === 'string' ? card : card.id;
                    const createdCard = createCard(cardId);
                    
                    if (!createdCard) {
                        console.warn(`[Game] 카드 생성 실패: ${cardId}`);
                    } else {
                        console.log(`[Game] 카드 로드: ${cardId} -> ${createdCard.name}`);
                    }
                    
                    return createdCard;
                }).filter(card => card !== null);
                
                console.log('[Game] 덱 로드 완료:', loadedDeck.length + '장');
                return loadedDeck;
            }
        } catch (e) {
            console.warn('[Game] 저장된 덱 파싱 실패:', e);
        }
    }
    
    // 기본 덱 사용
    console.log('[Game] 기본 덱 사용, starterDeck 길이:', starterDeck ? starterDeck.length : 0);
    
    if (!starterDeck || starterDeck.length === 0) {
        console.error('[Game] starterDeck이 비어있음!');
        return [];
    }
    
    const deck = starterDeck.map(item => {
        // 이미 카드 객체인 경우 (starter-deck.js에서 생성된 경우)
        if (typeof item === 'object' && item !== null && item.id) {
            return { ...item, instanceId: Date.now() + Math.random() };
        }
        // 카드 ID인 경우
        const card = createCard(item);
        if (!card) {
            console.error(`[Game] 카드 생성 실패: ${item}`);
        }
        return card;
    }).filter(card => card !== null);
    
    console.log('[Game] 생성된 덱:', deck.length, '장');
    return deck;
}

// ==========================================
// 전투 시작
// ==========================================
function startBattle() {
    // 🎬 전투 시작 트랜지션
    if (typeof ScreenTransition !== 'undefined') {
        ScreenTransition.battleEnter();
    }
    
    // 🛡️ 인텐트 안전 체크 시스템 시작
    startIntentSafetyCheck();
    
    // 🎵 전투 BGM 시작
    if (typeof BGMSystem !== 'undefined') {
        BGMSystem.play('battle');
    }
    
    // 📚 튜토리얼 시작 (첫 전투에서만)
    if (typeof Tutorial !== 'undefined' && !Tutorial.completed) {
        setTimeout(() => Tutorial.start(), 1000);
    }
    
    // 🎬 핸드헬드 카메라 효과 시작
    if (typeof CameraEffects !== 'undefined') {
        CameraEffects.onBattleStart();
    }
    
    // 🎰 GamblerVFX 사전 초기화 (첫 카드 지연 방지)
    if (typeof GamblerVFX !== 'undefined' && GamblerVFX.ensureInit) {
        GamblerVFX.ensureInit();
    }
    
    // 🌫️ 필드 시스템 초기화
    if (typeof FieldSystem !== 'undefined') {
        FieldSystem.onBattleStart();
    }
    
    // 게임 화면 다시 표시 (이벤트에서 숨겨졌을 수 있음)
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.style.visibility = 'visible';
    }
    
    // 기타 UI들도 복원
    const incantationUI = document.querySelector('.incantation-container');
    if (incantationUI) incantationUI.style.visibility = 'visible';
    
    const turnDisplay = document.querySelector('.turn-display');
    if (turnDisplay) turnDisplay.style.visibility = 'visible';
    
    document.querySelectorAll('.energy-display, .deck-count, .discard-count').forEach(el => {
        if (el) el.style.visibility = 'visible';
    });
    
    // TopBar 표시 및 업데이트
    if (typeof TopBar !== 'undefined') {
        TopBar.show();
        document.body.classList.add('has-topbar');
    }
    
    // 이전 전투의 적 컨테이너 완전히 제거
    const existingContainer = document.getElementById('enemies-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // 이전 잡힌 NPC 제거
    const capturedNpc = document.getElementById('captured-npc');
    if (capturedNpc) capturedNpc.remove();
    
    // 덱이 비어있으면 다시 로드 (던전 재입장 시)
    if (!gameState.deck || gameState.deck.length === 0) {
        console.log('[Game] 덱이 비어있어 다시 로드합니다');
        gameState.deck = loadPlayerDeck();
        gameState.fullDeck = [...gameState.deck];
    }
    
    // 플레이어 상태 리셋 (HP는 유지, 방어도는 0으로)
    gameState.player.block = 0;
    gameState.player.energy = gameState.player.maxEnergy;
    
    // 타로 카드 보너스 에너지 적용 (전차 카드)
    if (gameState.nextBattleBuffs && gameState.nextBattleBuffs.bonusEnergy) {
        gameState.player.energy += gameState.nextBattleBuffs.bonusEnergy;
        addLog(`Bonus Energy +${gameState.nextBattleBuffs.bonusEnergy}!`, 'buff');
        gameState.nextBattleBuffs.bonusEnergy = 0; // 사용 후 초기화
    }
    
    gameState.player.blind = 0; // 실명 초기화
    gameState.player.vulnerable = 0; // 취약 초기화
    gameState.player.taunt = 0; // 도발 초기화
    gameState.victoryProcessing = false; // 승리 처리 플래그 리셋
    gameState.lastPlayedCard = null; // 직전 카드 초기화 (시간 왜곡용)
    
    // 상태 인디케이터 제거
    const blindIndicator = document.getElementById('blind-indicator');
    if (blindIndicator) blindIndicator.remove();
    const vulnerableIndicator = document.getElementById('player-vulnerable-indicator');
    if (vulnerableIndicator) vulnerableIndicator.remove();
    
    // 🔧 플레이어 필터/스타일 안전 리셋
    const playerEl = document.getElementById('player');
    if (playerEl) {
        playerEl.style.filter = '';
        playerEl.style.transition = '';
        const playerSprite = playerEl.querySelector('.player-sprite-img, img');
        if (playerSprite) {
            playerSprite.style.filter = '';
            playerSprite.style.transition = '';
        }
    }
    
    // 유물 시스템에 전투 시작 알림
    if (typeof RelicSystem !== 'undefined') {
        RelicSystem.onBattleStart();
        
        // 전투 시작 유물 효과 발동
        RelicSystem.ownedRelics.forEach(relic => {
            if (relic.onBattleStart) {
                relic.onBattleStart(gameState);
            }
        });
    }
    
    // 조력자 시스템 초기화 (조력자가 있으면)
    if (typeof AllySystem !== 'undefined') {
        AllySystem.costSpent = 0;
        if (AllySystem.currentAlly) {
            AllySystem.updateAllyUI();
        }
    }
    
    // ⚡ 에너지 볼트 시스템 초기화
    if (typeof EnergyBoltSystem !== 'undefined') {
        EnergyBoltSystem.init();
    }
    
    // 🩸 오버킬 시스템 초기화
    if (typeof OverkillSystem !== 'undefined') {
        OverkillSystem.onBattleStart();
    }
    
    // 🌑 도적 은신 시스템 활성화
    if (typeof StealthSystem !== 'undefined') {
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob === 'rogue') {
            StealthSystem.activate();
        }
    }
    
    // 🔮 영창 시스템 초기화 (마법사 직업일 때)
    if (typeof IncantationSystem !== 'undefined') {
        IncantationSystem.init();
        // 마법사 직업이면 활성화
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob === 'mage') {
            IncantationSystem.activate();
        }
    }
    
    // 🎰 칩 시스템 초기화 (겜블러)
    if (typeof ChipSystem !== 'undefined') {
        // 겜블러 직업이면 활성화
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob === 'gambler') {
            ChipSystem.activate();
        }
    }
    
    // 👤 분신 시스템 초기화
    if (typeof ShadowCloneSystem !== 'undefined') {
        ShadowCloneSystem.init();
    }
    
    // 적 설정 - 맵에서 할당된 몬스터 우선, 없으면 기존 로직 사용
    let hpBonus = Math.floor((gameState.battleCount - 1) / 5) * 10;
    
    // 다중 적 배열 초기화 (이전 적 데이터 완전히 초기화)
    gameState.enemies = [];
    
    // 맵에서 할당된 몬스터들이 있으면 사용
    if (gameState.assignedMonsters && gameState.assignedMonsters.length > 0) {
        for (const assignedMonster of gameState.assignedMonsters) {
            const monsterId = assignedMonster.name;
            let enemyData;
            let monsterHpBonus = hpBonus;
            
            if (assignedMonster.isBoss) {
                // 보스 몬스터 - ID로 찾기
                enemyData = bossDatabase.find(e => e.id === monsterId || e.name === monsterId);
                if (!enemyData) enemyData = bossDatabase[0];
                monsterHpBonus = 0;
            } else if (assignedMonster.isElite) {
                // 엘리트 몬스터 - ID로 찾기
                enemyData = eliteDatabase.find(e => e.id === monsterId || e.name === monsterId);
                if (!enemyData) enemyData = eliteDatabase[0];
                monsterHpBonus = Math.floor(gameState.battleCount / 3) * 20;
            } else {
                // 일반 몬스터 - ID로 찾기
                enemyData = enemyDatabase.find(e => e.id === monsterId || e.name === monsterId);
                if (!enemyData) {
                    // 못 찾으면 기본 몬스터
                    const normalEnemies = enemyDatabase.filter(e => !e.isSplitForm);
                    enemyData = normalEnemies[0];
                }
            }
            
            if (enemyData) {
                gameState.enemies.push(createEnemy(enemyData, monsterHpBonus));
            }
        }
        
        // 할당된 몬스터 초기화
        gameState.assignedMonsters = null;
        gameState.assignedMonster = null;
    } else if (gameState.currentBattleType === 'elite') {
        // 엘리트 전투
        const eliteIndex = Math.floor(Math.random() * eliteDatabase.length);
        const enemyData = eliteDatabase[eliteIndex];
        hpBonus = Math.floor(gameState.battleCount / 3) * 20;
        gameState.enemies.push(createEnemy(enemyData, hpBonus));
    } else if (gameState.currentBattleType === 'boss') {
        // 보스 전투
        const bossIndex = Math.floor(Math.random() * bossDatabase.length);
        const enemyData = bossDatabase[bossIndex];
        gameState.enemies.push(createEnemy(enemyData, 0));
        
        // 🎬 보스 등장 트랜지션
        if (typeof ScreenTransition !== 'undefined') {
            setTimeout(() => {
                ScreenTransition.bossAppear(enemyData.name);
            }, 500);
        }
    } else {
        // 일반 전투 (분열된 슬라임 등 특수 몬스터 제외)
        const normalEnemies = enemyDatabase.filter(e => !e.isSplitForm);
        const enemyIndex = (gameState.battleCount - 1) % normalEnemies.length;
        const enemyData = normalEnemies[enemyIndex];
        hpBonus = Math.floor((gameState.battleCount - 1) / normalEnemies.length) * 15;
        gameState.enemies.push(createEnemy(enemyData, hpBonus));
    }
    
    // 하위 호환성
    gameState.enemy = gameState.enemies[0];
    gameState.selectedEnemyIndex = 0;
    
    // ✅ 적 onBattleStart 콜백 호출 (사신의 초기화 등)
    gameState.enemies.forEach(enemy => {
        if (typeof enemy.onBattleStart === 'function') {
            enemy.onBattleStart(gameState);
        }
    });
    
    // 적 UI 업데이트
    renderEnemies(true);
    
    // 상단 엘리트/보스 이름 표시 제거 (각 적 아래에 이름이 이미 표시됨)
    elements.enemyName.textContent = '';
    elements.enemyName.style.display = 'none';
    elements.battleNum.textContent = gameState.battleCount;
    
    // 몬스터 패시브 표시
    if (typeof MonsterPassiveSystem !== 'undefined') {
        MonsterPassiveSystem.init();
        setTimeout(() => {
            MonsterPassiveSystem.updateAllEnemiesDisplay(gameState.enemies);
        }, 300);
    }
    
    // 덱 초기화 (깊은 복사로 카드 객체 새로 생성)
    gameState.drawPile = shuffleArray(gameState.deck.map(card => {
        let newCard;
        
        // 카드가 문자열(ID)인 경우 createCard로 변환
        if (typeof card === 'string') {
            newCard = typeof createCard === 'function' ? createCard(card) : null;
            if (!newCard) {
                console.error(`[Battle] 카드 생성 실패: ${card}`);
                return null;
            }
        } else if (card && typeof card === 'object' && card.id) {
            // 카드 객체인 경우 깊은 복사
            newCard = { ...card };
        } else {
            console.error('[Battle] 잘못된 카드 형식:', card);
            return null;
        }
        
        // 응집된 일격은 항상 3으로 리셋
        if (newCard && newCard.id === 'concentratedStrike') {
            newCard.cost = 3;
        }
        return newCard;
    }).filter(card => card !== null));
    gameState.discardPile = [];
    gameState.hand = [];
    gameState.turn = 1;
    gameState.isPlayerTurn = true;
    
    // UI 업데이트
    updateUI();
    updateTurnIndicator();
    clearLog();
    addLog(`Battle Start: ${gameState.enemy.name}`);
    
    // 전투 시작 연출
    if (typeof TurnEffects !== 'undefined') {
        TurnEffects.showBattleStart(gameState.enemy.name);
    }
    
    // 브레이브 시스템 초기화 (전사 전용)
    if (typeof BraveSystem !== 'undefined') {
        BraveSystem.onBattleStart();
        BraveSystem.createBraveUI();
    }
    
    // 잡힌 NPC 체크 및 표시
    if (typeof NPCDisplaySystem !== 'undefined') {
        NPCDisplaySystem.checkAndShowCapturedNpc(
            gameState.enemy.name,
            gameState.currentBattleType,
            gameState.battleCount
        );
    }
    
    // 인텐트 숨김 상태로 시작 (배틀스타트 씬 동안)
    gameState.intentsHidden = true;
    
    // 연출 후 인텐트 결정 및 카드 뽑기 (지연)
    setTimeout(() => {
        // ✅ 배틀스타트 씬이 끝난 후 인텐트 결정
        decideEnemyIntent();
        
        // 인텐트 공개 애니메이션
        revealEnemyIntents();
        
        // 첫 턴: 선천성 카드 먼저 손패에
        drawInnateCards();
        
        // 타로 카드 드로우 보너스/패널티 적용
        let drawAmount = PlayerBaseStats.getDrawPerTurn();
        
        // 여사제 카드: 첫 턴 드로우 보너스
        if (gameState.nextBattleBuffs && gameState.nextBattleBuffs.bonusDraw) {
            drawAmount += gameState.nextBattleBuffs.bonusDraw;
            addLog(`Draw Bonus +${gameState.nextBattleBuffs.bonusDraw}!`, 'buff');
            gameState.nextBattleBuffs.bonusDraw = 0; // 사용 후 초기화
        }
        
        // 달 카드: 드로우 패널티
        if (gameState.nextBattleDebuffs && gameState.nextBattleDebuffs.drawPenalty) {
            drawAmount = Math.max(1, drawAmount - gameState.nextBattleDebuffs.drawPenalty);
            addLog(`Draw Penalty -${gameState.nextBattleDebuffs.drawPenalty}!`, 'debuff');
            gameState.nextBattleDebuffs.drawPenalty = 0; // 사용 후 초기화
        }
        drawCards(drawAmount);
        
        // 첫 턴 연출
        if (typeof TurnEffects !== 'undefined') {
            TurnEffects.showPlayerTurn(1);
        }
    }, 2200);
}


// ==========================================
// 적 생성
// ==========================================
function createEnemy(enemyData, hpBonus = 0) {
    // 몬스터 등급 결정 (데이터베이스 기반)
    const tier = typeof getMonsterTier === 'function' 
        ? getMonsterTier(enemyData.id || enemyData.name) 
        : 'normal';
    
    // ✅ 밸런스 스케일링 적용
    let scaledHpBonus = hpBonus;
    let damageMultiplier = 1.0;
    
    if (typeof BalanceSystem !== 'undefined' && typeof MapSystem !== 'undefined' && MapSystem.currentRoom) {
        const room = MapSystem.currentRoom;
        const scaling = BalanceSystem.getCurrentScaling(room.type);
        
        // HP 스케일링: 기본 HP에 배율 적용
        const baseHp = enemyData.maxHp;
        const scaledHp = Math.round(baseHp * scaling.hp);
        scaledHpBonus = scaledHp - baseHp + hpBonus;
        
        // 데미지 스케일링 저장
        damageMultiplier = scaling.damage;
        
        console.log(`[Balance] ${enemyData.name} 스케일링 - HP: ${baseHp} → ${scaledHp}, DMG 배율: ${damageMultiplier.toFixed(2)}`);
    }
    
    const enemy = {
        id: enemyData.id || (Date.now() + Math.random()), // 원본 ID 유지
        uniqueId: Date.now() + Math.random(), // 인스턴스 고유 ID
        name: enemyData.name,
        maxHp: enemyData.maxHp + scaledHpBonus,
        hp: enemyData.maxHp + scaledHpBonus,
        block: 0,
        intents: enemyData.intents.map(i => ({
            ...i,
            value: Math.round((i.value + Math.floor(hpBonus / 5)) * damageMultiplier)
        })),
        intent: null,
        intentValue: 0,
        img: enemyData.img || 'monster.png', // PNG 이미지 직접 참조
        thorns: enemyData.thorns || 0,
        canSplit: enemyData.canSplit || false,
        splitThreshold: enemyData.splitThreshold || 0.5,
        hasSplit: false, // 이미 분열했는지
        onDamageTaken: enemyData.onDamageTaken || null,
        onTurnStart: enemyData.onTurnStart || null,
        onBattleStart: enemyData.onBattleStart || null,
        onIntent: enemyData.onIntent || null,
        // 사신 전용 플래그
        attackBonus: enemyData.attackBonus || 0,
        isPreparingExecution: enemyData.isPreparingExecution || false,
        hasTriggeredExecution: enemyData.hasTriggeredExecution || false,
        // 실명 공격 관련
        blindEveryNTurns: enemyData.blindEveryNTurns || 0, // N턴마다 실명 (0이면 비활성)
        blindIntent: enemyData.blindIntent || null, // 실명 인텐트 데이터
        turnCount: 0, // 현재 턴 카운트
        // 거미줄 패시브 (숫자면 그 값, boolean true면 1, 아니면 0)
        webOnAttack: typeof enemyData.webOnAttack === 'number' ? enemyData.webOnAttack : 
                     (enemyData.webOnAttack === true ? 1 : 0),
        passives: enemyData.passives || [],
        // ✅ 패턴 시스템 (고블린 킹 등 보스용)
        usePattern: enemyData.usePattern || false,
        pattern: enemyData.pattern ? [...enemyData.pattern] : null, // 패턴 배열 복사
        patternIndex: 0, // 패턴 시작 인덱스
        // ✅ 등급 시스템
        tier: tier,
        isBoss: enemyData.isBoss || tier === 'boss',
        isElite: enemyData.isElite || tier === 'elite',
        isSummoned: false, // 소환 여부 (summonMinion에서 설정)
        // ✅ 다이어 울프 패시브
        bleedOnAttack: enemyData.bleedOnAttack || false,
        wildInstinct: enemyData.wildInstinct || 0,
        regeneration: enemyData.regeneration || 0,
        // ✅ 도플갱어 플래그
        isDoppelganger: enemyData.isDoppelganger || false,
        // ✅ 스케일 (개별 몬스터 크기 조절)
        scale: enemyData.scale || 1.0,
        // ✅ 브레이크 시스템 (인텐트 기반)
        currentBreakRecipe: null,  // 현재 인텐트의 브레이크 레시피
        breakProgress: [],         // 현재까지 맞힌 속성들
        isBroken: false,
        // ✅ 배치 위치 (후퇴 시스템용)
        battlePosition: 0  // 높을수록 뒤쪽에 배치
    };
    
    // 브레이크 시스템 초기화
    if (typeof BreakSystem !== 'undefined' && enemy.maxBreakShield > 0) {
        BreakSystem.initEnemy(enemy);
    }
    
    // 특수 몬스터 초기화 콜백
    if (enemyData.onSpawn) {
        enemyData.onSpawn(enemy);
    }
    
    return enemy;
}

// ==========================================
// 다중 적 렌더링
// ==========================================
function renderEnemies(withEntrance = true) {
    const enemyArea = document.querySelector('.enemy-area');
    if (!enemyArea) return;
    
    // 기존 적 컨테이너 제거
    const existingContainer = document.getElementById('enemies-container');
    if (existingContainer) existingContainer.remove();
    
    // 새 컨테이너 생성 (3열 구조: 왼쪽 미니언 | 보스 | 오른쪽 미니언)
    const container = document.createElement('div');
    container.id = 'enemies-container';
    container.className = 'enemies-container boss-centered';
    
    // 보스/엘리트와 미니언 분리 (죽은 적 제외!)
    const boss = gameState.enemies.find(e => (e.isBoss || e.isElite) && e.hp > 0);
    const minions = gameState.enemies.filter(e => !e.isBoss && !e.isElite && e.hp > 0);
    
    // ✅ 미니언들을 배열 순서대로 오른쪽에 일렬 배치
    // 배열 순서 = 화면 순서 (첫 번째 = 맨 앞/왼쪽, 마지막 = 맨 뒤/오른쪽)
    // 이렇게 해야 후퇴/전진 로직이 직관적으로 동작함
    const leftMinions = [];
    const rightMinions = [...minions]; // 배열 순서대로 오른쪽에 배치 (살아있는 것만)
    
    // 왼쪽 미니언 컨테이너
    const leftContainer = document.createElement('div');
    leftContainer.className = 'minions-left';
    leftMinions.forEach(minion => {
        const index = gameState.enemies.indexOf(minion);
        const enemyEl = createEnemyElement(minion, index);
        applyEntranceAnimation(enemyEl, index, withEntrance, minion);
        leftContainer.appendChild(enemyEl);
    });
    
    // 보스 컨테이너 (중앙)
    const bossContainer = document.createElement('div');
    bossContainer.className = 'boss-center';
    if (boss) {
        const bossIndex = gameState.enemies.indexOf(boss);
        const bossEl = createEnemyElement(boss, bossIndex);
        applyEntranceAnimation(bossEl, bossIndex, withEntrance, boss);
        bossContainer.appendChild(bossEl);
    }
    
    // 오른쪽 미니언 컨테이너
    const rightContainer = document.createElement('div');
    rightContainer.className = 'minions-right';
    rightMinions.forEach((minion) => {
        const index = gameState.enemies.indexOf(minion);
        const enemyEl = createEnemyElement(minion, index);
        applyEntranceAnimation(enemyEl, index, withEntrance, minion);
        rightContainer.appendChild(enemyEl);
    });
    
    // 순서대로 추가: 왼쪽 → 보스 → 오른쪽
    container.appendChild(leftContainer);
    container.appendChild(bossContainer);
    container.appendChild(rightContainer);
    
    // 기존 enemy 요소 숨기기
    const oldEnemy = document.getElementById('enemy');
    if (oldEnemy) oldEnemy.style.display = 'none';
    
    enemyArea.appendChild(container);
    
    // 선택된 적 표시
    updateSelectedEnemy();
    
    // 몬스터 패시브 표시 업데이트
    if (typeof MonsterPassiveSystem !== 'undefined') {
        setTimeout(() => {
            MonsterPassiveSystem.updateAllEnemiesDisplay(gameState.enemies);
        }, withEntrance ? 600 : 100);
    }
}

// 등장 애니메이션 적용 헬퍼
function applyEntranceAnimation(enemyEl, index, withEntrance, enemy) {
    if (withEntrance && enemy.hp > 0) {
        enemyEl.classList.add('enemy-entrance');
        enemyEl.style.animationDelay = `${index * 0.15}s`;
        
        const animationDuration = 800 + (index * 150);
        setTimeout(() => {
            enemyEl.classList.remove('enemy-entrance');
        }, animationDuration);
    }
}

// 소환된 미니언만 화면에 추가 (기존 적은 유지)
function addMinionToDisplay(minion) {
    const container = document.getElementById('enemies-container');
    if (!container) {
        // 컨테이너가 없으면 전체 렌더링
        renderEnemies(false);
        return;
    }
    
    const minionIndex = gameState.enemies.indexOf(minion);
    
    // 보스 중앙 배치 레이아웃인 경우
    if (container.classList.contains('boss-centered')) {
        // 미니언들을 왼쪽/오른쪽으로 분배
        const minions = gameState.enemies.filter(e => e.isSummoned && e.hp > 0);
        const minionOrder = minions.indexOf(minion);
        
        // 짝수면 왼쪽, 홀수면 오른쪽
        const targetContainer = minionOrder % 2 === 0 
            ? container.querySelector('.minions-left')
            : container.querySelector('.minions-right');
        
        if (targetContainer) {
            const minionEl = createEnemyElement(minion, minionIndex);
            // 소환 애니메이션만 적용 (entrance 아님)
            minionEl.classList.add('summoned');
            setTimeout(() => minionEl.classList.remove('summoned'), 1000);
            
            targetContainer.appendChild(minionEl);
            
            // 패시브 표시
            if (typeof MonsterPassiveSystem !== 'undefined') {
                setTimeout(() => {
                    MonsterPassiveSystem.updateDisplay(minion, minionIndex);
                }, 100);
            }
            return;
        }
    }
    
    // 일반 레이아웃이거나 실패 시 전체 재렌더링 (애니메이션 없이)
    renderEnemies(false);
}

function createEnemyElement(enemy, index) {
    const enemyEl = document.createElement('div');
    enemyEl.className = 'enemy-unit';
    enemyEl.dataset.index = index;
    
    if (enemy.hp <= 0) {
        enemyEl.classList.add('dead');
        enemyEl.classList.add('fully-hidden'); // 이미 죽은 상태로 생성되면 바로 숨김
    }
    
    // ✅ 도플갱어 클래스 추가
    if (enemy.isDoppelganger) {
        enemyEl.classList.add('doppelganger');
    }
    
    // ✅ 몬스터 개별 등급에 따라 클래스 추가 (전투 타입이 아닌 몬스터 자체 등급)
    const tierClass = typeof getMonsterTierClass === 'function' 
        ? getMonsterTierClass(enemy) 
        : '';
    if (tierClass) {
        enemyEl.classList.add(tierClass);
    }
    
    // 스케일 가져오기
    const scale = typeof getMonsterScale === 'function' 
        ? getMonsterScale(enemy) 
        : { width: 180, maxHeight: 200 };
    
    enemyEl.innerHTML = `
        <div class="enemy-intent-display">
            ${enemy.intent ? getIntentIcon(enemy.intent, enemy.intentValue, enemy.intentHits || 1, enemy.intentBleed || 0, enemy.intentName, enemy.intentIcon) : ''}
        </div>
        <div class="enemy-sprite-container">
            <div class="enemy-shadow"></div>
            <img src="${enemy.img}" alt="" title="" class="enemy-sprite-img" 
                 style="width: ${scale.width}px; max-height: ${scale.maxHeight}px;">
        </div>
        <div class="enemy-info">
            <div class="enemy-stat-bars">
                <div class="block-display enemy-block-container ${enemy.block > 0 ? 'visible' : ''}" data-enemy-index="${index}">
                    <div class="block-shield">
                        <span class="block-value">${enemy.block || 0}</span>
                    </div>
                </div>
                <div class="enemy-hp-wrapper">
                    <div class="enemy-hp-bar-container">
                        <div class="enemy-hp-bar" style="width: ${(enemy.hp / enemy.maxHp) * 100}%"></div>
                        <div class="enemy-hp-text">${enemy.hp}/${enemy.maxHp}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="enemy-name-label">${enemy.name}</div>
    `;
    
    // 클릭으로 타겟 선택
    enemyEl.addEventListener('click', () => selectEnemy(index));
    
    return enemyEl;
}

// 도플갱어 의도 표시 (카드 리스트 + 호버 상세정보)
function getDoppelgangerIntentDisplay(plannedCards) {
    if (!plannedCards || plannedCards.length === 0) {
        return '<span class="intent-defend">🤔</span>';
    }
    
    const cardIcons = plannedCards.map((card, index) => {
        const type = card.type || 'skill';
        let colorClass = type === 'attack' ? 'doppel-card-attack' : 'doppel-card-skill';
        const hits = card.hits || 1;
        const valueText = type === 'attack' 
            ? (hits > 1 ? `${card.damage}×${hits}` : `${card.damage}`)
            : (card.block ? `${card.block}` : '');
        
        // 카드 아이콘 (이미지 또는 이모지)
        let iconHtml = '';
        if (card.icon && card.icon.includes('<img')) {
            // 이미지 태그면 축소 버전으로
            iconHtml = card.icon.replace('class="card-icon-img"', 'class="doppel-mini-icon-img"');
        } else if (card.icon) {
            iconHtml = `<span class="doppel-mini-icon">${card.icon}</span>`;
        } else {
            iconHtml = `<span class="doppel-mini-icon">${type === 'attack' ? '⚔️' : '🛡️'}</span>`;
        }
        
        // 호버용 카드 상세 정보 (JSON으로 인코딩)
        const cardDataAttr = encodeURIComponent(JSON.stringify({
            name: card.name,
            cost: card.cost,
            type: type,
            damage: card.damage,
            block: card.block,
            hits: hits,
            description: card.description || '',
            icon: card.icon || ''
        }));
        
        return `<div class="doppel-intent-card ${colorClass}" 
                     data-card-info="${cardDataAttr}"
                     onmouseenter="showDoppelCardTooltip(this, event)"
                     onmouseleave="hideDoppelCardTooltip()">
            <div class="doppel-card-cost">${card.cost}</div>
            ${iconHtml}
            <span class="doppel-card-value">${valueText}</span>
        </div>`;
    }).join('');
    
    return `<div class="doppel-intent-list">${cardIcons}</div>`;
}

// 도플갱어 카드 툴팁 표시
function showDoppelCardTooltip(element, event) {
    hideDoppelCardTooltip(); // 기존 툴팁 제거
    
    const cardData = JSON.parse(decodeURIComponent(element.dataset.cardInfo));
    const tooltip = document.createElement('div');
    tooltip.id = 'doppel-card-tooltip';
    tooltip.className = 'doppel-card-tooltip';
    
    // 카드 아이콘 처리
    let iconHtml = '';
    if (cardData.icon && cardData.icon.includes('<img')) {
        iconHtml = cardData.icon;
    } else if (cardData.icon) {
        iconHtml = `<span class="tooltip-card-icon">${cardData.icon}</span>`;
    } else {
        iconHtml = `<span class="tooltip-card-icon">${cardData.type === 'attack' ? '⚔️' : '🛡️'}</span>`;
    }
    
    // 값 표시
    const valueHtml = cardData.type === 'attack'
        ? `<div class="tooltip-card-damage">${cardData.damage}${cardData.hits > 1 ? ` × ${cardData.hits}` : ''}</div>`
        : (cardData.block ? `<div class="tooltip-card-block">${cardData.block}</div>` : '');
    
    tooltip.innerHTML = `
        <div class="tooltip-card ${cardData.type}">
            <div class="tooltip-card-cost">${cardData.cost}</div>
            <div class="tooltip-card-image">${iconHtml}</div>
            <div class="tooltip-card-name">${cardData.name}</div>
            ${valueHtml}
            <div class="tooltip-card-desc">${cardData.description}</div>
        </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // 위치 조정 (마우스 위에)
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 10}px`;
}

// 도플갱어 카드 툴팁 숨기기
function hideDoppelCardTooltip() {
    const existing = document.getElementById('doppel-card-tooltip');
    if (existing) existing.remove();
}

function getIntentIcon(intent, value, hits = 1, bleed = 0, intentName = null, intentIcon = null) {
    if (intent === 'attack') {
        // 상세 정보 (툴팁용)
        let detailText = '';
        if (hits > 1) {
            detailText = `데미지 ${value}×${hits}`;
        } else {
            detailText = `데미지 ${value}`;
        }
        if (bleed > 0) {
            detailText += `, 출혈 ${bleed}`;
        }
        
        // 특수 공격 (이름이 있는 경우): 이름 표시 + 툴팁
        if (intentName && intentName !== '공격') {
            const icon = intentIcon || '⚔️';
            return `<span class="intent-attack intent-special" data-tooltip="${detailText}">${icon} ${intentName}</span>`;
        }
        
        // 일반 공격
        let attackText = '';
        if (hits > 1) {
            attackText = `공격 ${value}×${hits}`;
        } else {
            attackText = `공격 ${value}`;
        }
        
        // 출혈 정보 추가
        if (bleed > 0) {
            attackText += ` <span class="intent-bleed">출혈 ${bleed}</span>`;
        }
        
        return `<span class="intent-attack">${attackText}</span>`;
    } else if (intent === 'defend') {
        return `<span class="intent-defend">방어 ${value}</span>`;
    } else if (intent === 'buff') {
        return `<span class="intent-buff">강화</span>`;
    } else if (intent === 'blind') {
        return `<span class="intent-debuff">실명 ${value}턴</span>`;
    } else if (intent === 'summon') {
        return `<span class="intent-summon">소환</span>`;
    } else if (intent === 'buffAllies') {
        return `<span class="intent-buff">전투 함성</span>`;
    } else if (intent === 'defendAllies') {
        return `<span class="intent-defend">🛡️ 보호 ${value}</span>`;
    } else if (intent === 'howl') {
        return `<span class="intent-buff">울부짖음</span>`;
    } else if (intent === 'healAllies') {
        return `<span class="intent-heal">치유 ${value}</span>`;
    } else if (intent === 'healAlly') {
        return `<span class="intent-heal">💚 아군 치유 ${value}</span>`;
    } else if (intent === 'healSelf') {
        return `<span class="intent-heal">회복 ${value}</span>`;
    } else if (intent === 'debuffPlayer') {
        return `<span class="intent-debuff">저주 ${value}턴</span>`;
    } else if (intent === 'taunt') {
        return `<span class="intent-debuff">도발</span>`;
    } else if (intent === 'retreat') {
        return `<span class="intent-move">💨 후퇴</span>`;
    } else if (intent === 'advance') {
        return `<span class="intent-move">💨 전진</span>`;
    } else if (intent === 'prepare') {
        return `<span class="intent-danger">처형 준비</span>`;
    } else if (intent === 'selfHarm') {
        return `<span class="intent-selfharm">🩸 자해 ${value} → 광기 +${value}</span>`;
    } else if (intent === 'frenzyAttack') {
        return `<span class="intent-danger">💀 광기 폭발</span>`;
    }
    return '';
}

function selectEnemy(index) {
    if (index >= 0 && index < gameState.enemies.length) {
        const enemy = gameState.enemies[index];
        if (enemy.hp > 0) {
            gameState.selectedEnemyIndex = index;
            gameState.enemy = enemy; // 하위 호환성
            updateSelectedEnemy();
        }
    }
}

function updateSelectedEnemy() {
    const container = document.getElementById('enemies-container');
    if (!container) return;
    
    container.querySelectorAll('.enemy-unit').forEach((el, i) => {
        el.classList.toggle('selected', i === gameState.selectedEnemyIndex);
    });
}

// 적 UI 업데이트
function updateEnemiesUI() {
    gameState.enemies.forEach((enemy, index) => {
        const container = document.getElementById('enemies-container');
        if (!container) return;
        
        const enemyEl = container.querySelector(`[data-index="${index}"]`);
        if (!enemyEl) return;
        
        // ☠️ 죽은 적은 즉시 UI 숨기기
        if (enemy.hp <= 0) {
            enemyEl.classList.add('dying');
            
            // 🔴 HP 바 숨기기! (실제 클래스: enemy-hp-wrapper, enemy-hp-bar-container)
            const hpWrapper = enemyEl.querySelector('.enemy-hp-wrapper');
            if (hpWrapper) {
                hpWrapper.style.display = 'none';
                hpWrapper.style.visibility = 'hidden';
                hpWrapper.style.opacity = '0';
            }
            const hpBarContainer = enemyEl.querySelector('.enemy-hp-bar-container');
            if (hpBarContainer) {
                hpBarContainer.style.display = 'none';
                hpBarContainer.style.visibility = 'hidden';
                hpBarContainer.style.opacity = '0';
            }
            
            // 인텐트 숨기기
            const intentDisplay = enemyEl.querySelector('.enemy-intent-display');
            if (intentDisplay) {
                intentDisplay.style.display = 'none';
                intentDisplay.style.visibility = 'hidden';
                intentDisplay.innerHTML = '';
            }
            
            // 패시브 숨기기
            const passiveEl = enemyEl.querySelector('.monster-passive-indicator');
            if (passiveEl) {
                passiveEl.style.display = 'none';
                passiveEl.style.visibility = 'hidden';
            }
            
            // 버프/디버프 숨기기 (실제 클래스: buff-container)
            const buffEl = enemyEl.querySelector('.buff-container');
            if (buffEl) {
                buffEl.style.display = 'none';
                buffEl.style.visibility = 'hidden';
            }
            const buffEl2 = enemyEl.querySelector('.enemy-buff-display');
            if (buffEl2) {
                buffEl2.style.display = 'none';
                buffEl2.style.visibility = 'hidden';
            }
            
            const statusEl = enemyEl.querySelector('.enemy-status-display');
            if (statusEl) {
                statusEl.style.display = 'none';
                statusEl.style.visibility = 'hidden';
            }
            
            // 방어도 숨기기
            const blockEl = enemyEl.querySelector('.enemy-block-container');
            if (blockEl) {
                blockEl.classList.remove('visible');
                blockEl.style.display = 'none';
            }
            
            // 이름 라벨 숨기기
            const nameLabel = enemyEl.querySelector('.enemy-name-label');
            if (nameLabel) {
                nameLabel.style.display = 'none';
            }
            
            // 스프라이트 숨기기 (아직 죽음 처리 안됐으면)
            if (!enemy.processed) {
                const sprite = enemyEl.querySelector('.enemy-sprite-img');
                if (sprite) sprite.style.opacity = '0.3';
            }
            
            return; // 나머지 UI 업데이트 건너뛰기
        }
        
        // HP 바 업데이트 (음수 HP는 0으로 표시)
        const hpBar = enemyEl.querySelector('.enemy-hp-bar');
        const hpText = enemyEl.querySelector('.enemy-hp-text');
        const displayHp = Math.max(0, enemy.hp);  // UI에서는 0 이상만 표시
        if (hpBar) hpBar.style.width = `${Math.max(0, (displayHp / enemy.maxHp) * 100)}%`;
        if (hpText) hpText.textContent = `${displayHp}/${enemy.maxHp}`;
        
        // 방어도 업데이트 (통일된 방패 UI)
        let blockContainer = enemyEl.querySelector('.enemy-block-container');
        if (!blockContainer) {
            // 구조가 없으면 새로 생성 (enemy-stat-bars 안에)
            blockContainer = document.createElement('div');
            blockContainer.className = 'block-display enemy-block-container';
            blockContainer.setAttribute('data-enemy-index', index);
            blockContainer.innerHTML = `
                <div class="block-shield">
                    <span class="block-value">0</span>
                </div>
            `;
            // enemy-stat-bars가 있으면 그 안의 첫번째로, 없으면 enemy-info에 추가
            const statBarsEl = enemyEl.querySelector('.enemy-stat-bars');
            if (statBarsEl) {
                statBarsEl.insertBefore(blockContainer, statBarsEl.firstChild);
            } else {
                const infoEl = enemyEl.querySelector('.enemy-info');
                if (infoEl) infoEl.appendChild(blockContainer);
            }
        }
        
        const blockValue = blockContainer.querySelector('.block-value');
        if (enemy.block > 0) {
            blockContainer.classList.add('visible');
            if (blockValue) blockValue.textContent = enemy.block;
        } else {
            blockContainer.classList.remove('visible');
        }
        
        // 의도 업데이트
        const intentDisplay = enemyEl.querySelector('.enemy-intent-display');
        if (intentDisplay) {
            // 🔥 브레이크 상태면 인텐트 숨기기!
            if (enemy.isBroken) {
                intentDisplay.innerHTML = '';
                intentDisplay.style.display = 'none';
                intentDisplay.classList.add('is-broken');
            } else {
                intentDisplay.style.display = '';
                intentDisplay.classList.remove('is-broken');
                
                // 도플갱어는 카드 리스트로 표시
                if (enemy.isDoppelganger && enemy.plannedCards && enemy.plannedCards.length > 0) {
                    intentDisplay.innerHTML = getDoppelgangerIntentDisplay(enemy.plannedCards);
                } else {
                    intentDisplay.innerHTML = enemy.intent ? getIntentIcon(enemy.intent, enemy.intentValue, enemy.intentHits || 1, enemy.intentBleed || 0, enemy.intentName, enemy.intentIcon) : '';
                }
            }
            
            // 인텐트 숨김 상태 처리
            if (gameState.intentsHidden) {
                intentDisplay.classList.add('intent-hidden');
            } else {
                intentDisplay.classList.remove('intent-hidden');
            }
        }
        
        // 🎭 인텐트에 따른 스프라이트 애니메이션 클래스 토글
        // 기존 인텐트 클래스 + 위협 상태 모두 제거
        enemyEl.classList.remove(
            'intent-taunt', 
            'intent-attack-strong', 
            'intent-defend', 
            'intent-execute', 
            'intent-buff',
            'threat-active'  // ✅ 위협 상태도 제거
        );
        
        // 현재 인텐트에 맞는 클래스 추가
        if (enemy.intent) {
            if (enemy.intent === 'taunt') {
                // 도발: 팔짝팔짝 뛰기
                enemyEl.classList.add('intent-taunt');
            } else if (typeof BreakSystem !== 'undefined' && BreakSystem.hasBreakableIntent(enemy)) {
                // 브레이크 가능 인텐트: 힘을 모으는 애니메이션
                enemyEl.classList.add('intent-attack-strong');
                console.log(`[Intent] ${enemy.name} 강한 공격 준비! (브레이크 가능)`);
            } else if (enemy.intent === 'defend' || enemy.intent === 'block') {
                // 방어: 웅크리기
                enemyEl.classList.add('intent-defend');
            } else if (enemy.intent === 'prepare' || enemy.intent === 'execute') {
                // 처형 준비: 으스스한 진동
                enemyEl.classList.add('intent-execute');
            } else if (enemy.intent === 'buff' || enemy.intent === 'heal') {
                // 버프/힐: 반짝반짝
                enemyEl.classList.add('intent-buff');
            }
        }
        
        // 상태이상 표시 (규격화: 아이콘 + 이름 + 수치)
        let statusDisplay = enemyEl.querySelector('.enemy-status-display');
        const statuses = [];
        const isKr = typeof LanguageSystem !== 'undefined' && LanguageSystem.currentLang === 'kr';
        
        if (enemy.vulnerable && enemy.vulnerable > 0) {
            statuses.push({
                type: 'vulnerable',
                icon: '💔',
                name: isKr ? '취약' : 'Vulnerable',
                value: enemy.vulnerable,
                tooltip: isKr 
                    ? `취약: ${enemy.vulnerable}턴 동안 받는 피해 +50%`
                    : `Vulnerable: +50% damage taken for ${enemy.vulnerable} turn(s)`
            });
        }
        if (enemy.bleed && enemy.bleed > 0) {
            statuses.push({
                type: 'bleed',
                icon: '🩸',
                name: isKr ? '출혈' : 'Bleed',
                value: enemy.bleed,
                tooltip: isKr
                    ? `출혈: 턴 종료 시 ${enemy.bleed} 피해, 이후 1 감소`
                    : `Bleed: Takes ${enemy.bleed} damage at end of turn, then -1`
            });
        }
        if (enemy.weak && enemy.weak > 0) {
            statuses.push({
                type: 'weak',
                icon: '💧',
                name: isKr ? '약화' : 'Weak',
                value: enemy.weak,
                tooltip: isKr
                    ? `약화: ${enemy.weak}턴 동안 주는 피해 -25%`
                    : `Weak: Deal 25% less damage for ${enemy.weak} turn(s)`
            });
        }
        if (enemy.poison && enemy.poison > 0) {
            statuses.push({
                type: 'poison',
                icon: '☠️',
                name: isKr ? '중독' : 'Poison',
                value: enemy.poison,
                tooltip: isKr
                    ? `중독: 턴 종료 시 ${enemy.poison} 피해, 이후 1 감소`
                    : `Poison: Takes ${enemy.poison} damage at end of turn, then -1`
            });
        }
        
        if (statuses.length > 0) {
            if (!statusDisplay) {
                statusDisplay = document.createElement('div');
                statusDisplay.className = 'enemy-status-display';
                enemyEl.querySelector('.enemy-info').appendChild(statusDisplay);
            }
            statusDisplay.innerHTML = statuses.map(s => `
                <span class="status-badge status-${s.type} status-tooltip" data-tooltip="${s.tooltip}">
                    <span class="status-icon">${s.icon}</span>
                    <span class="status-name">${s.name}</span>
                    <span class="status-value">${s.value}</span>
                </span>
            `).join('');
        } else if (statusDisplay) {
            statusDisplay.remove();
        }
        
        // 사망 표시 - checkEnemyDefeated에서 처리하므로 여기선 클래스만 유지
        if (enemy.hp <= 0 && enemy.processed) {
            // 이미 처리된 적은 건드리지 않음 (checkEnemyDefeated에서 관리)
        }
    });
    
    // 선택된 적이 죽었으면 다른 적 선택
    const selectedEnemy = gameState.enemies[gameState.selectedEnemyIndex];
    if (!selectedEnemy || selectedEnemy.hp <= 0) {
        const aliveIndex = gameState.enemies.findIndex(e => e.hp > 0);
        if (aliveIndex >= 0) {
            selectEnemy(aliveIndex);
        }
    }
    
    // 버프 인디케이터 업데이트
    if (typeof BuffSystem !== 'undefined') {
        BuffSystem.updateAllEnemiesBuffDisplay();
    }
    
    // 패시브 인디케이터 업데이트
    if (typeof MonsterPassiveSystem !== 'undefined') {
        gameState.enemies.forEach((enemy, index) => {
            MonsterPassiveSystem.updateDisplayForEnemy(enemy, index);
        });
    }
    
    // 🔨 브레이크 UI 업데이트 (인텐트 기반)
    if (typeof BreakSystem !== 'undefined') {
        gameState.enemies.forEach((enemy) => {
            if (BreakSystem.hasBreakableIntent(enemy) || enemy.isBroken) {
                BreakSystem.updateBreakUI(enemy);
            }
        });
    }
}

// 슬라임 분열 체크
function checkSlimeSplit(enemy, index) {
    if (!enemy.canSplit || enemy.hasSplit) return false;
    
    const hpRatio = enemy.hp / enemy.maxHp;
    if (hpRatio <= enemy.splitThreshold && enemy.hp > 0) {
        // 분열!
        enemy.hasSplit = true;
        
        // 분열된 슬라임 데이터 찾기
        const splitSlimeData = enemyDatabase.find(e => e.name === '분열된 슬라임');
        if (!splitSlimeData) return false;
        
        // 두 개의 분열된 슬라임 생성
        const split1 = createEnemy(splitSlimeData, 0);
        const split2 = createEnemy(splitSlimeData, 0);
        
        // 원본 슬라임 제거하고 분열된 슬라임 추가
        gameState.enemies.splice(index, 1, split1, split2);
        
        // 의도 설정
        decideEnemyIntentForEnemy(split1);
        decideEnemyIntentForEnemy(split2);
        
        // UI 업데이트 (분열 시에는 등장 애니메이션 없이)
        renderEnemies(false);
        
        // 분열 이펙트
        showSplitEffect();
        
        addLog('Shadow Slime Split!', 'special');
        
        // 선택된 적 재설정
        gameState.selectedEnemyIndex = 0;
        gameState.enemy = gameState.enemies[0];
        
        // 이름 숨김 (다중 적)
        if (elements.enemyName) {
            elements.enemyName.textContent = '';
            elements.enemyName.style.display = 'none';
        }
        
        return true;
    }
    
    return false;
}

function showSplitEffect() {
    const container = document.getElementById('enemies-container');
    if (!container) return;
    
    // 화면 플래시
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(138, 43, 226, 0.4);
        z-index: 9999;
        pointer-events: none;
        animation: splitFlash 0.5s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
    
    // 분열 텍스트
    const text = document.createElement('div');
    text.className = 'split-text';
    text.textContent = '분열!';
    text.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Cinzel', serif;
        font-size: 3rem;
        font-weight: 900;
        color: #a855f7;
        text-shadow: 0 0 30px #a855f7, 2px 2px 0 #000;
        z-index: 10000;
        animation: splitTextAnim 1s ease-out forwards;
    `;
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 1000);
}

// 부활 이펙트
function showReviveEffect() {
    const playerEl = document.getElementById('player');
    
    // 쓰러진 상태 해제
    if (playerEl) {
        playerEl.classList.remove('dead');
    }
    
    // 화면 플래시 (주황색)
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(249, 115, 22, 0.5);
        z-index: 9999;
        pointer-events: none;
        animation: splitFlash 0.8s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
    
    // 부활 텍스트
    const text = document.createElement('div');
    text.innerHTML = '🪶 부활!';
    text.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Cinzel', serif;
        font-size: 3.5rem;
        font-weight: 900;
        color: #f97316;
        text-shadow: 0 0 30px #f97316, 0 0 60px #fbbf24, 2px 2px 0 #000;
        z-index: 10000;
        animation: reviveTextAnim 1.5s ease-out forwards;
    `;
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 1500);
    
    // 플레이어 빛나는 효과
    if (playerEl) {
        playerEl.style.filter = 'brightness(2) drop-shadow(0 0 30px #f97316)';
        setTimeout(() => {
            playerEl.style.filter = '';
        }, 1000);
    }
    
    // 불꽃 파티클
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.innerHTML = '🔥';
            particle.style.cssText = `
                position: fixed;
                top: 50%;
                left: ${30 + Math.random() * 40}%;
                font-size: ${1.5 + Math.random()}rem;
                z-index: 10001;
                pointer-events: none;
                animation: reviveParticle 1s ease-out forwards;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }, i * 50);
    }
}

// 플레이어 취약 이펙트
function showPlayerVulnerableEffect() {
    const playerEl = document.getElementById('player');
    if (!playerEl) return;
    
    const rect = playerEl.getBoundingClientRect();
    
    // 취약 텍스트 팝업
    const popup = document.createElement('div');
    popup.innerHTML = '💔 취약!';
    popup.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top}px;
        transform: translateX(-50%);
        font-family: 'Cinzel', serif;
        font-size: 1.8rem;
        font-weight: 900;
        color: #a855f7;
        text-shadow: 0 0 20px #a855f7, 2px 2px 0 #000;
        z-index: 10000;
        pointer-events: none;
        animation: vulnerablePopAnim 1s ease-out forwards;
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

// 플레이어 상태 UI 업데이트
function updatePlayerStatusUI() {
    const debuffContainer = document.getElementById('player-debuffs');
    if (!debuffContainer) return;
    
    // 기존 인디케이터 제거
    debuffContainer.innerHTML = '';
    
    // 취약 상태 인디케이터
    if (gameState.player.vulnerable && gameState.player.vulnerable > 0) {
        const vulnerableEl = document.createElement('div');
        vulnerableEl.className = 'player-debuff-icon vulnerable';
        vulnerableEl.innerHTML = `
            <span class="debuff-emoji">💔</span>
            <span class="debuff-count">${gameState.player.vulnerable}</span>
        `;
        vulnerableEl.title = `취약: 받는 피해 +50% (${gameState.player.vulnerable}턴)`;
        vulnerableEl.addEventListener('click', (e) => showPlayerDebuffTooltip(e, 'vulnerable'));
        vulnerableEl.addEventListener('mouseenter', (e) => showPlayerDebuffTooltip(e, 'vulnerable'));
        vulnerableEl.addEventListener('mouseleave', hidePlayerDebuffTooltip);
        debuffContainer.appendChild(vulnerableEl);
    }
    
    // 도발 상태 인디케이터
    if (gameState.player.taunt && gameState.player.taunt > 0) {
        const tauntEl = document.createElement('div');
        tauntEl.className = 'player-debuff-icon taunt';
        tauntEl.innerHTML = `
            <span class="debuff-emoji">😤</span>
            <span class="debuff-count">${gameState.player.taunt}</span>
        `;
        tauntEl.title = `도발: 방어도 생성량 -50% (${gameState.player.taunt}턴)`;
        tauntEl.addEventListener('click', (e) => showPlayerDebuffTooltip(e, 'taunt'));
        tauntEl.addEventListener('mouseenter', (e) => showPlayerDebuffTooltip(e, 'taunt'));
        tauntEl.addEventListener('mouseleave', hidePlayerDebuffTooltip);
        debuffContainer.appendChild(tauntEl);
    }
    
    // 실명 상태 인디케이터
    if (gameState.player.blind && gameState.player.blind > 0) {
        const blindEl = document.createElement('div');
        blindEl.className = 'player-debuff-icon blind';
        blindEl.innerHTML = `
            <span class="debuff-emoji">🕸️</span>
            <span class="debuff-count">${gameState.player.blind}</span>
        `;
        
        blindEl.addEventListener('click', (e) => showPlayerDebuffTooltip(e, 'blind'));
        blindEl.addEventListener('mouseenter', (e) => showPlayerDebuffTooltip(e, 'blind'));
        blindEl.addEventListener('mouseleave', hidePlayerDebuffTooltip);
        
        debuffContainer.appendChild(blindEl);
    }
}

// 플레이어 디버프 툴팁 표시
function showPlayerDebuffTooltip(event, debuffType) {
    hidePlayerDebuffTooltip();
    
    const debuffInfo = {
        vulnerable: {
            name: '취약',
            icon: '💔',
            color: '#a855f7',
            description: '받는 데미지가 50% 증가합니다.'
        },
        blind: {
            name: '실명',
            icon: '🕸️',
            color: '#6b21a8',
            description: '카드 정보가 숨겨집니다.'
        }
    };
    
    const info = debuffInfo[debuffType];
    if (!info) return;
    
    const tooltip = document.createElement('div');
    tooltip.id = 'player-debuff-tooltip';
    tooltip.className = 'player-debuff-tooltip';
    tooltip.innerHTML = `
        <div class="debuff-tooltip-header" style="border-color: ${info.color}">
            <span class="debuff-tooltip-icon">${info.icon}</span>
            <span class="debuff-tooltip-name" style="color: ${info.color}">${info.name}</span>
        </div>
        <div class="debuff-tooltip-desc">${info.description}</div>
    `;
    
    document.body.appendChild(tooltip);
    
    // 위치 조정
    const rect = event.target.closest('.player-debuff-icon').getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 10}px`;
}

// 플레이어 디버프 툴팁 숨기기
function hidePlayerDebuffTooltip() {
    const tooltip = document.getElementById('player-debuff-tooltip');
    if (tooltip) tooltip.remove();
}

// 실명 이펙트
function showBlindEffect(enemyEl, playerEl) {
    // 거미줄 이펙트
    const webEffect = document.createElement('div');
    webEffect.innerHTML = '🕸️';
    webEffect.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 8rem;
        z-index: 10000;
        pointer-events: none;
        animation: blindWebAnim 1s ease-out forwards;
    `;
    document.body.appendChild(webEffect);
    setTimeout(() => webEffect.remove(), 1000);
    
    // 화면 어두워짐
    const darkOverlay = document.createElement('div');
    darkOverlay.className = 'blind-overlay';
    darkOverlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9998;
        pointer-events: none;
        animation: blindDarkAnim 1.5s ease-out forwards;
    `;
    document.body.appendChild(darkOverlay);
    setTimeout(() => darkOverlay.remove(), 1500);
    
    // 실명 텍스트
    const blindText = document.createElement('div');
    blindText.textContent = '실명!';
    blindText.style.cssText = `
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Cinzel', serif;
        font-size: 4rem;
        font-weight: 900;
        color: #6b21a8;
        text-shadow: 0 0 30px #a855f7, 2px 2px 0 #000;
        z-index: 10001;
        animation: blindTextAnim 1.2s ease-out forwards;
    `;
    document.body.appendChild(blindText);
    setTimeout(() => blindText.remove(), 1200);
}

// 실명 상태 표시 업데이트
function updateBlindIndicator() {
    // 기존 상단 인디케이터 제거
    const existing = document.getElementById('blind-indicator');
    if (existing) existing.remove();
    
    // 상단 실명 경고 (실명일 때만)
    if (gameState.player.blind > 0) {
        const indicator = document.createElement('div');
        indicator.id = 'blind-indicator';
        indicator.className = 'blind-indicator';
        indicator.innerHTML = `🕸️ 실명 ${gameState.player.blind}턴`;
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(107, 33, 168, 0.9), rgba(88, 28, 135, 0.9));
            color: #fff;
            padding: 10px 25px;
            border-radius: 25px;
            font-family: 'Cinzel', serif;
            font-size: 1.2rem;
            font-weight: 700;
            z-index: 1000;
            border: 2px solid #a855f7;
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
            animation: blindIndicatorPulse 2s infinite;
        `;
        document.body.appendChild(indicator);
    }
    
    // HP 아래 디버프 UI도 업데이트
    updatePlayerStatusUI();
}

// ==========================================
// 유틸리티 함수
// ==========================================
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ==========================================
// 카드 시스템
// ==========================================
function drawCards(count, withAnimation = true) {
    const previousHandSize = gameState.hand.length;
    const drawnCards = [];
    
    for (let i = 0; i < count; i++) {
        if (gameState.drawPile.length === 0) {
            if (gameState.discardPile.length === 0) break;
            
            // 🎴 덱 리셔플 애니메이션 (실제 카드 데이터 전달)
            const reshuffleCount = gameState.discardPile.length;
            if (typeof CardAnimation !== 'undefined' && reshuffleCount > 0) {
                CardAnimation.deckReshuffle({ 
                    cardCount: reshuffleCount,
                    cards: [...gameState.discardPile]
                });
            }
            
            // 버리기 더미를 뽑기 더미로 (응집된 일격은 현재 턴 기준 코스트)
            gameState.drawPile = shuffleArray([...gameState.discardPile]);
            gameState.discardPile = [];
            addLog('Reshuffling discard pile');
        }
        
        if (gameState.hand.length >= 10) break;
        
        const card = gameState.drawPile.pop();
        
        // 응집된 일격이면 기본 코스트(3)로 손패에 들어옴
        if (card.id === 'concentratedStrike') {
            card.cost = 3;
        }
        
        gameState.hand.push(card);
        drawnCards.push(card);
    }
    
    // 기존 카드가 있으면 새 카드만 애니메이션, 없으면 전체 애니메이션
    if (previousHandSize > 0 && withAnimation) {
        renderHandWithNewCards(previousHandSize, drawnCards.length);
    } else {
        renderHand(withAnimation);
    }
    updatePileCounts();
}

// ==========================================
// 손패 관련 함수들은 hand-manager.js에서 관리
// createCardElement, renderHand, showCardDealEffect 등
// ==========================================

// ==========================================
// 카드 드래그앤드롭
// ==========================================
let draggedCard = null;
let dragGhost = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let currentDragX = 0;
let currentDragY = 0;

function setupCardDragAndDrop(cardEl, index, card) {
    cardEl.addEventListener('mousedown', (e) => {
        startDrag(e, cardEl, index, card);
    });
    
    cardEl.addEventListener('touchstart', (e) => {
        startDrag(e, cardEl, index, card);
    }, { passive: true });
}

function startDrag(e, cardEl, index, card) {
    if (!gameState.isPlayerTurn) return;
    if (card.cost > gameState.player.energy) return;
    if (card.unplayable) return; // 사용 불가 카드는 드래그 불가
    
    // 시작 위치 저장
    if (e.type === 'touchstart') {
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
    } else {
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }
    
    currentDragX = dragStartX;
    currentDragY = dragStartY;
    
    draggedCard = { el: cardEl, index, card };
    
    // 전역 이벤트 등록
    document.addEventListener('mousemove', onGlobalDragMove);
    document.addEventListener('mouseup', onGlobalDragEnd);
    document.addEventListener('touchmove', onGlobalDragMove, { passive: false });
    document.addEventListener('touchend', onGlobalDragEnd);
}

function onGlobalDragMove(e) {
    if (!draggedCard) return;
    
    let newX, newY;
    if (e.type === 'touchmove') {
        newX = e.touches[0].clientX;
        newY = e.touches[0].clientY;
    } else {
        newX = e.clientX;
        newY = e.clientY;
    }
    
    // 일정 거리 이상 움직여야 드래그 시작
    const distance = Math.sqrt(Math.pow(newX - dragStartX, 2) + Math.pow(newY - dragStartY, 2));
    
    if (distance > 10 && !isDragging) {
        isDragging = true;
        
        // 고스트 카드 생성
        createDragGhost(draggedCard.el, draggedCard.card);
        draggedCard.el.style.opacity = '0.3';
        
        // 타겟 하이라이트
        highlightValidTargets(draggedCard.card);
    }
    
    if (isDragging && dragGhost) {
        e.preventDefault();
        currentDragX = newX;
        currentDragY = newY;
        updateGhostPosition(currentDragX, currentDragY);
        checkDropTarget(draggedCard.card, currentDragX, currentDragY);
    }
}

function onGlobalDragEnd(e) {
    // 이벤트 리스너 제거
    document.removeEventListener('mousemove', onGlobalDragMove);
    document.removeEventListener('mouseup', onGlobalDragEnd);
    document.removeEventListener('touchmove', onGlobalDragMove);
    document.removeEventListener('touchend', onGlobalDragEnd);
    
    if (!draggedCard) return;
    
    const cardEl = draggedCard.el;
    const card = draggedCard.card;
    const cardIndex = draggedCard.index;
    
    // 원본 카드 복원
    cardEl.style.opacity = '';
    
    // 타겟 하이라이트 제거
    clearTargetHighlights();
    
    if (isDragging) {
        // 드롭 확인
        const dropResult = checkDropSuccess(card, currentDragX, currentDragY);
        
        if (dropResult) {
            removeDragGhost();
            playCard(cardIndex);
        } else {
            // 드롭 실패 시 원위치
            returnGhostToHand(cardEl);
        }
    }
    
    // 상태 초기화
    isDragging = false;
    draggedCard = null;
}

// 카드 타겟 확인 (enemy, self, none)
function getCardTarget(card) {
    const cardType = card.type?.id || card.type;
    
    // 공격 카드 → 적 타겟
    if (cardType === 'attack' || cardType === CardType.ATTACK) {
        return 'enemy';
    }
    
    // 스킬/파워 카드 → 자기 자신 타겟
    if (cardType === 'skill' || cardType === CardType.SKILL ||
        cardType === 'power' || cardType === CardType.POWER) {
        return 'self';
    }
    
    return 'none';
}

// 유효한 타겟 하이라이트
function highlightValidTargets(card) {
    const target = getCardTarget(card);
    const playerEl = document.getElementById('player');
    
    if (target === 'enemy') {
        // 다중 적 하이라이트
        const container = document.getElementById('enemies-container');
        if (container) {
            container.querySelectorAll('.enemy-unit').forEach(el => {
                if (!el.classList.contains('dead')) {
                    el.classList.add('drop-target');
                    addTargetMarker(el, 'attack');
                }
            });
        } else {
            const enemyEl = document.getElementById('enemy');
            if (enemyEl) {
                enemyEl.classList.add('drop-target');
                addTargetMarker(enemyEl, 'attack');
            }
        }
    } else if (target === 'self' && playerEl) {
        playerEl.classList.add('drop-target-self');
        addTargetMarker(playerEl, 'skill');
    }
}

// 타겟 마커 추가
function addTargetMarker(targetEl, type) {
    // 기존 마커 제거
    const existingMarker = targetEl.querySelector('.target-marker');
    if (existingMarker) existingMarker.remove();
    
    const marker = document.createElement('div');
    marker.className = `target-marker target-marker-${type}`;
    
    if (type === 'attack') {
        // 적 타겟: 조준점 스타일
        marker.innerHTML = `
            <svg viewBox="0 0 100 100" class="target-crosshair">
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="3"/>
                <circle cx="50" cy="50" r="8" fill="currentColor"/>
                <line x1="50" y1="5" x2="50" y2="25" stroke="currentColor" stroke-width="3"/>
                <line x1="50" y1="75" x2="50" y2="95" stroke="currentColor" stroke-width="3"/>
                <line x1="5" y1="50" x2="25" y2="50" stroke="currentColor" stroke-width="3"/>
                <line x1="75" y1="50" x2="95" y2="50" stroke="currentColor" stroke-width="3"/>
            </svg>
        `;
    } else {
        // 자신 타겟: 방패 스타일
        marker.innerHTML = `
            <svg viewBox="0 0 100 100" class="target-shield">
                <path d="M50 5 L90 25 L90 55 Q90 85 50 95 Q10 85 10 55 L10 25 Z" 
                      fill="none" stroke="currentColor" stroke-width="3"/>
                <path d="M50 20 L75 35 L75 55 Q75 75 50 82 Q25 75 25 55 L25 35 Z" 
                      fill="currentColor" opacity="0.3"/>
            </svg>
        `;
    }
    
    targetEl.appendChild(marker);
}

// 타겟 하이라이트 제거
function clearTargetHighlights() {
    const playerEl = document.getElementById('player');
    
    // 다중 적 하이라이트 제거
    const container = document.getElementById('enemies-container');
    if (container) {
        container.querySelectorAll('.enemy-unit').forEach(el => {
            el.classList.remove('drop-target', 'drop-target-active');
            removeTargetMarker(el);
        });
    }
    
    const enemyEl = document.getElementById('enemy');
    if (enemyEl) {
        enemyEl.classList.remove('drop-target', 'drop-target-active');
        removeTargetMarker(enemyEl);
    }
    if (playerEl) {
        playerEl.classList.remove('drop-target-self', 'drop-target-self-active');
        removeTargetMarker(playerEl);
    }
}

// 타겟 마커 제거
function removeTargetMarker(targetEl) {
    const marker = targetEl.querySelector('.target-marker');
    if (marker) {
        marker.classList.add('fade-out');
        setTimeout(() => marker.remove(), 200);
    }
}

// 드롭 타겟 체크
function checkDropTarget(card, x, y) {
    const target = getCardTarget(card);
    
    if (target === 'enemy') {
        // 다중 적 컨테이너 확인
        const container = document.getElementById('enemies-container');
        if (container) {
            let foundTarget = false;
            container.querySelectorAll('.enemy-unit').forEach(el => {
                if (el.classList.contains('dead')) return;
                
                const rect = el.getBoundingClientRect();
                const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
                
                if (isOver) {
                    foundTarget = true;
                    el.classList.add('drop-target-active');
                    dragGhost?.classList.add('can-drop');
                } else {
                    el.classList.remove('drop-target-active');
                }
            });
            
            if (!foundTarget) {
                dragGhost?.classList.remove('can-drop');
            }
        } else {
            // 기존 단일 적
            const enemyEl = document.getElementById('enemy');
            if (enemyEl) {
                const rect = enemyEl.getBoundingClientRect();
                const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
                
                if (isOver) {
                    dragGhost?.classList.add('can-drop');
                    enemyEl.classList.add('drop-target-active');
                } else {
                    dragGhost?.classList.remove('can-drop');
                    enemyEl.classList.remove('drop-target-active');
                }
            }
        }
    } else if (target === 'self') {
        const playerEl = document.getElementById('player');
        if (playerEl) {
            const rect = playerEl.getBoundingClientRect();
            const isOver = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            
            if (isOver) {
                dragGhost?.classList.add('can-drop');
                playerEl.classList.add('drop-target-self-active');
            } else {
                dragGhost?.classList.remove('can-drop');
                playerEl.classList.remove('drop-target-self-active');
            }
        }
    }
}

// 드롭 성공 확인
function checkDropSuccess(card, x, y) {
    const target = getCardTarget(card);
    
    if (target === 'enemy') {
        // 다중 적 컨테이너 확인
        const container = document.getElementById('enemies-container');
        if (container) {
            const enemyUnits = container.querySelectorAll('.enemy-unit');
            for (let i = 0; i < enemyUnits.length; i++) {
                const el = enemyUnits[i];
                if (el.classList.contains('dead')) continue;
                
                const rect = el.getBoundingClientRect();
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    // 이 적을 타겟으로 선택
                    const enemyIndex = parseInt(el.dataset.index);
                    selectEnemy(enemyIndex);
                    return true;
                }
            }
            return false;
        } else {
            const enemyEl = document.getElementById('enemy');
            if (enemyEl) {
                const rect = enemyEl.getBoundingClientRect();
                return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            }
        }
    } else if (target === 'self') {
        const playerEl = document.getElementById('player');
        if (playerEl) {
            const rect = playerEl.getBoundingClientRect();
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        }
    }
    
    return false;
}

// 드래그 고스트 생성
function createDragGhost(cardEl, card) {
    removeDragGhost();
    
    // 새 고스트 요소 생성 (cloneNode 대신 직접 생성)
    dragGhost = document.createElement('div');
    
    const cardType = card.type === CardType.ATTACK ? 'attack' : 'skill';
    const isBlinded = gameState.player.blind > 0;
    
    dragGhost.className = `card-drag-ghost card ${cardType}`;
    
    if (isBlinded) {
        dragGhost.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-image"><span class="blind-web">🕸️</span></div>
        `;
    } else {
        dragGhost.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-image">${card.icon}</div>
        `;
    }
    
    dragGhost.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        width: 120px;
        height: 160px;
        transition: none;
        transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(251, 191, 36, 0.4);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        border: 3px solid #fbbf24;
        background: linear-gradient(145deg, rgba(35, 35, 55, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%);
    `;
    
    document.body.appendChild(dragGhost);
}

// 고스트 위치 업데이트
function updateGhostPosition(x, y) {
    if (!dragGhost) return;
    dragGhost.style.left = x + 'px';
    dragGhost.style.top = y + 'px';
}

// 고스트 제거
function removeDragGhost() {
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
}

// 고스트 원위치 복귀
function returnGhostToHand(originalCard) {
    if (!dragGhost) return;
    
    const cardRect = originalCard.getBoundingClientRect();
    const targetX = cardRect.left + cardRect.width / 2;
    const targetY = cardRect.top + cardRect.height / 2;
    
    dragGhost.style.transition = 'all 0.3s ease-out';
    dragGhost.style.left = targetX + 'px';
    dragGhost.style.top = targetY + 'px';
    dragGhost.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
    dragGhost.style.opacity = '0';
    
    setTimeout(() => {
        removeDragGhost();
    }, 300);
}

// 공격 카드인지 확인
function isAttackCard(card) {
    const cardType = card.type?.id || card.type;
    return cardType === 'attack' || cardType === CardType.ATTACK;
}

function playCard(index) {
    if (!gameState.isPlayerTurn) return;
    
    const card = gameState.hand[index];
    if (!card) return;
    
    // 전역 플레이 중 플래그로 중복 클릭 방지
    if (gameState.isPlayingCard) {
        console.log('[playCard] 다른 카드 플레이 중 - 무시');
        return;
    }
    
    if (card.cost > gameState.player.energy) {
        addLog('Not enough energy!');
        shakeElement(elements.hand.children[index]);
        return;
    }
    
    // 사용 불가 카드 체크
    if (card.unplayable) {
        addLog('Unplayable card!', 'debuff');
        shakeElement(elements.hand.children[index]);
        return;
    }
    
    // 카드 플레이 중 플래그 설정 (중복 클릭 방지)
    gameState.isPlayingCard = true;
    
    // 300ms 후 자동 리셋 (안전장치)
    setTimeout(() => {
        gameState.isPlayingCard = false;
    }, 500);
    
    // 카드 사용 사운드 재생
    if (typeof SoundSystem !== 'undefined') {
        SoundSystem.playCardUse();
    } else {
        try {
            const sound = new Audio('sound/card_use.mp3');
            sound.volume = 0.5;
            sound.play().catch(() => {});
        } catch (e) {}
    }
    
    // 에너지 소모
    const costSpent = card.cost;
    gameState.player.energy -= costSpent;
    
    // 조력자 시스템에 코스트 사용 알림
    console.log(`[Game] Card played: ${card.name}, cost=${costSpent}, AllySystem exists=${typeof AllySystem !== 'undefined'}`);
    if (typeof AllySystem !== 'undefined' && costSpent > 0) {
        console.log(`[Game] Calling AllySystem.onCostSpent(${costSpent})`);
        AllySystem.onCostSpent(costSpent);
    }
    
    // 카드 사용 통계 업데이트
    gameState.turnStats.totalCardsPlayed++;
    // 문자열 비교로 안전하게 처리
    const cardType = card.type?.id || card.type;
    if (cardType === 'attack' || cardType === CardType.ATTACK) {
        gameState.turnStats.attackCardsPlayed++;
    } else if (cardType === 'skill' || cardType === CardType.SKILL) {
        gameState.turnStats.skillCardsPlayed++;
    }
    
    console.log(`[Card] ${card.name} 사용 - 타입: ${cardType}, 공격카드수: ${gameState.turnStats.attackCardsPlayed}`);
    
    // 유물 시스템에 카드 사용 알림 (효과 발동 전)
    if (typeof RelicSystem !== 'undefined') {
        RelicSystem.onCardPlayed(card, gameState);
    }
    
    // 직전 카드 저장 (시간 왜곡용) - timeWarp 자신은 저장하지 않음
    if (card.id !== 'timeWarp') {
        gameState.lastPlayedCard = card;
    }
    
    // [영창] 카드 사용 시 자동 영창 추가
    if (typeof IncantationSystem !== 'undefined' && card.isIncantation) {
        IncantationSystem.onCardPlayed(card);
    }
    
    // [은신] 도적 카드 사용 시 카운터 증가
    if (typeof StealthSystem !== 'undefined') {
        StealthSystem.onCardPlayed(card);
    }
    
    // 현재 카드 저장 (유물 보너스 계산용)
    gameState.currentCard = card;
    
    // 카드 애니메이션
    const cardEl = elements.hand.children[index];
    cardEl.classList.add('playing');
    
    // ✅ 공격 카드: 몸통박치기 → 슬래시 + 데미지 동시
    if (cardType === 'attack' || cardType === CardType.ATTACK) {
        // 크리티컬 시스템 체크
        let criticalResult = { isCritical: false, multiplier: 1.0 };
        if (typeof CriticalSystem !== 'undefined') {
            criticalResult = CriticalSystem.onAttackCardPlayed(card);
            gameState.currentCritical = criticalResult; // 데미지 계산에서 사용
        }
        
        // 🎬 카메라 효과 (공격 시)
        if (typeof CameraEffects !== 'undefined') {
            // 크리티컬이 아닐 때만 일반 공격 효과 (크리티컬은 별도 처리)
            if (!criticalResult.isCritical) {
                // hitCount가 3 이상이거나 코스트 2 이상이면 강한 공격
                const hitCount = typeof card.hitCount === 'function' ? card.hitCount(gameState) : (card.hitCount || 1);
                if (hitCount >= 3 || card.cost >= 2) {
                    CameraEffects.triggerHeavyAttack();
                } else {
                    CameraEffects.triggerAttack();
                }
            }
        }
        
        // hitCount가 함수면 실행해서 값 얻기 (동적 히트 카운트 지원)
        let hitCount = card.hitCount || 1;
        if (typeof hitCount === 'function') {
            hitCount = hitCount(gameState);
        }
        const hitInterval = card.hitInterval || 200;
        
        // 1. 몸통박치기 애니메이션 먼저 (플레이어 돌진)
        const playerEl = document.getElementById('player');
        if (playerEl) {
            playerEl.classList.add('body-slam-attack');
        }
        
        // 2. 몸통박치기 후 슬래시 + 데미지 동시에
        setTimeout(() => {
            if (playerEl) {
                playerEl.classList.remove('body-slam-attack');
            }
            
            // 슬래시 애니메이션 + 카드 효과(데미지) 동시 실행
            // 몸통박치기 임팩트 위치에서 슬래시 표시
            playHeroSlashAnimation(hitCount, hitInterval, true);
            card.effect(gameState, card);
            
            // 카드를 손패에서 제거
            gameState.hand.splice(index, 1);
            
            // 소멸 카드인지 확인 (isEthereal, ethereal, exhaust)
            console.log(`[playCard] 공격 카드 처리: ${card.name}, exhaust=${card.exhaust}`);
            const shouldExhaustAttack = card.isEthereal || card.ethereal || card.exhaust === true;
            if (shouldExhaustAttack) {
                addLog(`${card.name} 소멸`, 'ethereal');
                showEtherealEffect(card);
                // 소멸 더미에 추가
                if (!gameState.exhaustPile) gameState.exhaustPile = [];
                gameState.exhaustPile.push(card);
                console.log(`[playCard] ${card.name} 소멸됨!`);
            } else {
                gameState.discardPile.push(card);
                // 겜블러: 카드 버릴 때 칩 획득
                if (typeof ChipSystem !== 'undefined' && ChipSystem.isActive) {
                    ChipSystem.onCardDiscarded(card, 1);
                }
            }
            
            updateConcentratedStrikeCosts(gameState);
            
            setTimeout(() => {
                gameState.currentCard = null;
                gameState.currentCritical = null; // 크리티컬 상태 리셋
            }, 1000);
            
            renderHand();
            updateUI();
            updateEnemiesUI();
            
            // 크리티컬 UI 업데이트
            if (typeof CriticalSystem !== 'undefined') {
                CriticalSystem.updateCriticalUI();
            }
            
            checkEnemyDefeated();
        }, 300); // 몸통박치기 임팩트 시점 (50%)
    } else {
        // 비공격 카드는 기존 로직
        setTimeout(() => {
            card.effect(gameState, card);
            
            // 카드가 아직 손패에 있는지 확인 (effect에서 이미 처리했을 수 있음)
            const cardIndex = gameState.hand.indexOf(card);
            if (cardIndex > -1) {
                gameState.hand.splice(cardIndex, 1);
                
                // 소멸 카드인지 확인 (isEthereal, ethereal, exhaust)
                console.log(`[playCard] 비공격 카드 처리: ${card.name}, exhaust=${card.exhaust}, type=${card.type}`);
                const shouldExhaust = card.isEthereal || card.ethereal || card.exhaust === true;
                if (shouldExhaust) {
                    addLog(`${card.name} 소멸`, 'ethereal');
                    showEtherealEffect(card);
                    // 소멸 더미에 추가
                    if (!gameState.exhaustPile) gameState.exhaustPile = [];
                    gameState.exhaustPile.push(card);
                    console.log(`[playCard] ${card.name} 소멸됨!`);
                } else {
                    gameState.discardPile.push(card);
                    // 겜블러: 카드 버릴 때 칩 획득
                    if (typeof ChipSystem !== 'undefined' && ChipSystem.isActive) {
                        ChipSystem.onCardDiscarded(card, 1);
                    }
                }
            } else {
                console.log(`[playCard] ${card.name}은 이미 effect에서 처리됨`);
            }
            
            updateConcentratedStrikeCosts(gameState);
            
            setTimeout(() => {
                gameState.currentCard = null;
            }, 1000);
            
            renderHand();
            updateUI();
            updateEnemiesUI();
            checkEnemyDefeated();
            
            // 📚 튜토리얼 트리거
            if (typeof Tutorial !== 'undefined') {
                Tutorial.trigger('card-played');
            }
        }, 300);
    }
}

// 적 처치 확인
function checkEnemyDefeated() {
    // 이미 승리 처리 중이면 무시
    if (gameState.victoryProcessing) {
        console.log('[checkEnemyDefeated] 이미 승리 처리 중 - 무시');
        return;
    }
    
    // 죽은 적 처리
    gameState.enemies.forEach((enemy, enemyIndex) => {
        // ✅ 이미 처리된 적은 완전히 건너뛰기
        if (enemy.processed) {
            return;
        }
        
        if (enemy.hp <= 0) {
            enemy.processed = true;  // 즉시 플래그 설정
            console.log(`[checkEnemyDefeated] ${enemy.name} 처치됨!`);
            
            const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
            
            // 🩸 즉시 적 UI 숨기기 (모든 요소 확실히 숨김!)
            if (enemyEl) {
                enemyEl.classList.add('dying');  // 사망 중 표시
                
                // 🔴 HP 바 즉시 숨기기! (실제 클래스: enemy-hp-wrapper)
                const hpWrapper = enemyEl.querySelector('.enemy-hp-wrapper');
                if (hpWrapper) {
                    hpWrapper.style.display = 'none';
                    hpWrapper.style.visibility = 'hidden';
                    hpWrapper.style.opacity = '0';
                }
                const hpBarContainer = enemyEl.querySelector('.enemy-hp-bar-container');
                if (hpBarContainer) {
                    hpBarContainer.style.display = 'none';
                    hpBarContainer.style.visibility = 'hidden';
                    hpBarContainer.style.opacity = '0';
                }
                
                // 인텐트 즉시 숨기기
                const intentDisplay = enemyEl.querySelector('.enemy-intent-display');
                if (intentDisplay) {
                    intentDisplay.style.display = 'none';
                    intentDisplay.style.visibility = 'hidden';
                    intentDisplay.style.opacity = '0';
                    intentDisplay.innerHTML = '';
                }
                
                // 패시브/버프/상태 숨기기
                const passiveEl = enemyEl.querySelector('.monster-passive-indicator');
                if (passiveEl) {
                    passiveEl.style.display = 'none';
                    passiveEl.style.visibility = 'hidden';
                }
                
                // 버프 컨테이너 숨기기 (실제 클래스: buff-container)
                const buffContainer = enemyEl.querySelector('.buff-container');
                if (buffContainer) {
                    buffContainer.style.display = 'none';
                    buffContainer.style.visibility = 'hidden';
                }
                const buffEl = enemyEl.querySelector('.enemy-buff-display');
                if (buffEl) {
                    buffEl.style.display = 'none';
                    buffEl.style.visibility = 'hidden';
                }
                
                const statusEl = enemyEl.querySelector('.enemy-status-display');
                if (statusEl) {
                    statusEl.style.display = 'none';
                    statusEl.style.visibility = 'hidden';
                }
                
                // 방어도 숨기기
                const blockEl = enemyEl.querySelector('.enemy-block-container');
                if (blockEl) {
                    blockEl.classList.remove('visible');
                    blockEl.style.display = 'none';
                }
                
                // 이름 라벨 숨기기
                const nameLabel = enemyEl.querySelector('.enemy-name-label');
                if (nameLabel) {
                    nameLabel.style.display = 'none';
                }
            }
            
            // 🩸 오버킬 시스템 - 조각조각 절단 효과
            if (typeof OverkillSystem !== 'undefined') {
                const overkillData = OverkillSystem.pendingOverkills.get(enemyIndex);
                if (overkillData) {
                    OverkillSystem.executeOverkill(enemyIndex, enemyEl);
                    console.log(`[Overkill] ${enemy.name} 조각조각 VFX 실행`);
                }
            }
            
            // 사망 표시 (딜레이 후)
            if (enemyEl) {
                // 🌟 브레이크/스턴 이펙트 즉시 중지!
                if (typeof PixiRenderer !== 'undefined') {
                    if (PixiRenderer.stopPersistentStunLoop) {
                        PixiRenderer.stopPersistentStunLoop(enemyEl);
                    }
                    if (PixiRenderer.stopAllStunEffects) {
                        PixiRenderer.stopAllStunEffects(enemyIndex);
                    }
                }
                
                // CSS 스턴 클래스도 제거
                enemyEl.classList.remove('is-broken', 'threat-active', 'stun-effect');
                const stunStars = enemyEl.querySelector('.stun-stars-container');
                if (stunStars) stunStars.remove();
                
                setTimeout(() => {
                    // 🎬 GSAP 쓰러지는 애니메이션
                    if (typeof gsap !== 'undefined') {
                        const sprite = enemyEl.querySelector('.enemy-sprite-img');
                        
                        // 스프라이트만 애니메이션
                        gsap.timeline()
                            .to(sprite, {
                                rotation: 15,
                                duration: 0.15,
                                ease: 'power1.out'
                            })
                            .to(sprite, {
                                rotation: 75,
                                y: 30,
                                x: 40,
                                filter: 'grayscale(0.7) brightness(0.6)',
                                duration: 0.25,
                                ease: 'power2.in'
                            })
                            .to(sprite, {
                                rotation: 90,
                                y: 60,
                                x: 60,
                                opacity: 0,
                                filter: 'grayscale(1) brightness(0.3)',
                                duration: 0.3,
                                ease: 'power1.out',
                                onComplete: () => {
                                    enemyEl.classList.add('fully-hidden');
                                }
                            });
                        
                        enemyEl.classList.add('dead');
                    } else {
                        // GSAP 없으면 기본 방식
                        enemyEl.classList.add('dead');
                        setTimeout(() => {
                            enemyEl.classList.add('fully-hidden');
                        }, 800);
                    }
                }, 500);
            }
            
            // 적 처치 유물 효과
            if (typeof RelicSystem !== 'undefined') {
                RelicSystem.ownedRelics.forEach(relic => {
                    if (relic.onEnemyKill) {
                        relic.onEnemyKill(gameState);
                    }
                });
            }
        }
    });
    
    // UI 업데이트
    updateEnemiesUI();
    
    // ✅ 보스 사망 체크 - 미니언 도주 처리
    const boss = gameState.enemies.find(e => e.isBoss || e.isElite);
    const minions = gameState.enemies.filter(e => e.isSummoned && e.hp > 0);
    
    if (boss && boss.hp <= 0 && minions.length > 0) {
        console.log('*** 보스 사망! 미니언들 도주! ***');
        gameState.victoryProcessing = true;
        
        // 미니언 도주 연출
        triggerMinionsEscape(minions);
        return;
    }
    
    // 살아있는 적 수 계산
    let aliveCount = 0;
    for (let i = 0; i < gameState.enemies.length; i++) {
        if (gameState.enemies[i].hp > 0) {
            aliveCount++;
        }
    }
    
    console.log(`총 적: ${gameState.enemies.length}, 살아있는 적: ${aliveCount}`);
    
    // 모든 적이 죽었으면 승리
    if (gameState.enemies.length > 0 && aliveCount === 0) {
        console.log('*** 승리! ***');
        gameState.victoryProcessing = true; // 중복 호출 방지 플래그
        setTimeout(victory, 500);
        return;
    }
    
    // 살아있는 적이 있음
    updateUI();
    
    // 선택된 적이 죽었으면 다른 적 선택
    if (!gameState.enemy || gameState.enemy.hp <= 0) {
        for (let i = 0; i < gameState.enemies.length; i++) {
            if (gameState.enemies[i].hp > 0) {
                selectEnemy(i);
                break;
            }
        }
    }
}

// ==========================================
// 미니언 도주 연출
// ==========================================
function triggerMinionsEscape(minions) {
    addLog(`Boss defeated! Minions flee!`, 'special');
    
    // 도주 메시지 표시
    showEscapeMessage();
    
    // 각 미니언에게 도주 애니메이션 적용
    minions.forEach((minion, i) => {
        const minionIndex = gameState.enemies.indexOf(minion);
        const minionEl = getEnemyElement(minionIndex);
        
        if (minionEl) {
            // 먼저 공포 표정 (떨림)
            setTimeout(() => {
                minionEl.classList.add('scared');
                showEscapeSpeech(minionEl, minion.name, 'fear');
            }, 500 + (i * 300));
            
            // 잠시 후 도주 시작 (시간차)
            setTimeout(() => {
                minionEl.classList.remove('scared');
                // 도주 방향 결정 (왼쪽/오른쪽)
                const escapeDirection = i % 2 === 0 ? 'left' : 'right';
                minionEl.classList.add('escaping', `escape-${escapeDirection}`);
                
                // 도주 비명 이펙트
                showEscapeSpeech(minionEl, minion.name, 'escape');
                
            }, 1500 + (i * 500));
        }
        
        // HP를 0으로 설정 (처리 완료)
        setTimeout(() => {
            minion.hp = 0;
            minion.processed = true;
            minion.escaped = true;
        }, 3000 + (i * 500));
    });
    
    // 모든 도주 완료 후 승리 (충분한 여유 시간)
    const totalEscapeTime = 3500 + (minions.length * 500);
    setTimeout(() => {
        victory();
    }, totalEscapeTime);
}

// 도주 메시지 표시
function showEscapeMessage() {
    const msg = document.createElement('div');
    msg.className = 'escape-message';
    msg.innerHTML = `
        <span class="escape-icon">💨</span>
        <span class="escape-text">부하들이 도망친다!</span>
    `;
    msg.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #fbbf24;
        border-radius: 15px;
        padding: 25px 50px;
        z-index: 2000;
        animation: escapeMessageAnim 3s ease-out forwards;
    `;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

// 도주 비명 표시
function showEscapeSpeech(enemyEl, name, type = 'escape') {
    const fearSpeeches = ['어...어?!', '우두머리가...!', '안돼!', '끝이다...', '뭐야?!'];
    const escapeSpeeches = ['으악!', '도망쳐!', '살려줘!', '퇴각이다!', '다음엔 봐라!'];
    
    const speeches = type === 'fear' ? fearSpeeches : escapeSpeeches;
    const speech = speeches[Math.floor(Math.random() * speeches.length)];
    
    // 기존 말풍선 제거
    const existingBubble = enemyEl.querySelector('.escape-speech');
    if (existingBubble) existingBubble.remove();
    
    const bubble = document.createElement('div');
    bubble.className = `escape-speech ${type}`;
    bubble.textContent = speech;
    bubble.style.cssText = `
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'fear' ? '#fef3c7' : 'white'};
        color: ${type === 'fear' ? '#92400e' : '#333'};
        padding: 8px 15px;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: bold;
        white-space: nowrap;
        z-index: 100;
        animation: speechBubble ${type === 'fear' ? '1.5s' : '1.2s'} ease-out forwards;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    `;
    enemyEl.appendChild(bubble);
    setTimeout(() => bubble.remove(), type === 'fear' ? 1500 : 1200);
}

function shakeElement(el) {
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'hitShake 0.3s ease';
}

// ==========================================
// 히어로 슬래시 애니메이션 - GSAP 업그레이드!
// ==========================================
function playHeroSlashAnimation(hitCount = 1, hitInterval = 150, atImpactPosition = false) {
    const playerEl = document.getElementById('player');
    if (!playerEl) return;
    
    const targetEnemy = getSelectedEnemyElement();
    const heroImg = playerEl.querySelector('.player-sprite-img, img:not(.hero-slash-effect)');
    
    // 🎭 GSAP으로 스프라이트 애니메이션 (기존 이미지 숨기기 대신!)
    if (typeof gsap !== 'undefined' && heroImg) {
        // 기존 애니메이션 정리
        if (typeof SpriteAnimation !== 'undefined') {
            SpriteAnimation.stopAnimation('player-idle');
        }
        
        // 연타 공격인 경우
        if (hitCount > 1) {
            // 콤보 공격 애니메이션
            const comboTl = gsap.timeline();
            
            // 준비 자세
            comboTl.to(heroImg, {
                x: -30,
                scaleX: 0.85,
                scaleY: 1.1,
                duration: 0.1,
                ease: "back.in(2)"
            });
            
            // 연타!
            for (let i = 0; i < hitCount; i++) {
                const direction = (i % 2 === 0) ? 1 : -1;
                const hitX = 50 + (i * 10);
                
                comboTl.to(heroImg, {
                    x: hitX,
                    scaleX: 1.25,
                    scaleY: 0.85,
                    rotation: direction * 5,
                    filter: `
                        drop-shadow(2px 0 0 rgba(255, 255, 255, 1))
                        drop-shadow(-2px 0 0 rgba(255, 255, 255, 1))
                        drop-shadow(0 0 15px rgba(255, 200, 50, 0.9))
                        brightness(1.5)
                    `,
                    duration: 0.05,
                    ease: "power4.out"
                })
                .to(heroImg, {
                    x: hitX - 20,
                    scaleX: 1.1,
                    scaleY: 0.95,
                    rotation: -direction * 3,
                    filter: '',
                    duration: 0.04
                });
            }
            
            // 복귀
            comboTl.to(heroImg, {
                x: 0,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                filter: '',
                duration: 0.3,
                ease: "elastic.out(1, 0.4)",
                onComplete: () => {
                    if (typeof SpriteAnimation !== 'undefined') {
                        SpriteAnimation.startPlayerIdle();
                    }
                }
            });
        } else {
            // 단일 공격 애니메이션
            gsap.timeline()
                // 준비
                .to(heroImg, {
                    x: -25,
                    scaleX: 0.88,
                    scaleY: 1.08,
                    duration: 0.08,
                    ease: "back.in(2)"
                })
                // 돌진!
                .to(heroImg, {
                    x: 80,
                    scaleX: 1.3,
                    scaleY: 0.85,
                    filter: `
                        drop-shadow(2px 0 0 rgba(255, 255, 255, 1))
                        drop-shadow(-2px 0 0 rgba(255, 255, 255, 1))
                        drop-shadow(0 0 20px rgba(255, 200, 50, 0.9))
                        brightness(1.6)
                    `,
                    duration: 0.06,
                    ease: "power4.out"
                })
                // 플래시
                .to(heroImg, {
                    filter: `
                        drop-shadow(1px 0 0 rgba(255, 255, 255, 0.9))
                        drop-shadow(-1px 0 0 rgba(255, 255, 255, 0.9))
                        drop-shadow(0 0 8px rgba(255, 200, 100, 0.6))
                    `,
                    duration: 0.08
                })
                // 복귀
                .to(heroImg, {
                    x: 0,
                    scaleX: 1,
                    scaleY: 1,
                    rotation: 0,
                    filter: '',
                    duration: 0.25,
                    ease: "back.out(1.5)",
                    onComplete: () => {
                        if (typeof SpriteAnimation !== 'undefined') {
                            SpriteAnimation.startPlayerIdle();
                        }
                    }
                });
        }
    }
    
    let currentHit = 0;
    const animDuration = 120; // 빠른 애니메이션
    
    // 몸통박치기 임팩트 위치 오프셋 (bodySlamLunge 50% 지점)
    const impactOffset = atImpactPosition ? 150 : 0;
    
    const doSingleSlash = () => {
        if (currentHit >= hitCount) {
            playerEl.classList.remove('attacking');
            return;
        }
        
        // 슬래시 이미지 생성 (직업별 슬래시 스프라이트 사용)
        const slash = document.createElement('img');
        slash.src = (typeof JobSystem !== 'undefined') ? JobSystem.getCurrentSlashSprite() : 'hero_slash.png';
        slash.className = 'hero-slash-effect';
        
        // 슬래시 스프라이트 스케일 가져오기
        const slashScale = (typeof JobSystem !== 'undefined') ? JobSystem.getCurrentSlashSpriteScale() : 1.0;
        
        playerEl.style.position = 'relative';
        slash.style.cssText = `
            position: absolute;
            left: calc(50% + ${impactOffset}px);
            top: 50%;
            --slash-scale: ${slashScale};
            transform: translate(-50%, -50%) scale(${slashScale});
            transform-origin: center center;
            width: 140%;
            height: auto;
            z-index: 15;
            pointer-events: none;
            image-rendering: pixelated;
            animation: heroSlashAnim ${animDuration}ms ease-out forwards;
        `;
        
        playerEl.appendChild(slash);
        
        // 🎆 GSAP 슬래시 이펙트 애니메이션 (선택적)
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(slash, 
                { 
                    scale: slashScale * 0.8,
                    opacity: 0,
                    rotation: -10
                },
                {
                    scale: slashScale * 1.1,
                    opacity: 1,
                    rotation: 5,
                    duration: 0.06,
                    ease: "power4.out",
                    onComplete: () => {
                        gsap.to(slash, {
                            scale: slashScale,
                            opacity: 0,
                            rotation: 0,
                            duration: 0.06,
                            ease: "power2.in"
                        });
                    }
                }
            );
        }
        
        // 공격 모션 (reflow로 애니메이션 리셋)
        playerEl.classList.remove('attacking');
        void playerEl.offsetWidth;
        playerEl.classList.add('attacking');
        
        // 히트 스파크
        if (targetEnemy) {
            const enemyRect = targetEnemy.getBoundingClientRect();
            setTimeout(() => {
                showHitSpark(enemyRect);
            }, 50);
        }
        
        // 슬래시 이미지 정리
        setTimeout(() => {
            slash.remove();
        }, animDuration);
        
        currentHit++;
        
        // 다음 히트 (hitInterval 간격으로)
        if (currentHit < hitCount) {
            setTimeout(doSingleSlash, hitInterval);
        } else {
            // 마지막 히트 후 정리
            setTimeout(() => {
                playerEl.classList.remove('attacking');
            }, animDuration);
        }
    };
    
    // 첫 히트 시작
    doSingleSlash();
}

// 히트 스파크 효과
function showHitSpark(targetRect) {
    const spark = document.createElement('div');
    spark.className = 'hit-spark';
    spark.innerHTML = '💥';
    spark.style.cssText = `
        position: fixed;
        left: ${targetRect.left + targetRect.width / 2}px;
        top: ${targetRect.top + targetRect.height / 3}px;
        transform: translate(-50%, -50%) scale(0);
        font-size: 3rem;
        z-index: 1001;
        pointer-events: none;
        animation: hitSparkAnim 0.3s ease-out forwards;
    `;
    
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 300);
}

// 소멸 카드 이펙트
function showEtherealEffect(card) {
    const popup = document.createElement('div');
    popup.innerHTML = `${card.icon} <span style="color: #a78bfa;">소멸</span>`;
    popup.style.cssText = `
        position: fixed;
        left: 50%;
        bottom: 250px;
        transform: translateX(-50%);
        font-size: 1.2rem;
        color: #c4b5fd;
        text-shadow: 0 0 10px rgba(167, 139, 250, 0.8);
        pointer-events: none;
        z-index: 1000;
        animation: etherealFade 0.8s ease-out forwards;
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

// ==========================================
// 적 AI - enemy-ai.js로 분리됨
// ==========================================

// ==========================================
// 출혈/거미줄 시스템 - bleed-system.js로 분리됨
// ==========================================

// ==========================================
// 턴 시스템 (방어도 순서 수정)
// ==========================================

// 플레이어 턴 종료
function endTurn() {
    if (!gameState.isPlayerTurn) return;
    
    // 📚 튜토리얼 트리거
    if (typeof Tutorial !== 'undefined') {
        Tutorial.trigger('turn-ended');
    }
    
    gameState.isPlayerTurn = false;
    addLog('Turn ended');
    updateTurnIndicator();
    
    // 트라이포스 시스템 턴 종료
    if (typeof TriforceSystem !== 'undefined') {
        TriforceSystem.onTurnEnd();
    }
    
    // 🌫️ 필드 시스템 턴 종료
    if (typeof FieldSystem !== 'undefined') {
        FieldSystem.onTurnEnd(gameState);
    }
    
    // ⚡ 에너지 볼트 발사
    if (typeof EnergyBoltSystem !== 'undefined' && EnergyBoltSystem.bolts.length > 0) {
        EnergyBoltSystem.onTurnEnd();
    }
    
    // 🔮 영창 시스템 턴 종료
    if (typeof IncantationSystem !== 'undefined' && IncantationSystem.isActive) {
        IncantationSystem.onTurnEnd();
    }
    
    // 👤 분신 시스템 턴 종료
    if (typeof ShadowCloneSystem !== 'undefined' && ShadowCloneSystem.clones.length > 0) {
        ShadowCloneSystem.onTurnEnd();
    }
    
    // 임시 공격력 리셋
    if (gameState.player.tempStrength) {
        gameState.player.tempStrength = 0;
    }
    
    // 🩸 출혈 데미지 처리 (플레이어 턴 종료 시)
    processBleedDamage();
    
    // 출혈로 사망 체크
    if (gameState.player.hp <= 0) {
        setTimeout(gameOver, 500);
        return;
    }
    
    // 유물 시스템에 턴 종료 알림
    if (typeof RelicSystem !== 'undefined') {
        RelicSystem.onTurnEnd();
    }
    
    // 손패 카드 분류 (ethereal과 isEthereal 둘 다 체크)
    const isEtherealCard = (card) => card.ethereal || card.isEthereal;
    const retainCards = gameState.hand.filter(card => card.retain);           // 보존 카드 → 손에 유지
    const etherealCards = gameState.hand.filter(card => isEtherealCard(card) && !card.retain); // 소멸 카드 (보존 제외) → 소멸
    const normalCards = gameState.hand.filter(card => !isEtherealCard(card) && !card.retain);  // 일반 카드 → 버리기
    
    const handCards = elements.hand ? elements.hand.querySelectorAll('.card') : [];
    const discardPile = document.getElementById('discard-pile');
    const discardRect = discardPile ? discardPile.getBoundingClientRect() : null;
    
    console.log('[EndTurn] handCards:', handCards.length, 'discardRect:', !!discardRect);
    
    if (handCards.length > 0) {
        // 각 카드에 애니메이션 적용
        handCards.forEach((cardEl, index) => {
            const card = gameState.hand[index];
            const cardRect = cardEl.getBoundingClientRect();
            
            // 보존 카드는 애니메이션 없이 손에 유지
            if (card && card.retain) {
                cardEl.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
                cardEl.style.transform = 'scale(1.05)';
                cardEl.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.6)';
                setTimeout(() => {
                    cardEl.style.transform = '';
                    cardEl.style.boxShadow = '';
                }, 400);
                return;
            }
            
            setTimeout(() => {
                if (card && (card.ethereal || card.isEthereal) && !card.retain) {
                    // 소멸 카드: 불타는 연출 (보존 카드 제외)
                    cardEl.classList.add('card-burning');
                    showCardBurnEffect(cardRect);
                } else if (discardRect) {
                    // 일반 카드: 더미로 날아가기
                    const deltaX = discardRect.left + discardRect.width / 2 - cardRect.left - cardRect.width / 2;
                    const deltaY = discardRect.top + discardRect.height / 2 - cardRect.top - cardRect.height / 2;
                    
                    cardEl.style.transition = 'all 0.3s ease-in';
                    cardEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${15 + Math.random() * 20}deg) scale(0.3)`;
                    cardEl.style.opacity = '0';
                }
            }, index * 50);
        });
        
        // 애니메이션 완료 후 손패 정리
        setTimeout(() => {
            if (etherealCards.length > 0) {
                addLog(`${etherealCards.length} card(s) exhausted`, 'debuff');
            }
            
            if (retainCards.length > 0) {
                addLog(`${retainCards.length} card(s) retained`, 'buff');
            }
            
            // 응집된 일격 코스트 리셋
            normalCards.forEach(card => {
                if (card.id === 'concentratedStrike') {
                    card.cost = 3;
                }
            });
            
            // 일반 카드만 버리기 더미로 (ethereal 카드는 소멸, retain 카드는 유지)
            gameState.discardPile.push(...normalCards);
            
            // 겜블러: 턴 종료 시 버린 카드만큼 칩 획득 (딸랑딸랑!)
            if (typeof ChipSystem !== 'undefined' && ChipSystem.isActive && normalCards.length > 0) {
                ChipSystem.onCardDiscarded(null, normalCards.length);
            }
            
            gameState.hand = [...retainCards]; // 보존 카드만 손에 유지
            renderHand(false);
            updatePileCounts();
            
            // 적 턴 시작
            setTimeout(enemyTurn, 300);
        }, handCards.length * 50 + 500);
    } else {
        // 손패가 없으면 바로 진행
        if (etherealCards.length > 0) {
            addLog(`🔥 ${etherealCards.length}장의 카드가 소멸했습니다!`, 'debuff');
        }
        
        normalCards.forEach(card => {
            if (card.id === 'concentratedStrike') {
                card.cost = 3;
            }
        });
        
        // 일반 카드만 버리기 더미로 (ethereal 카드는 소멸, retain 카드는 유지)
        gameState.discardPile.push(...normalCards);
        
        // 겜블러: 턴 종료 시 버린 카드만큼 칩 획득 (딸랑딸랑!)
        if (typeof ChipSystem !== 'undefined' && ChipSystem.isActive && normalCards.length > 0) {
            ChipSystem.onCardDiscarded(null, normalCards.length);
        }
        
        gameState.hand = [...retainCards]; // 보존 카드만 손에 유지
        renderHand(false);
        
        // 적 턴 시작
        setTimeout(enemyTurn, 600);
    }
}

// 적 턴
function enemyTurn() {
    // 적이 없으면 중단 (이벤트 방 등에서 호출될 수 있음)
    if (!gameState.enemy) {
        console.log('[Game] enemyTurn 중단: 적 없음');
        return;
    }
    
    // 🎬 카메라 효과: 적 턴 (긴장감 증가)
    if (typeof CameraEffects !== 'undefined') {
        CameraEffects.onEnemyTurn();
    }
    
    addLog(`Enemy turn`);
    
    // 적 턴 연출
    if (typeof TurnEffects !== 'undefined') {
        TurnEffects.showEnemyTurn(gameState.enemy.name);
    }
    
    // ✅ 적 턴 시작 시, 적의 방어도 초기화
    // (플레이어가 이전 턴에 공격할 기회가 있었으므로)
    const enemyPrevBlock = ShieldSystem.resetBlockOnTurnStart(gameState.enemy);
    if (enemyPrevBlock > 0) {
        addLog(`${gameState.enemy.name} block lost (${enemyPrevBlock})`, 'block');
    }
    
    // 턴 시작 연출이 끝난 후 공격 (1.5초 딜레이)
    setTimeout(() => {
        // 적 행동 실행 (플레이어 방어도는 아직 남아있음!)
        // 콜백으로 모든 적 행동 완료 후 처리
        executeEnemyIntent(() => {
            // 플레이어 사망 체크
            if (gameState.player.hp <= 0) {
                setTimeout(gameOver, 500);
                return;
            }
            
            // 🐺 적 턴 종료 패시브 처리 (야생성, 재생 등)
            processEnemyTurnEndPassives();
            
            // 적 턴 종료 후 새 턴 시작
            setTimeout(startNewTurn, 400);
        });
    }, 1500);
}

// 적 턴 종료 시 패시브 효과 처리
function processEnemyTurnEndPassives() {
    gameState.enemies.forEach((enemy, index) => {
        if (enemy.hp <= 0) return;
        
        const enemyEl = getEnemyElement(index);
        
        // 야생성: 턴 종료 시 HP 회복
        if (enemy.wildInstinct && enemy.wildInstinct > 0) {
            const healAmount = enemy.wildInstinct;
            const prevHp = enemy.hp;
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
            const actualHeal = enemy.hp - prevHp;
            
            if (actualHeal > 0) {
                addLog(`${enemy.name} Wild: +${actualHeal} HP`, 'heal');
                
                // 회복 이펙트
                if (enemyEl) {
                    const healEffect = document.createElement('div');
                    healEffect.className = 'heal-effect';
                    healEffect.textContent = `+${actualHeal}`;
                    healEffect.style.cssText = `
                        position: absolute;
                        top: 30%;
                        left: 50%;
                        transform: translateX(-50%);
                        color: #22c55e;
                        font-size: 1.5rem;
                        font-weight: bold;
                        text-shadow: 0 0 10px #22c55e;
                        animation: healFloatUp 1s ease-out forwards;
                        z-index: 100;
                    `;
                    enemyEl.appendChild(healEffect);
                    setTimeout(() => healEffect.remove(), 1000);
                }
            }
        }
        
        // 재생: 턴 종료 시 HP 회복
        if (enemy.regeneration && enemy.regeneration > 0) {
            const healAmount = enemy.regeneration;
            const prevHp = enemy.hp;
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
            const actualHeal = enemy.hp - prevHp;
            
            if (actualHeal > 0) {
                addLog(`${enemy.name} Regen: +${actualHeal} HP`, 'heal');
            }
        }
        
        // ☠️ 죽음의 선고: 턴 종료 시 공격력 +1 증가
        if (enemy.passives && enemy.passives.includes('deathSentence')) {
            enemy.attackBonus = (enemy.attackBonus || 0) + 1;
            addLog(`☠️ 죽음의 선고: 공격력 +1 (총 +${enemy.attackBonus})`, 'danger');
            
            // 이펙트 표시
            if (enemyEl) {
                const deathEffect = document.createElement('div');
                deathEffect.className = 'death-sentence-effect';
                deathEffect.textContent = `☠️+1`;
                deathEffect.style.cssText = `
                    position: absolute;
                    top: 20%;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #a855f7;
                    font-size: 1.3rem;
                    font-weight: bold;
                    text-shadow: 0 0 10px #7c3aed, 0 0 20px #4c1d95;
                    animation: deathSentenceFloat 1.2s ease-out forwards;
                    z-index: 100;
                    pointer-events: none;
                `;
                enemyEl.appendChild(deathEffect);
                setTimeout(() => deathEffect.remove(), 1200);
            }
            
            // 패시브 UI 업데이트
            if (typeof MonsterPassiveSystem !== 'undefined') {
                MonsterPassiveSystem.updateDisplayForEnemy(enemy, index);
            }
        }
        
        // 출혈: 턴 종료 시 출혈 데미지
        if (enemy.bleed && enemy.bleed > 0) {
            const bleedDamage = enemy.bleed;
            enemy.hp -= bleedDamage;
            
            addLog(`🩸 ${enemy.name} Bleed: -${bleedDamage} HP`, 'damage');
            
            // 출혈 이펙트
            if (enemyEl) {
                const bleedEffect = document.createElement('div');
                bleedEffect.className = 'bleed-damage-effect';
                bleedEffect.textContent = `🩸-${bleedDamage}`;
                bleedEffect.style.cssText = `
                    position: absolute;
                    top: 30%;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #ef4444;
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-shadow: 0 0 10px #ef4444, 0 0 20px #dc2626;
                    animation: bleedFloatUp 1s ease-out forwards;
                    z-index: 100;
                    pointer-events: none;
                `;
                enemyEl.appendChild(bleedEffect);
                setTimeout(() => bleedEffect.remove(), 1000);
                
                // Canvas VFX 출혈 이펙트
                if (typeof VFX !== 'undefined') {
                    const pos = VFX.getElementCenter(enemyEl);
                    if (pos) {
                        VFX.bleed(pos.x, pos.y, { count: 10 + bleedDamage * 2 });
                    }
                }
                
                // 적 깜빡임 효과
                enemyEl.style.filter = 'brightness(1.5) saturate(2)';
                setTimeout(() => enemyEl.style.filter = '', 200);
            }
            
            // 출혈 스택 감소
            enemy.bleed -= 1;
            if (enemy.bleed < 0) enemy.bleed = 0;
            
            // 적 사망 체크
            if (enemy.hp <= 0) {
                enemy.hp = 0;
                addLog(`${enemy.name} defeated by Bleed!`, 'special');
            }
        }
    });
    
    // UI 업데이트
    updateEnemiesUI();
    
    // 적 사망 체크
    setTimeout(() => {
        if (typeof checkEnemyDefeated === 'function') {
            checkEnemyDefeated();
        }
    }, 100);
}

// 적 행동 실행 (콜백 지원) - 순차적 실행
function executeEnemyIntent(onAllComplete) {
    // 모든 살아있는 적이 순서대로 행동
    const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
    
    // ✅ 정렬 순서: 공격/스킬 먼저 → 이동(retreat/advance) 마지막 → 보스/엘리트 최후
    const sortedEnemies = [...aliveEnemies].sort((a, b) => {
        // 보스/엘리트는 항상 마지막
        if (a.isBoss || a.isElite) return 1;
        if (b.isBoss || b.isElite) return -1;
        
        // 이동 인텐트(retreat/advance)는 뒤로 밀기
        const aIsMove = (a.intent === 'retreat' || a.intent === 'advance');
        const bIsMove = (b.intent === 'retreat' || b.intent === 'advance');
        if (aIsMove && !bIsMove) return 1;  // a가 이동이면 뒤로
        if (!aIsMove && bIsMove) return -1; // b가 이동이면 뒤로
        
        // 나머지는 배열 인덱스 순서대로
        return gameState.enemies.indexOf(a) - gameState.enemies.indexOf(b);
    });
    
    if (sortedEnemies.length === 0) {
        if (onAllComplete) onAllComplete();
        return;
    }
    
    // ✅ 순차적 실행: 이전 적의 행동이 완료된 후 다음 적 실행
    let currentEnemyIndex = 0;
    
    const executeNextEnemy = () => {
        if (currentEnemyIndex >= sortedEnemies.length) {
            // 모든 적 행동 완료
            if (onAllComplete) onAllComplete();
            return;
        }
        
        const enemy = sortedEnemies[currentEnemyIndex];
        currentEnemyIndex++;
        
        // 죽은 적은 스킵 + UI 업데이트
        if (enemy.hp <= 0) {
            console.log(`[적 턴] ${enemy.name} 이미 죽음 - 스킵`);
            // 죽은 적 UI 정리
            const deadIndex = gameState.enemies.indexOf(enemy);
            if (deadIndex >= 0) {
                const deadEl = document.querySelector(`.enemy-unit[data-index="${deadIndex}"]`);
                if (deadEl && !deadEl.classList.contains('dead')) {
                    deadEl.classList.add('dying');
                    const intentDisplay = deadEl.querySelector('.enemy-intent-display');
                    if (intentDisplay) intentDisplay.style.display = 'none';
                }
            }
            executeNextEnemy();
            return;
        }
        
        // ✅ 실행 시점에 인덱스를 계산 (후퇴로 배열이 변경될 수 있음)
        const arrayIndex = gameState.enemies.indexOf(enemy);
        console.log(`[적 턴] ${enemy.name} 실행, 배열 인덱스: ${arrayIndex}`);
        
        // 다음 적 실행 전 약간의 딜레이
        const onThisEnemyComplete = () => {
            setTimeout(() => {
                executeNextEnemy();
            }, 300); // 적 행동 사이 딜레이
        };
        
        executeEnemyIntentForEnemy(enemy, arrayIndex, onThisEnemyComplete);
    };
    
    // 첫 번째 적 실행 시작
    executeNextEnemy();
}

function executeEnemyIntentForEnemy(enemy, enemyIndex, onComplete) {
    // 죽은 적은 행동하지 않음
    if (!enemy || enemy.hp <= 0) {
        if (onComplete) onComplete();
        return;
    }
    
    // 🔨 브레이크 상태 체크 - 브레이크된 적은 행동 스킵
    if (typeof BreakSystem !== 'undefined' && !BreakSystem.canAct(enemy)) {
        const enemyEl = getEnemyElement(enemyIndex);
        addLog(`${enemy.name} is BROKEN! Skipping action.`, 'system');
        
        // 브레이크 해제 처리 (스타일만 복구)
        BreakSystem.onTurnEnd(enemy);
        
        // 브레이크 해제 연출
        if (enemyEl && !enemy.isBroken) {
            const recoverEffect = document.createElement('div');
            recoverEffect.className = 'break-recover-effect';
            recoverEffect.textContent = 'RECOVERED';
            recoverEffect.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fbbf24;
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
                animation: breakRecoverAnim 1s ease-out forwards;
                z-index: 100;
                pointer-events: none;
            `;
            enemyEl.appendChild(recoverEffect);
            setTimeout(() => recoverEffect.remove(), 1000);
            
            // 🔥 인텐트 표시 복구 (비워두기 - 다음 턴에 결정됨)
            const intentEl = enemyEl.querySelector('.enemy-intent-display');
            if (intentEl) {
                intentEl.style.display = '';
                intentEl.style.visibility = 'visible';
                intentEl.style.opacity = '1';
                intentEl.classList.remove('is-broken', 'danger-intent', 'intent-shattering');
                // 🔧 중요: data-original-text 속성 제거 (다음 인텐트에서 새로 추출하도록)
                intentEl.removeAttribute('data-original-text');
                // 인텐트는 비워두고 "?" 표시 (다음 플레이어 턴 시작 시 결정됨)
                intentEl.innerHTML = '<span class="intent-unknown">❓</span>';
            }
        }
        
        // ⚠️ 인텐트는 결정하지 않음! 
        // 다음 플레이어 턴 시작 시 decideEnemyIntent()에서 자연스럽게 결정됨
        enemy.intent = null;
        enemy.intentValue = 0;
        console.log(`[BreakRecover] ${enemy.name} 회복 완료 - 인텐트는 다음 턴에 결정됨`);
        
        // UI 업데이트
        updateEnemiesUI();
        
        if (onComplete) setTimeout(onComplete, 500);
        return;
    }
    
    // 도플갱어는 별도 시스템에서 처리 (콜백 전달)
    if (enemy.isDoppelganger && typeof DoppelgangerSystem !== 'undefined') {
        DoppelgangerSystem.executeActions(enemy, gameState, onComplete);
        return;
    }
    
    // ✅ onIntent 콜백 호출 (사신의 공격력 보너스 등)
    if (typeof enemy.onIntent === 'function') {
        // 현재 인텐트 데이터 구성
        const intentData = {
            type: enemy.intent,
            value: enemy.intentValue,
            hits: enemy.intentHits || 1,
            bleed: enemy.intentBleed || 0
        };
        enemy.onIntent(intentData);
        // 변경된 값 반영
        enemy.intentValue = intentData.value;
    }
    
    const { intent, intentValue, name } = enemy;
    const playerEl = document.getElementById('player');
    
    // ✅ 실행 시점에 인덱스를 다시 계산 (배열이 변경되었을 수 있음)
    const currentEnemyIndex = gameState.enemies.indexOf(enemy);
    const enemyEl = getEnemyElement(currentEnemyIndex);
    
    console.log(`[executeEnemyIntentForEnemy] ${enemy.name} 행동 실행`);
    console.log(`  - 전달받은 인덱스: ${enemyIndex}, 현재 인덱스: ${currentEnemyIndex}`);
    console.log(`  - 인텐트: ${intent}, 값: ${intentValue}`);
    console.log(`  - enemyEl:`, enemyEl?.dataset?.index, enemyEl?.querySelector('.enemy-name-label')?.textContent);
    
    // 🗣️ 몬스터 대사 표시
    if (typeof showMonsterDialogue === 'function' && enemyEl) {
        showMonsterDialogue(enemyEl, enemy.id, intent);
    }
    
    if (intent === 'attack') {
        const hits = enemy.intentHits || 1;
        const bleedAmount = enemy.intentBleed || 0; // 출혈량
        
        // 분신 우선 공격 체크
        const hasClones = typeof ShadowCloneSystem !== 'undefined' && ShadowCloneSystem.hasClones();
        const cloneEl = hasClones ? ShadowCloneSystem.getFirstCloneElement() : null;
        const attackTarget = hasClones ? cloneEl : playerEl;
        const targetName = hasClones ? '분신' : '플레이어';
        
        if (hits > 1) {
            // 다중 공격
            addLog(`${name} attacks ${targetName}! ${intentValue}x${hits}`, 'damage');
            
            // 다중 히트 처리
            let currentHit = 0;
            const doHit = () => {
                if (currentHit >= hits) return;
                if (gameState.player.hp <= 0) return; // 플레이어 사망 시 중단
                
                const isLastHit = (currentHit === hits - 1);
                
                // 현재 타겟 (분신이 있으면 분신, 없으면 플레이어)
                const currentHasClones = typeof ShadowCloneSystem !== 'undefined' && ShadowCloneSystem.hasClones();
                const currentTarget = currentHasClones ? ShadowCloneSystem.getFirstCloneElement() : playerEl;
                
                // 적 공격 연출 (animationKey 우선, 없으면 attackType 기반)
                if (enemy.intentAnimationKey && typeof MonsterAnimations !== 'undefined') {
                    MonsterAnimations.execute(enemy.intentAnimationKey, {
                        enemyEl,
                        targetEl: currentTarget,
                        enemy,
                        damage: intentValue
                    });
                } else if (typeof EffectSystem !== 'undefined' && enemyEl) {
                    EffectSystem.enemyAttack(enemyEl, currentTarget, intentValue, enemy.attackType || 'melee');
                }
                
                // 데미지 적용
                setTimeout(() => {
                    // 분신 우선 공격
                    if (currentHasClones) {
                        ShadowCloneSystem.damageClone(intentValue);
                    } else {
                        const result = dealDamage(gameState.player, intentValue);
                        if (result.blockedDamage > 0) {
                            addLog(`Blocked ${result.blockedDamage}`, 'block');
                        }
                        
                        // 마지막 히트에서 출혈 적용 (플레이어만)
                        if (isLastHit && bleedAmount > 0) {
                            applyBleedToPlayer(bleedAmount, name);
                        }
                        
                        // 🕸️ 마지막 히트에서 거미줄 추가 (플레이어만)
                        if (isLastHit && enemy.webOnAttack && enemy.webOnAttack > 0) {
                            addWebCardsToDiscard(enemy.webOnAttack, name);
                        }
                    }
                }, 200);
                
                currentHit++;
                
                // 다음 히트
                if (currentHit < hits && gameState.player.hp > 0) {
                    setTimeout(doHit, 350);
                }
            };
            
            setTimeout(doHit, 400);
        } else {
            // 단일 공격
            addLog(`${name} attacks ${targetName}! ${intentValue} dmg`, 'damage');
            
            // 적 공격 연출 (animationKey 우선, 없으면 attackType 기반)
            if (enemy.intentAnimationKey && typeof MonsterAnimations !== 'undefined') {
                MonsterAnimations.execute(enemy.intentAnimationKey, {
                    enemyEl,
                    targetEl: attackTarget,
                    enemy,
                    damage: intentValue
                });
            } else if (typeof EffectSystem !== 'undefined' && enemyEl) {
                EffectSystem.enemyAttack(enemyEl, attackTarget, intentValue, enemy.attackType || 'melee');
            }
            
            // 약간의 딜레이 후 데미지 적용
            setTimeout(() => {
                // 분신 우선 공격
                if (hasClones && typeof ShadowCloneSystem !== 'undefined' && ShadowCloneSystem.hasClones()) {
                    ShadowCloneSystem.damageClone(intentValue);
                } else {
                    // 플레이어에게 데미지 (방어도가 먼저 흡수함 - shield.js에서 처리)
                    const result = dealDamage(gameState.player, intentValue);
                    
                    if (result.blockedDamage > 0) {
                        addLog(`방어도로 ${result.blockedDamage} 흡수!`, 'block');
                    }
                    
                    // 출혈 적용 (플레이어만)
                    if (bleedAmount > 0) {
                        applyBleedToPlayer(bleedAmount, name);
                    }
                    
                    // 🕸️ 거미줄 추가 (플레이어만)
                    if (enemy.webOnAttack && enemy.webOnAttack > 0) {
                        addWebCardsToDiscard(enemy.webOnAttack, name);
                    }
                }
            }, 400);
        }
    } else if (intent === 'defend') {
        addLog(`${name} defends! +${intentValue} block`, 'block');
        gainBlock(enemy, intentValue);
        
        // 적 방어도 이펙트
        if (typeof EffectSystem !== 'undefined' && enemyEl) {
            EffectSystem.shield(enemyEl, { color: '#ff6b6b' });
        }
        
        updateEnemiesUI();
    } else if (intent === 'buff') {
        // 버프 이펙트
        if (typeof EffectSystem !== 'undefined' && enemyEl) {
            EffectSystem.buff(enemyEl);
        }
        
        // ✅ 죽음의 선고 (사신 전용) - 공격력 증가
        if (enemy.passives && enemy.passives.includes('deathSentence')) {
            enemy.attackBonus = (enemy.attackBonus || 0) + intentValue;
            addLog(`☠️ 죽음의 선고! 공격력 +${intentValue} (총 +${enemy.attackBonus})`, 'danger');
            
            // 패시브 UI 업데이트
            if (typeof MonsterPassiveSystem !== 'undefined') {
                const enemyIdx = gameState.enemies.indexOf(enemy);
                MonsterPassiveSystem.updateDisplay(enemy, enemyIdx >= 0 ? enemyIdx : 0);
                MonsterPassiveSystem.animatePassiveChange('deathSentence', enemy.attackBonus, true);
            }
            
            // 화면 흔들림 효과
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(8, 300);
            }
        }
        // 가시 증가 (가시 수호자)
        else if (enemy.thorns !== undefined && enemy.thorns > 0) {
            enemy.thorns += intentValue;
            addLog(`Thorns +${intentValue}!`, 'buff');
            
            // 패시브 UI 업데이트
            if (typeof MonsterPassiveSystem !== 'undefined') {
                const enemyIdx = gameState.enemies.indexOf(enemy);
                MonsterPassiveSystem.updateDisplay(enemy, enemyIdx >= 0 ? enemyIdx : 0);
                MonsterPassiveSystem.animatePassiveChange('thorns', enemy.thorns, true);
            }
        }
        // 일반 버프
        else {
            addLog(`${name} buffed!`, 'buff');
        }
    } else if (intent === 'blind') {
        // 실명 공격 (카드 정보 숨김)
        addLog(`${name} blinds you!`, 'debuff');
        
        // 실명 상태 부여
        gameState.player.blind = intentValue;
        
        // 실명 이펙트
        showBlindEffect(enemyEl, playerEl);
        
        // 손패 다시 렌더링 (BLIND 처리)
        setTimeout(() => {
            renderHand(false);
            updateBlindIndicator();
        }, 500);
    } else if (intent === 'howl') {
        // 🐺 울음 - 공격력 버프
        addLog(`${name} Howls! ATK +${intentValue}`, 'buff');
        
        // 공격 버프 적용
        enemy.attackBuff = (enemy.attackBuff || 0) + intentValue;
        
        // 울음 이펙트
        if (enemyEl) {
            // 버프 이펙트
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.buff(enemyEl);
            }
            
            // 울음 텍스트 표시
            const howlText = document.createElement('div');
            howlText.className = 'howl-effect';
            howlText.innerHTML = '🌙 아우우~!';
            howlText.style.cssText = `
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.5rem;
                font-weight: bold;
                color: #a855f7;
                text-shadow: 0 0 15px #a855f7, 2px 2px 0 #000;
                animation: howlAnim 1.5s ease-out forwards;
                z-index: 100;
                white-space: nowrap;
            `;
            enemyEl.appendChild(howlText);
            setTimeout(() => howlText.remove(), 1500);
        }
        
        // 버프 시스템에 등록
        if (typeof BuffSystem !== 'undefined') {
            BuffSystem.applyBuff(enemy, 'howl', intentValue, enemy);
        }
        
        updateEnemiesUI();
    } else if (intent === 'summon') {
        // 부하 소환
        addLog(`${name} summons minions!`, 'warning');
        
        // 소환 이펙트
        if (typeof EffectSystem !== 'undefined' && enemyEl) {
            EffectSystem.buff(enemyEl);
        }
        
        // 소환할 몬스터 목록 (intentSummons 또는 패턴에서 직접 가져오기)
        let summons = enemy.intentSummons || [];
        
        // 패턴에서 직접 가져오기 (fallback)
        if (summons.length === 0 && enemy.pattern) {
            const currentPattern = enemy.pattern.find(p => p.type === 'summon');
            if (currentPattern && currentPattern.summons) {
                summons = currentPattern.summons;
            }
        }
        
        console.log(`[Summon Intent] 소환할 몬스터:`, summons);
        
        if (summons.length === 0) {
            console.warn(`[Summon Intent] 소환할 몬스터가 없습니다!`);
            addLog(`Summon failed: No targets`, 'warning');
        } else {
            setTimeout(() => {
                summons.forEach((summonId, i) => {
                    setTimeout(() => {
                        summonMinion(summonId, enemy);
                    }, i * 500);
                });
            }, 400);
        }
    } else if (intent === 'buffAllies') {
        // 아군 공격력 버프
        addLog(`🔥 ${name}: 전투 주문! 아군 전체 ATK +${intentValue}`, 'buff');
        
        // 🎬 애니메이션 실행
        const animationKey = enemy.intentAnimationKey;
        if (animationKey && typeof MonsterAnimations !== 'undefined' && MonsterAnimations.has(animationKey)) {
            MonsterAnimations.execute(animationKey, {
                enemyEl,
                enemy,
                onComplete: () => {
                    // 모든 아군(자신 제외)의 공격력 증가
                    buffAllMinions(enemy, intentValue);
                }
            });
        } else {
            // 기본 이펙트
            if (typeof EffectSystem !== 'undefined' && enemyEl) {
                EffectSystem.buff(enemyEl);
            }
            
            // 모든 아군(자신 제외)의 공격력 증가
            setTimeout(() => {
                buffAllMinions(enemy, intentValue);
            }, 300);
        }
    } else if (intent === 'defendAllies') {
        // ==========================================
        // 아군 전체 방어도 부여
        // ==========================================
        addLog(`🛡️ ${name}: 보호 주문! 아군 전체 방어도 +${intentValue}`, 'buff');
        
        // 🎬 애니메이션 실행
        const animationKey = enemy.intentAnimationKey;
        if (animationKey && typeof MonsterAnimations !== 'undefined' && MonsterAnimations.has(animationKey)) {
            MonsterAnimations.execute(animationKey, {
                enemyEl,
                enemy,
                onComplete: () => {
                    // 모든 아군(자신 제외)의 방어도 증가
                    defendAllMinions(enemy, intentValue);
                }
            });
        } else {
            // 기본 이펙트
            if (typeof EffectSystem !== 'undefined' && enemyEl) {
                EffectSystem.buff(enemyEl);
            }
            
            // 모든 아군(자신 제외)의 방어도 증가
            setTimeout(() => {
                defendAllMinions(enemy, intentValue);
            }, 300);
        }
    } else if (intent === 'healAllies') {
        // 아군 전체 회복
        addLog(`${name}: 치유의 빛! 아군 전체 HP +${intentValue}`, 'heal');
        
        // 힐 이펙트
        if (typeof EffectSystem !== 'undefined' && enemyEl) {
            EffectSystem.heal(enemyEl, { color: '#4ade80' });
        }
        if (typeof VFX !== 'undefined' && enemyEl) {
            const rect = enemyEl.getBoundingClientRect();
            VFX.heal(rect.left + rect.width / 2, rect.top + rect.height / 2, { color: '#4ade80', count: 15 });
        }
        
        // 모든 아군(자신 포함) HP 회복
        setTimeout(() => {
            healAllMinions(enemy, intentValue);
        }, 300);
    } else if (intent === 'healAlly') {
        // ==========================================
        // 아군 단일 회복 (가장 다친 아군 1명)
        // ==========================================
        
        // 자신을 제외한 살아있는 아군 중 가장 다친 적 찾기
        const aliveAllies = gameState.enemies.filter(e => 
            e !== enemy && e.hp > 0 && e.hp < e.maxHp
        );
        
        if (aliveAllies.length > 0) {
            // HP 비율이 가장 낮은 아군 선택
            const mostWounded = aliveAllies.reduce((prev, curr) => 
                (curr.hp / curr.maxHp) < (prev.hp / prev.maxHp) ? curr : prev
            );
            
            addLog(`💚 ${name}: "${mostWounded.name}"에게 치유 주문! HP +${intentValue}`, 'heal');
            
            // 🎬 애니메이션 실행
            const animationKey = enemy.intentAnimationKey;
            // 타겟 엘리먼트 미리 찾기
            const targetIndex = gameState.enemies.indexOf(mostWounded);
            const healTargetEl = document.querySelector(`[data-index="${targetIndex}"]`);
            
            if (animationKey && typeof MonsterAnimations !== 'undefined' && MonsterAnimations.has(animationKey)) {
                MonsterAnimations.execute(animationKey, {
                    enemyEl,
                    enemy,
                    targetEl: healTargetEl,
                    targetEnemy: mostWounded,
                    onComplete: () => {
                        // 힐 적용
                        const healAmount = Math.min(intentValue, mostWounded.maxHp - mostWounded.hp);
                        mostWounded.hp = Math.min(mostWounded.maxHp, mostWounded.hp + intentValue);
                        
                        // 🩹 힐 게이지 연출
                        if (typeof HealSystem !== 'undefined' && healTargetEl) {
                            HealSystem.animateEnemyHeal(mostWounded, targetIndex, healAmount);
                            HealSystem.showHealPopup(healTargetEl, healAmount);
                        } else if (healTargetEl) {
                            if (typeof EffectSystem !== 'undefined') {
                                EffectSystem.heal(healTargetEl, { color: '#4ade80' });
                            }
                            updateEnemiesUI();
                        }
                    }
                });
            } else {
                // 기본 이펙트
                const healAmount = Math.min(intentValue, mostWounded.maxHp - mostWounded.hp);
                mostWounded.hp = Math.min(mostWounded.maxHp, mostWounded.hp + intentValue);
                
                if (typeof EffectSystem !== 'undefined' && enemyEl) {
                    EffectSystem.buff(enemyEl);
                }
                
                const targetIdx = gameState.enemies.indexOf(mostWounded);
                const targetEl = document.querySelector(`[data-index="${targetIdx}"]`);
                
                // 🩹 힐 게이지 연출
                if (typeof HealSystem !== 'undefined' && targetEl) {
                    HealSystem.animateEnemyHeal(mostWounded, targetIdx, healAmount);
                    HealSystem.showHealPopup(targetEl, healAmount);
                } else if (targetEl) {
                    if (typeof EffectSystem !== 'undefined') {
                        EffectSystem.heal(targetEl, { color: '#4ade80' });
                    }
                    if (typeof VFX !== 'undefined') {
                        const rect = targetEl.getBoundingClientRect();
                        VFX.heal(rect.left + rect.width / 2, rect.top + rect.height / 2, { color: '#4ade80', count: 12 });
                    }
                    updateEnemiesUI();
                }
            }
        } else {
            // 🚫 치유 대상 없음 - 실패 연출
            addLog(`${name}: 치유할 대상이 없습니다...`, 'system');
            
            // 실패 연출: 캐스팅 후 실패
            if (enemyEl) {
                const sprite = enemyEl.querySelector('.enemy-sprite-img');
                if (sprite) {
                    // 주문 시전 준비 포즈
                    sprite.style.transition = 'transform 0.3s, filter 0.3s';
                    sprite.style.transform = 'scale(1.05)';
                    sprite.style.filter = 'brightness(1.3) hue-rotate(90deg)';
                    
                    setTimeout(() => {
                        // 실패! 원래대로 + 흔들림
                        sprite.style.transform = 'scale(1) translateX(-5px)';
                        sprite.style.filter = 'brightness(0.7) grayscale(0.5)';
                        
                        // 실패 텍스트 표시
                        const failText = document.createElement('div');
                        failText.className = 'damage-popup heal-fail';
                        failText.textContent = '실패!';
                        failText.style.cssText = `
                            position: absolute;
                            top: 30%;
                            left: 50%;
                            transform: translateX(-50%);
                            color: #888;
                            font-size: 1.2rem;
                            font-weight: bold;
                            text-shadow: 0 0 5px rgba(0,0,0,0.8);
                            animation: damagePopup 1s ease-out forwards;
                            z-index: 100;
                        `;
                        enemyEl.appendChild(failText);
                        setTimeout(() => failText.remove(), 1000);
                        
                        setTimeout(() => {
                            sprite.style.transform = '';
                            sprite.style.filter = '';
                        }, 300);
                    }, 400);
                }
            }
        }
    } else if (intent === 'healSelf') {
        // 자기 자신만 회복
        const healAmount = Math.min(intentValue, enemy.maxHp - enemy.hp);
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + intentValue);
        
        addLog(`${name}: 자가 치유! HP +${healAmount}`, 'heal');
        
        // 🩹 힐 게이지 연출
        if (typeof HealSystem !== 'undefined') {
            HealSystem.animateEnemyHeal(enemy, currentEnemyIndex, healAmount);
            HealSystem.showHealPopup(enemyEl, healAmount);
        } else {
            // 폴백: 기존 이펙트
            if (typeof EffectSystem !== 'undefined' && enemyEl) {
                EffectSystem.heal(enemyEl, { color: '#f472b6' });
            }
            if (typeof VFX !== 'undefined' && enemyEl) {
                const rect = enemyEl.getBoundingClientRect();
                VFX.heal(rect.left + rect.width / 2, rect.top + rect.height / 2, { color: '#f472b6', count: 20 });
            }
            if (enemyEl && typeof showDamagePopup === 'function') {
                showDamagePopup(enemyEl, healAmount, 'heal');
            }
            updateEnemiesUI();
        }
    } else if (intent === 'debuffPlayer') {
        // 플레이어에게 취약 부여
        if (!gameState.player.vulnerable) gameState.player.vulnerable = 0;
        gameState.player.vulnerable += intentValue;
        
        addLog(`${name}: 저주! 취약 ${intentValue}턴!`, 'debuff');
        
        // 저주 이펙트
        const playerEl = document.getElementById('player');
        if (typeof EffectSystem !== 'undefined' && playerEl) {
            EffectSystem.debuff(playerEl);
        }
        if (typeof VFX !== 'undefined' && playerEl) {
            const rect = playerEl.getBoundingClientRect();
            // 보라색 스파크로 저주 효과 표현
            VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, { 
                color: '#a855f7', 
                count: 12,
                speed: 8
            });
        }
        
        // 취약 표시
        if (typeof showPlayerVulnerableEffect === 'function') {
            showPlayerVulnerableEffect();
        }
        if (typeof updatePlayerStatusUI === 'function') {
            updatePlayerStatusUI();
        }
        
        updateUI();
    } else if (intent === 'taunt') {
        // 플레이어에게 도발 부여 (방어도 생성량 -50%)
        if (!gameState.player.taunt) gameState.player.taunt = 0;
        gameState.player.taunt += intentValue;
        
        addLog(`${name}: 도발! 방어도 생성량 감소 ${intentValue}턴!`, 'debuff');
        
        // 🎵 도발 음표 이펙트 (PixiJS)
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized && enemyEl) {
            const rect = enemyEl.getBoundingClientRect();
            PixiRenderer.createTauntNotes(rect.left + rect.width / 2, rect.top);
        }
        
        // 도발 이펙트
        const playerEl = document.getElementById('player');
        if (typeof EffectSystem !== 'undefined' && playerEl) {
            EffectSystem.debuff(playerEl);
        }
        if (typeof VFX !== 'undefined' && playerEl) {
            const rect = playerEl.getBoundingClientRect();
            VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, { 
                color: '#f59e0b', 
                count: 10,
                speed: 6
            });
        }
        
        if (typeof updatePlayerStatusUI === 'function') {
            updatePlayerStatusUI();
        }
        
        updateUI();
    } else if (intent === 'retreat') {
        // ==========================================
        // 후퇴: 1칸 뒤로 이동 (GSAP 애니메이션)
        // ==========================================
        
        addLog(`💨 ${name}: 후퇴! 뒤로 이동!`, 'system');
        
        // ✅ 후퇴 완료 후 다음 적 턴 시작을 위한 콜백
        const onRetreatComplete = () => {
            console.log(`[후퇴 완료] ${enemy.name} 위치 이동 완료, 다음 턴 시작`);
            // 충분한 대기 후 다음 적 턴 시작 (위치 변경 인지 시간)
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 500);
        };
        
        // 후퇴 완료 처리
        const executeRetreatWithGSAP = () => {
            // ✅ DOM 먼저 가져오기 (gameState 교환 전!)
            const container = document.getElementById('enemies-container');
            const enemyEls = container ? Array.from(container.querySelectorAll('.enemy-unit')) : [];
            
            // 살아있는 미니언들만 추출 (보스/엘리트 제외)
            const aliveMinions = gameState.enemies.filter(e => 
                e.hp > 0 && !e.isBoss && !e.isElite
            );
            
            // 미니언들 중 내 인덱스 찾기
            const myMinionIndex = aliveMinions.indexOf(enemy);
            
            // 전체 배열에서의 인덱스 (FLIP용으로 미리 계산)
            let myArrayIndex = gameState.enemies.indexOf(enemy);
            let backArrayIndex = -1;
            let backEnemy = null;
            
            // 1칸 뒤로 이동 (뒤에 적이 있으면 위치 교환)
            if (myMinionIndex < aliveMinions.length - 1) {
                backEnemy = aliveMinions[myMinionIndex + 1];
                backArrayIndex = gameState.enemies.indexOf(backEnemy);
                console.log(`[후퇴] ${enemy.name}(${myMinionIndex}) ↔ ${backEnemy.name}(${myMinionIndex + 1}) 위치 교환`);
            }
            
            // battlePosition도 업데이트 (1 증가)
            enemy.battlePosition = (enemy.battlePosition || 0) + 1;
            
            // 위치 교환이 없으면 그냥 완료
            if (backArrayIndex === -1) {
                updateSelectedEnemy();
                onRetreatComplete();
                return;
            }
            
            // ✅ DOM 요소 찾기 (gameState 교환 전!)
            const retreatedEl = enemyEls.find(el => el.enemy === enemy);
            const swappedEl = enemyEls.find(el => el.enemy === backEnemy);
            
            // gameState 배열 교환
            gameState.enemies[myArrayIndex] = backEnemy;
            gameState.enemies[backArrayIndex] = enemy;
            
            if (typeof gsap !== 'undefined' && retreatedEl && swappedEl) {
                // FLIP - First: 현재 위치 저장
                const oldRects = enemyEls.map(el => el.getBoundingClientRect());
                
                if (retreatedEl && swappedEl) {
                    // DOM에서 순서 바꾸기
                    if (retreatedEl.nextSibling === swappedEl) {
                        container.insertBefore(swappedEl, retreatedEl);
                    } else {
                        const placeholder = document.createElement('div');
                        container.insertBefore(placeholder, retreatedEl);
                        container.insertBefore(retreatedEl, swappedEl.nextSibling);
                        container.insertBefore(swappedEl, placeholder);
                        placeholder.remove();
                    }
                }
                
                // FLIP - Last & Invert & Play (통일된 3D API 사용)
                const newEnemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
                
                newEnemyEls.forEach((el, newIndex) => {
                    const oldIndex = enemyEls.indexOf(el);
                    if (oldIndex === -1) return;
                    
                    const oldRect = oldRects[oldIndex];
                    const newRect = el.getBoundingClientRect();
                    const diffX = oldRect.left - newRect.left;
                    
                    // data-index 업데이트
                    el.dataset.index = newIndex;
                    
                    // 3D 위치는 Background3D API 사용
                    const z3d = typeof Background3D !== 'undefined' 
                        ? Background3D.getEnemyZ(newIndex) 
                        : -80 - (newIndex * 20);
                    
                    if (Math.abs(diffX) > 1) {
                        gsap.fromTo(el, 
                            { x: diffX },
                            { 
                                x: 0, 
                                duration: 0.3, 
                                ease: 'power2.out',
                                onComplete: () => {
                                    el.style.transform = `translateZ(${z3d}px)`;
                                    el.style.transformStyle = 'preserve-3d';
                                }
                            }
                        );
                        
                        // 이동하는 적에게 착지 이펙트
                        if (el === retreatedEl) {
                            setTimeout(() => {
                                const sprite = el.querySelector('.enemy-sprite-img');
                                if (sprite) {
                                    gsap.to(sprite, {
                                        scaleY: 0.92, scaleX: 1.08,
                                        duration: 0.08, yoyo: true, repeat: 1
                                    });
                                }
                                if (typeof VFX !== 'undefined') {
                                    const rect = el.getBoundingClientRect();
                                    VFX.sparks(rect.left + rect.width / 2, rect.bottom, {
                                        color: '#94a3b8', count: 8, speed: 60, size: 3
                                    });
                                }
                            }, 250);
                        }
                    } else {
                        el.style.transform = `translateZ(${z3d}px)`;
                        el.style.transformStyle = 'preserve-3d';
                    }
                });
                
                // 완료 콜백
                setTimeout(() => {
                    updateSelectedEnemy();
                    onRetreatComplete();
                }, 350);
            } else {
                // GSAP 없으면 기본 방식
                renderEnemies(false);
                updateSelectedEnemy();
                onRetreatComplete();
            }
        };
        
        // 애니메이션 실행
        if (enemy.intentAnimationKey && typeof MonsterAnimations !== 'undefined') {
            MonsterAnimations.execute(enemy.intentAnimationKey, {
                enemyEl,
                enemy,
                onComplete: executeRetreatWithGSAP
            });
        } else {
            // 기본 후퇴 애니메이션
            if (typeof gsap !== 'undefined' && enemyEl) {
                gsap.to(enemyEl, {
                    x: 100,
                    opacity: 0,
                    duration: 0.35,
                    ease: 'power2.in',
                    onComplete: executeRetreatWithGSAP
                });
            } else {
                executeRetreatWithGSAP();
            }
        }
        
        updateUI();
        return; // ✅ 조기 리턴 - onComplete는 애니메이션 완료 후 호출됨
    } else if (intent === 'advance') {
        // ==========================================
        // 전진: 1칸 앞으로 이동 (GSAP 애니메이션)
        // ==========================================
        
        addLog(`💨 ${name}: 전진! 앞으로 이동!`, 'system');
        
        // ✅ 전진 완료 후 다음 적 턴 시작을 위한 콜백
        const onAdvanceComplete = () => {
            console.log(`[전진 완료] ${enemy.name} 위치 이동 완료, 다음 턴 시작`);
            // 충분한 대기 후 다음 적 턴 시작 (위치 변경 인지 시간)
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 500);
        };
        
        // 전진 완료 처리 (GSAP 사용)
        const executeAdvanceWithGSAP = () => {
            // ✅ DOM 먼저 가져오기 (gameState 교환 전!)
            const container = document.getElementById('enemies-container');
            const enemyEls = container ? Array.from(container.querySelectorAll('.enemy-unit')) : [];
            
            // 살아있는 미니언들만 추출 (보스/엘리트 제외)
            const aliveMinions = gameState.enemies.filter(e => 
                e.hp > 0 && !e.isBoss && !e.isElite
            );
            
            // 미니언들 중 내 인덱스 찾기
            const myMinionIndex = aliveMinions.indexOf(enemy);
            
            // 전체 배열에서의 인덱스 (FLIP용으로 미리 계산)
            let myArrayIndex = gameState.enemies.indexOf(enemy);
            let frontArrayIndex = -1;
            let frontEnemy = null;
            
            // 1칸 앞으로 이동 (앞에 적이 있으면 위치 교환)
            if (myMinionIndex > 0) {
                frontEnemy = aliveMinions[myMinionIndex - 1];
                frontArrayIndex = gameState.enemies.indexOf(frontEnemy);
                console.log(`[전진] ${enemy.name}(${myMinionIndex}) ↔ ${frontEnemy.name}(${myMinionIndex - 1}) 위치 교환`);
            }
            
            // battlePosition도 업데이트 (1 감소, 최소 0)
            enemy.battlePosition = Math.max(0, (enemy.battlePosition || 0) - 1);
            
            // 위치 교환이 없으면 그냥 완료
            if (frontArrayIndex === -1) {
                updateSelectedEnemy();
                onAdvanceComplete();
                return;
            }
            
            // ✅ DOM 요소 찾기 (gameState 교환 전!)
            const advancedEl = enemyEls.find(el => el.enemy === enemy);
            const swappedEl = enemyEls.find(el => el.enemy === frontEnemy);
            
            // gameState 배열 교환
            gameState.enemies[myArrayIndex] = frontEnemy;
            gameState.enemies[frontArrayIndex] = enemy;
            
            if (typeof gsap !== 'undefined' && advancedEl && swappedEl) {
                // FLIP - First: 현재 위치 저장
                const oldRects = enemyEls.map(el => el.getBoundingClientRect());
                
                if (advancedEl && swappedEl) {
                    // DOM에서 순서 바꾸기
                    if (swappedEl.nextSibling === advancedEl) {
                        container.insertBefore(advancedEl, swappedEl);
                    } else {
                        const placeholder = document.createElement('div');
                        container.insertBefore(placeholder, advancedEl);
                        container.insertBefore(advancedEl, swappedEl);
                        container.insertBefore(swappedEl, placeholder);
                        placeholder.remove();
                    }
                }
                
                // FLIP - Last & Invert & Play (통일된 3D API 사용)
                const newEnemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
                
                newEnemyEls.forEach((el, newIndex) => {
                    const oldIndex = enemyEls.indexOf(el);
                    if (oldIndex === -1) return;
                    
                    const oldRect = oldRects[oldIndex];
                    const newRect = el.getBoundingClientRect();
                    const diffX = oldRect.left - newRect.left;
                    
                    // data-index 업데이트
                    el.dataset.index = newIndex;
                    
                    // 3D 위치는 Background3D API 사용
                    const z3d = typeof Background3D !== 'undefined' 
                        ? Background3D.getEnemyZ(newIndex) 
                        : -80 - (newIndex * 20);
                    
                    if (Math.abs(diffX) > 1) {
                        gsap.fromTo(el, 
                            { x: diffX },
                            { 
                                x: 0, 
                                duration: 0.3, 
                                ease: 'power2.out',
                                onComplete: () => {
                                    el.style.transform = `translateZ(${z3d}px)`;
                                    el.style.transformStyle = 'preserve-3d';
                                }
                            }
                        );
                        
                        // 이동하는 적에게 착지 이펙트
                        if (el === advancedEl) {
                            setTimeout(() => {
                                const sprite = el.querySelector('.enemy-sprite-img');
                                if (sprite) {
                                    gsap.to(sprite, {
                                        scaleY: 0.92, scaleX: 1.08,
                                        duration: 0.08, yoyo: true, repeat: 1
                                    });
                                }
                                if (typeof VFX !== 'undefined') {
                                    const rect = el.getBoundingClientRect();
                                    VFX.sparks(rect.left + rect.width / 2, rect.bottom, {
                                        color: '#94a3b8', count: 8, speed: 60, size: 3
                                    });
                                }
                            }, 250);
                        }
                    } else {
                        el.style.transform = `translateZ(${z3d}px)`;
                        el.style.transformStyle = 'preserve-3d';
                    }
                });
                
                // 완료 콜백
                setTimeout(() => {
                    updateSelectedEnemy();
                    onAdvanceComplete();
                }, 350);
            } else {
                // GSAP 없으면 기본 방식
                renderEnemies(false);
                updateSelectedEnemy();
                onAdvanceComplete();
            }
        };
        
        if (enemy.intentAnimationKey && typeof MonsterAnimations !== 'undefined') {
            MonsterAnimations.execute(enemy.intentAnimationKey, {
                enemyEl,
                enemy,
                onComplete: executeAdvanceWithGSAP
            });
        } else {
            // 기본 전진 애니메이션 (GSAP)
            if (typeof gsap !== 'undefined' && enemyEl) {
                gsap.to(enemyEl, {
                    x: -100,
                    opacity: 0,
                    duration: 0.35,
                    ease: 'power2.in',
                    onComplete: executeAdvanceWithGSAP
                });
            } else if (enemyEl) {
                enemyEl.style.transition = 'transform 0.35s ease-out, opacity 0.2s';
                enemyEl.style.transform = 'translateX(-100px)';
                enemyEl.style.opacity = '0';
                setTimeout(executeAdvanceWithGSAP, 350);
            } else {
                executeAdvanceWithGSAP();
            }
        }
        
        updateUI();
        return; // ✅ 조기 리턴 - onComplete는 애니메이션 완료 후 호출됨
    } else if (intent === 'selfHarm') {
        // ==========================================
        // 광신도: 피의 의식 (자해 = 광기 증가)
        // ==========================================
        const selfDamage = intentValue;
        
        // 자해 (최소 HP 1 유지)
        const prevHp = enemy.hp;
        enemy.hp = Math.max(1, enemy.hp - selfDamage);
        const actualDamage = prevHp - enemy.hp;
        
        // 광기 스택 증가 = 자해한 만큼!
        const frenzyGain = actualDamage;
        enemy.frenzyStacks = (enemy.frenzyStacks || 0) + frenzyGain;
        
        addLog(`🩸 ${name}: 피의 의식! 자해 ${actualDamage} → 광기 +${frenzyGain} (현재: ${enemy.frenzyStacks})`, 'enemy');
        
        // 자해 이펙트
        if (enemyEl) {
            // 붉은 플래시
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.flash(enemyEl, { color: '#dc2626', duration: 300 });
            }
            
            // 피 스플래시 VFX
            if (typeof VFX !== 'undefined') {
                const rect = enemyEl.getBoundingClientRect();
                VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                    color: '#dc2626',
                    count: actualDamage * 3,  // 자해량에 비례
                    speed: 6
                });
            }
            
            // 자해 데미지 팝업
            if (typeof showDamagePopup === 'function') {
                showDamagePopup(enemyEl, actualDamage, 'self');
            }
            
            // 광기 증가 팝업 (딜레이)
            setTimeout(() => {
                const frenzyPopup = document.createElement('div');
                frenzyPopup.className = 'frenzy-popup';
                frenzyPopup.innerHTML = `🔥+${frenzyGain} 광기`;
                frenzyPopup.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 1.4rem;
                    font-weight: bold;
                    color: #f97316;
                    text-shadow: 0 0 10px #dc2626, 2px 2px 0 #000;
                    animation: frenzyFloat 1s ease-out forwards;
                    z-index: 100;
                    white-space: nowrap;
                `;
                enemyEl.appendChild(frenzyPopup);
                setTimeout(() => frenzyPopup.remove(), 1000);
            }, 400);
        }
        
        // 패시브 UI 업데이트
        if (typeof MonsterPassiveSystem !== 'undefined') {
            MonsterPassiveSystem.updateDisplayForEnemy(enemy, enemyIndex);
        }
        
        updateEnemiesUI();
    } else if (intent === 'frenzyAttack') {
        // ==========================================
        // 광신도: 광기의 폭발 (광기 스택 기반 공격)
        // ==========================================
        const baseDamage = intentValue;
        const frenzyBonus = enemy.frenzyStacks || 0;  // x1 배율로 조정
        const totalDamage = baseDamage + frenzyBonus;
        
        addLog(`🔥 ${name}: 광기의 폭발! (${baseDamage} + 광기 ${enemy.frenzyStacks || 0}×2 = ${totalDamage})`, 'danger');
        
        // 강력한 공격 이펙트
        if (enemyEl && playerEl) {
            // 적 오라 효과
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.enemyAttack(enemyEl, playerEl, totalDamage);
                EffectSystem.screenFlash('#dc2626', 300);
                EffectSystem.screenShake(12, 400);
            }
            
            // 불꽃 파티클
            if (typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.fire(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                    count: 25,
                    spread: 80
                });
            }
        }
        
        // 데미지 적용 (딜레이)
        setTimeout(() => {
            const result = dealDamage(gameState.player, totalDamage);
            
            if (result.blockedDamage > 0) {
                addLog(`방어도로 ${result.blockedDamage} 흡수!`, 'block');
            }
            
            // 광기 스택 전부 소모 (한번 터지면 다시 모아야 함)
            const usedFrenzy = enemy.frenzyStacks || 0;
            enemy.frenzyStacks = 0;
            addLog(`💨 광기 전부 소진! (${usedFrenzy} → 0)`, 'info');
            
            // 패시브 UI 업데이트
            if (typeof MonsterPassiveSystem !== 'undefined') {
                MonsterPassiveSystem.updateDisplayForEnemy(enemy, enemyIndex);
            }
            
            updateEnemiesUI();
        }, 400);
    }
    
    // 공격 시 패시브 처리 (MonsterPassiveSystem에서 관리)
    if (intent === 'attack' && typeof MonsterPassiveSystem !== 'undefined') {
        setTimeout(() => {
            MonsterPassiveSystem.onEnemyAttack(enemy, enemyIndex);
        }, 500);
    }
    
    // 일반 적 행동 완료 콜백 (도플갱어가 아닌 경우)
    if (onComplete) {
        // 행동에 따른 적절한 딜레이 후 완료 콜백
        const actionDelay = (intent === 'attack') ? 600 : 400;
        setTimeout(onComplete, actionDelay);
    }
}

// ==========================================
// 고블린 킹 소환 시스템
// ==========================================
function summonMinion(minionId, summoner) {
    console.log(`[Summon] 소환 시도: ${minionId}`);
    
    // 최대 적 수 제한 (5마리)
    if (gameState.enemies.length >= 5) {
        addLog(`Summon failed: Field full`, 'warning');
        return;
    }
    
    // 몬스터 데이터 찾기
    const minionData = findEnemyByName(minionId);
    if (!minionData) {
        console.error(`[Summon] 몬스터를 찾을 수 없음: ${minionId}`);
        addLog(`Summon failed: ${minionId} not found`, 'warning');
        return;
    }
    
    console.log(`[Summon] 몬스터 데이터 찾음:`, minionData.name);
    
    // createEnemy 함수 사용하여 적절한 인스턴스 생성
    const minion = createEnemy(minionData, 0);
    minion.isSummoned = true;
    minion.summonedBy = summoner.id;
    
    // 적 배열에 추가
    gameState.enemies.push(minion);
    
    console.log(`[Summon] 적 추가 완료, 총 ${gameState.enemies.length}마리`);
    
    // 인텐트 결정
    decideEnemyIntentForEnemy(minion);
    
    // 새 미니언만 추가 (기존 적은 애니메이션 없이 유지)
    addMinionToDisplay(minion);
    
    // 소환 효과
    addLog(`${minion.name} summoned!`, 'warning');
    
    // 소환된 적 요소에 애니메이션
    setTimeout(() => {
        const newIndex = gameState.enemies.indexOf(minion);
        const newEnemyEl = getEnemyElement(newIndex);
        if (newEnemyEl) {
            newEnemyEl.classList.add('summoned');
            setTimeout(() => newEnemyEl.classList.remove('summoned'), 1000);
        }
    }, 100);
}

// 모든 부하 버프
function buffAllMinions(buffSource, buffAmount) {
    gameState.enemies.forEach((enemy, idx) => {
        // 버프 준 본인은 제외 (선택사항: 포함하고 싶으면 조건 제거)
        if (enemy === buffSource) return;
        if (enemy.hp <= 0) return;
        
        // BuffSystem 사용하여 버프 적용
        if (typeof BuffSystem !== 'undefined') {
            BuffSystem.applyBuff(enemy, 'battleCry', buffAmount, buffSource);
            
            // 버프 이펙트 표시
            const enemyEl = getEnemyElement(idx);
            if (enemyEl) {
                const buffData = BuffSystem.buffDatabase.battleCry;
                BuffSystem.showBuffEffect(enemyEl, {
                    ...buffData,
                    value: buffAmount
                });
            }
        } else {
            // fallback: BuffSystem 없을 때
            if (enemy.attackBuff === undefined) {
                enemy.attackBuff = 0;
            }
            enemy.attackBuff += buffAmount;
            
            if (enemy.intent === 'attack') {
                enemy.intentValue += buffAmount;
            }
        }
        
        // 버프 이펙트
        const enemyEl = getEnemyElement(idx);
        if (enemyEl && typeof EffectSystem !== 'undefined') {
            EffectSystem.buff(enemyEl);
        }
        
        addLog(`${enemy.name} ATK +${buffAmount}!`, 'buff');
    });
    
    // UI 업데이트
    updateEnemiesUI();
    
    // 버프 인디케이터 업데이트
    if (typeof BuffSystem !== 'undefined') {
        BuffSystem.updateAllEnemiesBuffDisplay();
    }
}

// 모든 아군(자신 제외) 방어도 부여
function defendAllMinions(defendSource, blockAmount) {
    gameState.enemies.forEach((enemy, idx) => {
        // 방어도 준 본인은 제외
        if (enemy === defendSource) return;
        if (enemy.hp <= 0) return;
        
        // 방어도 추가
        enemy.block = (enemy.block || 0) + blockAmount;
        
        // 방어 이펙트
        const enemyEl = getEnemyElement(idx);
        if (enemyEl) {
            // 방어막 플래시 클래스 추가
            enemyEl.classList.add('block-flash');
            setTimeout(() => enemyEl.classList.remove('block-flash'), 400);
            
            // has-block 클래스 추가 (파란 외곽선)
            enemyEl.classList.add('has-block');
            
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.defend(enemyEl);
            }
            if (typeof VFX !== 'undefined') {
                const rect = enemyEl.getBoundingClientRect();
                VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, {
                    color: '#60a5fa', count: 12, speed: 80, size: 4
                });
            }
        }
        
        addLog(`🛡️ ${enemy.name} 방어도 +${blockAmount}!`, 'buff');
    });
    
    // UI 업데이트
    updateEnemiesUI();
}

// 모든 아군(자신 포함) 회복
function healAllMinions(healSource, healAmount) {
    gameState.enemies.forEach((enemy, idx) => {
        if (enemy.hp <= 0) return;
        
        const actualHeal = Math.min(healAmount, enemy.maxHp - enemy.hp);
        if (actualHeal <= 0) return;
        
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
        
        // 🩹 힐 게이지 연출
        const enemyEl = getEnemyElement(idx);
        if (enemyEl) {
            if (typeof HealSystem !== 'undefined') {
                // 딜레이를 줘서 순차적으로 힐 연출
                setTimeout(() => {
                    HealSystem.animateEnemyHeal(enemy, idx, actualHeal);
                    HealSystem.showHealPopup(enemyEl, actualHeal);
                }, idx * 150);
            } else {
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.heal(enemyEl, { color: '#4ade80' });
                }
                if (typeof VFX !== 'undefined') {
                    const rect = enemyEl.getBoundingClientRect();
                    VFX.heal(rect.left + rect.width / 2, rect.top + rect.height / 2, { 
                        color: '#4ade80', 
                        count: 10 
                    });
                }
                if (typeof showDamagePopup === 'function') {
                    showDamagePopup(enemyEl, actualHeal, 'heal');
                }
            }
        }
        
        addLog(`${enemy.name} HP +${actualHeal}!`, 'heal');
    });
}

function getEnemyElement(index) {
    // 다중 적 컨테이너에서 요소 찾기
    const container = document.getElementById('enemies-container');
    if (container) {
        return container.querySelector(`[data-index="${index}"]`);
    }
    // 하위 호환성: 기존 enemy 요소
    return document.getElementById('enemy');
}

// 현재 선택된 적 요소 가져오기 (카드 이펙트용)
function getSelectedEnemyElement() {
    const container = document.getElementById('enemies-container');
    if (container) {
        return container.querySelector(`[data-index="${gameState.selectedEnemyIndex}"]`);
    }
    return document.getElementById('enemy');
}

// 새 턴 시작 (플레이어 턴)
function startNewTurn() {
    gameState.turn++;
    gameState.isPlayerTurn = true;
    
    // 🎬 카메라 효과: 플레이어 턴
    if (typeof CameraEffects !== 'undefined') {
        CameraEffects.onPlayerTurn();
    }
    
    // ⛓ 저주 카드 "속박" 피해 처리 (덱 또는 손패에 있으면 매 턴 1 피해)
    const allCards = [...(gameState.deck || []), ...(gameState.hand || []), ...(gameState.discardPile || [])];
    const curseBindingCount = allCards.filter(c => c.id === 'curse_binding').length;
    if (curseBindingCount > 0) {
        const curseDamage = curseBindingCount;
        gameState.player.hp = Math.max(1, gameState.player.hp - curseDamage);
        addLog(`Curse "Binding" deals ${curseDamage} damage!`, 'debuff');
        
        // 피해 이펙트 (화면 흔들림 + 플래시)
        const playerEl = document.getElementById('player');
        if (playerEl) {
            // 화면 흔들림
            if (typeof EffectSystem !== 'undefined' && EffectSystem.screenShake) {
                EffectSystem.screenShake(5, 200);
            }
            // 플레이어 피격 플래시
            playerEl.style.filter = 'brightness(2) saturate(0.5)';
            setTimeout(() => {
                playerEl.style.filter = '';
            }, 150);
        }
    }
    
    // 🔧 플레이어 필터/스타일 안전 리셋 (가시 반격 등으로 인한 빛남 버그 방지)
    const playerEl = document.getElementById('player');
    if (playerEl) {
        playerEl.style.filter = '';
        playerEl.style.transition = '';
        // 스프라이트 이미지도 리셋
        const playerSprite = playerEl.querySelector('.player-sprite-img, img');
        if (playerSprite) {
            playerSprite.style.filter = '';
            playerSprite.style.transition = '';
        }
    }
    
    // 턴 통계 초기화
    gameState.turnStats = {
        attackCardsPlayed: 0,
        skillCardsPlayed: 0,
        totalCardsPlayed: 0
    };
    
    // 트라이포스 시스템 리셋
    if (typeof TriforceSystem !== 'undefined') {
        TriforceSystem.reset();
    }
    
    // 🔮 영창 시스템 턴 시작
    if (typeof IncantationSystem !== 'undefined' && IncantationSystem.isActive) {
        IncantationSystem.onTurnStart();
    }
    
    // 응집된 일격 코스트 리셋 (새 턴이므로 3으로)
    resetConcentratedStrikeCosts();
    
    // ✅ 플레이어 턴 시작 시 플레이어 방어도만 초기화
    // (적의 방어도는 적 턴 시작 시 초기화됨)
    const playerPrevBlock = ShieldSystem.resetBlockOnTurnStart(gameState.player);
    if (playerPrevBlock > 0) {
        addLog(`Block lost (${playerPrevBlock})`, 'block');
    }
    
    // 적 상태이상 감소 (취약 등)
    gameState.enemies.forEach(enemy => {
        if (enemy.vulnerable && enemy.vulnerable > 0) {
            enemy.vulnerable--;
            if (enemy.vulnerable === 0) {
                addLog(`${enemy.name} vulnerable removed`, 'buff');
            }
        }
    });
    
    // 플레이어 실명 감소
    if (gameState.player.blind > 0) {
        gameState.player.blind--;
        if (gameState.player.blind === 0) {
            addLog('Blind removed!', 'buff');
        } else {
            addLog(`Blind: ${gameState.player.blind} turns left`, 'debuff');
        }
        updateBlindIndicator();
    }
    
    // 플레이어 취약 감소
    if (gameState.player.vulnerable > 0) {
        gameState.player.vulnerable--;
        if (gameState.player.vulnerable === 0) {
            addLog('Vulnerable removed!', 'buff');
        } else {
            addLog(`Vulnerable: ${gameState.player.vulnerable} turns`, 'debuff');
        }
        updatePlayerStatusUI();
    }
    
    // 플레이어 도발 감소
    if (gameState.player.taunt > 0) {
        gameState.player.taunt--;
        if (gameState.player.taunt === 0) {
            addLog('도발 해제!', 'buff');
        } else {
            addLog(`도발: ${gameState.player.taunt}턴 남음`, 'debuff');
        }
        updatePlayerStatusUI();
    }
    
    // 에너지 회복
    gameState.player.energy = gameState.player.maxEnergy;
    
    // ⚔️ 브레이브 시스템: 빚 상환 (전사 전용)
    if (typeof BraveSystem !== 'undefined') {
        BraveSystem.onTurnStart();
        
        // 전투 본능 파워: 매 턴 자동 브레이브
        if (gameState.player.battleInstinct && BraveSystem.isActive()) {
            BraveSystem.useBrave(1);
        }
    }
    
    // 새 의도 (숨김 상태로 결정)
    gameState.intentsHidden = true;
    decideEnemyIntent();
    
    // 인텐트 공개 애니메이션 (약간의 딜레이 후)
    setTimeout(() => {
        revealEnemyIntents();
    }, 300);
    
    // 첫 턴이면 선천성(Innate) 카드 먼저 손패에
    if (gameState.turn === 1) {
        drawInnateCards();
    }
    
    // 카드 뽑기
    drawCards(PlayerBaseStats.getDrawPerTurn());
    
    addLog(`Turn ${gameState.turn}`);
    updateUI();
    updateTurnIndicator();
    
    // 플레이어 턴 연출
    if (typeof TurnEffects !== 'undefined') {
        TurnEffects.showPlayerTurn(gameState.turn);
    }
    
    // 턴 시작 유물 효과 발동
    if (typeof RelicSystem !== 'undefined') {
        RelicSystem.ownedRelics.forEach(relic => {
            if (relic.onTurnStart) {
                relic.onTurnStart(gameState);
            }
        });
    }
}

// ==========================================
// 인텐트 공개 애니메이션
// ==========================================
function revealEnemyIntents() {
    gameState.intentsHidden = false;
    
    const intentDisplays = document.querySelectorAll('.enemy-intent-display');
    intentDisplays.forEach((intentEl, index) => {
        // 숨김 클래스 제거
        intentEl.classList.remove('intent-hidden');
        
        // 등장 애니메이션 클래스 추가
        intentEl.classList.add('intent-reveal');
        
        // 애니메이션 후 클래스 제거
        setTimeout(() => {
            intentEl.classList.remove('intent-reveal');
        }, 500);
    });
    
    // 브레이크 시스템 UI 업데이트 (인텐트 공개 후)
    if (typeof BreakSystem !== 'undefined') {
        gameState.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                BreakSystem.updateBreakUI(enemy);
            }
        });
    }
}

// ==========================================
// UI 업데이트
// ==========================================
function updateTurnIndicator() {
    if (!elements.turnText) return;
    
    if (gameState.isPlayerTurn) {
        elements.turnText.textContent = `Turn ${gameState.turn}`;
        elements.turnText.style.color = '#4fc3f7';
    } else {
        elements.turnText.textContent = `Enemy Turn`;
        elements.turnText.style.color = '#f87171';
    }
}

function updateUI() {
    // 플레이어 HP
    const playerHpPercent = (gameState.player.hp / gameState.player.maxHp) * 100;
    elements.playerHpBar.style.width = `${playerHpPercent}%`;
    elements.playerHpText.textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
    
    // 플레이어 방어도 (ShieldSystem 사용)
    ShieldSystem.updateBlockUI(gameState.player);
    
    // 적 HP (다중 적 시스템 사용)
    if (gameState.enemies && gameState.enemies.length > 0) {
        updateEnemiesUI();
    } else if (gameState.enemy && elements.enemyHpBar && elements.enemyHpText) {
        // 하위 호환성: 단일 적
        const enemyHpPercent = (gameState.enemy.hp / gameState.enemy.maxHp) * 100;
        elements.enemyHpBar.style.width = `${enemyHpPercent}%`;
        elements.enemyHpText.textContent = `${gameState.enemy.hp}/${gameState.enemy.maxHp}`;
        ShieldSystem.updateBlockUI(gameState.enemy);
    }
    
    // 에너지
    elements.energyText.textContent = `${gameState.player.energy}/${gameState.player.maxEnergy}`;
    
    updateCardStates();
    updatePileCounts();
    
    // TopBar 업데이트
    if (typeof TopBar !== 'undefined' && TopBar.isVisible) {
        TopBar.updateHP();
        TopBar.updateBuffs();
    }
}

function updateCardStates() {
    const cards = elements.hand.querySelectorAll('.card');
    cards.forEach((cardEl, index) => {
        const card = gameState.hand[index];
        if (card && card.cost > gameState.player.energy) {
            cardEl.classList.add('disabled');
        } else {
            cardEl.classList.remove('disabled');
        }
    });
}

function updatePileCounts() {
    elements.drawCount.textContent = gameState.drawPile.length;
    elements.discardCount.textContent = gameState.discardPile.length;
    
    // 버리기 더미 시각화
    const discardPile = document.querySelector('.discard-pile .pile-cards');
    if (gameState.discardPile.length > 0) {
        discardPile.classList.remove('empty');
    } else {
        discardPile.classList.add('empty');
    }
}

// ==========================================
// 로그 시스템
// ==========================================
function addLog(message, type = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    elements.logEntries.insertBefore(entry, elements.logEntries.firstChild);
    
    while (elements.logEntries.children.length > 15) {
        elements.logEntries.removeChild(elements.logEntries.lastChild);
    }
}

function clearLog() {
    elements.logEntries.innerHTML = '';
}

// ==========================================
// 게임 종료 처리
// ==========================================
function victory() {
    console.log('=== victory() 호출 ===');
    console.log(`gameState.enemy.name: ${gameState.enemy?.name}`);
    console.log(`gameState.currentBattleType: ${gameState.currentBattleType}`);
    
    // 🛡️ 인텐트 안전 체크 중지
    stopIntentSafetyCheck();
    
    // ⚡ 에너지 볼트 정리
    if (typeof EnergyBoltSystem !== 'undefined') {
        EnergyBoltSystem.clear();
    }
    
    // 잡힌 NPC 제거
    if (typeof NPCDisplaySystem !== 'undefined') {
        NPCDisplaySystem.removeCapturedNpc();
    }
    
    // NPC 구출 체크 (적 이름, 전투 타입, 층 수 기반)
    const rescueNpcId = typeof NPCDisplaySystem !== 'undefined' 
        ? NPCDisplaySystem.checkRescueOnVictory(
            gameState.enemy.name,
            gameState.currentBattleType,
            gameState.battleCount
          )
        : null;
    
    console.log(`rescueNpcId: ${rescueNpcId}`);
    
    gameState.battleCount++;
    
    // 구출할 NPC가 있으면 구출 이벤트 표시 후 보상으로 진행
    if (rescueNpcId) {
        console.log(`[Victory] 구출 이벤트 시작: ${rescueNpcId}`);
        NPCDisplaySystem.showRescueEvent(rescueNpcId, () => {
            console.log('[Victory] 구출 이벤트 완료, continueVictory 호출');
            continueVictory();
        });
        return;
    }
    
    console.log('[Victory] 구출 없음, continueVictory 호출');
    continueVictory();
}

// 구출 이벤트 후 승리 처리 계속
function continueVictory() {
    // 🎬 카메라 효과 종료
    if (typeof CameraEffects !== 'undefined') {
        CameraEffects.onBattleEnd();
    }
    
    // 승리 연출 후 카드 보상 표시
    if (typeof TurnEffects !== 'undefined') {
        TurnEffects.showVictory(() => {
            // 연출 완료 후 카드 보상 표시
            showVictoryReward();
        });
    } else {
        // TurnEffects 없으면 바로 보상 표시
        showVictoryReward();
    }
}

// 승리 보상 처리 (연출 완료 후 호출)
function showVictoryReward() {
    // 엘리트/보스 전투시 유물 보상
    const isElite = gameState.currentBattleType === 'elite';
    const isBoss = gameState.currentBattleType === 'boss';
    let relicReward = null;
    
    if (isElite || isBoss) {
        relicReward = getRandomRelicReward(isBoss ? 'rare' : 'uncommon');
    }
    
    // 골드 보상 계산
    let goldReward = 15 + Math.floor(Math.random() * 10); // 기본 15~25
    if (isElite) goldReward += 25; // 엘리트 +25
    if (isBoss) goldReward += 50;  // 보스 +50
    goldReward += gameState.battleCount * 2; // 층 보너스
    
    // 골드 지급 (영구 저장)
    if (typeof GoldSystem !== 'undefined') {
        GoldSystem.addGold(goldReward);
    }
    gameState.gold = (gameState.gold || 0) + goldReward; // 현재 런 골드도 추가
    
    // 3개의 보상 카드 생성
    const rewardCards = [];
    for (let i = 0; i < 3; i++) {
        let card = getRandomRewardCard();
        // 중복 방지
        while (rewardCards.some(c => c.id === card.id)) {
            card = getRandomRewardCard();
        }
        rewardCards.push(card);
    }
    
    // 카드 선택 UI 표시
    showCardRewardSelection(rewardCards, relicReward, goldReward);
}

// ==========================================
// 이벤트 리스너
// ==========================================
elements.endTurnBtn.addEventListener('click', endTurn);

elements.modalBtn.addEventListener('click', () => {
    elements.modal.classList.remove('show');
    elements.modalTitle.style.color = '';
    
    if (gameState.player.hp <= 0) {
        // 게임 오버 - 모든 것을 잃고 타운으로 귀환
        handleDefeatAndReturnToTown();
    } else {
        // 승리 - 맵으로 돌아가기
        
        // 미믹 전투 승리 시 유물 보상
        if (gameState.mimicReward && typeof TreasureSystem !== 'undefined') {
            TreasureSystem.onMimicVictory();
        }
        
        if (typeof MapSystem !== 'undefined') {
            MapSystem.onBattleWin();
        } else {
            startBattle();
        }
    }
});

// ==========================================
// 패배 후 타운 복귀 처리
// ==========================================
function handleDefeatAndReturnToTown() {
    console.log('[Game] 패배 처리 - 타운으로 귀환');
    
    // 세이브 데이터 삭제
    if (typeof SaveSystem !== 'undefined') {
        SaveSystem.deleteSave();
    }
    
    // 패배 연출 제거
    const defeatContainer = document.querySelector('.ds-defeat-container');
    if (defeatContainer) {
        defeatContainer.remove();
    }
    
    // 모든 모달/오버레이 제거
    document.querySelectorAll('.event-modal, .reward-modal, .ds-victory-container, .result-modal').forEach(el => el.remove());
    
    // 카메라 효과 종료
    if (typeof CameraEffects !== 'undefined') {
        CameraEffects.endCombat();
    }
    
    // 전투 UI 숨기기
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    
    // 덱 초기화 (기본 덱으로)
    if (typeof initializePlayer !== 'undefined') {
        initializePlayer();
    }
    
    // 유물 초기화
    gameState.relics = [];
    if (typeof RelicSystem !== 'undefined') {
        RelicSystem.ownedRelics = [];
        RelicSystem.updateRelicUI();
    }
    
    // 골드 초기화
    gameState.gold = 0;
    if (typeof GoldSystem !== 'undefined') {
        GoldSystem.reset();
    }
    
    // 맵 초기화
    if (typeof MapSystem !== 'undefined') {
        MapSystem.currentFloor = 0;
        MapSystem.currentStage = 1;
        MapSystem.roomsCleared = 0;
        MapSystem.rooms = [];
        MapSystem.roomGrid = [];
        MapSystem.currentRoom = null;
        MapSystem.hideMap();
    }
    
    // 캠프 상태 초기화
    if (typeof CampEvent !== 'undefined') {
        CampEvent.usedRest = false;
        CampEvent.usedForge = false;
    }
    
    // 전투 카운트 초기화
    gameState.battleCount = 0;
    gameState.inBattle = false;
    
    // TopBar 숨기기
    if (typeof TopBar !== 'undefined') {
        TopBar.hide();
    }
    
    // 약간의 딜레이 후 타운으로 이동 (UI 정리 시간)
    setTimeout(() => {
        if (typeof TownSystem !== 'undefined') {
            TownSystem.showWithIntro(true);
            console.log('[Game] 타운으로 이동 완료');
        } else {
            // TownSystem이 없으면 타이틀로
            location.reload();
        }
    }, 100);
}

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // 모달이나 입력창이 열려있으면 무시
    if (document.querySelector('.event-modal, .reward-modal, .card-select-modal') ||
        e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // 맵이 열려있으면 전투 단축키 무시 (맵에서 Enter 처리)
    if (typeof MapSystem !== 'undefined' && MapSystem.isMapVisible) {
        return;
    }
    
    // 이벤트 UI가 열려있으면 무시
    if (document.querySelector('.tarot-event, .tarot-intro, #tarot-transition-overlay')) {
        return;
    }
    
    // 턴 종료: E, Enter
    if (e.key === 'e' || e.key === 'E' || e.key === 'ㄷ' || e.key === 'Enter') {
        e.preventDefault();
        endTurn();
    }
    
    // 카드 선택: 1~9
    if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < gameState.hand.length) {
            playCardWithHotkeyAnimation(index);
        }
    }
});

// 🎴 단축키 카드 사용 잠금 (연타 방지)
let isHotkeyCardPlaying = false;

// 🎴 단축키로 카드 사용 시 타겟으로 날아가는 애니메이션
function playCardWithHotkeyAnimation(index) {
    // 연타 방지: 이미 카드 사용 중이면 무시
    if (isHotkeyCardPlaying) return;
    
    const card = gameState.hand[index];
    if (!card) return;
    
    // 카드 DOM 요소 찾기
    const handEl = document.getElementById('hand');
    const cardEls = handEl?.querySelectorAll('.card');
    const cardEl = cardEls?.[index];
    
    // 에너지 체크
    if (gameState.player.energy < card.cost) {
        // 에너지 부족 시 카드 흔들림 애니메이션
        if (cardEl) {
            cardEl.classList.add('cant-play-shake');
            setTimeout(() => {
                cardEl.classList.remove('cant-play-shake');
            }, 450);
        }
        return;
    }
    
    // 사용 불가 카드 체크
    if (card.unplayable) {
        if (cardEl) {
            cardEl.classList.add('cant-play-shake');
            setTimeout(() => {
                cardEl.classList.remove('cant-play-shake');
            }, 450);
        }
        return;
    }
    
    if (!cardEl) {
        isHotkeyCardPlaying = true;
        playCard(index);
        setTimeout(() => { isHotkeyCardPlaying = false; }, 300);
        return;
    }
    
    // 🔒 잠금 시작
    isHotkeyCardPlaying = true;
    
    // 타겟 결정
    const cardType = card.type?.id || card.type;
    let targetEl;
    
    if (cardType === 'attack' || cardType === CardType.ATTACK) {
        // 공격: 선택된 적 또는 첫 번째 적
        targetEl = document.querySelector('.enemy-unit.selected:not(.dead)') ||
                   document.querySelector('.enemy-unit:not(.dead)') ||
                   document.getElementById('enemy');
    } else {
        // 스킬/파워: 플레이어
        targetEl = document.getElementById('player');
    }
    
    if (!targetEl) {
        playCard(index);
        return;
    }
    
    // 카드 고스트 생성
    const cardRect = cardEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    
    const ghost = cardEl.cloneNode(true);
    ghost.className = cardEl.className + ' hotkey-ghost';
    ghost.style.cssText = `
        position: fixed;
        left: ${cardRect.left + cardRect.width / 2}px;
        top: ${cardRect.top + cardRect.height / 2}px;
        width: ${cardRect.width}px;
        height: ${cardRect.height}px;
        transform: translate(-50%, -50%) scale(1);
        z-index: 10000;
        pointer-events: none;
        transition: all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(ghost);
    
    // 원본 카드 숨기기
    cardEl.style.opacity = '0.3';
    
    // 타겟으로 날아가기
    requestAnimationFrame(() => {
        ghost.style.left = `${targetRect.left + targetRect.width / 2}px`;
        ghost.style.top = `${targetRect.top + targetRect.height / 2}px`;
        ghost.style.transform = 'translate(-50%, -50%) scale(0.7) rotate(-5deg)';
    });
    
    // 찰싹 효과 + 카드 사용
    setTimeout(() => {
        if (typeof CardDragSystem !== 'undefined' && CardDragSystem.playCardSlapEffect) {
            CardDragSystem.playCardSlapEffect(ghost, () => {
                ghost.remove();
                cardEl.style.opacity = '';
                playCard(index);
                // 🔓 잠금 해제 (카드 사용 후 딜레이)
                setTimeout(() => { isHotkeyCardPlaying = false; }, 200);
            });
        } else {
            ghost.remove();
            cardEl.style.opacity = '';
            playCard(index);
            // 🔓 잠금 해제
            setTimeout(() => { isHotkeyCardPlaying = false; }, 200);
        }
    }, 150);
}

// ==========================================
// 게임 시작
// ==========================================
initGame();

// ==========================================
// 게임 캔버스 드래그 방지
// ==========================================
document.addEventListener('dragstart', (e) => {
    // 카드 드래그만 허용, 나머지는 방지
    if (!e.target.closest('.card')) {
        e.preventDefault();
    }
});

document.addEventListener('selectstart', (e) => {
    // 텍스트 선택 방지 (입력 필드 제외)
    if (!e.target.matches('input, textarea')) {
        e.preventDefault();
    }
});

// 우클릭 메뉴 방지 (게임 환경)
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.game-container, .map-screen')) {
        e.preventDefault();
    }
});
