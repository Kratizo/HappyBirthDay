import { Component } from '@angular/core';

/** Generador pseudoaleatorio con semilla (resultados estables en cada carga). */
function rng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLORS = ['#ef4444', '#f59e0b', '#fde047', '#22c55e', '#38bdf8', '#a78bfa', '#f472b6', '#ffffff'];

/** Decoración de fondo de la fiesta: rayos, banderines, estrellas, confeti y globos. */
@Component({
  selector: 'app-party-decor',
  templateUrl: './decor.html',
  host: { class: 'absolute inset-0 z-0 overflow-hidden pointer-events-none' }
})
export class Decor {
  protected readonly flags = Array.from({ length: 18 }, (_, i) => COLORS[i % 7]);

  protected readonly stars = (() => {
    const r = rng(7);
    return Array.from({ length: 28 }, () => ({
      x: Math.round(r() * 100),
      y: Math.round(r() * 100),
      size: +(0.6 + r() * 1.1).toFixed(2),
      dur: +(1.5 + r() * 2.5).toFixed(2),
      delay: +(-r() * 4).toFixed(2)
    }));
  })();

  protected readonly pieces = (() => {
    const r = rng(21);
    return Array.from({ length: 44 }, () => {
      const dur = 6 + r() * 7;
      return {
        x: Math.round(r() * 100),
        dx: Math.round((r() - 0.5) * 160),
        w: Math.round(6 + r() * 7),
        color: COLORS[Math.floor(r() * COLORS.length)],
        dur: +dur.toFixed(2),
        delay: +(-r() * dur).toFixed(2),
        round: r() > 0.6
      };
    });
  })();

  protected readonly rising = ['🎂', '🎈', '🎁', '🎉', '🥳', '🍰', '✨', '🎊'];
}
