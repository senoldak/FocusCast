/**
 * isolaTOR Popup Controller (v2.5)
 * Broadcast Studio Pro: Soundboard, Voice Shield, Presentation Countdown, 1-Click Snapshot & Recorder, Custom Profiles Manager
 */

document.addEventListener('DOMContentLoaded', async () => {
  let config = {
    videoEnabled: true,
    videoMode: 'blur',
    blurLevel: 15,
    selectedBackground: 'classroom',
    customBackgroundImage: null,
    backgroundTone: 'none',
    solidColor: '#107c41',
    smoothEdges: true,
    autoFraming: false,

    // v2.2 Video Features
    ringLightEnabled: false,
    ringLightIntensity: 30,
    ringLightTone: 'neutral',
    lowerThirdsEnabled: false,
    badgeName: '',
    badgeTitle: '',
    laserPointerEnabled: false,

    // v2.3 Broadcast Master Features
    beautyFilterEnabled: false,
    beautyLevel: 40,
    gazeGuideEnabled: false,
    teleprompterEnabled: false,
    teleprompterText: 'Toplantı notlarınızı buraya ekleyin... isolaTOR Teleprompter ile kameradan gözünüzü ayırmadan akıcı konuşun.',

    // v2.5 Broadcast Studio Pro Features
    voiceShieldEnabled: false,
    countdownActive: false,
    countdownDurationMin: 5,
    countdownRemainingSeconds: 0,
    countdownRemainingText: '',

    // Audio Features & Voice Characters
    audioEnabled: true,
    teacherMode: true,
    noiseSuppression: true,
    deEsser: true,
    echoCancellation: true,
    autoGainControl: true,
    noiseGateThreshold: -48,
    voiceBoost: true,
    voiceCharacter: 'natural',
    bassBoost: 0,
    trebleBoost: 0,
    micGain: 1.0,
    pushToTalk: false,
    isMuted: false,

    floatingWidgetEnabled: false,
    smartAlertsEnabled: true,
    customProfiles: {}
  };

  // 1. Storage'dan Yükle
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const data = await chrome.storage.local.get(['isolatorConfig']);
    if (data && data.isolatorConfig) {
      config = { ...config, ...data.isolatorConfig };
    }
  }

  // DOM Elemanları
  const videoTab = document.getElementById('videoTab');
  const audioTab = document.getElementById('audioTab');
  const settingsTab = document.getElementById('settingsTab');
  const tabBtns = document.querySelectorAll('.tab-pill');

  const previewVideo = document.getElementById('previewVideo');
  const previewCanvas = document.getElementById('previewCanvas');
  const previewCtx = previewCanvas.getContext('2d');
  const previewModeTag = document.getElementById('previewModeTag');
  const pipBtn = document.getElementById('pipBtn');
  const laserBtn = document.getElementById('laserBtn');
  const gazeBtn = document.getElementById('gazeBtn');
  const snapshotBtn = document.getElementById('snapshotBtn');
  const recordBtn = document.getElementById('recordBtn');
  const recordDot = document.getElementById('recordDot');
  const recordBtnText = document.getElementById('recordBtnText');
  const rxBtns = document.querySelectorAll('.rx-btn');

  const presetBtns = document.querySelectorAll('.preset-btn');
  const autoFramingToggle = document.getElementById('autoFramingToggle');
  const ringLightToggle = document.getElementById('ringLightToggle');
  const ringLightSlider = document.getElementById('ringLightSlider');
  const ringLightValueLabel = document.getElementById('ringLightValueLabel');
  const ringLightChips = document.querySelectorAll('[data-ringtone]');

  const beautyFilterToggle = document.getElementById('beautyFilterToggle');
  const beautySlider = document.getElementById('beautySlider');
  const beautyValueLabel = document.getElementById('beautyValueLabel');

  const countdownTimerLabel = document.getElementById('countdownTimerLabel');
  const countdownChips = document.querySelectorAll('[data-min]');
  const startCountdownBtn = document.getElementById('startCountdownBtn');
  const stopCountdownBtn = document.getElementById('stopCountdownBtn');

  const modeCards = document.querySelectorAll('.mode-btn');
  const blurSettingsCard = document.getElementById('blurSettingsCard');
  const virtualSettingsCard = document.getElementById('virtualSettingsCard');
  const colorSettingsCard = document.getElementById('colorSettingsCard');
  const blurSlider = document.getElementById('blurSlider');
  const blurValueLabel = document.getElementById('blurValueLabel');
  const bgItems = document.querySelectorAll('.bg-tile');
  const moodChips = document.querySelectorAll('.mood-chip[data-tone]');
  const customBgSlot = document.getElementById('customBgSlot');
  const customBgInput = document.getElementById('customBgInput');
  const solidColorInput = document.getElementById('solidColorInput');

  const soundBtns = document.querySelectorAll('.sound-btn');
  const teacherModeToggle = document.getElementById('teacherModeToggle');
  const voiceCharChips = document.querySelectorAll('.char-chip');
  const voiceShieldToggle = document.getElementById('voiceShieldToggle');
  const noiseSuppressionToggle = document.getElementById('noiseSuppressionToggle');
  const deEsserToggle = document.getElementById('deEsserToggle');
  const echoCancellationToggle = document.getElementById('echoCancellationToggle');
  const voiceBoostToggle = document.getElementById('voiceBoostToggle');
  const bassSlider = document.getElementById('bassSlider');
  const bassValueLabel = document.getElementById('bassValueLabel');
  const trebleSlider = document.getElementById('trebleSlider');
  const trebleValueLabel = document.getElementById('trebleValueLabel');
  const gateSlider = document.getElementById('gateSlider');
  const gateValueLabel = document.getElementById('gateValueLabel');
  const spectrumStatus = document.getElementById('spectrumStatus');
  const spectrumBars = document.querySelectorAll('#spectrumVisualizer .s-bar');

  const newProfileNameInput = document.getElementById('newProfileNameInput');
  const saveCustomProfileBtn = document.getElementById('saveCustomProfileBtn');
  const customProfilesList = document.getElementById('customProfilesList');

  const teleprompterToggle = document.getElementById('teleprompterToggle');
  const teleprompterTextInput = document.getElementById('teleprompterTextInput');
  const lowerThirdsToggle = document.getElementById('lowerThirdsToggle');
  const badgeNameInput = document.getElementById('badgeNameInput');
  const badgeTitleInput = document.getElementById('badgeTitleInput');
  const pushToTalkToggle = document.getElementById('pushToTalkToggle');
  const floatingWidgetToggle = document.getElementById('floatingWidgetToggle');
  const smoothEdgesToggle = document.getElementById('smoothEdgesToggle');

  const vuBars = document.querySelectorAll('#miniVu .bar');

  // Arka plan resimleri önbelleği (HD Stüdyolar & Vektörler)
  const bgCache = {};
  const loadBackgroundImg = (key, src) => {
    const img = new Image();
    img.src = src;
    bgCache[key] = img;
  };

  // v2.6 Fotogerçekçi HD Stüdyolar
  loadBackgroundImg('modern-office', `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="wallO" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%231e2638"/><stop offset="100%" stop-color="%230f1420"/></linearGradient><linearGradient id="glassO" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.12"/><stop offset="100%" stop-color="%23818cf8" stop-opacity="0.05"/></linearGradient><linearGradient id="deskO" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%23475569"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23wallO)"/><rect x="60" y="40" width="1160" height="520" rx="16" fill="url(%23glassO)" stroke="%23334155" stroke-width="3"/><circle cx="300" cy="200" r="140" fill="%2338bdf8" opacity="0.06" filter="blur(20px)"/><circle cx="900" cy="220" r="180" fill="%23818cf8" opacity="0.07" filter="blur(30px)"/><line x1="450" y1="40" x2="450" y2="560" stroke="%23334155" stroke-width="4"/><line x1="830" y1="40" x2="830" y2="560" stroke="%23334155" stroke-width="4"/><rect x="80" y="320" width="1120" height="2" fill="%23475569" opacity="0.4"/><rect x="0" y="560" width="1280" height="160" fill="url(%23deskO)"/><line x1="0" y1="560" x2="1280" y2="560" stroke="%2364748b" stroke-width="4"/><circle cx="1120" cy="120" r="30" fill="%23f8fafc" opacity="0.04"/></svg>`);
  loadBackgroundImg('minimalist-loft', `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="brickL" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%23261c18"/><stop offset="100%" stop-color="%23140e0c"/></linearGradient><linearGradient id="warmLightL" x1="0" y1="0" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fbbf24" stop-opacity="0.18"/><stop offset="100%" stop-color="%23d97706" stop-opacity="0"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23brickL)"/><polygon points="0,0 600,0 900,720 0,720" fill="url(%23warmLightL)"/><rect x="80" y="60" width="280" height="380" rx="8" fill="%231c1917" stroke="%2344403c" stroke-width="6"/><rect x="100" y="80" width="240" height="340" rx="4" fill="%23292524"/><rect x="920" y="100" width="260" height="320" rx="10" fill="%231c1917" stroke="%2344403c" stroke-width="4"/><circle cx="1050" cy="260" r="80" fill="%23f59e0b" opacity="0.08" filter="blur(25px)"/><rect x="0" y="580" width="1280" height="140" fill="%2317120e"/></svg>`);
  loadBackgroundImg('bookshelf-library', `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="libBg" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%231a1412"/><stop offset="100%" stop-color="%230d0908"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23libBg)"/><g fill="%23261a15" stroke="%233d2b22" stroke-width="4"><rect x="40" y="30" width="380" height="660" rx="8"/><line x1="40" y1="160" x2="420" y2="160"/><line x1="40" y1="300" x2="420" y2="300"/><line x1="40" y1="440" x2="420" y2="440"/><line x1="40" y1="580" x2="420" y2="580"/></g><g fill="%23261a15" stroke="%233d2b22" stroke-width="4"><rect x="860" y="30" width="380" height="660" rx="8"/><line x1="860" y1="160" x2="1240" y2="160"/><line x1="860" y1="300" x2="1240" y2="300"/><line x1="860" y1="440" x2="1240" y2="440"/><line x1="860" y1="580" x2="1240" y2="580"/></g><rect x="60" y="60" width="32" height="96" fill="%23991b1b" rx="2"/><rect x="96" y="70" width="28" height="86" fill="%231e40af" rx="2"/><rect x="128" y="50" width="36" height="106" fill="%23166534" rx="2"/><rect x="168" y="65" width="24" height="91" fill="%23854d0e" rx="2"/><rect x="880" y="60" width="30" height="96" fill="%2386198f" rx="2"/><rect x="914" y="55" width="36" height="101" fill="%230e7490" rx="2"/><rect x="954" y="70" width="26" height="86" fill="%23b45309" rx="2"/></svg>`);
  loadBackgroundImg('modern-cafe', `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="cafeBg" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%23181210"/><stop offset="100%" stop-color="%230a0706"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23cafeBg)"/><circle cx="200" cy="180" r="70" fill="%23f59e0b" opacity="0.14" filter="blur(20px)"/><circle cx="450" cy="140" r="50" fill="%23fbbf24" opacity="0.12" filter="blur(16px)"/><circle cx="820" cy="160" r="90" fill="%23f97316" opacity="0.1" filter="blur(24px)"/><circle cx="1100" cy="190" r="60" fill="%23fbbf24" opacity="0.15" filter="blur(18px)"/><rect x="120" y="240" width="1040" height="10" rx="4" fill="%23291d18"/><rect x="0" y="560" width="1280" height="160" fill="%231e1612"/><line x1="0" y1="560" x2="1280" y2="560" stroke="%23443228" stroke-width="4"/></svg>`);
  loadBackgroundImg('scandinavian-room', `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%"><defs><linearGradient id="scanBg" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="plantG" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23047857"/></linearGradient></defs><rect width="1280" height="720" fill="url(%23scanBg)"/><rect x="140" y="60" width="400" height="420" rx="12" fill="%23334155" opacity="0.5"/><line x1="340" y1="60" x2="340" y2="480" stroke="%231e293b" stroke-width="6"/><line x1="140" y1="270" x2="540" y2="270" stroke="%231e293b" stroke-width="6"/><circle cx="1080" cy="380" r="45" fill="%2392400e"/><path d="M 1040 380 Q 1080 200 1120 380 Z" fill="url(%23plantG)"/><path d="M 1010 380 Q 1050 240 1080 380 Z" fill="url(%23plantG)"/><path d="M 1080 380 Q 1120 230 1150 380 Z" fill="url(%23plantG)"/><rect x="0" y="580" width="1280" height="140" fill="%231e293b"/></svg>`);

  // Klasik Vektörler
  loadBackgroundImg('classroom', '../assets/backgrounds/classroom.svg');
  loadBackgroundImg('library', '../assets/backgrounds/library.svg');
  loadBackgroundImg('office', '../assets/backgrounds/office.svg');
  loadBackgroundImg('studio', '../assets/backgrounds/studio.svg');
  loadBackgroundImg('nature', '../assets/backgrounds/nature.svg');

  // Active particle list for preview canvas
  const previewParticles = [];
  function spawnPreviewReaction(emoji) {
    for (let i = 0; i < 6; i++) {
      previewParticles.push({
        emoji: emoji || '🎉',
        x: 179 + (Math.random() - 0.5) * 120,
        y: 150 + Math.random() * 15,
        speed: 1.5 + Math.random() * 2.5,
        size: 16 + Math.random() * 10,
        wobble: Math.random() * Math.PI * 2,
        life: 1.0
      });
    }

    // Broadcast to page
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SPAWN_REACTION', emoji });
        }
      });
    }
  }

  // Soundboard Trigger
  function triggerSoundboard(sound) {
    // Local synth preview
    if (audioContext && audioContext.state !== 'closed') {
      const now = audioContext.currentTime;
      if (sound === 'ding') {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (sound === 'success') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.2, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      }
    }

    // Broadcast to meeting tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_SOUNDBOARD', sound });
        }
      });
    }
  }

  // Presentation Countdown Engine
  let countdownInterval = null;
  function startCountdown(min) {
    if (countdownInterval) clearInterval(countdownInterval);
    config.countdownActive = true;
    config.countdownDurationMin = min;
    config.countdownRemainingSeconds = min * 60;
    updateCountdownText();

    countdownInterval = setInterval(() => {
      if (config.countdownRemainingSeconds > 0) {
        config.countdownRemainingSeconds--;
        updateCountdownText();
        saveConfig({
          countdownActive: true,
          countdownRemainingSeconds: config.countdownRemainingSeconds,
          countdownRemainingText: config.countdownRemainingText
        });
      } else {
        clearInterval(countdownInterval);
        config.countdownActive = false;
        config.countdownRemainingText = '00:00';
        triggerSoundboard('ding');
        saveConfig({ countdownActive: false, countdownRemainingText: '' });
      }
    }, 1000);
  }

  function stopCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    config.countdownActive = false;
    config.countdownRemainingSeconds = 0;
    config.countdownRemainingText = '';
    saveConfig({ countdownActive: false, countdownRemainingText: '' });
  }

  function updateCountdownText() {
    const m = Math.floor(config.countdownRemainingSeconds / 60);
    const s = config.countdownRemainingSeconds % 60;
    config.countdownRemainingText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    if (countdownTimerLabel) {
      countdownTimerLabel.textContent = config.countdownActive ? config.countdownRemainingText : 'Kapalı';
    }
  }

  // 2. UI Eşleme
  function syncUI() {
    // Ring Light
    if (ringLightToggle) ringLightToggle.checked = !!config.ringLightEnabled;
    if (ringLightSlider) ringLightSlider.value = config.ringLightIntensity || 30;
    if (ringLightValueLabel) {
      ringLightValueLabel.textContent = config.ringLightEnabled ? `%${config.ringLightIntensity || 30}` : 'Kapalı';
    }
    ringLightChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.ringtone === (config.ringLightTone || 'neutral'));
    });

    // Beauty Filter
    if (beautyFilterToggle) beautyFilterToggle.checked = !!config.beautyFilterEnabled;
    if (beautySlider) beautySlider.value = config.beautyLevel || 40;
    if (beautyValueLabel) {
      beautyValueLabel.textContent = config.beautyFilterEnabled ? `%${config.beautyLevel || 40}` : 'Kapalı';
    }

    // Auto Framing, Laser, Gaze
    if (autoFramingToggle) autoFramingToggle.checked = !!config.autoFraming;
    if (laserBtn) laserBtn.classList.toggle('active', !!config.laserPointerEnabled);
    if (gazeBtn) gazeBtn.classList.toggle('active', !!config.gazeGuideEnabled);

    // Countdown
    if (countdownTimerLabel) {
      countdownTimerLabel.textContent = config.countdownActive && config.countdownRemainingText ? config.countdownRemainingText : 'Kapalı';
    }
    countdownChips.forEach(chip => {
      chip.classList.toggle('active', parseInt(chip.dataset.min, 10) === config.countdownDurationMin);
    });

    // Mod Kartları
    modeCards.forEach(c => c.classList.toggle('active', c.dataset.mode === config.videoMode));
    blurSettingsCard.style.display = config.videoMode === 'blur' ? 'flex' : 'none';
    virtualSettingsCard.style.display = config.videoMode === 'virtual' ? 'flex' : 'none';
    colorSettingsCard.style.display = config.videoMode === 'color' ? 'flex' : 'none';

    // Bulanıklık
    blurSlider.value = config.blurLevel;
    blurValueLabel.textContent = `${config.blurLevel}px`;

    // Arka Plan Galerisi & Mood Chips
    bgItems.forEach(item => item.classList.toggle('active', item.dataset.bg === config.selectedBackground));
    moodChips.forEach(chip => chip.classList.toggle('active', chip.dataset.tone === (config.backgroundTone || 'none')));

    if (config.customBackgroundImage) {
      const thumb = customBgSlot.querySelector('.bg-thumb');
      if (thumb) thumb.style.backgroundImage = `url(${config.customBackgroundImage})`;
      const label = customBgSlot.querySelector('span:not(.sr-only)');
      if (label) label.textContent = 'Yüklü';
    }

    solidColorInput.value = config.solidColor;

    // Ses & Voice Characters
    teacherModeToggle.checked = config.teacherMode;
    voiceCharChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.char === (config.voiceCharacter || 'natural'));
    });

    if (voiceShieldToggle) voiceShieldToggle.checked = !!config.voiceShieldEnabled;
    noiseSuppressionToggle.checked = config.noiseSuppression;
    if (deEsserToggle) deEsserToggle.checked = config.deEsser !== false;
    echoCancellationToggle.checked = config.echoCancellation;
    voiceBoostToggle.checked = config.voiceBoost;

    // Tone EQ
    if (bassSlider) {
      bassSlider.value = config.bassBoost || 0;
      bassValueLabel.textContent = `${config.bassBoost > 0 ? '+' : ''}${config.bassBoost || 0} dB`;
    }
    if (trebleSlider) {
      trebleSlider.value = config.trebleBoost || 0;
      trebleValueLabel.textContent = `${config.trebleBoost > 0 ? '+' : ''}${config.trebleBoost || 0} dB`;
    }

    gateSlider.value = config.noiseGateThreshold;
    gateValueLabel.textContent = `${config.noiseGateThreshold} dB`;
    if (spectrumStatus) {
      spectrumStatus.textContent = config.teacherMode ? 'Studio Aktif' : 'Ham Ses';
    }

    // Teleprompter, Lower Thirds & PTT
    if (teleprompterToggle) teleprompterToggle.checked = !!config.teleprompterEnabled;
    if (teleprompterTextInput) teleprompterTextInput.value = config.teleprompterText || '';
    if (lowerThirdsToggle) lowerThirdsToggle.checked = !!config.lowerThirdsEnabled;
    if (badgeNameInput) badgeNameInput.value = config.badgeName || '';
    if (badgeTitleInput) badgeTitleInput.value = config.badgeTitle || '';
    if (pushToTalkToggle) pushToTalkToggle.checked = !!config.pushToTalk;

    if (floatingWidgetToggle) floatingWidgetToggle.checked = config.floatingWidgetEnabled;
    if (smoothEdgesToggle) smoothEdgesToggle.checked = config.smoothEdges;

    renderCustomProfilesList();
    highlightMatchingPreset();
    updatePreviewTag();
  }

  function renderCustomProfilesList() {
    if (!customProfilesList) return;
    customProfilesList.innerHTML = '';
    const profiles = config.customProfiles || {};
    const names = Object.keys(profiles);

    if (names.length === 0) {
      customProfilesList.innerHTML = '<div style="font-size:10px; color:var(--text-3); text-align:center; padding:4px;">Henüz kayıtlı özel profil yok.</div>';
      return;
    }

    names.forEach(name => {
      const row = document.createElement('div');
      row.className = 'custom-profile-item';
      row.innerHTML = `
        <span style="font-weight:600; color:var(--text-1);">${name}</span>
        <div class="custom-profile-actions">
          <button class="custom-profile-btn" data-action="load" data-name="${name}">Yükle</button>
          <button class="custom-profile-btn" data-action="delete" data-name="${name}" style="color:var(--rose);">Sil</button>
        </div>
      `;
      customProfilesList.appendChild(row);
    });

    customProfilesList.querySelectorAll('.custom-profile-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const profileName = btn.dataset.name;
        if (action === 'load') {
          const loadedCfg = config.customProfiles[profileName];
          if (loadedCfg) {
            saveConfig(loadedCfg);
          }
        } else if (action === 'delete') {
          const updated = { ...config.customProfiles };
          delete updated[profileName];
          saveConfig({ customProfiles: updated });
        }
      });
    });
  }

  function highlightMatchingPreset() {
    presetBtns.forEach(btn => {
      const p = btn.dataset.preset;
      let matches = false;
      if (p === 'focus' && config.videoMode === 'blur' && config.teacherMode) matches = true;
      else if (p === 'meeting' && config.videoMode === 'virtual' && config.selectedBackground === 'studio' && config.teacherMode) matches = true;
      else if (p === 'studio' && config.videoMode === 'color' && config.teacherMode) matches = true;
      btn.classList.toggle('active', matches);
    });
  }

  function updatePreviewTag() {
    if (config.videoMode === 'original') previewModeTag.textContent = 'Orijinal Kamera';
    else if (config.videoMode === 'blur') previewModeTag.textContent = `Bulanıklaştırma (${config.blurLevel}px)`;
    else if (config.videoMode === 'virtual') {
      const names = {
        'modern-office': 'Ofis (HD)',
        'minimalist-loft': 'Loft (HD)',
        'bookshelf-library': 'Kitaplık (HD)',
        'modern-cafe': 'Kafe (HD)',
        'scandinavian-room': 'Salon (HD)',
        classroom: 'Sınıf',
        library: 'Kütüphane',
        office: 'Ofis',
        studio: 'Stüdyo',
        nature: 'Doğa',
        custom: 'Özel'
      };
      previewModeTag.textContent = `Sanal: ${names[config.selectedBackground] || 'Seçili'}`;
    } else if (config.videoMode === 'color') previewModeTag.textContent = 'Yeşil Ekran';
  }

  async function saveConfig(updates) {
    config = { ...config, ...updates };
    syncUI();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ isolatorConfig: config });
    }
  }

  // 3. Canlı Önizleme Motoru
  let mediaStream = null;
  let audioContext = null;
  let analyser = null;

  let isPreviewRendering = false;
  async function startPreview() {
    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }

      // 1. Kamera ve mikrofon iste
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: true
        });
      } catch (audioErr) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: false
        });
      }

      previewVideo.srcObject = mediaStream;
      await previewVideo.play();
      
      previewCanvas.width = 358;
      previewCanvas.height = 165;
      
      if (!isPreviewRendering) {
        isPreviewRendering = true;
        requestAnimationFrame(renderPreviewLoop);
      }

      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks && audioTracks.length > 0) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
        const source = audioContext.createMediaStreamSource(mediaStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        monitorAudioLevel();
      }
    } catch (err) {
      console.info('[isolaTOR Preview] Kamera izin bekleniyor (Toplantı sayfasında tam erişim aktiftir)');
      renderFallbackPreview();
    }
  }

  let laserAnim = 0;
  function renderPreviewLoop() {
    if (!previewVideo.paused && !previewVideo.ended) {
      const w = previewCanvas.width;
      const h = previewCanvas.height;

      previewCtx.save();
      if (config.autoFraming) {
        previewCtx.translate(w / 2, h / 2);
        previewCtx.scale(1.12, 1.12);
        previewCtx.translate(-w / 2, -h / 2);
      }

      if (config.videoMode === 'original') {
        previewCtx.filter = 'none';
        previewCtx.drawImage(previewVideo, 0, 0, w, h);
      } else if (config.videoMode === 'blur') {
        previewCtx.filter = `blur(${Math.max(2, config.blurLevel / 2.5)}px)`;
        previewCtx.drawImage(previewVideo, -10, -10, w + 20, h + 20);

        previewCtx.filter = 'none';
        previewCtx.drawImage(previewVideo, w * 0.2, h * 0.1, w * 0.6, h * 0.9, w * 0.2, h * 0.1, w * 0.6, h * 0.9);
      } else if (config.videoMode === 'virtual') {
        const bgImg = config.selectedBackground === 'custom' && config.customBackgroundImage
          ? bgCache['custom']
          : bgCache[config.selectedBackground];

        if (bgImg && bgImg.complete) {
          previewCtx.filter = 'none';
          previewCtx.drawImage(bgImg, 0, 0, w, h);
          applyMoodToneOverlay(w, h);
          
          // Kişi maskesi ile temiz montaj
          previewCtx.save();
          previewCtx.beginPath();
          previewCtx.ellipse(w * 0.5, h * 0.62, w * 0.28, h * 0.46, 0, 0, Math.PI * 2);
          previewCtx.clip();
          previewCtx.drawImage(previewVideo, 0, 0, w, h);
          previewCtx.restore();
        } else {
          previewCtx.filter = 'blur(10px)';
          previewCtx.drawImage(previewVideo, 0, 0, w, h);
        }
      } else if (config.videoMode === 'color') {
        previewCtx.filter = 'none';
        previewCtx.fillStyle = config.solidColor;
        previewCtx.fillRect(0, 0, w, h);
        
        previewCtx.save();
        previewCtx.beginPath();
        previewCtx.ellipse(w * 0.5, h * 0.62, w * 0.28, h * 0.46, 0, 0, Math.PI * 2);
        previewCtx.clip();
        previewCtx.drawImage(previewVideo, 0, 0, w, h);
        previewCtx.restore();
      }

      // Beauty Softening Overlay
      if (config.beautyFilterEnabled) {
        previewCtx.save();
        previewCtx.globalAlpha = (config.beautyLevel || 40) / 220;
        previewCtx.filter = 'blur(3px) contrast(104%)';
        previewCtx.drawImage(previewVideo, w * 0.2, h * 0.1, w * 0.6, h * 0.9, w * 0.2, h * 0.1, w * 0.6, h * 0.9);
        previewCtx.restore();
      }

      // Ring Light Overlay
      if (config.ringLightEnabled) {
        const intensity = (config.ringLightIntensity || 30) / 100;
        const gradient = previewCtx.createRadialGradient(w / 2, h * 0.45, w * 0.1, w / 2, h * 0.45, w * 0.8);
        const tone = config.ringLightTone;
        const color = tone === 'warm' ? '255, 220, 180' : (tone === 'cold' ? '200, 230, 255' : '255, 255, 255');
        gradient.addColorStop(0, `rgba(${color}, ${intensity * 0.28})`);
        gradient.addColorStop(0.7, `rgba(${color}, ${intensity * 0.1})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);
        
        previewCtx.save();
        previewCtx.globalCompositeOperation = 'screen';
        previewCtx.fillStyle = gradient;
        previewCtx.fillRect(0, 0, w, h);
        previewCtx.restore();
      }

      // Lower Thirds Name Badge Overlay
      if (config.lowerThirdsEnabled && config.badgeName) {
        const name = config.badgeName;
        const title = config.badgeTitle || '';
        const bx = 16, by = h - 52;
        const bw = Math.min(220, Math.max(140, name.length * 8 + 40));
        const bh = title ? 38 : 26;

        previewCtx.save();
        previewCtx.fillStyle = 'rgba(6, 8, 16, 0.88)';
        previewCtx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
        previewCtx.lineWidth = 1;
        previewCtx.beginPath();
        if (previewCtx.roundRect) previewCtx.roundRect(bx, by, bw, bh, 6);
        else previewCtx.rect(bx, by, bw, bh);
        previewCtx.fill();
        previewCtx.stroke();

        previewCtx.fillStyle = '#10b981';
        previewCtx.beginPath();
        previewCtx.arc(bx + 10, by + (title ? 13 : 13), 3, 0, Math.PI * 2);
        previewCtx.fill();

        previewCtx.fillStyle = '#ffffff';
        previewCtx.font = 'bold 10.5px sans-serif';
        previewCtx.fillText(name, bx + 18, by + 16);

        if (title) {
          previewCtx.fillStyle = '#94a3b8';
          previewCtx.font = '8.5px sans-serif';
          previewCtx.fillText(title, bx + 18, by + 30);
        }
        previewCtx.restore();
      }

      // Gaze Focus Guide Lines
      if (config.gazeGuideEnabled) {
        previewCtx.save();
        previewCtx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
        previewCtx.setLineDash([3, 3]);
        previewCtx.lineWidth = 1;
        previewCtx.beginPath();
        previewCtx.moveTo(0, h * 0.38);
        previewCtx.lineTo(w, h * 0.38);
        previewCtx.moveTo(w / 2, 0);
        previewCtx.lineTo(w / 2, h);
        previewCtx.stroke();

        previewCtx.strokeStyle = 'rgba(129, 140, 248, 0.7)';
        previewCtx.beginPath();
        previewCtx.arc(w / 2, h * 0.38, 10, 0, Math.PI * 2);
        previewCtx.stroke();
        previewCtx.restore();
      }

      // Presentation Countdown Badge Overlay
      if (config.countdownActive && config.countdownRemainingText) {
        const text = config.countdownRemainingText;
        const bx = w - 68, by = 10, bw = 58, bh = 22;
        previewCtx.save();
        previewCtx.fillStyle = 'rgba(9, 10, 15, 0.9)';
        previewCtx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
        previewCtx.lineWidth = 1;
        previewCtx.beginPath();
        if (previewCtx.roundRect) previewCtx.roundRect(bx, by, bw, bh, 4);
        else previewCtx.rect(bx, by, bw, bh);
        previewCtx.fill();
        previewCtx.stroke();

        previewCtx.fillStyle = '#f8fafc';
        previewCtx.font = '600 10.5px "JetBrains Mono", monospace';
        previewCtx.fillText(text, bx + 10, by + 15);
        previewCtx.restore();
      }

      // Virtual Laser Pointer
      if (config.laserPointerEnabled) {
        laserAnim += 0.04;
        const lx = w * 0.5 + Math.sin(laserAnim) * (w * 0.25);
        const ly = h * 0.45 + Math.cos(laserAnim * 1.3) * (h * 0.2);

        previewCtx.save();
        const laserGrad = previewCtx.createRadialGradient(lx, ly, 1, lx, ly, 12);
        laserGrad.addColorStop(0, '#ff0055');
        laserGrad.addColorStop(0.3, 'rgba(255, 0, 85, 0.8)');
        laserGrad.addColorStop(1, 'rgba(255, 0, 85, 0)');
        previewCtx.fillStyle = laserGrad;
        previewCtx.beginPath();
        previewCtx.arc(lx, ly, 12, 0, Math.PI * 2);
        previewCtx.fill();

        previewCtx.fillStyle = '#ffffff';
        previewCtx.beginPath();
        previewCtx.arc(lx, ly, 2.5, 0, Math.PI * 2);
        previewCtx.fill();
        previewCtx.restore();
      }

      // Floating Reactions Particles
      if (previewParticles.length > 0) {
        previewCtx.save();
        for (let i = previewParticles.length - 1; i >= 0; i--) {
          const p = previewParticles[i];
          p.y -= p.speed;
          p.x += Math.sin(p.wobble) * 0.6;
          p.wobble += 0.05;
          p.life -= 0.02;

          if (p.life <= 0 || p.y < -20) {
            previewParticles.splice(i, 1);
            continue;
          }

          previewCtx.globalAlpha = Math.max(0, p.life);
          previewCtx.font = `${p.size}px sans-serif`;
          previewCtx.fillText(p.emoji, p.x, p.y);
        }
        previewCtx.restore();
      }

      previewCtx.restore();
    }
    requestAnimationFrame(renderPreviewLoop);
  }

  function applyMoodToneOverlay(w, h) {
    const tone = config.backgroundTone;
    if (!tone || tone === 'none') return;

    previewCtx.save();
    if (tone === 'warm') previewCtx.fillStyle = 'rgba(255, 140, 0, 0.14)';
    else if (tone === 'cool') previewCtx.fillStyle = 'rgba(0, 150, 255, 0.14)';
    else if (tone === 'cyber') previewCtx.fillStyle = 'rgba(168, 85, 247, 0.18)';
    previewCtx.fillRect(0, 0, w, h);
    previewCtx.restore();
  }

  function renderFallbackPreview() {
    previewCanvas.width = 358;
    previewCanvas.height = 165;
    const ctx = previewCanvas.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 358, 165);
    grad.addColorStop(0, '#0c0e14');
    grad.addColorStop(1, '#151822');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 358, 165);

    ctx.fillStyle = '#818cf8';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Önizlemeyi Başlatmak İçin Tıklayın', 179, 76);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Toplantı sayfasında filtreler otomatik aktiftir', 179, 96);
  }

  const previewFrameElem = document.querySelector('.preview-frame');
  if (previewFrameElem) {
    previewFrameElem.style.cursor = 'pointer';
    previewFrameElem.addEventListener('click', (e) => {
      // Butonlara basılmamışsa kamerayı başlat
      if (!e.target.closest('button')) {
        startPreview();
      }
    });
  }

  function monitorAudioLevel() {
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function update() {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      const norm = Math.min(1.0, avg / 80);

      vuBars.forEach((bar, idx) => {
        const threshold = (idx + 1) * 0.18;
        const active = norm > threshold;
        bar.style.height = active ? `${Math.max(4, norm * 12)}px` : '3px';
        bar.classList.toggle('active', active);
      });

      if (spectrumBars && spectrumBars.length > 0) {
        spectrumBars.forEach((bar, idx) => {
          const rawVal = dataArray[idx % dataArray.length] || 0;
          const factor = config.teacherMode ? Math.max(0.15, rawVal / 255) : Math.max(0.2, (rawVal + 20) / 255);
          const h = Math.min(24, Math.max(3, factor * 26));
          bar.style.height = `${h}px`;
        });
      }

      requestAnimationFrame(update);
    }
    update();
  }

  // 4. PIP, LASER, GAZE, SNAPSHOT & RECORDER
  let pipVideo = null;
  if (pipBtn) {
    pipBtn.addEventListener('click', async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          pipBtn.classList.remove('active');
        } else {
          if (!pipVideo) {
            pipVideo = document.createElement('video');
            pipVideo.muted = true;
            pipVideo.autoplay = true;
            pipVideo.srcObject = previewCanvas.captureStream(30);
            await pipVideo.play();
          }
          await pipVideo.requestPictureInPicture();
          pipBtn.classList.add('active');
        }
      } catch (e) {
        console.warn('[isolaTOR PiP] Error:', e);
      }
    });
  }

  if (laserBtn) {
    laserBtn.addEventListener('click', () => {
      saveConfig({ laserPointerEnabled: !config.laserPointerEnabled });
    });
  }

  if (gazeBtn) {
    gazeBtn.addEventListener('click', () => {
      saveConfig({ gazeGuideEnabled: !config.gazeGuideEnabled });
    });
  }

  // 1-Click Snapshot
  if (snapshotBtn) {
    snapshotBtn.addEventListener('click', () => {
      previewCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `isolator_snapshot_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    });
  }

  // Local MediaRecorder
  let mediaRecorder = null;
  let recordedChunks = [];
  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordDot.classList.remove('recording');
        recordBtnText.textContent = 'Kayıt';
      } else {
        recordedChunks = [];
        const stream = previewCanvas.captureStream(30);
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `isolator_recording_${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };
        mediaRecorder.start();
        recordDot.classList.add('recording');
        recordBtnText.textContent = 'Dur';
      }
    });
  }

  // 5. REACTIONS & SOUNDBOARD
  rxBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      spawnPreviewReaction(btn.dataset.emoji);
    });
  });

  soundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerSoundboard(btn.dataset.sound);
    });
  });

  // 6. BEAUTY FILTER & COUNTDOWN
  if (beautyFilterToggle) {
    beautyFilterToggle.addEventListener('change', (e) => saveConfig({ beautyFilterEnabled: e.target.checked }));
  }
  if (beautySlider) {
    beautySlider.addEventListener('input', (e) => saveConfig({ beautyLevel: parseInt(e.target.value, 10) }));
  }

  countdownChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const min = parseInt(chip.dataset.min, 10);
      countdownChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      config.countdownDurationMin = min;
    });
  });

  if (startCountdownBtn) {
    startCountdownBtn.addEventListener('click', () => {
      startCountdown(config.countdownDurationMin || 5);
    });
  }
  if (stopCountdownBtn) {
    stopCountdownBtn.addEventListener('click', () => {
      stopCountdown();
    });
  }

  // 7. HIZLI PROFİLLER
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      if (p === 'focus') {
        saveConfig({
          videoMode: 'blur',
          blurLevel: 15,
          teacherMode: true,
          voiceCharacter: 'natural',
          noiseSuppression: true,
          voiceBoost: true,
          floatingWidgetEnabled: true
        });
      } else if (p === 'meeting') {
        saveConfig({
          videoMode: 'virtual',
          selectedBackground: 'studio',
          backgroundTone: 'none',
          ringLightEnabled: true,
          ringLightIntensity: 35,
          beautyFilterEnabled: true,
          beautyLevel: 45,
          lowerThirdsEnabled: true,
          teacherMode: true,
          voiceCharacter: 'crisp',
          noiseSuppression: true,
          voiceBoost: true,
          autoFraming: true
        });
      } else if (p === 'studio') {
        saveConfig({
          videoMode: 'color',
          solidColor: '#107c41',
          ringLightEnabled: true,
          ringLightIntensity: 45,
          beautyFilterEnabled: true,
          beautyLevel: 50,
          teacherMode: true,
          voiceCharacter: 'radio',
          noiseSuppression: true,
          deEsser: true,
          echoCancellation: true,
          voiceBoost: true,
          bassBoost: 2,
          trebleBoost: 2,
          noiseGateThreshold: -42
        });
      }
    });
  });

  // 8. RING LIGHT & AUTO FRAMING
  if (ringLightToggle) {
    ringLightToggle.addEventListener('change', (e) => saveConfig({ ringLightEnabled: e.target.checked }));
  }
  if (ringLightSlider) {
    ringLightSlider.addEventListener('input', (e) => saveConfig({ ringLightIntensity: parseInt(e.target.value, 10) }));
  }
  ringLightChips.forEach(chip => {
    chip.addEventListener('click', () => saveConfig({ ringLightTone: chip.dataset.ringtone }));
  });

  if (autoFramingToggle) {
    autoFramingToggle.addEventListener('change', (e) => saveConfig({ autoFraming: e.target.checked }));
  }

  // 9. VOICE CHARACTERS & SHIELD
  voiceCharChips.forEach(chip => {
    chip.addEventListener('click', () => {
      saveConfig({ voiceCharacter: chip.dataset.char });
    });
  });

  if (voiceShieldToggle) {
    voiceShieldToggle.addEventListener('change', (e) => saveConfig({ voiceShieldEnabled: e.target.checked }));
  }

  // 10. TELEPROMPTER, LOWER THIRDS, PTT & CUSTOM PROFILES
  if (teleprompterToggle) {
    teleprompterToggle.addEventListener('change', (e) => saveConfig({ teleprompterEnabled: e.target.checked }));
  }
  if (teleprompterTextInput) {
    teleprompterTextInput.addEventListener('input', (e) => saveConfig({ teleprompterText: e.target.value }));
  }
  if (lowerThirdsToggle) {
    lowerThirdsToggle.addEventListener('change', (e) => saveConfig({ lowerThirdsEnabled: e.target.checked }));
  }
  if (badgeNameInput) {
    badgeNameInput.addEventListener('input', (e) => saveConfig({ badgeName: e.target.value }));
  }
  if (badgeTitleInput) {
    badgeTitleInput.addEventListener('input', (e) => saveConfig({ badgeTitle: e.target.value }));
  }
  if (pushToTalkToggle) {
    pushToTalkToggle.addEventListener('change', (e) => saveConfig({ pushToTalk: e.target.checked }));
  }

  if (saveCustomProfileBtn && newProfileNameInput) {
    saveCustomProfileBtn.addEventListener('click', () => {
      const name = newProfileNameInput.value.trim();
      if (!name) return;
      const currentSnapshot = {
        videoMode: config.videoMode,
        blurLevel: config.blurLevel,
        selectedBackground: config.selectedBackground,
        backgroundTone: config.backgroundTone,
        ringLightEnabled: config.ringLightEnabled,
        ringLightIntensity: config.ringLightIntensity,
        ringLightTone: config.ringLightTone,
        beautyFilterEnabled: config.beautyFilterEnabled,
        beautyLevel: config.beautyLevel,
        voiceCharacter: config.voiceCharacter,
        bassBoost: config.bassBoost,
        trebleBoost: config.trebleBoost,
        teacherMode: config.teacherMode,
        voiceShieldEnabled: config.voiceShieldEnabled
      };
      const profiles = { ...(config.customProfiles || {}), [name]: currentSnapshot };
      newProfileNameInput.value = '';
      saveConfig({ customProfiles: profiles });
    });
  }

  // 11. ATMOSFER / MOOD TONES
  moodChips.forEach(chip => {
    chip.addEventListener('click', () => {
      saveConfig({ backgroundTone: chip.dataset.tone });
    });
  });

  // 12. TAB DEĞİŞTİRME
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const targetId = btn.dataset.tab;
      [videoTab, audioTab, settingsTab].forEach(tab => {
        tab.classList.toggle('active', tab.id === targetId);
      });
    });
  });

  // 13. DİĞER ETKİLEŞİMLER
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      saveConfig({ videoMode: card.dataset.mode });
    });
  });

  blurSlider.addEventListener('input', (e) => {
    saveConfig({ blurLevel: parseInt(e.target.value, 10) });
  });

  bgItems.forEach(item => {
    item.addEventListener('click', () => {
      if (item.id === 'customBgSlot') {
        customBgInput.click();
      } else {
        const selectedBg = item.dataset.bg;
        saveConfig({ selectedBackground: selectedBg, videoMode: 'virtual' });
      }
    });
  });

  customBgInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        loadBackgroundImg('custom', dataUrl);
        saveConfig({
          customBackgroundImage: dataUrl,
          selectedBackground: 'custom',
          videoMode: 'virtual'
        });
      };
      reader.readAsDataURL(file);
    }
  });

  solidColorInput.addEventListener('input', (e) => {
    saveConfig({ solidColor: e.target.value });
  });

  document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      if (color) {
        solidColorInput.value = color;
        saveConfig({ solidColor: color });
      }
    });
  });

  teacherModeToggle.addEventListener('change', (e) => {
    saveConfig({
      teacherMode: e.target.checked,
      noiseSuppression: e.target.checked,
      echoCancellation: e.target.checked,
      voiceBoost: e.target.checked
    });
  });

  noiseSuppressionToggle.addEventListener('change', (e) => saveConfig({ noiseSuppression: e.target.checked }));
  if (deEsserToggle) deEsserToggle.addEventListener('change', (e) => saveConfig({ deEsser: e.target.checked }));
  echoCancellationToggle.addEventListener('change', (e) => saveConfig({ echoCancellation: e.target.checked }));
  voiceBoostToggle.addEventListener('change', (e) => saveConfig({ voiceBoost: e.target.checked }));

  // Tone EQ
  if (bassSlider) {
    bassSlider.addEventListener('input', (e) => {
      saveConfig({ bassBoost: parseInt(e.target.value, 10) });
    });
  }
  if (trebleSlider) {
    trebleSlider.addEventListener('input', (e) => {
      saveConfig({ trebleBoost: parseInt(e.target.value, 10) });
    });
  }

  gateSlider.addEventListener('input', (e) => {
    saveConfig({ noiseGateThreshold: parseInt(e.target.value, 10) });
  });

  // 14. PRESENTER MODE (Kamera İçi Sunucu)
  const presenterModeToggle = document.getElementById('presenterModeToggle');
  const presenterControls = document.getElementById('presenterControls');
  const presenterLayoutChips = document.querySelectorAll('[data-layout]');
  const startScreenShareBtn = document.getElementById('startScreenShareBtn');
  const stopScreenShareBtn = document.getElementById('stopScreenShareBtn');

  if (presenterModeToggle) {
    presenterModeToggle.addEventListener('change', (e) => {
      saveConfig({ presenterModeEnabled: e.target.checked });
      if (presenterControls) presenterControls.style.display = e.target.checked ? 'block' : 'none';
    });
  }

  presenterLayoutChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presenterLayoutChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      saveConfig({ presenterLayout: chip.dataset.layout });
    });
  });

  if (startScreenShareBtn) {
    startScreenShareBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'START_SCREEN_SHARE' });
            startScreenShareBtn.style.display = 'none';
            if (stopScreenShareBtn) stopScreenShareBtn.style.display = 'block';
          }
        });
      }
    });
  }

  if (stopScreenShareBtn) {
    stopScreenShareBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP_SCREEN_SHARE' });
            stopScreenShareBtn.style.display = 'none';
            if (startScreenShareBtn) startScreenShareBtn.style.display = 'block';
          }
        });
      }
    });
  }

  // 15. ÖZEL SOUNDBOARD YÜKLEME & ÇALMA
  const customSoundBtn1 = document.getElementById('customSoundBtn1');
  const customSoundBtn2 = document.getElementById('customSoundBtn2');
  const customSoundInput1 = document.getElementById('customSoundInput1');
  const customSoundInput2 = document.getElementById('customSoundInput2');

  const handleCustomSound = (btn, input, slotKey) => {
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const currentSlot = (config.customSounds && config.customSounds[slotKey]) || {};
      if (currentSlot.dataUrl) {
        // Zaten ses yüklüyse çal
        triggerCustomAudio(currentSlot.dataUrl);
      } else {
        // Ses yüklü değilse dosya seçici aç
        input.click();
      }
    });

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target.result;
          const updated = { ...(config.customSounds || {}) };
          updated[slotKey] = { name: file.name.slice(0, 10), dataUrl };
          btn.textContent = `🎵 ${file.name.slice(0, 8)}`;
          saveConfig({ customSounds: updated });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const triggerCustomAudio = (dataUrl) => {
    const audio = new Audio(dataUrl);
    audio.play().catch(() => {});

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_SOUNDBOARD', sound: 'custom', customDataUrl: dataUrl });
        }
      });
    }
  };

  handleCustomSound(customSoundBtn1, customSoundInput1, 'slot1');
  handleCustomSound(customSoundBtn2, customSoundInput2, 'slot2');

  // Başlat
  syncUI();
  startPreview();
});
