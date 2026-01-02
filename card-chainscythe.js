// ==========================================
// 사슬 낫 카드 시스템
// ==========================================

const ChainScytheSystem = {
    // 적 위치 교환 (선택한 적을 1번째 위치로)
    pullToFront(targetEnemy) {
        if (!gameState.enemies || gameState.enemies.length <= 1) {
            console.log('[ChainScythe] 적이 1명이라 위치 교환 불가');
            return false;
        }
        
        const targetIndex = gameState.enemies.indexOf(targetEnemy);
        if (targetIndex <= 0) {
            console.log('[ChainScythe] 이미 첫 번째 위치');
            return false;
        }
        
        // 간단한 VFX 먼저
        this.playSimplePullVFX(targetIndex);
        
        // 위치 교환: 타겟을 첫 번째로 (배열 순서만 바꿈)
        const firstEnemy = gameState.enemies[0];
        gameState.enemies[0] = targetEnemy;
        gameState.enemies[targetIndex] = firstEnemy;
        
        console.log(`[ChainScythe] ${targetEnemy.name}을(를) 첫 번째 위치로 끌어옴!`);
        
        // UI 완전 재렌더링 (인텐트 포함)
        setTimeout(() => {
            // 적 컨테이너 완전히 다시 그리기 (애니메이션 없이)
            if (typeof renderEnemies === 'function') {
                renderEnemies(false);  // withEntrance = false
            }
            
            // 브레이크 상태 복원 - 각 적의 브레이크 레시피 UI 다시 표시
            this.restoreBreakStates();
            
            // 전체 UI 업데이트
            if (typeof updateUI === 'function') {
                updateUI();
            }
        }, 300);
        
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
                
                // BreakSystem의 updateBreakUI 사용
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
                
                // BreakSystem의 updateBreakUI 사용
                if (typeof BreakSystem !== 'undefined' && BreakSystem.updateBreakUI) {
                    BreakSystem.updateBreakUI(enemy);
                }
            }
        });
    },
    
    // GSAP 끌어오기 VFX - 충돌 연출 포함
    playSimplePullVFX(fromIndex) {
        const container = document.getElementById('enemies-container');
        if (!container) return;
        
        const enemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
        const targetEl = enemyEls[fromIndex];
        const firstEl = enemyEls[0];
        
        if (!targetEl || !firstEl || typeof gsap === 'undefined') return;
        
        // 중간에 있는 적들 (부딪힐 대상)
        const middleEnemies = enemyEls.slice(1, fromIndex);
        
        const targetRect = targetEl.getBoundingClientRect();
        const firstRect = firstEl.getBoundingClientRect();
        const pullDistance = targetRect.left - firstRect.left;
        
        // 타임라인 생성
        const tl = gsap.timeline();
        
        // 1. 사슬낫이 걸리는 연출 - 타겟 번쩍 + 흔들림
        tl.to(targetEl, {
            filter: 'brightness(2) drop-shadow(0 0 15px #ff6600)',
            duration: 0.1,
            ease: 'power2.out'
        })
        .to(targetEl, {
            x: 10,
            duration: 0.05,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut'
        })
        .to(targetEl, {
            filter: 'brightness(1.2) drop-shadow(0 0 8px #ff4400)',
            duration: 0.1
        });
        
        // 2. 끌려오면서 중간 적들과 충돌
        middleEnemies.forEach((midEnemy, i) => {
            const midRect = midEnemy.getBoundingClientRect();
            const distToMid = targetRect.left - midRect.left;
            
            // 충돌 지점까지 끌려옴
            tl.to(targetEl, {
                x: -distToMid,
                duration: 0.15,
                ease: 'power2.in'
            })
            // 충돌! - 화면 흔들림 + 충격파
            .call(() => this.showCollisionEffect(midEnemy, targetEl))
            // 중간 적 밀려남
            .to(midEnemy, {
                x: -30,
                rotation: -5,
                duration: 0.08,
                ease: 'power3.out'
            }, '<')
            // 중간 적 복귀
            .to(midEnemy, {
                x: 0,
                rotation: 0,
                duration: 0.15,
                ease: 'elastic.out(1, 0.5)'
            })
            // 짧은 딜레이
            .to({}, { duration: 0.05 });
        });
        
        // 3. 최종 위치로 끌려옴 (1번 적과 충돌)
        tl.to(targetEl, {
            x: -pullDistance,
            duration: 0.2,
            ease: 'power2.in'
        })
        // 1번 적과 충돌
        .call(() => this.showCollisionEffect(firstEl, targetEl, true))
        .to(firstEl, {
            x: -40,
            rotation: -8,
            scale: 0.95,
            duration: 0.1,
            ease: 'power3.out'
        }, '<')
        // 큰 충격 - 타겟도 반동
        .to(targetEl, {
            x: -pullDistance + 20,
            duration: 0.08,
            ease: 'power2.out'
        }, '<')
        // 복귀
        .to([targetEl, firstEl], {
            x: 0,
            rotation: 0,
            scale: 1,
            filter: 'brightness(1)',
            duration: 0.2,
            ease: 'elastic.out(1, 0.6)'
        });
        
        return tl;
    },
    
    // 충돌 이펙트
    showCollisionEffect(hitEnemy, pulledEnemy, isFinal = false) {
        const rect = hitEnemy.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // 충격파 이펙트
        const impact = document.createElement('div');
        impact.className = 'chain-collision-impact';
        impact.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            z-index: 10001;
            pointer-events: none;
        `;
        
        // 충돌 텍스트
        const size = isFinal ? 60 : 40;
        const color = isFinal ? '#ff4400' : '#ffaa00';
        impact.innerHTML = `
            <div style="
                font-size: ${size}px;
                font-weight: bold;
                color: ${color};
                text-shadow: 0 0 10px ${color}, 0 0 20px ${color};
                animation: impactPop 0.3s ease-out forwards;
            ">${isFinal ? '💥' : '⚡'}</div>
        `;
        document.body.appendChild(impact);
        
        // 히트 플래시
        gsap.to(hitEnemy, {
            filter: 'brightness(2) saturate(1.5)',
            duration: 0.05,
            yoyo: true,
            repeat: 1
        });
        
        // 화면 흔들림 (최종 충돌 시 더 강하게)
        if (isFinal) {
            this.screenShake(8, 150);
        } else {
            this.screenShake(3, 80);
        }
        
        // 정리
        setTimeout(() => impact.remove(), 400);
    },
    
    // 화면 흔들림
    screenShake(intensity, duration) {
        const gameContainer = document.querySelector('.game-container') || document.body;
        
        gsap.to(gameContainer, {
            x: intensity,
            duration: 0.02,
            repeat: Math.floor(duration / 40),
            yoyo: true,
            ease: 'power2.inOut',
            onComplete: () => {
                gsap.set(gameContainer, { x: 0 });
            }
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
