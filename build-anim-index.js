/**
 * anim/ 과 vfx/ 폴더를 스캔하여 index.json 및 번들 JS 생성
 * 사용법: node build-anim-index.js
 * 
 * 생성물:
 * - anim/index.json, vfx/index.json (기존)
 * - anim-bundle.js (모든 JSON을 인라인으로 포함, fetch 불필요!)
 */

const fs = require('fs');
const path = require('path');

function scanFolder(folderPath) {
    const files = [];
    
    if (!fs.existsSync(folderPath)) {
        console.log(`폴더 없음: ${folderPath}`);
        return files;
    }
    
    const items = fs.readdirSync(folderPath);
    
    for (const item of items) {
        if (item.endsWith('.json') && item !== 'index.json') {
            const id = item.replace('.json', '');
            files.push(id);
        }
    }
    
    return files.sort();
}

function loadAllJson(folderPath, fileList) {
    const data = {};
    
    for (const id of fileList) {
        const filePath = path.join(folderPath, `${id}.json`);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            data[id] = JSON.parse(content);
        } catch (e) {
            console.log(`⚠️ 로드 실패: ${filePath}`);
        }
    }
    
    return data;
}

function buildIndex() {
    // anim 폴더 스캔
    const animFiles = scanFolder('./anim');
    fs.writeFileSync('./anim/index.json', JSON.stringify(animFiles, null, 2));
    console.log(`✅ anim/index.json 생성: ${animFiles.length}개`);
    
    // vfx 폴더 스캔
    const vfxFiles = scanFolder('./vfx');
    fs.writeFileSync('./vfx/index.json', JSON.stringify(vfxFiles, null, 2));
    console.log(`✅ vfx/index.json 생성: ${vfxFiles.length}개`);
    
    console.log('\n📁 anim:', animFiles.join(', '));
    console.log('📁 vfx:', vfxFiles.join(', '));
    
    // === 번들 JS 생성 ===
    const animData = loadAllJson('./anim', animFiles);
    const vfxData = loadAllJson('./vfx', vfxFiles);
    
    const bundleContent = `/**
 * DDOO Animation Bundle - 자동 생성됨
 * 생성일: ${new Date().toISOString()}
 * 
 * 이 파일을 포함하면 fetch 없이 모든 애니메이션/VFX 데이터 사용 가능!
 * <script src="anim-bundle.js"></script>
 */

// 애니메이션 데이터 (${Object.keys(animData).length}개)
window.ANIM_BUNDLE = ${JSON.stringify(animData, null, 2)};

// VFX 데이터 (${Object.keys(vfxData).length}개)
window.VFX_BUNDLE = ${JSON.stringify(vfxData, null, 2)};

// 번들 로드 완료 플래그
window.ANIM_BUNDLE_LOADED = true;

console.log('[AnimBundle] ✅ 로드 완료:', Object.keys(ANIM_BUNDLE).length, 'anims,', Object.keys(VFX_BUNDLE).length, 'vfx');
`;
    
    fs.writeFileSync('./anim-bundle.js', bundleContent);
    console.log(`\n🎁 anim-bundle.js 생성 완료!`);
    console.log(`   - ${Object.keys(animData).length}개 애니메이션`);
    console.log(`   - ${Object.keys(vfxData).length}개 VFX`);
}

buildIndex();

