import { Handler } from '@netlify/functions';

const API_KEY = process.env['FREE_CURRENCY_API_KEY'] || '4E0VK7BnkdeUuh1vegAt808v2IUjzUR6lxcvBMT2';
const BASE_URL = 'https://api.freecurrencyapi.com/v1';

export const handler: Handler = async (event) => {
  const { path, queryStringParameters } = event;
  
  // Basic routing within the function
  try {
    if (path.includes('/supported')) {
      const response = await fetch(`${BASE_URL}/currencies?apikey=${API_KEY}`);
      const data = await response.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data.data),
      };
    }

    if (path.includes('/convert')) {
      const { from, to, amount, date } = queryStringParameters || {};
      if (!from || !to || !amount) {
        return { statusCode: 400, body: 'Missing parameters' };
      }

      const endpoint = date ? `/historical?date=${date}&` : `/latest?`;
      const url = `${BASE_URL}${endpoint}apikey=${API_KEY}`;
      
      const response = await fetch(url);
      const resData = await response.json();
      
      let rateData = resData.data;
      if (date && rateData[date]) {
        rateData = rateData[date];
      }
      
      const rateFrom = from === 'USD' ? 1 : rateData[from];
      const rateTo = to === 'USD' ? 1 : rateData[to];
      
      const rate = rateTo / rateFrom;
      const convertedAmount = Number(amount) * rate;
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          from, to, amount: Number(amount), rate, convertedAmount, date: date || 'latest'
        }),
      };
    }

    return { statusCode: 404, body: 'Not Found' };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
