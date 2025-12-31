// ==========================================
// Shadow Deck - 역습 카드
// 도적 덱 전용 - 공격 의도 적에게 추가 효과
// ==========================================

const CounterStrikeCards = {
    // ==========================================
    // 역습 - 공격 의도가 있는 적에게 추가 대미지 + 취약
    // ==========================================
    counterStrike: {
        id: 'counterStrike',
        name: '역습',
        type: CardType.ATTACK,
        rarity: Rarity.UNCOMMON,
        cost: 1,
        icon: '⚔',
        get description() {
            return `<span class="damage">6</span> 데미지.<br>적이 <span class="intent-attack">공격 의도</span>라면 <span class="damage">12</span> 데미지 + <span class="debuff">취약 1</span>.`;
        },
        effect: (state) => {
            const playerEl = document.getElementById('player');
            const enemyEl = typeof getSelectedEnemyElement === 'function' ? getSelectedEnemyElement() : document.getElementById('enemy');
            const enemy = state.enemy;
            
            // 적이 공격 의도인지 확인
            const hasAttackIntent = enemy && enemy.intent === 'attack';
            
            // 데미지 결정
            const damage = hasAttackIntent ? 12 : 6;
            
            // 플레이어 돌진 애니메이션
            if (typeof EffectSystem !== 'undefined') {
                EffectSystem.playerAttack(playerEl, enemyEl, () => {
                    // 슬래시 이펙트 - 역습 성공시 더 강렬하게
                    if (hasAttackIntent) {
                        // 강화된 공격 이펙트
                        EffectSystem.slash(enemyEl, { color: '#ff4444', count: 2 });
                        
                        // 추가 스파크 이펙트
                        if (typeof VFX !== 'undefined') {
                            const rect = enemyEl.getBoundingClientRect();
                            const cx = rect.left + rect.width / 2;
                            const cy = rect.top + rect.height / 2;
                            VFX.sparks(cx, cy, { color: '#ffaa00', count: 15, speed: 12 });
                        }
                    } else {
                        EffectSystem.slash(enemyEl, { color: '#ff4444', count: 1 });
                    }
                    
                    // 데미지 적용
                    if (typeof dealDamage === 'function') {
                        dealDamage(enemy, damage);
                    } else {
                        enemy.hp -= damage;
                    }
                    
                    // 공격 의도였다면 취약 부여
                    if (hasAttackIntent) {
                        if (!enemy.vulnerable) enemy.vulnerable = 0;
                        enemy.vulnerable += 1;
                        
                        // 취약 이펙트
                        if (typeof showVulnerableEffect === 'function') {
                            showVulnerableEffect(enemyEl, 1);
                        }
                        
                        // 디버프 이펙트
                        if (typeof EffectSystem !== 'undefined') {
                            EffectSystem.debuff(enemyEl);
                        }
                        
                        addLog(`역습 성공! ${damage} 데미지 + 취약 1!`, 'damage');
                        
                        // 역습 성공 텍스트 팝업
                        CounterStrikeVFX.showCounterText(enemyEl);
                    } else {
                        addLog(`역습으로 ${damage} 데미지!`, 'damage');
                    }
                });
            } else {
                // EffectSystem 없을 경우 직접 처리
                if (typeof dealDamage === 'function') {
                    dealDamage(enemy, damage);
                } else {
                    enemy.hp -= damage;
                }
                
                if (hasAttackIntent) {
                    if (!enemy.vulnerable) enemy.vulnerable = 0;
                    enemy.vulnerable += 1;
                    addLog(`역습 성공! ${damage} 데미지 + 취약 1!`, 'damage');
                } else {
                    addLog(`역습으로 ${damage} 데미지!`, 'damage');
                }
            }
            
            if (typeof updateUI === 'function') updateUI();
            if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
        }
    }
};

// ==========================================
// 역습 VFX 시스템
// ==========================================
const CounterStrikeVFX = {
    // 역습 성공 텍스트 표시
    showCounterText(targetEl) {
        if (!targetEl) return;
        
        const rect = targetEl.getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = 'counter-strike-popup';
        popup.textContent = 'COUNTER!';
        popup.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top - 30}px;
            transform: translateX(-50%) translateY(0) scale(0.5);
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            font-weight: bold;
            color: #ffaa00;
            text-shadow: 
                0 0 10px #ff6600,
                0 0 20px #ff4400,
                2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
            animation: counterPopup 1s ease-out forwards;
        `;
        
        document.body.appendChild(popup);
        
        // 애니메이션 후 제거
        setTimeout(() => popup.remove(), 1000);
    },
    
    // 스타일 주입
    injectStyles() {
        if (document.getElementById('counter-strike-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'counter-strike-styles';
        style.textContent = `
            @keyframes counterPopup {
                0% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px) scale(0.5);
                }
                20% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(-10px) scale(1.2);
                }
                40% {
                    transform: translateX(-50%) translateY(0) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-40px) scale(0.8);
                }
            }
            
            /* 카드 설명용 스타일 */
            .intent-attack {
                color: #ef4444;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
};

// ==========================================
// 초기화
// ==========================================
function initCounterStrikeCards() {
    if (typeof cardDatabase !== 'undefined') {
        cardDatabase.counterStrike = CounterStrikeCards.counterStrike;
        console.log('[CounterStrike] 역습 카드 등록 완료');
    } else {
        console.warn('[CounterStrike] cardDatabase 없음, 지연 등록...');
        setTimeout(initCounterStrikeCards, 100);
    }
    
    // 스타일 주입
    CounterStrikeVFX.injectStyles();
}

// 글로벌 등록
window.CounterStrikeCards = CounterStrikeCards;
window.CounterStrikeVFX = CounterStrikeVFX;

// DOM 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounterStrikeCards);
} else {
    initCounterStrikeCards();
}

console.log('[CounterStrike] 역습 카드 로드됨');

