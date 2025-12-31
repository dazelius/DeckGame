// ==========================================
// Shadow Deck - 강화된 카드 데이터베이스 & 시스템
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
        description: '<span class="damage">14</span> 데미지를 줍니다.',
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#ff8844', size: 220 });
                EffectSystem.screenShake(15, 350);
                dealDamage(state.enemy, 14);
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
        icon: '💨',
        description: '<span class="block-val">5</span> 방어도.<br>카드 1장 드로우.',
        upgraded: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            
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
        icon: '💥',
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
                        glowColor: '#fbbf24',
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
        icon: '🔱',
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
        icon: '💎',
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
        // 기본 카드
        'strike': 'strikeP',
        'defend': 'defendP',
        'bash': 'bashP',
        'dodge': 'dodgeP',
        'battleOpening': 'battleOpeningP',
        // 도적 카드
        'dagger': 'daggerP',
        'shiv': 'shivP',
        'flurry': 'flurryP',
        'dirtyStrike': 'dirtyStrikeP',
        'plunder': 'plunderP',
        'finisher': 'finisherP',
        'concentratedStrike': 'concentratedStrikeP',
        // 마법사 카드
        'manaFocus': 'manaFocusPlus',
        'arcaneBolt': 'arcaneBoltPlus',
        'meditation': 'meditationPlus',
        'energyBolt': 'energyBoltPlus',
        'manaAmplify': 'manaAmplifyPlus',
        'timeWarp': 'timeWarpPlus',
        'manaRelease': 'manaReleasePlus',
        'unstableMana': 'unstableManaPlus',
        'manaExplosion': 'manaExplosionPlus'
    },
    
    // 강화 비용 (기본 50골드)
    getUpgradeCost(cardId) {
        const costMap = {
            // 기본 카드
            'strike': 30,
            'defend': 30,
            'bash': 50,
            'dodge': 40,
            'battleOpening': 60,
            // 도적 카드
            'dagger': 50,
            'shiv': 20,
            'flurry': 50,
            'dirtyStrike': 40,
            'plunder': 50,
            'finisher': 80,
            'concentratedStrike': 80,
            // 마법사 카드
            'manaFocus': 30,
            'arcaneBolt': 30,
            'meditation': 30,
            'energyBolt': 50,
            'manaAmplify': 60,
            'timeWarp': 60,
            'manaRelease': 50,
            'unstableMana': 40,
            'manaExplosion': 80
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

console.log('[Card Upgrade] 강화 카드 데이터베이스 & 시스템 로드됨');

