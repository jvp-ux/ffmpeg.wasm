import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkerBypassService {

  constructor(
    // private http:HttpClient
  ) { }

  async toBlobURLPatched(url:string, mimeType:any, patcher:any) {
    var resp = await fetch(url);
    var body = await resp.text();
    if (patcher) body = patcher(body);
    var blob = new Blob([body], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  async toBlobURL(url:string, mimeType:any) {
    var resp = await fetch(url);
    var body = await resp.blob();
    var blob = new Blob([body], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  async fetchFile(url:string) {
    var resp = await fetch(url);
    var buffer = await resp.arrayBuffer();
    return new Uint8Array(buffer);
  };
}
