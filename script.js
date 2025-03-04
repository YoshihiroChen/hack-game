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

        // 更新位置系统
        this.locations = {
            // Rooms
            "BEDROOM": { x: 6, y: 2 },
            "STUDY": { x: 17, y: 2 },
            "BATHROOM": { x: 25, y: 2 },
            "KITCHEN": { x: 24, y: 11 },
            "LIVING": { x: 18, y: 7 },
            "BALCONY": { x: 4, y: 9 },
            
            // Items in rooms
            "BED": { x: 2, y: 2 },
            "WARDROBE": { x: 10, y: 2 },
            "DESK": { x: 15, y: 2 },
            "BOOKSHELF": { x: 21, y: 2 },
            "SHOWER": { x: 26, y: 2 },
            "FRIDGE": { x: 26, y: 11 },
            "STOVE": { x: 23, y: 11 },
            "SOFA": { x: 15, y: 6 },
            "TV": { x: 21, y: 6 },
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

        // 初始化游戏
        this.updateMap();
        this.updateStatus();
        this.startGameLoop();
        this.log('SYSTEM', 'Game initialization complete');
        this.log('SYSTEM', 'Type "help" for available commands');
        this.log('SYSTEM', 'Current location: ' + this.state.position);
        this.log('SYSTEM', 'Map Legend: @ marks your current position');

        // 显示欢迎信息
        this.log('SYSTEM', '=== Welcome to Programmer\'s Life Simulator ===');
        this.log('SYSTEM', 'Press ENTER to start the tutorial...');
        
        // 等待用户按Enter开始教程
        const startTutorial = (e) => {
            if (e.key === 'Enter') {
                this.commandInput.removeEventListener('keypress', startTutorial);
                this.showTutorial();
            }
        };
        
        this.commandInput.addEventListener('keypress', startTutorial);
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
            case 'status':
                this.showStatus();
                break;
            case 'scan':
                this.scanSurroundings();
                break;
            // 添加所有交互命令
            case 'sleep':
                this.sleep();
                break;
            case 'shower':
                this.shower();
                break;
            case 'eat':
                this.eat();
                break;
            case 'work':
                this.work();
                break;
            case 'watchtv':
                this.watchTV();
                break;
            case 'waterplants':
                this.waterPlants();
                break;
            case 'changeclothes':
                this.changeClothes();
                break;
            case 'relax':
                this.relax();
                break;
            case 'read':
                this.read();
                break;
            case 'cook':
                this.cook();
                break;
            case 'washhands':
                this.washHands();
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
        
        // 在当前位置添加带颜色的标记 (@)
        const pos = this.locations[this.state.position];
        if (pos) {
            // 清空原有内容
            this.asciiMap.innerHTML = '';
            
            // 分三部分添加：标记位置之前的内容、标记、标记位置之后的内容
            for (let i = 0; i < currentMap.length; i++) {
                if (i === pos.y) {
                    const line = currentMap[i];
                    const before = line.substring(0, pos.x);
                    const after = line.substring(pos.x + 1);
                    
                    const span = document.createElement('span');
                    span.textContent = before;
                    this.asciiMap.appendChild(span);
                    
                    const playerSpan = document.createElement('span');
                    playerSpan.textContent = '@';
                    playerSpan.className = 'player-position';
                    this.asciiMap.appendChild(playerSpan);
                    
                    const endSpan = document.createElement('span');
                    endSpan.textContent = after + '\n';
                    this.asciiMap.appendChild(endSpan);
                } else {
                    const span = document.createElement('span');
                    span.textContent = currentMap[i] + '\n';
                    this.asciiMap.appendChild(span);
                }
            }
        } else {
            this.asciiMap.textContent = currentMap.join('\n');
        }
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

        // 定义房间和其包含的物品
        const rooms = {
            'BEDROOM': {
                description: 'You are in the bedroom. You can move to:',
                items: {
                    'BED': 'sleep() to restore mental health',
                    'WARDROBE': 'changeClothes() to improve cleanliness'
                }
            },
            'STUDY': {
                description: 'You are in the study. You can move to:',
                items: {
                    'DESK': 'work() to code and earn money',
                    'BOOKSHELF': 'read() to gain knowledge'
                }
            },
            'BATHROOM': {
                description: 'You are in the bathroom. You can move to:',
                items: {
                    'SHOWER': 'shower() to improve cleanliness'
                }
            },
            'KITCHEN': {
                description: 'You are in the kitchen. You can move to:',
                items: {
                    'FRIDGE': 'eat() to restore hunger',
                    'STOVE': 'cook() for a better meal'
                }
            },
            'LIVING': {
                description: 'You are in the living room. You can move to:',
                items: {
                    'SOFA': 'watchTV() to relax',
                    'TV': 'watchTV() to relax'
                }
            },
            'BALCONY': {
                description: 'You are on the balcony. You can move to:',
                items: {
                    'PLANTS': 'waterPlants() to improve mood',
                    'CHAIR': 'relax() to enjoy fresh air'
                }
            }
        };

        // 检查是否是房间名
        if (rooms.hasOwnProperty(location)) {
            const room = rooms[location];
            this.state.position = location;
            this.log('SYSTEM', `Successfully moved to ${location}`);
            this.log('SYSTEM', room.description);
            
            // 列出房间内可用的物品和操作
            Object.entries(room.items).forEach(([item, action]) => {
                this.log('SYSTEM', `- move.to(${item}) to ${action}`);
            });
            
            this.updateMap();
        }
        // 检查是否是具体物品
        else if (Object.values(rooms).some(room => room.items.hasOwnProperty(location))) {
            this.state.position = location;
            this.log('SYSTEM', `Moved to ${location}`);
            
            // 显示当前位置可以执行的操作
            Object.entries(rooms).forEach(([roomName, room]) => {
                if (room.items.hasOwnProperty(location)) {
                    this.log('SYSTEM', `You can ${room.items[location]}`);
                }
            });
            
            this.updateMap();
        }
        else {
            this.log('ERROR', `Invalid location: ${location}`);
            this.log('SYSTEM', 'Valid rooms are: BEDROOM, STUDY, BATHROOM, KITCHEN, LIVING, BALCONY');
        }
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

    // 添加新的教程方法
    showTutorial() {
        const tutorial = [
            {
                title: 'Basic Controls Guide',
                content: [
                    'Welcome to the Programmer\'s Life Simulator. You need to balance your basic needs while coding.',
                    'The @ symbol on the map marks your current position.',
                    'You can use these basic commands:',
                    '1. move.to(location) - Move to a specific location',
                    '2. status() - Check your current status',
                    '3. scan() - Look around your environment',
                    '4. help - Show all available commands'
                ]
            },
            {
                title: 'Rooms and Locations',
                content: [
                    'The house is divided into these areas:',
                    '- Bedroom: Has a bed(BED) and wardrobe(WARDROBE)',
                    '- Study: Has a desk(DESK) and bookshelf(BOOKSHELF)',
                    '- Bathroom: Has a shower(SHOWER)',
                    '- Kitchen: Has a fridge(FRIDGE) and stove(STOVE)',
                    '- Living Room: Has a sofa(SOFA) and TV(TV)',
                    '- Balcony: Has plants(PLANTS) and chair(CHAIR)'
                ]
            },
            {
                title: 'Daily Activities',
                content: [
                    'Different locations allow different activities:',
                    '- At bed: sleep() - Restore mental health',
                    '- At shower: shower() - Improve cleanliness',
                    '- At fridge: eat() - Restore hunger',
                    '- At desk: work() - Code and work',
                    '- At sofa: watchTV() - Relax',
                    '- At balcony: relax() - Enjoy fresh air'
                ]
            },
            {
                title: 'Status Management',
                content: [
                    'You need to monitor these status bars:',
                    '- Hunger: Need regular meals from fridge',
                    '- Clean: Need showers and change of clothes',
                    '- Sanity: Need rest and entertainment',
                    'You\'ll receive warnings when any status drops below 20%'
                ]
            },
            {
                title: 'Example Actions',
                content: [
                    'For example, to go to sleep:',
                    '1. Type move.to(bed) to move to the bed',
                    '2. Type sleep() to start sleeping',
                    '',
                    'To take a shower:',
                    '1. Type move.to(shower) to move to the shower',
                    '2. Type shower() to start showering'
                ]
            }
        ];

        let currentSection = 0;
        let currentLine = 0;
        
        // 保存原始的命令处理器
        const originalHandler = this.commandInput.onkeypress;
        const originalHandleCommand = this.handleCommand.bind(this);
        
        // 临时替换handleCommand方法
        this.handleCommand = () => {
            // 在教程模式下不处理命令
        };
        
        const showNextLine = () => {
            if (currentSection >= tutorial.length) {
                // 教程结束，恢复原始命令处理
                this.log('SYSTEM', 'Tutorial completed! Try typing "help" to see all commands, or "scan()" to check your surroundings.');
                this.log('SYSTEM', 'Enjoy your game!');
                
                // 恢复原始的handleCommand方法
                this.handleCommand = originalHandleCommand;
                
                // 移除教程的keypress处理器
                this.commandInput.onkeypress = null;
                
                // 添加新的命令处理器
                this.commandInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const command = e.target.value;
                        if (command.trim()) {  // 只处理非空命令
                            this.handleCommand(command);
                        }
                        e.target.value = '';
                    }
                });
                
                return;
            }

            const section = tutorial[currentSection];
            
            if (currentLine === 0) {
                this.log('TUTORIAL', `=== ${section.title} ===`);
            }

            if (currentLine < section.content.length) {
                this.log('TUTORIAL', section.content[currentLine]);
                currentLine++;
            } else {
                this.log('TUTORIAL', '');
                currentSection++;
                currentLine = 0;
            }
        };

        // 替换命令处理器
        this.commandInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // 阻止默认行为
                this.commandInput.value = ''; // 清空输入框
                showNextLine();
            }
        };

        // 显示第一行
        this.log('SYSTEM', 'Press ENTER to continue through the tutorial...');
        showNextLine();
    }
}

// 游戏启动
window.onload = () => {
    new Game();
}; 