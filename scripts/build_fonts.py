"""Build original-named OFL derivatives for the Romae website.
Run: python scripts/build_fonts.py (requires fonttools[woff]).
Upstream copyright and OFL licenses are retained alongside the fonts.
"""
from pathlib import Path
from io import BytesIO
from urllib.request import urlopen
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'fonts'
OUT.mkdir(parents=True, exist_ok=True)

def source(family, italic=False):
    entries = json.load(urlopen('https://api.github.com/repos/google/fonts/contents/ofl/' + family))
    entry = next(x for x in entries if x['name'].endswith('.ttf') and ('Italic' in x['name']) == italic)
    license_entry = next(x for x in entries if x['name'] == 'OFL.txt')
    (OUT / (family + '-OFL.txt')).write_bytes(urlopen(license_entry['download_url']).read())
    return TTFont(BytesIO(urlopen(entry['download_url']).read()))

def build(base, family, style, stem, axes, width, space_factor=1):
    font = instantiateVariableFont(base, axes, inplace=False)
    glyphset = font.getGlyphSet()
    drawings = {}
    for name in font.getGlyphOrder():
        recording = DecomposingRecordingPen(glyphset)
        glyphset[name].draw(recording)
        pen = TTGlyphPen(None)
        recording.replay(TransformPen(pen, (width, 0, 0, 1, 0, 0)))
        drawings[name] = pen.glyph()
    font['glyf'].glyphs = drawings
    for name, (advance, bearing) in list(font['hmtx'].metrics.items()):
        factor = width * (space_factor if name in ['space', 'nbspace'] else 1)
        font['hmtx'].metrics[name] = (round(advance * factor), round(bearing * width))
    # Original rupee drawing, keeping menu prices inside the custom family.
    unit = font['head'].unitsPerEm / 1000
    rupee = TTGlyphPen(None)
    def point(x, y): return (round(x * unit), round(y * unit))
    def bar(x1, y1, x2, y2):
        rupee.moveTo(point(x1,y1)); rupee.lineTo(point(x1,y2))
        rupee.lineTo(point(x2,y2)); rupee.lineTo(point(x2,y1)); rupee.closePath()
    bar(100,660,650,720)
    bar(100,505,650,565)
    rupee.moveTo(point(280,660))
    rupee.qCurveTo(point(525,660),point(525,510))
    rupee.qCurveTo(point(525,355),point(250,355))
    rupee.lineTo(point(610,0));rupee.lineTo(point(505,0))
    rupee.lineTo(point(125,375));rupee.lineTo(point(125,425))
    rupee.lineTo(point(245,425));rupee.qCurveTo(point(440,425),point(440,515))
    rupee.qCurveTo(point(440,600),point(280,600));rupee.closePath()
    font['glyf']['rupeeRomae'] = rupee.glyph()
    font.setGlyphOrder(list(dict.fromkeys(font['glyf'].glyphOrder)))
    font['hmtx']['rupeeRomae'] = (round(700*unit),round(100*unit))
    for table in font['cmap'].tables:
        if table.isUnicode(): table.cmap[0x20b9] = 'rupeeRomae'
    # Recompute advance statistics to match transformed outlines.
    font['hhea'].advanceWidthMax = max(a for a, b in font['hmtx'].metrics.values())
    font['OS/2'].xAvgCharWidth = round(font['OS/2'].xAvgCharWidth * width)
    font['OS/2'].usWidthClass = 3 if width < .8 else 5
    # Rename all identifying names; retain upstream copyright and license records.
    names = {1:family, 2:style, 3:family+' '+style+' 1.000', 4:family+' '+style,
             6:family.replace(' ','')+'-'+style, 16:family, 17:style,
             5:'Version 1.000', 10:'Romae derivative: custom proportions and spacing; see FONT-SOURCES.md.'}
    font['name'].names = [n for n in font['name'].names if n.nameID not in names and n.nameID not in [18,21,22,25]]
    for name_id, value in names.items():
        font['name'].setName(value, name_id, 3, 1, 0x409)
    if 'STAT' in font: del font['STAT']
    opts = subset.Options()
    opts.name_IDs = ['*']
    opts.name_legacy = True
    opts.name_languages = ['*']
    sub = subset.Subsetter(options=opts)
    sub.populate(unicodes=list(range(0x20,0x250))+list(range(0x2000,0x2070))+list(range(0x20a0,0x20d0))+[0x2212])
    sub.subset(font)
    font.flavor = None
    font.save(OUT / (stem + '.ttf'))
    font.flavor = 'woff2'
    font.save(OUT / (stem + '.woff2'))
    print(stem, len(font.getBestCmap()), 'characters')

text = source('lora')
# Slightly narrower text; extra word space keeps small-screen copy open.
build(text, 'Romae Text', 'Regular', 'romae-text-regular', {'wght':440}, .98, 1.08)
build(text, 'Romae Text', 'Bold', 'romae-text-bold', {'wght':700}, .98, 1.08)
build(source('lora', True), 'Romae Text', 'Italic', 'romae-text-italic', {'wght':500}, .98, 1.08)
# High optical size preserves fine hairlines; condensed proportions echo French poster lettering.
build(source('bodonimoda'), 'Romae French Display', 'Regular', 'romae-french-display', {'wght':600,'opsz':48}, .70, 1.18)
