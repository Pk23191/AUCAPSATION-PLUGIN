# AutoCap Pro - Installation Guide

## 📁 Folder Structure

Your AutoCap Pro extension should have the following structure:

```
AutoCapPro/
├── CSXS/
│   └── manifest.xml          # CEP manifest file (required)
├── css/
│   └── styles.css            # Extension styles
├── js/
│   ├── CSInterface.js        # Adobe CEP library
│   └── main.js               # Frontend JavaScript
├── host/
│   └── host.jsx              # After Effects ExtendScript
├── icons/                    # (Optional) Extension icons
│   ├── icon.png
│   ├── icon_hover.png
│   ├── icon_dark.png
│   └── icon_dark_hover.png
├── index.html                # Main HTML file
├── .debug                    # Debug configuration (development only)
└── README.md                 # This file
```

---

## 🚀 Installation Methods

### Method 1: Manual Installation (Recommended for Testing)

#### Windows:

1. **Copy the Extension Folder**
   - Copy the entire `AutoCapPro` folder to:
   ```
   C:\Users\[YourUsername]\AppData\Roaming\Adobe\CEP\extensions\
   ```
   
2. **Enable Unsigned Extensions** (Required for development)
   - Open Registry Editor (regedit)
   - Navigate to:
     - **After Effects 2020+:** `HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.10`
     - **Older versions:** Check `CSXS.9`, `CSXS.8`, etc.
   - Create a new String Value named `PlayerDebugMode`
   - Set its value to `1`

3. **Restart After Effects**

#### macOS:

1. **Copy the Extension Folder**
   - Copy the entire `AutoCapPro` folder to:
   ```
   ~/Library/Application Support/Adobe/CEP/extensions/
   ```
   
2. **Enable Unsigned Extensions** (Required for development)
   - Open Terminal and run:
   ```bash
   defaults write com.adobe.CSXS.10 PlayerDebugMode 1
   ```
   - For older versions, replace `CSXS.10` with `CSXS.9`, `CSXS.8`, etc.

3. **Restart After Effects**

---

### Method 2: Using ZXPInstaller (Easiest)

1. **Download ZXPInstaller**
   - Visit: https://zxpinstaller.com/
   - Download for your OS (Windows/macOS)

2. **Create a ZXP Package**
   - Download and install the ZXPSignCmd tool from Adobe
   - Open terminal/command prompt in the AutoCapPro folder
   - Run:
   ```bash
   ZXPSignCmd sign -certFile myCert.p12 AutoCapPro AutoCapPro.zxp
   ```
   - Or use the self-sign option for testing

3. **Install via ZXPInstaller**
   - Open ZXPInstaller
   - Drag and drop the `.zxp` file
   - Click Install

4. **Restart After Effects**

---

### Method 3: Using Extension Builder (Adobe Official)

1. Download Adobe Extension Builder from Adobe Exchange
2. Import the AutoCapPro project
3. Build and package the extension
4. Install directly from Extension Builder

---

## ✅ Verification

After installation, verify the plugin is working:

1. Open After Effects
2. Go to **Window > Extensions > AutoCap Pro**
3. The panel should open with the modern dark UI
4. You should see all the settings and options

---

## 🔧 Usage Instructions

### First-Time Setup:

1. **Get Your OpenAI API Key**
   - Visit: https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Enter API Key in AutoCap Pro**
   - Open the AutoCap Pro panel
   - Paste your API key in the input field
   - The key is saved locally for future use

3. **Configure Settings** (Optional)
   - Click the gear icon ⚙️ for advanced settings
   - Choose your preferred font, colors, and animation speed
   - Save your preferences

### Generating Captions:

1. **Open or Create a Composition**
   - Make sure your comp has an audio or video layer with audio

2. **Select Audio Layer** (Optional)
   - Click on the audio/video layer you want to transcribe
   - If not selected, AutoCap Pro will find the first audio layer

3. **Configure Caption Options**
   - Choose language (Auto-Detect works great for Hinglish!)
   - Select caption style (Trending Pop-up, Karaoke, MrBeast, etc.)
   - Adjust font size and other advanced options

4. **Click "Generate Auto-Captions"**
   - Wait for the AI to process the audio
   - Caption layers will be created automatically
   - All layers are organized under "=== AutoCaps ===" null

---

## 🎨 Caption Styles Explained

| Style | Description | Best For |
|-------|-------------|----------|
| **Trending Pop-up** | Bouncy scale-in animation with subtle bounce | TikTok, Reels, Shorts |
| **Karaoke Word-Highlight** | Words light up as they're spoken | Music videos, Sing-alongs |
| **Dynamic Box Background** | Auto-sizing background behind text | Professional content |
| **MrBeast Style** | Bold, impactful with rotation | High-energy content |
| **Minimal Clean** | Simple fade-in, elegant | Corporate, Documentary |
| **Bold Impact** | Quick scale from bottom | Emphasis moments |

---

## 🐛 Troubleshooting

### Panel Doesn't Appear

- **Check:** Window > Extensions > AutoCap Pro
- **Solution:** Restart After Effects, check if PlayerDebugMode is enabled

### "No Audio Layer Found" Error

- **Solution:** Ensure your composition has an audio or video layer with audio enabled
- **Tip:** Select the layer before clicking Generate

### API Key Error

- **Check:** Your API key starts with `sk-`
- **Check:** You have credits in your OpenAI account
- **Solution:** Try regenerating your API key

### Transcription is Inaccurate

- **Solution:** Select the correct language instead of Auto-Detect
- **For Hinglish:** Use "Hindi" or "English" depending on dominant language
- **Tip:** Clear audio produces better results

### Captions Not Appearing

- **Check:** Timeline zoom - captions might be outside current view
- **Check:** Layer visibility (eye icon)
- **Solution:** Press `U` on selected layers to reveal keyframes

---

## 📝 Notes

- **Audio Length:** Whisper API supports files up to 25 MB (~10-15 minutes of audio)
- **API Costs:** Whisper charges $0.006 per minute of audio
- **Privacy:** Your API key is stored locally, never sent to third parties
- **Performance:** Longer audio takes more time to process

---

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages (Window > Console in the CEP panel)
2. Verify your After Effects version (CC 2015 or later required)
3. Ensure you have an active internet connection for API calls
4. Check your OpenAI API quota and billing

---

## 📄 License

This extension is provided as-is for educational and commercial use.
Make sure to comply with OpenAI's Terms of Service when using their API.

---

**Enjoy creating amazing captions with AutoCap Pro! 🎬✨**
