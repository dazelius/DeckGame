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
        this.fallbackImage.src = 'image/meat.png';
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
    // 🩸 리얼 피 튀김 효과 (모탈컴뱃 스타일)
    // ==========================================
    
    // 피 색상 팔레트 (현실적인 혈액 색상)
    bloodColors: [
        '#8B0000', // 다크 레드
        '#660000', // 더 어두운 레드
        '#990000', // 진한 빨강
        '#770011', // 검붉은색
        '#AA1122', // 밝은 피
        '#550000', // 거의 검은 피
        '#881111', // 산소 섞인 피
    ],
    
    getRandomBloodColor() {
        return this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];
    },
    
    bloodSplatter(x, y, options = {}) {
        const {
            count = 30,
            speed = 300,
            size = 8,
            duration = 1000,
            direction = null,  // 타격 방향 (라디안)
            intensity = 1      // 강도 (1 = 보통, 2 = 강함)
        } = options;
        
        this.ensureLoop();
        
        // 🎲 랜덤 유틸리티 함수들
        const randomBetween = (min, max) => min + Math.random() * (max - min);
        const randomPow = (min, max, pow) => min + Math.pow(Math.random(), pow) * (max - min); // 편향된 분포
        const randomSign = () => Math.random() > 0.5 ? 1 : -1;
        const randomDeviation = (base, deviation) => base + (Math.random() - 0.5) * 2 * deviation;
        
        // 🩸 메인 피 방울들 (다양한 타입)
        for (let i = 0; i < count; i++) {
            // 🎯 방향: 더 큰 랜덤성
            let angle;
            if (direction !== null) {
                // 타격 방향 기준 + 랜덤 편차
                const spread = Math.PI * randomBetween(0.4, 1.2);  // 부채꼴 크기 랜덤
                const bias = randomPow(-0.5, 0.5, 0.7);  // 중앙 편향
                angle = direction + bias * spread;
            } else {
                // 완전 랜덤 + 약간의 클러스터링
                const cluster = Math.floor(Math.random() * 5);  // 5개 클러스터
                const clusterAngle = (cluster / 5) * Math.PI * 2;
                angle = clusterAngle + randomBetween(-0.6, 0.6);
            }
            
            // 🚀 속도: 파레토 분포 (대부분 빠르고, 일부는 느림)
            const speedVariance = randomPow(0.2, 1.2, 1.5);  // 큰 변동
            const velocity = speed * speedVariance * intensity * randomBetween(0.8, 1.3);
            
            // 📏 크기: 역 지수 분포 (작은 것 많이, 큰 것 적게)
            const sizeRoll = Math.random();
            let particleSize;
            if (sizeRoll < 0.5) {
                particleSize = size * randomBetween(0.15, 0.4);  // 50%: 아주 작은 방울
            } else if (sizeRoll < 0.8) {
                particleSize = size * randomBetween(0.4, 0.8);   // 30%: 중간 방울
            } else if (sizeRoll < 0.95) {
                particleSize = size * randomBetween(0.8, 1.2);   // 15%: 큰 방울
            } else {
                particleSize = size * randomBetween(1.2, 2.0);   // 5%: 아주 큰 덩어리
            }
            
            const bloodColor = this.getRandomBloodColor();
            
            // 🎭 파티클 타입 결정
            const typeRoll = Math.random();
            let particleType, maxTrail;
            if (typeRoll < 0.4) {
                particleType = 'spray';     // 40%: 스프레이 (작고 빠름)
                maxTrail = randomBetween(2, 5) | 0;
            } else if (typeRoll < 0.75) {
                particleType = 'drop';      // 35%: 방울 (중간)
                maxTrail = randomBetween(4, 10) | 0;
            } else if (typeRoll < 0.9) {
                particleType = 'glob';      // 15%: 덩어리 (크고 느림)
                maxTrail = randomBetween(6, 12) | 0;
            } else {
                particleType = 'string';    // 10%: 줄기 (늘어짐)
                maxTrail = randomBetween(10, 18) | 0;
            }
            
            // ⏱️ 발사 딜레이 (일부는 늦게 발사)
            const delay = Math.random() < 0.3 ? randomBetween(0, 80) : 0;
            
            // 🌀 회전/흔들림 파라미터
            const spinSpeed = randomDeviation(0, 15) * (particleType === 'glob' ? 0.3 : 1);
            const wobbleFreq = randomBetween(3, 8);
            const wobbleAmp = randomBetween(0, 20) * (particleType === 'string' ? 2 : 1);
            
            setTimeout(() => {
                VFX.particles.push({
                    x: x + randomDeviation(0, 8),  // 시작점도 랜덤
                    y: y + randomDeviation(0, 8),
                    vx: Math.cos(angle) * velocity + randomDeviation(0, 30),
                    vy: Math.sin(angle) * velocity - randomBetween(100, 200) * intensity,
                    size: particleSize,
                    originalSize: particleSize,
                    alpha: randomBetween(0.85, 1),
                    color: bloodColor,
                    gravity: randomBetween(800, 1600) * (particleType === 'glob' ? 1.3 : 1),
                    airResistance: randomBetween(0.94, 0.99),
                    decay: randomBetween(0.4, 0.9) / (duration / 1000),
                    trail: [],
                    maxTrailLength: maxTrail,
                    alive: true,
                    rotation: Math.random() * Math.PI * 2,
                    spinSpeed: spinSpeed,
                    stretch: 1,
                    type: particleType,
                    hasSpawned: false,
                    groundY: y + randomBetween(150, 300),
                    wobblePhase: Math.random() * Math.PI * 2,
                    wobbleFreq: wobbleFreq,
                    wobbleAmp: wobbleAmp,
                    time: 0,
                    
                    update() {
                        const timeScale = VFX.timeScale || 1;
                        const dt = 0.016 * timeScale;
                        this.time += dt;
                        
                        // 트레일 저장
                        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                        if (speed > 30 || this.type === 'string') {
                            this.trail.push({ 
                                x: this.x, 
                                y: this.y, 
                                alpha: this.alpha,
                                size: this.size * randomBetween(0.4, 0.7)
                            });
                            if (this.trail.length > this.maxTrailLength) {
                                this.trail.shift();
                            }
                        }
                        
                        // 물리 시뮬레이션
                        this.vy += this.gravity * dt;
                        this.vx *= this.airResistance;
                        this.vy *= this.airResistance;
                        
                        // 흔들림 (string, glob)
                        if (this.wobbleAmp > 0) {
                            const wobble = Math.sin(this.time * this.wobbleFreq + this.wobblePhase) * this.wobbleAmp * dt;
                            this.vx += wobble;
                        }
                        
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                        
                        // 스핀
                        this.rotation += this.spinSpeed * dt;
                        
                        // 늘어남 (속도 기반 + 타입별)
                        const stretchBase = this.type === 'string' ? 1.5 : 1;
                        this.stretch = stretchBase + Math.min(speed / 250, 2.5);
                        if (this.type !== 'glob') {
                            this.rotation = Math.atan2(this.vy, this.vx);
                        }
                        
                        // 바닥 튀김
                        if (this.y >= this.groundY && !this.hasSpawned) {
                            this.hasSpawned = true;
                            if (this.type === 'drop' || this.type === 'glob') {
                                if (Math.random() > 0.4) {
                                    GoreVFX.spawnSplashDroplets(this.x, this.groundY, this.vx * 0.4);
                                }
                            }
                            this.vy = -Math.abs(this.vy) * randomBetween(0.1, 0.3);
                            this.vx *= randomBetween(0.3, 0.6);
                            this.gravity *= randomBetween(1.5, 2.5);
                        }
                        
                        this.alpha -= this.decay * dt * randomBetween(0.8, 1.2);
                        this.size *= randomBetween(0.995, 1.001);
                        
                        if (this.alpha <= 0 || this.size < 0.3) this.alive = false;
                    },
                
                draw(ctx) {
                    // 🎨 타입별 다른 렌더링
                    
                    // 트레일 (피 줄기) - string 타입은 더 굵고 긴 트레일
                    if (this.trail.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(this.trail[0].x, this.trail[0].y);
                        
                        // 부드러운 곡선 (string 타입)
                        if (this.type === 'string' && this.trail.length > 2) {
                            for (let i = 1; i < this.trail.length - 1; i++) {
                                const xc = (this.trail[i].x + this.trail[i + 1].x) / 2;
                                const yc = (this.trail[i].y + this.trail[i + 1].y) / 2;
                                ctx.quadraticCurveTo(this.trail[i].x, this.trail[i].y, xc, yc);
                            }
                            ctx.lineTo(this.x, this.y);
                        } else {
                            for (let i = 1; i < this.trail.length; i++) {
                                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                            }
                            ctx.lineTo(this.x, this.y);
                        }
                        
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = this.type === 'string' ? this.size * 1.2 : this.size * 0.7;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.globalAlpha = this.alpha * (this.type === 'string' ? 0.8 : 0.5);
                        ctx.stroke();
                    }
                    
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.globalAlpha = this.alpha;
                    
                    // 🩸 타입별 형태
                    if (this.type === 'spray') {
                        // 스프레이: 작은 원, 빠르게 사라짐
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                        ctx.fillStyle = this.color;
                        ctx.fill();
                        
                    } else if (this.type === 'glob') {
                        // 덩어리: 불규칙한 형태
                        const blobPoints = 6;
                        ctx.beginPath();
                        for (let i = 0; i <= blobPoints; i++) {
                            const angle = (i / blobPoints) * Math.PI * 2;
                            const wobble = 0.7 + Math.sin(angle * 3 + this.time * 2) * 0.3;
                            const r = this.size * wobble;
                            const px = Math.cos(angle) * r;
                            const py = Math.sin(angle) * r * 0.8;
                            if (i === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.closePath();
                        
                        // 어두운 그라데이션
                        const globGrad = ctx.createRadialGradient(
                            -this.size * 0.2, -this.size * 0.2, 0,
                            0, 0, this.size * 1.2
                        );
                        globGrad.addColorStop(0, '#aa2020');
                        globGrad.addColorStop(0.5, this.color);
                        globGrad.addColorStop(1, '#220000');
                        ctx.fillStyle = globGrad;
                        ctx.fill();
                        
                        // 하이라이트
                        if (this.size > 4) {
                            ctx.beginPath();
                            ctx.ellipse(-this.size * 0.25, -this.size * 0.25, 
                                this.size * 0.3, this.size * 0.2, -0.4, 0, Math.PI * 2);
                            ctx.fillStyle = 'rgba(255, 120, 120, 0.35)';
                            ctx.fill();
                        }
                        
                    } else if (this.type === 'string') {
                        // 줄기: 늘어난 형태
                        const stringLen = this.size * this.stretch * 1.5;
                        const gradient = ctx.createLinearGradient(-stringLen/2, 0, stringLen/2, 0);
                        gradient.addColorStop(0, 'rgba(80, 0, 0, 0.3)');
                        gradient.addColorStop(0.3, this.color);
                        gradient.addColorStop(0.7, this.color);
                        gradient.addColorStop(1, 'rgba(80, 0, 0, 0.3)');
                        
                        ctx.beginPath();
                        ctx.ellipse(0, 0, stringLen, this.size * 0.6, 0, 0, Math.PI * 2);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                        
                    } else {
                        // drop: 기본 물방울 형태
                        const gradient = ctx.createRadialGradient(
                            -this.size * 0.3, -this.size * 0.3, 0,
                            0, 0, this.size * this.stretch
                        );
                        gradient.addColorStop(0, '#cc2233');
                        gradient.addColorStop(0.3, this.color);
                        gradient.addColorStop(1, '#330000');
                        
                        ctx.beginPath();
                        ctx.ellipse(0, 0, this.size * this.stretch, this.size, 0, 0, Math.PI * 2);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                        
                        // 하이라이트
                        if (this.size > 2.5) {
                            ctx.beginPath();
                            ctx.ellipse(-this.size * 0.25, -this.size * 0.25, 
                                this.size * 0.22, this.size * 0.13, -0.5, 0, Math.PI * 2);
                            ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
                            ctx.fill();
                        }
                    }
                    
                    ctx.restore();
                }
            });
            }, delay);  // 딜레이 적용
        }
        
        // 🩸 미세 피 안개 (스프레이) - 더 랜덤하게
        const mistCount = Math.floor(count * randomBetween(0.2, 0.5));
        for (let i = 0; i < mistCount; i++) {
            const mistDelay = Math.random() < 0.5 ? randomBetween(0, 100) : 0;
            
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const vel = speed * randomBetween(0.2, 0.7) * Math.random();
                const mistX = x + randomDeviation(0, 30);
                const mistY = y + randomDeviation(0, 25);
                const mistSize = randomBetween(10, 45);
                const mistAlpha = randomBetween(0.15, 0.4);
                
                VFX.particles.push({
                    x: mistX,
                    y: mistY,
                    vx: Math.cos(angle) * vel + (Math.random() - 0.5) * 40,
                    vy: Math.sin(angle) * vel - (30 + Math.random() * 50),
                    size: mistSize,
                    alpha: mistAlpha,
                    baseColor: Math.random() > 0.3 ? [80, 0, 0] : [100, 20, 10],  // 색상 변화
                    gravity: 30 + Math.random() * 50,
                    decay: 0.8 + Math.random() * 1.2,
                    alive: true,
                    growRate: 0.3 + Math.random() * 0.5,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: 2 + Math.random() * 3,
                    
                    update() {
                        const dt = 0.016;
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                        this.vy += this.gravity * dt;
                        // 흔들림
                        this.x += Math.sin(this.wobble) * 0.5;
                        this.wobble += this.wobbleSpeed * dt;
                        this.size += this.growRate;
                        this.alpha -= this.decay * dt;
                        if (this.alpha <= 0) this.alive = false;
                    },
                    
                    draw(ctx) {
                        const [r, g, b] = this.baseColor;
                        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.alpha})`);
                        gradient.addColorStop(0.6, `rgba(${r * 0.7}, ${g}, ${b}, ${this.alpha * 0.5})`);
                        gradient.addColorStop(1, `rgba(${r * 0.5}, 0, 0, 0)`);
                        
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                    }
                });
            }, mistDelay);  // 미스트 딜레이
        }
    },
    
    // 바닥에 튀길 때 작은 방울들
    spawnSplashDroplets(x, y, vx) {
        const count = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6;
            const speed = 80 + Math.random() * 120;
            
            VFX.particles.push({
                x, y,
                vx: Math.cos(angle) * speed + vx,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                alpha: 0.9,
                color: this.getRandomBloodColor(),
                gravity: 1500,
                alive: true,
                
                update() {
                    const dt = 0.016;
                    this.vy += this.gravity * dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.alpha -= 2 * dt;
                    if (this.alpha <= 0) this.alive = false;
                },
                
                draw(ctx) {
                    ctx.globalAlpha = this.alpha;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                }
            });
        }
    },
    
    // ==========================================
    // 🗡️ 리얼 혈흔 슬래시 (베기 자국)
    // ==========================================
    bloodSlash(x, y, options = {}) {
        const {
            angle = -30,
            length = 150,
            width = 20,
            duration = 500,
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
            alive: true,
            drips: [],  // 피 흘러내림
            
            update() {
                const elapsed = Date.now() - this.startTime;
                this.progress = Math.min(1, elapsed / (this.duration * 0.2));
                
                // 피 흘러내림 생성
                if (this.progress > 0.8 && this.drips.length < 5 && Math.random() > 0.7) {
                    const dripX = this.x + Math.cos(this.angle) * this.length * Math.random();
                    const dripY = this.y + Math.sin(this.angle) * this.length * Math.random();
                    this.drips.push({
                        x: dripX,
                        y: dripY,
                        vy: 0,
                        length: 0,
                        maxLength: 20 + Math.random() * 40
                    });
                }
                
                // 드립 업데이트
                this.drips.forEach(drip => {
                    drip.vy += 0.5;
                    drip.y += drip.vy * 0.016 * 60;
                    drip.length = Math.min(drip.maxLength, drip.length + 2);
                });
                
                const fadeStart = this.duration * 0.6;
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
                
                // 피 흘러내림 그리기
                ctx.save();
                this.drips.forEach(drip => {
                    const gradient = ctx.createLinearGradient(drip.x, drip.y, drip.x, drip.y + drip.length);
                    gradient.addColorStop(0, `rgba(100, 0, 0, ${this.alpha})`);
                    gradient.addColorStop(1, `rgba(60, 0, 0, 0)`);
                    
                    ctx.beginPath();
                    ctx.moveTo(drip.x, drip.y);
                    ctx.lineTo(drip.x, drip.y + drip.length);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 2 + Math.random();
                    ctx.lineCap = 'round';
                    ctx.stroke();
                });
                ctx.restore();
            }
        });
        
        // 피 방울
        this.bloodSplatter(x, y, { count: 15, speed: 200, size: 5, direction: rad });
    },
    
    // ==========================================
    // 💥 리얼 혈흔 충격파
    // ==========================================
    bloodImpact(x, y, options = {}) {
        const {
            size = 100,
            duration = 500
        } = options;
        
        this.ensureLoop();
        
        // 방사형 피 튀김
        const sprayCount = 12;
        for (let i = 0; i < sprayCount; i++) {
            const angle = (i / sprayCount) * Math.PI * 2;
            const delay = i * 15;
            
            setTimeout(() => {
                this.bloodSplatter(x, y, {
                    count: 5,
                    speed: 200 + Math.random() * 100,
                    size: 4,
                    direction: angle,
                    intensity: 0.8
                });
            }, delay);
        }
        
        // 충격파 링
        VFX.animations.push({
            x, y,
            radius: 0,
            maxRadius: size,
            alpha: 0.8,
            startTime: Date.now(),
            duration,
            alive: true,
            rings: [
                { radius: 0, width: 8, alpha: 1 },
                { radius: 0, width: 4, alpha: 0.7, delay: 50 },
                { radius: 0, width: 2, alpha: 0.5, delay: 100 }
            ],
            
            update() {
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 각 링 업데이트
                this.rings.forEach(ring => {
                    const ringElapsed = Math.max(0, elapsed - (ring.delay || 0));
                    const ringProgress = ringElapsed / (this.duration * 0.6);
                    ring.radius = this.maxRadius * Math.min(1, ringProgress * 1.2);
                    ring.currentAlpha = ring.alpha * (1 - progress);
                });
                
                this.alpha = 1 - progress;
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                ctx.save();
                
                // 다중 링 그리기
                this.rings.forEach(ring => {
                    if (ring.radius > 0 && ring.currentAlpha > 0) {
                        ctx.globalAlpha = ring.currentAlpha;
                        
                        // 피 링
                        const gradient = ctx.createRadialGradient(
                            this.x, this.y, ring.radius * 0.8,
                            this.x, this.y, ring.radius
                        );
                        gradient.addColorStop(0, 'rgba(100, 0, 0, 0)');
                        gradient.addColorStop(0.5, `rgba(120, 10, 10, ${ring.currentAlpha * 0.8})`);
                        gradient.addColorStop(1, 'rgba(80, 0, 0, 0)');
                        
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = ring.width;
                        ctx.stroke();
                    }
                });
                
                // 중앙 피 웅덩이 느낌
                const centerGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.maxRadius * 0.3);
                centerGradient.addColorStop(0, `rgba(80, 0, 0, ${this.alpha * 0.5})`);
                centerGradient.addColorStop(1, 'rgba(60, 0, 0, 0)');
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.maxRadius * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = centerGradient;
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
    // 🩸 리얼 피 웅덩이
    // ==========================================
    bloodPool(x, y, options = {}) {
        const {
            size = 80,
            duration = 4000
        } = options;
        
        this.ensureLoop();
        
        VFX.animations.push({
            x, y,
            currentSize: 0,
            maxSize: size,
            alpha: 0.85,
            startTime: Date.now(),
            duration,
            alive: true,
            edgePoints: null,  // 불규칙한 가장자리 포인트
            
            initEdge() {
                // 불규칙한 웅덩이 가장자리 생성
                this.edgePoints = [];
                const numPoints = 16;
                for (let i = 0; i < numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    const irregularity = 0.7 + Math.random() * 0.6;  // 0.7~1.3 배율
                    this.edgePoints.push({
                        angle,
                        scale: irregularity,
                        wobble: Math.random() * Math.PI * 2  // 흔들림 오프셋
                    });
                }
            },
            
            update() {
                if (!this.edgePoints) this.initEdge();
                
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / this.duration;
                
                // 유기적으로 퍼지는 효과
                if (progress < 0.4) {
                    const growProgress = progress / 0.4;
                    // 이징 함수로 자연스럽게
                    this.currentSize = this.maxSize * (1 - Math.pow(1 - growProgress, 3));
                } else {
                    this.currentSize = this.maxSize;
                }
                
                // 가장자리 미세하게 움직임 (점성 느낌)
                this.edgePoints.forEach(point => {
                    point.currentScale = point.scale + Math.sin(elapsed * 0.002 + point.wobble) * 0.05;
                });
                
                // 서서히 페이드 (더 천천히)
                if (progress > 0.75) {
                    this.alpha = 0.85 * (1 - (progress - 0.75) / 0.25);
                }
                
                if (progress >= 1) this.alive = false;
            },
            
            draw(ctx) {
                if (!this.edgePoints || this.currentSize < 1) return;
                
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                // 불규칙한 웅덩이 모양 그리기
                ctx.beginPath();
                
                const firstPoint = this.edgePoints[0];
                const firstX = this.x + Math.cos(firstPoint.angle) * this.currentSize * firstPoint.currentScale;
                const firstY = this.y + Math.sin(firstPoint.angle) * this.currentSize * 0.35 * firstPoint.currentScale;
                ctx.moveTo(firstX, firstY);
                
                // 베지어 곡선으로 부드러운 가장자리
                for (let i = 1; i <= this.edgePoints.length; i++) {
                    const point = this.edgePoints[i % this.edgePoints.length];
                    const prevPoint = this.edgePoints[(i - 1) % this.edgePoints.length];
                    
                    const px = this.x + Math.cos(point.angle) * this.currentSize * point.currentScale;
                    const py = this.y + Math.sin(point.angle) * this.currentSize * 0.35 * point.currentScale;
                    
                    const cpx = this.x + Math.cos((prevPoint.angle + point.angle) / 2) * this.currentSize * 1.05;
                    const cpy = this.y + Math.sin((prevPoint.angle + point.angle) / 2) * this.currentSize * 0.35 * 1.05;
                    
                    ctx.quadraticCurveTo(cpx, cpy, px, py);
                }
                
                ctx.closePath();
                
                // 다층 그라데이션으로 입체감
                const gradient = ctx.createRadialGradient(
                    this.x - this.currentSize * 0.2, 
                    this.y - this.currentSize * 0.1, 
                    0,
                    this.x, this.y, this.currentSize
                );
                gradient.addColorStop(0, '#220000');    // 깊은 중앙
                gradient.addColorStop(0.3, '#440000');  // 어두운 피
                gradient.addColorStop(0.6, '#660000');  // 중간 피
                gradient.addColorStop(0.85, '#550000'); // 가장자리
                gradient.addColorStop(1, 'rgba(50, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // 빛 반사 (젖은 느낌)
                ctx.globalAlpha = this.alpha * 0.4;
                const highlightGradient = ctx.createRadialGradient(
                    this.x - this.currentSize * 0.3,
                    this.y - this.currentSize * 0.15,
                    0,
                    this.x - this.currentSize * 0.3,
                    this.y - this.currentSize * 0.15,
                    this.currentSize * 0.4
                );
                highlightGradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
                highlightGradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
                
                ctx.beginPath();
                ctx.ellipse(
                    this.x - this.currentSize * 0.2,
                    this.y - this.currentSize * 0.08,
                    this.currentSize * 0.35,
                    this.currentSize * 0.12,
                    -0.3, 0, Math.PI * 2
                );
                ctx.fillStyle = highlightGradient;
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
                        
                        // 외곽 글로우 (스프라이트 외곽선만!)
                        ctx.filter = 'drop-shadow(0 0 6px #ff4444) drop-shadow(0 0 12px #8b0000)';
                        
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
                            
                            // 절단면 (빨간 라인)
                            ctx.filter = 'none';
                            const gradient = ctx.createLinearGradient(0, this.height/2 - 15, 0, this.height/2);
                            gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
                            gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.8)');
                            gradient.addColorStop(1, '#8b0000');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(-this.imgWidth/2, this.height/2 - 15, this.imgWidth, 15);
                        } else {
                            // 폴백: 어두운 실루엣
                            ctx.fillStyle = '#3a2a1a';
                            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                        }
                        
                        ctx.filter = 'none';
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
                        
                        // 외곽 글로우 (스프라이트 외곽선만!)
                        ctx.filter = 'drop-shadow(0 0 6px #ff4444) drop-shadow(0 0 12px #8b0000)';
                        
                        const imgValid = this.hasImage && this.img.complete && this.img.naturalWidth > 0;
                        
                        if (imgValid) {
                            ctx.drawImage(
                                this.img,
                                0, this.img.height/2,
                                this.img.width, this.img.height/2,
                                -this.imgWidth/2, -this.height/2,
                                this.imgWidth, this.height
                            );
                            
                            // 절단면 (빨간 라인)
                            ctx.filter = 'none';
                            const gradient = ctx.createLinearGradient(0, -this.height/2, 0, -this.height/2 + 15);
                            gradient.addColorStop(0, '#8b0000');
                            gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.8)');
                            gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(-this.imgWidth/2, -this.height/2, this.imgWidth, 15);
                        } else {
                            ctx.fillStyle = '#3a2a1a';
                            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                        }
                        
                        ctx.filter = 'none';
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
                        
                        // 외곽 글로우 (스프라이트 외곽선만!)
                        ctx.filter = 'drop-shadow(0 0 6px #ff4444) drop-shadow(0 0 12px #8b0000)';
                        
                        const imgValid = this.hasImage && this.img.complete && this.img.naturalWidth > 0;
                        
                        if (imgValid) {
                            ctx.drawImage(
                                this.img,
                                0, 0,
                                this.img.width/2, this.img.height,
                                -this.width/2, -this.height/2,
                                this.width, this.height
                            );
                            
                            // 절단면 (빨간 라인)
                            ctx.filter = 'none';
                            const gradient = ctx.createLinearGradient(this.width/2 - 15, 0, this.width/2, 0);
                            gradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
                            gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.8)');
                            gradient.addColorStop(1, '#8b0000');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(this.width/2 - 15, -this.height/2, 15, this.height);
                        } else {
                            ctx.fillStyle = '#3a2a1a';
                            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                        }
                        
                        ctx.filter = 'none';
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
                        
                        // 외곽 글로우 (스프라이트 외곽선만!)
                        ctx.filter = 'drop-shadow(0 0 6px #ff4444) drop-shadow(0 0 12px #8b0000)';
                        
                        const imgValid = this.hasImage && this.img.complete && this.img.naturalWidth > 0;
                        
                        if (imgValid) {
                            ctx.drawImage(
                                this.img,
                                this.img.width/2, 0,
                                this.img.width/2, this.img.height,
                                -this.width/2, -this.height/2,
                                this.width, this.height
                            );
                            
                            // 절단면 (빨간 라인)
                            ctx.filter = 'none';
                            const gradient = ctx.createLinearGradient(-this.width/2, 0, -this.width/2 + 15, 0);
                            gradient.addColorStop(0, '#8b0000');
                            gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.8)');
                            gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(-this.width/2, -this.height/2, 15, this.height);
                        } else {
                            ctx.fillStyle = '#3a2a1a';
                            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
                        }
                        
                        ctx.filter = 'none';
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
                                
                                // 외곽 글로우 (스프라이트 외곽선만!)
                                ctx.filter = 'drop-shadow(0 0 6px #ff4444) drop-shadow(0 0 12px #8b0000)';
                                
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
                                } else {
                                    ctx.fillStyle = '#3a2a1a';
                                    ctx.beginPath();
                                    ctx.moveTo(0, -this.size/2);
                                    ctx.lineTo(this.size/2, 0);
                                    ctx.lineTo(this.size/4, this.size/2);
                                    ctx.lineTo(-this.size/3, this.size/3);
                                    ctx.lineTo(-this.size/2, -this.size/4);
                                    ctx.closePath();
                                    ctx.fill();
                                }
                                
                                ctx.filter = 'none';
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
    // 🎲 랜덤 절단 (다양한 패턴!) + 항상 meat.png 조각 추가
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
        
        // 🥩 항상 meat.png 조각도 추가!
        this.addMeatChunks(x, y, options);
    },
    
    // ==========================================
    // 🥩 meat.png 조각 추가 (항상 호출)
    // ==========================================
    addMeatChunks(x, y, options = {}) {
        const { width = 100, height = 150 } = options;
        
        if (!this.fallbackLoaded || !this.fallbackImage) return;
        
        const chunkCount = 5 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < chunkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 300;
            const size = 20 + Math.random() * 30;
            
            setTimeout(() => {
                VFX.animations.push({
                    x: x + (Math.random() - 0.5) * 50,
                    y: y + (Math.random() - 0.5) * 50,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 200,
                    vr: (Math.random() - 0.5) * 10,
                    rotation: Math.random() * Math.PI * 2,
                    size,
                    alpha: 1,
                    img: this.fallbackImage,
                    startTime: Date.now(),
                    duration: 1200 + Math.random() * 500,
                    gravity: 500,
                    groundY: y + height/2 + 150 + Math.random() * 100,
                    bounceCount: 0,
                    alive: true,
                    
                    update() {
                        const elapsed = Date.now() - this.startTime;
                        const dt = 0.016;
                        
                        this.vy += this.gravity * dt;
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                        this.rotation += this.vr * dt;
                        
                        if (this.y > this.groundY && this.bounceCount < 2) {
                            this.bounceCount++;
                            this.y = this.groundY;
                            this.vy = -this.vy * 0.3;
                            this.vx *= 0.6;
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
                        
                        // 스프라이트만 그리기 (외곽 글로우는 drop-shadow로)
                        if (this.img && this.img.complete) {
                            // 외곽 글로우 효과 (빨간색)
                            ctx.filter = 'drop-shadow(0 0 4px #ff0000) drop-shadow(0 0 8px #8b0000)';
                            ctx.drawImage(this.img, -this.size/2, -this.size/2, this.size, this.size);
                            ctx.filter = 'none';
                        }
                        
                        ctx.restore();
                    }
                });
                
                VFX.ensureLoop();
            }, i * 30);
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
                            
                            // 외곽 글로우 (스프라이트 외곽선만!)
                            ctx.filter = 'drop-shadow(0 0 6px #ff4444) drop-shadow(0 0 12px #8b0000)';
                            
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
                            
                            // 절단면 (빨간 라인)
                            ctx.filter = 'none';
                            ctx.strokeStyle = '#dc143c';
                            ctx.lineWidth = 3;
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
                            
                            // 외곽 글로우 (스프라이트 외곽선만!)
                            ctx.filter = 'drop-shadow(0 0 6px #ff4444) drop-shadow(0 0 12px #8b0000)';
                            
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
                                // 고기/몬스터 색상
                                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size/2);
                                gradient.addColorStop(0, '#5a4a3a');
                                gradient.addColorStop(0.6, '#4a3a2a');
                                gradient.addColorStop(1, '#3a2a1a');
                                ctx.fillStyle = gradient;
                                ctx.fill();
                            }
                            
                            ctx.filter = 'none';
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

