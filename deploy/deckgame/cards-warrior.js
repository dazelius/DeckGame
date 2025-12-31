// ==========================================
// 전사 전용 카드
// 브레이브 시스템 활용
// ==========================================

// 카드 데이터베이스에 추가
if (typeof cardDatabase !== 'undefined') {
    
    // ==========================================
    // 브레이브 카드 (에너지 당겨쓰기)
    // ==========================================
    
    // 용기의 외침 - 브레이브 1 획득
    cardDatabase.braveCry = {
        id: 'braveCry',
        name: '용기의 외침',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 0,
        icon: '📣',
        description: '<span class="buff">브레이브</span> 1 획득.<br>(다음 턴 에너지 -1)',
        warriorOnly: true,
        effect: (state) => {
            if (typeof BraveSystem !== 'undefined' && BraveSystem.isActive()) {
                BraveSystem.useBrave(1);
            } else {
                // 브레이브 시스템 없으면 그냥 에너지 +1
                state.player.energy += 1;
                addLog('에너지 +1!', 'buff');
            }
        }
    };
    
    // 돌격 준비 - 브레이브 2 획득 + 방어
    cardDatabase.chargeUp = {
        id: 'chargeUp',
        name: '돌격 준비',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '🛡️⚡',
        description: '<span class="buff">브레이브</span> 2 획득.<br><span class="block-val">8</span> 방어도.',
        warriorOnly: true,
        effect: (state) => {
            if (typeof BraveSystem !== 'undefined' && BraveSystem.isActive()) {
                BraveSystem.useBrave(2);
            } else {
                state.player.energy += 2;
            }
            
            if (typeof ShieldSystem !== 'undefined') {
                ShieldSystem.gainBlock(8);
            } else {
                state.player.block = (state.player.block || 0) + 8;
            }
            
            addLog('돌격 준비! 브레이브 +2, 방어 +8', 'buff');
        }
    };
    
    // ==========================================
    // 강력한 공격 카드
    // ==========================================
    
    // 분쇄 - 방어 무시 공격
    cardDatabase.crush = {
        id: 'crush',
        name: '분쇄',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 2,
        icon: '💥',
        description: '<span class="damage">12</span> 데미지.<br>적 방어도 무시.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#ff6b35', size: 180 });
                EffectSystem.screenShake(10, 250);
                // 방어도 무시 직접 HP 데미지
                const damage = 12;
                state.enemy.hp -= damage;
                updateUI();
            });
            
            addLog('분쇄! 12 데미지! (방어 무시)', 'damage');
        }
    };
    
    // 전력 질주 - 브레이브 소모 시 강화
    cardDatabase.allOutAttack = {
        id: 'allOutAttack',
        name: '전력 질주',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 2,
        icon: '⚔️💨',
        description: '<span class="damage">12</span> 데미지.<br>브레이브 빚이 있으면 <span class="damage">+8</span> 데미지.',
        warriorOnly: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            let damage = 12;
            let bonus = false;
            
            if (typeof BraveSystem !== 'undefined' && BraveSystem.braveDebt > 0) {
                damage += 8;
                bonus = true;
            }
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.slash(enemyEl, { color: bonus ? '#fbbf24' : '#ff4444', count: 2 });
                if (bonus) {
                    EffectSystem.screenShake(12, 300);
                }
                dealDamage(state.enemy, damage);
            });
            
            addLog(`전력 질주! ${damage} 데미지!${bonus ? ' (브레이브 보너스!)' : ''}`, 'damage');
        }
    };
    
    // 방패 돌진 - 방어 + 공격
    cardDatabase.shieldBash = {
        id: 'shieldBash',
        name: '방패 돌진',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '<img src="shieldDash.png" alt="Shield Bash" class="card-icon-img">',
        description: '<span class="block-val">5</span> 방어도.<br><span class="damage">5</span> 데미지.',
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 방어 먼저
            if (typeof ShieldSystem !== 'undefined') {
                ShieldSystem.gainBlock(5);
            } else {
                state.player.block = (state.player.block || 0) + 5;
            }
            
            // 공격
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#3b82f6', size: 120 });
                dealDamage(state.enemy, 5);
            });
            
            addLog('방패 돌진! 방어 +5, 5 데미지!', 'buff');
        }
    };
    
    // 전사의 일격 - 현재 방어도만큼 추가 데미지
    cardDatabase.warriorStrike = {
        id: 'warriorStrike',
        name: '전사의 일격',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '⚔️🛡️',
        description: '<span class="damage">8</span> 데미지.<br>현재 방어도만큼 추가 데미지.',
        warriorOnly: true,
        getDynamicDescription() {
            const block = gameState?.player?.block || 0;
            return `<span class="damage">8</span> 데미지.<br>현재 방어도(${block})만큼 추가 데미지.`;
        },
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            const block = state.player.block || 0;
            const totalDamage = 8 + block;
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#fbbf24', size: 200 });
                EffectSystem.screenShake(15, 350);
                dealDamage(state.enemy, totalDamage);
            });
            
            addLog(`전사의 일격! ${totalDamage} 데미지! (방어도 보너스: +${block})`, 'damage');
        }
    };
    
    // ==========================================
    // 방어 카드
    // ==========================================
    
    // 철벽 - 고방어
    cardDatabase.ironWall = {
        id: 'ironWall',
        name: '철벽',
        type: CardType.SKILL,
        rarity: Rarity.COMMON,
        cost: 2,
        icon: '🏰',
        description: '<span class="block-val">15</span> 방어도.',
        effect: (state) => {
            if (typeof ShieldSystem !== 'undefined') {
                ShieldSystem.gainBlock(15);
            } else {
                state.player.block = (state.player.block || 0) + 15;
            }
            
            addLog('철벽! 방어 +15', 'buff');
        }
    };
    
    // 반격 태세 - 방어 + 반격
    cardDatabase.counterStance = {
        id: 'counterStance',
        name: '반격 태세',
        type: CardType.SKILL,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '🔄🛡️',
        description: '<span class="block-val">6</span> 방어도.<br>이번 턴 피격 시 <span class="damage">4</span> 반격.',
        warriorOnly: true,
        effect: (state) => {
            if (typeof ShieldSystem !== 'undefined') {
                ShieldSystem.gainBlock(6);
            } else {
                state.player.block = (state.player.block || 0) + 6;
            }
            
            // 반격 상태 부여
            state.player.counterAttack = (state.player.counterAttack || 0) + 4;
            
            addLog('반격 태세! 방어 +6, 반격 대기', 'buff');
        }
    };
    
    // ==========================================
    // 파워 카드
    // ==========================================
    
    // 전투 본능 - 턴마다 브레이브 자동 획득
    cardDatabase.battleInstinct = {
        id: 'battleInstinct',
        name: '전투 본능',
        type: CardType.POWER,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '🔥⚔️',
        description: '매 턴 시작 시 <span class="buff">브레이브</span> 1 자동 획득.',
        warriorOnly: true,
        effect: (state) => {
            state.player.battleInstinct = true;
            
            const playerEl = document.getElementById('player');
            if (playerEl) {
                EffectSystem.powerUp(playerEl, { color: '#fbbf24' });
            }
            
            addLog('전투 본능 활성화! 매 턴 브레이브 +1', 'buff');
        }
    };
    
    // 불굴의 의지 - 방어도 유지
    cardDatabase.unwaveringWill = {
        id: 'unwaveringWill',
        name: '불굴의 의지',
        type: CardType.POWER,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '💪',
        description: '턴 종료 시 방어도가 사라지지 않습니다.',
        warriorOnly: true,
        effect: (state) => {
            state.player.retainBlock = true;
            
            const playerEl = document.getElementById('player');
            if (playerEl) {
                EffectSystem.powerUp(playerEl, { color: '#3b82f6' });
            }
            
            addLog('불굴의 의지! 방어도가 유지됩니다', 'buff');
        }
    };
    
    // 전사의 긍지 - 공격력 증가
    cardDatabase.warriorPride = {
        id: 'warriorPride',
        name: '전사의 긍지',
        type: CardType.POWER,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '👑',
        description: '공격 카드의 데미지 +2.',
        warriorOnly: true,
        effect: (state) => {
            state.player.attackBonus = (state.player.attackBonus || 0) + 2;
            
            const playerEl = document.getElementById('player');
            if (playerEl) {
                EffectSystem.powerUp(playerEl, { color: '#ef4444' });
            }
            
            addLog('전사의 긍지! 공격 데미지 +2', 'buff');
        }
    };
    
    // ==========================================
    // 특수 카드
    // ==========================================
    
    // 최후의 일격 - HP가 낮을수록 강함
    cardDatabase.lastStand = {
        id: 'lastStand',
        name: '최후의 일격',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 2,
        icon: '⚡⚔️',
        description: '<span class="damage">10</span> 데미지.<br>잃은 HP 5당 +3 데미지.',
        warriorOnly: true,
        getDynamicDescription() {
            const lostHp = (gameState?.player?.maxHp || 80) - (gameState?.player?.hp || 80);
            const bonus = Math.floor(lostHp / 5) * 3;
            return `<span class="damage">10</span> 데미지.<br>잃은 HP(${lostHp}) 5당 +3 데미지.<br>현재 보너스: <span class="damage">+${bonus}</span>`;
        },
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            const lostHp = state.player.maxHp - state.player.hp;
            const bonus = Math.floor(lostHp / 5) * 3;
            const totalDamage = 10 + bonus;
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#ef4444', size: 250 });
                EffectSystem.screenShake(20, 400);
                dealDamage(state.enemy, totalDamage);
            });
            
            addLog(`최후의 일격! ${totalDamage} 데미지! (잃은 HP 보너스: +${bonus})`, 'damage');
        }
    };
    
    // 브레이브 버스트 - 브레이브 빚 전부 소모하여 대미지
    cardDatabase.braveBurst = {
        id: 'braveBurst',
        name: '브레이브 버스트',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 0,
        icon: '💥⚡',
        description: '브레이브 빚 1당 <span class="damage">8</span> 데미지.<br>빚을 0으로 만듭니다.',
        warriorOnly: true,
        getDynamicDescription() {
            const debt = (typeof BraveSystem !== 'undefined') ? BraveSystem.braveDebt : 0;
            const damage = debt * 8;
            return `브레이브 빚(${debt}) 1당 <span class="damage">8</span> 데미지.<br>현재: <span class="damage">${damage}</span> 데미지`;
        },
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            let debt = 0;
            if (typeof BraveSystem !== 'undefined') {
                debt = BraveSystem.braveDebt;
                BraveSystem.braveDebt = 0;
                BraveSystem.updateBraveUI();
            }
            
            const totalDamage = debt * 8;
            
            if (totalDamage > 0) {
                EffectSystem.playerAttack(playerEl, enemyEl, () => {
                    EffectSystem.impact(enemyEl, { color: '#fbbf24', size: 300 });
                    EffectSystem.screenShake(25, 500);
                    dealDamage(state.enemy, totalDamage);
                });
                
                addLog(`브레이브 버스트! ${totalDamage} 데미지! (빚 ${debt} 소모)`, 'damage');
            } else {
                addLog('브레이브 빚이 없습니다!', 'info');
            }
        }
    };
    
    // ==========================================
    // 성장형 카드
    // ==========================================
    
    // 몰아치기 - 개별 성장, 3회 사용 시 진화
    cardDatabase.momentum = {
        id: 'momentum',
        name: '몰아치기',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '<img src="fury.png" alt="Momentum" class="card-icon-img">',
        description: '<span class="damage">5</span> 데미지.<br>사용할 때마다 +2. (3회 시 진화)',
        warriorOnly: true,
        // 카드 생성 시 성장 카운터 초기화
        onAdd: (card) => {
            card.growthCount = card.growthCount || 0;
        },
        getDynamicDescription(card) {
            const growth = card?.growthCount || 0;
            const damage = 5 + (growth * 2);
            const remaining = 3 - growth;
            if (remaining <= 0) {
                return `<span class="damage">${damage}</span> 데미지.<br>⚡ <span class="buff">진화 준비 완료!</span>`;
            }
            return `<span class="damage">${damage}</span> 데미지.<br>진화까지 ${remaining}회 남음`;
        },
        effect: (state, card) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 개별 카드 성장 카운터
            card.growthCount = (card.growthCount || 0);
            const damage = 5 + (card.growthCount * 2);
            card.growthCount++;
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#3b82f6', size: 80 + damage * 3 });
                dealDamage(state.enemy, damage);
            });
            
            addLog(`몰아치기! ${damage} 데미지! (성장: ${card.growthCount}/3)`, 'damage');
            
            // 3회 달성 시 진화
            if (card.growthCount >= 3) {
                setTimeout(() => {
                    transformToStormStrike(state, card);
                }, 500);
            }
        }
    };
    
    // 폭풍의 일격 - 몰아치기의 진화형
    cardDatabase.stormStrike = {
        id: 'stormStrike',
        name: '폭풍의 일격',
        type: CardType.ATTACK,
        rarity: Rarity.RARE,
        cost: 1,
        icon: '<img src="fury_real.png" alt="Storm Strike" class="card-icon-img">',
        description: '<span class="damage">18</span> 데미지.<br><span class="debuff">소멸</span>.',
        exhaust: true,
        warriorOnly: true,
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#fbbf24', size: 250 });
                EffectSystem.screenShake(20, 400);
                // 번개 이펙트
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        EffectSystem.impact(enemyEl, { color: '#60a5fa', size: 150 });
                    }, i * 100);
                }
                dealDamage(state.enemy, 18);
            });
            
            addLog('⛈️ 폭풍의 일격! 18 데미지!', 'damage');
        }
    };
    
    // 몰아치기 → 폭풍의 일격 변환 함수
    function transformToStormStrike(state, oldCard) {
        // 버린 카드 더미에서 해당 카드 찾아서 변환
        const discardIndex = state.discardPile.findIndex(c => c === oldCard || c.instanceId === oldCard.instanceId);
        
        if (discardIndex !== -1) {
            // 새 폭풍의 일격 카드 생성
            const stormCard = { 
                ...cardDatabase.stormStrike,
                instanceId: 'storm_' + Date.now() + '_' + Math.random()
            };
            state.discardPile[discardIndex] = stormCard;
            
            // 간단한 진화 연출
            showQuickEvolution();
            addLog('⚡ 몰아치기가 폭풍의 일격으로 진화했다!', 'buff');
        }
    }
    
    // 빠른 진화 이펙트 (카드 연출 포함)
    function showQuickEvolution() {
        // 사운드
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('powerup');
        }
        
        // 스타일 추가
        if (!document.getElementById('quick-evolution-style')) {
            const style = document.createElement('style');
            style.id = 'quick-evolution-style';
            style.textContent = `
                @keyframes quickFlash {
                    0% { opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
                @keyframes quickText {
                    0% { transform: translate(-50%, -80%) scale(0.5); opacity: 0; }
                    25% { transform: translate(-50%, -80%) scale(1.1); opacity: 1; }
                    70% { transform: translate(-50%, -80%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -80%) scale(1); opacity: 0; }
                }
                @keyframes cardAppear {
                    0% { transform: translate(-50%, -50%) scale(0) rotateY(180deg); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1) rotateY(0deg); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1) rotateY(0deg); opacity: 1; }
                }
                @keyframes cardToDiscard {
                    0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
                    20% { transform: translate(-50%, -50%) scale(1.05) rotate(-5deg); opacity: 1; }
                    100% { transform: translate(var(--discard-x), var(--discard-y)) scale(0.25) rotate(15deg); opacity: 0.7; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 오버레이
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(0,0,0,0.5) 70%);
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            animation: quickFlash 1.4s ease-out forwards;
        `;
        
        // EVOLUTION 텍스트
        const text = document.createElement('div');
        text.textContent = '⚡ EVOLUTION';
        text.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -80%) scale(0.5);
            font-size: 2rem;
            font-weight: bold;
            font-family: 'Cinzel', serif;
            color: #fbbf24;
            text-shadow: 0 0 20px #f59e0b, 0 0 40px #d97706;
            letter-spacing: 8px;
            opacity: 0;
            animation: quickText 1.2s ease-out forwards;
        `;
        overlay.appendChild(text);
        
        // 폭풍의 일격 카드 (기존 카드 디자인 사용)
        let card;
        if (typeof CardAnimation !== 'undefined' && CardAnimation.createDOMCard) {
            card = CardAnimation.createDOMCard({
                cost: 1,
                cardType: 'attack',
                icon: '<img src="fury_real.png" alt="Storm Strike" class="card-icon-img">',
                name: '폭풍의 일격'
            });
        } else {
            // 폴백: 간단한 카드
            card = document.createElement('div');
            card.className = 'card attack';
            card.innerHTML = `
                <div class="card-cost">1</div>
                <div class="card-header">
                    <div class="card-name">폭풍의 일격</div>
                    <div class="card-type">공격</div>
                </div>
                <div class="card-image"><img src="fury_real.png" class="card-icon-img"></div>
            `;
        }
        
        card.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            box-shadow: 0 0 30px #fbbf24, 0 0 60px #f59e0b;
            transform: translate(-50%, -50%) scale(0) rotateY(180deg);
            opacity: 0;
            animation: cardAppear 0.5s 0.1s ease-out forwards;
            pointer-events: none;
        `;
        overlay.appendChild(card);
        
        document.body.appendChild(overlay);
        
        // 카드가 버린 카드 더미로 이동
        setTimeout(() => {
            const discardEl = document.getElementById('discard-pile');
            if (discardEl) {
                const discardRect = discardEl.getBoundingClientRect();
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                
                const deltaX = discardRect.left + discardRect.width / 2 - centerX;
                const deltaY = discardRect.top + discardRect.height / 2 - centerY;
                
                card.style.setProperty('--discard-x', `calc(-50% + ${deltaX}px)`);
                card.style.setProperty('--discard-y', `calc(-50% + ${deltaY}px)`);
                // 더 부드럽게 "싹" 들어가는 느낌
                card.style.animation = 'cardToDiscard 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                
                // 버린 카드 더미 플래시 (도착할 때)
                setTimeout(() => {
                    discardEl.style.boxShadow = '0 0 30px #fbbf24';
                    setTimeout(() => discardEl.style.boxShadow = '', 400);
                }, 600);
            }
        }, 600);
        
        // 정리 (애니메이션 끝난 후)
        setTimeout(() => overlay.remove(), 1400);
    }
    
    // ==========================================
    // 연환격 - 공격 + 최근 버린 카드 회수
    // ==========================================
    cardDatabase.chainStrike = {
        id: 'chainStrike',
        name: '연환격',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '<img src="chainAttack.png" alt="Chain Strike" class="card-icon-img">',
        description: '<span class="damage">5</span> 데미지.<br>가장 최근 버린 카드 1장을 손패로 가져옵니다.',
        warriorOnly: true,
        effect: (state, card) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            // 공격
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#22c55e', size: 120 });
                dealDamage(state.enemy, 5);
            });
            
            addLog('연환격! 5 데미지!', 'damage');
            
            // 가장 최근 버린 카드 회수 (자기 자신 제외)
            // 딜레이를 늘려서 연환격이 discardPile에 추가된 후 실행
            setTimeout(() => {
                // 배열 끝에서부터 역순으로 탐색하여 "자기 자신이 아닌 첫 번째 카드" 찾기
                let recentCard = null;
                for (let i = state.discardPile.length - 1; i >= 0; i--) {
                    const c = state.discardPile[i];
                    // 자기 자신(연환격) 스킵
                    if (c === card) continue;
                    if (c.instanceId && card.instanceId && c.instanceId === card.instanceId) continue;
                    // 찾았다!
                    recentCard = c;
                    break;
                }
                
                if (recentCard) {
                    // 버린 카드 더미에서 제거
                    const idx = state.discardPile.indexOf(recentCard);
                    if (idx !== -1) {
                        state.discardPile.splice(idx, 1);
                    }
                    
                    // 손패에 추가
                    state.hand.push(recentCard);
                    
                    // 직접 카드 회수 애니메이션
                    showChainRetrieveAnimation(recentCard, () => {
                        if (typeof renderHand === 'function') renderHand();
                        if (typeof updateUI === 'function') updateUI();
                    });
                    
                    addLog(`🔗 ${recentCard.name}을(를) 손패로 회수했다!`, 'buff');
                } else {
                    addLog('회수할 카드가 없습니다.', 'info');
                }
            }, 500);
        }
    };
    
    // 연환격+ (강화 버전)
    cardDatabase.chainStrikeP = {
        id: 'chainStrikeP',
        name: '연환격+',
        type: CardType.ATTACK,
        rarity: Rarity.COMMON,
        cost: 1,
        icon: '<img src="chainAttack.png" alt="Chain Strike" class="card-icon-img">',
        description: '<span class="damage">7</span> 데미지.<br>가장 최근 버린 카드 1장을 손패로 가져옵니다.',
        warriorOnly: true,
        upgraded: true,
        effect: (state, card) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            
            EffectSystem.playerAttack(playerEl, enemyEl, () => {
                EffectSystem.impact(enemyEl, { color: '#22c55e', size: 140 });
                dealDamage(state.enemy, 7);
            });
            
            addLog('연환격+! 7 데미지!', 'damage');
            
            // 딜레이를 늘려서 연환격이 discardPile에 추가된 후 실행
            setTimeout(() => {
                // 배열 끝에서부터 역순으로 탐색하여 "자기 자신이 아닌 첫 번째 카드" 찾기
                let recentCard = null;
                for (let i = state.discardPile.length - 1; i >= 0; i--) {
                    const c = state.discardPile[i];
                    // 자기 자신(연환격) 스킵
                    if (c === card) continue;
                    if (c.instanceId && card.instanceId && c.instanceId === card.instanceId) continue;
                    // 찾았다!
                    recentCard = c;
                    break;
                }
                
                if (recentCard) {
                    const idx = state.discardPile.indexOf(recentCard);
                    if (idx !== -1) {
                        state.discardPile.splice(idx, 1);
                    }
                    
                    state.hand.push(recentCard);
                    
                    // 직접 카드 회수 애니메이션
                    showChainRetrieveAnimation(recentCard, () => {
                        if (typeof renderHand === 'function') renderHand();
                        if (typeof updateUI === 'function') updateUI();
                    });
                    
                    addLog(`🔗 ${recentCard.name}을(를) 손패로 회수했다!`, 'buff');
                } else {
                    addLog('회수할 카드가 없습니다.', 'info');
                }
            }, 500);
        }
    };
    
    // 연환격 카드 회수 애니메이션 (기존 카드 디자인 사용)
    function showChainRetrieveAnimation(retrievedCard, onComplete) {
        const discardEl = document.getElementById('discard-pile');
        const handEl = document.getElementById('hand');
        
        if (!discardEl || !handEl) {
            if (onComplete) onComplete();
            return;
        }
        
        const discardRect = discardEl.getBoundingClientRect();
        const handRect = handEl.getBoundingClientRect();
        
        // 버린 카드 더미 플래시
        discardEl.style.boxShadow = '0 0 25px #22c55e';
        
        // 기존 카드 디자인으로 생성
        let flyingCard;
        if (typeof CardAnimation !== 'undefined' && CardAnimation.createDOMCard) {
            flyingCard = CardAnimation.createDOMCard({
                cost: retrievedCard.cost || 1,
                cardType: retrievedCard.type || 'attack',
                icon: retrievedCard.icon || '🃏',
                name: retrievedCard.name || '카드'
            });
        } else {
            // 폴백
            flyingCard = document.createElement('div');
            flyingCard.className = `card ${retrievedCard.type || 'attack'}`;
            flyingCard.innerHTML = `
                <div class="card-cost">${retrievedCard.cost || 1}</div>
                <div class="card-header">
                    <div class="card-name">${retrievedCard.name || '카드'}</div>
                </div>
                <div class="card-image">${retrievedCard.icon || '🃏'}</div>
            `;
        }
        
        flyingCard.style.cssText = `
            position: fixed;
            left: ${discardRect.left + discardRect.width / 2}px;
            top: ${discardRect.top + discardRect.height / 2}px;
            box-shadow: 0 0 20px #22c55e, 0 0 40px rgba(34, 197, 94, 0.5);
            transform: translate(-50%, -50%) scale(0.2) rotate(-10deg);
            opacity: 0;
            z-index: 10000;
            pointer-events: none;
            transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        `;
        
        document.body.appendChild(flyingCard);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            flyingCard.style.transform = 'translate(-50%, -50%) scale(0.7) rotate(0deg)';
            flyingCard.style.opacity = '1';
            
            // 손패로 이동
            setTimeout(() => {
                flyingCard.style.left = `${handRect.left + handRect.width / 2}px`;
                flyingCard.style.top = `${handRect.top + handRect.height / 2}px`;
                flyingCard.style.transform = 'translate(-50%, -50%) scale(0.6) rotate(5deg)';
            }, 200);
        });
        
        // 완료
        setTimeout(() => {
            flyingCard.style.opacity = '0';
            flyingCard.style.transform = 'translate(-50%, -50%) scale(0.8)';
            discardEl.style.boxShadow = '';
            
            setTimeout(() => {
                flyingCard.remove();
                if (onComplete) onComplete();
            }, 200);
        }, 600);
    }
    
    console.log('[WarriorCards] 전사 카드 17장 등록 완료');
}

