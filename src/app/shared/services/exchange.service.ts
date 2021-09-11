import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  constructor(private api: ApiService) { }

  exchangeToken(exchangeData: any) {
    return this.api.post('token/exchange', exchangeData);
  }
}
