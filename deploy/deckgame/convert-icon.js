const pngToIco = require('png-to-ico');
const fs = require('fs');

// 파일 읽기
const input = fs.readFileSync('hero.png');

pngToIco(input)
    .then(buf => {
        fs.writeFileSync('icon.ico', buf);
        console.log('✅ icon.ico 생성 완료!');
    })
    .catch(err => {
        console.error('❌ 변환 실패:', err);
    });

