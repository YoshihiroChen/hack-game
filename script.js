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
            "| [___]    [] |[=&=] [#] |[=] |",
            "| BED      W  |DESK   B  | S  |",
            "+------+------+-----------+----+",
            "|      |     LIVING          |",
            "|      | [===]     [##]      |",
            "|BALC  |  SOFA      TV       |",
            "| [W]  |                     |",
            "| P C  |            +--------+",
            "+------+------------+KITCHEN |",
            "                    |[##] F  |",
            "                    +--------+"
        ];

        // 更新位置系统
        this.locations = {
            // Rooms
            "BEDROOM": { x: 7, y: 2 },     // 在bed和wardrobe的[]之间
            "STUDY": { x: 19, y: 2 },      // 在[=&=]和[#]之间
            "BATHROOM": { x: 27, y: 2 },    // 保持不变
            "KITCHEN": { x: 25, y: 11 },    // 在[##]和F之间
            "LIVING": { x: 18, y: 7 },      // 保持不变
            "BALCONY": { x: 6, y: 8 },      // 在P和C之间
            "WASHER": { x: 2, y: 8 },      // 在P C上方
            
            // Items in rooms
            "BED": { x: 2, y: 2 },
            "WARDROBE": { x: 10, y: 2 },
            "DESK": { x: 15, y: 2 },
            "BOOKSHELF": { x: 21, y: 2 },
            "SHOWER": { x: 26, y: 2 },
            "FRIDGE": { x: 26, y: 11 },
            "STOVE": { x: 23, y: 11 },
            "SOFA": { x: 17, y: 6 },       // 修改坐标让@显示在[===]中间
            "TV": { x: 21, y: 6 },
            "PLANTS": { x: 2, y: 8 },
            "CHAIR": { x: 4, y: 8 }
        };

        // 添加时间系统
        this.gameTime = {
            day: 1,
            hour: 9,
            minute: 0
        };
        
        // 添加任务系统
        this.tasks = [];
        this.generateDailyTasks();
        
        // 启动时间系统
        this.startTimeSystem();

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
        }

        // 初始化游戏
        this.updateMap();
        this.updateStatus();
        this.startGameLoop();
        
        // 显示欢迎信息
        this.log('SYSTEM', '=== Welcome to Programmer\'s Life Simulator ===');
        this.log('SYSTEM', 'Type "help" for available commands');
        this.log('SYSTEM', 'Type "tutorial" to view the tutorial');
        this.log('SYSTEM', 'Current location: ' + this.state.position);
        this.log('SYSTEM', 'Map Legend: @ - Your spirit, & - Your physical body');

        // 添加命令处理监听器
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = e.target.value;
                if (command.trim()) {
                    this.handleCommand(command);
                }
                e.target.value = '';
            }
        });
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
            case 'tutorial':
                this.showTutorial();
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
            case 'washclothes':
                this.washClothes();
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
        
        // 清空原有内容
        this.asciiMap.innerHTML = '';
        
        // 分行添加内容
        for (let i = 0; i < currentMap.length; i++) {
            if (i === 2) { // DESK所在的行
                const line = currentMap[i];
                const deskStart = line.indexOf('[=') + 2;  // 找到[=的位置并加2
                const playerPos = this.locations[this.state.position];
                
                // 分三段：desk之前、desk标记、desk之后
                const beforeDesk = line.substring(0, deskStart);
                const afterDesk = line.substring(deskStart + 1);
                
                // 添加desk之前的内容
                if (playerPos && playerPos.y === 2 && playerPos.x < deskStart) {
                    const beforePlayer = beforeDesk.substring(0, playerPos.x);
                    const afterPlayer = beforeDesk.substring(playerPos.x + 1);
                    
                    this.asciiMap.appendChild(this.createTextSpan(beforePlayer));
                    this.asciiMap.appendChild(this.createPlayerSpan('@'));
                    this.asciiMap.appendChild(this.createTextSpan(afterPlayer));
                } else {
                    this.asciiMap.appendChild(this.createTextSpan(beforeDesk));
                }
                
                // 添加desk标记（&）
                this.asciiMap.appendChild(this.createBodySpan('&'));
                
                // 添加desk之后的内容
                if (playerPos && playerPos.y === 2 && playerPos.x > deskStart) {
                    const beforePlayer = afterDesk.substring(0, playerPos.x - deskStart - 1);
                    const afterPlayer = afterDesk.substring(playerPos.x - deskStart);
                    
                    this.asciiMap.appendChild(this.createTextSpan(beforePlayer));
                    this.asciiMap.appendChild(this.createPlayerSpan('@'));
                    this.asciiMap.appendChild(this.createTextSpan(afterPlayer + '\n'));
                } else {
                    this.asciiMap.appendChild(this.createTextSpan(afterDesk + '\n'));
                }
            } else if (i === 6 && this.state.position === 'SOFA') { // SOFA所在的行
                const line = currentMap[i];
                const sofaStart = line.indexOf('[===]');  // 找到[===]的起始位置
                
                const beforeSofa = line.substring(0, sofaStart);
                const afterSofa = line.substring(sofaStart + 5);  // 跳过整个[===]
                
                this.asciiMap.appendChild(this.createTextSpan(beforeSofa));
                this.asciiMap.appendChild(this.createTextSpan('[='));
                this.asciiMap.appendChild(this.createPlayerSpan('@'));
                this.asciiMap.appendChild(this.createTextSpan('=]'));
                this.asciiMap.appendChild(this.createTextSpan(afterSofa + '\n'));
            } else {
                // 处理其他行
                if (this.locations[this.state.position]?.y === i && this.state.position !== 'SOFA') {
                    const pos = this.locations[this.state.position];
                    const line = currentMap[i];
                    const before = line.substring(0, pos.x);
                    const after = line.substring(pos.x + 1);
                    
                    this.asciiMap.appendChild(this.createTextSpan(before));
                    this.asciiMap.appendChild(this.createPlayerSpan('@'));
                    this.asciiMap.appendChild(this.createTextSpan(after + '\n'));
                } else {
                    this.asciiMap.appendChild(this.createTextSpan(currentMap[i] + '\n'));
                }
            }
        }
    }

    // 添加辅助方法来创建带样式的span元素
    createTextSpan(text) {
        const span = document.createElement('span');
        span.textContent = text;
        return span;
    }

    createPlayerSpan(text) {
        const span = document.createElement('span');
        span.textContent = text;
        span.className = 'player-position';
        return span;
    }

    createBodySpan(text) {
        const span = document.createElement('span');
        span.textContent = text;
        span.className = 'physical-body';
        return span;
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
            'tutorial - Start the interactive tutorial',
            'move.to(location) - Move to a location:',
            '  Bedroom: bed, wardrobe',
            '  Study: desk, bookshelf',
            '  Bathroom: shower, sink',
            '  Kitchen: fridge, stove',
            '  Living: sofa, tv',
            '  Balcony: washer, plants, chair',
            'status() - Show current status',
            'scan() - Scan surroundings',
            '',
            'You can also move directly to specific items. When at an item, you can interact with it.'
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
                    'SOFA': 'watchTV() to relax and watch TV',
                    'TV': 'move.to(SOFA) to watch TV'
                }
            },
            'BALCONY': {
                description: 'You are on the balcony. You can move to:',
                items: {
                    'WASHER': 'washClothes() to clean your clothes',
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

        // 检查是否所有任务都完成
        const uncompletedTasks = this.tasks.filter(task => !task.completed);
        if (uncompletedTasks.length > 0) {
            this.log('ERROR', 'Cannot sleep yet. You still have uncompleted tasks!');
            return;
        }

        // 显示日结算模态框
        this.showDayEndModal();
    }

    shower() {
        if (this.state.position !== 'SHOWER') {
            this.log('ERROR', 'Must be at SHOWER to take a shower');
            return;
        }
        this.log('SYSTEM', 'Taking a shower...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 50);
            this.advanceTime(15); // 淋浴花费15分钟
            this.completeTask('SHOWER', 'shower');
            this.updateStatus();
            this.log('SYSTEM', 'Shower complete. Feeling fresh!');
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
            'DESK': 'A computer desk with multiple monitors. Your physical body sits here, typing commands endlessly into the terminal while your spirit roams freely.',
            'BED': 'A comfortable bed in the spacious bedroom, rarely used as your body remains at the desk.',
            'SHOWER': 'A modern shower in the bright bathroom.',
            'SINK': 'A clean sink with a large mirror.',
            'FRIDGE': 'A well-stocked fridge in the open-plan kitchen.',
            'STOVE': 'A modern cooking station with good ventilation.',
            'BOOKSHELF': 'A tall bookshelf filled with programming books and novels.',
            'SOFA': 'A comfortable sofa in the living room with a view of the TV.',
            'TV': 'A large flat-screen TV mounted on the wall.',
            'PLANTS': 'Some potted plants on the peaceful balcony.',
            'CHAIR': 'A comfortable outdoor chair perfect for relaxation.',
            'WARDROBE': 'A spacious wardrobe with your clothes neatly organized.',
            'WASHER': 'A modern washing machine in the living room.'
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
            "CHAIR": () => this.relax(),
            "WASHER": () => this.washClothes()
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
            this.state.hunger = Math.min(100, this.state.hunger + 60);
            this.advanceTime(30); // 做饭花费30分钟
            this.completeTask('STOVE', 'cook');
            this.updateStatus();
            this.log('SYSTEM', 'Meal prepared and eaten. Delicious!');
        }, 4000);
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

        // 找到第一个未完成的工作任务
        const nextTask = this.tasks.find(task => !task.completed && task.type === 'work');
        if (!nextTask) {
            this.log('SYSTEM', 'No more work tasks to complete!');
            return;
        }

        this.log('SYSTEM', `Working on: ${nextTask.description}...`);
        setTimeout(() => {
            nextTask.completed = true;
            this.state.sanity = Math.max(0, this.state.sanity - 10);
            this.advanceTime(30); // 工作花费30分钟
            this.updateStatus();
            this.updateTasksDisplay();
            this.log('SYSTEM', `Completed task: ${nextTask.description}`);
        }, 5000);
    }

    watchTV() {
        if (this.state.position !== 'SOFA') {  // 只检查是否在沙发位置
            this.log('ERROR', 'Must be at SOFA to watch television');
            return;
        }
        this.log('SYSTEM', 'Watching TV while relaxing on the sofa...');
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
            this.advanceTime(10); // 浇花花费10分钟
            this.completeTask('PLANTS', 'waterPlants');
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
            this.advanceTime(10); // 换衣服花费10分钟
            this.completeTask('WARDROBE', 'changeClothes');
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

    washClothes() {
        if (this.state.position !== 'WASHER') {
            this.log('ERROR', 'Must be at WASHER to wash clothes');
            return;
        }
        this.log('SYSTEM', 'Washing clothes...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 40);
            this.advanceTime(30); // 洗衣花费30分钟
            this.completeTask('WASHER', 'washClothes');
            this.updateStatus();
            this.log('SYSTEM', 'Laundry complete! Your clothes are fresh and clean.');
        }, 4000);
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
                    '- Balcony: Has plants(PLANTS) and chair(CHAIR)',
                    '- Washer: Has a washing machine(WASHER)'
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
                    '- At washer: washClothes() - Clean your clothes',
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
                    '2. Type shower() to start showering',
                    '',
                    'To wash clothes:',
                    '1. Type move.to(washer) to move to the washer',
                    '2. Type washClothes() to start washing'
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

    // 时间系统
    startTimeSystem() {
        setInterval(() => {
            this.gameTime.minute += 10;
            if (this.gameTime.minute >= 60) {
                this.gameTime.minute = 0;
                this.gameTime.hour++;
            }
            this.updateTimeDisplay();
        }, 60000); // 每分钟更新一次
    }

    updateTimeDisplay() {
        const timeDisplay = document.getElementById('game-time');
        timeDisplay.textContent = `Day ${this.gameTime.day} - ${String(this.gameTime.hour).padStart(2, '0')}:${String(this.gameTime.minute).padStart(2, '0')}`;
    }

    // 任务系统
    generateDailyTasks() {
        // 工作任务池
        const workTasks = [
            "Fix website bug",
            "Review pull requests",
            "Write documentation",
            "Attend team meeting",
            "Debug production issue",
            "Implement new feature",
            "Optimize database queries",
            "Update dependencies"
        ];

        // 家务任务池
        const houseworkTasks = [
            { description: "Take a shower", location: "SHOWER", action: "shower" },
            { description: "Do laundry", location: "WASHER", action: "washClothes" },
            { description: "Change clothes", location: "WARDROBE", action: "changeClothes" },
            { description: "Water the plants", location: "PLANTS", action: "waterPlants" },
            { description: "Cook a meal", location: "STOVE", action: "cook" }
        ];

        // 随机选择2-3个工作任务
        const selectedWorkTasks = this.shuffleArray(workTasks)
            .slice(0, 2 + Math.floor(Math.random() * 2))
            .map((desc, id) => ({
                id: id + 1,
                description: desc,
                location: "DESK",
                action: "work",
                type: "work",
                completed: false
            }));

        // 随机选择2-3个家务任务
        const selectedHouseworkTasks = this.shuffleArray(houseworkTasks)
            .slice(0, 2 + Math.floor(Math.random() * 2))
            .map((task, id) => ({
                id: id + selectedWorkTasks.length + 1,
                description: task.description,
                location: task.location,
                action: task.action,
                type: "housework",
                completed: false
            }));

        this.tasks = [...selectedWorkTasks, ...selectedHouseworkTasks];
        this.updateTasksDisplay();
    }

    updateTasksDisplay() {
        const tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';
        
        // 分类显示任务
        const workTasks = this.tasks.filter(t => t.type === 'work');
        const houseworkTasks = this.tasks.filter(t => t.type === 'housework');

        // 添加工作任务标题
        const workTitle = document.createElement('div');
        workTitle.className = 'task-category';
        workTitle.textContent = 'Work Tasks:';
        tasksList.appendChild(workTitle);

        // 显示工作任务
        workTasks.forEach(this.createTaskElement.bind(this));

        // 添加家务任务标题
        const houseworkTitle = document.createElement('div');
        houseworkTitle.className = 'task-category';
        houseworkTitle.textContent = 'Housework Tasks:';
        tasksList.appendChild(houseworkTitle);

        // 显示家务任务
        houseworkTasks.forEach(this.createTaskElement.bind(this));
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'task-complete' : ''}`;
        taskElement.innerHTML = `
            <span>${task.description}</span>
            <span>${task.completed ? '✓' : '⋯'}</span>
        `;
        document.getElementById('tasks-list').appendChild(taskElement);
    }

    // 添加数组随机排序方法
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 修改时间系统，添加快进功能
    advanceTime(minutes) {
        this.gameTime.minute += minutes;
        while (this.gameTime.minute >= 60) {
            this.gameTime.minute -= 60;
            this.gameTime.hour++;
        }
        this.updateTimeDisplay();
    }

    // 添加模态框相关方法
    showDayEndModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">Day ${this.gameTime.day} Complete</div>
                <div class="modal-text"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'block';

        // 添加打字机效果的文本
        const textElement = modal.querySelector('.modal-text');
        const summary = this.generateDaySummary();
        this.typeWriter(textElement, summary, 0, 50);
    }

    typeWriter(element, text, i, speed) {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(() => this.typeWriter(element, text, i, speed), speed);
        } else {
            // 文本显示完成后，等待几秒然后开始新的一天
            setTimeout(() => {
                this.startNewDay();
            }, 3000);
        }
    }

    generateDaySummary() {
        return `Day ${this.gameTime.day} Summary:
        
Tasks Completed: ${this.tasks.filter(t => t.completed).length}/${this.tasks.length}
Time Spent Working: ${this.calculateWorkTime()} hours
Current Status:
- Health: ${this.state.health}%
- Hunger: ${this.state.hunger}%
- Clean: ${this.state.clean}%
- Sanity: ${this.state.sanity}%

Press any key to continue...`;
    }

    startNewDay() {
        this.gameTime.day++;
        this.gameTime.hour = 9;
        this.gameTime.minute = 0;
        this.generateDailyTasks();
        this.updateTimeDisplay();
        
        // 移除模态框
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    calculateWorkTime() {
        // Implementation of calculateWorkTime method
        // This is a placeholder and should be implemented based on your specific requirements
        return 8; // Placeholder return, actual implementation needed
    }

    // 添加一个通用的任务完成方法
    completeTask(location, action) {
        const task = this.tasks.find(t => 
            t.location === location && 
            t.action === action && 
            !t.completed
        );
        if (task) {
            task.completed = true;
            this.updateTasksDisplay();
        }
    }
}

// 游戏启动
window.onload = () => {
    new Game();
}; 