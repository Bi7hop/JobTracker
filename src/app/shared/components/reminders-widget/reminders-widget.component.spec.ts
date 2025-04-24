import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemindersWidgetComponent } from './reminders-widget.component';

describe('RemindersWidgetComponent', () => {
  let component: RemindersWidgetComponent;
  let fixture: ComponentFixture<RemindersWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemindersWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RemindersWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
