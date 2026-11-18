import { Routes } from '@angular/router';
import { Gift } from './gift/gift';
import { Home } from './home/home';
import { Letter } from './letter/letter';

export const routes: Routes = [
  { path: '', component: Gift },
  { path: 'fiesta', component: Home },
  { path: 'carta', component: Letter },
  { path: '**', redirectTo: '' }
];
