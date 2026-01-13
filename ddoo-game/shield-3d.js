// ==========================================
// Shield 3D VFX - Three.js 3D 쉴드 이펙트
// PIXI.js 게임 위에 오버레이로 표시
// ==========================================

const Shield3D = {
    scene: null,
    camera: null,
    renderer: null,
    canvas: null,
    isInitialized: false,
    activeEffects: [],
    
    // ==========================================
    // 초기화
    // ==========================================
    init() {
        if (this.isInitialized || typeof THREE === 'undefined') {
            console.warn('[Shield3D] Three.js 미로드 또는 이미 초기화됨');
            return false;
        }
        
        // Three.js 캔버스 생성
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'shield-3d-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // battle-area에 추가
        const battleArea = document.getElementById('battle-area');
        if (battleArea) {
            battleArea.style.position = 'relative';
            battleArea.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.canvas);
        }
        
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera (Orthographic for 2D-like positioning)
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.OrthographicCamera(
            -this.canvas.clientWidth / 2, this.canvas.clientWidth / 2,
            this.canvas.clientHeight / 2, -this.canvas.clientHeight / 2,
            0.1, 1000
        );
        this.camera.position.z = 100;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        
        this.isInitialized = true;
        this.animate();
        
        console.log('[Shield3D] Three.js 쉴드 시스템 초기화 완료');
        return true;
    },
    
    // ==========================================
    // 3D 쉴드 이펙트 생성
    // ==========================================
    createShield(screenX, screenY, options = {}) {
        if (!this.isInitialized) {
            if (!this.init()) return null;
        }
        
        const {
            radius = 60,
            color = 0x00aaff,
            duration = 1000
        } = options;
        
        // ★ PIXI 전역 좌표 → Three.js 좌표 변환
        // Three.js: 중앙이 (0,0), Y축 위가 양수
        // PIXI: 좌상단이 (0,0), Y축 아래가 양수
        const canvasWidth = this.canvas.clientWidth;
        const canvasHeight = this.canvas.clientHeight;
        
        const x = screenX - canvasWidth / 2;
        const y = -(screenY - canvasHeight / 2);
        
        console.log(`[Shield3D] PIXI(${screenX}, ${screenY}) → Three.js(${x}, ${y})`);
        
        const group = new THREE.Group();
        group.position.set(x, y, 0);
        
        // ★ 스프라이트를 감싸는 반구 형태 (앞쪽만)
        // 구체를 약간 뒤로 기울여서 캐릭터를 감싸는 느낌
        
        // 1. 와이어프레임 반구 (앞쪽)
        const sphereGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.rotation.x = -Math.PI * 0.15; // 약간 앞으로 기울임
        group.add(sphere);
        
        // 2. 내부 글로우 반구
        const glowGeo = new THREE.SphereGeometry(radius * 0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = -Math.PI * 0.15;
        group.add(glow);
        
        // 3. 육각형들 (앞쪽 반구에만 분포)
        const hexagons = [];
        const hexCount = 60;
        
        for (let i = 0; i < hexCount; i++) {
            // 앞쪽 반구에만 배치 (phi 범위 제한)
            const phi = Math.acos(1 - (1.2 * (i + 0.5)) / hexCount); // 0 ~ ~90도
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            
            const hx = radius * 1.02 * Math.sin(phi) * Math.cos(theta);
            const hy = radius * 1.02 * Math.sin(phi) * Math.sin(theta);
            const hz = radius * 1.02 * Math.cos(phi);
            
            // 뒤쪽(z < 0)은 스킵
            if (hz < -radius * 0.2) continue;
            
            // 육각형 Shape
            const hexShape = new THREE.Shape();
            const size = 8 + Math.random() * 5;
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j;
                const hxx = size * Math.cos(angle);
                const hyy = size * Math.sin(angle);
                if (j === 0) hexShape.moveTo(hxx, hyy);
                else hexShape.lineTo(hxx, hyy);
            }
            hexShape.closePath();
            
            const hexGeo = new THREE.ShapeGeometry(hexShape);
            const hexMat = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.75,
                side: THREE.DoubleSide
            });
            
            const hexMesh = new THREE.Mesh(hexGeo, hexMat);
            hexMesh.position.set(hx, hy, hz);
            hexMesh.lookAt(0, 0, 0);
            
            group.add(hexMesh);
            hexagons.push({
                mesh: hexMesh,
                phase: Math.random() * Math.PI * 2,
                baseOpacity: 0.55 + Math.random() * 0.4,
                originalPos: new THREE.Vector3(hx, hy, hz),
                velocity: new THREE.Vector3(0, 0, 0)
            });
        }
        
        // 4. 외곽 타원 링 (기울어진)
        const ringGeo = new THREE.TorusGeometry(radius * 1.05, 2, 8, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.85
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI * 0.4; // 기울어진 링
        group.add(ring);
        
        // 5. 하단 베이스 링
        const baseRingGeo = new THREE.TorusGeometry(radius * 0.9, 1.5, 8, 48);
        const baseRingMat = new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.6
        });
        const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
        baseRing.rotation.x = Math.PI * 0.5;
        baseRing.position.y = -radius * 0.5;
        group.add(baseRing);
        
        this.scene.add(group);
        
        // 이펙트 데이터
        const effect = {
            group,
            sphere,
            hexagons,
            ring,
            radius,       // 쉴드 반경 저장
            startTime: Date.now(),
            duration,
            phase: 0,
            impacts: [],  // 타격 효과
            arcs: []      // 전기 아크
        };
        
        this.activeEffects.push(effect);
        
        // 스케일 애니메이션
        group.scale.set(0.1, 0.1, 0.1);
        this.animateScale(group, 1.0, 150);
        
        // 종료 타이머
        setTimeout(() => {
            this.animateScale(group, 0, 200, () => {
                this.removeEffect(effect);
            });
        }, duration - 200);
        
        return effect;
    },
    
    // ==========================================
    // 스케일 애니메이션
    // ==========================================
    animateScale(object, targetScale, duration, onComplete) {
        const startScale = object.scale.x;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out
            const eased = 1 - Math.pow(1 - progress, 3);
            const scale = startScale + (targetScale - startScale) * eased;
            object.scale.set(scale, scale, scale);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        animate();
    },
    
    // ==========================================
    // ★★★ 쉴드 타격 효과 (육각형 파편 + 스파크) ★★★
    // ==========================================
    hitShield(screenX, screenY, intensity = 1.0, radius = 70) {
        if (!this.isInitialized) {
            if (!this.init()) {
                console.warn('[Shield3D] 초기화 실패');
                return;
            }
        }
        
        // ★ 쉴드 타격 전용 VFX (쉴드 생성 없이 타격 효과만)
        this.createHitEffect(screenX, screenY, intensity, radius);
        
        // 기존 쉴드가 있으면 디스토션 효과 추가
        const effect = this.activeEffects[this.activeEffects.length - 1];
        if (effect) {
            // 쉴드 지속시간 연장
            effect.startTime = Math.max(effect.startTime, Date.now() - effect.duration + 800);
            this.addDistortionToShield(effect, intensity, radius);
        }
    },
    
    // ==========================================
    // ★★★ 쉴드 타격 VFX (가볍게) ★★★
    // ==========================================
    createHitEffect(screenX, screenY, intensity = 1.0, radius = 70) {
        const canvasWidth = this.canvas.clientWidth;
        const canvasHeight = this.canvas.clientHeight;
        const x = screenX - canvasWidth / 2;
        const y = -(screenY - canvasHeight / 2);
        
        const hitGroup = new THREE.Group();
        hitGroup.position.set(x, y, 50);
        this.scene.add(hitGroup);
        
        // ★ 1. 가벼운 화면 흔들림
        this.shakeScreen(3 * intensity, 80);
        
        // ★ 2. 작은 플래시
        const flashGeo = new THREE.SphereGeometry(20 * intensity, 12, 12);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0x88ddff,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        hitGroup.add(flash);
        
        // ★ 3. 육각형 파편 (적당히)
        const hexFragments = [];
        const numFragments = Math.floor(8 + 6 * intensity);
        
        for (let i = 0; i < numFragments; i++) {
            const hexShape = new THREE.Shape();
            const size = 5 + Math.random() * 8;
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j;
                const hx = size * Math.cos(angle);
                const hy = size * Math.sin(angle);
                if (j === 0) hexShape.moveTo(hx, hy);
                else hexShape.lineTo(hx, hy);
            }
            hexShape.closePath();
            
            const hexGeo = new THREE.ShapeGeometry(hexShape);
            const hexMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0x00ccff : 0x66ddff,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const hexMesh = new THREE.Mesh(hexGeo, hexMat);
            const angle = (i / numFragments) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const speed = 4 + Math.random() * 5;
            
            hexMesh.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    (Math.random() - 0.3) * speed,
                    Math.sin(angle) * speed * 0.4
                ),
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                life: 1.0
            };
            
            hitGroup.add(hexMesh);
            hexFragments.push(hexMesh);
        }
        
        // ★ 4. 스파크 (소량)
        const sparks = [];
        const numSparks = Math.floor(12 + 8 * intensity);
        
        for (let i = 0; i < numSparks; i++) {
            const sparkGeo = new THREE.SphereGeometry(1.5 + Math.random() * 2, 6, 6);
            const sparkMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xffffff : 0x88ddff,
                transparent: true,
                opacity: 1
            });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            
            spark.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    Math.random() * speed,
                    Math.sin(angle) * speed * 0.4
                ),
                gravity: -0.15,
                life: 1.0
            };
            
            hitGroup.add(spark);
            sparks.push(spark);
        }
        
        // ★ 5. 충격파 링 (하나만)
        const ringGeo = new THREE.TorusGeometry(12, 2, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ddff,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        hitGroup.add(ring);
        
        // ★ 애니메이션 (짧게)
        const startTime = Date.now();
        const duration = 400;
        
        const animateHit = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.scene.remove(hitGroup);
                hitGroup.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                return;
            }
            
            // 플래시
            if (flash.parent) {
                const fp = Math.min(progress * 6, 1);
                flash.scale.setScalar(1 + fp * 1.5);
                flash.material.opacity = 0.8 * (1 - fp);
            }
            
            // 파편
            hexFragments.forEach(hex => {
                if (!hex.parent) return;
                hex.position.add(hex.userData.velocity);
                hex.userData.velocity.multiplyScalar(0.95);
                hex.rotation.z += hex.userData.rotationSpeed;
                hex.userData.life -= 0.035;
                hex.material.opacity = hex.userData.life * 0.8;
            });
            
            // 스파크
            sparks.forEach(spark => {
                if (!spark.parent) return;
                spark.position.add(spark.userData.velocity);
                spark.userData.velocity.y += spark.userData.gravity;
                spark.userData.life -= 0.04;
                spark.material.opacity = spark.userData.life;
            });
            
            // 링
            if (ring.parent) {
                ring.scale.setScalar(1 + progress * 4);
                ring.material.opacity = 0.6 * (1 - progress);
            }
            
            requestAnimationFrame(animateHit);
        };
        
        animateHit();
    },
    
    // ★ 화면 흔들림 효과
    shakeScreen(intensity = 10, duration = 200) {
        const pixiCanvas = document.querySelector('canvas:not(#shield-3d-canvas)');
        if (!pixiCanvas) return;
        
        const originalTransform = pixiCanvas.style.transform || '';
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                pixiCanvas.style.transform = originalTransform;
                return;
            }
            
            const progress = elapsed / duration;
            const currentIntensity = intensity * (1 - progress);
            const offsetX = (Math.random() - 0.5) * currentIntensity * 2;
            const offsetY = (Math.random() - 0.5) * currentIntensity * 2;
            
            pixiCanvas.style.transform = `${originalTransform} translate(${offsetX}px, ${offsetY}px)`;
            requestAnimationFrame(shake);
        };
        
        shake();
    },
    
    // ==========================================
    // ★★★ 쉴드 파괴 VFX (3D - 대폭발!) ★★★
    // ==========================================
    createBreakEffect(screenX, screenY, intensity = 1.5) {
        if (!this.isInitialized) {
            if (!this.init()) return;
        }
        
        const canvasWidth = this.canvas.clientWidth;
        const canvasHeight = this.canvas.clientHeight;
        const x = screenX - canvasWidth / 2;
        const y = -(screenY - canvasHeight / 2);
        
        const breakGroup = new THREE.Group();
        breakGroup.position.set(x, y, 50);
        this.scene.add(breakGroup);
        
        // ★ 강한 화면 흔들림
        this.shakeScreen(12 * intensity, 300);
        
        // ★★★ 1. 거대한 플래시 폭발 ★★★
        const flashLayers = [];
        for (let i = 0; i < 4; i++) {
            const flashGeo = new THREE.SphereGeometry((60 - i * 12) * intensity, 16, 16);
            const flashMat = new THREE.MeshBasicMaterial({
                color: i < 2 ? 0xffffff : 0x00ccff,
                transparent: true,
                opacity: 1 - i * 0.15
            });
            const flash = new THREE.Mesh(flashGeo, flashMat);
            breakGroup.add(flash);
            flashLayers.push(flash);
        }
        
        // ★★★ 2. 대형 육각형 파편 폭발! ★★★
        const hexFragments = [];
        const numFragments = Math.floor(40 + 20 * intensity);
        
        for (let i = 0; i < numFragments; i++) {
            const hexShape = new THREE.Shape();
            const size = 10 + Math.random() * 20;
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j;
                const hx = size * Math.cos(angle);
                const hy = size * Math.sin(angle);
                if (j === 0) hexShape.moveTo(hx, hy);
                else hexShape.lineTo(hx, hy);
            }
            hexShape.closePath();
            
            const hexGeo = new THREE.ShapeGeometry(hexShape);
            const colors = [0xffffff, 0x88ddff, 0x00ccff, 0x44ffff, 0x00aaff];
            const hexMat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });
            
            const hexMesh = new THREE.Mesh(hexGeo, hexMat);
            
            // 폭발적으로 튀어나감!
            const angle = (i / numFragments) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
            const elevation = (Math.random() - 0.5) * Math.PI * 0.9;
            const speed = 12 + Math.random() * 18;
            
            hexMesh.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(elevation) * speed,
                    Math.sin(elevation) * speed + 5,
                    Math.sin(angle) * Math.cos(elevation) * speed * 0.7
                ),
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6
                ),
                life: 1.0
            };
            
            breakGroup.add(hexMesh);
            hexFragments.push(hexMesh);
        }
        
        // ★★★ 3. 스파크 폭풍! ★★★
        const sparks = [];
        const numSparks = Math.floor(80 + 40 * intensity);
        
        for (let i = 0; i < numSparks; i++) {
            const sparkGeo = new THREE.SphereGeometry(2 + Math.random() * 5, 6, 6);
            const sparkColors = [0xffffff, 0xffff00, 0x00ffff, 0xff8800];
            const sparkMat = new THREE.MeshBasicMaterial({
                color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
                transparent: true,
                opacity: 1
            });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            
            const angle = Math.random() * Math.PI * 2;
            const elevation = (Math.random() - 0.5) * Math.PI;
            const speed = 8 + Math.random() * 14;
            
            spark.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(elevation) * speed,
                    Math.sin(elevation) * speed + 5,
                    Math.sin(angle) * Math.cos(elevation) * speed * 0.6
                ),
                gravity: -0.3,
                life: 1.0
            };
            
            breakGroup.add(spark);
            sparks.push(spark);
        }
        
        // ★★★ 4. 전기 아크 난무! ★★★
        const arcs = [];
        for (let i = 0; i < 25; i++) {
            const points = [];
            const arcLength = 60 + Math.random() * 100;
            const arcAngle = Math.random() * Math.PI * 2;
            const segments = 12;
            
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                points.push(new THREE.Vector3(
                    Math.cos(arcAngle) * arcLength * t + (Math.random() - 0.5) * 35 * t,
                    Math.sin(arcAngle) * arcLength * t + (Math.random() - 0.5) * 35 * t,
                    (Math.random() - 0.5) * 20 * t
                ));
            }
            
            const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
            const arcMat = new THREE.LineBasicMaterial({
                color: Math.random() > 0.3 ? 0xffffff : 0x00ffff,
                transparent: true,
                opacity: 1
            });
            const arc = new THREE.Line(arcGeo, arcMat);
            arc.userData = { life: 1.0, flickerSpeed: 20 + Math.random() * 40 };
            
            breakGroup.add(arc);
            arcs.push(arc);
        }
        
        // ★★★ 5. 다중 충격파 링! ★★★
        const rings = [];
        for (let i = 0; i < 5; i++) {
            const ringGeo = new THREE.TorusGeometry(20, 5 - i * 0.8, 8, 48);
            const ringMat = new THREE.MeshBasicMaterial({
                color: i < 2 ? 0xffffff : 0x00ccff,
                transparent: true,
                opacity: 1 - i * 0.15
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.userData = { delay: i * 0.03 };
            breakGroup.add(ring);
            rings.push(ring);
        }
        
        // ★★★ 6. 붕괴하는 구체 ★★★
        const sphereGeo = new THREE.SphereGeometry(50 * intensity, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0x00ccff,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        const collapseSphere = new THREE.Mesh(sphereGeo, sphereMat);
        breakGroup.add(collapseSphere);
        
        // ★★★ 애니메이션 ★★★
        const startTime = Date.now();
        const duration = 1000;
        
        const animateBreak = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.scene.remove(breakGroup);
                breakGroup.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                return;
            }
            
            const time = Date.now() * 0.001;
            
            // 플래시 폭발
            flashLayers.forEach((flash, i) => {
                if (!flash.parent) return;
                const fp = Math.min(progress * 6, 1);
                flash.scale.setScalar(1 + fp * (5 - i));
                flash.material.opacity = (1 - fp) * (1 - i * 0.15);
            });
            
            // 파편 폭발!
            hexFragments.forEach(hex => {
                if (!hex.parent) return;
                hex.position.add(hex.userData.velocity);
                hex.userData.velocity.multiplyScalar(0.93);
                hex.userData.velocity.y -= 0.15;  // 중력
                hex.rotation.x += hex.userData.rotationSpeed.x;
                hex.rotation.y += hex.userData.rotationSpeed.y;
                hex.rotation.z += hex.userData.rotationSpeed.z;
                hex.userData.life -= 0.015;
                hex.material.opacity = hex.userData.life;
            });
            
            // 스파크
            sparks.forEach(spark => {
                if (!spark.parent) return;
                spark.position.add(spark.userData.velocity);
                spark.userData.velocity.y += spark.userData.gravity;
                spark.userData.velocity.multiplyScalar(0.95);
                spark.userData.life -= 0.02;
                spark.material.opacity = spark.userData.life;
                spark.scale.multiplyScalar(0.97);
            });
            
            // 아크 (깜빡임)
            arcs.forEach(arc => {
                if (!arc.parent) return;
                arc.userData.life -= 0.025;
                const flicker = Math.sin(time * arc.userData.flickerSpeed) > 0 ? 1 : 0.2;
                arc.material.opacity = arc.userData.life * flicker;
            });
            
            // 충격파 링
            rings.forEach((ring, i) => {
                if (!ring.parent) return;
                const rp = Math.max(0, progress - ring.userData.delay) / (1 - ring.userData.delay);
                if (rp > 0) {
                    ring.scale.setScalar(1 + rp * (12 - i * 2));
                    ring.material.opacity = (1 - i * 0.15) * (1 - rp);
                }
            });
            
            // 붕괴하는 구체
            if (collapseSphere.parent) {
                collapseSphere.rotation.x += 0.15;
                collapseSphere.rotation.y += 0.2;
                const sp = Math.min(progress * 3, 1);
                collapseSphere.scale.setScalar(1 + sp * 2);
                collapseSphere.material.opacity = 0.8 * (1 - sp);
            }
            
            requestAnimationFrame(animateBreak);
        };
        
        animateBreak();
    },
    
    // ==========================================
    // 기존 쉴드에 디스토션 효과 추가 (쉴드 구체가 있을 때)
    // ==========================================
    addDistortionToShield(effect, intensity, radius) {
        if (!effect || !effect.hexagons) return;
        
        const shieldRadius = effect.radius || radius || 70;
        
        // 타격 위치 계산
        const impactAngle = (Math.random() - 0.5) * Math.PI * 0.8;
        const impactElevation = (Math.random() - 0.5) * Math.PI * 0.5;
        
        const impactPoint = new THREE.Vector3(
            Math.sin(impactAngle) * shieldRadius * 0.7,
            Math.sin(impactElevation) * shieldRadius * 0.5,
            Math.cos(impactAngle) * Math.cos(impactElevation) * shieldRadius * 0.8
        );
        
        // 충격 추가 (애니메이션 루프에서 디스토션 적용)
        effect.impacts.push({
            position: impactPoint,
            radius: 0,
            intensity: 6 * intensity,
            sparks: []
        });
    },
    
    // ==========================================
    // 유닛 쉴드 타격
    // ==========================================
    hitAtUnit(unit, intensity = 1.0) {
        if (!unit) return;
        
        // ★ CombatEffects.getUnitPosition 사용 (쉴드 생성 위치와 동일)
        let screenX, screenY;
        
        if (typeof CombatEffects !== 'undefined' && CombatEffects.getUnitPosition) {
            const pos = CombatEffects.getUnitPosition(unit);
            if (pos) {
                screenX = pos.x;
                screenY = pos.y;
            }
        }
        
        // 폴백
        if (screenX === undefined) {
            const container = unit.container;
            if (!container || container.destroyed) return;
            
            if (container.getGlobalPosition) {
                const globalPos = container.getGlobalPosition();
                screenX = globalPos.x;
                screenY = globalPos.y;
            } else {
                screenX = container.x;
                screenY = container.y;
            }
            
            // 스프라이트 중앙으로 조정
            let spriteHeight = 120;
            const sprite = unit.sprite;
            if (sprite && !sprite.destroyed) {
                try {
                    const bounds = sprite.getLocalBounds();
                    const scaleY = Math.abs(sprite.scale?.y || 1);
                    spriteHeight = Math.abs(bounds.height) * scaleY;
                } catch (e) {}
            }
            screenY -= spriteHeight / 2;
        }
        
        // 스프라이트 크기에 맞는 반경
        let shieldRadius = 70;
        const sprite = unit.sprite;
        if (sprite && !sprite.destroyed) {
            try {
                const bounds = sprite.getLocalBounds();
                const scaleY = Math.abs(sprite.scale?.y || 1);
                shieldRadius = Math.abs(bounds.height) * scaleY * 0.7;
            } catch (e) {}
        }
        
        console.log(`[Shield3D] hitAtUnit: (${screenX}, ${screenY}), radius: ${shieldRadius}`);
        this.hitShield(screenX, screenY, intensity, shieldRadius);
    },
    
    // ==========================================
    // 이펙트 제거
    // ==========================================
    removeEffect(effect) {
        const index = this.activeEffects.indexOf(effect);
        if (index > -1) {
            this.activeEffects.splice(index, 1);
        }
        
        if (effect.group && effect.group.parent) {
            this.scene.remove(effect.group);
            
            // Dispose geometries and materials
            effect.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    },
    
    // ==========================================
    // 애니메이션 루프
    // ==========================================
    animate() {
        if (!this.isInitialized) return;
        
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // 각 이펙트 업데이트
        for (const effect of this.activeEffects) {
            // 구체 회전
            effect.sphere.rotation.y += 0.015;
            effect.sphere.rotation.x += 0.008;
            
            // 육각형 파동 + 충격 디스토션
            for (const hex of effect.hexagons) {
                let wave = Math.sin(time * 3 + hex.phase) * 0.4 + 0.6;
                let maxGlow = 0;
                let isHit = false;
                
                // 충격 효과 적용
                if (effect.impacts) {
                    for (let i = effect.impacts.length - 1; i >= 0; i--) {
                        const impact = effect.impacts[i];
                        const dist = hex.originalPos.distanceTo(impact.position);
                        
                        // 충격 범위 내
                        if (dist < impact.radius + 0.5) {
                            const ripple = Math.max(0, 1 - Math.abs(dist - impact.radius) / 0.5);
                            maxGlow = Math.max(maxGlow, ripple * impact.intensity);
                            
                            // 찌그러짐 (안쪽으로)
                            if (dist < 0.8 && impact.intensity > 3) {
                                const pullDir = impact.position.clone().sub(hex.originalPos).normalize();
                                hex.velocity.add(pullDir.multiplyScalar((0.8 - dist) * 0.02 * impact.intensity));
                                isHit = true;
                            }
                            
                            // 충격파 (바깥으로)
                            if (ripple > 0.1) {
                                const pushDir = hex.originalPos.clone().sub(impact.position).normalize();
                                hex.velocity.add(pushDir.multiplyScalar(0.005 * ripple));
                            }
                        }
                    }
                }
                
                // 디스토션 적용
                hex.velocity.multiplyScalar(0.88);
                hex.mesh.position.add(hex.velocity);
                
                // 원래 위치로 복원
                const restoreForce = hex.originalPos.clone().sub(hex.mesh.position).multiplyScalar(0.08);
                hex.velocity.add(restoreForce);
                
                // 색상 변화
                if (maxGlow > 0.1) {
                    wave = Math.min(1, wave + maxGlow * 0.3);
                    if (isHit) {
                        // 빨강/주황/흰색 플래시
                        const colors = [0xff3300, 0xffaa00, 0xffffff];
                        hex.mesh.material.color.setHex(colors[Math.floor(Math.random() * 3)]);
                    } else {
                        hex.mesh.material.color.setHex(0x66ffff);
                    }
                } else {
                    hex.mesh.material.color.setHex(0x00ffff);
                }
                
                hex.mesh.material.opacity = hex.baseOpacity * wave;
            }
            
            // 충격 업데이트
            if (effect.impacts) {
                for (let i = effect.impacts.length - 1; i >= 0; i--) {
                    effect.impacts[i].radius += 0.15;
                    effect.impacts[i].intensity *= 0.88;
                    
                    // 스파크 업데이트
                    if (effect.impacts[i].sparks) {
                        for (let j = effect.impacts[i].sparks.length - 1; j >= 0; j--) {
                            const spark = effect.impacts[i].sparks[j];
                            spark.userData.velocity.add(spark.userData.gravity);
                            spark.position.add(spark.userData.velocity);
                            spark.userData.life -= 0.03;
                            spark.material.opacity = spark.userData.life;
                            spark.scale.multiplyScalar(0.94);
                            
                            if (spark.userData.life <= 0) {
                                effect.group.remove(spark);
                                spark.geometry.dispose();
                                spark.material.dispose();
                                effect.impacts[i].sparks.splice(j, 1);
                            }
                        }
                    }
                    
                    if (effect.impacts[i].intensity < 0.05) {
                        // 남은 스파크 정리
                        if (effect.impacts[i].sparks) {
                            effect.impacts[i].sparks.forEach(s => {
                                effect.group.remove(s);
                                s.geometry.dispose();
                                s.material.dispose();
                            });
                        }
                        effect.impacts.splice(i, 1);
                    }
                }
            }
            
            // 전기 아크 업데이트
            if (effect.arcs) {
                for (let i = effect.arcs.length - 1; i >= 0; i--) {
                    const arc = effect.arcs[i];
                    arc.life -= 0.05;
                    const flicker = Math.sin(time * arc.flickerSpeed) * 0.5 + 0.5;
                    arc.mesh.material.opacity = arc.life * flicker;
                    
                    if (arc.life <= 0) {
                        effect.group.remove(arc.mesh);
                        arc.mesh.geometry.dispose();
                        arc.mesh.material.dispose();
                        effect.arcs.splice(i, 1);
                    }
                }
            }
            
            // 링 회전
            effect.ring.rotation.z += 0.02;
        }
        
        this.renderer.render(this.scene, this.camera);
    },
    
    // ==========================================
    // 유닛 위치에서 쉴드 표시
    // ==========================================
    showAtUnit(unit, options = {}) {
        if (!unit) return;
        
        // 유닛 스프라이트 중앙 좌표 계산
        const container = unit.container;
        if (!container || container.destroyed) return;
        
        let screenX = container.x;
        let screenY = container.y;
        
        // sprite 높이로 중앙 계산
        const sprite = unit.sprite;
        if (sprite && !sprite.destroyed) {
            try {
                const bounds = sprite.getLocalBounds();
                const scaleY = Math.abs(sprite.scale?.y || 1);
                const height = Math.abs(bounds.height) * scaleY;
                screenY -= height / 2;
            } catch (e) {
                screenY -= 60;
            }
        } else {
            screenY -= 60;
        }
        
        return this.createShield(screenX, screenY, options);
    },
    
    // ==========================================
    // 리사이즈 핸들러
    // ==========================================
    resize() {
        if (!this.isInitialized || !this.canvas) return;
        
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.left = -width / 2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = -height / 2;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    },
    
    // ==========================================
    // 정리
    // ==========================================
    dispose() {
        // 모든 이펙트 제거
        while (this.activeEffects.length > 0) {
            this.removeEffect(this.activeEffects[0]);
        }
        
        // 렌더러 정리
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // 캔버스 제거
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.isInitialized = false;
        console.log('[Shield3D] 정리 완료');
    }
};

// 전역 등록
if (typeof window !== 'undefined') {
    window.Shield3D = Shield3D;
    
    // 리사이즈 이벤트
    window.addEventListener('resize', () => Shield3D.resize());
}

console.log('[Shield3D] Three.js 쉴드 모듈 로드 완료');
