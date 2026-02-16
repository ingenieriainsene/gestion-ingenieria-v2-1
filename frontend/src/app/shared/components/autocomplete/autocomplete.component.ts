
import { Component, Input, Output, EventEmitter, forwardRef, HostListener, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="autocomplete-container">
      <input
        type="text"
        class="form-control"
        [placeholder]="placeholder"
        [(ngModel)]="displayValue"
        (input)="onInput($event)"
        (focus)="onFocus()"
        [disabled]="disabled"
        [class.is-invalid]="invalid"
      />
      <div class="dropdown-list" *ngIf="showDropdown">
        <div
          class="dropdown-item"
          *ngFor="let item of filteredData"
          (click)="selectItem(item)"
        >
          {{ displayFn(item) }}
        </div>
        <div class="dropdown-item no-results" *ngIf="filteredData.length === 0">
           No se encontraron resultados
        </div>
      </div>
    </div>
  `,
  styles: [`
    .autocomplete-container {
      position: relative;
      width: 100%;
    }
    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.95rem;
      background: #f8fafc;
      transition: all 0.2s;
      box-sizing: border-box;
    }
    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .form-control:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
    }
    .dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      max-height: 200px;
      overflow-y: auto;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      margin-top: 4px;
    }
    .dropdown-item {
      padding: 10px 15px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
    }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover {
      background: #f8fafc;
      color: #3b82f6;
    }
    .dropdown-item.no-results {
      color: #94a3b8;
      font-style: italic;
      cursor: default;
    }
    .dropdown-item.no-results:hover { background: white; color: #94a3b8; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements ControlValueAccessor, OnChanges {
  @Input() data: any[] = [];
  @Input() searchProps: string[] = [];
  @Input() valueProp: string = 'id';
  @Input() displayFn: (item: any) => string = (item) => String(item);
  @Input() placeholder: string = '';
  @Input() invalid: boolean = false;

  displayValue: string = '';
  filteredData: any[] = [];
  showDropdown: boolean = false;
  disabled: boolean = false;

  private innerValue: any = null;

  onChange: any = () => { };
  onTouched: any = () => { };

  constructor(private eRef: ElementRef) { }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
      this.validateInput();
    }
  }

  // Value Accessor
  writeValue(value: any): void {
    this.innerValue = value;
    this.updateDisplayValue();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.innerValue) {
      this.updateDisplayValue();
    }
  }

  onInput(event: any) {
    const value = this.displayValue;
    this.filterData(value);
    this.showDropdown = true;

    if (!value) {
      this.innerValue = null;
      this.onChange(null);
    }
  }

  onFocus() {
    if (this.disabled) return;
    this.filterData(this.displayValue);
    this.showDropdown = true;
    this.onTouched();
  }

  selectItem(item: any) {
    const val = item[this.valueProp];
    this.innerValue = val;
    this.displayValue = this.displayFn(item);
    this.showDropdown = false;
    this.onChange(val);
  }

  private normalize(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  private filterData(query: string) {
    if (!query) {
      this.filteredData = this.data;
      return;
    }
    const normalizedQuery = this.normalize(query);
    const terms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);

    this.filteredData = this.data.filter(item => {
      // Check if any prop matches
      return this.searchProps.some(prop => {
        const val = item[prop];
        if (val == null) return false;
        const normalizedVal = this.normalize(String(val));

        // Flexible match: All terms must appear in the property value
        // return terms.every(term => normalizedVal.includes(term));

        // OR: Simple "includes" of the full query?
        // The user said "not strict with spelling", usually means accents.
        // Splitting terms handles "Juan Perez" vs "Perez Juan".
        // Let's stick to simple "includes" of the normalized string first to matches substring behavior,
        // but effectively handling accents.
        return normalizedVal.includes(normalizedQuery);
      });
    });
  }

  private updateDisplayValue() {
    if (this.innerValue != null && this.data && this.data.length > 0) {
      const selected = this.data.find(item => item[this.valueProp] === this.innerValue);
      if (selected) {
        this.displayValue = this.displayFn(selected);
      } else {
        // If not found in data, maybe clear? Or keep ID?
        // For now, if not found, we don't know the display text. 
        // We can't display just the ID usually.
        // It might mean data hasn't loaded yet.
      }
    }
  }

  validateInput() {
    // If user types 'Juan' but doesn't select 'Juan Perez', 
    // and 'Juan' is not a valid exact match...
    // Strict mode: clear if no ID.
    if (!this.innerValue) {
      this.displayValue = '';
    } else {
      // Ensure display matches value
      this.updateDisplayValue();
    }
  }
}
