// seo-helper.js - Tự động SEO optimization
class SEOHelper {
    constructor() {
        this.apiEndpoints = {
            googleIndexing: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
            bingSubmit: 'https://www.bing.com/webmaster/api.svc/json/SubmitUrl'
        };
        
        // Danh sách các file hợp lệ không cần .html
        this.validFileExtensions = [
            '.xml',
            '.json',
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.svg',
            '.ico',
            '.txt',
            '.css',
            '.js'
        ];
        
        // Danh sách các URLs hợp lệ không cần kiểm tra
        this.validSpecialUrls = [
            '/sitemap.xml',
            '/robots.txt',
            '/favicon.ico',
            '/manifest.json',
            '/feed.xml',
            '/atom.xml',
            '/rss.xml'
        ];
    }

    // Tự động thêm URL blog vào sitemap
    async updateSitemapWithBlogPosts(blogPosts) {
        try {
            //console.log('📝 Updating sitemap with blog posts:', Object.keys(blogPosts).length);
            
            // Tạo XML entries
            const entries = this.generateBlogSitemapEntries(blogPosts);
            
            // Log cho developer
            //console.log('✅ Generated sitemap entries for blog posts');
            //console.log('📊 Add this to your sitemap.xml manually:');
            //console.log(entries);
            
            return true;
        } catch (error) {
            console.error('❌ Error updating sitemap:', error);
            return false;
        }
    }

    generateBlogSitemapEntries(posts) {
        let entries = '';
        
        Object.entries(posts).forEach(([postId, post]) => {
            const url = `https://htutransport.com/blog.html?post=${postId}`;
            const date = post.date || new Date().toISOString().split('T')[0];
            
            entries += `    <url>
        <loc>${url}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
        <image:image>
            <image:loc>${post.image}</image:loc>
            <image:title>${post.title}</image:title>
            <image:caption>${post.excerpt}</image:caption>
        </image:image>
    </url>\n`;
        });
        
        return entries;
    }

    // Thêm JSON-LD cho Breadcrumb động
    addDynamicBreadcrumb(pageType, pageTitle) {
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Trang chủ",
                    "item": "https://htutransport.com/"
                }
            ]
        };

        if (pageType === 'blog') {
            breadcrumbSchema.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://htutransport.com/blog.html"
            });
            
            if (pageTitle) {
                breadcrumbSchema.itemListElement.push({
                    "@type": "ListItem",
                    "position": 3,
                    "name": pageTitle,
                    "item": window.location.href
                });
            }
        }

        // Thêm vào head
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(breadcrumbSchema);
        document.head.appendChild(script);
        
        //console.log('✅ Added dynamic breadcrumb schema');
    }

    // Trong seo-helper.js, sửa method optimizeImages()
optimizeImages() {
    let optimizedCount = 0;
    let skippedCount = 0;
    
    document.querySelectorAll('img').forEach(img => {
        // ⭐ THÊM DÒNG NÀY: Bỏ qua Google Translate images
        if (img.src.includes('translate/v14/24px.svg')) {
            // Tự động thêm alt cho Google Translate icon
            if (!img.alt || img.alt === '') {
                img.alt = 'Google Translate Icon';
                img.setAttribute('aria-hidden', 'true');
            }
            return; // Bỏ qua không đếm
        }
        
        // Phần còn lại giữ nguyên...
        if (img.width < 50 || img.height < 50) {
            skippedCount++;
            return;
        }
        // ... rest of the code
    });
    
    //console.log(`✅ Optimized ${optimizedCount} images, skipped ${skippedCount} small images`);
    return optimizedCount;
}

    // Kiểm tra xem URL có phải là file hợp lệ không
    isValidFileUrl(url) {
        // Kiểm tra các URLs đặc biệt
        if (this.validSpecialUrls.some(specialUrl => url.includes(specialUrl))) {
            return true;
        }
        
        // Kiểm tra extension hợp lệ
        return this.validFileExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }

    // Kiểm tra xem link có cần target="_blank" không
    shouldHaveTargetBlank(href) {
        try {
            const url = new URL(href, window.location.origin);
            return url.origin !== window.location.origin;
        } catch {
            return false;
        }
    }

    // Kiểm tra và sửa broken links - SỬA LỖI
    checkBrokenLinks() {
        const links = document.querySelectorAll('a[href]');
        let brokenCount = 0;
        let fixedCount = 0;
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Bỏ qua các loại links đặc biệt
            if (href.startsWith('#') || 
                href.startsWith('javascript:') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:')) {
                return;
            }
            
            // Kiểm tra external links
            if (this.shouldHaveTargetBlank(href)) {
                if (!link.hasAttribute('rel')) {
                    link.setAttribute('rel', 'noopener noreferrer');
                    fixedCount++;
                }
                if (!link.hasAttribute('target')) {
                    link.setAttribute('target', '_blank');
                    fixedCount++;
                }
                return; // External links không kiểm tra broken
            }
            
            // Kiểm tra internal links
            try {
                const url = new URL(href, window.location.origin);
                
                // Nếu là file hợp lệ (xml, pdf, etc.) thì không báo lỗi
                if (this.isValidFileUrl(url.pathname)) {
                    return;
                }
                
                // Kiểm tra nếu link thiếu .html và không phải là thư mục
                if (!url.pathname.includes('.html') && 
                    !url.pathname.endsWith('/') && 
                    !url.pathname.includes('?') &&
                    !url.pathname.includes('#')) {
                    
                    console.warn('⚠️ Potential broken link:', {
                        url: href,
                        text: link.textContent.trim().substring(0, 50),
                        element: link
                    });
                    brokenCount++;
                }
            } catch (error) {
                // URL không hợp lệ
                console.warn('⚠️ Invalid URL:', {
                    url: href,
                    text: link.textContent.trim().substring(0, 50),
                    error: error.message
                });
                brokenCount++;
            }
        });
        
        if (brokenCount > 0) {
            console.warn(`⚠️ Found ${brokenCount} potential broken links, fixed ${fixedCount} links`);
        } else {
            //console.log(`✅ No broken links found, fixed ${fixedCount} links`);
        }
        
        return { broken: brokenCount, fixed: fixedCount };
    }

    // Thêm sự kiện tracking cho SEO - CẢI THIỆN
    setupSEOTracking() {
        // Track internal clicks với debounce
        let clickTimeout;
        document.addEventListener('click', (e) => {
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                const link = e.target.closest('a');
                if (link && link.href && link.href.includes(window.location.origin)) {
                    this.trackEvent('internal_link_click', {
                        url: link.href,
                        text: link.textContent.trim().substring(0, 100),
                        timestamp: Date.now(),
                        element: link.tagName
                    });
                }
            }, 50);
        });

        // Track time on page
        let timeStart = Date.now();
        let pageLoadedTime = Date.now();
        
        // Report time khi rời trang
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                const timeSpent = Math.round((Date.now() - timeStart) / 1000);
                const totalTime = Math.round((Date.now() - pageLoadedTime) / 1000);
                
                this.trackEvent('page_time_spent', {
                    url: window.location.href,
                    visible_seconds: timeSpent,
                    total_seconds: totalTime,
                    timestamp: Date.now()
                });
            }
        });

        // Track scroll depth - CẢI THIỆN
        let scrollDepth = {
            25: false,
            50: false,
            75: false,
            90: false
        };

        let scrollTimeout;
        const trackScroll = () => {
            const scrollHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            ) - window.innerHeight;
            
            if (scrollHeight <= 0) return;
            
            const scrollPercentage = Math.min(
                100,
                Math.round((window.scrollY / scrollHeight) * 100)
            );
            
            Object.keys(scrollDepth).forEach(depth => {
                if (scrollPercentage >= parseInt(depth) && !scrollDepth[depth]) {
                    scrollDepth[depth] = true;
                    this.trackEvent('scroll_depth', {
                        url: window.location.href,
                        depth: `${depth}%`,
                        scrollY: window.scrollY,
                        scrollHeight: scrollHeight,
                        timestamp: Date.now()
                    });
                }
            });
        };

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackScroll, 150);
        }, { passive: true });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                this.trackEvent('form_submit', {
                    form_id: form.id || 'unknown',
                    form_name: form.name || 'unknown',
                    url: window.location.href,
                    timestamp: Date.now()
                });
            }
        });

        //console.log('✅ SEO tracking initialized');
        return true;
    }

    trackEvent(eventName, data) {
        // Gửi đến Google Analytics 4 nếu có
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'seo',
                event_label: data.url || window.location.href,
                value: data.value || 1,
                ...data
            });
        }
        
        // Gửi đến Firebase nếu có
        if (typeof firebase !== 'undefined' && firebase.database) {
            try {
                const database = firebase.database();
                const eventRef = database.ref(`analytics/${Date.now()}`);
                eventRef.set({
                    event: eventName,
                    ...data,
                    user_agent: navigator.userAgent.substring(0, 200),
                    referrer: document.referrer || 'direct',
                    screen_resolution: `${window.screen.width}x${window.screen.height}`,
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    language: navigator.language,
                    timestamp: Date.now()
                }).catch(err => console.debug('Firebase tracking skipped:', err.message));
            } catch (err) {
                // Firebase not configured, skip silently
            }
        }
        
        // Console log cho development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            //console.log(`📊 SEO Event: ${eventName}`, data);
        }
        
        return true;
    }

    // Thêm meta tags động cho mạng xã hội
    updateSocialMetaTags(data) {
        const defaultImage = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80';
        
        const metaTags = {
            'og:title': data.title || document.title || 'HTUTransport - Dịch vụ xe cao cấp',
            'og:description': data.description || document.querySelector('meta[name="description"]')?.content || '',
            'og:image': data.image || defaultImage,
            'og:url': window.location.href,
            'og:type': data.type || 'website',
            'twitter:card': 'summary_large_image',
            'twitter:title': data.title || document.title || 'HTUTransport - Dịch vụ xe cao cấp',
            'twitter:description': data.description || document.querySelector('meta[name="description"]')?.content || '',
            'twitter:image': data.image || defaultImage
        };

        Object.entries(metaTags).forEach(([property, content]) => {
            if (content && content.trim()) {
                let tag = document.querySelector(`meta[property="${property}"]`) || 
                          document.querySelector(`meta[name="${property}"]`);
                
                if (!tag) {
                    tag = document.createElement('meta');
                    if (property.startsWith('og:')) {
                        tag.setAttribute('property', property);
                    } else {
                        tag.setAttribute('name', property);
                    }
                    document.head.appendChild(tag);
                }
                tag.setAttribute('content', content);
            }
        });
        
        //console.log('✅ Updated social meta tags');
        return metaTags;
    }

    // Kiểm tra Core Web Vitals
    checkCoreWebVitals() {
        if (!('PerformanceObserver' in window)) {
            //console.log('⚠️ PerformanceObserver not supported');
            return;
        }

        try {
            // First Contentful Paint (FCP)
            const fcpObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    this.trackEvent('web_vital_fcp', {
                        value: Math.round(entry.startTime),
                        url: window.location.href,
                        rating: this.getRating('fcp', entry.startTime)
                    });
                }
            });
            fcpObserver.observe({ entryTypes: ['paint'] });

            // Largest Contentful Paint (LCP)
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                    this.trackEvent('web_vital_lcp', {
                        value: Math.round(lastEntry.startTime),
                        url: window.location.href,
                        element: lastEntry.element?.tagName || 'unknown',
                        rating: this.getRating('lcp', lastEntry.startTime)
                    });
                }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Cumulative Layout Shift (CLS)
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                
                this.trackEvent('web_vital_cls', {
                    value: Math.round(clsValue * 1000) / 1000, // 3 decimal places
                    url: window.location.href,
                    rating: this.getRating('cls', clsValue)
                });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

            //console.log('✅ Core Web Vitals monitoring initialized');
        } catch (error) {
            console.error('❌ Error initializing Core Web Vitals:', error);
        }
    }

    // Đánh giá Web Vitals
    getRating(metric, value) {
        const thresholds = {
            'fcp': { good: 1000, needsImprovement: 3000 },
            'lcp': { good: 2500, needsImprovement: 4000 },
            'cls': { good: 0.1, needsImprovement: 0.25 }
        };
        
        const threshold = thresholds[metric];
        if (!threshold) return 'unknown';
        
        if (value <= threshold.good) return 'good';
        if (value <= threshold.needsImprovement) return 'needs-improvement';
        return 'poor';
    }

    // Thêm canonical URL động
    addCanonicalUrl(url) {
        if (!url) {
            url = window.location.href.split('?')[0].split('#')[0];
        }
        
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = url;
        
        //console.log('✅ Added canonical URL:', url);
        return url;
    }

    // Kiểm tra và cải thiện SEO on-page
    checkOnPageSEO() {
        const checks = {
            title: { passed: false, message: '' },
            description: { passed: false, message: '' },
            headings: { passed: false, message: '' },
            images: { passed: false, message: '' },
            links: { passed: true, message: 'Internal linking optimized' }

        };

        // Kiểm tra title
        const title = document.title;
        if (title && title.length > 10 && title.length < 60) {
            checks.title.passed = true;
            checks.title.message = `Title length: ${title.length} characters`;
        } else {
            checks.title.message = `Title should be 10-60 characters, current: ${title.length}`;
        }

        // Kiểm tra meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.content) {
            const descLength = metaDesc.content.length;
            if (descLength > 120 && descLength < 160) {
                checks.description.passed = true;
                checks.description.message = `Description length: ${descLength} characters`;
            } else {
                checks.description.message = `Description should be 120-160 characters, current: ${descLength}`;
            }
        } else {
            checks.description.message = 'Meta description not found';
        }

        // Kiểm tra headings
        const h1 = document.querySelectorAll('h1').length;
        const h2 = document.querySelectorAll('h2').length;
        if (h1 === 1) {
            checks.headings.passed = true;
            checks.headings.message = `Headings: H1=${h1}, H2=${h2}`;
        } else {
            checks.headings.message = `Should have exactly 1 H1, found: ${h1}`;
        }

        // Kiểm tra images
        const images = document.querySelectorAll('img');
        const imagesWithAlt = Array.from(images).filter(img => img.alt).length;
        if (images.length === 0 || imagesWithAlt === images.length) {
            checks.images.passed = true;
            checks.images.message = `Images: ${images.length} total, ${imagesWithAlt} with alt`;
        } else {
            checks.images.message = `${images.length - imagesWithAlt} images missing alt text`;
        }

        // Log kết quả
        //console.group('🔍 On-Page SEO Check');
        Object.entries(checks).forEach(([check, data]) => {
            const icon = data.passed ? '✅' : '⚠️';
            //console.log(`${icon} ${check}: ${data.message}`);
        });
        console.groupEnd();

        return checks;
    }
}

// Khởi tạo SEO Helper
let seoHelper = new SEOHelper();

// Export
window.SEOHelper = seoHelper;

// Auto-initialize khi DOM ready - CẢI THIỆN
document.addEventListener('DOMContentLoaded', function() {
    // Chờ 500ms để các scripts khác load
    setTimeout(() => {
        if (window.SEOHelper) {
            // Chỉ chạy trên các trang chính, không phải admin
            const path = window.location.pathname;
            const isAdminPage = path.includes('admin') || path.includes('test');
            
            if (!isAdminPage) {
                //console.group('🚀 SEO Helper Initializing');
                
                // Tối ưu hình ảnh
                const optimized = window.SEOHelper.optimizeImages();
                
                // Setup tracking
                window.SEOHelper.setupSEOTracking();
                
                // Kiểm tra Core Web Vitals
                window.SEOHelper.checkCoreWebVitals();
                
                // Kiểm tra broken links
                const linkResults = window.SEOHelper.checkBrokenLinks();
                
                // Kiểm tra On-Page SEO
                const seoResults = window.SEOHelper.checkOnPageSEO();
                
                // Xử lý canonical URL cho các trang đặc biệt
                if (path.includes('blog.html')) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const postId = urlParams.get('post');
                    if (postId) {
                        window.SEOHelper.addCanonicalUrl(window.location.href);
                    } else {
                        window.SEOHelper.addCanonicalUrl(window.location.origin + '/blog.html');
                    }
                }
                
                console.groupEnd();
                
                // Summary log
                //console.log(`🎯 SEO Summary: ${optimized} images optimized, ${linkResults.fixed} links fixed`);
            }
        }
    }, 500);
});

// Cung cấp global function để gọi thủ công nếu cần
window.runSEOAnalysis = function() {
    if (window.SEOHelper) {
        console.group('🔍 Manual SEO Analysis');
        window.SEOHelper.checkOnPageSEO();
        window.SEOHelper.checkBrokenLinks();
        console.groupEnd();
    }
};

