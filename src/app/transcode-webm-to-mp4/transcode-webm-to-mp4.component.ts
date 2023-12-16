import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { fetchFile } from '@ffmpeg/util';

import { LoadComponent } from '../load.component';

@Component({
  selector: 'app-transcode-webm-to-mp4',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transcode-webm-to-mp4.component.html',
  styleUrl: './transcode-webm-to-mp4.component.css'
})
export class TranscodeWebmToMp4Component extends LoadComponent{
  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;

  async transcode() {
    await this.ffmpegRef.writeFile('input.webm', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm'));
    await this.ffmpegRef.exec(['-i', 'input.webm', 'output.mp4']);
    const data = await this.ffmpegRef.readFile('output.mp4');
    //@ts-ignore
    this.videoRef.nativeElement.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  }
}
