// ==========================================
// Shadow Deck - 쉴드 파괴 캔버스 VFX
// 유리창 깨지는 효과
// ==========================================

const ShieldBreakVFX = {
    canvas: null,
    ctx: null,
    shards: [],
    cracks: [],
    isAnimating: false,
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        // 캔버스 생성
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'shield-break-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.1s ease;
        `;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        console.log('[ShieldBreakVFX] 초기화 완료');
    },
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    // ==========================================
    // 유리 파편 클래스
    // ==========================================
    createShard(x, y, size, angle) {
        return {
            x: x,
            y: y,
            vx: Math.cos(angle) * (3 + Math.random() * 8),
            vy: Math.sin(angle) * (3 + Math.random() * 8) - 2,
            size: size,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            opacity: 1,
            gravity: 0.15 + Math.random() * 0.1,
            // 유리 파편 모양 (다각형 꼭짓점)
            vertices: this.generateShardShape(size),
            // 파편 색상 (유리 + 방어도 파란색)
            color: Math.random() > 0.3 ? 
                `rgba(96, 165, 250, ${0.6 + Math.random() * 0.4})` : 
                `rgba(200, 220, 255, ${0.7 + Math.random() * 0.3})`,
            highlight: `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`
        };
    },
    
    // 파편 모양 생성 (불규칙한 다각형)
    generateShardShape(size) {
        const vertices = [];
        const numPoints = 3 + Math.floor(Math.random() * 3); // 3-5각형
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = size * (0.5 + Math.random() * 0.5);
            vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return vertices;
    },
    
    // ==========================================
    // 금 생성 (크랙 패턴)
    // ==========================================
    createCrack(startX, startY, targetX, targetY) {
        const crack = {
            points: [{ x: startX, y: startY }],
            progress: 0,
            speed: 0.08 + Math.random() * 0.05,
            opacity: 1,
            branches: []
        };
        
        // 메인 크랙 경로 생성
        let currentX = startX;
        let currentY = startY;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const segments = Math.floor(distance / 15);
        
        for (let i = 0; i < segments; i++) {
            const t = (i + 1) / segments;
            const wobble = 15 * (1 - t); // 시작점에서 멀어질수록 흔들림 감소
            currentX = startX + dx * t + (Math.random() - 0.5) * wobble;
            currentY = startY + dy * t + (Math.random() - 0.5) * wobble;
            crack.points.push({ x: currentX, y: currentY });
            
            // 랜덤하게 분기 추가
            if (Math.random() > 0.6 && i > 2) {
                const branchAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI * 0.8;
                const branchLength = 20 + Math.random() * 40;
                crack.branches.push({
                    startIndex: crack.points.length - 1,
                    endX: currentX + Math.cos(branchAngle) * branchLength,
                    endY: currentY + Math.sin(branchAngle) * branchLength,
                    progress: 0
                });
            }
        }
        
        return crack;
    },
    
    // ==========================================
    // 메인 효과 실행
    // ==========================================
    play(centerX, centerY, intensity = 1) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.shards = [];
        this.cracks = [];
        
        // 캔버스 표시
        this.canvas.style.opacity = '1';
        
        // 1. 크랙 생성 (중심에서 바깥으로)
        const numCracks = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numCracks; i++) {
            const angle = (i / numCracks) * Math.PI * 2 + Math.random() * 0.3;
            const distance = 80 + Math.random() * 120;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;
            this.cracks.push(this.createCrack(centerX, centerY, endX, endY));
        }
        
        // 2. 파편 생성 (약간의 딜레이 후)
        setTimeout(() => {
            const numShards = Math.floor(20 * intensity) + 10;
            for (let i = 0; i < numShards; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 30;
                const size = 8 + Math.random() * 20;
                const shardX = centerX + Math.cos(angle) * distance;
                const shardY = centerY + Math.sin(angle) * distance;
                this.shards.push(this.createShard(shardX, shardY, size, angle));
            }
        }, 150);
        
        // 3. 화면 플래시
        this.flashScreen();
        
        // 4. 애니메이션 시작
        this.animate();
        
        // 5. 사운드 (유리 깨지는 소리가 있다면)
        this.playSound();
    },
    
    // ==========================================
    // 화면 플래시
    // ==========================================
    flashScreen() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(96, 165, 250, 0.6) 0%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
            pointer-events: none;
            z-index: 9998;
            animation: shieldFlash 0.3s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    },
    
    // ==========================================
    // 애니메이션 루프
    // ==========================================
    animate() {
        if (!this.isAnimating) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let stillAnimating = false;
        
        // 크랙 그리기
        this.cracks.forEach(crack => {
            if (crack.progress < 1) {
                crack.progress = Math.min(1, crack.progress + crack.speed);
                stillAnimating = true;
            }
            this.drawCrack(crack);
        });
        
        // 파편 업데이트 및 그리기
        this.shards.forEach(shard => {
            if (shard.opacity > 0) {
                // 물리 업데이트
                shard.x += shard.vx;
                shard.y += shard.vy;
                shard.vy += shard.gravity;
                shard.rotation += shard.rotationSpeed;
                shard.opacity -= 0.015;
                
                if (shard.opacity > 0) {
                    stillAnimating = true;
                    this.drawShard(shard);
                }
            }
        });
        
        // 크랙 페이드 아웃
        if (this.cracks.length > 0 && this.cracks[0].progress >= 1) {
            this.cracks.forEach(crack => {
                crack.opacity -= 0.02;
            });
            if (this.cracks[0].opacity > 0) {
                stillAnimating = true;
            }
        }
        
        if (stillAnimating) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isAnimating = false;
            this.canvas.style.opacity = '0';
        }
    },
    
    // ==========================================
    // 크랙 그리기
    // ==========================================
    drawCrack(crack) {
        const ctx = this.ctx;
        const visiblePoints = Math.floor(crack.points.length * crack.progress);
        
        if (visiblePoints < 2) return;
        
        ctx.save();
        ctx.globalAlpha = crack.opacity;
        
        // 메인 크랙 라인
        ctx.beginPath();
        ctx.moveTo(crack.points[0].x, crack.points[0].y);
        
        for (let i = 1; i < visiblePoints; i++) {
            ctx.lineTo(crack.points[i].x, crack.points[i].y);
        }
        
        // 글로우 효과
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 15;
        ctx.stroke();
        
        // 중심 라인 (밝은 색)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        // 분기 그리기
        crack.branches.forEach(branch => {
            if (branch.startIndex < visiblePoints) {
                branch.progress = Math.min(1, branch.progress + 0.1);
                const startPoint = crack.points[branch.startIndex];
                const endX = startPoint.x + (branch.endX - startPoint.x) * branch.progress;
                const endY = startPoint.y + (branch.endY - startPoint.y) * branch.progress;
                
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        });
        
        ctx.restore();
    },
    
    // ==========================================
    // 파편 그리기
    // ==========================================
    drawShard(shard) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(shard.x, shard.y);
        ctx.rotate(shard.rotation);
        ctx.globalAlpha = shard.opacity;
        
        // 파편 본체
        ctx.beginPath();
        ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
        for (let i = 1; i < shard.vertices.length; i++) {
            ctx.lineTo(shard.vertices[i].x, shard.vertices[i].y);
        }
        ctx.closePath();
        
        // 그라데이션 채우기
        const gradient = ctx.createLinearGradient(
            -shard.size, -shard.size, 
            shard.size, shard.size
        );
        gradient.addColorStop(0, shard.color);
        gradient.addColorStop(0.5, shard.highlight);
        gradient.addColorStop(1, shard.color);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 빛 반사 (작은 하이라이트)
        ctx.beginPath();
        ctx.arc(
            shard.vertices[0].x * 0.3, 
            shard.vertices[0].y * 0.3, 
            shard.size * 0.15, 
            0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        
        ctx.restore();
    },
    
    // ==========================================
    // 사운드
    // ==========================================
    playSound() {
        // 쉴드 깨지는 사운드 재생
        try {
            const sound = new Audio('sound/shield_break.mp3');
            sound.volume = 0.6;
            sound.play().catch(() => {});
        } catch (e) {
            // 폴백: SoundSystem 사용
            if (typeof SoundSystem !== 'undefined') {
                SoundSystem.playHit('heavy');
            }
        }
    },
    
    // ==========================================
    // 🛡️ 쉴드 히트 VFX (유리에 살짝 금이 가는 느낌)
    // ==========================================
    hitCracks: [],
    hitSparks: [],
    hitAnimating: false,
    
    playProtect(centerX, centerY, blockedAmount = 0) {
        // 캔버스 표시
        this.canvas.style.opacity = '1';
        
        // 유리에 살짝 금이 가는 효과 (2~3개만)
        const numCracks = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numCracks; i++) {
            const angle = (Math.random() - 0.5) * Math.PI + Math.PI / 2; // 위쪽 방향
            const length = 30 + Math.random() * 40;
            this.hitCracks.push({
                x: centerX,
                y: centerY,
                endX: centerX + Math.cos(angle) * length,
                endY: centerY + Math.sin(angle) * length,
                progress: 0,
                opacity: 1
            });
        }
        
        // 작은 유리 스파크 (파편 느낌)
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.hitSparks.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * (1 + Math.random() * 2),
                vy: Math.sin(angle) * (1 + Math.random() * 2) - 1,
                size: 2 + Math.random() * 4,
                opacity: 1,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        // 빠른 플래시
        this.flashHit(centerX, centerY);
        
        // 애니메이션
        this.animateHit();
    },
    
    // 히트 플래시 (짧게)
    flashHit(x, y) {
        const ctx = this.ctx;
        ctx.save();
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 60);
        gradient.addColorStop(0, 'rgba(147, 197, 253, 0.6)');
        gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.3)');
        gradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // 히트 애니메이션 (짧고 빠르게)
    animateHit() {
        if (this.hitAnimating) return;
        this.hitAnimating = true;
        
        let frame = 0;
        const maxFrames = 20; // 약 0.33초
        
        const animate = () => {
            if (!this.hitAnimating || frame >= maxFrames) {
                this.hitAnimating = false;
                this.hitCracks = [];
                this.hitSparks = [];
                this.canvas.style.opacity = '0';
                return;
            }
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            frame++;
            
            // 금 그리기
            this.hitCracks.forEach(crack => {
                crack.progress = Math.min(1, crack.progress + 0.2);
                crack.opacity = 1 - (frame / maxFrames);
                this.drawHitCrack(crack);
            });
            
            // 스파크 그리기
            this.hitSparks = this.hitSparks.filter(spark => {
                spark.x += spark.vx;
                spark.y += spark.vy;
                spark.vy += 0.1; // 약간의 중력
                spark.rotation += 0.1;
                spark.opacity = 1 - (frame / maxFrames);
                
                if (spark.opacity > 0) {
                    this.drawHitSpark(spark);
                    return true;
                }
                return false;
            });
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    },
    
    // 금 그리기 (쉴드 브레이크와 같은 스타일)
    drawHitCrack(crack) {
        const ctx = this.ctx;
        const currentX = crack.x + (crack.endX - crack.x) * crack.progress;
        const currentY = crack.y + (crack.endY - crack.y) * crack.progress;
        
        ctx.save();
        ctx.globalAlpha = crack.opacity;
        
        // 글로우
        ctx.beginPath();
        ctx.moveTo(crack.x, crack.y);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        // 중심 라인 (밝은 색)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.stroke();
        
        ctx.restore();
    },
    
    // 유리 파편 스파크 (쉴드 브레이크와 같은 스타일)
    drawHitSpark(spark) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(spark.x, spark.y);
        ctx.rotate(spark.rotation);
        ctx.globalAlpha = spark.opacity;
        
        // 작은 다이아몬드 모양
        ctx.beginPath();
        ctx.moveTo(0, -spark.size);
        ctx.lineTo(spark.size * 0.6, 0);
        ctx.lineTo(0, spark.size);
        ctx.lineTo(-spark.size * 0.6, 0);
        ctx.closePath();
        
        // 유리 색상 (쉴드 브레이크와 동일)
        const gradient = ctx.createLinearGradient(-spark.size, -spark.size, spark.size, spark.size);
        gradient.addColorStop(0, 'rgba(96, 165, 250, 0.8)');
        gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(96, 165, 250, 0.8)');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 5;
        ctx.fill();
        
        ctx.restore();
    }
};

// ==========================================
// 추가 CSS 스타일
// ==========================================
const shieldBreakStyles = document.createElement('style');
shieldBreakStyles.textContent = `
    @keyframes shieldFlash {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(shieldBreakStyles);

// ==========================================
// 초기화 및 전역 등록
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ShieldBreakVFX.init());
} else {
    ShieldBreakVFX.init();
}

window.ShieldBreakVFX = ShieldBreakVFX;

console.log('[ShieldBreakVFX] 쉴드 파괴 VFX 로드됨');

