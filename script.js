// ============================================================
// MASTER DATA - OFFSET PRINTING COSTS (INDUSTRY STANDARD)
// ============================================================
const offsetCosts = {
    plateCostPerPlate: 1200,
    printingCostPer1000: 45,
    offsetInkCostPerKg: 250,
    paperCosts: {
        60: 0.35,
        80: 0.50,
        100: 0.70,
        150: 1.20,
        180: 1.40,
        250: 2.00,
        300: 2.60
    },
    finishingCosts: {
        saddle: 2.50,
        perfect: 5.00,
        spiral: 8.00
    },
    laminationCosts: {
        gloss: 1.50,
        matte: 1.50
    },
    coverCosts: {
        cardboard: 3.00,
        hardcover: 12.00,
        thick: 8.00,
        thin: 2.00
    }
};

// ============================================================
// MASTER DATA - FLEXOGRAPHY PACKAGING COSTS
// ============================================================
const flexoCosts = {
    plateCost: 1800,
    inkCosts: {
        water: 200,
        solvent: 300,
        uv: 500
    },
    lpiMultipliers: {
        low: 1.2,
        mid: 1.0,
        high: 0.9
    },
    cellVolumeMultipliers: {
        low: 0.8,
        mid: 1.0,
        high: 1.2
    },
    engravingTypeMultipliers: {
        mechanical: 1.0,
        laser: 1.5
    }
};

// ============================================================
// MASTER DATA - GRAVURE PACKAGING COSTS
// ============================================================
const gravureCosts = {
    cylinderCosts: {
        electromechanical: 4000,
        laser: 7000
    }
};

// ============================================================
// SUBSTRATE COSTS
// ============================================================
const substrateCosts = {
    aluminum: 25,
    paperboard: 8,
    cardboard: 6,
    plastic: 15
};

// ============================================================
// PAPER SIZE AREAS (in mm²)
// ============================================================
const paperSizeAreas = {
    a1: 499554,
    a2: 249480,
    a3: 124740,
    a4: 62370,
    a5: 31080,
    a6: 15540
};

function getSelectedPaperAreaInMm2(paperSize) {
    if (paperSize === 'custom') {
        const customPaperWidth = parseFloat(document.getElementById('customPaperWidth')?.value);
        const customPaperHeight = parseFloat(document.getElementById('customPaperHeight')?.value);

        if (!Number.isFinite(customPaperWidth) || !Number.isFinite(customPaperHeight) || customPaperWidth <= 0 || customPaperHeight <= 0) {
            throw new Error('Please enter valid custom paper width and height in mm');
        }

        return customPaperWidth * customPaperHeight;
    }

    if (!(paperSize in paperSizeAreas)) {
        throw new Error('Please select a valid paper size');
    }

    return paperSizeAreas[paperSize];
}

// ============================================================
// SUBSTRATE SIZE CALCULATION
// ============================================================
function calculateSubstrateArea(sizeString) {
    if (!sizeString) return 10000;
    const parts = sizeString.split('x');
    if (parts.length === 2) {
        const length = parseFloat(parts[0]);
        const width = parseFloat(parts[1]);
        return (length * width) / 10000;
    }
    return 100;
}

// ============================================================
// PRINTING COST CALCULATION
// ============================================================
function calculatePrintingCost() {
    const errorElement = document.getElementById('printingError');
    errorElement.classList.remove('show');

    try {
        // Get form inputs
        const productType = document.getElementById('productType').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const numPages = parseInt(document.getElementById('numPages').value);
        const printProcess = document.getElementById('printProcess').value;

        if (!productType || !printProcess || quantity <= 0 || numPages <= 0) {
            throw new Error('Please fill in all required fields');
        }

        if (printProcess === 'offset') {
            calculateOffsetPrintingCost(quantity, numPages);
        } else if (printProcess === 'digital') {
            throw new Error('Digital printing calculation not yet implemented');
        } else {
            throw new Error('Invalid printing process selected');
        }

    } catch (error) {
        errorElement.textContent = '❌ ' + error.message;
        errorElement.classList.add('show');
    }
}

// ============================================================
// OFFSET PRINTING DETAILED CALCULATION
// ============================================================
function calculateOffsetPrintingCost(quantity, numPages) {
    const paperSize = document.getElementById('paperSize').value;
    const paperType = document.getElementById('paperType').value;
    const paperGSM = parseInt(document.getElementById('paperGSM').value);
    const printingSide = document.querySelector('input[name="printSide"]:checked').value;
    const colorMode = document.getElementById('colorMode').value;
    const offsetInkType = document.getElementById('offsetInkType')?.value;

    if (!paperSize || !paperType || !paperGSM || !colorMode || !offsetInkType) {
        throw new Error('Please fill in all Offset-specific required fields');
    }

    const breakdown = {};

    // Determine number of colors
    let numColors = 1;
    if (colorMode === '2color') numColors = 2;
    else if (colorMode === 'cmyk') numColors = 4;

    // 1. PREPRESS COST (Design + Setup)
    breakdown['Prepress Cost'] = 500;

    // 2. PLATE MAKING COST
    // Formula: (No. formes × Colors) × Plate Rate
    breakdown['Plate Making Cost'] = offsetCosts.plateCostPerPlate * numColors;

    // 3. PRINTING COST (Impressions)
    // Formula: (Q / 1000) × Colors × Rate per 1000
    let printingSides = 1;
    if (printingSide === 'double') printingSides = 2;
    
    const impressionCost = (quantity / 1000) * numColors * offsetCosts.printingCostPer1000 * printingSides * numPages;
    breakdown['Printing Cost'] = impressionCost;

    // 4. SHEET COST (Paper)
    // Formula: W = (L × W / 10000) × (GSM / 1000) × Q × (1 + Wastage)
    const areaPerPage = getSelectedPaperAreaInMm2(paperSize);
    const areaRatioVsA4 = areaPerPage / paperSizeAreas.a4;
    const costPerSheet = offsetCosts.paperCosts[paperGSM];
    const wastagePercentage = 0.05; // 5% wastage
    const totalSheets = ((quantity * numPages) / 2) * (1 + wastagePercentage);
    breakdown['Sheet Cost'] = totalSheets * costPerSheet * areaRatioVsA4;

    // 5. NUMBER OF SHEETS USED
    breakdown['Number of Sheets Used'] = Math.ceil(totalSheets);

    // 6. POST PRESS / FINISHING COST
    let finishingCost = 0;

    // Binding costs
    if (document.getElementById('bindingSaddle') && document.getElementById('bindingSaddle').checked) {
        finishingCost += quantity * offsetCosts.finishingCosts.saddle;
    }
    if (document.getElementById('bindingPerfect') && document.getElementById('bindingPerfect').checked) {
        finishingCost += quantity * offsetCosts.finishingCosts.perfect;
    }
    if (document.getElementById('bindingSpiral') && document.getElementById('bindingSpiral').checked) {
        finishingCost += quantity * offsetCosts.finishingCosts.spiral;
    }

    // Lamination costs
    const laminationType = document.querySelector('input[name="lamination"]:checked').value;
    if (laminationType !== 'none' && laminationType in offsetCosts.laminationCosts) {
        finishingCost += quantity * offsetCosts.laminationCosts[laminationType];
    }

    // Cover costs
    const coverType = document.getElementById('coverType').value;
    if (coverType !== 'none' && coverType in offsetCosts.coverCosts) {
        finishingCost += quantity * offsetCosts.coverCosts[coverType];
    }

    breakdown['Post Press / Finishing Cost'] = finishingCost;

    // 7. FINISHING COST (Additional)
    breakdown['Finishing Cost'] = finishingCost * 0.1;

    // 8. WASTE COST (5% of production cost)
    const productionCost = impressionCost + breakdown['Sheet Cost'];
    breakdown['Waste Cost'] = productionCost * 0.05;

    // Calculate totals
    const totalCost = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const costPerUnit = totalCost / quantity;

    // Display results
    displayOffsetResults(breakdown, totalCost, costPerUnit, quantity);
}

// ============================================================
// DISPLAY OFFSET PRINTING RESULTS
// ============================================================
function displayOffsetResults(breakdown, totalCost, costPerUnit, quantity) {
    document.getElementById('printingTotalCost').textContent = '₹' + totalCost.toFixed(2);
    document.getElementById('printingCostPerUnit').textContent = 'Cost per Unit: ₹' + costPerUnit.toFixed(2);

    // Populate breakdown table
    const tbody = document.getElementById('printingBreakdownTable');
    tbody.innerHTML = '';

    Object.entries(breakdown).forEach(([category, amount]) => {
        const percentage = (amount / totalCost) * 100;
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="label-col">${category}</td>
            <td class="amount-col">₹${amount.toFixed(2)}</td>
            <td class="percent-col">${percentage.toFixed(1)}%</td>
        `;
        tbody.appendChild(row);
    });

    // Add grand total row
    const totalRow = document.createElement('tr');
    totalRow.classList.add('total-row');
    totalRow.innerHTML = `
        <td class="label-col">Grand Total</td>
        <td class="amount-col">₹${totalCost.toFixed(2)}</td>
        <td class="percent-col">100%</td>
    `;
    tbody.appendChild(totalRow);

    document.getElementById('printingResults').classList.add('show');
}

// ============================================================
// UPDATE PRINTING PROCESS FIELDS
// ============================================================
function updateProcessFields() {
    const process = document.getElementById('printProcess').value;
    const offsetFields = document.getElementById('offsetFields');

    if (process === 'offset') {
        offsetFields.classList.remove('hidden');
    } else {
        offsetFields.classList.add('hidden');
    }

    updatePaperSizeFields();
}

function updatePaperSizeFields() {
    const paperSizeSelect = document.getElementById('paperSize');
    const customPaperSizeFields = document.getElementById('customPaperSizeFields');
    const customPaperWidth = document.getElementById('customPaperWidth');
    const customPaperHeight = document.getElementById('customPaperHeight');

    if (!paperSizeSelect || !customPaperSizeFields || !customPaperWidth || !customPaperHeight) return;

    const isCustomSize = paperSizeSelect.value === 'custom';
    customPaperSizeFields.style.display = isCustomSize ? 'grid' : 'none';
    customPaperWidth.required = isCustomSize;
    customPaperHeight.required = isCustomSize;

    if (!isCustomSize) {
        customPaperWidth.value = '';
        customPaperHeight.value = '';
    }
}

// ============================================================
// UPDATE SUBSTRATE BASIS FIELD (GSM / THICKNESS)
// ============================================================
function updateSubstrateBasisField() {
    const substrateTypeElement = document.getElementById('substrateType');
    const label = document.getElementById('substrateBasisLabel');
    const gsmInput = document.getElementById('substrateGSM');
    const thicknessSelect = document.getElementById('substrateThickness');

    if (!substrateTypeElement || !label || !gsmInput || !thicknessSelect) return;

    const substrateType = substrateTypeElement.value;
    const foilThicknessOptions = {
        aluminum: [15, 20],
        plastic: [10]
    };

    if (foilThicknessOptions[substrateType]) {
        label.textContent = 'Substrate Thickness (Microns) *';
        gsmInput.style.display = 'none';
        gsmInput.required = false;
        thicknessSelect.style.display = 'block';
        thicknessSelect.required = true;
        thicknessSelect.innerHTML = '<option value="">Select Thickness (microns)</option>' +
            foilThicknessOptions[substrateType]
                .map((value) => `<option value="${value}">${value}</option>`)
                .join('');
        thicknessSelect.value = String(foilThicknessOptions[substrateType][0]);
    } else {
        label.textContent = 'Substrate GSM (Weight) *';
        thicknessSelect.style.display = 'none';
        thicknessSelect.required = false;
        thicknessSelect.innerHTML = '<option value="">Select Thickness (microns)</option>';
        gsmInput.style.display = 'block';
        gsmInput.required = true;
    }
}

function getSubstrateBasisValue() {
    const substrateTypeElement = document.getElementById('substrateType');
    const gsmInput = document.getElementById('substrateGSM');
    const thicknessSelect = document.getElementById('substrateThickness');

    if (!substrateTypeElement || !gsmInput) return NaN;

    const substrateType = substrateTypeElement.value;
    if ((substrateType === 'aluminum' || substrateType === 'plastic') && thicknessSelect) {
        return parseFloat(thicknessSelect.value);
    }

    return parseFloat(gsmInput.value);
}

// ============================================================
// PACKAGING COST CALCULATION
// ============================================================
function calculatePackagingCost() {
    const errorElement = document.getElementById('packagingError');
    errorElement.classList.remove('show');

    try {
        // Get form inputs
        const substrateType = document.getElementById('substrateType').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const packagingProcess = document.getElementById('packagingProcess').value;
        const substrateBasisValue = getSubstrateBasisValue();

        if (!substrateType || !packagingProcess || quantity <= 0 || !Number.isFinite(substrateBasisValue) || substrateBasisValue <= 0) {
            throw new Error('Please fill in all required fields');
        }

        if (packagingProcess === 'flexography') {
            calculateFlexoPackagingCost(substrateType, quantity);
        } else if (packagingProcess === 'gravure') {
            calculateGravurePackagingCost(substrateType, quantity);
        } else {
            throw new Error('Invalid packaging process selected');
        }

    } catch (error) {
        errorElement.textContent = '❌ ' + error.message;
        errorElement.classList.add('show');
    }
}

// ============================================================
// FLEXOGRAPHY PACKAGING COST CALCULATION
// ============================================================
function calculateFlexoPackagingCost(substrateType, quantity) {
    const substrateGSM = getSubstrateBasisValue();
    const flatSize = document.getElementById('flatSize').value;
    const numColors = parseInt(document.getElementById('numColors').value);
    const aniloxLPI = document.getElementById('flexoAniloxLPI').value;
    const cellVolume = document.getElementById('flexoCellVolume').value;
    const inkType = document.getElementById('flexoInkType').value;
    const transferEfficiency = parseFloat(document.getElementById('flexoTransferEfficiency').value) / 100;

    if (!aniloxLPI || !cellVolume || !inkType) {
        throw new Error('Please fill in all Flexography-specific required fields');
    }

    const breakdown = {};

    // Calculate substrate area
    const areaPerUnit = calculateSubstrateArea(flatSize);

    // 1. SUBSTRATE / MATERIAL COST
    // Formula: W = (L × W / 10000) × (GSM / 1000) × Q × (1 + Wastage)
    const wastagePercentage = 0.08; // 8% wastage
    const substrateCostPerSqm = substrateCosts[substrateType];
    const materialWeight = (areaPerUnit * (substrateGSM / 1000) * quantity * (1 + wastagePercentage));
    const materialCost = materialWeight * (substrateCostPerSqm / 1000);
    breakdown['Substrate / Material Cost'] = materialCost;

    // 2. PLATE COST
    const plateCost = flexoCosts.plateCost * numColors;
    breakdown['Plate Setup Cost'] = plateCost;

    // 3. INK COST
    // Formula: I = (Area × BCM × Coverage% × Transfer Efficiency) / 3548380
    const inkCostPerKg = flexoCosts.inkCosts[inkType];
    const bcmMultiplier = flexoCosts.cellVolumeMultipliers[cellVolume];
    const lpiMultiplier = flexoCosts.lpiMultipliers[aniloxLPI];
    const coverage = 0.7; // 70% coverage assumption
    const inkWeight = (areaPerUnit * bcmMultiplier * coverage * transferEfficiency * numColors) / 3548380;
    const inkCost = inkWeight * inkCostPerKg;
    breakdown['Ink Cost'] = inkCost;

    // 4. ANILOX ROLLER & ENGRAVING COST
    const engravingType = document.getElementById('flexoEngravingType').value;
    const engravingMultiplier = flexoCosts.engravingTypeMultipliers[engravingType];
    breakdown['Anilox & Engraving Cost'] = 300 * numColors * engravingMultiplier * lpiMultiplier;

    // 5. TOOLING COSTS
    const steelRuleDieCost = parseFloat(document.getElementById('steelRuleDieCost').value) || 0;
    const embossingBlockCost = parseFloat(document.getElementById('embossingBlockCost').value) || 0;
    const spotUVPlateCost = parseFloat(document.getElementById('spotUVPlateCost').value) || 0;
    const totalToolingCost = steelRuleDieCost + embossingBlockCost + spotUVPlateCost;
    breakdown['Tooling Setup Cost'] = totalToolingCost;

    // 6. MACHINE COST
    const setupTime = parseFloat(document.getElementById('machineSetupTime').value) || 0;
    const runTimePerUnit = parseFloat(document.getElementById('machineRunTime').value) || 0;
    const hourlyRate = parseFloat(document.getElementById('machineHourlyRate').value) || 1000;
    const totalRunTime = setupTime + (quantity * runTimePerUnit / 60);
    const machineCost = (totalRunTime / 60) * hourlyRate;
    breakdown['Machine Cost'] = machineCost;

    // 7. ADMINISTRATIVE OVERHEADS (10% of production cost)
    const productionCost = breakdown['Substrate / Material Cost'] + breakdown['Ink Cost'] + breakdown['Anilox & Engraving Cost'];
    breakdown['Administrative Overheads'] = productionCost * 0.10;

    // Calculate totals
    const totalCost = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const costPerUnit = totalCost / quantity;

    // Display results
    displayPackagingResults(breakdown, totalCost, costPerUnit, quantity);
}

// ============================================================
// GRAVURE PACKAGING COST CALCULATION
// ============================================================
function calculateGravurePackagingCost(substrateType, quantity) {
    const substrateGSM = getSubstrateBasisValue();
    const flatSize = document.getElementById('flatSize').value;
    const numColors = parseInt(document.getElementById('numColors').value);
    const numCylinders = parseInt(document.getElementById('gravureNumCylinders').value);
    const cylinderType = document.getElementById('gravureCylinderType').value;
    const documentationCost = parseFloat(document.getElementById('gravureDocumentationCost').value) || 0;

    if (!cylinderType) {
        throw new Error('Please fill in all Gravure-specific required fields');
    }

    const breakdown = {};

    // Calculate substrate area
    const areaPerUnit = calculateSubstrateArea(flatSize);

    // 1. SUBSTRATE / MATERIAL COST
    // Formula: W = (L × W / 10000) × (GSM / 1000) × Q × (1 + Wastage)
    const wastagePercentage = 0.10; // 10% wastage for gravure
    const substrateCostPerSqm = substrateCosts[substrateType];
    const materialWeight = (areaPerUnit * (substrateGSM / 1000) * quantity * (1 + wastagePercentage));
    const materialCost = materialWeight * (substrateCostPerSqm / 1000);
    breakdown['Film / Material Cost'] = materialCost;

    // 2. CYLINDER ENGRAVING COST
    // Rule: Each color = one cylinder
    const cylinderCost = gravureCosts.cylinderCosts[cylinderType];
    breakdown['Cylinder Engraving Cost'] = cylinderCost * numCylinders;

    // 3. DOCUMENTATION & ARTWORK COST
    breakdown['Documentation & Artwork Cost'] = documentationCost;

    // 4. INK COST (Gravure uses more ink than flexo)
    // Formula: I = (S × P × A × N × K × SG) / 3548380, where P = 1.5 for gravure
    const inkCostPerKg = 350; // Average gravure ink cost
    const coverage = 0.9; // Higher coverage for gravure
    const P = 1.5; // Gravure constant
    const A = areaPerUnit / 10000;
    const N = numColors;
    const inkWeight = (A * P * coverage * N * 1) / 3548380;
    const inkCost = inkWeight * inkCostPerKg;
    breakdown['Ink Cost'] = inkCost;

    // 5. TOOLING COSTS
    const steelRuleDieCost = parseFloat(document.getElementById('steelRuleDieCost').value) || 0;
    const embossingBlockCost = parseFloat(document.getElementById('embossingBlockCost').value) || 0;
    const spotUVPlateCost = parseFloat(document.getElementById('spotUVPlateCost').value) || 0;
    const totalToolingCost = steelRuleDieCost + embossingBlockCost + spotUVPlateCost;
    breakdown['Tooling Setup Cost'] = totalToolingCost;

    // 6. MACHINE COST
    const setupTime = parseFloat(document.getElementById('machineSetupTime').value) || 0;
    const runTimePerUnit = parseFloat(document.getElementById('machineRunTime').value) || 0;
    const hourlyRate = parseFloat(document.getElementById('machineHourlyRate').value) || 1500;
    const totalRunTime = setupTime + (quantity * runTimePerUnit / 60);
    const machineCost = (totalRunTime / 60) * hourlyRate;
    breakdown['Machine Cost'] = machineCost;

    // 7. ADMINISTRATIVE OVERHEADS (12% for gravure - higher complexity)
    const productionCost = breakdown['Film / Material Cost'] + breakdown['Ink Cost'];
    breakdown['Administrative Overheads'] = productionCost * 0.12;

    // Calculate totals
    const totalCost = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const costPerUnit = totalCost / quantity;

    // Display results
    displayPackagingResults(breakdown, totalCost, costPerUnit, quantity);
}

// ============================================================
// DISPLAY PACKAGING RESULTS
// ============================================================
function displayPackagingResults(breakdown, totalCost, costPerUnit, quantity) {
    document.getElementById('packagingTotalCost').textContent = '₹' + totalCost.toFixed(2);
    document.getElementById('packagingCostPerUnit').textContent = 'Cost per Unit: ₹' + costPerUnit.toFixed(2);

    // Populate breakdown table
    const tbody = document.getElementById('packagingBreakdownTable');
    tbody.innerHTML = '';

    Object.entries(breakdown).forEach(([category, amount]) => {
        const percentage = (amount / totalCost) * 100;
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="label-col">${category}</td>
            <td class="amount-col">₹${amount.toFixed(2)}</td>
            <td class="percent-col">${percentage.toFixed(1)}%</td>
        `;
        tbody.appendChild(row);
    });

    // Add grand total row
    const totalRow = document.createElement('tr');
    totalRow.classList.add('total-row');
    totalRow.innerHTML = `
        <td class="label-col">Grand Total</td>
        <td class="amount-col">₹${totalCost.toFixed(2)}</td>
        <td class="percent-col">100%</td>
    `;
    tbody.appendChild(totalRow);

    document.getElementById('packagingResults').classList.add('show');
}

// ============================================================
// UPDATE PACKAGING PROCESS FIELDS
// ============================================================
function updatePackagingProcessFields() {
    const process = document.getElementById('packagingProcess').value;
    const flexoFields = document.getElementById('flexographyFields');
    const gravureFields = document.getElementById('gravureFields');

    if (process === 'flexography') {
        flexoFields.classList.remove('hidden');
        gravureFields.classList.add('hidden');
    } else if (process === 'gravure') {
        flexoFields.classList.add('hidden');
        gravureFields.classList.remove('hidden');
    } else {
        flexoFields.classList.add('hidden');
        gravureFields.classList.add('hidden');
    }
}

// ============================================================
// HOMEPAGE UI INTERACTIONS (SAFE, OPTIONAL)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('homeNavLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () {
            const isOpen = navLinks.classList.toggle('is-open');
            navToggle.classList.toggle('is-active', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('is-open');
                navToggle.classList.remove('is-active');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    const contactForm = document.getElementById('contactForm');
    const feedback = document.getElementById('formFeedback');

    if (contactForm && feedback) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();
            feedback.textContent = 'Thank you. Your message has been received.';
            contactForm.reset();
        });
    }

    const printingForm = document.getElementById('printingForm');
    if (printingForm) {
        const printingTotalCost = document.getElementById('printingTotalCost');
        const printingCostPerUnit = document.getElementById('printingCostPerUnit');
        const printingBreakdownTable = document.getElementById('printingBreakdownTable');
        const printingResults = document.getElementById('printingResults');
        const printingError = document.getElementById('printingError');
        const initialPrintingTotal = printingTotalCost ? printingTotalCost.textContent : 'Rs0.00';
        const initialPrintingPerUnit = printingCostPerUnit ? printingCostPerUnit.textContent : 'Cost per Unit: Rs0.00';

        printingForm.addEventListener('reset', function () {
            setTimeout(function () {
                if (printingTotalCost) printingTotalCost.textContent = initialPrintingTotal;
                if (printingCostPerUnit) printingCostPerUnit.textContent = initialPrintingPerUnit;
                if (printingBreakdownTable) printingBreakdownTable.innerHTML = '';
                if (printingResults) printingResults.classList.remove('show');
                if (printingError) {
                    printingError.textContent = '';
                    printingError.classList.remove('show');
                }
                if (typeof updateProcessFields === 'function') {
                    updateProcessFields();
                }
                if (typeof updatePaperSizeFields === 'function') {
                    updatePaperSizeFields();
                }
            }, 0);
        });
    }

    const packagingForm = document.getElementById('packagingForm');
    if (packagingForm) {
        const packagingTotalCost = document.getElementById('packagingTotalCost');
        const packagingCostPerUnit = document.getElementById('packagingCostPerUnit');
        const packagingBreakdownTable = document.getElementById('packagingBreakdownTable');
        const packagingResults = document.getElementById('packagingResults');
        const packagingError = document.getElementById('packagingError');
        const initialPackagingTotal = packagingTotalCost ? packagingTotalCost.textContent : 'Rs0.00';
        const initialPackagingPerUnit = packagingCostPerUnit ? packagingCostPerUnit.textContent : 'Cost per Unit: Rs0.00';

        packagingForm.addEventListener('reset', function () {
            setTimeout(function () {
                if (packagingTotalCost) packagingTotalCost.textContent = initialPackagingTotal;
                if (packagingCostPerUnit) packagingCostPerUnit.textContent = initialPackagingPerUnit;
                if (packagingBreakdownTable) packagingBreakdownTable.innerHTML = '';
                if (packagingResults) packagingResults.classList.remove('show');
                if (packagingError) {
                    packagingError.textContent = '';
                    packagingError.classList.remove('show');
                }
                if (typeof updatePackagingProcessFields === 'function') {
                    updatePackagingProcessFields();
                }
                if (typeof updateSubstrateBasisField === 'function') {
                    updateSubstrateBasisField();
                }
            }, 0);
        });
    }

    if (typeof updatePaperSizeFields === 'function') {
        updatePaperSizeFields();
    }
});
