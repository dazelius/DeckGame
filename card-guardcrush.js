// ==========================================
// 가드 크러쉬 카드 시스템 (Guard Crush)
// 방어도를 파괴하면 추가 데미지!
// ==========================================

const GuardCrushSystem = {
    
    // 가드 크러쉬 데미지 계산
    // 공격으로 방어도를 완전히 깨뜨리면 보너스 데미지
    calculateCrushBonus(target, damage, crushBonus) {
        if (!target || damage <= 0) {
            return { totalDamage: damage, crushed: false, bonusDamage: 0 };
        }
        
        const targetBlock = target.block || 0;
        
        // 방어도가 없으면 크러쉬 불가
        if (targetBlock <= 0) {
            return { totalDamage: damage, crushed: false, bonusDamage: 0 };
        }
        
        // 이 공격으로 방어도가 완전히 깨지는지 확인
        if (damage >= targetBlock) {
            // 방어도 파괴! 보너스 데미지 추가
            console.log(`[GuardCrush] 방어도 ${targetBlock} 파괴! +${crushBonus} 보너스`);
            return {
                totalDamage: damage + crushBonus,
                crushed: true,
                bonusDamage: crushBonus,
                destroyedBlock: targetBlock
            };
        }
        
        // 방어도 안 깨짐
        return { totalDamage: damage, crushed: false, bonusDamage: 0 };
    },
    
    // 가드 크러쉬 VFX
    showCrushVFX(targetEl, bonusDamage) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 스타일 추가
        if (!document.getElementById('guard-crush-styles')) {
            const style = document.createElement('style');
            style.id = 'guard-crush-styles';
            style.textContent = `
                @keyframes crushText {
                    0% { transform: translateX(-50%) scale(0) rotate(-10deg); opacity: 0; }
                    15% { transform: translateX(-50%) scale(1.6) rotate(3deg); opacity: 1; }
                    30% { transform: translateX(-50%) scale(1.2) rotate(-1deg); opacity: 1; }
                    60% { transform: translateX(-50%) scale(1.1) rotate(0deg); opacity: 1; }
                    100% { transform: translateX(-50%) translateY(-60px) scale(1) rotate(0deg); opacity: 0; }
                }
                @keyframes crushShatter {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                    30% { transform: translate(-50%, -50%) scale(1.8); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
                }
                @keyframes crushSpark {
                    0% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 1. 분쇄 이펙트 (주황색) - 더 강렬하게
        const shatter = document.createElement('div');
        shatter.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            width: 180px;
            height: 180px;
            background: radial-gradient(circle,
                rgba(255, 255, 255, 0.9) 0%,
                rgba(251, 146, 60, 0.9) 20%,
                rgba(234, 88, 12, 0.6) 50%,
                transparent 70%);
            border-radius: 50%;
            z-index: 99990;
            pointer-events: none;
            animation: crushShatter 0.5s ease-out forwards;
        `;
        document.body.appendChild(shatter);
        setTimeout(() => shatter.remove(), 500);
        
        // 2. 파편 스파크 (더 많이, 더 크게)
        for (let i = 0; i < 12; i++) {
            const spark = document.createElement('div');
            const angle = (i / 12) * Math.PI * 2;
            const distance = 60 + Math.random() * 80;
            spark.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 12px;
                height: 12px;
                background: linear-gradient(135deg, #fff 0%, #fbbf24 50%, #f97316 100%);
                border-radius: 3px;
                z-index: 99991;
                pointer-events: none;
                box-shadow: 0 0 10px #f97316, 0 0 20px #ea580c;
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
                animation: crushSpark 0.6s ease-out forwards;
            `;
            document.body.appendChild(spark);
            setTimeout(() => spark.remove(), 600);
        }
        
        // 3. CRUSH 텍스트 (가독성 강화)
        const text = document.createElement('div');
        text.innerHTML = `
            <div style="
                font-family: 'Cinzel', serif;
                font-size: 3rem;
                font-weight: 900;
                color: #fff;
                text-shadow: 
                    0 0 10px #f97316,
                    0 0 30px #f97316, 
                    0 0 60px #ea580c, 
                    4px 4px 0 #000,
                    -2px -2px 0 #000,
                    2px -2px 0 #000,
                    -2px 2px 0 #000;
                letter-spacing: 6px;
                -webkit-text-stroke: 2px #ea580c;
            ">CRUSH!</div>
            <div style="
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                font-weight: 900;
                color: #fef08a;
                text-shadow: 
                    0 0 20px #fbbf24, 
                    0 0 40px #f59e0b,
                    3px 3px 0 #000,
                    -2px -2px 0 #000,
                    2px -2px 0 #000,
                    -2px 2px 0 #000;
                margin-top: 5px;
                -webkit-text-stroke: 1px #d97706;
            ">+${bonusDamage}</div>
        `;
        text.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${rect.top - 80}px;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 99999;
            pointer-events: none;
            animation: crushText 1.2s ease-out forwards;
        `;
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 1200);
        
        // 4. 타겟 흔들림
        const originalTransform = targetEl.style.transform || '';
        targetEl.style.transition = 'transform 0.05s';
        let count = 0;
        const shake = () => {
            const x = (Math.random() - 0.5) * 15;
            const y = (Math.random() - 0.5) * 8;
            targetEl.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
            count++;
            if (count < 8) {
                setTimeout(shake, 40);
            } else {
                targetEl.style.transform = originalTransform;
                targetEl.style.transition = '';
            }
        };
        shake();
        
        // 5. 사운드
        this.playCrushSound();
    },
    
    // 크러쉬 사운드
    playCrushSound() {
        try {
            // shield_break 사운드 활용
            if (typeof SoundSystem !== 'undefined') {
                SoundSystem.play('shield_break', { volume: 0.8 });
            } else {
                const sound = new Audio('sound/shield_break.mp3');
                sound.volume = 0.7;
                sound.play().catch(() => {});
            }
        } catch (e) {}
    }
};

// ==========================================
// 가드 크러쉬 카드 정의
// ==========================================

// cardDatabase에 직접 등록
if (typeof cardDatabase !== 'undefined') {
    
    // 가드 크러쉬 (기본)
    cardDatabase.guardCrush = {
        id: 'guardCrush',
        name: '가드 크러쉬',
        nameEn: 'Guard Crush',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        damage: 6,
        crushBonus: 6,
        icon: '💥',
        description: '<span class="damage">6</span> 데미지. 적의 방어도를 완전히 깨뜨리면 <span class="damage">+6</span> 데미지.',
        job: 'rogue',
        keywords: ['crush'],
        
        effect: (state) => {
            const target = state.enemy;
            const damage = 6;
            const crushBonus = 6;
            
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 가드 크러쉬 계산
            const crushResult = GuardCrushSystem.calculateCrushBonus(target, damage, crushBonus);
            
            // 플레이어 공격 애니메이션
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#f97316', count: 2 });
                dealDamage(target, crushResult.totalDamage);
                
                if (crushResult.crushed && enemyEl) {
                    setTimeout(() => {
                        GuardCrushSystem.showCrushVFX(enemyEl, crushResult.bonusDamage);
                    }, 100);
                    addLog(`💥 가드 크러쉬! +${crushResult.bonusDamage} 보너스!`, 'buff');
                } else {
                    addLog(`가드 크러쉬로 ${damage} 데미지!`, 'damage');
                }
            });
        }
    };
    
    // 분쇄 일격 (강화 버전)
    cardDatabase.shatterStrike = {
        id: 'shatterStrike',
        name: '분쇄 일격',
        nameEn: 'Shatter Strike',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 2,
        damage: 10,
        crushBonus: 10,
        icon: '⚡',
        description: '<span class="damage">10</span> 데미지. 적의 방어도를 완전히 깨뜨리면 <span class="damage">+10</span> 데미지.',
        job: 'rogue',
        keywords: ['crush'],
        
        effect: (state) => {
            const target = state.enemy;
            const damage = 10;
            const crushBonus = 10;
            
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            const crushResult = GuardCrushSystem.calculateCrushBonus(target, damage, crushBonus);
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#ea580c', count: 3 });
                dealDamage(target, crushResult.totalDamage);
                
                if (crushResult.crushed && enemyEl) {
                    setTimeout(() => {
                        GuardCrushSystem.showCrushVFX(enemyEl, crushResult.bonusDamage);
                    }, 100);
                    addLog(`💥 분쇄 일격! +${crushResult.bonusDamage} 보너스!`, 'buff');
                } else {
                    addLog(`분쇄 일격으로 ${damage} 데미지!`, 'damage');
                }
            });
        }
    };
    
    // 갑옷 파쇄 (방어도 무시 + 크러쉬)
    cardDatabase.armorBreaker = {
        id: 'armorBreaker',
        name: '갑옷 파쇄',
        nameEn: 'Armor Breaker',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 2,
        damage: 8,
        crushBonus: 8,
        icon: '🔨',
        description: '<span class="damage">8</span> 데미지 (방어 관통). 방어도를 파괴하면 <span class="damage">+8</span> 데미지.',
        job: 'rogue',
        keywords: ['crush', 'piercing'],
        
        effect: (state) => {
            const target = state.enemy;
            const damage = 8;
            const crushBonus = 8;
            
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 방어도 먼저 파괴
            const hadBlock = target.block > 0;
            const destroyedBlock = target.block || 0;
            target.block = 0;
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#dc2626', count: 2 });
                
                // 방어도 파괴 VFX
                if (hadBlock && typeof ShieldBreakVFX !== 'undefined' && enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    ShieldBreakVFX.playShieldBreakVFX(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2
                    );
                }
                
                // 크러쉬 보너스 (방어도가 있었다면)
                let totalDamage = damage;
                if (hadBlock) {
                    totalDamage += crushBonus;
                    
                    setTimeout(() => {
                        if (enemyEl) GuardCrushSystem.showCrushVFX(enemyEl, crushBonus);
                    }, 150);
                    
                    addLog(`💥 갑옷 파쇄! 방어도 ${destroyedBlock} 파괴 +${crushBonus} 보너스!`, 'buff');
                } else {
                    addLog(`갑옷 파쇄로 ${damage} 데미지!`, 'damage');
                }
                
                // 데미지 직접 HP에 (관통)
                target.hp -= totalDamage;
                
                // 데미지 팝업
                if (enemyEl) {
                    showDamagePopup(enemyEl, totalDamage, 'damage');
                }
                
                updateUI();
                if (typeof updateEnemiesUI === 'function') {
                    updateEnemiesUI();
                }
            });
        }
    };
    
    // 연속 분쇄 (다단 히트 + 크러쉬)
    cardDatabase.crushingFlurry = {
        id: 'crushingFlurry',
        name: '연속 분쇄',
        nameEn: 'Crushing Flurry',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        damage: 2,
        hitCount: 3,
        crushBonus: 4,
        icon: '🗡️',
        description: '<span class="damage">2</span> 데미지 x3. 마지막 타격이 방어도를 깨뜨리면 <span class="damage">+4</span> 데미지.',
        job: 'rogue',
        keywords: ['crush', 'multi'],
        
        effect: (state) => {
            const target = state.enemy;
            const damage = 2;
            const hitCount = 3;
            const crushBonus = 4;
            
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            let hitNum = 0;
            const doHit = () => {
                if (hitNum >= hitCount) return;
                
                const isLastHit = hitNum === hitCount - 1;
                let thisDamage = damage;
                
                // 마지막 히트에서만 크러쉬 체크
                if (isLastHit) {
                    const crushResult = GuardCrushSystem.calculateCrushBonus(target, thisDamage, crushBonus);
                    thisDamage = crushResult.totalDamage;
                    
                    if (crushResult.crushed && enemyEl) {
                        setTimeout(() => {
                            GuardCrushSystem.showCrushVFX(enemyEl, crushResult.bonusDamage);
                        }, 100);
                        addLog(`💥 연속 분쇄 크러쉬! +${crushResult.bonusDamage}!`, 'buff');
                    }
                }
                
                EffectSystem.slash(enemyEl, { color: '#f97316', count: 1 });
                dealDamage(target, thisDamage);
                hitNum++;
                
                if (hitNum < hitCount) {
                    setTimeout(doHit, 150);
                }
            };
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                doHit();
            });
            
            addLog(`연속 분쇄로 ${damage} x ${hitCount} 데미지!`, 'damage');
        }
    };
    
    console.log('[GuardCrush] 카드 등록 완료: guardCrush, shatterStrike, armorBreaker, crushingFlurry');
}

// 전역 등록
window.GuardCrushSystem = GuardCrushSystem;

console.log('[GuardCrush] 가드 크러쉬 시스템 로드 완료');
