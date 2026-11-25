import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Dog, DogSpec } from '../dog/dog';
import { SoundService } from '../sound/sound.service';

/** Pantalla inicial: una sala con un regalo sobre la mesa y 4 perritos de caricatura alrededor. */
@Component({
  selector: 'app-gift',
  imports: [Dog],
  templateUrl: './gift.html',
  host: { class: 'block' }
})
export class Gift implements OnDestroy {
  private readonly router = inject(Router);
  private readonly sound = inject(SoundService);
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  private readonly dogs: DogSpec[] = [
    { name: 'Perrito café', fur: '#8a5a44', belly: '#b98a6f', ear: '#5b3626', nose: '#2b1b17', collar: '#38bdf8', style: 'lab' },
    { name: 'Perrito peludo', fur: '#c79a62', belly: '#e6cfa3', ear: '#9c7444', nose: '#2b1b17', collar: '#22c55e', style: 'shaggy' },
    { name: 'Perrito blanco', fur: '#f6f3ef', belly: '#ffffff', ear: '#ecd0ca', nose: '#2b2b33', collar: '#f472b6', style: 'fold' },
    { name: 'Perrito crema', fur: '#f0e0c0', belly: '#fcf5e2', ear: '#e0c99b', nose: '#2b1b17', collar: '#ef4444', style: 'fluffy', bandana: true }
  ];

  protected readonly dogsLeft = this.dogs.slice(0, 2).map((spec, k) => ({ spec, k }));
  protected readonly dogsRight = this.dogs.slice(2).map((spec, k) => ({ spec, k: k + 2 }));

  /** Foquitos colgantes: se calculan sobre dos guirnaldas que cuelgan del techo. */
  protected readonly bulbs = (() => {
    const colors = ['#fde047', '#ff9ad5', '#fb923c', '#7dd3fc', '#86efac'];
    const n = 20;
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n;
      const seg = (t * 2) % 1;
      // Curva de la guirnalda: 0 en los extremos de cada tramo y 12 (de 24) en el centro.
      const y = 2 * seg * (1 - seg) * 24;
      return { x: t * 100, y: y / 10, c: colors[i % colors.length], d: -(i % 5) * 0.7 };
    });
  })();

  /** Motas de polvo que flotan en el rayo de luz de la ventana. */
  protected readonly motes = Array.from({ length: 10 }, (_, i) => ({
    x: 8 + ((i * 7) % 26),
    y: 20 + ((i * 11) % 48),
    s: 3 + (i % 3),
    dur: 7 + (i % 4) * 2,
    d: -(i * 1.3)
  }));

  /** Libros del estante. */
  protected readonly books = ['#ef4444', '#fde047', '#38bdf8', '#a3e635', '#f472b6', '#fb923c'];

  /** true mientras el regalo se abre (antes de cambiar de pantalla). */
  protected readonly opening = signal(false);

  protected open(): void {
    if (this.opening()) return;
    this.opening.set(true);
    this.sound.whoosh();
    this.timers.push(setTimeout(() => this.sound.sparkle(), 650));
    this.timers.push(setTimeout(() => this.sound.tada(), 1000));
    this.timers.push(setTimeout(() => this.router.navigate(['/fiesta']), 1900));
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }
}
