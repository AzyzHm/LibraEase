import {
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SearchSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

@Component({
  selector: 'app-search-select',
  standalone: true,
  templateUrl: './search-select.html',
  styleUrl: './search-select.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchSelect),
      multi: true,
    },
  ],
})
export class SearchSelect implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly placeholder = input<string>('Search…');
  readonly options = input.required<SearchSelectOption[]>();
  readonly emptyMessage = input<string>('No matches found.');

  readonly query = signal('');
  readonly open = signal(false);
  readonly disabled = signal(false);
  private readonly selectedId = signal<string | null>(null);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  constructor() {
    effect(() => {
      if (this.open()) {
        queueMicrotask(() => this.searchInput()?.nativeElement.focus());
      }
    });
  }

  readonly selectedOption = computed(
    () => this.options().find((option) => option.id === this.selectedId()) ?? null,
  );

  readonly filteredOptions = computed(() => {
    const term = this.query().trim().toLowerCase();
    const options = this.options();
    if (!term) return options;

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        (option.sublabel ?? '').toLowerCase().includes(term),
    );
  });

  writeValue(value: string | null): void {
    this.selectedId.set(value || null);
    this.query.set('');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onQueryInput(value: string): void {
    this.query.set(value);
    this.open.set(true);
  }

  onFocus(): void {
    this.open.set(true);
  }

  onOpenSearch(): void {
    this.open.set(true);
    this.query.set('');
  }

  onBlur(): void {
    this.onTouched();
    setTimeout(() => this.open.set(false), 150);
  }

  onSelect(option: SearchSelectOption): void {
    this.selectedId.set(option.id);
    this.onChange(option.id);
    this.query.set('');
    this.open.set(false);
  }
}
