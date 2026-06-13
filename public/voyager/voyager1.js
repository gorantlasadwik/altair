// Voyager 1 Interactive Page Scripts

document.addEventListener('DOMContentLoaded', () => {
  // 1. STARFIELD CANVAS ANIMATION
  initStarfield();

  // 2. LIVE TELEMETRY ENGINE
  initTelemetry();

  // 3. ANATOMY SCHEMA HOTSPOTS
  initAnatomyHotspots();

  // 4. TIMELINE SCROLL SYSTEM
  initTimelineScroll();

  // 5. GOLDEN RECORD SIMULATOR
  initGoldenRecord();

  // 6. TELEMETRY STATUS TERMINAL
  initTerminalLogs();
});

/* =========================================================================
   1. STARFIELD CANVAS ANIMATION
   ========================================================================= */
function initStarfield() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let stars = [];
  const numStars = 150;
  let scrollSpeedFactor = 1;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Initialize stars
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5,
      speed: Math.random() * 0.2 + 0.05,
      opacity: Math.random() * 0.7 + 0.3
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Star drawing and drifting
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226, 236, 239, ${star.opacity})`;
      ctx.fill();

      // Drift leftwards and downwards slightly
      star.x -= star.speed * scrollSpeedFactor;
      if (star.x < 0) {
        star.x = canvas.width;
        star.y = Math.random() * canvas.height;
      }
    });

    requestAnimationFrame(animate);
  }
  animate();

  // Speed up stars on scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    scrollSpeedFactor = 4; // speed up
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollSpeedFactor = 1; // reset speed
    }, 150);
  });
}

/* =========================================================================
   2. LIVE TELEMETRY ENGINE
   ========================================================================= */
function initTelemetry() {
  // Base NASA stats (approximations based on JPL voyager real-time distance dashboard)
  // Base distance on June 14, 2026: ~163.483100 AU
  let distanceAU = 163.483100;
  const AU_TO_KM = 149597870.7;
  const KM_TO_MI = 0.621371;
  const SPEED_KMS = 16.9995; // ~17 km/s relative to Sun
  
  // Real-time tick increments
  // 17 km per second is 0.017 km/ms
  // AU/ms = (0.017 km/ms) / AU_TO_KM
  const AU_INCREMENT_PER_MS = (SPEED_KMS / 1000) / AU_TO_KM;
  
  const auText = document.getElementById('telemetry-distance-au');
  const kmText = document.getElementById('telemetry-distance-km');
  const miText = document.getElementById('telemetry-distance-mi');
  const speedKmsText = document.getElementById('telemetry-speed-kms');
  const speedMphText = document.getElementById('telemetry-speed-mph');
  const delayText = document.getElementById('telemetry-lighttime');

  // Update telemetry values
  function tickTelemetry() {
    // Increment distance
    distanceAU += AU_INCREMENT_PER_MS * 50; // 50ms interval
    
    // Calculations
    const distanceKM = distanceAU * AU_TO_KM;
    const distanceMI = distanceKM * KM_TO_MI;
    
    // Signal Delay: One-way light time. Light speed is 299,792.458 km/s
    // Delay (seconds) = distanceKM / 299792.458
    const delaySeconds = distanceKM / 299792.458;
    const hours = Math.floor(delaySeconds / 3600);
    const minutes = Math.floor((delaySeconds % 3600) / 60);
    const seconds = Math.floor(delaySeconds % 60);
    
    // Render values
    if (auText) auText.textContent = `${distanceAU.toFixed(8)} AU`;
    if (kmText) kmText.textContent = `${Math.floor(distanceKM).toLocaleString()} KM`;
    if (miText) miText.textContent = `${Math.floor(distanceMI).toLocaleString()} MILES`;
    
    // Wobble Speed slightly (to simulate realistic space telemetry variance)
    const wobbledSpeed = SPEED_KMS + (Math.sin(Date.now() / 2000) * 0.0002);
    const wobbledMph = wobbledSpeed * 2236.94; // km/s to mph
    if (speedKmsText) speedKmsText.textContent = `${wobbledSpeed.toFixed(4)} KM/S`;
    if (speedMphText) speedMphText.textContent = `${Math.floor(wobbledMph).toLocaleString()} MPH`;
    
    // Delay Clock format
    const formatTime = (t) => t.toString().padStart(2, '0');
    if (delayText) delayText.textContent = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
  }

  setInterval(tickTelemetry, 50);
}

/* =========================================================================
   3. ANATOMY SCHEMA HOTSPOTS
   ========================================================================= */
function initAnatomyHotspots() {
  const hotspots = document.querySelectorAll('.hotspot-group');
  const diagTitle = document.getElementById('diag-title');
  const diagDesc = document.getElementById('diag-desc');
  const spec1 = document.getElementById('spec-1');
  const spec2 = document.getElementById('spec-2');
  const spec3 = document.getElementById('spec-3');
  const spec4 = document.getElementById('spec-4');

  const systemsData = {
    antenna: {
      title: 'HIGH-GAIN ANTENNA',
      desc: '<p>Voyager\'s 3.7-meter diameter parabolic reflector dish is the primary link back to NASA\'s Deep Space Network (DSN) on Earth.</p><p>It operates continuously in both S-band and X-band frequencies, transmitting planetary science findings and interstellar telemetry across billions of miles.</p>',
      specs: ['X-Band / S-Band', '23 Watts (Transmitter)', '3.7 Meters (12 feet)', '~48 dBi (X-band)']
    },
    record: {
      title: 'GOLDEN RECORD',
      desc: '<p>A 12-inch gold-plated copper disc containing sounds and images selected to portray the diversity of life and culture on Earth.</p><p>It serves as a cosmic bottle message to any extraterrestrial civilization that might discover the spacecraft in the distant future. It comes with playback instructions engraved on its cover.</p>',
      specs: ['Gold-Plated Copper', '16⅔ RPM analog speed', 'Greetings in 55 languages', '115 images / 90m music']
    },
    instruments: {
      title: 'SCIENCE INSTRUMENT DECK',
      desc: '<p>Mounted on the 2.5-meter science boom, this package features imaging cameras, spectrometers, and detectors designed to analyze gas giants.</p><p>Currently, the active cosmic ray and particle detectors analyze the boundary characteristics where the solar wind ends and the interstellar medium begins.</p>',
      specs: ['CRS / LECP sensors active', 'Photopolarimeter (OFF)', 'Cameras deactivated (1990)', 'Weight: ~45 kg (boom assembly)']
    },
    rtg: {
      title: 'RTG POWER SYSTEM',
      desc: '<p>Three Radioisotope Thermoelectric Generators (RTGs) provide the spacecraft\'s electrical power using the heat from the natural decay of Plutonium-238.</p><p>Power output decays by about 4 watts annually. NASA manages power carefully by turning off heaters and non-essential science systems to keep Voyager running.</p>',
      specs: ['Plutonium-238 isotope', 'Initially 470W (1977)', 'Current output: ~200W', 'Lifespan: 2025-2030 (est.)']
    },
    magnetometer: {
      title: 'MAGNETOMETER BOOM',
      desc: '<p>A 13-meter long lightweight fiberglass boom extending below the spacecraft bus carrying magnetometers.</p><p>It is used to measure magnetic fields in interstellar space without interference from the magnetic fields generated by the spacecraft\'s own electrical circuits.</p>',
      specs: ['Triaxial Fluxgate sensors', 'Sensors: High & Low field', '13m boom length', 'Detecting heliopause boundary']
    }
  };

  hotspots.forEach(hotspot => {
    // Set initial active state for antenna
    if (hotspot.getAttribute('data-target') === 'antenna') {
      hotspot.classList.add('active');
    }

    hotspot.addEventListener('click', () => {
      // Toggle active visual class on SVG hotspots
      hotspots.forEach(h => h.classList.remove('active'));
      hotspot.classList.add('active');

      // Update Panel Data
      const key = hotspot.getAttribute('data-target');
      const data = systemsData[key];

      if (data) {
        diagTitle.textContent = data.title;
        diagDesc.innerHTML = data.desc;
        spec1.textContent = data.specs[0];
        spec2.textContent = data.specs[1];
        spec3.textContent = data.specs[2];
        spec4.textContent = data.specs[3];
      }
    });
  });
}

/* =========================================================================
   4. TIMELINE SCROLL SYSTEM
   ========================================================================= */
function initTimelineScroll() {
  const timelineSection = document.getElementById('timeline-section');
  const scrollProgressBar = document.getElementById('timeline-scroll-progress');
  const timelineItems = document.querySelectorAll('.timeline-item');
  const probeIndicator = document.getElementById('timeline-probe-indicator');

  if (!timelineSection || !scrollProgressBar) return;

  function updateTimeline() {
    const sectionRect = timelineSection.getBoundingClientRect();
    const sectionHeight = sectionRect.height;
    const windowHeight = window.innerHeight;

    // Calculate how much of the timeline section is scrolled through relative to the viewport center
    const sectionTopToViewportCenter = (windowHeight / 2) - sectionRect.top;
    let scrollPercent = (sectionTopToViewportCenter / sectionHeight) * 100;
    
    // Clamp percentage
    scrollPercent = Math.max(0, Math.min(100, scrollPercent));
    scrollProgressBar.style.height = `${scrollPercent}%`;

    // Rotate probe indicator based on scroll depth and toggle visibility
    if (probeIndicator) {
      probeIndicator.style.transform = `translate(-50%, -50%) rotate(${window.scrollY * 0.15}deg)`;
      
      const isTimelineInView = (sectionRect.top < windowHeight / 2) && (sectionRect.bottom > windowHeight / 2);
      if (isTimelineInView) {
        probeIndicator.classList.remove('opacity-0');
        probeIndicator.classList.add('opacity-100');
      } else {
        probeIndicator.classList.remove('opacity-100');
        probeIndicator.classList.add('opacity-0');
      }
    }

    // Toggle active state for timeline cards
    timelineItems.forEach((item, index) => {
      const itemRect = item.getBoundingClientRect();
      // Item is active when its top enters the top 60% of the screen
      if (itemRect.top < windowHeight * 0.6) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateTimeline);
  updateTimeline(); // Initial run
}

/* =========================================================================
   5. GOLDEN RECORD SIMULATOR
   ========================================================================= */
function initGoldenRecord() {
  const recordDisc = document.getElementById('golden-record-disc');
  const playBtn = document.getElementById('record-play-btn');
  const playIcon = document.getElementById('play-icon');
  const playbackStatus = document.getElementById('playback-status');
  const tabBtns = document.querySelectorAll('.record-tab-btn');
  const visualizer = document.getElementById('audio-visualizer');
  const visualizerLabel = document.getElementById('visualizer-label');
  
  const categoryTitle = document.getElementById('record-category-title');
  const categoryDesc = document.getElementById('record-category-desc');

  let isPlaying = false;
  let currentCategory = 'greetings';

  const categoryTexts = {
    greetings: {
      title: 'GREETINGS TO THE UNIVERSE',
      desc: 'Contains recorded greetings in 55 human languages, starting with Sumerian (the oldest written language) and ending with Wu Chinese. It also features a greeting from the United Nations Secretary-General.'
    },
    sounds: {
      title: 'SOUNDS OF EARTH & NATURE',
      desc: 'A compilation of natural soundscapes: wind, rain, thunder, bird songs, whale songs, fire crackles, heartbeats, animal calls, and civil sounds of human industry.'
    },
    music: {
      title: 'THE SOUNDS OF MUSIC & CULTURE',
      desc: '90 minutes of cultural tracks representing humanity. Includes Bach\'s Brandenburg Concerto, Mozart\'s Magic Flute, Chuck Berry\'s "Johnny B. Goode", Azerbaijani folk instruments, and traditional styles from Senegal, India, and China.'
    },
    space: {
      title: 'SOUNDS OF THE DEEP COSMOS',
      desc: 'Raw frequencies from interstellar dust collisions, plasma waves, and magnetic field flux waves recorded by Voyager 1. These electrostatic radio waves have been transposed into audio files.'
    }
  };

  // Play Pause Action
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        // Play state
        recordDisc.classList.add('spinning');
        playIcon.textContent = 'pause';
        playbackStatus.textContent = 'PLAYING';
        playbackStatus.className = 'text-[#FF8A00] font-bold animate-pulse';
        visualizer.classList.add('visualizing');
        visualizerLabel.textContent = 'SIGNAL STRENGTH: 94%';
        visualizerLabel.className = 'text-[10px] font-mono text-[#00F0FF] font-semibold';
      } else {
        // Pause state
        recordDisc.classList.remove('spinning');
        playIcon.textContent = 'play_arrow';
        playbackStatus.textContent = 'STANDBY';
        playbackStatus.className = 'text-zinc-500 font-normal';
        visualizer.classList.remove('visualizing');
        visualizerLabel.textContent = 'SIGNAL STRENGTH: 0%';
        visualizerLabel.className = 'text-[10px] font-mono text-zinc-500';
      }
    });
  }

  // Category Selector Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle visual active class
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-target-category') || btn.getAttribute('data-category');
      currentCategory = category;

      // Update text
      categoryTitle.textContent = categoryTexts[category].title;
      categoryDesc.textContent = categoryTexts[category].desc;

      // Reset playback state when switching categories
      if (isPlaying) {
        recordDisc.classList.remove('spinning');
        setTimeout(() => {
          if (isPlaying) recordDisc.classList.add('spinning');
        }, 50);
      }
    });
  });
}

/* =========================================================================
   6. TELEMETRY STATUS TERMINAL
   ========================================================================= */
function initTerminalLogs() {
  const terminal = document.getElementById('terminal-output');
  if (!terminal) return;

  const logMessages = [
    { source: 'SYS', text: 'LECP sensor calibration check: PASS' },
    { source: 'SYS', text: 'CRS count rate: 2.148 particles/s (Stable)' },
    { source: 'SYS', text: 'RTG thermal power output: 204.2 Watts' },
    { source: 'MAG', text: 'Triaxial magnetic flux vector stable at 0.122 nT' },
    { source: 'PWS', text: 'Plasma Wave electron density peaks detected at 2.18 kHz' },
    { source: 'SYS', text: 'Attitude Control gas thrust adjustment completed (+0.04s)' },
    { source: 'SYS', text: 'One-way communication latency calculated: 22:38:15' },
    { source: 'SYS', text: 'Downlink speed: 160 bps via DSN (Madrid pad)' },
    { source: 'SYS', text: 'Main computer buffer check: 0 parity errors detected' }
  ];

  function appendLog() {
    const timestamp = new Date().toISOString().substring(11, 19);
    const log = logMessages[Math.floor(Math.random() * logMessages.length)];
    
    const logRow = document.createElement('div');
    logRow.className = 'opacity-0 transform translate-x-2 transition-all duration-500';
    
    // Styling source tag
    let sourceSpan = '';
    if (log.source === 'SYS') {
      sourceSpan = `<span class="text-[#00F0FF] font-bold">[SYS]</span>`;
    } else {
      sourceSpan = `<span class="text-[#FF8A00] font-bold">[${log.source}]</span>`;
    }

    logRow.innerHTML = `<span class="text-zinc-600 font-normal">[${timestamp}]</span> ${sourceSpan} ${log.text}`;
    terminal.appendChild(logRow);

    // Fade in animation
    setTimeout(() => {
      logRow.classList.remove('opacity-0', 'translate-x-2');
    }, 10);

    // Limit log line numbers (keep last 12)
    if (terminal.children.length > 15) {
      terminal.removeChild(terminal.firstElementChild);
    }

    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight;
  }

  // Append a log every 5 seconds
  setInterval(appendLog, 5000);
}

