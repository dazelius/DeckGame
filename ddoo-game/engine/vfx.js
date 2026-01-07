// ==========================================
// Shadow Deck - Canvas 2D VFX 이펙트 시스템
// ==========================================

const VFX = {
    canvas: null,
    ctx: null,
    particles: [],
    animations: [],
    isRunning: false,
    timeScale: 1.0,  // 슬로우 모션용 타임스케일
    lastBloodSoundTime: 0,  // blood 사운드 디바운스용
    
    // ==========================================
    // Blood 사운드 재생 (디바운스 적용)
    // ==========================================
    playBloodSound() {
        const now = Date.now();
        // 100ms 디바운스 - 너무 빈번한 재생 방지
        if (now - this.lastBloodSoundTime < 100) return;
        this.lastBloodSoundTime = now;
        
        try {
            const sound = new Audio('sound/hit_blood.mp3');
            sound.volume = 0.4;
            sound.play().catch(() => {});
        } catch (e) {}
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        // Canvas 생성
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'vfx-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999999;
        `;
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        console.log('[VFX] Canvas 이펙트 시스템 초기화 완료');
    },
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    // ==========================================
    // 애니메이션 루프
    // ==========================================
    startLoop() {
        // 이미 실행 중이면 그냥 리턴 (루프는 계속 돌고 있음)
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    },
    
    // 강제로 루프 재시작 (setTimeout 콜백에서 사용)
    ensureLoop() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    },
    
    loop() {
        // Canvas 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 타임스케일 적용된 dt (슬로우 모션)
        const dt = 0.016 * this.timeScale;
        
        // 파티클 업데이트 & 렌더링
        this.particles = this.particles.filter(p => {
            if (!p.alive) return false;
            if (typeof p.update === 'function') {
                p.update(dt, this.timeScale);
            } else {
                // 단순 파티클 업데이트 (슬로우 모션 적용)
                p.x += (p.vx || 0) * dt;
                p.y += (p.vy || 0) * dt;
                p.vy += (p.gravity || 0) * dt;
                p.alpha -= (p.decay || 0.02) * this.timeScale;
                if (p.alpha <= 0) p.alive = false;
            }
            if (p.alive) {
                if (typeof p.draw === 'function') {
                    p.draw(this.ctx);
                } else {
                    // 단순 파티클 드로잉
                    this.ctx.save();
                    this.ctx.globalAlpha = p.alpha;
                    this.ctx.fillStyle = p.color || '#ffffff';
                    this.ctx.shadowColor = p.color || '#ffffff';
                    this.ctx.shadowBlur = 10;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }
            return p.alive;
        });
        
        // 애니메이션 업데이트 & 렌더링
        this.animations = this.animations.filter(a => {
            if (!a.alive) return false;
            
            // 마스터 소드 관련 애니메이션 타입 체크
            const masterSwordTypes = ['masterFlash', 'lightBeam', 'triforceBeam', 'finalWave'];
            if (masterSwordTypes.includes(a.type)) {
                this.renderMasterSwordEffects(a);
                return a.alive;
            }
            
            // 타임스케일 전달
            a._timeScale = this.timeScale;
            
            // 기존 애니메이션 처리
            if (typeof a.update === 'function') {
                a.update();
            }
            if (a.alive && typeof a.draw === 'function') {
                a.draw(this.ctx);
            }
            return a.alive;
        });
        
        // 활성 이펙트가 있으면 계속 루프
        if (this.particles.length > 0 || this.animations.length > 0) {
            requestAnimationFrame(() => this.loop());
        } else {
            this.isRunning = false;
        }
    },
    
    // 파티클 추가 헬퍼 (자동으로 루프 시작)
    addParticle(particle) {
        this.particles.push(particle);
        this.ensureLoop();
    },
    
    // 애니메이션 추가 헬퍼 (자동으로 루프 시작)
    addAnimation(animation) {
        this.animations.push(animation);
        this.ensureLoop();
    },
    
    // ==========================================
    // 슬래시 이펙트 (베기) - 난도질 스타일
    // ==========================================
    slash(x, y, options = {}) {
        const {
            color = '#ff6b6b',
            length = 300,        // 2배 크기
            width = 16,          // 2배 두께
            angle = -45,
            duration = 250,
            glow = true,
            randomOffset = 60,   // 랜덤 위치 범위
            slashCount = 1       // 슬래시 수
        } = options;
        
        this.ensureLoop();
        
        // 여러 슬래시 생성 (난도질)
        const totalSlashes = slashCount;
        for (let i = 0; i < totalSlashes; i++) {
            const delay = i * 50;
            
            setTimeout(() => {
                // 랜덤 위치 오프셋
                const offsetX = (Math.random() - 0.5) * randomOffset * 2;
                const offsetY = (Math.random() - 0.5) * randomOffset * 2;
                const slashX = x + offsetX;
                const slashY = y + offsetY;
                
                // 랜덤 각도 변화
                const angleVariation = (Math.random() - 0.5) * 60;
                const finalAngle = angle + angleVariation;
                
                // 랜덤 길이 변화
                const lengthVariation = length * (0.7 + Math.random() * 0.6);
                
                const slash = {
                    x: slashX, 
                    y: slashY,
                    length: lengthVariation,
                    width,
                    angle: finalAngle * Math.PI / 180,
                    progress: 0,
                    duration,
                    color,
                    glow,
                    alive: true,
                    
                    update() {
                        this.progress += 16 / this.duration;
                        if (this.progress >= 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const easeOut = 1 - Math.pow(1 - this.progress, 3);
                        const fadeOut = this.progress > 0.6 ? 1 - (this.progress - 0.6) / 0.4 : 1;
                        
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.angle);
                        
                        // 강한 글로우 효과
                        if (this.glow) {
                            ctx.shadowColor = this.color;
                            ctx.shadowBlur = 40;  // 2배 글로우
                        }
                        
                        // 슬래시 라인
                        const currentLength = this.length * easeOut;
                        const gradient = ctx.createLinearGradient(-currentLength/2, 0, currentLength/2, 0);
                        gradient.addColorStop(0, 'transparent');
                        gradient.addColorStop(0.15, this.color);
                        gradient.addColorStop(0.5, '#fff');
                        gradient.addColorStop(0.85, this.color);
                        gradient.addColorStop(1, 'transparent');
                        
                        ctx.globalAlpha = fadeOut;
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = this.width * (1 - this.progress * 0.5);
                        ctx.lineCap = 'round';
                        
                        ctx.beginPath();
                        ctx.moveTo(-currentLength/2, 0);
                        ctx.lineTo(currentLength/2, 0);
                        ctx.stroke();
                        
                        // 밝은 코어
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = this.width * 0.4 * (1 - this.progress * 0.5);
                        ctx.beginPath();
                        ctx.moveTo(-currentLength/2, 0);
                        ctx.lineTo(currentLength/2, 0);
                        ctx.stroke();
                        
                        ctx.restore();
                    }
                };
                
                this.animations.push(slash);
                
                // 슬래시 위치에 스파크 생성
                this.sparks(slashX, slashY, { color, count: 12, speed: 16, size: 8 });
                
                // 루프 재시작 보장
                this.ensureLoop();
            }, delay);
        }
    },
    
    // ==========================================
    // 크로스 슬래시 (X자 베기) - 난도질 스타일
    // ==========================================
    crossSlash(x, y, options = {}) {
        const { color = '#ff6b6b', size = 280, delay = 40 } = options;  // 2배 크기
        
        // 랜덤 오프셋으로 여러 X자 베기
        for (let i = 0; i < 2; i++) {
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 50;
            
            setTimeout(() => {
                this.slash(x + offsetX, y + offsetY, { 
                    ...options, 
                    color, 
                    length: size * (0.8 + Math.random() * 0.4), 
                    angle: -45 + (Math.random() - 0.5) * 20,
                    randomOffset: 30
                });
            }, i * delay);
            
            setTimeout(() => {
                this.slash(x - offsetX, y - offsetY, { 
                    ...options, 
                    color, 
                    length: size * (0.8 + Math.random() * 0.4), 
                    angle: 45 + (Math.random() - 0.5) * 20,
                    randomOffset: 30
                });
            }, i * delay + delay);
        }
    },
    
    // ==========================================
    // 히트 스파크 이펙트 (2배 크기)
    // ==========================================
    sparks(x, y, options = {}) {
        const {
            color = '#fbbf24',
            count = 20,          // 더 많은 스파크
            speed = 16,          // 2배 속도
            size = 8,            // 2배 크기
            life = 500
        } = options;
        
        this.ensureLoop();
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.8;
            const velocity = speed * (0.5 + Math.random() * 0.8);
            
            // 랜덤 시작 위치
            const startOffsetX = (Math.random() - 0.5) * 20;
            const startOffsetY = (Math.random() - 0.5) * 20;
            
            this.particles.push({
                x: x + startOffsetX, 
                y: y + startOffsetY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: size * (0.5 + Math.random() * 0.8),
                color,
                life,
                maxLife: life,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.94;
                    this.vy *= 0.94;
                    this.life -= 16;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 20;  // 2배 글로우
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 히트 임팩트 (충격 이펙트) - 2배 크기
    // ==========================================
    impact(x, y, options = {}) {
        const {
            color = '#fff',
            size = 120,
            duration = 300
        } = options;
        
        this.ensureLoop();
        
        // 중앙 플래시 (시간 기반)
        const impactObj = {
            x, y,
            size,
            progress: 0,
            duration,
            color,
            alive: true,
            startTime: Date.now()
        };
        
        impactObj.update = function() {
            const elapsed = Date.now() - this.startTime;
            this.progress = Math.min(1, elapsed / this.duration);
            if (this.progress >= 1) this.alive = false;
        };
        
        impactObj.draw = function(ctx) {
            if (!this.alive) return;
            
            const scale = 1 + this.progress * 0.8;
            const alpha = Math.max(0, 1 - this.progress);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(this.x, this.y);
            
            // 외곽 링
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(0.5, 6 * (1 - this.progress));
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // 두 번째 링
            ctx.lineWidth = Math.max(0.5, 3 * (1 - this.progress));
            ctx.beginPath();
            ctx.arc(0, 0, this.size * scale * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            
            // 내부 플래시
            const innerSize = Math.max(1, this.size * 0.6 * (1 - this.progress));
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, innerSize);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.3, this.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, innerSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        };
        
        this.animations.push(impactObj);
        
        // 더 많은 스파크
        this.sparks(x, y, { color, count: 16, speed: 14 });
    },
    
    // ==========================================
    // 크리티컬 히트 이펙트 - 2배 화려함
    // ==========================================
    criticalHit(x, y, options = {}) {
        const { size = 200 } = options;
        
        this.ensureLoop();
        
        // 황금 폭발 임팩트 (중심)
        this.impact(x, y, { color: '#fbbf24', size: size * 1.5, duration: 500 });
        setTimeout(() => {
            this.impact(x, y, { color: '#ff4444', size: size * 1.2, duration: 400 });
        }, 50);
        
        // 별 모양 스파크 (방사형)
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i;
            const dist = size * 0.4;
            setTimeout(() => {
                this.sparks(
                    x + Math.cos(angle) * dist,
                    y + Math.sin(angle) * dist,
                    { color: i % 2 === 0 ? '#fbbf24' : '#ff6b6b', count: 6, speed: 15 }
                );
            }, i * 20);
        }
        
        // 다중 충격파 (적-황금)
        this.shockwave(x, y, { color: '#ff4444', size: size * 2.5, lineWidth: 8 });
        setTimeout(() => {
            this.shockwave(x, y, { color: '#fbbf24', size: size * 2, lineWidth: 6 });
        }, 80);
        setTimeout(() => {
            this.shockwave(x, y, { color: '#ffffff', size: size * 1.5, lineWidth: 4 });
        }, 160);
    },
    
    // ==========================================
    // 충격파 링
    // ==========================================
    shockwave(x, y, options = {}) {
        const {
            color = '#60a5fa',
            size = 300,
            duration = 400,
            lineWidth = 8
        } = options;
        
        this.ensureLoop();
        
        // 충격파 객체 (명확한 생명주기)
        const shockwaveObj = {
            x, y,
            size,
            progress: 0,
            duration,
            color,
            lineWidth,
            alive: true,
            startTime: Date.now()
        };
        
        shockwaveObj.update = function() {
            // 시간 기반 progress 계산 (더 정확함)
            const elapsed = Date.now() - this.startTime;
            this.progress = Math.min(1, elapsed / this.duration);
            if (this.progress >= 1) {
                this.alive = false;
            }
        };
        
        shockwaveObj.draw = function(ctx) {
            if (!this.alive) return;
            
            const easeOut = 1 - Math.pow(1 - this.progress, 2);
            const alpha = Math.max(0, 1 - this.progress);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth * Math.max(0.1, 1 - this.progress * 0.8);
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 30;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * easeOut, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        };
        
        this.animations.push(shockwaveObj);
    },
    
    // ==========================================
    // 출혈 이펙트
    // ==========================================
    bleed(x, y, options = {}) {
        const {
            color = '#dc2626',
            count = 15,
            spread = 40
        } = options;
        
        this.ensureLoop();
        
        for (let i = 0; i < count; i++) {
            const delay = i * 20;
            
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * spread;
                const offsetY = (Math.random() - 0.5) * spread;
                
                this.particles.push({
                    x: x + offsetX,
                    y: y + offsetY,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 3 + 2, // 아래로 떨어짐
                    size: 3 + Math.random() * 4,
                    color,
                    life: 600 + Math.random() * 400,
                    maxLife: 1000,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vy += 0.15; // 중력
                        this.vx *= 0.98;
                        this.life -= 16;
                        if (this.life <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const alpha = Math.min(1, this.life / this.maxLife * 2);
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowColor = this.color;
                        ctx.shadowBlur = 5;
                        
                        // 물방울 형태
                        ctx.beginPath();
                        ctx.ellipse(this.x, this.y, this.size * 0.6, this.size, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, delay);
        }
    },
    
    // ==========================================
    // 방어 이펙트 (쉴드) - GSAP + PixiJS 업그레이드!
    // ==========================================
    shield(x, y, options = {}) {
        console.log('[VFX] 🛡️ shield 호출됨!', { x, y, options });
        
        const {
            color = '#60a5fa',
            size = 80,
            duration = 500,
            intensity = 1
        } = options;
        
        this.ensureLoop();
        
        // 🎆 PixiJS 쉴드 이펙트 (메인!)
        console.log('[VFX] PixiRenderer 확인:', { 
            defined: typeof PixiRenderer !== 'undefined', 
            initialized: typeof PixiRenderer !== 'undefined' ? PixiRenderer.initialized : 'N/A' 
        });
        
        if (typeof PixiRenderer !== 'undefined' && PixiRenderer.initialized) {
            console.log('[VFX] ✅ PixiJS 쉴드 이펙트 호출!');
            PixiRenderer.createShieldDeploy(x, y, size, color, intensity);
        } else {
            console.warn('[VFX] ⚠️ PixiRenderer가 초기화되지 않음!');
        }
        
        // 🎭 GSAP 스프라이트 애니메이션 (플레이어) - 아주 약하게!
        if (typeof gsap !== 'undefined') {
            const playerSprite = document.querySelector('.player-sprite-img');
            if (playerSprite) {
                // 방어 자세 (글로우 거의 없이!)
                gsap.timeline()
                    .to(playerSprite, {
                        scaleX: 1.03,
                        scaleY: 0.98,
                        x: -2,
                        filter: 'brightness(1.05)',  // 글로우 제거, 살짝 밝게만
                        duration: 0.06,
                        ease: "power2.out"
                    })
                    .to(playerSprite, {
                        scaleX: 0.98,
                        scaleY: 1.02,
                        x: 1,
                        filter: 'brightness(1.02)',
                        duration: 0.05
                    })
                    .to(playerSprite, {
                        scaleX: 1,
                        scaleY: 1,
                        x: 0,
                        filter: '',
                        duration: 0.12,
                        ease: "power2.out"
                    });
            }
        }
        
        // 🛡️ 최소한의 파티클만
        this.sparks(x, y, { color, count: 3, speed: 3, size: 2 });
    },
    
    // ==========================================
    // 연막 이펙트 (닷지용)
    // ==========================================
    smoke(x, y, options = {}) {
        const {
            color = '#8899aa',
            size = 120,
            duration = 800,
            count = 15
        } = options;
        
        this.ensureLoop();
        
        // 연막 구름 파티클들
        for (let i = 0; i < count; i++) {
            const delay = i * 30;
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 20 + Math.random() * 40;
            const cloudSize = 30 + Math.random() * 50;
            
            setTimeout(() => {
                this.particles.push({
                    x: x + Math.cos(angle) * distance * 0.3,
                    y: y + Math.sin(angle) * distance * 0.3,
                    vx: Math.cos(angle) * 2 + (Math.random() - 0.5) * 2,
                    vy: Math.sin(angle) * 2 - Math.random() * 1.5, // 위로 떠오름
                    size: cloudSize,
                    maxSize: cloudSize * 1.5,
                    color,
                    life: duration,
                    maxLife: duration,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.05,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.96;
                        this.vy *= 0.96;
                        this.vy -= 0.03; // 위로 상승
                        this.rotation += this.rotSpeed;
                        
                        // 크기 변화 (커졌다 작아짐)
                        const lifeRatio = this.life / this.maxLife;
                        if (lifeRatio > 0.7) {
                            this.size = this.maxSize * (1 - (lifeRatio - 0.7) / 0.3 * 0.3);
                        } else {
                            this.size = this.maxSize * 0.7 * (lifeRatio / 0.7);
                        }
                        
                        this.life -= 16;
                        if (this.life <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const alpha = Math.min(0.6, this.life / this.maxLife);
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        
                        // 연막 구름 (그라데이션 원)
                        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
                        gradient.addColorStop(0, this.color);
                        gradient.addColorStop(0.4, this.color + 'aa');
                        gradient.addColorStop(0.7, this.color + '44');
                        gradient.addColorStop(1, 'transparent');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, delay);
        }
        
        // 빠르게 퍼지는 외곽 연기
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 6 + Math.random() * 4;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 20 + Math.random() * 20,
                color,
                life: 400,
                maxLife: 400,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.92;
                    this.vy *= 0.92;
                    this.size *= 1.02; // 점점 커짐
                    this.life -= 16;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = (this.life / this.maxLife) * 0.4;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    
                    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                    gradient.addColorStop(0, this.color + '80');
                    gradient.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
            });
        }
        
        // 중앙 플래시
        this.animations.push({
            x, y,
            size: 30,
            maxSize: size * 0.8,
            color,
            startTime: Date.now(),
            duration: 300,
            alive: true,
            
            update() {
                const progress = Math.min(1, (Date.now() - this.startTime) / this.duration);
                const easeOut = 1 - Math.pow(1 - progress, 2);
                this.size = 30 + (this.maxSize - 30) * easeOut;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const alpha = 0.5 * (1 - progress);
                
                ctx.save();
                ctx.globalAlpha = alpha;
                
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.3, this.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // 작은 먼지 파티클
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - Math.random() * 2,
                size: 2 + Math.random() * 3,
                color: '#aabbcc',
                life: 500 + Math.random() * 300,
                maxLife: 800,
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
                    ctx.globalAlpha = alpha * 0.7;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 단검 투척 이펙트
    // ==========================================
    dagger(fromX, fromY, toX, toY, options = {}) {
        const {
            color = '#c0c0c0',       // 은색 단검
            glowColor = '#60a5fa',   // 파란 글로우
            size = 40,               // 단검 크기
            speed = 25,              // 빠른 속도
            spinSpeed = 15,          // 회전 속도
            trailLength = 12,        // 잔상 길이
            onHit = null
        } = options;
        
        this.ensureLoop();
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        const baseAngle = Math.atan2(dy, dx);
        
        const dagger = {
            x: fromX,
            y: fromY,
            targetX: toX,
            targetY: toY,
            vx, vy,
            size,
            color,
            glowColor,
            rotation: baseAngle,
            spinSpeed: spinSpeed * (Math.PI / 180),
            trail: [],
            trailLength,
            alive: true,
            startTime: Date.now(),
            
            update() {
                // 이동
                this.x += this.vx;
                this.y += this.vy;
                
                // 회전
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
                
                // 타겟 도달 체크
                const distToTarget = Math.sqrt(
                    Math.pow(this.x - this.targetX, 2) + 
                    Math.pow(this.y - this.targetY, 2)
                );
                
                if (distToTarget < speed * 1.5) {
                    this.alive = false;
                    if (onHit) onHit();
                    // 임팩트 이펙트
                    VFX.daggerImpact(this.targetX, this.targetY, { color: this.glowColor });
                }
            },
            
            draw(ctx) {
                ctx.save();
                
                // 잔상 그리기
                this.trail.forEach((t, i) => {
                    if (i === 0) return; // 첫 번째는 메인으로 그림
                    ctx.save();
                    ctx.globalAlpha = t.alpha * 0.4;
                    ctx.translate(t.x, t.y);
                    ctx.rotate(t.rotation);
                    
                    // 잔상 단검
                    const trailSize = this.size * (1 - i * 0.05);
                    this.drawDagger(ctx, trailSize, this.glowColor, 0.3);
                    
                    ctx.restore();
                });
                
                // 메인 단검 그리기
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                // 강한 글로우
                ctx.shadowColor = this.glowColor;
                ctx.shadowBlur = 25;
                
                this.drawDagger(ctx, this.size, this.color, 1);
                
                ctx.restore();
            },
            
            // 단검 형태 그리기
            drawDagger(ctx, size, color, alpha) {
                ctx.globalAlpha = alpha;
                
                // 단검 날 (삼각형)
                const bladeLength = size;
                const bladeWidth = size * 0.2;
                
                // 그라데이션
                const gradient = ctx.createLinearGradient(-bladeLength/2, 0, bladeLength/2, 0);
                gradient.addColorStop(0, '#a0a0a0');
                gradient.addColorStop(0.3, '#ffffff');
                gradient.addColorStop(0.5, color);
                gradient.addColorStop(0.7, '#ffffff');
                gradient.addColorStop(1, '#606060');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(bladeLength / 2, 0);  // 끝점
                ctx.lineTo(-bladeLength / 4, -bladeWidth);
                ctx.lineTo(-bladeLength / 2, -bladeWidth * 0.5);
                ctx.lineTo(-bladeLength / 2, bladeWidth * 0.5);
                ctx.lineTo(-bladeLength / 4, bladeWidth);
                ctx.closePath();
                ctx.fill();
                
                // 날 반짝임 라인
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.globalAlpha = alpha * 0.8;
                ctx.beginPath();
                ctx.moveTo(bladeLength / 2, 0);
                ctx.lineTo(-bladeLength / 4, 0);
                ctx.stroke();
                
                // 손잡이
                ctx.fillStyle = '#8b5a2b';
                ctx.globalAlpha = alpha;
                ctx.fillRect(-bladeLength / 2 - size * 0.15, -bladeWidth * 0.4, size * 0.15, bladeWidth * 0.8);
            }
        };
        
        this.animations.push(dagger);
        
        // 발사 시 스파크
        this.sparks(fromX, fromY, { color: glowColor, count: 6, speed: 8, size: 4 });
    },
    
    // ==========================================
    // 단검 임팩트 이펙트
    // ==========================================
    daggerImpact(x, y, options = {}) {
        const { color = '#60a5fa' } = options;
        
        this.ensureLoop();
        
        // 임팩트 스파크 (방사형)
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 8 + Math.random() * 12;
            const size = 3 + Math.random() * 4;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color: i % 2 === 0 ? color : '#ffffff',
                life: 400,
                maxLife: 400,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.92;
                    this.vy *= 0.92;
                    this.life -= 16;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    
                    // 길쭉한 스파크
                    ctx.beginPath();
                    ctx.ellipse(this.x, this.y, this.size * 2, this.size * 0.5, 
                        Math.atan2(this.vy, this.vx), 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
            });
        }
        
        // 금속 파편
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 8;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.5,
                size: 2 + Math.random() * 3,
                life: 500,
                maxLife: 500,
                alive: true,
                
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.3; // 중력
                    this.vx *= 0.98;
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
                    
                    // 금속 파편
                    ctx.fillStyle = '#c0c0c0';
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 5;
                    ctx.fillRect(-this.size, -this.size * 0.3, this.size * 2, this.size * 0.6);
                    
                    ctx.restore();
                }
            });
        }
        
        // 충격 링
        this.animations.push({
            x, y,
            size: 20,
            maxSize: 80,
            lineWidth: 4,
            color,
            startTime: Date.now(),
            duration: 300,
            alive: true,
            
            update() {
                const progress = Math.min(1, (Date.now() - this.startTime) / this.duration);
                this.size = 20 + (this.maxSize - 20) * progress;
                this.lineWidth = 4 * (1 - progress);
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const alpha = 1 - progress;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.lineWidth;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 15;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // 임팩트 플래시
        this.impact(x, y, { color, size: 40 });
    },
    
    // ==========================================
    // 차크람 투척 이펙트
    // passThrough: true면 타겟을 뚫고 화면 밖으로 계속 진행
    // fromOffscreen: true면 화면 밖에서 시작점으로 미리 계산
    // ==========================================
    chakram(fromX, fromY, toX, toY, options = {}) {
        const {
            color = '#ffd700',       // 금색 차크람
            glowColor = '#ff8c00',   // 오렌지 글로우
            size = 50,               // 차크람 크기
            speed = 25,              // 속도
            spinSpeed = 30,          // 회전 속도 (빠름)
            trailLength = 15,        // 잔상 길이
            bladeCount = 8,          // 날 개수
            passThrough = false,     // 타겟을 뚫고 지나감
            fromOffscreen = false,   // 화면 밖에서 시작
            onHit = null
        } = options;
        
        this.ensureLoop();
        
        let startX = fromX;
        let startY = fromY;
        
        // 화면 밖에서 시작하는 경우: 타겟→도착점 방향의 반대편 화면 밖에서 시작
        if (fromOffscreen) {
            const dx = toX - fromX;
            const dy = toY - fromY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            // 화면 밖으로 충분히 멀리 (300px 더)
            startX = fromX - dirX * 350;
            startY = fromY - dirY * 350;
        }
        
        const dx = toX - startX;
        const dy = toY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        const chakram = {
            x: startX,
            y: startY,
            targetX: toX,
            targetY: toY,
            hitTargetX: fromOffscreen ? fromX : toX,  // 실제 히트 포인트 (적 위치)
            hitTargetY: fromOffscreen ? fromY : toY,
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
            hasHitTarget: false,
            
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
                
                // 히트 포인트 도달 체크 (한 번만)
                if (!this.hasHitTarget) {
                    const distToHit = Math.sqrt(
                        Math.pow(this.x - this.hitTargetX, 2) + 
                        Math.pow(this.y - this.hitTargetY, 2)
                    );
                    
                    if (distToHit < speed * 2) {
                        this.hasHitTarget = true;
                        if (onHit) onHit();
                        // 임팩트 이펙트 (뚫고 지나가는 효과)
                        VFX.chakramImpact(this.hitTargetX, this.hitTargetY, { 
                            color: this.glowColor,
                            size: this.passThrough ? 40 : 60
                        });
                    }
                }
                
                // 종료 조건
                if (this.passThrough) {
                    // 화면 밖으로 나가면 종료
                    const margin = 100;
                    if (this.x < -margin || this.x > window.innerWidth + margin ||
                        this.y < -margin || this.y > window.innerHeight + margin) {
                        this.alive = false;
                    }
                } else {
                    // 타겟 도달 시 종료
                    const distToTarget = Math.sqrt(
                        Math.pow(this.x - this.targetX, 2) + 
                        Math.pow(this.y - this.targetY, 2)
                    );
                    
                    if (distToTarget < speed * 1.5) {
                        this.alive = false;
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
        
        this.animations.push(chakram);
        
        // 발사 시 스파크
        this.sparks(fromX, fromY, { color: glowColor, count: 10, speed: 10, size: 5 });
    },
    
    // 차크람 임팩트 이펙트
    chakramImpact(x, y, options = {}) {
        const { color = '#ff8c00' } = options;
        
        this.ensureLoop();
        
        // 방사형 칼날 스파크
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.2;
            const speed = 10 + Math.random() * 15;
            const size = 4 + Math.random() * 5;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: angle,
                size,
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
        
        // 회전 충격파
        this.animations.push({
            x, y,
            size: 25,
            maxSize: 100,
            rotation: 0,
            lineWidth: 5,
            color,
            startTime: Date.now(),
            duration: 350,
            alive: true,
            
            update() {
                const progress = Math.min(1, (Date.now() - this.startTime) / this.duration);
                this.size = 25 + (this.maxSize - 25) * progress;
                this.lineWidth = 5 * (1 - progress);
                this.rotation += 0.2;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const progress = (Date.now() - this.startTime) / this.duration;
                const alpha = 1 - progress;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.lineWidth;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                
                // 8각 별 모양 충격파
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const r = this.size;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // 임팩트 플래시
        this.impact(x, y, { color, size: 50 });
        
        // 추가 스파크
        this.sparks(x, y, { color: '#ffd700', count: 8, speed: 150, size: 4 });
    },
    
    // ==========================================
    // 에너지 투사체 (발사)
    // ==========================================
    projectile(fromX, fromY, toX, toY, options = {}) {
        const {
            color = '#a855f7',
            size = 15,
            speed = 15,
            trail = true,
            onHit = null
        } = options;
        
        this.ensureLoop();
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        const projectile = {
            x: fromX,
            y: fromY,
            targetX: toX,
            targetY: toY,
            vx, vy,
            size,
            color,
            trail,
            trailParticles: [],
            alive: true,
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                // 트레일 파티클
                if (this.trail) {
                    this.trailParticles.push({
                        x: this.x,
                        y: this.y,
                        size: this.size * 0.8,
                        alpha: 1
                    });
                }
                
                // 트레일 페이드아웃
                this.trailParticles = this.trailParticles.filter(p => {
                    p.alpha -= 0.1;
                    p.size *= 0.9;
                    return p.alpha > 0;
                });
                
                // 타겟 도달 체크
                const distToTarget = Math.sqrt(
                    Math.pow(this.x - this.targetX, 2) + 
                    Math.pow(this.y - this.targetY, 2)
                );
                
                if (distToTarget < speed * 2) {
                    this.alive = false;
                    if (onHit) onHit();
                    VFX.impact(this.targetX, this.targetY, { color: this.color, size: 50 });
                }
            },
            
            draw(ctx) {
                ctx.save();
                
                // 트레일 그리기
                this.trailParticles.forEach(p => {
                    ctx.globalAlpha = p.alpha * 0.5;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                // 메인 투사체
                ctx.globalAlpha = 1;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, '#fff');
                gradient.addColorStop(0.3, this.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        };
        
        this.animations.push(projectile);
    },
    
    // ==========================================
    // 🏹 화살 투사체 (궁수 전용)
    // ==========================================
    arrow(fromX, fromY, toX, toY, options = {}) {
        const {
            color = '#8B4513', // 갈색 화살
            speed = 25,
            onHit = null
        } = options;
        
        this.ensureLoop();
        
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        const angle = Math.atan2(dy, dx);
        
        const arrow = {
            x: fromX,
            y: fromY,
            targetX: toX,
            targetY: toY,
            vx, vy,
            angle,
            color,
            trailParticles: [],
            alive: true,
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                // 화살 궤적 파티클
                if (Math.random() > 0.5) {
                    this.trailParticles.push({
                        x: this.x - Math.cos(this.angle) * 15,
                        y: this.y - Math.sin(this.angle) * 15,
                        alpha: 0.8,
                        size: 3
                    });
                }
                
                // 트레일 페이드아웃
                this.trailParticles = this.trailParticles.filter(p => {
                    p.alpha -= 0.08;
                    return p.alpha > 0;
                });
                
                // 타겟 도달 체크
                const distToTarget = Math.sqrt(
                    Math.pow(this.x - this.targetX, 2) + 
                    Math.pow(this.y - this.targetY, 2)
                );
                
                if (distToTarget < speed * 2) {
                    this.alive = false;
                    if (onHit) onHit();
                    // 화살 적중 이펙트
                    VFX.impact(this.targetX, this.targetY, { color: '#ef4444', size: 40 });
                    VFX.sparks(this.targetX, this.targetY, { color: '#ffd700', count: 6, speed: 100, size: 3 });
                }
            },
            
            draw(ctx) {
                ctx.save();
                
                // 트레일 그리기
                this.trailParticles.forEach(p => {
                    ctx.globalAlpha = p.alpha * 0.4;
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                ctx.globalAlpha = 1;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                
                // 화살대 (갈색)
                ctx.fillStyle = this.color;
                ctx.fillRect(-25, -2, 30, 4);
                
                // 화살촉 (금속색)
                ctx.fillStyle = '#9ca3af';
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(0, -5);
                ctx.lineTo(0, 5);
                ctx.closePath();
                ctx.fill();
                
                // 화살촉 빛
                ctx.fillStyle = '#e5e7eb';
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(3, -2);
                ctx.lineTo(3, 2);
                ctx.closePath();
                ctx.fill();
                
                // 깃털 (빨간색)
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(-25, 0);
                ctx.lineTo(-30, -6);
                ctx.lineTo(-22, 0);
                ctx.closePath();
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(-25, 0);
                ctx.lineTo(-30, 6);
                ctx.lineTo(-22, 0);
                ctx.closePath();
                ctx.fill();
                
                // 글로우 효과
                ctx.shadowColor = '#f59e0b';
                ctx.shadowBlur = 8;
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1;
                ctx.strokeRect(-25, -2, 30, 4);
                
                ctx.restore();
            }
        };
        
        this.animations.push(arrow);
    },
    
    // ==========================================
    // 힐 이펙트
    // ==========================================
    heal(x, y, options = {}) {
        const {
            color = '#4ade80',
            count = 20,
            size = 80
        } = options;
        
        this.ensureLoop();
        
        // 위로 올라가는 파티클
        for (let i = 0; i < count; i++) {
            const delay = i * 30;
            
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * size;
                
                this.particles.push({
                    x: x + offsetX,
                    y: y + 30,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -Math.random() * 3 - 2,
                    size: 4 + Math.random() * 4,
                    color,
                    life: 800,
                    maxLife: 800,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.98;
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
                        
                        // 십자가 또는 원
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.restore();
                    }
                });
                this.ensureLoop();
            }, delay);
        }
        
        // 글로우 링
        this.shockwave(x, y, { color, size: size * 0.8, duration: 600 });
    },
    
    // ==========================================
    // 버프/디버프 이펙트
    // ==========================================
    buff(x, y, options = {}) {
        const {
            color = '#fbbf24',
            isDebuff = false
        } = options;
        
        const effectColor = isDebuff ? '#a855f7' : color;
        
        this.ensureLoop();
        
        // 회전하는 파티클 링
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const radius = 40;
            
            this.particles.push({
                x, y,
                angle,
                radius,
                color: effectColor,
                life: 600,
                maxLife: 600,
                alive: true,
                
                update() {
                    this.angle += isDebuff ? -0.1 : 0.1;
                    this.radius += isDebuff ? 0.5 : -0.3;
                    this.life -= 16;
                    if (this.life <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    const px = this.x + Math.cos(this.angle) * this.radius;
                    const py = this.y + Math.sin(this.angle) * this.radius + (isDebuff ? this.radius * 0.3 : -this.radius * 0.3);
                    
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(px, py, 4 * alpha, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            });
        }
    },
    
    // ==========================================
    // 멀티 히트 이펙트 - 난도질 스타일 (2배 크기)
    // ==========================================
    multiHit(x, y, hitCount, options = {}) {
        const { color = '#ff6b6b', interval = 80 } = options;
        
        for (let i = 0; i < hitCount; i++) {
            setTimeout(() => {
                // 넓은 랜덤 범위 (2배)
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 100;
                
                // 난도질 슬래시 (2배 크기 + 랜덤 각도)
                this.slash(x + offsetX, y + offsetY, {
                    color,
                    length: 200 + Math.random() * 100,  // 2배 크기
                    width: 12 + Math.random() * 8,
                    angle: -60 + Math.random() * 120,   // 더 넓은 각도 범위
                    duration: 200,
                    randomOffset: 40
                });
                
                // 각 히트마다 임팩트
                if (i % 2 === 0) {
                    this.impact(x + offsetX * 0.5, y + offsetY * 0.5, { 
                        color, 
                        size: 60 + Math.random() * 40 
                    });
                }
            }, i * interval);
        }
        
        // 마지막에 큰 충격파
        setTimeout(() => {
            this.shockwave(x, y, { color, size: 200, lineWidth: 6 });
        }, hitCount * interval);
    },
    
    // ==========================================
    // 화염 이펙트
    // ==========================================
    fire(x, y, options = {}) {
        const {
            size = 60,
            duration = 800,
            count = 30
        } = options;
        
        this.ensureLoop();
        
        for (let i = 0; i < count; i++) {
            const delay = i * 20;
            
            setTimeout(() => {
                const colors = ['#ff4500', '#ff6b35', '#ffa500', '#ffcc00'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const offsetX = (Math.random() - 0.5) * size;
                
                this.particles.push({
                    x: x + offsetX,
                    y: y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 4 - 2,
                    size: 5 + Math.random() * 10,
                    color,
                    life: duration * (0.5 + Math.random() * 0.5),
                    maxLife: duration,
                    alive: true,
                    
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.98;
                        this.vy *= 0.98;
                        this.size *= 0.98;
                        this.life -= 16;
                        if (this.life <= 0 || this.size < 1) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const alpha = this.life / this.maxLife;
                        ctx.save();
                        ctx.globalAlpha = alpha;
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
            }, delay);
        }
    },
    
    // ==========================================
    // 번개 이펙트
    // ==========================================
    lightning(fromX, fromY, toX, toY, options = {}) {
        const {
            color = '#60a5fa',
            branches = 3,
            duration = 300
        } = options;
        
        this.ensureLoop();
        
        // 번개 경로 생성
        const generatePath = (sx, sy, ex, ey, segments = 8) => {
            const points = [{ x: sx, y: sy }];
            const dx = (ex - sx) / segments;
            const dy = (ey - sy) / segments;
            
            for (let i = 1; i < segments; i++) {
                const x = sx + dx * i + (Math.random() - 0.5) * 40;
                const y = sy + dy * i + (Math.random() - 0.5) * 40;
                points.push({ x, y });
            }
            points.push({ x: ex, y: ey });
            return points;
        };
        
        const mainPath = generatePath(fromX, fromY, toX, toY);
        
        this.animations.push({
            paths: [mainPath],
            color,
            progress: 0,
            duration,
            alive: true,
            
            update() {
                this.progress += 16 / this.duration;
                if (this.progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const alpha = 1 - this.progress;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3 * (1 - this.progress * 0.5);
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                this.paths.forEach(path => {
                    ctx.beginPath();
                    path.forEach((p, i) => {
                        if (i === 0) ctx.moveTo(p.x, p.y);
                        else ctx.lineTo(p.x, p.y);
                    });
                    ctx.stroke();
                });
                
                // 흰색 코어
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                this.paths.forEach(path => {
                    ctx.beginPath();
                    path.forEach((p, i) => {
                        if (i === 0) ctx.moveTo(p.x, p.y);
                        else ctx.lineTo(p.x, p.y);
                    });
                    ctx.stroke();
                });
                
                ctx.restore();
            }
        });
        
        // 임팩트
        this.impact(toX, toY, { color, size: 40 });
    },
    
    // ==========================================
    // 유틸리티: 타겟 요소 위치 가져오기
    // ==========================================
    getElementCenter(element) {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    },
    
    // ==========================================
    // 공격 이펙트 헬퍼 (타겟 요소 기반)
    // ==========================================
    attackEffect(targetEl, type = 'slash', options = {}) {
        const pos = this.getElementCenter(targetEl);
        if (!pos) return;
        
        switch(type) {
            case 'slash':
                this.slash(pos.x, pos.y, options);
                break;
            case 'cross':
                this.crossSlash(pos.x, pos.y, options);
                break;
            case 'impact':
                this.impact(pos.x, pos.y, options);
                break;
            case 'critical':
                this.criticalHit(pos.x, pos.y, options);
                break;
            case 'multi':
                this.multiHit(pos.x, pos.y, options.hits || 3, options);
                break;
            case 'bleed':
                this.bleed(pos.x, pos.y, options);
                break;
            case 'fire':
                this.fire(pos.x, pos.y, options);
                break;
        }
    },
    
    // 플레이어 → 적 공격 이펙트
    playerAttack(targetEl, options = {}) {
        const playerEl = document.getElementById('player');
        const targetPos = this.getElementCenter(targetEl);
        const playerPos = this.getElementCenter(playerEl);
        
        if (!targetPos || !playerPos) return;
        
        const { type = 'slash', isCritical = false, hits = 1 } = options;
        
        if (isCritical) {
            this.criticalHit(targetPos.x, targetPos.y);
        } else if (hits > 1) {
            this.multiHit(targetPos.x, targetPos.y, hits, options);
        } else {
            this.slash(targetPos.x, targetPos.y, options);
        }
    },
    
    // 적 → 플레이어 공격 이펙트
    enemyAttack(playerEl, options = {}) {
        const pos = this.getElementCenter(playerEl);
        if (!pos) return;
        
        const { damage = 0 } = options;
        
        if (damage >= 20) {
            this.crossSlash(pos.x, pos.y, { color: '#ef4444' });
        } else {
            this.slash(pos.x, pos.y, { color: '#ef4444', angle: 45 });
        }
        this.impact(pos.x, pos.y, { color: '#ff6b6b', size: 40 });
    },
    
    // ==========================================
    // 마스터 소드 공격 (전체 화면 화려한 연출)
    // ==========================================
    masterSwordAttack(targets, options = {}) {
        const {
            color = '#00ff88',
            secondaryColor = '#ffd700',
            duration = 2000
        } = options;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        this.ensureLoop();
        
        // 1. 화면 전체 플래시
        this.animations.push({
            type: 'masterFlash',
            startTime: Date.now(),
            duration: 300,
            alive: true
        });
        
        // 2. 중앙에서 방사형 빛줄기
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const delay = i * 30;
            
            setTimeout(() => {
                this.animations.push({
                    type: 'lightBeam',
                    x: centerX,
                    y: centerY,
                    angle: angle,
                    length: 0,
                    maxLength: Math.max(window.innerWidth, window.innerHeight),
                    color: i % 2 === 0 ? color : secondaryColor,
                    width: 8,
                    startTime: Date.now(),
                    duration: 600,
                    alive: true
                });
                this.ensureLoop();
            }, delay);
        }
        
        // 3. 각 타겟에 검격 연출
        targets.forEach((target, index) => {
            const delay = 400 + index * 150;
            
            setTimeout(() => {
                // 삼각형 검격 패턴 (트라이포스 모양)
                this.triforceSlash(target.x, target.y, { 
                    color: color, 
                    secondaryColor: secondaryColor,
                    size: 200 
                });
                
                // 충격파
                this.shockwave(target.x, target.y, { 
                    color: secondaryColor, 
                    size: 300 
                });
                
                // 스파크 폭발
                this.sparks(target.x, target.y, { 
                    color: color, 
                    count: 30, 
                    speed: 500 
                });
                this.sparks(target.x, target.y, { 
                    color: secondaryColor, 
                    count: 20, 
                    speed: 400 
                });
            }, delay);
        });
        
        // 4. 마무리 충격파 (전체)
        setTimeout(() => {
            this.animations.push({
                type: 'finalWave',
                x: centerX,
                y: centerY,
                radius: 0,
                maxRadius: Math.max(window.innerWidth, window.innerHeight),
                color: color,
                secondaryColor: secondaryColor,
                startTime: Date.now(),
                duration: 800,
                alive: true
            });
            this.ensureLoop();
            
            // 황금 파티클 비
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const x = Math.random() * window.innerWidth;
                    this.particles.push({
                        x: x,
                        y: -20,
                        vx: (Math.random() - 0.5) * 100,
                        vy: 200 + Math.random() * 300,
                        size: 3 + Math.random() * 5,
                        color: Math.random() > 0.5 ? color : secondaryColor,
                        alpha: 1,
                        decay: 0.005,
                        gravity: 100,
                        alive: true
                    });
                    this.ensureLoop();
                }, i * 20);
            }
        }, 800);
    },
    
    // 트라이포스 모양 검격
    triforceSlash(x, y, options = {}) {
        const {
            color = '#00ff88',
            secondaryColor = '#ffd700',
            size = 150,
            duration = 500
        } = options;
        
        this.ensureLoop();
        
        // 삼각형 3변의 슬래시
        const angles = [
            -Math.PI / 2,           // 위
            Math.PI / 6,            // 오른쪽 아래
            Math.PI * 5 / 6         // 왼쪽 아래
        ];
        
        angles.forEach((angle, i) => {
            setTimeout(() => {
                // 메인 슬래시
                this.animations.push({
                    type: 'triforceBeam',
                    x: x,
                    y: y,
                    angle: angle,
                    length: 0,
                    maxLength: size,
                    color: color,
                    secondaryColor: secondaryColor,
                    width: 12,
                    startTime: Date.now(),
                    duration: duration,
                    alive: true
                });
                
                // 스파크
                const endX = x + Math.cos(angle) * size * 0.8;
                const endY = y + Math.sin(angle) * size * 0.8;
                this.sparks(endX, endY, { 
                    color: secondaryColor, 
                    count: 8, 
                    speed: 200 
                });
                
                this.ensureLoop();
            }, i * 80);
        });
        
        // 중앙 임팩트
        setTimeout(() => {
            this.impact(x, y, { color: secondaryColor, size: size * 0.8 });
        }, 250);
    },
    
    // 마스터 소드용 애니메이션 렌더링 (loop에서 호출)
    renderMasterSwordEffects(anim) {
        const progress = Math.min(1, (Date.now() - anim.startTime) / anim.duration);
        
        switch (anim.type) {
            case 'masterFlash':
                // 화면 전체 플래시
                const flashAlpha = Math.sin(progress * Math.PI) * 0.6;
                this.ctx.fillStyle = `rgba(255, 215, 0, ${flashAlpha})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
                
            case 'lightBeam':
                // 방사형 빛줄기
                const beamProgress = this.easeOutQuart(progress);
                const beamLength = anim.maxLength * beamProgress;
                const beamAlpha = 1 - progress;
                
                const endX = anim.x + Math.cos(anim.angle) * beamLength;
                const endY = anim.y + Math.sin(anim.angle) * beamLength;
                
                // 글로우
                const gradient = this.ctx.createLinearGradient(anim.x, anim.y, endX, endY);
                gradient.addColorStop(0, `${anim.color}00`);
                gradient.addColorStop(0.3, anim.color);
                gradient.addColorStop(1, `${anim.color}00`);
                
                this.ctx.save();
                this.ctx.globalAlpha = beamAlpha;
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = anim.width * (1 - progress * 0.5);
                this.ctx.lineCap = 'round';
                this.ctx.shadowColor = anim.color;
                this.ctx.shadowBlur = 30;
                
                this.ctx.beginPath();
                this.ctx.moveTo(anim.x, anim.y);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                this.ctx.restore();
                break;
                
            case 'triforceBeam':
                // 트라이포스 검격 빔
                const triProgress = this.easeOutQuart(progress);
                const triLength = anim.maxLength * triProgress;
                const triAlpha = 1 - this.easeInQuad(progress);
                
                const triEndX = anim.x + Math.cos(anim.angle) * triLength;
                const triEndY = anim.y + Math.sin(anim.angle) * triLength;
                
                this.ctx.save();
                this.ctx.globalAlpha = triAlpha;
                
                // 외곽 글로우
                this.ctx.strokeStyle = anim.secondaryColor;
                this.ctx.lineWidth = anim.width + 8;
                this.ctx.lineCap = 'round';
                this.ctx.shadowColor = anim.secondaryColor;
                this.ctx.shadowBlur = 40;
                
                this.ctx.beginPath();
                this.ctx.moveTo(anim.x, anim.y);
                this.ctx.lineTo(triEndX, triEndY);
                this.ctx.stroke();
                
                // 내부 코어
                this.ctx.strokeStyle = anim.color;
                this.ctx.lineWidth = anim.width;
                this.ctx.shadowColor = anim.color;
                this.ctx.shadowBlur = 20;
                
                this.ctx.beginPath();
                this.ctx.moveTo(anim.x, anim.y);
                this.ctx.lineTo(triEndX, triEndY);
                this.ctx.stroke();
                
                // 중심 하이라이트
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = anim.width * 0.3;
                this.ctx.shadowBlur = 0;
                
                this.ctx.beginPath();
                this.ctx.moveTo(anim.x, anim.y);
                this.ctx.lineTo(triEndX, triEndY);
                this.ctx.stroke();
                
                this.ctx.restore();
                break;
                
            case 'finalWave':
                // 최종 충격파
                const waveProgress = this.easeOutQuart(progress);
                const waveRadius = anim.maxRadius * waveProgress;
                const waveAlpha = (1 - progress) * 0.5;
                
                this.ctx.save();
                
                // 외곽 링
                for (let i = 0; i < 3; i++) {
                    const ringRadius = waveRadius - i * 30;
                    if (ringRadius > 0) {
                        this.ctx.beginPath();
                        this.ctx.arc(anim.x, anim.y, ringRadius, 0, Math.PI * 2);
                        this.ctx.strokeStyle = i === 1 ? anim.secondaryColor : anim.color;
                        this.ctx.lineWidth = 4 - i;
                        this.ctx.globalAlpha = waveAlpha * (1 - i * 0.3);
                        this.ctx.shadowColor = this.ctx.strokeStyle;
                        this.ctx.shadowBlur = 20;
                        this.ctx.stroke();
                    }
                }
                
                this.ctx.restore();
                break;
        }
        
        if (progress >= 1) {
            anim.alive = false;
        }
    },
    
    // 이징 함수들
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    },
    
    easeInQuad(t) {
        return t * t;
    },
    
    // ==========================================
    // 혈흔 이펙트 시스템 (고어)
    // ==========================================
    
    // 피 튀김 (혈흔 스플래터)
    bloodSplatter(x, y, options = {}) {
        const {
            count = 15,
            speed = 300,
            size = 8,
            gravity = 500,
            duration = 800,
            color = '#8b0000',  // 진한 빨강
            secondaryColor = '#dc143c'  // 밝은 빨강
        } = options;
        
        this.ensureLoop();
        
        // 피 방울들
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (0.3 + Math.random() * 0.7);
            const particleSize = size * (0.5 + Math.random() * 1.0);
            const useSecondary = Math.random() > 0.6;
            
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 100, // 위로 튀어오름
                size: particleSize,
                originalSize: particleSize,
                color: useSecondary ? secondaryColor : color,
                gravity,
                life: 1.0,
                decay: 1.0 / (duration / 16),
                type: 'blood',
                trail: [],
                maxTrail: 5,
                
                update(dt) {
                    // 중력 적용
                    this.vy += this.gravity * dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    
                    // 궤적 저장
                    this.trail.push({ x: this.x, y: this.y, size: this.size * 0.7 });
                    if (this.trail.length > this.maxTrail) {
                        this.trail.shift();
                    }
                    
                    // 감속
                    this.vx *= 0.98;
                    this.life -= this.decay;
                    this.size = this.originalSize * this.life;
                },
                
                draw(ctx) {
                    // 궤적 그리기
                    this.trail.forEach((t, i) => {
                        const alpha = (i / this.trail.length) * this.life * 0.5;
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        ctx.beginPath();
                        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    });
                    
                    // 메인 방울
                    ctx.save();
                    ctx.globalAlpha = this.life;
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
    
    // 피 슬래시 (베기 흔적)
    bloodSlash(x, y, options = {}) {
        const {
            color = '#8b0000',
            length = 200,
            width = 25,
            angle = -30,
            duration = 400
        } = options;
        
        this.ensureLoop();
        
        // 랜덤 각도 변화
        const finalAngle = angle + (Math.random() - 0.5) * 40;
        
        this.animations.push({
            x, y,
            length,
            width,
            angle: finalAngle * Math.PI / 180,
            progress: 0,
            duration,
            color,
            startTime: Date.now(),
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                this.progress = Math.min(1, elapsed / this.duration);
                if (this.progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                const drawProgress = Math.min(this.progress * 2, 1);
                const fadeProgress = Math.max(0, (this.progress - 0.5) * 2);
                
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                
                const currentLength = this.length * drawProgress;
                
                // 혈흔 그라데이션
                const gradient = ctx.createLinearGradient(-currentLength/2, 0, currentLength/2, 0);
                gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
                gradient.addColorStop(0.2, this.color);
                gradient.addColorStop(0.5, '#dc143c');
                gradient.addColorStop(0.8, this.color);
                gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                
                ctx.globalAlpha = 1 - fadeProgress;
                ctx.strokeStyle = gradient;
                ctx.lineWidth = this.width * (1 - fadeProgress * 0.5);
                ctx.lineCap = 'round';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                
                ctx.beginPath();
                ctx.moveTo(-currentLength/2, 0);
                ctx.lineTo(currentLength/2, 0);
                ctx.stroke();
                
                // 피 방울 효과 (가장자리)
                if (drawProgress > 0.5) {
                    ctx.fillStyle = this.color;
                    for (let i = 0; i < 3; i++) {
                        const dropX = (Math.random() - 0.5) * currentLength;
                        const dropY = (Math.random() - 0.5) * this.width;
                        const dropSize = 2 + Math.random() * 4;
                        ctx.beginPath();
                        ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                ctx.restore();
            }
        });
        
        // 피 튀김 추가
        this.bloodSplatter(x, y, { count: 8, speed: 200, size: 5 });
    },
    
    // 임팩트 혈흔 (타격 시)
    bloodImpact(x, y, options = {}) {
        const {
            size = 100,
            color = '#8b0000',
            duration = 500
        } = options;
        
        this.ensureLoop();
        
        // 혈흔 폭발 링
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: size,
            alpha: 1,
            startTime: Date.now(),
            duration,
            color,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min(1, elapsed / this.duration);
                
                // 빠르게 확장 후 감속
                const eased = 1 - Math.pow(1 - progress, 3);
                this.radius = this.maxRadius * eased;
                this.alpha = 1 - progress;
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha * 0.7;
                
                // 혈흔 링
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                gradient.addColorStop(0, 'rgba(220, 20, 60, 0.8)');
                gradient.addColorStop(0.5, 'rgba(139, 0, 0, 0.5)');
                gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 내부 핵
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = '#dc143c';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // 피 튀김
        this.bloodSplatter(x, y, { count: 20, speed: 350, size: 6 });
        
        // 작은 피 방울들
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = size * 0.5;
            const dropX = x + Math.cos(angle) * dist;
            const dropY = y + Math.sin(angle) * dist;
            
            setTimeout(() => {
                this.bloodSplatter(dropX, dropY, { count: 5, speed: 150, size: 4 });
            }, i * 30);
        }
    },
    
    // X자 혈흔 슬래시 (크로스 슬래시)
    bloodCrossSlash(x, y, options = {}) {
        const {
            size = 150,
            color = '#8b0000',
            duration = 500
        } = options;
        
        // 두 방향 슬래시
        this.bloodSlash(x, y, { ...options, angle: -45, length: size });
        setTimeout(() => {
            this.bloodSlash(x, y, { ...options, angle: 45, length: size });
        }, 80);
        
        // 중앙 임팩트
        setTimeout(() => {
            this.bloodImpact(x, y, { size: size * 0.6, duration: 400 });
        }, 150);
    },
    
    // 연속 타격 혈흔
    bloodCombo(x, y, hitCount = 3, options = {}) {
        const {
            interval = 100,
            spread = 50
        } = options;
        
        for (let i = 0; i < hitCount; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * spread * 2;
                const offsetY = (Math.random() - 0.5) * spread * 2;
                this.bloodSlash(x + offsetX, y + offsetY, {
                    length: 120 + Math.random() * 80,
                    angle: Math.random() * 360
                });
            }, i * interval);
        }
    },
    
    // 헤비 임팩트 (강타, 묵직한 일격)
    bloodHeavyImpact(x, y, options = {}) {
        const {
            size = 200,
            duration = 700
        } = options;
        
        // 큰 혈흔 임팩트
        this.bloodImpact(x, y, { size, duration });
        
        // 다중 슬래시
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * 360;
            setTimeout(() => {
                this.bloodSlash(x, y, { 
                    angle, 
                    length: size * 0.8,
                    width: 30
                });
            }, i * 50);
        }
        
        // 대량 피 튀김
        this.bloodSplatter(x, y, { 
            count: 40, 
            speed: 500, 
            size: 10,
            duration: 1000
        });
        
        // Blood 사운드 재생
        this.playBloodSound();
    },
    
    // 크리티컬 혈흔
    bloodCritical(x, y, options = {}) {
        const {
            size = 180
        } = options;
        
        // 화면 플래시 (붉은색)
        this.screenFlash('#ff0000', 100);
        
        // X 슬래시
        this.bloodCrossSlash(x, y, { size });
        
        // 추가 방사형 슬래시
        setTimeout(() => {
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * 360 + 30;
                this.bloodSlash(x, y, {
                    angle,
                    length: size * 0.6,
                    width: 15,
                    duration: 300
                });
            }
        }, 200);
        
        // 대량 피 분출
        this.bloodSplatter(x, y, {
            count: 50,
            speed: 600,
            size: 12,
            duration: 1200
        });
        
        // Blood 사운드 재생
        this.playBloodSound();
    },
    
    // 화면 플래시 (색상 지정 가능)
    screenFlash(color = '#ffffff', duration = 100) {
        this.ensureLoop();
        
        this.animations.push({
            alpha: 0.5,
            color,
            startTime: Date.now(),
            duration,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                this.alpha = 0.5 * (1 - progress);
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 절단 효과 (적 사망 시) - 실제 이미지 사용
    // ==========================================
    
    // 이미지 설정 (외부에서 호출)
    setDismemberImage(imgSrc) {
        this._dismemberImg = new Image();
        this._dismemberImg.src = imgSrc;
    },
    
    // 몸체 절단 (상반신/하반신 분리) - 실제 이미지 사용
    dismember(x, y, options = {}) {
        const {
            width = 100,
            height = 150,
            duration = 1500,
            imgSrc = null  // 적 이미지 소스
        } = options;
        
        const self = this;  // this 참조 저장
        self.ensureLoop();
        
        console.log('[VFX] dismember 호출:', { x, y, width, height, imgSrc });
        
        // 이미지 로드
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let hasImage = false;
        
        if (imgSrc) {
            img.src = imgSrc;
            hasImage = true;
            console.log('[VFX] 이미지 로드 시작:', imgSrc);
        }
        
        // 화면 붉은 플래시
        self.screenFlash('#ff0000', 150);
        
        // 절단선 이펙트
        self.animations.push({
            x, y,
            lineWidth: 0,
            maxWidth: width * 2,
            alpha: 1,
            startTime: Date.now(),
            duration: 200,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                this.lineWidth = this.maxWidth * Math.min(1, progress * 2);
                this.alpha = 1 - Math.max(0, (progress - 0.5) * 2);
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 8;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.moveTo(this.x - this.lineWidth/2, this.y);
                ctx.lineTo(this.x + this.lineWidth/2, this.y);
                ctx.stroke();
                
                ctx.strokeStyle = '#dc143c';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // 파편은 약간의 딜레이 후 생성 (다른 이펙트 후에 보이도록)
        setTimeout(() => {
            console.log('[VFX] 파편 생성 시작, hasImage:', hasImage, 'img.complete:', img.complete);
            
            // 상반신 파편 (위로 튕겨나감) - 이미지 상단 절반
            self.animations.push({
                x, y: y - height/4,
                vx: (Math.random() - 0.5) * 150,  // 좌우로도 튕김
                vy: -350 - Math.random() * 100,   // 더 세게 위로
                vr: (Math.random() - 0.5) * 8,    // 더 많이 회전
                rotation: 0,
                width: width,
                height: height/2,
                alpha: 1,
                startTime: Date.now(),
                duration: duration + 500,  // 더 오래 지속
                img,
                hasImage,
                imgWidth: width,
                imgHeight: height,
                isTop: true,
                gravity: 600,  // 중력
                bounced: false,
                groundY: y + height/2 + 100,  // 바닥 위치
                zIndex: 9999,  // 높은 z-index
                alive: true,
                
                update() {
                    const elapsed = Date.now() - this.startTime;
                    const timeScale = this._timeScale || 1;
                    const dt = 0.016 * timeScale;
                    
                    // 물리 적용
                    this.vy += this.gravity * dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.rotation += this.vr * dt;
                    
                    // 바닥 바운스
                    if (this.y > this.groundY && !this.bounced) {
                        this.bounced = true;
                        this.vy = -this.vy * 0.3;  // 반발
                        this.vr *= 0.5;
                    }
                    
                    // 마찰
                    this.vx *= 0.995;
                    
                    const progress = elapsed / this.duration;
                    if (progress > 0.6) {
                        this.alpha = 1 - (progress - 0.6) / 0.4;
                    }
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha;
                    
                    // 그림자
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 5;
                    ctx.shadowOffsetY = 5;
                    
                    if (this.hasImage && this.img.complete) {
                        ctx.drawImage(
                            this.img,
                            0, 0,
                            this.img.width, this.img.height/2,
                            -this.imgWidth/2, -this.height/2,
                            this.imgWidth, this.height
                        );
                        
                        // 절단면 혈흔 (아래쪽)
                        ctx.shadowColor = 'transparent';
                        const gradient = ctx.createLinearGradient(0, this.height/2 - 30, 0, this.height/2);
                        gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
                        gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.9)');
                        gradient.addColorStop(1, '#8b0000');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(-this.imgWidth/2, this.height/2 - 30, this.imgWidth, 30);
                    } else {
                        ctx.fillStyle = '#1a0000';
                        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                    }
                    
                    ctx.restore();
                }
            });
            
            // 하반신 파편 (아래로 떨어짐) - 이미지 하단 절반
            self.animations.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + height/4,
                vx: (Math.random() - 0.5) * 100,
                vy: -50 + Math.random() * 50,  // 살짝 위로 튕긴 후 떨어짐
                vr: (Math.random() - 0.5) * 6,
                rotation: 0,
                width: width,
                height: height/2,
                alpha: 1,
                startTime: Date.now(),
                duration: duration + 500,
                img,
                hasImage,
                imgWidth: width,
                imgHeight: height,
                isTop: false,
                gravity: 800,  // 더 강한 중력
                groundY: y + height/2 + 80,
                bounced: false,
                zIndex: 9999,
                alive: true,
                
                update() {
                    const elapsed = Date.now() - this.startTime;
                    const timeScale = this._timeScale || 1;
                    const dt = 0.016 * timeScale;
                    
                    this.vy += this.gravity * dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.rotation += this.vr * dt;
                    
                    // 바닥 바운스
                    if (this.y > this.groundY && !this.bounced) {
                        this.bounced = true;
                        this.vy = -this.vy * 0.2;
                        this.vr *= 0.3;
                    }
                    
                    this.vx *= 0.99;
                    
                    const progress = elapsed / this.duration;
                    if (progress > 0.6) {
                        this.alpha = 1 - (progress - 0.6) / 0.4;
                    }
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha;
                    
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 5;
                    ctx.shadowOffsetY = 5;
                    
                    if (this.hasImage && this.img.complete) {
                        ctx.drawImage(
                            this.img,
                            0, this.img.height/2,
                            this.img.width, this.img.height/2,
                            -this.imgWidth/2, -this.height/2,
                            this.imgWidth, this.height
                        );
                        
                        ctx.shadowColor = 'transparent';
                        const gradient = ctx.createLinearGradient(0, -this.height/2, 0, -this.height/2 + 30);
                        gradient.addColorStop(0, '#8b0000');
                        gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.9)');
                        gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(-this.imgWidth/2, -this.height/2, this.imgWidth, 30);
                    } else {
                        ctx.fillStyle = '#1a0000';
                        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                    }
                    
                    ctx.restore();
                }
            });
            
            self.ensureLoop();
        }, 50);  // 50ms 딜레이로 다른 이펙트 후에 생성
        
        // 대량 피 분출
        self.bloodSplatter(x, y, { count: 60, speed: 500, size: 12, duration: 1200 });
        self.bloodSplatter(x, y - 30, { count: 30, speed: 400, size: 8 });
        self.bloodSplatter(x, y + 30, { count: 30, speed: 300, size: 8 });
        
        // 피 웅덩이 (바닥)
        setTimeout(() => {
            self.bloodPool(x, y + height/2 + 50);
        }, 500);
    },
    
    // 피 웅덩이
    bloodPool(x, y, options = {}) {
        const {
            size = 80,
            duration = 3000
        } = options;
        
        this.ensureLoop();
        
        this.animations.push({
            x, y,
            radius: 0,
            maxRadius: size,
            alpha: 0.8,
            startTime: Date.now(),
            duration,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 빠르게 확장 후 천천히 페이드
                if (progress < 0.2) {
                    this.radius = this.maxRadius * (progress / 0.2);
                } else {
                    this.radius = this.maxRadius;
                }
                
                if (progress > 0.7) {
                    this.alpha = 0.8 * (1 - (progress - 0.7) / 0.3);
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                // 타원형 피 웅덩이
                ctx.fillStyle = '#4a0000';
                ctx.shadowColor = '#8b0000';
                ctx.shadowBlur = 15;
                
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 반사광
                ctx.fillStyle = 'rgba(220, 20, 60, 0.3)';
                ctx.beginPath();
                ctx.ellipse(this.x - this.radius * 0.2, this.y - this.radius * 0.1, 
                           this.radius * 0.3, this.radius * 0.15, -0.3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
    },
    
    // 수직 절단 (세로로 반 가르기) - 실제 이미지 사용
    verticalDismember(x, y, options = {}) {
        const {
            width = 100,
            height = 150,
            duration = 1500,
            imgSrc = null
        } = options;
        
        const self = this;
        self.ensureLoop();
        
        console.log('[VFX] verticalDismember 호출:', { x, y, width, height, imgSrc });
        
        // 이미지 로드
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let hasImage = false;
        
        if (imgSrc) {
            img.src = imgSrc;
            hasImage = true;
        }
        
        self.screenFlash('#ff0000', 150);
        
        // 수직 절단선
        self.animations.push({
            x, y,
            lineHeight: 0,
            maxHeight: height * 1.5,
            alpha: 1,
            startTime: Date.now(),
            duration: 200,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                this.lineHeight = this.maxHeight * Math.min(1, progress * 2);
                this.alpha = 1 - Math.max(0, (progress - 0.5) * 2);
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 8;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.lineHeight/2);
                ctx.lineTo(this.x, this.y + this.lineHeight/2);
                ctx.stroke();
                
                ctx.strokeStyle = '#dc143c';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // 파편은 약간의 딜레이 후 생성
        setTimeout(() => {
            // 왼쪽 반쪽 - 세게 왼쪽으로 튕겨나감
            self.animations.push({
                x: x - width/4, y,
                vx: -280 - Math.random() * 80,  // 세게 왼쪽으로
                vy: -120 - Math.random() * 80,  // 위로 튕김
                vr: -4 - Math.random() * 4,     // 왼쪽으로 회전
                rotation: 0,
                width: width/2,
                height: height,
                alpha: 1,
                startTime: Date.now(),
                duration: duration + 500,
                img,
                hasImage,
                imgWidth: width,
                imgHeight: height,
                isLeft: true,
                gravity: 500,
                groundY: y + height/2 + 100,
                bounced: false,
                zIndex: 9999,
                alive: true,
                
                update() {
                    const elapsed = Date.now() - this.startTime;
                    const timeScale = this._timeScale || 1;
                    const dt = 0.016 * timeScale;
                    
                    this.vy += this.gravity * dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.rotation += this.vr * dt;
                    
                    if (this.y > this.groundY && !this.bounced) {
                        this.bounced = true;
                        this.vy = -this.vy * 0.25;
                        this.vr *= 0.4;
                    }
                    
                    this.vx *= 0.995;
                    
                    const progress = elapsed / this.duration;
                    if (progress > 0.6) {
                        this.alpha = 1 - (progress - 0.6) / 0.4;
                    }
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha;
                    
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 5;
                    ctx.shadowOffsetY = 5;
                    
                    if (this.hasImage && this.img.complete) {
                        ctx.drawImage(
                            this.img,
                            0, 0,
                            this.img.width/2, this.img.height,
                            -this.width/2, -this.height/2,
                            this.width, this.height
                        );
                        
                        ctx.shadowColor = 'transparent';
                        const gradient = ctx.createLinearGradient(this.width/2 - 25, 0, this.width/2, 0);
                        gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
                        gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.9)');
                        gradient.addColorStop(1, '#8b0000');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(this.width/2 - 25, -this.height/2, 25, this.height);
                    } else {
                        ctx.fillStyle = '#1a0000';
                        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                    }
                    
                    ctx.restore();
                }
            });
            
            // 오른쪽 반쪽 - 세게 오른쪽으로 튕겨나감
            self.animations.push({
                x: x + width/4, y,
                vx: 280 + Math.random() * 80,   // 세게 오른쪽으로
                vy: -100 - Math.random() * 80,  // 위로 튕김
                vr: 4 + Math.random() * 4,      // 오른쪽으로 회전
                rotation: 0,
                width: width/2,
                height: height,
                alpha: 1,
                startTime: Date.now(),
                duration: duration + 500,
                img,
                hasImage,
                imgWidth: width,
                imgHeight: height,
                isLeft: false,
                gravity: 500,
                groundY: y + height/2 + 100,
                bounced: false,
                zIndex: 9999,
                alive: true,
                
                update() {
                    const elapsed = Date.now() - this.startTime;
                    const timeScale = this._timeScale || 1;
                    const dt = 0.016 * timeScale;
                    
                    this.vy += this.gravity * dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.rotation += this.vr * dt;
                    
                    if (this.y > this.groundY && !this.bounced) {
                        this.bounced = true;
                        this.vy = -this.vy * 0.25;
                        this.vr *= 0.4;
                    }
                    
                    this.vx *= 0.995;
                    
                    const progress = elapsed / this.duration;
                    if (progress > 0.6) {
                        this.alpha = 1 - (progress - 0.6) / 0.4;
                    }
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha;
                    
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 5;
                    ctx.shadowOffsetY = 5;
                    
                    if (this.hasImage && this.img.complete) {
                        ctx.drawImage(
                            this.img,
                            this.img.width/2, 0,
                            this.img.width/2, this.img.height,
                            -this.width/2, -this.height/2,
                            this.width, this.height
                        );
                        
                        ctx.shadowColor = 'transparent';
                        const gradient = ctx.createLinearGradient(-this.width/2, 0, -this.width/2 + 25, 0);
                        gradient.addColorStop(0, '#8b0000');
                        gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.9)');
                        gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(-this.width/2, -this.height/2, 25, this.height);
                    } else {
                        ctx.fillStyle = '#1a0000';
                        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                    }
                    
                    ctx.restore();
                }
            });
            
            self.ensureLoop();
        }, 50);
        
        // 피 분출
        self.bloodSplatter(x, y, { count: 50, speed: 450, size: 10, duration: 1000 });
        
        setTimeout(() => {
            self.bloodPool(x, y + height/2 + 40);
        }, 400);
    },
    
    // 폭발 절단 (사방으로 터짐) - 실제 이미지 사용
    explodeDismember(x, y, options = {}) {
        const {
            size = 100,
            duration = 1500,
            imgSrc = null
        } = options;
        
        const self = this;
        self.ensureLoop();
        
        console.log('[VFX] explodeDismember 호출:', { x, y, size, imgSrc });
        
        // 이미지 로드
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let hasImage = false;
        
        if (imgSrc) {
            img.src = imgSrc;
            hasImage = true;
        }
        
        // 강렬한 플래시
        self.screenFlash('#ff0000', 200);
        
        // 폭발 코어
        self.bloodImpact(x, y, { size: size * 1.5, duration: 400 });
        
        // 4조각으로 터짐 (각 사분면)
        const pieces = [
            { dx: -1, dy: -1, srcX: 0, srcY: 0 },         // 좌상
            { dx: 1, dy: -1, srcX: 0.5, srcY: 0 },        // 우상
            { dx: -1, dy: 1, srcX: 0, srcY: 0.5 },        // 좌하
            { dx: 1, dy: 1, srcX: 0.5, srcY: 0.5 }        // 우하
        ];
        
        // 파편은 약간의 딜레이 후 생성 (폭발 효과 후)
        setTimeout(() => {
            pieces.forEach((piece, i) => {
                // 각 조각마다 시간차
                setTimeout(() => {
                    self.animations.push({
                        x, y,
                        vx: piece.dx * (350 + Math.random() * 150),  // 더 세게 터짐
                        vy: piece.dy * (300 + Math.random() * 150) - 200,  // 위로 더 많이
                        vr: (Math.random() - 0.5) * 15,  // 더 많이 회전
                        rotation: Math.random() * Math.PI * 2,
                        size: size * 0.55,
                        alpha: 1,
                        startTime: Date.now(),
                        duration: duration + 800,  // 더 오래 지속
                        img,
                        hasImage,
                        srcX: piece.srcX,
                        srcY: piece.srcY,
                        gravity: 450,
                        groundY: y + size + 120,
                        bounceCount: 0,
                        maxBounces: 2,  // 2번까지 바운스
                        zIndex: 9999,
                        alive: true,
                        
                        update() {
                            const elapsed = Date.now() - this.startTime;
                            const timeScale = this._timeScale || 1;
                            const dt = 0.016 * timeScale;
                            
                            this.vy += this.gravity * dt;
                            this.x += this.vx * dt;
                            this.y += this.vy * dt;
                            this.rotation += this.vr * dt;
                            
                            // 다중 바운스
                            if (this.y > this.groundY && this.bounceCount < this.maxBounces) {
                                this.bounceCount++;
                                this.y = this.groundY;
                                this.vy = -this.vy * (0.4 - this.bounceCount * 0.1);
                                this.vr *= 0.5;
                                this.vx *= 0.7;
                            }
                            
                            this.vx *= 0.995;
                            
                            const progress = elapsed / this.duration;
                            if (progress > 0.5) {
                                this.alpha = 1 - (progress - 0.5) / 0.5;
                            }
                            if (progress >= 1) this.alive = false;
                        },
                        
                        draw(ctx) {
                            ctx.save();
                            ctx.translate(this.x, this.y);
                            ctx.rotate(this.rotation);
                            ctx.globalAlpha = this.alpha;
                            
                            // 그림자
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                            ctx.shadowBlur = 20;
                            ctx.shadowOffsetX = 8;
                            ctx.shadowOffsetY = 8;
                            
                            if (this.hasImage && this.img.complete) {
                                ctx.drawImage(
                                    this.img,
                                    this.img.width * this.srcX,
                                    this.img.height * this.srcY,
                                    this.img.width / 2,
                                    this.img.height / 2,
                                    -this.size/2, -this.size/2,
                                    this.size, this.size
                                );
                                
                                // 절단면 혈흔 (모든 테두리)
                                ctx.shadowColor = 'transparent';
                                ctx.strokeStyle = '#8b0000';
                                ctx.lineWidth = 6;
                                ctx.shadowColor = '#dc143c';
                                ctx.shadowBlur = 15;
                                ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
                            } else {
                                ctx.fillStyle = '#1a0000';
                                ctx.shadowColor = '#dc143c';
                                ctx.shadowBlur = 15;
                                
                                ctx.beginPath();
                                ctx.moveTo(0, -this.size/2);
                                ctx.lineTo(this.size/2, 0);
                                ctx.lineTo(this.size/4, this.size/2);
                                ctx.lineTo(-this.size/3, this.size/3);
                                ctx.lineTo(-this.size/2, -this.size/4);
                                ctx.closePath();
                                ctx.fill();
                            }
                            
                            ctx.restore();
                        }
                    });
                    
                    self.ensureLoop();
                }, i * 30);  // 각 조각 시차 생성
                
                // 각 조각에서 피 흘리기 (더 많이, 더 오래)
                setTimeout(() => {
                    const pieceX = x + piece.dx * 100;
                    const pieceY = y + piece.dy * 80;
                    self.bloodSplatter(pieceX, pieceY, { count: 15, speed: 200, size: 6 });
                }, 150 + i * 80);
            });
        }, 80);  // 폭발 후 딜레이
        
        // 대량 피
        self.bloodSplatter(x, y, { count: 80, speed: 600, size: 15, duration: 1500 });
        
        // 피 웅덩이
        setTimeout(() => {
            self.bloodPool(x, y + size, { size: 100 });
        }, 600);
    },
    
    // 랜덤 절단 효과 (확률적 선택)
    randomDismember(x, y, options = {}) {
        const rand = Math.random();
        
        if (rand < 0.4) {
            // 40% - 수평 절단
            this.dismember(x, y, options);
        } else if (rand < 0.7) {
            // 30% - 수직 절단
            this.verticalDismember(x, y, options);
        } else {
            // 30% - 폭발
            this.explodeDismember(x, y, options);
        }
    },
    
    // 적 이미지 소스 추출 헬퍼
    getEnemyImageSrc(enemyEl) {
        if (!enemyEl) return null;
        
        // 스프라이트 이미지 찾기
        const spriteImg = enemyEl.querySelector('.enemy-sprite-img, img');
        if (spriteImg && spriteImg.src) {
            return spriteImg.src;
        }
        
        return null;
    },
    
    // ==========================================
    // 🏃 스피드 라인 (대시 효과)
    // ==========================================
    speedLine(x, y, options = {}) {
        const {
            color = '#e2e8f0',
            length = 80,
            thickness = 2,
            angle = 0, // 0 = 수평
            duration = 200
        } = options;
        
        if (!this.ctx) this.init();
        this.startLoop();
        
        const startTime = Date.now();
        const rad = angle * Math.PI / 180;
        
        // 시작점과 끝점 계산
        const endX = x + Math.cos(rad) * length;
        const endY = y + Math.sin(rad) * length;
        
        this.animations.push({
            type: 'speedLine',
            startTime,
            duration,
            x, y, endX, endY,
            color, thickness,
            render: (ctx, progress) => {
                const fadeOut = 1 - progress;
                const stretch = 0.3 + progress * 0.7; // 늘어나는 효과
                
                ctx.save();
                ctx.globalAlpha = fadeOut * 0.8;
                
                // 그라데이션 라인
                const gradient = ctx.createLinearGradient(
                    x, y, 
                    x + (endX - x) * stretch, 
                    y + (endY - y) * stretch
                );
                gradient.addColorStop(0, 'transparent');
                gradient.addColorStop(0.3, color);
                gradient.addColorStop(1, color);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = thickness * (1 - progress * 0.5);
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + (endX - x) * stretch,
                    y + (endY - y) * stretch
                );
                ctx.stroke();
                
                ctx.restore();
                
                return progress < 1;
            }
        });
    },
    
    // ==========================================
    // 🌪️ 대시 잔상 (스프라이트 고스트)
    // ==========================================
    dashGhost(x, y, options = {}) {
        const {
            color = '#94a3b8',
            size = 100,
            count = 3,
            direction = 'right', // 'left' or 'right'
            duration = 300
        } = options;
        
        if (!this.ctx) this.init();
        this.startLoop();
        
        const dirMult = direction === 'right' ? 1 : -1;
        
        for (let i = 0; i < count; i++) {
            const delay = i * 50;
            const startX = x - (i * 20 * dirMult);
            const startTime = Date.now() + delay;
            const opacity = 0.6 - (i * 0.15);
            
            this.animations.push({
                type: 'dashGhost',
                startTime,
                duration,
                render: (ctx, progress) => {
                    const fadeOut = 1 - progress;
                    
                    ctx.save();
                    ctx.globalAlpha = opacity * fadeOut;
                    
                    // 실루엣 원
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.ellipse(
                        startX + (progress * 30 * dirMult), 
                        y, 
                        size * 0.4 * (1 - progress * 0.3), 
                        size * 0.6 * (1 - progress * 0.2), 
                        0, 0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    ctx.restore();
                    
                    return progress < 1;
                }
            });
        }
    }
};

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    VFX.init();
});

console.log('[VFX] vfx.js 로드 완료');

