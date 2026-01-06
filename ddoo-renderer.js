// =====================================================
// DDOORenderer - 고품격 스프라이트 렌더링 시스템
// 단순 PNG를 게임 품질 스프라이트로 가공
// =====================================================

const DDOORenderer = {
    // 설정
    config: {
        // 아웃라인 설정
        outline: {
            enabled: true,
            color: 0x000000,        // 검은 외곽선
            thickness: 2,           // 두께 (픽셀)
            alpha: 0.9,
            directions: 8           // 4 또는 8방향
        },
        
        // 그림자 설정
        shadow: {
            enabled: true,
            color: 0x000000,
            alpha: 0.4,
            scaleY: 0.25,           // 납작한 타원
            offsetY: 5,             // 발 아래 오프셋
            blur: false             // 블러 효과 (성능 영향)
        },
        
        // 환경광 설정
        environment: {
            enabled: true,
            brightness: 0.95,       // 밝기 (던전 분위기)
            saturation: 0.9,        // 채도
            warmth: 0.02            // 따뜻한 색조
        },
        
        // 숨쉬기 애니메이션
        breathing: {
            enabled: true,
            scaleAmount: 0.02,      // 스케일 변화량
            yAmount: 3,             // Y축 움직임
            speed: 2.5,             // 속도 (초)
            randomDelay: true       // 개체마다 다른 타이밍
        },
        
        // 히트 플래시
        hitFlash: {
            color: 0xffffff,
            duration: 100
        },
        
        // 픽셀 아트 설정
        pixelArt: {
            scaleMode: 'nearest',   // 'nearest' | 'linear'
            antialias: false
        }
    },
    
    // 캐시
    textureCache: new Map(),
    spriteCache: new Map(),
    
    // ==================== 메인 API ====================
    
    /**
     * PNG를 고품격 스프라이트로 변환
     * @param {string} imagePath - 이미지 경로
     * @param {Object} options - 옵션
     * @returns {Promise<PIXI.Container>} - 가공된 스프라이트 컨테이너
     */
    async createSprite(imagePath, options = {}) {
        const config = { ...this.config, ...options };
        
        // 텍스처 로드
        const texture = await this.loadTexture(imagePath);
        if (!texture) {
            console.error(`[DDOORenderer] 텍스처 로드 실패: ${imagePath}`);
            return null;
        }
        
        // 컨테이너 생성
        const container = new PIXI.Container();
        container.sortableChildren = true;
        container.label = options.label || imagePath;
        
        // 1. 바닥 그림자
        if (config.shadow?.enabled) {
            const shadow = this.createGroundShadow(texture, config.shadow);
            if (shadow) {
                shadow.zIndex = -10;
                container.addChild(shadow);
            }
        }
        
        // 2. 아웃라인 스프라이트들
        let outlines = [];
        if (config.outline?.enabled) {
            outlines = this.createOutlineSprites(texture, config.outline);
            outlines.forEach((outline, i) => {
                outline.zIndex = -1;
                container.addChild(outline);
            });
        }
        
        // 3. 메인 스프라이트
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5, 1);  // 하단 중앙
        sprite.zIndex = 10;
        sprite.label = 'main';
        
        // 픽셀 아트 설정
        if (config.pixelArt?.scaleMode === 'nearest') {
            texture.source.scaleMode = 'nearest';
        }
        
        container.addChild(sprite);
        
        // 4. 환경광 적용
        if (config.environment?.enabled) {
            this.applyEnvironmentBlending(sprite, config.environment);
        }
        
        // 데이터 저장
        container._ddooData = {
            sprite,
            outlines,
            shadow: container.children.find(c => c.label === 'shadow'),
            config,
            originalTint: sprite.tint,
            breathingTween: null
        };
        
        // 5. 숨쉬기 애니메이션 시작
        if (config.breathing?.enabled) {
            this.startBreathing(container, options.scale || 1);
        }
        
        console.log(`[DDOORenderer] ✅ 스프라이트 생성: ${imagePath}`);
        return container;
    },
    
    /**
     * 기존 스프라이트에 효과 적용
     * @param {PIXI.Sprite} sprite - 기존 스프라이트
     * @param {PIXI.Container} container - 부모 컨테이너
     * @param {Object} options - 옵션
     */
    enhanceSprite(sprite, container, options = {}) {
        if (!sprite || !container) return;
        
        const config = { ...this.config, ...options };
        
        // 기존 효과 제거
        this.removeEffects(container);
        
        // 아웃라인 추가
        if (config.outline?.enabled && sprite.texture) {
            const outlines = this.createOutlineSprites(sprite.texture, config.outline);
            outlines.forEach(outline => {
                outline.anchor.set(sprite.anchor.x, sprite.anchor.y);
                outline.zIndex = sprite.zIndex - 1;
                container.addChild(outline);
            });
        }
        
        // 그림자 추가
        if (config.shadow?.enabled && sprite.texture) {
            const shadow = this.createGroundShadow(sprite.texture, config.shadow);
            if (shadow) {
                shadow.zIndex = -10;
                container.addChild(shadow);
            }
        }
        
        // 환경광 적용
        if (config.environment?.enabled) {
            this.applyEnvironmentBlending(sprite, config.environment);
        }
        
        container.sortChildren();
        
        console.log(`[DDOORenderer] ✅ 스프라이트 강화 완료`);
    },
    
    // ==================== 텍스처 로드 ====================
    
    async loadTexture(path) {
        // 캐시 확인
        if (this.textureCache.has(path)) {
            return this.textureCache.get(path);
        }
        
        try {
            const texture = await PIXI.Assets.load(path);
            if (texture) {
                this.textureCache.set(path, texture);
                return texture;
            }
        } catch (e) {
            console.warn(`[DDOORenderer] 텍스처 로드 실패: ${path}`, e);
        }
        
        return null;
    },
    
    // ==================== 아웃라인 생성 ====================
    
    createOutlineSprites(texture, config) {
        if (!texture) return [];
        
        const thickness = config.thickness || 2;
        const color = config.color ?? 0x000000;
        const alpha = config.alpha ?? 0.9;
        const directions = config.directions || 8;
        
        // 8방향 오프셋
        const offsets8 = [
            { x: thickness, y: 0 },
            { x: -thickness, y: 0 },
            { x: 0, y: thickness },
            { x: 0, y: -thickness },
            { x: thickness * 0.7, y: thickness * 0.7 },
            { x: -thickness * 0.7, y: thickness * 0.7 },
            { x: thickness * 0.7, y: -thickness * 0.7 },
            { x: -thickness * 0.7, y: -thickness * 0.7 }
        ];
        
        // 4방향 오프셋
        const offsets4 = [
            { x: thickness, y: 0 },
            { x: -thickness, y: 0 },
            { x: 0, y: thickness },
            { x: 0, y: -thickness }
        ];
        
        const offsets = directions === 8 ? offsets8 : offsets4;
        
        return offsets.map(offset => {
            const outline = new PIXI.Sprite(texture);
            outline.anchor.set(0.5, 1);
            outline.x = offset.x;
            outline.y = offset.y;
            outline.tint = color;
            outline.alpha = alpha;
            outline.isOutline = true;
            outline.label = 'outline';
            return outline;
        });
    },
    
    // ==================== 그림자 생성 ====================
    
    createGroundShadow(texture, config) {
        if (!texture) return null;
        
        try {
            const graphics = new PIXI.Graphics();
            
            // 스프라이트 크기 기반 그림자 크기
            const spriteWidth = texture.width || 100;
            const shadowWidth = spriteWidth * 0.8;
            const shadowHeight = shadowWidth * (config.scaleY || 0.25);
            
            // 그라데이션 효과를 위해 여러 겹
            const layers = 5;
            for (let i = layers; i >= 0; i--) {
                const ratio = i / layers;
                const alpha = (config.alpha || 0.4) * (1 - ratio * 0.7);
                const w = shadowWidth * (1 + ratio * 0.3);
                const h = shadowHeight * (1 + ratio * 0.3);
                
                graphics.ellipse(0, 0, w, h);
                graphics.fill({ 
                    color: config.color || 0x000000, 
                    alpha: alpha 
                });
            }
            
            graphics.y = config.offsetY || 5;
            graphics.alpha = 0.6;
            graphics.label = 'shadow';
            
            return graphics;
        } catch (e) {
            console.warn('[DDOORenderer] 그림자 생성 실패:', e);
            return null;
        }
    },
    
    // ==================== 환경광 블렌딩 ====================
    
    applyEnvironmentBlending(sprite, config) {
        if (!sprite) return;
        
        try {
            if (typeof PIXI.ColorMatrixFilter !== 'undefined') {
                const colorMatrix = new PIXI.ColorMatrixFilter();
                
                // 밝기 조절 (던전 분위기)
                if (config.brightness !== undefined) {
                    colorMatrix.brightness(config.brightness, false);
                }
                
                // 채도 조절
                if (config.saturation !== undefined) {
                    colorMatrix.saturate(config.saturation - 1, false);
                }
                
                sprite.filters = sprite.filters || [];
                sprite.filters.push(colorMatrix);
                sprite._envFilter = colorMatrix;
            }
        } catch (e) {
            console.warn('[DDOORenderer] 환경광 적용 실패:', e);
        }
    },
    
    // ==================== 숨쉬기 애니메이션 ====================
    
    startBreathing(container, baseScale = 1) {
        if (!container || typeof gsap === 'undefined') return;
        
        const config = container._ddooData?.config?.breathing || this.config.breathing;
        const sprite = container._ddooData?.sprite || container.children.find(c => c.label === 'main');
        
        if (!sprite) return;
        
        // 기존 애니메이션 정리
        this.stopBreathing(container);
        
        // 딜레이 (동기화 방지)
        const delay = config.randomDelay ? Math.random() * 2 : 0;
        
        // 숨쉬기 트윈
        const breathTween = gsap.timeline({ repeat: -1, delay })
            .to(sprite.scale, {
                x: baseScale * (1 + config.scaleAmount),
                y: baseScale * (1 - config.scaleAmount * 0.5),
                duration: config.speed / 2,
                ease: 'sine.inOut'
            })
            .to(sprite.scale, {
                x: baseScale,
                y: baseScale,
                duration: config.speed / 2,
                ease: 'sine.inOut'
            });
        
        // Y축 움직임
        const yTween = gsap.to(container, {
            y: `+=${config.yAmount}`,
            duration: config.speed / 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay
        });
        
        if (container._ddooData) {
            container._ddooData.breathingTween = breathTween;
            container._ddooData.yTween = yTween;
        }
        
        container.breathingTween = breathTween;
        container.yTween = yTween;
    },
    
    stopBreathing(container) {
        if (!container) return;
        
        if (container.breathingTween) {
            container.breathingTween.kill();
            container.breathingTween = null;
        }
        if (container.yTween) {
            container.yTween.kill();
            container.yTween = null;
        }
        if (container._ddooData) {
            if (container._ddooData.breathingTween) {
                container._ddooData.breathingTween.kill();
            }
            if (container._ddooData.yTween) {
                container._ddooData.yTween.kill();
            }
        }
    },
    
    pauseBreathing(container) {
        if (container?.breathingTween) container.breathingTween.pause();
        if (container?.yTween) container.yTween.pause();
    },
    
    resumeBreathing(container) {
        if (container?.breathingTween) container.breathingTween.resume();
        if (container?.yTween) container.yTween.resume();
    },
    
    // ==================== 히트 이펙트 ====================
    
    /**
     * 히트 플래시 효과
     */
    hitFlash(container, color = null, duration = null) {
        const data = container?._ddooData;
        if (!data?.sprite) return;
        
        const flashColor = color || this.config.hitFlash.color;
        const flashDuration = duration || this.config.hitFlash.duration;
        
        // 기존 플래시 정리
        if (data.flashTween) {
            data.flashTween.kill();
        }
        
        const sprite = data.sprite;
        const originalTint = data.originalTint || 0xffffff;
        
        sprite.tint = flashColor;
        
        data.flashTween = gsap.delayedCall(flashDuration / 1000, () => {
            sprite.tint = originalTint;
        });
    },
    
    /**
     * 빠른 깜빡임 효과 (피격)
     */
    rapidFlash(container, colors = [0xffffff, 0xff0000], count = 4, interval = 30) {
        const data = container?._ddooData;
        if (!data?.sprite) return Promise.resolve();
        
        return new Promise(resolve => {
            const sprite = data.sprite;
            const originalTint = data.originalTint || 0xffffff;
            let flashCount = 0;
            
            const flash = () => {
                if (flashCount >= count * 2) {
                    sprite.tint = originalTint;
                    resolve();
                    return;
                }
                
                sprite.tint = colors[flashCount % colors.length];
                flashCount++;
                setTimeout(flash, interval);
            };
            
            flash();
        });
    },
    
    /**
     * 대미지 흔들림
     */
    damageShake(container, intensity = 5, duration = 200) {
        if (!container) return;
        
        const originalX = container.x;
        const originalY = container.y;
        
        gsap.to(container, {
            x: originalX + intensity,
            duration: 0.02,
            repeat: Math.floor(duration / 40),
            yoyo: true,
            ease: 'none',
            onComplete: () => {
                container.x = originalX;
                container.y = originalY;
            }
        });
    },
    
    // ==================== 상태 변경 ====================
    
    /**
     * 스프라이트 상태 변경
     */
    setState(container, state) {
        const data = container?._ddooData;
        if (!data?.sprite) return;
        
        const sprite = data.sprite;
        
        switch (state) {
            case 'idle':
                sprite.tint = data.originalTint || 0xffffff;
                sprite.alpha = 1;
                this.resumeBreathing(container);
                break;
                
            case 'hit':
                this.rapidFlash(container);
                this.damageShake(container);
                break;
                
            case 'stunned':
                sprite.tint = 0x6666dd;
                this.pauseBreathing(container);
                break;
                
            case 'dead':
                sprite.tint = 0x666666;
                sprite.alpha = 0.7;
                this.stopBreathing(container);
                break;
                
            case 'buffed':
                sprite.tint = 0xffff88;
                break;
                
            case 'debuffed':
                sprite.tint = 0x8888ff;
                break;
        }
    },
    
    // ==================== 유틸리티 ====================
    
    /**
     * 효과 제거
     */
    removeEffects(container) {
        if (!container) return;
        
        // 아웃라인 제거
        const outlines = container.children.filter(c => c.isOutline);
        outlines.forEach(o => {
            container.removeChild(o);
            o.destroy();
        });
        
        // 그림자 제거
        const shadows = container.children.filter(c => c.label === 'shadow');
        shadows.forEach(s => {
            container.removeChild(s);
            s.destroy();
        });
        
        // 필터 제거
        const mainSprite = container.children.find(c => c.label === 'main');
        if (mainSprite) {
            mainSprite.filters = [];
        }
    },
    
    /**
     * 아웃라인 색상 변경
     */
    setOutlineColor(container, color) {
        if (!container) return;
        
        container.children.forEach(child => {
            if (child.isOutline) {
                child.tint = color;
            }
        });
    },
    
    /**
     * 아웃라인 표시/숨김
     */
    setOutlineVisible(container, visible) {
        if (!container) return;
        
        container.children.forEach(child => {
            if (child.isOutline) {
                child.visible = visible;
            }
        });
    },
    
    /**
     * 스프라이트 스케일 설정
     */
    setScale(container, scale) {
        const data = container?._ddooData;
        if (!data?.sprite) return;
        
        data.sprite.scale.set(scale);
        
        // 아웃라인도 동기화
        data.outlines?.forEach(outline => {
            outline.scale.set(scale);
        });
    },
    
    /**
     * 전체 정리
     */
    destroy(container) {
        if (!container) return;
        
        this.stopBreathing(container);
        this.removeEffects(container);
        
        if (container._ddooData) {
            if (container._ddooData.flashTween) {
                container._ddooData.flashTween.kill();
            }
            container._ddooData = null;
        }
        
        if (container.parent) {
            container.parent.removeChild(container);
        }
        container.destroy({ children: true });
    },
    
    // ==================== 프리셋 ====================
    
    presets: {
        // 플레이어 스타일
        player: {
            outline: { enabled: true, color: 0xffffff, thickness: 2 },
            shadow: { enabled: true, alpha: 0.5 },
            environment: { enabled: true, brightness: 1.0 },
            breathing: { enabled: true, scaleAmount: 0.015 }
        },
        
        // 적 스타일
        enemy: {
            outline: { enabled: true, color: 0x000000, thickness: 3 },
            shadow: { enabled: true, alpha: 0.4 },
            environment: { enabled: true, brightness: 0.95 },
            breathing: { enabled: true, scaleAmount: 0.02 }
        },
        
        // 보스 스타일
        boss: {
            outline: { enabled: true, color: 0x220000, thickness: 4 },
            shadow: { enabled: true, alpha: 0.6, scaleY: 0.3 },
            environment: { enabled: true, brightness: 1.05 },
            breathing: { enabled: true, scaleAmount: 0.025, speed: 3 }
        },
        
        // NPC 스타일
        npc: {
            outline: { enabled: true, color: 0x333333, thickness: 2 },
            shadow: { enabled: true, alpha: 0.3 },
            environment: { enabled: true, brightness: 1.0 },
            breathing: { enabled: true, scaleAmount: 0.01, speed: 3.5 }
        },
        
        // 아이템/오브젝트 스타일
        object: {
            outline: { enabled: false },
            shadow: { enabled: true, alpha: 0.3 },
            environment: { enabled: false },
            breathing: { enabled: false }
        }
    },
    
    /**
     * 프리셋으로 스프라이트 생성
     */
    async createWithPreset(imagePath, presetName, overrides = {}) {
        const preset = this.presets[presetName] || this.presets.enemy;
        const options = { ...preset, ...overrides };
        return this.createSprite(imagePath, options);
    }
};

// 전역 노출
window.DDOORenderer = DDOORenderer;

console.log('[DDOORenderer] ✅ 고품격 스프라이트 렌더러 로드됨');
