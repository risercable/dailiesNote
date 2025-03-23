import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'dailiesNote';
  days: string[] = ['skip', "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  hours: string[] = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  events: { [key: string]: string } = {};

  constructor() {}

  ngOnInit(): void {}
  
  addEvent(day: string, hour: string): void {
    const key = `${day}-${hour}`;
    this.events[key] = this.events[key] ? '' : 'Event';
  }
}
