// ===== PRICING SYSTEM - OPTIMIZED VERSION =====
let pricingData = { prices: [], services: [] };
let pricingDatabase = null;
let showAllPricing = false; // Biến để kiểm soát hiển thị



async function loadAllPricingData() {
    try {
        let [pricingSnapshot, servicesSnapshot] = await Promise.all([
            pricingDatabase.ref('pricing').once('value'),
            pricingDatabase.ref('services').once('value')
        ]);
        
        const pricing = pricingSnapshot.val();
        const services = servicesSnapshot.val();
        
        pricingData = {
            prices: pricing?.prices || getDefaultPricing(),
            services: extractServicesPricing(services), // CHỈ LẤY SERVICES CÓ CUSTOM_PRICE
            last_updated: new Date().toISOString()
        };
        
        localStorage.setItem('luxurymove_pricing', JSON.stringify(pricingData));
        renderPricingTable();
        
    } catch (error) {
        console.error("Error loading pricing data:", error);
        loadPricingFromLocalStorage();
    }
}

// Trích xuất giá từ dịch vụ (chỉ lấy tiêu đề và giá)
function extractServicesPricing(servicesData) {
    const servicesPricing = [];
    
    if (servicesData && servicesData.services) {
        Object.entries(servicesData.services).forEach(([id, service]) => {
            if (service.pricing && service.pricing.length > 0) {
                // Chỉ lấy mục đầu tiên của mỗi dịch vụ
                const priceItem = service.pricing[0];
                
                // Thêm trường custom_price để lưu giá tùy chỉnh
                servicesPricing.push({
                    id: `service_${id}`,
                    source: 'service',
                    service_id: id,
                    category: 'Dịch Vụ',
                    title: service.title,
                    description: service.description?.substring(0, 80) + '...' || '',
                    current_price: priceItem.price,
                    custom_price: service.custom_price || null, // Thêm dòng này
                    original_price: service.original_price || null, // Thêm dòng này
                    note: priceItem.label ? `(${priceItem.label})` : '',
                    order: parseInt(service.order || 999)
                });
            }
        });
        
        // Sắp xếp theo order
        servicesPricing.sort((a, b) => a.order - b.order);
    }
    
    return servicesPricing;
}

// Render hiển thị 5 giá gần nhất trên homepage
function renderPricingTable() {
    const pricingSection = document.getElementById('pricingSection');
    if (!pricingSection) return;
    
    const { prices = [], services = [] } = pricingData;
    const lastUpdated = pricingData.last_updated ? new Date(pricingData.last_updated).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
    
    if (prices.length === 0 && services.length === 0) {
        pricingSection.innerHTML = `
            <div class="empty-pricing">
                <i class="fas fa-tags"></i>
                <p>Chưa có bảng giá</p>
                <small>Vui lòng liên hệ: 0567.033.888</small>
            </div>
        `;
        return;
    }
    
    // CHỈ lấy bảng giá tùy chỉnh (pricing), không lấy dịch vụ
let allItems = prices.map(item => ({
    ...item,
    source: 'pricing'
}));

// Sắp xếp theo order và lấy 6 mục mới nhất
allItems.sort((a, b) => (b.order || 0) - (a.order || 0));

const latestItems = allItems.slice(0, 6);
const totalItems = allItems.length;

    
    let html = `
    <div class="pricing-preview">
        <div class="pricing-header">
            <div class="header-top">
                <h2 class="pricing-title">
                    Bảng Giá Mới Nhất
                </h2>

                <span style="display:block; width:100%; margin-top:6px;">
                    Giá mang tính chất tham khảo – thực tế phụ thuộc vào thời gian, 
                    địa điểm, loại xe, vui lòng liên hệ để được tư vấn rõ ràng nhất
                </span>
            </div>
        </div>

        <div class="pricing-preview-grid">
`;

    
    // Render 5 items mới nhất
    latestItems.forEach((item, index) => {
        const isService = item.source === 'service';
        const hasDiscount = item.original_price && item.current_price;
        const priceValue = item.custom_price || item.current_price || 'Liên hệ';

        
        html += `
            <div class="pricing-preview-card ${isService ? 'service-card' : ''} ${hasDiscount ? 'has-discount' : ''}">
                <div class="preview-card-header">
                    ${isService ? 
                        `<span class="service-badge">
                            <i class="fas fa-car"></i> Dịch vụ
                        </span>` : 
                        `<span class="route-badge">
                            <i class="fas fa-map-marker-alt"></i> ${item.category || 'Tuyến đường'}
                        </span>`
                    }
                    ${index < 3 ? `<span class="new-badge">MỚI</span>` : ''}
                </div>
                
                <div class="preview-card-content">
                    <h3 class="preview-item-title">${item.title}</h3>
                    
                    ${item.description ? `
                        <div class="preview-item-desc">
                            ${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}
                        </div>
                    ` : ''}
                    
                    <div class="preview-price-section">
                        ${hasDiscount ? `
                            <div class="preview-price-original">
                                <del>${item.original_price}</del>
                            </div>
                        ` : ''}
                        
                        <div class="preview-price-current">
                            <span class="price-amount">${priceValue}</span>
                        </div>
                    </div>
                    
                    <!-- Thêm nút nhỏ liên hệ và đặt xe -->
                    <div class="preview-mini-buttons">
                        <button class="mini-call-btn" onclick="window.location.href='tel:0567033888'" title="Gọi ngay">
                            <i class="fas fa-phone-alt"></i>
                            <span>Gọi ngay</span>
                        </button>
                        <button class="mini-book-btn" onclick="quickBookPricing('${item.title}', '${priceValue}')" title="Đặt xe nhanh">
                            <i class="fas fa-car"></i>
                            <span>Đặt xe</span>
                        </button>
                       
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            
            <div class="pricing-preview-footer">
                <button class="btn-view-all-pricing" onclick="openFullPricingPage()">
                    <i class="fas fa-list-alt"></i>
                    Xem Toàn Bộ Bảng Giá
                </button>
                
                
            </div>
        </div>
    `;
    
    pricingSection.innerHTML = html;
    
    // Thêm CSS cho nút nhỏ nếu chưa có
    addMiniButtonsCSS();
}

// Thêm CSS cho nút nhỏ
function addMiniButtonsCSS() {
    if (document.getElementById('miniButtonsCSS')) return;
    
    const style = document.createElement('style');
    style.id = 'miniButtonsCSS';
    style.textContent = `
        /* CSS cho nút nhỏ liên hệ và đặt xe */
        .preview-mini-buttons {
            display: flex;
            gap: 8px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(212, 175, 55, 0.1);
            justify-content: space-between;
        }
        
        .mini-call-btn,
        .mini-book-btn,
        .mini-info-btn {
            flex: 1;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px solid transparent;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            min-height: 60px;
            text-align: center;
            background: rgba(255, 255, 255, 0.05);
        }
        
        .mini-call-btn {
            color: #2196F3;
            border-color: rgba(33, 150, 243, 0.2);
        }
        
        .mini-call-btn:hover {
            background: rgba(33, 150, 243, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
        }
        
        .mini-book-btn {
            color: #4CAF50;
            border-color: rgba(76, 175, 80, 0.2);
        }
        
        .mini-book-btn:hover {
            background: rgba(76, 175, 80, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
        }
        
        .mini-info-btn {
            color: var(--champagne);
            border-color: rgba(212, 175, 55, 0.2);
        }
        
        .mini-info-btn:hover {
            background: rgba(212, 175, 55, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
        }
        
        .mini-call-btn i,
        .mini-book-btn i,
        .mini-info-btn i {
            font-size: 14px;
            margin-bottom: 2px;
        }
        
        .mini-call-btn span,
        .mini-book-btn span,
        .mini-info-btn span {
            font-size: 11px;
            line-height: 1.2;
            display: block;
        }
        
        .mini-call-btn:active,
        .mini-book-btn:active,
        .mini-info-btn:active {
            transform: translateY(0);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .preview-mini-buttons {
                gap: 6px;
            }
            
            .mini-call-btn,
            .mini-book-btn,
            .mini-info-btn {
                padding: 6px 8px;
                min-height: 55px;
            }
            
            .mini-call-btn i,
            .mini-book-btn i,
            .mini-info-btn i {
                font-size: 13px;
            }
            
            .mini-call-btn span,
            .mini-book-btn span,
            .mini-info-btn span {
                font-size: 10px;
            }
        }
        
        @media (max-width: 480px) {
            .preview-mini-buttons {
                flex-direction: column;
                gap: 8px;
            }
            
            .mini-call-btn,
            .mini-book-btn,
            .mini-info-btn {
                flex-direction: row;
                justify-content: flex-start;
                padding: 8px 12px;
                min-height: auto;
                text-align: left;
            }
            
            .mini-call-btn i,
            .mini-book-btn i,
            .mini-info-btn i {
                margin-bottom: 0;
                margin-right: 8px;
                width: 16px;
                text-align: center;
            }
            
            .mini-call-btn span,
            .mini-book-btn span,
            .mini-info-btn span {
                font-size: 12px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Hàm xử lý đặt xe từ bảng giá
function quickBookPricing(serviceTitle, servicePrice) {
    // Đóng modal bảng giá nếu đang mở
    if (document.getElementById('fullPricingModal')) {
        closeFullPricingPage();
    }
    
    // Lưu service đã chọn
    const serviceData = {
        title: serviceTitle,
        price: servicePrice,
        timestamp: Date.now()
    };
    
    sessionStorage.setItem('selectedService', JSON.stringify(serviceData));
    
    // Hiển thị toast thông báo
    showQuickBookToast(serviceTitle);
    
    // Chuyển đến booking section
    setTimeout(() => {
        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
            bookingSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            bookingSection.classList.add('highlight-booking');
            
            setTimeout(() => {
                // Tự động điền vào form
                const serviceSelect = document.querySelector('.form-select[name="service"]');
                if (serviceSelect) {
                    serviceSelect.focus();
                    
                    const options = Array.from(serviceSelect.options);
                    const matchingOption = options.find(option => 
                        option.text.toLowerCase().includes(serviceTitle.toLowerCase()) || 
                        serviceTitle.toLowerCase().includes(option.text.toLowerCase())
                    );
                    
                    if (matchingOption) {
                        serviceSelect.value = matchingOption.value;
                    }
                }
                
                setTimeout(() => {
                    bookingSection.classList.remove('highlight-booking');
                }, 3000);
                
            }, 500);
        }
    }, 800);
}

// Sửa lại hàm showPricingDetails để mở popup dịch vụ
function showPricingDetails(title, price, description) {
    // Tìm service tương ứng trong servicesData
    const services = servicesData.services || {};
    let matchingService = null;
    let serviceId = null;
    
    // Tìm service có tiêu đề tương tự
    for (const [id, service] of Object.entries(services)) {
        if (service.title && title.includes(service.title)) {
            matchingService = service;
            serviceId = id;
            break;
        }
    }
    
    // Nếu tìm thấy service tương ứng, mở popup service
    if (matchingService && serviceId) {
        showServiceDetail(serviceId);
    } else {
        // Nếu không tìm thấy, hiển thị popup chi tiết giá như cũ
        showPricingDetailPopup(title, price, description);
    }
}

// Giữ lại hàm popup chi tiết giá cho trường hợp không tìm thấy service
function showPricingDetailPopup(title, price, description) {
    // Tạo popup nhỏ hiển thị thông tin chi tiết
    const popupHTML = `
        <div class="pricing-detail-popup" id="pricingDetailPopup">
            <div class="popup-content">
                <div class="popup-header">
                    <h4 class="popup-title">
                        <i class="fas fa-info-circle"></i>
                        ${title}
                    </h4>
                    <button class="popup-close" onclick="closePricingDetail()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="popup-body">
                    ${description ? `
                        <div class="detail-description">
                            <p>${description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="detail-price">
                        <strong>Giá tham khảo:</strong>
                        <span class="price-value">${price}</span>
                    </div>
                    
                    <div class="detail-actions">
                        <button class="detail-call-btn" onclick="window.location.href='tel:0567033888'">
                            <i class="fas fa-phone-alt"></i>
                            Gọi tư vấn
                        </button>
                        <button class="detail-book-btn" onclick="quickBookPricing('${title}', '${price}'); closePricingDetail();">
                            <i class="fas fa-car"></i>
                            Đặt xe ngay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Thêm popup vào body
    const popupContainer = document.createElement('div');
    popupContainer.innerHTML = popupHTML;
    document.body.appendChild(popupContainer);
}



// Cập nhật hàm quickBookPricing để tìm service tương ứng
function quickBookPricing(serviceTitle, servicePrice) {
    // Đóng modal bảng giá nếu đang mở
    if (document.getElementById('fullPricingModal')) {
        closeFullPricingPage();
    }
    
    // Tìm service tương ứng
    const serviceMatch = findServiceFromPricing(serviceTitle);
    let serviceData;
    
    if (serviceMatch) {
        // Nếu tìm thấy service, sử dụng thông tin service
        serviceData = {
            id: serviceMatch.id,
            title: serviceMatch.service.title,
            price: servicePrice,
            type: 'service',
            timestamp: Date.now()
        };
    } else {
        // Nếu không tìm thấy, sử dụng thông tin từ pricing
        serviceData = {
            title: serviceTitle,
            price: servicePrice,
            type: 'pricing',
            timestamp: Date.now()
        };
    }
    
    sessionStorage.setItem('selectedService', JSON.stringify(serviceData));
    
    // Hiển thị toast thông báo
    showQuickBookToast(serviceTitle);
    
    // Chuyển đến booking section
    setTimeout(() => {
        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
            bookingSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            bookingSection.classList.add('highlight-booking');
            
            setTimeout(() => {
                // Tự động điền vào form
                const serviceSelect = document.querySelector('.form-select[name="service"]');
                if (serviceSelect) {
                    serviceSelect.focus();
                    
                    // Tìm option phù hợp
                    const options = Array.from(serviceSelect.options);
                    let foundOption = null;
                    
                    // Ưu tiên tìm option chính xác
                    for (const option of options) {
                        const optionText = option.text.toLowerCase();
                        const serviceText = serviceTitle.toLowerCase();
                        
                        if (optionText === serviceText ||
                            optionText.includes(serviceText) ||
                            serviceText.includes(optionText)) {
                            foundOption = option;
                            break;
                        }
                    }
                    
                    // Nếu không tìm thấy chính xác, thử tìm theo service nếu có
                    if (!foundOption && serviceMatch) {
                        for (const option of options) {
                            const optionText = option.text.toLowerCase();
                            const serviceMatchText = serviceMatch.service.title.toLowerCase();
                            
                            if (optionText === serviceMatchText ||
                                optionText.includes(serviceMatchText) ||
                                serviceMatchText.includes(optionText)) {
                                foundOption = option;
                                break;
                            }
                        }
                    }
                    
                    if (foundOption) {
                        serviceSelect.value = foundOption.value;
                    }
                }
                
                setTimeout(() => {
                    bookingSection.classList.remove('highlight-booking');
                }, 3000);
                
            }, 500);
        }
    }, 800);
}

// Thêm hàm helper để log service matching
function debugServiceMatching() {
    const services = servicesData.services || {};
    console.log('Available services:', Object.keys(services));
    
    // Lấy tất cả pricing items
    const allItems = [
        ...pricingData.prices || [],
        ...pricingData.services || []
    ];
    
    console.log('Pricing items:', allItems.map(item => item.title));
    
    // Test matching
    allItems.forEach(item => {
        const match = findServiceFromPricing(item.title);
        console.log(`"${item.title}" →`, match ? `Matched: ${match.service.title}` : 'No match');
    });
}

function closePricingDetail() {
    const popup = document.getElementById('pricingDetailPopup');
    if (popup) {
        popup.remove();
    }
}

// Thêm event để đóng popup bằng ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const popup = document.getElementById('pricingDetailPopup');
        if (popup) {
            closePricingDetail();
        }
    }
});

// Mở trang bảng giá đầy đủ
function openFullPricingPage() {
    // Tạo modal/overlay cho bảng giá đầy đủ
    createFullPricingModal();
}

// Toggle hiển thị tất cả
function toggleViewMore() {
    showAllPricing = !showAllPricing;
    renderPricingTable();
    
    // Cuộn đến phần pricing nếu đang mở rộng
    if (showAllPricing) {
        document.getElementById('pricingSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Request quote function
function requestQuote(title, price) {
    const phoneNumber = '0567033888';
    const message = `Xin chào, tôi muốn nhận báo giá cho: ${title} ${price ? `(Giá tham khảo: ${price})` : ''}`;
    const whatsappUrl = `https://wa.me/84${phoneNumber.substring(1)}?text=${encodeURIComponent(message)}`;
    const zaloUrl = `https://zalo.me/${phoneNumber}`;
    
    // Hiển thị modal hoặc chuyển hướng
    if (confirm(`Bạn muốn liên hệ qua WhatsApp hay Zalo để nhận báo giá chi tiết cho "${title}"?`)) {
        window.open(whatsappUrl, '_blank');
    } else {
        window.open(zaloUrl, '_blank');
    }
}

// Default pricing data
function getDefaultPricing() {
    return [
        {
            id: 'price1',
            category: 'Sân Bay Cam Ranh',
            title: 'Phan Rang ⇄ Sân Bay Cam Ranh',
            description: 'Đưa đón tận nơi, hỗ trợ hành lý',
            original_price: '800.000 VND',
            current_price: '500.000 VND',
            note: 'Giá cho xe 4-7 chỗ',
            order: 1
        },
        {
            id: 'price2',
            category: 'Tour Du Lịch',
            title: 'Du lịch Vĩnh Hy',
            description: 'Tour trọn gói nguyên ngày',
            current_price: '1.200.000 VND',
            note: 'Bao gồm xe, tài xế, nước uống',
            order: 2
        },
        {
            id: 'price3',
            category: 'Liên Tỉnh',
            title: 'Ninh Thuận ⇄ Đà Lạt (2 chiều)',
            description: 'Đón tại nhà, trả tận nơi',
            current_price: '800.000 VND',
            note: 'Xe 4 chỗ tiêu chuẩn',
            order: 3
        }
    ];
}

// Lắng nghe sự kiện cập nhật
window.addEventListener('pricingUpdated', () => {
    showAllPricing = false;
    loadAllPricingData();
});

window.addEventListener('servicesUpdated', () => {
    showAllPricing = false;
    loadAllPricingData();
});

// Lưu vào localStorage
function loadPricingFromLocalStorage() {
    const saved = localStorage.getItem('luxurymove_pricing');
    if (saved) {
        pricingData = JSON.parse(saved);
        renderPricingTable();
    } else {
        pricingData = {
            prices: getDefaultPricing(),
            services: [],
            last_updated: new Date().toISOString()
        };
        renderPricingTable();
    }
}
// Hàm cập nhật giá tùy chỉnh từ Firebase
async function updateCustomPricingFromFirebase() {
    try {
        const customPricingRef = pricingDatabase.ref('custom_pricing');
        const snapshot = await customPricingRef.once('value');
        const customPricing = snapshot.val();
        
        if (customPricing && servicesData && servicesData.services) {
            // Cập nhật giá tùy chỉnh vào từng service
            Object.entries(customPricing).forEach(([serviceId, customPrice]) => {
                if (servicesData.services[serviceId]) {
                    servicesData.services[serviceId].custom_price = customPrice;
                }
            });
            
            // Reload pricing data với giá tùy chỉnh
            await loadAllPricingData();
        }
    } catch (error) {
        console.error("Error loading custom pricing:", error);
    }
}

// Cập nhật hàm initPricing để load custom pricing
async function initPricing() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp({
                apiKey: "AIzaSyCeYPoizbE-Op79186r7pmndGpJ-JfESAk",
                authDomain: "hoangtung-af982.firebaseapp.com",
                databaseURL: "https://hoangtung-af982-default-rtdb.firebaseio.com",
                projectId: "hoangtung-af982",
                storageBucket: "hoangtung-af982.firebasestorage.app",
                messagingSenderId: "232719624914",
                appId: "1:232719624914:web:cac7ce833ae105d9255b0b",
                measurementId: "G-FWHFP1W032"
            });
        }
        pricingDatabase = firebase.database();
        await loadAllPricingData();
        await updateCustomPricingFromFirebase(); // Thêm dòng này
    } catch (error) {
        console.error("Pricing initialization error:", error);
        loadPricingFromLocalStorage();
    }
}

function createFullPricingModal() {
    const { prices = [], services = [] } = pricingData;
const lastUpdated = pricingData.last_updated
    ? new Date(pricingData.last_updated).toLocaleDateString('vi-VN')
    : 'Chưa cập nhật';

// 1️⃣ Sắp xếp GIÁ TÙY CHỈNH trước
const sortedPrices = prices
    .map(item => ({ ...item, source: 'pricing' }))
    .sort((a, b) => (b.order || 0) - (a.order || 0));

// 2️⃣ Sắp xếp GIÁ DỊCH VỤ sau
const sortedServices = services
    .map(item => ({ ...item, source: 'service' }))
    .sort((a, b) => (b.order || 0) - (a.order || 0));

// 3️⃣ Gộp: pricing → service
const allItems = [...sortedPrices, ...sortedServices];

    
    let html = `
        <div class="full-pricing-overlay" id="fullPricingModal">
            <div class="full-pricing-container">
                <!-- Header mỏng -->
                <div class="full-pricing-header-mini">
                    <div class="mini-header-left">
                        <h3 class="mini-header-title">
                            <i class="fas fa-file-invoice-dollar"></i>
                            Bảng Giá Đầy Đủ
                        </h3>
                        <div class="mini-header-info">
                            <span class="item-count">${allItems.length} dịch vụ</span>
                            <span class="header-divider">•</span>
                            <span class="update-info">Cập nhật: ${lastUpdated}</span>
                        </div>
                    </div>
                    <button class="btn-close-mini" onclick="closeFullPricingPage()" title="Đóng">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Warning banner (ẩn mờ dần khi scroll) -->
                <div class="pricing-warning-banner" id="warningBanner">
                    <div class="warning-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div class="warning-text">
                            <strong>Lưu ý:</strong> Giá chỉ mang tính chất tham khảo. Liên hệ để có giá chính xác nhất.
                        </div>
                    </div>
                    <button class="btn-dismiss-warning" onclick="dismissWarning()" title="Ẩn cảnh báo">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Nội dung chính -->
                <div class="full-pricing-content" id="pricingContent">
    `;
    
    // Phân loại theo category
    const categories = {};
    allItems.forEach(item => {
        const category = item.category || (item.source === 'service' ? 'Dịch Vụ' : 'Khác');
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(item);
    });
    
    // Render theo category
    Object.entries(categories).forEach(([category, items]) => {
        const isServiceCategory = category === 'Dịch Vụ';
        
        html += `
            <div class="pricing-category-section">
                <h3 class="category-title-mini">
                    <i class="fas fa-${isServiceCategory ? 'car' : 'map-marker-alt'}"></i>
                    ${category}
                    <span class="category-count-mini">${items.length}</span>
                </h3>
                
                <div class="pricing-table-mini">
        `;
        
        items.forEach(item => {
            const isService = item.source === 'service';
            const hasDiscount = item.original_price && item.current_price;
            const priceValue = item.custom_price || item.current_price || 'Liên hệ';

            
            html += `
                <div class="full-pricing-item ${isService ? 'service-item' : ''}">
                    <div class="item-main-info">
                        <div class="item-header-mini">
                            <h4 class="item-title-mini">${item.title}</h4>
                            ${isService ? 
                                `<span class="item-service-badge">
                                    <i class="fas fa-car"></i>
                                </span>` : ''
                            }
                        </div>
                        
                        ${item.description ? `
                            <div class="item-desc-mini">
                                ${item.description.substring(0, 80)}${item.description.length > 80 ? '...' : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="item-price-actions">
                        <div class="item-pricing-mini">
                            ${hasDiscount ? `
                                <div class="price-discounted">
                                    <del>${item.original_price}</del>
                                </div>
                            ` : ''}
                            
                            <div class="price-current-mini">
                                <span class="price-label">Giá:</span>
                                <strong class="price-value">${priceValue}</strong>
                            </div>
                        </div>
                        
                        <div class="item-action-buttons">
                            ${isService ? `
                                <!-- Dịch vụ: có cả đặt lịch và chi tiết -->
                                <button class="btn-quick-book" onclick="quickBook('${item.title}')" title="Đặt lịch nhanh">
                                    <i class="fas fa-calendar-check"></i>
                                    <span>Đặt lịch</span>
                                </button>
                                <button class="btn-service-detail" onclick="showServiceDetailFromPricing('${item.title}')" title="Xem chi tiết dịch vụ">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Chi tiết</span>
                                </button>
                            ` : `
                                <!-- Bảng giá thông thường: chỉ có đặt lịch -->
                                <button class="btn-quick-book-full" onclick="quickBook('${item.title}')" title="Đặt lịch nhanh">
                                    <i class="fas fa-calendar-check"></i>
                                    <span>Đặt lịch</span>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
                
                <!-- Footer với icon -->
                <div class="full-pricing-footer-mini">
                    <div class="footer-actions">
                        <button class="footer-btn call-btn" onclick="window.location.href='tel:0567033888'" title="Gọi điện">
                            <div class="btn-icon">
                                <i class="fas fa-phone"></i>
                            </div>
                            <span class="btn-label">Gọi</span>
                        </button>
                        
                        <button class="footer-btn zalo-btn" onclick="window.open('https://zalo.me/0567033888', '_blank')" title="Nhắn tin Zalo">
                            <div class="btn-icon">
                                <i class="fab fa-zalo"></i>
                            </div>
                            <span class="btn-label">Zalo</span>
                        </button>
                        
                        <button class="footer-btn whatsapp-btn" onclick="window.open('https://wa.me/84931243679?text=Tôi muốn nhận báo giá chi tiết', '_blank')" title="Nhắn tin WhatsApp">
                            <div class="btn-icon">
                                <i class="fab fa-whatsapp"></i>
                            </div>
                            <span class="btn-label">WhatsApp</span>
                        </button>
                        
                        <button class="footer-btn book-btn" onclick="quickBook('Đặt lịch chung')" title="Đặt lịch nhanh">
                            <div class="btn-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <span class="btn-label">Đặt lịch</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Thêm vào body
    const overlay = document.createElement('div');
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    
    // Thêm CSS nếu chưa có
    if (!document.getElementById('fullPricingCSS')) {
        const style = document.createElement('style');
        style.id = 'fullPricingCSS';
        style.textContent = getFullPricingCSS();
        document.head.appendChild(style);
    }
    
    // Thêm event để đóng bằng ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeFullPricingPage();
    });
    
    // Thêm event để đóng khi click ra ngoài
    overlay.querySelector('.full-pricing-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeFullPricingPage();
    });
    
    // Thêm event để ẩn warning banner khi scroll
    const pricingContent = document.getElementById('pricingContent');
    const warningBanner = document.getElementById('warningBanner');
    
    if (pricingContent && warningBanner) {
        pricingContent.addEventListener('scroll', function() {
            const scrollTop = this.scrollTop;
            if (scrollTop > 50) {
                warningBanner.style.opacity = '0.6';
                warningBanner.style.transform = 'translateY(-10px)';
            } else {
                warningBanner.style.opacity = '1';
                warningBanner.style.transform = 'translateY(0)';
            }
        });
    }
}

// Thêm CSS mới cho nút chi tiết dịch vụ
const serviceDetailButtonCSS = `
    .btn-service-detail {
        padding: 8px 12px;
        background: rgba(212, 175, 55, 0.1);
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 8px;
        color: var(--champagne);
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
    }
    
    .btn-service-detail:hover {
        background: rgba(212, 175, 55, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    }
    
    .btn-quick-book-full {
        width: 100%;
        padding: 10px 12px;
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
        border-radius: 8px;
        color: #4CAF50;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .btn-quick-book-full:hover {
        background: rgba(76, 175, 80, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
    }
    
    .service-item {
        border-left: 4px solid var(--champagne);
        background: rgba(212, 175, 55, 0.03);
    }
    
    /* Đảm bảo item-action-buttons có layout đúng */
    .item-action-buttons {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }
    
    .full-pricing-item.service-item .item-action-buttons {
        width: 100%;
    }
    
    .full-pricing-item:not(.service-item) .item-action-buttons {
        width: 100%;
    }
    
    @media (max-width: 768px) {
        .btn-service-detail,
        .btn-quick-book-full {
            font-size: 12px;
            padding: 8px 10px;
        }
        
        .item-action-buttons {
            flex-direction: column;
            width: 100%;
        }
    }
`;

// Thêm CSS vào head
if (!document.getElementById('serviceDetailButtonCSS')) {
    const style = document.createElement('style');
    style.id = 'serviceDetailButtonCSS';
    style.textContent = serviceDetailButtonCSS;
    document.head.appendChild(style);
}

// Hàm tìm và mở chi tiết dịch vụ từ bảng giá
function showServiceDetailFromPricing(serviceTitle) {
    // Đóng modal bảng giá
    closeFullPricingPage();
    
    // Tìm service tương ứng
    const serviceMatch = findServiceFromPricing(serviceTitle);
    
    if (serviceMatch) {
        // Mở popup dịch vụ sau 300ms để modal bảng giá đóng xong
        setTimeout(() => {
            showServiceDetail(serviceMatch.id);
        }, 300);
    } else {
        // Nếu không tìm thấy, hiển thị thông báo và mở modal bảng giá lại
        setTimeout(() => {
            alert('Không tìm thấy thông tin chi tiết cho dịch vụ này. Vui lòng liên hệ để biết thêm thông tin.');
            openFullPricingPage();
        }, 300);
    }
}

// Cập nhật hàm findServiceFromPricing để tìm chính xác hơn
function findServiceFromPricing(pricingTitle) {
    const services = servicesData.services || {};
    
    // Chuẩn hóa tiêu đề để so sánh
    const normalizeText = (text) => {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')  // Xóa ký tự đặc biệt
            .replace(/\s+/g, ' ')     // Chuẩn hóa khoảng trắng
            .trim();
    };
    
    const normalizedPricingTitle = normalizeText(pricingTitle);
    
    // 1. Tìm exact match (chính xác)
    for (const [id, service] of Object.entries(services)) {
        const serviceTitle = service.title || '';
        const normalizedServiceTitle = normalizeText(serviceTitle);
        
        if (normalizedServiceTitle === normalizedPricingTitle) {
            return { id, service };
        }
    }
    
    // 2. Tìm partial match (một phần)
    for (const [id, service] of Object.entries(services)) {
        const serviceTitle = service.title || '';
        const normalizedServiceTitle = normalizeText(serviceTitle);
        
        // Nếu tiêu đề pricing chứa tiêu đề service hoặc ngược lại
        if (normalizedPricingTitle.includes(normalizedServiceTitle) ||
            normalizedServiceTitle.includes(normalizedPricingTitle)) {
            return { id, service };
        }
    }
    
    // 3. Tìm theo keyword mapping
    const keywordMapping = {
        // Từ khóa pricing -> Từ khóa service
        'limousine': ['limousine', 'xe vip', 'luxury'],
        'xe 16': ['16 chỗ', 'ford transit', 'limousine'],
        'xe 4': ['4 chỗ', 'sedan', 'vinfast'],
        'xe 7': ['7 chỗ', 'suv', 'innova'],
        'đưa đón sân bay': ['sân bay', 'airport'],
        'tour': ['tour', 'du lịch'],
        'cưới hỏi': ['cưới', 'đám cưới'],
        'team building': ['team building', 'doanh nghiệp'],
        'thương mại': ['thương mại', 'doanh nghiệp'],
        'du khách': ['du khách', 'tourist']
    };
    
    // Kiểm tra từng keyword
    for (const [pricingKeyword, serviceKeywords] of Object.entries(keywordMapping)) {
        if (normalizedPricingTitle.includes(pricingKeyword)) {
            // Tìm service có chứa keyword tương ứng
            for (const [id, service] of Object.entries(services)) {
                const serviceTitle = service.title || '';
                const normalizedServiceTitle = normalizeText(serviceTitle);
                
                for (const serviceKeyword of serviceKeywords) {
                    if (normalizedServiceTitle.includes(serviceKeyword)) {
                        return { id, service };
                    }
                }
            }
        }
    }
    
    // 4. Tìm theo description (fallback)
    for (const [id, service] of Object.entries(services)) {
        const serviceDesc = service.description || '';
        const normalizedServiceDesc = normalizeText(serviceDesc);
        
        // Nếu description service chứa keyword từ pricing
        for (const word of normalizedPricingTitle.split(' ')) {
            if (word.length > 3 && normalizedServiceDesc.includes(word)) {
                return { id, service };
            }
        }
    }
    
    return null;
}

// Hàm hỗ trợ mới
function dismissWarning() {
    const warningBanner = document.getElementById('warningBanner');
    if (warningBanner) {
        warningBanner.style.opacity = '0';
        warningBanner.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (warningBanner.parentNode) {
                warningBanner.style.display = 'none';
            }
        }, 300);
    }
}

function quickBook(serviceTitle) {
    // Đóng modal bảng giá nếu đang mở
    closeFullPricingPage();
    
    // Tạo data service để truyền sang form đặt xe
    const serviceData = {
        title: serviceTitle,
        timestamp: Date.now()
    };
    
    // Lưu service đã chọn vào sessionStorage
    sessionStorage.setItem('selectedService', JSON.stringify(serviceData));
    
    // Tạo thông báo toast
    showQuickBookToast(serviceTitle);
    
    // Chuyển đến phần booking với animation
    setTimeout(() => {
        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
            // Cuộn đến section booking
            bookingSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Thêm hiệu ứng highlight
            bookingSection.classList.add('highlight-booking');
            
            // Tự động focus vào field dịch vụ nếu có
            setTimeout(() => {
                const serviceSelect = document.querySelector('.form-select[name="service"]');
                if (serviceSelect) {
                    serviceSelect.focus();
                    
                    // Tìm option chứa serviceTitle
                    const options = Array.from(serviceSelect.options);
                    const matchingOption = options.find(option => 
                        option.text.includes(serviceTitle) || 
                        serviceTitle.includes(option.text)
                    );
                    
                    if (matchingOption) {
                        serviceSelect.value = matchingOption.value;
                    }
                }
                
                // Xóa highlight sau 3 giây
                setTimeout(() => {
                    bookingSection.classList.remove('highlight-booking');
                }, 3000);
                
            }, 500);
        } else {
            // Nếu không tìm thấy booking section, mở tab booking
            const bookingTab = document.querySelector('.tab-item[href="#booking"]');
            if (bookingTab) {
                bookingTab.click();
            }
        }
    }, 800);
}

// Hiển thị thông báo toast
function showQuickBookToast(serviceTitle) {
    // Kiểm tra xem toast đã tồn tại chưa
    let toast = document.getElementById('quickBookToast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'quickBookToast';
        toast.className = 'quick-book-toast';
        document.body.appendChild(toast);
        
        // Thêm CSS cho toast
        if (!document.getElementById('toastCSS')) {
            const style = document.createElement('style');
            style.id = 'toastCSS';
            style.textContent = `
                .quick-book-toast {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: rgba(30, 30, 30, 0.95);
                    border: 2px solid var(--champagne);
                    border-radius: 12px;
                    padding: 15px 20px;
                    color: var(--text-primary);
                    font-size: 14px;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    max-width: 350px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    transform: translateX(400px);
                    opacity: 0;
                    transition: all 0.4s ease;
                }
                
                .quick-book-toast.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .toast-icon {
                    width: 36px;
                    height: 36px;
                    background: var(--gradient-gold);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-black);
                    font-size: 18px;
                    flex-shrink: 0;
                }
                
                .toast-content {
                    flex: 1;
                }
                
                .toast-title {
                    font-weight: 700;
                    margin-bottom: 4px;
                    color: var(--champagne);
                }
                
                .toast-message {
                    color: var(--text-secondary);
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .toast-close {
                    background: transparent;
                    border: none;
                    color: var(--text-tertiary);
                    font-size: 16px;
                    cursor: pointer;
                    padding: 5px;
                    transition: all 0.2s ease;
                }
                
                .toast-close:hover {
                    color: var(--text-primary);
                }
                
                @media (max-width: 768px) {
                    .quick-book-toast {
                        top: 80px;
                        right: 15px;
                        left: 15px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Cập nhật nội dung toast
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-calendar-check"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">Đã chọn dịch vụ</div>
            <div class="toast-message">${serviceTitle.substring(0, 50)}${serviceTitle.length > 50 ? '...' : ''}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.classList.remove('show')">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Hiển thị toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// CSS thêm cho highlight booking section
const highlightCSS = `
    .highlight-booking {
        animation: highlightPulse 2s ease;
        position: relative;
    }
    
    .highlight-booking::before {
        content: '';
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border: 3px solid var(--champagne);
        border-radius: 20px;
        animation: borderPulse 2s ease;
        pointer-events: none;
        z-index: 1;
    }
    
    @keyframes highlightPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.01); }
        100% { transform: scale(1); }
    }
    
    @keyframes borderPulse {
        0% { opacity: 0; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.02); }
        100% { opacity: 0; transform: scale(1); }
    }
`;

// Thêm CSS vào head nếu chưa có
if (!document.getElementById('highlightCSS')) {
    const style = document.createElement('style');
    style.id = 'highlightCSS';
    style.textContent = highlightCSS;
    document.head.appendChild(style);
}

// Cập nhật lại hàm closeFullPricingPage để xóa toast nếu có
const originalCloseFullPricingPage = closeFullPricingPage;
closeFullPricingPage = function() {
    const modal = document.getElementById('fullPricingModal');
    if (modal) {
        modal.remove();
    }
    
    // Xóa toast nếu có
    const toast = document.getElementById('quickBookToast');
    if (toast) {
        toast.remove();
    }
};

// Thêm hàm để xử lý khi người dùng vào section booking
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra nếu có service đã chọn từ trước
    const selectedService = sessionStorage.getItem('selectedService');
    if (selectedService) {
        try {
            const serviceData = JSON.parse(selectedService);
            const bookingSection = document.getElementById('booking');
            
            // Nếu đang ở section booking, tự động điền service
            if (bookingSection && isElementInViewport(bookingSection)) {
                const serviceSelect = document.querySelector('.form-select[name="service"]');
                if (serviceSelect) {
                    // Tìm option phù hợp
                    const options = Array.from(serviceSelect.options);
                    const matchingOption = options.find(option => 
                        option.text.includes(serviceData.title) || 
                        serviceData.title.includes(option.text)
                    );
                    
                    if (matchingOption) {
                        serviceSelect.value = matchingOption.value;
                        showQuickBookToast(serviceData.title);
                    }
                }
                
                // Xóa dữ liệu sau khi xử lý
                sessionStorage.removeItem('selectedService');
            }
        } catch (e) {
            console.error('Error parsing selected service:', e);
            sessionStorage.removeItem('selectedService');
        }
    }
});

// Hàm kiểm tra element có trong viewport không
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// CSS mới cho modal
function getFullPricingCSS() {
    return `
        .full-pricing-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0;
            animation: fadeIn 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .full-pricing-container {
            width: 100%;
            height: 100%;
            max-width: 1000px;
            max-height: 100vh;
            background: var(--primary-black);
            display: flex;
            flex-direction: column;
            animation: slideUp 0.3s ease;
            border-radius: 0;
        }
        
        /* Header mini */
        .full-pricing-header-mini {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: rgba(20, 20, 20, 0.98);
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 100;
            flex-shrink: 0;
            height: 70px;
            box-sizing: border-box;
        }
        
        .mini-header-left {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .mini-header-title {
            font-size: 18px;
            color: var(--champagne);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        }
        
        .mini-header-info {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: var(--text-tertiary);
        }
        
        .item-count {
            background: rgba(212, 175, 55, 0.1);
            color: var(--light-champagne);
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: 600;
        }
        
        .header-divider {
            opacity: 0.5;
        }
        
        .update-info {
            opacity: 0.8;
        }
        
        .btn-close-mini {
            width: 40px;
            height: 40px;
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 10px;
            color: var(--text-primary);
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .btn-close-mini:hover {
            background: rgba(212, 175, 55, 0.2);
            transform: rotate(90deg);
        }
        
        /* Warning banner */
        .pricing-warning-banner {
            padding: 10px 20px;
            background: linear-gradient(90deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%);
            border-bottom: 1px solid rgba(255, 152, 0, 0.2);
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        
        .warning-content {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        
        .warning-content i {
            color: #FF9800;
            font-size: 16px;
            margin-top: 2px;
            flex-shrink: 0;
        }
        
        .warning-text {
            color: var(--text-secondary);
            font-size: 13px;
            line-height: 1.4;
            flex: 1;
        }
        
        .warning-text strong {
            color: #FF9800;
        }
        
        .btn-dismiss-warning {
            background: transparent;
            border: none;
            color: var(--text-tertiary);
            font-size: 14px;
            cursor: pointer;
            padding: 5px;
            margin-left: 10px;
            transition: all 0.2s ease;
        }
        
        .btn-dismiss-warning:hover {
            color: var(--text-primary);
        }
        
        /* Main content */
        .full-pricing-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: var(--primary-black);
        }
        
        /* Category section */
        .pricing-category-section {
            margin-bottom: 25px;
        }
        
        .category-title-mini {
            font-size: 16px;
            color: var(--text-primary);
            margin: 0 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        }
        
        .category-count-mini {
            background: rgba(212, 175, 55, 0.1);
            color: var(--champagne);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 700;
        }
        
        /* Pricing items */
        .full-pricing-item {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 15px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
        }
        
        .full-pricing-item:hover {
            background: rgba(212, 175, 55, 0.05);
            border-color: rgba(212, 175, 55, 0.2);
        }
        
        .item-main-info {
            margin-bottom: 15px;
        }
        
        .item-header-mini {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            gap: 10px;
        }
        
        .item-title-mini {
            font-size: 15px;
            color: var(--text-primary);
            margin: 0;
            line-height: 1.4;
            flex: 1;
            font-weight: 600;
        }
        
        .item-service-badge {
            background: rgba(212, 175, 55, 0.1);
            color: var(--champagne);
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            flex-shrink: 0;
        }
        
        .item-desc-mini {
            color: var(--text-tertiary);
            font-size: 13px;
            line-height: 1.5;
        }
        
        .item-price-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .item-pricing-mini {
            flex: 1;
        }
        
        .price-discounted {
            margin-bottom: 4px;
        }
        
        .price-discounted del {
            color: var(--text-tertiary);
            font-size: 12px;
        }
        
        .price-current-mini {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }
        
        .price-label {
            color: var(--text-secondary);
            font-size: 13px;
        }
        
        .price-value {
            font-size: 18px;
            color: var(--champagne);
            font-weight: 700;
        }
        
        .item-action-buttons {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
        }
        
        .btn-quick-book,
        .btn-quick-quote {
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 1px solid transparent;
            white-space: nowrap;
        }
        
        .btn-quick-book {
            background: rgba(76, 175, 80, 0.1);
            color: #4CAF50;
            border-color: rgba(76, 175, 80, 0.3);
        }
        
        .btn-quick-book:hover {
            background: rgba(76, 175, 80, 0.2);
            transform: translateY(-2px);
        }
        
        .btn-quick-quote {
            background: rgba(212, 175, 55, 0.1);
            color: var(--champagne);
            border-color: rgba(212, 175, 55, 0.3);
        }
        
        .btn-quick-quote:hover {
            background: rgba(212, 175, 55, 0.2);
            transform: translateY(-2px);
        }
        
        /* Footer mini với icon */
        .full-pricing-footer-mini {
            padding: 15px 20px;
            background: rgba(20, 20, 20, 0.98);
            border-top: 1px solid rgba(212, 175, 55, 0.2);
            backdrop-filter: blur(10px);
            position: sticky;
            bottom: 0;
            z-index: 100;
            flex-shrink: 0;
            height: 70px;
            box-sizing: border-box;
        }
        
        .footer-actions {
            display: flex;
            justify-content: space-around;
            align-items: center;
            height: 100%;
            gap: 5px;
        }
        
        .footer-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 8px 12px;
            border-radius: 10px;
            flex: 1;
            max-width: 80px;
        }
        
        .footer-btn:hover {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-primary);
            transform: translateY(-2px);
        }
        
        .btn-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .call-btn .btn-icon {
            background: rgba(33, 150, 243, 0.1);
            color: #2196F3;
        }
        
        .zalo-btn .btn-icon {
            background: rgba(0, 104, 255, 0.1);
            color: #0068FF;
        }
        
        .whatsapp-btn .btn-icon {
            background: rgba(37, 211, 102, 0.1);
            color: #25D366;
        }
        
        .book-btn .btn-icon {
            background: rgba(156, 39, 176, 0.1);
            color: #9C27B0;
        }
        
        .btn-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Scrollbar styling */
        .full-pricing-content::-webkit-scrollbar {
            width: 6px;
        }
        
        .full-pricing-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
        }
        
        .full-pricing-content::-webkit-scrollbar-thumb {
            background: var(--champagne);
            border-radius: 3px;
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .full-pricing-container {
                max-height: 100vh;
                border-radius: 0;
                width: 100%;
            }
            
            .full-pricing-content {
                padding: 15px;
            }
            
            .item-price-actions {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .item-action-buttons {
                width: 100%;
            }
            
            .btn-quick-book,
            .btn-quick-quote {
                flex: 1;
                justify-content: center;
            }
            
            .footer-btn {
                padding: 6px 8px;
                max-width: 70px;
            }
            
            .btn-icon {
                width: 28px;
                height: 28px;
                font-size: 14px;
            }
            
            .btn-label {
                font-size: 10px;
            }
        }
        
        @media (max-width: 480px) {
            .full-pricing-header-mini,
            .full-pricing-footer-mini {
                height: 60px;
                padding: 10px 15px;
            }
            
            .mini-header-title {
                font-size: 16px;
            }
            
            .mini-header-info {
                font-size: 11px;
            }
            
            .pricing-warning-banner {
                padding: 8px 15px;
            }
            
            .warning-text {
                font-size: 12px;
            }
            
            .item-title-mini {
                font-size: 14px;
            }
            
            .price-value {
                font-size: 16px;
            }
            
            .btn-quick-book,
            .btn-quick-quote {
                padding: 8px 10px;
                font-size: 12px;
            }
        }
    `;
}

// Đóng trang bảng giá
function closeFullPricingPage() {
    const modal = document.getElementById('fullPricingModal');
    if (modal) {
        modal.remove();
    }
}


// Khởi tạo khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    initPricing();
});