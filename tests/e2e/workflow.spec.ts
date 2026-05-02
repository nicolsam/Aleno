import { test, expect } from '@playwright/test';

test.describe('Alfabetiza E2E Workflow', () => {
  test.beforeEach(async ({ context }) => {
    // Force Portuguese locale
    await context.addCookies([{
      name: 'NEXT_LOCALE',
      value: 'pt-BR',
      url: 'http://localhost:3000',
    }]);
  });

  test('should go through the full workflow: register, school, class, student, and filtering', async ({ page }) => {
    // 1. Register
    await page.goto('/login');
    const registerToggle = page.locator('button:has-text("Criar Conta"), button:has-text("Register")').last();
    if (await registerToggle.isVisible()) {
        const text = await registerToggle.textContent();
        if (text?.includes('Conta') || text?.includes('Register')) {
            await registerToggle.click();
        }
    }

    await page.fill('input[placeholder*="nome"], input[placeholder*="name"]', 'Test Teacher');
    await page.fill('input[type="email"]', `teacher_${Date.now()}@example.com`);
    await page.fill('input[placeholder*="Senha"], input[placeholder*="Password"]', 'password123');
    await page.locator('button[type="submit"]').first().click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('main h1')).toContainText(/Painel|Dashboard/);

    // 2. Create School
    await page.getByRole('link', { name: /Escolas|Schools/ }).click();
    await page.getByRole('button', { name: /Adicionar Escola|Add School/ }).click();
    await page.fill('input[placeholder*="escola"]', 'Test School');
    // Click the submit button inside the modal
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=Test School')).toBeVisible();

    // 3. Create Class
    await page.getByRole('link', { name: /Turmas|Classes/ }).click();
    await page.getByRole('button', { name: /Adicionar Turma|Add Class/ }).click();
    await page.locator('select').filter({ hasText: /Selecionar escola|Select school/ }).selectOption({ label: 'Test School' });
    await page.locator('select').filter({ hasText: /Selecionar ano|Select grade/ }).selectOption('1º Ano');
    await page.fill('input[placeholder*="Turma"], input[placeholder*="Section"]', 'A');
    await page.locator('select').filter({ hasText: /Selecionar turno|Select shift/ }).selectOption('Morning');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=1º Ano')).toBeVisible();

    // 4. Create Student
    await page.getByRole('link', { name: /Alunos|Students/ }).click();
    await page.getByRole('button', { name: /Adicionar Aluno|Add Student/ }).click();
    await page.locator('select').filter({ hasText: /Selecionar uma turma|Select a class/ }).selectOption({ label: '1º Ano A (Manhã)' });
    await page.fill('input[placeholder*="Nome"], input[placeholder*="Name"]', 'John Doe');
    await page.fill('input[placeholder*="Número"], input[placeholder*="Number"]', 'STUD001');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('text=John Doe')).toBeVisible();

    // 5. Verify Filters
    await page.getByTestId('students-grade-filter').click();
    await page.getByRole('option', { name: '1º Ano', exact: true }).click();
    await expect(page.locator('text=John Doe')).toBeVisible();

    await page.getByTestId('students-section-filter').click();
    await page.getByRole('option', { name: 'A', exact: true }).click();
    await expect(page.locator('text=John Doe')).toBeVisible();

    await page.getByTestId('students-shift-filter').click();
    await page.getByRole('option', { name: /Manhã|Morning/ }).click();
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
});
