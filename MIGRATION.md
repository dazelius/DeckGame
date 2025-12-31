# 🚀 Shadow Deck - TypeScript 마이그레이션 가이드

## 📋 목차
1. [환경 설정](#1-환경-설정)
2. [점진적 마이그레이션](#2-점진적-마이그레이션)
3. [파일별 변환 순서](#3-파일별-변환-순서)
4. [스팀 출시 준비](#4-스팀-출시-준비)

---

## 1. 환경 설정

### 1.1 의존성 설치

```bash
# Node.js 설치 후 실행
npm install
```

### 1.2 개발 서버 실행

```bash
npm run dev
```

### 1.3 타입 체크

```bash
npm run typecheck
```

---

## 2. 점진적 마이그레이션

### 2.1 전략

**한 번에 전체를 변환하지 않습니다!**

1. **Phase 1**: 타입 정의만 추가 (현재 완료)
2. **Phase 2**: 핵심 시스템부터 `.ts`로 변환
3. **Phase 3**: UI 컴포넌트 변환
4. **Phase 4**: 엄격 모드 활성화

### 2.2 파일 변환 방법

```javascript
// 기존 JavaScript (game.js)
function dealDamage(target, amount) {
    target.hp -= amount;
}
```

```typescript
// TypeScript로 변환 (game.ts)
function dealDamage(target: Enemy | Player, amount: number): void {
    target.hp -= amount;
}
```

### 2.3 점진적 타입 추가

```typescript
// 1단계: any 허용 (일단 동작하게)
function processCard(card: any) { ... }

// 2단계: 기본 타입 적용
function processCard(card: Card) { ... }

// 3단계: 엄격한 타입
function processCard(card: CardInstance): CardEffect { ... }
```

---

## 3. 파일별 변환 순서

### 🟢 Phase 1: 독립적인 유틸리티 (쉬움)

| 순서 | 파일 | 난이도 | 의존성 |
|------|------|--------|--------|
| 1 | `sound-system.js` | ⭐ | 없음 |
| 2 | `balance.js` | ⭐ | 없음 |
| 3 | `card-types.js` | ⭐ | 없음 |

### 🟡 Phase 2: 핵심 시스템 (중간)

| 순서 | 파일 | 난이도 | 의존성 |
|------|------|--------|--------|
| 4 | `shield.js` | ⭐⭐ | gameState |
| 5 | `damage-system.js` | ⭐⭐ | gameState, shield |
| 6 | `card-utils.js` | ⭐⭐ | cards |
| 7 | `cards.js` | ⭐⭐⭐ | 많음 |

### 🔴 Phase 3: 메인 시스템 (어려움)

| 순서 | 파일 | 난이도 | 의존성 |
|------|------|--------|--------|
| 8 | `game.js` | ⭐⭐⭐⭐ | 모든 시스템 |
| 9 | `map.js` | ⭐⭐⭐ | gameState |
| 10 | `town.js` | ⭐⭐⭐ | 많음 |

---

## 4. 스팀 출시 준비

### 4.1 Electron 설정

```bash
# Electron 앱 빌드
npm run electron:build
```

### 4.2 폴더 구조 (최종)

```
shadow-deck/
├── src/
│   ├── types/           # 타입 정의
│   ├── systems/         # 핵심 시스템 (TS)
│   ├── components/      # UI 컴포넌트 (TS)
│   └── assets/          # 리소스
├── electron/
│   └── main.js          # Electron 메인
├── dist/                # 빌드 결과물
├── package.json
└── tsconfig.json
```

### 4.3 Steam 통합

```typescript
// steam.ts (나중에 추가)
import Steamworks from 'steamworks.js';

const steam = Steamworks.init(YOUR_APP_ID);

// 업적
steam.achievement.activate('FIRST_VICTORY');

// 클라우드 세이브
steam.cloud.writeFile('save.json', saveData);
```

### 4.4 출시 체크리스트

- [ ] TypeScript 마이그레이션 완료
- [ ] PixiJS 그래픽 엔진 적용
- [ ] Electron 래핑
- [ ] Steam SDK 연동
- [ ] 업적 시스템
- [ ] 클라우드 세이브
- [ ] 트레이딩 카드 (선택)
- [ ] 한국어/영어 지원

---

## 📝 다음 단계

### 지금 바로 할 수 있는 것:

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 첫 번째 파일 변환
# sound-system.js → sound-system.ts
```

### 질문이 있으면:
- 특정 파일 변환 도움
- 타입 에러 해결
- Electron 설정

언제든 물어보세요! 🎮

