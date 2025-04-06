import { Injectable, NgZone, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserActivityService {
  private activitySubject = new Subject<Event>();
  activity$ = this.activitySubject.asObservable();
  private readonly platformId = inject(PLATFORM_ID);

  constructor(private zone: NgZone) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        const activityEvents = ['click', 'keydown', 'touchstart'];
        activityEvents.forEach(eventName => {
          window.addEventListener(eventName, this.handleEvent, true);
        });
      });
    }
  }

  private handleEvent = (event: Event) => {
    this.zone.run(() => {
      this.activitySubject.next(event);
    });
  };
}
