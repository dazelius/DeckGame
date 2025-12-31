// ==========================================
// Gambler VFX System - Canvas 2D 기반
// vfx.js 스타일의 고품질 겜블러 이펙트
// ==========================================

const GamblerVFX = {
    canvas: null,
    ctx: null,
    particles: [],
    animations: [],
    isRunning: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[GamblerVFX] init 호출');
        
        // 이미 초기화되었으면 스킵
        if (this.canvas && document.getElementById('gambler-vfx-canvas')) {
            console.log('[GamblerVFX] 이미 초기화됨, 스킵');
            return;
        }
        
        // 기존 캔버스 제거 (있다면)
        const existing = document.getElementById('gambler-vfx-canvas');
        if (existing) {
            console.log('[GamblerVFX] 기존 캔버스 제거');
            existing.remove();
        }
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gambler-vfx-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 99999;
        `;
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        // 최적화 VFX용 CSS 주입
        if (!document.getElementById('gambler-vfx-styles')) {
            const style = document.createElement('style');
            style.id = 'gambler-vfx-styles';
            style.textContent = `
                @keyframes fastChipFall {
                    0% {
                        transform: translateY(0) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    80% {
                        transform: translateY(calc(var(--target-y) + 30px)) rotate(360deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(var(--target-y)) rotate(380deg) scale(0.5);
                        opacity: 0;
                    }
                }
                
                .fast-chip-hit {
                    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8));
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('[GamblerVFX] Canvas 이펙트 시스템 초기화 완료');
    },
    
    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    // ==========================================
    // 애니메이션 루프
    // ==========================================
    ensureInit() {
        // Canvas가 없거나 DOM에서 제거되었으면 초기화
        if (!this.canvas || !this.ctx || !document.getElementById('gambler-vfx-canvas')) {
            console.log('[GamblerVFX] Canvas 재초기화 필요');
            this.init();
        }
        
        // 루프도 미리 시작 (첫 프레임 누락 방지)
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    },
    
    ensureLoop() {
        // 초기화 확인
        this.ensureInit();
        
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    },
    
    loop() {
        // Canvas 상태 확인
        if (!this.ctx || !this.canvas) {
            this.ensureInit();
            if (!this.ctx || !this.canvas) return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 파티클 업데이트 & 렌더링
        this.particles = this.particles.filter(p => {
            if (!p.alive) return false;
            if (typeof p.update === 'function') p.update();
            if (p.alive && typeof p.draw === 'function') p.draw(this.ctx);
            return p.alive;
        });
        
        // 애니메이션 업데이트 & 렌더링
        this.animations = this.animations.filter(a => {
            if (!a.alive) return false;
            if (typeof a.update === 'function') a.update();
            if (a.alive && typeof a.draw === 'function') a.draw(this.ctx);
            return a.alive;
        });
        
        if (this.particles.length > 0 || this.animations.length > 0) {
            requestAnimationFrame(() => this.loop());
        } else {
            this.isRunning = false;
        }
    },
    
    // ==========================================
    // 럭키 스트라이크 - 숫자 스핀 VFX (슬롯머신 스타일)
    // ==========================================
    playLuckyStrike(x, y, min, max, finalValue, onComplete) {
        console.log('[GamblerVFX] playLuckyStrike 호출:', { x, y, min, max, finalValue });
        
        // 확실한 초기화 및 루프 시작
        this.ensureInit();
        
        // 다음 프레임에 애니메이션 추가 (첫 프레임 누락 방지)
        requestAnimationFrame(() => {
            this._addLuckyStrikeAnimation(x, y, min, max, finalValue, onComplete);
        });
    },
    
    _addLuckyStrikeAnimation(x, y, min, max, finalValue, onComplete) {
        console.log('[GamblerVFX] 럭키스트라이크 애니메이션 추가');
        
        const isMax = finalValue === max;
        const isMin = finalValue === min;
        const isHigh = finalValue > (min + max) / 2;
        const rollDuration = 800;   // 롤링 시간
        const showDuration = 1200;  // 결과 표시 시간
        
        // 숫자 스핀 애니메이션
        this.animations.push({
            x, y,
            min, max, finalValue,
            isMax, isMin, isHigh,
            startTime: Date.now(),
            rollDuration,
            showDuration,
            totalDuration: rollDuration + showDuration,
            spinOffset: 0,           // 숫자 스핀 오프셋
            spinSpeed: 40,           // 시작 속도
            currentDisplay: min,
            phase: 'spinning',       // spinning -> stopping -> reveal -> display
            stopProgress: 0,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                
                if (elapsed < this.rollDuration) {
                    this.phase = 'spinning';
                    
                    // 점점 느려지는 스핀
                    const progress = elapsed / this.rollDuration;
                    const easeOut = 1 - Math.pow(progress, 2);
                    this.spinSpeed = 40 * easeOut + 2;
                    this.spinOffset += this.spinSpeed;
                    
                    // 현재 표시될 숫자 계산 (스핀 오프셋 기반)
                    const range = this.max - this.min + 1;
                    const numIndex = Math.floor(this.spinOffset / 30) % range;
                    this.currentDisplay = this.min + numIndex;
                    
                    // 마지막 20%에서 최종값으로 수렴
                    if (progress > 0.8) {
                        const converge = (progress - 0.8) / 0.2;
                        if (converge > 0.5 || Math.random() < converge) {
                            this.currentDisplay = this.finalValue;
                        }
                    }
                } else if (elapsed < this.rollDuration + 150) {
                    this.phase = 'stopping';
                    this.currentDisplay = this.finalValue;
                    this.stopProgress = (elapsed - this.rollDuration) / 150;
                } else if (elapsed < this.rollDuration + 400) {
                    this.phase = 'reveal';
                    this.currentDisplay = this.finalValue;
                } else {
                    this.phase = 'display';
                }
                
                if (elapsed >= this.totalDuration) {
                    this.alive = false;
                    if (onComplete) onComplete();
                }
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const isSpinning = this.phase === 'spinning';
                const isStopping = this.phase === 'stopping';
                const isReveal = this.phase === 'reveal';
                
                ctx.save();
                
                // 페이드아웃
                if (this.phase === 'display') {
                    const displayElapsed = elapsed - this.rollDuration - 400;
                    const displayDuration = this.showDuration - 400;
                    if (displayElapsed > displayDuration * 0.6) {
                        ctx.globalAlpha = 1 - (displayElapsed - displayDuration * 0.6) / (displayDuration * 0.4);
                    }
                }
                
                // === 메인 숫자 ===
                const baseY = this.y - 40;
                
                // 색상 결정
                let mainColor, glowColor;
                if (isSpinning) {
                    mainColor = '#ffffff';
                    glowColor = '#fbbf24';
                } else if (this.isMax) {
                    mainColor = '#fbbf24';
                    glowColor = '#fbbf24';
                } else if (this.isMin) {
                    mainColor = '#ef4444';
                    glowColor = '#ef4444';
                } else if (this.isHigh) {
                    mainColor = '#60a5fa';
                    glowColor = '#60a5fa';
                } else {
                    mainColor = '#94a3b8';
                    glowColor = '#64748b';
                }
                
                // 스핀 중 블러 효과 (위아래 숫자)
                if (isSpinning) {
                    const range = this.max - this.min + 1;
                    const prevNum = this.min + ((this.currentDisplay - this.min - 1 + range) % range);
                    const nextNum = this.min + ((this.currentDisplay - this.min + 1) % range);
                    const spinPhase = (this.spinOffset % 30) / 30;
                    
                    // 위 숫자 (흐릿하게)
                    ctx.save();
                    ctx.globalAlpha = 0.3 * (1 - spinPhase);
                    ctx.font = 'bold 48px Cinzel, serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#666';
                    ctx.fillText(prevNum, this.x, baseY - 50 + spinPhase * 50);
                    ctx.restore();
                    
                    // 아래 숫자 (흐릿하게)
                    ctx.save();
                    ctx.globalAlpha = 0.3 * spinPhase;
                    ctx.font = 'bold 48px Cinzel, serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#666';
                    ctx.fillText(nextNum, this.x, baseY + 50 - (1 - spinPhase) * 50);
                    ctx.restore();
                }
                
                // 메인 숫자
                const bounce = isStopping ? Math.sin(this.stopProgress * Math.PI) * 8 : 0;
                const scale = isReveal ? 1.2 + Math.sin((elapsed - this.rollDuration - 150) * 0.02) * 0.1 : 
                             isStopping ? 1 + this.stopProgress * 0.3 : 1;
                const yOffset = isSpinning ? Math.sin(this.spinOffset * 0.1) * 2 : -bounce;
                
                ctx.save();
                ctx.translate(this.x, baseY + yOffset);
                ctx.scale(scale, scale);
                
                // 글로우
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = isSpinning ? 15 + Math.sin(elapsed * 0.02) * 10 : 
                                isReveal ? 40 : 25;
                
                // 폰트
                const fontSize = this.isMax ? 72 : this.isMin ? 56 : 64;
                ctx.font = `bold ${fontSize}px Cinzel, serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 외곽선
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 4;
                ctx.strokeText(this.currentDisplay, 0, 0);
                
                // 메인 텍스트
                if (this.isMax && !isSpinning) {
                    const gradient = ctx.createLinearGradient(-30, -20, 30, 20);
                    gradient.addColorStop(0, '#fbbf24');
                    gradient.addColorStop(0.5, '#ffffff');
                    gradient.addColorStop(1, '#f59e0b');
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = mainColor;
                }
                ctx.fillText(this.currentDisplay, 0, 0);
                
                ctx.restore();
                
                // === MIN/MAX 인디케이터 ===
                if ((isReveal || this.phase === 'display') && (this.isMax || this.isMin)) {
                    const indicatorElapsed = elapsed - this.rollDuration - 150;
                    const indicatorProgress = Math.min(indicatorElapsed / 200, 1);
                    const indicatorScale = 0.5 + indicatorProgress * 0.5;
                    const indicatorAlpha = indicatorProgress;
                    
                    ctx.save();
                    ctx.translate(this.x, baseY + 55);
                    ctx.scale(indicatorScale, indicatorScale);
                    ctx.globalAlpha = indicatorAlpha * (ctx.globalAlpha || 1);
                    
                    ctx.font = 'bold 28px Cinzel, serif';
                    ctx.textAlign = 'center';
                    
                    if (this.isMax) {
                        const pulse = 1 + Math.sin(elapsed * 0.015) * 0.1;
                        ctx.scale(pulse, pulse);
                        
                        ctx.shadowColor = '#fbbf24';
                        ctx.shadowBlur = 30;
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 3;
                        ctx.strokeText('⭐ MAX! ⭐', 0, 0);
                        
                        const gradient = ctx.createLinearGradient(-60, 0, 60, 0);
                        gradient.addColorStop(0, '#fbbf24');
                        gradient.addColorStop(0.5, '#ffffff');
                        gradient.addColorStop(1, '#f59e0b');
                        ctx.fillStyle = gradient;
                        ctx.fillText('⭐ MAX! ⭐', 0, 0);
                    } else if (this.isMin) {
                        ctx.shadowColor = '#ef4444';
                        ctx.shadowBlur = 15;
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 3;
                        ctx.strokeText('💀 MIN...', 0, 0);
                        ctx.fillStyle = '#ef4444';
                        ctx.fillText('💀 MIN...', 0, 0);
                    }
                    
                    ctx.restore();
                }
                
                // === 스핀 중 트레일 파티클 ===
                if (isSpinning && Math.random() < 0.3) {
                    const particleX = this.x + (Math.random() - 0.5) * 60;
                    const particleY = baseY + (Math.random() - 0.5) * 40;
                    GamblerVFX.particles.push({
                        x: particleX, y: particleY,
                        vx: (Math.random() - 0.5) * 50,
                        vy: -30 - Math.random() * 30,
                        size: 3 + Math.random() * 3,
                        color: '#fbbf24',
                        life: 1,
                        alive: true,
                        update() {
                            this.x += this.vx * 0.016;
                            this.y += this.vy * 0.016;
                            this.life -= 0.05;
                            if (this.life <= 0) this.alive = false;
                        },
                        draw(ctx) {
                            ctx.save();
                            ctx.globalAlpha = this.life * 0.6;
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 8;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                    });
                }
                
                ctx.restore();
            }
        });
        
        // 결과 이펙트 + 칩 드롭
        setTimeout(() => {
            // 칩 드롭 VFX
            this.playChipDrop(x, y, finalValue, isMax, isMin);
            
            if (isMax) {
                this.screenShake(10, 300);
            } else if (isMin) {
                this.screenShake(5, 150);
            }
        }, rollDuration + 100);
    },
    
    // ==========================================
    // 칩 드롭 VFX - 숫자만큼 칩이 떨어져서 충돌
    // ==========================================
    playChipDrop(targetX, targetY, count, isMax, isMin) {
        this.ensureInit();
        this.ensureLoop();
        
        const dropHeight = 300;  // 떨어지는 높이
        const chipSize = isMax ? 22 : isMin ? 14 : 18;
        const colors = isMax ? ['#fbbf24', '#f59e0b', '#fcd34d'] :
                      isMin ? ['#6b7280', '#4b5563', '#374151'] :
                      ['#60a5fa', '#3b82f6', '#93c5fd'];
        
        for (let i = 0; i < count; i++) {
            const delay = i * 60;  // 순차적으로 떨어짐
            const startX = targetX + (Math.random() - 0.5) * 150;
            const startY = targetY - dropHeight - Math.random() * 100;
            
            setTimeout(() => {
                this.animations.push({
                    x: startX,
                    y: startY,
                    targetX: targetX + (Math.random() - 0.5) * 40,
                    targetY: targetY,
                    size: chipSize,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 20,
                    vy: 0,
                    gravity: 1500,
                    phase: 'falling',  // falling -> impact -> bounce -> done
                    bounceCount: 0,
                    maxBounces: 2,
                    startTime: Date.now(),
                    isMax,
                    isMin,
                    alive: true,
                    
                    update() {
                        const dt = 0.016;
                        
                        if (this.phase === 'falling') {
                            this.vy += this.gravity * dt;
                            this.y += this.vy * dt;
                            this.rotation += this.rotSpeed * dt;
                            
                            // 목표 지점 도달
                            if (this.y >= this.targetY) {
                                this.y = this.targetY;
                                this.phase = 'impact';
                                
                                // 충돌 이펙트
                                GamblerVFX.playChipImpact(this.targetX, this.targetY, this.color, this.isMax);
                            }
                        } else if (this.phase === 'impact') {
                            // 바운스
                            if (this.bounceCount < this.maxBounces) {
                                this.vy = -this.vy * 0.4;
                                this.phase = 'bounce';
                                this.bounceCount++;
                            } else {
                                this.phase = 'done';
                            }
                        } else if (this.phase === 'bounce') {
                            this.vy += this.gravity * dt;
                            this.y += this.vy * dt;
                            this.x += (this.targetX - this.x) * 0.1;
                            this.rotation += this.rotSpeed * dt * 0.5;
                            
                            if (this.y >= this.targetY) {
                                this.y = this.targetY;
                                this.phase = 'impact';
                            }
                        } else if (this.phase === 'done') {
                            // 페이드아웃
                            this.size *= 0.9;
                            if (this.size < 1) this.alive = false;
                        }
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        
                        // 그림자
                        if (this.phase === 'falling') {
                            const shadowScale = 1 - (this.targetY - this.y) / 400;
                            ctx.globalAlpha = 0.3 * shadowScale;
                            ctx.fillStyle = '#000';
                            ctx.beginPath();
                            ctx.ellipse(0, this.targetY - this.y + 5, this.size * shadowScale, this.size * 0.3 * shadowScale, 0, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        
                        ctx.globalAlpha = 1;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = this.isMax ? 20 : 10;
                        
                        // 칩 외곽
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                        ctx.fillStyle = this.color;
                        ctx.fill();
                        
                        // 칩 테두리
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        
                        // 칩 내부 원
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        
                        // 칩 중앙 점
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.fill();
                        
                        ctx.restore();
                    }
                });
                
                this.ensureLoop();
            }, delay);
        }
    },
    
    // ==========================================
    // 칩 쉴드 VFX - 포춘 가드용
    // ==========================================
    playChipShield(x, y, min, max, finalValue, onComplete) {
        console.log('[GamblerVFX] playChipShield 호출:', { x, y, min, max, finalValue });
        this.ensureInit();  // Canvas 초기화 확인
        this.ensureLoop();
        console.log('[GamblerVFX] Canvas 상태:', { 
            canvas: !!this.canvas, 
            ctx: !!this.ctx,
            canvasInDOM: !!document.getElementById('gambler-vfx-canvas')
        });
        
        const isMax = finalValue === max;
        const isMin = finalValue === min;
        const chipCount = finalValue;
        const spinDuration = 600;   // 숫자 스핀
        const shieldDuration = 800; // 쉴드 형성
        const showDuration = 600;   // 유지
        
        // 칩들이 모여서 방패 형성
        const chips = [];
        const shieldRadius = 60;
        
        for (let i = 0; i < chipCount; i++) {
            const angle = (Math.PI * 2 / chipCount) * i - Math.PI / 2;
            chips.push({
                startX: x + (Math.random() - 0.5) * 300,
                startY: y - 200 - Math.random() * 100,
                targetX: x + Math.cos(angle) * shieldRadius,
                targetY: y + Math.sin(angle) * shieldRadius,
                size: isMax ? 18 : isMin ? 12 : 15,
                rotation: Math.random() * Math.PI * 2,
                delay: i * 40
            });
        }
        
        // 메인 애니메이션
        this.animations.push({
            x, y,
            min, max, finalValue,
            isMax, isMin,
            chips,
            shieldRadius,
            spinDuration,
            shieldDuration,
            showDuration,
            totalDuration: spinDuration + shieldDuration + showDuration,
            startTime: Date.now(),
            currentDisplay: min,
            phase: 'spin',  // spin -> gather -> shield -> done
            shieldAlpha: 0,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                
                if (elapsed < this.spinDuration) {
                    // 숫자 스핀
                    this.phase = 'spin';
                    const progress = elapsed / this.spinDuration;
                    const range = this.max - this.min + 1;
                    
                    if (progress < 0.7) {
                        this.currentDisplay = this.min + Math.floor(Math.random() * range);
                    } else {
                        this.currentDisplay = this.finalValue;
                    }
                } else if (elapsed < this.spinDuration + this.shieldDuration) {
                    // 칩 모으기 + 쉴드 형성
                    this.phase = 'gather';
                    const gatherProgress = (elapsed - this.spinDuration) / this.shieldDuration;
                    this.shieldAlpha = Math.min(gatherProgress * 1.5, 1);
                } else if (elapsed < this.totalDuration) {
                    // 쉴드 유지
                    this.phase = 'shield';
                } else {
                    this.phase = 'done';
                    this.alive = false;
                    if (onComplete) onComplete();
                }
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                
                ctx.save();
                
                // 페이드아웃
                if (this.phase === 'shield') {
                    const fadeProgress = (elapsed - this.spinDuration - this.shieldDuration) / this.showDuration;
                    if (fadeProgress > 0.5) {
                        ctx.globalAlpha = 1 - (fadeProgress - 0.5) * 2;
                    }
                }
                
                // === 숫자 스핀 (중앙 위) ===
                if (this.phase === 'spin' || this.phase === 'gather') {
                    const numY = this.y - 80;
                    const spinProgress = Math.min(elapsed / this.spinDuration, 1);
                    const numScale = this.phase === 'gather' ? 1 + (1 - spinProgress) * 0.3 : 1;
                    const numAlpha = this.phase === 'gather' ? 
                        1 - ((elapsed - this.spinDuration) / this.shieldDuration) : 1;
                    
                    ctx.save();
                    ctx.translate(this.x, numY);
                    ctx.scale(numScale, numScale);
                    ctx.globalAlpha = numAlpha;
                    
                    // 색상
                    let color = this.isMax ? '#fbbf24' : this.isMin ? '#ef4444' : '#60a5fa';
                    
                    ctx.font = 'bold 48px Cinzel, serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 3;
                    ctx.strokeText(this.currentDisplay, 0, 0);
                    ctx.fillStyle = color;
                    ctx.fillText(this.currentDisplay, 0, 0);
                    
                    // MAX/MIN
                    if (this.phase === 'gather' && (this.isMax || this.isMin)) {
                        ctx.font = 'bold 20px Cinzel, serif';
                        ctx.fillText(this.isMax ? '⭐MAX!' : '💀MIN', 0, 30);
                    }
                    
                    ctx.restore();
                }
                
                // === 칩들 ===
                const gatherProgress = this.phase === 'spin' ? 0 : 
                    Math.min((elapsed - this.spinDuration) / (this.shieldDuration * 0.6), 1);
                const easeOut = 1 - Math.pow(1 - gatherProgress, 3);
                
                this.chips.forEach((chip, i) => {
                    const chipElapsed = elapsed - chip.delay;
                    if (chipElapsed < 0) return;
                    
                    // 위치 보간
                    const currentX = chip.startX + (chip.targetX - chip.startX) * easeOut;
                    const currentY = chip.startY + (chip.targetY - chip.startY) * easeOut;
                    
                    // 회전
                    chip.rotation += 0.1 * (1 - easeOut);
                    
                    ctx.save();
                    ctx.translate(currentX, currentY);
                    ctx.rotate(chip.rotation);
                    
                    // 칩 색상
                    const chipColor = this.isMax ? '#fbbf24' : this.isMin ? '#6b7280' : '#60a5fa';
                    
                    ctx.shadowColor = chipColor;
                    ctx.shadowBlur = gatherProgress > 0.8 ? 15 : 8;
                    
                    // 칩 그리기
                    ctx.beginPath();
                    ctx.arc(0, 0, chip.size, 0, Math.PI * 2);
                    ctx.fillStyle = chipColor;
                    ctx.fill();
                    
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, chip.size * 0.6, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                    ctx.stroke();
                    
                    ctx.restore();
                });
                
                // === 쉴드 오라 ===
                if (this.shieldAlpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = this.shieldAlpha * 0.4 * (ctx.globalAlpha || 1);
                    
                    const shieldColor = this.isMax ? '#fbbf24' : this.isMin ? '#6b7280' : '#60a5fa';
                    
                    // 육각형 쉴드
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i - Math.PI / 2;
                        const px = this.x + Math.cos(angle) * (this.shieldRadius + 20);
                        const py = this.y + Math.sin(angle) * (this.shieldRadius + 20);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    
                    ctx.strokeStyle = shieldColor;
                    ctx.lineWidth = 4;
                    ctx.shadowColor = shieldColor;
                    ctx.shadowBlur = 30;
                    ctx.stroke();
                    
                    // 내부 그라데이션
                    const gradient = ctx.createRadialGradient(
                        this.x, this.y, 0, 
                        this.x, this.y, this.shieldRadius + 20
                    );
                    gradient.addColorStop(0, shieldColor + '40');
                    gradient.addColorStop(0.7, shieldColor + '20');
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    
                    ctx.restore();
                }
                
                ctx.restore();
            }
        });
        
        // 쉴드 완성 시 이펙트
        setTimeout(() => {
            if (isMax) {
                this.playSparkBurst(x, y, '#fbbf24', 20);
                this.screenShake(5, 150);
            }
        }, spinDuration + shieldDuration * 0.8);
    },
    
    // ==========================================
    // 칩 충돌 이펙트
    // ==========================================
    playChipImpact(x, y, color, isMax) {
        this.ensureInit();
        this.ensureLoop();
        
        // 스파크
        const sparkCount = isMax ? 12 : 8;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 / sparkCount) * i + Math.random() * 0.3;
            const speed = 80 + Math.random() * 60;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                size: 4 + Math.random() * 3,
                color,
                gravity: 400,
                life: 1,
                alive: true,
                
                update() {
                    this.vy += this.gravity * 0.016;
                    this.x += this.vx * 0.016;
                    this.y += this.vy * 0.016;
                    this.vx *= 0.96;
                    this.life -= 0.04;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
        
        // 충격 링
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: isMax ? 60 : 40,
            color,
            startTime: Date.now(),
            duration: 200,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.radius = this.maxRadius * progress;
                
                ctx.save();
                ctx.globalAlpha = (1 - progress) * 0.6;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3 * (1 - progress);
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
        
        // MAX일 때 추가 이펙트
        if (isMax) {
            this.playSparkBurst(x, y, '#fbbf24', 6);
        }
    },
    
    // ==========================================
    // 도박 결과 이펙트 (간단 버전)
    // ==========================================
    playGambleResult(value, min, max, x, y, type = 'damage') {
        this.ensureInit();
        
        const isHigh = value >= (min + max) / 2;
        const isMax = value === max;
        const isMin = value === min;
        
        this.ensureLoop();
        
        // 숫자 팝업 애니메이션
        this.animations.push({
            x, y,
            value,
            isMax,
            isMin,
            isHigh,
            startTime: Date.now(),
            duration: 1200,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                if (elapsed >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 이징: 빠르게 올라갔다 천천히 사라짐
                const yOffset = -80 * (1 - Math.pow(1 - Math.min(progress * 2, 1), 3));
                const scale = progress < 0.15 ? 0.5 + progress * 5 : 
                             progress < 0.3 ? 1.25 - (progress - 0.15) * 1.5 : 1;
                const alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
                
                ctx.save();
                ctx.translate(this.x, this.y + yOffset);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                
                // 텍스트 설정
                const fontSize = this.isMax ? 48 : this.isMin ? 36 : 40;
                ctx.font = `bold ${fontSize}px 'Cinzel', serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 색상
                let color, glowColor;
                if (this.isMax) {
                    color = '#fbbf24';
                    glowColor = 'rgba(251, 191, 36, 0.8)';
                } else if (this.isMin) {
                    color = '#ef4444';
                    glowColor = 'rgba(239, 68, 68, 0.5)';
                } else if (this.isHigh) {
                    color = '#60a5fa';
                    glowColor = 'rgba(96, 165, 250, 0.5)';
                } else {
                    color = '#ffffff';
                    glowColor = 'rgba(255, 255, 255, 0.3)';
                }
                
                // 글로우
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 30;
                
                // 텍스트
                const text = this.isMax ? `🎉 ${this.value}!` : 
                            this.isMin ? `💔 ${this.value}` : 
                            this.isHigh ? `✨ ${this.value}` : `${this.value}`;
                
                // 외곽선
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 4;
                ctx.strokeText(text, 0, 0);
                
                // 메인 텍스트
                ctx.fillStyle = color;
                ctx.fillText(text, 0, 0);
                
                ctx.restore();
            }
        });
        
        // 파티클 효과
        if (isMax) {
            this.playJackpotParticles(x, y);
            this.playGoldenBurst(x, y);
        } else if (isHigh) {
            this.playSparkBurst(x, y, '#60a5fa', 15);
        } else if (isMin) {
            this.playDarkParticles(x, y);
        }
    },
    
    // ==========================================
    // 잭팟 파티클 (최대값) - 칩 모양
    // ==========================================
    playJackpotParticles(x, y) {
        this.ensureInit();
        const colors = ['#fbbf24', '#f59e0b', '#fcd34d', '#fef3c7'];
        
        this.ensureLoop();
        
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.3;
            const speed = 200 + Math.random() * 150;
            const size = 8 + Math.random() * 10;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                size,
                originalSize: size,
                color,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 15,
                gravity: 400,
                life: 1,
                decay: 0.012 + Math.random() * 0.008,
                alive: true,
                
                update() {
                    const dt = 0.016;
                    this.vy += this.gravity * dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.98;
                    this.rotation += this.rotSpeed * dt;
                    this.life -= this.decay;
                    this.size = this.originalSize * this.life;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.life;
                    
                    // 칩 모양 (원 + 무늬)
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    
                    // 외곽
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // 내부 무늬
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // 중앙 점
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 황금 버스트 (충격파)
    // ==========================================
    playGoldenBurst(x, y) {
        this.ensureInit();
        this.ensureLoop();
        
        // 다중 충격파
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.animations.push({
                    x, y,
                    radius: 0,
                    maxRadius: 200 + i * 50,
                    lineWidth: 8 - i * 2,
                    startTime: Date.now(),
                    duration: 500,
                    alive: true,
                    
                    update() {
                        const elapsed = Date.now() - this.startTime;
                        if (elapsed >= this.duration) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const elapsed = Date.now() - this.startTime;
                        const progress = elapsed / this.duration;
                        const eased = 1 - Math.pow(1 - progress, 3);
                        
                        this.radius = this.maxRadius * eased;
                        const alpha = (1 - progress) * 0.8;
                        
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.strokeStyle = '#fbbf24';
                        ctx.lineWidth = this.lineWidth * (1 - progress);
                        ctx.shadowColor = '#fbbf24';
                        ctx.shadowBlur = 30;
                        
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, i * 80);
        }
    },
    
    // ==========================================
    // 스파크 버스트
    // ==========================================
    playSparkBurst(x, y, color = '#60a5fa', count = 20) {
        this.ensureInit();
        this.ensureLoop();
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 100 + Math.random() * 80;
            const length = 15 + Math.random() * 15;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                length,
                color,
                life: 1,
                alive: true,
                
                update() {
                    this.x += this.vx * 0.016;
                    this.y += this.vy * 0.016;
                    this.vx *= 0.94;
                    this.vy *= 0.94;
                    this.life -= 0.03;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const tailX = this.x - this.vx * 0.08;
                    const tailY = this.y - this.vy * 0.08;
                    
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 3 * this.life;
                    ctx.lineCap = 'round';
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    
                    ctx.beginPath();
                    ctx.moveTo(tailX, tailY);
                    ctx.lineTo(this.x, this.y);
                    ctx.stroke();
                    
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 어두운 파티클 (최소값)
    // ==========================================
    playDarkParticles(x, y) {
        this.ensureInit();
        this.ensureLoop();
        
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 60;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                size: 6 + Math.random() * 8,
                life: 1,
                gravity: 200,
                alive: true,
                
                update() {
                    this.vy += this.gravity * 0.016;
                    this.x += this.vx * 0.016;
                    this.y += this.vy * 0.016;
                    this.life -= 0.02;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life * 0.6;
                    ctx.fillStyle = '#374151';
                    ctx.shadowColor = '#1f2937';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 성공 이펙트 (더블 다운 등)
    // ==========================================
    playSuccessEffect(x, y) {
        this.ensureInit();
        this.ensureLoop();
        
        // 황금 스파크 폭발
        this.playSparkBurst(x, y, '#fbbf24', 30);
        
        // 충격파
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: 150,
            startTime: Date.now(),
            duration: 400,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const eased = 1 - Math.pow(1 - progress, 2);
                this.radius = this.maxRadius * eased;
                
                ctx.save();
                ctx.globalAlpha = (1 - progress) * 0.6;
                ctx.strokeStyle = '#4ade80';
                ctx.lineWidth = 6 * (1 - progress);
                ctx.shadowColor = '#4ade80';
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
        
        // SUCCESS 텍스트
        this.animations.push({
            x, y: y - 50,
            startTime: Date.now(),
            duration: 1000,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const yOffset = -40 * (1 - Math.pow(1 - Math.min(progress * 1.5, 1), 3));
                const scale = progress < 0.2 ? progress * 5 : 1;
                const alpha = progress > 0.5 ? 1 - (progress - 0.5) * 2 : 1;
                
                ctx.save();
                ctx.translate(this.x, this.y + yOffset);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                
                ctx.font = 'bold 36px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#4ade80';
                ctx.shadowBlur = 20;
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.strokeText('✓ SUCCESS!', 0, 0);
                ctx.fillStyle = '#4ade80';
                ctx.fillText('✓ SUCCESS!', 0, 0);
                
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 판돈 올리기 VFX
    // ==========================================
    playRaiseStakes(x, y, bonus = 3) {
        this.ensureInit();
        this.ensureLoop();
        
        // 칩들이 위로 쌓이는 애니메이션
        const chipCount = 8;
        const colors = ['#fbbf24', '#f59e0b', '#fcd34d'];
        
        for (let i = 0; i < chipCount; i++) {
            const delay = i * 60;
            const startX = x + (Math.random() - 0.5) * 100;
            const startY = y + 100;
            const targetY = y - 20 - (i * 12);
            
            this.animations.push({
                x: startX,
                y: startY,
                targetX: x + (Math.random() - 0.5) * 20,
                targetY: targetY,
                size: 20 + Math.random() * 8,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                startTime: Date.now() + delay,
                duration: 400,
                alive: true,
                
                update() {
                    const elapsed = Date.now() - this.startTime;
                    if (elapsed < 0) return;
                    if (elapsed >= this.duration + 600) this.alive = false;
                },
                
                draw(ctx) {
                    const elapsed = Date.now() - this.startTime;
                    if (elapsed < 0) return;
                    
                    const moveProgress = Math.min(elapsed / this.duration, 1);
                    const eased = 1 - Math.pow(1 - moveProgress, 3);
                    
                    const currentX = this.x + (this.targetX - this.x) * eased;
                    const currentY = this.y + (this.targetY - this.y) * eased;
                    
                    // 쌓인 후 페이드 아웃
                    let alpha = 1;
                    if (elapsed > this.duration + 200) {
                        alpha = 1 - (elapsed - this.duration - 200) / 400;
                    }
                    
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.translate(currentX, currentY);
                    
                    // 칩 그리기
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    
                    // 칩 외곽
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // 칩 내부 패턴
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.restore();
                }
            });
        }
        
        // "RAISE!" 텍스트
        setTimeout(() => {
            this.animations.push({
                x, y: y - 80,
                startTime: Date.now(),
                duration: 1200,
                alive: true,
                
                update() {
                    if (Date.now() - this.startTime >= this.duration) this.alive = false;
                },
                
                draw(ctx) {
                    const elapsed = Date.now() - this.startTime;
                    const progress = elapsed / this.duration;
                    
                    // 등장 + 위로 이동 + 페이드
                    const yOffset = -30 * progress;
                    const scale = progress < 0.15 ? progress / 0.15 : 1;
                    const alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
                    
                    ctx.save();
                    ctx.translate(this.x, this.y + yOffset);
                    ctx.scale(scale, scale);
                    ctx.globalAlpha = alpha;
                    
                    // 고정 수치 표시
                    const text = `📈 +${bonus}`;
                    
                    ctx.font = 'bold 32px Cinzel, serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 4;
                    ctx.strokeText(text, 0, 0);
                    
                    // 그라데이션 텍스트
                    const gradient = ctx.createLinearGradient(-60, 0, 60, 0);
                    gradient.addColorStop(0, '#fbbf24');
                    gradient.addColorStop(0.5, '#fcd34d');
                    gradient.addColorStop(1, '#f59e0b');
                    ctx.fillStyle = gradient;
                    ctx.fillText(text, 0, 0);
                    
                    ctx.restore();
                }
            });
        }, chipCount * 60 + 100);
        
        // 화면 약간 번쩍
        this.screenFlash('#fbbf24', 80);
    },
    
    // ==========================================
    // 실패 이펙트
    // ==========================================
    playFailEffect(x, y) {
        this.ensureInit();
        this.ensureLoop();
        
        // 화면 흔들림
        this.screenShake(10, 300);
        
        // 어두운 파티클
        this.playDarkParticles(x, y);
        
        // MISS 텍스트
        this.animations.push({
            x, y: y - 50,
            startTime: Date.now(),
            duration: 1000,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const shake = Math.sin(progress * 30) * 3 * (1 - progress);
                const alpha = progress > 0.5 ? 1 - (progress - 0.5) * 2 : 1;
                
                ctx.save();
                ctx.translate(this.x + shake, this.y - 30 * progress);
                ctx.globalAlpha = alpha;
                
                ctx.font = 'bold 32px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 15;
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText('✗ MISS...', 0, 0);
                ctx.fillStyle = '#ef4444';
                ctx.fillText('✗ MISS...', 0, 0);
                
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 블러프 이펙트 (카드 회오리)
    // ==========================================
    playBluffEffect(targetEl) {
        if (!targetEl) return;
        this.ensureInit();
        
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        this.ensureLoop();
        
        // 보라색 오라 링
        this.animations.push({
            x, y,
            startTime: Date.now(),
            duration: 800,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const alpha = (1 - progress) * 0.5;
                const radius = 60 + progress * 40;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                
                // 그라데이션 원
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
                gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
                gradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.3)');
                gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // 카드 회오리 파티클
        const cardSymbols = ['♠', '♥', '♦', '♣', '🃏'];
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const symbol = cardSymbols[Math.floor(Math.random() * cardSymbols.length)];
            
            this.particles.push({
                x, y,
                angle,
                radius: 30,
                maxRadius: 100,
                symbol,
                startTime: Date.now(),
                duration: 800,
                life: 1,
                alive: true,
                
                update() {
                    const progress = (Date.now() - this.startTime) / this.duration;
                    this.angle += 0.15;
                    this.radius = 30 + (this.maxRadius - 30) * progress;
                    this.life = 1 - progress;
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    const px = this.x + Math.cos(this.angle) * this.radius;
                    const py = this.y + Math.sin(this.angle) * this.radius;
                    
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(this.angle);
                    ctx.globalAlpha = this.life;
                    
                    ctx.font = '24px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = '#8b5cf6';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = '#c4b5fd';
                    ctx.fillText(this.symbol, 0, 0);
                    
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 올인 - 칩 한 개 히트 (랜덤 타겟에)
    // ==========================================
    playChipHit(targetX, targetY, isLastHit = false) {
        this.ensureInit();
        this.ensureLoop();
        
        const self = this;
        // 화면 상단에서 시작 (하늘에서 떨어지는 느낌)
        const startX = targetX + (Math.random() - 0.5) * 150;
        const startY = -50; // 화면 맨 위에서 시작!
        const chipSize = 24 + Math.random() * 8;
        const colors = ['#fbbf24', '#f59e0b', '#fcd34d', '#eab308'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 낙하 거리 계산
        const fallDistance = targetY - startY;
        const fallDuration = 400 + Math.random() * 100; // 400~500ms 낙하
        
        // 칩 떨어지기
        this.particles.push({
            x: startX,
            y: startY,
            targetX: targetX + (Math.random() - 0.5) * 40,
            targetY: targetY,
            size: chipSize,
            color,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 20,
            phase: 'falling',
            startTime: Date.now(),
            fallDuration: fallDuration,
            vx: 0,
            vy: 0,
            gravity: 2000,
            life: 1,
            trail: [], // 잔상 효과용
            alive: true,
            
            update() {
                if (this.phase === 'falling') {
                    const elapsed = Date.now() - this.startTime;
                    const progress = Math.min(elapsed / this.fallDuration, 1);
                    
                    // 가속 곡선 (처음 느리다가 점점 빨라짐)
                    const eased = progress * progress * progress;
                    
                    // 위치 계산
                    const prevY = this.y;
                    this.y = this.y + (this.targetY - this.y) * 0.08 + eased * 20;
                    this.x = this.x + (this.targetX - this.x) * 0.05;
                    this.rotation += this.rotSpeed * 0.016;
                    
                    // 잔상 추가
                    if (this.trail.length < 5) {
                        this.trail.push({ x: this.x, y: prevY, alpha: 0.6 });
                    }
                    
                    // 타겟 도달
                    if (this.y >= this.targetY - 10) {
                        this.phase = 'hit';
                        this.y = this.targetY;
                        this.vx = (Math.random() - 0.5) * 100;
                        this.vy = -50 - Math.random() * 30;
                        this.trail = [];
                    }
                } else {
                    // 튕기기
                    this.vy += this.gravity * 0.016;
                    this.x += this.vx * 0.016;
                    this.y += this.vy * 0.016;
                    this.vx *= 0.95;
                    this.rotation += this.rotSpeed * 0.016;
                    this.life -= 0.04;
                    if (this.life <= 0) this.alive = false;
                }
                
                // 잔상 페이드아웃
                this.trail = this.trail.filter(t => {
                    t.alpha -= 0.15;
                    return t.alpha > 0;
                });
            },
            
            draw(ctx) {
                // 잔상 그리기
                this.trail.forEach(t => {
                    ctx.save();
                    ctx.translate(t.x, t.y);
                    ctx.globalAlpha = t.alpha * 0.4;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    ctx.restore();
                });
                
                // 메인 칩
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.life;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                
                // 칩 본체
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // 테두리
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 내부 원
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                
                // 💠 심볼
                ctx.font = `${this.size}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💠', 0, 0);
                
                ctx.restore();
            }
        });
        
        // 히트 충격파 + 스파크 (칩이 도달했을 때)
        setTimeout(() => {
            // 충격파
            this.animations.push({
                x: targetX + (Math.random() - 0.5) * 15,
                y: targetY + (Math.random() - 0.5) * 15,
                radius: 0,
                maxRadius: isLastHit ? 80 : 45,
                startTime: Date.now(),
                duration: 250,
                alive: true,
                
                update() {
                    if (Date.now() - this.startTime >= this.duration) this.alive = false;
                },
                
                draw(ctx) {
                    const progress = (Date.now() - this.startTime) / this.duration;
                    this.radius = this.maxRadius * Math.pow(progress, 0.6);
                    
                    ctx.save();
                    ctx.globalAlpha = (1 - progress) * 0.9;
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = (isLastHit ? 6 : 4) * (1 - progress);
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 25;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            });
            
            // 스파크 파티클
            const sparkCount = isLastHit ? 10 : 5;
            for (let i = 0; i < sparkCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (isLastHit ? 150 : 80) + Math.random() * 80;
                
                this.particles.push({
                    x: targetX + (Math.random() - 0.5) * 20,
                    y: targetY + (Math.random() - 0.5) * 20,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 50,
                    size: 2 + Math.random() * 3,
                    color: ['#fbbf24', '#f59e0b', '#fef3c7'][Math.floor(Math.random() * 3)],
                    gravity: 400,
                    life: 1,
                    alive: true,
                    
                    update() {
                        this.vy += this.gravity * 0.016;
                        this.x += this.vx * 0.016;
                        this.y += this.vy * 0.016;
                        this.vx *= 0.96;
                        this.life -= 0.03;
                        if (this.life <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.life;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 8;
                        ctx.fillStyle = this.color;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
            }
            
            this.ensureLoop();
            
            // 화면 흔들림
            if (isLastHit) {
                this.screenShake(15, 250);
                this.screenFlash('#fbbf24', 100);
            } else {
                this.screenShake(4, 50);
            }
        }, fallDuration - 30);
    },
    
    // ==========================================
    // 올인 - ALL-IN 텍스트 표시 (극적인 연출)
    // ==========================================
    playAllInText(chips) {
        this.ensureInit();
        this.ensureLoop();
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const centerX = screenW / 2;
        const centerY = screenH / 2;
        
        // 1. 화면 어둡게 (오버레이)
        this.animations.push({
            startTime: Date.now(),
            duration: 800,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                let alpha = 0;
                
                if (progress < 0.2) {
                    alpha = progress / 0.2 * 0.6; // 페이드인
                } else if (progress < 0.7) {
                    alpha = 0.6; // 유지
                } else {
                    alpha = 0.6 * (1 - (progress - 0.7) / 0.3); // 페이드아웃
                }
                
                ctx.save();
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.fillRect(0, 0, screenW, screenH);
                ctx.restore();
            }
        });
        
        // 2. 화면 중앙 스포트라이트
        this.animations.push({
            x: centerX,
            y: centerY - 50,
            startTime: Date.now(),
            duration: 800,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                if (progress > 0.7) return;
                
                const alpha = progress < 0.2 ? progress / 0.2 : 1;
                const radius = 200 + Math.sin(progress * Math.PI * 4) * 20;
                
                ctx.save();
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
                gradient.addColorStop(0, `rgba(251, 191, 36, ${alpha * 0.3})`);
                gradient.addColorStop(0.5, `rgba(251, 191, 36, ${alpha * 0.1})`);
                gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, screenW, screenH);
                ctx.restore();
            }
        });
        
        // 3. 메인 ALL-IN 텍스트 (화면 중앙, 크게!)
        this.animations.push({
            x: centerX,
            y: centerY - 50,
            chips,
            startTime: Date.now(),
            duration: 1500,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 극적인 등장: 확대 → 살짝 축소 → 고정
                let scale = 1;
                if (progress < 0.1) {
                    scale = progress / 0.1 * 1.3; // 빠르게 확대
                } else if (progress < 0.2) {
                    scale = 1.3 - (progress - 0.1) / 0.1 * 0.3; // 살짝 축소
                } else {
                    scale = 1;
                }
                
                // 흔들림 효과
                const shake = progress < 0.3 ? Math.sin(elapsed * 0.05) * (1 - progress / 0.3) * 5 : 0;
                
                const alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
                
                ctx.save();
                ctx.translate(this.x + shake, this.y);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                
                // 글로우 효과 (여러 레이어)
                for (let i = 3; i >= 0; i--) {
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 20 + i * 15;
                    ctx.font = `bold ${72 + i * 2}px Cinzel, serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    if (i === 0) {
                        // 메인 텍스트
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 8;
                        ctx.strokeText('🔥 ALL-IN! 🔥', 0, 0);
                        
                        const gradient = ctx.createLinearGradient(-180, 0, 180, 0);
                        gradient.addColorStop(0, '#f59e0b');
                        gradient.addColorStop(0.3, '#fbbf24');
                        gradient.addColorStop(0.5, '#ffffff');
                        gradient.addColorStop(0.7, '#fbbf24');
                        gradient.addColorStop(1, '#f59e0b');
                        ctx.fillStyle = gradient;
                        ctx.fillText('🔥 ALL-IN! 🔥', 0, 0);
                    }
                }
                
                // 칩 개수 (아래에)
                ctx.font = 'bold 48px Cinzel, serif';
                ctx.shadowBlur = 25;
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 5;
                ctx.strokeText(`💠 ×${this.chips} CHIPS`, 0, 70);
                
                const chipGradient = ctx.createLinearGradient(-100, 60, 100, 80);
                chipGradient.addColorStop(0, '#fbbf24');
                chipGradient.addColorStop(0.5, '#fef3c7');
                chipGradient.addColorStop(1, '#fbbf24');
                ctx.fillStyle = chipGradient;
                ctx.fillText(`💠 ×${this.chips} CHIPS`, 0, 70);
                
                ctx.restore();
            }
        });
        
        // 4. 주변에 날리는 칩 파티클
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const angle = (i / 20) * Math.PI * 2;
                const distance = 150 + Math.random() * 100;
                
                this.particles.push({
                    x: centerX,
                    y: centerY - 50,
                    vx: Math.cos(angle) * distance * 2,
                    vy: Math.sin(angle) * distance * 2 - 100,
                    size: 15 + Math.random() * 10,
                    color: ['#fbbf24', '#f59e0b', '#fcd34d'][Math.floor(Math.random() * 3)],
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 15,
                    gravity: 400,
                    life: 1,
                    alive: true,
                    
                    update() {
                        this.vy += this.gravity * 0.016;
                        this.x += this.vx * 0.016;
                        this.y += this.vy * 0.016;
                        this.vx *= 0.98;
                        this.rotation += this.rotSpeed * 0.016;
                        this.life -= 0.015;
                        if (this.life <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.globalAlpha = this.life;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 10;
                        
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                        ctx.fillStyle = this.color;
                        ctx.fill();
                        
                        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, i * 20);
        }
        
        // 5. 화면 플래시 + 흔들림
        this.screenFlash('#fbbf24', 150);
        this.screenShake(15, 300);
    },
    
    // ==========================================
    // 올인 - X HITS 텍스트 표시 (극적인 피니시)
    // ==========================================
    playHitsText(x, y, hitCount) {
        this.ensureInit();
        this.ensureLoop();
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        // 1. 화면 플래시
        this.screenFlash('#ef4444', 100);
        this.screenShake(20, 300);
        
        // 2. 충격파 (큰 원)
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.animations.push({
                    x, y,
                    radius: 0,
                    maxRadius: 150 + i * 80,
                    startTime: Date.now(),
                    duration: 400,
                    color: i === 0 ? '#ef4444' : i === 1 ? '#fbbf24' : '#ffffff',
                    alive: true,
                    
                    update() {
                        if (Date.now() - this.startTime >= this.duration) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        this.radius = this.maxRadius * Math.pow(progress, 0.5);
                        
                        ctx.save();
                        ctx.globalAlpha = (1 - progress) * 0.6;
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 6 * (1 - progress);
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 30;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, i * 50);
        }
        
        // 3. HITS 텍스트 (크게!)
        this.animations.push({
            x, y: y - 30,
            hitCount,
            startTime: Date.now(),
            duration: 1500,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 팡! 하고 등장
                let scale = 1;
                if (progress < 0.08) {
                    scale = progress / 0.08 * 1.5;
                } else if (progress < 0.15) {
                    scale = 1.5 - (progress - 0.08) / 0.07 * 0.5;
                }
                
                const alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
                const yOffset = -progress * 50;
                
                // 흔들림
                const shake = progress < 0.2 ? Math.sin(elapsed * 0.08) * 3 : 0;
                
                ctx.save();
                ctx.translate(this.x + shake, this.y + yOffset);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                
                // 글로우 레이어
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 40;
                
                ctx.font = 'bold 64px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 7;
                ctx.strokeText(`${this.hitCount} HITS!`, 0, 0);
                
                // 그라데이션
                const gradient = ctx.createLinearGradient(-100, -30, 100, 30);
                gradient.addColorStop(0, '#ef4444');
                gradient.addColorStop(0.5, '#fca5a5');
                gradient.addColorStop(1, '#ef4444');
                ctx.fillStyle = gradient;
                ctx.fillText(`${this.hitCount} HITS!`, 0, 0);
                
                ctx.restore();
            }
        });
        
        // 4. 스파크 파티클
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 150;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                size: 3 + Math.random() * 4,
                color: ['#ef4444', '#fbbf24', '#ffffff'][Math.floor(Math.random() * 3)],
                gravity: 300,
                life: 1,
                alive: true,
                
                update() {
                    this.vy += this.gravity * 0.016;
                    this.x += this.vx * 0.016;
                    this.y += this.vy * 0.016;
                    this.vx *= 0.98;
                    this.life -= 0.02;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.life;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
        this.ensureLoop();
    },
    
    // ==========================================
    // 올인 - 최적화 버전 (Fast)
    // ==========================================
    
    // ALL-IN 텍스트 (최적화 + 임팩트)
    playAllInTextFast(chips) {
        this.ensureInit();
        this.ensureLoop();
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2 - 60;
        
        // 메인 텍스트 (팡! 등장)
        this.animations.push({
            x: centerX,
            y: centerY,
            chips,
            startTime: Date.now(),
            duration: 1000,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 팡! 효과
                let scale = 1;
                if (progress < 0.08) {
                    scale = progress / 0.08 * 1.4;
                } else if (progress < 0.15) {
                    scale = 1.4 - (progress - 0.08) / 0.07 * 0.4;
                }
                
                const alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
                const shake = progress < 0.15 ? Math.sin(elapsed * 0.1) * 3 : 0;
                
                ctx.save();
                ctx.translate(this.x + shake, this.y);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                
                // 글로우 효과
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 35;
                
                ctx.font = 'bold 64px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 6;
                ctx.strokeText('🔥 ALL-IN! 🔥', 0, 0);
                
                // 그라데이션 텍스트
                const gradient = ctx.createLinearGradient(-150, 0, 150, 0);
                gradient.addColorStop(0, '#f59e0b');
                gradient.addColorStop(0.5, '#fef3c7');
                gradient.addColorStop(1, '#f59e0b');
                ctx.fillStyle = gradient;
                ctx.fillText('🔥 ALL-IN! 🔥', 0, 0);
                
                // 칩 개수
                ctx.font = 'bold 42px Cinzel, serif';
                ctx.shadowBlur = 20;
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.strokeText(`💠 ×${this.chips}`, 0, 55);
                ctx.fillStyle = '#fbbf24';
                ctx.fillText(`💠 ×${this.chips}`, 0, 55);
                
                ctx.restore();
            }
        });
        
        // 칩 파티클 (8개만)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 120 + Math.random() * 60;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 80,
                size: 12 + Math.random() * 6,
                color: ['#fbbf24', '#f59e0b'][i % 2],
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 10,
                gravity: 350,
                life: 1,
                alive: true,
                
                update() {
                    this.vy += this.gravity * 0.016;
                    this.x += this.vx * 0.016;
                    this.y += this.vy * 0.016;
                    this.vx *= 0.98;
                    this.rotation += this.rotSpeed * 0.016;
                    this.life -= 0.02;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.life;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 8;
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    ctx.restore();
                }
            });
        }
        
        // 화면 효과
        this.screenFlash('#fbbf24', 100);
        this.screenShake(12, 200);
        this.ensureLoop();
    },
    
    // 칩 히트 (최적화 버전 - Canvas 기반, 간소화된 물리)
    playChipHitFast(targetX, targetY, isLastHit = false) {
        this.ensureInit();
        this.ensureLoop();
        
        const self = this;
        const startX = targetX + (Math.random() - 0.5) * 100;
        const startY = -40;
        const chipSize = 22 + Math.random() * 6;
        const colors = ['#fbbf24', '#f59e0b', '#fcd34d'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 칩 파티클 (간소화된 물리)
        this.particles.push({
            x: startX,
            y: startY,
            targetX: targetX + (Math.random() - 0.5) * 30,
            targetY: targetY,
            size: chipSize,
            color,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 15,
            speed: 0,
            phase: 'falling',
            life: 1,
            alive: true,
            
            update() {
                if (this.phase === 'falling') {
                    // 빠른 직선 낙하
                    this.speed += 2.5;
                    this.y += this.speed;
                    this.x += (this.targetX - this.x) * 0.1;
                    this.rotation += this.rotSpeed * 0.016;
                    
                    // 타겟 도달
                    if (this.y >= this.targetY) {
                        this.phase = 'hit';
                        this.y = this.targetY;
                    }
                } else {
                    // 빠르게 사라짐
                    this.life -= 0.1;
                    if (this.life <= 0) this.alive = false;
                }
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.life;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                
                // 칩 본체
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                
                // 테두리
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 내부 원
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                
                // 💠 심볼
                ctx.font = `${this.size}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💠', 0, 1);
                
                ctx.restore();
            }
        });
        
        // 착지 충격파
        setTimeout(() => {
            // 충격파
            this.animations.push({
                x: targetX + (Math.random() - 0.5) * 15,
                y: targetY,
                radius: 0,
                maxRadius: isLastHit ? 70 : 40,
                startTime: Date.now(),
                duration: 180,
                alive: true,
                
                update() {
                    if (Date.now() - this.startTime >= this.duration) this.alive = false;
                },
                
                draw(ctx) {
                    const progress = (Date.now() - this.startTime) / this.duration;
                    this.radius = this.maxRadius * progress;
                    
                    ctx.save();
                    ctx.globalAlpha = (1 - progress) * 0.7;
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 4 * (1 - progress);
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            });
            
            // 스파크 (3개만)
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 80 + Math.random() * 60;
                
                this.particles.push({
                    x: targetX,
                    y: targetY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 40,
                    size: 2 + Math.random() * 2,
                    color: '#fbbf24',
                    gravity: 300,
                    life: 1,
                    alive: true,
                    
                    update() {
                        this.vy += this.gravity * 0.016;
                        this.x += this.vx * 0.016;
                        this.y += this.vy * 0.016;
                        this.life -= 0.05;
                        if (this.life <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.life;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 8;
                        ctx.fillStyle = this.color;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
            }
            
            this.ensureLoop();
            
            // 화면 효과
            if (isLastHit) {
                this.screenShake(12, 200);
                this.screenFlash('#fbbf24', 80);
            } else {
                this.screenShake(3, 40);
            }
        }, 200); // 칩이 도달할 때쯤
    },
    
    // ==========================================
    // 슬롯 머신 이펙트 (Canvas 기반)
    // ==========================================
    playSlotEffect(results, callback) {
        this.ensureInit();
        this.ensureLoop();
        
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const reelWidth = 70;
        const reelHeight = 80;
        const symbols = ['🍒', '🍋', '🍀', '⭐', '💎', '7️⃣'];
        
        // 슬롯 머신 애니메이션
        this.animations.push({
            x, y,
            results,
            reelPositions: [0, 0, 0],
            reelSpeeds: [30, 35, 40],
            stopTimes: [600, 900, 1200],
            startTime: Date.now(),
            duration: 2000,
            phase: 'spinning',
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                
                // 각 릴 정지
                for (let i = 0; i < 3; i++) {
                    if (elapsed < this.stopTimes[i]) {
                        this.reelPositions[i] += this.reelSpeeds[i];
                    }
                }
                
                if (elapsed >= this.duration) {
                    this.alive = false;
                    if (callback) callback();
                }
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const fadeIn = Math.min(elapsed / 200, 1);
                const fadeOut = elapsed > 1500 ? 1 - (elapsed - 1500) / 500 : 1;
                
                ctx.save();
                ctx.globalAlpha = fadeIn * fadeOut;
                
                // 배경
                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.beginPath();
                ctx.roundRect(this.x - 140, this.y - 80, 280, 160, 20);
                ctx.fill();
                
                // 테두리
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 20;
                ctx.stroke();
                
                // 제목
                ctx.font = 'bold 20px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fbbf24';
                ctx.fillText('🎰 SLOT SPIN 🎰', this.x, this.y - 50);
                
                // 릴들
                for (let i = 0; i < 3; i++) {
                    const reelX = this.x - 90 + i * 90;
                    const stopped = elapsed >= this.stopTimes[i];
                    
                    // 릴 배경
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(reelX - 30, this.y - 25, 60, 60);
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(reelX - 30, this.y - 25, 60, 60);
                    
                    // 심볼
                    ctx.font = '36px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    let symbol;
                    if (stopped) {
                        symbol = this.results[i];
                    } else {
                        const idx = Math.floor(this.reelPositions[i] / 10) % symbols.length;
                        symbol = symbols[idx];
                    }
                    
                    ctx.fillStyle = '#fff';
                    ctx.fillText(symbol, reelX, this.y + 5);
                }
                
                // 잭팟 체크
                if (elapsed > 1200 && this.results[0] === this.results[1] && this.results[1] === this.results[2]) {
                    const flash = Math.sin(elapsed * 0.02) * 0.3 + 0.7;
                    ctx.globalAlpha = flash * fadeOut;
                    ctx.font = 'bold 24px Cinzel, serif';
                    ctx.fillStyle = '#fbbf24';
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 30;
                    ctx.fillText('🎉 JACKPOT! 🎉', this.x, this.y + 55);
                }
                
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 잭팟 풀 이펙트
    // ==========================================
    playJackpotFullEffect() {
        this.ensureInit();
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        
        this.ensureLoop();
        
        // 화면 플래시
        this.screenFlash('#fbbf24', 200);
        
        // 화면 흔들림
        this.screenShake(25, 800);
        
        // 연속 충격파
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playGoldenBurst(x, y);
            }, i * 150);
        }
        
        // 대량 파티클
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playJackpotParticles(x + (Math.random() - 0.5) * 200, y + (Math.random() - 0.5) * 100);
            }, i * 100);
        }
        
        // JACKPOT 텍스트
        this.animations.push({
            x, y,
            startTime: Date.now(),
            duration: 2000,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const scale = progress < 0.1 ? progress * 10 * 1.5 : 
                             progress < 0.3 ? 1.5 - (progress - 0.1) * 2.5 : 1;
                const rotation = Math.sin(progress * 20) * 0.05 * (1 - progress);
                const alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(rotation);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                
                ctx.font = 'bold 72px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 글로우
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 60;
                
                // 외곽
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 8;
                ctx.strokeText('🎉 JACKPOT! 🎉', 0, 0);
                
                // 그라데이션
                const gradient = ctx.createLinearGradient(-200, 0, 200, 0);
                gradient.addColorStop(0, '#fbbf24');
                gradient.addColorStop(0.3, '#ffffff');
                gradient.addColorStop(0.5, '#fcd34d');
                gradient.addColorStop(0.7, '#ffffff');
                gradient.addColorStop(1, '#f59e0b');
                ctx.fillStyle = gradient;
                ctx.fillText('🎉 JACKPOT! 🎉', 0, 0);
                
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 칩 획득 이펙트
    // ==========================================
    playChipGainEffect(amount, x, y) {
        this.ensureInit();
        this.ensureLoop();
        
        for (let i = 0; i < amount; i++) {
            setTimeout(() => {
                // 칩 파티클
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 40,
                    y: y + 40,
                    targetY: y - 20,
                    size: 16,
                    rotation: 0,
                    startTime: Date.now(),
                    duration: 800,
                    life: 1,
                    alive: true,
                    
                    update() {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        this.y = this.targetY + 60 - 80 * (1 - Math.pow(1 - progress, 3));
                        this.rotation += 0.2;
                        this.life = 1 - progress;
                        if (progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.globalAlpha = this.life;
                        ctx.shadowColor = '#fbbf24';
                        ctx.shadowBlur = 20;
                        
                        // 칩
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                        ctx.fillStyle = '#fbbf24';
                        ctx.fill();
                        
                        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(0, 0, 4, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.restore();
                    }
                });
                
                // +1 텍스트
                this.animations.push({
                    x: x + (Math.random() - 0.5) * 30,
                    y: y,
                    startTime: Date.now(),
                    duration: 600,
                    alive: true,
                    
                    update() {
                        if (Date.now() - this.startTime >= this.duration) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        const yOffset = -60 * progress;
                        const alpha = 1 - progress;
                        
                        ctx.save();
                        ctx.translate(this.x, this.y + yOffset);
                        ctx.globalAlpha = alpha;
                        ctx.font = 'bold 20px Cinzel, serif';
                        ctx.textAlign = 'center';
                        ctx.shadowColor = '#fbbf24';
                        ctx.shadowBlur = 10;
                        ctx.fillStyle = '#fbbf24';
                        ctx.fillText('+1', 0, 0);
                        ctx.restore();
                    }
                });
                
                this.ensureLoop();
            }, i * 100);
        }
    },
    
    // ==========================================
    // 힐 이펙트
    // ==========================================
    playHealEffect(targetEl) {
        if (!targetEl) return;
        this.ensureInit();
        
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        this.ensureLoop();
        
        // 녹색 글로우
        this.animations.push({
            x, y,
            startTime: Date.now(),
            duration: 600,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const alpha = (1 - progress) * 0.4;
                const size = 80 + progress * 40;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size);
                gradient.addColorStop(0, 'rgba(74, 222, 128, 0.8)');
                gradient.addColorStop(0.5, 'rgba(74, 222, 128, 0.3)');
                gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        
        // 하트 파티클
        for (let i = 0; i < 10; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            
            this.particles.push({
                x: x + offsetX,
                y: y + 30,
                vy: -80 - Math.random() * 60,
                size: 14 + Math.random() * 8,
                life: 1,
                delay: i * 50,
                startTime: Date.now(),
                alive: true,
                
                update() {
                    const elapsed = Date.now() - this.startTime;
                    if (elapsed < this.delay) return;
                    
                    this.y += this.vy * 0.016;
                    this.vy *= 0.98;
                    this.life -= 0.015;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const elapsed = Date.now() - this.startTime;
                    if (elapsed < this.delay) return;
                    
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.globalAlpha = this.life;
                    ctx.font = `${this.size}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = '#4ade80';
                    ctx.shadowBlur = 15;
                    ctx.fillText('💚', 0, 0);
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 히트 이펙트 (올인 다단히트)
    // ==========================================
    playHitEffect(x, y, damage) {
        this.ensureInit();
        this.ensureLoop();
        
        // 충격 파티클
        this.playSparkBurst(x, y, damage >= 7 ? '#fbbf24' : '#ef4444', 12);
        
        // 데미지 숫자
        this.animations.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y - 20,
            damage,
            startTime: Date.now(),
            duration: 600,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const yOffset = -50 * progress;
                const scale = progress < 0.2 ? 1 + progress * 3 : 1.6 - progress * 0.6;
                const alpha = 1 - progress;
                
                ctx.save();
                ctx.translate(this.x, this.y + yOffset);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                
                const color = this.damage >= 7 ? '#fbbf24' : '#ef4444';
                ctx.font = 'bold 28px Cinzel, serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText(this.damage, 0, 0);
                ctx.fillStyle = color;
                ctx.fillText(this.damage, 0, 0);
                
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 주사위 굴림 이펙트
    // ==========================================
    playDiceRoll(x, y, result, callback) {
        this.ensureInit();
        this.ensureLoop();
        
        const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        
        this.animations.push({
            x, y,
            result,
            diceFaces,
            currentFace: 0,
            rotation: 0,
            startTime: Date.now(),
            spinDuration: 1000,
            showDuration: 600,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                
                if (elapsed < this.spinDuration) {
                    // 회전 중
                    this.rotation += 0.5;
                    this.currentFace = Math.floor(elapsed / 50) % 6;
                } else if (elapsed >= this.spinDuration + this.showDuration) {
                    this.alive = false;
                    if (callback) callback();
                }
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const isSpinning = elapsed < this.spinDuration;
                
                const scale = isSpinning ? 1 + Math.sin(elapsed * 0.03) * 0.2 : 1.2;
                const alpha = elapsed > this.spinDuration + 300 ? 
                    1 - (elapsed - this.spinDuration - 300) / 300 : 1;
                
                ctx.save();
                ctx.translate(this.x, this.y);
                if (isSpinning) ctx.rotate(this.rotation);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                
                ctx.font = '64px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 20;
                
                const face = isSpinning ? this.diceFaces[this.currentFace] : this.diceFaces[this.result - 1];
                ctx.fillText(face, 0, 0);
                
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 충격파
    // ==========================================
    playShockwave(x, y, color = '#fbbf24', maxSize = 300) {
        this.ensureInit();
        this.ensureLoop();
        
        this.animations.push({
            x, y,
            color,
            maxSize,
            startTime: Date.now(),
            duration: 400,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const eased = 1 - Math.pow(1 - progress, 2);
                const radius = this.maxSize * eased;
                const alpha = (1 - progress) * 0.6;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 5 * (1 - progress);
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 화면 흔들림
    // ==========================================
    screenShake(intensity = 10, duration = 300) {
        const container = document.querySelector('.game-container') || document.body;
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                container.style.transform = '';
                return;
            }
            
            const progress = elapsed / duration;
            const currentIntensity = intensity * (1 - progress);
            const x = (Math.random() - 0.5) * currentIntensity * 2;
            const y = (Math.random() - 0.5) * currentIntensity * 2;
            
            container.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        };
        
        shake();
    },
    
    // ==========================================
    // 화면 플래시
    // ==========================================
    screenFlash(color = '#ffffff', duration = 100) {
        this.ensureInit();
        this.ensureLoop();
        
        this.animations.push({
            color,
            startTime: Date.now(),
            duration,
            alive: true,
            
            update() {
                if (Date.now() - this.startTime >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const alpha = 0.5 * (1 - progress);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }
        });
    }
};

// ==========================================
// 전역 등록 및 초기화
// ==========================================
window.GamblerVFX = GamblerVFX;

// 즉시 초기화 시도 (DOM이 준비되었으면)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GamblerVFX.init();
    });
} else {
    // 이미 DOM이 로드됨 - 즉시 초기화
    GamblerVFX.init();
}

console.log('[GamblerVFX] Canvas 이펙트 시스템 로드 완료');
