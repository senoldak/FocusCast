/**
 * isolaTOR Ghost Teleprompter (v2.3)
 * Sayfa üzerinde yarı saydam, sürüklenebilir ve ayarlanabilir hızda konuşma metni kaydırıcı.
 */

(function () {
  window.__IsolatorTeleprompter = class IsolatorTeleprompter {
    constructor(config = {}) {
      this.config = config;
      this.host = null;
      this.shadow = null;
      this.container = null;
      this.isScrolling = false;
      this.scrollInterval = null;
      this.speed = 1.2; // px per tick
    }

    mount() {
      if (document.getElementById('isolator-teleprompter-host')) return;

      this.host = document.createElement('div');
      this.host.id = 'isolator-teleprompter-host';
      document.documentElement.appendChild(this.host);

      this.shadow = this.host.attachShadow({ mode: 'open' });

      const linkElem = document.createElement('link');
      linkElem.setAttribute('rel', 'stylesheet');
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        linkElem.setAttribute('href', chrome.runtime.getURL('src/content/teleprompter.css'));
      }
      this.shadow.appendChild(linkElem);

      this.render();
      this.attachEvents();
    }

    render() {
      const text = this.config.teleprompterText || 'Toplantı notlarınızı buraya ekleyin... isolaTOR Teleprompter ile kameradan gözünüzü ayırmadan akıcı konuşun.';
      const fontSize = this.config.teleprompterFontSize || 16;
      const speed = this.config.teleprompterSpeed || 2;

      this.container = document.createElement('div');
      this.container.className = 'teleprompter-box';
      this.container.innerHTML = `
        <div class="tp-header">
          <div class="tp-title">
            <span class="tp-dot"></span>
            <span>Teleprompter Studio</span>
          </div>
          <div class="tp-actions">
            <button class="tp-btn" id="tpFontDec" title="Yazı Küçült">A-</button>
            <button class="tp-btn" id="tpFontInc" title="Yazı Büyüt">A+</button>
            <button class="tp-btn" id="tpSpeedBtn" title="Hız Değiştir">${speed}x</button>
            <button class="tp-btn" id="tpPlayBtn" title="Başlat / Duraklat">▶</button>
            <button class="tp-btn" id="tpResetBtn" title="Başa Sar">↺</button>
            <button class="tp-btn" id="tpCloseBtn" title="Kapat">✕</button>
          </div>
        </div>
        <div class="tp-content" id="tpContent">
          <p id="tpText" style="font-size: ${fontSize}px;">${text}</p>
        </div>
      `;
      this.shadow.appendChild(this.container);
    }

    attachEvents() {
      const playBtn = this.shadow.getElementById('tpPlayBtn');
      const resetBtn = this.shadow.getElementById('tpResetBtn');
      const closeBtn = this.shadow.getElementById('tpCloseBtn');
      const fontIncBtn = this.shadow.getElementById('tpFontInc');
      const fontDecBtn = this.shadow.getElementById('tpFontDec');
      const speedBtn = this.shadow.getElementById('tpSpeedBtn');
      const content = this.shadow.getElementById('tpContent');
      const textElem = this.shadow.getElementById('tpText');

      let currentFontSize = this.config.teleprompterFontSize || 16;
      let currentSpeed = this.config.teleprompterSpeed || 2;
      let scrollAnimId = null;

      const stepScroll = () => {
        if (!this.isScrolling) return;
        content.scrollTop += currentSpeed * 0.8;
        if (content.scrollTop < content.scrollHeight - content.clientHeight) {
          scrollAnimId = requestAnimationFrame(stepScroll);
        } else {
          this.isScrolling = false;
          playBtn.textContent = '▶';
        }
      };

      playBtn.addEventListener('click', () => {
        this.isScrolling = !this.isScrolling;
        playBtn.textContent = this.isScrolling ? '⏸' : '▶';
        if (this.isScrolling) {
          scrollAnimId = requestAnimationFrame(stepScroll);
        } else if (scrollAnimId) {
          cancelAnimationFrame(scrollAnimId);
        }
      });

      fontIncBtn.addEventListener('click', () => {
        currentFontSize = Math.min(28, currentFontSize + 2);
        if (textElem) textElem.style.fontSize = `${currentFontSize}px`;
      });

      fontDecBtn.addEventListener('click', () => {
        currentFontSize = Math.max(12, currentFontSize - 2);
        if (textElem) textElem.style.fontSize = `${currentFontSize}px`;
      });

      speedBtn.addEventListener('click', () => {
        currentSpeed = (currentSpeed % 5) + 1;
        speedBtn.textContent = `${currentSpeed}x`;
      });

      resetBtn.addEventListener('click', () => {
        content.scrollTop = 0;
      });

      closeBtn.addEventListener('click', () => {
        this.destroy();
      });

      // Draggable Header
      const header = this.shadow.querySelector('.tp-header');
      let isDragging = false, offset = { x: 0, y: 0 };

      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.tp-btn')) return;
        isDragging = true;
        const rect = this.container.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        this.container.style.left = `${Math.max(10, e.clientX - offset.x)}px`;
        this.container.style.top = `${Math.max(10, e.clientY - offset.y)}px`;
        this.container.style.right = 'auto';
        this.container.style.transform = 'none';
      });

      window.addEventListener('mouseup', () => { isDragging = false; });
    }

    destroy() {
      if (this.scrollInterval) clearInterval(this.scrollInterval);
      if (this.host) this.host.remove();
    }
  };
})();
