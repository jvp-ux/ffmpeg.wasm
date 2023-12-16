import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranscodeWebmToMp4Component } from './transcode-webm-to-mp4.component';

describe('TranscodeWebmToMp4Component', () => {
  let component: TranscodeWebmToMp4Component;
  let fixture: ComponentFixture<TranscodeWebmToMp4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscodeWebmToMp4Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TranscodeWebmToMp4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
