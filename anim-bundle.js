/**
 * DDOO Animation Bundle - 자동 생성됨
 * 생성일: 2026-01-04T16:12:04.963Z
 * 
 * 이 파일을 포함하면 fetch 없이 모든 애니메이션/VFX 데이터 사용 가능!
 * <script src="anim-bundle.js"></script>
 */

// 애니메이션 데이터 (70개)
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
    "name": "단검 투척 - 암살자의 칼날",
    "type": "sequence",
    "description": "회전하는 단검이 적을 관통하며 강렬한 충격을 준다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.dagger_throw",
        "wait": true
      },
      {
        "delay": 120
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
  "card.plunder": {
    "id": "card.plunder",
    "name": "강탈 - 공중 콤보",
    "type": "sequence",
    "description": "어퍼컷으로 띄우고 공중에서 난무 후 내려찍어 골드를 강탈한다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.plunder_dash",
        "wait": true
      },
      {
        "anim": "player.plunder_uppercut",
        "wait": false
      },
      {
        "anim": "enemy.plunder_launch",
        "wait": true,
        "delay": 30,
        "damage": 2
      },
      {
        "delay": 30
      },
      {
        "anim": "player.plunder_air1",
        "wait": false
      },
      {
        "anim": "enemy.plunder_air_hit",
        "wait": true,
        "delay": 20,
        "damage": 1
      },
      {
        "delay": 20
      },
      {
        "anim": "player.plunder_air2",
        "wait": false
      },
      {
        "anim": "enemy.plunder_air_hit",
        "wait": true,
        "delay": 25,
        "damage": 1
      },
      {
        "delay": 30
      },
      {
        "anim": "player.plunder_slam",
        "wait": false
      },
      {
        "anim": "enemy.plunder_slam_hit",
        "wait": true,
        "delay": 40,
        "damage": 4
      }
    ]
  },
  "card.plunder_drain": {
    "id": "card.plunder_drain",
    "name": "강탈 - 공중 콤보 (취약 보너스)",
    "type": "sequence",
    "description": "취약한 적을 공중 콤보로 털어 에너지를 획득한다",
    "returnToBase": true,
    "steps": [
      {
        "anim": "player.plunder_dash",
        "wait": true
      },
      {
        "anim": "player.plunder_uppercut",
        "wait": false
      },
      {
        "anim": "enemy.plunder_launch",
        "wait": true,
        "delay": 30,
        "damage": 2
      },
      {
        "delay": 20
      },
      {
        "anim": "player.plunder_air1",
        "wait": false
      },
      {
        "anim": "enemy.plunder_air_hit",
        "wait": true,
        "delay": 20,
        "damage": 1
      },
      {
        "delay": 15
      },
      {
        "anim": "player.plunder_air2",
        "wait": false
      },
      {
        "anim": "enemy.plunder_air_hit",
        "wait": true,
        "delay": 25,
        "damage": 1
      },
      {
        "delay": 20
      },
      {
        "anim": "player.plunder_slam",
        "wait": false
      },
      {
        "anim": "enemy.plunder_slam_hit",
        "wait": true,
        "delay": 40,
        "damage": 4
      },
      {
        "delay": 100
      },
      {
        "event": {
          "type": "energy",
          "value": 2
        }
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
    "name": "적 단검 피격 - 관통 충격",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 400,
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
        "y": -12,
        "scaleX": 0.7,
        "scaleY": 1.3,
        "alpha": 0.6,
        "rotation": 0.12,
        "duration": 20,
        "ease": "power4.out",
        "shake": 14,
        "hitstop": 80,
        "color": "hit",
        "shatter": {
          "target": "self",
          "grid": 8,
          "force": 10,
          "life": 350,
          "hideTime": 100
        }
      },
      {
        "x": 60,
        "y": -18,
        "scaleX": 0.65,
        "scaleY": 1.35,
        "alpha": 0.45,
        "rotation": 0.2,
        "duration": 30,
        "ease": "power3.out",
        "vfx": "blood_splat"
      },
      {
        "x": 90,
        "y": -12,
        "scaleX": 0.6,
        "scaleY": 1.4,
        "alpha": 0.4,
        "rotation": 0.25,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 100,
        "y": -5,
        "scaleX": 0.65,
        "scaleY": 1.35,
        "alpha": 0.5,
        "rotation": 0.22,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": 85,
        "y": 0,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.6,
        "rotation": 0.15,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 60,
        "y": 3,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.75,
        "rotation": 0.1,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 35,
        "y": 2,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "alpha": 0.88,
        "rotation": 0.05,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 15,
        "y": 0,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "alpha": 0.95,
        "rotation": 0.02,
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
        "ease": "elastic.out(1, 0.6)"
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
        "ease": "power2.in",
        "vfx": "dash",
        "vfxTarget": "self"
      },
      {
        "dashToTarget": "player",
        "dashPadding": 15,
        "y": -5,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": -0.06,
        "duration": 80,
        "dashEase": "power4.out",
        "afterimage": true
      },
      {
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": -0.03,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "scaleX": 1.05,
        "scaleY": 0.96,
        "rotation": -0.01,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
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
    "name": "연속 피격 왼쪽 (강화)",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 100,
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
        "alpha": 0.6,
        "rotation": -0.15,
        "duration": 12,
        "ease": "power4.out",
        "color": "hit",
        "colorDuration": 50,
        "shatter": {
          "target": "self",
          "grid": 6,
          "force": 5,
          "life": 200,
          "hideTime": 60
        }
      },
      {
        "x": -45,
        "y": -5,
        "scaleX": 0.72,
        "scaleY": 1.32,
        "alpha": 0.5,
        "rotation": -0.2,
        "duration": 15,
        "ease": "power3.out"
      },
      {
        "x": 15,
        "y": 2,
        "scaleX": 1.06,
        "scaleY": 0.95,
        "alpha": 0.7,
        "rotation": 0.06,
        "duration": 18,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 0,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "alpha": 0.85,
        "rotation": 0.02,
        "duration": 20,
        "ease": "power2.out"
      },
      {
        "x": -3,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.92,
        "rotation": -0.01,
        "duration": 18,
        "ease": "elastic.out(1, 0.5)"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 17,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.flurry_hit_right": {
    "id": "enemy.flurry_hit_right",
    "name": "연속 피격 오른쪽 (강화)",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 100,
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
        "y": -10,
        "scaleX": 1.28,
        "scaleY": 0.75,
        "alpha": 0.6,
        "rotation": 0.18,
        "duration": 12,
        "ease": "power4.out",
        "color": "hit",
        "colorDuration": 50,
        "shatter": {
          "target": "self",
          "grid": 6,
          "force": 5,
          "life": 200,
          "hideTime": 60
        }
      },
      {
        "x": 45,
        "y": -6,
        "scaleX": 1.32,
        "scaleY": 0.72,
        "alpha": 0.5,
        "rotation": 0.22,
        "duration": 15,
        "ease": "power3.out"
      },
      {
        "x": -15,
        "y": 2,
        "scaleX": 0.95,
        "scaleY": 1.06,
        "alpha": 0.7,
        "rotation": -0.06,
        "duration": 18,
        "ease": "power2.out"
      },
      {
        "x": -5,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.85,
        "rotation": -0.02,
        "duration": 20,
        "ease": "power2.out"
      },
      {
        "x": 3,
        "y": 0,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "alpha": 0.92,
        "rotation": 0.01,
        "duration": 18,
        "ease": "elastic.out(1, 0.5)"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 17,
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
    "name": "적 피격 - 왼쪽 강화",
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
        "x": -45,
        "y": -10,
        "scaleX": 0.7,
        "scaleY": 1.35,
        "alpha": 0.6,
        "rotation": -0.18,
        "duration": 25,
        "ease": "power4.out",
        "vfx": "hit",
        "vfxTarget": "self",
        "color": "hit",
        "colorDuration": 80,
        "shatter": {
          "target": "self",
          "grid": 8,
          "force": 8,
          "life": 300,
          "hideTime": 80
        }
      },
      {
        "x": -70,
        "y": -5,
        "scaleX": 0.65,
        "scaleY": 1.4,
        "alpha": 0.5,
        "rotation": -0.25,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": 25,
        "y": 5,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "alpha": 0.75,
        "rotation": 0.1,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 12,
        "y": 3,
        "scaleX": 1.05,
        "scaleY": 0.96,
        "alpha": 0.85,
        "rotation": 0.05,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": -8,
        "y": 0,
        "scaleX": 0.97,
        "scaleY": 1.03,
        "alpha": 0.92,
        "rotation": -0.03,
        "duration": 50,
        "ease": "elastic.out(1, 0.5)"
      },
      {
        "x": 3,
        "y": 0,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "alpha": 0.96,
        "rotation": 0.01,
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
        "duration": 30,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.hit_right": {
    "id": "enemy.hit_right",
    "name": "적 피격 - 오른쪽 강화",
    "target": "enemy",
    "type": "once",
    "priority": 20,
    "duration": 400,
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
        "x": 45,
        "y": -12,
        "scaleX": 1.35,
        "scaleY": 0.7,
        "alpha": 0.6,
        "rotation": 0.2,
        "duration": 25,
        "ease": "power4.out",
        "vfx": "hit",
        "vfxTarget": "self",
        "color": "hit",
        "colorDuration": 80,
        "shatter": {
          "target": "self",
          "grid": 8,
          "force": 8,
          "life": 300,
          "hideTime": 80
        },
        "slowmo": {
          "scale": 0.3,
          "duration": 100
        }
      },
      {
        "x": 70,
        "y": -8,
        "scaleX": 1.4,
        "scaleY": 0.65,
        "alpha": 0.5,
        "rotation": 0.28,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": -25,
        "y": 5,
        "scaleX": 0.92,
        "scaleY": 1.1,
        "alpha": 0.75,
        "rotation": -0.1,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -12,
        "y": 3,
        "scaleX": 0.96,
        "scaleY": 1.05,
        "alpha": 0.85,
        "rotation": -0.05,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 8,
        "y": 0,
        "scaleX": 1.03,
        "scaleY": 0.97,
        "alpha": 0.92,
        "rotation": 0.03,
        "duration": 50,
        "ease": "elastic.out(1, 0.5)"
      },
      {
        "x": -3,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "alpha": 0.96,
        "rotation": -0.01,
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
        "duration": 30,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.plunder_air_hit": {
    "id": "enemy.plunder_air_hit",
    "name": "강탈 - 공중 피격",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 100,
    "keyframes": [
      {
        "x": 10,
        "y": -50,
        "scaleX": 0.8,
        "scaleY": 1.2,
        "alpha": 0.9,
        "rotation": -0.15,
        "duration": 0
      },
      {
        "x": -15,
        "y": -55,
        "scaleX": 0.7,
        "scaleY": 1.3,
        "alpha": 0.7,
        "rotation": 0.2,
        "duration": 25,
        "ease": "power4.out",
        "color": "hit",
        "shatter": {
          "target": "self",
          "grid": 6,
          "force": 6,
          "life": 250,
          "hideTime": 60
        }
      },
      {
        "x": -5,
        "y": -50,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "alpha": 0.82,
        "rotation": 0.1,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": -52,
        "scaleX": 0.8,
        "scaleY": 1.2,
        "alpha": 0.88,
        "rotation": -0.05,
        "duration": 40,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.plunder_finish": {
    "id": "enemy.plunder_finish",
    "name": "강탈 마무리 피격 (대형 복셀)",
    "target": "enemy",
    "type": "once",
    "priority": 19,
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
        "x": -25,
        "y": -15,
        "scaleX": 0.6,
        "scaleY": 1.4,
        "alpha": 0.5,
        "rotation": -0.2,
        "duration": 40,
        "ease": "power4.out",
        "hitstop": 80,
        "shake": 12,
        "color": "critical",
        "shatter": {
          "target": "self",
          "grid": 12,
          "force": 18,
          "life": 600,
          "hideTime": 200,
          "gravity": 0.5
        },
        "vfx": "blood_burst"
      },
      {
        "x": -15,
        "y": -5,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.65,
        "rotation": -0.12,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 40,
        "y": 5,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.75,
        "rotation": 0.1,
        "duration": 60,
        "ease": "power3.out"
      },
      {
        "x": 60,
        "y": 0,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "alpha": 0.88,
        "rotation": 0.05,
        "duration": 60,
        "ease": "power2.out"
      },
      {
        "x": 30,
        "y": 0,
        "scaleX": 0.96,
        "scaleY": 1.04,
        "alpha": 0.94,
        "rotation": 0.02,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 40,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.plunder_hit": {
    "id": "enemy.plunder_hit",
    "name": "강탈 피격 (단일)",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 150,
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
        "x": -15,
        "y": -10,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.7,
        "rotation": -0.15,
        "duration": 30,
        "ease": "power4.out",
        "color": "hit",
        "shatter": {
          "target": "self",
          "grid": 10,
          "force": 12,
          "life": 400,
          "hideTime": 100
        },
        "hitstop": 50,
        "shake": 8
      },
      {
        "x": -8,
        "y": -3,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "alpha": 0.85,
        "rotation": -0.08,
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
        "duration": 80,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.plunder_hit1": {
    "id": "enemy.plunder_hit1",
    "name": "강탈 피격 1",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 100,
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
        "x": -8,
        "y": -5,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.8,
        "rotation": -0.08,
        "duration": 25,
        "ease": "power4.out",
        "color": "hit",
        "shatter": {
          "target": "self",
          "grid": 8,
          "force": 8,
          "life": 300,
          "hideTime": 80
        }
      },
      {
        "x": -5,
        "y": 0,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "alpha": 0.9,
        "rotation": -0.04,
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
        "duration": 40,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.plunder_hit2": {
    "id": "enemy.plunder_hit2",
    "name": "강탈 피격 2",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 100,
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
        "y": -3,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "alpha": 0.75,
        "rotation": 0.1,
        "duration": 25,
        "ease": "power4.out",
        "color": "hit",
        "shatter": {
          "target": "self",
          "grid": 8,
          "force": 9,
          "life": 300,
          "hideTime": 80
        }
      },
      {
        "x": 6,
        "y": 0,
        "scaleX": 0.94,
        "scaleY": 1.06,
        "alpha": 0.88,
        "rotation": 0.05,
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
        "duration": 40,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.plunder_hit3": {
    "id": "enemy.plunder_hit3",
    "name": "강탈 피격 3",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 100,
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
        "x": -12,
        "y": 5,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "alpha": 0.7,
        "rotation": -0.12,
        "duration": 25,
        "ease": "power4.out",
        "color": "hit",
        "shatter": {
          "target": "self",
          "grid": 9,
          "force": 10,
          "life": 350,
          "hideTime": 90
        }
      },
      {
        "x": -7,
        "y": 2,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "alpha": 0.85,
        "rotation": -0.06,
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
        "duration": 40,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.plunder_hit4": {
    "id": "enemy.plunder_hit4",
    "name": "강탈 피격 4",
    "target": "enemy",
    "type": "once",
    "priority": 18,
    "duration": 100,
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
        "x": 15,
        "y": -8,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "alpha": 0.65,
        "rotation": 0.15,
        "duration": 25,
        "ease": "power4.out",
        "color": "hit",
        "shatter": {
          "target": "self",
          "grid": 9,
          "force": 11,
          "life": 350,
          "hideTime": 90
        }
      },
      {
        "x": 8,
        "y": -3,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "alpha": 0.82,
        "rotation": 0.08,
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
        "duration": 40,
        "ease": "power2.out"
      }
    ]
  },
  "enemy.plunder_launch": {
    "id": "enemy.plunder_launch",
    "name": "강탈 - 띄워짐",
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
        "x": 10,
        "y": -20,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.9,
        "rotation": -0.1,
        "duration": 40,
        "ease": "power4.out",
        "color": "hit"
      },
      {
        "x": 15,
        "y": -60,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.85,
        "rotation": -0.2,
        "duration": 80,
        "ease": "power2.out",
        "vfx": "launch_wind"
      },
      {
        "x": 10,
        "y": -50,
        "scaleX": 0.8,
        "scaleY": 1.2,
        "alpha": 0.9,
        "rotation": -0.15,
        "duration": 80,
        "ease": "power2.inOut"
      }
    ]
  },
  "enemy.plunder_slam_hit": {
    "id": "enemy.plunder_slam_hit",
    "name": "강탈 - 내려찍힘 (골드 흡수)",
    "target": "enemy",
    "type": "once",
    "priority": 19,
    "duration": 400,
    "keyframes": [
      {
        "x": 5,
        "y": -52,
        "scaleX": 0.8,
        "scaleY": 1.2,
        "alpha": 0.88,
        "rotation": -0.05,
        "duration": 0
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1.4,
        "scaleY": 0.6,
        "alpha": 0.6,
        "rotation": 0.1,
        "duration": 60,
        "ease": "power4.out",
        "color": "critical",
        "shatter": {
          "target": "self",
          "grid": 10,
          "force": 15,
          "life": 500,
          "hideTime": 150,
          "gravity": 0.5
        },
        "vfx": "ground_impact"
      },
      {
        "x": 10,
        "y": 5,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "alpha": 0.7,
        "rotation": 0.05,
        "duration": 70,
        "ease": "power2.out"
      },
      {
        "x": 20,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 0.8,
        "rotation": 0,
        "duration": 80,
        "ease": "power2.out",
        "vfx": "gold_orbs_rise"
      },
      {
        "x": 15,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 0.9,
        "rotation": 0,
        "duration": 90,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 100,
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
    "name": "플레이어 공격 - 강화",
    "target": "player",
    "type": "once",
    "priority": 10,
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
        "x": -10,
        "y": 5,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "rotation": -0.05,
        "duration": 35,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": -22,
        "y": 12,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.1,
        "duration": 45,
        "ease": "power2.in",
        "color": "power"
      },
      {
        "x": -30,
        "y": 18,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "rotation": -0.15,
        "duration": 35,
        "ease": "power3.in"
      },
      {
        "x": 20,
        "y": -10,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": 0.08,
        "duration": 20,
        "ease": "power4.out",
        "afterimage": true,
        "camera": {
          "zoom": 1.1,
          "duration": 150
        }
      },
      {
        "x": 70,
        "y": -18,
        "scaleX": 1.35,
        "scaleY": 0.7,
        "rotation": 0.2,
        "duration": 25,
        "ease": "power4.out",
        "vfx": "slash",
        "vfxTarget": "target",
        "shake": 10,
        "hitstop": 70,
        "afterimage": true,
        "color": "hit"
      },
      {
        "x": 80,
        "y": -12,
        "scaleX": 1.3,
        "scaleY": 0.75,
        "rotation": 0.18,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "x": 65,
        "y": -6,
        "scaleX": 1.18,
        "scaleY": 0.85,
        "rotation": 0.12,
        "duration": 35,
        "ease": "power2.inOut"
      },
      {
        "x": 45,
        "y": -2,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": 0.08,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 25,
        "y": 0,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "rotation": 0.04,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 10,
        "y": 1,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0.01,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 30,
        "ease": "elastic.out(1, 0.6)"
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
          "zoom": 1.25,
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
        "shake": 14,
        "slowmo": "impact",
        "color": "critical",
        "colorDuration": 120
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
  "player.dagger_throw": {
    "id": "player.dagger_throw",
    "name": "단검 투척 - 암살자의 섬광",
    "target": "player",
    "type": "once",
    "priority": 15,
    "duration": 500,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": -5,
        "y": 3,
        "scaleX": 0.95,
        "scaleY": 1.05,
        "rotation": -0.05,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -15,
        "y": 8,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.12,
        "duration": 40,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": -25,
        "y": 12,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "rotation": -0.18,
        "duration": 35,
        "ease": "power3.in",
        "color": "power"
      },
      {
        "x": 30,
        "y": -15,
        "scaleX": 1.35,
        "scaleY": 0.7,
        "rotation": 0.35,
        "duration": 25,
        "ease": "power4.out",
        "vfx": "dagger_throw",
        "afterimage": true,
        "camera": {
          "zoom": 1.15,
          "duration": 150
        }
      },
      {
        "x": 50,
        "y": -20,
        "scaleX": 1.4,
        "scaleY": 0.65,
        "rotation": 0.4,
        "duration": 30,
        "ease": "power3.out",
        "afterimage": true
      },
      {
        "x": 60,
        "y": -15,
        "scaleX": 1.3,
        "scaleY": 0.75,
        "rotation": 0.32,
        "duration": 35,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 50,
        "y": -8,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": 0.2,
        "duration": 45,
        "ease": "power2.inOut"
      },
      {
        "x": 35,
        "y": -3,
        "scaleX": 1.08,
        "scaleY": 0.94,
        "rotation": 0.12,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 18,
        "y": 0,
        "scaleX": 1.03,
        "scaleY": 0.98,
        "rotation": 0.05,
        "duration": 55,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 60,
        "ease": "elastic.out(1, 0.5)"
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
        "ease": "power2.in",
        "vfx": "dash",
        "vfxTarget": "self"
      },
      {
        "dashToTarget": "enemy",
        "dashPadding": 15,
        "y": -5,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": 0.06,
        "duration": 80,
        "dashEase": "power4.out",
        "afterimage": true
      },
      {
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": 0.03,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "scaleX": 1.05,
        "scaleY": 0.96,
        "rotation": 0.01,
        "duration": 25,
        "ease": "power2.out"
      },
      {
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
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
    "name": "세검 1타 - 상단 찌르기 (강화)",
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
        "x": -10,
        "y": -18,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.1,
        "duration": 8,
        "ease": "power3.in",
        "afterimage": true,
        "color": "power"
      },
      {
        "x": 80,
        "y": -30,
        "scaleX": 1.3,
        "scaleY": 0.75,
        "rotation": 0.15,
        "duration": 10,
        "ease": "power4.out",
        "vfx": "flurry_stab",
        "vfxTarget": "target",
        "shake": 5,
        "hitstop": 30,
        "afterimage": true,
        "camera": {
          "zoom": 1.05,
          "duration": 80
        }
      },
      {
        "x": 88,
        "y": -25,
        "scaleX": 1.25,
        "scaleY": 0.8,
        "rotation": 0.12,
        "duration": 10,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 65,
        "y": -15,
        "scaleX": 1.12,
        "scaleY": 0.9,
        "rotation": 0.06,
        "duration": 14,
        "ease": "power2.out"
      },
      {
        "x": 35,
        "y": -6,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "rotation": 0.02,
        "duration": 18,
        "ease": "power2.out"
      },
      {
        "x": 12,
        "y": -2,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0.01,
        "duration": 17,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 18,
        "ease": "elastic.out(1, 0.6)"
      }
    ]
  },
  "player.flurry_stab2": {
    "id": "player.flurry_stab2",
    "name": "세검 2타 - 하단 찌르기 (강화)",
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
        "x": -8,
        "y": 15,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": 0.08,
        "duration": 7,
        "ease": "power3.in",
        "afterimage": true,
        "color": "power"
      },
      {
        "x": 75,
        "y": 28,
        "scaleX": 1.28,
        "scaleY": 0.78,
        "rotation": -0.12,
        "duration": 9,
        "ease": "power4.out",
        "vfx": "flurry_stab",
        "vfxTarget": "target",
        "shake": 5,
        "hitstop": 28,
        "afterimage": true
      },
      {
        "x": 82,
        "y": 22,
        "scaleX": 1.22,
        "scaleY": 0.82,
        "rotation": -0.1,
        "duration": 10,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 60,
        "y": 14,
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
        "duration": 16,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 17,
        "ease": "elastic.out(1, 0.6)"
      }
    ]
  },
  "player.flurry_stab3": {
    "id": "player.flurry_stab3",
    "name": "세검 3타 - 피니시 돌진 (강화)",
    "target": "player",
    "type": "once",
    "priority": 14,
    "duration": 160,
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
        "x": -18,
        "y": 0,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "rotation": -0.08,
        "duration": 10,
        "ease": "power3.in",
        "afterimage": true,
        "color": "power"
      },
      {
        "x": -28,
        "y": 0,
        "scaleX": 0.72,
        "scaleY": 1.28,
        "rotation": -0.12,
        "duration": 8,
        "ease": "power4.in"
      },
      {
        "x": 110,
        "y": -8,
        "scaleX": 1.4,
        "scaleY": 0.68,
        "rotation": 0.08,
        "duration": 12,
        "ease": "power4.out",
        "vfx": "flurry_finish",
        "vfxTarget": "target",
        "shake": 10,
        "hitstop": 60,
        "afterimage": true,
        "camera": {
          "zoom": 1.12,
          "duration": 120,
          "focusTarget": "enemy"
        },
        "color": "hit",
        "slowmo": {
          "scale": 0.4,
          "duration": 80
        }
      },
      {
        "x": 120,
        "y": -5,
        "scaleX": 1.35,
        "scaleY": 0.72,
        "rotation": 0.06,
        "duration": 12,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 100,
        "y": 0,
        "scaleX": 1.2,
        "scaleY": 0.82,
        "rotation": 0.03,
        "duration": 18,
        "ease": "power2.out"
      },
      {
        "x": 70,
        "y": 3,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": 0.01,
        "duration": 22,
        "ease": "power2.out"
      },
      {
        "x": 40,
        "y": 2,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "rotation": 0,
        "duration": 24,
        "ease": "power2.out"
      },
      {
        "x": 15,
        "y": 1,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0,
        "duration": 20,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 18,
        "ease": "elastic.out(1, 0.6)"
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
  "player.plunder": {
    "id": "player.plunder",
    "name": "강탈 - 등 뒤 습격",
    "target": "player",
    "type": "once",
    "priority": 16,
    "duration": 650,
    "returnToBase": true,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 10,
        "y": 0,
        "scaleX": 1.05,
        "scaleY": 0.95,
        "rotation": 0.05,
        "alpha": 1,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -20,
        "y": 0,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "rotation": -0.1,
        "alpha": 0.8,
        "duration": 40,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": -50,
        "y": 0,
        "scaleX": 0.7,
        "scaleY": 1.3,
        "rotation": -0.2,
        "alpha": 0.4,
        "duration": 35,
        "ease": "power3.in",
        "afterimage": true,
        "vfx": "shadow_fade",
        "vfxTarget": "self"
      },
      {
        "x": 250,
        "y": 0,
        "scaleX": 0.6,
        "scaleY": 1.4,
        "rotation": 0,
        "alpha": 0.3,
        "duration": 40,
        "ease": "power4.out",
        "afterimage": true
      },
      {
        "x": 220,
        "y": 0,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": 0.15,
        "alpha": 1,
        "duration": 25,
        "ease": "power3.out",
        "vfx": "shadow_appear",
        "vfxTarget": "self"
      },
      {
        "x": 180,
        "y": 0,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.2,
        "alpha": 1,
        "duration": 35,
        "ease": "power3.out",
        "vfx": "backstab_stab",
        "shake": 10,
        "hitstop": 80
      },
      {
        "x": 140,
        "y": 0,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": 0.1,
        "alpha": 1,
        "duration": 40,
        "ease": "power2.out",
        "vfx": "plunder_rip"
      },
      {
        "x": 100,
        "y": 0,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": 0.05,
        "alpha": 1,
        "duration": 50,
        "ease": "power2.inOut",
        "afterimage": true
      },
      {
        "x": 50,
        "y": 0,
        "scaleX": 1.05,
        "scaleY": 0.96,
        "rotation": 0.02,
        "alpha": 1,
        "duration": 60,
        "ease": "power2.out"
      },
      {
        "x": 20,
        "y": 0,
        "scaleX": 1.02,
        "scaleY": 0.98,
        "rotation": 0.01,
        "alpha": 1,
        "duration": 55,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 45,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_air1": {
    "id": "player.plunder_air1",
    "name": "강탈 - 공중 베기 1",
    "target": "player",
    "type": "once",
    "priority": 17,
    "duration": 120,
    "keyframes": [
      {
        "x": 150,
        "y": -20,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0.2,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 155,
        "y": -50,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": -0.4,
        "alpha": 1,
        "duration": 30,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 140,
        "y": -35,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": 0.6,
        "alpha": 1,
        "duration": 40,
        "ease": "power3.out",
        "vfx": "air_slash",
        "shake": 6,
        "afterimage": true
      },
      {
        "x": 148,
        "y": -40,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0.3,
        "alpha": 1,
        "duration": 50,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_air2": {
    "id": "player.plunder_air2",
    "name": "강탈 - 공중 회전 베기",
    "target": "player",
    "type": "once",
    "priority": 17,
    "duration": 150,
    "keyframes": [
      {
        "x": 148,
        "y": -40,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0.3,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 160,
        "y": -60,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "rotation": -1.5,
        "alpha": 1,
        "duration": 35,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 135,
        "y": -45,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": 1.5,
        "alpha": 1,
        "duration": 50,
        "ease": "power3.out",
        "vfx": "spin_slash",
        "shake": 8,
        "afterimage": true
      },
      {
        "x": 145,
        "y": -50,
        "scaleX": 1.05,
        "scaleY": 0.97,
        "rotation": 0.8,
        "alpha": 1,
        "duration": 65,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_dash": {
    "id": "player.plunder_dash",
    "name": "강탈 - 돌진",
    "target": "player",
    "type": "once",
    "priority": 16,
    "duration": 180,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 30,
        "y": 5,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "rotation": 0.1,
        "alpha": 1,
        "duration": 40,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 120,
        "y": -10,
        "scaleX": 1.3,
        "scaleY": 0.75,
        "rotation": 0.2,
        "alpha": 1,
        "duration": 60,
        "ease": "power3.out",
        "dashToTarget": "enemy",
        "dashPadding": 30,
        "afterimage": true,
        "vfx": "dash"
      },
      {
        "x": 150,
        "y": 0,
        "scaleX": 1.1,
        "scaleY": 0.95,
        "rotation": 0.1,
        "alpha": 1,
        "duration": 80,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_drain": {
    "id": "player.plunder_drain",
    "name": "강탈 - 생명력 착취 (취약)",
    "target": "player",
    "type": "once",
    "priority": 17,
    "duration": 900,
    "returnToBase": true,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 10,
        "y": 0,
        "scaleX": 1.05,
        "scaleY": 0.95,
        "rotation": 0.05,
        "alpha": 1,
        "duration": 25,
        "ease": "power2.out",
        "color": "shadow"
      },
      {
        "x": -30,
        "y": 0,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.15,
        "alpha": 0.6,
        "duration": 35,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": -70,
        "y": 0,
        "scaleX": 0.6,
        "scaleY": 1.4,
        "rotation": -0.25,
        "alpha": 0.2,
        "duration": 30,
        "ease": "power3.in",
        "afterimage": true,
        "vfx": "shadow_fade",
        "vfxTarget": "self"
      },
      {
        "x": 280,
        "y": 0,
        "scaleX": 0.5,
        "scaleY": 1.5,
        "rotation": 0,
        "alpha": 0.1,
        "duration": 35,
        "ease": "power4.out",
        "afterimage": true
      },
      {
        "x": 240,
        "y": 0,
        "scaleX": 1.3,
        "scaleY": 0.75,
        "rotation": 0.2,
        "alpha": 1,
        "duration": 20,
        "ease": "power3.out",
        "vfx": "shadow_appear",
        "vfxTarget": "self",
        "camera": {
          "zoom": 1.15
        }
      },
      {
        "x": 190,
        "y": 0,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "rotation": -0.25,
        "alpha": 1,
        "duration": 30,
        "ease": "power4.out",
        "vfx": "backstab_stab",
        "shake": 15,
        "hitstop": 120,
        "slowmo": {
          "scale": 0.2,
          "duration": 200
        },
        "color": "critical"
      },
      {
        "x": 190,
        "y": 0,
        "scaleX": 0.7,
        "scaleY": 1.3,
        "rotation": -0.3,
        "alpha": 1,
        "duration": 80,
        "ease": "none",
        "vfx": "drain_stream"
      },
      {
        "x": 190,
        "y": 0,
        "scaleX": 0.65,
        "scaleY": 1.35,
        "rotation": -0.32,
        "alpha": 1,
        "duration": 80,
        "ease": "none"
      },
      {
        "x": 190,
        "y": 0,
        "scaleX": 0.7,
        "scaleY": 1.3,
        "rotation": -0.3,
        "alpha": 1,
        "duration": 60,
        "ease": "none",
        "vfx": "drain_burst"
      },
      {
        "x": 150,
        "y": 0,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": 0.15,
        "alpha": 1,
        "duration": 35,
        "ease": "power3.out",
        "vfx": "plunder_rip",
        "shake": 8,
        "slowmo": "reset"
      },
      {
        "x": 100,
        "y": 0,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": 0.08,
        "alpha": 1,
        "duration": 50,
        "ease": "power2.inOut",
        "afterimage": true,
        "vfx": "energy_absorb",
        "vfxTarget": "self"
      },
      {
        "x": 50,
        "y": 0,
        "scaleX": 1.08,
        "scaleY": 0.94,
        "rotation": 0.03,
        "alpha": 1,
        "duration": 60,
        "ease": "power2.out"
      },
      {
        "x": 20,
        "y": 0,
        "scaleX": 1.03,
        "scaleY": 0.97,
        "rotation": 0.01,
        "alpha": 1,
        "duration": 55,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 45,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_finish": {
    "id": "player.plunder_finish",
    "name": "강탈 - 마무리 (뜯어내기)",
    "target": "player",
    "type": "once",
    "priority": 17,
    "duration": 300,
    "keyframes": [
      {
        "x": 160,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 165,
        "y": -15,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "rotation": -0.25,
        "alpha": 1,
        "duration": 40,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 130,
        "y": 5,
        "scaleX": 1.35,
        "scaleY": 0.7,
        "rotation": 0.3,
        "alpha": 1,
        "duration": 50,
        "ease": "power4.out",
        "vfx": "plunder_rip",
        "shake": 15,
        "hitstop": 100,
        "afterimage": true,
        "camera": {
          "zoom": 1.1
        },
        "color": "critical"
      },
      {
        "x": 100,
        "y": 0,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": 0.15,
        "alpha": 1,
        "duration": 60,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 50,
        "y": 0,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "rotation": 0.05,
        "alpha": 1,
        "duration": 70,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 80,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_slam": {
    "id": "player.plunder_slam",
    "name": "강탈 - 내려찍기 (마무리 강화)",
    "target": "player",
    "type": "once",
    "priority": 18,
    "duration": 350,
    "keyframes": [
      {
        "x": 145,
        "y": -50,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0.8,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 155,
        "y": -80,
        "scaleX": 0.75,
        "scaleY": 1.3,
        "rotation": -0.6,
        "alpha": 1,
        "duration": 45,
        "ease": "power3.in",
        "afterimage": true,
        "color": "power"
      },
      {
        "x": 160,
        "y": -90,
        "scaleX": 0.7,
        "scaleY": 1.35,
        "rotation": -0.7,
        "alpha": 1,
        "duration": 30,
        "ease": "power4.in",
        "vfx": "energy_burst",
        "vfxTarget": "self"
      },
      {
        "x": 140,
        "y": 5,
        "scaleX": 1.5,
        "scaleY": 0.55,
        "rotation": 0.35,
        "alpha": 1,
        "duration": 60,
        "ease": "power4.out",
        "vfx": "gold_explosion",
        "shake": 22,
        "hitstop": 150,
        "afterimage": true,
        "camera": {
          "zoom": 1.2,
          "duration": 200
        },
        "color": "critical",
        "slowmo": {
          "scale": 0.1,
          "duration": 300
        }
      },
      {
        "x": 130,
        "y": 8,
        "scaleX": 1.25,
        "scaleY": 0.8,
        "rotation": 0.15,
        "alpha": 1,
        "duration": 55,
        "ease": "power2.out",
        "vfx": "gold_drain"
      },
      {
        "x": 85,
        "y": 3,
        "scaleX": 1.12,
        "scaleY": 0.9,
        "rotation": 0.06,
        "alpha": 1,
        "duration": 50,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "x": 40,
        "y": 0,
        "scaleX": 1.04,
        "scaleY": 0.97,
        "rotation": 0.02,
        "alpha": 1,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 40,
        "ease": "elastic.out(1, 0.6)"
      }
    ]
  },
  "player.plunder_stab1": {
    "id": "player.plunder_stab1",
    "name": "강탈 - 찌르기 1",
    "target": "player",
    "type": "once",
    "priority": 16,
    "duration": 120,
    "keyframes": [
      {
        "x": 180,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 185,
        "y": -5,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "rotation": -0.15,
        "alpha": 1,
        "duration": 25,
        "ease": "power2.in"
      },
      {
        "x": 160,
        "y": 0,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": 0.1,
        "alpha": 1,
        "duration": 35,
        "ease": "power3.out",
        "vfx": "backstab_stab",
        "shake": 6,
        "afterimage": true
      },
      {
        "x": 175,
        "y": 0,
        "scaleX": 1.05,
        "scaleY": 0.97,
        "rotation": 0.02,
        "alpha": 1,
        "duration": 60,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_stab2": {
    "id": "player.plunder_stab2",
    "name": "강탈 - 찌르기 2",
    "target": "player",
    "type": "once",
    "priority": 16,
    "duration": 120,
    "keyframes": [
      {
        "x": 175,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 180,
        "y": 5,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "rotation": 0.1,
        "alpha": 1,
        "duration": 25,
        "ease": "power2.in"
      },
      {
        "x": 155,
        "y": -3,
        "scaleX": 1.15,
        "scaleY": 0.88,
        "rotation": -0.08,
        "alpha": 1,
        "duration": 35,
        "ease": "power3.out",
        "vfx": "backstab_stab",
        "shake": 7,
        "afterimage": true
      },
      {
        "x": 170,
        "y": 0,
        "scaleX": 1.03,
        "scaleY": 0.98,
        "rotation": 0,
        "alpha": 1,
        "duration": 60,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_stab3": {
    "id": "player.plunder_stab3",
    "name": "강탈 - 찌르기 3",
    "target": "player",
    "type": "once",
    "priority": 16,
    "duration": 120,
    "keyframes": [
      {
        "x": 170,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 175,
        "y": -8,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "rotation": -0.12,
        "alpha": 1,
        "duration": 25,
        "ease": "power2.in"
      },
      {
        "x": 150,
        "y": 3,
        "scaleX": 1.18,
        "scaleY": 0.85,
        "rotation": 0.15,
        "alpha": 1,
        "duration": 35,
        "ease": "power3.out",
        "vfx": "backstab_stab",
        "shake": 8,
        "afterimage": true
      },
      {
        "x": 165,
        "y": 0,
        "scaleX": 1.02,
        "scaleY": 0.99,
        "rotation": 0,
        "alpha": 1,
        "duration": 60,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_stab4": {
    "id": "player.plunder_stab4",
    "name": "강탈 - 찌르기 4",
    "target": "player",
    "type": "once",
    "priority": 16,
    "duration": 120,
    "keyframes": [
      {
        "x": 165,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 170,
        "y": 6,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "rotation": 0.08,
        "alpha": 1,
        "duration": 25,
        "ease": "power2.in"
      },
      {
        "x": 145,
        "y": -5,
        "scaleX": 1.2,
        "scaleY": 0.82,
        "rotation": -0.1,
        "alpha": 1,
        "duration": 35,
        "ease": "power3.out",
        "vfx": "backstab_stab",
        "shake": 9,
        "afterimage": true
      },
      {
        "x": 160,
        "y": 0,
        "scaleX": 1.01,
        "scaleY": 0.99,
        "rotation": 0,
        "alpha": 1,
        "duration": 60,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_teleport": {
    "id": "player.plunder_teleport",
    "name": "강탈 - 뒤로 텔레포트",
    "target": "player",
    "type": "once",
    "priority": 16,
    "duration": 200,
    "keyframes": [
      {
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": -20,
        "y": 0,
        "scaleX": 0.8,
        "scaleY": 1.2,
        "rotation": -0.1,
        "alpha": 0.6,
        "duration": 40,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": -50,
        "y": 0,
        "scaleX": 0.5,
        "scaleY": 1.5,
        "rotation": -0.2,
        "alpha": 0.2,
        "duration": 30,
        "ease": "power3.in",
        "afterimage": true,
        "vfx": "shadow_fade",
        "vfxTarget": "self"
      },
      {
        "x": 220,
        "y": 0,
        "scaleX": 0.4,
        "scaleY": 1.6,
        "rotation": 0,
        "alpha": 0,
        "duration": 20,
        "ease": "power4.out"
      },
      {
        "x": 200,
        "y": 0,
        "scaleX": 1.1,
        "scaleY": 0.9,
        "rotation": 0.1,
        "alpha": 1,
        "duration": 30,
        "ease": "power3.out",
        "vfx": "shadow_appear",
        "vfxTarget": "self",
        "color": "shadow"
      },
      {
        "x": 180,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 80,
        "ease": "power2.out"
      }
    ]
  },
  "player.plunder_uppercut": {
    "id": "player.plunder_uppercut",
    "name": "강탈 - 어퍼컷 (띄우기)",
    "target": "player",
    "type": "once",
    "priority": 17,
    "duration": 200,
    "keyframes": [
      {
        "x": 150,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "alpha": 1,
        "duration": 0
      },
      {
        "x": 155,
        "y": 10,
        "scaleX": 0.8,
        "scaleY": 1.2,
        "rotation": -0.3,
        "alpha": 1,
        "duration": 40,
        "ease": "power2.in"
      },
      {
        "x": 145,
        "y": -40,
        "scaleX": 1.3,
        "scaleY": 0.8,
        "rotation": 0.5,
        "alpha": 1,
        "duration": 60,
        "ease": "power4.out",
        "vfx": "uppercut_slash",
        "shake": 12,
        "hitstop": 80,
        "afterimage": true,
        "color": "hit"
      },
      {
        "x": 150,
        "y": -20,
        "scaleX": 1.1,
        "scaleY": 0.95,
        "rotation": 0.2,
        "alpha": 1,
        "duration": 100,
        "ease": "power2.out"
      }
    ]
  },
  "player.power_tackle": {
    "id": "player.power_tackle",
    "name": "파워 태클 (강화)",
    "target": "player",
    "type": "once",
    "priority": 15,
    "duration": 420,
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
        "x": -15,
        "y": 5,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 1,
        "rotation": -0.08,
        "duration": 25,
        "ease": "power2.in",
        "color": "power",
        "afterimage": true
      },
      {
        "x": -25,
        "y": 8,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "alpha": 1,
        "rotation": -0.12,
        "duration": 20,
        "ease": "power3.in",
        "vfx": "energy_burst",
        "vfxTarget": "self"
      },
      {
        "x": 30,
        "y": -5,
        "scaleX": 1.2,
        "scaleY": 0.82,
        "alpha": 1,
        "rotation": 0.08,
        "duration": 20,
        "ease": "power4.out",
        "afterimage": true,
        "camera": {
          "zoom": 1.25,
          "duration": 300
        }
      },
      {
        "dashToTarget": "enemy",
        "dashPadding": 5,
        "y": -10,
        "scaleX": 1.45,
        "scaleY": 0.65,
        "alpha": 1,
        "rotation": 0.18,
        "duration": 50,
        "ease": "power4.out",
        "afterimage": true,
        "vfx": "speed_lines",
        "vfxTarget": "self"
      },
      {
        "x": 0,
        "y": -5,
        "scaleX": 1.5,
        "scaleY": 0.6,
        "alpha": 1,
        "rotation": 0.22,
        "duration": 40,
        "ease": "power4.out",
        "vfx": "power_impact",
        "vfxTarget": "target",
        "shake": 20,
        "hitstop": 100,
        "afterimage": true,
        "slowmo": {
          "scale": 0.12,
          "duration": 450
        },
        "color": "critical",
        "colorDuration": 180
      },
      {
        "x": -15,
        "y": 0,
        "scaleX": 1.25,
        "scaleY": 0.8,
        "alpha": 1,
        "rotation": 0.12,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": -30,
        "y": 3,
        "scaleX": 1.1,
        "scaleY": 0.92,
        "alpha": 1,
        "rotation": 0.05,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": -40,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 45,
        "ease": "elastic.out(1, 0.6)"
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
        "vfxTarget": "self",
        "camera": {
          "zoom": 1.35,
          "duration": 200
        },
        "color": "power"
      },
      {
        "x": 80,
        "y": -20,
        "scaleX": 1.5,
        "scaleY": 0.6,
        "rotation": 0.1,
        "duration": 20,
        "ease": "power4.out",
        "afterimage": true
      },
      {
        "dashToTarget": "enemy",
        "dashPadding": 0,
        "y": -12,
        "scaleX": 1.6,
        "scaleY": 0.55,
        "rotation": 0.15,
        "duration": 25,
        "ease": "power4.out",
        "afterimage": true,
        "vfx": "speed_lines_intense",
        "vfxTarget": "self"
      },
      {
        "x": 0,
        "y": -5,
        "scaleX": 1.55,
        "scaleY": 0.58,
        "rotation": 0.18,
        "duration": 15,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 5,
        "y": 0,
        "scaleX": 1.4,
        "scaleY": 0.7,
        "rotation": 0.12,
        "duration": 12,
        "ease": "power4.out",
        "vfx": "power_impact_plus",
        "shake": 22,
        "hitstop": 100,
        "slowmo": {
          "scale": 0.1,
          "duration": 400
        },
        "color": "hit"
      },
      {
        "x": -5,
        "y": 8,
        "scaleX": 1.2,
        "scaleY": 0.85,
        "rotation": 0.07,
        "duration": 25,
        "ease": "power2.out",
        "slowmo": {
          "scale": 1,
          "duration": 300
        }
      },
      {
        "x": -15,
        "y": 10,
        "scaleX": 1.08,
        "scaleY": 0.94,
        "rotation": 0.04,
        "duration": 30,
        "ease": "power2.out"
      },
      {
        "x": -25,
        "y": 6,
        "scaleX": 1.03,
        "scaleY": 0.98,
        "rotation": 0.02,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": -35,
        "y": 3,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": -40,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 45,
        "ease": "power2.out"
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

// VFX 데이터 (60개)
window.VFX_BUNDLE = {
  "air_slash": {
    "id": "air_slash",
    "name": "공중 베기",
    "particles": [
      {
        "type": "slash",
        "angle": 30,
        "length": 70,
        "width": 8,
        "color": "#60a5fa",
        "glow": "#3b82f6",
        "life": 120
      },
      {
        "type": "spark",
        "count": 8,
        "spread": 40,
        "speed": [
          8,
          18
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff"
        ],
        "life": [
          120,
          220
        ]
      }
    ]
  },
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
  "backstab_stab": {
    "id": "backstab_stab",
    "name": "등 찌르기",
    "particles": [
      {
        "type": "line",
        "count": 1,
        "angle": 180,
        "length": 70,
        "width": 6,
        "color": "#ffffff",
        "glow": "#94a3b8",
        "life": 80
      },
      {
        "type": "flash",
        "size": 40,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "line",
        "count": 4,
        "angleStep": 30,
        "offsetAngle": 165,
        "length": [
          20,
          35
        ],
        "width": 2,
        "color": "#ef4444",
        "life": 100
      },
      {
        "type": "spark",
        "count": 8,
        "spread": 40,
        "offsetAngle": 180,
        "speed": [
          10,
          20
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#dc2626",
          "#ef4444",
          "#991b1b"
        ],
        "life": [
          120,
          200
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
        "type": "debris",
        "count": 12,
        "speed": [
          6,
          18
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#dc2626",
          "#b91c1c",
          "#991b1b",
          "#7f1d1d"
        ],
        "gravity": 0.5,
        "life": [
          200,
          400
        ],
        "spread": 120
      },
      {
        "type": "spark",
        "count": 8,
        "spread": 80,
        "speed": [
          4,
          12
        ],
        "size": [
          3,
          5
        ],
        "colors": [
          "#ef4444",
          "#dc2626"
        ],
        "life": [
          100,
          200
        ]
      }
    ]
  },
  "critical": {
    "id": "critical",
    "name": "치명타 이펙트",
    "shake": 15,
    "particles": [
      {
        "type": "flash",
        "size": 120,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "flash",
        "size": 80,
        "color": "#fbbf24",
        "life": 70
      },
      {
        "type": "flash",
        "size": 50,
        "color": "#ef4444",
        "life": 100
      },
      {
        "type": "ring",
        "size": 30,
        "maxSize": 150,
        "color": "#ffffff",
        "life": 100
      },
      {
        "type": "ring",
        "size": 50,
        "maxSize": 120,
        "color": "#fbbf24",
        "life": 150
      },
      {
        "type": "slash",
        "count": 4,
        "angle": [
          -90,
          -30,
          30,
          90
        ],
        "length": [
          100,
          150
        ],
        "width": 12,
        "color": "#ffffff",
        "glow": "#fbbf24",
        "life": 150
      },
      {
        "type": "arrow",
        "length": 100,
        "width": 70,
        "tipAngle": 30,
        "color": "#fbbf24",
        "glow": "#ef4444",
        "life": 120
      },
      {
        "type": "spark",
        "count": 35,
        "spread": 100,
        "speed": [
          15,
          35
        ],
        "size": [
          4,
          10
        ],
        "colors": [
          "#fbbf24",
          "#f59e0b",
          "#ffffff",
          "#ef4444"
        ],
        "life": [
          200,
          450
        ]
      },
      {
        "type": "debris",
        "count": 20,
        "speed": [
          12,
          25
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#fbbf24",
          "#ef4444",
          "#ffffff"
        ],
        "gravity": 0.35,
        "life": [
          300,
          600
        ]
      },
      {
        "type": "line",
        "count": 16,
        "angleStep": 22.5,
        "length": [
          60,
          120
        ],
        "width": 4,
        "color": "#fbbf24",
        "life": 150
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
  "dagger_impact": {
    "id": "dagger_impact",
    "name": "단검 적중 - 관통 임팩트",
    "shake": 12,
    "particles": [
      {
        "type": "flash",
        "size": 100,
        "color": "#ffffff",
        "life": 50
      },
      {
        "type": "flash",
        "size": 60,
        "color": "#60a5fa",
        "life": 80
      },
      {
        "type": "ring",
        "size": 20,
        "maxSize": 120,
        "color": "#ffffff",
        "life": 100
      },
      {
        "type": "ring",
        "size": 30,
        "maxSize": 80,
        "color": "#ef4444",
        "life": 150
      },
      {
        "type": "slash",
        "count": 3,
        "angle": [
          -45,
          0,
          45
        ],
        "length": [
          60,
          90
        ],
        "width": 8,
        "color": "#ffffff",
        "glow": "#60a5fa",
        "life": 100
      },
      {
        "type": "arrow",
        "length": 80,
        "width": 50,
        "tipAngle": 25,
        "color": "#93c5fd",
        "glow": "#60a5fa",
        "life": 120
      },
      {
        "type": "spark",
        "count": 25,
        "spread": 80,
        "speed": [
          12,
          28
        ],
        "size": [
          3,
          8
        ],
        "colors": [
          "#ef4444",
          "#dc2626",
          "#ffffff",
          "#60a5fa",
          "#c0c0c0"
        ],
        "life": [
          180,
          350
        ]
      },
      {
        "type": "debris",
        "count": 15,
        "speed": [
          8,
          20
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#ef4444",
          "#dc2626",
          "#7f1d1d",
          "#c0c0c0"
        ],
        "gravity": 0.5,
        "life": [
          250,
          500
        ]
      },
      {
        "type": "line",
        "count": 12,
        "angleStep": 30,
        "length": [
          50,
          90
        ],
        "width": 4,
        "color": "#fbbf24",
        "life": 120
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
  "dagger_throw": {
    "id": "dagger_throw",
    "name": "단검 투척 - 섬광의 칼날",
    "shake": 4,
    "particles": [
      {
        "type": "projectile",
        "shape": "dagger",
        "speed": 45,
        "rotation": 1800,
        "size": 35,
        "color": "#c0c0c0",
        "glow": "#60a5fa",
        "glowIntensity": 2,
        "trail": true,
        "trailLength": 12,
        "trailColor": "#93c5fd",
        "onHitVFX": "dagger_impact",
        "life": 500
      },
      {
        "type": "flash",
        "size": 50,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "ring",
        "size": 10,
        "maxSize": 60,
        "color": "#60a5fa",
        "life": 120
      },
      {
        "type": "line",
        "count": 6,
        "angleStep": 60,
        "length": [
          40,
          70
        ],
        "width": 3,
        "color": "#93c5fd",
        "life": 100
      },
      {
        "type": "spark",
        "count": 12,
        "spread": 40,
        "speed": [
          8,
          18
        ],
        "size": [
          2,
          5
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff",
          "#c0c0c0"
        ],
        "life": [
          120,
          200
        ]
      },
      {
        "type": "debris",
        "count": 4,
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
          "#c0c0c0"
        ],
        "gravity": 0.2,
        "life": [
          80,
          150
        ]
      }
    ]
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
  "drain_burst": {
    "id": "drain_burst",
    "name": "착취 완료 폭발",
    "shake": 6,
    "particles": [
      {
        "type": "flash",
        "size": 80,
        "color": "#dc2626",
        "life": 50
      },
      {
        "type": "ring",
        "size": 20,
        "maxSize": 100,
        "color": "#991b1b",
        "life": 150
      },
      {
        "type": "line",
        "count": 12,
        "angleStep": 30,
        "length": [
          30,
          60
        ],
        "width": 3,
        "color": "#ef4444",
        "life": 120
      },
      {
        "type": "spark",
        "count": 25,
        "spread": 360,
        "speed": [
          10,
          25
        ],
        "size": [
          4,
          9
        ],
        "colors": [
          "#dc2626",
          "#b91c1c",
          "#991b1b"
        ],
        "life": [
          180,
          320
        ]
      },
      {
        "type": "debris",
        "count": 18,
        "speed": [
          8,
          20
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#7f1d1d",
          "#450a0a",
          "#1c1917"
        ],
        "gravity": 0.35,
        "life": [
          200,
          380
        ]
      }
    ]
  },
  "drain_stream": {
    "id": "drain_stream",
    "name": "생명력 착취 흐름",
    "particles": [
      {
        "type": "line",
        "count": 6,
        "angleStep": 15,
        "offsetAngle": 160,
        "length": [
          40,
          80
        ],
        "width": 3,
        "color": "#dc2626",
        "glow": "#991b1b",
        "life": 200,
        "delay": 30
      },
      {
        "type": "spark",
        "count": 20,
        "spread": 50,
        "offsetAngle": 180,
        "speed": [
          5,
          12
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#dc2626",
          "#ef4444",
          "#f87171"
        ],
        "life": [
          200,
          350
        ],
        "moveToward": true
      },
      {
        "type": "ring",
        "size": 15,
        "maxSize": 50,
        "color": "#7f1d1d",
        "life": 180
      }
    ]
  },
  "energy_absorb": {
    "id": "energy_absorb",
    "name": "에너지 흡수 완료",
    "particles": [
      {
        "type": "ring",
        "size": 60,
        "maxSize": 10,
        "color": "#22c55e",
        "life": 200
      },
      {
        "type": "flash",
        "size": 50,
        "color": "#4ade80",
        "life": 80
      },
      {
        "type": "spark",
        "count": 15,
        "spread": 360,
        "speed": [
          -8,
          -15
        ],
        "size": [
          4,
          7
        ],
        "colors": [
          "#22c55e",
          "#16a34a",
          "#4ade80"
        ],
        "life": [
          150,
          250
        ],
        "converge": true
      },
      {
        "type": "line",
        "count": 8,
        "angleStep": 45,
        "length": [
          15,
          30
        ],
        "width": 2,
        "color": "#86efac",
        "life": 100
      }
    ]
  },
  "energy_burst": {
    "id": "energy_burst",
    "name": "에너지 버스트",
    "shake": 8,
    "particles": [
      {
        "type": "flash",
        "size": 80,
        "color": "#60a5fa",
        "life": 50
      },
      {
        "type": "energy_orb",
        "size": 50,
        "color": "#3b82f6",
        "life": 150
      },
      {
        "type": "ring",
        "size": 20,
        "maxSize": 100,
        "color": "#93c5fd",
        "life": 120
      },
      {
        "type": "electric",
        "count": 12,
        "length": [
          25,
          50
        ],
        "width": 2,
        "segments": 5,
        "angleStep": 30,
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff"
        ],
        "life": [
          80,
          150
        ]
      },
      {
        "type": "star",
        "count": 6,
        "size": [
          12,
          20
        ],
        "points": 4,
        "colors": [
          "#60a5fa",
          "#93c5fd"
        ],
        "rotationSpeed": [
          0.08,
          0.15
        ],
        "spread": 40,
        "life": [
          120,
          200
        ]
      },
      {
        "type": "spark",
        "count": 25,
        "spread": 70,
        "speed": [
          10,
          25
        ],
        "size": [
          3,
          7
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff"
        ],
        "life": [
          150,
          300
        ]
      }
    ]
  },
  "energy_drain": {
    "id": "energy_drain",
    "name": "에너지 흡수 - 생명력 착취",
    "particles": [
      {
        "type": "ring",
        "size": 40,
        "maxSize": 100,
        "color": "#7f1d1d",
        "life": 220
      },
      {
        "type": "spark",
        "count": 25,
        "spread": 60,
        "speed": [
          5,
          14
        ],
        "size": [
          3,
          8
        ],
        "colors": [
          "#dc2626",
          "#b91c1c",
          "#991b1b",
          "#450a0a"
        ],
        "life": [
          200,
          400
        ]
      },
      {
        "type": "smoke",
        "count": 12,
        "spread": 50,
        "size": [
          20,
          40
        ],
        "speed": [
          3,
          8
        ],
        "angle": {
          "min": -60,
          "max": -120
        },
        "color": "#7f1d1d",
        "gravity": -0.15,
        "life": [
          250,
          500
        ]
      },
      {
        "type": "debris",
        "count": 15,
        "speed": [
          4,
          12
        ],
        "size": [
          2,
          5
        ],
        "colors": [
          "#991b1b",
          "#450a0a",
          "#1f2937"
        ],
        "gravity": 0.3,
        "life": [
          200,
          380
        ]
      }
    ]
  },
  "flurry_finish": {
    "id": "flurry_finish",
    "name": "연속 찌르기 피니시 이펙트",
    "shake": 10,
    "particles": [
      {
        "type": "flash",
        "size": 80,
        "color": "#ffffff",
        "life": 50
      },
      {
        "type": "flash",
        "size": 60,
        "color": "#60a5fa",
        "life": 80
      },
      {
        "type": "ring",
        "size": 25,
        "maxSize": 120,
        "color": "#ffffff",
        "life": 100
      },
      {
        "type": "ring",
        "size": 40,
        "maxSize": 90,
        "color": "#60a5fa",
        "life": 140
      },
      {
        "type": "arrow",
        "length": 120,
        "width": 80,
        "tipAngle": 25,
        "color": "#93c5fd",
        "glow": "#60a5fa",
        "life": 150
      },
      {
        "type": "slash",
        "count": 5,
        "angle": [
          -80,
          -40,
          0,
          40,
          80
        ],
        "length": [
          70,
          120
        ],
        "width": 8,
        "color": "#ffffff",
        "glow": "#60a5fa",
        "life": 120
      },
      {
        "type": "spark",
        "count": 30,
        "spread": 80,
        "speed": [
          12,
          28
        ],
        "size": [
          3,
          8
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff",
          "#3b82f6"
        ],
        "life": [
          180,
          380
        ]
      },
      {
        "type": "debris",
        "count": 15,
        "speed": [
          10,
          22
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff"
        ],
        "gravity": 0.35,
        "life": [
          280,
          500
        ]
      },
      {
        "type": "line",
        "count": 12,
        "angleStep": 30,
        "length": [
          50,
          100
        ],
        "width": 3,
        "color": "#93c5fd",
        "life": 140
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
    "name": "연속 찌르기 이펙트",
    "shake": 4,
    "particles": [
      {
        "type": "flash",
        "size": 40,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "arrow",
        "length": 70,
        "width": 45,
        "tipAngle": 25,
        "color": "#93c5fd",
        "glow": "#60a5fa",
        "life": 100
      },
      {
        "type": "slash",
        "count": 1,
        "angle": [
          0
        ],
        "length": [
          60,
          90
        ],
        "width": 6,
        "color": "#ffffff",
        "glow": "#60a5fa",
        "life": 80
      },
      {
        "type": "spark",
        "count": 10,
        "spread": 30,
        "speed": [
          6,
          14
        ],
        "size": [
          2,
          5
        ],
        "colors": [
          "#60a5fa",
          "#93c5fd",
          "#ffffff"
        ],
        "life": [
          100,
          180
        ]
      },
      {
        "type": "line",
        "count": 4,
        "angleStep": 90,
        "length": [
          25,
          45
        ],
        "width": 2,
        "color": "#93c5fd",
        "life": 80
      }
    ]
  },
  "gold_burst": {
    "id": "gold_burst",
    "name": "강탈 피격 - 피의 약탈",
    "shake": 6,
    "particles": [
      {
        "type": "flash",
        "size": 55,
        "color": "#fecaca",
        "life": 45
      },
      {
        "type": "spark",
        "count": 25,
        "spread": 65,
        "speed": [
          7,
          20
        ],
        "size": [
          3,
          8
        ],
        "colors": [
          "#dc2626",
          "#b91c1c",
          "#991b1b",
          "#7f1d1d",
          "#450a0a"
        ],
        "life": [
          150,
          320
        ]
      },
      {
        "type": "debris",
        "count": 18,
        "speed": [
          5,
          16
        ],
        "size": [
          2,
          7
        ],
        "colors": [
          "#991b1b",
          "#7f1d1d",
          "#450a0a",
          "#1f2937"
        ],
        "gravity": 0.4,
        "life": [
          200,
          400
        ]
      },
      {
        "type": "ring",
        "size": 15,
        "maxSize": 75,
        "color": "#dc2626",
        "life": 160
      }
    ]
  },
  "gold_drain": {
    "id": "gold_drain",
    "name": "골드 흡수",
    "particles": [
      {
        "type": "spark",
        "count": 20,
        "spread": 60,
        "offsetAngle": 180,
        "speed": [
          -8,
          -15
        ],
        "size": [
          5,
          10
        ],
        "colors": [
          "#fbbf24",
          "#fde68a",
          "#fef3c7"
        ],
        "life": [
          300,
          500
        ],
        "converge": true
      },
      {
        "type": "ring",
        "size": 50,
        "maxSize": 10,
        "color": "#f59e0b",
        "life": 250
      },
      {
        "type": "flash",
        "size": 40,
        "color": "#fef3c7",
        "life": 80,
        "delay": 200
      }
    ]
  },
  "gold_explosion": {
    "id": "gold_explosion",
    "name": "골드 폭발 (강탈용)",
    "shake": 12,
    "particles": [
      {
        "type": "flash",
        "size": 90,
        "color": "#fbbf24",
        "life": 60
      },
      {
        "type": "flash",
        "size": 60,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "ring",
        "size": 25,
        "maxSize": 130,
        "color": "#fbbf24",
        "life": 140
      },
      {
        "type": "energy_orb",
        "count": 5,
        "size": [
          20,
          35
        ],
        "colors": [
          "#fbbf24",
          "#f59e0b",
          "#eab308"
        ],
        "spread": 40,
        "life": [
          180,
          280
        ]
      },
      {
        "type": "star",
        "count": 10,
        "size": [
          10,
          18
        ],
        "points": [
          4,
          6
        ],
        "colors": [
          "#fbbf24",
          "#f59e0b",
          "#ffffff"
        ],
        "rotationSpeed": [
          0.06,
          0.12
        ],
        "spread": 60,
        "life": [
          140,
          260
        ]
      },
      {
        "type": "comet",
        "count": 12,
        "size": [
          5,
          10
        ],
        "tailLength": [
          25,
          45
        ],
        "speed": [
          10,
          22
        ],
        "colors": [
          "#fbbf24",
          "#f59e0b"
        ],
        "life": [
          200,
          380
        ]
      },
      {
        "type": "spark",
        "count": 35,
        "spread": 90,
        "speed": [
          12,
          28
        ],
        "size": [
          4,
          9
        ],
        "colors": [
          "#fbbf24",
          "#f59e0b",
          "#ffffff",
          "#eab308"
        ],
        "life": [
          180,
          380
        ]
      },
      {
        "type": "debris",
        "count": 20,
        "speed": [
          10,
          25
        ],
        "size": [
          3,
          7
        ],
        "colors": [
          "#fbbf24",
          "#b45309",
          "#ffffff"
        ],
        "gravity": 0.35,
        "life": [
          280,
          500
        ]
      }
    ]
  },
  "gold_orbs_rise": {
    "id": "gold_orbs_rise",
    "name": "골드 구슬 상승",
    "particles": [
      {
        "type": "spark",
        "count": 15,
        "spread": 80,
        "speed": [
          3,
          8
        ],
        "size": [
          8,
          15
        ],
        "colors": [
          "#fbbf24",
          "#fde68a",
          "#fef3c7"
        ],
        "life": [
          400,
          700
        ],
        "gravity": -0.15
      },
      {
        "type": "spark",
        "count": 8,
        "spread": 50,
        "speed": [
          2,
          5
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#f59e0b",
          "#fbbf24"
        ],
        "life": [
          300,
          500
        ],
        "gravity": -0.2
      },
      {
        "type": "line",
        "count": 6,
        "angleStep": 60,
        "offsetAngle": -90,
        "length": [
          20,
          40
        ],
        "width": 2,
        "color": "#fde68a",
        "life": 200
      }
    ]
  },
  "ground_impact": {
    "id": "ground_impact",
    "name": "지면 충격",
    "shake": 10,
    "particles": [
      {
        "type": "flash",
        "size": 80,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "ring",
        "size": 20,
        "maxSize": 100,
        "color": "#78716c",
        "life": 180
      },
      {
        "type": "debris",
        "count": 15,
        "speed": [
          8,
          20
        ],
        "size": [
          3,
          7
        ],
        "colors": [
          "#78716c",
          "#57534e",
          "#a8a29e"
        ],
        "gravity": 0.4,
        "life": [
          200,
          400
        ]
      },
      {
        "type": "smoke",
        "count": 6,
        "spread": 60,
        "size": [
          15,
          30
        ],
        "speed": [
          2,
          6
        ],
        "color": "#78716c",
        "life": [
          200,
          400
        ]
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
    "name": "강화된 타격 이펙트",
    "shake": 8,
    "particles": [
      {
        "type": "flash",
        "size": 80,
        "color": "#ffffff",
        "life": 50
      },
      {
        "type": "flash",
        "size": 50,
        "color": "#ef4444",
        "life": 80
      },
      {
        "type": "ring",
        "size": 20,
        "maxSize": 100,
        "color": "#ffffff",
        "life": 120
      },
      {
        "type": "ring",
        "size": 30,
        "maxSize": 70,
        "color": "#ef4444",
        "life": 150
      },
      {
        "type": "slash",
        "count": 3,
        "angle": [
          -60,
          0,
          60
        ],
        "length": [
          50,
          80
        ],
        "width": 8,
        "color": "#ffffff",
        "glow": "#ef4444",
        "life": 100
      },
      {
        "type": "spark",
        "count": 20,
        "spread": 70,
        "speed": [
          10,
          25
        ],
        "size": [
          3,
          8
        ],
        "colors": [
          "#ef4444",
          "#f87171",
          "#ffffff",
          "#fbbf24"
        ],
        "life": [
          180,
          350
        ]
      },
      {
        "type": "debris",
        "count": 12,
        "speed": [
          8,
          18
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#ef4444",
          "#991b1b",
          "#ffffff"
        ],
        "gravity": 0.4,
        "life": [
          250,
          450
        ]
      },
      {
        "type": "line",
        "count": 10,
        "angleStep": 36,
        "length": [
          40,
          80
        ],
        "width": 3,
        "color": "#fbbf24",
        "life": 120
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
  "launch_wind": {
    "id": "launch_wind",
    "name": "띄우기 바람",
    "particles": [
      {
        "type": "line",
        "count": 8,
        "angleStep": 20,
        "offsetAngle": -90,
        "length": [
          30,
          60
        ],
        "width": 2,
        "color": "#94a3b8",
        "life": 150
      },
      {
        "type": "spark",
        "count": 10,
        "spread": 40,
        "offsetAngle": -90,
        "speed": [
          5,
          15
        ],
        "size": [
          3,
          5
        ],
        "colors": [
          "#cbd5e1",
          "#e2e8f0",
          "#ffffff"
        ],
        "life": [
          120,
          220
        ]
      }
    ]
  },
  "plunder_critical": {
    "id": "plunder_critical",
    "name": "강탈 크리티컬 - 학살",
    "shake": 25,
    "particles": [
      {
        "type": "slash",
        "count": 6,
        "angle": [
          -70,
          -45,
          -15,
          15,
          45,
          70
        ],
        "length": [
          120,
          180
        ],
        "width": 16,
        "color": "#dc2626",
        "glow": "#450a0a",
        "life": 220
      },
      {
        "type": "flash",
        "size": 120,
        "color": "#ffffff",
        "life": 80
      },
      {
        "type": "ring",
        "size": 30,
        "maxSize": 160,
        "color": "#7f1d1d",
        "life": 200
      },
      {
        "type": "arrow",
        "count": 3,
        "length": [
          80,
          120
        ],
        "width": 70,
        "tipAngle": 35,
        "color": "#ef4444",
        "glow": "#991b1b",
        "innerColor": "rgba(185, 28, 28, 0.5)",
        "life": 150
      },
      {
        "type": "spark",
        "count": 50,
        "spread": 100,
        "speed": [
          12,
          35
        ],
        "size": [
          4,
          12
        ],
        "colors": [
          "#dc2626",
          "#ef4444",
          "#b91c1c",
          "#991b1b",
          "#7f1d1d",
          "#ffffff"
        ],
        "life": [
          200,
          500
        ]
      },
      {
        "type": "debris",
        "count": 40,
        "speed": [
          10,
          30
        ],
        "size": [
          3,
          10
        ],
        "colors": [
          "#991b1b",
          "#7f1d1d",
          "#450a0a",
          "#1f2937",
          "#0f172a"
        ],
        "gravity": 0.5,
        "life": [
          250,
          600
        ]
      },
      {
        "type": "line",
        "count": 16,
        "angleStep": 22.5,
        "length": [
          60,
          110
        ],
        "width": 5,
        "color": "#dc2626",
        "life": 200
      },
      {
        "type": "smoke",
        "count": 15,
        "spread": 60,
        "size": [
          25,
          50
        ],
        "speed": [
          3,
          8
        ],
        "angle": {
          "min": -180,
          "max": 180
        },
        "color": "#450a0a",
        "gravity": -0.1,
        "life": [
          300,
          600
        ]
      }
    ]
  },
  "plunder_rip": {
    "id": "plunder_rip",
    "name": "강탈 - 뜯어내기",
    "particles": [
      {
        "type": "slash",
        "angle": 45,
        "length": 80,
        "width": 8,
        "color": "#f97316",
        "glow": "#ea580c",
        "life": 100
      },
      {
        "type": "slash",
        "angle": -30,
        "length": 70,
        "width": 6,
        "color": "#fb923c",
        "glow": "#f97316",
        "life": 110,
        "delay": 20
      },
      {
        "type": "debris",
        "count": 15,
        "speed": [
          12,
          28
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#dc2626",
          "#991b1b",
          "#7f1d1d",
          "#450a0a"
        ],
        "gravity": 0.4,
        "life": [
          250,
          400
        ],
        "offsetAngle": 0,
        "spread": 90
      },
      {
        "type": "spark",
        "count": 12,
        "spread": 70,
        "speed": [
          8,
          22
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#fbbf24",
          "#f97316",
          "#dc2626"
        ],
        "life": [
          150,
          280
        ]
      }
    ]
  },
  "plunder_slash": {
    "id": "plunder_slash",
    "name": "강탈 베기 - 난도질",
    "shake": 12,
    "particles": [
      {
        "type": "slash",
        "count": 4,
        "angle": [
          -50,
          -20,
          20,
          50
        ],
        "length": [
          80,
          130
        ],
        "width": 12,
        "color": "#dc2626",
        "glow": "#7f1d1d",
        "life": 180
      },
      {
        "type": "arrow",
        "count": 2,
        "length": [
          60,
          90
        ],
        "width": 50,
        "tipAngle": 40,
        "color": "#ef4444",
        "glow": "#dc2626",
        "innerColor": "rgba(220, 38, 38, 0.4)",
        "life": 120
      },
      {
        "type": "ring",
        "size": 25,
        "maxSize": 100,
        "color": "#b91c1c",
        "life": 150
      },
      {
        "type": "spark",
        "count": 30,
        "spread": 70,
        "speed": [
          8,
          22
        ],
        "size": [
          3,
          9
        ],
        "colors": [
          "#dc2626",
          "#ef4444",
          "#b91c1c",
          "#991b1b",
          "#ffffff"
        ],
        "life": [
          150,
          320
        ]
      },
      {
        "type": "debris",
        "count": 20,
        "speed": [
          6,
          18
        ],
        "size": [
          2,
          7
        ],
        "colors": [
          "#991b1b",
          "#7f1d1d",
          "#450a0a",
          "#1f2937"
        ],
        "gravity": 0.45,
        "life": [
          200,
          400
        ]
      }
    ]
  },
  "plunder_stab": {
    "id": "plunder_stab",
    "name": "강탈 찌르기 - 급습",
    "shake": 8,
    "particles": [
      {
        "type": "thrust",
        "count": 1,
        "angle": 0,
        "length": [
          80,
          120
        ],
        "width": 12,
        "color": "#ffffff",
        "glow": "#dc2626",
        "life": 100
      },
      {
        "type": "flash",
        "size": 70,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "ring",
        "size": 10,
        "maxSize": 60,
        "color": "#fecaca",
        "life": 100
      },
      {
        "type": "spark",
        "count": 20,
        "spread": 40,
        "speed": [
          10,
          25
        ],
        "size": [
          2,
          6
        ],
        "colors": [
          "#ffffff",
          "#fecaca",
          "#dc2626"
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
          40,
          70
        ],
        "width": 3,
        "color": "#ffffff",
        "life": 80
      }
    ]
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
    "name": "파워 임팩트 이펙트",
    "shake": 15,
    "particles": [
      {
        "type": "flash",
        "size": 100,
        "color": "#ffffff",
        "life": 40
      },
      {
        "type": "flash",
        "size": 70,
        "color": "#ef4444",
        "life": 80
      },
      {
        "type": "ring",
        "size": 30,
        "maxSize": 150,
        "color": "#ffffff",
        "life": 120
      },
      {
        "type": "wave",
        "count": 3,
        "startSize": 30,
        "maxSize": 120,
        "thickness": 10,
        "startAngle": [
          -120,
          -90,
          -60
        ],
        "endAngle": [
          60,
          90,
          120
        ],
        "colors": [
          "#ef4444",
          "#fbbf24",
          "#ffffff"
        ],
        "life": 150
      },
      {
        "type": "energy_orb",
        "size": 40,
        "color": "#ef4444",
        "life": 100
      },
      {
        "type": "star",
        "count": 5,
        "size": [
          15,
          25
        ],
        "points": 4,
        "colors": [
          "#fbbf24",
          "#ef4444",
          "#ffffff"
        ],
        "rotationSpeed": [
          0.05,
          0.1
        ],
        "spread": 50,
        "life": [
          150,
          250
        ]
      },
      {
        "type": "spark",
        "count": 40,
        "spread": 100,
        "speed": [
          15,
          35
        ],
        "size": [
          4,
          10
        ],
        "colors": [
          "#ef4444",
          "#fbbf24",
          "#ffffff"
        ],
        "life": [
          200,
          400
        ]
      },
      {
        "type": "electric",
        "count": 8,
        "length": [
          30,
          60
        ],
        "width": 3,
        "segments": 6,
        "angleStep": 45,
        "colors": [
          "#fbbf24",
          "#ffffff"
        ],
        "life": [
          100,
          180
        ]
      },
      {
        "type": "comet",
        "count": 8,
        "size": [
          6,
          12
        ],
        "tailLength": [
          30,
          50
        ],
        "speed": [
          12,
          25
        ],
        "colors": [
          "#ef4444",
          "#fbbf24"
        ],
        "life": [
          200,
          350
        ]
      },
      {
        "type": "debris",
        "count": 25,
        "speed": [
          12,
          30
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#ef4444",
          "#991b1b",
          "#ffffff"
        ],
        "gravity": 0.4,
        "life": [
          300,
          550
        ]
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
  "slam_impact": {
    "id": "slam_impact",
    "name": "내려찍기 충격",
    "shake": 15,
    "particles": [
      {
        "type": "flash",
        "size": 120,
        "color": "#fbbf24",
        "life": 60
      },
      {
        "type": "ring",
        "size": 30,
        "maxSize": 150,
        "color": "#f59e0b",
        "life": 200
      },
      {
        "type": "line",
        "count": 12,
        "angleStep": 30,
        "length": [
          40,
          80
        ],
        "width": 4,
        "color": "#fde68a",
        "life": 150
      },
      {
        "type": "debris",
        "count": 20,
        "speed": [
          10,
          25
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#78716c",
          "#57534e",
          "#44403c"
        ],
        "gravity": 0.5,
        "life": [
          250,
          450
        ]
      },
      {
        "type": "spark",
        "count": 25,
        "spread": 360,
        "speed": [
          12,
          30
        ],
        "size": [
          4,
          9
        ],
        "colors": [
          "#fbbf24",
          "#f59e0b",
          "#fde68a"
        ],
        "life": [
          180,
          350
        ]
      }
    ]
  },
  "slash": {
    "id": "slash",
    "name": "강화된 슬래시",
    "shake": 5,
    "particles": [
      {
        "type": "flash",
        "size": 50,
        "color": "#ffffff",
        "life": 60
      },
      {
        "type": "slash",
        "count": 2,
        "angle": [
          -15,
          15
        ],
        "length": [
          80,
          120
        ],
        "width": 10,
        "color": "#ffffff",
        "glow": "#60a5fa",
        "life": 120
      },
      {
        "type": "ring",
        "size": 15,
        "maxSize": 70,
        "color": "#93c5fd",
        "life": 100
      },
      {
        "type": "spark",
        "count": 15,
        "spread": 50,
        "speed": [
          8,
          18
        ],
        "size": [
          3,
          7
        ],
        "colors": [
          "#ffffff",
          "#93c5fd",
          "#60a5fa"
        ],
        "life": [
          150,
          280
        ]
      },
      {
        "type": "line",
        "count": 8,
        "angleStep": 45,
        "length": [
          30,
          60
        ],
        "width": 2,
        "color": "#93c5fd",
        "life": 100
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
  "spin_slash": {
    "id": "spin_slash",
    "name": "회전 베기",
    "particles": [
      {
        "type": "ring",
        "size": 20,
        "maxSize": 80,
        "color": "#a855f7",
        "life": 180
      },
      {
        "type": "slash",
        "count": 3,
        "delay": 20,
        "angle": [
          -30,
          30
        ],
        "length": [
          50,
          70
        ],
        "width": 6,
        "color": "#c084fc",
        "glow": "#a855f7",
        "life": 140
      },
      {
        "type": "spark",
        "count": 15,
        "spread": 360,
        "speed": [
          8,
          20
        ],
        "size": [
          3,
          6
        ],
        "colors": [
          "#a855f7",
          "#c084fc",
          "#e9d5ff"
        ],
        "life": [
          150,
          280
        ]
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
    "name": "투척 모션",
    "particles": [
      {
        "type": "flash",
        "size": 30,
        "color": "#e0e7ff",
        "life": 40
      },
      {
        "type": "ring",
        "size": 10,
        "maxSize": 35,
        "color": "#94a3b8",
        "life": 90
      },
      {
        "type": "spark",
        "count": 5,
        "spread": 20,
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
          "#60a5fa"
        ],
        "life": [
          80,
          140
        ]
      },
      {
        "type": "line",
        "count": 4,
        "angleStep": 90,
        "length": [
          20,
          35
        ],
        "width": 2,
        "color": "#a5b4fc",
        "life": 70
      }
    ]
  },
  "uppercut_slash": {
    "id": "uppercut_slash",
    "name": "어퍼컷 베기",
    "particles": [
      {
        "type": "slash",
        "angle": -70,
        "length": 100,
        "width": 12,
        "color": "#fbbf24",
        "glow": "#f59e0b",
        "life": 150
      },
      {
        "type": "line",
        "count": 6,
        "angleStep": 15,
        "offsetAngle": -75,
        "length": [
          30,
          60
        ],
        "width": 3,
        "color": "#fde68a",
        "life": 120
      },
      {
        "type": "spark",
        "count": 12,
        "spread": 50,
        "offsetAngle": -70,
        "speed": [
          10,
          25
        ],
        "size": [
          4,
          8
        ],
        "colors": [
          "#fbbf24",
          "#fde68a",
          "#ffffff"
        ],
        "life": [
          150,
          280
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

// DDOOAction 캐시에 자동 로드
if (typeof DDOOAction !== 'undefined') {
    Object.entries(window.ANIM_BUNDLE).forEach(([id, data]) => DDOOAction.animCache.set(id, data));
    Object.entries(window.VFX_BUNDLE).forEach(([id, data]) => DDOOAction.vfxCache.set(id, data));
    console.log('[AnimBundle] ✅ 로드완료: 애님 ' + Object.keys(window.ANIM_BUNDLE).length + '개, VFX ' + Object.keys(window.VFX_BUNDLE).length + '개');
}
