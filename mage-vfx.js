// ==========================================
// Mage VFX System
// 마법사 카드 전용 이펙트 시스템
// ==========================================

const MageVFX = {
    canvas: null,
    ctx: null,
    particles: [],
    animations: [],
    isRunning: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'mage-vfx-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        console.log('[MageVFX] 마법사 이펙트 시스템 초기화 완료');
    },
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    startLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    },
    
    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(p => {
            if (!p.alive) return false;
            if (p.update) p.update();
            if (p.alive && p.draw) p.draw(this.ctx);
            return p.alive;
        });
        
        this.animations = this.animations.filter(a => {
            if (!a.alive) return false;
            if (a.update) a.update();
            if (a.alive && a.draw) a.draw(this.ctx);
            return a.alive;
        });
        
        if (this.particles.length > 0 || this.animations.length > 0) {
            requestAnimationFrame(() => this.loop());
        } else {
            this.isRunning = false;
        }
    },
    
    ensureLoop() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    },
    
    // ==========================================
    // 아케인 볼트 (Arcane Bolt)
    // 캐릭터 뒤에서 난사되는 보라색 마법 탄환
    // ==========================================
    arcaneBolt(fromX, fromY, toX, toY) {
        this.ensureLoop();
        
        // 발사 위치 배열 (여러 방향에서 난사)
        const spawnPositions = [
            { offsetX: -120, offsetY: -80 },   // 왼쪽 위
            { offsetX: -100, offsetY: 0 },     // 왼쪽 중앙
            { offsetX: -130, offsetY: 60 },    // 왼쪽 아래
            { offsetX: -80, offsetY: -120 },   // 위쪽
            { offsetX: -90, offsetY: 80 },     // 아래쪽
        ];
        
        // 랜덤 발사 위치 선택
        const spawnPos = spawnPositions[Math.floor(Math.random() * spawnPositions.length)];
        const jitterX = (Math.random() - 0.5) * 40;
        const jitterY = (Math.random() - 0.5) * 40;
        const spawnX = fromX + spawnPos.offsetX + jitterX;
        const spawnY = fromY + spawnPos.offsetY + jitterY;
        
        // 발사 방향 계산
        const dx = toX - spawnX;
        const dy = toY - spawnY;
        const angle = Math.atan2(dy, dx);
        
        // ===== 머즐 플래시 (발사 섬광) =====
        this.animations.push({
            x: spawnX,
            y: spawnY,
            size: 0,
            maxSize: 60,  // 더 큰 플래시
            alpha: 1,
            angle: angle,
            startTime: Date.now(),
            duration: 150,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.size = this.maxSize * Math.pow(progress, 0.3);
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.globalAlpha = this.alpha;
                
                // 방사형 플래시
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, '#e9d5ff');
                gradient.addColorStop(0.6, '#a855f7');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 발사 방향 플레어
                ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.size * 1.5, -this.size * 0.3);
                ctx.lineTo(this.size * 1.5, this.size * 0.3);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // ===== 반동 파티클 (뒤로 튀는 스파크) =====
        for (let i = 0; i < 10; i++) {
            const backAngle = angle + Math.PI + (Math.random() - 0.5) * 1.2;
            const speed = 5 + Math.random() * 7;
            this.particles.push({
                x: spawnX,
                y: spawnY,
                vx: Math.cos(backAngle) * speed,
                vy: Math.sin(backAngle) * speed,
                size: 3 + Math.random() * 4,  // 더 큰 파티클
                color: Math.random() > 0.5 ? '#c084fc' : '#e9d5ff',
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.9;
                    this.vy *= 0.9;
                    this.alpha -= 0.08;
                    this.size *= 0.95;
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
        
        // ===== 메인 볼트 발사 =====
        this.animations.push({
            x: spawnX,
            y: spawnY,
            targetX: toX,
            targetY: toY,
            progress: 0,
            speed: 0.08,  // 빠른 속도
            size: 28,     // 더 두꺼운 볼트
            trail: [],
            alive: true,
            angle: angle,
            
            update() {
                this.progress += this.speed;
                
                // 빠른 직선 이동
                const t = Math.min(1, this.progress);
                const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                
                this.currentX = spawnX + (toX - spawnX) * easeT;
                this.currentY = spawnY + (toY - spawnY) * easeT;
                
                // 긴 트레일
                this.trail.unshift({ x: this.currentX, y: this.currentY, alpha: 1 });
                if (this.trail.length > 20) this.trail.pop();
                this.trail.forEach((t, i) => t.alpha = 1 - i / 20);
                
                if (this.progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                // 트레일 (두꺼운 꼬리)
                if (this.trail.length > 1) {
                    ctx.save();
                    ctx.lineCap = 'round';
                    
                    // 트레일 라인
                    for (let i = 0; i < this.trail.length - 1; i++) {
                        const t1 = this.trail[i];
                        const t2 = this.trail[i + 1];
                        const width = this.size * (1 - i / this.trail.length) * 1.2;  // 더 두꺼운 트레일
                        
                        ctx.globalAlpha = t1.alpha * 0.7;
                        ctx.strokeStyle = i < 4 ? '#f3e8ff' : (i < 8 ? '#c084fc' : '#a855f7');
                        ctx.lineWidth = width;
                        ctx.shadowColor = '#8b5cf6';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.moveTo(t1.x, t1.y);
                        ctx.lineTo(t2.x, t2.y);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                
                // 메인 볼트 (더 큰 크기)
                ctx.save();
                const gradient = ctx.createRadialGradient(this.currentX, this.currentY, 0, this.currentX, this.currentY, this.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.15, '#f3e8ff');
                gradient.addColorStop(0.35, '#c084fc');
                gradient.addColorStop(0.6, '#a855f7');
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.shadowColor = '#8b5cf6';
                ctx.shadowBlur = 40;  // 더 강한 글로우
                ctx.beginPath();
                ctx.arc(this.currentX, this.currentY, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 밝은 코어 (더 큰 코어)
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(this.currentX, this.currentY, this.size * 0.45, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        this.ensureLoop();
        
        // ===== 임팩트 이펙트 =====
        setTimeout(() => {
            this.arcaneImpact(toX, toY);
            
            // 임팩트 추가 스파크
            for (let i = 0; i < 14; i++) {
                const impactAngle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 7;
                this.particles.push({
                    x: toX,
                    y: toY,
                    vx: Math.cos(impactAngle) * speed,
                    vy: Math.sin(impactAngle) * speed,
                    size: 3 + Math.random() * 5,  // 더 큰 스파크
                    color: Math.random() > 0.3 ? '#c084fc' : '#fff',
                    alpha: 1,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.92;
                        this.vy *= 0.92;
                        this.alpha -= 0.05;
                        if (this.alpha <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = '#a855f7';
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
            }
            this.ensureLoop();
        }, 200);
    },
    
    // ==========================================
    // 아케인 볼트 연발 (Arcane Bolt Barrage)
    // 3연발 베지어 곡선 마법 탄환
    // ==========================================
    arcaneBoltBarrage(fromX, fromY, toX, toY) {
        this.ensureLoop();
        
        // 시전 이펙트
        this.castCircle(fromX, fromY, '#8b5cf6', 70);
        
        // 3연발 볼트 (각각 다른 곡선)
        const curves = [
            { offsetX: -60, offsetY: -80, delay: 100, color: '#a855f7' },  // 위로 휘어짐
            { offsetX: 30, offsetY: -40, delay: 280, color: '#8b5cf6' },   // 약간 위
            { offsetX: -20, offsetY: 60, delay: 460, color: '#c084fc' }    // 아래로 휘어짐
        ];
        
        curves.forEach((curve, index) => {
            setTimeout(() => {
                // 각 볼트의 고유한 중간점
                const midX = (fromX + toX) / 2 + curve.offsetX;
                const midY = (fromY + toY) / 2 + curve.offsetY;
                
                this.animations.push({
                    startX: fromX,
                    startY: fromY,
                    midX,
                    midY,
                    targetX: toX,
                    targetY: toY,
                    progress: 0,
                    speed: 0.05,
                    size: 16,
                    trail: [],
                    color: curve.color,
                    index,
                    alive: true,
                    
                    update() {
                        this.progress += this.speed;
                        const t = Math.min(1, this.progress);
                        
                        // 2차 베지어 곡선
                        this.currentX = Math.pow(1-t, 2) * this.startX + 
                                       2 * (1-t) * t * this.midX + 
                                       t * t * this.targetX;
                        this.currentY = Math.pow(1-t, 2) * this.startY + 
                                       2 * (1-t) * t * this.midY + 
                                       t * t * this.targetY;
                        
                        // 트레일
                        this.trail.unshift({ x: this.currentX, y: this.currentY, alpha: 1 });
                        if (this.trail.length > 12) this.trail.pop();
                        this.trail.forEach((tr, i) => tr.alpha = 1 - i / 12);
                        
                        if (this.progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        // 트레일
                        this.trail.forEach((tr, i) => {
                            ctx.save();
                            ctx.globalAlpha = tr.alpha * 0.5;
                            const gradient = ctx.createRadialGradient(
                                tr.x, tr.y, 0, 
                                tr.x, tr.y, this.size * (1 - i * 0.06)
                            );
                            gradient.addColorStop(0, this.color);
                            gradient.addColorStop(0.6, '#8b5cf6');
                            gradient.addColorStop(1, 'transparent');
                            ctx.fillStyle = gradient;
                            ctx.beginPath();
                            ctx.arc(tr.x, tr.y, this.size * (1 - i * 0.06), 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        });
                        
                        // 메인 볼트
                        ctx.save();
                        const gradient = ctx.createRadialGradient(
                            this.currentX, this.currentY, 0, 
                            this.currentX, this.currentY, this.size
                        );
                        gradient.addColorStop(0, '#ffffff');
                        gradient.addColorStop(0.3, this.color);
                        gradient.addColorStop(0.7, '#8b5cf6');
                        gradient.addColorStop(1, 'transparent');
                        
                        ctx.fillStyle = gradient;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 25;
                        ctx.beginPath();
                        ctx.arc(this.currentX, this.currentY, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 중심 코어
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(this.currentX, this.currentY, this.size * 0.3, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                
                // 발사 파티클
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    this.particles.push({
                        x: fromX,
                        y: fromY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 2 + Math.random() * 2,
                        color: curve.color,
                        alpha: 1,
                        alive: true,
                        
                        update() {
                            this.x += this.vx;
                            this.y += this.vy;
                            this.vx *= 0.92;
                            this.vy *= 0.92;
                            this.alpha -= 0.04;
                            if (this.alpha <= 0) this.alive = false;
                        },
                        
                        draw(ctx) {
                            ctx.save();
                            ctx.globalAlpha = this.alpha;
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 6;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                    });
                }
                this.ensureLoop();
                
                // 각 볼트의 임팩트
                setTimeout(() => {
                    this.arcaneImpact(toX, toY, curve.color);
                }, 400);
                
            }, curve.delay);
        });
    },
    
    // 아케인 임팩트
    arcaneImpact(x, y, color = '#c084fc') {
        const impactColor = color;
        
        // 폭발 링 (작게 - 연발이므로)
        this.animations.push({
            x, y,
            radius: 5,
            maxRadius: 50,
            alpha: 1,
            startTime: Date.now(),
            duration: 250,
            impactColor,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.radius = 5 + (this.maxRadius - 5) * (1 - Math.pow(1 - progress, 3));
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha * 0.7;
                ctx.strokeStyle = this.impactColor;
                ctx.lineWidth = 2 * this.alpha;
                ctx.shadowColor = this.impactColor;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
        this.ensureLoop();
        
        // 마법 파편 (적게 - 연발이므로)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 3 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                color: impactColor,
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.94;
                    this.vy *= 0.94;
                    this.rotation += this.rotSpeed;
                    this.alpha -= 0.025;
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                    
                    // 다이아몬드 형태
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size);
                    ctx.lineTo(this.size * 0.6, 0);
                    ctx.lineTo(0, this.size);
                    ctx.lineTo(-this.size * 0.6, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 마력 집중 (Mana Focus)
    // magicT.png 아이콘 활용 + 마법진 + 마력 수렴
    // ==========================================
    manaFocus(x, y) {
        this.ensureLoop();
        
        // 이미지 로드
        const focusImg = new Image();
        focusImg.src = 'magicT.png';
        
        // 1. 발 아래 마법진 (더 화려하게)
        this.manaFocusCircle(x, y + 40, '#8b5cf6');
        
        // 2. 메인 이미지 VFX (magicT.png)
        this.animations.push({
            x, y: y - 30,
            scale: 0,
            maxScale: 1,
            alpha: 0,
            rotation: 0,
            pulsePhase: 0,
            startTime: Date.now(),
            duration: 1000,
            img: focusImg,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                // 등장 (회전하며 확대)
                if (progress < 0.2) {
                    const t = progress / 0.2;
                    this.scale = this.maxScale * this.easeOutBack(t);
                    this.alpha = t;
                    this.rotation = (1 - t) * Math.PI * 2;
                }
                // 유지 + 펄스
                else if (progress < 0.7) {
                    this.alpha = 1;
                    this.pulsePhase += 0.12;
                    this.scale = this.maxScale + Math.sin(this.pulsePhase) * 0.1;
                    this.rotation = Math.sin(this.pulsePhase * 0.5) * 0.05;
                }
                // 페이드아웃
                else {
                    const fadeT = (progress - 0.7) / 0.3;
                    this.alpha = 1 - fadeT;
                    this.scale = this.maxScale * (1 + fadeT * 0.5);
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const size = 100 * this.scale;
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.alpha;
                
                // 외곽 글로우
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 30 + Math.sin(this.pulsePhase) * 10;
                
                // 이미지 그리기
                if (this.img.complete) {
                    ctx.drawImage(this.img, -size/2, -size/2, size, size);
                    
                    // 추가 글로우 레이어
                    ctx.globalAlpha = this.alpha * 0.3;
                    ctx.shadowBlur = 50;
                    ctx.drawImage(this.img, -size/2, -size/2, size, size);
                }
                
                ctx.restore();
            },
            
            easeOutBack(t) {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            }
        });
        
        // 3. 외곽 빛 링 (등장)
        this.animations.push({
            x, y: y - 30,
            radius: 0,
            maxRadius: 80,
            alpha: 0,
            startTime: Date.now(),
            duration: 400,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.radius = this.maxRadius * progress;
                this.alpha = 0.6 * (1 - progress);
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
        
        // 3. 수렴하는 마력 입자 (웨이브 방식)
        const waves = 3;
        for (let wave = 0; wave < waves; wave++) {
            const particlesPerWave = 12;
            const waveDelay = wave * 200;
            
            for (let i = 0; i < particlesPerWave; i++) {
                const angle = (i / particlesPerWave) * Math.PI * 2 + wave * 0.3;
                const dist = 100 + wave * 30;
                const startX = x + Math.cos(angle) * dist;
                const startY = y + Math.sin(angle) * dist;
                const delay = waveDelay + Math.random() * 100;
                
                setTimeout(() => {
                    this.particles.push({
                        x: startX,
                        y: startY,
                        startX,
                        startY,
                        targetX: x,
                        targetY: y - 20,
                        progress: 0,
                        speed: 0.02 + Math.random() * 0.01,
                        size: 4 + Math.random() * 3,
                        baseSize: 4 + Math.random() * 3,
                        color: ['#a78bfa', '#c084fc', '#8b5cf6'][Math.floor(Math.random() * 3)],
                        trail: [],
                        alive: true,
                        
                        update() {
                            this.progress += this.speed;
                            const t = Math.min(1, this.progress);
                            const eased = t * t * (3 - 2 * t); // smoothstep
                            
                            this.currentX = this.startX + (this.targetX - this.startX) * eased;
                            this.currentY = this.startY + (this.targetY - this.startY) * eased;
                            
                            // 트레일 추가
                            this.trail.unshift({ x: this.currentX, y: this.currentY });
                            if (this.trail.length > 8) this.trail.pop();
                            
                            // 크기 변화 (도착할수록 커짐)
                            this.size = this.baseSize * (0.5 + eased * 0.8);
                            
                            if (this.progress >= 1) this.alive = false;
                        },
                        
                        draw(ctx) {
                            // 알파 계산 (부드러운 페이드 인/아웃)
                            let alpha;
                            if (this.progress < 0.2) {
                                alpha = this.progress / 0.2;
                            } else if (this.progress < 0.8) {
                                alpha = 1;
                            } else {
                                alpha = 1 - (this.progress - 0.8) / 0.2;
                            }
                            
                            // 트레일
                            this.trail.forEach((t, i) => {
                                ctx.save();
                                ctx.globalAlpha = alpha * (1 - i / this.trail.length) * 0.4;
                                ctx.fillStyle = this.color;
                                ctx.beginPath();
                                ctx.arc(t.x, t.y, this.size * (1 - i * 0.1), 0, Math.PI * 2);
                                ctx.fill();
                                ctx.restore();
                            });
                            
                            // 메인 파티클
                            ctx.save();
                            ctx.globalAlpha = alpha;
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 12;
                            ctx.beginPath();
                            ctx.arc(this.currentX, this.currentY, this.size, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // 중심 코어
                            ctx.fillStyle = '#ffffff';
                            ctx.globalAlpha = alpha * 0.8;
                            ctx.beginPath();
                            ctx.arc(this.currentX, this.currentY, this.size * 0.4, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                    });
                    this.ensureLoop();
                }, delay);
            }
        }
        
        // 4. 중앙 차징 글로우 (지속)
        this.animations.push({
            x, y: y - 20,
            size: 0,
            alpha: 0,
            startTime: Date.now(),
            duration: 800,
            pulse: 0,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                this.pulse = elapsed * 0.015;
                
                if (progress < 0.3) {
                    this.size = 30 * (progress / 0.3);
                    this.alpha = progress / 0.3;
                } else if (progress < 0.7) {
                    this.size = 30 + Math.sin(this.pulse) * 5;
                    this.alpha = 1;
                } else {
                    const fadeProgress = (progress - 0.7) / 0.3;
                    this.size = 30 * (1 - fadeProgress);
                    this.alpha = 1 - fadeProgress;
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                gradient.addColorStop(0.3, 'rgba(192, 132, 252, 0.6)');
                gradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.3)');
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        
        // 5. 최종 버스트 (강화)
        setTimeout(() => {
            this.manaFocusBurst(x, y - 20);
        }, 700);
    },
    
    // 마력 집중 전용 마법진
    manaFocusCircle(x, y, color) {
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: 60,
            rotation: 0,
            innerRotation: 0,
            alpha: 0,
            startTime: Date.now(),
            duration: 900,
            color,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                if (progress < 0.15) {
                    this.radius = this.maxRadius * (progress / 0.15);
                    this.alpha = progress / 0.15;
                } else if (progress < 0.75) {
                    this.alpha = 1;
                } else {
                    this.alpha = 1 - (progress - 0.75) / 0.25;
                }
                
                this.rotation += 0.025;
                this.innerRotation -= 0.04;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.globalAlpha = this.alpha;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                
                // 외곽 원
                ctx.save();
                ctx.rotate(this.rotation);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 외곽 룬
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const px = Math.cos(angle) * this.radius;
                    const py = Math.sin(angle) * this.radius;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(px, py, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
                
                // 내부 원 (반대 방향 회전)
                ctx.save();
                ctx.rotate(this.innerRotation);
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                
                // 내부 패턴 (삼각형들)
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * this.radius * 0.55, Math.sin(angle) * this.radius * 0.55);
                    ctx.stroke();
                }
                ctx.restore();
                
                // 중심 글로우
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 0.3);
                gradient.addColorStop(0, 'rgba(192, 132, 252, 0.4)');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
    },
    
    // 마력 집중 전용 버스트
    manaFocusBurst(x, y) {
        // 메인 버스트
        this.animations.push({
            x, y,
            size: 10,
            maxSize: 60,
            alpha: 1,
            startTime: Date.now(),
            duration: 350,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.size = 10 + (this.maxSize - 10) * (1 - Math.pow(1 - progress, 4));
                this.alpha = 1 - progress * progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                // 외곽 링
                ctx.save();
                ctx.globalAlpha = this.alpha * 0.8;
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                
                // 내부 글로우
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                gradient.addColorStop(0.3, 'rgba(192, 132, 252, 0.6)');
                gradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.2)');
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        
        // 방사형 파티클
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const speed = 5 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 2,
                color: Math.random() > 0.5 ? '#c084fc' : '#a78bfa',
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.92;
                    this.vy *= 0.92;
                    this.alpha -= 0.035;
                    this.size *= 0.97;
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
        
        // 스파클
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 30;
            setTimeout(() => {
                this.particles.push({
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist,
                    size: 2,
                    alpha: 1,
                    twinkle: Math.random() * Math.PI * 2,
                    alive: true,
                    lifespan: 400,
                    startTime: Date.now(),
                    
                    update() {
                        const elapsed = Date.now() - this.startTime;
                        this.twinkle += 0.2;
                        this.alpha = Math.sin((elapsed / this.lifespan) * Math.PI);
                        if (elapsed >= this.lifespan) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const scale = 0.5 + Math.sin(this.twinkle) * 0.5;
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = '#c084fc';
                        ctx.shadowBlur = 8;
                        
                        // 십자 스파클
                        ctx.translate(this.x, this.y);
                        ctx.beginPath();
                        ctx.moveTo(0, -this.size * 2 * scale);
                        ctx.lineTo(0, this.size * 2 * scale);
                        ctx.moveTo(-this.size * 2 * scale, 0);
                        ctx.lineTo(this.size * 2 * scale, 0);
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                        
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, Math.random() * 100);
        }
    },
    
    // 작은 마법진
    smallMagicCircle(x, y, color) {
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: 50,
            rotation: 0,
            alpha: 0,
            startTime: Date.now(),
            duration: 800,
            color,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                if (progress < 0.2) {
                    this.radius = this.maxRadius * (progress / 0.2);
                    this.alpha = progress / 0.2;
                } else if (progress < 0.7) {
                    this.alpha = 1;
                } else {
                    this.alpha = 1 - (progress - 0.7) / 0.3;
                }
                
                this.rotation += 0.02;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.alpha * 0.7;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                
                // 외곽 원
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 내부 패턴
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                
                // 룬 마커
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const px = Math.cos(angle) * this.radius * 0.8;
                    const py = Math.sin(angle) * this.radius * 0.8;
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        });
    },
    
    // 마력 버스트
    manaBurst(x, y, color) {
        this.animations.push({
            x, y,
            size: 5,
            maxSize: 40,
            alpha: 1,
            startTime: Date.now(),
            duration: 300,
            color,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.size = 5 + (this.maxSize - 5) * (1 - Math.pow(1 - progress, 3));
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.4, this.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        
        // 파티클
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                size: 3,
                color,
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.92;
                    this.vy *= 0.92;
                    this.alpha -= 0.04;
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 명상 (Meditation)
    // 젠 스타일 - 평온한 빛
    // ==========================================
    meditation(x, y) {
        this.ensureLoop();
        
        const totalDuration = 800; // 전체 지속시간
        
        // 내면의 빛 (중앙 글로우)
        this.animations.push({
            x, y: y - 20,
            size: 0,
            maxSize: 70,
            alpha: 0,
            startTime: Date.now(),
            duration: totalDuration,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                if (progress < 0.2) {
                    // 빠르게 등장
                    const t = progress / 0.2;
                    this.size = this.maxSize * t;
                    this.alpha = t * 0.6;
                } else if (progress < 0.5) {
                    // 펄스
                    const t = (progress - 0.2) / 0.3;
                    this.size = this.maxSize * (1 + Math.sin(t * Math.PI * 2) * 0.1);
                    this.alpha = 0.6;
                } else {
                    // 빠르게 사라짐
                    const t = (progress - 0.5) / 0.5;
                    this.alpha = 0.6 * (1 - t);
                    this.size = this.maxSize * (1 - t * 0.3);
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                if (this.size <= 0 || this.alpha <= 0) return;
                
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, 'rgba(192, 132, 252, 0.9)');
                gradient.addColorStop(0.4, 'rgba(139, 92, 246, 0.5)');
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        
        // 상승하는 빛 입자 (8개, 빠르게 사라짐)
        for (let i = 0; i < 8; i++) {
            const delay = i * 40;
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 50;
                const lifespan = 400 + Math.random() * 200;
                const startTime = Date.now();
                
                this.particles.push({
                    x: x + offsetX,
                    y: y + 10,
                    vy: -2 - Math.random() * 1.5,
                    size: 3 + Math.random() * 2,
                    alpha: 0,
                    maxAlpha: 0.7 + Math.random() * 0.3,
                    color: i % 2 === 0 ? '#c084fc' : '#e879f9',
                    alive: true,
                    startTime,
                    lifespan,
                    
                    update() {
                        const age = Date.now() - this.startTime;
                        const progress = age / this.lifespan;
                        
                        this.y += this.vy;
                        this.vy *= 0.96;
                        
                        // 부드러운 페이드 인/아웃
                        if (progress < 0.2) {
                            this.alpha = this.maxAlpha * (progress / 0.2);
                        } else if (progress < 0.6) {
                            this.alpha = this.maxAlpha;
                        } else {
                            this.alpha = this.maxAlpha * (1 - (progress - 0.6) / 0.4);
                        }
                        
                        if (progress >= 1 || this.alpha <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        if (this.alpha <= 0) return;
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, delay);
        }
        
        // 명상 링 (한 번만 확장)
        this.animations.push({
            x, y: y - 20,
            size: 20,
            maxSize: 100,
            alpha: 0.8,
            startTime: Date.now(),
            duration: 600,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                this.size = 20 + (this.maxSize - 20) * progress;
                this.alpha = 0.8 * (1 - progress);
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                if (this.alpha <= 0) return;
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 마법 방벽 (Magic Barrier)
    // magicdef.png 아이콘 활용 방어막
    // ==========================================
    magicBarrier(x, y) {
        this.ensureLoop();
        
        // 이미지 로드
        const shieldImg = new Image();
        shieldImg.src = 'magicdef.png';
        
        // 메인 실드 (이미지 사용)
        this.animations.push({
            x, y,
            scale: 0,
            maxScale: 1,
            alpha: 0,
            pulsePhase: 0,
            startTime: Date.now(),
            duration: 1200,
            img: shieldImg,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                // 등장
                if (progress < 0.15) {
                    this.scale = this.maxScale * this.easeOutBack(progress / 0.15);
                    this.alpha = progress / 0.15;
                } 
                // 유지 + 펄스
                else if (progress < 0.7) {
                    this.alpha = 1;
                    this.pulsePhase += 0.15;
                    this.scale = this.maxScale + Math.sin(this.pulsePhase) * 0.08;
                } 
                // 페이드아웃
                else {
                    this.alpha = 1 - (progress - 0.7) / 0.3;
                    this.scale = this.maxScale * (1 + (1 - this.alpha) * 0.3);
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const size = 120 * this.scale;
                
                ctx.save();
                ctx.translate(this.x, this.y - 20);
                ctx.globalAlpha = this.alpha;
                
                // 외곽 글로우
                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 40 + Math.sin(this.pulsePhase) * 15;
                
                // 이미지 그리기
                if (this.img.complete) {
                    ctx.drawImage(this.img, -size/2, -size/2, size, size);
                    
                    // 추가 글로우 레이어
                    ctx.globalAlpha = this.alpha * 0.4;
                    ctx.shadowBlur = 60;
                    ctx.drawImage(this.img, -size/2, -size/2, size, size);
                }
                
                ctx.restore();
            },
            
            easeOutBack(t) {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            }
        });
        
        // 방어막 활성화 링
        this.animations.push({
            x, y: y - 20,
            size: 0,
            maxSize: 100,
            alpha: 1,
            startTime: Date.now(),
            duration: 400,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.size = this.maxSize * progress;
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = '#60a5fa';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#3b82f6';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
        
        // 보호막 파티클 (안쪽으로 모임)
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const dist = 100;
            
            setTimeout(() => {
                this.particles.push({
                    x: x + Math.cos(angle) * dist,
                    y: y - 20 + Math.sin(angle) * dist,
                    targetX: x,
                    targetY: y - 20,
                    progress: 0,
                    speed: 0.04,
                    size: 4 + Math.random() * 3,
                    color: Math.random() > 0.5 ? '#60a5fa' : '#93c5fd',
                    alive: true,
                    
                    update() {
                        this.progress += this.speed;
                        const t = Math.min(1, this.progress);
                        const easeT = 1 - Math.pow(1 - t, 3);
                        this.currentX = this.x + (this.targetX - this.x) * easeT;
                        this.currentY = this.y + (this.targetY - this.y) * easeT;
                        if (this.progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const alpha = 1 - this.progress * 0.5;
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.arc(this.currentX, this.currentY, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, i * 20);
        }
    },
    
    // ==========================================
    // 시간 왜곡 (Time Warp)
    // 화려한 시간/공간 왜곡 이펙트 with time.png
    // ==========================================
    timeWarp(x, y) {
        this.ensureLoop();
        
        // time.png 이미지 로드
        const timeImg = new Image();
        timeImg.src = 'time.png';
        
        // 1. 시공간 균열 - 초기 균열 효과
        this.animations.push({
            x, y,
            radius: 10,
            alpha: 0,
            rotation: 0,
            startTime: Date.now(),
            duration: 300,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.radius = 10 + progress * 60;
                this.alpha = Math.min(1, progress * 2);
                this.rotation += 0.1;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.alpha * 0.7;
                
                // 시공간 균열선
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 20;
                
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    const len = this.radius * (0.7 + Math.random() * 0.3);
                    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        });
        
        // 2. 메인 시계 이미지 애니메이션 (time.png)
        setTimeout(() => {
            const mainAnim = {
                x, y,
                img: timeImg,
                scale: 0,
                targetScale: 1.5,
                rotation: -Math.PI / 4,
                alpha: 0,
                startTime: Date.now(),
                duration: 1200,
                phase: 'appear', // appear -> spin -> fade
                alive: true,
                
                update() {
                    const progress = (Date.now() - this.startTime) / this.duration;
                    
                    if (progress < 0.2) {
                        // 등장 (빠르게)
                        const p = progress / 0.2;
                        this.scale = this.targetScale * (1 - Math.pow(1 - p, 3));
                        this.alpha = p;
                        this.rotation = -Math.PI / 4 + p * Math.PI * 0.5;
                    } else if (progress < 0.7) {
                        // 회전 (시계 되감기 느낌)
                        const p = (progress - 0.2) / 0.5;
                        this.scale = this.targetScale * (1 + Math.sin(p * Math.PI * 2) * 0.1);
                        this.alpha = 1;
                        // 역방향 빠른 회전
                        this.rotation += -0.15;
                    } else {
                        // 페이드아웃
                        const p = (progress - 0.7) / 0.3;
                        this.scale = this.targetScale * (1 + p * 0.5);
                        this.alpha = 1 - p;
                        this.rotation += -0.1;
                    }
                    
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    if (!this.img.complete) return;
                    
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha;
                    
                    // 외곽 글로우
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 40;
                    
                    const size = 80 * this.scale;
                    ctx.drawImage(this.img, -size/2, -size/2, size, size);
                    
                    // 이중 글로우 효과
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = 25;
                    ctx.globalAlpha = this.alpha * 0.5;
                    ctx.drawImage(this.img, -size/2, -size/2, size, size);
                    
                    ctx.restore();
                }
            };
            this.animations.push(mainAnim);
            this.ensureLoop();
        }, 200);
        
        // 3. 시간 고리 (회전하는 링들)
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.animations.push({
                    x, y,
                    radius: 50 + i * 35,
                    rotation: i * Math.PI / 3,
                    alpha: 0,
                    startTime: Date.now(),
                    duration: 1400,
                    index: i,
                    alive: true,
                    
                    update() {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        
                        if (progress < 0.15) {
                            this.alpha = progress / 0.15;
                        } else if (progress < 0.75) {
                            this.alpha = 1;
                        } else {
                            this.alpha = 1 - (progress - 0.75) / 0.25;
                        }
                        
                        // 교대 회전 (안쪽/바깥쪽 반대 방향)
                        const speed = 0.06 - this.index * 0.015;
                        this.rotation += speed * (this.index % 2 === 0 ? 1 : -1);
                        if (progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.globalAlpha = this.alpha * 0.7;
                        
                        // 황금색 시간 링
                        const gradient = ctx.createLinearGradient(-this.radius, 0, this.radius, 0);
                        gradient.addColorStop(0, '#fbbf24');
                        gradient.addColorStop(0.5, '#f59e0b');
                        gradient.addColorStop(1, '#d97706');
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 3;
                        ctx.shadowColor = '#fbbf24';
                        ctx.shadowBlur = 20;
                        
                        // 끊어진 원호 (시계 느낌)
                        for (let seg = 0; seg < 4; seg++) {
                            ctx.beginPath();
                            const startAngle = (seg / 4) * Math.PI * 2 + 0.1;
                            const endAngle = ((seg + 1) / 4) * Math.PI * 2 - 0.1;
                            ctx.arc(0, 0, this.radius, startAngle, endAngle);
                            ctx.stroke();
                        }
                        
                        // 시계 눈금 마커
                        ctx.fillStyle = '#fbbf24';
                        for (let j = 0; j < 12; j++) {
                            const angle = (j / 12) * Math.PI * 2;
                            const markerLen = j % 3 === 0 ? 8 : 4;
                            ctx.beginPath();
                            ctx.arc(
                                Math.cos(angle) * (this.radius + markerLen),
                                Math.sin(angle) * (this.radius + markerLen),
                                j % 3 === 0 ? 3 : 1.5, 0, Math.PI * 2
                            );
                            ctx.fill();
                        }
                        
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, 100 + i * 80);
        }
        
        // 4. 역류하는 시간 파티클 (아래에서 위로!)
        for (let i = 0; i < 40; i++) {
            const delay = Math.random() * 800;
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 80;
                this.particles.push({
                    x: x + Math.cos(angle) * dist,
                    y: y + 60 + Math.random() * 40,
                    targetY: y - 80 - Math.random() * 40,
                    targetX: x + (Math.random() - 0.5) * 60,
                    progress: 0,
                    speed: 0.015 + Math.random() * 0.02,
                    size: 2 + Math.random() * 3,
                    color: ['#fbbf24', '#a855f7', '#f59e0b', '#c084fc'][Math.floor(Math.random() * 4)],
                    alive: true,
                    
                    update() {
                        this.progress += this.speed;
                        // 비선형 궤적 (느리게 시작 → 빠르게 가속)
                        const eased = this.progress * this.progress;
                        this.currentX = this.x + (this.targetX - this.x) * eased;
                        this.currentY = this.y + (this.targetY - this.y) * eased;
                        if (this.progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const alpha = Math.sin(this.progress * Math.PI);
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 10;
                        
                        // 꼬리 효과
                        const tailLen = 5;
                        for (let t = 0; t < tailLen; t++) {
                            const tAlpha = (1 - t / tailLen) * alpha * 0.5;
                            const tSize = this.size * (1 - t / tailLen * 0.5);
                            ctx.globalAlpha = tAlpha;
                            ctx.beginPath();
                            ctx.arc(
                                this.currentX,
                                this.currentY + t * 4,
                                tSize, 0, Math.PI * 2
                            );
                            ctx.fill();
                        }
                        
                        // 메인 파티클
                        ctx.globalAlpha = alpha;
                        ctx.beginPath();
                        ctx.arc(this.currentX, this.currentY, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, delay);
        }
        
        // 5. 시공간 왜곡 펄스
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.animations.push({
                    x, y,
                    radius: 20,
                    maxRadius: 150,
                    alpha: 0.8,
                    startTime: Date.now(),
                    duration: 600,
                    alive: true,
                    
                    update() {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        const eased = 1 - Math.pow(1 - progress, 3);
                        this.radius = 20 + (this.maxRadius - 20) * eased;
                        this.alpha = 0.8 * (1 - progress);
                        if (progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        
                        // 왜곡 링
                        const gradient = ctx.createRadialGradient(
                            this.x, this.y, this.radius * 0.8,
                            this.x, this.y, this.radius
                        );
                        gradient.addColorStop(0, 'rgba(251, 191, 36, 0)');
                        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
                        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, 300 + i * 200);
        }
        
        // 6. 중앙 플래시
        setTimeout(() => {
            this.animations.push({
                x, y,
                alpha: 1,
                radius: 0,
                startTime: Date.now(),
                duration: 400,
                alive: true,
                
                update() {
                    const progress = (Date.now() - this.startTime) / this.duration;
                    this.radius = 200 * progress;
                    this.alpha = 1 - progress;
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    const gradient = ctx.createRadialGradient(
                        this.x, this.y, 0,
                        this.x, this.y, this.radius
                    );
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
                    gradient.addColorStop(0.3, `rgba(251, 191, 36, ${this.alpha * 0.6})`);
                    gradient.addColorStop(0.7, `rgba(168, 85, 247, ${this.alpha * 0.3})`);
                    gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
            this.ensureLoop();
        }, 600);
        
        // 7. 화면 진동 효과 (DOM)
        setTimeout(() => {
            const battleArea = document.getElementById('battle-area');
            if (battleArea) {
                battleArea.style.animation = 'none';
                void battleArea.offsetWidth;
                battleArea.style.animation = 'timeWarpShake 0.5s ease-out';
                setTimeout(() => {
                    battleArea.style.animation = '';
                }, 500);
            }
        }, 500);
    },
    
    // ==========================================
    // 에테르 화살 (Ether Arrow)
    // 빛나는 마법 화살
    // ==========================================
    etherArrow(fromX, fromY, toX, toY) {
        this.ensureLoop();
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 시전 빛
        this.castCircle(fromX, fromY, '#c084fc', 40);
        
        // 화살 발사
        setTimeout(() => {
            this.animations.push({
                x: fromX,
                y: fromY,
                angle,
                progress: 0,
                speed: 0.05,
                length: 40,
                dist,
                trail: [],
                alive: true,
                
                update() {
                    this.progress += this.speed;
                    const t = Math.min(1, this.progress);
                    
                    this.currentX = this.x + Math.cos(this.angle) * this.dist * t;
                    this.currentY = this.y + Math.sin(this.angle) * this.dist * t;
                    
                    this.trail.unshift({ x: this.currentX, y: this.currentY, alpha: 1 });
                    if (this.trail.length > 20) this.trail.pop();
                    this.trail.forEach((t, i) => t.alpha = 1 - i / 20);
                    
                    if (this.progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    // 트레일
                    ctx.save();
                    this.trail.forEach((t, i) => {
                        if (i === 0) return;
                        ctx.globalAlpha = t.alpha * 0.5;
                        ctx.strokeStyle = '#c084fc';
                        ctx.lineWidth = 4 * t.alpha;
                        ctx.shadowColor = '#c084fc';
                        ctx.shadowBlur = 10;
                        
                        const prev = this.trail[i - 1];
                        ctx.beginPath();
                        ctx.moveTo(prev.x, prev.y);
                        ctx.lineTo(t.x, t.y);
                        ctx.stroke();
                    });
                    ctx.restore();
                    
                    // 화살 본체
                    ctx.save();
                    ctx.translate(this.currentX, this.currentY);
                    ctx.rotate(this.angle);
                    
                    // 글로우
                    ctx.shadowColor = '#c084fc';
                    ctx.shadowBlur = 20;
                    
                    // 화살 형태
                    const gradient = ctx.createLinearGradient(-this.length, 0, this.length / 2, 0);
                    gradient.addColorStop(0, 'transparent');
                    gradient.addColorStop(0.3, '#c084fc');
                    gradient.addColorStop(0.7, '#ffffff');
                    gradient.addColorStop(1, '#ffffff');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(this.length / 2, 0);
                    ctx.lineTo(-this.length / 3, -8);
                    ctx.lineTo(-this.length, 0);
                    ctx.lineTo(-this.length / 3, 8);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                }
            });
            this.ensureLoop();
        }, 100);
        
        // 임팩트
        setTimeout(() => {
            this.etherImpact(toX, toY);
        }, 100 + (dist / (dist * 0.05)) * 16);
    },
    
    // 에테르 임팩트
    etherImpact(x, y) {
        // 빛 폭발
        this.animations.push({
            x, y,
            size: 10,
            maxSize: 60,
            alpha: 1,
            startTime: Date.now(),
            duration: 300,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.size = 10 + (this.maxSize - 10) * (1 - Math.pow(1 - progress, 3));
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.4, '#e9d5ff');
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        
        // 별빛 파편
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                twinkle: Math.random() * Math.PI * 2,
                color: '#e9d5ff',
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                    this.twinkle += 0.3;
                    this.alpha -= 0.025;
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const twinkleAlpha = this.alpha * (0.5 + Math.sin(this.twinkle) * 0.5);
                    ctx.save();
                    ctx.globalAlpha = twinkleAlpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 에테르 화살 관통 (Ether Arrow Pierce)
    // 모든 적을 관통하는 빛의 화살 - 강화 VFX
    // ==========================================
    etherArrowPierce(fromX, fromY, targets) {
        if (!targets || targets.length === 0) return;
        this.ensureLoop();
        
        // 마지막 타겟 너머까지 발사
        const lastTarget = targets[targets.length - 1];
        const dx = lastTarget.x - fromX;
        const dy = lastTarget.y - fromY;
        const angle = Math.atan2(dy, dx);
        const totalDist = Math.sqrt(dx * dx + dy * dy) + 250; // 관통 후 더 진행
        
        // 시전 이펙트 (더 화려하게)
        this.castCircle(fromX, fromY, '#e9d5ff', 60);
        
        // 차지업 파티클
        for (let i = 0; i < 20; i++) {
            const chargeAngle = (i / 20) * Math.PI * 2;
            const dist = 60 + Math.random() * 30;
            setTimeout(() => {
                this.particles.push({
                    x: fromX + Math.cos(chargeAngle) * dist,
                    y: fromY + Math.sin(chargeAngle) * dist,
                    targetX: fromX,
                    targetY: fromY,
                    progress: 0,
                    speed: 0.06 + Math.random() * 0.03,
                    size: 3 + Math.random() * 3,
                    color: Math.random() > 0.5 ? '#e9d5ff' : '#67e8f9',
                    alive: true,
                    
                    update() {
                        this.progress += this.speed;
                        const t = Math.min(1, this.progress);
                        this.currentX = this.x + (this.targetX - this.x) * t;
                        this.currentY = this.y + (this.targetY - this.y) * t;
                        if (this.progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const alpha = 1 - this.progress * 0.5;
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.arc(this.currentX, this.currentY, this.size * (1 - this.progress * 0.5), 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, i * 5);
        }
        
        // 관통 화살 발사
        setTimeout(() => {
            // 발사 플래시
            this.animations.push({
                x: fromX,
                y: fromY,
                size: 0,
                maxSize: 80,
                alpha: 1,
                startTime: Date.now(),
                duration: 150,
                alive: true,
                
                update() {
                    const progress = (Date.now() - this.startTime) / this.duration;
                    this.size = this.maxSize * progress;
                    this.alpha = 1 - progress;
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(0.3, '#e9d5ff');
                    gradient.addColorStop(0.6, '#67e8f9');
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
            
            // 메인 화살
            this.animations.push({
                x: fromX,
                y: fromY,
                angle,
                progress: 0,
                speed: 0.05,
                length: 80,  // 더 긴 화살
                totalDist,
                trail: [],
                targets,
                hitTargets: new Set(),
                pulsePhase: 0,
                alive: true,
                
                update() {
                    this.progress += this.speed;
                    this.pulsePhase += 0.3;
                    const t = Math.min(1, this.progress);
                    
                    this.currentX = this.x + Math.cos(this.angle) * this.totalDist * t;
                    this.currentY = this.y + Math.sin(this.angle) * this.totalDist * t;
                    
                    // 긴 트레일
                    this.trail.unshift({ x: this.currentX, y: this.currentY, alpha: 1 });
                    if (this.trail.length > 40) this.trail.pop();
                    this.trail.forEach((tr, i) => tr.alpha = 1 - i / 40);
                    
                    // 각 타겟과의 거리 체크 (관통 시 이펙트)
                    this.targets.forEach((target, idx) => {
                        if (this.hitTargets.has(idx)) return;
                        const dist = Math.sqrt(
                            Math.pow(this.currentX - target.x, 2) + 
                            Math.pow(this.currentY - target.y, 2)
                        );
                        if (dist < 50) {
                            this.hitTargets.add(idx);
                            if (typeof MageVFX !== 'undefined') {
                                MageVFX.etherPierceHit(target.x, target.y);
                            }
                        }
                    });
                    
                    if (this.progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    // 외곽 글로우 트레일 (청록 + 보라)
                    ctx.save();
                    ctx.lineCap = 'round';
                    
                    // 첫 번째 레이어 (넓은 청록 글로우)
                    this.trail.forEach((tr, i) => {
                        if (i === 0 || i >= this.trail.length - 1) return;
                        ctx.globalAlpha = tr.alpha * 0.4;
                        ctx.strokeStyle = '#67e8f9';
                        ctx.lineWidth = 20 * tr.alpha;
                        ctx.shadowColor = '#22d3ee';
                        ctx.shadowBlur = 30;
                        
                        const prev = this.trail[i - 1];
                        ctx.beginPath();
                        ctx.moveTo(prev.x, prev.y);
                        ctx.lineTo(tr.x, tr.y);
                        ctx.stroke();
                    });
                    
                    // 두 번째 레이어 (중간 보라)
                    this.trail.forEach((tr, i) => {
                        if (i === 0 || i >= this.trail.length - 1) return;
                        ctx.globalAlpha = tr.alpha * 0.6;
                        ctx.strokeStyle = '#c084fc';
                        ctx.lineWidth = 12 * tr.alpha;
                        ctx.shadowColor = '#a855f7';
                        ctx.shadowBlur = 20;
                        
                        const prev = this.trail[i - 1];
                        ctx.beginPath();
                        ctx.moveTo(prev.x, prev.y);
                        ctx.lineTo(tr.x, tr.y);
                        ctx.stroke();
                    });
                    
                    // 세 번째 레이어 (밝은 코어)
                    this.trail.forEach((tr, i) => {
                        if (i === 0 || i >= this.trail.length - 1) return;
                        ctx.globalAlpha = tr.alpha * 0.9;
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 5 * tr.alpha;
                        ctx.shadowColor = '#ffffff';
                        ctx.shadowBlur = 15;
                        
                        const prev = this.trail[i - 1];
                        ctx.beginPath();
                        ctx.moveTo(prev.x, prev.y);
                        ctx.lineTo(tr.x, tr.y);
                        ctx.stroke();
                    });
                    ctx.restore();
                    
                    // 화살 본체
                    ctx.save();
                    ctx.translate(this.currentX, this.currentY);
                    ctx.rotate(this.angle);
                    
                    // 외부 글로우 (맥동)
                    const pulseSize = 1 + Math.sin(this.pulsePhase) * 0.15;
                    ctx.shadowColor = '#67e8f9';
                    ctx.shadowBlur = 40 * pulseSize;
                    
                    // 화살 형태 (더 크고 날카롭게)
                    const len = this.length * pulseSize;
                    const gradient = ctx.createLinearGradient(-len, 0, len / 2, 0);
                    gradient.addColorStop(0, 'transparent');
                    gradient.addColorStop(0.15, '#67e8f9');
                    gradient.addColorStop(0.4, '#c084fc');
                    gradient.addColorStop(0.7, '#e9d5ff');
                    gradient.addColorStop(1, '#ffffff');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.moveTo(len / 2, 0);
                    ctx.lineTo(-len / 4, -10 * pulseSize);
                    ctx.lineTo(-len, 0);
                    ctx.lineTo(-len / 4, 10 * pulseSize);
                    ctx.closePath();
                    ctx.fill();
                    
                    // 중심 코어 (밝은 빛)
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 12 * pulseSize, 4 * pulseSize, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
            });
            this.ensureLoop();
        }, 120);
        
        // 시작점 파티클 버스트
        for (let i = 0; i < 20; i++) {
            const burstAngle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            setTimeout(() => {
                this.particles.push({
                    x: fromX,
                    y: fromY,
                    vx: Math.cos(burstAngle) * speed,
                    vy: Math.sin(burstAngle) * speed,
                    size: 3 + Math.random() * 4,
                    color: ['#e9d5ff', '#67e8f9', '#c084fc'][Math.floor(Math.random() * 3)],
                    alpha: 1,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.92;
                        this.vy *= 0.92;
                        this.alpha -= 0.025;
                        if (this.alpha <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, i * 5);
        }
    },
    
    // 에테르 관통 히트 이펙트 (강화)
    etherPierceHit(x, y) {
        this.ensureLoop();
        
        // 관통 링 (확장)
        this.animations.push({
            x, y,
            size: 0,
            maxSize: 70,
            alpha: 1,
            startTime: Date.now(),
            duration: 300,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.size = this.maxSize * progress;
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                // 청록 외곽 링
                ctx.strokeStyle = '#67e8f9';
                ctx.lineWidth = 4 * this.alpha;
                ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                
                // 보라 내부 링
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 2 * this.alpha;
                ctx.shadowColor = '#a855f7';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // 별빛 폭발
        this.animations.push({
            x, y,
            rotation: 0,
            size: 0,
            maxSize: 60,
            alpha: 1,
            startTime: Date.now(),
            duration: 350,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.size = this.maxSize * Math.pow(progress, 0.5);
                this.rotation = progress * Math.PI * 0.5;
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.alpha;
                
                // 8방향 빛줄기
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#e9d5ff';
                ctx.shadowBlur = 20;
                
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const len = i % 2 === 0 ? this.size : this.size * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
                    ctx.stroke();
                }
                
                // 중앙 글로우
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 0.4);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(0.3, 'rgba(103, 232, 249, 0.6)');
                gradient.addColorStop(0.6, 'rgba(192, 132, 252, 0.3)');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // 관통 파편 (더 많고 화려하게)
        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 5 + Math.random() * 6;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: ['#ffffff', '#67e8f9', '#c084fc', '#e9d5ff'][Math.floor(Math.random() * 4)],
                twinkle: Math.random() * Math.PI * 2,
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.88;
                    this.vy *= 0.88;
                    this.twinkle += 0.4;
                    this.alpha -= 0.035;
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const twinkleAlpha = this.alpha * (0.6 + Math.sin(this.twinkle) * 0.4);
                    ctx.save();
                    ctx.globalAlpha = twinkleAlpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 에너지 볼트 (Energy Bolt)
    // 전기 구체
    // ==========================================
    energyBolt(x, y) {
        this.ensureLoop();
        
        // 전기 구체 생성
        this.animations.push({
            x, y: y - 50,
            size: 0,
            maxSize: 25,
            alpha: 0,
            startTime: Date.now(),
            duration: 600,
            lightnings: [],
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                if (progress < 0.3) {
                    this.size = this.maxSize * (progress / 0.3);
                    this.alpha = progress / 0.3;
                } else if (progress < 0.7) {
                    this.alpha = 1;
                    // 미니 번개 생성
                    if (Math.random() < 0.3) {
                        const angle = Math.random() * Math.PI * 2;
                        this.lightnings.push({
                            angle,
                            length: 20 + Math.random() * 30,
                            life: 1
                        });
                    }
                } else {
                    this.alpha = 1 - (progress - 0.7) / 0.3;
                }
                
                // 번개 업데이트
                this.lightnings = this.lightnings.filter(l => {
                    l.life -= 0.1;
                    return l.life > 0;
                });
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.globalAlpha = this.alpha;
                
                // 글로우
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
                gradient.addColorStop(0, 'rgba(96, 165, 250, 0.5)');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // 코어
                const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
                coreGradient.addColorStop(0, '#ffffff');
                coreGradient.addColorStop(0.5, '#60a5fa');
                coreGradient.addColorStop(1, '#3b82f6');
                
                ctx.fillStyle = coreGradient;
                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 25;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 미니 번개
                ctx.strokeStyle = '#93c5fd';
                ctx.lineWidth = 2;
                this.lightnings.forEach(l => {
                    ctx.globalAlpha = this.alpha * l.life;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    
                    let px = 0, py = 0;
                    const segments = 4;
                    for (let i = 0; i < segments; i++) {
                        px += Math.cos(l.angle + (Math.random() - 0.5)) * (l.length / segments);
                        py += Math.sin(l.angle + (Math.random() - 0.5)) * (l.length / segments);
                        ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                });
                
                ctx.restore();
            }
        });
        
        // 전기 파티클
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 40;
                
                this.particles.push({
                    x: x + Math.cos(angle) * dist,
                    y: y - 50 + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: 2 + Math.random() * 2,
                    color: '#60a5fa',
                    alpha: 1,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.alpha -= 0.03;
                        if (this.alpha <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 6;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, Math.random() * 300);
        }
    },
    
    // ==========================================
    // 에너지 볼트 과부하 (Energy Bolt Overcharge)
    // 3개의 볼트가 폭발하며 모든 적에게 번개
    // ==========================================
    energyBoltOvercharge(boltPositions, targets) {
        this.ensureLoop();
        
        // 화면 중앙 플래시
        this.animations.push({
            alpha: 0,
            startTime: Date.now(),
            duration: 600,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                if (progress < 0.15) {
                    this.alpha = progress / 0.15;
                } else {
                    this.alpha = 1 - (progress - 0.15) / 0.85;
                }
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha * 0.4;
                const gradient = ctx.createRadialGradient(
                    ctx.canvas.width / 2, ctx.canvas.height / 2, 0,
                    ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width
                );
                gradient.addColorStop(0, '#93c5fd');
                gradient.addColorStop(0.3, '#3b82f6');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }
        });
        
        // 각 볼트에서 폭발
        boltPositions.forEach((pos, boltIndex) => {
            setTimeout(() => {
                // 충전 이펙트
                for (let i = 0; i < 3; i++) {
                    this.animations.push({
                        x: pos.x, y: pos.y,
                        radius: 0,
                        maxRadius: 60 + i * 20,
                        alpha: 1,
                        startTime: Date.now(),
                        duration: 300 + i * 100,
                        alive: true,
                        
                        update() {
                            const progress = (Date.now() - this.startTime) / this.duration;
                            this.radius = this.maxRadius * progress;
                            this.alpha = 1 - progress;
                            if (progress >= 1) this.alive = false;
                        },
                        
                        draw(ctx) {
                            ctx.save();
                            ctx.globalAlpha = this.alpha * 0.7;
                            ctx.strokeStyle = '#60a5fa';
                            ctx.lineWidth = 3;
                            ctx.shadowColor = '#3b82f6';
                            ctx.shadowBlur = 20;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                            ctx.stroke();
                            ctx.restore();
                        }
                    });
                }
                
                // 폭발 코어
                this.animations.push({
                    x: pos.x, y: pos.y,
                    size: 20,
                    maxSize: 80,
                    alpha: 1,
                    startTime: Date.now(),
                    duration: 400,
                    alive: true,
                    
                    update() {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        if (progress < 0.3) {
                            this.size = 20 + (this.maxSize - 20) * (progress / 0.3);
                            this.alpha = 1;
                        } else {
                            this.alpha = 1 - (progress - 0.3) / 0.7;
                        }
                        if (progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                        gradient.addColorStop(0, '#ffffff');
                        gradient.addColorStop(0.2, '#dbeafe');
                        gradient.addColorStop(0.5, '#60a5fa');
                        gradient.addColorStop(1, 'transparent');
                        ctx.fillStyle = gradient;
                        ctx.shadowColor = '#3b82f6';
                        ctx.shadowBlur = 40;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                
                // 볼트에서 모든 타겟으로 번개
                targets.forEach((target, tIndex) => {
                    setTimeout(() => {
                        this.chainLightning(pos.x, pos.y, target.x, target.y, '#60a5fa', 4);
                        
                        // 타겟 임팩트
                        setTimeout(() => {
                            this.animations.push({
                                x: target.x, y: target.y,
                                size: 30,
                                maxSize: 100,
                                alpha: 1,
                                startTime: Date.now(),
                                duration: 300,
                                alive: true,
                                
                                update() {
                                    const progress = (Date.now() - this.startTime) / this.duration;
                                    this.size = 30 + (this.maxSize - 30) * Math.pow(progress, 0.5);
                                    this.alpha = 1 - progress;
                                    if (progress >= 1) this.alive = false;
                                },
                                
                                draw(ctx) {
                                    ctx.save();
                                    ctx.globalAlpha = this.alpha * 0.8;
                                    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                                    gradient.addColorStop(0, '#ffffff');
                                    gradient.addColorStop(0.3, '#93c5fd');
                                    gradient.addColorStop(0.7, '#3b82f6');
                                    gradient.addColorStop(1, 'transparent');
                                    ctx.fillStyle = gradient;
                                    ctx.shadowColor = '#60a5fa';
                                    ctx.shadowBlur = 30;
                                    ctx.beginPath();
                                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.restore();
                                }
                            });
                        }, 100);
                    }, tIndex * 60);
                });
                
                // 전기 파티클 폭발
                for (let i = 0; i < 25; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 5 + Math.random() * 10;
                    this.particles.push({
                        x: pos.x,
                        y: pos.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 3 + Math.random() * 4,
                        color: Math.random() > 0.5 ? '#93c5fd' : '#60a5fa',
                        alpha: 1,
                        alive: true,
                        
                        update() {
                            this.x += this.vx;
                            this.y += this.vy;
                            this.vx *= 0.92;
                            this.vy *= 0.92;
                            this.alpha -= 0.025;
                            if (this.alpha <= 0) this.alive = false;
                        },
                        
                        draw(ctx) {
                            ctx.save();
                            ctx.globalAlpha = this.alpha;
                            ctx.fillStyle = this.color;
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 10;
                            ctx.beginPath();
                            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        }
                    });
                }
                this.ensureLoop();
            }, boltIndex * 180);
        });
    },
    
    // 체인 라이트닝 (구불구불한 번개)
    chainLightning(fromX, fromY, toX, toY, color = '#60a5fa', width = 3) {
        this.animations.push({
            fromX, fromY, toX, toY,
            color,
            width,
            alpha: 1,
            startTime: Date.now(),
            duration: 250,
            segments: [],
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                // 매 프레임 번개 모양 재생성
                if (progress < 0.8) {
                    this.segments = [];
                    let x = this.fromX, y = this.fromY;
                    const dx = this.toX - this.fromX;
                    const dy = this.toY - this.fromY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const segCount = Math.max(5, Math.floor(dist / 40));
                    
                    for (let i = 0; i <= segCount; i++) {
                        const t = i / segCount;
                        const baseX = this.fromX + dx * t;
                        const baseY = this.fromY + dy * t;
                        const offset = (i === 0 || i === segCount) ? 0 : (Math.random() - 0.5) * 50;
                        const perpX = -dy / dist * offset;
                        const perpY = dx / dist * offset;
                        this.segments.push({ x: baseX + perpX, y: baseY + perpY });
                    }
                }
                
                this.alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                if (this.segments.length < 2) return;
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.width;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.beginPath();
                ctx.moveTo(this.segments[0].x, this.segments[0].y);
                for (let i = 1; i < this.segments.length; i++) {
                    ctx.lineTo(this.segments[i].x, this.segments[i].y);
                }
                ctx.stroke();
                
                // 밝은 중심선
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = this.width * 0.4;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(this.segments[0].x, this.segments[0].y);
                for (let i = 1; i < this.segments.length; i++) {
                    ctx.lineTo(this.segments[i].x, this.segments[i].y);
                }
                ctx.stroke();
                
                ctx.restore();
            }
        });
        this.ensureLoop();
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    
    // 시전 원
    castCircle(x, y, color, size) {
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: size,
            alpha: 1,
            startTime: Date.now(),
            duration: 300,
            color,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.radius = this.maxRadius * (1 - Math.pow(1 - progress, 3));
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha * 0.6;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    }
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    MageVFX.init();
});

window.MageVFX = MageVFX;

console.log('[MageVFX] 마법사 이펙트 시스템 로드 완료');

