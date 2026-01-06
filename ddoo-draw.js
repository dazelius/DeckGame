// =====================================================
// DDOO Draw - Canvas 2D 파티클 렌더링 함수
// =====================================================

const DDOODraw = {
    // 트레일 도트 렌더링
    drawTrailDot(ctx, p, alpha) {
        if (!ctx) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = (p.size || 5) * (1 - alpha * 0.3);
        if (size <= 0) return;
        
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = p.color || '#60a5fa';
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // 에너지 오브 파티클
    drawEnergyOrbParticle(ctx, p, alpha, progress) {
        if (!ctx) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = (p.startSize || 20) * (1 + progress * 0.2);
        const color = p.color || '#fbbf24';
        
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // 전기 파티클
    drawElectricParticle(ctx, p, alpha, progress) {
        if (!ctx) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const length = p.length || 30;
        const color = p.color || '#60a5fa';
        const segments = p.segments || 5;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = (p.width || 2) * alpha;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        
        let currentX = p.x;
        let currentY = p.y;
        const angle = p.angle || 0;
        const rad = angle * Math.PI / 180;
        
        for (let i = 0; i < segments; i++) {
            const segLen = length / segments;
            const jitter = (Math.random() - 0.5) * 15;
            currentX += Math.cos(rad) * segLen + Math.sin(rad) * jitter;
            currentY += Math.sin(rad) * segLen - Math.cos(rad) * jitter;
            ctx.lineTo(currentX, currentY);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = (p.width || 2) * alpha * 0.5;
        ctx.stroke();
        
        ctx.restore();
    },
    
    // 웨이브 파티클
    drawWaveParticle(ctx, p, alpha, progress) {
        if (!ctx) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = (p.startSize || 30) + ((p.maxSize || 100) - (p.startSize || 30)) * progress;
        const color = p.color || '#60a5fa';
        const thickness = (p.thickness || 8) * (1 - progress * 0.7);
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.globalAlpha = alpha * (1 - progress * 0.5);
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        const startAngle = (p.startAngle || -90) * Math.PI / 180;
        const endAngle = (p.endAngle || 90) * Math.PI / 180;
        ctx.arc(p.x, p.y, size, startAngle, endAngle);
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = thickness * 0.4;
        ctx.globalAlpha = alpha * 0.6;
        ctx.stroke();
        
        ctx.restore();
    },
    
    // 별 파티클
    drawStarParticle(ctx, p, alpha, progress) {
        if (!ctx) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = (p.startSize || 15) * (1 - progress * 0.3);
        const color = p.color || '#fbbf24';
        const points = p.points || 4;
        const rotation = p.rotation || 0;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? size : size * 0.4;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
            else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // 혜성 파티클
    drawCometParticle(ctx, p, alpha, progress) {
        if (!ctx) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = (p.startSize || 10) * (1 - progress * 0.5);
        const color = p.color || '#fbbf24';
        const tailLength = p.tailLength || 40;
        const angle = Math.atan2(p.vy || 0, p.vx || 1);
        
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        const tailGrad = ctx.createLinearGradient(
            p.x - Math.cos(angle) * tailLength,
            p.y - Math.sin(angle) * tailLength,
            p.x, p.y
        );
        tailGrad.addColorStop(0, 'transparent');
        tailGrad.addColorStop(0.5, color + '44');
        tailGrad.addColorStop(1, color);
        
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = size * 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = alpha * 0.7;
        
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(angle) * tailLength, p.y - Math.sin(angle) * tailLength);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        
        const headGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 1.5);
        headGrad.addColorStop(0, '#ffffff');
        headGrad.addColorStop(0.4, color);
        headGrad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = headGrad;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // 검 궤적 아크 - 날렵한 버전
    drawSwordArcParticle(ctx, p, alpha, progress) {
        if (!ctx) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        // 크기 설정
        const radius = (p.radius || 60) * 2;
        const thickness = (p.thickness || 15) * 2;
        const dir = p.dir || 1;
        const color = p.color || '#ffffff';
        const glow = p.glow || '#60a5fa';
        
        const startAngle = (p.startAngle || -80) * Math.PI / 180;
        const endAngle = (p.endAngle || 80) * Math.PI / 180;
        
        // 애니메이션 진행
        const swingProgress = Math.min(1, progress * 3);  // 빠르게 펼쳐짐
        const fadeProgress = Math.max(0, (progress - 0.25) / 0.75);
        const currentEnd = startAngle + (endAngle - startAngle) * swingProgress;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        if (dir < 0) ctx.scale(-1, 1);
        
        // 두께가 끝으로 갈수록 얇아지는 효과
        const startThickness = thickness * 0.3;
        const midThickness = thickness * (1 - fadeProgress * 0.4);
        const endThickness = thickness * 0.1;
        
        // === 레이어 1: 외부 글로우 ===
        ctx.globalAlpha = alpha * 0.4 * (1 - fadeProgress);
        ctx.shadowColor = glow;
        ctx.shadowBlur = 30;
        
        // 테이퍼드 아크 (시작-중간-끝 두께 변화)
        this.drawTaperedArc(ctx, 0, 0, radius, startAngle, currentEnd, 
            startThickness * 2.5, midThickness * 2.5, endThickness * 2.5, glow + 'aa');
        
        // === 레이어 2: 메인 블레이드 ===
        ctx.globalAlpha = alpha * (1 - fadeProgress * 0.5);
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        
        this.drawTaperedArc(ctx, 0, 0, radius, startAngle, currentEnd,
            startThickness, midThickness, endThickness, color);
        
        // === 레이어 3: 밝은 코어 ===
        ctx.globalAlpha = alpha * 0.9 * (1 - fadeProgress);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        
        this.drawTaperedArc(ctx, 0, 0, radius, startAngle, currentEnd,
            startThickness * 0.3, midThickness * 0.4, endThickness * 0.2, '#ffffff');
        
        // === 레이어 4: 날카로운 엣지 라인 ===
        ctx.globalAlpha = alpha * 0.8 * (1 - fadeProgress);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.arc(0, 0, radius - midThickness * 0.3, startAngle, currentEnd);
        ctx.stroke();
        
        // === 레이어 5: 검기 끝 스파크 ===
        if (swingProgress > 0.6 && fadeProgress < 0.6) {
            const tipX = Math.cos(currentEnd) * radius;
            const tipY = Math.sin(currentEnd) * radius;
            
            ctx.globalAlpha = alpha * (1 - fadeProgress) * 0.9;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            
            // 끝점 밝은 점
            ctx.beginPath();
            ctx.arc(tipX, tipY, endThickness + 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 스파크 선
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                const sparkAngle = currentEnd + (i - 1) * 0.3;
                const sparkLen = thickness * 0.5;
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(
                    tipX + Math.cos(sparkAngle) * sparkLen,
                    tipY + Math.sin(sparkAngle) * sparkLen
                );
                ctx.stroke();
            }
        }
        
        // === 레이어 6: 모션 트레일 ===
        if (progress < 0.3) {
            ctx.shadowBlur = 0;
            
            for (let i = 1; i <= 3; i++) {
                ctx.globalAlpha = alpha * 0.25 * (1 - i * 0.25) * (1 - progress * 3);
                this.drawTaperedArc(ctx, 0, 0, radius - i * 5, 
                    startAngle, currentEnd - i * 0.08,
                    startThickness * 0.8, midThickness * 0.6, endThickness * 0.4, 
                    glow + '80');
            }
        }
        
        ctx.restore();
    },
    
    // 두께가 변하는 아크 그리기 헬퍼
    drawTaperedArc(ctx, cx, cy, radius, startAngle, endAngle, startWidth, midWidth, endWidth, color) {
        const segments = 24;
        const angleStep = (endAngle - startAngle) / segments;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        
        // 외곽 (위쪽)
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = startAngle + angleStep * i;
            // 두께 보간: 시작 → 중간(0.4) → 끝
            let w;
            if (t < 0.4) {
                w = startWidth + (midWidth - startWidth) * (t / 0.4);
            } else {
                w = midWidth + (endWidth - midWidth) * ((t - 0.4) / 0.6);
            }
            const x = cx + Math.cos(angle) * (radius + w / 2);
            const y = cy + Math.sin(angle) * (radius + w / 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        // 내곽 (아래쪽, 역순)
        for (let i = segments; i >= 0; i--) {
            const t = i / segments;
            const angle = startAngle + angleStep * i;
            let w;
            if (t < 0.4) {
                w = startWidth + (midWidth - startWidth) * (t / 0.4);
            } else {
                w = midWidth + (endWidth - midWidth) * ((t - 0.4) / 0.6);
            }
            const x = cx + Math.cos(angle) * (radius - w / 2);
            const y = cy + Math.sin(angle) * (radius - w / 2);
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
    },
    
    // 복셀 조각
    drawVoxelParticle(ctx, p, alpha, progress) {
        if (!ctx) return;
        
        const size = p.size || 8;
        if (!isFinite(size) || size <= 0) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        
        ctx.globalAlpha = alpha * (1 - progress * 0.3);
        
        ctx.fillStyle = p.color || '#888888';
        const halfSize = size / 2;
        ctx.fillRect(-halfSize, -halfSize, size, size);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-halfSize, -halfSize, size * 0.4, size * 0.4);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(halfSize * 0.2, halfSize * 0.2, size * 0.6, size * 0.6);
        
        if (progress < 0.3) {
            ctx.shadowColor = p.color || '#ffffff';
            ctx.shadowBlur = 10 * (1 - progress * 3);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(-halfSize, -halfSize, size, size);
        }
        
        ctx.restore();
    },
    
    // 연기 파티클
    drawSmokeParticle(ctx, p, alpha) {
        if (!ctx) return;
        
        const size = p.size || 20;
        if (!isFinite(size) || size <= 0) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, p.color || '#333333');
        gradient.addColorStop(0.5, (p.color || '#333333') + 'aa');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // 심볼 파티클
    drawSymbolParticle(ctx, p, alpha, progress) {
        if (!ctx) return;
        
        const size = p.size || 30;
        if (!isFinite(size) || size <= 0) return;
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.font = size + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        
        ctx.fillText(p.symbol || '\u2b50', p.x, p.y);
        ctx.restore();
    },
    
    // 슬래시 파티클 - 날렵한 검기 이펙트
    drawSlashParticle(ctx, p, alpha, progress) {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startLength) || p.startLength <= 0) {
            return;
        }
        
        const rad = (p.angle || 0) * Math.PI / 180;
        const len = Math.max(1, p.startLength * (1 - progress * 0.15));
        const width = Math.max(1, (p.startWidth || 12) * (1 - progress * 0.3));
        const color = p.color || '#ffffff';
        const glow = p.glow || '#60a5fa';
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(rad);
        
        // 애니메이션 진행도에 따른 확장
        const expandProgress = Math.min(1, progress * 4);
        const fadeProgress = Math.max(0, (progress - 0.3) / 0.7);
        
        // === 레이어 1: 외부 글로우 ===
        ctx.globalAlpha = alpha * 0.5 * (1 - fadeProgress);
        ctx.shadowColor = glow;
        ctx.shadowBlur = 25;
        
        const glowGrad = ctx.createLinearGradient(-len * 0.1, 0, len, 0);
        glowGrad.addColorStop(0, 'transparent');
        glowGrad.addColorStop(0.2, glow + '60');
        glowGrad.addColorStop(0.6, glow + 'cc');
        glowGrad.addColorStop(1, glow + '40');
        ctx.fillStyle = glowGrad;
        
        // 날카로운 삼각형 칼날 형태
        ctx.beginPath();
        const tipX = len * expandProgress;
        const baseWidth = width * 2.5;
        ctx.moveTo(-len * 0.15, 0);  // 시작점 (뒤쪽)
        ctx.quadraticCurveTo(len * 0.3, -baseWidth * 0.8, tipX, 0);  // 위쪽 곡선 → 끝점
        ctx.quadraticCurveTo(len * 0.3, baseWidth * 0.25, -len * 0.15, 0);  // 아래쪽 곡선 → 시작점
        ctx.fill();
        
        // === 레이어 2: 메인 블레이드 (날카로운 검기) ===
        ctx.globalAlpha = alpha * (1 - fadeProgress * 0.5);
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        const bladeGrad = ctx.createLinearGradient(0, 0, tipX, 0);
        bladeGrad.addColorStop(0, color + '20');
        bladeGrad.addColorStop(0.2, color);
        bladeGrad.addColorStop(0.5, '#ffffff');
        bladeGrad.addColorStop(0.8, color);
        bladeGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = bladeGrad;
        
        // 날카로운 칼날 형태 (끝이 뾰족)
        ctx.beginPath();
        const bladeWidth = width * 1.5;
        ctx.moveTo(-len * 0.05, 0);
        // 위쪽 날 - S자 곡선으로 날렵하게
        ctx.bezierCurveTo(
            len * 0.15, -bladeWidth * 0.9,
            len * 0.5, -bladeWidth * 0.6,
            tipX, 0
        );
        // 아래쪽 날 - 얇게
        ctx.bezierCurveTo(
            len * 0.5, bladeWidth * 0.15,
            len * 0.15, bladeWidth * 0.1,
            -len * 0.05, 0
        );
        ctx.fill();
        
        // === 레이어 3: 내부 코어 하이라이트 ===
        ctx.globalAlpha = alpha * 0.9 * (1 - fadeProgress);
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        
        const coreGrad = ctx.createLinearGradient(0, 0, tipX * 0.8, 0);
        coreGrad.addColorStop(0, 'transparent');
        coreGrad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        coreGrad.addColorStop(0.7, 'rgba(255,255,255,1)');
        coreGrad.addColorStop(1, 'rgba(255,255,255,0.6)');
        ctx.fillStyle = coreGrad;
        
        ctx.beginPath();
        const coreWidth = width * 0.35;
        ctx.moveTo(len * 0.1, 0);
        ctx.quadraticCurveTo(len * 0.4, -coreWidth, tipX * 0.9, 0);
        ctx.quadraticCurveTo(len * 0.4, coreWidth * 0.3, len * 0.1, 0);
        ctx.fill();
        
        // === 레이어 4: 검기 끝 스파크 ===
        if (expandProgress > 0.5 && fadeProgress < 0.5) {
            ctx.globalAlpha = alpha * (1 - fadeProgress * 2) * 0.9;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            
            // 끝점 밝은 점
            ctx.beginPath();
            ctx.arc(tipX, 0, width * 0.25, 0, Math.PI * 2);
            ctx.fill();
            
            // 스파크 선들
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                const angle = (i - 1) * 0.4 + (Math.random() - 0.5) * 0.3;
                const sparkLen = width * (0.6 + Math.random() * 0.4);
                ctx.beginPath();
                ctx.moveTo(tipX, 0);
                ctx.lineTo(tipX + Math.cos(angle) * sparkLen, Math.sin(angle) * sparkLen);
                ctx.stroke();
            }
        }
        
        // === 레이어 5: 모션 트레일 (잔상) ===
        if (progress < 0.25) {
            const trailAlpha = alpha * 0.35 * (1 - progress * 4);
            ctx.shadowBlur = 0;
            
            for (let i = 1; i <= 4; i++) {
                ctx.globalAlpha = trailAlpha * (1 - i * 0.2);
                ctx.fillStyle = glow + '80';
                
                ctx.save();
                ctx.translate(-i * 6, i * 2);
                ctx.scale(1 - i * 0.08, 1 - i * 0.15);
                
                ctx.beginPath();
                const tw = width * (1.2 - i * 0.15);
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(len * 0.3, -tw * 0.7, tipX * 0.9, 0);
                ctx.quadraticCurveTo(len * 0.3, tw * 0.15, 0, 0);
                ctx.fill();
                
                ctx.restore();
            }
        }
        
        // === 레이어 6: 날카로운 엣지 라인 ===
        ctx.globalAlpha = alpha * 0.7 * (1 - fadeProgress);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.moveTo(len * 0.05, -width * 0.1);
        ctx.quadraticCurveTo(len * 0.4, -width * 0.5, tipX, 0);
        ctx.stroke();
        
        ctx.restore();
    },
    
    // 화살표 파티클
    drawArrowParticle(ctx, p, alpha, progress) {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startLength) || p.startLength <= 0) {
            return;
        }
        
        const len = Math.max(1, (p.startLength || 50) * (1 - progress * 0.4));
        const width = Math.max(1, (p.startWidth || 30) * (1 - progress * 0.3));
        const tipRad = (p.tipAngle || 35) * Math.PI / 180;
        const dir = p.dir || 1;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        if (dir < 0) ctx.scale(-1, 1);
        
        if (p.glow) {
            ctx.shadowColor = p.glow;
            ctx.shadowBlur = 25;
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        
        if (p.innerColor) {
            ctx.fillStyle = p.innerColor;
            ctx.beginPath();
            ctx.moveTo(len, 0);
            ctx.lineTo(0, -width * Math.sin(tipRad));
            ctx.lineTo(len * 0.3, 0);
            ctx.lineTo(0, width * Math.sin(tipRad));
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.strokeStyle = p.color || '#ffffff';
        ctx.lineWidth = 3 * alpha;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, -width * Math.sin(tipRad));
        ctx.lineTo(len, 0);
        ctx.lineTo(0, width * Math.sin(tipRad));
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * alpha;
        ctx.beginPath();
        ctx.moveTo(len * 0.2, 0);
        ctx.lineTo(len * 0.9, 0);
        ctx.stroke();
        
        ctx.restore();
    },
    
    // 스파크 파티클
    drawSparkParticle(ctx, p, alpha) {
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = Math.max(1, (p.startSize || 5) * alpha);
        
        ctx.fillStyle = p.color || '#fbbf24';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // 플래시 파티클
    drawFlashParticle(ctx, p, alpha, progress) {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startSize) || p.startSize <= 0) {
            return;
        }
        
        const size = Math.max(1, p.startSize * (1 + progress * 0.3));
        
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
        grad.addColorStop(0, p.color || '#ffffff');
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // 링 파티클
    drawRingParticle(ctx, p, alpha, progress) {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startSize)) return;
        
        const currentSize = Math.max(1, (p.startSize || 10) + ((p.maxSize || 50) - (p.startSize || 10)) * progress);
        
        ctx.strokeStyle = p.color || '#ef4444';
        ctx.lineWidth = 2 * alpha;
        ctx.globalAlpha = alpha * 0.7;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.stroke();
    },
    
    // 라인 파티클
    drawLineParticle(ctx, p, alpha, progress) {
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.startLength) || p.startLength <= 0) {
            return;
        }
        
        const rad = (p.angle || 0) * Math.PI / 180;
        const len = Math.max(1, p.startLength * (1 - progress * 0.3));
        
        ctx.strokeStyle = p.color || '#fbbf24';
        ctx.lineWidth = Math.max(1, (p.startWidth || 3) * alpha);
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';
        
        const ex = p.x + Math.cos(rad) * len;
        const ey = p.y + Math.sin(rad) * len;
        
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    },
    
    // 파편 파티클
    drawDebrisParticle(ctx, p, alpha) {
        if (!isFinite(p.x) || !isFinite(p.y)) return;
        
        const size = Math.max(1, (p.startSize || 5) * alpha);
        
        ctx.fillStyle = p.color || '#ef4444';
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x - size/2, p.y - size/2, size, size);
    }
};

// 글로벌 등록
if (typeof window !== 'undefined') {
    window.DDOODraw = DDOODraw;
}

console.log('[DDOODraw] Draw 모듈 로드됨 (17개 함수)');
