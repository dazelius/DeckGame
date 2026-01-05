// =====================================================
// DDOO Animation System - 애니메이션 재생/시퀀스
// =====================================================

const DDOOAnimation = {
    // ==================== 상태 ====================
    initialized: false,
    config: null,
    
    // 애니메이션 캐시
    animCache: new Map(),
    
    // 현재 재생 상태
    currentTarget: null,
    
    // ==================== 초기화 ====================
    init(config = {}) {
        if (this.initialized) return this;
        
        this.config = config;
        
        // 애니메이션 데이터 로드
        this.loadAllAnimations();
        
        this.initialized = true;
        console.log('[DDOOAnimation] ✅ 애니메이션 시스템 초기화 완료');
        
        return this;
    },
    
    // ==================== 애니메이션 로드 ====================
    async loadAllAnimations() {
        // 번들에서 로드 시도
        if (typeof ANIM_BUNDLE !== 'undefined') {
            for (const [id, data] of Object.entries(ANIM_BUNDLE)) {
                this.animCache.set(id, data);
            }
            console.log(`[DDOOAnimation] 번들에서 ${this.animCache.size}개 애니메이션 로드`);
            return;
        }
        
        // 개별 파일 로드
        try {
            const res = await fetch('anim/index.json');
            const index = await res.json();
            const files = index.files || [];
            
            for (const id of files) {
                try {
                    const animRes = await fetch(`anim/${id}.json`);
                    if (animRes.ok) {
                        this.animCache.set(id, await animRes.json());
                    }
                } catch (e) {
                    // 무시
                }
            }
            console.log(`[DDOOAnimation] ${this.animCache.size}개 애니메이션 로드 완료`);
        } catch (e) {
            console.warn('[DDOOAnimation] 애니메이션 로드 실패');
        }
    },
    
    // ==================== 메인 재생 API ====================
    async play(animId, options = {}) {
        // 배열이면 랜덤 선택
        let actualAnimId = animId;
        if (Array.isArray(animId)) {
            actualAnimId = animId[Math.floor(Math.random() * animId.length)];
        }
        
        const data = this.animCache.get(actualAnimId);
        if (!data) {
            console.warn(`[DDOOAnimation] 애니메이션 없음: ${actualAnimId}`);
            return null;
        }
        
        const { container, sprite, baseX, baseY, dir = 1 } = options;
        
        if (!container || !sprite) {
            console.warn('[DDOOAnimation] container와 sprite 필요');
            return null;
        }
        
        // 원점 저장
        const originX = baseX ?? container.x;
        const originY = baseY ?? container.y;
        
        // 카메라/이펙트 리셋
        if (typeof DDOOCamera !== 'undefined') {
            DDOOCamera.resetAll(false);
        }
        
        // 시퀀스 타입
        if (data.type === 'sequence' && data.steps) {
            return this.playSequence(data, { ...options, originX, originY });
        }
        
        // 단일 애니메이션
        return this.playKeyframes(data, { ...options, originX, originY });
    },
    
    // ==================== 시퀀스 재생 ====================
    async playSequence(data, options) {
        const { container, sprite, originX, originY, dir = 1, onComplete } = options;
        
        try {
            for (const step of data.steps) {
                // 딜레이
                if (step.delay && !step.anim) {
                    await this.delay(step.delay);
                    continue;
                }
                
                // 이벤트만
                if (!step.anim) {
                    await this.processStepEvents(step, options);
                    continue;
                }
                
                // 애니메이션 재생
                let animId = step.anim;
                if (Array.isArray(step.anim)) {
                    animId = step.anim[Math.floor(Math.random() * step.anim.length)];
                }
                
                const animData = this.animCache.get(animId);
                if (!animData) continue;
                
                if (step.delay) {
                    await this.delay(step.delay);
                }
                
                const promise = this.playKeyframes(animData, {
                    ...options,
                    isRelative: true,
                    stepEvents: step
                });
                
                if (step.wait) {
                    await promise;
                }
                
                await this.processStepEvents(step, options);
            }
        } catch (e) {
            console.error(`[DDOOAnimation] 시퀀스 에러:`, e);
        }
        
        // 원점 복귀
        if (data.returnToBase !== false) {
            await this.returnToOrigin(container, sprite, originX, originY);
        }
        
        // 카메라/이펙트 리셋
        if (typeof DDOOCamera !== 'undefined') {
            DDOOCamera.resetAll();
        }
        
        if (onComplete) onComplete();
    },
    
    // ==================== 키프레임 재생 ====================
    async playKeyframes(data, options) {
        const { container, sprite, originX, originY, dir = 1, isRelative = false } = options;
        
        if (!container || !sprite) return;
        
        const keyframes = data.keyframes || [];
        if (keyframes.length === 0) return;
        
        for (const kf of keyframes) {
            await this.applyKeyframe(kf, container, sprite, originX, originY, dir, isRelative, options);
        }
    },
    
    async applyKeyframe(kf, container, sprite, originX, originY, dir, isRelative, options) {
        const duration = (kf.duration || 100) / 1000;
        const ease = kf.ease || 'power2.out';
        
        // 타겟 위치 계산
        let targetX = isRelative ? container.x : originX;
        let targetY = isRelative ? container.y : originY;
        
        if (kf.x !== undefined) targetX += kf.x * dir;
        if (kf.y !== undefined) targetY += kf.y;
        
        // 컨테이너 이동
        if (kf.x !== undefined || kf.y !== undefined) {
            if (typeof gsap !== 'undefined') {
                await new Promise(resolve => {
                    gsap.to(container, {
                        x: targetX,
                        y: targetY,
                        duration,
                        ease,
                        onComplete: resolve
                    });
                });
            }
        }
        
        // 스프라이트 변환
        const transforms = {};
        if (kf.scaleX !== undefined) transforms.scaleX = kf.scaleX;
        if (kf.scaleY !== undefined) transforms.scaleY = kf.scaleY;
        if (kf.rotation !== undefined) transforms.rotation = kf.rotation * (Math.PI / 180) * dir;
        if (kf.alpha !== undefined) transforms.alpha = kf.alpha;
        
        if (Object.keys(transforms).length > 0 && typeof gsap !== 'undefined') {
            const target = {};
            if (transforms.scaleX !== undefined || transforms.scaleY !== undefined) {
                target.x = transforms.scaleX ?? sprite.scale.x;
                target.y = transforms.scaleY ?? sprite.scale.y;
                gsap.to(sprite.scale, { ...target, duration, ease });
            }
            if (transforms.rotation !== undefined) {
                gsap.to(sprite, { rotation: transforms.rotation, duration, ease });
            }
            if (transforms.alpha !== undefined) {
                gsap.to(sprite, { alpha: transforms.alpha, duration, ease });
            }
        }
        
        // 이벤트 처리
        await this.processKeyframeEvents(kf, options);
    },
    
    // ==================== 이벤트 처리 ====================
    async processKeyframeEvents(kf, options) {
        // VFX 트리거
        if (kf.vfx && typeof DDOOVfx !== 'undefined') {
            const vfxX = options.container.x + (kf.vfxOffsetX || 0) * (options.dir || 1);
            const vfxY = options.container.y + (kf.vfxOffsetY || 0);
            DDOOVfx.trigger(kf.vfx, vfxX, vfxY, { dir: options.dir });
        }
        
        // 히트스탑
        if (kf.hitstop && typeof DDOOCamera !== 'undefined') {
            await DDOOCamera.slowmoImpact(0.1, kf.hitstop, 200);
        }
        
        // 스크린쉐이크
        if (kf.shake && typeof DDOOCamera !== 'undefined') {
            DDOOCamera.shake(kf.shake);
        }
        
        // 카메라 줌
        if (kf.zoom && typeof DDOOCamera !== 'undefined') {
            DDOOCamera.zoom(kf.zoom, kf.zoomDuration || 200);
        }
        
        // 카메라 포커스
        if (kf.focus && typeof DDOOCamera !== 'undefined') {
            DDOOCamera.focus(kf.focus, kf.focusDuration || 150);
        }
        
        // 컬러 그레이딩
        if (kf.colorGrade && typeof DDOOCamera !== 'undefined') {
            DDOOCamera.applyColorGrade(kf.colorGrade, kf.colorGradeDuration || 150);
        }
        
        // 잔상
        if (kf.afterimage && typeof DDOOCharacter !== 'undefined') {
            const charId = options.charId || 'player';
            DDOOCharacter.createAfterimage(charId, { 
                alpha: 0.5, 
                tint: 0x60a5fa,
                life: 300
            });
        }
        
        // 히트 콜백
        if (kf.hit && options.onHit) {
            options.onHit();
        }
        
        // 대미지 콜백
        if (kf.damage !== undefined && options.onDamage) {
            options.onDamage(kf.damage, kf.target || 'enemy');
        }
    },
    
    async processStepEvents(step, options) {
        if (step.damage !== undefined && options.onDamage) {
            options.onDamage(step.damage, step.target || 'enemy');
        }
        if (step.buff && options.onBuff) {
            options.onBuff(step.buff.name, step.buff.value, step.buff.target);
        }
        if (step.debuff && options.onDebuff) {
            options.onDebuff(step.debuff.name, step.debuff.value, step.debuff.target);
        }
        if (step.event && options.onEvent) {
            options.onEvent(step.event);
        }
    },
    
    // ==================== 원점 복귀 ====================
    async returnToOrigin(container, sprite, originX, originY) {
        if (!container || !sprite) return;
        
        const returnConfig = this.config.return || {};
        const duration = (returnConfig.duration || 250) / 1000;
        const ease = returnConfig.ease || 'power2.inOut';
        
        return new Promise(resolve => {
            if (typeof gsap !== 'undefined') {
                gsap.to(container, {
                    x: originX,
                    y: originY,
                    duration,
                    ease,
                    onComplete: () => {
                        if (sprite.parent) {
                            sprite.alpha = 1;
                            sprite.rotation = 0;
                            if (sprite.scale) sprite.scale.set(1, 1);
                        }
                        resolve();
                    }
                });
                
                if (sprite.scale) {
                    gsap.to(sprite.scale, { x: 1, y: 1, duration, ease });
                }
                gsap.to(sprite, { rotation: 0, alpha: 1, duration, ease });
            } else {
                container.x = originX;
                container.y = originY;
                resolve();
            }
        });
    },
    
    // ==================== 유틸리티 ====================
    delay(ms) {
        const speed = this.config.engine?.speed || 1.0;
        return new Promise(resolve => setTimeout(resolve, ms / speed));
    },
    
    // ==================== 통계 ====================
    getStats() {
        return {
            animations: this.animCache.size
        };
    },
    
    destroy() {
        this.animCache.clear();
        this.initialized = false;
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOOAnimation = DDOOAnimation;
}

console.log('[DDOOAnimation] 🎬 애니메이션 모듈 로드됨');
