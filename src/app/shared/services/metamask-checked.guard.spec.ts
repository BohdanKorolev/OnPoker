import { TestBed } from '@angular/core/testing';

import { MetamaskCheckedGuard } from './metamask-checked.guard';

describe('MetamaskCheckedGuard', () => {
  let guard: MetamaskCheckedGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(MetamaskCheckedGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
