"""按原始绘图区采样原理章节的六张实测图，保留可读的原始坐标。"""

import base64
import json
import re
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from manual_chart_digitize import extract_panel, mask_path, source_for


def time_axis(maximum):
    return {'label': '时间', 'min': 0, 'max': maximum, 'unit': 's'}


frequency_axis = {'label': '频率', 'min': 0, 'max': 5000, 'unit': 'Hz'}

# 坐标取绘图边框内侧；排除软件游标，避免将定位虚线误认为测得的共振峰。
specifications = [
    ('e6caba', '时频图的明暗分布', [
        dict(bounds=(119, 16, 1012, 318), x_axis=time_axis(.567208),
             y_axis=frequency_axis, trace_kinds=()),
    ]),
    ('5d443', '时频图上的共振峰追踪点', [
        dict(bounds=(103, 19, 1004, 333), x_axis=time_axis(.567208),
             y_axis=frequency_axis, trace_kinds=('formants',)),
    ]),
    ('b68aa', '较高基频下的时频图', [
        dict(bounds=(115, 19, 1000, 341), x_axis=time_axis(.522437),
             y_axis=frequency_axis, trace_kinds=('formants',)),
    ]),
    ('fe02a', '元音 /a/ 与 /u/ 的第一共振峰', [
        dict(bounds=(101, 17, 1084, 369), x_axis=time_axis(5.327187),
             y_axis=frequency_axis, trace_kinds=('formants',),
             segments=[{'x': 265, 'label': '/a/'}, {'x': 792, 'label': '/u/'}]),
    ]),
    ('765fff', '前后舌位发 /a/ 时的第二共振峰', [
        dict(bounds=(101, 22, 1081, 372), x_axis=time_axis(4.495375),
             y_axis=frequency_axis, trace_kinds=('formants',),
             segments=[{'x': 290, 'label': '前舌位 /a/'}, {'x': 809, 'label': '后舌位 /a/'}]),
    ]),
    ('cd390', '波形、频谱、音高、音强与共振峰', [
        dict(bounds=(138, 101, 1035, 256), x_axis=time_axis(4.720479),
             y_axis={'label': '相对幅度', 'min': -.9683, 'max': .8247, 'unit': ''},
             label='声道 1 波形', rows=72, trace_kinds=()),
        dict(bounds=(138, 262, 1035, 418), x_axis=time_axis(4.720479),
             y_axis={'label': '相对幅度', 'min': -.9683, 'max': .8247, 'unit': ''},
             label='声道 2 波形', rows=72, trace_kinds=()),
        dict(bounds=(138, 422, 1035, 742), x_axis=time_axis(4.720479),
             y_axis=frequency_axis, label='频谱与声学轨迹',
             right_axes=[
                 {'kind': 'pitch', 'label': '基频', 'min': 60, 'max': 500, 'unit': 'Hz'},
                 {'kind': 'intensity', 'label': '音强', 'min': 50, 'max': 100, 'unit': 'dB'},
             ]),
    ]),
]


cursor_regions = {
    'b68aa': [(115, 336, 1000, 341, 'horizontal-edge')],
    'fe02a': [(101, 316, 1084, 322, 'horizontal'), (303, 17, 308, 369, 'vertical')],
    '765fff': [(101, 297, 1081, 303, 'horizontal'), (901, 22, 907, 372, 'vertical')],
    'cd390': [(584, 101, 591, 742, 'vertical')],
}


def clean_cursor(source, prefix, output_dir):
    """仅替换已知定位线中的淡红像素，保留交点处的高饱和实测红点。"""
    if prefix not in cursor_regions:
        return source
    rgb = np.asarray(Image.open(source).convert('RGB'), dtype=np.float32).copy()
    original = rgb.copy()
    for left, top, right, bottom, direction in cursor_regions[prefix]:
        region = original[top:bottom, left:right]
        red, green, blue = region[:, :, 0], region[:, :, 1], region[:, :, 2]
        chroma = region.max(axis=2) - region.min(axis=2)
        cursor = (red - green > 5) & (red - blue > 5) & (chroma < 75)
        if direction.startswith('horizontal'):
            upper = original[max(0, top - 1), left:right].mean(axis=1)
            # 紧贴坐标轴的标注不能取轴外黑边作为灰阶参照。
            lower = upper if direction.endswith('edge') else original[min(original.shape[0] - 1, bottom), left:right].mean(axis=1)
            weights = np.linspace(0, 1, bottom - top + 2, dtype=np.float32)[1:-1, None]
            replacement = (1 - weights) * upper[None, :] + weights * lower[None, :]
        else:
            before = original[top:bottom, max(0, left - 1)].mean(axis=1)
            after = original[top:bottom, min(original.shape[1] - 1, right)].mean(axis=1)
            weights = np.linspace(0, 1, right - left + 2, dtype=np.float32)[None, 1:-1]
            replacement = (1 - weights) * before[:, None] + weights * after[:, None]
        rgb[top:bottom, left:right][cursor] = replacement[cursor, None]
    output = output_dir / (prefix + '-cursor-cleaned.png')
    Image.fromarray(np.clip(rgb, 0, 255).astype('uint8')).save(output)
    return output


def remove_intensity_label_fragments(source, panel):
    """右上角软件音强刻度的少量黄边不属于测得的黄色轨迹。"""
    rgb = np.asarray(Image.open(source).convert('RGB').crop((138, 422, 1035, 742)), dtype=np.float32)
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    mask = (red > 105) & (green > 105) & (np.minimum(red, green) - blue > 32)
    mask &= ~((green > 80) & (green - red > 8) & (green - blue > 10))
    # 原图该区域只有“100 dB”刻度文字，黄色音强曲线位于其下方。
    mask[:26, 979 - 138:] = False
    for trace in panel['traces']:
        if trace['kind'] == 'intensity':
            trace['paths'] = [mask_path(mask)]


def comparison_image(source, configs, panels, output):
    """以相同尺寸显示原始绘图区与复描，供人工核对。"""
    target_width = 720
    gap = 18
    heights = [round((c['bounds'][3] - c['bounds'][1]) /
                     (c['bounds'][2] - c['bounds'][0]) * target_width) for c in configs]
    result = Image.new('RGB', (target_width * 2 + gap * 3,
                              sum(heights) + gap * (len(heights) + 1) + 28), '#f3f5f8')
    draw = ImageDraw.Draw(result)
    draw.text((gap, 9), 'Original plot pixels', fill='#202530')
    draw.text((target_width + gap * 2, 9), 'Digitized grayscale and measured traces', fill='#202530')
    top = 28 + gap
    color = {'formants': '#ee5868', 'pitch': '#2673dd', 'intensity': '#b7ad16'}
    for config, panel, height in zip(configs, panels, heights):
        original = Image.open(source).convert('RGB').crop(config['bounds'])
        original = original.resize((target_width, height), Image.Resampling.LANCZOS)
        result.paste(original, (gap, top))
        density = np.frombuffer(base64.b64decode(panel['density']), dtype='uint8')
        rebuilt = Image.fromarray(density.reshape(panel['rows'], panel['columns'])).convert('RGB')
        scale = 3
        rebuilt = rebuilt.resize((target_width * scale, height * scale), Image.Resampling.BICUBIC)
        painter = ImageDraw.Draw(rebuilt)
        for trace in panel['traces']:
            for path in trace['paths']:
                for x, y, width, rect_height in re.findall(r'M([\d.]+),([\d.]+)h([\d.]+)v([\d.]+)h-[\d.]+z', path):
                    x, y, width, rect_height = map(float, (x, y, width, rect_height))
                    painter.rectangle((x / 1000 * target_width * scale, y / 1000 * height * scale,
                                       (x + width) / 1000 * target_width * scale,
                                       (y + rect_height) / 1000 * height * scale), fill=color[trace['kind']])
        rebuilt = rebuilt.resize((target_width, height), Image.Resampling.LANCZOS)
        result.paste(rebuilt, (target_width + gap * 2, top))
        top += height + gap
    result.save(output)


records = {}
qa_dir = Path(tempfile.gettempdir()) / 'manual-chart-principles-qa'
qa_dir.mkdir(exist_ok=True)
for prefix, title, configs in specifications:
    source = source_for(prefix)
    cleaned_source = clean_cursor(source, prefix, qa_dir)
    panels = [extract_panel(cleaned_source, **config) for config in configs]
    if prefix == 'cd390':
        remove_intensity_label_fragments(cleaned_source, panels[-1])
    records[source.name] = {'title': title, 'panels': panels}
    comparison_image(source, configs, panels, qa_dir / (prefix + '.png'))

output_path = Path('src/content/referenceSpectrogramPrinciples.ts')
output_path.write_text(
    "import type { DigitizedSpectrogram } from './referenceSpectrogramTypes'\n\n"
    '// 灰阶与有色轨迹均采自原图绘图区；定位游标已排除，不生成或补造实测数据。\n'
    'export const REFERENCE_SPECTROGRAM_PRINCIPLES: Record<string, DigitizedSpectrogram> = '
    + json.dumps(records, ensure_ascii=False, separators=(',', ':'))
    + '\n', encoding='utf-8')
print(f'Wrote {len(records)} figures, {sum(len(x["panels"]) for x in records.values())} panels: {output_path}')
print(f'Comparison images: {qa_dir}')
