# Chemistry Structural Formula Editor

An intuitive web-based application for creating, editing, and exporting chemistry structural formula diagrams. Perfect for creating molecular structures that can be directly copied and pasted into Microsoft Word, PowerPoint, or any other application.

![Chemistry Editor Screenshot](https://github.com/user-attachments/assets/2a8a6700-ac46-4b6d-8ce6-88227221b7f4)

## Features

### Comprehensive Drawing Tools
- **Atom Placement**: Add common chemical elements (C, H, O, N, S, P, F, Cl, Br, I)
- **Multiple Bond Types**: 
  - Single bonds
  - Double bonds
  - Triple bonds
  - Wedge bonds (stereochemistry - pointing up)
  - Dash bonds (stereochemistry - pointing down)
- **Functional Groups**: Quick-add common groups
  - Hydroxyl (-OH)
  - Amino (-NH2)
  - Carboxyl (-COOH)
  - Aldehyde (-CHO)
  - Methyl (-CH3)
  - Nitro (-NO2)
- **Templates**: Quickly add common ring structures
  - Benzene ring
  - Cyclohexane
  - Cyclopentane

### Editing Capabilities
- **Select and Move**: Drag atoms to reposition them (bonds automatically adjust)
- **Delete**: Remove atoms or bonds with a click
- **Undo/Redo**: Full history support with Ctrl+Z and Ctrl+Y
- **Zoom**: Zoom in/out for detailed work or overview
- **Visual Feedback**: Hover highlights and status indicators

### Export Options
- **Copy PNG to Clipboard**: Copy diagrams as transparent PNG images for pasting into Word, PowerPoint, etc.
- **Copy Text**: Copy the molecular formula as plain text
- **Download PNG**: Save diagrams as high-quality transparent PNG files
- **Word Optimized**: Transparent background for seamless document integration

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| A | Atom tool |
| B | Bond tool |
| V | Select tool |
| D | Delete tool |
| 1-3 | Bond type (single/double/triple) |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+C | Copy to clipboard |
| Del | Delete hovered element |
| +/- | Zoom in/out |

## How to Use

### Getting Started
1. Open `index.html` in any modern web browser
2. Start drawing your molecular structure

### Creating Molecules

#### Adding Atoms
1. Click the **Atom** tool (or press A)
2. Choose an element from the Atoms section (C, H, O, N, etc.)
3. Click on the canvas where you want to place the atom

#### Adding Bonds
1. Click the **Bond** tool (or press B)
2. Select a bond type (single, double, triple, wedge, or dash)
3. Click on the first atom
4. Click on the second atom to create the bond

#### Using Templates
1. Click on a template button (Benzene, Cyclohexane, or Cyclopentane)
2. The ring structure will be added to the center of the canvas

#### Adding Functional Groups
1. Click on a functional group button (-OH, -NH2, -COOH, etc.)
2. Click on any atom to attach the functional group

#### Moving Atoms
1. Click the **Select** tool (or press V)
2. Drag any atom to a new position
3. Connected bonds will automatically follow

#### Deleting
1. Click the **Delete** tool (or press D)
2. Click on atoms or bonds to remove them

### Exporting Your Work

#### Copy PNG to Clipboard (Recommended for Word)
1. Click the **Copy PNG** button (or press Ctrl+C)
2. Paste (Ctrl+V / Cmd+V) directly into Word, PowerPoint, or any other application
3. The image will have a transparent background for clean integration

#### Copy Molecular Formula as Text
1. Click the **Copy Text** button
2. The molecular formula (e.g., C6H6) will be copied to your clipboard

#### Download as PNG
1. Click the **Download PNG** button
2. Save the file to your computer (filename includes the molecular formula)
3. Insert the image into your documents as needed

## Browser Compatibility

Works with all modern browsers:
- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)
- Opera (v76+)

## Technical Details

- **Pure HTML/CSS/JavaScript**: No external dependencies required
- **Canvas-based rendering**: Smooth, high-quality graphics
- **Dark theme UI**: Modern glassmorphism design
- **Responsive design**: Works on desktop and tablet devices
- **Color-coded atoms**: Standard CPK coloring scheme
  - Carbon (C): Black
  - Hydrogen (H): Gray
  - Oxygen (O): Red
  - Nitrogen (N): Blue
  - Sulfur (S): Yellow
  - Phosphorus (P): Orange
  - Halogens (F, Cl, Br, I): Green/Purple/Brown

## Use Cases

Perfect for:
- Students creating chemistry assignments
- Teachers preparing educational materials
- Researchers documenting molecular structures
- Anyone needing structural formulas in documents

## License

This project is open source and available for educational and personal use.

## Credits

Created for easy structural formula diagram creation with direct copy-paste functionality for document integration.
