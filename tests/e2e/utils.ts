import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password = 'playwright123') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.getByPlaceholder('Email');
  const passwordInput = page.getByPlaceholder('Password');
  
  // fill() is generally better, we only use slower methods if it fails
  await emailInput.fill(email);
  await passwordInput.fill(password);
  
  // Ensure inputs have the values
  await expect(emailInput).toHaveValue(email);
  await expect(passwordInput).toHaveValue(password);
  
  await page.getByRole('button', { name: /Login|Entrar/i }).click();
  
  // Wait for navigation to complete
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginByApi(
  page: Page,
  email: string,
  password = 'playwright123',
  selectedSchoolId = ''
) {
  const response = await page.request.post('/api/auth', {
    data: {
      action: 'login',
      email,
      password,
    },
  })

  expect(response.ok()).toBe(true)
  const { token, teacher } = await response.json()

  await page.addInitScript((authState) => {
    localStorage.setItem('token', authState.token)
    localStorage.setItem('teacher', JSON.stringify(authState.teacher))
    if (authState.selectedSchoolId) {
      localStorage.setItem('selectedSchool', authState.selectedSchoolId)
    }
  }, { token, teacher, selectedSchoolId })
}
