class Game {
    constructor() {
        this.state = {
            health: 100,
            hunger: 100,
            clean: 100,
            sanity: 100,
            position: "DESK" // 初始位置在书房的桌子前
        };

        // 修改地图部分
        this.map = [
            "+-------------+-----------+----+",
            "|  BEDROOM    | STUDY    |BATH|",
            "| [___]    [] |[===] [#] |[=] |",
            "| BED      W  |DESK   B  | S  |",
            "+------+------+-----------+----+",
            "|      |     LIVING          |",
            "|      | [===]     [##]      |",
            "|BALC  |  SOFA      TV       |",
            "| {~}  |                     |",
            "| P C  |            +--------+",
            "+------+------------+KITCHEN |",
            "                    |[##] F  |",
            "                    +--------+"
        ];

        // 更新位置系统以匹配新地图
        this.locations = {
            // Bedroom
            "BED": { x: 2, y: 2 },
            "WARDROBE": { x: 10, y: 2 },
            
            // Study
            "DESK": { x: 15, y: 2 },
            "BOOKSHELF": { x: 21, y: 2 },
            
            // Bathroom
            "SHOWER": { x: 26, y: 2 },
            
            // Kitchen
            "FRIDGE": { x: 26, y: 11 },
            "STOVE": { x: 23, y: 11 },
            
            // Living Room
            "SOFA": { x: 15, y: 6 },
            "TV": { x: 21, y: 6 },
            
            // Balcony
            "PLANTS": { x: 2, y: 8 },
            "CHAIR": { x: 4, y: 8 }
        };

        this.initialize();
    }

    initialize() {
        // 初始化DOM元素引用
        this.terminal = document.getElementById('terminal-output');
        this.commandInput = document.getElementById('command-input');
        this.systemLog = document.getElementById('system-log');
        this.asciiMap = document.getElementById('ascii-map');

        // 添加调试信息
        if (!this.asciiMap) {
            console.error('ASCII map element not found!');
        } else {
            console.log('ASCII map element found');
        }

        // 立即显示初始地图
        this.updateMap();
        console.log('Initial map update called');

        // 设置事件监听
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleCommand(e.target.value);
                e.target.value = '';
            }
        });

        // 初始化游戏
        this.updateMap();
        this.updateStatus();
        this.startGameLoop();
        this.log('SYSTEM', 'Game initialization complete');
        this.log('SYSTEM', 'Type "help" for available commands');
        this.log('SYSTEM', 'Current location: ' + this.state.position);
        this.log('SYSTEM', 'Map Legend: @ marks your current position');
    }

    handleCommand(command) {
        // 在终端显示输入的命令
        this.appendToTerminal(`> ${command}`);

        // 改进命令解析逻辑
        let cmd = '', args = '';
        
        // 处理 move.to(location) 格式的命令
        if (command.toLowerCase().startsWith('move.to(')) {
            cmd = 'move';
            args = command.slice(8, -1).toUpperCase(); // 提取括号中的内容并转换为大写
        } else {
            // 处理其他命令
            cmd = command.replace(/[()]/g, '').toLowerCase(); // 移除括号并转为小写
        }

        // 命令处理
        switch(cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'move':
                this.movePlayer(args);
                break;
            case 'eat':
                this.eat();
                break;
            case 'sleep':
                this.sleep();
                break;
            case 'shower':
                this.shower();
                break;
            case 'status':
                this.showStatus();
                break;
            case 'scan':
                this.scanSurroundings();
                break;
            default:
                this.log('ERROR', `Unknown command: ${cmd}`);
        }
    }

    appendToTerminal(text) {
        const div = document.createElement('div');
        div.textContent = text;
        this.terminal.appendChild(div);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    log(type, message) {
        const div = document.createElement('div');
        div.textContent = `[${type}] ${message}`;
        if (type === 'ERROR') div.classList.add('error');
        if (type === 'WARNING') div.classList.add('warning');
        this.systemLog.appendChild(div);
        this.systemLog.scrollTop = this.systemLog.scrollHeight;
    }

    updateMap() {
        if (!this.asciiMap) {
            console.error('ASCII map element not found in updateMap');
            return;
        }

        // 创建地图副本
        let currentMap = [...this.map];
        
        // 在当前位置添加闪烁的标记 (@)
        const pos = this.locations[this.state.position];
        if (pos) {
            let line = currentMap[pos.y];
            currentMap[pos.y] = line.substring(0, pos.x) + '@' + line.substring(pos.x + 1);
        }

        // 确保地图正确显示
        this.asciiMap.textContent = currentMap.join('\n');
        console.log('Map updated:', currentMap.join('\n')); // 调试信息
    }

    updateStatus() {
        document.getElementById('health-bar').style.width = `${this.state.health}%`;
        document.getElementById('hunger-bar').style.width = `${this.state.hunger}%`;
        document.getElementById('clean-bar').style.width = `${this.state.clean}%`;
        document.getElementById('sanity-bar').style.width = `${this.state.sanity}%`;
    }

    startGameLoop() {
        setInterval(() => {
            // 每分钟降低状态值
            this.state.hunger = Math.max(0, this.state.hunger - 1);
            this.state.clean = Math.max(0, this.state.clean - 0.5);
            this.state.sanity = Math.max(0, this.state.sanity - 0.3);
            
            // 更新状态显示
            this.updateStatus();

            // 状态警告
            if (this.state.hunger < 20) {
                this.log('WARNING', 'Hunger level critical');
            }
            if (this.state.sanity < 20) {
                this.log('WARNING', 'Mental state unstable');
            }
            if (this.state.clean < 20) {
                this.log('WARNING', 'Cleanliness level low');
            }
        }, 60000); // 每分钟执行一次
    }

    showHelp() {
        const commands = [
            'help - Show command list',
            'move.to(location) - Move to a location:',
            '  Bedroom: bed, wardrobe',
            '  Study: desk, bookshelf',
            '  Bathroom: shower, sink',
            '  Kitchen: fridge, stove',
            '  Living Room: sofa, tv',
            '  Balcony: plants, chair',
            'interact() - Interact with current location',
            'status() - Show current status',
            'scan() - Scan surroundings'
        ];
        commands.forEach(cmd => this.appendToTerminal(cmd));
    }

    movePlayer(location) {
        this.log('SYSTEM', `Attempting to move to: ${location}`);
        
        if (!location) {
            this.log('ERROR', 'Please specify a location');
            return;
        }
        
        this.log('SYSTEM', `Available locations: ${Object.keys(this.locations).join(', ')}`);
        
        if (!this.locations[location]) {
            this.log('ERROR', `Invalid location: ${location}`);
            this.log('SYSTEM', 'Valid locations are: bed, desk, bath, fridge');
            return;
        }
        
        this.state.position = location;
        this.log('SYSTEM', `Successfully moved to ${location}`);
        this.updateMap();
    }

    eat() {
        if (this.state.position !== 'FRIDGE') {
            this.log('ERROR', 'Must be at FRIDGE to eat');
            return;
        }
        if (this.state.hunger >= 100) {
            this.log('SYSTEM', 'Already full');
            return;
        }
        this.state.hunger = Math.min(100, this.state.hunger + 30);
        this.updateStatus();
        this.log('SYSTEM', 'Food consumed');
    }

    sleep() {
        if (this.state.position !== 'BED') {
            this.log('ERROR', 'Must be at BED to sleep');
            return;
        }
        this.log('SYSTEM', 'Resting...');
        setTimeout(() => {
            this.state.sanity = Math.min(100, this.state.sanity + 50);
            this.updateStatus();
            this.log('SYSTEM', 'Rest complete');
        }, 3000);
    }

    shower() {
        if (this.state.position !== 'SHOWER') {
            this.log('ERROR', 'Must be at SHOWER to take a shower');
            return;
        }
        if (this.state.clean >= 100) {
            this.log('SYSTEM', 'Already clean');
            return;
        }
        this.log('SYSTEM', 'Taking a shower...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 50);
            this.updateStatus();
            this.log('SYSTEM', 'Shower complete. Feeling refreshed!');
        }, 3000);
    }

    showStatus() {
        const status = [
            `Health: ${this.state.health}%`,
            `Hunger: ${this.state.hunger}%`,
            `Cleanliness: ${this.state.clean}%`,
            `Sanity: ${this.state.sanity}%`,
            `Location: ${this.state.position}`
        ];
        status.forEach(s => this.appendToTerminal(s));
    }

    scanSurroundings() {
        const surroundings = {
            'DESK': 'A computer desk with multiple monitors in a cozy corner of the study.',
            'BED': 'A comfortable bed in the spacious bedroom.',
            'SHOWER': 'A modern shower in the bright bathroom.',
            'SINK': 'A clean sink with a large mirror.',
            'FRIDGE': 'A well-stocked fridge in the open-plan kitchen.',
            'STOVE': 'A modern cooking station with good ventilation.',
            'BOOKSHELF': 'A tall bookshelf filled with programming books and novels.',
            'SOFA': 'A comfortable sofa in the living room with a view of the TV.',
            'TV': 'A large flat-screen TV mounted on the wall.',
            'PLANTS': 'Some potted plants on the peaceful balcony.',
            'CHAIR': 'A comfortable outdoor chair perfect for relaxation.',
            'WARDROBE': 'A spacious wardrobe with your clothes neatly organized.'
        };
        this.log('SYSTEM', `Scanning current location: ${this.state.position}`);
        this.log('SYSTEM', surroundings[this.state.position] || 'Nothing special here');
    }

    // 更新物品交互系统
    interactWith(item) {
        const interactions = {
            "BED": () => this.sleep(),
            "SHOWER": () => this.shower(),
            "SINK": () => this.washHands(),
            "FRIDGE": () => this.eat(),
            "STOVE": () => this.cook(),
            "BOOKSHELF": () => this.read(),
            "DESK": () => this.work(),
            "SOFA": () => this.watchTV(),
            "TV": () => this.watchTV(),
            "PLANTS": () => this.waterPlants(),
            "WARDROBE": () => this.changeClothes(),
            "CHAIR": () => this.relax()
        };

        if (interactions[item]) {
            interactions[item]();
        } else {
            this.log('ERROR', 'Cannot interact with this item');
        }
    }

    // 添加新的交互方法
    washHands() {
        if (this.state.position !== 'SINK') {
            this.log('ERROR', 'Must be at SINK to wash hands');
            return;
        }
        this.log('SYSTEM', 'Washing hands...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 10);
            this.updateStatus();
            this.log('SYSTEM', 'Hands clean!');
        }, 1000);
    }

    cook() {
        if (this.state.position !== 'STOVE') {
            this.log('ERROR', 'Must be at STOVE to cook');
            return;
        }
        this.log('SYSTEM', 'Cooking a meal...');
        setTimeout(() => {
            this.state.hunger = Math.min(100, this.state.hunger + 50);
            this.updateStatus();
            this.log('SYSTEM', 'Meal prepared and eaten. Very satisfying!');
        }, 5000);
    }

    read() {
        if (this.state.position !== 'BOOKSHELF') {
            this.log('ERROR', 'Must be at BOOKSHELF to read');
            return;
        }
        this.log('SYSTEM', 'Reading a book...');
        setTimeout(() => {
            this.state.sanity = Math.min(100, this.state.sanity + 20);
            this.updateStatus();
            this.log('SYSTEM', 'Finished reading. Gained some knowledge!');
        }, 4000);
    }

    work() {
        if (this.state.position !== 'DESK') {
            this.log('ERROR', 'Must be at DESK to work');
            return;
        }
        this.log('SYSTEM', 'Working on code...');
        setTimeout(() => {
            this.state.sanity = Math.max(0, this.state.sanity - 10);
            this.updateStatus();
            this.log('SYSTEM', 'Work session complete. Feeling tired...');
        }, 5000);
    }

    watchTV() {
        if (this.state.position !== 'SOFA' && this.state.position !== 'TV') {
            this.log('ERROR', 'Must be at SOFA or TV to watch television');
            return;
        }
        this.log('SYSTEM', 'Watching TV...');
        setTimeout(() => {
            this.state.sanity = Math.min(100, this.state.sanity + 15);
            this.updateStatus();
            this.log('SYSTEM', 'Entertainment time complete. Feeling relaxed!');
        }, 3000);
    }

    waterPlants() {
        if (this.state.position !== 'PLANTS') {
            this.log('ERROR', 'Must be at PLANTS to water them');
            return;
        }
        this.log('SYSTEM', 'Watering plants...');
        setTimeout(() => {
            this.state.sanity = Math.min(100, this.state.sanity + 5);
            this.updateStatus();
            this.log('SYSTEM', 'Plants watered. The greenery is soothing.');
        }, 2000);
    }

    changeClothes() {
        if (this.state.position !== 'WARDROBE') {
            this.log('ERROR', 'Must be at WARDROBE to change clothes');
            return;
        }
        this.log('SYSTEM', 'Changing clothes...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 20);
            this.updateStatus();
            this.log('SYSTEM', 'Changed into fresh clothes. Feeling neat!');
        }, 2000);
    }

    relax() {
        if (this.state.position !== 'CHAIR') {
            this.log('ERROR', 'Must be at CHAIR to relax');
            return;
        }
        this.log('SYSTEM', 'Relaxing in the balcony...');
        setTimeout(() => {
            this.state.sanity = Math.min(100, this.state.sanity + 25);
            this.updateStatus();
            this.log('SYSTEM', 'Fresh air and city views are refreshing!');
        }, 3000);
    }
}

// 游戏启动
window.onload = () => {
    new Game();
}; 