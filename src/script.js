class PuzzlePiece {
    constructor(game, x, y, width, height, tabTypes) {
        this.game = game;
        this.gridX = x; // Col index
        this.gridY = y; // Row index
        this.width = width;
        this.height = height;
        this.tabTypes = tabTypes; // { top, right, bottom, left } (0: flat, 1: tab, -1: blank)

        // Correct position based on the centered original image
        this.correctX = this.game.imageOffsetX + x * width;
        this.correctY = this.game.imageOffsetY + y * height;

        // Current position on canvas (randomized initially)
        this.currentX = Math.random() * (this.game.canvas.width - width * 2) + width;
        this.currentY = Math.random() * (this.game.canvas.height - height * 2) + height;

        this.isLocked = false;

        // Create an offscreen canvas containing just this piece's image cut out
        this.pieceCanvas = document.createElement('canvas');
        this.pieceCanvas.width = width * 2; // Extra space for tabs
        this.pieceCanvas.height = height * 2;
        this.pieceCtx = this.pieceCanvas.getContext('2d');

        this.drawPieceShape();
    }

    drawPieceShape() {
        const ctx = this.pieceCtx;
        const w = this.width;
        const h = this.height;
        const oX = w * 0.5; // Offset to center the piece in the offscreen canvas
        const oY = h * 0.5;

        ctx.save();
        ctx.beginPath();
        // Path generation logic for jigsaw puzzle tab
        this.buildPath(ctx, oX, oY, w, h);
        ctx.clip();

        // Draw the image onto this piece's specific region
        const imgX = this.gridX * w;
        const imgY = this.gridY * h;

        // The image source is drawn so that the top-left of the piece aligns with oX, oY
        ctx.drawImage(this.game.image,
            imgX - oX, imgY - oY, w * 2, h * 2,
            0, 0, w * 2, h * 2);

        ctx.restore();

        // Add subtle shadow and border
        ctx.save();
        ctx.beginPath();
        this.buildPath(ctx, oX, oY, w, h);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();
        ctx.restore();
    }

    // Generates the outline of the piece using bezier curves for tabs and blanks
    buildPath(ctx, startX, startY, w, h) {
        ctx.moveTo(startX, startY);

        const drawEdge = (length, tabType, isVertical, isReversed) => {
            if (tabType === 0) {
                if (isVertical) {
                    ctx.lineTo(startX + (isReversed ? 0 : w), startY + (isReversed ? 0 : h));
                } else {
                    ctx.lineTo(startX + (isReversed ? 0 : w), startY + (isReversed ? 0 : h));
                }
                return;
            }
            // More complex bezier tabs would go here. For simplicity in dense grids, 
            // a simplified tab model is implemented.
            const s = isReversed ? -1 : 1;
            const t = tabType * 0.25 * length * s;
            const d = length * s;

            if (isVertical) {
                // To be implemented: realistic puzzle tabs
                ctx.lineTo(startX + w, startY + h);
            } else {
                ctx.lineTo(startX + w, startY + h);
            }
        };

        // Simplified path (Rectangle with semi-circle tabs)
        // We will build a better interlocking path
        const buildTab = (pt1, pt2, tabDir) => {
            if (tabDir === 0) {
                ctx.lineTo(pt2.x, pt2.y);
                return;
            }

            const dx = pt2.x - pt1.x;
            const dy = pt2.y - pt1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const midX = pt1.x + dx / 2;
            const midY = pt1.y + dy / 2;

            const nx = -dy / dist;
            const ny = dx / dist;

            const tabSize = Math.min(w, h) * 0.2;

            // Cubic bezier approximations for a tab
            const cp1x = pt1.x + dx * 0.35 + nx * tabSize * tabDir;
            const cp1y = pt1.y + dy * 0.35 + ny * tabSize * tabDir;
            const cp2x = pt1.x + dx * 0.65 + nx * tabSize * tabDir;
            const cp2y = pt1.y + dy * 0.65 + ny * tabSize * tabDir;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pt2.x, pt2.y);
        };

        buildTab({ x: startX, y: startY }, { x: startX + w, y: startY }, this.tabTypes.top);
        buildTab({ x: startX + w, y: startY }, { x: startX + w, y: startY + h }, this.tabTypes.right);
        buildTab({ x: startX + w, y: startY + h }, { x: startX, y: startY + h }, this.tabTypes.bottom);
        buildTab({ x: startX, y: startY + h }, { x: startX, y: startY }, this.tabTypes.left);
    }

    draw(ctx) {
        const oX = this.width * 0.5;
        const oY = this.height * 0.5;

        // Draw the pre-rendered piece canvas
        ctx.drawImage(this.pieceCanvas, this.currentX - oX, this.currentY - oY);

        // Draw glow effect if locked
        if (this.isLocked) {
            // Optional: highlight momentarily when locked
        }
    }

    containsPoint(px, py) {
        // Simple bounding box check (improved accuracy requires hit testing the Path2D via context)
        return px >= this.currentX && px <= this.currentX + this.width &&
            py >= this.currentY && py <= this.currentY + this.height;
    }
}

class JigsawGame {
    constructor() {
        this.app = document.getElementById('app');
        this.setupScreen = document.getElementById('setup-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.winOverlay = document.getElementById('win-overlay');
        this.timeDisplay = document.getElementById('time-display');
        this.winTime = document.getElementById('win-time');
        this.winBestTime = document.getElementById('win-best-time');

        this.libraryImages = document.querySelectorAll('.library-img');
        this.thirukkuralBtn = document.getElementById('thirukkural-btn');

        this.imageUpload = document.getElementById('image-upload');
        this.imagePreview = document.getElementById('image-preview');
        this.previewContainer = document.getElementById('preview-container');
        this.removeBtn = document.getElementById('remove-image');
        this.startBtn = document.getElementById('start-btn');
        this.backBtn = document.getElementById('back-btn');
        this.peekBtn = document.getElementById('peek-btn');
        this.gridBtn = document.getElementById('grid-btn');
        this.refreshTrayBtn = document.getElementById('refresh-tray-btn');
        this.exportPdfBtn = document.getElementById('export-pdf-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.closeWinBtn = document.getElementById('close-win-btn');

        this.zoomInBtn = document.getElementById('zoom-in-btn');
        this.zoomOutBtn = document.getElementById('zoom-out-btn');
        this.zoomLabel = document.getElementById('zoom-label');
        this.zoomLevel = 1.0;


        // Custom panning engine variables
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.initialScrollLeft = 0;
        this.initialScrollTop = 0;

        // Warning Modal
        this.warningOverlay = document.getElementById('warning-overlay');
        this.pdfSizeSelect = document.getElementById('pdf-size-select');
        this.warningExportBtn = document.getElementById('warning-export-btn');
        this.warningProceedBtn = document.getElementById('warning-proceed-btn');

        this.difficultyRadios = document.querySelectorAll('input[name="difficulty"]');

        this.canvas = document.getElementById('puzzle-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.image = null;
        this.pieces = [];
        this.gridSize = 3; // Default

        this.isPeeking = false;
        this.draggedPiece = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        this.placedCount = 0;
        this.totalCount = 0;
        this.isThirukkuralMode = false;
        this.maxVisiblePieces = 3;
        this.isGridVisible = false;

        this.snapEffects = [];
        this.isAnimatingEffects = false;

        // For synthetic audio
        this.audioCtx = null;
        this.audioUnlocked = false;

        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;

        this.bindEvents();
    }

    bindEvents() {
        this.libraryImages.forEach(img => {
            img.addEventListener('click', (e) => this.handleLibrarySelection(e.target));
        });

        if (this.thirukkuralBtn) {
            this.thirukkuralBtn.addEventListener('click', () => this.selectThirukkural());
        }

        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.removeBtn.addEventListener('click', () => this.removeImage());
        this.startBtn.addEventListener('click', () => this.startGame());
        this.backBtn.addEventListener('click', () => this.quitGame());
        this.playAgainBtn.addEventListener('click', () => this.quitGame());
        if (this.closeWinBtn) {
            this.closeWinBtn.addEventListener('click', () => {
                this.winOverlay.classList.add('hidden');
            });
        }

        this.peekBtn.addEventListener('pointerdown', () => { this.isPeeking = true; this.draw(); });
        this.peekBtn.addEventListener('pointerup', () => { this.isPeeking = false; this.draw(); });
        this.peekBtn.addEventListener('pointerleave', () => { this.isPeeking = false; this.draw(); });

        if (this.gridBtn) {
            this.gridBtn.addEventListener('click', () => {
                this.isGridVisible = !this.isGridVisible;
                if (this.isGridVisible) {
                    this.gridBtn.classList.add('active');
                } else {
                    this.gridBtn.classList.remove('active');
                }
                this.draw();
            });
        }

        if (this.refreshTrayBtn) {
            this.refreshTrayBtn.addEventListener('click', () => this.refreshTray());
        }

        if (this.zoomInBtn) this.zoomInBtn.addEventListener('click', () => this.handleZoom(0.1));
        if (this.zoomOutBtn) this.zoomOutBtn.addEventListener('click', () => this.handleZoom(-0.1));

        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        if (this.exportPdfBtn) {
            // Default header button exports to A4
            this.exportPdfBtn.addEventListener('click', () => this.exportToPDF('a4'));
        }

        if (this.warningExportBtn) {
            this.warningExportBtn.addEventListener('click', () => {
                const size = this.pdfSizeSelect ? this.pdfSizeSelect.value : 'a4';
                this.exportToPDF(size);
            });
        }
        if (this.warningProceedBtn) {
            this.warningProceedBtn.addEventListener('click', () => {
                this.warningOverlay.classList.add('hidden');
                this.startTimer();
            });
        }

        // Canvas interactivity
        this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
        window.addEventListener('pointerup', (e) => this.handlePointerUp(e));

        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('fullscreenchange', () => this.resizeCanvas());
    }

    handleZoom(delta) {
        if (this.pieces.length === 0) return;
        this.zoomLevel += delta;

        // Clamp zoom between 0.3x (Fit Screen) and 2.0x
        this.zoomLevel = Math.max(0.3, Math.min(this.zoomLevel, 2.0));

        if (this.zoomLabel) {
            this.zoomLabel.textContent = Math.round(this.zoomLevel * 100) + '%';
        }

        // Apply visual CSS transform. Hardware accelerated and instant.
        this.canvas.style.transform = `scale(${this.zoomLevel})`;

        // Adjust the physical layout bounding box to match the visual scale.
        // Negative margins pull the bounds inward exactly proportioned to the missing scale!
        this.canvas.style.marginRight = `-${this.canvas.width * (1 - this.zoomLevel)}px`;
        this.canvas.style.marginBottom = `-${this.canvas.height * (1 - this.zoomLevel)}px`;
    }

    handleLibrarySelection(imgElement) {
        if (!imgElement.classList.contains('library-img')) return;

        this.isThirukkuralMode = false;

        // Clear custom upload if any
        this.removeImage(false);

        // Remove selection from others
        this.libraryImages.forEach(img => img.classList.remove('selected'));
        if (this.thirukkuralBtn) this.thirukkuralBtn.classList.remove('selected');

        // Add selection to clicked
        imgElement.classList.add('selected');

        const src = imgElement.getAttribute('data-src');
        if (!src) return;

        const img = new Image();
        img.onload = () => {
            this.image = img;
            this.startBtn.disabled = false;
        };
        img.src = src;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    exportToPDF(format = 'a4') {
        console.log("exportToPDF called:", {
            piecesExist: !!this.pieces,
            piecesLen: this.pieces ? this.pieces.length : 0,
            jspdfExist: !!window.jspdf
        });

        if (!this.pieces || this.pieces.length === 0 || !window.jspdf) {
            console.log("Early exit from exportToPDF");
            return;
        }

        try {
            // Determine a high-DPI scaling factor for larger paper formats
            let qualityScale = 1;
            if (format === 'a3') qualityScale = 1.5;
            if (format === 'a2') qualityScale = 2.0;

            // Create an offscreen canvas matching the scaled puzzle board
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = this.scaledW * qualityScale;
            exportCanvas.height = this.scaledH * qualityScale;

            const eCtx = exportCanvas.getContext('2d');

            // Scale the drawing context so the math remains standard but the pixel density increases
            eCtx.scale(qualityScale, qualityScale);

            // Draw the base image directly from the main game object reference
            eCtx.drawImage(this.image, 0, 0, this.scaledW, this.scaledH);

            // Draw the puzzle cutlines
            eCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            eCtx.lineWidth = 3;

            this.pieces.forEach(p => {
                const localX = p.correctX - this.imageOffsetX;
                const localY = p.correctY - this.imageOffsetY;

                eCtx.save();
                eCtx.translate(localX, localY);
                eCtx.beginPath();
                p.buildPath(eCtx, 0, 0, p.width, p.height);
                eCtx.stroke();
                eCtx.restore();
            });

            // Initialize jsPDF
            const { jsPDF } = window.jspdf;
            const orientation = this.scaledW > this.scaledH ? 'l' : 'p';
            const doc = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: format
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Add minimal margins
            const margin = 10;
            const maxW = pageWidth - margin * 2;
            const maxH = pageHeight - margin * 2;

            const ratio = Math.min(maxW / this.scaledW, maxH / this.scaledH);
            const printW = this.scaledW * ratio;
            const printH = this.scaledH * ratio;

            const offsetX = (pageWidth - printW) / 2;
            const offsetY = (pageHeight - printH) / 2;

            const imgData = exportCanvas.toDataURL('image/jpeg', 0.9);
            doc.addImage(imgData, 'JPEG', offsetX, offsetY, printW, printH);
            doc.save('Jigsaw_Puzzle_Printable.pdf');
            console.log("PDF generated and save triggered successfully.");
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to export PDF: " + error.message);
        }
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight, forceCenter = false) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        let isFirstLine = true;
        const originalAlign = ctx.textAlign;

        let rightJustifiedX = x;
        if (originalAlign === 'center') {
            rightJustifiedX = x + (maxWidth / 2);
        } else if (originalAlign === 'left' || originalAlign === 'start') {
            rightJustifiedX = x + maxWidth;
        }

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                if (isFirstLine) {
                    ctx.textAlign = originalAlign;
                    ctx.fillText(line.trim(), x, currentY);
                    isFirstLine = false;
                } else {
                    ctx.textAlign = forceCenter ? originalAlign : 'right';
                    const drawX = forceCenter ? x : rightJustifiedX;
                    ctx.fillText(line.trim(), drawX, currentY);
                }

                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }

        if (isFirstLine) {
            ctx.textAlign = originalAlign;
            ctx.fillText(line.trim(), x, currentY);
        } else {
            ctx.textAlign = forceCenter ? originalAlign : 'right';
            const drawX = forceCenter ? x : rightJustifiedX;
            ctx.fillText(line.trim(), drawX, currentY);
        }

        ctx.textAlign = originalAlign;
        return currentY + lineHeight;
    }

    updateTimerDisplay() {
        const m = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
        const s = (this.elapsedTime % 60).toString().padStart(2, '0');
        const timeStr = `${m}:${s}`;
        if (this.timeDisplay) this.timeDisplay.textContent = timeStr;
        return timeStr;
    }

    selectThirukkural() {
        this.isThirukkuralMode = true;
        this.removeImage(false);
        this.libraryImages.forEach(img => img.classList.remove('selected'));
        if (this.thirukkuralBtn) this.thirukkuralBtn.classList.add('selected');
        this.startBtn.disabled = false;
    }

    async generateThirukkuralImage() {
        if (typeof THIRUKKURAL_DATA === 'undefined' || THIRUKKURAL_DATA.length === 0) return null;

        // Wait for all fonts (like Noto Sans Tamil) to be fully loaded
        await document.fonts.ready;

        // Pick a random kural
        const randomIndex = Math.floor(Math.random() * THIRUKKURAL_DATA.length);
        const kural = THIRUKKURAL_DATA[randomIndex];

        // Create an offscreen canvas for our puzzle image
        // 3:2 ratio (1800:1200) fits long Tamil text perfectly without wrapping
        const canvas = document.createElement('canvas');
        canvas.width = 1800;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');

        // Draw elegant gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const hue1 = Math.floor(Math.random() * 360);
        const hue2 = (hue1 + 40 + Math.random() * 60) % 360;

        gradient.addColorStop(0, `hsl(${hue1}, 70%, 20%)`);
        gradient.addColorStop(1, `hsl(${hue2}, 80%, 15%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle pattern or noise (optional, simulating meditation vibes)
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let i = 0; i < 1500; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Typography setup
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Title
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '600 40px "Outfit", sans-serif';
        ctx.fillText(`Kural ${kural.number}`, canvas.width / 2, 160);

        // Tamil Kural
        ctx.fillStyle = '#ffffff';

        let tamilFontSize = 64;
        let fontStack = '"Latha", "Vijaya", "Nirmala UI", "Mukta Malar", "Tamil MN", "Noto Sans Tamil", sans-serif';
        ctx.font = `700 ${tamilFontSize}px ${fontStack}`;

        // Ensure Line 1 (4 words) fits within the canvas horizontally
        const maxTextWidth = canvas.width - 240; 
        
        while (ctx.measureText(kural.line1).width > maxTextWidth && tamilFontSize > 24) {
            tamilFontSize -= 2;
            ctx.font = `700 ${tamilFontSize}px ${fontStack}`;
        }

        const line1Width = ctx.measureText(kural.line1).width;
        // The boundedWidth logic for the starting position is determined by the first line width
        const boundedWidth = Math.min(line1Width, maxTextWidth);
        const startX = (canvas.width - boundedWidth) / 2;

        ctx.textAlign = 'left';

        // Line 1 (Tamil)
        let startY = 380;
        startY = this.wrapText(ctx, kural.line1, startX, startY, maxTextWidth, Math.floor(tamilFontSize * 1.3));

        startY += 20;

        // Line 2 (Tamil)
        startY = this.wrapText(ctx, kural.line2, startX, startY, maxTextWidth, Math.floor(tamilFontSize * 1.3));

        // Add breathing room before translation
        startY += 60;

        // Translation
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        let englishFontSize = Math.max(tamilFontSize - 4, 20);
        ctx.font = `italic ${englishFontSize}px Outfit, sans-serif`;
        ctx.textAlign = 'center';

        startY += 40;
        this.wrapText(ctx, kural.translation, canvas.width / 2, startY, canvas.width - 240, Math.floor(englishFontSize * 1.4), true);

        // Border element
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

        return canvas;
    }

    handleImageUpload(e) {
        this.isThirukkuralMode = false;
        const file = e.target.files[0];
        if (!file) return;

        // Clear library selection
        this.libraryImages.forEach(img => img.classList.remove('selected'));

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.imagePreview.src = event.target.result;
                this.previewContainer.classList.remove('hidden');
                this.startBtn.disabled = false;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeImage(clearSelection = true) {
        this.image = null;
        this.imageUpload.value = '';
        this.imagePreview.src = '';
        this.previewContainer.classList.add('hidden');
        if (clearSelection) {
            this.startBtn.disabled = true;
            this.libraryImages.forEach(img => img.classList.remove('selected'));
            if (this.thirukkuralBtn) this.thirukkuralBtn.classList.remove('selected');
        }
    }

    getGridDimensions() {
        let diff = 3;
        const radios = document.querySelectorAll('.grid-selector input[type="radio"]');
        radios.forEach(r => {
            if (r.checked) diff = parseInt(r.value);
        });

        // Use standard NxN grid for all modes now that canvas scaling solves text fitment
        return { cols: diff, rows: diff, diff: diff };
    }

    async startGame() {
        this.initAudio();
        if (this.isThirukkuralMode) {
            this.startBtn.disabled = true; // prevent double clicks
            this.image = await this.generateThirukkuralImage();
            this.startBtn.disabled = false;
        }
        if (!this.image) return;

        const dims = this.getGridDimensions();
        this.gridCols = dims.cols;
        this.gridRows = dims.rows;
        this.gridSize = dims.diff; // Maintain diff for tracking best times

        this.setupScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.winOverlay.classList.add('hidden');
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.winTimeout) clearTimeout(this.winTimeout);

        this.resizeCanvas();
        this.initPuzzle();

        // Warning intercept for extremely high piece counts on all devices
        if (this.gridSize >= 15) {
            this.warningOverlay.classList.remove('hidden');
            this.elapsedTime = 0;
            this.updateTimerDisplay();
            // Pause here, waiting for user to 'Proceed' or 'Export'
            return;
        }

        this.startTimer();
    }

    startTimer() {
        this.elapsedTime = 0;
        this.startTime = Date.now();
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    }

    quitGame() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.winTimeout) clearTimeout(this.winTimeout);

        this.winOverlay.classList.add('hidden');
        this.gameScreen.classList.remove('active');
        this.setupScreen.classList.add('active');
        this.pieces = [];
        if (this.logicalW) {
            this.ctx.clearRect(0, 0, this.logicalW, this.logicalH);
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    resizeCanvas() {
        if (this.pieces.length > 0) return; // Freeze dynamic squishing during active gameplay. The user will pan natively instead!

        const container = document.getElementById('canvas-container');
        this.logicalW = container.clientWidth;
        this.logicalH = container.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.logicalW * dpr;
        this.canvas.height = this.logicalH * dpr;
        this.canvas.style.width = `${this.logicalW}px`;
        this.canvas.style.height = `${this.logicalH}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    initPuzzle() {
        this.pieces = [];
        this.placedCount = 0;
        this.totalCount = this.gridCols * this.gridRows;
        this.updateProgress();

        // Reset Camera Zoom
        this.zoomLevel = 1.0;
        if (this.zoomLabel) this.zoomLabel.textContent = '100%';
        this.canvas.style.transform = `scale(1.0)`;
        this.canvas.style.marginRight = `0px`;
        this.canvas.style.marginBottom = `0px`;
        this.totalCount = this.gridCols * this.gridRows;
        this.updateProgress();

        // Calculate image scale to fit elegantly on the canvas
        const container = document.getElementById('canvas-container');
        const isMobile = container.clientWidth < 850;
        
        const paddingW = isMobile ? 10 : 50; 
        const paddingH = isMobile ? 20 : 50; 
        
        this.isLandscapeMode = container.clientWidth > container.clientHeight;
        const traySpace = (this.isLandscapeMode && isMobile) ? 140 : 180;
        
        let availableW = container.clientWidth - paddingW * 2;
        let availableH = container.clientHeight - paddingH * 2;
        
        if (this.isLandscapeMode) {
            availableW -= traySpace; // Tray goes on the right
        } else {
            availableH -= traySpace; // Tray goes on the bottom
        }

        const idealScale = Math.min(availableW / this.image.width, availableH / this.image.height);

        // Prevent "stamp size" shrinking
        const minScreenDim = Math.min(container.clientWidth, container.clientHeight);
        const minScale = (minScreenDim * (isMobile ? 0.65 : 0.50)) / Math.min(this.image.width, this.image.height);

        const scale = Math.max(idealScale, minScale);

        this.scaledW = this.image.width * scale;
        this.scaledH = this.image.height * scale;

        // Force canvas physical geometric bounds to expand out to hold the massive payload
        let reqW = Math.max(container.clientWidth, Math.floor(this.scaledW + paddingW * 2));
        let reqH = Math.max(container.clientHeight, Math.floor(this.scaledH + paddingH * 2));
        
        if (this.isLandscapeMode) {
            reqW = Math.max(reqW, Math.floor(this.scaledW + paddingW + traySpace));
        } else {
            reqH = Math.max(reqH, Math.floor(this.scaledH + paddingH + traySpace));
        }

        this.logicalW = reqW;
        this.logicalH = reqH;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = reqW * dpr;
        this.canvas.height = reqH * dpr;
        this.canvas.style.width = `${reqW}px`;
        this.canvas.style.height = `${reqH}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (this.isLandscapeMode) {
            this.imageOffsetX = paddingW; // Pin to left edge, leaving right area strictly for the tray
            this.imageOffsetY = (this.logicalH - this.scaledH) / 2;
        } else {
            this.imageOffsetX = (this.logicalW - this.scaledW) / 2;
            this.imageOffsetY = paddingH; // Pin to top to leave bottom area strictly for the tray
        }

        // Create an offscreen canvas containing the scaled image
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = this.scaledW;
        scaledCanvas.height = this.scaledH;
        const sCtx = scaledCanvas.getContext('2d');
        sCtx.drawImage(this.image, 0, 0, this.scaledW, this.scaledH);

        // Overwrite this.image with the scaled version for generating pieces
        const scaledImg = new Image();
        scaledImg.onload = () => {
            this.image = scaledImg;
            this.createPieces();
        };
        scaledImg.src = scaledCanvas.toDataURL();
    }

    createPieces() {
        const pWidth = this.scaledW / this.gridCols;
        const pHeight = this.scaledH / this.gridRows;

        // Generate tab configurations
        const horizontalTabs = []; // row-major, size: gridRows * (gridCols+1)
        const verticalTabs = [];   // row-major, size: (gridRows+1) * gridCols

        for (let y = 0; y <= this.gridRows; y++) {
            if (!horizontalTabs[y]) horizontalTabs[y] = [];
            for (let x = 0; x <= this.gridCols; x++) {
                horizontalTabs[y][x] = Math.random() > 0.5 ? 1 : -1;
            }
        }

        for (let x = 0; x <= this.gridCols; x++) {
            if (!verticalTabs[x]) verticalTabs[x] = [];
            for (let y = 0; y <= this.gridRows; y++) {
                verticalTabs[x][y] = Math.random() > 0.5 ? 1 : -1;
            }
        }

        for (let y = 0; y < this.gridRows; y++) {
            for (let x = 0; x < this.gridCols; x++) {
                const tabTypes = {
                    top: y === 0 ? 0 : horizontalTabs[y][x],
                    right: x === this.gridCols - 1 ? 0 : verticalTabs[x + 1][y],
                    bottom: y === this.gridRows - 1 ? 0 : -horizontalTabs[y + 1][x],
                    left: x === 0 ? 0 : -verticalTabs[x][y]
                };

                this.pieces.push(new PuzzlePiece(this, x, y, pWidth, pHeight, tabTypes));
            }
        }

        // Shuffle the pieces array so they spawn completely randomly instead of row-by-row
        for (let i = this.pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pieces[i], this.pieces[j]] = [this.pieces[j], this.pieces[i]];
        }

        this.pieces.forEach(p => p.isVisible = false);

        // Initialize active pool mechanic (Tray)
        let piecesToShow = Math.min(this.maxVisiblePieces, this.pieces.length);
        for(let i=0; i<piecesToShow; i++) {
            this.spawnPieceInTray(this.pieces[i]);
        }

        this.animLoop();
    }

    spawnPieceInTray(p) {
        if (this.isLandscapeMode) {
            // Landscape: Tray is on the right side of the puzzle board
            const puzzleRight = this.imageOffsetX + this.scaledW;
            const trayXStart = puzzleRight + 30; // 30px gap
            
            // Spawn vertically within the puzzle's height
            const spawnAreaY = Math.max(this.scaledH - (p.height * 2), 50);

            p.currentX = trayXStart + (Math.random() * 60); // Horizontal jitter
            p.currentY = this.imageOffsetY + (Math.random() * spawnAreaY);
        } else {
            // Portrait: Tray is at the bottom of the puzzle board
            const puzzleBottom = this.imageOffsetY + this.scaledH;
            const trayYStart = puzzleBottom + 30; // 30px gap
            
            // Spawn horizontally within the puzzle's width
            const spawnAreaX = Math.max(this.scaledW - (p.width * 2), 50);
            
            p.currentX = this.imageOffsetX + (Math.random() * spawnAreaX);
            p.currentY = trayYStart + (Math.random() * 60); // Vertical jitter
        }
        
        p.isVisible = true;
    }

    refreshTray() {
        if (!this.pieces || this.pieces.length === 0) return;

        let visibleUnlocked = this.pieces.filter(p => !p.isLocked && p.isVisible);
        let hiddenUnlocked = this.pieces.filter(p => !p.isLocked && !p.isVisible);
        
        if (hiddenUnlocked.length === 0) return; // No hidden pieces left to swap with

        // Hide current visible pieces
        visibleUnlocked.forEach(p => p.isVisible = false);

        // Pool all remaining unlocked pieces
        let availablePool = [...hiddenUnlocked, ...visibleUnlocked];
        
        // Shuffle the pool using Fisher-Yates
        for (let i = availablePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
        }

        // Pick top N pieces to show
        let numToShow = Math.min(this.maxVisiblePieces, availablePool.length);
        for(let i = 0; i < numToShow; i++) {
            this.spawnPieceInTray(availablePool[i]);
        }
        
        this.playSnapSound(); // Nice pop sound for feedback
        this.draw();
    }

    updateProgress() {
        document.getElementById('placed-count').textContent = this.placedCount;
        document.getElementById('total-count').textContent = this.totalCount;
        if (this.placedCount === this.totalCount && this.totalCount > 0) {

            if (this.timerInterval) clearInterval(this.timerInterval);
            const timeStr = this.updateTimerDisplay();

            // Save best time logic
            let bestKey = 'bestTime_' + (this.isThirukkuralMode ? 'thirukkural_' : 'custom_') + this.gridSize;
            let bestStr = localStorage.getItem(bestKey);
            let bestTime = bestStr ? parseInt(bestStr) : null;

            if (!bestTime || this.elapsedTime < bestTime) {
                bestTime = this.elapsedTime;
                localStorage.setItem(bestKey, bestTime.toString());
            }

            const bm = Math.floor(bestTime / 60).toString().padStart(2, '0');
            const bs = (bestTime % 60).toString().padStart(2, '0');

            if (this.winTime) this.winTime.textContent = timeStr;
            if (this.winBestTime) this.winBestTime.textContent = `${bm}:${bs}`;

            if (this.winTimeout) clearTimeout(this.winTimeout);
            this.winTimeout = setTimeout(() => {
                this.winOverlay.classList.remove('hidden');
            }, 500);
        }
    }

    animLoop() {
        this.draw();
        // Since we only need to redraw on interaction, we don't strict loop RequestAnimationFrame
        // unless adding continuous animations.
    }

    initAudio() {
        if (!this.audioCtx) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext();
            } catch (e) {
                console.warn("Web Audio API not supported", e);
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        this.audioUnlocked = true;
    }

    playSnapSound() {
        if (!this.audioCtx) return;
        
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            
            // A short, pleasant "wooden tap" or "bubble pop" sound
            osc.type = 'sine';
            const startTime = this.audioCtx.currentTime;
            
            // Pitch sweep dropping fast gives a percussive 'chunk' or 'pop' and feels physical
            osc.frequency.setValueAtTime(400, startTime);
            osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.05);
            
            // Envelope
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
            
            osc.start(startTime);
            osc.stop(startTime + 0.1);
        } catch(e) {
            console.warn("Audio playback failed", e);
        }
    }

    triggerSnapEffect(piece) {
        this.snapEffects.push({
            x: piece.currentX + (piece.width / 2),
            y: piece.currentY + (piece.height / 2),
            radius: Math.min(piece.width, piece.height) * 0.2,
            maxRadius: Math.max(piece.width, piece.height) * 0.8,
            alpha: 1.0,
            piece: piece
        });
        
        if (!this.isAnimatingEffects) {
            this.isAnimatingEffects = true;
            this.effectsLoop();
        }
    }

    effectsLoop() {
        if (!this.snapEffects || this.snapEffects.length === 0) {
            this.isAnimatingEffects = false;
            this.draw(); // Final clean draw
            return;
        }

        this.draw(); // Draw standard board

        this.ctx.save();
        for (let i = this.snapEffects.length - 1; i >= 0; i--) {
            let effect = this.snapEffects[i];
            
            // Draw piece flash
            this.ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha * 0.5})`;
            this.ctx.fillRect(effect.piece.currentX, effect.piece.currentY, effect.piece.width, effect.piece.height);
            
            // Draw expanding ripple
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${effect.alpha})`;
            this.ctx.lineWidth = 4 + (effect.alpha * 4);
            this.ctx.stroke();

            // Animate properties
            effect.radius += 8; // Expand rate
            effect.alpha -= 0.05; // Fade rate

            if (effect.alpha <= 0) {
                this.snapEffects.splice(i, 1);
            }
        }
        this.ctx.restore();

        requestAnimationFrame(() => this.effectsLoop());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.logicalW, this.logicalH);

        // Draw the background placeholder outline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.imageOffsetX, this.imageOffsetY, this.scaledW, this.scaledH);

        // Draw locked pieces first (bottom layer)
        this.pieces.filter(p => p.isLocked).forEach(p => p.draw(this.ctx));

        if (this.isPeeking && this.image) {
            // Draw the hint image over the locked pieces, hide the clutter
            this.ctx.globalAlpha = 0.4;
            this.ctx.drawImage(this.image, this.imageOffsetX, this.imageOffsetY, this.scaledW, this.scaledH);
            this.ctx.globalAlpha = 1.0;
        } else {
            if (this.isGridVisible) {
                // Draw puzzle piece outlines as a guide map
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.lineWidth = 1.5;
                this.pieces.forEach(p => {
                    this.ctx.save();
                    this.ctx.translate(p.correctX, p.correctY);
                    this.ctx.beginPath();
                    p.buildPath(this.ctx, 0, 0, p.width, p.height);
                    this.ctx.stroke();
                    this.ctx.restore();
                });
            }

            // Draw unlocked pieces
            this.pieces.filter(p => !p.isLocked && p !== this.draggedPiece && p.isVisible).forEach(p => p.draw(this.ctx));

            // Draw dragged piece on top
            if (this.draggedPiece) {
                this.draggedPiece.draw(this.ctx);
            }
        }
    }

    handlePointerDown(e) {
        if (this.isPeeking) return;
        // Hide the Win UI automatically if the player taps the board to explore!
        if (this.placedCount === this.totalCount) {
            this.winOverlay.classList.add('hidden');
        }

        const rect = this.canvas.getBoundingClientRect();

        // Transform CSS display pixels into raw internal Canvas texture pixels
        const scaleX = this.logicalW / rect.width;
        const scaleY = this.logicalH / rect.height;

        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;

        // Find topmost unlocked piece under pointer
        const unlocked = this.pieces.filter(p => !p.isLocked && p.isVisible);
        for (let i = unlocked.length - 1; i >= 0; i--) {
            const p = unlocked[i];
            if (p.containsPoint(px, py)) {
                this.draggedPiece = p;
                this.dragOffsetX = px - p.currentX;
                this.dragOffsetY = py - p.currentY;
                // Move piece to end of array to draw top
                const idx = this.pieces.indexOf(p);
                this.pieces.splice(idx, 1);
                this.pieces.push(p);
                this.draw();
                return;
            }
        }

        // No piece hit! Ignite custom camera panning engine!
        const container = document.getElementById('canvas-container');
        this.isPanning = true;
        this.panStartX = e.clientX;
        this.panStartY = e.clientY;
        this.initialScrollLeft = container.scrollLeft;
        this.initialScrollTop = container.scrollTop;
    }

    handlePointerMove(e) {
        if (this.isPanning) {
            const container = document.getElementById('canvas-container');
            container.scrollLeft = this.initialScrollLeft - (e.clientX - this.panStartX);
            container.scrollTop = this.initialScrollTop - (e.clientY - this.panStartY);
            return;
        }

        if (!this.draggedPiece) return;

        e.preventDefault(); // Prevent scrolling on touch devices while dragging
        const rect = this.canvas.getBoundingClientRect();

        const scaleX = this.logicalW / rect.width;
        const scaleY = this.logicalH / rect.height;

        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;

        let targetX = px - this.dragOffsetX;
        let targetY = py - this.dragOffsetY;

        // Strict constraints to prevent dragging off canvas entirely
        // Padding preserves grab-ability
        const pPadding = Math.min(this.draggedPiece.width, this.draggedPiece.height) * 0.4;
        targetX = Math.max(-pPadding, Math.min(targetX, this.logicalW - this.draggedPiece.width + pPadding));
        targetY = Math.max(-pPadding, Math.min(targetY, this.logicalH - this.draggedPiece.height + pPadding));

        this.draggedPiece.currentX = targetX;
        this.draggedPiece.currentY = targetY;

        this.draw();
    }

    handlePointerUp(e) {
        this.isPanning = false;

        if (!this.draggedPiece) return;

        const p = this.draggedPiece;
        const snapThreshold = Math.min(p.width, p.height) * 0.3; // Responsive snap threshold

        const dx = p.currentX - p.correctX;
        const dy = p.currentY - p.correctY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < snapThreshold) {
            p.currentX = p.correctX;
            p.currentY = p.correctY;
            p.isLocked = true;
            this.placedCount++;
            this.updateProgress();

            this.playSnapSound();
            this.triggerSnapEffect(p);

            // Pop new hidden piece into visibility to maintain tray count
            const hiddenPiece = this.pieces.find(piece => !piece.isLocked && !piece.isVisible);
            if (hiddenPiece) {
                this.spawnPieceInTray(hiddenPiece);
            }
        }

        this.draggedPiece = null;
        this.draw();
    }
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    window.game = new JigsawGame();
});
