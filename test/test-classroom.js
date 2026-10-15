/**
 * isolaTOR Test Classroom Logic
 * WebRTC akışını çağırarak eklentinin kancalamasını ve filtrelerini doğrular.
 */

document.addEventListener('DOMContentLoaded', () => {
  const videoElem = document.getElementById('classroomVideo');
  const btnStartClass = document.getElementById('btnStartClass');
  const btnStopClass = document.getElementById('btnStopClass');

  const streamTag = document.getElementById('streamTag');
  const fpsTag = document.getElementById('fpsTag');
  const resTag = document.getElementById('resTag');
  const webrtcStatus = document.getElementById('webrtcStatus');

  const valVideoTrack = document.getElementById('valVideoTrack');
  const valAudioTrack = document.getElementById('valAudioTrack');
  const valIsolation = document.getElementById('valIsolation');
  const logBox = document.getElementById('logBox');

  const visualizerCanvas = document.getElementById('audioVisualizer');
  const visCtx = visualizerCanvas.getContext('2d');

  let currentStream = null;
  let audioCtx = null;
  let analyser = null;
  let frameCount = 0;
  let lastTime = performance.now();

  function log(msg, type = 'info') {
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    const time = new Date().toLocaleTimeString();
    item.textContent = `[${time}] ${msg}`;
    logBox.appendChild(item);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // Interceptor Bildirimlerini Dinle
  window.addEventListener('message', (event) => {
    if (event.data?.source === 'ISOLATOR_INTERCEPTOR_READY') {
      log('isolaTOR WebRTC Interceptor aktif olarak algılandı!', 'success');
      webrtcStatus.textContent = 'isolaTOR Koruma Altında';
      valIsolation.textContent = 'Koruma Aktif';
    }
    if (event.data?.source === 'ISOLATOR_STREAM_ACTIVE') {
      log('Sanal MediaStream başarıyla teslim edildi.', 'success');
    }
  });

  async function startClass() {
    log('WebRTC getUserMedia çağrısı yapılıyor...', 'system');

    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      videoElem.srcObject = currentStream;
      streamTag.textContent = '🟢 Canlı Ders Yayında';
      streamTag.style.background = 'rgba(34, 197, 94, 0.2)';
      streamTag.style.borderColor = 'rgba(34, 197, 94, 0.6)';

      const vTracks = currentStream.getVideoTracks();
      const aTracks = currentStream.getAudioTracks();

      valVideoTrack.textContent = vTracks.length > 0 ? (vTracks[0].label.includes('isolaTOR') ? 'Sanal (Filtreli)' : 'Donanım') : 'Yok';
      valAudioTrack.textContent = aTracks.length > 0 ? (aTracks[0].label.includes('isolaTOR') ? 'Sanal (AI Denoise)' : 'Donanım') : 'Yok';

      log(`Kamera açıldı: ${vTracks[0]?.label || 'Bilinmiyor'}`, 'success');
      log(`Mikrofon açıldı: ${aTracks[0]?.label || 'Bilinmiyor'}`, 'success');

      startMetrics();
      startAudioVisualizer(currentStream);
    } catch (err) {
      log(`Hata: ${err.message}`, 'warn');
      console.error(err);
    }
  }

  function stopClass() {
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop());
      currentStream = null;
      videoElem.srcObject = null;
      streamTag.textContent = '🔴 Yayın Durduruldu';
      valVideoTrack.textContent = 'Kapalı';
      valAudioTrack.textContent = 'Kapalı';
      log('Ders sonlandırıldı, akışlar serbest bırakıldı.', 'system');
    }
  }

  function startMetrics() {
    videoElem.onloadedmetadata = () => {
      resTag.textContent = `${videoElem.videoWidth}x${videoElem.videoHeight}`;
    };

    function updateFPS() {
      if (currentStream && !videoElem.paused) {
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (now - lastTime));
          fpsTag.textContent = `${fps} FPS`;
          frameCount = 0;
          lastTime = now;
        }
      }
      requestAnimationFrame(updateFPS);
    }
    requestAnimationFrame(updateFPS);
  }

  function startAudioVisualizer(stream) {
    if (stream.getAudioTracks().length === 0) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      visualizerCanvas.width = visualizerCanvas.offsetWidth || 300;
      visualizerCanvas.height = visualizerCanvas.offsetHeight || 80;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function draw() {
        if (!currentStream) return;
        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);
        visCtx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        visCtx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        const barWidth = (visualizerCanvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * visualizerCanvas.height;

          const grad = visCtx.createLinearGradient(0, visualizerCanvas.height, 0, 0);
          grad.addColorStop(0, '#0284c7');
          grad.addColorStop(1, '#38bdf8');

          visCtx.fillStyle = grad;
          visCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);

          x += barWidth + 2;
        }
      }
      draw();
    } catch (e) {
      console.warn('Audio visualizer error:', e);
    }
  }

  btnStartClass.addEventListener('click', startClass);
  btnStopClass.addEventListener('click', stopClass);
});
