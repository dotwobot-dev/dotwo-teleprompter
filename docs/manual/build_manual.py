"""Build the two-page quick reference from native screenshots and editable copy."""

import json
from pathlib import Path

import reportlab
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / "output/pdf/DoTwo_Teleprompter_Guia_Rapida_0.2.0.pdf"
DATA = json.loads((HERE / "content.json").read_text(encoding="utf-8"))
W, H = A4
MARGIN = 32
WIDTH = W - 2 * MARGIN
GAP = 24
COL = (WIDTH - GAP) / 2
INK = colors.HexColor("#17212b")
MUTED = colors.HexColor("#53606d")
TEAL = colors.HexColor("#007a67")
BLUE = colors.HexColor("#0875b9")
LINE = colors.HexColor("#dce4e9")
PALE = colors.HexColor("#eef5f6")

arial = Path("/System/Library/Fonts/Supplemental")
fallback = Path(reportlab.__file__).parent / "fonts"
regular = arial / "Arial.ttf"
bold = arial / "Arial Bold.ttf"
pdfmetrics.registerFont(TTFont("Manual", str(regular if regular.exists() else fallback / "Vera.ttf")))
pdfmetrics.registerFont(TTFont("ManualBold", str(bold if bold.exists() else fallback / "VeraBd.ttf")))
pdfmetrics.registerFontFamily("Manual", normal="Manual", bold="ManualBold", italic="Manual", boldItalic="ManualBold")
BODY = ParagraphStyle("body", fontName="Manual", fontSize=9.4, leading=12.2,
                      textColor=INK, alignment=TA_LEFT, spaceAfter=0)
SMALL = ParagraphStyle("small", parent=BODY, fontSize=8.2, leading=10.6, textColor=MUTED)


def text(c, value, x, top, width, style=BODY, limit=792):
    paragraph = Paragraph(value, style)
    _, height = paragraph.wrap(width, H)
    if top + height > limit:
        raise ValueError(f"Text exceeds layout: {value[:60]} ({top + height:.1f} > {limit})")
    paragraph.drawOn(c, x, H - top - height)
    return top + height


def heading(c, value, x, top, size=11):
    c.setFillColor(TEAL)
    c.setFont("ManualBold", size)
    c.drawString(x, H - top - size, value)
    return top + size + 6


def section(c, item, x, top, width=COL):
    return text(c, item["text"], x, heading(c, item["title"], x, top), width) + 14


def screenshot(c, filename, x, top, width, crop_top=48):
    file = HERE / "assets" / filename
    with Image.open(file) as image:
        iw, ih = image.size
    height = (ih - crop_top) * width / iw
    c.saveState()
    clipping = c.beginPath()
    clipping.rect(x, H - top - height, width, height)
    c.clipPath(clipping, stroke=0, fill=0)
    # Keep original pixels; omit the macOS title bar and its empty top margin.
    c.drawImage(str(file), x, H - top - height, width=width, height=ih * width / iw)
    c.restoreState()
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.rect(x, H - top - height, width, height, fill=0, stroke=1)
    return top + height


def header(c, subtitle, chapter):
    c.setFillColor(BLUE)
    c.rect(MARGIN, H - 39, 27, 3, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont("ManualBold", 8.5)
    c.drawString(MARGIN + 36, H - 40, "GU\u00cdA R\u00c1PIDA / MACOS")
    c.setFillColor(INK)
    c.setFont("ManualBold", 24)
    c.drawString(MARGIN, H - 73, "DoTwo Teleprompter")
    c.setFont("Manual", 10.5)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, H - 92, subtitle)
    c.setFont("ManualBold", 29)
    c.setFillColor(LINE)
    c.drawRightString(W - MARGIN, H - 72, chapter)


def footer(c, page):
    c.setStrokeColor(LINE)
    c.line(MARGIN, 31, W - MARGIN, 31)
    c.setFont("Manual", 8)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, 18, f"DoTwo / v{DATA['version']} / {DATA['date']} / Capturas reales con guion de ejemplo")
    c.drawRightString(W - MARGIN, 18, f"{page} / 2")


def table(c, rows, x, top, width, first_width, row_height, font_size=8.5):
    style = ParagraphStyle("table", parent=BODY, fontSize=font_size, leading=10.8)
    for index, (key, value) in enumerate(rows):
        y = top + index * row_height
        if index % 2 == 0:
            c.setFillColor(PALE)
            c.rect(x, H - y - row_height, width, row_height, stroke=0, fill=1)
        text(c, f"<b>{key}</b>", x + 5, y + 4, first_width - 8, style, limit=y + row_height - 2)
        text(c, value, x + first_width + 4, y + 4, width - first_width - 9, style,
             limit=y + row_height - 2)
    return top + len(rows) * row_height


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
    c.setTitle("DoTwo Teleprompter - Guia rapida 0.2.0")
    c.setAuthor("DoTwo / Domingo Moreno")
    c.setSubject("Preparacion, ajustes, directo, marcas y atajos. Dos paginas A4.")
    header(c, "Preparar el guion, la pantalla y el setup", "01")
    bottom = screenshot(c, "control.png", MARGIN, 110, WIDTH)
    text(c, "<b>Control.</b> Guion y navegaci\u00f3n a la izquierda; visor, mandos y ajustes a la derecha.",
         MARGIN, bottom + 7, WIDTH, SMALL)
    start = bottom + 32
    for side, x in [("left", MARGIN), ("right", MARGIN + COL + GAP)]:
        top = start
        for item in DATA["page1"][side]:
            top = section(c, item, x, top)
        if top > 799:
            raise ValueError(f"Page 1 {side} overflow: {top}")
    footer(c, 1)
    c.showPage()

    header(c, "Operar en directo: mandos, marcas y atajos", "02")
    direct_width = 296
    right_x = MARGIN + direct_width + 18
    right_width = WIDTH - direct_width - 18
    bottom = screenshot(c, "directo.png", MARGIN, 110, direct_width)
    text(c, "<b>Panel directo.</b> Visor plegado para dejar todos los mandos visibles.", MARGIN,
         bottom + 6, direct_width, SMALL)
    talent_bottom = screenshot(c, "talento.png", right_x, 110, right_width, crop_top=0)
    top = heading(c, "Una sola pantalla", right_x, talent_bottom + 9, 10)
    text(c, DATA["page2"]["portable"], right_x, top, right_width, SMALL, limit=310)

    top = 324
    for item in DATA["page2"]["left"]:
        top = section(c, item, MARGIN, top)
    top = heading(c, "Atajos del operador", MARGIN, top)
    top = table(c, DATA["page2"]["shortcuts"], MARGIN, top, COL, 96, 22, 8.1)
    text(c, DATA["page2"]["shortcutNote"], MARGIN, top + 6, COL, SMALL, limit=787)

    x = MARGIN + COL + GAP
    top = heading(c, DATA["page2"]["rightTitle"], x, 324)
    top = text(c, DATA["page2"]["rightIntro"], x, top, COL) + 10
    top = table(c, DATA["page2"]["markup"], x, top, COL, 109, 23, 8.6)
    top = text(c, DATA["page2"]["markupNote"], x, top + 9, COL) + 15
    top = heading(c, "Antes y despu\u00e9s de emitir", x, top)
    top = text(c, DATA["page2"]["checklist"], x, top, COL) + 13
    text(c, DATA["page2"]["compatibility"], x, top, COL, SMALL, limit=787)
    footer(c, 2)
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
