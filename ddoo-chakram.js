// ==========================================
// DDOO Chakram - 차크람 발사체 시스템
// DDOOAction 엔진용 모듈
// ==========================================

const DDOOChakram = {
    canvas: null,
    ctx: null,
    animations: [],
    particles: [],
    isRunning: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        if (this.canvas) return; // 이미 초기화됨
        
        // 전용 Canvas 생성
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'ddoo-chakram-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999998;
        `;
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        console.log('[DDOOChakram] 🎯 차크람 시스템 초기화 완료');
    },
    
    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    // ==========================================
    // 애니메이션 루프
    // ==========================================
    startLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    },
    
    ensureLoop() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    },
    
    loop() {
        if (!this.isRunning) return;
        
        const ctx = this.ctx;
        if (!ctx) {
            this.isRunning = false;
            return;
        }
        
        // 캔버스 클리어
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 파티클 업데이트 & 렌더
        this.particles = this.particles.filter(p => {
            p.update();
            if (p.alive) p.draw(ctx);
            return p.alive;
        });
        
        // 애니메이션 업데이트 & 렌더
        this.animations = this.animations.filter(a => {
            a.update();
            if (a.alive) a.draw(ctx);
            return a.alive;
        });
        
        // 계속 루프
        if (this.particles.length > 0 || this.animations.length > 0) {
            requestAnimationFrame(() => this.loop());
        } else {
            this.isRunning = false;
        }
    },
    
    // ==========================================
    // 차크람 투척 이펙트
    // passThrough: true면 타겟을 뚫고 화면 밖으로 계속 진행
    // stopAtTarget: true면 타겟(플레이어)에서 정확히 멈추고 캐치 이펙트
    // ==========================================
    chakram(fromX, fromY, toX, toY, options = {}) {
        this.init(); // 필요시 초기화
        
        const {
            color = '#ffd700',       // 금색 차크람
            glowColor = '#ff8c00',   // 오렌지 글로우
            size = 80,               // 차크람 크기 (증가!)
            speed = 25,              // 속도
            spinSpeed = 30,          // 회전 속도 (빠름)
            trailLength = 18,        // 잔상 길이 (증가)
            bladeCount = 8,          // 날 개수
            passThrough = false,     // 타겟을 뚫고 지나감
            stopAtTarget = false,    // 타겟에서 정확히 멈춤 (캐치용)
            onHit = null
        } = options;
        
        this.ensureLoop();
        
        const startX = fromX;
        const startY = fromY;
        
        const dx = toX - startX;
        const dy = toY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return;
        
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        const self = this;
        
        const chakramObj = {
            x: startX,
            y: startY,
            targetX: toX,
            targetY: toY,
            vx, vy,
            size,
            color,
            glowColor,
            bladeCount,
            rotation: 0,
            spinSpeed: spinSpeed * (Math.PI / 180),
            trail: [],
            trailLength,
            alive: true,
            startTime: Date.now(),
            passThrough,
            stopAtTarget,
            speed,
            
            update() {
                // 이동
                this.x += this.vx;
                this.y += this.vy;
                
                // 회전 (빠르게)
                this.rotation += this.spinSpeed;
                
                // 잔상 추가
                this.trail.unshift({
                    x: this.x,
                    y: this.y,
                    rotation: this.rotation,
                    alpha: 1
                });
                
                // 잔상 제한 및 페이드
                if (this.trail.length > this.trailLength) {
                    this.trail.pop();
                }
                this.trail.forEach((t, i) => {
                    t.alpha = 1 - (i / this.trailLength);
                });
                
                // 종료 조건
                const distToTarget = Math.sqrt(
                    Math.pow(this.x - this.targetX, 2) + 
                    Math.pow(this.y - this.targetY, 2)
                );
                
                if (this.stopAtTarget) {
                    // 🎯 플레이어에서 멈추고 캐치 이펙트!
                    if (distToTarget < this.speed * 2) {
                        this.alive = false;
                        // 캐치 이펙트 (밝은 플래시 + 스파크)
                        self.catchEffect(this.targetX, this.targetY, {
                            color: this.glowColor,
                            size: this.size
                        });
                        if (onHit) onHit();
                    }
                } else if (this.passThrough) {
                    // 화면 밖으로 나가면 종료
                    const margin = 100;
                    if (this.x < -margin || this.x > window.innerWidth + margin ||
                        this.y < -margin || this.y > window.innerHeight + margin) {
                        this.alive = false;
                    }
                } else {
                    // 타겟 도달 시 종료
                    if (distToTarget < this.speed * 1.5) {
                        this.alive = false;
                        self.chakramImpact(this.targetX, this.targetY, { 
                            color: this.glowColor,
                            size: 80
                        });
                    }
                }
            },
            
            draw(ctx) {
                ctx.save();
                
                // 잔상 그리기
                this.trail.forEach((t, i) => {
                    if (i === 0) return;
                    ctx.save();
                    ctx.globalAlpha = t.alpha * 0.3;
                    ctx.translate(t.x, t.y);
                    ctx.rotate(t.rotation);
                    
                    const trailSize = this.size * (1 - i * 0.03);
                    this.drawChakram(ctx, trailSize, this.glowColor, 0.3);
                    
                    ctx.restore();
                });
                
                // 메인 차크람 그리기
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                // 강한 글로우
                ctx.shadowColor = this.glowColor;
                ctx.shadowBlur = 30;
                
                this.drawChakram(ctx, this.size, this.color, 1);
                
                ctx.restore();
            },
            
            // 차크람 형태 그리기 (원형 톱니 무기)
            drawChakram(ctx, size, color, alpha) {
                ctx.globalAlpha = alpha;
                
                const outerRadius = size / 2;
                const innerRadius = size * 0.25;
                const bladeDepth = size * 0.15;
                
                // 외곽 링 그라데이션
                const gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, color);
                gradient.addColorStop(0.7, '#c0c0c0');
                gradient.addColorStop(1, '#808080');
                
                // 톱니 모양 그리기
                ctx.beginPath();
                for (let i = 0; i < this.bladeCount; i++) {
                    const angle1 = (i / this.bladeCount) * Math.PI * 2;
                    const angle2 = ((i + 0.5) / this.bladeCount) * Math.PI * 2;
                    
                    // 외곽 톱니
                    const outerX = Math.cos(angle1) * outerRadius;
                    const outerY = Math.sin(angle1) * outerRadius;
                    
                    // 안쪽 톱니
                    const innerX = Math.cos(angle2) * (outerRadius - bladeDepth);
                    const innerY = Math.sin(angle2) * (outerRadius - bladeDepth);
                    
                    if (i === 0) {
                        ctx.moveTo(outerX, outerY);
                    } else {
                        ctx.lineTo(outerX, outerY);
                    }
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // 외곽선
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.globalAlpha = alpha * 0.8;
                ctx.stroke();
                
                // 중앙 원 (손잡이 구멍)
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#333';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // 중앙 하이라이트
                ctx.beginPath();
                ctx.arc(0, 0, innerRadius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
                ctx.fill();
            }
        };
        
        this.animations.push(chakramObj);
        
        // 발사 시 스파크
        this.sparks(fromX, fromY, { color: glowColor, count: 10, speed: 10, size: 5 });
        
        console.log(`[DDOOChakram] 🎯 발사: (${fromX.toFixed(0)},${fromY.toFixed(0)}) → (${toX.toFixed(0)},${toY.toFixed(0)})`);
    },
    
    // ==========================================
    // 차크람 임팩트 이펙트
    // ==========================================
    chakramImpact(x, y, options = {}) {
        const { color = '#ff8c00', size = 60 } = options;
        
        this.ensureLoop();
        
        // 방사형 칼날 스파크
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.2;
            const speed = 10 + Math.random() * 15;
            const sparkSize = 4 + Math.random() * 5;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: angle,
                size: sparkSize,
                color: i % 2 === 0 ? color : '#ffd700',
                life: 450,
                maxLife: 450,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.9;
                    this.vy *= 0.9;
                    this.life -= 16;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    
                    // 날카로운 스파크
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    
                    ctx.beginPath();
                    ctx.moveTo(this.size * 2, 0);
                    ctx.lineTo(-this.size, -this.size * 0.4);
                    ctx.lineTo(-this.size, this.size * 0.4);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                }
            });
        }
        
        // 금속 파편 (금색)
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 10;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 4,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.6,
                size: 3 + Math.random() * 4,
                life: 550,
                maxLife: 550,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.25;
                    this.vx *= 0.97;
                    this.rotation += this.rotSpeed;
                    this.life -= 16;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    
                    // 금색 파편
                    ctx.fillStyle = '#ffd700';
                    ctx.shadowColor = '#ff8c00';
                    ctx.shadowBlur = 8;
                    ctx.fillRect(-this.size, -this.size * 0.4, this.size * 2, this.size * 0.8);
                    
                    ctx.restore();
                }
            });
        }
        
        // 링 이펙트
        this.ring(x, y, { color, maxRadius: size, duration: 300 });
    },
    
    // ==========================================
    // 캐치 이펙트 (플레이어가 차크람 받을 때)
    // ==========================================
    catchEffect(x, y, options = {}) {
        const { color = '#ffd700', size = 80 } = options;
        
        this.ensureLoop();
        
        // 밝은 플래시
        this.animations.push({
            x, y,
            size,
            color,
            startTime: Date.now(),
            duration: 200,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                if (elapsed >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min(elapsed / this.duration, 1);
                const alpha = 1 - progress;
                const flashSize = this.size * (1 + progress * 0.5);
                
                ctx.save();
                ctx.globalAlpha = alpha * 0.8;
                
                // 방사형 그라데이션 플래시
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, flashSize
                );
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, this.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, flashSize, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // 수렴하는 스파크 (안으로 모이는 느낌)
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const startDist = size * 1.5;
            const startX = x + Math.cos(angle) * startDist;
            const startY = y + Math.sin(angle) * startDist;
            
            this.particles.push({
                x: startX,
                y: startY,
                targetX: x,
                targetY: y,
                progress: 0,
                size: 6 + Math.random() * 4,
                color: i % 2 === 0 ? color : '#ffffff',
                life: 250,
                maxLife: 250,
                startX,
                startY,
                alive: true,
                
                update() {
                    this.life -= 16;
                    this.progress = 1 - (this.life / this.maxLife);
                    
                    // 타겟으로 수렴
                    const ease = this.progress * this.progress; // ease-in
                    this.x = this.startX + (this.targetX - this.startX) * ease;
                    this.y = this.startY + (this.targetY - this.startY) * ease;
                    
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * (1 - this.progress * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
        
        // 링 이펙트 (작고 빠르게)
        this.ring(x, y, { color, maxRadius: size * 0.8, duration: 200 });
        
        console.log(`[DDOOChakram] 🎯 캐치 이펙트: (${x.toFixed(0)}, ${y.toFixed(0)})`);
    },
    
    // ==========================================
    // 스파크 이펙트
    // ==========================================
    sparks(x, y, options = {}) {
        const {
            color = '#ffd700',
            count = 10,
            speed = 10,
            size = 5
        } = options;
        
        this.ensureLoop();
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const vel = speed * (0.5 + Math.random() * 0.5);
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * vel,
                vy: Math.sin(angle) * vel,
                size: size * (0.5 + Math.random() * 0.5),
                color,
                life: 400,
                maxLife: 400,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                    this.life -= 16;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 링 이펙트
    // ==========================================
    ring(x, y, options = {}) {
        const {
            color = '#ff8c00',
            maxRadius = 60,
            duration = 300
        } = options;
        
        this.ensureLoop();
        
        const startTime = Date.now();
        
        this.animations.push({
            x, y,
            color,
            maxRadius,
            duration,
            startTime,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                if (elapsed >= this.duration) {
                    this.alive = false;
                }
            },
            
            draw(ctx) {
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min(elapsed / this.duration, 1);
                const radius = this.maxRadius * progress;
                const alpha = 1 - progress;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                ctx.lineWidth = 3 * (1 - progress);
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 임팩트 이펙트
    // ==========================================
    impact(x, y, options = {}) {
        const { color = '#ff8c00', size = 60 } = options;
        this.ring(x, y, { color, maxRadius: size, duration: 250 });
        this.sparks(x, y, { color, count: 8, speed: 8, size: 4 });
    },
    
    // ==========================================
    // 클리어
    // ==========================================
    clear() {
        this.animations = [];
        this.particles = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOOChakram = DDOOChakram;
}

console.log('[DDOOChakram] 🎯 차크람 모듈 로드됨');
