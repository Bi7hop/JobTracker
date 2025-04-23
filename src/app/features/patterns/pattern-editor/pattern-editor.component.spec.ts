import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternEditorComponent } from './pattern-editor.component';

describe('PatternEditorComponent', () => {
  let component: PatternEditorComponent;
  let fixture: ComponentFixture<PatternEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatternEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
