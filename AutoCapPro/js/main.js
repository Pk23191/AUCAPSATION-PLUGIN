/**
 * AutoCap Pro - Main JavaScript File
 * Handles UI interactions, API calls, and communication with After Effects
 */

// ============================================
// Global Variables & Initialization
// ============================================

let csInterface = null;
let systemPath = null;

// Initialize the CEP interface when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    csInterface = new CSInterface();
    systemPath = csInterface.getSystemPath(SystemPath.USER_DATA);
    
    // Load saved settings
    loadSettings();
    loadApiKey();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update font size display
    updateFontSizeDisplay();
    
    console.log('AutoCap Pro initialized successfully');
});

// ============================================
// Event Listeners Setup
// ============================================

function setupEventListeners() {
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // API Key toggle
    document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);
    
    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateCaptions);
    
    // Clear cache button
    document.getElementById('clearCache').addEventListener('click', clearApiKey);
    
    // Font size slider
    document.getElementById('fontSize').addEventListener('input', updateFontSizeDisplay);
    
    // Style preview update
    document.getElementById('captionStyle').addEventListener('change', updateStylePreview);
    
    // Close modal when clicking outside
    document.getElementById('settingsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeSettings();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSettings();
        }
    });
}

// ============================================
// Settings Management
// ============================================

function loadSettings() {
    try {
        const settings = csInterface.getPersistentStorage('autocapro_settings');
        
        if (settings && settings.defaultFont) {
            document.getElementById('defaultFont').value = settings.defaultFont;
        }
        if (settings && settings.primaryColor) {
            document.getElementById('primaryColor').value = settings.primaryColor;
            document.documentElement.style.setProperty('--accent-primary', settings.primaryColor);
        }
        if (settings && settings.secondaryColor) {
            document.getElementById('secondaryColor').value = settings.secondaryColor;
        }
        if (settings && settings.backgroundColor) {
            document.getElementById('backgroundColor').value = settings.backgroundColor;
        }
        if (settings && settings.animationSpeed) {
            document.getElementById('animationSpeed').value = settings.animationSpeed;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function saveSettings() {
    try {
        const settings = {
            defaultFont: document.getElementById('defaultFont').value,
            primaryColor: document.getElementById('primaryColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            backgroundColor: document.getElementById('backgroundColor').value,
            animationSpeed: document.getElementById('animationSpeed').value
        };
        
        csInterface.setPersistentStorage('autocapro_settings', settings);
        
        // Apply primary color immediately
        document.documentElement.style.setProperty('--accent-primary', settings.primaryColor);
        
        showStatus('Settings saved successfully!', 'success');
        closeSettings();
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Error saving settings', 'error');
    }
}

// ============================================
// API Key Management
// ============================================

function loadApiKey() {
    try {
        const savedKey = csInterface.getPersistentStorage('autocapro_apikey');
        if (savedKey && savedKey.apiKey) {
            document.getElementById('apiKey').value = savedKey.apiKey;
        }
    } catch (error) {
        console.error('Error loading API key:', error);
    }
}

function saveApiKey(apiKey) {
    try {
        csInterface.setPersistentStorage('autocapro_apikey', { apiKey: apiKey });
    } catch (error) {
        console.error('Error saving API key:', error);
    }
}

function clearApiKey() {
    try {
        csInterface.setPersistentStorage('autocapro_apikey', { apiKey: '' });
        document.getElementById('apiKey').value = '';
        showStatus('API key cleared', 'info');
    } catch (error) {
        console.error('Error clearing API key:', error);
    }
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKey');
    const icon = document.querySelector('#toggleApiKey i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ============================================
// UI Helper Functions
// ============================================

function updateFontSizeDisplay() {
    const value = document.getElementById('fontSize').value;
    document.getElementById('fontSizeValue').textContent = value + 'px';
}

function updateStylePreview() {
    const style = document.getElementById('captionStyle').value;
    const preview = document.getElementById('stylePreview');
    
    const previews = {
        'trending-popup': '<span class="preview-text" style="animation: popIn 0.3s ease;">Trending Pop-up</span>',
        'karaoke': '<span class="preview-text" style="color: var(--success);">Karaoke <span style="color: var(--accent-primary);">Highlight</span></span>',
        'dynamic-box': '<span class="preview-text" style="background: rgba(233,69,96,0.3); padding: 5px 10px; border-radius: 4px;">Dynamic Box</span>',
        'mrbeast': '<span class="preview-text" style="font-size: 24px; text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;">MRBEAST</span>',
        'minimal': '<span class="preview-text" style="font-weight: 300; letter-spacing: 2px;">Minimal Clean</span>',
        'bold': '<span class="preview-text" style="font-weight: 900; text-transform: uppercase;">Bold Impact</span>'
    };
    
    preview.innerHTML = previews[style] || previews['trending-popup'];
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    const statusText = document.getElementById('statusText');
    
    statusEl.className = 'status-message ' + type;
    statusText.textContent = message;
    statusEl.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 5000);
}

function showProgress(percent, text) {
    const container = document.getElementById('progressContainer');
    const fill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    container.classList.remove('hidden');
    fill.style.width = percent + '%';
    progressText.textContent = text;
}

function hideProgress() {
    document.getElementById('progressContainer').classList.add('hidden');
}

function setButtonLoading(isLoading) {
    const btn = document.getElementById('generateBtn');
    
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('loading');
    } else {
        btn.disabled = false;
        btn.classList.remove('loading');
    }
}

// ============================================
// Modal Functions
// ============================================

function openSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

// ============================================
// Main Caption Generation Logic
// ============================================

async function generateCaptions() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const language = document.getElementById('language').value;
    const captionStyle = document.getElementById('captionStyle').value;
    const fontSize = parseInt(document.getElementById('fontSize').value);
    const maxWordsPerLine = parseInt(document.getElementById('maxWordsPerLine').value);
    const captionPosition = document.getElementById('captionPosition').value;
    const addBackground = document.getElementById('addBackground').checked;
    const addShadow = document.getElementById('addShadow').checked;
    
    // Validation
    if (!apiKey) {
        showStatus('Please enter your OpenAI API key', 'error');
        return;
    }
    
    if (!apiKey.startsWith('sk-')) {
        showStatus('Invalid API key format. Should start with "sk-"', 'error');
        return;
    }
    
    // Save API key for future use
    saveApiKey(apiKey);
    
    try {
        setButtonLoading(true);
        showProgress(10, 'Connecting to After Effects...');
        
        // Prepare parameters for ExtendScript
        const params = {
            apiKey: apiKey,
            language: language,
            captionStyle: captionStyle,
            fontSize: fontSize,
            maxWordsPerLine: maxWordsPerLine,
            captionPosition: captionPosition,
            addBackground: addBackground,
            addShadow: addShadow,
            settings: {
                defaultFont: document.getElementById('defaultFont').value,
                primaryColor: document.getElementById('primaryColor').value,
                secondaryColor: document.getElementById('secondaryColor').value,
                backgroundColor: document.getElementById('backgroundColor').value,
                animationSpeed: document.getElementById('animationSpeed').value
            }
        };
        
        showProgress(20, 'Extracting audio from composition...');
        
        // Call ExtendScript to handle the entire process
        // This will extract audio, call Whisper API, and create captions
        const result = await callExtendScript('processCaptions', JSON.stringify(params));
        
        if (result.success) {
            showProgress(100, 'Complete!');
            showStatus(`Successfully created ${result.captionCount} caption layers!`, 'success');
            setTimeout(() => hideProgress(), 2000);
        } else {
            throw new Error(result.error || 'Unknown error occurred');
        }
        
    } catch (error) {
        console.error('Error generating captions:', error);
        showStatus('Error: ' + error.message, 'error');
        hideProgress();
    } finally {
        setButtonLoading(false);
    }
}

// ============================================
// ExtendScript Communication
// ============================================

function callExtendScript(functionName, params) {
    return new Promise((resolve, reject) => {
        const script = `
            (function() {
                try {
                    var params = ${params};
                    var result = ${functionName}(params);
                    JSON.stringify(result);
                } catch (error) {
                    JSON.stringify({ success: false, error: error.toString() });
                }
            })();
        `;
        
        csInterface.evalScript(script, function(response) {
            try {
                const result = JSON.parse(response);
                resolve(result);
            } catch (error) {
                reject(new Error('Failed to parse response from After Effects'));
            }
        });
    });
}

// ============================================
// API Call Helper (Node.js Backend)
// ============================================

async function callWhisperAPI(audioData, apiKey, language) {
    // This function would be called from Node.js backend
    // For CEP, we'll handle this in ExtendScript with HTTP requests
    
    const endpoint = 'https://api.openai.com/v1/audio/transcriptions';
    
    const formData = new FormData();
    formData.append('file', audioData);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    
    if (language !== 'auto') {
        formData.append('language', language);
    }
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }
    
    return await response.json();
}

// ============================================
// Utility Functions
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Add CSS animations for style previews
const style = document.createElement('style');
style.textContent = `
    @keyframes popIn {
        0% {
            opacity: 0;
            transform: scale(0.5);
        }
        70% {
            transform: scale(1.1);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

console.log('AutoCap Pro - Main JS loaded successfully');
