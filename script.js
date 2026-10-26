/* FUNGSI EKSPOR PNG & EXCEL HANYA MENAMPILKAN TABEL DAN ISINYA SAJA */
function exportTablePNG(sectionId, filename) {
    const originalCard = document.getElementById(sectionId);
    
    // Ambil elemen tabel beserta kontainernya saja, abaikan judul kartu & tombol
    const tableContainer = originalCard.querySelector('.table-container').cloneNode(true);
    const cardBgColor = getComputedStyle(originalCard).backgroundColor;

    // Buat elemen pembungkus khusus untuk hasil gambar
    const exportWrapper = document.createElement('div');
    exportWrapper.style.backgroundColor = cardBgColor;
    exportWrapper.style.padding = '16px';
    exportWrapper.style.borderRadius = '12px';
    exportWrapper.style.width = tableContainer.offsetWidth + 'px';

    // Terjemahkan header tabel ke Bahasa Indonesia
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

    // Hapus kolom aksi pada tabel kloningan
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
