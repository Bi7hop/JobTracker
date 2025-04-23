import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternPreviewComponent } from './pattern-preview.component';

describe('PatternPreviewComponent', () => {
  let component: PatternPreviewComponent;
  let fixture: ComponentFixture<PatternPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternPreviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatternPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
