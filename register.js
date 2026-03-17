const firebaseConfig = {
    apiKey: "AIzaSyCfQTN7UTRcW9lBm-rhRqyAOcT5gFZDJIs",
    authDomain: "sss-qr-system-39b59.firebaseapp.com",
    projectId: "sss-qr-system-39b59",
    storageBucket: "sss-qr-system-39b59.firebasestorage.app",
    messagingSenderId: "81090026028",
    appId: "1:81090026028:web:91dfd833462e2d95434f89"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let firstFormData = null;

// ===== DATA SANITIZER =====
function sanitizeData(data) {
    if (data === null || data === undefined) {
        return '';
    }
    if (typeof data === 'string') {
        // Remove any invalid characters
        return data.replace(/[^\x20-\x7E]/g, '');
    }
    if (typeof data === 'number' || typeof data === 'boolean') {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }
    if (typeof data === 'object') {
        const clean = {};
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                clean[key] = sanitizeData(data[key]);
            }
        }
        return clean;
    }
    return '';
}

// ===== INSTRUCTION POPUP FUNCTIONS =====
function showRegisterInstruction() {
    const popup = document.getElementById('registerInstructionPopup');
    if (popup) {
        popup.style.display = 'flex';
    }
}

function closeRegisterInstruction() {
    const popup = document.getElementById('registerInstructionPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

function addInstructionButton() {
    const header = document.querySelector('.republic-header');
    if (header) {
        if (!document.querySelector('.instruction-btn')) {
            const btn = document.createElement('button');
            btn.className = 'instruction-btn';
            btn.innerHTML = '📋 Show Instructions';
            btn.onclick = showRegisterInstruction;
            btn.style.marginTop = '10px';
            header.appendChild(btn);
        }
    }
}

// ===== PAGE LOAD =====
window.addEventListener('load', function() {
    console.log("✅ Register form loaded");
    
    const savedData = localStorage.getItem('firstFormData');
    if (savedData) {
        try {
            firstFormData = JSON.parse(savedData);
            
            document.getElementById('registeredName').value = firstFormData.employerName || '';
            document.getElementById('idNumber').value = firstFormData.employerId || '';
            document.getElementById('companyAddress').value = firstFormData.address || '';
            document.getElementById('telNumber').value = firstFormData.telephone || '';
            
            console.log("✅ First form data loaded:", firstFormData.employerName);
        } catch (e) {
            console.error("❌ Error parsing first form data:", e);
        }
    } else {
        console.warn("⚠️ No first form data found");
    }
    
    const canvases = [
        'officialSignature1', 'officialSignature2', 'officialSignature3',
        'grantingSignature'
    ];
    canvases.forEach(id => clearCanvas(id));
    
    document.getElementById('qrCanvas').style.display = 'none';
    document.getElementById('qrPlaceholder').style.display = 'block';
    document.getElementById('saveSection').style.display = 'none';
    document.getElementById('qrSuccess').style.display = 'none';
    
    const linkContainer = document.getElementById('qrLinkContainer');
    if (linkContainer) {
        linkContainer.style.display = 'none';
    }
    
    setTimeout(() => {
        showRegisterInstruction();
    }, 500);
    
    addInstructionButton();
});

function goBackToIndex() {
    window.location.href = 'index.html';
}

let currentCanvas = null;
let currentCanvasId = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

const canvasSigned = {
    officialSignature1: false,
    officialSignature2: false,
    officialSignature3: false,
    grantingSignature: false
};

function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvasSigned[canvasId] = false;
}

function openModal(canvasId) {
    currentCanvasId = canvasId;
    currentCanvas = document.getElementById(canvasId);
    
    const modal = document.getElementById('signatureModal');
    const modalCanvas = document.getElementById('modalCanvas');
    const ctx = modalCanvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, modalCanvas.width, modalCanvas.height);
    ctx.strokeStyle = '#003c8f';
    ctx.lineWidth = 3;
    
    modal.style.display = 'flex';
    
    modalCanvas.addEventListener('mousedown', startDrawing);
    modalCanvas.addEventListener('mousemove', draw);
    modalCanvas.addEventListener('mouseup', stopDrawing);
    modalCanvas.addEventListener('mouseout', stopDrawing);
    modalCanvas.addEventListener('touchstart', startDrawingTouch);
    modalCanvas.addEventListener('touchmove', drawTouch);
    modalCanvas.addEventListener('touchend', stopDrawing);
}

function closeModal() {
    document.getElementById('signatureModal').style.display = 'none';
}

function clearModalCanvas() {
    const modalCanvas = document.getElementById('modalCanvas');
    const ctx = modalCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, modalCanvas.width, modalCanvas.height);
}

function saveSignature() {
    if (currentCanvasId && currentCanvas) {
        const modalCanvas = document.getElementById('modalCanvas');
        const ctx = currentCanvas.getContext('2d');
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
        ctx.drawImage(modalCanvas, 0, 0, currentCanvas.width, currentCanvas.height);
        
        canvasSigned[currentCanvasId] = true;
        
        const errorMap = {
            officialSignature1: 'officialError1',
            officialSignature2: 'officialError2',
            officialSignature3: 'officialError3',
            grantingSignature: 'grantingError'
        };
        
        const errorId = errorMap[currentCanvasId];
        if (errorId) {
            const errorElement = document.getElementById(errorId);
            if (errorElement) errorElement.style.display = 'none';
        }
    }
    closeModal();
}

function startDrawing(e) {
    e.preventDefault();
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    isDrawing = true;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

function startDrawingTouch(e) {
    e.preventDefault();
    const canvas = e.target;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    isDrawing = true;
    lastX = (touch.clientX - rect.left) * scaleX;
    lastY = (touch.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
}

function drawTouch(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = e.target;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function validateSecondForm() {
    let isValid = true;
    
    for (let i = 1; i <= 3; i++) {
        const nameField = document.getElementById(`officialName${i}`);
        const desigField = document.getElementById(`officialDesignation${i}`);
        const initialField = document.getElementById(`officialInitial${i}`);
        
        if (!nameField.value.trim()) {
            isValid = false;
            nameField.style.borderColor = '#f44336';
        }
        if (!desigField.value.trim()) {
            isValid = false;
            desigField.style.borderColor = '#f44336';
        }
        if (!initialField.value.trim()) {
            isValid = false;
            initialField.style.borderColor = '#f44336';
        }
    }
    
    const grantingName = document.getElementById('grantingName');
    if (!grantingName.value.trim()) {
        isValid = false;
        grantingName.style.borderColor = '#f44336';
    }
    
    const grantingDate = document.getElementById('grantingDate');
    if (!grantingDate.value) {
        isValid = false;
        grantingDate.style.borderColor = '#f44336';
    }
    
    for (let i = 1; i <= 3; i++) {
        if (!canvasSigned[`officialSignature${i}`]) {
            isValid = false;
            document.getElementById(`officialError${i}`).style.display = 'block';
        }
    }
    if (!canvasSigned.grantingSignature) {
        isValid = false;
        document.getElementById('grantingError').style.display = 'block';
    }
    
    return isValid;
}

async function uploadToFirebase(allData) {
    try {
        const submissionId = 'SSS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        allData.timestamp = new Date().toISOString();
        allData.submissionId = submissionId;
        
        console.log("⏳ Uploading to Firebase...");
        await db.collection('sss-submissions').doc(submissionId).set(allData);
        
        console.log('✅ Data uploaded to Firebase with ID:', submissionId);
        return submissionId;
    } catch (error) {
        console.error('❌ Firebase Upload Error:', error);
        throw error;
    }
}

let currentSubmissionId = null;

async function generateQRCode() {
    if (!firstFormData) {
        throw new Error("No first form data found. Please complete first form.");
    }
    
    // SIMPLE DATA - no nested objects
    const allData = {
        // First form - simple strings only
        employerName: firstFormData.employerName || '',
        employerId: firstFormData.employerId || '',
        address: firstFormData.address || '',
        telephone: firstFormData.telephone || '',
        certName: firstFormData.certName || '',
        ssNumber: firstFormData.ssNumber || '',
        specimenName1: firstFormData.specimenName1 || '',
        employerName2: firstFormData.employerName2 || '',
        photo: firstFormData.photo || '',
        specimenSignature1: firstFormData.specimenSignature1 || '',
        employerSignature: firstFormData.employerSignature || '',
        
        // Second form - simple strings and arrays
        registeredName: document.getElementById('registeredName').value || '',
        idNumber: document.getElementById('idNumber').value || '',
        companyAddress: document.getElementById('companyAddress').value || '',
        telNumber: document.getElementById('telNumber').value || '',
        
        // Officials as array of strings
        officialName1: document.getElementById('officialName1').value || '',
        officialDesignation1: document.getElementById('officialDesignation1').value || '',
        officialInitial1: document.getElementById('officialInitial1').value || '',
        officialSignature1: document.getElementById('officialSignature1').toDataURL() || '',
        
        officialName2: document.getElementById('officialName2').value || '',
        officialDesignation2: document.getElementById('officialDesignation2').value || '',
        officialInitial2: document.getElementById('officialInitial2').value || '',
        officialSignature2: document.getElementById('officialSignature2').toDataURL() || '',
        
        officialName3: document.getElementById('officialName3').value || '',
        officialDesignation3: document.getElementById('officialDesignation3').value || '',
        officialInitial3: document.getElementById('officialInitial3').value || '',
        officialSignature3: document.getElementById('officialSignature3').toDataURL() || '',
        
        // Granting authority
        grantingName: document.getElementById('grantingName').value || '',
        grantingSignature: document.getElementById('grantingSignature').toDataURL() || '',
        grantingDate: document.getElementById('grantingDate').value || '',
        
        timestamp: new Date().toISOString()
    };

    try {
        document.getElementById('qrSuccess').style.display = 'none';
        
        console.log("⏳ Starting upload...");
        currentSubmissionId = await uploadToFirebase(allData);
        
        const verifyDoc = await db.collection('sss-submissions').doc(currentSubmissionId).get();
        if (verifyDoc.exists) {
            console.log("✅ Verified: Data exists in Firebase!");
        } else {
            console.error("❌ Data not found after upload!");
            throw new Error("Data verification failed");
        }
        
        const baseUrl = window.location.href.split('?')[0].replace('register.html', '');
        const summaryUrl = baseUrl + 'summary.html?id=' + currentSubmissionId;
        
        console.log("⏳ Generating QR Code for:", summaryUrl);
        
        const qrCanvas = document.getElementById('qrCanvas');
        await QRCode.toCanvas(qrCanvas, summaryUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: '#003c8f',
                light: '#ffffff'
            }
        });
        
        qrCanvas.style.display = 'block';
        document.getElementById('qrPlaceholder').style.display = 'none';
        document.getElementById('saveSection').style.display = 'block';
        document.getElementById('qrSuccess').style.display = 'block';
        
        const qrLink = document.getElementById('qrLink');
        const qrLinkContainer = document.getElementById('qrLinkContainer');
        
        if (qrLink && qrLinkContainer) {
            qrLink.href = summaryUrl;
            qrLinkContainer.style.display = 'block';
            console.log("✅ Link displayed:", summaryUrl);
        }
        
        console.log("✅ QR Code generated successfully!");
        return summaryUrl;
    } catch (error) {
        console.error('❌ Error in generateQRCode:', error);
        throw error;
    }
}

function saveQRCode() {
    const qrCanvas = document.getElementById('qrCanvas');
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10);
    const filename = `SSS-QR-${dateStr}-${currentSubmissionId}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
    
    showPopup('✅ QR CODE SAVED!\n\nFile: ' + filename + '\n\nPresent this QR code at the SSS office.', 'success', 'DOWNLOADED');
}

function showPopup(message, type = 'info', title = '', autoClose = false) {
    const existingPopup = document.querySelector('.popup-message');
    const existingOverlay = document.querySelector('.popup-overlay');
    if (existingPopup) existingPopup.remove();
    if (existingOverlay) existingOverlay.remove();
    
    if (!title) {
        if (type === 'error') title = 'ERROR';
        else if (type === 'success') title = 'SUCCESS';
        else if (type === 'warning') title = 'WARNING';
        else title = 'INFO';
    }
    
    let icon = 'ℹ️';
    if (type === 'error') icon = '❌';
    else if (type === 'success') icon = '✅';
    else if (type === 'warning') icon = '⚠️';
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.onclick = function() {
        popup.remove();
        overlay.remove();
    };
    document.body.appendChild(overlay);
    
    const popup = document.createElement('div');
    popup.className = `popup-message ${type}`;
    
    popup.innerHTML = `
        <div class="popup-icon">${icon}</div>
        <div class="popup-title ${type}">${title}</div>
        <div class="popup-text">${message}</div>
        <div class="popup-buttons">
            <button class="popup-btn primary" onclick="closePopup(this)">OK</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    if (autoClose) {
        setTimeout(() => {
            if (document.body.contains(popup)) {
                popup.remove();
                overlay.remove();
            }
        }, 3000);
    }
}

window.closePopup = function(btn) {
    const popup = btn.closest('.popup-message');
    const overlay = document.querySelector('.popup-overlay');
    if (popup) popup.remove();
    if (overlay) overlay.remove();
};

async function submitSecondForm() {
    if (!validateSecondForm()) {
        showPopup('Please fill in all required fields and complete all signatures.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Uploading to Cloud... <span class="loading"></span>';
    
    try {
        const summaryUrl = await generateQRCode();
        
        if (summaryUrl) {
            submitBtn.innerHTML = '✓ QR CODE READY';
            console.log('Summary URL:', summaryUrl);
            showPopup('✅ SUCCESS!\n\nQR Code generated.\n\nClick SAVE QR CODE to download.', 'success', 'SUCCESS!');
        }
    } catch (error) {
        console.error('❌ Submission error:', error);
        showPopup('Error: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'GENERATE QR CODE';
    }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.clearModalCanvas = clearModalCanvas;
window.saveSignature = saveSignature;
window.clearCanvas = clearCanvas;
window.submitSecondForm = submitSecondForm;
window.saveQRCode = saveQRCode;
window.goBackToIndex = goBackToIndex;
window.showRegisterInstruction = showRegisterInstruction;
window.closeRegisterInstruction = closeRegisterInstruction;