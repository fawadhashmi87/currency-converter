import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class CurrencyService {
  private readonly API_KEY = '4E0VK7BnkdeUuh1vegAt808v2IUjzUR6lxcvBMT2';
  private readonly BASE_URL = 'https://api.freecurrencyapi.com/v1';

  async getSupportedCurrencies() {
    try {
      const response = await fetch(`${this.BASE_URL}/currencies?apikey=${this.API_KEY}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch currencies');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async convert(from: string, to: string, amount: number, date?: string) {
    try {
      const endpoint = date ? `/historical?date=${date}&` : `/latest?`;
      // We fetch all rates against the default base (USD) to avoid free tier restrictions on base_currency
      const url = `${this.BASE_URL}${endpoint}apikey=${this.API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch conversion rates');
      }
      
      const resData = await response.json();
      
      let rateData = resData.data;
      // For historical, it might be nested under the date key
      if (date && rateData[date]) {
        rateData = rateData[date];
      }
      
      const rateFrom = from === 'USD' ? 1 : rateData[from];
      const rateTo = to === 'USD' ? 1 : rateData[to];
      
      if (rateFrom === undefined || rateTo === undefined) {
        throw new Error(`Rate for ${from} or ${to} not found`);
      }
      
      const rate = rateTo / rateFrom;
      const convertedAmount = amount * rate;
      
      return {
        from,
        to,
        amount,
        rate,
        convertedAmount,
        date: date || 'latest'
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
