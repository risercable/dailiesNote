import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, model, OnInit, signal, ViewChild } from '@angular/core';
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
import { UserActivityService } from './services/hour-watcher.service';
import { Subscription } from 'rxjs';
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

  events: Array<{ id: string; title: string; start: string; end: string; day: string; }> = [];

  currentEntry: string = '';
  currentHour: string = new Date().getHours().toString();
  readonly noteName = signal('');
  readonly duration = signal('');
  readonly name = model('');
  readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private activitySub!: Subscription;
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('hoursContainer') hoursContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private localStorageService: LocalStorageService,
    private activityService: UserActivityService,
    private commonService: CommonService,
  ) {
    const hasSavedData = this.localStorageService.getItem('events');

    if (hasSavedData) {
      this.events = hasSavedData as [ {id: string; day: string; title: string; start: string; end: string} ] | [];
    }
  }

  ngOnInit(): void {
    this.reorderDaysToStartWithCurrentDay();
    this.scrollToCurrentHour();
  }

  ngOnDestroy(): void {
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

  // findInEvents(key: string): void {
  //   this.currentEntry = this.events[key] ? String(this.events[key]) : '';
  // }

  async addEvent(day: string, hour: number): Promise<void> {
    if (day === 'skip') return;

    const isValid = await this.openDialog();
    console.log('isValid', isValid);

    if (isValid) {
      for (const [index, res] of (isValid as Array<DialogData>).entries()) {
        const duration = Number(res.duration) || 0; // Ensure duration is a valid number
        const key = `${day}-${(Number(hour) + duration).toString() }:00`;

        const saveData = {
          id: crypto.randomUUID(),
          day: day,
          title: res.noteName,
          start: `${day} ${hour}:00`,
          end: `${day} ${Number(hour) + duration}:00`
        };
        
        this.events.push(saveData);

        // this.findInEvents(key);
        this.cdr.detectChanges();
        
        this.commonService.create('api/notes', saveData);

        if (index === 1 && Array.isArray(isValid) && isValid.length > 1) {
          // this.extendEventDisplay(hour.time);
        }
      };      

      this.localStorageService.saveToLocalStorage(this.events);
    } else {
      console.log("This item already exists");
    }
  }

  extendEventDisplay(currentHour: string): void {
    const eventObject = { ...this.localStorageService.getItem('events') as { [key: string]: string | boolean }};

    const foundKey = Object.keys(eventObject).find(key => key.toString().endsWith(currentHour));
  }

  checkForEvent(day: string, hour: string): any {
    let events1 = this.events;
    return events1?.filter(event => event?.start === `${day} ${hour}` && event?.end === `${day} ${hour}`)[0];
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