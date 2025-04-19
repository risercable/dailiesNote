import { ChangeDetectionStrategy, Component, ElementRef, inject, model, OnInit, signal, ViewChild } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatOption, MatSelectModule} from '@angular/material/select';
import { LocalStorageService } from './services/local-storage.service';
import { BehaviorSubject } from 'rxjs';
import { CommonService } from './common.service';

export interface DialogData {
  noteName: string;
  name: string;
  duration?: Number;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatSelectModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'dailiesNote';
  days: Array<{ desc: string; activeDay?: boolean; }> = [
    { desc: 'skip', activeDay: false },
    { desc: 'Sun', activeDay: false },
    { desc: 'Mon', activeDay: false },
    { desc: 'Tue', activeDay: false },
    { desc: 'Wed', activeDay: false },
    { desc: 'Thu', activeDay: false },
    { desc: 'Fri', activeDay: false },
    { desc: 'Sat', activeDay: false }
  ];

  hours: { time: string; currentHour?: boolean; activeHour?: boolean; timeWholeNumber: number; }[] = Array.from({ length: 24 }).map((_, i) => {
    return {
      time: `${i}:00`,
      currentHour: false,
      activeHour: false,
      timeWholeNumber: i,
    };
  });

  events$ = new BehaviorSubject<Array<{ id: string; data: Array<{ title: string; start: string; end: string; day: string }> }>>([]);

  currentEntry: string = '';
  currentHour: string = new Date().getHours().toString();
  readonly noteName = signal('');
  readonly duration = signal('');
  readonly name = model('');
  readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('hoursContainer') hoursContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private localStorageService: LocalStorageService,
    private commonService: CommonService,
  ) {
  }

  ngOnInit(): void {
    this.getAllNotes();
    this.reorderDaysToStartWithCurrentDay();
    this.scrollToCurrentHour();

    this.events$.subscribe(events => {
      console.log('Current events:', events);
    });
  }

  ngOnDestroy(): void {
  }

  async getAllNotes(): Promise<void> {
    console.log('Calling API to get notes...');
    this.commonService.getAll('api/getNotes').subscribe({
      next: (notes) => {
        console.log('API response:', notes);

        if (notes) {
          const events = Array.isArray(notes)
            ? notes.map(note => ({
                id: note.id,
                data: note.data.map((dataItem: any) => ({
                  title: dataItem.title,
                  start: dataItem.start,
                  end: dataItem.end,
                  day: dataItem.day
                }))
              }))
            : [];
          this.events$.next(events); // Emit the updated events
          console.log('Events updated:', events);
        }
      },
      error: (error) => {
        console.error('Error fetching notes:', error);
      },
    });
  }

  reorderDaysToStartWithCurrentDay(): void {
    const currentDayIndex = new Date().getDay(); // Get the current day index (0 = Sunday, 1 = Monday, etc.)
    const reorderedDays = [
      this.days[0], // Always keep the 'skip' element at the start
      ...this.days.slice(currentDayIndex + 1), // Days from the current day to the end, skipping the 'skip' element
      ...this.days.slice(1, currentDayIndex + 1) // Days from the start (after 'skip') to the current day
    ];
    this.days = reorderedDays;
  }

  scrollToCurrentHour(): void {
    const currentHourIndex = new Date().getHours();
    const currentDayIndex = new Date().toLocaleDateString('en-us', {'weekday' : 'short'});

    this.currentHour = currentHourIndex.toString();

    this.hours.forEach((hour, index) => {
      hour.currentHour = index === currentHourIndex;
      hour.activeHour = index >= currentHourIndex; // Disable past hours
    });

    this.days.forEach((day) => {
      day.activeDay = day.desc === currentDayIndex; // Disable past days
    });

    // Scroll to the current hour element
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const targetElement = document.getElementById(`hour-${currentHourIndex}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
    }
  }

  addEvent(day: string, hour: number): void {
    if (day === 'skip') return;

    this.saveData(day, hour).then((key) => {
      const updatedEvents = [...this.events$.value]; // Get the current value of the events
      this.events$.next(updatedEvents); // Emit the updated events
    });
  }

  extendEventDisplay(currentHour: string): void {
    const eventObject = { ...this.localStorageService.getItem('events') as { [key: string]: string | boolean }};

    const foundKey = Object.keys(eventObject).find(key => key.toString().endsWith(currentHour));
  }

  async saveData(day: string, hour: number): Promise<string> {
    return this.openDialog().then((isValid) => {
      console.log('isValid', isValid);

      if (isValid) {
        let allSaveData: Array<{
          day: string;
          title: string;
          start: string;
          end: string;
        }> = [];
        let id = crypto.randomUUID();

        let key = `${(Number(hour)).toString()}:00`;
        for (const [index, res] of (isValid as Array<DialogData>).entries()) {
          const duration = Number(res.duration) || 0; // Ensure duration is a valid number

          const eachSaveData = {
            day: day,
            title: res.noteName,
            start: `${day} ${hour}:00`,
            end: `${day} ${Number(hour) + duration}:00`
          };

          allSaveData.push(eachSaveData);
        }

        const updatedEvents = [...this.events$.value];
        updatedEvents.push({
          id,
          data: [...allSaveData]
        });
        this.events$.next(updatedEvents);

        this.commonService.create('api/notes', { id, data: [...allSaveData] }).subscribe({
          next: (response) => {
            setTimeout(() => {
            }, 0);
          },
          error: (error) => {
            console.error('Error creating note:', error);
          }
        });

        this.localStorageService.saveToLocalStorage(updatedEvents);

        return JSON.stringify(allSaveData); // Convert the array to a string
      } else {
        console.log("This item already exists");
        return ''; // Return an empty string if the item already exists
      }
    }).catch((error) => {
      console.error('Error in openDialog:', error);
      return ''; // Return an empty string in case of an error
      console.error('Error in openDialog:', error);
    });
  }

  checkForEvent(day: string, hour: string, events: any[]): any[] {
    const eventsForDay = events
      ?.flatMap(event =>
        Array.isArray(event.data) // Ensure event.data is an array
          ? event.data.map((data: { title: string; start: string; end: string; day: string; }) => ({ ...data, id: event.id }))
          : [{ ...event.data, id: event.id }] // Handle single object case
      )
      ?.filter(eventData => eventData.day === day);
  
    if (!eventsForDay || eventsForDay.length === 0) return [];
  
    const eventsForHour = eventsForDay.filter(event => {
      const eventStartHour = parseInt(event.start.split(' ')[1].split(':')[0], 10);
      const eventEndHour = parseInt(event.end.split(' ')[1].split(':')[0], 10);
      const currentHour = parseInt(hour, 10);
      return currentHour === eventStartHour || (currentHour > eventStartHour && currentHour < eventEndHour);
    });
  
    return eventsForHour;
  }

  calculateGridRow(start: string, end: string): string {
    const startHour = parseInt(start.split(' ')[1].split(':')[0], 10); // Extract the start hour
    const endHour = parseInt(end.split(' ')[1].split(':')[0], 10); // Extract the end hour
    const rowStart = startHour + 1; // Adjust for grid row indexing (if needed)
    const rowSpan = Math.max(1, endHour - startHour); // Ensure the row span is at least 1
    return `${rowStart} / span ${rowSpan}`;
  }

  openDialog(): Promise<Array<DialogData> | boolean> {
    this.name.set('Sir/Madam');
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: { name: this.name(), noteName: this.noteName(), duration: this.duration() },
    });

    return new Promise<Array<DialogData> | boolean>((resolve) => {
      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
        const dataToReturn = [] as Array<DialogData>;
        if (result !== undefined) {
          this.noteName.set(result.noteName());
          this.duration.set(result.duration());
          const count = this.duration() as unknown as number;

          
          for (let res = 0; res < count; res++) {
            dataToReturn.push({
              noteName: this.noteName(),
              duration: Number(res),
              name: ''
            })
          }
          resolve(dataToReturn);
        } else {
          resolve(false);
        }
      });
    });
  }

  enableHoursForNextDays(dayDesc: string): boolean {
    const currentDayDesc = new Date().toLocaleDateString('en-us', { weekday: 'short' }); // Get the current day (e.g., "Mon")
    return dayDesc !== currentDayDesc; // Return true if the day is not the current day
  }

  trackByEventId(index: number, event: any): string {
    return event.id; // Use a unique identifier for tracking
  }
}

@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'dialog-overview-example-dialog.html',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatSelectModule,
    MatOption
  ],
})
export class DialogOverviewExampleDialog {
  readonly dialogRef = inject(MatDialogRef<DialogOverviewExampleDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly noteName = model(this.data.noteName);
  readonly duration = model(this.data.duration);

  onNoClick(): void {
    this.dialogRef.close();
  }
}