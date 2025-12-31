// ==========================================
// Shadow Deck - 상점 이벤트
// 던전 내 골드로 카드/유물 구매
// ==========================================

const ShopEvent = {
    isActive: false,
    currentRoom: null,
    
    // 상점 설정
    config: {
        cardCount: 6,           // 판매 카드 수
        relicCount: 2,          // 판매 유물 수
        saleChance: 0.25,       // 세일 확률 (25%)
        saleDiscount: 0.5,      // 세일 할인율 (50%)
        cardPrices: {
            common: { min: 30, max: 50 },
            uncommon: { min: 60, max: 90 },
            rare: { min: 100, max: 150 }
        },
        relicPrices: {
            common: { min: 80, max: 120 },
            uncommon: { min: 150, max: 200 },
            rare: { min: 250, max: 350 }
        }
    },
    
    // 현재 상점 재고
    stock: {
        cards: [],
        relics: [],
        soldCards: [],
        soldRelics: []
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.injectStyles();
        console.log('[Shop] 상점 시스템 초기화');
    },
    
    // ==========================================
    // 상점 열기
    // ==========================================
    open(room) {
        if (this.isActive) return;
        this.isActive = true;
        this.currentRoom = room;
        
        // TopBar 표시
        if (typeof TopBar !== 'undefined') {
            TopBar.show();
            TopBar.update();
        }
        
        // 상점 재고 생성
        this.generateStock();
        
        // UI 생성
        this.createUI();
        
        console.log('[Shop] 상점 열림');
    },
    
    // ==========================================
    // 재고 생성
    // ==========================================
    generateStock() {
        this.stock.cards = [];
        this.stock.relics = [];
        this.stock.soldCards = [];
        this.stock.soldRelics = [];
        
        // 카드 생성
        const availableCards = this.getAvailableCards();
        for (let i = 0; i < this.config.cardCount && availableCards.length > 0; i++) {
            const idx = Math.floor(Math.random() * availableCards.length);
            const card = availableCards.splice(idx, 1)[0];
            const basePrice = this.calculateCardPrice(card);
            const onSale = Math.random() < this.config.saleChance;
            const price = onSale ? Math.floor(basePrice * this.config.saleDiscount) : basePrice;
            this.stock.cards.push({ card, price, originalPrice: basePrice, onSale, sold: false });
        }
        
        // 유물 생성
        const availableRelics = this.getAvailableRelics();
        for (let i = 0; i < this.config.relicCount && availableRelics.length > 0; i++) {
            const idx = Math.floor(Math.random() * availableRelics.length);
            const relic = availableRelics.splice(idx, 1)[0];
            const basePrice = this.calculateRelicPrice(relic);
            const onSale = Math.random() < this.config.saleChance;
            const price = onSale ? Math.floor(basePrice * this.config.saleDiscount) : basePrice;
            this.stock.relics.push({ relic, price, originalPrice: basePrice, onSale, sold: false });
        }
    },
    
    // 구매 가능한 카드 목록
    getAvailableCards() {
        if (typeof cardDatabase === 'undefined') return [];
        
        const cards = [];
        Object.values(cardDatabase).forEach(card => {
            // 기본 카드와 저주 카드는 제외
            if (card.rarity === Rarity.BASIC) return;
            if (card.type === CardType.CURSE) return;
            if (card.type === CardType.STATUS) return;
            
            cards.push({ ...card });
        });
        
        return cards;
    },
    
    // 구매 가능한 유물 목록
    getAvailableRelics() {
        if (typeof relicDatabase === 'undefined') return [];
        if (typeof RelicSystem === 'undefined') return [];
        
        const relics = [];
        Object.values(relicDatabase).forEach(relic => {
            // 이미 보유한 유물 제외
            if (RelicSystem.hasRelic(relic.id)) return;
            relics.push({ ...relic });
        });
        
        return relics;
    },
    
    // 카드 가격 계산
    calculateCardPrice(card) {
        const rarity = card.rarity?.id || card.rarity || 'common';
        const priceRange = this.config.cardPrices[rarity] || this.config.cardPrices.common;
        return Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
    },
    
    // 유물 가격 계산
    calculateRelicPrice(relic) {
        const rarity = relic.rarity || 'common';
        const priceRange = this.config.relicPrices[rarity] || this.config.relicPrices.common;
        return Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
    },
    
    // ==========================================
    // UI 생성
    // ==========================================
    createUI() {
        const overlay = document.createElement('div');
        overlay.className = 'shop-overlay';
        overlay.id = 'shop-overlay';
        
        const currentGold = this.getGold();
        
        overlay.innerHTML = `
            <div class="shop-container">
                <!-- 배경 이미지 -->
                <div class="shop-bg-image"></div>
                
                <!-- 레터박스 -->
                <div class="shop-letterbox top"></div>
                <div class="shop-letterbox bottom"></div>
                
                <!-- 비네팅 -->
                <div class="shop-vignette"></div>
                
                <!-- 헤더 -->
                <div class="shop-header">
                    <div class="shop-title">떠돌이 상인</div>
                    <div class="shop-subtitle">"...좋은 물건이 있소."</div>
                    <div class="shop-gold">
                        <span class="gold-icon">💰</span>
                        <span class="gold-amount" id="shop-gold">${currentGold}</span>
                    </div>
                </div>
                
                <!-- 상점 내용 -->
                <div class="shop-content">
                    <!-- 카드 섹션 -->
                    <div class="shop-section">
                        <div class="section-title">
                            <span class="section-line"></span>
                            <span class="section-text">CARDS</span>
                            <span class="section-line"></span>
                        </div>
                        <div class="shop-cards" id="shop-cards">
                            ${this.renderCards()}
                        </div>
                    </div>
                    
                    <!-- 유물 섹션 -->
                    <div class="shop-section">
                        <div class="section-title">
                            <span class="section-line"></span>
                            <span class="section-text">RELICS</span>
                            <span class="section-line"></span>
                        </div>
                        <div class="shop-relics" id="shop-relics">
                            ${this.renderRelics()}
                        </div>
                    </div>
                </div>
                
                <!-- 나가기 버튼 -->
                <button class="shop-leave-btn" id="shop-leave">
                    <span class="btn-line"></span>
                    <span class="btn-text">떠나기</span>
                    <span class="btn-line"></span>
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 애니메이션
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // 이벤트 바인딩
        this.bindEvents(overlay);
    },
    
    // 카드 렌더링
    renderCards() {
        if (this.stock.cards.length === 0) {
            return '<div class="shop-empty">판매 중인 카드가 없습니다</div>';
        }
        
        return this.stock.cards.map((item, idx) => {
            if (item.sold) {
                return `<div class="shop-card-slot sold">SOLD</div>`;
            }
            
            const card = item.card;
            const rarityClass = card.rarity?.id || card.rarity || 'common';
            const canAfford = this.getGold() >= item.price;
            
            return `
                <div class="shop-card-slot ${canAfford ? '' : 'expensive'} ${item.onSale ? 'on-sale' : ''}" data-card-idx="${idx}">
                    ${item.onSale ? '<div class="sale-tag">SALE!</div>' : ''}
                    <div class="shop-card rarity-${rarityClass}">
                        <div class="shop-card-cost">${card.cost}</div>
                        <div class="shop-card-icon">${card.icon || '🃏'}</div>
                        <div class="shop-card-name">${card.name}</div>
                        <div class="shop-card-type">${this.getCardTypeName(card.type)}</div>
                    </div>
                    <div class="shop-card-price ${canAfford ? '' : 'expensive'} ${item.onSale ? 'sale' : ''}">
                        ${item.onSale ? `<span class="original-price">${item.originalPrice}</span>` : ''}
                        💰 ${item.price}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // 유물 렌더링
    renderRelics() {
        if (this.stock.relics.length === 0) {
            return '<div class="shop-empty">판매 중인 유물이 없습니다</div>';
        }
        
        return this.stock.relics.map((item, idx) => {
            if (item.sold) {
                return `<div class="shop-relic-slot sold">SOLD</div>`;
            }
            
            const relic = item.relic;
            const canAfford = this.getGold() >= item.price;
            
            // 아이콘 처리 (이미지 경로 or 이모지)
            let iconHtml = '💎';
            if (relic.icon) {
                if (relic.icon.endsWith('.png') || relic.icon.endsWith('.jpg') || relic.icon.endsWith('.gif')) {
                    iconHtml = `<img src="${relic.icon}" alt="${relic.name}" class="relic-icon-img" onerror="this.outerHTML='💎'">`;
                } else {
                    iconHtml = relic.icon;
                }
            }
            
            return `
                <div class="shop-relic-slot ${canAfford ? '' : 'expensive'} ${item.onSale ? 'on-sale' : ''}" data-relic-idx="${idx}">
                    ${item.onSale ? '<div class="sale-tag">SALE!</div>' : ''}
                    <div class="shop-relic">
                        <div class="shop-relic-icon">${iconHtml}</div>
                        <div class="shop-relic-info">
                            <div class="shop-relic-name">${relic.name}</div>
                            <div class="shop-relic-desc">${relic.description || ''}</div>
                        </div>
                    </div>
                    <div class="shop-relic-price ${canAfford ? '' : 'expensive'} ${item.onSale ? 'sale' : ''}">
                        ${item.onSale ? `<span class="original-price">${item.originalPrice}</span>` : ''}
                        💰 ${item.price}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    getCardTypeName(type) {
        const typeId = type?.id || type;
        const names = {
            'attack': '공격',
            'skill': '스킬',
            'power': '파워'
        };
        return names[typeId] || '카드';
    },
    
    // ==========================================
    // 이벤트 바인딩
    // ==========================================
    bindEvents(overlay) {
        // 카드 구매
        overlay.querySelectorAll('.shop-card-slot:not(.sold)').forEach(slot => {
            slot.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(slot.dataset.cardIdx);
                if (!isNaN(idx)) {
                    this.buyCard(idx);
                }
            });
        });
        
        // 유물 구매
        overlay.querySelectorAll('.shop-relic-slot:not(.sold)').forEach(slot => {
            slot.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(slot.dataset.relicIdx);
                if (!isNaN(idx)) {
                    this.buyRelic(idx);
                }
            });
        });
        
        // 나가기
        overlay.querySelector('#shop-leave').addEventListener('click', () => {
            this.close();
        });
    },
    
    // ==========================================
    // 구매 로직
    // ==========================================
    buyCard(idx) {
        const item = this.stock.cards[idx];
        if (!item || item.sold) return;
        
        const gold = Number(this.getGold());
        const price = Number(item.price);
        
        console.log(`[Shop] 구매 시도 - 골드: ${gold}, 가격: ${price}`);
        
        if (gold < price) {
            this.showMessage(`골드가 부족합니다! (${gold}G < ${price}G)`);
            return;
        }
        
        // 카드 슬롯 요소 가져오기
        const cardSlot = document.querySelector(`.shop-card-slot[data-card-idx="${idx}"]`);
        
        // 골드 차감
        this.spendGold(item.price);
        
        // 카드 추가
        if (typeof gameState !== 'undefined' && gameState.deck) {
            gameState.deck.push({ ...item.card });
        }
        
        // 판매 완료
        item.sold = true;
        
        // 구매 연출 (카드 정보 전달)
        this.playPurchaseEffect(cardSlot, item.card.icon || '🃏', item.card.name, 'card', item.card);
        
        // UI 업데이트
        this.updateUI();
        
        console.log(`[Shop] 카드 구매: ${item.card.name} (${item.price}G)`);
    },
    
    buyRelic(idx) {
        const item = this.stock.relics[idx];
        if (!item || item.sold) return;
        
        const gold = Number(this.getGold());
        const price = Number(item.price);
        
        console.log(`[Shop] 유물 구매 시도 - 골드: ${gold}, 가격: ${price}`);
        
        if (isNaN(gold) || isNaN(price) || gold < price) {
            this.showMessage('골드가 부족합니다!');
            return;
        }
        
        // 유물 슬롯 요소 가져오기
        const relicSlot = document.querySelector(`.shop-relic-slot[data-relic-idx="${idx}"]`);
        
        // 골드 차감
        this.spendGold(item.price);
        
        // 유물 추가
        if (typeof RelicSystem !== 'undefined') {
            RelicSystem.addRelic(item.relic.id);
        }
        
        // 판매 완료
        item.sold = true;
        
        // UI 업데이트
        this.updateUI();
        this.showMessage(`${item.relic.name} 획득!`);
        
        // TopBar 업데이트
        if (typeof TopBar !== 'undefined') {
            TopBar.updateGold();
        }
        
        console.log(`[Shop] 유물 구매: ${item.relic.name} (${item.price}G)`);
    },
    
    // ==========================================
    // 구매 연출 (카드 전용)
    // ==========================================
    playPurchaseEffect(slotEl, icon, name, type, card = null) {
        if (type !== 'card') return;
        
        // 슬롯 위치 계산
        const rect = slotEl ? slotEl.getBoundingClientRect() : { left: window.innerWidth / 2 - 50, top: window.innerHeight / 2 };
        const startX = rect.left + (slotEl ? slotEl.offsetWidth / 2 : 50);
        const startY = rect.top + (slotEl ? slotEl.offsetHeight / 2 : 0);
        
        // 카드 덱으로 날아가는 연출
        this.playCardToDeckEffect(startX, startY, icon, name, card);
        
        // 골드 감소 표시
        const goldEffect = document.createElement('div');
        goldEffect.className = 'shop-gold-spent';
        goldEffect.textContent = `-💰`;
        goldEffect.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY + 60}px;
            transform: translateX(-50%);
            z-index: 100000;
            pointer-events: none;
        `;
        document.body.appendChild(goldEffect);
        setTimeout(() => goldEffect.remove(), 1000);
        
        // TopBar 업데이트
        if (typeof TopBar !== 'undefined') {
            TopBar.updateGold();
        }
    },
    
    // 카드 → 덱 주머니 연출
    playCardToDeckEffect(startX, startY, icon, name, card) {
        // 덱 주머니 위치 (화면 오른쪽 하단)
        const deckX = window.innerWidth - 100;
        const deckY = window.innerHeight - 80;
        
        // 카드 요소 생성
        const flyingCard = document.createElement('div');
        flyingCard.className = 'shop-flying-card';
        
        const rarityClass = card?.rarity?.id || card?.rarity || 'common';
        flyingCard.innerHTML = `
            <div class="flying-card-inner rarity-${rarityClass}">
                <div class="flying-card-icon">${icon}</div>
                <div class="flying-card-name">${name}</div>
            </div>
            <div class="flying-card-trail"></div>
        `;
        
        flyingCard.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            transform: translate(-50%, -50%) scale(1);
            z-index: 100000;
            pointer-events: none;
        `;
        
        document.body.appendChild(flyingCard);
        
        // 파티클 폭발 (시작 지점)
        this.createBurstParticles(startX, startY, ['#a855f7', '#c084fc', '#e9d5ff']);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            flyingCard.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            flyingCard.style.left = `${deckX}px`;
            flyingCard.style.top = `${deckY}px`;
            flyingCard.style.transform = 'translate(-50%, -50%) scale(0.3) rotate(15deg)';
            flyingCard.style.opacity = '0.8';
        });
        
        // 덱에 도착 시 효과
        setTimeout(() => {
            flyingCard.remove();
            this.createDeckArriveEffect(deckX, deckY);
        }, 600);
    },
    
    // 덱 도착 효과
    createDeckArriveEffect(x, y) {
        const deckEffect = document.createElement('div');
        deckEffect.className = 'shop-deck-arrive';
        deckEffect.innerHTML = `
            <div class="deck-glow"></div>
            <div class="deck-text">+1</div>
        `;
        deckEffect.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            z-index: 100000;
            pointer-events: none;
        `;
        document.body.appendChild(deckEffect);
        
        // 파티클 추가
        this.createBurstParticles(x, y, ['#d4af37', '#ffd700', '#fff8dc']);
        
        setTimeout(() => deckEffect.remove(), 800);
    },
    
    // 파티클 폭발 생성
    createBurstParticles(x, y, colors) {
        const container = document.createElement('div');
        container.className = 'shop-particles-container';
        container.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            z-index: 100000;
            pointer-events: none;
        `;
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'acquire-particle';
            const angle = (i / 10) * 360;
            const distance = 50 + Math.random() * 30;
            particle.style.cssText = `
                --angle: ${angle}deg;
                --distance: ${distance}px;
                --color: ${colors[i % colors.length]};
                --delay: ${i * 0.02}s;
            `;
            container.appendChild(particle);
        }
        
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 800);
    },
    
    // ==========================================
    // UI 업데이트
    // ==========================================
    updateUI() {
        const goldEl = document.getElementById('shop-gold');
        if (goldEl) goldEl.textContent = this.getGold();
        
        const cardsEl = document.getElementById('shop-cards');
        if (cardsEl) cardsEl.innerHTML = this.renderCards();
        
        const relicsEl = document.getElementById('shop-relics');
        if (relicsEl) relicsEl.innerHTML = this.renderRelics();
        
        // 이벤트 재바인딩
        const overlay = document.getElementById('shop-overlay');
        if (overlay) {
            // 카드 구매
            overlay.querySelectorAll('.shop-card-slot:not(.sold)').forEach(slot => {
                slot.addEventListener('click', () => {
                    const idx = parseInt(slot.dataset.cardIdx);
                    this.buyCard(idx);
                });
            });
            
            // 유물 구매
            overlay.querySelectorAll('.shop-relic-slot:not(.sold)').forEach(slot => {
                slot.addEventListener('click', () => {
                    const idx = parseInt(slot.dataset.relicIdx);
                    this.buyRelic(idx);
                });
            });
        }
    },
    
    // ==========================================
    // 골드 관리
    // ==========================================
    getGold() {
        // GoldSystem의 총 골드 사용 (영구 + 던전)
        if (typeof GoldSystem !== 'undefined' && typeof GoldSystem.getTotalGold === 'function') {
            return GoldSystem.getTotalGold();
        }
        return 0;
    },
    
    spendGold(amount) {
        // GoldSystem의 useGold 사용 (던전 상황에 맞게 자동 처리)
        if (typeof GoldSystem !== 'undefined' && typeof GoldSystem.useGold === 'function') {
            GoldSystem.useGold(amount);
        }
        
        if (typeof TopBar !== 'undefined') {
            TopBar.updateGold();
        }
    },
    
    // ==========================================
    // 메시지 표시
    // ==========================================
    showMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'shop-message';
        msg.textContent = text;
        document.body.appendChild(msg);
        
        requestAnimationFrame(() => msg.classList.add('visible'));
        
        setTimeout(() => {
            msg.classList.remove('visible');
            setTimeout(() => msg.remove(), 300);
        }, 1500);
    },
    
    // ==========================================
    // 상점 닫기
    // ==========================================
    close() {
        const overlay = document.getElementById('shop-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
                this.isActive = false;
                
                // 방 클리어 처리
                if (this.currentRoom) {
                    this.currentRoom.cleared = true;
                }
                
                // 맵으로 돌아가기
                if (typeof MapSystem !== 'undefined') {
                    MapSystem.showMap();
                }
            }, 400);
        }
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('shop-event-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'shop-event-styles';
        style.textContent = `
            /* ==========================================
               상점 오버레이
            ========================================== */
            .shop-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #0a0a0a;
                z-index: 9000;
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            
            .shop-overlay.visible {
                opacity: 1;
            }
            
            .shop-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 80px 40px 60px;
                box-sizing: border-box;
                overflow-y: auto;
                z-index: 3;
            }
            
            /* 레터박스 */
            .shop-letterbox {
                position: absolute;
                left: 0;
                width: 100%;
                height: 4%;
                background: #000;
                z-index: 10;
                pointer-events: none;
            }
            .shop-letterbox.top { top: 0; }
            .shop-letterbox.bottom { bottom: 0; }
            
            /* 배경 이미지 */
            .shop-bg-image {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                background: 
                    linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.6) 100%),
                    url('event_shop.png') center center / cover no-repeat;
                z-index: 0;
            }
            
            /* 비네팅 */
            .shop-vignette {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(ellipse at center,
                    transparent 30%,
                    rgba(0, 0, 0, 0.4) 70%,
                    rgba(0, 0, 0, 0.8) 100%);
                pointer-events: none;
                z-index: 1;
            }
            
            /* 헤더 */
            .shop-header {
                text-align: center;
                margin-bottom: 30px;
                z-index: 5;
            }
            
            .shop-title {
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                color: #d4af37;
                text-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
                letter-spacing: 8px;
                margin-bottom: 10px;
            }
            
            .shop-subtitle {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1rem;
                color: #888;
                font-style: italic;
                margin-bottom: 20px;
            }
            
            .shop-gold {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                padding: 10px 25px;
                background: rgba(20, 20, 25, 0.9);
                border: 1px solid rgba(212, 175, 55, 0.5);
                border-radius: 4px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(10px);
            }
            
            .gold-icon {
                font-size: 1.5rem;
            }
            
            .gold-amount {
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                color: #d4af37;
            }
            
            /* 컨텐츠 */
            .shop-content {
                width: 100%;
                max-width: 1200px;
                z-index: 5;
                background: rgba(10, 10, 15, 0.7);
                border-radius: 12px;
                padding: 25px;
                backdrop-filter: blur(5px);
                box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
            }
            
            /* 섹션 */
            .shop-section {
                margin-bottom: 30px;
            }
            
            .section-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .section-line {
                width: 100px;
                height: 1px;
                background: linear-gradient(90deg, transparent, #555, transparent);
            }
            
            .section-text {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #888;
                letter-spacing: 5px;
            }
            
            /* 카드 그리드 */
            .shop-cards {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .shop-card-slot {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .shop-card-slot:hover:not(.sold):not(.expensive) {
                transform: translateY(-10px);
            }
            
            .shop-card-slot.sold {
                opacity: 0.3;
                cursor: default;
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                color: #555;
                padding: 60px 30px;
            }
            
            .shop-card-slot.expensive {
                opacity: 0.5;
            }
            
            .shop-card {
                width: 140px;
                height: 200px;
                background: linear-gradient(180deg, rgba(30, 30, 35, 0.95) 0%, rgba(15, 15, 20, 0.98) 100%);
                border: 2px solid #444;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 15px 10px;
                position: relative;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
            }
            
            .shop-card:hover {
                border-color: #d4af37;
                box-shadow: 0 6px 25px rgba(212, 175, 55, 0.3);
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
            }
            
            .shop-card.rarity-common { border-color: #888; }
            .shop-card.rarity-uncommon { border-color: #4ade80; }
            .shop-card.rarity-rare { border-color: #60a5fa; }
            
            .shop-card-cost {
                position: absolute;
                top: -10px;
                left: -10px;
                width: 30px;
                height: 30px;
                background: #1a1a1a;
                border: 2px solid #d4af37;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #d4af37;
            }
            
            .shop-card-icon {
                font-size: 3rem;
                margin: 20px 0;
            }
            
            .shop-card-icon img {
                width: 60px;
                height: 60px;
                object-fit: contain;
            }
            
            .shop-card-name {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 0.9rem;
                color: #ddd;
                text-align: center;
                margin-bottom: 5px;
            }
            
            .shop-card-type {
                font-size: 0.7rem;
                color: #888;
            }
            
            .shop-card-price {
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                color: #d4af37;
            }
            
            .shop-card-price.expensive {
                color: #ef4444;
            }
            
            /* 유물 그리드 */
            .shop-relics {
                display: flex;
                justify-content: center;
                gap: 30px;
                flex-wrap: wrap;
            }
            
            .shop-relic-slot {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .shop-relic-slot:hover:not(.sold):not(.expensive) {
                transform: scale(1.05);
            }
            
            .shop-relic-slot.sold {
                opacity: 0.3;
                cursor: default;
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #555;
                padding: 40px 30px;
            }
            
            .shop-relic-slot.expensive {
                opacity: 0.5;
            }
            
            .shop-relic {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px 25px;
                background: rgba(25, 25, 30, 0.95);
                border: 1px solid #555;
                border-radius: 8px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
            }
            
            .shop-relic:hover {
                border-color: #a855f7;
                box-shadow: 0 6px 25px rgba(168, 85, 247, 0.4);
            }
            
            .shop-relic-icon {
                font-size: 2.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 50px;
            }
            
            .shop-relic-icon .relic-icon-img {
                width: 48px;
                height: 48px;
                object-fit: contain;
                image-rendering: pixelated;
            }
            
            .shop-relic-info {
                text-align: left;
            }
            
            .shop-relic-name {
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                color: #ddd;
                margin-bottom: 5px;
            }
            
            .shop-relic-desc {
                font-size: 0.8rem;
                color: #888;
                max-width: 200px;
            }
            
            .shop-relic-price {
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                color: #a855f7;
            }
            
            .shop-relic-price.expensive {
                color: #ef4444;
            }
            
            /* 세일 태그 */
            .sale-tag {
                position: absolute;
                top: -8px;
                right: -8px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: #fff;
                font-family: 'Cinzel', serif;
                font-size: 0.7rem;
                font-weight: bold;
                padding: 4px 8px;
                border-radius: 4px;
                z-index: 10;
                animation: salePulse 1s ease-in-out infinite;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
            }
            
            @keyframes salePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .shop-card-slot.on-sale,
            .shop-relic-slot.on-sale {
                position: relative;
            }
            
            .shop-card-slot.on-sale .shop-card {
                border-color: #ef4444;
                box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
            }
            
            .shop-relic-slot.on-sale .shop-relic {
                border-color: #ef4444;
                box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
            }
            
            .original-price {
                text-decoration: line-through;
                color: #666;
                font-size: 0.85em;
                margin-right: 5px;
            }
            
            .shop-card-price.sale,
            .shop-relic-price.sale {
                color: #ef4444;
            }
            
            /* 나가기 버튼 */
            .shop-leave-btn {
                display: inline-flex;
                align-items: center;
                gap: 20px;
                padding: 15px 50px;
                background: transparent;
                border: none;
                cursor: pointer;
                margin-top: 30px;
                z-index: 5;
                transition: all 0.3s ease;
            }
            
            .shop-leave-btn:hover {
                transform: scale(1.05);
            }
            
            .shop-leave-btn:hover .btn-text {
                color: #d4af37;
            }
            
            .shop-leave-btn:hover .btn-line {
                width: 60px;
                background: #d4af37;
            }
            
            .shop-leave-btn .btn-line {
                width: 40px;
                height: 1px;
                background: #555;
                transition: all 0.3s ease;
            }
            
            .shop-leave-btn .btn-text {
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                color: #888;
                letter-spacing: 5px;
                transition: all 0.3s ease;
            }
            
            /* 빈 상태 */
            .shop-empty {
                color: #555;
                font-style: italic;
                padding: 40px;
            }
            
            /* 메시지 */
            .shop-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                padding: 20px 40px;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #d4af37;
                border-radius: 8px;
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.2rem;
                color: #d4af37;
                z-index: 10001;
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .shop-message.visible {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            /* ==========================================
               카드 → 덱 날아가기 연출
               ========================================== */
            .shop-flying-card {
                width: 100px;
                height: 140px;
            }
            
            .flying-card-inner {
                width: 100%;
                height: 100%;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #d4af37;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-shadow: 
                    0 0 20px rgba(212, 175, 55, 0.5),
                    0 10px 30px rgba(0, 0, 0, 0.5);
                animation: cardPulse 0.3s ease-out;
            }
            
            .flying-card-inner.rarity-rare {
                border-color: #ffd700;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
            }
            
            .flying-card-inner.rarity-uncommon {
                border-color: #a855f7;
                box-shadow: 0 0 25px rgba(168, 85, 247, 0.5);
            }
            
            @keyframes cardPulse {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .flying-card-icon {
                font-size: 2rem;
                margin-bottom: 5px;
            }
            
            .flying-card-name {
                font-size: 0.7rem;
                color: #d4af37;
                text-align: center;
                font-family: 'Noto Sans KR', sans-serif;
                font-weight: 600;
                padding: 0 5px;
            }
            
            .flying-card-trail {
                position: absolute;
                width: 100%;
                height: 100%;
                background: linear-gradient(to left, rgba(168, 85, 247, 0.3), transparent);
                border-radius: 10px;
                animation: trailFade 0.6s ease-out forwards;
            }
            
            @keyframes trailFade {
                0% { opacity: 0.8; transform: scaleX(1); }
                100% { opacity: 0; transform: scaleX(2) translateX(-30%); }
            }
            
            /* 덱 도착 효과 */
            .shop-deck-arrive {
                text-align: center;
                animation: deckArrive 0.8s ease-out forwards;
            }
            
            @keyframes deckArrive {
                0% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
                50% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            }
            
            .deck-glow {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 80px;
                height: 80px;
                background: radial-gradient(circle, rgba(212, 175, 55, 0.6) 0%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: deckGlowPulse 0.5s ease-out;
            }
            
            @keyframes deckGlowPulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
            
            .deck-text {
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                color: #4ade80;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(74, 222, 128, 0.8);
                animation: deckTextFloat 0.8s ease-out forwards;
            }
            
            @keyframes deckTextFloat {
                0% { transform: translateX(-50%) translateY(0); opacity: 1; }
                100% { transform: translateX(-50%) translateY(-30px); opacity: 0; }
            }
            
            /* 파티클 컨테이너 */
            .shop-particles-container {
                width: 0;
                height: 0;
            }
            
            /* ==========================================
               구매 연출 (유물용)
               ========================================== */
            .shop-acquire-effect {
                text-align: center;
                animation: acquirePop 1.5s ease-out forwards;
            }
            
            @keyframes acquirePop {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                20% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.2);
                }
                40% {
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -150%) scale(1);
                }
            }
            
            .acquire-icon {
                font-size: 3rem;
                filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.8));
                animation: iconGlow 0.5s ease-out;
            }
            
            @keyframes iconGlow {
                0% { filter: drop-shadow(0 0 0 rgba(212, 175, 55, 0)); }
                50% { filter: drop-shadow(0 0 40px rgba(212, 175, 55, 1)); }
                100% { filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.8)); }
            }
            
            .acquire-name {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.1rem;
                color: #fff;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
                margin-top: 5px;
                font-weight: 600;
            }
            
            .acquire-text {
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                color: #d4af37;
                letter-spacing: 3px;
                margin-top: 3px;
                text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
            }
            
            .acquire-particles {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
            }
            
            .acquire-particle {
                position: absolute;
                width: 8px;
                height: 8px;
                background: var(--color);
                border-radius: 50%;
                animation: particleBurst 0.8s ease-out forwards;
                animation-delay: var(--delay);
                opacity: 0;
            }
            
            @keyframes particleBurst {
                0% {
                    opacity: 1;
                    transform: rotate(var(--angle)) translateX(0);
                }
                100% {
                    opacity: 0;
                    transform: rotate(var(--angle)) translateX(var(--distance));
                }
            }
            
            .shop-gold-spent {
                font-size: 1.2rem;
                color: #ef4444;
                font-weight: bold;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
                animation: goldSpent 1s ease-out forwards;
            }
            
            @keyframes goldSpent {
                0% {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50%) translateY(30px);
                }
            }
            
            /* ==========================================
               반응형 대응
               ========================================== */
            
            /* 태블릿 */
            @media (max-width: 1024px) {
                .shop-container {
                    padding: 50px 30px;
                }
                
                .shop-title {
                    font-size: 2rem;
                    letter-spacing: 5px;
                }
                
                .shop-cards, .shop-relics {
                    gap: 15px;
                }
            }
            
            /* 모바일 */
            @media (max-width: 768px) {
                .shop-container {
                    padding: 40px 20px;
                }
                
                .shop-letterbox {
                    height: 5%;
                }
                
                .shop-title {
                    font-size: 1.6rem;
                    letter-spacing: 3px;
                }
                
                .shop-subtitle {
                    font-size: 0.85rem;
                }
                
                .shop-gold {
                    padding: 8px 20px;
                }
                
                .gold-amount {
                    font-size: 1.2rem;
                }
                
                .shop-cards, .shop-relics {
                    flex-direction: column;
                    align-items: center;
                }
                
                .shop-card-slot, .shop-relic-slot {
                    width: 100%;
                    max-width: 280px;
                }
                
                .section-line {
                    width: 50px;
                }
                
                .shop-leave-btn {
                    padding: 12px 35px;
                }
                
                .shop-leave-btn .btn-text {
                    font-size: 0.95rem;
                    letter-spacing: 3px;
                }
            }
            
            /* 작은 모바일 */
            @media (max-width: 480px) {
                .shop-container {
                    padding: 35px 15px;
                }
                
                .shop-header {
                    margin-bottom: 20px;
                }
                
                .shop-title {
                    font-size: 1.4rem;
                }
                
                .shop-subtitle {
                    font-size: 0.75rem;
                    margin-bottom: 15px;
                }
                
                .section-title {
                    gap: 10px;
                    margin-bottom: 15px;
                }
                
                .section-text {
                    font-size: 0.8rem;
                    letter-spacing: 3px;
                }
                
                .shop-section {
                    margin-bottom: 20px;
                }
                
                .shop-card-name, .shop-relic-name {
                    font-size: 0.85rem;
                }
                
                .sale-tag {
                    font-size: 0.6rem;
                    padding: 3px 6px;
                }
            }
            
            /* 높이가 낮은 화면 */
            @media (max-height: 600px) {
                .shop-container {
                    padding: 30px 20px;
                }
                
                .shop-letterbox {
                    height: 3%;
                }
                
                .shop-header {
                    margin-bottom: 15px;
                }
                
                .shop-title {
                    font-size: 1.5rem;
                    margin-bottom: 5px;
                }
                
                .shop-section {
                    margin-bottom: 15px;
                }
                
                .shop-leave-btn {
                    margin-top: 15px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 접근
window.ShopEvent = ShopEvent;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    ShopEvent.init();
});

console.log('[Shop] 상점 이벤트 로드 완료');

