// ==========================================
// Shadow Deck - 그림자 분신 시스템
// ==========================================

const ShadowCloneSystem = {
    clones: [],
    cloneElements: [],
    animationFrameId: null,
    isActive: false,
    maxClones: 3,
    defaultDamageMultiplier: 0.5,
    playerAttacking: false,    // 플레이어가 공격 중인지 여부
    
    init() {
        this.clones = [];
        this.cloneElements = [];
        this.isActive = false;
        this.playerAttacking = false;
        this.removeAllCloneElements();
    },
    
    summonClone(duration = 3) {
        if (this.clones.length >= this.maxClones) return false;
        const cloneIndex = this.clones.length;
        const clone = {
            id: Date.now() + Math.random(),
            index: cloneIndex,
            duration: duration,
            hp: 5,              // 분신 HP (5 데미지 받으면 소멸)
            maxHp: 5,
            damageMultiplier: this.defaultDamageMultiplier,
            bobOffset: cloneIndex * (Math.PI * 2 / 3)
        };
        this.clones.push(clone);
        this.createCloneElement(clone);
        if (!this.isActive) {
            this.isActive = true;
            this.startAnimation();
        }
        return true;
    },
    
    // 분신이 데미지를 받음 (몬스터 우선 공격 대상)
    damageClone(damage) {
        if (this.clones.length === 0) return { absorbed: false, remaining: damage };
        
        // 첫 번째 분신이 데미지를 받음
        const clone = this.clones[0];
        const cloneEl = this.cloneElements[0];
        
        // 데미지 흡수
        const absorbedDamage = Math.min(clone.hp, damage);
        clone.hp -= absorbedDamage;
        const remainingDamage = damage - absorbedDamage;
        
        // 피격 이펙트
        if (cloneEl) {
            // 타격감
            if (typeof HitEffects !== 'undefined') {
                HitEffects.cloneHit(cloneEl, absorbedDamage);
            }
            
            // HP 표시 업데이트
            const hpBar = cloneEl.querySelector('.clone-hp-bar');
            const hpText = cloneEl.querySelector('.clone-hp-text');
            if (hpBar) {
                hpBar.style.width = `${(clone.hp / clone.maxHp) * 100}%`;
                if (clone.hp <= 2) {
                    hpBar.style.background = 'linear-gradient(to right, #ef4444, #f87171)';
                }
            }
            if (hpText) {
                hpText.textContent = `${clone.hp}/${clone.maxHp}`;
            }
            
            // 데미지 팝업
            if (typeof showDamagePopup === 'function') {
                showDamagePopup(cloneEl, absorbedDamage, 'damage');
            }
            
            // 피격 플래시
            cloneEl.style.filter = 'brightness(2) saturate(2)';
            setTimeout(() => {
                cloneEl.style.filter = '';
            }, 150);
        }
        
        // 분신 사망 체크
        if (clone.hp <= 0) {
            addLog(`👤 분신이 파괴되었습니다!`, 'warning');
            this.destroyClone(0);
        } else {
            addLog(`👤 분신이 ${absorbedDamage} 데미지를 대신 받았습니다! (HP: ${clone.hp}/${clone.maxHp})`, 'info');
        }
        
        return { absorbed: true, absorbedDamage, remaining: remainingDamage };
    },
    
    // 분신 파괴 (HP 0)
    destroyClone(index) {
        if (index < 0 || index >= this.clones.length) return;
        
        const clone = this.clones[index];
        const el = this.cloneElements[index];
        
        if (el) {
            // 파괴 이펙트
            const rect = el.getBoundingClientRect();
            if (typeof VFX !== 'undefined') {
                VFX.impact(rect.left + rect.width/2, rect.top + rect.height/2, { 
                    color: '#a855f7', 
                    size: 150 
                });
                VFX.smoke(rect.left + rect.width/2, rect.top + rect.height/2, {
                    color: '#7c3aed',
                    size: 100,
                    count: 20,
                    duration: 400
                });
            }
            
            // 파괴 애니메이션
            el.style.transition = 'all 0.3s ease-out';
            el.style.transform = 'translate(-50%, -50%) scale(1.5)';
            el.style.opacity = '0';
            el.style.filter = 'brightness(3) blur(10px)';
            
            setTimeout(() => el.remove(), 300);
        }
        
        // 배열에서 제거
        this.clones.splice(index, 1);
        this.cloneElements.splice(index, 1);
        
        // 인덱스 재정렬
        this.clones.forEach((c, i) => c.index = i);
        
        // 모든 분신 소멸 시 비활성화
        if (this.clones.length === 0) {
            this.isActive = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        }
    },
    
    // 분신이 있는지 확인 (몬스터 AI용)
    hasClones() {
        return this.clones.length > 0;
    },
    
    // 첫 번째 분신 요소 가져오기 (타겟팅용)
    getFirstCloneElement() {
        return this.cloneElements.length > 0 ? this.cloneElements[0] : null;
    },
    
    createCloneElement(clone) {
        let spriteUrl = 'hero.png';
        if (typeof JobSystem !== 'undefined') {
            spriteUrl = JobSystem.getCurrentSprite() || 'hero.png';
        }
        const el = document.createElement('div');
        el.className = 'shadow-clone';
        el.dataset.cloneId = clone.id;
        el.innerHTML = `
            <div class="clone-aura"></div>
            <div class="clone-body"><img src="${spriteUrl}" alt="Shadow" class="clone-sprite"></div>
            <div class="clone-info">
                <div class="clone-hp-bar-container">
                    <div class="clone-hp-bar" style="width: ${(clone.hp / clone.maxHp) * 100}%"></div>
                </div>
                <div class="clone-hp-text">${clone.hp}/${clone.maxHp}</div>
                <div class="clone-status-display">
                    <div class="status-badge status-clone-duration">
                        <span class="status-icon">👤</span>
                        <span class="status-value">${clone.duration}</span>
                    </div>
                </div>
            </div>
        `;
        el.style.opacity = '0';
        document.body.appendChild(el);
        
        const playerEl = document.getElementById('player');
        // 분신 배치 (플레이어 왼쪽에 삼각형 대형)
        const formations = [
            { x: -160, y: 20 },    // 첫 번째 분신: 왼쪽 아래
            { x: -130, y: -50 },   // 두 번째 분신: 왼쪽 위
            { x: -200, y: -20 }    // 세 번째 분신: 더 왼쪽
        ];
        const pos = formations[clone.index] || formations[0];
        
        // 소환 이펙트
        if (playerEl && typeof VFX !== 'undefined') {
            const basePos = this.getPlayerBasePosition(playerEl);
            if (!basePos) return;
            const spawnX = basePos.x + pos.x;
            const spawnY = basePos.y + pos.y;
            
            // 보라색 연기 + 스파크
            VFX.smoke(spawnX, spawnY, { 
                color: '#7c3aed', 
                size: 120, 
                count: 20, 
                duration: 600 
            });
            VFX.sparks(spawnX, spawnY, { 
                color: '#a855f7', 
                count: 15, 
                speed: 150 
            });
            
            // 충격파
            setTimeout(() => {
                VFX.shockwave(spawnX, spawnY, { 
                    color: '#8b5cf6', 
                    size: 100, 
                    duration: 400 
                });
            }, 200);
        }
        
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.6s ease-out';
            el.style.opacity = '1';
        });
        this.cloneElements.push(el);
    },
    
    // 플레이어의 기본 위치 가져오기 (CSS transform 무시)
    getPlayerBasePosition(playerEl) {
        if (!playerEl) return null;
        
        // offsetParent 기준 위치 사용 (transform 영향 안 받음)
        const parent = playerEl.offsetParent || document.body;
        const parentRect = parent.getBoundingClientRect();
        
        // 플레이어의 고정 위치 계산
        const x = parentRect.left + playerEl.offsetLeft + playerEl.offsetWidth / 2;
        const y = parentRect.top + playerEl.offsetTop + playerEl.offsetHeight / 2;
        
        return { x, y };
    },
    
    startAnimation() {
        const animate = () => {
            if (!this.isActive || this.clones.length === 0) return;
            const playerEl = document.getElementById('player');
            if (!playerEl) { this.animationFrameId = requestAnimationFrame(animate); return; }
            
            const time = Date.now() * 0.001;
            
            // 플레이어의 기본 위치 가져오기 (CSS transform 무시)
            const basePos = this.getPlayerBasePosition(playerEl);
            if (!basePos) {
                this.animationFrameId = requestAnimationFrame(animate);
                return;
            }
            
            // 플레이어 공격 중이면 분신 위치 업데이트 하지 않음 (제자리 고정)
            if (this.playerAttacking) {
                this.animationFrameId = requestAnimationFrame(animate);
                return;
            }
            
            const centerX = basePos.x;
            const centerY = basePos.y;
            
            // 분신 배치 (플레이어 왼쪽에 삼각형 대형)
            const formations = [
                { x: -160, y: 20, scale: 1.0 },   // 첫 번째 분신
                { x: -130, y: -50, scale: 0.95 }, // 두 번째 분신 (약간 작게)
                { x: -200, y: -20, scale: 0.9 }   // 세 번째 분신 (더 작게)
            ];
            
            this.clones.forEach((clone, index) => {
                // 이 분신이 공격 중이면 스킵
                if (clone.isAttacking) return;
                
                const formation = formations[index] || formations[0];
                // 부드러운 상하 움직임
                const bobY = Math.sin(time * 1.5 + clone.bobOffset) * 8;
                // 미세한 좌우 흔들림
                const swayX = Math.sin(time * 0.8 + clone.bobOffset * 2) * 3;
                
                const x = centerX + formation.x + swayX;
                const y = centerY + formation.y + bobY;
                const el = this.cloneElements[index];
                if (el) {
                    el.style.left = `${x}px`;
                    el.style.top = `${y}px`;
                    el.style.transform = `translate(-50%, -50%) scale(${formation.scale})`;
                    
                    // 홈 위치 저장 (공격 시 복귀용)
                    clone.homeX = x;
                    clone.homeY = y;
                }
            });
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    },
    
    onAttackCardPlayed(damage, targetEnemy, targetEl) {
        if (this.clones.length === 0) return;
        if (!targetEnemy || !targetEl) return;
        
        const targetRect = targetEl.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        // 분신들이 시간차로 곡선 공격
        this.clones.forEach((clone, index) => {
            const attackDelay = index * 150; // 150ms 간격
            
            setTimeout(() => {
                if (!targetEnemy || targetEnemy.hp <= 0) return;
                
                const cloneEl = this.cloneElements[index];
                if (!cloneEl) return;
                
                const cloneDamage = Math.floor(damage * clone.damageMultiplier);
                if (cloneDamage <= 0) return;
                
                // 이 분신 공격 중 표시
                clone.isAttacking = true;
                
                // 분신 홈 위치 사용 (저장된 위치가 없으면 현재 위치)
                const startX = clone.homeX || parseFloat(cloneEl.style.left);
                const startY = clone.homeY || parseFloat(cloneEl.style.top);
                
                // ===== 랜덤 곡선 경로 계산 =====
                const randomArcHeight = -80 - Math.random() * 120;
                const randomOffsetX = (Math.random() - 0.5) * 100;
                const randomLandingOffset = (Math.random() - 0.5) * 60;
                const randomRotation = -30 + Math.random() * 60;
                
                const midX = (startX + targetX) / 2 + randomOffsetX;
                const midY = Math.min(startY, targetY) + randomArcHeight;
                
                const landX = targetX + randomLandingOffset;
                const landY = targetY;
                
                // 잔상 효과 생성
                this.createAfterImage(cloneEl, startX, startY);
                
                // 1단계: 위로 호를 그리며 점프
                cloneEl.style.transition = 'all 0.2s ease-out';
                cloneEl.style.left = `${midX}px`;
                cloneEl.style.top = `${midY}px`;
                cloneEl.style.transform = `translate(-50%, -50%) scale(1.2) rotate(${randomRotation}deg)`;
                cloneEl.style.filter = 'brightness(1.5) saturate(2) drop-shadow(0 0 20px #a855f7)';
                cloneEl.style.opacity = '1';
                
                // 2단계: 적을 향해 급강하 공격
                setTimeout(() => {
                    this.createAfterImage(cloneEl, midX, midY);
                    
                    const diveRotation = randomRotation + 30;
                    
                    cloneEl.style.transition = 'all 0.15s ease-in';
                    cloneEl.style.left = `${landX}px`;
                    cloneEl.style.top = `${landY}px`;
                    cloneEl.style.transform = `translate(-50%, -50%) scale(1.3) rotate(${diveRotation}deg)`;
                    cloneEl.style.filter = 'brightness(2) saturate(3) drop-shadow(0 0 30px #c084fc)';
                    
                    // VFX 슬래시 + 스파크
                    setTimeout(() => {
                        const slashAngle1 = Math.random() * 360;
                        const slashAngle2 = slashAngle1 + 60 + Math.random() * 60;
                        
                        if (typeof VFX !== 'undefined') {
                            VFX.slash(targetX, targetY, { 
                                color: '#a855f7', 
                                length: 100 + Math.random() * 40, 
                                width: 5 + Math.random() * 3,
                                angle: slashAngle1
                            });
                            VFX.slash(targetX, targetY, { 
                                color: '#c084fc', 
                                length: 80 + Math.random() * 40, 
                                width: 4 + Math.random() * 2,
                                angle: slashAngle2
                            });
                            VFX.sparks(targetX, targetY, { 
                                color: '#e879f9', 
                                count: 10 + Math.floor(Math.random() * 8), 
                                speed: 250 + Math.random() * 100 
                            });
                            VFX.impact(targetX, targetY, {
                                color: '#a855f7',
                                size: 60 + Math.random() * 40
                            });
                        }
                        
                        // 데미지 적용
                        if (targetEnemy.hp > 0) {
                            targetEnemy.hp = Math.max(0, targetEnemy.hp - cloneDamage);
                            if (typeof showDamagePopup === 'function') {
                                showDamagePopup(targetEl, cloneDamage, 'damage');
                            }
                            
                            if (typeof HitEffects !== 'undefined') {
                                HitEffects.cloneHit(targetEl, cloneDamage);
                            }
                            
                            if (typeof updateEnemiesUI === 'function') updateEnemiesUI();
                            
                            if (targetEnemy.hp <= 0 && typeof checkEnemyDefeated === 'function') {
                                setTimeout(() => checkEnemyDefeated(), 100);
                            }
                        }
                        
                        // 공격 후 대기 자세
                        setTimeout(() => {
                            cloneEl.style.transition = 'all 0.2s ease-out';
                            cloneEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
                            cloneEl.style.filter = 'brightness(1) saturate(1.5) drop-shadow(0 0 15px #a855f7)';
                        }, 100);
                    }, 150);
                }, 200);
                
                // 3단계: 연막 터지면서 원래 자리로 순간이동
                setTimeout(() => {
                    const currentX = parseFloat(cloneEl.style.left);
                    const currentY = parseFloat(cloneEl.style.top);
                    
                    if (typeof VFX !== 'undefined') {
                        VFX.smoke(currentX, currentY, {
                            color: '#7c3aed',
                            size: 100,
                            count: 15,
                            duration: 300
                        });
                    }
                    
                    cloneEl.style.opacity = '0';
                    
                    setTimeout(() => {
                        cloneEl.style.transition = 'none';
                        cloneEl.style.left = `${startX}px`;
                        cloneEl.style.top = `${startY}px`;
                        cloneEl.style.transform = 'translate(-50%, -50%) scale(1)';
                        cloneEl.style.filter = 'brightness(0.7) saturate(1.2)';
                        
                        if (typeof VFX !== 'undefined') {
                            VFX.smoke(startX, startY, {
                                color: '#8b5cf6',
                                size: 80,
                                count: 10,
                                duration: 250
                            });
                        }
                        
                        cloneEl.style.transition = 'opacity 0.1s';
                        cloneEl.style.opacity = '0.85';
                        
                        clone.isAttacking = false;
                    }, 50);
                }, 900);
                
            }, attackDelay);
        });
        
        // 로그
        const totalCloneDamage = this.clones.reduce((sum, c) => sum + Math.floor(damage * c.damageMultiplier), 0);
        if (typeof addLog === 'function') {
            addLog(`👥 분신 ${this.clones.length}체 따라 공격! (${totalCloneDamage} 데미지)`, 'damage');
        }
    },
    
    // 잔상 효과 생성
    createAfterImage(cloneEl, x, y) {
        const afterImage = cloneEl.cloneNode(true);
        afterImage.style.position = 'fixed';
        afterImage.style.left = `${x}px`;
        afterImage.style.top = `${y}px`;
        afterImage.style.opacity = '0.5';
        afterImage.style.filter = 'brightness(0.5) saturate(2) blur(2px)';
        afterImage.style.pointerEvents = 'none';
        afterImage.style.zIndex = '49';
        afterImage.style.transition = 'opacity 0.2s ease-out';
        document.body.appendChild(afterImage);
        
        requestAnimationFrame(() => {
            afterImage.style.opacity = '0';
        });
        setTimeout(() => afterImage.remove(), 200);
    },
    
    sacrificeClone() {
        if (this.clones.length === 0) return null;
        const clone = this.clones.pop();
        const el = this.cloneElements.pop();
        if (el) {
            const rect = el.getBoundingClientRect();
            if (typeof VFX !== 'undefined') {
                VFX.impact(rect.left + rect.width/2, rect.top + rect.height/2, { color: '#4a00b4', size: 150 });
            }
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 200);
        }
        return clone;
    },
    
    onTurnEnd() {
        const expiredIndices = [];
        this.clones.forEach((clone, index) => {
            clone.duration--;
            const el = this.cloneElements[index];
            if (el) {
                const durationEl = el.querySelector('.status-value');
                if (durationEl) durationEl.textContent = clone.duration;
                
                const badge = el.querySelector('.status-clone-duration');
                if (badge && clone.duration <= 1) {
                    badge.classList.add('status-warning');
                }
            }
            if (clone.duration <= 0) expiredIndices.push(index);
        });
        for (let i = expiredIndices.length - 1; i >= 0; i--) {
            this.removeClone(expiredIndices[i]);
        }
        if (expiredIndices.length > 0) addLog(`👤 분신 ${expiredIndices.length}개 소멸`, 'info');
    },
    
    removeClone(index) {
        if (index < 0 || index >= this.clones.length) return;
        this.clones.splice(index, 1);
        const el = this.cloneElements.splice(index, 1)[0];
        if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
    },
    
    clear() {
        this.clones = [];
        this.isActive = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.removeAllCloneElements();
    },
    
    removeAllCloneElements() {
        this.cloneElements.forEach(el => el?.remove());
        this.cloneElements = [];
        document.querySelectorAll('.shadow-clone').forEach(el => el.remove());
    },
    
    getCloneCount() { return this.clones.length; }
};

window.ShadowCloneSystem = ShadowCloneSystem;

console.log('[Card ShadowClone] 그림자 분신 시스템 로드됨');

