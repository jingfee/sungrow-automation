import { Page } from '@playwright/test';
import configuration from './configTypes';

export async function login(page: Page) {
  await page.goto('https://web3.isolarcloud.eu/#/login');
  await page.getByPlaceholder('Account').fill(configuration.email);
  await page.getByPlaceholder('Password').fill(configuration.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page
    .getByRole('link', { name: 'Nordanvägen 12, 13738 Västerhanninge' })
    .click();
  await page.waitForSelector('.battery-soc');
}

export async function getSocAndWatt(page: Page) {
  await page
    .locator('.plant-menu .menu-item')
    .filter({ has: page.getByText('Live Data') })
    .click();
  await page
    .locator('.second-device-card')
    .filter({ has: page.getByText('Energy Storage System1') })
    .click();

  const socText = await page
    .locator('.item')
    .filter({ has: page.getByText('Battery Level (SOC)') })
    .locator('.item-value span')
    .innerHTML();
  const socValue = parseInt(socText.split(' ')[0]);

  const wattText = await page
    .locator('.item')
    .filter({ has: page.getByText('Total DC Power') })
    .locator('.item-value span')
    .innerHTML();
  let wattValue = parseFloat(wattText.split(' ')[0]);
  if (wattText.includes('kW')) {
    wattValue *= 1000;
  }

  return { soc: socValue, watt: wattValue };
}

export async function openDeviceSettings(page: Page) {
  await page
    .locator('.plant-menu .menu-item')
    .filter({ has: page.getByText('Device') })
    .click();
  await page
    .locator('.device-card')
    .filter({ has: page.getByText('Energy Storage System1') })
    .click();
  await page.getByText('Settings', { exact: true }).click();
  await page.getByText('Common Parameter Settings').click();
}

export async function setBackupReservedSoc(page: Page, level: number) {
  await page
    .locator('.params-setting-dialog')
    .getByText('General Settings')
    .click();
  await page
    .locator('tr')
    .filter({ has: page.getByText('Backup mode') })
    .locator('input')
    .focus();
  await page
    .locator('tr')
    .filter({ has: page.getByText('Backup mode') })
    .locator('input')
    .press('Enter');
  await page
    .locator('.el-select-dropdown__item')
    .locator('visible=true')
    .getByText('Enable')
    .click();
  await page
    .locator('tr')
    .filter({ has: page.getByText('Reserved Battery SOC for Off-Grid') })
    .locator('input')
    .fill(level.toString());
}

export async function setDischargeWeekday(
  page: Page,
  start_hour: number,
  end_hour: number
) {
  await page
    .locator('.params-setting-dialog')
    .getByText('Energy Management Parameters')
    .click();

  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekday Discharging Start Time 1') })
    .locator('input')
    .focus();
  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekday Discharging Start Time 1') })
    .locator('input')
    .press('Enter');
  await page
    .locator('.el-cascader-panel')
    .locator('visible=true')
    .locator('.el-cascader-menu')
    .first()
    .locator('.el-cascader-node')
    .filter({ has: page.getByText(String(start_hour).padStart(2, '0')) })
    .click();
  await page
    .locator('.el-cascader-panel')
    .locator('visible=true')
    .locator('.el-cascader-menu')
    .nth(1)
    .locator('.el-cascader-node')
    .filter({ has: page.getByText('00') })
    .click();

  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekday Discharging End Time 1') })
    .locator('input')
    .focus();
  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekday Discharging End Time 1') })
    .locator('input')
    .press('Enter');
  await page
    .locator('.el-cascader-panel')
    .locator('visible=true')
    .locator('.el-cascader-menu')
    .first()
    .locator('.el-cascader-node')
    .filter({ has: page.getByText(String(end_hour).padStart(2, '0')) })
    .click();
  await page
    .locator('.el-cascader-panel')
    .locator('visible=true')
    .locator('.el-cascader-menu')
    .nth(1)
    .locator('.el-cascader-node')
    .filter({ has: page.getByText('00') })
    .click();
}

export async function setDischargeWeekend(
  page: Page,
  start_hour: number,
  end_hour: number
) {
  await page
    .locator('.params-setting-dialog')
    .getByText('Energy Management Parameters')
    .click();

  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekend Discharging') })
    .locator('input')
    .focus();
  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekend Discharging') })
    .locator('input')
    .press('Enter');
  await page
    .locator('.el-select-dropdown__item')
    .locator('visible=true')
    .getByText('Enable')
    .click();

  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekend Discharging Start Time 1') })
    .locator('input')
    .focus();
  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekend Discharging Start Time 1') })
    .locator('input')
    .press('Enter');
  await page
    .locator('.el-cascader-panel')
    .locator('visible=true')
    .locator('.el-cascader-menu')
    .first()
    .locator('.el-cascader-node')
    .filter({ has: page.getByText(String(start_hour).padStart(2, '0')) })
    .click();
  await page
    .locator('.el-cascader-panel')
    .locator('visible=true')
    .locator('.el-cascader-menu')
    .nth(1)
    .locator('.el-cascader-node')
    .filter({ has: page.getByText('00') })
    .click();

  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekend Discharging End Time 1') })
    .locator('input')
    .focus();
  await page
    .locator('tr')
    .filter({ has: page.getByText('Weekend Discharging End Time 1') })
    .locator('input')
    .press('Enter');
  await page
    .locator('.el-cascader-panel')
    .locator('visible=true')
    .locator('.el-cascader-menu')
    .first()
    .locator('.el-cascader-node')
    .filter({ has: page.getByText(String(end_hour).padStart(2, '0')) })
    .click();
  await page
    .locator('.el-cascader-panel')
    .locator('visible=true')
    .locator('.el-cascader-menu')
    .nth(1)
    .locator('.el-cascader-node')
    .filter({ has: page.getByText('00') })
    .click();
}

export async function confirmSettings(page: Page) {
  await page.getByRole('button', { name: 'Apply Settings' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
}
