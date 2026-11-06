"""Generates the illustrative sample assets in public/samples (run: python3 scripts/generate-samples.py).
Soil-card value cells are placed so they match the OCR regions used by the mock (src/mock/engine/soil.ts)."""
import os, random

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'samples')
os.makedirs(OUT, exist_ok=True)

FONT = "font-family='Arial, Helvetica, sans-serif'"

CARDS = {
  'kolar': dict(card='KA/KLR/2026/04817', farmer='Ramesh Gowda', village='Hosahalli', district='Kolar', survey='112/3', area='2.5 acre',
                date='08/10/2026', lab='District Soil Testing Laboratory, Kolar',
                vals=[('6.8','-','Neutral'),('0.42','dS/m','Normal'),('0.41','%','Low'),('182','kg/ha','Low'),('18.4','kg/ha','Medium'),('236','kg/ha','Medium')]),
  'hassan': dict(card='KA/HSN/2026/02291', farmer='Ramesh Gowda', village='Belur', district='Hassan', survey='47/1A', area='1.8 acre',
                 date='22/09/2026', lab='District Soil Testing Laboratory, Hassan',
                 vals=[('5.9','-','Acidic'),('1.86','dS/m','High'),('0.52','%','Medium'),('312','kg/ha','Medium'),('28.6','kg/ha','High'),('168','kg/ha','Medium')]),
  'haveri': dict(card='KA/HVR/2026/07734', farmer='Ramesh Gowda', village='Byadgi', district='Haveri', survey='203/2', area='3.2 acre',
                 date='30/09/2026', lab='Soil Testing Laboratory, Haveri',
                 vals=[('7.6','-','Alkaline'),('0.61','dS/m','Normal'),('0.58','%','Medium'),('298','kg/ha','Medium'),('14.2','kg/ha','Medium'),('305','kg/ha','High')]),
  'smudged': dict(card='KA/KLR/2026/0????', farmer='Ramesh Gowda', village='Hosahalli', district='Kolar', survey='112/3', area='2.5 acre',
                  date='??/10/2026', lab='District Soil Testing Laboratory, Kolar',
                  vals=[('6.?','-',''),('0.4?','dS/m',''),('0.?1','%',''),('1?2','kg/ha',''),('1?.4','kg/ha',''),('2?6','kg/ha','')]),
}
PARAMS = ['pH', 'Electrical Conductivity (EC)', 'Organic Carbon (OC)', 'Available Nitrogen (N)', 'Available Phosphorus (P)',
          'Available Potassium (K)', 'Available Sulphur (S)', 'Zinc (Zn)', 'Iron (Fe)', 'Boron (B)']
MICRO = [('12.4','ppm','Medium'),('0.62','ppm','Sufficient'),('5.1','ppm','Sufficient'),('0.48','ppm','Sufficient')]

def card_svg(key, d):
    smudged = key == 'smudged'
    rows = []
    y0, h = 470, 54
    allvals = d['vals'] + MICRO
    for i, p in enumerate(PARAMS):
        y = y0 + i * h
        fill = '#F3EEDF' if i % 2 == 0 else '#FBF8F0'
        v, u, r = allvals[i]
        rows.append(f"<rect x='40' y='{y}' width='720' height='{h}' fill='{fill}'/>")
        rows.append(f"<text x='62' y='{y+35}' {FONT} font-size='20' fill='#333'>{i+1}</text>")
        rows.append(f"<text x='104' y='{y+35}' {FONT} font-size='20' fill='#222'>{p}</text>")
        filt = " filter='url(#smudge)'" if smudged and i < 6 else ''
        rows.append(f"<text x='496' y='{y+36}' {FONT} font-size='26' font-weight='700' fill='#1a237e' text-anchor='middle'{filt}>{v}</text>")
        rows.append(f"<text x='606' y='{y+35}' {FONT} font-size='18' fill='#444' text-anchor='middle'>{u}</text>")
        rows.append(f"<text x='700' y='{y+35}' {FONT} font-size='18' fill='#444' text-anchor='middle'>{r}</text>")
    grid = ''.join(f"<line x1='{x}' y1='420' x2='{x}' y2='{y0+len(PARAMS)*h}' stroke='#9c8f72' stroke-width='1.5'/>" for x in (90, 416, 576, 640))
    stains = ''
    if smudged:
        random.seed(4)
        for _ in range(9):
            cx, cy, rr = random.randint(380, 640), random.randint(470, 800), random.randint(30, 70)
            stains += f"<circle cx='{cx}' cy='{cy}' r='{rr}' fill='#8a6d3b' opacity='{random.uniform(0.18,0.32):.2f}'/>"
        stains += "<path d='M360 500 C 450 560, 560 620, 700 760' stroke='#6b5330' stroke-width='38' opacity='0.28' fill='none' stroke-linecap='round'/>"
    rot = '-0.8' if key != 'haveri' else '0.6'
    return f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1100' width='800' height='1100'>
<defs>
  <filter id='smudge'><feGaussianBlur stdDeviation='5'/></filter>
  <pattern id='grain' width='6' height='6' patternUnits='userSpaceOnUse'><circle cx='1' cy='1' r='0.6' fill='#000' opacity='0.05'/><circle cx='4' cy='3' r='0.5' fill='#000' opacity='0.04'/></pattern>
</defs>
<rect width='800' height='1100' fill='#E9E4D8'/>
<g transform='rotate({rot} 400 550)'>
<rect x='20' y='20' width='760' height='1060' fill='#FBF8F0' stroke='#cfc6b0'/>
<rect x='20' y='20' width='760' height='1060' fill='url(#grain)'/>
<rect x='40' y='40' width='720' height='120' fill='#2E5E3A'/>
<circle cx='96' cy='100' r='38' fill='none' stroke='#F6F2E9' stroke-width='3'/>
<text x='96' y='108' {FONT} font-size='22' font-weight='700' fill='#F6F2E9' text-anchor='middle'>SHC</text>
<text x='150' y='82' {FONT} font-size='16' fill='#E8E2D0' letter-spacing='1'>GOVERNMENT OF INDIA · DEPT. OF AGRICULTURE</text>
<text x='150' y='120' {FONT} font-size='34' font-weight='700' fill='#FFFFFF'>SOIL HEALTH CARD</text>
<text x='150' y='146' {FONT} font-size='15' fill='#E8E2D0'>Illustrative sample for the CropWise demo</text>
<text x='60' y='206' {FONT} font-size='18' fill='#555'>Card No.</text><text x='230' y='206' {FONT} font-size='19' fill='#111' font-weight='700'>{d['card']}</text>
<text x='60' y='240' {FONT} font-size='18' fill='#555'>Farmer</text><text x='230' y='240' {FONT} font-size='19' fill='#111'>{d['farmer']}</text>
<text x='60' y='274' {FONT} font-size='18' fill='#555'>Village / District</text><text x='230' y='274' {FONT} font-size='19' fill='#111'>{d['village']}, {d['district']}, Karnataka</text>
<text x='60' y='308' {FONT} font-size='18' fill='#555'>Survey No. / Area</text><text x='230' y='308' {FONT} font-size='19' fill='#111'>{d['survey']} · {d['area']}</text>
<text x='60' y='342' {FONT} font-size='18' fill='#555'>Sample date</text><text x='230' y='342' {FONT} font-size='19' fill='#111'>{d['date']}</text>
<text x='60' y='376' {FONT} font-size='18' fill='#555'>Laboratory</text><text x='230' y='376' {FONT} font-size='19' fill='#111'>{d['lab']}</text>
<rect x='40' y='420' width='720' height='50' fill='#D9D0B8'/>
<text x='62' y='452' {FONT} font-size='17' font-weight='700' fill='#222'>No.</text>
<text x='104' y='452' {FONT} font-size='17' font-weight='700' fill='#222'>Parameter</text>
<text x='496' y='452' {FONT} font-size='17' font-weight='700' fill='#222' text-anchor='middle'>Test value</text>
<text x='606' y='452' {FONT} font-size='17' font-weight='700' fill='#222' text-anchor='middle'>Unit</text>
<text x='700' y='452' {FONT} font-size='17' font-weight='700' fill='#222' text-anchor='middle'>Rating</text>
{''.join(rows)}
<rect x='40' y='420' width='720' height='{50+len(PARAMS)*54}' fill='none' stroke='#9c8f72' stroke-width='2'/>
{grid}
{stains}
<text x='60' y='1030' {FONT} font-size='16' fill='#666'>Fertiliser recommendations overleaf</text>
<line x1='520' y1='1010' x2='740' y2='1010' stroke='#777'/><text x='630' y='1034' {FONT} font-size='15' fill='#666' text-anchor='middle'>Soil Testing Officer</text>
<text x='400' y='640' {FONT} font-size='86' font-weight='700' fill='#A8541F' opacity='0.08' text-anchor='middle' transform='rotate(-28 400 640)'>SAMPLE · DEMO</text>
</g>
</svg>"""

for k, d in CARDS.items():
    with open(os.path.join(OUT, f'soil-card-{k}.svg'), 'w') as f:
        f.write(card_svg(k, d))

LEAF = "M300 70 C 420 120, 520 260, 500 420 C 480 560, 380 650, 300 700 C 220 650, 120 560, 100 420 C 80 260, 180 120, 300 70 Z"
VEINS = "<path d='M300 90 L300 690' stroke='#2f5d1e' stroke-width='5' fill='none'/>" + ''.join(
    f"<path d='M300 {y} Q {300+s*90} {y-30} {300+s*170} {y-80}' stroke='#3c6f27' stroke-width='3' fill='none' opacity='0.8'/>"
    for y in range(180, 640, 70) for s in (-1, 1))

def label(text, sub):
    return (f"<rect x='0' y='740' width='600' height='60' fill='#14301F'/>"
            f"<text x='20' y='768' {FONT} font-size='18' font-weight='700' fill='#F6F2E9'>SAMPLE IMAGE · {text}</text>"
            f"<text x='20' y='790' {FONT} font-size='13' fill='#C9D3C6'>{sub}</text>")

def leaf_svg(kind):
    random.seed(kind)
    bg = "<rect width='600' height='800' fill='#6E5A43'/><rect width='600' height='800' fill='url(#soil)'/>"
    defs = ("<defs><pattern id='soil' width='40' height='40' patternUnits='userSpaceOnUse'>"
            "<circle cx='8' cy='10' r='3' fill='#5a4836'/><circle cx='28' cy='24' r='4' fill='#7d6950'/><circle cx='18' cy='34' r='2' fill='#4c3c2c'/></pattern>"
            "<radialGradient id='lg' cx='45%' cy='40%' r='70%'><stop offset='0' stop-color='#7DB356'/><stop offset='1' stop-color='#4C8A2F'/></radialGradient>"
            "<filter id='blur'><feGaussianBlur stdDeviation='7'/></filter></defs>")
    spots = ''
    if kind == 'tomato-spotted':
        for (x, y, r) in [(230, 300, 34), (360, 260, 28), (320, 450, 40), (200, 520, 26), (400, 500, 22), (270, 610, 20)]:
            spots += f"<circle cx='{x}' cy='{y}' r='{r+14}' fill='#D8C24A' opacity='0.55'/>"
            for k in range(4):
                spots += f"<circle cx='{x}' cy='{y}' r='{r - k*7}' fill='{'#4a2e17' if k % 2 == 0 else '#7a5230'}'/>"
        leaf = f"<path d='{LEAF}' fill='url(#lg)' stroke='#2f5d1e' stroke-width='4'/>{VEINS}{spots}"
        return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'>{defs}{bg}{leaf}{label('Tomato leaf – target spots', 'Illustrative placeholder, not a real photo. Used by the demo: early blight scenario.')}</svg>"
    if kind == 'potato-patches':
        spots = ("<path d='M120 380 C 150 330, 210 340, 230 400 C 240 450, 180 480, 130 450 Z' fill='#3b3a24' opacity='0.85'/>"
                 "<path d='M420 300 C 470 300, 500 360, 470 410 C 440 440, 390 410, 395 360 Z' fill='#33311f' opacity='0.85'/>"
                 "<path d='M330 560 C 380 560, 420 600, 380 640 C 340 660, 300 620, 310 590 Z' fill='#3a3622' opacity='0.8'/>"
                 "<path d='M150 400 C 170 390, 200 400, 205 420' stroke='#e9ecef' stroke-width='6' opacity='0.7' fill='none'/>")
        leaf = f"<path d='{LEAF}' fill='#5E8F3A' stroke='#2f5d1e' stroke-width='4'/>{VEINS}{spots}"
        return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'>{defs}{bg}{leaf}{label('Potato leaf – dark water-soaked patches', 'Illustrative placeholder, not a real photo. Used by the demo: late blight scenario.')}</svg>"
    if kind == 'chilli-healthy':
        narrow = "M300 70 C 390 160, 430 300, 410 450 C 395 570, 350 650, 300 700 C 250 650, 205 570, 190 450 C 170 300, 210 160, 300 70 Z"
        leaf = f"<path d='{narrow}' fill='url(#lg)' stroke='#2f5d1e' stroke-width='4'/><path d='M300 90 L300 690' stroke='#2f5d1e' stroke-width='5'/>"
        return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'>{defs}{bg}{leaf}{label('Chilli leaf – no symptoms', 'Illustrative placeholder, not a real photo. Used by the demo: healthy scenario.')}</svg>"
    if kind == 'tomato-blurry':
        leaf = f"<g filter='url(#blur)' transform='translate(150 220) scale(0.5)'><path d='{LEAF}' fill='url(#lg)'/><circle cx='260' cy='380' r='40' fill='#5a3a1e'/><circle cx='360' cy='300' r='26' fill='#5a3a1e'/></g>"
        return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'>{defs}<g filter='url(#blur)'>{bg}</g>{leaf}{label('Tomato leaf – blurry and far away', 'Illustrative placeholder. Edge case: produces a low-confidence diagnosis.')}</svg>"
    stones = ''.join(f"<ellipse cx='{random.randint(40,560)}' cy='{random.randint(60,700)}' rx='{random.randint(20,60)}' ry='{random.randint(14,40)}' fill='{random.choice(['#9b9384','#857d6e','#b1a999'])}'/>" for _ in range(16))
    return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'>{defs}{bg}{stones}{label('Soil and stones – no leaf', 'Illustrative placeholder. Edge case: leaf classification fails.')}</svg>"

for kind in ['tomato-spotted', 'potato-patches', 'chilli-healthy', 'tomato-blurry', 'not-a-leaf']:
    with open(os.path.join(OUT, f'leaf-{kind}.svg'), 'w') as f:
        f.write(leaf_svg(kind))
print('ok')
