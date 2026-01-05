// =====================================================
// DDOO VFX System - PixiJS ParticleContainer 기반 고성능 VFX
// =====================================================

const DDOOVfx = {
    // ==================== 상태 ====================
    initialized: false,
    pixiApp: null,
    stageContainer: null,
    
    // PixiJS 컨테이너들
    particleContainer: null,   // ParticleContainer (고성능)
    vfxContainer: null,        // Graphics용 컨테이너
    
    // 파티클 풀링
    particles: [],
    particlePool: [],
    maxParticles: 100,
    
    // VFX 캐시
    vfxCache: new Map(),
    
    // 설정
    config: null,
    
    // ==================== 초기화 ====================
    init(pixiApp, stageContainer, config = {}) {
        if (this.initialized) return this;
        
        this.pixiApp = pixiApp;
        this.stageContainer = stageContainer;
        this.config = config;
        this.maxParticles = config.performance?.maxParticles || 100;
        
        // PixiJS ParticleContainer 생성 (고성능!)
        this.createContainers();
        
        // VFX 데이터 로드
        this.loadAllVFX();
        
        // 렌더 루프 시작
        this.startRenderLoop();
        
        this.initialized = true;
        console.log('[DDOOVfx] ✅ VFX 시스템 초기화 완료 (PixiJS ParticleContainer)');
        
        return this;
    },
    
    createContainers() {
        if (!this.stageContainer) return;
        
        // Graphics 기반 VFX 컨테이너 (슬래시, 링 등)
        this.vfxContainer = new PIXI.Container();
        this.vfxContainer.name = 'ddoo-vfx';
        this.stageContainer.addChild(this.vfxContainer);
        
        // 🚀 ParticleContainer: 수천 개의 스프라이트를 빠르게 렌더링
        // PixiJS v8에서는 ParticleContainer 방식이 다름
        if (PIXI.ParticleContainer) {
            this.particleContainer = new PIXI.ParticleContainer(this.maxParticles, {
                position: true,
                rotation: true,
                scale: true,
                alpha: true,
                tint: true
            });
        } else {
            // v8 폴백: 일반 Container 사용
            this.particleContainer = new PIXI.Container();
        }
        this.particleContainer.name = 'ddoo-particles';
        this.stageContainer.addChild(this.particleContainer);
        
        // 파티클 텍스처 생성 (원형)
        this.createParticleTextures();
        
        console.log('[DDOOVfx] 컨테이너 생성 완료');
    },
    
    // 기본 파티클 텍스처 생성
    createParticleTextures() {
        this.textures = {};
        
        try {
            // PixiJS 버전 감지 (v7 vs v8)
            const isV8 = typeof PIXI.Graphics.prototype.circle !== 'function';
            
            // 원형 파티클
            const circleGraphics = new PIXI.Graphics();
            if (isV8) {
                // v8: 메서드 체이닝 방식
                circleGraphics.beginFill(0xffffff);
                circleGraphics.drawCircle(0, 0, 10);
                circleGraphics.endFill();
            } else {
                // v7
                circleGraphics.beginFill(0xffffff);
                circleGraphics.drawCircle(0, 0, 10);
                circleGraphics.endFill();
            }
            
            if (this.pixiApp?.renderer) {
                this.textures.circle = this.pixiApp.renderer.generateTexture(circleGraphics);
            }
            
            // 사각형 파티클
            const squareGraphics = new PIXI.Graphics();
            squareGraphics.beginFill(0xffffff);
            squareGraphics.drawRect(-5, -5, 10, 10);
            squareGraphics.endFill();
            
            if (this.pixiApp?.renderer) {
                this.textures.square = this.pixiApp.renderer.generateTexture(squareGraphics);
            }
            
            // 별 파티클
            const starGraphics = new PIXI.Graphics();
            starGraphics.beginFill(0xffffff);
            this.drawStar(starGraphics, 0, 0, 5, 10, 5);
            starGraphics.endFill();
            
            if (this.pixiApp?.renderer) {
                this.textures.star = this.pixiApp.renderer.generateTexture(starGraphics);
            }
            
            console.log('[DDOOVfx] 파티클 텍스처 생성 완료');
        } catch (e) {
            console.warn('[DDOOVfx] 파티클 텍스처 생성 실패:', e);
            // 폴백: 기본 텍스처 사용
            this.textures.circle = PIXI.Texture.WHITE;
            this.textures.square = PIXI.Texture.WHITE;
            this.textures.star = PIXI.Texture.WHITE;
        }
    },
    
    drawStar(graphics, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        graphics.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            graphics.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            graphics.lineTo(x, y);
            rot += step;
        }
        graphics.closePath();
    },
    
    // ==================== VFX 데이터 로드 ====================
    async loadAllVFX() {
        // 번들에서 로드 시도
        if (typeof VFX_BUNDLE !== 'undefined') {
            for (const [id, data] of Object.entries(VFX_BUNDLE)) {
                this.vfxCache.set(id, data);
            }
            console.log(`[DDOOVfx] 번들에서 ${this.vfxCache.size}개 VFX 로드`);
            return;
        }
        
        // 개별 파일 로드
        try {
            const res = await fetch('vfx/index.json');
            const index = await res.json();
            const files = index.files || [];
            
            for (const id of files) {
                try {
                    const vfxRes = await fetch(`vfx/${id}.json`);
                    if (vfxRes.ok) {
                        this.vfxCache.set(id, await vfxRes.json());
                    }
                } catch (e) {
                    // 무시
                }
            }
            console.log(`[DDOOVfx] ${this.vfxCache.size}개 VFX 로드 완료`);
        } catch (e) {
            console.warn('[DDOOVfx] VFX 로드 실패');
        }
    },
    
    // ==================== VFX 트리거 ====================
    trigger(vfxId, x, y, options = {}) {
        const data = this.vfxCache.get(vfxId);
        if (!data) {
            console.warn(`[DDOOVfx] VFX 없음: ${vfxId}`);
            return;
        }
        
        const dir = options.dir || 1;
        const scale = options.scale || 1;
        
        // 레이어별 처리
        if (data.layers) {
            data.layers.forEach(layer => {
                this.processLayer(layer, x, y, dir, scale, options);
            });
        }
    },
    
    processLayer(layer, x, y, dir, scale, options) {
        const count = layer.count || 1;
        const delayBetween = layer.delayBetween || 0;
        
        for (let i = 0; i < count; i++) {
            if (delayBetween > 0 && i > 0) {
                setTimeout(() => {
                    this.spawnParticleFromLayer(layer, x, y, dir, i, scale, options);
                }, delayBetween * i);
            } else {
                this.spawnParticleFromLayer(layer, x, y, dir, i, scale, options);
            }
        }
    },
    
    spawnParticleFromLayer(layer, x, y, dir, index, scale, options) {
        const type = layer.type || 'spark';
        
        // 오프셋 적용
        const offsetX = (layer.offsetX || 0) * dir * scale;
        const offsetY = (layer.offsetY || 0) * scale;
        const finalX = x + offsetX;
        const finalY = y + offsetY;
        
        switch (type) {
            case 'spark':
                this.spawnSpark(layer, finalX, finalY, scale);
                break;
            case 'flash':
                this.spawnFlash(layer, finalX, finalY, scale);
                break;
            case 'ring':
                this.spawnRing(layer, finalX, finalY, scale);
                break;
            case 'slash':
            case 'thrust':
                this.spawnSlash(layer, finalX, finalY, dir, scale);
                break;
            case 'arrow':
            case 'wedge':
                this.spawnArrow(layer, finalX, finalY, dir, index, scale);
                break;
            case 'debris':
                this.spawnDebris(layer, finalX, finalY, scale);
                break;
            case 'wave':
                this.spawnWave(layer, finalX, finalY, scale);
                break;
            case 'star':
                this.spawnStar(layer, finalX, finalY, scale);
                break;
            case 'line':
                this.spawnLine(layer, finalX, finalY, index, scale);
                break;
            case 'smoke':
                this.spawnSmoke(layer, finalX, finalY, scale);
                break;
            case 'symbol':
                this.spawnSymbol(layer, finalX, finalY, scale);
                break;
            case 'projectile':
                this.spawnProjectile(layer, finalX, finalY, dir, scale, options);
                break;
            case 'energy_orb':
                this.spawnEnergyOrb(layer, finalX, finalY, scale);
                break;
            case 'electric':
                this.spawnElectric(layer, finalX, finalY, index, scale);
                break;
            case 'comet':
                this.spawnComet(layer, finalX, finalY, scale);
                break;
            case 'sword_arc':
                this.spawnSwordArc(layer, finalX, finalY, dir, index, scale);
                break;
            default:
                this.spawnSpark(layer, finalX, finalY, scale);
        }
    },
    
    // ==================== 파티클 스폰 (PixiJS Sprite) ====================
    
    spawnSpark(def, x, y, scale) {
        const count = def.count || 5;
        
        for (let i = 0; i < count; i++) {
            const speed = this.getRandValue(def.speed || 5) * scale;
            const angle = Math.random() * Math.PI * 2;
            const size = this.getRandValue(def.size || 5) * scale;
            const color = this.getRandomColor(def.colors || def.color || '#fbbf24');
            
            this.createPixiParticle({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color: this.colorToHex(color),
                gravity: def.gravity || 0.2,
                life: this.getRandValue(def.life || 300),
                type: 'circle'
            });
        }
    },
    
    spawnFlash(def, x, y, scale) {
        const size = (def.size || 50) * scale;
        const color = def.color || '#ffffff';
        
        // Graphics 기반 플래시
        const flash = new PIXI.Graphics();
        flash.beginFill(this.colorToHex(color), 0.8);
        flash.drawCircle(0, 0, size);
        flash.endFill();
        flash.position.set(x, y);
        
        this.vfxContainer.addChild(flash);
        
        // 페이드 아웃
        if (typeof gsap !== 'undefined') {
            gsap.to(flash, {
                alpha: 0,
                width: size * 1.5,
                height: size * 1.5,
                duration: (def.life || 80) / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(flash);
                    flash.destroy();
                }
            });
        }
    },
    
    spawnRing(def, x, y, scale) {
        const startSize = (def.size || 20) * scale;
        const maxSize = (def.maxSize || 100) * scale;
        const color = def.color || '#60a5fa';
        const life = def.life || 200;
        
        const ring = new PIXI.Graphics();
        ring.lineStyle(3, this.colorToHex(color), 1);
        ring.drawCircle(0, 0, startSize);
        ring.position.set(x, y);
        
        this.vfxContainer.addChild(ring);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(ring.scale, {
                x: maxSize / startSize,
                y: maxSize / startSize,
                duration: life / 1000,
                ease: 'power2.out'
            });
            gsap.to(ring, {
                alpha: 0,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(ring);
                    ring.destroy();
                }
            });
        }
    },
    
    spawnSlash(def, x, y, dir, scale) {
        const length = this.getRandValue(def.length || 80) * scale;
        const width = (def.width || 15) * scale;
        const angle = (def.angle || -30) * (Math.PI / 180);
        const color = def.color || '#ffffff';
        
        const slash = new PIXI.Graphics();
        slash.lineStyle(width, this.colorToHex(color), 1);
        slash.moveTo(-length/2, 0);
        slash.lineTo(length/2, 0);
        
        slash.position.set(x, y);
        slash.rotation = angle * dir;
        slash.scale.x = dir;
        
        this.vfxContainer.addChild(slash);
        
        const life = def.life || 150;
        if (typeof gsap !== 'undefined') {
            gsap.to(slash, {
                alpha: 0,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(slash);
                    slash.destroy();
                }
            });
        }
    },
    
    spawnDebris(def, x, y, scale) {
        const count = def.count || 8;
        
        for (let i = 0; i < count; i++) {
            const speed = this.getRandValue(def.speed || 8) * scale;
            const angle = Math.random() * Math.PI * 2;
            const size = this.getRandValue(def.size || 4) * scale;
            const colors = def.colors || [def.color || '#888888'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.createPixiParticle({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - speed * 0.5,
                size,
                color: this.colorToHex(color),
                gravity: def.gravity || 0.3,
                life: this.getRandValue(def.life || 400),
                type: 'square'
            });
        }
    },
    
    spawnWave(def, x, y, scale) {
        const startSize = (def.startSize || 30) * scale;
        const maxSize = (def.maxSize || 100) * scale;
        const thickness = (def.thickness || 8) * scale;
        const color = def.color || '#60a5fa';
        const startAngle = (def.startAngle || -90) * (Math.PI / 180);
        const endAngle = (def.endAngle || 90) * (Math.PI / 180);
        
        const wave = new PIXI.Graphics();
        wave.lineStyle(thickness, this.colorToHex(color), 1);
        wave.arc(0, 0, startSize, startAngle, endAngle);
        wave.position.set(x, y);
        
        this.vfxContainer.addChild(wave);
        
        const life = def.life || 150;
        if (typeof gsap !== 'undefined') {
            gsap.to(wave.scale, {
                x: maxSize / startSize,
                y: maxSize / startSize,
                duration: life / 1000,
                ease: 'power2.out'
            });
            gsap.to(wave, {
                alpha: 0,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(wave);
                    wave.destroy();
                }
            });
        }
    },
    
    spawnStar(def, x, y, scale) {
        const size = this.getRandValue(def.size || 15) * scale;
        const color = this.getRandomColor(def.colors || def.color || '#fbbf24');
        
        this.createPixiParticle({
            x, y,
            vx: 0,
            vy: def.floatUp ? -1 : 0,
            size,
            color: this.colorToHex(color),
            gravity: 0,
            life: def.life || 300,
            type: 'star',
            rotationSpeed: 0.05
        });
    },
    
    // ==================== 추가 파티클 타입들 ====================
    
    // 🔺 화살표/웨지 파티클
    spawnArrow(def, x, y, dir, index, scale) {
        const length = this.getRandValue(def.length || 50) * scale;
        const width = (def.width || 60) * scale;
        const color = def.color || '#ffffff';
        const glow = def.glow || '#a78bfa';
        const life = def.life || 120;
        
        const arrow = new PIXI.Graphics();
        const tipAngle = (def.tipAngle || 35) * Math.PI / 180;
        
        // 화살표 모양
        arrow.beginFill(this.colorToHex(glow), 0.5);
        arrow.moveTo(length, 0);
        arrow.lineTo(0, -width * Math.sin(tipAngle));
        arrow.lineTo(length * 0.3, 0);
        arrow.lineTo(0, width * Math.sin(tipAngle));
        arrow.closePath();
        arrow.endFill();
        
        arrow.lineStyle(3, this.colorToHex(color), 1);
        arrow.moveTo(0, -width * Math.sin(tipAngle));
        arrow.lineTo(length, 0);
        arrow.lineTo(0, width * Math.sin(tipAngle));
        
        arrow.position.set(x, y);
        arrow.scale.x = dir;
        
        this.vfxContainer.addChild(arrow);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(arrow, {
                alpha: 0,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(arrow);
                    arrow.destroy();
                }
            });
        }
    },
    
    // 📏 라인 파티클
    spawnLine(def, x, y, index, scale) {
        const angleStep = def.angleStep || 45;
        const angle = index * angleStep * (Math.PI / 180);
        const length = this.getRandValue(def.length || 30) * scale;
        const width = (def.width || 3) * scale;
        const color = def.color || '#fbbf24';
        const life = def.life || 150;
        
        const line = new PIXI.Graphics();
        line.lineStyle(width, this.colorToHex(color), 1);
        line.moveTo(0, 0);
        line.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        line.position.set(x, y);
        
        this.vfxContainer.addChild(line);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(line, {
                alpha: 0,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(line);
                    line.destroy();
                }
            });
        }
    },
    
    // 💨 연기 파티클
    spawnSmoke(def, x, y, scale) {
        const spread = (def.spread || 30) * scale;
        const size = this.getRandValue(def.size || 20) * scale;
        const speed = this.getRandValue(def.speed || 2) * scale;
        const angleRange = def.angle || { min: -180, max: 180 };
        const angleDeg = angleRange.min + Math.random() * (angleRange.max - angleRange.min);
        const angleRad = angleDeg * Math.PI / 180;
        const color = def.color || '#333333';
        const life = this.getRandValue(def.life || 400);
        
        this.createPixiParticle({
            x: x + (Math.random() - 0.5) * spread,
            y: y + (Math.random() - 0.5) * spread,
            vx: Math.cos(angleRad) * speed,
            vy: Math.sin(angleRad) * speed,
            size,
            color: this.colorToHex(color),
            gravity: def.gravity || -0.1,
            life,
            type: 'circle',
            rotationSpeed: (Math.random() - 0.5) * 0.05
        });
    },
    
    // ⭐ 심볼(이모지) 파티클
    spawnSymbol(def, x, y, scale) {
        const symbol = def.symbol || '⭐';
        const size = (def.size || 30) * scale;
        const life = def.life || 500;
        
        const text = new PIXI.Text(symbol, {
            fontSize: size,
            fill: 0xffffff
        });
        text.anchor.set(0.5);
        text.position.set(x, y);
        
        this.vfxContainer.addChild(text);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(text, {
                y: y - 50,
                alpha: 0,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(text);
                    text.destroy();
                }
            });
        }
    },
    
    // 🎯 프로젝타일 파티클
    spawnProjectile(def, startX, startY, dir, scale, options) {
        const speed = (def.speed || 25) * scale;
        const size = (def.size || 20) * scale;
        const color = def.color || '#94a3b8';
        const shape = def.shape || 'circle';
        
        // 타겟 계산
        let targetX = startX + dir * 400;
        let targetY = startY;
        
        if (options?.targetX !== undefined) {
            targetX = options.targetX;
            targetY = options.targetY || startY;
        }
        
        const projectile = new PIXI.Graphics();
        
        if (shape === 'dagger') {
            projectile.beginFill(this.colorToHex(color));
            projectile.moveTo(size * 1.2, 0);
            projectile.lineTo(size * 0.3, -size * 0.25);
            projectile.lineTo(-size * 0.4, -size * 0.15);
            projectile.lineTo(-size * 0.6, 0);
            projectile.lineTo(-size * 0.4, size * 0.15);
            projectile.lineTo(size * 0.3, size * 0.25);
            projectile.closePath();
            projectile.endFill();
        } else if (shape === 'shuriken') {
            projectile.beginFill(this.colorToHex(color));
            for (let i = 0; i < 4; i++) {
                const rot = i * Math.PI / 2;
                projectile.moveTo(Math.cos(rot) * size, Math.sin(rot) * size);
                projectile.lineTo(Math.cos(rot + 0.3) * size * 0.3, Math.sin(rot + 0.3) * size * 0.3);
                projectile.lineTo(0, 0);
                projectile.lineTo(Math.cos(rot - 0.3) * size * 0.3, Math.sin(rot - 0.3) * size * 0.3);
            }
            projectile.endFill();
        } else {
            projectile.beginFill(this.colorToHex(color));
            projectile.drawCircle(0, 0, size);
            projectile.endFill();
        }
        
        projectile.position.set(startX, startY);
        this.vfxContainer.addChild(projectile);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(projectile, {
                x: targetX,
                y: targetY,
                rotation: def.rotation ? Math.PI * 4 : 0,
                duration: Math.abs(targetX - startX) / speed / 60,
                ease: 'none',
                onComplete: () => {
                    this.vfxContainer.removeChild(projectile);
                    projectile.destroy();
                    
                    if (def.onHitVFX) {
                        this.trigger(def.onHitVFX, targetX, targetY);
                    }
                }
            });
        }
    },
    
    // 🔮 에너지 오브 파티클
    spawnEnergyOrb(def, x, y, scale) {
        const size = this.getRandValue(def.size || 20) * scale;
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#fbbf24'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const spread = (def.spread || 0) * scale;
        const life = this.getRandValue(def.life || 150);
        
        const orb = new PIXI.Graphics();
        orb.beginFill(this.colorToHex(color), 0.8);
        orb.drawCircle(0, 0, size);
        orb.endFill();
        
        orb.position.set(
            x + (Math.random() - 0.5) * spread,
            y + (Math.random() - 0.5) * spread
        );
        
        this.vfxContainer.addChild(orb);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(orb, {
                alpha: 0,
                width: size * 1.5,
                height: size * 1.5,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(orb);
                    orb.destroy();
                }
            });
        }
    },
    
    // ⚡ 전기 파티클
    spawnElectric(def, x, y, index, scale) {
        const length = this.getRandValue(def.length || 50) * scale;
        const width = (def.width || 2) * scale;
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#60a5fa'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angleStep = def.angleStep || 45;
        const angle = angleStep * index * (Math.PI / 180);
        const segments = def.segments || 5;
        const life = this.getRandValue(def.life || 120);
        
        const electric = new PIXI.Graphics();
        electric.lineStyle(width, this.colorToHex(color), 1);
        
        // 지그재그 전기 효과
        let currentX = 0;
        let currentY = 0;
        electric.moveTo(0, 0);
        
        for (let i = 0; i < segments; i++) {
            const segLen = length / segments;
            const jitter = (Math.random() - 0.5) * 15;
            currentX += Math.cos(angle) * segLen + Math.sin(angle) * jitter;
            currentY += Math.sin(angle) * segLen - Math.cos(angle) * jitter;
            electric.lineTo(currentX, currentY);
        }
        
        electric.position.set(x, y);
        this.vfxContainer.addChild(electric);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(electric, {
                alpha: 0,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(electric);
                    electric.destroy();
                }
            });
        }
    },
    
    // ☄️ 혜성 파티클
    spawnComet(def, x, y, scale) {
        const size = this.getRandValue(def.size || 15) * scale;
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#fbbf24'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const speed = this.getRandValue(def.speed || 8) * scale;
        const angle = Math.random() * Math.PI * 2;
        const life = this.getRandValue(def.life || 250);
        
        this.createPixiParticle({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size,
            color: this.colorToHex(color),
            gravity: 0,
            life,
            type: 'circle'
        });
    },
    
    // ⚔️ 검 궤적 아크 파티클
    spawnSwordArc(def, x, y, dir, index, scale) {
        const radius = this.getRandValue(def.radius || 60) * scale;
        const thickness = (def.thickness || 15) * scale;
        const startAngle = (def.startAngle || -60) * (Math.PI / 180);
        const endAngle = (def.endAngle || 60) * (Math.PI / 180);
        const colors = Array.isArray(def.colors) ? def.colors : [def.color || '#ffffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const life = this.getRandValue(def.life || 180);
        
        const arc = new PIXI.Graphics();
        arc.lineStyle(thickness, this.colorToHex(color), 1);
        arc.arc(0, 0, radius, startAngle, endAngle);
        arc.position.set(x, y);
        arc.scale.x = dir;
        
        this.vfxContainer.addChild(arc);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(arc, {
                alpha: 0,
                duration: life / 1000,
                ease: 'power2.out',
                onComplete: () => {
                    this.vfxContainer.removeChild(arc);
                    arc.destroy();
                }
            });
        }
    },
    
    // ==================== PixiJS 파티클 생성 ====================
    createPixiParticle(data) {
        if (this.particles.length >= this.maxParticles) {
            // 가장 오래된 파티클 제거
            const oldest = this.particles.shift();
            if (oldest.sprite?.parent) {
                oldest.sprite.parent.removeChild(oldest.sprite);
            }
        }
        
        // 텍스처 선택
        let texture = this.textures?.circle;
        if (data.type === 'square') texture = this.textures?.square;
        if (data.type === 'star') texture = this.textures?.star;
        
        if (!texture) {
            // 폴백: 기본 텍스처 생성
            texture = PIXI.Texture.WHITE;
        }
        
        // 스프라이트 생성
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.position.set(data.x, data.y);
        sprite.scale.set(data.size / 10);  // 기본 텍스처가 10px 기준
        sprite.tint = data.color || 0xffffff;
        sprite.alpha = 1;
        
        this.particleContainer.addChild(sprite);
        
        // 파티클 데이터 저장
        const particle = {
            sprite,
            vx: data.vx || 0,
            vy: data.vy || 0,
            gravity: data.gravity || 0,
            life: data.life || 300,
            maxLife: data.life || 300,
            born: performance.now(),
            rotationSpeed: data.rotationSpeed || 0
        };
        
        this.particles.push(particle);
        return particle;
    },
    
    // ==================== 렌더 루프 ====================
    startRenderLoop() {
        const update = () => {
            const now = performance.now();
            
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                const age = now - p.born;
                
                if (age >= p.maxLife) {
                    // 파티클 제거
                    if (p.sprite?.parent) {
                        p.sprite.parent.removeChild(p.sprite);
                    }
                    this.particles.splice(i, 1);
                    continue;
                }
                
                // 물리 업데이트
                p.vx *= 0.98;  // 마찰
                p.vy += p.gravity;
                
                p.sprite.x += p.vx;
                p.sprite.y += p.vy;
                
                // 회전
                if (p.rotationSpeed) {
                    p.sprite.rotation += p.rotationSpeed;
                }
                
                // 알파 페이드
                const progress = age / p.maxLife;
                p.sprite.alpha = 1 - progress;
                
                // 크기 축소
                const scaleFactor = 1 - progress * 0.3;
                p.sprite.scale.set(p.sprite.scale.x * (scaleFactor / (1 - (progress - 0.016) * 0.3) || 1));
            }
            
            this.animationFrame = requestAnimationFrame(update);
        };
        
        update();
    },
    
    // ==================== 유틸리티 ====================
    getRandValue(val) {
        if (typeof val === 'object' && val.min !== undefined && val.max !== undefined) {
            return val.min + Math.random() * (val.max - val.min);
        }
        return val || 0;
    },
    
    getRandomColor(colors) {
        if (Array.isArray(colors)) {
            return colors[Math.floor(Math.random() * colors.length)];
        }
        return colors;
    },
    
    colorToHex(color) {
        if (typeof color === 'number') return color;
        if (typeof color === 'string') {
            if (color.startsWith('0x')) return parseInt(color, 16);
            if (color.startsWith('#')) return parseInt(color.slice(1), 16);
        }
        return 0xffffff;
    },
    
    // ==================== PixiJS 필터 시스템 ====================
    
    // 🌟 글로우 필터 적용
    applyGlow(sprite, options = {}) {
        if (!sprite) return;
        
        const color = options.color || 0x60a5fa;
        const outerStrength = options.strength || 4;
        const innerStrength = options.innerStrength || 1;
        const distance = options.distance || 15;
        
        // PixiJS GlowFilter (pixi-filters 필요)
        if (typeof PIXI.filters?.GlowFilter !== 'undefined') {
            const glowFilter = new PIXI.filters.GlowFilter({
                distance: distance,
                outerStrength: outerStrength,
                innerStrength: innerStrength,
                color: color,
                quality: 0.3
            });
            
            sprite.filters = sprite.filters || [];
            sprite.filters.push(glowFilter);
            sprite._ddooGlowFilter = glowFilter;
            
            if (options.duration) {
                setTimeout(() => {
                    this.removeGlow(sprite);
                }, options.duration);
            }
        } else {
            // 폴백: 틴트로 대체
            sprite._originalTint = sprite.tint;
            sprite.tint = color;
            
            if (options.duration) {
                setTimeout(() => {
                    sprite.tint = sprite._originalTint || 0xffffff;
                }, options.duration);
            }
        }
    },
    
    // 글로우 제거
    removeGlow(sprite) {
        if (!sprite) return;
        
        if (sprite._ddooGlowFilter && sprite.filters) {
            const idx = sprite.filters.indexOf(sprite._ddooGlowFilter);
            if (idx !== -1) {
                sprite.filters.splice(idx, 1);
            }
            delete sprite._ddooGlowFilter;
        }
        
        if (sprite._originalTint !== undefined) {
            sprite.tint = sprite._originalTint;
            delete sprite._originalTint;
        }
    },
    
    // 🌸 블룸 필터 적용
    applyBloom(container, options = {}) {
        if (!container) return;
        
        const blur = options.blur || 2;
        const brightness = options.brightness || 1.5;
        
        if (typeof PIXI.filters?.BloomFilter !== 'undefined') {
            const bloomFilter = new PIXI.filters.BloomFilter({
                blur: blur,
                brightness: brightness
            });
            
            container.filters = container.filters || [];
            container.filters.push(bloomFilter);
            container._ddooBloomFilter = bloomFilter;
            
            if (options.duration) {
                setTimeout(() => {
                    this.removeBloom(container);
                }, options.duration);
            }
        }
    },
    
    // 블룸 제거
    removeBloom(container) {
        if (!container) return;
        
        if (container._ddooBloomFilter && container.filters) {
            const idx = container.filters.indexOf(container._ddooBloomFilter);
            if (idx !== -1) {
                container.filters.splice(idx, 1);
            }
            delete container._ddooBloomFilter;
        }
    },
    
    // 💥 충격파 효과
    triggerShockwave(x, y, options = {}) {
        if (!this.stageContainer) return;
        
        if (typeof PIXI.filters?.ShockwaveFilter !== 'undefined') {
            const shockwave = new PIXI.filters.ShockwaveFilter(
                [x / this.pixiApp.screen.width, y / this.pixiApp.screen.height],
                {
                    amplitude: options.amplitude || 30,
                    wavelength: options.wavelength || 160,
                    speed: options.speed || 300,
                    radius: options.radius || -1
                },
                0 // time
            );
            
            this.stageContainer.filters = this.stageContainer.filters || [];
            this.stageContainer.filters.push(shockwave);
            
            const startTime = performance.now();
            const duration = options.duration || 500;
            
            const animate = () => {
                const elapsed = performance.now() - startTime;
                shockwave.time = elapsed / 1000;
                
                if (elapsed < duration) {
                    requestAnimationFrame(animate);
                } else {
                    const idx = this.stageContainer.filters.indexOf(shockwave);
                    if (idx !== -1) {
                        this.stageContainer.filters.splice(idx, 1);
                    }
                }
            };
            
            animate();
        } else {
            // 폴백: 링 이펙트로 대체
            this.spawnRing({
                size: 20,
                maxSize: options.radius || 200,
                color: '#ffffff',
                life: options.duration || 500
            }, x, y, 1);
        }
    },
    
    // 🎯 타격 효과 (글로우 + 플래시)
    triggerHitEffect(sprite, options = {}) {
        if (!sprite) return;
        
        const color = options.color || 0xffffff;
        const duration = options.duration || 150;
        
        // 플래시 효과
        const bounds = sprite.getBounds();
        this.spawnFlash({
            size: Math.max(bounds.width, bounds.height) * 0.6,
            color: '#ffffff',
            life: 80
        }, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, 1);
        
        // 글로우 효과
        this.applyGlow(sprite, {
            color: color,
            strength: 6,
            distance: 20,
            duration: duration
        });
    },
    
    // ==================== 복셀 쉐터 시스템 ====================
    
    // 🎆 스프라이트 산산조각 효과
    spawnVoxelShatter(sprite, options = {}) {
        if (!sprite || !sprite.texture) return;
        
        const gridSize = options.gridSize || 8;
        const force = options.force || 12;
        const gravity = options.gravity || 0.4;
        const life = options.life || 500;
        const color = options.color || null;
        const dirBias = options.dirBias || 0;
        
        // 스프라이트 위치 및 크기
        const container = sprite.parent;
        const containerX = container ? container.x : sprite.x;
        const containerY = container ? container.y : sprite.y;
        
        const charWidth = options.width || 60;
        const charHeight = options.height || 80;
        
        const spriteCenterX = containerX;
        const spriteCenterY = containerY - charHeight * 0.4;
        
        const pieceW = charWidth / gridSize;
        const pieceH = charHeight / gridSize;
        
        console.log('[DDOOVfx] 🎆 Voxel Shatter:', { x: spriteCenterX, y: spriteCenterY, gridSize });
        
        // 색상 팔레트 (픽셀 추출 실패 시 사용)
        const fallbackColors = color ? [color] : ['#888888', '#666666', '#aaaaaa', '#555555'];
        
        // 조각 생성
        for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
                const px = (spriteCenterX - charWidth/2) + (gx + 0.5) * pieceW;
                const py = (spriteCenterY - charHeight/2) + (gy + 0.5) * pieceH;
                
                const dx = px - spriteCenterX;
                const dy = py - spriteCenterY;
                const angle = Math.atan2(dy, dx);
                
                const speed = force * (0.5 + Math.random() * 0.8);
                const biasAngle = angle + dirBias * 0.5;
                
                const pieceColor = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
                const finalSize = Math.min(pieceW, pieceH) * (0.6 + Math.random() * 0.4);
                
                this.createPixiParticle({
                    x: px,
                    y: py,
                    vx: Math.cos(biasAngle) * speed + (Math.random() - 0.5) * force * 0.5,
                    vy: Math.sin(biasAngle) * speed - force * 0.3 - Math.random() * force * 0.5,
                    size: finalSize,
                    color: this.colorToHex(pieceColor),
                    gravity: gravity,
                    life: life * (0.7 + Math.random() * 0.6),
                    type: 'square',
                    rotationSpeed: (Math.random() - 0.5) * 0.3
                });
            }
        }
    },
    
    // 타겟 스프라이트에 쉐터 효과
    shatterTarget(target, options = {}) {
        let sprite = null;
        
        if (typeof target === 'string') {
            // DDOOCharacter에서 찾기
            if (typeof DDOOCharacter !== 'undefined') {
                const char = DDOOCharacter.characters?.get(target);
                sprite = char?.sprite;
            }
        } else if (target?.texture) {
            sprite = target;
        }
        
        if (sprite) {
            if (options.hideSprite !== false) {
                const originalAlpha = sprite.alpha;
                sprite.alpha = 0;
                
                setTimeout(() => {
                    sprite.alpha = originalAlpha;
                }, options.hideTime || 200);
            }
            
            this.spawnVoxelShatter(sprite, options);
        }
    },
    
    // ==================== 정리 ====================
    clearAll() {
        // 모든 파티클 제거
        this.particles.forEach(p => {
            if (p.sprite?.parent) {
                p.sprite.parent.removeChild(p.sprite);
            }
        });
        this.particles.length = 0;
        
        // VFX 컨테이너 클리어
        if (this.vfxContainer) {
            this.vfxContainer.removeChildren();
        }
    },
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.clearAll();
        
        if (this.particleContainer?.parent) {
            this.particleContainer.parent.removeChild(this.particleContainer);
        }
        if (this.vfxContainer?.parent) {
            this.vfxContainer.parent.removeChild(this.vfxContainer);
        }
        
        this.initialized = false;
    },
    
    // ==================== 통계 ====================
    getStats() {
        return {
            particles: this.particles.length,
            maxParticles: this.maxParticles,
            vfxCached: this.vfxCache.size
        };
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOOVfx = DDOOVfx;
}

console.log('[DDOOVfx] 💥 VFX 모듈 로드됨 (PixiJS ParticleContainer)');
