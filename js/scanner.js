// scanner.js
// Mengatur Kamera HTML5-QRCode, Input USB, dan Audio Beep

// --- Audio API (Beep Sound) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playBeep() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000 Hz
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 100);
}

export function playError() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(250, audioCtx.currentTime); // Nada Buzzer 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 300);
}

// --- Inisialisasi Scanner ---
let scannerInitialized = false;

// Event listener yang dipanggil setelah login berhasil
document.addEventListener("dashboardReady", () => {
    if (!scannerInitialized) {
        initCameraScanner();
        initUSBScanner();
        scannerInitialized = true;
    }
});

function initCameraScanner() {
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", { fps: 10, qrbox: 250 }, false
    );
    
    html5QrcodeScanner.render(
        (decodedText, decodedResult) => {
            html5QrcodeScanner.pause(true); // Jeda kamera sebentar
            if(window.processScan) {
                window.processScan(decodedText);
            }
            setTimeout(() => html5QrcodeScanner.resume(), 2500); // Lanjut setelah 2.5 dtk
        },
        (errorMessage) => {
            // Ignore background error
        }
    );
}

function initUSBScanner() {
    const usbInput = document.getElementById("usb-scanner-input");
    usbInput.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            const barcode = usbInput.value.trim();
            if (barcode !== "") {
                if(window.processScan) window.processScan(barcode);
                usbInput.value = ""; // Kosongkan form siap untuk scan berikutnya
            }
        }
    });
    
    // Auto-focus USB scanner jika user klik area kosong di dashboard
    document.getElementById("main-dashboard").addEventListener("click", (e) => {
        if(e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") {
            usbInput.focus();
        }
    });
}
