// =====================================================
// DDOO Character System - 캐릭터 관리/잔상/그림자
// =====================================================

const DDOOCharacter = {
    // ==================== 상태 ====================
    initialized: false,
    pixiApp: null,
    stageContainer: null,
    config: null,
    
    // 캐릭터 관리
    characters: new Map(),  // id -> CharacterData
    
    // 컨테이너
    shadowContainer: null,
    afterimageContainer: null,
    
    // 잔상 데이터
    afterimages: [],
    
    // 애니메이션 프레임
    animationFrame: null,
    
    // ==================== 초기화 ====================
    init(pixiApp, stageContainer, config = {}) {
        if (this.initialized) return this;
        
        this.pixiApp = pixiApp;
        this.stageContainer = stageContainer;
        this.config = config;
        
        this.createContainers();
        
        // 🔄 잔상 업데이트 루프 시작
        this.startUpdateLoop();
        
        this.initialized = true;
        console.log('[DDOOCharacter] ✅ 캐릭터 시스템 초기화 완료');
        
        return this;
    },
    
    // 🔄 업데이트 루프 시작
    startUpdateLoop() {
        const update = () => {
            this.updateAfterimages();
            this.animationFrame = requestAnimationFrame(update);
        };
        update();
    },
    
    createContainers() {
        if (!this.stageContainer) return;
        
        // 그림자 컨테이너 (맨 아래)
        this.shadowContainer = new PIXI.Container();
        this.shadowContainer.name = 'ddoo-shadows';
        this.stageContainer.addChildAt(this.shadowContainer, 0);
        
        // 잔상 컨테이너 (그림자 위)
        this.afterimageContainer = new PIXI.Container();
        this.afterimageContainer.name = 'ddoo-afterimages';
        this.stageContainer.addChildAt(this.afterimageContainer, 1);
    },
    
    // ==================== 캐릭터 생성 ====================
    create(id, options = {}) {
        const {
            texture,
            x = 0,
            y = 0,
            scale = 1,
            anchor = { x: 0.5, y: 1 },
            team = 'player',
            enableEffects = true
        } = options;
        
        const charConfig = this.config.character || {};
        
        // 메인 컨테이너
        const container = new PIXI.Container();
        container.name = `char-${id}`;
        container.x = x;
        container.y = y;
        
        // 스프라이트
        const sprite = texture ? new PIXI.Sprite(texture) : new PIXI.Sprite();
        sprite.anchor.set(anchor.x, anchor.y);
        sprite.scale.set(scale);
        container.addChild(sprite);
        
        // 그림자
        let shadow = null;
        if (enableEffects && charConfig.shadowAlpha) {
            shadow = this.createShadow(sprite, charConfig);
            this.shadowContainer?.addChild(shadow);
            shadow.x = x;
            shadow.y = y + (charConfig.shadowOffsetY || 5);
        }
        
        // 스테이지에 추가
        this.stageContainer?.addChild(container);
        
        // 캐릭터 데이터 저장
        const charData = {
            id,
            container,
            sprite,
            shadow,
            team,
            baseX: x,
            baseY: y,
            state: 'idle',
            enableEffects
        };
        
        this.characters.set(id, charData);
        
        // 호흡 애니메이션 시작
        if (enableEffects && charConfig.breathingAmount) {
            this.startBreathing(charData);
        }
        
        return charData;
    },
    
    createShadow(sprite, config) {
        const shadow = new PIXI.Graphics();
        
        const width = (sprite.width || 60) * 0.8;
        const height = width * (config.shadowScaleY || 0.3);
        
        shadow.beginFill(0x000000, config.shadowAlpha || 0.4);
        shadow.drawEllipse(0, 0, width / 2, height / 2);
        shadow.endFill();
        shadow.alpha = config.shadowAlpha || 0.4;
        
        return shadow;
    },
    
    // ==================== 호흡 애니메이션 ====================
    startBreathing(charData) {
        if (!charData.sprite || !charData.enableEffects) return;
        
        const config = this.config.character || {};
        const amount = config.breathingAmount || 0.02;
        const speed = config.breathingSpeed || 1.5;
        
        if (typeof gsap !== 'undefined') {
            charData.breathingTween = gsap.to(charData.sprite.scale, {
                y: charData.sprite.scale.y * (1 + amount),
                duration: speed,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }
    },
    
    stopBreathing(charData) {
        if (charData.breathingTween) {
            charData.breathingTween.kill();
            charData.breathingTween = null;
        }
    },
    
    // ==================== 캐릭터 조회 ====================
    get(id) {
        return this.characters.get(id);
    },
    
    getAll() {
        return Array.from(this.characters.values());
    },
    
    // ==================== 캐릭터 제거 ====================
    remove(id) {
        const charData = this.characters.get(id);
        if (!charData) return;
        
        // 호흡 중지
        this.stopBreathing(charData);
        
        // 그림자 제거
        if (charData.shadow?.parent) {
            charData.shadow.parent.removeChild(charData.shadow);
        }
        
        // 컨테이너 제거
        if (charData.container?.parent) {
            charData.container.parent.removeChild(charData.container);
        }
        
        this.characters.delete(id);
    },
    
    // ==================== 히트 플래시 ====================
    hitFlash(id, color = 0xffffff, duration = 100) {
        const charData = this.characters.get(id);
        if (!charData?.sprite) return;
        
        const sprite = charData.sprite;
        const originalTint = sprite.tint;
        
        sprite.tint = color;
        
        setTimeout(() => {
            if (sprite.parent) {
                sprite.tint = originalTint;
            }
        }, duration);
    },
    
    // ==================== 잔상 시스템 ====================
    createAfterimage(id, options = {}) {
        const charData = this.characters.get(id);
        if (!charData?.sprite || !this.afterimageContainer) return;
        
        const sprite = charData.sprite;
        const container = charData.container;
        
        // 잔상 스프라이트 복제
        const ghost = new PIXI.Sprite(sprite.texture);
        ghost.anchor.set(sprite.anchor.x, sprite.anchor.y);
        ghost.position.set(container.x, container.y);
        ghost.scale.set(sprite.scale.x, sprite.scale.y);
        ghost.rotation = sprite.rotation;
        ghost.alpha = options.alpha || 0.5;
        ghost.tint = options.tint || 0x60a5fa;
        
        this.afterimageContainer.addChild(ghost);
        
        const afterimage = {
            sprite: ghost,
            born: performance.now(),
            life: options.life || 300
        };
        
        this.afterimages.push(afterimage);
        
        return afterimage;
    },
    
    updateAfterimages() {
        const now = performance.now();
        
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            const ai = this.afterimages[i];
            const age = now - ai.born;
            
            if (age >= ai.life) {
                if (ai.sprite?.parent) {
                    ai.sprite.parent.removeChild(ai.sprite);
                }
                this.afterimages.splice(i, 1);
                continue;
            }
            
            // 페이드 아웃
            const progress = age / ai.life;
            ai.sprite.alpha = (1 - progress) * 0.5;
        }
    },
    
    clearAfterimages() {
        this.afterimages.forEach(ai => {
            if (ai.sprite?.parent) {
                ai.sprite.parent.removeChild(ai.sprite);
            }
        });
        this.afterimages.length = 0;
    },
    
    // ==================== 상태 변경 ====================
    setState(id, state) {
        const charData = this.characters.get(id);
        if (charData) {
            charData.state = state;
        }
    },
    
    // ==================== 위치 업데이트 ====================
    setPosition(id, x, y) {
        const charData = this.characters.get(id);
        if (!charData) return;
        
        charData.container.x = x;
        charData.container.y = y;
        
        // 그림자도 업데이트
        if (charData.shadow) {
            const config = this.config.character || {};
            charData.shadow.x = x;
            charData.shadow.y = y + (config.shadowOffsetY || 5);
        }
    },
    
    setBasePosition(id, x, y) {
        const charData = this.characters.get(id);
        if (charData) {
            charData.baseX = x;
            charData.baseY = y;
        }
    },
    
    // ==================== 정리 ====================
    destroy() {
        // 업데이트 루프 중지
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // 모든 캐릭터 제거
        this.characters.forEach((_, id) => this.remove(id));
        this.characters.clear();
        
        // 잔상 클리어
        this.clearAfterimages();
        
        // 컨테이너 제거
        if (this.shadowContainer?.parent) {
            this.shadowContainer.parent.removeChild(this.shadowContainer);
        }
        if (this.afterimageContainer?.parent) {
            this.afterimageContainer.parent.removeChild(this.afterimageContainer);
        }
        
        this.initialized = false;
    },
    
    // ==================== 통계 ====================
    getStats() {
        return {
            characters: this.characters.size,
            afterimages: this.afterimages.length
        };
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOOCharacter = DDOOCharacter;
}

console.log('[DDOOCharacter] 👤 캐릭터 모듈 로드됨');
