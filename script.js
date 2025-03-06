class Game {
    constructor() {
        this.state = {
            health: 100,
            hunger: 100,
            clean: 100,
            sanity: 100,
            position: "DESK" // 第一天从DESK开始
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
            "| [W]  |     [F*]            |",
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
            "CHAIR": { x: 4, y: 8 },
            "FLOOR": { x: 13, y: 8 }  // 添加地板的位置
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

        // 添加新的状态标记
        this.needCheckBody = false;  // 是否需要检查本体
        this.bodyCompromised = false;  // 身体是否被影响
        this.storyBranch = null;  // 用于记录剧情分支：'hide' 或 'lock'

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
            args = command.slice(8, -1).toUpperCase();
        } else if (command.toLowerCase().startsWith('test.day(')) {
            cmd = 'test.day';
            args = command.slice(9, -1);
        } else if (command.toLowerCase().startsWith('test.')) {
            cmd = 'test.day';
            args = command.slice(5);
        } else {
            cmd = command.replace(/[()]/g, '').toLowerCase();
        }

        // 第10天事件期间只允许hide和lock命令
        if (this.isDay10EventActive && !this.canMove) {
            if (!['hide', 'lock'].includes(cmd)) {
                this.log('ERROR', 'Cannot perform any actions until you make a choice');
                this.log('SYSTEM', 'Type hide() to hide in wardrobe, or lock() to lock the door');
                return;
            }
        }

        // 第13天只允许特定命令
        if (this.finalDay) {
            if (!['grab', 'stab'].includes(cmd)) {
                this.log('ERROR', 'Cannot perform this action');
                return;
            }
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
            case 'checkbody':
                this.checkBody();
                break;
            case 'cleanfloor':
                this.cleanfloor();
                break;
            case 'test.day':
                const day = parseInt(args);
                if (!isNaN(day)) {
                    this.testJumpToDay(day);
                } else {
                    this.log('ERROR', 'Invalid day number');
                }
                break;
            case 'hide':
                this.hideInWardrobe();
                break;
            case 'lock':
                this.lockBedroom();
                break;
            case 'grab':
                this.grabKnife();
                break;
            case 'stab':
                this.stabAction();
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
        if (type === 'TUTORIAL') div.classList.add('tutorial');
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
        
        // 第8-9天时修改浴室的显示
        if (this.gameTime.day >= 8 && this.gameTime.day <= 9) {
            const line = currentMap[2];
            const bathroomStart = line.lastIndexOf('[=]');
            const beforeBathroom = line.substring(0, bathroomStart);
            const afterBathroom = line.substring(bathroomStart + 3);
            currentMap[2] = beforeBathroom + '[' + '<span style="color: #ff0000; animation: blink 1s infinite">@</span>' + ']' + afterBathroom;
        }

        // 如果是第10天的事件，在相应位置添加红色闪烁的@
        if (this.isDay10EventActive && this.unknownEntity) {
            const entityPos = this.locations[this.unknownEntity];
            if (entityPos) {
                const line = currentMap[entityPos.y];
                const before = line.substring(0, entityPos.x);
                const after = line.substring(entityPos.x + 1);
                currentMap[entityPos.y] = before + '<span style="color: #ff0000; animation: blink 1s infinite">@</span>' + after;
            }
        }
        
        // 清空原有内容
        this.asciiMap.innerHTML = '';
        
        // 分行添加内容
        for (let i = 0; i < currentMap.length; i++) {
            if (i === 2) { // DESK所在的行
                const line = currentMap[i];
                const deskStart = line.indexOf('[=') + 2;
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
                
                // 只在非第12天且非物理本体消失时显示&
                if (!this.physicalBodyMissing) {
                    this.asciiMap.appendChild(this.createBodySpan('&'));
                } else {
                    this.asciiMap.appendChild(this.createTextSpan('='));  // 用=替代&
                }
                
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
        // 使用innerHTML来渲染HTML标签
        span.innerHTML = text;
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
        const updateStatusBar = (id, value) => {
            const bar = document.getElementById(id);
            bar.style.width = `${value}%`;
            
            // 移除所有现有的类
            bar.classList.remove('progress-normal', 'progress-warning', 'progress-critical');
            
            // 根据值添加对应的类
            if (value <= 20) {
                bar.classList.add('progress-critical');
            } else if (value <= 40) {
                bar.classList.add('progress-warning');
            } else {
                bar.classList.add('progress-normal');
            }
        };

        // 更新每个状态条
        updateStatusBar('health-bar', this.state.health);
        updateStatusBar('hunger-bar', this.state.hunger);
        updateStatusBar('clean-bar', this.state.clean);
        updateStatusBar('sanity-bar', this.state.sanity);
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
            '  Living: sofa, tv, floor',
            '  Balcony: washer, plants, chair',
            'status() - Show current status',
            'scan() - Scan surroundings',
            '',
            'You can also move directly to specific items. When at an item, you can interact with it.',
            '',
            'Game Objective:',
            '- Complete all daily tasks',
            '- Maintain your status bars',
            '- Go to bed and sleep when tasks are done'
        ];
        commands.forEach(cmd => this.appendToTerminal(cmd));
    }

    movePlayer(location) {
        if (this.physicalBodyMissing && location === 'DESK') {
            this.log('ERROR', 'Physical body not found');
            this.log('SYSTEM', 'Try using scan() at DESK');
            return;
        }
        
        this.log('SYSTEM', `Attempting to move to: ${location}`);
        
        if (!location) {
            this.log('ERROR', 'Please specify a location');
            return;
        }

        // 修改房间定义中的命令提示
        const rooms = {
            'BEDROOM': {
                description: 'You are in the bedroom. You can move to:',
                items: {
                    'BED': 'sleep() to restore mental health',
                    'WARDROBE': 'changeclothes() to improve cleanliness'
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
                    'SOFA': 'watchtv() to relax and watch TV',
                    'TV': 'move.to(SOFA) to watch TV',
                    'FLOOR': 'cleanfloor() to sweep and mop'  // 添加新的交互选项
                }
            },
            'BALCONY': {
                description: 'You are on the balcony. You can move to:',
                items: {
                    'WASHER': 'washclothes() to clean your clothes',
                    'PLANTS': 'waterplants() to improve mood',
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

        // 第12天可以直接睡觉
        if (this.gameTime.day === 12 && this.storyBranch === 'lock') {
            this.log('SYSTEM', 'Going to sleep...');
            setTimeout(() => {
                this.showDayEndModal();
            }, 3000);
            return;
        }

        // 检查是否完成所有任务
        const allTasksCompleted = this.tasks.every(task => task.completed);
        if (!allTasksCompleted && !this.physicalBodyMissing) {
            this.log('ERROR', 'Must complete all tasks before sleeping');
            return;
        }

        // 检查是否有未完成的任务
        const uncompletedTasks = this.tasks.filter(task => !task.completed);
        if (uncompletedTasks.length > 0) {
            this.log('ERROR', 'Cannot sleep yet. You still have uncompleted tasks!');
            return;
        }

        // 第五天开始，检查是否确认过本体
        if (this.gameTime.day >= 5 && this.needCheckBody) {
            this.log('ERROR', 'Cannot sleep. You need to check your physical body at the desk first.');
            return;
        }

        this.showDayEndModal();
    }

    shower() {
        if (!this.checkStateForAction('shower')) return;
        if (this.state.position !== 'SHOWER') {
            this.log('ERROR', 'Must be at SHOWER to take a shower');
            return;
        }
        this.log('SYSTEM', 'Taking a shower...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 50);
            this.state.hunger = Math.max(0, this.state.hunger - 5); // 洗澡消耗5点饥饿值
            this.advanceTime(15);
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
        if (this.physicalBodyMissing) {
            if (this.state.position === 'DESK' && this.clueFound === 0) {
                this.log('WARNING', '(1/2) Find me, I am where I was');  // 使用WARNING类型会显示为黄色
                this.clueFound = 1;
                return;
            } else if (this.state.position === 'SHOWER' && this.clueFound === 1) {
                this.log('WARNING', '(2/2) Who are you?');  // 使用WARNING类型会显示为黄色
                setTimeout(() => {
                    this.log('SYSTEM', 'You feel tired. You need to sleep.');
                    this.needCheckBody = false;  // 允许直接睡觉
                }, 2000);
                return;
            }
        }
        if (this.bodyCompromised && this.state.position === 'DESK') {
            this.log('WARNING', 'Something feels wrong with your body. It doesn\'t feel like yourself anymore.');
            return;
        }
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
            'WASHER': 'A modern washing machine in the living room.',
            'FLOOR': 'A clean floor in the living room.'
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
        if (!this.checkStateForAction('work')) return;
        if (this.state.position !== 'DESK') {
            this.log('ERROR', 'Must be at DESK to work');
            return;
        }

        const nextTask = this.tasks.find(task => !task.completed && task.type === 'work');
        if (!nextTask) {
            this.log('SYSTEM', 'No more work tasks to complete!');
            return;
        }

        this.log('SYSTEM', `Working on: ${nextTask.description}...`);
        setTimeout(() => {
            nextTask.completed = true;
            this.state.sanity = Math.max(0, this.state.sanity - 10);
            this.state.hunger = Math.max(0, this.state.hunger - 25); // 工作3小时，消耗25点饥饿值
            this.advanceTime(180); // 工作花费3小时
            this.updateStatus();
            this.updateTasksDisplay();
            this.log('SYSTEM', `Completed task: ${nextTask.description}`);
            this.checkAllTasksCompleted();
        }, 5000);
    }

    // 修改checkAllTasksCompleted方法
    checkAllTasksCompleted() {
        const uncompletedTasks = this.tasks.filter(task => !task.completed);
        if (uncompletedTasks.length === 0) {
            // 检查是否是第四天并触发恐怖事件
            if (this.gameTime.day === 4) {
                this.triggerHorrorEvent();
            } else if (this.gameTime.day >= 5) {
                // 第五天开始，完成任务后提示需要检查本体
                this.needCheckBody = true;  // 设置标记
                this.log('WARNING', 'I feel like someone is watching me...');
                this.log('SYSTEM', 'I should use checkbody() to check my physical body at the desk before going to sleep.');
            } else {
                this.log('SYSTEM', '=== All tasks completed! ===');
                this.log('SYSTEM', 'You can now move.to(bed) and sleep() to end the day.');
            }
        }
    }

    // 添加恐怖事件方法
    triggerHorrorEvent() {
        // 禁用输入
        this.commandInput.disabled = true;
        
        // 显示系统失控的信息
        this.log('ERROR', '=== SYSTEM MALFUNCTION DETECTED ===');
        this.log('ERROR', 'Warning: Unauthorized control sequence detected');
        this.log('ERROR', 'Soul control interface compromised');
        
        // 在终端显示红色的强制移动命令
        const commandDiv = document.createElement('div');
        commandDiv.textContent = '> move.to(kitchen)';
        commandDiv.style.color = '#ff0000';
        this.terminal.appendChild(commandDiv);
        
        // 强制移动到厨房
        setTimeout(() => {
            this.state.position = 'KITCHEN';
            this.updateMap();
            this.log('ERROR', 'ANOMALY: Soul forcibly relocated to kitchen');
            this.log('ERROR', 'Unknown entity detected in system');
            
            // 5秒后恢复控制
            setTimeout(() => {
                this.log('SYSTEM', '=== System restored ===');
                this.log('SYSTEM', 'Soul control interface back online');
                this.log('SYSTEM', 'All tasks completed. You can now move.to(bed) and sleep() to end the day.');
                this.commandInput.disabled = false;
            }, 5000);
        }, 2000);
    }

    watchTV() {
        if (!this.checkStateForAction('watchtv')) return;
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
        if (!this.checkStateForAction('waterplants')) return;
        if (this.state.position !== 'PLANTS') {
            this.log('ERROR', 'Must be at PLANTS to water them');
            return;
        }
        this.log('SYSTEM', 'Watering plants...');
        setTimeout(() => {
            this.state.sanity = Math.min(100, this.state.sanity + 5);
            this.state.hunger = Math.max(0, this.state.hunger - 5); // 浇花消耗5点饥饿值
            this.advanceTime(10);
            this.completeTask('PLANTS', 'waterPlants');
            this.updateStatus();
            this.log('SYSTEM', 'Plants watered. The greenery is soothing.');
        }, 2000);
    }

    changeClothes() {
        if (!this.checkStateForAction('changeclothes')) return;
        if (this.state.position !== 'WARDROBE') {
            this.log('ERROR', 'Must be at WARDROBE to change clothes');
            return;
        }
        this.log('SYSTEM', 'Changing clothes...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 20);
            this.state.hunger = Math.max(0, this.state.hunger - 3); // 换衣服消耗3点饥饿值
            this.advanceTime(10);
            this.completeTask('WARDROBE', 'changeClothes');
            this.updateStatus();
            this.log('SYSTEM', 'Changed into fresh clothes. Feeling neat!');
        }, 2000);
    }

    relax() {
        if (!this.checkStateForAction('relax')) return;
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
        if (!this.checkStateForAction('washclothes')) return;
        if (this.state.position !== 'WASHER') {
            this.log('ERROR', 'Must be at WASHER to wash clothes');
            return;
        }
        this.log('SYSTEM', 'Washing clothes...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 40);
            this.state.hunger = Math.max(0, this.state.hunger - 8); // 洗衣服消耗8点饥饿值
            this.advanceTime(30);
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
                    'Welcome to the Soul Control System. You can accomplish various tasks by controlling your soul.',
                    '& represents your physical body at the desk, while @ represents your soul that you can control.',
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
                    '- Living Room: Has a sofa(SOFA), TV(TV) and floor(FLOOR)',
                    '- Balcony: Has plants(PLANTS) and chair(CHAIR)',
                    '- Washer: Has a washing machine(WASHER)'
                ]
            },
            {
                title: 'Daily Activities',
                content: [
                    'Different locations allow different activities:',
                    '- At bed: sleep() - Restore mental health',
                    '- At shower: shower() - Improve cleanliness (+50 clean)',
                    '- At fridge: eat() - Restore hunger (+30 hunger)',
                    '- At stove: cook() - Cook a better meal (+60 hunger)',
                    '- At desk: work() - Code and complete work tasks',
                    '- At bookshelf: read() - Gain knowledge (+20 sanity)',
                    '- At sofa: watchtv() - Relax and restore sanity (+15 sanity)',
                    '- At washer: washclothes() - Clean your clothes (+40 clean)',
                    '- At wardrobe: changeclothes() - Change into clean clothes (+20 clean)',
                    '- At plants: waterplants() - Take care of plants (+5 sanity)',
                    '- At chair: relax() - Enjoy fresh air (+25 sanity)',
                    '- At floor: cleanfloor() - Clean the living room floor (+30 clean)'
                ]
            },
            {
                title: 'Status Management',
                content: [
                    'You need to monitor these status bars:',
                    '- Hunger: Decreases over time (-1 per minute)',
                    '  * Eat at fridge (+30) or cook at stove (+60)',
                    '  * Working decreases hunger (-25)',
                    '  * Other activities also decrease hunger slightly',
                    '',
                    '- Clean: Decreases slowly (-0.5 per minute)',
                    '  * Shower (+50)',
                    '  * Change clothes (+20)',
                    '  * Wash clothes (+40)',
                    '  * Clean floor (+30)',
                    '',
                    '- Sanity: Decreases over time (-0.3 per minute)',
                    '  * Watch TV (+15)',
                    '  * Read books (+20)',
                    '  * Water plants (+5)',
                    '  * Relax in balcony (+25)',
                    '  * Working decreases sanity (-10)',
                    '',
                    'You\'ll receive warnings when any status drops below 20%',
                    'Try to maintain a balance between work and self-care'
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
                // 教程结束时的提示
                this.log('SYSTEM', 'Tutorial completed! Try typing "help" to see all commands, or "scan()" to check your surroundings.');
                this.log('SYSTEM', 'Enjoy your life!');
                
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
        // 正常的工作任务池
        const normalWorkTasks = [
            "Fix website bug",
            "Review pull requests",
            "Write documentation",
            "Attend team meeting",
            "Debug production issue",
            "Implement new feature",
            "Optimize database queries",
            "Update dependencies"
        ];

        // 异常的工作任务池（从第7天开始使用）
        const abnormalWorkTasks = [
            "01010‡‡‡ERROR‡‡‡01010",
            "§¶¥®©¤₪CORRUPT_DATA₪¤©®¥¶§",
            "∞∞∞SYSTEM_BREACH∞∞∞",
            "████REDACTED████",
            "E̷R̷R̷O̷R̷_̷4̷0̷4̷",
            "D̸E̸L̸E̸T̸E̸_̸A̸L̸L̸_̸T̸R̸A̸C̸E̸S̸",
            "C̷̨̭̘̲͎̅͌͑͝O̶͉̦͋̈́̈́͝R̸̡͚̲̆̈́̈́R̵͙̫̆̓U̷̢͇̇̈́P̷̱͉̏̓̈́T̴͎̫̏_̷͇̇D̷͚̆A̷̛͚T̷̫͌A̷͚̐",
            "U̷̧͉̼͇͎͍͔̝͊̃͜N̴̢̧̛̺̱̱̗̩̱̫̈́̈́̈́̈̊̈́̕K̷̡̢̛͚̣͚̱̭̲̈́̈́̈́̈́̈́͜N̴̢̛̺̱̱̗̩̱̫̈́̈́̈̊̈́̕O̷̧͉̼͇͎͍͔̝͊̃͜W̷̧͉̼͇͎͍͔̝͊̃͜N̴̢̧̛̺̱̱̗̩̱̫̈́̈́̈̈̊̈́̕"
        ];

        // 选择使用哪个任务池
        const workTasks = this.gameTime.day >= 7 ? abnormalWorkTasks : normalWorkTasks;

        // 家务任务池
        let houseworkTasks = [
            { description: "Do laundry", location: "WASHER", action: "washClothes" },
            { description: "Change clothes", location: "WARDROBE", action: "changeClothes" },
            { description: "Water the plants", location: "PLANTS", action: "waterPlants" }
        ];

        // 只在非第8-9天添加淋浴任务
        if (this.gameTime.day < 8 || this.gameTime.day > 9) {
            houseworkTasks.push({ description: "Take a shower", location: "SHOWER", action: "shower" });
        }

        // 从第二天开始添加打扫任务
        if (this.gameTime.day >= 2) {
            houseworkTasks.push({ 
                description: "Clean the floor", 
                location: "FLOOR", 
                action: "cleanfloor" 
            });
        }

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

        // 固定选择3个家务任务
        const selectedHouseworkTasks = this.shuffleArray(houseworkTasks)
            .slice(0, 3)  // 改为固定选择3个
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
            element.innerHTML = text.substring(0, i + 1);
            i++;
            setTimeout(() => this.typeWriter(element, text, i, speed), speed);
        } else {
            setTimeout(() => {
                this.startNewDay();
            }, 3000);
        }
    }

    generateDaySummary() {
        const completedWork = this.tasks.filter(t => t.completed && t.type === 'work').length;
        const totalWork = this.tasks.filter(t => t.type === 'work').length;
        const completedHousework = this.tasks.filter(t => t.completed && t.type === 'housework').length;
        const totalHousework = this.tasks.filter(t => t.type === 'housework').length;

        let summary = `Day ${this.gameTime.day} Summary:
        
Tasks Completed:
- Work Tasks: ${completedWork}/${totalWork}
- Housework Tasks: ${completedHousework}/${totalHousework}
Total Time Spent: ${this.calculateWorkTime()} hours

Current Status:
- Health: ${this.state.health}%
- Hunger: ${this.state.hunger}%
- Clean: ${this.state.clean}%
- Sanity: ${this.state.sanity}%\n`;

        // 添加恐怖事件日志
        if (this.gameTime.day === 8 || this.gameTime.day === 9) {
            summary += `\n<span style="color: #ff0000">WARNING: Anomaly Detected in Bathroom
- Unknown entity detected
- Bathroom access restricted
- Entity showing signs of hostility
- Exercise extreme caution</span>\n`;
        } else if (this.gameTime.day === 6) {
            summary += `\n<span style="color: #ffff00">Anomalies Detected:
- Soul initialization error occurred
- Unexpected starting position: KITCHEN
- System reported location mismatch
- Investigation of the anomaly is ongoing</span>\n`;
        } else if (this.gameTime.day === 12 && this.storyBranch === 'lock') {
            summary += `\n<span style="color: #ff0000">WARNING: Critical System Error
- Physical body missing from desk
- Unknown messages detected
- System stability severely compromised
- Emergency protocols initiated
- Further investigation required</span>\n`;
        } else if (this.gameTime.day >= 7 && this.gameTime.day !== 10 && this.gameTime.day !== 12) {  // 添加条件，排除第10天和第12天
            summary += `\n<span style="color: #ffff00">Anomalies Detected:
- System corruption detected
- Work task data corrupted
- Unexpected soul location at day start: KITCHEN
- Entity interference level increasing
- Further investigation required</span>\n`;
        }

        if (this.gameTime.day === 10) {
            if (this.storyBranch === 'hide') {
                summary += `\n<span style="color: #ff0000">WARNING: Critical Event Log
- Unknown entity detected in living room
- Entity attempted to reach the spirit in bedroom
- Emergency protocols were activated
- Situation contained, but exercise extreme caution</span>\n`;
            } else if (this.storyBranch === 'lock') {
                summary += `\n<span style="color: #ff0000">WARNING: Critical Event Log
- Unknown entity detected in living room
- Entity attempted to reach physical body
- Emergency protocols were activated
- Situation contained, but exercise extreme caution</span>\n`;
            }
        }

        summary += '\nPress any key to continue...';
        return summary;
    }

    startNewDay() {
        this.gameTime.day++;
        this.gameTime.hour = 9;
        this.gameTime.minute = 0;
        
        if (this.storyBranch === 'lock') {  // 分支二的特殊处理
            if (this.gameTime.day === 12) {
                this.state.position = 'DESK';
                this.physicalBodyMissing = true;  // 添加标记表示本体消失
                this.clueFound = 0;  // 用于追踪找到的线索数量
            } else if (this.gameTime.day === 13) {
                this.state.position = 'KITCHEN';
                this.physicalBodyMissing = false;  // 本体回来了
                this.finalDay = true;  // 最终日标记
                setTimeout(() => {
                    this.log('WARNING', 'Grab the knife');
                    this.log('WARNING', 'Type grab() to take the knife');
                }, 1000);
            } else if (this.gameTime.day === 11) {
                this.state.position = 'KITCHEN';  // 第11天在厨房醒来
            }
        } else if (this.gameTime.day === 10) {
            this.state.position = 'BED';  // 第十天在床上醒来
            this.triggerDay10Event();
        } else if (this.gameTime.day >= 6) {
            this.state.position = 'KITCHEN';  // 第6-9天在厨房醒来
            this.log('WARNING', 'ERROR: Wrong location');
            this.log('WARNING', 'Soul initialization failed - unexpected starting position');
        } else {
            this.state.position = 'BED';   // 2-5天在床上醒来
        }
        
        this.generateDailyTasks();
        this.updateTimeDisplay();
        this.updateMap();
        
        // 移除模态框
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }

        // 添加新一天的提示信息
        this.log('SYSTEM', `=== Day ${this.gameTime.day} Started ===`);
        this.log('SYSTEM', 'New tasks have been assigned. Complete them before going to sleep.');
    }

    calculateWorkTime() {
        // 定义每种任务的耗时（分钟）
        const taskDurations = {
            'work': 180,      // 工作任务 3小时
            'shower': 15,     // 淋浴 15分钟
            'washClothes': 30, // 洗衣服 30分钟
            'changeClothes': 10, // 换衣服 10分钟
            'waterPlants': 10,  // 浇花 10分钟
        };

        // 计算所有已完成任务的总时间
        const totalMinutes = this.tasks
            .filter(task => task.completed)
            .reduce((total, task) => {
                return total + (taskDurations[task.action] || 0);
            }, 0);

        // 将分钟转换为小时，保留一位小数
        return (totalMinutes / 60).toFixed(1);
    }

    // 修改completeTask方法
    completeTask(location, action) {
        const task = this.tasks.find(t => 
            t.location === location && 
            t.action === action && 
            !t.completed
        );
        if (task) {
            task.completed = true;
            this.updateTasksDisplay();
            
            // 延迟显示任务完成提示
            setTimeout(() => {
                this.checkAllTasksCompleted();
            }, 1000); // 等待1秒后显示完成提示
        }
    }

    // 添加检查本体的方法
    checkBody() {
        if (this.state.position !== 'DESK') {
            this.log('ERROR', 'Must be at DESK to check your physical body');
            return;
        }

        if (this.bodyCompromised) {
            this.log('WARNING', 'Something feels wrong with your body. It doesn\'t feel like yourself anymore.');
            setTimeout(() => {
                this.log('SYSTEM', 'But you need to continue with your routine...');
                // 检查是否所有任务都完成了
                const allTasksCompleted = this.tasks.every(task => task.completed);
                if (allTasksCompleted) {
                    this.log('SYSTEM', 'You can now move.to(bed) and sleep() to end the day.');
                }
                this.needCheckBody = false;  // 重置标记，允许睡觉
            }, 2000);
            return;
        }

        if (!this.needCheckBody) {
            this.log('SYSTEM', 'No need to check your physical body right now.');
            return;
        }

        this.log('SYSTEM', 'Checking physical body...');
        setTimeout(() => {
            this.log('SYSTEM', 'Physical body status confirmed. Everything seems normal... for now.');
            this.needCheckBody = false;  // 重置标记
            this.log('SYSTEM', 'You can now move.to(bed) and sleep() to end the day.');
        }, 3000);
    }

    cleanfloor() {
        if (!this.checkStateForAction('cleanfloor')) return;
        if (this.state.position !== 'FLOOR') {
            this.log('ERROR', 'Must be at FLOOR to clean');
            return;
        }
        this.log('SYSTEM', 'Cleaning the floor...');
        setTimeout(() => {
            this.state.clean = Math.min(100, this.state.clean + 30);
            this.state.hunger = Math.max(0, this.state.hunger - 10); // 打扫消耗10点饥饿值
            this.advanceTime(20); // 打扫花费20分钟
            this.completeTask('FLOOR', 'cleanfloor');
            this.updateStatus();
            this.log('SYSTEM', 'Floor cleaned. The room looks much better now!');
        }, 3000);
    }

    // 添加状态检查方法
    checkStateForAction(action) {
        // 检查饥饿值（低于15时需要进食）
        if (this.state.hunger <= 15 && !['eat', 'cook'].includes(action)) {
            this.log('ERROR', 'Too hungry to focus! You need to eat something first.');
            return false;
        }

        // 检查精神状态（低于20时不能工作）
        if (this.state.sanity <= 20 && action === 'work') {
            this.log('ERROR', 'Mental state too unstable! You need to rest before working.');
            return false;
        }

        return true;
    }

    // 添加测试跳转方法
    testJumpToDay(day) {
        this.gameTime.day = day - 1; // 减1是因为startNewDay会加1
        this.startNewDay();
        this.log('SYSTEM', `=== Jumped to Day ${day} (Test Mode) ===`);
    }

    // 添加第十天事件的方法
    triggerDay10Event() {
        this.isDay10EventActive = true;  // 添加事件标记
        this.canMove = false;  // 暂时禁止移动
        
        setTimeout(() => {
            this.log('WARNING', 'You sense a presence in the living room');
            // 在客厅添加红色闪烁的@
            this.unknownEntity = 'LIVING';
            this.updateMap();
            
            setTimeout(() => {
                this.log('SYSTEM', 'Do you want to hide in the wardrobe or lock the bedroom door?');
                this.log('SYSTEM', 'Type hide() to hide in wardrobe, or lock() to lock the door');
            }, 1000);
        }, 1000);
    }

    // 添加躲藏和锁门的方法
    hideInWardrobe() {
        if (!this.isDay10EventActive) {
            this.log('ERROR', 'Cannot hide right now');
            return;
        }
        
        this.storyBranch = 'hide';  // 设置为分支一
        // 隐藏玩家
        this.state.position = null;
        this.updateMap();
        
        // 未知实体进入bedroom
        setTimeout(() => {
            this.unknownEntity = 'BEDROOM';
            this.updateMap();
            
            // 未知实体消失
            setTimeout(() => {
                this.unknownEntity = null;
                this.updateMap();
                
                // 玩家从衣柜出来
                setTimeout(() => {
                    this.state.position = 'BEDROOM';
                    this.isDay10EventActive = false;
                    this.canMove = true;
                    this.updateMap();
                    this.log('SYSTEM', 'You came out of the wardrobe. Everything seems back to normal');
                }, 2000);
            }, 3000);
        }, 2000);
    }

    lockBedroom() {
        if (!this.isDay10EventActive) {
            this.log('ERROR', 'Cannot lock door right now');
            return;
        }
        
        this.storyBranch = 'lock';  // 设置为分支二
        setTimeout(() => {
            this.log('WARNING', 'Someone is trying to open the bedroom door');
            
            // 两秒后未知实体移动到study
            setTimeout(() => {
                this.unknownEntity = 'STUDY';
                this.updateMap();
                this.log('WARNING', 'The entity appears to have moved into the study room');
                
                // 未知实体消失
                setTimeout(() => {
                    this.unknownEntity = null;
                    this.isDay10EventActive = false;
                    this.canMove = true;
                    this.bodyCompromised = true;  // 添加新标记
                    this.updateMap();
                    this.log('SYSTEM', 'Everything is back to normal');
                }, 3000);
            }, 2000);
        }, 2000);
    }

    // 添加新的方法处理第13天的特殊事件
    grabKnife() {
        if (!this.finalDay) {
            this.log('ERROR', 'Cannot perform this action');
            return;
        }
        
        this.hasKnife = true;
        this.log('WARNING', 'Knife acquired');
        
        // 自动移动到desk
        setTimeout(() => {
            const moveCommand = 'move.to(DESK)';
            const commandDiv = document.createElement('div');
            commandDiv.textContent = `> ${moveCommand}`;
            commandDiv.style.color = '#ff0000';
            this.terminal.appendChild(commandDiv);
            
            this.state.position = 'DESK';
            this.updateMap();
            
            setTimeout(() => {
                this.log('WARNING', 'Use the knife to stab');
                this.log('WARNING', 'Type stab() to end this');
            }, 1000);
        }, 2000);
    }

    stabAction() {
        if (!this.finalDay || !this.hasKnife) {
            this.log('ERROR', 'Cannot perform this action');
            return;
        }
        
        setTimeout(() => {
            // 游戏结束，黑屏
            document.body.style.backgroundColor = '#000';
            document.body.innerHTML = '';
        }, 2000);
    }
}

// 游戏启动
window.onload = () => {
    new Game();
}; 