import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadComponent } from '../load.component';
import { fetchFile } from '@ffmpeg/util';

import {MatSliderModule} from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-snip-video',
  standalone: true,
  imports: [CommonModule,MatSliderModule, FormsModule],
  templateUrl: './snip-video.component.html',
  styleUrl: './snip-video.component.css'
})
export class SnipVideoComponent extends LoadComponent {
  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;
  startValue=0;
  endValue=10;
  frames:any;
  constructor(
    // private fileSvc:LoadFilesService
  ) {
    super();
  }

  async transcode() {
    // await this.ffmpegRef.writeFile('input.webm', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm'));
    await this.ffmpegRef.writeFile('input.webm', await fetchFile('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'));
    // await this.ffmpegRef.exec(['-i', 'input.webm', 'output.mp4']);
    await this.ffmpegRef.exec([
      '-i', 'input.webm',
      '-ss', '00:00:02',
      '-t', '00:00:05',
      // '-c:v libx264',
      // '-c:a aac',
      // '-strict experimental',
      'output.mp4'
    ]);
    const data = await this.ffmpegRef.readFile('output.mp4') as Uint8Array;
    await this.ffmpegRef.exec([
      '-i','output.mp4',
      '-frames','1', '-vf','fps=1,scale=100:-2,tile=5x1',
      'frames.png'
    ])
    const videoFrames = await this.ffmpegRef.readFile('frames.png') as Uint8Array;
    console.log('frames',videoFrames);
    this.frames = URL.createObjectURL(new Blob([videoFrames.buffer],{type:'image/png'}));
    this.videoRef.nativeElement.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  }

  showValues($event:any){
    console.log(this.startValue,this.endValue);
  }
}
