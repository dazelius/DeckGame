// ==========================================
// Shadow Deck - 카드 데이터베이스
// ==========================================
// 카드 이동 연출은 card-animation.js에서 관리
// CardType, Rarity는 card-types.js에서 정의됨

// ==========================================
// 트라이포스 시스템
// ==========================================
const TriforceSystem = {
    // 이번 턴에 사용한 트라이포스
    usedThisTurn: {
        power: false,
        courage: false,
        wisdom: false
    },
    
    // 트라이포스 사용 시 호출
    onTriforceUsed(type, state) {
        this.usedThisTurn[type] = true;
        console.log(`[Triforce] ${type} used!`, this.usedThisTurn);
        
        // 3개 모두 사용했는지 체크
        if (this.usedThisTurn.power && this.usedThisTurn.courage && this.usedThisTurn.wisdom) {
            this.summonMasterSword(state);
        }
    },
    
    // 마스터 소드 소환 (트라이포스 완성 강조)
    summonMasterSword(state) {
        console.log('[Triforce] All three used! Summoning Master Sword!');
        
        // 마스터 소드 카드 생성
        const masterSword = createCard('masterSword');
        if (!masterSword) return;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 1단계: 화면 플래시 + 트라이포스 완성 강조
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'triforce-flash-overlay';
        flashOverlay.innerHTML = `
            <div class="triforce-symbol">▲</div>
            <div class="triforce-text">TRIFORCE COMPLETE</div>
        `;
        document.body.appendChild(flashOverlay);
        
        // 번개 VFX (4방향에서)
        if (typeof VFX !== 'undefined') {
            VFX.lightning(centerX - 300, 0, centerX, centerY, { color: '#ffd700', width: 4 });
            VFX.lightning(centerX + 300, 0, centerX, centerY, { color: '#ffd700', width: 4 });
            setTimeout(() => {
                VFX.lightning(0, centerY - 200, centerX, centerY, { color: '#ffd700', width: 4 });
                VFX.lightning(window.innerWidth, centerY - 200, centerX, centerY, { color: '#ffd700', width: 4 });
            }, 200);
            
            // 충격파 + 스파크
            setTimeout(() => {
                VFX.shockwave(centerX, centerY, { color: '#ffd700', size: 500 });
                VFX.sparks(centerX, centerY, { color: '#ffd700', count: 50, speed: 500 });
                VFX.sparks(centerX, centerY, { color: '#00ff88', count: 30, speed: 400 });
            }, 400);
        }
        
        // 화면 흔들림
        setTimeout(() => {
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.screenShake(20, 500);
            }
        }, 500);
        
        // 2단계: 페이드아웃 (1.5초 후)
        setTimeout(() => {
            flashOverlay.classList.add('fade-out');
        }, 1500);
        
        // 3단계: 정리 + 손패 렌더링 (2초 후)
        setTimeout(() => {
            // 요소 제거
            flashOverlay.remove();
            
            // 손패에 추가
            const existingCount = gameState.hand.length;
            gameState.hand.push(masterSword);
            
            // 로그
            if (typeof addLog === 'function') {
                addLog('⚔️ 트라이포스 완성! 마스터 소드 획득!', 'special');
            }
            
            // 손패 렌더링
            if (typeof addCardsToHandWithAnimation === 'function') {
                addCardsToHandWithAnimation(existingCount, 1);
            } else if (typeof renderHandWithNewCards === 'function') {
                renderHandWithNewCards(existingCount, 1);
            } else if (typeof renderHand === 'function') {
                renderHand(false);
            }
            
            // 상태 리셋
            this.reset();
        }, 2200);
    },
    
    // 턴 시작 시 리셋
    reset() {
        this.usedThisTurn = {
            power: false,
            courage: false,
            wisdom: false
        };
    },
    
    // 턴 종료 시 호출
    onTurnEnd() {
        this.reset();
    }
};

// 카드 데이터베이스 (card-database.js에서 이미 선언됨 - 여기서는 확장만!)
// const cardDatabase = {  // ❌ 중복 선언 제거!
Object.assign(cardDatabase, {
    // ==========================================
    // 기본 카드
    // ==========================================
    strike: {
        id: 'strike',
        name: '베기',
        type: CardType.ATTACK,
        element: 'physical', // ⚔️ 물리 속성
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
        element: 'physical', // ⚔️ 물리 속성
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
    },
    
    // ==========================================
    // 범용 시너지 카드
    // ==========================================
    curtainCall: {
        id: 'curtainCall',
        name: '커튼콜',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 1,
        icon: '🎭',
        description: '손패를 모두 버립니다.<br>버린 카드당 <span class="damage">2~4</span> 전체 피해',
        effect: (state) => {
            // 현재 손패 카드 수 (이 카드 제외)
            const handCards = state.hand.filter(c => c.id !== 'curtainCall');
            const discardCount = handCards.length;
            
            if (discardCount === 0) {
                addLog('🎭 커튼콜! 버릴 카드가 없습니다!', 'info');
                return;
            }
            
            // 손패 요소들 수집 (애니메이션용)
            const handEl = document.querySelector('.hand');
            const cardElements = handEl ? Array.from(handEl.querySelectorAll('.card')) : [];
            
            // 적 위치 계산
            const enemies = state.enemies || [state.enemy];
            const aliveEnemies = enemies.filter(e => e && e.hp > 0);
            
            // VFX: 카드들이 날아가는 연출
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // 1단계: 카드들이 모여서 회전
            cardElements.forEach((cardEl, i) => {
                if (!cardEl) return;
                const rect = cardEl.getBoundingClientRect();
                
                // 복제 카드 생성 (날아가는 연출용)
                const flyingCard = document.createElement('div');
                flyingCard.className = 'curtain-call-card';
                flyingCard.innerHTML = '🎴';
                flyingCard.style.cssText = `
                    position: fixed;
                    left: ${rect.left + rect.width/2}px;
                    top: ${rect.top + rect.height/2}px;
                    font-size: 60px;
                    z-index: 10000;
                    pointer-events: none;
                    transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
                    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
                `;
                document.body.appendChild(flyingCard);
                
                // 중앙으로 모이기
                setTimeout(() => {
                    const angle = (i / discardCount) * Math.PI * 2;
                    const radius = 80;
                    flyingCard.style.left = `${centerX + Math.cos(angle) * radius}px`;
                    flyingCard.style.top = `${centerY + Math.sin(angle) * radius}px`;
                    flyingCard.style.transform = `rotate(${angle * 180 / Math.PI}deg) scale(0.8)`;
                }, 50);
                
                // 2단계: 적들에게 발사
                setTimeout(() => {
                    flyingCard.style.transition = 'all 0.3s ease-in';
                    
                    // 랜덤 적 선택
                    if (aliveEnemies.length > 0) {
                        const targetEnemy = aliveEnemies[i % aliveEnemies.length];
                        const enemyIndex = enemies.indexOf(targetEnemy);
                        const enemyEl = document.querySelector(`[data-index="${enemyIndex}"]`) || 
                                        document.querySelector('.enemy-unit');
                        
                        if (enemyEl) {
                            const enemyRect = enemyEl.getBoundingClientRect();
                            flyingCard.style.left = `${enemyRect.left + enemyRect.width/2}px`;
                            flyingCard.style.top = `${enemyRect.top + enemyRect.height/2}px`;
                            flyingCard.style.transform = 'scale(0.3) rotate(720deg)';
                            flyingCard.style.opacity = '0';
                        }
                    }
                }, 500 + i * 80);
                
                // 제거
                setTimeout(() => flyingCard.remove(), 1200);
            });
            
            // 3단계: 대미지 적용 (카드 도착 후)
            setTimeout(() => {
                // 총 대미지 계산 (카드당 2~4)
                let totalDamage = 0;
                const damagePerCard = [];
                
                for (let i = 0; i < discardCount; i++) {
                    const dmg = Math.floor(Math.random() * 3) + 2; // 2~4
                    damagePerCard.push(dmg);
                    totalDamage += dmg;
                }
                
                // 전체 공격 VFX
                if (typeof VFX !== 'undefined') {
                    VFX.shockwave(centerX, centerY - 100, { color: '#ffd700', size: 400 });
                    VFX.sparks(centerX, centerY - 100, { color: '#ffd700', count: 40, speed: 400 });
                }
                
                // 화면 흔들림
                if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.screenShake(15, 400);
                }
                
                // 각 적에게 대미지
                aliveEnemies.forEach((enemy, idx) => {
                    const enemyIndex = enemies.indexOf(enemy);
                    const enemyEl = document.querySelector(`[data-index="${enemyIndex}"]`) || 
                                    document.querySelector('.enemy-unit');
                    
                    if (enemyEl && typeof EffectSystem !== 'undefined') {
                        EffectSystem.impact(enemyEl, { color: '#ffd700', size: 150 });
                    }
                    
                    // 대미지 적용
                    dealDamage(enemy, totalDamage);
                });
                
                // 손패 비우기 (버린 더미로)
                handCards.forEach(card => {
                    const idx = state.hand.indexOf(card);
                    if (idx > -1) {
                        state.hand.splice(idx, 1);
                        gameState.discardPile.push(card);
                    }
                });
                
                // UI 업데이트
                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
                if (typeof renderHand === 'function') renderHand();
                
                addLog(`🎭 커튼콜! ${discardCount}장 버림 → 전체 ${totalDamage} 데미지! (${damagePerCard.join('+')})`, 'damage');
            }, 800);
        }
    }
});  // Object.assign 끝!

// ==========================================
// 에너지 볼트 시스템
// ==========================================
const EnergyBoltSystem = {
    bolts: [],
    boltElements: [],
    animationFrameId: null,
    isActive: false,
    indicatorEl: null,
    
    // 구체 위치 설정 (겹치지 않도록 분산)
    BOLT_POSITIONS: [
        { offsetX: -100, offsetY: -80, bobPhase: 0 },      // 왼쪽 위
        { offsetX: 100, offsetY: -80, bobPhase: Math.PI * 0.66 },   // 오른쪽 위
        { offsetX: 0, offsetY: -140, bobPhase: Math.PI * 1.33 }     // 중앙 위
    ],
    
    init() {
        this.bolts = [];
        this.boltElements = [];
        this.isActive = false;
        this.removeAllBoltElements();
        this.removeIndicator();
    },
    
    addBolt() {
        if (this.bolts.length >= 3) return false;
        const boltIndex = this.bolts.length;
        const position = this.BOLT_POSITIONS[boltIndex];
        
        const bolt = {
            id: Date.now() + Math.random(),
            index: boltIndex,
            offsetX: position.offsetX,
            offsetY: position.offsetY,
            bobPhase: position.bobPhase,
            pulsePhase: Math.random() * Math.PI * 2
        };
        this.bolts.push(bolt);
        this.createBoltElement(bolt);
        this.updateIndicator();
        
        if (!this.isActive) {
            this.isActive = true;
            this.startAnimation();
        }
        return true;
    },
    
    createBoltElement(bolt) {
        const el = document.createElement('div');
        el.className = 'energy-bolt-orb';
        el.dataset.boltId = bolt.id;
        el.innerHTML = `
            <img src="energybolt.png" alt="Energy Bolt" class="bolt-image">
            <div class="bolt-glow-overlay"></div>
        `;
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%, -50%) scale(0.5)';
        document.body.appendChild(el);
        
        // 등장 애니메이션
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            el.style.opacity = '1';
            el.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        this.boltElements.push(el);
    },
    
    // 버프 인디케이터 업데이트
    updateIndicator() {
        const debuffContainer = document.getElementById('player-debuffs');
        if (!debuffContainer) return;
        
        // 기존 인디케이터 제거
        this.removeIndicator();
        
        if (this.bolts.length === 0) return;
        
        const totalDamage = this.bolts.length * 3;
        
        this.indicatorEl = document.createElement('div');
        this.indicatorEl.className = 'energy-bolt-indicator buff-icon';
        this.indicatorEl.innerHTML = `
            <img src="energybolt.png" alt="Energy Bolt" class="indicator-icon-img">
            <span class="indicator-stack">${this.bolts.length}</span>
        `;
        this.indicatorEl.title = `에너지 볼트 x${this.bolts.length}\n턴 종료 시 랜덤 적에게 ${totalDamage} 데미지`;
        
        // 호버 시 상세 툴팁
        const tooltip = document.createElement('div');
        tooltip.className = 'energy-bolt-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title"><img src="energybolt.png" class="tooltip-icon-img"> 에너지 볼트</div>
            <div class="tooltip-count">${this.bolts.length}/3 충전</div>
            <div class="tooltip-desc">턴 종료 시 랜덤 적에게<br><span class="damage-value">${totalDamage}</span> 데미지</div>
            <div class="tooltip-hint">(4번째 사용 시 과부하 폭발!<br>구체당 9 데미지 × ${this.bolts.length}회!)</div>
        `;
        this.indicatorEl.appendChild(tooltip);
        
        debuffContainer.appendChild(this.indicatorEl);
        
        // 등장 애니메이션
        requestAnimationFrame(() => {
            this.indicatorEl.classList.add('active');
        });
    },
    
    removeIndicator() {
        if (this.indicatorEl) {
            this.indicatorEl.remove();
            this.indicatorEl = null;
        }
        document.querySelectorAll('.energy-bolt-indicator').forEach(el => el.remove());
    },
    
    startAnimation() {
        const animate = () => {
            if (!this.isActive || this.bolts.length === 0) return;
            const playerEl = document.getElementById('player');
            if (!playerEl) { this.animationFrameId = requestAnimationFrame(animate); return; }
            const rect = playerEl.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const time = Date.now() * 0.001;
            
            this.bolts.forEach((bolt, index) => {
                // 부드러운 상하 움직임 (bobbing)
                const bobY = Math.sin(time * 1.5 + bolt.bobPhase) * 12;
                // 살짝 좌우 흔들림
                const swayX = Math.sin(time * 0.8 + bolt.pulsePhase) * 5;
                
                const x = centerX + bolt.offsetX + swayX;
                const y = centerY + bolt.offsetY + bobY;
                
                const el = this.boltElements[index];
                if (el) {
                    el.style.left = `${x}px`;
                    el.style.top = `${y}px`;
                }
            });
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    },
    
    onTurnEnd() {
        if (this.bolts.length === 0) return;
        const aliveEnemies = [];
        if (gameState.enemies) {
            gameState.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                    const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                    if (el) aliveEnemies.push({ enemy, el, index });
                }
            });
        }
        if (aliveEnemies.length === 0) return;
        
        // 각 볼트가 번개를 발사하지만 볼트 자체는 유지됨
        this.bolts.forEach((bolt, boltIndex) => {
            setTimeout(() => {
                const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                if (!target || target.enemy.hp <= 0) return;
                const boltEl = this.boltElements[boltIndex];
                if (!boltEl) return;
                const boltRect = boltEl.getBoundingClientRect();
                const targetRect = target.el.getBoundingClientRect();
                
                // 발사 시 볼트 강조 애니메이션 (사라지지 않음)
                boltEl.classList.add('firing-pulse');
                setTimeout(() => boltEl.classList.remove('firing-pulse'), 400);
                
                if (typeof VFX !== 'undefined') {
                    // 발사 전 충전 이펙트
                    VFX.sparks(boltRect.left, boltRect.top, { color: '#93c5fd', count: 8, speed: 100 });
                    
                    // 번개 발사
                    VFX.lightning(boltRect.left, boltRect.top, targetRect.left + targetRect.width/2, targetRect.top + targetRect.height/2, { color: '#60a5fa', width: 4 });
                    
                    // 임팩트
                    setTimeout(() => { 
                        VFX.impact(targetRect.left + targetRect.width/2, targetRect.top + targetRect.height/2, { color: '#60a5fa', size: 100 });
                        VFX.sparks(targetRect.left + targetRect.width/2, targetRect.top + targetRect.height/2, { color: '#93c5fd', count: 12 });
                    }, 150);
                }
                
                setTimeout(() => {
                    if (target.enemy.hp > 0) {
                        dealDamage(target.enemy, 3);
                        if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                    }
                }, 200);
                addLog(`⚡ 에너지 볼트가 ${target.enemy.name}에게 3 데미지!`, 'damage');
            }, boltIndex * 350);
        });
        
        // 볼트는 유지됨 - 제거하지 않음!
    },
    
    triggerOvercharge(state) {
        console.log('[EnergyBolt] ⚡ 과부하 폭발!');
        
        // 모든 적 수집
        const targets = [];
        if (gameState.enemies && gameState.enemies.length > 0) {
            gameState.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                    const el = document.querySelector(`.enemy-unit[data-index="${index}"]`);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        targets.push({ 
                            enemy, 
                            el, 
                            x: rect.left + rect.width/2, 
                            y: rect.top + rect.height/2 
                        });
                    }
                }
            });
        } else if (state.enemy && state.enemy.hp > 0) {
            const el = document.getElementById('enemy');
            if (el) {
                const rect = el.getBoundingClientRect();
                targets.push({ 
                    enemy: state.enemy, 
                    el, 
                    x: rect.left + rect.width/2, 
                    y: rect.top + rect.height/2 
                });
            }
        }
        
        // 볼트 위치 수집
        const boltPositions = [];
        this.bolts.forEach((bolt, boltIndex) => {
            const boltEl = this.boltElements[boltIndex];
            if (!boltEl) return;
            const boltRect = boltEl.getBoundingClientRect();
            boltPositions.push({
                x: boltRect.left + boltRect.width/2,
                y: boltRect.top + boltRect.height/2
            });
        });
        
        // MageVFX 과부하 이펙트 사용
        if (typeof MageVFX !== 'undefined' && boltPositions.length > 0) {
            MageVFX.energyBoltOvercharge(boltPositions, targets);
        }
        
        // 화면 흔들림
        if (typeof EffectSystem !== 'undefined') {
            setTimeout(() => {
                EffectSystem.screenShake(20, 500);
            }, 150);
        }
        
        // 데미지 적용 (각 구체당 9 데미지, 순차적으로 타격)
        const damagePerBolt = 9;
        const boltCount = this.bolts.length;
        let totalDamageDealt = 0;
        
        // 각 볼트가 순차적으로 데미지
        this.bolts.forEach((bolt, boltIndex) => {
            setTimeout(() => {
                // 살아있는 적 중 랜덤 타겟 (또는 모든 적에게)
                const aliveTargets = targets.filter(t => t.enemy.hp > 0);
                if (aliveTargets.length === 0) return;
                
                // 모든 살아있는 적에게 9 데미지
                aliveTargets.forEach(target => {
                    if (target.enemy.hp > 0) {
                        target.enemy.hp = Math.max(0, target.enemy.hp - damagePerBolt);
                        totalDamageDealt += damagePerBolt;
                        if (typeof showDamagePopup === 'function') {
                            showDamagePopup(target.el, damagePerBolt, 'magic');
                        }
                    }
                });
                
                if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                
                addLog(`⚡ 과부하 ${boltIndex + 1}번째 폭발! ${damagePerBolt} 데미지!`, 'critical');
                
                // 마지막 볼트 후 처리
                if (boltIndex === boltCount - 1) {
                    setTimeout(() => {
                        if (typeof checkEnemyDefeated === 'function') checkEnemyDefeated();
                    }, 200);
                }
            }, 300 + boltIndex * 250); // 각 볼트마다 250ms 간격
        });
        
        // 과부하 후 완전 초기화
        setTimeout(() => {
            this.clear();
            // 손패 UI 업데이트 (에너지 볼트 카드 상태 복원)
            if (typeof updateHandUI === 'function') {
                updateHandUI();
            }
        }, 800);
    },
    
    clear() {
        this.bolts = [];
        this.isActive = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.removeAllBoltElements();
        this.removeIndicator();
    },
    
    removeAllBoltElements() {
        // 사라지는 애니메이션
        this.boltElements.forEach(el => {
            if (el) {
                el.style.transition = 'opacity 0.3s, transform 0.3s';
                el.style.opacity = '0';
                el.style.transform = 'translate(-50%, -50%) scale(0.3)';
                setTimeout(() => el.remove(), 300);
            }
        });
        this.boltElements = [];
        setTimeout(() => {
            document.querySelectorAll('.energy-bolt-orb').forEach(el => el.remove());
        }, 350);
    }
};
window.EnergyBoltSystem = EnergyBoltSystem;

// ==========================================
// 그림자 분신 시스템
// ==========================================
const ShadowCloneSystem = {
    clones: [],
    cloneElements: [],
    animationFrameId: null,
    isActive: false,
    maxClones: 3,
    defaultDamageMultiplier: 0.5,
    playerAttacking: false,    // 플레이어가 공격 중인지 여부
    
    init() {
        this.clones = [];
        this.cloneElements = [];
        this.isActive = false;
        this.playerAttacking = false;
        this.removeAllCloneElements();
    },
    
    summonClone(duration = 3) {
        if (this.clones.length >= this.maxClones) return false;
        const cloneIndex = this.clones.length;
        const clone = {
            id: Date.now() + Math.random(),
            index: cloneIndex,
            duration: duration,
            hp: 5,              // 분신 HP (5 데미지 받으면 소멸)
            maxHp: 5,
            damageMultiplier: this.defaultDamageMultiplier,
            bobOffset: cloneIndex * (Math.PI * 2 / 3)
        };
        this.clones.push(clone);
        this.createCloneElement(clone);
        if (!this.isActive) {
            this.isActive = true;
            this.startAnimation();
        }
        return true;
    },
    
    // 분신이 데미지를 받음 (몬스터 우선 공격 대상)
    damageClone(damage) {
        if (this.clones.length === 0) return { absorbed: false, remaining: damage };
        
        // 첫 번째 분신이 데미지를 받음
        const clone = this.clones[0];
        const cloneEl = this.cloneElements[0];
        
        // 데미지 흡수
        const absorbedDamage = Math.min(clone.hp, damage);
        clone.hp -= absorbedDamage;
        const remainingDamage = damage - absorbedDamage;
        
        // 피격 이펙트
        if (cloneEl) {
            // 타격감
            if (typeof HitEffects !== 'undefined') {
                HitEffects.cloneHit(cloneEl, absorbedDamage);
            }
            
            // HP 표시 업데이트
            const hpBar = cloneEl.querySelector('.clone-hp-bar');
            const hpText = cloneEl.querySelector('.clone-hp-text');
            if (hpBar) {
                hpBar.style.width = `${(clone.hp / clone.maxHp) * 100}%`;
                if (clone.hp <= 2) {
                    hpBar.style.background = 'linear-gradient(to right, #ef4444, #f87171)';
                }
            }
            if (hpText) {
                hpText.textContent = `${clone.hp}/${clone.maxHp}`;
            }
            
            // 데미지 팝업
            if (typeof showDamagePopup === 'function') {
                showDamagePopup(cloneEl, absorbedDamage, 'damage');
            }
            
            // 피격 플래시
            cloneEl.style.filter = 'brightness(2) saturate(2)';
            setTimeout(() => {
                cloneEl.style.filter = '';
            }, 150);
        }
        
        // 분신 사망 체크
        if (clone.hp <= 0) {
            addLog(`👤 분신이 파괴되었습니다!`, 'warning');
            this.destroyClone(0);
        } else {
            addLog(`👤 분신이 ${absorbedDamage} 데미지를 대신 받았습니다! (HP: ${clone.hp}/${clone.maxHp})`, 'info');
        }
        
        return { absorbed: true, absorbedDamage, remaining: remainingDamage };
    },
    
    // 분신 파괴 (HP 0)
    destroyClone(index) {
        if (index < 0 || index >= this.clones.length) return;
        
        const clone = this.clones[index];
        const el = this.cloneElements[index];
        
        if (el) {
            // 파괴 이펙트
            const rect = el.getBoundingClientRect();
            if (typeof VFX !== 'undefined') {
                VFX.impact(rect.left + rect.width/2, rect.top + rect.height/2, { 
                    color: '#a855f7', 
                    size: 150 
                });
                VFX.smoke(rect.left + rect.width/2, rect.top + rect.height/2, {
                    color: '#7c3aed',
                    size: 100,
                    count: 20,
                    duration: 400
                });
            }
            
            // 파괴 애니메이션
            el.style.transition = 'all 0.3s ease-out';
            el.style.transform = 'translate(-50%, -50%) scale(1.5)';
            el.style.opacity = '0';
            el.style.filter = 'brightness(3) blur(10px)';
            
            setTimeout(() => el.remove(), 300);
        }
        
        // 배열에서 제거
        this.clones.splice(index, 1);
        this.cloneElements.splice(index, 1);
        
        // 인덱스 재정렬
        this.clones.forEach((c, i) => c.index = i);
        
        // 모든 분신 소멸 시 비활성화
        if (this.clones.length === 0) {
            this.isActive = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        }
    },
    
    // 분신이 있는지 확인 (몬스터 AI용)
    hasClones() {
        return this.clones.length > 0;
    },
    
    // 첫 번째 분신 요소 가져오기 (타겟팅용)
    getFirstCloneElement() {
        return this.cloneElements.length > 0 ? this.cloneElements[0] : null;
    },
    
    createCloneElement(clone) {
        let spriteUrl = 'hero.png';
        if (typeof JobSystem !== 'undefined') {
            spriteUrl = JobSystem.getCurrentSprite() || 'hero.png';
        }
        const el = document.createElement('div');
        el.className = 'shadow-clone';
        el.dataset.cloneId = clone.id;
        el.innerHTML = `
            <div class="clone-aura"></div>
            <div class="clone-body"><img src="${spriteUrl}" alt="Shadow" class="clone-sprite"></div>
            <div class="clone-info">
                <div class="clone-hp-bar-container">
                    <div class="clone-hp-bar" style="width: ${(clone.hp / clone.maxHp) * 100}%"></div>
                </div>
                <div class="clone-hp-text">${clone.hp}/${clone.maxHp}</div>
                <div class="clone-status-display">
                    <div class="status-badge status-clone-duration">
                        <span class="status-icon">👤</span>
                        <span class="status-value">${clone.duration}</span>
                    </div>
                </div>
            </div>
        `;
        el.style.opacity = '0';
        document.body.appendChild(el);
        
        const playerEl = document.getElementById('player');
        // 분신 배치 (플레이어 왼쪽에 삼각형 대형)
        const formations = [
            { x: -160, y: 20 },    // 첫 번째 분신: 왼쪽 아래
            { x: -130, y: -50 },   // 두 번째 분신: 왼쪽 위
            { x: -200, y: -20 }    // 세 번째 분신: 더 왼쪽
        ];
        const pos = formations[clone.index] || formations[0];
        
        // 소환 이펙트
        if (playerEl && typeof VFX !== 'undefined') {
            const basePos = this.getPlayerBasePosition(playerEl);
            if (!basePos) return;
            const spawnX = basePos.x + pos.x;
            const spawnY = basePos.y + pos.y;
            
            // 보라색 연기 + 스파크
            VFX.smoke(spawnX, spawnY, { 
                color: '#7c3aed', 
                size: 120, 
                count: 20, 
                duration: 600 
            });
            VFX.sparks(spawnX, spawnY, { 
                color: '#a855f7', 
                count: 15, 
                speed: 150 
            });
            
            // 충격파
            setTimeout(() => {
                VFX.shockwave(spawnX, spawnY, { 
                    color: '#8b5cf6', 
                    size: 100, 
                    duration: 400 
                });
            }, 200);
        }
        
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.6s ease-out';
            el.style.opacity = '1';
        });
        this.cloneElements.push(el);
    },
    
    // 플레이어의 기본 위치 가져오기 (CSS transform 무시)
    getPlayerBasePosition(playerEl) {
        if (!playerEl) return null;
        
        // offsetParent 기준 위치 사용 (transform 영향 안 받음)
        const parent = playerEl.offsetParent || document.body;
        const parentRect = parent.getBoundingClientRect();
        
        // 플레이어의 고정 위치 계산
        const x = parentRect.left + playerEl.offsetLeft + playerEl.offsetWidth / 2;
        const y = parentRect.top + playerEl.offsetTop + playerEl.offsetHeight / 2;
        
        return { x, y };
    },
    
    startAnimation() {
        const animate = () => {
            if (!this.isActive || this.clones.length === 0) return;
            const playerEl = document.getElementById('player');
            if (!playerEl) { this.animationFrameId = requestAnimationFrame(animate); return; }
            
            const time = Date.now() * 0.001;
            
            // 플레이어의 기본 위치 가져오기 (CSS transform 무시)
            const basePos = this.getPlayerBasePosition(playerEl);
            if (!basePos) {
                this.animationFrameId = requestAnimationFrame(animate);
                return;
            }
            
            // 플레이어 공격 중이면 분신 위치 업데이트 하지 않음 (제자리 고정)
            if (this.playerAttacking) {
                this.animationFrameId = requestAnimationFrame(animate);
                return;
            }
            
            const centerX = basePos.x;
            const centerY = basePos.y;
            
            // 분신 배치 (플레이어 왼쪽에 삼각형 대형)
            const formations = [
                { x: -160, y: 20, scale: 1.0 },   // 첫 번째 분신
                { x: -130, y: -50, scale: 0.95 }, // 두 번째 분신 (약간 작게)
                { x: -200, y: -20, scale: 0.9 }   // 세 번째 분신 (더 작게)
            ];
            
            this.clones.forEach((clone, index) => {
                // 이 분신이 공격 중이면 스킵
                if (clone.isAttacking) return;
                
                const formation = formations[index] || formations[0];
                // 부드러운 상하 움직임
                const bobY = Math.sin(time * 1.5 + clone.bobOffset) * 8;
                // 미세한 좌우 흔들림
                const swayX = Math.sin(time * 0.8 + clone.bobOffset * 2) * 3;
                
                const x = centerX + formation.x + swayX;
                const y = centerY + formation.y + bobY;
                const el = this.cloneElements[index];
                if (el) {
                    el.style.left = `${x}px`;
                    el.style.top = `${y}px`;
                    el.style.transform = `translate(-50%, -50%) scale(${formation.scale})`;
                    
                    // 홈 위치 저장 (공격 시 복귀용)
                    clone.homeX = x;
                    clone.homeY = y;
                }
            });
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    },
    
    onAttackCardPlayed(damage, targetEnemy, targetEl) {
        if (this.clones.length === 0) return;
        if (!targetEnemy || !targetEl) return;
        
        const targetRect = targetEl.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        // 분신들이 시간차로 곡선 공격
        this.clones.forEach((clone, index) => {
            const attackDelay = index * 150; // 150ms 간격
            
            setTimeout(() => {
                if (!targetEnemy || targetEnemy.hp <= 0) return;
                
                const cloneEl = this.cloneElements[index];
                if (!cloneEl) return;
                
                const cloneDamage = Math.floor(damage * clone.damageMultiplier);
                if (cloneDamage <= 0) return;
                
                // 이 분신 공격 중 표시
                clone.isAttacking = true;
                
                // 분신 홈 위치 사용 (저장된 위치가 없으면 현재 위치)
                const startX = clone.homeX || parseFloat(cloneEl.style.left);
                const startY = clone.homeY || parseFloat(cloneEl.style.top);
                
                // ===== 랜덤 곡선 경로 계산 =====
                // 각 분신마다 다른 궤적을 그리도록 랜덤화
                const randomArcHeight = -80 - Math.random() * 120; // -80 ~ -200 (위로 점프 높이)
                const randomOffsetX = (Math.random() - 0.5) * 100; // -50 ~ 50 (좌우 편차)
                const randomLandingOffset = (Math.random() - 0.5) * 60; // 착지 위치 편차
                const randomRotation = -30 + Math.random() * 60; // -30 ~ 30도 회전
                
                // 중간 지점 (호의 정점)
                const midX = (startX + targetX) / 2 + randomOffsetX;
                const midY = Math.min(startY, targetY) + randomArcHeight;
                
                // 착지 위치 (적 근처, 약간 랜덤)
                const landX = targetX + randomLandingOffset;
                const landY = targetY;
                
                // 잔상 효과 생성
                this.createAfterImage(cloneEl, startX, startY);
                
                // 1단계: 위로 호를 그리며 점프 - 200ms
                cloneEl.style.transition = 'all 0.2s ease-out';
                cloneEl.style.left = `${midX}px`;
                cloneEl.style.top = `${midY}px`;
                cloneEl.style.transform = `translate(-50%, -50%) scale(1.2) rotate(${randomRotation}deg)`;
                cloneEl.style.filter = 'brightness(1.5) saturate(2) drop-shadow(0 0 20px #a855f7)';
                cloneEl.style.opacity = '1';
                
                // 2단계: 적을 향해 급강하 공격 - 200ms 후 시작
                setTimeout(() => {
                    this.createAfterImage(cloneEl, midX, midY);
                    
                    const diveRotation = randomRotation + 30; // 급강하 시 회전
                    
                    cloneEl.style.transition = 'all 0.15s ease-in';
                    cloneEl.style.left = `${landX}px`;
                    cloneEl.style.top = `${landY}px`;
                    cloneEl.style.transform = `translate(-50%, -50%) scale(1.3) rotate(${diveRotation}deg)`;
                    cloneEl.style.filter = 'brightness(2) saturate(3) drop-shadow(0 0 30px #c084fc)';
                    
                    // VFX 슬래시 + 스파크 - 150ms 후 (급강하 완료 시점)
                    setTimeout(() => {
                        // 랜덤 슬래시 각도
                        const slashAngle1 = Math.random() * 360;
                        const slashAngle2 = slashAngle1 + 60 + Math.random() * 60;
                        
                        if (typeof VFX !== 'undefined') {
                            // 대각선 슬래시 (랜덤 각도)
                            VFX.slash(targetX, targetY, { 
                                color: '#a855f7', 
                                length: 100 + Math.random() * 40, 
                                width: 5 + Math.random() * 3,
                                angle: slashAngle1
                            });
                            // 반대 방향 슬래시 (X자)
                            VFX.slash(targetX, targetY, { 
                                color: '#c084fc', 
                                length: 80 + Math.random() * 40, 
                                width: 4 + Math.random() * 2,
                                angle: slashAngle2
                            });
                            // 스파크
                            VFX.sparks(targetX, targetY, { 
                                color: '#e879f9', 
                                count: 10 + Math.floor(Math.random() * 8), 
                                speed: 250 + Math.random() * 100 
                            });
                            // 임팩트
                            VFX.impact(targetX, targetY, {
                                color: '#a855f7',
                                size: 60 + Math.random() * 40
                            });
                        }
                        
                        // 데미지 적용
                        if (targetEnemy.hp > 0) {
                            targetEnemy.hp = Math.max(0, targetEnemy.hp - cloneDamage);
                            if (typeof showDamagePopup === 'function') {
                                showDamagePopup(targetEl, cloneDamage, 'damage');
                            }
                            
                            // 분신 전용 타격감
                            if (typeof HitEffects !== 'undefined') {
                                HitEffects.cloneHit(targetEl, cloneDamage);
                            }
                            
                            if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                            
                            if (targetEnemy.hp <= 0 && typeof checkEnemyDefeated === 'function') {
                                setTimeout(() => checkEnemyDefeated(), 100);
                            }
                        }
                        
                        // 공격 후 대기 자세
                        setTimeout(() => {
                            cloneEl.style.transition = 'all 0.2s ease-out';
                            cloneEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
                            cloneEl.style.filter = 'brightness(1) saturate(1.5) drop-shadow(0 0 15px #a855f7)';
                        }, 100);
                    }, 150);
                }, 200);
                
                // 3단계: 연막 터지면서 원래 자리로 순간이동 - 900ms 후
                setTimeout(() => {
                    // 현재 위치에서 연막 퐁!
                    const currentX = parseFloat(cloneEl.style.left);
                    const currentY = parseFloat(cloneEl.style.top);
                    
                    if (typeof VFX !== 'undefined') {
                        VFX.smoke(currentX, currentY, {
                            color: '#7c3aed',
                            size: 100,
                            count: 15,
                            duration: 300
                        });
                    }
                    
                    // 분신 잠깐 숨기기
                    cloneEl.style.opacity = '0';
                    
                    // 원래 위치에서 연막과 함께 등장
                    setTimeout(() => {
                        cloneEl.style.transition = 'none';
                        cloneEl.style.left = `${startX}px`;
                        cloneEl.style.top = `${startY}px`;
                        cloneEl.style.transform = 'translate(-50%, -50%) scale(1)';
                        cloneEl.style.filter = 'brightness(0.7) saturate(1.2)';
                        
                        if (typeof VFX !== 'undefined') {
                            VFX.smoke(startX, startY, {
                                color: '#8b5cf6',
                                size: 80,
                                count: 10,
                                duration: 250
                            });
                        }
                        
                        cloneEl.style.transition = 'opacity 0.1s';
                        cloneEl.style.opacity = '0.85';
                        
                        // 공격 완료
                        clone.isAttacking = false;
                    }, 50);
                }, 900);
                
            }, attackDelay);
        });
        
        // 로그
        const totalCloneDamage = this.clones.reduce((sum, c) => sum + Math.floor(damage * c.damageMultiplier), 0);
        if (typeof addLog === 'function') {
            addLog(`👥 분신 ${this.clones.length}체 따라 공격! (${totalCloneDamage} 데미지)`, 'damage');
        }
    },
    
    // 잔상 효과 생성
    createAfterImage(cloneEl, x, y) {
        const afterImage = cloneEl.cloneNode(true);
        afterImage.style.position = 'fixed';
        afterImage.style.left = `${x}px`;
        afterImage.style.top = `${y}px`;
        afterImage.style.opacity = '0.5';
        afterImage.style.filter = 'brightness(0.5) saturate(2) blur(2px)';
        afterImage.style.pointerEvents = 'none';
        afterImage.style.zIndex = '49';
        afterImage.style.transition = 'opacity 0.2s ease-out';
        document.body.appendChild(afterImage);
        
        // 잔상 페이드아웃
        requestAnimationFrame(() => {
            afterImage.style.opacity = '0';
        });
        setTimeout(() => afterImage.remove(), 200);
    },
    
    sacrificeClone() {
        if (this.clones.length === 0) return null;
        const clone = this.clones.pop();
        const el = this.cloneElements.pop();
        if (el) {
            const rect = el.getBoundingClientRect();
            if (typeof VFX !== 'undefined') {
                VFX.impact(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#4a00b4', size: 150 });
            }
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 200);
        }
        return clone;
    },
    
    onTurnEnd() {
        const expiredIndices = [];
        this.clones.forEach((clone, index) => {
            clone.duration--;
            const el = this.cloneElements[index];
            if (el) {
                const durationEl = el.querySelector('.status-value');
                if (durationEl) durationEl.textContent = clone.duration;
                
                // 1턴 남았을 때 경고 스타일
                const badge = el.querySelector('.status-clone-duration');
                if (badge && clone.duration <= 1) {
                    badge.classList.add('status-warning');
                }
            }
            if (clone.duration <= 0) expiredIndices.push(index);
        });
        for (let i = expiredIndices.length - 1; i >= 0; i--) {
            this.removeClone(expiredIndices[i]);
        }
        if (expiredIndices.length > 0) addLog(`👤 분신 ${expiredIndices.length}개 소멸`, 'info');
    },
    
    removeClone(index) {
        if (index < 0 || index >= this.clones.length) return;
        this.clones.splice(index, 1);
        const el = this.cloneElements.splice(index, 1)[0];
        if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
    },
    
    clear() {
        this.clones = [];
        this.isActive = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.removeAllCloneElements();
    },
    
    removeAllCloneElements() {
        this.cloneElements.forEach(el => el?.remove());
        this.cloneElements = [];
        document.querySelectorAll('.shadow-clone').forEach(el => el.remove());
    },
    
    getCloneCount() { return this.clones.length; }
};
window.ShadowCloneSystem = ShadowCloneSystem;

// 기본 덱 구성은 starter-deck.js에서 관리

// 보상 카드 풀 (희귀도별)
const rewardCardPool = {
    [Rarity.COMMON]: [
        'cleave', 'pommelStrike', 'ironWave', 'quickSlash', 
        'heavyBlow', 'shrugItOff', 'armorUp', 'battleCry',
        'dagger', 'shurikenBarrage',
        'momentum', 'crush', 'ironWall', 'chainStrike'  // 전사 카드 추가
    ],
    [Rarity.UNCOMMON]: [
        'shieldBash', 'twinStrike', 'ragingBlow', 'preciseStrike',
        'ironFortress', 'secondWind', 'energize', 'finisher', 'energyBolt',
        'shadowClone', 'shadowExplosion',
        'chargeUp', 'allOutAttack', 'counterStance', 'warriorPride'  // 전사 카드 추가
    ],
    [Rarity.RARE]: [
        'executionBlade', 'swordRain', 'impenetrableWall', 'lifeDrain', 'cardFall',
        'warriorStrike', 'lastStand', 'braveBurst', 'battleInstinct', 'unwaveringWill', 'stormStrike'  // 전사 카드 추가
    ]
};

// 카드 생성 헬퍼 함수 - 기본 버전 (아래에서 강화 버전으로 재정의됨)

// 랜덤 보상 카드 선택
function getRandomRewardCard() {
    // 희귀도 확률: Common 60%, Uncommon 30%, Rare 10%
    const roll = Math.random() * 100;
    let rarity;
    
    if (roll < 60) {
        rarity = Rarity.COMMON;
    } else if (roll < 90) {
        rarity = Rarity.UNCOMMON;
    } else {
        rarity = Rarity.RARE;
    }
    
    const pool = rewardCardPool[rarity];
    const randomCardId = pool[Math.floor(Math.random() * pool.length)];
    
    return createCard(randomCardId);
}

// 카드 타입 한글명
function getCardTypeName(type) {
    const names = {
        [CardType.ATTACK]: '공격',
        [CardType.SKILL]: '스킬',
        [CardType.POWER]: '파워'
    };
    return names[type] || type;
}

// 희귀도 한글명
function getRarityName(rarity) {
    const names = {
        [Rarity.BASIC]: '기본',
        [Rarity.COMMON]: '일반',
        [Rarity.UNCOMMON]: '고급',
        [Rarity.RARE]: '희귀'
    };
    return names[rarity] || rarity;
}

// 희귀도 색상
function getRarityColor(rarity) {
    const colors = {
        [Rarity.BASIC]: '#888888',
        [Rarity.COMMON]: '#ffffff',
        [Rarity.UNCOMMON]: '#4fc3f7',
        [Rarity.RARE]: '#ffd700'
    };
    return colors[rarity] || '#ffffff';
}

// ==========================================
// 강화된 카드 데이터베이스
// ==========================================
const upgradedCardDatabase = {
    // 베기 -> 베기+
    strikeP: {
        id: 'strikeP',
        name: '베기+',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="slash.png" alt="Slash" class="card-icon-img">',
        description: '<span class="damage">9</span> 데미지를 줍니다.',
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#ff6644', count: 1 });
                dealDamage(state.enemy, 9);
            });
            
            addLog('베기+로 9 데미지!', 'damage');
        }
    },
    
    // 방어 -> 방어+
    defendP: {
        id: 'defendP',
        name: '방어+',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="shield.png" alt="Defend" class="card-icon-img">',
        description: '<span class="block-val">8</span> 방어도를 얻습니다.',
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            EffectSystem.shield(playerEl, { color: '#6fd8ff' });
            gainBlock(state.player, 8);
            addLog('8 방어도 획득!', 'block');
        }
    },
    
    // 강타 -> 강타+
    bashP: {
        id: 'bashP',
        name: '강타+',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 2,
        icon: '<img src="gangta.png" alt="Bash" class="card-icon-img">',
        description: '<span class="damage">16</span> 데미지.<br><span class="debuff-val">취약</span> 3턴 부여.',
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#ff8844', size: 220 });
                EffectSystem.screenShake(15, 350);
                dealDamage(state.enemy, 16);
                
                // 취약 부여
                state.enemy.vulnerable = (state.enemy.vulnerable || 0) + 3;
                addLog(`${state.enemy.name}에게 취약 3턴!`, 'debuff');
            });
            
            addLog('강타+로 14 데미지!', 'damage');
        }
    },
    
    // 닷지 -> 닷지+
    dodgeP: {
        id: 'dodgeP',
        name: '닷지+',
        type: CardType.SKILL,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '<img src="dodge.png" alt="Dodge+" class="card-icon-img">',
        description: '<span class="block-val">5</span> 방어도.<br>카드 1장 드로우.',
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            // 강화된 연막 VFX (더 진하고 넓게)
            if (playerEl && typeof VFX !== 'undefined') {
                const rect = playerEl.getBoundingClientRect();
                VFX.smoke(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    { color: '#5577aa', size: 180, duration: 900, count: 18 }
                );
            }
            
            gainBlock(state.player, 5);
            
            setTimeout(() => {
                drawCards(1, true);
            }, 400);
            
            addLog('닷지+! 5 방어도 + 1 드로우!', 'block');
        }
    },
    
    // 전투 개막 -> 전투 개막+
    battleOpeningP: {
        id: 'battleOpeningP',
        name: '전투 개막+',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '<img src="rush.png" alt="Battle Opening+" class="card-icon-img">',
        description: '<span class="damage">12</span> 데미지.<br><span class="innate">선천성</span> · <span class="ethereal">소멸</span>',
        innate: true,
        ethereal: true,
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.bodySlam(playerEl, enemyEl, () => {
                dealDamage(state.enemy, 12);
            });
            
            addLog('전투 개막+! 12 데미지!', 'damage');
        }
    },
    
    // 검무 -> 검무+
    daggerP: {
        id: 'daggerP',
        name: '검무+',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '<img src="dando.png" alt="dagger" class="card-icon-img">',
        description: '\'단도 투척+\' 카드를 4장 손패에 추가합니다.',
        addsCardsToHand: true,
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
            EffectSystem.energize(playerEl);
            
            setTimeout(() => {
                const existingCount = gameState.hand.length;
                
                for (let i = 0; i < 4; i++) {
                    const shiv = createCard('shivP');
                    if (shiv) {
                        gameState.hand.push(shiv);
                    }
                }
                
                if (typeof addCardsToHandWithAnimation === 'function') {
                    addCardsToHandWithAnimation(existingCount, 4);
                } else {
                    renderHand(false);
                }
            }, 350);
            
            addLog('단도 투척+ 4장 획득!');
        }
    },
    
    // 단도 투척 -> 단도 투척+
    shivP: {
        id: 'shivP',
        name: '단도 투척+',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 0,
        icon: '<img src="dagger.png" alt="dagger" class="card-icon-img">',
        description: '<span class="damage">4</span> 데미지를 줍니다. 소멸.',
        isEthereal: true,
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 강화된 단검 투척 VFX (더 화려하게)
            if (playerEl && enemyEl && typeof VFX !== 'undefined') {
                const playerRect = playerEl.getBoundingClientRect();
                const enemyRect = enemyEl.getBoundingClientRect();
                
                VFX.dagger(
                    playerRect.left + playerRect.width / 2,
                    playerRect.top + playerRect.height / 2,
                    enemyRect.left + enemyRect.width / 2,
                    enemyRect.top + enemyRect.height / 2,
                    { 
                        color: '#e0e0e0',
                        glowColor: '#fbbf24',  // 금색 글로우
                        size: 50,
                        speed: 35,
                        spinSpeed: 25
                    }
                );
            }
            
            setTimeout(() => {
                dealDamage(state.enemy, 4);
            }, 250);
            
            addLog('단도 투척+! 4 데미지!', 'damage');
        }
    },
    
    // 연속 찌르기 -> 연속 찌르기+
    flurryP: {
        id: 'flurryP',
        name: '연속 찌르기+',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '<img src="yungyuk.png" alt="Flurry+" class="card-icon-img">',
        description: '<span class="damage">3</span> 데미지를 4회 줍니다.',
        hitCount: 4,
        hitInterval: 120,
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl);
            
            let hits = 0;
            const doHit = () => {
                if (hits >= 4) return;
                if (state.enemy.hp <= 0) return;
                
                EffectSystem.flurryHit(enemyEl, hits);
                dealDamage(state.enemy, 3);
                
                if (hits > 0 && typeof RelicSystem !== 'undefined') {
                    RelicSystem.incrementCombo();
                    RelicSystem.showComboFloater(RelicSystem.combo.count);
                }
                
                hits++;
                setTimeout(doHit, 120);
            };
            
            setTimeout(doHit, 200);
            addLog('연속 찌르기+! 3x4 데미지!', 'damage');
        }
    },
    
    // 비열한 일격 -> 비열한 일격+
    dirtyStrikeP: {
        id: 'dirtyStrikeP',
        name: '비열한 일격+',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '<img src="skill_biyul.png" alt="Dirty Strike" class="card-icon-img">',
        description: '<span class="damage">7</span> 데미지.<br>적에게 <span class="debuff">취약</span> 2턴.',
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#9b59b6', count: 1 });
                dealDamage(state.enemy, 7);
                
                state.enemy.vulnerable = (state.enemy.vulnerable || 0) + 2;
                showVulnerableEffect(enemyEl, 2);
            });
            
            addLog('비열한 일격+! 7 데미지 + 취약 2턴!', 'damage');
        }
    },
    
    // 강탈 -> 강탈+
    plunderP: {
        id: 'plunderP',
        name: '강탈+',
        type: CardType.ATTACK,
        rarity: Rarity.BASIC,
        cost: 1,
        icon: '💰',
        description: '<span class="damage">10</span> 데미지.<br>취약 적 공격 시 <span class="energy">⚡+2</span>',
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: '#ffd700', count: 1 });
                dealDamage(state.enemy, 10);
                
                if (state.enemy.vulnerable > 0) {
                    state.player.energy += 2;
                    showEnergyGainEffect(2);
                    updateUI();
                    renderHand(false);
                    addLog('강탈+! 취약 대상 공격으로 +2 에너지!', 'heal');
                }
            });
            
            addLog('강탈+로 10 데미지!', 'damage');
        }
    },
    
    // 처형의 칼날 -> 처형의 칼날+
    finisherP: {
        id: 'finisherP',
        name: '처형의 칼날+',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '<img src="deadlySword.png" class="card-icon-img">',
        description: '공격 카드 수 × <span class="damage">7</span> 데미지.',
        getDynamicDescription() {
            // 처형의 칼날+ 자신도 공격 카드이므로 +1
            const attackCount = (gameState?.turnStats?.attackCardsPlayed || 0) + 1;
            const totalDamage = attackCount * 7;
            return `공격 카드 수(<span class="damage">${attackCount}</span>) × <span class="damage">7</span> = <span class="damage">${totalDamage}</span> 데미지`;
        },
        hitCount: (state) => Math.max(1, state.turnStats?.attackCardsPlayed || 1),
        hitInterval: 120,
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            const hitCount = state.turnStats.attackCardsPlayed;
            
            if (hitCount <= 0) {
                addLog('공격 카드를 먼저 사용하세요!');
                state.player.energy += 1;
                return;
            }
            
            EffectSystem.playerAttack(playerEl, enemyEl);
            EffectSystem.executionBlade(enemyEl, hitCount);
            
            let hits = 0;
            const doHit = () => {
                if (hits >= hitCount) return;
                if (state.enemy.hp <= 0) return;
                
                dealDamage(state.enemy, 7);
                
                if (hits > 0 && typeof RelicSystem !== 'undefined') {
                    RelicSystem.incrementCombo();
                    RelicSystem.showComboFloater(RelicSystem.combo.count);
                }
                
                hits++;
                setTimeout(doHit, 120);
            };
            
            setTimeout(doHit, 80);
            addLog(`처형의 칼날+! ${hitCount}x7 데미지!`, 'damage');
        }
    },
    
    // 응집된 일격 -> 응집된 일격+
    concentratedStrikeP: {
        id: 'concentratedStrikeP',
        name: '응집된 일격+',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '<img src="chargeAttack.png" alt="Concentrated Strike+" class="card-icon-img">',
        description: '<span class="damage">16</span> 데미지.<br>카드 사용 시 -1 코스트 (최소 0)',
        baseCost: 2,
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#00ffff', size: 250 });
                EffectSystem.screenShake(20, 400);
                dealDamage(state.enemy, 16);
            });
            
            addLog('응집된 일격+! 16 데미지!', 'damage');
        }
    }
};

// ==========================================
// 카드 강화 시스템
// ==========================================
const CardUpgradeSystem = {
    // 강화 매핑 (기본 카드 ID -> 강화 카드 ID)
    upgradeMap: {
        'strike': 'strikeP',
        'defend': 'defendP',
        'bash': 'bashP',
        'dodge': 'dodgeP',
        'battleOpening': 'battleOpeningP',
        'dagger': 'daggerP',
        'shiv': 'shivP',
        'flurry': 'flurryP',
        'dirtyStrike': 'dirtyStrikeP',
        'plunder': 'plunderP',
        'finisher': 'finisherP',
        'concentratedStrike': 'concentratedStrikeP'
    },
    
    // 강화 비용 (기본 50골드)
    getUpgradeCost(cardId) {
        const costMap = {
            'strike': 30,
            'defend': 30,
            'bash': 50,
            'dodge': 40,
            'battleOpening': 60,
            'dagger': 50,
            'shiv': 20,
            'flurry': 50,
            'dirtyStrike': 40,
            'plunder': 50,
            'finisher': 80,
            'concentratedStrike': 80
        };
        return costMap[cardId] || 50;
    },
    
    // 강화 가능한지 확인
    canUpgrade(cardId) {
        return this.upgradeMap.hasOwnProperty(cardId);
    },
    
    // 강화된 카드인지 확인
    isUpgraded(cardId) {
        return cardId.endsWith('P') || (cardDatabase[cardId]?.upgraded || upgradedCardDatabase[cardId]?.upgraded);
    },
    
    // 강화 실행
    upgradeCard(cardInstance) {
        const baseId = cardInstance.id;
        const upgradedId = this.upgradeMap[baseId];
        
        if (!upgradedId) return null;
        
        // 강화된 카드 데이터 가져오기
        const upgradedData = upgradedCardDatabase[upgradedId];
        if (!upgradedData) return null;
        
        // 기존 카드 인스턴스 업그레이드
        Object.assign(cardInstance, {
            ...upgradedData,
            instanceId: cardInstance.instanceId // 인스턴스 ID 유지
        });
        
        return cardInstance;
    },
    
    // 강화 카드 생성
    createUpgradedCard(baseId) {
        const upgradedId = this.upgradeMap[baseId];
        if (!upgradedId) return null;
        
        const cardData = upgradedCardDatabase[upgradedId];
        if (!cardData) return null;
        
        return {
            ...cardData,
            instanceId: Date.now() + Math.random()
        };
    },
    
    // 강화 전후 비교 데이터
    getComparisonData(cardId) {
        const baseCard = cardDatabase[cardId];
        const upgradedId = this.upgradeMap[cardId];
        const upgradedCard = upgradedCardDatabase[upgradedId];
        
        if (!baseCard || !upgradedCard) return null;
        
        return {
            base: baseCard,
            upgraded: upgradedCard
        };
    }
};

// 카드 생성 헬퍼 함수 (강화 카드 포함)
function createCard(cardId) {
    // 먼저 기본 데이터베이스에서 찾기
    let cardData = cardDatabase[cardId];
    
    // 없으면 강화 카드 데이터베이스에서 찾기
    if (!cardData) {
        cardData = upgradedCardDatabase[cardId];
    }
    
    // 없으면 겜블러 카드에서 찾기
    if (!cardData && typeof GamblerCardList !== 'undefined') {
        cardData = GamblerCardList[cardId];
        if (cardData) {
            cardDatabase[cardId] = cardData; // 캐시
        }
    }
    
    if (!cardData) {
        console.error(`[Cards] 카드를 찾을 수 없음: ${cardId}`);
        return null;
    }
    
    // 카드 복사
    const card = {
        ...cardData,
        instanceId: Date.now() + Math.random()
    };
    
    // 응집된 일격은 항상 baseCost로 시작
    if (card.id === 'concentratedStrike' || card.id === 'concentratedStrikeP') {
        card.cost = card.baseCost || card.cost;
    }
    
    return card;
}
