// ==========================================
// Shadow Deck - 핵심 타입 정의
// ==========================================

// ==========================================
// 카드 시스템
// ==========================================

/** 카드 타입 */
type CardType = 'attack' | 'skill' | 'power' | 'status' | 'curse';

/** 카드 희귀도 */
type CardRarity = 'basic' | 'common' | 'uncommon' | 'rare' | 'special' | 'legendary';

/** 카드 타겟 */
type CardTarget = 'enemy' | 'self' | 'all' | 'none';

/** 카드 정의 */
interface Card {
    id: string;
    name: string;
    cost: number;
    type: CardType;
    rarity: CardRarity;
    description: string;
    icon: string;
    
    // 선택적 속성
    damage?: number;
    block?: number;
    minDamage?: number;
    maxDamage?: number;
    minBlock?: number;
    maxBlock?: number;
    
    // 특수 속성
    exhaust?: boolean;
    ethereal?: boolean;
    unplayable?: boolean;
    
    // 효과 함수
    effect?: (state: GameState, target?: Enemy) => void;
    
    // 업그레이드 관련
    upgraded?: boolean;
    upgradeId?: string;
}

/** 카드 인스턴스 (게임 중 사용) */
interface CardInstance extends Card {
    instanceId: string;
    isPlaying?: boolean;
}

// ==========================================
// 전투 유닛
// ==========================================

/** 플레이어 */
interface Player {
    name: string;
    hp: number;
    maxHp: number;
    block: number;
    energy: number;
    maxEnergy: number;
    
    // 상태이상
    blind?: number;
    vulnerable?: number;
    weak?: number;
    
    // 버프
    strength?: number;
    dexterity?: number;
    raiseStakes?: number;
}

/** 적 의도 타입 */
type IntentType = 'attack' | 'defend' | 'buff' | 'debuff' | 'special' | 'unknown';

/** 적 */
interface Enemy {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    block: number;
    
    // 의도 시스템
    intent: IntentType;
    intentValue?: number;
    nextAction?: () => void;
    
    // 상태이상
    vulnerable?: number;
    weak?: number;
    
    // 특수 속성
    isElite?: boolean;
    isBoss?: boolean;
    
    // 콜백
    onDamageTaken?: (damage: number, state: GameState) => void;
    onTurnStart?: (state: GameState) => void;
    onTurnEnd?: (state: GameState) => void;
    onDeath?: (state: GameState) => void;
}

// ==========================================
// 게임 상태
// ==========================================

/** 전투 타입 */
type BattleType = 'normal' | 'elite' | 'boss';

/** 게임 상태 */
interface GameState {
    // 유닛
    player: Player;
    enemy: Enemy | null;
    enemies: Enemy[];
    selectedEnemyIndex: number;
    
    // 카드 덱
    deck: CardInstance[];
    hand: CardInstance[];
    drawPile: CardInstance[];
    discardPile: CardInstance[];
    exhaustPile?: CardInstance[];
    fullDeck?: CardInstance[];
    
    // 턴 정보
    turn: number;
    isPlayerTurn: boolean;
    isPlayingCard: boolean;
    
    // 전투 정보
    battleCount: number;
    currentBattleType?: BattleType;
    victoryProcessing: boolean;
    
    // 턴 통계
    turnStats: {
        attackCardsPlayed: number;
        skillCardsPlayed: number;
        totalCardsPlayed: number;
    };
    
    // 리소스
    gold?: number;
    
    // 버프/디버프
    nextBattleBuffs?: {
        bonusEnergy?: number;
        bonusDraw?: number;
        bonusBlock?: number;
    };
    
    // 현재 카드
    currentCard?: Card;
    lastPlayedCard?: Card;
    currentCritical?: {
        isCritical: boolean;
        multiplier: number;
    };
}

// ==========================================
// 유물 시스템
// ==========================================

/** 유물 희귀도 */
type RelicRarity = 'common' | 'uncommon' | 'rare' | 'boss' | 'event';

/** 유물 */
interface Relic {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: RelicRarity;
    
    // 콜백
    onPickup?: (state: GameState) => void;
    onBattleStart?: (state: GameState) => void;
    onBattleEnd?: (state: GameState) => void;
    onTurnStart?: (state: GameState) => void;
    onTurnEnd?: (state: GameState) => void;
    onCardPlayed?: (state: GameState, card: Card) => void;
    onDamageTaken?: (state: GameState, damage: number) => void;
    onDealDamage?: (state: GameState, targetIndex: number, damage: number) => void;
    
    // 계산
    calculateBonusDamage?: (baseDamage: number, card: Card, state: GameState) => number;
}

// ==========================================
// 맵 시스템
// ==========================================

/** 방 타입 */
type RoomType = 
    | 'none'
    | 'start'
    | 'monster'
    | 'elite'
    | 'treasure'
    | 'shop'
    | 'event'
    | 'camp'
    | 'boss'
    | 'secret';

/** 방 */
interface Room {
    x: number;
    y: number;
    type: RoomType;
    cleared: boolean;
    accessible: boolean;
    connections: Room[];
    hasCaptive?: boolean;
    captiveNpcId?: string;
}

// ==========================================
// 이벤트 시스템
// ==========================================

/** 이벤트 선택지 */
interface EventChoice {
    text: string;
    effect: () => void;
    condition?: () => boolean;
}

/** 게임 이벤트 */
interface GameEvent {
    id: string;
    name: string;
    description: string;
    image?: string;
    choices: EventChoice[];
    weight?: number;
}

// ==========================================
// 사운드 시스템
// ==========================================

/** 사운드 타입 */
type SoundType = 'hit' | 'select' | 'card' | 'magic' | 'heal' | 'block' | 'death';

/** 사운드 옵션 */
interface SoundOptions {
    volume?: number;
    loop?: boolean;
    pitch?: number;
}

// ==========================================
// VFX 시스템
// ==========================================

/** 파티클 옵션 */
interface ParticleOptions {
    x: number;
    y: number;
    count?: number;
    color?: string;
    size?: number;
    duration?: number;
    spread?: number;
}

/** VFX 타입 */
type VFXType = 
    | 'slash'
    | 'hit'
    | 'heal'
    | 'fire'
    | 'ice'
    | 'lightning'
    | 'poison'
    | 'blood'
    | 'spark';

// ==========================================
// 시스템 인터페이스
// ==========================================

/** 골드 시스템 */
interface GoldSystemType {
    getGold(): number;
    addGold(amount: number): void;
    useGold(amount: number): boolean;
    setGold(amount: number): void;
}

/** 유물 시스템 */
interface RelicSystemType {
    ownedRelics: Relic[];
    init(): void;
    addRelic(relicId: string): void;
    hasRelic(relicId: string): boolean;
    calculateBonusDamage(baseDamage: number, card: Card, state: GameState): number;
}

/** 사운드 시스템 */
interface SoundSystemType {
    init(): void;
    play(soundId: string, options?: SoundOptions): void;
    playHit(type?: string): void;
    playSelect(): void;
    setVolume(volume: number): void;
    toggle(): void;
}

/** 칩 시스템 (겜블러) */
interface ChipSystemType {
    chips: number;
    isActive: boolean;
    init(): void;
    addChips(amount: number): void;
    useChips(amount: number): boolean;
    rollChipGain(): number;
    updateUI(): void;
    activate(): void;
    deactivate(): void;
    onCardDiscarded(card: Card, count: number): void;
    executeAllIn(): void;
}

// ==========================================
// 전역 선언
// ==========================================

declare const gameState: GameState;
declare const GoldSystem: GoldSystemType;
declare const RelicSystem: RelicSystemType;
declare const SoundSystem: SoundSystemType;
declare const ChipSystem: ChipSystemType;

declare function dealDamage(target: Enemy | Player, amount: number, card?: Card): void;
declare function gainBlock(target: Enemy | Player, amount: number): void;
declare function addLog(message: string, type?: string): void;
declare function updateUI(): void;
declare function renderHand(): void;
declare function drawCards(count: number): void;
declare function playCard(cardIndex: number): void;
declare function createCard(cardId: string): CardInstance;

