// ==========================================
// JSDoc 타입 정의 (Type Definitions)
// 이 파일은 실행되지 않고, IDE 자동완성용입니다
// ==========================================

/**
 * @typedef {Object} Unit
 * @property {string} type - 유닛 타입 ID (예: 'goblin', 'hero')
 * @property {string} [name] - 유닛 이름
 * @property {number} hp - 현재 HP
 * @property {number} maxHp - 최대 HP
 * @property {number} [originalHp] - 원본 HP (레벨업 전)
 * @property {number} damage - 기본 데미지
 * @property {number} [range] - 사거리 (1=근접)
 * @property {number} [block] - 현재 방어력 (쉴드)
 * @property {number} gridX - 그리드 X 좌표
 * @property {number} gridZ - 그리드 Z 좌표 (레인)
 * @property {boolean} [isHero] - 히어로 여부
 * @property {boolean} [isAnimating] - 애니메이션 중 여부
 * @property {PIXI.Sprite} [sprite] - 스프라이트
 * @property {PIXI.Container} [container] - 유닛 컨테이너
 * @property {number} [baseScale] - 기본 스케일
 * @property {Intent} [intent] - 현재 인텐트 (적만)
 * @property {boolean} [isBroken] - 브레이크 상태
 * @property {number} [breakProgress] - 브레이크 진행도
 * @property {number} [vulnerable] - 취약 턴 수
 * @property {number} [bleed] - 출혈 스택
 * @property {boolean} [hasSplit] - 분열 여부 (슬라임)
 * @property {boolean} [spawnedThisTurn] - 이번 턴 소환 여부
 * @property {Object} [breathingTween] - 브리딩 애니메이션
 * @property {PIXI.Container} [intentContainer] - 인텐트 UI 컨테이너
 * @property {PIXI.Container} [dialogueBubble] - 대사 말풍선
 */

/**
 * @typedef {Object} Intent
 * @property {string} id - 인텐트 ID
 * @property {string} [name] - 인텐트 이름 (한글)
 * @property {string} [nameEn] - 인텐트 이름 (영문)
 * @property {'attack'|'defend'|'buff'|'debuff'|'summon'|'split'|'heal'} type - 인텐트 타입
 * @property {number} [damage] - 데미지 (attack)
 * @property {number} [hits] - 타격 횟수 (attack)
 * @property {number} [block] - 방어력 (defend)
 * @property {string} [buffType] - 버프 타입 (buff)
 * @property {number} [buffValue] - 버프 수치 (buff)
 * @property {number} [healAmount] - 회복량 (heal)
 * @property {string} [summonType] - 소환 몬스터 타입 (summon/split)
 * @property {number} [summonCount] - 소환 수 (summon/split)
 * @property {number} [weight] - 선택 가중치
 * @property {number} [breakRecipe] - 브레이크 레시피 (약점 타격 횟수)
 * @property {string} [element] - 원소 타입
 * @property {string} [projectile] - 발사체 타입
 * @property {boolean} [createZone] - 장판 생성 여부
 */

/**
 * @typedef {Object} Card
 * @property {string} id - 카드 ID
 * @property {string} name - 카드 이름
 * @property {string} [nameKo] - 한글 이름
 * @property {'attack'|'skill'|'summon'} type - 카드 타입
 * @property {number} cost - 코스트
 * @property {number} [damage] - 데미지
 * @property {number} [block] - 방어력
 * @property {number} [hits] - 타격 횟수
 * @property {number} [knockback] - 넉백 거리
 * @property {number} [bleed] - 출혈 스택
 * @property {string} [element] - 원소 타입
 * @property {string} [targetType] - 타겟팅 타입 ('enemy', 'ally', 'self', 'lane')
 * @property {string} [attackType] - 공격 타입 ('melee', 'ranged')
 * @property {string} [skill] - 스킬 ID
 * @property {boolean} [exhaust] - 소모 여부
 * @property {string} desc - 설명
 */

/**
 * @typedef {Object} MonsterPattern
 * @property {string} id - 몬스터 ID
 * @property {string} name - 영문 이름
 * @property {string} nameKo - 한글 이름
 * @property {MonsterStats} stats - 스탯
 * @property {MonsterAI} ai - AI 설정
 * @property {string[]} weaknesses - 약점 목록
 * @property {Intent[]} intents - 인텐트 목록
 * @property {Intent} [splitIntent] - 분열 인텐트 (슬라임)
 * @property {MonsterDialogues} [dialogues] - 대사
 */

/**
 * @typedef {Object} MonsterStats
 * @property {number} hp - 최대 HP
 * @property {number} damage - 기본 데미지
 * @property {number} range - 사거리
 * @property {string} sprite - 스프라이트 파일명
 * @property {number} scale - 스프라이트 크기
 */

/**
 * @typedef {Object} MonsterAI
 * @property {'melee'|'ranged'} attackType - 공격 타입
 * @property {number} preferredDistance - 선호 거리
 * @property {boolean} [retreatBeforeAttack] - 후퇴 후 공격 여부
 * @property {number} [retreatDistance] - 후퇴 거리
 * @property {boolean} [keepDistance] - 거리 유지 여부
 * @property {boolean} [aggressive] - 공격적 AI
 * @property {boolean} [splitOnLowHP] - HP 낮을 때 분열
 * @property {number} [splitThreshold] - 분열 HP 비율 (0~1)
 */

/**
 * @typedef {Object} MonsterDialogues
 * @property {string[]} [spawn] - 등장 대사
 * @property {string[]} [intent] - 인텐트 선택 대사
 * @property {string[]} [attack] - 공격 대사
 * @property {string[]} [defend] - 방어 대사
 * @property {string[]} [buff] - 버프 대사
 * @property {string[]} [hit] - 피격 대사
 * @property {string[]} [death] - 사망 대사
 * @property {string[]} [break] - 브레이크 대사
 * @property {string[]} [random] - 랜덤 대사
 * @property {Object.<string, string[]>} [intents] - 인텐트별 대사
 */

/**
 * @typedef {Object} GameState
 * @property {number} turn - 현재 턴
 * @property {'prepare'|'battle'|'victory'|'defeat'} phase - 게임 페이즈
 * @property {number} cost - 현재 코스트
 * @property {number} maxCost - 최대 코스트
 * @property {number} heroHP - 히어로 HP
 * @property {number} heroMaxHP - 히어로 최대 HP
 * @property {number} heroBlock - 히어로 방어력
 * @property {Unit} hero - 히어로 유닛
 * @property {Unit[]} playerUnits - 플레이어 유닛들
 * @property {Unit[]} enemyUnits - 적 유닛들
 * @property {string[]} deck - 덱
 * @property {string[]} hand - 핸드
 * @property {string[]} discard - 버린 카드
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X 좌표
 * @property {number} y - Y 좌표
 */

/**
 * @typedef {Object} GridCell
 * @property {number} x - 그리드 X
 * @property {number} z - 그리드 Z (레인)
 */

/**
 * @typedef {Object} DamageResult
 * @property {number} dealt - 실제 가한 데미지
 * @property {number} absorbed - 쉴드가 흡수한 양
 * @property {boolean} killed - 사망 여부
 */

/**
 * @typedef {Object} BreakResult
 * @property {boolean} hit - 약점 적중 여부
 * @property {boolean} broken - 브레이크 발동 여부
 */

/**
 * @typedef {Object} AttackOptions
 * @property {string} [effectType] - 이펙트 타입
 * @property {number} [knockback] - 넉백 거리
 * @property {string} [slashColor] - 슬래시 색상
 * @property {boolean} [isEnemy] - 적 공격 여부
 * @property {Function} [onHit] - 타격 시 콜백
 * @property {number} [bleed] - 출혈 스택
 * @property {number} [hits] - 타격 횟수
 * @property {number} [chainReduction] - 연쇄 데미지 감소량
 */

/**
 * @typedef {Object} RangedOptions
 * @property {string} [projectileType] - 발사체 타입
 * @property {string} [element] - 원소 타입
 * @property {boolean} [createZone] - 장판 생성
 * @property {boolean} [isEnemy] - 적 공격 여부
 * @property {Function} [onHit] - 타격 시 콜백
 * @property {number} [gridDistance] - 그리드 거리 (스피어)
 */

// 타입 내보내기 (TypeScript 호환용)
if (typeof module !== 'undefined') {
    module.exports = {};
}

console.log('[Types] JSDoc 타입 정의 로드 완료');
