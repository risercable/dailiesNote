import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, model, signal } from '@angular/core';
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
export class AppComponent {
  title = 'dailiesNote';
  days: string[] = ['skip', "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  hours: string[] = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  events: { [key: string]: string | boolean } = {};
  currentEntry: string = '';
  readonly noteName = signal('');
  readonly name = model('');
  readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef

  constructor() {}

  ngOnInit(): void {}

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
  
      this.findInEvents(key);  // Only pass the key
      this.cdr.detectChanges(); // Trigger change detection manually
    } else {
      console.log("This item already exists");
    }
  }
  
  

  openDialog(): Promise<string | boolean> {
    this.name.set('Sir/Madam');
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: {name: this.name(), noteName: this.noteName()},
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