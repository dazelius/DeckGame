// ==========================================
// Shadow Deck - 포카드 유물 시스템
// ==========================================
// 한 턴에 같은 카드를 연속으로 사용하면 데미지 보너스
// 페어(2개): 25% / 트리플(3개): 50% / 포카드(4개): 100%

const FourcardSystem = {
    // 턴 내 사용한 카드 추적 (카드 id 기준)
    cardHistory: [],
    
    // 현재 보너스 상태
    currentBonus: {
        type: null,    // 'pair', 'triple', 'fourcard'
        multiplier: 0  // 0.25, 0.5, 1.0
    },
    
    // 보너스 배율 정의
    BONUS: {
        PAIR: { name: 'PAIR', name_kr: '페어', multiplier: 0.25, count: 2 },
        TRIPLE: { name: 'TRIPLE', name_kr: '트리플', multiplier: 0.50, count: 3 },
        FOURCARD: { name: 'FOUR CARD', name_kr: '포카드', multiplier: 1.00, count: 4 }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.reset();
        console.log('[FourcardSystem] 초기화 완료');
    },
    
    // ==========================================
    // 리셋 (턴 종료 또는 전투 시작 시)
    // ==========================================
    reset() {
        this.cardHistory = [];
        this.currentBonus = { type: null, multiplier: 0 };
        this.hideUI();
    },
    
    // ==========================================
    // 유물 보유 확인
    // ==========================================
    hasRelic() {
        return typeof RelicSystem !== 'undefined' && RelicSystem.hasRelic('fourcard');
    },
    
    // ==========================================
    // 카드 사용 시 호출
    // ==========================================
    onCardPlayed(card, gameState) {
        if (!this.hasRelic()) return;
        
        // 카드 타입 체크 - 공격 카드만 추적
        const cardType = card.type?.id || card.type;
        const isAttack = cardType === 'attack' || 
                        (typeof CardType !== 'undefined' && cardType === CardType.ATTACK);
        
        if (!isAttack) {
            // 공격 카드가 아니면 히스토리 리셋
            this.cardHistory = [];
            this.currentBonus = { type: null, multiplier: 0 };
            this.updateUI();
            return;
        }
        
        // 카드 ID 추출 (같은 카드인지 판단)
        const cardId = card.id || card.name;
        
        // 히스토리에 추가
        this.cardHistory.push(cardId);
        
        // 연속 같은 카드 카운트 계산
        const consecutiveCount = this.getConsecutiveCount();
        
        console.log(`[FourcardSystem] 카드 사용: ${card.name}(${cardId}), 연속: ${consecutiveCount}`, this.cardHistory);
        
        // 보너스 계산
        this.calculateBonus(consecutiveCount);
        
        // UI 업데이트
        this.updateUI();
    },
    
    // ==========================================
    // 연속 같은 카드 카운트 계산
    // ==========================================
    getConsecutiveCount() {
        if (this.cardHistory.length === 0) return 0;
        
        const lastCard = this.cardHistory[this.cardHistory.length - 1];
        let count = 0;
        
        // 뒤에서부터 같은 카드가 몇 개 연속인지 카운트
        for (let i = this.cardHistory.length - 1; i >= 0; i--) {
            if (this.cardHistory[i] === lastCard) {
                count++;
            } else {
                break;
            }
        }
        
        return count;
    },
    
    // ==========================================
    // 보너스 계산
    // ==========================================
    calculateBonus(count) {
        if (count >= 4) {
            this.currentBonus = { 
                type: this.BONUS.FOURCARD, 
                multiplier: this.BONUS.FOURCARD.multiplier 
            };
        } else if (count >= 3) {
            this.currentBonus = { 
                type: this.BONUS.TRIPLE, 
                multiplier: this.BONUS.TRIPLE.multiplier 
            };
        } else if (count >= 2) {
            this.currentBonus = { 
                type: this.BONUS.PAIR, 
                multiplier: this.BONUS.PAIR.multiplier 
            };
        } else {
            this.currentBonus = { type: null, multiplier: 0 };
        }
        
        if (this.currentBonus.type) {
            console.log(`[FourcardSystem] ${this.currentBonus.type.name} 활성화! +${this.currentBonus.multiplier * 100}% 데미지`);
        }
    },
    
    // ==========================================
    // 데미지 보너스 계산 (RelicSystem에서 호출)
    // ==========================================
    getDamageBonus(baseDamage, card, gameState) {
        if (!this.hasRelic()) return 0;
        
        // 카드 타입 체크 - 공격 카드만
        const cardType = card.type?.id || card.type;
        const isAttack = cardType === 'attack' || 
                        (typeof CardType !== 'undefined' && cardType === CardType.ATTACK);
        
        if (!isAttack || !this.currentBonus.type) return 0;
        
        // 퍼센트 보너스를 고정 데미지로 변환
        const bonus = Math.floor(baseDamage * this.currentBonus.multiplier);
        
        if (bonus > 0) {
            console.log(`[FourcardSystem] ${this.currentBonus.type.name} 보너스: +${bonus} 데미지 (${baseDamage} × ${this.currentBonus.multiplier * 100}%)`);
            this.showBonusEffect(this.currentBonus.type, bonus);
        }
        
        return bonus;
    },
    
    // ==========================================
    // 보너스 이펙트 표시 (심플 플로터 스타일)
    // ==========================================
    showBonusEffect(bonusType, bonusDamage) {
        // 적 요소 찾기
        let enemyEl = null;
        
        if (typeof getSelectedEnemyElement === 'function') {
            enemyEl = getSelectedEnemyElement();
        }
        if (!enemyEl) {
            const container = document.getElementById('enemies-container');
            if (container) {
                enemyEl = container.querySelector('.enemy-unit:not(.dead)');
            }
        }
        if (!enemyEl) {
            enemyEl = document.getElementById('enemy');
        }
        if (!enemyEl) return;
        
        const rect = enemyEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top;
        
        // 등급별 색상 및 크기
        let color = '#4ade80';  // 페어: 초록
        let bgColor = 'rgba(34, 197, 94, 0.2)';
        let fontSize = '1.3rem';
        
        if (bonusType.count >= 4) {
            color = '#fbbf24';  // 포카드: 금색
            bgColor = 'rgba(251, 191, 36, 0.25)';
            fontSize = '1.6rem';
        } else if (bonusType.count >= 3) {
            color = '#60a5fa';  // 트리플: 파랑
            bgColor = 'rgba(96, 165, 250, 0.2)';
            fontSize = '1.45rem';
        }
        
        // 플로터
        const floater = document.createElement('div');
        floater.className = 'fourcard-floater';
        floater.innerHTML = `
            <span class="fc-name">${bonusType.name}</span>
            <span class="fc-dmg">+${bonusDamage}</span>
        `;
        floater.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY - 30}px;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 14px;
            background: ${bgColor};
            border: 1px solid ${color};
            border-radius: 4px;
            font-family: 'Cinzel', serif;
            font-size: ${fontSize};
            font-weight: 700;
            color: ${color};
            text-shadow: 
                0 0 8px ${color},
                0 0 16px ${color},
                1px 1px 0 #000,
                -1px -1px 0 #000;
            pointer-events: none;
            z-index: 1500;
            animation: fourcardFloat 1.2s ease-out forwards;
        `;
        
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 1200);
    },
    
    // ==========================================
    // UI 업데이트 (사용 안함 - 플로터로 대체)
    // ==========================================
    updateUI() {
        // 심플 플로터 스타일이므로 별도 UI 불필요
    },
    
    // ==========================================
    // UI 숨기기
    // ==========================================
    hideUI() {
        // 심플 플로터 스타일이므로 별도 UI 불필요
    },
    
    // ==========================================
    // 턴 종료 시
    // ==========================================
    onTurnEnd() {
        this.reset();
    },
    
    // ==========================================
    // 전투 시작 시
    // ==========================================
    onBattleStart() {
        this.reset();
    }
};

// ==========================================
// 유물 데이터 등록
// ==========================================
if (typeof relicDatabase !== 'undefined') {
    relicDatabase.fourcard = {
        id: 'fourcard',
        name: 'Four Card',
        name_kr: '포카드',
        icon: '🃏',
        rarity: 'uncommon',
        description: 'Same attack card in a row: Pair +25%, Triple +50%, Four Card +100% damage',
        description_kr: '같은 공격 카드 연속 사용: 페어 +25%, 트리플 +50%, 포카드 +100% 데미지',
        onAcquire: (state) => {
            FourcardSystem.init();
            console.log('[Relic] Four Card activated!');
        },
        onBattleStart: (state) => {
            FourcardSystem.onBattleStart();
        },
        onTurnEnd: (state) => {
            FourcardSystem.onTurnEnd();
        },
        onCardPlayed: (card, state) => {
            FourcardSystem.onCardPlayed(card, state);
        },
        getDamageBonus: (baseDamage, card, state) => {
            return FourcardSystem.getDamageBonus(baseDamage, card, state);
        }
    };
    
    console.log('[FourcardSystem] 유물 등록 완료');
}

// ==========================================
// CSS 스타일 주입 (플로터)
// ==========================================
const fourcardStyles = document.createElement('style');
fourcardStyles.id = 'fourcard-styles';
fourcardStyles.textContent = `
    /* 플로터 애니메이션 */
    @keyframes fourcardFloat {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(15px) scale(0.7);
        }
        15% {
            opacity: 1;
            transform: translateX(-50%) translateY(-5px) scale(1.15);
        }
        30% {
            transform: translateX(-50%) translateY(0) scale(1);
        }
        70% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-25px) scale(0.95);
        }
    }
    
    .fourcard-floater {
        backdrop-filter: blur(2px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }
    
    .fourcard-floater .fc-name {
        letter-spacing: 3px;
        text-transform: uppercase;
    }
    
    .fourcard-floater .fc-dmg {
        font-weight: 900;
        font-size: 1.1em;
    }
`;

// 스타일 추가
if (!document.getElementById('fourcard-styles')) {
    document.head.appendChild(fourcardStyles);
}

// 시스템 초기화
FourcardSystem.init();

console.log('[FourcardSystem] 로드 완료');

