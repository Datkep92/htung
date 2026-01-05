

// Biến toàn cục
let experiencesData = { experiences: {} };
let experienceDatabase = null;

// ===== LỚP QUẢN LÝ TRẢI NGHIỆM =====
class ExperienceManager {
    constructor() {
        this.init();
    }
    
    async init() {
        console.log("🌟 Experience Manager Initializing...");
        
        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            experienceDatabase = firebase.database();
            
            // Load experience data
            await this.loadExperiences();
            
            // Setup Firebase listener
            this.setupExperienceListener();
            
            // Setup mobile touch events
            this.setupMobileTouch();
            
            console.log("✅ Experience Manager initialized successfully");
        } catch (error) {
            console.error("❌ Error initializing Experience Manager:", error);
            this.loadExperiencesFromLocalStorage();
        }
    }
    
    // ===== LOAD DỮ LIỆU TRẢI NGHIỆM =====
    async loadExperiences() {
        try {
            console.log("🔍 Loading experiences from Firebase...");
            
            const snapshot = await experienceDatabase.ref('experiences').once('value');
            const data = snapshot.val();
            
            if (data && data.experiences) {
                experiencesData = data;
                localStorage.setItem('HTUTransport_experiences', JSON.stringify(experiencesData));
                console.log("✅ Loaded experiences from Firebase:", Object.keys(data.experiences).length);
                
                // Render experiences nếu đang ở trang chủ
                if (document.querySelector('.user-experience-row')) {
                    this.renderExperiences();
                }
            } else {
                console.log("ℹ️ No experience data in Firebase, trying localStorage...");
                this.loadExperiencesFromLocalStorage();
            }
            
        } catch (error) {
            console.error("❌ Error loading experiences:", error);
            this.loadExperiencesFromLocalStorage();
        }
    }
    
    loadExperiencesFromLocalStorage() {
        try {
            const data = localStorage.getItem('HTUTransport_experiences');
            if (data) {
                experiencesData = JSON.parse(data);
                console.log("📂 Loaded experiences from localStorage:", Object.keys(experiencesData.experiences).length);
                
                if (document.querySelector('.user-experience-row')) {
                    this.renderExperiences();
                }
            } else {
                console.log("🎨 Creating default experiences...");
                experiencesData = { experiences: this.getDefaultExperiences() };
                localStorage.setItem('HTUTransport_experiences', JSON.stringify(experiencesData));
                
                if (document.querySelector('.user-experience-row')) {
                    this.renderExperiences();
                }
                
                // Try to save to Firebase
                this.saveExperiencesToFirebase();
            }
        } catch (error) {
            console.error("❌ Error loading from localStorage:", error);
            experiencesData = { experiences: this.getDefaultExperiences() };
            
            if (document.querySelector('.user-experience-row')) {
                this.renderExperiences();
            }
        }
    }
    
    // ===== SAVE EXPERIENCES TO FIREBASE =====
    async saveExperiencesToFirebase() {
        try {
            if (!experienceDatabase) return;
            
            await experienceDatabase.ref('experiences').set(experiencesData);
            console.log("✅ Experiences saved to Firebase");
        } catch (error) {
            console.error("❌ Error saving experiences to Firebase:", error);
        }
    }
    
    // ===== SETUP FIREBASE LISTENER =====
    setupExperienceListener() {
        if (!experienceDatabase) return;
        
        experienceDatabase.ref('experiences').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.experiences) {
                console.log("🔄 Experience data updated from Firebase");
                experiencesData = data;
                localStorage.setItem('HTUTransport_experiences', JSON.stringify(experiencesData));
                
                if (document.querySelector('.user-experience-row')) {
                    this.renderExperiences();
                }
            }
        });
    }
    
    // ===== HIỂN THỊ TRẢI NGHIỆM =====
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
                    <button class="exp-book-btn" onclick="experienceManager.quickBookExperience('${experience.title}')">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Đặt ngay ${experience.title}</span>
                    </button>
                </div>
            `;
            
            experienceRow.appendChild(card);
        });
    }
    
    // ===== SETUP MOBILE TOUCH EVENTS =====
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
    
   // ===== ĐẶT TRẢI NGHIỆM NHANH =====
quickBookExperience(experienceTitle) {
    // 1. Scroll đến booking section trước
    if (window.scrollToBookingSection) {
        window.scrollToBookingSection();
    }
    
    // 2. Đợi một chút rồi đặt service
    setTimeout(() => {
        // Sử dụng booking system
        if (window.completeBookingSystem?.bookService) {
            window.completeBookingSystem.bookService(experienceTitle);
        } else if (window.bookingSystem?.bookService) {
            window.bookingSystem.bookService(experienceTitle);
        } else {
            // Fallback
            sessionStorage.setItem('selectedService', JSON.stringify({
                title: experienceTitle,
                type: 'experience',
                timestamp: Date.now()
            }));
        }
        
        // 3. Hiển thị thông báo
        this.showQuickBookToast(experienceTitle);
    }, 800); // Đợi 800ms để scroll hoàn tất
}
    
    // ===== HIỂN THỊ THÔNG BÁO ĐẶT NHANH =====
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
    
    
    
    // ===== LẤY DỮ LIỆU TRẢI NGHIỆM MẶC ĐỊNH =====
    getDefaultExperiences() {
        return {
            'family': {
                title: 'Cho Gia Đình',
                image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=500',
                description: 'Hành trình ấm cúng, an tâm cho gia đình bạn. Dịch vụ được thiết kế đặc biệt cho các thành viên trong gia đình, đảm bảo an toàn và tiện nghi tối đa.',
                benefits: [
                    'An toàn tuyệt đối cho người thân',
                    'Tiện nghi cho trẻ em & người lớn tuổi',
                    'Không gian riêng tư, thoải mái',
                    'Ghế trẻ em tiêu chuẩn Châu Âu',
                    'Hỗ trợ đặc biệt cho người già'
                ]
            },
            'friends': {
                title: 'Cho Bạn Bè',
                image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=500',
                description: 'Chuyến đi vui vẻ cùng những người bạn thân. Tạo ra những kỷ niệm đáng nhớ với dịch vụ di chuyển linh hoạt và thoải mái.',
                benefits: [
                    'Thoải mái trò chuyện, tạo kỷ niệm',
                    'Điểm dừng linh hoạt theo nhóm',
                    'Chi phí chia sẻ hợp lý',
                    'Hỗ trợ chụp ảnh lưu niệm',
                    'Không gian mở cho hoạt động nhóm'
                ]
            },
            'business': {
                title: 'Cho Công Tác',
                image: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=500',
                description: 'Dịch vụ chuyên nghiệp dành cho doanh nhân và công tác. Đảm bảo đúng giờ, bảo mật thông tin và tiện nghi cao cấp.',
                benefits: [
                    'Đúng giờ 100% cho các cuộc hẹn',
                    'WiFi tốc độ cao trên xe',
                    'Không gian làm việc riêng tư',
                    'Hỗ trợ tài liệu và in ấn',
                    'Tài xế trang phục chuyên nghiệp'
                ]
            },
            'tour': {
                title: 'Du Lịch Tour',
                image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500',
                description: 'Khám phá vẻ đẹp đất nước với tour du lịch trọn gói. Hướng dẫn viên nhiệt tình, lịch trình linh hoạt, địa điểm đa dạng.',
                benefits: [
                    'Lịch trình thiết kế riêng theo yêu cầu',
                    'Hướng dẫn viên am hiểu địa phương',
                    'Đảm bảo các điểm tham quan tốt nhất',
                    'Ẩm thực đặc sản địa phương',
                    'Chụp ảnh kỷ niệm chuyên nghiệp'
                ]
            }
        };
    }
    
    // ===== THÊM TRẢI NGHIỆM MỚI =====
    addExperience(experienceData) {
        if (!experienceData.id) {
            experienceData.id = 'exp_' + Date.now();
        }
        
        experiencesData.experiences[experienceData.id] = experienceData;
        
        // Update UI
        this.renderExperiences();
        
        // Save to localStorage
        localStorage.setItem('HTUTransport_experiences', JSON.stringify(experiencesData));
        
        // Try to save to Firebase
        this.saveExperiencesToFirebase();
        
        return experienceData.id;
    }
    
    // ===== CẬP NHẬT TRẢI NGHIỆM =====
    updateExperience(experienceId, experienceData) {
        if (!experiencesData.experiences[experienceId]) {
            console.error("❌ Experience not found:", experienceId);
            return false;
        }
        
        experiencesData.experiences[experienceId] = {
            ...experiencesData.experiences[experienceId],
            ...experienceData
        };
        
        // Update UI
        this.renderExperiences();
        
        // Save to localStorage
        localStorage.setItem('HTUTransport_experiences', JSON.stringify(experiencesData));
        
        // Try to save to Firebase
        this.saveExperiencesToFirebase();
        
        return true;
    }
    
    // ===== XÓA TRẢI NGHIỆM =====
    deleteExperience(experienceId) {
        if (!experiencesData.experiences[experienceId]) {
            console.error("❌ Experience not found:", experienceId);
            return false;
        }
        
        delete experiencesData.experiences[experienceId];
        
        // Update UI
        this.renderExperiences();
        
        // Save to localStorage
        localStorage.setItem('HTUTransport_experiences', JSON.stringify(experiencesData));
        
        // Try to save to Firebase
        this.saveExperiencesToFirebase();
        
        return true;
    }
    
    // ===== LẤY DANH SÁCH TRẢI NGHIỆM =====
    getAllExperiences() {
        return experiencesData.experiences;
    }
    
    // ===== LẤY THÔNG TIN TRẢI NGHIỆM =====
    getExperienceById(experienceId) {
        return experiencesData.experiences[experienceId] || null;
    }
}

// ===== SETUP HORIZONTAL SCROLL CHO EXPERIENCES =====
function setupExperienceHorizontalScroll() {
    const experienceRow = document.querySelector('.user-experience-row');
    if (experienceRow) {
        experienceRow.style.cssText = `
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            ms-overflow-style: none;
        `;
        
        experienceRow.querySelectorAll(':scope > *').forEach(item => {
            item.style.flex = '0 0 auto';
        });
    }
}

// ===== KHỞI TẠO EXPERIENCE MANAGER =====
const experienceManager = new ExperienceManager();
window.experienceManager = experienceManager;

// Setup horizontal scroll khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
    setupExperienceHorizontalScroll();
    
    // Re-setup mobile touch after dynamic content
    if (window.experienceManager) {
        setTimeout(() => {
            window.experienceManager.setupMobileTouch();
        }, 1000);
    }
});

console.log('✅ Experience Manager loaded');