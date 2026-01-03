// ==========================================
// Shadow Deck - 카드 애니메이션 시스템 v2.0
// DDOOAction 엔진과 완전 통합
// ==========================================

const CardAnimations = {
    // 등록된 애니메이션 목록
    registry: {},
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        console.log('[CardAnimations] 카드 애니메이션 시스템 v2.0 초기화');
        this.registerAnimations();
    },
    
    // ==========================================
    // 애니메이션 등록
    // ==========================================
    registerAnimations() {
        // 모든 카드 애니메이션은 DDOOAction JSON을 통해 정의됨
        const cardAnimations = [
            { id: 'strike', name: '베기', jsonId: 'card.strike' },
            { id: 'bash', name: '강타', jsonId: 'card.bash' },
            { id: 'flurry', name: '연속 찌르기', jsonId: 'card.flurry' },
            { id: 'flurryP', name: '연속 찌르기+', jsonId: 'card.flurryP' },
            { id: 'dirtyStrike', name: '비열한 일격', jsonId: 'card.dirtystrike' },
            { id: 'dirtyStrikeP', name: '비열한 일격+', jsonId: 'card.dirtystrikeP' },
            { id: 'dodge', name: '닷지', jsonId: 'card.dodge' },
            { id: 'dodgeP', name: '닷지+', jsonId: 'card.dodge' },
            { id: 'dagger', name: '단검 투척', jsonId: 'card.dagger' },
            { id: 'battleOpening', name: '전투 개막', jsonId: 'card.battleopening' },
            { id: 'battleOpeningP', name: '전투 개막+', jsonId: 'card.battleopeningP' }
        ];
        
        cardAnimations.forEach(anim => {
            this.registry[anim.id] = {
                name: anim.name,
                execute: (options) => this.playDDOOAction(anim.jsonId, options)
            };
        });
        
        console.log('[CardAnimations] 등록된 애니메이션:', Object.keys(this.registry));
    },
    
    // ==========================================
    // 애니메이션 존재 확인
    // ==========================================
    has(animationId) {
        return this.registry.hasOwnProperty(animationId);
    },
    
    // ==========================================
    // 애니메이션 재생
    // ==========================================
    async play(animationId, options = {}) {
        if (!this.has(animationId)) {
            console.warn(`[CardAnimations] 등록되지 않은 애니메이션: ${animationId}`);
            return null;
        }
        
        return this.registry[animationId].execute(options);
    },
    
    // ==========================================
    // 🎮 DDOOAction 엔진으로 재생 (핵심!)
    // ==========================================
    async playDDOOAction(jsonId, options = {}) {
        const {
            target,         // 대상 적
            targetEl,       // 대상 DOM 요소
            damage,         // 기본 대미지 (JSON에서 오버라이드 가능)
            onHit,          // 히트 콜백
            onComplete      // 완료 콜백
        } = options;
        
        // DDOOAction 엔진 확인
        if (typeof DDOOAction === 'undefined' || !DDOOAction.initialized) {
            console.warn('[CardAnimations] DDOOAction 엔진 없음, 폴백 실행');
            return this.fallbackAnimation(options);
        }
        
        // PlayerRenderer 확인
        const playerContainer = typeof PlayerRenderer !== 'undefined' ? PlayerRenderer.playerContainer : null;
        const playerSprite = typeof PlayerRenderer !== 'undefined' ? PlayerRenderer.sprite : null;
        
        if (!playerContainer || !playerSprite) {
            console.warn('[CardAnimations] PlayerRenderer 없음, 폴백 실행');
            return this.fallbackAnimation(options);
        }
        
        // 원점 저장
        const baseX = playerContainer.x;
        const baseY = playerContainer.y;
        
        // 타격점 계산 함수
        const getHitPoint = () => {
            if (target && typeof EnemyRenderer !== 'undefined') {
                const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                if (enemyData) {
                    const bounds = enemyData.sprite.getBounds();
                    return {
                        x: enemyData.container.x,
                        y: enemyData.container.y - bounds.height / 2,
                        scale: enemyData.sprite.scale.x
                    };
                }
            }
            return { x: baseX + 200, y: baseY - 60, scale: 1 };
        };
        
        // 히트 카운터 (다중 히트 카드용)
        let hitCount = 0;
        
        try {
            await DDOOAction.play(jsonId, {
                container: playerContainer,
                sprite: playerSprite,
                baseX,
                baseY,
                dir: 1,
                getHitPoint,
                
                // 🎯 대미지 콜백 - JSON에서 정의된 타이밍에 호출됨!
                onDamage: (dmgValue, dmgTarget) => {
                    console.log(`[CardAnimations] 💥 대미지: ${dmgValue} → ${dmgTarget}`);
                    
                    // 히트 콜백 호출
                    if (onHit) {
                        onHit(hitCount++, dmgValue);
                    }
                    
                    // 적 피격 애니메이션
                    if (target && typeof EnemyRenderer !== 'undefined') {
                        EnemyRenderer.playHitAnimation(target.pixiId || target.id);
                    }
                    
                    // 실제 대미지 적용
                    if (target && typeof dealDamage === 'function') {
                        dealDamage(target, dmgValue);
                    }
                },
                
                // 🎯 버프 콜백
                onBuff: (buffName, buffValue, buffTarget) => {
                    console.log(`[CardAnimations] ✨ 버프: ${buffName} +${buffValue} → ${buffTarget}`);
                    
                    if (buffTarget === 'player') {
                        // 플레이어 버프
                        if (buffName === 'block' && typeof gainBlock === 'function') {
                            gainBlock(gameState?.player, buffValue);
                        } else if (buffName === 'strength' && gameState?.player) {
                            gameState.player.strength = (gameState.player.strength || 0) + buffValue;
                        }
                    }
                },
                
                // 🎯 디버프 콜백
                onDebuff: (debuffName, debuffValue, debuffTarget) => {
                    console.log(`[CardAnimations] 🔻 디버프: ${debuffName} +${debuffValue} → ${debuffTarget}`);
                    
                    if (debuffTarget === 'enemy' && target) {
                        if (debuffName === 'vulnerable') {
                            target.vulnerable = (target.vulnerable || 0) + debuffValue;
                        } else if (debuffName === 'weak') {
                            target.weak = (target.weak || 0) + debuffValue;
                        } else if (debuffName === 'poison') {
                            target.poison = (target.poison || 0) + debuffValue;
                        }
                    }
                },
                
                // 🎯 커스텀 이벤트 콜백
                onEvent: (eventData) => {
                    console.log(`[CardAnimations] 📢 이벤트:`, eventData);
                    
                    if (eventData.type === 'draw' && typeof drawCards === 'function') {
                        drawCards(eventData.value, true);
                    }
                },
                
                // 히트 마커 (VFX 타이밍용)
                onHit: (kf) => {
                    // 적 히트 플래시
                    if (target && typeof EnemyRenderer !== 'undefined') {
                        const enemyData = EnemyRenderer.sprites.get(target.pixiId || target.id);
                        if (enemyData?.sprite) {
                            // 플래시 효과
                            gsap.to(enemyData.sprite, {
                                tint: 0xffffff,
                                duration: 0.05,
                                onComplete: () => {
                                    gsap.to(enemyData.sprite, { tint: 0xffffff, duration: 0.1 });
                                }
                            });
                        }
                    }
                },
                
                // 완료 콜백
                onComplete: () => {
                    console.log(`[CardAnimations] ✅ ${jsonId} 완료`);
                    if (onComplete) onComplete();
                }
            });
            
        } catch (e) {
            console.error('[CardAnimations] 에러:', e);
            return this.fallbackAnimation(options);
        }
    },
    
    // ==========================================
    // 폴백 애니메이션 (DDOOAction 없을 때)
    // ==========================================
    fallbackAnimation(options = {}) {
        const { target, damage = 6, onHit, onComplete } = options;
        
        return new Promise((resolve) => {
            // 기본 공격 효과
            if (typeof EffectSystem !== 'undefined') {
                const playerEl = document.getElementById('player');
                const targetEl = options.targetEl || document.getElementById('enemy');
                
                EffectSystem.playerAttack(playerEl, targetEl, () => {
                    if (target && typeof dealDamage === 'function') {
                        dealDamage(target, damage);
                    }
                    if (onHit) onHit(0, damage);
                    if (onComplete) onComplete();
                    resolve();
                });
            } else {
                if (target && typeof dealDamage === 'function') {
                    dealDamage(target, damage);
                }
                if (onHit) onHit(0, damage);
                if (onComplete) onComplete();
                resolve();
            }
        });
    }
};

// 전역 노출
window.CardAnimations = CardAnimations;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    CardAnimations.init();
});

// 즉시 실행
if (document.readyState !== 'loading') {
    CardAnimations.init();
}
