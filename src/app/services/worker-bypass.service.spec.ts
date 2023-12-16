import { TestBed } from '@angular/core/testing';

import { WorkerBypassService } from './worker-bypass.service';

describe('WorkerBypassService', () => {
  let service: WorkerBypassService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkerBypassService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
