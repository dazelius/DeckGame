// =====================================================
// Card System - 카드 시스템 (JSON 기반)
// =====================================================

const CardSystem = {
    game: null,
    cards: {},  // JSON에서 로드됨
    loaded: false,
    
    // JSON 파일 목록
    cardFiles: ['attack', 'skill', 'summon'],
    
    // ==========================================
    // 기본 덱 구성
    // ==========================================
    defaultDeck: {
        strike: 2,
        defend: 2,
        dodge: 2,      // ★ 닷지 추가
        bash: 2,
        cleave: 1,
        flurry: 2,
        ironWave: 2,
        fireBolt: 1,
        fireBall: 1,
        spearThrow: 1,
        summonKnight: 2,
        summonArcher: 2,
        heal: 1
    },
    
    // ==========================================
    // 초기화 (JSON 로드)
    // ==========================================
    async init(gameRef) {
        this.game = gameRef;
        this.cards = {};
        
        // JSON 파일들 로드
        for (const file of this.cardFiles) {
            await this.loadCardFile(file);
        }
        
        this.loaded = true;
        console.log(`[CardSystem] ${Object.keys(this.cards).length}개 카드 로드 완료`);
    },
    
    // ==========================================
    // 카드 파일 로드
    // ==========================================
    async loadCardFile(filename) {
        try {
            const response = await fetch(`cards/${filename}.json`);
            if (response.ok) {
                const data = await response.json();
                // 카드들을 병합
                Object.assign(this.cards, data);
                console.log(`[CardSystem] ${filename}.json 로드 완료`);
            } else {
                console.warn(`[CardSystem] ${filename}.json 로드 실패`);
            }
        } catch (e) {
            console.warn(`[CardSystem] ${filename}.json 오류:`, e.message);
        }
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
            if (!this.cards[cardId]) {
                console.warn(`[CardSystem] 카드 정의 없음: ${cardId}`);
                continue;
            }
            for (let i = 0; i < count; i++) {
                deck.push(cardId);
            }
        }
        
        console.log(`[CardSystem] 덱 생성 완료: ${deck.length}장`, deck);
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
