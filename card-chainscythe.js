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
    
    // 간단한 끌어오기 VFX
    playSimplePullVFX(fromIndex) {
        const container = document.getElementById('enemies-container');
        if (!container) return;
        
        const enemyEls = container.querySelectorAll('.enemy-unit');
        const targetEl = enemyEls[fromIndex];
        const firstEl = enemyEls[0];
        
        if (!targetEl || !firstEl) return;
        
        const targetRect = targetEl.getBoundingClientRect();
        const firstRect = firstEl.getBoundingClientRect();
        
        // 사슬낫 이펙트 (선 + 낫 아이콘)
        const effectContainer = document.createElement('div');
        effectContainer.className = 'chain-scythe-vfx';
        effectContainer.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            pointer-events: none;
        `;
        
        // SVG 사슬 선
        const startX = targetRect.left + targetRect.width / 2;
        const startY = targetRect.top + targetRect.height / 2;
        const endX = firstRect.left + firstRect.width / 2;
        const endY = firstRect.top + firstRect.height / 2;
        
        effectContainer.innerHTML = `
            <svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible;">
                <line class="chain-line-anim" 
                    x1="${startX}" y1="${startY}" 
                    x2="${startX}" y2="${startY}" 
                    stroke="#888" stroke-width="3" stroke-dasharray="8,4"/>
            </svg>
            <div class="scythe-icon" style="
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                transform: translate(-50%, -50%);
                font-size: 32px;
                filter: drop-shadow(0 0 8px #fff);
            ">🪝</div>
        `;
        document.body.appendChild(effectContainer);
        
        const chainLine = effectContainer.querySelector('.chain-line-anim');
        const scytheIcon = effectContainer.querySelector('.scythe-icon');
        
        // 타겟 플래시
        targetEl.style.transition = 'filter 0.1s, transform 0.3s ease-in';
        targetEl.style.filter = 'brightness(1.5) drop-shadow(0 0 10px #ff6600)';
        
        // 사슬 선 애니메이션
        let progress = 0;
        const animDuration = 200;
        const startTime = Date.now();
        
        const animate = () => {
            progress = (Date.now() - startTime) / animDuration;
            if (progress > 1) progress = 1;
            
            const currentX = startX + (endX - startX) * progress;
            const currentY = startY + (endY - startY) * progress;
            
            chainLine.setAttribute('x2', currentX);
            chainLine.setAttribute('y2', currentY);
            scytheIcon.style.left = currentX + 'px';
            scytheIcon.style.top = currentY + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 끌어오기 완료 - 플래시 효과
                targetEl.style.filter = 'brightness(2)';
                setTimeout(() => {
                    targetEl.style.filter = '';
                    targetEl.style.transform = '';
                    effectContainer.remove();
                }, 100);
            }
        };
        
        animate();
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
