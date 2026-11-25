import { Component, inject } from '@angular/core';
import { SoundService } from './sound.service';

@Component({
  selector: 'app-sound-toggle',
  template: `
    <div
      class="fixed top-[calc(0.75rem_+_env(safe-area-inset-top))] right-[calc(0.75rem_+_env(safe-area-inset-right))] z-20 flex gap-2"
    >
      <button
        type="button"
        class="h-[2.8rem] w-[2.8rem] cursor-pointer rounded-full border-2 border-solid border-[rgba(255,255,255,0.6)] bg-[rgba(255,255,255,0.25)] text-[1.3rem] backdrop-blur-[6px] [transition:transform_0.2s] [&:hover]:[transform:scale(1.12)]"
        (click)="sound.toggleMusic()"
        [attr.aria-pressed]="sound.musicEnabled()"
        [attr.aria-label]="sound.musicEnabled() ? 'Silenciar música' : 'Activar música'"
        [title]="sound.musicEnabled() ? 'Música: activada' : 'Música: desactivada'"
      >
        {{ sound.musicEnabled() ? '🎵' : '🔕' }}
      </button>
      <button
        type="button"
        class="h-[2.8rem] w-[2.8rem] cursor-pointer rounded-full border-2 border-solid border-[rgba(255,255,255,0.6)] bg-[rgba(255,255,255,0.25)] text-[1.3rem] backdrop-blur-[6px] [transition:transform_0.2s] [&:hover]:[transform:scale(1.12)]"
        (click)="sound.toggle()"
        [attr.aria-pressed]="sound.enabled()"
        [attr.aria-label]="sound.enabled() ? 'Silenciar efectos' : 'Activar efectos'"
        [title]="sound.enabled() ? 'Efectos: activados' : 'Efectos: desactivados'"
      >
        {{ sound.enabled() ? '🔊' : '🔇' }}
      </button>
    </div>
  `
})
export class SoundToggle {
  protected readonly sound = inject(SoundService);
}
