import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('supported')
  async getSupportedCurrencies() {
    return this.currencyService.getSupportedCurrencies();
  }

  @Get('convert')
  async convert(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('amount') amount: string,
    @Query('date') date?: string,
  ) {
    if (!from || !to || !amount) {
      return { error: 'Missing required query parameters: from, to, amount' };
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return { error: 'Amount must be a valid number' };
    }
    return this.currencyService.convert(from.toUpperCase(), to.toUpperCase(), amountNum, date);
  }
}
