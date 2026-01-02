// ==========================================
// 적 AI 시스템 - Enemy Intent Decision
// ==========================================

// 모든 적의 의도 결정
function decideEnemyIntent() {
    // 모든 적의 의도 결정
    gameState.enemies.forEach(enemy => {
        if (enemy.hp > 0) {
            decideEnemyIntentForEnemy(enemy);
        }
    });
    
    // UI 업데이트
    updateEnemiesUI();
}

// 개별 적의 의도 결정
function decideEnemyIntentForEnemy(enemy) {
    let intent;
    
    // 턴 카운트 증가
    enemy.turnCount = (enemy.turnCount || 0) + 1;
    
    // ✅ onTurnStart 콜백 호출 (사신의 처형 준비 등 특수 로직)
    if (typeof enemy.onTurnStart === 'function') {
        enemy.onTurnStart(gameState);
        
        // onTurnStart에서 인텐트를 직접 설정한 경우 (처형 준비/처형 등)
        if (enemy.currentIntentData) {
            intent = enemy.currentIntentData;
            enemy.intent = intent.type;
            enemy.intentValue = intent.value || 0;
            enemy.intentHits = intent.hits || 1;
            enemy.intentBleed = intent.bleed || 0;
            enemy.intentIcon = intent.icon;
            enemy.intentName = intent.name || null; // 🏷️ 특수 공격 이름
            enemy.intentAnimationKey = intent.animationKey || null; // 🎬 애니메이션 키
            
            // 🔨 브레이크 시스템: breakRecipe가 있으면 설정
            if (typeof BreakSystem !== 'undefined') {
                BreakSystem.onIntentSelected(enemy, intent);
            }
            
            enemy.currentIntentData = null; // 사용 후 초기화
            return;
        }
    }
    
    // ✅ 도플갱어는 별도 시스템에서 처리
    if (enemy.isDoppelganger && typeof DoppelgangerSystem !== 'undefined') {
        DoppelgangerSystem.startTurn(enemy);
        return;
    }
    
    // ✅ 패턴 시스템 사용하는 몬스터 (고블린 킹 등)
    if (enemy.usePattern && enemy.pattern && enemy.pattern.length > 0) {
        // 패턴 인덱스 (0부터 시작)
        const patternIdx = enemy.patternIndex || 0;
        intent = enemy.pattern[patternIdx];
        
        console.log(`[Pattern] ${enemy.name} pattern ${patternIdx}: ${intent.type}`, intent);
        
        // 다음 패턴으로 인덱스 증가 (순환)
        enemy.patternIndex = (patternIdx + 1) % enemy.pattern.length;
        
        if (intent.name) {
            addLog(`${enemy.name}: "${intent.name}"`, 'warning');
        }
        
        if (intent.type === 'summon' && intent.summons) {
            enemy.intentSummons = [...intent.summons];
            console.log(`[Pattern] Summon list saved:`, enemy.intentSummons);
        }
        
        enemy.intent = intent.type;
        enemy.intentValue = intent.value || 0;
        enemy.intentHits = intent.hits || 1;
        enemy.intentBleed = intent.bleed || 0; // 출혈량
        enemy.intentIcon = intent.icon;
        enemy.intentName = intent.name || null; // 🏷️ 특수 공격 이름
        enemy.intentAnimationKey = intent.animationKey || null; // 🎬 애니메이션 키
        
        if (intent.type === 'attack' && enemy.attackBuff && enemy.attackBuff > 0) {
            enemy.intentValue += enemy.attackBuff;
            addLog(`${enemy.name} ATK buff +${enemy.attackBuff}`, 'buff');
            enemy.attackBuff = 0;
            
            if (typeof BuffSystem !== 'undefined') {
                BuffSystem.removeBuff(enemy, 'howl');
                BuffSystem.removeBuff(enemy, 'battleCry');
            }
        }
        
        // 🔨 브레이크 시스템: 패턴 인텐트에 breakRecipe가 있으면 설정
        if (typeof BreakSystem !== 'undefined') {
            BreakSystem.onIntentSelected(enemy, intent);
        }
        return;
    }
    
    const intents = enemy.intents;
    
    // ==========================================
    // 광신도 전용 AI
    // ==========================================
    if (enemy.isFanatic && !intent) {
        const frenzy = enemy.frenzyStacks || 0;
        const roll = Math.random() * 100;
        
        // 광기가 낮을 때 (0~2): 자해 우선
        if (frenzy < 3) {
            if (roll < 50) {
                // 50% 확률로 피의 의식 (자해)
                intent = intents.find(i => i.type === 'selfHarm');
                addLog(`🩸 ${enemy.name}: "피가 필요해..."`, 'enemy');
            } else if (roll < 80) {
                // 30% 확률로 일반 공격
                const attacks = intents.filter(i => i.type === 'attack');
                intent = attacks[Math.floor(Math.random() * attacks.length)];
            } else {
                // 20% 확률로 광기 폭발 (약한 데미지)
                intent = intents.find(i => i.type === 'frenzyAttack');
                addLog(`💀 ${enemy.name}: "이 정도론 부족해..."`, 'enemy');
            }
        }
        // 광기가 중간일 때 (3~5): 균형잡힌 선택
        else if (frenzy <= 5) {
            if (roll < 30) {
                intent = intents.find(i => i.type === 'selfHarm');
                addLog(`🩸 ${enemy.name}: "더... 더 많은 피를!"`, 'enemy');
            } else if (roll < 60) {
                const attacks = intents.filter(i => i.type === 'attack');
                intent = attacks[Math.floor(Math.random() * attacks.length)];
            } else {
                intent = intents.find(i => i.type === 'frenzyAttack');
                addLog(`🔥 ${enemy.name}: "느껴지는가? 이 광기를!"`, 'enemy');
            }
        }
        // 광기가 높을 때 (6+): 광기 폭발 우선
        else {
            if (roll < 60) {
                intent = intents.find(i => i.type === 'frenzyAttack');
                addLog(`💀 ${enemy.name}: "모든 것을 태워버리겠다!!"`, 'danger');
            } else if (roll < 85) {
                const attacks = intents.filter(i => i.type === 'attack');
                intent = attacks[Math.floor(Math.random() * attacks.length)];
            } else {
                intent = intents.find(i => i.type === 'selfHarm');
            }
        }
        
        console.log(`[Fanatic AI] 광기: ${frenzy}, 선택: ${intent?.type}`);
    }
    
    if (enemy.blindEveryNTurns > 0 && enemy.blindIntent) {
        const shouldBlind = enemy.turnCount === 1 || 
                           (enemy.turnCount > 1 && (enemy.turnCount - 1) % enemy.blindEveryNTurns === 0);
        
        if (shouldBlind) {
            intent = enemy.blindIntent;
            addLog(`${enemy.name} prepares blind attack!`, 'warning');
        }
    }
    
    // ✅ 쿨타임 감소 (턴 시작 시)
    if (!enemy.intentCooldowns) {
        enemy.intentCooldowns = {};
    }
    Object.keys(enemy.intentCooldowns).forEach(key => {
        if (enemy.intentCooldowns[key] > 0) {
            enemy.intentCooldowns[key]--;
        }
    });
    
    if (!intent) {
        // intents 배열이 없거나 비어있는 경우 기본 공격 인텐트 생성
        if (!intents || intents.length === 0) {
            console.warn(`[EnemyAI] ${enemy.name}의 intents가 비어있습니다. 기본 공격 사용.`);
            intent = { type: 'attack', value: 5, hits: 1 };
        } else {
            // ✅ 조건(condition)과 쿨타임을 만족하는 인텐트만 필터링
            let validIntents = intents.filter(i => {
                if (i.type === 'blind') return false; // blind는 별도 처리
                
                // 🚫 첫 턴에는 브레이크 가능한 필살기 사용 금지
                if (i.breakRecipe && enemy.turnCount === 1) {
                    console.log(`[EnemyAI] ${enemy.name}: "${i.name || '필살기'}" 첫 턴 사용 불가`);
                    return false;
                }
                
                // 🔥 쿨타임 체크: breakRecipe가 있는 인텐트는 쿨타임 적용
                if (i.breakRecipe && i.name) {
                    const cooldownKey = i.name;
                    const currentCooldown = enemy.intentCooldowns[cooldownKey] || 0;
                    if (currentCooldown > 0) {
                        console.log(`[EnemyAI] ${enemy.name}: "${i.name}" 쿨타임 ${currentCooldown}턴 남음`);
                        return false;
                    }
                }
                
                // 조건 함수 체크
                if (typeof i.condition === 'function') {
                    return i.condition(enemy, gameState);
                }
                return true;
            });
            
            if (validIntents.length === 0) {
                // 조건을 만족하는 인텐트가 없으면 공격 인텐트만 선택 (쿨타임 없는 것만)
                validIntents = intents.filter(i => i.type === 'attack' && !i.breakRecipe);
                if (validIntents.length === 0) {
                    // 그래도 없으면 아무 공격이나
                    validIntents = intents.filter(i => i.type === 'attack');
                }
            }
            
            if (validIntents.length > 0) {
                // ✅ weight 기반 가중치 랜덤 선택
                const hasWeights = validIntents.some(i => i.weight);
                if (hasWeights) {
                    const totalWeight = validIntents.reduce((sum, i) => sum + (i.weight || 10), 0);
                    let random = Math.random() * totalWeight;
                    for (const i of validIntents) {
                        random -= (i.weight || 10);
                        if (random <= 0) {
                            intent = i;
                            break;
                        }
                    }
                    if (!intent) intent = validIntents[0];
                } else {
                    // weight 없으면 균등 랜덤
                    intent = validIntents[Math.floor(Math.random() * validIntents.length)];
                }
            } else {
                intent = intents[0]; // 첫 번째 인텐트 사용 (폴백)
            }
        }
    }
    
    // ✅ 선택된 인텐트가 브레이크 가능하면 쿨타임 설정
    if (intent && intent.breakRecipe && intent.name) {
        const cooldownKey = intent.name;
        const cooldownTurns = intent.cooldown || 2; // 기본 쿨타임 2턴
        enemy.intentCooldowns[cooldownKey] = cooldownTurns;
        console.log(`[EnemyAI] ${enemy.name}: "${intent.name}" 사용! 쿨타임 ${cooldownTurns}턴 설정`);
    }
    
    // 인텐트가 여전히 없으면 기본값 설정
    if (!intent) {
        console.error(`[EnemyAI] ${enemy.name}의 인텐트를 결정할 수 없습니다. 기본 공격 사용.`);
        intent = { type: 'attack', value: 5, hits: 1 };
    }
    
    enemy.intent = intent.type;
    enemy.intentValue = intent.value || 0;
    enemy.intentHits = intent.hits || 1;
    enemy.intentBleed = intent.bleed || 0;
    enemy.intentName = intent.name || null; // 🏷️ 특수 공격 이름
    enemy.intentIcon = intent.icon || null;
    enemy.intentAnimationKey = intent.animationKey || null; // 🎬 애니메이션 키
    
    // 광신도: selfHarm 인텐트의 attackBonus 저장
    if (intent.type === 'selfHarm') {
        enemy.intentAttackBonus = intent.attackBonus || 2;
    }
    
    // 광신도: 광기 폭발 공격일 경우 아이콘 저장
    if (intent.type === 'frenzyAttack') {
        enemy.intentIcon = intent.icon || '💀';
    }
    
    // 광신도: 일반 공격에도 광기 보너스 적용
    if (intent.type === 'attack' && enemy.isFanatic && enemy.frenzyStacks > 0) {
        enemy.intentValue += enemy.frenzyStacks;
        console.log(`[Fanatic] 광기 보너스 +${enemy.frenzyStacks} 적용 (총 ${enemy.intentValue})`);
    }
    
    // 분노의 골렘: 공격에 분노 보너스 적용
    if (intent.type === 'attack' && enemy.isRageGolem && enemy.rageStacks > 0) {
        const rageBonus = Math.floor(enemy.rageStacks / 2);
        enemy.intentValue += rageBonus;
        console.log(`[RageGolem] 분노 보너스 +${rageBonus} 적용 (총 ${enemy.intentValue})`);
    }
    
    if (intent.type === 'attack' && enemy.attackBuff && enemy.attackBuff > 0) {
        enemy.intentValue += enemy.attackBuff;
        addLog(`${enemy.name} ATK buff +${enemy.attackBuff}`, 'buff');
        enemy.attackBuff = 0;
        
        if (typeof BuffSystem !== 'undefined') {
            BuffSystem.removeBuff(enemy, 'howl');
            BuffSystem.removeBuff(enemy, 'battleCry');
        }
    }
    
    // 🔨 브레이크 시스템: 인텐트에 breakRecipe가 있으면 설정
    if (typeof BreakSystem !== 'undefined') {
        BreakSystem.onIntentSelected(enemy, intent);
    }
}
