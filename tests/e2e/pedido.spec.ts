import { expect, test } from '@playwright/test';

test('pedido de atacado chega ao WhatsApp com os dados do cliente', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Lattafa Khamrah EDP 100ml/ }).first().click();
  await page.getByRole('spinbutton', { name: 'Quantidade' }).fill('9');
  await page.getByRole('button', { name: 'Adicionar ao carrinho' }).click();

  await page.goto('/carrinho');
  await expect(page.getByText('Falta 1 peça para o preço de atacado')).toBeVisible();
  await expect(page.getByText('Varejo', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(page.getByText('Atacado', { exact: true })).toBeVisible();

  await page.getByLabel('Nome').fill('Teste');
  await page.getByLabel('Cidade').fill('Goiânia');
  await expect(page.getByText('Escolha a forma de pagamento.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar pedido' })).toBeDisabled();
  // O Khamrah do seed não tem parcelamento: crédito só à vista.
  await page.getByLabel('Crédito').check();
  await expect(page.getByLabel('Parcelas').locator('option')).toHaveText(['1x']);
  const href = await page.getByRole('link', { name: 'Enviar pedido' }).getAttribute('href');
  expect(href).toMatch(/^https:\/\/wa\.me\//);
  const text = decodeURIComponent(href!);
  expect(text).toContain('Tipo: ATACADO (10 peças)');
  expect(text).toContain('Nome: Teste');
  expect(text).toContain('Pagamento: Crédito à vista');
});
