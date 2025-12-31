// ==========================================
// Status Effects System
// 상태이상 관리 시스템
// ==========================================

const StatusEffects = {
    // 플레이어에게 출혈 적용
    applyBleedToPlayer(amount, sourceName) {
        if (!gameState.player.bleed) {
            gameState.player.bleed = 0;
        }
        gameState.player.bleed += amount;
        
        addLog(`${sourceName}: Bleed ${amount}`, 'debuff');
        
        // 출혈 이펙트
        const playerEl = document.getElementById('player');
        if (playerEl) {
            const bleedEffect = document.createElement('div');
            bleedEffect.className = 'bleed-apply-effect';
            bleedEffect.innerHTML = `+${amount}`;
            bleedEffect.style.cssText = `
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.5rem;
                font-weight: bold;
                color: #dc2626;
                text-shadow: 0 0 10px #dc2626;
                animation: bleedApply 1s ease-out forwards;
                z-index: 100;
                pointer-events: none;
            `;
            playerEl.appendChild(bleedEffect);
            setTimeout(() => bleedEffect.remove(), 1000);
        }
        
        this.updatePlayerStatusUI();
    },

    // 출혈 데미지 처리 (턴 종료 시)
    processBleedDamage() {
        if (!gameState.player.bleed || gameState.player.bleed <= 0) return;
        
        const bleedDamage = gameState.player.bleed;
        
        // 출혈 이펙트
        const playerEl = document.getElementById('player');
        if (playerEl) {
            const effect = document.createElement('div');
            effect.className = 'bleed-damage-effect';
            effect.innerHTML = `-${bleedDamage}`;
            effect.style.cssText = `
                position: absolute;
                top: 40%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 1.8rem;
                font-weight: bold;
                color: #dc2626;
                text-shadow: 0 0 15px #dc2626;
                animation: bleedDamageAnim 1.2s ease-out forwards;
                z-index: 100;
                pointer-events: none;
            `;
            playerEl.appendChild(effect);
            setTimeout(() => effect.remove(), 1200);
            
            // 피 튀김 효과
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const blood = document.createElement('div');
                    blood.innerHTML = '💧';
                    blood.style.cssText = `
                        position: absolute;
                        top: ${40 + Math.random() * 20}%;
                        left: ${40 + Math.random() * 20}%;
                        font-size: ${0.8 + Math.random() * 0.5}rem;
                        color: #dc2626;
                        animation: bloodSplat 0.8s ease-out forwards;
                        z-index: 99;
                        pointer-events: none;
                        filter: hue-rotate(-10deg);
                    `;
                    playerEl.appendChild(blood);
                    setTimeout(() => blood.remove(), 800);
                }, i * 50);
            }
        }
        
        // 데미지 적용 (방어도 무시)
        gameState.player.hp -= bleedDamage;
        addLog(`Bleed! ${bleedDamage} dmg`, 'debuff');
        
        // 출혈 1 감소
        gameState.player.bleed = Math.max(0, gameState.player.bleed - 1);
        
        if (gameState.player.bleed > 0) {
            addLog(`Bleed: ${gameState.player.bleed} left`, 'debuff');
        } else {
            addLog(`Bleed removed`, 'buff');
        }
        
        this.updatePlayerStatusUI();
        updateUI();
    },

    // 플레이어 상태 UI 업데이트
    updatePlayerStatusUI() {
        const playerEl = document.getElementById('player');
        if (!playerEl) return;

        // 기존 디버프 아이콘 제거
        playerEl.querySelectorAll('.player-debuff-icon').forEach(el => el.remove());

        const debuffContainer = document.createElement('div');
        debuffContainer.className = 'player-debuffs-container';
        debuffContainer.style.cssText = `
            position: absolute;
            bottom: -35px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 50;
        `;

        // 실명 표시
        if (gameState.player.blind > 0) {
            const blindIcon = document.createElement('div');
            blindIcon.className = 'player-debuff-icon blind';
            blindIcon.innerHTML = `
                <span class="debuff-icon">X</span>
                <span class="debuff-count">${gameState.player.blind}</span>
                <div class="debuff-tooltip">Blind: 50% miss chance (${gameState.player.blind}t)</div>
            `;
            debuffContainer.appendChild(blindIcon);
        }

        // 취약 표시
        if (gameState.player.vulnerable > 0) {
            const vulnIcon = document.createElement('div');
            vulnIcon.className = 'player-debuff-icon vulnerable';
            vulnIcon.innerHTML = `
                <span class="debuff-icon">!</span>
                <span class="debuff-count">${gameState.player.vulnerable}</span>
                <div class="debuff-tooltip">Vulnerable: +50% dmg taken (${gameState.player.vulnerable}t)</div>
            `;
            debuffContainer.appendChild(vulnIcon);
        }

        // 출혈 표시
        if (gameState.player.bleed > 0) {
            const bleedIcon = document.createElement('div');
            bleedIcon.className = 'player-debuff-icon bleed';
            bleedIcon.innerHTML = `
                <span class="debuff-icon">*</span>
                <span class="debuff-count">${gameState.player.bleed}</span>
                <div class="debuff-tooltip">Bleed: ${gameState.player.bleed} dmg/turn (ignores block)</div>
            `;
            debuffContainer.appendChild(bleedIcon);
        }

        if (debuffContainer.children.length > 0) {
            playerEl.appendChild(debuffContainer);
        }
    },

    // 실명 인디케이터 업데이트
    updateBlindIndicator() {
        const existingIndicator = document.getElementById('blind-indicator');
        if (existingIndicator) existingIndicator.remove();

        if (gameState.player.blind > 0) {
            const indicator = document.createElement('div');
            indicator.id = 'blind-indicator';
            indicator.className = 'blind-indicator';
            indicator.innerHTML = `
                <span class="blind-icon">X</span>
                <span class="blind-text">Blind ${gameState.player.blind}t</span>
                <span class="blind-desc">50% miss</span>
            `;
            
            const battleArena = document.querySelector('.battle-arena');
            if (battleArena) {
                battleArena.appendChild(indicator);
            }
        }
    },

    // 플레이어 디버프 턴 감소
    decreasePlayerDebuffs() {
        if (gameState.player.blind > 0) {
            gameState.player.blind--;
            if (gameState.player.blind === 0) {
                addLog('Blind removed!', 'buff');
            }
        }

        if (gameState.player.vulnerable > 0) {
            gameState.player.vulnerable--;
            if (gameState.player.vulnerable === 0) {
                addLog('Vulnerable removed!', 'buff');
            }
        }

        this.updatePlayerStatusUI();
        this.updateBlindIndicator();
    },

    // 거미줄 카드 추가
    addWebCardsToDraw(count, sourceName) {
        if (!count || count <= 0) return;

        for (let i = 0; i < count; i++) {
            let webCard;
            if (typeof cardDatabase !== 'undefined' && cardDatabase.webTangle) {
                webCard = { ...cardDatabase.webTangle };
            } else {
                webCard = {
                    id: 'webTangle',
                    name: 'Web',
                    type: typeof CardType !== 'undefined' ? CardType.SKILL : 'skill',
                    rarity: typeof Rarity !== 'undefined' ? Rarity.BASIC : 'basic',
                    cost: 1,
                    targetSelf: true,
                    icon: '~',
                    description: '<span class="debuff">Apply Vulnerable 2 to self.</span>',
                    ethereal: true,
                    effect: () => {
                        if (!gameState.player.vulnerable) gameState.player.vulnerable = 0;
                        gameState.player.vulnerable += 2;
                        if (typeof updatePlayerStatusUI === 'function') updatePlayerStatusUI();
                        addLog('Webbed! Vulnerable 2', 'debuff');
                    }
                };
            }

            const randomIndex = Math.floor(Math.random() * (gameState.drawPile.length + 1));
            gameState.drawPile.splice(randomIndex, 0, webCard);
        }

        addLog(`${sourceName} webs! ${count} Web added`, 'debuff');

        // 거미줄 카드 날아가는 연출
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.showWebCardAnimation(count, sourceName);
        } else if (typeof showWebCardAnimation === 'function') {
            showWebCardAnimation(count, sourceName);
        }

        setTimeout(() => updatePileCounts(), 800);
    }
};

// 하위 호환성을 위한 전역 함수
function applyBleedToPlayer(amount, sourceName) {
    StatusEffects.applyBleedToPlayer(amount, sourceName);
}

function processBleedDamage() {
    StatusEffects.processBleedDamage();
}

function updatePlayerStatusUI() {
    StatusEffects.updatePlayerStatusUI();
}

function updateBlindIndicator() {
    StatusEffects.updateBlindIndicator();
}

function addWebCardsToDraw(count, sourceName) {
    StatusEffects.addWebCardsToDraw(count, sourceName);
}

console.log('[StatusEffects] Loaded');

