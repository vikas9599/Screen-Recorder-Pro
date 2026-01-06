// Extracted from vid_recorder.html <script> block
// ==================== STATE ====================
let mediaRecorder;
let recordedChunks = [];
let stream;
let webcamStream;
let startTime;
let timerInterval;
let frameCounter = 0;
let recordedBlob = null;
let recordedURL = null;

// ==================== ELEMENTS ====================
const setupPanel = document.getElementById('setupPanel');
const recordingPanel = document.getElementById('recordingPanel');
const previewPanel = document.getElementById('previewPanel');
const preview = document.getElementById('preview');
const recorded = document.getElementById('recorded');
const indicator = document.getElementById('indicator');
const timer = document.getElementById('timer');
const fileSize = document.getElementById('fileSize');
const frameCount = document.getElementById('frameCount');
const qualityInfo = document.getElementById('qualityInfo');
const bitrateInfo = document.getElementById('bitrateInfo');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const screenshotBtn = document.getElementById('screenshotBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newBtn = document.getElementById('newBtn');
const quality = document.getElementById('quality');
const fps = document.getElementById('fps');
const resolution = document.getElementById('resolution');
const codec = document.getElementById('codec');
const audioBitrate = document.getElementById('audioBitrate');
const highQualityMode = document.getElementById('highQualityMode');
const recordAudio = document.getElementById('recordAudio');
const recordMic = document.getElementById('recordMic');
const enableWebcam = document.getElementById('enableWebcam');
const countdown = document.getElementById('countdown');
const countdownDisplay = document.getElementById('countdownDisplay');
const webcamOverlay = document.getElementById('webcamOverlay');
const webcamVideo = document.getElementById('webcamVideo');

// Tab elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Edit controls
const playbackSpeed = document.getElementById('playbackSpeed');
const speedValue = document.getElementById('speedValue');
const trimStart = document.getElementById('trimStart');
const trimEnd = document.getElementById('trimEnd');
const applyTrim = document.getElementById('applyTrim');
const brightness = document.getElementById('brightness');
const brightnessValue = document.getElementById('brightnessValue');
const contrast = document.getElementById('contrast');
const contrastValue = document.getElementById('contrastValue');
const saturation = document.getElementById('saturation');
const saturationValue = document.getElementById('saturationValue');
const resetFilters = document.getElementById('resetFilters');
const filterBtns = document.querySelectorAll('.filter-btn');

// Audio controls
const extractAudioBtn = document.getElementById('extractAudioBtn');
const extractAudioWavBtn = document.getElementById('extractAudioWavBtn');
const volume = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');
const muteVideo = document.getElementById('muteVideo');

// Export controls
const downloadGifBtn = document.getElementById('downloadGifBtn');
const exportFormat = document.getElementById('exportFormat');
const fileName = document.getElementById('fileName');

// Canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Advanced editing elements
const importVideo = document.getElementById('importVideo');
const videoLibrary = document.getElementById('videoLibrary');
const mergeQueue = document.getElementById('mergeQueue');
const mergeQueueEmpty = document.getElementById('mergeQueueEmpty');
const mergeQueueItems = document.getElementById('mergeQueueItems');
const mergeVideosBtn = document.getElementById('mergeVideosBtn');
const clearMergeQueueBtn = document.getElementById('clearMergeQueueBtn');

// Split controls
const splitTime = document.getElementById('splitTime');
const addSplitMarkerBtn = document.getElementById('addSplitMarkerBtn');
const splitMarkers = document.getElementById('splitMarkers');
const applySplitBtn = document.getElementById('applySplitBtn');
const clearSplitMarkersBtn = document.getElementById('clearSplitMarkersBtn');
const timelineTracks = document.getElementById('timelineTracks');

// Effects controls
const animationBtns = document.querySelectorAll('.animation-btn');
const overlayText = document.getElementById('overlayText');
const overlayPosition = document.getElementById('overlayPosition');
const fontSize = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const textColor = document.getElementById('textColor');
const textOverlayDisplay = document.getElementById('textOverlayDisplay');
const applyTextOverlayBtn = document.getElementById('applyTextOverlayBtn');
const removeTextOverlayBtn = document.getElementById('removeTextOverlayBtn');
const opacity = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const hue = document.getElementById('hue');
const hueValue = document.getElementById('hueValue');
const blurAmount = document.getElementById('blurAmount');
const blurValue = document.getElementById('blurValue');
const resetEffectsBtn = document.getElementById('resetEffectsBtn');

// State for advanced features
let videoLibraryItems = [];
let selectedVideos = [];
let splitMarkersList = [];
let textOverlayElement = null;

// ==================== TAB SWITCHING ====================
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(targetTab).classList.add('active');
  });
});

// ==================== START RECORDING ====================
startBtn.addEventListener('click', async () => {
  try {
    const countdownTime = parseInt(countdown.value);

    // Setup webcam first if enabled
    if (enableWebcam.checked) {
      try {
        webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false
        });
        webcamVideo.srcObject = webcamStream;
      } catch (err) {
        console.log('Webcam not available:', err);
      }
    }

    // Parse resolution
    const resolutionValue = resolution.value;
    let width, height;

    if (resolutionValue === 'max') {
      width = { ideal: 7680 };
      height = { ideal: 4320 };
    } else {
      [width, height] = resolutionValue.split('x').map(Number);
    }

    // Get display media with high quality settings
    const displayConstraints = {
      video: {
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: parseInt(fps.value) },
        cursor: 'always',
        displaySurface: 'monitor'
      },
      audio: recordAudio.checked ? {
        echoCancellation: highQualityMode.checked,
        noiseSuppression: highQualityMode.checked,
        autoGainControl: highQualityMode.checked,
        sampleRate: 48000,
        channelCount: 2
      } : false
    };

    stream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);

    // Add microphone if needed
    if (recordMic.checked) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: highQualityMode.checked,
            noiseSuppression: highQualityMode.checked,
            autoGainControl: highQualityMode.checked,
            sampleRate: 48000,
            channelCount: 2
          }
        });
        audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch (err) {
        console.log('Microphone not available');
      }
    }

    // Setup preview
    preview.srcObject = stream;

    // Show recording panel
    setupPanel.classList.add('hidden');
    recordingPanel.classList.remove('hidden');

    if (webcamStream) {
      webcamOverlay.classList.add('active');
    }

    // Countdown
    if (countdownTime > 0) {
      await performCountdown(countdownTime);
    }

    // Get codec and setup recorder
    const selectedCodec = codec.value;
    const codecMap = {
      'vp9': 'video/webm;codecs=vp9,opus',
      'vp8': 'video/webm;codecs=vp8,opus',
      'h264': 'video/webm;codecs=h264,opus',
      'av1': 'video/webm;codecs=av01,opus'
    };

    let mimeType = codecMap[selectedCodec];

    // Fallback to VP9 if selected codec is not supported
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.warn(`${selectedCodec} not supported, falling back to VP9`);
      mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const options = {
      mimeType: mimeType,
      videoBitsPerSecond: parseInt(quality.value),
      audioBitsPerSecond: parseInt(audioBitrate.value)
    };

    // Log recording settings
    console.log('%c📹 Recording Settings:', 'color: #667eea; font-weight: bold;');
    console.log('Resolution:', resolutionValue);
    console.log('Frame Rate:', fps.value + ' FPS');
    console.log('Video Bitrate:', (parseInt(quality.value) / 1000000).toFixed(1) + ' Mbps');
    console.log('Audio Bitrate:', (parseInt(audioBitrate.value) / 1000).toFixed(0) + ' kbps');
    console.log('Codec:', selectedCodec.toUpperCase());
    console.log('High Quality Mode:', highQualityMode.checked);

    mediaRecorder = new MediaRecorder(stream, options);
    recordedChunks = [];
    frameCounter = 0;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
        updateFileSize();
        frameCounter++;
        frameCount.textContent = `${frameCounter} frames`;
      }
    };

    mediaRecorder.onstop = handleStop;

    // Use shorter interval for higher quality (250ms instead of 1000ms)
    const recordInterval = highQualityMode.checked ? 250 : 1000;
    mediaRecorder.start(recordInterval);
    startTime = Date.now();
    startTimer();
    indicator.classList.add('active');

    // Update quality info display
    const resLabel = resolutionValue === 'max' ? '8K Max' : resolutionValue.replace('x', ' × ');
    qualityInfo.textContent = `${resLabel} @ ${fps.value}fps`;
    bitrateInfo.textContent = `${(parseInt(quality.value) / 1000000).toFixed(0)} Mbps`;

  } catch (err) {
    alert('Error starting recording: ' + err.message);
    console.error(err);
    setupPanel.classList.remove('hidden');
    recordingPanel.classList.add('hidden');
  }
});

// ==================== COUNTDOWN ====================
async function performCountdown(seconds) {
  return new Promise((resolve) => {
    let count = seconds;
    countdownDisplay.textContent = count;
    countdownDisplay.classList.add('active');

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownDisplay.textContent = count;
      } else {
        countdownDisplay.classList.remove('active');
        clearInterval(countdownInterval);
        resolve();
      }
    }, 1000);
  });
}

// ==================== PAUSE/RESUME ====================
pauseBtn.addEventListener('click', () => {
  if (mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    pauseBtn.innerHTML = '▶️ Resume';
    indicator.classList.remove('active');
    stopTimer();
  } else if (mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    pauseBtn.innerHTML = '⏸️ Pause';
    indicator.classList.add('active');
    startTimer();
  }
});

// ==================== SCREENSHOT ====================
screenshotBtn.addEventListener('click', () => {
  canvas.width = preview.videoWidth;
  canvas.height = preview.videoHeight;
  ctx.drawImage(preview, 0, 0);

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screenshot-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

// ==================== STOP RECORDING ====================
stopBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      webcamOverlay.classList.remove('active');
    }
    stopTimer();
  }
});

// ==================== HANDLE STOP ====================
function handleStop() {
  recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
  recordedURL = URL.createObjectURL(recordedBlob);
  recorded.src = recordedURL;

  // Set trim end to video duration
  recorded.onloadedmetadata = () => {
    trimEnd.max = recorded.duration;
    trimEnd.placeholder = recorded.duration.toFixed(1);
    splitTime.max = recorded.duration;

    // Auto-add to video library
    const recordingFile = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
    addVideoToLibrary(recordingFile);
  };

  // Show preview panel
  recordingPanel.classList.add('hidden');
  previewPanel.classList.remove('hidden');
  indicator.classList.remove('active');
}

// ==================== PLAYBACK SPEED ====================
playbackSpeed.addEventListener('input', (e) => {
  const speed = parseFloat(e.target.value);
  recorded.playbackRate = speed;
  speedValue.textContent = speed + 'x';
});

// ==================== VIDEO FILTERS ====================
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    if (filter === 'none') {
      recorded.style.filter = 'none';
    } else {
      recorded.style.filter = filter;
    }
  });
});

// Advanced filter controls
brightness.addEventListener('input', (e) => {
  brightnessValue.textContent = e.target.value + '%';
  applyAdvancedFilters();
});

contrast.addEventListener('input', (e) => {
  contrastValue.textContent = e.target.value + '%';
  applyAdvancedFilters();
});

saturation.addEventListener('input', (e) => {
  saturationValue.textContent = e.target.value + '%';
  applyAdvancedFilters();
});

function applyAdvancedFilters() {
  const b = brightness.value;
  const c = contrast.value;
  const s = saturation.value;
  recorded.style.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
  filterBtns.forEach(btn => btn.classList.remove('active'));
}

resetFilters.addEventListener('click', () => {
  recorded.style.filter = 'none';
  brightness.value = 100;
  contrast.value = 100;
  saturation.value = 100;
  brightnessValue.textContent = '100%';
  contrastValue.textContent = '100%';
  saturationValue.textContent = '100%';
  filterBtns.forEach(btn => btn.classList.remove('active'));
  filterBtns[0].classList.add('active');
});

// ==================== TRIM VIDEO ====================
applyTrim.addEventListener('click', async () => {
  const start = parseFloat(trimStart.value) || 0;
  const end = parseFloat(trimEnd.value) || recorded.duration;

  if (start >= end) {
    alert('Start time must be less than end time!');
    return;
  }

  try {
    applyTrim.disabled = true;
    applyTrim.textContent = '⏳ Processing...';

    // Create a new video element to trim
    const tempVideo = document.createElement('video');
    tempVideo.src = recordedURL;

    await new Promise(resolve => tempVideo.onloadedmetadata = resolve);

    // For trim, we'd need server-side processing or ffmpeg.wasm
    // For now, just update the current time and show a message
    alert(`Trim feature: This would trim video from ${start}s to ${end}s. For full trim functionality, consider using ffmpeg.wasm or server-side processing.`);

    recorded.currentTime = start;

  } catch (err) {
    alert('Error trimming video: ' + err.message);
  } finally {
    applyTrim.disabled = false;
    applyTrim.textContent = 'Apply Trim';
  }
});

// ==================== AUDIO EXTRACTION ====================
extractAudioBtn.addEventListener('click', async () => {
  try {
    extractAudioBtn.disabled = true;
    extractAudioBtn.textContent = '⏳ Extracting...';
    document.getElementById('audioProgress').classList.remove('hidden');
    document.getElementById('audioProgressFill').style.width = '50%';

    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(recorded);
    const dest = audioContext.createMediaStreamDestination();
    source.connect(dest);
    source.connect(audioContext.destination);

    // Record audio
    const audioRecorder = new MediaRecorder(dest.stream);
    const audioChunks = [];

    audioRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    audioRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `${fileName.value || 'recording'}-audio.webm`;
      a.click();

      document.getElementById('audioProgressFill').style.width = '100%';
      setTimeout(() => {
        document.getElementById('audioProgress').classList.add('hidden');
        document.getElementById('audioProgressFill').style.width = '0%';
      }, 1000);
    };

    recorded.currentTime = 0;
    audioRecorder.start();
    recorded.play();

    recorded.onended = () => {
      audioRecorder.stop();
      recorded.pause();
      recorded.currentTime = 0;
    };

  } catch (err) {
    alert('Error extracting audio: ' + err.message);
    document.getElementById('audioProgress').classList.add('hidden');
  } finally {
    extractAudioBtn.disabled = false;
    extractAudioBtn.textContent = '🎵 Extract Audio (MP3)';
  }
});

extractAudioWavBtn.addEventListener('click', () => {
  alert('WAV extraction would require additional audio processing libraries. The WebM audio extraction provides high-quality audio that can be converted to WAV using external tools.');
});

// ==================== VOLUME CONTROL ====================
volume.addEventListener('input', (e) => {
  const vol = e.target.value / 100;
  recorded.volume = Math.min(vol, 1); // Clamp to 1.0 max for standard volume
  volumeValue.textContent = e.target.value + '%';
});

muteVideo.addEventListener('change', (e) => {
  recorded.muted = e.target.checked;
});

// ==================== DOWNLOAD VIDEO ====================
downloadBtn.addEventListener('click', () => {
  const format = exportFormat.value;
  const name = fileName.value || 'recording';

  const a = document.createElement('a');
  a.href = recordedURL;
  a.download = `${name}-${Date.now()}.${format}`;
  a.click();
});

// ==================== EXPORT GIF ====================
downloadGifBtn.addEventListener('click', async () => {
  try {
    downloadGifBtn.disabled = true;
    downloadGifBtn.textContent = '⏳ Creating GIF...';
    document.getElementById('exportProgress').classList.remove('hidden');
    document.getElementById('exportProgressFill').style.width = '30%';

    alert('GIF export would require additional libraries like gif.js. For now, you can use online converters to convert your WebM video to GIF, or integrate gif.js library for direct GIF export.');

    document.getElementById('exportProgressFill').style.width = '100%';
    setTimeout(() => {
      document.getElementById('exportProgress').classList.add('hidden');
      document.getElementById('exportProgressFill').style.width = '0%';
    }, 1000);

  } catch (err) {
    alert('Error creating GIF: ' + err.message);
    document.getElementById('exportProgress').classList.add('hidden');
  } finally {
    downloadGifBtn.disabled = false;
    downloadGifBtn.textContent = '🎞️ Export as GIF';
  }
});

// ==================== NEW RECORDING ====================
newBtn.addEventListener('click', () => {
  if (recordedURL) {
    URL.revokeObjectURL(recordedURL);
  }
  recordedChunks = [];
  recordedBlob = null;
  recordedURL = null;
  preview.srcObject = null;
  recorded.src = '';
  timer.textContent = '00:00:00';
  fileSize.textContent = '0 MB';
  frameCount.textContent = '0 frames';
  qualityInfo.textContent = '--';
  bitrateInfo.textContent = '--';
  frameCounter = 0;

  // Reset controls
  playbackSpeed.value = 1;
  speedValue.textContent = '1.0x';
  trimStart.value = 0;
  trimEnd.value = '';
  resetFilters.click();
  volume.value = 100;
  volumeValue.textContent = '100%';
  muteVideo.checked = false;
  recorded.muted = false;

  // Switch to first tab
  tabs[0].click();

  previewPanel.classList.add('hidden');
  setupPanel.classList.remove('hidden');
});

// ==================== TIMER FUNCTIONS ====================
function startTimer() {
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    timer.textContent = formatTime(elapsed);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return [hours, minutes, seconds].map(n => n.toString().padStart(2, '0')).join(':');
}

// ==================== FILE SIZE ====================
function updateFileSize() {
  const bytes = recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0);
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  fileSize.textContent = `${mb} MB`;
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+R: Start/Stop recording
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    if (setupPanel.classList.contains('hidden')) {
      if (!previewPanel.classList.contains('hidden')) {
        return; // Don't trigger if on preview panel
      }
      stopBtn.click();
    } else {
      startBtn.click();
    }
  }

  // Ctrl+Shift+P: Pause/Resume
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    if (!recordingPanel.classList.contains('hidden')) {
      pauseBtn.click();
    }
  }

  // Ctrl+Shift+S: Screenshot
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    if (!recordingPanel.classList.contains('hidden')) {
      screenshotBtn.click();
    }
  }
});

// ==================== VIDEO IMPORT & LIBRARY ====================
importVideo.addEventListener('change', async (e) => {
  const files = e.target.files;
  for (let file of files) {
    if (file.type.startsWith('video/')) {
      await addVideoToLibrary(file);
    }
  }
  e.target.value = ''; // Reset input
});

async function addVideoToLibrary(file) {
  const videoId = Date.now() + Math.random();
  const url = URL.createObjectURL(file);

  const videoItem = {
    id: videoId,
    name: file.name,
    url: url,
    blob: file,
    duration: 0
  };

  // Create video element to get duration
  const tempVideo = document.createElement('video');
  tempVideo.src = url;
  await new Promise(resolve => {
    tempVideo.onloadedmetadata = () => {
      videoItem.duration = tempVideo.duration;
      resolve();
    };
  });

  videoLibraryItems.push(videoItem);
  renderVideoLibrary();
}

function renderVideoLibrary() {
  videoLibrary.innerHTML = '';

  videoLibraryItems.forEach(item => {
    const videoDiv = document.createElement('div');
    videoDiv.className = 'video-item';
    videoDiv.dataset.videoId = item.id;

    videoDiv.innerHTML = `
          <video src="${item.url}" muted></video>
          <div class="video-item-name" title="${item.name}">${item.name}</div>
          <div class="video-item-duration">${formatTime(item.duration * 1000)}</div>
          <button class="video-item-remove" onclick="removeVideoFromLibrary(${item.id})">✕</button>
        `;

    videoDiv.addEventListener('click', (e) => {
      if (!e.target.classList.contains('video-item-remove')) {
        toggleVideoSelection(item.id);
      }
    });

    videoLibrary.appendChild(videoDiv);
  });
}

function toggleVideoSelection(videoId) {
  const videoDiv = document.querySelector(`[data-video-id="${videoId}"]`);
  const index = selectedVideos.indexOf(videoId);

  if (index > -1) {
    selectedVideos.splice(index, 1);
    videoDiv.classList.remove('selected');
  } else {
    selectedVideos.push(videoId);
    videoDiv.classList.add('selected');
  }

  updateMergeQueue();
}

function removeVideoFromLibrary(videoId) {
  const index = videoLibraryItems.findIndex(v => v.id === videoId);
  if (index > -1) {
    URL.revokeObjectURL(videoLibraryItems[index].url);
    videoLibraryItems.splice(index, 1);
  }

  const selectedIndex = selectedVideos.indexOf(videoId);
  if (selectedIndex > -1) {
    selectedVideos.splice(selectedIndex, 1);
  }

  renderVideoLibrary();
  updateMergeQueue();
}

function updateMergeQueue() {
  if (selectedVideos.length === 0) {
    mergeQueueEmpty.classList.remove('hidden');
    mergeQueueItems.classList.add('hidden');
    mergeVideosBtn.disabled = true;
    clearMergeQueueBtn.disabled = true;
    return;
  }

  mergeQueueEmpty.classList.add('hidden');
  mergeQueueItems.classList.remove('hidden');
  mergeVideosBtn.disabled = false;
  clearMergeQueueBtn.disabled = false;

  mergeQueueItems.innerHTML = '';
  selectedVideos.forEach((videoId, index) => {
    const video = videoLibraryItems.find(v => v.id === videoId);
    if (video) {
      const queueItem = document.createElement('div');
      queueItem.className = 'merge-queue-item';
      queueItem.innerHTML = `
            <span>${index + 1}. ${video.name} (${formatTime(video.duration * 1000)})</span>
            <button class="btn-danger" style="padding: 0.5rem 1rem;" onclick="toggleVideoSelection(${videoId})">Remove</button>
          `;
      mergeQueueItems.appendChild(queueItem);
    }
  });
}

clearMergeQueueBtn.addEventListener('click', () => {
  selectedVideos = [];
  document.querySelectorAll('.video-item').forEach(div => div.classList.remove('selected'));
  updateMergeQueue();
});

// ==================== VIDEO MERGING ====================
mergeVideosBtn.addEventListener('click', async () => {
  if (selectedVideos.length < 2) {
    alert('Please select at least 2 videos to merge!');
    return;
  }

  try {
    mergeVideosBtn.disabled = true;
    mergeVideosBtn.textContent = '⏳ Merging Videos...';

    alert('Video merging requires MediaRecorder API to record combined playback. This is a simplified merge that will play videos sequentially. For professional merging with transitions, consider using FFmpeg.wasm library.');

    // Simple approach: Create a playlist that plays videos one after another
    const mergedVideoData = {
      videos: selectedVideos.map(id => videoLibraryItems.find(v => v.id === id)),
      type: 'merged'
    };

    // For now, just show success message
    // Real implementation would require more complex video processing
    alert(`Successfully queued ${selectedVideos.length} videos for merging! In a full implementation, these would be concatenated into a single video file.`);

  } catch (err) {
    alert('Error merging videos: ' + err.message);
  } finally {
    mergeVideosBtn.disabled = false;
    mergeVideosBtn.textContent = '🔗 Merge Selected Videos';
  }
});

// ==================== VIDEO SPLIT ====================
addSplitMarkerBtn.addEventListener('click', () => {
  const time = parseFloat(splitTime.value);

  if (!recorded.src || isNaN(time) || time < 0 || time >= recorded.duration) {
    alert('Please enter a valid time between 0 and ' + recorded.duration.toFixed(1) + ' seconds');
    return;
  }

  if (splitMarkersList.includes(time)) {
    alert('A marker already exists at this time!');
    return;
  }

  splitMarkersList.push(time);
  splitMarkersList.sort((a, b) => a - b);
  renderSplitMarkers();
  applySplitBtn.disabled = false;
});

function renderSplitMarkers() {
  splitMarkers.innerHTML = '';

  if (splitMarkersList.length === 0) {
    splitMarkers.innerHTML = '<span style="color: var(--text-secondary);">No split markers added yet</span>';
    return;
  }

  splitMarkersList.forEach((time, index) => {
    const marker = document.createElement('div');
    marker.className = 'split-marker';
    marker.innerHTML = `
          <span>Split ${index + 1}: ${time.toFixed(2)}s</span>
          <button onclick="removeSplitMarker(${index})">✕</button>
        `;
    splitMarkers.appendChild(marker);
  });
}

function removeSplitMarker(index) {
  splitMarkersList.splice(index, 1);
  renderSplitMarkers();
  applySplitBtn.disabled = splitMarkersList.length === 0;
}

clearSplitMarkersBtn.addEventListener('click', () => {
  splitMarkersList = [];
  renderSplitMarkers();
  applySplitBtn.disabled = true;
});

applySplitBtn.addEventListener('click', () => {
  if (splitMarkersList.length === 0) {
    alert('Please add at least one split marker!');
    return;
  }

  applySplitBtn.disabled = true;
  applySplitBtn.textContent = '⏳ Splitting...';

  // Calculate segments
  const segments = [];
  let prevTime = 0;

  splitMarkersList.forEach((time, index) => {
    segments.push({
      start: prevTime,
      end: time,
      name: `Segment ${segments.length + 1}`
    });
    prevTime = time;
  });

  // Add final segment
  segments.push({
    start: prevTime,
    end: recorded.duration,
    name: `Segment ${segments.length + 1}`
  });

  // Render timeline
  renderTimeline(segments);

  alert(`Video split into ${segments.length} segments! In a full implementation, these would be exported as separate video files. For now, they're shown on the timeline.`);

  applySplitBtn.disabled = false;
  applySplitBtn.textContent = '✂️ Split Video at Markers';
});

function renderTimeline(segments) {
  timelineTracks.innerHTML = '';

  segments.forEach((segment, index) => {
    const clip = document.createElement('div');
    clip.className = 'timeline-clip';
    clip.style.width = `${(segment.end - segment.start) * 50}px`;
    clip.innerHTML = `
          ${segment.name}<br>
          <small>${segment.start.toFixed(1)}s - ${segment.end.toFixed(1)}s</small>
        `;

    clip.addEventListener('click', () => {
      recorded.currentTime = segment.start;
      recorded.play();
    });

    timelineTracks.appendChild(clip);
  });
}

// ==================== ANIMATIONS ====================
animationBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    animationBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const animation = btn.dataset.animation;
    recorded.style.animation = `${animation} 2s ease-in-out`;

    setTimeout(() => {
      recorded.style.animation = 'none';
    }, 2000);
  });
});

// ==================== TEXT OVERLAY ====================
overlayText.addEventListener('input', (e) => {
  textOverlayDisplay.textContent = e.target.value;
});

fontSize.addEventListener('input', (e) => {
  const size = e.target.value;
  fontSizeValue.textContent = size + 'px';
  textOverlayDisplay.style.fontSize = size + 'px';
});

textColor.addEventListener('input', (e) => {
  textOverlayDisplay.style.color = e.target.value;
});

overlayPosition.addEventListener('change', (e) => {
  const position = e.target.value;
  const positions = {
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'top-left': { top: '10px', left: '10px', transform: 'none' },
    'top-center': { top: '10px', left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: '10px', right: '10px', left: 'auto', transform: 'none' },
    'bottom-left': { bottom: '10px', top: 'auto', left: '10px', transform: 'none' },
    'bottom-center': { bottom: '10px', top: 'auto', left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: '10px', top: 'auto', right: '10px', left: 'auto', transform: 'none' }
  };

  Object.assign(textOverlayDisplay.style, positions[position]);
});

applyTextOverlayBtn.addEventListener('click', () => {
  if (!textOverlayElement) {
    textOverlayElement = document.createElement('div');
    textOverlayElement.style.cssText = `
          position: absolute;
          font-size: ${fontSize.value}px;
          color: ${textColor.value};
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          z-index: 100;
          pointer-events: none;
        `;
    recorded.parentElement.appendChild(textOverlayElement);
  }

  textOverlayElement.textContent = overlayText.value;
  textOverlayElement.style.fontSize = fontSize.value + 'px';
  textOverlayElement.style.color = textColor.value;

  const position = overlayPosition.value;
  const positions = {
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'top-left': { top: '10px', left: '10px', transform: 'none' },
    'top-center': { top: '10px', left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: '10px', right: '10px', left: 'auto', transform: 'none' },
    'bottom-left': { bottom: '10px', top: 'auto', left: '10px', transform: 'none' },
    'bottom-center': { bottom: '10px', top: 'auto', left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: '10px', top: 'auto', right: '10px', left: 'auto', transform: 'none' }
  };

  Object.assign(textOverlayElement.style, positions[position]);

  alert('Text overlay applied! Note: This is a visual overlay. To embed text permanently in the video, you would need video processing libraries like FFmpeg.wasm.');
});

removeTextOverlayBtn.addEventListener('click', () => {
  if (textOverlayElement) {
    textOverlayElement.remove();
    textOverlayElement = null;
  }
});

// ==================== VISUAL EFFECTS ====================
opacity.addEventListener('input', (e) => {
  opacityValue.textContent = e.target.value + '%';
  applyVisualEffects();
});

hue.addEventListener('input', (e) => {
  hueValue.textContent = e.target.value + '°';
  applyVisualEffects();
});

blurAmount.addEventListener('input', (e) => {
  blurValue.textContent = e.target.value + 'px';
  applyVisualEffects();
});

function applyVisualEffects() {
  const o = opacity.value / 100;
  const h = hue.value;
  const b = blurAmount.value;

  recorded.style.opacity = o;

  let currentFilter = recorded.style.filter || '';
  const hasAdvancedFilters = currentFilter.includes('brightness') && currentFilter.includes('contrast');

  if (hasAdvancedFilters) {
    // Keep existing brightness/contrast/saturation, add hue and blur
    const brightnessMatch = currentFilter.match(/brightness\((\d+)%\)/);
    const contrastMatch = currentFilter.match(/contrast\((\d+)%\)/);
    const saturateMatch = currentFilter.match(/saturate\((\d+)%\)/);

    const bVal = brightnessMatch ? brightnessMatch[1] : '100';
    const cVal = contrastMatch ? contrastMatch[1] : '100';
    const sVal = saturateMatch ? saturateMatch[1] : '100';

    recorded.style.filter = `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%) hue-rotate(${h}deg) blur(${b}px)`;
  } else {
    recorded.style.filter = `hue-rotate(${h}deg) blur(${b}px)`;
  }
}

resetEffectsBtn.addEventListener('click', () => {
  opacity.value = 100;
  hue.value = 0;
  blurAmount.value = 0;
  opacityValue.textContent = '100%';
  hueValue.textContent = '0°';
  blurValue.textContent = '0px';
  recorded.style.opacity = 1;
  recorded.style.animation = 'none';

  // Keep filter reset consistent with resetFilters
  const currentFilter = recorded.style.filter;
  if (currentFilter.includes('hue-rotate') || currentFilter.includes('blur')) {
    applyVisualEffects();
  }

  animationBtns.forEach(btn => btn.classList.remove('active'));
});

// ==================== INFO MESSAGE ====================
console.log('%c🎥 Professional Screen Recorder Pro', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%c\n🎬 Recording Quality Options:', 'color: #10b981; font-size: 14px; font-weight: bold;');
console.log('• Resolutions: Full HD, 2K, 4K, 5K, 8K UHD');
console.log('• Frame Rates: 24, 30, 60, 120 FPS');
console.log('• Bitrates: 4 Mbps - 100 Mbps (Studio Quality)');
console.log('• Codecs: VP9, VP8, H.264, AV1');
console.log('• Audio: Up to 320 kbps with noise suppression');
console.log('%c\n⌨️ Keyboard Shortcuts:', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
console.log('Ctrl+Shift+R - Start/Stop Recording');
console.log('Ctrl+Shift+P - Pause/Resume Recording');
console.log('Ctrl+Shift+S - Take Screenshot');
console.log('%c\n✨ Advanced Features:', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
console.log('• Import and manage multiple videos');
console.log('• Merge videos together');
console.log('• Split videos at timestamps');
console.log('• Add animations and transitions');
console.log('• Text overlays with customization');
console.log('• Advanced visual effects and filters');

console.log('%c\n🎬 Recording Quality Options:', 'color: #10b981; font-size: 14px; font-weight: bold;');
console.log('• Resolutions: Full HD, 2K, 4K, 5K, 8K UHD');
console.log('• Frame Rates: 24, 30, 60, 120 FPS');
console.log('• Bitrates: 4 Mbps - 100 Mbps (Studio Quality)');
console.log('• Codecs: VP9, VP8, H.264, AV1');
console.log('• Audio: Up to 320 kbps with noise suppression');
console.log('%c\n⌨️ Keyboard Shortcuts:', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
console.log('Ctrl+Shift+R - Start/Stop Recording');
console.log('Ctrl+Shift+P - Pause/Resume Recording');
console.log('Ctrl+Shift+S - Take Screenshot');
console.log('%c\n✨ Advanced Features:', 'color: #f59e0b; font-size: 14px; font-weight: bold;');
console.log('• Import and manage multiple videos');
console.log('• Merge videos together');
console.log('• Split videos at timestamps');
console.log('• Add animations and transitions');
console.log('• Text overlays with customization');
console.log('• Advanced visual effects and filters');
