/* ==========================================================================
   ALTAIR ARCADE - Retro Web Audio Synthesizer Engine
   ========================================================================== */

class GameAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmInterval = null;
    this.musicNode = null;
    this.musicGain = null;
    this.tempo = 120; // BPM
    this.beatLength = 60 / this.tempo;
    this.currentStep = 0;
  }

  // Lazy initialize AudioContext on user interaction
  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.init();
      this.resume();
      this.startMusic();
    }
    return this.isMuted;
  }

  /* ==========================================================================
     Procedural Sound Effects Generators
     ========================================================================== */

  // 1. Retro coin insert / Start Game chime
  playCoin() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    
    // Play two rapid ascending clean square waves (Classic 8-bit coin sound)
    this.playTone(987.77, 'square', t, 0.08, 0.08); // B5
    this.playTone(1318.51, 'square', t + 0.08, 0.08, 0.15); // E6
  }

  // Helper to play simple oscillator notes with quick gain envelope
  playTone(freq, type, startTime, duration, volume = 0.1) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // 2. Laser Shoot Sound Effect
  playLaser() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const dur = 0.12;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle'; // Retro pitch sweep
    // Frequency sweeps rapidly downward
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + dur);
    
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + dur);
  }

  // 3. Dynamic Asteroid Explosion (White noise with low pass sweep filter)
  playExplosion() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const dur = 0.45;

    // Create a buffer filled with white noise
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filter to shape the noise into a low rumble explosion
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(30, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(t);
    noiseNode.stop(t + dur);
  }

  // 4. Ship Impact Hit
  playHit() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const dur = 0.25;

    // Short low frequency square wave + white noise buzz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.setValueAtTime(90, t + 0.1);
    
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + dur);
  }

  // 5. Game Over Tune
  playGameOver() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    
    // Low, descending, sad arpeggio
    this.playTone(392.00, 'sawtooth', t, 0.2, 0.08); // G4
    this.playTone(349.23, 'sawtooth', t + 0.25, 0.2, 0.08); // F4
    this.playTone(311.13, 'sawtooth', t + 0.5, 0.2, 0.08); // Eb4
    this.playTone(246.94, 'sawtooth', t + 0.75, 0.5, 0.08); // B3
  }

  // 6. Level Up Melody
  playLevelUp() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    
    // Upbeat melody
    this.playTone(523.25, 'triangle', t, 0.1, 0.08); // C5
    this.playTone(659.25, 'triangle', t + 0.1, 0.1, 0.08); // E5
    this.playTone(783.99, 'triangle', t + 0.2, 0.1, 0.08); // G5
    this.playTone(1046.50, 'triangle', t + 0.3, 0.3, 0.08); // C6
  }

  /* ==========================================================================
     Procedural Background Music Loop (Retro Synth Wave)
     ========================================================================== */

  startMusic() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    this.stopMusic();
    this.resume();

    // Rhythmic bass notes
    const bassline = [
      110.00, 110.00, 130.81, 130.81, // A2, A2, C3, C3
      146.83, 146.83, 164.81, 164.81  // D3, D3, E3, E3
    ];

    // Simple upbeat melody steps (null represents rests)
    const melody = [
      440.00, null, 523.25, null, 587.33, 659.25, null, 440.00,
      null, 392.00, null, 440.00, null, null, null, null
    ];

    this.currentStep = 0;
    
    // Scheduler loop that runs every beat to schedule the audio node
    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      
      const t = this.ctx.currentTime;
      const stepDur = this.beatLength / 2; // 8th notes

      // 1. Play Bass Note
      const bassIndex = Math.floor(this.currentStep / 2) % bassline.length;
      if (this.currentStep % 2 === 0) {
        this.playTone(bassline[bassIndex], 'sawtooth', t, stepDur * 0.9, 0.025);
      }

      // 2. Play Melody Note
      const melodyIndex = this.currentStep % melody.length;
      const melNote = melody[melodyIndex];
      if (melNote !== null) {
        this.playTone(melNote, 'triangle', t, stepDur * 0.8, 0.02);
      }

      this.currentStep++;
    }, stepDurMs(this.beatLength / 2));
  }

  stopMusic() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

// Helper to convert beat seconds to milliseconds for setInterval
function stepDurMs(sec) {
  return sec * 1000;
}

// Instantiate global audio instance
const audio = new GameAudio();
window.gameAudio = audio;
