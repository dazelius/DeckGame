// ==========================================
// Shadow Deck - 러시안 룰렛 카드
// 공용 카드 (모든 직업 사용 가능)
// Dark Souls 스타일 - 순수 VFX 연출
// ==========================================

// 러시안 룰렛 상태 (약실 추적)
const RussianRouletteState = {
    remainingChambers: 6,  // 남은 약실 수
    bulletPosition: 1,     // 총알 위치 (1~6)
    currentChamber: 0,     // 현재 약실 위치
    lastDamage: 15,        // 마지막으로 계산된 데미지 (리셋 전 저장용)
    
    // 새 게임 시작 (리볼버 돌리기)
    reset() {
        this.remainingChambers = 6;
        this.bulletPosition = Math.floor(Math.random() * 6) + 1;  // 1~6 랜덤
        this.currentChamber = 0;
        console.log(`[RussianRoulette] 리볼버 리셋! 총알 위치: ${this.bulletPosition}`);
    },
    
    // 방아쇠 당기기 - 데미지도 함께 반환
    pullTrigger() {
        this.currentChamber++;
        const isBullet = this.currentChamber === this.bulletPosition;
        
        // 데미지 계산 (리셋 전에!)
        this.lastDamage = 10 + (this.currentChamber * 5);  // 15, 20, 25, 30, 35, 40
        
        console.log(`[RussianRoulette] 방아쇠! 약실 ${this.currentChamber}/6, 총알: ${isBullet}, 데미지: ${this.lastDamage}`);
        
        if (isBullet) {
            // 총알! 다음을 위해 리셋 (데미지는 이미 저장됨)
            setTimeout(() => this.reset(), 100);  // 약간의 딜레이 후 리셋
        } else {
            this.remainingChambers--;
        }
        
        return { isBullet, damage: this.lastDamage };
    },
    
    // 현재 확률 가져오기 (1/남은 약실)
    getCurrentOdds() {
        const remaining = Math.max(1, 6 - this.currentChamber);
        return { hit: 1, total: remaining };
    },
    
    // 현재 약실에 따른 데미지 (리스크 증가)
    // 1번: 15, 2번: 20, 3번: 25, 4번: 30, 5번: 35, 6번: 40
    getCurrentDamage() {
        return this.lastDamage || 15;
    },
    
    // 다음 약실의 데미지 (설명용)
    getNextDamage() {
        const nextChamber = this.currentChamber + 1;
        return 10 + (nextChamber * 5);
    }
};

const RussianRouletteCards = {
    // ==========================================
    // 러시안 룰렛 (자신에게 사용)
    // ==========================================
    russianRoulette: {
        id: 'russianRoulette',
        name: '러시안 룰렛',
        type: CardType.SKILL,
        rarity: Rarity.LEGENDARY,
        cost: 0,
        icon: '◈',
        targetSelf: true,
        get description() {
            const odds = RussianRouletteState.getCurrentOdds();
            const dmg = RussianRouletteState.getNextDamage();
            return `자신에게 방아쇠를 당긴다.<br><span class="damage">1/${odds.total}</span> 확률로 <span class="damage">${dmg}</span> 데미지.<br>빈 슬롯이면 \'러시안 룰렛\' 획득.`;
        },
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            RussianRouletteVFX.play(playerEl, true, (isBullet, damage) => {
                if (isBullet) {
                    // 데미지 적용 (VFX에서 계산된 데미지 사용)
                    console.log(`[RussianRoulette] 플레이어 피격! 데미지: ${damage}`);
                    
                    state.player.hp -= damage;
                    if (state.player.hp < 0) state.player.hp = 0;
                    
                    if (typeof updateUI === 'function') updateUI();
                } else {
                    // 찰칵! 카드 획득 - CardAnimation 사용
                    const enemyCard = RussianRouletteCards.createEnemyCard();
                    
                    // CardAnimation으로 카드 획득 연출
                    if (typeof CardAnimation !== 'undefined') {
                        CardAnimation.drawToHand({
                            cost: enemyCard.cost,
                            cardType: enemyCard.type,
                            icon: enemyCard.icon,
                            name: enemyCard.name,
                            description: '적에게 방아쇠를 당긴다.',
                            onComplete: () => {
                                if (typeof gameState !== 'undefined') {
                                    gameState.hand.push(enemyCard);
                                    if (typeof renderHand === 'function') renderHand();
                                }
                            }
                        });
                    } else {
                        // CardAnimation 없으면 바로 추가
                        if (typeof gameState !== 'undefined') {
                            gameState.hand.push(enemyCard);
                            if (typeof renderHand === 'function') renderHand();
                        }
                    }
                    
                    // 카드 획득 VFX
                    RussianRouletteVFX.showCardGain();
                }
            });
        }
    },
    
    // ==========================================
    // 러시안 룰렛 (적에게 사용)
    // ==========================================
    russianRouletteEnemy: {
        id: 'russianRouletteEnemy',
        name: '러시안 룰렛',
        type: CardType.ATTACK,
        rarity: Rarity.LEGENDARY,
        cost: 0,
        icon: '◉',
        exhaust: true,
        get description() {
            const odds = RussianRouletteState.getCurrentOdds();
            const dmg = RussianRouletteState.getNextDamage();
            return `적에게 방아쇠를 당긴다.<br><span class="damage">1/${odds.total}</span> 확률로 <span class="damage">${dmg}</span> 데미지.<br>빈 슬롯이면 \'러시안 룰렛\' 획득.`;
        },
        effect: (state) => {
            // 선택된 적 인덱스로 타겟 가져오기 (가장 정확한 방법)
            let targetIndex = state.selectedEnemyIndex ?? 0;
            let target = state.enemies?.[targetIndex];
            
            // 죽은 적이면 살아있는 적 찾기
            if (!target || target.hp <= 0) {
                const aliveIndex = state.enemies?.findIndex(e => e && e.hp > 0) ?? -1;
                if (aliveIndex >= 0) {
                    targetIndex = aliveIndex;
                    target = state.enemies[aliveIndex];
                }
            }
            
            console.log(`[RussianRoulette] 타겟: ${target?.name}, 인덱스: ${targetIndex}, selectedEnemyIndex: ${state.selectedEnemyIndex}`);
            
            if (!target || target.hp <= 0) {
                // 대상 없음 - 빈 클릭 VFX
                RussianRouletteVFX.showNoTarget();
                return;
            }
            
            const enemyEl = RussianRouletteCards.getTargetEnemyElement(target);
            
            // 타겟 정보를 VFX에 전달
            RussianRouletteVFX.play(enemyEl, false, (isBullet, damage) => {
                if (isBullet) {
                    // 데미지 적용 (VFX에서 계산된 데미지 사용)
                    console.log(`[RussianRoulette] 적 피격! 타겟: ${target?.name}, 데미지: ${damage}`);
                    
                    if (typeof dealDamage === 'function') {
                        dealDamage(target, damage);
                    } else {
                        target.hp -= damage;
                    }
                    
                    if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                } else {
                    // 찰칵! 카드 획득 - CardAnimation 사용
                    const selfCard = RussianRouletteCards.createSelfCard();
                    
                    // CardAnimation으로 카드 획득 연출
                    if (typeof CardAnimation !== 'undefined') {
                        CardAnimation.drawToHand({
                            cost: selfCard.cost,
                            cardType: selfCard.type,
                            icon: selfCard.icon,
                            name: selfCard.name,
                            description: '자신에게 방아쇠를 당긴다.',
                            onComplete: () => {
                                if (typeof gameState !== 'undefined') {
                                    gameState.hand.push(selfCard);
                                    if (typeof renderHand === 'function') renderHand();
                                }
                            }
                        });
                    } else {
                        // CardAnimation 없으면 바로 추가
                        if (typeof gameState !== 'undefined') {
                            gameState.hand.push(selfCard);
                            if (typeof renderHand === 'function') renderHand();
                        }
                    }
                    
                    // 카드 획득 VFX
                    RussianRouletteVFX.showCardGain();
                }
            });
        }
    },
    
    // ==========================================
    // 헬퍼 함수
    // ==========================================
    createSelfCard() {
        const card = {
            ...RussianRouletteCards.russianRoulette,
            instanceId: `russianRoulette_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        Object.defineProperty(card, 'description', Object.getOwnPropertyDescriptor(RussianRouletteCards.russianRoulette, 'description'));
        return card;
    },
    
    createEnemyCard() {
        const card = {
            ...RussianRouletteCards.russianRouletteEnemy,
            instanceId: `russianRouletteEnemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        Object.defineProperty(card, 'description', Object.getOwnPropertyDescriptor(RussianRouletteCards.russianRouletteEnemy, 'description'));
        return card;
    },
    
    getTargetEnemyElement(enemy) {
        if (!enemy) return null;
        
        if (typeof gameState !== 'undefined' && gameState.enemies) {
            const idx = gameState.enemies.indexOf(enemy);
            console.log(`[RR] getTargetEnemyElement - 적 인덱스: ${idx}, 적 이름: ${enemy?.name}`);
            
            if (idx >= 0) {
                // getEnemyElement 함수 사용 (가장 안정적)
                if (typeof getEnemyElement === 'function') {
                    const el = getEnemyElement(idx);
                    if (el) return el;
                }
                
                // fallback: enemies-container에서 찾기
                const container = document.getElementById('enemies-container');
                if (container) {
                    const el = container.querySelector(`[data-index="${idx}"]`);
                    if (el) return el;
                }
                
                // fallback: 전체 문서에서 찾기
                const el = document.querySelector(`.enemy-unit[data-index="${idx}"]`);
                if (el) return el;
            }
        }
        
        // 최종 fallback
        return document.querySelector('.enemy-unit[data-index="0"]') || document.getElementById('enemy');
    }
};

// ==========================================
// 러시안 룰렛 VFX 시스템 (다크소울 스타일)
// ==========================================
const RussianRouletteVFX = {
    // 타겟 스프라이트 가져오기
    getTargetSprite(targetEl, isSelf) {
        if (isSelf) {
            // 플레이어 스프라이트
            if (typeof JobSystem !== 'undefined' && JobSystem.currentJob && JobSystem.jobs[JobSystem.currentJob]) {
                return JobSystem.jobs[JobSystem.currentJob].sprite || 'hero.png';
            }
            return 'hero.png';
        } else {
            // 적 스프라이트
            if (targetEl) {
                // 적 요소에서 이미지 찾기
                const imgEl = targetEl.querySelector('img');
                if (imgEl && imgEl.src) {
                    return imgEl.src;
                }
            }
            // gameState에서 적 정보 가져오기
            if (typeof gameState !== 'undefined' && gameState.enemies && gameState.enemies.length > 0) {
                const targetIndex = targetEl?.dataset?.index || 0;
                const enemy = gameState.enemies[targetIndex] || gameState.enemies[0];
                if (enemy && enemy.sprite) {
                    return enemy.sprite;
                }
            }
            return 'goblin.png';  // 기본 적 스프라이트
        }
    },
    
    // 메인 VFX 재생
    play(targetEl, isSelf, callback) {
        const result = RussianRouletteState.pullTrigger();
        const isBullet = result.isBullet;
        const damage = result.damage;
        const currentChamber = isBullet ? 6 : RussianRouletteState.currentChamber;  // 총알이면 6번째
        
        this.injectStyles();
        
        // 타겟 스프라이트 가져오기
        const targetSprite = this.getTargetSprite(targetEl, isSelf);
        
        // 약실 표시 생성 (총알 위치는 숨김! 발사될 때만 공개)
        const chambers = [];
        for (let i = 1; i <= 6; i++) {
            const isPassed = i < currentChamber;
            const isCurrent = i === currentChamber;
            
            let symbol = '○';
            let extraClass = '';
            
            if (isPassed) {
                // 이미 지나간 약실 - 안전했음
                symbol = '—';
                extraClass = 'passed';
            } else if (isCurrent) {
                // 현재 발사 중인 약실 - 결과 모름 (스핀 중)
                symbol = '?';
                extraClass = 'current spinning-chamber';
            } else {
                // 아직 안 온 약실 - 미지
                symbol = '○';
                extraClass = '';
            }
            
            chambers.push(`<div class="rr-chamber rr-chamber-${i} ${extraClass}" data-index="${i}">${symbol}</div>`);
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'russian-roulette-overlay';
        
        // 피 튀김 파티클 생성
        let bloodDrops = '';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * 360;
            const distance = 30 + Math.random() * 70;
            const size = 5 + Math.random() * 15;
            const delay = Math.random() * 0.1;
            const x = Math.cos(angle * Math.PI / 180) * distance;
            const y = Math.sin(angle * Math.PI / 180) * distance;
            bloodDrops += `<div class="rr-blood-drop" style="
                width: ${size}px; 
                height: ${size * 1.3}px;
                left: calc(50% + ${x}px);
                top: calc(50% + ${y}px);
                animation-delay: ${delay}s;
                transform: rotate(${angle + 90}deg);
            "></div>`;
        }
        
        overlay.innerHTML = `
            <!-- 타겟 캐릭터 스프라이트 (강조) -->
            <div class="rr-target-sprite ${isSelf ? 'self' : 'enemy'}">
                <img src="${targetSprite}" alt="Target" class="rr-sprite-img">
                <div class="rr-sprite-glow"></div>
                <!-- 스포트라이트 -->
                <div class="rr-spotlight"></div>
                <!-- 총알 구멍 -->
                <div class="rr-bullet-hole"></div>
                <!-- 피 튀김 -->
                <div class="rr-blood-splatter">${bloodDrops}</div>
            </div>
            
            <div class="rr-revolver">
                <div class="rr-cylinder">
                    ${chambers.join('')}
                    <div class="rr-center">${currentChamber}/6</div>
                </div>
                <div class="rr-target">${isSelf ? 'SELF' : 'ENEMY'}</div>
                <div class="rr-odds">1/${7 - currentChamber}</div>
                <div class="rr-damage-preview">${damage} DMG</div>
                <div class="rr-result"></div>
            </div>
            
            <!-- 비네팅 -->
            <div class="rr-vignette"></div>
        `;
        
        document.body.appendChild(overlay);
        
        // 즉시 스핀 시작 + 조준 시작
        overlay.classList.add('spinning');
        
        // 리볼버 스핀 사운드 재생
        RussianRouletteVFX.playSpinSound();
        
        // 화면 줌인 효과
        if (typeof EffectSystem !== 'undefined') {
            EffectSystem.screenShake(3, 800);
        }
        
        // 700ms 후: 극도의 긴장
        setTimeout(() => {
            overlay.classList.add('intense');
            // 심장박동 강화
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(5, 500);
            }
        }, 700);
        
        // 1200ms 후: 클라이맥스 - 멈춤 직전
        setTimeout(() => {
            overlay.classList.remove('spinning');
            overlay.classList.add('climax');
            // 마지막 긴장
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(8, 300);
            }
        }, 1200);
        
        // 1500ms 후: 결과 공개
        setTimeout(() => {
            overlay.classList.remove('intense', 'climax');
            
            // 트리거 사운드 재생 (BANG이면 총소리, 아니면 빈 총소리)
            this.playTriggerSound(isBullet);
            
            // 결과에 따른 화면 효과
            if (isBullet && typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(25, 600);
            }
            
            // 현재 약실 결과 공개
            const currentChamberEl = overlay.querySelector(`.rr-chamber-${currentChamber}`);
            if (currentChamberEl) {
                currentChamberEl.classList.remove('spinning-chamber');
                if (isBullet) {
                    currentChamberEl.textContent = '◆';
                    currentChamberEl.classList.add('bullet', 'fired');
                } else {
                    currentChamberEl.textContent = '—';
                    currentChamberEl.classList.remove('current');
                    currentChamberEl.classList.add('passed', 'safe');
                }
            }
            
            // 결과 텍스트 & 스타일
            const resultEl = overlay.querySelector('.rr-result');
            const oddsEl = overlay.querySelector('.rr-odds');
            
            if (isBullet) {
                resultEl.textContent = 'BANG';
                oddsEl.textContent = 'DEATH';
                overlay.classList.add('result', 'bang');
                
                // 타겟에게 직접 피격 연출!
                this.playTargetHitVFX(targetEl, isSelf);
            } else {
                resultEl.textContent = 'CLICK';
                const remaining = 6 - currentChamber;
                oddsEl.textContent = remaining > 0 ? `NEXT: 1/${remaining}` : 'SAFE';
                overlay.classList.add('result', 'click');
            }
            
            // 콜백 및 페이드아웃
            setTimeout(() => {
                callback(isBullet, damage);
                
                setTimeout(() => {
                    overlay.classList.add('fade-out');
                    setTimeout(() => overlay.remove(), 300);
                }, 600);
            }, 700);
        }, 1500);
    },
    
    // 트리거 사운드 재생
    // 리볼버 스핀 사운드
    playSpinSound() {
        try {
            const sound = new Audio('sound/revolver-spin.mp3');
            sound.volume = 0.6;
            sound.play().catch(e => console.log('[RR] Spin sound play failed:', e));
        } catch (e) {
            console.log('[RR] Spin sound load failed:', e);
        }
    },
    
    playTriggerSound(isBullet = false) {
        try {
            // BANG = 실제 총소리, CLICK = 빈 총소리
            const soundFile = isBullet ? 'sound/retro-gun-shot.mp3' : 'sound/empty-gun-shot.mp3';
            const sound = new Audio(soundFile);
            sound.volume = isBullet ? 0.7 : 0.5;
            sound.play().catch(e => console.log('[RR] Sound play failed:', e));
        } catch (e) {
            console.log('[RR] Sound load failed:', e);
        }
    },
    
    // 타겟에게 직접 피격 VFX
    playTargetHitVFX(targetEl, isSelf) {
        if (typeof VFX === 'undefined') return;
        
        // 오버레이의 스프라이트 중앙에서 VFX 재생
        const spriteEl = document.querySelector('.rr-target-sprite');
        let cx, cy;
        
        if (spriteEl) {
            const rect = spriteEl.getBoundingClientRect();
            cx = rect.left + rect.width / 2;
            cy = rect.top + rect.height * 0.35;  // 중앙 (상단 35%)
        } else if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            cx = rect.left + rect.width / 2;
            cy = rect.top + rect.height * 0.4;
        } else {
            cx = window.innerWidth / 2;
            cy = window.innerHeight * 0.4;
        }
        
        const damage = RussianRouletteState.getCurrentDamage();
        const intensity = Math.min(3, damage / 15);
        
        // 1단계: 머즐 플래시 (총구 섬광) - 화면 중앙에서
        this.muzzleFlash(window.innerWidth / 2, window.innerHeight / 2);
        
        // 2단계: 강력한 피격 VFX - 머리에서
        setTimeout(() => {
            // 강력한 화면 플래시
            VFX.screenFlash('#ff0000', 200 + damage * 3);
            
            // 피격 이펙트
            if (VFX.bloodCritical) VFX.bloodCritical(cx, cy, { size: 180 * intensity });
            if (VFX.bloodHeavyImpact) VFX.bloodHeavyImpact(cx, cy, { size: 150 * intensity, duration: 700 + damage * 5 });
            
            // 충격파
            if (VFX.shockwave) VFX.shockwave(cx, cy, { color: '#8b0000', size: 200, lineWidth: 5 });
            
            // 화면 흔들림 - 강하게
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(20 + damage / 2, 500 + damage * 3);
            }
        }, 50);
        
        // 3단계: 피 튀김 - 많이
        setTimeout(() => {
            // 중앙 피 폭발
            if (VFX.bloodSplatter) {
                VFX.bloodSplatter(cx, cy, { count: 30 + damage, speed: 400 + damage * 4, size: 10 + damage / 4 });
            }
            
            // 주변 피 튀김
            for (let i = 0; i < 4; i++) {
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 80;
                setTimeout(() => {
                    if (VFX.bloodSplatter) {
                        VFX.bloodSplatter(cx + offsetX, cy + offsetY, { count: 15, speed: 300, size: 7 });
                    }
                }, i * 50);
            }
            
            // 피 십자 슬래시
            if (VFX.bloodCrossSlash) {
                VFX.bloodCrossSlash(cx, cy, { size: 200 * intensity });
            }
        }, 120);
        
        // 4단계: 2차 충격파
        setTimeout(() => {
            if (VFX.shockwave) {
                VFX.shockwave(cx, cy, { color: '#dc143c', size: 300, lineWidth: 3 });
            }
            if (VFX.sparks) {
                VFX.sparks(cx, cy, { color: '#ff4444', count: 30, speed: 500, size: 5 });
            }
        }, 200);
        
        // 5단계: 데미지 숫자
        setTimeout(() => {
            this.showDamage(cx, cy - 50, damage);
        }, 250);
        
        // 실제 타겟에도 피격 효과 (게임 화면에서)
        if (targetEl) {
            setTimeout(() => {
                const realRect = targetEl.getBoundingClientRect();
                const realCx = realRect.left + realRect.width / 2;
                const realCy = realRect.top + realRect.height * 0.3;
                
                if (VFX.bloodImpact) VFX.bloodImpact(realCx, realCy);
                if (VFX.bloodSplatter) VFX.bloodSplatter(realCx, realCy, { count: 15, speed: 250, size: 6 });
            }, 400);
        }
    },
    
    // 머즐 플래시 (총구 섬광)
    muzzleFlash(x, y) {
        if (typeof VFX === 'undefined' || !VFX.ctx) return;
        
        // 섬광
        VFX.addAnimation({
            x, y,
            radius: 0,
            alpha: 1,
            startTime: Date.now(),
            duration: 150,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                this.radius = 80 * (1 - Math.pow(1 - progress, 2));
                this.alpha = 1 - progress;
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                // 밝은 섬광
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#ffaa00');
                gradient.addColorStop(0.6, '#ff4400');
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // 스파크
        VFX.sparks(x, y, { color: '#ffaa00', count: 12, speed: 15, size: 4 });
    },
    
    // 데미지 숫자 VFX (Canvas)
    showDamage(x, y, amount) {
        if (typeof VFX === 'undefined' || !VFX.ctx) return;
        
        const damageVFX = {
            x, y,
            amount,
            alpha: 1,
            scale: 0.5,
            offsetY: 0,
            startTime: Date.now(),
            duration: 1200,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 등장: 0~0.2, 유지: 0.2~0.6, 페이드: 0.6~1
                if (progress < 0.15) {
                    this.scale = 0.5 + (progress / 0.15) * 1.0;  // 0.5 -> 1.5
                    this.alpha = progress / 0.15;
                } else if (progress < 0.25) {
                    this.scale = 1.5 - ((progress - 0.15) / 0.1) * 0.5;  // 1.5 -> 1.0
                    this.alpha = 1;
                } else if (progress < 0.6) {
                    this.scale = 1;
                    this.alpha = 1;
                } else {
                    this.alpha = 1 - (progress - 0.6) / 0.4;
                    this.scale = 1;
                }
                
                this.offsetY = -progress * 60;  // 위로 떠오름
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y + this.offsetY);
                ctx.scale(this.scale, this.scale);
                ctx.globalAlpha = this.alpha;
                
                // 그림자
                ctx.shadowColor = '#000';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                
                // 텍스트
                ctx.font = 'bold 48px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 외곽선
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 6;
                ctx.strokeText(`-${this.amount}`, 0, 0);
                
                // 빨간 글씨
                ctx.fillStyle = '#dc143c';
                ctx.shadowColor = '#8b0000';
                ctx.shadowBlur = 20;
                ctx.fillText(`-${this.amount}`, 0, 0);
                
                ctx.restore();
            }
        };
        
        VFX.addAnimation(damageVFX);
    },
    
    // 카드 획득 VFX
    showCardGain() {
        if (typeof VFX === 'undefined' || !VFX.ctx) return;
        
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight - 150;
        
        // 반짝임 파티클
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dist = 40 + Math.random() * 30;
            
            VFX.particles.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2 - 1,
                size: 3 + Math.random() * 3,
                color: '#8b7355',
                life: 600,
                maxLife: 600,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.96;
                    this.vy *= 0.96;
                    this.life -= 16;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
        
        VFX.ensureLoop();
        
        // 획득 링 이펙트
        VFX.addAnimation({
            x: cx,
            y: cy,
            radius: 0,
            maxRadius: 80,
            alpha: 0.8,
            startTime: Date.now(),
            duration: 500,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                this.radius = this.maxRadius * (1 - Math.pow(1 - progress, 3));
                this.alpha = 0.8 * (1 - progress);
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = '#8b7355';
                ctx.lineWidth = 3 * (1 - this.radius / this.maxRadius);
                ctx.shadowColor = '#8b7355';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    },
    
    // 대상 없음 VFX
    showNoTarget() {
        if (typeof VFX === 'undefined' || !VFX.ctx) return;
        
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        
        // 실패 X 표시
        VFX.addAnimation({
            x: cx,
            y: cy,
            scale: 0,
            alpha: 1,
            startTime: Date.now(),
            duration: 800,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                if (progress < 0.2) {
                    this.scale = (progress / 0.2) * 1.2;
                    this.alpha = progress / 0.2;
                } else if (progress < 0.3) {
                    this.scale = 1.2 - ((progress - 0.2) / 0.1) * 0.2;
                    this.alpha = 1;
                } else if (progress < 0.6) {
                    this.scale = 1;
                    this.alpha = 1;
                } else {
                    this.scale = 1;
                    this.alpha = 1 - (progress - 0.6) / 0.4;
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.scale(this.scale, this.scale);
                ctx.globalAlpha = this.alpha;
                
                // X 표시
                ctx.strokeStyle = '#4a4a4a';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.shadowColor = '#2a2a2a';
                ctx.shadowBlur = 10;
                
                const size = 40;
                ctx.beginPath();
                ctx.moveTo(-size, -size);
                ctx.lineTo(size, size);
                ctx.moveTo(size, -size);
                ctx.lineTo(-size, size);
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // 어두운 연기
        VFX.smoke(cx, cy, { color: '#3a3a3a', size: 60, duration: 600, count: 8 });
    },
    
    // 스타일 주입
    injectStyles() {
        if (document.getElementById('russian-roulette-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'russian-roulette-styles';
        style.textContent = `
            .russian-roulette-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                opacity: 1;
            }
            
            @keyframes rrFadeIn {
                to { opacity: 1; }
            }
            
            .russian-roulette-overlay.fade-out {
                animation: rrFadeOut 0.3s ease forwards;
            }
            
            @keyframes rrFadeOut {
                to { opacity: 0; }
            }
            
            .rr-revolver {
                text-align: center;
            }
            
            .rr-cylinder {
                width: 220px;
                height: 220px;
                margin: 0 auto;
                border: 3px solid #3a3a3a;
                border-radius: 50%;
                position: relative;
                background: radial-gradient(circle, #1a1a1a 0%, #0a0a0a 70%, #000 100%);
                box-shadow: 
                    0 0 60px rgba(0,0,0,0.95), 
                    inset 0 0 40px rgba(0,0,0,0.9),
                    0 0 1px 1px #2a2a2a;
            }
            
            .rr-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.3rem;
                font-weight: bold;
                color: #4a4a4a;
                font-family: 'Cinzel', serif;
                letter-spacing: 2px;
            }
            
            .rr-chamber {
                position: absolute;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
                border: 2px solid #2a2a2a;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                color: #3a3a3a;
                box-shadow: inset 0 2px 6px rgba(0,0,0,0.8);
                transition: all 0.3s;
                font-family: 'Cinzel', serif;
            }
            
            .rr-chamber.passed {
                color: #1a4a1a;
                border-color: #0a2a0a;
                background: linear-gradient(145deg, #0a1a0a, #050a05);
                opacity: 0.5;
            }
            
            .rr-chamber.current {
                border-color: #8b7355;
                box-shadow: 0 0 12px rgba(139, 115, 85, 0.6);
            }
            
            .rr-chamber.spinning-chamber {
                animation: rrChamberSpin 0.15s linear infinite;
                color: #8b7355;
                text-shadow: 0 0 10px #8b7355;
            }
            
            @keyframes rrChamberSpin {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            .rr-chamber.safe {
                animation: rrSafe 0.3s ease;
            }
            
            @keyframes rrSafe {
                0% { transform: scale(1); background: #1a4a1a; }
                50% { transform: scale(1.2); background: #2a6a2a; }
                100% { transform: scale(1); }
            }
            
            @keyframes rrPulse {
                0%, 100% { box-shadow: 0 0 8px rgba(139, 115, 85, 0.4); }
                50% { box-shadow: 0 0 20px rgba(139, 115, 85, 0.8); }
            }
            
            .rr-chamber.bullet {
                color: #8b0000;
                text-shadow: 0 0 10px #8b0000;
                border-color: #4a0000;
                background: linear-gradient(145deg, #2a0000, #0a0000);
            }
            
            .rr-chamber.fired {
                color: #dc143c;
                font-size: 20px;
                border-color: #8b0000;
                box-shadow: 0 0 40px #8b0000, 0 0 80px #dc143c;
                animation: rrFired 0.3s ease;
            }
            
            @keyframes rrFired {
                0% { transform: scale(1); }
                50% { transform: scale(1.6); }
                100% { transform: scale(1); }
            }
            
            .rr-chamber-1 { top: 12px; left: 50%; transform: translateX(-50%); }
            .rr-chamber-2 { top: 45px; right: 18px; }
            .rr-chamber-3 { bottom: 45px; right: 18px; }
            .rr-chamber-4 { bottom: 12px; left: 50%; transform: translateX(-50%); }
            .rr-chamber-5 { bottom: 45px; left: 18px; }
            .rr-chamber-6 { top: 45px; left: 18px; }
            
            .russian-roulette-overlay.spinning .rr-cylinder {
                animation: rrSpin 0.8s cubic-bezier(0.17, 0.67, 0.12, 0.99);
            }
            
            @keyframes rrSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(720deg); }
            }
            
            /* ========== 스포트라이트 효과 ========== */
            .rr-spotlight {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 400px;
                height: 500px;
                background: radial-gradient(ellipse at center top, 
                    rgba(139, 0, 0, 0.3) 0%, 
                    rgba(139, 0, 0, 0.1) 30%, 
                    transparent 60%);
                pointer-events: none;
                opacity: 0;
                z-index: -1;
            }
            
            .russian-roulette-overlay.spinning .rr-spotlight {
                animation: rrSpotlightAppear 0.5s ease-out forwards;
            }
            
            @keyframes rrSpotlightAppear {
                0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
                100% { opacity: 1; transform: translateX(-50%) scale(1); }
            }
            
            .russian-roulette-overlay.intense .rr-spotlight {
                background: radial-gradient(ellipse at center top, 
                    rgba(220, 20, 60, 0.5) 0%, 
                    rgba(139, 0, 0, 0.2) 30%, 
                    transparent 60%);
                animation: rrSpotlightPulse 0.2s ease-in-out infinite;
            }
            
            @keyframes rrSpotlightPulse {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }
            
            .russian-roulette-overlay.climax .rr-spotlight {
                background: radial-gradient(ellipse at center top, 
                    rgba(220, 20, 60, 0.7) 0%, 
                    rgba(139, 0, 0, 0.3) 30%, 
                    transparent 60%);
                animation: rrSpotlightClimax 0.1s ease-in-out infinite;
            }
            
            @keyframes rrSpotlightClimax {
                0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
                50% { opacity: 0.9; transform: translateX(-50%) scale(1.05); }
            }
            
            .russian-roulette-overlay.bang .rr-spotlight {
                background: radial-gradient(ellipse at center top, 
                    rgba(255, 50, 50, 0.8) 0%, 
                    rgba(220, 20, 60, 0.4) 30%, 
                    transparent 60%);
                animation: rrSpotlightBang 0.4s ease-out forwards;
            }
            
            @keyframes rrSpotlightBang {
                0% { opacity: 1; transform: translateX(-50%) scale(1); }
                30% { opacity: 1; transform: translateX(-50%) scale(1.5); }
                100% { opacity: 0.5; transform: translateX(-50%) scale(1.2); }
            }
            
            /* ========== 비네팅 ========== */
            .rr-vignette {
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.6) 100%);
                z-index: 100;
            }
            
            .russian-roulette-overlay.spinning .rr-vignette {
                animation: rrVignetteSpinning 0.5s ease-in-out infinite;
            }
            
            @keyframes rrVignetteSpinning {
                0%, 100% { 
                    background: radial-gradient(ellipse at center, transparent 50%, rgba(40, 0, 0, 0.6) 100%);
                }
                50% { 
                    background: radial-gradient(ellipse at center, transparent 45%, rgba(60, 0, 0, 0.7) 100%);
                }
            }
            
            .russian-roulette-overlay.intense .rr-vignette {
                animation: rrVignetteIntense 0.2s ease-in-out infinite;
            }
            
            @keyframes rrVignetteIntense {
                0%, 100% { 
                    background: radial-gradient(ellipse at center, transparent 45%, rgba(80, 0, 0, 0.7) 100%);
                }
                50% { 
                    background: radial-gradient(ellipse at center, transparent 40%, rgba(100, 0, 0, 0.8) 100%);
                }
            }
            
            .russian-roulette-overlay.climax .rr-vignette {
                animation: rrVignetteClimax 0.1s ease-in-out infinite;
            }
            
            @keyframes rrVignetteClimax {
                0%, 100% { 
                    background: radial-gradient(ellipse at center, transparent 40%, rgba(100, 0, 0, 0.8) 100%);
                }
                50% { 
                    background: radial-gradient(ellipse at center, transparent 35%, rgba(139, 0, 0, 0.9) 100%);
                }
            }
            
            .russian-roulette-overlay.bang .rr-vignette {
                animation: rrVignetteBang 0.3s ease-out forwards;
            }
            
            @keyframes rrVignetteBang {
                0% { background: radial-gradient(ellipse at center, transparent 40%, rgba(139, 0, 0, 0.9) 100%); }
                30% { background: radial-gradient(ellipse at center, rgba(255, 50, 50, 0.2) 0%, rgba(139, 0, 0, 0.8) 70%); }
                100% { background: radial-gradient(ellipse at center, transparent 50%, rgba(80, 0, 0, 0.6) 100%); }
            }
            
            .russian-roulette-overlay.click .rr-vignette {
                animation: rrVignetteClick 0.5s ease-out forwards;
            }
            
            @keyframes rrVignetteClick {
                0% { background: radial-gradient(ellipse at center, transparent 40%, rgba(100, 0, 0, 0.8) 100%); }
                100% { background: radial-gradient(ellipse at center, transparent 60%, rgba(20, 40, 20, 0.5) 100%); }
            }
            
            /* 스핀 중 - 화면 전체 공포 효과 */
            .russian-roulette-overlay.spinning {
                animation: rrScreenTense 0.5s ease-in-out infinite;
            }
            
            @keyframes rrScreenTense {
                0%, 100% { 
                    background: rgba(0, 0, 0, 0.95);
                }
                50% { 
                    background: rgba(20, 0, 0, 0.95);
                }
            }
            
            /* 스핀 중 - 비네팅 펄스 */
            .russian-roulette-overlay.spinning::after {
                content: '';
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 30%, rgba(80, 0, 0, 0.4) 100%);
                pointer-events: none;
                animation: rrVignettePulse 0.3s ease-in-out infinite;
            }
            
            @keyframes rrVignettePulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            
            /* 스핀 중 - 심장박동 효과 */
            .russian-roulette-overlay.spinning .rr-revolver {
                animation: rrHeartbeat 0.4s ease-in-out infinite;
            }
            
            @keyframes rrHeartbeat {
                0%, 100% { transform: scale(1); }
                15% { transform: scale(1.03); }
                30% { transform: scale(1); }
                45% { transform: scale(1.02); }
            }
            
            /* ========== 극도의 긴장 상태 ========== */
            /* ========== intense 상태 - 극도의 긴장 ========== */
            .russian-roulette-overlay.intense .rr-target-sprite {
                animation: rrSpriteIntense 0.3s ease forwards;
            }
            
            @keyframes rrSpriteIntense {
                0% { transform: translateX(-50%) scale(1.15); }
                100% { transform: translateX(-50%) scale(1.25); }
            }
            
            .russian-roulette-overlay.intense .rr-sprite-img {
                animation: rrTrembleIntense 0.04s linear infinite;
                filter: 
                    drop-shadow(0 0 60px rgba(220, 20, 60, 1))
                    drop-shadow(0 0 120px rgba(139, 0, 0, 0.8))
                    brightness(0.7) contrast(1.3) saturate(0.7);
            }
            
            @keyframes rrTrembleIntense {
                0% { transform: translate(0, 0) rotate(0deg); }
                20% { transform: translate(-6px, 3px) rotate(-1.2deg); }
                40% { transform: translate(5px, -4px) rotate(1.5deg); }
                60% { transform: translate(-4px, 4px) rotate(-0.8deg); }
                80% { transform: translate(4px, -3px) rotate(0.8deg); }
                100% { transform: translate(-3px, 2px) rotate(-0.5deg); }
            }
            
            .russian-roulette-overlay.intense .rr-target-sprite::after {
                animation: rrCrosshairIntense 0.06s linear infinite;
                border-color: rgba(220, 20, 60, 0.9);
                box-shadow: 
                    inset 0 0 40px rgba(220, 20, 60, 0.5),
                    0 0 50px rgba(220, 20, 60, 0.6);
            }
            
            @keyframes rrCrosshairIntense {
                0% { transform: translateX(-50%) translate(0, 0) scale(1); }
                25% { transform: translateX(-50%) translate(-6px, 3px) scale(1.05); }
                50% { transform: translateX(-50%) translate(5px, -4px) scale(0.98); }
                75% { transform: translateX(-50%) translate(-4px, -2px) scale(1.03); }
                100% { transform: translateX(-50%) translate(3px, 2px) scale(1); }
            }
            
            .russian-roulette-overlay.intense::after {
                background: radial-gradient(ellipse at center, transparent 20%, rgba(100, 0, 0, 0.6) 100%);
                animation: rrVignetteIntense 0.2s ease-in-out infinite;
            }
            
            @keyframes rrVignetteIntense {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
            
            .russian-roulette-overlay.intense .rr-odds {
                animation: rrOddsFlash 0.15s linear infinite;
                color: #dc143c;
            }
            
            @keyframes rrOddsFlash {
                0%, 100% { opacity: 1; text-shadow: 0 0 20px #dc143c; }
                50% { opacity: 0.6; text-shadow: 0 0 40px #dc143c; }
            }
            
            /* ========== 클라이맥스 (결과 직전) ========== */
            .russian-roulette-overlay.climax {
                background: rgba(10, 0, 0, 0.98);
            }
            
            /* ========== climax 상태 - 발사 직전 ========== */
            .russian-roulette-overlay.climax .rr-target-sprite {
                animation: rrSpriteClimax 0.1s ease forwards;
            }
            
            @keyframes rrSpriteClimax {
                0% { transform: translateX(-50%) scale(1.25); }
                100% { transform: translateX(-50%) scale(1.35); }
            }
            
            .russian-roulette-overlay.climax .rr-sprite-img {
                animation: rrFinalTremble 0.02s linear infinite;
                filter: 
                    drop-shadow(0 0 80px rgba(220, 20, 60, 1))
                    drop-shadow(0 0 150px rgba(139, 0, 0, 1))
                    brightness(0.6) contrast(1.4) saturate(0.5);
            }
            
            @keyframes rrFinalTremble {
                0% { transform: translate(-3px, 2px) rotate(-0.3deg); }
                33% { transform: translate(3px, -2px) rotate(0.3deg); }
                66% { transform: translate(-2px, -2px) rotate(-0.2deg); }
                100% { transform: translate(2px, 1px) rotate(0.2deg); }
            }
            
            .russian-roulette-overlay.climax .rr-target-sprite::after {
                animation: none;
                transform: translateX(-50%) scale(1.2);
                border-color: #dc143c;
                box-shadow: 
                    inset 0 0 50px rgba(220, 20, 60, 0.7),
                    0 0 80px rgba(220, 20, 60, 0.8);
            }
            
            .russian-roulette-overlay.climax .rr-target-sprite::before {
                color: #dc143c;
                text-shadow: 0 0 30px #dc143c;
                animation: rrCrosshairFinalPulse 0.1s ease-in-out infinite;
            }
            
            @keyframes rrCrosshairFinalPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .russian-roulette-overlay.climax::after {
                background: radial-gradient(ellipse at center, transparent 10%, rgba(120, 0, 0, 0.7) 100%);
                opacity: 1;
                animation: none;
            }
            
            .russian-roulette-overlay.climax .rr-damage-preview {
                animation: rrDamageThrob 0.15s ease-in-out infinite;
                color: #ff4444;
                font-size: 1.6rem;
            }
            
            @keyframes rrDamageThrob {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .rr-target {
                margin-top: 30px;
                font-size: 1rem;
                color: #5a5a5a;
                font-family: 'Cinzel', serif;
                letter-spacing: 6px;
                text-transform: uppercase;
            }
            
            .rr-odds {
                margin-top: 8px;
                font-size: 1.2rem;
                color: #8b7355;
                font-family: 'Cinzel', serif;
                letter-spacing: 3px;
            }
            
            .rr-result {
                margin-top: 25px;
                font-size: 3.5rem;
                font-weight: bold;
                font-family: 'Cinzel', serif;
                opacity: 0;
                transform: scale(0.5);
                transition: all 0.3s ease;
                letter-spacing: 8px;
                text-transform: uppercase;
            }
            
            .russian-roulette-overlay.result .rr-result {
                opacity: 1;
                transform: scale(1);
            }
            
            .russian-roulette-overlay.bang .rr-result {
                color: #8b0000;
                text-shadow: 
                    0 0 20px #8b0000, 
                    0 0 40px #dc143c, 
                    0 0 80px #8b0000,
                    0 2px 0 #000;
                animation: rrBang 0.4s ease;
            }
            
            @keyframes rrBang {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.5) rotate(-3deg); }
                50% { transform: scale(1.3) rotate(3deg); }
                75% { transform: scale(1.4) rotate(-2deg); }
            }
            
            .russian-roulette-overlay.click .rr-result {
                color: #2a4a2a;
                text-shadow: 
                    0 0 15px #1a3a1a,
                    0 2px 0 #000;
            }
            
            .russian-roulette-overlay.bang .rr-cylinder {
                box-shadow: 
                    0 0 60px rgba(139, 0, 0, 0.8), 
                    0 0 120px rgba(220, 20, 60, 0.5),
                    inset 0 0 40px rgba(139, 0, 0, 0.3);
                border-color: #8b0000;
            }
            
            .russian-roulette-overlay.bang .rr-target,
            .russian-roulette-overlay.bang .rr-odds {
                color: #8b0000;
            }
            
            .russian-roulette-overlay.click .rr-target {
                color: #3a5a3a;
            }
            
            .russian-roulette-overlay.click .rr-odds {
                color: #4a6a4a;
            }
            
            /* CLICK - 스포트라이트 안도 */
            .russian-roulette-overlay.click .rr-spotlight {
                background: radial-gradient(ellipse at center top, 
                    rgba(50, 139, 50, 0.5) 0%, 
                    rgba(30, 80, 30, 0.2) 30%, 
                    transparent 60%);
                animation: rrSpotlightClick 0.5s ease-out forwards;
            }
            
            @keyframes rrSpotlightClick {
                0% { opacity: 1; }
                100% { opacity: 0.6; }
            }
            
            .russian-roulette-overlay.bang::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 200vmax;
                height: 200vmax;
                transform: translate(-50%, -50%);
                background: radial-gradient(
                    ellipse at center,
                    rgba(139, 0, 0, 0.3) 0%,
                    rgba(139, 0, 0, 0.1) 30%,
                    transparent 60%
                );
                pointer-events: none;
                animation: rrRedGlow 0.5s ease-out;
            }
            
            @keyframes rrRedGlow {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                50% { opacity: 1; }
                100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
            }
            
            /* 타겟 스프라이트 - 중앙 강조 배치 */
            .rr-target-sprite {
                position: absolute;
                left: 50%;
                bottom: 5%;
                transform: translateX(-50%);
                width: 350px;
                height: 500px;
                opacity: 1;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                z-index: 200;
            }
            
            .rr-target-sprite.enemy {
                /* 적도 중앙에 */
            }
            
            .rr-sprite-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: bottom center;
                filter: 
                    drop-shadow(0 0 40px rgba(139, 0, 0, 0.8))
                    drop-shadow(0 0 80px rgba(139, 0, 0, 0.4));
                transition: filter 0.3s, transform 0.3s;
                background: transparent !important;
            }
            
            /* 스핀 중 - 공포에 떠는 효과 + 줌인 */
            .russian-roulette-overlay.spinning .rr-target-sprite {
                opacity: 1 !important;
                animation: rrSpriteZoomIn 0.8s ease forwards;
            }
            
            @keyframes rrSpriteZoomIn {
                0% { transform: translateX(-50%) scale(1); opacity: 1; }
                100% { transform: translateX(-50%) scale(1.15); opacity: 1; }
            }
            
            .russian-roulette-overlay.spinning .rr-sprite-img {
                animation: rrTremble 0.1s linear infinite;
                filter: 
                    drop-shadow(0 0 50px rgba(139, 0, 0, 0.9))
                    drop-shadow(0 0 100px rgba(220, 20, 60, 0.5))
                    brightness(0.85) contrast(1.15);
            }
            
            @keyframes rrTremble {
                0% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(-4px, 2px) rotate(-0.8deg); }
                50% { transform: translate(3px, -2px) rotate(0.6deg); }
                75% { transform: translate(-2px, 3px) rotate(-0.4deg); }
                100% { transform: translate(2px, -3px) rotate(0.5deg); }
            }
            
            /* 스핀 중 - 조준선 불안정 */
            .russian-roulette-overlay.spinning .rr-target-sprite::after {
                animation: rrCrosshairShake 0.1s linear infinite;
                border-color: rgba(139, 0, 0, 0.8);
            }
            
            @keyframes rrCrosshairShake {
                0% { transform: translateX(-50%) translate(0, 0); }
                25% { transform: translateX(-50%) translate(-4px, 2px); }
                50% { transform: translateX(-50%) translate(3px, -3px); }
                75% { transform: translateX(-50%) translate(-2px, -1px); }
                100% { transform: translateX(-50%) translate(2px, 1px); }
            }
            
            /* 스핀 중 - 글로우 깜빡임 */
            .russian-roulette-overlay.spinning .rr-sprite-glow {
                animation: rrGlowFlicker 0.15s linear infinite;
                background: radial-gradient(ellipse at center bottom, rgba(139, 0, 0, 0.5) 0%, transparent 60%);
            }
            
            @keyframes rrGlowFlicker {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 0.8; }
            }
            
            .rr-sprite-glow {
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 200%;
                height: 50%;
                background: radial-gradient(ellipse at center bottom, rgba(139, 0, 0, 0.3) 0%, transparent 60%);
                pointer-events: none;
                opacity: 0.5;
                z-index: -1;
            }
            
            /* 조준선 - 중앙 */
            .rr-target-sprite::after {
                content: '';
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translateX(-50%);
                width: 100px;
                height: 100px;
                border: 3px solid rgba(139, 0, 0, 0.6);
                border-radius: 50%;
                box-shadow: 
                    inset 0 0 30px rgba(139, 0, 0, 0.3),
                    0 0 30px rgba(139, 0, 0, 0.4);
                animation: rrCrosshairPulse 0.8s ease-in-out infinite;
            }
            
            .rr-target-sprite::before {
                content: '+';
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 80px;
                font-weight: 100;
                color: rgba(139, 0, 0, 0.7);
                text-shadow: 0 0 15px rgba(139, 0, 0, 0.5);
                z-index: 10;
                margin-top: 50px;
            }
            
            @keyframes rrCrosshairPulse {
                0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
                50% { transform: translateX(-50%) scale(1.15); opacity: 1; }
            }
            
            /* BANG 시 스프라이트 반응 - 강력한 피격 */
            /* ========== BANG 결과 - 스프라이트 강렬한 피격 ========== */
            .russian-roulette-overlay.bang .rr-target-sprite {
                animation: rrSpriteBang 0.5s ease forwards;
            }
            
            @keyframes rrSpriteBang {
                0% { transform: translateX(-50%) scale(1.35); }
                15% { transform: translateX(-50%) scale(1.6) translateY(-20px); }
                30% { transform: translateX(calc(-50% + 30px)) scale(1.5) rotate(5deg); }
                50% { transform: translateX(calc(-50% - 20px)) scale(1.45) rotate(-3deg); }
                70% { transform: translateX(calc(-50% + 10px)) scale(1.4) rotate(2deg); }
                100% { transform: translateX(-50%) scale(1.3); }
            }
            
            .russian-roulette-overlay.bang .rr-target-sprite .rr-sprite-img {
                filter: 
                    drop-shadow(0 0 100px rgba(255, 50, 50, 1))
                    drop-shadow(0 0 200px rgba(220, 20, 60, 1))
                    brightness(2) saturate(2) contrast(1.2);
                animation: rrSpriteHit 0.5s ease;
            }
            
            .russian-roulette-overlay.bang .rr-target-sprite::after {
                border-color: #ff0000;
                box-shadow: 
                    inset 0 0 80px rgba(255, 50, 50, 1),
                    0 0 120px rgba(255, 0, 0, 1);
                animation: rrCrosshairBang 0.3s ease forwards;
            }
            
            @keyframes rrCrosshairBang {
                0% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(2); opacity: 1; }
                100% { transform: translateX(-50%) scale(3); opacity: 0; }
            }
            
            .russian-roulette-overlay.bang .rr-sprite-glow {
                background: radial-gradient(ellipse at center bottom, rgba(220, 20, 60, 0.8) 0%, rgba(139, 0, 0, 0.5) 40%, transparent 70%);
                opacity: 1;
                animation: rrGlowPulse 0.2s ease-in-out 4;
            }
            
            @keyframes rrSpriteHit {
                0% { transform: scale(1); }
                10% { transform: scale(1.08) translateX(-25px) rotate(-3deg); }
                20% { transform: scale(1.12) translateX(30px) rotate(4deg); }
                30% { transform: scale(1.1) translateX(-20px) rotate(-3deg); }
                40% { transform: scale(1.06) translateX(15px) rotate(2deg); }
                100% { transform: scale(1); }
            }
            
            @keyframes rrGlowPulse {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
            
            /* 피격 이펙트 - 총알 구멍 */
            .rr-bullet-hole {
                position: absolute;
                top: 35%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 50px;
                height: 50px;
                background: radial-gradient(circle, #000 0%, #1a0000 40%, transparent 70%);
                border-radius: 50%;
                box-shadow: 
                    0 0 30px #8b0000,
                    0 0 60px #dc143c,
                    inset 0 0 15px #000;
                opacity: 0;
                z-index: 20;
            }
            
            .russian-roulette-overlay.bang .rr-bullet-hole {
                animation: rrBulletHoleAppear 0.3s ease 0.1s forwards;
            }
            
            @keyframes rrBulletHoleAppear {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            /* 피 튀김 이펙트 */
            .rr-blood-splatter {
                position: absolute;
                top: 30%;
                left: 50%;
                width: 250px;
                height: 250px;
                transform: translate(-50%, -50%);
                pointer-events: none;
                opacity: 0;
                z-index: 15;
            }
            
            .russian-roulette-overlay.bang .rr-blood-splatter {
                animation: rrBloodSplatter 0.5s ease 0.05s forwards;
            }
            
            @keyframes rrBloodSplatter {
                0% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.3);
                }
                20% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1.5);
                }
                100% { 
                    opacity: 0.7; 
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            .rr-blood-drop {
                position: absolute;
                background: linear-gradient(180deg, #dc143c 0%, #8b0000 100%);
                border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                box-shadow: 0 0 8px #dc143c;
                opacity: 0;
            }
            
            .russian-roulette-overlay.bang .rr-blood-drop {
                animation: rrBloodDropFly 0.6s ease-out forwards;
            }
            
            @keyframes rrBloodDropFly {
                0% { 
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0);
                }
                20% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.5);
                }
                100% {
                    opacity: 0;
                    transform: translate(calc(-50% + var(--tx, 0px)), calc(-50% + var(--ty, 50px))) scale(0.5);
                }
            }
            
            /* CLICK 시 스프라이트 반응 - 안도 */
            /* ========== CLICK 결과 - 스프라이트 안도 ========== */
            .russian-roulette-overlay.click .rr-target-sprite {
                animation: rrSpriteClick 0.6s ease forwards;
            }
            
            @keyframes rrSpriteClick {
                0% { transform: translateX(-50%) scale(1.35); }
                30% { transform: translateX(-50%) scale(1.4); }
                100% { transform: translateX(-50%) scale(1.1); }
            }
            
            .russian-roulette-overlay.click .rr-target-sprite .rr-sprite-img {
                filter: 
                    drop-shadow(0 0 50px rgba(50, 139, 50, 0.8))
                    drop-shadow(0 0 100px rgba(30, 80, 30, 0.5))
                    brightness(1.3) saturate(1.1);
                animation: rrSpriteRelief 0.6s ease forwards;
            }
            
            @keyframes rrSpriteRelief {
                0% { filter: drop-shadow(0 0 80px rgba(220, 20, 60, 1)) brightness(0.6); }
                50% { filter: drop-shadow(0 0 60px rgba(50, 139, 50, 1)) brightness(1.4); }
                100% { filter: drop-shadow(0 0 50px rgba(50, 139, 50, 0.8)) brightness(1.2); }
            }
            
            .russian-roulette-overlay.click .rr-target-sprite::after {
                border-color: #2a5a2a;
                box-shadow: 
                    inset 0 0 30px rgba(50, 139, 50, 0.5),
                    0 0 50px rgba(50, 139, 50, 0.5);
                animation: rrCrosshairSafe 0.3s ease forwards;
            }
            
            @keyframes rrCrosshairSafe {
                0% { transform: translateX(-50%) scale(1.2); border-color: #dc143c; }
                100% { transform: translateX(-50%) scale(1); border-color: #2a5a2a; }
            }
            
            .russian-roulette-overlay.click .rr-sprite-glow {
                background: radial-gradient(ellipse at center bottom, rgba(50, 139, 50, 0.5) 0%, transparent 60%);
            }
            
            /* 데미지 프리뷰 */
            .rr-damage-preview {
                margin-top: 10px;
                font-size: 1.4rem;
                font-weight: bold;
                color: #8b0000;
                font-family: 'Cinzel', serif;
                letter-spacing: 2px;
                text-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
                opacity: 0.8;
            }
            
            .russian-roulette-overlay.bang .rr-damage-preview {
                color: #dc143c;
                font-size: 1.8rem;
                text-shadow: 0 0 20px rgba(220, 20, 60, 0.8);
                animation: rrDamagePulse 0.3s ease;
            }
            
            @keyframes rrDamagePulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
            }
            
            .russian-roulette-overlay.click .rr-damage-preview {
                color: #2a4a2a;
                text-shadow: 0 0 10px rgba(42, 74, 42, 0.5);
            }
        `;
        document.head.appendChild(style);
    }
};

// ==========================================
// 초기화
// ==========================================
function initRussianRouletteCards() {
    if (typeof cardDatabase !== 'undefined') {
        cardDatabase.russianRoulette = RussianRouletteCards.russianRoulette;
        cardDatabase.russianRouletteEnemy = RussianRouletteCards.russianRouletteEnemy;
        console.log('[RussianRoulette] 카드 등록 완료');
    } else {
        console.warn('[RussianRoulette] cardDatabase 없음, 지연 등록...');
        setTimeout(initRussianRouletteCards, 100);
    }
    
    RussianRouletteState.reset();
}

window.RussianRouletteCards = RussianRouletteCards;
window.RussianRouletteVFX = RussianRouletteVFX;
window.RussianRouletteState = RussianRouletteState;

window.resetRussianRoulette = function() {
    RussianRouletteState.reset();
    console.log('[RussianRoulette] 새 전투! 리볼버 리셋');
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRussianRouletteCards);
} else {
    initRussianRouletteCards();
}

console.log('[RussianRoulette] 러시안 룰렛 카드 로드됨');
