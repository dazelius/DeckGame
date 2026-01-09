// =====================================================
// Card Drag System - 카드 드래그 앤 드롭 시스템
// =====================================================

const CardDrag = {
    game: null,
    app: null,
    
    // Drag state
    dragState: {
        isDragging: false,
        cardId: null,
        handIndex: -1,
        isSummon: false,
        startX: 0,
        startY: 0,
        cardEl: null,
        ghost: null,
        targetEnemy: null,
        targetAlly: null
    },
    
    // Graphics objects
    gridHighlight: null,
    aoeHighlight: null,
    targetingCurve: null,
    
    // Highlighted units
    _highlightedEnemy: null,
    _highlightedEnemies: null,
    _highlightedAlly: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef, pixiApp) {
        this.game = gameRef;
        this.app = pixiApp;
        
        this.createDragGhost();
        this.createGridHighlight();
        
        // Global event handlers
        document.addEventListener('mousemove', (e) => this.onCardDrag(e));
        document.addEventListener('mouseup', (e) => this.endCardDrag(e));
        document.addEventListener('touchmove', (e) => this.onCardDrag(e), { passive: false });
        document.addEventListener('touchend', (e) => this.endCardDrag(e));
        
        console.log('[CardDrag] 카드 드래그 시스템 초기화 완료');
    },
    
    // ==========================================
    // 드래그 고스트 생성
    // ==========================================
    createDragGhost() {
        const ghost = document.createElement('div');
        ghost.id = 'drag-ghost';
        ghost.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transform: scale(1.1) rotate(-3deg);
            transition: transform 0.1s ease-out;
        `;
        document.body.appendChild(ghost);
        this.dragState.ghost = ghost;
    },
    
    // ==========================================
    // 그리드 하이라이트 생성
    // ==========================================
    createGridHighlight() {
        this.gridHighlight = new PIXI.Graphics();
        this.gridHighlight.zIndex = 5;
        this.game.containers.effects.addChild(this.gridHighlight);
    },
    
    // ==========================================
    // 카드 드래그 시작
    // ==========================================
    startCardDrag(e, cardEl, cardId, handIndex) {
        if (this.game.state.phase !== 'prepare') return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const cardDef = this.game.getCard(cardId);
        if (!cardDef) return;
        
        const isSummon = cardDef.type === 'summon';
        const touch = e.touches ? e.touches[0] : e;
        
        this.dragState.isDragging = true;
        this.dragState.cardId = cardId;
        this.dragState.handIndex = handIndex;
        this.dragState.isSummon = isSummon;
        this.dragState.startX = touch.clientX;
        this.dragState.startY = touch.clientY;
        this.dragState.cardEl = cardEl;
        
        // Create ghost with enhanced shadow
        const ghost = this.dragState.ghost;
        const typeClass = cardDef.type || '';
        ghost.innerHTML = `
            <div class="card ${typeClass} drag-card dealt" style="
                margin: 0;
                box-shadow: 
                    0 30px 60px rgba(0,0,0,0.9),
                    0 15px 30px rgba(0,0,0,0.7),
                    0 0 50px rgba(0,0,0,0.5),
                    inset 0 1px 0 rgba(255,255,255,0.1);
                filter: drop-shadow(0 25px 25px rgba(0,0,0,0.8));
            ">
                <div class="card-cost">${cardDef.cost}</div>
                <div class="card-name">${cardDef.name}</div>
                <div class="card-type">${cardDef.type?.toUpperCase() || ''}</div>
                <div class="card-desc">${cardDef.desc}</div>
            </div>
        `;
        ghost.style.left = (touch.clientX - 80) + 'px';
        ghost.style.top = (touch.clientY - 110) + 'px';
        ghost.style.opacity = '1';
        ghost.style.transform = 'scale(1.2) rotate(-5deg)';
        
        cardEl.style.opacity = '0.3';
        cardEl.style.transform = 'scale(0.9)';
        
        if (typeof Game !== 'undefined') Game.vibrate(20);
        
        if (isSummon) {
            this.game.showSummonZones();
        }
    },
    
    // ==========================================
    // 드래그 중
    // ==========================================
    onCardDrag(e) {
        if (!this.dragState.isDragging) return;
        
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        
        const ghost = this.dragState.ghost;
        ghost.style.left = (touch.clientX - 80) + 'px';
        ghost.style.top = (touch.clientY - 110) + 'px';
        
        const cardDef = this.game.getCard(this.dragState.cardId);
        
        if (this.dragState.isSummon) {
            this.handleSummonDrag(touch, ghost);
        } else if (cardDef && cardDef.type === 'attack') {
            this.handleAttackDrag(touch, ghost, cardDef);
        } else if (cardDef && cardDef.type === 'skill') {
            this.handleSkillDrag(touch, ghost, cardDef);
        } else {
            this.handleDefaultDrag(touch, ghost);
        }
    },
    
    // ==========================================
    // 소환 카드 드래그 처리
    // ==========================================
    handleSummonDrag(touch, ghost) {
        const gridPos = this.game.screenToGrid(touch.clientX, touch.clientY);
        const isValid = gridPos && gridPos.x < this.game.arena.playerZoneX && 
                       !this.game.isCellOccupied(gridPos.x, gridPos.z);
        
        if (isValid) {
            this.highlightCell(gridPos.x, gridPos.z, true);
            ghost.style.transform = 'scale(1.2) rotate(0deg)';
            ghost.querySelector('.drag-card').style.borderColor = '#44ff44';
        } else {
            this.highlightCell(-1, -1, false);
            ghost.style.transform = 'scale(1.15) rotate(-3deg)';
            ghost.querySelector('.drag-card').style.borderColor = '#666';
        }
        this.clearEnemyHighlights();
    },
    
    // ==========================================
    // 공격 카드 드래그 처리
    // ==========================================
    handleAttackDrag(touch, ghost, cardDef) {
        let targetEnemy;
        
        // ★ 직선 전용 카드 (스피어 투척 등)
        if (cardDef.straight) {
            targetEnemy = this.getStraightLineTarget();
        } else {
            targetEnemy = this.getEnemyAtScreen(touch.clientX, touch.clientY, cardDef.frontOnly || false);
        }
        
        this.dragState.targetEnemy = targetEnemy;
        
        const canvas = this.app.canvas;
        const rect = canvas.getBoundingClientRect();
        const cursorX = touch.clientX - rect.left;
        const cursorY = touch.clientY - rect.top;
        
        // ★ 직선 카드면 직선 타겟팅 라인만 표시
        if (cardDef.straight) {
            this.drawStraightTargetingLine(targetEnemy);
        } else {
            this.drawTargetingCurvesToEnemies(cursorX, cursorY, targetEnemy, cardDef.frontOnly || false);
        }
        
        if (targetEnemy) {
            // 십자가 패턴 처리
            if (cardDef.aoePattern === 'cross') {
                const crossTargets = this.game.getEnemiesInCrossAoe(targetEnemy.gridX, targetEnemy.gridZ, 1);
                this.highlightEnemiesInAoe(crossTargets);
                this.showCrossAoeHighlight(targetEnemy.gridX, targetEnemy.gridZ, 1);
            } else if (!cardDef.straight) {
                const aoe = cardDef.aoe || { width: 1, depth: 1 };
                const targetsInAoe = this.game.getEnemiesInAoe(targetEnemy.gridX, targetEnemy.gridZ, aoe);
                this.highlightEnemiesInAoe(targetsInAoe);
                this.showAoeHighlight(targetEnemy.gridX, targetEnemy.gridZ, aoe);
            } else {
                // 직선 카드는 단일 타겟만 하이라이트
                this.highlightEnemiesInAoe([targetEnemy]);
                this.clearAoeHighlight();
            }
            
            ghost.style.transform = 'scale(1.2) rotate(0deg)';
            ghost.querySelector('.drag-card').style.borderColor = '#ff4444';
        } else {
            const dragDist = this.dragState.startY - touch.clientY;
            this.clearEnemyHighlights();
            this.clearAoeHighlight();
            
            if (cardDef.straight) {
                // ★ 직선 카드: 타겟 없으면 항상 사용 불가 표시
                ghost.style.transform = 'scale(1.15) rotate(-3deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#ff6666';
            } else if (dragDist > 100) {
                ghost.style.transform = 'scale(1.2) rotate(0deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#44ff44';
            } else {
                ghost.style.transform = 'scale(1.15) rotate(-3deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#666';
            }
        }
    },
    
    // ==========================================
    // 스킬 카드 드래그 처리
    // ==========================================
    handleSkillDrag(touch, ghost, cardDef) {
        const hero = this.game.state.hero;
        const targetAlly = this.getAllyAtScreen(touch.clientX, touch.clientY);
        this.dragState.targetAlly = targetAlly;
        
        this.clearEnemyHighlights();
        this.clearTargetingCurve();
        this.clearAoeHighlight();
        
        if (cardDef.target === 'self' && targetAlly && targetAlly.isHero) {
            this.highlightAlly(targetAlly, true);
            ghost.style.transform = 'scale(1.2) rotate(0deg)';
            ghost.querySelector('.drag-card').style.borderColor = '#44aaff';
        } else {
            this.clearAllyHighlights();
            const dragDist = this.dragState.startY - touch.clientY;
            
            if (dragDist > 100) {
                if (cardDef.target === 'self' && hero && hero.sprite) {
                    this.highlightAlly(hero, true);
                }
                ghost.style.transform = 'scale(1.2) rotate(0deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#44aaff';
            } else {
                ghost.style.transform = 'scale(1.15) rotate(-3deg)';
                ghost.querySelector('.drag-card').style.borderColor = '#666';
            }
        }
    },
    
    // ==========================================
    // 기본 드래그 처리
    // ==========================================
    handleDefaultDrag(touch, ghost) {
        const dragDist = this.dragState.startY - touch.clientY;
        this.clearEnemyHighlights();
        this.clearAllyHighlights();
        this.clearTargetingCurve();
        this.clearAoeHighlight();
        
        if (dragDist > 100) {
            ghost.style.transform = 'scale(1.2) rotate(0deg)';
            ghost.querySelector('.drag-card').style.borderColor = '#44ff44';
        } else {
            ghost.style.transform = 'scale(1.15) rotate(-3deg)';
            ghost.querySelector('.drag-card').style.borderColor = '#666';
        }
    },
    
    // ==========================================
    // 드래그 종료
    // ==========================================
    endCardDrag(e) {
        if (!this.dragState.isDragging) return;
        
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        const cardId = this.dragState.cardId;
        const handIndex = this.dragState.handIndex;
        const cardDef = this.game.getCard(cardId);
        
        let success = false;
        
        if (this.dragState.isSummon) {
            success = this.handleSummonDrop(touch, cardId, handIndex, cardDef);
        } else if (cardDef && cardDef.type === 'attack') {
            success = this.handleAttackDrop(touch, cardId, handIndex, cardDef);
        } else {
            success = this.handleSkillDrop(touch, cardId, handIndex, cardDef);
        }
        
        // Reset state
        this.resetDragState();
        
        if (success) {
            this.game.renderHand(false);
        }
    },
    
    // ==========================================
    // 소환 카드 드롭 처리
    // ==========================================
    handleSummonDrop(touch, cardId, handIndex, cardDef) {
        const gridPos = this.game.screenToGrid(touch.clientX, touch.clientY);
        const isValid = gridPos && gridPos.x < this.game.arena.playerZoneX && 
                       !this.game.isCellOccupied(gridPos.x, gridPos.z);
        
        if (isValid && this.game.state.cost >= cardDef.cost) {
            this.game.placeUnit(cardDef.unit, gridPos.x, gridPos.z, 'player');
            this.game.state.cost -= cardDef.cost;
            this.game.state.hand.splice(handIndex, 1);
            
            // Exhaust 카드면 소멸
            if (cardDef.exhaust) {
                this.game.state.exhaust.push(cardId);
                this.game.showExhaustEffect(cardId, cardDef);
            } else {
                this.game.state.discard.push(cardId);
            }
            this.game.updateCostUI();
            if (typeof Game !== 'undefined') Game.vibrate([30, 50, 30]);
            return true;
        }
        return false;
    },
    
    // ==========================================
    // 공격 카드 드롭 처리
    // ==========================================
    handleAttackDrop(touch, cardId, handIndex, cardDef) {
        let targetEnemy = this.dragState.targetEnemy;
        
        // ★ 직선 카드면 직선 타겟만 사용
        if (!targetEnemy) {
            if (cardDef.straight) {
                targetEnemy = this.getStraightLineTarget();
            } else {
                targetEnemy = this.getEnemyAtScreen(touch.clientX, touch.clientY, cardDef.frontOnly || false);
            }
        }
        
        const dragDist = this.dragState.startY - touch.clientY;
        
        if (this.game.state.cost >= cardDef.cost) {
            if (targetEnemy) {
                this.game.executeCardOnTarget(cardId, handIndex, targetEnemy);
                return true;
            } else if (cardDef.straight && dragDist > 100) {
                // ★ 직선 카드: 같은 라인에 적이 없으면 안내 메시지
                this.game.showMessage('같은 라인에 대상이 없습니다!', 1500);
                return false;
            } else if (dragDist > 100 && !cardDef.straight) {
                this.game.executeCard(cardId, handIndex);
                return true;
            }
        }
        return false;
    },
    
    // ==========================================
    // 스킬 카드 드롭 처리
    // ==========================================
    handleSkillDrop(touch, cardId, handIndex, cardDef) {
        const dragDist = this.dragState.startY - touch.clientY;
        
        if (dragDist > 100 && this.game.state.cost >= cardDef.cost) {
            this.game.executeCard(cardId, handIndex);
            return true;
        }
        return false;
    },
    
    // ==========================================
    // 드래그 상태 초기화
    // ==========================================
    resetDragState() {
        this.dragState.isDragging = false;
        this.dragState.ghost.style.opacity = '0';
        this.dragState.targetEnemy = null;
        this.dragState.targetAlly = null;
        
        this.clearHighlight();
        this.clearEnemyHighlights();
        this.clearAllyHighlights();
        this.clearAoeHighlight();
        this.clearTargetingCurve();
        this.game.hideSummonZones();
        
        if (this.dragState.cardEl) {
            this.dragState.cardEl.style.opacity = '1';
            this.dragState.cardEl.style.transform = '';
        }
    },
    
    // ==========================================
    // 유틸: 유닛의 글로벌 좌표 가져오기
    // ==========================================
    getUnitGlobalPosition(unit) {
        if (!unit) return null;
        const posTarget = unit.container || unit.sprite;
        if (!posTarget) return null;
        
        // ★ 글로벌 좌표 사용 (부모 컨테이너 위치 포함)
        if (posTarget.getGlobalPosition) {
            return posTarget.getGlobalPosition();
        }
        return { x: posTarget.x, y: posTarget.y };
    },
    
    // ==========================================
    // 적 감지 (스크린 좌표)
    // ==========================================
    getEnemyAtScreen(screenX, screenY, frontOnly = false) {
        const canvas = this.app.canvas;
        const rect = canvas.getBoundingClientRect();
        const localX = screenX - rect.left;
        const localY = screenY - rect.top;
        
        const validTargets = frontOnly ? this.getFrontlineEnemies() : null;
        
        for (const enemy of this.game.state.enemyUnits) {
            if (enemy.hp <= 0) continue;
            if (frontOnly && !validTargets.includes(enemy)) continue;
            
            // ★ 글로벌 좌표 사용!
            const globalPos = this.getUnitGlobalPosition(enemy);
            if (!globalPos) continue;
            
            const spriteX = globalPos.x;
            const spriteY = globalPos.y;
            const spriteWidth = enemy.sprite?.width || 80;
            const spriteHeight = enemy.sprite?.height || 100;
            
            const hitPadding = 50;
            const left = spriteX - spriteWidth / 2 - hitPadding;
            const right = spriteX + spriteWidth / 2 + hitPadding;
            const top = spriteY - spriteHeight - hitPadding;
            const bottom = spriteY + hitPadding;
            
            if (localX >= left && localX <= right && localY >= top && localY <= bottom) {
                return enemy;
            }
        }
        return null;
    },
    
    // ==========================================
    // 아군 감지 (스크린 좌표)
    // ==========================================
    getAllyAtScreen(screenX, screenY) {
        const canvas = this.app.canvas;
        const rect = canvas.getBoundingClientRect();
        const localX = screenX - rect.left;
        const localY = screenY - rect.top;
        
        const allAllies = [this.game.state.hero, ...this.game.state.playerUnits.filter(u => u !== this.game.state.hero)];
        
        for (const ally of allAllies) {
            if (!ally || ally.hp <= 0) continue;
            
            // ★ 글로벌 좌표 사용!
            const globalPos = this.getUnitGlobalPosition(ally);
            if (!globalPos) continue;
            
            const spriteX = globalPos.x;
            const spriteY = globalPos.y;
            const spriteWidth = ally.sprite?.width || 80;
            const spriteHeight = ally.sprite?.height || 100;
            
            const hitPadding = 50;
            const left = spriteX - spriteWidth / 2 - hitPadding;
            const right = spriteX + spriteWidth / 2 + hitPadding;
            const top = spriteY - spriteHeight - hitPadding;
            const bottom = spriteY + hitPadding;
            
            if (localX >= left && localX <= right && localY >= top && localY <= bottom) {
                return ally;
            }
        }
        return null;
    },
    
    // ==========================================
    // 최전선 적 관련
    // ==========================================
    isFrontlineEnemy(enemy) {
        if (!enemy || enemy.hp <= 0) return false;
        
        const sameLineEnemies = this.game.state.enemyUnits.filter(e => 
            e.hp > 0 && e.gridZ === enemy.gridZ
        );
        
        if (sameLineEnemies.length === 0) return false;
        
        const minX = Math.min(...sameLineEnemies.map(e => e.gridX));
        return enemy.gridX === minX;
    },
    
    getFrontlineEnemies() {
        const frontline = [];
        const zLines = new Set(this.game.state.enemyUnits.filter(e => e.hp > 0).map(e => e.gridZ));
        
        for (const z of zLines) {
            const enemiesOnLine = this.game.state.enemyUnits.filter(e => e.hp > 0 && e.gridZ === z);
            if (enemiesOnLine.length > 0) {
                const front = enemiesOnLine.reduce((a, b) => a.gridX < b.gridX ? a : b);
                frontline.push(front);
            }
        }
        
        return frontline;
    },
    
    // ==========================================
    // 직선 타겟팅 (히어로와 같은 라인의 가장 앞에 있는 적)
    // ==========================================
    getStraightLineTarget() {
        const hero = this.game.state.hero;
        if (!hero) return null;
        
        // 히어로와 같은 gridZ에 있는 적들 중 가장 앞(gridX가 가장 낮은)에 있는 적
        const sameLineEnemies = this.game.state.enemyUnits.filter(e => 
            e.hp > 0 && e.gridZ === hero.gridZ
        );
        
        if (sameLineEnemies.length === 0) return null;
        
        // 가장 가까운 적 (gridX가 가장 작은)
        return sameLineEnemies.reduce((closest, e) => 
            (!closest || e.gridX < closest.gridX) ? e : closest, null
        );
    },
    
    // ==========================================
    // 직선 타겟팅 라인 그리기
    // ==========================================
    drawStraightTargetingLine(target) {
        if (!this.targetingCurve) {
            this.targetingCurve = new PIXI.Graphics();
            this.targetingCurve.zIndex = 100;
            this.game.containers.effects.addChild(this.targetingCurve);
        }
        
        this.targetingCurve.clear();
        
        const hero = this.game.state.hero;
        if (!hero || !hero.sprite) return;
        
        const heroPos = hero.sprite.getGlobalPosition();
        const startX = heroPos.x;
        const startY = heroPos.y - 40;
        
        // 직선 라인 (화살표 느낌)
        const lineLength = target ? null : 400; // 타겟이 없으면 400px 정도
        let endX, endY;
        
        if (target) {
            const targetPos = target.sprite.getGlobalPosition();
            endX = targetPos.x;
            endY = targetPos.y - 40;
        } else {
            endX = startX + lineLength;
            endY = startY;
        }
        
        // 라인 본체
        this.targetingCurve.moveTo(startX, startY);
        this.targetingCurve.lineTo(endX, endY);
        
        const lineColor = target ? 0xff4444 : 0x888888;
        this.targetingCurve.stroke({ 
            width: 3, 
            color: lineColor, 
            alpha: 0.8,
            cap: 'round'
        });
        
        // 화살표 머리
        if (target) {
            const arrowSize = 15;
            const angle = Math.atan2(endY - startY, endX - startX);
            
            this.targetingCurve.moveTo(endX, endY);
            this.targetingCurve.lineTo(
                endX - arrowSize * Math.cos(angle - Math.PI / 6),
                endY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            this.targetingCurve.moveTo(endX, endY);
            this.targetingCurve.lineTo(
                endX - arrowSize * Math.cos(angle + Math.PI / 6),
                endY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            this.targetingCurve.stroke({ width: 3, color: lineColor, alpha: 0.8 });
            
            // 거리 표시
            const hero = this.game.state.hero;
            const distance = Math.abs(target.gridX - hero.gridX);
            const bonusDamage = distance * 2; // distanceBonus: 2
            
            const distText = new PIXI.Text({
                text: `+${bonusDamage} DMG`,
                style: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    fill: '#ffdd44',
                    stroke: { color: '#000000', width: 3 }
                }
            });
            distText.anchor.set(0.5);
            distText.x = (startX + endX) / 2;
            distText.y = startY - 20;
            
            // 기존 텍스트 제거 후 추가
            if (this._distanceText && !this._distanceText.destroyed) {
                this._distanceText.destroy();
            }
            this._distanceText = distText;
            this.game.containers.effects.addChild(distText);
        } else {
            // 타겟 없으면 "대상 없음" 표시
            if (this._distanceText && !this._distanceText.destroyed) {
                this._distanceText.destroy();
            }
            
            const noTargetText = new PIXI.Text({
                text: '⚠ 같은 라인에 대상 없음',
                style: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    fill: '#ff6666',
                    stroke: { color: '#000000', width: 3 }
                }
            });
            noTargetText.anchor.set(0.5);
            noTargetText.x = startX + 150;
            noTargetText.y = startY - 20;
            
            this._distanceText = noTargetText;
            this.game.containers.effects.addChild(noTargetText);
        }
    },
    
    // ==========================================
    // 하이라이트 함수들
    // ==========================================
    highlightCell(x, z, valid) {
        if (!this.gridHighlight) return;
        this.gridHighlight.clear();
        
        if (x < 0 || z < 0) return;
        
        // Re-draw summon zones first
        this.showSummonZones();
        
        // Then highlight specific cell
        const corners = this.game.getCellCorners(x, z);
        if (!corners) return;
        
        const color = valid ? 0x44ff44 : 0xff4444;
        
        this.gridHighlight.moveTo(corners[0].x, corners[0].y);
        this.gridHighlight.lineTo(corners[1].x, corners[1].y);
        this.gridHighlight.lineTo(corners[2].x, corners[2].y);
        this.gridHighlight.lineTo(corners[3].x, corners[3].y);
        this.gridHighlight.closePath();
        this.gridHighlight.fill({ color: color, alpha: 0.4 });
        this.gridHighlight.stroke({ color: color, width: 3, alpha: 0.9 });
    },
    
    clearHighlight() {
        if (this.gridHighlight) {
            this.gridHighlight.clear();
        }
    },
    
    highlightEnemy(enemy, highlight) {
        this.clearEnemyHighlights();
        if (highlight && enemy && enemy.sprite) {
            enemy.sprite.tint = 0xff6666;
            this._highlightedEnemy = enemy;
        }
    },
    
    highlightEnemiesInAoe(enemies) {
        this.clearEnemyHighlights();
        this._highlightedEnemies = enemies;
        for (const enemy of enemies) {
            if (enemy && enemy.sprite) {
                enemy.sprite.tint = 0xff6666;
            }
        }
    },
    
    clearEnemyHighlights() {
        if (this._highlightedEnemy && this._highlightedEnemy.sprite) {
            this._highlightedEnemy.sprite.tint = 0xffffff;
        }
        this._highlightedEnemy = null;
        
        if (this._highlightedEnemies) {
            for (const enemy of this._highlightedEnemies) {
                if (enemy && enemy.sprite) {
                    enemy.sprite.tint = 0xffffff;
                }
            }
            this._highlightedEnemies = null;
        }
        
        for (const enemy of this.game.state.enemyUnits) {
            if (enemy.sprite) enemy.sprite.tint = 0xffffff;
        }
    },
    
    highlightAlly(ally, highlight) {
        this.clearAllyHighlights();
        if (highlight && ally && ally.sprite) {
            ally.sprite.tint = 0x66aaff;
            this._highlightedAlly = ally;
        }
    },
    
    clearAllyHighlights() {
        if (this._highlightedAlly && this._highlightedAlly.sprite) {
            this._highlightedAlly.sprite.tint = 0xffffff;
        }
        this._highlightedAlly = null;
        
        if (this.game.state.hero && this.game.state.hero.sprite) {
            this.game.state.hero.sprite.tint = 0xffffff;
        }
        for (const ally of this.game.state.playerUnits) {
            if (ally.sprite) ally.sprite.tint = 0xffffff;
        }
    },
    
    // ==========================================
    // AOE 하이라이트
    // ==========================================
    showAoeHighlight(centerX, centerZ, aoe) {
        this.clearAoeHighlight();
        
        if (!this.aoeHighlight) {
            this.aoeHighlight = new PIXI.Graphics();
            this.aoeHighlight.zIndex = 5;
            this.game.containers.effects.addChild(this.aoeHighlight);
        }
        
        const graphics = this.aoeHighlight;
        const halfDepth = Math.floor(aoe.depth / 2);
        
        for (let dx = 0; dx < aoe.width; dx++) {
            for (let dz = -halfDepth; dz <= halfDepth; dz++) {
                const x = centerX + dx;
                const z = centerZ + dz;
                
                if (z < 0 || z >= this.game.arena.depth) continue;
                if (x < 0 || x >= this.game.arena.width) continue;
                
                const corners = this.game.getCellCorners(x, z);
                if (!corners) continue;
                
                graphics.moveTo(corners[0].x, corners[0].y);
                graphics.lineTo(corners[1].x, corners[1].y);
                graphics.lineTo(corners[2].x, corners[2].y);
                graphics.lineTo(corners[3].x, corners[3].y);
                graphics.closePath();
                graphics.fill({ color: 0xff4444, alpha: 0.4 });
                graphics.stroke({ color: 0xff6666, width: 3, alpha: 0.9 });
            }
        }
    },
    
    clearAoeHighlight() {
        if (this.aoeHighlight) {
            this.aoeHighlight.clear();
        }
    },
    
    // 십자가 형태 AOE 하이라이트
    showCrossAoeHighlight(centerX, centerZ, range = 1) {
        this.clearAoeHighlight();
        
        if (!this.aoeHighlight) {
            this.aoeHighlight = new PIXI.Graphics();
            this.aoeHighlight.zIndex = 5;
            this.game.containers.effects.addChild(this.aoeHighlight);
        }
        
        const graphics = this.aoeHighlight;
        const cells = this.game.getCrossAoeCells(centerX, centerZ, range);
        
        for (const cell of cells) {
            const corners = this.game.getCellCorners(cell.x, cell.z);
            if (!corners) continue;
            
            graphics.moveTo(corners[0].x, corners[0].y);
            graphics.lineTo(corners[1].x, corners[1].y);
            graphics.lineTo(corners[2].x, corners[2].y);
            graphics.lineTo(corners[3].x, corners[3].y);
            graphics.closePath();
            graphics.fill({ color: 0xff6600, alpha: 0.5 });
            graphics.stroke({ color: 0xff8800, width: 3, alpha: 0.9 });
        }
    },
    
    // ==========================================
    // 타겟팅 커브 (FGO 스타일)
    // ==========================================
    drawTargetingCurvesToEnemies(cardX, cardY, hoveredEnemy, frontOnly = false) {
        if (!this.targetingCurve) {
            this.targetingCurve = new PIXI.Graphics();
            this.targetingCurve.zIndex = 15;
            this.game.containers.effects.addChild(this.targetingCurve);
        }
        
        const g = this.targetingCurve;
        g.clear();
        
        const validTargets = frontOnly ? this.getFrontlineEnemies() : 
                            this.game.state.enemyUnits.filter(e => e.hp > 0);
        
        for (const enemy of this.game.state.enemyUnits) {
            if (enemy.hp <= 0) continue;
            
            // ★ 새 구조: container에서 위치 (글로벌 좌표 사용!)
            const posTarget = enemy.container || enemy.sprite;
            if (!posTarget) continue;
            
            // ★ 글로벌 좌표로 변환 (부모 컨테이너 위치 포함)
            let endX, endY;
            if (posTarget.getGlobalPosition) {
                const globalPos = posTarget.getGlobalPosition();
                endX = globalPos.x;
                endY = globalPos.y - (enemy.sprite?.height || 60) / 2;
            } else {
                endX = posTarget.x;
                endY = posTarget.y - (enemy.sprite?.height || 60) / 2;
            }
            
            const isValidTarget = validTargets.includes(enemy);
            const isHovered = (enemy === hoveredEnemy);
            
            const midX = (cardX + endX) / 2;
            const midY = Math.min(cardY, endY) - 60;
            
            let color, alpha, lineWidth;
            if (!isValidTarget) {
                color = 0x666666;
                alpha = 0.2;
                lineWidth = 1;
            } else if (isHovered) {
                color = 0xff4444;
                alpha = 0.9;
                lineWidth = 4;
            } else {
                color = 0xffaa44;
                alpha = 0.4;
                lineWidth = 2;
            }
            
            g.moveTo(cardX, cardY);
            g.quadraticCurveTo(midX, midY, endX, endY);
            g.stroke({ color: color, width: lineWidth, alpha: alpha });
            
            if (isHovered) {
                g.moveTo(cardX, cardY);
                g.quadraticCurveTo(midX, midY, endX, endY);
                g.stroke({ color: 0xffffff, width: 2, alpha: 0.4 });
                
                g.circle(endX, endY, 18);
                g.stroke({ color: color, width: 3, alpha: 0.9 });
                g.circle(endX, endY, 10);
                g.fill({ color: color, alpha: 0.5 });
                
                // Crosshair
                g.moveTo(endX - 25, endY);
                g.lineTo(endX - 12, endY);
                g.moveTo(endX + 12, endY);
                g.lineTo(endX + 25, endY);
                g.moveTo(endX, endY - 25);
                g.lineTo(endX, endY - 12);
                g.moveTo(endX, endY + 12);
                g.lineTo(endX, endY + 25);
                g.stroke({ color: color, width: 2, alpha: 0.9 });
            } else {
                g.circle(endX, endY, 8);
                g.stroke({ color: color, width: 2, alpha: 0.4 });
            }
        }
        
        g.circle(cardX, cardY, 6);
        g.fill({ color: 0x44aaff, alpha: 0.8 });
    },
    
    clearTargetingCurve() {
        if (this.targetingCurve) {
            this.targetingCurve.clear();
        }
        // 거리 텍스트도 제거
        if (this._distanceText && !this._distanceText.destroyed) {
            this._distanceText.destroy();
            this._distanceText = null;
        }
    },
    
    // ==========================================
    // 소환 존 하이라이트
    // ==========================================
    showSummonZones() {
        if (!this.gridHighlight) return;
        
        this.gridHighlight.clear();
        
        for (let x = 0; x < this.game.arena.playerZoneX; x++) {
            for (let z = 0; z < this.game.arena.depth; z++) {
                if (this.game.isCellOccupied(x, z)) continue;
                
                const corners = this.game.getCellCorners(x, z);
                if (!corners) continue;
                
                this.gridHighlight.moveTo(corners[0].x, corners[0].y);
                this.gridHighlight.lineTo(corners[1].x, corners[1].y);
                this.gridHighlight.lineTo(corners[2].x, corners[2].y);
                this.gridHighlight.lineTo(corners[3].x, corners[3].y);
                this.gridHighlight.closePath();
                this.gridHighlight.fill({ color: 0x44ff44, alpha: 0.15 });
                this.gridHighlight.stroke({ color: 0x44ff44, width: 2, alpha: 0.5 });
            }
        }
    },
    
    hideSummonZones() {
        if (this.gridHighlight) {
            this.gridHighlight.clear();
        }
    }
};

console.log('[CardDrag] 카드 드래그 시스템 로드 완료');
