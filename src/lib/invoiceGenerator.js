import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePdf = async (booking, t) => {
    if (!booking || !booking.vehicles || !booking.profiles || !booking.vehicles.agencies) {
        alert(t('invoiceIncompleteData'));
        return;
    }

    try {
        const doc = new jsPDF();
        const agency = booking.vehicles.agencies;
        const user = booking.profiles;
        const vehicle = booking.vehicles;

        // Header
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(t('invoice'), 14, 22);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${t('bookingId')}: ${booking.id}`, 14, 30);
        doc.text(`${t('date')}: ${new Date().toLocaleDateString()}`, 14, 35);

        // Agency and User Details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(t('rentedFrom'), 14, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(agency.agency_name || 'N/A', 14, 56);
        doc.text(agency.address || 'N/A', 14, 61);
        doc.text(`${agency.city || ''}, ${agency.wilaya || ''}`, 14, 66);

        doc.setFont('helvetica', 'bold');
        doc.text(t('rentedBy'), 110, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(user.full_name || 'N/A', 110, 56);
        doc.text(user.email || 'N/A', 110, 61);
        doc.text(user.phone_number || 'N/A', 110, 66);
        
        // Booking Details Table
        const tableColumn = [t('vehicle'), t('rentalPeriod'), t('dailyRate'), t('total')];
        const tableRows = [];

        const rentalDays = ((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)) + 1;
        const period = `${new Date(booking.start_date).toLocaleDateString()} - ${new Date(booking.end_date).toLocaleDateString()} (${rentalDays} ${rentalDays > 1 ? t('days') : t('day')})`;

        const bookingData = [
            `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
            period,
            `${booking.vehicles.daily_rate_dzd.toLocaleString()} DZD`,
            `${booking.total_price.toLocaleString()} DZD`
        ];
        tableRows.push(bookingData);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 80,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo color
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY || 120;
        doc.setFontSize(10);
        doc.text(t('invoiceFooter'), 14, finalY + 20);

        doc.save(`invoice-${booking.id}.pdf`);

    } catch (error) {
        console.error("Error generating PDF: ", error);
        alert(t('invoicePdfError'));
    }
};
