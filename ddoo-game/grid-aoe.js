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
        
        // Create container for zone effects
        this.container = new PIXI.Container();
        this.container.sortableChildren = true;
        this.container.zIndex = 5; // Below units, above grid
        this.app.stage.addChild(this.container);
        
        // Start animation ticker
        this.app.ticker.add(() => this.updateAnimations());
        
        console.log('[GridAOE] 그리드 영역 효과 시스템 초기화 완료');
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
        
        // Base glow
        const baseGlow = new PIXI.Graphics();
        this.drawZoneBase(baseGlow, zone.options.color, zone.type);
        zoneContainer.addChild(baseGlow);
        
        // Particle container
        const particleContainer = new PIXI.Container();
        zoneContainer.addChild(particleContainer);
        
        zone.graphics = zoneContainer;
        zone.baseGlow = baseGlow;
        zone.particleContainer = particleContainer;
        
        // Create initial particles
        this.createZoneParticles(zone);
        
        // Spawn animation
        zoneContainer.scale.set(0);
        zoneContainer.alpha = 0;
        gsap.to(zoneContainer.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(1.5)' });
        gsap.to(zoneContainer, { alpha: 1, duration: 0.2 });
        
        this.container.addChild(zoneContainer);
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
            
            // Animate base glow
            if (zone.baseGlow) {
                const pulse = 0.8 + Math.sin(zone.animationTime * 3) * 0.2;
                zone.baseGlow.alpha = pulse;
                
                if (zone.type === 'fire') {
                    // Flicker
                    zone.baseGlow.scale.x = 1 + Math.sin(zone.animationTime * 10) * 0.1;
                    zone.baseGlow.scale.y = 1 + Math.cos(zone.animationTime * 8) * 0.1;
                }
            }
            
            // Update particles
            this.updateParticles(zone);
        }
    },
    
    updateParticles(zone) {
        const toRemove = [];
        
        for (const particle of zone.particles) {
            // Movement
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Type-specific behavior
            if (zone.type === 'fire') {
                particle.vy -= 0.05; // Rise faster
                particle.vx += (Math.random() - 0.5) * 0.3; // Flicker sideways
            } else if (zone.type === 'poison') {
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
        
        // Damage
        if (options.damage > 0) {
            this.game.dealDamage(unit, options.damage);
            
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.showDamageNumber(
                    unit.sprite.x, 
                    unit.sprite.y - 50, 
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
                    unit.sprite.x, 
                    unit.sprite.y - 50, 
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
        if (!unit.sprite) return;
        
        // Flash unit with zone color
        const flashColor = zone.options.color;
        
        // Create flash overlay
        const flash = new PIXI.Graphics();
        flash.beginFill(flashColor, 0.5);
        flash.drawCircle(0, 0, 30);
        flash.endFill();
        flash.x = unit.sprite.x;
        flash.y = unit.sprite.y - 30;
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
            this.createFireBurst(unit.sprite.x, unit.sprite.y - 20);
        } else if (zone.type === 'poison') {
            // Poison bubbles
            this.createPoisonBubbles(unit.sprite.x, unit.sprite.y - 20);
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
