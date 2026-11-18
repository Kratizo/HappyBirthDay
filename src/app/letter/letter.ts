import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Decor } from '../decor/decor';
import { LETTER_PHOTOS } from '../photos';
import { SoundToggle } from '../sound/sound-toggle';
import { SoundService } from '../sound/sound.service';
import { DEDICATION } from './dedication';

@Component({
  selector: 'app-letter',
  imports: [RouterLink, SoundToggle, Decor],
  templateUrl: './letter.html',
  styleUrl: './letter.css'
})
export class Letter implements OnInit, OnDestroy {
  protected readonly sound = inject(SoundService);
  protected readonly dedication = DEDICATION;

  protected readonly envelopeOpen = signal(false);
  protected readonly typed = signal('');
  protected readonly done = signal(false);

  /**
   * Fotos dispersas alrededor de la carta (ver photos.ts)
   * (left/top en %, rot = giro, scale = tamaño relativo, delay = retraso de aparición).
   */
  protected readonly frames = [
    { left: '3%', top: '10%', rot: '-8deg', scale: 1.0, delay: '1.0s', emoji: '🎈' },
    { left: '15%', top: '30%', rot: '6deg', scale: 0.8, delay: '1.2s', emoji: '🎁' },
    { left: '4%', top: '48%', rot: '-4deg', scale: 1.1, delay: '1.4s', emoji: '🥳' },
    { left: '16%', top: '66%', rot: '9deg', scale: 0.85, delay: '1.6s', emoji: '🍰' },
    { left: '5%', top: '82%', rot: '-10deg', scale: 0.95, delay: '1.8s', emoji: '🎉' },
    { left: '77%', top: '8%', rot: '7deg', scale: 0.9, delay: '1.1s', emoji: '🎂' },
    { left: '84%', top: '28%', rot: '-6deg', scale: 1.05, delay: '1.3s', emoji: '✨' },
    { left: '79%', top: '47%', rot: '8deg', scale: 0.85, delay: '1.5s', emoji: '🎊' },
    { left: '83%', top: '65%', rot: '-9deg', scale: 1.0, delay: '1.7s', emoji: '🎈' },
    { left: '78%', top: '82%', rot: '5deg', scale: 0.9, delay: '1.9s', emoji: '🎁' }
  ].map((f, i) => ({ ...f, src: LETTER_PHOTOS[i] }));

  /** Globos que suben desde abajo con frases típicas de la cumpleañera. */
  protected readonly balloons = [
    { text: 'Que es una pendejada!', color: '#ef4444', x: 6, xs: 3, s: 1.1, dur: 17, delay: 1 },
    { text: '¿Como asi? 🍰', color: '#f59e0b', x: 20, xs: 14, s: 1.0, dur: 20, delay: 4 },
    { text: 'Mi nombre es Paola, no paula', color: '#10b981', x: 33, xs: 80, s: 1.15, dur: 16, delay: 7 },
    { text: 'Que me cae mal la gente sapa 🐸', color: '#3b82f6', x: 46, xs: 90, s: 1.0, dur: 21, delay: 2 },
    { text: 'Mmm Pollo spicy 🤤', color: '#ec4899', x: 58, xs: 8, s: 1.05, dur: 18, delay: 9 },
    { text: 'Yo hablo si me hablan 💅🏽', color: '#8b5cf6', x: 70, xs: 85, s: 1.1, dur: 19, delay: 5 },
    { text: '¡Feliz Cumpleaños, Pao Margarita! ✨', color: '#14b8a6', x: 82, xs: 18, s: 0.95, dur: 15, delay: 11 },
    { text: 'No me pasa nada 🫩', color: '#f97316', x: 92, xs: 94, s: 1.0, dur: 22, delay: 3 },
    { text: 'Nunca decis nada 😡', color: '#e11d48', x: 12, xs: 76, s: 1.15, dur: 18, delay: 13 },
    { text: '¿Que recibo? 😳', color: '#2563eb', x: 27, xs: 5, s: 1.0, dur: 20, delay: 15 },
    { text: 'Ya me caiste mal', color: '#d946ef', x: 52, xs: 88, s: 1.05, dur: 17, delay: 17 },
    { text: 'Hoy mando yo 👑', color: '#eab308', x: 76, xs: 12, s: 0.95, dur: 19, delay: 8 },
    { text: 'Mi favorito arroz con pollo 🤤', color: '#06b6d4', x: 40, xs: 82, s: 1.1, dur: 23, delay: 19 },
    { text: '¡Yo seguire adelante!', color: '#84cc16', x: 64, xs: 2, s: 1.0, dur: 16, delay: 12 }
  ];

  protected readonly failed = signal<ReadonlySet<string>>(new Set());

  protected markFailed(src: string): void {
    this.failed.update((s) => new Set(s).add(src));
  }

  private readonly fullText = `${DEDICATION.to}\n\n${DEDICATION.body}\n\n${DEDICATION.from}`;
  private readonly timers: ReturnType<typeof setTimeout>[] = [];
  private interval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // 1) se abre el sobre, 2) sale la carta, 3) se escribe el texto
    this.timers.push(
      setTimeout(() => {
        this.envelopeOpen.set(true);
        this.sound.whoosh();
      }, 200)
    );
    this.timers.push(setTimeout(() => this.sound.sparkle(), 800));
    this.timers.push(setTimeout(() => this.startTyping(), 1800));
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    clearInterval(this.interval);
  }

  /** Un clic en la carta muestra todo el texto de inmediato. */
  protected skip(): void {
    if (this.done()) return;
    clearInterval(this.interval);
    this.typed.set(this.fullText);
    this.done.set(true);
    this.sound.tada();
  }

  private startTyping(): void {
    let i = 0;
    this.interval = setInterval(() => {
      i++;
      this.typed.set(this.fullText.slice(0, i));
      if (this.fullText[i - 1].trim()) this.sound.tick();
      if (i >= this.fullText.length) {
        clearInterval(this.interval);
        this.done.set(true);
        this.sound.tada();
      }
    }, 55);
  }
}
