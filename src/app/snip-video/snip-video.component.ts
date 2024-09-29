import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadComponent } from '../load.component';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

@Component({
  selector: 'app-snip-video',
  standalone: true,
  imports: [CommonModule, MatSliderModule, FormsModule],
  templateUrl: './snip-video.component.html',
  styleUrl: './snip-video.component.css'
})
export class SnipVideoComponent extends LoadComponent implements OnInit {
  @ViewChild('videoRef') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  startValue = 0;
  endValue = 10;
  maxDuration = 120;
  frames: any;
  videoFile: File | null = null;
  downloadURL: string | null = null;
  private worker: Worker | null = null;
  isTranscoding = false;
  
  async ngOnInit() {
    await this.load(); // This loads FFmpeg
    this.initializeWorker();
  }

  private initializeWorker() {
    this.worker = new Worker(new URL('../workers/transcode-hero.worker', import.meta.url), { type: 'module' });
    this.worker.onmessage = ({ data }) => {
      switch (data.type) {
        case 'progress':
          this.progressValue = Math.round(data.progress * 100);
          this.progressMsg = `${this.progressValue}% (transcoded time: ${data.time / 1000000} s)`;
          this.showProgress = true;
          console.log(`Progress: ${this.progressValue}%, Time: ${data.time}`);
          break;
        case 'complete':
          const blob = new Blob([data.outputData], { type: 'video/mp4' });
          this.downloadURL = URL.createObjectURL(blob);
          this.videoRef.nativeElement.src = this.downloadURL;
          this.isTranscoding = false;
          this.showProgress = false;
          console.log('Transcoding complete. Video URL created.');
          break;
        case 'error':
          console.error('Worker error:', data.error);
          this.isTranscoding = false;
          this.showProgress = false;
          break;
      }
    };
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

  async transcodeWithApp() {
    if (!this.videoFile || !this.loaded) {
      console.error('No video file selected or FFmpeg not loaded');
      return;
    }

    this.isTranscoding = true;
    this.progressValue = 0;
    this.progressMsg = '';
    this.showProgress = true;

    const startTime = this.formatTime(this.startValue);
    const duration = this.formatTime(this.endValue - this.startValue);

    try {
      await this.ffmpegRef.writeFile('input.mp4', await fetchFile(this.videoFile));
      await this.ffmpegRef.exec([
        '-i', 'input.mp4',
        '-ss', startTime,
        '-t', duration,
        'output.mp4'
      ]);
      const data = await this.ffmpegRef.readFile('output.mp4') as Uint8Array;
      await this.ffmpegRef.exec([
        '-i', 'output.mp4',
        '-frames', '1', '-vf', 'fps=1,scale=100:-2,tile=5x1',
        'frames.png'
      ]);
      const videoFrames = await this.ffmpegRef.readFile('frames.png') as Uint8Array;
      this.frames = URL.createObjectURL(new Blob([videoFrames.buffer], { type: 'image/png' }));
      this.downloadURL = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      this.videoRef.nativeElement.src = this.downloadURL;
    } catch (error) {
      console.error('Error during transcoding:', error);
    } finally {
      this.isTranscoding = false;
      this.showProgress = false;
    }
  }

  async transcode() {
    if (!this.videoFile || !this.worker || !this.loaded) {
      console.error('No video file selected, worker not initialized, or FFmpeg not loaded');
      return;
    }

    this.isTranscoding = true;
    this.progressValue = 0;
    this.progressMsg = '';
    this.showProgress = true;

    const startTime = this.formatTime(this.startValue);
    const duration = this.formatTime(this.endValue - this.startValue);
    
    // Send the FFmpeg configuration to the worker
    this.worker.postMessage({
      type: 'init',
      config: {
        coreURL: await toBlobURL(`${this.baseURLCore}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${this.baseURLCore}/ffmpeg-core.wasm`, 'application/wasm')
      }
    });

    // Send the transcoding request to the worker
    this.worker.postMessage({
      type: 'transcode',
      videoFile: this.videoFile,
      startTime,
      duration
    });
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

  async fastTrim() {
    if (!this.videoFile) {
      console.error('Please select a video file first.');
      this.transcodeLog = 'Please select a video file first.';
      return;
    }

    const inputFileName = 'input.mp4';
    const outputFileName = 'output.mp4';

    this.isTranscoding = true;
    this.progressValue = 0;
    this.progressMsg = 'Starting fast trim...';
    this.transcodeLog = null; // Clear previous log

    try {
      await this.ffmpegRef.writeFile(inputFileName, await fetchFile(this.videoFile));

      const startTime = this.startValue;
      const duration = this.endValue - this.startValue;

      console.log(`Trimming from ${startTime} for ${duration} seconds`);

      this.ffmpegRef.on('progress', ({ progress }) => {
        this.progressValue = Math.round(progress * 100);
        this.progressMsg = `Trimming: ${this.progressValue}%`;
      });

      await this.ffmpegRef.exec([
        '-ss', startTime.toString(),
        '-i', inputFileName,
        '-t', duration.toString(),
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        outputFileName
      ]);

      const data = await this.ffmpegRef.readFile(outputFileName);
      const blob = new Blob([data], { type: 'video/mp4' });
      this.downloadURL = URL.createObjectURL(blob);
      console.log('Fast trim with app completed!');
      this.transcodeLog = 'Fast trim completed successfully!';
    } catch (error) {
      console.error('Error during fast trim:', error);
      this.transcodeLog = `Error during fast trim: ${error}`;
    } finally {
      this.isTranscoding = false;
      this.progressMsg = '';
    }
  }

  ngOnDestroy() {
    if (this.downloadURL) {
      URL.revokeObjectURL(this.downloadURL);
    }
  }

  onVideoLoaded() {
    const video = this.videoRef.nativeElement;
    this.maxDuration = Math.floor(video.duration);
    this.endValue = this.maxDuration;
    console.log(`Video duration: ${this.maxDuration} seconds`);
  }

  onSliderChange(thumb: 'start' | 'end') {
    const video = this.videoRef.nativeElement;
    if (thumb === 'start') {
      video.currentTime = this.startValue;
    } else {
      video.currentTime = this.endValue;
    }
  }
}
