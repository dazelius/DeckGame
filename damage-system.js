// ==========================================
// Shadow Deck - 데미지 시스템
// ==========================================

// 데미지 처리 (유물 보너스 포함)
function dealDamage(target, amount, card = null) {
    // 적인지 확인 (다중 적 지원)
    const isEnemy = gameState.enemies && gameState.enemies.includes(target);
    const isPlayer = target === gameState.player;
    
    // 타겟 요소 찾기
    let targetEl;
    if (isPlayer) {
        targetEl = document.getElementById('player');
    } else if (isEnemy) {
        // 다중 적 컨테이너에서 찾기
        const enemyIndex = gameState.enemies.indexOf(target);
        const container = document.getElementById('enemies-container');
        if (container) {
            targetEl = container.querySelector(`[data-index="${enemyIndex}"]`);
        }
        if (!targetEl) {
            targetEl = document.getElementById('enemy');
        }
    } else {
        targetEl = document.getElementById('enemy');
    }
    
    // 카드가 없으면 현재 사용 중인 카드 가져오기
    const activeCard = card || (gameState.currentCard || null);
    
    // 유물 보너스 데미지 계산 (플레이어가 적에게 공격할 때만)
    let totalDamage = amount;
    let bonusDamage = 0;
    
    // 적에게 데미지를 줄 때 유물 보너스 계산
    if (isEnemy && typeof RelicSystem !== 'undefined') {
        // activeCard가 없어도 콤보 보너스 적용 (적에게 데미지 = 공격 행위)
        const cardForBonus = activeCard || { type: 'attack', name: 'attack' };
        bonusDamage = RelicSystem.calculateBonusDamage(amount, cardForBonus, gameState);
        totalDamage += bonusDamage;
    }
    
    // 🌑 은신 보너스 데미지 (도적 전용 - 공격 시 은신 스택을 데미지로 전환)
    let ambushBonus = 0;
    if (isEnemy && typeof StealthSystem !== 'undefined' && StealthSystem.hasStacks()) {
        const stealthResult = StealthSystem.onAttackCardPlayed(activeCard);
        if (stealthResult.consumed) {
            ambushBonus = stealthResult.bonusDamage;
            totalDamage += ambushBonus;
            console.log(`[Stealth] 기습 보너스: +${ambushBonus} 데미지`);
            
            // 🗡️ 앰부시 VFX
            if (targetEl) {
                showAmbushVFX(targetEl, ambushBonus);
            }
        }
    }
    
    // 🗡️ 독 바른 칼날 - 공격 시 출혈 추가
    if (isEnemy && gameState.player.poisonedBlade && gameState.player.poisonedBlade > 0) {
        const poisonBleed = gameState.player.poisonedBlade;
        let actualBleed = poisonBleed;
        
        // 출혈 숙달 보너스
        if (gameState.player.bleedMastery) {
            actualBleed += gameState.player.bleedMastery;
        }
        
        target.bleed = (target.bleed || 0) + actualBleed;
        console.log(`[PoisonedBlade] 독 바른 칼날 출혈 +${actualBleed}`);
        
        // 출혈 VFX
        if (targetEl && typeof RogueCardSystem !== 'undefined') {
            setTimeout(() => {
                RogueCardSystem.showBleedVFX(targetEl, actualBleed);
            }, 100);
        }
    }
    
    // 크리티컬 데미지 배율 적용
    if (isEnemy && gameState.currentCritical && gameState.currentCritical.isCritical) {
        const critMultiplier = gameState.currentCritical.multiplier || 2.0;
        totalDamage = Math.floor(totalDamage * critMultiplier);
        console.log(`[Critical] x${critMultiplier} = ${totalDamage} damage`);
    }
    
    // 공격력 감소 디버프 적용 (플레이어가 적에게 공격할 때만)
    if (isEnemy && gameState.player.weakenAttack && gameState.player.weakenAttack > 0) {
        totalDamage = Math.max(0, totalDamage - gameState.player.weakenAttack);
        console.log(`공격력 감소: -${gameState.player.weakenAttack} 데미지`);
    }
    
    // 취약 상태 보너스 (50% 추가 데미지) - 적에게 공격할 때
    if (isEnemy && target.vulnerable && target.vulnerable > 0) {
        const vulnerableBonus = Math.floor(totalDamage * 0.5);
        totalDamage += vulnerableBonus;
        console.log(`적 취약 보너스: +${vulnerableBonus} 데미지`);
    }
    
    // 🔨 브레이크 상태 보너스 (50% 추가 데미지)
    if (isEnemy && target.isBroken) {
        const breakBonus = Math.floor(totalDamage * 0.5);
        totalDamage += breakBonus;
        console.log(`[Break] 브레이크 보너스: +${breakBonus} 데미지 (x1.5)`);
    }
    
    // 플레이어가 취약일 때 받는 데미지 50% 증가
    if (isPlayer && gameState.player.vulnerable && gameState.player.vulnerable > 0) {
        const vulnerableBonus = Math.floor(totalDamage * 0.5);
        totalDamage += vulnerableBonus;
        console.log(`플레이어 취약: +${vulnerableBonus} 추가 피해!`);
        addLog(`💔 취약 상태! +${vulnerableBonus} 추가 피해!`, 'debuff');
    }
    
    // 데미지 계산
    const result = ShieldSystem.applyDamage(target, totalDamage);
    
    // HP 데미지 팝업 (방어도 팝업은 ShieldSystem에서 처리)
    if (result.actualDamage > 0 && targetEl) {
        // 크리티컬인지 확인
        const isCriticalHit = gameState.currentCritical?.isCritical || false;
        showDamagePopup(targetEl, result.actualDamage, isCriticalHit ? 'critical' : 'damage');
        
        // 🎭 스프라이트 피격 애니메이션 (파닥파닥!)
        if (typeof SpriteAnimation !== 'undefined') {
            if (isPlayer) {
                SpriteAnimation.playerHit(result.actualDamage);
            } else if (isEnemy) {
                SpriteAnimation.enemyHit(targetEl, result.actualDamage);
            }
        }
        
        // 🔊 타격 사운드 재생
        if (typeof SoundSystem !== 'undefined') {
            if (isCriticalHit) {
                SoundSystem.playHit('critical');
            } else if (result.actualDamage >= 15) {
                SoundSystem.playHit('heavy');
            } else if (result.actualDamage >= 5) {
                SoundSystem.playHit('normal');
            } else {
                SoundSystem.playHit('light');
            }
        }
        
        // 새로운 타격감 시스템 사용
        if (typeof HitEffects !== 'undefined') {
            if (isCriticalHit) {
                HitEffects.criticalHit(targetEl, result.actualDamage);
            } else if (result.actualDamage >= 15) {
                HitEffects.heavyHit(targetEl, result.actualDamage);
            } else {
                HitEffects.normalHit(targetEl, result.actualDamage);
            }
        } else {
            // 폴백: 기존 CSS 클래스 사용
            targetEl.classList.add(isCriticalHit ? 'critical-hit-effect' : 'hit-effect');
            setTimeout(() => {
                targetEl.classList.remove('hit-effect');
                targetEl.classList.remove('critical-hit-effect');
            }, isCriticalHit ? 500 : 300);
        }
        
        // 플레이어가 피해를 받았을 때 유물 효과
        if (isPlayer && typeof RelicSystem !== 'undefined') {
            RelicSystem.ownedRelics.forEach(relic => {
                if (relic.onDamageTaken) {
                    relic.onDamageTaken(gameState, result.actualDamage);
                }
            });
        }
        
        // 적이 피해를 받았을 때 적의 onDamageTaken 호출 (가시 수호자 등)
        if (isEnemy && target.onDamageTaken) {
            target.onDamageTaken.call(target, result.actualDamage, gameState);
        }
        
        // 적에게 데미지 입힐 때 유물 onDealDamage 콜백
        if (isEnemy && typeof RelicSystem !== 'undefined') {
            const targetIndex = gameState.enemies.indexOf(target);
            RelicSystem.ownedRelics.forEach(relic => {
                if (relic.onDealDamage) {
                    relic.onDealDamage(gameState, targetIndex, result.actualDamage);
                }
            });
        }
        
        // 🔨 브레이크 시스템 - 인텐트 기반 레시피 진행
        if (isEnemy && typeof BreakSystem !== 'undefined' && BreakSystem.hasBreakableIntent(target)) {
            BreakSystem.onAttack(target, activeCard, 1);
        }
    }
    
    // 적에게 공격 시도 시 onDamageTaken 호출 (방어도로 막혀도 가시 반사 발동)
    // actualDamage가 0이어도 공격 시도 자체에 반응하는 패시브용
    if (isEnemy && target.onDamageTaken && result.actualDamage === 0 && result.blockedDamage > 0) {
        target.onDamageTaken.call(target, totalDamage, gameState);
    }
    
    // 🎭 방어도로 막혔을 때도 작은 파닥파닥
    if (result.blockedDamage > 0 && result.actualDamage === 0 && targetEl) {
        if (typeof SpriteAnimation !== 'undefined') {
            if (isPlayer) {
                SpriteAnimation.playerDefend(result.blockedDamage);
            } else if (isEnemy) {
                SpriteAnimation.enemyDefend(targetEl, result.blockedDamage);
            }
        }
    }
    
    // 분열 체크 (슬라임)
    if (isEnemy && target.canSplit && typeof checkSlimeSplit !== 'undefined') {
        const enemyIndex = gameState.enemies.indexOf(target);
        const didSplit = checkSlimeSplit(target, enemyIndex);
        if (didSplit) {
            // 분열했으면 여기서 종료 (새로운 적들이 생성됨)
            result.bonusDamage = bonusDamage;
            return result;
        }
    }
    
    // 전체 UI 업데이트
    updateUI();
    if (typeof updateEnemiesUI !== 'undefined') {
        updateEnemiesUI();
    }
    
    // 그림자 분신 따라 공격 (분신의 공격이 아닐 때만)
    if (isEnemy && !window._isCloneAttack && typeof ShadowCloneSystem !== 'undefined' && ShadowCloneSystem.clones.length > 0) {
        // 분신 공격 시작 (플레이어와 거의 동시에)
        setTimeout(() => {
            ShadowCloneSystem.onAttackCardPlayed(amount, target, targetEl);
        }, 50);
    }
    
    // 적이 피해를 받았고, 죽었을 수 있으면 승리 체크
    if (isEnemy && target.hp <= 0) {
        // 🩸 오버킬 시스템에 등록 (HP가 음수면 오버킬)
        if (typeof OverkillSystem !== 'undefined') {
            const enemyIndex = gameState.enemies.indexOf(target);
            OverkillSystem.registerOverkill(target, totalDamage, enemyIndex);
        }
        
        setTimeout(() => {
            if (typeof checkEnemyDefeated === 'function') {
                checkEnemyDefeated();
            }
        }, 100);
    }
    
    // 플레이어가 피해를 받았고, 죽었으면 게임오버 체크
    if (isPlayer && gameState.player.hp <= 0) {
        console.log('[DamageSystem] 플레이어 사망!');
        setTimeout(() => {
            if (typeof gameOver === 'function') {
                gameOver();
            }
        }, 300);
    }
    
    // 보너스 데미지 정보 추가
    result.bonusDamage = bonusDamage;
    
    return result;
}

// ==========================================
// 데미지 팝업 표시
// ==========================================
function showDamagePopup(element, value, type) {
    const popup = document.createElement('div');
    popup.className = `damage-popup ${type}`;
    
    if (type === 'block') {
        popup.textContent = `🛡️ ${value}`;
    } else if (type === 'bleed') {
        popup.textContent = `🩸 ${value}`;
        popup.style.color = '#ef4444';
        popup.style.textShadow = '0 0 10px #ef4444, 0 0 20px #dc2626';
    } else if (type === 'thorn') {
        popup.textContent = `🌵 ${value}`;
        popup.style.color = '#22c55e';
    } else if (type === 'critical') {
        // 크리티컬 데미지 - 화려한 연출
        popup.className = 'damage-popup critical-damage';
        popup.innerHTML = `
            <span class="crit-label">CRITICAL!</span>
            <span class="crit-value">-${value}</span>
        `;
    } else {
        popup.textContent = `-${value}`;
    }
    
    const rect = element.getBoundingClientRect();
    
    // 랜덤 오프셋 (개체 근처에서 흩어지게)
    const randomOffsetX = (Math.random() - 0.5) * 60;  // -30 ~ +30px
    const randomOffsetY = (Math.random() - 0.5) * 40;  // -20 ~ +20px
    
    // 크리티컬은 중앙에, 일반 데미지는 랜덤하게
    if (type === 'critical') {
        popup.style.left = `${rect.left + rect.width / 2 - 50}px`;
        popup.style.top = `${rect.top + rect.height / 3}px`;
    } else {
        popup.style.left = `${rect.left + rect.width / 2 - 30 + randomOffsetX}px`;
        popup.style.top = `${rect.top + rect.height / 3 + randomOffsetY}px`;
    }
    
    // 살짝 회전도 추가 (더 자연스럽게)
    if (type !== 'critical') {
        const randomRotation = (Math.random() - 0.5) * 16; // -8 ~ +8도
        popup.style.setProperty('--random-rotation', `${randomRotation}deg`);
    }
    
    document.body.appendChild(popup);
    
    setTimeout(() => popup.remove(), type === 'critical' ? 1500 : 1000);
}

// ==========================================
// 취약 이펙트 표시
// ==========================================
function showVulnerableEffect(element) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    
    // 취약 텍스트 팝업
    const popup = document.createElement('div');
    popup.className = 'vulnerable-popup';
    popup.innerHTML = '💔 취약!';
    popup.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
        transform: translate(-50%, -50%);
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 1.5rem;
        font-weight: 900;
        color: #a855f7;
        text-shadow: 0 0 20px rgba(168, 85, 247, 0.8), 2px 2px 0 #000;
        z-index: 1000;
        pointer-events: none;
        animation: vulnerablePop 0.8s ease-out forwards;
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

// ==========================================
// 에너지 획득 이펙트
// ==========================================
function showEnergyGainEffect(amount) {
    const energyOrb = document.getElementById('energy-container');
    if (!energyOrb) return;
    
    const rect = energyOrb.getBoundingClientRect();
    
    // 에너지 텍스트 즉시 업데이트
    const energyText = document.getElementById('energy-text');
    if (energyText && gameState) {
        energyText.textContent = `${gameState.player.energy}/${gameState.player.maxEnergy}`;
    }
    
    // 에너지 획득 팝업
    const popup = document.createElement('div');
    popup.innerHTML = `⚡ +${amount}`;
    popup.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top}px;
        transform: translateX(-50%);
        font-family: 'Cinzel', serif;
        font-size: 2rem;
        font-weight: 900;
        color: #fbbf24;
        text-shadow: 0 0 20px rgba(251, 191, 36, 0.8), 2px 2px 0 #000;
        z-index: 1000;
        pointer-events: none;
        animation: energyGainPop 1s ease-out forwards;
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
    
    // 에너지 오브 반짝임
    energyOrb.style.filter = 'brightness(2)';
    energyOrb.style.transform = 'scale(1.2)';
    setTimeout(() => {
        energyOrb.style.filter = '';
        energyOrb.style.transform = '';
    }, 300);
}

// ==========================================
// CSS 애니메이션 주입
// ==========================================
const damageSystemStyles = document.createElement('style');
damageSystemStyles.id = 'damage-system-styles';
damageSystemStyles.textContent = `
    /* 데미지 팝업 기본 스타일 */
    .damage-popup {
        position: fixed;
        font-family: 'Cinzel', serif;
        font-size: 1.8rem;
        font-weight: 900;
        color: #ef4444;
        text-shadow: 0 0 10px rgba(239, 68, 68, 0.8), 2px 2px 0 #000;
        pointer-events: none;
        z-index: 1000;
        animation: damagePopFloat 1s ease-out forwards;
    }
    
    @keyframes damagePopFloat {
        0% { 
            opacity: 1; 
            transform: translateY(0) scale(1) rotate(var(--random-rotation, 0deg)); 
        }
        20% { 
            transform: translateY(-10px) scale(1.2) rotate(var(--random-rotation, 0deg)); 
        }
        100% { 
            opacity: 0; 
            transform: translateY(-50px) scale(0.8) rotate(var(--random-rotation, 0deg)); 
        }
    }
    
    /* 크리티컬 데미지 */
    .damage-popup.critical-damage {
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: criticalDamagePop 1.5s ease-out forwards;
    }
    
    .damage-popup.critical-damage .crit-label {
        font-size: 1.2rem;
        color: #fbbf24;
        text-shadow: 0 0 15px #fbbf24, 0 0 30px #f59e0b;
        animation: critLabelShake 0.3s ease-out;
    }
    
    .damage-popup.critical-damage .crit-value {
        font-size: 2.5rem;
        color: #ef4444;
        text-shadow: 0 0 20px #ef4444, 0 0 40px #dc2626, 3px 3px 0 #000;
    }
    
    @keyframes criticalDamagePop {
        0% { 
            opacity: 0; 
            transform: scale(0.5); 
        }
        15% { 
            opacity: 1; 
            transform: scale(1.5); 
        }
        30% { 
            transform: scale(1.2); 
        }
        100% { 
            opacity: 0; 
            transform: scale(1) translateY(-30px); 
        }
    }
    
    @keyframes critLabelShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    /* 취약 팝업 */
    @keyframes vulnerablePop {
        0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.5); 
        }
        30% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1.3); 
        }
        100% { 
            opacity: 0; 
            transform: translate(-50%, calc(-50% - 30px)) scale(1); 
        }
    }
    
    /* 에너지 획득 팝업 */
    @keyframes energyGainPop {
        0% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(20px) scale(0.5); 
        }
        30% { 
            opacity: 1; 
            transform: translateX(-50%) translateY(-10px) scale(1.3); 
        }
        100% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-40px) scale(1); 
        }
    }
    
    /* 피격 효과 */
    .hit-effect {
        animation: hitShake 0.3s ease-out;
    }
    
    @keyframes hitShake {
        0%, 100% { transform: translateX(0); filter: brightness(1); }
        25% { transform: translateX(-8px); filter: brightness(1.5) saturate(0.5); }
        50% { transform: translateX(8px); filter: brightness(1.3); }
        75% { transform: translateX(-4px); filter: brightness(1.1); }
    }
    
    .critical-hit-effect {
        animation: criticalHitShake 0.5s ease-out;
    }
    
    @keyframes criticalHitShake {
        0% { transform: scale(1); filter: brightness(1); }
        10% { transform: scale(0.9) rotate(-5deg); filter: brightness(2) saturate(0); }
        30% { transform: scale(1.1) rotate(3deg); filter: brightness(1.5) saturate(2); }
        50% { transform: scale(0.95) rotate(-2deg); filter: brightness(1.3); }
        70% { transform: scale(1.05) rotate(1deg); filter: brightness(1.1); }
        100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
    }
    
    /* 그림자 웅덩이 */
    .ambush-shadow-pool {
        position: fixed;
        width: 200px;
        height: 60px;
        background: radial-gradient(ellipse at center,
            rgba(139, 92, 246, 0.8) 0%,
            rgba(30, 27, 75, 0.7) 40%,
            transparent 70%);
        border-radius: 50%;
        z-index: 1995;
        pointer-events: none;
        animation: shadowPoolGrow 0.6s ease-out forwards;
    }
    
    @keyframes shadowPoolGrow {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        30% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    }
    
    /* 그림자에서 튀어나오는 실루엣 */
    .ambush-silhouette {
        position: fixed;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center bottom;
        transform: translate(-50%, -100%);
        filter: brightness(0) drop-shadow(0 0 20px rgba(139, 92, 246, 1));
        z-index: 1996;
        pointer-events: none;
        animation: silhouetteRise 0.5s ease-out forwards;
    }
    
    @keyframes silhouetteRise {
        0% { 
            transform: translate(-50%, -30%) scale(0.5); 
            opacity: 0;
            filter: brightness(0) blur(10px);
        }
        30% { 
            transform: translate(-50%, -110%) scale(1.1); 
            opacity: 1;
            filter: brightness(0) drop-shadow(0 0 30px rgba(139, 92, 246, 1));
        }
        60% {
            transform: translate(-50%, -100%) scale(1);
            filter: brightness(0.3) drop-shadow(0 0 20px rgba(139, 92, 246, 0.8));
        }
        100% { 
            transform: translate(-50%, -100%) scale(1); 
            opacity: 0;
            filter: brightness(0) blur(5px);
        }
    }
    
    /* X자 슬래시 */
    .ambush-x-slash {
        position: fixed;
        width: 180px;
        height: 12px;
        background: linear-gradient(90deg, 
            transparent 0%,
            rgba(251, 191, 36, 0.2) 10%,
            rgba(251, 191, 36, 1) 50%,
            rgba(251, 191, 36, 0.2) 90%,
            transparent 100%);
        transform: translate(-50%, -50%) rotate(var(--slash-angle, 0deg));
        z-index: 2000;
        pointer-events: none;
        animation: xSlash 0.4s ease-out forwards;
        box-shadow: 
            0 0 30px rgba(251, 191, 36, 1),
            0 0 60px rgba(245, 158, 11, 0.7);
    }
    
    @keyframes xSlash {
        0% { 
            transform: translate(-50%, -50%) rotate(var(--slash-angle)) scaleX(0); 
            opacity: 0;
        }
        20% { 
            transform: translate(-50%, -50%) rotate(var(--slash-angle)) scaleX(1.3); 
            opacity: 1;
        }
        100% { 
            transform: translate(-50%, -50%) rotate(var(--slash-angle)) scaleX(0.3); 
            opacity: 0;
        }
    }
    
    /* 타격 임팩트 */
    .ambush-impact {
        position: fixed;
        width: 100px;
        height: 100px;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle,
            rgba(255, 255, 255, 1) 0%,
            rgba(251, 191, 36, 0.8) 30%,
            rgba(139, 92, 246, 0.4) 60%,
            transparent 80%);
        border-radius: 50%;
        z-index: 2001;
        pointer-events: none;
        animation: impactBurst 0.4s ease-out forwards;
    }
    
    @keyframes impactBurst {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }
    
    /* 앰부시 텍스트 */
    .ambush-text {
        position: fixed;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translateX(-50%);
        z-index: 2002;
        pointer-events: none;
        animation: ambushTextPop 1.2s ease-out forwards;
    }
    
    .ambush-label {
        font-family: 'Cinzel', serif;
        font-size: 2.5rem;
        font-weight: 900;
        color: #fbbf24;
        text-shadow: 
            0 0 40px rgba(251, 191, 36, 1),
            0 0 80px rgba(245, 158, 11, 0.8),
            4px 4px 0 #000,
            -2px -2px 0 #000;
        letter-spacing: 6px;
    }
    
    .ambush-bonus {
        font-family: 'Cinzel', serif;
        font-size: 1.6rem;
        font-weight: 900;
        color: #a78bfa;
        text-shadow: 
            0 0 25px rgba(139, 92, 246, 1),
            3px 3px 0 #000;
        margin-top: -5px;
    }
    
    @keyframes ambushTextPop {
        0% { 
            transform: translateX(-50%) scale(0) rotate(-15deg); 
            opacity: 0; 
        }
        15% { 
            transform: translateX(-50%) scale(1.6) rotate(5deg); 
            opacity: 1; 
        }
        30% {
            transform: translateX(-50%) scale(1.3) rotate(-2deg);
        }
        100% { 
            transform: translateX(-50%) scale(1) translateY(-50px) rotate(0deg); 
            opacity: 0; 
        }
    }
    
    /* 앰부시 파티클 */
    .ambush-particle {
        position: fixed;
        width: 10px;
        height: 10px;
        background: radial-gradient(circle, #fbbf24 0%, #a78bfa 40%, #4c1d95 70%, transparent 90%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 1998;
        pointer-events: none;
        animation: ambushParticle 0.6s ease-out forwards;
    }
    
    @keyframes ambushParticle {
        0% { 
            transform: translate(-50%, -50%) scale(1.5); 
            opacity: 1;
        }
        100% { 
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); 
            opacity: 0;
        }
    }
    
    /* 앰부시 플래시 */
    .ambush-flash {
        position: fixed;
        inset: 0;
        background: radial-gradient(ellipse at center, 
            rgba(251, 191, 36, 0.4) 0%, 
            rgba(139, 92, 246, 0.2) 40%,
            transparent 70%);
        z-index: 1997;
        pointer-events: none;
        animation: ambushFlash 0.15s ease-out forwards;
    }
    
    @keyframes ambushFlash {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    /* 앰부시 히트 */
    .ambush-hit {
        animation: ambushHitShake 0.4s ease-out !important;
    }
    
    @keyframes ambushHitShake {
        0% { transform: scale(1); filter: brightness(1); }
        15% { transform: scale(0.85) rotate(-8deg); filter: brightness(2) hue-rotate(30deg); }
        30% { transform: scale(1.15) rotate(5deg); filter: brightness(1.5); }
        50% { transform: scale(0.95) rotate(-3deg); filter: brightness(1.3); }
        70% { transform: scale(1.05) rotate(2deg); filter: brightness(1.1); }
        100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
    }
`;

// 스타일이 없으면 추가
if (!document.getElementById('damage-system-styles')) {
    document.head.appendChild(damageSystemStyles);
}

// ==========================================
// 🗡️ 앰부시 VFX (기습 공격)
// ==========================================
function showAmbushVFX(targetEl, bonusDamage) {
    if (!targetEl) return;
    
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    console.log('[Ambush VFX] 실행!', centerX, centerY, bonusDamage);
    
    // 🔊 앰부시 사운드 재생
    if (typeof SoundSystem !== 'undefined') {
        SoundSystem.playAmbush();
    } else {
        try {
            const sound = new Audio('sound/ambush.mp3');
            sound.volume = 0.7;
            sound.play().catch(() => {});
        } catch (e) {}
    }
    
    // 1. 화면 전체 플래시
    const fullFlash = document.createElement('div');
    fullFlash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(139, 92, 246, 0.4);
        z-index: 9999;
        pointer-events: none;
    `;
    document.body.appendChild(fullFlash);
    setTimeout(() => fullFlash.remove(), 100);
    
    // 2. 검은 연막 폭발
    const smoke = document.createElement('div');
    smoke.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 250px;
        height: 250px;
        background: radial-gradient(circle,
            rgba(0, 0, 0, 1) 0%,
            rgba(76, 29, 149, 1) 30%,
            rgba(139, 92, 246, 0.8) 50%,
            transparent 70%);
        border-radius: 50%;
        z-index: 10000;
        pointer-events: none;
        transform: translate(-50%, -50%) scale(0);
    `;
    document.body.appendChild(smoke);
    
    let scale = 0;
    let opacity = 1;
    const animateSmoke = () => {
        scale += 0.15;
        opacity -= 0.05;
        smoke.style.transform = `translate(-50%, -50%) scale(${scale})`;
        smoke.style.opacity = opacity;
        if (opacity > 0) {
            requestAnimationFrame(animateSmoke);
        } else {
            smoke.remove();
        }
    };
    requestAnimationFrame(animateSmoke);
    
    // 3. 보라색 링 퍼짐
    const ring = document.createElement('div');
    ring.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 100px;
        height: 100px;
        border: 6px solid #a78bfa;
        box-shadow: 0 0 30px #a78bfa, 0 0 60px #8b5cf6;
        border-radius: 50%;
        z-index: 10001;
        pointer-events: none;
        transform: translate(-50%, -50%) scale(0);
    `;
    document.body.appendChild(ring);
    
    let ringScale = 0;
    let ringOpacity = 1;
    const animateRing = () => {
        ringScale += 0.12;
        ringOpacity -= 0.04;
        ring.style.transform = `translate(-50%, -50%) scale(${ringScale})`;
        ring.style.opacity = ringOpacity;
        if (ringOpacity > 0 && ringScale < 4) {
            requestAnimationFrame(animateRing);
        } else {
            ring.remove();
        }
    };
    requestAnimationFrame(animateRing);
    
    // 4. AMBUSH 텍스트
    const text = document.createElement('div');
    text.innerHTML = `<div style="
        font-family: 'Cinzel', serif;
        font-size: 3rem;
        font-weight: 900;
        color: #fbbf24;
        text-shadow: 0 0 40px #fbbf24, 0 0 80px #f59e0b, 4px 4px 0 #000, -2px -2px 0 #000;
        letter-spacing: 8px;
    ">AMBUSH!</div>
    <div style="
        font-family: 'Cinzel', serif;
        font-size: 2rem;
        font-weight: 900;
        color: #c4b5fd;
        text-shadow: 0 0 30px #a78bfa, 3px 3px 0 #000;
    ">+${bonusDamage}</div>`;
    text.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${rect.top - 80}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translateX(-50%) scale(0);
        z-index: 10002;
        pointer-events: none;
        animation: ambushTextAnim 1s ease-out forwards;
    `;
    
    const textStyle = document.createElement('style');
    textStyle.textContent = `
        @keyframes ambushTextAnim {
            0% { transform: translateX(-50%) scale(0); opacity: 0; }
            20% { transform: translateX(-50%) scale(1.3); opacity: 1; }
            40% { transform: translateX(-50%) scale(1); opacity: 1; }
            100% { transform: translateX(-50%) translateY(-50px) scale(1); opacity: 0; }
        }
    `;
    document.head.appendChild(textStyle);
    document.body.appendChild(text);
    
    setTimeout(() => {
        text.remove();
        textStyle.remove();
    }, 1000);
    
    // 5. 타겟 흔들림
    const originalTransform = targetEl.style.transform || '';
    let shakeCount = 0;
    const shake = () => {
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 10;
        targetEl.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
        shakeCount++;
        if (shakeCount < 10) {
            setTimeout(shake, 30);
        } else {
            targetEl.style.transform = originalTransform;
        }
    };
    shake();
}

// 전역 등록
window.dealDamage = dealDamage;
window.showDamagePopup = showDamagePopup;
window.showVulnerableEffect = showVulnerableEffect;
window.showEnergyGainEffect = showEnergyGainEffect;
window.showAmbushVFX = showAmbushVFX;

console.log('[DamageSystem] 데미지 시스템 로드 완료');

