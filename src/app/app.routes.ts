import { Routes } from '@angular/router';
import { TranscodeWebmToMp4Component } from './transcode-webm-to-mp4/transcode-webm-to-mp4.component';
import { SnipVideoComponent } from './snip-video/snip-video.component';

export const routes: Routes = [
  {
    path:'transcode-webm-to-mp4',
    component:TranscodeWebmToMp4Component
  },
  {
    path:'snip-video',
    component:SnipVideoComponent
  }
];
