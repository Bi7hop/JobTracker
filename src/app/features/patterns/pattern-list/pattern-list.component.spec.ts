import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternListComponent } from './pattern-list.component';

describe('PatternListComponent', () => {
  let component: PatternListComponent;
  let fixture: ComponentFixture<PatternListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatternListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
