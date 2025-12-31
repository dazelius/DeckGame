# Shadow Deck - 개발 가이드라인

> 덱빌딩 로그라이크 게임 "Shadow Deck" 개발을 위한 코딩 규칙 및 가이드라인

---

## 📁 프로젝트 구조

### 핵심 파일

| 파일명 | 역할 | 설명 |
|--------|------|------|
| `index.html` | 메인 HTML | 게임 UI 구조, 스크립트 로드 순서 정의 |
| `game.js` | 게임 로직 코어 | gameState, 턴 관리, 전투 시스템 |
| `cards.js` | 카드 데이터베이스 | 모든 카드 정의, 카드 효과 함수 |
| `monster.js` | 몬스터 데이터베이스 | 일반/엘리트/보스 몬스터 정의 |
| `effects.js` | 이펙트 시스템 | VFX 기반 시각 효과 래퍼 |
| `vfx.js` | Canvas VFX | 순수 Canvas 2D 파티클/애니메이션 |
| `shield.js` | 방어도 시스템 | 방어도 로직, 데미지 계산 |
| `styles.css` | 메인 스타일 | CSS 변수, 레이아웃 |

### 시스템 모듈

| 파일명 | 시스템 | 설명 |
|--------|--------|------|
| `job-system.js` | 직업(전직) 시스템 | 전사/도적/마법사 등 직업 관리 |
| `relics.js` | 유물 시스템 | 유물 효과, 콤보 보너스 |
| `buff.js` | 버프/디버프 | 상태 효과 관리 |
| `bleed-system.js` | 출혈 시스템 | 출혈 DOT 데미지 |
| `critical-system.js` | 크리티컬 시스템 | 크리티컬 히트 로직 |
| `town.js` | 마을 시스템 | 월드맵, NPC 상호작용 |
| `map.js` | 던전 맵 | 스테이지 진행, 경로 선택 |
| `enemy-ai.js` | 적 AI | 적 행동 패턴 실행 |

### UI 관련 파일

| 파일명 | 역할 |
|--------|------|
| `card-drag.js` | 카드 드래그 앤 드롭 |
| `hand-manager.js` | 손패 관리 및 렌더링 |
| `card-animation.js` | 카드 이동 연출 |
| `hit-effects.js` | 타격감 이펙트 |
| `relics-ui.js` | 유물 UI |

---

## 🎯 핵심 규칙

### 1. 전역 상태 관리 - `gameState`

```javascript
// game.js에 정의된 전역 상태 객체
const gameState = {
    player: null,           // 플레이어 정보
    enemies: [],            // 다중 적 배열 (★ 단일 적 X)
    enemy: null,            // 현재 타겟 적 (하위 호환성)
    deck: [],               // 전체 덱
    hand: [],               // 현재 손패
    drawPile: [],           // 뽑기 더미
    discardPile: [],        // 버리기 더미
    turn: 1,                // 현재 턴
    isPlayerTurn: true,     // 플레이어 턴 여부
    battleCount: 1,         // 현재 전투 번호
    turnStats: {            // 턴 내 통계
        attackCardsPlayed: 0,
        skillCardsPlayed: 0,
        totalCardsPlayed: 0
    }
};
```

### 2. 시스템 객체 패턴

모든 시스템은 **싱글톤 객체** 패턴을 사용합니다:

```javascript
const SystemName = {
    // 초기화
    init() {
        // 초기화 로직
        console.log('[SystemName] 초기화 완료');
    },
    
    // 메서드들
    doSomething() {
        // 로직
    },
    
    // 내부 상태
    internalState: null
};

// 전역 접근 등록
window.SystemName = SystemName;

// DOMContentLoaded 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    SystemName.init();
});
```

### 3. 다중 적 시스템

> ⚠️ **중요**: 단일 적(`gameState.enemy`)이 아닌 다중 적(`gameState.enemies[]`) 사용

```javascript
// ✅ 올바른 방법
gameState.enemies.forEach((enemy, index) => {
    const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
    // 처리
});

// ✅ 선택된 적 가져오기
const selectedEnemy = gameState.enemies[gameState.selectedEnemyIndex];

// ❌ 피해야 할 방법 (단일 적 참조)
// gameState.enemy 직접 사용 지양 (하위 호환성용)
```

---

## 📝 코딩 스타일

### 네이밍 규칙

```javascript
// 상수: UPPER_SNAKE_CASE
const CardType = {
    ATTACK: 'attack',
    SKILL: 'skill',
    POWER: 'power'
};

// 시스템 객체: PascalCase
const EffectSystem = { ... };
const RelicSystem = { ... };

// 함수: camelCase (동사로 시작)
function dealDamage(target, amount) { }
function gainBlock(target, amount) { }
function addLog(message, type) { }

// DOM 요소 참조: xxxEl 접미사
const playerEl = document.getElementById('player');
const enemyEl = getSelectedEnemyElement();

// 데이터베이스: xxxDatabase
const cardDatabase = { ... };
const relicDatabase = { ... };
const enemyDatabase = [ ... ];
```

### 파일 헤더 주석

```javascript
// ==========================================
// Shadow Deck - [시스템 이름]
// ==========================================
```

### 섹션 구분 주석

```javascript
// ==========================================
// 섹션 이름
// ==========================================
```

### 콘솔 로그 형식

```javascript
console.log('[SystemName] 메시지');
console.warn('[SystemName] 경고 메시지');
console.error('[SystemName] 에러 메시지');
```

---

## 🃏 카드 시스템

### 카드 정의 구조

```javascript
cardDatabase['cardId'] = {
    id: 'cardId',                    // 고유 ID (camelCase)
    name: '카드 이름',                // 한글 표시명
    type: CardType.ATTACK,           // attack | skill | power | status | curse
    rarity: Rarity.COMMON,           // basic | common | uncommon | rare
    cost: 1,                         // 에너지 비용
    icon: '<img src="icon.png">',    // 아이콘 (이미지 또는 이모지)
    description: '<span class="damage">6</span> 데미지', // HTML 가능
    isAllEnemy: false,               // 전체 공격 여부 (선택)
    effect: (state) => {
        // 카드 효과 로직
        // state = gameState 참조
    }
};
```

### 카드 효과 패턴

```javascript
effect: (state) => {
    const playerEl = document.getElementById('player');
    const enemyEl = typeof getSelectedEnemyElement === 'function' 
        ? getSelectedEnemyElement() 
        : document.getElementById('enemy');
    
    // 1. 이펙트 실행
    EffectSystem.playerAttack(playerEl, enemyEl, () => {
        // 2. 이펙트 콜백 내에서 데미지 처리
        EffectSystem.slash(enemyEl, { color: '#ff4444', count: 1 });
        dealDamage(state.enemy, 6);
    });
    
    // 3. 로그
    addLog('베기로 6 데미지!', 'damage');
}
```

### 카드 생성

```javascript
// 카드 인스턴스 생성 (항상 createCard 사용)
const card = createCard('cardId');

// 손패에 추가
gameState.hand.push(card);
renderHand();
```

---

## 👹 몬스터 시스템

### 몬스터 정의 구조

```javascript
// 일반 몬스터: enemyDatabase[]
// 엘리트 몬스터: eliteDatabase[]
// 보스 몬스터: bossDatabase[]

{
    id: 'monsterId',              // 고유 ID (camelCase)
    name: "몬스터 이름",           // 한글 표시명
    maxHp: 50,                    // 최대 HP
    img: 'monster.png',           // 이미지 파일명
    passives: ['passive1'],       // 패시브 목록 (선택)
    intents: [                    // 행동 패턴
        { type: 'attack', value: 8, icon: '⚔️' },
        { type: 'defend', value: 6, icon: '🛡️' }
    ]
}
```

### 몬스터 등급 시스템

```javascript
const MonsterTier = {
    NORMAL: 'normal',   // 일반
    ELITE: 'elite',     // 엘리트
    BOSS: 'boss',       // 보스
    MINION: 'minion'    // 소환된 몬스터
};

// 등급별 스케일
const MonsterScale = {
    [MonsterTier.MINION]: { width: 120, maxHeight: 140 },
    [MonsterTier.NORMAL]: { width: 180, maxHeight: 200 },
    [MonsterTier.ELITE]: { width: 270, maxHeight: 300 },
    [MonsterTier.BOSS]: { width: 360, maxHeight: 400 }
};
```

### 인텐트 타입

| type | 설명 | 추가 속성 |
|------|------|----------|
| `attack` | 공격 | `value`, `hits` (연속 공격) |
| `defend` | 방어 | `value` |
| `buff` | 버프 | `value` |
| `buffAllies` | 아군 버프 | `value` |
| `healSelf` | 자가 회복 | `value` |
| `healAllies` | 아군 회복 | `value` |
| `summon` | 소환 | `summons: ['id1', 'id2']` |
| `blind` | 실명 | `value` (지속 턴) |

---

## ✨ 이펙트 시스템

### EffectSystem (고수준 래퍼)

```javascript
// 슬래시 이펙트
EffectSystem.slash(targetEl, { color: '#ff4444', count: 1 });

// 강타 이펙트
EffectSystem.impact(targetEl, { color: '#ff6b35', size: 200 });

// 다중 타격
EffectSystem.multiHit(targetEl, hitCount, { color: '#ff4444' });

// 방어 이펙트
EffectSystem.shield(targetEl, { color: '#4fc3f7' });

// 힐 이펙트
EffectSystem.heal(targetEl, { color: '#4ade80' });

// 플레이어 돌진
EffectSystem.playerAttack(playerEl, enemyEl, () => {
    // 돌진 후 콜백
});

// 화면 흔들림
EffectSystem.screenShake(intensity, duration);
```

### VFX (저수준 Canvas)

```javascript
// 슬래시
VFX.slash(x, y, { color, length, width, angle });

// 충격파
VFX.shockwave(x, y, { color, size });

// 스파크
VFX.sparks(x, y, { color, count, speed });

// 번개
VFX.lightning(x1, y1, x2, y2, { color, width });

// 버프 이펙트
VFX.buff(x, y, { color, isDebuff });
```

---

## 🛡️ 데미지 & 방어도

### dealDamage 함수

```javascript
// 데미지 처리 (유물 보너스, 취약 등 자동 계산)
const result = dealDamage(target, baseDamage, card);

// 반환값
result = {
    blockedDamage,    // 방어도로 막은 데미지
    actualDamage,     // 실제 HP 데미지
    totalDamage,      // 총 데미지
    bonusDamage,      // 유물 보너스 데미지
    remainingHp,      // 남은 HP
    remainingBlock    // 남은 방어도
};
```

### gainBlock 함수

```javascript
// 방어도 획득
gainBlock(target, amount);
// ShieldSystem.gainBlock 호출 + UI 업데이트
```

---

## 🎮 직업(Job) 시스템

### 직업 정의

```javascript
jobs: {
    warrior: {
        id: 'warrior',
        name: '전사',
        nameEn: 'Warrior',
        icon: '⚔️',
        color: '#ef4444',
        description: '균형 잡힌 공격과 방어',
        sprite: 'hero.png',           // 기본 스프라이트
        slashSprite: 'hero_slash.png', // 공격 스프라이트
        stats: {
            maxHp: 80,
            energy: 3,
            drawCount: 5
        },
        starterDeck: {
            attacks: { strike: 5, bash: 1 },
            skills: { defend: 5 }
        },
        starterRelics: [],
        unlocked: true
    }
}
```

### 직업 변경

```javascript
// 직업 변경 (스탯, 덱, 유물, 스프라이트 자동 적용)
JobSystem.changeJob('rogue');

// 현재 직업 가져오기
const job = JobSystem.getCurrentJob();
```

### 스프라이트 스케일 시스템

기본 스프라이트와 공격 스프라이트의 해상도가 다른 경우, 스케일 값으로 조정합니다.

```javascript
// 직업 정의 시 스프라이트 스케일 지정
warrior: {
    sprite: 'hero.png',
    spriteScale: 1.0,              // 기본 스프라이트 스케일
    slashSprite: 'hero_slash.png',
    slashSpriteScale: 0.78,        // 공격 스프라이트 스케일 (검기 이펙트 보정)
}
```

| 스프라이트 타입 | 스케일 기준 |
|----------------|-------------|
| 기본 스프라이트 | 1.0 (hero.png 기준) |
| 검기 포함 공격 | 1.25 ~ 1.3 (슬래시 이펙트 확대) |
| 마법진 포함 공격 | 1.5 (마법 이펙트가 작으면 더 확대) |

```javascript
// 스케일 getter
JobSystem.getCurrentSpriteScale();      // 기본 스프라이트 스케일
JobSystem.getCurrentSlashSpriteScale(); // 공격 스프라이트 스케일

// 스케일 적용
JobSystem.applyPlayerSpriteScale(false); // 기본 스프라이트
JobSystem.applyPlayerSpriteScale(true);  // 공격 스프라이트
```

---

## 🏆 유물 시스템

### 유물 정의

```javascript
relicDatabase['relicId'] = {
    id: 'relicId',
    name: '유물 이름',
    icon: '💎',
    rarity: 'common',  // common | uncommon | rare
    description: '유물 설명',
    
    // 획득 시 호출
    onAcquire: (state) => { },
    
    // 카드 사용 시 호출
    onCardPlayed: (card, state) => { },
    
    // 데미지 받을 때 호출
    onDamageTaken: (state, damage) => { },
    
    // 적에게 데미지 줄 때 호출
    onDealDamage: (state, targetIndex, damage) => { },
    
    // 턴 시작 시 호출
    onTurnStart: (state) => { },
    
    // 턴 종료 시 호출
    onTurnEnd: (state) => { }
};
```

---

## 📊 버프/디버프

### 버프 적용

```javascript
// 버프 적용
BuffSystem.applyBuff(target, 'attackUp', 3, source);

// 버프 제거
BuffSystem.removeBuff(target, 'attackUp');

// UI 업데이트
BuffSystem.updateBuffDisplay(target, targetEl);
```

### 기본 제공 버프

| ID | 이름 | 타입 | 설명 |
|----|------|------|------|
| `attackUp` | 공격력 증가 | buff | 공격력 +N |
| `defenseUp` | 방어력 증가 | buff | 방어력 +N |
| `vulnerable` | 취약 | debuff | 50% 추가 피해 |
| `weak` | 약화 | debuff | 공격력 25% 감소 |

---

## 🎨 CSS 규칙

### CSS 변수 사용

```css
:root {
    /* 색상 팔레트 */
    --bg-primary: #0d0d12;
    --accent-crimson: #dc3545;
    --accent-gold: #f4d03f;
    
    /* 카드 색상 */
    --card-attack: #c0392b;
    --card-skill: #2980b9;
    --card-power: #8e44ad;
    
    /* 그림자 */
    --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.4);
    --glow-gold: 0 0 30px rgba(244, 208, 63, 0.4);
}
```

### 애니메이션 정의

```css
/* 애니메이션은 해당 시스템 JS 파일 하단에 정의 */
const systemStyles = document.createElement('style');
systemStyles.textContent = `
    @keyframes animationName {
        0% { ... }
        100% { ... }
    }
`;
document.head.appendChild(systemStyles);
```

---

## 📜 스크립트 로드 순서

`index.html`에 정의된 순서를 따릅니다:

```html
<!-- 1. 기본 시스템 -->
<script src="language.js"></script>
<script src="player-stats.js"></script>
<script src="npc.js"></script>

<!-- 2. 이펙트 시스템 -->
<script src="effects.js"></script>
<script src="vfx.js"></script>
<script src="background.js"></script>

<!-- 3. 게임 시스템 -->
<script src="shield.js"></script>
<script src="relics.js"></script>
<script src="monster.js"></script>
<script src="cards.js"></script>

<!-- 4. UI 시스템 -->
<script src="job-system.js"></script>
<script src="town.js"></script>
<script src="title.js"></script>

<!-- 5. 전투 시스템 -->
<script src="combat-effects.js"></script>
<script src="enemy-ai.js"></script>
<script src="bleed-system.js"></script>

<!-- 6. 메인 게임 (마지막) -->
<script src="game.js"></script>
```

> ⚠️ **주의**: 의존성 있는 시스템은 반드시 순서를 지켜야 합니다.

---

## ✅ 체크리스트

### 새 카드 추가 시
- [ ] `cards.js`의 `cardDatabase`에 카드 정의 추가
- [ ] `createCard` 함수로 생성 가능 확인
- [ ] 이펙트 연출 추가 (`EffectSystem` 사용)
- [ ] 로그 메시지 추가 (`addLog`)
- [ ] 필요시 직업 시작 덱에 추가

### 새 몬스터 추가 시
- [ ] 적절한 데이터베이스 선택 (`enemyDatabase`, `eliteDatabase`, `bossDatabase`)
- [ ] 인텐트 패턴 정의
- [ ] 패시브가 있다면 `passives` 배열에 추가
- [ ] 이미지 파일 준비 (`.png`)

### 새 시스템 추가 시
- [ ] 싱글톤 객체 패턴 사용
- [ ] `init()` 함수 정의
- [ ] `window.SystemName` 등록
- [ ] `DOMContentLoaded` 이벤트에 초기화 연결
- [ ] `index.html`에 스크립트 추가 (올바른 위치)
- [ ] 콘솔 로그에 `[SystemName]` 접두사 사용
- [ ] **전체화면 UI 시**: 반응형 스타일 필수 추가 (📱 반응형 시스템 섹션 참조)

### 새 유물 추가 시
- [ ] `relics.js`의 `relicDatabase`에 유물 정의
- [ ] 적절한 콜백 함수 정의 (`onAcquire`, `onCardPlayed` 등)
- [ ] `RelicUI`에서 표시 확인

### 새 전체화면 UI/모달/이벤트 추가 시
- [ ] `100vw`, `100vh` 사용하여 전체 화면 커버
- [ ] 태블릿(1024px), 모바일(768px, 480px, 320px) 미디어 쿼리 추가
- [ ] 낮은 높이(600px 이하), 가로 모드(500px 이하) 미디어 쿼리 추가
- [ ] 폰트 크기에 `clamp()` 또는 미디어 쿼리 적용
- [ ] 버튼/터치 영역 최소 44px 이상 (모바일)
- [ ] 레터박스 높이 축소 (모바일에서 5% 이하)
- [ ] 320px 너비에서 UI 깨지지 않는지 테스트
- [ ] 다크소울 스타일 테마 적용 (색상, 폰트, 애니메이션)

---

## 🔧 유틸리티 함수

### 자주 사용하는 함수

```javascript
// 로그 추가
addLog(message, type); // type: 'damage', 'block', 'heal', 'special'

// UI 업데이트
updateUI();           // 전체 UI 갱신
updateEnemiesUI();    // 적 UI 갱신
renderHand();         // 손패 렌더링

// 카드 드로우
drawCards(count, animate);

// 적 요소 가져오기
getSelectedEnemyElement();
getEnemyElement(index);

// 무작위 선택
getRandomNormalEnemy();
getRandomEliteEnemy();
getRandomBossEnemy();
```

---

## 💾 저장/로드

### localStorage 키

| 키 | 용도 |
|----|------|
| `lordofnight_player_deck` | 플레이어 덱 |
| `lordofnight_player_sprite` | 플레이어 스프라이트 |
| `lordofnight_slash_sprite` | 공격 스프라이트 |
| `shadowDeck_jobs` | 직업 데이터 |
| `shadowDeck_relicLoadout` | 장착 유물 |
| `shadowDeck_unlockedRelics` | 해금 유물 |
| `shadowDeck_rescuedNpcs` | 구출 NPC |
| `shadowDeck_gold` | 골드 |

---

## ⚔️ 배틀 레이아웃 시스템

### 통합 레이아웃 원칙

플레이어와 몬스터는 **동일한 바닥선(baseline)**에 정렬됩니다.

```css
:root {
    --battle-baseline: 0px;        /* 바닥선 기준 */
    --sprite-area-height: 280px;   /* 스프라이트 영역 높이 */
    --intent-top-offset: 10px;     /* 인텐트 상단 여백 */
    --unit-gap: 15px;              /* 유닛 간 간격 */
}
```

### 배치 구조

```
┌─────────────────────────────────────────────────┐
│                  .battle-arena                   │
│  ┌─────────────┐              ┌─────────────┐   │
│  │ .player-side│              │ .enemy-area │   │
│  │             │              │             │   │
│  │  [인텐트]   │              │  [인텐트]   │   │ ← 절대 위치
│  │  ┌─────┐   │              │  ┌─────┐    │   │
│  │  │스프 │   │              │  │스프 │    │   │
│  │  │라이트│   │              │  │라이트│    │   │
│  │  └─────┘   │              │  └─────┘    │   │
│  │  ─────────  │              │  ─────────  │   │ ← 바닥선
│  │   [HP바]   │              │   [HP바]    │   │
│  │   [이름]   │              │   [이름]    │   │
│  └─────────────┘              └─────────────┘   │
└─────────────────────────────────────────────────┘
```

### 중요 규칙

1. **`#player`에 `translateY` 사용 금지**
   - 플레이어와 몬스터는 자연스럽게 바닥선에 정렬
   
2. **인텐트는 절대 위치**
   ```css
   .enemy-intent-display {
       position: absolute;
       top: -45px;
       left: 50%;
       transform: translateX(-50%);
   }
   ```

3. **유닛 간격은 CSS 변수 사용**
   ```css
   .enemies-container {
       gap: var(--unit-gap);
   }
   ```

---

## 📱 반응형 시스템

### 파일 구조

| 파일 | 역할 |
|------|------|
| `responsive.css` | 미디어 쿼리, CSS 변수 기반 반응형 스타일 |
| `responsive.js` | 해상도 감지, 동적 레이아웃 조정 |
| `mobile-touch.js` | 모바일 터치 인터랙션 |

### 브레이크포인트

| 이름 | 너비 범위 | CSS 클래스 | 스케일 |
|------|----------|-----------|--------|
| 초소형 | 0 ~ 319px | `res-tiny` | 0.5 |
| 소형 모바일 | 320 ~ 480px | `res-mobile-sm` | 0.6 |
| 모바일 | 481 ~ 767px | `res-mobile` | 0.7 |
| 태블릿 | 768 ~ 1023px | `res-tablet` | 0.8 |
| 노트북 | 1024 ~ 1365px | `res-laptop` | 0.85 |
| PC | 1366 ~ 1919px | `res-desktop` | 1.0 |
| 대형 | 1920 ~ 2559px | `res-large` | 1.1 |
| 초대형 | 2560 ~ 3839px | `res-xlarge` | 1.25 |
| 4K | 3840px+ | `res-4k` | 1.5 |

### 높이 브레이크포인트

| 이름 | 높이 범위 | CSS 클래스 |
|------|----------|-----------|
| 매우 낮음 | ~ 400px | `height-tiny` |
| 낮음 | 401 ~ 600px | `height-low` |
| 중간 | 601 ~ 800px | `height-medium` |
| 일반 | 800px+ | `height-normal` |

### CSS 변수 사용

```css
/* 스케일 변수 - 자동 적용됨 */
:root {
    --scale: 1;           /* 전체 스케일 */
    --card-scale: 1;      /* 카드 스케일 */
    --font-scale: 1;      /* 폰트 스케일 */
}

/* 요소에 스케일 적용 */
.my-element {
    width: calc(100px * var(--scale));
    font-size: calc(1rem * var(--font-scale));
}
```

### ResponsiveSystem API

```javascript
// 현재 브레이크포인트 가져오기
ResponsiveSystem.getBreakpoint();  // 'desktop', 'mobile' 등

// 디바이스 타입 확인
ResponsiveSystem.isMobile();    // true/false
ResponsiveSystem.isTablet();    // true/false
ResponsiveSystem.isDesktop();   // true/false
ResponsiveSystem.isTouchDevice(); // true/false

// 스케일 값
ResponsiveSystem.getScale();    // 0.5 ~ 1.5

// 뷰포트 정보
ResponsiveSystem.getViewportInfo();
// { width, height, breakpoint, isLandscape, ... }

// 강제 리프레시
ResponsiveSystem.refresh();

// 디버그 모드 (개발용)
ResponsiveSystem.enableDebug();   // 해상도 정보 표시
ResponsiveSystem.disableDebug();

// 전체 화면 토글
ResponsiveSystem.toggleFullscreen();
```

### 브레이크포인트 변경 이벤트

```javascript
window.addEventListener('breakpointChange', (e) => {
    console.log('이전:', e.detail.previous);
    console.log('현재:', e.detail.current);
    console.log('가로:', e.detail.isLandscape);
    
    // 레이아웃 재조정
    if (e.detail.current === 'mobile') {
        // 모바일 전용 처리
    }
});
```

### 유틸리티 클래스

```html
<!-- 모바일에서만 표시 -->
<div class="mobile-only">모바일 전용</div>

<!-- 데스크탑에서만 표시 -->
<div class="desktop-only">PC 전용</div>
```

### 노치/세이프 에어리어 대응

```css
/* 자동 적용됨 */
.game-container {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
}
```

### 🚨 모달/전체화면 UI 반응형 필수 규칙

> ⚠️ **중요**: 모든 전체화면 UI(모달, 오버레이, 이벤트 화면 등)는 **반드시** 반응형을 지원해야 합니다.

#### 필수 미디어 쿼리 패턴

모든 전체화면 UI 스타일에는 다음 브레이크포인트를 **반드시** 포함하세요:

```css
/* 기본 스타일 (PC 기준) */
.my-overlay {
    /* ... */
}

/* 태블릿 (1024px 이하) */
@media (max-width: 1024px) {
    .my-overlay {
        /* 패딩/마진 줄이기, 폰트 축소 */
    }
}

/* 작은 태블릿/큰 모바일 (768px 이하) */
@media (max-width: 768px) {
    .my-overlay {
        /* 레이아웃 단순화, 폰트 더 축소 */
    }
}

/* 모바일 (480px 이하) */
@media (max-width: 480px) {
    .my-overlay {
        /* 최소 레이아웃, 터치 친화적 버튼 크기 */
    }
}

/* 아주 작은 모바일 (320px 이하) */
@media (max-width: 320px) {
    .my-overlay {
        /* 극한 축소, 필수 요소만 표시 */
    }
}

/* 높이가 낮은 화면 */
@media (max-height: 600px) {
    .my-overlay {
        /* 세로 공간 절약, 마진 축소 */
    }
}

/* 가로 모드 모바일 */
@media (max-height: 500px) and (orientation: landscape) {
    .my-overlay {
        /* 가로 레이아웃 최적화, 사이드바 형태 등 */
    }
}
```

#### 반응형 체크리스트

새 전체화면 UI 추가 시 확인:

- [ ] `100vw`, `100vh` 사용하여 전체 화면 커버
- [ ] 폰트 크기에 `clamp()` 또는 미디어 쿼리 적용
- [ ] 버튼/터치 영역 최소 44px 이상 (모바일)
- [ ] 레터박스 높이 축소 (모바일에서 5% 이하)
- [ ] 가로 모드 레이아웃 테스트
- [ ] 320px 너비에서 UI 깨지지 않는지 확인
- [ ] 고정 px 값 대신 `%`, `vh`, `vw` 사용 권장

#### 폰트 크기 반응형 패턴

```css
/* clamp()로 유연한 폰트 크기 */
.title {
    font-size: clamp(1.5rem, 5vw, 3rem);
    /* 최소 1.5rem, 기본 5vw, 최대 3rem */
}

/* 또는 미디어 쿼리 사용 */
.title {
    font-size: 3rem;
}

@media (max-width: 768px) {
    .title { font-size: 2rem; }
}

@media (max-width: 480px) {
    .title { font-size: 1.5rem; }
}
```

#### 레이아웃 변환 패턴

```css
/* 데스크탑: 가로 정렬 */
.content {
    display: flex;
    flex-direction: row;
    gap: 40px;
}

/* 모바일: 세로 정렬 */
@media (max-width: 768px) {
    .content {
        flex-direction: column;
        gap: 20px;
    }
}
```

---

## 🎨 다크소울 스타일 UI 가이드

### 디자인 원칙

Shadow Deck의 전체 화면 UI(전직소, 도감 등)는 **다크소울** 스타일을 따릅니다:

| 원칙 | 설명 |
|------|------|
| 미니멀리즘 | 필요한 정보만, 과장 없이 |
| 어두운 배경 | 반투명 검은 배경으로 몰입감 유지 |
| 황금색 강조 | 선택/활성 상태에 골드 컬러 사용 |
| 세리프 폰트 | Cinzel 폰트로 중세 판타지 느낌 |
| 스크롤 지양 | 가능하면 한 화면에 모든 정보 표시 |

### 색상 팔레트

```css
/* 다크소울 테마 색상 */
--ds-bg: rgba(0, 0, 0, 0.9);           /* 배경 */
--ds-gold: #d4af37;                     /* 주요 강조 (선택, 활성) */
--ds-gold-dim: rgba(212, 175, 55, 0.3); /* 흐린 골드 */
--ds-beige: #c8b896;                    /* 보조 텍스트 */
--ds-cream: #f5e6c4;                    /* 주요 텍스트 */
--ds-brown: #6a6050;                    /* 비활성 텍스트 */
--ds-dark-brown: #5a5040;               /* 힌트 텍스트 */
--ds-line: rgba(180, 160, 120, 0.3);    /* 구분선 */
```

### 타이포그래피

```css
/* 제목 (Cinzel) */
font-family: 'Cinzel', 'Times New Roman', serif;
font-weight: 400;
letter-spacing: 4px;
text-transform: uppercase;

/* 본문 (Noto Sans KR) */
font-family: 'Noto Sans KR', sans-serif;
line-height: 1.6;
```

### 레이아웃 패턴

#### 2단 레이아웃 (전직소)

```
┌───────────────────────────────────────────────────┐
│                                                   │
│  ┌──────────┐           ┌──────────────────────┐ │
│  │          │           │ ┌──────┐  ┌────────┐ │ │
│  │ 좌측     │           │ │캐릭터│  │ 정보   │ │ │
│  │ 리스트   │           │ │이미지│  │ 패널   │ │ │
│  │          │           │ └──────┘  └────────┘ │ │
│  │          │           │                      │ │
│  │          │           │ ┌──────────────────┐ │ │
│  │          │           │ │ 카드 그리드      │ │ │
│  │          │           │ └──────────────────┘ │ │
│  │          │           │ ┌──────────────────┐ │ │
│  │          │           │ │ 확인 버튼        │ │ │
│  └──────────┘           └──────────────────────┘ │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 선택 상태

```css
/* 미선택 */
.ds-item {
    color: #a09080;
    border-left: 2px solid transparent;
}

/* 선택됨 */
.ds-item.selected {
    color: #f5e6c4;
    border-left-color: #d4af37;
    background: rgba(255, 255, 255, 0.05);
}

/* 현재 장착 */
.ds-item.equipped {
    color: #d4af37;
}

/* 잠김 */
.ds-item.locked {
    opacity: 0.35;
    cursor: not-allowed;
}
```

### 버튼 스타일

```css
.ds-button {
    background: transparent;
    border: 1px solid rgba(212, 175, 55, 0.5);
    color: #c8b896;
    font-family: 'Cinzel', serif;
    letter-spacing: 4px;
    padding: 18px 32px;
}

.ds-button:hover:not(:disabled) {
    background: rgba(212, 175, 55, 0.1);
    border-color: #d4af37;
    color: #f5e6c4;
    box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
}
```

### 키보드 지원

전체 화면 UI는 키보드 내비게이션을 지원합니다:

| 키 | 동작 |
|----|------|
| `↑` / `↓` | 항목 선택 이동 |
| `Enter` | 선택 확인 |
| `Escape` | 닫기 |

```javascript
// 키보드 핸들러 등록
this.keyHandler = (e) => this.handleKeyPress(e);
document.addEventListener('keydown', this.keyHandler);

// 닫을 때 핸들러 제거
closeUI() {
    document.removeEventListener('keydown', this.keyHandler);
    // ...
}
```

### 캐릭터 이미지 표시

직업별 캐릭터 스프라이트를 UI에 표시할 때:

```html
<div class="ds-character-display">
    <img src="${job.sprite}" alt="${job.name}" class="ds-character-img">
</div>
```

```css
.ds-character-display {
    width: 180px;
    height: 220px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: radial-gradient(ellipse at bottom, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
    border-bottom: 1px solid rgba(212, 175, 55, 0.3);
}

.ds-character-img {
    max-width: 160px;
    max-height: 200px;
    image-rendering: pixelated;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}
```

### 카드 그리드 (스크롤 없음)

```css
/* 스크롤 대신 그리드로 전체 표시 */
.ds-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
}

/* 카드 타입별 색상 */
.ds-card-item {
    border-left: 3px solid var(--type-color);
}

/* 공격 카드: #b54a4a (빨강) */
/* 스킬 카드: #4a6ab5 (파랑) */
```

### 반응형 대응

```css
/* 태블릿 */
@media (max-width: 1024px) {
    .ds-container {
        flex-direction: column;
        overflow-y: auto;
    }
    
    .ds-left-panel {
        flex-direction: row;
        flex-wrap: wrap;
    }
}

/* 모바일 */
@media (max-width: 600px) {
    .ds-detail-top {
        flex-direction: column;
        align-items: center;
    }
    
    .ds-card-grid {
        grid-template-columns: 1fr;
    }
    
    .ds-card-desc {
        display: none; /* 설명 숨김 */
    }
}
```

### 대장장이 (카드 강화) UI 패턴

`town.js`의 `openBlacksmith()`에서 구현:

```html
<div class="ds-blacksmith-modal">
    <div class="ds-backdrop"></div>
    <div class="ds-blacksmith-container">
        <!-- 왼쪽: NPC + 카드 목록 -->
        <div class="ds-blacksmith-left">
            <div class="ds-title">...</div>
            <div class="ds-blacksmith-character">
                <img src="blacksmith.png" class="ds-blacksmith-img">
            </div>
            <div class="ds-card-list">
                <!-- 카드 아이템들 -->
            </div>
        </div>
        
        <!-- 오른쪽: 카드 비교 -->
        <div class="ds-blacksmith-right">
            <div class="ds-card-comparison">
                <div class="ds-large-card">현재 카드</div>
                <div class="ds-comparison-arrow">⚒</div>
                <div class="ds-large-card upgraded">강화 후</div>
            </div>
            <button class="ds-forge-btn">강화하기</button>
        </div>
    </div>
</div>
```

**카드 목록 아이템:**
```css
.ds-card-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-left: 2px solid transparent;
    transition: all 0.2s ease;
}

.ds-card-item.selected {
    background: rgba(255, 255, 255, 0.05);
    border-left-color: #d4af37;
}

.ds-card-item.upgradable {
    background: rgba(212, 175, 55, 0.05);
}

.ds-card-item.upgraded {
    opacity: 0.5;
}
```

**카드 비교 큰 카드:**
```css
.ds-large-card {
    width: 160px;
    height: 220px;
    background: linear-gradient(160deg, #252535 0%, #15151f 100%);
    border: 2px solid #4a4a6a;
    border-radius: 10px;
}

.ds-large-card.upgraded {
    border-color: #d4af37;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}
```

---

## 🗺️ 맵 UI 시스템 (`map-ui.js`)

### 개요
던전 탐험 맵 UI를 다크소울 스타일로 렌더링합니다. `MapSystem`과 분리되어 UI 관련 로직만 담당합니다.

### 아키텍처
```
MapSystem (map.js)          MapUI (map-ui.js)
    ├─ 게임 로직              ├─ 컨테이너 생성
    ├─ 방 생성/연결           ├─ 미니맵 렌더링
    ├─ 전투/이벤트 처리       ├─ UI 업데이트
    └─ 상태 관리              └─ 스타일 주입
```

### 주요 API

```javascript
// 맵 컨테이너 생성 (다크소울 스타일)
MapUI.createMapContainer();

// UI 업데이트 (HP, 골드, 방 현황)
MapUI.updateUI(mapSystem);

// 현재 방 정보 표시
MapUI.updateRoomDisplay(mapSystem, room, roomInfo);

// 미니맵 HTML 생성
const html = MapUI.renderMinimap(mapSystem, cellSize, roomSize);

// 메시지 표시
MapUI.showMessage('인접한 방만 이동할 수 있습니다!');
```

### UI 구조

```html
<div class="ds-map-screen">
    <!-- 상단 헤더 -->
    <div class="ds-map-header">
        <div class="ds-dungeon-info">던전 이름 + 층</div>
        <div class="ds-player-stats">HP, 골드, 방 현황</div>
    </div>
    
    <!-- 미니맵 영역 -->
    <div class="ds-map-container">
        <div class="ds-map-frame">
            <div class="ds-map-inner">
                <div id="room-minimap">...</div>
            </div>
        </div>
    </div>
    
    <!-- 현재 방 패널 -->
    <div class="ds-room-panel">
        <div class="ds-room-display">방 아이콘 + 정보</div>
        <div class="ds-room-actions">입장/메뉴 버튼</div>
    </div>
    
    <!-- 하단 힌트 -->
    <div class="ds-map-hint">WASD 이동 │ Enter 입장</div>
</div>
```

### 방 타입별 스타일

| 타입 | 클래스 | 테두리 색상 |
|------|--------|------------|
| 시작 | `type-start` | #4a4a6a |
| 몬스터 | `type-monster` | #4a3030 |
| 엘리트 | `type-elite` | #6a4a00 (골드 글로우) |
| 보스 | `type-boss` | #8b0000 (붉은 글로우) |
| 보물 | `type-treasure` | #4a6a4a |
| 상점 | `type-shop` | #4a4a6a |
| 이벤트 | `type-event` | #6a4a6a |

### 방 상태 클래스

```css
.ds-room.current { /* 현재 위치 - 골드 테두리 + 펄스 */ }
.ds-room.visited { /* 방문함 - 아이콘 필터 해제 */ }
.ds-room.cleared { /* 클리어 - 투명도 감소 + 체크마크 */ }
.ds-room.accessible { /* 이동 가능 - 골드 테두리 + 글로우 */ }
.ds-room.has-captive { /* NPC 구출 대상 - 초록 테두리 */ }
```

### MapSystem에서 사용

```javascript
// map.js에서 MapUI 연동
init() {
    if (typeof MapUI !== 'undefined') {
        MapUI.createMapContainer();
    }
    this.setupEventListeners();
}

renderMinimap() {
    if (typeof MapUI !== 'undefined') {
        const html = MapUI.renderMinimap(this, cellSize, roomSize);
        minimapEl.innerHTML = html;
    }
}
```

---

## 📦 보물상자 시스템 (`treasure.js`)

### 개요
보물방에서 드래그하여 상자를 열면 확률에 따라 다양한 보상을 획득합니다.

### 보상 확률
| 보상 타입 | 확률 | 설명 |
|-----------|------|------|
| 카드 | 35% | 3개 중 1개 선택 |
| 유물 | 25% | 랜덤 유물 1개 |
| 골드 | 25% | 40~100 골드 |
| 미믹 | 15% | 미믹 전투 → 승리 시 유물 |

### 드래그 열기 메커니즘
```javascript
TreasureSystem.open(room);  // 보물상자 모달 열기

// 드래그 상태
isDragging: false,
dragStartY: 0,
currentDragY: 0,
requiredDrag: 150,  // 필요한 드래그 거리 (px)
```

### UI 구조
```html
<div class="ds-treasure">
    <div class="ds-chest-area">
        <div class="ds-chest">
            <div class="chest-lid">뚜껑</div>
            <div class="chest-body">몸체</div>
        </div>
        <div class="ds-drag-indicator">
            <div class="drag-arrow">↑</div>
            <div class="drag-progress">진행 바</div>
        </div>
    </div>
    <div class="ds-reward-area">보상 표시</div>
</div>
```

### 미믹 전투
- `mimic` 몬스터 데이터: `monster.js`
- 전투 승리 시 `TreasureSystem.onMimicVictory()` 호출
- 유물 보상 자동 지급

---

## 🚀 백업

중요한 변경 후에는 백업 스크립트를 실행하세요:

```powershell
.\backup.ps1
```

> `backup_yyyyMMdd_HHmmss` 형식의 폴더가 생성됩니다.

---

**Last Updated**: 2025-12-23

