/**
 * isolaTOR Audio Processor
 * Web Audio API, AudioWorklet, Gürültü Engelleme, Akustik Yankı & Öğretmen Modu EQ zinciri.
 */

(function () {
  window.__IsolatorAudioProcessor = class IsolatorAudioProcessor {
    constructor(rawAudioTrack, config = {}) {
      this.rawTrack = rawAudioTrack;
      this.config = {
        audioEnabled: true,
        teacherMode: true,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        noiseGateThreshold: -48,
        voiceBoost: true,
        micGain: 1.0,
        ...config
      };

      this.audioCtx = null;
      this.sourceNode = null;
      this.highPassFilter = null;
      this.voiceBoostFilter = null;
      this.workletNode = null;
      this.compressor = null;
      this.destinationNode = null;

      this.processedTrack = null;
      this.isInitialized = false;
    }

    async init() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass({ latencyHint: 'interactive' });

        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }

        const rawStream = new MediaStream([this.rawTrack]);
        this.sourceNode = this.audioCtx.createMediaStreamSource(rawStream);

        // 1. High-Pass Filter (80Hz altı fan, titreşim ve klima gürültülerini temizler)
        this.highPassFilter = this.audioCtx.createBiquadFilter();
        this.highPassFilter.type = 'highpass';
        this.highPassFilter.frequency.value = 85;
        this.highPassFilter.Q.value = 0.7;

        // 2. Voice Boost Peaking EQ (3.2 kHz netlik ve anlaşılırlık artışı)
        this.voiceBoostFilter = this.audioCtx.createBiquadFilter();
        this.voiceBoostFilter.type = 'peaking';
        this.voiceBoostFilter.frequency.value = 3200;
        this.voiceBoostFilter.Q.value = 1.2;
        this.voiceBoostFilter.gain.value = this.config.voiceBoost ? 4.5 : 0;

        // 3. De-Esser Notch Filter (Sert 'S', 'Ş' patlamalarını 6.2 kHz'de törpüler)
        this.deEsserFilter = this.audioCtx.createBiquadFilter();
        this.deEsserFilter.type = 'peaking';
        this.deEsserFilter.frequency.value = 6200;
        this.deEsserFilter.Q.value = 2.2;
        this.deEsserFilter.gain.value = this.config.deEsser ? -5.5 : 0;

        // 4. Bass Warmth (Düşük frekans gövdesi)
        this.bassFilter = this.audioCtx.createBiquadFilter();
        this.bassFilter.type = 'lowshelf';
        this.bassFilter.frequency.value = 220;
        this.bassFilter.gain.value = this.config.bassBoost || 0;

        // 5. Treble Clarity (Hava & parlaklık)
        this.trebleFilter = this.audioCtx.createBiquadFilter();
        this.trebleFilter.type = 'highshelf';
        this.trebleFilter.frequency.value = 8000;
        this.trebleFilter.gain.value = this.config.trebleBoost || 0;

        // 6. Dynamics Compressor (Ses seviyesini dengeler, ani bağırmaları yumuşatır)
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 12;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.15;

        // 7. Hedef Sanal Ses Akışı
        this.destinationNode = this.audioCtx.createMediaStreamDestination();

        // 5. AudioWorklet Yükleme
        await this.setupWorklet();

        // 6. Düğüm Bağlantılarını Kurma
        this.buildAudioGraph();

        this.processedTrack = this.destinationNode.stream.getAudioTracks()[0];
        if (this.processedTrack && this.rawTrack) {
          Object.defineProperty(this.processedTrack, 'label', {
            value: `isolaTOR [Virtual] - ${this.rawTrack.label}`,
            writable: false
          });
        }

        this.isInitialized = true;
        return this.processedTrack;
      } catch (err) {
        console.error('[isolaTOR Audio] Init error:', err);
        return this.rawTrack; // Hata durumunda güvenli fallback
      }
    }

    async setupWorklet() {
      try {
        let workletUrl = '';
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          workletUrl = chrome.runtime.getURL('src/injected/audio-worklet-processor.js');
        }

        if (workletUrl && this.audioCtx.audioWorklet) {
          await this.audioCtx.audioWorklet.addModule(workletUrl);
          this.workletNode = new AudioWorkletNode(this.audioCtx, 'isolator-audio-worklet-processor');
          
          this.workletNode.port.onmessage = (event) => {
            if (event.data && event.data.type === 'VU_LEVEL') {
              window.postMessage({
                source: 'ISOLATOR_AUDIO_METER',
                ...event.data
              }, '*');

              // Smart Alert: Yüksek gürültü / kırılma uyarısı
              if (event.data.level > 0.95) {
                if (!this._lastPeakAlert || Date.now() - this._lastPeakAlert > 10000) {
                  this._lastPeakAlert = Date.now();
                  window.postMessage({
                    source: 'ISOLATOR_ALERT',
                    message: 'Yüksek Ses / Bozulma Uyarısı',
                    icon: '🔊'
                  }, '*');
                }
              }
            }
          };

          this.updateWorkletConfig();
        } else {
          this.createFallbackGainNode();
        }
      } catch (e) {
        console.warn('[isolaTOR Audio] AudioWorklet not loaded, using fallback gain graph:', e);
        this.createFallbackGainNode();
      }
    }

    createFallbackGainNode() {
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.config.micGain || 1.0;
    }

    buildAudioGraph() {
      if (!this.sourceNode) return;

      // Kaynak -> HighPass -> VoiceBoost -> DeEsser -> Bass -> Treble -> (Worklet/Gain) -> Compressor -> Dest
      this.sourceNode.connect(this.highPassFilter);
      this.highPassFilter.connect(this.voiceBoostFilter);
      this.voiceBoostFilter.connect(this.deEsserFilter);
      this.deEsserFilter.connect(this.bassFilter);
      this.bassFilter.connect(this.trebleFilter);

      const processingNode = this.workletNode || this.gainNode;
      if (processingNode) {
        this.trebleFilter.connect(processingNode);
        processingNode.connect(this.compressor);
      } else {
        this.trebleFilter.connect(this.compressor);
      }

      // Master Mute & Push-to-Talk Gain Node
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.config.isMuted ? 0 : (this.config.micGain || 1.0);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.destinationNode);
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };

      if (this.voiceBoostFilter) {
        this.voiceBoostFilter.gain.value = this.config.voiceBoost ? 4.5 : 0;
      }

      if (this.deEsserFilter) {
        this.deEsserFilter.gain.value = this.config.deEsser ? -5.5 : 0;
      }

      // Voice Character Presets
      const char = this.config.voiceCharacter || 'natural';
      let bassOffset = 0, trebleOffset = 0;
      if (char === 'radio') {
        bassOffset = 4.5;
        trebleOffset = 1.0;
      } else if (char === 'crisp') {
        bassOffset = -1.0;
        trebleOffset = 5.0;
      } else if (char === 'privacy') {
        bassOffset = -3.0;
        trebleOffset = -4.0;
      }

      if (this.bassFilter) {
        this.bassFilter.gain.value = (this.config.bassBoost || 0) + bassOffset;
      }

      if (this.trebleFilter) {
        this.trebleFilter.gain.value = (this.config.trebleBoost || 0) + trebleOffset;
      }

      if (this.masterGain) {
        const targetGain = this.config.isMuted ? 0 : (this.config.micGain || 1.0);
        this.masterGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.02);
      }

      // Voice Shield (Multi-Speaker Isolation)
      if (this.config.voiceShieldEnabled) {
        if (this.highPassFilter) this.highPassFilter.frequency.value = 240;
        if (this.voiceBoostFilter) {
          this.voiceBoostFilter.frequency.value = 2800;
          this.voiceBoostFilter.Q.value = 3.5;
        }
      } else {
        if (this.highPassFilter) this.highPassFilter.frequency.value = 85;
        if (this.voiceBoostFilter) {
          this.voiceBoostFilter.frequency.value = 3200;
          this.voiceBoostFilter.Q.value = 1.8;
        }
      }

      if (this.workletNode) {
        this.updateWorkletConfig();
      } else if (this.gainNode && this.config.micGain !== undefined) {
        this.gainNode.gain.value = this.config.micGain;
      }
    }

    triggerSoundEffect(type) {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      const now = this.audioCtx.currentTime;

      if (type === 'ding' || type === 'bell') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(this.destinationNode);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === 'success' || type === 'chime') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.25, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
          osc.connect(gain);
          gain.connect(this.destinationNode);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.5);
        });
      } else if (type === 'applause' || type === 'clap') {
        // Procedural Applause (Filtered Noise Bursts)
        for (let i = 0; i < 18; i++) {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300 + Math.random() * 800, now + i * 0.04);
          gain.gain.setValueAtTime(0.18, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.09);
          osc.connect(gain);
          gain.connect(this.destinationNode);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.09);
        }
      } else if (type === 'drum' || type === 'drumroll') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.destinationNode);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    }

    updateWorkletConfig() {
      if (this.workletNode && this.workletNode.port) {
        this.workletNode.port.postMessage({
          type: 'UPDATE_CONFIG',
          config: {
            noiseGateThreshold: this.config.noiseGateThreshold,
            teacherMode: this.config.teacherMode,
            noiseSuppression: this.config.noiseSuppression,
            voiceBoost: this.config.voiceBoost,
            micGain: this.config.micGain
          }
        });
      }
    }

    destroy() {
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(console.warn);
      }
      if (this.processedTrack) {
        this.processedTrack.stop();
      }
    }
  };
})();
