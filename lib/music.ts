// Procedural Ambient Fantasy Music System
// Creates a dreamy, evolving soundscape using Web Audio API

export class FantasyMusic {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private chimeGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  
  private oscillators: OscillatorNode[] = [];
  private filters: BiquadFilterNode[] = [];
  private noises: AudioBufferSourceNode[] = [];
  
  private isPlaying = false;
  private phase: 'landing' | 'journey' | 'finale' = 'landing';
  private intervalIds: NodeJS.Timeout[] = [];

  private readonly NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5

  init() {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Master
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.0; // Start silent, fade in
      
      // Dedicated buses
      this.padGain = this.audioContext.createGain();
      this.padGain.gain.value = 0.55;
      
      this.chimeGain = this.audioContext.createGain();
      this.chimeGain.gain.value = 0.22;
      
      this.droneGain = this.audioContext.createGain();
      this.droneGain.gain.value = 0.38;

      // Soft lowpass on pads
      const padFilter = this.audioContext.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 980;

      const masterFilter = this.audioContext.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.value = 2400;

      // Reverb-ish (simple delay + feedback for space)
      const delay = this.audioContext.createDelay(1.2);
      delay.delayTime.value = 0.72;
      const feedback = this.audioContext.createGain();
      feedback.gain.value = 0.28;
      const delayFilter = this.audioContext.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 1350;

      // Routing
      this.padGain.connect(padFilter);
      this.chimeGain.connect(this.masterGain);
      this.droneGain.connect(this.masterGain);
      
      padFilter.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(feedback);
      feedback.connect(delay);
      delayFilter.connect(this.masterGain);

      this.masterGain.connect(masterFilter);
      masterFilter.connect(this.audioContext.destination);

      this.createDroneLayer();
      this.createPadLayer();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private createDroneLayer() {
    if (!this.audioContext || !this.droneGain) return;

    // Deep sub drone
    const drone1 = this.audioContext.createOscillator();
    drone1.type = 'sine';
    drone1.frequency.value = 41.2; // E1-ish low

    const drone2 = this.audioContext.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 55.0;

    const droneGainNode = this.audioContext.createGain();
    droneGainNode.gain.value = 0.6;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;

    drone1.connect(droneGainNode);
    drone2.connect(droneGainNode);
    droneGainNode.connect(filter);
    filter.connect(this.droneGain);

    drone1.start();
    drone2.start();

    this.oscillators.push(drone1, drone2);
    this.filters.push(filter);
  }

  private createPadLayer() {
    if (!this.audioContext || !this.padGain) return;

    // Create soft evolving pad chords
    const chordNotes = [261.63, 329.63, 392.0, 523.25]; // Cmaj7-ish

    chordNotes.forEach((freq, i) => {
      if (!this.audioContext || !this.padGain) return;

      const osc = this.audioContext.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq * (i === 3 ? 2 : 1);

      const gain = this.audioContext.createGain();
      gain.gain.value = 0.0; // Will be modulated

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 620 + i * 80;

      const pan = this.audioContext.createStereoPanner();
      pan.pan.value = (i - 1.5) * 0.6;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(pan);
      pan.connect(this.padGain);

      osc.start();

      this.oscillators.push(osc);
      this.filters.push(filter);

      // Gentle movement of volume over long time
      setTimeout(() => {
        if (gain) {
          this.animateGain(gain, 0.12 + Math.random() * 0.06, 18000 + i * 4200);
        }
      }, 240 + i * 900);
    });
  }

  private animateGain(gainNode: GainNode, target: number, duration: number) {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.linearRampToValueAtTime(target, now + duration / 1000);
  }

  play() {
    if (!this.audioContext) this.init();
    if (!this.audioContext || this.isPlaying) return;

    // Resume context if suspended (autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;

    // Fade in master
    if (this.masterGain) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0.82, now + 4.2);
    }

    // Start soft random chimes
    this.startChimeLoop();
  }

  private startChimeLoop() {
    const scheduleNext = () => {
      if (!this.isPlaying) return;

      const delay = this.phase === 'finale' ? 4200 + Math.random() * 5800 : 6800 + Math.random() * 9200;
      
      const id = setTimeout(() => {
        this.playChime();
        scheduleNext();
      }, delay);

      this.intervalIds.push(id);
    };

    // Initial chime after a moment
    const initial = setTimeout(() => this.playChime(), 4200);
    this.intervalIds.push(initial);
    scheduleNext();
  }

  private playChime() {
    if (!this.audioContext || !this.chimeGain || !this.isPlaying) return;

    const note = this.NOTES[Math.floor(Math.random() * this.NOTES.length)];
    const octave = Math.random() > 0.6 ? 2 : 1;

    const osc = this.audioContext.createOscillator();
    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    osc.frequency.value = note * octave;

    const gain = this.audioContext.createGain();
    gain.gain.value = 0.0;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1650;

    const pan = this.audioContext.createStereoPanner();
    pan.pan.value = (Math.random() - 0.5) * 1.6;

    // Envelope
    const now = this.audioContext.currentTime;
    gain.gain.linearRampToValueAtTime(0.65, now + 0.04);
    gain.gain.linearRampToValueAtTime(0.0001, now + 3.8 + Math.random() * 2.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(this.chimeGain);

    osc.start(now);
    osc.stop(now + 7);

    // Occasional higher harmonic sparkle
    if (Math.random() > 0.7) {
      setTimeout(() => {
        if (!this.audioContext || !this.chimeGain) return;
        const sparkle = this.audioContext.createOscillator();
        sparkle.type = 'sine';
        sparkle.frequency.value = note * 4.02;

        const sg = this.audioContext.createGain();
        sg.gain.value = 0.0;

        const now2 = this.audioContext.currentTime;
        sg.gain.linearRampToValueAtTime(0.18, now2 + 0.015);
        sg.gain.linearRampToValueAtTime(0.0001, now2 + 1.4);

        sparkle.connect(sg);
        sg.connect(this.chimeGain);
        sparkle.start(now2);
        sparkle.stop(now2 + 2.2);
      }, 180);
    }
  }

  setPhase(newPhase: 'landing' | 'journey' | 'finale') {
    this.phase = newPhase;
    
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    
    if (newPhase === 'journey') {
      this.masterGain.gain.linearRampToValueAtTime(0.94, now + 2.8);
      // Boost pads slightly
      if (this.padGain) this.padGain.gain.linearRampToValueAtTime(0.68, now + 3.5);
    } else if (newPhase === 'finale') {
      this.masterGain.gain.linearRampToValueAtTime(1.0, now + 4);
      if (this.padGain) this.padGain.gain.linearRampToValueAtTime(0.78, now + 5);
      // Trigger a special resonant chime sequence
      setTimeout(() => this.playChime(), 400);
      setTimeout(() => this.playChime(), 1450);
    }
  }

  fadeOut(duration = 2200) {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0.001, now + duration / 1000);

    setTimeout(() => {
      this.stop();
    }, duration + 80);
  }

  stop() {
    this.isPlaying = false;
    this.intervalIds.forEach(clearTimeout);
    this.intervalIds = [];

    this.oscillators.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.oscillators = [];
    this.filters = [];
    this.noises = [];

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
    this.padGain = null;
    this.chimeGain = null;
    this.droneGain = null;
  }

  setVolume(vol: number) {
    if (this.masterGain && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(Math.max(0.01, Math.min(1, vol)), now + 0.6);
    }
  }
}

// Singleton instance
export const fantasyMusic = new FantasyMusic();