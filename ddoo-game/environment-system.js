// =====================================================
// Environment System - 환경 효과 시스템
// 비, 가뭄 등 맵 전체에 영향을 주는 환경 카드 관리
// =====================================================

const EnvironmentSystem = {
    game: null,
    app: null,
    
    // 현재 활성 환경
    activeEnvironment: null,
    remainingTurns: 0,
    
    // VFX 컨테이너
    vfxContainer: null,
    rainDrops: [],
    splashes: [],
    ripples: [],
    
    // 설정
    MAX_RAIN_DROPS: 200,
    MAX_SPLASHES: 30,
    MAX_RIPPLES: 25,
    
    // ==========================================
    // 초기화
    // ==========================================
    init(gameRef) {
        this.game = gameRef;
        this.app = gameRef?.app;
        console.log('[EnvironmentSystem] 초기화 완료');
    },
    
    // ==========================================
    // 환경 활성화
    // ==========================================
    activate(environmentType, duration = 3) {
        // 기존 환경 제거
        this.deactivate();
        
        this.activeEnvironment = environmentType;
        this.remainingTurns = duration;
        
        console.log(`[Environment] ${environmentType} 환경 활성화 (${duration}턴)`);
        
        // VFX 시작
        if (environmentType === 'rain') {
            this.startRainVFX();
        } else if (environmentType === 'drought') {
            this.startDroughtVFX();
        }
        
        // 기존 상쇄 원소 그리드 제거
        this.clearBlockedElements();
        
        // UI 표시
        this.showEnvironmentUI();
    },
    
    // ==========================================
    // 환경 비활성화
    // ==========================================
    deactivate() {
        if (!this.activeEnvironment) return;
        
        console.log(`[Environment] ${this.activeEnvironment} 환경 종료`);
        
        // VFX 정지
        this.stopAllVFX();
        
        this.activeEnvironment = null;
        this.remainingTurns = 0;
        
        // UI 숨기기
        this.hideEnvironmentUI();
    },
    
    // ==========================================
    // 턴 종료 시 호출
    // ==========================================
    onTurnEnd() {
        if (!this.activeEnvironment) return;
        
        this.remainingTurns--;
        console.log(`[Environment] ${this.activeEnvironment} 남은 턴: ${this.remainingTurns}`);
        
        // UI 업데이트
        this.updateEnvironmentUI();
        
        if (this.remainingTurns <= 0) {
            this.deactivate();
        }
    },
    
    // ==========================================
    // 현재 환경 효과 체크
    // ==========================================
    
    // 물 환경인지 (비)
    isWaterEnvironment() {
        return this.activeEnvironment === 'rain';
    },
    
    // 불 환경인지 (가뭄)
    isFireEnvironment() {
        return this.activeEnvironment === 'drought';
    },
    
    // 특정 원소가 차단되는지
    isElementBlocked(element) {
        if (this.activeEnvironment === 'rain' && element === 'fire') return true;
        if (this.activeEnvironment === 'drought' && element === 'water') return true;
        return false;
    },
    
    // 글로벌 물 효과 적용 여부 (번개 보너스 등)
    hasGlobalWaterEffect() {
        return this.activeEnvironment === 'rain';
    },
    
    // ==========================================
    // 상쇄 원소 그리드 제거
    // ==========================================
    clearBlockedElements() {
        if (!this.game || typeof GridAOE === 'undefined') return;
        
        const blockedType = this.activeEnvironment === 'rain' ? 'fire' : 
                           this.activeEnvironment === 'drought' ? 'water' : null;
        
        if (blockedType) {
            const zones = GridAOE.zones.filter(z => z.type === blockedType);
            zones.forEach(zone => {
                GridAOE.removeZone(zone);
            });
            console.log(`[Environment] ${blockedType} 그리드 ${zones.length}개 제거`);
        }
    },
    
    // ==========================================
    // 비 VFX - 개선된 버전
    // ==========================================
    startRainVFX() {
        if (!this.app) return;
        
        // 컨테이너 생성
        this.vfxContainer = new PIXI.Container();
        this.vfxContainer.zIndex = 1000;
        this.app.stage.addChild(this.vfxContainer);
        
        // 배경 어둡게
        this.createRainOverlay();
        
        // 빗방울 생성
        this.rainDrops = [];
        this.splashes = [];
        this.ripples = [];
        
        for (let i = 0; i < this.MAX_RAIN_DROPS; i++) {
            this.createRainDrop();
        }
        
        // 애니메이션 루프
        this.rainAnimating = true;
        this.animateRain();
        
        // 시작 효과 - 번개!
        this.triggerLightning();
        
        // 사운드 (있으면)
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.playLoop?.('rain', 0.3);
        }
    },
    
    createRainOverlay() {
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x1a2a3a, 0.25);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        this.vfxContainer.addChild(overlay);
        this.rainOverlay = overlay;
        
        // 약간의 펄스 (번개 느낌)
        gsap.to(overlay, {
            alpha: 0.18,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    },
    
    createRainDrop() {
        const drop = new PIXI.Graphics();
        
        // 빗방울 (참조 코드 스타일)
        const length = Math.random() * 20 + 12;
        const opacity = Math.random() * 0.3 + 0.5;
        const width = Math.random() * 1.2 + 0.5;
        
        drop.moveTo(0, 0);
        drop.lineTo(2, length);
        drop.stroke({ width: width, color: 0xc8dcff, alpha: opacity });
        
        // 위치 초기화
        drop.x = Math.random() * (this.app.screen.width + 100) - 50;
        drop.y = Math.random() * this.app.screen.height - this.app.screen.height;
        
        // 속도 (참조 코드: 16~22)
        drop._speed = Math.random() * 6 + 16;
        drop._windOffset = Math.random() * 1.5 + 0.5;
        drop._length = length;
        
        // ★ 목표 floor 위치 할당 (3D 그리드 기반)
        this.assignFloorTarget(drop);
        
        this.vfxContainer.addChild(drop);
        this.rainDrops.push(drop);
    },
    
    // ★ 빗방울에 목표 floor 위치 할당
    assignFloorTarget(drop) {
        if (!this.game?.getCellCenter || !this.game?.arena) {
            drop._targetY = this.app.screen.height;
            drop._targetGridX = -1;
            drop._targetGridZ = -1;
            return;
        }
        
        // 랜덤 그리드 위치
        const gridX = Math.floor(Math.random() * (this.game.arena.width || 10));
        const gridZ = Math.floor(Math.random() * (this.game.arena.depth || 3));
        
        const localPos = this.game.getCellCenter(gridX, gridZ);
        if (localPos) {
            const pos = this.game.localToGlobal(localPos.x, localPos.y);
            drop._targetY = pos.y + 15; // floor 위치
            drop._targetX = pos.x + (Math.random() - 0.5) * 60; // 셀 내 랜덤 오프셋
            drop._targetGridX = gridX;
            drop._targetGridZ = gridZ;
        } else {
            drop._targetY = this.app.screen.height;
            drop._targetGridX = -1;
            drop._targetGridZ = -1;
        }
    },
    
    // ==========================================
    // 물튀김 생성 - 지정된 위치에
    // ==========================================
    createSplashAt(x, y) {
        if (this.splashes.length >= this.MAX_SPLASHES) return;
        
        const splash = new PIXI.Graphics();
        splash.x = x;
        splash.y = y;
        splash._radius = 0;
        splash._maxRadius = Math.random() * 10 + 6;
        splash._opacity = 0.7;
        
        this.vfxContainer.addChild(splash);
        this.splashes.push(splash);
        
        // 물방울 튀어오름 파티클 추가
        this.createSplashDroplets(x, y);
    },
    
    // 물방울 튀어오름
    createSplashDroplets(x, y) {
        const dropCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < dropCount; i++) {
            const droplet = new PIXI.Graphics();
            const size = 1.5 + Math.random() * 2;
            
            droplet.beginFill(0xaaddff, 0.8);
            droplet.drawCircle(0, 0, size);
            droplet.endFill();
            
            droplet.x = x;
            droplet.y = y;
            
            this.vfxContainer.addChild(droplet);
            
            // 포물선 운동
            const angle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
            const speed = 20 + Math.random() * 30;
            const vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
            const vy = -Math.sin(angle) * speed;
            
            gsap.to(droplet, {
                x: x + vx * 0.3,
                y: y + vy * 0.2 + 15, // 중력
                alpha: 0,
                duration: 0.25 + Math.random() * 0.15,
                ease: 'power2.out',
                onComplete: () => {
                    if (!droplet.destroyed) {
                        this.vfxContainer.removeChild(droplet);
                        droplet.destroy();
                    }
                }
            });
        }
    },
    
    // ==========================================
    // 물결(ripple) 생성 - 그리드 영역에
    // ==========================================
    createRipple(x, y) {
        if (this.ripples.length >= this.MAX_RIPPLES) return;
        
        const ripple = new PIXI.Graphics();
        ripple.x = x;
        ripple.y = y;
        ripple._radius = 0;
        ripple._maxRadius = Math.random() * 12 + 8;
        ripple._opacity = 0.5;
        
        this.vfxContainer.addChild(ripple);
        this.ripples.push(ripple);
    },
    
    // ==========================================
    // 번개 효과
    // ==========================================
    triggerLightning() {
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ffffff', 50, 0.7);
            setTimeout(() => {
                CombatEffects.screenFlash('#4488ff', 100, 0.3);
            }, 50);
        }
    },
    
    // ==========================================
    // 메인 애니메이션 루프
    // ==========================================
    animateRain() {
        if (!this.rainAnimating || !this.app) return;
        
        const screenHeight = this.app.screen?.height || 600;
        const screenWidth = this.app.screen?.width || 800;
        
        // 랜덤 번개
        if (Math.random() < 0.002) {
            this.triggerLightning();
        }
        
        // 빗방울 업데이트 - 각자의 목표 floor 위치에 도달 시 물튀김
        for (const drop of this.rainDrops) {
            if (drop.destroyed) continue;
            
            drop.y += drop._speed;
            drop.x += drop._windOffset;
            
            // 목표 floor Y에 도달하면
            if (drop.y >= drop._targetY) {
                // 30% 확률로 해당 위치에 물튀김 생성
                if (Math.random() < 0.3 && drop._targetGridX >= 0) {
                    this.createSplashAt(drop._targetX, drop._targetY);
                }
                // 리셋 + 새 목표 할당
                drop.y = -30 - Math.random() * 100;
                drop.x = Math.random() * (screenWidth + 100) - 50;
                this.assignFloorTarget(drop);
            }
        }
        
        // 물튀김 업데이트 (3D floor - 타원형)
        for (let i = this.splashes.length - 1; i >= 0; i--) {
            const s = this.splashes[i];
            if (s.destroyed) {
                this.splashes.splice(i, 1);
                continue;
            }
            
            s._radius += 1.2;
            s._opacity -= 0.05;
            
            s.clear();
            // 3D floor: 타원형 (Y 압축)
            s.ellipse(0, 0, s._radius, s._radius * 0.35);
            s.stroke({ width: 2, color: 0xaaddff, alpha: s._opacity });
            // 내부 링
            if (s._radius > 3) {
                s.ellipse(0, 0, s._radius * 0.6, s._radius * 0.6 * 0.35);
                s.stroke({ width: 1, color: 0xcceeFF, alpha: s._opacity * 0.6 });
            }
            
            if (s._opacity <= 0 || s._radius > s._maxRadius) {
                this.vfxContainer.removeChild(s);
                s.destroy();
                this.splashes.splice(i, 1);
            }
        }
        
        // 물결 업데이트
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            if (r.destroyed) {
                this.ripples.splice(i, 1);
                continue;
            }
            
            r._radius += 1;
            r._opacity -= 0.03;
            
            r.clear();
            r.ellipse(0, 0, r._radius, r._radius * 0.3);
            r.stroke({ width: 1, color: 0xb4c8ff, alpha: r._opacity * 0.5 });
            
            if (r._opacity <= 0 || r._radius > r._maxRadius) {
                this.vfxContainer.removeChild(r);
                r.destroy();
                this.ripples.splice(i, 1);
            }
        }
        
        // 그리드 영역에 물결 생성 (5% 확률)
        if (Math.random() < 0.05 && this.ripples.length < this.MAX_RIPPLES) {
            // 랜덤 그리드 위치에 물결
            if (this.game?.getCellCenter && this.game?.arena) {
                const gridX = Math.floor(Math.random() * (this.game.arena.width || 10));
                const gridZ = Math.floor(Math.random() * (this.game.arena.depth || 3));
                const localPos = this.game.getCellCenter(gridX, gridZ);
                if (localPos) {
                    const pos = this.game.localToGlobal(localPos.x, localPos.y);
                    this.createRipple(pos.x + (Math.random() - 0.5) * 30, pos.y + 10);
                }
            }
        }
        
        requestAnimationFrame(() => this.animateRain());
    },
    
    // ==========================================
    // 가뭄 VFX (옵션)
    // ==========================================
    startDroughtVFX() {
        if (!this.app) return;
        
        // 컨테이너 생성
        this.vfxContainer = new PIXI.Container();
        this.vfxContainer.zIndex = 1000;
        this.app.stage.addChild(this.vfxContainer);
        
        // 노란/주황 오버레이
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0xffaa44, 0.15);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        this.vfxContainer.addChild(overlay);
        
        // 아지랑이 효과 (열기)
        this.createHeatWaves();
        
        // 시작 효과
        if (typeof CombatEffects !== 'undefined') {
            CombatEffects.screenFlash('#ffaa44', 300, 0.3);
        }
    },
    
    createHeatWaves() {
        // 아지랑이 파티클
        for (let i = 0; i < 20; i++) {
            const heat = new PIXI.Graphics();
            heat.beginFill(0xffcc88, 0.1);
            heat.drawEllipse(0, 0, 30 + Math.random() * 40, 5);
            heat.endFill();
            
            heat.x = Math.random() * this.app.screen.width;
            heat.y = this.app.screen.height - 50 - Math.random() * 100;
            
            this.vfxContainer.addChild(heat);
            
            // 위로 올라가며 흔들리기
            gsap.to(heat, {
                y: heat.y - 200,
                x: heat.x + (Math.random() - 0.5) * 100,
                alpha: 0,
                duration: 3 + Math.random() * 2,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }
    },
    
    // ==========================================
    // VFX 정지
    // ==========================================
    stopAllVFX() {
        this.rainAnimating = false;
        
        // 사운드 정지
        if (typeof SoundSystem !== 'undefined') {
            SoundSystem.stopLoop?.('rain');
        }
        
        // 컨테이너 페이드아웃 후 제거
        if (this.vfxContainer && !this.vfxContainer.destroyed) {
            gsap.to(this.vfxContainer, {
                alpha: 0,
                duration: 1,
                onComplete: () => {
                    if (this.vfxContainer && !this.vfxContainer.destroyed) {
                        this.app?.stage?.removeChild(this.vfxContainer);
                        this.vfxContainer.destroy({ children: true });
                    }
                    this.vfxContainer = null;
                    this.rainDrops = [];
                    this.splashes = [];
                    this.ripples = [];
                }
            });
        }
    },
    
    // ==========================================
    // UI 표시
    // ==========================================
    // ==========================================
    // 환경 UI - 다크소울 스타일
    // ==========================================
    showEnvironmentUI() {
        // 기존 UI 제거
        this.hideEnvironmentUI();
        
        // 상단 우측 그룹에 추가 (turn-box 아래)
        const topRightGroup = document.getElementById('top-right-group');
        if (!topRightGroup) {
            console.warn('[EnvironmentSystem] top-right-group 없음!');
            return;
        }
        
        const ui = document.createElement('div');
        ui.id = 'environment-indicator';
        ui.style.cssText = `
            background: linear-gradient(180deg, rgba(20,15,10,0.95) 0%, rgba(10,8,5,0.9) 100%);
            color: #c4b59d;
            padding: 6px 14px;
            font-family: 'Cinzel', 'Times New Roman', serif;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 1px solid rgba(120,100,70,0.4);
            box-shadow: 
                inset 0 1px 0 rgba(255,255,255,0.05),
                0 2px 8px rgba(0,0,0,0.5);
        `;
        
        // 환경 타입별 스타일
        let iconStyle = '';
        let nameText = '';
        let accentColor = '';
        
        if (this.activeEnvironment === 'rain') {
            iconStyle = 'color: #6699cc; text-shadow: 0 0 6px rgba(100,150,200,0.5);';
            nameText = 'RAIN';
            accentColor = '#7799bb';
        } else if (this.activeEnvironment === 'drought') {
            iconStyle = 'color: #cc8844; text-shadow: 0 0 6px rgba(200,120,60,0.5);';
            nameText = 'DROUGHT';
            accentColor = '#bb8855';
        }
        
        ui.innerHTML = `
            <span style="font-size: 14px; ${iconStyle}">${this.activeEnvironment === 'rain' ? '◈' : '◇'}</span>
            <span style="color: ${accentColor}; text-transform: uppercase;">${nameText}</span>
            <span style="
                color: #888;
                font-size: 11px;
                padding-left: 6px;
                border-left: 1px solid rgba(100,80,60,0.3);
            " class="env-turns">${this.remainingTurns}</span>
        `;
        
        // 페이드인 애니메이션
        ui.style.opacity = '0';
        ui.style.transform = 'translateY(-5px)';
        
        topRightGroup.appendChild(ui);
        
        // 애니메이션
        requestAnimationFrame(() => {
            ui.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            ui.style.opacity = '1';
            ui.style.transform = 'translateY(0)';
        });
    },
    
    updateEnvironmentUI() {
        const ui = document.getElementById('environment-indicator');
        if (!ui) return;
        
        const turnSpan = ui.querySelector('.env-turns');
        if (turnSpan) {
            turnSpan.textContent = this.remainingTurns;
            
            // 턴 감소 시 펄스 효과
            turnSpan.style.transform = 'scale(1.3)';
            turnSpan.style.color = '#fff';
            setTimeout(() => {
                turnSpan.style.transition = 'transform 0.3s ease, color 0.3s ease';
                turnSpan.style.transform = 'scale(1)';
                turnSpan.style.color = '#888';
            }, 50);
        }
    },
    
    hideEnvironmentUI() {
        const ui = document.getElementById('environment-indicator');
        if (ui) {
            ui.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            ui.style.opacity = '0';
            ui.style.transform = 'translateY(-5px)';
            setTimeout(() => ui.remove(), 300);
        }
    }
};

console.log('[EnvironmentSystem] 환경 효과 시스템 로드 완료');
