import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ManualPage } from '../routes/ManualPage'

vi.mock('../components/ManualFigure', () => ({ ManualFigure: ({ caption }: { caption: string }) => <figure aria-label={caption}><figcaption>{caption}</figcaption></figure> }))

afterEach(cleanup)

it('starts the introduction with the directory without repeating the title page', async () => {
  render(<MemoryRouter initialEntries={['/manual']}><ManualPage /></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: '目录', level: 2 })).toBeTruthy()
  const article = screen.getByRole('article', { name: '目录' })
  expect(article.querySelector('h2')?.textContent).toBe('目录')
  expect(article.querySelector('h1')).toBeNull()
  expect(within(article).queryByText('By Aoi')).toBeNull()
  expect(article.textContent).not.toMatch(/2021 年 7 月|2026 年 5 月/)
  expect(screen.getAllByRole('heading', { name: 'MTF 声音女性化练习手册' })).toHaveLength(1)
  expect(screen.getByRole('button', { name: '01 目录' })).toBeTruthy()
})

it('opens bookmarked chapters and loads their original sections and illustrations', async () => {
  render(<MemoryRouter initialEntries={['/manual?chapter=foreword']}><ManualPage /></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: '为什么练习声音女性化' })).toBeTruthy()
  expect(screen.getByRole('link', { name: '打开发声交互演示' }).getAttribute('href')).toBe('/interactive')
  fireEvent.click(screen.getByRole('button', { name: '03 背景知识' }))
  expect(await screen.findByRole('heading', { name: '1、声道（vocal tract）的结构：' })).toBeTruthy()
  expect(screen.getByText(/会厌是独立的弹性软骨/)).toBeTruthy()
  expect(screen.getByText(/不能据此推出 Twang 保护嗓子/)).toBeTruthy()
  await waitFor(() => expect(screen.getAllByRole('figure').length).toBe(10))
  fireEvent.change(screen.getByRole('combobox', { name: '当前章节' }), { target: { value: 'references' } })
  expect(await screen.findByText(/Nonlinear source-filter coupling in phonation/)).toBeTruthy()
  expect(screen.getByRole('heading', { name: '参考文献注释' })).toBeTruthy()
})
