import { expect, Page, test } from '@playwright/test';
import configuration from './configTypes';

test('Charge battery', async ({ page }) => {
  const charge = process.env.CHARGE;
  await expect(charge).toBeDefined();
  await setBattery(page, charge as string);
});

async function setBattery(page: Page, level: string) {
  await page.goto('https://web3.isolarcloud.eu/#/login');
  await page.getByPlaceholder('Account').fill(configuration.email);
  await page.getByPlaceholder('Password').fill(configuration.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page
    .getByRole('link', { name: 'Nordanvägen 12, 13738 Västerhanninge' })
    .click();
  await page.waitForSelector('.battery-soc');
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
    .fill(level);
  await page.getByRole('button', { name: 'Apply Settings' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  console.log(`Finished setting charge to ${level}`);
}
