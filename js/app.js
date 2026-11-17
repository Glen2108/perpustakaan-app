// app.js
// Mengatur Logika Login, Tampilan UI, Export Data, dan Data Firestore Real-time
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import { playBeep, playError } from './scanner.js';

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State Export Data
let dbRiwayat = [];

// Konfigurasi Kustom SweetAlert2 (Toast)
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // --- Sistem Login ---
    const loginBtn = document.getElementById("login-btn");
    const pinInput = document.getElementById("pin-input");
    const loginOverlay = document.getElementById("login-overlay");
    const mainDashboard = document.getElementById("main-dashboard");
    
    pinInput.addEventListener("keyup", (e) => { if(e.key === "Enter") loginBtn.click(); });

    loginBtn.addEventListener("click", () => {
        if (pinInput.value === "1234") {
            // Animasi Loading SweetAlert2
            Swal.fire({
                title: 'Memverifikasi...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            setTimeout(() => {
                loginOverlay.style.display = 'none';
                mainDashboard.classList.remove("hidden");
                document.dispatchEvent(new Event("dashboardReady"));
                muatRiwayatRealtime(); // Panggil fungsi realtime Firestore
                
                Swal.fire({ icon: 'success', title: 'Akses Diberikan', timer: 1500, showConfirmButton: false });
            }, 800); // Simulasi jeda loading
            
        } else {
            Swal.fire({ icon: 'error', title: 'PIN Salah', text: 'Silakan gunakan PIN: 1234' });
            pinInput.value = '';
        }
    });

    // --- Sistem Export CSV (Dengan Konfirmasi SweetAlert2) ---
    document.getElementById("export-btn").addEventListener("click", () => {
        if (dbRiwayat.length === 0) {
            Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Belum ada data untuk diekspor hari ini.' });
            return;
        }

        Swal.fire({
            title: 'Ekspor Data?',
            text: `Anda akan mengunduh ${dbRiwayat.length} data riwayat ke format CSV.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a', // hijau tailwind
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Ekspor!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                let csvContent = "data:text/csv;charset=utf-8,Waktu,ID Anggota,Nama,Status\n";
                dbRiwayat.forEach(row => {
                    csvContent += `${row.waktu},${row.id},${row.nama},${row.status}\n`;
                });
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Data_Perpustakaan_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link); 
                link.click(); 
                document.body.removeChild(link);

                Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'File CSV sedang diunduh.', timer: 2000, showConfirmButton: false });
            }
        });
    });
});

// --- Menampilkan Riwayat Kunjungan Real-time (Membaca dari Firestore) ---
function muatRiwayatRealtime() {
    const historyTable = document.getElementById("history-table");
    const q = query(collection(db, "riwayat_kunjungan"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        historyTable.innerHTML = ""; 
        dbRiwayat = []; 
        
        if (snapshot.empty) {
            historyTable.innerHTML = `<tr><td colspan="4" class="p-8 text-center italic text-gray-400">Belum ada riwayat.</td></tr>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let timeStr = "Waktu tidak diketahui";
            if (data.timestamp) {
                const dateObj = data.timestamp.toDate();
                timeStr = dateObj.toLocaleTimeString('id-ID') + " - " + dateObj.toLocaleDateString('id-ID');
            }
            
            dbRiwayat.push({ waktu: timeStr.replace(/,/g, ''), id: data.id_anggota, nama: data.nama, status: data.tipe });

            const tr = document.createElement("tr");
            tr.className = "border-b border-gray-100 highlight-row text-sm";
            tr.innerHTML = `
                <td class="p-3 text-gray-500">${timeStr}</td>
                <td class="p-3 font-mono">${data.id_anggota}</td>
                <td class="p-3 font-semibold text-gray-700">${data.nama}</td>
                <td class="p-3"><span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">${data.tipe}</span></td>
            `;
            historyTable.appendChild(tr);
        });
    });
}

// --- Fungsi Global Proses Scan (Menulis & Membaca Firestore) ---
window.processScan = async function(barcodeText) {
    const memberInfoBox = document.getElementById("member-info");
    
    try {
        const docRef = doc(db, "anggota", barcodeText);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            playBeep();
            const member = docSnap.data();
            
            memberInfoBox.innerHTML = `
                <div class="flex flex-col gap-2 text-sm sm:text-base">
                    <p><strong>Nama:</strong> <span class="text-gray-800 uppercase">${member.nama}</span></p>
                    <p><strong>ID:</strong> <span class="font-mono bg-gray-100 px-1 rounded">${barcodeText}</span></p>
                    <p><strong>Alamat:</strong> ${member.alamat}</p>
                    <p><strong>Telepon:</strong> ${member.telepon}</p>
                    <p><strong>Masa Berlaku:</strong> ${member.masa_berlaku}</p>
                    <div class="mt-3"><span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-300">Status Kartu: AKTIF</span></div>
                </div>
            `;
            
            await addDoc(collection(db, "riwayat_kunjungan"), {
                id_anggota: barcodeText,
                nama: member.nama,
                tipe: "Hadir / Pinjam",
                timestamp: serverTimestamp()
            });

            // Menggunakan Toast kustom
            Toast.fire({
                icon: 'success',
                title: 'Tercatat: ' + member.nama
            });
            
        } else {
            playError();
            memberInfoBox.innerHTML = `
                <div class="bg-red-50 text-red-600 border border-red-200 p-4 rounded-lg text-center mt-2">
                    <svg class="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <p class="font-bold">ID ${barcodeText} Tidak Ditemukan!</p>
                    <p class="text-sm">Kartu tidak terdaftar dalam sistem.</p>
                </div>
            `;
            // Modal Error untuk peringatan keras
            Swal.fire({ icon: 'warning', title: 'Anggota Tidak Dikenal', text: `ID Barcode: ${barcodeText} tidak ditemukan.`, timer: 2500 });
        }
    } catch (error) {
        console.error("Error mengakses Firestore:", error);
        Swal.fire({ icon: 'error', title: 'Koneksi Gagal', text: 'Pastikan internet stabil dan Firebase sudah dikonfigurasi dengan benar.' });
    }
}
