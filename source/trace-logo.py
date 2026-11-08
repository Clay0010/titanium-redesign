"""Restore the original monochrome wordmark as transparent SVG paths.

Marching squares follows the original antialiased foreground rather than
redrawing letters, substituting fonts, or adding to the brand artwork.
"""
from pathlib import Path
from PIL import Image
from collections import defaultdict

source = Path(__file__).parent / 'media' / 'titanium-original.png'
im = Image.open(source).convert('L')
w, h = im.size
values = [[0] * (w + 2)] + [[0] + [im.getpixel((x, y)) for x in range(w)] + [0] for y in range(h)] + [[0] * (w + 2)]
segments = []
level = 127.5
for y in range(h + 1):
    for x in range(w + 1):
        corners = [values[y][x], values[y][x+1], values[y+1][x+1], values[y+1][x]]
        points = [(x-1, y-1), (x, y-1), (x, y), (x-1, y)]
        crossing = {}
        for e in range(4):
            a, b = corners[e], corners[(e+1) % 4]
            if (a >= level) == (b >= level):
                continue
            t = (level-a)/(b-a)
            p, q = points[e], points[(e+1) % 4]
            crossing[e] = (round(p[0] + t*(q[0]-p[0]), 6), round(p[1] + t*(q[1]-p[1]), 6))
        edges = list(crossing)
        if len(edges) == 2:
            segments.append((crossing[edges[0]], crossing[edges[1]]))
        elif len(edges) == 4:
            white_center = sum(corners)/4 >= level
            tl_white = corners[0] >= level
            pairs = [(0,1),(2,3)] if white_center == tl_white else [(0,3),(1,2)]
            segments.extend((crossing[a],crossing[b]) for a,b in pairs)

graph = defaultdict(list)
for a,b in segments:
    graph[a].append(b)
    graph[b].append(a)
visited = set()
paths = []
for start in graph:
    if start in visited:
        continue
    points, previous, current = [], None, start
    while current not in visited:
        visited.add(current)
        points.append(current)
        neighbors = graph[current]
        nxt = next((p for p in neighbors if p != previous), start)
        previous, current = current, nxt
    if len(points) < 3:
        continue
    # Drop collinear samples without shifting any contour geometry.
    clean = []
    for i,p in enumerate(points):
        a, b = points[i-1], points[(i+1) % len(points)]
        if abs((p[0]-a[0])*(b[1]-p[1])-(p[1]-a[1])*(b[0]-p[0])) > .000001:
            clean.append(p)
    if len(clean) >= 3:
        paths.append('M'+'L'.join(f'{x:.3f},{y:.3f}' for x,y in clean)+'Z')

svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="-1 -1 {w+2} {h+2}"><path fill="#20211f" fill-rule="evenodd" d="'+''.join(paths)+'"/></svg>'
output = source.parent / 'titanium-logo.svg'
output.write_text(svg, encoding='utf-8')
print(f'Original brand geometry restored: {len(paths)} contours, {len(svg):,} bytes, transparent scalable SVG.')
