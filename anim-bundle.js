/**
 * DDOO Animation Bundle - 자동 생성됨
 * 생성일: 2026-01-03T16:12:47.226Z
 * 
 * 이 파일을 포함하면 fetch 없이 모든 애니메이션/VFX 데이터 사용 가능!
 * <script src="anim-bundle.js"></script>
 */

// 애니메이션 데이터 (30개)
window.ANIM_BUNDLE = {
  "card.bash": {
    "id": "card.bash",
    "name": "강타",
    "type": "sequence",
    "target": "player",
    "priority": 12,
    "description": "충격파를 동반한 강력한 일격",
    "steps": [
      {
        "anim": "player.dash",
        "wait": true
      },
      {
        "delay": 50
      },
      {
        "anim": "player.bash",
        "wait": false
      },
      {
        "anim": "enemy.bash_hit",
        "wait": true,
        "delay": 55
      },
      {
        "delay": 200
      },
      {
        "anim": "player.return",
        "wait": true
      }
    ]
  },
  "card.dagger": {
    "id": "card.dagger",
    "name": "단검 투척",
    "type": "sequence",
    "target": "player",
    "priority": 12,
    "description": "단검을 투척하여 원거리 공격",
    "steps": [
      {
        "anim": "player.throw",
        "wait": true
      },
      {
        "delay": 150
      },
      {
        "anim": "enemy.dagger_hit",
        "wait": true
      }
    ]
  },
  "card.dirtystrike": {
    "id": "card.dirtystrike",
    "name": "비열한 일격",
    "type": "sequence",
    "description": "공중으로 도약하여 급강하 찌르기",
    "steps": [
      {
        "anim": "player.sneak",
        "wait": true
      },
      {
        "anim": "player.backstab_strike",
        "wait": false
      },
      {
        "anim": "enemy.stabbed",
        "wait": true,
        "delay": 50
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
    "description": "옆으로 민첩하게 피하며 연막을 남긴다",
    "steps": [
      {
        "anim": "player.dodge",
        "wait": true
      }
    ]
  },
  "card.flurry": {
    "id": "card.flurry",
    "name": "연속 찌르기",
    "type": "sequence",
    "target": "player",
    "priority": 15,
    "description": "나비처럼 날아 벌처럼 쏜다! 세검 3연타",
    "steps": [
      {
        "anim": "player.dash",
        "wait": true
      },
      {
        "delay": 15
      },
      {
        "anim": "player.flurry_stab1",
        "wait": false
      },
      {
        "anim": "enemy.flurry_hit",
        "wait": true,
        "delay": 12
      },
      {
        "delay": 20
      },
      {
        "anim": "player.flurry_stab2",
        "wait": false
      },
      {
        "anim": "enemy.flurry_hit",
        "wait": true,
        "delay": 11
      },
      {
        "delay": 20
      },
      {
        "anim": "player.flurry_stab3",
        "wait": false
      },
      {
        "anim": "enemy.flurry_hit",
        "wait": true,
        "delay": 14
      },
      {
        "delay": 80
      },
      {
        "anim": "player.return",
        "wait": true
      }
    ]
  },
  "card.flurryP": {
    "id": "card.flurryP",
    "name": "연속 찌르기+",
    "type": "sequence",
    "target": "player",
    "priority": 18,
    "description": "초고속 5연타! 정신없이 몰아친다",
    "steps": [
      {
        "anim": "player.dash",
        "wait": true
      },
      {
        "delay": 10
      },
      {
        "anim": "player.flurry_stab1",
        "wait": false
      },
      {
        "anim": "enemy.flurry_hit",
        "wait": true,
        "delay": 10
      },
      {
        "delay": 12
      },
      {
        "anim": "player.flurry_stab2",
        "wait": false
      },
      {
        "anim": "enemy.flurry_hit",
        "wait": true,
        "delay": 9
      },
      {
        "delay": 12
      },
      {
        "anim": "player.flurry_stab1",
        "wait": false
      },
      {
        "anim": "enemy.flurry_hit",
        "wait": true,
        "delay": 10
      },
      {
        "delay": 12
      },
      {
        "anim": "player.flurry_stab2",
        "wait": false
      },
      {
        "anim": "enemy.flurry_hit",
        "wait": true,
        "delay": 9
      },
      {
        "delay": 15
      },
      {
        "anim": "player.flurry_stab3",
        "wait": false
      },
      {
        "anim": "enemy.flurry_hit",
        "wait": true,
        "delay": 14
      },
      {
        "delay": 100
      },
      {
        "anim": "player.return",
        "wait": true
      }
    ]
  },
  "card.strike": {
    "id": "card.strike",
    "name": "베기",
    "type": "sequence",
    "target": "player",
    "priority": 10,
    "description": "무게감 있는 대검 베기",
    "steps": [
      {
        "anim": "player.dash",
        "wait": true
      },
      {
        "delay": 40
      },
      {
        "anim": "player.heavy_slash",
        "wait": false
      },
      {
        "anim": "enemy.hit",
        "wait": true,
        "delay": 65
      },
      {
        "delay": 180
      },
      {
        "anim": "player.return",
        "wait": true
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
    "name": "강타 피격",
    "target": "enemy",
    "type": "once",
    "priority": 22,
    "duration": 550,
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
        "y": -8,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.6,
        "rotation": 0.12,
        "duration": 25,
        "ease": "power4.out",
        "vfx": "bash_hit"
      },
      {
        "x": 55,
        "y": -12,
        "scaleX": 0.68,
        "scaleY": 1.32,
        "alpha": 0.45,
        "rotation": 0.2,
        "duration": 35,
        "ease": "power3.out"
      },
      {
        "x": 80,
        "y": -8,
        "scaleX": 0.65,
        "scaleY": 1.35,
        "alpha": 0.4,
        "rotation": 0.25,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 95,
        "y": 0,
        "scaleX": 0.7,
        "scaleY": 1.3,
        "alpha": 0.45,
        "rotation": 0.22,
        "duration": 35,
        "ease": "power2.out"
      },
      {
        "x": 88,
        "y": 5,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.52,
        "rotation": 0.18,
        "duration": 40,
        "ease": "power2.inOut"
      },
      {
        "x": 75,
        "y": 5,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "alpha": 0.6,
        "rotation": 0.14,
        "duration": 45,
        "ease": "power2.inOut"
      },
      {
        "x": 60,
        "y": 4,
        "scaleX": 0.88,
        "scaleY": 1.12,
        "alpha": 0.7,
        "rotation": 0.1,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 42,
        "y": 3,
        "scaleX": 0.92,
        "scaleY": 1.08,
        "alpha": 0.8,
        "rotation": 0.06,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "x": 25,
        "y": 2,
        "scaleX": 0.96,
        "scaleY": 1.04,
        "alpha": 0.9,
        "rotation": 0.03,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 12,
        "y": 1,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.95,
        "rotation": 0.01,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 4,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "alpha": 0.98,
        "rotation": 0,
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
    "duration": 80,
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
        "y": -5,
        "scaleX": 0.8,
        "scaleY": 1.25,
        "alpha": 0.5,
        "rotation": 0.08,
        "duration": 8,
        "ease": "power4.out",
        "vfx": "flurry_hit"
      },
      {
        "x": 35,
        "y": 0,
        "scaleX": 0.75,
        "scaleY": 1.3,
        "alpha": 0.45,
        "rotation": 0.1,
        "duration": 12,
        "ease": "power2.out"
      },
      {
        "x": 28,
        "y": 3,
        "scaleX": 0.82,
        "scaleY": 1.22,
        "alpha": 0.55,
        "rotation": 0.08,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 18,
        "y": 2,
        "scaleX": 0.9,
        "scaleY": 1.12,
        "alpha": 0.7,
        "rotation": 0.05,
        "duration": 15,
        "ease": "power2.out"
      },
      {
        "x": 8,
        "y": 1,
        "scaleX": 0.96,
        "scaleY": 1.05,
        "alpha": 0.88,
        "rotation": 0.02,
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
    "name": "적 피격",
    "target": "enemy",
    "type": "once",
    "priority": 20,
    "duration": 450,
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
        "x": 18,
        "y": -4,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 0.7,
        "rotation": 0.08,
        "duration": 22,
        "ease": "power4.out",
        "vfx": "hit"
      },
      {
        "x": 40,
        "y": -6,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "alpha": 0.5,
        "rotation": 0.14,
        "duration": 28,
        "ease": "power3.out"
      },
      {
        "x": 58,
        "y": -4,
        "scaleX": 0.75,
        "scaleY": 1.25,
        "alpha": 0.45,
        "rotation": 0.17,
        "duration": 32,
        "ease": "power2.out"
      },
      {
        "x": 68,
        "y": 0,
        "scaleX": 0.78,
        "scaleY": 1.22,
        "alpha": 0.5,
        "rotation": 0.15,
        "duration": 28,
        "ease": "power2.out"
      },
      {
        "x": 64,
        "y": 2,
        "scaleX": 0.82,
        "scaleY": 1.18,
        "alpha": 0.55,
        "rotation": 0.13,
        "duration": 32,
        "ease": "power2.inOut"
      },
      {
        "x": 56,
        "y": 3,
        "scaleX": 0.86,
        "scaleY": 1.14,
        "alpha": 0.62,
        "rotation": 0.1,
        "duration": 38,
        "ease": "power2.inOut"
      },
      {
        "x": 46,
        "y": 3,
        "scaleX": 0.9,
        "scaleY": 1.1,
        "alpha": 0.7,
        "rotation": 0.07,
        "duration": 42,
        "ease": "power2.inOut"
      },
      {
        "x": 35,
        "y": 2,
        "scaleX": 0.93,
        "scaleY": 1.07,
        "alpha": 0.78,
        "rotation": 0.05,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 24,
        "y": 1,
        "scaleX": 0.96,
        "scaleY": 1.04,
        "alpha": 0.85,
        "rotation": 0.03,
        "duration": 45,
        "ease": "power2.out"
      },
      {
        "x": 14,
        "y": 0,
        "scaleX": 0.98,
        "scaleY": 1.02,
        "alpha": 0.92,
        "rotation": 0.01,
        "duration": 40,
        "ease": "power2.out"
      },
      {
        "x": 5,
        "y": 0,
        "scaleX": 0.99,
        "scaleY": 1.01,
        "alpha": 0.97,
        "rotation": 0,
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
  "enemy.stabbed": {
    "id": "enemy.stabbed",
    "name": "뒤에서 찔림",
    "target": "enemy",
    "keyframes": [
      {
        "time": 0,
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0
      },
      {
        "time": 25,
        "x": 12,
        "y": -5,
        "scaleX": 0.88,
        "scaleY": 1.1,
        "rotation": 0.08,
        "duration": 25,
        "ease": "power4.out"
      },
      {
        "time": 60,
        "x": 20,
        "y": 5,
        "scaleX": 1.12,
        "scaleY": 0.92,
        "rotation": -0.05,
        "duration": 35,
        "ease": "power2.out",
        "vfx": "blood_splat"
      },
      {
        "time": 120,
        "x": 12,
        "y": 3,
        "scaleX": 1.05,
        "scaleY": 0.97,
        "rotation": -0.02,
        "duration": 60,
        "ease": "power2.out"
      },
      {
        "time": 200,
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "rotation": 0,
        "duration": 80,
        "ease": "power1.out"
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
    "name": "급강하 찌르기",
    "target": "player",
    "keyframes": [
      {
        "time": 0,
        "x": 200,
        "y": -60,
        "scaleX": 0.9,
        "scaleY": 1.08,
        "alpha": 1,
        "rotation": -0.05
      },
      {
        "time": 25,
        "x": 230,
        "y": -80,
        "scaleX": 0.85,
        "scaleY": 1.15,
        "alpha": 1,
        "rotation": 0.2,
        "duration": 25,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "time": 50,
        "x": 270,
        "y": -30,
        "scaleX": 1.25,
        "scaleY": 0.85,
        "alpha": 1,
        "rotation": 0.35,
        "duration": 25,
        "ease": "power4.out",
        "afterimage": true,
        "vfx": "dagger_stab"
      },
      {
        "time": 70,
        "x": 280,
        "y": 0,
        "scaleX": 1.15,
        "scaleY": 0.9,
        "alpha": 1,
        "rotation": 0.15,
        "duration": 20,
        "ease": "power3.out",
        "shake": {
          "intensity": 8,
          "duration": 100
        },
        "hitstop": 60
      },
      {
        "time": 120,
        "x": 275,
        "y": 0,
        "scaleX": 1.05,
        "scaleY": 0.97,
        "alpha": 1,
        "rotation": 0.05,
        "duration": 50,
        "ease": "power2.out"
      },
      {
        "time": 180,
        "x": 265,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 60,
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
    "name": "닷지 - 민첩한 회피",
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
        "time": 30,
        "x": -5,
        "y": -3,
        "scaleX": 0.95,
        "scaleY": 1.03,
        "alpha": 1,
        "rotation": -0.02,
        "duration": 30,
        "ease": "power2.in"
      },
      {
        "time": 70,
        "x": -50,
        "y": -8,
        "scaleX": 0.85,
        "scaleY": 1.1,
        "alpha": 0.9,
        "rotation": -0.1,
        "duration": 40,
        "ease": "power3.out",
        "afterimage": true,
        "vfx": "smoke_puff"
      },
      {
        "time": 110,
        "x": -70,
        "y": -5,
        "scaleX": 0.88,
        "scaleY": 1.08,
        "alpha": 0.7,
        "rotation": -0.08,
        "duration": 40,
        "ease": "power2.inOut",
        "afterimage": true
      },
      {
        "time": 160,
        "x": -50,
        "y": -3,
        "scaleX": 0.92,
        "scaleY": 1.05,
        "alpha": 0.85,
        "rotation": -0.05,
        "duration": 50,
        "ease": "power2.inOut",
        "afterimage": true
      },
      {
        "time": 220,
        "x": -20,
        "y": -1,
        "scaleX": 0.97,
        "scaleY": 1.02,
        "alpha": 0.95,
        "rotation": -0.02,
        "duration": 60,
        "ease": "power2.out"
      },
      {
        "time": 280,
        "x": 0,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0,
        "duration": 60,
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
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "x": 95,
        "y": -5,
        "scaleX": 1.35,
        "scaleY": 0.72,
        "rotation": 0.05,
        "duration": 14,
        "ease": "power4.out",
        "vfx": "flurry_finish",
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
        "y": 3,
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
    "name": "은밀한 도약",
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
        "time": 30,
        "x": 15,
        "y": -8,
        "scaleX": 0.92,
        "scaleY": 1.06,
        "alpha": 1,
        "rotation": -0.03,
        "duration": 30,
        "ease": "power2.in"
      },
      {
        "time": 60,
        "x": 50,
        "y": -40,
        "scaleX": 0.88,
        "scaleY": 1.1,
        "alpha": 1,
        "rotation": -0.08,
        "duration": 30,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "time": 100,
        "x": 120,
        "y": -80,
        "scaleX": 0.85,
        "scaleY": 1.12,
        "alpha": 1,
        "rotation": -0.12,
        "duration": 40,
        "ease": "power2.in",
        "afterimage": true
      },
      {
        "time": 140,
        "x": 200,
        "y": -60,
        "scaleX": 0.9,
        "scaleY": 1.08,
        "alpha": 1,
        "rotation": -0.05,
        "duration": 40,
        "ease": "power2.out",
        "afterimage": true
      }
    ]
  },
  "player.sneak_return": {
    "id": "player.sneak_return",
    "name": "빠른 후퇴",
    "target": "player",
    "returnToBase": true,
    "keyframes": [
      {
        "time": 0,
        "x": 265,
        "y": 0,
        "scaleX": 1,
        "scaleY": 1,
        "alpha": 1,
        "rotation": 0
      },
      {
        "time": 40,
        "x": 220,
        "y": -20,
        "scaleX": 0.95,
        "scaleY": 1.03,
        "alpha": 1,
        "rotation": -0.05,
        "duration": 40,
        "ease": "power2.out",
        "afterimage": true
      },
      {
        "time": 80,
        "x": 140,
        "y": -35,
        "scaleX": 0.92,
        "scaleY": 1.05,
        "alpha": 1,
        "rotation": -0.08,
        "duration": 40,
        "ease": "power2.inOut",
        "afterimage": true
      },
      {
        "time": 120,
        "x": 60,
        "y": -20,
        "scaleX": 0.95,
        "scaleY": 1.03,
        "alpha": 1,
        "rotation": -0.03,
        "duration": 40,
        "ease": "power2.inOut",
        "afterimage": true
      },
      {
        "time": 160,
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

// VFX 데이터 (18개)
window.VFX_BUNDLE = {
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
    "shake": 12,
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
        "color": "#ef4444",
        "life": 100
      },
      {
        "type": "flash",
        "size": 100,
        "color": "#fbbf24",
        "life": 120
      },
      {
        "type": "ring",
        "size": 50,
        "maxSize": 280,
        "color": "#ef4444",
        "life": 280
      },
      {
        "type": "ring",
        "size": 35,
        "maxSize": 180,
        "color": "#fbbf24",
        "life": 220
      },
      {
        "type": "line",
        "count": 16,
        "angleStep": 22.5,
        "length": [
          80,
          180
        ],
        "width": 7,
        "color": "#fbbf24",
        "life": 200
      },
      {
        "type": "spark",
        "count": 35,
        "spread": 140,
        "speed": [
          20,
          50
        ],
        "size": [
          6,
          18
        ],
        "colors": [
          "#ef4444",
          "#fbbf24",
          "#ffffff"
        ],
        "life": [
          180,
          380
        ]
      },
      {
        "type": "debris",
        "count": 25,
        "speed": [
          15,
          40
        ],
        "size": [
          5,
          14
        ],
        "colors": [
          "#ef4444",
          "#fbbf24",
          "#dc2626"
        ],
        "gravity": 0.45,
        "life": [
          300,
          550
        ]
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
  "flurry_finish": {
    "id": "flurry_finish",
    "name": "세검 피니시",
    "shake": 6,
    "particles": [
      {
        "type": "flash",
        "size": 100,
        "color": "#ffffff",
        "life": 60
      },
      {
        "type": "flash",
        "size": 70,
        "color": "#c4b5fd",
        "life": 80
      },
      {
        "type": "arrow",
        "count": 1,
        "length": [
          280,
          340
        ],
        "width": 80,
        "tipAngle": 28,
        "color": "#ffffff",
        "glow": "#a78bfa",
        "innerColor": "rgba(139, 92, 246, 0.6)",
        "life": 140
      },
      {
        "type": "arrow",
        "count": 1,
        "length": [
          220,
          280
        ],
        "width": 55,
        "tipAngle": 25,
        "color": "#e0e7ff",
        "glow": "#8b5cf6",
        "innerColor": "rgba(167, 139, 250, 0.4)",
        "life": 110
      },
      {
        "type": "thrust",
        "count": 3,
        "angle": [
          -3,
          0,
          3
        ],
        "length": [
          450,
          550
        ],
        "width": 5,
        "color": "#ffffff",
        "glow": "#a78bfa",
        "life": 130
      },
      {
        "type": "ring",
        "size": 25,
        "maxSize": 140,
        "color": "#a78bfa",
        "life": 180
      },
      {
        "type": "spark",
        "count": 20,
        "spread": 80,
        "speed": [
          15,
          35
        ],
        "size": [
          3,
          10
        ],
        "colors": [
          "#a78bfa",
          "#c4b5fd",
          "#f0abfc",
          "#ffffff"
        ],
        "life": [
          100,
          200
        ]
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
    "shake": 3,
    "particles": [
      {
        "type": "flash",
        "size": 60,
        "color": "#ffffff",
        "life": 35
      },
      {
        "type": "arrow",
        "count": 1,
        "length": [
          180,
          220
        ],
        "width": 50,
        "tipAngle": 30,
        "color": "#e0e7ff",
        "glow": "#a78bfa",
        "innerColor": "rgba(167, 139, 250, 0.5)",
        "life": 100
      },
      {
        "type": "arrow",
        "count": 1,
        "length": [
          140,
          180
        ],
        "width": 35,
        "tipAngle": 25,
        "color": "#ffffff",
        "glow": "#818cf8",
        "innerColor": "rgba(129, 140, 248, 0.3)",
        "life": 80
      },
      {
        "type": "thrust",
        "count": 1,
        "angle": 0,
        "length": [
          300,
          380
        ],
        "width": 4,
        "color": "#ffffff",
        "glow": "#a78bfa",
        "life": 90
      },
      {
        "type": "spark",
        "count": 10,
        "spread": 35,
        "speed": [
          12,
          25
        ],
        "size": [
          2,
          6
        ],
        "colors": [
          "#a5b4fc",
          "#c4b5fd",
          "#ffffff"
        ],
        "life": [
          70,
          130
        ]
      }
    ]
  },
  "heavy_slash": {
    "id": "heavy_slash",
    "name": "대검 베기",
    "shake": 10,
    "particles": [
      {
        "type": "flash",
        "size": 180,
        "color": "#ffffff",
        "life": 70
      },
      {
        "type": "flash",
        "size": 130,
        "color": "#f59e0b",
        "life": 90
      },
      {
        "type": "slash",
        "count": 1,
        "delay": 0,
        "angle": [
          -45
        ],
        "length": [
          450,
          550
        ],
        "width": 20,
        "color": "#ffffff",
        "glow": "#f59e0b",
        "life": 200
      },
      {
        "type": "slash",
        "count": 1,
        "delay": 0,
        "angle": [
          -45
        ],
        "length": [
          350,
          450
        ],
        "width": 60,
        "color": "rgba(245, 158, 11, 0.5)",
        "glow": "#d97706",
        "life": 170
      },
      {
        "type": "ring",
        "size": 50,
        "maxSize": 220,
        "color": "#f59e0b",
        "life": 250
      },
      {
        "type": "spark",
        "count": 30,
        "spread": 120,
        "speed": [
          18,
          45
        ],
        "size": [
          6,
          16
        ],
        "colors": [
          "#f59e0b",
          "#fbbf24",
          "#ffffff"
        ],
        "life": [
          150,
          300
        ]
      },
      {
        "type": "debris",
        "count": 15,
        "speed": [
          12,
          30
        ],
        "size": [
          5,
          12
        ],
        "colors": [
          "#f59e0b",
          "#d97706"
        ],
        "gravity": 0.35,
        "life": [
          250,
          450
        ]
      }
    ]
  },
  "hit": {
    "id": "hit",
    "name": "타격",
    "shake": 5,
    "particles": [
      {
        "type": "flash",
        "size": 140,
        "color": "#ffffff",
        "life": 55
      },
      {
        "type": "flash",
        "size": 100,
        "color": "#ef4444",
        "life": 80
      },
      {
        "type": "ring",
        "size": 35,
        "maxSize": 150,
        "color": "#ef4444",
        "life": 180
      },
      {
        "type": "ring",
        "size": 25,
        "maxSize": 100,
        "color": "#fbbf24",
        "life": 140
      },
      {
        "type": "spark",
        "count": 22,
        "spread": 90,
        "speed": [
          14,
          32
        ],
        "size": [
          5,
          13
        ],
        "colors": [
          "#ef4444",
          "#fbbf24",
          "#ffffff"
        ],
        "life": [
          110,
          220
        ]
      },
      {
        "type": "line",
        "count": 14,
        "angleStep": 25.7,
        "length": [
          45,
          110
        ],
        "width": 4,
        "color": "#fbbf24",
        "life": 110
      },
      {
        "type": "debris",
        "count": 12,
        "speed": [
          10,
          25
        ],
        "size": [
          4,
          10
        ],
        "colors": [
          "#ef4444",
          "#dc2626"
        ],
        "gravity": 0.4,
        "life": [
          180,
          350
        ]
      }
    ]
  },
  "slash": {
    "id": "slash",
    "name": "베기",
    "shake": 6,
    "particles": [
      {
        "type": "flash",
        "size": 150,
        "color": "#ffffff",
        "life": 60
      },
      {
        "type": "flash",
        "size": 100,
        "color": "#fbbf24",
        "life": 80
      },
      {
        "type": "slash",
        "count": 1,
        "delay": 0,
        "angle": [
          -45
        ],
        "length": [
          350,
          450
        ],
        "width": 16,
        "color": "#ffffff",
        "glow": "#f59e0b",
        "life": 180
      },
      {
        "type": "slash",
        "count": 1,
        "delay": 0,
        "angle": [
          -45
        ],
        "length": [
          280,
          350
        ],
        "width": 50,
        "color": "rgba(245, 158, 11, 0.5)",
        "glow": "#d97706",
        "life": 150
      },
      {
        "type": "ring",
        "size": 35,
        "maxSize": 160,
        "color": "#f59e0b",
        "life": 200
      },
      {
        "type": "spark",
        "count": 25,
        "spread": 100,
        "speed": [
          15,
          35
        ],
        "size": [
          5,
          14
        ],
        "colors": [
          "#f59e0b",
          "#fbbf24",
          "#ffffff"
        ],
        "life": [
          120,
          250
        ]
      },
      {
        "type": "line",
        "count": 12,
        "angleStep": 30,
        "length": [
          50,
          120
        ],
        "width": 5,
        "color": "#fbbf24",
        "life": 120
      }
    ]
  },
  "smoke_puff": {
    "id": "smoke_puff",
    "name": "연막",
    "particles": [
      {
        "type": "smoke",
        "count": 12,
        "color": "#64748b",
        "size": {
          "min": 25,
          "max": 50
        },
        "speed": {
          "min": 1,
          "max": 3
        },
        "angle": {
          "min": -180,
          "max": 180
        },
        "life": {
          "min": 300,
          "max": 600
        },
        "gravity": -0.15,
        "fadeOut": true
      },
      {
        "type": "smoke",
        "count": 8,
        "color": "#94a3b8",
        "size": {
          "min": 15,
          "max": 35
        },
        "speed": {
          "min": 2,
          "max": 4
        },
        "angle": {
          "min": 150,
          "max": 210
        },
        "life": {
          "min": 250,
          "max": 450
        },
        "gravity": -0.1,
        "fadeOut": true
      },
      {
        "type": "spark",
        "count": 6,
        "color": "#cbd5e1",
        "size": {
          "min": 2,
          "max": 5
        },
        "speed": {
          "min": 3,
          "max": 6
        },
        "angle": {
          "min": 160,
          "max": 200
        },
        "life": {
          "min": 150,
          "max": 300
        },
        "fadeOut": true
      }
    ],
    "offset": {
      "x": 20,
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
  }
};

// 번들 로드 완료 플래그
window.ANIM_BUNDLE_LOADED = true;

console.log('[AnimBundle] ✅ 로드 완료:', Object.keys(ANIM_BUNDLE).length, 'anims,', Object.keys(VFX_BUNDLE).length, 'vfx');
