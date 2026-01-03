// ==========================================
// Shadow Deck - 통합 애니메이션 시스템
// 모든 애니메이션을 일원화하여 충돌 방지
// ==========================================

const AnimationSystem = {
    // 현재 재생 중인 애니메이션 추적
    activeAnimations: new Map(),
    
    // 애니메이션 정의 레지스트리
    registry: {},
    
    // 애니메이션 큐 (순차 실행용)
    queue: [],
    isProcessingQueue: false,
    
    // 설정
    config: {
        defaultDuration: 200,
        defaultEase: 'power2.out',
        debug: false
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[AnimationSystem] 🎬 통합 애니메이션 시스템 초기화');
        this.registerCoreAnimations();
        this.registerCardAnimations();
        window.AnimationSystem = this;
    },
    
    // ==========================================
    // 핵심 애니메이션 등록
    // ==========================================
    registerCoreAnimations() {
        // ========== 플레이어 애니메이션 ==========
        this.register('player.idle', {
            target: 'player',
            type: 'loop',
            keyframes: [
                { scale: 1.0, duration: 1500 },
                { scale: 1.02, duration: 1500 }
            ]
        });
        
        this.register('player.attack', {
            target: 'player',
            type: 'once',
            priority: 10,
            duration: 150,
            keyframes: [
                { x: 0, scaleX: 1, scaleY: 1, duration: 0 },
                { x: -10, scaleX: 0.95, scaleY: 1.05, duration: 30 },
                { x: 30, scaleX: 1.1, scaleY: 0.92, duration: 40 },
                { x: 0, scaleX: 1, scaleY: 1, duration: 80 }
            ]
        });
        
        this.register('player.hit', {
            target: 'player',
            type: 'once',
            priority: 20,
            duration: 200,
            keyframes: [
                { x: 0, scaleX: 1, scaleY: 1, tint: 0xffffff, duration: 0 },
                { x: -15, scaleX: 0.85, scaleY: 1.15, tint: 0xff6666, duration: 40 },
                { x: -15, scaleX: 0.85, scaleY: 1.15, tint: 0xff6666, duration: 60 }, // 히트스탑
                { x: 0, scaleX: 1, scaleY: 1, tint: 0xffffff, duration: 100 }
            ]
        });
        
        this.register('player.defend', {
            target: 'player',
            type: 'once',
            priority: 5,
            duration: 300,
            keyframes: [
                { scaleX: 1, scaleY: 1, duration: 0 },
                { scaleX: 0.9, scaleY: 1.1, duration: 100 },
                { scaleX: 1, scaleY: 1, duration: 200 }
            ]
        });
        
        this.register('player.stab', {
            target: 'player',
            type: 'once',
            priority: 10,
            duration: 120,
            keyframes: [
                { x: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 0 },
                { x: -10, scaleX: 0.95, scaleY: 1.05, rotation: -0.02, duration: 30 },
                { x: 25, scaleX: 1.1, scaleY: 0.92, rotation: 0.01, duration: 30 },
                { x: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 60 }
            ]
        });
        
        this.register('player.dash', {
            target: 'player',
            type: 'once',
            priority: 15,
            duration: 150,
            keyframes: [
                { x: 0, duration: 0 },
                { x: 80, duration: 150 }
            ]
        });
        
        this.register('player.dashReturn', {
            target: 'player',
            type: 'once',
            priority: 5,
            duration: 200,
            keyframes: [
                { x: 80, duration: 0 },
                { x: 0, duration: 200 }
            ]
        });
        
        // ========== 적 애니메이션 ==========
        this.register('enemy.idle', {
            target: 'enemy',
            type: 'loop',
            keyframes: [
                { scale: 1.0, duration: 1200 },
                { scale: 1.02, duration: 1200 }
            ]
        });
        
        this.register('enemy.hit', {
            target: 'enemy',
            type: 'once',
            priority: 20,
            duration: 250,
            keyframes: [
                { x: 0, scaleX: 1, scaleY: 1, tint: 0xffffff, duration: 0 },
                { x: 20, scaleX: 0.8, scaleY: 1.2, tint: 0xff4444, duration: 40 },
                { x: 20, scaleX: 0.8, scaleY: 1.2, tint: 0xff4444, duration: 80 }, // 히트스탑
                { x: 0, scaleX: 1, scaleY: 1, tint: 0xffffff, duration: 130 }
            ]
        });
        
        this.register('enemy.attack', {
            target: 'enemy',
            type: 'once',
            priority: 10,
            duration: 200,
            keyframes: [
                { x: 0, scaleX: 1, scaleY: 1, duration: 0 },
                { x: 10, scaleX: 1.05, scaleY: 0.95, duration: 50 },
                { x: -40, scaleX: 1.15, scaleY: 0.88, duration: 80 },
                { x: 0, scaleX: 1, scaleY: 1, duration: 70 }
            ]
        });
        
        this.register('enemy.death', {
            target: 'enemy',
            type: 'once',
            priority: 100,
            duration: 500,
            keyframes: [
                { alpha: 1, scaleX: 1, scaleY: 1, rotation: 0, duration: 0 },
                { alpha: 0.8, scaleX: 1.1, scaleY: 0.9, rotation: 0.1, duration: 100 },
                { alpha: 0, scaleX: 0.5, scaleY: 1.5, rotation: 0.3, y: 50, duration: 400 }
            ]
        });
        
        this.register('enemy.stun', {
            target: 'enemy',
            type: 'once',
            priority: 15,
            duration: 400,
            keyframes: [
                { rotation: 0, duration: 0 },
                { rotation: -0.1, duration: 80 },
                { rotation: 0.1, duration: 80 },
                { rotation: -0.05, duration: 80 },
                { rotation: 0.05, duration: 80 },
                { rotation: 0, duration: 80 }
            ]
        });
        
        console.log('[AnimationSystem] ✅ 핵심 애니메이션 등록 완료');
    },
    
    // ==========================================
    // 카드 전용 애니메이션 등록
    // ==========================================
    registerCardAnimations() {
        // 🗡️ 연속 찌르기 (3회)
        this.register('card.flurry', {
            target: 'player',
            type: 'sequence',
            priority: 15,
            steps: [
                { anim: 'player.dash', wait: true },
                { anim: 'player.stab', wait: true, callback: 'onHit', callbackArg: 0 },
                { delay: 80 },
                { anim: 'player.stab', wait: true, callback: 'onHit', callbackArg: 1 },
                { delay: 80 },
                { anim: 'player.stab', wait: true, callback: 'onHit', callbackArg: 2 },
                { delay: 100 },
                { anim: 'player.dashReturn', wait: true }
            ]
        });
        
        // 🗡️ 연속 찌르기+ (4회)
        this.register('card.flurryP', {
            target: 'player',
            type: 'sequence',
            priority: 15,
            steps: [
                { anim: 'player.dash', wait: true },
                { anim: 'player.stab', wait: true, callback: 'onHit', callbackArg: 0 },
                { delay: 60 },
                { anim: 'player.stab', wait: true, callback: 'onHit', callbackArg: 1 },
                { delay: 60 },
                { anim: 'player.stab', wait: true, callback: 'onHit', callbackArg: 2 },
                { delay: 60 },
                { anim: 'player.stab', wait: true, callback: 'onHit', callbackArg: 3 },
                { delay: 80 },
                { anim: 'player.dashReturn', wait: true }
            ]
        });
        
        // ⚔️ 베기
        this.register('card.strike', {
            target: 'player',
            type: 'sequence',
            priority: 10,
            steps: [
                { anim: 'player.attack', wait: true, callback: 'onHit', callbackArg: 0 }
            ]
        });
        
        // 💥 강타
        this.register('card.bash', {
            target: 'player',
            type: 'sequence',
            priority: 12,
            steps: [
                { anim: 'player.dash', wait: false },
                { delay: 100 },
                { anim: 'player.attack', wait: true, callback: 'onHit', callbackArg: 0 },
                { delay: 50 },
                { anim: 'player.dashReturn', wait: true }
            ]
        });
        
        // 🛡️ 방어
        this.register('card.defend', {
            target: 'player',
            type: 'sequence',
            priority: 5,
            steps: [
                { anim: 'player.defend', wait: true, callback: 'onComplete' }
            ]
        });
        
        console.log('[AnimationSystem] ✅ 카드 애니메이션 등록 완료');
    },
    
    // ==========================================
    // 애니메이션 등록
    // ==========================================
    register(name, definition) {
        this.registry[name] = {
            name,
            ...definition,
            registered: Date.now()
        };
        
        if (this.config.debug) {
            console.log(`[AnimationSystem] 📝 등록: ${name}`);
        }
    },
    
    // ==========================================
    // 애니메이션 존재 확인
    // ==========================================
    has(name) {
        return this.registry[name] !== undefined;
    },
    
    // ==========================================
    // 애니메이션 가져오기
    // ==========================================
    get(name) {
        return this.registry[name] || null;
    },
    
    // ==========================================
    // 등록된 모든 애니메이션 목록
    // ==========================================
    list() {
        return Object.keys(this.registry).sort();
    },
    
    // ==========================================
    // 애니메이션 재생 (메인 API)
    // ==========================================
    play(name, options = {}) {
        const anim = this.get(name);
        if (!anim) {
            console.warn(`[AnimationSystem] ⚠️ 애니메이션 없음: ${name}`);
            return Promise.resolve();
        }
        
        const {
            target = null,      // 타겟 객체 (enemy 등)
            targetEl = null,    // 타겟 DOM
            sprite = null,      // 직접 스프라이트 지정
            container = null,   // 직접 컨테이너 지정
            onHit = null,       // 히트 콜백
            onComplete = null,  // 완료 콜백
            callbacks = {}      // 추가 콜백들
        } = options;
        
        // 콜백 통합
        const allCallbacks = {
            onHit,
            onComplete,
            ...callbacks
        };
        
        console.log(`[AnimationSystem] ▶️ 재생: ${name}`);
        
        // 타입별 처리
        switch (anim.type) {
            case 'sequence':
                return this.playSequence(anim, { target, targetEl, sprite, container, callbacks: allCallbacks });
            case 'loop':
                return this.playLoop(anim, { target, targetEl, sprite, container });
            case 'once':
            default:
                return this.playOnce(anim, { target, targetEl, sprite, container, callbacks: allCallbacks });
        }
    },
    
    // ==========================================
    // 단일 애니메이션 재생
    // ==========================================
    playOnce(anim, options = {}) {
        return new Promise((resolve) => {
            const { sprite, container, callbacks } = options;
            
            // 스프라이트/컨테이너 찾기
            const { s, c } = this.resolveTarget(anim.target, options);
            if (!s && !c) {
                console.warn(`[AnimationSystem] 타겟 없음: ${anim.target}`);
                resolve();
                return;
            }
            
            const targetSprite = sprite || s;
            const targetContainer = container || c;
            
            // 기존 애니메이션 중지
            this.stopAnimation(anim.target, anim.name);
            
            // 애니메이션 ID 생성
            const animId = `${anim.name}_${Date.now()}`;
            
            // 키프레임 → GSAP 타임라인
            if (typeof gsap !== 'undefined' && anim.keyframes) {
                const tl = gsap.timeline({
                    onComplete: () => {
                        this.activeAnimations.delete(animId);
                        if (callbacks?.onComplete) callbacks.onComplete();
                        resolve();
                    }
                });
                
                this.activeAnimations.set(animId, {
                    name: anim.name,
                    timeline: tl,
                    target: anim.target
                });
                
                let elapsed = 0;
                anim.keyframes.forEach((frame, index) => {
                    if (index === 0) return; // 첫 프레임은 초기값
                    
                    const props = { ...frame };
                    const duration = (props.duration || 100) / 1000;
                    delete props.duration;
                    
                    // tint 처리
                    if (props.tint !== undefined && targetSprite) {
                        const tintValue = props.tint;
                        delete props.tint;
                        tl.to(targetSprite, {
                            onStart: () => { targetSprite.tint = tintValue; }
                        }, elapsed);
                    }
                    
                    // 스케일 처리
                    if (props.scaleX !== undefined || props.scaleY !== undefined) {
                        const scaleProps = {};
                        if (props.scaleX !== undefined) { scaleProps.x = props.scaleX; delete props.scaleX; }
                        if (props.scaleY !== undefined) { scaleProps.y = props.scaleY; delete props.scaleY; }
                        if (props.scale !== undefined) { scaleProps.x = props.scale; scaleProps.y = props.scale; delete props.scale; }
                        
                        if (targetContainer?.scale) {
                            tl.to(targetContainer.scale, {
                                ...scaleProps,
                                duration,
                                ease: anim.ease || this.config.defaultEase
                            }, elapsed);
                        }
                    }
                    
                    // 위치/회전 처리
                    if (Object.keys(props).length > 0 && targetSprite) {
                        tl.to(targetSprite, {
                            ...props,
                            duration,
                            ease: anim.ease || this.config.defaultEase
                        }, elapsed);
                    }
                    
                    elapsed += duration;
                });
            } else {
                // GSAP 없으면 바로 완료
                if (callbacks?.onComplete) callbacks.onComplete();
                resolve();
            }
        });
    },
    
    // ==========================================
    // 시퀀스 애니메이션 재생
    // ==========================================
    async playSequence(anim, options = {}) {
        const { callbacks } = options;
        
        console.log(`[AnimationSystem] 🎬 시퀀스 시작: ${anim.name}`);
        
        for (let i = 0; i < anim.steps.length; i++) {
            const step = anim.steps[i];
            
            // 딜레이
            if (step.delay) {
                await this.delay(step.delay);
                continue;
            }
            
            // 서브 애니메이션 재생
            if (step.anim) {
                const promise = this.play(step.anim, options);
                
                // 콜백 실행
                if (step.callback && callbacks && callbacks[step.callback]) {
                    // 애니메이션 시작 직후 콜백 (동기화용)
                    setTimeout(() => {
                        callbacks[step.callback](step.callbackArg);
                    }, 30); // VFX 동기화용 약간의 딜레이
                }
                
                if (step.wait) {
                    await promise;
                }
            }
        }
        
        console.log(`[AnimationSystem] ✅ 시퀀스 완료: ${anim.name}`);
        
        if (callbacks?.onComplete) {
            callbacks.onComplete();
        }
    },
    
    // ==========================================
    // 루프 애니메이션 재생
    // ==========================================
    playLoop(anim, options = {}) {
        const { s: targetSprite, c: targetContainer } = this.resolveTarget(anim.target, options);
        if (!targetSprite && !targetContainer) return Promise.resolve();
        
        const animId = `${anim.name}_loop`;
        
        // 기존 루프 중지
        this.stopAnimation(anim.target, animId);
        
        if (typeof gsap !== 'undefined' && anim.keyframes?.length >= 2) {
            const target = targetContainer?.scale || targetSprite;
            if (!target) return Promise.resolve();
            
            const tl = gsap.timeline({ repeat: -1, yoyo: true });
            
            anim.keyframes.forEach((frame, i) => {
                if (i === 0) return;
                const duration = (frame.duration || 1000) / 1000;
                tl.to(target, {
                    x: frame.scale || 1,
                    y: frame.scale || 1,
                    duration,
                    ease: 'sine.inOut'
                });
            });
            
            this.activeAnimations.set(animId, {
                name: anim.name,
                timeline: tl,
                target: anim.target,
                isLoop: true
            });
        }
        
        return Promise.resolve();
    },
    
    // ==========================================
    // 타겟 해석
    // ==========================================
    resolveTarget(targetType, options = {}) {
        let s = options.sprite;
        let c = options.container;
        
        if (s && c) return { s, c };
        
        // 타겟 타입별 처리
        if (targetType === 'player') {
            if (typeof PlayerRenderer !== 'undefined' && PlayerRenderer.initialized) {
                s = s || PlayerRenderer.sprite;
                c = c || PlayerRenderer.playerContainer;
            }
        } else if (targetType === 'enemy' && options.target) {
            if (typeof EnemyRenderer !== 'undefined' && EnemyRenderer.enabled) {
                const data = EnemyRenderer.sprites.get(options.target.pixiId || options.target.id);
                if (data) {
                    s = s || data.sprite;
                    c = c || data.container;
                }
            }
        }
        
        return { s, c };
    },
    
    // ==========================================
    // 애니메이션 중지
    // ==========================================
    stopAnimation(targetType, nameOrId = null) {
        const toRemove = [];
        
        this.activeAnimations.forEach((anim, id) => {
            if (anim.target === targetType) {
                if (!nameOrId || id.startsWith(nameOrId) || anim.name === nameOrId) {
                    if (anim.timeline) {
                        anim.timeline.kill();
                    }
                    toRemove.push(id);
                }
            }
        });
        
        toRemove.forEach(id => this.activeAnimations.delete(id));
    },
    
    // ==========================================
    // 모든 애니메이션 중지
    // ==========================================
    stopAll() {
        this.activeAnimations.forEach((anim) => {
            if (anim.timeline) {
                anim.timeline.kill();
            }
        });
        this.activeAnimations.clear();
        console.log('[AnimationSystem] ⏹️ 모든 애니메이션 중지');
    },
    
    // ==========================================
    // 딜레이 헬퍼
    // ==========================================
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // ==========================================
    // 디버그 정보
    // ==========================================
    getDebugInfo() {
        return {
            registered: Object.keys(this.registry).length,
            active: this.activeAnimations.size,
            animations: this.list(),
            activeList: Array.from(this.activeAnimations.keys())
        };
    }
};

// 전역 노출
window.AnimationSystem = AnimationSystem;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    AnimationSystem.init();
});

// 즉시 실행 (이미 로드된 경우)
if (document.readyState !== 'loading') {
    AnimationSystem.init();
}

