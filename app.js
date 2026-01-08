// Chemistry Structural Formula Editor
// Main application logic

class ChemistryEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Data structures
        this.atoms = [];
        this.bonds = [];
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // State
        this.currentTool = 'atom';
        this.currentAtom = 'C';
        this.currentBondType = 'single';
        this.selectedAtom = null;
        this.bondStartAtom = null;
        this.draggedAtom = null;
        this.hoveredAtom = null;
        
        // Zoom settings
        this.zoomLevel = 1;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        this.zoomStep = 0.1;
        
        // Settings
        this.atomRadius = 20;
        this.bondLength = 60;
        this.fontSize = 16;
        this.snapBonds = false; // Bond snapping mode
        this.snapAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]; // Snap to these angles in degrees
        
        this.initializeEventListeners();
        this.saveState(); // Save initial state
        this.render();
    }
    
    initializeEventListeners() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                this.updateStatus(`Tool: ${this.currentTool}`);
            });
        });
        
        // Atom buttons
        document.querySelectorAll('.atom-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.atom-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentAtom = btn.dataset.atom;
                this.currentTool = 'atom';
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('[data-tool="atom"]').classList.add('active');
                this.updateStatus(`Selected atom: ${this.currentAtom}`);
            });
        });
        
        // Bond type buttons
        document.querySelectorAll('.bond-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.bond-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentBondType = btn.dataset.bondType;
                this.currentTool = 'bond';
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('[data-tool="bond"]').classList.add('active');
                this.updateStatus(`Bond type: ${this.currentBondType}`);
            });
        });
        
        // Functional group buttons
        document.querySelectorAll('.fg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = btn.dataset.group;
                this.currentTool = 'functional-group';
                this.currentFunctionalGroup = group;
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                this.updateStatus(`Click an atom to attach ${group}`);
            });
        });
        
        // Template buttons
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const template = btn.dataset.template;
                this.addTemplate(template);
            });
        });
        
        // Action buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('copyTextBtn').addEventListener('click', () => this.copyAsText());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
        
        // Undo/Redo buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        
        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoomResetBtn').addEventListener('click', () => this.zoomReset());
        
        // Snap bonds toggle
        document.getElementById('snapBondsToggle').addEventListener('change', (e) => {
            this.snapBonds = e.target.checked;
            this.updateStatus(this.snapBonds ? 'Bond snapping enabled' : 'Bond snapping disabled');
        });
        
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    handleKeyDown(e) {
        // Don't trigger shortcuts when typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Ctrl/Cmd shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'c':
                    if (this.atoms.length > 0) {
                        e.preventDefault();
                        this.copyToClipboard();
                    }
                    break;
            }
            return;
        }
        
        // Tool shortcuts
        switch (e.key.toLowerCase()) {
            case 'a':
                this.selectTool('atom');
                break;
            case 'b':
                this.selectTool('bond');
                break;
            case 'v':
                this.selectTool('select');
                break;
            case 'd':
                this.selectTool('delete');
                break;
            case '1':
                this.selectBondType('single');
                break;
            case '2':
                this.selectBondType('double');
                break;
            case '3':
                this.selectBondType('triple');
                break;
            case 'delete':
            case 'backspace':
                if (this.hoveredAtom) {
                    e.preventDefault();
                    this.deleteAtomAt(this.hoveredAtom.x, this.hoveredAtom.y);
                }
                break;
            case '+':
            case '=':
                this.zoomIn();
                break;
            case '-':
                this.zoomOut();
                break;
        }
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`[data-tool="${tool}"]`);
        if (btn) btn.classList.add('active');
        this.updateStatus(`Tool: ${tool}`);
    }
    
    selectBondType(type) {
        this.currentBondType = type;
        this.currentTool = 'bond';
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tool="bond"]').classList.add('active');
        document.querySelectorAll('.bond-type-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`[data-bond-type="${type}"]`);
        if (btn) btn.classList.add('active');
        this.updateStatus(`Bond type: ${type}`);
    }
    
    // History management
    saveState() {
        // Remove any future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Save current state
        const state = {
            atoms: JSON.parse(JSON.stringify(this.atoms)),
            bonds: JSON.parse(JSON.stringify(this.bonds))
        };
        
        this.history.push(state);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateHistoryButtons();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.updateStatus('Undo');
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.updateStatus('Redo');
        }
    }
    
    restoreState(state) {
        this.atoms = JSON.parse(JSON.stringify(state.atoms));
        this.bonds = JSON.parse(JSON.stringify(state.bonds));
        this.updateHistoryButtons();
        this.render();
    }
    
    updateHistoryButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    // Zoom functions
    zoomIn() {
        if (this.zoomLevel < this.maxZoom) {
            this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
            this.updateZoomDisplay();
            this.render();
        }
    }
    
    zoomOut() {
        if (this.zoomLevel > this.minZoom) {
            this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
            this.updateZoomDisplay();
            this.render();
        }
    }
    
    zoomReset() {
        this.zoomLevel = 1;
        this.updateZoomDisplay();
        this.render();
    }
    
    updateZoomDisplay() {
        document.getElementById('zoomLevel').textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
    
    handleWheel(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        }
    }
    
    // Template functions
    addTemplate(template) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 80;
        
        let sides;
        let hasDoubleBonds = false;
        
        switch (template) {
            case 'benzene':
                sides = 6;
                hasDoubleBonds = true;
                break;
            case 'cyclohexane':
                sides = 6;
                break;
            case 'cyclopentane':
                sides = 5;
                break;
            default:
                return;
        }
        
        const startIndex = this.atoms.length;
        const angleOffset = -Math.PI / 2; // Start from top
        
        // Add atoms
        for (let i = 0; i < sides; i++) {
            const angle = angleOffset + (2 * Math.PI * i) / sides;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.atoms.push({
                x: x,
                y: y,
                element: 'C',
                id: startIndex + i
            });
        }
        
        // Add bonds
        for (let i = 0; i < sides; i++) {
            const nextI = (i + 1) % sides;
            const bondType = (hasDoubleBonds && i % 2 === 0) ? 'double' : 'single';
            this.bonds.push({
                atom1: startIndex + i,
                atom2: startIndex + nextI,
                type: bondType
            });
        }
        
        this.saveState();
        this.render();
        this.updateStatus(`Added ${template} template`);
        this.showNotification(`${template.charAt(0).toUpperCase() + template.slice(1)} added!`);
    }
    
    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoomLevel,
            y: (e.clientY - rect.top) / this.zoomLevel
        };
    }
    
    findAtomAt(x, y) {
        return this.atoms.find(atom => {
            const dx = atom.x - x;
            const dy = atom.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= this.atomRadius;
        });
    }
    
    findBondAt(x, y) {
        return this.bonds.find(bond => {
            const atom1 = this.atoms[bond.atom1];
            const atom2 = this.atoms[bond.atom2];
            
            // Calculate distance from point to line segment
            const A = x - atom1.x;
            const B = y - atom1.y;
            const C = atom2.x - atom1.x;
            const D = atom2.y - atom1.y;
            
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            
            if (lenSq !== 0) param = dot / lenSq;
            
            let xx, yy;
            
            if (param < 0) {
                xx = atom1.x;
                yy = atom1.y;
            } else if (param > 1) {
                xx = atom2.x;
                yy = atom2.y;
            } else {
                xx = atom1.x + param * C;
                yy = atom1.y + param * D;
            }
            
            const dx = x - xx;
            const dy = y - yy;
            return Math.sqrt(dx * dx + dy * dy) <= 8;
        });
    }
    
    handleCanvasClick(e) {
        const coords = this.getCanvasCoords(e);
        
        switch (this.currentTool) {
            case 'atom':
                this.addAtom(coords.x, coords.y);
                break;
            case 'bond':
                this.handleBondClick(coords.x, coords.y);
                break;
            case 'delete':
                this.handleDelete(coords.x, coords.y);
                break;
            case 'functional-group':
                this.handleFunctionalGroup(coords.x, coords.y);
                break;
        }
    }
    
    // Snap position to angles when bond snapping is enabled
    snapPosition(fromAtom, toX, toY) {
        if (!this.snapBonds || !fromAtom) {
            return { x: toX, y: toY };
        }
        
        // Calculate angle from fromAtom to target position
        const dx = toX - fromAtom.x;
        const dy = toY - fromAtom.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            return { x: toX, y: toY }; // Too close, don't snap
        }
        
        // Calculate angle in degrees
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Find nearest snap angle
        let nearestAngle = this.snapAngles[0];
        let minDiff = Math.abs(angle - nearestAngle);
        
        for (let snapAngle of this.snapAngles) {
            const diff = Math.abs(angle - snapAngle);
            if (diff < minDiff) {
                minDiff = diff;
                nearestAngle = snapAngle;
            }
        }
        
        // Convert back to radians and calculate new position
        const radians = nearestAngle * Math.PI / 180;
        return {
            x: fromAtom.x + distance * Math.cos(radians),
            y: fromAtom.y + distance * Math.sin(radians)
        };
    }
    
    handleMouseMove(e) {
        const coords = this.getCanvasCoords(e);
        document.getElementById('coordsDisplay').textContent = `X: ${Math.round(coords.x)}, Y: ${Math.round(coords.y)}`;
        
        // Update hovered atom
        this.hoveredAtom = this.findAtomAt(coords.x, coords.y);
        
        // Handle dragging
        if (this.draggedAtom && this.currentTool === 'select') {
            // Find if this atom is connected to any other atoms for snapping
            let snapReference = null;
            if (this.snapBonds) {
                // Find a connected atom to use as reference for snapping
                const connectedBond = this.bonds.find(b => 
                    b.atom1 === this.draggedAtom.id || b.atom2 === this.draggedAtom.id
                );
                if (connectedBond) {
                    const otherAtomId = connectedBond.atom1 === this.draggedAtom.id ? 
                        connectedBond.atom2 : connectedBond.atom1;
                    snapReference = this.atoms[otherAtomId];
                }
            }
            
            const snappedPos = this.snapPosition(snapReference, coords.x, coords.y);
            this.draggedAtom.x = snappedPos.x;
            this.draggedAtom.y = snappedPos.y;
            this.render();
        }
        
        this.render();
    }
    
    handleMouseDown(e) {
        if (this.currentTool === 'select') {
            const coords = this.getCanvasCoords(e);
            this.draggedAtom = this.findAtomAt(coords.x, coords.y);
        }
    }
    
    handleMouseUp(e) {
        if (this.draggedAtom) {
            this.saveState();
        }
        this.draggedAtom = null;
    }
    
    addAtom(x, y, element = null, skipSave = false) {
        const atom = {
            x: x,
            y: y,
            element: element || this.currentAtom,
            id: this.atoms.length
        };
        this.atoms.push(atom);
        if (!skipSave) {
            this.saveState();
        }
        this.render();
        this.updateStatus(`Added ${atom.element} atom`);
    }
    
    handleBondClick(x, y) {
        const clickedAtom = this.findAtomAt(x, y);
        
        if (!clickedAtom) {
            this.bondStartAtom = null;
            this.updateStatus('Click on an atom to start a bond');
            return;
        }
        
        if (!this.bondStartAtom) {
            this.bondStartAtom = clickedAtom;
            this.updateStatus('Click on another atom to complete the bond');
        } else {
            if (this.bondStartAtom.id !== clickedAtom.id) {
                // Check if bond already exists
                const bondExists = this.bonds.some(b => 
                    (b.atom1 === this.bondStartAtom.id && b.atom2 === clickedAtom.id) ||
                    (b.atom2 === this.bondStartAtom.id && b.atom1 === clickedAtom.id)
                );
                
                if (!bondExists) {
                    this.bonds.push({
                        atom1: this.bondStartAtom.id,
                        atom2: clickedAtom.id,
                        type: this.currentBondType
                    });
                    this.saveState();
                    this.updateStatus('Bond created');
                } else {
                    this.updateStatus('Bond already exists');
                }
            }
            this.bondStartAtom = null;
            this.render();
        }
    }
    
    handleDelete(x, y) {
        this.deleteAtomAt(x, y);
    }
    
    deleteAtomAt(x, y) {
        // Try to delete atom
        const atomIndex = this.atoms.findIndex(atom => {
            const dx = atom.x - x;
            const dy = atom.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= this.atomRadius;
        });
        
        if (atomIndex !== -1) {
            // Remove bonds connected to this atom
            this.bonds = this.bonds.filter(bond => 
                bond.atom1 !== atomIndex && bond.atom2 !== atomIndex
            );
            
            // Update bond indices
            this.bonds.forEach(bond => {
                if (bond.atom1 > atomIndex) bond.atom1--;
                if (bond.atom2 > atomIndex) bond.atom2--;
            });
            
            // Remove atom
            this.atoms.splice(atomIndex, 1);
            
            // Update atom IDs
            this.atoms.forEach((atom, index) => {
                atom.id = index;
            });
            
            this.saveState();
            this.render();
            this.updateStatus('Atom deleted');
            return;
        }
        
        // Try to delete bond
        const bondIndex = this.bonds.findIndex(bond => {
            const atom1 = this.atoms[bond.atom1];
            const atom2 = this.atoms[bond.atom2];
            
            const A = x - atom1.x;
            const B = y - atom1.y;
            const C = atom2.x - atom1.x;
            const D = atom2.y - atom1.y;
            
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            
            if (lenSq !== 0) param = dot / lenSq;
            
            let xx, yy;
            
            if (param < 0) {
                xx = atom1.x;
                yy = atom1.y;
            } else if (param > 1) {
                xx = atom2.x;
                yy = atom2.y;
            } else {
                xx = atom1.x + param * C;
                yy = atom1.y + param * D;
            }
            
            const dx = x - xx;
            const dy = y - yy;
            return Math.sqrt(dx * dx + dy * dy) <= 8;
        });
        
        if (bondIndex !== -1) {
            this.bonds.splice(bondIndex, 1);
            this.saveState();
            this.render();
            this.updateStatus('Bond deleted');
        }
    }
    
    handleFunctionalGroup(x, y) {
        const clickedAtom = this.findAtomAt(x, y);
        
        if (!clickedAtom) {
            this.updateStatus('Click on an atom to attach functional group');
            return;
        }
        
        const group = this.currentFunctionalGroup;
        let atomsToAdd = [];
        let bondsToAdd = [];
        
        // Calculate position offset
        const angle = Math.PI / 4; // 45 degrees
        const distance = this.bondLength;
        
        switch (group) {
            case 'OH':
                atomsToAdd = [
                    { element: 'O', offsetX: distance * Math.cos(angle), offsetY: -distance * Math.sin(angle) },
                    { element: 'H', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) }
                ];
                break;
            case 'NH2':
                atomsToAdd = [
                    { element: 'N', offsetX: distance * Math.cos(angle), offsetY: -distance * Math.sin(angle) },
                    { element: 'H', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 0.5 },
                    { element: 'H', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 1.5 }
                ];
                break;
            case 'COOH':
                atomsToAdd = [
                    { element: 'C', offsetX: distance * Math.cos(angle), offsetY: -distance * Math.sin(angle) },
                    { element: 'O', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 1.7 },
                    { element: 'O', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 0.3 },
                    { element: 'H', offsetX: distance * Math.cos(angle) * 2, offsetY: -distance * Math.sin(angle) * 0.3 }
                ];
                break;
            case 'CHO':
                atomsToAdd = [
                    { element: 'C', offsetX: distance * Math.cos(angle), offsetY: -distance * Math.sin(angle) },
                    { element: 'O', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 1.5 },
                    { element: 'H', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 0.5 }
                ];
                break;
            case 'CH3':
                atomsToAdd = [
                    { element: 'C', offsetX: distance * Math.cos(angle), offsetY: -distance * Math.sin(angle) },
                    { element: 'H', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 1.7 },
                    { element: 'H', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) },
                    { element: 'H', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 0.3 }
                ];
                break;
            case 'NO2':
                atomsToAdd = [
                    { element: 'N', offsetX: distance * Math.cos(angle), offsetY: -distance * Math.sin(angle) },
                    { element: 'O', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 1.5 },
                    { element: 'O', offsetX: distance * Math.cos(angle) * 1.5, offsetY: -distance * Math.sin(angle) * 0.5 }
                ];
                break;
        }
        
        // Add atoms and bonds
        const startIndex = this.atoms.length;
        atomsToAdd.forEach((atomData, i) => {
            this.addAtom(
                clickedAtom.x + atomData.offsetX,
                clickedAtom.y + atomData.offsetY,
                atomData.element
            );
            
            if (i === 0) {
                // First atom connects to clicked atom
                this.bonds.push({
                    atom1: clickedAtom.id,
                    atom2: startIndex + i,
                    type: 'single'
                });
            }
        });
        
        // Add internal bonds for functional groups
        if (group === 'OH' || group === 'NH2') {
            if (atomsToAdd.length > 1) {
                this.bonds.push({
                    atom1: startIndex,
                    atom2: startIndex + 1,
                    type: 'single'
                });
            }
            if (group === 'NH2' && atomsToAdd.length > 2) {
                this.bonds.push({
                    atom1: startIndex,
                    atom2: startIndex + 2,
                    type: 'single'
                });
            }
        } else if (group === 'COOH') {
            this.bonds.push({
                atom1: startIndex,
                atom2: startIndex + 1,
                type: 'double'
            });
            this.bonds.push({
                atom1: startIndex,
                atom2: startIndex + 2,
                type: 'single'
            });
            this.bonds.push({
                atom1: startIndex + 2,
                atom2: startIndex + 3,
                type: 'single'
            });
        } else if (group === 'CHO') {
            this.bonds.push({
                atom1: startIndex,
                atom2: startIndex + 1,
                type: 'double'
            });
            this.bonds.push({
                atom1: startIndex,
                atom2: startIndex + 2,
                type: 'single'
            });
        } else if (group === 'CH3') {
            for (let i = 1; i < atomsToAdd.length; i++) {
                this.bonds.push({
                    atom1: startIndex,
                    atom2: startIndex + i,
                    type: 'single'
                });
            }
        } else if (group === 'NO2') {
            this.bonds.push({
                atom1: startIndex,
                atom2: startIndex + 1,
                type: 'double'
            });
            this.bonds.push({
                atom1: startIndex,
                atom2: startIndex + 2,
                type: 'single'
            });
        }
        
        this.updateStatus(`Added ${group} group`);
        this.saveState();
        this.currentTool = 'atom';
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tool="atom"]').classList.add('active');
    }
    
    clearAll() {
        // Check if there's content to clear
        const hasContent = this.atoms.length > 0 || this.bonds.length > 0;
        // Use native confirm for simplicity - could be replaced with custom modal in future
        const shouldClear = !hasContent || confirm('Are you sure you want to clear all atoms and bonds?');
        if (shouldClear) {
            this.atoms = [];
            this.bonds = [];
            this.saveState();
            this.render();
            this.updateStatus('Canvas cleared');
            if (hasContent) {
                this.showNotification('Canvas cleared successfully!');
            }
        }
    }
    
    // Generate molecular formula from atoms
    getMolecularFormula() {
        if (this.atoms.length === 0) return '';
        
        // Count atoms by element
        const counts = {};
        this.atoms.forEach(atom => {
            counts[atom.element] = (counts[atom.element] || 0) + 1;
        });
        
        // Standard order: C, H, then alphabetical
        const order = ['C', 'H'];
        const otherElements = Object.keys(counts)
            .filter(el => !order.includes(el))
            .sort();
        
        const orderedElements = [...order.filter(el => counts[el]), ...otherElements];
        
        // Build formula string
        let formula = '';
        orderedElements.forEach(element => {
            const count = counts[element];
            if (count > 0) {
                formula += element;
                if (count > 1) {
                    formula += count;
                }
            }
        });
        
        return formula;
    }
    
    // Copy molecular formula as text
    async copyAsText() {
        const formula = this.getMolecularFormula();
        
        if (!formula) {
            this.showNotification('No molecules to copy', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(formula);
            this.showNotification(`Copied: ${formula}`);
            this.updateStatus(`Copied formula: ${formula}`);
        } catch (err) {
            this.showNotification('Failed to copy text', 'error');
            console.error('Copy text failed:', err);
        }
    }
    
    // Calculate the bounds of the actual content
    getContentBounds() {
        if (this.atoms.length === 0) {
            return { minX: 0, minY: 0, maxX: this.canvas.width, maxY: this.canvas.height };
        }
        
        const padding = 40; // Add some padding around the content
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.atoms.forEach(atom => {
            minX = Math.min(minX, atom.x - this.atomRadius);
            minY = Math.min(minY, atom.y - this.atomRadius);
            maxX = Math.max(maxX, atom.x + this.atomRadius);
            maxY = Math.max(maxY, atom.y + this.atomRadius);
        });
        
        return {
            minX: Math.max(0, minX - padding),
            minY: Math.max(0, minY - padding),
            maxX: Math.min(this.canvas.width, maxX + padding),
            maxY: Math.min(this.canvas.height, maxY + padding)
        };
    }
    
    async copyToClipboard() {
        // Check for Clipboard API support
        if (!navigator.clipboard || !navigator.clipboard.write) {
            this.showNotification('Clipboard API not supported. Please use Download PNG instead.', 'error');
            this.updateStatus('Clipboard not supported - use Download');
            return;
        }
        
        if (this.atoms.length === 0) {
            this.showNotification('Nothing to copy. Add some atoms first.', 'error');
            return;
        }
        
        try {
            // Get content bounds
            const bounds = this.getContentBounds();
            const width = bounds.maxX - bounds.minX;
            const height = bounds.maxY - bounds.minY;
            
            // Create a temporary canvas with size matching content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Translate context to account for offset
            tempCtx.translate(-bounds.minX, -bounds.minY);
            
            // Draw content without background (transparent)
            this.renderToContext(tempCtx, true);
            
            const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));
            if (!blob) {
                throw new Error('Failed to create image blob');
            }
            
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            this.showNotification('Transparent PNG copied! Paste into Word, PowerPoint, etc.');
            this.updateStatus('Image copied to clipboard');
        } catch (err) {
            // Provide helpful error messages based on the error type
            let errorMessage = 'Failed to copy image. ';
            if (err.name === 'NotAllowedError') {
                errorMessage += 'Please ensure the page has clipboard permissions.';
            } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                errorMessage += 'Clipboard access requires HTTPS. Please use Download PNG instead.';
            } else {
                errorMessage += 'Please use Download PNG instead.';
            }
            this.showNotification(errorMessage, 'error');
            this.updateStatus('Copy failed - use Download');
            console.error('Copy failed:', err);
        }
    }
    
    downloadImage() {
        if (this.atoms.length === 0) {
            this.showNotification('Nothing to download. Add some atoms first.', 'error');
            return;
        }
        
        // Get content bounds
        const bounds = this.getContentBounds();
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        
        // Create a temporary canvas with size matching content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Translate context to account for offset
        tempCtx.translate(-bounds.minX, -bounds.minY);
        
        // Draw content without background (transparent)
        this.renderToContext(tempCtx, true);
        
        const link = document.createElement('a');
        const formula = this.getMolecularFormula();
        link.download = formula ? `${formula}-structure.png` : 'structural-formula.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
        this.updateStatus('Image downloaded');
        this.showNotification('Transparent PNG downloaded!');
    }
    
    // Render to a specific context (used for export with transparent background)
    renderToContext(ctx, transparent = false) {
        // Clear canvas (transparent or white)
        if (!transparent) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        } else {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        // Draw bonds
        this.bonds.forEach(bond => {
            this.drawBondToContext(ctx, bond);
        });
        
        // Draw atoms
        this.atoms.forEach(atom => {
            this.drawAtomToContext(ctx, atom, false);
        });
    }
    
    drawAtomToContext(ctx, atom, isHovered = false) {
        ctx.save();
        
        const isText = this.isTextElement(atom.element);
        
        // Highlight if hovered (only for main canvas)
        if (isHovered) {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
            ctx.beginPath();
            ctx.arc(atom.x, atom.y, this.atomRadius + 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (isText) {
            // For text elements, just draw the text without a circle
            ctx.fillStyle = '#333333';
            ctx.font = `bold ${this.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(atom.element, atom.x, atom.y);
        } else {
            // Draw atom circle
            ctx.fillStyle = this.getAtomColor(atom.element);
            ctx.beginPath();
            ctx.arc(atom.x, atom.y, this.atomRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = this.darkenColor(this.getAtomColor(atom.element));
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw element symbol
            ctx.fillStyle = 'white';
            ctx.font = `bold ${this.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(atom.element, atom.x, atom.y);
        }
        
        ctx.restore();
    }
    
    drawBondToContext(ctx, bond) {
        const atom1 = this.atoms[bond.atom1];
        const atom2 = this.atoms[bond.atom2];
        
        if (!atom1 || !atom2) return;
        
        ctx.save();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Calculate shortened bond endpoints
        const dx = atom2.x - atom1.x;
        const dy = atom2.y - atom1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const ratio = this.atomRadius / distance;
        
        const x1 = atom1.x + dx * ratio;
        const y1 = atom1.y + dy * ratio;
        const x2 = atom2.x - dx * ratio;
        const y2 = atom2.y - dy * ratio;
        
        switch (bond.type) {
            case 'single':
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                break;
                
            case 'double':
                const perpX = -dy / distance * 3;
                const perpY = dx / distance * 3;
                
                ctx.beginPath();
                ctx.moveTo(x1 + perpX, y1 + perpY);
                ctx.lineTo(x2 + perpX, y2 + perpY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x1 - perpX, y1 - perpY);
                ctx.lineTo(x2 - perpX, y2 - perpY);
                ctx.stroke();
                break;
                
            case 'triple':
                const perpX3 = -dy / distance * 5;
                const perpY3 = dx / distance * 5;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x1 + perpX3, y1 + perpY3);
                ctx.lineTo(x2 + perpX3, y2 + perpY3);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x1 - perpX3, y1 - perpY3);
                ctx.lineTo(x2 - perpX3, y2 - perpY3);
                ctx.stroke();
                break;
                
            case 'wedge':
                ctx.fillStyle = '#333';
                ctx.beginPath();
                
                const perpXw = -dy / distance * 5;
                const perpYw = dx / distance * 5;
                
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2 + perpXw, y2 + perpYw);
                ctx.lineTo(x2 - perpXw, y2 - perpYw);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'dash':
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
        }
        
        ctx.restore();
    }
    
    updateStatus(message) {
        document.getElementById('statusDisplay').textContent = message;
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(400px)';
            notification.style.transition = 'all 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill with white background for editing view
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom for all content including grid
        this.ctx.save();
        this.ctx.scale(this.zoomLevel, this.zoomLevel);
        
        // Draw grid (subtle) - now inside zoom context
        this.drawGrid();
        
        // Draw bonds
        this.bonds.forEach(bond => {
            this.drawBond(bond);
        });
        
        // Draw atoms
        this.atoms.forEach(atom => {
            this.drawAtom(atom, atom === this.hoveredAtom);
        });
        
        // Draw bond preview
        if (this.bondStartAtom && this.currentTool === 'bond') {
            this.ctx.save();
            this.ctx.strokeStyle = '#6366f1';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.bondStartAtom.x, this.bondStartAtom.y);
            
            // Draw to hovered atom or mouse position
            if (this.hoveredAtom && this.hoveredAtom !== this.bondStartAtom) {
                this.ctx.lineTo(this.hoveredAtom.x, this.hoveredAtom.y);
            }
            
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    drawGrid() {
        const gridSize = 50;
        this.ctx.save();
        this.ctx.strokeStyle = '#e8e8e8';
        this.ctx.lineWidth = 0.5 / this.zoomLevel; // Maintain consistent line width when zoomed
        
        // Calculate grid extent based on canvas size and zoom
        const width = this.canvas.width / this.zoomLevel;
        const height = this.canvas.height / this.zoomLevel;
        
        // Vertical lines
        for (let x = 0; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawAtom(atom, isHovered = false) {
        this.ctx.save();
        
        const isText = this.isTextElement(atom.element);
        
        // Highlight if hovered - use accent color for dark theme
        if (isHovered) {
            this.ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
            this.ctx.beginPath();
            this.ctx.arc(atom.x, atom.y, this.atomRadius + 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect
            this.ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
            this.ctx.shadowBlur = 15;
        }
        
        if (isText) {
            // For text elements, just draw the text without a circle
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            
            this.ctx.fillStyle = '#333333';
            this.ctx.font = `bold ${this.fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(atom.element, atom.x, atom.y);
        } else {
            // Draw atom circle
            this.ctx.fillStyle = this.getAtomColor(atom.element);
            this.ctx.beginPath();
            this.ctx.arc(atom.x, atom.y, this.atomRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Reset shadow for border
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            
            // Draw border
            this.ctx.strokeStyle = this.darkenColor(this.getAtomColor(atom.element));
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw element symbol
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${this.fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(atom.element, atom.x, atom.y);
        }
        
        this.ctx.restore();
    }
    
    drawBond(bond) {
        const atom1 = this.atoms[bond.atom1];
        const atom2 = this.atoms[bond.atom2];
        
        if (!atom1 || !atom2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        // Calculate shortened bond endpoints (don't overlap atom circles)
        const dx = atom2.x - atom1.x;
        const dy = atom2.y - atom1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const ratio = this.atomRadius / distance;
        
        const x1 = atom1.x + dx * ratio;
        const y1 = atom1.y + dy * ratio;
        const x2 = atom2.x - dx * ratio;
        const y2 = atom2.y - dy * ratio;
        
        switch (bond.type) {
            case 'single':
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
                break;
                
            case 'double':
                const perpX = -dy / distance * 3;
                const perpY = dx / distance * 3;
                
                this.ctx.beginPath();
                this.ctx.moveTo(x1 + perpX, y1 + perpY);
                this.ctx.lineTo(x2 + perpX, y2 + perpY);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(x1 - perpX, y1 - perpY);
                this.ctx.lineTo(x2 - perpX, y2 - perpY);
                this.ctx.stroke();
                break;
                
            case 'triple':
                const perpX3 = -dy / distance * 5;
                const perpY3 = dx / distance * 5;
                
                // Center line
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
                
                // Top line
                this.ctx.beginPath();
                this.ctx.moveTo(x1 + perpX3, y1 + perpY3);
                this.ctx.lineTo(x2 + perpX3, y2 + perpY3);
                this.ctx.stroke();
                
                // Bottom line
                this.ctx.beginPath();
                this.ctx.moveTo(x1 - perpX3, y1 - perpY3);
                this.ctx.lineTo(x2 - perpX3, y2 - perpY3);
                this.ctx.stroke();
                break;
                
            case 'wedge':
                this.ctx.fillStyle = '#333';
                this.ctx.beginPath();
                
                const perpXw = -dy / distance * 5;
                const perpYw = dx / distance * 5;
                
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2 + perpXw, y2 + perpYw);
                this.ctx.lineTo(x2 - perpXw, y2 - perpYw);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'dash':
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                break;
        }
        
        this.ctx.restore();
    }
    
    getAtomColor(element) {
        const colors = {
            'C': '#333333',
            'H': '#AAAAAA',
            'O': '#FF0000',
            'N': '#0000FF',
            'S': '#FFFF00',
            'P': '#FFA500',
            'F': '#00FF00',
            'Cl': '#00FF00',
            'Br': '#A52A2A',
            'I': '#800080'
        };
        return colors[element] || '#888888';
    }
    
    isTextElement(element) {
        // Check if element is a number or period
        return /^[0-9.]$/.test(element);
    }
    
    darkenColor(color) {
        // Handle hex colors for atom borders - all colors from getAtomColor are hex
        if (!color || !color.startsWith('#')) {
            return '#000000'; // Fallback to black
        }
        
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        
        // Check if the parse was successful
        if (isNaN(num)) {
            return '#000000'; // Fallback to black
        }
        
        const r = Math.max(0, ((num >> 16) & 255) - 40);
        const g = Math.max(0, ((num >> 8) & 255) - 40);
        const b = Math.max(0, (num & 255) - 40);
        return `rgb(${r},${g},${b})`;
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const editor = new ChemistryEditor();
});
