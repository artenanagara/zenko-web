import { expect, gotoHydrated, test } from './support/fixtures'
import { mockSignedOut } from './support/auth'
import { SAMPLE_BLUEPRINTS, scoreSample } from './support/catalog'

const SLUG = 'cpns-2026-intensif'
const BLUEPRINT = SAMPLE_BLUEPRINTS[SLUG]!
const QUESTIONS = BLUEPRINT.sections.flatMap(section => section.questions)

/** B is the right answer on every fixture question, objective and situational. */
const PERFECT = scoreSample(SLUG, Object.fromEntries(QUESTIONS.map(q => [q.id, 'B'])))!

/**
 * The free sample ("coba gratis"), whose grading is the one thing it does not
 * do in the browser: its questions arrive without an answer key, so finishing
 * posts the answers and renders what the API scored.
 */
test.describe('free sample (/paket/:slug/coba)', () => {
  test.beforeEach(async ({ page }) => {
    await mockSignedOut(page)
    await gotoHydrated(page, `/paket/${SLUG}/coba`)
    await page.getByRole('button', { name: 'Mulai coba gratis' }).click()
  })

  /**
   * Picks the same option position on every question and moves on while there
   * is a next. By position, not by text: the fixture's situational options
   * read as real TKP answers rather than "Pilihan B".
   */
  async function answerAll(page: import('@playwright/test').Page, position: number) {
    for (let i = 0; i < QUESTIONS.length; i++) {
      await expect(page.getByText(`Soal ${i + 1} dari ${QUESTIONS.length}`)).toBeVisible()
      await page.getByRole('radiogroup').getByRole('radio').nth(position).click()
      if (i < QUESTIONS.length - 1) {
        await page.getByRole('button', { name: 'Selanjutnya' }).click()
      }
    }
  }

  async function endSitting(page: import('@playwright/test').Page) {
    await page.getByRole('button', { name: 'Selesaikan Ujian' }).click()
    await page.getByRole('button', { name: 'Ya, selesaikan' }).click()
  }

  test('grades a finished sitting through the API', async ({ page }) => {
    // The regression this guards: the sample carries no `scores`, so grading
    // it in the browser threw and the button appeared to do nothing.
    const crashes: string[] = []
    page.on('pageerror', error => crashes.push(error.message))

    // Position 1 is option B — right on every fixture question.
    await answerAll(page, 1)
    await endSitting(page)

    await expect(page.getByText('Coba gratis selesai')).toBeVisible()
    await expect(page.getByText(`/ ${PERFECT.maxScore} poin · 100%`)).toBeVisible()

    for (const section of PERFECT.sections) {
      await expect(
        page.getByText(`${section.correct} dari ${section.total} tepat`).first(),
      ).toBeVisible()
    }
    expect(crashes).toEqual([])
  })

  test('an unanswered sitting still scores every question shown', async ({ page }) => {
    await endSitting(page)

    await expect(page.getByText('Coba gratis selesai')).toBeVisible()
    // Zero points, but the denominator is the whole sample: the totals come
    // from the API's own picks, not from what was submitted.
    await expect(page.getByText(`/ ${PERFECT.maxScore} poin · 0%`)).toBeVisible()
    await expect(page.getByText(`0 dari ${BLUEPRINT.sections[0]!.questions.length} tepat`)).toBeVisible()
  })

  test('offers a retry when grading cannot reach the API', async ({ page }) => {
    await page.route(`**/packages/${SLUG}/sample/score`, route => route.abort())

    await endSitting(page)

    // No score is invented from a failed request — the answers are still in
    // the session, so the page asks to try again.
    await expect(page.getByRole('heading', { name: 'Nilai belum bisa dihitung' })).toBeVisible()

    await page.unroute(`**/packages/${SLUG}/sample/score`)
    await page.getByRole('button', { name: 'Nilai ulang' }).click()

    await expect(page.getByText('Coba gratis selesai')).toBeVisible()
  })
})
