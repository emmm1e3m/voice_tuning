"""按原图绘图区复描训练章节的七幅实测频谱。"""

import base64
import json
import re
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from manual_chart_digitize import extract_panel, source_for


ROOT = Path(__file__).resolve().parents[1]
QA = Path(tempfile.gettempdir()) / 'manual-spectra-training-qa'
QA.mkdir(exist_ok=True)

RIGHT_AXES = [
    {'kind': 'pitch', 'label': '基频 F0', 'min': 60, 'max': 500, 'unit': 'Hz'},
    {'kind': 'intensity', 'label': '音强', 'min': 50, 'max': 100, 'unit': 'dB'},
]

# 边界均为原截图中绘图区的内部像素；时间、频率与右轴按截图原刻度读取。
CONFIGS = [
    {
        'prefix': 'f1f4e27', 'title': '从低音到高音的 F0 爬升',
        'bounds': (94, 14, 877, 269), 'duration': 8.435271, 'ceiling': 5000,
        'trace_kinds': ('pitch', 'intensity'),
        'cursor_regions': [(94, 128, 877, 134), (816, 14, 822, 269)],
    },
    {
        'prefix': '3ed715b', 'title': 'wow 训练：正常嘴型与咧嘴状态',
        'bounds': (93, 21, 933, 336), 'duration': 2.669375, 'ceiling': 5000,
        'cursor_regions': [(93, 237, 935, 243), (655, 21, 661, 336)],
        'segments': [{'x': 222, 'label': '正常嘴型'}, {'x': 683, 'label': '咧嘴状态'}],
    },
    {
        'prefix': '4.jpg', 'title': '大狗小狗训练',
        'bounds': (94, 22, 847, 319), 'duration': 3.667812, 'ceiling': 5000,
        'trace_kinds': (), 'right_axes': [],
        'cursor_regions': [(453, 22, 459, 319)],
        'segments': [{'x': 223, 'label': '大狗'}, {'x': 760, 'label': '小狗'}],
    },
    {
        'prefix': 'e41a5c1', 'title': '/a/：小嘴型与大嘴型',
        'bounds': (105, 23, 1042, 360), 'duration': 1.971917, 'ceiling': 2000,
        'cursor_regions': [(105, 207, 1043, 213), (863, 23, 869, 360)],
        'segments': [{'x': 251, 'label': '小嘴型 /a/'}, {'x': 788, 'label': '大嘴型 /a/'}],
    },
    {
        'prefix': '4b724a1', 'title': '/o/：小而噘嘴与更开放的嘴型',
        'bounds': (107, 26, 1036, 361), 'duration': 2.256792, 'ceiling': 2000,
        'cursor_regions': [(107, 228, 1036, 234), (840, 26, 846, 361)],
        'segments': [{'x': 283, 'label': '小而噘嘴 /o/'}, {'x': 798, 'label': '更开放 /o/'}],
    },
    {
        'prefix': '22d32d5', 'title': '/e/：小嘴型与咧嘴开口',
        'bounds': (116, 21, 1034, 350), 'duration': 2.152833, 'ceiling': 2000,
        'cursor_regions': [(116, 232, 1034, 238), (804, 21, 810, 350)],
        'segments': [{'x': 244, 'label': '小嘴型 /e/'}, {'x': 758, 'label': '咧嘴开口 /e/'}],
    },
    {
        'prefix': '81a1eb3', 'title': '减少气流与增强气流',
        'bounds': (91, 21, 915, 327), 'duration': 4.239417, 'ceiling': 5000,
        'trace_kinds': ('pitch', 'intensity'),
        'segments': [{'x': 229, 'label': '减少气流'}, {'x': 800, 'label': '增强气流'}],
    },
]


def clean_annotations(source, bounds, cursor_regions):
    """局部插值清理绿色读数与光标，保留其附近可辨认的测量轨迹。"""
    rgb = np.asarray(Image.open(source).convert('RGB'), dtype=np.float32)
    left, top, right, bottom = bounds
    crop = rgb[top:bottom, left:right]
    red, green, blue = crop[:, :, 0], crop[:, :, 1], crop[:, :, 2]
    green_text = (green > 90) & (green - red > 12) & (green - blue > 18)
    # JPEG 抗锯齿边缘也属于文字，略微扩展文字像素以免留下彩色碎屑。
    padded_green = np.pad(green_text, 2)
    marked = np.zeros(green_text.shape, dtype=bool)
    for dy in range(5):
        for dx in range(5):
            marked |= padded_green[dy:dy + crop.shape[0], dx:dx + crop.shape[1]]
    strong_red = (red > 120) & (red - green > 70) & (red - blue > 65)
    other_measurement = (
        ((blue > 110) & (blue - red > 28) & (blue - green > 8))
        | ((red > 105) & (green > 105) & (np.minimum(red, green) - blue > 32))
    )
    for x1, y1, x2, y2 in cursor_regions:
        cursor_area = np.zeros(green_text.shape, dtype=bool)
        cursor_area[max(0, y1-top):max(0, y2-top), max(0, x1-left):max(0, x2-left)] = True
        # 竖游标上孤立的红点不属于共振峰；真实测量线在水平方向有相邻点支持。
        supported_red = strong_red
        if x2 - x1 <= 8:
            cursor_area[max(0, y1-top):max(0, y2-top), max(0, x1-left-4):max(0, x2-left+4)] = True
            cursor_area &= (red - green > 4) & (red - blue > 4)
            support = np.zeros(strong_red.shape, dtype=bool)
            support[:, 12:] |= strong_red[:, :-12]
            support[:, :-12] |= strong_red[:, 12:]
            supported_red = strong_red & support
        marked |= cursor_area & ~(other_measurement | supported_red)
    known = ~marked
    for _ in range(16):
        if known.all():
            break
        padded = np.pad(crop, ((1, 1), (1, 1), (0, 0)), mode='edge')
        valid = np.pad(known, 1, mode='edge')
        sums = np.zeros(crop.shape, dtype=np.float32)
        counts = np.zeros(known.shape, dtype=np.float32)
        for dy in range(3):
            for dx in range(3):
                active = valid[dy:dy + crop.shape[0], dx:dx + crop.shape[1]]
                sums += padded[dy:dy + crop.shape[0], dx:dx + crop.shape[1]] * active[:, :, None]
                counts += active
        filled = ~known & (counts > 0)
        crop[filled] = sums[filled] / counts[filled, None]
        known[filled] = True
    cleaned = QA / f'clean-{source.name}'
    Image.fromarray(np.clip(rgb, 0, 255).astype('uint8')).save(cleaned.with_suffix('.png'))
    return cleaned.with_suffix('.png')


def save_qa(source, bounds, panel, index):
    """直接以已输出的灰度矩阵和轨迹路径重建，供原图左右对照。"""
    columns, rows = panel['columns'], panel['rows']
    density = np.frombuffer(base64.b64decode(panel['density']), dtype=np.uint8).reshape(rows, columns)
    restored = Image.fromarray(density).convert('RGB').resize((3840, 1152), Image.Resampling.BILINEAR)
    draw = ImageDraw.Draw(restored)
    colors = {'formants': '#d83948', 'pitch': '#2478b8', 'intensity': '#ba941c'}
    pattern = r'M([\d.]+),([\d.]+)h([\d.]+)v([\d.]+)h-[\d.]+z'
    for trace in panel['traces']:
        for path in trace['paths']:
            for x, y, w, h in re.findall(pattern, path):
                x, y, w, h = map(float, (x, y, w, h))
                draw.rectangle((x * 3.84, y * 1.152, (x + w) * 3.84 - 1, (y + h) * 1.152 - 1), fill=colors[trace['kind']])
    restored = restored.resize((960, 288), Image.Resampling.LANCZOS)
    original = Image.open(source).convert('RGB').crop(bounds).resize((960, 288))
    board = Image.new('RGB', (1920, 320), '#f4f4f4')
    board.paste(original, (0, 26))
    board.paste(restored, (960, 26))
    ImageDraw.Draw(board).text((12, 6), f'{index}: source crop / digitized output', fill='#303030')
    board.save(QA / f'{index:02d}-{source.stem[:8]}.png')


def main():
    import os
    os.chdir(ROOT)
    figures = {}
    for index, config in enumerate(CONFIGS, start=1):
        source = source_for(config['prefix'])
        clean = clean_annotations(source, config['bounds'], config.get('cursor_regions', ()))
        panel = extract_panel(
            clean, config['bounds'],
            {'label': '时间', 'min': 0, 'max': config['duration'], 'unit': 's'},
            {'label': '频率', 'min': 0, 'max': config['ceiling'], 'unit': 'Hz'},
            columns=480, rows=144,
            trace_kinds=config.get('trace_kinds', ('formants', 'pitch', 'intensity')),
            right_axes=config.get('right_axes', RIGHT_AXES),
            segments=config.get('segments'),
        )
        figures[source.name] = {'title': config['title'], 'panels': [panel]}
        save_qa(source, config['bounds'], panel, index)
    target = ROOT / 'src/content/referenceSpectrogramTraining.ts'
    target.write_text(
        "import type { DigitizedSpectrogram } from './referenceSpectrogramTypes'\n\n"
        '// 从原图绘图区数字化；灰阶与有色测量轨迹按原像素保留。\n'
        'export const REFERENCE_SPECTROGRAM_TRAINING: Record<string, DigitizedSpectrogram> = '
        + json.dumps(figures, ensure_ascii=False, separators=(',', ':'))
        + '\n\nexport default REFERENCE_SPECTROGRAM_TRAINING\n',
        encoding='utf-8',
    )
    print(f'已提取 {len(figures)} 图：{target}')
    print(f'对照图：{QA}')


if __name__ == '__main__':
    main()
