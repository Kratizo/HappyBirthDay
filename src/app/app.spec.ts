import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home/home';
import { Letter } from './letter/letter';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Feliz Cumpleaños, Margaret');
  });

  it('should render a center photo, 8 orbiting photos and an envelope', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.center').length).toBe(1);
    expect(el.querySelectorAll('.orbit .slot').length).toBe(8);
    expect(el.querySelectorAll('.envelope-btn').length).toBe(1);
  });
});

describe('Letter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Letter],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should show the full dedication when clicked', async () => {
    const fixture = TestBed.createComponent(Letter);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.paper') as HTMLElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.text')?.textContent).toContain('Feliz cumpleaños');
    fixture.destroy();
  });
});
