// ==========================================
// Card Drag & Drop System
// 카드 드래그 & 드롭 시스템
// ==========================================

const CardDragSystem = {
    draggedCard: null,
    dragGhost: null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    currentDragX: 0,
    currentDragY: 0,

    // 카드에 드래그 이벤트 설정
    setup(cardEl, index, card) {
        cardEl.addEventListener('mousedown', (e) => {
            this.startDrag(e, cardEl, index, card);
        });
        
        cardEl.addEventListener('touchstart', (e) => {
            this.startDrag(e, cardEl, index, card);
        }, { passive: true });
    },

    // 드래그 시작
    startDrag(e, cardEl, index, card) {
        if (!gameState.isPlayerTurn) return;
        if (card.cost > gameState.player.energy) return;
        if (card.unplayable) return;

        // 시작 위치 저장
        if (e.type === 'touchstart') {
            this.dragStartX = e.touches[0].clientX;
            this.dragStartY = e.touches[0].clientY;
        } else {
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        }

        this.currentDragX = this.dragStartX;
        this.currentDragY = this.dragStartY;

        this.draggedCard = { el: cardEl, index, card };

        // 전역 이벤트 등록
        document.addEventListener('mousemove', this.onDragMove);
        document.addEventListener('mouseup', this.onDragEnd);
        document.addEventListener('touchmove', this.onDragMove, { passive: false });
        document.addEventListener('touchend', this.onDragEnd);
        
        // 드래그 시작 시 호버 효과 비활성화
        if (typeof HandManager !== 'undefined') {
            HandManager.hoveredCardIndex = -1;
        }
    },

    // 드래그 이동
    onDragMove: function(e) {
        const self = CardDragSystem;
        if (!self.draggedCard) return;

        let newX, newY;
        if (e.type === 'touchmove') {
            newX = e.touches[0].clientX;
            newY = e.touches[0].clientY;
        } else {
            newX = e.clientX;
            newY = e.clientY;
        }

        // 일정 거리 이상 움직여야 드래그 시작
        const distance = Math.sqrt(
            Math.pow(newX - self.dragStartX, 2) + 
            Math.pow(newY - self.dragStartY, 2)
        );

        if (distance > 10 && !self.isDragging) {
            self.isDragging = true;
            self.createGhost(self.draggedCard.el, self.draggedCard.card);
            self.draggedCard.el.style.opacity = '0.3';
            self.highlightValidTargets(self.draggedCard.card);
            
            // 타겟팅 라인 시작
            if (typeof TargetingLine !== 'undefined') {
                TargetingLine.create();
            }
        }

        if (self.isDragging && self.dragGhost) {
            e.preventDefault();
            self.currentDragX = newX;
            self.currentDragY = newY;
            self.updateGhostPosition(self.currentDragX, self.currentDragY);
            self.checkDropTarget(self.draggedCard.card, self.currentDragX, self.currentDragY);
            
            // 타겟팅 라인 업데이트
            if (typeof TargetingLine !== 'undefined') {
                const cardType = self.draggedCard.el.dataset.type || 'attack';
                const targetType = self.getCardTarget(self.draggedCard.card);
                TargetingLine.update(
                    self.dragStartX, self.dragStartY,
                    self.currentDragX, self.currentDragY,
                    cardType, targetType
                );
            }
        }
    },

    // 드래그 종료
    onDragEnd: function(e) {
        const self = CardDragSystem;
        
        document.removeEventListener('mousemove', self.onDragMove);
        document.removeEventListener('mouseup', self.onDragEnd);
        document.removeEventListener('touchmove', self.onDragMove);
        document.removeEventListener('touchend', self.onDragEnd);

        if (!self.draggedCard) return;

        const cardEl = self.draggedCard.el;
        const card = self.draggedCard.card;
        const cardIndex = self.draggedCard.index;
        const cardType = cardEl.dataset.type || 'attack';

        cardEl.style.opacity = '';
        self.clearTargetHighlights();
        self.hideInvalidTargetIndicator();
        
        // 타겟팅 라인 제거
        if (typeof TargetingLine !== 'undefined') {
            TargetingLine.remove();
        }

        if (self.isDragging) {
            self.droppedOnGimmick = false; // 플래그 초기화
            const dropResult = self.checkDropSuccess(card, self.currentDragX, self.currentDragY);

            if (dropResult) {
                // 🎴 화투 찰싹 효과 - 고스트 카드로 애니메이션
                self.playCardSlapEffect(self.dragGhost, () => {
                    // 드롭 성공 시 파티클 효과
                    if (typeof CardAnimation !== 'undefined' && CardAnimation.container) {
                        CardAnimation.createParticles(self.currentDragX, self.currentDragY, cardType, 15);
                    }
                    self.removeGhost();
                    
                    // 🔥 기믹에 드롭했으면 카드만 소비 (기믹 공격은 이미 처리됨)
                    if (self.droppedOnGimmick) {
                        self.consumeCardForGimmick(cardIndex, card);
                    } else {
                        playCard(cardIndex);
                    }
                });
            } else {
                self.returnGhostToHand(cardEl);
            }
        }

        self.isDragging = false;
        self.draggedCard = null;
    },

    // 카드 타겟 확인 (enemy, allEnemy, self, field, none)
    getCardTarget(card) {
        const cardType = card.type?.id || card.type;
        
        // 🌫️ 필드 카드 체크
        if (cardType === 'field' || (typeof CardType !== 'undefined' && cardType === CardType.FIELD)) {
            return 'field';
        }
        
        // 전체 공격 카드 체크
        if (card.isAllEnemy || card.id === 'chakramThrow' || card.id === 'chakramReturn' || card.id === 'masterSword') {
            return 'allEnemy';
        }

        if (cardType === 'attack' || cardType === CardType.ATTACK) {
            return 'enemy';
        }

        if (cardType === 'skill' || cardType === CardType.SKILL ||
            cardType === 'power' || cardType === CardType.POWER) {
            return 'self';
        }

        return 'none';
    },

    // 드래그 중 슬롯 위치 백업
    savedSlotTransforms: {},
    
    // 유효한 타겟 하이라이트
    highlightValidTargets(card) {
        const target = this.getCardTarget(card);
        const playerEl = document.getElementById('player');
        
        // ✅ 드래그 중 3D parallax 완전 비활성화 (filter가 3D를 깨트림)
        if (typeof Background3D !== 'undefined') {
            Background3D.disableParallax();
        }
        
        const arena = document.querySelector('.battle-arena');
        if (arena) {
            arena.classList.add('drag-in-progress');
            arena.style.transform = 'none';
            arena.style.perspective = 'none';
        }
        
        // ✅ 적의 슬롯 X 오프셋 저장 후 transform 제거 (3D/filter 충돌 방지)
        this.savedSlotTransforms = {};
        document.querySelectorAll('.enemy-unit').forEach(el => {
            const domIndex = el.dataset.domIndex || el.dataset.index || '0';
            const currentX = gsap.getProperty(el, 'x') || 0;
            this.savedSlotTransforms[domIndex] = currentX;
            el.style.transform = 'none';
        });
        
        // 플레이어와 기믹은 단순 제거
        if (playerEl) playerEl.style.transform = 'none';
        document.querySelectorAll('.gimmick-unit').forEach(el => {
            el.style.transform = 'none';
        });

        if (target === 'enemy') {
            const container = document.getElementById('enemies-container');
            if (container) {
                container.querySelectorAll('.enemy-unit').forEach(el => {
                    if (!el.classList.contains('dead')) {
                        el.classList.add('drop-target');
                    }
                });
            } else {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) enemyEl.classList.add('drop-target');
            }
            // 🔥 기믹도 드롭 타겟으로 표시 (별도 컨테이너)
            const gimmickContainer = document.getElementById('gimmicks-container');
            if (gimmickContainer) {
                gimmickContainer.querySelectorAll('.gimmick-unit').forEach(el => {
                    el.classList.add('drop-target', 'gimmick-targetable');
                });
            }
        } else if (target === 'allEnemy') {
            // 전체 공격: 드래그 시작할 때부터 모든 적 활성화
            const container = document.getElementById('enemies-container');
            if (container) {
                container.querySelectorAll('.enemy-unit').forEach(el => {
                    if (!el.classList.contains('dead')) {
                        el.classList.add('drop-target', 'drop-target-all', 'drop-target-active');
                    }
                });
            } else {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    enemyEl.classList.add('drop-target', 'drop-target-all', 'drop-target-active');
                }
            }
        } else if (target === 'self' && playerEl) {
            playerEl.classList.add('drop-target-self');
        } else if (target === 'field') {
            // 🌫️ 필드 카드: 전체 화면 어디서든 드롭 가능
            const battleArea = document.querySelector('.battle-area');
            const gameContainer = document.querySelector('.game-container');
            if (battleArea) {
                battleArea.classList.add('drop-target-field');
            }
            if (gameContainer) {
                gameContainer.classList.add('drop-target-field-bg');
            }
        }
    },

    // 타겟 하이라이트 제거
    clearTargetHighlights() {
        const playerEl = document.getElementById('player');
        const container = document.getElementById('enemies-container');
        
        // ✅ 드래그 종료 후 3D parallax 재활성화
        const arena = document.querySelector('.battle-arena');
        if (arena) {
            arena.classList.remove('drag-in-progress');
            arena.style.transform = '';
            arena.style.perspective = '';
        }
        
        // ✅ 적의 슬롯 위치 복원 (저장된 X 오프셋 + 3D 깊이)
        document.querySelectorAll('.enemy-unit').forEach(el => {
            const domIndex = el.dataset.domIndex || el.dataset.index || '0';
            const slotIndex = parseInt(el.dataset.slot) || parseInt(domIndex);
            const savedX = this.savedSlotTransforms[domIndex] || 0;
            const z = typeof Background3D !== 'undefined' 
                ? Background3D.getEnemyZ(slotIndex) 
                : -80 - (slotIndex * 20);
            
            el.style.transform = `translateX(${savedX}px) translateZ(${z}px)`;
            el.style.transformStyle = 'preserve-3d';
            
            // GSAP 상태도 복원
            gsap.set(el, { x: savedX });
        });
        this.savedSlotTransforms = {};
        
        // 플레이어와 기믹 초기화
        if (playerEl) playerEl.style.transform = '';
        document.querySelectorAll('.gimmick-unit').forEach(el => {
            el.style.transform = '';
        });
        
        // ✅ Background3D 재활성화
        setTimeout(() => {
            if (typeof Background3D !== 'undefined') {
                Background3D.enableParallax();
            }
        }, 50);
        
        if (container) {
            container.querySelectorAll('.enemy-unit').forEach(el => {
                el.classList.remove('drop-target', 'drop-target-active', 'drop-target-all');
            });
        }
        // 🔥 기믹 하이라이트도 제거 (별도 컨테이너)
        const gimmickContainer = document.getElementById('gimmicks-container');
        if (gimmickContainer) {
            gimmickContainer.querySelectorAll('.gimmick-unit').forEach(el => {
                el.classList.remove('drop-target', 'drop-target-active', 'gimmick-targetable');
            });
        }

        const enemyEl = document.getElementById('enemy');
        if (enemyEl) {
            enemyEl.classList.remove('drop-target', 'drop-target-active', 'drop-target-all');
        }
        if (playerEl) {
            playerEl.classList.remove('drop-target-self', 'drop-target-self-active');
        }
        
        // 🌫️ 필드 하이라이트 제거
        const battleArea = document.querySelector('.battle-area');
        const gameContainer = document.querySelector('.game-container');
        if (battleArea) {
            battleArea.classList.remove('drop-target-field', 'drop-target-field-active');
        }
        if (gameContainer) {
            gameContainer.classList.remove('drop-target-field-bg', 'drop-target-field-bg-active');
        }
    },

    // 드롭 타겟 체크
    checkDropTarget(card, x, y) {
        const target = this.getCardTarget(card);
        let isOnTarget = false;
        
        // 잘못된 대상 체크
        this.checkInvalidTarget(card, target, x, y);

        if (target === 'enemy') {
            const container = document.getElementById('enemies-container');
            if (container) {
                let foundTarget = false;
                
                // 적 유닛 체크
                container.querySelectorAll('.enemy-unit').forEach(el => {
                    if (el.classList.contains('dead')) return;

                    const rect = el.getBoundingClientRect();
                    const isOver = x >= rect.left && x <= rect.right && 
                                   y >= rect.top && y <= rect.bottom;

                    if (isOver) {
                        foundTarget = true;
                        isOnTarget = true;
                        el.classList.add('drop-target-active');
                        this.dragGhost?.classList.add('can-drop');
                    } else {
                        el.classList.remove('drop-target-active');
                    }
                });
                
                if (!foundTarget) {
                    this.dragGhost?.classList.remove('can-drop');
                }
            }
            
            // 🔥 기믹 유닛 체크 (별도 컨테이너)
            const gimmickContainer = document.getElementById('gimmicks-container');
            if (gimmickContainer) {
                gimmickContainer.querySelectorAll('.gimmick-unit').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const isOver = x >= rect.left && x <= rect.right && 
                                   y >= rect.top && y <= rect.bottom;

                    if (isOver) {
                        isOnTarget = true;
                        el.classList.add('drop-target-active', 'gimmick-targetable');
                        this.dragGhost?.classList.add('can-drop');
                    } else {
                        el.classList.remove('drop-target-active');
                    }
                });
            } else {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    const isOver = x >= rect.left && x <= rect.right && 
                                   y >= rect.top && y <= rect.bottom;

                    if (isOver) {
                        isOnTarget = true;
                        enemyEl.classList.add('drop-target-active');
                        this.dragGhost?.classList.add('can-drop');
                    } else {
                        enemyEl.classList.remove('drop-target-active');
                        this.dragGhost?.classList.remove('can-drop');
                    }
                }
            }
        } else if (target === 'allEnemy') {
            const container = document.getElementById('enemies-container');
            if (container) {
                let foundAny = false;
                const enemies = container.querySelectorAll('.enemy-unit:not(.dead)');
                
                enemies.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right && 
                        y >= rect.top && y <= rect.bottom) {
                        foundAny = true;
                    }
                });
                
                if (foundAny) {
                    isOnTarget = true;
                    this.dragGhost?.classList.add('can-drop');
                } else {
                    this.dragGhost?.classList.remove('can-drop');
                }
            } else {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    const isOver = x >= rect.left && x <= rect.right && 
                                   y >= rect.top && y <= rect.bottom;

                    if (isOver) {
                        isOnTarget = true;
                        this.dragGhost?.classList.add('can-drop');
                    } else {
                        this.dragGhost?.classList.remove('can-drop');
                    }
                }
            }
        } else if (target === 'self') {
            const playerEl = document.getElementById('player');
            if (playerEl) {
                const rect = playerEl.getBoundingClientRect();
                const isOver = x >= rect.left && x <= rect.right && 
                               y >= rect.top && y <= rect.bottom;

                if (isOver) {
                    isOnTarget = true;
                    playerEl.classList.add('drop-target-self-active');
                    this.dragGhost?.classList.add('can-drop');
                } else {
                    playerEl.classList.remove('drop-target-self-active');
                    this.dragGhost?.classList.remove('can-drop');
                }
            }
        } else if (target === 'field') {
            // 🌫️ 필드 카드: 전체 게임 영역 어디서든 드롭 가능
            const battleArea = document.querySelector('.battle-area');
            const gameContainer = document.querySelector('.game-container');
            
            // 배경 어디서든 드롭 가능 (손패 영역 제외)
            const handArea = document.querySelector('.hand');
            const handRect = handArea?.getBoundingClientRect();
            const isOverHand = handRect && 
                               x >= handRect.left && x <= handRect.right && 
                               y >= handRect.top && y <= handRect.bottom;
            
            if (!isOverHand) {
                // 손패 영역이 아니면 드롭 가능
                isOnTarget = true;
                this.dragGhost?.classList.add('can-drop');
                
                if (battleArea) {
                    battleArea.classList.add('drop-target-field-active');
                }
                if (gameContainer) {
                    gameContainer.classList.add('drop-target-field-bg-active');
                }
            } else {
                // 손패 영역 위면 드롭 불가
                this.dragGhost?.classList.remove('can-drop');
                if (battleArea) {
                    battleArea.classList.remove('drop-target-field-active');
                }
                if (gameContainer) {
                    gameContainer.classList.remove('drop-target-field-bg-active');
                }
            }
        }
        
        // 타겟 위에 있으면 카드 축소 (빨려들어가는 효과)
        this.updateGhostScale(isOnTarget);
    },
    
    // 잘못된 대상 체크 및 표시
    checkInvalidTarget(card, target, x, y) {
        const playerEl = document.getElementById('player');
        const playerRect = playerEl?.getBoundingClientRect();
        const isOverPlayer = playerRect && 
                            x >= playerRect.left && x <= playerRect.right && 
                            y >= playerRect.top && y <= playerRect.bottom;
        
        // 적 위에 있는지 체크
        let isOverEnemy = false;
        const container = document.getElementById('enemies-container');
        if (container) {
            container.querySelectorAll('.enemy-unit:not(.dead)').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (x >= rect.left && x <= rect.right && 
                    y >= rect.top && y <= rect.bottom) {
                    isOverEnemy = true;
                }
            });
        } else {
            const enemyEl = document.getElementById('enemy');
            if (enemyEl) {
                const rect = enemyEl.getBoundingClientRect();
                isOverEnemy = x >= rect.left && x <= rect.right && 
                             y >= rect.top && y <= rect.bottom;
            }
        }
        
        // 잘못된 대상 판정
        let isInvalid = false;
        let invalidEl = null;
        
        // 공격 카드인데 플레이어 위에 있을 때
        if (target === 'enemy' && isOverPlayer) {
            isInvalid = true;
            invalidEl = playerEl;
        }
        // 자기 대상 카드인데 적 위에 있을 때
        else if (target === 'self' && isOverEnemy) {
            isInvalid = true;
            // 적 요소 찾기
            if (container) {
                container.querySelectorAll('.enemy-unit:not(.dead)').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right && 
                        y >= rect.top && y <= rect.bottom) {
                        invalidEl = el;
                    }
                });
            } else {
                invalidEl = document.getElementById('enemy');
            }
        }
        
        // 잘못된 대상 표시/숨김
        if (isInvalid && invalidEl) {
            this.showInvalidTargetIndicator(invalidEl);
        } else {
            this.hideInvalidTargetIndicator();
        }
    },
    
    // 잘못된 대상 표시 (카드 고스트에 표시)
    showInvalidTargetIndicator(targetEl) {
        if (!this.dragGhost) return;
        
        // 고스트에 잘못된 대상 클래스 추가
        this.dragGhost.classList.add('invalid-target');
        
        // 기존 표시가 없으면 추가
        if (!this.dragGhost.querySelector('.invalid-target-label')) {
            const label = document.createElement('div');
            label.className = 'invalid-target-label';
            label.innerHTML = '❌ 잘못된 대상';
            this.dragGhost.appendChild(label);
        }
    },
    
    // 잘못된 대상 표시 숨김
    hideInvalidTargetIndicator() {
        if (!this.dragGhost) return;
        
        this.dragGhost.classList.remove('invalid-target');
        const label = this.dragGhost.querySelector('.invalid-target-label');
        if (label) {
            label.remove();
        }
    },
    
    // 고스트 스케일 업데이트 (타겟 위: 작아짐)
    updateGhostScale(isOnTarget) {
        if (!this.dragGhost) return;
        
        if (isOnTarget) {
            // 타겟 위: 작게 (중앙 유지)
            this.dragGhost.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(0.45)';
            this.dragGhost.style.opacity = '0.6';
        } else {
            this.dragGhost.style.transform = 'translate(-50%, -50%) rotate(5deg) scale(1.15)';
            this.dragGhost.style.opacity = '1';
        }
    },

    // 드롭 성공 확인
    checkDropSuccess(card, x, y) {
        const target = this.getCardTarget(card);

        if (target === 'enemy') {
            // 🔥 먼저 기믹 체크 (별도 컨테이너, 기믹이 적보다 우선)
            const gimmickContainer = document.getElementById('gimmicks-container');
            if (gimmickContainer) {
                const gimmickUnits = gimmickContainer.querySelectorAll('.gimmick-unit');
                for (let i = 0; i < gimmickUnits.length; i++) {
                    const el = gimmickUnits[i];
                    const rect = el.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right && 
                        y >= rect.top && y <= rect.bottom) {
                        const gimmickIndex = parseInt(el.dataset.gimmickIndex);
                        // 기믹 공격 실행
                        if (typeof GimmickSystem !== 'undefined') {
                            const damage = card.damage || card.value || 5;
                            GimmickSystem.damageGimmick(gimmickIndex, damage);
                            // 기믹 타겟 시에는 true를 반환하지만 적 선택은 하지 않음
                            this.droppedOnGimmick = true;
                            return true;
                        }
                    }
                }
            }
            
            const container = document.getElementById('enemies-container');
            if (container) {
                const enemyUnits = container.querySelectorAll('.enemy-unit');
                for (let i = 0; i < enemyUnits.length; i++) {
                    const el = enemyUnits[i];
                    if (el.classList.contains('dead')) continue;

                    const rect = el.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right && 
                        y >= rect.top && y <= rect.bottom) {
                        const enemyIndex = parseInt(el.dataset.index);
                        selectEnemy(enemyIndex);
                        return true;
                    }
                }
                return false;
            } else {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    return x >= rect.left && x <= rect.right && 
                           y >= rect.top && y <= rect.bottom;
                }
            }
        } else if (target === 'allEnemy') {
            // 전체 공격: 아무 적 위에 드롭하면 성공
            const container = document.getElementById('enemies-container');
            if (container) {
                const enemyUnits = container.querySelectorAll('.enemy-unit:not(.dead)');
                for (let i = 0; i < enemyUnits.length; i++) {
                    const el = enemyUnits[i];
                    const rect = el.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right && 
                        y >= rect.top && y <= rect.bottom) {
                        // 전체 공격은 특정 적 선택 불필요
                        return true;
                    }
                }
                return false;
            } else {
                const enemyEl = document.getElementById('enemy');
                if (enemyEl) {
                    const rect = enemyEl.getBoundingClientRect();
                    return x >= rect.left && x <= rect.right && 
                           y >= rect.top && y <= rect.bottom;
                }
            }
        } else if (target === 'self') {
            const playerEl = document.getElementById('player');
            if (playerEl) {
                const rect = playerEl.getBoundingClientRect();
                return x >= rect.left && x <= rect.right && 
                       y >= rect.top && y <= rect.bottom;
            }
        } else if (target === 'field') {
            // 🌫️ 필드 카드: 손패 영역 제외하고 어디서든 드롭 가능
            const handArea = document.querySelector('.hand');
            const handRect = handArea?.getBoundingClientRect();
            const isOverHand = handRect && 
                               x >= handRect.left && x <= handRect.right && 
                               y >= handRect.top && y <= handRect.bottom;
            
            // 손패 위가 아니면 성공
            return !isOverHand;
        }

        return false;
    },

    // 드래그 고스트 생성
    createGhost(cardEl, card) {
        const ghost = cardEl.cloneNode(true);
        const cardType = cardEl.dataset.type || 'attack';
        
        // 카드 타입별 글로우 색상
        const glowColors = {
            attack: 'rgba(239, 68, 68, 0.8)',
            skill: 'rgba(59, 130, 246, 0.8)',
            power: 'rgba(168, 85, 247, 0.8)'
        };
        const glowColor = glowColors[cardType] || glowColors.attack;
        
        ghost.className = `card ${cardType} drag-ghost`;
        ghost.style.cssText = `
            position: fixed;
            left: ${this.dragStartX}px;
            top: ${this.dragStartY}px;
            transform: translate(-50%, -50%) rotate(5deg) scale(1.15);
            z-index: 10000;
            pointer-events: none;
            transition: transform 0.1s ease-out, box-shadow 0.15s ease, opacity 0.1s ease;
            box-shadow: 
                0 20px 40px rgba(0,0,0,0.5),
                0 0 30px ${glowColor},
                0 0 60px ${glowColor.replace('0.8', '0.4')};
            filter: brightness(1.1);
        `;
        document.body.appendChild(ghost);
        this.dragGhost = ghost;
        
        // 드래그 시작 파티클
        if (typeof CardAnimation !== 'undefined' && CardAnimation.container) {
            CardAnimation.createParticles(this.dragStartX, this.dragStartY, cardType, 10);
        }
    },

    // 고스트 위치 업데이트
    updateGhostPosition(x, y) {
        if (this.dragGhost) {
            this.dragGhost.style.left = `${x}px`;
            this.dragGhost.style.top = `${y}px`;
        }
    },

    // 고스트 제거
    removeGhost() {
        if (this.dragGhost) {
            this.dragGhost.remove();
            this.dragGhost = null;
        }
    },

    // 고스트 원위치
    returnGhostToHand(originalCard) {
        if (!this.dragGhost) return;

        const cardRect = originalCard.getBoundingClientRect();
        this.dragGhost.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        this.dragGhost.style.left = `${cardRect.left + cardRect.width / 2}px`;
        this.dragGhost.style.top = `${cardRect.top + cardRect.height / 2}px`;
        this.dragGhost.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(1)';
        this.dragGhost.style.opacity = '0';

        setTimeout(() => this.removeGhost(), 300);
    },
    
    // 🎴 화투 찰싹 효과 - 카드를 탁! 내려치는 느낌 (더 찰지게!)
    playCardSlapEffect(ghost, callback) {
        if (!ghost) {
            if (callback) callback();
            return;
        }
        
        // 1단계: 카드가 확 위로 들어올림 + 크게 커짐
        ghost.style.transition = 'transform 0.07s cubic-bezier(0.2, 0.8, 0.2, 1)';
        ghost.style.transform = 'translate(-50%, -75%) scale(1.35) rotate(-5deg)';
        ghost.style.filter = 'brightness(1.2) drop-shadow(0 15px 25px rgba(0,0,0,0.5))';
        
        // 2단계: 탁!! 강하게 내려치기
        setTimeout(() => {
            // 찰싹 사운드 (내려치는 순간)
            if (typeof SoundSystem !== 'undefined') {
                SoundSystem.play('card_use', { volume: 0.8 });
            }
            
            ghost.style.transition = 'transform 0.04s cubic-bezier(0.95, 0, 1, 1)';
            ghost.style.transform = 'translate(-50%, -40%) scale(0.85) rotate(3deg)';
            ghost.style.filter = 'brightness(1) drop-shadow(0 3px 8px rgba(0,0,0,0.4))';
            
            // 화면 강하게 흔들림 + 찌그러짐
            const gameContainer = document.querySelector('.game-container') || document.body;
            gameContainer.style.transition = 'transform 0.03s';
            gameContainer.style.transform = 'translateY(5px) scaleY(0.995)';
            
            setTimeout(() => {
                gameContainer.style.transition = 'transform 0.05s ease-out';
                gameContainer.style.transform = 'translateY(-2px)';
                
                setTimeout(() => {
                    gameContainer.style.transform = '';
                }, 50);
            }, 35);
            
        }, 70);
        
        // 3단계: 바운스 - 살짝 튀어오름
        setTimeout(() => {
            ghost.style.transition = 'transform 0.05s ease-out';
            ghost.style.transform = 'translate(-50%, -52%) scale(1.05) rotate(-1deg)';
        }, 115);
        
        // 4단계: 안착 + 콜백
        setTimeout(() => {
            ghost.style.transition = 'transform 0.04s ease-in-out';
            ghost.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
            ghost.style.filter = '';
            
            // 애니메이션 끝나고 콜백
            setTimeout(() => {
                if (callback) callback();
            }, 40);
        }, 165);
    },
    
    // 🌟 그림자 하얀 플래시 효과
    playShadowFlash() {
        // 플레이어 그림자
        const playerShadow = document.querySelector('.player-shadow');
        // 적 그림자들
        const enemyShadows = document.querySelectorAll('.enemy-shadow');
        
        const allShadows = [playerShadow, ...enemyShadows].filter(Boolean);
        
        allShadows.forEach(shadow => {
            // 이전 애니메이션 제거 후 재시작
            shadow.classList.remove('shadow-flash');
            // 강제 리플로우로 애니메이션 재시작
            void shadow.offsetWidth;
            // 하얀 플래시 효과 적용
            shadow.classList.add('shadow-flash');
            
            // 애니메이션 후 제거
            setTimeout(() => {
                shadow.classList.remove('shadow-flash');
            }, 350);
        });
    }
};

// 하위 호환성을 위한 전역 함수
function setupCardDragAndDrop(cardEl, index, card) {
    CardDragSystem.setup(cardEl, index, card);
}

function getCardTarget(card) {
    return CardDragSystem.getCardTarget(card);
}

function highlightValidTargets(card) {
    CardDragSystem.highlightValidTargets(card);
}

function clearTargetHighlights() {
    CardDragSystem.clearTargetHighlights();
}

// ==========================================
// CSS 스타일 주입
// ==========================================
const cardDragStyles = document.createElement('style');
cardDragStyles.id = 'card-drag-styles';
cardDragStyles.textContent = `
    /* ✅ 드래그 중 3D 비활성화 (filter가 3D를 깨트리므로) */
    .battle-arena.drag-in-progress {
        transform: none !important;
        perspective: none !important;
    }
    
    .battle-arena.drag-in-progress .enemy-unit,
    .battle-arena.drag-in-progress #player,
    .battle-arena.drag-in-progress .gimmick-unit {
        transform: none !important;
    }
    
    /* 잘못된 대상 - 카드 고스트에 표시 */
    .card-ghost.invalid-target {
        filter: grayscale(0.5) brightness(0.8) !important;
        animation: invalidCardShake 0.1s ease-in-out infinite !important;
    }
    
    @keyframes invalidCardShake {
        0%, 100% { transform: translate(-50%, -50%) rotate(3deg) scale(1.1); }
        50% { transform: translate(-50%, -50%) rotate(-3deg) scale(1.1); }
    }
    
    .invalid-target-label {
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        padding: 6px 12px;
        background: rgba(239, 68, 68, 0.95);
        border: 2px solid #fca5a5;
        border-radius: 4px;
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        color: #fff;
        text-shadow: 1px 1px 2px #000;
        white-space: nowrap;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
        animation: invalidLabelPop 0.15s ease-out;
    }
    
    @keyframes invalidLabelPop {
        0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
        100% { opacity: 1; transform: translateX(-50%) scale(1); }
    }
    
    /* 코스트 부족 카드 흔들림 */
    @keyframes cantPlayShake {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        15% { transform: translateX(-10px) rotate(-3deg); }
        30% { transform: translateX(10px) rotate(3deg); }
        45% { transform: translateX(-8px) rotate(-2deg); }
        60% { transform: translateX(8px) rotate(2deg); }
        75% { transform: translateX(-4px) rotate(-1deg); }
        90% { transform: translateX(4px) rotate(1deg); }
    }
    
    .card.cant-play-shake {
        animation: cantPlayShake 0.5s ease-out;
        filter: brightness(0.6) saturate(0.3);
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4) !important;
    }
    
    .card.cant-play-shake::before {
        content: '';
        position: absolute;
        inset: -4px;
        border: 3px solid #ef4444;
        border-radius: 12px;
        animation: cantPlayBorder 0.5s ease-out;
        pointer-events: none;
        z-index: 10;
    }
    
    @keyframes cantPlayBorder {
        0%, 100% { opacity: 0; }
        20%, 80% { opacity: 1; }
    }
    
    .card.cant-play-shake::after {
        content: '에너지 부족';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #ef4444;
        border-radius: 8px;
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 1rem;
        font-weight: 900;
        color: #ef4444;
        text-shadow: 0 0 10px #ef4444;
        white-space: nowrap;
        z-index: 100;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        animation: cantPlayTextPop 0.5s ease-out forwards;
    }
    
    @keyframes cantPlayTextPop {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        40% { transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    }
`;

if (!document.getElementById('card-drag-styles')) {
    document.head.appendChild(cardDragStyles);
}

// 🔥 기믹에 카드 사용 시 카드 소비 처리
CardDragSystem.consumeCardForGimmick = function(cardIndex, card) {
    // 마나 소비
    const cost = card.cost || 0;
    if (gameState.player.energy >= cost) {
        gameState.player.energy -= cost;
        
        // 카드를 손패에서 제거
        const removedCard = gameState.hand.splice(cardIndex, 1)[0];
        
        // 소멸 카드인지 확인
        const shouldExhaust = removedCard.isEthereal || removedCard.ethereal || removedCard.exhaust === true;
        if (shouldExhaust) {
            addLog(`${removedCard.name} 소멸`, 'ethereal');
            if (!gameState.exhaustPile) gameState.exhaustPile = [];
            gameState.exhaustPile.push(removedCard);
        } else {
            gameState.discardPile.push(removedCard);
        }
        
        // UI 업데이트
        if (typeof renderHand === 'function') renderHand();
        if (typeof updateUI === 'function') updateUI();
        if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
        
        // 기믹 파괴 후 적 처치 확인
        setTimeout(() => {
            if (typeof checkEnemyDefeated === 'function') {
                checkEnemyDefeated();
            }
        }, 400);
        
        console.log(`[GimmickSystem] 카드 "${removedCard.name}" 소비 완료`);
    }
};

console.log('[CardDragSystem] 로드 완료');

