"""Generate the APEX CONTROL app icons (no external dependencies).

Run with:  python3 scripts/generate_icons.py
Writes:    public/icon-192.png, public/icon-512.png, public/icon-maskable.png
"""

from __future__ import annotations

import math
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')

# accent palette (must stay in sync with the dashboard defaults)
ACCENT_A = (34, 211, 238)
ACCENT_B = (129, 140, 248)
BACKGROUND = (7, 11, 22)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def mix(color_a, color_b, t: float):
    return tuple(int(round(lerp(color_a[i], color_b[i], t))) for i in range(3))


def rounded_rect_mask(size: int, radius: float, inset: float = 0.0):
    """Boolean coverage mask of a rounded rectangle (supersampled edges)."""
    mask = [[False] * size for _ in range(size)]
    r = radius
    left, top, right, bottom = inset, inset, size - 1 - inset, size - 1 - inset
    for y in range(size):
        for x in range(size):
            cx = min(max(x, left + r), right - r)
            cy = min(max(y, top + r), bottom - r)
            if (x - cx) ** 2 + (y - cy) ** 2 <= (r + 0.5) ** 2:
                mask[y][x] = True
    return mask


def point_in_triangle(px, py, ax, ay, bx, by, cx, cy) -> bool:
    d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
    d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
    d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (has_neg and has_pos)


def draw_logo(size: int):
    """Return an RGBA pixel buffer with the abstract 'A' mark."""
    mask = rounded_rect_mask(size, size * 0.26)
    pixels = [[0, 0, 0, 0] for _ in range(size * size)]

    # --- chevron "A" geometry (same proportions as src/assets/logo.svg) -------
    unit = size / 48.0
    apex = (24 * unit, 11.5 * unit)
    left_top = (11.5 * unit, 36 * unit)
    right_top = (36.5 * unit, 36 * unit)
    bar_left = (18.4 * unit, 30.8 * unit)
    bar_right = (29.6 * unit, 30.8 * unit)
    bar_bottom = (24 * unit, 25.6 * unit)

    for y in range(size):
        for x in range(size):
            index = y * size + x
            if not mask[y][x]:
                continue

            # background gradient (top-left -> bottom-right)
            t = (x / size * 0.55) + (y / size * 0.45)
            base = mix(BACKGROUND, mix(ACCENT_A, ACCENT_B, 0.45), 0.22 + 0.35 * t)

            # soft glow behind the mark
            gx, gy = 24 * unit, 24 * unit
            distance = math.hypot(x - gx, y - gy) / (size * 0.55)
            glow = max(0.0, 1.0 - distance) ** 2 * 0.35
            base = mix(base, mix(ACCENT_A, ACCENT_B, 0.5), glow)

            # the mark itself: outer chevron minus inner counter
            in_outer = point_in_triangle(
                x, y, apex[0], apex[1], left_top[0], left_top[1], 17.3 * unit, 36 * unit
            ) or point_in_triangle(x, y, apex[0], apex[1], 30.7 * unit, 36 * unit, right_top[0], right_top[1])
            in_inner = point_in_triangle(x, y, *bar_left, *bar_right, *bar_bottom)

            if in_outer and not in_inner:
                shade = mix(ACCENT_A, ACCENT_B, min(1.0, max(0.0, (x / size) * 0.7 + (y / size) * 0.3)))
                base = mix(base, shade, 0.92)

            pixels[index] = [base[0], base[1], base[2], 255]

    return pixels


def write_png(path: str, size: int, pixels) -> None:
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter: none
        for x in range(size):
            r, g, b, a = pixels[y * size + x]
            raw += bytes((r, g, b, a))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack('>I', len(data))
            + tag
            + data
            + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    header = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    payload = (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', header)
        + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
        + chunk(b'IEND', b'')
    )

    with open(path, 'wb') as handle:
        handle.write(payload)
    print(f'wrote {path} ({size}x{size}, {len(payload) / 1024:.1f} kB)')


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for size, name in ((192, 'icon-192.png'), (512, 'icon-512.png'), (512, 'icon-maskable.png')):
        write_png(os.path.join(OUT_DIR, name), size, draw_logo(size))


if __name__ == '__main__':
    main()
