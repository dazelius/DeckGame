// ==========================================
// Shadow Deck - 카드 유틸리티 함수
// ==========================================

// 기본 덱 구성은 starter-deck.js에서 관리

// 보상 카드 풀 (희귀도별)
const rewardCardPool = {
    [Rarity.COMMON]: [
        'cleave', 'pommelStrike', 'ironWave', 'quickSlash', 
        'heavyBlow', 'shrugItOff', 'armorUp', 'battleCry',
        'dagger', 'shurikenBarrage'
    ],
    [Rarity.UNCOMMON]: [
        'shieldBash', 'twinStrike', 'ragingBlow', 'preciseStrike',
        'ironFortress', 'secondWind', 'energize', 'finisher', 'energyBolt',
        'shadowClone', 'shadowExplosion'
    ],
    [Rarity.RARE]: [
        'executionBlade', 'swordRain', 'impenetrableWall', 'lifeDrain'
    ]
};

// 랜덤 보상 카드 선택
function getRandomRewardCard() {
    // 희귀도 확률: Common 60%, Uncommon 30%, Rare 10%
    const roll = Math.random() * 100;
    let rarity;
    
    if (roll < 60) {
        rarity = Rarity.COMMON;
    } else if (roll < 90) {
        rarity = Rarity.UNCOMMON;
    } else {
        rarity = Rarity.RARE;
    }
    
    const pool = rewardCardPool[rarity];
    const randomCardId = pool[Math.floor(Math.random() * pool.length)];
    
    return createCard(randomCardId);
}

// 카드 타입 한글명
function getCardTypeName(type) {
    const names = {
        [CardType.ATTACK]: '공격',
        [CardType.SKILL]: '스킬',
        [CardType.POWER]: '파워'
    };
    return names[type] || type;
}

// 희귀도 한글명
function getRarityName(rarity) {
    const names = {
        [Rarity.BASIC]: '기본',
        [Rarity.COMMON]: '일반',
        [Rarity.UNCOMMON]: '고급',
        [Rarity.RARE]: '희귀'
    };
    return names[rarity] || rarity;
}

// 희귀도 색상
function getRarityColor(rarity) {
    const colors = {
        [Rarity.BASIC]: '#888888',
        [Rarity.COMMON]: '#ffffff',
        [Rarity.UNCOMMON]: '#4fc3f7',
        [Rarity.RARE]: '#ffd700'
    };
    return colors[rarity] || '#ffffff';
}

// 카드 생성 헬퍼 함수 (강화 카드 포함)
function createCard(cardId) {
    // 먼저 기본 데이터베이스에서 찾기
    let cardData = cardDatabase[cardId];
    
    // 없으면 강화 카드 데이터베이스에서 찾기
    if (!cardData && typeof upgradedCardDatabase !== 'undefined') {
        cardData = upgradedCardDatabase[cardId];
    }
    
    // 없으면 겜블러 카드에서 찾기
    if (!cardData && typeof GamblerCardList !== 'undefined') {
        cardData = GamblerCardList[cardId];
        // 찾았으면 cardDatabase에도 등록
        if (cardData) {
            cardDatabase[cardId] = cardData;
        }
    }
    
    if (!cardData) {
        console.error(`[Cards] 카드를 찾을 수 없음: ${cardId}`);
        return null;
    }
    
    // 카드 복사
    const card = {
        ...cardData,
        instanceId: Date.now() + Math.random()
    };
    
    // cost가 undefined인 경우 기본값 설정
    if (card.cost === undefined || card.cost === null) {
        console.warn(`[Cards] ${cardId} cost가 없음, 기본값 1 설정`);
        card.cost = 1;
    }
    
    // 응집된 일격은 항상 baseCost로 시작
    if (card.id === 'concentratedStrike' || card.id === 'concentratedStrikeP') {
        card.cost = card.baseCost || card.cost;
    }
    
    return card;
}

console.log('[Card Utils] 카드 유틸리티 함수 로드됨');

