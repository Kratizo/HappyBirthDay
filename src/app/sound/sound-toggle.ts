import { Component, inject } from '@angular/core';
import { SoundService } from './sound.service';

@Component({
  selector: 'app-sound-toggle',
  template: `
    <div class="bar">
      <button
        type="button"
        class="snd"
        (click)="sound.toggleMusic()"
        [attr.aria-pressed]="sound.musicEnabled()"
        [attr.aria-label]="sound.musicEnabled() ? 'Silenciar música' : 'Activar música'"
        [title]="sound.musicEnabled() ? 'Música: activada' : 'Música: desactivada'"
      >
        {{ sound.musicEnabled() ? '🎵' : '🔕' }}
      </button>
      <button
        type="button"
        class="snd"
        (click)="sound.toggle()"
        [attr.aria-pressed]="sound.enabled()"
        [attr.aria-label]="sound.enabled() ? 'Silenciar efectos' : 'Activar efectos'"
        [title]="sound.enabled() ? 'Efectos: activados' : 'Efectos: desactivados'"
      >
        {{ sound.enabled() ? '🔊' : '🔇' }}
      </button>
    </div>
  `,
  styles: `
    .bar {
      position: fixed;
      top: calc(0.75rem + env(safe-area-inset-top));
      right: calc(0.75rem + env(safe-area-inset-right));
      z-index: 20;
      display: flex;
      gap: 0.5rem;
    }
    .snd {
      width: 2.8rem;
      height: 2.8rem;
      border: 2px solid rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(6px);
      font-size: 1.3rem;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .snd:hover {
      transform: scale(1.12);
    }
  `
})
export class SoundToggle {
  protected readonly sound = inject(SoundService);
}
