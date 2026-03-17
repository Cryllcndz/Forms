let photoUploaded = false;

document.getElementById('photoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            const placeholder = document.getElementById('photoPlaceholder');
            
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            photoUploaded = true;
            document.getElementById('photoError').style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
});

function validateNameInput(event) {
    const input = event.target;
    input.value = input.value.replace(/[^a-zA-Z\s.-]/g, '');
}

function validateEmployerId(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9-]/g, '');
    let value = input.value.replace(/-/g, '');
    if (value.length > 2) {
        value = value.slice(0,2) + '-' + value.slice(2);
    }
    if (value.length > 11) {
        value = value.slice(0,11) + '-' + value.slice(11,12);
    }
    if (value.length > 13) {
        value = value.slice(0,13);
    }
    input.value = value;
}

function validateSSNumber(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9-]/g, '');
    let value = input.value.replace(/-/g, '');
    if (value.length > 2) {
        value = value.slice(0,2) + '-' + value.slice(2);
    }
    if (value.length > 11) {
        value = value.slice(0,11) + '-' + value.slice(11,12);
    }
    if (value.length > 13) {
        value = value.slice(0,13);
    }
    input.value = value;
}

function validateTelephone(event) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9+\s]/g, '');
}

function validateAddress(event) {
    const input = event.target;
    input.value = input.value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
}

document.getElementById('employerName').addEventListener('input', validateNameInput);
document.getElementById('specimenName1').addEventListener('input', validateNameInput);
document.getElementById('employerName2').addEventListener('input', validateNameInput);
document.getElementById('certName').addEventListener('input', validateNameInput);
document.getElementById('employerId').addEventListener('input', validateEmployerId);
document.getElementById('ssNumber').addEventListener('input', validateSSNumber);
document.getElementById('telephone').addEventListener('input', validateTelephone);
document.getElementById('address').addEventListener('input', validateAddress);

let currentCanvas = null;
let currentCanvasId = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

const canvasSigned = {
    specimenSignature1: false,
    employerSignature: false
};

window.onload = function() {
    const canvases = [
        'specimenSignature1', 'employerSignature'
    ];
    canvases.forEach(id => clearCanvas(id));
};

function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#003c8f';
    ctx.lineWidth = 2;
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
    currentCanvasId = null;
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
        
        const imageData = ctx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
        const data = imageData.data;
        let hasDrawing = false;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 255 || data[i+1] < 255 || data[i+2] < 255) {
                hasDrawing = true;
                break;
            }
        }
        
        canvasSigned[currentCanvasId] = hasDrawing;
        
        hideErrorForCanvas(currentCanvasId);
    }
    closeModal();
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
            <button class="popup-btn primary" onclick="closePopup()">OK</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    window.closePopup = function() {
        popup.remove();
        overlay.remove();
    };
    
    if (autoClose) {
        setTimeout(() => {
            if (document.body.contains(popup)) {
                popup.remove();
                overlay.remove();
            }
        }, 3000);
    }
}

function validateFirstForm() {
    let isValid = true;
    
    const firstFormRequired = [
        'employerName', 'employerId', 'address', 'telephone',
        'certName', 'ssNumber', 'specimenName1', 'employerName2'
    ];
    
    firstFormRequired.forEach(id => {
        const field = document.getElementById(id);
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#f44336';
        } else {
            field.style.borderColor = '#ccc';
        }
    });
    
    if (!photoUploaded) {
        isValid = false;
        document.getElementById('photoError').style.display = 'block';
        document.getElementById('photoBox').style.borderColor = '#f44336';
    } else {
        document.getElementById('photoBox').style.borderColor = '#003c8f';
    }
    
    if (!canvasSigned.specimenSignature1) {
        isValid = false;
        document.getElementById('specimenError1').style.display = 'block';
    }
    if (!canvasSigned.employerSignature) {
        isValid = false;
        document.getElementById('employerError').style.display = 'block';
    }
    
    return isValid;
}

function goToSecondForm() {
    if (validateFirstForm()) {
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
        
        showPopup('First form completed! Proceeding to instructions...', 'success', 'SUCCESS!');
        
        setTimeout(() => {
            window.location.href = 'register.html';
        }, 2000);
    } else {
        showPopup('Please fill in all required fields and complete all signatures.', 'error');
    }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.clearModalCanvas = clearModalCanvas;
window.saveSignature = saveSignature;
window.clearCanvas = clearCanvas;
window.goToSecondForm = goToSecondForm;