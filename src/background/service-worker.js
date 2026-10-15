/**
 * isolaTOR Background Service Worker (Manifest V3)
 */

const DEFAULT_CONFIG = {
  videoEnabled: true,
  videoMode: 'blur',
  blurLevel: 15,
  selectedBackground: 'classroom',
  customBackgroundImage: null,
  backgroundTone: 'none',
  solidColor: '#107c41',
  smoothEdges: true,
  autoFraming: false,
  ringLightEnabled: false,
  ringLightIntensity: 30,
  ringLightTone: 'neutral',
  lowerThirdsEnabled: false,
  badgeName: '',
  badgeTitle: '',
  laserPointerEnabled: false,

  audioEnabled: true,
  teacherMode: true,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  noiseGateThreshold: -48,
  voiceBoost: true,
  voiceCharacter: 'natural',
  deEsser: true,
  bassBoost: 0,
  trebleBoost: 0,
  micGain: 1.0,
  pushToTalk: false,
  isMuted: false,

  floatingWidgetEnabled: false,
  smartAlertsEnabled: true,
  widgetPosition: { top: 20, right: 20 }
};

// Kurulumda varsayılan ayarları kaydet ve Side Panel davranışını ayarla
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[isolaTOR Background] Uzantı yüklendi:', details.reason);

  // Eklenti simgesine tıklandığında doğrudan Side Panel açılmasını sağla
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.warn);
  }

  const existing = await chrome.storage.local.get(['isolatorConfig']);
  if (!existing || !existing.isolatorConfig) {
    await chrome.storage.local.set({ isolatorConfig: DEFAULT_CONFIG });
    console.log('[isolaTOR Background] Varsayılan ayarlar kaydedildi.');
  }
});

// Global Klavye Kısayolları (Keyboard Commands)
chrome.commands.onCommand.addListener(async (command) => {
  const data = await chrome.storage.local.get(['isolatorConfig']);
  const config = { ...DEFAULT_CONFIG, ...(data.isolatorConfig || {}) };

  if (command === 'toggle-studio') {
    config.teacherMode = !config.teacherMode;
    config.noiseSuppression = config.teacherMode;
  } else if (command === 'toggle-blur') {
    config.videoMode = config.videoMode === 'blur' ? 'original' : 'blur';
  } else if (command === 'toggle-widget') {
    config.floatingWidgetEnabled = !config.floatingWidgetEnabled;
  }

  await chrome.storage.local.set({ isolatorConfig: config });
});

// Sekme durumlarını dinle
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Sekme hazır olduğunda gerekirse ping gönderilebilir
  }
});
