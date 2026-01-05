// js/script.js - Version 3.0 (Gọn gàng, tập trung vào chức năng chính)
const firebaseConfig = {
    apiKey: "AIzaSyCeYPoizbE-Op79186r7pmndGpJ-JfESAk",
    authDomain: "hoangtung-af982.firebaseapp.com",
    databaseURL: "https://hoangtung-af982-default-rtdb.firebaseio.com",
    projectId: "hoangtung-af982",
    storageBucket: "hoangtung-af982.firebasestorage.app",
    messagingSenderId: "232719624914",
    appId: "1:232719624914:web:cac7ce833ae105d9255b0b",
    measurementId: "G-FWHFP1W032"
};

// Biến toàn cục
let servicesData = { services: {} };
let experiencesData = { experiences: {} };
let homepageBlogData = { posts: {} };
let database = null;

class HTUTransportApp {
    constructor() {
        this.init();
    }
    
    async init() {
        if (this.isSinglePostPage()) return;
        
        console.log("🚀 HTUTransport Website Initializing...");
        
        await this.initializeFirebase();
        await this.loadAllData();
        this.setupUI();
        this.setupEventListeners();
        
        console.log("✅ Website initialized successfully");
    }
    
    isSinglePostPage() {
        return window.location.pathname.includes('post-');
    }
    
    async initializeFirebase() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
    }
    
    async loadAllData() {
        try {
            const [services, experiences, blog] = await Promise.allSettled([
                this.fetchFromFirebase('services'),
                this.fetchFromFirebase('experiences'),
                this.fetchBlogFromFirebase()
            ]);
            
            // Xử lý services
            servicesData = services.value || 
                          JSON.parse(localStorage.getItem('HTUTransport_services')) || 
                          { services: {} };
            
            // Xử lý experiences
            experiencesData = experiences.value || 
                             JSON.parse(localStorage.getItem('HTUTransport_experiences')) || 
                             { experiences: this.getDefaultExperiences() };
            
            // Xử lý blog
            homepageBlogData = blog.value || 
                              JSON.parse(localStorage.getItem('HTUTransport_blog')) || 
                              { posts: this.getSampleBlogPosts() };
            
            this.integrateWithBookingSystem();
            
        } catch (error) {
            console.error("❌ Error loading data:", error);
            this.loadFromLocalStorage();
        }
    }
    
    async fetchFromFirebase(path) {
        if (!database) return this.loadFromLocalStorage(path);
        
        try {
            const snapshot = await database.ref(path).once('value');
            const data = snapshot.val();
            if (data) {
                localStorage.setItem(`HTUTransport_${path}`, JSON.stringify(data));
            }
            return data;
        } catch (error) {
            console.error(`Firebase fetch error (${path}):`, error.message);
            return this.loadFromLocalStorage(path);
        }
    }
    
    async fetchBlogFromFirebase() {
        if (!database) return null;
        
        try {
            const snapshot = await database.ref('blog').once('value');
            const data = snapshot.val();
            
            if (data && data.posts) {
                localStorage.setItem('HTUTransport_blog', JSON.stringify(data));
                return data;
            }
            return null;
        } catch (error) {
            console.error("❌ Error fetching blog:", error);
            return null;
        }
    }
    
    loadFromLocalStorage(path) {
        try {
            const data = localStorage.getItem(`HTUTransport_${path}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`LocalStorage load error (${path}):`, error);
            return null;
        }
    }
    
    integrateWithBookingSystem() {
        // Chia sẻ dữ liệu services với booking system
        if (servicesData.services && window.bookingSystem?.addService) {
            Object.values(servicesData.services).forEach(service => {
                if (service.title) {
                    window.bookingSystem.addService(service.title, 'fas fa-car');
                }
            });
        }
    }
    
    setupUI() {
        this.renderServices();
        this.renderExperiences();
    
        this.setupHorizontalScroll();
    }
    
    renderServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;
        
        const services = servicesData.services || {};
        
        if (Object.keys(services).length === 0) {
            servicesGrid.innerHTML = '';
            return;
        }
        
        servicesGrid.innerHTML = '';
        
        Object.entries(services).forEach(([id, item]) => {
            const imageUrl = item.images && item.images.length > 0 
                ? item.images[0] 
                : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=500';
            
            const features = item.features || [];
            const displayFeatures = features.slice(0, 3);
            
            const card = document.createElement('div');
            card.className = 'service-card';
            card.setAttribute('data-service', id);
            
            card.innerHTML = `
                <div class="service-image">
                    <img src="${imageUrl}" alt="${item.title}" loading="lazy">
                </div>
                <h3 class="service-name">${item.title || 'Dịch vụ'}</h3>
                <div class="service-experience">
                    ${displayFeatures.length > 0 
                        ? displayFeatures.map(feature => `
                            <div class="experience-item">
                                <i class="fas fa-check"></i> <span>${feature}</span>
                            </div>
                        `).join('')
                        : `
                            <div class="experience-item"><i class="fas fa-check"></i> <span>Chất lượng cao cấp</span></div>
                            <div class="experience-item"><i class="fas fa-check"></i> <span>Đúng giờ 100%</span></div>
                            <div class="experience-item"><i class="fas fa-check"></i> <span>Tài xế chuyên nghiệp</span></div>
                        `
                    }
                </div>
                <button class="btn-view-details" onclick="htuApp.showServiceDetail('${id}')">
                    Xem chi tiết
                </button>
            `;
            
            servicesGrid.appendChild(card);
        });
    }
    
    renderExperiences() {
        const experienceRow = document.querySelector('.user-experience-row');
        if (!experienceRow || !experiencesData.experiences) return;
        
        experienceRow.innerHTML = '';
        
        Object.entries(experiencesData.experiences).forEach(([id, experience]) => {
            const card = document.createElement('div');
            card.className = 'experience-card';
            
            card.innerHTML = `
                <div class="exp-header-top">
                    <div class="exp-img-box">
                        <img src="${experience.image}" alt="${experience.title}" loading="lazy">
                    </div>
                    <h3 class="exp-title">${experience.title}</h3>
                </div>
                <div class="exp-benefits">
                    ${(experience.benefits || []).map(benefit => `
                        <div class="benefit-item">
                            <i class="fas fa-check"></i>
                            <span>${benefit}</span>
                        </div>
                    `).join('')}
                </div>
                <p class="exp-desc">${experience.description || ''}</p>
                
                <div class="exp-book-section">
                    <button class="exp-book-btn" onclick="htuApp.quickBookExperience('${experience.title}')">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Đặt ngay ${experience.title}</span>
                    </button>
                    <button class="exp-info-btn" onclick="htuApp.showExperienceInfo('${id}')">
                        <i class="fas fa-info-circle"></i>
                        <span>Chi tiết</span>
                    </button>
                </div>
            `;
            
            experienceRow.appendChild(card);
        });
    }
    
    
    setupHorizontalScroll() {
        const containers = [
            '.user-experience-row',
            '.blog-horizontal-row'
        ];
        
        containers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) {
                container.style.cssText = `
                    display: flex;
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    ms-overflow-style: none;
                `;
                
                container.querySelectorAll(':scope > *').forEach(item => {
                    item.style.flex = '0 0 auto';
                });
            }
        });
    }
    
    setupEventListeners() {
        this.setupModalEvents();
        this.setupMobileTouch();
    }
    
    setupModalEvents() {
        const modal = document.getElementById('serviceDetails');
        const closeBtn = document.getElementById('closeDetails');
        
        if (modal && closeBtn) {
            closeBtn.addEventListener('click', () => this.closeServiceModal());
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeServiceModal();
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.style.display === 'flex') {
                    this.closeServiceModal();
                }
            });
        }
    }
    
    closeServiceModal() {
        const modal = document.getElementById('serviceDetails');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    setupMobileTouch() {
        if (window.innerWidth <= 767) {
            document.querySelectorAll('.experience-card').forEach(card => {
                let touchTimer;
                
                card.addEventListener('touchstart', function() {
                    touchTimer = setTimeout(() => {
                        const desc = this.querySelector('.exp-desc');
                        if (desc) desc.style.display = 'block';
                    }, 500);
                });
                
                card.addEventListener('touchend', function() {
                    clearTimeout(touchTimer);
                    const desc = this.querySelector('.exp-desc');
                    if (desc && desc.style.display === 'block') {
                        setTimeout(() => desc.style.display = 'none', 2000);
                    }
                });
                
                card.addEventListener('touchmove', () => clearTimeout(touchTimer));
            });
        }
    }
    
    
    // ========== PUBLIC METHODS ==========
    
    showServiceDetail(serviceId) {
        const service = servicesData.services[serviceId];
        if (!service) return;
        
        const modal = document.getElementById('serviceDetails');
        if (!modal) return;
        
        // Cập nhật tiêu đề
        const detailTitle = document.getElementById('detailTitle');
        const detailSubtitle = document.getElementById('detailSubtitle');
        
        if (detailTitle) detailTitle.textContent = service.title || 'Dịch vụ';
        if (detailSubtitle) detailSubtitle.textContent = service.subtitle || service.title || 'Dịch vụ cao cấp';
        
        // Tạo nội dung
        const detailContent = document.getElementById('detailContent');
        if (!detailContent) return;
        
        let contentHTML = `<div class="details-images">`;
        
        // Hình ảnh
        if (service.images && service.images.length > 0) {
            contentHTML += `
                <div class="detail-image-main">
                    <img src="${service.images[0]}" alt="${service.title}" loading="lazy">
                </div>
            `;
            
            if (service.images.length > 1) {
                contentHTML += `<div class="detail-image-thumbs">`;
                service.images.slice(1, 4).forEach((img, index) => {
                    contentHTML += `
                        <div class="detail-thumb" onclick="changeDetailImage(this, '${img}')">
                            <img src="${img}" alt="${service.title} ${index + 2}" loading="lazy">
                        </div>
                    `;
                });
                contentHTML += `</div>`;
            }
        } else {
            contentHTML += `
                <div class="detail-image-main">
                    <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800" alt="${service.title}" loading="lazy">
                </div>
            `;
        }
        
        contentHTML += `
            </div>
            
            <div class="details-info">
                <h4>Mô tả dịch vụ</h4>
                <p class="detail-description">${service.description || 'Đang cập nhật thông tin chi tiết...'}</p>
                
                <h4>Tính năng nổi bật</h4>
                <div class="detail-features">
        `;
        
        // Tính năng
        if (service.features && service.features.length > 0) {
            service.features.forEach(feature => {
                contentHTML += `
                    <div class="detail-feature-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${feature}</span>
                    </div>
                `;
            });
        } else {
            contentHTML += `
                <div class="detail-feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Chất lượng cao cấp</span>
                </div>
                <div class="detail-feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Đúng giờ 100%</span>
                </div>
                <div class="detail-feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Tài xế chuyên nghiệp</span>
                </div>
            `;
        }
        
        contentHTML += `
                </div>
                
                <h4>Bảng giá tham khảo</h4>
                <div class="detail-pricing">
        `;
        
        // Bảng giá
        if (service.pricing && service.pricing.length > 0) {
            service.pricing.forEach(price => {
                contentHTML += `
                    <div class="detail-price-item">
                        <span class="price-label">${price.label || 'Dịch vụ'}</span>
                        <span class="price-value">${price.price || 'Liên hệ'}</span>
                    </div>
                `;
            });
        } else {
            contentHTML += `
                <div class="detail-price-item">
                    <span class="price-label">Liên hệ để có giá tốt nhất</span>
                    <span class="price-value">0567.033.888</span>
                </div>
            `;
        }
        
        contentHTML += `
                </div>
                
                <div class="detail-actions">
                    <button class="btn-book-now" onclick="htuApp.bookServiceFromDetail('${serviceId}')">
                        <i class="fas fa-calendar-alt"></i> Đặt dịch vụ ngay
                    </button>
                    <button class="btn-call-now" onclick="window.location.href='tel:0567033888'">
                        <i class="fas fa-phone-alt"></i> Gọi ngay: 0567.033.888
                    </button>
                </div>
            </div>
        `;
        
        detailContent.innerHTML = contentHTML;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    bookServiceFromDetail(serviceId) {
        const service = servicesData.services[serviceId];
        if (!service || !service.title) return;
        
        // Sử dụng booking system
        if (window.bookingSystem?.bookService) {
            window.bookingSystem.bookService(service.title);
        } else if (window.completeBookingSystem?.bookService) {
            window.completeBookingSystem.bookService(service.title);
        }
        
        this.closeServiceModal();
    }
    
    quickBookExperience(experienceTitle) {
        // Sử dụng booking system
        if (window.bookingSystem?.bookService) {
            window.bookingSystem.bookService(experienceTitle);
        } else if (window.completeBookingSystem?.bookService) {
            window.completeBookingSystem.bookService(experienceTitle);
        } else {
            // Fallback
            this.showQuickBookToast(experienceTitle);
            sessionStorage.setItem('selectedService', JSON.stringify({
                title: experienceTitle,
                type: 'experience',
                timestamp: Date.now()
            }));
        }
    }
    
    showQuickBookToast(experienceTitle) {
        if (!document.getElementById('quickBookToast')) {
            const toastHTML = `
                <div id="quickBookToast" class="quick-book-toast">
                    <i class="fas fa-calendar-check"></i>
                    <span class="toast-text">Đã chọn: <strong>${experienceTitle}</strong></span>
                    <button class="toast-close" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', toastHTML);
            
            setTimeout(() => {
                const toast = document.getElementById('quickBookToast');
                if (toast) toast.remove();
            }, 3000);
        }
    }
    
    showExperienceInfo(experienceId) {
        const experience = experiencesData.experiences[experienceId];
        if (!experience) return;
        
        const modalHTML = `
            <div class="experience-modal-overlay" id="experienceModal${experienceId}">
                <div class="experience-modal-container">
                    <div class="experience-modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-star"></i>
                            ${experience.title}
                        </h3>
                        <button class="modal-close-btn" onclick="document.getElementById('experienceModal${experienceId}').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="experience-modal-content">
                        <div class="modal-image">
                            <img src="${experience.image}" alt="${experience.title}" loading="lazy">
                        </div>
                        
                        <div class="modal-benefits">
                            <h4><i class="fas fa-check-circle"></i> Lợi ích</h4>
                            <ul>
                                ${(experience.benefits || []).map(benefit => `
                                    <li><i class="fas fa-check"></i> ${benefit}</li>
                                `).join('')}
                            </ul>
                        </div>
                        
                        <div class="modal-description">
                            <h4><i class="fas fa-info-circle"></i> Mô tả</h4>
                            <p>${experience.description || 'Chưa có mô tả chi tiết.'}</p>
                        </div>
                        
                        <div class="modal-actions">
                            <button class="modal-book-btn" onclick="htuApp.quickBookExperience('${experience.title}')">
                                <i class="fas fa-calendar-alt"></i>
                                Đặt ngay ${experience.title}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
   
    
    getDefaultExperiences() {
        return {
            'family': {
                title: 'Cho Gia Đình',
                image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=500',
                description: 'Hành trình ấm cúng, an tâm cho gia đình bạn',
                benefits: [
                    'An toàn tuyệt đối cho người thân',
                    'Tiện nghi cho trẻ em & người lớn tuổi',
                    'Không gian riêng tư, thoải mái'
                ]
            },
            'friends': {
                title: 'Cho Bạn Bè',
                image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=500',
                description: 'Chuyến đi vui vẻ cùng những người bạn thân',
                benefits: [
                    'Thoải mái trò chuyện, tạo kỷ niệm',
                    'Điểm dừng linh hoạt theo nhóm',
                    'Chi phí chia sẻ hợp lý'
                ]
            }
        };
    }
    
}

// Helper functions
function changeDetailImage(thumbElement, imageUrl) {
    const mainImage = document.querySelector('.detail-image-main img');
    if (mainImage) {
        mainImage.src = imageUrl;
    }
    
    document.querySelectorAll('.detail-thumb').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbElement.classList.add('active');
}

// Khởi tạo ứng dụng
const htuApp = new HTUTransportApp();
window.htuApp = htuApp;

console.log('✅ HTUTransport App loaded');