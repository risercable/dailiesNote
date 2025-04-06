import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, model, OnInit, signal, ViewChild } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
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
import {MatInputModule} from '@angular/material/input';
import { LocalStorageService } from './services/local-storage.service';

export interface DialogData {
  noteName: string;
  name: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
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
  readonly name = model('');
  readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('hoursContainer') hoursContainer!: ElementRef<HTMLDivElement>;

  constructor(private localStorageService: LocalStorageService) {
    const hasSavedData = this.localStorageService.getItem('events');

    if (hasSavedData) {
      this.events = hasSavedData as { [key: string]: string | boolean };
    }
  }

  ngOnInit(): void {
    this.scrollToCurrentHour();
  }

  scrollToCurrentHour(): void {
    if (this.currentHour) {
      const currentHourIndex = new Date().getHours();

      this.hours.forEach((hour, index) => {
        hour.currentHour = index === currentHourIndex;
        hour.activeHour = index >= currentHourIndex; // Disable past hours
      });

      // Scroll to the current hour element
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
      const key = `${day}-${hour}`;
      this.events[key] = isValid;

      this.findInEvents(key);
      this.cdr.detectChanges();

      this.localStorageService.saveToLocalStorage(this.events);
    } else {
      console.log("This item already exists");
    }
  }

  openDialog(): Promise<string | boolean> {
    this.name.set('Sir/Madam');
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: { name: this.name(), noteName: this.noteName() },
    });

    return new Promise<string | boolean>((resolve) => {
      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
        if (result !== undefined) {
          this.noteName.set(result);
          resolve(result);
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
  ],
})
export class DialogOverviewExampleDialog {
  readonly dialogRef = inject(MatDialogRef<DialogOverviewExampleDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly noteName = model(this.data.noteName);

  onNoClick(): void {
    this.dialogRef.close();
  }
}