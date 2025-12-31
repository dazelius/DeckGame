// ==========================================
// Shadow Deck - 기본 지급 덱 & 유물 관리
// ==========================================

// ==========================================
// 기본 덱 설정 (실제 게임 시작 시 지급)
// ==========================================
const StarterDeckConfig = {
    // 공격 카드
    attacks: {
        strike: 5,              // 슬래시 5장
        bash: 1,                // 강타 1장
        concentratedStrike: 1,  // 응집된 일격 1장
        finisher: 1,            // 처형의 칼날 1장
    },
    
    // 스킬 카드
    skills: {
        defend: 5,              // 방어 5장
    },
    
    // 파워 카드
    powers: {
        // 추후 추가
    }
};

// ==========================================
// 테스터 덱 설정 (치트 모드용)
// ==========================================
const TesterDeckConfig = {
    // 공격 카드
    attacks: {
        strike: 1,              // 슬래시 1장
        bash: 1,                // 강타 1장
        flurry: 1,              // 연속 찌르기 1장
        finisher: 1,            // 처형의 칼날 1장
        concentratedStrike: 1,  // 응집된 일격 1장
        dirtyStrike: 1,         // 비열한 일격 1장
        plunder: 1,             // 강탈 1장
        battleOpening: 1,       // 전투 개막 1장 (선천성/소멸)
        chakramThrow: 5,        // 차크람 던지기 5장
        brutalSever: 2,         // 💀 무자비한 절단 2장 (오버킬 테스트용)
    },
    
    // 스킬 카드
    skills: {
        defend: 4,              // 방어 4장
        dagger: 1,              // 단도 1장
        dodge: 1,               // 닷지 1장
        triforcePower: 1,       // 트라이포스: 힘
        triforceCourage: 1,     // 트라이포스: 용기
        triforceWisdom: 1,      // 트라이포스: 지혜
        generalStore: 1,        // 만물상 1장
        energize: 1,            // 충전 1장
        energyBolt: 3,          // 에너지 볼트 3장
    },
    
    // 파워 카드
    powers: {
        // 추후 추가
    }
};

// 테스터 유물 설정
const TesterRelicsConfig = [
    'criticalStrike',    // 회심 - 7번째 공격 크리티컬
    'relentlessAttack',  // 거침없는 공격 - 연속 공격 보너스
    'deepWound',         // 후벼파기 - 같은 적 두 번 공격 시 출혈
    'phoenixFeather',    // 불사조 깃털 - 사망 시 부활
    'energyCrystal',     // 에너지 결정 - 매 턴 +1 에너지
];

// ==========================================
// 스타터 유물 설정 (기본 게임용 - 최소화)
// ==========================================
const StarterRelicsConfig = [
    // 기본 게임은 유물 없이 시작
];

// ==========================================
// 게임 시작 시 기본 조력자 (null이면 없음)
// ==========================================
const StarterAllyConfig = null; // 기본 게임은 조력자 없음

// 테스터 조력자 설정
const TesterAllyConfig = 'spiritArcher'; // 엘프아처

// ==========================================
// 덱 생성 함수 (카드 ID 배열 반환)
// ==========================================
function buildDeckFromConfig(config) {
    const deck = [];
    
    // 공격 카드 추가
    for (const [cardId, count] of Object.entries(config.attacks || {})) {
        for (let i = 0; i < count; i++) {
            deck.push(cardId);
        }
    }
    
    // 스킬 카드 추가
    for (const [cardId, count] of Object.entries(config.skills || {})) {
        for (let i = 0; i < count; i++) {
            deck.push(cardId);
        }
    }
    
    // 파워 카드 추가
    for (const [cardId, count] of Object.entries(config.powers || {})) {
        for (let i = 0; i < count; i++) {
            deck.push(cardId);
        }
    }
    
    return deck;
}

// 카드 ID 배열을 카드 객체 배열로 변환
function convertDeckToCards(deckIds) {
    if (typeof createCard === 'undefined') {
        console.warn('[Starter] createCard function not available');
        return [];
    }
    
    const cards = [];
    for (const cardId of deckIds) {
        const card = createCard(cardId);
        if (card) {
            cards.push(card);
            console.log(`[Starter] 카드 생성 성공: ${cardId} -> ${card.name}`);
        } else {
            console.error(`[Starter] 카드 생성 실패: ${cardId}`);
        }
    }
    return cards;
}

// 기본 덱 생성 함수 (JobSystem 우선 사용)
function buildStarterDeck() {
    // JobSystem이 있으면 현재 직업의 덱 사용
    if (typeof JobSystem !== 'undefined') {
        const jobDeck = JobSystem.getJobDeck();
        if (jobDeck) {
            console.log(`[Starter] 직업 덱 사용: ${JobSystem.getCurrentJob().name}`);
            return buildDeckFromConfig(jobDeck);
        }
    }
    // 기본 덱
    return buildDeckFromConfig(StarterDeckConfig);
}

// 테스터 덱 생성 함수
function buildTesterDeck() {
    return buildDeckFromConfig(TesterDeckConfig);
}

// 기본 덱 배열 (카드 ID 문자열 배열 - game.js의 loadPlayerDeck에서 사용)
const starterDeck = buildStarterDeck();

// ==========================================
// 덱 정보 출력 (디버깅용)
// ==========================================
function printDeckInfo(config, title) {
    console.log(`=== ${title} ===`);
    
    let totalCards = 0;
    
    console.log('\n[공격 카드]');
    for (const [cardId, count] of Object.entries(config.attacks || {})) {
        const card = typeof cardDatabase !== 'undefined' ? cardDatabase[cardId] : null;
        if (card) {
            console.log(`  ${card.icon} ${card.name}: ${count}장`);
            totalCards += count;
        } else {
            console.log(`  ${cardId}: ${count}장`);
            totalCards += count;
        }
    }
    
    console.log('\n[스킬 카드]');
    for (const [cardId, count] of Object.entries(config.skills || {})) {
        const card = typeof cardDatabase !== 'undefined' ? cardDatabase[cardId] : null;
        if (card) {
            console.log(`  ${card.icon} ${card.name}: ${count}장`);
            totalCards += count;
        } else {
            console.log(`  ${cardId}: ${count}장`);
            totalCards += count;
        }
    }
    
    console.log('\n[파워 카드]');
    for (const [cardId, count] of Object.entries(config.powers || {})) {
        const card = typeof cardDatabase !== 'undefined' ? cardDatabase[cardId] : null;
        if (card) {
            console.log(`  ${card.icon} ${card.name}: ${count}장`);
            totalCards += count;
        } else {
            console.log(`  ${cardId}: ${count}장`);
            totalCards += count;
        }
    }
    
    console.log(`\n총 ${totalCards}장`);
    console.log('==================');
}

function printStarterDeckInfo() {
    printDeckInfo(StarterDeckConfig, '기본 덱');
}

function printTesterDeckInfo() {
    printDeckInfo(TesterDeckConfig, '테스터 덱');
}

// ==========================================
// 테스터 모드 활성화 함수 (치트)
// ==========================================
function activateTesterMode() {
    if (typeof gameState === 'undefined') {
        console.warn('[Tester] gameState not found');
        return;
    }
    
    console.log('[Tester] 🎮 테스터 모드 활성화!');
    
    // 카드 데이터베이스 확인
    if (typeof cardDatabase === 'undefined') {
        console.error('[Tester] cardDatabase가 로드되지 않음!');
        return;
    }
    
    // 테스터 덱으로 교체 (카드 ID -> 카드 객체 변환)
    const testerDeckIds = buildTesterDeck();
    console.log('[Tester] 덱 ID 목록:', testerDeckIds);
    
    const testerDeck = convertDeckToCards(testerDeckIds);
    console.log('[Tester] 생성된 카드 수:', testerDeck.length);
    
    if (testerDeck.length === 0) {
        console.error('[Tester] 테스터 덱 생성 실패!');
        return;
    }
    
    // 첫 번째 카드 상세 확인
    if (testerDeck[0]) {
        console.log('[Tester] 첫 번째 카드 확인:', {
            id: testerDeck[0].id,
            name: testerDeck[0].name,
            type: testerDeck[0].type,
            cost: testerDeck[0].cost
        });
    }
    
    gameState.deck = [...testerDeck];
    gameState.drawPile = testerDeck.map(card => ({ ...card })); // 깊은 복사
    gameState.discardPile = [];
    gameState.hand = [];
    
    // 카드 섞기
    for (let i = gameState.drawPile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.drawPile[i], gameState.drawPile[j]] = [gameState.drawPile[j], gameState.drawPile[i]];
    }
    
    console.log(`[Tester] 덱 설정 완료: ${gameState.drawPile.length}장`);
    
    // 테스터 유물 지급
    if (typeof RelicSystem !== 'undefined') {
        TesterRelicsConfig.forEach(relicId => {
            if (!RelicSystem.hasRelic(relicId)) {
                RelicSystem.addRelic(relicId, true);
                console.log(`[Tester] 유물 지급: ${relicId}`);
            }
        });
    }
    
    // 테스터 조력자 지급
    if (typeof AllySystem !== 'undefined' && TesterAllyConfig) {
        AllySystem.setAlly(TesterAllyConfig);
        console.log(`[Tester] 조력자 지급: ${TesterAllyConfig}`);
    }
    
    // 플레이어 강화
    gameState.player.maxHp = 100;
    gameState.player.hp = 100;
    gameState.energy = 5;
    gameState.maxEnergy = 5;
    gameState.gold = 500;
    
    // UI 업데이트
    if (typeof updateUI === 'function') updateUI();
    if (typeof updateDeckUI === 'function') updateDeckUI();
    if (typeof updatePileCounts === 'function') updatePileCounts();
    if (typeof RelicSystem !== 'undefined') RelicSystem.updateRelicUI();
    
    // 손패가 있으면 다시 그리기
    if (typeof renderHand === 'function') {
        renderHand(false);
    }
    
    // 팝업 표시
    showTesterModePopup();
    
    console.log('[Tester] 테스터 모드 설정 완료!');
    printTesterDeckInfo();
}

// 테스터 모드 팝업
function showTesterModePopup() {
    const popup = document.createElement('div');
    popup.className = 'tester-mode-popup';
    popup.innerHTML = `
        <div class="tester-popup-content">
            <div class="tester-icon">🎮</div>
            <div class="tester-title">테스터 모드 활성화!</div>
            <div class="tester-desc">
                <div>✓ 테스터 덱 적용</div>
                <div>✓ 5개 유물 지급</div>
                <div>✓ 조력자 지급</div>
                <div>✓ 에너지 5, 골드 500</div>
            </div>
        </div>
    `;
    
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #fbbf24;
        border-radius: 16px;
        padding: 30px 40px;
        z-index: 999999;
        animation: testerPopupIn 0.4s ease-out;
        box-shadow: 0 0 50px rgba(251, 191, 36, 0.5);
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes testerPopupIn {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .tester-popup-content { text-align: center; }
        .tester-icon { font-size: 3rem; margin-bottom: 10px; }
        .tester-title { 
            font-size: 1.5rem; 
            font-weight: bold; 
            color: #fbbf24; 
            margin-bottom: 15px;
            text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
        }
        .tester-desc { 
            font-size: 0.95rem; 
            color: #94a3b8; 
            line-height: 1.8;
        }
        .tester-desc div { margin: 5px 0; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.style.animation = 'testerPopupIn 0.3s ease-in reverse';
        setTimeout(() => popup.remove(), 300);
    }, 2000);
}

// ==========================================
// 스타터 유물 지급 함수
// ==========================================
function grantStarterRelics() {
    if (typeof RelicSystem === 'undefined') {
        console.warn('[Starter] RelicSystem not found');
        return;
    }
    
    if (StarterRelicsConfig.length === 0) {
        console.log('[Starter] No starter relics configured');
        return;
    }
    
    console.log('[Starter] Granting starter relics...');
    
    StarterRelicsConfig.forEach(relicId => {
        if (!RelicSystem.hasRelic(relicId)) {
            // silent = true: 팝업/로그 없이 조용히 지급
            RelicSystem.addRelic(relicId, true);
            console.log(`[Starter] Granted: ${relicId}`);
        }
    });
}

// ==========================================
// 스타터 조력자 지급 함수
// ==========================================
function grantStarterAlly() {
    if (typeof AllySystem === 'undefined') {
        console.warn('[Starter] AllySystem not found');
        return;
    }
    
    if (!StarterAllyConfig) {
        console.log('[Starter] No starter ally configured');
        return;
    }
    
    console.log('[Starter] Granting starter ally...');
    AllySystem.setAlly(StarterAllyConfig);
    console.log(`[Starter] Ally granted: ${StarterAllyConfig}`);
}

// ==========================================
// 테스터 모드 버튼 생성 (개발용)
// ==========================================
function createTesterButton() {
    // 이미 버튼이 있으면 무시
    if (document.getElementById('tester-mode-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'tester-mode-btn';
    btn.innerHTML = '🎮 테스터';
    btn.title = '테스터 모드 활성화 (덱/유물/조력자 지급)';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 16px;
        font-size: 0.9rem;
        font-weight: bold;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #1a1a2e;
        border: 2px solid #fbbf24;
        border-radius: 8px;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
        transition: all 0.2s ease;
    `;
    
    btn.onmouseenter = () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.6)';
    };
    btn.onmouseleave = () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 4px 15px rgba(251, 191, 36, 0.4)';
    };
    
    btn.onclick = () => {
        if (confirm('테스터 모드를 활성화하시겠습니까?\n\n• 테스터 덱으로 교체\n• 5개 유물 지급\n• 조력자 지급\n• 에너지 5, 골드 500')) {
            activateTesterMode();
        }
    };
    
    document.body.appendChild(btn);
    console.log('[Tester] 테스터 버튼 생성됨');
}

// 테스터 버튼 비활성화 (배포용)
// document.addEventListener('DOMContentLoaded', () => {
//     setTimeout(createTesterButton, 1000);
// });

// 로드 완료 로그
console.log('[Starter Deck] Loaded');
console.log(`[Starter Deck] 기본 덱: ${starterDeck.length}장`);
console.log(`[Starter Deck] 기본 유물: ${StarterRelicsConfig.length}개`);
console.log(`[Tester Deck] 테스터 덱: ${buildTesterDeck().length}장`);
console.log(`[Tester Deck] 테스터 유물: ${TesterRelicsConfig.length}개`);

