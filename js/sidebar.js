class StandaloneSidebar {
    constructor() {
        this.isOpen = false;
        this.lastStats = this.loadStats(); // Tải dữ liệu cũ từ bộ nhớ
        this.updateInterval = null;
        
        this.createSidebarHTML();
        this.addOnlineIndicator();
        this.init();
    }
    
    async init() {
        this.setupElements();
        this.setupEventListeners();
        
        // Nếu chưa có dữ liệu cũ, tạo mới lần đầu
        if (!this.lastStats) {
            await this.updateStatistics(false);
        } else {
            // Hiển thị ngay dữ liệu cũ để tránh nhấp nháy/thay đổi khi load trang
            this.refreshDisplay();
        }
        
        this.startUpdates();
    }

    // Lưu dữ liệu vào localStorage để giữ thông tin khi load trang
    saveStats(stats) {
        localStorage.setItem('htu_sidebar_stats', JSON.stringify({
            data: stats,
            timestamp: new Date().getTime()
        }));
    }

    loadStats() {
        const saved = localStorage.getItem('htu_sidebar_stats');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Nếu dữ liệu quá cũ (ví dụ > 1 tiếng), bỏ qua để tạo mới
            if (new Date().getTime() - parsed.timestamp < 3600000) {
                return parsed.data;
            }
        }
        return null;
    }
    
    createSidebarHTML() {
        if (document.getElementById('standaloneSidebar')) return;
        
        const sidebarHTML = `
            <div class="standalone-sidebar-overlay" id="standaloneSidebarOverlay"></div>
            
            <aside class="standalone-sidebar" id="standaloneSidebar">
                <div class="standalone-sidebar-header">
                    <div class="standalone-sidebar-header-content">
                        <div class="standalone-sidebar-logo">
                            <img src="https://raw.githubusercontent.com/Datkep92/hoangtung/main/images/htu_vuong512notext.jpg" 
                                 alt="HTU Logo" width="40" height="40">
                            <span>HTU<span>Transport</span></span>
                        </div>
                        <div class="standalone-sidebar-subtitle">Thống kê & Bảng giá</div>
                    </div>
                    <button class="standalone-sidebar-close" id="standaloneSidebarClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="standalone-sidebar-content" id="standaloneSidebarContent">
                    </div>
                
                <div class="standalone-sidebar-footer">
                    <div class="standalone-sidebar-update-time">
                        <i class="far fa-clock"></i>
                        <span>Cập nhật: <span id="standaloneLastUpdateTime">--:--</span></span>
                    </div>
                    <button class="standalone-btn-refresh-stats" id="standaloneRefreshStatsBtn">
                        <i class="fas fa-sync-alt"></i> Làm mới
                    </button>
                </div>
            </aside>
        `;
        
        document.body.insertAdjacentHTML('beforeend', sidebarHTML);
    }
    
    addOnlineIndicator() {
        let headerActions = document.querySelector('.header-actions');
        if (!headerActions) {
            const header = document.querySelector('header') || document.body;
            headerActions = document.createElement('div');
            headerActions.className = 'header-actions';
            // Style để đảm bảo nó nằm bên phải nhất
            headerActions.style.cssText = "display: flex; align-items: center; justify-content: flex-end; flex: 1;";
            header.appendChild(headerActions);
        }
        
        if (!document.getElementById('onlineIndicator')) {
            const indicatorHTML = `
                <div class="online-indicator" id="onlineIndicator" title="Số khách đang online" 
                     style="margin-right: 10px; cursor: pointer; display: flex; align-items: center; gap: 5px; position: relative; z-index: 10;">
                    <i class="fas fa-user-friends"></i>
                    <span class="online-count" id="onlineBadge">0</span>
                </div>
            `;
            headerActions.insertAdjacentHTML('beforeend', indicatorHTML);
        }
    }
    
    setupElements() {
        this.sidebar = document.getElementById('standaloneSidebar');
        this.sidebarOverlay = document.getElementById('standaloneSidebarOverlay');
        this.sidebarContent = document.getElementById('standaloneSidebarContent');
        this.sidebarClose = document.getElementById('standaloneSidebarClose');
        this.refreshStatsBtn = document.getElementById('standaloneRefreshStatsBtn');
        this.lastUpdateTimeEl = document.getElementById('standaloneLastUpdateTime');
        this.onlineBadgeEl = document.getElementById('onlineBadge');
        this.onlineIndicator = document.getElementById('onlineIndicator');
    }
    
    setupEventListeners() {
        if (this.onlineIndicator) {
            this.onlineIndicator.addEventListener('click', () => this.openSidebar());
        }
        
        if (this.sidebarClose) {
            this.sidebarClose.addEventListener('click', () => this.closeSidebar());
        }
        
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
        }
        
        if (this.refreshStatsBtn) {
            this.refreshStatsBtn.addEventListener('click', () => this.updateStatistics(true));
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeSidebar();
            }
        });
    }
    
    startUpdates() {
        // Cập nhật định kỳ mỗi 30s
        this.updateInterval = setInterval(() => {
            this.updateStatistics(false);
        }, 10000);
    }
    
    openSidebar() {
        this.isOpen = true;
        this.sidebar.classList.add('active');
        this.sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Hiển thị dữ liệu ngay khi mở
        this.refreshDisplay();
    }
    
    closeSidebar() {
        this.isOpen = false;
        this.sidebar.classList.remove('active');
        this.sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Logic biến động nhẹ (1-2 đơn vị)
    getFluctuatedValue(currentValue, min, max) {
        const change = Math.floor(Math.random() * 3) - 1; // Trả về -1, 0, hoặc 1
        let newValue = currentValue + change;
        return Math.min(max, Math.max(min, newValue));
    }

    async updateStatistics(isManual = false) {
        try {
            const now = new Date();
            const hour = now.getHours();
            const isPeakHour = (hour >= 7 && hour < 9) || (hour >= 17 && hour < 21);
            
            let stats;
            
            if (!this.lastStats || isManual) {
                // Khởi tạo lần đầu hoặc bấm làm mới thủ công
                stats = {
                    current_online: this.getInitialOnlineCount(hour),
                    bookings_today: this.getInitialBookings(hour),
                    available_cars: this.getInitialCars(hour),
                    is_peak_hour: isPeakHour,
                    peak_intensity: this.getPeakLabel(hour)
                };
            } else {
                // Biến động nhẹ từ dữ liệu cũ
                stats = {
                    current_online: this.getFluctuatedValue(this.lastStats.current_online, 3, 35),
                    bookings_today: this.getFluctuatedValue(this.lastStats.bookings_today, 5, 30),
                    available_cars: this.getFluctuatedValue(this.lastStats.available_cars, 2, 15),
                    is_peak_hour: isPeakHour,
                    peak_intensity: this.getPeakLabel(hour)
                };
            }
            
            this.lastStats = stats;
            this.saveStats(stats);
            this.refreshDisplay();
            
        } catch (error) {
            console.error("Lỗi cập nhật thống kê:", error);
        }
    }

    refreshDisplay() {
        if (!this.lastStats) return;
        
        // Cập nhật Badge ngoài Header
        if (this.onlineBadgeEl) {
            this.onlineBadgeEl.textContent = this.lastStats.current_online;
        }
        
        // Cập nhật Thời gian
        if (this.lastUpdateTimeEl) {
            this.lastUpdateTimeEl.textContent = new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Luôn render nội dung vào sidebar để sẵn sàng khi mở
        this.updateUI(this.lastStats);
    }

    getPeakLabel(hour) {
        if (hour >= 7 && hour < 9) return 'sáng';
        if (hour >= 17 && hour < 19) return 'chiều';
        if (hour >= 19 && hour < 21) return 'tối';
        return 'bình thường';
    }

    getInitialOnlineCount(hour) {
        if (hour >= 0 && hour < 6) return Math.floor(Math.random() * 5) + 3;
        if (hour >= 18 && hour < 22) return Math.floor(Math.random() * 15) + 18;
        return Math.floor(Math.random() * 10) + 10;
    }

    getInitialBookings(hour) {
        if (hour < 6) return 2;
        if (hour < 12) return 12;
        return 22;
    }

    getInitialCars(hour) {
        if (hour >= 18 && hour < 22) return 4;
        return 10;
    }
    
    updateUI(stats) {
        if (!this.sidebarContent) return;
        
        this.sidebarContent.innerHTML = `
            <div class="standalone-stats-section">
                <h4><i class="fas fa-chart-line"></i> THỐNG KÊ LIVE</h4>
                
                <div class="standalone-stat-item">
                    <div class="standalone-stat-icon online">
                        <i class="fas fa-user-friends"></i>
                    </div>
                    <div class="standalone-stat-info">
                        <div class="standalone-stat-label">Đang online</div>
                        <div class="standalone-stat-value">${stats.current_online}</div>
                        <div class="standalone-stat-sub">(trong 5 phút)</div>
                    </div>
                    <div class="standalone-stat-badge ${stats.is_peak_hour ? 'peak' : 'normal'}">
                        ${stats.peak_intensity}
                    </div>
                </div>
                
                <div class="standalone-stat-item">
                    <div class="standalone-stat-icon booking">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="standalone-stat-info">
                        <div class="standalone-stat-label">Đặt hôm nay</div>
                        <div class="standalone-stat-value">${stats.bookings_today}</div>
                        <div class="standalone-stat-sub">(Dự kiến: 25-30 chuyến)</div>
                    </div>
                </div>
                
                <div class="standalone-stat-item">
                    <div class="standalone-stat-icon cars">
                        <i class="fas fa-car"></i>
                    </div>
                    <div class="standalone-stat-info">
                        <div class="standalone-stat-label">Xe có sẵn</div>
                        <div class="standalone-stat-value">${stats.available_cars}/15</div>
                        <div class="standalone-stat-sub">(${Math.round(stats.available_cars/15*100)}% trống)</div>
                    </div>
                </div>
            </div>
            
            <div class="standalone-stats-section">
                <h4><i class="fas fa-file-invoice-dollar"></i> BẢNG GIÁ</h4>
                <div class="standalone-pricing-item">
                    <div class="route-header">
                        <div class="route-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <div class="route-title">Phan Rang ⇄ Sân Bay Cam Ranh</div>
                    </div>
                    <div class="route-details"><span class="route-price"><i class="fas fa-tag"></i> 500.000 VND</span></div>
                </div>
                <div class="standalone-pricing-item">
                    <div class="route-header">
                        <div class="route-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <div class="route-title">Du lịch Vĩnh Hy (Trọn gói)</div>
                    </div>
                    <div class="route-details"><span class="route-price"><i class="fas fa-tag"></i> 1.200.000 VND</span></div>
                </div>
            </div>
            
            <div class="standalone-stats-section">
                <h4><i class="fas fa-bolt"></i> HÀNH ĐỘNG NHANH</h4>
                <div style="display: grid; gap: 10px; margin-top: 15px;">
                    <a href="tel:0567033888" style="width: 100%; text-align: center; padding: 12px; background: #28a745; color: white; border-radius: 5px; text-decoration: none; display: block; font-weight: bold;">
                        <i class="fas fa-phone-alt"></i> Gọi: 0567.033.888
                    </a>
                </div>
            </div>
        `;
    }
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    window.standaloneSidebar = new StandaloneSidebar();
});