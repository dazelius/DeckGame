# VFX 위치 가이드 - VFXAnchor 사용법

## 🎯 핵심 원칙

**모든 VFX는 `VFXAnchor`를 통해 위치를 계산해야 합니다.**

```javascript
// ❌ 잘못된 방식 (하드코딩)
const pos = unit.sprite.getGlobalPosition();
vfx.x = pos.x;
vfx.y = pos.y - unit.sprite.height * 0.3;

// ✅ 올바른 방식 (VFXAnchor 사용)
const pos = VFXAnchor.getCenter(unit);
vfx.x = pos.x;
vfx.y = pos.y;
```

---

## 📍 앵커 포인트 종류

```
        ┌──────────────────┐
        │     ABOVE        │  ← 머리 위 (스탯 UI용)
        ├──────────────────┤
        │      HEAD        │  ← 머리 (스턴 별, 상태 아이콘)
        │                  │
        │     CENTER       │  ← 정중앙 (오라, 쉴드)
        │                  │
        │      CHEST       │  ← 가슴 (공격 이펙트 기본)
        │                  │
        │      FEET        │  ← 발 (착지, 이동 이펙트)
        └──────────────────┘
              BELOW         ← 발 아래 (그림자)
        
        BACK ← ─ ─ ─ ─ ─ → FRONT (공격 방향)
```

---

## 🔧 기본 사용법

### 1. 단순 위치 가져오기

```javascript
// 스프라이트 정중앙
const pos = VFXAnchor.getCenter(unit);

// 머리 위
const pos = VFXAnchor.getHead(unit);

// 가슴 높이 (공격 이펙트 기본)
const pos = VFXAnchor.getChest(unit);

// 발 위치
const pos = VFXAnchor.getFeet(unit);
```

### 2. 오프셋 추가

```javascript
// 중앙에서 왼쪽으로 20px, 위로 10px
const pos = VFXAnchor.getCenter(unit, -20, -10);

// 앵커 포인트 + 오프셋
const pos = VFXAnchor.getAnchorPoint(unit, 'chest', {
    offsetX: 30,
    offsetY: -15,
    direction: 1  // 1: 오른쪽, -1: 왼쪽
});
```

### 3. 스프라이트 크기 정보 활용

```javascript
const pos = VFXAnchor.getCenter(unit);

// 스프라이트 실제 표시 크기
const width = pos.bounds.width;
const height = pos.bounds.height;

// 오라 크기 계산
const auraSize = Math.max(width, height) * 1.5;
```

---

## 🎬 용도별 권장 앵커

| 이펙트 종류 | 권장 앵커 | 예시 |
|------------|----------|------|
| 오라/쉴드 | `CENTER` | 돌진 오라, 방어막 |
| 공격 히트 | `CHEST` | 슬래시, 타격 이펙트 |
| 상태 아이콘 | `HEAD` | 스턴 별, 독/출혈 아이콘 |
| UI 표시 | `ABOVE` | HP바, 데미지 숫자 |
| 착지/이동 | `FEET` | 먼지, 발자국, 물보라 |
| 그림자 | `BELOW` | 캐릭터 그림자 |
| 투사체 시작점 | `FRONT` | 화살, 마법 발사 |
| 백스탭 | `BACK` | 암살자 등장 위치 |

---

## 🔄 VFX 자동 추적

유닛을 따라다니는 VFX는 `attachToUnit` 사용:

```javascript
// VFX가 유닛의 중심을 자동으로 따라다님
const tracker = VFXAnchor.attachToUnit(vfxContainer, unit, 'center', {
    offsetX: 0,
    offsetY: 0
});

// 나중에 추적 중지
tracker.stop();
```

---

## 📝 새 VFX 작성 템플릿

```javascript
// ==========================================
// [VFX 이름] - VFXAnchor 사용 예시
// ==========================================
function createMyVFX(unit, color = 0xff8800) {
    if (!unit?.sprite) return null;
    
    // ★ 1. VFXAnchor로 위치와 크기 가져오기
    const anchorPos = VFXAnchor.getCenter(unit);  // 또는 getChest, getHead 등
    const bounds = anchorPos.bounds;
    
    // ★ 2. 크기 계산 (스프라이트 기준)
    const size = bounds ? Math.max(bounds.width, bounds.height) * 1.2 : 80;
    
    // ★ 3. 컨테이너 생성 및 위치 설정
    const container = new PIXI.Container();
    container.x = anchorPos.x;
    container.y = anchorPos.y;
    container.zIndex = 200;
    
    // ★ 4. 그래픽 추가
    const graphic = new PIXI.Graphics();
    graphic.circle(0, 0, size / 2);
    graphic.fill({ color: color, alpha: 0.8 });
    container.addChild(graphic);
    
    // ★ 5. CombatEffects.container에 추가
    if (typeof CombatEffects !== 'undefined' && CombatEffects.container) {
        CombatEffects.container.addChild(container);
    }
    
    // ★ 6. (선택) 유닛 추적이 필요하면
    const tracker = VFXAnchor.attachToUnit(container, unit, 'center');
    container._tracker = tracker;
    
    return container;
}

// 정리 시
function removeMyVFX(container) {
    if (container._tracker) {
        container._tracker.stop();
    }
    if (!container.destroyed) {
        container.destroy({ children: true });
    }
}
```

---

## 🐛 디버그

앵커 포인트가 올바른지 확인:

```javascript
// 유닛의 모든 앵커 포인트 시각화 (2초간)
VFXAnchor.debugShowAnchors(unit, 2000);
```

콘솔에서 테스트:
```javascript
// 특정 유닛의 중심 좌표 확인
console.log(VFXAnchor.getCenter(game.state.hero));
```

---

## ⚠️ 주의사항

1. **container vs sprite**: VFXAnchor가 알아서 처리함. 직접 접근 금지!

2. **anchor.y 보정**: 스프라이트 피벗이 발 아래(1.0)인지 중앙(0.5)인지 VFXAnchor가 자동 보정

3. **스케일 변화**: 점프/웅크림 등 스케일 애니메이션 중에도 정확한 위치 계산

4. **폴백 처리**: VFXAnchor가 없을 때를 대비
```javascript
let pos;
if (typeof VFXAnchor !== 'undefined') {
    pos = VFXAnchor.getCenter(unit);
} else {
    // 폴백: 직접 계산
    const sprite = unit.container || unit.sprite;
    pos = { x: sprite.x, y: sprite.y - 40 };
}
```

---

## 📚 참고 파일

- `vfx-anchor.js` - VFXAnchor 시스템 본체
- `rush-vfx.js` - VFXAnchor 사용 예시 (돌진 오라)
- `combat-effects.js` - 공격 이펙트들

---

## 📦 VFXLibrary 사용법

### 독립 VFX 호출
```javascript
// 직접 좌표 지정
VFXLibrary.stab(x, y, { direction: 1, color: 0x88ccff });
VFXLibrary.slash(x, y, { angle: -45, color: 0xffffff });
VFXLibrary.burst(x, y, { count: 8, color: 0xff0000 });
VFXLibrary.lightning(x1, y1, x2, y2, { color: 0x88ccff });
VFXLibrary.fire(x, y, { count: 10 });
VFXLibrary.waterSplash(x, y, { count: 12 });
```

### 유닛 기준 VFX (VFXAnchor 연동)
```javascript
// VFXAnchor + VFXLibrary 통합 사용
VFXLibrary.atUnit(unit, 'stab', 'chest', { direction: 1 });
VFXLibrary.atUnit(unit, 'burst', 'center', { color: 0xff0000 });
VFXLibrary.atUnit(unit, 'flash', 'head');
```

### 사용 가능한 VFX 목록
| VFX | 용도 | 주요 옵션 |
|-----|------|----------|
| `stab` | 찌르기 | direction, color, intensity |
| `flurryStab` | 연속 찌르기 | direction, hitIndex |
| `slash` | 베기 | angle, color, scale |
| `heavySlash` | 강타 | angle, color |
| `burst` | 파티클 폭발 | count, color, speed |
| `impactRing` | 충격 링 | size, rings |
| `shockwave` | 충격파 | size, color |
| `lightning` | 번개 | segments, branches |
| `electricSpark` | 전기 스파크 | count, length |
| `waterSplash` | 물 스플래시 | count, height |
| `fire` | 화염 | count, height |
| `flash` | 플래시 | size, color |
| `afterglow` | 잔광 | length, direction |

---

## 📚 참고 파일

- `vfx-anchor.js` - VFXAnchor 시스템 (위치 계산)
- `vfx-library.js` - VFXLibrary (독립 VFX 컴포넌트)
- `rush-vfx.js` - 돌진 전용 VFX
- `combat-effects.js` - 레거시 이펙트 (점진적 마이그레이션)

---

*이 가이드를 따르면 모든 VFX가 스프라이트 중심에 정확하게 생성됩니다!* ✨
