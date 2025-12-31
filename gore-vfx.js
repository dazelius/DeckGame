// ==========================================
// Gore VFX System - 고어/절단 시각 효과
// 오버킬 시스템과 연동되는 절단 및 혈흔 효과
// ==========================================

const GoreVFX = {
    // VFX 캔버스 참조 (VFX.js에서 공유)
    get canvas() { return VFX.canvas; },
    get ctx() { return VFX.ctx; },
    get animations() { return VFX.animations; },
    get particles() { return VFX.particles; },
    
    // 🥩 폴백 이미지 (CORS 실패 시)
    fallbackImage: null,
    fallbackLoaded: false,
    
    // 폴백 이미지 로드
    loadFallbackImage() {
        if (this.fallbackLoaded) return;
        this.fallbackImage = new Image();
        this.fallbackImage.src = 'meat.png';
        this.fallbackImage.onload = () => {
            this.fallbackLoaded = true;
            console.log('[GoreVFX] 🥩 meat.png 폴백 이미지 로드 완료');
        };
        this.fallbackImage.onerror = () => {
            console.log('[GoreVFX] meat.png 로드 실패 - 색상 폴백 사용');
        };
    },
    
    ensureLoop() {
        if (typeof VFX !== 'undefined') {
            VFX.ensureLoop();
        }
    },
    
    // 이미지 로드 헬퍼 (CORS 실패 시 meat.png 폴백)
    loadImageWithFallback(imgSrc, callback) {
        // imgSrc가 없으면 바로 폴백 사용 (로드 시도 안 함)
        if (!imgSrc) {
            if (this.fallbackLoaded && this.fallbackImage) {
                callback(this.fallbackImage, true);
            } else {
                callback(null, false);
            }
            return;
        }
        
        const img = new Image();
        const isFileProtocol = window.location.protocol === 'file:';
        
        if (!isFileProtocol) {
            img.crossOrigin = 'anonymous';
        }
        
        let loadTimeout = null;
        let handled = false;
        
        const handleSuccess = () => {
            if (handled) return;
            handled = true;
            if (loadTimeout) clearTimeout(loadTimeout);
            callback(img, true);
        };
        
        const handleFallback = () => {
            if (handled) return;
            handled = true;
            if (loadTimeout) clearTimeout(loadTimeout);
            
            // meat.png 폴백
            if (this.fallbackLoaded && this.fallbackImage) {
                callback(this.fallbackImage, true);
            } else {
                callback(null, false);
            }
        };
        
        img.onload = handleSuccess;
        img.onerror = handleFallback;
        
        // 타임아웃 (2초 후 폴백) - 더 여유 있게
        loadTimeout = setTimeout(() => {
            if (!handled) {
                console.log('[GoreVFX] 이미지 타임아웃:', imgSrc);
                handleFallback();
            }
        }, 2000);
        
        img.src = imgSrc;
    },
    
    // ==========================================
    // 🩸 피 튀김 효과
    // ==========================================
    bloodSplatter(x, y, options = {}) {
        const {
            count = 30,
            speed = 300,
            size = 8,
            duration = 1000,
            color = '#8b0000'
        } = options;
        
        this.ensureLoop();
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (0.3 + Math.random() * 0.7);
            const particleSize = size * (0.5 + Math.random());
            
            VFX.particles.push({
                x, y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 100,
                size: particleSize,
                originalSize: particleSize,
                alpha: 1,
                color,
                gravity: 800,
                decay: 0.8 / (duration / 1000),
                trail: [],
                maxTrailLength: 5,
                alive: true,
                
                update() {
                    const timeScale = VFX.timeScale || 1;
                    const dt = 0.016 * timeScale;
                    
                    // 트레일 저장
                    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
                    if (this.trail.length > this.maxTrailLength) {
                        this.trail.shift();
                    }
                    
                    this.vy += this.gravity * dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.99;
                    this.alpha -= this.decay * dt;
                    this.size *= 0.995;
                    
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    // 트레일
                    this.trail.forEach((point, i) => {
                        const trailAlpha = (i / this.trail.length) * this.alpha * 0.5;
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, this.size * 0.5, 0, Math.PI * 2);
                        ctx.fillStyle = this.color;
                        ctx.globalAlpha = trailAlpha;
                        ctx.fill();
                    });
                    
                    // 메인 파티클
                    ctx.globalAlpha = this.alpha;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.shadowColor = '#ff0000';
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });
        }
    },
    
    // ==========================================
    // 🗡️ 혈흔 슬래시
    // ==========================================
    bloodSlash(x, y, options = {}) {
        const {
            angle = -30,
            length = 150,
            width = 20,
            duration = 400,
            color = '#dc143c'
        } = options;
        
        this.ensureLoop();
        
        const rad = angle * Math.PI / 180;
        
        VFX.animations.push({
            x, y,
            angle: rad,
            progress: 0,
            length,
            width,
            alpha: 1,
            startTime: Date.now(),
            duration,
            color,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                this.progress = Math.min(1, elapsed / (this.duration * 0.3));
                
                const fadeStart = this.duration * 0.5;
                if (elapsed > fadeStart) {
                    this.alpha = 1 - (elapsed - fadeStart) / (this.duration - fadeStart);
                }
                
                if (elapsed >= this.duration) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.globalAlpha = this.alpha;
                
                const currentLength = this.length * this.progress;
                
                // 글로우
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 30;
                
                // 슬래시 라인
                const gradient = ctx.createLinearGradient(-currentLength/2, 0, currentLength/2, 0);
                gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
                gradient.addColorStop(0.3, this.color);
                gradient.addColorStop(0.7, this.color);
                gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                
                ctx.beginPath();
                ctx.moveTo(-currentLength/2, 0);
                ctx.lineTo(currentLength/2, 0);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = this.width;
                ctx.lineCap = 'round';
                ctx.stroke();
                
                // 중심 하이라이트
                ctx.strokeStyle = 'rgba(255, 200, 200, 0.8)';
                ctx.lineWidth = this.width * 0.3;
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // 피 방울
        this.bloodSplatter(x, y, { count: 15, speed: 200, size: 5 });
    },
    
    // ==========================================
    // 💥 혈흔 충격파
    // ==========================================
    bloodImpact(x, y, options = {}) {
        const {
            size = 100,
            duration = 400,
            color = '#8b0000'
        } = options;
        
        this.ensureLoop();
        
        VFX.animations.push({
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
                const progress = elapsed / this.duration;
                
                this.radius = this.maxRadius * Math.min(1, progress * 1.5);
                this.alpha = 1 - progress;
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                // 외곽 링
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 8;
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                ctx.stroke();
                
                // 내부 채움
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                gradient.addColorStop(0, 'rgba(139, 0, 0, 0.3)');
                gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
                
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // ✖️ X자 혈흔
    // ==========================================
    bloodCrossSlash(x, y, options = {}) {
        const { size = 150, duration = 500 } = options;
        
        this.bloodSlash(x, y, { angle: -45, length: size, duration });
        setTimeout(() => {
            this.bloodSlash(x, y, { angle: 45, length: size, duration });
        }, 50);
        
        this.bloodSplatter(x, y, { count: 40, speed: 400, size: 8 });
    },
    
    // ==========================================
    // 🩸 피 웅덩이
    // ==========================================
    bloodPool(x, y, options = {}) {
        const {
            size = 80,
            duration = 3000
        } = options;
        
        this.ensureLoop();
        
        VFX.animations.push({
            x, y,
            currentSize: 0,
            maxSize: size,
            alpha: 0.8,
            startTime: Date.now(),
            duration,
            alive: true,
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 빠르게 커지다가 천천히
                if (progress < 0.3) {
                    this.currentSize = this.maxSize * (progress / 0.3);
                } else {
                    this.currentSize = this.maxSize;
                }
                
                // 서서히 페이드
                if (progress > 0.7) {
                    this.alpha = 0.8 * (1 - (progress - 0.7) / 0.3);
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                // 타원형 웅덩이
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.currentSize, this.currentSize * 0.4, 0, 0, Math.PI * 2);
                
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentSize);
                gradient.addColorStop(0, '#4a0000');
                gradient.addColorStop(0.5, '#8b0000');
                gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fill();
                
                ctx.restore();
            }
        });
    },
    
    // ==========================================
    // 📺 화면 플래시
    // ==========================================
    screenFlash(color = '#ff0000', duration = 150) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: ${color};
            pointer-events: none;
            z-index: 99999;
            animation: goreFlash ${duration}ms ease-out forwards;
        `;
        
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), duration);
    },
    
    // ==========================================
    // ⚔️ 수평 절단 (상반신/하반신 분리)
    // ==========================================
    dismember(x, y, options = {}) {
        const {
            width = 100,
            height = 150,
            duration = 1500,
            imgSrc = null
        } = options;
        
        const self = this;
        this.ensureLoop();
        
        console.log('[GoreVFX] dismember 호출:', { x, y, width, height, imgSrc });
        
        // 이미지 로드 (CORS 실패 시 meat.png 폴백)
        const img = new Image();
        const isFileProtocol = window.location.protocol === 'file:';
        if (!isFileProtocol) {
            img.crossOrigin = 'anonymous';
        }
        let hasImage = false;
        
        if (imgSrc) {
            img.src = imgSrc;
            hasImage = true;
            // 이미지 로드 실패 시 meat.png 폴백
            img.onerror = () => {
                console.log('[GoreVFX] 이미지 로드 실패, meat.png 폴백');
                if (self.fallbackLoaded && self.fallbackImage) {
                    img.src = self.fallbackImage.src;
                }
            };
        } else if (this.fallbackLoaded && this.fallbackImage) {
            // imgSrc 없으면 바로 meat.png 사용
            img.src = this.fallbackImage.src;
            hasImage = true;
        }
        
        // 화면 플래시
        this.screenFlash('#ff0000', 150);
        
        // 절단선 이펙트
        VFX.animations.push({
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
        
        // 파편 생성 (딜레이)
        setTimeout(() => {
            console.log('[GoreVFX] 파편 생성, hasImage:', hasImage);
            
            // 상반신 파편
            VFX.animations.push({
                x, y: y - height/4,
                vx: (Math.random() - 0.5) * 150,
                vy: -350 - Math.random() * 100,
                vr: (Math.random() - 0.5) * 8,
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
                isTop: true,
                gravity: 600,
                bounced: false,
                groundY: y + height/2 + 100,
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
                        this.vy = -this.vy * 0.3;
                        this.vr *= 0.5;
                    }
                    
                    this.vx *= 0.995;
                    
                    const progress = elapsed / this.duration;
                    if (progress > 0.6) {
                        this.alpha = 1 - (progress - 0.6) / 0.4;
                    }
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    try {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.globalAlpha = this.alpha;
                        
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 15;
                        ctx.shadowOffsetX = 5;
                        ctx.shadowOffsetY = 5;
                        
                        // 이미지가 유효한지 확인
                        const imgValid = this.hasImage && this.img.complete && this.img.naturalWidth > 0;
                        
                        if (imgValid) {
                            ctx.drawImage(
                                this.img,
                                0, 0,
                                this.img.width, this.img.height/2,
                                -this.imgWidth/2, -this.height/2,
                                this.imgWidth, this.height
                            );
                            
                            ctx.shadowColor = 'transparent';
                            const gradient = ctx.createLinearGradient(0, this.height/2 - 30, 0, this.height/2);
                            gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
                            gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.9)');
                            gradient.addColorStop(1, '#8b0000');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(-this.imgWidth/2, this.height/2 - 30, this.imgWidth, 30);
                        } else {
                            // 폴백: 검은 실루엣
                            ctx.fillStyle = '#1a0000';
                            ctx.shadowColor = '#8b0000';
                            ctx.shadowBlur = 20;
                            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                            
                            // 절단면
                            const gradient = ctx.createLinearGradient(0, this.height/2 - 20, 0, this.height/2);
                            gradient.addColorStop(0, 'rgba(220, 20, 60, 0)');
                            gradient.addColorStop(1, '#dc143c');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(-this.width/2, this.height/2 - 20, this.width, 20);
                        }
                        
                        ctx.restore();
                    } catch (e) {
                        console.warn('[GoreVFX] draw 에러:', e);
                        ctx.restore();
                    }
                }
            });
            
            // 하반신 파편
            VFX.animations.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + height/4,
                vx: (Math.random() - 0.5) * 100,
                vy: -50 + Math.random() * 50,
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
                gravity: 800,
                groundY: y + height/2 + 80,
                bounced: false,
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
                    try {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.globalAlpha = this.alpha;
                        
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 15;
                        ctx.shadowOffsetX = 5;
                        ctx.shadowOffsetY = 5;
                        
                        const imgValid = this.hasImage && this.img.complete && this.img.naturalWidth > 0;
                        
                        if (imgValid) {
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
                            ctx.shadowColor = '#8b0000';
                            ctx.shadowBlur = 20;
                            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                            
                            const gradient = ctx.createLinearGradient(0, -this.height/2, 0, -this.height/2 + 20);
                            gradient.addColorStop(0, '#dc143c');
                            gradient.addColorStop(1, 'rgba(220, 20, 60, 0)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(-this.width/2, -this.height/2, this.width, 20);
                        }
                        
                        ctx.restore();
                    } catch (e) {
                        console.warn('[GoreVFX] draw 에러:', e);
                        ctx.restore();
                    }
                }
            });
            
            VFX.ensureLoop();
        }, 50);
        
        // 피 분출
        this.bloodSplatter(x, y, { count: 60, speed: 500, size: 12, duration: 1200 });
        this.bloodSplatter(x, y - 30, { count: 30, speed: 400, size: 8 });
        this.bloodSplatter(x, y + 30, { count: 30, speed: 300, size: 8 });
        
        // 피 웅덩이
        setTimeout(() => {
            this.bloodPool(x, y + height/2 + 50);
        }, 500);
    },
    
    // ==========================================
    // ⚔️ 수직 절단 (좌우 분리)
    // ==========================================
    verticalDismember(x, y, options = {}) {
        const {
            width = 100,
            height = 150,
            duration = 1500,
            imgSrc = null
        } = options;
        
        const self = this;
        this.ensureLoop();
        
        console.log('[GoreVFX] verticalDismember 호출:', { x, y, width, height, imgSrc });
        
        const img = new Image();
        const isFileProtocol = window.location.protocol === 'file:';
        if (!isFileProtocol) {
            img.crossOrigin = 'anonymous';
        }
        let hasImage = false;
        
        if (imgSrc) {
            img.src = imgSrc;
            hasImage = true;
            img.onerror = () => {
                console.log('[GoreVFX] verticalDismember 이미지 실패, meat.png 폴백');
                if (self.fallbackLoaded && self.fallbackImage) {
                    img.src = self.fallbackImage.src;
                }
            };
        } else if (this.fallbackLoaded && this.fallbackImage) {
            img.src = this.fallbackImage.src;
            hasImage = true;
        }
        
        this.screenFlash('#ff0000', 150);
        
        // 수직 절단선
        VFX.animations.push({
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
        
        // 파편 생성
        setTimeout(() => {
            // 왼쪽 반쪽
            VFX.animations.push({
                x: x - width/4, y,
                vx: -280 - Math.random() * 80,
                vy: -120 - Math.random() * 80,
                vr: -4 - Math.random() * 4,
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
                    try {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.globalAlpha = this.alpha;
                        
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 15;
                        ctx.shadowOffsetX = 5;
                        ctx.shadowOffsetY = 5;
                        
                        const imgValid = this.hasImage && this.img.complete && this.img.naturalWidth > 0;
                        
                        if (imgValid) {
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
                    } catch (e) {
                        console.warn('[GoreVFX] draw 에러:', e);
                        ctx.restore();
                    }
                }
            });
            
            // 오른쪽 반쪽
            VFX.animations.push({
                x: x + width/4, y,
                vx: 280 + Math.random() * 80,
                vy: -100 - Math.random() * 80,
                vr: 4 + Math.random() * 4,
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
                    try {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.rotation);
                        ctx.globalAlpha = this.alpha;
                        
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 15;
                        ctx.shadowOffsetX = 5;
                        ctx.shadowOffsetY = 5;
                        
                        const imgValid = this.hasImage && this.img.complete && this.img.naturalWidth > 0;
                        
                        if (imgValid) {
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
                    } catch (e) {
                        console.warn('[GoreVFX] draw 에러:', e);
                        ctx.restore();
                    }
                }
            });
            
            VFX.ensureLoop();
        }, 50);
        
        this.bloodSplatter(x, y, { count: 50, speed: 450, size: 10, duration: 1000 });
        
        setTimeout(() => {
            this.bloodPool(x, y + height/2 + 40);
        }, 400);
    },
    
    // ==========================================
    // 💥 폭발 절단 (4조각)
    // ==========================================
    explodeDismember(x, y, options = {}) {
        const {
            size = 100,
            duration = 1500,
            imgSrc = null
        } = options;
        
        const self = this;
        this.ensureLoop();
        
        console.log('[GoreVFX] explodeDismember 호출:', { x, y, size, imgSrc });
        
        const img = new Image();
        const isFileProtocol = window.location.protocol === 'file:';
        if (!isFileProtocol) {
            img.crossOrigin = 'anonymous';
        }
        let hasImage = false;
        
        if (imgSrc) {
            img.src = imgSrc;
            hasImage = true;
            img.onerror = () => {
                console.log('[GoreVFX] explodeDismember 이미지 실패, meat.png 폴백');
                if (self.fallbackLoaded && self.fallbackImage) {
                    img.src = self.fallbackImage.src;
                }
            };
        } else if (this.fallbackLoaded && this.fallbackImage) {
            img.src = this.fallbackImage.src;
            hasImage = true;
        }
        
        this.screenFlash('#ff0000', 200);
        this.bloodImpact(x, y, { size: size * 1.5, duration: 400 });
        
        const pieces = [
            { dx: -1, dy: -1, srcX: 0, srcY: 0 },
            { dx: 1, dy: -1, srcX: 0.5, srcY: 0 },
            { dx: -1, dy: 1, srcX: 0, srcY: 0.5 },
            { dx: 1, dy: 1, srcX: 0.5, srcY: 0.5 }
        ];
        
        setTimeout(() => {
            pieces.forEach((piece, i) => {
                setTimeout(() => {
                    VFX.animations.push({
                        x, y,
                        vx: piece.dx * (350 + Math.random() * 150),
                        vy: piece.dy * (300 + Math.random() * 150) - 200,
                        vr: (Math.random() - 0.5) * 15,
                        rotation: Math.random() * Math.PI * 2,
                        size: size * 0.55,
                        alpha: 1,
                        startTime: Date.now(),
                        duration: duration + 800,
                        img,
                        hasImage,
                        srcX: piece.srcX,
                        srcY: piece.srcY,
                        gravity: 450,
                        groundY: y + size + 120,
                        bounceCount: 0,
                        maxBounces: 2,
                        alive: true,
                        
                        update() {
                            const elapsed = Date.now() - this.startTime;
                            const timeScale = this._timeScale || 1;
                            const dt = 0.016 * timeScale;
                            
                            this.vy += this.gravity * dt;
                            this.x += this.vx * dt;
                            this.y += this.vy * dt;
                            this.rotation += this.vr * dt;
                            
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
                            try {
                                ctx.save();
                                ctx.translate(this.x, this.y);
                                ctx.rotate(this.rotation);
                                ctx.globalAlpha = this.alpha;
                                
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                                ctx.shadowBlur = 20;
                                ctx.shadowOffsetX = 8;
                                ctx.shadowOffsetY = 8;
                                
                                const imgValid = this.hasImage && this.img.complete && this.img.naturalWidth > 0;
                                
                                if (imgValid) {
                                    ctx.drawImage(
                                        this.img,
                                        this.img.width * this.srcX,
                                        this.img.height * this.srcY,
                                        this.img.width / 2,
                                        this.img.height / 2,
                                        -this.size/2, -this.size/2,
                                        this.size, this.size
                                    );
                                    
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
                            } catch (e) {
                                console.warn('[GoreVFX] draw 에러:', e);
                                ctx.restore();
                            }
                        }
                    });
                    
                    VFX.ensureLoop();
                }, i * 30);
                
                setTimeout(() => {
                    const pieceX = x + piece.dx * 100;
                    const pieceY = y + piece.dy * 80;
                    self.bloodSplatter(pieceX, pieceY, { count: 15, speed: 200, size: 6 });
                }, 150 + i * 80);
            });
        }, 80);
        
        this.bloodSplatter(x, y, { count: 80, speed: 600, size: 15, duration: 1500 });
        
        setTimeout(() => {
            this.bloodPool(x, y + size, { size: 100 });
        }, 600);
    },
    
    // ==========================================
    // 🎲 랜덤 절단 (다양한 패턴!)
    // ==========================================
    randomDismember(x, y, options = {}) {
        const rand = Math.random();
        
        if (rand < 0.2) {
            this.dismember(x, y, options);           // 수평 절단
        } else if (rand < 0.4) {
            this.verticalDismember(x, y, options);   // 수직 절단
        } else if (rand < 0.55) {
            this.diagonalDismember(x, y, options);   // 대각선 절단
        } else if (rand < 0.7) {
            this.diagonalDismember(x, y, { ...options, reverse: true }); // 반대 대각선
        } else if (rand < 0.85) {
            this.shatterDismember(x, y, options);    // 조각조각
        } else {
            this.explodeDismember(x, y, options);    // 4조각 폭발
        }
    },
    
    // ==========================================
    // ↗️ 대각선 절단
    // ==========================================
    diagonalDismember(x, y, options = {}) {
        const {
            width = 100,
            height = 150,
            duration = 1500,
            imgSrc = null,
            reverse = false  // true면 반대 대각선 (↙)
        } = options;
        
        const self = this;
        this.ensureLoop();
        
        console.log('[GoreVFX] diagonalDismember:', { x, y, reverse });
        
        // 이미지 로드
        this.loadImageWithFallback(imgSrc, (img, hasImage) => {
            // 화면 플래시
            self.screenFlash('#ff0000', 150);
            
            // 대각선 절단선
            const angle = reverse ? -45 : 45;
            VFX.animations.push({
                x, y,
                lineLength: 0,
                maxLength: Math.sqrt(width * width + height * height) * 1.5,
                angle: angle * Math.PI / 180,
                alpha: 1,
                startTime: Date.now(),
                duration: 200,
                alive: true,
                
                update() {
                    const elapsed = Date.now() - this.startTime;
                    const progress = elapsed / this.duration;
                    
                    this.lineLength = this.maxLength * Math.min(1, progress * 2);
                    this.alpha = 1 - progress;
                    
                    if (progress >= 1) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.angle);
                    ctx.globalAlpha = this.alpha;
                    
                    // 글로우
                    ctx.shadowColor = '#ff0000';
                    ctx.shadowBlur = 30;
                    
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.moveTo(-this.lineLength / 2, 0);
                    ctx.lineTo(this.lineLength / 2, 0);
                    ctx.stroke();
                    
                    ctx.restore();
                }
            });
            
            // 대각선 조각 2개
            setTimeout(() => {
                const pieces = reverse 
                    ? [
                        { dx: -1, dy: -1, clipPath: 'topRight' },  // 오른쪽 위
                        { dx: 1, dy: 1, clipPath: 'bottomLeft' }   // 왼쪽 아래
                      ]
                    : [
                        { dx: -1, dy: 1, clipPath: 'topLeft' },    // 왼쪽 위
                        { dx: 1, dy: -1, clipPath: 'bottomRight' } // 오른쪽 아래
                      ];
                
                pieces.forEach((piece, i) => {
                    VFX.animations.push({
                        x, y,
                        vx: piece.dx * (400 + Math.random() * 200),
                        vy: piece.dy * 300 - 200,
                        vr: (piece.dx > 0 ? 1 : -1) * (5 + Math.random() * 5),
                        rotation: 0,
                        width, height,
                        alpha: 1,
                        clipType: piece.clipPath,
                        hasImage,
                        img,
                        startTime: Date.now(),
                        duration,
                        gravity: 600,
                        groundY: y + height / 2 + 200 + Math.random() * 100,
                        bounceCount: 0,
                        maxBounces: 2,
                        alive: true,
                        
                        update() {
                            const elapsed = Date.now() - this.startTime;
                            const dt = 0.016;
                            
                            this.vy += this.gravity * dt;
                            this.x += this.vx * dt;
                            this.y += this.vy * dt;
                            this.rotation += this.vr * dt;
                            
                            if (this.y > this.groundY && this.bounceCount < this.maxBounces) {
                                this.bounceCount++;
                                this.y = this.groundY;
                                this.vy = -this.vy * 0.4;
                                this.vx *= 0.7;
                            }
                            
                            const progress = elapsed / this.duration;
                            if (progress > 0.7) this.alpha = 1 - (progress - 0.7) / 0.3;
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
                            
                            // 클리핑 경로 (대각선 삼각형)
                            ctx.beginPath();
                            const hw = this.width / 2;
                            const hh = this.height / 2;
                            
                            if (this.clipType === 'topLeft' || this.clipType === 'topRight') {
                                ctx.moveTo(-hw, -hh);
                                ctx.lineTo(hw, -hh);
                                ctx.lineTo(this.clipType === 'topLeft' ? -hw : hw, hh);
                            } else {
                                ctx.moveTo(-hw, hh);
                                ctx.lineTo(hw, hh);
                                ctx.lineTo(this.clipType === 'bottomLeft' ? -hw : hw, -hh);
                            }
                            ctx.closePath();
                            ctx.clip();
                            
                            if (this.hasImage && this.img && this.img.complete && this.img.naturalWidth > 0) {
                                ctx.drawImage(this.img, -hw, -hh, this.width, this.height);
                            } else {
                                ctx.fillStyle = '#3a3a3a';
                                ctx.fillRect(-hw, -hh, this.width, this.height);
                            }
                            
                            // 절단면
                            ctx.shadowBlur = 0;
                            ctx.strokeStyle = '#dc143c';
                            ctx.lineWidth = 4;
                            ctx.stroke();
                            
                            ctx.restore();
                        }
                    });
                });
                
                VFX.ensureLoop();
            }, 100);
            
            // 피 분출
            self.bloodSplatter(x, y, { count: 50, speed: 450, size: 10 });
            
            setTimeout(() => {
                self.bloodPool(x, y + height/2 + 50);
            }, 400);
        });
    },
    
    // ==========================================
    // 💥 조각조각 절단 (6~8조각) - 피 없이 조각에 집중!
    // ==========================================
    shatterDismember(x, y, options = {}) {
        const {
            width = 100,
            height = 150,
            duration = 2000,
            imgSrc = null
        } = options;
        
        const self = this;
        this.ensureLoop();
        
        console.log('[GoreVFX] shatterDismember:', { x, y });
        
        // 이미지 로드
        this.loadImageWithFallback(imgSrc, (img, hasImage) => {
            // 강한 플래시
            self.screenFlash('#ffffff', 80);
            
            // 무작위 절단선들 (흰색 슬래시) - 더 많이!
            const lineCount = 6 + Math.floor(Math.random() * 4);
            for (let i = 0; i < lineCount; i++) {
                setTimeout(() => {
                    const angle = Math.random() * Math.PI;
                    VFX.animations.push({
                        x: x + (Math.random() - 0.5) * 40,
                        y: y + (Math.random() - 0.5) * 40,
                        angle,
                        length: 0,
                        maxLength: Math.max(width, height) * (1.5 + Math.random() * 0.8),
                        alpha: 1,
                        startTime: Date.now(),
                        duration: 100 + Math.random() * 50,
                        alive: true,
                        
                        update() {
                            const elapsed = Date.now() - this.startTime;
                            const progress = elapsed / this.duration;
                            this.length = this.maxLength * Math.min(1, progress * 4);
                            this.alpha = 1 - progress;
                            if (progress >= 1) this.alive = false;
                        },
                        
                        draw(ctx) {
                            ctx.save();
                            ctx.translate(this.x, this.y);
                            ctx.rotate(this.angle);
                            ctx.globalAlpha = this.alpha;
                            ctx.shadowColor = '#ffffff';
                            ctx.shadowBlur = 15;
                            ctx.strokeStyle = '#fff';
                            ctx.lineWidth = 4;
                            ctx.beginPath();
                            ctx.moveTo(-this.length / 2, 0);
                            ctx.lineTo(this.length / 2, 0);
                            ctx.stroke();
                            ctx.restore();
                        }
                    });
                    VFX.ensureLoop();
                }, i * 25);
            }
            
            // 12~18개 조각 생성 (많이! 넓게!)
            setTimeout(() => {
                const pieceCount = 12 + Math.floor(Math.random() * 7);
                const angles = [];
                
                // 균등하게 각도 분배 + 랜덤
                for (let i = 0; i < pieceCount; i++) {
                    angles.push((i / pieceCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8);
                }
                
                angles.forEach((angle, i) => {
                    const speed = 400 + Math.random() * 600;  // 다양한 속도
                    const pieceSize = Math.max(width, height) * (0.12 + Math.random() * 0.18);  // 더 작은 조각들
                    
                    VFX.animations.push({
                        x: x + (Math.random() - 0.5) * 30,  // 시작점 약간 랜덤
                        y: y + (Math.random() - 0.5) * 30,
                        vx: Math.cos(angle) * speed * 1.5,  // 더 넓게 퍼짐
                        vy: Math.sin(angle) * speed - 250 - Math.random() * 200,
                        vr: (Math.random() - 0.5) * 12,
                        rotation: Math.random() * Math.PI * 2,
                        size: pieceSize,
                        alpha: 1,
                        hasImage,
                        img,
                        imgOffsetX: Math.random(),
                        imgOffsetY: Math.random(),
                        originalWidth: width,
                        originalHeight: height,
                        startTime: Date.now(),
                        duration: duration + Math.random() * 500,  // 지속시간도 랜덤
                        gravity: 350 + Math.random() * 150,  // 중력도 랜덤
                        groundY: y + height/2 + 200 + Math.random() * 200,
                        bounceCount: 0,
                        maxBounces: 2 + Math.floor(Math.random() * 2),
                        // 불규칙한 조각 형태 미리 계산
                        shapePoints: (() => {
                            const pts = [];
                            const numPts = 5 + Math.floor(Math.random() * 3);
                            for (let j = 0; j < numPts; j++) {
                                const a = (j / numPts) * Math.PI * 2;
                                const r = 0.6 + Math.random() * 0.4;
                                pts.push({ angle: a, radius: r });
                            }
                            return pts;
                        })(),
                        alive: true,
                        
                        update() {
                            const elapsed = Date.now() - this.startTime;
                            const dt = 0.016;
                            
                            this.vy += this.gravity * dt;
                            this.x += this.vx * dt;
                            this.y += this.vy * dt;
                            this.rotation += this.vr * dt;
                            
                            if (this.y > this.groundY && this.bounceCount < this.maxBounces) {
                                this.bounceCount++;
                                this.y = this.groundY;
                                this.vy = -this.vy * 0.4;
                                this.vx *= 0.65;
                                this.vr *= 0.6;
                            }
                            
                            this.vx *= 0.997;
                            
                            const progress = elapsed / this.duration;
                            if (progress > 0.75) this.alpha = 1 - (progress - 0.75) / 0.25;
                            if (progress >= 1) this.alive = false;
                        },
                        
                        draw(ctx) {
                            ctx.save();
                            ctx.translate(this.x, this.y);
                            ctx.rotate(this.rotation);
                            ctx.globalAlpha = this.alpha;
                            
                            // 그림자
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                            ctx.shadowBlur = 15;
                            ctx.shadowOffsetX = 5;
                            ctx.shadowOffsetY = 5;
                            
                            // 불규칙한 조각 형태 (미리 계산된 점 사용)
                            ctx.beginPath();
                            this.shapePoints.forEach((pt, idx) => {
                                const px = Math.cos(pt.angle) * (this.size / 2) * pt.radius;
                                const py = Math.sin(pt.angle) * (this.size / 2) * pt.radius;
                                if (idx === 0) ctx.moveTo(px, py);
                                else ctx.lineTo(px, py);
                            });
                            ctx.closePath();
                            ctx.clip();
                            
                            if (this.hasImage && this.img && this.img.complete && this.img.naturalWidth > 0) {
                                const sx = this.imgOffsetX * Math.max(0, this.img.naturalWidth - this.size);
                                const sy = this.imgOffsetY * Math.max(0, this.img.naturalHeight - this.size);
                                ctx.drawImage(
                                    this.img,
                                    sx, sy, this.size, this.size,
                                    -this.size/2, -this.size/2, this.size, this.size
                                );
                            } else {
                                // 고기/몬스터 색상 (피 없이)
                                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size/2);
                                gradient.addColorStop(0, '#5a4a3a');
                                gradient.addColorStop(0.6, '#4a3a2a');
                                gradient.addColorStop(1, '#3a2a1a');
                                ctx.fillStyle = gradient;
                                ctx.fill();
                            }
                            
                            // 테두리 (어두운 색)
                            ctx.shadowBlur = 0;
                            ctx.strokeStyle = '#2a1a0a';
                            ctx.lineWidth = 2;
                            ctx.stroke();
                            
                            ctx.restore();
                        }
                    });
                });
                
                VFX.ensureLoop();
            }, 60);
        });
    },
    
    // ==========================================
    // 🖼️ 적 이미지 소스 추출
    // ==========================================
    getEnemyImageSrc(enemyEl) {
        if (!enemyEl) {
            console.log('[GoreVFX] enemyEl이 없음');
            return null;
        }
        
        let spriteImg = enemyEl.querySelector('.enemy-sprite-img');
        if (!spriteImg) spriteImg = enemyEl.querySelector('img');
        if (!spriteImg) spriteImg = enemyEl.querySelector('.enemy-sprite-container img');
        
        if (spriteImg) {
            const src = spriteImg.src || spriteImg.getAttribute('src');
            console.log('[GoreVFX] 이미지 소스 찾음:', src);
            return src;
        }
        
        console.log('[GoreVFX] 이미지를 찾을 수 없음');
        return null;
    },
    
    // ==========================================
    // 스타일 주입
    // ==========================================
    injectStyles() {
        if (document.getElementById('gore-vfx-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'gore-vfx-styles';
        style.textContent = `
            @keyframes goreFlash {
                0% { opacity: 0.6; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
};

// 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GoreVFX.injectStyles();
        GoreVFX.loadFallbackImage();  // 🥩 meat.png 미리 로드
    });
} else {
    GoreVFX.injectStyles();
    GoreVFX.loadFallbackImage();  // 🥩 meat.png 미리 로드
}

// 전역 노출
window.GoreVFX = GoreVFX;

console.log('[GoreVFX] gore-vfx.js 로드 완료 (meat.png 폴백 준비)');

