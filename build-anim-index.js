/**
 * anim/ 과 vfx/ 폴더를 스캔하여 index.json 생성
 * 사용법: node build-anim-index.js
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
}

buildIndex();

