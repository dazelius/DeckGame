// ==========================================
// Shadow Deck - 특수/시너지 카드
// ==========================================

const SpecialCards = {
    // ==========================================
    // 카드폴 - 범용 시너지 카드 (전체 다단히트)
    // ==========================================
    cardFall: {
        id: 'cardFall',
        name: '카드폴',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 1,
        icon: '🎴',
        description: '손패를 모두 버립니다.<br>버린 카드당 <span class="damage">1~4</span> 전체 피해',
        effect: (state) => {
            // 현재 손패의 모든 카드 (카드폴 포함)
            const handCards = [...state.hand];
            const discardCount = handCards.length;
            
            if (discardCount <= 1) {
                // 카드폴 혼자면 대미지 없음
                addLog('🎴 카드폴! 버릴 카드가 없습니다!', 'info');
                return;
            }
            
            // 손패 요소들 수집 (애니메이션용) - 모든 카드가 발사체
            const handEl = document.querySelector('.hand');
            const cardElements = handEl ? Array.from(handEl.querySelectorAll('.card')) : [];
            
            // 적 위치 계산
            const enemies = state.enemies || [state.enemy];
            const aliveEnemies = enemies.filter(e => e && e.hp > 0);
            
            if (aliveEnemies.length === 0) {
                addLog('🎴 카드폴! 대상이 없습니다!', 'info');
                return;
            }
            
            // 모든 적의 위치 수집
            const enemyPositions = aliveEnemies.map((enemy, idx) => {
                const enemyIndex = enemies.indexOf(enemy);
                const el = document.querySelector(`[data-index="${enemyIndex}"]`) || 
                          document.querySelectorAll('.enemy-unit')[idx];
                if (el) {
                    const rect = el.getBoundingClientRect();
                    return {
                        enemy,
                        el,
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                }
                return null;
            }).filter(e => e);
            
            // 손패 전체 비우기 (모두 버린 더미로)
            while (state.hand.length > 0) {
                const card = state.hand.pop();
                if (typeof gameState !== 'undefined') {
                    gameState.discardPile.push(card);
                }
            }
            
            // 손패 UI 업데이트
            if (typeof renderHand === 'function') renderHand();
            
            // 판돈올리기 버프 확인
            const raiseStakes = state.player?.raiseStakes || 0;
            
            // 대미지 배열 미리 계산 (1~4 + 판돈올리기)
            const minDmg = 1;
            const maxDmg = 4 + raiseStakes; // 판돈올리기 반영
            const damagePerCard = [];
            let totalDamage = 0;
            for (let i = 0; i < discardCount; i++) {
                const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg; // 1~(4+raiseStakes)
                damagePerCard.push(dmg);
                totalDamage += dmg;
            }
            
            // CSS 스타일 추가
            SpecialCards.ensureCurtainCallStyles();
            
            let cardsCompleted = 0;
            
            // 비행 시간
            const flightDuration = 600; // ms
            
            // 각 카드를 발사체로 발사 - 베지어 곡선으로 관통!
            for (let cardIndex = 0; cardIndex < discardCount; cardIndex++) {
                const launchDelay = cardIndex * 180; // 카드마다 180ms 딜레이
                
                // 베지어 곡선 컨트롤 포인트 설정
                const avgEnemyY = enemyPositions.reduce((sum, e) => sum + e.y, 0) / enemyPositions.length;
                const curveOffset = (cardIndex - discardCount / 2) * 60; // 카드마다 곡선 오프셋
                
                // 시작점 (화면 왼쪽)
                const p0 = { x: -100, y: avgEnemyY + curveOffset };
                // 컨트롤 포인트 1 (곡선의 높이)
                const p1 = { x: window.innerWidth * 0.25, y: avgEnemyY + curveOffset - 80 - Math.random() * 40 };
                // 컨트롤 포인트 2 (곡선의 높이)
                const p2 = { x: window.innerWidth * 0.75, y: avgEnemyY + curveOffset + 80 + Math.random() * 40 };
                // 끝점 (화면 오른쪽)
                const p3 = { x: window.innerWidth + 100, y: avgEnemyY + curveOffset };
                
                setTimeout(() => {
                    // 발사체 생성 - 실제 카드 모양 (더 크게)
                    const projectile = document.createElement('div');
                    projectile.className = 'card-fall-projectile horizontal';
                    projectile.innerHTML = `
                        <div class="card-projectile-card">
                            <div class="card-back-design">
                                <div class="card-back-border"></div>
                                <div class="card-back-pattern"></div>
                                <div class="card-back-symbol">⚜</div>
                                <div class="card-back-glow"></div>
                            </div>
                        </div>
                        <div class="card-projectile-trail horizontal"></div>
                    `;
                    projectile.style.left = `${p0.x}px`;
                    projectile.style.top = `${p0.y}px`;
                    document.body.appendChild(projectile);
                    
                    // 베지어 곡선 애니메이션
                    const startTime = performance.now();
                    let hitChecks = enemyPositions.map(() => false);
                    
                    const animateBezier = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const t = Math.min(elapsed / flightDuration, 1);
                        
                        // 큐빅 베지어 공식
                        const x = Math.pow(1-t, 3) * p0.x + 
                                  3 * Math.pow(1-t, 2) * t * p1.x + 
                                  3 * (1-t) * Math.pow(t, 2) * p2.x + 
                                  Math.pow(t, 3) * p3.x;
                        const y = Math.pow(1-t, 3) * p0.y + 
                                  3 * Math.pow(1-t, 2) * t * p1.y + 
                                  3 * (1-t) * Math.pow(t, 2) * p2.y + 
                                  Math.pow(t, 3) * p3.y;
                        
                        projectile.style.left = `${x}px`;
                        projectile.style.top = `${y}px`;
                        
                        // 각 적과의 충돌 체크
                        enemyPositions.forEach((target, idx) => {
                            if (!hitChecks[idx] && Math.abs(x - target.x) < 60) {
                                hitChecks[idx] = true;
                                
                                // 대미지 적용
                                const dmg = damagePerCard[cardIndex];
                                if (typeof dealDamage === 'function') {
                                    dealDamage(target.enemy, dmg);
                                }
                                
                                // 히트 VFX
                                SpecialCards.playCardHitVFX(target.x, target.y, target.el, dmg);
                            }
                        });
                        
                        if (t < 1) {
                            requestAnimationFrame(animateBezier);
                        } else {
                            // 발사체 화려하게 사라짐
                            projectile.classList.add('rainbow-fade');
                            setTimeout(() => projectile.remove(), 400);
                            
                            cardsCompleted++;
                            
                            // 모든 카드 완료 - 간단한 마무리
                            if (cardsCompleted === discardCount) {
                                // UI 업데이트
                                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                                if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
                            }
                        }
                    };
                    
                    requestAnimationFrame(animateBezier);
                    
                }, launchDelay);
            }
            
            addLog(`🎴 카드폴! ${discardCount}장 x ${enemyPositions.length}적 관통!`, 'damage');
        }
    },
    
    // CSS 스타일 보장
    ensureCurtainCallStyles() {
        if (document.getElementById('cardFallStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'cardFallStyles';
        style.textContent = `
            .card-fall-projectile {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                transform: translate(-50%, -50%);
            }
            
            .card-fall-projectile.horizontal {
                display: flex;
                align-items: center;
            }
            
            .card-projectile-card {
                width: 70px;
                height: 100px;
                position: relative;
                animation: cardSpinHorizontal 0.12s linear infinite;
                filter: drop-shadow(0 0 25px #ffd700) drop-shadow(0 0 50px #ff6600);
                flex-shrink: 0;
            }
            
            .card-back-design {
                width: 100%;
                height: 100%;
                background: linear-gradient(145deg, #2a2a4e 0%, #1a1a2e 50%, #0f0f1a 100%);
                border: 3px solid #c9a227;
                border-radius: 8px;
                position: relative;
                overflow: hidden;
                box-shadow: 
                    inset 0 0 20px rgba(201, 162, 39, 0.4),
                    0 0 30px rgba(255, 215, 0, 0.5);
            }
            
            .card-back-border {
                position: absolute;
                inset: 4px;
                border: 2px solid rgba(201, 162, 39, 0.6);
                border-radius: 5px;
            }
            
            .card-back-pattern {
                position: absolute;
                inset: 8px;
                background: 
                    repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(201, 162, 39, 0.2) 6px, rgba(201, 162, 39, 0.2) 7px),
                    repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(201, 162, 39, 0.2) 6px, rgba(201, 162, 39, 0.2) 7px);
                border-radius: 3px;
            }
            
            .card-back-symbol {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 32px;
                color: #ffd700;
                text-shadow: 0 0 20px #ffd700, 0 0 40px #c9a227;
            }
            
            .card-back-glow {
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
                animation: cardGlowPulse 0.2s ease-in-out infinite;
            }
            
            @keyframes cardGlowPulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            
            @keyframes cardSpinHorizontal {
                0% { transform: rotateY(0deg) rotateZ(-5deg) scale(1); }
                25% { transform: rotateY(90deg) rotateZ(0deg) scale(0.85); }
                50% { transform: rotateY(180deg) rotateZ(5deg) scale(1); }
                75% { transform: rotateY(270deg) rotateZ(0deg) scale(0.85); }
                100% { transform: rotateY(360deg) rotateZ(-5deg) scale(1); }
            }
            
            .card-projectile-trail {
                position: absolute;
                top: 50%;
                right: 100%;
                width: 200px;
                height: 45px;
                background: linear-gradient(90deg, 
                    transparent 0%,
                    rgba(255, 0, 0, 0.3) 15%,
                    rgba(255, 127, 0, 0.4) 30%,
                    rgba(255, 255, 0, 0.5) 45%,
                    rgba(0, 255, 0, 0.5) 60%,
                    rgba(0, 127, 255, 0.6) 75%,
                    rgba(139, 0, 255, 0.7) 90%,
                    rgba(255, 0, 255, 0.8) 100%
                );
                transform: translateY(-50%);
                border-radius: 25px;
                filter: blur(6px);
                animation: rainbowShift 0.3s linear infinite;
            }
            
            .card-projectile-trail.horizontal {
                width: 280px;
                height: 55px;
                animation: rainbowShift 0.2s linear infinite, trailPulse 0.1s ease-in-out infinite;
            }
            
            @keyframes rainbowShift {
                0% { filter: blur(6px) hue-rotate(0deg); }
                100% { filter: blur(6px) hue-rotate(360deg); }
            }
            
            @keyframes trailPulse {
                0%, 100% { opacity: 0.85; height: 50px; }
                50% { opacity: 1; height: 60px; }
            }
            
            .card-fall-projectile.fade-out {
                opacity: 0;
                transition: opacity 0.2s ease-out;
            }
            
            .card-fall-projectile.rainbow-fade {
                animation: rainbowBurst 0.4s ease-out forwards;
            }
            
            .card-fall-projectile.rainbow-fade .card-projectile-card {
                animation: cardBurst 0.4s ease-out forwards;
            }
            
            .card-fall-projectile.rainbow-fade .card-projectile-trail {
                animation: trailBurst 0.4s ease-out forwards;
            }
            
            @keyframes rainbowBurst {
                0% { opacity: 1; }
                50% { opacity: 1; }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
            }
            
            @keyframes cardBurst {
                0% { transform: scale(1); filter: drop-shadow(0 0 25px #ffd700); }
                50% { transform: scale(1.3); filter: drop-shadow(0 0 50px #ff00ff) drop-shadow(0 0 80px #00ffff); }
                100% { transform: scale(0.5); opacity: 0; filter: drop-shadow(0 0 100px #ffffff); }
            }
            
            @keyframes trailBurst {
                0% { width: 280px; opacity: 1; }
                50% { width: 400px; opacity: 1; filter: blur(10px) hue-rotate(180deg); }
                100% { width: 500px; opacity: 0; filter: blur(20px) hue-rotate(360deg); }
            }
            
            .card-fall-projectile.fade-out {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.3);
                transition: all 0.3s ease-out;
            }
            
            @keyframes cardSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .card-fall-hit {
                position: fixed;
                pointer-events: none;
                z-index: 10001;
                transform: translate(-50%, -50%);
            }
            
            .hit-burst {
                width: 100px;
                height: 100px;
                background: radial-gradient(circle, #ffd700 0%, #ff6600 40%, transparent 70%);
                border-radius: 50%;
                animation: hitBurst 0.3s ease-out forwards;
            }
            
            @keyframes hitBurst {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
            
            .hit-sparks {
                position: absolute;
                top: 50%;
                left: 50%;
            }
            
            .hit-spark {
                position: absolute;
                width: 6px;
                height: 6px;
                background: #ffd700;
                border-radius: 50%;
                box-shadow: 0 0 10px #ffd700;
            }
            
            .damage-pop {
                position: fixed;
                font-family: 'Cinzel', serif;
                font-size: 32px;
                font-weight: bold;
                color: #ffd700;
                text-shadow: 0 0 10px #ff6600, 0 0 20px #ff0000, 2px 2px 0 #000;
                pointer-events: none;
                z-index: 10002;
                animation: damagePop 0.6s ease-out forwards;
            }
            
            @keyframes damagePop {
                0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
                20% { transform: translate(-50%, -10px) scale(1.3); opacity: 1; }
                100% { transform: translate(-50%, -50px) scale(0.8); opacity: 0; }
            }
            
        `;
        document.head.appendChild(style);
    },
    
    // 카드 히트 VFX
    playCardHitVFX(x, y, targetEl, damage) {
        // 히트 버스트
        const hitEffect = document.createElement('div');
        hitEffect.className = 'card-fall-hit';
        hitEffect.innerHTML = '<div class="hit-burst"></div>';
        hitEffect.style.left = `${x}px`;
        hitEffect.style.top = `${y}px`;
        document.body.appendChild(hitEffect);
        
        // 스파크 추가
        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            spark.className = 'hit-spark';
            const angle = (i / 8) * Math.PI * 2;
            const dist = 30 + Math.random() * 30;
            spark.style.left = `${Math.cos(angle) * dist}px`;
            spark.style.top = `${Math.sin(angle) * dist}px`;
            spark.style.animation = `sparkleFloat 0.4s ease-out forwards`;
            spark.style.setProperty('--tx', `${Math.cos(angle) * 50}px`);
            spark.style.setProperty('--ty', `${Math.sin(angle) * 50}px`);
            hitEffect.appendChild(spark);
        }
        
        setTimeout(() => hitEffect.remove(), 400);
        
        // 대미지 숫자 팝업
        const dmgPop = document.createElement('div');
        dmgPop.className = 'damage-pop';
        dmgPop.textContent = damage;
        dmgPop.style.left = `${x + (Math.random() - 0.5) * 40}px`;
        dmgPop.style.top = `${y - 20}px`;
        document.body.appendChild(dmgPop);
        setTimeout(() => dmgPop.remove(), 600);
        
        // 타겟 플래시
        if (targetEl) {
            targetEl.style.filter = 'brightness(2) saturate(1.5)';
            targetEl.style.transform = 'scale(0.95)';
            setTimeout(() => {
                targetEl.style.filter = '';
                targetEl.style.transform = '';
            }, 100);
        }
        
        // 화면 살짝 흔들림
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(3, 50);
        }
    },
    
};

// cardDatabase에 등록
if (typeof cardDatabase !== 'undefined') {
    Object.keys(SpecialCards).forEach(cardId => {
        cardDatabase[cardId] = SpecialCards[cardId];
        console.log(`[SpecialCards] ${cardId} 등록됨`);
    });
}

// 전역 접근용
window.SpecialCards = SpecialCards;

console.log('✨ Special Cards 로드 완료:', Object.keys(SpecialCards));

