// ==========================================
// Spell VFX System
// 마법 영창 전용 이펙트 시스템 (다크소울 스타일)
// ==========================================

const SpellVFX = {
    canvas: null,
    ctx: null,
    particles: [],
    animations: [],
    isRunning: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        // 전용 캔버스 생성
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'spell-vfx-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        console.log('[SpellVFX] 마법 이펙트 시스템 초기화 완료');
    },
    
    resize() {
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
    
    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 파티클 업데이트
        this.particles = this.particles.filter(p => {
            if (!p.alive) return false;
            if (p.update) p.update();
            if (p.alive && p.draw) p.draw(this.ctx);
            return p.alive;
        });
        
        // 애니메이션 업데이트
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
    // 다크소울 스타일 캐스팅 연출
    // ==========================================
    castingAnimation(x, y, spell, callback) {
        this.ensureLoop();
        
        const duration = spell.effect === 'meteor' ? 2000 : 1200;
        const color = spell.color;
        
        // 1. 화면 어둡게
        this.screenDarken(spell.effect === 'meteor' ? 0.7 : 0.4, duration);
        
        // 2. 플레이어 주변 마법진
        this.magicCircle(x, y, color, duration);
        
        // 3. 룬 문자 회전
        this.floatingRunes(x, y, color, duration);
        
        // 4. 에너지 수렴
        this.energyConverge(x, y, color, duration * 0.6);
        
        // 5. 차징 이펙트
        setTimeout(() => {
            this.chargingBurst(x, y, color);
        }, duration * 0.5);
        
        // 6. 시전 완료 후 콜백
        setTimeout(() => {
            if (callback) callback();
        }, duration);
    },
    
    // ==========================================
    // 화면 어둡게
    // ==========================================
    screenDarken(intensity, duration) {
        const overlay = document.createElement('div');
        overlay.className = 'spell-darken-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0);
            z-index: 9998;
            pointer-events: none;
            transition: background ${duration * 0.3}ms ease;
        `;
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.style.background = `rgba(0, 0, 0, ${intensity})`;
        });
        
        setTimeout(() => {
            overlay.style.transition = `background ${duration * 0.3}ms ease`;
            overlay.style.background = 'rgba(0, 0, 0, 0)';
            setTimeout(() => overlay.remove(), duration * 0.3);
        }, duration * 0.7);
    },
    
    // ==========================================
    // 마법진 (다크소울 스타일)
    // ==========================================
    magicCircle(x, y, color, duration) {
        const circle = {
            x, y,
            innerRadius: 0,
            outerRadius: 0,
            maxRadius: 180,
            rotation: 0,
            runeRotation: 0,
            alpha: 0,
            startTime: Date.now(),
            duration,
            color,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min(1, elapsed / this.duration);
                
                // 등장 (0-0.2)
                if (progress < 0.2) {
                    const appear = progress / 0.2;
                    this.alpha = appear;
                    this.outerRadius = this.maxRadius * this.easeOutBack(appear);
                    this.innerRadius = this.maxRadius * 0.6 * this.easeOutBack(appear);
                }
                // 유지 (0.2-0.8)
                else if (progress < 0.8) {
                    this.alpha = 1;
                    this.outerRadius = this.maxRadius;
                    this.innerRadius = this.maxRadius * 0.6;
                }
                // 사라짐 (0.8-1.0)
                else {
                    const fade = (progress - 0.8) / 0.2;
                    this.alpha = 1 - fade;
                    this.outerRadius = this.maxRadius * (1 + fade * 0.5);
                }
                
                this.rotation += 0.01;
                this.runeRotation -= 0.02;
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.globalAlpha = this.alpha;
                
                // 외곽 원
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 30;
                
                ctx.beginPath();
                ctx.arc(0, 0, this.outerRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 내부 원
                ctx.beginPath();
                ctx.arc(0, 0, this.innerRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 회전하는 외곽 장식
                ctx.save();
                ctx.rotate(this.rotation);
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const px = Math.cos(angle) * this.outerRadius;
                    const py = Math.sin(angle) * this.outerRadius;
                    
                    // 작은 원
                    ctx.beginPath();
                    ctx.arc(px, py, 8, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    
                    // 연결선
                    const nextAngle = ((i + 1) / 8) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(Math.cos(nextAngle) * this.outerRadius, Math.sin(nextAngle) * this.outerRadius);
                    ctx.stroke();
                }
                ctx.restore();
                
                // 내부 룬 패턴
                ctx.save();
                ctx.rotate(this.runeRotation);
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const r = (this.innerRadius + this.outerRadius) / 2;
                    
                    ctx.save();
                    ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r);
                    ctx.rotate(angle + Math.PI / 2);
                    
                    // 룬 심볼 (삼각형 기반)
                    ctx.beginPath();
                    ctx.moveTo(0, -15);
                    ctx.lineTo(-10, 10);
                    ctx.lineTo(10, 10);
                    ctx.closePath();
                    ctx.stroke();
                    
                    ctx.restore();
                }
                ctx.restore();
                
                // 중앙 펜타그램
                ctx.save();
                ctx.rotate(this.rotation * 2);
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                    const nextI = (i + 2) % 5;
                    const nextAngle = (nextI / 5) * Math.PI * 2 - Math.PI / 2;
                    
                    ctx.moveTo(
                        Math.cos(angle) * this.innerRadius * 0.5,
                        Math.sin(angle) * this.innerRadius * 0.5
                    );
                    ctx.lineTo(
                        Math.cos(nextAngle) * this.innerRadius * 0.5,
                        Math.sin(nextAngle) * this.innerRadius * 0.5
                    );
                }
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
                
                // 내부 글로우
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.innerRadius);
                gradient.addColorStop(0, this.color + '40');
                gradient.addColorStop(0.5, this.color + '20');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.innerRadius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            },
            
            easeOutBack(t) {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            }
        };
        
        this.animations.push(circle);
    },
    
    // ==========================================
    // 부유하는 룬 문자
    // ==========================================
    floatingRunes(x, y, color, duration) {
        const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const baseRadius = 120 + Math.random() * 60;
            const rune = runes[Math.floor(Math.random() * runes.length)];
            
            this.particles.push({
                x, y,
                angle,
                radius: baseRadius,
                targetRadius: baseRadius,
                rune,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.05,
                bobOffset: Math.random() * Math.PI * 2,
                alpha: 0,
                color,
                startTime: Date.now(),
                duration,
                alive: true,
                
                update() {
                    const elapsed = Date.now() - this.startTime;
                    const progress = Math.min(1, elapsed / this.duration);
                    
                    // 알파
                    if (progress < 0.15) {
                        this.alpha = progress / 0.15;
                    } else if (progress > 0.7) {
                        this.alpha = 1 - (progress - 0.7) / 0.3;
                    } else {
                        this.alpha = 1;
                    }
                    
                    // 회전
                    this.angle += 0.008;
                    this.rotation += this.rotSpeed;
                    
                    // 상하 움직임
                    const bob = Math.sin(elapsed * 0.003 + this.bobOffset) * 15;
                    
                    // 수렴 (후반부)
                    if (progress > 0.5) {
                        const converge = (progress - 0.5) / 0.5;
                        this.radius = this.targetRadius * (1 - converge * 0.8);
                    }
                    
                    this.currentX = this.x + Math.cos(this.angle) * this.radius;
                    this.currentY = this.y + Math.sin(this.angle) * this.radius + bob;
                    
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.currentX, this.currentY);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha * 0.9;
                    
                    // 글로우
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 20;
                    
                    // 룬 문자
                    ctx.font = 'bold 28px serif';
                    ctx.fillStyle = this.color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(this.rune, 0, 0);
                    
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 에너지 수렴
    // ==========================================
    energyConverge(x, y, color, duration) {
        for (let i = 0; i < 40; i++) {
            const delay = Math.random() * duration * 0.5;
            
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = 200 + Math.random() * 150;
                const startX = x + Math.cos(angle) * distance;
                const startY = y + Math.sin(angle) * distance;
                
                this.particles.push({
                    x: startX,
                    y: startY,
                    targetX: x,
                    targetY: y,
                    speed: 0.02 + Math.random() * 0.02,
                    progress: 0,
                    size: 3 + Math.random() * 4,
                    color,
                    trail: [],
                    alive: true,
                    
                    update() {
                        this.progress += this.speed;
                        
                        // 곡선 경로
                        const t = this.easeInQuad(this.progress);
                        const midX = (this.x + this.targetX) / 2 + (Math.random() - 0.5) * 50;
                        const midY = (this.y + this.targetY) / 2 + (Math.random() - 0.5) * 50;
                        
                        // 베지어 곡선
                        const currentX = Math.pow(1 - t, 2) * this.x + 2 * (1 - t) * t * midX + Math.pow(t, 2) * this.targetX;
                        const currentY = Math.pow(1 - t, 2) * this.y + 2 * (1 - t) * t * midY + Math.pow(t, 2) * this.targetY;
                        
                        // 트레일
                        this.trail.unshift({ x: currentX, y: currentY, alpha: 1 });
                        if (this.trail.length > 10) this.trail.pop();
                        this.trail.forEach((t, i) => t.alpha = 1 - i / 10);
                        
                        this.currentX = currentX;
                        this.currentY = currentY;
                        
                        if (this.progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        // 트레일
                        this.trail.forEach((t, i) => {
                            ctx.save();
                            ctx.globalAlpha = t.alpha * 0.5;
                            ctx.fillStyle = this.color;
                            ctx.beginPath();
                            ctx.arc(t.x, t.y, this.size * (1 - i * 0.08), 0, Math.PI * 2);
                            ctx.fill();
                            ctx.restore();
                        });
                        
                        // 메인 파티클
                        ctx.save();
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = '#fff';
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        ctx.arc(this.currentX, this.currentY, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    },
                    
                    easeInQuad(t) {
                        return t * t;
                    }
                });
                
                this.ensureLoop();
            }, delay);
        }
    },
    
    // ==========================================
    // 차징 버스트
    // ==========================================
    chargingBurst(x, y, color) {
        // 중앙 플래시
        this.animations.push({
            x, y,
            size: 0,
            maxSize: 100,
            alpha: 1,
            startTime: Date.now(),
            duration: 400,
            color,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.size = this.maxSize * this.easeOutQuart(Math.min(1, progress));
                this.alpha = 1 - this.easeInQuad(Math.min(1, progress));
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, this.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            },
            
            easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); },
            easeInQuad(t) { return t * t; }
        });
        
        // 방사형 파티클
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 8,
                vy: Math.sin(angle) * 8,
                size: 4 + Math.random() * 3,
                color,
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.92;
                    this.vy *= 0.92;
                    this.alpha -= 0.03;
                    this.size *= 0.97;
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 마력 파동 (레벨 3)
    // ==========================================
    arcaneWave(targets) {
        this.ensureLoop();
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const color = '#60a5fa';
        
        // 플레이어 위치
        const playerEl = document.getElementById('player');
        const playerRect = playerEl ? playerEl.getBoundingClientRect() : { left: centerX - 50, top: centerY - 50, width: 100, height: 100 };
        const px = playerRect.left + playerRect.width / 2;
        const py = playerRect.top + playerRect.height / 2;
        
        // 다중 충격파
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.animations.push({
                    x: px,
                    y: py,
                    radius: 0,
                    maxRadius: 500,
                    lineWidth: 8 - i * 2,
                    color,
                    startTime: Date.now(),
                    duration: 600,
                    alive: true,
                    
                    update() {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        this.radius = this.maxRadius * this.easeOutQuart(Math.min(1, progress));
                        this.alpha = 1 - progress;
                        if (progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha * 0.8;
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = this.lineWidth * this.alpha;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 30;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    },
                    
                    easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
                });
                this.ensureLoop();
            }, i * 100);
        }
        
        // 마법 파티클
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 10;
            
            this.particles.push({
                x: px,
                y: py,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: Math.random() > 0.5 ? color : '#ffffff',
                alpha: 1,
                rotation: Math.random() * Math.PI * 2,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.96;
                    this.vy *= 0.96;
                    this.alpha -= 0.02;
                    this.rotation += 0.1;
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
                    
                    // 별 모양
                    ctx.beginPath();
                    for (let j = 0; j < 4; j++) {
                        const a = (j / 4) * Math.PI * 2;
                        ctx.lineTo(Math.cos(a) * this.size, Math.sin(a) * this.size);
                        ctx.lineTo(Math.cos(a + Math.PI / 4) * this.size * 0.4, Math.sin(a + Math.PI / 4) * this.size * 0.4);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
        
        // 화면 플래시
        this.screenFlash(color, 200);
    },
    
    // ==========================================
    // 화염 작렬 (레벨 5) - 고급 버전
    // ==========================================
    flameBurst(targets) {
        this.ensureLoop();
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const playerEl = document.getElementById('player');
        const playerRect = playerEl ? playerEl.getBoundingClientRect() : { left: centerX - 50, top: centerY - 50, width: 100, height: 100 };
        const px = playerRect.left + playerRect.width / 2;
        const py = playerRect.top + playerRect.height / 2;
        
        // 1. 화염 오라 확산 (바닥에서)
        this.fireAuraExpand(px, py);
        
        // 2. 메인 화염 기둥들 (다중)
        setTimeout(() => {
            this.flameColumnAdvanced(px, py);
            
            // 주변에 작은 화염 기둥들
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
                const dist = 80;
                setTimeout(() => {
                    this.flameColumnSmall(
                        px + Math.cos(angle) * dist,
                        py + Math.sin(angle) * dist
                    );
                }, i * 60);
            }
        }, 150);
        
        // 3. 화염 폭풍 회오리
        setTimeout(() => {
            this.fireVortex(px, py);
        }, 300);
        
        // 4. 각 타겟에 화염 폭발 (고급)
        if (targets && targets.length > 0) {
            targets.forEach((target, i) => {
                setTimeout(() => {
                    this.fireExplosionAdvanced(target.x, target.y);
                }, 400 + i * 120);
            });
        }
        
        // 5. 불티 (Ember) 파티클 - 대량
        this.spawnEmbers(px, py, 150);
        
        // 6. 열기 왜곡 오버레이
        this.heatDistortion(600);
        
        // 화면 효과
        this.screenFlash('#ff6b35', 200);
        setTimeout(() => this.screenFlash('#ffa500', 150), 200);
        this.screenShake(18, 500);
    },
    
    // 화염 오라 확산
    fireAuraExpand(x, y) {
        // 바닥에서 퍼지는 화염 링
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.animations.push({
                    x, y,
                    radius: 20,
                    maxRadius: 200 + i * 50,
                    alpha: 0.8,
                    startTime: Date.now(),
                    duration: 600,
                    ringIndex: i,
                    alive: true,
                    
                    update() {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        this.radius = 20 + (this.maxRadius - 20) * this.easeOutQuart(Math.min(1, progress));
                        this.alpha = 0.8 * (1 - progress);
                        if (progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        
                        // 그라데이션 링
                        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.7, this.x, this.y, this.radius);
                        gradient.addColorStop(0, 'transparent');
                        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${this.alpha * 0.3})`);
                        gradient.addColorStop(0.8, `rgba(255, 60, 0, ${this.alpha * 0.6})`);
                        gradient.addColorStop(1, `rgba(255, 200, 0, ${this.alpha})`);
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // 외곽선
                        ctx.strokeStyle = `rgba(255, 220, 100, ${this.alpha})`;
                        ctx.lineWidth = 3;
                        ctx.shadowColor = '#ff6b00';
                        ctx.shadowBlur = 20;
                        ctx.stroke();
                        
                        ctx.restore();
                    },
                    
                    easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
                });
                this.ensureLoop();
            }, i * 80);
        }
    },
    
    // 고급 화염 기둥
    flameColumnAdvanced(x, y) {
        this.animations.push({
            x, y,
            width: 0,
            maxWidth: 100,
            height: 0,
            maxHeight: 350,
            alpha: 0,
            innerFlames: [],
            startTime: Date.now(),
            duration: 1000,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                if (progress < 0.25) {
                    const p = progress / 0.25;
                    this.width = this.maxWidth * this.easeOutBack(p);
                    this.height = this.maxHeight * this.easeOutBack(p);
                    this.alpha = p;
                } else if (progress < 0.7) {
                    this.alpha = 1;
                    // 흔들림 효과
                    this.width = this.maxWidth * (1 + Math.sin(Date.now() * 0.02) * 0.1);
                } else {
                    const p = (progress - 0.7) / 0.3;
                    this.alpha = 1 - p;
                    this.height = this.maxHeight * (1 + p * 0.3);
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.globalAlpha = this.alpha;
                
                // 다층 화염
                for (let layer = 0; layer < 3; layer++) {
                    const layerWidth = this.width * (1 - layer * 0.2);
                    const colors = [
                        ['#ff4500', '#ff6b00', '#ffa500', '#ffcc00'],
                        ['#ff6b00', '#ff8800', '#ffbb00', '#ffee00'],
                        ['#ffaa00', '#ffcc00', '#ffee00', '#ffffff']
                    ][layer];
                    
                    const gradient = ctx.createLinearGradient(0, 0, 0, -this.height);
                    gradient.addColorStop(0, colors[0]);
                    gradient.addColorStop(0.3, colors[1]);
                    gradient.addColorStop(0.6, colors[2]);
                    gradient.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = gradient;
                    ctx.shadowColor = colors[0];
                    ctx.shadowBlur = 30 - layer * 10;
                    
                    // 불꽃 형태 (웨이브)
                    ctx.beginPath();
                    ctx.moveTo(-layerWidth / 2, 0);
                    
                    const segments = 20;
                    for (let i = 0; i <= segments; i++) {
                        const t = i / segments;
                        const h = -this.height * t;
                        const wave = Math.sin(t * Math.PI * 4 + Date.now() * 0.01 + layer) * 10 * (1 - t);
                        const taper = 1 - Math.pow(t, 0.5);
                        const xOffset = (layerWidth / 2) * taper + wave;
                        
                        if (i === 0) {
                            ctx.lineTo(-xOffset, h);
                        } else {
                            ctx.lineTo(-xOffset, h);
                        }
                    }
                    
                    for (let i = segments; i >= 0; i--) {
                        const t = i / segments;
                        const h = -this.height * t;
                        const wave = Math.sin(t * Math.PI * 4 + Date.now() * 0.01 + layer + Math.PI) * 10 * (1 - t);
                        const taper = 1 - Math.pow(t, 0.5);
                        const xOffset = (layerWidth / 2) * taper + wave;
                        ctx.lineTo(xOffset, h);
                    }
                    
                    ctx.closePath();
                    ctx.fill();
                }
                
                ctx.restore();
            },
            
            easeOutBack(t) {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            }
        });
    },
    
    // 작은 화염 기둥
    flameColumnSmall(x, y) {
        this.animations.push({
            x, y,
            width: 0,
            maxWidth: 50,
            height: 0,
            maxHeight: 180,
            alpha: 0,
            startTime: Date.now(),
            duration: 700,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                if (progress < 0.2) {
                    const p = progress / 0.2;
                    this.width = this.maxWidth * p;
                    this.height = this.maxHeight * p;
                    this.alpha = p;
                } else if (progress < 0.6) {
                    this.alpha = 1;
                } else {
                    const p = (progress - 0.6) / 0.4;
                    this.alpha = 1 - p;
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y - this.height);
                gradient.addColorStop(0, '#ff4500');
                gradient.addColorStop(0.4, '#ff8800');
                gradient.addColorStop(0.8, '#ffcc00');
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha * 0.8;
                ctx.fillStyle = gradient;
                ctx.shadowColor = '#ff4500';
                ctx.shadowBlur = 25;
                
                ctx.beginPath();
                ctx.moveTo(this.x - this.width / 2, this.y);
                ctx.quadraticCurveTo(this.x - this.width / 3, this.y - this.height / 2, this.x, this.y - this.height);
                ctx.quadraticCurveTo(this.x + this.width / 3, this.y - this.height / 2, this.x + this.width / 2, this.y);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        });
    },
    
    // 화염 회오리
    fireVortex(x, y) {
        for (let i = 0; i < 30; i++) {
            const delay = i * 15;
            setTimeout(() => {
                const startAngle = (i / 30) * Math.PI * 4;
                
                this.particles.push({
                    x, y,
                    angle: startAngle,
                    radius: 10,
                    maxRadius: 150,
                    height: 0,
                    maxHeight: 200,
                    size: 8 + Math.random() * 12,
                    progress: 0,
                    speed: 0.025 + Math.random() * 0.01,
                    rotSpeed: 0.15 + Math.random() * 0.05,
                    color: ['#ff4500', '#ff6b00', '#ffa500', '#ffcc00'][Math.floor(Math.random() * 4)],
                    alive: true,
                    
                    update() {
                        this.progress += this.speed;
                        this.angle += this.rotSpeed;
                        
                        const p = Math.min(1, this.progress);
                        this.radius = this.maxRadius * (1 - Math.pow(1 - p, 2)) * (1 - p * 0.5);
                        this.height = this.maxHeight * p;
                        
                        this.currentX = this.x + Math.cos(this.angle) * this.radius;
                        this.currentY = this.y - this.height + Math.sin(this.angle * 0.5) * 20;
                        
                        if (this.progress >= 1.2) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const alpha = Math.max(0, 1 - this.progress);
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        ctx.arc(this.currentX, this.currentY, this.size * (1 - this.progress * 0.5), 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, delay);
        }
    },
    
    // 고급 화염 폭발
    fireExplosionAdvanced(x, y) {
        // 중심 폭발
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: 120,
            startTime: Date.now(),
            duration: 450,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.radius = this.maxRadius * (1 - Math.pow(1 - progress, 3));
                this.alpha = (1 - progress) * 0.9;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                // 다중 레이어 폭발
                for (let i = 0; i < 3; i++) {
                    const r = this.radius * (1 - i * 0.2);
                    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
                    gradient.addColorStop(0, '#ffffff');
                    gradient.addColorStop(0.2, '#ffee00');
                    gradient.addColorStop(0.5, '#ff8800');
                    gradient.addColorStop(0.8, '#ff4500');
                    gradient.addColorStop(1, 'transparent');
                    
                    ctx.save();
                    ctx.globalAlpha = this.alpha * (1 - i * 0.2);
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        });
        
        // 화염 스파이크 (방사형)
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.animations.push({
                x, y,
                angle,
                length: 0,
                maxLength: 80 + Math.random() * 40,
                width: 15 + Math.random() * 10,
                startTime: Date.now(),
                duration: 350,
                alive: true,
                
                update() {
                    const progress = (Date.now() - this.startTime) / this.duration;
                    this.length = this.maxLength * Math.min(1, progress * 2);
                    this.alpha = 1 - progress;
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    const endX = this.x + Math.cos(this.angle) * this.length;
                    const endY = this.y + Math.sin(this.angle) * this.length;
                    
                    const gradient = ctx.createLinearGradient(this.x, this.y, endX, endY);
                    gradient.addColorStop(0, '#ffee00');
                    gradient.addColorStop(0.5, '#ff6b00');
                    gradient.addColorStop(1, 'transparent');
                    
                    ctx.save();
                    ctx.globalAlpha = this.alpha;
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = this.width * this.alpha;
                    ctx.lineCap = 'round';
                    ctx.shadowColor = '#ff4500';
                    ctx.shadowBlur = 20;
                    
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }
        
        // 불씨 파편
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 10;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                size: 3 + Math.random() * 6,
                color: ['#ff4500', '#ff8800', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 4)],
                alpha: 1,
                gravity: 0.12 + Math.random() * 0.08,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += this.gravity;
                    this.vx *= 0.98;
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
    },
    
    // 불티 (Ember) 스폰
    spawnEmbers(x, y, count) {
        for (let i = 0; i < count; i++) {
            const delay = Math.random() * 500;
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 120;
                
                this.particles.push({
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 8 - 3,
                    size: 2 + Math.random() * 4,
                    color: Math.random() > 0.3 ? '#ff6b00' : '#ffcc00',
                    alpha: 1,
                    flicker: Math.random() * Math.PI * 2,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vy += 0.02;
                        this.vx *= 0.99;
                        this.flicker += 0.3;
                        this.alpha -= 0.012;
                        if (this.alpha <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const flickerAlpha = this.alpha * (0.7 + Math.sin(this.flicker) * 0.3);
                        ctx.save();
                        ctx.globalAlpha = flickerAlpha;
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
    },
    
    // 열기 왜곡 효과
    heatDistortion(duration) {
        const overlay = document.createElement('div');
        overlay.className = 'heat-distortion-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(to top, 
                rgba(255, 100, 0, 0.15) 0%, 
                rgba(255, 150, 50, 0.1) 30%,
                transparent 60%);
            z-index: 9999;
            pointer-events: none;
            animation: heatWave ${duration}ms ease-out forwards;
        `;
        document.body.appendChild(overlay);
        
        // 열기 파동 CSS
        if (!document.getElementById('heat-wave-style')) {
            const style = document.createElement('style');
            style.id = 'heat-wave-style';
            style.textContent = `
                @keyframes heatWave {
                    0% { opacity: 1; filter: blur(0px); }
                    50% { opacity: 0.8; filter: blur(1px); }
                    100% { opacity: 0; filter: blur(0px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => overlay.remove(), duration);
    },
    
    // 화염 기둥
    flameColumn(x, y) {
        this.animations.push({
            x, y,
            width: 0,
            maxWidth: 120,
            height: 0,
            maxHeight: 400,
            alpha: 0,
            startTime: Date.now(),
            duration: 800,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                if (progress < 0.3) {
                    const p = progress / 0.3;
                    this.width = this.maxWidth * this.easeOutBack(p);
                    this.height = this.maxHeight * this.easeOutBack(p);
                    this.alpha = p;
                } else if (progress < 0.7) {
                    this.alpha = 1;
                } else {
                    const p = (progress - 0.7) / 0.3;
                    this.alpha = 1 - p;
                    this.height = this.maxHeight * (1 + p * 0.3);
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y - this.height);
                gradient.addColorStop(0, '#ff4500');
                gradient.addColorStop(0.3, '#ff6b35');
                gradient.addColorStop(0.6, '#ffa500');
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha * 0.8;
                ctx.fillStyle = gradient;
                ctx.shadowColor = '#ff4500';
                ctx.shadowBlur = 40;
                
                // 불꽃 형태
                ctx.beginPath();
                ctx.moveTo(this.x - this.width / 2, this.y);
                ctx.quadraticCurveTo(this.x - this.width / 3, this.y - this.height / 2, this.x, this.y - this.height);
                ctx.quadraticCurveTo(this.x + this.width / 3, this.y - this.height / 2, this.x + this.width / 2, this.y);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            },
            
            easeOutBack(t) {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            }
        });
    },
    
    // 화염 폭발
    fireExplosion(x, y) {
        // 폭발 중심
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: 100,
            startTime: Date.now(),
            duration: 400,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.radius = this.maxRadius * (1 - Math.pow(1 - progress, 3));
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.2, '#ffcc00');
                gradient.addColorStop(0.5, '#ff6b35');
                gradient.addColorStop(1, 'transparent');
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        
        // 불꽃 파편
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 4 + Math.random() * 6,
                color: ['#ff4500', '#ffa500', '#ffcc00'][Math.floor(Math.random() * 3)],
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.15;
                    this.alpha -= 0.03;
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
    },
    
    // ==========================================
    // 절대영도 (레벨 7)
    // ==========================================
    frostNova(targets) {
        this.ensureLoop();
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const color = '#22d3ee';
        
        const playerEl = document.getElementById('player');
        const playerRect = playerEl ? playerEl.getBoundingClientRect() : { left: centerX - 50, top: centerY - 50, width: 100, height: 100 };
        const px = playerRect.left + playerRect.width / 2;
        const py = playerRect.top + playerRect.height / 2;
        
        // 빙결 파동
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.iceWave(px, py, i);
            }, i * 150);
        }
        
        // 얼음 결정
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 150 + Math.random() * 100;
            
            setTimeout(() => {
                this.iceCrystal(
                    px + Math.cos(angle) * distance,
                    py + Math.sin(angle) * distance
                );
            }, 200 + Math.random() * 300);
        }
        
        // 눈송이 파티클
        for (let i = 0; i < 80; i++) {
            setTimeout(() => {
                this.particles.push({
                    x: px + (Math.random() - 0.5) * 400,
                    y: py + (Math.random() - 0.5) * 400,
                    vx: (Math.random() - 0.5) * 3,
                    vy: Math.random() * 2,
                    size: 2 + Math.random() * 4,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.1,
                    color: Math.random() > 0.3 ? color : '#ffffff',
                    alpha: 1,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.rotation += this.rotSpeed;
                        this.alpha -= 0.015;
                        if (this.alpha <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.globalAlpha = this.alpha;
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 1.5;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 8;
                        
                        // 눈송이 패턴
                        for (let j = 0; j < 6; j++) {
                            ctx.save();
                            ctx.rotate((j / 6) * Math.PI * 2);
                            ctx.beginPath();
                            ctx.moveTo(0, 0);
                            ctx.lineTo(0, -this.size);
                            ctx.moveTo(0, -this.size * 0.5);
                            ctx.lineTo(-this.size * 0.3, -this.size * 0.7);
                            ctx.moveTo(0, -this.size * 0.5);
                            ctx.lineTo(this.size * 0.3, -this.size * 0.7);
                            ctx.stroke();
                            ctx.restore();
                        }
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, Math.random() * 500);
        }
        
        // 화면 효과
        this.screenFlash('#67e8f9', 250);
        this.screenShake(12, 350);
        this.frostOverlay();
    },
    
    // 빙결 파동
    iceWave(x, y, index) {
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: 400 + index * 50,
            segments: 12,
            rotation: index * Math.PI / 6,
            startTime: Date.now(),
            duration: 700,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                this.radius = this.maxRadius * (1 - Math.pow(1 - progress, 3));
                this.alpha = (1 - progress) * 0.8;
                this.rotation += 0.02;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 25;
                
                // 다각형 파동
                ctx.beginPath();
                for (let i = 0; i <= this.segments; i++) {
                    const angle = (i / this.segments) * Math.PI * 2;
                    const r = this.radius * (1 + Math.sin(angle * 3) * 0.1);
                    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                }
                ctx.stroke();
                
                ctx.restore();
            }
        });
    },
    
    // 얼음 결정
    iceCrystal(x, y) {
        this.animations.push({
            x, y,
            size: 0,
            maxSize: 40 + Math.random() * 30,
            rotation: Math.random() * Math.PI / 4,
            alpha: 0,
            startTime: Date.now(),
            duration: 1200,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                
                if (progress < 0.2) {
                    const p = progress / 0.2;
                    this.size = this.maxSize * this.easeOutBack(p);
                    this.alpha = p;
                } else if (progress < 0.7) {
                    this.alpha = 1;
                } else {
                    this.alpha = 1 - (progress - 0.7) / 0.3;
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.alpha;
                
                // 얼음 결정 그라데이션
                const gradient = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.5, '#67e8f9');
                gradient.addColorStop(1, '#22d3ee');
                
                ctx.fillStyle = gradient;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#22d3ee';
                ctx.shadowBlur = 20;
                
                // 육각형 결정
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    const px = Math.cos(angle) * this.size;
                    const py = Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // 내부 패턴
                ctx.globalAlpha = this.alpha * 0.5;
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * this.size * 0.7, Math.sin(angle) * this.size * 0.7);
                    ctx.stroke();
                }
                
                ctx.restore();
            },
            
            easeOutBack(t) {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            }
        });
    },
    
    // 서리 오버레이
    frostOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, transparent 30%, rgba(103, 232, 249, 0.3) 100%);
            pointer-events: none;
            z-index: 9999;
            animation: frostFade 1.5s ease-out forwards;
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 1500);
    },
    
    // ==========================================
    // 메테오 (레벨 10) - 최고급 연출
    // ==========================================
    meteorStrike(targets) {
        this.ensureLoop();
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 1. 하늘 어둡게 + 붉은 빛
        this.apocalypseOverlay();
        
        // 2. 경고 마법진
        setTimeout(() => {
            this.warningCircle(centerX, centerY + 100);
        }, 500);
        
        // 3. 메테오 낙하
        setTimeout(() => {
            this.fallingMeteor(centerX, centerY + 100);
        }, 1500);
        
        // 4. 대폭발
        setTimeout(() => {
            this.megaExplosion(centerX, centerY + 100);
            this.screenShake(30, 800);
        }, 2200);
    },
    
    // 종말 오버레이
    apocalypseOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'meteor-apocalypse-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(50,0,0,0.6) 50%, rgba(100,30,0,0.4) 100%);
            z-index: 9997;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => overlay.style.opacity = '1');
        
        setTimeout(() => {
            overlay.style.transition = 'opacity 1s ease';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 1000);
        }, 2500);
    },
    
    // 경고 마법진
    warningCircle(x, y) {
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: 200,
            rotation: 0,
            alpha: 0,
            flash: 0,
            startTime: Date.now(),
            duration: 1200,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                if (progress < 0.3) {
                    this.radius = this.maxRadius * (progress / 0.3);
                    this.alpha = progress / 0.3;
                } else {
                    this.alpha = 1;
                    // 깜빡임
                    this.flash = Math.sin(elapsed * 0.02) * 0.3 + 0.7;
                }
                
                this.rotation += 0.03;
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.globalAlpha = this.alpha * this.flash;
                
                // 빨간 경고 원
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 30;
                
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 내부 X 표시
                ctx.save();
                ctx.rotate(this.rotation);
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.7, -this.radius * 0.7);
                ctx.lineTo(this.radius * 0.7, this.radius * 0.7);
                ctx.moveTo(this.radius * 0.7, -this.radius * 0.7);
                ctx.lineTo(-this.radius * 0.7, this.radius * 0.7);
                ctx.stroke();
                ctx.restore();
                
                // 경고 삼각형
                ctx.save();
                ctx.rotate(-this.rotation * 0.5);
                ctx.beginPath();
                ctx.moveTo(0, -this.radius * 0.5);
                ctx.lineTo(-this.radius * 0.4, this.radius * 0.3);
                ctx.lineTo(this.radius * 0.4, this.radius * 0.3);
                ctx.closePath();
                ctx.stroke();
                
                // 느낌표
                ctx.fillStyle = '#ef4444';
                ctx.font = `bold ${this.radius * 0.4}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('!', 0, 0);
                ctx.restore();
                
                ctx.restore();
            }
        });
    },
    
    // 메테오 낙하
    fallingMeteor(targetX, targetY) {
        const startX = targetX + 300;
        const startY = -200;
        
        this.animations.push({
            x: startX,
            y: startY,
            targetX,
            targetY,
            size: 80,
            rotation: 0,
            trail: [],
            startTime: Date.now(),
            duration: 700,
            alive: true,
            
            update() {
                const progress = (Date.now() - this.startTime) / this.duration;
                const eased = this.easeInQuad(Math.min(1, progress));
                
                this.x = this.startX + (this.targetX - this.startX) * eased;
                this.y = this.startY + (this.targetY - this.startY) * eased;
                this.rotation += 0.15;
                
                // 트레일
                this.trail.unshift({ x: this.x, y: this.y, size: this.size, alpha: 1 });
                if (this.trail.length > 20) this.trail.pop();
                this.trail.forEach((t, i) => {
                    t.alpha = 1 - i / 20;
                    t.size = this.size * (1 - i * 0.03);
                });
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                // 트레일
                this.trail.forEach((t, i) => {
                    if (i === 0) return;
                    const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.size);
                    gradient.addColorStop(0, `rgba(255, 200, 100, ${t.alpha * 0.5})`);
                    gradient.addColorStop(0.5, `rgba(255, 100, 50, ${t.alpha * 0.3})`);
                    gradient.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, t.size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                // 메테오 본체
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                // 외곽 글로우
                const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
                glow.addColorStop(0, '#fbbf24');
                glow.addColorStop(0.3, '#f97316');
                glow.addColorStop(0.6, '#ef4444');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // 코어
                const core = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
                core.addColorStop(0, '#ffffff');
                core.addColorStop(0.3, '#fbbf24');
                core.addColorStop(0.7, '#dc2626');
                core.addColorStop(1, '#7f1d1d');
                ctx.fillStyle = core;
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 50;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 크레이터 무늬
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const dist = this.size * 0.5;
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, this.size * 0.15, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            },
            
            easeInQuad(t) { return t * t; },
            startX, startY
        });
        
        // 낙하 중 파편
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const progress = i / 30;
                const x = startX + (targetX - startX) * progress;
                const y = startY + (targetY - startY) * progress;
                
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 60,
                    y: y + (Math.random() - 0.5) * 60,
                    vx: (Math.random() - 0.5) * 5,
                    vy: Math.random() * 3,
                    size: 3 + Math.random() * 5,
                    color: ['#fbbf24', '#f97316', '#ef4444'][Math.floor(Math.random() * 3)],
                    alpha: 1,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vy += 0.1;
                        this.alpha -= 0.03;
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
                this.ensureLoop();
            }, i * 20);
        }
    },
    
    // 대폭발
    megaExplosion(x, y) {
        // 중심 플래시
        this.screenFlash('#ffffff', 150);
        
        // 폭발파
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.animations.push({
                    x, y,
                    radius: 0,
                    maxRadius: 500 + i * 100,
                    lineWidth: 10 - i * 2,
                    color: ['#ffffff', '#fbbf24', '#f97316', '#ef4444'][i],
                    startTime: Date.now(),
                    duration: 600 + i * 100,
                    alive: true,
                    
                    update() {
                        const progress = (Date.now() - this.startTime) / this.duration;
                        this.radius = this.maxRadius * (1 - Math.pow(1 - progress, 3));
                        this.alpha = (1 - progress) * 0.9;
                        if (progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = this.lineWidth * this.alpha;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 40;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, i * 80);
        }
        
        // 화염 파티클 대량
        for (let i = 0; i < 150; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const speed = 5 + Math.random() * 15;
                
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - Math.random() * 5,
                    size: 5 + Math.random() * 15,
                    color: ['#ffffff', '#fbbf24', '#f97316', '#ef4444', '#7f1d1d'][Math.floor(Math.random() * 5)],
                    alpha: 1,
                    gravity: 0.1 + Math.random() * 0.2,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vy += this.gravity;
                        this.vx *= 0.98;
                        this.alpha -= 0.015;
                        this.size *= 0.99;
                        if (this.alpha <= 0 || this.size < 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        ctx.save();
                        ctx.globalAlpha = this.alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, Math.random() * 200);
        }
        
        // 암석 파편
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 12;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3,
                size: 10 + Math.random() * 20,
                alpha: 1,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.3;
                    this.vx *= 0.99;
                    this.rotation += this.rotSpeed;
                    this.alpha -= 0.01;
                    if (this.alpha <= 0 || this.y > window.innerHeight + 100) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha;
                    
                    // 암석 그라데이션
                    const gradient = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
                    gradient.addColorStop(0, '#4a4a4a');
                    gradient.addColorStop(0.5, '#2a2a2a');
                    gradient.addColorStop(1, '#1a1a1a');
                    
                    ctx.fillStyle = gradient;
                    ctx.shadowColor = '#f97316';
                    ctx.shadowBlur = 10;
                    
                    // 불규칙한 다각형
                    ctx.beginPath();
                    const points = 6;
                    for (let j = 0; j <= points; j++) {
                        const a = (j / points) * Math.PI * 2;
                        const r = this.size * (0.7 + Math.random() * 0.3);
                        if (j === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                    }
                    ctx.fill();
                    
                    // 뜨거운 테두리
                    ctx.strokeStyle = '#f97316';
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = this.alpha * 0.5;
                    ctx.stroke();
                    
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    screenFlash(color, duration) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: ${color};
            z-index: 10001;
            pointer-events: none;
            opacity: 0.8;
            animation: flashOut ${duration}ms ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), duration);
    },
    
    screenShake(intensity, duration) {
        const gameArea = document.querySelector('.game-area') || document.body;
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                gameArea.style.transform = '';
                return;
            }
            
            const progress = elapsed / duration;
            const decay = 1 - progress;
            const x = (Math.random() - 0.5) * intensity * decay;
            const y = (Math.random() - 0.5) * intensity * decay;
            
            gameArea.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        };
        
        shake();
    }
};

// CSS 애니메이션 주입
const spellVFXStyles = document.createElement('style');
spellVFXStyles.textContent = `
    @keyframes flashOut {
        0% { opacity: 0.8; }
        100% { opacity: 0; }
    }
    
    @keyframes frostFade {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(spellVFXStyles);

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    SpellVFX.init();
});

// 전역 등록
window.SpellVFX = SpellVFX;

console.log('[SpellVFX] 마법 이펙트 시스템 로드 완료');

