#!/usr/bin/env python3
"""
DDOO Animation Bundle Generator
애니메이션/VFX JSON을 하나의 JS 번들로 합침
"""

import os
import json
from datetime import datetime

# 애니메이션과 VFX 폴더
anim_dir = 'anim'
vfx_dir = 'vfx'

anims = {}
vfx = {}

# 애니메이션 JSON 로드
print("📂 애니메이션 로딩...")
for f in sorted(os.listdir(anim_dir)):
    if f.endswith('.json') and f != 'index.json':
        with open(os.path.join(anim_dir, f), 'r', encoding='utf-8') as fp:
            data = json.load(fp)
            anim_id = data.get('id', f.replace('.json', ''))
            anims[anim_id] = data
            print(f"  ✓ {anim_id}")

# VFX JSON 로드
print("\n💥 VFX 로딩...")
for f in sorted(os.listdir(vfx_dir)):
    if f.endswith('.json') and f != 'index.json':
        with open(os.path.join(vfx_dir, f), 'r', encoding='utf-8') as fp:
            data = json.load(fp)
            vfx_id = data.get('id', f.replace('.json', ''))
            vfx[vfx_id] = data
            print(f"  ✓ {vfx_id}")

# 번들 생성
bundle = f'''/**
 * DDOO Animation Bundle - 자동 생성됨
 * 생성일: {datetime.now().isoformat()}
 * 
 * 이 파일을 포함하면 fetch 없이 모든 애니메이션/VFX 데이터 사용 가능!
 * <script src="anim-bundle.js"></script>
 */

// 애니메이션 데이터 ({len(anims)}개)
window.ANIM_BUNDLE = {json.dumps(anims, ensure_ascii=False, indent=2)};

// VFX 데이터 ({len(vfx)}개)
window.VFX_BUNDLE = {json.dumps(vfx, ensure_ascii=False, indent=2)};

// DDOOAction 캐시에 자동 로드
if (typeof DDOOAction !== 'undefined') {{
    Object.entries(window.ANIM_BUNDLE).forEach(([id, data]) => DDOOAction.animCache.set(id, data));
    Object.entries(window.VFX_BUNDLE).forEach(([id, data]) => DDOOAction.vfxCache.set(id, data));
    console.log('[AnimBundle] ✅ 로드완료: 애님 ' + Object.keys(window.ANIM_BUNDLE).length + '개, VFX ' + Object.keys(window.VFX_BUNDLE).length + '개');
}}
'''

with open('anim-bundle.js', 'w', encoding='utf-8') as fp:
    fp.write(bundle)

print(f"\n✅ 번들 생성 완료!")
print(f"   📁 anim-bundle.js")
print(f"   🎬 애니메이션: {len(anims)}개")
print(f"   💥 VFX: {len(vfx)}개")

