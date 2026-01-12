# PIXI 컨테이너 구조

## 개요
게임의 모든 PIXI 요소는 계층적 컨테이너 구조로 관리됩니다.
`gameWorld` 컨테이너가 모든 게임 콘텐츠를 담고 있으며, 스케일과 오프셋이 적용됩니다.

## 전체 구조도

```
app.stage (sortableChildren: true)
│
├── gameWorld (scale: 1.25, y: 60)  ← 게임 콘텐츠 컨테이너
│   │
│   ├── grid (zIndex: 1)
│   │   └── 그리드 셀 시각화
│   │
│   ├── ground (zIndex: 5)
│   │   └── 바닥 이펙트 (불길, 독 웅덩이 등)
│   │
│   ├── units (zIndex: 10, sortableChildren: true)
│   │   ├── Unit Container (각 유닛)
│   │   │   ├── sprite (캐릭터 이미지)
│   │   │   ├── HP bar
│   │   │   ├── Intent UI
│   │   │   └── Break gauge
│   │   └── ...
│   │
│   ├── BloodEffect.container (zIndex: 15)
│   │   └── 피 파티클들
│   │
│   ├── effects (zIndex: 20)
│   │   ├── targetingCurve (타겟팅 선)
│   │   ├── laneGuide (레인 이동 가이드)
│   │   └── 기타 이펙트
│   │
│   └── CombatEffects.container (zIndex: 50)
│       ├── 데미지 숫자
│       ├── 슬래시 이펙트
│       ├── 힐 이펙트
│       └── 기타 전투 이펙트
│
└── ui (zIndex: 100)  ← 스케일 영향 안 받음
    └── UI 요소들
```

## 상세 설명

### 1. `app.stage`
- PIXI 앱의 루트 컨테이너
- `sortableChildren: true`로 설정하여 zIndex 정렬 활성화

### 2. `gameWorld` (스케일/오프셋 적용)
```javascript
scale: 1.25  // 25% 확대
y: 60        // 아래로 60px 이동
```
- 모든 게임 콘텐츠의 상위 컨테이너
- 카메라 줌/오프셋 효과 담당
- 이 컨테이너 내의 모든 좌표는 **로컬 좌표**

### 3. `grid` (zIndex: 1)
- 10x3 그리드 셀 시각화
- 플레이어 영역 (파란색): X 0-4
- 적 영역 (빨간색): X 5-9

### 4. `ground` (zIndex: 5)
- 바닥에 표시되는 이펙트
- 불길 존, 독 웅덩이 등
- 유닛보다 아래에 렌더링

### 5. `units` (zIndex: 10)
- 모든 유닛 (플레이어, 적) 컨테이너
- `sortableChildren: true`로 Y축 기준 정렬
- 각 유닛은 자체 container를 가짐

#### Unit 구조
```javascript
unit = {
    container: PIXI.Container,  // 위치 관리
    sprite: PIXI.Sprite,        // 시각적 표현
    hpBar: HPBarSystem 관리,
    intentUI: IntentUI 관리,
    breakGauge: BreakSystem 관리
}
```

### 6. `BloodEffect.container` (zIndex: 15)
- 피 파티클 시스템
- 대미지 발생 시 자동으로 피 효과 생성
- units와 effects 사이에 위치

### 7. `effects` (zIndex: 20)
- 일반 게임 이펙트
- 타겟팅 커브, 레인 가이드 등
- 유닛 위에 표시되어야 하는 효과

### 8. `CombatEffects.container` (zIndex: 50)
- 전투 관련 UI 이펙트
- 데미지 숫자, 슬래시 이펙트
- 가장 높은 우선순위 (effects 위)

### 9. `ui` (zIndex: 100)
- **gameWorld 밖에 있음** (스케일 영향 안 받음)
- 카드 UI, 턴 표시 등
- 화면에 고정된 UI 요소

## 좌표계

### 글로벌 좌표 (Stage 좌표)
- `sprite.getGlobalPosition()`으로 얻음
- DOM 요소 위치 설정에 사용
- 마우스 이벤트 좌표

### 로컬 좌표 (GameWorld 좌표)
- `container.x`, `container.y`
- PIXI Graphics 그리기에 사용
- `getCellCenter()` 반환값

### 변환 함수
```javascript
// 글로벌 → 로컬
game.globalToLocal(globalX, globalY)
// 반환: { x: localX, y: localY }

// 로컬 → 글로벌
game.localToGlobal(localX, localY)
// 반환: { x: globalX, y: globalY }
```

## 스케일/오프셋 설정

```javascript
// game.js
gameContainerScale: 1.25,    // 전체 확대
gameContainerOffsetY: 60,    // Y축 오프셋
```

이 값을 변경하면:
1. `setupContainers()`에서 gameWorld에 적용
2. `getCellCenter()`에서 역변환 적용
3. `globalToLocal()` / `localToGlobal()`에서 사용

## 새 컨테이너 추가 시

1. **gameWorld 내부에 추가** (게임 콘텐츠인 경우)
```javascript
const newContainer = new PIXI.Container();
newContainer.zIndex = 적절한_값;
this.containers.gameWorld.addChild(newContainer);
```

2. **stage에 직접 추가** (UI인 경우)
```javascript
const uiContainer = new PIXI.Container();
uiContainer.zIndex = 100_이상;
this.app.stage.addChild(uiContainer);
```

## 관련 파일
- `game.js` - 컨테이너 생성 및 관리
- `card-drag.js` - 타겟팅 그래픽
- `combat-effects.js` - 전투 이펙트
- `blood-effect.js` - 피 효과
- `hp-bar-system.js` - HP 바
- `break-system.js` - 브레이크 게이지
