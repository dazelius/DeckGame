// =====================================================
// Skill Actions - 스킬 연출 시스템
// JSON 데이터 기반 + 확장 가능한 구조
// =====================================================

const SkillActions = {
    // ==========================================
    // 설정 & 캐시
    // ==========================================
    game: null,
    animCache: new Map(),
    vfxCache: new Map(),      // ★ VFX 캐시 추가
    initialized: false,
    
    // 기본 설정
    config: {
        animPath: 'anim/',           // JSON 파일 경로
        vfxPath: 'vfx/',             // ★ VFX 파일 경로
        defaultDashDuration: 0.12,   // 대쉬 시간
        defaultHitDuration: 0.04,    // 타격 시간
        defaultReturnDuration: 0.15, // 복귀 시간
        debug: false
    },
    
    // ==========================================
    // 초기화 (★ 병렬 로딩으로 빠르게!)
    // ==========================================
    async init(gameRef) {
        this.game = gameRef;
        
        // ★ 애니메이션 + VFX 동시 로드
        await Promise.all([
            this.loadAnimations(),
            this.loadVFX()
        ]);
        
        this.initialized = true;
        console.log('[SkillActions] 초기화 완료');
    },
    
    // ==========================================
    // JSON 애니메이션 로드 (★ 병렬 로딩!)
    // ==========================================
    async loadAnimations() {
        try {
            const indexRes = await fetch(`${this.config.animPath}index.json`);
            if (!indexRes.ok) {
                console.warn('[SkillActions] anim/index.json 없음');
                return;
            }
            
            const files = await indexRes.json();
            
            // ★ 병렬 로딩 - 모든 파일 동시에 요청
            const results = await Promise.allSettled(
                files.map(id => 
                    fetch(`${this.config.animPath}${id}.json`)
                        .then(res => res.ok ? res.json() : null)
                        .then(data => data ? { id, data } : null)
                        .catch(() => null)
                )
            );
            
            let loadedCount = 0;
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    this.animCache.set(result.value.id, result.value.data);
                    loadedCount++;
                }
            }
            
            console.log(`[SkillActions] ${loadedCount}개 애니메이션 로드됨`);
        } catch (e) {
            console.warn('[SkillActions] 애니메이션 로드 실패:', e);
        }
    },
    
    // ==========================================
    // ★ VFX JSON 로드 (★ 병렬 로딩!)
    // ==========================================
    async loadVFX() {
        try {
            const indexRes = await fetch(`${this.config.vfxPath}index.json`);
            if (!indexRes.ok) {
                console.warn('[SkillActions] vfx/index.json 없음');
                return;
            }
            
            const files = await indexRes.json();
            
            // ★ 병렬 로딩 - 모든 파일 동시에 요청
            const results = await Promise.allSettled(
                files.map(id => 
                    fetch(`${this.config.vfxPath}${id}.json`)
                        .then(res => res.ok ? res.json() : null)
                        .then(data => data ? { id, data } : null)
                        .catch(() => null)
                )
            );
            
            let loadedCount = 0;
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    this.vfxCache.set(result.value.id, result.value.data);
                    loadedCount++;
                }
            }
            
            console.log(`[SkillActions] ${loadedCount}개 VFX 로드됨`);
        } catch (e) {
            console.warn('[SkillActions] VFX 로드 실패:', e);
        }
    },
    
    // ==========================================
    // ★ VFX 재생 (안전 체크 포함)
    // ==========================================
    playVFX(vfxId, x, y, scale = 1) {
        console.log(`[VFX] playVFX 호출: ${vfxId} at (${x}, ${y})`);
        
        // ★ 유효한 좌표 체크
        if (isNaN(x) || isNaN(y) || x === undefined || y === undefined) {
            console.warn(`[VFX] 잘못된 좌표: ${vfxId}`, x, y);
            return;
        }
        
        const vfxData = this.vfxCache.get(vfxId);
        console.log(`[VFX] vfxCache에서 조회: ${vfxId}`, vfxData ? '있음' : '없음', `(캐시 크기: ${this.vfxCache.size})`);
        
        if (!vfxData) {
            console.warn(`[VFX] VFX 없음: ${vfxId}`);
            return;
        }
        
        // CombatEffects의 VFX 시스템 사용
        if (typeof CombatEffects !== 'undefined' && CombatEffects.playVFX) {
            CombatEffects.playVFX(vfxData, x, y, scale);
        } else if (typeof VFX !== 'undefined' && VFX.play) {
            VFX.play(vfxData, x, y, scale);
        } else {
            // 기본 파티클 이펙트 (폴백)
            this.playBasicVFX(vfxData, x, y, scale);
        }
        
        // 쉐이크
        if (vfxData.shake && typeof CombatEffects !== 'undefined') {
            CombatEffects.screenShake(vfxData.shake, 100);
        }
    },
    
    // ★ 기본 VFX 렌더링 (폴백, 안전 체크 포함)
    playBasicVFX(vfxData, x, y, scale) {
        console.log(`[VFX] playBasicVFX 시작: (${x}, ${y}), scale: ${scale}`);
        
        if (!this.game?.app) {
            console.warn('[VFX] game.app 없음!');
            return;
        }
        
        // ★ 유효한 좌표 체크
        if (isNaN(x) || isNaN(y)) {
            console.warn('[VFX] playBasicVFX - 잘못된 좌표:', x, y);
            return;
        }
        
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.zIndex = 500;
        
        // 파티클들 생성
        const particleCount = (vfxData.particles || []).length;
        console.log(`[VFX] 파티클 생성 시작: ${particleCount}개`);
        for (const p of (vfxData.particles || [])) {
            if (container.destroyed) break;
            this.createVFXParticle(container, p, scale);
        }
        console.log(`[VFX] 파티클 생성 완료, children: ${container.children.length}`);
        
        // ★ 컨테이너에 추가 (항상 stage의 맨 위에!)
        // effects 컨테이너보다 stage에 직접 추가하여 항상 보이도록
        this.game.app.stage.addChild(container);
        console.log(`[VFX] stage에 추가됨, children: ${container.children.length}, position: (${x}, ${y})`);
        
        // ★ sortableChildren 확인
        if (!this.game.app.stage.sortableChildren) {
            this.game.app.stage.sortableChildren = true;
        }
        
        // 일정 시간 후 제거
        const maxLife = Math.max(...(vfxData.particles || []).map(p => p.life || 100)) + 100;
        setTimeout(() => {
            if (container && !container.destroyed) {
                // ★ 모든 자식 GSAP 애니메이션 정리
                gsap.killTweensOf(container);
                container.children.forEach(child => {
                    if (child && !child.destroyed) {
                        gsap.killTweensOf(child);
                    }
                });
                container.destroy({ children: true });
            }
        }, maxLife);
    },
    
    // ★ VFX 파티클 생성 (안전 체크 포함)
    createVFXParticle(container, p, scale = 1) {
        if (!container || container.destroyed) return;
        
        const g = new PIXI.Graphics();
        const color = parseInt((p.color || '#ffffff').replace('#', ''), 16);
        
        switch (p.type) {
            case 'flash':
                g.circle(0, 0, (p.size || 30) * scale);
                g.fill({ color: color, alpha: 0.8 });
                break;
                
            case 'arrow':
                const len = (p.length || 100) * scale;
                const wid = (p.width || 40) * scale;
                const tipAngle = (p.tipAngle || 25) * Math.PI / 180;
                g.moveTo(len, 0);
                g.lineTo(len - wid * Math.cos(tipAngle), -wid * Math.sin(tipAngle) / 2);
                g.lineTo(0, -wid * 0.15);
                g.lineTo(0, wid * 0.15);
                g.lineTo(len - wid * Math.cos(tipAngle), wid * Math.sin(tipAngle) / 2);
                g.closePath();
                g.fill({ color: color, alpha: 0.9 });
                break;
                
            case 'slash':
            case 'line':
                const lineLen = (Array.isArray(p.length) ? p.length[0] : p.length || 80) * scale;
                const lineWid = (p.width || 4) * scale;
                g.rect(-lineLen / 2, -lineWid / 2, lineLen, lineWid);
                g.fill({ color: color, alpha: 0.8 });
                break;
                
            case 'spark':
                const sparkSize = (Array.isArray(p.size) ? p.size[0] : p.size || 4) * scale;
                g.circle(0, 0, sparkSize);
                g.fill({ color: color });
                break;
        }
        
        container.addChild(g);
        
        // ★ 애니메이션 (시작 alpha = 1로 바로 보이게)
        const life = (p.life || 100) / 1000;
        const delay = (p.delay || 0) / 1000;
        
        // 딜레이가 있으면 숨겼다가 보여주기
        if (delay > 0) {
            g.alpha = 0;
            setTimeout(() => {
                if (g && !g.destroyed) {
                    g.alpha = 1;
                    gsap.to(g, { 
                        alpha: 0, 
                        x: g.x + (p.speed || 5) * scale * 10, 
                        duration: life, 
                        ease: 'power2.out' 
                    });
                }
            }, delay * 1000);
        } else {
            g.alpha = 1;
            gsap.to(g, { 
                alpha: 0, 
                x: g.x + (p.speed || 5) * scale * 10, 
                duration: life, 
                ease: 'power2.out' 
            });
        }
    },
    
    // ==========================================
    // 애니메이션 데이터 가져오기
    // ==========================================
    getAnim(id) {
        return this.animCache.get(id) || null;
    },
    
    // ==========================================
    // 스킬 실행 (메인 엔트리포인트)
    // ==========================================
    async play(skillId, attacker, target, options = {}) {
        if (!this.game) {
            console.error('[SkillActions] 초기화 필요');
            return false;
        }
        
        // 스킬별 핸들러 매핑
        const handlers = {
            'flurry': this.flurry.bind(this),
            'strike': this.strike.bind(this),
            'bash': this.bash.bind(this),
            'cleave': this.cleave.bind(this),
            // 추가 스킬은 여기에...
        };
        
        const handler = handlers[skillId];
        if (handler) {
            return await handler(attacker, target, options);
        }
        
        // 기본 공격 폴백
        console.warn(`[SkillActions] ${skillId} 핸들러 없음, 기본 공격 사용`);
        return await this.defaultAttack(attacker, target, options);
    },
    
    // ==========================================
    // 유틸리티: 위치 가져오기
    // ==========================================
    // ★ 유닛의 실제 컨테이너/스프라이트 좌표 반환
    getUnitPos(unit) {
        const container = this.getContainer(unit);
        if (!container) return null;
        return { x: container.x, y: container.y };
    },
    
    // ★ 그리드 기반 셀 센터 좌표 (원위치 복귀용)
    getGridPos(unit) {
        if (!this.game) return null;
        const pos = this.game.getCellCenter(unit.gridX, unit.gridZ);
        if (!pos || isNaN(pos.x) || isNaN(pos.y)) return null;
        return pos;
    },
    
    getContainer(unit) {
        return unit.container || unit.sprite;
    },
    
    getSprite(unit) {
        return unit.sprite;
    },
    
    getBaseScale(unit) {
        const sprite = this.getSprite(unit);
        return unit.baseScale || sprite?.scale?.x || 1;
    },
    
    // ==========================================
    // 유틸리티: 안전 체크
    // ==========================================
    isValid(unit) {
        if (!unit) return false;
        const sprite = this.getSprite(unit);
        return sprite && !sprite.destroyed;
    },
    
    isAlive(unit) {
        return unit && unit.hp > 0;
    },
    
    // ==========================================
    // 기본 모션: 대쉬
    // ==========================================
    async dashTo(unit, targetX, targetY, options = {}) {
        const container = this.getContainer(unit);
        const sprite = this.getSprite(unit);
        if (!container || !sprite || container.destroyed || sprite.destroyed) return;
        
        const baseScale = this.getBaseScale(unit);
        const duration = options.duration || this.config.defaultDashDuration;
        const startPos = this.getUnitPos(unit);
        if (!startPos) return;
        
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
            
            // 웅크리기 (준비)
            tl.to(container, { x: startPos.x - 15, duration: 0.08, ease: 'power2.in' });
            tl.to(sprite.scale, { x: baseScale * 0.85, y: baseScale * 1.15, duration: 0.08 }, '<');
            
            // 대쉬!
            tl.to(container, { x: targetX, y: targetY, duration: duration, ease: 'power4.out' });
            tl.to(sprite.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: duration }, '<');
            
            // 착지
            tl.to(sprite.scale, { x: baseScale, y: baseScale, duration: 0.08, ease: 'power2.out' });
        });
    },
    
    // ==========================================
    // ★ 기본 모션: 대쉬 투 타겟 (적 앞으로 돌진)
    // ==========================================
    async dashToTarget(unit, targetX, targetY, startPos, options = {}) {
        const container = this.getContainer(unit);
        const sprite = this.getSprite(unit);
        if (!container || !sprite || container.destroyed || sprite.destroyed) return;
        
        const baseScale = this.getBaseScale(unit);
        const duration = options.duration || this.config.defaultDashDuration;
        const currentX = container.x;
        const currentY = container.y;
        
        console.log(`[DashToTarget] ${currentX}, ${currentY} → ${targetX}, ${targetY}`);
        
        // ★ 단계별로 await 사용 (타임라인 대신)
        // 1. 준비 동작 (웅크리기)
        await new Promise(resolve => {
            gsap.to(container, { 
                x: currentX - 20, 
                duration: 0.1, 
                ease: 'power2.in',
                onComplete: resolve
            });
            gsap.to(sprite.scale, { 
                x: baseScale * 0.8, 
                y: baseScale * 1.2, 
                duration: 0.1
            });
        });
        
        console.log(`[DashToTarget] 웅크리기 완료, x: ${container.x}`);
        
        // 2. 대쉬! (빠르게 전진)
        await new Promise(resolve => {
            gsap.to(container, { 
                x: targetX, 
                y: targetY, 
                duration: duration, 
                ease: 'power4.out',
                onComplete: resolve
            });
            gsap.to(sprite.scale, { 
                x: baseScale * 1.15, 
                y: baseScale * 0.85, 
                duration: duration
            });
        });
        
        console.log(`[DashToTarget] 대쉬 완료, x: ${container.x}`);
        
        // 3. 착지 (스케일 정상화)
        await new Promise(resolve => {
            gsap.to(sprite.scale, { 
                x: baseScale, 
                y: baseScale, 
                duration: 0.08, 
                ease: 'power2.out',
                onComplete: resolve
            });
        });
    },
    
    // ==========================================
    // 기본 모션: 원위치 복귀
    // ==========================================
    async returnToBase(unit, basePos, options = {}) {
        const container = this.getContainer(unit);
        const sprite = this.getSprite(unit);
        if (!container || !sprite || container.destroyed || sprite.destroyed) return;
        
        const baseScale = this.getBaseScale(unit);
        const duration = options.duration || this.config.defaultReturnDuration;
        const startX = container.x;
        
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
            
            // 뒤로 살짝 물러남
            tl.to(container, { x: startX - 30, duration: 0.08, ease: 'power2.in' });
            tl.to(sprite.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: 0.08 }, '<');
            tl.to(sprite, { rotation: 0, duration: 0.08 }, '<');
            
            // 원위치로
            tl.to(container, { x: basePos.x, y: basePos.y, duration: duration, ease: 'power2.out' });
            tl.to(sprite.scale, { x: baseScale, y: baseScale, duration: duration }, '<');
        });
    },
    
    // ==========================================
    // 기본 모션: 찌르기/슬래시
    // ==========================================
    async stabMotion(unit, offset = { x: 20, rotation: 0.05 }, options = {}) {
        const container = this.getContainer(unit);
        const sprite = this.getSprite(unit);
        if (!container || !sprite || container.destroyed || sprite.destroyed) return;
        
        const baseScale = this.getBaseScale(unit);
        const baseX = container.x;
        const duration = options.duration || this.config.defaultHitDuration;
        
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
            
            // 찌르기
            tl.to(container, { x: baseX + offset.x, duration: duration, ease: 'power2.out' });
            tl.to(sprite, { rotation: offset.rotation || 0, duration: duration }, '<');
            tl.to(sprite.scale, { x: baseScale * 1.05, y: baseScale * 0.95, duration: duration }, '<');
        });
    },
    
    // ==========================================
    // 기본 모션: 복귀 (찌르기 후)
    // ==========================================
    async recoverMotion(unit, baseX, options = {}) {
        const container = this.getContainer(unit);
        const sprite = this.getSprite(unit);
        if (!container || !sprite || container.destroyed || sprite.destroyed) return;
        
        const baseScale = this.getBaseScale(unit);
        const duration = options.duration || 0.05;
        
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
            tl.to(container, { x: baseX, duration: duration, ease: 'power2.in' });
            tl.to(sprite, { rotation: 0, duration: duration }, '<');
            tl.to(sprite.scale, { x: baseScale, y: baseScale, duration: duration }, '<');
        });
    },
    
    // ==========================================
    // 이펙트: 히트
    // ==========================================
    triggerHit(target, intensity = 1) {
        if (!this.isValid(target)) return;
        
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitEffect(target.sprite);
            CombatEffects.screenShake(3 * intensity, 50);
        }
    },
    
    // ==========================================
    // 대미지 처리 + 브레이크 시스템
    // ==========================================
    applyDamage(target, damage, cardDef, hitNum = 0) {
        if (!this.game || !this.isAlive(target)) return { hit: false, broken: false };
        
        // 브레이크 시스템
        let breakResult = { hit: false, broken: false };
        if (typeof BreakSystem !== 'undefined' && cardDef) {
            breakResult = BreakSystem.onAttack(target, cardDef, 1, hitNum);
            if (breakResult.broken) {
                console.log(`[SkillActions] 🔥 ${target.name || target.type} BROKEN!`);
            }
            this.game.createEnemyIntent(target);
        }
        
        // 대미지 적용
        this.game.dealDamage(target, damage);
        
        return breakResult;
    },
    
    // ==========================================
    // 스킬: Flurry (연속찌르기)
    // ==========================================
    // ==========================================
    // ★★★ Flurry: bash와 동일한 방식으로 구현 ★★★
    // ==========================================
    async flurry(attacker, target, options = {}) {
        const { cardDef, hits = 3, damage = 2 } = options;
        
        console.log(`[Flurry] 시작 - hits: ${hits}, damage: ${damage}`);
        
        // 유효성 체크
        if (!this.isValid(attacker) || !this.isValid(target)) {
            console.log(`[Flurry] 유효하지 않음, 대미지만 처리`);
            for (let i = 0; i < hits; i++) {
                if (!this.isAlive(target)) break;
                this.applyDamage(target, damage, cardDef, i);
            }
            return true;
        }
        
        // ★ bash처럼 직접 객체 참조 유지
        const container = this.getContainer(attacker);
        const sprite = this.getSprite(attacker);
        const targetContainer = this.getContainer(target);
        
        if (!container || !sprite || !targetContainer) {
            console.log(`[Flurry] 컨테이너 오류`);
            return false;
        }
        
        const baseScale = this.getBaseScale(attacker);
        const startX = container.x;
        const startY = container.y;
        const targetX = targetContainer.x;
        const targetY = targetContainer.y;
        const attackX = targetX - 60;  // 타겟 앞 60px
        
        console.log(`[Flurry] 시작: (${startX}, ${startY}) → 타겟: (${targetX}, ${targetY})`);
        
        // ========================================
        // 1. 대쉬 (bash와 동일한 방식!)
        // ========================================
        // 준비 동작 (웅크리기)
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(container, { x: startX - 20, duration: 0.08, ease: 'power2.in' })
                .to(sprite.scale, { x: baseScale * 0.85, y: baseScale * 1.15, duration: 0.08 }, '<');
        });
        
        console.log(`[Flurry] 웅크리기 완료, x: ${container.x}`);
        
        // 대쉬!
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(container, { x: attackX, y: targetY, duration: 0.12, ease: 'power4.out' })
                .to(sprite.scale, { x: baseScale * 1.1, y: baseScale * 0.9, duration: 0.12 }, '<');
        });
        
        console.log(`[Flurry] 대쉬 완료, x: ${container.x}`);
        
        // 착지
        await new Promise(resolve => {
            gsap.to(sprite.scale, { x: baseScale, y: baseScale, duration: 0.05, onComplete: resolve });
        });
        
        // ========================================
        // 2. 연속 찌르기
        // ========================================
        const stabOffsets = [
            { x: 25, rotation: 0.06 },
            { x: 30, rotation: -0.04 },
            { x: 35, rotation: 0.1 }
        ];
        
        for (let hitNum = 0; hitNum < hits; hitNum++) {
            // 타겟 사망 체크
            if (!this.isAlive(target)) {
                console.log(`[Flurry] 타겟 사망으로 중단 (${hitNum}/${hits})`);
                break;
            }
            
            const stab = stabOffsets[hitNum % stabOffsets.length];
            const currentX = container.x;
            
            // 찌르기 모션
            await new Promise(resolve => {
                gsap.timeline({ onComplete: resolve })
                    .to(container, { x: currentX + stab.x, duration: 0.04, ease: 'power2.out' })
                    .to(sprite, { rotation: stab.rotation, duration: 0.04 }, '<')
                    .to(sprite.scale, { x: baseScale * 1.05, y: baseScale * 0.95, duration: 0.04 }, '<');
            });
            
            // ★ VFX: CombatEffects 사용!
            if (typeof CombatEffects !== 'undefined' && target.sprite) {
                const hitPos = target.sprite.getGlobalPosition();
                CombatEffects.slashEffect(hitPos.x, hitPos.y, -30 + hitNum * 20, 0x60a5fa, 0.8);
            }
            
            // 대미지 + 히트 이펙트
            console.log(`[Flurry] Hit ${hitNum + 1}/${hits} - damage: ${damage}`);
            this.applyDamage(target, damage, cardDef, hitNum);
            this.triggerHit(target, 1.2 + hitNum * 0.3);
            
            // 복귀 (마지막 제외)
            if (hitNum < hits - 1) {
                await new Promise(resolve => {
                    gsap.timeline({ onComplete: resolve })
                        .to(container, { x: attackX - 5, duration: 0.03, ease: 'power2.in' })
                        .to(sprite, { rotation: 0, duration: 0.03 }, '<')
                        .to(sprite.scale, { x: baseScale, y: baseScale, duration: 0.03 }, '<');
                });
                await new Promise(r => setTimeout(r, 30));
            }
        }
        
        // ========================================
        // 3. 원위치 복귀
        // ========================================
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(container, { x: container.x - 30, duration: 0.06, ease: 'power2.in' })
                .to(sprite.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: 0.06 }, '<')
                .to(sprite, { rotation: 0, duration: 0.06 }, '<');
        });
        
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(container, { x: startX, y: startY, duration: 0.15, ease: 'power2.out' })
                .to(sprite.scale, { x: baseScale, y: baseScale, duration: 0.15 }, '<');
        });
        
        console.log(`[Flurry] 완료! 최종 위치: ${container.x}`);
        return true;
    },
    
    // ==========================================
    // 스킬: Strike (기본 공격)
    // ==========================================
    async strike(attacker, target, options = {}) {
        const { cardDef, damage = 6, knockback = 0 } = options;
        
        if (!this.isValid(attacker) || !this.isValid(target)) {
            this.applyDamage(target, damage, cardDef, 0);
            return true;
        }
        
        const attackerPos = this.getUnitPos(attacker);
        const targetPos = this.getUnitPos(target);
        if (!attackerPos || !targetPos) return false;
        
        // 적 앞으로 대쉬
        const attackX = targetPos.x - 50;
        await this.dashTo(attacker, attackX, targetPos.y);
        
        // 슬래시
        await this.stabMotion(attacker, { x: 40, rotation: 0.1 });
        
        // 대미지 + 이펙트
        this.applyDamage(target, damage, cardDef, 0);
        this.triggerHit(target, 1.2);
        
        // 넉백 처리
        if (knockback > 0 && typeof KnockbackSystem !== 'undefined') {
            KnockbackSystem.knockback(target, 1, knockback);
        }
        
        // 원위치
        await this.returnToBase(attacker, attackerPos);
        
        return true;
    },
    
    // ==========================================
    // 스킬: Bash (강타)
    // ==========================================
    async bash(attacker, target, options = {}) {
        const { cardDef, damage = 8, knockback = 1 } = options;
        
        if (!this.isValid(attacker) || !this.isValid(target)) {
            this.applyDamage(target, damage, cardDef, 0);
            return true;
        }
        
        const attackerPos = this.getUnitPos(attacker);
        const targetPos = this.getUnitPos(target);
        if (!attackerPos || !targetPos) return false;
        
        const container = this.getContainer(attacker);
        const sprite = this.getSprite(attacker);
        if (!container || !sprite || container.destroyed || sprite.destroyed) {
            this.applyDamage(target, damage, cardDef, 0);
            return true;
        }
        const baseScale = this.getBaseScale(attacker);
        
        // 준비 동작 (더 웅크림)
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve, onInterrupt: resolve })
                .to(container, { x: attackerPos.x - 25, duration: 0.15, ease: 'power2.in' })
                .to(sprite.scale, { x: baseScale * 0.75, y: baseScale * 1.25, duration: 0.15 }, '<');
        });
        
        // 강력한 대쉬
        const attackX = targetPos.x - 40;
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve, onInterrupt: resolve })
                .to(container, { x: attackX, y: targetPos.y, duration: 0.1, ease: 'power4.out' })
                .to(sprite.scale, { x: baseScale * 1.2, y: baseScale * 0.8, duration: 0.1 }, '<');
        });
        
        // 충돌!
        await this.stabMotion(attacker, { x: 50, rotation: 0.15 }, { duration: 0.06 });
        
        // 대미지 + 이펙트
        this.applyDamage(target, damage, cardDef, 0);
        this.triggerHit(target, 2);
        
        // 취약 부여
        if (cardDef?.vulnerable) {
            target.vulnerable = (target.vulnerable || 0) + cardDef.vulnerable;
        }
        
        // 넉백
        if (knockback > 0 && typeof KnockbackSystem !== 'undefined') {
            KnockbackSystem.knockback(target, 1, knockback);
        }
        
        // 히트스톱
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.hitStop(80);
            CombatEffects.screenShake(10, 200);
        }
        
        await new Promise(r => setTimeout(r, 100));
        
        // 원위치
        await this.returnToBase(attacker, attackerPos);
        
        return true;
    },
    
    // ==========================================
    // 스킬: Cleave (광역 공격)
    // ==========================================
    async cleave(attacker, targets, options = {}) {
        const { cardDef, damage = 6 } = options;
        const targetList = Array.isArray(targets) ? targets : [targets];
        
        if (!this.isValid(attacker)) {
            for (const t of targetList) {
                if (this.isAlive(t)) this.applyDamage(t, damage, cardDef, 0);
            }
            return true;
        }
        
        const attackerPos = this.getUnitPos(attacker);
        if (!attackerPos) return false;
        
        // 첫 번째 타겟 기준으로 이동
        const primaryTarget = targetList[0];
        const targetPos = this.getUnitPos(primaryTarget);
        if (!targetPos) return false;
        
        const container = this.getContainer(attacker);
        const sprite = this.getSprite(attacker);
        const baseScale = this.getBaseScale(attacker);
        
        // 대쉬
        const attackX = targetPos.x - 60;
        await this.dashTo(attacker, attackX, targetPos.y);
        
        // 휘두르기 동작
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(sprite, { rotation: -0.3, duration: 0.1, ease: 'power2.in' })
                .to(sprite.scale, { x: baseScale * 0.9, y: baseScale * 1.1, duration: 0.1 }, '<');
        });
        
        // 슬래시!
        await new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(container, { x: attackX + 60, duration: 0.08, ease: 'power4.out' })
                .to(sprite, { rotation: 0.4, duration: 0.08 }, '<')
                .to(sprite.scale, { x: baseScale * 1.15, y: baseScale * 0.85, duration: 0.08 }, '<');
        });
        
        // 모든 타겟에 대미지
        for (let i = 0; i < targetList.length; i++) {
            const t = targetList[i];
            if (this.isAlive(t)) {
                this.applyDamage(t, damage, cardDef, i);
                this.triggerHit(t, 1);
            }
        }
        
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenShake(8, 150);
        }
        
        await new Promise(r => setTimeout(r, 50));
        
        // 원위치
        await this.returnToBase(attacker, attackerPos);
        
        return true;
    },
    
    // ==========================================
    // 기본 공격 (폴백)
    // ==========================================
    async defaultAttack(attacker, target, options = {}) {
        return await this.strike(attacker, target, options);
    },
    
    // ==========================================
    // JSON 시퀀스 실행 (향후 확장용)
    // ==========================================
    async playSequence(sequenceId, attacker, target, options = {}) {
        const data = this.getAnim(sequenceId);
        if (!data || data.type !== 'sequence') {
            console.warn(`[SkillActions] 시퀀스 없음: ${sequenceId}`);
            return false;
        }
        
        // TODO: JSON 시퀀스 파싱 및 실행
        // data.steps를 순회하며 각 스텝 실행
        console.log(`[SkillActions] 시퀀스 실행: ${sequenceId}`, data);
        
        return true;
    }
};

console.log('[SkillActions] 스킬 액션 시스템 로드됨');

