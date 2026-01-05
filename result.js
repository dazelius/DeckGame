// ==========================================
// Result System - 전투 결과 및 보상 시스템
// ==========================================

const ResultSystem = {
    // ==========================================
    // 미니멀 카드 요소 생성 (이름 + 아이콘만)
    // ==========================================
    createMiniCardElement(card, index) {
        const cardEl = document.createElement('div');
        cardEl.className = `ds-mini-card ${card.type}`;
        cardEl.dataset.index = index;
        
        // 희귀도에 따른 테두리 효과
        if (card.rarity === Rarity.RARE) {
            cardEl.classList.add('rare');
        } else if (card.rarity === Rarity.UNCOMMON) {
            cardEl.classList.add('uncommon');
        }
        
        // 아이콘 처리
        let iconHtml = card.icon;
        if (card.icon && card.icon.includes('<img')) {
            iconHtml = card.icon;
        } else if (card.icon) {
            iconHtml = `<span class="mini-card-emoji">${card.icon}</span>`;
        }
        
        cardEl.innerHTML = `
            <div class="mini-card-cost">${card.cost}</div>
            <div class="mini-card-icon">${iconHtml}</div>
            <div class="mini-card-name">${card.name}</div>
            <div class="mini-card-rarity" style="color: ${getRarityColor(card.rarity)}">${getRarityName(card.rarity)}</div>
        `;
        
        return cardEl;
    },

    // ==========================================
    // 카드 요소 생성 (game.js의 createCardElement와 동일한 구조)
    // ==========================================
    createRewardCardElement(card, index) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.type} reward-card-game-style`;
        cardEl.dataset.index = index;
        
        // 희귀도에 따른 테두리 효과
        if (card.rarity === Rarity.RARE) {
            cardEl.classList.add('rare');
        } else if (card.rarity === Rarity.UNCOMMON) {
            cardEl.classList.add('uncommon');
        }
        
        // 동적 설명 지원
        const rawDescription = card.getDynamicDescription ? card.getDynamicDescription() : (card.description || '');
        // <br> 태그를 줄바꿈 블록으로 변환
        const description = rawDescription ? rawDescription.split('<br>').map(line => 
            `<div class="desc-line">${line.trim()}</div>`
        ).join('') : '';
        
        cardEl.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-header">
                <div class="card-name">${card.name}</div>
                <div class="card-type">${getCardTypeName(card.type)}</div>
            </div>
            <div class="card-image">${card.icon}</div>
            <div class="card-description">${description}</div>
            <div class="card-rarity-badge" style="color: ${getRarityColor(card.rarity)}">${getRarityName(card.rarity)}</div>
        `;
        
        // 내부 요소 클릭 방지 (부모에서 이벤트 처리)
        cardEl.style.pointerEvents = 'none';
        
        return cardEl;
    },

    // ==========================================
    // 승리 처리
    // ==========================================
    victory() {
        // 잡힌 NPC 제거
        if (typeof NPCDisplaySystem !== 'undefined') {
            NPCDisplaySystem.removeCapturedNpc();
        }

        // NPC 구출 체크
        const rescueNpcId = typeof NPCDisplaySystem !== 'undefined'
            ? NPCDisplaySystem.checkRescueOnVictory(
                gameState.enemy.name,
                gameState.currentBattleType,
                gameState.battleCount
              )
            : null;

        gameState.battleCount++;

        // 구출할 NPC가 있으면 구출 이벤트 표시 후 보상으로 진행
        if (rescueNpcId) {
            NPCDisplaySystem.showRescueEvent(rescueNpcId, () => {
                this.continueVictory();
            });
            return;
        }

        this.continueVictory();
    },

    // ==========================================
    // 구출 이벤트 후 승리 처리 계속
    // ==========================================
    continueVictory() {
        // 승리 연출
        if (typeof TurnEffects !== 'undefined') {
            TurnEffects.showVictory();
        }

        // 엘리트/보스 전투시 유물 보상
        const isElite = gameState.currentBattleType === 'elite';
        const isBoss = gameState.currentBattleType === 'boss';
        let relicReward = null;

        if (isElite || isBoss) {
            relicReward = this.getRandomRelicReward(isBoss ? 'rare' : 'uncommon');
        }

        // 골드 보상 계산
        let goldReward = 15 + Math.floor(Math.random() * 10);
        if (isElite) goldReward += 25;
        if (isBoss) goldReward += 50;
        goldReward += gameState.battleCount * 2;

        // 골드 지급
        if (typeof GoldSystem !== 'undefined') {
            GoldSystem.addGold(goldReward);
        }
        gameState.gold = (gameState.gold || 0) + goldReward;

        // 보상 카드 생성
        const rewardCards = [];
        for (let i = 0; i < 3; i++) {
            let card = getRandomRewardCard();
            while (rewardCards.some(c => c.id === card.id)) {
                card = getRandomRewardCard();
            }
            rewardCards.push(card);
        }

        this.showCardRewardSelection(rewardCards, relicReward, goldReward);
    },

    // ==========================================
    // 카드 보상 선택 UI - 다크소울 스타일
    // ==========================================
    showCardRewardSelection(rewardCards, relicReward = null, goldReward = 0) {
        const defeatedNames = gameState.enemies.map(e => e.name).join(', ');

        const modal = document.createElement('div');
        modal.className = 'ds-reward-modal';
        
        // 다크소울 스타일 모달 구조
        modal.innerHTML = `
            <div class="ds-reward-bg"></div>
            <div class="ds-reward-vignette"></div>
            <div class="ds-reward-content">
                <div class="ds-reward-header">
                    <div class="ds-reward-line left"></div>
                    <div class="ds-reward-title-container">
                        <div class="ds-reward-subtitle">ENEMY FELLED</div>
                        <h2 class="ds-reward-title">전리품</h2>
                        <p class="ds-reward-desc">${defeatedNames}을(를) 쓰러뜨렸다</p>
                    </div>
                    <div class="ds-reward-line right"></div>
                </div>
                
                <div class="ds-gold-section">
                    <div class="ds-gold-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                            <circle cx="12" cy="12" r="6"/>
                        </svg>
                    </div>
                    <div class="ds-gold-info">
                        <span class="ds-gold-amount">+${goldReward}</span>
                        <span class="ds-gold-label">GOLD</span>
                    </div>
                </div>
                
                <div class="ds-card-section">
                    <div class="ds-card-label">
                        <span class="ds-card-label-line"></span>
                        <span class="ds-card-label-text">보상 선택</span>
                        <span class="ds-card-label-line"></span>
                    </div>
                    <div class="ds-card-choices"></div>
                </div>
                
                ${relicReward ? `
                    <div class="ds-relic-section">
                        <div class="ds-relic-glow"></div>
                        <div class="ds-relic-icon">${relicReward.icon}</div>
                        <div class="ds-relic-info">
                            <div class="ds-relic-label">유물 획득</div>
                            <div class="ds-relic-name">${relicReward.name}</div>
                            <div class="ds-relic-desc">${relicReward.description}</div>
                        </div>
                    </div>
                ` : ''}
                
                <button class="ds-skip-btn">
                    <span class="ds-skip-text">건너뛰기</span>
                    <span class="ds-skip-sub">PASS</span>
                </button>
            </div>
            <div class="ds-reward-particles"></div>
        `;
        
        // 파티클 생성
        const particlesEl = modal.querySelector('.ds-reward-particles');
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'ds-reward-particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                animation-delay: ${Math.random() * 3}s;
                animation-duration: ${3 + Math.random() * 2}s;
            `;
            particlesEl.appendChild(particle);
        }

        document.body.appendChild(modal);
        
        // 카드 요소들을 큰 카드로 생성
        const choicesContainer = modal.querySelector('.ds-card-choices');
        rewardCards.forEach((card, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'ds-reward-card-choice';
            wrapper.dataset.index = index;
            wrapper.style.animationDelay = `${0.5 + index * 0.15}s`;
            
            // 큰 카드 직접 생성
            const cardEl = this.createRewardCardElement(card, index);
            cardEl.classList.add('ds-reward-full-card');
            cardEl.style.pointerEvents = 'none'; // 클릭은 wrapper에서 처리
            wrapper.appendChild(cardEl);
            
            choicesContainer.appendChild(wrapper);
        });

        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });

        // 카드 선택 이벤트
        modal.querySelectorAll('.ds-reward-card-choice').forEach((cardEl, index) => {
            cardEl.addEventListener('click', () => {
                const selectedCard = rewardCards[index];

                cardEl.classList.add('selected');
                modal.querySelectorAll('.ds-reward-card-choice').forEach((c, i) => {
                    if (i !== index) c.classList.add('not-selected');
                });

                setTimeout(() => {
                    gameState.deck.push(selectedCard);
                    addLog(`새 카드 획득: ${selectedCard.name}! (${getRarityName(selectedCard.rarity)})`);

                    if (relicReward && typeof RelicSystem !== 'undefined') {
                        RelicSystem.addRelic(relicReward.id);
                        addLog(`유물 획득: ${relicReward.name}!`, 'relic');
                    }

                    this.closeCardRewardModal(modal);
                }, 600);
            });

            cardEl.addEventListener('mouseenter', () => cardEl.classList.add('hovered'));
            cardEl.addEventListener('mouseleave', () => cardEl.classList.remove('hovered'));
        });

        // 건너뛰기
        modal.querySelector('.ds-skip-btn').addEventListener('click', () => {
            if (relicReward && typeof RelicSystem !== 'undefined') {
                RelicSystem.addRelic(relicReward.id);
                addLog(`유물 획득: ${relicReward.name}!`, 'relic');
            }
            addLog('카드 보상을 건너뛰었습니다.');
            this.closeCardRewardModal(modal);
        });
    },

    // ==========================================
    // 카드 보상 모달 닫기
    // ==========================================
    closeCardRewardModal(modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();

            if (typeof MapSystem !== 'undefined') {
                MapSystem.onBattleWin();
            }
        }, 400);
    },

    // ==========================================
    // 유물 보상 선택
    // ==========================================
    getRandomRelicReward(minRarity = 'common') {
        if (typeof relicDatabase === 'undefined') return null;

        const rarityOrder = ['common', 'uncommon', 'rare', 'legendary'];
        const minIndex = rarityOrder.indexOf(minRarity);

        const ownedIds = typeof RelicSystem !== 'undefined'
            ? RelicSystem.ownedRelics.map(r => r.id)
            : [];

        const availableRelics = Object.values(relicDatabase).filter(relic => {
            if (ownedIds.includes(relic.id)) return false;
            if (relic.rarity === 'starter') return false;
            const relicRarityIndex = rarityOrder.indexOf(relic.rarity);
            return relicRarityIndex >= minIndex;
        });

        if (availableRelics.length === 0) return null;

        return availableRelics[Math.floor(Math.random() * availableRelics.length)];
    },

    // ==========================================
    // 게임 오버
    // ==========================================
    async gameOver() {
        // ⚡ 에너지 볼트 정리
        if (typeof EnergyBoltSystem !== 'undefined') {
            EnergyBoltSystem.clear();
        }
        
        // 불사조 깃털 체크
        if (typeof RelicSystem !== 'undefined') {
            for (const relic of RelicSystem.ownedRelics) {
                if (relic.onDeath) {
                    const prevented = relic.onDeath(gameState);
                    if (prevented) {
                        updateUI();
                        
                        if (typeof CombatEffects !== 'undefined') {
                            CombatEffects.showReviveEffect();
                        } else if (typeof showReviveEffect === 'function') {
                            showReviveEffect();
                        }

                        setTimeout(() => {
                            if (!gameState.isPlayerTurn) {
                                startNewTurn();
                            }
                        }, 1500);

                        return;
                    }
                }
            }
        }

        // 💀 던전에서 사망 - 골드 상실
        if (typeof GoldSystem !== 'undefined') {
            GoldSystem.dieInDungeon();
        }
        
        // 💀 던전에서 사망 - 구출 NPC 상실
        if (typeof RescueSystem !== 'undefined') {
            RescueSystem.dieInDungeon();
        }

        // 🎬 패배 연출 - YOU DIED (3초간 표시 후 페이드아웃)
        if (typeof TurnEffects !== 'undefined') {
            await TurnEffects.showDefeat();
        }

        // 📜 패배 팝업 - 다크소울 스타일
        const battleCount = gameState.battleCount - 1 || 0;
        const lostGoldMsg = (typeof GoldSystem !== 'undefined' && GoldSystem.dungeonGold > 0) 
            ? `<div style="color: #f87171; font-size: 0.85rem; margin-top: 8px;">💰 던전 골드 ${GoldSystem.dungeonGold} 상실</div>` 
            : '';
        
        elements.modalIcon.textContent = '💀';
        elements.modalTitle.textContent = '전투에서 패배했습니다';
        elements.modalTitle.style.color = '#f87171';
        elements.modalMessage.innerHTML = `
            <div style="text-align: center;">
                <div style="color: #dc2626; font-size: 1.2rem; font-weight: bold; margin-bottom: 12px; text-shadow: 0 0 10px rgba(220, 38, 38, 0.5);">
                    어둠에 삼켜졌다...
                </div>
                <div style="color: #888; font-size: 0.95rem; margin-bottom: 8px;">
                    ${battleCount}번의 전투 후 쓰러졌습니다.
                </div>
                <div style="color: #666; font-size: 0.85rem;">
                    모든 소지품을 잃었습니다...
                </div>
                ${lostGoldMsg}
            </div>
        `;
        elements.rewardSection.style.display = 'none';
        elements.modalBtn.textContent = '마을로 귀환';
        elements.modal.classList.add('show');
    }
};

// ==========================================
// 하위 호환성을 위한 전역 함수
// ==========================================
function victory() {
    ResultSystem.victory();
}

function continueVictory() {
    ResultSystem.continueVictory();
}

function showCardRewardSelection(rewardCards, relicReward = null, goldReward = 0) {
    ResultSystem.showCardRewardSelection(rewardCards, relicReward, goldReward);
}

function closeCardRewardModal(modal) {
    ResultSystem.closeCardRewardModal(modal);
}

function getRandomRelicReward(minRarity = 'common') {
    return ResultSystem.getRandomRelicReward(minRarity);
}

async function gameOver() {
    // 🛡️ 인텐트 안전 체크 중지
    if (typeof stopIntentSafetyCheck === 'function') {
        stopIntentSafetyCheck();
    }
    await ResultSystem.gameOver();
}

console.log('[ResultSystem] 로드 완료');

