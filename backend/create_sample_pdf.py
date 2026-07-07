# backend/create_sample_pdf.py
import sys
import os
import subprocess

# Auto-install reportlab if missing
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    print("ReportLab package not found. Installing now...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

def generate_pdf(filename="sample_medical_report.pdf", patient_name="John Doe", patient_id="PAT-ABC123_temp"):
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    story = []

    # Title & Header
    story.append(Paragraph("METROPOLITAN OPERATIONS & CLINICAL REGISTRY", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#94a3b8'), spaceAfter=4)))
    story.append(Paragraph("PATIENT CLINICAL DISCHARGE & LAB REPORT", title_style))
    story.append(Spacer(1, 10))

    # Patient Metadata Table
    meta_data = [
        [Paragraph("<b>Patient Name:</b>", body_style), Paragraph(patient_name, body_style), Paragraph("<b>Registry ID:</b>", body_style), Paragraph(patient_id, body_style)],
        [Paragraph("<b>Report Ref:</b>", body_style), Paragraph("LAB-99281-OPS", body_style), Paragraph("<b>Physician:</b>", body_style), Paragraph("Dr. Robert Chen, MD", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[100, 160, 100, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Vital Statistics Section
    story.append(Paragraph("1. ADMISSION PHYSIOLOGICAL VITALS", section_style))
    vitals_data = [
        ["Parameter", "Observed Reading", "Reference Range", "Clinical Alert Status"],
        ["Heart Rate", "118 bpm", "60 - 100 bpm", "HIGH (Tachycardia detected)"],
        ["Blood Pressure", "165/104 mmHg", "120/80 mmHg", "SEVERE HYPERTENSION (Stage 2)"],
        ["Oxygen Saturation", "91% SpO2", "95% - 100%", "CRITICAL HYPOXEMIA (Oxygen needed)"],
        ["Body Temperature", "102.4 F", "98.6 F", "HIGH FEVER (Pyrexia)"]
    ]
    vitals_table = Table(vitals_data, colWidths=[130, 130, 110, 150])
    vitals_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(vitals_table)
    story.append(Spacer(1, 15))

    # Diagnostic Findings
    story.append(Paragraph("2. LABORATORY INVESTIGATIONS & FINDINGS", section_style))
    story.append(Paragraph(
        "LABORATORY DIAGNOSIS SUMMARY: Patient presents with persistent substernal chest discomfort radiating to left shoulder. "
        "Electrocardiogram (ECG) reveals acute ST-segment elevations in leads V1-V4, indicative of acute anterior myocardial infarction (STEMI). "
        "Cardiac troponin assays returned highly critical levels: Troponin I is 4.85 ng/mL (Normal threshold <0.04 ng/mL). "
        "An emergent coronary angiography is recommended to evaluate arterial occlusion.",
        body_style
    ))

    # Clinical Directive
    story.append(Spacer(1, 10))
    story.append(Paragraph("3. CLINICAL ACTION DIRECTIVES", section_style))
    story.append(Paragraph("• <b>IMMEDIATE ICU PLACEMENT:</b> Patient requires emergency ICU ward admission for continuous hemodynamic monitoring.", body_style))
    story.append(Paragraph("• <b>CORONARY REPERFUSION:</b> Schedule emergent percutaneous coronary intervention (PCI) to restore blood flow.", body_style))
    story.append(Paragraph("• <b>PHARMACOTHERAPY:</b> Administer double antiplatelet load (Aspirin 324mg + Clopidogrel 300mg) and continuous high-flow O2.", body_style))
    
    # Build Document
    doc.build(story)
    print(f"Successfully generated clinical medical report PDF: {filename}")

if __name__ == "__main__":
    generate_pdf()
