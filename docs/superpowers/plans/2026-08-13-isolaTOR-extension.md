# isolaTOR Chrome Eklentisi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Online ders ve toplantı platformlarında kamerayı (arka plan bulanıklaştırma, sanal görsel değiştirme) ve mikrofonu (AI gürültü engelleme, yankı önleme, ses kapısı) gerçek zamanlı izole eden tam teşekküllü Manifest V3 Chrome eklentisi geliştirmek.

**Architecture:** Sayfa düzeyinde `navigator.mediaDevices.getUserMedia` arayüzünü kancalayarak donanım akışlarını yakalayan, WebGL/Canvas segmentasyon hattı ve Web Audio API RNNoise AudioWorklet filtresi üzerinden işleyip sanal WebRTC akışı sunan istemci taraflı şeffaf proxy mimarisi.

**Tech Stack:** JavaScript (ES6+), Manifest V3, WebRTC (`MediaStream`, `getUserMedia`), HTML5 Canvas & WebGL, Web Audio API (`AudioWorklet`, BiquadFilter, DynamicsCompressor, RNNoise), CSS3 Glassmorphism / Modern Dark Theme.

## Global Constraints
- Manifest V3 standartlarına tam uyum.
- Harici sunucuya ses/görüntü iletimi YOK (tamamen istemci tarafında offline gizlilik).
- Sıfır gecikmeli (low-latency) gerçek zamanlı işleme.
- Google Meet, Zoom Web, Teams Web ve standart tüm WebRTC platformlarında evrensel çalışma.

---

### Task 1: Proje Temeli, Manifest V3 ve Varlıklar (Assets & Icons)

**Files:**
- Create: `manifest.json`
- Create: `package.json`
- Create: `src/utils/storage.js`
- Create: `src/assets/backgrounds/classroom.svg`
- Create: `src/assets/backgrounds/library.svg`
- Create: `src/assets/backgrounds/office.svg`
- Create: `icons/icon16.png`
- Create: `icons/icon32.png`
- Create: `icons/icon48.png`
- Create: `icons/icon128.png`

**Interfaces:**
- Produces: `DEFAULT_CONFIG` ve `storage` okuma/yazma API (`src/utils/storage.js`)

- [ ] **Step 1: package.json ve manifest.json oluşturma**
- [ ] **Step 2: Varsayılan ayarlar yöneticisi (storage.js) modülünü oluşturma**
- [ ] **Step 3: Hazır yüksek çözünürlüklü sanal arka plan görselleri ve eklenti ikonlarını oluşturma**
- [ ] **Step 4: Manifest V3 yapılandırmasını doğrulama**

---

### Task 2: Akış Kancalama ve Sayfa İçi Müdahale Motoru (Interceptor & Proxy)

**Files:**
- Create: `src/injected/interceptor.js`

**Interfaces:**
- Consumes: `src/injected/video-processor.js`, `src/injected/audio-processor.js`
- Produces: `window.__ISOLATOR_INTERCEPTOR__` ve patch edilmiş `navigator.mediaDevices.getUserMedia`

- [ ] **Step 1: `navigator.mediaDevices.getUserMedia` ve `navigator.getUserMedia` prototip kancalama kodunu yazma**
- [ ] **Step 2: Gerçek donanım akışı (raw stream) ile filtrelenmiş sanal akış (virtual stream) değişim köprüsünü kurma**
- [ ] **Step 3: Sayfa ile eklenti arasındaki `window.postMessage` haberleşme köprüsünü entegre etme**
- [ ] **Step 4: Ayarlar değiştiğinde (blur açma/kapama, arka plan değiştirme) canlı akışı kesintisiz güncelleme mekanizmasını ekleme**

---

### Task 3: Gerçek Zamanlı Video İşleme Motoru (Video Processor)

**Files:**
- Create: `src/injected/video-processor.js`

**Interfaces:**
- Consumes: `MediaStreamTrack` (video), Ayarlar (`mode`, `blurLevel`, `backgroundImage`, `solidColor`)
- Produces: `ProcessedMediaStreamTrack` (`HTMLCanvasElement.captureStream(30)`)

- [ ] **Step 1: Canvas tabanlı gerçek zamanlı video işleme döngüsü (requestVideoFrameCallback / requestAnimationFrame) kurma**
- [ ] **Step 2: Arka plan segmentasyon algoritması (AI Selfie Segmentation & optimize renk/kenar ayrıştırma) modülünü yazma**
- [ ] **Step 3: Arka plan bulanıklaştırma (Blur 5px / 12px / 25px) katmanını oluşturma**
- [ ] **Step 4: Özel görsel / Sanal sınıf arka planı giydirme ve yeşil perde (solid color) modlarını ekleme**
- [ ] **Step 5: Performans ve FPS optimizasyonlarını tamamlama**

---

### Task 4: Gerçek Zamanlı "Öğretmen Modu" Ses İşleme Motoru (Audio Processor)

**Files:**
- Create: `src/injected/audio-processor.js`
- Create: `src/injected/audio-worklet-processor.js`

**Interfaces:**
- Consumes: `MediaStreamTrack` (audio), Ayarlar (`aiNoiseSuppression`, `noiseGateThreshold`, `voiceBoost`, `echoCancellation`)
- Produces: `ProcessedAudioStreamTrack` (`MediaStreamAudioDestinationNode.stream.getAudioTracks()[0]`)

- [ ] **Step 1: Web Audio `AudioContext` ve ses işleme zinciri (`MediaStreamSource` -> `BiquadFilter` -> `DynamicsCompressor` -> `NoiseGate` -> `Destination`) kurma**
- [ ] **Step 2: AI Gürültü Engelleme Worklet modülünü (`audio-worklet-processor.js`) oluşturma**
- [ ] **Step 3: Dinamik Akıllı Ses Kapısı (Smart Noise Gate) ve konuşma yokken mutlak sessizlik algoritmasını entegre etme**
- [ ] **Step 4: "Öğretmen Sesi Netleştirici" (Vocal Clarity Boost - 300Hz-3.5kHz band enhancement) filtresini ekleme**

---

### Task 5: Sayfa İçi Sürüklenebilir Yüzen Kontrol Paneli (Floating Widget)

**Files:**
- Create: `src/content/content-script.js`
- Create: `src/content/floating-widget.js`
- Create: `src/content/floating-widget.css`

**Interfaces:**
- Consumes: `src/injected/interceptor.js`, `chrome.storage.local`
- Produces: Web sitelerinde aktif sürüklenebilir (draggable) ve katlanabilir (minimizable) öğretmen konsolu

- [ ] **Step 1: Shadow DOM tabanlı izole floating widget konteyneri oluşturma (web sitesi stillerinden etkilenmemesi için)**
- [ ] **Step 2: Modern cam efektli (glassmorphic dark UI) stil ve responsive buton tasarımını yazma**
- [ ] **Step 3: Mouse sürükle-bırak (drag & drop) ve ekran köşelerine yapışma fiziğini ekleme**
- [ ] **Step 4: Hızlı eylem butonları (Blur Toggle, Background Carousel, Mic Denoise On/Off, Mute) ve canlı ses VU-meter ekleme**

---

### Task 6: Uzantı Ana Menüsü (Popup UI & Dashboard)

**Files:**
- Create: `src/popup/popup.html`
- Create: `src/popup/popup.css`
- Create: `src/popup/popup.js`

**Interfaces:**
- Consumes: `src/utils/storage.js`
- Produces: Canlı önizleme, ayar paneli, görsel yükleme alanı ve ayrıntılı ses/video kontrolleri

- [ ] **Step 1: Popup HTML iskeletini ve sekmeli/kartlı modern düzeni kodlama**
- [ ] **Step 2: Canlı kamera ve mikrofon önizleme alanı (Live Camera & VU meter preview) ekleme**
- [ ] **Step 3: Arka plan kütüphanesi (hazır resimler + öğretmenin dosya yükleyebileceği Custom Upload)**
- [ ] **Step 4: Öğretmen Modu ses hassasiyeti ve video efekt slider kontrollerini storage ile bağlama**

---

### Task 7: Background Service Worker ve İletişim Senkronizasyonu

**Files:**
- Create: `src/background/service-worker.js`

**Interfaces:**
- Consumes: `chrome.runtime.onInstalled`, `chrome.tabs.onUpdated`, `chrome.storage.onChanged`
- Produces: Sekmeler arası global durum senkronizasyonu ve bildirim yönetimi

- [ ] **Step 1: Service worker yaşam döngüsü ve kurulum anında varsayılan ayarların yüklenmesi**
- [ ] **Step 2: Aktif sekmelerle mesajlaşma ve ayar senkronizasyonunun sağlanması**

---

### Task 8: Test ve Demo Sayfası ile Uçtan Uca Doğrulama (Verification)

**Files:**
- Create: `test/test-classroom.html`
- Create: `test/test-classroom.js`

- [ ] **Step 1: Gerçek bir online sınıf / WebRTC ortamını simüle eden test sayfası hazırlama**
- [ ] **Step 2: Kamera arka plan bulanıklaştırma, resim değiştirme ve solid color testlerini doğrulama**
- [ ] **Step 3: Mikrofon gürültü engelleme, noise gate ve ses netleştirme filtrelerini doğrulama**
- [ ] **Step 4: Floating widget ve popup etkileşimini test etme**
