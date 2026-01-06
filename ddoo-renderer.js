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
            thickness: 3,           // 두께 (픽셀) 🔥 기본값 증가
            alpha: 1.0,             // 🔥 더 선명하게
            directions: 8           // 4 또는 8방향
        },
        
        // 그림자 설정 🔥 더 눈에 띄게
        shadow: {
            enabled: true,
            color: 0x000000,
            alpha: 0.7,             // 🔥 더 진하게
            scaleX: 1.3,            // 🔥 더 넓게
            scaleY: 0.4,            // 🔥 더 두껍게
            offsetY: 8,             // 발 아래 오프셋
            blur: false
        },
        
        // 환경광 설정 (비활성화 - 쓸모없음)
        environment: {
            enabled: false
        },
        
        // 틴트 (색조) - 직접적인 색상 변경
        tint: null,  // 0xff6666 형태로 지정
        
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
        
        // 스케일 설정
        const scale = options.scale || 1;
        sprite.scale.set(scale);
        
        // 아웃라인 스케일도 동기화
        outlines.forEach(outline => {
            outline.scale.set(scale);
        });
        
        // 픽셀 아트 설정
        if (config.pixelArt?.scaleMode === 'nearest') {
            texture.source.scaleMode = 'nearest';
        }
        
        container.addChild(sprite);
        
        // 4. 틴트 적용 (직접적인 색상 변경)
        if (config.tint) {
            sprite.tint = config.tint;
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
        
        // 틴트 적용
        if (config.tint) {
            sprite.tint = config.tint;
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
            
            // 🔥 더 큰 그림자!
            const spriteWidth = texture.width || 100;
            const spriteHeight = texture.height || 100;
            
            // 스프라이트 크기에 비례하는 큰 그림자
            const shadowWidth = spriteWidth * (config.scaleX || 1.2);
            const shadowHeight = shadowWidth * (config.scaleY || 0.35);
            
            // 🔥 더 선명한 그라데이션 효과
            const layers = 8;
            for (let i = layers; i >= 0; i--) {
                const ratio = i / layers;
                // 중심부는 더 진하게, 바깥은 더 부드럽게
                const alpha = (config.alpha || 0.6) * Math.pow(1 - ratio, 0.5);
                const w = shadowWidth * (0.5 + ratio * 0.6);
                const h = shadowHeight * (0.5 + ratio * 0.6);
                
                graphics.ellipse(0, 0, w, h);
                graphics.fill({ 
                    color: config.color || 0x000000, 
                    alpha: alpha 
                });
            }
            
            // 🔥 중심부 강조 (가장 진한 부분)
            graphics.ellipse(0, 0, shadowWidth * 0.3, shadowHeight * 0.3);
            graphics.fill({ 
                color: config.color || 0x000000, 
                alpha: (config.alpha || 0.6) * 1.2
            });
            
            graphics.y = config.offsetY || 8;
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
                
                // 🔥 던전 분위기 - 밝기 조절
                const brightness = config.brightness ?? 0.85;
                colorMatrix.brightness(brightness, false);
                
                // 🔥 채도 낮추기 (던전은 색이 바래야 함)
                const saturation = config.saturation ?? 0.75;
                colorMatrix.saturate(saturation - 1, false);
                
                // 🔥 대비 높이기 (더 선명하게)
                const contrast = config.contrast ?? 1.15;
                colorMatrix.contrast(contrast, false);
                
                // 🔥 던전 색조 (푸른/차가운 톤)
                if (config.tint) {
                    // 커스텀 색조
                    const r = ((config.tint >> 16) & 0xFF) / 255;
                    const g = ((config.tint >> 8) & 0xFF) / 255;
                    const b = (config.tint & 0xFF) / 255;
                    colorMatrix.matrix[0] *= r * 1.2;  // R
                    colorMatrix.matrix[6] *= g * 1.2;  // G
                    colorMatrix.matrix[12] *= b * 1.2; // B
                } else if (config.dungeonTone !== false) {
                    // 기본 던전 톤 (약간 푸른빛)
                    colorMatrix.matrix[0] *= 0.95;   // R 살짝 줄임
                    colorMatrix.matrix[6] *= 0.98;   // G 거의 유지
                    colorMatrix.matrix[12] *= 1.08;  // B 살짝 올림
                }
                
                // PixiJS 8: filters 배열은 새로 할당해야 함 (push 불가)
                const existingFilters = sprite.filters ? [...sprite.filters] : [];
                existingFilters.push(colorMatrix);
                sprite.filters = existingFilters;
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
        
        // 기준 Y 위치 저장
        const baseY = container.y;
        
        // 숨쉬기 트윈 (스케일만, Y 위치는 건드리지 않음)
        const breathTween = gsap.timeline({ repeat: -1, yoyo: true, delay })
            .to(sprite.scale, {
                x: baseScale * (1 - config.scaleAmount * 0.3),
                y: baseScale * (1 + config.scaleAmount),
                duration: config.speed,
                ease: 'sine.inOut'
            });
        
        // Y축 움직임 제거 (3D 좌표 시스템과 충돌 방지)
        // 스케일 변화만으로도 충분한 숨쉬기 효과
        const yTween = null;
        
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
                this.setTargeted(container, false);
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
                
            case 'targeted':
                this.setTargeted(container, true);
                break;
        }
    },
    
    // ==================== 타겟 하이라이트 (테두리 글로우) ====================
    
    /**
     * 타겟 글로우 ON/OFF - 아웃라인을 밝게 + 두껍게 펄스
     */
    setTargeted(container, isTargeted) {
        const data = container?._ddooData;
        if (!data) return;
        
        const sprite = data.sprite;
        const outlines = data.outlines || [];
        
        // 기존 애니메이션 정리
        if (data.targetTween) {
            data.targetTween.kill();
            data.targetTween = null;
        }
        
        if (!isTargeted) {
            data.isTargeted = false;
            // 원래 아웃라인 상태 복원
            const origColor = data.config?.outline?.color ?? 0x000000;
            outlines.forEach(outline => {
                outline.tint = origColor;
                outline.alpha = data.config?.outline?.alpha ?? 0.9;
                outline.scale.set(sprite?.scale?.x || 1, sprite?.scale?.y || 1);
            });
            // 스프라이트 tint 복원
            if (sprite) sprite.tint = data.originalTint || 0xffffff;
            return;
        }
        
        // 글로우 활성화
        data.isTargeted = true;
        
        // 아웃라인 색상을 노란색으로 + 스프라이트 살짝 밝게
        outlines.forEach(outline => {
            outline.tint = 0xffdd00;
            outline.alpha = 1;
        });
        
        // 펄스 애니메이션: 스프라이트 밝기 + 아웃라인 스케일
        const baseScale = sprite?.scale?.x || 1;
        
        data.targetTween = gsap.timeline({ repeat: -1 });
        
        // 밝아지면서 아웃라인 확장
        data.targetTween.to({}, {
            duration: 0.35,
            ease: 'sine.inOut',
            onUpdate: function() {
                const progress = this.progress();
                const pulse = Math.sin(progress * Math.PI);
                
                // 스프라이트 밝기 (tint로 표현)
                if (sprite) {
                    const brightness = Math.floor(255 - pulse * 40);
                    sprite.tint = (brightness << 16) | (brightness << 8) | brightness;
                }
                
                // 아웃라인 확장 (글로우 느낌)
                const glowScale = baseScale * (1 + pulse * 0.15);
                outlines.forEach(outline => {
                    outline.scale.set(glowScale, glowScale);
                    outline.alpha = 0.7 + pulse * 0.3;
                });
            }
        });
        
        // 어두워지면서 아웃라인 수축
        data.targetTween.to({}, {
            duration: 0.35,
            ease: 'sine.inOut',
            onUpdate: function() {
                const progress = this.progress();
                const pulse = Math.sin(progress * Math.PI);
                
                if (sprite) {
                    const brightness = Math.floor(215 + pulse * 40);
                    sprite.tint = (brightness << 16) | (brightness << 8) | brightness;
                }
                
                const glowScale = baseScale * (1.15 - pulse * 0.15);
                outlines.forEach(outline => {
                    outline.scale.set(glowScale, glowScale);
                    outline.alpha = 1 - pulse * 0.3;
                });
            }
        });
    },
    
    /**
     * 타겟 글로우 토글
     */
    toggleTargeted(container) {
        const data = container?._ddooData;
        if (!data) return;
        
        this.setTargeted(container, !data.isTargeted);
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
            outline: { enabled: true, color: 0x222244, thickness: 2 },
            shadow: { enabled: true, alpha: 0.6, scaleX: 1.2 },
            breathing: { enabled: true, scaleAmount: 0.015 }
        },
        
        // 적 스타일
        enemy: {
            outline: { enabled: true, color: 0x000000, thickness: 3 },
            shadow: { enabled: true, alpha: 0.7, scaleX: 1.3 },
            breathing: { enabled: true, scaleAmount: 0.02 }
        },
        
        // 보스 스타일
        boss: {
            outline: { enabled: true, color: 0x330000, thickness: 4 },
            shadow: { enabled: true, alpha: 0.8, scaleX: 1.5 },
            breathing: { enabled: true, scaleAmount: 0.025, speed: 3 }
        },
        
        // NPC 스타일
        npc: {
            outline: { enabled: true, color: 0x333333, thickness: 2 },
            shadow: { enabled: true, alpha: 0.4 },
            breathing: { enabled: true, scaleAmount: 0.01, speed: 3.5 }
        },
        
        // 아이템/오브젝트 스타일
        object: {
            outline: { enabled: false },
            shadow: { enabled: true, alpha: 0.3 },
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
    },
    
    // ==================== 🎬 스튜디오 프리뷰 시스템 ====================
    
    studio: {
        app: null,
        container: null,
        currentSprite: null,
        previewScale: 1.5,
        backgroundColor: 0x2a2a3a
    },
    
    /**
     * 스튜디오 초기화 (프리뷰용 PixiJS 앱)
     * @param {HTMLElement} parentElement - 부모 DOM 요소
     * @param {number} width - 캔버스 너비
     * @param {number} height - 캔버스 높이
     */
    async initStudio(parentElement, width = 400, height = 500) {
        if (this.studio.app) {
            this.studio.app.destroy(true);
        }
        
        // PixiJS 앱 생성
        this.studio.app = new PIXI.Application();
        await this.studio.app.init({
            width,
            height,
            backgroundColor: this.studio.backgroundColor,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        
        parentElement.appendChild(this.studio.app.canvas);
        this.studio.app.canvas.style.borderRadius = '8px';
        
        // 메인 컨테이너
        this.studio.container = new PIXI.Container();
        this.studio.app.stage.addChild(this.studio.container);
        
        // 바닥선 그리기
        this.drawStudioFloor(width, height);
        
        console.log('[DDOORenderer Studio] ✅ 스튜디오 초기화 완료');
        return this.studio.app;
    },
    
    /**
     * 스튜디오 바닥선 그리기
     */
    drawStudioFloor(width, height) {
        const floor = new PIXI.Graphics();
        const floorY = height * 0.85;
        
        // 바닥 그라데이션
        floor.rect(0, floorY, width, height - floorY);
        floor.fill({ color: 0x1a1a2a });
        
        // 바닥선
        floor.moveTo(0, floorY);
        floor.lineTo(width, floorY);
        floor.stroke({ color: 0x4a4a6a, width: 2 });
        
        // 그리드
        for (let x = 0; x < width; x += 50) {
            floor.moveTo(x, floorY);
            floor.lineTo(x, height);
            floor.stroke({ color: 0x3a3a5a, width: 1, alpha: 0.3 });
        }
        
        floor.zIndex = -100;
        this.studio.container.addChild(floor);
    },
    
    /**
     * 스튜디오에서 스프라이트 프리뷰
     * @param {string} imagePath - 이미지 경로
     * @param {string} presetName - 프리셋 이름 ('player', 'enemy', 'boss', 'npc', 'object')
     * @param {Object} overrides - 설정 오버라이드
     */
    async previewSprite(imagePath, presetName = 'enemy', overrides = {}) {
        if (!this.studio.app) {
            console.error('[DDOORenderer Studio] 스튜디오가 초기화되지 않음');
            return null;
        }
        
        // 기존 스프라이트 제거
        if (this.studio.currentSprite) {
            this.destroy(this.studio.currentSprite);
            this.studio.currentSprite = null;
        }
        
        // 새 스프라이트 생성
        const sprite = await this.createWithPreset(imagePath, presetName, {
            ...overrides,
            scale: this.studio.previewScale
        });
        
        if (!sprite) return null;
        
        // 중앙 하단에 배치
        const { width, height } = this.studio.app.screen;
        sprite.x = width / 2;
        sprite.y = height * 0.85;
        
        this.studio.container.addChild(sprite);
        this.studio.currentSprite = sprite;
        
        console.log(`[DDOORenderer Studio] 프리뷰: ${imagePath} (${presetName})`);
        return sprite;
    },
    
    /**
     * 현재 스프라이트에 상태 테스트
     */
    testState(state) {
        if (!this.studio.currentSprite) return;
        this.setState(this.studio.currentSprite, state);
    },
    
    /**
     * 현재 스프라이트에 히트 테스트
     */
    testHit() {
        if (!this.studio.currentSprite) return;
        this.rapidFlash(this.studio.currentSprite);
        this.damageShake(this.studio.currentSprite, 8, 300);
    },
    
    /**
     * 현재 스프라이트 설정 업데이트
     */
    updatePreviewConfig(configPath, value) {
        if (!this.studio.currentSprite?._ddooData) return;
        
        // config 경로 파싱 (예: 'outline.color')
        const parts = configPath.split('.');
        let target = this.studio.currentSprite._ddooData.config;
        
        for (let i = 0; i < parts.length - 1; i++) {
            target = target[parts[i]];
            if (!target) return;
        }
        
        target[parts[parts.length - 1]] = value;
        
        // 스프라이트 다시 렌더링
        const imagePath = this.studio.currentSprite.label;
        const config = this.studio.currentSprite._ddooData.config;
        this.previewSprite(imagePath, 'custom', config);
    },
    
    /**
     * 스튜디오 UI 패널 생성
     * @param {HTMLElement} parentElement - 부모 DOM 요소
     */
    createStudioUI(parentElement) {
        const panel = document.createElement('div');
        panel.id = 'ddoo-renderer-studio';
        panel.innerHTML = `
            <style>
                #ddoo-renderer-studio {
                    background: #1a1a2e;
                    border-radius: 12px;
                    padding: 15px;
                    color: #eee;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 13px;
                }
                #ddoo-renderer-studio h3 {
                    margin: 0 0 15px 0;
                    color: #ffd700;
                    font-size: 16px;
                }
                #ddoo-renderer-studio .studio-section {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                }
                #ddoo-renderer-studio .studio-section h4 {
                    margin: 0 0 10px 0;
                    font-size: 13px;
                    color: #aaa;
                }
                #ddoo-renderer-studio .studio-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    gap: 10px;
                }
                #ddoo-renderer-studio label {
                    width: 80px;
                    color: #888;
                }
                #ddoo-renderer-studio input[type="text"],
                #ddoo-renderer-studio input[type="number"] {
                    flex: 1;
                    padding: 5px 8px;
                    border: 1px solid #444;
                    border-radius: 4px;
                    background: #2a2a3e;
                    color: #fff;
                }
                #ddoo-renderer-studio input[type="color"] {
                    width: 50px;
                    height: 30px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                #ddoo-renderer-studio input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                }
                #ddoo-renderer-studio input[type="range"] {
                    flex: 1;
                }
                #ddoo-renderer-studio select {
                    flex: 1;
                    padding: 5px;
                    background: #2a2a3e;
                    color: #fff;
                    border: 1px solid #444;
                    border-radius: 4px;
                }
                #ddoo-renderer-studio button {
                    padding: 8px 15px;
                    margin: 3px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                }
                #ddoo-renderer-studio .btn-primary {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }
                #ddoo-renderer-studio .btn-danger {
                    background: linear-gradient(135deg, #f5576c, #f093fb);
                    color: white;
                }
                #ddoo-renderer-studio .btn-success {
                    background: linear-gradient(135deg, #11998e, #38ef7d);
                    color: white;
                }
                #ddoo-renderer-studio .btn-warning {
                    background: linear-gradient(135deg, #f5af19, #f12711);
                    color: white;
                }
                #ddoo-renderer-studio button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                #renderer-preview {
                    margin-bottom: 15px;
                    border-radius: 8px;
                    overflow: hidden;
                }
            </style>
            
            <h3>🎨 DDOORenderer Studio</h3>
            
            <!-- 프리뷰 캔버스 -->
            <div id="renderer-preview"></div>
            
            <!-- 스프라이트 선택 -->
            <div class="studio-section">
                <h4>📁 스프라이트 선택</h4>
                <div class="studio-row">
                    <label>이미지</label>
                    <input type="text" id="sprite-path" value="goblin.png" placeholder="이미지 경로">
                </div>
                <div class="studio-row">
                    <label>프리셋</label>
                    <select id="sprite-preset">
                        <option value="player">🎮 Player</option>
                        <option value="enemy" selected>👹 Enemy</option>
                        <option value="boss">💀 Boss</option>
                        <option value="npc">🧙 NPC</option>
                        <option value="object">📦 Object</option>
                    </select>
                </div>
                <button class="btn-primary" onclick="DDOORenderer.loadPreviewSprite()">🔄 로드</button>
            </div>
            
            <!-- 아웃라인 설정 -->
            <div class="studio-section">
                <h4>✏️ 아웃라인</h4>
                <div class="studio-row">
                    <label>활성화</label>
                    <input type="checkbox" id="outline-enabled" checked>
                </div>
                <div class="studio-row">
                    <label>색상</label>
                    <input type="color" id="outline-color" value="#000000">
                </div>
                <div class="studio-row">
                    <label>두께</label>
                    <input type="range" id="outline-thickness" min="1" max="6" value="2">
                    <span id="outline-thickness-val">2</span>
                </div>
            </div>
            
            <!-- 그림자 설정 -->
            <div class="studio-section">
                <h4>🌑 그림자</h4>
                <div class="studio-row">
                    <label>활성화</label>
                    <input type="checkbox" id="shadow-enabled" checked>
                </div>
                <div class="studio-row">
                    <label>불투명도</label>
                    <input type="range" id="shadow-alpha" min="0" max="100" value="40">
                    <span id="shadow-alpha-val">0.4</span>
                </div>
            </div>
            
            <!-- 테스트 버튼들 -->
            <div class="studio-section">
                <h4>🎬 상태 테스트</h4>
                <button class="btn-success" onclick="DDOORenderer.testState('idle')">😊 Idle</button>
                <button class="btn-danger" onclick="DDOORenderer.testHit()">💥 Hit</button>
                <button class="btn-warning" onclick="DDOORenderer.testState('stunned')">😵 Stunned</button>
                <button class="btn-primary" onclick="DDOORenderer.testState('buffed')">✨ Buffed</button>
            </div>
        `;
        
        parentElement.appendChild(panel);
        
        // 이벤트 바인딩
        this.bindStudioEvents();
        
        return panel;
    },
    
    /**
     * 스튜디오 이벤트 바인딩
     */
    bindStudioEvents() {
        // 아웃라인 두께
        const thicknessSlider = document.getElementById('outline-thickness');
        if (thicknessSlider) {
            thicknessSlider.oninput = () => {
                document.getElementById('outline-thickness-val').textContent = thicknessSlider.value;
            };
        }
        
        // 그림자 불투명도
        const alphaSlider = document.getElementById('shadow-alpha');
        if (alphaSlider) {
            alphaSlider.oninput = () => {
                document.getElementById('shadow-alpha-val').textContent = (alphaSlider.value / 100).toFixed(2);
            };
        }
    },
    
    /**
     * UI에서 스프라이트 로드
     */
    loadPreviewSprite() {
        const path = document.getElementById('sprite-path')?.value || 'goblin.png';
        const preset = document.getElementById('sprite-preset')?.value || 'enemy';
        
        const overrides = {
            outline: {
                enabled: document.getElementById('outline-enabled')?.checked ?? true,
                color: parseInt((document.getElementById('outline-color')?.value || '#000000').replace('#', ''), 16),
                thickness: parseInt(document.getElementById('outline-thickness')?.value || '2')
            },
            shadow: {
                enabled: document.getElementById('shadow-enabled')?.checked ?? true,
                alpha: parseInt(document.getElementById('shadow-alpha')?.value || '40') / 100
            }
        };
        
        this.previewSprite(path, preset, overrides);
    },
    
    /**
     * 스튜디오 정리
     */
    destroyStudio() {
        if (this.studio.currentSprite) {
            this.destroy(this.studio.currentSprite);
        }
        if (this.studio.app) {
            this.studio.app.destroy(true);
            this.studio.app = null;
        }
        this.studio.container = null;
        this.studio.currentSprite = null;
    }
};

// 전역 노출
window.DDOORenderer = DDOORenderer;

console.log('[DDOORenderer] ✅ 고품격 스프라이트 렌더러 + 스튜디오 로드됨');
