# petrinet-studio

A high-fidelity, Figma-inspired infinite canvas playground for **Petri Net** modeling and real-time simulation. Designed with a fusion of **Swiss International Style** and **Riso-Graph Editorial Aesthetics**, `petrinet-studio` provides a surgical, distraction-free environment for systems architecture and logical design.

![PetriNet Studio Interface](https://raw.githubusercontent.com/thealihamza04/petrinet-studio/master/public/favicon.svg) *<!-- Replace with a real screenshot if available -->*

## 🧘 Zen-Mode Modeling
The studio is built for focus. By removing legacy UI clutter, it provides a "Zen-mode" environment where systems logic takes center stage on a boundless 12-column grid.

## ✨ Key Features
- **Figma-Style Infinite Canvas**: Fluidly navigate a boundless workspace with high-performance panning, zooming, and marquee selection.
- **Real-Time Simulation Engine**: Execute system dynamics instantly. Watch tokens flow through transitions with surgical visual feedback.
- **System Clipboard**: Professional-grade Pattern scaling with `[Ctrl+C/X/V]` support, featuring intelligent ID re-mapping and connectivity persistence.
- **Architectural Smart Guides**: High-contrast alignment lines that automatically snap nodes horizontally and vertically for professional symmetry.
- **Automated Persistence**: Never lose a state. The engine silently archives your architecture in the background with real-time auto-save.
- **Blueprint Cursors**: Context-aware SVG cursors that reflect the current drafting mode (Place, Transition, Arc, Token).

## ⌨️ Interaction Controls
Designed for high-velocity drafting, the workstation is purely keyboard-driven:

| Key | Action |
| :--- | :--- |
| **[V] / [Esc]** | Select Mode (Marquee & Drag) |
| **[P] / [O]** | Place Tool |
| **[T] / [R]** | Transition Tool |
| **[A] / [L]** | Link (Arc) Tool |
| **[K]** | Token Tool (Click to add, [Ctrl+Click] to subtract) |
| **[H]** | Hand (Pan) Tool |
| **[Del] / [BS]** | Delete Selection |
| **[Ctrl+C/X/V]** | Copy / Cut / Paste |

## 🎨 Design Philosophy
`petrinet-studio` is a state-of-the-art implementation of the **Riso-Swiss** aesthetic:
- **Swiss International Style**: Strict mathematical grids, massive bold headers, and elegant visual hierarchy.
- **Riso-Graph Texture**: A high-contrast palette of **Riso Pink (#ff4f9a)** and **Deep Blue (#006c84)** over a warm paper texture with subtle digital grain.
- **Typography**: Neo-Grotesque (**Inter**) for technical data and elegant serifs (**Playfair Display**) for artistic emphasis.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/thealihamza04/petrinet-studio.git

# Navigate to the directory
cd petrinet-studio

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🏗️ Tech Stack
- **Framework**: [Qwik](https://qwik.builder.io/) (Resumable Full-stack Web Framework)
- **Runtime**: [Vite](https://vitejs.dev/)
- **Engine**: Pure HTML5 Canvas API with a custom reactive state-machine.
- **Styling**: Vanilla CSS with Riso-Swiss design tokens.

---

Designed for architects of logic. Built with the soul of a high-end design studio.
