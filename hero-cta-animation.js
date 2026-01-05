/**
 * Hero CTA Animation
 * Hiệu ứng động cho các nút Call-to-Action
 */

class HeroCTAAnimation {
    constructor() {
        this.ctaContainer = document.querySelector('.hero-cta');
        this.callButton = document.querySelector('.btn-call');
        this.bookButton = document.querySelector('.btn-outline');
        
        this.init();
    }
    
    init() {
        if (!this.ctaContainer) return;
        
        // Thêm animation khi trang được load
        window.addEventListener('load', () => {
            this.animateOnLoad();
        });
        
        // Thêm hover effects
        this.addHoverEffects();
        
        // Thêm click effects
        this.addClickEffects();
        
        // Thêm hiệu ứng pulse cho nút gọi
        this.addPulseEffect();
    }
    
    animateOnLoad() {
        // Delay để animation xuất hiện sau khi trang load
        setTimeout(() => {
            this.ctaContainer.style.opacity = '0';
            this.ctaContainer.style.transform = 'translateY(20px)';
            this.ctaContainer.style.display = 'flex';
            this.ctaContainer.style.gap = '15px';
            this.ctaContainer.style.flexWrap = 'wrap';
            
            // Animate container
            this.ctaContainer.animate([
                { opacity: 0, transform: 'translateY(20px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
            });
            
            // Animate từng nút với delay
            this.animateButton(this.callButton, 200);
            this.animateButton(this.bookButton, 400);
            
        }, 300);
    }
    
    animateButton(button, delay) {
        if (!button) return;
        
        button.style.opacity = '0';
        button.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            button.animate([
                { 
                    opacity: 0, 
                    transform: 'scale(0.9) translateY(10px)' 
                },
                { 
                    opacity: 1, 
                    transform: 'scale(1) translateY(0)' 
                }
            ], {
                duration: 600,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                fill: 'forwards'
            });
        }, delay);
    }
    
    addHoverEffects() {
        if (this.callButton) {
            this.callButton.addEventListener('mouseenter', () => {
                this.addHoverAnimation(this.callButton, 'primary');
            });
            
            this.callButton.addEventListener('mouseleave', () => {
                this.removeHoverAnimation(this.callButton);
            });
        }
        
        if (this.bookButton) {
            this.bookButton.addEventListener('mouseenter', () => {
                this.addHoverAnimation(this.bookButton, 'secondary');
            });
            
            this.bookButton.addEventListener('mouseleave', () => {
                this.removeHoverAnimation(this.bookButton);
            });
        }
    }
    
    addHoverAnimation(button, type) {
        const isPrimary = type === 'primary';
        
        button.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.05)' },
            { transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
        
        // Thêm hiệu ứng đổ bóng
        button.style.boxShadow = isPrimary 
            ? '0 10px 20px rgba(0, 123, 255, 0.3)' 
            : '0 10px 20px rgba(108, 117, 125, 0.2)';
    }
    
    removeHoverAnimation(button) {
        button.style.boxShadow = '';
    }
    
    addClickEffects() {
        if (this.callButton) {
            this.callButton.addEventListener('mousedown', () => {
                this.addClickAnimation(this.callButton);
            });
            
            this.callButton.addEventListener('mouseup', () => {
                this.removeClickAnimation(this.callButton);
            });
            
            this.callButton.addEventListener('click', () => {
                this.onCallButtonClick();
            });
        }
        
        if (this.bookButton) {
            this.bookButton.addEventListener('mousedown', () => {
                this.addClickAnimation(this.bookButton);
            });
            
            this.bookButton.addEventListener('mouseup', () => {
                this.removeClickAnimation(this.bookButton);
            });
            
            this.bookButton.addEventListener('click', () => {
                this.onBookButtonClick();
            });
        }
    }
    
    addClickAnimation(button) {
        button.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.95)' }
        ], {
            duration: 150,
            fill: 'forwards'
        });
    }
    
    removeClickAnimation(button) {
        button.animate([
            { transform: 'scale(0.95)' },
            { transform: 'scale(1)' }
        ], {
            duration: 150,
            fill: 'forwards'
        });
    }
    
    onCallButtonClick() {
        // Hiệu ứng khi click nút gọi
        this.callButton.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.9)' },
            { transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
        
        // Thêm hiệu ứng "ripple"
        this.createRippleEffect(this.callButton, '#007bff');
        
        // Analytics hoặc tracking có thể thêm ở đây
        console.log('Call button clicked - Tracking event');
    }
    
    onBookButtonClick() {
        // Hiệu ứng khi click nút đặt xe
        this.bookButton.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(0.9)' },
            { transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
        
        // Thêm hiệu ứng "ripple"
        this.createRippleEffect(this.bookButton, '#6c757d');
        
        // Analytics hoặc tracking có thể thêm ở đây
        console.log('Book button clicked - Tracking event');
    }
    
    createRippleEffect(button, color) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.backgroundColor = color;
        ripple.style.opacity = '0.3';
        ripple.style.borderRadius = '50%';
        ripple.style.position = 'absolute';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    addPulseEffect() {
        if (!this.callButton) return;
        
        // Thêm class để CSS có thể style
        this.callButton.classList.add('pulse-animation');
        
        // Tạo hiệu ứng pulse định kỳ
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.callButton.animate([
                    { boxShadow: '0 0 0 0 rgba(0, 123, 255, 0.7)' },
                    { boxShadow: '0 0 0 10px rgba(0, 123, 255, 0)' }
                ], {
                    duration: 1500,
                    easing: 'ease-out'
                });
            }
        }, 4000); // Pulse mỗi 4 giây
    }
    
    // Thêm method để kích hoạt animation khi scroll vào view
    addScrollAnimation() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateOnLoad();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        if (this.ctaContainer) {
            observer.observe(this.ctaContainer);
        }
    }
}

// CSS cần thêm vào (có thể thêm vào file CSS hoặc tạo style động)
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .hero-cta {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .btn-call, .btn-outline {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .btn-call:hover, .btn-outline:hover {
            transform: translateY(-2px);
        }
        
        @keyframes ripple {
            to {
                transform: translate(-50%, -50%) scale(4);
                opacity: 0;
            }
        }
        
        .pulse-animation {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
            }
        }
        
        /* Responsive animations */
        @media (max-width: 768px) {
            .hero-cta {
                flex-direction: column;
                align-items: stretch;
            }
            
            .btn-call, .btn-outline {
                width: 100%;
                margin-bottom: 10px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    addAnimationStyles();
    new HeroCTAAnimation();
});

// Export cho module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroCTAAnimation;
}