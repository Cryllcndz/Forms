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

// EmailJS Config - gamit ang iyong existing keys
const EMAILJS_PUBLIC_KEY = "CysQ3fwtKbTZZSppu";
const EMAILJS_SERVICE_ID = "service_o52hc72";
const EMAILJS_TEMPLATE_ID = "template_8akdn4j";

emailjs.init(EMAILJS_PUBLIC_KEY);

let firstFormData = null;
let currentSubmissionId = null;

function sanitizeData(data) {
    if (data === null || data === undefined) {
        return '';
    }
    if (typeof data === 'string') {
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
    
    document.getElementById('qrSuccess').style.display = 'none';
    
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

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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
        } else {
            nameField.style.borderColor = '#ccc';
        }
        
        if (!desigField.value.trim()) {
            isValid = false;
            desigField.style.borderColor = '#f44336';
        } else {
            desigField.style.borderColor = '#ccc';
        }
        
        if (!initialField.value.trim()) {
            isValid = false;
            initialField.style.borderColor = '#f44336';
        } else {
            initialField.style.borderColor = '#ccc';
        }
    }
    
    const grantingName = document.getElementById('grantingName');
    if (!grantingName.value.trim()) {
        isValid = false;
        grantingName.style.borderColor = '#f44336';
    } else {
        grantingName.style.borderColor = '#003c8f';
    }
    
    const grantingDate = document.getElementById('grantingDate');
    if (!grantingDate.value) {
        isValid = false;
        grantingDate.style.borderColor = '#f44336';
    } else {
        grantingDate.style.borderColor = '#999';
    }
    
    const emailField = document.getElementById('recipientEmail');
    if (emailField) {
        const email = emailField.value.trim();
        if (!email) {
            isValid = false;
            emailField.style.borderColor = '#f44336';
            emailField.classList.add('error');
        } else if (!isValidEmail(email)) {
            isValid = false;
            emailField.style.borderColor = '#f44336';
            emailField.classList.add('error');
            showPopup('Please enter a valid email address', 'error');
        } else {
            emailField.style.borderColor = '#003c8f';
            emailField.classList.remove('error');
        }
    }
    
    for (let i = 1; i <= 3; i++) {
        if (!canvasSigned[`officialSignature${i}`]) {
            isValid = false;
            document.getElementById(`officialError${i}`).style.display = 'block';
        } else {
            document.getElementById(`officialError${i}`).style.display = 'none';
        }
    }
    
    if (!canvasSigned.grantingSignature) {
        isValid = false;
        document.getElementById('grantingError').style.display = 'block';
    } else {
        document.getElementById('grantingError').style.display = 'none';
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

async function generateQRCodeAndSendEmail() {
    if (!firstFormData) {
        throw new Error("No first form data found. Please complete first form.");
    }
    
    const emailField = document.getElementById('recipientEmail');
    if (!emailField) {
        throw new Error("Email field not found");
    }
    
    const email = emailField.value.trim();
    if (!email) {
        throw new Error("Email address is required");
    }
    
    const allData = {
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
        
        registeredName: document.getElementById('registeredName').value || '',
        idNumber: document.getElementById('idNumber').value || '',
        companyAddress: document.getElementById('companyAddress').value || '',
        telNumber: document.getElementById('telNumber').value || '',
        
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
        
        grantingName: document.getElementById('grantingName').value || '',
        grantingSignature: document.getElementById('grantingSignature').toDataURL() || '',
        grantingDate: document.getElementById('grantingDate').value || '',
        recipientEmail: email,
        
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
        
        console.log("⏳ Generating QR Code...");
        
        const qrCanvas = document.getElementById('qrCanvas');
        if (qrCanvas) {
            await QRCode.toCanvas(qrCanvas, summaryUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#003c8f',
                    light: '#ffffff'
                }
            });
        }
        
        await sendEmailWithQR(email, summaryUrl);
        
        console.log("✅ Form submitted and email sent!");
        return summaryUrl;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// ===== EMAILJS EMAIL FUNCTION =====
async function sendEmailWithQR(email, summaryUrl) {
    try {
        const qrCanvas = document.getElementById('qrCanvas');
        const qrDataURL = qrCanvas.toDataURL('image/png');
        
        const templateParams = {
            to_email: email,
            to_name: email.split('@')[0],
            from_name: "SSS System",
            qr_link: summaryUrl,
            qr_image: qrDataURL,
            submission_id: currentSubmissionId,
            date_sent: new Date().toLocaleString(),
            message: "Thank you for completing the SSS form."
        };
        
        console.log("Sending to email:", email);
        
        const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        console.log("✅ Email sent successfully!", response);
        
        showPopup('✅ Email sent to ' + email, 'success', 'EMAIL SENT!');
        
    } catch (error) {
        console.error("❌ Email error:", error);
        showPopup('Error: ' + (error.text || error.message), 'error');
        throw error;
    }
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
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending to Email... <span class="loading-spinner"></span>';
    
    try {
        const summaryUrl = await generateQRCodeAndSendEmail();
        
        if (summaryUrl) {
            submitBtn.innerHTML = '✓ SENT TO EMAIL';
            
            localStorage.removeItem('firstFormData');
            
            setTimeout(() => {
                submitBtn.innerHTML = 'GENERATE & SEND QR CODE';
                submitBtn.disabled = false;
            }, 3000);
        }
    } catch (error) {
        console.error('❌ Submission error:', error);
        showPopup('Error: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'GENERATE & SEND QR CODE';
    }
}

// ===== REVIEW FUNCTIONS =====
function goToReviewPage() {
    const form2Data = {
        registeredName: document.getElementById('registeredName').value,
        idNumber: document.getElementById('idNumber').value,
        companyAddress: document.getElementById('companyAddress').value,
        telNumber: document.getElementById('telNumber').value,
        
        officialName1: document.getElementById('officialName1').value,
        officialDesignation1: document.getElementById('officialDesignation1').value,
        officialInitial1: document.getElementById('officialInitial1').value,
        officialSignature1: document.getElementById('officialSignature1').toDataURL(),
        
        officialName2: document.getElementById('officialName2').value,
        officialDesignation2: document.getElementById('officialDesignation2').value,
        officialInitial2: document.getElementById('officialInitial2').value,
        officialSignature2: document.getElementById('officialSignature2').toDataURL(),
        
        officialName3: document.getElementById('officialName3').value,
        officialDesignation3: document.getElementById('officialDesignation3').value,
        officialInitial3: document.getElementById('officialInitial3').value,
        officialSignature3: document.getElementById('officialSignature3').toDataURL(),
        
        grantingName: document.getElementById('grantingName').value,
        grantingSignature: document.getElementById('grantingSignature').toDataURL(),
        grantingDate: document.getElementById('grantingDate').value,
        recipientEmail: document.getElementById('recipientEmail').value
    };
    
    localStorage.setItem('reviewFormData', JSON.stringify(form2Data));
    window.location.href = 'review.html';
}

function reviewForm() {
    if (!validateSecondForm()) {
        if (!confirm('Some fields are incomplete. Continue to review anyway?')) {
            return;
        }
    }
    goToReviewPage();
}

window.openModal = openModal;
window.closeModal = closeModal;
window.clearModalCanvas = clearModalCanvas;
window.saveSignature = saveSignature;
window.clearCanvas = clearCanvas;
window.submitSecondForm = submitSecondForm;
window.goBackToIndex = goBackToIndex;
window.showRegisterInstruction = showRegisterInstruction;
window.closeRegisterInstruction = closeRegisterInstruction;
window.reviewForm = reviewForm;
window.goToReviewPage = goToReviewPage;