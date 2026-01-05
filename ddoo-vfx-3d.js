// =====================================================
// DDOO VFX 3D - Three.js 기반 3D 이펙트 시스템
// =====================================================

const DDOOVfx3D = {
    scene: null,
    camera: null,
    renderer: null,
    container: null,
    effects: [],
    clock: null,
    initialized: false,
    
    // 초기화
    init(parentContainer) {
        if (this.initialized) return;
        
        // 컨테이너 설정
        this.container = document.createElement('div');
        this.container.id = 'vfx3d-container';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 15;
        `;
        
        const parent = parentContainer || document.getElementById('pixiContainer') || document.body;
        parent.appendChild(this.container);
        
        const width = this.container.clientWidth || 900;
        const height = this.container.clientHeight || 600;
        
        // Three.js 씬 설정
        this.scene = new THREE.Scene();
        
        // 직교 카메라 (2D 게임과 동기화하기 쉬움)
        this.camera = new THREE.OrthographicCamera(
            -width / 2, width / 2,
            height / 2, -height / 2,
            0.1, 1000
        );
        this.camera.position.z = 500;
        
        // 렌더러
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        
        this.clock = new THREE.Clock();
        this.initialized = true;
        
        // 애니메이션 루프 시작
        this.animate();
        
        console.log('[DDOOVfx3D] 🎮 3D VFX 시스템 초기화 완료');
    },
    
    // 애니메이션 루프
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // 이펙트 업데이트
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            if (effect.update) {
                const alive = effect.update(delta);
                if (!alive) {
                    this.removeEffect(effect);
                    this.effects.splice(i, 1);
                }
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    },
    
    // 이펙트 제거
    removeEffect(effect) {
        if (effect.mesh) {
            this.scene.remove(effect.mesh);
            if (effect.mesh.geometry) effect.mesh.geometry.dispose();
            if (effect.mesh.material) {
                if (Array.isArray(effect.mesh.material)) {
                    effect.mesh.material.forEach(m => m.dispose());
                } else {
                    effect.mesh.material.dispose();
                }
            }
        }
        if (effect.group) {
            this.scene.remove(effect.group);
        }
    },
    
    // ==================== 3D 검기 이펙트 (다크소울 스타일) ====================
    slash3D(x, y, options = {}) {
        if (!this.initialized) this.init();
        
        const {
            color = 0x88ccff,
            glowColor = 0xffffff,
            trailColor = 0x4488ff,
            length = 250,
            arc = 150,
            duration = 0.35,
            direction = 1,
            startAngle = -75,
            intensity = 1.5
        } = options;
        
        const screenX = x - this.container.clientWidth / 2;
        const screenY = -(y - this.container.clientHeight / 2);
        
        const group = new THREE.Group();
        group.position.set(screenX, screenY, 0);
        if (direction < 0) group.scale.x = -1;
        
        const startRad = startAngle * Math.PI / 180;
        const endRad = (startAngle + arc) * Math.PI / 180;
        const segments = 48;
        
        // ========== 레이어 1: 외부 대기 왜곡 효과 ==========
        const distortMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 },
                uColor: { value: new THREE.Color(trailColor) },
                uOpacity: { value: 0.4 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uProgress;
                uniform vec3 uColor;
                uniform float uOpacity;
                uniform float uTime;
                varying vec2 vUv;
                
                void main() {
                    float show = smoothstep(0.0, uProgress * 1.2, vUv.x);
                    float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
                    float taper = pow(1.0 - vUv.x, 0.5);
                    float noise = sin(vUv.x * 30.0 + uTime * 10.0) * 0.1 + 0.9;
                    float alpha = show * pow(edge, 2.0) * taper * uOpacity * noise;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const distortGeo = this.createSlashGeometry(startRad, endRad, length * 1.4, length * 0.15, segments);
        const distortMesh = new THREE.Mesh(distortGeo, distortMat);
        group.add(distortMesh);
        
        // ========== 레이어 2: 메인 검기 블레이드 ==========
        const bladeMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 },
                uColor: { value: new THREE.Color(color) },
                uGlowColor: { value: new THREE.Color(glowColor) },
                uOpacity: { value: 1.0 },
                uIntensity: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                varying float vEdge;
                attribute float edge;
                
                void main() {
                    vUv = uv;
                    vEdge = 1.0 - abs(uv.y - 0.5) * 2.0;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uProgress;
                uniform vec3 uColor;
                uniform vec3 uGlowColor;
                uniform float uOpacity;
                uniform float uIntensity;
                varying vec2 vUv;
                varying float vEdge;
                
                void main() {
                    // 스윙 진행
                    float swing = smoothstep(0.0, uProgress, vUv.x);
                    
                    // 날카로운 테이퍼링 (끝이 뾰족)
                    float taper = pow(1.0 - vUv.x, 0.3) * (1.0 - pow(vUv.x, 3.0));
                    
                    // 엣지 강조 (칼날 느낌)
                    float edgePow = pow(vEdge, 1.2);
                    
                    // 중심 코어 (밝은 부분)
                    float core = pow(vEdge, 6.0);
                    
                    // 끝부분 하이라이트
                    float tipGlow = smoothstep(0.7, 1.0, vUv.x) * pow(vEdge, 2.0);
                    
                    // 색상 계산
                    vec3 baseColor = mix(uColor, uGlowColor, core * 0.7 + tipGlow);
                    vec3 finalColor = baseColor * uIntensity;
                    
                    // HDR 블룸 시뮬레이션
                    finalColor = finalColor + pow(core, 2.0) * uGlowColor * 2.0;
                    
                    float alpha = swing * edgePow * taper * uOpacity;
                    alpha = clamp(alpha * 1.5, 0.0, 1.0);
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const bladeGeo = this.createSlashGeometry(startRad, endRad, length, length * 0.08, segments);
        const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
        bladeMesh.position.z = 0.1;
        group.add(bladeMesh);
        
        // ========== 레이어 3: 글로우 블룸 ==========
        const bloomMat = bladeMat.clone();
        bloomMat.uniforms.uOpacity.value = 0.5;
        bloomMat.uniforms.uIntensity.value = intensity * 0.8;
        
        const bloomGeo = this.createSlashGeometry(startRad, endRad, length * 1.15, length * 0.2, segments);
        const bloomMesh = new THREE.Mesh(bloomGeo, bloomMat);
        bloomMesh.position.z = -0.1;
        group.add(bloomMesh);
        
        // ========== 레이어 4: 코어 라인 (밝은 중심) ==========
        const coreMat = new THREE.ShaderMaterial({
            uniforms: {
                uProgress: { value: 0 },
                uOpacity: { value: 1.0 }
            },
            vertexShader: `
                varying float vT;
                attribute float t;
                void main() {
                    vT = t;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uProgress;
                uniform float uOpacity;
                varying float vT;
                void main() {
                    float show = smoothstep(0.0, uProgress, vT);
                    float taper = pow(1.0 - vT, 0.4);
                    float alpha = show * taper * uOpacity;
                    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const coreGeo = new THREE.BufferGeometry();
        const coreVerts = [];
        const coreTs = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = startRad + (endRad - startRad) * t;
            const r = length * 0.65;
            coreVerts.push(Math.cos(angle) * r, Math.sin(angle) * r, 0.2);
            coreTs.push(t);
        }
        coreGeo.setAttribute('position', new THREE.Float32BufferAttribute(coreVerts, 3));
        coreGeo.setAttribute('t', new THREE.Float32BufferAttribute(coreTs, 1));
        
        const coreLine = new THREE.Line(coreGeo, coreMat);
        coreLine.material.linewidth = 3;
        group.add(coreLine);
        
        // ========== 레이어 5: 스피드 라인 ==========
        for (let i = 0; i < 5; i++) {
            const speedLineMat = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6 - i * 0.1,
                blending: THREE.AdditiveBlending
            });
            
            const speedGeo = new THREE.BufferGeometry();
            const speedVerts = [];
            const offsetAngle = (Math.random() - 0.5) * 0.3;
            const offsetR = length * (0.4 + Math.random() * 0.4);
            
            for (let j = 0; j <= 8; j++) {
                const t = j / 8;
                const angle = startRad + (endRad - startRad) * t + offsetAngle;
                speedVerts.push(
                    Math.cos(angle) * offsetR,
                    Math.sin(angle) * offsetR,
                    0.05 + i * 0.02
                );
            }
            speedGeo.setAttribute('position', new THREE.Float32BufferAttribute(speedVerts, 3));
            
            const speedLine = new THREE.Line(speedGeo, speedLineMat);
            speedLine.userData.delay = i * 0.02;
            speedLine.visible = false;
            group.add(speedLine);
        }
        
        // ========== 레이어 6: 끝부분 스파크 ==========
        const sparkGroup = new THREE.Group();
        for (let i = 0; i < 12; i++) {
            const sparkGeo = new THREE.CircleGeometry(3 + Math.random() * 4, 6);
            const sparkMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            
            const angle = endRad + (Math.random() - 0.5) * 0.5;
            const dist = length * (0.85 + Math.random() * 0.2);
            spark.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0.3);
            spark.userData = {
                vx: (Math.random() - 0.3) * 300,
                vy: (Math.random() - 0.5) * 200,
                life: 0.15 + Math.random() * 0.2,
                delay: 0.08 + Math.random() * 0.1
            };
            sparkGroup.add(spark);
        }
        group.add(sparkGroup);
        
        this.scene.add(group);
        
        // ========== 애니메이션 ==========
        const effect = {
            group,
            startTime: this.clock.getElapsedTime(),
            duration,
            update: (delta) => {
                const elapsed = this.clock.getElapsedTime() - effect.startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // 빠른 스윙 (0~0.3), 천천히 페이드 (0.3~1.0)
                const swingProgress = Math.min(progress * 4, 1);
                const fadeProgress = Math.max(0, (progress - 0.25) / 0.75);
                const fadeOut = 1 - Math.pow(fadeProgress, 0.5);
                
                // 메인 블레이드
                bladeMat.uniforms.uProgress.value = swingProgress;
                bladeMat.uniforms.uOpacity.value = fadeOut;
                bladeMat.uniforms.uTime.value = elapsed;
                
                // 블룸
                bloomMat.uniforms.uProgress.value = swingProgress;
                bloomMat.uniforms.uOpacity.value = fadeOut * 0.5;
                
                // 왜곡
                distortMat.uniforms.uProgress.value = swingProgress;
                distortMat.uniforms.uOpacity.value = fadeOut * 0.3;
                distortMat.uniforms.uTime.value = elapsed;
                
                // 코어
                coreMat.uniforms.uProgress.value = swingProgress;
                coreMat.uniforms.uOpacity.value = fadeOut;
                
                // 스피드 라인
                group.children.forEach(child => {
                    if (child.userData.delay !== undefined) {
                        const lineProgress = Math.max(0, elapsed - child.userData.delay) / (duration * 0.5);
                        child.visible = lineProgress > 0 && lineProgress < 1;
                        if (child.material) {
                            child.material.opacity = (1 - lineProgress) * 0.5;
                        }
                    }
                });
                
                // 스파크 애니메이션
                sparkGroup.children.forEach(spark => {
                    const d = spark.userData;
                    const sparkElapsed = elapsed - d.delay;
                    if (sparkElapsed > 0 && sparkElapsed < d.life) {
                        const sparkProgress = sparkElapsed / d.life;
                        spark.material.opacity = (1 - sparkProgress) * 0.9;
                        spark.position.x += d.vx * delta;
                        spark.position.y += d.vy * delta;
                        d.vy -= 500 * delta; // 중력
                        spark.scale.setScalar(1 - sparkProgress * 0.5);
                    } else if (sparkElapsed >= d.life) {
                        spark.material.opacity = 0;
                    }
                });
                
                return progress < 1;
            }
        };
        
        this.effects.push(effect);
        return effect;
    },
    
    // 검기 지오메트리 생성 헬퍼
    createSlashGeometry(startAngle, endAngle, outerRadius, innerOffset, segments) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];
        const indices = [];
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = startAngle + (endAngle - startAngle) * t;
            
            // 테이퍼링: 시작과 끝이 얇고 중간이 두꺼움
            const taper = Math.sin(t * Math.PI) * 0.7 + 0.3;
            // 끝으로 갈수록 더 뾰족하게
            const tipTaper = 1 - Math.pow(t, 2) * 0.5;
            const width = innerOffset * taper * tipTaper;
            
            const innerR = outerRadius - width * 2;
            const outerR = outerRadius;
            
            // 내부
            vertices.push(Math.cos(angle) * innerR, Math.sin(angle) * innerR, 0);
            uvs.push(t, 0);
            
            // 외부
            vertices.push(Math.cos(angle) * outerR, Math.sin(angle) * outerR, 0);
            uvs.push(t, 1);
        }
        
        for (let i = 0; i < segments; i++) {
            const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
            indices.push(a, b, c, b, d, c);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        
        return geometry;
    },
    
    // ==================== 3D 충격파 ====================
    shockwave3D(x, y, options = {}) {
        if (!this.initialized) this.init();
        
        const {
            color = 0x60a5fa,
            maxRadius = 150,
            duration = 0.5,
            thickness = 10
        } = options;
        
        const screenX = x - this.container.clientWidth / 2;
        const screenY = -(y - this.container.clientHeight / 2);
        
        const geometry = new THREE.RingGeometry(1, thickness, 64);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color(color) },
                uOpacity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                varying vec2 vUv;
                
                void main() {
                    float alpha = (1.0 - vUv.x) * uOpacity;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.position.set(screenX, screenY, 0);
        this.scene.add(ring);
        
        const effect = {
            mesh: ring,
            startTime: this.clock.getElapsedTime(),
            duration,
            update: (delta) => {
                const elapsed = this.clock.getElapsedTime() - effect.startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // 확장
                const scale = 1 + (maxRadius / thickness) * progress;
                ring.scale.set(scale, scale, 1);
                
                // 페이드 아웃
                material.uniforms.uOpacity.value = 1 - progress;
                
                return progress < 1;
            }
        };
        
        this.effects.push(effect);
        return effect;
    },
    
    // ==================== 3D 스파크 파티클 ====================
    sparks3D(x, y, options = {}) {
        if (!this.initialized) this.init();
        
        const {
            color = 0xfbbf24,
            count = 30,
            speed = 200,
            size = 4,
            duration = 0.6,
            spread = Math.PI * 2
        } = options;
        
        const screenX = x - this.container.clientWidth / 2;
        const screenY = -(y - this.container.clientHeight / 2);
        
        const group = new THREE.Group();
        group.position.set(screenX, screenY, 0);
        
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const geometry = new THREE.CircleGeometry(size * (0.5 + Math.random() * 0.5), 8);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // 랜덤 방향과 속도
            const angle = (Math.random() - 0.5) * spread;
            const particleSpeed = speed * (0.5 + Math.random() * 0.5);
            
            particle.userData = {
                vx: Math.cos(angle) * particleSpeed,
                vy: Math.sin(angle) * particleSpeed,
                gravity: 300 + Math.random() * 200,
                life: 0.3 + Math.random() * 0.4
            };
            
            group.add(particle);
            particles.push(particle);
        }
        
        this.scene.add(group);
        
        const effect = {
            group,
            startTime: this.clock.getElapsedTime(),
            duration,
            particles,
            update: (delta) => {
                const elapsed = this.clock.getElapsedTime() - effect.startTime;
                
                let anyAlive = false;
                particles.forEach(p => {
                    const d = p.userData;
                    const progress = elapsed / d.life;
                    
                    if (progress < 1) {
                        anyAlive = true;
                        p.position.x += d.vx * delta;
                        p.position.y += d.vy * delta;
                        d.vy -= d.gravity * delta; // 중력
                        
                        p.material.opacity = 1 - progress;
                        p.scale.setScalar(1 - progress * 0.5);
                    } else {
                        p.visible = false;
                    }
                });
                
                return anyAlive;
            }
        };
        
        this.effects.push(effect);
        return effect;
    },
    
    // ==================== DDOOAction 연동 ====================
    // DDOOAction.triggerVFX에서 호출 가능
    trigger(type, x, y, dir = 1, scale = 1, options = {}) {
        switch (type) {
            case 'slash3d':
            case '3d_slash':
                return this.slash3D(x, y, {
                    direction: dir,
                    length: 200 * scale,
                    ...options
                });
            case 'shockwave3d':
            case '3d_shockwave':
                return this.shockwave3D(x, y, {
                    maxRadius: 150 * scale,
                    ...options
                });
            case 'sparks3d':
            case '3d_sparks':
                return this.sparks3D(x, y, {
                    count: Math.floor(30 * scale),
                    ...options
                });
            default:
                console.warn(`[DDOOVfx3D] Unknown effect type: ${type}`);
        }
    },
    
    // 리사이즈 핸들러
    resize() {
        if (!this.initialized) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.left = -width / 2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = -height / 2;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    },
    
    // 정리
    dispose() {
        this.effects.forEach(e => this.removeEffect(e));
        this.effects = [];
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.initialized = false;
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.DDOOVfx3D = DDOOVfx3D;
}

console.log('[DDOOVfx3D] 🎮 3D VFX 모듈 로드됨');
