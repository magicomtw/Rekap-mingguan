/* ==========================================================================
   MASTER DATA & INITIAL CONFIGURATION
   ========================================================================== */

// Data Pilihan Cascading (Tugas & Tarif Standar)
const TASK_CONFIG = {
    "Jahit": {
        badgeClass: "task-jahit",
        options: ["Tangan Panjang", "Tangan Pendek", "Gamis Set", "Hijab Segiempat", "Hijab Instan", "Manset Badan"],
        defaultPrice: 4000
    },
    "QC": {
        badgeClass: "task-qc",
        options: ["Pemeriksaan Kualitas", "Buang Benang"],
        defaultPrice: 1000
    },
    "Steam": {
        badgeClass: "task-steam",
        options: ["Steam & Lipat", "Steam Lipat + Plastik"],
        defaultPrice: 1000
    },
    "Cutting": {
        badgeClass: "task-cutting",
        options: ["Potong Kain Utama", "Potong Kombinasi/Renda"],
        defaultPrice: 1500
    },
    "Pres Polyplex": {
        badgeClass: "task-polyplex",
        options: ["Pres Logo Brand", "Pres Motif/Variasi"],
        defaultPrice: 1200
    }
};

const DEFAULT_ITEMS = ["Gamis Syari", "Gamis Polos", "Hijab Instan", "Hijab Segiempat", "Manset Spandek", "Koko Dewasa"];

// LocalStorage State
let workerRecords = JSON.parse(localStorage.getItem('konveksi_records')) || [];
let savedWorkers = JSON.parse(localStorage.getItem('konveksi_workers')) || ["Siti Aminah", "Budi Santoso", "Euis Ratna"];

/* ==========================================================================
   INITIALIZATION ON PAGE LOAD
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Render awal
    initWorkerDatalist();
    addDynamicRow(); // Tambah 1 baris input default
    renderDashboard();

    // Set Nama Periode Minggu Ini
    const now = new Date();
    const periodText = `Minggu ke-${Math.ceil(now.getDate() / 7)} ${now.toLocaleString('id', { month: 'Long' })} ${now.getFullYear()}`;
    document.getElementById('periodDisplay').innerText = periodText;
    document.getElementById('printPeriod1').innerText = `Periode: ${periodText}`;
    document.getElementById('printPeriod2').innerText = `Periode: ${periodText}`;
});

/* ==========================================================================
   THEME SWITCHER
   ========================================================================== */
function changeTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
}

/* ==========================================================================
   DYNAMIC FORM FUNCTIONS (DYNAMIC ROWS & CASCADING)
   ========================================================================== */
function initWorkerDatalist() {
    const datalist = document.getElementById('workerList');
    datalist.innerHTML = savedWorkers.map(w => `<option value="${w}">`).join('');
}

function addDynamicRow() {
    const tbody = document.getElementById('itemsTbody');
    const rowId = Date.now() + Math.random().toString(36).substring(2, 5);

    const tr = document.createElement('tr');
    tr.id = `row-${rowId}`;
    tr.innerHTML = `
        <td>
            <input type="text" class="input-item-name" list="itemList" placeholder="Pilih/ketik barang..." required>
            <datalist id="itemList">
                ${DEFAULT_ITEMS.map(i => `<option value="${i}">`).join('')}
            </datalist>
        </td>
        <td>
            <select class="select-task" onchange="handleTaskChange('${rowId}')">
                ${Object.keys(TASK_CONFIG).map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
        </td>
        <td>
            <select class="select-detail" id="detail-${rowId}">
                <!-- Populated via Cascading -->
            </select>
        </td>
        <td>
            <input type="number" class="input-qty" min="1" value="10" oninput="calculateRowSubtotal('${rowId}')" required>
        </td>
        <td>
            <input type="number" class="input-price" min="0" value="4000" oninput="calculateRowSubtotal('${rowId}')" required>
        </td>
        <td>
            <strong class="row-subtotal" id="subtotal-${rowId}">Rp 40.000</strong>
        </td>
        <td>
            <button type="button" class="btn-icon-danger" onclick="removeDynamicRow('${rowId}')">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
    handleTaskChange(rowId); // Populasi pertama
}

function removeDynamicRow(rowId) {
    const tbody = document.getElementById('itemsTbody');
    if (tbody.children.length > 1) {
        document.getElementById(`row-${rowId}`).remove();
        updateFormTotalSummary();
    } else {
        Swal.fire('Info', 'Minimal harus ada 1 item barang!', 'info');
    }
}

function handleTaskChange(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const task = row.querySelector('.select-task').value;
    const detailSelect = row.querySelector('.select-detail');
    const priceInput = row.querySelector('.input-price');

    const config = TASK_CONFIG[task];
    detailSelect.innerHTML = config.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    priceInput.value = config.defaultPrice;

    calculateRowSubtotal(rowId);
}

function calculateRowSubtotal(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const qty = parseFloat(row.querySelector('.input-qty').value) || 0;
    const price = parseFloat(row.querySelector('.input-price').value) || 0;
    const subtotal = qty * price;

    row.querySelector('.row-subtotal').innerText = formatRupiah(subtotal);
    updateFormTotalSummary();
}

function updateFormTotalSummary() {
    let totalPcs = 0;
    let totalAmount = 0;

    document.querySelectorAll('#itemsTbody tr').forEach(tr => {
        const qty = parseFloat(tr.querySelector('.input-qty').value) || 0;
        const price = parseFloat(tr.querySelector('.input-price').value) || 0;
        totalPcs += qty;
        totalAmount += (qty * price);
    });

    document.getElementById('formTotalSummary').innerText = `${totalPcs} Pcs = ${formatRupiah(totalAmount)}`;
}

/* ==========================================================================
   SAVE & RENDER DASHBOARD
   ========================================================================== */
function saveWorkerEntry(event) {
    event.preventDefault();

    const workerName = document.getElementById('workerName').value.trim();
    const entryNote = document.getElementById('entryNote').value.trim();

    if (!workerName) return;

    // Simpan nama baru ke master list jika belum ada
    if (!savedWorkers.includes(workerName)) {
        savedWorkers.push(workerName);
        localStorage.setItem('konveksi_workers', JSON.stringify(savedWorkers));
        initWorkerDatalist();
    }

    const items = [];
    document.querySelectorAll('#itemsTbody tr').forEach(tr => {
        const name = tr.querySelector('.input-item-name').value.trim();
        const task = tr.querySelector('.select-task').value;
        const detail = tr.querySelector('.select-detail').value;
        const qty = parseFloat(tr.querySelector('.input-qty').value) || 0;
        const price = parseFloat(tr.querySelector('.input-price').value) || 0;

        if (name && qty > 0) {
            items.push({ name, task, detail, qty, price, subtotal: qty * price });
        }
    });

    if (items.length === 0) {
        Swal.fire('Peringatan', 'Silakan isi rincian barang dengan benar.', 'warning');
        return;
    }

    const entryRecord = {
        id: Date.now(),
        workerName,
        entryNote,
        date: new Date().toLocaleDateString('id-ID'),
        items
    };

    workerRecords.push(entryRecord);
    localStorage.setItem('konveksi_records', JSON.stringify(workerRecords));

    // Reset Form Input
    document.getElementById('boronganForm').reset();
    document.getElementById('itemsTbody').innerHTML = '';
    addDynamicRow();

    renderDashboard();
    Swal.fire('Berhasil!', `Catatan milik ${workerName} berhasil disimpan.`, 'success');
}

function renderDashboard() {
    renderStats();
    renderPayrollTable();
    renderSewingReportTable();
}

function renderStats() {
    const uniqueWorkers = new Set(workerRecords.map(r => r.workerName)).size;
    let totalPcs = 0;
    let totalPayroll = 0;

    workerRecords.forEach(r => {
        r.items.forEach(i => {
            totalPcs += i.qty;
            totalPayroll += i.subtotal;
        });
    });

    document.getElementById('statWorkers').innerText = `${uniqueWorkers} Orang`;
    document.getElementById('statPcs').innerText = `${totalPcs.toLocaleString('id-ID')} Pcs`;
    document.getElementById('statPayroll').innerText = formatRupiah(totalPayroll);
}

function renderPayrollTable() {
    const tbody = document.getElementById('payrollTbody');
    tbody.innerHTML = '';

    let grandTotalPcs = 0;
    let grandTotalAmount = 0;

    if (workerRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary);">Belum ada catatan borongan yang dimasukkan minggu ini.</td></tr>`;
        document.getElementById('totalPcsPayroll').innerText = '0 Pcs';
        document.getElementById('totalAmountPayroll').innerText = 'Rp 0';
        return;
    }

    workerRecords.forEach((rec, idx) => {
        let recPcs = 0;
        let recAmount = 0;

        const itemDetails = rec.items.map(i => {
            recPcs += i.qty;
            recAmount += i.subtotal;
            const badgeClass = TASK_CONFIG[i.task]?.badgeClass || 'task-jahit';
            return `• <strong>${i.name}</strong> (${i.detail}) - <span class="badge-task ${badgeClass}">${i.task}</span>: ${i.qty} Pcs @ ${formatRupiah(i.price)}`;
        }).join('<br>');

        grandTotalPcs += recPcs;
        grandTotalAmount += recAmount;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><strong>${rec.workerName}</strong><br><small style="color:var(--text-secondary);">${rec.entryNote || ''}</small></td>
            <td>${itemDetails}</td>
            <td><strong>${recPcs} Pcs</strong></td>
            <td><strong style="color: var(--primary);">${formatRupiah(recAmount)}</strong></td>
            <td class="no-print">
                <button class="btn-icon-danger" onclick="deleteRecord(${rec.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('totalPcsPayroll').innerText = `${grandTotalPcs} Pcs`;
    document.getElementById('totalAmountPayroll').innerText = formatRupiah(grandTotalAmount);
}

function renderSewingReportTable() {
    const tbody = document.getElementById('sewingTbody');
    tbody.innerHTML = '';

    // Agregasi khusus untuk tugas "Jahit"
    const sewingMap = {};
    let totalSewingPcs = 0;

    workerRecords.forEach(r => {
        r.items.forEach(i => {
            if (i.task === "Jahit") {
                const key = `${i.name}___${i.detail}`;
                sewingMap[key] = (sewingMap[key] || 0) + i.qty;
                totalSewingPcs += i.qty;
            }
        });
    });

    const keys = Object.keys(sewingMap);
    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">Belum ada data pengerjaan Jahit minggu ini.</td></tr>`;
        document.getElementById('totalSewingPcs').innerText = '0 Pcs';
        return;
    }

    keys.forEach((key, idx) => {
        const [itemName, itemDetail] = key.split('___');
        const qty = sewingMap[key];

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><strong>${itemName}</strong></td>
            <td>${itemDetail}</td>
            <td><strong>${qty} Pcs</strong></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('totalSewingPcs').innerText = `${totalSewingPcs} Pcs`;
}

function deleteRecord(recordId) {
    Swal.fire({
        title: 'Hapus Catatan ini?',
        text: 'Data yang dihapus tidak dapat dikembalikan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Hapus'
    }).then((result) => {
        if (result.isConfirmed) {
            workerRecords = workerRecords.filter(r => r.id !== recordId);
            localStorage.setItem('konveksi_records', JSON.stringify(workerRecords));
            renderDashboard();
            Swal.fire('Terhapus', 'Catatan telah dihapus.', 'success');
        }
    });
}

function confirmResetAll() {
    Swal.fire({
        title: 'Reset Semua Data Minggu Ini?',
        text: 'Semua rekapitulasi gaji dan catatan barang akan dikosongkan untuk minggu baru.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Kosongkan Semua'
    }).then((result) => {
        if (result.isConfirmed) {
            workerRecords = [];
            localStorage.removeItem('konveksi_records');
            renderDashboard();
            Swal.fire('Selesai', 'Data minggu ini telah dibersihkan.', 'success');
        }
    });
}

/* ==========================================================================
   EXPORT FUNCTIONS (PNG, PDF, EXCEL)
   ========================================================================== */
function exportTablePNG(elementId, filename) {
    const target = document.getElementById(elementId);
    html2canvas(target, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${filename}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function exportTablePDF(elementId, filename) {
    const target = document.getElementById(elementId);
    const opt = {
        margin:       0.5,
        filename:     `${filename}_${Date.now()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(target).save();
}

function exportExcel(elementId, filename) {
    const table = document.getElementById(elementId).querySelector('table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Laporan" });
    XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`);
}

function formatRupiah(number) {
    return 'Rp ' + number.toLocaleString('id-ID');
}
