// ==========================================
// 플레이어 기본 스탯 정의
// ==========================================

const PlayerBaseStats = {
    // ==========================================
    // 기본 스탯
    // ==========================================
    maxHp: 35,          // 최대 체력
    startEnergy: 3,     // 시작 에너지
    maxEnergy: 3,       // 최대 에너지
    drawPerTurn: 5,     // 턴당 드로우 수
    startBlock: 0,      // 시작 방어력
    
    // ==========================================
    // 업그레이드 키 (localStorage)
    // ==========================================
    upgradeKey: 'lordofnight_upgrades',
    
    // ==========================================
    // 업그레이드 가져오기
    // ==========================================
    getUpgrades() {
        const saved = localStorage.getItem(this.upgradeKey);
        return saved ? JSON.parse(saved) : {
            maxHp: 0,
            energy: 0,
            draw: 0,
            startBlock: 0
        };
    },
    
    // ==========================================
    // 업그레이드 저장
    // ==========================================
    saveUpgrades(upgrades) {
        localStorage.setItem(this.upgradeKey, JSON.stringify(upgrades));
    },
    
    // ==========================================
    // 최종 스탯 계산 (기본 + 업그레이드)
    // ==========================================
    getFinalStats() {
        const upgrades = this.getUpgrades();
        
        return {
            maxHp: this.maxHp + (upgrades.maxHp || 0),
            maxEnergy: this.maxEnergy + (upgrades.energy || 0),
            startEnergy: this.startEnergy + (upgrades.energy || 0),
            drawPerTurn: this.drawPerTurn + (upgrades.draw || 0),
            startBlock: this.startBlock + (upgrades.startBlock || 0)
        };
    },
    
    // ==========================================
    // 개별 스탯 가져오기
    // ==========================================
    getMaxHp() {
        const upgrades = this.getUpgrades();
        return this.maxHp + (upgrades.maxHp || 0);
    },
    
    getMaxEnergy() {
        const upgrades = this.getUpgrades();
        return this.maxEnergy + (upgrades.energy || 0);
    },
    
    getDrawPerTurn() {
        const upgrades = this.getUpgrades();
        return this.drawPerTurn + (upgrades.draw || 0);
    },
    
    getStartBlock() {
        const upgrades = this.getUpgrades();
        return this.startBlock + (upgrades.startBlock || 0);
    },
    
    // ==========================================
    // 새 게임용 플레이어 객체 생성
    // ==========================================
    createNewPlayer() {
        const stats = this.getFinalStats();
        
        return {
            hp: stats.maxHp,
            maxHp: stats.maxHp,
            block: stats.startBlock,
            energy: stats.startEnergy,
            maxEnergy: stats.maxEnergy,
            blind: 0,
            vulnerable: 0
        };
    },
    
    // ==========================================
    // 업그레이드 적용 (개별)
    // ==========================================
    applyUpgrade(type, amount) {
        const upgrades = this.getUpgrades();
        upgrades[type] = (upgrades[type] || 0) + amount;
        this.saveUpgrades(upgrades);
        return upgrades;
    },
    
    // ==========================================
    // 업그레이드 리셋 (디버그용)
    // ==========================================
    resetUpgrades() {
        localStorage.removeItem(this.upgradeKey);
        console.log('[PlayerStats] 업그레이드 리셋됨');
    },
    
    // ==========================================
    // 스탯 정보 출력 (디버그용)
    // ==========================================
    printStats() {
        const stats = this.getFinalStats();
        const upgrades = this.getUpgrades();
        
        console.log('=== 플레이어 스탯 ===');
        console.log(`최대 체력: ${this.maxHp} + ${upgrades.maxHp || 0} = ${stats.maxHp}`);
        console.log(`최대 에너지: ${this.maxEnergy} + ${upgrades.energy || 0} = ${stats.maxEnergy}`);
        console.log(`턴당 드로우: ${this.drawPerTurn} + ${upgrades.draw || 0} = ${stats.drawPerTurn}`);
        console.log(`시작 방어력: ${this.startBlock} + ${upgrades.startBlock || 0} = ${stats.startBlock}`);
        console.log('====================');
    }
};

// 전역 접근용
window.PlayerBaseStats = PlayerBaseStats;

console.log('[PlayerStats] 플레이어 스탯 시스템 로드 완료');


