const ITEM_DATABASE = {
    "Gamis uv": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Gamis kaos": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Tunik kaos": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Bergo kaos panjang": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Rok kaos": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Bergo kaos mini": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Phasmina instan neyrins": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Hijab/bergo olahraga": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Ciput": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Celamis": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Bergo": { types: ["anak", "nonpad", "short", "medium", "long"], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Manset": { types: ["baju", "umroh", "long knit", "ring", "jempol"], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Kaftan": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Inner": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Inner gamis": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Pallazo": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Hijab segi 4 instan": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Inner ciput": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Gamis abaya": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Khimar": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] },
    "Abaya embroidry": { types: [], sizes: ["s", "m", "l", "xl", "allsize"] }
};

const TASK_CONFIG = {
    "Jahit": 4000,
    "QC": 1000,
    "Steam": 1000,
    "Cutting": 1500,
    "Pres Polyplex": 1200
};

let workerRecords = JSON.parse(localStorage.getItem('konveksi_records_v3')) || [];
let savedWorkers = JSON.parse(localStorage.getItem('konveksi_workers_v3')) || ["Siti Aminah", "Budi Santoso", "Euis Ratna"];

document.addEventListener("DOMContentLoaded", () => {
    initWorkerDatalist();
    addDynamicRow();
    renderDashboard();
    
    const now = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('periodDisplay').innerText = now.toLocaleDateString('id-ID', options);
});

function changeTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
}

function initWorkerDatalist() {
    document.getElementById('workerList').innerHTML = savedWorkers.map(w => `<option value="${w}">`).join('');
}

function addDynamicRow(prefill = {}) {
    const tbody = document.getElementById('itemsTbody');
    const rowId = Date.now() + Math.random().toString(36).substring(2, 5);
    const tr = document.createElement('tr');
    tr.id = `row-${rowId}`;

    const itemNameListId = `itemList-${rowId}`;
    const typeListId = `typeList-${rowId}`;
    const sizeListId = `sizeList-${rowId}`;

    const itemNames = Object.keys(ITEM_DATABASE);

    tr.innerHTML = `
        <td>
            <input type="text" class="input-item-name" list="${itemNameListId}" value="${prefill.name || ''}" placeholder="Pilih/ketik..." required autocomplete="off" oninput="handleItemNameInput('${rowId}')">
            <datalist id="${itemNameListId}">
                ${itemNames.map(i => `<option value="${i}">`).join('')}
            </datalist>
        </td>
        <td>
            <input type="text" class="input-item-type" list="${typeListId}" value="${prefill.type || ''}" placeholder="Jenis..." autocomplete="off">
            <datalist id="${typeListId}"></datalist>
        </td>
        <td>
            <input type="text" class="input-item-size" list="${sizeListId}" value="${prefill.size || ''}" placeholder="Ukuran..." required autocomplete="off">
            <datalist id="${sizeListId}"></datalist>
        </td>
        <td><input type="text" class="input-item-color" value="${prefill.color || ''}" placeholder="Warna..." required></td>
        <td>
            <select class="select-task" onchange="handleTaskChange('${rowId}')">
                ${Object.keys(TASK_CONFIG).map(t => `<option value="${t}" ${prefill.task === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
        </td>
        <td><input type="number" class="input-qty" min="1" value="${prefill.qty || 10}" oninput="calculateRow('${rowId}')" required></td>
        <td><input type="number" class="input-price" min="0" value="${prefill.price !== undefined ? prefill.price : 4000}" oninput="calculateRow('${rowId}')" required></td>
        <td><input type="text" class="input-subtotal" value="Rp 0" readonly style="font-weight:700; color:var(--primary);"></td>
        <td style="text-align: center;"><button type="button" class="btn-icon-del" onclick="removeRow('${rowId}')"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
    
    updateTypeAndSizeLists(rowId, prefill.name || '', false);
    if(prefill.price === undefined) {
        handleTaskChange(rowId);
    } else {
        calculateRow(rowId);
    }
}

function removeRow(rowId) {
    const tbody = document.getElementById('itemsTbody');
    if (tbody.children.length > 1) { 
        document.getElementById(`row-${rowId}`).remove(); 
        updateSummary(); 
    } else { 
        Swal.fire('Info', 'Minimal harus ada 1 baris item.', 'info'); 
    }
}

function handleItemNameInput(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const nameVal = row.querySelector('.input-item-name').value.trim();
    updateTypeAndSizeLists(rowId, nameVal, true);
    updateSummary();
}

function updateTypeAndSizeLists(rowId, itemName, resetFields = false) {
    const row = document.getElementById(`row-${rowId}`);
    const typeInput = row.querySelector('.input-item-type');
    const typeList = row.querySelector(`datalist[id^="typeList-"]`);
    const sizeInput = row.querySelector('.input-item-size');
    const sizeList = row.querySelector(`datalist[id^="sizeList-"]`);

    const data = ITEM_DATABASE[itemName];

    if (data) {
        typeList.innerHTML = data.types.map(t => `<option value="${t}">`).join('');
        sizeList.innerHTML = data.sizes.map(s => `<option value="${s}">`).join('');
        
        if (resetFields) {
            typeInput.value = "";
            sizeInput.value = "";
        }
    } else {
        typeList.innerHTML = "";
        sizeList.innerHTML = "";
    }
}

function handleTaskChange(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const task = row.querySelector('.select-task').value;
    const priceInput = row.querySelector('.input-price');
    priceInput.value = TASK_CONFIG[task] || 1000;
    calculateRow(rowId);
}

function calculateRow(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const qty = parseFloat(row.querySelector('.input-qty').value) || 0;
    const price = parseFloat(row.querySelector('.input-price').value) || 0;
    const subtotal = qty * price;
    row.querySelector('.input-subtotal').value = formatRupiah(subtotal);
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
    const editIndex = document.getElementById('editIndex').value;
    if (!workerName) return;

    if (!savedWorkers.includes(workerName)) {
        savedWorkers.push(workerName);
        localStorage.setItem('konveksi_workers_v3', JSON.stringify(savedWorkers));
        initWorkerDatalist();
    }

    const items = [];
    document.querySelectorAll('#itemsTbody tr').forEach(tr => {
        const name = tr.querySelector('.input-item-name').value.trim();
        const type = tr.querySelector('.input-item-type').value.trim();
        const size = tr.querySelector('.input-item-size').value.trim();
        const color = tr.querySelector('.input-item-color').value.trim();
        const task = tr.querySelector('.select-task').value;
        const qty = parseFloat(tr.querySelector('.input-qty').value) || 0;
        const price = parseFloat(tr.querySelector('.input-price').value) || 0;
        
        if (name && qty > 0) {
            items.push({ name, type, size, color, task, qty, price, subtotal: qty * price });
        }
    });

    if (items.length === 0) { 
        Swal.fire('Peringatan', 'Isi rincian barang dengan benar.', 'warning'); 
        return; 
    }

    if (editIndex !== "") {
        workerRecords[parseInt(editIndex)] = { id: workerRecords[parseInt(editIndex)].id, workerName, items };
        document.getElementById('editIndex').value = "";
        document.getElementById('formTitle').innerHTML = `<i class="fa-solid fa-pen-nib"></i> Lebetkeun Catetan Borongan Padamel`;
        document.getElementById('submitBtn').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpen Catetan`;
    } else {
        workerRecords.push({ id: Date.now(), workerName, items });
    }

    localStorage.setItem('konveksi_records_v3', JSON.stringify(workerRecords));

    document.getElementById('boronganForm').reset();
    document.getElementById('itemsTbody').innerHTML = '';
    addDynamicRow();
    renderDashboard();
    Swal.fire('Berhasil!', 'Catatan padamel berhasil disimpen.', 'success');
}

function renderDashboard() {
    renderPayroll();
    renderSewingReport();
}

function renderPayroll() {
    const tbody = document.getElementById('payrollTbody');
    tbody.innerHTML = '';
    let totalAllNominal = 0;
    const workerTotals = {};

    if (workerRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--text-muted);">Teu waka aya catetan data minggu ieu.</td></tr>`;
        document.getElementById('totalNominalPayrollBadge').innerText = 'Total Sadaya Gajih: Rp 0';
        document.getElementById('workerSummaryList').innerText = '-';
        return;
    }

    let globalNo = 1;
    workerRecords.forEach((rec, recIdx) => {
        let workerSum = 0;
        rec.items.forEach(item => {
            workerSum += item.subtotal;
            totalAllNominal += item.subtotal;
        });
        workerTotals[rec.workerName] = (workerTotals[rec.workerName] || 0) + workerSum;
    });

    let summaryHtml = '';
    for (const [wName, wTotal] of Object.entries(workerTotals)) {
        summaryHtml += `<span style="background: var(--card-bg); padding: 4px 10px; border-radius: 8px; border: 1px solid var(--card-border);"><strong>${wName}:</strong> ${formatRupiah(wTotal)}</span>`;
    }
    document.getElementById('workerSummaryList').innerHTML = summaryHtml;

    workerRecords.forEach((rec, recIdx) => {
        rec.items.forEach((item, itemIdx) => {
            const tr = document.createElement('tr');
            
            let actionTd = '';
            if (itemIdx === 0) {
                actionTd = `<td rowspan="${rec.items.length}" class="no-print" style="text-align: center; vertical-align: middle;">
                    <div style="display: flex; gap: 4px; justify-content: center;">
                        <button class="btn-icon-edit" onclick="editRecord(${recIdx})" title="Édit"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon-del" onclick="deleteRecord(${rec.id})" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>`;
            }

            tr.innerHTML = `
                <td>${itemIdx === 0 ? globalNo++ : ''}</td>
                <td>${itemIdx === 0 ? `<strong>${rec.workerName}</strong>` : ''}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.type || '-'}</td>
                <td>${item.size || '-'}</td>
                <td>${item.color || '-'}</td>
                <td>${item.task}</td>
                <td><strong>${item.qty} Pcs</strong></td>
                <td><strong style="color: var(--primary);">${formatRupiah(item.subtotal)}</strong></td>
                ${actionTd}
            `;
            tbody.appendChild(tr);
        });
    });

    document.getElementById('totalNominalPayrollBadge').innerText = `Total Sadaya Gajih: ${formatRupiah(totalAllNominal)}`;
}

function renderSewingReport() {
    const tbody = document.getElementById('sewingTbody');
    tbody.innerHTML = '';
    const sewingMap = {}; 

    workerRecords.forEach(r => r.items.forEach(i => {
        if (i.task === "Jahit") {
            const key = `${i.name}___${i.type}___${i.size}___${i.color}`;
            sewingMap[key] = (sewingMap[key] || 0) + i.qty;
        }
    }));

    const keys = Object.keys(sewingMap);
    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Teu waka aya data pangaosan jahit minggu ieu.</td></tr>`;
        return;
    }

    keys.forEach((key, idx) => {
        const [name, type, size, color] = key.split('___');
        const qty = sewingMap[key];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><strong>${name}</strong></td>
            <td>${type || '-'}</td>
            <td>${size || '-'}</td>
            <td>${color || '-'}</td>
            <td><strong>${qty} Pcs</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function editRecord(recIdx) {
    const rec = workerRecords[recIdx];
    document.getElementById('workerName').value = rec.workerName;
    document.getElementById('editIndex').value = recIdx;
    document.getElementById('formTitle').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Édit Catetan Borongan: ${rec.workerName}`;
    document.getElementById('submitBtn').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Parobihan Simpen`;

    const tbody = document.getElementById('itemsTbody');
    tbody.innerHTML = '';
    rec.items.forEach(item => {
        addDynamicRow(item);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
    Swal.fire({ title: 'Hapus data ieu?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Leres' }).then(res => {
        if (res.isConfirmed) {
            workerRecords = workerRecords.filter(r => r.id !== id);
            localStorage.setItem('konveksi_records_v3', JSON.stringify(workerRecords));
            renderDashboard();
        }
    });
}

function confirmResetAll() {
    Swal.fire({ title: 'Kosongkeun sadaya data?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Kosongkeun' }).then(res => {
        if (res.isConfirmed) {
            workerRecords = []; 
            localStorage.removeItem('konveksi_records_v3'); 
            renderDashboard();
        }
    });
}

/* FUNGSI EKSPOR PNG & EXCEL MURNI HANYA TABEL */
function exportTablePNG(sectionId, filename) {
    const originalCard = document.getElementById(sectionId);
    const tableContainer = originalCard.querySelector('.table-container').cloneNode(true);
    const cardBgColor = getComputedStyle(originalCard).backgroundColor;

    const exportWrapper = document.createElement('div');
    exportWrapper.style.backgroundColor = cardBgColor;
    exportWrapper.style.padding = '16px';
    exportWrapper.style.borderRadius = '12px';
    exportWrapper.style.width = tableContainer.offsetWidth + 'px';

    tableContainer.querySelectorAll('th').forEach(th => {
        let text = th.innerText.trim();
        if (text === 'Nami Padamel') th.innerText = 'Nama Pekerja';
        if (text === 'Artikel') th.innerText = 'Artikel';
        if (text === 'Wangun / Jenis') th.innerText = 'Jenis';
        if (text === 'Ukuran') th.innerText = 'Ukuran';
        if (text === 'Warna') th.innerText = 'Warna';
        if (text === 'Tugas') th.innerText = 'Tugas';
        if (text === 'Jumlah Pcs') th.innerText = 'Jumlah Pcs';
        if (text === 'Total Upah Gajih') th.innerText = 'Total Gaji';
        if (text === 'Total Produksi Jahit') th.innerText = 'Total Produksi Jahit';
        if (text === 'Aksi') th.innerText = '';
    });

    tableContainer.querySelectorAll('tr').forEach(tr => {
        const lastCell = tr.lastElementChild;
        if (lastCell && (lastCell.classList.contains('no-print') || lastCell.innerHTML.includes('trash') || lastCell.innerHTML.includes('pen'))) {
            lastCell.remove();
        }
    });

    exportWrapper.appendChild(tableContainer);
    document.body.appendChild(exportWrapper);
    exportWrapper.style.position = 'absolute';
    exportWrapper.style.left = '-9999px';

    html2canvas(exportWrapper, { 
        scale: 2, 
        backgroundColor: cardBgColor 
    }).then(canvas => {
        const link = document.createElement('a'); 
        link.download = `${filename}.png`; 
        link.href = canvas.toDataURL(); 
        link.click();
        exportWrapper.remove();
    });
}

function exportExcel(sectionId, filename) {
    const originalCard = document.getElementById(sectionId);
    const tableContainer = originalCard.querySelector('.table-container').cloneNode(true);
    
    tableContainer.querySelectorAll('th').forEach(th => {
        let text = th.innerText.trim();
        if (text === 'Nami Padamel') th.innerText = 'Nama Pekerja';
        if (text === 'Artikel') th.innerText = 'Artikel';
        if (text === 'Wangun / Jenis') th.innerText = 'Jenis';
        if (text === 'Ukuran') th.innerText = 'Ukuran';
        if (text === 'Warna') th.innerText = 'Warna';
        if (text === 'Tugas') th.innerText = 'Tugas';
        if (text === 'Jumlah Pcs') th.innerText = 'Jumlah Pcs';
        if (text === 'Total Upah Gajih') th.innerText = 'Total Gaji';
        if (text === 'Total Produksi Jahit') th.innerText = 'Total Produksi Jahit';
        if (text === 'Aksi') th.innerText = '';
    });

    tableContainer.querySelectorAll('tr').forEach(tr => {
        const lastCell = tr.lastElementChild;
        if (lastCell && (lastCell.classList.contains('no-print') || lastCell.innerHTML.includes('trash') || lastCell.innerHTML.includes('pen'))) {
            lastCell.remove();
        }
    });

    const table = tableContainer.querySelector('table');
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table, { sheet: "Laporan" });
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

function formatRupiah(num) { return 'Rp ' + num.toLocaleString('id-ID'); }
