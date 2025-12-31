// ==========================================
// Shadow Deck - 캠프 이벤트
// HP 회복 또는 카드 제거 선택
// ==========================================

const CampEvent = {
    // 상태
    isActive: false,
    currentRoom: null,
    stylesInjected: false,
    usedRest: false,        // 휴식 사용 여부
    usedForge: false,       // 단련 사용 여부
    
    // 설정
    config: {
        healPercent: 0.30,      // HP 30% 회복
        healPercentAlt: 0.50,   // 대안: HP 50% 회복 (음식 소모)
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.injectStyles();
        this.stylesInjected = true;
        console.log('[CampEvent] 캠프 이벤트 초기화 완료');
    },
    
    // ==========================================
    // 이벤트 시작
    // ==========================================
    start(room) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentRoom = room;
        this.usedRest = false;
        this.usedForge = false;
        
        // UI 생성
        this.createUI();
        
        console.log('[CampEvent] 캠프 이벤트 시작');
    },
    
    // ==========================================
    // UI 생성 (다크소울 스타일)
    // ==========================================
    createUI() {
        // 기존 UI 제거
        const existing = document.querySelector('.camp-event-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'camp-event-overlay';
        
        const currentHp = gameState.player?.hp || 35;
        const maxHp = gameState.player?.maxHp || 50;
        const healAmount = Math.floor(maxHp * this.config.healPercent);
        const predictedHp = Math.min(maxHp, currentHp + healAmount);
        
        // 사용 여부에 따른 클래스
        const restDisabled = this.usedRest ? 'disabled' : '';
        const forgeDisabled = this.usedForge ? 'disabled' : '';
        
        overlay.innerHTML = `
            <!-- 레터박스 -->
            <div class="camp-letterbox top"></div>
            <div class="camp-letterbox bottom"></div>
            
            <!-- 배경 이미지 -->
            <div class="camp-scene"></div>
            
            <!-- 비네팅 -->
            <div class="camp-vignette"></div>
            
            <!-- 불꽃 글로우 -->
            <div class="camp-fire-glow"></div>
            
            <!-- 불꽃 파티클 -->
            <div class="camp-particles"></div>
            
            <!-- 메인 컨테이너 -->
            <div class="camp-event-container">
                <!-- 메인 컨텐츠 -->
                <div class="camp-content">
                    <!-- 헤더 -->
                    <div class="camp-header">
                        <h1 class="camp-title">BONFIRE</h1>
                        <p class="camp-subtitle">화톳불</p>
                    </div>
                    
                    <!-- 다이얼로그 -->
                    <div class="camp-dialogue">
                        <div class="dialogue-box">
                            <span class="dialogue-text"></span>
                            <span class="dialogue-cursor">▼</span>
                        </div>
                    </div>
                    
                    <!-- 선택지 - 다크소울 스타일 -->
                    <div class="camp-choices">
                        <button class="camp-choice rest ${restDisabled}" data-action="rest" ${this.usedRest ? 'disabled' : ''}>
                            <span class="choice-title">REST</span>
                            <span class="choice-desc">${this.usedRest ? '사용함' : `HP ${Math.floor(this.config.healPercent * 100)}%`}</span>
                        </button>
                        
                        <button class="camp-choice forge ${forgeDisabled}" data-action="forge" ${this.usedForge ? 'disabled' : ''}>
                            <span class="choice-title">FORGE</span>
                            <span class="choice-desc">${this.usedForge ? '사용함' : '카드 제거'}</span>
                        </button>
                        
                        <button class="camp-choice extract" data-action="extract">
                            <span class="choice-title">ESCAPE</span>
                            <span class="choice-desc">마을 귀환</span>
                        </button>
                        
                        <button class="camp-choice leave" data-action="leave">
                            <span class="choice-title">LEAVE</span>
                            <span class="choice-desc">계속 진행</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 애니메이션 시작
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            this.startFireParticles();
            
            // 다이얼로그 타이핑 효과 (DOM 렌더링 후 시작)
            setTimeout(() => this.typeDialogue(), 300);
        });
        
        // 이벤트 바인딩
        this.bindEvents(overlay);
    },
    
    // ==========================================
    // 다이얼로그 타이핑 효과 (언더테일 스타일)
    // ==========================================
    typeDialogue() {
        const dialogues = [
            "따뜻한 불빛이 어둠을 밝히고 있다...",
            "잠시나마 안전한 곳이다.",
        ];
        
        const textEl = document.querySelector('.dialogue-text');
        const cursorEl = document.querySelector('.dialogue-cursor');
        if (!textEl) return;
        
        let dialogueIndex = 0;
        let charIndex = 0;
        let currentText = '';
        
        const typeChar = () => {
            if (dialogueIndex >= dialogues.length) {
                // 모든 대화 끝 - 커서 깜빡임
                if (cursorEl) cursorEl.style.animation = 'cursorBlink 1s infinite';
                return;
            }
            
            const dialogue = dialogues[dialogueIndex];
            
            if (charIndex < dialogue.length) {
                currentText += dialogue[charIndex];
                textEl.textContent = currentText;
                charIndex++;
                setTimeout(typeChar, 40); // 타이핑 속도
            } else {
                // 현재 대화 완료, 잠시 후 다음으로
                setTimeout(() => {
                    dialogueIndex++;
                    if (dialogueIndex < dialogues.length) {
                        currentText = '';
                        charIndex = 0;
                        setTimeout(typeChar, 300);
                    } else {
                        if (cursorEl) cursorEl.style.animation = 'cursorBlink 1s infinite';
                    }
                }, 1500);
            }
        };
        
        // 약간의 딜레이 후 시작
        setTimeout(typeChar, 800);
    },
    
    // ==========================================
    // 이벤트 바인딩
    // ==========================================
    bindEvents(overlay) {
        // 휴식 버튼
        overlay.querySelector('.camp-choice.rest')?.addEventListener('click', () => {
            this.doRest();
        });
        
        // 단련 버튼
        overlay.querySelector('.camp-choice.forge')?.addEventListener('click', () => {
            this.showCardRemoval();
        });
        
        // 탈출 버튼 (마을로 귀환)
        overlay.querySelector('.camp-choice.extract')?.addEventListener('click', () => {
            this.confirmExtraction();
        });
        
        // 나가기 버튼
        overlay.querySelector('.camp-choice.leave')?.addEventListener('click', () => {
            this.close();
        });
    },
    
    // ==========================================
    // 탈출 확인 (마을로 귀환)
    // ==========================================
    confirmExtraction() {
        // 확인 모달 표시
        const confirmModal = document.createElement('div');
        confirmModal.className = 'camp-confirm-modal';
        confirmModal.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-icon">🔮</div>
                <h3 class="confirm-title">탈출</h3>
                <p class="confirm-text">
                    마을로 귀환합니다.<br>
                    현재 덱, 유물, 골드가 <span class="warning">기억</span>으로 환산됩니다.
                </p>
                <div class="confirm-buttons">
                    <button class="confirm-btn yes">귀환하기</button>
                    <button class="confirm-btn no">취소</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        requestAnimationFrame(() => confirmModal.classList.add('visible'));
        
        // 버튼 이벤트
        confirmModal.querySelector('.confirm-btn.yes').addEventListener('click', () => {
            confirmModal.remove();
            this.doExtraction();
        });
        
        confirmModal.querySelector('.confirm-btn.no').addEventListener('click', () => {
            confirmModal.classList.remove('visible');
            setTimeout(() => confirmModal.remove(), 300);
        });
    },
    
    // ==========================================
    // 탈출 실행
    // ==========================================
    doExtraction() {
        // 캠프 화면 숨기기
        const overlay = document.querySelector('.camp-overlay');
        if (overlay) overlay.style.opacity = '0';
        
        // 기억 환산 결과 표시
        if (typeof ExtractionResult !== 'undefined') {
            ExtractionResult.show(() => {
                // 캠프 닫기
                this.close();
                
                // 덱, 유물, 골드 리셋
                this.resetProgress();
                
                // 마을로 이동 (인트로 포함)
                if (typeof TownSystem !== 'undefined') {
                    TownSystem.showWithIntro(true);
                } else if (typeof Town !== 'undefined') {
                    Town.show();
                }
            });
        } else {
            console.error('[CampEvent] ExtractionResult 시스템이 없습니다.');
            this.close();
        }
    },
    
    // ==========================================
    // 진행 상황 리셋
    // ==========================================
    resetProgress() {
        // 덱 초기화 (기본 덱으로)
        if (typeof gameState !== 'undefined') {
            if (typeof createInitialDeck === 'function') {
                gameState.deck = createInitialDeck();
            } else {
                gameState.deck = [];
            }
            
            // 유물 초기화
            gameState.relics = [];
            
            // 골드 초기화
            gameState.gold = 0;
            if (typeof GoldSystem !== 'undefined') {
                GoldSystem.setGold(0);
            }
        }
        
        // MapSystem 리셋
        if (typeof MapSystem !== 'undefined') {
            MapSystem.roomsCleared = 0;
            MapSystem.currentFloor = 1;
        }
        
        console.log('[CampEvent] 진행 상황 리셋 완료');
    },
    
    // ==========================================
    // 휴식 (HP 회복)
    // ==========================================
    doRest() {
        if (this.usedRest) return; // 이미 사용함
        
        const maxHp = gameState.player?.maxHp || 50;
        const healAmount = Math.floor(maxHp * this.config.healPercent);
        const oldHp = gameState.player.hp;
        
        gameState.player.hp = Math.min(maxHp, gameState.player.hp + healAmount);
        const actualHeal = gameState.player.hp - oldHp;
        
        // 사용 표시
        this.usedRest = true;
        
        // TopBar 업데이트
        if (typeof TopBar !== 'undefined') {
            TopBar.updateHP();
        }
        
        // 회복 연출 후 메뉴로 복귀
        this.showRestAnimation(actualHeal, () => {
            this.createUI(); // 메뉴로 돌아가기
        });
        
        console.log(`[CampEvent] 휴식: HP +${actualHeal} (${oldHp} → ${gameState.player.hp})`);
    },
    
    // ==========================================
    // 휴식 연출 (캐릭터 + HP 회복 애니메이션)
    // ==========================================
    showRestAnimation(healAmount, callback) {
        const overlay = document.querySelector('.camp-event-overlay');
        if (!overlay) {
            if (callback) callback();
            return;
        }
        
        // 현재 HP 정보
        const maxHp = gameState?.player?.maxHp || 50;
        const oldHp = Math.max(0, (gameState?.player?.hp || 0) - healAmount); // 회복 전 HP
        const newHp = gameState?.player?.hp || oldHp + healAmount;
        const oldPercent = Math.round((oldHp / maxHp) * 100);
        const newPercent = Math.round((newHp / maxHp) * 100);
        
        // 캐릭터 스프라이트 가져오기
        let characterSprite = 'knight.png'; // 기본
        if (typeof JobSystem !== 'undefined' && JobSystem.currentJob) {
            const job = JobSystem.jobs[JobSystem.currentJob];
            if (job && job.sprite) {
                characterSprite = job.sprite;
            }
        }
        
        const content = overlay.querySelector('.camp-content');
        content.innerHTML = `
            <div class="camp-rest-result">
                <!-- 캐릭터 영역 -->
                <div class="rest-character-area">
                    <div class="rest-heal-glow"></div>
                    <img src="${characterSprite}" class="rest-character-img" alt="Character" onerror="this.src='knight.png'">
                    <div class="rest-heal-particles"></div>
                </div>
                
                <!-- HP 바 -->
                <div class="rest-hp-display">
                    <div class="rest-hp-label">HP</div>
                    <div class="rest-hp-bar-container">
                        <div class="rest-hp-bar-bg"></div>
                        <div class="rest-hp-bar-fill" style="width: ${oldPercent}%"></div>
                        <div class="rest-hp-bar-heal" style="left: ${oldPercent}%; width: 0%"></div>
                    </div>
                    <div class="rest-hp-text">
                        <span class="rest-hp-current">${oldHp}</span>
                        <span class="rest-hp-divider">/</span>
                        <span class="rest-hp-max">${maxHp}</span>
                    </div>
                </div>
                
                <!-- 텍스트 -->
                <div class="rest-text">HUMANITY RESTORED</div>
                <div class="rest-heal-amount">+${healAmount} HP</div>
            </div>
        `;
        
        // 파티클 생성
        const particleContainer = content.querySelector('.rest-heal-particles');
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'heal-particle';
            particle.style.left = `${30 + Math.random() * 40}%`;
            particle.style.animationDelay = `${Math.random() * 1.5}s`;
            particleContainer.appendChild(particle);
        }
        
        // 애니메이션 시작
        setTimeout(() => {
            content.querySelector('.camp-rest-result').classList.add('animate');
        }, 100);
        
        // HP 바 애니메이션 (0.5초 후 시작)
        setTimeout(() => {
            const hpFill = content.querySelector('.rest-hp-bar-fill');
            const hpHeal = content.querySelector('.rest-hp-bar-heal');
            const hpCurrent = content.querySelector('.rest-hp-current');
            
            if (hpFill && hpHeal && hpCurrent) {
                // 회복량 표시
                const healPercent = newPercent - oldPercent;
                hpHeal.style.width = `${healPercent}%`;
                hpHeal.classList.add('animating');
                
                // HP 숫자 카운트업
                this.animateHpCounter(hpCurrent, oldHp, newHp, 1200);
                
                // 1.2초 후 바 합치기
                setTimeout(() => {
                    hpFill.style.width = `${newPercent}%`;
                    hpHeal.style.opacity = '0';
                }, 1200);
            }
        }, 500);
        
        // 캐릭터 글로우 효과
        setTimeout(() => {
            const glow = content.querySelector('.rest-heal-glow');
            if (glow) glow.classList.add('pulse');
        }, 300);
        
        setTimeout(() => {
            if (callback) callback();
        }, 3000);
    },
    
    // HP 숫자 카운트업 애니메이션
    animateHpCounter(element, from, to, duration) {
        const startTime = performance.now();
        const diff = to - from;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // easeOutQuad
            const eased = 1 - (1 - progress) * (1 - progress);
            const current = Math.round(from + diff * eased);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    // ==========================================
    // 카드 제거 UI
    // ==========================================
    showCardRemoval() {
        const overlay = document.querySelector('.camp-event-overlay');
        if (!overlay) return;
        
        const content = overlay.querySelector('.camp-content');
        
        // 덱 가져오기
        const deck = gameState.deck || [];
        
        if (deck.length === 0) {
            this.showMessage('제거할 카드가 없습니다!');
            return;
        }
        
        // 카드 목록 생성
        content.innerHTML = `
            <div class="camp-card-removal">
                <div class="removal-header">
                    <div class="removal-icon">🔥</div>
                    <h3 class="removal-title">단련</h3>
                    <p class="removal-desc">불태울 카드를 선택하세요</p>
                </div>
                
                <div class="dealing-area">
                    <div class="dealing-deck">
                        <div class="deck-card-back"></div>
                        <span class="deck-count">${deck.length}</span>
                    </div>
                    <div class="dealing-hand"></div>
                </div>
                
                <div class="dealing-controls">
                    <button class="deal-btn" data-action="deal">카드 펼치기</button>
                    <button class="removal-cancel-btn">취소</button>
                </div>
            </div>
        `;
        
        // 덱 데이터 저장
        this.removalDeck = deck;
        
        // 카드 펼치기 버튼
        content.querySelector('.deal-btn').addEventListener('click', () => {
            this.dealCardsForRemoval();
        });
        
        // 취소 버튼
        content.querySelector('.removal-cancel-btn').addEventListener('click', () => {
            this.createUI(); // 메인 UI로 돌아가기
        });
    },
    
    // ==========================================
    // 카드 딜링 애니메이션
    // ==========================================
    dealCardsForRemoval() {
        const hand = document.querySelector('.dealing-hand');
        const dealBtn = document.querySelector('.deal-btn');
        const deckEl = document.querySelector('.dealing-deck');
        
        if (!hand || !this.removalDeck) return;
        
        // 버튼 숨기기
        dealBtn.style.display = 'none';
        
        // 카드 하나씩 딜링
        this.removalDeck.forEach((card, index) => {
            setTimeout(() => {
                const cardEl = this.createDealingCard(card, index);
                hand.appendChild(cardEl);
                
                // 덱에서 나오는 애니메이션
                requestAnimationFrame(() => {
                    cardEl.classList.add('dealt');
                    
                    // 덱 카운트 업데이트
                    const countEl = deckEl.querySelector('.deck-count');
                    if (countEl) {
                        countEl.textContent = this.removalDeck.length - index - 1;
                    }
                });
                
                // 마지막 카드 딜링 후 덱 숨기기
                if (index === this.removalDeck.length - 1) {
                    setTimeout(() => {
                        deckEl.style.opacity = '0';
                    }, 300);
                }
            }, index * 100); // 100ms 간격으로 딜링
        });
    },
    
    // ==========================================
    // 딜링 카드 생성
    // ==========================================
    createDealingCard(card, index) {
        const cardType = card.type?.id || card.type || 'skill';
        const icon = card.icon || '📜';
        const iconHtml = typeof icon === 'string' && (icon.includes('.png') || icon.includes('.jpg') || icon.includes('.svg'))
            ? `<img src="${icon}" class="deal-card-icon-img" alt="${card.name}">`
            : `<span class="deal-card-icon-emoji">${icon}</span>`;
        
        const cardEl = document.createElement('div');
        cardEl.className = `deal-card ${cardType}`;
        cardEl.dataset.index = index;
        cardEl.innerHTML = `
            <div class="deal-card-inner">
                <div class="deal-card-cost">${card.cost}</div>
                <div class="deal-card-icon">${iconHtml}</div>
                <div class="deal-card-name">${card.name}</div>
                <div class="deal-card-desc">${card.description || ''}</div>
            </div>
        `;
        
        // 클릭 이벤트
        cardEl.addEventListener('click', () => {
            this.confirmCardRemoval(index, cardEl);
        });
        
        return cardEl;
    },
    
    // ==========================================
    // 카드 제거 확인
    // ==========================================
    confirmCardRemoval(index, cardEl) {
        const card = gameState.deck[index];
        if (!card) return;
        
        // 선택된 카드 표시
        document.querySelectorAll('.removal-card').forEach(el => el.classList.remove('selected'));
        cardEl.classList.add('selected');
        
        // 확인 모달
        const existingConfirm = document.querySelector('.removal-confirm-modal');
        if (existingConfirm) existingConfirm.remove();
        
        const confirmModal = document.createElement('div');
        confirmModal.className = 'removal-confirm-modal';
        confirmModal.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-card-preview">
                    <span class="confirm-icon">${card.icon || '📜'}</span>
                    <span class="confirm-name">${card.name}</span>
                </div>
                <p class="confirm-text">이 카드를 제거하시겠습니까?</p>
                <div class="confirm-buttons">
                    <button class="confirm-yes">제거</button>
                    <button class="confirm-no">취소</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        requestAnimationFrame(() => confirmModal.classList.add('visible'));
        
        // 확인
        confirmModal.querySelector('.confirm-yes').addEventListener('click', () => {
            confirmModal.remove();
            this.removeCard(index, card);
        });
        
        // 취소
        confirmModal.querySelector('.confirm-no').addEventListener('click', () => {
            confirmModal.remove();
            cardEl.classList.remove('selected');
        });
    },
    
    // ==========================================
    // 카드 제거 실행
    // ==========================================
    removeCard(index, card) {
        // 덱에서 제거
        gameState.deck.splice(index, 1);
        
        console.log(`[CampEvent] 카드 제거: ${card.name}`);
        
        // 카드 소멸 연출
        if (typeof CardAnimation !== 'undefined') {
            CardAnimation.cardExhaust({
                cost: card.cost,
                cardType: card.type?.id || card.type || 'skill',
                icon: card.icon || '📜',
                name: card.name,
                description: card.description || ''
            });
        }
        
        // 사용 표시
        this.usedForge = true;
        
        // 결과 표시 후 메뉴로 복귀
        this.showRemovalResult(card, () => {
            this.createUI(); // 메뉴로 돌아가기
        });
    },
    
    // ==========================================
    // 제거 결과 표시 (다크소울 스타일)
    // ==========================================
    showRemovalResult(card, callback) {
        const overlay = document.querySelector('.camp-event-overlay');
        if (!overlay) {
            if (callback) callback();
            return;
        }
        
        const content = overlay.querySelector('.camp-content');
        content.innerHTML = `
            <div class="camp-removal-result">
                <img src="campfire.png" class="rest-scene-img" alt="Bonfire" onerror="this.style.display='none'">
                <div class="removal-result-text">CARD BURNED</div>
                <div class="removal-result-card">${card.name}</div>
            </div>
        `;
        
        setTimeout(() => {
            content.querySelector('.camp-removal-result').classList.add('animate');
        }, 100);
        
        setTimeout(() => {
            if (callback) callback();
        }, 2000);
    },
    
    // ==========================================
    // 불꽃 파티클
    // ==========================================
    startFireParticles() {
        const container = document.querySelector('.camp-particles');
        if (!container) return;
        
        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'fire-particle';
            
            // 중앙 기준 좌우로 퍼지게
            const xPos = 40 + Math.random() * 20;
            const drift = (Math.random() - 0.5) * 60; // 좌우 흔들림
            
            particle.style.left = `${xPos}%`;
            particle.style.setProperty('--drift', `${drift}px`);
            particle.style.animationDuration = `${2 + Math.random() * 1.5}s`;
            particle.style.width = `${3 + Math.random() * 3}px`;
            particle.style.height = particle.style.width;
            
            container.appendChild(particle);
            
            setTimeout(() => particle.remove(), 4000);
        };
        
        // 초기 파티클
        for (let i = 0; i < 8; i++) {
            setTimeout(() => createParticle(), i * 150);
        }
        
        // 주기적 생성
        this.particleInterval = setInterval(createParticle, 200);
    },
    
    // ==========================================
    // 종료
    // ==========================================
    close() {
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
            this.particleInterval = null;
        }
        
        const overlay = document.querySelector('.camp-event-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 400);
        }
        
        // 방 클리어 처리
        if (this.currentRoom) {
            this.currentRoom.cleared = true;
            if (typeof MapSystem !== 'undefined') {
                MapSystem.roomsCleared++;
                MapSystem.updateUI();
                MapSystem.renderMinimap();
                
                // 맵 화면으로 돌아가기
                setTimeout(() => {
                    MapSystem.showMap();
                }, 450);
            }
        }
        
        this.isActive = false;
        this.currentRoom = null;
        
        console.log('[CampEvent] 캠프 이벤트 종료');
    },
    
    // ==========================================
    // 메시지 표시
    // ==========================================
    showMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'camp-message';
        msg.textContent = text;
        document.body.appendChild(msg);
        
        requestAnimationFrame(() => msg.classList.add('visible'));
        
        setTimeout(() => {
            msg.classList.remove('visible');
            setTimeout(() => msg.remove(), 300);
        }, 2000);
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    getCardTypeName(type) {
        const names = {
            attack: '공격',
            skill: '스킬',
            power: '파워',
            status: '상태',
            curse: '저주'
        };
        return names[type] || '카드';
    },
    
    // ==========================================
    // 스타일 주입 (다크소울 테마)
    // ==========================================
    injectStyles() {
        if (document.getElementById('camp-event-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'camp-event-styles';
        style.textContent = `
            /* ==========================================
               캠프 이벤트 오버레이 - 전체 화면
               ========================================== */
            .camp-event-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: #000;
                z-index: 9000;
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            .camp-event-overlay.visible {
                opacity: 1;
            }
            
            /* 컨테이너 - 전체 화면 flex */
            .camp-event-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 80px 40px 60px;
                box-sizing: border-box;
                overflow-y: auto;
                z-index: 3;
            }
            
            /* 레터박스 */
            .camp-letterbox {
                position: absolute;
                left: 0;
                width: 100%;
                height: 4%;
                background: #000;
                z-index: 10;
                pointer-events: none;
            }
            .camp-letterbox.top { top: 0; }
            .camp-letterbox.bottom { bottom: 0; }
            
            /* 배경 이미지 - 전체 화면 */
            .camp-scene {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: 
                    linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.6) 100%),
                    url('campfire.png') center center / cover no-repeat;
                z-index: 0;
            }
            
            .camp-scene-img {
                display: none;
            }
            
            /* 비네팅 효과 */
            .camp-vignette {
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
            
            /* 불꽃 글로우 효과 */
            .camp-fire-glow {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 50%;
                background: radial-gradient(ellipse at center bottom, 
                    rgba(255, 150, 50, 0.25) 0%, 
                    rgba(255, 100, 30, 0.1) 40%,
                    transparent 70%);
                pointer-events: none;
                animation: glowPulse 2s ease-in-out infinite;
                z-index: 2;
            }
            
            @keyframes glowPulse {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }
            
            /* 불꽃 파티클 */
            .camp-particles {
                position: fixed;
                bottom: 30%;
                left: 50%;
                transform: translateX(-50%);
                width: 400px;
                height: 300px;
                pointer-events: none;
                overflow: visible;
                z-index: 3;
            }
            
            .fire-particle {
                position: absolute;
                bottom: 0;
                width: 4px;
                height: 4px;
                background: #ff9933;
                border-radius: 50%;
                animation: particleRise 2.5s ease-out forwards;
            }
            
            @keyframes particleRise {
                0% { 
                    transform: translateY(0) scale(1); 
                    opacity: 0.9;
                    background: #ff6600;
                }
                50% {
                    opacity: 0.7;
                    background: #ffaa33;
                }
                100% { 
                    transform: translateY(-250px) translateX(var(--drift, 0px)) scale(0); 
                    opacity: 0;
                    background: #ffcc00;
                }
            }
            
            /* 메인 컨텐츠 - 전체 화면에서 중앙 (배경 없음) */
            .camp-content {
                position: relative;
                z-index: 10;
                text-align: center;
                width: 100%;
                max-width: 800px;
                padding: 40px;
                background: transparent;
            }
            
            /* 타이틀 헤더 - 다크소울 스타일 */
            .camp-header {
                margin-bottom: 50px;
            }
            
            .camp-title {
                font-family: 'Cinzel', serif;
                font-size: 3rem;
                color: #d4af37;
                text-shadow: 
                    0 0 40px rgba(212, 175, 55, 0.4),
                    2px 2px 6px rgba(0, 0, 0, 0.9);
                letter-spacing: 12px;
                margin-bottom: 15px;
                font-weight: 400;
            }
            
            .camp-subtitle {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.1rem;
                color: #888;
                letter-spacing: 2px;
                text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
            }
            
            /* 다이얼로그 - 다크소울 스타일 */
            .camp-dialogue {
                margin-bottom: 40px;
            }
            
            .dialogue-box {
                background: rgba(0, 0, 0, 0.5);
                border: none;
                border-top: 1px solid rgba(212, 175, 55, 0.3);
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 0;
                padding: 25px 40px;
                max-width: 550px;
                margin: 0 auto;
                min-height: 50px;
                position: relative;
            }
            
            .dialogue-text {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.1rem;
                color: #c9b896;
                line-height: 1.9;
                letter-spacing: 1px;
                text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
            }
            
            .dialogue-cursor {
                position: absolute;
                bottom: 8px;
                right: 20px;
                color: #d4af37;
                font-size: 0.8rem;
                opacity: 0;
            }
            
            @keyframes cursorBlink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            
            /* 선택지 - 다크소울 스타일 세로 메뉴 */
            .camp-choices {
                display: flex;
                flex-direction: column;
                gap: 0;
                position: relative;
                z-index: 10;
                max-width: 400px;
                margin: 0 auto;
            }
            
            .camp-choices.compact {
                gap: 0;
            }
            
            .camp-choice {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                gap: 15px;
                padding: 18px 50px;
                background: transparent;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .camp-choices.compact .camp-choice {
                padding: 16px 45px;
            }
            
            /* 선택 인디케이터 */
            .camp-choice::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 2px;
                background: #d4af37;
                transition: width 0.3s ease;
            }
            
            .camp-choice::after {
                content: '';
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 2px;
                background: #d4af37;
                transition: width 0.3s ease;
            }
            
            /* 비활성화 상태 */
            .camp-choice.disabled {
                opacity: 0.3;
                cursor: not-allowed;
                pointer-events: none;
            }
            
            .camp-choice.disabled .choice-title {
                color: #444;
                text-decoration: line-through;
            }
            
            .camp-choice:hover::before,
            .camp-choice:hover::after {
                width: 30px;
            }
            
            .camp-choice:hover .choice-title {
                color: #d4af37;
                text-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
            }
            
            .camp-choice:hover .choice-desc {
                color: #a89070;
            }
            
            .choice-title {
                font-family: 'Cinzel', serif;
                font-size: 1.4rem;
                color: #b8a878;
                font-weight: 400;
                letter-spacing: 4px;
                transition: all 0.2s ease;
                text-transform: uppercase;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.5);
            }
            
            .camp-choices.compact .choice-title {
                font-size: 1.3rem;
            }
            
            .choice-desc {
                color: #888;
                font-size: 0.85rem;
                font-family: 'Noto Sans KR', sans-serif;
                transition: all 0.2s ease;
                text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.9);
            }
            
            .camp-choices.compact .choice-desc {
                font-size: 0.8rem;
            }
            
            /* 휴식 - 초록빛 */
            .camp-choice.rest:hover::before,
            .camp-choice.rest:hover::after {
                background: #4ade80;
            }
            
            .camp-choice.rest:hover .choice-title {
                color: #4ade80;
                text-shadow: 0 0 20px rgba(74, 222, 128, 0.6);
            }
            
            /* 단련 - 붉은빛 */
            .camp-choice.forge:hover::before,
            .camp-choice.forge:hover::after {
                background: #f87171;
            }
            
            .camp-choice.forge:hover .choice-title {
                color: #f87171;
                text-shadow: 0 0 20px rgba(248, 113, 113, 0.6);
            }
            
            /* 탈출 - 보라빛 */
            .camp-choice.extract:hover::before,
            .camp-choice.extract:hover::after {
                background: #a855f7;
            }
            
            .camp-choice.extract:hover .choice-title {
                color: #a855f7;
                text-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
            }
            
            /* 떠나기 - 금빛 */
            .camp-choice.leave:hover::before,
            .camp-choice.leave:hover::after {
                background: #d4af37;
            }
            
            .camp-choice.leave:hover .choice-title {
                color: #d4af37;
                text-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
            }
            
            /* ==========================================
               휴식 결과 - 캐릭터 + HP 애니메이션
               ========================================== */
            .camp-rest-result {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                opacity: 0;
                transform: scale(0.95);
                transition: all 0.6s ease;
                padding: 50px 70px;
                background: rgba(10, 10, 15, 0.9);
                border-radius: 16px;
                backdrop-filter: blur(12px);
                box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(74, 222, 128, 0.25);
                min-width: 320px;
                max-width: 400px;
            }
            
            .camp-rest-result.animate {
                opacity: 1;
                transform: scale(1);
            }
            
            /* 캐릭터 영역 */
            .rest-character-area {
                position: relative;
                width: 140px;
                height: 140px;
                margin-bottom: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .rest-character-img {
                width: 100px;
                height: 100px;
                image-rendering: pixelated;
                object-fit: contain;
                position: relative;
                z-index: 2;
                filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.6));
                animation: restCharacterFloat 2.5s ease-in-out infinite;
            }
            
            @keyframes restCharacterFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            
            .rest-heal-glow {
                position: absolute;
                inset: -30px;
                background: radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, transparent 60%);
                border-radius: 50%;
                opacity: 0;
                transition: opacity 0.5s ease;
                z-index: 1;
            }
            
            .rest-heal-glow.pulse {
                opacity: 1;
                animation: healGlowPulse 1.5s ease-in-out infinite;
            }
            
            @keyframes healGlowPulse {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.3); opacity: 1; }
            }
            
            /* 힐 파티클 */
            .rest-heal-particles {
                position: absolute;
                inset: -20px;
                pointer-events: none;
                z-index: 3;
            }
            
            .heal-particle {
                position: absolute;
                bottom: 20%;
                width: 5px;
                height: 5px;
                background: #4ade80;
                border-radius: 50%;
                opacity: 0;
                animation: healParticleFloat 2s ease-out infinite;
                box-shadow: 0 0 8px #4ade80;
            }
            
            @keyframes healParticleFloat {
                0% { opacity: 0; transform: translateY(0) scale(0.5); }
                15% { opacity: 1; }
                100% { opacity: 0; transform: translateY(-80px) scale(0); }
            }
            
            /* HP 바 디스플레이 */
            .rest-hp-display {
                width: 100%;
                margin-bottom: 30px;
            }
            
            .rest-hp-label {
                font-family: 'Cinzel', serif;
                font-size: 0.75rem;
                color: #666;
                letter-spacing: 4px;
                margin-bottom: 10px;
                text-transform: uppercase;
            }
            
            .rest-hp-bar-container {
                position: relative;
                width: 100%;
                height: 18px;
                border-radius: 9px;
                overflow: hidden;
                margin-bottom: 12px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(80, 80, 80, 0.4);
            }
            
            .rest-hp-bar-bg {
                display: none;
            }
            
            .rest-hp-bar-fill {
                position: absolute;
                top: 3px;
                left: 3px;
                bottom: 3px;
                background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
                border-radius: 6px;
                transition: width 0.8s ease-out;
                box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
            }
            
            .rest-hp-bar-heal {
                position: absolute;
                top: 3px;
                bottom: 3px;
                background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
                border-radius: 6px;
                transition: width 1s ease-out, opacity 0.3s ease;
                box-shadow: 0 0 12px rgba(74, 222, 128, 0.6);
            }
            
            .rest-hp-bar-heal.animating {
                animation: healBarPulse 0.3s ease infinite;
            }
            
            @keyframes healBarPulse {
                0%, 100% { filter: brightness(1); }
                50% { filter: brightness(1.4); }
            }
            
            .rest-hp-text {
                font-family: 'Cinzel', serif;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            
            .rest-hp-current {
                color: #4ade80;
                font-weight: bold;
                font-size: 1.4rem;
                text-shadow: 0 0 12px rgba(74, 222, 128, 0.5);
                min-width: 40px;
            }
            
            .rest-hp-divider {
                color: #555;
            }
            
            .rest-hp-max {
                color: #777;
            }
            
            /* 텍스트 */
            .rest-text {
                font-family: 'Cinzel', serif;
                font-size: 1.6rem;
                color: #e8dcc4;
                margin-bottom: 12px;
                letter-spacing: 6px;
                text-shadow: 0 0 25px rgba(74, 222, 128, 0.3);
                text-transform: uppercase;
            }
            
            .rest-heal-amount {
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                color: #4ade80;
                font-weight: 600;
                text-shadow: 0 0 25px rgba(74, 222, 128, 0.6);
                animation: healAmountPop 0.5s ease 0.5s both;
            }
            
            @keyframes healAmountPop {
                0% { transform: scale(0.5); opacity: 0; }
                60% { transform: scale(1.15); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            /* 반응형 */
            @media (max-width: 500px) {
                .camp-rest-result {
                    padding: 35px 40px;
                    min-width: 280px;
                }
                .rest-character-area {
                    width: 110px;
                    height: 110px;
                }
                .rest-character-img {
                    width: 80px;
                    height: 80px;
                }
                .rest-text {
                    font-size: 1.3rem;
                    letter-spacing: 4px;
                }
                .rest-heal-amount {
                    font-size: 1.2rem;
                }
            }
            
            /* ==========================================
               카드 제거 UI
               ========================================== */
            .camp-card-removal {
                text-align: center;
                width: 100%;
                max-width: 900px;
                padding: 40px;
                background: rgba(10, 10, 15, 0.8);
                border-radius: 12px;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 40px rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(248, 113, 113, 0.3);
            }
            
            .removal-header {
                margin-bottom: 25px;
            }
            
            .removal-title {
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                color: #e8dcc4;
                margin: 0 0 8px;
                letter-spacing: 4px;
            }
            
            .removal-desc {
                color: #888;
                font-size: 0.85rem;
                margin: 0;
            }
            
            /* 카드 컨테이너 */
            .removal-cards-container {
                max-height: 350px;
                overflow-y: auto;
                margin-bottom: 20px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            }
            
            .removal-cards-container::-webkit-scrollbar {
                width: 4px;
            }
            
            .removal-cards-container::-webkit-scrollbar-thumb {
                background: rgba(212, 175, 55, 0.3);
                border-radius: 2px;
            }
            
            .removal-cards {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
                gap: 10px;
            }
            
            /* 제거할 카드 */
            .removal-card {
                background: linear-gradient(160deg, #1a1a24 0%, #12121a 100%);
                border: 1px solid #333;
                border-radius: 8px;
                padding: 12px 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .removal-card:hover {
                transform: translateY(-5px);
                border-color: #d4af37;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
            }
            
            .removal-card.attack { border-color: #8b3a3a; }
            .removal-card.attack:hover { border-color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
            
            .removal-card.skill { border-color: #2a4a6a; }
            .removal-card.skill:hover { border-color: #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
            
            .removal-card.power { border-color: #4a2a5a; }
            .removal-card.power:hover { border-color: #a855f7; box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
            
            .removal-card.selected {
                border-color: #ef4444 !important;
                box-shadow: 0 0 25px rgba(239, 68, 68, 0.5) !important;
                transform: translateY(-5px) scale(1.05);
            }
            
            .removal-card-cost {
                position: absolute;
                top: -6px;
                left: -6px;
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, #d4af37, #b8962e);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 0.75rem;
                color: #000;
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .removal-card-icon {
                font-size: 1.8rem;
                margin-bottom: 6px;
            }
            
            .removal-card-icon img {
                width: 36px;
                height: 36px;
                object-fit: contain;
                image-rendering: pixelated;
            }
            
            .removal-card-name {
                font-size: 0.7rem;
                color: #a89070;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .removal-card-type {
                font-size: 0.6rem;
                color: #555;
                margin-top: 3px;
            }
            
            .removal-cancel-btn {
                padding: 14px 40px;
                background: rgba(25, 25, 30, 0.95);
                border: 1px solid #555;
                border-radius: 6px;
                color: #888;
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                letter-spacing: 2px;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            }
            
            .removal-cancel-btn:hover {
                border-color: #d4af37;
                color: #d4af37;
                box-shadow: 0 6px 25px rgba(212, 175, 55, 0.2);
            }
            
            /* ==========================================
               딜링 UI 스타일
               ========================================== */
            .dealing-area {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 35px;
                margin-bottom: 30px;
                padding: 40px;
                background: rgba(10, 10, 15, 0.8);
                border-radius: 12px;
                backdrop-filter: blur(10px);
                box-shadow: 0 0 40px rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(248, 113, 113, 0.3);
                width: 100%;
                max-width: 900px;
            }
            
            .dealing-deck {
                position: relative;
                width: 90px;
                height: 125px;
                transition: opacity 0.5s ease;
            }
            
            .deck-card-back {
                width: 100%;
                height: 100%;
                background: linear-gradient(145deg, #2a2a3a 0%, #1a1a24 100%);
                border: 2px solid #d4af37;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
                border-radius: 8px;
                box-shadow: 
                    3px 3px 0 rgba(212, 175, 55, 0.3),
                    6px 6px 0 rgba(212, 175, 55, 0.2),
                    9px 9px 0 rgba(212, 175, 55, 0.1);
            }
            
            .deck-card-back::after {
                content: '🔥';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2rem;
                filter: drop-shadow(0 0 10px rgba(255, 150, 50, 0.8));
            }
            
            .deck-count {
                position: absolute;
                bottom: -10px;
                right: -10px;
                background: linear-gradient(135deg, #d4af37, #b8962e);
                color: #000;
                font-weight: bold;
                font-size: 0.8rem;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            .dealing-hand {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 12px;
                max-width: 600px;
                min-height: 180px;
                padding: 10px;
            }
            
            /* 딜링 카드 */
            .deal-card {
                width: 110px;
                height: 160px;
                background: linear-gradient(160deg, #1a1a24 0%, #12121a 100%);
                border: 2px solid #333;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                opacity: 0;
                transform: translateY(-50px) scale(0.8);
            }
            
            .deal-card.dealt {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            
            .deal-card:hover {
                transform: translateY(-10px) scale(1.08);
                z-index: 10;
            }
            
            .deal-card.attack { border-color: #8b3a3a; }
            .deal-card.attack:hover { 
                border-color: #ef4444; 
                box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4); 
            }
            
            .deal-card.skill { border-color: #2a4a6a; }
            .deal-card.skill:hover { 
                border-color: #3b82f6; 
                box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4); 
            }
            
            .deal-card.power { border-color: #4a2a5a; }
            .deal-card.power:hover { 
                border-color: #a855f7; 
                box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4); 
            }
            
            .deal-card.selected {
                border-color: #ef4444 !important;
                box-shadow: 0 0 30px rgba(239, 68, 68, 0.6) !important;
                transform: translateY(-15px) scale(1.1);
            }
            
            .deal-card-inner {
                height: 100%;
                display: flex;
                flex-direction: column;
                padding: 8px;
            }
            
            .deal-card-cost {
                position: absolute;
                top: -8px;
                left: -8px;
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #d4af37, #b8962e);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 0.9rem;
                color: #000;
                border: 2px solid rgba(255, 255, 255, 0.3);
                z-index: 2;
            }
            
            .deal-card-icon {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.5rem;
            }
            
            .deal-card-icon-img {
                width: 60px;
                height: 60px;
                object-fit: contain;
                image-rendering: pixelated;
            }
            
            .deal-card-icon-emoji {
                font-size: 2.5rem;
            }
            
            .deal-card-name {
                font-family: 'Cinzel', serif;
                font-size: 0.75rem;
                color: #e8dcc4;
                text-align: center;
                padding: 6px 0;
                background: rgba(0, 0, 0, 0.4);
                margin: 0 -8px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .deal-card-desc {
                font-size: 0.6rem;
                color: #888;
                text-align: center;
                padding: 4px;
                line-height: 1.3;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            /* 딜링 컨트롤 */
            .dealing-controls {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .deal-btn {
                padding: 12px 35px;
                background: linear-gradient(135deg, #d4af37, #b8962e);
                border: none;
                border-radius: 4px;
                color: #000;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                font-weight: bold;
                letter-spacing: 2px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .deal-btn:hover {
                box-shadow: 0 0 25px rgba(212, 175, 55, 0.6);
                transform: translateY(-2px);
            }
            
            /* ==========================================
               확인 모달
               ========================================== */
            .removal-confirm-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .removal-confirm-modal.visible {
                opacity: 1;
            }
            
            .confirm-content {
                background: #0a0a0f;
                border: 1px solid #d4af37;
                border-radius: 4px;
                padding: 30px 40px;
                text-align: center;
                max-width: 320px;
            }
            
            .confirm-card-preview {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 4px;
            }
            
            .confirm-icon {
                font-size: 2rem;
            }
            
            .confirm-name {
                font-family: 'Cinzel', serif;
                font-size: 1.1rem;
                color: #e8dcc4;
            }
            
            .confirm-text {
                color: #666;
                margin-bottom: 25px;
                font-size: 0.9rem;
            }
            
            .confirm-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .confirm-yes {
                padding: 10px 30px;
                background: transparent;
                border: 1px solid #ef4444;
                border-radius: 4px;
                color: #ef4444;
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                letter-spacing: 2px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .confirm-yes:hover {
                background: rgba(239, 68, 68, 0.2);
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
            }
            
            .confirm-no {
                padding: 10px 30px;
                background: transparent;
                border: 1px solid #555;
                border-radius: 4px;
                color: #888;
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                letter-spacing: 2px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .confirm-no:hover {
                border-color: #888;
                color: #ccc;
            }
            
            /* ==========================================
               제거 결과
               ========================================== */
            .camp-removal-result {
                text-align: center;
                opacity: 0;
                transform: scale(0.95);
                transition: all 0.6s ease;
            }
            
            .camp-removal-result.animate {
                opacity: 1;
                transform: scale(1);
            }
            
            .removal-result-text {
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                color: #e8dcc4;
                margin-bottom: 15px;
                letter-spacing: 4px;
            }
            
            .removal-result-card {
                font-size: 1.1rem;
                color: #ef4444;
                text-decoration: line-through;
                opacity: 0.6;
            }
            
            /* 메시지 */
            .camp-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                padding: 15px 30px;
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid #d4af37;
                border-radius: 4px;
                color: #e8dcc4;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                letter-spacing: 2px;
                opacity: 0;
                transition: all 0.3s;
                z-index: 10002;
            }
            
            .camp-message.visible {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            
            /* 반응형 */
            @media (max-width: 480px) {
                .camp-title {
                    font-size: 1.5rem;
                    letter-spacing: 5px;
                }
                
                .camp-scene {
                    background-size: cover;
                }
                
                .camp-content {
                    bottom: 5%;
                    max-width: 95%;
                }
                
                .dialogue-box {
                    padding: 14px 18px;
                }
                
                .dialogue-text {
                    font-size: 1rem;
                }
                
                .camp-choice {
                    padding: 12px 20px;
                }
                
                .choice-title {
                    font-size: 1.1rem;
                }
                
                .dealing-hand {
                    max-width: 100%;
                }
                
                .deal-card {
                    width: 90px;
                    height: 130px;
                }
                
                .deal-card-icon-img {
                    width: 45px;
                    height: 45px;
                }
                
                .deal-card-name {
                    font-size: 0.65rem;
                }
                
                .removal-cards {
                    grid-template-columns: repeat(3, 1fr);
                }
            }
            
            /* ==========================================
               탈출 버튼 스타일
               ========================================== */
            .camp-choice.extract {
                margin-top: 15px;
                border-top: 1px solid rgba(168, 85, 247, 0.3);
                padding-top: 20px;
            }
            
            .camp-choice.extract:hover .choice-title {
                color: #a855f7;
                text-shadow: 0 0 20px rgba(168, 85, 247, 0.7);
            }
            
            .camp-choice.extract:hover::before {
                background: rgba(168, 85, 247, 0.15);
            }
            
            /* ==========================================
               탈출 확인 모달
               ========================================== */
            .camp-confirm-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 11000;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(8px);
            }
            
            .camp-confirm-modal.visible {
                opacity: 1;
            }
            
            .confirm-content {
                text-align: center;
                max-width: 500px;
                padding: 55px 60px;
                background: rgba(10, 10, 15, 0.95);
                border: 1px solid rgba(168, 85, 247, 0.4);
                border-radius: 12px;
                box-shadow: 0 0 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(168, 85, 247, 0.15);
                backdrop-filter: blur(15px);
            }
            
            .confirm-icon {
                font-size: 4rem;
                margin-bottom: 20px;
                filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.8));
            }
            
            .confirm-title {
                font-family: 'Cinzel', serif;
                font-size: 2rem;
                color: #e8dcc4;
                margin: 0 0 25px;
                letter-spacing: 6px;
            }
            
            .confirm-text {
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 1.1rem;
                color: #999;
                line-height: 1.9;
                margin-bottom: 35px;
            }
            
            .confirm-text .warning {
                color: #a855f7;
                font-weight: bold;
            }
            
            .confirm-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .confirm-btn {
                padding: 14px 35px;
                font-family: 'Cinzel', serif;
                font-size: 1rem;
                letter-spacing: 2px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            }
            
            .confirm-btn.yes {
                background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
                color: #fff;
                border: 1px solid rgba(168, 85, 247, 0.6);
            }
            
            .confirm-btn.yes:hover {
                box-shadow: 0 6px 30px rgba(168, 85, 247, 0.5);
                transform: translateY(-3px);
            }
            
            .confirm-btn.no {
                background: rgba(25, 25, 30, 0.95);
                border: 1px solid #555;
                color: #888;
            }
            
            .confirm-btn.no:hover {
                border-color: #888;
                color: #ccc;
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
            }
        `;
        
        document.head.appendChild(style);
    }
};

// 전역 접근
window.CampEvent = CampEvent;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    CampEvent.init();
});

console.log('[CampEvent] 캠프 이벤트 시스템 로드 완료');

