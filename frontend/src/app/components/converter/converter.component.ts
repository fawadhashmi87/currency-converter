import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-converter',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatSelectModule, 
    MatInputModule, MatDatepickerModule, MatNativeDateModule, 
    MatButtonModule, MatProgressSpinnerModule, MatIconModule
  ],
  templateUrl: './converter.component.html',
  styleUrl: './converter.component.css'
})
export class ConverterComponent implements OnInit {
  currencies = signal<string[]>([]);
  isLoadingCurrencies = signal<boolean>(true);
  isConverting = signal<boolean>(false);
  
  fromCurrency = 'USD';
  toCurrency = 'EUR';
  amount = 1;
  amountDisplay = '1';
  selectedDate: Date | null = null;
  maxDate = new Date();
  
  result = signal<any>(null);
  error = signal<string | null>(null);

  onAmountChange(value: string) {
    // Remove everything except numbers and a single decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Don't format if it's just a dot or empty to allow typing
    if (cleanValue === '.' || cleanValue === '') {
      this.amountDisplay = cleanValue;
      this.amount = 0;
      return;
    }

    // Split into integer and decimal parts
    const parts = cleanValue.split('.');
    
    // Format the integer part with commas
    if (parts[0]) {
      const numPart = parseInt(parts[0], 10);
      if (!isNaN(numPart)) {
        parts[0] = numPart.toLocaleString('en-US');
      }
    }
    
    // Join back, limiting to one decimal point
    this.amountDisplay = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
    
    // Sync the actual numeric amount for the API call
    this.amount = parseFloat(cleanValue) || 0;
  }

  constructor(private currencyService: CurrencyService) {
    // The API's historical endpoint throws a 422 for today's date because the day hasn't closed yet.
    // So we limit the historical datepicker to yesterday. (Today's rate is the 'latest' rate).
    this.maxDate.setDate(this.maxDate.getDate() - 1);
  }

  async ngOnInit() {
    try {
      const currs = await this.currencyService.getSupportedCurrencies();
      this.currencies.set(currs);
    } catch (err: any) {
      this.error.set('Failed to load currencies.');
    } finally {
      this.isLoadingCurrencies.set(false);
    }
  }

  async convert() {
    if (!this.amount || this.amount <= 0) {
      this.error.set('Please enter a valid amount.');
      return;
    }
    if (this.fromCurrency === this.toCurrency) {
      this.result.set({
        from: this.fromCurrency,
        to: this.toCurrency,
        amount: this.amount,
        convertedAmount: this.amount,
        rate: 1,
        date: this.selectedDate ? this.formatDate(this.selectedDate) : 'latest'
      });
      return;
    }

    this.isConverting.set(true);
    this.error.set(null);
    this.result.set(null);
    
    try {
      let dateStr = this.selectedDate ? this.formatDate(this.selectedDate) : undefined;
      const res = await this.currencyService.convert(this.fromCurrency, this.toCurrency, this.amount, dateStr);
      this.result.set(res);
      
      // On mobile, scroll down to the result so it comes into view perfectly at the top
      setTimeout(() => {
        const resultEl = document.querySelector('.result-container');
        if (resultEl && window.innerWidth <= 992) {
          resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
      
    } catch (err: any) {
      this.error.set(err.message || 'Conversion failed.');
    } finally {
      this.isConverting.set(false);
    }
  }

  swapCurrencies() {
    const temp = this.fromCurrency;
    this.fromCurrency = this.toCurrency;
    this.toCurrency = temp;
    if (this.result()) {
      this.convert();
    }
  }
  
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
