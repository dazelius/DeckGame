// ==========================================
// 출혈/거미줄 시스템 - Bleed & Web System
// ==========================================

// 🕸️ 거미줄 카드를 뽑기 더미에 추가
function addWebCardsToDiscard(count, sourceName) {
    if (!count || count <= 0) return;
    
    // 거미줄 카드 생성 - cards.js에서 가져오거나 fallback
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
        
        // 뽑기 더미에 랜덤 위치에 삽입
        const randomIndex = Math.floor(Math.random() * (gameState.drawPile.length + 1));
        gameState.drawPile.splice(randomIndex, 0, webCard);
    }
    
    addLog(`${sourceName} webs! ${count} Web added to draw`, 'debuff');
    
    // 거미줄 카드 날아가는 연출
    showWebCardAnimation(count, sourceName);
    
    // 더미 카운트 업데이트
    setTimeout(() => updatePileCounts(), 800);
}

// 거미줄 카드 날아가는 연출
function showWebCardAnimation(count, sourceName) {
    const drawPileEl = document.getElementById('draw-pile');
    const enemyEl = document.querySelector('.enemy-unit.selected') || document.querySelector('.enemy-unit');
    
    if (!drawPileEl) return;
    
    const drawRect = drawPileEl.getBoundingClientRect();
    const startX = enemyEl ? enemyEl.getBoundingClientRect().left + enemyEl.getBoundingClientRect().width / 2 : window.innerWidth / 2;
    const startY = enemyEl ? enemyEl.getBoundingClientRect().top + enemyEl.getBoundingClientRect().height / 2 : window.innerHeight / 3;
    
    // 각 카드 순차적으로 날리기
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const card = document.createElement('div');
            card.className = 'flying-web-card';
            card.innerHTML = `
                <div class="web-card-inner">
                    <div class="web-card-icon">~</div>
                    <div class="web-card-name">Web</div>
                </div>
            `;
            card.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY}px;
                width: 60px;
                height: 85px;
                background: linear-gradient(145deg, #2a2a3a 0%, #1a1a2a 100%);
                border: 2px solid #6b7280;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                pointer-events: none;
                transform: translate(-50%, -50%) scale(0.3) rotate(${-15 + Math.random() * 30}deg);
                opacity: 0;
                box-shadow: 0 0 20px rgba(156, 163, 175, 0.5);
            `;
            
            document.body.appendChild(card);
            
            // 애니메이션 시작
            requestAnimationFrame(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = `translate(-50%, -50%) scale(1) rotate(0deg)`;
                
                // 중간 지점으로 이동
                setTimeout(() => {
                    card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    card.style.left = `${drawRect.left + drawRect.width / 2}px`;
                    card.style.top = `${drawRect.top + drawRect.height / 2}px`;
                    card.style.transform = `translate(-50%, -50%) scale(0.5) rotate(${360 + Math.random() * 180}deg)`;
                    card.style.opacity = '0';
                }, 300);
                
                // 제거
                setTimeout(() => {
                    card.remove();
                    
                    // 마지막 카드일 때 덱 반짝임
                    if (i === count - 1) {
                        drawPileEl.classList.add('web-added');
                        setTimeout(() => drawPileEl.classList.remove('web-added'), 500);
                    }
                }, 800);
            });
        }, i * 150); // 카드 간격
    }
}

// 플레이어에게 출혈 적용
function applyBleedToPlayer(amount, sourceName) {
    if (!amount || amount <= 0) return;
    
    // 출혈 스택 추가
    gameState.player.bleed = (gameState.player.bleed || 0) + amount;
    
    addLog(`${sourceName}: Bleed ${amount}!`, 'debuff');
    
    // 출혈 이펙트
    const playerEl = document.getElementById('player');
    if (playerEl) {
        const bleedEffect = document.createElement('div');
        bleedEffect.className = 'bleed-apply-effect';
        bleedEffect.textContent = `+${amount}`;
        bleedEffect.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 1.5rem;
            font-weight: bold;
            color: #ef4444;
            text-shadow: 0 0 10px #ef4444;
            animation: bleedApplyAnim 1s ease-out forwards;
            z-index: 100;
        `;
        playerEl.appendChild(bleedEffect);
        setTimeout(() => bleedEffect.remove(), 1000);
    }
    
    // UI 업데이트
    updateBleedStatusUI();
}

// 턴 종료 시 출혈 데미지 처리
function processBleedDamage() {
    const bleed = gameState.player.bleed || 0;
    if (bleed <= 0) return;
    
    addLog(`Bleed! ${bleed} dmg`, 'damage');
    
    // 출혈 데미지는 방어도 무시
    gameState.player.hp -= bleed;
    
    // 출혈 이펙트
    const playerEl = document.getElementById('player');
    if (playerEl) {
        // 데미지 숫자 표시
        if (typeof showDamagePopup === 'function') {
            showDamagePopup(playerEl, bleed, 'bleed');
        }
        
        // 플레이어 흔들림
        playerEl.classList.add('hit');
        setTimeout(() => playerEl.classList.remove('hit'), 300);
    }
    
    // 출혈 스택 1 감소
    gameState.player.bleed = Math.max(0, bleed - 1);
    
    // UI 업데이트
    updateUI();
    updateBleedStatusUI();
    
    // 플레이어 사망 체크
    if (gameState.player.hp <= 0) {
        gameState.player.hp = 0;
        setTimeout(() => {
            gameOver();
        }, 500);
    }
}

// 출혈 상태 UI 업데이트 (기존 player-debuffs 컨테이너 사용)
function updateBleedStatusUI() {
    // player-debuffs 컨테이너 사용 (index.html에 정의됨)
    const debuffsContainer = document.getElementById('player-debuffs');
    if (!debuffsContainer) return;
    
    // 기존 출혈 아이콘 제거
    const existingBleed = debuffsContainer.querySelector('.bleed-debuff');
    if (existingBleed) existingBleed.remove();
    
    // 출혈 표시
    const bleed = gameState.player.bleed || 0;
    if (bleed > 0) {
        const bleedIcon = document.createElement('div');
        bleedIcon.className = 'player-debuff-icon bleed-debuff';
        bleedIcon.innerHTML = `
            <span class="debuff-emoji">🩸</span>
            <span class="debuff-value">${bleed}</span>
        `;
        bleedIcon.title = `출혈: 턴 종료 시 ${bleed} 피해 (방어 무시, 매턴 -1)`;
        
        debuffsContainer.appendChild(bleedIcon);
    }
}

// 호환성을 위한 별칭 (기존 코드에서 호출될 수 있음)
// game.js의 updatePlayerStatusUI가 출혈 UI도 업데이트하도록 연동

