// chatbot-standalone.js - HOÀN TOÀN ĐỘC LẬP

class StandaloneChatButtons {
    constructor() {
        this.phoneNumber = '0567033888';
        this.zaloLink = 'https://zalo.me/0567033888';
        this.whatsappLink = `https://wa.me/840567033888?text=${encodeURIComponent('Xin chào HTUTransport! Tôi muốn tư vấn về dịch vụ xe.')}`;
        
        // Performance detection
        this.isMobile = this.detectMobile();
        this.isLowPerformance = this.detectLowPerformance();
        
        // Stats
        this.stats = {
            phone: this.getStat('phone'),
            zalo: this.getStat('zalo'),
            whatsapp: this.getStat('whatsapp')
        };
        
        // Tạo HTML và CSS
        this.createChatButtons();
        this.injectChatButtonsCSS();
        
        // Khởi tạo
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    detectLowPerformance() {
        const concurrency = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        const isSlowCPU = concurrency <= 4;
        const isLowRAM = memory < 4;
        
        return this.isMobile && (isSlowCPU || isLowRAM);
    }
    
    shouldSkipAnimations() {
        return this.isLowPerformance || 
               window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
               !document.hasFocus();
    }
    
    async init() {
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                if (document.readyState === 'complete') resolve();
                else window.addEventListener('load', resolve, { once: true });
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.setupOptimizedEvents();
        this.observePerformance();
        
        console.log('🚀 Standalone Chat Buttons initialized');
    }
    
    createChatButtons() {
        if (document.getElementById('standaloneChatButtons')) return;
        
        const buttonsHTML = `
            <div class="standalone-chat-buttons" id="standaloneChatButtons">
                <!-- Nút Gọi Điện -->
                <button class="chat-btn phone-btn" id="standalonePhoneBtn" 
                        aria-label="Gọi điện cho HTUTransport">
                    <i class="fas fa-phone-alt" aria-hidden="true"></i>
                    <span class="chat-tooltip">Gọi ngay: ${this.formatPhone(this.phoneNumber)}</span>
                    ${this.stats.phone > 0 ? `<span class="chat-badge" id="phoneBadge">${this.stats.phone}</span>` : ''}
                </button>
                
                <!-- Nút Zalo -->
                <button class="chat-btn zalo-btn" id="standaloneZaloBtn"
                        aria-label="Nhắn tin Zalo cho HTUTransport">
                    <i class="fab fa-facebook-messenger" aria-hidden="true"></i>
                    <span class="chat-tooltip">Zalo: ${this.formatPhone(this.phoneNumber)}</span>
                    ${this.stats.zalo > 0 ? `<span class="chat-badge" id="zaloBadge">${this.stats.zalo}</span>` : ''}
                </button>
                
                <!-- Nút WhatsApp -->
                <button class="chat-btn whatsapp-btn" id="standaloneWhatsappBtn"
                        aria-label="Chat WhatsApp với HTUTransport">
                    <i class="fab fa-whatsapp" aria-hidden="true"></i>
                    <span class="chat-tooltip">WhatsApp: ${this.formatPhone(this.phoneNumber)}</span>
                    ${this.stats.whatsapp > 0 ? `<span class="chat-badge" id="whatsappBadge">${this.stats.whatsapp}</span>` : ''}
                </button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', buttonsHTML);
        
        if (this.shouldSkipAnimations()) {
            this.disableAnimations();
        }
    }
    
    injectChatButtonsCSS() {
        if (document.getElementById('standalone-chat-css')) return;
        
        const css = `
            /* Standalone Chat Buttons CSS */
            .standalone-chat-buttons {
                position: fixed;
                bottom: 100px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                z-index: 9999;
            }
            
            .chat-btn {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            
            .chat-btn:hover {
                transform: translateY(-5px) scale(1.1);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            }
            
            .chat-btn:active {
                transform: translateY(0) scale(0.95);
            }
            
            .phone-btn {
                background: linear-gradient(135deg, #2196F3, #1976D2);
            }
            
            .zalo-btn {
                background: linear-gradient(135deg, #0068FF, #0052CC);
            }
            
            .whatsapp-btn {
                background: linear-gradient(135deg, #25D366, #128C7E);
            }
            
            .chat-tooltip {
                position: absolute;
                right: 70px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(30, 30, 30, 0.95);
                color: white;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
            }
            
            .chat-btn:hover .chat-tooltip {
                opacity: 1;
                right: 75px;
            }
            
            .chat-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #FF4081;
                color: white;
                font-size: 10px;
                font-weight: bold;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: badgePulse 2s infinite;
            }
            
            @keyframes badgePulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .standalone-chat-buttons {
                    bottom: 80px;
                    right: 15px;
                    gap: 12px;
                }
                
                .chat-btn {
                    width: 55px;
                    height: 55px;
                    font-size: 20px;
                }
                
                .chat-tooltip {
                    font-size: 11px;
                    padding: 6px 10px;
                }
                
                .chat-btn:hover .chat-tooltip {
                    right: 65px;
                }
            }
            
            @media (max-width: 480px) {
                .standalone-chat-buttons {
                    bottom: 70px;
                    right: 10px;
                    gap: 10px;
                }
                
                .chat-btn {
                    width: 50px;
                    height: 50px;
                    font-size: 18px;
                }
                
                .chat-tooltip {
                    display: none; /* Ẩn tooltip trên mobile nhỏ */
                }
            }
        `;
        
        const style = document.createElement('style');
        style.id = 'standalone-chat-css';
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    setupOptimizedEvents() {
        const phoneBtn = document.getElementById('standalonePhoneBtn');
        const zaloBtn = document.getElementById('standaloneZaloBtn');
        const whatsappBtn = document.getElementById('standaloneWhatsappBtn');
        
        if (phoneBtn) {
            phoneBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePhoneClick();
            });
        }
        
        if (zaloBtn) {
            zaloBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleZaloClick();
            });
        }
        
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleWhatsAppClick();
            });
        }
        
        if (this.isMobile) {
            [phoneBtn, zaloBtn, whatsappBtn].forEach(btn => {
                if (btn) {
                    btn.addEventListener('touchstart', () => {
                        btn.classList.add('active');
                    }, { passive: true });
                    
                    btn.addEventListener('touchend', () => {
                        setTimeout(() => btn.classList.remove('active'), 150);
                    }, { passive: true });
                }
            });
        }
    }
    
    handlePhoneClick() {
        this.trackInteraction('phone');
        this.showClickFeedback('phone');
        
        setTimeout(() => {
            window.location.href = `tel:${this.phoneNumber}`;
        }, 150);
    }
    
    handleZaloClick() {
        this.trackInteraction('zalo');
        this.showClickFeedback('zalo');
        
        setTimeout(() => {
            window.open(this.zaloLink, '_blank', 'noopener,noreferrer');
        }, 150);
    }
    
    handleWhatsAppClick() {
        this.trackInteraction('whatsapp');
        this.showClickFeedback('whatsapp');
        
        setTimeout(() => {
            window.open(this.whatsappLink, '_blank', 'noopener,noreferrer');
        }, 150);
    }
    
    showClickFeedback(type) {
        const btn = document.getElementById(`standalone${this.capitalize(type)}Btn`);
        if (!btn) return;
        
        btn.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            btn.style.transform = '';
        }, 150);
        
        this.updateBadge(type);
    }
    
    trackInteraction(type) {
        this.stats[type] = (this.stats[type] || 0) + 1;
        this.saveStatsDebounced();
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_click', {
                'event_category': 'engagement',
                'event_label': type,
                'value': this.stats[type]
            });
        }
    }
    
    updateBadge(type) {
        const badge = document.getElementById(`${type}Badge`);
        const count = this.stats[type];
        
        if (count > 0) {
            if (!badge) {
                const btn = document.getElementById(`standalone${this.capitalize(type)}Btn`);
                const badgeHTML = `<span class="chat-badge" id="${type}Badge">${count}</span>`;
                btn.insertAdjacentHTML('beforeend', badgeHTML);
            } else {
                badge.textContent = count;
                badge.style.display = 'flex';
                
                badge.style.animation = 'none';
                setTimeout(() => {
                    badge.style.animation = 'badgePulse 0.5s ease';
                }, 10);
            }
        }
    }
    
    observePerformance() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        }, { passive: true });
        
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.3) {
                    this.enablePowerSavingMode();
                }
                
                battery.addEventListener('levelchange', () => {
                    if (battery.level < 0.2) {
                        this.enablePowerSavingMode();
                    }
                });
            });
        }
        
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            const buttons = document.getElementById('standaloneChatButtons');
            if (buttons) {
                buttons.style.opacity = '0.7';
                buttons.style.pointerEvents = 'none';
                
                scrollTimeout = setTimeout(() => {
                    buttons.style.opacity = '1';
                    buttons.style.pointerEvents = 'auto';
                }, 300);
            }
        }, { passive: true });
    }
    
    disableAnimations() {
        const buttons = document.querySelectorAll('.chat-btn');
        buttons.forEach(btn => {
            btn.style.animation = 'none';
            btn.style.willChange = 'auto';
        });
    }
    
    pauseAnimations() {
        const buttons = document.querySelectorAll('.chat-btn');
        buttons.forEach(btn => {
            btn.style.animationPlayState = 'paused';
        });
    }
    
    resumeAnimations() {
        if (!this.shouldSkipAnimations()) {
            const buttons = document.querySelectorAll('.chat-btn');
            buttons.forEach(btn => {
                btn.style.animationPlayState = 'running';
            });
        }
    }
    
    enablePowerSavingMode() {
        this.disableAnimations();
        const container = document.getElementById('standaloneChatButtons');
        if (container) {
            container.style.opacity = '0.8';
        }
    }
    
    getStat(type) {
        try {
            return parseInt(localStorage.getItem(`standalone_${type}_clicks`)) || 0;
        } catch {
            return 0;
        }
    }
    
    saveStatsDebounced() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem('standalone_phone_clicks', this.stats.phone);
                localStorage.setItem('standalone_zalo_clicks', this.stats.zalo);
                localStorage.setItem('standalone_whatsapp_clicks', this.stats.whatsapp);
            } catch (e) {}
        }, 1000);
    }
    
    formatPhone(phone) {
        return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3');
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// ===== KHỞI TẠO TỰ ĐỘNG =====
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.standaloneChatButtons = new StandaloneChatButtons();
        window.standaloneChatButtons.init();
    }, 1000);
});

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StandaloneChatButtons;
}