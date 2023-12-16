import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnipVideoComponent } from './snip-video.component';

describe('SnipVideoComponent', () => {
  let component: SnipVideoComponent;
  let fixture: ComponentFixture<SnipVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnipVideoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SnipVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
