/**
 * isolaTOR Interceptor
 * Sayfa düzeyinde WebRTC navigator.mediaDevices.getUserMedia kancası ve akış köprüsü.
 */

(function () {
  if (window.__ISOLATOR_INTERCEPTOR_ACTIVE__) return;
  window.__ISOLATOR_INTERCEPTOR_ACTIVE__ = true;

  console.log('%c[isolaTOR]%c WebRTC Interceptor & Akış Köprüsü Devrede!', 'background: #0284c7; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;', 'color: #38bdf8; font-weight: bold;');

  let currentConfig = {
    videoEnabled: true,
    videoMode: 'blur',
    blurLevel: 15,
    selectedBackground: 'classroom',
    customBackgroundImage: null,
    solidColor: '#107c41',
    smoothEdges: true,

    audioEnabled: true,
    teacherMode: true,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    noiseGateThreshold: -48,
    voiceBoost: true,
    micGain: 1.0,

    floatingWidgetEnabled: false
  };

  const activeVideoProcessors = new Set();
  const activeAudioProcessors = new Set();

  const originalMediaDevices = navigator.mediaDevices;
  const originalGetUserMedia = originalMediaDevices ? originalMediaDevices.getUserMedia.bind(originalMediaDevices) : null;
  const legacyGetUserMedia = navigator.getUserMedia ? navigator.getUserMedia.bind(navigator) : null;

  async function processStream(rawStream, constraints) {
    const processedTracks = [];

    // 1. Video İzolasyonu
    const videoTracks = rawStream.getVideoTracks();
    if (videoTracks.length > 0 && window.__IsolatorVideoProcessor && currentConfig.videoEnabled) {
      // Her zaman processor oluştur — videoMode 'original' bile olsa processor gerekir çünkü
      // kullanıcı sonradan mode değiştirebilir ve processor.updateConfig ile güncellenmesi gerekir.
      for (const track of videoTracks) {
        try {
          const processor = new window.__IsolatorVideoProcessor(track, currentConfig);
          const virtualTrack = await processor.init();
          activeVideoProcessors.add(processor);

          track.addEventListener('ended', () => {
            processor.destroy();
            activeVideoProcessors.delete(processor);
          });

          processedTracks.push(virtualTrack);
        } catch (err) {
          console.error('[isolaTOR Interceptor] Video processor fallback:', err);
          processedTracks.push(track);
        }
      }
    } else {
      videoTracks.forEach(t => processedTracks.push(t));
    }

    // 2. Ses İzolasyonu ("Öğretmen Modu")
    const audioTracks = rawStream.getAudioTracks();
    if (audioTracks.length > 0 && window.__IsolatorAudioProcessor && currentConfig.audioEnabled && currentConfig.teacherMode) {
      for (const track of audioTracks) {
        try {
          const processor = new window.__IsolatorAudioProcessor(track, currentConfig);
          const virtualTrack = await processor.init();
          activeAudioProcessors.add(processor);

          track.addEventListener('ended', () => {
            processor.destroy();
            activeAudioProcessors.delete(processor);
          });

          processedTracks.push(virtualTrack);
        } catch (err) {
          console.error('[isolaTOR Interceptor] Audio processor fallback:', err);
          processedTracks.push(track);
        }
      }
    } else {
      audioTracks.forEach(t => processedTracks.push(t));
    }

    const virtualStream = new MediaStream(processedTracks);

    window.postMessage({
      source: 'ISOLATOR_STREAM_ACTIVE',
      hasVideo: videoTracks.length > 0,
      hasAudio: audioTracks.length > 0
    }, '*');

    return virtualStream;
  }

  // Hooking navigator.mediaDevices.getUserMedia
  if (originalMediaDevices && originalGetUserMedia) {
    navigator.mediaDevices.getUserMedia = async function (constraints) {
      if (!constraints) {
        return originalGetUserMedia(constraints);
      }

      const rawStream = await originalGetUserMedia(constraints);
      return processStream(rawStream, constraints);
    };
  }

  if (navigator.getUserMedia) {
    navigator.getUserMedia = function (constraints, successCallback, errorCallback) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
          .then(successCallback)
          .catch(errorCallback);
      } else if (legacyGetUserMedia) {
        legacyGetUserMedia(constraints, successCallback, errorCallback);
      }
    };
  }

  window.addEventListener('message', (event) => {
    if (!event.data || event.data.source !== 'ISOLATOR_CONTENT_SCRIPT') return;

    if (event.data.type === 'UPDATE_CONFIG') {
      if (event.data.config) {
        currentConfig = { ...currentConfig, ...event.data.config };
      }

      activeVideoProcessors.forEach(proc => {
        if (proc && typeof proc.updateConfig === 'function') {
          if (event.data.config) proc.updateConfig(currentConfig);
          if (event.data.laserPos) proc.laserPos = event.data.laserPos;
        }
      });

      activeAudioProcessors.forEach(proc => {
        if (proc && typeof proc.updateConfig === 'function' && event.data.config) {
          proc.updateConfig(currentConfig);
        }
      });
    } else if (event.data.type === 'SPAWN_REACTION') {
      activeVideoProcessors.forEach(proc => {
        if (proc && typeof proc.spawnReaction === 'function') {
          proc.spawnReaction(event.data.emoji);
        }
      });
    } else if (event.data.type === 'TRIGGER_SOUNDBOARD') {
      activeAudioProcessors.forEach(proc => {
        if (proc && typeof proc.triggerSoundEffect === 'function') {
          proc.triggerSoundEffect(event.data.sound, event.data.customDataUrl);
        }
      });
    } else if (event.data.type === 'START_SCREEN_SHARE') {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then(screenStream => {
        activeVideoProcessors.forEach(proc => {
          if (proc && typeof proc.setScreenStream === 'function') {
            proc.setScreenStream(screenStream);
          }
        });
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          activeVideoProcessors.forEach(proc => {
            if (proc && typeof proc.setScreenStream === 'function') {
              proc.setScreenStream(null);
            }
          });
          window.postMessage({ source: 'ISOLATOR_INTERCEPTOR', type: 'SCREEN_SHARE_ENDED' }, '*');
        });
        window.postMessage({ source: 'ISOLATOR_INTERCEPTOR', type: 'SCREEN_SHARE_STARTED' }, '*');
      }).catch(err => {
        console.warn('[isolaTOR Interceptor] Screen share cancelled or failed:', err);
      });
    } else if (event.data.type === 'STOP_SCREEN_SHARE') {
      activeVideoProcessors.forEach(proc => {
        if (proc && typeof proc.setScreenStream === 'function') {
          proc.setScreenStream(null);
        }
      });
    }
  });

  window.postMessage({ source: 'ISOLATOR_INTERCEPTOR_READY' }, '*');
})();
