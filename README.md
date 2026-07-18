# <img src="./public/logo.svg" width="48" height="48" align="center" /> KAIROS — Premium SOTA Task Manager

> **Kairos (Ancient Greek: καιρός)**: *The perfect, delicate, crucial moment; the opportune time.*

KAIROS is a high-performance, premium, neobrutalist browser extension built to conquer your task list cleanly. It operates entirely as an overlay panel that works **anywhere, anytime** in your browser using a global keyboard shortcut, keeping your flow state completely uninterrupted.

---

## ✦ Core Features

- **Anywhere, Anytime Access**: Open it instantly on any tab, settings panel, or browser system page via global hotkey (`Alt+Shift+Y` or `Ctrl+Shift+Y`).
- **Zero Page Intrusion**: Renders inside a native browser action popup bubble to eliminate host page CSS conflicts or injection warnings.
- **Elite Neobrutalist SOTA UI/UX**: Designed around high-contrast flat layout elements, heavy solid shadows, bold borders, and vibrant color blocks (Primary Red, Secondary Yellow, Accent Blue).
- **Full CRUD Management**: Seamlessly add, edit, sort, and complete tasks with category domains and priority levels.
- **Smart Progress Statistics**: Clean visual summary showing the exact progress of your daily task completion.
- **Keyboard-First Hotkeys**: Fully navigate the interface without touching your mouse.
- **Robust Storage Sync**: Synchronizes state instantly with `chrome.storage.local` with local storage fallbacks.

---

## ⌨ Keyboard Commands

| Action | Shortcut (Outside) | Hotkey (Inside KAIROS) |
| :--- | :--- | :--- |
| **Open/Hide Panel** | `Alt` + `Shift` + `Y` *(Mac: `Ctrl` + `Shift` + `Y`)* | `Esc` |
| **Summon New Task** | — | `N` |
| **Focus Search Bar** | — | `/` |
| **Toggle Light/Dark Theme** | — | `T` |

---

## 🎨 Design System Variables

KAIROS runs on a custom SOTA neobrutalist styling layer powered by **Tailwind CSS v4**.

```css
:root {
  --primary: rgb(255, 51, 51);      /* Bold Crimson */
  --secondary: rgb(255, 255, 0);    /* Vibrant Gold */
  --accent: rgb(0, 102, 255);       /* Royal Blue */
  --background: rgb(255, 255, 255); /* Obsidian Dark / Clean White */
  --border: rgb(0, 0, 0);           /* Solid Outline */
  --radius: 0px;                    /* Block Corners */
  --shadow: 4px 4px 0px 0px #000;   /* Flat Drop Shadow */
}
```

---

## ⚙ Installation & Setup

1. Clone or download this repository.
2. Build the production package:
   ```bash
   npm run build
   ```
3. Open your browser and navigate to `chrome://extensions` or `brave://extensions`.
4. Toggle **Developer mode** in the top-right corner.
5. Click **Load unpacked** in the top-left corner.
6. Select the compiled `dist/` directory inside this repository.
7. Pin **KAIROS** to your extension toolbar, press your shortcut, and command your time.
