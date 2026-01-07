// =====================================================
// DDOOFloater - 플로팅 텍스트/숫자 시스템
// 데미지, 회복, 상태 텍스트 등 떠다니는 UI 요소 관리
// =====================================================

const DDOOFloater = {
    
    // ==================== 데미지 폰트 프리셋 ====================
    // 다크소울 스타일 (기존 인게임과 동일)
    
    styles: {
        // 일반 데미지 - 진한 빨강
        damage: {
            color: '#cc2222',
            stroke: '#000000',
            fontSize: 32,
            fontFamily: 'Cinzel, Times New Roman, serif',
            prefix: '-',
            animation: 'default'
        },
        // 회복 - 초록
        heal: {
            color: '#44ff88',
            stroke: '#002200',
            fontSize: 30,
            prefix: '+',
            icon: '💚',
            animation: 'default'
        },
        // 크리티컬 - 금색 + 빨강, 특수 연출
        critical: {
            color: '#aa1111',
            stroke: '#000000',
            fontSize: 48,
            fontFamily: 'Cinzel, serif',
            labelColor: '#d4a857',
            label: '💥 CRITICAL!',
            animation: 'critical'
        },
        // 방어 - 푸른 강철
        block: {
            color: '#5a9fd4',
            stroke: '#000000',
            fontSize: 28,
            icon: '🛡️',
            animation: 'block'
        },
        // 출혈 - 어두운 핏빛
        bleed: {
            color: '#8b1a1a',
            stroke: '#000000',
            fontSize: 28,
            icon: '🩸',
            prefix: '-',
            animation: 'default'
        },
        // 가시 - 독의 초록
        thorn: {
            color: '#2d8a4e',
            stroke: '#000000',
            fontSize: 28,
            icon: '🌵',
            prefix: '-',
            animation: 'default'
        },
        // 마법 데미지 - 보라
        magic: {
            color: '#a855f7',
            stroke: '#000000',
            fontSize: 30,
            icon: '✨',
            prefix: '-',
            animation: 'default'
        },
        // 자해 데미지 - 회색빨강
        self: {
            color: '#ff6666',
            stroke: '#000000',
            fontSize: 26,
            prefix: '-',
            animation: 'default'
        },
        // MISS
        miss: {
            color: '#888888',
            stroke: '#222222',
            fontSize: 24,
            text: 'MISS',
            animation: 'miss'
        },
        // 독 - 연두
        poison: {
            color: '#88ff88',
            stroke: '#004400',
            fontSize: 26,
            icon: '☠️',
            prefix: '-',
            animation: 'default'
        },
        // 화상 - 주황
        burn: {
            color: '#ff8844',
            stroke: '#441100',
            fontSize: 26,
            icon: '🔥',
            prefix: '-',
            animation: 'default'
        },
        // 경험치
        exp: {
            color: '#ffaa00',
            stroke: '#442200',
            fontSize: 22,
            prefix: '+',
            suffix: ' EXP',
            animation: 'float'
        },
        // 골드
        gold: {
            color: '#ffdd44',
            stroke: '#443300',
            fontSize: 22,
            icon: '💰',
            prefix: '+',
            suffix: ' G',
            animation: 'float'
        },
        // 상태이상 텍스트
        stun: {
            color: '#ffff00',
            stroke: '#444400',
            fontSize: 24,
            text: '😵 STUN!',
            animation: 'status'
        },
        weak: {
            color: '#ff8888',
            stroke: '#440000',
            fontSize: 24,
            text: '💔 약화!',
            animation: 'status'
        },
        vulnerable: {
            color: '#a855f7',
            stroke: '#220044',
            fontSize: 24,
            text: '💔 취약!',
            animation: 'status'
        }
    },
    
    // ==================== 메인 API ====================
    
    /**
     * 플로팅 텍스트 표시 (PixiJS)
     * @param {PIXI.Container} parent - 부모 컨테이너
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     * @param {number|string} value - 값 또는 텍스트
     * @param {string} type - 타입
     * @param {Object} options - 추가 옵션
     */
    show(parent, x, y, value, type = 'damage', options = {}) {
        if (!parent) return null;
        
        const preset = this.styles[type] || this.styles.damage;
        const style = { ...preset, ...options };
        
        // 크리티컬은 특수 처리
        if (style.animation === 'critical') {
            return this._showCritical(parent, x, y, value, style);
        }
        
        // 텍스트 내용
        let displayText = style.text || 
            `${style.icon ? style.icon + ' ' : ''}${style.prefix || ''}${value}${style.suffix || ''}`;
        
        // 데미지 크기에 따른 폰트 크기 조절
        const intensity = Math.min(Math.abs(value) / 20, 1.5);
        const fontSize = (style.fontSize || 28) * (1 + intensity * 0.2);
        
        const textStyle = new PIXI.TextStyle({
            fontFamily: style.fontFamily || 'Arial Black, Arial Bold, sans-serif',
            fontSize: fontSize,
            fontWeight: 'bold',
            fill: style.color || '#ffffff',
            stroke: { color: style.stroke || '#000000', width: 5 },
            dropShadow: {
                color: '#000000',
                blur: 3,
                angle: Math.PI / 4,
                distance: 3
            },
            letterSpacing: 1
        });
        
        const text = new PIXI.Text({ text: displayText, style: textStyle });
        text.anchor.set(0.5, 0.5);
        text.x = x + (Math.random() - 0.5) * 30;
        text.y = y;
        text.alpha = 1;
        text.zIndex = 1000;
        
        parent.addChild(text);
        
        // 애니메이션 타입별 처리
        this._animate(text, y, style.animation || 'default', parent);
        
        return text;
    },
    
    /**
     * 크리티컬 데미지 특수 연출
     */
    _showCritical(parent, x, y, value, style) {
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.zIndex = 1001;
        
        // 라벨 (CRITICAL!)
        const labelStyle = new PIXI.TextStyle({
            fontFamily: 'Cinzel, serif',
            fontSize: 18,
            fontWeight: '600',
            fill: style.labelColor || '#d4a857',
            stroke: { color: '#000000', width: 3 },
            letterSpacing: 4
        });
        const label = new PIXI.Text({ text: style.label || '💥 CRITICAL!', style: labelStyle });
        label.anchor.set(0.5, 0.5);
        label.y = -30;
        container.addChild(label);
        
        // 값
        const valueStyle = new PIXI.TextStyle({
            fontFamily: 'Cinzel, serif',
            fontSize: style.fontSize || 48,
            fontWeight: 'bold',
            fill: style.color || '#aa1111',
            stroke: { color: '#000000', width: 6 },
            dropShadow: {
                color: '#000000',
                blur: 4,
                distance: 4
            }
        });
        const valueText = new PIXI.Text({ text: `${value}`, style: valueStyle });
        valueText.anchor.set(0.5, 0.5);
        valueText.y = 10;
        container.addChild(valueText);
        
        parent.addChild(container);
        
        // 크리티컬 애니메이션
        const tl = gsap.timeline({
            onComplete: () => {
                parent.removeChild(container);
                container.destroy({ children: true });
            }
        });
        
        // 등장 (펑!)
        tl.fromTo(container.scale, { x: 0.3, y: 0.3 }, { x: 1.2, y: 1.2, duration: 0.15, ease: 'back.out(3)' });
        tl.to(container.scale, { x: 1, y: 1, duration: 0.1, ease: 'power2.out' });
        
        // 흔들림
        tl.to(container, { x: x + 5, duration: 0.03, repeat: 8, yoyo: true, ease: 'none' }, 0.1);
        
        // 위로 + 페이드
        tl.to(container, { y: y - 80, duration: 1.2, ease: 'power2.out' }, 0.3);
        tl.to(container, { alpha: 0, duration: 0.4 }, 0.9);
        
        return container;
    },
    
    /**
     * 텍스트 애니메이션
     */
    _animate(text, startY, animType, parent) {
        const tl = gsap.timeline({
            onComplete: () => {
                parent.removeChild(text);
                text.destroy();
            }
        });
        
        switch (animType) {
            case 'block':
                // 방어: 튀어오름 + 빠르게 사라짐
                tl.fromTo(text.scale, { x: 0.5, y: 0.5 }, { x: 1.1, y: 1.1, duration: 0.1, ease: 'back.out(2)' });
                tl.to(text.scale, { x: 1, y: 1, duration: 0.1 });
                tl.to(text, { y: startY - 40, alpha: 0, duration: 0.6, ease: 'power2.out' }, 0.1);
                break;
                
            case 'miss':
                // 미스: 작게 + 옆으로 흘러감
                tl.fromTo(text, { alpha: 0.5 }, { alpha: 1, duration: 0.1 });
                tl.to(text, { 
                    x: text.x + (Math.random() > 0.5 ? 50 : -50),
                    y: startY - 30,
                    alpha: 0,
                    duration: 0.7,
                    ease: 'power2.out'
                }, 0);
                break;
                
            case 'float':
                // 플로트: 천천히 위로
                tl.fromTo(text.scale, { x: 0.8, y: 0.8 }, { x: 1, y: 1, duration: 0.2 });
                tl.to(text, { y: startY - 80, duration: 1.5, ease: 'power1.out' }, 0);
                tl.to(text, { alpha: 0, duration: 0.5 }, 1);
                break;
                
            case 'status':
                // 상태: 확대 후 흔들림
                tl.fromTo(text.scale, { x: 0.3, y: 0.3 }, { x: 1.3, y: 1.3, duration: 0.15, ease: 'back.out(2)' });
                tl.to(text.scale, { x: 1, y: 1, duration: 0.1 });
                tl.to(text, { x: text.x + 3, duration: 0.05, repeat: 4, yoyo: true }, 0.2);
                tl.to(text, { y: startY - 50, alpha: 0, duration: 0.8, ease: 'power2.out' }, 0.4);
                break;
                
            default:
                // 기본: 팝 + 위로 + 페이드
                tl.fromTo(text.scale, { x: 0.3, y: 0.3 }, { x: 1.1, y: 1.1, duration: 0.12, ease: 'back.out(3)' });
                tl.to(text.scale, { x: 1, y: 1, duration: 0.08 });
                tl.to(text, { y: startY - 60, duration: 0.8, ease: 'power2.out' }, 0.1);
                tl.to(text, { alpha: 0, duration: 0.3 }, 0.6);
        }
    },
    
    // ==================== 편의 함수 ====================
    
    /**
     * 캐릭터 위에 표시
     */
    showOnCharacter(container, value, type = 'damage', options = {}) {
        if (!container?.parent) return null;
        
        const x = container.x;
        const y = container.y - 80;
        
        return this.show(container.parent, x, y, value, type, options);
    },
    
    /**
     * 콤보 (연속 히트)
     */
    showCombo(parent, x, y, hits, interval = 120) {
        hits.forEach((hit, i) => {
            setTimeout(() => {
                const offsetY = y - (i * 20);
                const offsetX = x + (Math.random() - 0.5) * 30;
                this.show(parent, offsetX, offsetY, hit.value, hit.type || 'damage');
            }, i * interval);
        });
    },
    
    /**
     * 커스텀 스타일 추가
     */
    addStyle(name, style) {
        this.styles[name] = style;
    },
    
    // ==================== DOM 버전 (PixiJS 없을 때) ====================
    
    /**
     * DOM 기반 플로팅 텍스트 (기존 showDamagePopup 호환)
     */
    showDOM(element, value, type = 'damage', options = {}) {
        const preset = this.styles[type] || this.styles.damage;
        const style = { ...preset, ...options };
        
        const popup = document.createElement('div');
        popup.className = `damage-popup ${type}`;
        
        // 텍스트 내용
        let displayText = style.text || 
            `${style.icon ? style.icon + ' ' : ''}${style.prefix || ''}${value}${style.suffix || ''}`;
        
        // 크리티컬 특수 처리
        if (type === 'critical') {
            popup.className = 'damage-popup critical-damage';
            popup.innerHTML = `
                <span class="crit-label">${style.label || '💥 CRITICAL!'}</span>
                <span class="crit-value">${value}</span>
            `;
        } else {
            popup.innerHTML = `<span class="dmg-value">${displayText}</span>`;
        }
        
        // 위치 계산
        let centerX, topY;
        
        if (element?.getBoundingClientRect) {
            const rect = element.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            topY = rect.top - 20;
        } else if (typeof element === 'object' && element.x !== undefined) {
            centerX = element.x;
            topY = element.y - 20;
        }
        
        if (!centerX) return;
        
        const randomOffsetX = (Math.random() - 0.5) * 40;
        popup.style.left = `${centerX + randomOffsetX}px`;
        popup.style.top = `${topY}px`;
        
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), type === 'critical' ? 1500 : 1000);
        
        return popup;
    }
};

// 전역 노출
window.DDOOFloater = DDOOFloater;

console.log('[DDOOFloater] ✅ 플로팅 텍스트 시스템 로드됨');
