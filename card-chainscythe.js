// ==========================================
// 사슬 낫 카드 시스템
// ==========================================

const ChainScytheSystem = {
    // 적 위치 교환 (선택한 적을 1번째 위치로) - 연출 포함
    pullToFront(targetEnemy, onComplete) {
        if (!gameState.enemies || gameState.enemies.length <= 1) {
            console.log('[ChainScythe] 적이 1명이라 위치 교환 불가');
            if (onComplete) onComplete();
            return false;
        }
        
        const targetIndex = gameState.enemies.indexOf(targetEnemy);
        if (targetIndex <= 0) {
            console.log('[ChainScythe] 이미 첫 번째 위치');
            if (onComplete) onComplete();
            return false;
        }
        
        console.log(`[ChainScythe] 끌어오기 시작! 인덱스: ${targetIndex}`);
        
        // 끌어오기 연출 실행 (연출 끝나면 위치 교환)
        this.playPullAnimation(targetIndex, targetEnemy, () => {
            // 위치 교환: 타겟을 첫 번째로 (배열 순서만 바꿈)
            const firstEnemy = gameState.enemies[0];
            gameState.enemies[0] = targetEnemy;
            gameState.enemies[targetIndex] = firstEnemy;
            
            console.log(`[ChainScythe] ${targetEnemy.name}을(를) 첫 번째 위치로 끌어옴!`);
            
            // UI 재렌더링
            if (typeof renderEnemies === 'function') {
                renderEnemies(false);
            }
            
            // 브레이크 상태 복원
            this.restoreBreakStates();
            
            // 전체 UI 업데이트
            if (typeof updateUI === 'function') {
                updateUI();
            }
            
            if (onComplete) onComplete();
        });
        
        return true;
    },
    
    // 적 위치 변경 후 브레이크 상태 복원
    restoreBreakStates() {
        if (!gameState.enemies) return;
        
        gameState.enemies.forEach((enemy, index) => {
            const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
            if (!enemyEl) return;
            
            // 브레이크 가능 인텐트 상태 복원
            if (enemy.currentBreakRecipe && enemy.currentBreakRecipe.length > 0) {
                enemyEl.classList.add('threat-active');
                if (typeof BreakSystem !== 'undefined' && BreakSystem.updateBreakUI) {
                    BreakSystem.updateBreakUI(enemy);
                }
            }
            
            // 브로큰 상태 복원
            if (enemy.isBroken) {
                enemyEl.classList.add('enemy-broken');
                const intentEl = enemyEl.querySelector('.enemy-intent-display');
                if (intentEl) {
                    intentEl.classList.add('is-broken');
                    intentEl.style.display = 'none';
                }
                if (typeof BreakSystem !== 'undefined' && BreakSystem.updateBreakUI) {
                    BreakSystem.updateBreakUI(enemy);
                }
            }
        });
    },
    
    // ==========================================
    // 🔥 끌어오기 연출 (GSAP)
    // ==========================================
    playPullAnimation(fromIndex, targetEnemy, onComplete) {
        const container = document.getElementById('enemies-container');
        if (!container) {
            console.log('[ChainScythe] 컨테이너 없음');
            if (onComplete) onComplete();
            return;
        }
        
        const enemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
        const targetEl = enemyEls[fromIndex];
        const firstEl = enemyEls[0];
        
        console.log(`[ChainScythe] 적 요소들:`, enemyEls.length, '타겟:', targetEl, '첫번째:', firstEl);
        
        if (!targetEl || !firstEl) {
            console.log('[ChainScythe] 요소 없음');
            if (onComplete) onComplete();
            return;
        }
        
        // GSAP 없으면 기본 연출
        if (typeof gsap === 'undefined') {
            console.log('[ChainScythe] GSAP 없음, 기본 연출');
            this.playBasicPullAnimation(targetEl, firstEl, enemyEls, fromIndex, onComplete);
            return;
        }
        
        // 중간 적들 (1번 ~ 타겟 사이)
        const middleEnemies = [];
        for (let i = 1; i < fromIndex; i++) {
            if (enemyEls[i]) middleEnemies.push(enemyEls[i]);
        }
        
        const targetRect = targetEl.getBoundingClientRect();
        const firstRect = firstEl.getBoundingClientRect();
        const totalPullDistance = targetRect.left - firstRect.left;
        
        console.log(`[ChainScythe] 끌어올 거리: ${totalPullDistance}px, 중간 적: ${middleEnemies.length}마리`);
        
        // 타임라인 생성
        const tl = gsap.timeline({
            onComplete: () => {
                console.log('[ChainScythe] 애니메이션 완료');
                // 모든 요소 초기화
                gsap.set([targetEl, firstEl, ...middleEnemies], {
                    x: 0, y: 0, rotation: 0, scale: 1, filter: 'none'
                });
                if (onComplete) onComplete();
            }
        });
        
        // === 1단계: 사슬낫 날아감 + 타겟에 걸림 ===
        this.showChainThrow(targetEl);
        
        tl.to(targetEl, {
            filter: 'brightness(2.5) drop-shadow(0 0 20px #ff6600)',
            scale: 1.1,
            duration: 0.15,
            ease: 'power2.out'
        })
        .to(targetEl, {
            x: '+=15',
            duration: 0.04,
            yoyo: true,
            repeat: 5,
            ease: 'power1.inOut'
        })
        .to(targetEl, {
            scale: 1,
            filter: 'brightness(1.5) drop-shadow(0 0 10px #ff4400)',
            duration: 0.1
        });
        
        // === 2단계: 끌려오면서 중간 적들과 충돌 ===
        let currentPullX = 0;
        
        middleEnemies.forEach((midEnemy, i) => {
            const midRect = midEnemy.getBoundingClientRect();
            const distToMid = targetRect.left - midRect.left;
            
            // 중간 적까지 끌려옴 (빠르게)
            tl.to(targetEl, {
                x: -distToMid,
                duration: 0.12,
                ease: 'power2.in'
            });
            
            // 💥 충돌!
            tl.call(() => {
                this.showCollisionImpact(midEnemy, false);
                // 충돌 대미지 표시
                this.showCollisionDamage(midEnemy, 2);
            });
            
            // 중간 적 밀려남 + 플래시
            tl.to(midEnemy, {
                x: -50,
                rotation: -10,
                filter: 'brightness(2)',
                duration: 0.06,
                ease: 'power3.out'
            }, '<');
            
            // 타겟 살짝 멈춤 (충격)
            tl.to(targetEl, {
                x: -distToMid + 10,
                duration: 0.04,
                ease: 'power2.out'
            });
            
            // 중간 적 복귀
            tl.to(midEnemy, {
                x: 0,
                rotation: 0,
                filter: 'brightness(1)',
                duration: 0.2,
                ease: 'elastic.out(1, 0.5)'
            });
            
            currentPullX = distToMid;
        });
        
        // === 3단계: 최종 위치로 (1번 적과 큰 충돌) ===
        tl.to(targetEl, {
            x: -totalPullDistance + 30, // 약간 앞에서 멈춤
            duration: 0.15,
            ease: 'power3.in'
        });
        
        // 💥💥 최종 충돌!
        tl.call(() => {
            this.showCollisionImpact(firstEl, true);
            this.showCollisionDamage(firstEl, 5);
            this.screenShake(12, 200);
        });
        
        // 1번 적 크게 밀려남
        tl.to(firstEl, {
            x: -80,
            rotation: -15,
            scale: 0.9,
            filter: 'brightness(3) saturate(0)',
            duration: 0.08,
            ease: 'power4.out'
        }, '<');
        
        // 타겟 반동
        tl.to(targetEl, {
            x: -totalPullDistance + 50,
            filter: 'brightness(2)',
            duration: 0.06,
            ease: 'power2.out'
        }, '<');
        
        // 둘 다 복귀
        tl.to(firstEl, {
            x: 0,
            rotation: 0,
            scale: 1,
            filter: 'brightness(1)',
            duration: 0.25,
            ease: 'elastic.out(1, 0.4)'
        })
        .to(targetEl, {
            x: 0,
            filter: 'brightness(1)',
            duration: 0.2,
            ease: 'elastic.out(1, 0.5)'
        }, '<0.05');
    },
    
    // 기본 연출 (GSAP 없을 때)
    playBasicPullAnimation(targetEl, firstEl, allEnemies, fromIndex, onComplete) {
        targetEl.style.transition = 'transform 0.3s ease-in, filter 0.1s';
        targetEl.style.filter = 'brightness(2)';
        
        setTimeout(() => {
            targetEl.style.filter = '';
            targetEl.style.transition = '';
            if (onComplete) onComplete();
        }, 400);
    },
    
    // 사슬낫 던지기 연출
    showChainThrow(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const playerEl = document.getElementById('player');
        const playerRect = playerEl ? playerEl.getBoundingClientRect() : { left: 100, top: rect.top };
        
        // 사슬낫 이펙트
        const scythe = document.createElement('div');
        scythe.innerHTML = '⚔️';
        scythe.style.cssText = `
            position: fixed;
            left: ${playerRect.left + playerRect.width}px;
            top: ${playerRect.top + playerRect.height / 2}px;
            font-size: 40px;
            z-index: 10002;
            pointer-events: none;
            filter: drop-shadow(0 0 10px #ff6600);
        `;
        document.body.appendChild(scythe);
        
        // 날아가는 애니메이션
        gsap.to(scythe, {
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height / 2,
            rotation: 720,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
                // 걸렸다! 플래시
                scythe.innerHTML = '🪝';
                scythe.style.fontSize = '50px';
                gsap.to(scythe, {
                    scale: 1.5,
                    opacity: 0,
                    duration: 0.2,
                    onComplete: () => scythe.remove()
                });
            }
        });
    },
    
    // 충돌 이펙트
    showCollisionImpact(enemyEl, isFinal) {
        const rect = enemyEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // 충격파
        const impact = document.createElement('div');
        impact.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            z-index: 10001;
            pointer-events: none;
        `;
        
        const size = isFinal ? 80 : 50;
        const emoji = isFinal ? '💥' : '💢';
        
        impact.innerHTML = `
            <div style="
                font-size: ${size}px;
                animation: impactBurst 0.4s ease-out forwards;
            ">${emoji}</div>
        `;
        document.body.appendChild(impact);
        
        // 충격파 원
        const ring = document.createElement('div');
        ring.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            border: 3px solid ${isFinal ? '#ff4400' : '#ffaa00'};
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(ring);
        
        gsap.to(ring, {
            width: isFinal ? 200 : 120,
            height: isFinal ? 200 : 120,
            opacity: 0,
            borderWidth: 1,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => ring.remove()
        });
        
        setTimeout(() => impact.remove(), 500);
    },
    
    // 충돌 대미지 표시
    showCollisionDamage(enemyEl, damage) {
        const rect = enemyEl.getBoundingClientRect();
        
        const dmgText = document.createElement('div');
        dmgText.textContent = `-${damage}`;
        dmgText.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            transform: translateX(-50%);
            font-size: 28px;
            font-weight: bold;
            color: #ff6600;
            text-shadow: 2px 2px 0 #000, -1px -1px 0 #000;
            z-index: 10002;
            pointer-events: none;
        `;
        document.body.appendChild(dmgText);
        
        gsap.to(dmgText, {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => dmgText.remove()
        });
        
        // 실제 대미지 적용 (해당 적 찾아서)
        const index = parseInt(enemyEl.dataset.index);
        if (!isNaN(index) && gameState.enemies[index]) {
            const enemy = gameState.enemies[index];
            enemy.hp = Math.max(0, enemy.hp - damage);
            
            // HP바 업데이트
            const hpFill = enemyEl.querySelector('.enemy-hp-fill');
            if (hpFill) {
                const percent = (enemy.hp / enemy.maxHp) * 100;
                hpFill.style.width = percent + '%';
            }
            
            addLog(`충돌 대미지! ${enemy.name}에게 ${damage} 피해`, 'damage');
        }
    },
    
    // 화면 흔들림
    screenShake(intensity, duration) {
        const container = document.querySelector('.game-container') || document.body;
        
        gsap.to(container, {
            x: `random(-${intensity}, ${intensity})`,
            y: `random(-${intensity/2}, ${intensity/2})`,
            duration: 0.03,
            repeat: Math.floor(duration / 30),
            yoyo: true,
            ease: 'none',
            onComplete: () => gsap.set(container, { x: 0, y: 0 })
        });
    },
    
    
    // 첫 번째 위치 적인지 확인
    isFirstPosition(enemy) {
        if (!gameState.enemies || gameState.enemies.length === 0) return false;
        return gameState.enemies[0] === enemy;
    },
    
    // 첫 번째 위치 보너스 데미지 계산
    getFirstPositionBonus(baseDamage, bonusPercent = 50) {
        return Math.floor(baseDamage * (bonusPercent / 100));
    }
};

// ==========================================
// 카드 정의
// ==========================================
const ChainScytheCards = {
    // 사슬 낫 - 적을 끌어옴
    chainScythe: {
        id: 'chainScythe',
        name: '사슬 낫',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '⛓️',
        description: '<span class="damage">4</span> 데미지를 주고 대상을 <span class="keyword">첫 번째 위치</span>로 끌어옵니다.',
        requiresTarget: true,
        effect: (state) => {
            const enemy = state.targetEnemy || state.enemy;
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() 
                : document.querySelector('.enemy-unit');
            
            // 데미지
            dealDamage(enemy, 4);
            
            // 끌어오기
            setTimeout(() => {
                ChainScytheSystem.pullToFront(enemy);
                addLog(`⛓️ 사슬 낫으로 ${enemy.name}을(를) 앞으로 끌어왔다!`, 'special');
            }, 200);
        }
    },
    
    // 사슬 낫+ (강화)
    chainScytheP: {
        id: 'chainScytheP',
        name: '사슬 낫+',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '⛓️',
        description: '<span class="damage">7</span> 데미지를 주고 대상을 <span class="keyword">첫 번째 위치</span>로 끌어옵니다.',
        requiresTarget: true,
        upgraded: true,
        effect: (state) => {
            const enemy = state.targetEnemy || state.enemy;
            
            dealDamage(enemy, 7);
            
            setTimeout(() => {
                ChainScytheSystem.pullToFront(enemy);
                addLog(`⛓️ 사슬 낫+으로 ${enemy.name}을(를) 앞으로 끌어왔다!`, 'special');
            }, 200);
        }
    },
    
    // 처형자의 일격 - 첫 번째 위치 적에게 추가 데미지
    executionerStrike: {
        id: 'executionerStrike',
        name: '처형자의 일격',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '🗡️',
        description: '<span class="damage">8</span> 데미지. 대상이 <span class="keyword">첫 번째 위치</span>면 <span class="damage">+8</span> 추가 데미지.',
        requiresTarget: true,
        effect: (state) => {
            const enemy = state.targetEnemy || state.enemy;
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() 
                : document.querySelector('.enemy-unit');
            
            let damage = 8;
            let isFirst = ChainScytheSystem.isFirstPosition(enemy);
            
            if (isFirst) {
                damage += 8;
                addLog(`🗡️ 처형자의 일격! 첫 번째 위치 보너스 +8!`, 'critical');
                
                // 처형 VFX
                if (enemyEl) {
                    ChainScytheSystem.playExecutionVFX(enemyEl);
                }
            }
            
            dealDamage(enemy, damage);
            addLog(`처형자의 일격으로 ${damage} 데미지!`, 'damage');
        }
    },
    
    // 처형자의 일격+ (강화)
    executionerStrikeP: {
        id: 'executionerStrikeP',
        name: '처형자의 일격+',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '🗡️',
        description: '<span class="damage">10</span> 데미지. 대상이 <span class="keyword">첫 번째 위치</span>면 <span class="damage">+12</span> 추가 데미지.',
        requiresTarget: true,
        upgraded: true,
        effect: (state) => {
            const enemy = state.targetEnemy || state.enemy;
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() 
                : document.querySelector('.enemy-unit');
            
            let damage = 10;
            let isFirst = ChainScytheSystem.isFirstPosition(enemy);
            
            if (isFirst) {
                damage += 12;
                addLog(`🗡️ 처형자의 일격+! 첫 번째 위치 보너스 +12!`, 'critical');
                
                if (enemyEl) {
                    ChainScytheSystem.playExecutionVFX(enemyEl);
                }
            }
            
            dealDamage(enemy, damage);
            addLog(`처형자의 일격+으로 ${damage} 데미지!`, 'damage');
        }
    },
    
    // 끌어당기기 - 순수 유틸리티
    hookAndPull: {
        id: 'hookAndPull',
        name: '갈고리 투척',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 0,
        icon: '🪝',
        description: '대상을 <span class="keyword">첫 번째 위치</span>로 끌어옵니다.',
        requiresTarget: true,
        effect: (state) => {
            const enemy = state.targetEnemy || state.enemy;
            
            if (ChainScytheSystem.pullToFront(enemy)) {
                addLog(`🪝 ${enemy.name}을(를) 앞으로 끌어왔다!`, 'special');
            } else {
                addLog(`🪝 ${enemy.name}은(는) 이미 앞에 있다!`, 'info');
            }
        }
    }
};

// 처형 VFX
ChainScytheSystem.playExecutionVFX = function(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    
    // 처형 마크
    const mark = document.createElement('div');
    mark.innerHTML = '⚔️';
    mark.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top - 30}px;
        font-size: 40px;
        transform: translate(-50%, 0) scale(0);
        z-index: 10000;
        pointer-events: none;
        filter: drop-shadow(0 0 10px #ff0000);
        animation: executionMark 0.5s ease-out forwards;
    `;
    document.body.appendChild(mark);
    
    // 빨간 슬래시 효과
    const slash = document.createElement('div');
    slash.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: linear-gradient(45deg, transparent 40%, rgba(255,0,0,0.8) 50%, transparent 60%);
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        animation: executionSlash 0.3s ease-out 0.2s forwards;
    `;
    document.body.appendChild(slash);
    
    setTimeout(() => {
        mark.remove();
        slash.remove();
    }, 800);
};

// 스타일 추가
const chainScytheStyles = document.createElement('style');
chainScytheStyles.textContent = `
    @keyframes chainPull {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-150%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-200%, -50%) scale(0.8); opacity: 0; }
    }
    
    @keyframes impactBurst {
        0% { 
            transform: translate(-50%, -50%) scale(0) rotate(0deg); 
            opacity: 1; 
        }
        40% { 
            transform: translate(-50%, -50%) scale(1.5) rotate(20deg); 
            opacity: 1; 
        }
        100% { 
            transform: translate(-50%, -50%) scale(2) rotate(-10deg); 
            opacity: 0; 
        }
    }
    
    @keyframes impactPop {
        0% { 
            transform: translate(-50%, -50%) scale(0); 
            opacity: 1; 
        }
        30% { 
            transform: translate(-50%, -50%) scale(1.5); 
            opacity: 1; 
        }
        100% { 
            transform: translate(-50%, -50%) scale(2); 
            opacity: 0; 
        }
    }
    
    @keyframes executionMark {
        0% { transform: translate(-50%, 0) scale(0) rotate(-180deg); opacity: 0; }
        50% { transform: translate(-50%, 0) scale(1.5) rotate(0deg); opacity: 1; }
        100% { transform: translate(-50%, -20px) scale(1) rotate(0deg); opacity: 0; }
    }
    
    @keyframes executionSlash {
        0% { opacity: 0; transform: scaleX(0); }
        50% { opacity: 1; transform: scaleX(1.2); }
        100% { opacity: 0; transform: scaleX(1); }
    }
    
    .chain-collision-impact {
        filter: drop-shadow(0 0 20px currentColor);
    }
`;
document.head.appendChild(chainScytheStyles);

// ==========================================
// cardDatabase에 등록
// ==========================================
if (typeof cardDatabase !== 'undefined') {
    Object.keys(ChainScytheCards).forEach(cardId => {
        cardDatabase[cardId] = ChainScytheCards[cardId];
    });
    console.log('[ChainScythe] 사슬 낫 카드 등록 완료:', Object.keys(ChainScytheCards));
}

// 강화 매핑
if (typeof cardUpgradeMap !== 'undefined') {
    cardUpgradeMap['chainScythe'] = 'chainScytheP';
    cardUpgradeMap['executionerStrike'] = 'executionerStrikeP';
}

// 보상 풀에 추가
if (typeof rewardCardPool !== 'undefined') {
    rewardCardPool.push('chainScythe', 'executionerStrike', 'hookAndPull');
}

// 전역 등록
window.ChainScytheSystem = ChainScytheSystem;
window.ChainScytheCards = ChainScytheCards;

console.log('[ChainScythe] 사슬 낫 시스템 로드 완료!');
