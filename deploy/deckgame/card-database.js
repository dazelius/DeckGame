// ==========================================
// Shadow Deck - 카드 데이터베이스
// ==========================================

// 카드 데이터베이스
const cardDatabase = {
    // ==========================================
    // 기본 카드
    // ==========================================
    strike: {
        id: 'strike',
        name: '베기',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="slash.png" alt="Slash" class="card-icon-img">',
        description: '<span class="damage">6</span> 데미지를 줍니다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 플레이어 돌진
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#ff4444', count: 1 });
                dealDamage(state.enemy, 6);
            });
            
            addLog('베기로 6 데미지!', 'damage');
        }
    },
    
    defend: {
        id: 'defend',
        name: '방어',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="shield.png" alt="Defend" class="card-icon-img">',
        description: '<span class="block-val">5</span> 방어도를 얻습니다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.shield(playerEl, { color: '#4fc3f7' });
            gainBlock(state.player, 5);
            addLog('5 방어도 획득!', 'block');
        }
    },
    
    // 닷지
    dodge: {
        id: 'dodge',
        name: '닷지',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '<img src="dodge.png" alt="Dodge" class="card-icon-img">',
        description: '<span class="block-val">3</span> 방어도. 카드 1장 드로우.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 연막 VFX
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.smoke(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    { color: '#667788', size: 150, duration: 700, count: 12 }
                );
            }
            
            // 방어도 획득
            gainBlock(state.player, 3);
            
            // 카드 1장 드로우 (딜레이 후)
            setTimeout(() => {
                drawCards(1, true);
            }, 400);
            
            addLog('닷지! 3 방어도 + 1 드로우!', 'block');
        }
    },
    
    bash: {
        id: 'bash',
        name: '강타',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 2,
        icon: '<img src="gangta.png" alt="Bash" class="card-icon-img">',
        description: '<span class="damage">12</span> 데미지.<br><span class="debuff-val">취약</span> 2턴 부여.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 플레이어 돌진
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#ff6b35', size: 200 });
                EffectSystem.screenShake(12, 300);
                dealDamage(state.enemy, 12);
                
                // 취약 부여
                state.enemy.vulnerable = (state.enemy.vulnerable || 0) + 2;
                addLog(`${state.enemy.name}에게 취약 2턴!`, 'debuff');
            });
            
            addLog('강타로 10 데미지!', 'damage');
        }
    },
    
    // ==========================================
    // 차크람 시스템
    // ==========================================
    
    // 차크람 던지기 (전체 공격)
    chakramThrow: {
        id: 'chakramThrow',
        name: '차크람 던지기',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        isAllEnemy: true, // 전체 공격 표시
        icon: '<img src="chakramThrow.png" alt="Chakram" class="card-icon-img">',
        description: '<span class="damage">모든 적</span>에게 <span class="damage">4</span> 데미지.<br>뽑기 덱에 \'차크람 되돌아오기\'를 1장 추가.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const playerRect = playerEl ? playerEl.getBoundingClientRect() : null;
            const startX = playerRect ? playerRect.left + playerRect.width / 2 : 200;
            const startY = playerRect ? playerRect.top + playerRect.height / 2 : window.innerHeight / 2;
            
            // 모든 적 수집 (x좌표 기준 정렬 - 왼쪽부터)
            const targets = [];
            let lastEnemyEl = null;
            
            if (gameState.enemies && gameState.enemies.length > 0) {
                gameState.enemies.forEach((enemy, index) => {
                    if (enemy.hp > 0) {
                        const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                        if (enemyEl) {
                            const rect = enemyEl.getBoundingClientRect();
                            targets.push({
                                x: rect.left + rect.width / 2,
                                y: rect.top + rect.height / 2,
                                enemy: enemy,
                                enemyEl: enemyEl
                            });
                            lastEnemyEl = enemyEl;
                        }
                    }
                });
                // x좌표 기준 정렬 (왼→오)
                targets.sort((a, b) => a.x - b.x);
            } else if (state.enemy && state.enemy.hp > 0) {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    targets.push({
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        enemy: state.enemy,
                        enemyEl: enemyEl
                    });
                    lastEnemyEl = enemyEl;
                }
            }
            
            if (targets.length === 0) return;
            
            // 비행 속도 (픽셀/ms)
            const speed = 1.2;
            
            // 각 적까지의 도달 시간 계산
            targets.forEach((target, idx) => {
                const dist = Math.sqrt(Math.pow(target.x - startX, 2) + Math.pow(target.y - startY, 2));
                target.hitTime = dist / speed;
            });
            
            // 차크람 VFX
            if (typeof VFX !== 'undefined') {
                const lastTarget = targets[targets.length - 1];
                VFX.chakram(
                    startX, startY,
                    lastTarget.x + 300, lastTarget.y,
                    { 
                        color: '#ffd700',
                        glowColor: '#ff8c00',
                        size: 55,
                        speed: 28,
                        spinSpeed: 35,
                        passThrough: true
                    }
                );
            }
            
            // 관통 시 데미지 + 이펙트
            targets.forEach((target) => {
                setTimeout(() => {
                    if (target.enemy.hp > 0) {
                        // 스파크 이펙트
                        if (typeof VFX !== 'undefined') {
                            VFX.sparks(target.x, target.y, { color: '#ffd700', count: 12, speed: 250 });
                            VFX.impact(target.x, target.y, { color: '#ff8c00', size: 60 });
                        }
                        
                        // 데미지
                        const originalTarget = gameState.targetEnemy;
                        gameState.targetEnemy = target.enemy;
                        dealDamage(target.enemy, 4);
                        gameState.targetEnemy = originalTarget;
                    }
                }, target.hitTime);
            });
            
            // 마지막 적 관통 후 카드 추가 & 연출
            const lastHitTime = targets[targets.length - 1].hitTime;
            setTimeout(() => {
                // 뽑기 덱에 차크람 되돌아오기 추가
                const chakramReturnCard = createCard('chakramReturn');
                if (chakramReturnCard) {
                    gameState.drawPile.push(chakramReturnCard);
                    if (typeof updateDeckCounts === 'function') updateDeckCounts();
                    addLog('차크람 되돌아오기가 뽑기 덱에 추가됨!', 'info');
                }
                
                if (lastEnemyEl) {
                    showChakramCardToDraw(lastEnemyEl);
                }
                
                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                
                setTimeout(() => {
                    if (typeof checkEnemyDefeated === 'function') {
                        checkEnemyDefeated();
                    }
                }, 300);
            }, lastHitTime + 100);
            
            addLog(`차크람 던지기! 모든 적에게 4 데미지!`, 'damage');
        }
    },
    
    // 차크람 되돌아오기 (전체 공격)
    chakramReturn: {
        id: 'chakramReturn',
        name: '차크람 되돌아오기',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 0,
        isAllEnemy: true, // 전체 공격 표시
        icon: '<img src="chakramThrow.png" alt="Chakram" class="card-icon-img">',
        description: '<span class="damage">모든 적</span>에게 <span class="damage">4</span> 데미지.<br>버린 카드에 \'차크람 던지기\'가 있으면 손패로 가져옴.',
        isEthereal: true, // 소멸
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const playerRect = playerEl ? playerEl.getBoundingClientRect() : null;
            const endX = playerRect ? playerRect.left + playerRect.width / 2 : 200;
            const endY = playerRect ? playerRect.top + playerRect.height / 2 : window.innerHeight / 2;
            
            // 시작점 (화면 오른쪽 밖)
            const startX = window.innerWidth + 100;
            const startY = window.innerHeight / 2;
            
            // 모든 적 수집 (x좌표 기준 역정렬 - 오른쪽부터)
            const targets = [];
            
            if (gameState.enemies && gameState.enemies.length > 0) {
                gameState.enemies.forEach((enemy, index) => {
                    if (enemy.hp > 0) {
                        const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                        if (enemyEl) {
                            const rect = enemyEl.getBoundingClientRect();
                            targets.push({
                                x: rect.left + rect.width / 2,
                                y: rect.top + rect.height / 2,
                                enemy: enemy,
                                enemyEl: enemyEl
                            });
                        }
                    }
                });
                // x좌표 기준 역정렬 (오→왼, 돌아오는 방향)
                targets.sort((a, b) => b.x - a.x);
            } else if (state.enemy && state.enemy.hp > 0) {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    targets.push({
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        enemy: state.enemy,
                        enemyEl: enemyEl
                    });
                }
            }
            
            if (targets.length === 0) return;
            
            // 비행 속도 (픽셀/ms)
            const speed = 1.2;
            
            // 각 적까지의 도달 시간 계산 (시작점에서)
            targets.forEach((target) => {
                const dist = Math.sqrt(Math.pow(target.x - startX, 2) + Math.pow(target.y - startY, 2));
                target.hitTime = dist / speed;
            });
            
            // 차크람 VFX
            if (typeof VFX !== 'undefined') {
                VFX.chakram(
                    startX, startY,
                    endX, endY,
                    { 
                        color: '#ffd700',
                        glowColor: '#ff8c00',
                        size: 55,
                        speed: 28,
                        spinSpeed: -35,
                        fromOffscreen: true
                    }
                );
            }
            
            // 관통 시 데미지 + 이펙트
            targets.forEach((target) => {
                setTimeout(() => {
                    if (target.enemy.hp > 0) {
                        // 스파크 이펙트
                        if (typeof VFX !== 'undefined') {
                            VFX.sparks(target.x, target.y, { color: '#ffd700', count: 12, speed: 250 });
                            VFX.impact(target.x, target.y, { color: '#ff8c00', size: 60 });
                        }
                        
                        // 데미지
                        const originalTarget = gameState.targetEnemy;
                        gameState.targetEnemy = target.enemy;
                        dealDamage(target.enemy, 4);
                        gameState.targetEnemy = originalTarget;
                    }
                }, target.hitTime);
            });
            
            // 마지막 적 관통 후 처리
            const lastHitTime = Math.max(...targets.map(t => t.hitTime));
            setTimeout(() => {
                // 버린 카드 더미에서 차크람 던지기 찾기
                const discardIndex = gameState.discardPile.findIndex(c => c.id === 'chakramThrow');
                if (discardIndex !== -1) {
                    showChakramCardFromDiscard(() => {
                        const chakramThrowCard = gameState.discardPile.splice(discardIndex, 1)[0];
                        gameState.hand.push(chakramThrowCard);
                        if (typeof updateDeckCounts === 'function') updateDeckCounts();
                        
                        if (typeof renderHand === 'function') {
                            renderHand();
                        }
                        
                        addLog('차크람 던지기를 손패로 회수!', 'info');
                    });
                }
                
                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                
                setTimeout(() => {
                    if (typeof checkEnemyDefeated === 'function') {
                        checkEnemyDefeated();
                    }
                }, 300);
            }, lastHitTime + 100);
            
            addLog(`차크람 되돌아오기! 모든 적에게 4 데미지!`, 'damage');
        }
    },
    
    // 전투 개막 (선천성 + 소멸)
    battleOpening: {
        id: 'battleOpening',
        name: '전투 개막',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '<img src="rush.png" alt="Battle Opening" class="card-icon-img">',
        description: '<span class="damage">8</span> 데미지.<br><span class="innate">선천성</span> · <span class="ethereal">소멸</span>',
        innate: true,      // 선천성: 전투 시작 시 항상 손패에
        ethereal: true,    // 소멸: 턴 종료 시 소멸
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 몸통박치기 이펙트
            EffectSystem.bodySlam(playerEl, enemyEl, () => {
                dealDamage(state.enemy, 8);
            });
            
            addLog('전투 개막! 8 데미지!', 'damage');
        }
    },

    // 단도
    dagger: {
        id: 'dagger',
        name: '검무',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '<img src="dando.png" alt="dagger" class="card-icon-img">',
        description: '\'단도 투척\' 카드를 3장 손패에 추가합니다.',
        addsCardsToHand: true, // 손패에 카드 추가하는 효과
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 이펙트
            EffectSystem.energize(playerEl);
            
            // 단도 투척 3장 손패에 추가 (playCard 이후에 딜레이로 실행)
            setTimeout(() => {
                const existingCount = gameState.hand.length;
                
                for (let i = 0; i < 3; i++) {
                    const shiv = createCard('shiv');
                    if (shiv) {
                        gameState.hand.push(shiv);
                    }
                }
                
                // 새 카드만 애니메이션 적용
                if (typeof addCardsToHandWithAnimation === 'function') {
                    addCardsToHandWithAnimation(existingCount, 3);
                } else if (typeof renderHandWithNewCards === 'function') {
                    renderHandWithNewCards(existingCount, 3);
                } else {
                    renderHand(false);
                }
            }, 350);
            
            addLog('단도 투척 3장 획득!');
        }
    },
    
    // 단도 투척
    shiv: {
        id: 'shiv',
        name: '단도 투척',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '<img src="dagger.png" alt="dagger" class="card-icon-img">',
        description: '<span class="damage">2</span> 데미지를 줍니다. 소멸.',
        isEthereal: true, // 소멸 카드
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 단검 투척 VFX
            if (playerEl && enemyEl && typeof VFX !== 'undefined') {
                const playerRect = playerEl.getBoundingClientRect();
                const enemyRect = enemyEl.getBoundingClientRect();
                
                VFX.dagger(
                    playerRect.left + playerRect.width / 2,
                    playerRect.top + playerRect.height / 2,
                    enemyRect.left + enemyRect.width / 2,
                    enemyRect.top + enemyRect.height / 2,
                    { 
                        color: '#c0c0c0',
                        glowColor: '#60a5fa',
                        size: 45,
                        speed: 32,
                        spinSpeed: 22
                    }
                );
            }
            
            setTimeout(() => {
                dealDamage(state.enemy, 2);
            }, 250);
            
            addLog('단도 투척! 2 데미지!', 'damage');
        }
    },

    // 처형의 칼날
    finisher: {
        id: 'finisher',
        name: '처형의 칼날',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '<img src="deadlySword.png" class="card-icon-img">',
        description: '공격 카드 수 × <span class="damage">5</span> 데미지.',
        getDynamicDescription() {
            // 처형의 칼날 자신도 공격 카드이므로 +1
            const attackCount = (gameState?.turnStats?.attackCardsPlayed || 0) + 1;
            const totalDamage = attackCount * 5;
            return `공격 카드 수(<span class="damage">${attackCount}</span>) × <span class="damage">5</span> = <span class="damage">${totalDamage}</span> 데미지`;
        },
        hitCount: (state) => Math.max(1, state.turnStats?.attackCardsPlayed || 1),
        hitInterval: 120,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 이번 턴에 사용한 공격 카드 수 (현재 카드 포함)
            const hitCount = state.turnStats.attackCardsPlayed;
            
            if (hitCount <= 0) {
                addLog('공격 카드를 먼저 사용하세요!');
                // 에너지 환불
                state.player.energy += 1;
                return;
            }
            
            // 플레이어 돌진
            EffectSystem.playerAttack(playerEl, enemyEl);
            
            // 처형의 칼날 이펙트
            EffectSystem.executionBlade(enemyEl, hitCount);
            
            // 데미지 처리 (히트 수만큼 5 데미지)
            const totalDamage = hitCount * 5;
            
            // 다중 히트 처리
            let hits = 0;
            const doHit = () => {
                if (hits >= hitCount) return;
                if (state.enemy.hp <= 0) return; // 적이 이미 죽었으면 중단
                
                // 데미지 적용
                dealDamage(state.enemy, 5);
                
                // 콤보 증가 (2타부터)
                if (hits > 0 && typeof RelicSystem !== 'undefined') {
                    RelicSystem.incrementCombo();
                    RelicSystem.showComboFloater(RelicSystem.combo.count);
                }
                
                hits++;
                
                // 적 사망 체크 (다중 적 시스템)
                if (state.enemy.hp <= 0) {
                    setTimeout(() => {
                        if (typeof checkEnemyDefeated === 'function') {
                            checkEnemyDefeated();
                        }
                    }, 300);
                    return;
                }
                
                // 다음 히트
                if (hits < hitCount) {
                    setTimeout(doHit, 120);
                }
            };
            
            // 첫 히트 딜레이 후 시작
            setTimeout(doHit, 80);
            
            addLog(`처형의 칼날! ${hitCount}회 × 3 = ${totalDamage} 데미지!`, 'damage');
        }
    },

    // 응집된 일격
    concentratedStrike: {
        id: 'concentratedStrike',
        name: '응집된 일격',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        baseCost: 3,
        cost: 3,
        icon: '<img src="chargeAttack.png" alt="Concentrated Strike" class="card-icon-img">',
        getDynamicDescription: function() {
            return `<span class="damage">12</span> 데미지. 카드 사용 시 코스트 -1. <span class="cost-info">(현재: ${this.cost})</span>`;
        },
        description: '<span class="damage">12</span> 데미지.<br>카드 사용 시 코스트 -1.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 플레이어 돌진
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                // 이펙트
                EffectSystem.slash(enemyEl, { color: '#a855f7', count: 2 });
                EffectSystem.particleBurst(
                    enemyEl.getBoundingClientRect().left + enemyEl.getBoundingClientRect().width / 2,
                    enemyEl.getBoundingClientRect().top + enemyEl.getBoundingClientRect().height / 2,
                    { color: '#a855f7', count: 15, speed: 200 }
                );
                EffectSystem.screenShake(8, 200);
                
                // 데미지
                dealDamage(state.enemy, 12);
            });
            
            addLog('응집된 일격! 12 데미지!', 'damage');
        }
    },

    // 연속 찌르기
    flurry: {
        id: 'flurry',
        name: '연속 찌르기',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="yungyuk.png" alt="Flurry" class="card-icon-img">',
        description: '<span class="damage">2</span> 데미지를 3회 줍니다.',
        hitCount: 3,
        hitInterval: 120,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            const totalHits = 3;
            const interval = 120;
            
            // 플레이어 돌진
            EffectSystem.playerAttack(playerEl, enemyEl);
            
            // 연속 찌르기 이펙트 시작
            EffectSystem.flurryStab(enemyEl, { 
                color: '#60a5fa', 
                hitCount: totalHits,
                interval: interval 
            });
            
            // 데미지 및 콤보 처리
            let hitCount = 0;
            
            const doHit = () => {
                if (hitCount >= totalHits) return;
                
                // 데미지
                dealDamage(state.enemy, 2);
                
                hitCount++;
                
                // 추가 콤보 카운트 (2번째, 3번째 타격)
                if (hitCount < totalHits && typeof RelicSystem !== 'undefined') {
                    RelicSystem.onCardPlayed({ type: CardType.ATTACK }, state);
                }
                
                // 다음 타격
                if (hitCount < totalHits) {
                    setTimeout(doHit, interval);
                }
            };
            
            doHit();
            addLog('연속 찌르기! 2×3 데미지!', 'damage');
        }
    },

    // ==========================================
    // 일반 공격 카드
    // ==========================================
    cleave: {
        id: 'cleave',
        name: '베기',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '🗡️',
        description: '<span class="damage">8</span> 데미지를 줍니다.',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            EffectSystem.slash(enemyEl, { color: '#ff6666', count: 2 });
            dealDamage(state.enemy, 8);
            addLog('베기로 8 데미지!', 'damage');
        }
    },
    
    pommelStrike: {
        id: 'pommelStrike',
        name: '자루 타격',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '🔨',
        description: '<span class="damage">9</span> 데미지를 줍니다.',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            EffectSystem.impact(enemyEl, { color: '#8b7355', size: 150 });
            dealDamage(state.enemy, 9);
            addLog('자루 타격으로 9 데미지!', 'damage');
        }
    },
    
    ironWave: {
        id: 'ironWave',
        name: '철벽파',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '🌊',
        description: '<span class="damage">5</span> 데미지 + <span class="block-val">5</span> 방어도',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            const playerEl = document.getElementById('player');
            EffectSystem.slash(enemyEl, { color: '#4a9eff' });
            EffectSystem.shield(playerEl, { color: '#4a9eff', duration: 400 });
            dealDamage(state.enemy, 5);
            gainBlock(state.player, 5);
            addLog('5 데미지 + 5 방어도!', 'damage');
        }
    },
    
    quickSlash: {
        id: 'quickSlash',
        name: '빠른 베기',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 0,
        icon: '💨',
        description: '<span class="damage">4</span> 데미지를 줍니다.',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            EffectSystem.slash(enemyEl, { color: '#88ccff', count: 1 });
            dealDamage(state.enemy, 4);
            addLog('빠른 베기로 4 데미지!', 'damage');
        }
    },
    
    // 비열한 일격
    dirtyStrike: {
        id: 'dirtyStrike',
        name: '비열한 일격',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="skill_biyul.png" alt="Dirty Strike" class="card-icon-img">',
        description: '<span class="damage">4</span> 데미지.<br><span class="debuff">취약</span> 1턴 부여.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 플레이어 돌진
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#9333ea', count: 1 });
                dealDamage(state.enemy, 4);
                
                // 취약 상태 부여
                if (!state.enemy.vulnerable) state.enemy.vulnerable = 0;
                state.enemy.vulnerable += 1;
                
                // 취약 이펙트
                showVulnerableEffect(enemyEl);
                
                // UI 업데이트
                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
            });
            
            addLog('비열한 일격! 4 데미지 + 취약 부여!', 'damage');
        }
    },
    
    // 강탈
    plunder: {
        id: 'plunder',
        name: '강탈',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="gangtal.png" alt="plunder" class="card-icon-img">',
        description: '<span class="damage">8</span> 데미지.<br><span class="debuff">취약</span> 시 <span class="energy">+2</span> 에너지.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            const wasVulnerable = state.enemy.vulnerable && state.enemy.vulnerable > 0;
            
            // 플레이어 돌진
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#f59e0b', count: 2 });
                dealDamage(state.enemy, 8);
                
                // 취약 상태면 에너지 회복
                if (wasVulnerable) {
                    state.player.energy += 2;
                    addLog('강탈 성공! +2 에너지!', 'energy');
                    
                    // 에너지 획득 이펙트
                    showEnergyGainEffect(2);
                    
                    // UI 즉시 업데이트
                    updateUI();
                    // 카드 상태도 업데이트 (에너지 변경으로 사용 가능해진 카드)
                    renderHand(false);
                }
            });
            
            if (wasVulnerable) {
                addLog('강탈! 8 데미지 + 에너지 강탈!', 'damage');
            } else {
                addLog('강탈! 8 데미지!', 'damage');
            }
        }
    },
    
    heavyBlow: {
        id: 'heavyBlow',
        name: '묵직한 일격',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 2,
        icon: '🔱',
        description: '<span class="damage">14</span> 데미지를 줍니다.',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            EffectSystem.impact(enemyEl, { color: '#cc4444', size: 250 });
            dealDamage(state.enemy, 14);
            addLog('묵직한 일격! 14 데미지!', 'damage');
        }
    },
    
    // ==========================================
    // 🧪 테스트용 카드 - 오버킬 테스트
    // ==========================================
    brutalSever: {
        id: 'brutalSever',
        name: '무자비한 절단',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 3,
        icon: '💀',
        description: '<span class="damage">60</span> 데미지!<br><span class="ethereal">오버킬 테스트용</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 화면 효과
            if (typeof VFX !== 'undefined') {
                VFX.screenFlash('#8b0000', 200);
            }
            
            // 플레이어 돌진 공격
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                // 강력한 임팩트
                EffectSystem.impact(enemyEl, { color: '#ff0000', size: 350 });
                EffectSystem.screenShake(30, 500);
                
                // 크로스 슬래시
                if (typeof VFX !== 'undefined') {
                    const rect = enemyEl.getBoundingClientRect();
                    VFX.bloodCrossSlash(rect.left + rect.width/2, rect.top + rect.height/2, {
                        size: 200,
                        duration: 600
                    });
                }
                
                // 60 데미지!
                dealDamage(state.enemy, 60);
            });
            
            addLog('💀 무자비한 절단! 60 데미지!', 'critical');
        }
    },

    // ==========================================
    // 고급 공격 카드
    // ==========================================
    shieldBash: {
        id: 'shieldBash',
        name: '방패 치기',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '🔰',
        description: '<span class="block-val">8</span> 방어도 + <span class="damage">8</span> 데미지',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            const playerEl = document.getElementById('player');
            EffectSystem.shield(playerEl, { color: '#4fc3f7' });
            setTimeout(() => {
                EffectSystem.impact(enemyEl, { color: '#4fc3f7', size: 180 });
                dealDamage(state.enemy, 8);
            }, 200);
            gainBlock(state.player, 8);
            addLog('8 방어도 + 8 데미지!');
        }
    },
    
    twinStrike: {
        id: 'twinStrike',
        name: '쌍격',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '⚔️⚔️',
        description: '<span class="damage">5</span> 데미지를 2회 줍니다.',
        hitCount: 2,
        hitInterval: 120,
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            EffectSystem.multiHit(enemyEl, 2, { color: '#ff4444', interval: 120 });
            dealDamage(state.enemy, 5);
            setTimeout(() => {
                dealDamage(state.enemy, 5);
            }, 120);
            addLog('쌍격! 5 + 5 데미지!', 'damage');
        }
    },
    
    ragingBlow: {
        id: 'ragingBlow',
        name: '격노의 일격',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 3,
        icon: '😤',
        description: '<span class="damage">20</span> 데미지를 줍니다.',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            EffectSystem.fire(enemyEl);
            EffectSystem.impact(enemyEl, { color: '#ff2200', size: 300 });
            dealDamage(state.enemy, 20);
            addLog('격노의 일격! 20 데미지!', 'damage');
        }
    },
    
    preciseStrike: {
        id: 'preciseStrike',
        name: '정밀 타격',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '🎯',
        description: '<span class="damage">7</span> 데미지. 방어도 무시.',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            EffectSystem.slash(enemyEl, { color: '#ffcc00', count: 1 });
            // 방어도 무시 데미지
            const originalBlock = state.enemy.block;
            state.enemy.block = 0;
            dealDamage(state.enemy, 7);
            state.enemy.block = originalBlock;
            addLog('정밀 타격! 방어 무시 7 데미지!', 'damage');
        }
    },

    // ==========================================
    // 희귀 공격 카드
    // ==========================================
    executionBlade: {
        id: 'executionBlade',
        name: '처형의 칼날',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '⚰️',
        description: '<span class="damage">12</span> 데미지.<br>HP 25%↓ 시 즉사.',
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            if (state.enemy.hp <= state.enemy.maxHp * 0.25) {
                EffectSystem.execute(enemyEl);
                setTimeout(() => {
                    state.enemy.hp = 0;
                    updateUI();
                }, 500);
                addLog('처형! 적 즉사!', 'damage');
            } else {
                EffectSystem.slash(enemyEl, { color: '#880000', count: 3 });
                dealDamage(state.enemy, 12);
                addLog('처형의 칼날! 12 데미지!', 'damage');
            }
        }
    },
    
    swordRain: {
        id: 'swordRain',
        name: '검우',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 3,
        icon: '🌧️',
        description: '<span class="damage">6</span> 데미지를 4회 줍니다.',
        hitCount: 4,
        hitInterval: 120,
        effect: (state) => {
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            EffectSystem.swordRain(enemyEl);
            let hits = 0;
            const hitIntervalTimer = setInterval(() => {
                dealDamage(state.enemy, 6);
                hits++;
                if (hits >= 4) {
                    clearInterval(hitIntervalTimer);
                }
            }, 120);
            addLog('검우! 6×4 데미지!', 'damage');
        }
    },

    // ==========================================
    // 일반 스킬 카드
    // ==========================================
    shrugItOff: {
        id: 'shrugItOff',
        name: '견디기',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '💪',
        description: '<span class="block-val">8</span> 방어도를 얻습니다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.shield(playerEl, { color: '#60a5fa' });
            gainBlock(state.player, 8);
            addLog('8 방어도 획득!', 'block');
        }
    },
    
    armorUp: {
        id: 'armorUp',
        name: '무장 강화',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '🛡️',
        description: '<span class="block-val">6</span> 방어도를 얻습니다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.shield(playerEl, { color: '#8b9dc3' });
            gainBlock(state.player, 6);
            addLog('6 방어도 획득!', 'block');
        }
    },
    
    battleCry: {
        id: 'battleCry',
        name: '전투 함성',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 0,
        icon: '📢',
        description: '<span class="block-val">3</span> 방어도를 얻습니다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.glow(playerEl, { color: '#ffd700', duration: 300 });
            gainBlock(state.player, 3);
            addLog('3 방어도 획득!', 'block');
        }
    },

    // ==========================================
    // 고급 스킬 카드
    // ==========================================
    ironFortress: {
        id: 'ironFortress',
        name: '철의 요새',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '🏰',
        description: '<span class="block-val">15</span> 방어도를 얻습니다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.shield(playerEl, { color: '#a0a0a0', duration: 800 });
            EffectSystem.particleRise(
                playerEl.getBoundingClientRect().left + playerEl.getBoundingClientRect().width / 2,
                playerEl.getBoundingClientRect().top + 100,
                { color: '#a0a0a0', count: 10, symbol: '🛡️' }
            );
            gainBlock(state.player, 15);
            addLog('철의 요새! 15 방어도!', 'block');
        }
    },
    
    secondWind: {
        id: 'secondWind',
        name: '재기',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '🌬️',
        description: '<span class="block-val">5</span> 방어도.<br>HP <span class="heal">3</span> 회복.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.shield(playerEl, { color: '#4ade80' });
            EffectSystem.heal(playerEl, { color: '#4ade80' });
            gainBlock(state.player, 5);
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
            updateUI();
            addLog('5 방어도 + 3 HP 회복!', 'heal');
        }
    },
    
    energize: {
        id: 'energize',
        name: '충전',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 0,
        icon: '⚡',
        description: '에너지 +1',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.energize(playerEl);
            state.player.energy += 1;
            updateUI();
            addLog('에너지 +1!');
        }
    },

    // ==========================================
    // 희귀 스킬 카드
    // ==========================================
    impenetrableWall: {
        id: 'impenetrableWall',
        name: '난공불락',
        type: CardType.SKILL,
        rarity: Rarity.RARE,
        cost: 3,
        icon: '🧱',
        description: '<span class="block-val">25</span> 방어도를 얻습니다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.shield(playerEl, { color: '#ffd700', duration: 1000 });
            EffectSystem.screenShake(5, 300);
            gainBlock(state.player, 25);
            addLog('난공불락! 25 방어도!', 'block');
        }
    },
    
    lifeDrain: {
        id: 'lifeDrain',
        name: '생명력 흡수',
        type: CardType.SKILL,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '🩸',
        description: 'HP <span class="heal">8</span> 회복',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.heal(playerEl, { color: '#ff6b6b', duration: 1000 });
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 8);
            updateUI();
            addLog('생명력 흡수! 8 HP 회복!', 'heal');
        }
    },
    
    // ==========================================
    // 상태이상 카드 (적이 부여)
    // ==========================================
    webTangle: {
        id: 'webTangle',
        name: '거미줄',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 1,
        targetSelf: true, // 자신에게 사용
        ethereal: true, // 턴 종료 시 소멸
        icon: '🕸️',
        description: '<span class="debuff">자신에게 취약 2턴 부여.</span>',
        effect: (state) => {
            // 자신에게 취약 부여 (gameState 직접 참조)
            if (!gameState.player.vulnerable) gameState.player.vulnerable = 0;
            gameState.player.vulnerable += 2;
            
            // 이펙트
            const playerEl = document.getElementById('player');
            if (playerEl && typeof EffectSystem !== 'undefined') {
                EffectSystem.debuff(playerEl);
            }
            if (typeof showPlayerVulnerableEffect === 'function') {
                showPlayerVulnerableEffect();
            }
            if (typeof updatePlayerStatusUI === 'function') {
                updatePlayerStatusUI();
            }
            
            addLog('💔 거미줄에 걸렸다! 취약 2턴!', 'debuff');
        }
    },
    
    // 마비 카드 (신경독으로 인한 상태이상)
    paralysis: {
        id: 'paralysis',
        name: '마비',
        type: CardType.STATUS,
        rarity: Rarity.BASIC,
        cost: 'X', // 사용 불가
        isParalysis: true, // 마비 상태 - 사용/버리기 불가
        unplayable: true,
        icon: '⚡',
        description: '<span class="debuff">사용할 수 없습니다. 턴 종료 시 소멸.</span>',
        effect: (state) => {
            // 사용 불가 - 이 effect는 호출되지 않음
            addLog('마비된 카드는 사용할 수 없습니다!', 'debuff');
        }
    },
    
    // ==========================================
    // 트라이포스 카드 세트
    // ==========================================
    
    // 만물상 (3장 드로우)
    generalStore: {
        id: 'generalStore',
        name: '만물상',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '🎁',
        description: '카드를 <span class="draw">3장</span> 드로우합니다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 이펙트
            if (typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.buff(rect.left + rect.width / 2, rect.top + rect.height / 2, { color: '#ffd700', size: 120 });
                VFX.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, { 
                    color: '#ffd700', 
                    count: 15, 
                    speed: 300 
                });
            }
            
            // 3장 드로우
            setTimeout(() => {
                drawCards(3, true);
            }, 300);
            
            addLog('만물상! 3장 드로우!', 'draw');
        }
    },
    
    // 트라이포스: 힘
    triforcePower: {
        id: 'triforcePower',
        name: '트라이포스: 힘',
        type: CardType.SKILL,
        rarity: Rarity.RARE,
        cost: 1,
        isEthereal: true, // 소멸
        retain: true,     // 보존
        isTriforce: true,
        icon: '<img src="threepower.png" alt="Triforce" class="card-icon-img">',
        description: '이번 턴 <span class="damage">공격력 +3</span>.<br><span class="retain">보존</span>. <span class="ethereal">소멸</span>. <span class="special">트라이포스</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 공격력 증가 버프
            if (!state.player.tempStrength) state.player.tempStrength = 0;
            state.player.tempStrength += 3;
            
            // 이펙트
            if (typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.buff(rect.left + rect.width / 2, rect.top + rect.height / 2, { color: '#ef4444', size: 100 });
            }
            
            // 트라이포스 추적
            TriforceSystem.onTriforceUsed('power', state);
            
            addLog('트라이포스: 힘! 공격력 +3!', 'buff');
        }
    },
    
    // 트라이포스: 용기
    triforceCourage: {
        id: 'triforceCourage',
        name: '트라이포스: 용기',
        type: CardType.SKILL,
        rarity: Rarity.RARE,
        cost: 1,
        isEthereal: true, // 소멸
        retain: true,     // 보존
        isTriforce: true,
        icon: '<img src="threepower.png" alt="Triforce" class="card-icon-img">',
        description: '<span class="block-val">10</span> 방어도.<br><span class="retain">보존</span>. <span class="ethereal">소멸</span>. <span class="special">트라이포스</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 방어도 획득
            if (typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.shield(rect.left + rect.width / 2, rect.top + rect.height / 2, { color: '#22c55e', size: 100 });
            }
            gainBlock(state.player, 10);
            
            // 트라이포스 추적
            TriforceSystem.onTriforceUsed('courage', state);
            
            addLog('트라이포스: 용기! 10 방어도!', 'block');
        }
    },
    
    // 트라이포스: 지혜
    triforceWisdom: {
        id: 'triforceWisdom',
        name: '트라이포스: 지혜',
        type: CardType.SKILL,
        rarity: Rarity.RARE,
        cost: 1,
        isEthereal: true, // 소멸
        retain: true,     // 보존
        isTriforce: true,
        icon: '<img src="threepower.png" alt="Triforce" class="card-icon-img">',
        description: '카드를 <span class="draw">3장</span> 드로우.<br><span class="retain">보존</span>. <span class="ethereal">소멸</span>. <span class="special">트라이포스</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 이펙트
            if (typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.buff(rect.left + rect.width / 2, rect.top + rect.height / 2, { color: '#3b82f6', size: 100 });
            }
            
            // 카드 3장 드로우
            setTimeout(() => {
                drawCards(3, true);
            }, 300);
            
            // 트라이포스 추적
            TriforceSystem.onTriforceUsed('wisdom', state);
            
            addLog('트라이포스: 지혜! 3장 드로우!', 'draw');
        }
    },
    
    // 마스터 소드
    masterSword: {
        id: 'masterSword',
        name: '마스터 소드',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 0,
        isEthereal: true, // 소멸
        isAllEnemy: true, // 전체 공격
        hitCount: 5,
        hitInterval: 150,
        icon: '<img src="mastersword.png" alt="Master Sword" class="card-icon-img">',
        description: '<span class="damage">모든 적</span>에게 <span class="damage">3</span> 데미지를 <span class="damage">5회</span>.<br><span class="ethereal">소멸</span>',
        effect: (state) => {
            // 타겟 위치 수집
            const targets = [];
            const hitCount = 5;
            const damagePerHit = 3;
            
            // 전체 적에게 데미지
            if (gameState.enemies && gameState.enemies.length > 0) {
                gameState.enemies.forEach((enemy, index) => {
                    if (enemy.hp > 0) {
                        const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                        if (enemyEl) {
                            const rect = enemyEl.getBoundingClientRect();
                            targets.push({
                                x: rect.left + rect.width / 2,
                                y: rect.top + rect.height / 2,
                                enemy: enemy,
                                enemyEl: enemyEl,
                                index: index
                            });
                        }
                    }
                });
                
                // 초기 전체 공격 VFX (간결하게)
                if (typeof VFX !== 'undefined' && targets.length > 0) {
                    // 각 타겟에 크로스 슬래시
                    targets.forEach((target, idx) => {
                        setTimeout(() => {
                            VFX.crossSlash(target.x, target.y, { 
                                color: '#00ff88', 
                                size: 120 
                            });
                        }, idx * 80);
                    });
                }
                
                // 5회 연속 데미지
                for (let hit = 0; hit < hitCount; hit++) {
                    setTimeout(() => {
                        targets.forEach((target) => {
                            if (target.enemy.hp <= 0) return;
                            
                            if (typeof dealDamage === 'function') {
                                const originalTarget = gameState.targetEnemy;
                                gameState.targetEnemy = target.enemy;
                                dealDamage(target.enemy, damagePerHit);
                                gameState.targetEnemy = originalTarget;
                            }
                            
                            // 히트 이펙트 (간단한 슬래시)
                            if (typeof VFX !== 'undefined') {
                                VFX.slash(target.x + (Math.random() - 0.5) * 40, 
                                         target.y + (Math.random() - 0.5) * 40, 
                                         { color: '#00ff88', length: 80, width: 6 });
                            }
                        });
                        
                        if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                        
                        // 마지막 히트에서 사망 체크
                        if (hit === hitCount - 1) {
                            setTimeout(() => {
                                if (typeof checkEnemyDefeated === 'function') {
                                    checkEnemyDefeated();
                                }
                            }, 200);
                        }
                    }, 200 + hit * 120);
                }
                
            } else if (state.enemy && state.enemy.hp > 0) {
                // 단일 적 시스템
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    const targetX = rect.left + rect.width / 2;
                    const targetY = rect.top + rect.height / 2;
                    
                    // 크로스 슬래시
                    if (typeof VFX !== 'undefined') {
                        VFX.crossSlash(targetX, targetY, { 
                            color: '#00ff88', 
                            size: 120 
                        });
                    }
                    
                    // 5회 연속 데미지
                    for (let hit = 0; hit < hitCount; hit++) {
                        setTimeout(() => {
                            if (state.enemy.hp > 0) {
                                dealDamage(state.enemy, damagePerHit);
                                
                                if (typeof VFX !== 'undefined') {
                                    VFX.slash(targetX + (Math.random() - 0.5) * 40, 
                                             targetY + (Math.random() - 0.5) * 40, 
                                             { color: '#00ff88', length: 80, width: 6 });
                                }
                            }
                        }, 200 + hit * 120);
                    }
                }
            }
            
            // 화면 흔들림
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(10, 400);
            }
            
            addLog('⚔️ 마스터 소드! 모든 적에게 3×5 데미지!', 'special');
        }
    },
    
    // ==========================================
    // 에너지 볼트 [영창]
    // ==========================================
    energyBolt: {
        id: 'energyBolt',
        name: '에너지 볼트',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '<img src="energybolt.png" alt="Energy Bolt" class="card-icon-img">',
        isIncantation: true, // [영창] 카드
        description: '에너지 볼트 시전.<br>턴 종료 시 랜덤 적 <span class="damage">3</span> 데미지.<br><span class="special">(최대 3개)</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            if (typeof EnergyBoltSystem === 'undefined') {
                addLog('에너지 볼트 시스템 오류!', 'error');
                return;
            }
            
            if (EnergyBoltSystem.bolts.length >= 3) {
                addLog('⚡ 과부하! 에너지 볼트 폭발!', 'critical');
                EnergyBoltSystem.triggerOvercharge(state);
                // 과부하 후 손패 업데이트 (카드 상태 변경 반영)
                if (typeof updateHandUI === 'function') {
                    setTimeout(() => updateHandUI(), 100);
                }
                return;
            }
            
            EnergyBoltSystem.addBolt();
            
            // MageVFX 에너지 볼트
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.energyBolt(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
            
            // 볼트 추가 후 손패 업데이트 (3스택이면 과부하 카드로 변경)
            if (typeof updateHandUI === 'function') {
                setTimeout(() => updateHandUI(), 100);
            }
            
            addLog(`⚡ 에너지 볼트! (${EnergyBoltSystem.bolts.length}/3)`, 'buff');
        }
    },
    
    // ==========================================
    // 닌자 카드 (그림자 분신 빌드)
    // ==========================================
    
    // 분신술 - 핵심 카드
    shadowClone: {
        id: 'shadowClone',
        name: '분신술',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '👤',
        description: '그림자 분신 1체 소환.<br>HP <span class="damage">5</span>, 지속 3턴.<br>적 공격을 대신 받고, 공격 시 <span class="damage">50%</span> 데미지로 따라 공격.<br><span class="special">(최대 3체)</span>',
        effect: (state) => {
            if (typeof ShadowCloneSystem === 'undefined') {
                addLog('분신 시스템 오류!', 'error');
                return;
            }
            
            if (ShadowCloneSystem.clones.length >= ShadowCloneSystem.maxClones) {
                addLog('분신이 이미 최대입니다!', 'warning');
                state.player.energy += 1;
                return;
            }
            
            ShadowCloneSystem.summonClone(3);
            addLog(`👤 분신술! 분신 소환! (${ShadowCloneSystem.clones.length}/3)`, 'buff');
        }
    },
    
    // 그림자 베기 - 기본 공격
    shadowSlash: {
        id: 'shadowSlash',
        name: '그림자 베기',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '🌑',
        description: '<span class="damage">6</span> 데미지.<br>분신이 있으면 <span class="damage">+3</span> 데미지.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            const hasClone = typeof ShadowCloneSystem !== 'undefined' && ShadowCloneSystem.clones.length > 0;
            const baseDamage = hasClone ? 9 : 6;
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#4a00b4', count: 1 });
                dealDamage(state.enemy, baseDamage);
            });
            
            addLog(`그림자 베기! ${baseDamage} 데미지!${hasClone ? ' (분신 보너스!)' : ''}`, 'damage');
        }
    },
    
    // 연막탄 - 방어 + 드로우
    smokeBomb: {
        id: 'smokeBomb',
        name: '연막탄',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '💨',
        description: '<span class="block-val">6</span> 방어도.<br>카드 1장 드로우.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.smoke(rect.left + rect.width/2, rect.top + rect.height/2, {
                    color: '#4a5568', size: 150, count: 20, duration: 800
                });
            }
            
            gainBlock(state.player, 6);
            setTimeout(() => { drawCards(1, true); }, 300);
            addLog('연막탄! 6 방어도 + 1 드로우!', 'block');
        }
    },
    
    // 그림자 폭발 - 분신 희생
    shadowExplosion: {
        id: 'shadowExplosion',
        name: '그림자 폭발',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '💥',
        description: '분신 1체 희생.<br><span class="damage">15</span> 데미지.',
        effect: (state) => {
            if (typeof ShadowCloneSystem === 'undefined' || ShadowCloneSystem.clones.length === 0) {
                addLog('희생할 분신이 없습니다!', 'warning');
                state.player.energy += 1;
                return;
            }
            
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            ShadowCloneSystem.sacrificeClone();
            
            setTimeout(() => {
                if (enemyEl && typeof VFX !== 'undefined') {
                    const rect = enemyEl.getBoundingClientRect();
                    VFX.impact(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#4a00b4', size: 200 });
                }
                EffectSystem.screenShake(15, 300);
                dealDamage(state.enemy, 15);
            }, 250);
            
            addLog('💥 그림자 폭발! 15 데미지!', 'damage');
        }
    },
    
    // 잠입 - 선천성 드로우
    infiltrate: {
        id: 'infiltrate',
        name: '잠입',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 0,
        innate: true,
        icon: '🌙',
        description: '카드 2장 드로우.<br><span class="innate">선천성</span> · <span class="ethereal">소멸</span>',
        isEthereal: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.buff(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#4a00b4', size: 80 });
            }
            setTimeout(() => { drawCards(2, true); }, 200);
            addLog('🌙 잠입! 2장 드로우!', 'draw');
        }
    },
    
    // 표창 난사 - 다중 히트
    shurikenBarrage: {
        id: 'shurikenBarrage',
        name: '표창 난사',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '⭐',
        hitCount: 4,
        hitInterval: 80,
        description: '<span class="damage">2</span> 데미지를 4회.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            const playerRect = playerEl?.getBoundingClientRect();
            const enemyRect = enemyEl?.getBoundingClientRect();
            
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    if (state.enemy.hp <= 0) return;
                    if (typeof VFX !== 'undefined' && playerRect && enemyRect) {
                        VFX.dagger(
                            playerRect.left + playerRect.width/2,
                            playerRect.top + playerRect.height/2 + (i - 1.5) * 15,
                            enemyRect.left + enemyRect.width/2,
                            enemyRect.top + enemyRect.height/2,
                            { color: '#c0c0c0', size: 25, speed: 40, spinSpeed: 30 }
                        );
                    }
                    setTimeout(() => { if (state.enemy.hp > 0) dealDamage(state.enemy, 2); }, 100);
                }, i * 80);
            }
            addLog('⭐ 표창 난사! 2×4 데미지!', 'damage');
        }
    },
    
    // ==========================================
    // 마법사 카드 (영창 시스템)
    // ==========================================
    
    // 마력 집중 - 방어 [영창×2]
    manaFocus: {
        id: 'manaFocus',
        name: '마력 집중',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="magicT.png" alt="Mana Focus" class="card-icon-img">',
        isIncantation: true, // [영창] 카드
        incantationBonus: 1, // 기본 1 + 보너스 1 = 총 2
        description: '<span class="block-val">3</span> 방어도.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 방어도
            gainBlock(state.player, 3);
            
            // MageVFX 마력 집중
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.manaFocus(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            addLog('🔮 마력 집중! 방어도 3!', 'block');
        }
    },
    
    // 아케인 볼트 - 무작위 5연발 공격 [영창]
    arcaneBolt: {
        id: 'arcaneBolt',
        name: '아케인 볼트',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="arcanebolt.png" alt="Arcane Bolt" class="card-icon-img">',
        isIncantation: true, // [영창] 카드
        hitCount: 5,
        hitInterval: 150,
        description: '무작위 적에게 <span class="damage">2</span> 데미지를 <span class="damage">5</span>회 발사.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 살아있는 적 수집
            const aliveEnemies = [];
            if (gameState.enemies && gameState.enemies.length > 0) {
                gameState.enemies.forEach((enemy, index) => {
                    if (enemy.hp > 0) {
                        const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                        if (el) aliveEnemies.push({ enemy, el, index });
                    }
                });
            }
            
            if (aliveEnemies.length === 0) {
                addLog('⚡ 아케인 볼트 - 대상 없음!', 'warning');
                return;
            }
            
            // 난사 시작 VFX (캐릭터 차지업)
            if (playerEl && typeof MageVFX !== 'undefined') {
                const pRect = playerEl.getBoundingClientRect();
                MageVFX.castCircle(pRect.left + pRect.width/2, pRect.top + pRect.height/2, '#a855f7', 60);
            }
            
            // 5연발 무작위 타겟 (빠른 난사)
            const baseInterval = 100; // 기본 발사 간격
            let totalDelay = 50; // 시작 딜레이
            
            for (let i = 0; i < 5; i++) {
                const randomDelay = baseInterval + Math.random() * 60; // 100~160ms 랜덤
                
                setTimeout(() => {
                    // 매 발사마다 살아있는 적 중 무작위 선택
                    const currentAlive = aliveEnemies.filter(t => t.enemy.hp > 0);
                    if (currentAlive.length === 0) return;
                    
                    const target = currentAlive[Math.floor(Math.random() * currentAlive.length)];
                    
                    // VFX
                    if (playerEl && target.el && typeof MageVFX !== 'undefined') {
                        const pRect = playerEl.getBoundingClientRect();
                        const eRect = target.el.getBoundingClientRect();
                        MageVFX.arcaneBolt(
                            pRect.left + pRect.width/2, pRect.top + pRect.height/2,
                            eRect.left + eRect.width/2, eRect.top + eRect.height/2
                        );
                    }
                    
                    // 데미지 (볼트가 도착하는 타이밍에)
                    setTimeout(() => {
                        if (target.enemy.hp > 0) {
                            dealDamage(target.enemy, 2);
                            if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                        }
                    }, 180);
                }, totalDelay);
                
                totalDelay += randomDelay;
            }
            
            addLog('⚡ 아케인 볼트 난사! 2×5 데미지!', 'damage');
        }
    },
    
    // 명상 - 0코스트 드로우 [영창]
    meditation: {
        id: 'meditation',
        name: '명상',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '<img src="medi.png" alt="Meditation" class="card-icon-img">',
        isIncantation: true, // [영창] 카드
        description: '카드 1장 드로우.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // MageVFX 명상
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.meditation(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            // 드로우
            setTimeout(() => { drawCards(1, true); }, 200);
            
            addLog('🧘 명상! 1 드로우!', 'draw');
        }
    },
    
    // 마나 증폭 - 대량 영창 [영창×4]
    manaAmplify: {
        id: 'manaAmplify',
        name: '마나 증폭',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '💠',
        isIncantation: true, // [영창] 카드
        incantationBonus: 3, // 기본 1 + 보너스 3 = 총 4
        description: '마력을 증폭시킨다.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 대형 이펙트
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.shockwave(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#8b5cf6', size: 150 });
                VFX.sparks(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#c084fc', count: 25, speed: 200 });
            }
            
            addLog('💠 마나 증폭!', 'buff');
        }
    },
    
    // 시간 왜곡 - 직전 카드 재사용 [영창×2] 소멸
    timeWarp: {
        id: 'timeWarp',
        name: '시간 왜곡',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '<img src="time.png" alt="Time Warp" class="card-icon-img">',
        isIncantation: true, // [영창] 카드
        incantationBonus: 1, // 기본 1 + 보너스 1 = 총 2
        isEthereal: true, // 소멸
        description: '직전에 사용한 카드를<br>한번 더 사용한다.<br><span class="ethereal">소멸</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // MageVFX 시간 왜곡
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.timeWarp(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            // 직전 카드 재사용
            if (!gameState.lastPlayedCard) {
                addLog('⏳ 시간 왜곡 - 직전 카드 없음!', 'warning');
                return;
            }
            
            const lastCard = gameState.lastPlayedCard;
            
            // 시간 왜곡 자신은 재사용 불가
            if (lastCard.id === 'timeWarp') {
                addLog('⏳ 시간 왜곡은 자기 자신을 복제할 수 없습니다!', 'warning');
                return;
            }
            
            addLog(`⏳ 시간 왜곡! "${lastCard.name}" 재사용!`, 'buff');
            
            // 약간의 딜레이 후 카드 효과 재발동
            setTimeout(() => {
                if (lastCard.effect) {
                    lastCard.effect(state);
                }
            }, 300);
        }
    },
    
    // 마력 해방 - 영창 소모 데미지
    manaRelease: {
        id: 'manaRelease',
        name: '마력 해방',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '💥',
        description: '영창 전부 소모.<br>영창 × <span class="damage">4</span> 데미지.',
        effect: (state) => {
            if (typeof IncantationSystem === 'undefined' || !IncantationSystem.isActive) {
                dealDamage(state.enemy, 0);
                addLog('영창 시스템이 비활성화 상태입니다.', 'warning');
                return;
            }
            
            const stacks = IncantationSystem.consumeAll();
            const damage = stacks * 4;
            
            if (damage <= 0) {
                addLog('영창이 없습니다!', 'warning');
                state.player.energy += 1; // 에너지 환불
                return;
            }
            
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 대형 폭발 이펙트
            if (enemyEl && typeof VFX !== 'undefined') {
                const rect = enemyEl.getBoundingClientRect();
                VFX.shockwave(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#8b5cf6', size: 200 + stacks * 20 });
                VFX.sparks(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#c084fc', count: 20 + stacks * 5, speed: 300 });
            }
            
            // 화면 흔들림
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(stacks * 2, 300);
            }
            
            setTimeout(() => {
                dealDamage(state.enemy, damage);
            }, 300);
            
            addLog(`💥 마력 해방! ${stacks} × 4 = ${damage} 데미지!`, 'damage');
        }
    },
    
    // 불안정한 마력 - 리스크/리워드 [영창×3]
    unstableMana: {
        id: 'unstableMana',
        name: '불안정한 마력',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 0,
        icon: '⚠️',
        isIncantation: true, // [영창] 카드
        incantationBonus: 2, // 기본 1 + 보너스 2 = 총 3
        description: '<span class="debuff">자신에게 4 데미지.</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 자해 데미지
            state.player.hp = Math.max(1, state.player.hp - 4);
            updateUI();
            
            // 피격 이펙트
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.sparks(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#ef4444', count: 10, speed: 150 });
            }
            
            if (typeof showDamagePopup === 'function' && playerEl) {
                showDamagePopup(playerEl, 4, 'self');
            }
            
            addLog('⚠️ 불안정한 마력! 4 자해!', 'debuff');
        }
    },
    
    // 과부하 - 조건부 대량 데미지
    overcharge: {
        id: 'overcharge',
        name: '과부하',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 2,
        isAllEnemy: true,
        icon: '⚡',
        description: '영창 5 이상 시 사용 가능.<br>영창 소모, <span class="damage">모든 적</span>에게 <span class="damage">20</span> 데미지.',
        effect: (state) => {
            if (typeof IncantationSystem === 'undefined' || !IncantationSystem.isActive) {
                addLog('영창 시스템이 비활성화 상태입니다.', 'warning');
                state.player.energy += 2;
                return;
            }
            
            if (IncantationSystem.getStacks() < 5) {
                addLog('영창이 5 이상 필요합니다!', 'warning');
                state.player.energy += 2;
                return;
            }
            
            IncantationSystem.consumeAll();
            
            // 전체 공격 이펙트
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            if (typeof VFX !== 'undefined') {
                VFX.shockwave(centerX, centerY, { color: '#fbbf24', size: 500, duration: 600 });
                
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        const angle = (i / 8) * Math.PI * 2;
                        VFX.lightning(
                            centerX, centerY,
                            centerX + Math.cos(angle) * 400,
                            centerY + Math.sin(angle) * 300,
                            { color: '#fbbf24', width: 4 }
                        );
                    }, i * 50);
                }
            }
            
            // 화면 흔들림
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(15, 500);
            }
            
            // 전체 적에게 데미지
            setTimeout(() => {
                if (gameState.enemies && gameState.enemies.length > 0) {
                    gameState.enemies.forEach((enemy, index) => {
                        if (enemy.hp > 0) {
                            const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                            enemy.hp = Math.max(0, enemy.hp - 20);
                            if (typeof showDamagePopup === 'function' && enemyEl) {
                                showDamagePopup(enemyEl, 20, 'magic');
                            }
                        }
                    });
                    if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                    setTimeout(() => {
                        if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
                    }, 300);
                } else if (state.enemy && state.enemy.hp > 0) {
                    dealDamage(state.enemy, 20);
                }
            }, 400);
            
            addLog('⚡ 과부하!! 전체 20 데미지!', 'damage');
        }
    },
    
    // 마법 방벽 - 방어 + 영창
    magicBarrier: {
        id: 'magicBarrier',
        name: '마법 방벽',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '<img src="magicdef.png" alt="Magic Barrier" class="card-icon-img">',
        isIncantation: true, // [영창] 카드
        description: '<span class="block-val">6</span> 방어도.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            gainBlock(state.player, 6);
            
            // MageVFX 마법 방벽
            if (playerEl && typeof MageVFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                MageVFX.magicBarrier(rect.left + rect.width/2, rect.top + rect.height/2);
            }
            
            addLog('🛡️ 마법 방벽! 6 방어도!', 'block');
        }
    },
    
    // 에테르 화살 - 선천성 관통 공격
    etherArrow: {
        id: 'etherArrow',
        name: '에테르 화살',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 0,
        innate: true,
        isEthereal: true,
        isAllEnemy: true, // 전체 공격 (관통)
        icon: '<img src="etherarrow.png" alt="Ether Arrow" class="card-icon-img">',
        description: '<span class="damage">모든 적</span>에게 <span class="damage">3</span> 데미지.<br><span class="innate">선천성</span> · <span class="ethereal">소멸</span>',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            if (!playerEl) return;
            
            const pRect = playerEl.getBoundingClientRect();
            const startX = pRect.left + pRect.width / 2;
            const startY = pRect.top + pRect.height / 2;
            
            // 모든 적 수집 (x좌표 기준 정렬)
            const targets = [];
            
            if (gameState.enemies && gameState.enemies.length > 0) {
                gameState.enemies.forEach((enemy, index) => {
                    if (enemy.hp > 0) {
                        const enemyEl = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                        if (enemyEl) {
                            const rect = enemyEl.getBoundingClientRect();
                            targets.push({
                                x: rect.left + rect.width / 2,
                                y: rect.top + rect.height / 2,
                                enemy: enemy,
                                enemyEl: enemyEl,
                                index: index
                            });
                        }
                    }
                });
                targets.sort((a, b) => a.x - b.x);
            } else if (state.enemy && state.enemy.hp > 0) {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    targets.push({
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        enemy: state.enemy,
                        enemyEl: enemyEl
                    });
                }
            }
            
            if (targets.length === 0) return;
            
            // MageVFX 에테르 화살 관통
            if (typeof MageVFX !== 'undefined') {
                const lastTarget = targets[targets.length - 1];
                MageVFX.etherArrowPierce(startX, startY, targets);
            }
            
            // 관통 데미지 (시간차)
            const speed = 1.5; // 픽셀/ms
            targets.forEach((target) => {
                const dist = Math.sqrt(Math.pow(target.x - startX, 2) + Math.pow(target.y - startY, 2));
                const hitTime = dist / speed;
                
                setTimeout(() => {
                    if (target.enemy.hp > 0) {
                        const originalTarget = gameState.targetEnemy;
                        gameState.targetEnemy = target.enemy;
                        dealDamage(target.enemy, 3);
                        gameState.targetEnemy = originalTarget;
                    }
                }, hitTime);
            });
            
            // 사망 체크
            const lastHitTime = Math.max(...targets.map(t => {
                const dist = Math.sqrt(Math.pow(t.x - startX, 2) + Math.pow(t.y - startY, 2));
                return dist / speed;
            }));
            
            setTimeout(() => {
                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
            }, lastHitTime + 200);
            
            addLog(`✨ 에테르 화살! 모든 적에게 3 데미지!`, 'damage');
        }
    }
};

console.log('[Card Database] 카드 데이터베이스 로드됨');