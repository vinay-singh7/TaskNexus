(function(){
  const el = document.getElementById('panel-pdftools');
  if(!el) return;

  el.innerHTML = `
    <div class="panel-header">
      <h1 class="panel-title">PDF Tools</h1>
      <p class="panel-desc">Merge, Split, and create PDFs entirely on your device (no uploads needed).</p>
    </div>

    <div class="grid-2" style="gap:16px;align-items:start">
      
      <!-- Merge PDF -->
      <div class="card">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Merge PDFs</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Select multiple PDF files to combine them into one.</p>
        <input type="file" id="pdf-merge-input" class="form-input" accept="application/pdf" multiple style="margin-bottom:12px"/>
        <button class="btn btn-primary" id="btn-merge-pdf" style="width:100%">Merge into Single PDF</button>
        <div id="merge-status" style="margin-top:8px;font-size:0.8rem;color:var(--primary);display:none">Processing...</div>
      </div>

      <!-- Split / Extract PDF -->
      <div class="card">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Extract Pages</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Extract specific pages (e.g. 1,3,4-6) from a PDF.</p>
        <input type="file" id="pdf-extract-input" class="form-input" accept="application/pdf" style="margin-bottom:12px"/>
        <input type="text" id="pdf-extract-pages" class="form-input" placeholder="Pages (e.g. 1, 3, 5-8)" style="margin-bottom:12px"/>
        <button class="btn btn-primary" id="btn-extract-pdf" style="width:100%">Extract Pages</button>
        <div id="extract-status" style="margin-top:8px;font-size:0.8rem;color:var(--primary);display:none">Processing...</div>
      </div>

      <!-- Image to PDF -->
      <div class="card" style="grid-column: 1 / -1">
        <h3 style="margin-bottom:16px;font-family:var(--font-display)">Images to PDF</h3>
        <p style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Convert PNG or JPG images into a single PDF document.</p>
        <input type="file" id="pdf-image-input" class="form-input" accept="image/png, image/jpeg" multiple style="margin-bottom:12px"/>
        <button class="btn btn-primary" id="btn-image-pdf">Convert Images to PDF</button>
        <div id="image-status" style="margin-top:8px;font-size:0.8rem;color:var(--primary);display:none">Processing...</div>
      </div>

    </div>
  `;

  async function downloadBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- MERGE PDF ---
  document.getElementById('btn-merge-pdf').addEventListener('click', async () => {
    const files = document.getElementById('pdf-merge-input').files;
    if(files.length < 2) return toast('Please select at least 2 PDFs to merge', 'error');

    const status = document.getElementById('merge-status');
    status.style.display = 'block';
    
    try {
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      downloadBytes(pdfBytes, 'merged_document.pdf');
      toast('PDFs merged successfully!', 'success');
      document.getElementById('pdf-merge-input').value = '';
    } catch (err) {
      console.error(err);
      toast('Error merging PDFs', 'error');
    } finally {
      status.style.display = 'none';
    }
  });

  // --- EXTRACT PDF ---
  document.getElementById('btn-extract-pdf').addEventListener('click', async () => {
    const files = document.getElementById('pdf-extract-input').files;
    const pageString = document.getElementById('pdf-extract-pages').value.trim();
    if(files.length === 0) return toast('Please select a PDF', 'error');
    if(!pageString) return toast('Please specify pages to extract', 'error');

    const status = document.getElementById('extract-status');
    status.style.display = 'block';

    try {
      const { PDFDocument } = window.PDFLib;
      const sourcePdf = await PDFDocument.load(await files[0].arrayBuffer());
      const totalPages = sourcePdf.getPageCount();

      // parse page string (1-indexed to 0-indexed)
      const pagesToExtract = new Set();
      const parts = pageString.split(',');
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(n => parseInt(n.trim()));
          if (start && end && start <= end) {
            for (let i = start; i <= end; i++) {
              if(i > 0 && i <= totalPages) pagesToExtract.add(i - 1);
            }
          }
        } else {
          const n = parseInt(part.trim());
          if (n > 0 && n <= totalPages) pagesToExtract.add(n - 1);
        }
      }

      const indices = Array.from(pagesToExtract).sort((a,b) => a-b);
      if(indices.length === 0) {
        status.style.display = 'none';
        return toast('No valid pages found in range', 'error');
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(sourcePdf, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      downloadBytes(pdfBytes, 'extracted_pages.pdf');
      toast('Pages extracted successfully!', 'success');
    } catch (err) {
      console.error(err);
      toast('Error extracting pages', 'error');
    } finally {
      status.style.display = 'none';
    }
  });

  // --- IMAGE TO PDF ---
  document.getElementById('btn-image-pdf').addEventListener('click', async () => {
    const files = document.getElementById('pdf-image-input').files;
    if(files.length === 0) return toast('Please select images', 'error');

    const status = document.getElementById('image-status');
    status.style.display = 'block';

    try {
      const { PDFDocument } = window.PDFLib;
      const pdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        let image;
        
        if (file.type === 'image/jpeg') {
          image = await pdf.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
          image = await pdf.embedPng(arrayBuffer);
        } else {
          continue; // skip unsupported
        }

        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdf.save();
      downloadBytes(pdfBytes, 'images.pdf');
      toast('Images converted to PDF!', 'success');
      document.getElementById('pdf-image-input').value = '';
    } catch (err) {
      console.error(err);
      toast('Error converting images', 'error');
    } finally {
      status.style.display = 'none';
    }
  });

})();
