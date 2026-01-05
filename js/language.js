// language-standalone.js - HOÀN TOÀN ĐỘC LẬP
// Chỉ cần include file này, không cần HTML/CSS trước

class StandaloneTranslate {
    constructor() {
        this.isLoaded = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.preventGoogleTranslateStyles = true;
        
        // Tạo HTML và CSS
        this.createLanguageSelector();
        this.injectLanguageCSS();
        
        // Khởi tạo
        this.setupEventDelegation();
        this.init();
    }
    
    createLanguageSelector() {
        // Kiểm tra nếu đã có header actions
        let headerActions = document.querySelector('.header-actions');
        
        if (!headerActions) {
            // Tạo header actions nếu chưa có
            const header = document.querySelector('.app-header .header-content') || document.querySelector('header') || document.body;
            
            headerActions = document.createElement('div');
            headerActions.className = 'header-actions';
            header.appendChild(headerActions);
        }
        
        // Kiểm tra nếu language selector đã tồn tại
        if (document.getElementById('languageSelector')) return;
        
        const languageHTML = `
            <div class="language-selector" id="languageSelector">
                <!-- Nút custom của chúng ta - TRIGGER CHO GOOGLE TRANSLATE -->
                <button class="language-btn notranslate" id="googleTranslateTrigger" aria-label="Chọn ngôn ngữ">
                    <i class="fas fa-globe notranslate"></i>
                    <span id="currentLanguageDisplay" class="notranslate">VI</span>
                    <i class="fas fa-chevron-down notranslate"></i>
                </button>
                
                <!-- Google Translate Element (sẽ được JS tạo và ẩn) -->
                <div id="google_translate_element" style="display: none;"></div>
                
                <!-- Custom dropdown cho chọn ngôn ngữ nhanh -->
                <div class="language-dropdown notranslate" id="languageDropdown">
                    <a href="#" class="language-option notranslate" data-lang="vi">
                        <span class="language-flag notranslate">🇻🇳</span>
                        <span class="language-name notranslate">Tiếng Việt</span>
                        <span class="language-code notranslate">VI</span>
                    </a>
                    <a href="#" class="language-option notranslate" data-lang="en">
                        <span class="language-flag notranslate">🇺🇸</span>
                        <span class="language-name notranslate">English</span>
                        <span class="language-code notranslate">EN</span>
                    </a>
                    <a href="#" class="language-option notranslate" data-lang="ko">
                        <span class="language-flag notranslate">🇰🇷</span>
                        <span class="language-name notranslate">한국어</span>
                        <span class="language-code notranslate">KO</span>
                    </a>
                    <a href="#" class="language-option notranslate" data-lang="zh-CN">
                        <span class="language-flag notranslate">🇨🇳</span>
                        <span class="language-name notranslate">中文</span>
                        <span class="language-code notranslate">ZH</span>
                    </a>
                    <a href="#" class="language-option notranslate" data-lang="ja">
                        <span class="language-flag notranslate">🇯🇵</span>
                        <span class="language-name notranslate">日本語</span>
                        <span class="language-code notranslate">JA</span>
                    </a>
                </div>
            </div>
        `;
        
        headerActions.insertAdjacentHTML('beforeend', languageHTML);
    }
    
    injectLanguageCSS() {
    if (document.getElementById('standalone-language-css')) return;

    const css = `
/* =========================
   HEADER & OVERFLOW FIX
========================= */
header,
.header,
.header-inner,
.header-actions,
nav {
    overflow: visible !important;
    transform: none !important;
    filter: none !important;
}

/* =========================
   LANGUAGE SELECTOR
========================= */
.language-selector {
    position: relative;
    display: inline-block;
    margin-right: 10px;
    z-index: 2000;
}

/* =========================
   BUTTON
========================= */
.language-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 6px;
    padding: 4px 8px;
    color: var(--champagne);
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    min-width: 60px;
    height: 32px;
    justify-content: space-between;
}

.language-btn i {
    font-size: 12px;
}

/* =========================
   DROPDOWN - DESKTOP
========================= */
.language-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #1a1a1a;
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 10px;
    min-width: 180px;
    padding: 8px 0;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    display: none;
    z-index: 3000;
}

.language-dropdown.show {
    display: block;
}

/* =========================
   OPTIONS
========================= */
.language-option {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    color: var(--text-primary);
    text-decoration: none;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.language-option:last-child {
    border-bottom: none;
}

.language-option:hover {
    background: rgba(212, 175, 55, 0.1);
}

.language-flag {
    font-size: 18px;
    width: 24px;
    margin-right: 10px;
}

.language-name {
    flex: 1;
    font-size: 14px;
}

.language-code {
    font-size: 12px;
    font-weight: 700;
    color: var(--champagne);
    background: rgba(212, 175, 55, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
}

/* =========================
   ONLINE INDICATOR
========================= */
.online-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 16px;
    padding: 4px 10px;
    color: var(--champagne);
    font-size: 12px;
    font-weight: 600;
    height: 28px;
}

.online-count {
    font-size: 12px;
}

/* =========================
   🔥 MOBILE FIX (QUAN TRỌNG)
========================= */
@media (max-width: 768px) {
    .language-dropdown {
        position: fixed !important;
        top: 60px !important;       /* ngay dưới header */
        right: 10px !important;
        left: auto !important;
        max-width: calc(100vw - 20px);
        width: 220px;
        z-index: 9999;
    }
}

/* =========================
   GOOGLE TRANSLATE HIDE
========================= */
.goog-te-banner-frame,
.skiptranslate,
.goog-te-menu-value,
.goog-te-gadget {
    display: none !important;
}

body {
    top: 0 !important;
    position: static !important;
}
`;

    const style = document.createElement('style');
    style.id = 'standalone-language-css';
    style.textContent = css;
    document.head.appendChild(style);
}
    
    // ===== CÁC PHƯƠNG THỨC CŨ GIỮ NGUYÊN =====
    setupEventDelegation() {
        document.addEventListener('click', this.handleGlobalClick.bind(this), true);
        this.protectExistingEventListeners();
        this.setupDropdownDelegation();
    }
    
    handleGlobalClick(e) {
        if (this.isGoogleTranslateElement(e.target)) {
            return;
        }
        this.restoreClickEvents(e);
    }
    
    isGoogleTranslateElement(element) {
        let el = element;
        while (el && el !== document) {
            if (el.classList?.contains('goog-te-') || 
                el.id?.includes('google') ||
                el.className?.includes('VIpgJd')) {
                return true;
            }
            el = el.parentElement;
        }
        return false;
    }
    
    restoreClickEvents(event) {
        const target = event.target;
        let currentElement = target;
        
        while (currentElement && currentElement !== document) {
            if (currentElement.hasAttribute('onclick')) {
                const onclickValue = currentElement.getAttribute('onclick');
                if (onclickValue && !onclickValue.includes('goog-te')) {
                    event.stopPropagation();
                    event.preventDefault();
                    
                    try {
                        if (onclickValue.includes('(') && onclickValue.includes(')')) {
                            const fn = new Function(onclickValue);
                            fn.call(currentElement);
                        } else {
                            eval(onclickValue);
                        }
                    } catch (err) {
                        console.warn('Could not execute onclick:', err);
                    }
                    return;
                }
            }
            
            if (currentElement.tagName === 'BUTTON' || 
                currentElement.tagName === 'A' ||
                currentElement.hasAttribute('onclick')) {
                currentElement.style.pointerEvents = 'auto';
                currentElement.style.zIndex = '9999';
            }
            
            currentElement = currentElement.parentElement;
        }
    }
    
    protectExistingEventListeners() {
        const elementsWithOnclick = document.querySelectorAll('[onclick]');
        elementsWithOnclick.forEach(el => {
            const originalOnclick = el.getAttribute('onclick');
            if (originalOnclick && !originalOnclick.includes('goog-te')) {
                el.setAttribute('data-original-onclick', originalOnclick);
                
                el.addEventListener('click', function(e) {
                    if (e.isTrusted && !e.defaultPrevented) {
                        try {
                            eval(originalOnclick);
                        } catch (err) {
                            console.warn('Failed to execute onclick:', err);
                        }
                    }
                });
            }
        });
    }
    
    setupDropdownDelegation() {
        document.addEventListener('click', (e) => {
            const translateBtn = document.getElementById('googleTranslateTrigger');
            const dropdown = document.getElementById('languageDropdown');
            
            if (!translateBtn || !dropdown) return;
            
            if (translateBtn.contains(e.target)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                document.querySelectorAll('.language-dropdown.show').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                
                dropdown.classList.toggle('show');
                return;
            }
            
            if (dropdown.contains(e.target)) {
                const option = e.target.closest('.language-option');
                if (option) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.handleLanguageSelect(option);
                }
            }
            
            if (dropdown.classList.contains('show') && 
                !dropdown.contains(e.target) && 
                !translateBtn.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
    
    handleLanguageSelect(option) {
        const lang = option.getAttribute('data-lang');
        if (!lang) return;
        
        const dropdown = document.getElementById('languageDropdown');
        if (dropdown) dropdown.classList.remove('show');
        
        if (lang === 'vi') {
            localStorage.removeItem('HTUTransport_lang');
            this.resetToVietnamese();
            return;
        }
        
        this.translateTo(lang);
        this.updateLanguageDisplay(lang);
    }
    
    translateTo(language) {
        if (!this.isLoaded) {
            console.log('⚠️ Google Translate not ready, queuing translation...');
            setTimeout(() => this.translateTo(language), 500);
            return;
        }
        
        try {
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                const translateInstance = window.google.translate.TranslateElement.getInstance();
                
                if (translateInstance && translateInstance.selectValue) {
                    translateInstance.selectValue(language);
                } else {
                    const select = document.querySelector('.goog-te-combo');
                    if (select) {
                        select.value = language;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                
                localStorage.setItem('HTUTransport_lang', language);
                console.log(`✅ Translation to ${language} triggered`);
            }
        } catch (error) {
            console.error('Translation error:', error);
        }
    }
    
    resetToVietnamese() {
        try {
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                const translateInstance = window.google.translate.TranslateElement.getInstance();
                
                if (translateInstance && translateInstance.restore) {
                    translateInstance.restore();
                }
                
                document.querySelectorAll('.goog-te-menu-value, .goog-te-gadget, .goog-te-banner')
                    .forEach(el => {
                        el.style.display = 'none';
                    });
                
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.log('Reloading page to reset language...');
            window.location.reload();
        }
    }
    
    init() {
        this.loadProtectedScript();
        this.checkLoaded();
    }
    
    loadProtectedScript() {
        const existingScript = document.querySelector('script[src*="translate.google.com"]');
        if (existingScript) existingScript.remove();
        
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateCallbackProtected';
        script.async = true;
        
        window.googleTranslateCallbackProtected = () => {
            console.log('✅ Google Translate script loaded with protection');
            this.isLoaded = true;
            this.initializeProtectedWidget();
            this.applyProtectionStyles();
        };
        
        script.onerror = () => {
            console.error('❌ Failed to load Google Translate');
            this.retryLoad();
        };
        
        document.head.appendChild(script);
    }
    
    initializeProtectedWidget() {
        if (!window.google || !window.google.translate) {
            console.error('Google Translate API not available');
            return;
        }
        
        try {
            new google.translate.TranslateElement({
                pageLanguage: 'vi',
                includedLanguages: 'vi,en,ko,zh-CN,ja',
                layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                autoDisplay: false,
                disableAutoTranslation: true,
                multilanguagePage: true,
                disableAutoDisplay: true,
                preventReload: true
            }, 'google_translate_element');
            
            console.log('✅ Google Translate widget initialized with protection');
            this.loadSavedLanguage();
            
        } catch (error) {
            console.error('Error initializing widget:', error);
        }
    }
    
    applyProtectionStyles() {
        const oldStyle = document.getElementById('google-translate-protection');
        if (oldStyle) oldStyle.remove();
        
        const style = document.createElement('style');
        style.id = 'google-translate-protection';
        style.textContent = `
            /* QUAN TRỌNG: Bảo vệ tất cả các element khỏi Google Translate */
            body *:not(.goog-te-*):not(.VIpgJd-*):not(.skiptranslate) {
                pointer-events: auto !important;
                z-index: auto !important;
                position: relative !important;
                transform: none !important;
            }
            
            /* Bảo vệ đặc biệt cho các element quan trọng */
            button:not(.goog-te-*),
            a:not(.goog-te-*),
            [onclick]:not(.goog-te-*),
            .pricing-preview-card *,
            .gallery-card *,
            .benefit-card *,
            .service-card *,
            .btn-view-all-pricing,
            .btn-quick-call,
            .btn-quick-book,
            .mini-call-btn,
            .mini-book-btn {
                pointer-events: auto !important;
                cursor: pointer !important;
                z-index: 9999 !important;
                position: relative !important;
                transform-style: preserve-3d !important;
                isolation: isolate !important;
            }
            
            /* Ẩn Google Translate UI không cần thiết */
            .goog-te-banner-frame,
            .skiptranslate,
            .goog-te-menu-value,
            .goog-te-gadget {
                display: none !important;
            }
            
            /* Giữ dropdown ngôn ngữ của chúng ta luôn trên cùng */
            .language-dropdown {
                z-index: 999999 !important;
            }
            
            /* Fix body khi Google Translate can thiệp */
            body {
                top: 0 !important;
                position: static !important;
            }
            
            /* Bảo vệ iframe của Google Translate không chồng lấn */
            .goog-te-menu-frame,
            .goog-te-menu-value {
                max-height: 0;
                overflow: hidden;
            }
        `;
        
        document.head.appendChild(style);
        this.applyImmediateProtection();
    }
    
    applyImmediateProtection() {
        const protectSelectors = [
            '.pricing-preview-card',
            '.gallery-card',
            '.benefit-card',
            '.service-card',
            '[onclick]',
            'button',
            'a[href^="#"]',
            '.btn-view-all-pricing',
            '.tab-item'
        ];
        
        protectSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el.classList.toString().includes('goog-te')) {
                    el.style.pointerEvents = 'auto';
                    el.style.cursor = 'pointer';
                    el.style.zIndex = '9999';
                    el.style.position = 'relative';
                }
            });
        });
    }
    
    updateLanguageDisplay(lang) {
        const display = document.getElementById('currentLanguageDisplay');
        if (!display) return;
        
        const codes = { 'vi': 'VI', 'en': 'EN', 'ko': 'KO', 'zh-CN': '中文', 'ja': '日本語' };
        display.textContent = codes[lang] || 'VI';
        this.updateActiveLanguage(lang);
    }
    
    updateActiveLanguage(lang) {
        const options = document.querySelectorAll('.language-option');
        const langMap = { 'vi': 'VI', 'en': 'EN', 'ko': 'KO', 'zh-CN': '中文', 'ja': '日本語' };
        
        options.forEach(option => {
            option.classList.remove('active');
            const codeSpan = option.querySelector('.language-code');
            if (codeSpan && codeSpan.textContent === langMap[lang]) {
                option.classList.add('active');
            }
        });
    }
    
    retryLoad() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retrying Google Translate load (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.loadProtectedScript(), 1000 * this.retryCount);
        }
    }
    
    checkLoaded() {
        if (window.google && window.google.translate) {
            this.isLoaded = true;
            this.initializeProtectedWidget();
            this.applyProtectionStyles();
        } else {
            setTimeout(() => this.checkLoaded(), 500);
        }
    }
    
    loadSavedLanguage() {
        const savedLang = localStorage.getItem('HTUTransport_lang') || 'vi';
        if (savedLang !== 'vi') {
            setTimeout(() => {
                this.translateTo(savedLang);
            }, 1500);
        }
    }
}

// ===== KHỞI TẠO TỰ ĐỘNG =====
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.standaloneTranslate = new StandaloneTranslate();
        console.log('✅ Standalone Translate initialized');
    }, 100);
});

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StandaloneTranslate;
}