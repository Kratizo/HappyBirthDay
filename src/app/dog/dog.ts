import { Component, input } from '@angular/core';

export interface DogSpec {
  name: string;
  fur: string;
  belly: string;
  ear: string;
  nose: string;
  collar: string;
  /** 'lab' = orejas largas, 'shaggy' = peludo, 'fold' = orejas dobladas, 'fluffy' = esponjoso */
  style: 'lab' | 'shaggy' | 'fold' | 'fluffy';
  bandana?: boolean;
}

/** Perrito de caricatura (SVG) sentado, con cola, parpadeo y lengua animados. */
@Component({
  selector: 'app-dog',
  templateUrl: './dog.html',
  styleUrl: './dog.css'
})
export class Dog {
  readonly spec = input.required<DogSpec>();
  /** Lado de la mesa donde está (la cola apunta hacia afuera). */
  readonly side = input<'l' | 'r'>('l');
  /** Índice para desfasar las animaciones. */
  readonly k = input(0);
  /** true cuando se abre el regalo: ladra. */
  readonly barking = input(false);
}
