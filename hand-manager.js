// ==========================================
// Hand Manager System
// 손패 관리 시스템 (완전 독립)
// ==========================================

const HandManager = {
    // 카드 뽑기
    drawCards(count, withAnimation = true) {
        const previousHandSize = gameState.hand.length;
        const drawnCards = [];

        for (let i = 0; i < count; i++) {
            if (gameState.drawPile.length === 0) {
                // 뽑을 카드가 없으면 버린 카드 더미 셔플
                if (gameState.discardPile.length === 0) break;
                gameState.drawPile = [...gameState.discardPile];
                gameState.discardPile = [];
                this.shuffleArray(gameState.drawPile);
                addLog('Deck reshuffled');
            }

            const card = gameState.drawPile.pop();
            gameState.hand.push(card);
            drawnCards.push(card);
        }

        // 애니메이션 렌더링
        if (withAnimation && drawnCards.length > 0) {
            this.renderHandWithNewCards(previousHandSize, drawnCards.length);
        } else {
            this.renderHand(withAnimation);
        }
        
        this.updatePileCounts();
    },

    // 배열 셔플 (Fisher-Yates)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    // 새 카드만 애니메이션하는 렌더링
    renderHandWithNewCards(existingCount, newCount) {
        elements.hand.innerHTML = '';

        const handSize = gameState.hand.length;
        const baseRotation = handSize > 1 ? -15 : 0;
        const rotationStep = handSize > 1 ? 30 / (handSize - 1) : 0;

        gameState.hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, index);

            const rotation = baseRotation + (rotationStep * index);
            const yOffset = Math.abs(rotation) * 0.8;

            // CSS 변수로 기본 transform 저장
            cardEl.style.setProperty('--card-rotation', `${rotation}deg`);
            cardEl.style.setProperty('--card-y-offset', `${yOffset}px`);

            // z-index
            cardEl.style.zIndex = index + 1;

            const isNewCard = index >= existingCount;

            if (isNewCard) {
                // 새 카드: 딜링 애니메이션
                cardEl.style.opacity = '0';
                cardEl.style.transform = 'translateX(-300px) translateY(-200px) rotate(-30deg) scale(0.5)';
                cardEl.style.transition = 'none';

                elements.hand.appendChild(cardEl);

                const animIndex = index - existingCount;
                setTimeout(() => {
                    cardEl.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    cardEl.style.opacity = '1';
                    cardEl.style.transform = `rotate(${rotation}deg) translateY(${yOffset}px) scale(1.1)`;

                    this.showCardDealEffect(animIndex);

                    setTimeout(() => {
                        // 인라인 스타일 제거하여 CSS가 hover를 처리하도록
                        cardEl.style.transition = '';
                        cardEl.style.transform = '';
                        cardEl.classList.add('card-in-hand');
                    }, 400);
                }, animIndex * 120);
            } else {
                // 기존 카드: 클래스로 처리
                cardEl.classList.add('card-in-hand');
                cardEl.style.opacity = '1';
                elements.hand.appendChild(cardEl);
            }
        });
        
        // 크리티컬 시스템 UI 업데이트 (애니메이션 완료 후)
        if (typeof CriticalSystem !== 'undefined') {
            const delay = newCount > 0 ? (newCount * 120 + 500) : 50;
            setTimeout(() => CriticalSystem.updateCriticalUI(), delay);
        }
    },

    // 기본 손패 렌더링 (CSS flexbox 기반)
    renderHand(withDealAnimation = false) {
        elements.hand.innerHTML = '';

        const handSize = gameState.hand.length;
        const baseRotation = handSize > 1 ? -15 : 0;
        const rotationStep = handSize > 1 ? 30 / (handSize - 1) : 0;

        gameState.hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, index);

            const rotation = baseRotation + (rotationStep * index);
            const yOffset = Math.abs(rotation) * 0.8;

            // CSS 변수로 기본 transform 저장 (hover 시 복원용)
            cardEl.style.setProperty('--card-rotation', `${rotation}deg`);
            cardEl.style.setProperty('--card-y-offset', `${yOffset}px`);

            // z-index: 왼쪽에서 오른쪽으로 순차적으로 쌓임 (오른쪽이 앞)
            cardEl.style.zIndex = index + 1;

            if (withDealAnimation) {
                cardEl.style.opacity = '0';
                cardEl.style.transform = 'translateX(-300px) translateY(-200px) rotate(-30deg) scale(0.5)';
                cardEl.style.transition = 'none';

                elements.hand.appendChild(cardEl);

                setTimeout(() => {
                    cardEl.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    cardEl.style.opacity = '1';
                    cardEl.style.transform = `rotate(${rotation}deg) translateY(${yOffset}px) scale(1.1)`;

                    this.showCardDealEffect(index);

                    setTimeout(() => {
                        // 인라인 스타일 제거하여 CSS가 hover를 처리하도록
                        cardEl.style.transition = '';
                        cardEl.style.transform = '';
                        cardEl.classList.add('card-in-hand');
                    }, 400);
                }, index * 120);
            } else {
                // 클래스로 처리하여 CSS hover가 동작하도록
                cardEl.classList.add('card-in-hand');
                cardEl.style.opacity = '1';
                elements.hand.appendChild(cardEl);
            }
        });
        
        // 크리티컬 시스템 UI 업데이트
        if (typeof CriticalSystem !== 'undefined') {
            setTimeout(() => CriticalSystem.updateCriticalUI(), 50);
        }
    },

    // 카드 요소 생성 (완전 버전 - 실명, 희귀도, 과부하 등)
    createCardElement(card, index) {
        const cardEl = document.createElement('div');
        
        // 카드 타입 문자열로 변환
        const cardTypeStr = (card.type?.id || card.type || 'attack').toLowerCase();
        cardEl.className = `card ${cardTypeStr}`;
        cardEl.dataset.index = index;
        cardEl.dataset.type = cardTypeStr; // 드래그 시스템에서 사용
        
        // 실명 상태 체크
        const isBlinded = gameState.player.blind > 0;
        
        // 에너지 볼트 과부하 상태 체크
        const isOverchargeReady = card.id === 'energyBolt' && 
            typeof EnergyBoltSystem !== 'undefined' && 
            EnergyBoltSystem.bolts.length >= 3;
        
        // 희귀도에 따른 테두리 효과
        if (typeof Rarity !== 'undefined') {
            if (card.rarity === Rarity.LEGENDARY || card.rarity === 'legendary') {
                cardEl.classList.add('legendary');
            } else if (card.rarity === Rarity.SPECIAL || card.rarity === 'special') {
                cardEl.classList.add('special');
            } else if (card.rarity === Rarity.RARE || card.rarity === 'rare') {
                cardEl.classList.add('rare');
            } else if (card.rarity === Rarity.UNCOMMON || card.rarity === 'uncommon') {
                cardEl.classList.add('uncommon');
            } else if (card.rarity === Rarity.COMMON || card.rarity === 'common') {
                cardEl.classList.add('common');
            } else if (card.rarity === Rarity.BASIC || card.rarity === 'basic') {
                cardEl.classList.add('basic');
            }
        }
        
        // 과부하 준비 상태 스타일
        if (isOverchargeReady) {
            cardEl.classList.add('overcharge-ready');
        }
        
        if (card.cost > gameState.player.energy) {
            cardEl.classList.add('disabled');
        }
        
        // 사용 불가 카드 (거미줄 등)
        if (card.unplayable) {
            cardEl.classList.add('unplayable');
        }
        
        // 실명 상태일 때 카드 정보 숨김 (코스트는 표시)
        if (isBlinded) {
            cardEl.classList.add('blinded');
            cardEl.innerHTML = `
                <div class="card-cost">${card.cost}</div>
                <div class="card-header">
                    <div class="card-name">???</div>
                    <div class="card-type">BLIND</div>
                </div>
                <div class="card-image">
                    <span class="blind-web">🕸️</span>
                </div>
                <div class="card-description">
                    <span class="blind-text">카드 정보가<br>숨겨져 있습니다</span>
                </div>
            `;
        } else {
            // 과부하 준비 상태면 정보만 교체
            let cardName = card.name;
            let cardDesc = card.getDynamicDescription ? card.getDynamicDescription(card) : (card.description || '');
            let incantationTag = card.isIncantation ? 
                `<div class="incantation-tag">[영창${card.incantationBonus ? `×${1 + card.incantationBonus}` : ''}]</div>` : '';
            
            if (isOverchargeReady) {
                cardName = '과부하 폭발';
                cardDesc = `구체 1개당 <span class="damage">9</span> 데미지<br>모든 적에게 ${EnergyBoltSystem.bolts.length}회 타격!`;
            }
            
            // <br> 태그를 줄바꿈 블록으로 변환
            const description = cardDesc ? cardDesc.split('<br>').map(line => 
                `<div class="desc-line">${line.trim()}</div>`
            ).join('') : '';
            
            // 코스트 변경 표시
            const costChanged = card.baseCost !== undefined && card.cost !== card.baseCost;
            const costClass = costChanged ? (card.cost < card.baseCost ? 'cost-reduced' : 'cost-increased') : '';
            
            // 카드 타입 이름 가져오기
            const typeName = typeof getCardTypeName === 'function' ? getCardTypeName(card.type) : card.type;
            
            cardEl.innerHTML = `
                <div class="card-cost ${costClass}">${card.cost}</div>
                <div class="card-header">
                    <div class="card-name">${cardName}</div>
                    <div class="card-type">${typeName}${incantationTag}</div>
                </div>
                <div class="card-image">${card.icon}</div>
                <div class="card-description">${description}</div>
            `;
        }
        
        // 드래그 앤 드롭 설정
        if (typeof CardDragSystem !== 'undefined') {
            CardDragSystem.setup(cardEl, index, card);
        } else if (typeof setupCardDragAndDrop === 'function') {
            setupCardDragAndDrop(cardEl, index, card);
        }

        return cardEl;
    },

    // 카드 딜링 이펙트
    showCardDealEffect(index) {
        const drawPile = document.getElementById('draw-pile');
        if (!drawPile) return;

        // 카드 드로우 사운드 재생
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.playCardDraw();
        } else {
            try {
                const sound = new Audio('sound/card_draw.mp3');
                sound.volume = 0.4;
                sound.play().catch(() => {});
            } catch (e) {}
        }

        const rect = drawPile.getBoundingClientRect();
        
        // 카드 그림자 효과
        const shadow = document.createElement('div');
        shadow.className = 'card-deal-shadow';
        shadow.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            width: 80px;
            height: 110px;
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.1));
            border: 2px solid rgba(251, 191, 36, 0.5);
            border-radius: 8px;
            transform: translate(-50%, -50%) rotate(-10deg);
            pointer-events: none;
            z-index: 999;
            animation: cardDealFly 0.4s ease-out forwards;
            animation-delay: ${index * 120}ms;
            opacity: 0;
        `;
        document.body.appendChild(shadow);
        setTimeout(() => shadow.remove(), 600 + index * 120);
    },

    // 카드 소각 이펙트
    showCardBurnEffect(cardRect) {
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        
        // 소멸 이펙트 컨테이너
        const effectContainer = document.createElement('div');
        effectContainer.className = 'card-exhaust-effect';
        effectContainer.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 10000;
        `;
        
        // 소멸 텍스트
        const exhaustText = document.createElement('div');
        exhaustText.textContent = '소멸';
        exhaustText.style.cssText = `
            position: absolute;
            font-family: 'Cinzel', serif;
            font-size: 1rem;
            font-weight: bold;
            color: #9ca3af;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
            animation: exhaustTextFade 0.6s ease-out forwards;
        `;
        effectContainer.appendChild(exhaustText);
        
        document.body.appendChild(effectContainer);
        
        setTimeout(() => effectContainer.remove(), 800);
    },

    // 더미 카운트 업데이트
    updatePileCounts() {
        if (elements.drawCount) {
            elements.drawCount.textContent = gameState.drawPile.length;
        }
        if (elements.discardCount) {
            elements.discardCount.textContent = gameState.discardPile.length;
        }

        // 뽑기 더미 시각적 표시
        const drawPile = document.querySelector('.draw-pile .pile-cards');
        if (gameState.drawPile.length > 0) {
            drawPile?.classList.remove('empty');
        } else {
            drawPile?.classList.add('empty');
        }

        // 버리기 더미 시각적 표시
        const discardPile = document.querySelector('.discard-pile .pile-cards');
        if (gameState.discardPile.length > 0) {
            discardPile?.classList.remove('empty');
        } else {
            discardPile?.classList.add('empty');
        }
    },

    // 선천 카드 드로우 (전투 시작 시)
    drawInnateCards() {
        const innateIndices = [];
        gameState.drawPile.forEach((card, index) => {
            if (card.innate) {
                innateIndices.push(index);
            }
        });
        
        // 뒤에서부터 제거해야 인덱스가 꼬이지 않음
        innateIndices.reverse().forEach(index => {
            const card = gameState.drawPile.splice(index, 1)[0];
            gameState.hand.push(card);
            console.log(`[Innate] ${card.name} 선천성 카드 손패로 이동`);
        });
        
        if (innateIndices.length > 0) {
            addLog(`${innateIndices.length} Innate card(s) drawn`, 'buff');
        }
    },

    // 응집된 일격 코스트 계산
    getConcentratedStrikeCost() {
        const baseCards = gameState.turnStats?.attackCardsPlayed || 0;
        return Math.max(0, 3 - baseCards);
    },

    // 응집된 일격 코스트 업데이트
    updateConcentratedStrikeCosts(state) {
        state.hand.forEach(card => {
            if (card.id === 'concentratedStrike') {
                card.cost = this.getConcentratedStrikeCost();
            }
        });
        this.renderHand(false);
    },

    // 응집된 일격 코스트 초기화 (턴 시작)
    resetConcentratedStrikeCosts() {
        const resetCost = (card) => {
            if (card.id === 'concentratedStrike') {
                card.cost = 3;
            }
        };
        
        gameState.hand.forEach(resetCost);
        gameState.drawPile.forEach(resetCost);
        gameState.discardPile.forEach(resetCost);
        if (gameState.deck) gameState.deck.forEach(resetCost);
    },

    // 카드 상태 업데이트 (에너지 기준)
    updateCardStates() {
        const cards = elements.hand.querySelectorAll('.card');
        cards.forEach(cardEl => {
            const index = parseInt(cardEl.dataset.index);
            const card = gameState.hand[index];
            if (card) {
                const canAfford = card.cost <= gameState.player.energy;
                cardEl.classList.toggle('cannot-afford', !canAfford);
                cardEl.classList.toggle('disabled', !canAfford);
            }
        });
    }
};

// 하위 호환성을 위한 전역 함수
function drawCards(count, withAnimation = true) {
    HandManager.drawCards(count, withAnimation);
}

function renderHand(withDealAnimation = false) {
    HandManager.renderHand(withDealAnimation);
}

function renderHandWithNewCards(existingCount, newCount) {
    HandManager.renderHandWithNewCards(existingCount, newCount);
}

function createCardElement(card, index) {
    return HandManager.createCardElement(card, index);
}

function shuffleArray(array) {
    return HandManager.shuffleArray(array);
}

function updatePileCounts() {
    HandManager.updatePileCounts();
}

function drawInnateCards() {
    HandManager.drawInnateCards();
}

function getConcentratedStrikeCost() {
    return HandManager.getConcentratedStrikeCost();
}

function updateConcentratedStrikeCosts(state) {
    HandManager.updateConcentratedStrikeCosts(state);
}

function resetConcentratedStrikeCosts() {
    HandManager.resetConcentratedStrikeCosts();
}

function updateCardStates() {
    HandManager.updateCardStates();
}

function showCardDealEffect(index) {
    HandManager.showCardDealEffect(index);
}

function showCardBurnEffect(cardRect) {
    HandManager.showCardBurnEffect(cardRect);
}

function addCardsToHandWithAnimation(existingCount, newCount) {
    HandManager.renderHandWithNewCards(existingCount, newCount);
}

console.log('[HandManager] 완전 독립 버전 로드 완료');
