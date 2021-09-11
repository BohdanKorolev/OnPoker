import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  get(method: string) {
    return this.http.get(`${environment.apiBase}/${method}`)
  }

  post(method: string, data: any = {}) {
    return this.http.post(`${environment.apiBase}/${method}`, data, {
      headers: {
        sign: 'aaa'
      }
    })
  }
}
