// ==========================================
// JRPG/VFX 스타일 타겟팅 라인 시스템
// ==========================================

const TargetingLine = {
    canvas: null,
    ctx: null,
    isActive: false,
    animationFrame: null,
    
    // 현재 타겟팅 정보
    startX: 0,
    startY: 0,
    mouseX: 0,
    mouseY: 0,
    cardType: 'attack',
    targetType: 'enemy', // enemy, allEnemy, self
    hoveredTarget: null, // 현재 호버된 타겟 요소
    
    // 색상 설정
    colors: {
        attack: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
        skill: { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
        power: { main: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
        field: { main: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' }
    },
    
    // ==========================================
    // 초기화 / 정리
    // ==========================================
    
    create() {
        this.remove();
        
        const canvas = document.createElement('canvas');
        canvas.id = 'targeting-line-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(canvas);
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isActive = true;
        this.hoveredTarget = null;
        
        // 애니메이션 루프 시작
        this.startAnimation();
    },
    
    remove() {
        this.isActive = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
        
        // 기존 캔버스 정리
        const existing = document.getElementById('targeting-line-canvas');
        if (existing) existing.remove();
        
        // 호버 오버레이 제거
        this.removeHoverOverlay();
        this.hoveredTarget = null;
    },
    
    // ==========================================
    // 업데이트
    // ==========================================
    
    update(startX, startY, mouseX, mouseY, cardType, targetType) {
        this.startX = startX;
        this.startY = startY;
        this.mouseX = mouseX;
        this.mouseY = mouseY;
        this.cardType = cardType || 'attack';
        this.targetType = targetType || 'enemy';
        
        // 호버된 타겟 체크
        this.checkHoveredTarget(mouseX, mouseY);
    },
    
    checkHoveredTarget(x, y) {
        let newHoveredTarget = null;
        
        if (this.targetType === 'enemy' || this.targetType === 'allEnemy') {
            // ✅ PixiJS EnemyRenderer 사용 시
            if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                const enemyData = EnemyRenderer.getEnemyAtPosition(x, y);
                if (enemyData) {
                    // PixiJS용 가상 타겟 객체 생성
                    newHoveredTarget = {
                        isPixiTarget: true,
                        enemy: enemyData.enemy,
                        centerX: enemyData.centerX,
                        centerY: enemyData.centerY,
                        width: enemyData.width,
                        height: enemyData.height,
                        getBoundingClientRect: () => ({
                            left: enemyData.left,
                            right: enemyData.right,
                            top: enemyData.top,
                            bottom: enemyData.bottom,
                            width: enemyData.width,
                            height: enemyData.height
                        })
                    };
                }
            } else {
                // 기존 DOM 방식
                const container = document.getElementById('enemies-container');
                if (container) {
                    const enemies = container.querySelectorAll('.enemy-unit:not(.dead)');
                    enemies.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                            newHoveredTarget = el;
                        }
                    });
                } else {
                    const enemyEl = document.getElementById('enemy');
                    if (enemyEl) {
                        const rect = enemyEl.getBoundingClientRect();
                        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                            newHoveredTarget = enemyEl;
                        }
                    }
                }
            }
        } else if (this.targetType === 'self') {
            // ✅ PixiJS PlayerRenderer 사용 시
            if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.enabled && PlayerRenderer.initialized) {
                const playerPos = PlayerRenderer.getPlayerPosition();
                if (playerPos) {
                    if (x >= playerPos.left && x <= playerPos.right && y >= playerPos.top && y <= playerPos.bottom) {
                        newHoveredTarget = {
                            isPixiTarget: true,
                            isPlayer: true,
                            centerX: playerPos.centerX,
                            centerY: playerPos.centerY,
                            width: playerPos.width,
                            height: playerPos.height,
                            getBoundingClientRect: () => ({
                                left: playerPos.left,
                                right: playerPos.right,
                                top: playerPos.top,
                                bottom: playerPos.bottom,
                                width: playerPos.width,
                                height: playerPos.height
                            })
                        };
                    }
                }
            } else {
                // 기존 DOM 방식
                const playerEl = document.getElementById('player');
                if (playerEl) {
                    const rect = playerEl.getBoundingClientRect();
                    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                        newHoveredTarget = playerEl;
                    }
                }
            }
        }
        
        // 호버 타겟 변경 시 오버레이 업데이트
        if (newHoveredTarget !== this.hoveredTarget) {
            this.hoveredTarget = newHoveredTarget;
            this.updateHoverOverlay();
        }
    },
    
    // ==========================================
    // 호버 오버레이 (타겟 위에 올렸을 때 강조)
    // ==========================================
    
    updateHoverOverlay() {
        this.removeHoverOverlay();
        
        if (!this.hoveredTarget) return;
        
        const rect = this.hoveredTarget.getBoundingClientRect();
        const color = this.colors[this.cardType] || this.colors.attack;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 크로스헤어 사이즈 (절반 크기)
        const outerRadius = Math.max(rect.width, rect.height) / 4 + 20;
        const innerRadius = outerRadius - 8;
        
        // 오버레이 컨테이너
        const overlay = document.createElement('div');
        overlay.id = 'target-hover-overlay';
        overlay.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        
        // 바깥 링 (회전하는 대시 패턴)
        const outerRing = document.createElement('div');
        outerRing.className = 'crosshair-outer-ring';
        outerRing.style.cssText = `
            position: absolute;
            left: ${centerX}px;
            top: ${centerY}px;
            width: ${outerRadius * 2}px;
            height: ${outerRadius * 2}px;
            transform: translate(-50%, -50%);
            border: 3px dashed ${color.main};
            border-radius: 50%;
            box-shadow: 
                0 0 20px ${color.main},
                0 0 40px ${color.glow};
            animation: crosshairSpin 3s linear infinite;
            opacity: 0.7;
        `;
        overlay.appendChild(outerRing);
        
        // 안쪽 링 (실선, 더 굵고 밝게)
        const innerRing = document.createElement('div');
        innerRing.className = 'crosshair-inner-ring';
        innerRing.style.cssText = `
            position: absolute;
            left: ${centerX}px;
            top: ${centerY}px;
            width: ${innerRadius * 2}px;
            height: ${innerRadius * 2}px;
            transform: translate(-50%, -50%);
            border: 4px solid ${color.main};
            border-radius: 50%;
            box-shadow: 
                0 0 25px ${color.main},
                0 0 50px ${color.glow},
                inset 0 0 30px ${color.glow};
            animation: crosshairPulse 0.6s ease-in-out infinite alternate;
        `;
        overlay.appendChild(innerRing);
        
        // 4개의 타겟 마커 (삼각형 화살표)
        const markerAngles = [0, 90, 180, 270];
        markerAngles.forEach((angle, i) => {
            const marker = document.createElement('div');
            marker.className = 'crosshair-marker';
            
            const rad = (angle * Math.PI) / 180;
            const markerDist = innerRadius + 12;
            const markerX = centerX + Math.cos(rad) * markerDist;
            const markerY = centerY + Math.sin(rad) * markerDist;
            
            marker.style.cssText = `
                position: absolute;
                left: ${markerX}px;
                top: ${markerY}px;
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 10px solid ${color.main};
                transform: translate(-50%, -50%) rotate(${angle + 90}deg);
                filter: drop-shadow(0 0 8px ${color.main}) drop-shadow(0 0 15px ${color.glow});
                animation: markerPulse 0.5s ease-in-out infinite alternate;
                animation-delay: ${i * 0.1}s;
            `;
            overlay.appendChild(marker);
        });
        
        // 십자선 (적당한 크기)
        const crossLines = [
            { angle: 0, length: 20 },    // 오른쪽
            { angle: 90, length: 20 },   // 아래
            { angle: 180, length: 20 },  // 왼쪽
            { angle: 270, length: 20 }   // 위
        ];
        
        crossLines.forEach((dir, i) => {
            const line = document.createElement('div');
            line.className = 'crosshair-line';
            
            const rad = (dir.angle * Math.PI) / 180;
            const startOffset = innerRadius - 10;
            const lineX = centerX + Math.cos(rad) * startOffset;
            const lineY = centerY + Math.sin(rad) * startOffset;
            
            line.style.cssText = `
                position: absolute;
                left: ${lineX}px;
                top: ${lineY}px;
                width: ${dir.length}px;
                height: 3px;
                background: linear-gradient(${dir.angle === 0 || dir.angle === 180 ? '90deg' : '0deg'}, 
                    ${color.main}, ${color.main}88);
                box-shadow: 0 0 15px ${color.main}, 0 0 30px ${color.glow};
                transform: translate(-50%, -50%) rotate(${dir.angle}deg);
                transform-origin: ${dir.angle === 0 ? 'left' : dir.angle === 180 ? 'right' : 'center'} center;
                animation: crosshairLinePulse 0.5s ease-in-out infinite alternate;
                animation-delay: ${i * 0.08}s;
            `;
            overlay.appendChild(line);
        });
        
        // 중앙 도트 (더 크고 밝게)
        const centerDot = document.createElement('div');
        centerDot.className = 'crosshair-center';
        centerDot.style.cssText = `
            position: absolute;
            left: ${centerX}px;
            top: ${centerY}px;
            width: 12px;
            height: 12px;
            background: radial-gradient(circle, white 30%, ${color.main} 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 
                0 0 15px ${color.main}, 
                0 0 30px ${color.glow},
                0 0 50px ${color.main};
            animation: crosshairDotPulse 0.3s ease-in-out infinite alternate;
        `;
        overlay.appendChild(centerDot);
        
        // 글로우 배경 (부드러운 조명 효과)
        const glowBg = document.createElement('div');
        glowBg.className = 'crosshair-glow-bg';
        glowBg.style.cssText = `
            position: absolute;
            left: ${centerX}px;
            top: ${centerY}px;
            width: ${outerRadius * 3}px;
            height: ${outerRadius * 3}px;
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, ${color.glow}40 0%, transparent 60%);
            border-radius: 50%;
            animation: glowPulse 1s ease-in-out infinite alternate;
            z-index: -1;
        `;
        overlay.appendChild(glowBg);
        
        document.body.appendChild(overlay);
    },
    
    removeHoverOverlay() {
        const existing = document.getElementById('target-hover-overlay');
        if (existing) existing.remove();
    },
    
    getTargetName(element) {
        if (!element) return null;
        
        // ✅ PixiJS 타겟인 경우
        if (element.isPixiTarget) {
            if (element.isPlayer) {
                return 'Player';
            }
            if (element.enemy) {
                return element.enemy.name || 'Enemy';
            }
            return null;
        }
        
        // 적 이름 찾기
        const nameEl = element.querySelector('.enemy-name');
        if (nameEl) return nameEl.textContent;
        
        // 플레이어
        if (element.id === 'player') {
            const playerName = element.querySelector('.player-name, .character-name');
            return playerName ? playerName.textContent : 'Player';
        }
        
        return null;
    },
    
    // ==========================================
    // 애니메이션 루프
    // ==========================================
    
    startAnimation() {
        const animate = () => {
            if (!this.isActive || !this.ctx) return;
            
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    },
    
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const color = this.colors[this.cardType] || this.colors.attack;
        
        // 타겟 요소들 가져오기
        let targets = [];
        
        if (this.targetType === 'enemy' || this.targetType === 'allEnemy') {
            // ✅ PixiJS EnemyRenderer 사용 시
            if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                const positions = EnemyRenderer.getEnemyScreenPositions();
                positions.forEach(pos => {
                    targets.push({
                        isPixiTarget: true,
                        centerX: pos.centerX,
                        centerY: pos.centerY,
                        enemy: pos.enemy,
                        getBoundingClientRect: () => ({
                            left: pos.left,
                            right: pos.right,
                            top: pos.top,
                            bottom: pos.bottom,
                            width: pos.width,
                            height: pos.height
                        })
                    });
                });
            } else {
                // 기존 DOM 방식
                const container = document.getElementById('enemies-container');
                if (container) {
                    container.querySelectorAll('.enemy-unit:not(.dead)').forEach(el => {
                        targets.push(el);
                    });
                } else {
                    const enemyEl = document.getElementById('enemy');
                    if (enemyEl) targets.push(enemyEl);
                }
            }
        } else if (this.targetType === 'self') {
            // ✅ PixiJS PlayerRenderer 사용 시
            if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.enabled && PlayerRenderer.initialized) {
                const playerPos = PlayerRenderer.getPlayerPosition();
                if (playerPos) {
                    targets.push({
                        isPixiTarget: true,
                        isPlayer: true,
                        centerX: playerPos.centerX,
                        centerY: playerPos.centerY,
                        getBoundingClientRect: () => ({
                            left: playerPos.left,
                            right: playerPos.right,
                            top: playerPos.top,
                            bottom: playerPos.bottom,
                            width: playerPos.width,
                            height: playerPos.height
                        })
                    });
                }
            } else {
                // 기존 DOM 방식
                const playerEl = document.getElementById('player');
                if (playerEl) targets.push(playerEl);
            }
        }
        
        // 각 타겟에 라인과 마커 그리기
        targets.forEach(targetEl => {
            let targetX, targetY;
            
            // ✅ PixiJS 타겟인 경우 centerX/Y 사용
            if (targetEl.isPixiTarget) {
                targetX = targetEl.centerX;
                targetY = targetEl.centerY;
            } else {
                const rect = targetEl.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
            }
            
            // 호버 체크 (PixiJS는 enemy/player 객체 비교)
            let isHovered = false;
            if (this.hoveredTarget) {
                if (targetEl.isPixiTarget && this.hoveredTarget.isPixiTarget) {
                    // 플레이어 타겟 비교
                    if (targetEl.isPlayer && this.hoveredTarget.isPlayer) {
                        isHovered = true;
                    }
                    // 적 타겟 비교
                    else if (targetEl.enemy && this.hoveredTarget.enemy) {
                        isHovered = targetEl.enemy === this.hoveredTarget.enemy;
                    }
                } else {
                    isHovered = targetEl === this.hoveredTarget;
                }
            }
            
            const isAllTarget = this.targetType === 'allEnemy';
            
            // 라인 그리기
            this.drawLine(ctx, this.mouseX, this.mouseY, targetX, targetY, color, isHovered, isAllTarget);
            
            // 마커 그리기 (호버되지 않은 타겟만 - 호버된 건 오버레이로)
            if (!isHovered) {
                this.drawMarker(ctx, targetX, targetY, color, false, isAllTarget);
            }
        });
    },
    
    // ==========================================
    // VFX 스타일 곡선 라인 그리기
    // ==========================================
    
    drawLine(ctx, startX, startY, endX, endY, color, isActive, isAllTarget) {
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const time = Date.now() * 0.003;
        
        if (distance < 30) return;
        
        // 베지어 곡선 컨트롤 포인트 계산
        const curve = this.calculateCurve(startX, startY, endX, endY, distance);
        
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // ============================================
        // 타겟팅 된 선: 풀 발광 / 안된 선: 매우 흐림
        // ============================================
        
        if (isActive) {
            // === 타겟팅 된 선: 풀 VFX ===
            
            // 레이어 1: 외곽 글로우 (강함)
            ctx.shadowColor = color.main;
            ctx.shadowBlur = 45;
            ctx.strokeStyle = `${color.main}60`;
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(curve.cpX, curve.cpY, endX, endY);
            ctx.stroke();
            
            // 레이어 2: 메인 컬러 (펄스)
            const pulseWidth = 8 + Math.sin(time * 5) * 2;
            ctx.shadowBlur = 35;
            ctx.strokeStyle = color.main;
            ctx.lineWidth = pulseWidth;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(curve.cpX, curve.cpY, endX, endY);
            ctx.stroke();
            
            // 레이어 3: 밝은 코어 (흰색)
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(curve.cpX, curve.cpY, endX, endY);
            ctx.stroke();
            
            // 에너지 파티클 (곡선 따라 이동)
            if (distance > 80) {
                const particleCount = 5;
                for (let i = 0; i < particleCount; i++) {
                    const t = ((time * 2.5 + i / particleCount) % 1);
                    const pos = this.getPointOnCurve(startX, startY, curve.cpX, curve.cpY, endX, endY, t);
                    const particleSize = 5 + Math.sin(time * 6 + i) * 2;
                    
                    // 파티클 트레일
                    for (let j = 1; j <= 3; j++) {
                        const trailT = Math.max(0, t - j * 0.025);
                        const trailPos = this.getPointOnCurve(startX, startY, curve.cpX, curve.cpY, endX, endY, trailT);
                        const trailAlpha = 0.4 - j * 0.1;
                        ctx.beginPath();
                        ctx.arc(trailPos.x, trailPos.y, particleSize * (1 - j * 0.2), 0, Math.PI * 2);
                        ctx.fillStyle = `${color.main}${Math.floor(trailAlpha * 255).toString(16).padStart(2, '0')}`;
                        ctx.fill();
                    }
                    
                    // 메인 파티클
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, particleSize, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = color.main;
                    ctx.shadowBlur = 20;
                    ctx.fill();
                }
            }
            
            // 화살촉 (발광)
            if (distance > 50) {
                const tangent = this.getCurveTangent(startX, startY, curve.cpX, curve.cpY, endX, endY, 0.95);
                const angle = Math.atan2(tangent.y, tangent.x);
                const arrowDist = 38;
                const arrowX = endX - Math.cos(angle) * arrowDist;
                const arrowY = endY - Math.sin(angle) * arrowDist;
                const arrowSize = 24;
                
                ctx.shadowColor = color.main;
                ctx.shadowBlur = 40;
                
                ctx.beginPath();
                ctx.moveTo(arrowX + Math.cos(angle) * arrowSize, arrowY + Math.sin(angle) * arrowSize);
                ctx.lineTo(arrowX + Math.cos(angle - Math.PI * 0.78) * arrowSize * 0.65, arrowY + Math.sin(angle - Math.PI * 0.78) * arrowSize * 0.65);
                ctx.lineTo(arrowX, arrowY);
                ctx.lineTo(arrowX + Math.cos(angle + Math.PI * 0.78) * arrowSize * 0.65, arrowY + Math.sin(angle + Math.PI * 0.78) * arrowSize * 0.65);
                ctx.closePath();
                
                const arrowGrad = ctx.createLinearGradient(arrowX, arrowY, arrowX + Math.cos(angle) * arrowSize, arrowY + Math.sin(angle) * arrowSize);
                arrowGrad.addColorStop(0, color.main);
                arrowGrad.addColorStop(1, '#ffffff');
                ctx.fillStyle = arrowGrad;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
        } else {
            // === 타겟팅 안된 선: 보이지만 덜 강조 ===
            
            ctx.globalAlpha = 0.5;
            ctx.shadowColor = color.main;
            ctx.shadowBlur = 10;
            
            // 실선으로 표시 (점선 대신)
            ctx.strokeStyle = `${color.main}`;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(curve.cpX, curve.cpY, endX, endY);
            ctx.stroke();
            
            // 코어 라인
            ctx.strokeStyle = `${color.main}aa`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(curve.cpX, curve.cpY, endX, endY);
            ctx.stroke();
            
            // 화살촉
            if (distance > 50) {
                const tangent = this.getCurveTangent(startX, startY, curve.cpX, curve.cpY, endX, endY, 0.95);
                const angle = Math.atan2(tangent.y, tangent.x);
                const arrowDist = 28;
                const arrowX = endX - Math.cos(angle) * arrowDist;
                const arrowY = endY - Math.sin(angle) * arrowDist;
                const arrowSize = 12;
                
                ctx.beginPath();
                ctx.moveTo(arrowX + Math.cos(angle) * arrowSize, arrowY + Math.sin(angle) * arrowSize);
                ctx.lineTo(arrowX + Math.cos(angle - Math.PI * 0.75) * arrowSize * 0.6, arrowY + Math.sin(angle - Math.PI * 0.75) * arrowSize * 0.6);
                ctx.lineTo(arrowX, arrowY);
                ctx.lineTo(arrowX + Math.cos(angle + Math.PI * 0.75) * arrowSize * 0.6, arrowY + Math.sin(angle + Math.PI * 0.75) * arrowSize * 0.6);
                ctx.closePath();
                ctx.fillStyle = color.main;
                ctx.fill();
            }
        }
        
        ctx.restore();
    },
    
    // 베지어 곡선 컨트롤 포인트 계산
    calculateCurve(x1, y1, x2, y2, distance) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        // 수직 방향으로 곡선 휘어짐
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // 곡률 (거리에 비례, 최대 제한)
        const curvature = Math.min(distance * 0.25, 120);
        
        // 시작점이 끝점보다 아래에 있으면 위로 휘고, 아니면 아래로 휨
        // 일반적으로 위로 휘는 것이 더 자연스러움
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        // 항상 위로 휘도록 (음수 Y 방향)
        const curveDirection = perpY < 0 ? 1 : -1;
        
        return {
            cpX: midX + perpX * curvature * curveDirection,
            cpY: midY + perpY * curvature * curveDirection - curvature * 0.3
        };
    },
    
    // 베지어 곡선 위의 점 계산
    getPointOnCurve(x1, y1, cpX, cpY, x2, y2, t) {
        const mt = 1 - t;
        return {
            x: mt * mt * x1 + 2 * mt * t * cpX + t * t * x2,
            y: mt * mt * y1 + 2 * mt * t * cpY + t * t * y2
        };
    },
    
    // 베지어 곡선의 접선 벡터 계산
    getCurveTangent(x1, y1, cpX, cpY, x2, y2, t) {
        const mt = 1 - t;
        return {
            x: 2 * mt * (cpX - x1) + 2 * t * (x2 - cpX),
            y: 2 * mt * (cpY - y1) + 2 * t * (y2 - cpY)
        };
    },
    
    // ==========================================
    // 타겟 마커 그리기 (비호버 타겟용)
    // ==========================================
    
    drawMarker(ctx, x, y, color, isActive, isAllTarget) {
        const time = Date.now() * 0.002;
        const size = isActive ? 50 : 35;
        const rotation = time * 0.5;
        
        ctx.save();
        ctx.translate(x, y);
        
        // 외곽 회전 마름모
        ctx.save();
        ctx.rotate(rotation);
        ctx.shadowColor = color.main;
        ctx.shadowBlur = isAllTarget ? 20 : 12;
        ctx.strokeStyle = isAllTarget ? color.main : `${color.main}77`;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        
        // 내부 십자
        ctx.save();
        ctx.rotate(-rotation * 1.5);
        const crossSize = size * 0.5;
        ctx.strokeStyle = `${color.main}99`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -crossSize);
        ctx.lineTo(0, crossSize);
        ctx.moveTo(-crossSize, 0);
        ctx.lineTo(crossSize, 0);
        ctx.stroke();
        ctx.restore();
        
        // 중앙점
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = `${color.main}88`;
        ctx.fill();
        
        ctx.restore();
    }
};

// ==========================================
// CSS 스타일 주입
// ==========================================
const targetingStyles = document.createElement('style');
targetingStyles.textContent = `
    /* 바깥 링 회전 */
    @keyframes crosshairSpin {
        0% { 
            transform: translate(-50%, -50%) rotate(0deg);
        }
        100% { 
            transform: translate(-50%, -50%) rotate(360deg);
        }
    }
    
    /* 안쪽 링 펄스 */
    @keyframes crosshairPulse {
        0% { 
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(0.97);
            filter: brightness(1);
        }
        100% { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.03);
            filter: brightness(1.4);
        }
    }
    
    /* 크로스헤어 라인 펄스 */
    @keyframes crosshairLinePulse {
        0% { 
            opacity: 0.7;
            filter: brightness(1);
        }
        100% { 
            opacity: 1;
            filter: brightness(1.5);
        }
    }
    
    /* 크로스헤어 중앙 도트 펄스 */
    @keyframes crosshairDotPulse {
        0% { 
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(0.9);
            filter: brightness(1);
        }
        100% { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
            filter: brightness(1.5);
        }
    }
    
    /* 타겟 마커 펄스 */
    @keyframes markerPulse {
        0% { 
            opacity: 0.7;
            transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scale(0.9);
        }
        100% { 
            opacity: 1;
            transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scale(1.1);
        }
    }
    
    /* 배경 글로우 펄스 */
    @keyframes glowPulse {
        0% { 
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(0.95);
        }
        100% { 
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.05);
        }
    }
    
    @keyframes bracketPulse {
        0% { 
            opacity: 0.8;
            filter: brightness(1);
        }
        100% { 
            opacity: 1;
            filter: brightness(1.3);
        }
    }
    
    @keyframes nameTagBounce {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
        }
        100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes lockedPulse {
        0%, 100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
        }
        50% {
            opacity: 0.8;
            transform: translateX(-50%) scale(1.05);
        }
    }
`;
document.head.appendChild(targetingStyles);

// 전역 등록
window.TargetingLine = TargetingLine;

console.log('[TargetingLine] 타겟팅 라인 시스템 로드 완료');

