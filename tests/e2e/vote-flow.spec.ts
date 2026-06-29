import { test, expect } from '@playwright/test'

/**
 * E2E tests for the public voting flow.
 * These tests require a running dev server and a seeded Supabase project.
 * Set TEST_PROJECT_SLUG, TEST_PROJECT_SHORT_ID env vars to a known test project.
 */

const slug = process.env.TEST_PROJECT_SLUG ?? 'test-project'
const shortId = process.env.TEST_PROJECT_SHORT_ID ?? 'testid1'
const voteUrl = `/vote/${slug}/${shortId}`

test.describe('Open votes hub', () => {
  test('shows heading and project cards or empty state', async ({ page }) => {
    await page.goto('/open')
    await expect(page.getByRole('heading', { name: 'Open votes' })).toBeVisible()
  })
})

test.describe('Voting page', () => {
  test('shows the project and option cards', async ({ page }) => {
    await page.goto(voteUrl)
    await expect(page.getByText('Which one do you prefer?')).toBeVisible()
  })

  test('requires all three fields before submitting', async ({ page }) => {
    await page.goto(voteUrl)

    // Click the first "I prefer this" button
    await page.getByRole('button', { name: 'I prefer this' }).first().click()

    // Submit button should be disabled
    const submitBtn = page.getByRole('button', { name: 'Submit vote' })
    await expect(submitBtn).toBeDisabled()

    // Fill name only
    await page.getByLabel('Your name').fill('Test User')
    await expect(submitBtn).toBeDisabled()

    // Fill email
    await page.getByLabel('Work email').fill('test@company.com')
    await expect(submitBtn).toBeDisabled()

    // Fill reason
    await page.getByLabel('Why did you prefer this one?').fill('Because it looks great')
    await expect(submitBtn).toBeEnabled()
  })

  test('shows helper text for missing fields', async ({ page }) => {
    await page.goto(voteUrl)
    await page.getByRole('button', { name: 'I prefer this' }).first().click()
    await expect(page.getByText('Enter your name')).toBeVisible()
  })

  test('can go back from form to options', async ({ page }) => {
    await page.goto(voteUrl)
    await page.getByRole('button', { name: 'I prefer this' }).first().click()
    await page.getByRole('button', { name: 'Back to options' }).click()
    await expect(page.getByText('Which one do you prefer?')).toBeVisible()
  })
})

test.describe('Results mode', () => {
  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Design Hub')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Admin sign in' })).toBeVisible()
  })
})

test.describe('Admin login page', () => {
  test('shows blank email field (no pre-fill)', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.getByLabel('Work email')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveValue('')
  })

  test('shows error for non-company email', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Work email').fill('user@gmail.com')
    await page.getByRole('button', { name: 'Send sign-in link' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('voting page has no duplicate landmarks', async ({ page }) => {
    await page.goto(voteUrl)
    const mains = await page.getByRole('main').count()
    expect(mains).toBe(1)
  })

  test('form labels are connected to inputs', async ({ page }) => {
    await page.goto(voteUrl)
    await page.getByRole('button', { name: 'I prefer this' }).first().click()
    await expect(page.getByRole('textbox', { name: 'Your name' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Work email' })).toBeVisible()
  })
})
