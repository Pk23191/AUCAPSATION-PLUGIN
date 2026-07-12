/**
 * AutoCap Pro - Host ExtendScript for After Effects
 * Handles audio extraction, API calls, and caption layer creation
 * 
 * This script runs within After Effects and communicates with the CEP panel
 */

#target aftereffects

// ============================================
// Global Configuration
// ============================================

var AutoCapPro = {
    version: "1.0.0",
    apiKey: "",
    language: "auto",
    captionStyle: "trending-popup",
    fontSize: 60,
    maxWordsPerLine: 8,
    captionPosition: "bottom",
    addBackground: true,
    addShadow: true,
    settings: {
        defaultFont: "Arial",
        primaryColor: "#FFFF00",
        secondaryColor: "#FFFFFF",
        backgroundColor: "#000000",
        animationSpeed: "normal"
    }
};

// ============================================
// Main Entry Point - Called from CEP Panel
// ============================================

function processCaptions(params) {
    try {
        // Parse incoming parameters
        if (typeof params === "string") {
            params = eval("(" + params + ")");
        }
        
        // Update global config
        AutoCapPro.apiKey = params.apiKey;
        AutoCapPro.language = params.language || "auto";
        AutoCapPro.captionStyle = params.captionStyle || "trending-popup";
        AutoCapPro.fontSize = params.fontSize || 60;
        AutoCapPro.maxWordsPerLine = params.maxWordsPerLine || 8;
        AutoCapPro.captionPosition = params.captionPosition || "bottom";
        AutoCapPro.addBackground = params.addBackground !== false;
        AutoCapPro.addShadow = params.addShadow !== false;
        
        if (params.settings) {
            AutoCapPro.settings = params.settings;
        }
        
        // Validate composition
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return {
                success: false,
                error: "Please select or open a composition first."
            };
        }
        
        // Find audio layer
        var audioLayer = findAudioLayer(comp);
        if (!audioLayer) {
            return {
                success: false,
                error: "No audio layer found in the composition. Please add an audio or video layer with audio."
            };
        }
        
        // Extract audio and get transcription
        var transcriptionData = getTranscription(audioLayer);
        if (!transcriptionData || !transcriptionData.words || transcriptionData.words.length === 0) {
            return {
                success: false,
                error: "Failed to get transcription from audio. Please check your API key and try again."
            };
        }
        
        // Create caption layers
        var captionCount = createCaptionLayers(comp, transcriptionData);
        
        return {
            success: true,
            captionCount: captionCount,
            message: "Successfully created " + captionCount + " caption layers!"
        };
        
    } catch (error) {
        return {
            success: false,
            error: "Error: " + error.toString()
        };
    }
}

// ============================================
// Audio Layer Detection
// ============================================

function findAudioLayer(comp) {
    var layers = comp.layers;
    
    // First, check for selected layers
    for (var i = 1; i <= layers.length; i++) {
        var layer = layers[i];
        if (layer.selected && hasAudio(layer)) {
            return layer;
        }
    }
    
    // If no selection, find first audio layer
    for (var i = 1; i <= layers.length; i++) {
        var layer = layers[i];
        if (hasAudio(layer)) {
            return layer;
        }
    }
    
    return null;
}

function hasAudio(layer) {
    try {
        // Check if layer has audio enabled
        if (layer.hasAudio !== undefined) {
            return layer.hasAudio;
        }
        
        // For AVLayer, check audioEnabled
        if (layer instanceof AVLayer) {
            return layer.audioEnabled;
        }
        
        return false;
    } catch (e) {
        return false;
    }
}

// ============================================
// Audio Extraction & Whisper API Call
// ============================================

function getTranscription(audioLayer) {
    try {
        // Export audio to temporary file
        var tempPath = getTempFolderPath();
        var audioFileName = "autocapro_audio_" + new Date().getTime() + ".wav";
        var audioFilePath = tempPath + "/" + audioFileName;
        
        // Render audio to file using After Effects
        exportAudioToFile(audioLayer, audioFilePath);
        
        // Convert to base64 for API call
        var audioBase64 = fileToBase64(audioFilePath);
        
        // Call Whisper API
        var apiResponse = callWhisperAPI(audioBase64, AutoCapPro.apiKey, AutoCapPro.language);
        
        // Clean up temp file
        try {
            var audioFile = new File(audioFilePath);
            if (audioFile.exists) {
                audioFile.remove();
            }
        } catch (e) {}
        
        // Parse response
        if (apiResponse && apiResponse.words) {
            return {
                text: apiResponse.text,
                words: apiResponse.words,
                language: apiResponse.language || "en"
            };
        }
        
        return null;
        
    } catch (error) {
        $.writeln("AutoCap Pro Error: " + error.toString());
        return null;
    }
}

function getTempFolderPath() {
    var tempFolder;
    
    if ($.os.toLowerCase().indexOf("mac") >= 0) {
        tempFolder = Folder("/tmp/AutoCapPro");
    } else {
        tempFolder = Folder(Folder.myDocuments + "/AutoCapPro/Temp");
    }
    
    if (!tempFolder.exists) {
        tempFolder.create();
    }
    
    return tempFolder.fsName;
}

function exportAudioToFile(audioLayer, filePath) {
    // Note: Direct audio export requires rendering
    // For this implementation, we'll use a workaround
    
    var comp = audioLayer.containingComp;
    
    // Create a temporary composition with just the audio
    var tempComp = app.project.items.addComp(
        "AutoCapPro_Audio_Export",
        comp.width,
        comp.height,
        comp.pixelAspect,
        comp.duration,
        comp.frameRate
    );
    
    // Add audio layer to temp comp
    var newLayer = tempComp.layers.add(audioLayer.source);
    newLayer.inPoint = 0;
    newLayer.outPoint = comp.duration;
    
    // Add to render queue
    var renderItem = app.project.renderQueue.items.add(tempComp);
    renderItem.render = true;
    
    // Set output module for audio-only
    var outputModule = renderItem.outputModule(1);
    outputModule.applyPreset("lossless.aqp");
    
    // Set output file
    var outputFile = new File(filePath);
    outputModule.file = outputFile;
    
    // Render (this is synchronous and will block)
    // In production, you'd want to handle this asynchronously
    try {
        app.project.renderQueue.render();
    } catch (e) {
        $.writeln("Render failed: " + e.toString());
    }
    
    // Clean up temp comp
    tempComp.remove();
}

function fileToBase64(file) {
    var f = new File(file);
    if (!f.exists) {
        throw new Error("File not found: " + file);
    }
    
    f.open("r");
    f.encoding = "BINARY";
    var content = f.read();
    f.close();
    
    // Convert binary string to base64
    return base64Encode(content);
}

function base64Encode(binaryString) {
    // Simple base64 encoding for ExtendScript
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var input = binaryString;
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    
    while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        
        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        
        output = output +
            keyStr.charAt(enc1) +
            keyStr.charAt(enc2) +
            keyStr.charAt(enc3) +
            keyStr.charAt(enc4);
    }
    
    return output;
}

function callWhisperAPI(audioBase64, apiKey, language) {
    // Use Socket object for HTTP request (After Effects CC 2018+)
    var url = "https://api.openai.com/v1/audio/transcriptions";
    
    // Create boundary for multipart form data
    var boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    
    // Build multipart form data
    var formData = "--" + boundary + "\r\n";
    formData += "Content-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"\r\n";
    formData += "Content-Type: audio/wav\r\n\r\n";
    formData += decodeURIComponent(escape(atob(audioBase64)));
    formData += "\r\n--" + boundary + "\r\n";
    formData += "Content-Disposition: form-data; name=\"model\"\r\n\r\n";
    formData += "whisper-1\r\n";
    formData += "--" + boundary + "\r\n";
    formData += "Content-Disposition: form-data; name=\"response_format\"\r\n\r\n";
    formData += "verbose_json\r\n";
    formData += "--" + boundary + "\r\n";
    formData += "Content-Disposition: form-data; name=\"timestamp_granularities[]\"\r\n\r\n";
    formData += "word\r\n";
    
    if (language && language !== "auto") {
        formData += "--" + boundary + "\r\n";
        formData += "Content-Disposition: form-data; name=\"language\"\r\n\r\n";
        formData += language + "\r\n";
    }
    
    formData += "--" + boundary + "--\r\n";
    
    // Create socket connection
    var socket = new Socket();
    socket.timeout = 120; // 2 minute timeout for long audio
    
    // Set up headers
    var headers = "POST /v1/audio/transcriptions HTTP/1.1\r\n";
    headers += "Host: api.openai.com\r\n";
    headers += "Authorization: Bearer " + apiKey + "\r\n";
    headers += "Content-Type: multipart/form-data; boundary=" + boundary + "\r\n";
    headers += "Content-Length: " + formData.length + "\r\n";
    headers += "Connection: close\r\n\r\n";
    
    // Connect and send
    if (socket.connect("api.openai.com:443")) {
        socket.write(headers + formData);
        
        // Read response
        var response = "";
        while (!socket.eof) {
            response += socket.read();
        }
        
        socket.close();
        
        // Parse response
        var jsonStart = response.indexOf("{");
        var jsonEnd = response.lastIndexOf("}");
        
        if (jsonStart >= 0 && jsonEnd >= 0) {
            var jsonStr = response.substring(jsonStart, jsonEnd + 1);
            return eval("(" + jsonStr + ")");
        }
    }
    
    return null;
}

// ============================================
// Caption Layer Creation
// ============================================

function createCaptionLayers(comp, transcriptionData) {
    var words = transcriptionData.words;
    var captionCount = 0;
    
    // Create parent null for organization
    var parentNull = comp.layers.addNull();
    parentNull.name = "=== AutoCaps ===";
    parentNull.nullLayer = true;
    
    // Group words into lines based on timing and max words
    var captionGroups = groupWordsIntoCaptions(words);
    
    // Create text layers for each caption group
    for (var i = 0; i < captionGroups.length; i++) {
        var group = captionGroups[i];
        var textLayer = createTextLayer(comp, group, i);
        
        if (textLayer) {
            textLayer.moveBefore(parentNull);
            captionCount++;
        }
    }
    
    // Organize layers
    parentNull.label = 0; // Blue color
    
    return captionCount;
}

function groupWordsIntoCaptions(words) {
    var groups = [];
    var currentGroup = null;
    var lastEndTime = 0;
    var gapThreshold = 0.5; // seconds - new sentence if gap is larger than this
    
    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var startTime = word.start;
        var endTime = word.end;
        
        // Start new group if:
        // 1. No current group
        // 2. Gap between words is too large (new sentence)
        // 3. Max words per line reached
        if (!currentGroup || 
            (startTime - lastEndTime > gapThreshold) ||
            (currentGroup.words.length >= AutoCapPro.maxWordsPerLine)) {
            
            if (currentGroup) {
                groups.push(currentGroup);
            }
            
            currentGroup = {
                words: [],
                startTime: startTime,
                endTime: endTime,
                text: ""
            };
        }
        
        currentGroup.words.push(word);
        currentGroup.endTime = endTime;
        lastEndTime = endTime;
    }
    
    // Add final group
    if (currentGroup) {
        groups.push(currentGroup);
    }
    
    // Build text strings for each group
    for (var j = 0; j < groups.length; j++) {
        var groupWords = groups[j].words;
        var textParts = [];
        
        for (var k = 0; k < groupWords.length; k++) {
            textParts.push(groupWords[k].word);
        }
        
        groups[j].text = textParts.join(" ");
    }
    
    return groups;
}

function createTextLayer(comp, captionGroup, index) {
    try {
        // Create text layer
        var textLayer = comp.layers.addText(captionGroup.text);
        textLayer.name = "Caption_" + (index + 1);
        
        // Set timing
        textLayer.inPoint = captionGroup.startTime;
        textLayer.outPoint = captionGroup.endTime + 0.1; // Small buffer
        
        // Get text properties
        var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var sourceText = textProp.value;
        
        // Configure text appearance
        sourceText.resetCharStyle();
        sourceText.fontSize = AutoCapPro.fontSize;
        sourceText.font = AutoCapPro.settings.defaultFont;
        sourceText.fillColor = hexToRgb(AutoCapPro.settings.secondaryColor);
        
        if (AutoCapPro.addShadow) {
            sourceText.strokeColor = hexToRgb("#000000");
            sourceText.strokeWidth = 2;
        }
        
        textProp.setValue(sourceText);
        
        // Position text based on setting
        var position = calculatePosition(index, comp);
        textLayer.property("ADBE Transform Group").property("ADBE Position").setValue(position);
        
        // Apply style-specific animations
        applyCaptionStyle(textLayer, captionGroup, index);
        
        // Add background box if enabled
        if (AutoCapPro.addBackground) {
            addBackgroundBox(textLayer, captionGroup);
        }
        
        return textLayer;
        
    } catch (error) {
        $.writeln("Error creating text layer: " + error.toString());
        return null;
    }
}

function calculatePosition(index, comp) {
    var x = comp.width / 2;
    var y;
    
    switch (AutoCapPro.captionPosition) {
        case "top":
            y = comp.height * 0.25;
            break;
        case "center":
            y = comp.height / 2;
            break;
        case "bottom":
        default:
            y = comp.height * 0.85;
            break;
    }
    
    return [x, y];
}

function applyCaptionStyle(textLayer, captionGroup, index) {
    var transformGroup = textLayer.property("ADBE Transform Group");
    var speedMultiplier = 1;
    
    if (AutoCapPro.settings.animationSpeed === "fast") {
        speedMultiplier = 0.5;
    } else if (AutoCapPro.settings.animationSpeed === "slow") {
        speedMultiplier = 1.5;
    }
    
    switch (AutoCapPro.captionStyle) {
        case "trending-popup":
            applyTrendingPopupStyle(textLayer, transformGroup, speedMultiplier);
            break;
        case "karaoke":
            applyKaraokeStyle(textLayer, captionGroup, speedMultiplier);
            break;
        case "dynamic-box":
            applyDynamicBoxStyle(textLayer, transformGroup);
            break;
        case "mrbeast":
            applyMrBeastStyle(textLayer, transformGroup);
            break;
        case "minimal":
            applyMinimalStyle(textLayer, transformGroup);
            break;
        case "bold":
            applyBoldStyle(textLayer, transformGroup);
            break;
    }
}

function applyTrendingPopupStyle(textLayer, transformGroup, speed) {
    // Pop-in scale animation
    var scaleProp = transformGroup.property("ADBE Scale");
    var inPoint = textLayer.inPoint;
    
    // Set keyframes for pop-in effect
    scaleProp.setValueAtTime(inPoint, [0, 0]);
    scaleProp.setValueAtTime(inPoint + (0.1 * speed), [110, 110]);
    scaleProp.setValueAtTime(inPoint + (0.2 * speed), [100, 100]);
    
    // Add subtle bounce expression
    scaleProp.expression = "freq = 3; decay = 5; n = 0; if (numKeys > 0){n = key(1).time;} if (time < n){ value;} else {t = time - n; amplitude = 10; w = Math.PI * freq; decay * t; scale = amplitude * Math.exp(-decay * t) * Math.sin(w * t); value + [scale,scale];}";
}

function applyKaraokeStyle(textLayer, captionGroup, speed) {
    // Word-by-word highlight effect using text animator
    var textProp = textLayer.property("ADBE Text Properties");
    
    // Add fill color animator
    var animator = textProp.addProperty("ADBE Text Animator");
    animator.property("ADBE Text Animator Properties").property("ADBE Text Fill Color").setValue(hexToRgb(AutoCapPro.settings.primaryColor));
    
    // Add range selector
    var rangeSelector = animator.property("ADBE Text Selectors").addProperty("ADBE Text Range Selector");
    rangeSelector.property("ADBE Text Percent Start").expression = "linear(time, " + captionGroup.startTime + ", " + captionGroup.endTime + ", 0, 100)";
    rangeSelector.property("ADBE Text Percent End").setValue(100);
    rangeSelector.property("ADBE Text Offset").expression = "-100";
    
    // Smooth transition
    rangeSelector.property("ADBE Text Smoothness").setValue(50);
}

function applyDynamicBoxStyle(textLayer, transformGroup) {
    // Scale animation with easing
    var scaleProp = transformGroup.property("ADBE Scale");
    var inPoint = textLayer.inPoint;
    
    scaleProp.setValueAtTime(inPoint, [0, 0]);
    scaleProp.setValueAtTime(inPoint + 0.15, [100, 100]);
    
    // Easy ease
    var key = scaleProp.key(1);
    scaleProp.setTemporalEaseAtKey(1, [KeyframeEase(50, 100)], [KeyframeEase(50, 100)]);
}

function applyMrBeastStyle(textLayer, transformGroup) {
    // Bold, impactful entrance
    var scaleProp = transformGroup.property("ADBE Scale");
    var rotationProp = transformGroup.property("ADBE Rotate Z");
    var inPoint = textLayer.inPoint;
    
    // Dramatic scale up
    scaleProp.setValueAtTime(inPoint, [0, 0]);
    scaleProp.setValueAtTime(inPoint + 0.1, [120, 120]);
    scaleProp.setValueAtTime(inPoint + 0.2, [100, 100]);
    
    // Slight rotation for energy
    rotationProp.setValueAtTime(inPoint, -5);
    rotationProp.setValueAtTime(inPoint + 0.1, 5);
    rotationProp.setValueAtTime(inPoint + 0.2, 0);
    
    // Make text bolder
    var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
    var sourceText = textProp.value;
    sourceText.fauxBold = true;
    textProp.setValue(sourceText);
}

function applyMinimalStyle(textLayer, transformGroup) {
    // Simple fade in
    var opacityProp = transformGroup.property("ADBE Opacity");
    var inPoint = textLayer.inPoint;
    
    opacityProp.setValueAtTime(inPoint, 0);
    opacityProp.setValueAtTime(inPoint + 0.3, 100);
}

function applyBoldStyle(textLayer, transformGroup) {
    // Quick scale up from bottom
    var scaleProp = transformGroup.property("ADBE Scale");
    var anchorProp = transformGroup.property("ADBE Anchor Point");
    var inPoint = textLayer.inPoint;
    
    // Set anchor to bottom
    var rect = textLayer.sourceRectAtTime(inPoint, false);
    anchorProp.setValue([rect.left + rect.width / 2, rect.top + rect.height]);
    
    // Scale animation
    scaleProp.setValueAtTime(inPoint, [100, 0]);
    scaleProp.setValueAtTime(inPoint + 0.15, [100, 100]);
    
    // Easy ease out
    scaleProp.setTemporalEaseAtKey(1, [KeyframeEase(30, 70)], [KeyframeEase(50, 50)]);
}

function addBackgroundBox(textLayer, captionGroup) {
    try {
        // Create shape layer for background
        var shapeLayer = textLayer.containingComp.layers.addShape();
        shapeLayer.name = "BG_" + textLayer.name;
        shapeLayer.inPoint = textLayer.inPoint;
        shapeLayer.outPoint = textLayer.outPoint;
        shapeLayer.moveBelow(textLayer);
        
        // Add rectangle to shape
        var shapeGroup = shapeLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var rect = shapeGroup.property("ADBE Vector Shapes").addProperty("ADBE Vector Shape Rect");
        
        // Size based on text
        var textRect = textLayer.sourceRectAtTime(textLayer.inPoint, false);
        rect.property("ADBE Vector Rect Size").setValue([textRect.width + 20, textRect.height + 10]);
        rect.property("ADBE Vector Rect Roundness").setValue(8);
        
        // Add fill
        var fill = shapeGroup.property("ADBE Vector Graphic Fill").addProperty("ADBE Vector Fill");
        fill.property("ADBE Vector Fill Color").setValue(hexToRgb(AutoCapPro.settings.backgroundColor));
        fill.property("ADBE Vector Fill Opacity").setValue(80);
        
        // Parent to text layer position
        shapeLayer.property("ADBE Transform Group").property("ADBE Position").expression = 
            "thisComp.layer('" + textLayer.name + "').transform.position";
        
        // Track text size changes
        rect.property("ADBE Vector Rect Size").expression = 
            "var r = thisComp.layer('" + textLayer.name + "').sourceRectAtTime(time,false); [r.width+20, r.height+10]";
        
    } catch (error) {
        $.writeln("Error adding background: " + error.toString());
    }
}

// ============================================
// Utility Functions
// ============================================

function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse hex values
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    
    return [r, g, b, 1];
}

function rgbToHex(r, g, b) {
    return "#" + 
        Math.round(r * 255).toString(16).padStart(2, '0') +
        Math.round(g * 255).toString(16).padStart(2, '0') +
        Math.round(b * 255).toString(16).padStart(2, '0');
}

// Fallback for atob if not available
if (typeof atob === 'undefined') {
    function atob(str) {
        var base64DecodeChars = [
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
            52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
            -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
            15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
            -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
        ];
        
        var c1, c2, c3, c4;
        var i, len, out;
        
        len = str.length;
        i = 0;
        out = "";
        
        while (i < len) {
            do {
                c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
            } while (i < len && c1 == -1);
            
            if (c1 == -1) break;
            
            do {
                c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
            } while (i < len && c2 == -1);
            
            if (c2 == -1) break;
            
            out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
            
            do {
                c3 = str.charCodeAt(i++) & 0xff;
                if (c3 == 61) return out;
                c3 = base64DecodeChars[c3];
            } while (i < len && c3 == -1);
            
            if (c3 == -1) break;
            
            out += String.fromCharCode(((c2 & 0xf) << 4) | ((c3 & 0x3c) >> 2));
            
            do {
                c4 = str.charCodeAt(i++) & 0xff;
                if (c4 == 61) return out;
                c4 = base64DecodeChars[c4];
            } while (i < len && c4 == -1);
            
            if (c4 == -1) break;
            
            out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
        }
        
        return out;
    }
}

// Log function for debugging
$.writeln("AutoCap Pro v" + AutoCapPro.version + " loaded successfully");
