// ===== STATISTICS MANAGER FOR ADMIN =====

class StatisticsManager {
    constructor() {
        this.config = null;
        this.liveData = null;
        this.realData = null;
        this.logs = [];
        this.updateInterval = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadStatisticsData = this.loadStatisticsData.bind(this);
        this.updateStatistics = this.updateStatistics.bind(this);
        this.renderLivePreview = this.renderLivePreview.bind(this);
        this.renderLogs = this.renderLogs.bind(this);
    }
    
    async init() {
        console.log("📊 Initializing Statistics Manager...");
        
        // Load initial data
        await this.loadStatisticsData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start auto refresh
        this.startAutoRefresh();
        
        // Initial render
        await this.renderAll();
        
        console.log("✅ Statistics Manager initialized");
    }
    
    async loadStatisticsData() {
        if (!database) {
            console.warn("⚠️ Database not available, using local storage");
            this.loadFromLocalStorage();
            return;
        }
        
        try {
            // Load config
            const configSnapshot = await database.ref('statistics/config').once('value');
            this.config = configSnapshot.val() || this.getDefaultConfig();
            
            // Load live data
            const liveSnapshot = await database.ref('statistics/live').once('value');
            this.liveData = liveSnapshot.val() || this.getDefaultLiveData();
            
            // Load logs
            const logsSnapshot = await database.ref('statistics/logs').once('value');
            const logsData = logsSnapshot.val() || {};
            this.logs = this.processLogs(logsData);
            
            // Load real data
            await this.loadRealData();
            
            // Update UI with loaded data
            this.updateConfigUI();
            
        } catch (error) {
            console.error("❌ Error loading statistics data:", error);
            this.loadFromLocalStorage();
        }
    }
    
    getDefaultConfig() {
        return {
            total_cars: 15,
            base_online: 15,
            base_bookings: 8,
            auto_update: true,
            last_reset: new Date().toISOString().split('T')[0],
            hourly_multipliers: {
                "00-06": 0.2, "06-09": 0.6, "09-12": 0.9,
                "12-14": 1.0, "14-18": 1.2, "18-21": 1.5, "21-24": 0.8
            },
            weekend_boost: 1.3,
            manual_override: { online: null, bookings: null, cars: null }
        };
    }
    
    getDefaultLiveData() {
        return {
            current_online: 15,
            bookings_today: 8,
            available_cars: 10,
            is_peak_hour: false,
            updated_at: Date.now()
        };
    }
    
    processLogs(logsData) {
        const allLogs = [];
        
        // Process manual updates
        if (logsData.manual_updates) {
            Object.values(logsData.manual_updates).forEach(log => {
                allLogs.push({
                    type: 'manual',
                    timestamp: log.timestamp,
                    action: 'Cập nhật thủ công',
                    details: JSON.stringify(log.data)
                });
            });
        }
        
        // Process daily resets
        if (logsData.daily_resets) {
            Object.values(logsData.daily_resets).forEach(log => {
                allLogs.push({
                    type: 'reset',
                    timestamp: log.timestamp,
                    action: 'Reset ngày mới',
                    details: `Ngày: ${log.date}`
                });
            });
        }
        
        // Sort by timestamp (newest first)
        return allLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    }
    
    async loadRealData() {
        if (!database) {
            this.realData = { real_online: 0, real_bookings: 0, total_sessions: 0, total_bookings: 0 };
            return;
        }
        
        try {
            // Count real online users (active in last 5 minutes)
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const sessionsSnapshot = await database.ref('user_sessions').once('value');
            const sessions = sessionsSnapshot.val() || {};
            
            const realOnline = Object.values(sessions).filter(session => 
                session.last_active > fiveMinutesAgo
            ).length;
            
            // Count today's bookings
            const today = new Date().toISOString().split('T')[0];
            const bookingsSnapshot = await database.ref('booking_logs').once('value');
            const bookings = bookingsSnapshot.val() || {};
            
            const realBookings = Object.values(bookings).filter(booking => {
                if (!booking.timestamp || !booking.status) return false;
                const bookingDate = new Date(booking.timestamp).toISOString().split('T')[0];
                return bookingDate === today && booking.status === 'confirmed';
            }).length;
            
            this.realData = {
                real_online: realOnline,
                real_bookings: realBookings,
                total_sessions: Object.keys(sessions).length,
                total_bookings: Object.keys(bookings).length
            };
            
            this.updateRealDataUI();
            
        } catch (error) {
            console.error("❌ Error loading real data:", error);
            this.realData = { real_online: 0, real_bookings: 0, total_sessions: 0, total_bookings: 0 };
        }
    }
    
    loadFromLocalStorage() {
        const savedConfig = localStorage.getItem('luxurymove_stats_config');
        const savedLive = localStorage.getItem('luxurymove_stats_live');
        
        this.config = savedConfig ? JSON.parse(savedConfig) : this.getDefaultConfig();
        this.liveData = savedLive ? JSON.parse(savedLive) : this.getDefaultLiveData();
        this.realData = { real_online: 0, real_bookings: 0, total_sessions: 0, total_bookings: 0 };
        this.logs = [];
        
        this.updateConfigUI();
    }
    
    setupEventListeners() {
        // Setup range value displays
        const ranges = document.querySelectorAll('input[type="range"]');
        ranges.forEach(range => {
            // Set initial value display
            this.updateRangeValue(range);
            
            // Update display on change
            range.addEventListener('input', () => {
                this.updateRangeValue(range);
            });
        });
    }
    
    updateRangeValue(range) {
        const valueSpan = document.getElementById(range.id + 'Value');
        if (valueSpan) {
            if (range.id === 'weekendBoost') {
                valueSpan.textContent = range.value + '%';
            } else {
                valueSpan.textContent = range.value + '%';
            }
        }
    }
    
    startAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Refresh every 10 seconds when tab is active
        this.updateInterval = setInterval(() => {
            if (!document.hidden) {
                this.updateStatistics();
            }
        }, 10000);
    }
    
    async updateStatistics(force = false) {
        try {
            // Reload data
            await this.loadStatisticsData();
            
            // Render updates
            await this.renderAll();
            
            if (force) {
                showStatus('Đã cập nhật thống kê', 'success');
            }
            
        } catch (error) {
            console.error("❌ Error updating statistics:", error);
            if (force) {
                showStatus('Lỗi khi cập nhật', 'error');
            }
        }
    }
    
    async renderAll() {
        this.renderLivePreview();
        this.renderLogs();
        this.updateRealDataUI();
    }
    
    renderLivePreview() {
        const container = document.getElementById('livePreview');
        if (!container || !this.liveData) return;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        container.innerHTML = `
            <div class="live-stat-card">
                <div class="live-stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="live-stat-label">Đang online</div>
                <div class="live-stat-value">${this.liveData.current_online}</div>
                <div class="live-stat-sub">${timeStr}</div>
                <div class="live-stat-badge ${this.liveData.is_peak_hour ? 'peak' : 'normal'}">
                    ${this.liveData.is_peak_hour ? '⏰ Cao điểm' : '📊 Bình thường'}
                </div>
            </div>
            
            <div class="live-stat-card">
                <div class="live-stat-icon">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="live-stat-label">Booking hôm nay</div>
                <div class="live-stat-value">${this.liveData.bookings_today}</div>
                <div class="live-stat-sub">${this.config?.last_reset || 'Hôm nay'}</div>
                <div class="live-stat-badge ${this.liveData.bookings_today > 10 ? 'peak' : 'normal'}">
                    ${this.liveData.bookings_today > 10 ? '🔥 Bận' : '📈 Ổn định'}
                </div>
            </div>
            
            <div class="live-stat-card">
                <div class="live-stat-icon">
                    <i class="fas fa-car"></i>
                </div>
                <div class="live-stat-label">Xe trống</div>
                <div class="live-stat-value">${this.liveData.available_cars}/${this.config?.total_cars || 15}</div>
                <div class="live-stat-sub">${Math.round((this.liveData.available_cars/(this.config?.total_cars || 15))*100)}% trống</div>
                <div class="live-stat-badge ${this.liveData.available_cars < 5 ? 'peak' : 'normal'}">
                    ${this.liveData.available_cars < 5 ? '⚠️ Ít xe' : '✅ Đủ xe'}
                </div>
            </div>
            
            <div class="live-stat-card">
                <div class="live-stat-icon">
                    <i class="fas fa-calculator"></i>
                </div>
                <div class="live-stat-label">Tự động cập nhật</div>
                <div class="live-stat-value">${this.config?.auto_update ? 'BẬT' : 'TẮT'}</div>
                <div class="live-stat-sub">${this.config?.auto_update ? '30 giây/lần' : 'Thủ công'}</div>
                <div class="live-stat-badge ${this.config?.auto_update ? 'normal' : 'peak'}">
                    ${this.config?.auto_update ? '🔄 Auto' : '✋ Manual'}
                </div>
            </div>
        `;
    }
    
    renderLogs() {
        const container = document.getElementById('logsContainer');
        if (!container) return;
        
        if (this.logs.length === 0) {
            container.innerHTML = '<div class="no-logs">Chưa có lịch sử thay đổi</div>';
            return;
        }
        
        let html = '';
        this.logs.forEach(log => {
            const time = new Date(log.timestamp).toLocaleString('vi-VN');
            
            html += `
                <div class="log-item">
                    <div class="log-time">${time}</div>
                    <div class="log-action">${log.action}</div>
                    ${log.details ? `<div class="log-details">${log.details}</div>` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    updateConfigUI() {
        if (!this.config) return;
        
        // Basic settings
        const totalCars = document.getElementById('totalCars');
        const baseOnline = document.getElementById('baseOnline');
        const baseBookings = document.getElementById('baseBookings');
        const weekendBoost = document.getElementById('weekendBoost');
        const autoUpdate = document.getElementById('autoUpdate');
        
        if (totalCars) totalCars.value = this.config.total_cars || 15;
        if (baseOnline) baseOnline.value = this.config.base_online || 15;
        if (baseBookings) baseBookings.value = this.config.base_bookings || 8;
        if (weekendBoost) {
            weekendBoost.value = Math.round((this.config.weekend_boost || 1.3) * 100);
            this.updateRangeValue(weekendBoost);
        }
        if (autoUpdate) autoUpdate.checked = this.config.auto_update !== false;
        
        // Multipliers
        const multipliers = this.config.hourly_multipliers || {};
        Object.keys(multipliers).forEach(key => {
            const range = document.getElementById(`mult${this.formatKey(key)}`);
            if (range) {
                range.value = Math.round(multipliers[key] * 100);
                this.updateRangeValue(range);
            }
        });
        
        // Manual overrides
        const overrides = this.config.manual_override || {};
        const overrideOnline = document.getElementById('overrideOnline');
        const overrideBookings = document.getElementById('overrideBookings');
        const overrideCars = document.getElementById('overrideCars');
        
        if (overrideOnline) overrideOnline.value = overrides.online || '';
        if (overrideBookings) overrideBookings.value = overrides.bookings || '';
        if (overrideCars) overrideCars.value = overrides.cars || '';
    }
    
    updateRealDataUI() {
        if (!this.realData) return;
        
        const realOnlineCount = document.getElementById('realOnlineCount');
        const realBookingsCount = document.getElementById('realBookingsCount');
        const totalSessionsCount = document.getElementById('totalSessionsCount');
        const totalBookingsCount = document.getElementById('totalBookingsCount');
        
        if (realOnlineCount) realOnlineCount.textContent = this.realData.real_online || 0;
        if (realBookingsCount) realBookingsCount.textContent = this.realData.real_bookings || 0;
        if (totalSessionsCount) totalSessionsCount.textContent = this.realData.total_sessions || 0;
        if (totalBookingsCount) totalBookingsCount.textContent = this.realData.total_bookings || 0;
    }
    
    formatKey(key) {
        // Convert "00-06" to "Night", "06-09" to "Morning", etc.
        const map = {
            '00-06': 'Night',
            '06-09': 'Morning',
            '09-12': 'LateMorning',
            '12-14': 'Noon',
            '14-18': 'Afternoon',
            '18-21': 'Evening',
            '21-24': 'LateEvening'
        };
        return map[key] || key;
    }
    
    // ===== PUBLIC METHODS =====
    
    async updateConfigField(field, value) {
        if (!this.config) return;
        
        // Update config object
        const keys = field.split('.');
        let obj = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        
        // Convert value types
        let finalValue = value;
        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') finalValue = true;
            else if (value.toLowerCase() === 'false') finalValue = false;
            else if (!isNaN(value) && value.trim() !== '') {
                finalValue = Number(value);
            }
        }
        
        obj[keys[keys.length - 1]] = finalValue;
        
        // Save to Firebase
        await this.saveConfig();
        
        // Update statistics if auto_update is enabled
        if (this.config.auto_update) {
            await this.calculateAndUpdate();
        }
    }
    
    async updateMultiplier(key, value) {
        if (!this.config) return;
        
        if (!this.config.hourly_multipliers) {
            this.config.hourly_multipliers = {};
        }
        
        this.config.hourly_multipliers[key] = parseFloat(value);
        
        await this.saveConfig();
        
        // Update statistics if auto_update is enabled
        if (this.config.auto_update) {
            await this.calculateAndUpdate();
        }
    }
    
    async saveConfig() {
        if (!database) {
            localStorage.setItem('luxurymove_stats_config', JSON.stringify(this.config));
            showStatus('Đã lưu cấu hình (local)', 'warning');
            return;
        }
        
        try {
            await database.ref('statistics/config').set(this.config);
            
            // Log the change
            await database.ref('statistics/logs/manual_updates').push({
                timestamp: Date.now(),
                action: 'config_update',
                field: 'config',
                value: JSON.stringify(this.config)
            });
            
            showStatus('Đã lưu cấu hình', 'success');
            
        } catch (error) {
            console.error("❌ Error saving config:", error);
            showStatus('Lỗi khi lưu cấu hình', 'error');
        }
    }
    
    async applyOverride(type) {
        const input = document.getElementById(`override${this.capitalize(type)}`);
        if (!input || !input.value) return;
        
        const value = parseInt(input.value);
        if (isNaN(value)) {
            showStatus('Vui lòng nhập số hợp lệ', 'error');
            return;
        }
        
        if (!this.config.manual_override) {
            this.config.manual_override = {};
        }
        
        this.config.manual_override[type] = value;
        
        await this.saveConfig();
        
        // Immediately apply override
        await this.calculateAndUpdate();
        
        showStatus(`Đã ghi đè ${type}: ${value}`, 'success');
    }
    
    async clearOverrides() {
        if (!this.config) return;
        
        this.config.manual_override = {
            online: null,
            bookings: null,
            cars: null
        };
        
        await this.saveConfig();
        
        // Clear input fields
        const overrideOnline = document.getElementById('overrideOnline');
        const overrideBookings = document.getElementById('overrideBookings');
        const overrideCars = document.getElementById('overrideCars');
        
        if (overrideOnline) overrideOnline.value = '';
        if (overrideBookings) overrideBookings.value = '';
        if (overrideCars) overrideCars.value = '';
        
        // Recalculate
        await this.calculateAndUpdate();
        
        showStatus('Đã xóa ghi đè', 'success');
    }
    
    async calculateAndUpdate() {
        if (!database) return;
        
        try {
            // Calculate smart statistics
            const calculated = this.calculateSmartStatistics();
            
            // Apply manual overrides
            const finalStats = { ...calculated };
            
            if (this.config.manual_override) {
                if (this.config.manual_override.online !== null) {
                    finalStats.current_online = this.config.manual_override.online;
                }
                if (this.config.manual_override.bookings !== null) {
                    finalStats.bookings_today = this.config.manual_override.bookings;
                }
                if (this.config.manual_override.cars !== null) {
                    finalStats.available_cars = this.config.manual_override.cars;
                }
            }
            
            finalStats.updated_at = Date.now();
            
            // Save to Firebase
            await database.ref('statistics/live').set(finalStats);
            
            // Update local data
            this.liveData = finalStats;
            
            // Update UI
            this.renderLivePreview();
            
        } catch (error) {
            console.error("❌ Error calculating statistics:", error);
            showStatus('Lỗi tính toán thống kê', 'error');
        }
    }
    
    calculateSmartStatistics() {
        if (!this.config) return this.getDefaultLiveData();
        
        const now = new Date();
        const hour = now.getHours();
        const isWeekend = [0, 6].includes(now.getDay());
        
        // Determine hour multiplier
        let hourMultiplier = 1.0;
        if (hour >= 0 && hour < 6) hourMultiplier = this.config.hourly_multipliers?.["00-06"] || 0.2;
        else if (hour >= 6 && hour < 9) hourMultiplier = this.config.hourly_multipliers?.["06-09"] || 0.6;
        else if (hour >= 9 && hour < 12) hourMultiplier = this.config.hourly_multipliers?.["09-12"] || 0.9;
        else if (hour >= 12 && hour < 14) hourMultiplier = this.config.hourly_multipliers?.["12-14"] || 1.0;
        else if (hour >= 14 && hour < 18) hourMultiplier = this.config.hourly_multipliers?.["14-18"] || 1.2;
        else if (hour >= 18 && hour < 21) hourMultiplier = this.config.hourly_multipliers?.["18-21"] || 1.5;
        else hourMultiplier = this.config.hourly_multipliers?.["21-24"] || 0.8;
        
        // Apply weekend boost
        if (isWeekend) {
            hourMultiplier *= (this.config.weekend_boost || 1.3);
        }
        
        // Calculate with random variation
        const randomFactor = 0.9 + Math.random() * 0.2;
        const online = Math.round(this.config.base_online * hourMultiplier * randomFactor);
        
        const bookingRandomFactor = 0.8 + Math.random() * 0.4;
        const bookings = Math.round(this.config.base_bookings * hourMultiplier * bookingRandomFactor);
        
        const availableCars = Math.max(1, this.config.total_cars - Math.floor(bookings * 0.6));
        
        return {
            current_online: Math.max(1, online),
            bookings_today: Math.max(0, bookings),
            available_cars: Math.min(this.config.total_cars, availableCars),
            is_peak_hour: hourMultiplier > 1.0
        };
    }
    
    async calculatePreview() {
        const calculated = this.calculateSmartStatistics();
        
        // Show preview alert
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN');
        
        alert(`📊 XEM TRƯỚC TÍNH TOÁN\n\n` +
              `⏰ Thời gian: ${timeStr}\n` +
              `👤 Online: ${calculated.current_online}\n` +
              `📅 Booking: ${calculated.bookings_today}\n` +
              `🚗 Xe trống: ${calculated.available_cars}\n` +
              `📈 Cao điểm: ${calculated.is_peak_hour ? 'Có' : 'Không'}\n\n` +
              `Tự động cập nhật: ${this.config?.auto_update ? 'BẬT' : 'TẮT'}`);
    }
    
    async refreshRealData() {
        await this.loadRealData();
        showStatus('Đã làm mới dữ liệu thực', 'success');
    }
    
    async clearOldSessions() {
        if (!database || !confirm('Xóa tất cả session cũ (trước 24h)?')) return;
        
        try {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            const sessionsSnapshot = await database.ref('user_sessions').once('value');
            const sessions = sessionsSnapshot.val() || {};
            
            const updates = {};
            Object.keys(sessions).forEach(key => {
                if (sessions[key].last_active < oneDayAgo) {
                    updates[`user_sessions/${key}`] = null;
                }
            });
            
            if (Object.keys(updates).length > 0) {
                await database.ref().update(updates);
                await this.loadRealData();
                showStatus(`Đã xóa ${Object.keys(updates).length} session cũ`, 'success');
            } else {
                showStatus('Không có session nào cũ', 'info');
            }
            
        } catch (error) {
            console.error("❌ Error clearing old sessions:", error);
            showStatus('Lỗi khi xóa session', 'error');
        }
    }
    
    async resetDailyStatistics() {
        if (!database || !confirm('Reset thống kê ngày mới? Booking sẽ về 0.')) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Update config
            this.config.last_reset = today;
            await database.ref('statistics/config/last_reset').set(today);
            
            // Reset live data
            const resetData = {
                bookings_today: 0,
                updated_at: Date.now()
            };
            
            await database.ref('statistics/live').update(resetData);
            
            // Log the reset
            await database.ref('statistics/logs/daily_resets').push({
                timestamp: Date.now(),
                date: today,
                action: 'daily_reset'
            });
            
            // Reload data
            await this.loadStatisticsData();
            await this.renderAll();
            
            showStatus('Đã reset thống kê ngày mới', 'success');
            
        } catch (error) {
            console.error("❌ Error resetting daily statistics:", error);
            showStatus('Lỗi khi reset', 'error');
        }
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize statistics manager
let statisticsManager = null;

document.addEventListener('DOMContentLoaded', () => {
    statisticsManager = new StatisticsManager();
    
    // Initialize after Firebase is ready
    if (typeof database !== 'undefined' && database) {
        setTimeout(() => {
            statisticsManager.init();
        }, 1000);
    }
});

// Make globally available
window.statisticsManager = statisticsManager;