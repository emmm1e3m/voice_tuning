import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ReferenceVowelSpaces } from '../components/ReferenceVowelSpaces'

afterEach(cleanup)

it('compares the distinct male and female vowel data on the same coordinate scale', () => {
  const { container } = render(<>
    <ReferenceVowelSpaces src="c95cf26bcdf3188881604011286d78e430b51295e55de32a56f362dda68d298e.jpg" />
    <ReferenceVowelSpaces src="01ee88cdf6e1652d9b384fdb1d6dc7e1c5212bb9813fd5736b198eb5041d29c8.jpg" />
  </>)
  const [male, female] = Array.from(container.querySelectorAll('svg'))
  const neutralA = (chart: SVGSVGElement) => chart.querySelector('[data-vsa-condition="neutral"] [data-vsa-vowel="æ"]')!
  expect([neutralA(male).getAttribute('data-f1'), neutralA(male).getAttribute('data-f2')]).toEqual(['735', '1505'])
  expect([neutralA(female).getAttribute('data-f1'), neutralA(female).getAttribute('data-f2')]).toEqual(['960', '1780'])
  const ticks = (chart: SVGSVGElement) => Array.from(chart.querySelectorAll('text')).map(node => node.textContent).filter(text => /^\d+$/.test(text ?? ''))
  expect(ticks(male)).toEqual(ticks(female))
  expect(ticks(male)).toHaveLength(18)
})
