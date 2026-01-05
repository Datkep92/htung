// ===== FIREBASE CONFIG =====
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
const DEFAULT_ADMIN_TOKEN = '123123';
let adminToken = DEFAULT_ADMIN_TOKEN;
let currentEditorType = null;
let currentEditingId = null;
let database = null;
let dataStore = {
    services: { services: {} },
    experiences: { experiences: {} },
    gallery: { featured: [] },
    blog: { posts: {} }
};
// Thêm vào đầu file hoặc trong phần initialization
function initExperienceForm() {
    const benefitsInput = document.getElementById('editExpBenefits');
    if (benefitsInput) {
        const currentValue = benefitsInput.value;
        if (!currentValue || currentValue.trim() === '') {
            benefitsInput.value = '[]';
        }
    }
}

// Gọi hàm này khi mở editor
function openEditor(type, id = null) {
    currentEditorType = type;
    currentEditingId = id;
    
    const titles = {
        'service': id ? 'Chỉnh sửa Dịch vụ' : 'Thêm Dịch vụ mới',
        'experience': id ? 'Chỉnh sửa Trải nghiệm' : 'Thêm Trải nghiệm mới',
        'gallery': id ? 'Chỉnh sửa Ảnh' : 'Thêm Ảnh mới',
        'blog': id ? 'Chỉnh sửa Bài viết' : 'Thêm Bài viết mới'
    };
    
    document.getElementById('editorModalTitle').textContent = titles[type];
    document.getElementById('deleteItemBtn').style.display = id ? 'block' : 'none';
    
    loadEditorForm(type, id);
    
    // Khởi tạo form cho experience
    if (type === 'experience') {
        setTimeout(initExperienceForm, 100);
    }
    
    showModal('editorModal');
}
// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    const savedToken = localStorage.getItem('luxurymove_admin_token');
    if (savedToken === adminToken) {
        showEditorSection();
        initializeFirebase();
    }
});
// ===== HELPER FUNCTIONS FOR EXPERIENCE EDITOR =====
function previewExpImage() {
    const imageUrl = document.getElementById('editExpImage').value.trim();
    if (!imageUrl) {
        showStatus('Vui lòng nhập URL ảnh', 'error');
        return;
    }
    
    const preview = document.getElementById('expImagePreview');
    const img = preview.querySelector('img');
    img.src = imageUrl;
    preview.style.display = 'block';
}
// ===== FIREBASE INIT =====
function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        loadAllData();
    } catch (error) {
        console.error("Firebase initialization error:", error);
        showStatus('Không thể kết nối Firebase, sử dụng localStorage', 'warning');
        loadFromLocalStorage();
    }
}

// ===== DATA FUNCTIONS =====
async function fetchFromFirebase(path) {
    if (!database) return loadFromLocalStorage(path);
    
    try {
        const snapshot = await database.ref(path).once('value');
        const data = snapshot.val();
        if (data) {
            localStorage.setItem(`luxurymove_${path}`, JSON.stringify(data));
        }
        return data;
    } catch (error) {
        console.error(`Firebase fetch error (${path}):`, error.message);
        return loadFromLocalStorage(path);
    }
}

function loadFromLocalStorage(path) {
    try {
        const data = localStorage.getItem(`luxurymove_${path}`);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`LocalStorage load error (${path}):`, error);
        return null;
    }
}

async function saveToFirebase(path, data) {
    if (!database) {
        localStorage.setItem(`luxurymove_${path}`, JSON.stringify(data));
        return false;
    }
    
    try {
        await database.ref(path).set(data);
        localStorage.setItem(`luxurymove_${path}`, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Firebase save error (${path}):`, error.message);
        localStorage.setItem(`luxurymove_${path}`, JSON.stringify(data));
        showStatus('Đã lưu vào localStorage (Firebase lỗi)', 'warning');
        return false;
    }
}

// ===== ENHANCED LOGIN SYSTEM =====
function handleLogin() {
    const inputToken = document.getElementById('adminToken').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    if (!inputToken) {
        showStatus('Vui lòng nhập token admin', 'error');
        return;
    }
    
    // Kiểm tra token
    if (inputToken !== adminToken) {
        showStatus('Token không đúng', 'error');
        return;
    }
    
    // Lưu trạng thái đăng nhập
    if (rememberMe) {
        // Lưu với timestamp để kiểm tra hết hạn
        const loginData = {
            token: inputToken,
            timestamp: Date.now(),
            expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 ngày
        };
        localStorage.setItem('luxurymove_admin_login', JSON.stringify(loginData));
    } else {
        // Chỉ lưu session
        sessionStorage.setItem('luxurymove_admin_token', inputToken);
        localStorage.removeItem('luxurymove_admin_login');
    }
    
    // Cập nhật biến toàn cục
    adminToken = inputToken;
    
    // Hiển thị editor
    showEditorSection();
    initializeFirebase();
    showStatus('Đăng nhập thành công', 'success');
}

// Sửa hàm DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập
    checkAutoLogin();
});

function checkAutoLogin() {
    // Kiểm tra sessionStorage trước
    const sessionToken = sessionStorage.getItem('luxurymove_admin_token');
    if (sessionToken === adminToken) {
        adminToken = sessionToken;
        showEditorSection();
        initializeFirebase();
        return;
    }
    
    // Kiểm tra localStorage (remember me)
    const savedLogin = localStorage.getItem('luxurymove_admin_login');
    if (savedLogin) {
        try {
            const loginData = JSON.parse(savedLogin);
            const now = Date.now();
            
            // Kiểm tra hết hạn
            if (loginData.expires > now) {
                adminToken = loginData.token;
                showEditorSection();
                initializeFirebase();
                console.log('Auto-login successful');
                return;
            } else {
                // Xóa login đã hết hạn
                localStorage.removeItem('luxurymove_admin_login');
                console.log('Login expired');
            }
        } catch (e) {
            console.error('Error parsing login data:', e);
            localStorage.removeItem('luxurymove_admin_login');
        }
    }
    
    // Nếu không có login nào hợp lệ, hiển thị login section
    document.getElementById('loginSection').style.display = 'flex';
}

function showEditorSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('editorSection').style.display = 'block';
}

function logoutAdmin() {
    localStorage.removeItem('luxurymove_admin_token');
    window.location.reload();
}



function renderAllTabs() {
    renderServices();
    renderExperiences();
    renderGallery();
    renderBlog();
}

async function saveItem() {
    if (!currentEditorType) return;
    
    // Fix JSON trước khi lấy dữ liệu
    if (currentEditorType === 'experience') {
        const benefitsInput = document.getElementById('editExpBenefits');
        if (benefitsInput && benefitsInput.value) {
            benefitsInput.value = fixInvalidJson(benefitsInput.value);
        }
    }
    
    let formData;
    switch(currentEditorType) {
        case 'service': formData = getServiceFormData(); break;
        case 'experience': formData = getExperienceFormData(); break;
        case 'gallery': formData = getGalleryFormData(); break;
        case 'blog': formData = getBlogFormData(); break;
    }
    
    if (!formData) return;
    
    // Validate dữ liệu
    if (currentEditorType === 'experience' && formData.data.benefits) {
        if (!Array.isArray(formData.data.benefits)) {
            formData.data.benefits = [];
        }
    }
    
    switch(currentEditorType) {
        case 'service': await saveServiceData(formData); break;
        case 'experience': await saveExperienceData(formData); break;
        case 'gallery': await saveGalleryData(formData); break;
        case 'blog': await saveBlogData(formData); break;
    }
    
    closeEditor();
    
    const tabMap = {
        'service': 'services',
        'experience': 'experiences',
        'gallery': 'gallery',
        'blog': 'blog'
    };
    
    const tabToShow = tabMap[currentEditorType] || 'services';
    showTab(tabToShow);
}
// ===== GALLERY PREVIEW =====
function previewGalleryImage() {
    const imageUrl = document.getElementById('editGalleryImage').value.trim();
    if (!imageUrl) {
        showStatus('Vui lòng nhập URL ảnh', 'error');
        return;
    }
    
    const preview = document.getElementById('galleryPreview');
    const img = preview.querySelector('img');
    img.src = imageUrl;
    preview.style.display = 'block';
}
function addExpBenefit() {
    const input = document.getElementById('newExpBenefit');
    const benefit = input.value.trim();
    
    if (!benefit) {
        showStatus('Vui lòng nhập lợi ích', 'error');
        return;
    }
    
    const benefitsInput = document.getElementById('editExpBenefits');
    if (!benefitsInput) {
        console.error('Không tìm thấy input editExpBenefits');
        return;
    }
    
    // Đảm bảo luôn có giá trị JSON hợp lệ
    let benefits = [];
    try {
        const currentValue = benefitsInput.value;
        if (currentValue && currentValue.trim()) {
            benefits = JSON.parse(currentValue.trim());
            if (!Array.isArray(benefits)) benefits = [];
        }
    } catch (e) {
        console.warn('Invalid benefits JSON, resetting to empty array:', e);
        benefits = [];
    }
    
    // Thêm benefit mới
    benefits.push(benefit);
    
    // Cập nhật giá trị
    benefitsInput.value = JSON.stringify(benefits);
    
    // Cập nhật UI
    const benefitsList = document.getElementById('expBenefitsList');
    if (!benefitsList) {
        console.error('Không tìm thấy benefitsList');
        return;
    }
    
    // Xóa và render lại toàn bộ
    benefitsList.innerHTML = '';
    
    benefits.forEach((b, index) => {
        const benefitItem = document.createElement('div');
        benefitItem.className = 'feature-item';
        benefitItem.innerHTML = `
            <input type="text" class="form-input benefit-input" 
                   value="${b.replace(/"/g, '&quot;')}" 
                   placeholder="Lợi ích..." 
                   data-index="${index}"
                   oninput="updateExpBenefit(${index}, this.value)"
                   style="flex: 1;">
            <button type="button" onclick="removeExpBenefit(${index})" class="action-btn" style="background: rgba(255, 68, 68, 0.2);">
                <i class="fas fa-times"></i>
            </button>
        `;
        benefitsList.appendChild(benefitItem);
    });
    
    input.value = '';
    showStatus('Đã thêm lợi ích', 'success');
}
function removeBenefit(button) {
    const benefitGroup = button.parentElement;
    benefitGroup.remove();
}
function updateExpBenefit(index, newValue) {
    const benefitsInput = document.getElementById('editExpBenefits');
    if (!benefitsInput) return;
    
    try {
        let benefits = safeJsonParse(benefitsInput.value, []);
        if (index >= 0 && index < benefits.length) {
            benefits[index] = newValue.trim();
            benefitsInput.value = JSON.stringify(benefits);
        }
    } catch (error) {
        console.error('Error updating benefit:', error);
    }
}
// Thêm vào admin.js, trong hàm saveServiceData:
async function saveServiceData(formData) {
    console.log('📦 Saving service to Firebase:', formData.id);
    
    if (!dataStore.services.services) {
        dataStore.services.services = {};
    }
    
    dataStore.services.services[formData.id] = formData.data;
    dataStore.services.last_updated = new Date().toISOString();
    
    // Lưu cả Firebase và localStorage
    await saveToFirebase('services', dataStore.services);
    renderServices();
    
    // THÊM DÒNG NÀY: Kích hoạt cập nhật bảng giá
    window.dispatchEvent(new Event('servicesUpdated'));
    
    showStatus(`Đã lưu dịch vụ: ${formData.data.title}`, 'success');
}

async function saveExperienceData(formData) {
    if (!dataStore.experiences.experiences) dataStore.experiences.experiences = {};
    dataStore.experiences.experiences[formData.id] = formData.data;
    dataStore.experiences.last_updated = new Date().toISOString();
    
    await saveToFirebase('experiences', dataStore.experiences);
    renderExperiences();
    showStatus(`Đã lưu trải nghiệm: ${formData.data.title}`, 'success');
}

async function saveGalleryData(formData) {
    if (!dataStore.gallery.featured) dataStore.gallery.featured = [];
    
    const galleryItem = formData.data;
    if (currentEditingId) {
        const index = dataStore.gallery.featured.findIndex(item => 
            item.id === currentEditingId || item.id === galleryItem.id
        );
        if (index !== -1) {
            dataStore.gallery.featured[index] = galleryItem;
        } else {
            dataStore.gallery.featured.push(galleryItem);
        }
    } else {
        dataStore.gallery.featured.push(galleryItem);
    }
    
    dataStore.gallery.featured.sort((a, b) => (a.order || 99) - (b.order || 99));
    dataStore.gallery.last_updated = new Date().toISOString();
    
    await saveToFirebase('gallery', dataStore.gallery);
    renderGallery();
    showStatus(`Đã lưu ảnh: ${galleryItem.title}`, 'success');
    window.dispatchEvent(new Event('galleryUpdated'));
}

// ===== BLOG FUNCTIONS FOR ADMIN =====
async function saveBlogData(formData) {
    console.log('📝 Saving blog to Firebase:', formData.id);
    
    if (!dataStore.blog.posts) {
        dataStore.blog.posts = {};
    }
    
    // Add timestamps
    const now = new Date().toISOString();
    const postData = {
        ...formData.data,
        id: formData.id,
        created_at: dataStore.blog.posts[formData.id]?.created_at || now,
        updated_at: now
    };
    
    dataStore.blog.posts[formData.id] = postData;
    dataStore.blog.last_updated = now;
    
    // Save to Firebase
    await saveToFirebase('blog', dataStore.blog);
    
    // Trigger update on blog page
    window.dispatchEvent(new Event('blogUpdated'));
    
    renderBlog();
    showStatus(`Đã lưu bài viết: ${postData.title}`, 'success');
}

// Function to trigger blog update
function triggerBlogUpdate() {
    window.dispatchEvent(new Event('blogUpdated'));
}

// Add blog update listener in admin
window.addEventListener('blogUpdated', function() {
    console.log('🔄 Blog data updated, refreshing admin view');
    renderBlog();
});

// ===== DELETE FUNCTIONS =====
async function deleteItem(type = null, id = null) {
    if (!type) type = currentEditorType;
    if (!id) id = currentEditingId;
    if (!type || !id || !confirm(`Bạn có chắc muốn xóa ${type} này?`)) return;
    
    switch(type) {
        case 'service':
            if (dataStore.services.services && dataStore.services.services[id]) {
                delete dataStore.services.services[id];
                await saveToFirebase('services', dataStore.services);
                renderServices();
                showStatus('Đã xóa dịch vụ', 'success');
            }
            break;
        case 'experience':
            if (dataStore.experiences.experiences && dataStore.experiences.experiences[id]) {
                delete dataStore.experiences.experiences[id];
                await saveToFirebase('experiences', dataStore.experiences);
                renderExperiences();
                showStatus('Đã xóa trải nghiệm', 'success');
            }
            break;
        case 'gallery':
            if (dataStore.gallery.featured) {
                dataStore.gallery.featured = dataStore.gallery.featured.filter(item => 
                    item.id !== id && item.id !== parseInt(id)
                );
                await saveToFirebase('gallery', dataStore.gallery);
                renderGallery();
                showStatus('Đã xóa ảnh', 'success');
            }
            break;
        case 'blog':
            if (dataStore.blog.posts && dataStore.blog.posts[id]) {
                delete dataStore.blog.posts[id];
                await saveToFirebase('blog', dataStore.blog);
                renderBlog();
                showStatus('Đã xóa bài viết', 'success');
            }
            break;
    }
    
    closeEditor();
}

// ===== RENDER FUNCTIONS =====
function renderServices() {
    const container = document.getElementById('servicesList');
    const services = dataStore.services.services || {};
    
    if (Object.keys(services).length === 0) {
        container.innerHTML = '<div class="empty-state">Chưa có dịch vụ nào</div>';
        return;
    }
    
    let html = '';
    Object.entries(services).forEach(([id, service]) => {
        const image = service.images && service.images.length > 0 ? service.images[0] : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600';
        
        html += `
            <div class="grid-item" onclick="openEditor('service', '${id}')">
                <div class="grid-item-header">
                    <h3 class="grid-item-title">${service.title || 'Chưa có tiêu đề'}</h3>
                    <div class="grid-item-actions">
                        <button class="action-btn" onclick="openEditor('service', '${id}'); event.stopPropagation();">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="deleteItem('service', '${id}'); event.stopPropagation();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="grid-item-image">
                    <img src="${image}" alt="${service.title}">
                </div>
                <p>${service.description?.substring(0, 100) || 'Chưa có mô tả'}...</p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderExperiences() {
    const container = document.getElementById('experiencesList');
    const experiences = dataStore.experiences.experiences || {};
    
    let html = '';
    Object.entries(experiences).forEach(([id, exp]) => {
        html += `
            <div class="grid-item" onclick="openEditor('experience', '${id}')">
                <div class="grid-item-header">
                    <h3 class="grid-item-title">${exp.title}</h3>
                    <div class="grid-item-actions">
                        <button class="action-btn" onclick="openEditor('experience', '${id}'); event.stopPropagation();">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="deleteItem('experience', '${id}'); event.stopPropagation();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="grid-item-image">
                    <img src="${exp.image}" alt="${exp.title}">
                </div>
                <p>${exp.description || 'Chưa có mô tả'}</p>
                <div class="benefits-tags">
                    ${(exp.benefits || []).slice(0, 2).map(benefit => `
                        <span class="benefit-tag">${benefit}</span>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderGallery() {
    const container = document.getElementById('galleryList');
    const gallery = dataStore.gallery.featured || [];
    
    let html = '';
    gallery.forEach((item) => {
        html += `
            <div class="grid-item" onclick="openEditor('gallery', '${item.id}')">
                <div class="grid-item-header">
                    <h3 class="grid-item-title">${item.title}</h3>
                    <div class="grid-item-actions">
                        <button class="action-btn" onclick="openEditor('gallery', '${item.id}'); event.stopPropagation();">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="deleteItem('gallery', '${item.id}'); event.stopPropagation();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="grid-item-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <p>${item.description || 'Chưa có mô tả'}</p>
                <div class="category-tag">
                    <i class="fas fa-tag"></i> ${item.category || 'Chưa phân loại'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<div class="empty-state">Chưa có ảnh nào</div>';
}

function renderBlog() {
    const container = document.getElementById('blogList');
    const posts = dataStore.blog.posts || {};
    
    let html = '';
    Object.entries(posts).forEach(([id, post]) => {
        const date = new Date(post.date || new Date()).toLocaleDateString('vi-VN');
        
        html += `
            <div class="grid-item" onclick="openEditor('blog', '${id}')">
                <div class="grid-item-header">
                    <h3 class="grid-item-title">${post.title}</h3>
                    <div class="grid-item-actions">
                        <button class="action-btn" onclick="openEditor('blog', '${id}'); event.stopPropagation();">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="deleteItem('blog', '${id}'); event.stopPropagation();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="grid-item-image">
                    <img src="${post.image}" alt="${post.title}">
                </div>
                <p>${post.excerpt?.substring(0, 100) || 'Chưa có mô tả'}...</p>
                <div class="blog-meta">
                    <span><i class="fas fa-user"></i> ${post.author || 'Admin'}</span>
                    <span><i class="far fa-calendar"></i> ${date}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ===== EDITOR FUNCTIONS =====
function openEditor(type, id = null) {
    currentEditorType = type;
    currentEditingId = id;
    
    const titles = {
        'service': id ? 'Chỉnh sửa Dịch vụ' : 'Thêm Dịch vụ mới',
        'experience': id ? 'Chỉnh sửa Trải nghiệm' : 'Thêm Trải nghiệm mới',
        'gallery': id ? 'Chỉnh sửa Ảnh' : 'Thêm Ảnh mới',
        'blog': id ? 'Chỉnh sửa Bài viết' : 'Thêm Bài viết mới'
    };
    
    document.getElementById('editorModalTitle').textContent = titles[type];
    document.getElementById('deleteItemBtn').style.display = id ? 'block' : 'none';
    
    loadEditorForm(type, id);
    showModal('editorModal');
}

function loadEditorForm(type, id) {
    const container = document.getElementById('editorModalBody');
    
    let data = null;
    if (id) {
        switch(type) {
            case 'service': data = dataStore.services.services?.[id]; break;
            case 'experience': data = dataStore.experiences.experiences?.[id]; break;
            case 'gallery': 
                const gallery = dataStore.gallery.featured || [];
                data = gallery.find(item => item.id === id || item.id === parseInt(id));
                break;
            case 'blog': data = dataStore.blog.posts?.[id]; break;
        }
    }
    
    let formHTML = '';
    switch(type) {
        case 'service': formHTML = getServiceForm(data, id); break;
        case 'experience': formHTML = getExperienceForm(data, id); break;
        case 'gallery': formHTML = getGalleryForm(data, id); break;
        case 'blog': formHTML = getBlogForm(data, id); break;
    }
    
    container.innerHTML = formHTML;
}

// ===== FORM FUNCTIONS =====
function getServiceForm(data = null, id = null) {
    const features = data?.features || ['Đón tận cửa, hỗ trợ hành lý', 'Xe đời mới, nội thất cao cấp', 'Tài xế mặc vest, chuyên nghiệp'];
    const pricing = data?.pricing || [{ label: 'Liên hệ để có giá tốt nhất', price: '0931.243.679' }];
    const images = data?.images || [];
    
    return `
        <input type="hidden" id="editId" value="${id || ''}">
        
        <div class="form-group">
            <label class="form-label">ID Dịch vụ *</label>
            <input type="text" id="editServiceId" class="form-input" value="${id || ''}" ${id ? 'readonly' : ''} 
                   placeholder="airport, tour, business" required>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Tiêu đề *</label>
                <input type="text" id="editTitle" class="form-input" value="${data?.title || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Phụ đề</label>
                <input type="text" id="editSubtitle" class="form-input" value="${data?.subtitle || ''}">
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Mô tả chi tiết *</label>
            <textarea id="editDescription" class="form-input" rows="4" required>${data?.description || ''}</textarea>
        </div>
        
        <div class="form-group">
            <label class="form-label">Hình ảnh dịch vụ</label>
            <div class="image-input-row">
                <input type="text" id="newImageUrl" class="form-input" placeholder="URL ảnh">
                <button type="button" class="btn btn-secondary" onclick="addServiceImage()">Thêm ảnh</button>
            </div>
            <div id="serviceImagesList" class="images-grid">
                ${images.map((img, index) => `
                    <div class="image-item">
                        <img src="${img}" alt="Service image">
                        <button type="button" onclick="removeServiceImage(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <input type="hidden" id="editImages" value='${JSON.stringify(images)}'>
        </div>
        
        <div class="form-group">
            <label class="form-label">Tính năng nổi bật</label>
            <div id="serviceFeaturesList">
                ${features.map((feature, index) => `
                    <div class="feature-item">
                        <input type="text" class="form-input" value="${feature}" data-index="${index}">
                        <button type="button" onclick="removeServiceFeature(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="feature-input-row">
                <input type="text" id="newFeature" class="form-input" placeholder="Tính năng mới">
                <button type="button" class="btn btn-secondary" onclick="addServiceFeature()">Thêm</button>
            </div>
            <input type="hidden" id="editFeatures" value='${JSON.stringify(features)}'>
        </div>
        
        <div class="form-group">
            <label class="form-label">Bảng giá tham khảo</label>
            <div id="servicePricingList">
                ${pricing.map((price, index) => `
                    <div class="pricing-item">
                        <input type="text" class="form-input" value="${price.label}" data-index="${index}">
                        <input type="text" class="form-input" value="${price.price}" data-index="${index}">
                        <button type="button" onclick="removeServicePrice(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="pricing-input-row">
                <input type="text" id="newPriceLabel" class="form-input" placeholder="Tên gói">
                <input type="text" id="newPriceValue" class="form-input" placeholder="Giá">
                <button type="button" class="btn btn-secondary" onclick="addServicePrice()">Thêm</button>
            </div>
            <input type="hidden" id="editPricing" value='${JSON.stringify(pricing)}'>
        </div>
    `;
}
// Thêm hàm này để fix JSON trước khi lưu
function fixInvalidJson(str) {
    if (!str || typeof str !== 'string') return '[]';
    
    const trimmed = str.trim();
    
    // Nếu bắt đầu bằng [ nhưng không kết thúc bằng ]
    if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
        return trimmed + ']';
    }
    
    // Nếu kết thúc bằng ] nhưng không bắt đầu bằng [
    if (trimmed.endsWith(']') && !trimmed.startsWith('[')) {
        return '[' + trimmed;
    }
    
    // Nếu không có dấu ngoặc nào
    if (!trimmed.includes('[') && !trimmed.includes(']')) {
        try {
            // Thử parse xem có phải array không
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return trimmed;
            }
        } catch (e) {
            // Nếu là chuỗi đơn, wrap thành array
            return `["${trimmed}"]`;
        }
    }
    
    return trimmed;
}
function getExperienceForm(data = null, id = null) {
    // Đảm bảo benefits luôn là mảng hợp lệ
    let benefits = [];
    if (data?.benefits) {
        if (Array.isArray(data.benefits)) {
            benefits = data.benefits;
        } else if (typeof data.benefits === 'string') {
            try {
                benefits = JSON.parse(data.benefits);
                if (!Array.isArray(benefits)) benefits = [];
            } catch (e) {
                benefits = [];
            }
        }
    }
    
    const benefitsJson = JSON.stringify(benefits);
    
    return `
        <input type="hidden" id="editId" value="${id || ''}">
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">ID Trải nghiệm *</label>
                <input type="text" id="editExpId" class="form-input" value="${id || ''}" ${id ? 'readonly' : ''} required>
            </div>
            <div class="form-group">
                <label class="form-label">Tiêu đề *</label>
                <input type="text" id="editExpTitle" class="form-input" value="${data?.title || ''}" required>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">URL Ảnh đại diện *</label>
            <div class="image-preview-row">
                <input type="text" id="editExpImage" class="form-input" value="${data?.image || ''}" required>
                <button type="button" class="btn btn-secondary" onclick="previewExpImage()">Xem trước</button>
            </div>
            <div id="expImagePreview" style="${data?.image ? 'display: block;' : 'display: none;'}">
                <img src="${data?.image || ''}" alt="Preview">
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Mô tả ngắn *</label>
            <textarea id="editExpDescription" class="form-input" rows="3" required>${data?.description || ''}</textarea>
        </div>
        
        <div class="form-group">
            <label class="form-label">Lợi ích nổi bật</label>
            <div id="expBenefitsList">
                ${benefits.map((benefit, index) => `
                    <div class="feature-item">
                        <input type="text" class="form-input benefit-input" 
                               value="${benefit.replace(/"/g, '&quot;')}" 
                               data-index="${index}"
                               oninput="updateExpBenefit(${index}, this.value)"
                               placeholder="Lợi ích...">
                        <button type="button" onclick="removeExpBenefit(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="feature-input-row">
                <input type="text" id="newExpBenefit" class="form-input" placeholder="Lợi ích mới">
                <button type="button" class="btn btn-secondary" onclick="addExpBenefit()">Thêm</button>
            </div>
            <input type="hidden" id="editExpBenefits" value='${benefitsJson}'>
        </div>
    `;
}
// ===== HELPER FUNCTIONS FOR SERVICE EDITOR =====
function addServiceImage() {
    const urlInput = document.getElementById('newImageUrl');
    const url = urlInput.value.trim();
    
    if (!url) {
        showStatus('Vui lòng nhập URL ảnh', 'error');
        return;
    }
    
    try {
        new URL(url); // Validate URL
    } catch {
        showStatus('URL không hợp lệ', 'error');
        return;
    }
    
    const imagesList = document.getElementById('serviceImagesList');
    const images = JSON.parse(document.getElementById('editImages').value || '[]');
    
    // Add to array
    images.push(url);
    document.getElementById('editImages').value = JSON.stringify(images);
    
    // Add to UI
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.innerHTML = `
        <img src="${url}" alt="Service image" style="width: 100%; height: 100%; object-fit: cover;">
        <button type="button" onclick="removeServiceImage(${images.length - 1})" 
                style="position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <i class="fas fa-times" style="font-size: 12px;"></i>
        </button>
    `;
    
    imagesList.appendChild(imageItem);
    urlInput.value = '';
    showStatus('Đã thêm ảnh', 'success');
}
function removeServiceImage(index) {
    const images = JSON.parse(document.getElementById('editImages').value || '[]');
    if (index >= 0 && index < images.length) {
        images.splice(index, 1);
        document.getElementById('editImages').value = JSON.stringify(images);
        
        // Re-render images list
        const imagesList = document.getElementById('serviceImagesList');
        imagesList.innerHTML = images.map((img, i) => `
            <div class="image-item" style="position: relative; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid rgba(212, 175, 55, 0.3);">
                <img src="${img}" alt="Service image" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="removeServiceImage(${i})" 
                        style="position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <i class="fas fa-times" style="font-size: 12px;"></i>
                </button>
            </div>
        `).join('');
    }
}
function removeExpBenefit(index) {
    const benefitsInput = document.getElementById('editExpBenefits');
    const benefitsList = document.getElementById('expBenefitsList');
    
    if (!benefitsInput || !benefitsList) return;
    
    try {
        let benefits = [];
        const currentValue = benefitsInput.value;
        if (currentValue && currentValue.trim()) {
            benefits = JSON.parse(currentValue);
            if (!Array.isArray(benefits)) benefits = [];
        }
        
        if (index >= 0 && index < benefits.length) {
            benefits.splice(index, 1);
            benefitsInput.value = JSON.stringify(benefits);
            
            // Re-render UI
            benefitsList.innerHTML = '';
            benefits.forEach((b, i) => {
                const benefitItem = document.createElement('div');
                benefitItem.className = 'feature-item';
                benefitItem.innerHTML = `
                    <input type="text" class="form-input benefit-input" 
                           value="${b.replace(/"/g, '&quot;')}" 
                           placeholder="Lợi ích..." 
                           data-index="${i}"
                           oninput="updateExpBenefit(${i}, this.value)"
                           style="flex: 1;">
                    <button type="button" onclick="removeExpBenefit(${i})" class="action-btn" style="background: rgba(255, 68, 68, 0.2);">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                benefitsList.appendChild(benefitItem);
            });
            
            showStatus('Đã xóa lợi ích', 'success');
        }
    } catch (error) {
        console.error('Error removing benefit:', error);
        showStatus('Lỗi khi xóa lợi ích', 'error');
    }
}
function getGalleryForm(data = null, id = null) {
    return `
        <input type="hidden" id="editId" value="${id || ''}">
        
        <div class="form-group">
            <label class="form-label">Tiêu đề ảnh *</label>
            <input type="text" id="editGalleryTitle" class="form-input" value="${data?.title || ''}" required>
        </div>
        
        <div class="form-group">
            <label class="form-label">URL Ảnh *</label>
            <div class="image-preview-row">
                <input type="text" id="editGalleryImage" class="form-input" value="${data?.image || ''}" required>
                <button type="button" class="btn btn-secondary" onclick="previewGalleryImage()">Xem trước</button>
            </div>
            <div id="galleryPreview" style="${data?.image ? 'display: block;' : 'display: none;'}">
                <img src="${data?.image || ''}" alt="Preview">
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Mô tả ảnh</label>
            <textarea id="editGalleryDescription" class="form-input" rows="3">${data?.description || ''}</textarea>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Danh mục</label>
                <select id="editGalleryCategory" class="form-input">
                    <option value="premium" ${data?.category === 'premium' ? 'selected' : ''}>Premium</option>
                    <option value="family" ${data?.category === 'family' ? 'selected' : ''}>Family</option>
                    <option value="business" ${data?.category === 'business' ? 'selected' : ''}>Business</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Thứ tự hiển thị</label>
                <input type="number" id="editGalleryOrder" class="form-input" value="${data?.order || 1}" min="1" max="100">
            </div>
        </div>
    `;
}

function getBlogForm(data = null, id = null) {
    const date = data?.date || new Date().toISOString().split('T')[0];
    const tags = data?.tags || [];
    
    return `
        <input type="hidden" id="editId" value="${id || ''}">
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">ID Bài viết *</label>
                <input type="text" id="editPostId" class="form-input" value="${id || ''}" ${id ? 'readonly' : ''} required>
            </div>
            <div class="form-group">
                <label class="form-label">Tiêu đề *</label>
                <input type="text" id="editPostTitle" class="form-input" value="${data?.title || ''}" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Tác giả</label>
                <input type="text" id="editPostAuthor" class="form-input" value="${data?.author || 'LuxuryMove Team'}">
            </div>
            <div class="form-group">
                <label class="form-label">Ngày đăng</label>
                <input type="date" id="editPostDate" class="form-input" value="${date}">
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">URL Ảnh đại diện *</label>
            <input type="text" id="editPostImage" class="form-input" value="${data?.image || ''}" required>
        </div>
        
        <div class="form-group">
            <label class="form-label">Mô tả ngắn *</label>
            <textarea id="editPostExcerpt" class="form-input" rows="3" required>${data?.excerpt || ''}</textarea>
        </div>
        
        <div class="form-group">
            <label class="form-label">Nội dung chi tiết *</label>
            <textarea id="editPostContent" class="form-input" rows="8" required>${data?.content || ''}</textarea>
        </div>
        
        <div class="form-group">
            <label class="form-label">Tags (phân cách bằng dấu phẩy)</label>
            <input type="text" id="editPostTags" class="form-input" value="${tags.join(', ')}">
        </div>
    `;
}

// ===== FORM DATA GETTERS =====
function getServiceFormData() {
    const id = document.getElementById('editServiceId')?.value.trim() || document.getElementById('editId')?.value.trim();
    const title = document.getElementById('editTitle')?.value.trim();
    const description = document.getElementById('editDescription')?.value.trim();
    
    if (!id || !title || !description) {
        showStatus('Vui lòng nhập ID, tiêu đề và mô tả', 'error');
        return null;
    }
    
    const images = safeJsonParse(document.getElementById('editImages')?.value, []);
    const features = safeJsonParse(document.getElementById('editFeatures')?.value, []);
    const pricing = safeJsonParse(document.getElementById('editPricing')?.value, []);
    
    return {
        id: id,
        data: {
            title: title,
            subtitle: document.getElementById('editSubtitle')?.value.trim() || title,
            images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600'],
            description: description,
            features: features.length > 0 ? features : ['Chất lượng cao cấp', 'Đúng giờ 100%', 'Tài xế chuyên nghiệp'],
            pricing: pricing.length > 0 ? pricing : [{ label: 'Liên hệ để có giá tốt nhất', price: '0931.243.679' }]
        }
    };
}

function getExperienceFormData() {
    const id = document.getElementById('editExpId')?.value.trim() || document.getElementById('editId')?.value.trim();
    const title = document.getElementById('editExpTitle')?.value.trim();
    const image = document.getElementById('editExpImage')?.value.trim();
    const description = document.getElementById('editExpDescription')?.value.trim();
    
    if (!id || !title || !image || !description) {
        showStatus('Vui lòng nhập đầy đủ thông tin', 'error');
        return null;
    }
    
    const benefitsInput = document.getElementById('editExpBenefits');
    let benefits = [];
    
    if (benefitsInput && benefitsInput.value) {
        try {
            // Validate JSON trước khi sử dụng
            const parsed = JSON.parse(benefitsInput.value);
            benefits = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Invalid benefits format, using empty array:', error);
            benefits = [];
        }
    }
    
    // Đảm bảo benefits là mảng
    if (!Array.isArray(benefits)) {
        benefits = [];
    }
    
    return {
        id: id,
        data: {
            title: title,
            image: image,
            description: description,
            benefits: benefits
        }
    };
}

function getGalleryFormData() {
    const titleInput = document.getElementById('editGalleryTitle');
    const imageInput = document.getElementById('editGalleryImage');
    
    if (!titleInput || !imageInput) {
        showStatus('Form không hợp lệ', 'error');
        return null;
    }
    
    const title = titleInput.value.trim();
    const image = imageInput.value.trim();
    
    if (!title || !image) {
        showStatus('Vui lòng nhập tiêu đề và URL ảnh', 'error');
        return null;
    }
    
    const id = currentEditingId || 'gallery_' + Date.now();
    
    return {
        id: id,
        data: {
            title: title,
            image: image,
            description: document.getElementById('editGalleryDescription')?.value.trim() || title,
            category: document.getElementById('editGalleryCategory')?.value || 'premium',
            order: parseInt(document.getElementById('editGalleryOrder')?.value) || 1
        }
    };
}

function getBlogFormData() {
    const id = document.getElementById('editPostId')?.value.trim() || document.getElementById('editId')?.value.trim();
    const title = document.getElementById('editPostTitle')?.value.trim();
    const image = document.getElementById('editPostImage')?.value.trim();
    const excerpt = document.getElementById('editPostExcerpt')?.value.trim();
    
    if (!id || !title || !image || !excerpt) {
        showStatus('Vui lòng nhập đầy đủ thông tin', 'error');
        return null;
    }
    
    const tagsText = document.getElementById('editPostTags')?.value.trim() || '';
    const tags = tagsText ? tagsText.split(',').map(t => t.trim()).filter(t => t) : [];
    
    return {
        id: id,
        data: {
            title: title,
            author: document.getElementById('editPostAuthor')?.value.trim() || 'LuxuryMove Team',
            date: document.getElementById('editPostDate')?.value,
            image: image,
            excerpt: excerpt,
            content: document.getElementById('editPostContent')?.value.trim() || '<p>Đang cập nhật nội dung...</p>',
            tags: tags
        }
    };
}

function safeJsonParse(str, defaultValue = []) {
    // Kiểm tra chặt chẽ hơn
    if (str === null || str === undefined || str === '') {
        return defaultValue;
    }
    
    // Nếu đã là mảng, trả về luôn
    if (Array.isArray(str)) {
        return str;
    }
    
    // Nếu không phải string, chuyển thành string
    const strValue = String(str).trim();
    
    // Kiểm tra xem có phải JSON không
    if (strValue === '' || strValue === 'null' || strValue === 'undefined') {
        return defaultValue;
    }
    
    // Thêm dấu đóng ngoặc nếu thiếu
    let fixedStr = strValue;
    if (fixedStr.startsWith('[') && !fixedStr.endsWith(']')) {
        fixedStr = fixedStr + ']';
    }
    
    try {
        const parsed = JSON.parse(fixedStr);
        if (Array.isArray(parsed)) {
            return parsed;
        } else if (parsed && typeof parsed === 'object') {
            return Object.values(parsed);
        }
        return defaultValue;
    } catch (error) {
        console.warn('JSON parse error:', error.message, 'Input:', strValue);
        
        // Thử fix các trường hợp đặc biệt
        try {
            // Nếu có dấu ngoặc vuông mở nhưng không đóng
            if (strValue.includes('[') && !strValue.includes(']')) {
                const fixed = strValue + ']';
                return JSON.parse(fixed);
            }
            
            // Nếu là chuỗi phân cách bằng dấu phẩy
            if (strValue.includes(',') && !strValue.startsWith('[')) {
                const items = strValue.split(',').map(item => item.trim()).filter(item => item);
                return items;
            }
            
            // Nếu là chuỗi đơn
            if (!strValue.startsWith('[') && !strValue.startsWith('{')) {
                return [strValue];
            }
        } catch (e) {
            console.error('Failed to fix JSON:', e);
        }
        
        return defaultValue;
    }
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function closeEditor() {
    closeModal('editorModal');
    currentEditorType = null;
    currentEditingId = null;
}



function showStatus(message, type = 'success') {
    const statusBar = document.getElementById('statusBar');
    if (!statusBar) return;
    
    const statusIcon = document.getElementById('statusIcon');
    const statusMessage = document.getElementById('statusMessage');
    
    statusBar.className = `status-bar show ${type}`;
    statusIcon.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`;
    statusMessage.textContent = message;
    
    setTimeout(() => {
        statusBar.classList.remove('show');
    }, 4000);
}

// ===== DEFAULT DATA =====
function getDefaultExperiences() {
    return {
        'family': {
            title: 'Cho Gia Đình',
            image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=500',
            description: 'Hành trình ấm cúng, an tâm cho gia đình bạn',
            benefits: ['An toàn tuyệt đối cho người thân', 'Tiện nghi cho trẻ em & người lớn tuổi', 'Không gian riêng tư, thoải mái']
        },
        'friends': {
            title: 'Cho Bạn Bè',
            image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=500',
            description: 'Chuyến đi vui vẻ cùng những người bạn thân',
            benefits: ['Thoải mái trò chuyện, tạo kỷ niệm', 'Điểm dừng linh hoạt theo nhóm', 'Chi phí chia sẻ hợp lý']
        }
    };
}

function getDefaultGallery() {
    return [
        
    ];
}

function getSampleBlogPosts() {
    return {
        'post1': {
            title: 'Kinh Nghiệm Du Lịch Nha Trang 2024',
            author: 'LuxuryMove Team',
            date: '2024-12-15',
            category: 'travel',
            image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800',
            excerpt: 'Khám phá những điểm đến hấp dẫn tại Nha Trang',
            content: '<p>Nội dung bài viết...</p>',
            tags: ['nha trang', 'du lịch', 'kinh nghiệm']
        }
    };
}

//

// ===== STATISTICS MANAGEMENT FUNCTIONS =====
async function loadStatisticsConfig() {
    if (!database) return null;
    
    try {
        const snapshot = await database.ref('statistics/config').once('value');
        return snapshot.val();
    } catch (error) {
        console.error("❌ Error loading statistics config:", error);
        return null;
    }
}

async function saveStatisticsConfig(config) {
    if (!database) {
        showStatus('Không thể kết nối Firebase', 'error');
        return false;
    }
    
    try {
        await database.ref('statistics/config').set(config);
        localStorage.setItem('luxurymove_stats_config', JSON.stringify(config));
        
        // Ghi log
        await database.ref('statistics/logs/manual_updates').push({
            timestamp: Date.now(),
            action: 'config_update',
            config: config
        });
        
        showStatus('Đã lưu cấu hình thống kê', 'success');
        return true;
    } catch (error) {
        console.error("❌ Error saving statistics config:", error);
        showStatus('Lỗi khi lưu cấu hình', 'error');
        return false;
    }
}

async function updateStatisticsManually(data) {
    if (!database) return false;
    
    try {
        const updateData = {
            ...data,
            updated_at: Date.now(),
            source: 'manual'
        };
        
        await database.ref('statistics/live').update(updateData);
        
        // Ghi log
        await database.ref('statistics/logs/manual_updates').push({
            timestamp: Date.now(),
            action: 'manual_override',
            data: data
        });
        
        showStatus('Đã cập nhật thống kê thủ công', 'success');
        return true;
    } catch (error) {
        console.error("❌ Error updating statistics manually:", error);
        showStatus('Lỗi khi cập nhật', 'error');
        return false;
    }
}

async function resetDailyStatistics() {
    if (!database) return false;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Reset bookings
        await database.ref('statistics/live/bookings_today').set(0);
        
        // Update last_reset date
        await database.ref('statistics/config/last_reset').set(today);
        
        // Ghi log
        await database.ref('statistics/logs/daily_resets').push({
            timestamp: Date.now(),
            date: today
        });
        
        showStatus('Đã reset thống kê ngày mới', 'success');
        return true;
    } catch (error) {
        console.error("❌ Error resetting daily statistics:", error);
        showStatus('Lỗi khi reset', 'error');
        return false;
    }
}

// Hàm lấy dữ liệu thống kê thực
async function getRealStatistics() {
    if (!database) return null;
    
    try {
        // Đếm user online thực (active trong 5 phút)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const sessionsSnapshot = await database.ref('user_sessions').once('value');
        const sessions = sessionsSnapshot.val() || {};
        
        const realOnline = Object.values(sessions).filter(session => 
            session.last_active > fiveMinutesAgo
        ).length;
        
        // Đếm booking hôm nay
        const today = new Date().toISOString().split('T')[0];
        const bookingsSnapshot = await database.ref('booking_logs').once('value');
        const bookings = bookingsSnapshot.val() || {};
        
        const realBookings = Object.values(bookings).filter(booking => {
            const bookingDate = new Date(booking.timestamp).toISOString().split('T')[0];
            return bookingDate === today && booking.status === 'confirmed';
        }).length;
        
        return {
            real_online: realOnline,
            real_bookings: realBookings,
            total_sessions: Object.keys(sessions).length,
            total_bookings: Object.keys(bookings).length
        };
    } catch (error) {
        console.error("❌ Error getting real statistics:", error);
        return null;
    }
}

//
// ===== TELEGRAM MANAGEMENT FUNCTIONS =====
let telegramConfigs = {};

async function loadTelegramConfigs() {
    try {
        const configs = await fetchFromFirebase('telegram_configs');
        telegramConfigs = configs || { configs: {}, default: null };
        renderTelegramConfigs();
    } catch (error) {
        console.error("Error loading Telegram configs:", error);
        telegramConfigs = { configs: {}, default: null };
    }
}

function renderTelegramConfigs() {
    const container = document.getElementById('telegramConfigs');
    const configs = telegramConfigs.configs || {};
    
    if (Object.keys(configs).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fab fa-telegram fa-3x" style="color: #0088cc; margin-bottom: 20px;"></i>
                <h3>Chưa có cấu hình Telegram</h3>
                <p>Thêm cấu hình để nhận thông báo đặt xe tự động</p>
                <button class="btn btn-primary" onclick="openTelegramConfig()">
                    <i class="fas fa-plus"></i> Thêm cấu hình đầu tiên
                </button>
            </div>
        `;
        return;
    }
    
    let html = '<div class="telegram-grid">';
    
    Object.entries(configs).forEach(([id, config]) => {
        const chatIds = config.chatIds || [];
        const isDefault = telegramConfigs.default === id;
        
        html += `
            <div class="telegram-card ${isDefault ? 'default-card' : ''}" onclick="openTelegramConfig('${id}')">
                <div class="telegram-card-header">
                    <div class="telegram-card-title">
                        <i class="fab fa-telegram" style="color: #0088cc;"></i>
                        <h3>${config.name || 'Chưa đặt tên'}</h3>
                        ${isDefault ? '<span class="default-badge">Mặc định</span>' : ''}
                    </div>
                    <div class="telegram-card-actions">
                        <button class="action-btn" onclick="openTelegramConfig('${id}'); event.stopPropagation();">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="deleteTelegramConfig('${id}'); event.stopPropagation();">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="telegram-card-body">
                    <div class="telegram-info-row">
                        <label>Bot Token:</label>
                        <code class="token-preview">${config.botToken ? config.botToken.substring(0, 15) + '...' : 'Chưa có'}</code>
                    </div>
                    
                    <div class="telegram-info-row">
                        <label>Số Chat IDs:</label>
                        <span class="badge">${chatIds.length}</span>
                    </div>
                    
                    <div class="telegram-info-row">
                        <label>Trạng thái:</label>
                        <span class="status-indicator ${config.lastTest?.success ? 'success' : 'warning'}">
                            ${config.lastTest ? (config.lastTest.success ? '✓ Hoạt động' : '✗ Lỗi') : 'Chưa kiểm tra'}
                        </span>
                    </div>
                </div>
                
                <div class="telegram-card-footer">
                    <small>Cập nhật: ${config.updated_at ? new Date(config.updated_at).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</small>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function openTelegramConfig(id = null) {
    const modal = document.getElementById('telegramModal');
    const title = document.getElementById('telegramModalTitle');
    const deleteBtn = document.getElementById('deleteTelegramBtn');
    
    if (id && telegramConfigs.configs?.[id]) {
        // Edit mode
        const config = telegramConfigs.configs[id];
        title.textContent = 'Chỉnh sửa cấu hình Telegram';
        deleteBtn.style.display = 'block';
        
        document.getElementById('telegramConfigId').value = id;
        document.getElementById('telegramName').value = config.name || '';
        document.getElementById('telegramBotToken').value = config.botToken || '';
        document.getElementById('telegramChatIds').value = (config.chatIds || []).join('\n');
        document.getElementById('telegramIsDefault').checked = telegramConfigs.default === id;
        
        // Update test status
        const testStatus = document.getElementById('telegramTestStatus');
        if (config.lastTest) {
            testStatus.innerHTML = config.lastTest.success ? 
                '<span class="status-success"><i class="fas fa-check-circle"></i> Đã kiểm tra thành công</span>' :
                `<span class="status-error"><i class="fas fa-times-circle"></i> Lỗi: ${config.lastTest.error || 'Không xác định'}</span>`;
        }
    } else {
        // Add mode
        title.textContent = 'Thêm cấu hình Telegram mới';
        deleteBtn.style.display = 'none';
        
        document.getElementById('telegramConfigId').value = '';
        document.getElementById('telegramName').value = '';
        document.getElementById('telegramBotToken').value = '';
        document.getElementById('telegramChatIds').value = '';
        document.getElementById('telegramIsDefault').checked = false;
        document.getElementById('telegramTestStatus').innerHTML = '';
    }
    
    showModal('telegramModal');
}

async function saveTelegramConfig() {
    const id = document.getElementById('telegramConfigId').value || 'telegram_' + Date.now();
    const name = document.getElementById('telegramName').value.trim();
    const botToken = document.getElementById('telegramBotToken').value.trim();
    const chatIdsText = document.getElementById('telegramChatIds').value.trim();
    const isDefault = document.getElementById('telegramIsDefault').checked;
    
    // Validation
    if (!name || !botToken || !chatIdsText) {
        showStatus('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    const chatIds = chatIdsText.split('\n')
        .map(id => id.trim())
        .filter(id => id.length > 0 && /^\d+$/.test(id));
    
    if (chatIds.length === 0) {
        showStatus('Vui lòng nhập ít nhất một Chat ID hợp lệ', 'error');
        return;
    }
    
    const config = {
        name,
        botToken,
        chatIds,
        updated_at: new Date().toISOString()
    };
    
    // Initialize if not exists
    if (!telegramConfigs.configs) {
        telegramConfigs.configs = {};
    }
    
    // Save config
    telegramConfigs.configs[id] = config;
    
    // Update default config
    if (isDefault) {
        telegramConfigs.default = id;
    } else if (telegramConfigs.default === id) {
        telegramConfigs.default = null;
    }
    
    // Save to Firebase
    await saveToFirebase('telegram_configs', telegramConfigs);
    
    showStatus(`Đã lưu cấu hình Telegram: ${name}`, 'success');
    closeModal('telegramModal');
    renderTelegramConfigs();
}

async function deleteTelegramConfig(id = null) {
    if (!id) id = document.getElementById('telegramConfigId').value;
    
    if (!id || !confirm('Bạn có chắc muốn xóa cấu hình này?')) {
        return;
    }
    
    if (telegramConfigs.configs?.[id]) {
        delete telegramConfigs.configs[id];
        
        // Remove from default if it was default
        if (telegramConfigs.default === id) {
            telegramConfigs.default = null;
        }
        
        // Save to Firebase
        await saveToFirebase('telegram_configs', telegramConfigs);
        
        showStatus('Đã xóa cấu hình Telegram', 'success');
        closeModal('telegramModal');
        renderTelegramConfigs();
    }
}

async function testTelegramConnection() {
    const botToken = document.getElementById('telegramBotToken').value.trim();
    const chatIdsText = document.getElementById('telegramChatIds').value.trim();
    
    if (!botToken || !chatIdsText) {
        showStatus('Vui lòng nhập Bot Token và Chat IDs', 'error');
        return;
    }
    
    const chatIds = chatIdsText.split('\n')
        .map(id => id.trim())
        .filter(id => id.length > 0);
    
    if (chatIds.length === 0) {
        showStatus('Vui lòng nhập ít nhất một Chat ID', 'error');
        return;
    }
    
    const testStatus = document.getElementById('telegramTestStatus');
    testStatus.innerHTML = '<div class="loading-spinner small"></div> Đang kiểm tra...';
    
    try {
        // Test with first chat ID
        const testChatId = chatIds[0];
        const testMessage = {
            chat_id: testChatId,
            text: '✅ LuxuryMove - Kiểm tra kết nối thành công!\nThời gian: ' + new Date().toLocaleString('vi-VN'),
            parse_mode: 'HTML'
        };
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testMessage)
        });
        
        const result = await response.json();
        
        if (result.ok) {
            testStatus.innerHTML = '<span class="status-success"><i class="fas fa-check-circle"></i> Kết nối thành công! Đã gửi tin nhắn kiểm tra</span>';
            
            // Update last test status
            const configId = document.getElementById('telegramConfigId').value;
            if (configId && telegramConfigs.configs?.[configId]) {
                telegramConfigs.configs[configId].lastTest = {
                    success: true,
                    timestamp: Date.now()
                };
                await saveToFirebase('telegram_configs', telegramConfigs);
            }
            
            showStatus('Kiểm tra kết nối Telegram thành công', 'success');
        } else {
            throw new Error(result.description || 'Lỗi không xác định');
        }
    } catch (error) {
        console.error('Telegram test error:', error);
        testStatus.innerHTML = `<span class="status-error"><i class="fas fa-times-circle"></i> Lỗi: ${error.message}</span>`;
        showStatus('Kiểm tra kết nối thất bại', 'error');
    }
}

function toggleTokenVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Update showTab function
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const tabElement = document.getElementById(`${tabName}Tab`);
    const tabButton = document.querySelector(`button[onclick*="showTab('${tabName}')"]`);
    
    if (!tabElement) return;
    
    tabElement.classList.add('active');
    if (tabButton) tabButton.classList.add('active');
    
    switch(tabName) {
        case 'services': renderServices(); break;
        case 'experiences': renderExperiences(); break;
        case 'gallery': renderGallery(); break;
        case 'blog': renderBlog(); break;
        case 'telegram': loadTelegramConfigs(); break;
        case 'statistics': /* Xử lý statistics */ break;
    }
}

// Cập nhật hàm loadAllData
async function loadAllData() {
    try {
        const [services, experiences, gallery, blog, telegram] = await Promise.allSettled([
            fetchFromFirebase('services'),
            fetchFromFirebase('experiences'),
            fetchFromFirebase('gallery'),
            fetchFromFirebase('blog'),
            fetchFromFirebase('telegram_configs')
        ]);
        
        dataStore.services = services.value || { services: {} };
        dataStore.experiences = experiences.value || { experiences: getDefaultExperiences() };
        dataStore.gallery = gallery.value || { featured: getDefaultGallery() };
        dataStore.blog = blog.value || { posts: getSampleBlogPosts() };
        telegramConfigs = telegram.value || { configs: {}, default: null };
        
        renderAllTabs();
        showStatus('Đã tải dữ liệu từ Firebase', 'success');
    } catch (error) {
        showStatus('Lỗi tải dữ liệu: ' + error.message, 'error');
    }
}