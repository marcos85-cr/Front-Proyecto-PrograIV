/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HighValueOperationService } from './high-value-operation.service';

describe('Service: HighValueOperation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HighValueOperationService]
    });
  });

  it('should ...', inject([HighValueOperationService], (service: HighValueOperationService) => {
    expect(service).toBeTruthy();
  }));
});
