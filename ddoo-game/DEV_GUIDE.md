# 🎮 DDOO Game 개발 가이드

> **다크소울풍 덱빌딩 로그라이크 게임**  
> DDOO Engine 기반 모듈화된 아키텍처

---

## 📋 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [디렉토리 구조](#-디렉토리-구조)
3. [핵심 모듈](#-핵심-모듈)
4. [게임 디자인 철학](#-게임-디자인-철학)
5. [코딩 컨벤션](#-코딩-컨벤션)
6. [모듈 개발 가이드](#-모듈-개발-가이드)
7. [전투 시스템](#-전투-시스템)
8. [이펙트 & 연출](#-이펙트--연출)
9. [사운드 시스템](#-사운드-시스템)
10. [세이브 & 로드](#-세이브--로드)

---

## 🎯 프로젝트 개요

### 컨셉
- **장르**: 덱빌딩 로그라이크 + 턴제 전투
- **분위기**: 다크소울 / 블러드본 (어둡고 긴장감 있는)
- **아트 스타일**: 픽셀아트 + 3D 배경 하이브리드

### 핵심 특징
| 특징 | 설명 |
|------|------|
| ⚔️ 묵직한 전투 | 한 방 한 방이 중요한 전투 |
| 💀 높은 난이도 | 죽음에서 배우는 시스템 |
| 🃏 덱빌딩 | 카드 조합으로 전략 구성 |
| 🏰 던전 탐험 | 절차적 생성 던전 |
| 🔥 화려한 연출 | 타격감 있는 이펙트 |

### 기술 스택
```
- PixiJS 8.x     : 2D 렌더링
- Three.js r128  : 3D 배경
- GSAP 3.x       : 애니메이션
- Vanilla JS     : 게임 로직 (프레임워크 없음)
```

---

## 📁 디렉토리 구조

```
ddoo-game/
├── 📁 engine/              # 🔧 DDOO 엔진 (코어 모듈)
│   ├── ddoo-config.js      # 전역 설정
│   ├── ddoo-background.js  # 3D 배경 시스템
│   ├── ddoo-renderer.js    # 스프라이트 렌더링
│   ├── ddoo-floater.js     # 플로팅 텍스트
│   ├── ddoo-action.js      # 애니메이션 시스템
│   └── ddoo-chakram.js     # 특수 VFX
│
├── 📁 modules/             # 🎮 게임 모듈 (추가 예정)
│   ├── combat.js           # 전투 시스템
│   ├── deck.js             # 덱/카드 관리
│   ├── dungeon.js          # 던전 생성
│   ├── enemy-ai.js         # 적 AI
│   ├── player.js           # 플레이어 상태
│   ├── progression.js      # 진행/업그레이드
│   ├── audio.js            # 사운드 매니저
│   └── save.js             # 저장/불러오기
│
├── 📁 data/                # 📊 게임 데이터 (JSON)
│   ├── cards/              # 카드 정의
│   ├── enemies/            # 적 정의
│   ├── dungeons/           # 던전 구성
│   └── events/             # 이벤트 정의
│
├── 📁 anim/                # 🎬 애니메이션 JSON
│   ├── player.*.json       # 플레이어 애니메이션
│   ├── enemy.*.json        # 적 애니메이션
│   └── card.*.json         # 카드 사용 애니메이션
│
├── 📁 image/               # 🖼️ 이미지 에셋
│   ├── characters/         # 캐릭터 스프라이트
│   ├── cards/              # 카드 아이콘
│   ├── ui/                 # UI 요소
│   └── effects/            # 이펙트 스프라이트
│
├── 📁 sound/               # 🔊 사운드 에셋
│   ├── bgm/                # 배경음악
│   ├── sfx/                # 효과음
│   └── voice/              # 보이스 (선택)
│
├── index.html              # 메인 게임 HTML
├── studio.html             # 🛠️ DDOO Action Studio
├── game.js                 # 게임 엔트리포인트
└── styles.css              # 스타일시트
```

---

## 🔧 핵심 모듈

### 1. DDOOConfig (전역 설정)
```javascript
// 이미지 경로 관리
DDOOConfig.getImagePath('hero.png')  // → 'image/hero.png'
DDOOConfig.setImagePath('assets/')   // 경로 변경
```

### 2. DDOOBackground (3D 배경)
```javascript
// 초기화
await DDOOBackground.init();

// 테마 변경 (dungeon, forest, hell, ice, void)
DDOOBackground.setTheme('hell');

// 이펙트
DDOOBackground.screenFlash('#ff0000', 100);  // 화면 플래시
DDOOBackground.hitFlash(x, y, z, color, intensity, duration);
DDOOBackground.shake(0.5, 200);              // 카메라 흔들림
DDOOBackground.damageVignette();             // 피격 비네트

// 카메라 제어
DDOOBackground.setZoom(1.2);    // 줌
DDOOBackground.panTo(-3, 0.5);  // 패닝
```

### 3. DDOORenderer (스프라이트 렌더링)
```javascript
// 스프라이트 생성
const sprite = await DDOORenderer.createSprite('goblin.png', {
    scale: 1.5,
    outline: { enabled: true, color: 0x000000, thickness: 3 },
    shadow: { enabled: true, alpha: 0.7 },
    breathing: { enabled: true, scaleAmount: 0.02 }
});

// 상태 이펙트
DDOORenderer.rapidFlash(sprite);           // 빠른 깜빡임
DDOORenderer.damageShake(sprite, 10, 300); // 피격 흔들림
DDOORenderer.setTargeted(sprite, true, 0xff4444);  // 타겟팅 글로우

// 등장/사망
await DDOORenderer.playSpawn(sprite, 'right', 0.5);
await DDOORenderer.playDeath(sprite, app);
```

### 4. DDOOFloater (플로팅 텍스트)
```javascript
// 데미지 표시
DDOOFloater.showOnCharacter(sprite, 25, 'damage');
DDOOFloater.showOnCharacter(sprite, 50, 'critical');
DDOOFloater.showOnCharacter(sprite, 10, 'heal');

// 상태 표시
DDOOFloater.showOnCharacter(sprite, 'MISS', 'miss');
DDOOFloater.showOnCharacter(sprite, 'STUN', 'stun');
DDOOFloater.showOnCharacter(sprite, '+WEAK', 'weak');
```

### 5. DDOOAction (애니메이션 시스템)
```javascript
// JSON 애니메이션 재생
await DDOOAction.play('player.attack', playerContainer);
await DDOOAction.play('enemy.hit', enemyContainer);

// 시퀀스 재생
await DDOOAction.playSequence('card.strike', {
    player: playerContainer,
    enemy: enemyContainer
});
```

---

## 🗡️ 게임 디자인 철학

### 다크소울 DNA
```
┌─────────────────────────────────────────────────────┐
│  "어려움 속에서 성취감을 찾는다"                        │
├─────────────────────────────────────────────────────┤
│  ✓ 적은 무시할 수 없다 - 잡몹도 위협                   │
│  ✓ 패턴을 읽어라 - 예측 가능한 적 행동                  │
│  ✓ 리소스 관리 - 에너지/카드 신중히 사용                │
│  ✓ 죽음은 교훈 - 실패해도 배움이 있다                   │
│  ✓ 성장의 보람 - 플레이어 스킬 + 캐릭터 성장            │
└─────────────────────────────────────────────────────┘
```

### 전투 느낌
| 요소 | 목표 |
|------|------|
| 타격 | 묵직하고 파괴적 |
| 피격 | 아프고 위협적 |
| 회피 | 쾌감 있고 보상적 |
| 처치 | 카타르시스 |
| 사망 | 좌절보다 도전 욕구 |

### 피드백 레이어
```
1️⃣ 시각적 피드백
   - 스프라이트 흔들림/깜빡임
   - 화면 플래시/흔들림
   - 파티클 이펙트
   - 데미지 숫자

2️⃣ 청각적 피드백
   - 타격음 (묵직)
   - 피격음 (고통)
   - 환경음 (긴장감)
   - BGM (분위기)

3️⃣ 게임플레이 피드백
   - 히트스탑 (순간 정지)
   - 슬로우모션
   - 넉백/밀림
```

---

## 📝 코딩 컨벤션

### 모듈 구조
```javascript
// =====================================================
// 모듈명 - 간단한 설명
// =====================================================

const ModuleName = {
    // ========== 설정 ==========
    config: {
        // 설정값...
    },
    
    // ========== 상태 ==========
    state: {
        initialized: false,
        // 상태값...
    },
    
    // ========== 초기화 ==========
    init() {
        if (this.state.initialized) return;
        // 초기화 로직...
        this.state.initialized = true;
        console.log('[ModuleName] ✅ 초기화 완료');
    },
    
    // ========== 공개 API ==========
    publicMethod() {
        // ...
    },
    
    // ========== 내부 메서드 ==========
    _privateMethod() {
        // ...
    },
    
    // ========== 정리 ==========
    dispose() {
        // 리소스 해제...
        this.state.initialized = false;
    }
};

// 전역 노출
window.ModuleName = ModuleName;
```

### 네이밍 규칙
```javascript
// 모듈: PascalCase
const CombatSystem = {};
const DeckManager = {};

// 함수/메서드: camelCase
function dealDamage() {}
function calculateCrit() {}

// 상수: UPPER_SNAKE_CASE
const MAX_HAND_SIZE = 10;
const BASE_ENERGY = 3;

// 비공개: _prefix
function _internalHelper() {}

// 이벤트 핸들러: on + Event
function onCardPlayed() {}
function onEnemyDeath() {}
```

### 주석 스타일
```javascript
// ========== 섹션 구분 ==========

/**
 * 함수 설명
 * @param {number} damage - 피해량
 * @param {boolean} isCrit - 크리티컬 여부
 * @returns {number} 최종 피해량
 */
function applyDamage(damage, isCrit) {
    // 단일 줄 주석
    
    /*
     * 여러 줄 주석
     * 복잡한 로직 설명
     */
}

// TODO: 나중에 구현
// FIXME: 버그 수정 필요
// HACK: 임시 해결책
```

---

## 🛠️ 모듈 개발 가이드

### 새 모듈 생성 템플릿

```javascript
// modules/example.js
// =====================================================
// Example - 예제 모듈
// =====================================================

const Example = {
    // ========== 설정 ==========
    config: {
        defaultValue: 100,
        enableFeature: true
    },
    
    // ========== 상태 ==========
    state: {
        initialized: false,
        data: null
    },
    
    // ========== 초기화 ==========
    init(options = {}) {
        if (this.state.initialized) {
            console.warn('[Example] 이미 초기화됨');
            return this;
        }
        
        // 옵션 병합
        Object.assign(this.config, options);
        
        // 초기화 로직
        this._setup();
        
        this.state.initialized = true;
        console.log('[Example] ✅ 초기화 완료');
        return this;
    },
    
    // ========== 공개 API ==========
    
    doSomething(param) {
        if (!this.state.initialized) {
            console.error('[Example] 초기화 필요');
            return null;
        }
        
        return this._process(param);
    },
    
    // ========== 내부 메서드 ==========
    
    _setup() {
        // 내부 설정
    },
    
    _process(param) {
        // 내부 처리
        return param * this.config.defaultValue;
    },
    
    // ========== 이벤트 ==========
    
    onEvent(callback) {
        // 이벤트 등록
    },
    
    // ========== 정리 ==========
    
    dispose() {
        this.state.data = null;
        this.state.initialized = false;
        console.log('[Example] 🗑️ 정리 완료');
    }
};

// 전역 노출
window.Example = Example;

console.log('[Example] 스크립트 로드됨');
```

### 모듈 의존성 관리
```html
<!-- index.html - 로드 순서 중요! -->

<!-- 1. 외부 라이브러리 -->
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/gsap.min.js"></script>

<!-- 2. DDOO 엔진 (순서 중요) -->
<script src="engine/ddoo-config.js"></script>      <!-- 설정 먼저 -->
<script src="engine/ddoo-background.js"></script>  <!-- 3D 배경 -->
<script src="engine/ddoo-renderer.js"></script>    <!-- 렌더러 -->
<script src="engine/ddoo-floater.js"></script>     <!-- 플로터 -->
<script src="engine/ddoo-action.js"></script>      <!-- 액션 -->

<!-- 3. 게임 모듈 (의존성 순서) -->
<script src="modules/audio.js"></script>           <!-- 사운드 -->
<script src="modules/player.js"></script>          <!-- 플레이어 -->
<script src="modules/enemy-ai.js"></script>        <!-- 적 AI -->
<script src="modules/deck.js"></script>            <!-- 덱 -->
<script src="modules/combat.js"></script>          <!-- 전투 -->
<script src="modules/dungeon.js"></script>         <!-- 던전 -->
<script src="modules/save.js"></script>            <!-- 저장 -->

<!-- 4. 메인 게임 -->
<script src="game.js"></script>
```

---

## ⚔️ 전투 시스템

### 전투 플로우
```
┌─────────────────────────────────────────────────────┐
│                    전투 시작                         │
│  - 적 등장 연출                                      │
│  - 손패 드로우                                       │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│                  플레이어 턴                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ 1. 카드 선택                                    │ │
│  │ 2. 타겟 선택 (필요시)                           │ │
│  │ 3. 카드 사용 애니메이션                         │ │
│  │ 4. 효과 적용                                    │ │
│  │ 5. 반복 or 턴 종료                              │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│                    적 턴                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ 1. 적 인텐트 표시                               │ │
│  │ 2. 적 행동 실행                                 │ │
│  │ 3. 데미지/효과 적용                             │ │
│  │ 4. 다음 적 반복                                 │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│                   턴 종료                           │
│  - 상태이상 틱 (독, 화상 등)                        │
│  - 블록 소멸                                        │
│  - 다음 턴 드로우                                   │
└─────────────────┬───────────────────────────────────┘
                  ▼
          ┌───────┴───────┐
          ▼               ▼
      [승리 체크]     [사망 체크]
          │               │
          ▼               ▼
       보상 획득      게임 오버
```

### 데미지 계산
```javascript
// 기본 데미지 공식
function calculateDamage(baseDamage, attacker, defender) {
    let damage = baseDamage;
    
    // 1. 공격력 버프/디버프
    damage *= (1 + attacker.strength * 0.1);
    
    // 2. 취약 상태 (받는 데미지 +50%)
    if (defender.hasStatus('vulnerable')) {
        damage *= 1.5;
    }
    
    // 3. 약화 상태 (주는 데미지 -25%)
    if (attacker.hasStatus('weak')) {
        damage *= 0.75;
    }
    
    // 4. 크리티컬 (2배)
    const critChance = attacker.critChance || 0.05;
    const isCrit = Math.random() < critChance;
    if (isCrit) {
        damage *= 2;
    }
    
    // 5. 블록 차감
    const blocked = Math.min(defender.block, damage);
    damage -= blocked;
    defender.block -= blocked;
    
    // 6. 최소 0
    damage = Math.max(0, Math.floor(damage));
    
    return { damage, blocked, isCrit };
}
```

### 상태이상 시스템
```javascript
const STATUS_EFFECTS = {
    // 디버프
    vulnerable: {
        name: '취약',
        icon: '💔',
        description: '받는 피해 50% 증가',
        stackable: true,
        duration: true  // 턴 기반
    },
    weak: {
        name: '약화',
        icon: '😰',
        description: '주는 피해 25% 감소',
        stackable: true,
        duration: true
    },
    poison: {
        name: '독',
        icon: '🧪',
        description: '턴 종료 시 독 스택만큼 피해',
        stackable: true,
        duration: false  // 스택 기반
    },
    burn: {
        name: '화상',
        icon: '🔥',
        description: '턴 종료 시 화상 스택만큼 피해 후 절반 감소',
        stackable: true,
        duration: false
    },
    
    // 버프
    strength: {
        name: '힘',
        icon: '💪',
        description: '스택당 공격력 +10%',
        stackable: true,
        duration: false,
        buff: true
    },
    block: {
        name: '방어',
        icon: '🛡️',
        description: '데미지 흡수',
        stackable: true,
        duration: false,
        buff: true
    },
    regen: {
        name: '재생',
        icon: '💚',
        description: '턴 종료 시 회복',
        stackable: true,
        duration: true,
        buff: true
    }
};
```

---

## ✨ 이펙트 & 연출

### 타격 연출 체크리스트
```javascript
async function performAttack(attacker, defender, damage, options = {}) {
    const { isCrit, isHeavy } = options;
    
    // 1️⃣ 공격자 애니메이션
    await DDOOAction.play('player.attack', attacker);
    
    // 2️⃣ 타겟 하이라이트
    DDOORenderer.setTargeted(defender, true, 0xff4444);
    
    // 3️⃣ 히트스탑 (순간 정지)
    await delay(isCrit ? 100 : 50);
    
    // 4️⃣ 피격 이펙트
    DDOORenderer.rapidFlash(defender);
    DDOORenderer.damageShake(defender, isCrit ? 15 : 8, 300);
    
    // 5️⃣ 화면 이펙트
    DDOOBackground.screenFlash(isCrit ? '#ffaa00' : '#ffffff', 80);
    if (isCrit) {
        DDOOBackground.shake(0.6, 150);
    }
    
    // 6️⃣ 3D 조명
    DDOOBackground.hitFlash(
        defender.x / 50,  // 3D 좌표 변환
        4, 5,
        isCrit ? 0xffaa00 : 0xffffff,
        isCrit ? 12 : 6,
        200
    );
    
    // 7️⃣ 데미지 숫자
    DDOOFloater.showOnCharacter(
        defender, 
        damage, 
        isCrit ? 'critical' : 'damage'
    );
    
    // 8️⃣ 사운드
    Audio.play(isHeavy ? 'hit_heavy' : 'hit');
    if (isCrit) Audio.play('critical');
    
    // 9️⃣ 피격 애니메이션
    await DDOOAction.play('enemy.hit', defender);
    
    // 🔟 타겟 해제
    DDOORenderer.setTargeted(defender, false);
}
```

### 사망 연출
```javascript
async function performDeath(enemy, app) {
    // 1. 사망 애니메이션 (마젠타 + 붕괴)
    await DDOORenderer.playDeath(enemy, app);
    
    // 2. 화면 플래시
    DDOOBackground.screenFlash('#ff00ff', 150);
    
    // 3. 사운드
    Audio.play('enemy_death');
    
    // 4. 정리
    enemy.destroy();
}
```

---

## 🔊 사운드 시스템

### Audio 모듈 구조
```javascript
// modules/audio.js
const Audio = {
    config: {
        bgmVolume: 0.5,
        sfxVolume: 0.7,
        enabled: true
    },
    
    sounds: {},
    currentBGM: null,
    
    // 사운드 프리로드
    preload(sounds) {
        sounds.forEach(name => {
            this.sounds[name] = new Howl({
                src: [`sound/${name}.mp3`],
                volume: this.config.sfxVolume
            });
        });
    },
    
    // SFX 재생
    play(name, options = {}) {
        if (!this.config.enabled) return;
        const sound = this.sounds[name];
        if (sound) {
            sound.volume(options.volume || this.config.sfxVolume);
            sound.play();
        }
    },
    
    // BGM 재생
    playBGM(name) {
        if (this.currentBGM) this.currentBGM.stop();
        
        this.currentBGM = new Howl({
            src: [`sound/bgm/${name}.mp3`],
            volume: this.config.bgmVolume,
            loop: true
        });
        this.currentBGM.play();
    }
};
```

### 필수 사운드 목록
```
sound/
├── sfx/
│   ├── hit.mp3           # 기본 타격
│   ├── hit_heavy.mp3     # 강타격
│   ├── hit_critical.mp3  # 크리티컬
│   ├── block.mp3         # 방어
│   ├── card_draw.mp3     # 카드 드로우
│   ├── card_use.mp3      # 카드 사용
│   ├── heal.mp3          # 회복
│   ├── buff.mp3          # 버프
│   ├── debuff.mp3        # 디버프
│   ├── enemy_death.mp3   # 적 사망
│   └── player_damage.mp3 # 플레이어 피격
│
└── bgm/
    ├── dungeon.mp3       # 던전 탐험
    ├── battle.mp3        # 일반 전투
    ├── boss.mp3          # 보스 전투
    └── victory.mp3       # 승리
```

---

## 💾 세이브 & 로드

### 저장 데이터 구조
```javascript
const SaveData = {
    // 메타 정보
    meta: {
        version: '1.0.0',
        timestamp: Date.now(),
        playtime: 0
    },
    
    // 플레이어 정보
    player: {
        hp: 80,
        maxHp: 100,
        gold: 150,
        relics: ['burning_heart', 'iron_shield']
    },
    
    // 덱 정보
    deck: {
        cards: ['strike', 'strike', 'defend', 'bash'],
        drawPile: [],
        discardPile: [],
        hand: []
    },
    
    // 진행 정보
    progress: {
        floor: 5,
        room: 3,
        seed: 'abc123',
        visited: [0, 1, 2],
        events: []
    },
    
    // 통계
    stats: {
        damageDealt: 1500,
        damageTaken: 200,
        cardsPlayed: 45,
        enemiesKilled: 12
    }
};
```

### 저장 모듈
```javascript
// modules/save.js
const Save = {
    STORAGE_KEY: 'ddoo_save',
    
    // 저장
    save(data) {
        try {
            const json = JSON.stringify(data);
            localStorage.setItem(this.STORAGE_KEY, json);
            console.log('[Save] ✅ 저장 완료');
            return true;
        } catch (e) {
            console.error('[Save] ❌ 저장 실패:', e);
            return false;
        }
    },
    
    // 불러오기
    load() {
        try {
            const json = localStorage.getItem(this.STORAGE_KEY);
            if (!json) return null;
            return JSON.parse(json);
        } catch (e) {
            console.error('[Save] ❌ 로드 실패:', e);
            return null;
        }
    },
    
    // 삭제
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[Save] 🗑️ 데이터 삭제됨');
    },
    
    // 존재 여부
    exists() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
};
```

---

## 🚀 개발 순서 권장

### Phase 1: 기반 시스템
```
[ ] 프로젝트 구조 정리
[ ] Audio 모듈
[ ] Save 모듈  
[ ] 기본 UI 프레임워크
```

### Phase 2: 전투 코어
```
[ ] Player 모듈
[ ] Enemy 모듈 + AI
[ ] Combat 모듈
[ ] 기본 카드 5종
```

### Phase 3: 덱빌딩
```
[ ] Deck 모듈
[ ] 카드 드로우/버리기
[ ] 손패 UI
[ ] 카드 사용 시스템
```

### Phase 4: 던전
```
[ ] Dungeon 모듈
[ ] 맵 생성
[ ] 방 타입 (전투, 이벤트, 상점, 휴식)
[ ] 보스 시스템
```

### Phase 5: 메타 진행
```
[ ] 유물 시스템
[ ] 카드 보상
[ ] 업그레이드
[ ] 통계/업적
```

---

## 🛠️ 개발 도구

### DDOO Action Studio
```
studio.html - 애니메이션 테스트 & 편집 도구
```

**기능:**
- 애니메이션 실시간 미리보기
- 플레이어/적 애니메이션 테스트
- 카드 시퀀스 테스트
- VFX/파티클 테스트
- JSON 애니메이션 편집

**사용법:**
```bash
# 로컬 서버 실행 후
http://localhost:8080/studio.html
```

---

## 📞 문의 & 참고

- **엔진 문서**: `/engine/` 폴더 내 각 모듈 주석 참고
- **애니메이션 편집**: `/studio.html` 사용

---

*최종 업데이트: 2026-01-07*
