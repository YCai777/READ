class SadnessAnimation {
    constructor() {
        this.triggeredElements = new Map();
        this.hoverTimers = new Map();
        this.goneElements = new WeakSet();
        this.ellipseRadius = { x: 150, y: 95 };
    }
    
    trigger(element, index, mouseX, mouseY) {
        // 清除之前的计时器
        if (this.hoverTimers.has(element)) {
            clearTimeout(this.hoverTimers.get(element));
        }
        
        // 缩短延迟以提高触发速度
        const timer = setTimeout(() => {
            this.applyDripEffect(element, mouseX, mouseY);
        }, 35);
        
        this.hoverTimers.set(element, timer);
    }
    
    applyDripEffect(element, mouseX, mouseY) {
        const textDisplay = document.getElementById('text-display');
        if (!textDisplay) {
            return;
        }
        const allChars = textDisplay.querySelectorAll('.text-char');
        
        let affectedCount = 0;
        allChars.forEach(char => {
            const rect = char.getBoundingClientRect();
            const charCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            
            // 椭圆范围检测
            const dx = (charCenter.x - mouseX) / this.ellipseRadius.x;
            const dy = (charCenter.y - mouseY) / this.ellipseRadius.y;
            
            if (dx * dx + dy * dy <= 1) {
                // 提高触发概率，让区域内字符更快消失
                if (Math.random() < 0.38) {
                    this.dissolveChar(char);
                    affectedCount++;
                }
            }
        });

        if (affectedCount === 0 && element) {
            this.dissolveChar(element);
        }
    }
    
    dissolveChar(char) {
        if (this.goneElements.has(char)) {
            return;
        }

        if (/\d/.test(char.textContent || '')) {
            return;
        }

        const currentLevel = this.triggeredElements.get(char) || 0;
        const nextLevel = currentLevel + 1;
        this.triggeredElements.set(char, nextLevel);
        const color = getComputedStyle(char).color;
        
        // 允许透明度递减到0，文字会最终完全消失
        const baseOpacity = 0.8 + Math.random() * 0.1;
        const opacity = Math.max(0, baseOpacity - nextLevel * 0.24);
        
        // 增加下移距离2倍 - 从12-36增加到24-72
        const baseDropDistance = 24 + Math.random() * 48; // 2倍距离
        const totalDropDistance = baseDropDistance * nextLevel;
        
        // 左右偏移概率1%
        const horizontalOffset = Math.random() < 0.01 ? (Math.random() - 0.5) * 15 : 0;
        
        // 应用样式，仅做透明度与位移变化
        char.style.opacity = opacity;
        char.style.filter = `blur(${0.5 + currentLevel * 0.3}px)`;
        // 由于距离增加，稍微延长动画时间以保持自然的重力感
        char.style.transition = 'all 0.9s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
        char.style.position = 'relative';

        if (opacity <= 0.02) {
            char.style.opacity = '0';
            char.style.visibility = 'hidden';
            char.style.pointerEvents = 'none';
            this.goneElements.add(char);
            return;
        }
        
        // 更快触发位移
        setTimeout(() => {
            char.style.transform = `translateY(${totalDropDistance}px) translateX(${horizontalOffset}px)`;
        }, 50);
        
        // 保留纯文字下坠，不添加额外粒子效果
    }
    
    createEnhancedTrail(char, dropDistance, horizontalOffset, color, level) {
        // 增加拖尾层数以获得更明显的效果
        const trailLayers = 3;
        
        for (let layer = 0; layer < trailLayers; layer++) {
            const trail = document.createElement('div');
            const rect = char.getBoundingClientRect();
            
            // 增加拖尾宽度使其更明显
            const trailWidth = 4;
            // 大幅提高透明度，减少透明感
            const trailOpacity = Math.max(0.6, (0.9 - layer * 0.15) - level * 0.03);
            
            trail.style.position = 'fixed';
            trail.style.left = (rect.left + rect.width / 2 - trailWidth / 2) + 'px';
            trail.style.top = rect.top + 'px';
            trail.style.width = trailWidth + 'px';
            trail.style.height = '0px';
            
            // 增强拖尾可见性
            if (layer === 0) {
                // 内层 - 实色，高透明度
                trail.style.background = color;
                trail.style.opacity = trailOpacity;
            } else if (layer === 1) {
                // 中层 - 渐变，但保持高可见性
                trail.style.background = `linear-gradient(to bottom, ${color}DD, ${color}88, transparent)`;
                trail.style.opacity = trailOpacity * 0.8;
            } else {
                // 外层 - 柔和渐变
                trail.style.background = `linear-gradient(to bottom, ${color}AA, ${color}55, transparent)`;
                trail.style.opacity = trailOpacity * 0.7;
            }
            
            trail.style.pointerEvents = 'none';
            trail.style.zIndex = (10 - layer).toString();
            // 由于距离增加，稍微延长拖尾动画时间
            trail.style.transition = `height ${1.3 + layer * 0.1}s cubic-bezier(0.55, 0.085, 0.68, 0.53)`; // 从1.0s增加到1.3s
            trail.style.borderRadius = '2px';
            // 减少模糊以增强可见性
            if (layer > 0) {
                trail.style.filter = `blur(${layer * 0.3}px)`;
            }
            
            document.body.appendChild(trail);
            
            setTimeout(() => {
                // 增加拖尾长度2倍 - 最大高度从120增加到240
                const maxHeight = Math.min(dropDistance * (1.2 + layer * 0.1), 240); // 2倍长度
                trail.style.height = maxHeight + 'px';
                trail.style.transform = `translateX(${horizontalOffset}px)`;
            }, 100 + layer * 20);
            
            // 由于拖尾更长，延长存在时间
            setTimeout(() => {
                if (trail.parentNode) {
                    trail.parentNode.removeChild(trail);
                }
            }, 2500 + layer * 200); // 稍微延长存在时间
        }
    }
    
    cleanup() {
        this.triggeredElements.clear();
        this.hoverTimers.forEach(timer => clearTimeout(timer));
        this.hoverTimers.clear();
        
        // 优化清理过程
        const fixedElements = document.querySelectorAll('[style*="position: fixed"]');
        fixedElements.forEach(el => {
            if ((el.style.background && (el.style.background.includes('linear-gradient') || el.style.background.includes('#'))) ||
                (el.style.borderRadius && el.style.borderRadius.includes('50%'))) {
                el.remove();
            }
        });
    }
}

function splitTextToChars(container) {
    const blocks = container.querySelectorAll('.text-block');

    blocks.forEach(block => {
        const sourceText = block.textContent;
        block.textContent = '';

        Array.from(sourceText).forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'text-char';
            span.dataset.index = String(index);
            span.textContent = char;
            block.appendChild(span);
        });
    });
}

function initPointerInteraction(container, sadnessAnimation) {
    container.addEventListener('mousemove', event => {
        const target = event.target.closest('.text-char');
        if (!target) {
            return;
        }

        const index = Number(target.dataset.index || 0);
        sadnessAnimation.trigger(target, index, event.clientX, event.clientY);
    });
}

async function initIntroAnimation() {
    const body = document.body;
    const intro = document.getElementById('intro');
    const lottieContainer = document.getElementById('intro-lottie');

    if (!intro || !lottieContainer || typeof window.lottie === 'undefined') {
        return;
    }

    body.classList.add('intro-active');

    let hasAnimation = false;

    try {
        const response = await fetch('disappear.json', { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            hasAnimation = true;
            const animation = window.lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: false,
                autoplay: true,
                animationData: data
            });

            animation.addEventListener('complete', () => {
                intro.classList.add('intro--done');
                body.classList.remove('intro-active');
            });
        }
    } catch (error) {
        hasAnimation = false;
    }

    if (!hasAnimation) {
        setTimeout(() => {
            intro.classList.add('intro--done');
            body.classList.remove('intro-active');
        }, 350);
    }
}

function initDisappearInteraction() {
    const textDisplay = document.getElementById('text-display');
    if (!textDisplay) {
        return;
    }

    splitTextToChars(textDisplay);
    const sadnessAnimation = new SadnessAnimation();
    initPointerInteraction(textDisplay, sadnessAnimation);
    initIntroAnimation();

    window.addEventListener('beforeunload', () => {
        sadnessAnimation.cleanup();
    });
}

window.initDisappearInteraction = initDisappearInteraction;