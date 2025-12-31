// ==========================================
// 필드 VFX 시스템 (Field Visual Effects)
// 필드 효과에 따른 시각적 이펙트
// ==========================================

const FieldVFX = {
    activeEffects: {},
    
    // 활성 효과 수에 따른 투명도 계산
    getOpacityMultiplier() {
        const count = Object.keys(this.activeEffects).length;
        if (count <= 1) return 1;
        if (count === 2) return 0.6;
        return 0.45; // 3개 이상
    },
    
    // 모든 활성 VFX 투명도 업데이트
    updateAllOpacity() {
        const multiplier = this.getOpacityMultiplier();
        Object.keys(this.activeEffects).forEach(id => {
            const effect = this[id];
            if (effect && effect.canvas) {
                effect.canvas.style.opacity = multiplier;
            }
            if (effect && effect.overlay) {
                effect.overlay.style.opacity = multiplier * 0.8;
            }
            if (effect && effect.vignette) {
                effect.vignette.style.opacity = multiplier * 0.7;
            }
        });
    },
    
    // 전투 영역 가져오기
    getBattleArea() {
        return document.querySelector('.battle-area');
    },
    
    // 전투 영역 위치/크기 가져오기
    getBattleRect() {
        const battleArea = this.getBattleArea();
        if (!battleArea) {
            // 기본값
            return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight * 0.6 };
        }
        return battleArea.getBoundingClientRect();
    },
    
    // ==========================================
    // 안개 효과 (Fog Effect)
    // ==========================================
    fog: {
        particles: [],
        canvas: null,
        ctx: null,
        running: false,
        overlay: null,
        
        start() {
            if (this.running) return;
            this.running = true;
            
            console.log('[FieldVFX] 안개 효과 시작 시도...');
            
            const rect = FieldVFX.getBattleRect();
            console.log('[FieldVFX] 전투 영역:', rect);
            
            // 캔버스 생성 - body에 직접 추가
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'fog-vfx-canvas';
            this.canvas.width = rect.width || 800;
            this.canvas.height = rect.height || 400;
            this.canvas.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                pointer-events: none;
                z-index: 100;
                opacity: 0;
                transition: opacity 1s ease-in;
            `;
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            
            console.log('[FieldVFX] 캔버스 생성됨:', this.canvas.width, 'x', this.canvas.height);
            
            // 페이드인
            setTimeout(() => {
                if (this.canvas) {
                    this.canvas.style.opacity = '1';
                    console.log('[FieldVFX] 캔버스 페이드인');
                }
            }, 50);
            
            // 안개 파티클 초기화
            this.initParticles();
            
            // 애니메이션 시작
            this.animate();
            
            // 오버레이 추가
            this.addOverlay(rect);
            
            console.log('[FieldVFX] 안개 효과 시작 완료');
        },
        
        stop() {
            if (!this.running) return;
            this.running = false;
            
            // 페이드아웃
            if (this.canvas) {
                this.canvas.style.opacity = '0';
                const canvasRef = this.canvas;
                setTimeout(() => {
                    canvasRef?.remove();
                }, 1000);
                this.canvas = null;
                this.ctx = null;
            }
            
            // 오버레이 제거
            if (this.overlay) {
                this.overlay.style.opacity = '0';
                const overlayRef = this.overlay;
                setTimeout(() => {
                    overlayRef?.remove();
                }, 1000);
                this.overlay = null;
            }
            
            this.particles = [];
            console.log('[FieldVFX] 안개 효과 종료');
        },
        
        initParticles() {
            this.particles = [];
            const count = 35;
            const width = this.canvas?.width || 800;
            const height = this.canvas?.height || 400;
            
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: 100 + Math.random() * 150,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.15,
                    opacity: 0.08 + Math.random() * 0.12,
                    pulseSpeed: 0.002 + Math.random() * 0.003,
                    pulsePhase: Math.random() * Math.PI * 2
                });
            }
        },
        
        animate() {
            if (!this.running || !this.ctx || !this.canvas) return;
            
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;
            
            // 클리어
            ctx.clearRect(0, 0, width, height);
            
            // 배경 안개 레이어 (약하게)
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(180, 190, 200, 0.08)');
            gradient.addColorStop(0.5, 'rgba(160, 175, 190, 0.12)');
            gradient.addColorStop(1, 'rgba(180, 190, 200, 0.08)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // 안개 파티클 그리기
            this.particles.forEach(p => {
                // 펄스 효과
                p.pulsePhase += p.pulseSpeed;
                const pulseFactor = 0.85 + Math.sin(p.pulsePhase) * 0.15;
                
                // 이동
                p.x += p.speedX;
                p.y += p.speedY;
                
                // 화면 밖으로 나가면 반대편에서 등장
                if (p.x < -p.radius) p.x = width + p.radius;
                if (p.x > width + p.radius) p.x = -p.radius;
                if (p.y < -p.radius) p.y = height + p.radius;
                if (p.y > height + p.radius) p.y = -p.radius;
                
                // 그라디언트 원 그리기 (더 투명하게)
                const grd = ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, p.radius * pulseFactor
                );
                grd.addColorStop(0, `rgba(200, 210, 220, ${p.opacity * pulseFactor})`);
                grd.addColorStop(0.5, `rgba(190, 200, 210, ${p.opacity * 0.4 * pulseFactor})`);
                grd.addColorStop(1, 'rgba(180, 190, 200, 0)');
                
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * pulseFactor, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // 물결치는 안개 효과 (사인파) - 약하게
            const time = Date.now() * 0.0008;
            ctx.fillStyle = 'rgba(200, 210, 220, 0.03)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(0, height);
                for (let x = 0; x <= width; x += 10) {
                    const y = height * 0.55 + 
                              Math.sin(x * 0.006 + time + i * 0.5) * 35 +
                              Math.sin(x * 0.012 + time * 1.3 + i) * 25;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(width, height);
                ctx.closePath();
                ctx.fill();
            }
            
            // 🌫️ 가장자리 페이드아웃 (절단면 부드럽게)
            const edgeFade = 180; // 페이드 두께 (더 넓게)
            
            // 상단 페이드
            const topGrad = ctx.createLinearGradient(0, 0, 0, edgeFade);
            topGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, width, edgeFade);
            
            // 하단 페이드
            const bottomGrad = ctx.createLinearGradient(0, height - edgeFade, 0, height);
            bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
            ctx.fillStyle = bottomGrad;
            ctx.fillRect(0, height - edgeFade, width, edgeFade);
            
            // 좌측 페이드
            const leftGrad = ctx.createLinearGradient(0, 0, edgeFade, 0);
            leftGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            leftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = leftGrad;
            ctx.fillRect(0, 0, edgeFade, height);
            
            // 우측 페이드
            const rightGrad = ctx.createLinearGradient(width - edgeFade, 0, width, 0);
            rightGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            rightGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
            ctx.fillStyle = rightGrad;
            ctx.fillRect(width - edgeFade, 0, edgeFade, height);
            
            ctx.globalCompositeOperation = 'source-over';
            
            requestAnimationFrame(() => this.animate());
        },
        
        addOverlay(rect) {
            // CSS 오버레이 효과
            this.overlay = document.createElement('div');
            this.overlay.id = 'fog-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                pointer-events: none;
                z-index: 99;
                background: 
                    radial-gradient(ellipse at 20% 80%, rgba(200, 210, 220, 0.12) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 60%, rgba(180, 195, 210, 0.1) 0%, transparent 45%),
                    radial-gradient(ellipse at 50% 100%, rgba(190, 205, 220, 0.15) 0%, transparent 55%);
                opacity: 0;
                transition: opacity 1.5s ease-in;
                animation: fogSway 6s ease-in-out infinite;
                mask-image: radial-gradient(ellipse 80% 75% at center, black 40%, transparent 100%);
                -webkit-mask-image: radial-gradient(ellipse 80% 75% at center, black 40%, transparent 100%);
            `;
            document.body.appendChild(this.overlay);
            
            // 페이드인
            setTimeout(() => {
                if (this.overlay) this.overlay.style.opacity = '1';
            }, 100);
        },
        
        // 윈도우 리사이즈 시 위치 업데이트
        updatePosition() {
            const rect = FieldVFX.getBattleRect();
            if (this.canvas) {
                this.canvas.style.left = `${rect.left}px`;
                this.canvas.style.top = `${rect.top}px`;
                this.canvas.style.width = `${rect.width}px`;
                this.canvas.style.height = `${rect.height}px`;
            }
            if (this.overlay) {
                this.overlay.style.left = `${rect.left}px`;
                this.overlay.style.top = `${rect.top}px`;
                this.overlay.style.width = `${rect.width}px`;
                this.overlay.style.height = `${rect.height}px`;
            }
        }
    },
    
    // ==========================================
    // 폭풍 효과 (Storm Effect)
    // ==========================================
    storm: {
        canvas: null,
        ctx: null,
        running: false,
        raindrops: [],
        lightning: { active: false, timer: 0 },
        
        start() {
            if (this.running) return;
            this.running = true;
            
            const rect = FieldVFX.getBattleRect();
            
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'storm-vfx-canvas';
            this.canvas.width = rect.width || 800;
            this.canvas.height = rect.height || 400;
            this.canvas.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                pointer-events: none;
                z-index: 100;
                opacity: 0;
                transition: opacity 0.5s ease-in;
            `;
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            
            setTimeout(() => {
                if (this.canvas) this.canvas.style.opacity = '1';
            }, 50);
            
            this.initRain();
            this.animate();
            
            console.log('[FieldVFX] 폭풍 효과 시작');
        },
        
        stop() {
            if (!this.running) return;
            this.running = false;
            
            if (this.canvas) {
                this.canvas.style.opacity = '0';
                const ref = this.canvas;
                setTimeout(() => ref?.remove(), 500);
                this.canvas = null;
                this.ctx = null;
            }
            
            this.raindrops = [];
            console.log('[FieldVFX] 폭풍 효과 종료');
        },
        
        initRain() {
            this.raindrops = [];
            const width = this.canvas?.width || 800;
            const height = this.canvas?.height || 400;
            
            for (let i = 0; i < 120; i++) {
                this.raindrops.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    length: 10 + Math.random() * 15,
                    speed: 12 + Math.random() * 8,
                    opacity: 0.15 + Math.random() * 0.25
                });
            }
        },
        
        animate() {
            if (!this.running || !this.ctx || !this.canvas) return;
            
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;
            
            // 클리어 (투명 배경)
            ctx.clearRect(0, 0, width, height);
            
            // 약한 어두운 오버레이 (상단만)
            const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
            darkGrad.addColorStop(0, 'rgba(20, 30, 50, 0.15)');
            darkGrad.addColorStop(0.5, 'rgba(20, 30, 50, 0.08)');
            darkGrad.addColorStop(1, 'rgba(20, 30, 50, 0)');
            ctx.fillStyle = darkGrad;
            ctx.fillRect(0, 0, width, height);
            
            // 비 그리기
            ctx.strokeStyle = 'rgba(150, 180, 220, 0.5)';
            ctx.lineWidth = 1;
            
            this.raindrops.forEach(drop => {
                ctx.globalAlpha = drop.opacity;
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x - 3, drop.y + drop.length);
                ctx.stroke();
                
                drop.y += drop.speed;
                drop.x -= 3;
                
                if (drop.y > height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * width;
                }
            });
            
            ctx.globalAlpha = 1;
            
            // 번개 효과 (랜덤) - 약하게
            this.lightning.timer++;
            if (this.lightning.timer > 120 && Math.random() < 0.01) {
                this.lightning.active = true;
                this.lightning.timer = 0;
                
                ctx.fillStyle = 'rgba(200, 220, 255, 0.25)';
                ctx.fillRect(0, 0, width, height);
                
                setTimeout(() => {
                    this.lightning.active = false;
                }, 50);
            }
            
            // 가장자리 페이드아웃
            const edgeFade = 120;
            ctx.globalCompositeOperation = 'destination-out';
            
            const topGrad = ctx.createLinearGradient(0, 0, 0, edgeFade);
            topGrad.addColorStop(0, 'rgba(0,0,0,1)');
            topGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, width, edgeFade);
            
            const bottomGrad = ctx.createLinearGradient(0, height - edgeFade, 0, height);
            bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
            bottomGrad.addColorStop(1, 'rgba(0,0,0,1)');
            ctx.fillStyle = bottomGrad;
            ctx.fillRect(0, height - edgeFade, width, edgeFade);
            
            ctx.globalCompositeOperation = 'source-over';
            
            requestAnimationFrame(() => this.animate());
        },
        
        updatePosition() {
            const rect = FieldVFX.getBattleRect();
            if (this.canvas) {
                this.canvas.style.left = `${rect.left}px`;
                this.canvas.style.top = `${rect.top}px`;
                this.canvas.style.width = `${rect.width}px`;
                this.canvas.style.height = `${rect.height}px`;
            }
        }
    },
    
    // ==========================================
    // 성역 효과 (Sanctuary Effect)
    // ==========================================
    sanctuary: {
        canvas: null,
        ctx: null,
        running: false,
        particles: [],
        
        start() {
            if (this.running) return;
            this.running = true;
            
            const rect = FieldVFX.getBattleRect();
            
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'sanctuary-vfx-canvas';
            this.canvas.width = rect.width || 800;
            this.canvas.height = rect.height || 400;
            this.canvas.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                pointer-events: none;
                z-index: 100;
                opacity: 0;
                transition: opacity 1s ease-in;
            `;
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            
            setTimeout(() => {
                if (this.canvas) this.canvas.style.opacity = '1';
            }, 50);
            
            this.initParticles();
            this.animate();
            
            console.log('[FieldVFX] 성역 효과 시작');
        },
        
        stop() {
            if (!this.running) return;
            this.running = false;
            
            if (this.canvas) {
                this.canvas.style.opacity = '0';
                const ref = this.canvas;
                setTimeout(() => ref?.remove(), 1000);
                this.canvas = null;
                this.ctx = null;
            }
            
            this.particles = [];
            console.log('[FieldVFX] 성역 효과 종료');
        },
        
        initParticles() {
            this.particles = [];
            const width = this.canvas?.width || 800;
            const height = this.canvas?.height || 400;
            
            for (let i = 0; i < 25; i++) {
                this.particles.push({
                    x: Math.random() * width,
                    y: height + Math.random() * 50,
                    size: 3 + Math.random() * 5,
                    speedY: -0.4 - Math.random() * 0.8,
                    speedX: (Math.random() - 0.5) * 0.4,
                    opacity: 0.4 + Math.random() * 0.5,
                    glow: 12 + Math.random() * 18
                });
            }
        },
        
        animate() {
            if (!this.running || !this.ctx || !this.canvas) return;
            
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            // 황금빛 배경 그라디언트
            const gradient = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) * 0.5
            );
            gradient.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
            gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.06)');
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // 빛나는 파티클
            this.particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.opacity += (Math.random() - 0.5) * 0.03;
                p.opacity = Math.max(0.3, Math.min(0.9, p.opacity));
                
                if (p.y < -40) {
                    p.y = height + 40;
                    p.x = Math.random() * width;
                }
                
                // 글로우
                ctx.shadowBlur = p.glow;
                ctx.shadowColor = 'rgba(251, 191, 36, 0.9)';
                
                ctx.fillStyle = `rgba(255, 230, 120, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 십자 모양 빛
                ctx.strokeStyle = `rgba(255, 240, 180, ${p.opacity * 0.6})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x - p.size * 2.5, p.y);
                ctx.lineTo(p.x + p.size * 2.5, p.y);
                ctx.moveTo(p.x, p.y - p.size * 2.5);
                ctx.lineTo(p.x, p.y + p.size * 2.5);
                ctx.stroke();
            });
            
            ctx.shadowBlur = 0;
            
            requestAnimationFrame(() => this.animate());
        },
        
        updatePosition() {
            const rect = FieldVFX.getBattleRect();
            if (this.canvas) {
                this.canvas.style.left = `${rect.left}px`;
                this.canvas.style.top = `${rect.top}px`;
                this.canvas.style.width = `${rect.width}px`;
                this.canvas.style.height = `${rect.height}px`;
            }
        }
    },
    
    // ==========================================
    // 격노 효과 (Rage Effect)
    // ==========================================
    rage: {
        canvas: null,
        ctx: null,
        running: false,
        flames: [],
        vignette: null,
        
        start() {
            if (this.running) return;
            this.running = true;
            
            const rect = FieldVFX.getBattleRect();
            
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'rage-vfx-canvas';
            this.canvas.width = rect.width || 800;
            this.canvas.height = rect.height || 400;
            this.canvas.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                pointer-events: none;
                z-index: 100;
                opacity: 0;
                transition: opacity 0.5s ease-in;
            `;
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            
            setTimeout(() => {
                if (this.canvas) this.canvas.style.opacity = '1';
            }, 50);
            
            this.initFlames();
            this.animate();
            this.addVignette(rect);
            
            console.log('[FieldVFX] 격노 효과 시작');
        },
        
        stop() {
            if (!this.running) return;
            this.running = false;
            
            if (this.canvas) {
                this.canvas.style.opacity = '0';
                const ref = this.canvas;
                setTimeout(() => ref?.remove(), 500);
                this.canvas = null;
                this.ctx = null;
            }
            
            if (this.vignette) {
                this.vignette.style.opacity = '0';
                const ref = this.vignette;
                setTimeout(() => ref?.remove(), 500);
                this.vignette = null;
            }
            
            this.flames = [];
            console.log('[FieldVFX] 격노 효과 종료');
        },
        
        initFlames() {
            this.flames = [];
            const width = this.canvas?.width || 800;
            const height = this.canvas?.height || 400;
            
            for (let i = 0; i < 30; i++) {
                this.flames.push({
                    x: Math.random() * width,
                    y: height,
                    size: 18 + Math.random() * 28,
                    speedY: -1.8 - Math.random() * 2.5,
                    life: 1,
                    decay: 0.012 + Math.random() * 0.018
                });
            }
        },
        
        animate() {
            if (!this.running || !this.ctx || !this.canvas) return;
            
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            // 붉은 오버레이
            ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
            ctx.fillRect(0, 0, width, height);
            
            // 불꽃 파티클
            this.flames.forEach(f => {
                f.y += f.speedY;
                f.life -= f.decay;
                f.x += (Math.random() - 0.5) * 2;
                
                if (f.life <= 0) {
                    f.y = height;
                    f.life = 1;
                    f.x = Math.random() * width;
                }
                
                const gradient = ctx.createRadialGradient(
                    f.x, f.y, 0,
                    f.x, f.y, f.size * f.life
                );
                gradient.addColorStop(0, `rgba(255, 220, 80, ${f.life * 0.85})`);
                gradient.addColorStop(0.3, `rgba(255, 120, 40, ${f.life * 0.55})`);
                gradient.addColorStop(0.6, `rgba(220, 60, 30, ${f.life * 0.35})`);
                gradient.addColorStop(1, 'rgba(120, 30, 15, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.size * f.life, 0, Math.PI * 2);
                ctx.fill();
            });
            
            requestAnimationFrame(() => this.animate());
        },
        
        addVignette(rect) {
            this.vignette = document.createElement('div');
            this.vignette.id = 'rage-vignette';
            this.vignette.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                pointer-events: none;
                z-index: 99;
                background: radial-gradient(ellipse at center, 
                    transparent 35%, 
                    rgba(220, 60, 30, 0.3) 100%);
                opacity: 0;
                transition: opacity 0.5s ease-in;
                animation: ragePulse 0.8s ease-in-out infinite alternate;
            `;
            document.body.appendChild(this.vignette);
            
            setTimeout(() => {
                if (this.vignette) this.vignette.style.opacity = '1';
            }, 100);
        },
        
        updatePosition() {
            const rect = FieldVFX.getBattleRect();
            if (this.canvas) {
                this.canvas.style.left = `${rect.left}px`;
                this.canvas.style.top = `${rect.top}px`;
                this.canvas.style.width = `${rect.width}px`;
                this.canvas.style.height = `${rect.height}px`;
            }
            if (this.vignette) {
                this.vignette.style.left = `${rect.left}px`;
                this.vignette.style.top = `${rect.top}px`;
                this.vignette.style.width = `${rect.width}px`;
                this.vignette.style.height = `${rect.height}px`;
            }
        }
    },
    
    // ==========================================
    // 어둠 효과 (Darkness Effect)
    // ==========================================
    darkness: {
        canvas: null,
        ctx: null,
        running: false,
        shadows: [],
        
        start() {
            if (this.running) return;
            this.running = true;
            
            const rect = FieldVFX.getBattleRect();
            
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'darkness-vfx-canvas';
            this.canvas.width = rect.width || 800;
            this.canvas.height = rect.height || 400;
            this.canvas.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                pointer-events: none;
                z-index: 100;
                opacity: 0;
                transition: opacity 1.5s ease-in;
            `;
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
            
            setTimeout(() => {
                if (this.canvas) this.canvas.style.opacity = '1';
            }, 50);
            
            this.initShadows();
            this.animate();
            
            console.log('[FieldVFX] 어둠 효과 시작');
        },
        
        stop() {
            if (!this.running) return;
            this.running = false;
            
            if (this.canvas) {
                this.canvas.style.opacity = '0';
                const ref = this.canvas;
                setTimeout(() => ref?.remove(), 1500);
                this.canvas = null;
                this.ctx = null;
            }
            
            this.shadows = [];
            console.log('[FieldVFX] 어둠 효과 종료');
        },
        
        initShadows() {
            this.shadows = [];
            const width = this.canvas?.width || 800;
            const height = this.canvas?.height || 400;
            
            for (let i = 0; i < 18; i++) {
                this.shadows.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: 70 + Math.random() * 140,
                    speedX: (Math.random() - 0.5) * 0.25,
                    speedY: (Math.random() - 0.5) * 0.25,
                    phase: Math.random() * Math.PI * 2
                });
            }
        },
        
        animate() {
            if (!this.running || !this.ctx || !this.canvas) return;
            
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;
            
            // 어두운 배경
            ctx.fillStyle = 'rgba(10, 5, 25, 0.55)';
            ctx.fillRect(0, 0, width, height);
            
            // 그림자 블롭
            this.shadows.forEach(s => {
                s.x += s.speedX;
                s.y += s.speedY;
                s.phase += 0.012;
                
                // 화면 순환
                if (s.x < -s.radius) s.x = width + s.radius;
                if (s.x > width + s.radius) s.x = -s.radius;
                if (s.y < -s.radius) s.y = height + s.radius;
                if (s.y > height + s.radius) s.y = -s.radius;
                
                const pulseFactor = 0.8 + Math.sin(s.phase) * 0.2;
                
                const gradient = ctx.createRadialGradient(
                    s.x, s.y, 0,
                    s.x, s.y, s.radius * pulseFactor
                );
                gradient.addColorStop(0, 'rgba(0, 0, 15, 0.65)');
                gradient.addColorStop(0.5, 'rgba(15, 8, 35, 0.35)');
                gradient.addColorStop(1, 'rgba(25, 15, 50, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius * pulseFactor, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // 가장자리 비네팅
            const vignette = ctx.createRadialGradient(
                width / 2, height / 2, Math.min(width, height) * 0.1,
                width / 2, height / 2, Math.max(width, height) * 0.55
            );
            vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);
            
            requestAnimationFrame(() => this.animate());
        },
        
        updatePosition() {
            const rect = FieldVFX.getBattleRect();
            if (this.canvas) {
                this.canvas.style.left = `${rect.left}px`;
                this.canvas.style.top = `${rect.top}px`;
                this.canvas.style.width = `${rect.width}px`;
                this.canvas.style.height = `${rect.height}px`;
            }
        }
    },
    
    // ==========================================
    // 메인 API
    // ==========================================
    
    start(fieldId) {
        const effect = this[fieldId];
        if (effect && typeof effect.start === 'function') {
            effect.start();
            this.activeEffects[fieldId] = true;
            // 여러 VFX가 있을 때 투명도 조정
            setTimeout(() => this.updateAllOpacity(), 100);
        }
    },
    
    stop(fieldId) {
        const effect = this[fieldId];
        if (effect && typeof effect.stop === 'function') {
            effect.stop();
            delete this.activeEffects[fieldId];
            // 남은 VFX들 투명도 복원
            setTimeout(() => this.updateAllOpacity(), 100);
        }
    },
    
    stopAll() {
        Object.keys(this.activeEffects).forEach(id => {
            this.stop(id);
        });
    },
    
    // 윈도우 리사이즈 처리
    handleResize() {
        Object.keys(this.activeEffects).forEach(id => {
            const effect = this[id];
            if (effect && typeof effect.updatePosition === 'function') {
                effect.updatePosition();
            }
        });
    }
};

// 윈도우 리사이즈 이벤트
window.addEventListener('resize', () => {
    FieldVFX.handleResize();
});

// ==========================================
// CSS 애니메이션 추가
// ==========================================
const fieldVFXStyles = document.createElement('style');
fieldVFXStyles.textContent = `
    @keyframes fogSway {
        0%, 100% { transform: translateX(-4px); }
        50% { transform: translateX(4px); }
    }
    
    @keyframes ragePulse {
        0% { opacity: 0.4; }
        100% { opacity: 0.7; }
    }
`;
document.head.appendChild(fieldVFXStyles);

// 전역 등록
window.FieldVFX = FieldVFX;

console.log('[FieldVFX] 필드 VFX 시스템 로드 완료');
