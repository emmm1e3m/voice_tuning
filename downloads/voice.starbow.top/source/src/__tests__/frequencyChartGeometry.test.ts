// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as echarts from 'echarts'
import { frequencyAxis } from '../utils/frequencyChart'
import { chartTimeAxis } from '../utils/chartTimeline'

describe('native ECharts frequency geometry', () => {
  it('renders rounded crosshair labels in an actual empty ECharts instance', () => {
    const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width: 600, height: 360 })
    try {
      chart.setOption({
        animation: false,
        grid: { left: 90, right: 30, top: 20, bottom: 40 },
        tooltip: { trigger: 'axis', renderMode: 'richText', axisPointer: { type: 'cross' } },
        xAxis: chartTimeAxis([], false),
        yAxis: frequencyAxis('log', 3500, false, []),
        series: [{ type: 'line', data: [] }],
      } as echarts.EChartsOption)
      chart.dispatchAction({
        type: 'updateAxisPointer', currTrigger: 'mousemove',
        x: chart.convertToPixel({ xAxisIndex: 0 }, 8.21),
        y: chart.convertToPixel({ yAxisIndex: 0 }, 451.924890466),
      })
      const svg = chart.renderToSVGString()
      expect(svg).toContain('>452 Hz</text>')
      expect(svg).toContain('>8 s</text>')
      expect(svg).not.toContain('451.924')
    } finally { chart.dispose() }
  })

  it.each(['log', 'linear'] as const)('renders actual Hz with %s scaling and finite SVG geometry', scale => {
    const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width: 600, height: 360 })
    try {
      const data = [[0, 100], [1, 200], [2, null], [3, 400]]
      chart.setOption({
        animation: false,
        grid: { left: 70, right: 20, top: 20, bottom: 30 },
        xAxis: { type: 'value', min: 0, max: 3 },
        yAxis: frequencyAxis(scale, 3500, false, [100, 200, 400]),
        series: [{ type: 'line', connectNulls: false, data }],
      } as echarts.EChartsOption)
      const positions = [100, 200, 400].map(value => chart.convertToPixel({ yAxisIndex: 0 }, value) as number)
      const first = positions[0] - positions[1]
      const second = positions[1] - positions[2]
      if (scale === 'log') expect(first).toBeCloseTo(second)
      else expect(second).toBeCloseTo(first * 2)
      const svg = chart.renderToSVGString()
      expect(svg).toContain('Hz')
      expect(svg).not.toMatch(/NaN|Infinity/)
      expect((chart.getOption().series as Array<{ data: unknown }>)[0].data).toEqual(data)
    } finally { chart.dispose() }
  })
})
