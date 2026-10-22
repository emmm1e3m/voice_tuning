"""从已下载图像的绘图区数字化明暗和有色轨迹，不生成声学样本。"""

import base64
from pathlib import Path

import numpy as np
from PIL import Image


def mask_path(mask):
    """合并相邻同宽像素行，精确保留原图点线轮廓而不放大轨迹。"""
    height, width = mask.shape
    active = {}
    rectangles = []
    for y in range(height + 1):
        if y < height:
            edges = np.diff(np.pad(mask[y].astype('int8'), (1, 1)))
            runs = set(zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)))
        else:
            runs = set()
        for run in active.keys() - runs:
            rectangles.append((*run, active.pop(run), y))
        for run in runs - active.keys():
            active[run] = y
    pieces = []
    for start, end, top, bottom in rectangles:
        px, py = start / width * 1000, top / height * 1000
        rw, rh = (end - start) / width * 1000, (bottom - top) / height * 1000
        pieces.append(f'M{px:.2f},{py:.2f}h{rw:.2f}v{rh:.2f}h{-rw:.2f}z')
    return ''.join(pieces)


def extract_panel(source, bounds, x_axis, y_axis, *, label=None, columns=480, rows=144,
                  trace_kinds=('formants', 'pitch', 'intensity'), exclude_traces=(),
                  right_axes=None, segments=None):
    image = Image.open(source).convert('RGB')
    left, top, right, bottom = bounds
    rgb = np.asarray(image.crop(bounds), dtype=np.float32)
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    masks = {
        'formants': (red > 120) & (red - green > 28) & (red - blue > 24),
        'pitch': (blue > 110) & (blue - red > 28) & (blue - green > 8),
        'intensity': (red > 105) & (green > 105) & (np.minimum(red, green) - blue > 32),
    }
    # 有色叠加的底层灰阶不可见，使用紧邻灰阶像素的局部平均去除颜色干扰。
    green_annotation = (green > 80) & (green - red > 8) & (green - blue > 10)
    masks['intensity'] &= ~green_annotation
    colored = masks['formants'] | masks['pitch'] | masks['intensity'] | green_annotation
    gray = .2126 * red + .7152 * green + .0722 * blue
    known = ~colored
    gray[~known] = 0
    for _ in range(10):
        if known.all():
            break
        padded = np.pad(gray, 1, mode='edge')
        valid = np.pad(known, 1, mode='edge')
        sums = np.zeros(gray.shape, dtype=np.float32)
        counts = np.zeros(gray.shape, dtype=np.float32)
        for dy in range(3):
            for dx in range(3):
                sample_known = valid[dy:dy + gray.shape[0], dx:dx + gray.shape[1]]
                sums += padded[dy:dy + gray.shape[0], dx:dx + gray.shape[1]] * sample_known
                counts += sample_known
        filled = ~known & (counts > 0)
        gray[filled] = sums[filled] / counts[filled]
        known[filled] = True
    gray[~known] = 255
    density = Image.fromarray(np.clip(gray, 0, 255).astype('uint8')).resize((columns, rows), Image.Resampling.LANCZOS)
    traces = []
    for kind in trace_kinds:
        mask = masks.get(kind)
        if mask is None:
            continue
        mask = mask.copy()
        for x1, y1, x2, y2 in exclude_traces:
            mask[max(0, y1-top):max(0, y2-top), max(0, x1-left):max(0, x2-left)] = False
        path = mask_path(mask)
        if path:
            traces.append({'kind': kind, 'paths': [path]})
    result = {
        'columns': columns, 'rows': rows,
        'density': base64.b64encode(density.tobytes()).decode('ascii'),
        'traces': traces, 'xAxis': x_axis, 'yAxis': y_axis,
    }
    if label:
        result['label'] = label
    if right_axes:
        result['rightAxes'] = right_axes
    if segments:
        result['segments'] = segments
    return result


def source_for(prefix):
    return next(path for path in Path('public/manual').rglob('*.jpg') if path.name.startswith(prefix))
