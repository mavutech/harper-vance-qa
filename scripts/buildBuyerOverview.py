"""Build the two-page buyer overview from the website's verified sales copy."""
import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
COPY = json.loads((ROOT / 'src/features/landingPage/locales/buyerOverview.en.json').read_text())
LANDING = json.loads((ROOT / 'src/features/landingPage/locales/en.json').read_text())
OUTPUT = ROOT / 'public/reports/Harper-Vance-Buyer-Overview.pdf'
NAVY = colors.HexColor('#102537')
BLUE = colors.HexColor('#2956b3')
MUTED = colors.HexColor('#435363')
STYLES = {
    'title': ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=25, leading=29, textColor=NAVY, spaceAfter=12),
    'subtitle': ParagraphStyle('subtitle', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=BLUE, spaceAfter=10),
    'heading': ParagraphStyle('heading', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=NAVY, spaceBefore=12, spaceAfter=5),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=10, leading=14, textColor=MUTED, spaceAfter=8),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=MUTED, spaceAfter=7),
    'cell': ParagraphStyle('cell', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=NAVY, alignment=TA_LEFT),
}


def paragraph(text, style='body'):
    """Escape source copy before creating a PDF paragraph."""
    return Paragraph(escape(text), STYLES[style])


def link(label, url):
    """Create a clickable branded link to a fixed public product destination."""
    return Paragraph(f'<link href="{escape(url)}" color="#2956b3"><u>{escape(label)}</u></link>', STYLES['body'])


def frame(canvas, doc):
    """Draw consistent brand and page information outside the content frame."""
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.setFont('Helvetica-Bold', 10)
    canvas.drawString(42, 754, 'HARPER VANCE')
    canvas.setStrokeColor(colors.HexColor('#d6dfe7'))
    canvas.line(42, 742, 570, 742)
    canvas.line(42, 44, 570, 44)
    canvas.setFillColor(MUTED)
    canvas.setFont('Helvetica', 8)
    canvas.drawString(42, 29, COPY['version'])
    canvas.drawRightString(570, 29, f'{doc.page} / 2')
    canvas.restoreState()


def build():
    """Render the two-page overview, keeping plans sourced from landing copy."""
    story = [paragraph(COPY['title'], 'title'), paragraph(COPY['subtitle'], 'subtitle'), paragraph(COPY['intro'])]
    for item in COPY['offer']:
        story.extend([paragraph(item['title'], 'heading'), paragraph(item['body'])])
    story.extend([paragraph('Delivery included with your license', 'heading'), paragraph(COPY['delivery']),
                  paragraph(COPY['sampleTitle'], 'heading'), paragraph(COPY['sampleText']),
                  link(COPY['sampleLink'], COPY['sampleUrl']), paragraph(COPY['boundary'], 'small'), PageBreak(),
                  paragraph(COPY['purchaseTitle'], 'title'), paragraph(COPY['purchaseIntro'])])
    rows = []
    for plan in LANDING['pricing']['plans']:
        description = f"{plan['price']} {plan['period']}. {plan['annual']}. " + '; '.join(plan['features']) + '.'
        rows.append([paragraph(plan['name'], 'cell'), paragraph(description, 'cell')])
    table = Table(rows, colWidths=[120, 408], hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f4f8')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.white),
    ]))
    story.extend([table, Spacer(1, 5)])
    for step in COPY['steps']:
        story.extend([paragraph(step['title'], 'heading'), paragraph(step['body'], 'small')])
    story.extend([link(COPY['purchaseLink'], COPY['purchaseUrl']), paragraph(COPY['terms'], 'small')])
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=(8.5 * inch, 11 * inch), leftMargin=42, rightMargin=42,
                           topMargin=64, bottomMargin=58, title='Harper Vance | What Your Team Gets', author='Harper Vance')
    doc.build(story, onFirstPage=frame, onLaterPages=frame)


if __name__ == '__main__':
    build()
