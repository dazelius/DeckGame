// =====================================================
// Grid AOE System - 그리드 영역 효과 시스템
// =====================================================

const GridAOE = {
    game: null,
    app: null,
    container: null,
    
    // Active zone effects on the grid
    zones: [],
    
    // Zone type definitions
    zoneTypes: {
        fire: {
            name: '화염 지대',
            color: 0xff4400,
            particleColor: 0xff6600,
            damage: 3,
            duration: 2, // turns
            applyOnEnter: true,
            applyOnTurnStart: true,
            animation: 'fire',
            sound: 'burn'
        },
        poison: {
            name: '독 지대',
            color: 0x44ff00,
            particleColor: 0x88ff44,
            damage: 2,
            duration: 3,
            applyOnEnter: true,
            applyOnTurnStart: true,
            animation: 'poison',
            sound: 'poison'
        },
        ice: {
            name: '빙결 지대',
            color: 0x44ddff,
            particleColor: 0xaaeeff,
            damage: 0,
            duration: 2,
            slowAmount: 1, // Reduces actions
            applyOnEnter: true,
            applyOnTurnStart: false,
            animation: 'ice',
            sound: 'freeze'
        },
        holy: {
            name: '신성 지대',
            color: 0xffffaa,
            particleColor: 0xffffdd,
            damage: 0,
            heal: 2,
            duration: 2,
            applyOnEnter: true,
            applyOnTurnStart: true,
            animation: 'holy',
            affectsAllies: true,
            affectsEnemies: false
        },
        darkness: {
            name: '암흑 지대',
            color: 0x440066,
            particleColor: 0x6600aa,
            damage: 2,
            duration: 2,
            applyOnEnter: true,
            applyOnTurnStart: true,
            animation: 'darkness'
        },
        lightning: {
            name: '번개 지대',
            color: 0xffff00,
            particleColor: 0xffffaa,
            damage: 4,
            duration: 1,
            applyOnEnter: true,
            applyOnTurnStart: false,
            animation: 'lightning'
        }
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef, pixiApp) {
        this.game = gameRef;
        this.app = pixiApp;
        
        // Use game's ground container for zone effects (below units)
        if (this.game.containers && this.game.containers.ground) {
            this.container = this.game.containers.ground;
        } else {
            // Fallback: create own container
            this.container = new PIXI.Container();
            this.container.sortableChildren = true;
            this.container.zIndex = 5; // Below units, above grid
            this.app.stage.addChild(this.container);
        }
        
        // Start animation ticker
        this.app.ticker.add(() => this.updateAnimations());
        
        console.log('[GridAOE] 그리드 영역 효과 시스템 초기화 완료 (ground container)');
    },
    
    // ==========================================
    // 영역 효과 생성
    // ==========================================
    createZone(type, gridX, gridZ, customOptions = {}) {
        const zoneDef = this.zoneTypes[type];
        if (!zoneDef) {
            console.warn(`[GridAOE] Unknown zone type: ${type}`);
            return null;
        }
        
        // Merge with custom options
        const options = { ...zoneDef, ...customOptions };
        
        // Check if zone already exists at this position
        const existingZone = this.zones.find(z => z.gridX === gridX && z.gridZ === gridZ && z.type === type);
        if (existingZone) {
            // Refresh duration
            existingZone.turnsRemaining = Math.max(existingZone.turnsRemaining, options.duration);
            this.showRefreshEffect(existingZone);
            return existingZone;
        }
        
        // Create zone object
        const zone = {
            id: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            gridX: gridX,
            gridZ: gridZ,
            turnsRemaining: options.duration,
            options: options,
            graphics: null,
            particles: [],
            animationTime: 0
        };
        
        // Create visual
        this.createZoneVisual(zone);
        
        // Add to active zones
        this.zones.push(zone);
        
        // Apply immediate effect to units in zone
        if (options.applyOnEnter) {
            this.applyZoneEffectToUnitsAt(zone, gridX, gridZ);
        }
        
        console.log(`[GridAOE] Created ${type} zone at (${gridX}, ${gridZ})`);
        return zone;
    },
    
    // ==========================================
    // 영역 효과 시각화 생성
    // ==========================================
    createZoneVisual(zone) {
        const pos = this.game.getCellCenter(zone.gridX, zone.gridZ);
        if (!pos) return;
        
        // Main container for this zone
        const zoneContainer = new PIXI.Container();
        zoneContainer.x = pos.x;
        zoneContainer.y = pos.y;
        zoneContainer.zIndex = zone.gridZ; // Depth sort
        
        // Type-specific visual creation
        if (zone.type === 'fire') {
            this.createFireZoneVisual(zone, zoneContainer);
        } else {
            // Default base glow for other types
            const baseGlow = new PIXI.Graphics();
            this.drawZoneBase(baseGlow, zone.options.color, zone.type);
            zoneContainer.addChild(baseGlow);
            zone.baseGlow = baseGlow;
            
            // Particle container
            const particleContainer = new PIXI.Container();
            zoneContainer.addChild(particleContainer);
            zone.particleContainer = particleContainer;
            
            // Create initial particles
            this.createZoneParticles(zone);
        }
        
        zone.graphics = zoneContainer;
        
        // Spawn animation
        zoneContainer.scale.set(0);
        zoneContainer.alpha = 0;
        gsap.to(zoneContainer.scale, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' });
        gsap.to(zoneContainer, { alpha: 1, duration: 0.3 });
        
        // Fire burst on spawn
        if (zone.type === 'fire') {
            this.fireSpawnBurst(pos.x, pos.y);
        }
        
        this.container.addChild(zoneContainer);
    },
    
    // ==========================================
    // 화염 지대 전용 시각화 - 3D 볼류메트릭 파티클 시스템
    // ==========================================
    createFireZoneVisual(zone, container) {
        const cellSize = this.getApproxCellSize();
        const size = Math.max(cellSize * 1.2, 120);
        zone.zoneSize = size;
        
        // ========================================
        // Layer 1: 바닥 스콜치 마크 (그을음)
        // ========================================
        const scorch = new PIXI.Graphics();
        scorch.beginFill(0x110500, 0.4);
        scorch.drawEllipse(0, 8, size * 0.75, size * 0.35);
        scorch.endFill();
        scorch.beginFill(0x220800, 0.3);
        scorch.drawEllipse(0, 5, size * 0.6, size * 0.28);
        scorch.endFill();
        container.addChild(scorch);
        zone.scorch = scorch;
        
        // ========================================
        // Layer 2: 3D 볼류메트릭 열기 (다중 글로우)
        // ========================================
        const heatLayers = [];
        for (let i = 4; i >= 0; i--) {
            const heat = new PIXI.Graphics();
            const layerSize = 0.5 + i * 0.12;
            const colors = [0xffffcc, 0xffcc44, 0xff8822, 0xff4400, 0xff2200];
            const alphas = [0.08, 0.12, 0.15, 0.12, 0.08];
            
            heat.beginFill(colors[i], alphas[i]);
            heat.drawEllipse(0, -i * 2, size * layerSize, size * layerSize * 0.5);
            heat.endFill();
            
            heat._baseY = -i * 2;
            heat._pulsePhase = i * 0.5;
            container.addChild(heat);
            heatLayers.push(heat);
        }
        zone.heatLayers = heatLayers;
        
        // ========================================
        // Layer 3: 3D 궤도 화염 파티클
        // ========================================
        const orbitContainer = new PIXI.Container();
        container.addChild(orbitContainer);
        zone.orbitContainer = orbitContainer;
        
        zone.orbitFlames = [];
        const NUM_ORBITS = 2;        // 3→2 경량화
        const FLAMES_PER_ORBIT = 4;  // 6→4 경량화
        
        for (let orbit = 0; orbit < NUM_ORBITS; orbit++) {
            const orbitRadius = size * (0.2 + orbit * 0.15);
            
            for (let i = 0; i < FLAMES_PER_ORBIT; i++) {
                const flame = this.create3DFlameParticle(size, orbit);
                const angle = (i / FLAMES_PER_ORBIT) * Math.PI * 2;
                
                flame._angle = angle;
                flame._orbit = orbitRadius;
                flame._orbitY = orbitRadius * 0.5; // Y축 압축 (원근)
                flame._speed = 0.8 + Math.random() * 0.4 - orbit * 0.15;
                flame._zPhase = Math.random() * Math.PI * 2;
                flame._baseScale = 0.7 + Math.random() * 0.4;
                flame._orbitIndex = orbit;
                
                orbitContainer.addChild(flame);
                zone.orbitFlames.push(flame);
            }
        }
        
        // ========================================
        // Layer 4: 중앙 핫스팟 (3D 코어)
        // ========================================
        const coreContainer = new PIXI.Container();
        container.addChild(coreContainer);
        zone.coreContainer = coreContainer;
        
        // 다층 코어 (밝은 중심)
        for (let i = 3; i >= 0; i--) {
            const core = new PIXI.Graphics();
            const coreSize = size * (0.08 + i * 0.05);
            const colors = [0xffffff, 0xffffcc, 0xffdd66, 0xffaa33];
            const alphas = [0.9, 0.7, 0.5, 0.4];
            
            core.beginFill(colors[i], alphas[i]);
            core.drawEllipse(0, 0, coreSize, coreSize * 0.6);
            core.endFill();
            
            core._pulsePhase = i * 0.3;
            coreContainer.addChild(core);
        }
        zone.cores = coreContainer.children;
        
        // ========================================
        // Layer 5: 수직 불꽃 기둥들
        // ========================================
        const pillarContainer = new PIXI.Container();
        container.addChild(pillarContainer);
        zone.pillarContainer = pillarContainer;
        
        zone.flamePillars = [];
        const NUM_PILLARS = 5;  // 8→5 경량화
        
        for (let i = 0; i < NUM_PILLARS; i++) {
            const pillar = this.create3DFlamePillar(size);
            const angle = (i / NUM_PILLARS) * Math.PI * 2 + Math.random() * 0.3;
            const dist = size * (0.15 + Math.random() * 0.25);
            
            pillar.x = Math.cos(angle) * dist;
            pillar.y = Math.sin(angle) * dist * 0.5;
            pillar._baseX = pillar.x;
            pillar._baseY = pillar.y;
            pillar._phase = Math.random() * Math.PI * 2;
            pillar._speed = 2 + Math.random() * 2;
            pillar._swayAmount = 3 + Math.random() * 5;
            
            pillarContainer.addChild(pillar);
            zone.flamePillars.push(pillar);
        }
        
        // ========================================
        // Layer 6: 3D 불씨/스파크 시스템
        // ========================================
        const emberContainer = new PIXI.Container();
        container.addChild(emberContainer);
        zone.emberContainer = emberContainer;
        zone.embers = [];
        
        // 초기 불씨 생성 (경량화: 30→15)
        for (let i = 0; i < 15; i++) {
            this.spawn3DFireEmber(zone);
        }
        
        // ========================================
        // Layer 7: 연기/아지랑이
        // ========================================
        const smokeContainer = new PIXI.Container();
        container.addChild(smokeContainer);
        zone.smokeContainer = smokeContainer;
        zone.smokeParticles = [];
        
        // 초기 연기 (경량화: 5→3)
        for (let i = 0; i < 3; i++) {
            this.spawn3DSmoke(zone);
        }
        
        // ========================================
        // 애니메이션 시작 시간 저장
        // ========================================
        zone._animTime = 0;
    },
    
    // ==========================================
    // 3D 화염 파티클 생성
    // ==========================================
    create3DFlameParticle(zoneSize, layer = 0) {
        const particle = new PIXI.Container();
        const scale = zoneSize / 100;
        
        // 외부 글로우
        const outerGlow = new PIXI.Graphics();
        const outerSize = (12 + Math.random() * 8) * scale;
        const glowColors = [0xff6600, 0xff4400, 0xff3300];
        outerGlow.beginFill(glowColors[layer] || 0xff4400, 0.3);
        outerGlow.drawCircle(0, 0, outerSize);
        outerGlow.endFill();
        particle.addChild(outerGlow);
        
        // 중간 불꽃
        const midFlame = new PIXI.Graphics();
        const midSize = outerSize * 0.7;
        midFlame.beginFill(0xff8844, 0.6);
        midFlame.drawCircle(0, 0, midSize);
        midFlame.endFill();
        particle.addChild(midFlame);
        
        // 밝은 코어
        const core = new PIXI.Graphics();
        const coreSize = outerSize * 0.4;
        core.beginFill(0xffcc66, 0.9);
        core.drawCircle(0, 0, coreSize);
        core.endFill();
        particle.addChild(core);
        
        // 핫스팟
        const hot = new PIXI.Graphics();
        hot.beginFill(0xffffaa, 0.8);
        hot.drawCircle(0, 0, coreSize * 0.5);
        hot.endFill();
        particle.addChild(hot);
        
        return particle;
    },
    
    // ==========================================
    // 3D 불꽃 기둥 생성
    // ==========================================
    create3DFlamePillar(zoneSize) {
        const pillar = new PIXI.Container();
        const scale = zoneSize / 100;
        const height = (25 + Math.random() * 35) * scale;
        const width = (10 + Math.random() * 8) * scale;
        
        // 여러 층의 불꽃 (3D 깊이감)
        for (let layer = 2; layer >= 0; layer--) {
            const flame = new PIXI.Graphics();
            const layerScale = 1 - layer * 0.2;
            const layerAlpha = 0.4 + layer * 0.2;
            const h = height * layerScale;
            const w = width * layerScale;
            
            // 외부 불꽃 (어두운)
            const colors = [0xff3300, 0xff5500, 0xff7700];
            flame.beginFill(colors[layer], layerAlpha * 0.5);
            flame.moveTo(0, 0);
            flame.bezierCurveTo(-w * 0.6, -h * 0.3, -w * 0.4, -h * 0.7, 0, -h);
            flame.bezierCurveTo(w * 0.4, -h * 0.7, w * 0.6, -h * 0.3, 0, 0);
            flame.endFill();
            
            // 내부 불꽃 (밝은)
            const innerColors = [0xffaa44, 0xffcc66, 0xffee88];
            flame.beginFill(innerColors[layer], layerAlpha);
            flame.moveTo(0, 0);
            flame.bezierCurveTo(-w * 0.3, -h * 0.25, -w * 0.2, -h * 0.6, 0, -h * 0.85);
            flame.bezierCurveTo(w * 0.2, -h * 0.6, w * 0.3, -h * 0.25, 0, 0);
            flame.endFill();
            
            flame.y = -layer * 2;
            pillar.addChild(flame);
        }
        
        // 핫스팟 코어
        const hotspot = new PIXI.Graphics();
        hotspot.beginFill(0xffffcc, 0.8);
        hotspot.drawEllipse(0, -height * 0.15, width * 0.3, height * 0.1);
        hotspot.endFill();
        pillar.addChild(hotspot);
        
        return pillar;
    },
    
    // ==========================================
    // 3D 불씨 생성
    // ==========================================
    spawn3DFireEmber(zone) {
        if (!zone.emberContainer) return;
        
        const zoneSize = zone.zoneSize || 100;
        const ember = new PIXI.Container();
        
        // 메인 불씨
        const size = 2 + Math.random() * 5;
        const colors = [0xffffaa, 0xffdd66, 0xffaa44, 0xff8833];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 글로우
        const glow = new PIXI.Graphics();
        glow.beginFill(color, 0.2);
        glow.drawCircle(0, 0, size * 3);
        glow.endFill();
        ember.addChild(glow);
        
        // 코어
        const core = new PIXI.Graphics();
        core.beginFill(color, 0.9);
        core.drawCircle(0, 0, size);
        core.endFill();
        ember.addChild(core);
        
        // 핫스팟
        const hot = new PIXI.Graphics();
        hot.beginFill(0xffffff, 0.8);
        hot.drawCircle(0, 0, size * 0.4);
        hot.endFill();
        ember.addChild(hot);
        
        // 위치 (3D 분포)
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * zoneSize * 0.4;
        ember.x = Math.cos(angle) * dist;
        ember.y = Math.sin(angle) * dist * 0.5;
        
        // 3D 속성
        ember._vx = (Math.random() - 0.5) * 1.5;
        ember._vy = -3 - Math.random() * 4;
        ember._vz = (Math.random() - 0.5) * 2; // Z축 속도 (깊이)
        ember._z = Math.random() * 20 - 10; // Z 위치
        ember._life = 1;
        ember._decay = 0.008 + Math.random() * 0.012;
        ember._wobble = Math.random() * Math.PI * 2;
        ember._wobbleSpeed = 8 + Math.random() * 4;
        ember._baseSize = size;
        
        zone.emberContainer.addChild(ember);
        zone.embers.push(ember);
    },
    
    // ==========================================
    // 3D 연기 생성
    // ==========================================
    spawn3DSmoke(zone) {
        if (!zone.smokeContainer) return;
        
        const zoneSize = zone.zoneSize || 100;
        const smoke = new PIXI.Container();
        
        // 다층 연기 (볼륨감)
        for (let i = 2; i >= 0; i--) {
            const puff = new PIXI.Graphics();
            const size = (8 + Math.random() * 12) + i * 4;
            const alpha = 0.15 - i * 0.03;
            
            puff.beginFill(0x332211, alpha);
            puff.drawCircle(i * 2, i * 1, size);
            puff.endFill();
            smoke.addChild(puff);
        }
        
        // 위치
        smoke.x = (Math.random() - 0.5) * zoneSize * 0.5;
        smoke.y = (Math.random() - 0.5) * zoneSize * 0.25;
        
        // 속성
        smoke._vx = (Math.random() - 0.5) * 0.8;
        smoke._vy = -1.5 - Math.random() * 1;
        smoke._life = 1;
        smoke._decay = 0.006 + Math.random() * 0.004;
        smoke._rotation = (Math.random() - 0.5) * 0.02;
        
        zone.smokeContainer.addChild(smoke);
        zone.smokeParticles.push(smoke);
    },
    
    // ==========================================
    // 그리드 셀 크기 추정
    // ==========================================
    getApproxCellSize() {
        const pos1 = this.game.getCellCenter(0, 0);
        const pos2 = this.game.getCellCenter(1, 0);
        if (pos1 && pos2) {
            return Math.abs(pos2.x - pos1.x);
        }
        return 100;
    },
    
    // ==========================================
    // 레거시 호환용 래퍼
    // ==========================================
    createFlameTongue(zoneSize = 100) {
        return this.create3DFlamePillar(zoneSize);
    },
    
    spawnFireEmber(zone) {
        this.spawn3DFireEmber(zone);
    },
    
    // ==========================================
    // 화염 스폰 버스트
    // ==========================================
    fireSpawnBurst(x, y) {
        const cellSize = this.getApproxCellSize();
        
        // Screen effects
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ff4400', 200, 0.4);
            CombatEffects.screenShake(12, 250);
        }
        
        // Burst particles (경량화: 25→12)
        for (let i = 0; i < 12; i++) {
            const particle = new PIXI.Graphics();
            const size = 5 + Math.random() * 10;
            
            particle.beginFill(0xff6600, 0.9);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            particle.beginFill(0xffaa00, 0.5);
            particle.drawCircle(0, 0, size * 1.8);
            particle.endFill();
            
            particle.x = x;
            particle.y = y;
            this.app.stage.addChild(particle);
            
            const angle = (Math.PI * 2 * i) / 25 + Math.random() * 0.3;
            const distance = cellSize * 0.5 + Math.random() * cellSize * 0.5;
            
            gsap.to(particle, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance * 0.5 - 40,
                alpha: 0,
                duration: 0.6 + Math.random() * 0.4,
                ease: 'power2.out',
                onComplete: () => {
                    this.app.stage.removeChild(particle);
                    particle.destroy();
                }
            });
        }
        
        // Fire pillar - bigger
        const pillar = new PIXI.Graphics();
        const pillarWidth = cellSize * 0.4;
        pillar.beginFill(0xff4400, 0.7);
        pillar.drawRect(-pillarWidth/2, -120, pillarWidth, 120);
        pillar.endFill();
        pillar.beginFill(0xffaa00, 0.5);
        pillar.drawRect(-pillarWidth/3, -120, pillarWidth*0.66, 120);
        pillar.endFill();
        pillar.beginFill(0xffdd00, 0.3);
        pillar.drawRect(-pillarWidth/5, -120, pillarWidth*0.4, 120);
        pillar.endFill();
        pillar.x = x;
        pillar.y = y;
        this.app.stage.addChild(pillar);
        
        gsap.to(pillar, {
            alpha: 0,
            duration: 0.5,
            onComplete: () => {
                this.app.stage.removeChild(pillar);
                pillar.destroy();
            }
        });
        gsap.to(pillar.scale, { x: 2, y: 1.5, duration: 0.5, ease: 'power2.out' });
    },
    
    // ==========================================
    // 영역 베이스 그리기
    // ==========================================
    drawZoneBase(graphics, color, type) {
        graphics.clear();
        
        // Cell size approximation (will be updated each frame)
        const size = 60;
        
        // Different patterns for different types
        switch (type) {
            case 'fire':
                // Flickering fire pattern
                graphics.beginFill(color, 0.3);
                graphics.drawEllipse(0, 0, size * 0.5, size * 0.3);
                graphics.endFill();
                
                graphics.lineStyle(2, 0xff8800, 0.6);
                graphics.drawEllipse(0, 0, size * 0.4, size * 0.25);
                break;
                
            case 'poison':
                // Bubbling poison
                graphics.beginFill(color, 0.25);
                graphics.drawEllipse(0, 0, size * 0.45, size * 0.28);
                graphics.endFill();
                
                graphics.lineStyle(2, 0x88ff44, 0.5);
                graphics.drawEllipse(0, 0, size * 0.35, size * 0.22);
                break;
                
            case 'ice':
                // Frozen hexagon
                graphics.beginFill(color, 0.35);
                this.drawHexagon(graphics, 0, 0, size * 0.4);
                graphics.endFill();
                
                graphics.lineStyle(2, 0xaaeeff, 0.7);
                this.drawHexagon(graphics, 0, 0, size * 0.3);
                break;
                
            case 'holy':
                // Sacred circle
                graphics.beginFill(color, 0.2);
                graphics.drawCircle(0, 0, size * 0.4);
                graphics.endFill();
                
                graphics.lineStyle(2, 0xffffcc, 0.6);
                graphics.drawCircle(0, 0, size * 0.3);
                break;
                
            case 'darkness':
                // Dark void
                graphics.beginFill(0x000000, 0.5);
                graphics.drawEllipse(0, 0, size * 0.45, size * 0.28);
                graphics.endFill();
                
                graphics.lineStyle(2, color, 0.6);
                graphics.drawEllipse(0, 0, size * 0.35, size * 0.22);
                break;
                
            case 'lightning':
                // Electric field
                graphics.beginFill(color, 0.25);
                graphics.drawEllipse(0, 0, size * 0.5, size * 0.3);
                graphics.endFill();
                break;
                
            default:
                graphics.beginFill(color, 0.3);
                graphics.drawEllipse(0, 0, size * 0.45, size * 0.28);
                graphics.endFill();
        }
    },
    
    // ==========================================
    // 육각형 그리기 헬퍼
    // ==========================================
    drawHexagon(graphics, cx, cy, radius) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            points.push(cx + radius * Math.cos(angle));
            points.push(cy + radius * 0.6 * Math.sin(angle)); // Flatten for isometric
        }
        graphics.drawPolygon(points);
    },
    
    // ==========================================
    // 파티클 생성
    // ==========================================
    createZoneParticles(zone) {
        const count = zone.type === 'fire' ? 8 : 5;
        
        for (let i = 0; i < count; i++) {
            this.spawnParticle(zone);
        }
    },
    
    spawnParticle(zone) {
        const particle = new PIXI.Graphics();
        const size = 3 + Math.random() * 4;
        
        particle.beginFill(zone.options.particleColor, 0.8);
        particle.drawCircle(0, 0, size);
        particle.endFill();
        
        // Random position within zone
        particle.x = (Math.random() - 0.5) * 50;
        particle.y = (Math.random() - 0.5) * 30;
        
        // Animation properties
        particle.vx = (Math.random() - 0.5) * 2;
        particle.vy = -1 - Math.random() * 2;
        particle.life = 1;
        particle.decay = 0.01 + Math.random() * 0.02;
        particle.baseSize = size;
        
        zone.particleContainer.addChild(particle);
        zone.particles.push(particle);
    },
    
    // ==========================================
    // 애니메이션 업데이트
    // ==========================================
    updateAnimations() {
        const delta = this.app.ticker.deltaMS / 1000;
        
        for (const zone of this.zones) {
            if (!zone.graphics) continue;
            
            zone.animationTime += delta;
            
            // Update position to sync with camera
            const pos = this.game.getCellCenter(zone.gridX, zone.gridZ);
            if (pos) {
                zone.graphics.x = pos.x;
                zone.graphics.y = pos.y;
            }
            
            // Type-specific animations
            if (zone.type === 'fire') {
                this.updateFireZone(zone, delta);
            } else {
                // Default animation for other types
                if (zone.baseGlow) {
                    const pulse = 0.8 + Math.sin(zone.animationTime * 3) * 0.2;
                    zone.baseGlow.alpha = pulse;
                }
                this.updateParticles(zone);
            }
        }
    },
    
    // ==========================================
    // 화염 지대 애니메이션 업데이트 - 3D 볼류메트릭 버전
    // ==========================================
    updateFireZone(zone, delta) {
        const t = zone.animationTime;
        zone._animTime = (zone._animTime || 0) + delta;
        
        // ========================================
        // 1. 열기 레이어 펄스 (3D 깊이감)
        // ========================================
        if (zone.heatLayers) {
            zone.heatLayers.forEach((heat, i) => {
                const phase = t * (2 + i * 0.5) + heat._pulsePhase;
                const pulse = 1 + Math.sin(phase) * 0.15;
                heat.scale.set(pulse, pulse * 0.7);
                heat.alpha = 0.08 + Math.sin(phase * 1.5) * 0.04 + (3 - i) * 0.02;
                heat.y = heat._baseY + Math.sin(phase * 0.8) * 2;
            });
        }
        
        // ========================================
        // 2. 3D 궤도 화염 파티클 회전
        // ========================================
        if (zone.orbitFlames) {
            zone.orbitFlames.forEach(flame => {
                flame._angle += delta * flame._speed;
                
                // 3D 원형 궤도 시뮬레이션
                const zOffset = Math.sin(flame._angle + flame._zPhase);
                const depthScale = 0.5 + zOffset * 0.5;
                
                // XY 위치 (타원 궤도)
                flame.x = Math.cos(flame._angle) * flame._orbit;
                flame.y = Math.sin(flame._angle) * flame._orbitY;
                
                // 깊이에 따른 스케일 & 알파
                const scale = flame._baseScale * depthScale;
                flame.scale.set(scale);
                flame.alpha = 0.4 + depthScale * 0.5;
                
                // 뒤에 있으면 더 어둡게 (3D 효과)
                if (zOffset < 0) {
                    flame.alpha *= 0.5;
                    flame.zIndex = -1;
                } else {
                    flame.zIndex = 1;
                }
            });
            
            // Z 정렬
            if (zone.orbitContainer) {
                zone.orbitContainer.sortChildren();
            }
        }
        
        // ========================================
        // 3. 코어 펄스
        // ========================================
        if (zone.cores) {
            zone.cores.forEach((core, i) => {
                const phase = t * (8 + i * 2) + (core._pulsePhase || 0);
                const pulse = 1 + Math.sin(phase) * 0.2;
                core.scale.set(pulse, pulse * 0.7);
            });
        }
        
        // ========================================
        // 4. 불꽃 기둥 애니메이션
        // ========================================
        if (zone.flamePillars) {
            zone.flamePillars.forEach(pillar => {
                pillar._phase += delta * pillar._speed;
                
                // 흔들림
                pillar.x = pillar._baseX + Math.sin(pillar._phase) * pillar._swayAmount;
                pillar.y = pillar._baseY + Math.cos(pillar._phase * 0.7) * 2;
                
                // 스케일 플리커
                const scaleX = 0.85 + Math.sin(pillar._phase * 2) * 0.2;
                const scaleY = 0.9 + Math.sin(pillar._phase * 1.5) * 0.15;
                pillar.scale.set(scaleX, scaleY);
                
                // 알파 플리커
                pillar.alpha = 0.7 + Math.sin(pillar._phase * 3) * 0.25;
                
                // 회전
                pillar.rotation = Math.sin(pillar._phase * 0.5) * 0.15;
            });
        }
        
        // ========================================
        // 5. 3D 불씨 업데이트
        // ========================================
        if (zone.embers) {
            const toRemove = [];
            
            for (const ember of zone.embers) {
                ember._wobble += delta * ember._wobbleSpeed;
                
                // 3D 이동
                ember.x += ember._vx + Math.sin(ember._wobble) * 0.8;
                ember.y += ember._vy;
                ember._z += ember._vz;
                ember._vy -= 0.02; // 위로 가속
                
                // Z축에 따른 스케일 (원근)
                const zScale = 0.6 + (ember._z + 10) / 30;
                ember.scale.set(Math.max(0.3, zScale));
                
                // 페이드
                ember._life -= ember._decay;
                ember.alpha = ember._life;
                
                if (ember._life <= 0) {
                    toRemove.push(ember);
                }
            }
            
            // 제거 및 재생성
            for (const e of toRemove) {
                const idx = zone.embers.indexOf(e);
                if (idx > -1) zone.embers.splice(idx, 1);
                if (zone.emberContainer) zone.emberContainer.removeChild(e);
                try { e.destroy({ children: true }); } catch(err) {}
                
                // 교체 생성
                this.spawn3DFireEmber(zone);
            }
            
            // 추가 불씨 (확률적, 경량화: 0.1→0.05)
            if (Math.random() < 0.05) {
                this.spawn3DFireEmber(zone);
            }
        }
        
        // ========================================
        // 6. 연기 업데이트
        // ========================================
        if (zone.smokeParticles) {
            const smokeToRemove = [];
            
            for (const smoke of zone.smokeParticles) {
                smoke.x += smoke._vx;
                smoke.y += smoke._vy;
                smoke._vy -= 0.01;
                smoke._life -= smoke._decay;
                smoke.alpha = smoke._life * 0.2;
                smoke.rotation += smoke._rotation;
                
                // 확장
                const currentScale = smoke.scale.x;
                smoke.scale.set(currentScale + 0.008);
                
                if (smoke._life <= 0) {
                    smokeToRemove.push(smoke);
                }
            }
            
            for (const s of smokeToRemove) {
                const idx = zone.smokeParticles.indexOf(s);
                if (idx > -1) zone.smokeParticles.splice(idx, 1);
                if (zone.smokeContainer) zone.smokeContainer.removeChild(s);
                try { s.destroy({ children: true }); } catch(err) {}
            }
            
            // 새 연기 생성 (확률적)
            if (Math.random() < 0.015 && zone.smokeContainer) {
                this.spawn3DSmoke(zone);
            }
        }
        
        // ========================================
        // 7. 레거시 호환 (flames 배열)
        // ========================================
        if (zone.flames && zone.flames.length > 0 && !zone.flamePillars) {
            for (const flame of zone.flames) {
                if (flame.phase !== undefined) {
                    flame.phase += delta * (flame.speed || 3);
                    flame.x = (flame.baseX || 0) + Math.sin(flame.phase) * 5;
                    flame.y = (flame.baseY || 0) + Math.cos(flame.phase * 0.7) * 3;
                    flame.scale.x = 0.8 + Math.sin(flame.phase * 1.5) * 0.3;
                    flame.scale.y = 0.9 + Math.sin(flame.phase * 2) * 0.2;
                    flame.alpha = 0.6 + Math.sin(flame.phase * 3) * 0.3;
                    flame.rotation = Math.sin(flame.phase * 0.8) * 0.2;
                }
            }
        }
    },
    
    // ==========================================
    // 연기 생성 (3D 래퍼)
    // ==========================================
    spawnSmokePuff(zone) {
        this.spawn3DSmoke(zone);
    },
    
    updateParticles(zone) {
        const toRemove = [];
        
        for (const particle of zone.particles) {
            // Movement
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Type-specific behavior
            if (zone.type === 'poison') {
                particle.vy = Math.sin(zone.animationTime * 5 + particle.x) * 0.5; // Bubble
            } else if (zone.type === 'lightning') {
                particle.x += (Math.random() - 0.5) * 5; // Jitter
                particle.y += (Math.random() - 0.5) * 3;
            }
            
            // Fade
            particle.life -= particle.decay;
            particle.alpha = particle.life;
            particle.scale.set(particle.life);
            
            if (particle.life <= 0) {
                toRemove.push(particle);
            }
        }
        
        // Remove dead particles and spawn new ones
        for (const p of toRemove) {
            const idx = zone.particles.indexOf(p);
            if (idx > -1) zone.particles.splice(idx, 1);
            zone.particleContainer.removeChild(p);
            p.destroy();
            
            // Spawn replacement
            this.spawnParticle(zone);
        }
    },
    
    // ==========================================
    // 턴 시작 시 효과 적용
    // ==========================================
    processTurnStart(team = 'all') {
        console.log(`[GridAOE] Processing turn start for team: ${team}`);
        
        for (const zone of this.zones) {
            if (!zone.options.applyOnTurnStart) continue;
            
            // Get units at this position
            const units = this.getUnitsAt(zone.gridX, zone.gridZ);
            
            for (const unit of units) {
                // Check if this zone affects this unit
                if (team !== 'all' && unit.team !== team) continue;
                if (zone.options.affectsAllies === false && unit.team === 'player') continue;
                if (zone.options.affectsEnemies === false && unit.team === 'enemy') continue;
                
                this.applyZoneEffect(zone, unit);
            }
        }
    },
    
    // ==========================================
    // 턴 종료 시 지속시간 감소
    // ==========================================
    processTurnEnd() {
        console.log('[GridAOE] Processing turn end');
        
        const expiredZones = [];
        
        for (const zone of this.zones) {
            zone.turnsRemaining--;
            
            if (zone.turnsRemaining <= 0) {
                expiredZones.push(zone);
            } else {
                // Show remaining turns indicator
                this.showTurnIndicator(zone);
            }
        }
        
        // Remove expired zones
        for (const zone of expiredZones) {
            this.removeZone(zone);
        }
    },
    
    // ==========================================
    // 영역 효과 적용
    // ==========================================
    applyZoneEffect(zone, unit) {
        if (!unit || unit.hp <= 0) return;
        
        const options = zone.options;
        
        // Show effect
        this.showHitEffect(zone, unit);
        
        // ★ 새 구조: container 우선 사용
        const posTarget = unit.container || unit.sprite;
        const posX = posTarget?.x || 0;
        const posY = posTarget?.y || 0;
        
        // Damage
        if (options.damage > 0) {
            this.game.dealDamage(unit, options.damage);
            
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.showDamageNumber(
                    posX, 
                    posY - 50, 
                    options.damage, 
                    zone.type === 'fire' ? 'burn' : 'dot'
                );
            }
        }
        
        // Heal
        if (options.heal > 0 && unit.team === 'player') {
            unit.hp = Math.min(unit.maxHp, unit.hp + options.heal);
            this.game.updateUnitHPBar(unit);
            
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.showDamageNumber(
                    posX, 
                    posY - 50, 
                    options.heal, 
                    'heal'
                );
            }
        }
        
        // Status effects (for future expansion)
        if (options.slowAmount) {
            // Apply slow debuff
            console.log(`[GridAOE] Applied slow to ${unit.name || 'unit'}`);
        }
    },
    
    applyZoneEffectToUnitsAt(zone, gridX, gridZ) {
        const units = this.getUnitsAt(gridX, gridZ);
        for (const unit of units) {
            if (zone.options.affectsAllies === false && unit.team === 'player') continue;
            if (zone.options.affectsEnemies === false && unit.team === 'enemy') continue;
            this.applyZoneEffect(zone, unit);
        }
    },
    
    // ==========================================
    // 유닛 이동 시 체크
    // ==========================================
    onUnitEnterCell(unit, gridX, gridZ) {
        for (const zone of this.zones) {
            if (zone.gridX === gridX && zone.gridZ === gridZ) {
                if (!zone.options.applyOnEnter) continue;
                if (zone.options.affectsAllies === false && unit.team === 'player') continue;
                if (zone.options.affectsEnemies === false && unit.team === 'enemy') continue;
                
                this.applyZoneEffect(zone, unit);
            }
        }
    },
    
    // ==========================================
    // 해당 위치의 유닛 가져오기
    // ==========================================
    getUnitsAt(gridX, gridZ) {
        const units = [];
        
        // Check hero
        const hero = this.game.state.hero;
        if (hero && hero.hp > 0 && hero.gridX === gridX && hero.gridZ === gridZ) {
            units.push(hero);
        }
        
        // Check player summons
        for (const unit of this.game.state.playerUnits) {
            if (unit.hp > 0 && unit.gridX === gridX && unit.gridZ === gridZ) {
                units.push(unit);
            }
        }
        
        // Check enemies
        for (const unit of this.game.state.enemyUnits) {
            if (unit.hp > 0 && unit.gridX === gridX && unit.gridZ === gridZ) {
                units.push(unit);
            }
        }
        
        return units;
    },
    
    // ==========================================
    // 영역 제거
    // ==========================================
    removeZone(zone) {
        console.log(`[GridAOE] Removing zone at (${zone.gridX}, ${zone.gridZ})`);
        
        if (zone.graphics) {
            // Fade out animation
            gsap.to(zone.graphics, {
                alpha: 0,
                duration: 0.3,
                onComplete: () => {
                    this.container.removeChild(zone.graphics);
                    zone.graphics.destroy({ children: true });
                }
            });
            gsap.to(zone.graphics.scale, { x: 0.5, y: 0.5, duration: 0.3 });
        }
        
        // Remove from array
        const idx = this.zones.indexOf(zone);
        if (idx > -1) this.zones.splice(idx, 1);
    },
    
    // ==========================================
    // 모든 영역 제거
    // ==========================================
    clearAllZones() {
        for (const zone of [...this.zones]) {
            this.removeZone(zone);
        }
    },
    
    // ==========================================
    // 시각 효과들
    // ==========================================
    showHitEffect(zone, unit) {
        // ★ 새 구조: container 우선 사용
        const posTarget = unit.container || unit.sprite;
        if (!posTarget) return;
        
        const posX = posTarget.x;
        const posY = posTarget.y;
        
        // Flash unit with zone color
        const flashColor = zone.options.color;
        
        // Create flash overlay
        const flash = new PIXI.Graphics();
        flash.beginFill(flashColor, 0.5);
        flash.drawCircle(0, 0, 30);
        flash.endFill();
        flash.x = posX;
        flash.y = posY - 30;
        this.app.stage.addChild(flash);
        
        gsap.to(flash, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => {
                this.app.stage.removeChild(flash);
                flash.destroy();
            }
        });
        gsap.to(flash.scale, { x: 2, y: 2, duration: 0.3 });
        
        // Type-specific effects
        if (zone.type === 'fire') {
            // Fire burst
            this.createFireBurst(posX, posY - 20);
        } else if (zone.type === 'poison') {
            // Poison bubbles
            this.createPoisonBubbles(posX, posY - 20);
        }
    },
    
    showRefreshEffect(zone) {
        if (!zone.graphics) return;
        
        gsap.timeline()
            .to(zone.graphics.scale, { x: 1.3, y: 1.3, duration: 0.15 })
            .to(zone.graphics.scale, { x: 1, y: 1, duration: 0.2, ease: 'elastic.out(1, 0.5)' });
    },
    
    showTurnIndicator(zone) {
        if (!zone.graphics) return;
        
        // Quick flash to indicate turn counted down
        gsap.timeline()
            .to(zone.baseGlow, { alpha: 1, duration: 0.1 })
            .to(zone.baseGlow, { alpha: 0.6, duration: 0.2 });
    },
    
    createFireBurst(x, y) {
        for (let i = 0; i < 6; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xff6600, 0.9);
            particle.drawCircle(0, 0, 4 + Math.random() * 3);
            particle.endFill();
            particle.x = x;
            particle.y = y;
            this.app.stage.addChild(particle);
            
            const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
            const distance = 20 + Math.random() * 20;
            
            gsap.to(particle, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 20,
                alpha: 0,
                duration: 0.4,
                ease: 'power2.out',
                onComplete: () => {
                    this.app.stage.removeChild(particle);
                    particle.destroy();
                }
            });
        }
    },
    
    createPoisonBubbles(x, y) {
        for (let i = 0; i < 4; i++) {
            const bubble = new PIXI.Graphics();
            bubble.beginFill(0x88ff44, 0.7);
            bubble.drawCircle(0, 0, 3 + Math.random() * 3);
            bubble.endFill();
            bubble.x = x + (Math.random() - 0.5) * 20;
            bubble.y = y;
            this.app.stage.addChild(bubble);
            
            gsap.to(bubble, {
                y: y - 30 - Math.random() * 20,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power1.out',
                onComplete: () => {
                    this.app.stage.removeChild(bubble);
                    bubble.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    hasZoneAt(gridX, gridZ, type = null) {
        return this.zones.some(z => {
            if (z.gridX !== gridX || z.gridZ !== gridZ) return false;
            if (type && z.type !== type) return false;
            return true;
        });
    },
    
    getZonesAt(gridX, gridZ) {
        return this.zones.filter(z => z.gridX === gridX && z.gridZ === gridZ);
    }
};

console.log('[GridAOE] 그리드 영역 효과 시스템 로드 완료');
