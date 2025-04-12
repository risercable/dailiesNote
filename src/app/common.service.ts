import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class CommonService {
  private baseUrl = 'http://localhost:5000'; // Your Express server's API base URL

  constructor(private http: HttpClient) {}

  // GET request to fetch all data
  getAll<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }

  // POST request to add new data
  create<T>(endpoint: string, data: any): Observable<T> {
    const observable = this.http.post<T>(`${this.baseUrl}/${endpoint}`, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });

    observable.subscribe({
      next: (response) => console.log('Data created successfully:', response),
      error: (err) => console.error('Error creating data:', err)
    });

    return observable;
  }

  // DELETE request to delete data by ID
  delete<T>(endpoint: string, id: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}/${id}`);
  }
}