import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject, output, signal } from '@angular/core';
import { SoundService } from '../sound/sound.service';
import { GIFT_HINT } from './hint';

/**
 * Ventana con "Tubo": un tubo plateado, liso e inexpresivo, que sale de la tierra
 * y sostiene un cartelito con las instrucciones para encontrar el regalo.
 */
@Component({
  selector: 'app-hint-modal',
  templateUrl: './hint-modal.html',
  styleUrl: './hint-modal.css'
})
export class HintModal implements OnInit, OnDestroy {
  protected readonly sound = inject(SoundService);
  protected readonly hint = GIFT_HINT;

  /** Se emite cuando la ventana termina de cerrarse. */
  readonly closed = output<void>();

  @ViewChild('okBtn') private okBtn?: ElementRef<HTMLButtonElement>;

  /** 0 = nada, 1 = Tubo sale, 2 = aparece el cartel. */
  protected readonly stage = signal(0);
  protected readonly shownSteps = signal(0);
  protected readonly done = signal(false);
  protected readonly closing = signal(false);

  /** Confeti que cae cuando se termina de leer la pista. */
  protected readonly confetti = Array.from({ length: 22 }, (_, i) => ({
    x: Math.round((i / 22) * 100 + (i % 3) * 2),
    d: +((i * 0.13) % 1.6).toFixed(2),
    dur: +(2.2 + (i % 5) * 0.35).toFixed(2),
    e: ['🎉', '🎊', '✨', '🎈', '⭐', '💚'][i % 6]
  }));

  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    const at = (ms: number, fn: () => void) => this.timers.push(setTimeout(fn, ms));

    this.sound.pipe();
    at(300, () => this.stage.set(1));
    at(1250, () => {
      this.stage.set(2);
      this.sound.paper();
    });

    // Las instrucciones aparecen una por una.
    const total = this.hint.steps.length;
    for (let i = 0; i < total; i++) {
      at(2000 + i * 1100, () => {
        this.shownSteps.set(i + 1);
        this.sound.pop();
      });
    }
    at(2000 + total * 1100 + 300, () => {
      this.done.set(true);
      this.sound.reveal();
      this.okBtn?.nativeElement.focus();
    });
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    if (this.closing()) return;
    this.closing.set(true);
    this.sound.pop();
    this.timers.push(setTimeout(() => this.closed.emit(), 260));
  }
}
