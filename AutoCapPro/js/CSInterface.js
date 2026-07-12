/**
 * CSInterface.js - Adobe CEP Library
 * Simplified version for AutoCap Pro extension
 */

function CSInterface() {
}

/**
 * System path types
 */
var SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};

/**
 * Get system path
 */
CSInterface.prototype.getSystemPath = function(type) {
    return window.__adobe_cep__.getSystemPath(type);
};

/**
 * Evaluate ExtendScript
 */
CSInterface.prototype.evalScript = function(script, callback) {
    if (callback === null || callback === undefined) {
        callback = function() {};
    }
    window.__adobe_cep__.evalScript(script, callback);
};

/**
 * Get persistent storage
 */
CSInterface.prototype.getPersistentStorage = function(key) {
    try {
        var data = window.cep.preferences.getData(key);
        if (data && data !== "") {
            return JSON.parse(data);
        }
    } catch (e) {}
    return null;
};

/**
 * Set persistent storage
 */
CSInterface.prototype.setPersistentStorage = function(key, value) {
    try {
        window.cep.preferences.setData(key, JSON.stringify(value));
    } catch (e) {}
};

/**
 * Get host environment
 */
CSInterface.prototype.getHostEnvironment = function() {
    return window.__adobe_cep__.getHostEnvironment();
};

/**
 * Close extension
 */
CSInterface.prototype.closeExtension = function() {
    window.__adobe_cep__.closeExtension();
};

/**
 * Get scale factor
 */
CSInterface.prototype.getScaleFactor = function() {
    return window.__adobe_cep__.getScaleFactor();
};

/**
 * Show message
 */
CSInterface.prototype.showAlert = function(message) {
    alert(message);
};

/**
 * Open URL in default browser
 */
CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    cep.util.openURLInDefaultBrowser(url);
};

/**
 * Get extension ID
 */
CSInterface.prototype.getExtensionID = function() {
    return window.__adobe_cep__.getExtensionId();
};

/**
 * Register keyboard event listener
 */
CSInterface.prototype.registerKeyEventsInterest = function(keyEventsInterest) {
    return window.__adobe_cep__.registerKeyEventsInterest(keyEventsInterest);
};

/**
 * Set panel flyout menu
 */
CSInterface.prototype.setPanelFlyoutMenu = function(menu) {
    window.__adobe_cep__.invokeSync("setPanelFlyoutMenu", menu);
};

/**
 * Update panel menu item
 */
CSInterface.prototype.updatePanelMenuItem = function(itemLabel, enabled, checked) {
    window.__adobe_cep__.invokeSync("updatePanelMenuItem", itemLabel, enabled, checked);
};
