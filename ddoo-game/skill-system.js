// =====================================================
// Skill System - JSON 기반 스킬 연출 시스템
// =====================================================

const SkillSystem = {
    game: null,
    skills: new Map(),  // 스킬 데이터 캐시
    initialized: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    async init(gameRef) {
        this.game = gameRef;
        await this.loadSkills();
        this.initialized = true;
        console.log('[SkillSystem] 초기화 완료');
    },
    
    // ==========================================
    // JSON 스킬 데이터 로드
    // ==========================================
    async loadSkills() {
        try {
            const indexRes = await fetch('skills/index.json');
            if (!indexRes.ok) {
                console.warn('[SkillSystem] skills/index.json 없음');
                return;
            }
            
            const skillIds = await indexRes.json();
            
            // 병렬 로딩
            const results = await Promise.allSettled(
                skillIds.map(id => 
                    fetch(`skills/${id}.json`)
                        .then(res => res.ok ? res.json() : null)
                        .then(data => data ? { id, data } : null)
                        .catch(() => null)
                )
            );
            
            let loadedCount = 0;
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    this.skills.set(result.value.id, result.value.data);
                    loadedCount++;
                }
            }
            
            console.log(`[SkillSystem] ${loadedCount}개 스킬 로드됨`);
        } catch (e) {
            console.warn('[SkillSystem] 스킬 로드 실패:', e);
        }
    },
    
    // ==========================================
    // 스킬 데이터 조회
    // ==========================================
    getSkill(skillId) {
        return this.skills.get(skillId);
    },
    
    // ==========================================
    // 스킬 실행 (메인 진입점)
    // ==========================================
    async execute(skillId, attacker, target, options = {}) {
        const skillData = this.getSkill(skillId);
        if (!skillData) {
            console.warn(`[SkillSystem] 스킬 없음: ${skillId}`);
            return false;
        }
        
        console.log(`[SkillSystem] ${skillData.name} 실행`);
        
        // 유효성 체크
        if (!this.isValid(attacker) || !this.isValid(target)) {
            return false;
        }
        
        // 스킬 타입별 실행
        switch (skillData.type) {
            case 'melee':
                return await this.executeMelee(skillData, attacker, target, options);
            case 'ranged':
                return await this.executeRanged(skillData, attacker, target, options);
            default:
                console.warn(`[SkillSystem] 알 수 없는 스킬 타입: ${skillData.type}`);
                return false;
        }
    },
    
    // ==========================================
    // 근접 스킬 실행
    // ==========================================
    async executeMelee(skill, attacker, target, options = {}) {
        console.log(`[SkillSystem] ${skill.name} 실행: ${skill.hits}회 타격`);
        
        if (typeof UnitCombat === 'undefined') {
            console.warn('[SkillSystem] UnitCombat 없음');
            return false;
        }
        
        const hits = skill.hits || 1;
        const damage = options.damage || skill.damage || 1;
        
        // ★★★ Flurry: 대시 1번 → 타격 3번 → 복귀 ★★★
        if (skill.id === 'flurry') {
            await this.executeFlurry(attacker, target, hits, damage, skill, options);
        } else if (skill.id === 'bash') {
            // Bash: 강한 한 방
            if (options.cardDef && typeof BreakSystem !== 'undefined') {
                BreakSystem.onAttack(target, options.cardDef, 1, 0);
            }
            await UnitCombat.bashAttack(attacker, target, damage * hits, { isEnemy: false });
        } else {
            // 기본 strike
            for (let i = 0; i < hits; i++) {
                if (target.hp <= 0) break;
                if (options.cardDef && typeof BreakSystem !== 'undefined') {
                    BreakSystem.onAttack(target, options.cardDef, 1, i);
                }
                await UnitCombat.meleeAttack(attacker, target, damage, {
                    effectType: 'strike',
                    knockback: (i === hits - 1) ? (options.knockback || 0) : 0,
                    isEnemy: false
                });
                if (i < hits - 1) await new Promise(r => setTimeout(r, 100));
            }
        }
        
        console.log(`[SkillSystem] ${skill.name} 완료!`);
        return true;
    },
    
    // ==========================================
    // ★ Flurry 전용: 대시 1번 → 연속 타격 → 복귀
    // ==========================================
    async executeFlurry(attacker, target, hits, damage, skill, options) {
        const posTarget = UnitCombat.getPositionTarget(attacker);
        const scaleTarget = UnitCombat.getScaleTarget(attacker);
        const targetPosTarget = UnitCombat.getPositionTarget(target);
        
        if (!posTarget || !scaleTarget || !targetPosTarget) return;
        
        // 유효성 체크 헬퍼
        const isValid = () => {
            try {
                return posTarget && !posTarget.destroyed && 
                       scaleTarget && !scaleTarget.destroyed &&
                       posTarget.parent !== null;
            } catch { return false; }
        };
        
        // 안전한 GSAP 애니메이션 래퍼
        const safeTween = (target, props, duration) => {
            return new Promise(resolve => {
                if (!isValid()) { resolve(); return; }
                gsap.to(target, { 
                    ...props, 
                    duration,
                    onComplete: resolve,
                    onInterrupt: resolve
                });
            });
        };
        
        const baseScale = attacker.baseScale || scaleTarget.scale?.x || 1;
        const startX = posTarget.x;
        const startY = posTarget.y;
        const targetX = targetPosTarget.x;
        const targetY = targetPosTarget.y;
        const dashX = targetX - 55;
        
        attacker.isAnimating = true;
        
        // 잔상 색상 (사이버펑크)
        const trailColors = [0x00ffff, 0xff00ff, 0xffff00];
        
        // ========================================
        // 1. 대시! (산데비스탄 잔상!)
        // ========================================
        if (!isValid()) { attacker.isAnimating = false; return; }
        
        // 웅크리기 + 잔상
        this.createGhost(attacker, 0.6, this.GHOST_COLORS.CYAN);
        await safeTween(posTarget, { x: startX - 25 }, 0.08);
        await safeTween(scaleTarget.scale, { x: baseScale * 0.85, y: baseScale * 1.15 }, 0.08);
        
        // ★ 대시 중 연속 잔상 생성! (폴리싱!)
        let dashAfterimageTimer = null;
        let frameCount = 0;
        dashAfterimageTimer = setInterval(() => {
            if (isValid() && attacker.sprite?.texture) {
                const alpha = 0.8 - frameCount * 0.1;  // 더 강하게 시작!
                if (alpha > 0.15) {
                    this.createGhost(attacker, alpha, this.GHOST_COLORS.CYAN);
                }
                frameCount++;
            }
        }, 18);  // 18ms마다 (더 빠르게!)
        
        // 대시!
        await Promise.all([
            safeTween(posTarget, { x: dashX, y: targetY }, 0.15),
            safeTween(scaleTarget.scale, { x: baseScale * 1.1, y: baseScale * 0.9 }, 0.15)
        ]);
        
        // 대시 잔상 타이머 정리
        if (dashAfterimageTimer) clearInterval(dashAfterimageTimer);
        
        // 착지 + 잔상 (더 강하게!)
        this.createGhost(attacker, 0.7, this.GHOST_COLORS.CYAN);
        await safeTween(scaleTarget.scale, { x: baseScale, y: baseScale }, 0.05);
        
        // 대시 후 잠깐 대기
        await new Promise(r => setTimeout(r, 40));
        
        // ========================================
        // 2. 연속 타격! (3번) - 느리게!
        // ========================================
        const targetCenter = targetY - (target.sprite?.height || 60) / 2;
        
        for (let i = 0; i < hits; i++) {
            if (!isValid() || target.hp <= 0) break;
            
            const stabX = dashX + 20 + i * 15;
            const rotation = (i % 2 === 0) ? 0.1 : -0.08;
            
            // ★ 찌르기 잔상! (더 강하게!)
            this.createGhost(attacker, 0.8, trailColors[i]);
            
            // 찌르기 모션 (느리게!)
            await Promise.all([
                safeTween(posTarget, { x: stabX }, 0.04),
                safeTween(scaleTarget, { rotation: rotation }, 0.04),
                safeTween(scaleTarget.scale, { x: baseScale * 1.15, y: baseScale * 0.85 }, 0.04)
            ]);
            
            // VFX
            if (typeof CombatEffects !== 'undefined') {
                CombatEffects.flurryStab(targetX - 90, targetCenter, i);
                if (target.sprite && !target.sprite.destroyed) {
                    CombatEffects.hitEffect(target);
                }
                CombatEffects.screenShake(4 + i * 2, 80);
            }
            
            // 히트스톱 (더 길게!)
            if (typeof CombatEffects !== 'undefined') {
                await CombatEffects.hitStop(20 + i * 10);
            }
            
            // 데미지 + 브레이크
            this.game.dealDamage(target, damage);
            if (options.cardDef && typeof BreakSystem !== 'undefined') {
                BreakSystem.onAttack(target, options.cardDef, 1, i);
            }
            
            // 복귀 (마지막 제외) - 느리게!
            if (i < hits - 1 && isValid()) {
                await Promise.all([
                    safeTween(posTarget, { x: dashX - 8 }, 0.04),
                    safeTween(scaleTarget, { rotation: 0 }, 0.04),
                    safeTween(scaleTarget.scale, { x: baseScale, y: baseScale }, 0.04)
                ]);
                // 타격 간 딜레이 증가!
                await new Promise(r => setTimeout(r, 60));
            }
        }
        
        // ========================================
        // 3. 원위치 복귀 (산데비스탄!)
        // ========================================
        if (isValid()) {
            // 복귀 전 잠깐 대기
            await new Promise(r => setTimeout(r, 60));
            
            // 백스텝 준비 + 잔상 (더 강하게!)
            this.createGhost(attacker, 0.7, this.GHOST_COLORS.MAGENTA);
            
            await Promise.all([
                safeTween(scaleTarget.scale, { x: baseScale * 0.9, y: baseScale * 1.1 }, 0.05),
                safeTween(scaleTarget, { rotation: 0 }, 0.05)
            ]);
            
            // ★ 복귀 중 연속 잔상! (폴리싱!)
            let returnAfterimageTimer = null;
            let returnFrameCount = 0;
            returnAfterimageTimer = setInterval(() => {
                if (isValid() && attacker.sprite?.texture) {
                    const alpha = 0.75 - returnFrameCount * 0.1;  // 더 강하게 시작!
                    if (alpha > 0.15) {
                        this.createGhost(attacker, alpha, this.GHOST_COLORS.MAGENTA);
                    }
                    returnFrameCount++;
                }
            }, 18);  // 더 빠르게!
            
            await Promise.all([
                safeTween(posTarget, { x: startX, y: startY }, 0.12),
                safeTween(scaleTarget.scale, { x: baseScale, y: baseScale }, 0.12)
            ]);
            
            // 복귀 잔상 타이머 정리
            if (returnAfterimageTimer) clearInterval(returnAfterimageTimer);
        }
        
        attacker.isAnimating = false;
    },
    
    // ==========================================
    // 애니메이션: 접근 (개선된 대시 + 산데비스탄!)
    // ==========================================
    async playApproach(posTarget, scaleTarget, targetPos, approach, baseScale, attacker = null) {
        const targetX = targetPos.x - (approach.dash?.distance || 60);
        const targetY = targetPos.y;
        
        // 1. 윈드업 (웅크리기) + 잔상
        if (approach.windUp) {
            // ★ 윈드업 시작 시 잔상!
            if (attacker) this.createGhost(attacker, 0.5, this.GHOST_COLORS.CYAN);
            
            await new Promise(resolve => {
                const tl = gsap.timeline({ onComplete: resolve });
                tl.to(posTarget, { 
                    x: posTarget.x + (approach.windUp.x || -15), 
                    duration: approach.windUp.duration || 0.08,
                    ease: 'power2.in'
                });
                if (approach.windUp.scale) {
                    tl.to(scaleTarget.scale, {
                        x: baseScale * approach.windUp.scale.x,
                        y: baseScale * approach.windUp.scale.y,
                        duration: approach.windUp.duration || 0.08
                    }, '<');
                }
                if (approach.windUp.rotation) {
                    tl.to(scaleTarget, {
                        rotation: approach.windUp.rotation,
                        duration: approach.windUp.duration || 0.08
                    }, '<');
                }
            });
        }
        
        // 2. 대시! (빠르게 전진 + 산데비스탄!)
        if (approach.dash) {
            // ★ 대시 중 산데비스탄 트레일!
            let trailTimer = null;
            if (attacker) {
                trailTimer = this.startSandevistanTrail(attacker, 5, this.GHOST_COLORS.CYAN, 25);
            }
            
            await new Promise(resolve => {
                const tl = gsap.timeline({ onComplete: resolve });
                tl.to(posTarget, {
                    x: targetX,
                    y: targetY,
                    duration: approach.dash.duration || 0.12,
                    ease: approach.dash.ease || 'power4.out'
                });
                if (approach.dash.scale) {
                    tl.to(scaleTarget.scale, {
                        x: baseScale * approach.dash.scale.x,
                        y: baseScale * approach.dash.scale.y,
                        duration: approach.dash.duration || 0.12
                    }, '<');
                }
                // 대시 중 회전 정상화
                tl.to(scaleTarget, { rotation: 0, duration: approach.dash.duration || 0.12 }, '<');
            });
            
            // 트레일 중지
            this.stopSandevistanTrail(trailTimer);
        }
        
        // 3. 착지 (스케일 정상화) + 잔상
        if (approach.land) {
            // ★ 착지 잔상!
            if (attacker) this.createGhost(attacker, 0.4, this.GHOST_COLORS.CYAN);
            
            await new Promise(resolve => {
                gsap.to(scaleTarget.scale, {
                    x: baseScale * (approach.land.scale?.x || 1),
                    y: baseScale * (approach.land.scale?.y || 1),
                    duration: approach.land.duration || 0.05,
                    ease: 'power2.out',
                    onComplete: resolve
                });
            });
        }
    },
    
    // ==========================================
    // 애니메이션: 타격
    // ==========================================
    async playStrike(posTarget, scaleTarget, strike, baseScale, currentX) {
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            tl.to(posTarget, {
                x: currentX + (strike.offset || 30),
                duration: strike.duration || 0.04,
                ease: 'power2.out'
            });
            if (strike.rotation) {
                tl.to(scaleTarget, {
                    rotation: strike.rotation,
                    duration: strike.duration || 0.04
                }, '<');
            }
            if (strike.scale) {
                tl.to(scaleTarget.scale, {
                    x: baseScale * (strike.scale.x || 1.05),
                    y: baseScale * (strike.scale.y || 0.95),
                    duration: strike.duration || 0.04
                }, '<');
            }
        });
    },
    
    // ==========================================
    // 애니메이션: 타격 후 복귀 (빠른 준비)
    // ==========================================
    async playRecover(posTarget, scaleTarget, strike, baseScale, attackBaseX, recoverAnim = null) {
        const duration = recoverAnim?.duration || 0.02;
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            // 공격 시작 위치로 복귀
            tl.to(posTarget, {
                x: attackBaseX - 5,  // 약간 뒤로
                duration: duration,
                ease: recoverAnim?.ease || 'power1.in'
            });
            tl.to(scaleTarget, { rotation: 0, duration: duration }, '<');
            tl.to(scaleTarget.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.03
            }, '<');
        });
    },
    
    // ==========================================
    // 애니메이션: 원위치 복귀 (멋진 백스텝 + 산데비스탄!)
    // ==========================================
    async playReturn(posTarget, scaleTarget, startX, startY, returnAnim, baseScale, attacker = null) {
        // 1. 백스텝 준비 (살짝 뒤로 물러남) + 잔상
        if (returnAnim.windUp) {
            // ★ 백스텝 시작 잔상!
            if (attacker) this.createGhost(attacker, 0.5, this.GHOST_COLORS.MAGENTA);
            
            await new Promise(resolve => {
                const tl = gsap.timeline({ onComplete: resolve });
                tl.to(posTarget, {
                    x: posTarget.x + (returnAnim.windUp.x || -20),
                    duration: returnAnim.windUp.duration || 0.05,
                    ease: 'power2.in'
                });
                tl.to(scaleTarget.scale, {
                    x: baseScale * 0.9,
                    y: baseScale * 1.1,
                    duration: returnAnim.windUp.duration || 0.05
                }, '<');
            });
        }
        
        // 2. 원위치로 돌아가기 (산데비스탄!)
        // ★ 복귀 중 산데비스탄 트레일!
        let trailTimer = null;
        if (attacker) {
            trailTimer = this.startSandevistanTrail(attacker, 4, this.GHOST_COLORS.MAGENTA, 30);
        }
        
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            tl.to(posTarget, {
                x: startX,
                y: startY,
                duration: returnAnim.dash?.duration || returnAnim.duration || 0.15,
                ease: returnAnim.dash?.ease || returnAnim.ease || 'power2.out'
            });
            tl.to(scaleTarget.scale, {
                x: baseScale,
                y: baseScale,
                duration: returnAnim.dash?.duration || returnAnim.duration || 0.15
            }, '<');
            tl.to(scaleTarget, { rotation: 0, duration: 0.1 }, '<');
        });
        
        // 트레일 중지
        this.stopSandevistanTrail(trailTimer);
    },
    
    // ==========================================
    // VFX: 찌르기 이펙트 (세검 스타일)
    // ==========================================
    playStabVFX(hitPos, vfxConfig, hitIndex = 0) {
        if (typeof CombatEffects === 'undefined') return;
        
        const x = hitPos.x;
        const y = hitPos.y - 30;
        
        // 색상 선택 (배열 지원)
        const colors = vfxConfig.colors || ['0xffffff'];
        const colorHex = parseInt(
            Array.isArray(colors) ? colors[hitIndex % colors.length] : colors, 
            16
        );
        
        // 각도 선택 (배열 지원)
        const angles = vfxConfig.angles || [0];
        const angle = Array.isArray(angles) ? angles[hitIndex % angles.length] : angles;
        
        // 스케일 선택 (배열 지원)
        const scales = vfxConfig.scale || [1];
        const scale = Array.isArray(scales) ? scales[hitIndex % scales.length] : scales;
        
        // VFX 타입에 따른 처리
        switch (vfxConfig.type) {
            case 'stab':
                // 날카로운 찌르기 이펙트
                this.drawStabEffect(x, y, angle, colorHex, scale);
                break;
            case 'slash':
                CombatEffects.slashEffect(x, y, angle - 45, colorHex, scale);
                break;
            case 'heavySlash':
                CombatEffects.heavySlash(x, y, angle - 30, colorHex);
                break;
            default:
                CombatEffects.slashEffect(x, y, angle - 45, colorHex, scale);
        }
        
        // 스파크 추가
        CombatEffects.burstParticles?.(x, y, colorHex, 6 + hitIndex * 2);
    },
    
    // ==========================================
    // 찌르기 이펙트 그리기
    // ==========================================
    drawStabEffect(x, y, angle, color, scale = 1) {
        if (!this.game?.app) return;
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.rotation = angle * Math.PI / 180;
        container.zIndex = 100;
        
        // 메인 찌르기 라인 (뾰족한 삼각형)
        const thrust = new PIXI.Graphics();
        const length = 180 * scale;
        const width = 12 * scale;
        const tipLength = 60 * scale;
        
        // 날카로운 세검 모양
        thrust.moveTo(0, 0);
        thrust.lineTo(length - tipLength, -width / 2);
        thrust.lineTo(length, 0);
        thrust.lineTo(length - tipLength, width / 2);
        thrust.closePath();
        thrust.fill({ color: color, alpha: 0.9 });
        
        // 코어 라인 (더 밝은 중심)
        const core = new PIXI.Graphics();
        core.moveTo(0, 0);
        core.lineTo(length - tipLength, -width / 4);
        core.lineTo(length - 10, 0);
        core.lineTo(length - tipLength, width / 4);
        core.closePath();
        core.fill({ color: 0xffffff, alpha: 1 });
        
        // 글로우 효과 (외곽선)
        const glow = new PIXI.Graphics();
        glow.moveTo(-10, 0);
        glow.lineTo(length - tipLength, -width);
        glow.lineTo(length + 20, 0);
        glow.lineTo(length - tipLength, width);
        glow.closePath();
        glow.fill({ color: color, alpha: 0.3 });
        
        container.addChild(glow);
        container.addChild(thrust);
        container.addChild(core);
        
        // 임팩트 플래시
        const flash = new PIXI.Graphics();
        flash.circle(length, 0, 25 * scale);
        flash.fill({ color: 0xffffff, alpha: 0.8 });
        container.addChild(flash);
        
        this.game.app.stage.addChild(container);
        
        // 애니메이션
        container.alpha = 0;
        container.scale.set(0.5, 0.8);
        
        gsap.timeline()
            .to(container, { alpha: 1, duration: 0.02 })
            .to(container.scale, { x: 1.2, y: 1, duration: 0.04, ease: 'power2.out' }, '<')
            .to(container, { x: x + 30 * Math.cos(angle * Math.PI / 180), duration: 0.04 }, '<')
            .to(container, { alpha: 0, duration: 0.08 })
            .to(container.scale, { x: 1.5, y: 0.8, duration: 0.08 }, '<')
            .add(() => {
                if (container && !container.destroyed) {
                    container.destroy({ children: true });
                }
            });
    },
    
    // ==========================================
    // VFX 재생
    // ==========================================
    playVFX(vfx, targetPos, hitIndex = 0) {
        if (!vfx || typeof CombatEffects === 'undefined') return;
        
        const x = targetPos.x;
        const y = targetPos.y - 30;  // 약간 위에 표시
        const color = parseInt(vfx.color || '0xffffff', 16);
        const scale = vfx.scale || 1;
        
        switch (vfx.type) {
            case 'slash':
                const angle = Array.isArray(vfx.angles) ? vfx.angles[hitIndex % vfx.angles.length] : (vfx.angle || -45);
                CombatEffects.slashEffect(x, y, angle, color, scale);
                break;
            case 'heavySlash':
                CombatEffects.heavySlash(x, y, vfx.angle || -30, color);
                break;
            case 'cleave':
                CombatEffects.cleaveEffect(x, y, vfx.width || 200);
                break;
            default:
                CombatEffects.slashEffect(x, y, -45, color, scale);
        }
    },
    
    // ==========================================
    // 원거리 스킬 실행 (추후 구현)
    // ==========================================
    async executeRanged(skill, attacker, target, options = {}) {
        // TODO: 원거리 스킬 구현
        console.log(`[SkillSystem] 원거리 스킬 미구현: ${skill.id}`);
        return false;
    },
    
    // ==========================================
    // 유틸리티
    // ==========================================
    isValid(unit) {
        return unit && unit.sprite && !unit.sprite.destroyed;
    },
    
    getPositionTarget(unit) {
        return unit?.container || unit?.sprite;
    },
    
    getScaleTarget(unit) {
        return unit?.sprite;
    },
    
    // ==========================================
    // ★★★ 산데비스탄 잔상 시스템 ★★★
    // ==========================================
    
    /**
     * 유닛의 메인 스프라이트 찾기 (텍스처가 있는 실제 Sprite)
     */
    findMainSprite(unit) {
        const spriteWrapper = unit?.sprite;
        if (!spriteWrapper) return null;
        
        // 직접 texture가 있으면 그것 사용
        if (spriteWrapper.texture && spriteWrapper.texture.valid) {
            return spriteWrapper;
        }
        
        // children에서 'main' 라벨이나 texture가 있는 것 찾기
        if (spriteWrapper.children?.length > 0) {
            let mainSprite = spriteWrapper.children.find(c => c.label === 'main' && c.texture);
            if (!mainSprite) {
                mainSprite = spriteWrapper.children.find(c => c.texture && c.texture.valid);
            }
            return mainSprite;
        }
        
        return null;
    },
    
    /**
     * 단일 잔상 생성 (폴리싱됨!)
     * @param {Object} unit - 유닛 객체
     * @param {number} alpha - 투명도 (0~1)
     * @param {number} tint - 틴트 색상 (0xRRGGBB)
     * @returns {PIXI.Sprite|null} 생성된 잔상 스프라이트
     */
    createGhost(unit, alpha = 0.7, tint = 0x00ffff) {
        try {
            if (!this.game?.containers?.units) return null;
            
            const spriteWrapper = unit.sprite;
            const container = unit.container || spriteWrapper;
            const mainSprite = this.findMainSprite(unit);
            
            if (!mainSprite?.texture) return null;
            
            // 잔상 스프라이트 생성
            const ghost = new PIXI.Sprite(mainSprite.texture);
            ghost.anchor.set(mainSprite.anchor?.x ?? 0.5, mainSprite.anchor?.y ?? 1);
            ghost.x = container.x;
            ghost.y = container.y;
            
            // 스케일: wrapper × main 스프라이트 스케일 (★ 약간 크게!)
            const wrapperScaleX = spriteWrapper?.scale?.x ?? 1;
            const wrapperScaleY = spriteWrapper?.scale?.y ?? 1;
            const mainScaleX = mainSprite.scale?.x ?? 1;
            const mainScaleY = mainSprite.scale?.y ?? 1;
            const scaleBoost = 1.05;  // 잔상은 살짝 크게
            ghost.scale.set(
                wrapperScaleX * mainScaleX * scaleBoost, 
                wrapperScaleY * mainScaleY * scaleBoost
            );
            
            ghost.alpha = alpha;
            ghost.tint = tint;
            ghost.zIndex = (mainSprite.zIndex || 10) - 1;
            
            // ★ 글로우 효과 추가! (지원되는 경우)
            try {
                if (PIXI.filters?.GlowFilter) {
                    ghost.filters = [new PIXI.filters.GlowFilter({
                        distance: 8,
                        outerStrength: 1.5,
                        innerStrength: 0,
                        color: tint,
                        quality: 0.3
                    })];
                }
            } catch (e) { /* 글로우 필터 없으면 무시 */ }
            
            this.game.containers.units.addChild(ghost);
            
            // ★ 페이드아웃 애니메이션 (더 오래, 더 부드럽게!)
            gsap.to(ghost, {
                alpha: 0,
                duration: 0.4,  // 0.25 → 0.4
                ease: 'power2.out',
                onUpdate: () => {
                    if (ghost && !ghost.destroyed) {
                        ghost.scale.x *= 0.99;  // 0.97 → 0.99 (더 느리게 줄어듦)
                        ghost.scale.y *= 0.99;
                    }
                },
                onComplete: () => {
                    if (ghost && !ghost.destroyed) {
                        ghost.filters = null;
                        if (ghost.parent) ghost.parent.removeChild(ghost);
                        ghost.destroy();
                    }
                }
            });
            
            return ghost;
        } catch (e) {
            console.warn('[SkillSystem] 잔상 생성 실패:', e);
            return null;
        }
    },
    
    /**
     * 산데비스탄 트레일 (연속 잔상) - 폴리싱됨!
     * @param {Object} unit - 유닛 객체
     * @param {number} count - 잔상 개수
     * @param {number} tint - 틴트 색상
     * @param {number} interval - 생성 간격 (ms)
     * @returns {number} 타이머 ID (clearInterval용)
     */
    startSandevistanTrail(unit, count = 6, tint = 0x00ffff, interval = 20) {
        let created = 0;
        const timerId = setInterval(() => {
            if (created >= count || !this.isValid(unit)) {
                clearInterval(timerId);
                return;
            }
            
            // ★ 알파 곡선 개선: 시작은 강하게, 끝은 부드럽게
            const progress = created / count;
            const alpha = 0.8 - progress * 0.5;  // 0.8 → 0.3
            
            if (alpha > 0.15) {
                this.createGhost(unit, alpha, tint);
            }
            created++;
        }, interval);
        
        return timerId;
    },
    
    /**
     * 산데비스탄 트레일 중지
     */
    stopSandevistanTrail(timerId) {
        if (timerId) clearInterval(timerId);
    },
    
    // 잔상 색상 프리셋
    GHOST_COLORS: {
        CYAN: 0x00ffff,      // 전진/대시
        MAGENTA: 0xff00ff,   // 후퇴/복귀
        YELLOW: 0xffff00,    // 강타
        WHITE: 0xffffff,     // 일반
        RED: 0xff4444,       // 위험/크리티컬
        BLUE: 0x4488ff       // 방어/회피
    }
};

// 전역 접근
if (typeof window !== 'undefined') {
    window.SkillSystem = SkillSystem;
}

