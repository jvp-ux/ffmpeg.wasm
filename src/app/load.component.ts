import { Component, inject } from '@angular/core';
import { WorkerBypassService } from './services/worker-bypass.service';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL, downloadWithProgress } from '@ffmpeg/util';
import { LoadFilesService } from './services/load-files.service';
import { HttpEventType } from '@angular/common/http';

declare var FFmpegWASM: any;
@Component({
  standalone: true,
  imports: [],
  template: ``
})
export class LoadComponent {
  loaded = false;
  ffmpegRef = new FFmpeg();
  transcodeLog = null;
  messageRef = "";
  progressMsg = "";
  progressValue = 0;
  showProgress = false;

  wasmProgress = 0;
  wasmProgressMsg = "";

  private workerBypassSvc
  private fileSvc
  protected baseURLCore = 'https://unpkg.com/@ffmpeg/core@0.12.3/dist/umd';

  constructor(
  ) {
    this.workerBypassSvc = inject(WorkerBypassService);
    this.fileSvc = inject(LoadFilesService);
  }

  async load() {
    this.showProgress=true;
    //It should be like this, until this is merged: https://github.com/ffmpegwasm/ffmpeg.wasm/pull/562
    //Thanks this guy: https://github.com/ffmpegwasm/ffmpeg.wasm/issues/548#issuecomment-1707248897
    const baseURLFFMPEG = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd'
    const ffmpegBlobURL = await this.workerBypassSvc.toBlobURLPatched(`${baseURLFFMPEG}/ffmpeg.js`, 'text/javascript', (js: any) => {
      return js.replace('new URL(e.p+e.u(814),e.b)', 'r.worker814URL');
    });
    const baseURLCore = 'https://unpkg.com/@ffmpeg/core@0.12.3/dist/umd'
    // const baseURLCore = 'http://localhost:3000/ffmpeg'
    const config = {
      worker814URL: await toBlobURL(`${baseURLFFMPEG}/814.ffmpeg.js`, 'text/javascript', true),
      coreURL: await toBlobURL(`${baseURLCore}/ffmpeg-core.js`, 'text/javascript', true),
      wasmURL: await toBlobURL(`${baseURLCore}/ffmpeg-core.wasm`, 'application/wasm', true),
    };

     await import(/* @vite-ignore */ffmpegBlobURL);

    this.ffmpegRef = new FFmpegWASM.FFmpeg();
    this.ffmpegRef.on('log', ({ message }) => {
      console.log(message);
    });
    this.ffmpegRef.on('progress', ({ progress, time }) => {
      this.showProgress = progress != 1;
      console.log("progress", progress, time);
      this.progressValue = Math.ceil(progress * 100);
      this.progressMsg = `${this.progressValue} % (transcoded time: ${time / 1000000} s)`;
    });
    await this.ffmpegRef.load(config);
    console.log('ffmpeg.load success');
    this.loaded = true;
    this.showProgress=false;
  }

  loadFile(url:string){
    // debugger;
    this.fileSvc.loadUrlWithProgress(url)
      .subscribe((event:any)=>{
        if (event.type === HttpEventType.DownloadProgress) {
          console.log("download progress",event);
        }
        if (event.type === HttpEventType.Response) {
            console.log("donwload completed");
        }
      })
  }
}
