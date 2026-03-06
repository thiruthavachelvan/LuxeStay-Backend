// No top-level setApiKey call to prevent race conditions with dotenv
const sgMail = require('@sendgrid/mail');
const PDFDocument = require('pdfkit');
const path = require('path');


/**
 * Generate a PDF buffer for a booking bill
 */
const generateBookingPDF = (booking) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const navyColor = '#020617'; // Navy 950
        const goldAccent = '#d4af37'; // Gold 500
        const lightGold = '#f1e6c5';
        const mutedText = '#64748b';
        const textColor = '#020617';
        const ultraLightGray = '#f8fafc';

        // --- Cinematic Header ---
        doc.rect(0, 0, doc.page.width, 160).fill(navyColor);

        // Abstract decorative element
        doc.save();
        doc.fillColor(goldAccent).opacity(0.1);
        doc.rect(400, -50, 300, 300).rotate(45, { origin: [550, 100] }).fill();
        doc.restore();
        doc.opacity(1);

        // Logo & Branding
        try {
            const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
            doc.image(logoPath, 50, 40, { width: 70 });
        } catch (err) {
            console.warn('Logo not found.');
        }

        doc.fillColor(goldAccent)
            .font('Times-BoldItalic')
            .fontSize(32)
            .text('LuxeStay', 135, 50);

        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('INTERNATIONAL REGISTRY', 137, 85, { characterSpacing: 2 });

        // Header Metadata
        doc.fillColor('#94a3b8')
            .font('Helvetica')
            .fontSize(9)
            .text('RESORT & SPA • CH-1204 GENEVA', 350, 45, { align: 'right', width: 200 })
            .text('UPLINK: ACTIVE • SESSION: SECURE', 350, 60, { align: 'right', width: 200 })
            .text('HQ CONTACT: +41 22-901-4000', 350, 75, { align: 'right', width: 200 });

        // Invoice Banner
        doc.rect(50, 130, 495, 60).fill('#ffffff').stroke(goldAccent);
        doc.fillColor(navyColor)
            .font('Times-BoldItalic')
            .fontSize(22)
            .text('Booking Manifest & Invoice', 70, 145);

        doc.fillColor(mutedText)
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(`REF ID: #LX-${booking._id.toString().slice(-8).toUpperCase()}`, 70, 172, { characterSpacing: 1 });

        // --- Section: Intelligence Summary ---
        doc.moveDown(6);
        const startY = 220;

        // Grid Layout
        doc.rect(50, startY, 495, 100).fill(ultraLightGray);

        // Column 1: Registry Data
        doc.fillColor(goldAccent).font('Helvetica-Bold').fontSize(10).text('REGISTRY DATA', 70, startY + 15);
        doc.fillColor(textColor).font('Helvetica').fontSize(10)
            .text(`Issue Date: ${new Date().toLocaleDateString()}`, 70, startY + 35)
            .text(`Booking Status: ${booking.status || 'Verified'}`, 70, startY + 50)
            .text(`Payment Vector: ${booking.paymentStatus || 'Authenticated'}`, 70, startY + 65);

        // Column 2: Guest Credentials
        doc.fillColor(goldAccent).font('Helvetica-Bold').fontSize(10).text('BILLING RECIPIENT', 300, startY + 15);
        doc.fillColor(textColor).font('Helvetica')
            .text(booking.user?.fullName || 'Anonymous Elite Member', 300, startY + 35)
            .text(booking.user?.email || '', 300, startY + 50)
            .text(booking.user?.phoneNumber || 'P: (Protected Channel)', 300, startY + 65);

        // --- Section: Deployment Specs ---
        let contentY = startY + 120;
        doc.rect(50, contentY, 495, 25).fill(navyColor);
        doc.fillColor(goldAccent).font('Times-BoldItalic').fontSize(13).text('Operational Parameters', 65, contentY + 7);

        doc.fillColor(textColor).font('Helvetica-Bold').fontSize(11).text('SUITE DESIGNATION', 50, contentY + 45);
        doc.font('Helvetica').fontSize(10).text(booking.room?.type || booking.room?.name || 'Grand Luxury Suite', 50, contentY + 60);

        doc.font('Helvetica-Bold').fontSize(11).text('LOCATION SECTOR', 300, contentY + 45);
        doc.font('Helvetica').fontSize(10).text(booking.location?.city || 'LuxeStay Prime Sector', 300, contentY + 60);

        doc.font('Helvetica-Bold').fontSize(10).text('CHECK-IN PROTOCOL:', 50, contentY + 85);
        doc.font('Helvetica').fontSize(10).text(booking.checkIn ? new Date(booking.checkIn).toDateString() : 'TBD', 160, contentY + 85);

        doc.font('Helvetica-Bold').fontSize(10).text('CHECK-OUT PROTOCOL:', 300, contentY + 85);
        doc.font('Helvetica').fontSize(10).text(booking.checkOut ? new Date(booking.checkOut).toDateString() : 'TBD', 420, contentY + 85);

        // --- Section: Personnel Manifest ---
        contentY += 120;
        doc.rect(50, contentY, 495, 25).fill(ultraLightGray);
        doc.fillColor(navyColor).font('Helvetica-Bold').fontSize(10).text(`PERSONNEL MANIFEST (${booking.guests?.adults || 1} ELITE, ${booking.guests?.children || 0} JUNIOR)`, 65, contentY + 8);

        contentY += 35;
        if (booking.guestDetails && booking.guestDetails.length > 0) {
            booking.guestDetails.forEach((g, i) => {
                doc.fillColor(mutedText).font('Helvetica-Bold').text(`${i + 1}`, 50, contentY);
                doc.fillColor(textColor).font('Helvetica').text(`- ${g.name} (${g.gender || 'N/A'}) • Age Profile: ${g.age}`, 70, contentY);
                contentY += 18;
            });
        } else {
            doc.fillColor(textColor).font('Helvetica').text('Individual record on centralized system.', 70, contentY);
            contentY += 18;
        }

        // --- Section: Financial Audit ---
        contentY += 20;
        doc.rect(50, contentY, 495, 30).fill(navyColor);
        doc.fillColor(goldAccent).font('Helvetica-Bold').fontSize(11).text('DESCRIPTION', 70, contentY + 10);
        doc.text('TOTAL REQUISITION (INR)', 380, contentY + 10, { align: 'right' });

        contentY += 45;

        // Base Room Logic
        let originalPrice = booking.originalPrice || booking.totalPrice;
        if (!booking.originalPrice && booking.discountAmount) originalPrice += booking.discountAmount;
        if (booking.addOns && booking.addOns.length > 0) {
            let addOnTotal = booking.addOns.reduce((sum, a) => sum + (a.price || 0), 0);
            originalPrice -= addOnTotal;
        }

        doc.fillColor(textColor).font('Helvetica').fontSize(10).text(`Room Requisition: ${booking.room?.type || 'Elite Suite'}`, 70, contentY);
        doc.font('Helvetica-Bold').text(`₹ ${Math.max(0, originalPrice).toLocaleString('en-IN')}`, 380, contentY, { align: 'right' });
        contentY += 22;

        // Add Ons
        if (booking.addOns && booking.addOns.length > 0) {
            booking.addOns.forEach(addon => {
                doc.fillColor(mutedText).font('Helvetica').text(`Upgrade: ${addon.name}`, 70, contentY);
                doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${(addon.price || 0).toLocaleString('en-IN')}`, 380, contentY, { align: 'right' });
                contentY += 20;
            });
        }

        // Membership Privileges
        if (booking.user?.membershipTier && booking.user.membershipTier !== 'None') {
            doc.fillColor(goldAccent).font('Times-BoldItalic').text(`${booking.user.membershipTier} Member Discount`, 70, contentY);
            doc.text(`- ₹ ${booking.discountAmount.toLocaleString('en-IN')}`, 380, contentY, { align: 'right' });
            contentY += 20;
        } else if (booking.discountAmount > 0) {
            doc.fillColor('#991b1b').font('Helvetica').text(`Coupon Applied: ${booking.couponCode || 'PROMO'}`, 70, contentY);
            doc.text(`- ₹ ${booking.discountAmount.toLocaleString('en-IN')}`, 380, contentY, { align: 'right' });
            contentY += 20;
        }

        // Total
        doc.strokeColor(goldAccent).lineWidth(1).moveTo(50, contentY + 5).lineTo(545, contentY + 5).stroke();
        contentY += 25;
        doc.fillColor(navyColor).font('Helvetica-Bold').fontSize(14).text('Total Settlement Amount:', 200, contentY, { align: 'right', width: 200 });
        doc.fillColor(goldAccent).font('Helvetica-Bold').fontSize(18).text(`₹ ${(booking.totalPrice || 0).toLocaleString('en-IN')}`, 410, contentY - 3, { align: 'right' });

        // Footer
        const footTop = doc.page.height - 120;
        doc.rect(0, footTop, doc.page.width, 120).fill(navyColor);
        doc.fillColor(goldAccent).font('Times-BoldItalic').fontSize(16).text('Welcome to the Elite Sanctuary.', 50, footTop + 30, { align: 'center' });
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text('CERTIFIED SECURE TRANSACTION • EXCLUSIVE LUXESTAY DOCUMENTATION', 50, footTop + 65, { align: 'center', characterSpacing: 2 });
        doc.text(`Doc ID: LS/M-${booking._id.toString().slice(-4)}`, 50, footTop + 80, { align: 'center' });

        doc.end();
    });
};

/**
 * Generate a PDF buffer for a food order bill
 */
const generateFoodOrderPDF = (order) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const navyColor = '#020617';
        const goldAccent = '#d4af37';
        const ultraLightGray = '#f8fafc';

        // Cinematic Header
        doc.rect(0, 0, doc.page.width, 100).fill(navyColor);

        try {
            const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
            doc.image(logoPath, 50, 20, { width: 60 });
        } catch (err) {
            console.warn('Logo not found.');
        }

        doc.fillColor(goldAccent).font('Times-BoldItalic').fontSize(24).text('LuxeStay In-Room Dining', 120, 35);
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('CULINARY EXCELLENCE DELIVERED', 122, 65, { characterSpacing: 1 });

        // Order Title
        doc.fillColor(navyColor).font('Times-BoldItalic').fontSize(20).text('Culinary Requisition Receipt', 50, 130);
        doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text(`ORDER ID: #FD-${order._id.toString().slice(-6).toUpperCase()}`, 50, 155, { characterSpacing: 1 });

        // Metadata Grid
        const infoTop = 185;
        doc.rect(50, infoTop, 495, 70).fill(ultraLightGray);

        doc.fillColor(goldAccent).font('Helvetica-Bold').fontSize(9).text('REQUISITION DETAILS', 70, infoTop + 15);
        doc.fillColor('#1e293b').font('Helvetica').fontSize(10)
            .text(`Terminal: Room ${order.roomNumber || 'Elite Guest'}`, 70, infoTop + 35)
            .text(`Uplink Date: ${new Date().toLocaleDateString()}`, 70, infoTop + 50);

        doc.fillColor(goldAccent).font('Helvetica-Bold').fontSize(9).text('LOGISTICS STATUS', 300, infoTop + 15);
        doc.fillColor('#1e293b').text(`Status: ${order.status || 'Delivered'}`, 300, infoTop + 35)
            .text('Wait Time: Instant Priority', 300, infoTop + 50);

        // Pricing Table
        let contentTop = 280;
        doc.rect(50, contentTop, 495, 30).fill(navyColor);
        doc.fillColor(goldAccent).font('Helvetica-Bold').fontSize(10);
        doc.text('CULINARY SELECTION', 65, contentTop + 10);
        doc.text('QUANTITY', 320, contentTop + 10, { align: 'center', width: 80 });
        doc.text('VALUATION (INR)', 430, contentTop + 10, { align: 'right', width: 100 });

        doc.fillColor('#334155').font('Helvetica');
        contentTop += 45;

        if (order.items && order.items.length > 0) {
            order.items.forEach((item) => {
                doc.fillColor('#1e293b').font('Times-BoldItalic').fontSize(11).text(`${item.name}`, 65, contentTop);
                doc.fillColor('#64748b').font('Helvetica').fontSize(10).text(`${item.quantity}`, 320, contentTop, { align: 'center', width: 80 });
                doc.fillColor('#1e293b').font('Helvetica-Bold').text(`₹ ${(item.price * item.quantity).toLocaleString('en-IN')}`, 430, contentTop, { align: 'right', width: 100 });
                contentTop += 22;

                if (contentTop > 750) {
                    doc.addPage();
                    contentTop = 50;
                }
            });
        }

        doc.strokeColor(goldAccent).lineWidth(0.5).moveTo(50, contentTop + 10).lineTo(545, contentTop + 10).stroke();
        contentTop += 30;

        doc.font('Helvetica-Bold').fontSize(13).text('Total Order Capital:', 200, contentTop, { align: 'right', width: 230 });
        doc.fillColor(navyColor).text(`₹ ${(order.totalAmount || 0).toLocaleString('en-IN')}`, 440, contentTop - 2, { align: 'right' });

        // Footer
        doc.fillColor(goldAccent).font('Times-BoldItalic').fontSize(14).text('Bon Appétit from LuxeStay Culinary Team.', 50, doc.page.height - 80, { align: 'center' });

        doc.end();
    });
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    try {
        const msg = {
            to,
            from: {
                email: process.env.FROM_EMAIL,
                name: 'LuxeStay Resort & Spa'
            },
            subject,
            html,
            attachments
        };

        // Lazy initialization to ensure process.env is ready
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        await sgMail.send(msg);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.body) : error.message;
        console.error('SendGrid Error:', errorMsg);
        throw new Error(`SendGrid Failure: ${errorMsg}`);
    }
};

/**
 * Higher level email triggers
 */
exports.sendWelcomeEmail = async (user) => {
    const html = `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: auto; border: 2px solid #d4af37; padding: 0; background-color: #020617; color: #ffffff;">
            <div style="background-color: #d4af37; padding: 20px; text-align: center;">
                <h1 style="color: #020617; font-size: 28px; font-style: italic; margin: 0;">LuxeStay International</h1>
            </div>
            <div style="padding: 40px; text-align: center;">
                <h2 style="color: #d4af37; font-size: 32px; font-style: italic;">Registry Authenticated</h2>
                <p style="font-size: 18px; line-height: 1.6; color: #cbd5e1;">Dear ${user.fullName},</p>
                <p style="font-size: 16px; line-height: 1.6; color: #94a3b8;">Welcome to the pinnacle of global hospitality. Your credentials have been verified, and your sanctuary await.</p>
                
                <div style="margin: 40px 0;">
                    <a href="https://luxestay.com/dashboard" style="background-color: #d4af37; color: #020617; padding: 15px 35px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; border-radius: 0;">Access Global Terminal</a>
                </div>
                
                <p style="font-size: 12px; color: #64748b; letter-spacing: 1px; margin-top: 50px;">SESSION SECURE • GENEVA HEADQUARTERS</p>
            </div>
        </div>
    `;
    await sendEmail({ to: user.email, subject: 'Welcome to the LuxeStay Registry', html });
};

exports.sendBookingConfirmation = async (booking) => {
    const pdfBuffer = await generateBookingPDF(booking);
    const html = `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 0; background-color: #ffffff;">
            <div style="background-color: #020617; padding: 30px; text-align: center;">
                <h1 style="color: #d4af37; font-size: 24px; font-style: italic; margin: 0;">LuxeStay Manifest</h1>
            </div>
            <div style="padding: 40px;">
                <h2 style="color: #020617; font-size: 24px; margin-top: 0;">Reservation Confirmed</h2>
                <p style="color: #475569; font-size: 16px;">Dear ${booking.user.fullName},</p>
                <p style="color: #475569; font-size: 16px;">Your stay at <strong>LuxeStay ${booking.location.city}</strong> has been successfully registered. Attached to this secure transmission is your official manifest and financial invoice.</p>
                
                <div style="background-color: #f8fafc; padding: 25px; margin: 30px 0; border-left: 4px solid #d4af37;">
                    <p style="margin: 0; color: #020617; font-weight: bold;">Mission Specs:</p>
                    <p style="margin: 10px 0 0; color: #64748b; font-size: 14px;">Suite: ${booking.room.type}</p>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Sector: LuxeStay ${booking.location.city}</p>
                    <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Temporal: ${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}</p>
                </div>
                
                <p style="color: #64748b; font-size: 14px; font-style: italic;">We look forward to host you.</p>
            </div>
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 10px;">
                SECURE DOCUMENT PROTOCOL • AUTHENTICATED AT ${new Date().toISOString()}
            </div>
        </div>
    `;
    await sendEmail({
        to: booking.user.email,
        subject: `LuxeStay Manifest: CONFIRMED [#${booking._id.toString().slice(-6).toUpperCase()}]`,
        html,
        attachments: [{
            content: pdfBuffer.toString('base64'),
            filename: `LuxeStay_Manifest_${booking._id.toString().slice(-8)}.pdf`,
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

exports.sendSpaPurchaseEmail = async (user, booking, amount, transactionId) => {
    const html = `
        <div style="font-family: 'sans-serif'; color: #333; max-width: 600px; margin: auto; border: 1px solid #d4af37; padding: 40px; background-color: #0f1626; color: #ffffff;">
            <h2 style="color: #d4af37; font-style: italic; text-align: center;">Spa & Wellness Confirmation</h2>
            <p>Dear ${user.fullName},</p>
            <p>Thank you for booking a rejuvenating Spa Session with LuxeStay. We have received your payment.</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p><strong>Booking Reference:</strong> #${booking._id.toString().slice(-6)}</p>
                <p><strong>Transaction ID:</strong> ${transactionId}</p>
                <p><strong>Service:</strong> Spa Session (60 min)</p>
                <h3 style="color: #d4af37;">Amount Paid: ₹${amount.toLocaleString('en-IN')}</h3>
            </div>
            <p>Our wellness concierge has been notified and will coordinate with you to schedule your exact preferred time during your stay.</p>
            <p style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">Warm Regards,<br>LuxeStay Spa Team</p>
        </div>
    `;
    await sendEmail({ to: user.email, subject: 'LuxeStay: Spa Booking Invoice', html });
};

exports.sendContactReplyEmail = async (contact, replyText) => {
    const html = `
        <div style="font-family: 'sans-serif'; color: #333; max-width: 600px; margin: auto; border: 1px solid #d4af37; padding: 40px; background-color: #0f1626; color: #ffffff;">
            <h2 style="color: #d4af37; text-align: center;">Response to Your Inquiry</h2>
            <p>Dear ${contact.name},</p>
            <p>Thank you for contacting LuxeStay. Here is the response to your message regarding "<strong>${contact.subject}</strong>":</p>
            <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; margin: 20px 0; font-style: italic;">
                <p>${replyText}</p>
            </div>
            <p>If you have any further questions, please feel free to reply to this email or contact us again through our website.</p>
            <p style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">Warm Regards,<br>LuxeStay Support Team</p>
        </div>
    `;
    await sendEmail({ to: contact.email, subject: `Re: ${contact.subject} - LuxeStay Support`, html });
};

// ------------------------------------------------------------------
// Password Reset Emails
// ------------------------------------------------------------------

exports.sendPasswordResetOTPEmail = async (user, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f1626; color: #fff; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: #d4af37;">LuxeStay Hotels & Resorts</h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #0f1626; margin-top: 0;">Password Reset Request</h2>
                <p style="font-size: 16px; line-height: 1.5;">Hello ${user.fullName || 'Valued Guest'},</p>
                <p style="font-size: 16px; line-height: 1.5;">We received a request to reset your password. Here is your One-Time Password (OTP) to proceed:</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f1626;">${otp}</span>
                </div>
                
                <p style="font-size: 16px; line-height: 1.5; color: #d32f2f;"><strong>Note:</strong> This OTP is valid for the next 10 minutes. Please do not share this code with anyone.</p>
                <p style="font-size: 16px; line-height: 1.5;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 14px; color: #777; margin-bottom: 0;">Thank you,<br/>The LuxeStay Team</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                &copy; ${new Date().getFullYear()} LuxeStay Hotels & Resorts. All rights reserved.
            </div>
        </div>
    `;

    return sendEmail({
        to: user.email,
        subject: 'LuxeStay - Password Reset OTP',
        html,
    });
};

exports.sendPasswordResetSuccessEmail = async (user) => {
    const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f1626; color: #fff; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: #d4af37;">LuxeStay Hotels & Resorts</h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #0f1626; margin-top: 0;">Password Successfully Reset</h2>
                <p style="font-size: 16px; line-height: 1.5;">Hello ${user.fullName || 'Valued Guest'},</p>
                <p style="font-size: 16px; line-height: 1.5;">Your LuxeStay account password has been successfully reset. You can now use your new password to log in.</p>
                <p style="font-size: 16px; line-height: 1.5;">If you did not perform this action, please contact our support team immediately.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 14px; color: #777; margin-bottom: 0;">Thank you,<br/>The LuxeStay Team</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                &copy; ${new Date().getFullYear()} LuxeStay Hotels & Resorts. All rights reserved.
            </div>
        </div>
    `;

    return sendEmail({
        to: user.email,
        subject: 'LuxeStay - Password Reset Successful',
        html,
    });
};
