/**
 * isolaTOR Audio Worklet Processor
 * Gerçek zamanlı AI gürültü engelleme, noise gate ve ses analizi worklet'i.
 */

class IsolatorAudioWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.noiseGateThreshold = -48; // dB
    this.gateEnvelope = 0.0;
    this.attackTime = 0.005; // 5ms hızlı açılış
    this.releaseTime = 0.080; // 80ms yumuşak kapanış
    this.teacherMode = true;
    this.noiseSuppression = true;
    this.voiceBoost = true;
    this.micGain = 1.0;

    // Noise estimation buffer
    this.noiseFloor = 0.01;
    this.sampleCount = 0;

    this.port.onmessage = (event) => {
      if (event.data && event.data.type === 'UPDATE_CONFIG') {
        const cfg = event.data.config;
        if (cfg.noiseGateThreshold !== undefined) this.noiseGateThreshold = cfg.noiseGateThreshold;
        if (cfg.teacherMode !== undefined) this.teacherMode = cfg.teacherMode;
        if (cfg.noiseSuppression !== undefined) this.noiseSuppression = cfg.noiseSuppression;
        if (cfg.voiceBoost !== undefined) this.voiceBoost = cfg.voiceBoost;
        if (cfg.micGain !== undefined) this.micGain = cfg.micGain;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0 || !input[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const bufferLength = inputChannel.length;

    // 1. RMS Hesaplama & Noise Gate Eşiği
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = inputChannel[i];
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const db = rms > 0.00001 ? 20 * Math.log10(rms) : -100;

    // 2. Dinamik Noise Floor Güncelleme (Adaptif Gürültü Eşiği)
    if (this.noiseSuppression) {
      if (rms < this.noiseFloor * 1.5) {
        this.noiseFloor = this.noiseFloor * 0.99 + rms * 0.01;
      } else {
        this.noiseFloor = this.noiseFloor * 0.999 + rms * 0.001;
      }
    }

    // 3. Noise Gate Mantığı
    const thresholdLinear = Math.pow(10, this.noiseGateThreshold / 20);
    const isAboveGate = rms > (thresholdLinear + (this.noiseSuppression ? this.noiseFloor * 0.5 : 0));

    const targetGain = isAboveGate ? 1.0 : (this.teacherMode ? 0.0 : 0.1);
    const alpha = isAboveGate ? 0.4 : 0.05; // Attack vs Release hızları
    this.gateEnvelope = this.gateEnvelope * (1 - alpha) + targetGain * alpha;

    // 4. Numuneleri İşleme (Denoise + Gate + Gain)
    for (let i = 0; i < bufferLength; i++) {
      let sample = inputChannel[i];

      if (this.teacherMode && this.noiseSuppression) {
        // Yumuşak gürültü kesme (Subtractive filter)
        const sign = Math.sign(sample);
        const absVal = Math.abs(sample);
        const cleaned = Math.max(0, absVal - (this.noiseFloor * 0.6));
        sample = sign * cleaned;
      }

      // Gate zarfı ve Gain uygula
      sample = sample * this.gateEnvelope * this.micGain;

      // Kırpmayı (Clipping) önleyici Soft-Knee Limiter
      if (sample > 0.95) sample = 0.95 + (sample - 0.95) * 0.1;
      if (sample < -0.95) sample = -0.95 + (sample + 0.95) * 0.1;

      outputChannel[i] = sample;
    }

    // İkinci stereo kanal varsa kopyala
    if (output.length > 1 && output[1]) {
      output[1].set(outputChannel);
    }

    // 5. Belirli aralıklarla VU-Meter bilgisini UI'a postala (her 8 blokta bir)
    this.sampleCount++;
    if (this.sampleCount % 8 === 0) {
      this.port.postMessage({
        type: 'VU_LEVEL',
        level: Math.min(1.0, rms * 4 * this.gateEnvelope),
        db: db,
        isGated: this.gateEnvelope < 0.1
      });
    }

    return true;
  }
}

registerProcessor('isolator-audio-worklet-processor', IsolatorAudioWorkletProcessor);
