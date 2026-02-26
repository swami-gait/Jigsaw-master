# Jigsaw Master

A fully-featured, elegant HTML5 Canvas jigsaw puzzle application. It offers a premium, modern design, dynamic drag-and-drop piece snapping algorithms (with realistic interlocking paths), and a dedicated Thirukkural mode that dynamically generates Tamil text onto elegant puzzle backgrounds.

Built natively for the web and pre-configured to build for Android via Ionic Capacitor.

### ✨ Features
- **Premium Aesthetics**: Sleek dark-mode interface with glassmorphism elements, minimal typography, and smooth CSS animations.
- **Custom Image Parsing**: Users can upload any photo and it instantly processes into a perfectly scaled, playable jigsaw board.
- **Built-in Mode**: Instantly jump into a puzzle by choosing from built-in standard image grids (e.g., Puppy, Lion Cub).
- **Thirukkural Feature**: A specialized mode that dynamically constructs a high-resolution artistic canvas (1800x1200) embedding a random classical Tamil Kural right onto the pieces without wrapping or shape truncation.
- **Dynamic Difficulty**: Granular slider scaling from Beginner (3x3) all the way up to Legendary (30x30).
- **Printable PDF Export**: Allows users to click 'Export' and download a true-to-scale A4 PDF of their current puzzle, complete with overlaid bezier cut-lines for physical scissor printing.
- **Ghost Peek System**: A Hint mechanism. You can press the 'Eye' button to momentarily hide all unassembled pieces and overlay a ghosted reference image of the solved puzzle upon the locked pieces.
- **Game Medallions**: Time tracking and local-storage mechanics to save your fastest solves dynamically depending on mode and grid counts.

### 🚀 Running Locally (Web)
Because this is built with pure Vanilla HTML, CSS, and JS, no complex web-serving backend is needed.

1. Clone the repository.
2. Navigate to the project root containing the `src/` folder.
3. Serve the directory locally (e.g., using Node's serve module):
   ```bash
   npx serve src -p 8080
   ```
4. Visit `http://localhost:8080` in your web browser.

### 📱 Running Locally (Android Studio)
This project is mapped and synced to a native Android Capacitor wrapper. To run the app on an Android device:

1. Clone the repository.
2. Open Android Studio.
3. Go to **File -> Open**, and point explicitly to the `/android` directory inside the repository.
4. Let Gradle sync naturally.
5. Create a new Virtual Emulator running Android API 34+ (or connect a physical device via USB Debugging).
6. Press the **Play/Run** button at the top toolbar.

To compile a deployable app package for Google Play, use the menu option: `Build > Generate Signed Bundle / APK`.
