const ExcelJS = require('exceljs');

const ExcelService = {
    generateAssetReport: async (assets, res) => {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'CMS System';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Asset Report');

        // Columns
        sheet.columns = [
            { header: 'SlNo', key: 'slno', width: 8 },
            { header: 'Channel Code', key: 'channel_code', width: 15 },
            { header: 'Branch Code', key: 'branch_code', width: 15 },
            { header: 'Branch Name', key: 'branch_name', width: 25 },
            { header: 'Asset Category', key: 'item_name', width: 20 },
            { header: 'Asset Code', key: 'asset_code', width: 30 },
            { header: 'Make', key: 'make_name', width: 15 },
            { header: 'Model', key: 'model_name', width: 15 },
            { header: 'Serial Number', key: 'serial_number', width: 20 },
            { header: 'Count', key: 'count', width: 8 }
        ];

        // Style header row
        sheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' }, bottom: { style: 'thin' },
                left: { style: 'thin' }, right: { style: 'thin' }
            };
        });

        // Data rows
        assets.forEach((asset, idx) => {
            sheet.addRow({
                slno: idx + 1,
                channel_code: asset.channel_code || '',
                branch_code: asset.branch_code || '',
                branch_name: asset.branch_name || '',
                item_name: asset.item_name || '',
                asset_code: asset.asset_code || '',
                make_name: asset.make_name || '',
                model_name: asset.model_name || '',
                serial_number: asset.serial_number || '',
                count: asset.count || 1
            });
        });

        // Style data rows
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.eachCell(cell => {
                    cell.border = {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=asset_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }
};

module.exports = ExcelService;
