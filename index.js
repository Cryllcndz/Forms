// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCfQTN7UTRcW9lBm-rhRqyAOcT5gFZDJIs",
    authDomain: "sss-qr-system-39b59.firebaseapp.com",
    projectId: "sss-qr-system-39b59",
    storageBucket: "sss-qr-system-39b59.firebasestorage.app",
    messagingSenderId: "81090026028",
    appId: "1:81090026028:web:91dfd833462e2d95434f89"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let photoUploaded = false;

let cameraStream = null;
let capturedPhotoData = null;
let uploadedImageData = null;
let currentCanvas = null;
let currentCanvasId = null;
let modalDrawingActive = false;
let isDrawing = false;
let lastX = 0, lastY = 0;

const canvasSigned = {
    specimenSignature1: false,
    employerSignature: false
};

function initDrawing(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#003c8f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    canvas.addEventListener('mousedown', (e) => startDraw(e, canvas));
    canvas.addEventListener('mousemove', (e) => draw(e, canvas));
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseleave', () => isDrawing = false);
    canvas.addEventListener('touchstart', (e) => startDrawTouch(e, canvas));
    canvas.addEventListener('touchmove', (e) => drawTouch(e, canvas));
    canvas.addEventListener('touchend', () => isDrawing = false);
}

function startDraw(e, canvas) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    isDrawing = true;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    canvasSigned[canvas.id] = true;
    autoSaveForm1();
}

function startDrawTouch(e, canvas) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    isDrawing = true;
    lastX = (touch.clientX - rect.left) * scaleX;
    lastY = (touch.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    canvasSigned[canvas.id] = true;
    autoSaveForm1();
}

function draw(e, canvas) {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    autoSaveForm1();
}

function drawTouch(e, canvas) {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    autoSaveForm1();
}

function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#003c8f';
        ctx.lineWidth = 2;
        canvasSigned[canvasId] = false;
        autoSaveForm1();
        const errId = canvasId === 'specimenSignature1' ? 'specimenError1' : 'employerError';
        const errEl = document.getElementById(errId);
        if (errEl) errEl.style.display = 'none';
    }
}

function autoSaveForm1() {
    const specimenCanvas = document.getElementById('specimenSignature1');
    const employerCanvas = document.getElementById('employerSignature');
    const photoPreview = document.getElementById('photoPreview');
    
    const form1Data = {
        employerName: document.getElementById('employerName')?.value || '',
        employerId: document.getElementById('employerId')?.value || '',
        address: document.getElementById('address')?.value || '',
        telephone: document.getElementById('telephone')?.value || '',
        certName: document.getElementById('certName')?.value || '',
        ssNumber: document.getElementById('ssNumber')?.value || '',
        specimenName1: document.getElementById('specimenName1')?.value || '',
        employerName2: document.getElementById('employerName2')?.value || '',
        photo: photoPreview?.src || '',
        specimenSignature1: specimenCanvas?.toDataURL() || '',
        employerSignature: employerCanvas?.toDataURL() || '',
        photoUploaded: photoUploaded,
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('form1AutoSave', JSON.stringify(form1Data));
    console.log("💾 Form 1 auto-saved at:", new Date().toLocaleTimeString());
}

function loadCanvasFromData(canvasId, dataUrl) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !dataUrl || dataUrl === '') return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvasSigned[canvasId] = true;
        hideErrorForCanvas(canvasId);
    };
    img.src = dataUrl;
}

function loadAutoSave() {
    const saved = localStorage.getItem('form1AutoSave');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            document.getElementById('employerName').value = data.employerName || '';
            document.getElementById('employerId').value = data.employerId || '';
            document.getElementById('address').value = data.address || '';
            document.getElementById('telephone').value = data.telephone || '';
            document.getElementById('certName').value = data.certName || '';
            document.getElementById('ssNumber').value = data.ssNumber || '';
            document.getElementById('specimenName1').value = data.specimenName1 || '';
            document.getElementById('employerName2').value = data.employerName2 || '';
            
            if (data.photo && data.photo !== '#') {
                const preview = document.getElementById('photoPreview');
                const placeholder = document.getElementById('photoPlaceholder');
                preview.src = data.photo;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
                photoUploaded = data.photoUploaded || true;
                document.getElementById('photoError').style.display = 'none';
            }
            
            if (data.specimenSignature1) loadCanvasFromData('specimenSignature1', data.specimenSignature1);
            if (data.employerSignature) loadCanvasFromData('employerSignature', data.employerSignature);
            
            console.log("📂 Form 1 auto-save loaded from:", new Date(data.lastSaved).toLocaleString());
            return true;
        } catch (e) {
            console.error("Error loading auto-save:", e);
        }
    }
    return false;
}

function clearForm1AutoSave() {
    localStorage.removeItem('form1AutoSave');
    console.log("🗑️ Form 1 auto-save cleared");
}

function setupAutoSave() {
    const inputs = ['employerName', 'employerId', 'address', 'telephone', 'certName', 'ssNumber', 'specimenName1', 'employerName2'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => autoSaveForm1());
            element.addEventListener('change', () => autoSaveForm1());
        }
    });
    
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', () => setTimeout(() => autoSaveForm1(), 100));
    }
}

// Single photo input handler
const photoInputElement = document.getElementById('photoInput');
if (photoInputElement) {
    photoInputElement.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const preview = document.getElementById('photoPreview');
                const placeholder = document.getElementById('photoPlaceholder');
                preview.src = ev.target.result;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
                photoUploaded = true;
                document.getElementById('photoError').style.display = 'none';
                autoSaveForm1();
            };
            reader.readAsDataURL(file);
        }
    });
}

function validateNameInput(event) {
    const input = event.target;
    input.value = input.value.replace(/[^a-zA-Z\s.-]/g, '');
    autoSaveForm1();
}

function validateEmployerId(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9-]/g, '');
    let value = input.value.replace(/-/g, '');
    if (value.length > 2) value = value.slice(0,2) + '-' + value.slice(2);
    if (value.length > 11) value = value.slice(0,11) + '-' + value.slice(11,12);
    if (value.length > 13) value = value.slice(0,13);
    input.value = value;
    autoSaveForm1();
}

function validateSSNumber(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9-]/g, '');
    let value = input.value.replace(/-/g, '');
    if (value.length > 2) value = value.slice(0,2) + '-' + value.slice(2);
    if (value.length > 11) value = value.slice(0,11) + '-' + value.slice(11,12);
    if (value.length > 13) value = value.slice(0,13);
    input.value = value;
    autoSaveForm1();
}

function validateTelephone(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9+\s]/g, '');
    autoSaveForm1();
}

function validateAddress(event) {
    const input = event.target;
    input.value = input.value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
    autoSaveForm1();
}

const employerNameField = document.getElementById('employerName');
if (employerNameField) employerNameField.addEventListener('input', validateNameInput);
const specimenName1Field = document.getElementById('specimenName1');
if (specimenName1Field) specimenName1Field.addEventListener('input', validateNameInput);
const employerName2Field = document.getElementById('employerName2');
if (employerName2Field) employerName2Field.addEventListener('input', validateNameInput);
const certNameField = document.getElementById('certName');
if (certNameField) certNameField.addEventListener('input', validateNameInput);
const employerIdField = document.getElementById('employerId');
if (employerIdField) employerIdField.addEventListener('input', validateEmployerId);
const ssNumberField = document.getElementById('ssNumber');
if (ssNumberField) ssNumberField.addEventListener('input', validateSSNumber);
const telephoneField = document.getElementById('telephone');
if (telephoneField) telephoneField.addEventListener('input', validateTelephone);
const addressField = document.getElementById('address');
if (addressField) addressField.addEventListener('input', validateAddress);

function selectDraw() {
    const drawMode = document.getElementById('drawMode');
    const cameraMode = document.getElementById('cameraMode');
    const uploadMode = document.getElementById('uploadMode');
    const drawBtn = document.getElementById('drawOptionBtn');
    const cameraBtn = document.getElementById('cameraOptionBtn');
    const uploadBtn = document.getElementById('uploadOptionBtn');
    
    if (drawMode) drawMode.style.display = 'block';
    if (cameraMode) cameraMode.style.display = 'none';
    if (uploadMode) uploadMode.style.display = 'none';
    if (drawBtn) drawBtn.classList.add('active');
    if (cameraBtn) cameraBtn.classList.remove('active');
    if (uploadBtn) uploadBtn.classList.remove('active');
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
        autoSaveForm1();
    }
    closeModal();
}

function selectCamera() {
    const drawMode = document.getElementById('drawMode');
    const cameraMode = document.getElementById('cameraMode');
    const uploadMode = document.getElementById('uploadMode');
    const drawBtn = document.getElementById('drawOptionBtn');
    const cameraBtn = document.getElementById('cameraOptionBtn');
    const uploadBtn = document.getElementById('uploadOptionBtn');
    
    if (drawMode) drawMode.style.display = 'none';
    if (cameraMode) cameraMode.style.display = 'block';
    if (uploadMode) uploadMode.style.display = 'none';
    if (drawBtn) drawBtn.classList.remove('active');
    if (cameraBtn) cameraBtn.classList.add('active');
    if (uploadBtn) uploadBtn.classList.remove('active');
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
    if (previewDiv) {
        previewDiv.innerHTML = '<img src="' + capturedPhotoData + '" style="max-width: 100%; max-height: 100px; border: 1px solid #003c8f; border-radius: 4px;">';
    }
    
    const captureBtn = document.querySelector('#cameraMode .modal-btn[onclick="capturePhoto()"]');
    if (captureBtn) captureBtn.style.display = 'none';
    
    const savePhotoBtn = document.getElementById('savePhotoBtn');
    if (savePhotoBtn) savePhotoBtn.style.display = 'inline-block';
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
            autoSaveForm1();
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
    const savePhotoBtn = document.getElementById('savePhotoBtn');
    if (savePhotoBtn) savePhotoBtn.style.display = 'none';
    const previewDiv = document.getElementById('photoPreviewCapture');
    if (previewDiv) previewDiv.innerHTML = '';
}

function selectUpload() {
    const drawMode = document.getElementById('drawMode');
    const cameraMode = document.getElementById('cameraMode');
    const uploadMode = document.getElementById('uploadMode');
    const drawBtn = document.getElementById('drawOptionBtn');
    const cameraBtn = document.getElementById('cameraOptionBtn');
    const uploadBtn = document.getElementById('uploadOptionBtn');
    
    if (drawMode) drawMode.style.display = 'none';
    if (cameraMode) cameraMode.style.display = 'none';
    if (uploadMode) uploadMode.style.display = 'block';
    if (drawBtn) drawBtn.classList.remove('active');
    if (cameraBtn) cameraBtn.classList.remove('active');
    if (uploadBtn) uploadBtn.classList.add('active');
    stopCamera();
    
    const uploadInput = document.getElementById('uploadFileInput');
    if (uploadInput) {
        uploadInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    uploadedImageData = ev.target.result;
                    const previewDiv = document.getElementById('uploadPreview');
                    if (previewDiv) {
                        previewDiv.innerHTML = '<img src="' + uploadedImageData + '" style="max-width: 100%; max-height: 100px; border: 1px solid #003c8f; border-radius: 4px;">';
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    }
    
    const previewDiv = document.getElementById('uploadPreview');
    if (previewDiv) previewDiv.innerHTML = '';
    uploadedImageData = null;
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
                autoSaveForm1();
                closeModal();
            };
            finalImg.src = processedData;
        };
        img.src = uploadedImageData;
        uploadedImageData = null;
    } else {
        closeModal();
    }
    
    const uploadInput = document.getElementById('uploadFileInput');
    if (uploadInput) uploadInput.value = '';
    
    const previewDiv = document.getElementById('uploadPreview');
    if (previewDiv) previewDiv.innerHTML = '';
}

function openModal(canvasId) {
    currentCanvasId = canvasId;
    currentCanvas = document.getElementById(canvasId);
    
    const modal = document.getElementById('signatureModal');
    const modalCanvas = document.getElementById('modalCanvas');
    if (modalCanvas) {
        const ctx = modalCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, modalCanvas.width, modalCanvas.height);
        ctx.strokeStyle = '#003c8f';
        ctx.lineWidth = 3;
    }
    
    capturedPhotoData = null;
    uploadedImageData = null;
    const photoPreview = document.getElementById('photoPreviewCapture');
    if (photoPreview) photoPreview.innerHTML = '';
    const uploadPreview = document.getElementById('uploadPreview');
    if (uploadPreview) uploadPreview.innerHTML = '';
    const savePhotoBtn = document.getElementById('savePhotoBtn');
    if (savePhotoBtn) savePhotoBtn.style.display = 'none';
    const uploadInput = document.getElementById('uploadFileInput');
    if (uploadInput) uploadInput.value = '';
    
    selectDraw();
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('signatureModal');
    if (modal) modal.style.display = 'none';
    stopCamera();
    currentCanvasId = null;
    currentCanvas = null;
    modalDrawingActive = false;
}

function hideErrorForCanvas(canvasId) {
    const errorMap = {
        specimenSignature1: 'specimenError1',
        employerSignature: 'employerError'
    };
    const errorId = errorMap[canvasId];
    if (errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) errorElement.style.display = 'none';
    }
}

function showPopup(message, type = 'info', title = '') {
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
        if (popup) popup.remove();
        overlay.remove();
    };
    document.body.appendChild(overlay);
    
    const popup = document.createElement('div');
    popup.className = 'popup-message';
    
    popup.innerHTML = `
        <div style="font-size:48px; margin-bottom:10px;">${icon}</div>
        <div style="font-size:20px; font-weight:600; margin-bottom:10px;">${title}</div>
        <div style="margin-bottom:20px;">${message}</div>
        <button class="popup-btn" onclick="this.closest('.popup-message').parentElement.remove()" style="background:#003c8f; color:white; border:none; padding:8px 25px; border-radius:25px; cursor:pointer;">OK</button>
    `;
    
    document.body.appendChild(popup);
}

function validateFirstForm() {
    let isValid = true;
    
    const firstFormRequired = ['employerName', 'employerId', 'address', 'telephone', 'certName', 'ssNumber', 'specimenName1', 'employerName2'];
    firstFormRequired.forEach(id => {
        const field = document.getElementById(id);
        if (field && !field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#f44336';
        } else if (field) {
            field.style.borderColor = '#ccc';
        }
    });
    
    if (!photoUploaded) {
        isValid = false;
        const photoError = document.getElementById('photoError');
        const photoBox = document.getElementById('photoBox');
        if (photoError) photoError.style.display = 'block';
        if (photoBox) photoBox.style.borderColor = '#f44336';
    } else {
        const photoBox = document.getElementById('photoBox');
        if (photoBox) photoBox.style.borderColor = '#003c8f';
    }
    
    if (!canvasSigned.specimenSignature1) {
        isValid = false;
        const specimenError = document.getElementById('specimenError1');
        if (specimenError) specimenError.style.display = 'block';
    }
    if (!canvasSigned.employerSignature) {
        isValid = false;
        const employerError = document.getElementById('employerError');
        if (employerError) employerError.style.display = 'block';
    }
    
    return isValid;
}

function goToSecondForm() {
    if (validateFirstForm()) {
        autoSaveForm1();
        
        const firstFormData = {
            employerName: document.getElementById('employerName').value,
            employerId: document.getElementById('employerId').value,
            address: document.getElementById('address').value,
            telephone: document.getElementById('telephone').value,
            certName: document.getElementById('certName').value,
            ssNumber: document.getElementById('ssNumber').value,
            specimenName1: document.getElementById('specimenName1').value,
            employerName2: document.getElementById('employerName2').value,
            photo: document.getElementById('photoPreview').src || '',
            specimenSignature1: document.getElementById('specimenSignature1').toDataURL(),
            employerSignature: document.getElementById('employerSignature').toDataURL()
        };
        
        localStorage.setItem('firstFormData', JSON.stringify(firstFormData));
        
        showPopup('First form completed! Proceeding to next step...', 'success', 'SUCCESS!');
        
        setTimeout(function() {
            window.location.href = 'register.html';
        }, 1500);
    } else {
        showPopup('Please fill in all required fields and complete all signatures.', 'error');
    }
}

window.addEventListener('storage', function(e) {
    if (e.key === 'clearForm1AutoSave' && e.newValue === 'true') {
        clearForm1AutoSave();
        localStorage.removeItem('clearForm1AutoSave');
        console.log("🗑️ Form 1 auto-save cleared");
    }
});

window.onload = function() {
    const canvas1 = document.getElementById('specimenSignature1');
    const canvas2 = document.getElementById('employerSignature');
    
    // CHECK IF QR WAS GENERATED - CLEAR AUTO-SAVE FIRST
    const qrGenerated = localStorage.getItem('qrGenerated');
    if (qrGenerated === 'true') {
        clearForm1AutoSave();
        localStorage.removeItem('qrGenerated');
        console.log("🗑️ Cleared auto-save because QR was generated");
    }
    
    // Load auto-save
    const hasSavedData = loadAutoSave();
    
    // Only clear canvases if there's no saved data
    if (!hasSavedData) {
        if (canvas1) clearCanvas('specimenSignature1');
        if (canvas2) clearCanvas('employerSignature');
    }
    
    if (canvas1) initDrawing(canvas1);
    if (canvas2) initDrawing(canvas2);
    
    setupAutoSave();
    
    console.log("✅ Index page loaded, Firebase connected");
};

window.openModal = openModal;
window.closeModal = closeModal;
window.clearModalCanvas = clearModalCanvas;
window.saveDrawSignature = saveDrawSignature;
window.savePhotoSignature = savePhotoSignature;
window.saveUploadSignature = saveUploadSignature;
window.clearCanvas = clearCanvas;
window.goToSecondForm = goToSecondForm;
window.selectDraw = selectDraw;
window.selectCamera = selectCamera;
window.selectUpload = selectUpload;
window.capturePhoto = capturePhoto;