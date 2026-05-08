import { Injectable, signal, computed } from '@angular/core';

export interface ConversionHistory {
  date: string;
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  historicalDateUsed: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly apiUrl = 'http://localhost:3000/api/currency';
  
  // Using Angular 19 signals for state management
  private historySignal = signal<ConversionHistory[]>(this.loadHistory());
  readonly history = computed(() => this.historySignal());

  constructor() {}

  async getSupportedCurrencies(): Promise<string[]> {
    const res = await fetch(`${this.apiUrl}/supported`);
    if (!res.ok) throw new Error('Failed to fetch currencies');
    const data = await res.json();
    return Object.keys(data); // freecurrencyapi returns an object with currency codes as keys
  }

  async convert(from: string, to: string, amount: number, date?: string): Promise<any> {
    let url = `${this.apiUrl}/convert?from=${from}&to=${to}&amount=${amount}`;
    if (date) url += `&date=${date}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to convert');
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    // Save to history
    this.addHistory({
      date: new Date().toISOString(),
      from: data.from,
      to: data.to,
      amount: data.amount,
      convertedAmount: data.convertedAmount,
      rate: data.rate,
      historicalDateUsed: date || null
    });
    
    return data;
  }

  private loadHistory(): ConversionHistory[] {
    const stored = localStorage.getItem('conversionHistory');
    return stored ? JSON.parse(stored) : [];
  }

  private addHistory(entry: ConversionHistory) {
    const current = this.historySignal();
    const updated = [entry, ...current];
    this.historySignal.set(updated);
    localStorage.setItem('conversionHistory', JSON.stringify(updated));
  }
  
  clearHistory() {
    this.historySignal.set([]);
    localStorage.removeItem('conversionHistory');
  }
}
