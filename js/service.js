// js/service.js - Quản lý dịch vụ LuxuryMove
// Firebase config (dùng chung)
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
let serviceDatabase = null;

// ===== LỚP QUẢN LÝ DỊCH VỤ =====
class ServiceManager {
    constructor() {
        this.init();
    }
    
    async init() {
        console.log("🛠️ Service Manager Initializing...");
        
        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            serviceDatabase = firebase.database();
            
            // Load service data
            await this.loadServices();
            
            // Setup Firebase listener
            this.setupServiceListener();
            
            console.log("✅ Service Manager initialized successfully");
        } catch (error) {
            console.error("❌ Error initializing Service Manager:", error);
            this.loadServicesFromLocalStorage();
        }
    }
    
    // ===== LOAD DỮ LIỆU DỊCH VỤ =====
    async loadServices() {
        try {
            console.log("🔍 Loading services from Firebase...");
            
            const snapshot = await serviceDatabase.ref('services').once('value');
            const data = snapshot.val();
            
            if (data && data.services) {
                servicesData = data;
                localStorage.setItem('HTUTransport_services', JSON.stringify(servicesData));
                console.log("✅ Loaded services from Firebase:", Object.keys(data.services).length);
                
                // Render services nếu đang ở trang chủ
                if (document.getElementById('servicesGrid')) {
                    this.renderServices();
                }
                
                // Nếu đang ở trang chi tiết dịch vụ, render chi tiết
                if (this.isServiceDetailPage()) {
                    this.renderServiceDetailPage();
                }
                
                // Integrate với booking system
                this.integrateWithBookingSystem();
            } else {
                console.log("ℹ️ No service data in Firebase, trying localStorage...");
                this.loadServicesFromLocalStorage();
            }
            
        } catch (error) {
            console.error("❌ Error loading services:", error);
            this.loadServicesFromLocalStorage();
        }
    }
    
    loadServicesFromLocalStorage() {
        try {
            const data = localStorage.getItem('HTUTransport_services');
            if (data) {
                servicesData = JSON.parse(data);
                console.log("📂 Loaded services from localStorage:", Object.keys(servicesData.services).length);
                
                if (document.getElementById('servicesGrid')) {
                    this.renderServices();
                }
                
                // Nếu đang ở trang chi tiết dịch vụ, render chi tiết
                if (this.isServiceDetailPage()) {
                    this.renderServiceDetailPage();
                }
                
                this.integrateWithBookingSystem();
            } else {
                console.log("🎨 No service data available");
                if (document.getElementById('servicesGrid')) {
                    document.getElementById('servicesGrid').innerHTML = '';
                }
            }
        } catch (error) {
            console.error("❌ Error loading from localStorage:", error);
        }
    }
    
    // ===== KIỂM TRA CÓ PHẢI TRANG CHI TIẾT DỊCH VỤ =====
    isServiceDetailPage() {
        const path = window.location.pathname;
        return path.includes('/service/') || path.includes('service.html');
    }
    
    // ===== LẤY ID DỊCH VỤ TỪ URL =====
    getServiceIdFromUrl() {
        // Lấy từ URL theo cấu trúc: /service/airport hoặc /service/airport.html
        const path = window.location.pathname;
        const match = path.match(/\/([^\/.]+)(?:\.html)?$/);
        
        if (match && match[1] && match[1] !== 'service') {
            return match[1];
        }
        
        // Hoặc từ query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const serviceId = urlParams.get('id');
        
        return serviceId;
    }
    
    // ===== SETUP FIREBASE LISTENER =====
    setupServiceListener() {
        if (!serviceDatabase) return;
        
        serviceDatabase.ref('services').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.services) {
                console.log("🔄 Service data updated from Firebase");
                servicesData = data;
                localStorage.setItem('HTUTransport_services', JSON.stringify(servicesData));
                
                if (document.getElementById('servicesGrid')) {
                    this.renderServices();
                }
                
                // Nếu đang ở trang chi tiết dịch vụ, cập nhật chi tiết
                if (this.isServiceDetailPage()) {
                    this.renderServiceDetailPage();
                }
                
                this.integrateWithBookingSystem();
            }
        });
    }
    
    // ===== HIỂN THỊ DỊCH VỤ =====
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
                <a href="/service/${id}" class="btn-view-details">
                    Xem chi tiết
                </a>
            `;
            
            servicesGrid.appendChild(card);
        });
    }
    
    // ===== HIỂN THỊ TRANG CHI TIẾT DỊCH VỤ =====
    renderServiceDetailPage() {
        const serviceId = this.getServiceIdFromUrl();
        if (!serviceId) {
            console.error("❌ No service ID found in URL");
            return;
        }
        
        const service = servicesData.services[serviceId];
        if (!service) {
            console.error(`❌ Service not found: ${serviceId}`);
            this.showServiceNotFound();
            return;
        }
        
        this.renderServiceDetailContent(serviceId, service);
    }
    
    // ===== HIỂN THỊ NỘI DUNG CHI TIẾT DỊCH VỤ =====
    renderServiceDetailContent(serviceId, service) {
        // Cập nhật tiêu đề trang
        document.title = `${service.title} - LuxuryMove`;
        
        // Cập nhật tiêu đề dịch vụ
        const detailTitle = document.getElementById('serviceDetailTitle');
        const detailSubtitle = document.getElementById('serviceDetailSubtitle');
        
        if (detailTitle) detailTitle.textContent = service.title || 'Dịch vụ';
        if (detailSubtitle) detailSubtitle.textContent = service.subtitle || service.title || 'Dịch vụ cao cấp';
        
        // Tạo nội dung chi tiết
        const detailContent = document.getElementById('serviceDetailContent');
        if (!detailContent) return;
        
        let contentHTML = `
            <div class="service-detail-container">
                <div class="detail-images-section">
        `;
        
        // Hình ảnh
        if (service.images && service.images.length > 0) {
            contentHTML += `
                <div class="detail-image-main">
                    <img src="${service.images[0]}" alt="${service.title}" id="mainDetailImage" loading="lazy">
                </div>
            `;
            
            if (service.images.length > 1) {
                contentHTML += `<div class="detail-image-thumbs">`;
                service.images.forEach((img, index) => {
                    contentHTML += `
                        <div class="detail-thumb ${index === 0 ? 'active' : ''}" onclick="changeDetailImage('${img}')">
                            <img src="${img}" alt="${service.title} ${index + 1}" loading="lazy">
                        </div>
                    `;
                });
                contentHTML += `</div>`;
            }
        } else {
            contentHTML += `
                <div class="detail-image-main">
                    <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800" alt="${service.title}" id="mainDetailImage" loading="lazy">
                </div>
            `;
        }
        
        contentHTML += `
                </div>
                
                <div class="detail-info-section">
                    <div class="detail-description-section">
                        <h3>Mô tả dịch vụ</h3>
                        <p class="detail-description">${service.description || 'Đang cập nhật thông tin chi tiết...'}</p>
                    </div>
                    
                    <div class="detail-features-section">
                        <h3>Tính năng nổi bật</h3>
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
                    </div>
                    
                    <div class="detail-pricing-section">
                        <h3>Bảng giá tham khảo</h3>
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
                    </div>
                    
                    <div class="detail-actions-section">
                        <button class="btn-book-now" onclick="serviceManager.bookServiceFromDetail('${serviceId}')">
                            <i class="fas fa-calendar-alt"></i> Đặt dịch vụ ngay
                        </button>
                        <a href="tel:0567033888" class="btn-call-now">
                            <i class="fas fa-phone-alt"></i> Gọi ngay: 0567.033.888
                        </a>
                    </div>
                    
                    <div class="back-to-services">
                        <a href="/" class="btn-back">
                            <i class="fas fa-arrow-left"></i> Quay lại danh sách dịch vụ
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        detailContent.innerHTML = contentHTML;
    }
    
    // ===== HIỂN THỊ TRANG KHÔNG TÌM THẤY DỊCH VỤ =====
    showServiceNotFound() {
        const detailContent = document.getElementById('serviceDetailContent');
        if (!detailContent) return;
        
        detailContent.innerHTML = `
            <div class="service-not-found">
                <h2>Dịch vụ không tồn tại</h2>
                <p>Xin lỗi, chúng tôi không tìm thấy dịch vụ bạn yêu cầu.</p>
                <a href="/" class="btn-back-to-home">
                    <i class="fas fa-home"></i> Quay lại trang chủ
                </a>
            </div>
        `;
    }
    
    // ===== TÍCH HỢP VỚI BOOKING SYSTEM =====
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
    
    // ===== ĐẶT DỊCH VỤ TỪ CHI TIẾT =====
    bookServiceFromDetail(serviceId) {
        const service = servicesData.services[serviceId];
        if (!service || !service.title) return;
        
        // Sử dụng booking system
        if (window.bookingSystem?.bookService) {
            window.bookingSystem.bookService(service.title);
        } else if (window.completeBookingSystem?.bookService) {
            window.completeBookingSystem.bookService(service.title);
        }
    }
    
    // ===== LẤY DỮ LIỆU DỊCH VỤ MẪU =====
    getSampleServices() {
        return {
            services: {
                'airport': {
                    title: 'Dịch Vụ Đưa Đón Sân Bay',
                    subtitle: 'Chuyến bay đúng giờ, xe đón đúng lúc',
                    description: 'Dịch vụ đưa đón sân bay chuyên nghiệp với xe đời mới, tài xế kinh nghiệm, đảm bảo đón khách đúng giờ và an toàn tuyệt đối.',
                    images: [
                        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800',
                        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800'
                    ],
                    features: [
                        'Theo dõi chuyến bay trực tuyến',
                        'Xe đời mới 2023-2024',
                        'Tài xế nói tiếng Anh',
                        'Miễn phí chờ 60 phút',
                        'Hỗ trợ hành lý',
                        'WiFi miễn phí trên xe'
                    ],
                    pricing: [
                        { label: 'Nội thành Hà Nội', price: '350,000 VND' },
                        { label: 'Nội thành Hồ Chí Minh', price: '300,000 VND' },
                        { label: 'Tuyến dài (>50km)', price: '15,000 VND/km' }
                    ]
                },
                'tour': {
                    title: 'Thuê Xe Du Lịch',
                    subtitle: 'Khám phá mọi miền đất nước',
                    description: 'Dịch vụ thuê xe du lịch với nhiều loại xe từ 4-45 chỗ, phục vụ các tour du lịch, tham quan trong và ngoài thành phố.',
                    images: [
                        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800'
                    ],
                    features: [
                        'Xe đời mới 2023-2024',
                        'Tài xế kinh nghiệm 5+ năm',
                        'WiFi miễn phí trên xe',
                        'Nước uống miễn phí',
                        'Bảo hiểm hành khách'
                    ],
                    pricing: [
                        { label: 'Xe 4 chỗ (8h/ngày)', price: '1,200,000 VND' },
                        { label: 'Xe 7 chỗ (8h/ngày)', price: '1,800,000 VND' },
                        { label: 'Xe 16 chỗ (8h/ngày)', price: '2,500,000 VND' }
                    ]
                },
                'wedding': {
                    title: 'Xe Cưới Cao Cấp',
                    subtitle: 'Ngày trọng đại, xe sang trọng',
                    description: 'Dịch vụ xe cưới cao cấp với các dòng xe sang trọng, tài xế chuyên nghiệp, trang trí xe theo yêu cầu của khách hàng.',
                    images: [
                        'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800'
                    ],
                    features: [
                        'Xe sang trọng (Mercedes, BMW)',
                        'Trang trí xe theo yêu cầu',
                        'Tài xế lịch sự, chuyên nghiệp',
                        'Chụp ảnh kỷ niệm',
                        'Hoa tươi trang trí'
                    ],
                    pricing: [
                        { label: 'Xe cưới 4 chỗ (4h)', price: '2,500,000 VND' },
                        { label: 'Xe cưới 7 chỗ (4h)', price: '3,500,000 VND' },
                        { label: 'Trọn gói đám cưới', price: 'Liên hệ' }
                    ]
                }
            }
        };
    }
}

// ===== HELPER FUNCTIONS =====
function changeDetailImage(imageUrl) {
    const mainImage = document.getElementById('mainDetailImage');
    if (mainImage) {
        mainImage.src = imageUrl;
    }
    
    document.querySelectorAll('.detail-thumb').forEach(thumb => {
        thumb.classList.remove('active');
    });
    
    // Tìm và active thumb tương ứng (cần cải thiện logic này)
    document.querySelectorAll('.detail-thumb').forEach(thumb => {
        const thumbImg = thumb.querySelector('img');
        if (thumbImg && thumbImg.src.includes(imageUrl.split('/').pop())) {
            thumb.classList.add('active');
        }
    });
}

// ===== KHỞI TẠO SERVICE MANAGER =====
const serviceManager = new ServiceManager();
window.serviceManager = serviceManager;

// Tự động render trang chi tiết nếu đang ở trang service
document.addEventListener('DOMContentLoaded', function() {
    if (window.serviceManager.isServiceDetailPage()) {
        window.serviceManager.renderServiceDetailPage();
    }
});

console.log('✅ Service Manager loaded');