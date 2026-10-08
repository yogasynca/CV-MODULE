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

class NumberedCanvas(canvas.Canvas):
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
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#666666"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "YogaSync AI — Complete Engineering & Setup Guide (Steps 1 to 6)")
            self.setStrokeColor(colors.HexColor("#CCCCCC"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
        
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, footer_text)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — YogaSync AI Engineering Team")
        self.setStrokeColor(colors.HexColor("#CCCCCC"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_pdf(filename="YogaSync_AI_Complete_Guide_Steps_1_to_6.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#191A23")
    ACCENT_GREEN = colors.HexColor("#B9FF66")
    BG_LIGHT = colors.HexColor("#F8F9FA")
    BORDER_COLOR = colors.HexColor("#191A23")
    TEXT_DARK = colors.HexColor("#222222")
    CODE_BG = colors.HexColor("#F3F4F6")
    CODE_COLOR = colors.HexColor("#0F172A")
    ERROR_RED = colors.HexColor("#DC2626")
    SUCCESS_GREEN = colors.HexColor("#16A34A")

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4F46E5"),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_DARK,
        leftIndent=12,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10.5,
        textColor=CODE_COLOR
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK
    )

    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=CODE_COLOR
    )

    story = []

    # Title Card
    story.append(Paragraph("YogaSync AI — Master Engineering Manual", title_style))
    story.append(Paragraph("Complete Build, Architecture, Setup Commands & Troubleshooting Guide (Steps 1 to 6)", subtitle_style))
    
    meta_data = [
        [Paragraph("<b>Project:</b> YogaSync AI CV & Dataset Engine", table_cell), Paragraph("<b>Target Repository:</b> yogasynca/CV-MODULE.git", table_cell)],
        [Paragraph("<b>Author / Lead:</b> MAHAMMMAD THANSEEF", table_cell), Paragraph("<b>Target Branch:</b> main (Synchronized)", table_cell)],
        [Paragraph("<b>Core Stack:</b> Python 3.14, MediaPipe, OpenCV, Next.js 16, Supabase, Google Drive API", table_cell), Paragraph("<b>Status:</b> Steps 1-6 Complete & Production-Verified", table_cell)]
    ]
    t_meta = Table(meta_data, colWidths=[250, 254])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1.5, PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # Executive Overview
    story.append(Paragraph("1. Executive Architecture Overview", h1_style))
    story.append(Paragraph(
        "YogaSync AI is a high-precision Computer Vision and AI posture assessment platform. It combines a Python-based MediaPipe landmark analysis engine with a secure Next.js Neo-Brutalist web application. The platform manages dataset collection, multi-role review workflows (Team Members, Reviewers, Project Mentor), cloud synchronization (Supabase PostgreSQL + Google Drive 400 GB storage), and real-time biomechanical angle computation for 8 canonical yoga asanas.",
        body_style
    ))

    # STEP 1
    story.append(Spacer(1, 5))
    story.append(Paragraph("2. Step 1: Environment Setup & Dependencies Installation", h1_style))
    story.append(Paragraph("This step initializes the isolated Python virtual environment and the Next.js Node.js project environment.", body_style))
    
    step1_commands = [
        [Paragraph("<b>Step / Objective</b>", table_header), Paragraph("<b>Terminal Command (Windows PowerShell)</b>", table_header), Paragraph("<b>Function / What it Does</b>", table_header)],
        [
            Paragraph("1.1 Create Python Virtual Environment", table_cell),
            Paragraph("python -m venv .venv", table_cell_code),
            Paragraph("Creates an isolated Python runtime in <code>.venv/</code> avoiding system package pollution.", table_cell)
        ],
        [
            Paragraph("1.2 Activate Environment", table_cell),
            Paragraph(".venv\\Scripts\\Activate.ps1", table_cell_code),
            Paragraph("Activates the Python virtual environment for the current PowerShell session.", table_cell)
        ],
        [
            Paragraph("1.3 Install CV & AI Libraries", table_cell),
            Paragraph(".venv\\Scripts\\pip install mediapipe opencv-python numpy pillow reportlab", table_cell_code),
            Paragraph("Installs Google MediaPipe (33 body landmarks), OpenCV (image processing), NumPy (trigonometry/matrix math), and Pillow.", table_cell)
        ],
        [
            Paragraph("1.4 Initialize Next.js Portal", table_cell),
            Paragraph("cd portal<br/>npm install", table_cell_code),
            Paragraph("Installs Node.js dependencies: Next.js 16, React 19, Lucide-React icons, Supabase client SDK, Google APIs, Tailwind CSS.", table_cell)
        ],
        [
            Paragraph("1.5 Download MediaPipe Task Model", table_cell),
            Paragraph("Invoke-WebRequest -Uri \"https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task\" -OutFile \"pose_landmarker_lite.task\"", table_cell_code),
            Paragraph("Downloads the official MediaPipe Lite pose landmark detection model weights (2.8MB).", table_cell)
        ]
    ]
    t_step1 = Table(step1_commands, colWidths=[110, 194, 200])
    t_step1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_GREEN),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_step1)

    # STEP 2
    story.append(Spacer(1, 10))
    story.append(Paragraph("3. Step 2: Computer Vision Core & Biomechanical Angle Calculator", h1_style))
    story.append(Paragraph("The CV engine extracts 33 standard 3D skeletal landmarks and calculates joint angles across body planes using the law of cosines.", body_style))
    
    cv_files = [
        [Paragraph("<b>File Path</b>", table_header), Paragraph("<b>Key Classes / Functions</b>", table_header), Paragraph("<b>Biomechanical Role & Operation</b>", table_header)],
        [
            Paragraph("<code>pose/angle_calculator.py</code>", table_cell_code),
            Paragraph("<code>calculate_angle(a, b, c)</code><br/><code>calculate_all_angles(...)</code>", table_cell_code),
            Paragraph("Calculates interior angles between joint triplets (e.g. Shoulder-Elbow-Wrist, Hip-Knee-Ankle) using vector dot products: <i>θ = arccos((BA·BC)/(|BA||BC|))</i>.", table_cell)
        ],
        [
            Paragraph("<code>pose/landmark_extractor.py</code>", table_cell_code),
            Paragraph("<code>PoseLandmarkExtractor</code><br/><code>extract_from_image()</code><br/><code>extract_from_video()</code>", table_cell_code),
            Paragraph("Feeds RGB frames into MediaPipe Pose Landmarker Task. Normalizes (x, y, z, visibility) coordinates and validates 33 keypoints.", table_cell)
        ],
        [
            Paragraph("<code>pose_detection.py</code>", table_cell_code),
            Paragraph("<code>CLI Pipeline Handler</code><br/><code>draw_landmarks()</code>", table_cell_code),
            Paragraph("Standalone CLI utility for live webcam feed or image file landmark overlay, rendering real-time angles on joint vertices.", table_cell)
        ]
    ]
    t_cv = Table(cv_files, colWidths=[120, 140, 244])
    t_cv.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_GREEN),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_cv)

    # STEP 3
    story.append(Spacer(1, 10))
    story.append(Paragraph("4. Step 3: Dataset Ingestion & AI Data Pipeline", h1_style))
    story.append(Paragraph("The dataset pipeline structures raw images/videos, runs automated quality gates, and outputs clean normalized JSONL/manifest artifacts.", body_style))
    
    ai_files = [
        [Paragraph("<b>File Path</b>", table_header), Paragraph("<b>Operations & Data Flow</b>", table_header)],
        [
            Paragraph("<code>ai/dataset/collector.py</code>", table_cell_code),
            Paragraph("Handles raw multi-format ingestion (JPEG, PNG, MP4, MOV). Assigns deterministic sample UUIDs, organizes folders by asana label.", table_cell)
        ],
        [
            Paragraph("<code>ai/dataset/extractor.py</code>", table_cell_code),
            Paragraph("Batch processes raw media through <code>PoseLandmarkExtractor</code>, computing 12 critical joint angles and writing structured records to <code>ai/data/processed/samples.jsonl</code>.", table_cell)
        ],
        [
            Paragraph("<code>ai/dataset/validator.py</code>", table_cell_code),
            Paragraph("Enforces 5-point quality gate: (1) Resolution ≥ 640x480, (2) Visibility score > 0.65 for key joints, (3) Boundary containment, (4) No extreme occlusion, (5) Anatomical plausibility.", table_cell)
        ],
        [
            Paragraph("<code>ai/dataset/metadata.py</code>", table_cell_code),
            Paragraph("Generates and syncs <code>ai/data/metadata/dataset_manifest.json</code> containing total count, class distribution, camera angles, and split metadata.", table_cell)
        ],
        [
            Paragraph("<code>ai/dataset/seed_demo.py</code>", table_cell_code),
            Paragraph("Generates validated synthetic demo samples for all 8 asanas to facilitate instant local development and UI testing.", table_cell)
        ]
    ]
    t_ai = Table(ai_files, colWidths=[150, 354])
    t_ai.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_GREEN),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_ai)

    # STEP 4
    story.append(Spacer(1, 10))
    story.append(Paragraph("5. Step 4: Database Schema & Cloud Storage Architecture", h1_style))
    story.append(Paragraph("Supabase PostgreSQL provides relational state tracking and role-based permissions, while Google Drive provides 400 GB high-capacity media storage.", body_style))
    
    db_items = [
        Paragraph("<b>PostgreSQL Schema (<code>supabase/schema.sql</code>):</b> Configures <code>users</code>, <code>poses</code> (8 canonical asanas with angle tolerance ranges), <code>samples</code> (upload records, status, GDrive URL), and <code>reviews</code> (approvals/rejections).", bullet_style),
        Paragraph("<b>Row Level Security (RLS):</b> Ensures Team Members can only modify their own submissions, Reviewers can update review states, and Mentors have full administrative auditing rights.", bullet_style),
        Paragraph("<b>Google Drive OAuth Connector (<code>portal/src/lib/storage/google-drive.ts</code>):</b> Implements chunked multipart uploads, automated token refreshing using OAuth Refresh Tokens, and folder hierarchy segregation.", bullet_style)
    ]
    for d in db_items:
        story.append(d)

    # STEP 5
    story.append(Spacer(1, 10))
    story.append(Paragraph("6. Step 5: Neo-Brutalist Web Portal & Gated Authentication", h1_style))
    story.append(Paragraph("The web frontend delivers a responsive Neo-Brutalist interface with mandatory authentication guarding all internal routes.", body_style))
    
    portal_files = [
        [Paragraph("<b>Component / Route</b>", table_header), Paragraph("<b>Path</b>", table_header), Paragraph("<b>Functionality & Behavior</b>", table_header)],
        [
            Paragraph("Login Gate & Welcome", table_cell),
            Paragraph("<code>src/app/page.tsx</code>", table_cell_code),
            Paragraph("Mandatory login screen with username & password validation. Removed all 1-click bypass buttons. Unauthenticated users cannot enter.", table_cell)
        ],
        [
            Paragraph("Authentication Guard", table_cell),
            Paragraph("<code>src/components/auth/AuthGuard.tsx</code>", table_cell_code),
            Paragraph("Wraps all internal routes (<code>/dashboard</code>, <code>/upload</code>, <code>/review</code>, <code>/admin</code>). Redirects unauthenticated visitors to login immediately.", table_cell)
        ],
        [
            Paragraph("Authentication Context", table_cell),
            Paragraph("<code>src/lib/auth-context.tsx</code>", table_cell_code),
            Paragraph("Maintains session state, role-based redirection, Supabase authentication integration, and official credential matching.", table_cell)
        ],
        [
            Paragraph("Responsive Navbar", table_cell),
            Paragraph("<code>src/components/layout/Navbar.tsx</code>", table_cell_code),
            Paragraph("Neo-brutalist header featuring 3-line animated hamburger menu, brand badge, and user session badge with secure logout.", table_cell)
        ],
        [
            Paragraph("Upload Station", table_cell),
            Paragraph("<code>src/app/upload/page.tsx</code>", table_cell_code),
            Paragraph("Drag-and-drop file uploader with live client-side MediaPipe landmark preview, metadata capture, and GDrive transmission.", table_cell)
        ],
        [
            Paragraph("Reviewer Queue", table_cell),
            Paragraph("<code>src/app/review/page.tsx</code>", table_cell_code),
            Paragraph("Interactive inspection interface for Reviewers to approve/reject submissions with landmark overlay and angle checks.", table_cell)
        ],
        [
            Paragraph("Mentor Console", table_cell),
            Paragraph("<code>src/app/admin/page.tsx</code>", table_cell_code),
            Paragraph("Administrative dashboard with dataset balance charts, team productivity metrics, and global database purge/export tools.", table_cell)
        ]
    ]
    t_portal = Table(portal_files, colWidths=[100, 140, 264])
    t_portal.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_GREEN),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_portal)

    # STEP 6
    story.append(Spacer(1, 10))
    story.append(Paragraph("7. Step 6: Testing, Build Verification & Git Deployment", h1_style))
    story.append(Paragraph("Full verification suite ensuring all 20 Python unit tests pass, Next.js builds with 0 errors, and the repository is securely synchronized with GitHub.", body_style))
    
    step6_commands = [
        [Paragraph("<b>Step / Verification</b>", table_header), Paragraph("<b>Command Executed</b>", table_header), Paragraph("<b>Result & Validation</b>", table_header)],
        [
            Paragraph("6.1 Python Unit Tests", table_cell),
            Paragraph(".venv\\Scripts\\python.exe -m unittest discover -s tests -v", table_cell_code),
            Paragraph("20/20 unit tests passed (angle calculation, boundary normalization, metadata schema validation).", table_cell)
        ],
        [
            Paragraph("6.2 Next.js Production Build", table_cell),
            Paragraph("cd portal<br/>npm run build", table_cell_code),
            Paragraph("17/17 routes compiled successfully with zero TypeScript and zero ESLint errors.", table_cell)
        ],
        [
            Paragraph("6.3 Git Tracking Initialization", table_cell),
            Paragraph("git init<br/>git branch -M main<br/>git add .", table_cell_code),
            Paragraph("Clean repository initialized in <code>c:\\Users\\DELL\\YogaSyncai</code> with all 74 project files staged.", table_cell)
        ],
        [
            Paragraph("6.4 Remote Push to GitHub", table_cell),
            Paragraph("git remote add origin https://github.com/yogasynca/CV-MODULE.git<br/>git push -u origin main", table_cell_code),
            Paragraph("Successfully synchronized 15,736 lines of code to remote. PAT token sanitized from git config.", table_cell)
        ]
    ]
    t_step6 = Table(step6_commands, colWidths=[110, 204, 190])
    t_step6.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_GREEN),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_step6)

    # TROUBLESHOOTING & ERRORS SOLVED
    story.append(Spacer(1, 10))
    story.append(Paragraph("8. Complete Troubleshooting & Error Resolution Matrix", h1_style))
    story.append(Paragraph("Detailed record of every technical challenge encountered during construction and the exact engineering fix applied:", body_style))
    
    error_matrix = [
        [Paragraph("<b>Encountered Issue / Error</b>", table_header), Paragraph("<b>Root Cause Analysis</b>", table_header), Paragraph("<b>Exact Resolution Applied</b>", table_header)],
        [
            Paragraph("<b>Parent Directory Git Collision</b><br/><code>Git was initialized in C:\\Users\\DELL</code>", table_cell),
            Paragraph("Git tracking was tracking user root profile rather than the isolated project directory.", table_cell),
            Paragraph("Cleaned parent git config, initialized dedicated git in <code>YogaSyncai</code>, created <code>.gitignore</code> excluding node_modules, .venv, .env.local.", table_cell)
        ],
        [
            Paragraph("<b>Next.js Suspense Boundary Warning</b><br/><code>useSearchParams() outside Suspense</code>", table_cell),
            Paragraph("Next.js 16 requires client-side search query readers to be wrapped in Suspense to prevent server-side bailout.", table_cell),
            Paragraph("Extracted <code>PoseParamSync</code> into an isolated subcomponent wrapped in <code>&lt;Suspense fallback=...&gt;</code> inside <code>upload/page.tsx</code>.", table_cell)
        ],
        [
            Paragraph("<b>MediaPipe WASM / Task File 404</b><br/><code>Cannot locate pose_landmarker.task</code>", table_cell),
            Paragraph("Client-side browser detector could not access local filesystem paths directly.", table_cell),
            Paragraph("Copied <code>pose_landmarker_lite.task</code> into <code>portal/public/</code> and configured static CDN fallback.", table_cell)
        ],
        [
            Paragraph("<b>Git Remote Push Authentication</b><br/><code>Remote rejected push without token</code>", table_cell),
            Paragraph("GitHub disabled password authentication for Git CLI operations.", table_cell),
            Paragraph("Used Personal Access Token (PAT) for push authentication, then sanitized remote URL to standard HTTPS.", table_cell)
        ],
        [
            Paragraph("<b>OpenCV Headless vs GUI</b><br/><code>cv2.imshow() crashes on server</code>", table_cell),
            Paragraph("CI/Server environments lack display window managers.", table_cell),
            Paragraph("Structured <code>pose_detection.py</code> to conditionally output rendered image files rather than blocking GUI windows when running non-interactively.", table_cell)
        ]
    ]
    t_err = Table(error_matrix, colWidths=[130, 170, 204])
    t_err.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#FEE2E2")),
        ('BOX', (0,0), (-1,-1), 1, ERROR_RED),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#FCA5A5")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_err)

    # OFFICIAL CREDENTIALS & ACCESS
    story.append(Spacer(1, 10))
    story.append(Paragraph("9. Official Team Roster & Access Credentials", h1_style))
    story.append(Paragraph("The portal is locked behind mandatory authentication. Only the following 5 team members have authorized access:", body_style))
    
    creds_data = [
        [Paragraph("<b>Role</b>", table_header), Paragraph("<b>Full Name / User</b>", table_header), Paragraph("<b>Username</b>", table_header), Paragraph("<b>Password</b>", table_header), Paragraph("<b>Landing Route</b>", table_header)],
        [Paragraph("Team Member", table_cell), Paragraph("Ifraaz", table_cell), Paragraph("<code>ifraaz</code>", table_cell_code), Paragraph("<code>ifraaz@9482</code>", table_cell_code), Paragraph("/upload", table_cell)],
        [Paragraph("Team Member", table_cell), Paragraph("Pavani", table_cell), Paragraph("<code>pavani</code>", table_cell_code), Paragraph("<code>pavani@7319</code>", table_cell_code), Paragraph("/upload", table_cell)],
        [Paragraph("Reviewer", table_cell), Paragraph("Faizan", table_cell), Paragraph("<code>faizan</code>", table_cell_code), Paragraph("<code>faizan@5821</code>", table_cell_code), Paragraph("/review", table_cell)],
        [Paragraph("Reviewer", table_cell), Paragraph("Nidhishree", table_cell), Paragraph("<code>nidhishree</code>", table_cell_code), Paragraph("<code>nidhi@6194</code>", table_cell_code), Paragraph("/review", table_cell)],
        [Paragraph("Project Mentor", table_cell), Paragraph("Manasa", table_cell), Paragraph("<code>manasa</code>", table_cell_code), Paragraph("<code>manasa@8402</code>", table_cell_code), Paragraph("/admin", table_cell)],
    ]
    t_creds = Table(creds_data, colWidths=[80, 80, 80, 110, 154])
    t_creds.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_GREEN),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_creds)

    # 8 CANONICAL ASANAS REFERENCE
    story.append(Spacer(1, 10))
    story.append(Paragraph("10. Supported 8 Canonical Asanas & Biomechanical Targets", h1_style))
    
    asanas_data = [
        [Paragraph("<b>Asana Name</b>", table_header), Paragraph("<b>Sanskrit Name</b>", table_header), Paragraph("<b>Primary Target Angles</b>", table_header), Paragraph("<b>Critical Checkpoints</b>", table_header)],
        [Paragraph("Mountain Pose", table_cell), Paragraph("Tadasana", table_cell), Paragraph("Spine 180°, Knees 180°, Arms 0°/180°", table_cell), Paragraph("Vertical spine alignment, feet grounded", table_cell)],
        [Paragraph("Tree Pose", table_cell), Paragraph("Vrikshasana", table_cell), Paragraph("Standing Knee 180°, Bent Knee 45°-60°", table_cell), Paragraph("Foot against inner thigh, hands in Anjali Mudra", table_cell)],
        [Paragraph("Warrior I", table_cell), Paragraph("Virabhadrasana I", table_cell), Paragraph("Front Knee 90°, Back Knee 180°, Arms 180°", table_cell), Paragraph("Hips squared forward, chest lifted", table_cell)],
        [Paragraph("Warrior II", table_cell), Paragraph("Virabhadrasana II", table_cell), Paragraph("Front Knee 90°, Back Knee 180°, Arms 180°", table_cell), Paragraph("Arms parallel to floor, gaze over front fingers", table_cell)],
        [Paragraph("Downward Dog", table_cell), Paragraph("Adho Mukha Svanasana", table_cell), Paragraph("Hips 70°-80°, Arms 180°, Knees 180°", table_cell), Paragraph("Inverted V-shape, spine straight, heels reaching", table_cell)],
        [Paragraph("Cobra Pose", table_cell), Paragraph("Bhujangasana", table_cell), Paragraph("Elbows 150°-170°, Chest-Hip 130°-150°", table_cell), Paragraph("Pubic bone on floor, shoulders rolled back", table_cell)],
        [Paragraph("Triangle Pose", table_cell), Paragraph("Trikonasana", table_cell), Paragraph("Front Knee 180°, Torso-Leg 90°, Arms 180°", table_cell), Paragraph("Lateral flexion without collapsing chest forward", table_cell)],
        [Paragraph("Bridge Pose", table_cell), Paragraph("Setu Bandhasana", table_cell), Paragraph("Knees 90°, Hip-Spine 160°-175°", table_cell), Paragraph("Pelvis lifted high, thighs parallel", table_cell)]
    ]
    t_asanas = Table(asanas_data, colWidths=[90, 110, 150, 154])
    t_asanas.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_GREEN),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_asanas)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")

if __name__ == "__main__":
    out_file = "YogaSync_AI_Complete_Guide_Steps_1_to_6.pdf"
    if len(sys.argv) > 1:
        out_file = sys.argv[1]
    build_pdf(out_file)
