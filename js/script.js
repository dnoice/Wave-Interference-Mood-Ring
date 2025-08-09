// Wave Interference Mood Ring - Advanced JavaScript Logic

(function() {
    'use strict';

    // ========== Configuration ========== //
    const CONFIG = {
        waves: {
            count: 4,
            defaultFrequency: 2,
            defaultAmplitude: 50,
            defaultPhase: 0,
            defaultDirection: 0
        },
        canvas: {
            resolution: window.devicePixelRatio || 1,
            gridSize: 2,
            updateInterval: 1000 / 60 // 60 FPS
        },
        animation: {
            speed: 1,
            smoothing: 0.1
        },
        colors: {
            rainbow: ['#ff0080', '#ff8c00', '#ffd700', '#00ff00', '#00ffff', '#0080ff', '#8000ff', '#ff00ff'],
            ocean: ['#001f3f', '#003f7f', '#0074d9', '#39cccc', '#7fdbff', '#b3ecff', '#e6f7ff', '#ffffff'],
            sunset: ['#120e2e', '#392549', '#6b2c5f', '#a33561', '#d64545', '#ff6b35', '#ffa947', '#ffd23f'],
            aurora: ['#011926', '#003e5c', '#016a70', '#00a896', '#02c39a', '#7fd8be', '#b8f3d0', '#e8fcc2']
        },
        presets: {
            calm: {
                waves: [
                    { frequency: 1, amplitude: 30, phase: 0, direction: 0 },
                    { frequency: 1.5, amplitude: 25, phase: 90, direction: 45 },
                    { frequency: 2, amplitude: 20, phase: 180, direction: 90 },
                    { frequency: 0.5, amplitude: 15, phase: 270, direction: 135 }
                ],
                speed: 0.5,
                colorMode: 'ocean'
            },
            energetic: {
                waves: [
                    { frequency: 5, amplitude: 60, phase: 0, direction: 0 },
                    { frequency: 7, amplitude: 50, phase: 45, direction: 90 },
                    { frequency: 3, amplitude: 70, phase: 90, direction: 180 },
                    { frequency: 9, amplitude: 40, phase: 135, direction: 270 }
                ],
                speed: 2,
                colorMode: 'rainbow'
            },
            hypnotic: {
                waves: [
                    { frequency: 2, amplitude: 50, phase: 0, direction: 0 },
                    { frequency: 2.1, amplitude: 50, phase: 10, direction: 5 },
                    { frequency: 2.2, amplitude: 50, phase: 20, direction: 10 },
                    { frequency: 2.3, amplitude: 50, phase: 30, direction: 15 }
                ],
                speed: 1,
                colorMode: 'aurora'
            },
            chaos: {
                waves: [
                    { frequency: 8, amplitude: 80, phase: 0, direction: 0 },
                    { frequency: 13, amplitude: 70, phase: 137, direction: 73 },
                    { frequency: 21, amplitude: 60, phase: 222, direction: 147 },
                    { frequency: 34, amplitude: 50, phase: 315, direction: 251 }
                ],
                speed: 3,
                colorMode: 'sunset'
            },
            zen: {
                waves: [
                    { frequency: 0.5, amplitude: 40, phase: 0, direction: 0 },
                    { frequency: 0.75, amplitude: 35, phase: 120, direction: 120 },
                    { frequency: 1, amplitude: 30, phase: 240, direction: 240 },
                    { frequency: 0.25, amplitude: 25, phase: 360, direction: 360 }
                ],
                speed: 0.3,
                colorMode: 'ocean'
            }
        }
    };

    // ========== State Management ========== //
    class WaveState {
        constructor() {
            this.waves = [];
            this.globalSpeed = 1;
            this.colorIntensity = 75;
            this.colorMode = 'rainbow';
            this.isPlaying = true;
            this.time = 0;
            this.activeWaveTab = 1;
            
            // Initialize waves
            for (let i = 0; i < CONFIG.waves.count; i++) {
                this.waves.push({
                    enabled: i < 2, // Enable first 2 waves by default
                    frequency: CONFIG.waves.defaultFrequency + i * 0.5,
                    amplitude: CONFIG.waves.defaultAmplitude,
                    phase: CONFIG.waves.defaultPhase + i * 90,
                    direction: CONFIG.waves.defaultDirection + i * 45,
                    // Smooth interpolation values
                    currentFrequency: CONFIG.waves.defaultFrequency + i * 0.5,
                    currentAmplitude: CONFIG.waves.defaultAmplitude,
                    currentPhase: CONFIG.waves.defaultPhase + i * 90,
                    currentDirection: CONFIG.waves.defaultDirection + i * 45
                });
            }
        }
        
        updateWave(index, property, value) {
            if (this.waves[index]) {
                this.waves[index][property] = value;
            }
        }
        
        applyPreset(preset) {
            const presetData = CONFIG.presets[preset];
            if (!presetData) return;
            
            this.globalSpeed = presetData.speed;
            this.colorMode = presetData.colorMode;
            
            presetData.waves.forEach((waveData, index) => {
                if (this.waves[index]) {
                    Object.assign(this.waves[index], waveData);
                    this.waves[index].enabled = true;
                }
            });
        }
        
        reset() {
            this.waves.forEach((wave, index) => {
                wave.enabled = index < 2;
                wave.frequency = CONFIG.waves.defaultFrequency + index * 0.5;
                wave.amplitude = CONFIG.waves.defaultAmplitude;
                wave.phase = CONFIG.waves.defaultPhase + index * 90;
                wave.direction = CONFIG.waves.defaultDirection + index * 45;
            });
            this.globalSpeed = 1;
            this.colorIntensity = 75;
            this.colorMode = 'rainbow';
        }
        
        randomize() {
            this.waves.forEach(wave => {
                wave.enabled = Math.random() > 0.3;
                wave.frequency = Math.random() * 10 + 0.1;
                wave.amplitude = Math.random() * 100;
                wave.phase = Math.random() * 360;
                wave.direction = Math.random() * 360;
            });
            this.globalSpeed = Math.random() * 3 + 0.5;
            this.colorIntensity = Math.random() * 50 + 50;
            const modes = Object.keys(CONFIG.colors);
            this.colorMode = modes[Math.floor(Math.random() * modes.length)];
        }
    }

    // ========== Canvas Renderer ========== //
    class WaveRenderer {
        constructor(canvas, state) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.state = state;
            this.width = 0;
            this.height = 0;
            this.imageData = null;
            this.pixels = null;
            
            this.setupCanvas();
            this.bindEvents();
        }
        
        setupCanvas() {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
        
        resizeCanvas() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.width = rect.width;
            this.height = rect.height;
            
            this.canvas.width = this.width * CONFIG.canvas.resolution;
            this.canvas.height = this.height * CONFIG.canvas.resolution;
            
            this.canvas.style.width = `${this.width}px`;
            this.canvas.style.height = `${this.height}px`;
            
            this.ctx.scale(CONFIG.canvas.resolution, CONFIG.canvas.resolution);
            
            // Create image data buffer for pixel manipulation
            this.imageData = this.ctx.createImageData(
                this.width * CONFIG.canvas.resolution,
                this.height * CONFIG.canvas.resolution
            );
            this.pixels = this.imageData.data;
        }
        
        bindEvents() {
            // Mouse interaction for wave distortion
            let mouseX = 0, mouseY = 0;
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                mouseX = (e.clientX - rect.left) / rect.width;
                mouseY = (e.clientY - rect.top) / rect.height;
                this.mouseDistortion = { x: mouseX, y: mouseY };
            });
            
            this.canvas.addEventListener('mouseleave', () => {
                this.mouseDistortion = null;
            });
        }
        
        render() {
            // Smooth interpolation for wave parameters
            this.state.waves.forEach(wave => {
                const smooth = CONFIG.animation.smoothing;
                wave.currentFrequency += (wave.frequency - wave.currentFrequency) * smooth;
                wave.currentAmplitude += (wave.amplitude - wave.currentAmplitude) * smooth;
                wave.currentPhase += (wave.phase - wave.currentPhase) * smooth;
                wave.currentDirection += (wave.direction - wave.currentDirection) * smooth;
            });
            
            // Clear canvas with subtle fade effect
            this.ctx.fillStyle = `rgba(10, 10, 15, 0.05)`;
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Calculate interference pattern
            const gridSize = CONFIG.canvas.gridSize;
            const time = this.state.time;
            const colors = CONFIG.colors[this.state.colorMode];
            
            for (let x = 0; x < this.width; x += gridSize) {
                for (let y = 0; y < this.height; y += gridSize) {
                    let totalWave = 0;
                    let activeWaves = 0;
                    
                    // Calculate wave interference at this point
                    this.state.waves.forEach((wave, index) => {
                        if (!wave.enabled) return;
                        
                        const dirRad = (wave.currentDirection * Math.PI) / 180;
                        const phaseRad = (wave.currentPhase * Math.PI) / 180;
                        
                        // Project coordinates onto wave direction
                        const projX = x * Math.cos(dirRad) + y * Math.sin(dirRad);
                        
                        // Calculate wave value with time evolution
                        const waveValue = Math.sin(
                            (projX / 50) * wave.currentFrequency + 
                            phaseRad + 
                            time * wave.currentFrequency * 0.05
                        ) * (wave.currentAmplitude / 100);
                        
                        totalWave += waveValue;
                        activeWaves++;
                    });
                    
                    if (activeWaves === 0) continue;
                    
                    // Normalize and apply color
                    const normalizedWave = (totalWave / activeWaves + 1) / 2;
                    const colorIndex = Math.floor(normalizedWave * (colors.length - 1));
                    const colorBlend = (normalizedWave * (colors.length - 1)) % 1;
                    
                    // Interpolate between colors
                    const color1 = this.hexToRgb(colors[Math.min(colorIndex, colors.length - 1)]);
                    const color2 = this.hexToRgb(colors[Math.min(colorIndex + 1, colors.length - 1)]);
                    
                    const r = Math.floor(color1.r + (color2.r - color1.r) * colorBlend);
                    const g = Math.floor(color1.g + (color2.g - color1.g) * colorBlend);
                    const b = Math.floor(color1.b + (color2.b - color1.b) * colorBlend);
                    
                    // Apply color intensity
                    const intensity = this.state.colorIntensity / 100;
                    const alpha = Math.abs(totalWave) * intensity;
                    
                    // Apply mouse distortion if present
                    let finalAlpha = alpha;
                    if (this.mouseDistortion) {
                        const dx = x / this.width - this.mouseDistortion.x;
                        const dy = y / this.height - this.mouseDistortion.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const distortionAmount = Math.exp(-dist * 5) * 0.5;
                        finalAlpha = Math.min(1, alpha + distortionAmount);
                    }
                    
                    // Draw point
                    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
                    this.ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
            
            // Add glow effect
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.filter = 'blur(2px)';
            this.ctx.globalAlpha = 0.5;
            this.ctx.drawImage(this.canvas, 0, 0, this.width, this.height);
            
            // Reset composite operation
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.filter = 'none';
            this.ctx.globalAlpha = 1;
            
            // Update time
            if (this.state.isPlaying) {
                this.state.time += this.state.globalSpeed * 0.1;
            }
        }
        
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 255, g: 255, b: 255 };
        }
        
        screenshot() {
            const link = document.createElement('a');
            link.download = `wave-interference-${Date.now()}.png`;
            link.href = this.canvas.toDataURL();
            link.click();
        }
    }

    // ========== UI Controller ========== //
    class UIController {
        constructor(state, renderer) {
            this.state = state;
            this.renderer = renderer;
            this.elements = {};
            
            this.cacheElements();
            this.initializeControls();
            this.bindEvents();
            this.setupKeyboardShortcuts();
        }
        
        cacheElements() {
            // Loading screen
            this.elements.loadingScreen = document.getElementById('loadingScreen');
            
            // Header controls
            this.elements.btnFullscreen = document.getElementById('btnFullscreen');
            this.elements.btnScreenshot = document.getElementById('btnScreenshot');
            this.elements.btnInfo = document.getElementById('btnInfo');
            
            // Canvas overlay stats
            this.elements.statFrequency = document.getElementById('statFrequency');
            this.elements.statAmplitude = document.getElementById('statAmplitude');
            this.elements.statPhase = document.getElementById('statPhase');
            
            // Control panel
            this.elements.controlPanel = document.getElementById('controlPanel');
            this.elements.btnCollapsePanel = document.getElementById('btnCollapsePanel');
            
            // Global controls
            this.elements.globalSpeed = document.getElementById('globalSpeed');
            this.elements.globalSpeedValue = document.getElementById('globalSpeedValue');
            this.elements.colorIntensity = document.getElementById('colorIntensity');
            this.elements.colorIntensityValue = document.getElementById('colorIntensityValue');
            
            // Color mode buttons
            this.elements.colorModeButtons = document.querySelectorAll('.btn-mode');
            
            // Wave tabs
            this.elements.tabButtons = document.querySelectorAll('.tab-button');
            this.elements.tabContents = document.querySelectorAll('.tab-content');
            
            // Preset buttons
            this.elements.presetButtons = document.querySelectorAll('.btn-preset');
            
            // Action buttons
            this.elements.btnPlay = document.getElementById('btnPlay');
            this.elements.btnReset = document.getElementById('btnReset');
            this.elements.btnExport = document.getElementById('btnExport');
            
            // Modal
            this.elements.infoModal = document.getElementById('infoModal');
            this.elements.btnCloseModal = document.getElementById('btnCloseModal');
        }
        
        initializeControls() {
            // Set initial values
            this.elements.globalSpeed.value = this.state.globalSpeed;
            this.elements.globalSpeedValue.textContent = `${this.state.globalSpeed.toFixed(1)}x`;
            
            this.elements.colorIntensity.value = this.state.colorIntensity;
            this.elements.colorIntensityValue.textContent = `${this.state.colorIntensity}%`;
            
            // Create wave controls dynamically
            this.createWaveControls();
            
            // Hide loading screen
            setTimeout(() => {
                this.elements.loadingScreen.classList.add('hidden');
            }, 1500);
        }
        
        createWaveControls() {
            for (let i = 0; i < CONFIG.waves.count; i++) {
                const waveNum = i + 1;
                const container = document.getElementById(`wave${waveNum}`);
                
                if (!container) {
                    // Create wave control HTML
                    const tabContent = document.createElement('div');
                    tabContent.className = 'tab-content';
                    tabContent.id = `wave${waveNum}`;
                    if (i > 0) tabContent.style.display = 'none';
                    
                    tabContent.innerHTML = `
                        <div class="wave-header">
                            <h3 class="wave-title">Wave ${waveNum} Parameters</h3>
                            <label class="toggle-switch">
                                <input type="checkbox" id="wave${waveNum}Enable" ${this.state.waves[i].enabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">
                                <i class="fas fa-wave-square"></i>
                                Frequency
                            </label>
                            <div class="slider-container">
                                <input type="range" id="wave${waveNum}Frequency" class="slider" 
                                       min="0.1" max="10" step="0.1" value="${this.state.waves[i].frequency}">
                                <span class="slider-value">${this.state.waves[i].frequency.toFixed(1)} Hz</span>
                            </div>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">
                                <i class="fas fa-chart-line"></i>
                                Amplitude
                            </label>
                            <div class="slider-container">
                                <input type="range" id="wave${waveNum}Amplitude" class="slider" 
                                       min="0" max="100" step="1" value="${this.state.waves[i].amplitude}">
                                <span class="slider-value">${this.state.waves[i].amplitude}</span>
                            </div>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">
                                <i class="fas fa-sync"></i>
                                Phase Shift
                            </label>
                            <div class="slider-container">
                                <input type="range" id="wave${waveNum}Phase" class="slider" 
                                       min="0" max="360" step="1" value="${this.state.waves[i].phase}">
                                <span class="slider-value">${this.state.waves[i].phase}°</span>
                            </div>
                        </div>
                        
                        <div class="control-group">
                            <label class="control-label">
                                <i class="fas fa-angle-double-right"></i>
                                Direction
                            </label>
                            <div class="slider-container">
                                <input type="range" id="wave${waveNum}Direction" class="slider" 
                                       min="0" max="360" step="1" value="${this.state.waves[i].direction}">
                                <span class="slider-value">${this.state.waves[i].direction}°</span>
                            </div>
                        </div>
                    `;
                    
                    // Insert after tabs header
                    const tabsHeader = document.querySelector('.tabs-header');
                    tabsHeader.parentNode.insertBefore(tabContent, tabsHeader.nextSibling);
                }
                
                // Bind wave control events
                this.bindWaveControls(i);
            }
        }
        
        bindWaveControls(waveIndex) {
            const waveNum = waveIndex + 1;
            
            // Enable toggle
            const enableToggle = document.getElementById(`wave${waveNum}Enable`);
            if (enableToggle) {
                enableToggle.addEventListener('change', (e) => {
                    this.state.updateWave(waveIndex, 'enabled', e.target.checked);
                });
            }
            
            // Frequency slider
            const freqSlider = document.getElementById(`wave${waveNum}Frequency`);
            if (freqSlider) {
                freqSlider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this.state.updateWave(waveIndex, 'frequency', value);
                    e.target.nextElementSibling.textContent = `${value.toFixed(1)} Hz`;
                    this.updateStats();
                });
            }
            
            // Amplitude slider
            const ampSlider = document.getElementById(`wave${waveNum}Amplitude`);
            if (ampSlider) {
                ampSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    this.state.updateWave(waveIndex, 'amplitude', value);
                    e.target.nextElementSibling.textContent = value;
                    this.updateStats();
                });
            }
            
            // Phase slider
            const phaseSlider = document.getElementById(`wave${waveNum}Phase`);
            if (phaseSlider) {
                phaseSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    this.state.updateWave(waveIndex, 'phase', value);
                    e.target.nextElementSibling.textContent = `${value}°`;
                    this.updateStats();
                });
            }
            
            // Direction slider
            const dirSlider = document.getElementById(`wave${waveNum}Direction`);
            if (dirSlider) {
                dirSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    this.state.updateWave(waveIndex, 'direction', value);
                    e.target.nextElementSibling.textContent = `${value}°`;
                });
            }
        }
        
        bindEvents() {
            // Header controls
            this.elements.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
            this.elements.btnScreenshot.addEventListener('click', () => this.renderer.screenshot());
            this.elements.btnInfo.addEventListener('click', () => this.showModal());
            
            // Panel collapse
            this.elements.btnCollapsePanel.addEventListener('click', () => {
                this.elements.controlPanel.classList.toggle('collapsed');
                const icon = this.elements.btnCollapsePanel.querySelector('i');
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-left');
            });
            
            // Global controls
            this.elements.globalSpeed.addEventListener('input', (e) => {
                this.state.globalSpeed = parseFloat(e.target.value);
                this.elements.globalSpeedValue.textContent = `${this.state.globalSpeed.toFixed(1)}x`;
            });
            
            this.elements.colorIntensity.addEventListener('input', (e) => {
                this.state.colorIntensity = parseInt(e.target.value);
                this.elements.colorIntensityValue.textContent = `${this.state.colorIntensity}%`;
            });
            
            // Color mode buttons
            this.elements.colorModeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.elements.colorModeButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.colorMode = btn.dataset.mode;
                });
            });
            
            // Wave tabs
            this.elements.tabButtons.forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    this.switchWaveTab(index + 1);
                });
            });
            
            // Preset buttons
            this.elements.presetButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const preset = btn.dataset.preset;
                    if (preset === 'random') {
                        this.state.randomize();
                    } else {
                        this.state.applyPreset(preset);
                    }
                    this.updateAllControls();
                });
            });
            
            // Action buttons
            this.elements.btnPlay.addEventListener('click', () => {
                this.state.isPlaying = !this.state.isPlaying;
                const icon = this.elements.btnPlay.querySelector('i');
                icon.classList.toggle('fa-play');
                icon.classList.toggle('fa-pause');
            });
            
            this.elements.btnReset.addEventListener('click', () => {
                this.state.reset();
                this.updateAllControls();
            });
            
            this.elements.btnExport.addEventListener('click', () => {
                this.exportSettings();
            });
            
            // Modal
            this.elements.btnCloseModal.addEventListener('click', () => this.hideModal());
            this.elements.infoModal.addEventListener('click', (e) => {
                if (e.target === this.elements.infoModal) {
                    this.hideModal();
                }
            });
        }
        
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case ' ':
                        e.preventDefault();
                        this.elements.btnPlay.click();
                        break;
                    case 'r':
                    case 'R':
                        if (!e.ctrlKey) {
                            e.preventDefault();
                            this.elements.btnReset.click();
                        }
                        break;
                    case 's':
                    case 'S':
                        if (!e.ctrlKey) {
                            e.preventDefault();
                            this.renderer.screenshot();
                        }
                        break;
                    case 'f':
                    case 'F':
                        e.preventDefault();
                        this.toggleFullscreen();
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                        e.preventDefault();
                        this.switchWaveTab(parseInt(e.key));
                        break;
                }
            });
        }
        
        switchWaveTab(tabNum) {
            this.state.activeWaveTab = tabNum;
            
            this.elements.tabButtons.forEach((btn, index) => {
                btn.classList.toggle('active', index + 1 === tabNum);
            });
            
            this.elements.tabContents.forEach((content, index) => {
                content.classList.toggle('active', index + 1 === tabNum);
            });
            
            this.updateStats();
        }
        
        updateStats() {
            const activeWave = this.state.waves[this.state.activeWaveTab - 1];
            if (activeWave) {
                this.elements.statFrequency.textContent = `${activeWave.frequency.toFixed(2)} Hz`;
                this.elements.statAmplitude.textContent = activeWave.amplitude.toFixed(2);
                this.elements.statPhase.textContent = `${activeWave.phase}°`;
            }
        }
        
        updateAllControls() {
            // Update global controls
            this.elements.globalSpeed.value = this.state.globalSpeed;
            this.elements.globalSpeedValue.textContent = `${this.state.globalSpeed.toFixed(1)}x`;
            
            this.elements.colorIntensity.value = this.state.colorIntensity;
            this.elements.colorIntensityValue.textContent = `${this.state.colorIntensity}%`;
            
            // Update color mode
            this.elements.colorModeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === this.state.colorMode);
            });
            
            // Update wave controls
            this.state.waves.forEach((wave, index) => {
                const waveNum = index + 1;
                
                const enableToggle = document.getElementById(`wave${waveNum}Enable`);
                if (enableToggle) enableToggle.checked = wave.enabled;
                
                const freqSlider = document.getElementById(`wave${waveNum}Frequency`);
                if (freqSlider) {
                    freqSlider.value = wave.frequency;
                    freqSlider.nextElementSibling.textContent = `${wave.frequency.toFixed(1)} Hz`;
                }
                
                const ampSlider = document.getElementById(`wave${waveNum}Amplitude`);
                if (ampSlider) {
                    ampSlider.value = wave.amplitude;
                    ampSlider.nextElementSibling.textContent = wave.amplitude;
                }
                
                const phaseSlider = document.getElementById(`wave${waveNum}Phase`);
                if (phaseSlider) {
                    phaseSlider.value = wave.phase;
                    phaseSlider.nextElementSibling.textContent = `${wave.phase}°`;
                }
                
                const dirSlider = document.getElementById(`wave${waveNum}Direction`);
                if (dirSlider) {
                    dirSlider.value = wave.direction;
                    dirSlider.nextElementSibling.textContent = `${wave.direction}°`;
                }
            });
            
            this.updateStats();
        }
        
        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                this.elements.btnFullscreen.querySelector('i').classList.replace('fa-expand', 'fa-compress');
            } else {
                document.exitFullscreen();
                this.elements.btnFullscreen.querySelector('i').classList.replace('fa-compress', 'fa-expand');
            }
        }
        
        showModal() {
            this.elements.infoModal.classList.add('active');
        }
        
        hideModal() {
            this.elements.infoModal.classList.remove('active');
        }
        
        exportSettings() {
            const settings = {
                waves: this.state.waves,
                globalSpeed: this.state.globalSpeed,
                colorIntensity: this.state.colorIntensity,
                colorMode: this.state.colorMode
            };
            
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `wave-settings-${Date.now()}.json`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    }

    // ========== Application ========== //
    class WaveInterferenceApp {
        constructor() {
            this.state = new WaveState();
            this.renderer = null;
            this.ui = null;
            this.animationId = null;
            
            this.init();
        }
        
        init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }
        
        setup() {
            const canvas = document.getElementById('waveCanvas');
            if (!canvas) {
                console.error('Canvas element not found');
                return;
            }
            
            this.renderer = new WaveRenderer(canvas, this.state);
            this.ui = new UIController(this.state, this.renderer);
            
            this.startAnimation();
        }
        
        startAnimation() {
            const animate = () => {
                this.renderer.render();
                this.animationId = requestAnimationFrame(animate);
            };
            animate();
        }
        
        stopAnimation() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }

    // Initialize application
    const app = new WaveInterferenceApp();
    
    // Expose to global scope for debugging
    window.waveApp = app;

})();
