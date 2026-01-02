// ==========================================
// 몬스터 데이터베이스
// ==========================================

// 일반 몬스터 데이터베이스
const enemyDatabase = [
    // 고블린 도적 (조건부 인텐트 - 위치 기반 전략)
    {
        id: 'goblinRogue',
        name: "고블린 도적",
        maxHp: 35,
        img: 'goblin.png',
        usePattern: false,
        intents: [
            { 
                type: 'attack', 
                value: 5, 
                icon: '🗡️',
                weight: 35 // 35% 확률
            },
            { 
                type: 'attack', 
                value: 7, 
                icon: '⚔️',
                name: '베기',
                weight: 25 // 25% 확률
            },
            { 
                type: 'defend', 
                value: 6, 
                icon: '🛡️',
                name: '회피',
                weight: 20 // 20% 확률
            },
            { 
                type: 'advance', 
                value: 0, 
                icon: '💨', 
                name: '전진',
                animationKey: 'advance_forward',
                weight: 50, // 50% 확률 (조건 만족 시)
                // ✅ 조건: 1번 자리가 아닐 때만 (앞으로 갈 자리가 있을 때)
                condition: (enemy, gameState) => {
                    // 살아있는 미니언들 가져오기
                    const aliveMinions = gameState.enemies.filter(e => 
                        e.hp > 0 && !e.isBoss && !e.isElite
                    );
                    if (aliveMinions.length <= 1) return false; // 혼자면 전진 불필요
                    // 미니언들 중 내 위치 확인
                    const myIndex = aliveMinions.indexOf(enemy);
                    console.log(`[도적 전진 체크] 내 위치: ${myIndex}, 미니언 수: ${aliveMinions.length}`);
                    // 0번이 아니면 전진 가능 (앞에 자리가 있음)
                    return myIndex > 0;
                }
            },
            { 
                type: 'attack', 
                value: 12,
                icon: '💀',
                name: '급소 찌르기',
                animationKey: 'critical_strike',
                breakRecipe: ['physical', 'physical', 'physical'],
                cooldown: 3, // 🔥 사용 후 3턴 쿨타임
                weight: 50, // 50% 확률 (조건 만족 시)
                // ✅ 조건: 1번 자리(맨 앞)에 있을 때만 사용 가능
                condition: (enemy, gameState) => {
                    // 살아있는 미니언들 가져오기
                    const aliveMinions = gameState.enemies.filter(e => 
                        e.hp > 0 && !e.isBoss && !e.isElite
                    );
                    // 혼자면 항상 1번 자리
                    if (aliveMinions.length <= 1) return true;
                    // 미니언들 중 내 위치 확인
                    const myIndex = aliveMinions.indexOf(enemy);
                    console.log(`[도적 급소 체크] 내 위치: ${myIndex}`);
                    // 0번 인덱스(맨 앞)일 때만 급소 찌르기 가능
                    return myIndex === 0;
                }
            }
        ]
    },
    // 고블린 궁수 (조건부 인텐트)
    {
        id: 'goblinArcher',
        name: "고블린 궁수",
        maxHp: 28,
        img: 'goblinarcher.png',
        attackType: 'ranged', // 🏹 원거리 공격
        usePattern: false,
        intents: [
            { 
                type: 'attack', 
                value: 3, 
                hits: 2, 
                icon: '🏹',
                name: '연사',
                animationKey: 'arrow_shot',
                weight: 30 // 30% 확률 (기본 공격)
            },
            { 
                type: 'attack', 
                value: 8,
                bleed: 2,
                icon: '☠️',
                name: '독화살',
                animationKey: 'arrow_poison',
                breakRecipe: ['physical', 'physical'],
                cooldown: 2, // 🔥 사용 후 2턴 쿨타임
                weight: 60, // 60% 확률 (조건 만족 시)
                // ✅ 조건: 내가 배열의 맨 마지막 미니언일 때만 독화살 사용 가능
                condition: (enemy, gameState) => {
                    // 살아있는 미니언들만 (보스/엘리트 제외)
                    const aliveMinions = gameState.enemies.filter(e => 
                        e.hp > 0 && !e.isBoss && !e.isElite
                    );
                    
                    // 미니언이 1명 이하면 사용 가능
                    if (aliveMinions.length <= 1) {
                        console.log(`[궁수 독화살] 미니언 1명 이하 → 사용 가능`);
                        return true;
                    }
                    
                    // 내가 배열의 마지막 미니언인지 확인 (객체 참조 비교)
                    const lastMinion = aliveMinions[aliveMinions.length - 1];
                    const isLast = lastMinion === enemy;
                    
                    console.log(`[궁수 독화살] 미니언 ${aliveMinions.length}명, 마지막: ${lastMinion.name}, 나: ${enemy.name}, 맨뒤: ${isLast}`);
                    return isLast;
                }
            },
            { 
                type: 'retreat', 
                value: 0, 
                icon: '💨', 
                name: '후퇴',
                animationKey: 'retreat_back',
                weight: 100, // 100% 확률 (조건 만족 시 - 최우선!)
                // ✅ 조건: 내가 배열의 맨 마지막이 아니면 후퇴 가능
                condition: (enemy, gameState) => {
                    // 살아있는 미니언들만 (보스/엘리트 제외)
                    const aliveMinions = gameState.enemies.filter(e => 
                        e.hp > 0 && !e.isBoss && !e.isElite
                    );
                    
                    // 미니언이 1명 이하면 후퇴 불필요
                    if (aliveMinions.length <= 1) {
                        console.log(`[궁수 후퇴] 미니언 1명 이하 → 후퇴 불필요`);
                        return false;
                    }
                    
                    // 내가 배열의 마지막 미니언이 아닌지 확인 (객체 참조 비교)
                    const lastMinion = aliveMinions[aliveMinions.length - 1];
                    const canRetreat = lastMinion !== enemy;
                    
                    console.log(`[궁수 후퇴] 미니언 ${aliveMinions.length}명, 마지막: ${lastMinion.name}, 나: ${enemy.name}, 후퇴가능: ${canRetreat}`);
                    return canRetreat;
                }
            }
        ]
    },
    // 그림자 슬라임
    {
        id: 'shadowSlime',
        name: "그림자 슬라임",
        maxHp: 50,
        img: 'slime.png',
        canSplit: true, // 분열 가능
        splitThreshold: 0.5, // HP 50% 이하시 분열
        passives: ['split'], // 패시브 표시
        intents: [
            { type: 'attack', value: 8, icon: '⚔️' },
            { type: 'defend', value: 6, icon: '🛡️' }
        ]
    },
    // 분열된 슬라임 (일반 스테이지에서 등장 안함)
    {
        id: 'splitSlime',
        name: "분열된 슬라임",
        maxHp: 8,
        img: 'minislime.png',
        isSplitForm: true,
        intents: [
            { type: 'attack', value: 5, icon: '⚔️' },
        ]
    },
    // 독 거미 (실명 + 거미줄 패시브) - 공격만 함
    {
        id: 'poisonSpider',
        name: "독 거미",
        maxHp: 55,
        img: 'spider.png',
        blindEveryNTurns: 5, // N턴마다 실명 공격 (첫 턴 포함)
        webOnAttack: 2, // 패시브: 공격 시 거미줄 3장 추가
        passives: ['webOnAttack'], // 패시브 목록
        intents: [
            { type: 'attack', value: 6, icon: '🕷️' },
            { type: 'attack', value: 8, icon: '🕷️' },
            { type: 'attack', value: 10, icon: '⚔️' }
        ],
        // 실명 공격 인텐트 (별도 관리)
        blindIntent: { type: 'blind', value: 3, icon: '🕸️' } // 3턴 지속
    },
    // 해골 전사 (연속 공격 패턴)
    {
        id: 'skeletonWarrior',
        name: "해골 전사",
        maxHp: 45,
        img: 'skeleton.png',
        intents: [
            { type: 'attack', value: 5, hits: 2, icon: '💀' },  // 5×2 = 10 뼈 투척
            { type: 'attack', value: 4, hits: 3, icon: '☠️' },  // 4×3 = 12 난무
            { type: 'attack', value: 15, icon: '⚔️' },          // 단발 강타
            { type: 'defend', value: 8, icon: '🛡️' }
        ]
    },
    // 불꽃 정령
    {
        id: 'fireElemental',
        name: "불꽃 정령",
        maxHp: 45,
        img: 'burningmonster.png',
        intents: [
            { type: 'attack', value: 14, icon: '🔥' },
            { type: 'attack', value: 7, icon: '⚔️' },
            { type: 'attack', value: 7, icon: '🔥' }
        ]
    },
    // 다이어 울프 (출혈 공격 + 야생성)
    {
        id: 'direWolf',
        name: "다이어 울프",
        maxHp: 48,
        img: 'wolf.png',
        bleedOnAttack: true, // 패시브: 모든 공격에 출혈 부여
        wildInstinct: 3,     // 패시브: 턴 종료 시 HP 3 회복
        passives: ['bleedOnAttack', 'wildInstinct'],
        intents: [
            { type: 'attack', value: 3, icon: '🐺', bleed: 1 },   // 6 데미지 + 2 출혈
            { type: 'howl', value: 3, icon: '🌙', name: '아우우~' }, // 울음: 공격력 +5 버프

        ]
    },
    // 고블린 샤먼 (조건부 인텐트 - 후방 서포터)
    // 뒤에서 아군 힐/버프/보호, 가끔 마법 공격
    {
        id: 'goblinShaman',
        name: "고블린 샤먼",
        maxHp: 32,
        img: 'goblinshaman.png',
        passives: ['healer', 'magicUser'],
        usePattern: false,
        intents: [
            // 💨 후퇴 - 맨 뒤가 아닐 때 (최우선)
            { 
                type: 'retreat', 
                value: 0, 
                icon: '💨', 
                name: '후퇴',
                animationKey: 'retreat_back',
                weight: 100, // 최우선
                condition: (enemy, gameState) => {
                    const aliveMinions = gameState.enemies.filter(e => 
                        e.hp > 0 && !e.isBoss && !e.isElite
                    );
                    if (aliveMinions.length <= 1) return false;
                    const lastMinion = aliveMinions[aliveMinions.length - 1];
                    const canRetreat = lastMinion !== enemy;
                    console.log(`[샤먼 후퇴] 후퇴가능: ${canRetreat}`);
                    return canRetreat;
                }
            },
            // 💚 아군 힐 - 맨 뒤이고, 다친 아군이 있을 때 (최우선 서포트)
            { 
                type: 'healAlly', 
                value: 10, 
                icon: '💚', 
                name: '치유 주문',
                animationKey: 'heal_spell',
                weight: 80, // 높은 우선순위
                condition: (enemy, gameState) => {
                    const aliveMinions = gameState.enemies.filter(e => 
                        e.hp > 0 && !e.isBoss && !e.isElite
                    );
                    if (aliveMinions.length <= 1) return false;
                    
                    const lastMinion = aliveMinions[aliveMinions.length - 1];
                    const isLast = lastMinion === enemy;
                    if (!isLast) return false;
                    
                    // 다친 아군이 있는지 확인 (HP 70% 미만)
                    const woundedAlly = gameState.enemies.find(e => 
                        e !== enemy && e.hp > 0 && e.hp < e.maxHp * 0.7
                    );
                    const hasWounded = !!woundedAlly;
                    console.log(`[샤먼 힐] 맨뒤: ${isLast}, 다친아군: ${hasWounded}`);
                    return hasWounded;
                }
            },
            // 🛡️ 아군 보호 - 맨 뒤이고, 아군이 있을 때 (방어도 부여)
            { 
                type: 'defendAllies', 
                value: 5, 
                icon: '🛡️', 
                name: '보호 주문',
                animationKey: 'shield_spell',
                weight: 50,
                condition: (enemy, gameState) => {
                    const aliveMinions = gameState.enemies.filter(e => 
                        e.hp > 0 && !e.isBoss && !e.isElite
                    );
                    if (aliveMinions.length <= 1) return false;
                    
                    const lastMinion = aliveMinions[aliveMinions.length - 1];
                    const isLast = lastMinion === enemy;
                    console.log(`[샤먼 보호] 맨뒤: ${isLast}`);
                    return isLast;
                }
            },
            // 🔥 아군 버프 - 맨 뒤이고, 아군이 있을 때
            { 
                type: 'buffAllies', 
                value: 3, 
                icon: '🔥', 
                name: '전투 주문',
                animationKey: 'buff_spell',
                weight: 40,
                condition: (enemy, gameState) => {
                    const aliveMinions = gameState.enemies.filter(e => 
                        e.hp > 0 && !e.isBoss && !e.isElite
                    );
                    if (aliveMinions.length <= 1) return false;
                    
                    const lastMinion = aliveMinions[aliveMinions.length - 1];
                    const isLast = lastMinion === enemy;
                    console.log(`[샤먼 버프] 맨뒤: ${isLast}`);
                    return isLast;
                }
            },
            // 🔮 마법 화살 - 혼자거나 서포트 할 게 없을 때
            { 
                type: 'attack', 
                value: 6, 
                icon: '🔮', 
                name: '마법 화살',
                animationKey: 'magic_arrow',
                weight: 25 // 서포트 우선, 공격은 보조
            },
            // 💚 자가 힐 - HP가 낮을 때
            { 
                type: 'healSelf', 
                value: 8, 
                icon: '💚', 
                name: '치유',
                weight: 35,
                condition: (enemy, gameState) => {
                    const isLowHp = enemy.hp < enemy.maxHp * 0.5;
                    console.log(`[샤먼 자힐] HP낮음: ${isLowHp}`);
                    return isLowHp;
                }
            }
        ]
    },
    // 미믹 (보물 상자 위장 몬스터)
    {
        id: 'mimic',
        name: "미믹",
        maxHp: 65,
        img: 'mimic.png',
        isMimic: true,
        passives: ['ambush', 'greedy'],
        intents: [
            { type: 'attack', value: 8, icon: '👅', name: '혀 공격' },           // 혀 휘두르기
            { type: 'attack', value: 5, hits: 3, icon: '🦷', name: '물어뜯기' }, // 5x3 = 15 연속 물기
            { type: 'attack', value: 18, icon: '💀', name: '집어삼키기' },       // 강력한 단발
            { type: 'defend', value: 12, icon: '📦', name: '상자 숨기' }         // 방어
        ]
    },
    
    // ==========================================
    // 분노의 골렘 (Rage Golem) - 맞을수록 강해지는 몬스터
    // ==========================================
    {
        id: 'rageGolem',
        name: "분노의 골렘",
        maxHp: 55,
        img: 'golem.png',  // golem.png 없으면 대체
        isRageGolem: true,
        rageStacks: 0,          // 분노 스택
        baseScale: 1.0,         // 기본 스케일
        passives: ['rage', 'growth'],
        intents: [
            { type: 'attack', value: 4, icon: '👊', name: '주먹 내려치기' },
            { type: 'attack', value: 6, icon: '💪', name: '분노의 일격' },
            { type: 'attack', value: 3, hits: 2, icon: '⚡', name: '연속 타격' },
            { type: 'defend', value: 5, icon: '🛡️', name: '돌 껍질' }
        ],
        // 피격 시: 분노 증가 + 크기 증가 (히트마다!)
        onDamageTaken: function(damage, state) {
            if (damage <= 0) return;
            
            // 히트마다 고정 분노 +1 (다단히트 = 많이 커짐!)
            const rageGain = 1;
            this.rageStacks = (this.rageStacks || 0) + rageGain;
            
            // 최대 분노 20
            if (this.rageStacks > 20) this.rageStacks = 20;
            
            addLog(`💢 ${this.name}의 분노! +${rageGain} (현재: ${this.rageStacks})`, 'enemy');
            
            // 스케일 증가 (분노에 따라 100% ~ 150%)
            const newScale = 1.0 + (this.rageStacks * 0.025);  // 2.5%씩 증가
            this.currentScale = Math.min(1.5, newScale);
            
            console.log(`[RageGolem] 분노: ${this.rageStacks}, 스케일: ${this.currentScale}`);
            
            // 시각적 스케일 업데이트
            const enemyIndex = state.enemies ? state.enemies.indexOf(this) : 0;
            
            // getEnemyElement 함수 사용 또는 직접 검색
            let enemyEl = null;
            if (typeof getEnemyElement === 'function') {
                enemyEl = getEnemyElement(enemyIndex);
            }
            if (!enemyEl) {
                const container = document.getElementById('enemies-container');
                if (container) {
                    enemyEl = container.querySelector(`[data-index="${enemyIndex}"]`);
                }
            }
            
            console.log(`[RageGolem] 스케일 업데이트: ${this.currentScale}, 인덱스: ${enemyIndex}, 요소: ${enemyEl ? 'found' : 'not found'}`);
            
            if (enemyEl) {
                const spriteImg = enemyEl.querySelector('.enemy-sprite-img');
                console.log(`[RageGolem] 스프라이트 요소: ${spriteImg ? 'found' : 'not found'}`);
                
                // 직접 width 변경 (인라인 스타일이 있어서 transform이 안 먹힘)
                const scaleValue = this.currentScale;
                
                if (spriteImg) {
                    // 원본 width 저장 (처음에만)
                    if (!this.originalWidth) {
                        this.originalWidth = spriteImg.offsetWidth || 120;
                    }
                    
                    // 새 width 계산
                    const newWidth = Math.round(this.originalWidth * scaleValue);
                    
                    // width 직접 변경 + 필터 효과
                    spriteImg.style.width = `${newWidth}px`;
                    spriteImg.style.maxHeight = 'none';  // maxHeight 제한 해제
                    spriteImg.style.filter = `saturate(${1 + this.rageStacks * 0.08}) brightness(${1 + this.rageStacks * 0.03}) drop-shadow(0 0 ${this.rageStacks * 2}px #ef4444)`;
                    spriteImg.style.transition = 'width 0.3s ease-out, filter 0.3s ease';
                    
                    console.log(`[RageGolem] width 변경: ${this.originalWidth} → ${newWidth}px (${Math.round(scaleValue * 100)}%)`);
                }
                
                // 클래스 추가 (빨간 테두리 효과용)
                enemyEl.classList.add('rage-growing');
                
                // 분노 이펙트
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.flash(enemyEl, { color: '#ef4444', duration: 200 });
                }
                
                // 분노 팝업
                const ragePopup = document.createElement('div');
                ragePopup.className = 'rage-popup';
                ragePopup.innerHTML = `💢+${rageGain}`;
                ragePopup.style.cssText = `
                    position: absolute;
                    top: 10%;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #ef4444;
                    text-shadow: 0 0 10px #dc2626, 2px 2px 0 #000;
                    animation: rageFloat 1s ease-out forwards;
                    z-index: 100;
                    white-space: nowrap;
                `;
                enemyEl.appendChild(ragePopup);
                setTimeout(() => ragePopup.remove(), 1000);
                
                // 화면 살짝 흔들림 (분노가 높을 때)
                if (this.rageStacks >= 10 && typeof EffectSystem !== 'undefined') {
                    EffectSystem.screenShake(4, 150);
                }
            }
            
            // 패시브 UI 업데이트
            if (typeof MonsterPassiveSystem !== 'undefined') {
                MonsterPassiveSystem.updateDisplayForEnemy(this, enemyIndex);
            }
            
            updateUI();
        },
        // 공격력 보너스 (분노 스택의 절반)
        getAttackBonus: function() {
            return Math.floor((this.rageStacks || 0) / 2);
        }
    },
    
    // ==========================================
    // 광신도 (Fanatic) - 자해로 강해지는 광기의 신도
    // ==========================================
    {
        id: 'fanatic',
        name: "광신도",
        maxHp: 42,
        img: 'zealot.png',
        isFanatic: true,
        frenzyStacks: 0,        // 광기 중첩 (공격력 보너스)
        passives: ['frenzy', 'bloodlust'],
        intents: [
            { type: 'attack', value: 6, icon: '🗡️', name: '피의 칼날' },
            { type: 'attack', value: 8, icon: '⚔️', name: '광란의 일격' },
            { type: 'selfHarm', value: 4, icon: '🩸', name: '피의 의식' },   // 자해 4 = 광기 +4
            { type: 'selfHarm', value: 6, icon: '🩸', name: '광기의 희생' }, // 자해 6 = 광기 +6
            { type: 'frenzyAttack', value: 5, icon: '💀', name: '광기의 폭발' }  // 5 + 광기 데미지
        ],
        // 턴 시작 시: 광기가 3 이상이면 자동으로 자해
        onTurnStart: function(state) {
            if (this.frenzyStacks >= 3) {
                const selfDamage = 3;
                this.hp = Math.max(1, this.hp - selfDamage);
                this.frenzyStacks++;
                
                addLog(`${this.name}의 광기가 폭주! 자해 ${selfDamage}, 광기 +1 (현재: ${this.frenzyStacks})`, 'enemy');
                
                // 자해 이펙트
                const enemyEl = document.querySelector(`.enemy-unit[data-index="${state.enemies.indexOf(this)}"]`);
                if (enemyEl) {
                    if (typeof EffectSystem !== 'undefined') {
                        EffectSystem.flash(enemyEl, { color: '#dc2626', duration: 200 });
                    }
                    if (typeof showDamagePopup === 'function') {
                        showDamagePopup(enemyEl, selfDamage, 'self');
                    }
                }
                
                updateUI();
            }
        },
        // 자해 인텐트 실행
        executeSelfHarm: function(intent, state) {
            const selfDamage = intent.value;
            const atkBonus = intent.attackBonus || 2;
            
            this.hp = Math.max(1, this.hp - selfDamage);
            this.frenzyStacks += atkBonus;
            
            addLog(`${this.name}이(가) 피의 의식! 자해 ${selfDamage}, 광기 +${atkBonus} (현재: ${this.frenzyStacks})`, 'enemy');
            
            // 광기 버프 이펙트
            const enemyEl = document.querySelector(`.enemy-unit[data-index="${state.enemies.indexOf(this)}"]`);
            if (enemyEl) {
                // 붉은 오라
                if (typeof VFX !== 'undefined') {
                    VFX.playEffect('buff', enemyEl, { color: '#dc2626' });
                }
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.flash(enemyEl, { color: '#dc2626', duration: 300 });
                }
                // 자해 데미지 팝업
                if (typeof showDamagePopup === 'function') {
                    showDamagePopup(enemyEl, selfDamage, 'self');
                }
                // 광기 스택 표시
                setTimeout(() => {
                    if (typeof showDamagePopup === 'function') {
                        showDamagePopup(enemyEl, `+${atkBonus} 광기`, 'buff');
                    }
                }, 300);
            }
            
            updateUI();
        },
        // 광기 폭발 공격 (광기 스택 기반 데미지)
        executeFrenzyAttack: function(intent, state) {
            const baseDamage = intent.value;
            const totalDamage = baseDamage + (this.frenzyStacks * 2);  // 기본 + (광기 x 2)
            
            addLog(`${this.name}의 광기의 폭발! (기본 ${baseDamage} + 광기 ${this.frenzyStacks} x 2 = ${totalDamage})`, 'enemy');
            
            // 공격 실행
            if (typeof dealDamage === 'function') {
                dealDamage(state.player, totalDamage, this);
            } else {
                // fallback
                let actualDamage = totalDamage;
                if (state.player.block > 0) {
                    const blocked = Math.min(state.player.block, totalDamage);
                    state.player.block -= blocked;
                    actualDamage = totalDamage - blocked;
                }
                state.player.hp = Math.max(0, state.player.hp - actualDamage);
            }
            
            // 강력한 이펙트
            const playerEl = document.getElementById('player');
            if (playerEl) {
                if (typeof VFX !== 'undefined') {
                    VFX.playEffect('hit', playerEl);
                    VFX.shake(playerEl, 10);
                }
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.screenFlash('#dc2626', 200);
                }
            }
            
            // 광기 스택 절반으로 감소 (소모)
            this.frenzyStacks = Math.floor(this.frenzyStacks / 2);
            
            updateUI();
        },
        // 일반 공격 시 광기 보너스 적용
        getAttackBonus: function() {
            return this.frenzyStacks;  // 광기 스택만큼 추가 데미지
        }
    },
];

// ==========================================
// 엘리트 몬스터 데이터베이스
// ==========================================
const eliteDatabase = [
    {
        id: 'thornGuardian',
        name: "가시 수호자",
        maxHp: 80,
        img: 'spikemonster.png',
        thorns: 1, // 피격 시 반사 데미지
        passives: ['thorns'], // 패시브 목록
        intents: [
            { type: 'attack', value: 6, icon: '🌵' },
            { type: 'defend', value: 8, icon: '🛡️' },
            { type: 'buff', value: 1, icon: '🔺' } // 가시 데미지 +1
        ],
        onDamageTaken: function(damage, state) {
            // 피격 시 가시 데미지 반사 (방어도 먼저 소모)
            if (damage > 0 && this.thorns > 0) {
                const thornDmg = this.thorns;
                
                // 방어도가 있으면 먼저 소모
                let actualDamage = thornDmg;
                let blockedDamage = 0;
                
                if (state.player.block > 0) {
                    blockedDamage = Math.min(state.player.block, thornDmg);
                    state.player.block -= blockedDamage;
                    actualDamage = thornDmg - blockedDamage;
                }
                
                // 남은 데미지는 HP에 적용
                if (actualDamage > 0) {
                    state.player.hp = Math.max(0, state.player.hp - actualDamage);
                }
                
                // 로그 메시지
                if (blockedDamage > 0 && actualDamage > 0) {
                    addLog(`가시 반사! 방어도 ${blockedDamage} 흡수, ${actualDamage} 데미지!`, 'damage');
                } else if (blockedDamage > 0) {
                    addLog(`가시 반사! 방어도 ${blockedDamage} 흡수!`, 'block');
                } else {
                    addLog(`가시 반사! ${thornDmg} 데미지!`, 'damage');
                }
                
                // UI 업데이트
                if (typeof updateUI === 'function') {
                    updateUI();
                }
                
                // 패시브 발동 효과
                if (typeof MonsterPassiveSystem !== 'undefined') {
                    MonsterPassiveSystem.triggerPassiveEffect('thorns');
                }
                
                const playerEl = document.getElementById('player');
                if (playerEl && typeof EffectSystem !== 'undefined') {
                    EffectSystem.flash(playerEl, { color: '#22c55e', duration: 100 });
                    
                    // 가시 이펙트
                    const rect = playerEl.getBoundingClientRect();
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            const spike = document.createElement('div');
                            spike.textContent = '🌵';
                            spike.style.cssText = `
                                position: fixed;
                                left: ${rect.left + Math.random() * rect.width}px;
                                top: ${rect.top + Math.random() * rect.height}px;
                                font-size: 1.5rem;
                                pointer-events: none;
                                z-index: 1000;
                                animation: spikeHit 0.5s ease-out forwards;
                            `;
                            document.body.appendChild(spike);
                            setTimeout(() => spike.remove(), 500);
                        }, i * 50);
                    }
                }
                
                // 데미지 팝업
                if (typeof showDamagePopup === 'function') {
                    showDamagePopup(playerEl, thornDmg, 'thorn');
                }
                
                updateUI();
                
                // 플레이어 사망 체크
                if (state.player.hp <= 0) {
                    setTimeout(() => gameOver(), 500);
                }
            }
        }
    },
    
    // ==========================================
    // 도플갱어 (엘리트) - 플레이어의 그림자
    // ==========================================
    {
        id: 'doppelganger',
        name: "도플갱어",
        maxHp: 120,
        img: 'hero.png',
        isDoppelganger: true,
        isElite: true,
        passives: ['cardUser', 'mirrored'],
        // 엘리트 특성
        eliteEnergy: 4,      // 에너지 4
        eliteDrawCount: 6,   // 6장 드로우
        // 의도는 DoppelgangerSystem에서 동적으로 설정
        intents: [
            { type: 'attack', value: 0, icon: '🃏' },
        ],
        onSpawn: (enemy) => {
            // 도플갱어 시스템 초기화
            if (typeof DoppelgangerSystem !== 'undefined') {
                DoppelgangerSystem.initDoppelganger(enemy);
            }
        },
        // 거울상: HP 50% 이하시 강화
        onDamageTaken: function(damage, state) {
            if (!this.mirrorEnraged && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
                this.mirrorEnraged = true;
                this.maxEnergy = (this.maxEnergy || 4) + 1;
                this.energy = this.maxEnergy;
                
                addLog(`🪞 ${this.name}: 거울상 각성! 에너지 +1`, 'warning');
                
                // 각성 이펙트
                const enemyEl = document.querySelector(`.enemy-unit[data-enemy-id="${this.id}"]`) ||
                               document.querySelector('.enemy-unit');
                if (enemyEl && typeof EffectSystem !== 'undefined') {
                    EffectSystem.buff(enemyEl);
                    EffectSystem.screenShake(10, 300);
                }
            }
        }
    },
    
];

// ==========================================
// 보스 몬스터 데이터베이스
// ==========================================
const bossDatabase = [
    {
        id: 'goblinKing',
        name: "고블린 킹",
        maxHp: 100,
        img: 'goblinking.png',
        isBoss: true,
        // 고블린 킹 전용 패턴 시스템
        usePattern: true,
        patternIndex: 0,
        // 패턴: 소환 → 버프 → 강타 → 일반공격 → 방어+버프 → 순환
        pattern: [
            { type: 'summon', summons: ['goblinRogue', 'goblinArcher'], icon: '📯', name: '부하 소환' },
            { type: 'buffAllies', value: 3, icon: '🔥', name: '전투 함성' },
            { type: 'defend', value: 8, icon: '🛡️', name: '왕의 수비' },
            { type: 'attack', value: 8, icon: '⚔️', name: '베기' },
        ],
        // 일반 intents (패턴 외 랜덤 선택용, 현재는 사용 안함)
        intents: [
            { type: 'attack', value: 12, icon: '👑' },
            { type: 'attack', value: 18, icon: '⚔️' },
            { type: 'defend', value: 10, icon: '🛡️' },
            { type: 'buff', value: 3, icon: '💪' }
        ]
    },
    {
        id: 'spiderQueen',
        name: "거미 여왕",
        maxHp: 120,
        img: 'spider.png',
        webOnAttack: 2,
        passives: ['webOnAttack'],
        intents: [
            { type: 'attack', value: 10, icon: '🕷️' },
            { type: 'attack', value: 15, icon: '🕸️' },
            { type: 'attack', value: 20, icon: '💀' },
            { type: 'defend', value: 12, icon: '🛡️' }
        ]
    },
    {
        id: 'fireKing',
        name: "화염왕",
        maxHp: 150,
        img: 'burningmonster.png',
        intents: [
            { type: 'attack', value: 15, icon: '🔥' },
            { type: 'attack', value: 25, icon: '💀' },
            { type: 'attack', value: 30, icon: '🔥' },
            { type: 'defend', value: 15, icon: '🛡️' }
        ]
    },
    // 자이언트 스파이더 - 거미줄 + 신경독 + 공격력 감소
    {
        id: 'giantSpider',
        name: "자이언트 스파이더",
        maxHp: 140,
        img: 'giantspider.png',
        isBoss: true,
        webOnAttack: 3, // 공격 시 거미줄 2장 추가
        passives: ['webOnAttack'],
        // 패턴 시스템
        usePattern: true,
        patternIndex: 0,
        // 패턴: 실명 → 독이빨 → 신경독 → 강공격 → 거미줄 폭풍 → 공격력 감소 → 순환
        pattern: [
            { type: 'blind', value: 3, icon: '🕸️', name: '독안개' },
            { type: 'attack', value: 12, icon: '🕷️', name: '독이빨' },
            { type: 'neurotoxin', count: 1, icon: '💉', name: '신경독' },
            { type: 'attack', value: 20, icon: '🕸️', name: '거미 강타' },
            { type: 'webStorm', count: 3, icon: '🌪️', name: '거미줄 폭풍' },
            { type: 'weakenAttack', value: 2, duration: 2, icon: '💀', name: '맹독 분사' },
            { type: 'attack', value: 15, hits: 2, icon: '🕷️🕷️', name: '이중 물기' }
        ],
        intents: [
            { type: 'attack', value: 12, icon: '🕷️' },
            { type: 'attack', value: 18, icon: '🕸️' },
            { type: 'defend', value: 10, icon: '🛡️' }
        ]
    },
    
    // ==========================================
    // 사신 (보스) - 타로카드 죽음에서 소환
    // ==========================================
    {
        id: 'reaper',
        name: "사신",
        maxHp: 180,
        img: 'reaper.png',
        isBoss: true,
        scale: 0.5, // 스케일 조정 (기본 1.0)
        passives: ['deathSentence'],
        // 패턴 시스템 사용
        usePattern: true,
        patternIndex: 0,
        attackBonus: 0, // 죽음의 선고로 증가하는 공격력
        isPreparingExecution: false, // 처형 준비 상태
        hasTriggeredExecution: false, // 처형 트리거 여부
        pattern: [
            // 1. 공격: 10 데미지
            { type: 'attack', value: 10, icon: '💀', name: '사신의 낫' },
            // 2. 분신 소환
            { type: 'summon', summons: ['reaperShadow'], icon: '👥', name: '분신 소환' },
            // 3. 공격: 분신과 함께 공격 (10 데미지)
            { type: 'attack', value: 10, icon: '⚔️', name: '합동 공격' },
            // 4. 방어
            { type: 'defend', value: 12, icon: '🛡️', name: '망자의 방벽' }
        ],
        intents: [
            { type: 'attack', value: 10, icon: '💀' }
        ],
        onBattleStart: function(state) {
            this.attackBonus = 0;
            this.isPreparingExecution = false;
            this.hasTriggeredExecution = false;
            addLog(`☠️ 사신: "네 운명은 정해졌다..."`, 'warning');
        },
        onTurnStart: function(state) {
            // HP 30% 이하 + 아직 처형 트리거 안됨 → 처형 준비
            if (!this.hasTriggeredExecution && this.hp <= this.maxHp * 0.3) {
                this.hasTriggeredExecution = true;
                this.isPreparingExecution = true;
                
                // 현재 인텐트를 처형 준비로 강제 변경
                this.intent = 'prepare';
                this.intentValue = 0;
                this.currentIntentData = { type: 'prepare', value: 0, icon: '⏳', name: '처형 준비' };
                
                addLog(`☠️ 사신: "...끝이다."`, 'danger');
                addLog(`⚠️ 사신이 처형을 준비한다!`, 'danger');
                
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.screenShake(10, 500);
                }
            }
            // 처형 준비 다음 턴 → 50 데미지 처형
            else if (this.isPreparingExecution) {
                this.isPreparingExecution = false;
                
                // 인텐트를 처형으로 강제 변경
                this.intent = 'attack';
                this.intentValue = 50;
                this.currentIntentData = { type: 'attack', value: 50, icon: '💀', name: '처형' };
                
                addLog(`☠️ 사신: "죽음을 받아들여라!"`, 'danger');
            }
        },
        onIntent: function(intent) {
            // 공격 시 죽음의 선고 보너스 적용
            if (intent.type === 'attack' && this.attackBonus > 0) {
                intent.value += this.attackBonus;
                addLog(`☠️ 사신: "더 강해진다..." (+${this.attackBonus})`, 'warning');
            }
        }
    }
];

// ==========================================
// 미니언 몬스터 (소환수)
// ==========================================
const minionDatabase = [
    // 사신의 분신 (HP 15, 사신과 같이 공격)
    {
        id: 'reaperShadow',
        name: "사신의 그림자자",
        maxHp: 15,
        img: 'reaper.png',
        tier: 'minion',
        scale: 1.5, // 사신과 동일한 크기
        intents: [
            { type: 'attack', value: 10, icon: '👤', name: '분신 공격' }
        ],
        onDeath: function(state) {
            // 분신 사망 시 로그
            addLog(`👤 분신이 소멸했다...`, 'info');
        }
    }
];

// ==========================================
// 몬스터 등급 시스템
// ==========================================
const MonsterTier = {
    NORMAL: 'normal',
    ELITE: 'elite',
    BOSS: 'boss',
    MINION: 'minion'  // 소환된 작은 몬스터
};

// 몬스터 등급별 스케일 설정
const MonsterScale = {
    [MonsterTier.MINION]: { width: 120, maxHeight: 140 },   // 소환된 작은 몬스터
    [MonsterTier.NORMAL]: { width: 180, maxHeight: 200 },   // 일반 몬스터
    [MonsterTier.ELITE]: { width: 270, maxHeight: 300 },    // 엘리트 (1.5배)
    [MonsterTier.BOSS]: { width: 360, maxHeight: 400 }      // 보스 (2배)
};

// 몬스터 ID로 등급 가져오기
function getMonsterTier(monsterIdOrName) {
    // 보스 데이터베이스에서 찾기
    if (bossDatabase.find(e => e.id === monsterIdOrName || e.name === monsterIdOrName)) {
        return MonsterTier.BOSS;
    }
    // 엘리트 데이터베이스에서 찾기
    if (eliteDatabase.find(e => e.id === monsterIdOrName || e.name === monsterIdOrName)) {
        return MonsterTier.ELITE;
    }
    // 일반 몬스터
    return MonsterTier.NORMAL;
}

// 몬스터 객체의 등급 가져오기 (소환 여부 포함)
function getEnemyTier(enemy) {
    if (!enemy) return MonsterTier.NORMAL;
    
    // 명시적으로 지정된 등급이 있으면 사용
    if (enemy.tier) return enemy.tier;
    
    // 보스 여부 확인
    if (enemy.isBoss) return MonsterTier.BOSS;
    
    // 엘리트 여부 확인
    if (enemy.isElite) return MonsterTier.ELITE;
    
    // 소환된 몬스터면 MINION (작은 크기)
    if (enemy.isSummoned) return MonsterTier.MINION;
    
    // ID로 등급 판별
    return getMonsterTier(enemy.id || enemy.name);
}

// 몬스터 등급에 따른 CSS 클래스 가져오기
function getMonsterTierClass(enemy) {
    const tier = getEnemyTier(enemy);
    switch(tier) {
        case MonsterTier.BOSS: return 'boss';
        case MonsterTier.ELITE: return 'elite';
        case MonsterTier.MINION: return 'minion';
        default: return '';
    }
}

// 몬스터 등급에 따른 스케일 가져오기
function getMonsterScale(enemy) {
    const tier = getEnemyTier(enemy);
    const baseScale = MonsterScale[tier] || MonsterScale[MonsterTier.NORMAL];
    
    // 개별 몬스터의 scale 속성이 있으면 적용
    if (enemy.scale && enemy.scale !== 1) {
        return {
            width: Math.floor(baseScale.width * enemy.scale),
            maxHeight: Math.floor(baseScale.maxHeight * enemy.scale)
        };
    }
    
    return baseScale;
}

// ==========================================
// 몬스터 유틸리티 함수
// ==========================================

// 일반 전투용 몬스터 목록 (분열된 슬라임 등 특수 몬스터 제외)
function getNormalEnemies() {
    return enemyDatabase.filter(e => !e.isSplitForm);
}

// 이름으로 몬스터 데이터 찾기
function findEnemyByName(nameOrId) {
    return enemyDatabase.find(e => e.id === nameOrId || e.name === nameOrId) ||
           eliteDatabase.find(e => e.id === nameOrId || e.name === nameOrId) ||
           bossDatabase.find(e => e.id === nameOrId || e.name === nameOrId) ||
           (typeof minionDatabase !== 'undefined' && minionDatabase.find(e => e.id === nameOrId || e.name === nameOrId));
}

// 랜덤 일반 몬스터 가져오기
function getRandomNormalEnemy() {
    const normalEnemies = getNormalEnemies();
    return normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
}

// 랜덤 엘리트 몬스터 가져오기
function getRandomEliteEnemy() {
    return eliteDatabase[Math.floor(Math.random() * eliteDatabase.length)];
}

// 랜덤 보스 몬스터 가져오기
function getRandomBossEnemy() {
    return bossDatabase[Math.floor(Math.random() * bossDatabase.length)];
}

// 전역 접근
window.MonsterTier = MonsterTier;
window.MonsterScale = MonsterScale;
window.getMonsterTier = getMonsterTier;
window.getEnemyTier = getEnemyTier;
window.getMonsterTierClass = getMonsterTierClass;
window.getMonsterScale = getMonsterScale;

console.log('[Monster] 몬스터 데이터베이스 로드 완료');

