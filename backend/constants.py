SHEET_SIZES = [
    {"id": "a4", "name": "A4", "width": 210, "height": 297},
    {"id": "a3", "name": "A3", "width": 297, "height": 420},
    {"id": "a2", "name": "A2", "width": 420, "height": 594},
    {"id": "a1", "name": "A1", "width": 594, "height": 841},
    {"id": "a0", "name": "A0", "width": 841, "height": 1189},
    {"id": "letter", "name": "Letter", "width": 215.9, "height": 279.4},
    {"id": "legal", "name": "Legal", "width": 215.9, "height": 355.6},
    {"id": "tabloid", "name": "Tabloid", "width": 279.4, "height": 431.8},
    {"id": "custom", "name": "Custom", "width": 0, "height": 0},
]

# Default paper types and binding options can be added here or loaded from a database
DEFAULT_PAPER_TYPES = [
    {"id": "offset-80", "name": "Offset 80 GSM", "costPerSheet": 0.5},
    {"id": "art-100", "name": "Art Paper 100 GSM", "costPerSheet": 0.75},
    {"id": "art-130", "name": "Art Paper 130 GSM", "costPerSheet": 1.0},
    {"id": "art-170", "name": "Art Paper 170 GSM", "costPerSheet": 1.25},
]

DEFAULT_BINDING_OPTIONS = [
    {"id": "saddle-stitch", "name": "Saddle Stitch", "baseCost": 100, "perUnitCost": 1},
    {"id": "perfect", "name": "Perfect Binding", "baseCost": 250, "perUnitCost": 2},
    {"id": "spiral", "name": "Spiral Binding", "baseCost": 150, "perUnitCost": 1.5},
]

DEFAULT_LAMINATION_COSTS = {
    "matt": 0.25,
    "gloss": 0.35,
    "thermal-matt": 0.65,
    "thermal-gloss": 0.65,
}
