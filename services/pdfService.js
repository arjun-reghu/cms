const PDFDocument = require('pdfkit');
const path = require('path');

const PdfService = {
    generateAssetReport: (assets, res) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=asset_report.pdf');
        doc.pipe(res);

        // Logo
        const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
        try { doc.image(logoPath, 40, 30, { width: 50 }); } catch (e) { }

        // Title
        doc.fontSize(18).font('Helvetica-Bold').text('Asset Report', 100, 40);
        doc.fontSize(10).font('Helvetica').text(`Downloaded: ${new Date().toLocaleDateString('en-IN')}`, 100, 62);
        doc.moveDown(2);

        // Table header
        const startY = 100;
        const colWidths = [35, 60, 60, 100, 100, 70, 60, 70, 80, 40];
        const headers = ['SlNo', 'Channel', 'Branch', 'Branch Name', 'Asset Code', 'Category', 'Make', 'Model', 'Serial No', 'Qty'];

        doc.fontSize(8).font('Helvetica-Bold');
        let x = 40;
        headers.forEach((h, i) => {
            doc.text(h, x, startY, { width: colWidths[i], align: 'left' });
            x += colWidths[i];
        });

        doc.moveTo(40, startY + 15).lineTo(760, startY + 15).stroke();

        // Table rows
        doc.font('Helvetica').fontSize(7);
        let y = startY + 22;
        assets.forEach((asset, idx) => {
            if (y > 540) {
                doc.addPage();
                y = 40;
            }
            x = 40;
            const row = [
                idx + 1, asset.channel_code || '', asset.branch_code || '',
                asset.branch_name || '', asset.asset_code || '', asset.item_name || '',
                asset.make_name || '', asset.model_name || '', asset.serial_number || '',
                asset.count || 1
            ];
            row.forEach((cell, i) => {
                doc.text(String(cell), x, y, { width: colWidths[i], align: 'left' });
                x += colWidths[i];
            });
            y += 15;
        });

        doc.end();
    }
};

module.exports = PdfService;
