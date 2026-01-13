// =====================================================
// Blood Effect System - GSAP 기반 피 효과
// 간단하고 확실하게 작동하는 버전
// =====================================================

const BloodEffect = {
    app: null,
    container: null,
    initialized: false,
    
    config: {
        enabled: true,
        intensity: 1.2,
    },
    
    bloodColors: [
        0xAA0000, 0x880000, 0x660000,
        0x990011, 0xBB1111, 0x770000,
    ],
    
    // ==========================================
    // 초기화
    // ==========================================
    init(app, gameWorld = null) {
        this.app = app;
        
        this.container = new PIXI.Container();
        this.container.zIndex = 25;
        this.container.sortableChildren = true;
        
        if (gameWorld) {
            gameWorld.addChild(this.container);
        } else if (app && app.stage) {
            app.stage.addChild(this.container);
        }
        
        this.initialized = true;
        console.log('[BloodEffect] 🩸 GSAP 기반 피 시스템 초기화');
    },
    
    // ==========================================
    // 🩸 메인 API
    // ==========================================
    onDamage(x, y, damage, options = {}) {
        if (!this.initialized || !this.config.enabled) return;
        
        const { type = 'normal' } = options;
        const count = Math.min(10 + damage * 3, 50);
        
        // 피 스프레이
        this.spawnBlood(x, y, count);
        
        // 크리티컬이면 더 많이
        if (type === 'critical' || type === 'heavy' || type === 'bash') {
            this.spawnBlood(x, y, count);
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.screenFlash('#ff0000', 80, 0.15);
            }
        }
    },
    
    // ==========================================
    // 피 스프레이 (GSAP 애니메이션)
    // ==========================================
    spawnBlood(x, y, count) {
        for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics();
            
            // 랜덤 방향 (위쪽 편향)
            const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.3;
            const speed = 150 + Math.random() * 350;
            const size = 3 + Math.random() * 6;
            const color = this.bloodColors[Math.floor(Math.random() * this.bloodColors.length)];
            
            // 시작 위치
            const startX = x + (Math.random() - 0.5) * 20;
            const startY = y + (Math.random() - 0.5) * 15;
            
            // 속도
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 50;
            
            // 즉시 그리기
            g.circle(startX, startY, size);
            g.fill({ color: color, alpha: 1 });
            this.container.addChild(g);
            
            // GSAP 애니메이션
            const duration = 0.5 + Math.random() * 0.4;
            const gravity = 600 + Math.random() * 300;
            
            gsap.to({}, {
                duration: duration,
                onUpdate: function() {
                    const t = this.progress();
                    const currentX = startX + vx * t;
                    const currentY = startY + vy * t + 0.5 * gravity * t * t;
                    const currentSize = size * (1 - t * 0.3);
                    const alpha = 1 - t;
                    
                    g.clear();
                    if (alpha > 0.05 && currentSize > 0.5) {
                        g.circle(currentX, currentY, currentSize);
                        g.fill({ color: color, alpha: alpha });
                    }
                },
                onComplete: () => {
                    if (g.parent) g.parent.removeChild(g);
                    g.destroy();
                }
            });
        }
    },
    
    // ==========================================
    // 💀 사망 시 대량 출혈
    // ==========================================
    onDeath(x, y, options = {}) {
        if (!this.initialized || !this.config.enabled) return;
        
        this.spawnBlood(x, y, 60);
        setTimeout(() => this.spawnBlood(x, y, 40), 50);
        setTimeout(() => this.spawnBlood(x, y, 30), 100);
        
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ff0000', 150, 0.25);
            CombatEffects.screenShake(12, 200);
        }
    },
    
    // ==========================================
    // 설정
    // ==========================================
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.BloodEffect = BloodEffect;
}
