import { Injectable, signal } from '@angular/core';

type ToneOpts = { type?: OscillatorType; vol?: number; to?: number; attack?: number; dest?: AudioNode };
type NoiseOpts = { vol?: number; from?: number; to?: number; filter?: BiquadFilterType; dest?: AudioNode };

/** Frecuencia de una nota MIDI. */
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

/** Ambiente de la música de fondo (cambia según la pantalla). */
export type Mood = 'party' | 'tender' | 'secret';

/**
 * Progresiones (raíz MIDI, tercera) y velocidad de cada ambiente:
 *  - party:  C – G – Am – F, alegre y bailable (118 bpm).
 *  - tender: C – Am – F – G, caja de música suave para leer la carta (78 bpm).
 *  - secret: Am – F – G – E, pícaro y misterioso para la pista del regalo (108 bpm).
 */
const MOODS: Record<Mood, { prog: [number, number][]; eighth: number }> = {
  party: {
    prog: [[48, 4], [43, 4], [45, 3], [41, 4]],
    eighth: 60 / 118 / 2
  },
  tender: {
    prog: [[48, 4], [45, 3], [41, 4], [43, 4]],
    eighth: 60 / 78 / 2
  },
  secret: {
    prog: [[45, 3], [41, 4], [43, 4], [40, 4]],
    eighth: 60 / 108 / 2
  }
};
const MUSIC_VOL = 0.3;
const MUSIC_FILE = 'music/fiesta.mp3';

/**
 * Efectos de sonido sintetizados con Web Audio (no necesita archivos de audio).
 * Los navegadores solo permiten sonido después de que el usuario interactúa con la página,
 * por eso el audio se "desbloquea" con el primer clic o tecla.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  /** Efectos de sonido. */
  readonly enabled = signal(this.readPref('bd-sound'));
  /** Música de fondo. */
  readonly musicEnabled = signal(this.readPref('bd-music'));

  private ctx?: AudioContext;
  private master?: GainNode;
  private musicGain?: GainNode;
  private unlocked = false;
  private melodyUntil = 0;

  // Música de fondo
  private mood: Mood = 'party';
  private musicRunning = false;
  private musicTimer?: ReturnType<typeof setInterval>;
  private nextTime = 0;
  private step = 0;
  private fileAudio?: HTMLAudioElement;
  private fileBad = false;
  private duckTimer?: ReturnType<typeof setTimeout>;
  private ducked = false;

  constructor() {
    if (typeof window === 'undefined') return;
    const unlock = (e: Event) => this.unlock(e);
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    // Pausa todo cuando la pestaña no está visible.
    document.addEventListener('visibilitychange', () => {
      if (!this.unlocked || !this.ctx) return;
      if (document.hidden) {
        void this.ctx.suspend();
        this.fileAudio?.pause();
      } else {
        void this.ctx.resume();
        if (this.musicRunning && this.fileAudio && !this.fileBad && this.mood === 'party') {
          void this.fileAudio.play().catch(() => undefined);
        }
      }
    });
    // Sonidito suave al tocar cualquier botón o enlace.
    window.addEventListener(
      'pointerdown',
      (e) => {
        if (!this.unlocked) return;
        if ((e.target as Element | null)?.closest?.('button, a, [role="button"]')) this.click();
      },
      { capture: true }
    );
  }

  /** Cambia el ambiente de la música de fondo (con otra melodía y velocidad). */
  setMood(mood: Mood): void {
    if (mood === this.mood) return;
    this.mood = mood;
    if (this.musicRunning && this.ctx) this.playSource();
  }

  toggleMusic(): void {
    this.musicEnabled.update((v) => !v);
    this.savePref('bd-music', this.musicEnabled());
    if (this.musicEnabled()) this.startMusic();
    else this.stopMusic();
  }

  toggle(): void {
    this.enabled.update((v) => !v);
    this.savePref('bd-sound', this.enabled());
    if (this.enabled()) this.chime();
  }

  // ---------- Efectos ----------

  /** Globo que explota / clic en una foto. */
  pop(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, 650, t, 0.12, { to: 140, vol: 0.28 });
    this.noise(c, t, 0.08, { vol: 0.25, from: 3000, to: 800 });
  }

  /** Cosquilleo suave al pasar el mouse por una foto. */
  bloop(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, 480, t, 0.1, { to: 900, vol: 0.1 });
  }

  /** Campanita. */
  chime(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, 1319, t, 0.6, { vol: 0.14 });
    this.tone(c, 1760, t + 0.07, 0.7, { vol: 0.1 });
  }

  /** Arpegio brillante ascendente. */
  sparkle(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    [1047, 1319, 1568, 2093, 2637].forEach((f, i) =>
      this.tone(c, f, t + i * 0.07, 0.35, { type: 'triangle', vol: 0.13 })
    );
  }

  /** Aire al abrir el sobre. */
  whoosh(): void {
    const c = this.ready();
    if (!c) return;
    this.noise(c, c.currentTime, 0.7, { vol: 0.3, from: 300, to: 3500, filter: 'bandpass' });
  }

  /** Cornetita de fiesta. */
  horn(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, 330, t, 0.18, { type: 'sawtooth', vol: 0.12, to: 420 });
    this.tone(c, 440, t + 0.2, 0.45, { type: 'sawtooth', vol: 0.12, to: 660 });
    this.noise(c, t + 0.2, 0.15, { vol: 0.2, from: 4000, to: 1500 });
  }

  /** Fanfarria final. */
  tada(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    [523, 659, 784].forEach((f) => this.tone(c, f, t, 0.5, { type: 'triangle', vol: 0.14 }));
    [1047, 1319].forEach((f) => this.tone(c, f, t + 0.18, 0.9, { type: 'triangle', vol: 0.14 }));
    this.noise(c, t + 0.18, 0.2, { vol: 0.15, from: 5000, to: 2000 });
  }

  /** Tecla de máquina de escribir. */
  tick(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, 1500 + Math.random() * 700, t, 0.03, { type: 'square', vol: 0.025, attack: 0.002 });
  }

  /** Clic suave de botón. */
  click(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, 760, t, 0.08, { type: 'triangle', vol: 0.09, to: 1250, attack: 0.004 });
  }

  /** Papel que se desliza (cartel que aparece). */
  paper(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.noise(c, t, 0.22, { vol: 0.16, from: 6500, to: 2500, filter: 'highpass' });
    this.noise(c, t + 0.13, 0.18, { vol: 0.12, from: 5500, to: 3000, filter: 'highpass' });
  }

  /** Redoble de tambor (dura `seconds`). */
  drumroll(seconds = 1): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    const hits = Math.floor(seconds / 0.045);
    for (let i = 0; i < hits; i++) {
      const k = i / hits;
      this.noise(c, t + i * 0.045, 0.05, { vol: 0.05 + k * 0.17, from: 260, to: 180, filter: 'bandpass' });
    }
    this.noise(c, t + hits * 0.045, 0.6, { vol: 0.2, from: 7000, to: 3000, filter: 'highpass' });
  }

  /** Trompetas de "¡ta-ta-taaan!" al revelar el secreto. */
  reveal(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    const brass = (f: number, at: number, d: number) => {
      this.tone(c, f, t + at, d, { type: 'sawtooth', vol: 0.09, attack: 0.03 });
      this.tone(c, f * 2, t + at, d, { type: 'square', vol: 0.03, attack: 0.03 });
    };
    brass(392, 0, 0.16);
    brass(392, 0.17, 0.16);
    brass(523, 0.34, 0.2);
    brass(659, 0.56, 0.9);
    brass(784, 0.56, 0.9);
    this.noise(c, t + 0.56, 0.5, { vol: 0.18, from: 7000, to: 3500, filter: 'highpass' });
    [1319, 1568, 2093, 2637].forEach((f, i) => this.tone(c, f, t + 0.7 + i * 0.08, 0.5, { type: 'triangle', vol: 0.07 }));
  }

  /** Boing de resorte. */
  boing(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, 160, t, 0.2, { to: 720, vol: 0.22 });
    this.tone(c, 720, t + 0.2, 0.3, { to: 210, vol: 0.2 });
    this.tone(c, 300, t, 0.45, { type: 'triangle', to: 500, vol: 0.07 });
  }

  /** Subir por un tubo, al estilo de los videojuegos. */
  pipe(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    [196, 262, 330, 392, 523, 659].forEach((f, i) =>
      this.tone(c, f, t + i * 0.055, 0.1, { type: 'square', vol: 0.07, attack: 0.005 })
    );
    this.noise(c, t, 0.4, { vol: 0.12, from: 200, to: 1200, filter: 'bandpass' });
  }

  /** Chillido cómico. */
  squeak(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    this.tone(c, 1300, t, 0.09, { type: 'triangle', to: 2300, vol: 0.14, attack: 0.005 });
    this.tone(c, 2000, t + 0.1, 0.1, { type: 'triangle', to: 1500, vol: 0.12, attack: 0.005 });
  }

  /** Trombón triste: "wah wah wah waaah". */
  sadTrombone(): void {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    const notes: [number, number, number][] = [
      [311, 0, 0.3],
      [294, 0.32, 0.3],
      [277, 0.64, 0.3],
      [262, 0.96, 0.9]
    ];
    notes.forEach(([f, at, d], i) => {
      const last = i === notes.length - 1;
      this.tone(c, f, t + at, d, { type: 'sawtooth', vol: 0.1, attack: 0.04, to: last ? f * 0.82 : undefined });
      this.tone(c, f / 2, t + at, d, { type: 'triangle', vol: 0.06, attack: 0.04 });
    });
    this.duck(1900);
  }

  /** "Cumpleaños feliz". */
  melody(): void {
    const c = this.ready();
    if (!c || c.currentTime < this.melodyUntil) return;
    const beat = 0.4;
    // [frecuencia, duración en tiempos]
    const notes: [number, number][] = [
      [392, 0.75], [392, 0.25], [440, 1], [392, 1], [523, 1], [494, 2],
      [392, 0.75], [392, 0.25], [440, 1], [392, 1], [587, 1], [523, 2],
      [392, 0.75], [392, 0.25], [784, 1], [659, 1], [523, 1], [494, 1], [440, 1.5],
      [698, 0.75], [698, 0.25], [659, 1], [523, 1], [587, 1], [523, 2]
    ];
    let t = c.currentTime + 0.05;
    for (const [f, d] of notes) {
      this.tone(c, f, t, d * beat * 0.95, { type: 'triangle', vol: 0.2, attack: 0.02 });
      this.tone(c, f * 2, t, d * beat * 0.6, { type: 'sine', vol: 0.05, attack: 0.02 });
      t += d * beat;
    }
    this.melodyUntil = t;
    this.duck((t - c.currentTime) * 1000);
  }

  // ---------- Música de fondo ----------

  /**
   * Música en bucle. Si existe el archivo public/music/fiesta.mp3 se usa ese;
   * si no, suena una melodía alegre generada por el navegador.
   */
  private startMusic(): void {
    if (!this.unlocked || !this.ctx || !this.musicGain || !this.musicEnabled() || this.musicRunning) return;
    this.musicRunning = true;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.setTargetAtTime(this.ducked ? 0.25 : 1, this.ctx.currentTime, 0.3);
    this.playSource();
  }

  /**
   * Elige la fuente de la música según el ambiente: el mp3 (si existe) solo para "party";
   * los demás ambientes siempre usan el sintetizador.
   */
  private playSource(): void {
    if (this.mood === 'party' && !this.fileBad) {
      this.stopSynth();
      if (!this.fileAudio) {
        const a = new Audio(MUSIC_FILE);
        a.loop = true;
        a.volume = 0.45;
        a.addEventListener('error', () => {
          this.fileBad = true;
          if (this.musicRunning) this.playSource();
        });
        this.fileAudio = a;
      }
      void this.fileAudio.play().catch(() => undefined);
    } else {
      this.fileAudio?.pause();
      this.stopSynth();
      this.startSynth();
    }
  }

  private stopMusic(): void {
    this.musicRunning = false;
    this.fileAudio?.pause();
    this.stopSynth();
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  private stopSynth(): void {
    clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }


  /** Baja la música mientras suena la melodía de "Cumpleaños feliz". */
  private duck(ms: number): void {
    if (!this.ctx || !this.musicGain) return;
    this.ducked = true;
    if (this.musicRunning) this.musicGain.gain.setTargetAtTime(0.2, this.ctx.currentTime, 0.1);
    if (this.fileAudio) this.fileAudio.volume = 0.1;
    clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      this.ducked = false;
      if (this.ctx && this.musicGain && this.musicRunning) {
        this.musicGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.4);
      }
      if (this.fileAudio) this.fileAudio.volume = 0.45;
    }, ms + 300);
  }

  private startSynth(): void {
    if (this.musicTimer || !this.ctx) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    const tick = () => {
      const c = this.ctx;
      if (!c || !this.musicRunning) return;
      while (this.nextTime < c.currentTime + 0.4) {
        this.scheduleStep(c, this.step, this.nextTime);
        this.nextTime += MOODS[this.mood].eighth;
        this.step = (this.step + 1) % (MOODS[this.mood].prog.length * 8);
      }
    };
    tick();
    this.musicTimer = setInterval(tick, 100);
  }

  /** Una corchea de la canción, según el ambiente actual. */
  private scheduleStep(c: AudioContext, s: number, t: number): void {
    const { prog, eighth } = MOODS[this.mood];
    const [root, third] = prog[Math.floor(s / 8)];
    const e = s % 8;
    const chord = [root, root + third, root + 7];
    if (this.mood === 'tender') this.tenderStep(c, t, e, root, chord, eighth);
    else if (this.mood === 'secret') this.secretStep(c, t, e, root, chord, eighth);
    else this.partyStep(c, t, e, root, chord, eighth);
  }

  /** Caja de música: acordes suaves y arpegio cristalino. */
  private tenderStep(c: AudioContext, t: number, e: number, root: number, chord: number[], eighth: number): void {
    const dest = this.musicGain!;
    if (e === 0) {
      chord.forEach((n) => this.tone(c, midi(n + 12), t, eighth * 7.5, { vol: 0.05, attack: 0.5, dest }));
      this.tone(c, midi(root), t, eighth * 4, { vol: 0.22, attack: 0.03, dest });
    } else if (e === 4) {
      this.tone(c, midi(root + 7), t, eighth * 3, { vol: 0.1, attack: 0.03, dest });
    }
    const idx = [0, 1, 2, 1, 3, 2, 1, 2][e];
    const note = idx < 3 ? chord[idx] + 24 : chord[0] + 36;
    this.tone(c, midi(note), t, eighth * 2.4, { type: 'triangle', vol: 0.1, attack: 0.004, dest });
    this.tone(c, midi(note + 12), t, eighth * 1.2, { vol: 0.03, attack: 0.004, dest });
  }

  /** Pícaro: bajo pizzicato, maderitas y notas cortas "de puntillas". */
  private secretStep(c: AudioContext, t: number, e: number, root: number, chord: number[], eighth: number): void {
    const dest = this.musicGain!;
    if (e === 0 || e === 3 || e === 6) {
      const n = e === 3 ? root + 7 : root;
      this.tone(c, midi(n), t, eighth * 0.9, { type: 'triangle', vol: 0.32, attack: 0.005, dest });
    }
    if (e % 2 === 1) {
      this.tone(c, e === 5 ? 1500 : 1150, t, 0.035, { type: 'square', vol: 0.04, attack: 0.002, dest });
    }
    if (e === 4) this.noise(c, t, 0.06, { vol: 0.1, from: 2500, to: 1500, dest });
    const mel = [2, -1, 1, 3, -1, 1, -1, 2][e];
    if (mel >= 0) {
      const note = mel < 3 ? chord[mel] + 24 : chord[0] + 36;
      this.tone(c, midi(note), t, eighth * 0.7, { vol: 0.12, attack: 0.004, dest });
    }
  }

  /** Fiesta: bajo, bombo, palmas, acordes y arpegio brillante. */
  private partyStep(c: AudioContext, t: number, e: number, root: number, chord: number[], eighth: number): void {
    const dest = this.musicGain!;

    // Bajo y bombo
    if (e % 4 === 0) {
      this.tone(c, midi(root), t, eighth * 3.5, { type: 'triangle', vol: 0.3, dest });
      this.tone(c, 150, t, 0.16, { to: 45, vol: 0.4, dest });
    } else if (e === 6) {
      this.tone(c, midi(root + 7), t, eighth * 1.8, { type: 'triangle', vol: 0.22, dest });
    }
    // Palmas y platillo
    if (e === 2 || e === 6) this.noise(c, t, 0.09, { vol: 0.12, from: 1800, to: 1200, dest });
    if (e % 2 === 1) this.noise(c, t, 0.04, { vol: 0.05, from: 7000, filter: 'highpass', dest });
    // Acordes a contratiempo
    if (e === 2 || e === 6) {
      chord.forEach((n) => this.tone(c, midi(n + 12), t, eighth * 1.6, { type: 'triangle', vol: 0.06, dest }));
    }
    // Arpegio brillante
    const pattern = [0, 1, 2, 3, 2, 1, 2, 4];
    const idx = pattern[e];
    const note = idx < 3 ? chord[idx] + 24 : idx === 3 ? chord[0] + 36 : chord[1] + 36;
    this.tone(c, midi(note), t, eighth * 1.6, { type: 'sine', vol: 0.11, attack: 0.005, dest });
  }

  // ---------- Internos ----------

  private unlock(e: Event): void {
    if (this.unlocked) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 1;
    const musicLevel = this.ctx.createGain();
    musicLevel.gain.value = MUSIC_VOL;
    this.musicGain.connect(musicLevel).connect(this.master);
    void this.ctx.resume();
    this.unlocked = true;

    // Cornetita de bienvenida, salvo que el primer clic ya sea sobre algo interactivo.
    const target = e.target as Element | null;
    if (!target?.closest?.('button, a, .photo')) this.horn();
    this.startMusic();
  }

  private ready(): AudioContext | undefined {
    if (!this.enabled() || !this.unlocked || !this.ctx || !this.master) return undefined;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(c: AudioContext, freq: number, t: number, dur: number, o: ToneOpts = {}): void {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.2, t + (o.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(o.dest ?? this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(c: AudioContext, t: number, dur: number, o: NoiseOpts = {}): void {
    const buffer = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = o.filter ?? 'bandpass';
    filter.frequency.setValueAtTime(o.from ?? 1000, t);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.2, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(o.dest ?? this.master!);
    src.start(t);
  }

  private readPref(key: string): boolean {
    try {
      return localStorage.getItem(key) !== '0';
    } catch {
      return true;
    }
  }

  private savePref(key: string, value: boolean): void {
    try {
      localStorage.setItem(key, value ? '1' : '0');
    } catch {
      /* sin almacenamiento disponible */
    }
  }
}
