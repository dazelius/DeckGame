/**
 * DDOO Animation Bundle - 자동 생성됨
 * 생성일: 2026-01-03T18:14:52.338Z
 * 
 * 이 파일을 포함하면 fetch 없이 모든 애니메이션/VFX 데이터 사용 가능!
 * <script src="anim-bundle.js"></script>
 */

// 애니메이션 데이터 (45개)
window.ANIM_BUNDLE = {
  "card.bash": {
    "id": "card.bash",
    "name": "강타",
    "type": "sequence",
    "description": "강력한 타격으로 적을 취약하게 만든다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.dash",
        "wait": true
      },
      {
        "anim": "player.heavy_slash",
        "wait": false,
        "damage": 12
      },
      {
        "anim": [
          "enemy.bash_hit_left",
          "enemy.bash_hit_right"
        ],
        "wait": true,
        "delay": 30,
        "debuff": {
          "name": "vulnerable",
          "value": 2
        }
      }
    ]
  },
  "card.battleopening": {
    "id": "card.battleopening",
    "name": "전투 개막 - 파워태클",
    "type": "sequence",
    "description": "폭발적인 가속으로 적을 격파하는 개막 일격",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.power_windup",
        "wait": true
      },
      {
        "delay": 50
      },
      {
        "anim": "player.power_tackle",
        "wait": false,
        "damage": 8
      },
      {
        "anim": "enemy.power_impact",
        "wait": true,
        "delay": 30
      }
    ]
  },
  "card.battleopeningP": {
    "id": "card.battleopeningP",
    "name": "전투 개막+ - 파워태클 강화",
    "type": "sequence",
    "description": "더욱 강력한 폭발적 개막 일격",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.power_windup",
        "wait": true
      },
      {
        "delay": 40
      },
      {
        "anim": "player.power_tackle_plus",
        "wait": false,
        "damage": 12
      },
      {
        "anim": "enemy.power_impact_heavy",
        "wait": true,
        "delay": 25
      }
    ]
  },
  "card.dagger": {
    "id": "card.dagger",
    "name": "단검 투척",
    "type": "sequence",
    "description": "단검을 던져 적을 공격한다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.throw",
        "wait": true
      },
      {
        "delay": 100
      },
      {
        "anim": "enemy.dagger_hit",
        "wait": true,
        "damage": 4
      }
    ]
  },
  "card.dirtystrike": {
    "id": "card.dirtystrike",
    "name": "비열한 일격",
    "type": "sequence",
    "description": "그림자처럼 접근해 급소를 찌른다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.sneak",
        "wait": true
      },
      {
        "anim": "player.backstab_strike",
        "wait": true,
        "damage": 4
      },
      {
        "anim": [
          "enemy.stabbed"
        ],
        "wait": true,
        "delay": 5,
        "debuff": {
          "name": "vulnerable",
          "value": 1
        }
      },
      {
        "delay": 50
      },
      {
        "anim": "player.sneak_return",
        "wait": true
      }
    ]
  },
  "card.dirtystrikeP": {
    "id": "card.dirtystrikeP",
    "name": "비열한 일격+",
    "type": "sequence",
    "description": "그림자처럼 사라져 적의 뒤에서 강력하게 급습한다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.sneak",
        "wait": true
      },
      {
        "delay": 15
      },
      {
        "anim": "player.backstab_strike",
        "wait": true,
        "damage": 7
      },
      {
        "anim": "enemy.stabbed",
        "wait": false,
        "delay": 10,
        "debuff": {
          "name": "vulnerable",
          "value": 2
        }
      },
      {
        "delay": 80
      },
      {
        "anim": "player.sneak_return",
        "wait": true
      }
    ]
  },
  "card.dodge": {
    "id": "card.dodge",
    "name": "닷지",
    "type": "sequence",
    "description": "민첩하게 백스텝하며 공격을 회피한다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.dodge_flip",
        "wait": true,
        "buff": {
          "name": "block",
          "value": 3
        }
      },
      {
        "event": {
          "type": "draw",
          "value": 1
        }
      }
    ]
  },
  "card.flurry": {
    "id": "card.flurry",
    "name": "연속 찌르기",
    "type": "sequence",
    "description": "3번 연속으로 빠르게 찌른다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.dash",
        "wait": true
      },
      {
        "anim": "player.flurry_stab1",
        "wait": false
      },
      {
        "anim": [
          "enemy.flurry_hit_left",
          "enemy.flurry_hit_right"
        ],
        "wait": true,
        "delay": 25,
        "damage": 2
      },
      {
        "delay": 20
      },
      {
        "anim": "player.flurry_stab2",
        "wait": false
      },
      {
        "anim": [
          "enemy.flurry_hit_left",
          "enemy.flurry_hit_right"
        ],
        "wait": true,
        "delay": 25,
        "damage": 2
      },
      {
        "delay": 20
      },
      {
        "anim": "player.flurry_stab3",
        "wait": false
      },
      {
        "anim": [
          "enemy.flurry_hit_left",
          "enemy.flurry_hit_right"
        ],
        "wait": true,
        "delay": 25,
        "damage": 2
      }
    ]
  },
  "card.flurryP": {
    "id": "card.flurryP",
    "name": "연속 찌르기+",
    "type": "sequence",
    "description": "5번 연속으로 빠르게 찌른다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.dash",
        "wait": true
      },
      {
        "anim": "player.flurry_stab1",
        "wait": false
      },
      {
        "anim": [
          "enemy.flurry_hit_left",
          "enemy.flurry_hit_right"
        ],
        "wait": true,
        "delay": 20,
        "damage": 3
      },
      {
        "delay": 15
      },
      {
        "anim": "player.flurry_stab2",
        "wait": false
      },
      {
        "anim": [
          "enemy.flurry_hit_left",
          "enemy.flurry_hit_right"
        ],
        "wait": true,
        "delay": 20,
        "damage": 3
      },
      {
        "delay": 15
      },
      {
        "anim": "player.flurry_stab3",
        "wait": false
      },
      {
        "anim": [
          "enemy.flurry_hit_left",
          "enemy.flurry_hit_right"
        ],
        "wait": true,
        "delay": 20,
        "damage": 3
      },
      {
        "delay": 15
      },
      {
        "anim": "player.flurry_stab1",
        "wait": false
      },
      {
        "anim": [
          "enemy.flurry_hit_left",
          "enemy.flurry_hit_right"
        ],
        "wait": true,
        "delay": 20,
        "damage": 3
      },
      {
        "delay": 15
      },
      {
        "anim": "player.flurry_stab2",
        "wait": false
      },
      {
        "anim": [
          "enemy.flurry_hit_left",
          "enemy.flurry_hit_right"
        ],
        "wait": true,
        "delay": 20,
        "damage": 3
      }
    ]
  },
  "card.strike": {
    "id": "card.strike",
    "name": "기본 공격",
    "type": "sequence",
    "description": "적에게 돌진하여 베기",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.dash",
        "wait": true
      },
      {
        "anim": "player.attack",
        "wait": false,
        "damage": 6
      },
      {
        "anim": [
          "enemy.hit_left",
          "enemy.hit_right"
        ],
        "wait": true,
        "delay": 20
      }
    ]
  },
  "enemy.attack": {
    "id": "enemy.attack",
    "name": "적 공격",
    "target": "enemy",
    "type": "once",
    "priority": 10,
    "duration": 420,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 8,
        "y": 5,
        "scaleX": 0.95,
        "scaleY": 1.05,
        "rotation": 0.03,
        "duration": 40,
        "ease": "power1.out"
      },
      {
        "x": 18,
        "y": 12,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": 0.08,
        "duration": 50,
        "ease": "power2.in"
      },
      {
        "x": 25,
        "y": 18,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "rotation": 0.12,
        "duration": 40,
        "ease": "power2.in"
      },
      {
        "x": -15,
        "y": -8,
        "scaleX": 1.08,
        "scaleY": 0.92,
        "rotation": -0.05,
        "duration": 25,
        "ease": "power3.out"
      },
      {
        "x": -55,
        "y": -15,
        "scaleX": 1.22,
        "scaleY": 0.78,
        "rotation": -0.15,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "slash",
        "shake": 6,
        "hitstop": 60
      },
      {
        "x": -65,
        "y": -12,
        "scaleX": 1.28,
        "scaleY": 0.75,
        "rotation": -0.18,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": -58,
        "y": -8,
        "scaleX": 1.2,
        "scaleY": 0.82,
        "rotation": -0.14,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": -45,
        "y": -4,
        "scaleX": 1.12,
        "scaleY": 0.88,
        "rotation": -0.1,
        "duration": 40,
        "ease": "power2.inOut"
      },
      {
        "x": -30,
        "y": 0,
        "scaleX": 1.06,
        "scaleY": 0.94,
        "rotation": -0.06,
        "duration": 40,
        "ease": "power2.inOut"
      },
      {
        "x": -15,
        "y": 2,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "rotation": -0.02,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -5,
        "y": 3,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "rotation": 0.01,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.bash_hit": {
    "id": "enemy.bash_hit",
    "name": "강타 피격 - 강렬한 좌우",
    "target": "enemy",
    "type": "once",
    "priority": 22,
    "duration": 480,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 50,
        "y": -15,
        "scaleX": 0.65,
        "scaleY": 1.38,
        "alpha": 0.45,
        "rotation": 0.22,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "bash_hit",
        "vfxTarget": "self"
      },
      {
        "x": 85,
        "y": -10,
        "scaleX": 0.58,
        "scaleY": 1.45,
        "alpha": 0.35,
        "rotation": 0.28,
        "duration": 40,
        "ease": "power3.out"
      },
      {
        "x": 100,
        "y": 0,
        "scaleX": 0.6,
        "scaleY": 1.42,
        "alpha": 0.38,
        "rotation": 0.25,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -30,
        "y": 8,
        "scaleX": 1.12,
        "scaleY": 0.9,
        "alpha": 0.55,
        "rotation": -0.12,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 15,
        "y": 4,
        "scaleX": 0.95,
        "scaleY": 1.06,
        "alpha": 0.72,
        "rotation": 0.05,
        "duration": 55,
        "ease": "elastic.out(1, 0.5)"
      },
      {
        "x": -8,
        "y": 2,
        "scaleX": 1.03,
        "scaleY": 0.97,
        "alpha": 0.85,
        "rotation": -0.03,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 4,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "alpha": 0.93,
        "rotation": 0.01,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": -1,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 0.97,
        "rotation": 0,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.bash_hit_left": {
    "id": "enemy.bash_hit_left",
    "name": "강타 피격 - 왼쪽",
    "target": "enemy",
    "type": "once",
    "priority": 22,
    "duration": 480,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -50,
        "y": -15,
        "scaleX": 0.65,
        "scaleY": 1.38,
        "alpha": 0.45,
        "rotation": -0.22,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "bash_hit",
        "vfxTarget": "self"
      },
      {
        "x": -85,
        "y": -10,
        "scaleX": 0.58,
        "scaleY": 1.45,
        "alpha": 0.35,
        "rotation": -0.28,
        "duration": 40,
        "ease": "power3.out"
      },
      {
        "x": -100,
        "y": 0,
        "scaleX": 0.6,
        "scaleY": 1.42,
        "alpha": 0.38,
        "rotation": -0.25,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 30,
        "y": 8,
        "scaleX": 1.12,
        "scaleY": 0.9,
        "alpha": 0.55,
        "rotation": 0.12,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": -15,
        "y": 4,
        "scaleX": 0.95,
        "scaleY": 1.06,
        "alpha": 0.72,
        "rotation": -0.05,
        "duration": 55,
        "ease": "elastic.out(1, 0.5)"
      },
      {
        "x": 8,
        "y": 2,
        "scaleX": 1.03,
        "scaleY": 0.97,
        "alpha": 0.85,
        "rotation": 0.03,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": -4,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "alpha": 0.93,
        "rotation": -0.01,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 1,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 0.97,
        "rotation": 0,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.bash_hit_right": {
    "id": "enemy.bash_hit_right",
    "name": "강타 피격 - 오른쪽",
    "target": "enemy",
    "type": "once",
    "priority": 22,
    "duration": 480,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 50,
        "y": -15,
        "scaleX": 0.65,
        "scaleY": 1.38,
        "alpha": 0.45,
        "rotation": 0.22,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "bash_hit",
        "vfxTarget": "self"
      },
      {
        "x": 85,
        "y": -10,
        "scaleX": 0.58,
        "scaleY": 1.45,
        "alpha": 0.35,
        "rotation": 0.28,
        "duration": 40,
        "ease": "power3.out"
      },
      {
        "x": 100,
        "y": 0,
        "scaleX": 0.6,
        "scaleY": 1.42,
        "alpha": 0.38,
        "rotation": 0.25,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -30,
        "y": 8,
        "scaleX": 1.12,
        "scaleY": 0.9,
        "alpha": 0.55,
        "rotation": -0.12,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 15,
        "y": 4,
        "scaleX": 0.95,
        "scaleY": 1.06,
        "alpha": 0.72,
        "rotation": 0.05,
        "duration": 55,
        "ease": "elastic.out(1, 0.5)"
      },
      {
        "x": -8,
        "y": 2,
        "scaleX": 1.03,
        "scaleY": 0.97,
        "alpha": 0.85,
        "rotation": -0.03,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 4,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "alpha": 0.93,
        "rotation": 0.01,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": -1,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 0.97,
        "rotation": 0,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.dagger_hit": {
    "id": "enemy.dagger_hit",
    "name": "적 단검 피격",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 380,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 12,
        "y": -3,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "alpha": 0.75,
        "rotation": 0.05,
        "duration": 20,
        "ease": "power4.out",
        "vfx": "dagger_hit"
      },
      {
        "x": 28,
        "y": -5,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.6,
        "rotation": 0.1,
        "duration": 25,
        "ease": "power3.out"
      },
      {
        "x": 38,
        "y": -3,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "alpha": 0.55,
        "rotation": 0.12,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 42,
        "y": 0,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.6,
        "rotation": 0.1,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 38,
        "y": 2,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "alpha": 0.65,
        "rotation": 0.08,
        "duration": 30,
        "ease": "power2.inOut"
      },
      {
        "x": 32,
        "y": 2,
        "scaleX": 0.91,
        "scaleY": 1.09,
        "alpha": 0.72,
        "rotation": 0.06,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 24,
        "y": 2,
        "scaleX": 0.94,
        "scaleY": 1.06,
        "alpha": 0.8,
        "rotation": 0.04,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 16,
        "y": 1,
        "scaleX": 0.96,
        "scaleY": 1.04,
        "alpha": 0.88,
        "rotation": 0.02,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 8,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.94,
        "rotation": 0.01,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 3,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "alpha": 0.98,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.dash": {
    "id": "enemy.dash",
    "name": "적 대시",
    "target": "enemy",
    "type": "once",
    "priority": 15,
    "duration": 280,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 5,
        "y": 3,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "rotation": 0.02,
        "duration": 30,
        "ease": "power1.out"
      },
      {
        "x": 15,
        "y": 8,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "rotation": 0.05,
        "duration": 40,
        "ease": "power2.in"
      },
      {
        "x": 25,
        "y": 15,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "rotation": 0.08,
        "duration": 35,
        "ease": "power2.in"
      },
      {
        "x": -30,
        "y": -5,
        "scaleX": 1.05,
        "scaleY": 0.95,
        "rotation": -0.02,
        "duration": 20,
        "ease": "power3.out",
        "vfx": "dash"
      },
      {
        "x": -120,
        "y": -10,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": -0.05,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": -220,
        "y": -8,
        "scaleX": 1.18,
        "scaleY": 0.85,
        "rotation": -0.06,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -280,
        "y": -5,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": -0.04,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -310,
        "y": -2,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": -0.02,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": -320,
        "y": 0,
        "scaleX": 1.05,
        "scaleY": 0.96,
        "rotation": -0.01,
        "duration": 20,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.flurry_hit": {
    "id": "enemy.flurry_hit",
    "name": "연속찌르기 피격",
    "target": "enemy",
    "type": "once",
    "priority": 16,
    "duration": 85,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 30,
        "y": -8,
        "scaleX": 0.75,
        "scaleY": 1.28,
        "alpha": 0.5,
        "rotation": 0.12,
        "duration": 10,
        "ease": "power4.out",
        "vfx": "flurry_hit",
        "vfxTarget": "self"
      },
      {
        "x": 40,
        "y": -3,
        "scaleX": 0.72,
        "scaleY": 1.32,
        "alpha": 0.45,
        "rotation": 0.15,
        "duration": 12,
        "ease": "power2.out"
      },
      {
        "x": -12,
        "y": 4,
        "scaleX": 1.05,
        "scaleY": 0.96,
        "alpha": 0.65,
        "rotation": -0.06,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 2,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "alpha": 0.8,
        "rotation": 0.02,
        "duration": 18,
        "ease": "elastic.out(1, 0.7)"
      },
      {
        "x": -2,
        "y": 0,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "alpha": 0.92,
        "rotation": -0.01,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 15,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.flurry_hit_left": {
    "id": "enemy.flurry_hit_left",
    "name": "연속찌르기 피격 - 왼쪽",
    "target": "enemy",
    "type": "once",
    "priority": 16,
    "duration": 85,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -30,
        "y": -8,
        "scaleX": 0.75,
        "scaleY": 1.28,
        "alpha": 0.5,
        "rotation": -0.12,
        "duration": 10,
        "ease": "power4.out",
        "vfx": "flurry_hit",
        "vfxTarget": "self"
      },
      {
        "x": -40,
        "y": -3,
        "scaleX": 0.72,
        "scaleY": 1.32,
        "alpha": 0.45,
        "rotation": -0.15,
        "duration": 12,
        "ease": "power2.out"
      },
      {
        "x": 12,
        "y": 4,
        "scaleX": 1.05,
        "scaleY": 0.96,
        "alpha": 0.65,
        "rotation": 0.06,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": -5,
        "y": 2,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "alpha": 0.8,
        "rotation": -0.02,
        "duration": 18,
        "ease": "elastic.out(1, 0.7)"
      },
      {
        "x": 2,
        "y": 0,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "alpha": 0.92,
        "rotation": 0.01,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 15,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.flurry_hit_right": {
    "id": "enemy.flurry_hit_right",
    "name": "연속찌르기 피격 - 오른쪽",
    "target": "enemy",
    "type": "once",
    "priority": 16,
    "duration": 85,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 30,
        "y": -8,
        "scaleX": 0.75,
        "scaleY": 1.28,
        "alpha": 0.5,
        "rotation": 0.12,
        "duration": 10,
        "ease": "power4.out",
        "vfx": "flurry_hit",
        "vfxTarget": "self"
      },
      {
        "x": 40,
        "y": -3,
        "scaleX": 0.72,
        "scaleY": 1.32,
        "alpha": 0.45,
        "rotation": 0.15,
        "duration": 12,
        "ease": "power2.out"
      },
      {
        "x": -12,
        "y": 4,
        "scaleX": 1.05,
        "scaleY": 0.96,
        "alpha": 0.65,
        "rotation": -0.06,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 2,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "alpha": 0.8,
        "rotation": 0.02,
        "duration": 18,
        "ease": "elastic.out(1, 0.7)"
      },
      {
        "x": -2,
        "y": 0,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "alpha": 0.92,
        "rotation": -0.01,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 15,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.hit": {
    "id": "enemy.hit",
    "name": "적 피격 - 좌우 타격",
    "target": "enemy",
    "type": "once",
    "priority": 20,
    "duration": 380,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 35,
        "y": -8,
        "scaleX": 0.75,
        "scaleY": 1.28,
        "alpha": 0.6,
        "rotation": 0.15,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "hit",
        "vfxTarget": "self"
      },
      {
        "x": 55,
        "y": -5,
        "scaleX": 0.7,
        "scaleY": 1.32,
        "alpha": 0.5,
        "rotation": 0.2,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": -18,
        "y": 3,
        "scaleX": 1.08,
        "scaleY": 0.94,
        "alpha": 0.7,
        "rotation": -0.08,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -8,
        "y": 2,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "alpha": 0.82,
        "rotation": -0.04,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.9,
        "rotation": 0.02,
        "duration": 50,
        "ease": "elastic.out(1, 0.6)"
      },
      {
        "x": -2,
        "y": 0,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "alpha": 0.95,
        "rotation": -0.01,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.hit_left": {
    "id": "enemy.hit_left",
    "name": "적 피격 - 왼쪽으로 밀림",
    "target": "enemy",
    "type": "once",
    "priority": 20,
    "duration": 350,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -35,
        "y": -8,
        "scaleX": 0.75,
        "scaleY": 1.28,
        "alpha": 0.7,
        "rotation": -0.15,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "hit",
        "vfxTarget": "self",
        "color": "hit",
        "colorDuration": 60
      },
      {
        "x": -55,
        "y": -5,
        "scaleX": 0.7,
        "scaleY": 1.32,
        "alpha": 0.6,
        "rotation": -0.2,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": 18,
        "y": 3,
        "scaleX": 1.08,
        "scaleY": 0.94,
        "alpha": 0.8,
        "rotation": 0.08,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 8,
        "y": 2,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "alpha": 0.88,
        "rotation": 0.04,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": -5,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.94,
        "rotation": -0.02,
        "duration": 50,
        "ease": "elastic.out(1, 0.6)"
      },
      {
        "x": 2,
        "y": 0,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "alpha": 0.97,
        "rotation": 0.01,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.hit_right": {
    "id": "enemy.hit_right",
    "name": "적 피격 - 오른쪽으로 밀림",
    "target": "enemy",
    "type": "once",
    "priority": 20,
    "duration": 350,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 35,
        "y": -8,
        "scaleX": 0.75,
        "scaleY": 1.28,
        "alpha": 0.7,
        "rotation": 0.15,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "hit",
        "vfxTarget": "self",
        "color": "hit",
        "colorDuration": 60
      },
      {
        "x": 55,
        "y": -5,
        "scaleX": 0.7,
        "scaleY": 1.32,
        "alpha": 0.6,
        "rotation": 0.2,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": -18,
        "y": 3,
        "scaleX": 1.08,
        "scaleY": 0.94,
        "alpha": 0.8,
        "rotation": -0.08,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -8,
        "y": 2,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "alpha": 0.88,
        "rotation": -0.04,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.94,
        "rotation": 0.02,
        "duration": 50,
        "ease": "elastic.out(1, 0.6)"
      },
      {
        "x": -2,
        "y": 0,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "alpha": 0.97,
        "rotation": -0.01,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.power_impact": {
    "id": "enemy.power_impact",
    "name": "파워 임팩트 피격",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 200,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 60,
        "y": -15,
        "scaleX": 0.6,
        "scaleY": 1.5,
        "alpha": 0.4,
        "rotation": 0.2,
        "duration": 15,
        "ease": "power4.out",
        "vfx": "impact_shockwave"
      },
      {
        "x": 85,
        "y": -8,
        "scaleX": 0.55,
        "scaleY": 1.6,
        "alpha": 0.35,
        "rotation": 0.25,
        "duration": 20,
        "ease": "power2.out"
      },
      {
        "x": 100,
        "y": 0,
        "scaleX": 0.5,
        "scaleY": 1.7,
        "alpha": 0.3,
        "rotation": 0.3,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 90,
        "y": 5,
        "scaleX": 0.6,
        "scaleY": 1.5,
        "alpha": 0.4,
        "rotation": 0.25,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 70,
        "y": 8,
        "scaleX": 0.7,
        "scaleY": 1.35,
        "alpha": 0.55,
        "rotation": 0.18,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 45,
        "y": 5,
        "scaleX": 0.82,
        "scaleY": 1.2,
        "alpha": 0.7,
        "rotation": 0.1,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 20,
        "y": 2,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "alpha": 0.88,
        "rotation": 0.04,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.power_impact_heavy": {
    "id": "enemy.power_impact_heavy",
    "name": "파워 임팩트+ 강타 피격",
    "target": "enemy",
    "type": "once",
    "priority": 20,
    "duration": 250,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 80,
        "y": -20,
        "scaleX": 0.5,
        "scaleY": 1.7,
        "alpha": 0.3,
        "rotation": 0.3,
        "duration": 12,
        "ease": "power4.out",
        "vfx": "impact_shockwave_heavy"
      },
      {
        "x": 110,
        "y": -10,
        "scaleX": 0.45,
        "scaleY": 1.8,
        "alpha": 0.25,
        "rotation": 0.35,
        "duration": 18,
        "ease": "power2.out"
      },
      {
        "x": 130,
        "y": 0,
        "scaleX": 0.4,
        "scaleY": 1.9,
        "alpha": 0.2,
        "rotation": 0.4,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 115,
        "y": 8,
        "scaleX": 0.5,
        "scaleY": 1.65,
        "alpha": 0.35,
        "rotation": 0.32,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 90,
        "y": 10,
        "scaleX": 0.62,
        "scaleY": 1.45,
        "alpha": 0.5,
        "rotation": 0.22,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 55,
        "y": 6,
        "scaleX": 0.78,
        "scaleY": 1.25,
        "alpha": 0.68,
        "rotation": 0.12,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 25,
        "y": 3,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "alpha": 0.85,
        "rotation": 0.05,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.stabbed": {
    "id": "enemy.stabbed",
    "name": "급소 피격",
    "target": "enemy",
    "type": "once",
    "priority": 20,
    "duration": 300,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 25,
        "y": -15,
        "scaleX": 0.7,
        "scaleY": 1.35,
        "alpha": 0.7,
        "rotation": 0.2,
        "duration": 25,
        "ease": "power4.out",
        "vfx": "blood_burst",
        "vfxTarget": "self",
        "color": "hit",
        "colorDuration": 80
      },
      {
        "x": 45,
        "y": -8,
        "scaleX": 0.65,
        "scaleY": 1.4,
        "alpha": 0.6,
        "rotation": 0.25,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 55,
        "y": 0,
        "scaleX": 0.7,
        "scaleY": 1.35,
        "alpha": 0.65,
        "rotation": 0.2,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 45,
        "y": 5,
        "scaleX": 0.8,
        "scaleY": 1.2,
        "alpha": 0.75,
        "rotation": 0.12,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 30,
        "y": 3,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "alpha": 0.85,
        "rotation": 0.06,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 15,
        "y": 1,
        "scaleX": 0.95,
        "scaleY": 1.05,
        "alpha": 0.92,
        "rotation": 0.02,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.97,
        "rotation": 0.01,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      }
    ]
  },
  "player.attack": {
    "id": "player.attack",
    "name": "플레이어 공격",
    "target": "player",
    "type": "once",
    "priority": 10,
    "duration": 420,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -8,
        "y": 5,
        "scaleX": 0.95,
        "scaleY": 1.05,
        "rotation": -0.03,
        "duration": 40,
        "ease": "power1.out"
      },
      {
        "x": -18,
        "y": 12,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": -0.08,
        "duration": 50,
        "ease": "power2.in"
      },
      {
        "x": -25,
        "y": 18,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "rotation": -0.12,
        "duration": 40,
        "ease": "power2.in"
      },
      {
        "x": 15,
        "y": -8,
        "scaleX": 1.08,
        "scaleY": 0.92,
        "rotation": 0.05,
        "duration": 25,
        "ease": "power3.out"
      },
      {
        "x": 55,
        "y": -15,
        "scaleX": 1.22,
        "scaleY": 0.78,
        "rotation": 0.15,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "slash",
        "vfxTarget": "target",
        "shake": 6,
        "hitstop": 60
      },
      {
        "x": 65,
        "y": -12,
        "scaleX": 1.28,
        "scaleY": 0.75,
        "rotation": 0.18,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 58,
        "y": -8,
        "scaleX": 1.2,
        "scaleY": 0.82,
        "rotation": 0.14,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 45,
        "y": -4,
        "scaleX": 1.12,
        "scaleY": 0.88,
        "rotation": 0.1,
        "duration": 40,
        "ease": "power2.inOut"
      },
      {
        "x": 30,
        "y": 0,
        "scaleX": 1.06,
        "scaleY": 0.94,
        "rotation": 0.06,
        "duration": 40,
        "ease": "power2.inOut"
      },
      {
        "x": 15,
        "y": 2,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "rotation": 0.02,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 3,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "rotation": -0.01,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.out"
      }
    ]
  },
  "player.backstab_strike": {
    "id": "player.backstab_strike",
    "name": "급소 찌르기",
    "target": "player",
    "type": "once",
    "priority": 18,
    "duration": 220,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 5,
        "y": -8,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "alpha": 1,
        "rotation": -0.05,
        "duration": 20,
        "ease": "power2.in",
        "camera": {
          "zoom": 1.15,
          "focus": "enemy",
          "duration": 150
        }
      },
      {
        "x": -30,
        "y": 5,
        "scaleX": 1.3,
        "scaleY": 0.7,
        "alpha": 1,
        "rotation": 0.2,
        "duration": 25,
        "ease": "power4.out",
        "vfx": "backstab_slash",
        "vfxTarget": "target",
        "shake": 12,
        "hitstop": 80,
        "color": "critical",
        "colorDuration": 100
      },
      {
        "x": -45,
        "y": 0,
        "scaleX": 1.25,
        "scaleY": 0.75,
        "alpha": 1,
        "rotation": 0.15,
        "duration": 20,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": -35,
        "y": 3,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "alpha": 1,
        "rotation": 0.08,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -20,
        "y": 2,
        "scaleX": 1.05,
        "scaleY": 0.95,
        "alpha": 1,
        "rotation": 0.04,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -8,
        "y": 0,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "alpha": 1,
        "rotation": 0.01,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.out"
      }
    ]
  },
  "player.bash": {
    "id": "player.bash",
    "name": "강타",
    "target": "player",
    "type": "once",
    "priority": 13,
    "duration": 400,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -8,
        "y": 8,
        "scaleX": 0.95,
        "scaleY": 1.05,
        "rotation": -0.05,
        "duration": 45,
        "ease": "power1.out"
      },
      {
        "x": -20,
        "y": 20,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.12,
        "duration": 55,
        "ease": "power2.in"
      },
      {
        "x": -28,
        "y": 28,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "rotation": -0.18,
        "duration": 45,
        "ease": "power2.in"
      },
      {
        "x": 15,
        "y": -10,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "rotation": 0.08,
        "duration": 30,
        "ease": "power3.out"
      },
      {
        "x": 55,
        "y": -20,
        "scaleX": 1.3,
        "scaleY": 0.75,
        "rotation": 0.2,
        "duration": 35,
        "ease": "power4.out",
        "vfx": "bash_impact",
        "shake": 12,
        "hitstop": 100
      },
      {
        "x": 62,
        "y": -15,
        "scaleX": 1.25,
        "scaleY": 0.78,
        "rotation": 0.18,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 55,
        "y": -8,
        "scaleX": 1.18,
        "scaleY": 0.84,
        "rotation": 0.12,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 42,
        "y": -2,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "rotation": 0.08,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 28,
        "y": 2,
        "scaleX": 1.04,
        "scaleY": 0.96,
        "rotation": 0.04,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 15,
        "y": 2,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0.01,
        "duration": 28,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 22,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 20,
        "ease": "power2.out"
      }
    ]
  },
  "player.dash": {
    "id": "player.dash",
    "name": "플레이어 대시",
    "target": "player",
    "type": "once",
    "priority": 15,
    "duration": 280,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -5,
        "y": 3,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "rotation": -0.02,
        "duration": 30,
        "ease": "power1.out"
      },
      {
        "x": -15,
        "y": 8,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "rotation": -0.05,
        "duration": 40,
        "ease": "power2.in"
      },
      {
        "x": -25,
        "y": 15,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "rotation": -0.08,
        "duration": 35,
        "ease": "power2.in"
      },
      {
        "x": 30,
        "y": -5,
        "scaleX": 1.05,
        "scaleY": 0.95,
        "rotation": 0.02,
        "duration": 20,
        "ease": "power3.out",
        "vfx": "dash"
      },
      {
        "x": 120,
        "y": -10,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": 0.05,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": 220,
        "y": -8,
        "scaleX": 1.18,
        "scaleY": 0.85,
        "rotation": 0.06,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 280,
        "y": -5,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": 0.04,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 310,
        "y": -2,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": 0.02,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 320,
        "y": 0,
        "scaleX": 1.05,
        "scaleY": 0.96,
        "rotation": 0.01,
        "duration": 20,
        "ease": "power2.out"
      }
    ]
  },
  "player.defend": {
    "id": "player.defend",
    "name": "플레이어 방어",
    "target": "player",
    "type": "once",
    "priority": 15,
    "duration": 380,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -5,
        "y": 2,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "rotation": -0.02,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -12,
        "y": 5,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "rotation": -0.05,
        "duration": 35,
        "ease": "power2.out",
        "vfx": "block",
        "shake": 3
      },
      {
        "x": -18,
        "y": 8,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": -0.08,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -22,
        "y": 10,
        "scaleX": 0.86,
        "scaleY": 1.14,
        "rotation": -0.1,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": -20,
        "y": 9,
        "scaleX": 0.87,
        "scaleY": 1.13,
        "rotation": -0.09,
        "duration": 50,
        "ease": "power2.inOut"
      },
      {
        "x": -18,
        "y": 8,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": -0.08,
        "duration": 50,
        "ease": "power2.inOut"
      },
      {
        "x": -14,
        "y": 6,
        "scaleX": 0.91,
        "scaleY": 1.09,
        "rotation": -0.06,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -10,
        "y": 4,
        "scaleX": 0.94,
        "scaleY": 1.06,
        "rotation": -0.04,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -6,
        "y": 2,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "rotation": -0.02,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -2,
        "y": 1,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "rotation": -0.01,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      }
    ]
  },
  "player.dodge": {
    "id": "player.dodge",
    "name": "섬광 회피",
    "target": "player",
    "keyframes": [
      {
        "time": 0,
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0
      },
      {
        "time": 15,
        "x": 3,
        "y": -3,
        "scaleX": 0.95,
        "scaleY": 1.08,
        "alpha": 1,
        "rotation": 0.03,
        "duration": 15,
        "ease": "power2.in"
      },
      {
        "time": 35,
        "x": -30,
        "y": -25,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.8,
        "rotation": -0.25,
        "duration": 20,
        "ease": "power4.out",
        "afterimage": true,
        "vfx": "dodge_flash"
      },
      {
        "time": 55,
        "x": -80,
        "y": -40,
        "scaleX": 0.6,
        "scaleY": 1.35,
        "alpha": 0.5,
        "rotation": -0.4,
        "duration": 20,
        "ease": "power3.out",
        "afterimage": true
      },
      {
        "time": 80,
        "x": -100,
        "y": -35,
        "scaleX": 0.65,
        "scaleY": 1.3,
        "alpha": 0.4,
        "rotation": -0.35,
        "duration": 25,
        "ease": "power2.inOut",
        "afterimage": true
      },
      {
        "time": 110,
        "x": -90,
        "y": -20,
        "scaleX": 0.8,
        "scaleY": 1.15,
        "alpha": 0.6,
        "rotation": -0.2,
        "duration": 30,
        "ease": "power2.inOut",
        "afterimage": true,
        "vfx": "wind_burst"
      },
      {
        "time": 145,
        "x": -60,
        "y": -8,
        "scaleX": 0.9,
        "scaleY": 1.08,
        "alpha": 0.8,
        "rotation": -0.08,
        "duration": 35,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "time": 185,
        "x": -25,
        "y": -2,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "alpha": 0.95,
        "rotation": -0.02,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "time": 230,
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 45,
        "ease": "elastic.out(1, 0.5)"
      }
    ]
  },
  "player.dodge_flip": {
    "id": "player.dodge_flip",
    "name": "백스텝 회피",
    "target": "player",
    "type": "once",
    "priority": 16,
    "duration": 320,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -5,
        "y": 5,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "alpha": 1,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.in"
      },
      {
        "x": -50,
        "y": -30,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "alpha": 1,
        "rotation": -0.15,
        "duration": 35,
        "ease": "power3.out",
        "vfx": "dodge_flash",
        "vfxTarget": "self"
      },
      {
        "x": -90,
        "y": -15,
        "scaleX": 1.15,
        "scaleY": 0.85,
        "alpha": 1,
        "rotation": -0.1,
        "duration": 40,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": -120,
        "y": 0,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "alpha": 1,
        "rotation": -0.05,
        "duration": 45,
        "ease": "power2.out",
        "afterimage": true,
        "vfx": "wind_burst",
        "vfxTarget": "self"
      },
      {
        "x": -110,
        "y": 5,
        "scaleX": 0.95,
        "scaleY": 1.05,
        "alpha": 1,
        "rotation": 0.02,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -100,
        "y": 3,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 1,
        "rotation": 0.01,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -90,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -45,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "player.flurry_stab1": {
    "id": "player.flurry_stab1",
    "name": "세검 1타 - 상단 찌르기",
    "target": "player",
    "type": "once",
    "priority": 14,
    "duration": 95,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -8,
        "y": -15,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": -0.08,
        "duration": 8,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 70,
        "y": -25,
        "scaleX": 1.25,
        "scaleY": 0.8,
        "rotation": 0.12,
        "duration": 12,
        "ease": "power4.out",
        "vfx": "flurry_stab",
        "vfxTarget": "target",
        "shake": 3,
        "hitstop": 25,
        "afterimage": true
      },
      {
        "x": 78,
        "y": -22,
        "scaleX": 1.2,
        "scaleY": 0.82,
        "rotation": 0.1,
        "duration": 10,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 60,
        "y": -15,
        "scaleX": 1.12,
        "scaleY": 0.9,
        "rotation": 0.06,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 35,
        "y": -8,
        "scaleX": 1.05,
        "scaleY": 0.96,
        "rotation": 0.03,
        "duration": 18,
        "ease": "power2.out"
      },
      {
        "x": 12,
        "y": -2,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0.01,
        "duration": 16,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 16,
        "ease": "power2.out"
      }
    ]
  },
  "player.flurry_stab2": {
    "id": "player.flurry_stab2",
    "name": "세검 2타 - 하단 찌르기",
    "target": "player",
    "type": "once",
    "priority": 14,
    "duration": 90,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -6,
        "y": 12,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "rotation": 0.06,
        "duration": 7,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 65,
        "y": 22,
        "scaleX": 1.22,
        "scaleY": 0.82,
        "rotation": -0.1,
        "duration": 11,
        "ease": "power4.out",
        "vfx": "flurry_stab",
        "vfxTarget": "target",
        "shake": 3,
        "hitstop": 22,
        "afterimage": true
      },
      {
        "x": 72,
        "y": 18,
        "scaleX": 1.18,
        "scaleY": 0.84,
        "rotation": -0.08,
        "duration": 10,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 55,
        "y": 12,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": -0.05,
        "duration": 14,
        "ease": "power2.out"
      },
      {
        "x": 32,
        "y": 6,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "rotation": -0.02,
        "duration": 17,
        "ease": "power2.out"
      },
      {
        "x": 10,
        "y": 2,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": -0.01,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 16,
        "ease": "power2.out"
      }
    ]
  },
  "player.flurry_stab3": {
    "id": "player.flurry_stab3",
    "name": "세검 3타 - 피니시 돌진",
    "target": "player",
    "type": "once",
    "priority": 14,
    "duration": 140,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -15,
        "y": 0,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "rotation": -0.06,
        "duration": 12,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": -22,
        "y": 0,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "rotation": -0.08,
        "duration": 8,
        "ease": "power3.in"
      },
      {
        "x": 95,
        "y": -5,
        "scaleX": 1.32,
        "scaleY": 0.74,
        "rotation": 0.05,
        "duration": 14,
        "ease": "power4.out",
        "vfx": "flurry_finish",
        "vfxTarget": "target",
        "shake": 6,
        "hitstop": 50,
        "afterimage": true
      },
      {
        "x": 105,
        "y": -3,
        "scaleX": 1.28,
        "scaleY": 0.76,
        "rotation": 0.04,
        "duration": 12,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 90,
        "y": 0,
        "scaleX": 1.18,
        "scaleY": 0.84,
        "rotation": 0.02,
        "duration": 16,
        "ease": "power2.out"
      },
      {
        "x": 65,
        "y": 3,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": 0.01,
        "duration": 20,
        "ease": "power2.out"
      },
      {
        "x": 38,
        "y": 2,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "rotation": 0,
        "duration": 22,
        "ease": "power2.out"
      },
      {
        "x": 15,
        "y": 1,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0,
        "duration": 18,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 18,
        "ease": "power2.out"
      }
    ]
  },
  "player.heavy_slash": {
    "id": "player.heavy_slash",
    "name": "대검 베기",
    "target": "player",
    "type": "once",
    "priority": 12,
    "duration": 480,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -5,
        "y": 5,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "rotation": -0.02,
        "duration": 40,
        "ease": "power1.out"
      },
      {
        "x": -15,
        "y": 15,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "rotation": -0.08,
        "duration": 55,
        "ease": "power2.in"
      },
      {
        "x": -25,
        "y": 25,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.15,
        "duration": 50,
        "ease": "power2.in"
      },
      {
        "x": -30,
        "y": 30,
        "scaleX": 0.8,
        "scaleY": 1.2,
        "rotation": -0.2,
        "duration": 35,
        "ease": "power2.in"
      },
      {
        "x": 20,
        "y": -15,
        "scaleX": 1.15,
        "scaleY": 0.85,
        "rotation": 0.12,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": 70,
        "y": -25,
        "scaleX": 1.35,
        "scaleY": 0.7,
        "rotation": 0.25,
        "duration": 40,
        "ease": "power4.out",
        "vfx": "heavy_slash",
        "vfxTarget": "target",
        "shake": 10,
        "hitstop": 80
      },
      {
        "x": 80,
        "y": -20,
        "scaleX": 1.3,
        "scaleY": 0.75,
        "rotation": 0.22,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 70,
        "y": -12,
        "scaleX": 1.2,
        "scaleY": 0.82,
        "rotation": 0.16,
        "duration": 40,
        "ease": "power2.inOut"
      },
      {
        "x": 55,
        "y": -5,
        "scaleX": 1.12,
        "scaleY": 0.88,
        "rotation": 0.1,
        "duration": 40,
        "ease": "power2.inOut"
      },
      {
        "x": 38,
        "y": 0,
        "scaleX": 1.06,
        "scaleY": 0.94,
        "rotation": 0.05,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 20,
        "y": 3,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "rotation": 0.02,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 8,
        "y": 2,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.out"
      }
    ]
  },
  "player.hit": {
    "id": "player.hit",
    "name": "플레이어 피격",
    "target": "player",
    "type": "once",
    "priority": 20,
    "duration": 500,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -20,
        "y": -5,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.7,
        "rotation": -0.08,
        "duration": 25,
        "ease": "power4.out",
        "vfx": "hit",
        "shake": 8
      },
      {
        "x": -45,
        "y": -8,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "alpha": 0.5,
        "rotation": -0.15,
        "duration": 30,
        "ease": "power3.out"
      },
      {
        "x": -65,
        "y": -5,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.45,
        "rotation": -0.18,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -75,
        "y": 0,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "alpha": 0.5,
        "rotation": -0.16,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -70,
        "y": 2,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "alpha": 0.55,
        "rotation": -0.14,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": -62,
        "y": 3,
        "scaleX": 0.86,
        "scaleY": 1.14,
        "alpha": 0.62,
        "rotation": -0.11,
        "duration": 40,
        "ease": "power2.inOut"
      },
      {
        "x": -52,
        "y": 3,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "alpha": 0.7,
        "rotation": -0.08,
        "duration": 45,
        "ease": "power2.inOut"
      },
      {
        "x": -40,
        "y": 2,
        "scaleX": 0.93,
        "scaleY": 1.07,
        "alpha": 0.78,
        "rotation": -0.05,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": -28,
        "y": 1,
        "scaleX": 0.96,
        "scaleY": 1.04,
        "alpha": 0.85,
        "rotation": -0.03,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": -15,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.92,
        "rotation": -0.01,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": -5,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "alpha": 0.97,
        "rotation": 0,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "player.power_tackle": {
    "id": "player.power_tackle",
    "name": "파워 태클",
    "target": "player",
    "type": "once",
    "priority": 15,
    "duration": 380,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 10,
        "y": 0,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "alpha": 1,
        "rotation": 0.05,
        "duration": 20,
        "ease": "power2.in",
        "vfx": "tackle_burst",
        "vfxTarget": "self",
        "camera": {
          "zoom": 1.2,
          "duration": 200
        },
        "color": "power"
      },
      {
        "x": 120,
        "y": -5,
        "scaleX": 1.25,
        "scaleY": 0.8,
        "alpha": 1,
        "rotation": 0.1,
        "duration": 40,
        "ease": "power3.out",
        "afterimage": true,
        "vfx": "speed_lines",
        "vfxTarget": "self"
      },
      {
        "x": 250,
        "y": -10,
        "scaleX": 1.35,
        "scaleY": 0.75,
        "alpha": 1,
        "rotation": 0.15,
        "duration": 50,
        "ease": "power4.out",
        "afterimage": true
      },
      {
        "x": 350,
        "y": -5,
        "scaleX": 1.4,
        "scaleY": 0.7,
        "alpha": 1,
        "rotation": 0.18,
        "duration": 50,
        "ease": "power4.out",
        "afterimage": true,
        "shake": 15,
        "hitstop": 100,
        "color": "hit"
      },
      {
        "x": 340,
        "y": 0,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "alpha": 1,
        "rotation": 0.1,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 320,
        "y": 3,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "alpha": 1,
        "rotation": 0.05,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 300,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "player.power_tackle_plus": {
    "id": "player.power_tackle_plus",
    "name": "파워 태클+ - 초폭발 돌진",
    "target": "player",
    "type": "once",
    "priority": 20,
    "duration": 350,
    "keyframes": [
      {
        "x": -38,
        "y": 8,
        "scaleX": 0.65,
        "scaleY": 1.35,
        "rotation": -0.18,
        "duration": 0
      },
      {
        "x": -15,
        "y": -8,
        "scaleX": 0.95,
        "scaleY": 1.05,
        "rotation": -0.08,
        "duration": 12,
        "ease": "power4.out",
        "afterimage": true,
        "vfx": "tackle_burst_plus",
        "vfxTarget": "self"
      },
      {
        "x": 100,
        "y": -20,
        "scaleX": 1.5,
        "scaleY": 0.6,
        "rotation": 0.1,
        "duration": 20,
        "ease": "power4.out",
        "afterimage": true
      },
      {
        "x": 200,
        "y": -12,
        "scaleX": 1.6,
        "scaleY": 0.55,
        "rotation": 0.15,
        "duration": 18,
        "ease": "linear",
        "afterimage": true,
        "vfx": "speed_lines_intense",
        "vfxTarget": "self"
      },
      {
        "x": 275,
        "y": -5,
        "scaleX": 1.55,
        "scaleY": 0.58,
        "rotation": 0.18,
        "duration": 15,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 300,
        "y": 0,
        "scaleX": 1.4,
        "scaleY": 0.7,
        "rotation": 0.12,
        "duration": 12,
        "ease": "power4.out",
        "vfx": "power_impact_plus",
        "shake": 22,
        "hitstop": 100
      },
      {
        "x": 295,
        "y": 8,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": 0.07,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 275,
        "y": 10,
        "scaleX": 1.08,
        "scaleY": 0.94,
        "rotation": 0.04,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 250,
        "y": 6,
        "scaleX": 1.03,
        "scaleY": 0.98,
        "rotation": 0.02,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 210,
        "y": 3,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 160,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 58,
        "ease": "power2.inOut"
      }
    ]
  },
  "player.power_windup": {
    "id": "player.power_windup",
    "name": "파워 차징 - 웅크림",
    "target": "player",
    "type": "once",
    "priority": 15,
    "duration": 280,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -15,
        "y": 5,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.05,
        "duration": 40,
        "ease": "power2.in",
        "vfx": "power_charge",
        "vfxTarget": "self"
      },
      {
        "x": -25,
        "y": 8,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "rotation": -0.08,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": -30,
        "y": 10,
        "scaleX": 0.72,
        "scaleY": 1.28,
        "rotation": -0.1,
        "duration": 60,
        "ease": "power1.inOut",
        "vfx": "power_aura",
        "vfxTarget": "self",
        "shake": 2
      },
      {
        "x": -32,
        "y": 12,
        "scaleX": 0.7,
        "scaleY": 1.3,
        "rotation": -0.12,
        "duration": 50,
        "ease": "power1.out",
        "shake": 3
      },
      {
        "x": -35,
        "y": 10,
        "scaleX": 0.68,
        "scaleY": 1.32,
        "rotation": -0.15,
        "duration": 40,
        "ease": "power2.in",
        "vfx": "power_ready",
        "vfxTarget": "self",
        "shake": 4
      },
      {
        "x": -38,
        "y": 8,
        "scaleX": 0.65,
        "scaleY": 1.35,
        "rotation": -0.18,
        "duration": 40,
        "ease": "power3.in"
      }
    ]
  },
  "player.return": {
    "id": "player.return",
    "name": "플레이어 복귀",
    "target": "player",
    "type": "once",
    "priority": 5,
    "duration": 400,
    "returnToBase": true,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1.12,
        "scaleY": 0.9,
        "rotation": 0.04,
        "duration": 0
      },
      {
        "x": -15,
        "y": 3,
        "scaleX": 1.08,
        "scaleY": 0.93,
        "rotation": 0.03,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -35,
        "y": 5,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "rotation": 0.01,
        "duration": 50,
        "ease": "power2.inOut"
      },
      {
        "x": -60,
        "y": 4,
        "scaleX": 0.96,
        "scaleY": 1.04,
        "rotation": -0.02,
        "duration": 60,
        "ease": "power2.inOut"
      },
      {
        "x": -90,
        "y": 2,
        "scaleX": 0.94,
        "scaleY": 1.06,
        "rotation": -0.03,
        "duration": 70,
        "ease": "power2.inOut"
      },
      {
        "x": -110,
        "y": 0,
        "scaleX": 0.96,
        "scaleY": 1.04,
        "rotation": -0.02,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": -120,
        "y": -1,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "rotation": -0.01,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -125,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -128,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": -130,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 35,
        "ease": "power2.out"
      }
    ]
  },
  "player.sneak": {
    "id": "player.sneak",
    "name": "그림자 접근",
    "target": "player",
    "type": "once",
    "priority": 15,
    "duration": 280,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -10,
        "y": 8,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.in",
        "color": "shadow"
      },
      {
        "x": -5,
        "y": 15,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.9,
        "rotation": 0,
        "duration": 25,
        "ease": "power3.in",
        "vfx": "shadow_fade",
        "vfxTarget": "self"
      },
      {
        "x": 150,
        "y": -20,
        "scaleX": 1.2,
        "scaleY": 0.8,
        "alpha": 0.7,
        "rotation": 0.1,
        "duration": 40,
        "ease": "power4.out",
        "afterimage": true,
        "camera": {
          "focus": "enemy",
          "duration": 150
        }
      },
      {
        "x": 280,
        "y": -5,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "alpha": 0.8,
        "rotation": 0.05,
        "duration": 45,
        "ease": "power3.out",
        "afterimage": true,
        "vfx": "shadow_appear",
        "vfxTarget": "self"
      },
      {
        "x": 290,
        "y": 0,
        "scaleX": 1.05,
        "scaleY": 0.95,
        "alpha": 0.9,
        "rotation": 0.02,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 295,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      }
    ]
  },
  "player.sneak_return": {
    "id": "player.sneak_return",
    "name": "그림자 이탈",
    "target": "player",
    "type": "once",
    "priority": 15,
    "duration": 250,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": 10,
        "y": 8,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.9,
        "rotation": 0,
        "duration": 25,
        "ease": "power2.in",
        "vfx": "shadow_fade",
        "vfxTarget": "self"
      },
      {
        "x": -150,
        "y": -15,
        "scaleX": 1.15,
        "scaleY": 0.85,
        "alpha": 0.75,
        "rotation": -0.08,
        "duration": 45,
        "ease": "power4.out",
        "afterimage": true
      },
      {
        "x": -280,
        "y": -5,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "alpha": 0.85,
        "rotation": -0.04,
        "duration": 50,
        "ease": "power3.out",
        "afterimage": true,
        "vfx": "shadow_appear",
        "vfxTarget": "self"
      },
      {
        "x": -290,
        "y": 0,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "alpha": 0.95,
        "rotation": -0.01,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -295,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "power2.out"
      }
    ]
  },
  "player.stab": {
    "id": "player.stab",
    "name": "찌르기",
    "target": "player",
    "type": "once",
    "priority": 12,
    "duration": 220,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -5,
        "y": 2,
        "scaleX": 0.96,
        "scaleY": 1.04,
        "rotation": -0.02,
        "duration": 25,
        "ease": "power1.out"
      },
      {
        "x": -12,
        "y": 6,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": -0.06,
        "duration": 30,
        "ease": "power2.in"
      },
      {
        "x": 8,
        "y": -4,
        "scaleX": 1.05,
        "scaleY": 0.95,
        "rotation": 0.03,
        "duration": 18,
        "ease": "power3.out"
      },
      {
        "x": 40,
        "y": -8,
        "scaleX": 1.22,
        "scaleY": 0.8,
        "rotation": 0.1,
        "duration": 22,
        "ease": "power4.out",
        "vfx": "stab",
        "shake": 4,
        "hitstop": 35
      },
      {
        "x": 48,
        "y": -6,
        "scaleX": 1.25,
        "scaleY": 0.78,
        "rotation": 0.12,
        "duration": 18,
        "ease": "power2.out"
      },
      {
        "x": 42,
        "y": -4,
        "scaleX": 1.18,
        "scaleY": 0.84,
        "rotation": 0.09,
        "duration": 22,
        "ease": "power2.inOut"
      },
      {
        "x": 32,
        "y": -2,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "rotation": 0.06,
        "duration": 25,
        "ease": "power2.inOut"
      },
      {
        "x": 18,
        "y": 0,
        "scaleX": 1.04,
        "scaleY": 0.96,
        "rotation": 0.03,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 8,
        "y": 1,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0.01,
        "duration": 20,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 17,
        "ease": "power2.out"
      }
    ]
  },
  "player.throw": {
    "id": "player.throw",
    "name": "단검 투척",
    "target": "player",
    "type": "once",
    "priority": 12,
    "duration": 380,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 0
      },
      {
        "x": -5,
        "y": 3,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "rotation": -0.02,
        "duration": 35,
        "ease": "power1.out"
      },
      {
        "x": -12,
        "y": 8,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "rotation": -0.06,
        "duration": 45,
        "ease": "power2.in"
      },
      {
        "x": -18,
        "y": 12,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": -0.1,
        "duration": 40,
        "ease": "power2.in"
      },
      {
        "x": 8,
        "y": -5,
        "scaleX": 1.08,
        "scaleY": 0.92,
        "rotation": 0.12,
        "duration": 30,
        "ease": "power3.out",
        "vfx": "throw"
      },
      {
        "x": 18,
        "y": -8,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": 0.18,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 22,
        "y": -6,
        "scaleX": 1.12,
        "scaleY": 0.9,
        "rotation": 0.15,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 18,
        "y": -3,
        "scaleX": 1.08,
        "scaleY": 0.93,
        "rotation": 0.1,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 12,
        "y": 0,
        "scaleX": 1.04,
        "scaleY": 0.96,
        "rotation": 0.06,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 6,
        "y": 2,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0.02,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 2,
        "y": 1,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0.01,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 20,
        "ease": "power2.out"
      }
    ]
  }
};

// VFX 데이터 (38개)
window.VFX_BUNDLE = {
  "backstab_slash": {
    "id": "backstab_slash",
    "name": "급소 베기",
    "shake": 10,
    "particles": [
      {
        "type": "slash",
        "count": 2,
        "angle": [
          -20,
          25
        ],
        "length": [
          80,
          120
        ],
        "width": 10,
        "color": "#ffffff",
        "glow": "#ef4444",
        "life": 120
      },
      {
        "type": "flash",
        "count": 1,
        "size": 80,
        "color": "#fef3c7",
        "life": 60
      },
      {
        "type": "spark",
        "count": 15,
        "spread": 50,
        "speed": [
          5,
          12
        ],
        "size": [
          3,
          7
        ],
        "colors": [
          "#fbbf24",
          "#ffffff",
          "#ef4444"
        ],
        "life": [
          100,
          160
        ]
      }
    ]
  },
  "bash_hit": {
    "id": "bash_hit",
    "name": "강타 피격",
    "shake": 10,
    "particles": [
      {
        "type": "flash",
        "size": 160,
        "color": "#ffffff",
        "life": 60
      },
      {
        "type": "flash",
        "size": 110,
        "color": "#ef4444",
        "life": 80
      },
      {
        "type": "ring",
        "size": 40,
        "maxSize": 200,
        "color": "#ef4444",
        "life": 220
      },
      {
        "type": "line",
        "count": 12,
        "angleStep": 30,
        "length": [
          60,
          140
        ],
        "width": 6,
        "color": "#fbbf24",
        "life": 180
      },
      {
        "type": "spark",
        "count": 25,
        "spread": 110,
        "speed": [
          16,
          40
        ],
        "size": [
          5,
          14
        ],
        "colors": [
          "#ef4444",
          "#fbbf24",
          "#ffffff"
        ],
        "life": [
          150,
          300
        ]
      }
    ]
  },
  "bash_impact": {
    "id": "bash_impact",
    "name": "강타 임팩트",
    "duration": 400,
    "offset": {
      "x": 0,
      "y": -35
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 220,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "flash",
        "color": "#ef4444",
        "size": 160,
        "alpha": 0.9,
        "fadeOut": true
      },
      {
        "type": "flash",
        "color": "#fbbf24",
        "size": 110,
        "alpha": 0.8,
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 2,
        "color": "#ef4444",
        "size": 55,
        "maxSize": 300,
        "alpha": 0.9,
        "fadeOut": true,
        "delay": [
          0,
          60
        ]
      },
      {
        "type": "line",
        "count": 18,
        "color": "#fbbf24",
        "length": 150,
        "width": 8,
        "angle": "radial",
        "alpha": 0.9,
        "lifetime": 220
      },
      {
        "type": "spark",
        "count": 45,
        "color": "#fbbf24",
        "size": 14,
        "speed": 280,
        "angle": "radial",
        "alpha": 1,
        "lifetime": 350
      },
      {
        "type": "debris",
        "count": 30,
        "color": "#ef4444",
        "size": 12,
        "speed": 200,
        "gravity": 4,
        "alpha": 0.9,
        "lifetime": 480
      }
    ]
  },
  "block": {
    "id": "block",
    "name": "방어",
    "shake": 2,
    "particles": [
      {
        "type": "flash",
        "size": 50,
        "color": "#60a5fa",
        "life": 60
      },
      {
        "type": "ring",
        "size": 30,
        "maxSize": 70,
        "color": "#3b82f6",
        "life": 140
      },
      {
        "type": "spark",
        "count": 8,
        "spread": 50,
        "speed": [
          4,
          10
        ],
        "size": [
          2,
          5
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd"
        ],
        "life": [
          120,
          220
        ]
      }
    ]
  },
  "blood_burst": {
    "id": "blood_burst",
    "name": "피 분출",
    "particles": [
      {
        "type": "debris",
        "count": 12,
        "speed": [
          4,
          10
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#ef4444",
          "#dc2626",
          "#991b1b"
        ],
        "gravity": 0.4,
        "life": [
          120,
          180
        ]
      },
      {
        "type": "spark",
        "count": 8,
        "spread": 40,
        "speed": [
          3,
          6
        ],
        "size": [
          2,
          5
        ],
        "colors": [
          "#ef4444",
          "#f87171"
        ],
        "life": [
          80,
          120
        ]
      }
    ]
  },
  "blood_drip": {
    "id": "blood_drip",
    "name": "피 낙하",
    "particles": [
      {
        "type": "debris",
        "count": 12,
        "colors": [
          "#ef4444",
          "#dc2626",
          "#b91c1c"
        ],
        "size": {
          "min": 3,
          "max": 8
        },
        "speed": {
          "min": 2,
          "max": 5
        },
        "angle": {
          "min": 60,
          "max": 120
        },
        "life": {
          "min": 300,
          "max": 500
        },
        "gravity": 0.4,
        "fadeOut": true
      },
      {
        "type": "spark",
        "count": 6,
        "color": "#fca5a5",
        "size": {
          "min": 2,
          "max": 4
        },
        "speed": {
          "min": 1,
          "max": 3
        },
        "angle": {
          "min": 70,
          "max": 110
        },
        "life": {
          "min": 200,
          "max": 350
        },
        "fadeOut": true
      }
    ],
    "offset": {
      "x": -15,
      "y": -40
    }
  },
  "blood_splat": {
    "id": "blood_splat",
    "name": "피 튀김",
    "particles": [
      {
        "type": "spark",
        "count": 18,
        "color": "#dc2626",
        "size": {
          "min": 3,
          "max": 10
        },
        "speed": {
          "min": 3,
          "max": 8
        },
        "angle": {
          "min": 100,
          "max": 260
        },
        "life": {
          "min": 150,
          "max": 350
        },
        "gravity": 0.2,
        "fadeOut": true
      },
      {
        "type": "debris",
        "count": 8,
        "color": "#991b1b",
        "size": {
          "min": 2,
          "max": 6
        },
        "speed": {
          "min": 2,
          "max": 5
        },
        "angle": {
          "min": 130,
          "max": 230
        },
        "life": {
          "min": 200,
          "max": 450
        },
        "gravity": 0.25
      }
    ],
    "offset": {
      "x": -15,
      "y": -50
    }
  },
  "critical": {
    "id": "critical",
    "name": "크리티컬",
    "shake": 25,
    "particles": [
      {
        "type": "flash",
        "size": 200,
        "color": "#ffffff",
        "life": 80
      },
      {
        "type": "flash",
        "size": 150,
        "color": "#fbbf24",
        "life": 120
      },
      {
        "type": "slash",
        "count": 5,
        "delay": 20,
        "angle": [
          -60,
          -30,
          0,
          30,
          60
        ],
        "length": [
          250,
          350
        ],
        "width": 15,
        "color": "#ffffff",
        "glow": "#fbbf24",
        "life": 220
      },
      {
        "type": "slash",
        "count": 5,
        "delay": 20,
        "angle": [
          -60,
          -30,
          0,
          30,
          60
        ],
        "length": [
          200,
          280
        ],
        "width": 35,
        "color": "rgba(251, 191, 36, 0.6)",
        "glow": "#f59e0b",
        "life": 150
      },
      {
        "type": "ring",
        "size": 40,
        "maxSize": 250,
        "color": "#fbbf24",
        "life": 300
      },
      {
        "type": "ring",
        "size": 30,
        "maxSize": 180,
        "color": "#ffffff",
        "life": 250
      },
      {
        "type": "line",
        "count": 24,
        "angleStep": 15,
        "length": [
          80,
          160
        ],
        "width": 5,
        "color": "#fbbf24",
        "life": 250
      },
      {
        "type": "spark",
        "count": 50,
        "spread": 150,
        "speed": [
          15,
          35
        ],
        "size": [
          5,
          15
        ],
        "colors": [
          "#fbbf24",
          "#ffffff",
          "#f59e0b",
          "#fcd34d"
        ],
        "life": [
          300,
          600
        ]
      },
      {
        "type": "debris",
        "count": 35,
        "speed": [
          12,
          30
        ],
        "size": [
          5,
          15
        ],
        "colors": [
          "#fbbf24",
          "#ef4444",
          "#f59e0b"
        ],
        "gravity": 0.5,
        "life": [
          500,
          800
        ]
      }
    ]
  },
  "dagger_hit": {
    "id": "dagger_hit",
    "name": "단검 적중",
    "shake": 4,
    "particles": [
      {
        "type": "flash",
        "size": 40,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "ring",
        "size": 15,
        "maxSize": 50,
        "color": "#94a3b8",
        "life": 120
      },
      {
        "type": "line",
        "count": 6,
        "angleStep": 60,
        "length": [
          25,
          45
        ],
        "width": 2,
        "color": "#cbd5e1",
        "life": 100
      },
      {
        "type": "spark",
        "count": 8,
        "spread": 40,
        "speed": [
          5,
          12
        ],
        "size": [
          2,
          5
        ],
        "colors": [
          "#94a3b8",
          "#ef4444",
          "#ffffff"
        ],
        "life": [
          140,
          260
        ]
      },
      {
        "type": "debris",
        "count": 5,
        "speed": [
          4,
          10
        ],
        "size": [
          2,
          4
        ],
        "colors": [
          "#94a3b8",
          "#64748b"
        ],
        "gravity": 0.25,
        "life": [
          180,
          320
        ]
      }
    ]
  },
  "dagger_stab": {
    "id": "dagger_stab",
    "name": "단검 급습",
    "particles": [
      {
        "type": "arrow",
        "count": 2,
        "color": "#e2e8f0",
        "length": 80,
        "width": 15,
        "angle": 45,
        "life": 120,
        "fadeOut": true
      },
      {
        "type": "arrow",
        "count": 1,
        "color": "#94a3b8",
        "length": 60,
        "width": 10,
        "angle": 30,
        "life": 100,
        "fadeOut": true,
        "delay": 20
      },
      {
        "type": "slash",
        "count": 1,
        "color": "#f8fafc",
        "glow": "#64748b",
        "length": 70,
        "width": 6,
        "angle": 50,
        "life": 100,
        "fadeOut": true
      },
      {
        "type": "spark",
        "count": 15,
        "color": "#f1f5f9",
        "size": {
          "min": 2,
          "max": 6
        },
        "speed": {
          "min": 4,
          "max": 10
        },
        "angle": {
          "min": 20,
          "max": 70
        },
        "life": {
          "min": 80,
          "max": 180
        },
        "fadeOut": true
      }
    ],
    "offset": {
      "x": 30,
      "y": -40
    }
  },
  "dash": {
    "id": "dash",
    "name": "대시",
    "particles": [
      {
        "type": "trail",
        "count": 5,
        "size": [
          60,
          100
        ],
        "offsetX": -30,
        "color": "rgba(96, 165, 250, 0.4)",
        "life": 200
      },
      {
        "type": "spark",
        "count": 10,
        "spread": 50,
        "speed": [
          6,
          14
        ],
        "size": [
          3,
          8
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff"
        ],
        "life": [
          80,
          160
        ]
      },
      {
        "type": "line",
        "count": 6,
        "angleStep": 60,
        "length": [
          30,
          60
        ],
        "width": 3,
        "color": "#60a5fa",
        "life": 80
      }
    ]
  },
  "dodge_flash": {
    "id": "dodge_flash",
    "name": "회피 섬광",
    "particles": [
      {
        "type": "flash",
        "count": 1,
        "size": 100,
        "color": "#ffffff",
        "life": 100
      },
      {
        "type": "line",
        "count": 8,
        "angleStep": 45,
        "length": [
          60,
          100
        ],
        "width": 3,
        "color": "#60a5fa",
        "life": 120
      }
    ]
  },
  "flurry_finish": {
    "id": "flurry_finish",
    "name": "세검 피니시",
    "duration": 250,
    "offset": {
      "x": 0,
      "y": -35
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 150,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "flash",
        "color": "#a78bfa",
        "size": 110,
        "alpha": 0.85,
        "fadeOut": true
      },
      {
        "type": "arrow",
        "count": 2,
        "color": "#e0e7ff",
        "glow": "#8b5cf6",
        "length": 250,
        "width": 70,
        "alpha": 1,
        "lifetime": 180
      },
      {
        "type": "line",
        "count": 1,
        "color": "#ffffff",
        "length": 450,
        "width": 10,
        "angle": 0,
        "alpha": 1,
        "lifetime": 150
      },
      {
        "type": "ring",
        "count": 2,
        "color": "#a78bfa",
        "size": 30,
        "maxSize": 150,
        "alpha": 0.8,
        "fadeOut": true,
        "delay": [
          0,
          40
        ]
      },
      {
        "type": "spark",
        "count": 30,
        "color": "#c4b5fd",
        "size": 7,
        "speed": 200,
        "angle": "radial",
        "alpha": 1,
        "lifetime": 200
      }
    ]
  },
  "flurry_hit": {
    "id": "flurry_hit",
    "name": "세검 적중",
    "shake": 3,
    "particles": [
      {
        "type": "flash",
        "size": 100,
        "color": "#ffffff",
        "life": 45
      },
      {
        "type": "flash",
        "size": 70,
        "color": "#c4b5fd",
        "life": 65
      },
      {
        "type": "ring",
        "size": 25,
        "maxSize": 100,
        "color": "#a5b4fc",
        "life": 130
      },
      {
        "type": "spark",
        "count": 18,
        "spread": 90,
        "speed": [
          15,
          35
        ],
        "size": [
          4,
          12
        ],
        "colors": [
          "#a5b4fc",
          "#c4b5fd",
          "#f0abfc",
          "#ffffff"
        ],
        "life": [
          90,
          180
        ]
      },
      {
        "type": "line",
        "count": 12,
        "angleStep": 30,
        "length": [
          40,
          90
        ],
        "width": 4,
        "color": "#c4b5fd",
        "life": 100
      }
    ]
  },
  "flurry_stab": {
    "id": "flurry_stab",
    "name": "세검 찌르기",
    "duration": 150,
    "offset": {
      "x": 0,
      "y": -30
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 80,
        "alpha": 0.9,
        "fadeOut": true
      },
      {
        "type": "arrow",
        "count": 1,
        "color": "#e0e7ff",
        "glow": "#a78bfa",
        "length": 200,
        "width": 55,
        "alpha": 0.95,
        "lifetime": 120
      },
      {
        "type": "arrow",
        "count": 1,
        "color": "#ffffff",
        "glow": "#818cf8",
        "length": 160,
        "width": 40,
        "alpha": 0.85,
        "lifetime": 100
      },
      {
        "type": "line",
        "count": 1,
        "color": "#ffffff",
        "glow": "#a78bfa",
        "length": 350,
        "width": 6,
        "angle": 0,
        "alpha": 1,
        "lifetime": 100
      },
      {
        "type": "spark",
        "count": 15,
        "color": "#c4b5fd",
        "size": 5,
        "speed": 140,
        "spread": 40,
        "alpha": 0.9,
        "lifetime": 120
      }
    ]
  },
  "heavy_slash": {
    "id": "heavy_slash",
    "name": "대검 베기",
    "duration": 350,
    "offset": {
      "x": 0,
      "y": -40
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 220,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "flash",
        "color": "#ef4444",
        "size": 160,
        "alpha": 0.9,
        "fadeOut": true
      },
      {
        "type": "flash",
        "color": "#fbbf24",
        "size": 120,
        "alpha": 0.8,
        "fadeOut": true
      },
      {
        "type": "slash",
        "count": 2,
        "color": "#ffffff",
        "glow": "#ef4444",
        "angle": [
          -55,
          -40
        ],
        "length": 220,
        "width": 22,
        "alpha": 1,
        "lifetime": 220
      },
      {
        "type": "ring",
        "count": 2,
        "color": "#ef4444",
        "size": 55,
        "maxSize": 280,
        "alpha": 0.9,
        "fadeOut": true,
        "delay": [
          0,
          50
        ]
      },
      {
        "type": "spark",
        "count": 45,
        "color": "#fbbf24",
        "size": 12,
        "speed": 250,
        "angle": "radial",
        "alpha": 1,
        "lifetime": 320
      },
      {
        "type": "debris",
        "count": 30,
        "color": "#ef4444",
        "size": 12,
        "speed": 180,
        "gravity": 4,
        "alpha": 0.9,
        "lifetime": 450
      }
    ]
  },
  "hit": {
    "id": "hit",
    "name": "타격",
    "duration": 280,
    "offset": {
      "x": 0,
      "y": -30
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 150,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "flash",
        "color": "#ef4444",
        "size": 110,
        "alpha": 0.85,
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 2,
        "color": "#ef4444",
        "size": 35,
        "maxSize": 160,
        "alpha": 0.8,
        "fadeOut": true,
        "delay": [
          0,
          40
        ]
      },
      {
        "type": "spark",
        "count": 25,
        "color": "#fbbf24",
        "size": 9,
        "speed": 180,
        "angle": "radial",
        "alpha": 1,
        "lifetime": 200
      },
      {
        "type": "line",
        "count": 16,
        "color": "#fbbf24",
        "length": 90,
        "width": 4,
        "angle": "radial",
        "alpha": 0.7,
        "lifetime": 130
      },
      {
        "type": "debris",
        "count": 15,
        "color": "#ef4444",
        "size": 8,
        "speed": 120,
        "gravity": 3,
        "alpha": 0.9,
        "lifetime": 300
      }
    ]
  },
  "impact_shockwave": {
    "id": "impact_shockwave",
    "name": "충격파",
    "duration": 400,
    "offset": {
      "x": 0,
      "y": -20
    },
    "particles": [
      {
        "type": "ring",
        "count": 2,
        "color": "#ffffff",
        "size": 50,
        "maxSize": 250,
        "alpha": 0.8,
        "fadeOut": true,
        "delay": [
          0,
          80
        ]
      },
      {
        "type": "flash",
        "color": "#ff8844",
        "size": 180,
        "alpha": 0.9,
        "fadeOut": true
      },
      {
        "type": "spark",
        "count": 30,
        "color": "#ffcc00",
        "size": 6,
        "speed": 150,
        "alpha": 0.9,
        "lifetime": 350
      }
    ]
  },
  "impact_shockwave_heavy": {
    "id": "impact_shockwave_heavy",
    "name": "강타 충격파",
    "duration": 500,
    "offset": {
      "x": 0,
      "y": -25
    },
    "particles": [
      {
        "type": "ring",
        "count": 3,
        "color": "#ffffff",
        "size": 60,
        "maxSize": 350,
        "alpha": 0.9,
        "fadeOut": true,
        "delay": [
          0,
          60,
          120
        ]
      },
      {
        "type": "flash",
        "color": "#ff4422",
        "size": 250,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "spark",
        "count": 50,
        "color": "#ffaa00",
        "size": 8,
        "speed": 200,
        "alpha": 1,
        "lifetime": 400
      },
      {
        "type": "debris",
        "count": 15,
        "color": "#664433",
        "size": 10,
        "speed": 160,
        "gravity": 4,
        "rotation": true,
        "alpha": 0.8,
        "lifetime": 500
      }
    ]
  },
  "landing_dust": {
    "id": "landing_dust",
    "name": "착지 먼지",
    "particles": [
      {
        "type": "smoke",
        "count": 20,
        "color": "#78716c",
        "size": {
          "min": 30,
          "max": 60
        },
        "speed": {
          "min": 4,
          "max": 12
        },
        "angle": {
          "min": 130,
          "max": 230
        },
        "life": {
          "min": 250,
          "max": 450
        },
        "gravity": -0.08,
        "fadeOut": true
      },
      {
        "type": "debris",
        "count": 15,
        "colors": [
          "#57534e",
          "#78716c",
          "#a8a29e",
          "#d6d3d1"
        ],
        "size": {
          "min": 3,
          "max": 8
        },
        "speed": {
          "min": 6,
          "max": 15
        },
        "angle": {
          "min": 120,
          "max": 240
        },
        "life": {
          "min": 180,
          "max": 350
        },
        "gravity": 0.25,
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 2,
        "color": "#a8a29e",
        "size": 15,
        "maxSize": 80,
        "life": 180,
        "delay": 30
      },
      {
        "type": "flash",
        "count": 1,
        "color": "#d6d3d1",
        "size": 50,
        "life": 50
      }
    ],
    "offset": {
      "x": 0,
      "y": 30
    },
    "shake": {
      "intensity": 4,
      "duration": 60
    }
  },
  "power_aura": {
    "id": "power_aura",
    "name": "파워 오라",
    "duration": 500,
    "offset": {
      "x": 0,
      "y": -40
    },
    "particles": [
      {
        "type": "ring",
        "count": 2,
        "color": "#ff4400",
        "size": 30,
        "maxSize": 120,
        "alpha": 0.6,
        "fadeOut": true,
        "delay": [
          0,
          150
        ]
      },
      {
        "type": "line",
        "count": 12,
        "color": "#ffcc00",
        "length": 60,
        "width": 3,
        "speed": 100,
        "angle": "radial",
        "alpha": 0.8,
        "lifetime": 400
      },
      {
        "type": "spark",
        "count": 25,
        "color": "#ff8800",
        "size": 5,
        "speed": 80,
        "gravity": -1,
        "alpha": 1,
        "lifetime": 450
      }
    ]
  },
  "power_charge": {
    "id": "power_charge",
    "name": "파워 차징",
    "duration": 400,
    "offset": {
      "x": 0,
      "y": -30
    },
    "particles": [
      {
        "type": "ring",
        "count": 3,
        "color": "#ff6600",
        "size": 20,
        "maxSize": 80,
        "alpha": 0.7,
        "fadeOut": true,
        "delay": [
          0,
          100,
          200
        ]
      },
      {
        "type": "spark",
        "count": 15,
        "color": "#ffaa00",
        "size": 4,
        "speed": 60,
        "gravity": -0.5,
        "alpha": 0.9,
        "lifetime": 350
      },
      {
        "type": "flash",
        "color": "#ff8800",
        "size": 60,
        "alpha": 0.5,
        "fadeOut": true
      }
    ]
  },
  "power_impact": {
    "id": "power_impact",
    "name": "파워 임팩트",
    "duration": 500,
    "offset": {
      "x": 30,
      "y": -30
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 250,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 3,
        "color": "#ff4400",
        "size": 80,
        "maxSize": 300,
        "alpha": 0.9,
        "fadeOut": true,
        "delay": [
          0,
          50,
          100
        ]
      },
      {
        "type": "spark",
        "count": 50,
        "color": "#ffaa00",
        "size": 10,
        "speed": 250,
        "angle": "random",
        "gravity": 2,
        "alpha": 1,
        "lifetime": 450
      },
      {
        "type": "debris",
        "count": 20,
        "color": "#886644",
        "size": 12,
        "speed": 180,
        "gravity": 4,
        "rotation": true,
        "alpha": 0.9,
        "lifetime": 600
      },
      {
        "type": "smoke",
        "count": 10,
        "color": "#444444",
        "size": 80,
        "speed": 30,
        "alpha": 0.5,
        "lifetime": 700
      }
    ]
  },
  "power_impact_plus": {
    "id": "power_impact_plus",
    "name": "파워 임팩트+",
    "duration": 600,
    "offset": {
      "x": 40,
      "y": -35
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 350,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 4,
        "color": "#ff2200",
        "size": 100,
        "maxSize": 400,
        "alpha": 1,
        "fadeOut": true,
        "delay": [
          0,
          40,
          80,
          120
        ]
      },
      {
        "type": "spark",
        "count": 80,
        "color": "#ff6600",
        "size": 12,
        "speed": 320,
        "angle": "random",
        "gravity": 2.5,
        "alpha": 1,
        "lifetime": 500
      },
      {
        "type": "debris",
        "count": 30,
        "color": "#775533",
        "size": 15,
        "speed": 220,
        "gravity": 5,
        "rotation": true,
        "alpha": 1,
        "lifetime": 700
      },
      {
        "type": "smoke",
        "count": 15,
        "color": "#333333",
        "size": 100,
        "speed": 40,
        "alpha": 0.6,
        "lifetime": 800
      }
    ]
  },
  "power_ready": {
    "id": "power_ready",
    "name": "파워 레디",
    "duration": 350,
    "offset": {
      "x": 0,
      "y": -50
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 150,
        "alpha": 0.8,
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 1,
        "color": "#ff2200",
        "size": 40,
        "maxSize": 160,
        "alpha": 0.9,
        "fadeOut": true
      },
      {
        "type": "spark",
        "count": 30,
        "color": "#ffff00",
        "size": 6,
        "speed": 120,
        "gravity": 0,
        "alpha": 1,
        "lifetime": 300
      }
    ]
  },
  "shadow_appear": {
    "id": "shadow_appear",
    "name": "그림자 출현",
    "particles": [
      {
        "type": "flash",
        "count": 1,
        "size": 60,
        "color": "#4c1d95",
        "life": 80
      },
      {
        "type": "ring",
        "count": 1,
        "size": 10,
        "maxSize": 60,
        "color": "#7c3aed",
        "life": 100
      },
      {
        "type": "spark",
        "count": 10,
        "spread": 35,
        "speed": [
          3,
          7
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#7c3aed",
          "#a78bfa",
          "#6366f1"
        ],
        "life": [
          80,
          120
        ]
      }
    ]
  },
  "shadow_fade": {
    "id": "shadow_fade",
    "name": "그림자 소멸",
    "particles": [
      {
        "type": "ring",
        "count": 1,
        "size": 20,
        "maxSize": 80,
        "color": "#1e1b4b",
        "life": 120
      },
      {
        "type": "spark",
        "count": 8,
        "spread": 30,
        "speed": [
          2,
          5
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#312e81",
          "#4c1d95",
          "#1e1b4b"
        ],
        "life": [
          100,
          140
        ]
      }
    ]
  },
  "slash": {
    "id": "slash",
    "name": "베기",
    "duration": 250,
    "offset": {
      "x": 0,
      "y": -35
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ffffff",
        "size": 160,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "flash",
        "color": "#fbbf24",
        "size": 110,
        "alpha": 0.8,
        "fadeOut": true
      },
      {
        "type": "slash",
        "count": 2,
        "color": "#ffffff",
        "glow": "#f59e0b",
        "angle": [
          -50,
          -35
        ],
        "length": 180,
        "width": 18,
        "alpha": 1,
        "lifetime": 180
      },
      {
        "type": "ring",
        "count": 1,
        "color": "#f59e0b",
        "size": 40,
        "maxSize": 170,
        "alpha": 0.8,
        "fadeOut": true
      },
      {
        "type": "spark",
        "count": 30,
        "color": "#fbbf24",
        "size": 8,
        "speed": 200,
        "angle": "radial",
        "alpha": 1,
        "lifetime": 200
      },
      {
        "type": "line",
        "count": 14,
        "color": "#fbbf24",
        "length": 100,
        "width": 5,
        "angle": "radial",
        "alpha": 0.8,
        "lifetime": 140
      }
    ]
  },
  "smoke_puff": {
    "id": "smoke_puff",
    "name": "연막",
    "particles": [
      {
        "type": "smoke",
        "count": 20,
        "color": "#475569",
        "size": {
          "min": 30,
          "max": 60
        },
        "speed": {
          "min": 2,
          "max": 6
        },
        "angle": {
          "min": -180,
          "max": 180
        },
        "life": {
          "min": 350,
          "max": 600
        },
        "gravity": -0.12,
        "fadeOut": true
      },
      {
        "type": "smoke",
        "count": 12,
        "color": "#64748b",
        "size": {
          "min": 20,
          "max": 45
        },
        "speed": {
          "min": 3,
          "max": 8
        },
        "angle": {
          "min": 140,
          "max": 220
        },
        "life": {
          "min": 250,
          "max": 450
        },
        "gravity": -0.08,
        "fadeOut": true
      },
      {
        "type": "spark",
        "count": 10,
        "color": "#94a3b8",
        "size": {
          "min": 2,
          "max": 5
        },
        "speed": {
          "min": 4,
          "max": 10
        },
        "angle": {
          "min": 150,
          "max": 210
        },
        "life": {
          "min": 150,
          "max": 300
        },
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 1,
        "color": "#475569",
        "size": 15,
        "maxSize": 70,
        "life": 200
      }
    ],
    "offset": {
      "x": 0,
      "y": -40
    }
  },
  "spark": {
    "id": "spark",
    "name": "스파크",
    "shake": 3,
    "particles": [
      {
        "type": "flash",
        "size": 40,
        "color": "#fbbf24",
        "life": 50
      },
      {
        "type": "spark",
        "count": 35,
        "spread": 60,
        "speed": [
          8,
          20
        ],
        "size": [
          3,
          10
        ],
        "colors": [
          "#fbbf24",
          "#ffffff",
          "#f59e0b",
          "#fcd34d"
        ],
        "life": [
          200,
          400
        ]
      },
      {
        "type": "ring",
        "size": 15,
        "maxSize": 60,
        "color": "#fbbf24",
        "life": 120
      }
    ]
  },
  "speed_lines": {
    "id": "speed_lines",
    "name": "스피드 라인",
    "duration": 300,
    "offset": {
      "x": -50,
      "y": 0
    },
    "particles": [
      {
        "type": "line",
        "count": 20,
        "color": "#ffffff",
        "length": 120,
        "width": 4,
        "speed": 400,
        "angle": 0,
        "spread": 15,
        "alpha": 0.8,
        "lifetime": 250
      },
      {
        "type": "line",
        "count": 15,
        "color": "#ffcc00",
        "length": 80,
        "width": 3,
        "speed": 350,
        "angle": 0,
        "spread": 20,
        "alpha": 0.6,
        "lifetime": 200
      }
    ]
  },
  "speed_lines_intense": {
    "id": "speed_lines_intense",
    "name": "스피드 라인 강화",
    "duration": 350,
    "offset": {
      "x": -60,
      "y": 0
    },
    "particles": [
      {
        "type": "line",
        "count": 30,
        "color": "#ffffff",
        "length": 160,
        "width": 5,
        "speed": 500,
        "angle": 0,
        "spread": 12,
        "alpha": 0.9,
        "lifetime": 280
      },
      {
        "type": "line",
        "count": 25,
        "color": "#ff8800",
        "length": 120,
        "width": 4,
        "speed": 450,
        "angle": 0,
        "spread": 18,
        "alpha": 0.7,
        "lifetime": 250
      },
      {
        "type": "spark",
        "count": 15,
        "color": "#ffff00",
        "size": 4,
        "speed": 350,
        "angle": 0,
        "spread": 25,
        "alpha": 0.9,
        "lifetime": 200
      }
    ]
  },
  "stab": {
    "id": "stab",
    "name": "찌르기",
    "shake": 4,
    "particles": [
      {
        "type": "flash",
        "size": 80,
        "color": "#ffffff",
        "life": 45
      },
      {
        "type": "arrow",
        "count": 1,
        "length": [
          200,
          260
        ],
        "width": 60,
        "tipAngle": 32,
        "color": "#ffffff",
        "glow": "#60a5fa",
        "innerColor": "rgba(96, 165, 250, 0.5)",
        "life": 120
      },
      {
        "type": "arrow",
        "count": 1,
        "length": [
          160,
          210
        ],
        "width": 40,
        "tipAngle": 28,
        "color": "#e0f2fe",
        "glow": "#3b82f6",
        "innerColor": "rgba(59, 130, 246, 0.3)",
        "life": 90
      },
      {
        "type": "thrust",
        "count": 1,
        "angle": [
          0
        ],
        "length": [
          280,
          360
        ],
        "width": 5,
        "color": "#ffffff",
        "glow": "#60a5fa",
        "life": 100
      },
      {
        "type": "spark",
        "count": 14,
        "spread": 50,
        "speed": [
          10,
          24
        ],
        "size": [
          3,
          9
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff"
        ],
        "life": [
          90,
          180
        ]
      }
    ]
  },
  "tackle_burst": {
    "id": "tackle_burst",
    "name": "태클 버스트",
    "duration": 400,
    "offset": {
      "x": 30,
      "y": -20
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ff6600",
        "size": 200,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 2,
        "color": "#ffaa00",
        "size": 50,
        "maxSize": 200,
        "alpha": 0.8,
        "fadeOut": true,
        "delay": [
          0,
          50
        ]
      },
      {
        "type": "spark",
        "count": 40,
        "color": "#ff4400",
        "size": 8,
        "speed": 200,
        "angle": 0,
        "spread": 60,
        "gravity": 0.5,
        "alpha": 1,
        "lifetime": 350
      },
      {
        "type": "smoke",
        "count": 8,
        "color": "#664422",
        "size": 50,
        "speed": 40,
        "alpha": 0.6,
        "lifetime": 500
      }
    ]
  },
  "tackle_burst_plus": {
    "id": "tackle_burst_plus",
    "name": "태클 버스트+",
    "duration": 450,
    "offset": {
      "x": 40,
      "y": -25
    },
    "particles": [
      {
        "type": "flash",
        "color": "#ff4400",
        "size": 280,
        "alpha": 1,
        "fadeOut": true
      },
      {
        "type": "ring",
        "count": 3,
        "color": "#ff8800",
        "size": 60,
        "maxSize": 280,
        "alpha": 0.9,
        "fadeOut": true,
        "delay": [
          0,
          40,
          80
        ]
      },
      {
        "type": "spark",
        "count": 60,
        "color": "#ff2200",
        "size": 10,
        "speed": 280,
        "angle": 0,
        "spread": 70,
        "gravity": 0.3,
        "alpha": 1,
        "lifetime": 400
      },
      {
        "type": "smoke",
        "count": 12,
        "color": "#553311",
        "size": 70,
        "speed": 50,
        "alpha": 0.7,
        "lifetime": 550
      }
    ]
  },
  "throw": {
    "id": "throw",
    "name": "투척",
    "particles": [
      {
        "type": "projectile",
        "shape": "dagger",
        "speed": 25,
        "rotation": 720,
        "size": 20,
        "color": "#94a3b8",
        "glow": "#60a5fa",
        "life": 300
      },
      {
        "type": "trail",
        "count": 6,
        "delay": 15,
        "offsetX": -15,
        "size": [
          15,
          30
        ],
        "color": "rgba(148, 163, 184, 0.3)",
        "life": 120
      },
      {
        "type": "spark",
        "count": 4,
        "spread": 25,
        "speed": [
          3,
          8
        ],
        "size": [
          2,
          4
        ],
        "colors": [
          "#94a3b8",
          "#cbd5e1"
        ],
        "life": [
          100,
          180
        ]
      }
    ]
  },
  "wind_burst": {
    "id": "wind_burst",
    "name": "바람 폭발",
    "particles": [
      {
        "type": "ring",
        "count": 1,
        "size": 30,
        "maxSize": 120,
        "color": "#94a3b8",
        "life": 150
      },
      {
        "type": "spark",
        "count": 12,
        "spread": 40,
        "speed": [
          4,
          8
        ],
        "size": [
          3,
          6
        ],
        "color": "#60a5fa",
        "life": [
          100,
          150
        ]
      }
    ]
  },
  "wind_spiral": {
    "id": "wind_spiral",
    "name": "나선 바람",
    "particles": [
      {
        "type": "ring",
        "count": 4,
        "color": "#0ea5e9",
        "size": 10,
        "maxSize": 120,
        "life": 250,
        "delay": 25
      },
      {
        "type": "slash",
        "count": 12,
        "color": "#e0f2fe",
        "glow": "#0284c7",
        "angle": [
          0,
          30,
          60,
          90,
          120,
          150,
          180,
          210,
          240,
          270,
          300,
          330
        ],
        "length": {
          "min": 40,
          "max": 70
        },
        "width": 5,
        "life": 150
      },
      {
        "type": "spark",
        "count": 30,
        "colors": [
          "#ffffff",
          "#bae6fd",
          "#7dd3fc",
          "#0ea5e9"
        ],
        "size": {
          "min": 3,
          "max": 8
        },
        "speed": {
          "min": 8,
          "max": 18
        },
        "angle": {
          "min": -180,
          "max": 180
        },
        "life": {
          "min": 120,
          "max": 250
        },
        "fadeOut": true
      }
    ],
    "offset": {
      "x": 0,
      "y": 0
    }
  }
};

// 번들 로드 완료 플래그
window.ANIM_BUNDLE_LOADED = true;

console.log('[AnimBundle] ✅ 로드 완료:', Object.keys(ANIM_BUNDLE).length, 'anims,', Object.keys(VFX_BUNDLE).length, 'vfx');
