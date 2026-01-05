// blog.js - LuxuryMove Blog System với Firebase và URL riêng cho SEO

let blogData = { posts: {} };
let currentPostId = null;
let blogDatabase = null;



// ===== HÀM TẠO SLUG CHO URL =====
function createSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// ===== HÀM CẬP NHẬT URL TRÌNH DUYỆT =====
function updateBrowserURL(postId, postTitle) {
    if (!postId) return;
    
    const slug = createSlug(postTitle);
    const url = `blog.html?post=${postId}&title=${slug}`;
    window.history.pushState({ postId }, postTitle, url);
    
    // Cập nhật thẻ meta cho SEO
    updateMetaTagsForPost(postId);
}

// ===== CẬP NHẬT META TAGS CHO SEO =====
function updateMetaTagsForPost(postId) {
    const post = blogData.posts[postId];
    if (!post) return;
    
    // Meta title
    const titleTag = document.querySelector('title');
    if (titleTag) {
        titleTag.textContent = `${post.title} | LuxuryMove Blog`;
    }
    
    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = post.excerpt;
    
    // Open Graph tags
    updateOpenGraphTags(post);
}

// ===== CẬP NHẬT OPEN GRAPH TAGS =====
function updateOpenGraphTags(post) {
    // OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
    }
    ogTitle.content = post.title;
    
    // OG Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
    }
    ogDesc.content = post.excerpt;
    
    // OG Image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
    }
    ogImage.content = post.image;
    
    // OG URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
    }
    ogUrl.content = window.location.href;
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
}

// ===== XỬ LÝ URL KHI LOAD TRANG =====
function handleURLOnLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    
    if (postId && blogData.posts[postId]) {
        // Open post directly from URL
        openBlogPost(postId);
    } else if (postId) {
        // Post not loaded yet, wait and try again
        setTimeout(() => {
            if (blogData.posts[postId]) {
                openBlogPost(postId);
            }
        }, 1000);
    }
}

// ===== RESET META TAGS VỀ MẶC ĐỊNH =====
function resetMetaTagsToDefault() {
    const titleTag = document.querySelector('title');
    if (titleTag) {
        titleTag.textContent = 'LuxuryMove Blog - Tin tức & Kinh nghiệm du lịch';
    }
    
    // Reset description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = 'Chia sẻ kinh nghiệm du lịch, mẹo di chuyển và dịch vụ vận chuyển cao cấp tại LuxuryMove Blog';
    }
    
    // Reset canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
        canonical.href = window.location.origin + window.location.pathname;
    }
    
    // Reset URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

async function initBlog() {
    console.log("📚 Initializing LuxuryMove Blog with Firebase and SEO...");
    
    try {
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        blogDatabase = firebase.database();
        
        // Load blog data
        await loadBlogDataFromFirebase();
        
        // Setup event listeners (chỉ trên trang blog)
        const isBlogPage = document.getElementById('postsGrid') !== null;
        if (isBlogPage) {
            setupBlogEventListeners();
        }
        
        // Setup Firebase listeners
        setupFirebaseListeners();
        
        // Setup homepage blog listener (chỉ trên trang chủ)
        const isHomePage = document.getElementById('blogRow') !== null;
        if (isHomePage) {
            setupHomepageBlogListener();
        }
        
        // Handle URL on page load (chỉ trên trang blog)
        if (isBlogPage) {
            setTimeout(() => {
                handleURLOnLoad();
            }, 500);
            
            // Setup back button handling (chỉ trên trang blog)
            window.addEventListener('popstate', function(event) {
                if (event.state && event.state.postId) {
                    openBlogPost(event.state.postId);
                } else {
                    closeBlogModal();
                    resetMetaTagsToDefault();
                }
            });
        }
        
    } catch (error) {
        console.error("❌ Error initializing blog:", error);
        await loadBlogDataFromLocalStorage();
        
        const isBlogPage = document.getElementById('postsGrid') !== null;
        if (isBlogPage) {
            setupBlogEventListeners();
            handleURLOnLoad();
        }
    }
}

async function loadBlogDataFromFirebase() {
    try {
        console.log("🔍 Loading blog data from Firebase...");
        
        // KIỂM TRA NẾU ĐANG Ở TRANG BLOG HAY TRANG CHỦ
        const isBlogPage = document.getElementById('postsGrid') !== null;
        const isHomePage = document.getElementById('blogRow') !== null;
        
        if (isBlogPage) {
            // TRANG BLOG: hiển thị loading trong postsGrid
            const postsGrid = document.getElementById('postsGrid');
            postsGrid.innerHTML = `
                <div class="loading-posts" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--champagne); margin-bottom: 20px;"></i>
                    <p style="color: var(--text-secondary);">Đang tải bài viết từ Firebase...</p>
                </div>
            `;
        }
        
        // Fetch from Firebase
        const snapshot = await blogDatabase.ref('blog').once('value');
        const data = snapshot.val();
        
        if (data && data.posts) {
            blogData = data;
            console.log("✅ Loaded blog posts from Firebase:", Object.keys(data.posts).length);
            
            // Save to localStorage for offline use
            localStorage.setItem('luxurymove_blog', JSON.stringify(blogData));
            
            // RENDER TÙY THEO TRANG
            if (isBlogPage) {
                renderBlogPosts();
                updateCategoryCounts();
            }
            
            if (isHomePage && typeof window.renderHomepageBlog === 'function') {
                window.renderHomepageBlog();
            }
            
            // Add structured data for SEO
            addBlogStructuredData();
        } else {
            console.log("ℹ️ No blog data in Firebase, trying localStorage...");
            await loadBlogDataFromLocalStorage();
        }
        
    } catch (error) {
        console.error("❌ Error loading from Firebase:", error);
        await loadBlogDataFromLocalStorage();
    }
}

// ===== THÊM STRUCTURED DATA CHO SEO =====
function addBlogStructuredData() {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"][data-blog-schema]');
    if (existingScript) {
        existingScript.remove();
    }
    
    const posts = blogData.posts || {};
    const blogPosts = Object.values(posts);
    
    if (blogPosts.length === 0) return;
    
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "LuxuryMove Blog",
        "description": "Chia sẻ kinh nghiệm du lịch, mẹo di chuyển và dịch vụ vận chuyển cao cấp",
        "url": window.location.origin + window.location.pathname,
        "publisher": {
            "@type": "Organization",
            "name": "LuxuryMove",
            "logo": {
                "@type": "ImageObject",
                "url": window.location.origin + "/images/logo.png"
            }
        },
        "blogPost": blogPosts.map(post => ({
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.image,
            "datePublished": post.date,
            "dateModified": post.updated_at || post.date,
            "author": {
                "@type": "Person",
                "name": post.author
            },
            "publisher": {
                "@type": "Organization",
                "name": "LuxuryMove"
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `${window.location.origin}/blog.html?post=${post.id}&title=${createSlug(post.title)}`
            }
        })).slice(0, 10) // Limit to 10 latest posts for performance
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-blog-schema', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

// ===== LOAD BLOG DATA FROM LOCALSTORAGE =====
async function loadBlogDataFromLocalStorage() {
    try {
        console.log("📂 Loading blog from localStorage...");
        
        const localData = localStorage.getItem('luxurymove_blog');
        if (localData) {
            blogData = JSON.parse(localData);
            console.log("✅ Loaded blog from localStorage:", Object.keys(blogData.posts).length);
        } else {
            // Create sample posts
            blogData = { posts: getSamplePosts() };
            console.log("🎨 Created sample posts:", Object.keys(blogData.posts).length);
            
            // Save sample to localStorage
            localStorage.setItem('luxurymove_blog', JSON.stringify(blogData));
            
            // Try to save to Firebase too
            await saveBlogToFirebase();
        }
        
        renderBlogPosts();
        updateCategoryCounts();
        addBlogStructuredData();
        
    } catch (error) {
        console.error("❌ Error loading from localStorage:", error);
        // Last resort: create empty blog
        blogData = { posts: {} };
        renderBlogPosts();
    }
}

// ===== SAVE BLOG TO FIREBASE =====
async function saveBlogToFirebase() {
    try {
        if (!blogDatabase) return;
        
        await blogDatabase.ref('blog').set(blogData);
        console.log("✅ Blog saved to Firebase");
    } catch (error) {
        console.error("❌ Error saving blog to Firebase:", error);
    }
}

// ===== SETUP FIREBASE LISTENERS =====
function setupFirebaseListeners() {
    if (!blogDatabase) return;
    
    blogDatabase.ref('blog').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.posts) {
            console.log("🔄 Blog data updated from Firebase");
            blogData = data;
            
            // Update localStorage
            localStorage.setItem('luxurymove_blog', JSON.stringify(blogData));
            
            // Update UI
            renderBlogPosts();
            updateCategoryCounts();
            addBlogStructuredData();
        }
    });
}

// ===== SAMPLE POSTS =====
function getSamplePosts() {
    return {
        'post1': {
            id: 'post1',
            title: 'Kinh Nghiệm Du Lịch Nha Trang 2024',
            author: 'LuxuryMove Team',
            date: '2024-12-15',
            category: 'travel',
            image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200',
            excerpt: 'Khám phá những điểm đến hấp dẫn, ẩm thực đặc sắc và dịch vụ di chuyển cao cấp tại Nha Trang. Bí quyết du lịch Nha Trang tiết kiệm mà vẫn sang trọng.',
            content: `
                <h1>Kinh Nghiệm Du Lịch Nha Trang 2024</h1>
                <p>Nha Trang - thành phố biển xinh đẹp với những bãi cát trắng trải dài, làn nước trong xanh và nền ẩm thực phong phú.</p>
                
                <h2>Điểm Đến Nổi Bật Nha Trang</h2>
                <p>Khám phá những địa điểm không thể bỏ qua khi du lịch Nha Trang:</p>
                
                <div class="features-section">
                    <h3>Bãi Biển Đẹp Nhất</h3>
                    <div class="feature-item">
                        <i class="fas fa-umbrella-beach"></i>
                        <span>Bãi Dài - Thiên đường nghỉ dưỡng</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-water"></i>
                        <span>Vinpearl Land - Vui chơi giải trí</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-mountain"></i>
                        <span>Hòn Tằm - Khám phá thiên nhiên</span>
                    </div>
                </div>
                
                <h3>Dịch Vụ Di Chuyển Cao Cấp LuxuryMove</h3>
                <p>LuxuryMove cung cấp dịch vụ đưa đón tận nơi với đội xe sang trọng, tài xế chuyên nghiệp phục vụ du khách tại Nha Trang.</p>
                
                <div class="pricing-section">
                    <h3>Bảng Giá Dịch Vụ Tham Khảo</h3>
                    <div class="price-item">
                        <i class="fas fa-car"></i>
                        <span>Đưa đón sân bay Cam Ranh: <strong>450,000 VND</strong></span>
                    </div>
                    <div class="price-item">
                        <i class="fas fa-road"></i>
                        <span>Tour Nha Trang 1 ngày: <strong>1,200,000 VND</strong></span>
                    </div>
                </div>
                
                <h3>Lời Khuyên Từ Chuyên Gia Du Lịch</h3>
                <ul>
                    <li>Nên đặt dịch vụ di chuyển trước ít nhất 24h</li>
                    <li>Mang theo đồ chống nắng khi đi biển</li>
                    <li>Thử hải sản tươi sống tại chợ Đầm</li>
                    <li>Tham quan các đảo vào sáng sớm để tránh đông</li>
                </ul>
            `,
            tags: ['nha trang', 'du lịch', 'biển', 'kinh nghiệm', 'khánh hòa', 'vinpearl'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        'post2': {
            id: 'post2',
            title: 'Top 5 Dịch Vụ Xe Cao Cấp Tại Miền Trung 2024',
            author: 'Admin',
            date: '2024-12-10',
            category: 'service',
            image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200',
            excerpt: 'Khám phá những dịch vụ di chuyển cao cấp nhất tại khu vực miền Trung - Tây Nguyên. Đánh giá chi tiết các gói dịch vụ xe sang LuxuryMove.',
            content: `
                <h1>Top 5 Dịch Vụ Xe Cao Cấp Tại Miền Trung 2024</h1>
                <p>Với đội ngũ tài xế chuyên nghiệp và xe đời mới, LuxuryMove mang đến trải nghiệm di chuyển đẳng cấp tại khu vực miền Trung - Tây Nguyên.</p>
                
                <h2>5 Dịch Vụ Nổi Bật Nhất</h2>
                <div class="service-list">
                    <div class="service-item">
                        <h3>1. Đưa Đón Sân Bay VIP</h3>
                        <p>Tài xế mặc vest, xe sang trọng Mercedes S-Class, hỗ trợ hành lý tận tay, nước uống cao cấp trên xe.</p>
                    </div>
                    <div class="service-item">
                        <h3>2. Tour Du Lịch Trọn Gói</h3>
                        <p>Thiết kế lịch trình riêng, xe 4-16 chỗ đời mới, hướng dẫn viên nhiệt tình, bảo hiểm du lịch đầy đủ.</p>
                    </div>
                    <div class="service-item">
                        <h3>3. Xe Cưới Cao Cấp</h3>
                        <p>Mercedes, BMW đội hình xe hoa tươi, trang trí lộng lẫy, tài xế kinh nghiệm trong dịch vụ cưới hỏi.</p>
                    </div>
                </div>
                
                <div class="cta-section">
                    <h3>Đặt Xe Ngay Hôm Nay</h3>
                    <p><strong>📞 Hotline: 0931.243.679</strong></p>
                    <p>Phục vụ 24/7 - Đúng giờ 100% - Xe đời mới - Tài xế chuyên nghiệp</p>
                </div>
            `,
            tags: ['dịch vụ', 'xe cao cấp', 'luxury', 'miền trung', 'đặt xe', 'mercedes'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    };
}

function renderBlogPosts(category = 'all') {
    const postsGrid = document.getElementById('postsGrid');
    if (!postsGrid) {
        // KHÔNG hiển thị lỗi nếu không ở trang blog
        console.log("ℹ️ Not on blog page, skipping posts grid rendering");
        return;
    }
    
    const posts = blogData.posts || {};
    
    if (Object.keys(posts).length === 0) {
        postsGrid.innerHTML = `
            <div class="no-posts" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-newspaper" style="font-size: 48px; margin-bottom: 20px; color: var(--text-tertiary);"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 10px;">Chưa có bài viết nào</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Hãy đăng bài viết đầu tiên từ Admin Panel!</p>
                <a href="admin.html" target="_blank" class="btn btn-secondary" style="padding: 10px 20px;">
                    <i class="fas fa-pen"></i> Đăng bài viết
                </a>
            </div>
        `;
        return;
    }
    
    // ... phần còn lại giữ nguyên
}

// ===== GET CATEGORY NAME =====
function getCategoryName(category) {
    const categories = {
        'travel': 'Du lịch',
        'tips': 'Mẹo hay',
        'news': 'Tin tức',
        'review': 'Đánh giá',
        'service': 'Dịch vụ'
    };
    return categories[category] || 'Khác';
}

// ===== UPDATE CATEGORY COUNTS =====
function updateCategoryCounts() {
    const posts = blogData.posts || {};
    const counts = {
        all: Object.keys(posts).length,
        travel: 0,
        tips: 0,
        news: 0,
        review: 0,
        service: 0
    };
    
    Object.values(posts).forEach(post => {
        if (post.category && counts[post.category] !== undefined) {
            counts[post.category]++;
        }
    });
    
    // Update button texts
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn) {
            const category = btn.dataset.category;
            const count = counts[category];
            if (count > 0) {
                btn.textContent = `${getCategoryName(category)} (${count})`;
                btn.title = `Xem ${count} bài viết về ${getCategoryName(category)}`;
            } else {
                btn.textContent = getCategoryName(category);
            }
        }
    });
}

// ===== OPEN BLOG POST =====
function openBlogPost(postId) {
    const post = blogData.posts[postId];
    if (!post) {
        console.error("Post not found:", postId);
        return;
    }
    
    currentPostId = postId;
    
    // Update browser URL for SEO
    updateBrowserURL(postId, post.title);
    
    const date = new Date(post.date).toLocaleDateString('vi-VN');
    
    // Get modal elements
    const modalCategory = document.getElementById('modalCategory');
    const modalDate = document.getElementById('modalDate');
    const modalTitle = document.getElementById('modalTitle');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalContent = document.getElementById('modalContent');
    const blogModal = document.getElementById('blogModal');
    
    if (!modalCategory || !modalDate || !modalTitle || !modalAuthor || !modalContent || !blogModal) {
        console.error("❌ Modal elements not found");
        return;
    }
    
    modalCategory.textContent = getCategoryName(post.category);
    modalDate.textContent = date;
    modalTitle.textContent = post.title;
    modalAuthor.innerHTML = `<i class="fas fa-user"></i> ${post.author}`;
    
    // Set content with structured data
    modalContent.innerHTML = `
        <article class="blog-content" itemscope itemtype="https://schema.org/BlogPosting">
            <meta itemprop="datePublished" content="${post.date}">
            <meta itemprop="dateModified" content="${post.updated_at || post.date}">
            <meta itemprop="author" content="${post.author}">
            <meta itemprop="publisher" content="LuxuryMove">
            
            <div class="featured-image" itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
                <img src="${post.image}" alt="${post.title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 25px;" itemprop="url">
            </div>
            
            <div itemprop="articleBody">
                ${post.content || `<p>${post.excerpt}</p>`}
            </div>
            
            ${post.tags ? `
                <div class="post-tags-footer" itemprop="keywords" style="margin-top: 30px;">
                    <strong>Tags:</strong>
                    ${post.tags.map(tag => `
                        <span class="post-tag">${tag}</span>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="post-actions" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(212, 175, 55, 0.2);">
                <p style="color: var(--text-tertiary); font-size: 14px;">
                    <i class="fas fa-info-circle"></i> Bài viết được quản lý bởi LuxuryMove Admin Panel
                </p>
                <div class="share-buttons" style="margin-top: 15px;">
                    <button class="btn btn-secondary" onclick="shareBlogPost()" style="margin-right: 10px;">
                        <i class="fas fa-share-alt"></i> Chia sẻ
                    </button>
                    <button class="btn btn-secondary" onclick="printBlogPost()">
                        <i class="fas fa-print"></i> In bài
                    </button>
                </div>
            </div>
        </article>
    `;
    
    // Show modal
    blogModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Scroll to top of modal
    blogModal.scrollTop = 0;
    
    // Update breadcrumb
    updateBreadcrumb(post.title);
}

// ===== UPDATE BREADCRUMB =====
function updateBreadcrumb(postTitle) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <a href="blog.html">Blog</a> 
            <i class="fas fa-chevron-right"></i> 
            <span>${postTitle}</span>
        `;
    }
}

// ===== SHARE BLOG POST =====
function shareBlogPost() {
    const post = blogData.posts[currentPostId];
    if (!post) return;
    
    const url = window.location.href;
    const text = `${post.title} - LuxuryMove Blog`;
    
    if (navigator.share) {
        navigator.share({
            title: post.title,
            text: post.excerpt,
            url: url
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
            alert('Đã sao chép link bài viết vào clipboard!');
        });
    }
}

// ===== PRINT BLOG POST =====
function printBlogPost() {
    const printContent = document.querySelector('.blog-modal-content').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${document.title}</title>
            <link rel="stylesheet" href="css/style.css">
            <style>
                @media print {
                    body { font-size: 12pt; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="print-content">
                ${printContent}
            </div>
        </body>
        </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
}

// ===== CLOSE BLOG MODAL =====
function closeBlogModal() {
    const blogModal = document.getElementById('blogModal');
    if (blogModal) {
        blogModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset URL and meta tags
        resetMetaTagsToDefault();
    }
}

// ===== BOOK SERVICE FROM BLOG =====
function bookFromBlog() {
    const post = blogData.posts[currentPostId];
    if (!post) return;
    
    closeBlogModal();
    
    // Save post info for booking form
    localStorage.setItem('luxurymove_booking_from_post', post.title);
    
    // Redirect to booking form in main page
    window.location.href = 'index.html#booking';
}

// ===== CALL FROM BLOG =====
function callFromBlog() {
    window.location.href = 'tel:0931243679';
}

// ===== SETUP EVENT LISTENERS =====
function setupBlogEventListeners() {
    console.log("🔧 Setting up blog event listeners...");
    
    // Category filter
    const categoryButtons = document.querySelectorAll('.category-btn');
    if (categoryButtons.length === 0) {
        console.warn("⚠️ No category buttons found");
    } else {
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                categoryButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                // Render posts for selected category
                renderBlogPosts(this.dataset.category);
                
                // Update URL for category view
                if (this.dataset.category !== 'all') {
                    window.history.pushState({}, '', `blog.html?category=${this.dataset.category}`);
                } else {
                    window.history.pushState({}, '', 'blog.html');
                }
            });
        });
    }
    
    // Close modal button
    const closeModalBtn = document.getElementById('closeBlogModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeBlogModal);
    }
    
    // Close modal on overlay click
    const blogModal = document.getElementById('blogModal');
    if (blogModal) {
        blogModal.addEventListener('click', function(e) {
            if (e.target === this) closeBlogModal();
        });
    }
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        const blogModal = document.getElementById('blogModal');
        if (e.key === 'Escape' && blogModal && blogModal.style.display === 'flex') {
            closeBlogModal();
        }
    });
    
    // Handle clicks on post links (for direct URL access)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.post-link')) {
            e.preventDefault();
            const url = e.target.closest('.post-link').getAttribute('href');
            const postId = new URLSearchParams(url.split('?')[1]).get('post');
            if (postId) {
                openBlogPost(postId);
            }
        }
    });
    
    console.log("✅ Blog event listeners setup complete");
}

// ===== REFRESH BLOG DATA =====
async function refreshBlogData() {
    console.log("🔄 Refreshing blog data...");
    await loadBlogDataFromFirebase();
}
// ===== HÀM HIỂN THỊ BLOG TRANG CHỦ =====
function renderHomepageBlog() {
    const blogRow = document.getElementById('blogRow');
    if (!blogRow) return;
    
    const posts = blogData.posts || {};
    
    if (Object.keys(posts).length === 0) {
        blogRow.innerHTML = '<div class="empty-blog">Chưa có bài viết nào</div>';
        return;
    }
    
    const latestPosts = Object.entries(posts)
        .sort((a, b) => new Date(b[1].date || 0) - new Date(a[1].date || 0))
        .slice(0, 6);
    
    if (latestPosts.length === 0) return;
    
    let html = '';
    latestPosts.forEach(([id, post]) => {
        const date = new Date(post.date || new Date()).toLocaleDateString('vi-VN');
        const categoryName = getCategoryName(post.category);
        const tags = post.tags || [];
        
        html += `
            <div class="blog-horizontal-card" onclick="window.openBlogPost('${id}')">
                <div class="blog-card-image">
                    <img src="${post.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800'}" 
                         alt="${post.title}" 
                         loading="lazy">
                    <span class="blog-card-category">${categoryName}</span>
                </div>
                <div class="blog-card-content">
                    <div class="blog-card-meta">
                        <span class="blog-card-author">
                            <i class="fas fa-user"></i> ${post.author || 'Admin'}
                        </span>
                        <span class="blog-card-date">
                            <i class="far fa-calendar"></i> ${date}
                        </span>
                    </div>
                    <h3 class="blog-card-title">${post.title || 'Bài viết mới'}</h3>
                    <p class="blog-card-excerpt">${post.excerpt || 'Đang cập nhật nội dung...'}</p>
                    
                    ${tags.length > 0 ? `
                        <div class="blog-card-tags">
                            ${tags.slice(0, 2).map(tag => `<span class="blog-card-tag">#${tag}</span>`).join('')}
                            ${tags.length > 2 ? `<span class="blog-card-tag">+${tags.length - 2}</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <a href="#" class="blog-read-more" onclick="window.openBlogPost('${id}'); event.stopPropagation(); return false;">
                        Đọc tiếp <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    });
    
    blogRow.innerHTML = html;
}

// ===== HÀM CẬP NHẬT BLOG TRANG CHỦ KHI CÓ THAY ĐỔI =====
function setupHomepageBlogListener() {
    if (!blogDatabase) return;
    
    blogDatabase.ref('blog/posts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            blogData.posts = data;
            localStorage.setItem('HTUTransport_blog', JSON.stringify({ posts: data }));
            
            // Render lại blog trên trang chủ nếu đang ở trang chủ
            if (document.getElementById('blogRow')) {
                renderHomepageBlog();
            }
            
            // Cập nhật dữ liệu trong blog.js
            if (typeof renderBlogPosts === 'function') {
                renderBlogPosts();
                updateCategoryCounts();
            }
        }
    });
}

// ===== LẤY BÀI VIẾT MẪU CHO TRANG CHỦ =====
function getSampleBlogPostsForHomepage() {
    return {
        'post1': {
            title: 'Kinh Nghiệm Du Lịch Nha Trang 2024',
            author: 'HTUTransport Team',
            date: '2024-12-15',
            category: 'travel',
            image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800',
            excerpt: 'Khám phá những điểm đến hấp dẫn tại Nha Trang',
            content: `<h2>Giới Thiệu Về Nha Trang</h2><p>Nha Trang - thành phố biển xinh đẹp...</p>`,
            tags: ['nha trang', 'du lịch', 'biển', 'kinh nghiệm']
        }
    };
}

// ===== INITIALIZE WHEN PAGE LOADS =====
document.addEventListener('DOMContentLoaded', initBlog);

if (typeof window !== 'undefined') {
    window.refreshBlogData = refreshBlogData;
    window.openBlogPost = openBlogPost;
    window.closeBlogModal = closeBlogModal;
    window.bookFromBlog = bookFromBlog;
    window.callFromBlog = callFromBlog;
    window.shareBlogPost = shareBlogPost;
    window.printBlogPost = printBlogPost;
    
    // Export hàm cho trang chủ
    window.renderHomepageBlog = renderHomepageBlog;
    window.getCategoryName = getCategoryName;
    window.setupHomepageBlogListener = setupHomepageBlogListener;
    window.getServicesData = function() {
        if (window.serviceManager && window.serviceManager.servicesData) {
            return window.serviceManager.servicesData;
        }
        return { services: {} };
    };
}