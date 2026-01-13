// =====================================================
// Animation Config - 애니메이션 타이밍 중앙 관리
// 모든 애니메이션 duration, ease를 한 곳에서 관리
// =====================================================

const AnimConfig = {
    // ==========================================
    // 대쉬 (접근 이동)
    // ==========================================
    dash: {
        windup: 0.12,           // 웅크리기 (준비)
        move: 0.35,             // 대쉬 이동
        land: 0.1,              // 착지
        ease: 'power2.inOut',   // 가속→감속
        windupEase: 'power2.in',
        landEase: 'power2.out',
        // 스케일 변형
        windupScaleX: 0.85,
        windupScaleY: 1.15,
        moveScaleX: 1.1,
        moveScaleY: 0.9
    },
    
    // ==========================================
    // 공격 모션
    // ==========================================
    attack: {
        // 찌르기 (빠른 연속 공격)
        stab: {
            duration: 0.08,
            ease: 'power2.out',
            scaleX: 1.05,
            scaleY: 0.95
        },
        // 슬래시 (일반 공격)
        slash: {
            duration: 0.12,
            ease: 'power2.out',
            scaleX: 1.1,
            scaleY: 0.9
        },
        // 강타 (무거운 공격)
        bash: {
            windup: 0.18,
            move: 0.25,
            impact: 0.12,
            ease: 'power2.inOut',
            impactEase: 'power3.in',
            scaleX: 1.3,
            scaleY: 0.75
        },
        // 클리브 (넓은 공격)
        cleave: {
            windup: 0.15,
            swing: 0.2,
            ease: 'power2.out'
        }
    },
    
    // ==========================================
    // 복귀 모션
    // ==========================================
    return: {
        duration: 0.25,
        ease: 'power2.out'
    },
    
    // ==========================================
    // 피격 반응
    // ==========================================
    hit: {
        knockback: 0.1,         // 밀려나는 시간
        recovery: 0.15,         // 복귀 시간
        flash: 0.05,            // 피격 플래시
        ease: 'power2.out',
        recoveryEase: 'elastic.out(1, 0.5)'
    },
    
    // ==========================================
    // 스킬별 특수 타이밍
    // ==========================================
    skills: {
        flurry: {
            dashDuration: 0.28,
            stabDuration: 0.08,
            stabInterval: 0.06,  // 찌르기 사이 간격
            ease: 'power2.inOut'
        },
        hook: {
            throwDuration: 0.2,
            pullDuration: 0.3,
            ease: 'power2.out'
        },
        rush: {
            chargeDuration: 0.15,
            hitInterval: 0.08,
            ease: 'power2.in'
        }
    },
    
    // ==========================================
    // VFX 타이밍
    // ==========================================
    vfx: {
        hitSpark: 0.15,
        slash: 0.2,
        explosion: 0.4,
        fadeOut: 0.3
    },
    
    // ==========================================
    // 히트스톱 (프레임 정지)
    // ==========================================
    hitStop: {
        light: 30,      // ms - 가벼운 타격
        normal: 50,     // ms - 일반 타격
        heavy: 80,      // ms - 강한 타격
        critical: 120   // ms - 크리티컬/브레이크
    },
    
    // ==========================================
    // 헬퍼: 설정 가져오기
    // ==========================================
    get(path) {
        const keys = path.split('.');
        let result = this;
        for (const key of keys) {
            result = result?.[key];
            if (result === undefined) {
                return null;
            }
        }
        return result;
    },
    
    // duration 가져오기 (기본값 포함)
    getDuration(path, defaultVal = 0.15) {
        return this.get(path) ?? defaultVal;
    },
    
    // ease 가져오기
    getEase(path, defaultVal = 'power2.out') {
        return this.get(path) ?? defaultVal;
    },
    
    // ==========================================
    // ★ 카드별 애니메이션 설정 가져오기
    // 카드 JSON의 anim 설정을 기본값과 병합
    // ==========================================
    getCardAnim(cardId, cardDef = null) {
        // 카드 정의 가져오기
        if (!cardDef && typeof CardSystem !== 'undefined') {
            cardDef = CardSystem.getCard(cardId);
        }
        
        // 카드에 anim 설정이 있으면 기본값과 병합
        const cardAnim = cardDef?.anim || {};
        const animType = cardAnim.type || 'slash';
        
        // 기본값 가져오기
        let defaults = {};
        switch (animType) {
            case 'slash':
                defaults = { ...this.dash, ...this.attack.slash };
                break;
            case 'bash':
                defaults = { ...this.dash, ...this.attack.bash };
                break;
            case 'cleave':
                defaults = { ...this.dash, ...this.attack.cleave };
                break;
            case 'flurry':
                defaults = { ...this.dash, ...this.skills.flurry };
                break;
            case 'hook':
                defaults = { ...this.skills.hook };
                break;
            case 'rush':
                defaults = { ...this.skills.rush };
                break;
            default:
                defaults = { ...this.dash };
        }
        
        // 카드 설정으로 덮어쓰기
        return { ...defaults, ...cardAnim };
    },
    
    // ==========================================
    // ★ 빠른 접근: 카드별 대시 시간
    // ==========================================
    getCardDash(cardId, cardDef = null) {
        const anim = this.getCardAnim(cardId, cardDef);
        return anim.dash || anim.move || this.dash.move;
    },
    
    // ★ 빠른 접근: 카드별 공격 시간
    getCardAttack(cardId, cardDef = null) {
        const anim = this.getCardAnim(cardId, cardDef);
        return anim.attack || anim.stab || anim.swing || this.attack.stab.duration;
    },
    
    // ★ 빠른 접근: 카드별 ease
    getCardEase(cardId, cardDef = null) {
        const anim = this.getCardAnim(cardId, cardDef);
        return anim.ease || this.dash.ease;
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.AnimConfig = AnimConfig;
}

console.log('[AnimConfig] 애니메이션 설정 로드 완료');
