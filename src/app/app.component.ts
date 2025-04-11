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
  days: string[] = ['skip', "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  hours: { time: string; currentHour?: boolean; activeHour?: boolean }[] = Array.from(
    { length: 24 },
    (_, i) => ({ time: `${i}:00`, currentHour: false, activeHour: false })
  );
  events: { [key: string]: string | boolean } = {};
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
  ) {
    const hasSavedData = this.localStorageService.getItem('events');

    if (hasSavedData) {
      this.events = hasSavedData as { [key: string]: string | boolean };
    }
  }

  ngOnInit(): void {
    this.scrollToCurrentHour();
    this.activitySub = this.activityService.activity$.subscribe(event => {
      console.log('User did something:', event.type);
      this.scrollToCurrentHour();
    });
  }

  ngOnDestroy(): void {
    this.activitySub.unsubscribe();
  }

  scrollToCurrentHour(): void {
    const currentHourIndex = new Date().getHours();

    this.currentHour = currentHourIndex.toString();

    this.hours.forEach((hour, index) => {
      hour.currentHour = index === currentHourIndex;
      hour.activeHour = index >= currentHourIndex; // Disable past hours
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

  findInEvents(key: string): void {
    this.currentEntry = this.events[key] ? String(this.events[key]) : '';
  }

  async addEvent(day: string, hour: string): Promise<void> {
    if (day === 'skip') return;

    const isValid = await this.openDialog();
    console.log('isValid', isValid);

    if (isValid) {
      for (const res of isValid as Array<DialogData>) {
        const duration = Number(res.duration) || 0; // Ensure duration is a valid number
        const key = `${day}-${(Number(hour.split(':')[0]) + duration).toString() }:00`;
        this.events[key] = res.noteName;

        this.findInEvents(key);
        this.cdr.detectChanges();
        
      };
      

      this.localStorageService.saveToLocalStorage(this.events);
    } else {
      console.log("This item already exists");
    }
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