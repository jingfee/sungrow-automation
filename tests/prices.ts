import { TZDate } from '@date-fns/tz';
import {
  addDays,
  getDate,
  getDay,
  getHours,
  getMonth,
  getYear,
} from 'date-fns';

interface Price {
  price: number;
  time: string;
}

export enum PriceAction {
  Charge,
  Discharge,
  Keep,
  TentativeCharge,
  TentativeDischarge,
}

const VATTENFALL_LOW = 0.16;
const VATTENFALL_HIGH = 0.536;

const DEVIATION_AVERAGE_HOURS = 10;
const DEVIATION_PERCENTAGE_HIGH = 0.3;
const DEVIATION_PERCENTAGE_LOW = 0.12;
const DEVIATION_HIGH_HOURS = 7;
const DEVIATION_MID_HOURS = 8;
const DEVIATION_LOW_HOURS = 10;

const NEXT_HOUR_LOOKAHEAD = 3;
const NEXT_HOUR_PERCENTAGE_DIFF = 0.15;

export async function actionFromPrice(): Promise<PriceAction> {
  const prices = await getPrices();
  const lookaheadHours = getLookaheadHours(prices);
  console.log(`Lookahead hours: ${lookaheadHours}`);
  const now = TZDate.tz('Europe/Stockholm');
  const nowHour = getHours(now);

  let sum = 0;
  let summed = 0;
  for (let i = nowHour; i < nowHour + lookaheadHours; i++) {
    if (i === prices.length) {
      break;
    }
    sum += prices[i].price;
    summed++;
  }
  const average = sum / summed;
  console.log(`Average price: ${average}`);

  if (prices[nowHour].price < average) {
    console.log('Cheaper than average');
    const nextHourCheaper = isNextHourCheaper(prices, nowHour);
    console.log(`Next hour cheaper: ${nextHourCheaper}`);
    return nextHourCheaper ? PriceAction.TentativeCharge : PriceAction.Charge;
  } else if (prices[nowHour].price > average) {
    const isNight = nowHour >= 22 || nowHour <= 6;
    if (isNight) {
      return PriceAction.Keep;
    }
    console.log('More expensive than average');
    const nextHourMoreExpensive = isNextHourMoreExpensive(prices, nowHour);
    console.log(`Next hour more expensive: ${nextHourMoreExpensive}`);
    return nextHourMoreExpensive
      ? PriceAction.TentativeDischarge
      : PriceAction.Discharge;
  } else {
    return PriceAction.Keep;
  }
}

function isNextHourCheaper(prices: Price[], nowHour: number): boolean {
  const priceNow = prices[nowHour].price;
  const priceNextHour = prices[nowHour + 1].price;
  if (
    priceNextHour < priceNow &&
    (priceNow - priceNextHour) / priceNow > NEXT_HOUR_PERCENTAGE_DIFF
  ) {
    return true;
  }

  let sum = 0;
  for (let i = 0; i < NEXT_HOUR_LOOKAHEAD; i++) {
    sum += prices[nowHour + i].price;
  }
  const average = sum / NEXT_HOUR_LOOKAHEAD;
  return priceNow > average;
}

function isNextHourMoreExpensive(prices: Price[], nowHour: number): boolean {
  const priceNow = prices[nowHour].price;
  const priceNextHour = prices[nowHour + 1].price;
  if (
    priceNextHour > priceNow &&
    (priceNextHour - priceNow) / priceNow > NEXT_HOUR_PERCENTAGE_DIFF
  ) {
    return true;
  }

  let sum = 0;
  for (let i = 0; i < NEXT_HOUR_LOOKAHEAD; i++) {
    sum += prices[nowHour + i].price;
  }
  const average = sum / NEXT_HOUR_LOOKAHEAD;
  return priceNow < average;
}

function getLookaheadHours(prices: Price[]): number {
  const now = TZDate.tz('Europe/Stockholm');
  let sum = 0;
  let hoursAhead = 0;

  for (
    let i = getHours(now);
    i < getHours(now) + DEVIATION_AVERAGE_HOURS;
    i++
  ) {
    if (i === prices.length) {
      break;
    }
    hoursAhead++;

    sum += prices[i].price;
  }
  const deviationAverageAhead = sum / hoursAhead;

  sum = 0;
  for (let i = getHours(now); i < getHours(now) + hoursAhead; i++) {
    sum += Math.abs(deviationAverageAhead - prices[i].price);
  }
  const deviationAverageDiff = sum / hoursAhead;

  const deviationPercentage = deviationAverageDiff / deviationAverageAhead;
  console.log(`Deviation percentage: ${deviationPercentage}`);

  if (deviationPercentage > DEVIATION_PERCENTAGE_HIGH) {
    return DEVIATION_HIGH_HOURS;
  } else if (
    deviationPercentage <= DEVIATION_PERCENTAGE_HIGH &&
    deviationPercentage >= DEVIATION_PERCENTAGE_LOW
  ) {
    return DEVIATION_MID_HOURS;
  } else {
    return DEVIATION_LOW_HOURS;
  }
}

async function getPrices(): Promise<Price[]> {
  const today = TZDate.tz('Europe/Stockholm');
  const tomorrow = addDays(today, 1);

  const priceToday = await fetchPrices(today);
  const priceTomorrow = await fetchPrices(tomorrow);

  const prices = [];
  for (const price of priceToday) {
    prices.push({
      price: price.SEK_per_kWh,
      time: price.time_start,
    });
  }
  if (priceTomorrow) {
    for (const price of priceTomorrow) {
      prices.push({
        price: price.SEK_per_kWh,
        time: price.time_start,
      });
    }
  }

  addVattenfallPrices(prices);
  return prices;
}

async function fetchPrices(date: TZDate) {
  const year = getYear(date);
  const month = getMonth(date);
  const day = getDate(date);
  const url = `https://www.elprisetjustnu.se/api/v1/prices/${year}/${String(
    month + 1
  ).padStart(2, '0')}-${String(day).padStart(2, '0')}_SE3.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return;
    }

    return await response.json();
  } catch (error: any) {
    console.error(error.message);
  }
}

function addVattenfallPrices(prices: Price[]): void {
  for (const price of prices) {
    const tzDate = new TZDate(price.time, 'Europe/Stockholm');
    const month = getMonth(tzDate);
    let isLowPrice = true;

    if ([0, 1, 2, 10, 11].includes(month)) {
      const day = getDay(tzDate);
      if ([1, 2, 3, 4, 5].includes(day)) {
        const hour = getHours(tzDate);

        if (hour >= 6 && hour <= 22) {
          isLowPrice = false;
        }
      }
    }

    if (isLowPrice) {
      price.price += VATTENFALL_LOW;
    } else {
      price.price += VATTENFALL_HIGH;
    }
  }
}
