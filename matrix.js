class MatrixBackground {
    constructor() {
        this.canvas = document.getElementById('matrix-bg');
        this.ctx = this.canvas.getContext('2d');
        this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
        this.fontSize = 14;
        this.drops = [];
        
        console.log('Matrix background initializing...');
        
        this.resizeCanvas();
        this.initialize();

        window.addEventListener('resize', () => {
            console.log('Window resized');
            this.resizeCanvas();
        });
    }

    resizeCanvas() {
        try {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            const columns = Math.floor(this.canvas.width / this.fontSize);
            if (columns <= 0) {
                console.error('Invalid columns count:', columns);
                return;
            }
            
            this.drops = new Array(columns).fill(1);
            
            console.log(`Canvas resized: ${this.canvas.width}x${this.canvas.height}, Columns: ${columns}`);
        } catch (error) {
            console.error('Error in resizeCanvas:', error);
        }
    }

    initialize() {
        try {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            console.log('Animation starting...');
            this.animate();
        } catch (error) {
            console.error('Error in initialize:', error);
        }
    }

    animate() {
        try {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.font = `${this.fontSize}px monospace`;

            for(let i = 0; i < this.drops.length; i++) {
                if (Math.random() > 0.975) {
                    continue;
                }

                const text = this.characters[Math.floor(Math.random() * this.characters.length)];
                
                const brightness = Math.random() * 0.3 + 0.2;
                this.ctx.fillStyle = `rgba(0, 255, 0, ${brightness})`;
                
                if (Math.random() > 0.98) {
                    this.ctx.fillStyle = `rgba(150, 255, 150, 0.9)`;
                }

                this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

                if(this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.985) {
                    this.drops[i] = 0;
                }
                this.drops[i] += 0.5;
            }
            requestAnimationFrame(() => this.animate());
        } catch (error) {
            console.error('Error in animate:', error);
        }
    }
}

window.addEventListener('load', () => {
    try {
        console.log('Window loaded, creating matrix background...');
        const matrix = new MatrixBackground();
    } catch (error) {
        console.error('Error creating MatrixBackground:', error);
    }
}); 