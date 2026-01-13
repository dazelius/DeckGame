# 카드 JSON 스키마 문서

## 개요

모든 카드는 JSON으로 정의됩니다. `anim.type` 필드를 사용하여 연출을 자동 매핑하고,
`createZone`, `knockback`, `bleed` 등의 속성으로 후처리를 자동 적용합니다.

## 기본 구조

```json
{
    "cardId": {
        "name": "카드 이름",
        "cost": 1,
        "type": "attack",
        "damage": 6,
        "target": "enemy",
        "melee": true,
        "element": "physical",
        "anim": {
            "type": "slash"
        }
    }
}
```

## 필수 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `name` | string | 카드 이름 (표시용) |
| `cost` | number | 코스트 |
| `type` | string | `"attack"`, `"skill"`, `"power"`, `"summon"` |
| `target` | string | `"enemy"`, `"ally"`, `"self"`, `"all"` |

## 공격 카드 필드

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `damage` | number | 0 | 기본 데미지 |
| `melee` | boolean | false | 근접 여부 |
| `frontOnly` | boolean | false | 전방만 타겟 가능 |
| `hits` | number | 1 | 다중 공격 횟수 |
| `aoe` | object | `{width:1, depth:1}` | 광역 범위 |
| `element` | string | `"physical"` | 속성 |

## anim.type (연출 타입)

`anim.type`에 따라 자동으로 연출이 매핑됩니다.

| type | 설명 | 예시 카드 |
|------|------|----------|
| `slash` | 기본 슬래시 | strike, kick |
| `bash` | 강타 (윈드업) | bash, ironWave |
| `cleave` | 휘두르기 | cleave |
| `flurry` | 연속 찌르기 | flurry |
| `rush` | 돌진 (넉백) | rush |
| `sneak` | 비열한 습격 | sneakAttack |
| `wave` | 물결 공격 | waterWave, tidalCrash |
| `lightning` | 번개 | lightning |
| `projectile` | 발사체 | fireBolt, fireArrow |
| `spear` | 창 투척 | spearThrow |
| `hook` | 갈고리 | hook |

## 후처리 속성

이 속성들은 AnimSystem에서 자동 처리됩니다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `knockback` | number | 넉백 거리 |
| `bleed` | number | 출혈 스택 |
| `vulnerable` | number | 취약 스택 |
| `block` | number | 쉴드 부여 |
| `createZone` | string | 영역 생성 (`"fire"`, `"water"`, `"poison"`) |
| `createZoneLength` | number | 라인 영역 길이 |
| `aoePattern` | string | 특수 AOE 패턴 (`"cross"`) |

## 특수 속성

| 필드 | 타입 | 설명 |
|------|------|------|
| `distanceBonus` | number | 거리당 데미지 보너스 |
| `pull` | number | 당기기 거리 |
| `crashDamage` | number | 충돌 추가 데미지 |
| `chainDamageReduction` | number | 체인 감소량 |

## 예시: 완전한 카드 정의

```json
"waterWave": {
    "name": "Water Wave",
    "cost": 2,
    "type": "attack",
    "damage": 4,
    "target": "enemy",
    "melee": true,
    "frontOnly": true,
    "knockback": 1,
    "aoe": { "width": 3, "depth": 1 },
    "createZone": "water",
    "createZoneLength": 3,
    "element": "water",
    "desc": "3칸을 쭉 타격하고 넉백. 물 영역을 남긴다.",
    "anim": {
        "type": "wave",
        "windup": 0.15,
        "sweep": 0.3,
        "ease": "power2.out"
    }
}
```

## 새 카드 추가 방법

1. `cards/attack.json` (또는 해당 타입)에 카드 정의 추가
2. `anim.type` 지정 (기존 타입 사용 or 새 핸들러 등록)
3. 필요시 `anim-system.js`에 새 핸들러 추가:

```javascript
AnimSystem.registerHandler('newType', async function(attacker, target, cardDef, options) {
    // 연출 로직
});
```
