// =====================================================
// UnitSprite - 유닛 스프라이트 생성 및 애니메이션 관리
// 
// ★ 유닛 컨테이너 구조:
// unit.container (최상위, 위치 관리, scale=1 고정)
//   ├── unit.sprite (스프라이트, 스케일 애니메이션 적용)
//   ├── unit.hpBar (HP 바, 스케일 영향 없음)
//   └── unit.intentContainer (인텐트, 스케일 영향 없음)
// 
// 이 구조로 스프라이트 스케일이 변해도 HP바/인텐트는 영향받지 않음!
// =====================================================

const UnitSprite = {
    // ==================== 설정 ====================
    config: {
        // 스폰 애니메이션 설정
        spawn: {
            offsetX: 200,           // 화면 밖 시작 거리
            offsetY: 50,            // Y축 시작 오프셋
            initialScale: 0.5,      // 시작 스케일 비율
            duration: {
                fadeIn: 0.1,
                stretch: 0.15,
                move: 0.25,
                squash: 0.08,
                bounce: 0.15
            },
            squash: {
                x: 0.9,             // 착지 시 X 스케일
                y: 1.15             // 착지 시 Y 스케일
            },
            stretch: {
                x: 1.1,             // 등장 시 X 스케일
                y: 0.9              // 등장 시 Y 스케일
            }
        },
        
        // 숨쉬기 애니메이션 설정
        breathing: {
            scaleAmount: 0.025,     // Y 스케일 변화량 (2.5%)
            duration: 2.5           // 한 사이클 시간 (초)
        }
    },
    
    // ==================== 유닛 컨테이너 생성 ====================
    /**
     * 유닛 전체 컨테이너 생성 (스프라이트 + UI)
     * @param {string} imagePath - 이미지 경로
     * @param {number} scale - 스프라이트 목표 스케일
     * @returns {Promise<Object>} { container, sprite, baseScale }
     * 
     * ★ 반환 구조:
     * - container: 최상위 컨테이너 (위치 관리, scale=1 고정)
     * - sprite: 스프라이트 래퍼 (스케일 애니메이션 적용)
     * - baseScale: 기본 스케일 값
     */
    async createUnit(imagePath, scale = 1) {
        if (typeof DDOORenderer === 'undefined') {
            console.error('[UnitSprite] DDOORenderer not found!');
            return null;
        }
        
        // 1. 최상위 컨테이너 (위치만 관리, scale=1 고정!)
        const container = new PIXI.Container();
        container.sortableChildren = true;
        container.label = 'unit-container';
        
        // 2. 스프라이트 생성 (스케일 적용될 부분)
        const sprite = await DDOORenderer.createSprite(imagePath, {
            scale: 1,                           // 내부 스프라이트 = 1:1
            outline: { enabled: false },
            shadow: { enabled: false },
            breathing: { enabled: false }       // 수동으로 시작
        });
        
        if (!sprite) return null;
        
        // 스프라이트를 컨테이너의 자식으로 추가
        sprite.zIndex = 10;
        sprite.label = 'sprite-wrapper';
        container.addChild(sprite);
        
        // 기본 스케일 저장
        sprite.baseScale = scale;
        container.baseScale = scale;  // 호환성용
        
        // 초기 스케일 설정
        sprite.scale.set(scale);
        
        console.log(`[UnitSprite] ✅ 유닛 생성: ${imagePath}, baseScale=${scale}`);
        
        return { container, sprite, baseScale: scale };
    },
    
    // ==================== 레거시: 단일 스프라이트 생성 ====================
    /**
     * @deprecated createUnit() 사용 권장
     * 기존 코드 호환용
     */
    async create(imagePath, scale = 1) {
        const result = await this.createUnit(imagePath, scale);
        if (!result) return null;
        
        // 레거시: container를 sprite처럼 반환
        // 기존 코드가 unit.sprite로 접근하므로
        const { container, sprite } = result;
        container._spriteWrapper = sprite;
        container.baseScale = scale;
        
        return container;
    },
    
    // ==================== 스폰 애니메이션 ====================
    /**
     * 스폰 애니메이션 재생
     * @param {Object} unit - 유닛 객체 { container, sprite } 또는 레거시 sprite
     * @param {Object} options - 옵션
     */
    playSpawnAnimation(unit, options = {}) {
        // 레거시 지원: unit이 container인 경우
        const container = unit.container || unit;
        const sprite = unit.sprite || unit._spriteWrapper || container;
        
        if (!container || typeof gsap === 'undefined') {
            return Promise.resolve();
        }
        
        const {
            targetX = container.x,
            targetY = container.y,
            direction = 'left',
            showEffect = true
        } = options;
        
        const cfg = this.config.spawn;
        const baseScale = sprite.baseScale || container.baseScale || 1;
        
        // 시작 위치 설정 (컨테이너 위치)
        const spawnOffsetX = direction === 'right' ? cfg.offsetX : -cfg.offsetX;
        container.x = targetX + spawnOffsetX;
        container.y = targetY + cfg.offsetY;
        container.alpha = 0;
        container.zIndex = Math.floor(targetY);
        
        // 스프라이트 스케일 (작게 시작)
        sprite.scale.set(baseScale * cfg.initialScale);
        
        return new Promise(resolve => {
            const tl = gsap.timeline({
                onComplete: () => {
                    // 스폰 완료 - 스케일 확정 및 숨쉬기 시작
                    if (sprite && !sprite.destroyed) {
                        sprite.scale.set(baseScale);
                        this.startBreathing(sprite);
                    }
                    resolve();
                }
            });
            
            // 1. 페이드 인
            tl.to(container, { alpha: 1, duration: cfg.duration.fadeIn });
            
            // 2. 스프라이트 스트레치
            tl.to(sprite.scale, {
                x: baseScale * cfg.stretch.x,
                y: baseScale * cfg.stretch.y,
                duration: cfg.duration.stretch
            }, '<');
            
            // 3. 컨테이너 이동
            tl.to(container, {
                x: targetX,
                y: targetY,
                duration: cfg.duration.move,
                ease: 'power2.out'
            }, '<');
            
            // 4. 착지 스쿼시
            tl.to(sprite.scale, {
                x: baseScale * cfg.squash.x,
                y: baseScale * cfg.squash.y,
                duration: cfg.duration.squash
            });
            
            // 5. 바운스 복귀
            tl.to(sprite.scale, {
                x: baseScale,
                y: baseScale,
                duration: cfg.duration.bounce,
                ease: 'elastic.out(1, 0.5)'
            });
        }).then(() => {
            // 소환 이펙트
            if (showEffect && typeof CombatEffects !== 'undefined') {
                CombatEffects.summonEffect(targetX, targetY);
                CombatEffects.screenShake(5, 100);
            }
        });
    },
    
    // ==================== 숨쉬기 애니메이션 ====================
    /**
     * 숨쉬기 애니메이션 시작
     * @param {PIXI.Container} sprite - 스프라이트 래퍼
     */
    startBreathing(sprite) {
        if (!sprite || sprite.destroyed || typeof gsap === 'undefined') return;
        
        // 기존 숨쉬기 중지
        this.stopBreathing(sprite);
        
        const baseScale = sprite.baseScale || sprite.scale?.x || 1;
        const cfg = this.config.breathing;
        
        // 숨쉬기 트윈 생성
        sprite._breathingTween = gsap.to(sprite.scale, {
            y: baseScale * (1 + cfg.scaleAmount),
            duration: cfg.duration,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    },
    
    /**
     * 숨쉬기 애니메이션 중지
     * @param {PIXI.Container} sprite - 스프라이트 래퍼
     */
    stopBreathing(sprite) {
        if (!sprite) return;
        
        if (sprite._breathingTween) {
            sprite._breathingTween.kill();
            sprite._breathingTween = null;
        }
    },
    
    // ==================== 스케일 관리 ====================
    /**
     * 스케일을 기본값으로 복원
     * @param {PIXI.Container} sprite - 스프라이트 래퍼
     * @param {boolean} animated - 애니메이션 사용 여부
     */
    restoreScale(sprite, animated = false) {
        if (!sprite || sprite.destroyed) return;
        
        const baseScale = sprite.baseScale || 1;
        
        if (animated && typeof gsap !== 'undefined') {
            gsap.to(sprite.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.2,
                ease: 'power2.out'
            });
        } else {
            sprite.scale.set(baseScale);
        }
    },
    
    /**
     * 기본 스케일 가져오기
     * @param {Object} unit - 유닛 객체 또는 스프라이트
     * @returns {number} 기본 스케일
     */
    getBaseScale(unit) {
        if (!unit) return 1;
        // unit.sprite.baseScale > unit.baseScale > unit.scale.x
        const sprite = unit.sprite || unit._spriteWrapper || unit;
        return sprite?.baseScale || unit?.baseScale || sprite?.scale?.x || 1;
    },
    
    /**
     * 스프라이트 스케일 설정 (baseScale 기준)
     * @param {PIXI.Container} sprite - 스프라이트 래퍼
     * @param {number} multiplier - 스케일 배율 (1 = 100%)
     */
    setScale(sprite, multiplier = 1) {
        if (!sprite || sprite.destroyed) return;
        
        const baseScale = sprite.baseScale || 1;
        sprite.scale.set(baseScale * multiplier);
    },
    
    // ==================== UI 헬퍼 (HP 바, 인텐트) ====================
    /**
     * HP 바를 유닛 컨테이너에 추가
     * ★ container의 자식으로 추가되어 sprite 스케일 영향 없음!
     * @param {PIXI.Container} container - 유닛 컨테이너
     * @param {PIXI.Container} hpBar - HP 바
     * @param {number} offsetY - Y 오프셋 (양수 = 아래)
     */
    addHPBar(container, hpBar, offsetY = 5) {
        if (!container || !hpBar) return;
        
        hpBar.y = offsetY;
        hpBar.zIndex = 50;
        // ★ 스케일 역보정 불필요! container는 scale=1 고정!
        container.addChild(hpBar);
    },
    
    /**
     * 인텐트를 유닛 컨테이너에 추가
     * ★ container의 자식으로 추가되어 sprite 스케일 영향 없음!
     * @param {PIXI.Container} container - 유닛 컨테이너
     * @param {PIXI.Container} intent - 인텐트 컨테이너
     * @param {number} spriteHeight - 스프라이트 높이
     * @param {number} margin - 마진
     */
    addIntent(container, intent, spriteHeight = 60, margin = 8) {
        if (!container || !intent) return;
        
        intent.y = -spriteHeight - margin;
        intent.zIndex = 100;
        // ★ 스케일 역보정 불필요! container는 scale=1 고정!
        container.addChild(intent);
    },
    
    // ==================== 레거시 역보정 (호환용) ====================
    /**
     * @deprecated 새 구조에서는 불필요
     */
    getInverseScale(container) {
        if (!container) return 1;
        const containerScale = container.scale?.x || container.baseScale || 1;
        return containerScale !== 0 ? (1 / containerScale) : 1;
    },
    
    /**
     * @deprecated 새 구조에서는 불필요
     */
    applyInverseScale(uiElement, parentContainer) {
        if (!uiElement || !parentContainer) return;
        const inverseScale = this.getInverseScale(parentContainer);
        uiElement.scale.set(inverseScale);
    }
};

// 전역으로 노출
if (typeof window !== 'undefined') {
    window.UnitSprite = UnitSprite;
}
