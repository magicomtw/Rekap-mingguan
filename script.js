const TASK_CONFIG = {
    "Jahit": { options: ["Tangan Panjang", "Tangan Pendek", "Gamis Set", "Hijab Segiempat", "Hijab Instan"], defaultPrice: 4000 },
    "QC": { options: ["Pemeriksaan Kualitas", "Buang Benang"], defaultPrice: 1000 },
    "Steam": { options: ["Steam & Lipat", "Steam Lipat + Plastik"], defaultPrice: 1000 },
    "Cutting": { options: ["Potong Kain Utama", "Potong Kombinasi"], defaultPrice: 1500 },
    "Pres Polyplex": { options: ["Pres Logo Brand", "Pres Motif"], defaultPrice: 1200 }
};
const DEFAULT_ITEMS = ["Gamis Syari", "Gamis Polos", "Hijab Instan", "Hijab Segiempat", "Manset Spandek", "Koko Dewasa"];

let workerRecords = JSON.parse(localStorage.getItem('konveksi_records_v2')) || [];
let savedWorkers = JSON.parse(localStorage.getItem('konveksi_workers_v2')) || ["Siti Aminah", "Budi Santoso", "Euis Ratna"];

document.addEventListener("DOMContentLoaded", () => {
    initWorkerDatalist();
    addDynamicRow();
    renderDashboard();
    const now = new Date();
    document.getElementById('periodDisplay').innerText = `Minggu ke-${Math.ceil(now.getDate() / 7)} ${now.toLocaleString('id', { month: 'long' })} ${now.getFullYear()}`;
});

function changeTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
}

function initWorkerDatalist() {
    document.getElementById('workerList').innerHTML = savedWorkers.map(w => `<option value="${w}">`).join('');
}

function addDynamicRow() {
    const tbody = document.getElementById('itemsTbody');
    const rowId = Date.now() + Math.random().toString(36).substring(2, 5);
    const tr = document.createElement('tr');
    tr.id = `row-${rowId}`;
    tr.innerHTML = `
        <td><input type="text" class="input-item-name" list="itemList" placeholder="Pilih/ketik barang..." required><datalist id="itemList">${DEFAULT_ITEMS.map(i => `<option value="${i}">`).join('')}</datalist></td>
        <td><select class="select-task" onchange="handleTaskChange('${rowId}')">${Object.keys(TASK_CONFIG).map(t => `<option value="${t}">${t}</option>`).join('')}</select></td>
        <td><select class="select-detail" id="detail-${rowId}"></select></td>
        <td><input type="number" class="input-qty" min="1" value="10" oninput="calculateRow('${rowId}')" required></td>
        <td><input type="number" class="input-price" min="0" value="4000" oninput="calculateRow('${rowId}')" required></td>
        <td style="text-align: center;"><button type="button" class="btn-icon-del" onclick="removeRow('${rowId}')"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
    handleTaskChange(rowId);
}

function removeRow(rowId) {
    const tbody = document.getElementById('itemsTbody');
    if (tbody.children.length > 1) { document.getElementById(`row-${rowId}`).remove(); updateSummary(); }
    else { Swal.fire('Info', 'Minimal harus ada 1 baris item.', 'info'); }
}

function handleTaskChange(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const task = row.querySelector('.select-task').value;
    const detailSelect = row.querySelector('.select-detail');
    const priceInput = row.querySelector('.input-price');
    const config = TASK_CONFIG[task];
    detailSelect.innerHTML = config.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    priceInput.value = config.defaultPrice;
    calculateRow(rowId);
}

function calculateRow(rowId) {
    updateSummary();
}

function updateSummary() {
    let totalPcs = 0, totalAmount = 0;
    document.querySelectorAll('#itemsTbody tr').forEach(tr => {
        const qty = parseFloat(tr.querySelector('.input-qty').value) || 0;
        const price = parseFloat(tr.querySelector('.input-price').value) || 0;
        totalPcs += qty;
        totalAmount += (qty * price);
    });
    document.getElementById('formTotalSummary').innerText = `${totalPcs} Pcs = ${formatRupiah(totalAmount)}`;
}

function saveWorkerEntry(event) {
    event.preventDefault();
    const workerName = document.getElementById('workerName').value.trim();
    const entryNote = document.getElementById('entryNote').value.trim();
    if (!workerName) return;

    if (!savedWorkers.includes(workerName)) {
        savedWorkers.push(workerName);
        localStorage.setItem('konveksi_workers_v2', JSON.stringify(savedWorkers));
        initWorkerDatalist();
    }

    const items = [];
    document.querySelectorAll('#itemsTbody tr').forEach(tr => {
        const name = tr.querySelector('.input-item-name').value.trim();
        const task = tr.querySelector('.select-task').value;
        const detail = tr.querySelector('.select-detail').value;
        const qty = parseFloat(tr.querySelector('.input-qty').value) || 0;
        const price = parseFloat(tr.querySelector('.input-price').value) || 0;
        if (name && qty > 0) items.push({ name, task, detail, qty, price, subtotal: qty * price });
    });

    if (items.length === 0) { Swal.fire('Peringatan', 'Isi rincian barang dengan benar.', 'warning'); return; }

    workerRecords.push({ id: Date.now(), workerName, entryNote, items });
    localStorage.setItem('konveksi_records_v2', JSON.stringify(workerRecords));

    document.getElementById('boronganForm').reset();
    document.getElementById('itemsTbody').innerHTML = '';
    addDynamicRow();
    renderDashboard();
    Swal.fire('Berhasil!', 'Catatan pekerja berhasil disimpan.', 'success');
}

function renderDashboard() {
    renderPayroll();
    renderSewingReport();
}

function renderPayroll() {
    const tbody = document.getElementById('payrollTbody');
    tbody.innerHTML = '';
    let totalAllPcs = 0;

    if (workerRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Belum ada catatan data minggu ini.</td></tr>`;
        document.getElementById('payrollFooterBadge').innerText = 'Total Item : 0 Pcs';
        return;
    }

    workerRecords.forEach((rec, idx) => {
        let recPcs = 0, recAmount = 0;
        const details = rec.items.map(i => {
            recPcs += i.qty; recAmount += i.subtotal;
            return `• <strong>${i.name}</strong> (${i.detail}) [${i.task}]: ${i.qty} Pcs @ ${formatRupiah(i.price)}`;
        }).join('<br>');
        totalAllPcs += recPcs;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><strong>${rec.workerName}</strong><br><small style="color:var(--text-muted);">${rec.entryNote || ''}</small></td>
            <td>${details}</td>
            <td><strong>${recPcs} Pcs</strong></td>
            <td><strong style="color: var(--primary);">${formatRupiah(recAmount)}</strong></td>
            <td class="no-print" style="text-align: center;"><button class="btn-icon-del" onclick="deleteRecord(${rec.id})"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('payrollFooterBadge').innerText = `Total Item : ${totalAllPcs} Pcs`;
}

function renderSewingReport() {
    const tbody = document.getElementById('sewingTbody');
    tbody.innerHTML = '';
    const sewingMap = {}; let totalSewingPcs = 0;

    workerRecords.forEach(r => r.items.forEach(i => {
        if (i.task === "Jahit") {
            const key = `${i.name}___${i.detail}`;
            sewingMap[key] = (sewingMap[key] || 0) + i.qty;
            totalSewingPcs += i.qty;
        }
    }));

    const keys = Object.keys(sewingMap);
    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Belum ada data pengerjaan jahit minggu ini.</td></tr>`;
        document.getElementById('sewingFooterBadge').innerText = 'Total Item : 0 Pcs';
        return;
    }

    keys.forEach((key, idx) => {
        const [name, detail] = key.split('___');
        const qty = sewingMap[key];
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${idx + 1}</td><td><strong>${name}</strong></td><td>${detail}</td><td><strong>${qty} Pcs</strong></td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('sewingFooterBadge').innerText = `Total Item : ${totalSewingPcs} Pcs`;
}

function deleteRecord(id) {
    Swal.fire({ title: 'Hapus data ini?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya' }).then(res => {
        if (res.isConfirmed) {
            workerRecords = workerRecords.filter(r => r.id !== id);
            localStorage.setItem('konveksi_records_v2', JSON.stringify(workerRecords));
            renderDashboard();
        }
    });
}

function confirmResetAll() {
    Swal.fire({ title: 'Reset semua data?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Kosongkan' }).then(res => {
        if (res.isConfirmed) {
            workerRecords = []; localStorage.removeItem('konveksi_records_v2'); renderDashboard();
        }
    });
}

/* FUNGSI EKSPOR DENGAN PENYESUAIAN BAHASA INDONESIA */
function getTemporaryExportTable(containerId) {
    const originalSection = document.getElementById(containerId);
    const clone = originalSection.cloneNode(true);
    
    // Terjemahkan header tabel kloningan ke Bahasa Indonesia sebelum diunduh
    clone.querySelectorAll('th').forEach(th => {
        let text = th.innerText.trim();
        if (text === 'Nami Padamel') th.innerText = 'Nama Pekerja';
        if (text === 'Rincian Padamelan Selesai') th.innerText = 'Rincian Pekerjaan Selesai';
        if (text === 'Total Upah Gajih') th.innerText = 'Total Upah Gaji';
        if (text === 'Nami Barang') th.innerText = 'Nama Barang';
        if (text === 'Wangun / Variasi') th.innerText = 'Jenis / Variasi';
        if (text === 'Total Produksi Jahit') th.innerText = 'Total Produksi Jahit';
        if (text === 'Aksi') th.innerText = '';
    });

    // Hapus kolom tombol aksi pada tabel kloningan agar tidak ikut terunduh
    clone.querySelectorAll('tr').forEach(tr => {
        const lastCell = tr.lastElementChild;
        if (lastCell && (lastCell.classList.contains('no-print') || lastCell.innerHTML.includes('trash'))) {
            lastCell.remove();
        }
    });

    return clone;
}

function exportTablePNG(id, filename) {
    const exportElement = getTemporaryExportTable(id);
    document.body.appendChild(exportElement);
    exportElement.style.position = 'absolute';
    exportElement.style.left = '-9999px';

    html2canvas(exportElement, { scale: 2 }).then(canvas => {
        const link = document.createElement('a'); 
        link.download = `${filename}.png`; 
        link.href = canvas.toDataURL(); 
        link.click();
        exportElement.remove();
    });
}

function exportTablePDF(id, filename) {
    const exportElement = getTemporaryExportTable(id);
    document.body.appendChild(exportElement);
    exportElement.style.position = 'absolute';
    exportElement.style.left = '-9999px';

    html2pdf().set({ 
        margin: 0.5, 
        filename: `${filename}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2 }, 
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
    }).from(exportElement).save().then(() => {
        exportElement.remove();
    });
}

function exportExcel(id, filename) {
    const exportElement = getTemporaryExportTable(id);
    const table = exportElement.querySelector('table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Laporan" });
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

function formatRupiah(num) { return 'Rp ' + num.toLocaleString('id-ID'); }
