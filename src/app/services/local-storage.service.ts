import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  isSessionStorageAvailable(): boolean {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }

  constructor() { }

  saveToLocalStorage(dataToSave: any): void {
    const keyToSaveTo = 'events';
    this.setItem(keyToSaveTo, dataToSave);
  }

  setItem(key: string, value: any): void {
    if (this.isSessionStorageAvailable()) {
      sessionStorage?.setItem(key, JSON.stringify(value));
    }
  }

  getItem<T>(key: string): T | null {
    if (this.isSessionStorageAvailable()) {
      const item = sessionStorage?.getItem(key);
      return item ? JSON.parse(item) as T : null;
    }
    return null;
  }

  removeItem(key: string): void {
    if (this.isSessionStorageAvailable()) {
      sessionStorage?.removeItem(key);
    }
  }

  clear(): void {
    if (this.isSessionStorageAvailable()) {
      sessionStorage?.clear();
    }
  }

  updateCurrentHour(): void {
    const currentHour = new Date().getHours().toString();
    sessionStorage.setItem("currentHour", currentHour);
  }
}
