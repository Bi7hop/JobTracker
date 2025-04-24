import { TestBed } from '@angular/core/testing';

import { ReminderCheckService } from './reminder-check.service';

describe('ReminderCheckService', () => {
  let service: ReminderCheckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReminderCheckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
