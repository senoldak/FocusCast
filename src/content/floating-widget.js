/**
 * isolaTOR Floating Console Widget (v2.0)
 * Features: Studio Mode, Session Timer, Smart Alerts, Draggable Glass Bar & Realtime VU Meter
 */

(function () {
  window.__IsolatorFloatingWidget = class IsolatorFloatingWidget {
    constructor(config = {}) {
      this.config = config;
      this.host = null;
      this.shadow = null;
      this.widgetElem = null;
      this.isDragging = false;
      this.isMinimized = false;
      this.dragOffset = { x: 0, y: 0 };
      this.startTime = Date.now();
      this.timerInterval = null;
      this.alertTimeout = null;
      this.lastAudioTime = Date.now();
    }

    mount() {
      if (document.getElementById('isolator-widget-host')) return;

      this.host = document.createElement('div');
      this.host.id = 'isolator-widget-host';
      document.documentElement.appendChild(this.host);

      this.shadow = this.host.attachShadow({ mode: 'open' });

      const linkElem = document.createElement('link');
      linkElem.setAttribute('rel', 'stylesheet');
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        linkElem.setAttribute('href', chrome.runtime.getURL('src/content/floating-widget.css'));
      }
      this.shadow.appendChild(linkElem);

      this.render();
      this.attachEvents();
      this.startTimer();
      this.listenAudioMeterAndAlerts();
    }

    render() {
      const { videoMode, blurLevel, teacherMode, noiseSuppression } = this.config;

      const widget = document.createElement('div');
      widget.className = 'isolator-widget';
      widget.style.top = `${this.config.widgetPosition?.top || 20}px`;
      widget.style.right = `${this.config.widgetPosition?.right || 20}px`;

      widget.innerHTML = `
        <!-- Smart Alert Popup Bubble -->
        <div class="alert-bubble" id="alertBubble">
          <span class="alert-icon" id="alertIcon">⚠️</span>
          <span class="alert-text" id="alertText">Bildirim</span>
        </div>

        <div class="brand-pill" id="brandBtn" title="isolaTOR Studio Paneli (Tıkla: Küçült/Büyüt)">
          <div class="brand-dot"></div>
          <span>isolaTOR</span>
        </div>

        <!-- Session Timer -->
        <div class="session-timer-badge" id="sessionTimer" title="Görüşme / Ders Süresi">
          00:00
        </div>

        <div class="w-sep"></div>

        <div class="control-group">
          <!-- Bulanıklık / Arka Plan Hızlı Butonu -->
          <button class="action-btn ${videoMode === 'blur' ? 'active' : ''}" id="btnBlur" title="Bulanıklık Modu">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span>${videoMode === 'blur' ? 'Blur ' + (blurLevel || 15) + 'px' : (videoMode === 'virtual' ? 'Sanal' : 'Orijinal')}</span>
          </button>

          <!-- Sanal Arka Plan Değiştirici -->
          <button class="action-btn ${videoMode === 'virtual' ? 'active' : ''}" id="btnVirtual" title="Sanal Arka Plan Değiştir">
            <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            <span>Galeri</span>
          </button>

          <!-- Studio Modu AI Ses İzolasyon Butonu -->
          <button class="action-btn ${teacherMode && noiseSuppression ? 'active' : ''}" id="btnDenoise" title="Studio Modu: AI Gürültü Engelleme">
            <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
            <span>${teacherMode ? 'Studio' : 'Ham Ses'}</span>
          </button>

          <!-- Cough Mute (3 Saniye Geçici Susturucu) -->
          <button class="action-btn" id="btnCough" title="3 Saniye Öksürük / Hızlı Sustur">
            <span>🤫 3s</span>
          </button>
        </div>

        <!-- VU Meter Seviye Göstergesi -->
        <div class="vu-meter-container" title="Canlı Mikrofon">
          <div class="vu-bars" id="vuBars">
            <div class="vu-bar" id="vb1"></div>
            <div class="vu-bar" id="vb2"></div>
            <div class="vu-bar" id="vb3"></div>
            <div class="vu-bar" id="vb4"></div>
          </div>
        </div>

        <!-- Küçültme Butonu -->
        <button class="icon-btn" id="btnMinimize" title="Paneli Küçült">
          <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
        </button>
      `;

      this.shadow.appendChild(widget);
      this.widgetElem = widget;
    }

    startTimer() {
      const timerElem = this.shadow.getElementById('sessionTimer');
      if (!timerElem) return;

      this.timerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        timerElem.textContent = `${mins}:${secs}`;
      }, 1000);
    }

    showAlert(message, icon = '⚠️') {
      const bubble = this.shadow.getElementById('alertBubble');
      const textElem = this.shadow.getElementById('alertText');
      const iconElem = this.shadow.getElementById('alertIcon');
      if (!bubble || !textElem) return;

      textElem.textContent = message;
      if (iconElem) iconElem.textContent = icon;

      bubble.classList.add('visible');
      if (this.alertTimeout) clearTimeout(this.alertTimeout);

      this.alertTimeout = setTimeout(() => {
        bubble.classList.remove('visible');
      }, 3500);
    }

    attachEvents() {
      // 1. Sürükle ve Bırak (Draggable)
      this.widgetElem.addEventListener('mousedown', (e) => {
        if (e.target.closest('.action-btn') || e.target.closest('.icon-btn')) return;
        this.isDragging = true;
        const rect = this.widgetElem.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        let x = e.clientX - this.dragOffset.x;
        let y = e.clientY - this.dragOffset.y;

        x = Math.max(10, Math.min(window.innerWidth - this.widgetElem.offsetWidth - 10, x));
        y = Math.max(10, Math.min(window.innerHeight - this.widgetElem.offsetHeight - 10, y));

        this.widgetElem.style.left = `${x}px`;
        this.widgetElem.style.top = `${y}px`;
        this.widgetElem.style.right = 'auto';
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
      });

      // 2. Buton Eylemleri
      const btnBlur = this.shadow.getElementById('btnBlur');
      btnBlur.addEventListener('click', () => {
        if (this.config.videoMode === 'blur') {
          if (this.config.blurLevel === 15) {
            this.updateAndSync({ blurLevel: 30 });
          } else {
            this.updateAndSync({ videoMode: 'original' });
          }
        } else {
          this.updateAndSync({ videoMode: 'blur', blurLevel: 15 });
        }
      });

      const btnVirtual = this.shadow.getElementById('btnVirtual');
      btnVirtual.addEventListener('click', () => {
        if (this.config.videoMode === 'virtual') {
          const bgs = ['studio', 'office', 'nature', 'classroom', 'library'];
          const nextIdx = (bgs.indexOf(this.config.selectedBackground) + 1) % bgs.length;
          this.updateAndSync({ selectedBackground: bgs[nextIdx] });
        } else {
          this.updateAndSync({ videoMode: 'virtual', selectedBackground: 'studio' });
        }
      });

      const btnDenoise = this.shadow.getElementById('btnDenoise');
      btnDenoise.addEventListener('click', () => {
        const nextState = !this.config.teacherMode;
        this.updateAndSync({ teacherMode: nextState, noiseSuppression: nextState });
        if (nextState) {
          this.showAlert('Studio Modu Aktif', '🎙️');
        } else {
          this.showAlert('Filtreler Devre Dışı', '⚡');
        }
      });

      const btnCough = this.shadow.getElementById('btnCough');
      if (btnCough) {
        btnCough.addEventListener('click', () => {
          this.showAlert('Öksürük Susturucu (3s)', '🤫');
          this.updateAndSync({ isMuted: true });
          setTimeout(() => {
            this.updateAndSync({ isMuted: false });
          }, 3000);
        });
      }

      // 3. Küçült / Büyüt
      const toggleMinimize = () => {
        this.isMinimized = !this.isMinimized;
        this.widgetElem.classList.toggle('minimized', this.isMinimized);
      };

      this.shadow.getElementById('btnMinimize').addEventListener('click', toggleMinimize);
      this.shadow.getElementById('brandBtn').addEventListener('click', () => {
        if (this.isMinimized) toggleMinimize();
      });
    }

    updateAndSync(partialConfig) {
      this.config = { ...this.config, ...partialConfig };

      window.postMessage({
        source: 'ISOLATOR_CONTENT_SCRIPT',
        type: 'UPDATE_CONFIG',
        config: this.config
      }, '*');

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ isolatorConfig: this.config });
      }

      this.refreshUI();
    }

    refreshUI() {
      const btnBlur = this.shadow.getElementById('btnBlur');
      const btnVirtual = this.shadow.getElementById('btnVirtual');
      const btnDenoise = this.shadow.getElementById('btnDenoise');

      if (btnBlur) {
        btnBlur.classList.toggle('active', this.config.videoMode === 'blur');
        const span = btnBlur.querySelector('span');
        if (span) {
          span.textContent = this.config.videoMode === 'blur' ? `Blur ${this.config.blurLevel || 15}px` : (this.config.videoMode === 'virtual' ? 'Sanal' : 'Orijinal');
        }
      }

      if (btnVirtual) {
        btnVirtual.classList.toggle('active', this.config.videoMode === 'virtual');
      }

      if (btnDenoise) {
        btnDenoise.classList.toggle('active', this.config.teacherMode && this.config.noiseSuppression);
        const span = btnDenoise.querySelector('span');
        if (span) {
          span.textContent = this.config.teacherMode ? 'Studio' : 'Ham Ses';
        }
      }
    }

    unmount() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      if (this.alertTimeout) clearTimeout(this.alertTimeout);
      if (this.host && this.host.parentNode) {
        this.host.parentNode.removeChild(this.host);
      }
      this.host = null;
      this.shadow = null;
    }

    listenAudioMeterAndAlerts() {
      const bars = [
        this.shadow.getElementById('vb1'),
        this.shadow.getElementById('vb2'),
        this.shadow.getElementById('vb3'),
        this.shadow.getElementById('vb4')
      ];

      window.addEventListener('message', (event) => {
        if (!event.data) return;

        // Custom Alert Messages from page
        if (event.data.source === 'ISOLATOR_ALERT' && this.config.smartAlertsEnabled !== false) {
          this.showAlert(event.data.message || 'Durum uyarısı', event.data.icon || '⚠️');
        }

        // Audio Meter Levels
        if (event.data.source === 'ISOLATOR_AUDIO_METER') {
          const level = event.data.level || 0;
          if (level > 0.05) {
            this.lastAudioTime = Date.now();
          }

          const heights = [
            Math.min(14, Math.max(3, level * 20)),
            Math.min(14, Math.max(3, (level - 0.2) * 22)),
            Math.min(14, Math.max(3, (level - 0.5) * 25)),
            Math.min(14, Math.max(3, (level - 0.75) * 30))
          ];

          bars.forEach((bar, idx) => {
            if (bar) {
              bar.style.height = `${heights[idx]}px`;
              if (heights[idx] > 3) {
                if (idx < 2) bar.className = 'vu-bar active-green';
                else if (idx === 2) bar.className = 'vu-bar active-yellow';
                else bar.className = 'vu-bar active-red';
              } else {
                bar.className = 'vu-bar';
              }
            }
          });
        }
      });
    }
  };
})();
