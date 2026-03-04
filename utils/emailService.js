// No top-level setApiKey call to prevent race conditions with dotenv
const sgMail = require('@sendgrid/mail');
const PDFDocument = require('pdfkit');


/**
 * Generate a PDF buffer for a booking bill
 */
const generateBookingPDF = (booking) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fillColor('#444444')
            .fontSize(20)
            .text('LuxeStay Resort & Spa', 110, 57)
            .fontSize(10)
            .text('123 Luxury Lane, Tropical Paradise', 200, 65, { align: 'right' })
            .text('Contact: +1 234 567 890', 200, 80, { align: 'right' })
            .moveDown();

        // Line
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();

        // Invoice Info
        doc.fillColor('#444444')
            .fontSize(14)
            .text('Booking Confirmation & Invoice', 50, 130);

        doc.fontSize(10)
            .text(`Booking ID: ${booking._id}`, 50, 150)
            .text(`Date: ${new Date().toLocaleDateString()}`, 50, 165)
            .text(`Status: ${booking.status}`, 50, 180);

        // Guest Details
        doc.text('Bill To:', 300, 150)
            .text(booking.user?.fullName || 'Valued Guest', 300, 165)
            .text(booking.user?.email || '', 300, 180);

        // Booking Snapshot
        doc.moveDown(4);
        doc.fontSize(12).text('Stay Details', 50, 220, { underline: true });
        doc.fontSize(10);
        doc.text(`Room Type: ${booking.room?.type || 'Standard'}`, 50, 240);
        doc.text(`City: ${booking.location?.city || 'Selected Branch'}`, 50, 255);
        doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`, 50, 270);
        doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`, 50, 285);

        // Pricing Table
        const tableTop = 320;
        doc.fontSize(10).fillColor('#444444');
        doc.text('Description', 50, tableTop, { bold: true });
        doc.text('Amount (INR)', 400, tableTop, { align: 'right', bold: true });

        doc.strokeColor('#eeeeee').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        doc.text(`Accommodation Charges (${booking.room?.type || 'Room'})`, 50, tableTop + 30);
        doc.text(`Rs ${booking.totalPrice.toLocaleString('en-IN')}`, 400, tableTop + 30, { align: 'right' });

        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 50).lineTo(550, tableTop + 50).stroke();

        doc.fontSize(12).text('Total Amount:', 300, tableTop + 70);
        doc.text(`Rs ${booking.totalPrice.toLocaleString('en-IN')}`, 400, tableTop + 70, { align: 'right', bold: true });

        // Footer
        doc.fontSize(10).font('Helvetica-Oblique').text('Thank you for choosing LuxeStay. We look forward to your arrival!', 50, 700, { align: 'center' });

        doc.end();
    });
};

/**
 * Generate a PDF buffer for a food order bill
 */
const generateFoodOrderPDF = (order) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        doc.fontSize(20).text('LuxeStay In-Room Dining', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Order ID: ${order._id}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        doc.text('Item Breakdown:', { underline: true });
        order.items.forEach(item => {
            doc.text(`${item.name} x ${item.quantity} - Rs ${(item.price * item.quantity).toLocaleString()}`);
        });

        doc.moveDown();
        doc.fontSize(12).text(`Total Paid: Rs ${order.totalAmount.toLocaleString()}`, { bold: true });

        doc.end();
    });
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    try {
        const msg = {
            to,
            from: process.env.FROM_EMAIL,
            subject,
            html,
            attachments
        };

        // Lazy initialization to ensure process.env is ready
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        await sgMail.send(msg);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error('SendGrid Error:', error.response ? error.response.body : error.message);
    }
};

/**
 * Higher level email triggers
 */
exports.sendWelcomeEmail = async (user) => {
    const html = `
        <div style="font-family: 'serif'; max-width: 600px; margin: auto; border: 1px solid #d4af37; padding: 40px; background-color: #0f1626; color: #ffffff;">
            <h1 style="color: #d4af37; text-align: center; font-style: italic;">Welcome to LuxeStay</h1>
            <p>Dear ${user.fullName},</p>
            <p>Welcome to the pinnacle of luxury. Your account has been successfully created.</p>
            <p>Explore our exclusive branches and curated experiences tailored just for you.</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://luxestay.com/dashboard" style="background-color: #d4af37; color: #0f1626; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">Visit Your Dashboard</a>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #888;">Thank you for choosing LuxeStay.</p>
        </div>
    `;
    await sendEmail({ to: user.email, subject: 'Welcome to LuxeStay Resort', html });
};

exports.sendBookingConfirmation = async (booking) => {
    const pdfBuffer = await generateBookingPDF(booking);
    const html = `
        <div style="font-family: 'sans-serif'; color: #333;">
            <h2 style="color: #d4af37;">Booking Confirmed!</h2>
            <p>Dear ${booking.user.fullName},</p>
            <p>Your reservation at LuxeStay is confirmed. We have attached your official booking invoice to this email.</p>
            <p><strong>Stay Details:</strong></p>
            <ul>
                <li>Room: ${booking.room.type}</li>
                <li>Location: ${booking.location.city}</li>
                <li>Dates: ${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}</li>
            </ul>
            <p>We look forward to hosting you!</p>
        </div>
    `;
    await sendEmail({
        to: booking.user.email,
        subject: 'Your LuxeStay Booking Confirmation',
        html,
        attachments: [{
            content: pdfBuffer.toString('base64'),
            filename: `LuxeStay_Booking_${booking._id}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
        }]
    });
};

exports.sendCancellationEmail = async (booking) => {
    const html = `
        <div style="font-family: 'sans-serif'; color: #333;">
            <h2 style="color: #ff4d4d;">Booking Cancelled</h2>
            <p>Dear ${booking.user.fullName},</p>
            <p>As requested, your booking (${booking._id}) has been cancelled.</p>
            <p>Any applicable refunds will be processed within 5-7 business days.</p>
            <p>We hope to see you again soon.</p>
        </div>
    `;
    await sendEmail({ to: booking.user.email, subject: 'Booking Cancellation Notification', html });
};

exports.sendOrderDeliveredEmail = async (order, user) => {
    const pdfBuffer = await generateFoodOrderPDF(order);
    const html = `
        <div style="font-family: 'sans-serif'; color: #333;">
            <h2 style="color: #4caf50;">Your Order is Delivered!</h2>
            <p>Bon Appétit, ${user.fullName}!</p>
            <p>Your food order has been delivered to your room. Find the invoice attached.</p>
        </div>
    `;
    await sendEmail({
        to: user.email,
        subject: 'LuxeStay: Your Food Order is Delivered',
        html,
        attachments: [{
            content: pdfBuffer.toString('base64'),
            filename: `LuxeStay_F&B_Bill_${order._id}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
        }]
    });
};

exports.sendServiceResolutionEmail = async (query, user) => {
    const html = `
        <div style="font-family: 'sans-serif'; color: #333;">
            <h2 style="color: #d4af37;">Service Request Resolved</h2>
            <p>Dear ${user.fullName},</p>
            <p>Your request for <strong>${query.type}</strong> has been marking as resolved.</p>
            <p>Admin Remark: "${query.response || 'No additional notes'}"</p>
            <p>We hope this enhances your stay.</p>
        </div>
    `;
    await sendEmail({ to: user.email, subject: 'Service Request Update', html });
};

exports.sendSpecialOfferEmail = async (user, offerDetails) => {
    const html = `
        <div style="font-family: 'serif'; background-color: #0f1626; color: #ffffff; padding: 40px; border: 2px gold solid;">
            <h1 style="color: #d4af37; text-align: center;">Exclusive Offer for You</h1>
            <p>Dear ${user.fullName},</p>
            <p>Discover luxury like never before with our latest special offer:</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #d4af37; margin-top: 0;">${offerDetails.title}</h2>
                <p>${offerDetails.description}</p>
                <p style="font-size: 1.2em; font-weight: bold;">Unlock with Code: <span style="color: #d4af37;">${offerDetails.code}</span></p>
            </div>
            <p>Book now before the offer expires!</p>
            <div style="text-align: center;">
                <a href="https://luxestay.com/rooms" style="display: inline-block; padding: 15px 30px; background: #d4af37; color: #0f1626; text-decoration: none; font-weight: bold; border-radius: 5px;">Book Now</a>
            </div>
        </div>
    `;
    await sendEmail({ to: user.email, subject: `Special Offer: ${offerDetails.title}`, html });
};

exports.sendStayReminderEmail = async (booking, user) => {
    const html = `
        <div style="font-family: 'serif'; background-color: #0f1626; color: #ffffff; padding: 40px; border: 2px gold solid;">
            <h1 style="color: #d4af37; text-align: center;">Your Stay Starts Tomorrow!</h1>
            <p>Dear ${user.fullName},</p>
            <p>We are delighted to welcome you to <strong>LuxeStay</strong> tomorrow.</p>
            <p>Everything is being prepared to ensure your stay is as luxurious and comfortable as possible.</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p><strong>Check-in Date:</strong> ${new Date(booking.checkIn).toDateString()}</p>
                <p><strong>Room Type:</strong> ${booking.room?.type || 'Standard Suite'}</p>
                <p><strong>Location:</strong> ${booking.location?.city || 'Selected Branch'}</p>
            </div>
            <p>If you have any special requests or need transportation, please feel free to contact us through your dashboard.</p>
            <div style="text-align: center;">
                <a href="https://luxestay.com/dashboard" style="display: inline-block; padding: 15px 30px; background: #d4af37; color: #0f1626; text-decoration: none; font-weight: bold; border-radius: 5px;">View Your Dashboard</a>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">We look forward to seeing you soon!</p>
        </div>
    `;
    await sendEmail({ to: user.email, subject: 'Reminder: Your LuxeStay reservation is tomorrow!', html });
};
