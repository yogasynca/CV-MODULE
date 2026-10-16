import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class TimesNumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' 
    using Times New Roman font throughout all headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Times-Roman", 9)
        self.setFillColor(colors.HexColor("#444444"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "YogaSync AI — Executive Mentor Guide & Portal Operational Manual")
            self.drawRightString(558, 750, "Confidential Project Dossier")
            self.setStrokeColor(colors.HexColor("#AAAAAA"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
        
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, footer_text)
        self.drawString(54, 36, "YogaSync AI Platform • Computer Vision & Dataset Engineering System")
        self.setStrokeColor(colors.HexColor("#AAAAAA"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_mentor_pdf(filename="YogaSync_AI_Mentor_Portal_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Executive Academic Palette
    PRIMARY = colors.HexColor("#111827")      # Rich slate black
    ACCENT = colors.HexColor("#1E3A8A")       # Deep Academic Navy
    SUBTLE_BG = colors.HexColor("#F8FAFC")    # Clean slate tint
    BORDER_DARK = colors.HexColor("#334155")
    TEXT_MAIN = colors.HexColor("#1F2937")    # Charcoal body text
    MUTED_TEXT = colors.HexColor("#4B5563")
    TABLE_HEADER_BG = colors.HexColor("#E2E8F0")

    # Typography Styles STRICTLY in Times-Roman family
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6,
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=12,
        leading=16,
        textColor=ACCENT,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Times-BoldItalic',
        fontSize=11,
        leading=15,
        textColor=ACCENT,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTimes',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_MAIN,
        spaceAfter=6,
        alignment=4 # Justified
    )

    bullet_style = ParagraphStyle(
        'BulletTimes',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=9,
        leading=13.5,
        textColor=TEXT_MAIN,
        leftIndent=14,
        spaceAfter=3,
        alignment=4
    )

    callout_style = ParagraphStyle(
        'CalloutTimes',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=10,
        rightIndent=10
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8,
        leading=11,
        textColor=TEXT_MAIN
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=8,
        leading=11,
        textColor=PRIMARY
    )

    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # Title Card & Meta Header
    story.append(Paragraph("YogaSync AI: Comprehensive System & Portal Guide", title_style))
    story.append(Paragraph("Executive Operational Manual & Biomechanical Evaluation Reference for Project Mentors", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=2, spaceAfter=8))

    meta_table_data = [
        [
            Paragraph("<b>Target Audience:</b> Project Mentor & Academic Evaluators", table_cell),
            Paragraph("<b>Platform Version:</b> Release 1.0 (Production)", table_cell)
        ],
        [
            Paragraph("<b>Project Domain:</b> Computer Vision, AI Dataset & Biomechanics", table_cell),
            Paragraph("<b>Live URL:</b> https://cv-module-ten.vercel.app/", table_cell)
        ],
        [
            Paragraph("<b>Core Stack:</b> Next.js 16, MediaPipe 3D, Supabase, Google Drive", table_cell),
            Paragraph("<b>Git Repository:</b> https://github.com/yogasynca/CV-MODULE.git", table_cell)
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[250, 254])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), SUBTLE_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_DARK),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # SECTION 1
    story.append(Paragraph("1. Executive Summary & Project Purpose", h1_style))
    story.append(Paragraph(
        "<b>YogaSync AI</b> is an enterprise-grade Computer Vision and Artificial Intelligence infrastructure engineered to standardize the collection, validation, and biomechanical auditing of human yoga postures. In conventional fitness applications, posture assessment is often hampered by noisy, uncurated data and subjective visual evaluation. YogaSync AI bridges this gap through a unified platform that combines in-browser 3D landmark extraction, multi-tier human review workflows, and automated mathematical posture angle calculation.",
        body_style
    ))
    story.append(Paragraph(
        "This manual is specifically authored for the <b>Project Mentor</b> to provide complete operational clarity on how each module functions, how team members and quality reviewers interact with the portal, how data integrity is enforced, and how to audit project progress through the administrative telemetry consoles.",
        body_style
    ))

    # SECTION 2
    story.append(Paragraph("2. System Architecture & Technological Stack", h1_style))
    story.append(Paragraph(
        "The YogaSync AI architecture is structured as a decoupled, high-performance web and computer vision ecosystem designed for both cloud and local operation:",
        body_style
    ))

    arch_items = [
        Paragraph("<b>1. Next.js 16 Web Portal (App Router & Turbopack):</b> Provides an accessible, responsive Neo-Brutalist interface with server-side API handlers, route-level security guards (<code>AuthGuard</code>), and client-side reactive components.", bullet_style),
        Paragraph("<b>2. MediaPipe 3D Pose Landmarker:</b> Integrated client-side via WebAssembly (WASM) for instant client preview and server-side in Python for deep batch processing. Detects 33 anatomical landmarks in normalized $(x, y, z)$ 3D space with confidence scores.", bullet_style),
        Paragraph("<b>3. Supabase PostgreSQL Relational Database:</b> Stores authenticated user profiles, canonical posture specifications, submission records, and immutable reviewer auditing logs protected by Row Level Security (RLS) policies.", bullet_style),
        Paragraph("<b>4. Central 400 GB Google Drive Cloud Storage:</b> High-capacity storage repository organized by asana class (<code>YogaSync-Dataset/raw/&lt;pose_id&gt;/images/</code>), connected via automated OAuth2 token exchange with continuous storage telemetry.", bullet_style),
        Paragraph("<b>5. Python Biomechanical Engine (<code>pose/</code> & <code>ai/</code>):</b> Modular library calculating 12 interior joint angles using 3D Euclidean geometry and the Law of Cosines, with 20/20 unit tests validating mathematical rigor.", bullet_style),
    ]
    for item in arch_items:
        story.append(item)

    # SECTION 3
    story.append(Spacer(1, 6))
    story.append(Paragraph("3. Multi-Tier Role-Based Access Control (RBAC)", h1_style))
    story.append(Paragraph(
        "To ensure rigorous data quality and eliminate bias, the portal enforces three strictly partitioned operational roles across the team:",
        body_style
    ))

    rbac_table_data = [
        [Paragraph("<b>Role Tier</b>", table_header), Paragraph("<b>Assigned Personnel</b>", table_header), Paragraph("<b>Key Responsibilities</b>", table_header), Paragraph("<b>Primary Route</b>", table_header)],
        [
            Paragraph("<b>Team Member<br/>(Contributor)</b>", table_cell_bold),
            Paragraph("Ifraaz, Pavani", table_cell),
            Paragraph("Upload single/batch media (1-50 files); record setup notes; execute in-browser skeleton pre-check; track personal submission states.", table_cell),
            Paragraph("<code>/upload</code><br/><code>/my-uploads</code>", table_cell_code)
        ],
        [
            Paragraph("<b>Reviewer<br/>(QA Auditor)</b>", table_cell_bold),
            Paragraph("Faizan, Nidhishree", table_cell),
            Paragraph("Audit pending submissions; inspect MediaPipe skeleton overlays; evaluate joint angles against mathematical tolerance bounds; record Approve/Reject decisions.", table_cell),
            Paragraph("<code>/review</code>", table_cell_code)
        ],
        [
            Paragraph("<b>Project Mentor<br/>(System Admin)</b>", table_cell_bold),
            Paragraph("Manasa (Mentor)", table_cell),
            Paragraph("Full supervisory oversight; monitor class balance across 8 asanas; analyze contributor & reviewer velocity; export dataset manifests; audit storage telemetry.", table_cell),
            Paragraph("<code>/admin</code><br/><code>/dashboard</code><br/><code>/settings</code>", table_cell_code)
        ]
    ]
    t_rbac = Table(rbac_table_data, colWidths=[85, 95, 234, 90])
    t_rbac.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_rbac)

    # SECTION 4
    story.append(Spacer(1, 8))
    story.append(Paragraph("4. Portal Walkthrough & Operational Guide", h1_style))
    story.append(Paragraph(
        "The following subsection provides a screen-by-screen guide on how each portal module operates and how the mentor can navigate and supervise the application:",
        body_style
    ))

    # 4.1 Login Gate
    story.append(Paragraph("4.1 Mandatory Login Gate (<code>/</code>)", h2_style))
    story.append(Paragraph(
        "Access to the internal portal is guarded by a secure authentication gate. All shortcut demo bypasses have been removed. Users must provide valid team credentials. Upon login, the <code>AuthGuard</code> component automatically identifies the user's role and routes them directly to their designated workspace (e.g., Contributors to Upload Station, Reviewers to Review Queue, and Mentors to the Admin Console).",
        body_style
    ))

    # 4.2 Executive Dashboard
    story.append(Paragraph("4.2 Executive Dashboard (<code>/dashboard</code>)", h2_style))
    story.append(Paragraph(
        "The Dashboard displays high-level project telemetry. It features live metric cards showing Total Samples, Approval Rate percentage, Pending Review Queue size, and Storage Consumption. The <b>Dataset Health</b> component visualizes target quota completion (target: 400 samples per asana) across all 8 canonical postures with progress bars.",
        body_style
    ))

    # 4.3 Upload Station
    story.append(Paragraph("4.3 Contributor Upload Station (<code>/upload</code>)", h2_style))
    story.append(Paragraph(
        "Designed for frictionless media submission. Contributors follow a 3-step workflow: (1) Select target asana, (2) Drag and drop single photos or batch archives (up to 50 files simultaneously), and (3) Enter recording metadata (camera angle, lighting, distance). The client-side <b>MediaPipe Pose Overlay</b> dynamically plots skeletal keypoints over images directly in the browser before upload, ensuring corrupted or improperly framed images are caught immediately.",
        body_style
    ))

    # 4.4 Reviewer Queue
    story.append(Paragraph("4.4 Reviewer Audit Queue (<code>/review</code>)", h2_style))
    story.append(Paragraph(
        "The quality control checkpoint of the pipeline. Reviewers examine submitted media side-by-side with MediaPipe skeletal overlays and calculated anatomical angles. The reviewer can compare the observed angle with the ideal tolerance range (e.g., Mountain Pose spine alignment $\\ge 170^\\circ$). With one click, the reviewer records an <b>Approve</b> or <b>Reject</b> verdict with audit notes, updating database records in real time.",
        body_style
    ))

    # 4.5 Mentor Console
    story.append(Paragraph("4.5 Mentor & Administrator Console (<code>/admin</code>)", h2_style))
    story.append(Paragraph(
        "The primary command center for the Project Mentor. The console aggregates multi-dimensional analytics: dataset class balance ratios, contributor submission counts, reviewer turnaround times, and system health. The mentor can trigger an instantaneous <b>JSON Manifest Export</b> of the entire dataset metadata for offline machine learning model training.",
        body_style
    ))

    # 4.6 Settings & Storage
    story.append(Paragraph("4.6 Settings & Cloud Storage Telemetry (<code>/settings</code>)", h2_style))
    story.append(Paragraph(
        "Provides real-time transparency into cloud integrations. Shows Google Drive connection health, authenticated account owner (<code>THANSEEF TRIO</code>), storage usage against the 400 GB quota, and OAuth refresh token status. If an OAuth token expires (due to Google's 7-day testing policy), the page displays a 1-click <b>Re-Authorize</b> flow.",
        body_style
    ))

    # SECTION 5
    story.append(Spacer(1, 8))
    story.append(Paragraph("5. Computer Vision & Biomechanical Posture Engine", h1_style))
    story.append(Paragraph(
        "The core mathematical framework of YogaSync AI relies on vector trigonometry to extract invariant posture representations regardless of subject distance or camera scaling:",
        body_style
    ))

    story.append(Paragraph(
        "<b>Mathematical Angle Formulation:</b> Given three consecutive 3D joint landmarks $A(x_1, y_1, z_1)$, $B(x_2, y_2, z_2)$, and $C(x_3, y_3, z_3)$ where $B$ represents the anatomical joint vertex (e.g., knee, elbow, or hip), the vectors $\\vec{BA} = A - B$ and $\\vec{BC} = C - B$ are computed. The interior angle $\\theta$ is determined via the Euclidean vector dot product:",
        body_style
    ))

    formula_text = [
        [Paragraph("<b>Vector Cosine Law:</b> &nbsp;&nbsp;&nbsp; <i>cos(&theta;) = (&vec;BA &middot; &vec;BC) / (||&vec;BA|| ||&vec;BC||)</i> &nbsp;&nbsp;&nbsp;&rArr;&nbsp;&nbsp;&nbsp; <i>&theta; = arccos(cos(&theta;)) &times; (180 / &pi;)</i>", table_cell_bold)]
    ]
    t_formula = Table(formula_text, colWidths=[504])
    t_formula.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), SUBTLE_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_DARK),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_formula)
    story.append(Spacer(1, 6))

    # Asana Table
    story.append(Paragraph("Supported 8 Canonical Asanas & Biomechanical Targets", h2_style))
    
    asanas_table_data = [
        [Paragraph("<b>Asana (English / Sanskrit)</b>", table_header), Paragraph("<b>Category</b>", table_header), Paragraph("<b>Key Evaluated Joints</b>", table_header), Paragraph("<b>Target Angle & Tolerance</b>", table_header)],
        [
            Paragraph("Mountain Pose<br/><i>Tadasana</i>", table_cell),
            Paragraph("Standing Neutral", table_cell),
            Paragraph("Spine, Left/Right Knees, Shoulders", table_cell),
            Paragraph("Spine & Knees: 175° – 180° (±5°)<br/>Shoulder-Hip Axis: Vertical", table_cell_code)
        ],
        [
            Paragraph("Tree Pose<br/><i>Vrikshasana</i>", table_cell),
            Paragraph("Unilateral Balance", table_cell),
            Paragraph("Standing Knee, Bent Knee, Hips", table_cell),
            Paragraph("Standing Knee: 175° – 180°<br/>Bent Knee: 45° – 60° (Hip abduct.)", table_cell_code)
        ],
        [
            Paragraph("Warrior I<br/><i>Virabhadrasana I</i>", table_cell),
            Paragraph("Standing Lunge", table_cell),
            Paragraph("Front Knee, Back Knee, Arms", table_cell),
            Paragraph("Front Knee: 90° (±5°)<br/>Back Knee: 175° – 180°, Arms: 180°", table_cell_code)
        ],
        [
            Paragraph("Warrior II<br/><i>Virabhadrasana II</i>", table_cell),
            Paragraph("Standing Lateral", table_cell),
            Paragraph("Front Knee, Back Knee, Shoulders", table_cell),
            Paragraph("Front Knee: 90° (±5°)<br/>Arms horizontal: 180° parallel", table_cell_code)
        ],
        [
            Paragraph("Downward Dog<br/><i>Adho Mukha Svanasana</i>", table_cell),
            Paragraph("Inversion", table_cell),
            Paragraph("Hips, Arms/Shoulders, Knees", table_cell),
            Paragraph("Hip acute angle: 70° – 80°<br/>Arms & Knees straight: 175° – 180°", table_cell_code)
        ],
        [
            Paragraph("Cobra Pose<br/><i>Bhujangasana</i>", table_cell),
            Paragraph("Prone Backbend", table_cell),
            Paragraph("Spine-Chest, Elbows, Pelvis", table_cell),
            Paragraph("Elbows slightly bent: 155° – 170°<br/>Chest-Hip extension: 135° – 150°", table_cell_code)
        ],
        [
            Paragraph("Triangle Pose<br/><i>Trikonasana</i>", table_cell),
            Paragraph("Standing Lateral", table_cell),
            Paragraph("Front Knee, Torso-Leg, Arms", table_cell),
            Paragraph("Both Knees: 175° – 180°<br/>Torso lateral flexion: 90° (±10°)", table_cell_code)
        ],
        [
            Paragraph("Bridge Pose<br/><i>Setu Bandhasana</i>", table_cell),
            Paragraph("Supine Backbend", table_cell),
            Paragraph("Knees, Pelvis-Spine, Thighs", table_cell),
            Paragraph("Knees: 90° (±5°)<br/>Hip-Torso extension: 160° – 175°", table_cell_code)
        ],
    ]
    t_asanas = Table(asanas_table_data, colWidths=[120, 94, 140, 150])
    t_asanas.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_asanas)

    # SECTION 6
    story.append(Spacer(1, 8))
    story.append(Paragraph("6. Quality Assurance & 5-Point Data Integrity Protocols", h1_style))
    story.append(Paragraph(
        "To ensure that the dataset gathered through YogaSync AI is suitable for training high-precision deep learning classifiers, all submitted samples must pass a rigorous 5-point data validation gate:",
        body_style
    ))

    qa_points = [
        Paragraph("<b>1. Resolution & Aspect Gate:</b> Media must satisfy a minimum resolution threshold of 640 &times; 480 pixels to avoid downsampling artifacts.", bullet_style),
        Paragraph("<b>2. Landmark Visibility Threshold (&ge; 0.65):</b> Critical joints (shoulders, elbows, wrists, hips, knees, ankles) must have visibility confidence exceeding 0.65.", bullet_style),
        Paragraph("<b>3. Bounding Box Containment:</b> Normalized coordinates must satisfy 0.0 &le; x, y &le; 1.0 to guarantee the subject is fully within the visual field.", bullet_style),
        Paragraph("<b>4. Occlusion & Symmetry Verification:</b> In unilateral postures (e.g., Tree Pose, Warrior I), both bilateral sides are checked to prevent self-occlusion false positives.", bullet_style),
        Paragraph("<b>5. Biomechanical Plausibility Filter:</b> Anatomically impossible angles (e.g., knee extension &gt; 185° or elbow hyperextension) trigger immediate rejection.", bullet_style),
    ]
    for q in qa_points:
        story.append(q)

    # SECTION 7
    story.append(Spacer(1, 8))
    story.append(Paragraph("7. Cloud Infrastructure, Deployment & Verification", h1_style))
    story.append(Paragraph(
        "The project has been deployed live to production and thoroughly verified against automated unit test suites:",
        body_style
    ))

    deploy_data = [
        [Paragraph("<b>Component</b>", table_header), Paragraph("<b>Production Configuration & Verification State</b>", table_header)],
        [
            Paragraph("<b>Live Vercel Web Portal</b>", table_cell_bold),
            Paragraph("Hosted at <b>https://cv-module-ten.vercel.app/</b>. Fully compiled with Next.js 16 (0 TypeScript / ESLint errors). Gated behind mandatory authentication.", table_cell)
        ],
        [
            Paragraph("<b>Central Google Drive Storage</b>", table_cell_bold),
            Paragraph("400 GB storage repository on account <code>thanseeftrio@gmail.com</code>. Supports chunked streaming upload directly into categorized folder trees.", table_cell)
        ],
        [
            Paragraph("<b>Supabase PostgreSQL</b>", table_cell_bold),
            Paragraph("Project endpoint <code>https://cqbquovaqukczctergjr.supabase.co</code>. Relational schema with RLS policies protecting users, poses, samples, and reviews.", table_cell)
        ],
        [
            Paragraph("<b>Python Test Suite</b>", table_cell_bold),
            Paragraph("20/20 unit tests passing (<code>test_angle_calculator.py</code>, <code>test_dataset_pipeline.py</code>). Verifies angle precision to &plusmn;0.01 radians.", table_cell)
        ],
        [
            Paragraph("<b>GitHub Repository</b>", table_cell_bold),
            Paragraph("Synchronized with <code>https://github.com/yogasynca/CV-MODULE.git</code> (Branch: <code>main</code>). Sanitized of all secret tokens and private keys.", table_cell)
        ]
    ]
    t_deploy = Table(deploy_data, colWidths=[140, 364])
    t_deploy.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_deploy)

    # SECTION 8
    story.append(Spacer(1, 8))
    story.append(Paragraph("8. Project Mentor Evaluation & Auditing Checklist", h1_style))
    story.append(Paragraph(
        "When evaluating the platform during milestone reviews, the Project Mentor can use the following checklist to audit performance and compliance:",
        body_style
    ))

    checklist_items = [
        Paragraph("&#x2611; <b>Authentication & Access Security:</b> Verify that unauthenticated visitors are prevented from entering internal routes and that each user is directed to their appropriate workspace.", bullet_style),
        Paragraph("&#x2611; <b>Real-Time MediaPipe Overlay:</b> In <code>/upload</code>, observe the live skeleton rendering over uploaded images and check landmark tracking fidelity.", bullet_style),
        Paragraph("&#x2611; <b>Quality Review Workflow:</b> In <code>/review</code>, test an Approve or Reject action on a pending sample and verify the review decision updates the sample status immediately.", bullet_style),
        Paragraph("&#x2611; <b>Dataset Balance Telemetry:</b> In <code>/admin</code> and <code>/dashboard</code>, check the distribution bar charts across the 8 poses to ensure no single class is neglected.", bullet_style),
        Paragraph("&#x2611; <b>Google Drive 400 GB Sync:</b> In <code>/settings</code>, confirm the Google Drive live connection indicator and verify the storage usage telemetry reflects live data.", bullet_style),
        Paragraph("&#x2611; <b>Automated Test Suite:</b> Execute <code>.venv\\Scripts\\python.exe -m unittest discover -s tests -v</code> to verify 20/20 unit test passing status.", bullet_style),
    ]
    for c in checklist_items:
        story.append(c)

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=4, spaceAfter=8))
    story.append(Paragraph(
        "<b>Document Sign-off:</b> This manual confirms the complete engineering implementation of Steps 1 through 6 of the YogaSync AI platform. Submitted for academic and technical mentorship review.",
        call_style if 'call_style' in locals() else body_style
    ))

    # Build PDF with TimesNumberedCanvas
    doc.build(story, canvasmaker=TimesNumberedCanvas)
    print(f"Successfully generated Mentor Guide PDF: {filename}")

if __name__ == "__main__":
    out_name = "YogaSync_AI_Mentor_Portal_Guide.pdf"
    if len(sys.argv) > 1:
        out_name = sys.argv[1]
    build_mentor_pdf(out_name)
