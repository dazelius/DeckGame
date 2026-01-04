const fs = require('fs');
const path = require('path');

const animDir = 'anim';
const vfxDir = 'vfx';

const anims = {};
const vfx = {};

// 애니메이션 로드
console.log('📂 애니메이션 로딩...');
fs.readdirSync(animDir).filter(f => f.endsWith('.json') && f !== 'index.json').forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(animDir, f), 'utf8'));
    const id = data.id || f.replace('.json', '');
    anims[id] = data;
    console.log(`  ✓ ${id}`);
});

// VFX 로드
console.log('\n💥 VFX 로딩...');
fs.readdirSync(vfxDir).filter(f => f.endsWith('.json') && f !== 'index.json').forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(vfxDir, f), 'utf8'));
    const id = data.id || f.replace('.json', '');
    vfx[id] = data;
    console.log(`  ✓ ${id}`);
});

const bundle = `/**
 * DDOO Animation Bundle - 자동 생성됨
 * 생성일: ${new Date().toISOString()}
 * 
 * 이 파일을 포함하면 fetch 없이 모든 애니메이션/VFX 데이터 사용 가능!
 * <script src="anim-bundle.js"></script>
 */

// 애니메이션 데이터 (${Object.keys(anims).length}개)
window.ANIM_BUNDLE = ${JSON.stringify(anims, null, 2)};

// VFX 데이터 (${Object.keys(vfx).length}개)
window.VFX_BUNDLE = ${JSON.stringify(vfx, null, 2)};

// DDOOAction 캐시에 자동 로드
if (typeof DDOOAction !== 'undefined') {
    Object.entries(window.ANIM_BUNDLE).forEach(([id, data]) => DDOOAction.animCache.set(id, data));
    Object.entries(window.VFX_BUNDLE).forEach(([id, data]) => DDOOAction.vfxCache.set(id, data));
    console.log('[AnimBundle] ✅ 로드완료: 애님 ' + Object.keys(window.ANIM_BUNDLE).length + '개, VFX ' + Object.keys(window.VFX_BUNDLE).length + '개');
}
`;

fs.writeFileSync('anim-bundle.js', bundle, 'utf8');

console.log(`\n✅ 번들 생성 완료!`);
console.log(`   📁 anim-bundle.js`);
console.log(`   🎬 애니메이션: ${Object.keys(anims).length}개`);
console.log(`   💥 VFX: ${Object.keys(vfx).length}개`);

