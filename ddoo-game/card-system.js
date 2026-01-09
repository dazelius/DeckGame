// =====================================================
// Card System - 카드 시스템
// =====================================================

const CardSystem = {
    game: null,
    
    // ==========================================
    // 카드 정의
    // ==========================================
    cards: {
        // === 공격 카드 ===
        // 근접 공격은 모두 최전선 우선 (레인 전략)
        strike: { 
            name: 'Strike', cost: 1, type: 'attack', damage: 6, 
            target: 'enemy', melee: true, frontOnly: true,
            aoe: { width: 2, depth: 1 },
            desc: 'Pierce 2 cells. Deal 6 damage. Melee: Frontline only.' 
        },
        bash: { 
            name: 'Bash', cost: 2, type: 'attack', damage: 8, vulnerable: 2, 
            target: 'enemy', melee: true, knockback: 1, frontOnly: true,
            aoe: { width: 1, depth: 1 },
            desc: 'Deal 8 damage. Knockback. Melee: Frontline only.' 
        },
        cleave: { 
            name: 'Cleave', cost: 1, type: 'attack', damage: 6, 
            target: 'enemy', melee: true, frontOnly: true,
            aoe: { width: 1, depth: 3 },
            desc: 'Deal 6 damage. Hits all 3 lanes. Melee: Frontline only.' 
        },
        ironWave: { 
            name: 'Iron Wave', cost: 1, type: 'attack', damage: 5, block: 5, 
            target: 'enemy', melee: true, frontOnly: true,
            aoe: { width: 1, depth: 1 },
            desc: 'Gain 5 Block. Deal 5 damage. Melee: Frontline only.' 
        },
        flurry: {
            name: 'Flurry', cost: 1, type: 'attack', damage: 2, 
            target: 'enemy', melee: true, frontOnly: true,
            hits: 3, // 3연속 공격!
            aoe: { width: 1, depth: 1 },
            element: 'physical',
            desc: 'Strike 3 times. Deal 2 damage each. Melee: Frontline only.'
        },
        // 원거리 공격은 아무나 타겟 가능
        fireBolt: { 
            name: 'Fire Bolt', cost: 2, type: 'attack', damage: 5, 
            target: 'enemy', melee: false, frontOnly: false,
            aoe: { width: 1, depth: 1 },
            createZone: 'fire',
            desc: 'Ranged. Deal 5 damage. Creates burning ground.' 
        },
        fireBall: { 
            name: 'Fireball', cost: 3, type: 'attack', damage: 8, 
            target: 'enemy', melee: false, frontOnly: false,
            aoePattern: 'cross', // 십자가 형태
            createZone: 'fire',
            desc: 'Ranged. Cross-shaped explosion. Deal 8 damage. Creates burning ground.' 
        },
        spearThrow: {
            name: 'Spear Throw', cost: 1, type: 'attack', damage: 5,
            target: 'enemy', melee: false, frontOnly: false,
            straight: true,  // 직선 전용
            distanceBonus: 1, // 거리당 +1 대미지
            element: 'physical',
            desc: 'Ranged. Straight line only. +1 damage per grid distance.'
        },
        
        // === 스킬 카드 ===
        defend: { 
            name: 'Defend', cost: 1, type: 'skill', block: 5, 
            target: 'self', 
            desc: 'Gain 5 Block' 
        },
        heal: { 
            name: 'Heal', cost: 2, type: 'skill', heal: 10, 
            target: 'self', 
            desc: 'Heal 10 HP' 
        },
        
        // === 소환 카드 === (사용 시 소멸)
        summonKnight: { 
            name: 'Summon Knight', cost: 3, type: 'summon', 
            unit: 'knight', target: 'grid', 
            exhaust: true, // 사용 시 소멸
            desc: 'Summon a Knight (40 HP, 12 DMG). Exhaust.' 
        },
        summonArcher: { 
            name: 'Summon Archer', cost: 2, type: 'summon', 
            unit: 'archer', target: 'grid', 
            exhaust: true, // 사용 시 소멸
            desc: 'Summon an Archer (25 HP, 8 DMG, Range 4). Exhaust.' 
        }
    },
    
    // ==========================================
    // 기본 덱 구성
    // ==========================================
    defaultDeck: {
        strike: 2,
        defend: 3,
        bash: 2,
        cleave: 1,
        flurry: 2,
        ironWave: 2,
        fireBolt: 1,
        fireBall: 1,
        spearThrow: 1,  // 스피어 투척
        summonKnight: 2,
        summonArcher: 2,
        heal: 1
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        console.log('[CardSystem] 카드 시스템 초기화 완료');
    },
    
    // ==========================================
    // 카드 정보 가져오기
    // ==========================================
    getCard(cardId) {
        return this.cards[cardId] || null;
    },
    
    getCardName(cardId) {
        const card = this.cards[cardId];
        return card ? card.name : cardId;
    },
    
    // ==========================================
    // 덱 생성
    // ==========================================
    createDeck(deckConfig = null) {
        const config = deckConfig || this.defaultDeck;
        const deck = [];
        
        for (const [cardId, count] of Object.entries(config)) {
            for (let i = 0; i < count; i++) {
                deck.push(cardId);
            }
        }
        
        return this.shuffleDeck(deck);
    },
    
    // ==========================================
    // 덱 셔플
    // ==========================================
    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // ==========================================
    // 카드 드로우
    // ==========================================
    drawCards(state, count) {
        const drawn = [];
        
        for (let i = 0; i < count; i++) {
            if (state.deck.length === 0) {
                // 덱이 비었으면 버린 카드를 셔플해서 덱으로
                if (state.discard.length === 0) break;
                state.deck = this.shuffleDeck([...state.discard]);
                state.discard = [];
            }
            
            const cardId = state.deck.pop();
            state.hand.push(cardId);
            drawn.push(cardId);
        }
        
        return drawn;
    },
    
    // ==========================================
    // 카드 사용 가능 여부
    // ==========================================
    canPlayCard(cardId, state) {
        const card = this.getCard(cardId);
        if (!card) return false;
        return state.cost >= card.cost;
    },
    
    // ==========================================
    // 카드 사용 (코스트 차감)
    // ==========================================
    spendCost(cardId, state) {
        const card = this.getCard(cardId);
        if (!card) return false;
        
        if (state.cost < card.cost) return false;
        
        state.cost -= card.cost;
        return true;
    },
    
    // ==========================================
    // 카드 버리기
    // ==========================================
    discardCard(cardId, handIndex, state) {
        if (handIndex >= 0 && handIndex < state.hand.length) {
            state.hand.splice(handIndex, 1);
        }
        state.discard.push(cardId);
    },
    
    // ==========================================
    // 손패 전체 버리기
    // ==========================================
    discardHand(state) {
        while (state.hand.length > 0) {
            const cardId = state.hand.pop();
            state.discard.push(cardId);
        }
    },
    
    // ==========================================
    // 카드 타입 체크
    // ==========================================
    isAttackCard(cardId) {
        const card = this.getCard(cardId);
        return card && card.type === 'attack';
    },
    
    isSkillCard(cardId) {
        const card = this.getCard(cardId);
        return card && card.type === 'skill';
    },
    
    isSummonCard(cardId) {
        const card = this.getCard(cardId);
        return card && card.type === 'summon';
    },
    
    // ==========================================
    // 카드 속성 체크
    // ==========================================
    isMeleeCard(cardId) {
        const card = this.getCard(cardId);
        return card && card.melee === true;
    },
    
    isRangedCard(cardId) {
        const card = this.getCard(cardId);
        return card && card.melee === false;
    },
    
    isFrontOnlyCard(cardId) {
        const card = this.getCard(cardId);
        return card && card.frontOnly === true;
    },
    
    hasKnockback(cardId) {
        const card = this.getCard(cardId);
        return card && card.knockback > 0;
    },
    
    getKnockback(cardId) {
        const card = this.getCard(cardId);
        return card ? (card.knockback || 0) : 0;
    },
    
    getAoe(cardId) {
        const card = this.getCard(cardId);
        return card ? (card.aoe || { width: 1, depth: 1 }) : { width: 1, depth: 1 };
    },
    
    // ==========================================
    // 카드 효과 타입 반환 (애니메이션용)
    // ==========================================
    getCardEffectType(cardId) {
        const card = this.getCard(cardId);
        if (!card) return 'strike';
        
        const name = card.name.toLowerCase();
        if (name.includes('bash')) return 'bash';
        if (name.includes('cleave')) return 'cleave';
        if (name.includes('fire') || name.includes('bolt')) return 'fire';
        if (name.includes('iron')) return 'heavy';
        return 'strike';
    }
};

console.log('[CardSystem] 카드 시스템 로드 완료');
