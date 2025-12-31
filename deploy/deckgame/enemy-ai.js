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
    
    if (!intent) {
        const normalIntents = intents.filter(i => i.type !== 'blind');
        intent = normalIntents[Math.floor(Math.random() * normalIntents.length)];
    }
    
    enemy.intent = intent.type;
    enemy.intentValue = intent.value;
    enemy.intentHits = intent.hits || 1;
    enemy.intentBleed = intent.bleed || 0;
    
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
