import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Decor } from '../decor/decor';
import { CENTER_PHOTO, ORBIT_PHOTOS } from '../photos';
import { SoundToggle } from '../sound/sound-toggle';
import { SoundService } from '../sound/sound.service';

@Component({
  selector: 'app-home',
  imports: [Decor, SoundToggle],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly router = inject(Router);
  protected readonly sound = inject(SoundService);

  protected readonly name = signal('Pao Margarita');

  /** Foto central: public/photos/Central.jpg */
  protected readonly centerPhoto = CENTER_PHOTO;

  /** 8 fotos que giran (ver photos.ts) */
  protected readonly orbitPhotos = ORBIT_PHOTOS;

  protected readonly emojis = ['🎂', '🎈', '🎁', '🎉', '🥳', '🍰', '✨', '🎊'];

  /** Título dividido en palabras y letras para animar cada letra por separado. */
  protected readonly titleWords = computed(() => {
    let index = 0;
    return `¡Feliz Cumpleaños, ${this.name()}!`.split(' ').map((word) => ({
      letters: [...word].map((char) => ({ char, i: index++ }))
    }));
  });

  /** Fotos que no se pudieron cargar (se muestra un marcador de posición). */
  protected readonly failed = signal<ReadonlySet<string>>(new Set());

  /** true mientras el sobre se está abriendo (antes de cambiar de pantalla). */
  protected readonly opening = signal(false);

  /** Piezas de la explosión de confeti (vacío cuando no hay explosión). */
  protected readonly burst = signal<{ dx: number; dy: number; rot: number; delay: number; emoji: string }[]>([]);

  private burstTimer?: ReturnType<typeof setTimeout>;

  protected markFailed(src: string): void {
    this.failed.update((s) => new Set(s).add(src));
  }

  /** Clic en la foto central: música de cumpleaños + explosión de confeti. */
  protected celebrate(): void {
    this.sound.horn();
    this.sound.melody();
    const emojis = ['🎉', '🎊', '✨', '🎈', '⭐', '🎁'];
    this.burst.set(
      Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 35 + Math.random() * 25; // % del tamaño del escenario
        return {
          dx: Math.round(Math.cos(angle) * dist),
          dy: Math.round(Math.sin(angle) * dist),
          rot: Math.round((Math.random() - 0.5) * 720),
          delay: +(Math.random() * 0.2).toFixed(2),
          emoji: emojis[i % emojis.length]
        };
      })
    );
    clearTimeout(this.burstTimer);
    this.burstTimer = setTimeout(() => this.burst.set([]), 2600);
  }

  protected openLetter(): void {
    if (this.opening()) return;
    this.opening.set(true);
    this.sound.whoosh();
    setTimeout(() => this.sound.sparkle(), 450);
    setTimeout(() => this.router.navigate(['/carta']), 800);
  }
}
