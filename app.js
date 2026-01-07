// Chemistry Structural Formula Editor
// Main application logic

class ChemistryEditor {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Data structures
        this.atoms = [];
        this.bonds = [];
        
        // State
        this.currentTool = 'atom';
        this.currentAtom = 'C';
        this.currentBondType = 'single';
        this.selectedAtom = null;
        this.bondStartAtom = null;
        this.draggedAtom = null;
        this.hoveredAtom = null;
        
        // Settings
        this.atomRadius = 20;
        this.bondLength = 60;
        this.fontSize = 16;
        
        this.initializeEventListeners();
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
        
        // Action buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
        
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
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
    
    handleMouseMove(e) {
        const coords = this.getCanvasCoords(e);
        document.getElementById('coordsDisplay').textContent = `X: ${Math.round(coords.x)}, Y: ${Math.round(coords.y)}`;
        
        // Update hovered atom
        this.hoveredAtom = this.findAtomAt(coords.x, coords.y);
        
        // Handle dragging
        if (this.draggedAtom && this.currentTool === 'select') {
            this.draggedAtom.x = coords.x;
            this.draggedAtom.y = coords.y;
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
        this.draggedAtom = null;
    }
    
    addAtom(x, y, element = null) {
        const atom = {
            x: x,
            y: y,
            element: element || this.currentAtom,
            id: this.atoms.length
        };
        this.atoms.push(atom);
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
        this.currentTool = 'atom';
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-tool="atom"]').classList.add('active');
    }
    
    clearAll() {
        if (confirm('Are you sure you want to clear all atoms and bonds?')) {
            this.atoms = [];
            this.bonds = [];
            this.render();
            this.updateStatus('Canvas cleared');
        }
    }
    
    async copyToClipboard() {
        try {
            const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            this.showNotification('Image copied to clipboard! You can now paste it into Word, PowerPoint, etc.');
            this.updateStatus('Image copied to clipboard');
        } catch (err) {
            this.showNotification('Failed to copy image. Please use Download instead.', 'error');
            console.error('Copy failed:', err);
        }
    }
    
    downloadImage() {
        const link = document.createElement('a');
        link.download = 'structural-formula.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        this.updateStatus('Image downloaded');
        this.showNotification('Image downloaded successfully!');
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
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (subtle)
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
            this.ctx.strokeStyle = '#667eea';
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
    }
    
    drawGrid() {
        const gridSize = 50;
        this.ctx.save();
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawAtom(atom, isHovered = false) {
        this.ctx.save();
        
        // Highlight if hovered
        if (isHovered) {
            this.ctx.fillStyle = '#fff3cd';
            this.ctx.beginPath();
            this.ctx.arc(atom.x, atom.y, this.atomRadius + 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw atom circle
        this.ctx.fillStyle = this.getAtomColor(atom.element);
        this.ctx.beginPath();
        this.ctx.arc(atom.x, atom.y, this.atomRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
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
    
    darkenColor(color) {
        // Simple color darkening for borders
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
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
