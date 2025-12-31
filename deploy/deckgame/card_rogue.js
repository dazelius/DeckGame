// ==========================================
// 도적 전용 카드 - 출혈 메타
// ==========================================

// cardDatabase에 직접 등록
if (typeof cardDatabase !== 'undefined') {
    
    // ==========================================
    // 공격 카드
    // ==========================================
    
    // 찢는 일격 - 기본 출혈 공격
    cardDatabase.rendingStrike = {
        id: 'rendingStrike',
        name: '찢는 일격',
        nameEn: 'Rending Strike',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '🩸',
        description: '<span class="damage">4</span> 데미지. 적에게 <span class="debuff">출혈 3</span> 부여.',
        job: 'rogue',
        keywords: ['bleed'],
        
        effect: (state) => {
            const target = state.enemy;
            const damage = 4;
            const bleedAmount = 3;
            
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                // 베기 이펙트 (빨간색)
                EffectSystem.slash(enemyEl, { color: '#dc2626', count: 1 });
                
                // 데미지
                dealDamage(target, damage);
                
                // 출혈 부여 (버프 적용)
                const actualBleed = RogueCardSystem.applyBleed(target, bleedAmount);
                
                // 출혈 VFX
                RogueCardSystem.showBleedVFX(enemyEl, actualBleed);
                
                addLog(`찢는 일격! ${damage} 데미지 + 출혈 ${actualBleed}!`, 'damage');
                
                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
            });
        }
    };
    
    // 동맥 절단 - 출혈 시너지 공격
    cardDatabase.arterySlash = {
        id: 'arterySlash',
        name: '동맥 절단',
        nameEn: 'Artery Slash',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '💉',
        description: '<span class="damage">7</span> 데미지. 적에게 출혈이 있으면 <span class="damage">+출혈량</span> 추가 데미지.',
        job: 'rogue',
        keywords: ['bleed'],
        
        effect: (state) => {
            const target = state.enemy;
            const baseDamage = 7;
            const bleedBonus = target.bleed || 0;
            const totalDamage = baseDamage + bleedBonus;
            
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' 
                ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                // 강한 베기 이펙트
                EffectSystem.slash(enemyEl, { color: '#b91c1c', count: 2 });
                
                // 데미지
                dealDamage(target, totalDamage);
                
                // 출혈 보너스 VFX
                if (bleedBonus > 0) {
                    RogueCardSystem.showBleedBonusVFX(enemyEl, bleedBonus);
                    addLog(`동맥 절단! ${baseDamage} + ${bleedBonus}(출혈) = ${totalDamage} 데미지!`, 'damage');
                } else {
                    addLog(`동맥 절단! ${baseDamage} 데미지!`, 'damage');
                }
            });
        }
    };
    
    // ==========================================
    // 스킬 카드
    // ==========================================
    
    // 독 바른 칼날 - 이번 턴 공격에 출혈 추가
    cardDatabase.poisonedBlade = {
        id: 'poisonedBlade',
        name: '독 바른 칼날',
        nameEn: 'Poisoned Blade',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 0,
        icon: '🗡️',
        description: '이번 턴 모든 공격에 <span class="debuff">출혈 2</span> 추가.',
        job: 'rogue',
        keywords: ['bleed'],
        
        effect: (state) => {
            // 독 바른 칼날 버프
            state.player.poisonedBlade = (state.player.poisonedBlade || 0) + 2;
            
            const playerEl = document.getElementById('player');
            if (playerEl) {
                EffectSystem.buff(playerEl, { color: '#dc2626' });
                
                // 칼날에 독 바르는 VFX
                RogueCardSystem.showPoisonBladeVFX(playerEl);
            }
            
            addLog(`🗡️ 독 바른 칼날! 이번 턴 공격에 출혈 +2!`, 'buff');
        }
    };
    
    // ==========================================
    // 파워 카드
    // ==========================================
    
    // 출혈 숙달 - 모든 출혈량 증가
    cardDatabase.bleedMastery = {
        id: 'bleedMastery',
        name: '출혈 숙달',
        nameEn: 'Bleed Mastery',
        type: CardType.POWER,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '🩸',
        description: '이번 전투 동안, 부여하는 모든 <span class="debuff">출혈량 +2</span>.',
        job: 'rogue',
        keywords: ['bleed'],
        
        effect: (state) => {
            // 출혈 숙달 영구 버프
            state.player.bleedMastery = (state.player.bleedMastery || 0) + 2;
            
            const playerEl = document.getElementById('player');
            if (playerEl) {
                EffectSystem.buff(playerEl, { color: '#991b1b' });
                
                // 피의 오라 VFX
                RogueCardSystem.showBleedMasteryVFX(playerEl);
            }
            
            addLog(`🩸 출혈 숙달! 모든 출혈량 +2!`, 'power');
        }
    };
    
    console.log('[RogueCards] 도적 카드 등록 완료: rendingStrike, arterySlash, poisonedBlade, bleedMastery');
}

// ==========================================
// 도적 카드 시스템 (VFX 등)
// ==========================================
const RogueCardSystem = {
    
    // 출혈 부여 (버프 적용)
    applyBleed(target, amount) {
        if (!target || amount <= 0) return 0;
        
        let totalBleed = amount;
        
        // 출혈 숙달 보너스
        if (typeof gameState !== 'undefined' && gameState.player && gameState.player.bleedMastery) {
            totalBleed += gameState.player.bleedMastery;
            console.log(`[Bleed] 출혈 숙달 보너스: +${gameState.player.bleedMastery}`);
        }
        
        // 독 바른 칼날 보너스 (공격 시 자동 적용용)
        if (typeof gameState !== 'undefined' && gameState.player && gameState.player.poisonedBlade) {
            // 이건 공격 카드에서 별도로 체크
        }
        
        target.bleed = (target.bleed || 0) + totalBleed;
        
        console.log(`[Bleed] ${target.name || '적'}에게 출혈 ${totalBleed} 부여 (총 ${target.bleed})`);
        
        return totalBleed;
    },
    
    // 독 바른 칼날 출혈 추가 (공격 후 호출)
    applyPoisonedBladeBleed(target) {
        if (!target) return 0;
        if (typeof gameState === 'undefined' || !gameState.player) return 0;
        
        const poisonBleed = gameState.player.poisonedBlade || 0;
        if (poisonBleed <= 0) return 0;
        
        // 출혈 숙달도 적용
        return this.applyBleed(target, poisonBleed);
    },
    
    // 출혈 부여 VFX (화려하게!)
    showBleedVFX(targetEl, amount) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 스타일 추가
        if (!document.getElementById('rogue-card-styles')) {
            const style = document.createElement('style');
            style.id = 'rogue-card-styles';
            style.textContent = `
                @keyframes bleedDrip {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(80px) scale(0.3); opacity: 0; }
                }
                @keyframes bleedPulse {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.8; }
                    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
                }
                @keyframes bleedSplash {
                    0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1.5) rotate(180deg); opacity: 0; }
                }
                @keyframes bleedText {
                    0% { transform: translateX(-50%) scale(0) rotate(-5deg); opacity: 0; }
                    15% { transform: translateX(-50%) scale(1.5) rotate(3deg); opacity: 1; }
                    30% { transform: translateX(-50%) scale(1.1) rotate(-1deg); opacity: 1; }
                    70% { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 1; }
                    100% { transform: translateX(-50%) translateY(-50px) scale(0.9) rotate(0deg); opacity: 0; }
                }
                @keyframes bleedSpray {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
                }
                @keyframes poisonCoat {
                    0% { transform: scaleY(0); opacity: 0; }
                    30% { transform: scaleY(1.2); opacity: 1; }
                    100% { transform: scaleY(1); opacity: 0.8; }
                }
                @keyframes poisonDrip {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(30px); opacity: 0; }
                }
                @keyframes bloodAura {
                    0%, 100% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.4), inset 0 0 10px rgba(220, 38, 38, 0.2); }
                    50% { box-shadow: 0 0 50px rgba(185, 28, 28, 0.7), inset 0 0 20px rgba(185, 28, 28, 0.3); }
                }
                @keyframes bloodBurst {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 1. 화면 빨간 플래시
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at ${centerX}px ${centerY}px, rgba(220, 38, 38, 0.4) 0%, transparent 50%);
            z-index: 9998;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 300);
        }, 100);
        
        // 2. 피 스플래시 (큰 원형)
        const splash = document.createElement('div');
        splash.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, 
                rgba(220, 38, 38, 0.9) 0%, 
                rgba(185, 28, 28, 0.7) 30%,
                rgba(127, 29, 29, 0.4) 60%,
                transparent 80%);
            border-radius: 50%;
            z-index: 9999;
            pointer-events: none;
            animation: bleedSplash 0.5s ease-out forwards;
        `;
        document.body.appendChild(splash);
        setTimeout(() => splash.remove(), 500);
        
        // 3. 피 스프레이 (사방으로 튀는 피)
        for (let i = 0; i < 12; i++) {
            const spray = document.createElement('div');
            const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const distance = 60 + Math.random() * 60;
            const size = 6 + Math.random() * 8;
            spray.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%);
                border-radius: 50%;
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 0 8px rgba(220, 38, 38, 0.8);
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
                animation: bleedSpray ${0.4 + Math.random() * 0.2}s ease-out forwards;
            `;
            document.body.appendChild(spray);
            setTimeout(() => spray.remove(), 600);
        }
        
        // 4. 피 방울 (중력으로 떨어지는)
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const drop = document.createElement('div');
                const offsetX = (Math.random() - 0.5) * 80;
                const size = 8 + Math.random() * 6;
                drop.style.cssText = `
                    position: fixed;
                    left: ${centerX + offsetX}px;
                    top: ${centerY + Math.random() * 20}px;
                    width: ${size}px;
                    height: ${size * 1.4}px;
                    background: linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #7f1d1d 100%);
                    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                    z-index: 10001;
                    pointer-events: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    animation: bleedDrip ${0.5 + Math.random() * 0.4}s ease-in forwards;
                `;
                document.body.appendChild(drop);
                setTimeout(() => drop.remove(), 1000);
            }, i * 30);
        }
        
        // 5. 출혈 텍스트 (크고 선명하게)
        const text = document.createElement('div');
        text.innerHTML = `
            <div style="font-size: 2.2rem; color: #fff; text-shadow: 0 0 10px #dc2626, 0 0 20px #991b1b, 3px 3px 0 #000, -2px -2px 0 #000;">BLEED!</div>
            <div style="font-size: 1.8rem; color: #fca5a5; text-shadow: 0 0 15px #dc2626, 2px 2px 0 #000;">+${amount}</div>
        `;
        text.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${rect.top - 60}px;
            font-family: 'Cinzel', serif;
            font-weight: 900;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 99999;
            pointer-events: none;
            animation: bleedText 1.2s ease-out forwards;
        `;
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 1200);
        
        // 6. 타겟 흔들림 + 빨간 틴트
        const originalFilter = targetEl.style.filter || '';
        const originalTransform = targetEl.style.transform || '';
        targetEl.style.transition = 'filter 0.1s, transform 0.05s';
        targetEl.style.filter = 'brightness(1.3) sepia(1) hue-rotate(-30deg) saturate(2)';
        
        let shakeCount = 0;
        const shake = () => {
            const x = (Math.random() - 0.5) * 10;
            const y = (Math.random() - 0.5) * 6;
            targetEl.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
            shakeCount++;
            if (shakeCount < 6) {
                setTimeout(shake, 40);
            } else {
                targetEl.style.transform = originalTransform;
                targetEl.style.filter = originalFilter;
            }
        };
        shake();
    },
    
    // 출혈 보너스 데미지 VFX (동맥 절단용)
    showBleedBonusVFX(targetEl, bonus) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 1. 피 폭발
        const burst = document.createElement('div');
        burst.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, 
                rgba(239, 68, 68, 0.9) 0%,
                rgba(220, 38, 38, 0.6) 40%,
                transparent 70%);
            border-radius: 50%;
            z-index: 9999;
            pointer-events: none;
            animation: bloodBurst 0.6s ease-out forwards;
        `;
        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 600);
        
        // 2. 대량 피 스프레이
        for (let i = 0; i < 20; i++) {
            const spray = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 100;
            const size = 5 + Math.random() * 10;
            spray.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${size}px;
                height: ${size}px;
                background: ${Math.random() > 0.5 ? '#ef4444' : '#dc2626'};
                border-radius: 50%;
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 0 6px rgba(220, 38, 38, 0.8);
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
                animation: bleedSpray ${0.3 + Math.random() * 0.3}s ease-out forwards;
            `;
            document.body.appendChild(spray);
            setTimeout(() => spray.remove(), 600);
        }
        
        // 3. 텍스트
        const text = document.createElement('div');
        text.innerHTML = `
            <div style="font-size: 2.5rem; color: #fff; text-shadow: 0 0 15px #dc2626, 0 0 30px #991b1b, 4px 4px 0 #000;">RUPTURE!</div>
            <div style="font-size: 2rem; color: #fef08a; text-shadow: 0 0 20px #f59e0b, 3px 3px 0 #000;">+${bonus}</div>
        `;
        text.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${rect.top - 80}px;
            font-family: 'Cinzel', serif;
            font-weight: 900;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 99999;
            pointer-events: none;
            animation: bleedText 1.2s ease-out forwards;
        `;
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 1200);
        
        // 4. 화면 플래시
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(220, 38, 38, 0.3);
            z-index: 9998;
            pointer-events: none;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 100);
        
        // 5. 타겟 강한 흔들림
        const originalTransform = targetEl.style.transform || '';
        let count = 0;
        const shake = () => {
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 12;
            targetEl.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
            count++;
            if (count < 10) {
                setTimeout(shake, 30);
            } else {
                targetEl.style.transform = originalTransform;
            }
        };
        shake();
    },
    
    // 독 바른 칼날 VFX (화려하게!)
    showPoisonBladeVFX(playerEl) {
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 1. 독 칼날 실루엣
        const blade = document.createElement('div');
        blade.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY - 40}px;
            width: 8px;
            height: 80px;
            background: linear-gradient(180deg, 
                transparent 0%,
                rgba(34, 197, 94, 0.9) 20%,
                rgba(22, 163, 74, 1) 50%,
                rgba(34, 197, 94, 0.9) 80%,
                transparent 100%);
            transform: translateX(-50%);
            transform-origin: bottom center;
            z-index: 10000;
            pointer-events: none;
            animation: poisonCoat 0.5s ease-out forwards;
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(22, 163, 74, 0.5);
        `;
        document.body.appendChild(blade);
        setTimeout(() => blade.remove(), 800);
        
        // 2. 독 방울 떨어지기
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const drip = document.createElement('div');
                const offsetX = (Math.random() - 0.5) * 20;
                drip.style.cssText = `
                    position: fixed;
                    left: ${centerX + offsetX}px;
                    top: ${centerY + 30}px;
                    width: 6px;
                    height: 10px;
                    background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
                    border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
                    z-index: 10001;
                    pointer-events: none;
                    box-shadow: 0 0 8px #22c55e;
                    animation: poisonDrip 0.6s ease-in forwards;
                `;
                document.body.appendChild(drip);
                setTimeout(() => drip.remove(), 600);
            }, i * 100);
        }
        
        // 3. 독 파티클 버스트
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (i / 12) * Math.PI * 2;
            const distance = 50 + Math.random() * 40;
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 8px;
                height: 8px;
                background: ${Math.random() > 0.5 ? '#22c55e' : '#16a34a'};
                border-radius: 50%;
                z-index: 10002;
                pointer-events: none;
                box-shadow: 0 0 12px #22c55e;
                --tx: ${Math.cos(angle) * distance}px;
                --ty: ${Math.sin(angle) * distance}px;
                animation: bleedSpray 0.5s ease-out forwards;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }
        
        // 4. 텍스트
        const text = document.createElement('div');
        text.innerHTML = `<span style="color: #86efac;">🗡️</span> POISONED!`;
        text.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${rect.top - 50}px;
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            font-weight: 900;
            color: #22c55e;
            text-shadow: 0 0 15px #16a34a, 3px 3px 0 #000;
            z-index: 99999;
            pointer-events: none;
            transform: translateX(-50%);
            animation: bleedText 1s ease-out forwards;
        `;
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 1000);
        
        // 5. 플레이어 녹색 틴트
        const originalFilter = playerEl.style.filter || '';
        playerEl.style.transition = 'filter 0.2s';
        playerEl.style.filter = 'brightness(1.2) hue-rotate(60deg) saturate(1.5)';
        setTimeout(() => {
            playerEl.style.filter = originalFilter;
        }, 400);
    },
    
    // 출혈 숙달 VFX (파워 카드용!)
    showBleedMasteryVFX(playerEl) {
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 1. 화면 빨간 플래시
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at ${centerX}px ${centerY}px, rgba(185, 28, 28, 0.5) 0%, transparent 60%);
            z-index: 9998;
            pointer-events: none;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
        
        // 2. 피의 원형 폭발
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                const burst = document.createElement('div');
                burst.style.cssText = `
                    position: fixed;
                    left: ${centerX}px;
                    top: ${centerY}px;
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(220, 38, 38, 0.8);
                    border-radius: 50%;
                    z-index: 9999;
                    pointer-events: none;
                    animation: bloodBurst 0.8s ease-out forwards;
                `;
                document.body.appendChild(burst);
                setTimeout(() => burst.remove(), 800);
            }, ring * 100);
        }
        
        // 3. 대량 피 파티클
        for (let i = 0; i < 24; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                const angle = (i / 24) * Math.PI * 2;
                const distance = 70 + Math.random() * 60;
                const size = 6 + Math.random() * 8;
                particle.style.cssText = `
                    position: fixed;
                    left: ${centerX}px;
                    top: ${centerY}px;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${['#ef4444', '#dc2626', '#b91c1c', '#991b1b'][Math.floor(Math.random() * 4)]};
                    border-radius: 50%;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
                    --tx: ${Math.cos(angle) * distance}px;
                    --ty: ${Math.sin(angle) * distance}px;
                    animation: bleedSpray 0.6s ease-out forwards;
                `;
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 600);
            }, Math.random() * 200);
        }
        
        // 4. 피의 오라 (영구)
        const existingAura = playerEl.querySelector('.bleed-mastery-aura');
        if (!existingAura) {
            const aura = document.createElement('div');
            aura.className = 'bleed-mastery-aura';
            aura.style.cssText = `
                position: absolute;
                inset: -20px;
                border-radius: 50%;
                border: 3px solid rgba(220, 38, 38, 0.6);
                background: radial-gradient(circle, transparent 60%, rgba(220, 38, 38, 0.15) 100%);
                animation: bloodAura 1.5s infinite;
                pointer-events: none;
            `;
            playerEl.style.position = 'relative';
            playerEl.appendChild(aura);
        }
        
        // 5. 텍스트
        const text = document.createElement('div');
        text.innerHTML = `
            <div style="font-size: 2.2rem; color: #fff; text-shadow: 0 0 15px #dc2626, 0 0 30px #991b1b, 4px 4px 0 #000;">BLOOD</div>
            <div style="font-size: 2.2rem; color: #fca5a5; text-shadow: 0 0 15px #dc2626, 3px 3px 0 #000;">MASTERY!</div>
        `;
        text.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${rect.top - 80}px;
            font-family: 'Cinzel', serif;
            font-weight: 900;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 99999;
            pointer-events: none;
            transform: translateX(-50%);
            animation: bleedText 1.5s ease-out forwards;
        `;
        document.body.appendChild(text);
        setTimeout(() => text.remove(), 1500);
        
        // 6. 플레이어 빨간 틴트
        const originalFilter = playerEl.style.filter || '';
        playerEl.style.transition = 'filter 0.3s';
        playerEl.style.filter = 'brightness(1.3) sepia(0.5) hue-rotate(-30deg) saturate(1.5)';
        setTimeout(() => {
            playerEl.style.filter = originalFilter;
        }, 500);
    }
};

// 전역 등록
window.RogueCardSystem = RogueCardSystem;

console.log('[RogueCards] 도적 카드 시스템 로드 완료');

