/**
 * isolaTOR Configuration & Storage Manager
 */

export const DEFAULT_CONFIG = {
  // Video & Studio Işık / Filtre Ayarları
  videoEnabled: true,
  videoMode: 'blur', // 'original' | 'blur' | 'virtual' | 'color'
  blurLevel: 15,     // 5, 15, 30
  selectedBackground: 'modern-office', // 'modern-office' | 'minimalist-loft' | 'bookshelf-library' | 'modern-cafe' | 'scandinavian-room' | 'classroom' | 'library' | 'office' | 'studio' | 'nature' | 'custom'
  customBackgroundImage: null,
  backgroundTone: 'none', // 'none' | 'warm' | 'cool' | 'cyber'
  solidColor: '#107c41',
  smoothEdges: true,
  edgeFeathering: 4, // 0-10px kenar yumuşatma
  lightingMatch: true, // Yüz ve arka plan ışık uyumu
  autoFraming: false,

  // Presenter Mode (Kamera İçi Sunucu / Ekran Paylaşımı)
  presenterModeEnabled: false,
  presenterLayout: 'pip-bottom-right', // 'pip-bottom-right' | 'side-by-side' | 'background-slide'
  presenterScale: 0.35,

  ringLightEnabled: false,
  ringLightIntensity: 30,
  ringLightTone: 'neutral', // 'neutral' | 'warm' | 'cold'
  lowerThirdsEnabled: false,
  badgeName: '',
  badgeTitle: '',
  laserPointerEnabled: false,

  beautyFilterEnabled: false,
  beautyLevel: 40,
  gazeGuideEnabled: false,
  teleprompterEnabled: false,
  teleprompterText: 'Toplantı notlarınızı buraya ekleyin... isolaTOR Teleprompter ile kameradan gözünüzü ayırmadan akıcı konuşun.',
  teleprompterFontSize: 16,
  teleprompterSpeed: 2, // 1 - 5
  teleprompterAutoScroll: false,

  voiceShieldEnabled: false,
  countdownActive: false,
  countdownDurationMin: 5,
  countdownRemainingSeconds: 0,
  countdownRemainingText: '',

  // Ses & Vokal Karakter Ayarları
  audioEnabled: true,
  teacherMode: true,
  noiseSuppression: true,
  deEsser: true,
  echoCancellation: true,
  autoGainControl: true,
  noiseGateThreshold: -48,
  voiceBoost: true,
  voiceCharacter: 'natural', // 'natural' | 'radio' | 'crisp' | 'privacy'
  bassBoost: 0,
  trebleBoost: 0,
  micGain: 1.0,
  pushToTalk: false,
  isMuted: false,

  // Özel Soundboard Slotları
  customSounds: {
    slot1: { name: 'Alkış', dataUrl: null },
    slot2: { name: 'Gong', dataUrl: null },
    slot3: { name: 'Özel', dataUrl: null }
  },

  // Arayüz Ayarları
  floatingWidgetEnabled: false,
  smartAlertsEnabled: true,
  widgetPosition: { top: 20, right: 20 },
  customProfiles: {}
};

export class StorageService {
  static async getConfig() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['isolatorConfig'], (result) => {
          if (result && result.isolatorConfig) {
            resolve({ ...DEFAULT_CONFIG, ...result.isolatorConfig });
          } else {
            resolve(DEFAULT_CONFIG);
          }
        });
      } else {
        const local = localStorage.getItem('isolatorConfig');
        resolve(local ? { ...DEFAULT_CONFIG, ...JSON.parse(local) } : DEFAULT_CONFIG);
      }
    });
  }

  static async setConfig(partialConfig) {
    const current = await this.getConfig();
    const updated = { ...current, ...partialConfig };

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ isolatorConfig: updated }, () => {
          resolve(updated);
        });
      } else {
        localStorage.setItem('isolatorConfig', JSON.stringify(updated));
        resolve(updated);
      }
    });
  }
}
