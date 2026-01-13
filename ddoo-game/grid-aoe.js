// =====================================================
// Grid AOE System - 그리드 영역 효과 시스템
// =====================================================

const GridAOE = {
    game: null,
    app: null,
    container: null,
    
    // Active zone effects on the grid
    zones: [],
    
    // ★ 파티클 최대 개수 제한 (성능 최적화)
    MAX_PARTICLES: {
        ripples: 8,
        bubbles: 6,
        droplets: 10,
        splashes: 5,
        shimmers: 8,
        waveParticles: 12,
        embers: 15,
        smokeParticles: 8,
        flames: 10,
        particles: 20
    },
    
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
        },
        water: {
            name: '물 지대',
            color: 0x4488ff,
            particleColor: 0x88ccff,
            damage: 0,
            duration: 3,
            applyOnEnter: false,
            applyOnTurnStart: false,
            animation: 'water',
            sound: 'water',
            // 물 영역 특수 효과
            shieldReduction: 2,       // 쉴드 생성량 감소
            lightningBonus: 5,        // 번개 콤보 추가 데미지
            cancelsElement: 'fire'    // 상쇄하는 원소
        }
    },
    
    // ==========================================
    // 원소 상쇄 규칙
    // ==========================================
    elementCounters: {
        water: 'fire',    // 물은 불을 상쇄
        fire: 'water',    // 불은 물을 상쇄
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
        
        // ★ 원소 상쇄 체크
        const counterElement = this.elementCounters[type];
        if (counterElement) {
            const oppositeZone = this.zones.find(z => z.gridX === gridX && z.gridZ === gridZ && z.type === counterElement);
            if (oppositeZone) {
                console.log(`[GridAOE] 원소 상쇄! ${type} vs ${counterElement} at (${gridX}, ${gridZ})`);
                this.showElementCancelEffect(gridX, gridZ, type, counterElement);
                this.removeZone(oppositeZone);
                return null; // 새 영역도 생성 안 함
            }
        }
        
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
        } else if (zone.type === 'water') {
            this.createWaterZoneVisual(zone, zoneContainer);
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
        zoneContainer.scale.x = 0;
        zoneContainer.scale.y = 0;
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
    // 물 지대 전용 시각화 - 물결 + 물방울 시스템
    // ==========================================
    createWaterZoneVisual(zone, container) {
        const cellSize = this.getApproxCellSize();
        const size = Math.max(cellSize * 1.2, 120);
        zone.zoneSize = size;
        
        // ========================================
        // Layer 1: 바닥 물웅덩이 (다층 그라데이션)
        // ========================================
        const puddleLayers = [];
        for (let i = 4; i >= 0; i--) {
            const puddle = new PIXI.Graphics();
            const layerSize = 0.4 + i * 0.1;
            const colors = [0x0a1f4a, 0x1a3366, 0x2855aa, 0x4488cc, 0x66aaee];
            const alphas = [0.6, 0.5, 0.45, 0.4, 0.35];
            
            puddle.beginFill(colors[i], alphas[i]);
            puddle.drawEllipse(0, 5 + i * 1.5, size * layerSize, size * layerSize * 0.5);
            puddle.endFill();
            
            puddle._baseY = 5 + i * 1.5;
            puddle._pulsePhase = i * 0.4;
            container.addChild(puddle);
            puddleLayers.push(puddle);
        }
        zone.puddleLayers = puddleLayers;
        
        // 반짝이는 하이라이트
        const highlight = new PIXI.Graphics();
        highlight.beginFill(0xaaddff, 0.4);
        highlight.drawEllipse(-size * 0.2, 0, size * 0.2, size * 0.08);
        highlight.endFill();
        highlight.beginFill(0xffffff, 0.3);
        highlight.drawEllipse(-size * 0.15, -2, size * 0.1, size * 0.04);
        highlight.endFill();
        container.addChild(highlight);
        zone.highlight = highlight;
        
        // ========================================
        // Layer 2: 3D 물결 링 (동심원 확산)
        // ========================================
        const rippleContainer = new PIXI.Container();
        container.addChild(rippleContainer);
        zone.rippleContainer = rippleContainer;
        zone.ripples = [];
        
        for (let i = 0; i < 4; i++) {
            this.spawn3DWaterRipple(zone, i * 0.25);
        }
        
        // ========================================
        // Layer 3: 수면 위 물결 파티클 (3D 궤도)
        // ========================================
        const waveContainer = new PIXI.Container();
        container.addChild(waveContainer);
        zone.waveContainer = waveContainer;
        zone.waveParticles = [];
        
        const NUM_WAVES = 6;
        for (let i = 0; i < NUM_WAVES; i++) {
            const wave = this.create3DWaveParticle(size);
            const angle = (i / NUM_WAVES) * Math.PI * 2;
            
            wave._angle = angle;
            wave._orbit = size * 0.25;
            wave._orbitY = size * 0.12;
            wave._speed = 0.6 + Math.random() * 0.3;
            wave._zPhase = Math.random() * Math.PI * 2;
            wave._baseScale = 0.6 + Math.random() * 0.4;
            
            waveContainer.addChild(wave);
            zone.waveParticles.push(wave);
        }
        
        // ========================================
        // Layer 4: 물기둥 / 물방울 분출
        // ========================================
        const splashContainer = new PIXI.Container();
        container.addChild(splashContainer);
        zone.splashContainer = splashContainer;
        zone.splashes = [];
        
        for (let i = 0; i < 12; i++) {
            this.spawn3DWaterSplash(zone);
        }
        
        // ========================================
        // Layer 5: 거품 / 기포
        // ========================================
        const bubbleContainer = new PIXI.Container();
        container.addChild(bubbleContainer);
        zone.bubbleContainer = bubbleContainer;
        zone.bubbles = [];
        
        for (let i = 0; i < 8; i++) {
            this.spawnWaterBubble(zone);
        }
        
        // ========================================
        // Layer 6: 반짝이는 수면 반사
        // ========================================
        const shimmerContainer = new PIXI.Container();
        container.addChild(shimmerContainer);
        zone.shimmerContainer = shimmerContainer;
        zone.shimmers = [];
        
        for (let i = 0; i < 10; i++) {
            const shimmer = new PIXI.Graphics();
            const shimmerSize = 2 + Math.random() * 5;
            
            // 글로우
            shimmer.beginFill(0xaaddff, 0.2);
            shimmer.drawCircle(0, 0, shimmerSize * 2);
            shimmer.endFill();
            // 코어
            shimmer.beginFill(0xffffff, 0.7);
            shimmer.drawCircle(0, 0, shimmerSize);
            shimmer.endFill();
            
            shimmer.x = (Math.random() - 0.5) * size * 0.6;
            shimmer.y = (Math.random() - 0.5) * size * 0.3;
            shimmer._phase = Math.random() * Math.PI * 2;
            shimmer._baseAlpha = 0.3 + Math.random() * 0.5;
            shimmer._twinkleSpeed = 3 + Math.random() * 3;
            
            shimmerContainer.addChild(shimmer);
            zone.shimmers.push(shimmer);
        }
        
        // ========================================
        // Layer 7: 중앙 물결 코어
        // ========================================
        const coreContainer = new PIXI.Container();
        container.addChild(coreContainer);
        zone.coreContainer = coreContainer;
        
        for (let i = 2; i >= 0; i--) {
            const core = new PIXI.Graphics();
            const coreSize = size * (0.06 + i * 0.04);
            const colors = [0xffffff, 0xaaddff, 0x66aaee];
            const alphas = [0.8, 0.5, 0.3];
            
            core.beginFill(colors[i], alphas[i]);
            core.drawEllipse(0, 0, coreSize, coreSize * 0.5);
            core.endFill();
            
            core._pulsePhase = i * 0.3;
            coreContainer.addChild(core);
        }
        zone.cores = coreContainer.children;
        
        zone._animTime = 0;
        
        // 스폰 이펙트
        this.waterSpawnBurst(container.x, container.y, size);
    },
    
    // ==========================================
    // 3D 물결 링 생성
    // ==========================================
    spawn3DWaterRipple(zone, delay = 0) {
        if (!zone.rippleContainer) return;
        if (zone.ripples && zone.ripples.length >= this.MAX_PARTICLES.ripples) return;
        
        const zoneSize = zone.zoneSize || 100;
        const ripple = new PIXI.Container();
        
        // 다중 링 (3D 효과)
        for (let i = 2; i >= 0; i--) {
            const ring = new PIXI.Graphics();
            const alpha = 0.6 - i * 0.15;
            const thickness = 3 - i * 0.5;
            
            ring.lineStyle(thickness, i === 0 ? 0xffffff : 0x88ccff, alpha);
            ring.drawEllipse(0, i * 2, 15, 9);
            ripple.addChild(ring);
        }
        
        ripple._scale = 0.1;
        ripple._alpha = 0.8;
        ripple._maxScale = (0.5 + Math.random() * 0.4) * (zoneSize / 100);
        ripple._delay = delay;
        ripple.scale.x = ripple._scale;
        ripple.scale.y = ripple._scale;
        ripple.alpha = 0;
        
        // 무작위 위치 오프셋
        ripple.x = (Math.random() - 0.5) * zoneSize * 0.3;
        ripple.y = (Math.random() - 0.5) * zoneSize * 0.15;
        
        zone.rippleContainer.addChild(ripple);
        zone.ripples.push(ripple);
    },
    
    // ==========================================
    // 3D 물결 파티클 생성
    // ==========================================
    create3DWaveParticle(zoneSize) {
        const particle = new PIXI.Container();
        const scale = zoneSize / 100;
        
        // 외부 글로우
        const outerGlow = new PIXI.Graphics();
        const outerSize = (8 + Math.random() * 6) * scale;
        outerGlow.beginFill(0x4488cc, 0.3);
        outerGlow.drawEllipse(0, 0, outerSize * 1.5, outerSize * 0.8);
        outerGlow.endFill();
        particle.addChild(outerGlow);
        
        // 중간 물결
        const midWave = new PIXI.Graphics();
        midWave.beginFill(0x66aaee, 0.5);
        midWave.drawEllipse(0, 0, outerSize, outerSize * 0.5);
        midWave.endFill();
        particle.addChild(midWave);
        
        // 밝은 코어
        const core = new PIXI.Graphics();
        core.beginFill(0xaaddff, 0.7);
        core.drawEllipse(0, 0, outerSize * 0.5, outerSize * 0.25);
        core.endFill();
        particle.addChild(core);
        
        // 하이라이트
        const highlight = new PIXI.Graphics();
        highlight.beginFill(0xffffff, 0.6);
        highlight.drawEllipse(-outerSize * 0.2, -outerSize * 0.1, outerSize * 0.15, outerSize * 0.08);
        highlight.endFill();
        particle.addChild(highlight);
        
        return particle;
    },
    
    // ==========================================
    // 3D 물 스플래시 생성
    // ==========================================
    spawn3DWaterSplash(zone) {
        if (!zone.splashContainer) return;
        if (zone.splashes && zone.splashes.length >= this.MAX_PARTICLES.splashes) return;
        
        const zoneSize = zone.zoneSize || 100;
        const splash = new PIXI.Container();
        
        // 물방울 모양
        const drop = new PIXI.Graphics();
        const size = 2 + Math.random() * 4;
        
        // 글로우
        drop.beginFill(0x66aaee, 0.3);
        drop.drawCircle(0, 0, size * 2);
        drop.endFill();
        
        // 코어
        drop.beginFill(0x88ccff, 0.8);
        drop.drawCircle(0, 0, size);
        drop.endFill();
        
        // 하이라이트
        drop.beginFill(0xffffff, 0.7);
        drop.drawCircle(-size * 0.3, -size * 0.3, size * 0.3);
        drop.endFill();
        
        splash.addChild(drop);
        
        // 위치 (수면에서 시작)
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * zoneSize * 0.35;
        splash.x = Math.cos(angle) * dist;
        splash.y = Math.sin(angle) * dist * 0.5;
        
        // 속성 (포물선 운동)
        splash._vx = (Math.random() - 0.5) * 2;
        splash._vy = -4 - Math.random() * 6;
        splash._gravity = 0.25;
        splash._groundY = Math.sin(angle) * dist * 0.5 + 5;
        splash._life = 1;
        splash._decay = 0.015 + Math.random() * 0.01;
        
        zone.splashContainer.addChild(splash);
        zone.splashes.push(splash);
    },
    
    // ==========================================
    // 물 거품 생성
    // ==========================================
    spawnWaterBubble(zone) {
        if (!zone.bubbleContainer) return;
        if (zone.bubbles && zone.bubbles.length >= this.MAX_PARTICLES.bubbles) return;
        
        const zoneSize = zone.zoneSize || 100;
        const bubble = new PIXI.Graphics();
        const size = 3 + Math.random() * 5;
        
        // 거품 테두리
        bubble.lineStyle(1, 0xffffff, 0.6);
        bubble.drawCircle(0, 0, size);
        
        // 내부 반사광
        bubble.beginFill(0xffffff, 0.2);
        bubble.drawCircle(-size * 0.2, -size * 0.2, size * 0.3);
        bubble.endFill();
        
        // 위치
        bubble.x = (Math.random() - 0.5) * zoneSize * 0.5;
        bubble.y = (Math.random() - 0.5) * zoneSize * 0.25 + 5;
        
        // 속성
        bubble._vy = -0.5 - Math.random() * 1;
        bubble._wobble = Math.random() * Math.PI * 2;
        bubble._wobbleSpeed = 3 + Math.random() * 2;
        bubble._wobbleAmount = 1 + Math.random() * 2;
        bubble._life = 1;
        bubble._decay = 0.008 + Math.random() * 0.008;
        
        zone.bubbleContainer.addChild(bubble);
        zone.bubbles.push(bubble);
    },
    
    // ==========================================
    // 물 영역 스폰 버스트 이펙트
    // ==========================================
    waterSpawnBurst(x, y, size) {
        // 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#4488ff', 150, 0.3);
            CombatEffects.screenShake(6, 150);
        }
        
        // 물기둥 솟구침
        const pillar = new PIXI.Graphics();
        pillar.beginFill(0x4488ff, 0.6);
        pillar.drawRect(-size * 0.15, -80, size * 0.3, 80);
        pillar.endFill();
        pillar.beginFill(0x88ccff, 0.4);
        pillar.drawRect(-size * 0.1, -80, size * 0.2, 80);
        pillar.endFill();
        pillar.beginFill(0xaaddff, 0.3);
        pillar.drawRect(-size * 0.05, -80, size * 0.1, 80);
        pillar.endFill();
        pillar.x = x;
        pillar.y = y;
        this.app.stage.addChild(pillar);
        
        gsap.to(pillar, {
            alpha: 0,
            duration: 0.4,
            onComplete: () => {
                this.app.stage.removeChild(pillar);
                pillar.destroy();
            }
        });
        gsap.to(pillar.scale, { x: 2, y: 0.5, duration: 0.4, ease: 'power2.out' });
        
        // 물방울 버스트
        for (let i = 0; i < 15; i++) {
            const drop = new PIXI.Graphics();
            const dropSize = 3 + Math.random() * 5;
            
            drop.beginFill(0x88ccff, 0.8);
            drop.drawCircle(0, 0, dropSize);
            drop.endFill();
            drop.beginFill(0xffffff, 0.5);
            drop.drawCircle(-dropSize * 0.2, -dropSize * 0.2, dropSize * 0.3);
            drop.endFill();
            
            drop.x = x;
            drop.y = y;
            this.app.stage.addChild(drop);
            
            const angle = (Math.PI * 2 * i) / 15 + Math.random() * 0.3;
            const distance = size * 0.3 + Math.random() * size * 0.4;
            
            gsap.to(drop, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance * 0.5 - 50 - Math.random() * 30,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    this.app.stage.removeChild(drop);
                    drop.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 물결 링 생성
    // ==========================================
    spawnWaterRipple(zone, delay = 0) {
        if (!zone.rippleContainer) return;
        if (zone.ripples && zone.ripples.length >= this.MAX_PARTICLES.ripples) return;
        
        const zoneSize = zone.zoneSize || 100;
        const ripple = new PIXI.Graphics();
        
        // 타원형 링
        ripple.lineStyle(2, 0x88ccff, 0.6);
        ripple.drawEllipse(0, 0, 10, 6);
        
        ripple._scale = 0.1;
        ripple._alpha = 0.8;
        ripple._maxScale = (0.6 + Math.random() * 0.3) * (zoneSize / 100);
        ripple._delay = delay;
        ripple.scale.x = ripple._scale;
        ripple.scale.y = ripple._scale;
        ripple.alpha = 0;
        
        zone.rippleContainer.addChild(ripple);
        zone.ripples.push(ripple);
    },
    
    // ==========================================
    // 물방울 파티클 생성
    // ==========================================
    spawnWaterDroplet(zone) {
        if (!zone.dropletContainer) return;
        if (zone.droplets && zone.droplets.length >= this.MAX_PARTICLES.droplets) return;
        
        const zoneSize = zone.zoneSize || 100;
        const droplet = new PIXI.Container();
        
        // 글로우
        const glow = new PIXI.Graphics();
        const size = 2 + Math.random() * 4;
        glow.beginFill(0x4488ff, 0.3);
        glow.drawCircle(0, 0, size * 2);
        glow.endFill();
        droplet.addChild(glow);
        
        // 코어
        const core = new PIXI.Graphics();
        core.beginFill(0x88ccff, 0.7);
        core.drawCircle(0, 0, size);
        core.endFill();
        droplet.addChild(core);
        
        // 하이라이트
        const highlight = new PIXI.Graphics();
        highlight.beginFill(0xffffff, 0.8);
        highlight.drawCircle(-size * 0.3, -size * 0.3, size * 0.3);
        highlight.endFill();
        droplet.addChild(highlight);
        
        // 위치 (수면 위에서 시작)
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * zoneSize * 0.4;
        droplet.x = Math.cos(angle) * dist;
        droplet.y = Math.sin(angle) * dist * 0.5 - 10 - Math.random() * 30;
        
        // 속성 (포물선 운동)
        droplet._vx = (Math.random() - 0.5) * 1;
        droplet._vy = 1 + Math.random() * 2;
        droplet._gravity = 0.15;
        droplet._groundY = Math.sin(angle) * dist * 0.5 + 5;
        droplet._bounced = false;
        droplet._life = 1;
        droplet._baseSize = size;
        
        zone.dropletContainer.addChild(droplet);
        zone.droplets.push(droplet);
    },
    
    // ==========================================
    // 물 지대 애니메이션 업데이트
    // ==========================================
    updateWaterZone(zone, delta) {
        const t = zone.animationTime;
        zone._animTime = (zone._animTime || 0) + delta;
        
        // ========================================
        // 1. 물웅덩이 레이어 펄스 (3D 깊이감)
        // ========================================
        if (zone.puddleLayers) {
            zone.puddleLayers.forEach((layer, i) => {
                const phase = t * (1.5 + i * 0.3) + layer._pulsePhase;
                const pulse = 1 + Math.sin(phase) * 0.04;
                layer.scale.x = pulse;
                layer.scale.y = pulse * 0.7;
                layer.alpha = (0.35 + i * 0.05) + Math.sin(phase * 1.2) * 0.08;
                layer.y = layer._baseY + Math.sin(phase * 0.6) * 1.5;
            });
        }
        
        // 하이라이트 깜빡임
        if (zone.highlight) {
            zone.highlight.alpha = 0.3 + Math.sin(t * 3) * 0.15;
            zone.highlight.x = Math.sin(t * 0.8) * 5;
        }
        
        // ========================================
        // 2. 3D 물결 링 확산
        // ========================================
        if (zone.ripples) {
            const toRemove = [];
            
            for (const ripple of zone.ripples) {
                if (ripple._delay > 0) {
                    ripple._delay -= delta;
                    continue;
                }
                
                ripple._scale += delta * 0.5;
                ripple._alpha -= delta * 0.4;
                
                ripple.scale.x = ripple._scale;
                ripple.scale.y = ripple._scale * 0.6;
                ripple.alpha = Math.max(0, ripple._alpha);
                
                if (ripple._scale > ripple._maxScale || ripple._alpha <= 0) {
                    toRemove.push(ripple);
                }
            }
            
            for (const r of toRemove) {
                const idx = zone.ripples.indexOf(r);
                if (idx > -1) zone.ripples.splice(idx, 1);
                zone.rippleContainer.removeChild(r);
                try { r.destroy({ children: true }); } catch(e) {}
                
                // 새 물결 생성
                this.spawn3DWaterRipple(zone);
            }
        }
        
        // ========================================
        // 3. 3D 궤도 물결 파티클 회전
        // ========================================
        if (zone.waveParticles) {
            zone.waveParticles.forEach(wave => {
                wave._angle += delta * wave._speed;
                
                // 3D 원형 궤도 시뮬레이션
                const zOffset = Math.sin(wave._angle + wave._zPhase);
                const depthScale = 0.6 + zOffset * 0.4;
                
                // XY 위치 (타원 궤도)
                wave.x = Math.cos(wave._angle) * wave._orbit;
                wave.y = Math.sin(wave._angle) * wave._orbitY;
                
                // 깊이에 따른 스케일 & 알파
                const waveScale = wave._baseScale * depthScale;
                wave.scale.x = waveScale;
                wave.scale.y = waveScale * 0.6;
                wave.alpha = 0.5 + depthScale * 0.4;
                
                // 뒤에 있으면 더 어둡게
                if (zOffset < 0) {
                    wave.alpha *= 0.6;
                    wave.zIndex = -1;
                } else {
                    wave.zIndex = 1;
                }
            });
            
            if (zone.waveContainer) {
                zone.waveContainer.sortChildren();
            }
        }
        
        // ========================================
        // 4. 물 스플래시 포물선 운동
        // ========================================
        if (zone.splashes) {
            const toRemove = [];
            
            for (const splash of zone.splashes) {
                splash.x += splash._vx;
                splash._vy += splash._gravity;
                splash.y += splash._vy;
                
                // 수면에 닿으면 소멸
                if (splash.y >= splash._groundY) {
                    splash._life -= delta * 3;
                    splash.alpha = splash._life;
                    
                    // 작은 물결 생성 (한 번만)
                    if (!splash._splashed && zone.rippleContainer) {
                        splash._splashed = true;
                        const miniRipple = new PIXI.Graphics();
                        miniRipple.lineStyle(1, 0x88ccff, 0.5);
                        miniRipple.drawEllipse(0, 0, 5, 3);
                        miniRipple.x = splash.x;
                        miniRipple.y = splash._groundY;
                        miniRipple._scale = 0.3;
                        miniRipple._alpha = 0.6;
                        miniRipple._maxScale = 1.2;
                        zone.rippleContainer.addChild(miniRipple);
                        zone.ripples.push(miniRipple);
                    }
                }
                
                splash._life -= splash._decay;
                if (splash._life <= 0) {
                    toRemove.push(splash);
                }
            }
            
            for (const s of toRemove) {
                const idx = zone.splashes.indexOf(s);
                if (idx > -1) zone.splashes.splice(idx, 1);
                zone.splashContainer.removeChild(s);
                try { s.destroy({ children: true }); } catch(e) {}
                
                // 새 스플래시 생성
                this.spawn3DWaterSplash(zone);
            }
            
            // 추가 스플래시 (확률적)
            if (Math.random() < 0.04) {
                this.spawn3DWaterSplash(zone);
            }
        }
        
        // ========================================
        // 5. 거품 애니메이션
        // ========================================
        if (zone.bubbles) {
            const toRemove = [];
            
            for (const bubble of zone.bubbles) {
                bubble._wobble += delta * bubble._wobbleSpeed;
                bubble.x += Math.sin(bubble._wobble) * bubble._wobbleAmount * delta;
                bubble.y += bubble._vy;
                
                bubble._life -= bubble._decay;
                bubble.alpha = bubble._life * 0.7;
                const bubbleScale = 0.8 + bubble._life * 0.4;
                bubble.scale.x = bubbleScale;
                bubble.scale.y = bubbleScale;
                
                if (bubble._life <= 0 || bubble.y < -30) {
                    toRemove.push(bubble);
                }
            }
            
            for (const b of toRemove) {
                const idx = zone.bubbles.indexOf(b);
                if (idx > -1) zone.bubbles.splice(idx, 1);
                zone.bubbleContainer.removeChild(b);
                try { b.destroy(); } catch(e) {}
                
                // 새 거품 생성
                this.spawnWaterBubble(zone);
            }
            
            // 추가 거품 (확률적)
            if (Math.random() < 0.02) {
                this.spawnWaterBubble(zone);
            }
        }
        
        // ========================================
        // 6. 반사광 깜빡임
        // ========================================
        if (zone.shimmers) {
            for (const shimmer of zone.shimmers) {
                shimmer._phase += delta * shimmer._twinkleSpeed;
                shimmer.alpha = shimmer._baseAlpha * (0.3 + Math.sin(shimmer._phase) * 0.7);
                const shimmerScale = 0.6 + Math.sin(shimmer._phase * 1.3) * 0.5;
                shimmer.scale.x = shimmerScale;
                shimmer.scale.y = shimmerScale;
                shimmer.x += Math.sin(shimmer._phase * 0.5) * 0.3;
            }
        }
        
        // ========================================
        // 7. 코어 펄스
        // ========================================
        if (zone.cores) {
            zone.cores.forEach((core, i) => {
                const phase = t * (4 + i * 1.5) + (core._pulsePhase || 0);
                const corePulse = 1 + Math.sin(phase) * 0.25;
                core.scale.x = corePulse;
                core.scale.y = corePulse * 0.6;
                core.alpha = (0.5 - i * 0.1) + Math.sin(phase * 1.5) * 0.2;
            });
        }
    },
    
    // ==========================================
    // 원소 상쇄 이펙트
    // ==========================================
    showElementCancelEffect(gridX, gridZ, type1, type2) {
        const pos = this.game.getCellCenter(gridX, gridZ);
        if (!pos) return;
        
        // 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ffffff', 200, 0.5);
            CombatEffects.screenShake(8, 200);
        }
        
        // 원소 충돌 파티클
        const colors = {
            fire: [0xff4400, 0xff8800],
            water: [0x4488ff, 0x88ccff]
        };
        
        const color1 = colors[type1] || [0xffffff];
        const color2 = colors[type2] || [0xffffff];
        
        // 폭발 파티클
        for (let i = 0; i < 20; i++) {
            const particle = new PIXI.Graphics();
            const color = i % 2 === 0 ? color1[i % color1.length] : color2[i % color2.length];
            const size = 4 + Math.random() * 6;
            
            particle.beginFill(color, 0.9);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            
            particle.x = pos.x;
            particle.y = pos.y;
            this.app.stage.addChild(particle);
            
            const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.3;
            const distance = 60 + Math.random() * 40;
            
            gsap.to(particle, {
                x: pos.x + Math.cos(angle) * distance,
                y: pos.y + Math.sin(angle) * distance * 0.5 - 20,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    this.app.stage.removeChild(particle);
                    particle.destroy();
                }
            });
        }
        
        // "상쇄!" 텍스트
        const cancelText = new PIXI.Text('💥 상쇄!', {
            fontSize: 20,
            fontWeight: 'bold',
            fill: 0xffffff,
            stroke: 0x000000,
            strokeThickness: 3
        });
        cancelText.anchor.set(0.5);
        cancelText.x = pos.x;
        cancelText.y = pos.y - 30;
        this.app.stage.addChild(cancelText);
        
        gsap.to(cancelText, {
            y: pos.y - 80,
            alpha: 0,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                this.app.stage.removeChild(cancelText);
                cancelText.destroy();
            }
        });
        
        // 증기 효과 (불+물)
        if ((type1 === 'fire' && type2 === 'water') || (type1 === 'water' && type2 === 'fire')) {
            for (let i = 0; i < 8; i++) {
                const steam = new PIXI.Graphics();
                steam.beginFill(0xcccccc, 0.4);
                steam.drawCircle(0, 0, 10 + Math.random() * 10);
                steam.endFill();
                
                steam.x = pos.x + (Math.random() - 0.5) * 40;
                steam.y = pos.y;
                this.app.stage.addChild(steam);
                
                gsap.to(steam, {
                    y: pos.y - 60 - Math.random() * 40,
                    alpha: 0,
                    duration: 1 + Math.random() * 0.5,
                    ease: 'power1.out',
                    onComplete: () => {
                        this.app.stage.removeChild(steam);
                        steam.destroy();
                    }
                });
                
                gsap.to(steam.scale, {
                    x: 2,
                    y: 2,
                    duration: 1,
                    ease: 'power1.out'
                });
            }
        }
        
        console.log(`[GridAOE] 원소 상쇄 이펙트: ${type1} vs ${type2}`);
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
        if (zone.embers && zone.embers.length >= this.MAX_PARTICLES.embers) return;
        
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
        if (zone.smokeParticles && zone.smokeParticles.length >= this.MAX_PARTICLES.smokeParticles) return;
        
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
        if (zone.particles && zone.particles.length >= this.MAX_PARTICLES.particles) return;
        
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
            } else if (zone.type === 'water') {
                this.updateWaterZone(zone, delta);
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
                const heatPulse = 1 + Math.sin(phase) * 0.15;
                heat.scale.x = heatPulse;
                heat.scale.y = heatPulse * 0.7;
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
                const flameScale = flame._baseScale * depthScale;
                flame.scale.x = flameScale;
                flame.scale.y = flameScale;
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
                const firePulse = 1 + Math.sin(phase) * 0.2;
                core.scale.x = firePulse;
                core.scale.y = firePulse * 0.7;
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
                pillar.scale.x = scaleX;
                pillar.scale.y = scaleY;
                
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
                const emberScale = Math.max(0.3, zScale);
                ember.scale.x = emberScale;
                ember.scale.y = emberScale;
                
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
                smoke.scale.x = currentScale + 0.008;
                smoke.scale.y = currentScale + 0.008;
                
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
            particle.scale.x = particle.life;
            particle.scale.y = particle.life;
            
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
    },
    
    // ==========================================
    // 물 영역 효과 - 쉴드 생성량 감소 계산
    // ==========================================
    getShieldReduction(gridX, gridZ) {
        const waterZone = this.zones.find(z => 
            z.gridX === gridX && z.gridZ === gridZ && z.type === 'water'
        );
        if (waterZone && waterZone.options.shieldReduction) {
            return waterZone.options.shieldReduction;
        }
        return 0;
    },
    
    // ==========================================
    // 번개 콤보 체크 - 물 영역에서 번개 추가 데미지
    // ==========================================
    checkLightningCombo(gridX, gridZ) {
        const waterZone = this.zones.find(z => 
            z.gridX === gridX && z.gridZ === gridZ && z.type === 'water'
        );
        if (waterZone && waterZone.options.lightningBonus) {
            console.log(`[GridAOE] ⚡ 번개 콤보! 물 위에서 +${waterZone.options.lightningBonus} 데미지`);
            
            // 전기 스파크 이펙트 (물은 유지)
            this.showLightningSparkEffect(gridX, gridZ);
            
            return waterZone.options.lightningBonus;
        }
        return 0;
    },
    
    // ==========================================
    // 번개 스파크 이펙트 (물 유지, 간단한 버전)
    // ==========================================
    showLightningSparkEffect(gridX, gridZ) {
        const pos = this.game.getCellCenter(gridX, gridZ);
        if (!pos || !this.app) return;
        
        // 전기 스파크 파티클
        for (let i = 0; i < 15; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xffff44, 0.9);
            spark.drawCircle(0, 0, 2 + Math.random() * 3);
            spark.endFill();
            
            spark.x = pos.x;
            spark.y = pos.y;
            this.app.stage.addChild(spark);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 40;
            
            gsap.to(spark, {
                x: pos.x + Math.cos(angle) * dist,
                y: pos.y + Math.sin(angle) * dist * 0.5 - 20,
                alpha: 0,
                duration: 0.3 + Math.random() * 0.2,
                ease: 'power2.out',
                onComplete: () => {
                    this.app.stage.removeChild(spark);
                    spark.destroy();
                }
            });
        }
        
        // 화면 플래시
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ffff88', 150, 0.3);
        }
    },
    
    // ==========================================
    // 번개+물 콤보 이펙트
    // ==========================================
    showLightningWaterCombo(gridX, gridZ) {
        const pos = this.game.getCellCenter(gridX, gridZ);
        if (!pos) return;
        
        // 화면 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#88ffff', 300, 0.6);
            CombatEffects.screenShake(15, 300);
        }
        
        // 전기 스파크 + 물방울 폭발
        for (let i = 0; i < 25; i++) {
            const particle = new PIXI.Graphics();
            const isElectric = i % 3 === 0;
            
            if (isElectric) {
                // 전기 스파크
                particle.beginFill(0xffff88, 0.9);
                particle.drawCircle(0, 0, 3 + Math.random() * 4);
                particle.endFill();
            } else {
                // 전기 충격 받은 물방울
                particle.beginFill(0x88ffff, 0.8);
                particle.drawCircle(0, 0, 2 + Math.random() * 3);
                particle.endFill();
            }
            
            particle.x = pos.x;
            particle.y = pos.y;
            this.app.stage.addChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 60;
            
            gsap.to(particle, {
                x: pos.x + Math.cos(angle) * distance,
                y: pos.y + Math.sin(angle) * distance * 0.5 - 30,
                alpha: 0,
                duration: 0.4 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    this.app.stage.removeChild(particle);
                    particle.destroy();
                }
            });
        }
        
        // 전기 아크 선
        for (let i = 0; i < 5; i++) {
            const arc = new PIXI.Graphics();
            arc.lineStyle(2, 0xffff44, 0.8);
            
            const startAngle = Math.random() * Math.PI * 2;
            const endAngle = startAngle + Math.PI * (0.3 + Math.random() * 0.4);
            const radius = 30 + Math.random() * 30;
            
            arc.moveTo(
                Math.cos(startAngle) * radius,
                Math.sin(startAngle) * radius * 0.5
            );
            
            // 지그재그 라인
            const segments = 3 + Math.floor(Math.random() * 3);
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const midAngle = startAngle + (endAngle - startAngle) * t;
                const jitter = (Math.random() - 0.5) * 20;
                arc.lineTo(
                    Math.cos(midAngle) * radius + jitter,
                    Math.sin(midAngle) * radius * 0.5 + jitter * 0.5
                );
            }
            
            arc.x = pos.x;
            arc.y = pos.y;
            this.app.stage.addChild(arc);
            
            gsap.to(arc, {
                alpha: 0,
                duration: 0.2 + Math.random() * 0.1,
                onComplete: () => {
                    this.app.stage.removeChild(arc);
                    arc.destroy();
                }
            });
        }
        
        // "증발!" 텍스트
        const shockText = new PIXI.Text('💨 증발!', {
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xaaddff,
            stroke: 0x0044aa,
            strokeThickness: 4
        });
        shockText.anchor.set(0.5);
        shockText.x = pos.x;
        shockText.y = pos.y - 40;
        this.app.stage.addChild(shockText);
        
        gsap.to(shockText, {
            y: pos.y - 100,
            alpha: 0,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                this.app.stage.removeChild(shockText);
                shockText.destroy();
            }
        });
        
        // ========================================
        // 증기 효과 (Steam) - 물이 증발하는 표현
        // ========================================
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const steam = new PIXI.Graphics();
                
                // 증기 구름 (다층)
                for (let layer = 2; layer >= 0; layer--) {
                    const size = (12 + Math.random() * 15) + layer * 5;
                    const alpha = 0.4 - layer * 0.1;
                    steam.beginFill(0xffffff, alpha);
                    steam.drawCircle(layer * 3, layer * 2, size);
                    steam.endFill();
                }
                
                // 시작 위치 (바닥에서)
                const offsetX = (Math.random() - 0.5) * 80;
                steam.x = pos.x + offsetX;
                steam.y = pos.y + 10;
                steam.scale.x = 0.3;
                steam.scale.y = 0.3;
                steam.alpha = 0.7;
                this.app.stage.addChild(steam);
                
                // 위로 올라가면서 퍼지고 사라짐
                const targetY = pos.y - 80 - Math.random() * 60;
                const drift = (Math.random() - 0.5) * 40;
                
                gsap.to(steam, {
                    y: targetY,
                    x: pos.x + offsetX + drift,
                    alpha: 0,
                    duration: 0.8 + Math.random() * 0.5,
                    ease: 'power1.out',
                    onComplete: () => {
                        this.app.stage.removeChild(steam);
                        steam.destroy();
                    }
                });
                
                gsap.to(steam.scale, {
                    x: 1.5 + Math.random() * 0.5,
                    y: 1.2 + Math.random() * 0.3,
                    duration: 0.8 + Math.random() * 0.5,
                    ease: 'power1.out'
                });
            }, i * 40); // 순차적 생성
        }
        
        // 추가: 지글지글 소리 효과
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.play('sizzle', 0.5);
        }
    },
    
    // ==========================================
    // 유닛이 물 영역에 있는지 확인
    // ==========================================
    isInWaterZone(unit) {
        if (!unit || unit.gridX === undefined) return false;
        return this.hasZoneAt(unit.gridX, unit.gridZ, 'water');
    },
    
    // ==========================================
    // 워터웨이브 생성 (3칸 라인)
    // ==========================================
    createWaterWaveLine(startX, gridZ, direction = 1, length = 3) {
        const zones = [];
        for (let i = 0; i < length; i++) {
            const x = startX + (i * direction);
            // 그리드 범위 체크
            if (x >= 0 && x < 10) {
                const zone = this.createZone('water', x, gridZ);
                if (zone) zones.push(zone);
            }
        }
        return zones;
    }
};

console.log('[GridAOE] 그리드 영역 효과 시스템 로드 완료');
