/**
 * isolaTOR Video Processor
 * Gerçek zamanlı kamera arka planı bulanıklaştırma, sanal görsel giydirme ve renkli arka plan motoru.
 */

(function () {
  window.__IsolatorVideoProcessor = class IsolatorVideoProcessor {
    constructor(rawVideoTrack, config = {}) {
      this.rawTrack = rawVideoTrack;
      this.config = {
        videoEnabled: true,
        videoMode: 'blur', // 'original', 'blur', 'virtual', 'color'
        blurLevel: 15,
        selectedBackground: 'classroom',
        customBackgroundImage: null,
        solidColor: '#107c41',
        smoothEdges: true,
        ...config
      };

      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.srcObject = new MediaStream([this.rawTrack]);

      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

      this.bgCanvas = document.createElement('canvas');
      this.bgCtx = this.bgCanvas.getContext('2d');

      this.maskCanvas = document.createElement('canvas');
      this.maskCtx = this.maskCanvas.getContext('2d');

      this.bgImages = {};
      this.loadPresetBackgrounds();

      this.isRunning = false;
      this.processedStream = null;
      this.processedTrack = null;

      // Auto-Framing (Center Stage) State
      this.currentZoom = 1.0;
      this.targetZoom = 1.0;
      this.currentPanX = 0;
      this.currentPanY = 0;
      this.targetPanX = 0;
      this.targetPanY = 0;

      // Reactions & Particles
      this.particles = [];
    }

    spawnReaction(emoji) {
      const count = 7;
      const w = this.canvas.width || 640;
      const h = this.canvas.height || 360;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          emoji: emoji || '🎉',
          x: w * 0.5 + (Math.random() - 0.5) * (w * 0.4),
          y: h * 0.85 + Math.random() * 20,
          speed: 2 + Math.random() * 3,
          size: 22 + Math.random() * 14,
          wobble: Math.random() * Math.PI * 2,
          life: 1.0
        });
      }
    }

      // SVG/Data URI Görsel Kütüphanesi (Fotogerçekçi Stüdyolar & Vektör Ortamlar)
      const svgPresets = {
        // v2.6 Fotogerçekçi HD Stüdyo Ortamları
        'modern-office': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="wallO" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%231e2638"/><stop offset="100%" stop-color="%230f1420"/></linearGradient><linearGradient id="glassO" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.12"/><stop offset="100%" stop-color="%23818cf8" stop-opacity="0.05"/></linearGradient><linearGradient id="deskO" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%23475569"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23wallO)"/><rect x="60" y="40" width="1160" height="520" rx="16" fill="url(%23glassO)" stroke="%23334155" stroke-width="3"/><circle cx="300" cy="200" r="140" fill="%2338bdf8" opacity="0.06" filter="blur(20px)"/><circle cx="900" cy="220" r="180" fill="%23818cf8" opacity="0.07" filter="blur(30px)"/><line x1="450" y1="40" x2="450" y2="560" stroke="%23334155" stroke-width="4"/><line x1="830" y1="40" x2="830" y2="560" stroke="%23334155" stroke-width="4"/><rect x="80" y="320" width="1120" height="2" fill="%23475569" opacity="0.4"/><rect x="0" y="560" width="1280" height="160" fill="url(%23deskO)"/><line x1="0" y1="560" x2="1280" y2="560" stroke="%2364748b" stroke-width="4"/><circle cx="1120" cy="120" r="30" fill="%23f8fafc" opacity="0.04"/></svg>`,
        'minimalist-loft': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="brickL" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%23261c18"/><stop offset="100%" stop-color="%23140e0c"/></linearGradient><linearGradient id="warmLightL" x1="0" y1="0" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fbbf24" stop-opacity="0.18"/><stop offset="100%" stop-color="%23d97706" stop-opacity="0"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23brickL)"/><polygon points="0,0 600,0 900,720 0,720" fill="url(%23warmLightL)"/><rect x="80" y="60" width="280" height="380" rx="8" fill="%231c1917" stroke="%2344403c" stroke-width="6"/><rect x="100" y="80" width="240" height="340" rx="4" fill="%23292524"/><rect x="920" y="100" width="260" height="320" rx="10" fill="%231c1917" stroke="%2344403c" stroke-width="4"/><circle cx="1050" cy="260" r="80" fill="%23f59e0b" opacity="0.08" filter="blur(25px)"/><rect x="0" y="580" width="1280" height="140" fill="%2317120e"/></svg>`,
        'bookshelf-library': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="libBg" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%231a1412"/><stop offset="100%" stop-color="%230d0908"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23libBg)"/><g fill="%23261a15" stroke="%233d2b22" stroke-width="4"><rect x="40" y="30" width="380" height="660" rx="8"/><line x1="40" y1="160" x2="420" y2="160"/><line x1="40" y1="300" x2="420" y2="300"/><line x1="40" y1="440" x2="420" y2="440"/><line x1="40" y1="580" x2="420" y2="580"/></g><g fill="%23261a15" stroke="%233d2b22" stroke-width="4"><rect x="860" y="30" width="380" height="660" rx="8"/><line x1="860" y1="160" x2="1240" y2="160"/><line x1="860" y1="300" x2="1240" y2="300"/><line x1="860" y1="440" x2="1240" y2="440"/><line x1="860" y1="580" x2="1240" y2="580"/></g><rect x="60" y="60" width="32" height="96" fill="%23991b1b" rx="2"/><rect x="96" y="70" width="28" height="86" fill="%231e40af" rx="2"/><rect x="128" y="50" width="36" height="106" fill="%23166534" rx="2"/><rect x="168" y="65" width="24" height="91" fill="%23854d0e" rx="2"/><rect x="880" y="60" width="30" height="96" fill="%2386198f" rx="2"/><rect x="914" y="55" width="36" height="101" fill="%230e7490" rx="2"/><rect x="954" y="70" width="26" height="86" fill="%23b45309" rx="2"/></svg>`,
        'modern-cafe': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="cafeBg" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%23181210"/><stop offset="100%" stop-color="%230a0706"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23cafeBg)"/><circle cx="200" cy="180" r="70" fill="%23f59e0b" opacity="0.14" filter="blur(20px)"/><circle cx="450" cy="140" r="50" fill="%23fbbf24" opacity="0.12" filter="blur(16px)"/><circle cx="820" cy="160" r="90" fill="%23f97316" opacity="0.1" filter="blur(24px)"/><circle cx="1100" cy="190" r="60" fill="%23fbbf24" opacity="0.15" filter="blur(18px)"/><rect x="120" y="240" width="1040" height="10" rx="4" fill="%23291d18"/><rect x="0" y="560" width="1280" height="160" fill="%231e1612"/><line x1="0" y1="560" x2="1280" y2="560" stroke="%23443228" stroke-width="4"/></svg>`,
        'scandinavian-room': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="scanBg" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="plantG" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23047857"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23scanBg)"/><rect x="140" y="60" width="400" height="420" rx="12" fill="%23334155" opacity="0.5"/><line x1="340" y1="60" x2="340" y2="480" stroke="%231e293b" stroke-width="6"/><line x1="140" y1="270" x2="540" y2="270" stroke="%231e293b" stroke-width="6"/><circle cx="1080" cy="380" r="45" fill="%2392400e"/><path d="M 1040 380 Q 1080 200 1120 380 Z" fill="url(%23plantG)"/><path d="M 1010 380 Q 1050 240 1080 380 Z" fill="url(%23plantG)"/><path d="M 1080 380 Q 1120 230 1150 380 Z" fill="url(%23plantG)"/><rect x="0" y="580" width="1280" height="140" fill="%231e293b"/></svg>`,

        // Klasik Vektör Ortamları
        classroom: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="wall" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%232a3b4c"/><stop offset="100%" stop-color="%231b2631"/></linearGradient><linearGradient id="floor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%237a583a"/><stop offset="100%" stop-color="%234a3523"/></linearGradient><linearGradient id="board" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23144d32"/><stop offset="100%" stop-color="%230c2e1e"/></linearGradient></defs><rect width="1280" height="520" fill="url(%23wall)"/><rect y="520" width="1280" height="200" fill="url(%23floor)"/><rect x="80" y="80" width="220" height="340" rx="8" fill="%235dade2" opacity="0.25"/><line x1="190" y1="80" x2="190" y2="420" stroke="%231b2631" stroke-width="8"/><line x1="80" y1="250" x2="300" y2="250" stroke="%231b2631" stroke-width="8"/><rect x="360" y="70" width="560" height="360" rx="12" fill="%238d6e63" stroke="%235d4037" stroke-width="14"/><rect x="375" y="85" width="530" height="330" rx="6" fill="url(%23board)"/><text x="410" y="140" font-family="sans-serif" font-size="28" fill="%23e8f8f5" opacity="0.85" font-weight="bold">isolaTOR Sınıf</text><rect x="980" y="120" width="240" height="20" rx="4" fill="%23a0522d"/><rect x="990" y="60" width="22" height="60" fill="%23e74c3c" rx="2"/></svg>`,
        office: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="60%" stop-color="%231e293b"/><stop offset="100%" stop-color="%23334155"/></linearGradient><linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.15"/><stop offset="100%" stop-color="%230284c7" stop-opacity="0.05"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23skyGrad)"/><rect x="180" y="320" width="90" height="400" fill="%23090d16" opacity="0.8"/><rect x="300" y="240" width="120" height="480" fill="%230d1527" opacity="0.9"/><rect x="460" y="290" width="100" height="430" fill="%23090d16" opacity="0.7"/><rect x="680" y="220" width="140" height="500" fill="%230d1527" opacity="0.9"/><rect x="850" y="310" width="110" height="410" fill="%23090d16" opacity="0.8"/><rect x="100" y="60" width="1080" height="540" fill="url(%23glassGrad)" stroke="%23475569" stroke-width="8" rx="10"/><line x1="460" y1="60" x2="460" y2="600" stroke="%23475569" stroke-width="8"/><line x1="820" y1="60" x2="820" y2="600" stroke="%23475569" stroke-width="8"/><line x1="100" y1="360" x2="1180" y2="360" stroke="%23475569" stroke-width="8"/></svg>`,
        studio: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23181824"/><stop offset="100%" stop-color="%230a0a10"/></linearGradient><linearGradient id="light" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23818cf8" stop-opacity="0.3"/><stop offset="100%" stop-color="%23818cf8" stop-opacity="0"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23bg)"/><rect x="100" y="80" width="300" height="450" rx="8" fill="%231e1e2f" stroke="%232d2d44" stroke-width="2"/><rect x="440" y="80" width="400" height="450" rx="8" fill="%231a1a2b" stroke="%232d2d44" stroke-width="2"/><rect x="880" y="80" width="300" height="450" rx="8" fill="%231e1e2f" stroke="%232d2d44" stroke-width="2"/><line x1="100" y1="80" x2="400" y2="80" stroke="%23818cf8" stroke-width="4"/><line x1="440" y1="80" x2="840" y2="80" stroke="%2322d3ee" stroke-width="4"/><line x1="880" y1="80" x2="1180" y2="80" stroke="%23818cf8" stroke-width="4"/><polygon points="250,80 150,530 350,530" fill="url(%23light)"/><polygon points="1030,80 930,530 1130,530" fill="url(%23light)"/><rect x="0" y="530" width="1280" height="190" fill="%230d0d14"/></svg>`,
        nature: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="60%" stop-color="%231e293b"/><stop offset="100%" stop-color="%23334155"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23sky)"/><polygon points="-50,550 300,280 650,550" fill="%231e293b"/><polygon points="400,550 780,240 1150,550" fill="%231e293b"/><polygon points="100,600 480,360 850,600" fill="%230f172a"/><polygon points="650,600 980,340 1320,600" fill="%230f172a"/><rect x="0" y="560" width="1280" height="160" fill="%23090d16"/><line x1="0" y1="560" x2="1280" y2="560" stroke="%2338bdf8" stroke-width="2" stroke-opacity="0.4"/></svg>`,
        library: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="libWall" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%231c1917"/><stop offset="100%" stop-color="%230c0a09"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23libWall)"/><g fill="%23292524" stroke="%2344403c" stroke-width="4"><rect x="60" y="40" width="340" height="640" rx="6"/><line x1="60" y1="180" x2="400" y2="180"/><line x1="60" y1="320" x2="400" y2="320"/><line x1="60" y1="460" x2="400" y2="460"/></g><g fill="%23292524" stroke="%2344403c" stroke-width="4"><rect x="880" y="40" width="340" height="640" rx="6"/><line x1="880" y1="180" x2="1220" y2="180"/><line x1="880" y1="320" x2="1220" y2="320"/><line x1="880" y1="460" x2="1220" y2="460"/></g><rect x="80" y="70" width="24" height="106" fill="%23dc2626"/><rect x="106" y="80" width="28" height="96" fill="%232563eb"/><rect x="136" y="60" width="20" height="116" fill="%2316a34a"/></svg>`
      };

      Object.keys(svgPresets).forEach(key => {
        const img = new Image();
        img.src = svgPresets[key];
        img.onerror = () => console.warn(`[isolaTOR Video] Arka plan yüklenemedi: ${key}`);
        this.bgImages[key] = img;
      });
    }

    async init() {
      return new Promise((resolve) => {
        let isResolved = false;

        // MediaPipe SelfieSegmentation AI Model Entegrasyonu
        this.initMediaPipe();

        const startProcessing = () => {
          if (isResolved) return;
          isResolved = true;

          const settings = this.rawTrack.getSettings ? this.rawTrack.getSettings() : {};
          const width = this.video.videoWidth || settings.width || 640;
          const height = this.video.videoHeight || settings.height || 480;

          this.canvas.width = width;
          this.canvas.height = height;
          this.bgCanvas.width = width;
          this.bgCanvas.height = height;
          this.maskCanvas.width = width;
          this.maskCanvas.height = height;

          this.isRunning = true;
          this.startProcessingLoop();

          this.processedStream = this.canvas.captureStream(30);
          this.processedTrack = this.processedStream.getVideoTracks()[0];

          if (this.processedTrack && this.rawTrack) {
            Object.defineProperty(this.processedTrack, 'label', {
              value: `isolaTOR [Virtual AI] - ${this.rawTrack.label}`,
              writable: false
            });
          }

          resolve(this.processedTrack || this.rawTrack);
        };

        this.video.onloadedmetadata = () => {
          this.video.play().catch(() => {});
          startProcessing();
        };

        this.video.onloadeddata = () => {
          this.video.play().catch(() => {});
          startProcessing();
        };

        this.video.play().then(startProcessing).catch(() => {});

        // 300ms garanti emniyet kilidi (asla asılı kalmaz)
        setTimeout(() => {
          startProcessing();
        }, 300);
      });
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }

    startProcessingLoop() {
      const processFrame = () => {
        if (!this.isRunning) return;

        try {
          this.renderFrame();
        } catch (err) {
          console.error('[isolaTOR Video] Frame render error:', err);
        }

        if ('requestVideoFrameCallback' in this.video) {
          this.video.requestVideoFrameCallback(processFrame);
        } else {
          requestAnimationFrame(processFrame);
        }
      };

      if ('requestVideoFrameCallback' in this.video) {
        this.video.requestVideoFrameCallback(processFrame);
      } else {
        requestAnimationFrame(processFrame);
      }
    }

    initMediaPipe() {
      try {
        if (typeof SelfieSegmentation !== 'undefined') {
          // Chrome Trusted Types Desteği (Güvenlik Politikası Uyumu)
          let trustedPolicy = null;
          if (window.trustedTypes && window.trustedTypes.createPolicy) {
            try {
              trustedPolicy = window.trustedTypes.createPolicy('isolatorPolicy', {
                createScriptURL: (url) => url
              });
            } catch (e) {
              // Politika daha önceden oluşturulmuşsa mevcut olanı kullan
              trustedPolicy = window.trustedTypes.defaultPolicy;
            }
          }

          // Yerel eklenti dosyalarından yükle (CDN'den çok daha hızlı ve güvenilir)
          const mediapipeBase = window.__ISOLATOR_MEDIAPIPE_BASE__;
          const cdnBase = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/';

          this.selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => {
              // Önce yerel dosyaları dene, yoksa CDN'e düş
              const url = mediapipeBase ? `${mediapipeBase}${file}` : `${cdnBase}${file}`;
              return trustedPolicy ? trustedPolicy.createScriptURL(url) : url;
            }
          });

          this.selfieSegmentation.setOptions({
            modelSelection: 1, // 1: Landscape (Daha yüksek kalite ve kesin saç/vücut ayrıştırma)
            selfieMode: false
          });

          this.selfieSegmentation.onResults((results) => {
            this.latestSegmentationMask = results.segmentationMask;
          });

          this.isMediaPipeReady = true;
          console.log('[isolaTOR Video] Google MediaPipe AI Modeli Başlatıldı (' + (mediapipeBase ? 'Yerel' : 'CDN') + ')');
        } else {
          console.warn('[isolaTOR Video] SelfieSegmentation global tanımsız — hibrit fallback aktif');
        }
      } catch (err) {
        console.warn('[isolaTOR Video] MediaPipe yüklenemedi, hibrit fallback aktif:', err);
      }
    }

    renderFrame() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const { videoEnabled, videoMode, blurLevel, selectedBackground, customBackgroundImage, solidColor } = this.config;

      // Video hazır değilse bekle
      if (this.video.readyState < 2) {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, w, h);
        return;
      }

      if (!videoEnabled || videoMode === 'original') {
        this.ctx.filter = 'none';
        this.ctx.drawImage(this.video, 0, 0, w, h);
        this.ctx.restore();
        return;
      }

      // MediaPipe AI karesi gönder (Asenkron arka plan analizi)
      if (this.selfieSegmentation && !this.isSendingFrame && this.video.videoWidth > 0) {
        this.isSendingFrame = true;
        this.selfieSegmentation.send({ image: this.video })
          .catch(() => {})
          .finally(() => { this.isSendingFrame = false; });
      }

      // 1. Arka plan katmanını hazırla (bgCanvas)
      this.bgCtx.clearRect(0, 0, w, h);
      this.bgCtx.filter = 'none';

      if (videoMode === 'blur') {
        this.bgCtx.filter = `blur(${blurLevel || 15}px)`;
        this.bgCtx.drawImage(this.video, -10, -10, w + 20, h + 20);
        this.bgCtx.filter = 'none';
      } else if (videoMode === 'virtual') {
        let bgImg = null;
        if (selectedBackground === 'custom' && customBackgroundImage) {
          if (!this.customImgElem || this.customImgElem.src !== customBackgroundImage) {
            this.customImgElem = new Image();
            this.customImgElem.src = customBackgroundImage;
          }
          bgImg = this.customImgElem;
        } else {
          bgImg = this.bgImages[selectedBackground];
        }

        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
          this.bgCtx.drawImage(bgImg, 0, 0, w, h);

          const tone = this.config.backgroundTone;
          if (tone && tone !== 'none') {
            if (tone === 'warm') this.bgCtx.fillStyle = 'rgba(255, 140, 0, 0.14)';
            else if (tone === 'cool') this.bgCtx.fillStyle = 'rgba(0, 150, 255, 0.14)';
            else if (tone === 'cyber') this.bgCtx.fillStyle = 'rgba(168, 85, 247, 0.18)';
            this.bgCtx.fillRect(0, 0, w, h);
          }
        } else {
          // Arka plan henüz yüklenmemişse bulanık video fallback
          this.bgCtx.filter = 'blur(16px)';
          this.bgCtx.drawImage(this.video, -4, -4, w + 8, h + 8);
          this.bgCtx.filter = 'none';
        }
      } else if (videoMode === 'color') {
        this.bgCtx.fillStyle = solidColor || '#107c41';
        this.bgCtx.fillRect(0, 0, w, h);
      }

      // 2. Doğal Stüdyo Kompozisyonu (MediaPipe AI veya Anatomik Maskeleme)
      this.ctx.save();
      this.ctx.clearRect(0, 0, w, h);

      if (this.config.autoFraming) {
        this.targetZoom = 1.15;
        this.currentZoom += (this.targetZoom - this.currentZoom) * 0.05;
        this.currentPanX += (this.targetPanX - this.currentPanX) * 0.05;
        this.currentPanY += (this.targetPanY - this.currentPanY) * 0.05;

        this.ctx.translate(w / 2, h / 2);
        this.ctx.scale(this.currentZoom, this.currentZoom);
        this.ctx.translate(-w / 2 + this.currentPanX, -h / 2 + this.currentPanY);
      } else {
        this.currentZoom = 1.0;
        this.currentPanX = 0;
        this.currentPanY = 0;
      }

      // Arka planı çiz
      this.ctx.drawImage(this.bgCanvas, 0, 0, w, h);

      // Kişiyi (AI Maskesi ile) Arka Planın Üstüne Yerleştir
      this.maskCtx.clearRect(0, 0, w, h);
      this.maskCtx.filter = 'none';
      this.maskCtx.globalCompositeOperation = 'source-over';

      const featherBlur = Math.max(1, this.config.edgeFeathering !== undefined ? this.config.edgeFeathering : (this.config.smoothEdges ? 4 : 2));

      if (this.latestSegmentationMask) {
        // MediaPipe AI Maskesi — En yüksek kalite + Dinamik Kenar Yumuşatma
        this.maskCtx.filter = `blur(${featherBlur}px)`;
        this.maskCtx.drawImage(this.latestSegmentationMask, 0, 0, w, h);
        this.maskCtx.filter = 'none';
      } else if (videoMode !== 'original') {
        // Piksel tabanlı gelişmiş segmentasyon (MediaPipe yoksa)
        this.generateSegmentationMask(w, h);
      }

      // Maske üzerine video'yu composite et (maskelenen alanları koru)
      this.maskCtx.globalCompositeOperation = 'source-in';
      this.maskCtx.drawImage(this.video, 0, 0, w, h);

      // Presenter Mode (Kamera İçi Sunucu Düzenleri)
      if (this.config.presenterModeEnabled && this.screenVideo && this.screenVideo.readyState >= 2) {
        const layout = this.config.presenterLayout || 'pip-bottom-right';

        if (layout === 'background-slide') {
          // 1. Ekran paylaşımı arka plan olur, kullanıcı slaytın önünde konuşur
          this.ctx.drawImage(this.screenVideo, 0, 0, w, h);
          this.ctx.drawImage(this.maskCanvas, 0, 0, w, h);
        } else if (layout === 'side-by-side') {
          // 2. Yan yana düzen (Sol: Sunum, Sağ: Konuşmacı)
          const halfW = w / 2;
          this.ctx.drawImage(this.screenVideo, 0, 0, halfW, h);
          this.ctx.drawImage(this.maskCanvas, halfW, 0, halfW, h);
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(0, 0, halfW, h);
        } else {
          // 3. PiP Köşe Düzeni (Standart Köşe Pencere)
          this.ctx.drawImage(this.maskCanvas, 0, 0, w, h);
          const pScale = this.config.presenterScale || 0.35;
          const sw = w * pScale, sh = sw * (9 / 16);
          const sx = w - sw - 20, sy = h - sh - 20;

          this.ctx.save();
          this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
          this.ctx.lineWidth = 2.5;
          this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
          this.ctx.shadowBlur = 12;
          if (this.ctx.roundRect) this.ctx.roundRect(sx, sy, sw, sh, 8);
          else this.ctx.rect(sx, sy, sw, sh);
          this.ctx.stroke();
          this.ctx.drawImage(this.screenVideo, sx, sy, sw, sh);
          this.ctx.restore();
        }
      } else {
        // Standart Katman: Arka plan + Maskeli kişi
        this.ctx.drawImage(this.maskCanvas, 0, 0, w, h);
      }

      // Işık Eşleme (Lighting Match) — Arka plan atmosferine uyum
      if (this.config.lightingMatch && videoMode === 'virtual') {
        const tone = this.config.backgroundTone;
        if (tone && tone !== 'none') {
          this.ctx.save();
          this.ctx.globalCompositeOperation = 'overlay';
          if (tone === 'warm') this.ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
          else if (tone === 'cool') this.ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
          else if (tone === 'cyber') this.ctx.fillStyle = 'rgba(192, 132, 252, 0.1)';
          this.ctx.fillRect(0, 0, w, h);
          this.ctx.restore();
        }
      }

      // 2.5 Beauty Filter / Skin Softening
      if (this.config.beautyFilterEnabled && (this.config.beautyLevel || 40) > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = (this.config.beautyLevel || 40) / 200;
        this.ctx.filter = 'blur(4px) contrast(105%) brightness(103%)';
        this.ctx.drawImage(this.maskCanvas, 0, 0, w, h);
        this.ctx.restore();
      }

      // 4. Virtual Studio Ring Light (Aydınlatma Halkası & Yüz Işığı)
      if (this.config.ringLightEnabled && (this.config.ringLightIntensity || 30) > 0) {
        const intensity = (this.config.ringLightIntensity || 30) / 100;
        const gradient = this.ctx.createRadialGradient(w / 2, h * 0.45, w * 0.15, w / 2, h * 0.45, w * 0.85);
        const tone = this.config.ringLightTone;
        const color = tone === 'warm' ? '255, 220, 180' : (tone === 'cold' ? '200, 230, 255' : '255, 255, 255');
        gradient.addColorStop(0, `rgba(${color}, ${intensity * 0.26})`);
        gradient.addColorStop(0.7, `rgba(${color}, ${intensity * 0.1})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.restore();
      }

      // 5. Lower Thirds (Özel İsim & Unvan Bandı)
      if (this.config.lowerThirdsEnabled && this.config.badgeName) {
        const name = this.config.badgeName;
        const title = this.config.badgeTitle || '';
        const bx = 24, by = h - 68;
        const bw = Math.max(180, name.length * 10 + 50);
        const bh = title ? 46 : 32;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(6, 8, 16, 0.88)';
        this.ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        if (this.ctx.roundRect) this.ctx.roundRect(bx, by, bw, bh, 8);
        else this.ctx.rect(bx, by, bw, bh);
        this.ctx.fill();
        this.ctx.stroke();

        // Accent Green Dot
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(bx + 14, by + (title ? 16 : 16), 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Name
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.fillText(name, bx + 26, by + 20);

        // Title
        if (title) {
          this.ctx.fillStyle = '#94a3b8';
          this.ctx.font = '10px sans-serif';
          this.ctx.fillText(title, bx + 26, by + 36);
        }
        this.ctx.restore();
      }

      // 6. Virtual Laser Pointer (Sanal Lazer İşaretçi)
      if (this.config.laserPointerEnabled && this.laserPos) {
        const lx = this.laserPos.x * w;
        const ly = this.laserPos.y * h;

        this.ctx.save();
        const laserGrad = this.ctx.createRadialGradient(lx, ly, 1, lx, ly, 16);
        laserGrad.addColorStop(0, '#ff0055');
        laserGrad.addColorStop(0.3, 'rgba(255, 0, 85, 0.8)');
        laserGrad.addColorStop(1, 'rgba(255, 0, 85, 0)');
        this.ctx.fillStyle = laserGrad;
        this.ctx.beginPath();
        this.ctx.arc(lx, ly, 16, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      // 7. Screen-in-Camera Overlay PiP
      if (this.config.screenPiPEnabled && this.screenVideo && this.screenVideo.readyState >= 2) {
        const sw = w * 0.35, sh = sw * (9 / 16);
        const sx = w - sw - 16, sy = 16;
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(sx, sy, sw, sh);
        this.ctx.drawImage(this.screenVideo, sx, sy, sw, sh);
        this.ctx.restore();
      }

      // 8. Gaze Focus Guide Lines
      if (this.config.gazeGuideEnabled) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
        this.ctx.setLineDash([4, 4]);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, h * 0.38);
        this.ctx.lineTo(w, h * 0.38);
        this.ctx.moveTo(w / 2, 0);
        this.ctx.lineTo(w / 2, h);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(w / 2, h * 0.38, 12, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
      }

      // 8.5 Presentation Countdown Overlay Badge
      if (this.config.countdownActive && this.config.countdownRemainingText) {
        const text = this.config.countdownRemainingText;
        const bx = w - 85, by = 16, bw = 70, bh = 24;
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(9, 10, 15, 0.9)';
        this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        if (this.ctx.roundRect) this.ctx.roundRect(bx, by, bw, bh, 4);
        else this.ctx.rect(bx, by, bw, bh);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#f8fafc';
        this.ctx.font = '600 11px monospace';
        this.ctx.fillText(text, bx + 12, by + 16);
        this.ctx.restore();
      }

      // 9. Floating Reactions & Emoji Particle System
      if (this.particles && this.particles.length > 0) {
        this.ctx.save();
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.y -= p.speed;
          p.x += Math.sin(p.wobble) * 0.8;
          p.wobble += 0.05;
          p.life -= 0.015;

          if (p.life <= 0 || p.y < -30) {
            this.particles.splice(i, 1);
            continue;
          }

          this.ctx.globalAlpha = Math.max(0, p.life);
          this.ctx.font = `${p.size}px sans-serif`;
          this.ctx.fillText(p.emoji, p.x, p.y);
        }
        this.ctx.restore();
      }

      this.ctx.restore();
    }

    generateSegmentationMask(width, height) {
      // 1. Yüksek çözünürlüklü analiz tuvali
      const scale = 0.5; // %50 çözünürlük ile yüksek piksel hassasiyeti
      const sw = Math.max(160, Math.floor(width * scale));
      const sh = Math.max(120, Math.floor(height * scale));

      if (!this.smallCanvas || this.smallCanvas.width !== sw || this.smallCanvas.height !== sh) {
        this.smallCanvas = document.createElement('canvas');
        this.smallCanvas.width = sw;
        this.smallCanvas.height = sh;
        this.smallCtx = this.smallCanvas.getContext('2d', { willReadFrequently: true });
        this.bgModel = null;
        this.prevMask = null;
      }

      this.smallCtx.drawImage(this.video, 0, 0, sw, sh);
      const imgData = this.smallCtx.getImageData(0, 0, sw, sh);
      const data = imgData.data;
      const len = data.length;
      const numPixels = len / 4;

      if (!this.bgModel || this.bgModel.length !== len) {
        this.bgModel = new Float32Array(len);
        for (let i = 0; i < len; i++) this.bgModel[i] = data[i];
      }

      if (!this.prevMask || this.prevMask.length !== numPixels) {
        this.prevMask = new Float32Array(numPixels);
      }

      const maskImgData = this.smallCtx.createImageData(sw, sh);
      const maskData = maskImgData.data;

      const centerX = sw * 0.5;
      const centerY = sh * 0.42;

      // 2. Piksel ve Gradyan Tabanlı Kesin İnsan Ayrıştırma Motoru
      for (let i = 0; i < len; i += 4) {
        const pixIdx = i / 4;
        const px = pixIdx % sw;
        const py = Math.floor(pixIdx / sw);

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Uzaklık & Biyometrik Konumlandırma
        const normX = (px - centerX) / (sw * 0.36);
        const normY = (py - centerY) / (sh * 0.46);
        const dist = Math.sqrt(normX * normX + normY * normY);

        // Ten Rengi Analizi (YUV / YCbCr & RGB)
        const isSkinRGB = (r > 65 && g > 38 && b > 20 && r > g && r > b && (r - g) > 12);
        const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        const isSkinYCbCr = (Cb >= 85 && Cb <= 135 && Cr >= 135 && Cr <= 180);
        const hasSkinTone = isSkinRGB || isSkinYCbCr;

        // Arka Plan Dinamik Ayrışma (Motion & Variance)
        const bgR = this.bgModel[i];
        const bgG = this.bgModel[i + 1];
        const bgB = this.bgModel[i + 2];
        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

        // Bölge Analizleri (Kafa, Omuz, Gövde)
        const isHead = (dist < 0.55 && py < sh * 0.55);
        const isShoulderTorso = (py >= sh * 0.35 && Math.abs(px - centerX) < sw * (0.35 + (py / sh) * 0.22));

        let confidence = 0;
        if (isHead) {
          confidence = hasSkinTone ? 1.0 : (dist < 0.4 ? 0.98 : 0.85);
        } else if (isShoulderTorso) {
          const torsoDist = Math.abs(px - centerX) / (sw * (0.35 + (py / sh) * 0.22));
          confidence = Math.max(0.1, 1.0 - torsoDist * 0.9);
          if (hasSkinTone) confidence = 1.0;
          else if (diff > 25) confidence = Math.min(1.0, confidence + 0.4);
        } else {
          // Arka plan dış çember
          confidence = (hasSkinTone && dist < 1.0) ? 0.3 : 0.0;
          if (dist > 1.2) confidence = 0.0;
        }

        // Arka plan modelini güncelle (Sadece kesin arka planda)
        if (confidence < 0.15) {
          this.bgModel[i] += (r - bgR) * 0.08;
          this.bgModel[i + 1] += (g - bgG) * 0.08;
          this.bgModel[i + 2] += (b - bgB) * 0.08;
        }

        // Zamansal Yumuşatma (Temporal Smoothing)
        const prev = this.prevMask[pixIdx];
        const smoothVal = prev * 0.6 + confidence * 0.4;
        this.prevMask[pixIdx] = smoothVal;

        // Sigmoid eğrisi ile keskin insan / şeffaf arka plan eşiği
        let alphaScore = 0;
        if (smoothVal > 0.45) {
          alphaScore = Math.min(1.0, (smoothVal - 0.45) / 0.3);
        }

        const alpha = Math.floor(alphaScore * 255);

        maskData[i] = 255;
        maskData[i + 1] = 255;
        maskData[i + 2] = 255;
        maskData[i + 3] = alpha;
      }

      this.smallCtx.putImageData(maskImgData, 0, 0);

      // 3. Kenar Yumuşatma & Nihai Maske Oluşturma
      this.maskCtx.clearRect(0, 0, width, height);
      this.maskCtx.globalCompositeOperation = 'source-over';
      this.maskCtx.imageSmoothingEnabled = true;
      this.maskCtx.imageSmoothingQuality = 'high';
      this.maskCtx.filter = this.config.smoothEdges ? 'blur(6px)' : 'blur(2px)';
      this.maskCtx.drawImage(this.smallCanvas, 0, 0, width, height);
      this.maskCtx.filter = 'none';
    }

    setScreenStream(stream) {
      if (stream) {
        if (!this.screenVideo) {
          this.screenVideo = document.createElement('video');
          this.screenVideo.autoplay = true;
          this.screenVideo.muted = true;
          this.screenVideo.playsInline = true;
        }
        this.screenVideo.srcObject = stream;
        this.screenVideo.play().catch(() => {});
      } else if (this.screenVideo) {
        this.screenVideo.pause();
        this.screenVideo.srcObject = null;
        this.screenVideo = null;
      }
    }

    destroy() {
      this.isRunning = false;
      if (this.video) {
        this.video.pause();
        this.video.srcObject = null;
      }
      if (this.processedTrack) {
        this.processedTrack.stop();
      }
    }
  };
})();
