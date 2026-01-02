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
        
        // DOM 요소 먼저 찾기 (적이 죽어서 인덱스가 안 맞을 수 있음)
        const container = document.getElementById('enemies-container');
        const enemyEls = container ? Array.from(container.querySelectorAll('.enemy-unit')) : [];
        
        // gameState.enemies 순서대로 DOM을 매칭 (배열 인덱스로 접근)
        const targetEl = enemyEls[targetIndex];
        
        if (!targetEl) {
            console.log('[ChainScythe] 타겟 DOM 요소 없음, renderEnemies 호출');
            // DOM과 gameState가 맞지 않으면 다시 그리기
            this.forceSwapWithRender(targetIndex, targetEnemy, onComplete);
            return;
        }
        
        console.log(`[ChainScythe] 끌어오기 시작! 인덱스: ${targetIndex}, DOM 요소 수: ${enemyEls.length}`);
        
        // 끌어오기 연출 실행 (연출 끝나면 위치 교환)
        this.playPullAnimation(targetIndex, targetEnemy, () => {
            // DOM 재생성 없이 자연스럽게 위치 교환
            this.swapEnemyPositions(targetIndex, targetEnemy, onComplete);
        });
    },
    
    // DOM과 gameState가 맞지 않을 때 강제로 재렌더링
    forceSwapWithRender(targetIndex, targetEnemy, onComplete) {
        // gameState 배열 재배치
        const pulled = gameState.enemies.splice(targetIndex, 1)[0];
        gameState.enemies.unshift(pulled);
        
        console.log(`[ChainScythe] (강제) ${targetEnemy.name}을(를) 맨 앞으로!`);
        
        // 재렌더링
        if (typeof renderEnemies === 'function') {
            renderEnemies(false);
        }
        
        this.restoreBreakStates();
        
        if (typeof updateUI === 'function') {
            updateUI();
        }
        
        if (onComplete) onComplete();
    },
    
    // DOM 재생성 없이 적 위치 재배치 (완벽한 무깜박임 FLIP)
    // [1,2,3] 에서 3을 당기면 → [3,1,2] (타겟이 맨 앞, 나머지 뒤로 밀림)
    swapEnemyPositions(targetIndex, targetEnemy, onComplete) {
        const container = document.getElementById('enemies-container');
        if (!container) {
            if (onComplete) onComplete();
            return;
        }
        
        const enemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
        
        if (enemyEls.length !== gameState.enemies.length) {
            console.log('[ChainScythe] DOM/gameState 불일치, 강제 재렌더링');
            this.forceSwapWithRender(targetIndex, targetEnemy, onComplete);
            return;
        }
        
        const targetEl = enemyEls[targetIndex];
        
        if (!targetEl || targetIndex === 0) {
            if (onComplete) onComplete();
            return;
        }
        
        // ==========================================
        // ✅ FLIP Phase 1: First - 시각적 위치 + 현재 GSAP 오프셋 저장
        // (clearProps 없이! 깜박임 방지)
        // ==========================================
        const firstData = enemyEls.map(el => ({
            rect: el.getBoundingClientRect(),
            gsapX: gsap.getProperty(el, 'x') || 0,
            gsapY: gsap.getProperty(el, 'y') || 0
        }));
        
        // gameState 배열 재배치
        const pulled = gameState.enemies.splice(targetIndex, 1)[0];
        gameState.enemies.unshift(pulled);
        
        console.log(`[ChainScythe] ${targetEnemy.name}을(를) 맨 앞으로!`);
        
        // ==========================================
        // ✅ FLIP Phase 2: Last - DOM 재배치 (GSAP 상태 유지!)
        // ==========================================
        container.insertBefore(targetEl, container.firstChild);
        
        // 새 순서로 요소 다시 가져오기
        const newEnemyEls = Array.from(container.querySelectorAll('.enemy-unit'));
        
        // ==========================================
        // ✅ FLIP Phase 3: Invert + Play
        // 핵심: DOM 재배치로 인한 위치 변화를 계산하고, 
        // 기존 GSAP 오프셋을 고려하여 보정
        // ==========================================
        newEnemyEls.forEach((el, newIndex) => {
            const oldIndex = enemyEls.indexOf(el);
            if (oldIndex === -1) return;
            
            const first = firstData[oldIndex];
            
            // DOM 재배치 후 "기본 위치" 계산 (GSAP 오프셋 제외)
            // 현재 시각적 위치 = 기본 위치 + GSAP 오프셋
            // 기본 위치 = 현재 시각적 위치 - GSAP 오프셋
            const currentRect = el.getBoundingClientRect();
            const baseX = currentRect.left - first.gsapX;
            const baseY = currentRect.top - first.gsapY;
            
            // 원래 시각적 위치로 돌아가기 위한 새 오프셋
            // 새 오프셋 = 원래 시각적 위치 - 새 기본 위치
            const newX = first.rect.left - baseX;
            const newY = first.rect.top - baseY;
            
            // data-index 업데이트
            el.dataset.index = newIndex;
            
            // 3D Z 깊이
            const z3d = typeof Background3D !== 'undefined' 
                ? Background3D.getEnemyZ(newIndex) 
                : -80 - (newIndex * 20);
            
            // ✅ 즉시 원래 시각적 위치로 설정 (깜박임 없음!)
            gsap.set(el, { x: newX, y: newY });
            
            // ✅ 새 위치(0,0)로 부드럽게 애니메이션
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.25,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.set(el, { clearProps: 'x,y' });
                    el.style.transform = `translateZ(${z3d}px)`;
                    el.style.transformStyle = 'preserve-3d';
                }
            });
        });
        
        // 브레이크 상태 복원 + 3D 위치 동기화 + 사망 처리
        setTimeout(() => {
            this.restoreBreakStates();
            
            // ✅ 사망한 적 처리 (충돌 대미지로 죽은 적)
            this.processDeadEnemies();
            
            // ✅ 모든 적의 GSAP transform 초기화 (전진/후퇴와 통일)
            const allEnemyEls = document.querySelectorAll('.enemy-unit');
            allEnemyEls.forEach(el => {
                gsap.set(el, { x: 0, y: 0, scale: 1, opacity: 1, clearProps: 'x,y' });
            });
            
            // ✅ Background3D 전체 재적용 (가장 확실한 방법)
            if (typeof Background3D !== 'undefined' && Background3D.applyGameParallax) {
                Background3D.applyGameParallax();
            }
            
            if (typeof updateUI === 'function') {
                updateUI();
            }
            
            // 전투 종료 체크
            if (typeof checkBattleEnd === 'function') {
                checkBattleEnd();
            }
            
            if (onComplete) onComplete();
        }, 300);
        
        return true;
    },
    
    // 충돌로 사망한 적 처리
    processDeadEnemies() {
        if (!gameState.enemies) return;
        
        const deadEnemies = gameState.enemies.filter(e => e.hp <= 0);
        
        deadEnemies.forEach(enemy => {
            const index = gameState.enemies.indexOf(enemy);
            const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
            
            if (enemyEl) {
                // 사망 애니메이션
                if (typeof gsap !== 'undefined') {
                    gsap.to(enemyEl, {
                        opacity: 0,
                        scale: 0.8,
                        y: 20,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                            enemyEl.remove();
                        }
                    });
                } else {
                    enemyEl.remove();
                }
            }
            
            // 보상 처리
            if (typeof handleEnemyDeath === 'function') {
                handleEnemyDeath(enemy);
            }
        });
        
        // gameState에서 사망한 적 제거
        gameState.enemies = gameState.enemies.filter(e => e.hp > 0);
        
        // DOM의 data-index 재정렬
        const remainingEls = document.querySelectorAll('.enemy-unit');
        remainingEls.forEach((el, i) => {
            el.dataset.index = i;
        });
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
    // 🔥 끌어오기 연출 (PixiJS + GSAP)
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
        
        if (!targetEl || !firstEl) {
            console.log('[ChainScythe] 요소 없음');
            if (onComplete) onComplete();
            return;
        }
        
        // 중간 적들
        const middleEnemies = [];
        for (let i = 1; i < fromIndex; i++) {
            if (enemyEls[i]) middleEnemies.push({ el: enemyEls[i], index: i });
        }
        
        const targetRect = targetEl.getBoundingClientRect();
        const firstRect = firstEl.getBoundingClientRect();
        const playerEl = document.getElementById('player');
        const playerRect = playerEl ? playerEl.getBoundingClientRect() : { left: 100, top: targetRect.top, width: 100, height: 100 };
        
        // 시작/끝 좌표
        const startX = playerRect.left + playerRect.width;
        const startY = playerRect.top + playerRect.height / 2;
        const hookX = targetRect.left + targetRect.width / 2;
        const hookY = targetRect.top + targetRect.height / 2;
        const endX = firstRect.left + firstRect.width / 2;
        const endY = firstRect.top + firstRect.height / 2;
        
        console.log(`[ChainScythe] 블리츠 훅 시작! ${startX},${startY} → ${hookX},${hookY}`);
        
        // PixiJS 사용 가능하면 고급 연출
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            this.playPixiPullAnimation(
                startX, startY, hookX, hookY, endX, endY,
                targetEl, firstEl, middleEnemies, onComplete
            );
        } else {
            // GSAP만 사용
            this.playGsapPullAnimation(targetEl, firstEl, middleEnemies, onComplete);
        }
    },
    
    // ==========================================
    // ⛓️ PixiJS 블리츠크랭크 스타일 훅
    // ==========================================
    playPixiPullAnimation(startX, startY, hookX, hookY, endX, endY, targetEl, firstEl, middleEnemies, onComplete) {
        const pixi = PixiRenderer;
        
        // 사슬 컨테이너
        const chainContainer = new PIXI.Container();
        pixi.effectsContainer.addChild(chainContainer);
        
        // 훅 (낫) 그래픽
        const hook = new PIXI.Graphics();
        hook.moveTo(0, -15);
        hook.lineTo(20, 0);
        hook.lineTo(0, 15);
        hook.lineTo(-5, 0);
        hook.closePath();
        hook.fill({ color: '#c0c0c0', alpha: 1 });
        hook.stroke({ width: 2, color: '#808080', alpha: 1 });
        hook.x = startX;
        hook.y = startY;
        chainContainer.addChild(hook);
        
        // 훅 글로우
        const hookGlow = new PIXI.Graphics();
        hookGlow.circle(0, 0, 25);
        hookGlow.fill({ color: '#ff6600', alpha: 0.4 });
        hook.addChild(hookGlow);
        
        // 사슬 링크들
        const chainLinks = [];
        const linkCount = 20;
        for (let i = 0; i < linkCount; i++) {
            const link = new PIXI.Graphics();
            // 타원형 체인 링크
            link.ellipse(0, 0, 8, 5);
            link.stroke({ width: 3, color: '#888888', alpha: 0.9 });
            link.x = startX;
            link.y = startY;
            link.rotation = (i % 2) * Math.PI / 2;
            chainContainer.addChildAt(link, 0);
            chainLinks.push(link);
        }
        
        // 애니메이션 상태
        let phase = 'throw'; // throw -> hook -> pull -> done
        let progress = 0;
        let currentTargetX = hookX;
        let currentTargetY = hookY;
        let pullProgress = 0;
        
        // 중간 충돌 포인트들
        const collisionPoints = middleEnemies.map(e => {
            const r = e.el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, el: e.el, hit: false };
        });
        collisionPoints.push({ x: endX, y: endY, el: firstEl, hit: false, isFinal: true });
        
        const animate = () => {
            if (phase === 'throw') {
                // 훅 날아가기
                progress += 0.08;
                
                const t = Math.min(progress, 1);
                const easeT = 1 - Math.pow(1 - t, 3); // easeOutCubic
                
                hook.x = startX + (hookX - startX) * easeT;
                hook.y = startY + (hookY - startY) * easeT;
                hook.rotation = progress * Math.PI * 4; // 회전
                
                // 글로우 펄스
                hookGlow.alpha = 0.3 + Math.sin(progress * 20) * 0.2;
                hookGlow.scale.set(1 + Math.sin(progress * 15) * 0.2);
                
                // 사슬 따라오기 (웨이브)
                chainLinks.forEach((link, i) => {
                    const delay = i * 0.03;
                    const linkT = Math.max(0, Math.min(1, (progress - delay) * 1.2));
                    link.x = startX + (hook.x - startX) * linkT;
                    link.y = startY + (hook.y - startY) * linkT + Math.sin((progress - delay) * 30) * 3;
                    link.alpha = linkT > 0 ? 1 : 0;
                });
                
                if (progress >= 1) {
                    phase = 'hook';
                    progress = 0;
                    
                    // 훅 걸림 이펙트
                    this.showHookImpact(hookX, hookY);
                    
                    // 타겟 플래시
                    gsap.to(targetEl, {
                        filter: 'brightness(2) drop-shadow(0 0 20px #ff6600)',
                        duration: 0.1
                    });
                }
            } else if (phase === 'hook') {
                // 훅 걸림 (짧은 딜레이)
                progress += 0.1;
                
                // 훅 흔들림
                hook.x = hookX + Math.sin(progress * 40) * 5;
                hook.rotation = Math.sin(progress * 30) * 0.3;
                
                if (progress >= 0.3) {
                    phase = 'pull';
                    progress = 0;
                    pullProgress = 0;
                }
            } else if (phase === 'pull') {
                // 끌어오기! - 쫙 하고 빠르게!
                progress += 0.06; // 빠르게!
                pullProgress = progress;
                
                // 이징: 처음에 빠르고 끝에서 살짝 감속 (easeOutQuad)
                const easeProgress = 1 - Math.pow(1 - progress, 2);
                
                // 현재 위치 계산
                const currentX = hookX + (endX - hookX) * easeProgress;
                const currentY = hookY + (endY - hookY) * easeProgress;
                
                // 훅 위치
                hook.x = currentX;
                hook.y = currentY;
                hook.rotation = 0;
                
                // 사슬 (플레이어에서 훅까지)
                chainLinks.forEach((link, i) => {
                    const linkT = i / linkCount;
                    link.x = startX + (currentX - startX) * linkT;
                    link.y = startY + (currentY - startY) * linkT;
                    // 팽팽해지는 효과
                    link.scale.x = 1 + (1 - linkT) * easeProgress * 0.3;
                });
                
                // 타겟 스프라이트 이동 (DOM)
                const pullDist = (hookX - endX) * easeProgress;
                gsap.set(targetEl, { x: -pullDist });
                
                // 충돌 체크
                collisionPoints.forEach((point, idx) => {
                    if (!point.hit && currentX <= point.x + 30) {
                        point.hit = true;
                        
                        // 충돌 이펙트!
                        this.showPixiCollision(point.x, point.y, point.isFinal);
                        
                        // 충돌 대미지
                        const dmg = point.isFinal ? 5 : 2;
                        this.showCollisionDamage(point.el, dmg);
                        
                        // 충돌당한 적 밀림 (빠르게 복귀)
                        gsap.to(point.el, {
                            x: point.isFinal ? -40 : -20,
                            rotation: point.isFinal ? -8 : -4,
                            filter: 'brightness(2)',
                            duration: 0.06,
                            ease: 'power3.out',
                            onComplete: () => {
                                gsap.to(point.el, {
                                    x: 0,
                                    rotation: 0,
                                    filter: 'brightness(1)',
                                    duration: 0.15,
                                    ease: 'power2.out'
                                });
                            }
                        });
                        
                        // 화면 흔들림
                        this.screenShake(point.isFinal ? 10 : 4, point.isFinal ? 150 : 80);
                    }
                });
                
                if (progress >= 1) {
                    // 완료! 사슬 제거
                    gsap.to(chainContainer, {
                        alpha: 0,
                        duration: 0.1,
                        onComplete: () => {
                            if (chainContainer.parent) {
                                pixi.effectsContainer.removeChild(chainContainer);
                                chainContainer.destroy({ children: true });
                            }
                        }
                    });
                    
                    // ✅ 충돌당한 적들만 원래 위치로 (타겟은 그대로 유지!)
                    collisionPoints.forEach(p => {
                        if (p.el && !p.isFinal) {
                            gsap.set(p.el, { clearProps: 'x,rotation,filter' });
                        }
                    });
                    
                    // ✅ 타겟은 현재 끌어온 위치에 유지 (clearProps 안 함)
                    // 콜백에서 DOM 재배치 후 자연스럽게 처리
                    
                    // 바로 콜백
                    if (onComplete) onComplete();
                    return; // 애니메이션 종료
                }
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    },
    
    // 훅 걸림 이펙트 (PixiJS)
    showHookImpact(x, y) {
        if (typeof PixiRenderer === 'undefined' || !PixiRenderer.initialized) return;
        
        const pixi = PixiRenderer;
        
        // 충격파
        for (let i = 0; i < 3; i++) {
            const ring = new PIXI.Graphics();
            ring.circle(0, 0, 20);
            ring.stroke({ width: 4 - i, color: i === 0 ? '#ffffff' : '#ff6600', alpha: 0.8 });
            ring.x = x;
            ring.y = y;
            pixi.effectsContainer.addChild(ring);
            
            let scale = 1;
            let alpha = 1;
            const animateRing = () => {
                scale += 0.15 - i * 0.02;
                alpha -= 0.05;
                ring.scale.set(scale);
                ring.alpha = alpha;
                
                if (alpha <= 0) {
                    pixi.effectsContainer.removeChild(ring);
                    ring.destroy();
                } else {
                    requestAnimationFrame(animateRing);
                }
            };
            setTimeout(animateRing, i * 40);
        }
        
        // 스파크
        pixi.createHitParticles(x, y, 12, '#ff6600');
    },
    
    // 충돌 이펙트 (PixiJS)
    showPixiCollision(x, y, isFinal) {
        if (typeof PixiRenderer === 'undefined' || !PixiRenderer.initialized) return;
        
        const pixi = PixiRenderer;
        const color = isFinal ? '#ff4400' : '#ffaa00';
        const size = isFinal ? 2 : 1;
        
        // 충격파
        pixi.createShockwave(x, y, color);
        
        // 파티클
        pixi.createHitParticles(x, y, isFinal ? 20 : 10, color);
        
        // 플래시
        if (isFinal) {
            pixi.screenFlash('#ff4400', 100);
            
            // 추가 폭발
            const burst = new PIXI.Graphics();
            burst.circle(0, 0, 40);
            burst.fill({ color: '#ffffff', alpha: 0.8 });
            burst.x = x;
            burst.y = y;
            pixi.effectsContainer.addChild(burst);
            
            let burstLife = 15;
            const animateBurst = () => {
                burstLife--;
                burst.alpha = burstLife / 15;
                burst.scale.set(1 + (1 - burstLife / 15) * 3);
                
                if (burstLife <= 0) {
                    pixi.effectsContainer.removeChild(burst);
                    burst.destroy();
                } else {
                    requestAnimationFrame(animateBurst);
                }
            };
            animateBurst();
        }
    },
    
    // GSAP 전용 연출 (PixiJS 없을 때)
    playGsapPullAnimation(targetEl, firstEl, middleEnemies, onComplete) {
        const targetRect = targetEl.getBoundingClientRect();
        const firstRect = firstEl.getBoundingClientRect();
        const totalDist = targetRect.left - firstRect.left;
        
        // 타겟 플래시
        gsap.to(targetEl, {
            filter: 'brightness(2)',
            duration: 0.15,
            yoyo: true,
            repeat: 1
        });
        
        // 끌어오기
        gsap.to(targetEl, {
            x: -totalDist,
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => {
                gsap.to(targetEl, {
                    x: 0,
                    filter: 'brightness(1)',
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: onComplete
                });
            }
        });
    },
    
    // 충돌 대미지 표시 (충돌 대미지로는 죽지 않음 - 최소 1HP 유지)
    showCollisionDamage(enemyEl, damage) {
        const rect = enemyEl.getBoundingClientRect();
        
        const dmgText = document.createElement('div');
        dmgText.textContent = `-${damage}`;
        dmgText.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            transform: translateX(-50%);
            font-size: 32px;
            font-weight: bold;
            color: #ff6600;
            text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;
            z-index: 10002;
            pointer-events: none;
        `;
        document.body.appendChild(dmgText);
        
        gsap.fromTo(dmgText, 
            { scale: 0.5, opacity: 0 },
            { scale: 1.2, opacity: 1, duration: 0.15, ease: 'back.out(2)',
                onComplete: () => {
                    gsap.to(dmgText, {
                        y: -60,
                        opacity: 0,
                        scale: 0.8,
                        duration: 0.6,
                        ease: 'power2.out',
                        onComplete: () => dmgText.remove()
                    });
                }
            }
        );
        
        // 실제 대미지 적용 (사망 가능)
        const index = parseInt(enemyEl.dataset.index);
        if (!isNaN(index) && gameState.enemies && gameState.enemies[index]) {
            const enemy = gameState.enemies[index];
            enemy.hp = Math.max(0, enemy.hp - damage);
            
            const hpFill = enemyEl.querySelector('.enemy-hp-fill');
            if (hpFill) {
                const percent = (enemy.hp / enemy.maxHp) * 100;
                hpFill.style.width = percent + '%';
            }
            
            if (typeof addLog === 'function') {
                addLog(`충돌! ${enemy.name}에게 ${damage} 피해`, 'damage');
            }
            
            // 사망 시 표시
            if (enemy.hp <= 0) {
                enemyEl.classList.add('enemy-dying');
                enemyEl.style.opacity = '0.5';
                if (typeof addLog === 'function') {
                    addLog(`💀 ${enemy.name} 사망!`, 'critical');
                }
            }
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
