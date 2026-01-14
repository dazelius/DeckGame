// =====================================================
// Mouse Trail System - 마우스 궤적 효과
// 게임에서 마우스 위치를 쉽게 추적할 수 있도록 함
// =====================================================

const MouseTrail = {
    app: null,
    container: null,
    rope: null,
    points: [],
    historyX: [],
    historyY: [],
    mousePosition: null,
    enabled: true,
    isDragging: false,  // ★ 드래그 중 비활성화용
    
    // 설정값
    config: {
        historySize: 15,      // 궤적 길이 (짧을수록 빠르게 사라짐)
        ropeSize: 80,         // 궤적 부드러움 (높을수록 부드러움)
        trailWidth: 8,        // 궤적 두께
        trailColor: 0x88ccff, // 궤적 색상 (하늘색)
        trailAlpha: 0.6,      // 궤적 투명도
        fadeSpeed: 0.92       // 페이드 속도 (1에 가까울수록 느리게 사라짐)
    },
    
    // ==========================================
    // 초기화
    // ==========================================
    init(pixiApp, options = {}) {
        this.app = pixiApp;
        
        // 옵션 병합
        Object.assign(this.config, options);
        
        // 컨테이너 생성
        this.container = new PIXI.Container();
        this.container.zIndex = 9999; // 최상위 레이어
        this.app.stage.addChild(this.container);
        
        // 히스토리 배열 초기화
        for (let i = 0; i < this.config.historySize; i++) {
            this.historyX.push(0);
            this.historyY.push(0);
        }
        
        // 로프 포인트 초기화
        for (let i = 0; i < this.config.ropeSize; i++) {
            this.points.push(new PIXI.Point(0, 0));
        }
        
        // 트레일 텍스처 생성 (그라데이션)
        const trailTexture = this.createTrailTexture();
        
        // SimpleRope 생성 (PixiJS v8 호환)
        if (PIXI.SimpleRope) {
            this.rope = new PIXI.SimpleRope(trailTexture, this.points);
        } else if (PIXI.MeshRope) {
            // PixiJS v8
            this.rope = new PIXI.MeshRope({
                texture: trailTexture,
                points: this.points
            });
        } else {
            console.warn('[MouseTrail] SimpleRope/MeshRope를 찾을 수 없습니다.');
            return;
        }
        
        this.rope.blendMode = PIXI.BLEND_MODES?.ADD || 'add';
        this.container.addChild(this.rope);
        
        // 마우스 이벤트 설정
        this.setupMouseTracking();
        
        // 업데이트 루프 시작
        this.app.ticker.add(this.update, this);
        
        console.log('[MouseTrail] 마우스 트레일 시스템 초기화 완료');
    },
    
    // ==========================================
    // 트레일 텍스처 생성 (그라데이션)
    // ==========================================
    createTrailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        
        // 그라데이션 생성 (가운데가 밝고 양끝이 투명)
        const gradient = ctx.createLinearGradient(0, 0, 64, 0);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.3, 'rgba(136, 204, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.7, 'rgba(136, 204, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 8);
        
        return PIXI.Texture.from(canvas);
    },
    
    // ==========================================
    // 마우스 추적 설정
    // ==========================================
    setupMouseTracking() {
        // 기존 stage 설정 확인
        if (this.app.stage) {
            this.app.stage.eventMode = 'static';
            this.app.stage.hitArea = this.app.screen;
            
            this.app.stage.on('pointermove', (event) => {
                if (!this.enabled) return;
                
                if (!this.mousePosition) {
                    this.mousePosition = { x: 0, y: 0 };
                    // 초기 위치로 히스토리 채우기
                    for (let i = 0; i < this.config.historySize; i++) {
                        this.historyX[i] = event.global.x;
                        this.historyY[i] = event.global.y;
                    }
                }
                
                this.mousePosition.x = event.global.x;
                this.mousePosition.y = event.global.y;
            });
        }
        
        // DOM 이벤트도 백업으로 추가
        document.addEventListener('mousemove', (e) => {
            if (!this.enabled) return;
            
            const canvas = this.app.canvas || this.app.view;
            if (!canvas) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (!this.mousePosition) {
                this.mousePosition = { x: 0, y: 0 };
                for (let i = 0; i < this.config.historySize; i++) {
                    this.historyX[i] = x;
                    this.historyY[i] = y;
                }
            }
            
            this.mousePosition.x = x;
            this.mousePosition.y = y;
        });
    },
    
    // ==========================================
    // 업데이트 루프
    // ==========================================
    update() {
        if (!this.enabled || !this.mousePosition || !this.rope) return;
        
        // 히스토리 업데이트 (FIFO)
        this.historyX.pop();
        this.historyX.unshift(this.mousePosition.x);
        this.historyY.pop();
        this.historyY.unshift(this.mousePosition.y);
        
        // 포인트 업데이트 (큐빅 보간)
        for (let i = 0; i < this.config.ropeSize; i++) {
            const p = this.points[i];
            const t = (i / this.config.ropeSize) * this.config.historySize;
            
            p.x = this.cubicInterpolation(this.historyX, t);
            p.y = this.cubicInterpolation(this.historyY, t);
        }
    },
    
    // ==========================================
    // 큐빅 보간 (부드러운 곡선)
    // ==========================================
    cubicInterpolation(array, t, tangentFactor = 1) {
        const k = Math.floor(t);
        
        const clipInput = (idx) => {
            if (idx < 0) idx = 0;
            if (idx > array.length - 1) idx = array.length - 1;
            return array[idx];
        };
        
        const getTangent = (idx) => {
            return (tangentFactor * (clipInput(idx + 1) - clipInput(idx - 1))) / 2;
        };
        
        const m = [getTangent(k), getTangent(k + 1)];
        const p = [clipInput(k), clipInput(k + 1)];
        
        t -= k;
        const t2 = t * t;
        const t3 = t * t2;
        
        return (
            (2 * t3 - 3 * t2 + 1) * p[0] +
            (t3 - 2 * t2 + t) * m[0] +
            (-2 * t3 + 3 * t2) * p[1] +
            (t3 - t2) * m[1]
        );
    },
    
    // ==========================================
    // 활성화/비활성화
    // ==========================================
    enable() {
        this.enabled = true;
        if (this.container) this.container.visible = true;
    },
    
    disable() {
        this.enabled = false;
        if (this.container) this.container.visible = false;
    },
    
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    },
    
    // ★ 드래그 시작 (트레일 숨김)
    startDrag() {
        this.isDragging = true;
        if (this.container) this.container.visible = false;
    },
    
    // ★ 드래그 종료 (트레일 다시 표시)
    endDrag() {
        this.isDragging = false;
        if (this.container && this.enabled) this.container.visible = true;
    },
    
    // ==========================================
    // 색상 변경
    // ==========================================
    setColor(color) {
        this.config.trailColor = color;
        // 텍스처 재생성 필요시 구현
    },
    
    // ==========================================
    // 정리
    // ==========================================
    destroy() {
        if (this.app && this.app.ticker) {
            this.app.ticker.remove(this.update, this);
        }
        
        if (this.rope && !this.rope.destroyed) {
            this.rope.destroy();
        }
        
        if (this.container && !this.container.destroyed) {
            this.container.destroy({ children: true });
        }
        
        this.rope = null;
        this.container = null;
        this.points = [];
        this.historyX = [];
        this.historyY = [];
        this.mousePosition = null;
        
        console.log('[MouseTrail] 정리 완료');
    }
};

console.log('[MouseTrail] 마우스 트레일 시스템 로드 완료');
