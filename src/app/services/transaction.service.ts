


import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TransferRequest, TransferPrecheck, Transaction } from '../shared/models/transaction.model';


@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  transferPrecheck(data: Partial<TransferRequest>): Observable<TransferPrecheck> {
    return this.http.post<TransferPrecheck>(`${this.apiUrl}/transfer/precheck`, data);
  }

  executeTransfer(data: TransferRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transfer`, data);
  }

  getMyTransactions(filters?: any): Observable<Transaction[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<Transaction[]>(`${this.apiUrl}/my-transactions`, { params });
  }

  getAllTransactions(filters?: any): Observable<Transaction[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<Transaction[]>(this.apiUrl, { params });
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  cancelScheduledTransaction(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/cancel`, {});
  }

  approveTransaction(id: string): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectTransaction(id: string, reason: string): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  downloadReceipt(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/receipt`, {
      responseType: 'blob'
    });
  }

  generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
