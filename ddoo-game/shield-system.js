// =====================================================
// Shield System - 쉴드(블록) 시스템 일원화
// 플레이어/몬스터 공통으로 사용
// =====================================================

const ShieldSystem = {
    game: null,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        console.log('[ShieldSystem] 쉴드 시스템 초기화 완료');
    },
    
    // ==========================================
    // 쉴드 획득
    // ==========================================
    addShield(unit, amount, duration = 1) {
        if (!unit || amount <= 0) return;
        
        const prevBlock = this.getShield(unit);
        const newBlock = prevBlock + amount;
        
        // 쉴드 설정
        this.setShield(unit, newBlock);
        
        // 지속 턴 설정 (몬스터만)
        if (!unit.isHero) {
            unit.blockDuration = duration;
        }
        
        // UI 업데이트
        this.updateUI(unit);
        
        // 글로우 효과 추가
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.addShieldGlow(unit);
            CombatEffects.showBlockGain(unit, amount);
        }
        
        console.log(`[ShieldSystem] ${this.getUnitName(unit)}: +${amount} 쉴드 (총 ${newBlock})`);
    },
    
    // ==========================================
    // 쉴드로 피해 흡수
    // ==========================================
    absorbDamage(unit, damage) {
        if (!unit || damage <= 0) return { blocked: 0, remaining: damage };
        
        const currentShield = this.getShield(unit);
        if (currentShield <= 0) return { blocked: 0, remaining: damage };
        
        const blocked = Math.min(currentShield, damage);
        const remaining = damage - blocked;
        const newShield = currentShield - blocked;
        
        // 쉴드 설정
        this.setShield(unit, newShield);
        
        // UI 업데이트
        this.updateUI(unit);
        
        // 쉴드 피격 연출
        if (blocked > 0) {
            if (typeof HPBarSystem !== 'undefined') {
                HPBarSystem.showShieldHit(unit, blocked);
            }
            
            // ★ Three.js 3D 쉴드 타격 효과 (쉴드 없으면 자동 생성됨)
            if (typeof Shield3D !== 'undefined' && typeof THREE !== 'undefined') {
                const intensity = Math.min(2, blocked / 10);
                Shield3D.hitAtUnit(unit, intensity);
            }
        }
        
        // 쉴드 완전 파괴
        if (newShield === 0 && currentShield > 0) {
            this.onShieldBreak(unit, currentShield);
        }
        
        console.log(`[ShieldSystem] ${this.getUnitName(unit)}: ${blocked} 흡수, 남은 쉴드: ${newShield}`);
        
        return { blocked, remaining };
    },
    
    // ==========================================
    // 쉴드 파괴 처리
    // ==========================================
    onShieldBreak(unit, prevAmount) {
        console.log(`[ShieldSystem] ${this.getUnitName(unit)}: 쉴드 파괴!`);
        
        // 파괴 VFX
        if (typeof ShieldVFX !== 'undefined') {
            ShieldVFX.breakAtUnit(unit, prevAmount);
        }
        
        // 글로우 제거
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.removeShieldGlow(unit);
        }
    },
    
    // ==========================================
    // 쉴드 만료 (턴 종료 시)
    // ==========================================
    expireShield(unit) {
        const currentShield = this.getShield(unit);
        if (currentShield <= 0) return;
        
        // 몬스터: blockDuration 체크
        if (!unit.isHero) {
            if (unit.blockDuration !== undefined && unit.blockDuration > 0) {
                unit.blockDuration--;
                console.log(`[ShieldSystem] ${this.getUnitName(unit)}: 쉴드 지속 턴 ${unit.blockDuration} 남음`);
                return; // 아직 유지
            }
        }
        
        // 쉴드 초기화
        console.log(`[ShieldSystem] ${this.getUnitName(unit)}: 쉴드 만료`);
        
        // 만료 VFX
        if (typeof ShieldVFX !== 'undefined') {
            ShieldVFX.expireAtUnit(unit);
        }
        
        // 글로우 제거
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.removeShieldGlow(unit);
        }
        
        // 쉴드 초기화
        this.setShield(unit, 0);
        unit.blockDuration = undefined;
        
        // UI 업데이트
        this.updateUI(unit);
    },
    
    // ==========================================
    // 턴 종료 시 전체 처리 (플레이어 쉴드만)
    // ==========================================
    onTurnEnd() {
        // 히어로 쉴드 만료 (매 턴 종료 시)
        if (this.game?.state?.hero) {
            this.expireShield(this.game.state.hero);
        }
    },
    
    // ==========================================
    // ★ 에너미 턴 시작 시 처리 (에너미 쉴드 만료)
    // ==========================================
    onEnemyTurnStart() {
        console.log('[ShieldSystem] 에너미 턴 시작 - 기존 쉴드 정산');
        
        if (this.game?.state?.enemyUnits) {
            for (const enemy of this.game.state.enemyUnits) {
                if (enemy.hp > 0) {
                    this.expireEnemyShield(enemy);
                }
            }
        }
    },
    
    // ==========================================
    // ★ 에너미 쉴드 만료 (턴 시작 시 즉시 만료)
    // ==========================================
    expireEnemyShield(unit) {
        const currentShield = this.getShield(unit);
        if (currentShield <= 0) return;
        
        console.log(`[ShieldSystem] ${this.getUnitName(unit)}: 에너미 턴 시작 - 쉴드 ${currentShield} 만료`);
        
        // 만료 VFX
        if (typeof ShieldVFX !== 'undefined') {
            ShieldVFX.expireAtUnit(unit);
        }
        
        // 글로우 제거
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.removeShieldGlow(unit);
        }
        
        // 쉴드 초기화
        this.setShield(unit, 0);
        unit.blockDuration = undefined;
        
        // UI 업데이트
        this.updateUI(unit);
    },
    
    // ==========================================
    // 쉴드 값 가져오기
    // ==========================================
    getShield(unit) {
        if (!unit) return 0;
        
        // 히어로는 state.heroBlock 우선
        if (unit.isHero && this.game?.state) {
            return this.game.state.heroBlock || 0;
        }
        
        return unit.block || 0;
    },
    
    // ==========================================
    // 쉴드 값 설정
    // ==========================================
    setShield(unit, value) {
        if (!unit) return;
        
        value = Math.max(0, value);
        
        // 히어로: state.heroBlock과 unit.block 둘 다 설정
        if (unit.isHero && this.game?.state) {
            this.game.state.heroBlock = value;
        }
        
        unit.block = value;
    },
    
    // ==========================================
    // 쉴드 UI 업데이트
    // ==========================================
    updateUI(unit) {
        if (!unit) return;
        
        // HP 바 업데이트
        if (this.game && typeof this.game.updateUnitHPBar === 'function') {
            this.game.updateUnitHPBar(unit);
        }
        
        // 히어로 블록 UI 업데이트
        if (unit.isHero && this.game && typeof this.game.updateBlockUI === 'function') {
            this.game.updateBlockUI();
        }
    },
    
    // ==========================================
    // 쉴드 존재 여부
    // ==========================================
    hasShield(unit) {
        return this.getShield(unit) > 0;
    },
    
    // ==========================================
    // 유닛 이름 가져오기 (로그용)
    // ==========================================
    getUnitName(unit) {
        if (!unit) return 'Unknown';
        if (unit.isHero) return 'Hero';
        return unit.name || unit.type || 'Unit';
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.ShieldSystem = ShieldSystem;
}

console.log('[ShieldSystem] 쉴드 시스템 모듈 로드 완료');
