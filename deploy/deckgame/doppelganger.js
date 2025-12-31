// ==========================================
// 도플갱어 시스템 - 카드를 사용하는 적
// ==========================================

const DoppelgangerSystem = {
    // ==========================================
    // 도플갱어 초기화 (엘리트 지원)
    // ==========================================
    initDoppelganger(enemy) {
        // 스타터덱에서 카드 데이터 가져오기
        enemy.deck = this.buildDeckFromStarter();
        enemy.hand = [];
        enemy.discardPile = [];
        
        // 엘리트 특성 적용
        const isElite = enemy.isElite || false;
        enemy.maxEnergy = enemy.eliteEnergy || 3; // 엘리트도 코스트 3
        enemy.energy = enemy.maxEnergy;
        enemy.drawCount = enemy.eliteDrawCount || (isElite ? 6 : 5);
        enemy.isDoppelganger = true;
        
        console.log(`[Doppelganger] Initialized (${isElite ? 'ELITE' : 'Normal'}): Energy ${enemy.maxEnergy}, Draw ${enemy.drawCount}, Deck ${enemy.deck.length} cards`);
    },
    
    // ==========================================
    // 도플갱어가 사용하지 않는 특수 카드 (동적 효과)
    // ==========================================
    excludedCards: ['finisher', 'concentratedStrike', 'executionBlade', 'battleOpening'],
    
    // ==========================================
    // cards.js description에서 데미지/방어도 파싱
    // ==========================================
    parseCardStats(cardData) {
        const desc = cardData.description || '';
        let damage = 0;
        let block = 0;
        let hits = 1;
        let vulnerable = 0;
        let weak = 0;
        
        // hitCount가 숫자인 경우만 사용 (함수는 무시)
        if (typeof cardData.hitCount === 'number') {
            hits = cardData.hitCount;
        }
        
        // 데미지 파싱: <span class="damage">숫자</span>
        const damageMatch = desc.match(/<span class="damage">(\d+)<\/span>/);
        if (damageMatch) {
            damage = parseInt(damageMatch[1]);
        }
        
        // 방어도 파싱: <span class="block-val">숫자</span>
        const blockMatch = desc.match(/<span class="block-val">(\d+)<\/span>/);
        if (blockMatch) {
            block = parseInt(blockMatch[1]);
        }
        
        // 히트 수 파싱: "N회" 또는 "NxM"
        const hitsMatch = desc.match(/(\d+)회/);
        if (hitsMatch) {
            hits = parseInt(hitsMatch[1]);
        }
        
        // 취약 파싱: "취약 N턴" 또는 "취약</span> N"
        const vulnMatch = desc.match(/취약[^0-9]*(\d+)/);
        if (vulnMatch) {
            vulnerable = parseInt(vulnMatch[1]);
        }
        
        // 약화 파싱: "약화 N턴"
        const weakMatch = desc.match(/약화[^0-9]*(\d+)/);
        if (weakMatch) {
            weak = parseInt(weakMatch[1]);
        }
        
        console.log(`[Doppelganger] Parsed: dmg=${damage}, blk=${block}, hits=${hits}, vuln=${vulnerable}, weak=${weak}`)
        
        return { damage, block, hits, vulnerable, weak };
    },
    
    // ==========================================
    // 스타터덱 기반 덱 생성 (cards.js에서 직접 읽기)
    // ==========================================
    buildDeckFromStarter() {
        const deck = [];
        
        // starterDeck이 있으면 사용 (starter-deck.js)
        if (typeof starterDeck !== 'undefined' && typeof cardDatabase !== 'undefined') {
            starterDeck.forEach(cardId => {
                // 특수 카드는 제외
                if (this.excludedCards.includes(cardId)) {
                    console.log(`[Doppelganger] Excluding special card: ${cardId}`);
                    return;
                }
                
                const cardData = cardDatabase[cardId];
                if (cardData) {
                    // description에서 스탯 파싱
                    const stats = this.parseCardStats(cardData);
                    
                    // 카드 타입 판별
                    const cardType = cardData.type === CardType?.ATTACK ? 'attack' : 
                                     cardData.type === CardType?.SKILL ? 'skill' : 
                                     cardData.type === 'attack' ? 'attack' : 'skill';
                    
                    // 코스트 처리 (0도 유효한 값)
                    const cardCost = (typeof cardData.cost === 'number') ? cardData.cost : 1;
                    
                    // 카드 데이터를 도플갱어용으로 변환
                    deck.push({
                        id: cardId,
                        name: cardData.name,
                        type: cardType,
                        cost: cardCost,
                        damage: stats.damage,
                        block: stats.block,
                        hits: stats.hits,
                        vulnerable: stats.vulnerable,
                        weak: stats.weak,
                        icon: cardData.icon,
                        description: cardData.description,
                    });
                    
                    console.log(`[Doppelganger] Card added: ${cardData.name} (Cost:${cardCost}, DMG:${stats.damage}, BLK:${stats.block}, Vuln:${stats.vulnerable})`);
                }
            });
        }
        
        // 덱이 비어있으면 기본 덱 사용
        if (deck.length === 0) {
            console.warn('[Doppelganger] Using fallback deck');
            return this.shuffleArray([
                { id: 'strike', name: '타격', type: 'attack', damage: 6, cost: 1, hits: 1 },
                { id: 'strike', name: '타격', type: 'attack', damage: 6, cost: 1, hits: 1 },
                { id: 'strike', name: '타격', type: 'attack', damage: 6, cost: 1, hits: 1 },
                { id: 'defend', name: '방어', type: 'skill', block: 5, cost: 1, hits: 0 },
                { id: 'defend', name: '방어', type: 'skill', block: 5, cost: 1, hits: 0 },
            ]);
        }
        
        console.log('[Doppelganger] Built deck from cards.js:', deck.map(c => `${c.name}(DMG:${c.damage}/BLK:${c.block})`));
        return this.shuffleArray(deck);
    },
    
    // ==========================================
    // 턴 시작 - 카드 뽑기
    // ==========================================
    startTurn(enemy) {
        if (!enemy.isDoppelganger) return;
        
        // 에너지 회복
        enemy.energy = enemy.maxEnergy;
        
        // 카드 뽑기 (엘리트는 6장, 일반은 5장)
        const drawCount = enemy.drawCount || 5;
        this.drawCards(enemy, drawCount);
        
        // 사용할 카드 선택 (AI)
        this.planActions(enemy);
        
        console.log(`[Doppelganger] Turn start - Hand: ${enemy.hand.length}, Energy: ${enemy.energy}/${enemy.maxEnergy}`);
    },
    
    // ==========================================
    // 카드 뽑기
    // ==========================================
    drawCards(enemy, count) {
        for (let i = 0; i < count; i++) {
            if (enemy.deck.length === 0) {
                // 버린 카드 다시 섞기
                enemy.deck = this.shuffleArray([...enemy.discardPile]);
                enemy.discardPile = [];
            }
            
            if (enemy.deck.length > 0) {
                const card = enemy.deck.pop();
                enemy.hand.push(card);
            }
        }
    },
    
    // ==========================================
    // 행동 계획 (AI) - 의도 설정 (공격/방어 균형)
    // ==========================================
    planActions(enemy) {
        if (!enemy.hand || enemy.hand.length === 0) {
            enemy.intent = 'defend';
            enemy.intentValue = 0;
            return;
        }
        
        // 플레이할 카드들 선택
        enemy.plannedCards = [];
        let tempEnergy = enemy.energy;
        
        // HP 비율에 따른 방어 성향
        const hpRatio = enemy.hp / enemy.maxHp;
        let defenseChance = 0.3; // 기본 30% 방어 성향
        
        if (hpRatio < 0.3) {
            defenseChance = 0.8; // HP 30% 미만: 80% 방어
        } else if (hpRatio < 0.5) {
            defenseChance = 0.6; // HP 50% 미만: 60% 방어
        } else if (hpRatio < 0.7) {
            defenseChance = 0.4; // HP 70% 미만: 40% 방어
        }
        
        const preferDefense = Math.random() < defenseChance;
        
        // 공격 카드와 스킬 카드 분리
        const attackCards = enemy.hand.filter(c => c.type === 'attack');
        const skillCards = enemy.hand.filter(c => c.type === 'skill');
        
        // 균형 있는 선택: 방어 카드 먼저 1-2장, 그 다음 공격
        if (preferDefense && skillCards.length > 0) {
            // 방어 우선: 스킬 먼저 선택
            const shuffledSkills = this.shuffleArray([...skillCards]);
            const shuffledAttacks = this.shuffleArray([...attackCards]);
            
            // 스킬 카드 선택 (1-2장)
            let skillCount = 0;
            for (const card of shuffledSkills) {
                if (card.cost <= tempEnergy && skillCount < 2) {
                    enemy.plannedCards.push(card);
                    tempEnergy -= card.cost;
                    skillCount++;
                }
            }
            
            // 남은 에너지로 공격
            for (const card of shuffledAttacks) {
                if (card.cost <= tempEnergy) {
                    enemy.plannedCards.push(card);
                    tempEnergy -= card.cost;
                }
            }
        } else {
            // 공격 우선: 공격 먼저, 그 다음 스킬 1장 섞기
            const shuffledAttacks = this.shuffleArray([...attackCards]);
            const shuffledSkills = this.shuffleArray([...skillCards]);
            
            // 공격 카드 선택 (2-3장)
            let attackCount = 0;
            for (const card of shuffledAttacks) {
                if (card.cost <= tempEnergy && attackCount < 3) {
                    enemy.plannedCards.push(card);
                    tempEnergy -= card.cost;
                    attackCount++;
                }
            }
            
            // 스킬 카드 1장 섞기 (50% 확률)
            if (Math.random() < 0.5 && shuffledSkills.length > 0) {
                for (const card of shuffledSkills) {
                    if (card.cost <= tempEnergy) {
                        enemy.plannedCards.push(card);
                        tempEnergy -= card.cost;
                        break;
                    }
                }
            }
            
            // 남은 에너지로 더 선택
            for (const card of [...shuffledAttacks, ...shuffledSkills]) {
                if (!enemy.plannedCards.includes(card) && card.cost <= tempEnergy) {
                    enemy.plannedCards.push(card);
                    tempEnergy -= card.cost;
                }
            }
        }
        
        // 검무가 있으면 단도 투척도 의도에 추가
        this.expandDaggerIntent(enemy);
        
        // 의도 설정 (첫 번째 카드 기반)
        this.updateIntent(enemy);
        
        console.log(`[Doppelganger] Plan: Defense=${preferDefense}, Cards=${enemy.plannedCards.map(c => c.name).join(', ')}`);
    },
    
    // ==========================================
    // 검무 의도 확장 (단도 투척 추가)
    // ==========================================
    expandDaggerIntent(enemy) {
        const expandedCards = [];
        
        enemy.plannedCards.forEach(card => {
            expandedCards.push(card);
            
            // 검무면 단도 투척 추가
            if (card.id === 'dagger') {
                for (let i = 0; i < 3; i++) {
                    expandedCards.push(this.createShivCard('shiv'));
                }
            } else if (card.id === 'daggerP') {
                for (let i = 0; i < 4; i++) {
                    expandedCards.push(this.createShivCard('shivP'));
                }
            }
        });
        
        enemy.plannedCards = expandedCards;
    },
    
    // ==========================================
    // 의도 업데이트
    // ==========================================
    updateIntent(enemy) {
        if (!enemy.plannedCards || enemy.plannedCards.length === 0) {
            enemy.intent = 'defend';
            enemy.intentValue = 0;
            enemy.intentIcon = '🛡️';
            return;
        }
        
        // 총 데미지 / 방어도 계산
        let totalDamage = 0;
        let totalBlock = 0;
        let totalHits = 0;
        
        enemy.plannedCards.forEach(card => {
            if (card.type === 'attack') {
                // hits가 숫자인지 확인
                const hits = (typeof card.hits === 'number' && card.hits > 0) ? Math.min(card.hits, 10) : 1;
                const damage = (typeof card.damage === 'number') ? card.damage : 0;
                totalDamage += damage * hits;
                totalHits += hits;
            } else if (card.type === 'skill' && card.block) {
                totalBlock += card.block;
            }
        });
        
        // 주요 행동 결정
        if (totalDamage > totalBlock) {
            enemy.intent = 'attack';
            enemy.intentValue = totalDamage;
            enemy.intentHits = totalHits > 1 ? totalHits : undefined;
            enemy.intentIcon = totalHits > 2 ? '⚔️' : '🗡️';
        } else {
            enemy.intent = 'defend';
            enemy.intentValue = totalBlock;
            enemy.intentIcon = '🛡️';
        }
        
        // 특수 의도 (취약 부여 등)
        const hasVulnerable = enemy.plannedCards.some(c => c.vulnerable);
        if (hasVulnerable && totalDamage > 0) {
            enemy.intentIcon = '💥';
        }
    },
    
    // ==========================================
    // 행동 실행 (콜백 지원)
    // ==========================================
    executeActions(enemy, gameState, onComplete) {
        if (!enemy.isDoppelganger || !enemy.plannedCards) {
            if (onComplete) onComplete();
            return;
        }
        
        const cardDelay = 1800; // 카드 표시 + 애니메이션 + 모션 시간
        const cards = [...enemy.plannedCards];
        let currentIndex = 0;
        
        const playNextCard = () => {
            if (currentIndex >= cards.length) {
                // 모든 카드 사용 완료
                setTimeout(() => {
                    this.endTurn(enemy);
                    if (onComplete) onComplete();
                }, 500);
                return;
            }
            
            const card = cards[currentIndex];
            currentIndex++;
            
            // 카드 사용 후 다음 카드
            this.playCard(enemy, card, gameState, () => {
                setTimeout(playNextCard, 300); // 카드 간 간격
            });
        };
        
        // 첫 번째 카드 시작
        playNextCard();
    },
    
    // ==========================================
    // 카드 사용 (콜백 지원)
    // ==========================================
    playCard(enemy, card, gameState, onComplete) {
        const player = gameState.player;
        const enemyIndex = gameState.enemies.indexOf(enemy);
        const enemyEl = document.querySelector(`.enemy-unit[data-index="${enemyIndex}"]`);
        const playerEl = document.getElementById('player');
        
        // 손패에서 제거 -> 버린 카드로
        const cardIndex = enemy.hand.indexOf(card);
        if (cardIndex >= 0) {
            enemy.hand.splice(cardIndex, 1);
            enemy.discardPile.push(card);
        }
        
        // 에너지 소모
        enemy.energy -= card.cost;
        
        // UI 업데이트 (의도 표시 갱신)
        if (typeof updateEnemiesUI === 'function') {
            updateEnemiesUI();
        }
        
        // 카드 UI 생성 및 애니메이션
        this.showCardAnimation(enemy, card, enemyEl, playerEl, () => {
            // 카드 사용 로그
            addLog(`🃏 ${enemy.name}: ${card.name}`, 'enemy');
            
            // 카드 효과 적용 (NPC 공통 모션 사용)
            if (card.type === 'attack') {
                this.executeAttackCard(enemy, card, player, enemyEl, playerEl, onComplete);
            } else if (card.type === 'skill') {
                this.executeSkillCard(enemy, card, player, enemyEl, playerEl, onComplete);
            } else {
                updateUI();
                if (onComplete) onComplete();
            }
        });
    },
    
    // ==========================================
    // 반전된 State 생성 (도플갱어용)
    // enemy = 플레이어, player = 도플갱어
    // ==========================================
    createReversedState(doppelganger, player, originalState) {
        // 임시로 전역 상태 반전 (effect 함수 내에서 사용)
        this._originalEnemy = originalState.enemy;
        this._originalPlayer = originalState.player;
        this._doppelganger = doppelganger;
        this._targetPlayer = player;
        
        // 전역 gameState 임시 수정
        const originalGameStateEnemy = gameState.enemy;
        const originalGameStatePlayer = gameState.player;
        
        // 도플갱어 모드: enemy = 플레이어, player = 도플갱어
        gameState.enemy = player;
        gameState.player = doppelganger;
        
        // 원복 함수 저장
        this._restoreState = () => {
            gameState.enemy = originalGameStateEnemy;
            gameState.player = originalGameStatePlayer;
        };
        
        // 원복 타이머 (안전장치)
        setTimeout(() => {
            if (this._restoreState) {
                this._restoreState();
                this._restoreState = null;
            }
        }, 2000);
        
        return {
            enemy: player,
            player: doppelganger,
            turn: originalState.turn,
            turnStats: originalState.turnStats || { attackCardsPlayed: 0 },
            deck: originalState.deck,
            hand: originalState.hand,
            discardPile: originalState.discardPile,
            enemies: originalState.enemies,
            selectedEnemyIndex: originalState.selectedEnemyIndex,
        };
    },
    
    // 상태 원복
    restoreGameState() {
        if (this._restoreState) {
            this._restoreState();
            this._restoreState = null;
        }
    },
    
    // ==========================================
    // 공격 카드 실행 (NPC 공통 모션)
    // ==========================================
    executeAttackCard(enemy, card, player, enemyEl, playerEl, onComplete) {
        let hits = 1;
        if (typeof card.hits === 'number' && card.hits > 0) {
            hits = Math.min(card.hits, 10);
        }
        
        const damage = card.damage || 0;
        let hitCount = 0;
        
        const doHit = () => {
            if (hitCount >= hits) {
                // 디버프 적용
                if (card.vulnerable && card.vulnerable > 0) {
                    player.vulnerable = (player.vulnerable || 0) + card.vulnerable;
                    addLog(`💔 Vulnerable ${card.vulnerable}!`, 'debuff');
                    if (typeof showPlayerVulnerableEffect === 'function') {
                        showPlayerVulnerableEffect();
                    }
                }
                if (card.weak && card.weak > 0) {
                    player.weak = (player.weak || 0) + card.weak;
                    addLog(`💧 Weak ${card.weak}!`, 'debuff');
                }
                
                updateUI();
                if (typeof updatePlayerStatusUI === 'function') updatePlayerStatusUI();
                if (onComplete) onComplete();
                return;
            }
            
            // NPC 공통 공격 모션
            if (enemyEl && playerEl) {
                // 단도 투척은 VFX.dagger 사용
                if ((card.id === 'shiv' || card.id === 'shivP') && typeof VFX !== 'undefined') {
                    const enemyRect = enemyEl.getBoundingClientRect();
                    const playerRect = playerEl.getBoundingClientRect();
                    
                    VFX.dagger(
                        enemyRect.left + enemyRect.width / 2,
                        enemyRect.top + enemyRect.height / 2,
                        playerRect.left + playerRect.width / 2,
                        playerRect.top + playerRect.height / 2,
                        { 
                            color: '#c0c0c0',
                            glowColor: card.id === 'shivP' ? '#fbbf24' : '#ef4444',  // 강화면 금색, 아니면 빨간색
                            size: 45,
                            speed: 30,
                            spinSpeed: 20
                        }
                    );
                } else if (typeof EffectSystem !== 'undefined') {
                    EffectSystem.enemyAttack(enemyEl, playerEl, damage);
                }
            }
            
            // 데미지 계산
            setTimeout(() => {
                let actualDamage = damage;
                
                // 취약 보너스
                if (player.vulnerable && player.vulnerable > 0) {
                    actualDamage = Math.floor(actualDamage * 1.5);
                }
                
                // 약화 감소
                if (enemy.weak && enemy.weak > 0) {
                    actualDamage = Math.floor(actualDamage * 0.75);
                }
                
                // 방어도 처리
                const blocked = Math.min(player.block || 0, actualDamage);
                player.block = Math.max(0, (player.block || 0) - blocked);
                const finalDamage = actualDamage - blocked;
                player.hp -= finalDamage;
                
                // 데미지 팝업
                if (finalDamage > 0 && playerEl) {
                    if (typeof showDamagePopup === 'function') {
                        showDamagePopup(playerEl, finalDamage, 'damage');
                    }
                }
                if (blocked > 0) {
                    addLog(`Blocked ${blocked}`, 'block');
                }
                
                updateUI();
                hitCount++;
                
                // 다음 히트
                if (hitCount < hits) {
                    setTimeout(doHit, 250);
                } else {
                    doHit(); // 마지막 처리
                }
            }, 200);
        };
        
        doHit();
    },
    
    // ==========================================
    // 스킬 카드 실행
    // ==========================================
    executeSkillCard(enemy, card, player, enemyEl, playerEl, onComplete) {
        // 방어도 획득
        if (card.block && card.block > 0) {
            enemy.block = (enemy.block || 0) + card.block;
            
            // 방어 이펙트
            if (typeof EffectSystem !== 'undefined' && enemyEl) {
                EffectSystem.shield(enemyEl, { color: '#60a5fa' });
            }
            
            addLog(`🛡️ ${enemy.name} +${card.block} Block`, 'block');
        }
        
        // 드로우 효과 (도플갱어는 자체 덱 사용)
        if (card.draw && card.draw > 0) {
            this.drawCards(enemy, card.draw);
        }
        
        // 검무: 단도는 plannedCards에서 순차적으로 실행됨
        if (card.id === 'dagger' || card.id === 'daggerP') {
            const shivCount = card.id === 'daggerP' ? 4 : 3;
            addLog(`🗡️ ${enemy.name} prepares ${shivCount} shivs!`, 'info');
            
            // 이펙트
            if (typeof EffectSystem !== 'undefined' && enemyEl) {
                EffectSystem.energize(enemyEl);
            }
        }
        
        updateUI();
        if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
        if (onComplete) onComplete();
    },
    
    // ==========================================
    // 단도 카드 생성
    // ==========================================
    createShivCard(shivId) {
        const isUpgraded = shivId === 'shivP';
        return {
            id: shivId,
            name: isUpgraded ? '단도 투척+' : '단도 투척',
            type: 'attack',
            cost: 0,
            damage: isUpgraded ? 4 : 2,
            hits: 1,
            icon: '<img src="dagger.png" alt="dagger" class="card-icon-img">',
            description: isUpgraded 
                ? '<span class="damage">4</span> 데미지를 줍니다. 소멸.'
                : '<span class="damage">2</span> 데미지를 줍니다. 소멸.',
        };
    },
    
    // ==========================================
    // 단도들을 순차적으로 사용
    // ==========================================
    useShivsSequentially(enemy, shivCards, player, enemyEl, playerEl, onComplete) {
        if (shivCards.length === 0) {
            if (onComplete) onComplete();
            return;
        }
        
        const shiv = shivCards.shift();
        
        // 단도 사용 애니메이션 (빠르게)
        this.showCardAnimation(enemy, shiv, enemyEl, playerEl, () => {
            addLog(`🗡️ ${enemy.name}: ${shiv.name}`, 'enemy');
            
            // 단검 투척 VFX
            if (typeof VFX !== 'undefined' && enemyEl && playerEl) {
                const enemyRect = enemyEl.getBoundingClientRect();
                const playerRect = playerEl.getBoundingClientRect();
                
                VFX.dagger(
                    enemyRect.left + enemyRect.width / 2,
                    enemyRect.top + enemyRect.height / 2,
                    playerRect.left + playerRect.width / 2,
                    playerRect.top + playerRect.height / 2,
                    { 
                        color: '#c0c0c0',
                        glowColor: shiv.id === 'shivP' ? '#fbbf24' : '#ef4444',
                        size: 45,
                        speed: 32,
                        spinSpeed: 22
                    }
                );
            }
            
            // 데미지 적용
            setTimeout(() => {
                let damage = shiv.damage;
                if (player.vulnerable && player.vulnerable > 0) {
                    damage = Math.floor(damage * 1.5);
                }
                
                const blocked = Math.min(player.block || 0, damage);
                player.block = Math.max(0, (player.block || 0) - blocked);
                const finalDamage = damage - blocked;
                player.hp -= finalDamage;
                
                if (finalDamage > 0 && playerEl && typeof showDamagePopup === 'function') {
                    showDamagePopup(playerEl, finalDamage, 'damage');
                }
                
                updateUI();
                
                // 다음 단도
                setTimeout(() => {
                    this.useShivsSequentially(enemy, shivCards, player, enemyEl, playerEl, onComplete);
                }, 300);
            }, 200);
        });
    },
    
    // ==========================================
    // 폴백 카드 효과 (effect가 없을 때)
    // ==========================================
    fallbackCardEffect(enemy, card, player, enemyEl, playerEl) {
        if (card.type === 'attack') {
            let hits = 1;
            if (typeof card.hits === 'number' && card.hits > 0) {
                hits = Math.min(card.hits, 10);
            }
            
            for (let i = 0; i < hits; i++) {
                let damage = card.damage || 0;
                if (player.vulnerable && player.vulnerable > 0) {
                    damage = Math.floor(damage * 1.5);
                }
                
                const blocked = Math.min(player.block || 0, damage);
                player.block = (player.block || 0) - blocked;
                player.hp -= (damage - blocked);
            }
            
            if (card.vulnerable) {
                player.vulnerable = (player.vulnerable || 0) + card.vulnerable;
            }
            if (card.weak) {
                player.weak = (player.weak || 0) + card.weak;
            }
        } else if (card.type === 'skill' && card.block) {
            enemy.block = (enemy.block || 0) + card.block;
        }
    },
    
    // ==========================================
    // 도플갱어 공격 모션 (플레이어처럼 돌진)
    // ==========================================
    doppelgangerAttackMotion(enemyEl, playerEl, callback) {
        if (!enemyEl || !playerEl) {
            if (callback) callback();
            return;
        }
        
        // 도플갱어 돌진 클래스 추가
        enemyEl.classList.add('doppel-attacking');
        
        // 돌진 후 콜백 실행
        setTimeout(() => {
            if (callback) callback();
        }, 250);
        
        // 원위치
        setTimeout(() => {
            enemyEl.classList.remove('doppel-attacking');
        }, 500);
    },
    
    // ==========================================
    // 카드 사용 애니메이션 (플레이어처럼 카드를 보여주고 효과 실행)
    // ==========================================
    showCardAnimation(enemy, card, enemyEl, playerEl, onComplete) {
        // 카드 UI 생성 (플레이어 카드와 동일한 디자인)
        const cardEl = document.createElement('div');
        const cardType = card.type || 'skill';
        cardEl.className = `card ${cardType} doppel-display-card`;
        
        // 카드 내용 (플레이어 카드와 동일한 구조)
        const valueDisplay = cardType === 'attack' 
            ? (card.hits > 1 ? `${card.damage}×${card.hits}` : card.damage)
            : (card.block || card.draw || '');
        
        // cards.js의 icon 사용 (이미지 또는 이모지)
        let iconHtml = '';
        if (card.icon) {
            // 이미 HTML 태그면 그대로 사용
            if (card.icon.includes('<img') || card.icon.includes('<')) {
                iconHtml = card.icon;
            } else {
                // 이모지면 span으로 감싸기
                iconHtml = `<span class="card-icon-emoji">${card.icon}</span>`;
            }
        } else {
            // 기본 아이콘
            iconHtml = `<span class="card-icon-emoji">${cardType === 'attack' ? '⚔️' : '🛡️'}</span>`;
        }
        
        // cards.js의 description 사용
        const descText = card.description || (cardType === 'attack'
            ? `<span class="damage">${card.damage}</span> 데미지`
            : `<span class="block-val">${card.block}</span> 방어도`);
        
        cardEl.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-image">
                ${iconHtml}
            </div>
            <div class="card-name">${card.name}</div>
            <div class="card-value">${valueDisplay}</div>
            <div class="card-description">${descText}</div>
        `;
        
        // 화면 중앙에 크게 표시
        cardEl.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(0) rotateY(90deg);
            z-index: 10000;
            opacity: 0;
            width: 180px;
            height: 250px;
            pointer-events: none;
        `;
        
        document.body.appendChild(cardEl);
        
        // 애니메이션 1: 카드 등장 (펼쳐지는 효과)
        setTimeout(() => {
            cardEl.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            cardEl.style.transform = 'translate(-50%, -50%) scale(1.3) rotateY(0deg)';
            cardEl.style.opacity = '1';
        }, 50);
        
        // 애니메이션 2: 잠시 대기 (카드 확인)
        setTimeout(() => {
            // 카드 사용 강조 효과
            cardEl.style.boxShadow = cardType === 'attack' 
                ? '0 0 40px #ef4444, 0 0 80px rgba(239, 68, 68, 0.5)'
                : '0 0 40px #60a5fa, 0 0 80px rgba(96, 165, 250, 0.5)';
        }, 450);
        
        // 애니메이션 3: 카드 사라지면서 효과 발동
        setTimeout(() => {
            cardEl.style.transition = 'all 0.25s ease-in';
            cardEl.style.transform = 'translate(-50%, -50%) scale(0.5)';
            cardEl.style.opacity = '0';
            
            // 효과 발동
            onComplete();
            
            // 공격이면 타격 이펙트
            if (cardType === 'attack' && playerEl) {
                this.showAttackEffect(playerEl, card);
            }
            // 방어면 방어 이펙트
            if (card.block && enemyEl) {
                this.showDefendEffect(enemyEl);
            }
        }, 900);
        
        // 정리
        setTimeout(() => {
            cardEl.remove();
        }, 1150);
    },
    
    // ==========================================
    // 공격 이펙트
    // ==========================================
    showAttackEffect(targetEl, card) {
        const rect = targetEl.getBoundingClientRect();
        const hits = card.hits || 1;
        
        // 슬래시 이펙트
        for (let i = 0; i < hits; i++) {
            setTimeout(() => {
                const slash = document.createElement('div');
                slash.className = 'doppel-slash-effect';
                slash.innerHTML = '⚔️';
                slash.style.cssText = `
                    position: fixed;
                    left: ${rect.left + rect.width / 2 + (Math.random() - 0.5) * 50}px;
                    top: ${rect.top + rect.height / 2 + (Math.random() - 0.5) * 50}px;
                    transform: translate(-50%, -50%) scale(0) rotate(${Math.random() * 360}deg);
                    font-size: 3rem;
                    z-index: 10001;
                    pointer-events: none;
                `;
                document.body.appendChild(slash);
                
                // 슬래시 애니메이션
                setTimeout(() => {
                    slash.style.transition = 'all 0.2s ease-out';
                    slash.style.transform = `translate(-50%, -50%) scale(1.5) rotate(${Math.random() * 360}deg)`;
                    slash.style.opacity = '1';
                }, 10);
                
                setTimeout(() => {
                    slash.style.transition = 'all 0.15s ease-in';
                    slash.style.transform = `translate(-50%, -50%) scale(2) rotate(${Math.random() * 360}deg)`;
                    slash.style.opacity = '0';
                }, 150);
                
                setTimeout(() => slash.remove(), 350);
            }, i * 150);
        }
    },
    
    // ==========================================
    // 방어 이펙트
    // ==========================================
    showDefendEffect(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        
        const shield = document.createElement('div');
        shield.className = 'doppel-shield-effect';
        shield.innerHTML = '🛡️';
        shield.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            transform: translate(-50%, -50%) scale(0);
            font-size: 4rem;
            z-index: 10001;
            pointer-events: none;
            filter: drop-shadow(0 0 20px #60a5fa);
        `;
        document.body.appendChild(shield);
        
        // 방패 애니메이션
        setTimeout(() => {
            shield.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            shield.style.transform = 'translate(-50%, -50%) scale(1.5)';
        }, 10);
        
        setTimeout(() => {
            shield.style.transition = 'all 0.3s ease-in';
            shield.style.transform = 'translate(-50%, -50%) scale(0.5)';
            shield.style.opacity = '0';
        }, 400);
        
        setTimeout(() => shield.remove(), 700);
    },
    
    // ==========================================
    // 턴 종료
    // ==========================================
    endTurn(enemy) {
        // 남은 손패 버리기
        while (enemy.hand.length > 0) {
            enemy.discardPile.push(enemy.hand.pop());
        }
        enemy.plannedCards = [];
        
        console.log('[Doppelganger] Turn end - Discard:', enemy.discardPile.length);
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    executeSequentially(actions, delay) {
        actions.forEach((action, index) => {
            setTimeout(action, index * delay);
        });
    },
    
    showHitEffect(target) {
        const playerEl = document.getElementById('player');
        if (playerEl) {
            playerEl.classList.add('hit-effect');
            setTimeout(() => playerEl.classList.remove('hit-effect'), 200);
        }
    },
    
    showDamageNumber(damage) {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;
        
        const rect = playerEl.getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = 'damage-popup';
        popup.textContent = `-${damage}`;
        popup.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 3}px;
            transform: translateX(-50%);
            z-index: 1000;
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    },
    
    showBlockEffect(element, amount) {
        const popup = document.createElement('div');
        popup.className = 'block-popup';
        popup.textContent = `🛡️+${amount}`;
        popup.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #60a5fa;
            font-size: 1.2rem;
            font-weight: bold;
            text-shadow: 0 0 10px #60a5fa;
            animation: blockPopup 0.8s ease-out forwards;
            z-index: 100;
        `;
        element.appendChild(popup);
        setTimeout(() => popup.remove(), 800);
    }
};

// CSS 스타일 추가
const doppelgangerStyles = document.createElement('style');
doppelgangerStyles.textContent = `
    /* 도플갱어 전용 스타일 - 쉐도우 멀티플라이어 */
    .enemy-unit.doppelganger {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
    }
    
    .enemy-unit.doppelganger .enemy-name {
        color: #4a4a6a !important;
        text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
    }
    
    /* 도플갱어 스프라이트 컨테이너 - 그림자 분신 효과 */
    .enemy-unit.doppelganger .enemy-sprite-container {
        position: relative;
    }
    
    /* 도플갱어 이미지 - 어두운 그림자 텍스쳐 */
    .enemy-unit.doppelganger .enemy-image,
    .enemy-unit.doppelganger .enemy-sprite,
    .enemy-unit.doppelganger .enemy-sprite-img {
        filter: brightness(0.15) contrast(1.5) saturate(0);
        opacity: 0.9;
        animation: shadowFlicker 3s ease-in-out infinite;
    }
    
    /* 그림자 분신들 (::before, ::after) */
    .enemy-unit.doppelganger .enemy-sprite-container::before,
    .enemy-unit.doppelganger .enemy-sprite-container::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: inherit;
        pointer-events: none;
    }
    
    .enemy-unit.doppelganger .enemy-sprite-container::before {
        transform: translate(-8px, -4px);
        opacity: 0.4;
        filter: blur(2px);
        animation: shadowClone1 2s ease-in-out infinite;
    }
    
    .enemy-unit.doppelganger .enemy-sprite-container::after {
        transform: translate(8px, 4px);
        opacity: 0.3;
        filter: blur(3px);
        animation: shadowClone2 2.5s ease-in-out infinite;
    }
    
    @keyframes shadowFlicker {
        0%, 100% {
            filter: brightness(0.15) contrast(1.5) saturate(0)
                    drop-shadow(0 0 5px rgba(0, 0, 0, 0.9))
                    drop-shadow(-3px -2px 0 rgba(30, 30, 50, 0.6))
                    drop-shadow(3px 2px 0 rgba(30, 30, 50, 0.4));
            opacity: 0.9;
        }
        25% {
            filter: brightness(0.2) contrast(1.4) saturate(0)
                    drop-shadow(0 0 8px rgba(0, 0, 0, 0.95))
                    drop-shadow(-5px -3px 0 rgba(30, 30, 50, 0.5))
                    drop-shadow(4px 3px 0 rgba(30, 30, 50, 0.3));
            opacity: 0.85;
        }
        50% {
            filter: brightness(0.12) contrast(1.6) saturate(0)
                    drop-shadow(0 0 10px rgba(0, 0, 0, 1))
                    drop-shadow(-4px -2px 0 rgba(30, 30, 50, 0.7))
                    drop-shadow(5px 2px 0 rgba(30, 30, 50, 0.5));
            opacity: 0.95;
        }
        75% {
            filter: brightness(0.18) contrast(1.45) saturate(0)
                    drop-shadow(0 0 6px rgba(0, 0, 0, 0.9))
                    drop-shadow(-6px -4px 0 rgba(30, 30, 50, 0.4))
                    drop-shadow(3px 4px 0 rgba(30, 30, 50, 0.35));
            opacity: 0.88;
        }
    }
    
    @keyframes shadowClone1 {
        0%, 100% { transform: translate(-8px, -4px); opacity: 0.4; }
        50% { transform: translate(-12px, -6px); opacity: 0.25; }
    }
    
    @keyframes shadowClone2 {
        0%, 100% { transform: translate(8px, 4px); opacity: 0.3; }
        50% { transform: translate(10px, 6px); opacity: 0.2; }
    }
    
    /* 도플갱어 오라 효과 - 어두운 안개 */
    .enemy-unit.doppelganger::before {
        content: '';
        position: absolute;
        inset: -15px;
        background: radial-gradient(ellipse at center, 
            rgba(0, 0, 0, 0.5) 0%, 
            rgba(20, 20, 35, 0.3) 40%,
            transparent 70%);
        border-radius: inherit;
        z-index: -1;
        animation: shadowAura 4s ease-in-out infinite;
        pointer-events: none;
    }
    
    @keyframes shadowAura {
        0%, 100% {
            opacity: 0.7;
            transform: scale(1);
            filter: blur(5px);
        }
        50% {
            opacity: 0.9;
            transform: scale(1.1);
            filter: blur(8px);
        }
    }
    
    /* 도플갱어가 사용하는 카드 (플레이어 카드와 동일한 디자인) */
    .doppel-display-card {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%) !important;
        border: 3px solid #a855f7 !important;
        box-shadow: 0 8px 32px rgba(168, 85, 247, 0.4), 
                    0 0 60px rgba(168, 85, 247, 0.3),
                    inset 0 0 20px rgba(168, 85, 247, 0.1) !important;
    }
    
    .doppel-display-card.attack {
        border-color: #ef4444 !important;
        box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4), 
                    0 0 60px rgba(239, 68, 68, 0.3),
                    inset 0 0 20px rgba(239, 68, 68, 0.1) !important;
    }
    
    .doppel-display-card.skill {
        border-color: #60a5fa !important;
        box-shadow: 0 8px 32px rgba(96, 165, 250, 0.4), 
                    0 0 60px rgba(96, 165, 250, 0.3),
                    inset 0 0 20px rgba(96, 165, 250, 0.1) !important;
    }
    
    .doppel-display-card .card-image {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 80px;
    }
    
    .doppel-display-card .card-icon {
        font-size: 3rem;
    }
    
    .doppel-display-card .card-icon-emoji {
        font-size: 3rem;
    }
    
    .doppel-display-card .card-icon-img {
        width: 60px;
        height: 60px;
        object-fit: contain;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }
    
    .doppel-display-card .card-image img {
        width: 60px;
        height: 60px;
        object-fit: contain;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }
    
    .doppel-display-card .card-name {
        font-size: 1rem;
        font-weight: bold;
        color: #fff;
        text-align: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    }
    
    .doppel-display-card .card-value {
        font-size: 1.8rem;
        font-weight: bold;
        text-align: center;
    }
    
    .doppel-display-card.attack .card-value {
        color: #ef4444;
        text-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
    }
    
    .doppel-display-card.skill .card-value {
        color: #60a5fa;
        text-shadow: 0 0 15px rgba(96, 165, 250, 0.6);
    }
    
    .doppel-display-card .card-description {
        font-size: 0.7rem;
        color: #a0a0b0;
        text-align: center;
        padding: 0 8px;
    }
    
    /* 도플갱어 카드 미니 표시 */
    .doppelganger-hand {
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 2px;
    }
    
    .doppelganger-card-mini {
        width: 20px;
        height: 28px;
        background: linear-gradient(135deg, #4a4a6a 0%, #2a2a3a 100%);
        border: 1px solid #6b7280;
        border-radius: 3px;
    }
    
    .doppelganger-card-mini.attack {
        border-color: #ef4444;
    }
    
    .doppelganger-card-mini.skill {
        border-color: #60a5fa;
    }
    
    @keyframes blockPopup {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
    }
    
    /* 도플갱어 히트 이펙트 - styles.css의 메인 히트 이펙트 사용 */
    
    /* 도플갱어 돌진 모션 (플레이어처럼) */
    .doppel-attacking {
        animation: doppelAttackMotion 0.4s ease-out;
    }
    
    @keyframes doppelAttackMotion {
        0% {
            transform: translateX(0) scale(1);
        }
        30% {
            transform: translateX(-80px) scale(1.1);
        }
        50% {
            transform: translateX(-100px) scale(1.15);
        }
        100% {
            transform: translateX(0) scale(1);
        }
    }
`;
document.head.appendChild(doppelgangerStyles);

console.log('[DoppelgangerSystem] Loaded');

