import { Page, test } from '@playwright/test';
import { actionFromPrice, PriceAction } from './prices';
import {
  confirmSettings,
  getSocAndWatt,
  login,
  openDeviceSettings,
  setBackupReservedSoc,
  setDischargeWeekday,
  setDischargeWeekend,
} from './navigate-browser';
import { TZDate } from '@date-fns/tz';
import { getHours, isWeekend } from 'date-fns';

const THOLD_H_NIGHT = 100;
const THOLD_H_DAY = 80;
const THOLD_L = 25;
const WATT = 1000;

test('Set smart charging', async ({ page }) => {
  await login(page);
  const socAndWatt = await getSocAndWatt(page);
  console.log(
    `Battery SoC: ${socAndWatt.soc} Current DC Power: ${socAndWatt.watt}`
  );
  await openDeviceSettings(page);

  const priceAction = await actionFromPrice();
  const thresholdHigh = getThresholdHigh();
  if (
    priceAction === PriceAction.Charge &&
    socAndWatt.soc < thresholdHigh &&
    socAndWatt.watt < WATT
  ) {
    console.log(`Charging to: ${thresholdHigh}`);
    await setBackupReservedSoc(page, thresholdHigh);
    await preventDischarge(page);
  } else if (priceAction !== PriceAction.Discharge) {
    console.log('Preventing discharge');
    await setBackupReservedSoc(page, THOLD_L);
    await preventDischarge(page);
  } else {
    console.log('Allow discharge');
    await setBackupReservedSoc(page, THOLD_L);
    await allowDischarge(page);
  }
  await confirmSettings(page);
});

function getThresholdHigh() {
  const now = TZDate.tz('Europe/Stockholm');
  const hour = getHours(now);
  return hour >= 0 && hour <= 5 ? THOLD_H_NIGHT : THOLD_H_DAY;
}

async function preventDischarge(page: Page) {
  await setDischargeWeekday(page, 0, 0);
  await setDischargeWeekend(page, 0, 0);
}

async function allowDischarge(page: Page) {
  const now = TZDate.tz('Europe/Stockholm');
  if (isWeekend(now)) {
    await setDischargeWeekday(page, 0, 0);
    await setDischargeWeekend(page, getHours(now), getHours(now) + 1);
  } else {
    await setDischargeWeekday(page, getHours(now), getHours(now) + 1);
    await setDischargeWeekend(page, 0, 0);
  }
}
