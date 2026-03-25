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
let currentSubmissionId = null;

let cameraStream = null;
let capturedPhotoData = null;
let uploadedImageData = null;
let currentCanvas = null;
let currentCanvasId = null;
let modalDrawingActive = false;

function autoSaveForm2() {
    const form2Data = {
        registeredName: document.getElementById('registeredName')?.value || '',
        idNumber: document.getElementById('idNumber')?.value || '',
        companyAddress: document.getElementById('companyAddress')?.value || '',
        telNumber: document.getElementById('telNumber')?.value || '',
        
        officialName1: document.getElementById('officialName1')?.value || '',
        officialDesignation1: document.getElementById('officialDesignation1')?.value || '',
        officialInitial1: document.getElementById('officialInitial1')?.value || '',
        officialSignature1: document.getElementById('officialSignature1')?.toDataURL() || '',
        
        officialName2: document.getElementById('officialName2')?.value || '',
        officialDesignation2: document.getElementById('officialDesignation2')?.value || '',
        officialInitial2: document.getElementById('officialInitial2')?.value || '',
        officialSignature2: document.getElementById('officialSignature2')?.toDataURL() || '',
        
        officialName3: document.getElementById('officialName3')?.value || '',
        officialDesignation3: document.getElementById('officialDesignation3')?.value || '',
        officialInitial3: document.getElementById('officialInitial3')?.value || '',
        officialSignature3: document.getElementById('officialSignature3')?.toDataURL() || '',
        
        grantingName: document.getElementById('grantingName')?.value || '',
        grantingSignature: document.getElementById('grantingSignature')?.toDataURL() || '',
        grantingDate: document.getElementById('grantingDate')?.value || '',
        
        lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem('form2AutoSave', JSON.stringify(form2Data));
    console.log("💾 Form 2 auto-saved at:", new Date().toLocaleTimeString());
}

function loadAutoSave() {
    const savedData = localStorage.getItem('form2AutoSave');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            document.getElementById('registeredName').value = data.registeredName || '';
            document.getElementById('idNumber').value = data.idNumber || '';
            document.getElementById('companyAddress').value = data.companyAddress || '';
            document.getElementById('telNumber').value = data.telNumber || '';
            
            document.getElementById('officialName1').value = data.officialName1 || '';
            document.getElementById('officialDesignation1').value = data.officialDesignation1 || '';
            document.getElementById('officialInitial1').value = data.officialInitial1 || '';
            
            document.getElementById('officialName2').value = data.officialName2 || '';
            document.getElementById('officialDesignation2').value = data.officialDesignation2 || '';
            document.getElementById('officialInitial2').value = data.officialInitial2 || '';
            
            document.getElementById('officialName3').value = data.officialName3 || '';
            document.getElementById('officialDesignation3').value = data.officialDesignation3 || '';
            document.getElementById('officialInitial3').value = data.officialInitial3 || '';
            
            document.getElementById('grantingName').value = data.grantingName || '';
            document.getElementById('grantingDate').value = data.grantingDate || '';
            
            if (data.officialSignature1) loadCanvasFromData('officialSignature1', data.officialSignature1);
            if (data.officialSignature2) loadCanvasFromData('officialSignature2', data.officialSignature2);
            if (data.officialSignature3) loadCanvasFromData('officialSignature3', data.officialSignature3);
            if (data.grantingSignature) loadCanvasFromData('grantingSignature', data.grantingSignature);
            
            console.log("📂 Form 2 auto-save loaded from:", new Date(data.lastSaved).toLocaleString());
            return true;
        } catch (e) {
            console.error("Error loading auto-save:", e);
        }
    }
    return false;
}

function loadCanvasFromData(canvasId, dataUrl) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvasSigned[canvasId] = true;
        hideErrorForCanvas(canvasId);
    };
    img.src = dataUrl;
}

function clearAutoSave() {
    localStorage.removeItem('form2AutoSave');
    console.log("🗑️ Auto-save cleared after submission");
}

function setupAutoSave() {
    const inputs = [
        'registeredName', 'idNumber', 'companyAddress', 'telNumber',
        'officialName1', 'officialDesignation1', 'officialInitial1',
        'officialName2', 'officialDesignation2', 'officialInitial2',
        'officialName3', 'officialDesignation3', 'officialInitial3',
        'grantingName', 'grantingDate'
    ];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => autoSaveForm2());
            element.addEventListener('change', () => autoSaveForm2());
        }
    });
}

function hideErrorForCanvas(canvasId) {
    const errorMap = {
        officialSignature1: 'officialError1',
        officialSignature2: 'officialError2',
        officialSignature3: 'officialError3',
        grantingSignature: 'grantingError'
    };
    const errorId = errorMap[canvasId];
    if (errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) errorElement.style.display = 'none';
    }
}

function showRegisterInstruction() {
    const popup = document.getElementById('registerInstructionPopup');
    if (popup) popup.style.display = 'flex';
}

function closeRegisterInstruction() {
    const popup = document.getElementById('registerInstructionPopup');
    if (popup) popup.style.display = 'none';
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
        } catch (e) {
            console.error("❌ Error parsing first form data:", e);
        }
    } else {
        console.warn("⚠️ No first form data found");
    }
    
    const canvases = ['officialSignature1', 'officialSignature2', 'officialSignature3', 'grantingSignature'];
    canvases.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    });
    
    loadAutoSave();
    setupAutoSave();
    
    setTimeout(() => showRegisterInstruction(), 500);
});

function goBackToIndex() {
    window.location.href = 'index.html';
}

function goToReviewPage() {
    window.location.href = 'review.html';
}

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
    autoSaveForm2();
}

function selectDraw() {
    document.getElementById('drawMode').style.display = 'block';
    document.getElementById('cameraMode').style.display = 'none';
    document.getElementById('uploadMode').style.display = 'none';
    document.getElementById('drawOptionBtn').classList.add('active');
    document.getElementById('cameraOptionBtn').classList.remove('active');
    document.getElementById('uploadOptionBtn').classList.remove('active');
    stopCamera();
    initModalDrawing();
}

function initModalDrawing() {
    const modalCanvas = document.getElementById('modalCanvas');
    if (!modalCanvas || modalDrawingActive) return;
    modalDrawingActive = true;
    
    let modalIsDrawing = false;
    let modalLastX = 0, modalLastY = 0;
    
    function startModalDraw(e) {
        e.preventDefault();
        const rect = modalCanvas.getBoundingClientRect();
        const scaleX = modalCanvas.width / rect.width;
        const scaleY = modalCanvas.height / rect.height;
        modalIsDrawing = true;
        
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        modalLastX = (clientX - rect.left) * scaleX;
        modalLastY = (clientY - rect.top) * scaleY;
        const ctx = modalCanvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(modalLastX, modalLastY);
    }
    
    function drawModal(e) {
        if (!modalIsDrawing) return;
        e.preventDefault();
        const rect = modalCanvas.getBoundingClientRect();
        const scaleX = modalCanvas.width / rect.width;
        const scaleY = modalCanvas.height / rect.height;
        
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        const ctx = modalCanvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    
    function stopModalDraw() {
        modalIsDrawing = false;
    }
    
    modalCanvas.removeEventListener('mousedown', startModalDraw);
    modalCanvas.removeEventListener('mousemove', drawModal);
    modalCanvas.removeEventListener('mouseup', stopModalDraw);
    modalCanvas.removeEventListener('mouseleave', stopModalDraw);
    modalCanvas.removeEventListener('touchstart', startModalDraw);
    modalCanvas.removeEventListener('touchmove', drawModal);
    modalCanvas.removeEventListener('touchend', stopModalDraw);
    
    modalCanvas.addEventListener('mousedown', startModalDraw);
    modalCanvas.addEventListener('mousemove', drawModal);
    modalCanvas.addEventListener('mouseup', stopModalDraw);
    modalCanvas.addEventListener('mouseleave', stopModalDraw);
    modalCanvas.addEventListener('touchstart', startModalDraw);
    modalCanvas.addEventListener('touchmove', drawModal);
    modalCanvas.addEventListener('touchend', stopModalDraw);
}

function clearModalCanvas() {
    const modalCanvas = document.getElementById('modalCanvas');
    if (modalCanvas) {
        const ctx = modalCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, modalCanvas.width, modalCanvas.height);
        ctx.strokeStyle = '#003c8f';
        ctx.lineWidth = 3;
    }
}

function saveDrawSignature() {
    if (currentCanvasId && currentCanvas) {
        const modalCanvas = document.getElementById('modalCanvas');
        const ctx = currentCanvas.getContext('2d');
        ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
        ctx.drawImage(modalCanvas, 0, 0, currentCanvas.width, currentCanvas.height);
        canvasSigned[currentCanvasId] = true;
        hideErrorForCanvas(currentCanvasId);
        autoSaveForm2();
    }
    closeModal();
}

function selectCamera() {
    document.getElementById('drawMode').style.display = 'none';
    document.getElementById('cameraMode').style.display = 'block';
    document.getElementById('uploadMode').style.display = 'none';
    document.getElementById('drawOptionBtn').classList.remove('active');
    document.getElementById('cameraOptionBtn').classList.add('active');
    document.getElementById('uploadOptionBtn').classList.remove('active');
    startCamera();
}

async function startCamera() {
    try {
        if (cameraStream) stopCamera();
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }
        });
        const video = document.getElementById('cameraVideo');
        if (video) video.srcObject = cameraStream;
    } catch (err) {
        alert('Cannot access camera. Please use draw or upload option.');
        selectDraw();
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    if (!video || !canvas) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        if (brightness < 128) {
            data[i] = data[i+1] = data[i+2] = 0;
            data[i+3] = 255;
        } else {
            data[i+3] = 0;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    
    capturedPhotoData = canvas.toDataURL('image/png');
    const previewDiv = document.getElementById('photoPreviewCapture');
    previewDiv.innerHTML = '<img src="' + capturedPhotoData + '" style="max-width: 100%; max-height: 100px; border: 1px solid #003c8f; border-radius: 4px;">';
    
    document.querySelector('#cameraMode .modal-btn[onclick="capturePhoto()"]').style.display = 'none';
    document.getElementById('savePhotoBtn').style.display = 'inline-block';
}

function savePhotoSignature() {
    if (capturedPhotoData && currentCanvasId && currentCanvas) {
        const ctx = currentCanvas.getContext('2d');
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
            ctx.drawImage(img, 0, 0, currentCanvas.width, currentCanvas.height);
            canvasSigned[currentCanvasId] = true;
            hideErrorForCanvas(currentCanvasId);
            autoSaveForm2();
            closeModal();
        };
        img.src = capturedPhotoData;
    } else {
        closeModal();
    }
    resetCameraUI();
}

function resetCameraUI() {
    capturedPhotoData = null;
    const captureBtn = document.querySelector('#cameraMode .modal-btn[onclick="capturePhoto()"]');
    if (captureBtn) captureBtn.style.display = 'inline-block';
    document.getElementById('savePhotoBtn').style.display = 'none';
    document.getElementById('photoPreviewCapture').innerHTML = '';
}

function selectUpload() {
    document.getElementById('drawMode').style.display = 'none';
    document.getElementById('cameraMode').style.display = 'none';
    document.getElementById('uploadMode').style.display = 'block';
    document.getElementById('drawOptionBtn').classList.remove('active');
    document.getElementById('cameraOptionBtn').classList.remove('active');
    document.getElementById('uploadOptionBtn').classList.add('active');
    stopCamera();
    
    const uploadInput = document.getElementById('uploadFileInput');
    uploadInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                uploadedImageData = ev.target.result;
                const previewDiv = document.getElementById('uploadPreview');
                previewDiv.innerHTML = '<img src="' + uploadedImageData + '" style="max-width: 100%; max-height: 100px; border: 1px solid #003c8f; border-radius: 4px;">';
            };
            reader.readAsDataURL(file);
        }
    };
}

function saveUploadSignature() {
    if (uploadedImageData && currentCanvasId && currentCanvas) {
        const img = new Image();
        img.onload = function() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0);
            
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
                if (brightness < 128) {
                    data[i] = data[i+1] = data[i+2] = 0;
                    data[i+3] = 255;
                } else {
                    data[i+3] = 0;
                }
            }
            tempCtx.putImageData(imageData, 0, 0);
            const processedData = tempCanvas.toDataURL('image/png');
            
            const finalImg = new Image();
            finalImg.onload = function() {
                const ctx = currentCanvas.getContext('2d');
                ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
                ctx.drawImage(finalImg, 0, 0, currentCanvas.width, currentCanvas.height);
                canvasSigned[currentCanvasId] = true;
                hideErrorForCanvas(currentCanvasId);
                autoSaveForm2();
                closeModal();
            };
            finalImg.src = processedData;
        };
        img.src = uploadedImageData;
        uploadedImageData = null;
    } else {
        closeModal();
    }
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
    
    capturedPhotoData = null;
    uploadedImageData = null;
    document.getElementById('photoPreviewCapture').innerHTML = '';
    document.getElementById('uploadPreview').innerHTML = '';
    document.getElementById('savePhotoBtn').style.display = 'none';
    document.getElementById('uploadFileInput').value = '';
    
    selectDraw();
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('signatureModal').style.display = 'none';
    stopCamera();
    currentCanvasId = null;
    currentCanvas = null;
    modalDrawingActive = false;
}

function validateSecondForm() {
    let isValid = true;
    
    for (let i = 1; i <= 3; i++) {
        const nameField = document.getElementById(`officialName${i}`);
        const desigField = document.getElementById(`officialDesignation${i}`);
        const initialField = document.getElementById(`officialInitial${i}`);
        
        if (!nameField.value.trim()) isValid = false;
        if (!desigField.value.trim()) isValid = false;
        if (!initialField.value.trim()) isValid = false;
    }
    
    const grantingName = document.getElementById('grantingName');
    const grantingDate = document.getElementById('grantingDate');
    
    if (!grantingName.value.trim()) isValid = false;
    if (!grantingDate.value) isValid = false;
    
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

async function generateQRCode() {
    if (!firstFormData) throw new Error("No first form data found. Please complete first form.");
    
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
        
        timestamp: new Date().toISOString()
    };

    try {
        console.log("⏳ Starting upload...");
        currentSubmissionId = await uploadToFirebase(allData);
        
        const verifyDoc = await db.collection('sss-submissions').doc(currentSubmissionId).get();
        if (!verifyDoc.exists) throw new Error("Data verification failed");
        
        const baseUrl = window.location.href.split('?')[0].replace('register.html', '');
        const summaryUrl = baseUrl + 'summary.html?id=' + currentSubmissionId;
        
        console.log("⏳ Generating QR Code for:", summaryUrl);
        
        const qrCanvas = document.getElementById('qrCanvas');
        if (!qrCanvas) throw new Error("QR Canvas element not found");
        
        await QRCode.toCanvas(qrCanvas, summaryUrl, {
            width: 180,
            margin: 2,
            color: { dark: '#003c8f', light: '#ffffff' }
        });
        
        const qrLink = document.getElementById('qrLink');
        if (qrLink) {
            qrLink.href = summaryUrl;
            qrLink.innerHTML = summaryUrl;
        }
        
        const qrLinkContainer = document.getElementById('qrLinkContainer');
        if (qrLinkContainer) qrLinkContainer.style.display = 'block';
        
        const saveSection = document.getElementById('saveSection');
        if (saveSection) saveSection.style.display = 'block';
        
        const qrSuccess = document.getElementById('qrSuccess');
        if (qrSuccess) {
            qrSuccess.style.display = 'block';
            setTimeout(() => qrSuccess.style.display = 'none', 3000);
        }
        
        // CLEAR ALL DATA AFTER QR GENERATION
        localStorage.removeItem('form1AutoSave');
        localStorage.removeItem('form2AutoSave');
        localStorage.removeItem('firstFormData');
        localStorage.setItem('qrGenerated', 'true');
        
        console.log("✅ QR Code generated successfully and all data cleared!");
        return summaryUrl;
    } catch (error) {
        console.error('❌ Error in generateQRCode:', error);
        throw error;
    }
}

function saveQRCode() {
    const qrCanvas = document.getElementById('qrCanvas');
    if (!qrCanvas) {
        alert('No QR code to save');
        return;
    }
    
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10);
    const filename = `SSS-QR-${dateStr}-${currentSubmissionId}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
    
    alert('✅ QR CODE SAVED!\n\nFile: ' + filename);
}

function showPopup(message, type = 'info') {
    const existingPopup = document.querySelector('.popup-overlay:not(#registerInstructionPopup)');
    if (existingPopup) existingPopup.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.innerHTML = `
        <div class="popup-message" style="background:white; border-radius:12px; padding:25px; max-width:350px; text-align:center;">
            <div class="popup-icon" style="font-size:48px; margin-bottom:10px;">${type === 'error' ? '❌' : '✅'}</div>
            <div class="popup-title" style="font-size:20px; font-weight:600; margin-bottom:10px;">${type === 'error' ? 'ERROR' : 'SUCCESS'}</div>
            <div class="popup-text" style="margin-bottom:20px;">${message}</div>
            <button class="popup-btn" style="background:#003c8f; color:white; border:none; padding:8px 25px; border-radius:25px; cursor:pointer;" onclick="this.closest('.popup-overlay').remove()">OK</button>
        </div>
    `;
    overlay.style.display = 'flex';
    document.body.appendChild(overlay);
}

async function submitSecondForm() {
    if (!validateSecondForm()) {
        showPopup('Please fill in all required fields and complete all signatures.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Generating QR Code... <span class="loading-spinner"></span>';
    
    try {
        await generateQRCode();
        submitBtn.innerHTML = '✓ QR CODE READY';
        showPopup('✅ SUCCESS!\n\nQR Code generated.\n\nClick SAVE QR CODE to download.', 'success');
        clearAutoSave();
    } catch (error) {
        console.error('❌ Submission error:', error);
        showPopup('Error: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'GENERATE QR CODE';
        }, 3000);
    }
}

function reviewForm() {
    if (!validateSecondForm()) {
        if (!confirm('Some fields are incomplete. Continue to review anyway?')) return;
    }
    goToReviewPage();
}

window.openModal = openModal;
window.closeModal = closeModal;
window.clearModalCanvas = clearModalCanvas;
window.saveDrawSignature = saveDrawSignature;
window.savePhotoSignature = savePhotoSignature;
window.saveUploadSignature = saveUploadSignature;
window.clearCanvas = clearCanvas;
window.submitSecondForm = submitSecondForm;
window.saveQRCode = saveQRCode;
window.goBackToIndex = goBackToIndex;
window.showRegisterInstruction = showRegisterInstruction;
window.closeRegisterInstruction = closeRegisterInstruction;
window.reviewForm = reviewForm;
window.goToReviewPage = goToReviewPage;
window.selectDraw = selectDraw;
window.selectCamera = selectCamera;
window.selectUpload = selectUpload;
window.capturePhoto = capturePhoto;