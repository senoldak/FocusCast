/**
 * isolaTOR Content Script
 * Sayfa enjeksiyonlarını ve floating widget entegrasyonunu yönetir.
 */

(async function () {
  console.log('[isolaTOR] Content Script başlatıldı.');

  // 0. Eklenti base URL'ini sayfa dünyasına enjekte et (MediaPipe yerel dosya yükleme için)
  const baseUrl = chrome.runtime.getURL('src/lib/mediapipe/');
  const configScript = document.createElement('script');
  configScript.textContent = `window.__ISOLATOR_MEDIAPIPE_BASE__ = ${JSON.stringify(baseUrl)};`;
  (document.head || document.documentElement).appendChild(configScript);
  configScript.remove();

  // 1. Injected Scriptleri Sırayla Sayfa Dünyasına (Main World) Enjekte Et
  function injectScript(filePath) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(filePath);
      script.onload = function () {
        this.remove();
        resolve();
      };
      (document.head || document.documentElement).appendChild(script);
    });
  }

  // İşleyicileri ve Interceptor'ı yükle
  try {
    await injectScript('src/lib/mediapipe/selfie_segmentation.js');
    await injectScript('src/injected/video-processor.js');
    await injectScript('src/injected/audio-processor.js');
    await injectScript('src/injected/interceptor.js');
  } catch (err) {
    console.error('[isolaTOR] Script injection error:', err);
  }

  // 2. Ayarları Yükle ve Injected Scriptlere İlet
  let currentConfig = {
    videoEnabled: true,
    videoMode: 'blur',
    blurLevel: 15,
    selectedBackground: 'classroom',
    customBackgroundImage: null,
    backgroundTone: 'none',
    solidColor: '#107c41',
    smoothEdges: true,

    audioEnabled: true,
    teacherMode: true,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    noiseGateThreshold: -48,
    voiceBoost: true,
    micGain: 1.0,

    floatingWidgetEnabled: false,
    smartAlertsEnabled: true,
    widgetPosition: { top: 20, right: 20 }
  };

  let teleprompterInstance = null;
  let floatingWidgetInstance = null;

  function syncComponents() {
    // 1. Floating Console Widget
    if (currentConfig.floatingWidgetEnabled && window.__IsolatorFloatingWidget) {
      if (!floatingWidgetInstance) {
        floatingWidgetInstance = new window.__IsolatorFloatingWidget(currentConfig);
        floatingWidgetInstance.mount();
      } else {
        floatingWidgetInstance.config = { ...floatingWidgetInstance.config, ...currentConfig };
        floatingWidgetInstance.refreshUI();
      }
    } else if (!currentConfig.floatingWidgetEnabled && floatingWidgetInstance) {
      floatingWidgetInstance.unmount();
      floatingWidgetInstance = null;
    }

    // 2. Teleprompter
    if (currentConfig.teleprompterEnabled && window.__IsolatorTeleprompter) {
      if (!teleprompterInstance) {
        teleprompterInstance = new window.__IsolatorTeleprompter(currentConfig);
        teleprompterInstance.mount();
      }
    } else if (!currentConfig.teleprompterEnabled && teleprompterInstance) {
      teleprompterInstance.destroy();
      teleprompterInstance = null;
    }
  }

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['isolatorConfig'], (result) => {
      if (result && result.isolatorConfig) {
        currentConfig = { ...currentConfig, ...result.isolatorConfig };
      }

      // Sayfa içi interceptor'a ayarları gönder
      window.postMessage({
        source: 'ISOLATOR_CONTENT_SCRIPT',
        type: 'UPDATE_CONFIG',
        config: currentConfig
      }, '*');

      syncComponents();
    });

    // Ayar değişikliklerini dinle ve güncelle
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.isolatorConfig) {
        currentConfig = { ...currentConfig, ...changes.isolatorConfig.newValue };
        window.postMessage({
          source: 'ISOLATOR_CONTENT_SCRIPT',
          type: 'UPDATE_CONFIG',
          config: currentConfig
        }, '*');

        syncComponents();
      }
    });

    // Popup'tan gelen doğrudan mesajları interceptor'a köprüle (Soundboard, Reactions, Screen Share)
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg && (msg.type === 'SPAWN_REACTION' || msg.type === 'TRIGGER_SOUNDBOARD' || msg.type === 'START_SCREEN_SHARE' || msg.type === 'STOP_SCREEN_SHARE')) {
          window.postMessage({
            source: 'ISOLATOR_CONTENT_SCRIPT',
            ...msg
          }, '*');
        }
      });
    }

    // 3. Push-to-Talk (Space Tuşu Dinleyicisi)
    let isSpaceHeld = false;
    window.addEventListener('keydown', (e) => {
      if (currentConfig.pushToTalk && e.code === 'Space' && !isSpaceHeld) {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
        if (!isInput) {
          isSpaceHeld = true;
          window.postMessage({
            source: 'ISOLATOR_CONTENT_SCRIPT',
            type: 'UPDATE_CONFIG',
            config: { isMuted: false }
          }, '*');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (currentConfig.pushToTalk && e.code === 'Space' && isSpaceHeld) {
        isSpaceHeld = false;
        window.postMessage({
          source: 'ISOLATOR_CONTENT_SCRIPT',
          type: 'UPDATE_CONFIG',
          config: { isMuted: true }
        }, '*');
      }
    });

    // 4. Sanal Lazer İşaretçi Pozisyon İletişimi
    window.addEventListener('mousemove', (e) => {
      if (currentConfig.laserPointerEnabled) {
        window.postMessage({
          source: 'ISOLATOR_CONTENT_SCRIPT',
          type: 'UPDATE_CONFIG',
          laserPos: {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
          }
        }, '*');
      }
    });
  }
})();
