import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadComponent } from '../load.component';
import { fetchFile } from '@ffmpeg/util';

import {MatSliderModule} from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-snip-video',
  standalone: true,
  imports: [CommonModule, MatSliderModule, FormsModule],
  templateUrl: './snip-video.component.html',
  styleUrl: './snip-video.component.css'
})
export class SnipVideoComponent extends LoadComponent {
  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  startValue = 0;
  endValue = 10;
  maxDuration = 120; // Default max duration in seconds
  frames: any;
  videoFile: File | null = null;
  downloadURL: string | null = null;

  constructor() {
    super();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.videoFile = input.files[0];
      this.loadVideo();
    }
  }

  loadVideo() {
    if (this.videoFile) {
      const videoElement = this.videoRef.nativeElement;
      videoElement.src = URL.createObjectURL(this.videoFile);
      videoElement.onloadedmetadata = () => {
        this.maxDuration = Math.floor(videoElement.duration);
        this.endValue = this.maxDuration;
        console.log(`Video duration: ${this.maxDuration} seconds`);
      };
    }
  }

  async transcode() {
    if (!this.videoFile) {
      console.error('No video file selected');
      return;
    }

    const startTime = this.formatTime(this.startValue);
    const duration = this.formatTime(this.endValue - this.startValue);
    
    await this.ffmpegRef.writeFile('input.mp4', await fetchFile(this.videoFile));
    await this.ffmpegRef.exec([
      '-i', 'input.mp4',
      '-ss', startTime,
      '-t', duration,
      'output.mp4'
    ]);

    const data = await this.ffmpegRef.readFile('output.mp4');
    const blob = new Blob([data], { type: 'video/mp4' });
    this.downloadURL = URL.createObjectURL(blob);
    this.videoRef.nativeElement.src = this.downloadURL;
    console.log('Transcoding complete. Video URL created.');
  }

  downloadVideo() {
    if (this.downloadURL) {
      const a = document.createElement('a');
      a.href = this.downloadURL;
      a.download = 'trimmed_video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `00:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  showValues() {
    console.log(this.startValue, this.endValue);
  }
}
