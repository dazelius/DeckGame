// =====================================================
// Bleed System - 출혈 상태이상 시스템
// =====================================================
// 출혈: 피해를 받을 때마다 출혈 스택만큼 추가 피해
// 매 턴 종료 시 출혈 스택 1 감소
// =====================================================

const BleedSystem = {
    game: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        console.log('[BleedSystem] 출혈 시스템 초기화 완료');
    },
    
    // ==========================================
    // 출혈 부여
    // ==========================================
    applyBleed(target, stacks = 1) {
        if (!target || target.hp <= 0) return;
        
        const prevBleed = target.bleed || 0;
        target.bleed = prevBleed + stacks;
        
        console.log(`[Bleed] ${target.name || target.type}: ${prevBleed} → ${target.bleed} 출혈`);
        
        // VFX
        this.showBleedApplyEffect(target, stacks);
        
        // 플로터
        if (typeof CombatEffects !== 'undefined') {
            const pos = this.getUnitPosition(target);
            if (pos) {
                CombatEffects.showUnitFloater(target, `🩸+${stacks}`, '#cc0000');
            }
        }
        
        // UI 업데이트
        this.updateBleedUI(target);
    },
    
    // ==========================================
    // 출혈 피해 처리 (피해를 받을 때 호출)
    // ==========================================
    onDamageTaken(target, baseDamage) {
        if (!target || target.hp <= 0) return 0;
        
        const bleedStacks = target.bleed || 0;
        if (bleedStacks <= 0) return 0;
        
        console.log(`[Bleed] ${target.name || target.type}: 출혈 ${bleedStacks} 스택 → +${bleedStacks} 추가 피해!`);
        
        // 출혈 피해 VFX
        this.showBleedDamageEffect(target, bleedStacks);
        
        return bleedStacks;
    },
    
    // ==========================================
    // 턴 종료 시 출혈 감소
    // ==========================================
    onTurnEnd(units) {
        if (!units || !Array.isArray(units)) return;
        
        for (const unit of units) {
            if (!unit || unit.hp <= 0) continue;
            
            const prevBleed = unit.bleed || 0;
            if (prevBleed > 0) {
                unit.bleed = Math.max(0, prevBleed - 1);
                console.log(`[Bleed] ${unit.name || unit.type}: 턴 종료 - 출혈 ${prevBleed} → ${unit.bleed}`);
                
                // 출혈 감소 플로터
                if (typeof CombatEffects !== 'undefined') {
                    CombatEffects.showUnitFloater(unit, `🩸-1`, '#880000');
                }
                
                // UI 업데이트
                this.updateBleedUI(unit);
            }
        }
    },
    
    // ==========================================
    // 출혈 스택 확인
    // ==========================================
    getBleedStacks(target) {
        return target?.bleed || 0;
    },
    
    // ==========================================
    // 출혈 제거
    // ==========================================
    clearBleed(target) {
        if (!target) return;
        target.bleed = 0;
        this.updateBleedUI(target);
    },
    
    // ==========================================
    // 출혈 부여 VFX
    // ==========================================
    showBleedApplyEffect(target, stacks) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        const pos = this.getUnitPosition(target);
        if (!pos) return;
        
        // 피 방울 파티클
        for (let i = 0; i < 5 + stacks * 2; i++) {
            const drop = new PIXI.Graphics();
            drop.circle(0, 0, 3 + Math.random() * 4);
            drop.fill({ color: 0xcc0000, alpha: 0.9 });
            
            drop.x = pos.x + (Math.random() - 0.5) * 40;
            drop.y = pos.y - 40;
            drop.zIndex = 200;
            CombatEffects.container.addChild(drop);
            
            gsap.to(drop, {
                y: drop.y + 60 + Math.random() * 40,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.in',
                onComplete: () => { if (!drop.destroyed) drop.destroy(); }
            });
        }
        
        // 빨간 플래시
        if (target.sprite && !target.sprite.destroyed) {
            gsap.to(target.sprite, {
                tint: 0xff4444,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    if (target.sprite && !target.sprite.destroyed) {
                        target.sprite.tint = 0xffffff;
                    }
                }
            });
        }
    },
    
    // ==========================================
    // 출혈 피해 VFX
    // ==========================================
    showBleedDamageEffect(target, bleedDamage) {
        if (typeof CombatEffects === 'undefined' || !CombatEffects.container) return;
        
        const pos = this.getUnitPosition(target);
        if (!pos) return;
        
        // 출혈 대미지 숫자 (빨간색, 약간 지연)
        setTimeout(() => {
            CombatEffects.showDamageNumber(
                pos.x + 30,
                pos.y - 60,
                bleedDamage,
                'bleed'
            );
        }, 100);
        
        // 피 튀김 효과
        for (let i = 0; i < 8; i++) {
            const blood = new PIXI.Graphics();
            blood.circle(0, 0, 2 + Math.random() * 3);
            blood.fill({ color: 0xaa0000, alpha: 0.8 });
            
            blood.x = pos.x;
            blood.y = pos.y - 30;
            blood.zIndex = 200;
            CombatEffects.container.addChild(blood);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 60;
            
            gsap.to(blood, {
                x: blood.x + Math.cos(angle) * speed,
                y: blood.y + Math.sin(angle) * speed + 30,
                alpha: 0,
                duration: 0.4,
                ease: 'power2.out',
                onComplete: () => { if (!blood.destroyed) blood.destroy(); }
            });
        }
    },
    
    // ==========================================
    // 출혈 UI 업데이트 (인디케이터)
    // ==========================================
    updateBleedUI(target) {
        // ★ StatusIndicator 시스템으로 업데이트
        if (typeof StatusIndicator !== 'undefined') {
            StatusIndicator.updateUnit(target);
        }
    },
    
    // ==========================================
    // 헬퍼: 유닛 위치 가져오기
    // ==========================================
    getUnitPosition(unit) {
        const target = unit?.container || unit?.sprite;
        return target ? { x: target.x, y: target.y } : null;
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.BleedSystem = BleedSystem;
}

console.log('[BleedSystem] 출혈 시스템 로드 완료');
