document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const quitBtn = document.getElementById('quitBtn');
    const startScreen = document.querySelector('.start-screen');
    const introModal = document.querySelector('.intro-modal');
    const introText = document.getElementById('intro-text');

    const introLines = [
        "As a genius engineer, I have lived independently from any company for decades.",
        "This is a program I created that can separate one's soul from their physical body. Through command inputs, the soul can perform corresponding actions. Most impressively, all these actions are accurately reflected in reality.",
        "After developing this program, I gradually became dependent on it. Everything in daily life, including work, housework, and even rest and relaxation, I could accomplish through the computer. In reality, I only needed to sit motionless in front of the computer, and work and housework would be completed automatically.",
        "The only drawback of this program is that when running it, my soul separates from my body, and I become unable to control my physical form. And this... this almost put me in danger.",
        "That experience, I still cannot forget..."
    ];

    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        introModal.classList.remove('hidden');
        playIntro();
    });

    quitBtn.addEventListener('click', () => {
        window.close();
    });

    async function playIntro() {
        for (let line of introLines) {
            await typeText(line);
            await wait(1500);  // 等待1.5秒后显示下一行
        }

        // 片头结束后等待3秒
        await wait(3000);
        
        // 跳转到主游戏页面
        window.location.href = 'index.html';
    }

    function typeText(text) {
        return new Promise(resolve => {
            let i = 0;
            introText.innerHTML += '\n\n';  // 在新行开始
            const interval = setInterval(() => {
                if (i < text.length) {
                    introText.innerHTML = introText.innerHTML.slice(0, -1) + text.charAt(i) + '|';
                    i++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);  // 打字速度
        });
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}); 