import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadFilesService {

  constructor(
    private http:HttpClient
  ) {

  }

  loadUrlWithProgress(url:string): Observable<any> {
    return this.http.get(url,{
      responseType: "blob",
      observe:'events',
      reportProgress:true,
      headers: new HttpHeaders(
        { 'Content-Type': 'application/json' },
      )
    })
  }

}
