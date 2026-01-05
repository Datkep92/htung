// ===== ADMIN PRICING FUNCTIONS =====
let pricingStore = { prices: [] };
let servicesStore = { services: {} };

// Load all data for pricing management
async function loadAllDataForPricing() {
    try {
        // Load pricing data
        const pricing = await fetchFromFirebase('pricing');
        if (pricing && pricing.prices) {
            pricingStore = pricing;
        } else {
            const localData = localStorage.getItem('luxurymove_pricing');
            pricingStore = localData ? JSON.parse(localData) : { prices: getDefaultPricing(), last_updated: new Date().toISOString() };
        }
        
        // Load services data
        const services = await fetchFromFirebase('services');
        if (services && services.services) {
            servicesStore = services;
        } else {
            const localServices = localStorage.getItem('luxurymove_services');
            servicesStore = localServices ? JSON.parse(localServices) : { services: {} };
        }
        
        renderPricingAdmin();
    } catch (error) {
        console.error("Error loading data for pricing:", error);
        pricingStore = { prices: getDefaultPricing(), last_updated: new Date().toISOString() };
        servicesStore = { services: {} };
        renderPricingAdmin();
    }
}

// Render pricing management UI
function renderPricingAdmin() {
    const container = document.getElementById('pricingList');
    if (!container) return;
    
    const pricingItems = pricingStore.prices || [];
    const services = servicesStore.services || {};
    
    let html = '';
    
    // SECTION 1: CUSTOM PRICING ITEMS
    if (pricingItems.length > 0) {
        html += `
            <div class="pricing-section-header">
                <h3><i class="fas fa-plus-circle"></i> Bảng Giá Tùy Chỉnh</h3>
                <small>Các mục giá thủ công</small>
            </div>
        `;
        
        pricingItems.sort((a, b) => (a.order || 99) - (b.order || 99)).forEach((price, index) => {
            html += `
                <div class="grid-item pricing-item" onclick="openPricingEditor('${price.id || index}')">
                    <div class="grid-item-header">
                        <h3 class="grid-item-title">${price.title}</h3>
                        <div class="grid-item-actions">
                            <button class="action-btn" onclick="openPricingEditor('${price.id || index}'); event.stopPropagation();">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn" onclick="deletePricingItem('${price.id || index}'); event.stopPropagation();">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="pricing-preview">
                        <div class="price-category">${price.category || 'Chưa phân loại'}</div>
                        <div class="price-values">
                            ${price.original_price ? `
                                <span class="original-price">${price.original_price}</span>
                            ` : ''}
                            ${price.current_price ? `
                                <span class="current-price">${price.current_price}</span>
                            ` : ''}
                        </div>
                        ${price.description ? `<p>${price.description}</p>` : ''}
                        ${price.note ? `<div class="price-note"><i class="fas fa-info-circle"></i> ${price.note}</div>` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    // SECTION 2: SERVICES PRICING
    if (Object.keys(services).length > 0) {
        html += `
            <div class="pricing-section-header" style="margin-top: 40px;">
                <h3><i class="fas fa-car"></i> Giá Dịch Vụ</h3>
                <small>Lấy từ danh sách dịch vụ, có thể chỉnh sửa ở đây</small>
            </div>
        `;
        
        Object.entries(services).forEach(([serviceId, service]) => {
            // Kiểm tra nếu dịch vụ có pricing
            if (service.pricing && service.pricing.length > 0) {
                service.pricing.forEach((priceItem, priceIndex) => {
                    const itemId = `service_${serviceId}_${priceIndex}`;
                    html += `
                        <div class="grid-item service-pricing-item" onclick="openServicePricingEditor('${serviceId}', ${priceIndex})">
                            <div class="grid-item-header">
                                <h3 class="grid-item-title">
                                    <i class="fas fa-car" style="color: var(--champagne); margin-right: 8px;"></i>
                                    ${service.title}${priceItem.label ? ` - ${priceItem.label}` : ''}
                                </h3>
                                <div class="grid-item-actions">
                                    <button class="action-btn" onclick="openServicePricingEditor('${serviceId}', ${priceIndex}); event.stopPropagation();">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn" onclick="deleteServicePrice('${serviceId}', ${priceIndex}); event.stopPropagation();">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="pricing-preview">
                                <div class="price-category">Dịch Vụ</div>
                                <div class="price-values">
                                    <span class="current-price">${priceItem.price || 'Liên hệ'}</span>
                                </div>
                                <p>${service.description?.substring(0, 80) || 'Chưa có mô tả'}...</p>
                                <div class="price-note">
                                    <i class="fas fa-link"></i> ID dịch vụ: ${serviceId}
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                // Nếu dịch vụ không có pricing
                html += `
                    <div class="grid-item service-pricing-item" onclick="openServicePricingEditor('${serviceId}', 0)">
                        <div class="grid-item-header">
                            <h3 class="grid-item-title">
                                <i class="fas fa-car" style="color: var(--text-tertiary); margin-right: 8px;"></i>
                                ${service.title}
                            </h3>
                            <div class="grid-item-actions">
                                <button class="action-btn" onclick="openServicePricingEditor('${serviceId}', 0); event.stopPropagation();">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="pricing-preview">
                            <div class="price-category">Dịch Vụ</div>
                            <div class="price-values">
                                <span class="current-price" style="color: var(--text-tertiary);">Chưa có giá</span>
                            </div>
                            <p>${service.description?.substring(0, 80) || 'Chưa có mô tả'}...</p>
                            <div class="price-note">
                                <i class="fas fa-exclamation-circle"></i> Cần thêm bảng giá cho dịch vụ này
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }
    
    if (!html) {
        html = '<div class="empty-state">Chưa có bảng giá nào. Hãy thêm bảng giá tùy chỉnh hoặc kiểm tra dịch vụ.</div>';
    }
    
    container.innerHTML = html;
}

// Mở editor cho pricing item (custom)
function openPricingEditor(id = null) {
    currentEditorType = 'pricing';
    currentEditingId = id;
    
    document.getElementById('editorModalTitle').textContent = id ? 'Chỉnh sửa Bảng Giá' : 'Thêm Mục Giá Mới';
    document.getElementById('deleteItemBtn').style.display = id ? 'block' : 'none';
    
    loadPricingForm(id);
    showModal('editorModal');
}

// Mở editor cho service pricing
function openServicePricingEditor(serviceId, priceIndex) {
    currentEditorType = 'service_pricing';
    currentEditingId = `${serviceId}_${priceIndex}`;
    
    document.getElementById('editorModalTitle').textContent = 'Chỉnh sửa Giá Dịch Vụ';
    document.getElementById('deleteItemBtn').style.display = priceIndex >= 0 ? 'block' : 'none';
    
    loadServicePricingForm(serviceId, priceIndex);
    showModal('editorModal');
}

// Form cho pricing item (custom)
function getPricingForm(data = null, id = null) {
    const categories = ['Sân Bay Cam Ranh', 'Tour Du Lịch', 'Liên Tỉnh', 'Nội Thành', 'Dịch Vụ Đặc Biệt', 'Khác'];
    
    return `
        <input type="hidden" id="editId" value="${id || ''}">
        <input type="hidden" id="editSource" value="pricing">
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Danh mục *</label>
                <select id="editPricingCategory" class="form-input" required>
                    <option value="">Chọn danh mục</option>
                    ${categories.map(cat => `
                        <option value="${cat}" ${data?.category === cat ? 'selected' : ''}>${cat}</option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Thứ tự hiển thị</label>
                <input type="number" id="editPricingOrder" class="form-input" 
                       value="${data?.order || 1}" min="1" max="100">
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Tiêu đề *</label>
            <input type="text" id="editPricingTitle" class="form-input" 
                   value="${data?.title || ''}" placeholder="VD: Phan Rang ⇄ Sân Bay Cam Ranh" required>
        </div>
        
        <div class="form-group">
            <label class="form-label">Mô tả ngắn</label>
            <input type="text" id="editPricingDescription" class="form-input" 
                   value="${data?.description || ''}" placeholder="VD: Đưa đón tận nơi, hỗ trợ hành lý">
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Giá gốc (nếu có)</label>
                <input type="text" id="editPricingOriginal" class="form-input" 
                       value="${data?.original_price || ''}" placeholder="VD: 800.000 VND">
                <small>Để trống nếu không có giá gốc</small>
            </div>
            <div class="form-group">
                <label class="form-label">Giá hiện tại *</label>
                <input type="text" id="editPricingCurrent" class="form-input" 
                       value="${data?.current_price || ''}" placeholder="VD: 500.000 VND" required>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Ghi chú thêm</label>
            <input type="text" id="editPricingNote" class="form-input" 
                   value="${data?.note || ''}" placeholder="VD: Giá cho xe 4-7 chỗ">
        </div>
    `;
}

// Form cho service pricing
function getServicePricingForm(serviceId, priceIndex) {
    const service = servicesStore.services[serviceId];
    const priceItem = service?.pricing?.[priceIndex] || { label: '', price: '' };
    
    return `
        <input type="hidden" id="editServiceId" value="${serviceId}">
        <input type="hidden" id="editPriceIndex" value="${priceIndex}">
        <input type="hidden" id="editSource" value="service_pricing">
        
        <div class="form-group" style="margin-bottom: 20px; padding: 15px; background: rgba(212, 175, 55, 0.05); border-radius: 8px;">
            <h4 style="color: var(--champagne); margin-bottom: 10px;">
                <i class="fas fa-car"></i> Dịch vụ: ${service?.title || 'Không tìm thấy'}
            </h4>
            <p style="color: var(--text-secondary); font-size: 14px;">
                ${service?.description?.substring(0, 120) || 'Chưa có mô tả'}...
            </p>
        </div>
        
        <div class="form-group">
            <label class="form-label">Tên gói giá *</label>
            <input type="text" id="editServicePriceLabel" class="form-input" 
                   value="${priceItem.label || ''}" placeholder="VD: Gói cơ bản, Gói VIP, Giá 1 chiều">
            <small>Để trống nếu chỉ có một mức giá</small>
        </div>
        
        <div class="form-group">
            <label class="form-label">Giá *</label>
            <input type="text" id="editServicePriceValue" class="form-input" 
                   value="${priceItem.price || ''}" placeholder="VD: 500.000 VND, Liên hệ" required>
        </div>
        
        <div class="form-group">
            <label class="form-label">Ghi chú (hiển thị trong bảng giá)</label>
            <input type="text" id="editServicePriceNote" class="form-input" 
                   placeholder="VD: Áp dụng cho xe 4-7 chỗ, giá khuyến mãi">
        </div>
    `;
}

// Load form tương ứng
function loadPricingForm(id = null) {
    const container = document.getElementById('editorModalBody');
    
    let data = null;
    if (id) {
        const prices = pricingStore.prices || [];
        data = prices.find(item => item.id === id || item.id === parseInt(id));
    }
    
    container.innerHTML = getPricingForm(data, id);
}

function loadServicePricingForm(serviceId, priceIndex) {
    const container = document.getElementById('editorModalBody');
    container.innerHTML = getServicePricingForm(serviceId, priceIndex);
}

// Get form data
function getPricingFormData() {
    const source = document.getElementById('editSource')?.value;
    
    if (source === 'service_pricing') {
        return getServicePricingFormData();
    }
    
    // Custom pricing form
    const id = document.getElementById('editId')?.value.trim() || 'price_' + Date.now();
    const title = document.getElementById('editPricingTitle')?.value.trim();
    const currentPrice = document.getElementById('editPricingCurrent')?.value.trim();
    const category = document.getElementById('editPricingCategory')?.value;
    
    if (!title || !currentPrice || !category) {
        showStatus('Vui lòng nhập tiêu đề, giá hiện tại và chọn danh mục', 'error');
        return null;
    }
    
    return {
        type: 'custom',
        id: id,
        data: {
            id: id,
            category: category,
            title: title,
            description: document.getElementById('editPricingDescription')?.value.trim() || '',
            original_price: document.getElementById('editPricingOriginal')?.value.trim() || '',
            current_price: currentPrice,
            note: document.getElementById('editPricingNote')?.value.trim() || '',
            order: parseInt(document.getElementById('editPricingOrder')?.value) || 1
        }
    };
}

function getServicePricingFormData() {
    const serviceId = document.getElementById('editServiceId')?.value;
    const priceIndex = parseInt(document.getElementById('editPriceIndex')?.value) || 0;
    const priceValue = document.getElementById('editServicePriceValue')?.value.trim();
    
    if (!serviceId || !priceValue) {
        showStatus('Vui lòng nhập giá cho dịch vụ', 'error');
        return null;
    }
    
    const service = servicesStore.services[serviceId];
    if (!service) {
        showStatus('Không tìm thấy dịch vụ', 'error');
        return null;
    }
    
    const priceLabel = document.getElementById('editServicePriceLabel')?.value.trim();
    const priceNote = document.getElementById('editServicePriceNote')?.value.trim();
    
    return {
        type: 'service',
        serviceId: serviceId,
        priceIndex: priceIndex,
        data: {
            label: priceLabel,
            price: priceValue,
            note: priceNote
        }
    };
}

// Save data
async function savePricingData(formData) {
    if (formData.type === 'service') {
        await saveServicePricing(formData);
    } else {
        await saveCustomPricing(formData);
    }
}

async function saveCustomPricing(formData) {
    if (!pricingStore.prices) pricingStore.prices = [];
    
    const index = pricingStore.prices.findIndex(item => item.id === formData.id);
    
    if (index !== -1) {
        pricingStore.prices[index] = formData.data;
    } else {
        pricingStore.prices.push(formData.data);
    }
    
    // Sort by order
    pricingStore.prices.sort((a, b) => (a.order || 99) - (b.order || 99));
    pricingStore.last_updated = new Date().toISOString();
    
    // Save to Firebase
    await saveToFirebase('pricing', pricingStore);
    
    // Update UI
    renderPricingAdmin();
    
    // Trigger update on website
    window.dispatchEvent(new Event('pricingUpdated'));
    
    showStatus(`Đã lưu bảng giá: ${formData.data.title}`, 'success');
}

async function saveServicePricing(formData) {
    const { serviceId, priceIndex, data } = formData;
    
    if (!servicesStore.services[serviceId]) {
        showStatus('Không tìm thấy dịch vụ', 'error');
        return;
    }
    
    // Initialize pricing array if not exists
    if (!servicesStore.services[serviceId].pricing) {
        servicesStore.services[serviceId].pricing = [];
    }
    
    // Update or add pricing item
    if (priceIndex >= 0 && servicesStore.services[serviceId].pricing[priceIndex]) {
        servicesStore.services[serviceId].pricing[priceIndex] = data;
    } else {
        servicesStore.services[serviceId].pricing.push(data);
    }
    
    // Update last_updated
    servicesStore.last_updated = new Date().toISOString();
    
    // Save to Firebase
    await saveToFirebase('services', servicesStore);
    
    // Update local storage
    localStorage.setItem('luxurymove_services', JSON.stringify(servicesStore));
    
    // Update UI
    renderPricingAdmin();
    
    // Trigger updates
    window.dispatchEvent(new Event('servicesUpdated'));
    window.dispatchEvent(new Event('pricingUpdated'));
    
    showStatus(`Đã cập nhật giá cho dịch vụ: ${servicesStore.services[serviceId].title}`, 'success');
}

// Delete functions
async function deletePricingItem(id) {
    if (!confirm('Bạn có chắc muốn xóa mục bảng giá này?')) return;
    
    if (pricingStore.prices) {
        pricingStore.prices = pricingStore.prices.filter(item => item.id !== id);
        pricingStore.last_updated = new Date().toISOString();
        
        await saveToFirebase('pricing', pricingStore);
        renderPricingAdmin();
        
        window.dispatchEvent(new Event('pricingUpdated'));
        showStatus('Đã xóa mục bảng giá', 'success');
    }
    
    closeEditor();
}

async function deleteServicePrice(serviceId, priceIndex) {
    if (!confirm('Bạn có chắc muốn xóa giá này khỏi dịch vụ?')) return;
    
    if (servicesStore.services[serviceId] && servicesStore.services[serviceId].pricing) {
        servicesStore.services[serviceId].pricing.splice(priceIndex, 1);
        servicesStore.last_updated = new Date().toISOString();
        
        await saveToFirebase('services', servicesStore);
        renderPricingAdmin();
        
        window.dispatchEvent(new Event('servicesUpdated'));
        window.dispatchEvent(new Event('pricingUpdated'));
        showStatus('Đã xóa giá dịch vụ', 'success');
    }
}

// Add pricing tab to admin
function addPricingTabToAdmin() {
    // Add to tabs
    const tabs = document.querySelector('.tabs');
    if (tabs && !document.querySelector('.pricing-tab-btn')) {
        const pricingTab = document.createElement('button');
        pricingTab.className = 'tab-btn pricing-tab-btn';
        pricingTab.setAttribute('onclick', "showTab('pricing')");
        pricingTab.innerHTML = '<i class="fas fa-tags"></i> Bảng Giá';
        tabs.appendChild(pricingTab);
    }
    
    // Add to tab contents
    const editorSection = document.getElementById('editorSection');
    if (editorSection && !document.getElementById('pricingTab')) {
        const pricingTabContent = document.createElement('div');
        pricingTabContent.id = 'pricingTab';
        pricingTabContent.className = 'tab-content';
        pricingTabContent.innerHTML = `
            <div class="admin-header">
                <h2 class="modal-title">Quản lý Bảng Giá</h2>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" onclick="loadAllDataForPricing()">
                        <i class="fas fa-sync-alt"></i> Làm mới
                    </button>
                    <button class="btn btn-primary" onclick="openPricingEditor()">
                        <i class="fas fa-plus"></i> Thêm bảng giá
                    </button>
                </div>
            </div>
            <div id="pricingList" class="grid"></div>
        `;
        
        const servicesTab = document.getElementById('servicesTab');
        if (servicesTab) {
            servicesTab.insertAdjacentElement('afterend', pricingTabContent);
        }
    }
    
    // Modify saveItem function
    const originalSaveItem = window.saveItem;
    window.saveItem = function() {
        if (currentEditorType === 'pricing' || currentEditorType === 'service_pricing') {
            const formData = getPricingFormData();
            if (!formData) return;
            savePricingData(formData);
            closeEditor();
            showTab('pricing');
            return;
        }
        originalSaveItem();
    };
    
    // Modify deleteItem function
    const originalDeleteItem = window.deleteItem;
    window.deleteItem = function(type = null, id = null) {
        if (type === 'pricing' || (!type && currentEditorType === 'pricing')) {
            if (!id) id = currentEditingId;
            deletePricingItem(id);
            return;
        }
        originalDeleteItem(type, id);
    };
}

// Initialize pricing in admin
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('loginSection')) {
        setTimeout(() => {
            addPricingTabToAdmin();
        }, 1000);
    }
});