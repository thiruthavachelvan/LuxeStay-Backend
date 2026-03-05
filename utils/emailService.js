// No top-level setApiKey call to prevent race conditions with dotenv
const sgMail = require('@sendgrid/mail');
const PDFDocument = require('pdfkit');
const path = require('path');


/**
 * Generate a PDF buffer for a booking bill
 */
const generateBookingPDF = (booking) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const primaryColor = '#0f1626';
        const accentColor = '#d4af37';
        const textColor = '#333333';
        const lightGray = '#f5f5f5';

        // Background Header Box
        doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

        // Logo
        try {
            const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
            doc.image(logoPath, 50, 20, { width: 60 });
        } catch (err) {
            console.warn('Logo not found, skipping.', err);
        }

        // Header Text
        doc.fillColor(accentColor)
            .font('Times-BoldItalic')
            .fontSize(24)
            .text('LuxeStay Resort & Spa', 125, 35);

        doc.fillColor('#ffffff')
            .font('Helvetica')
            .fontSize(9)
            .text('123 Luxury Lane, Tropical Paradise', 350, 40, { align: 'right', width: 200 })
            .text('Contact: +1 234 567 890 | email: contact@luxestay.com', 250, 55, { align: 'right', width: 300 });

        doc.moveDown(4);

        // Invoice Title
        doc.fillColor(primaryColor)
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Booking Confirmation & Invoice', 50, 130);

        // Grid for IDs & Bill To
        doc.fontSize(10).font('Helvetica');
        const infoTop = 160;

        doc.font('Helvetica-Bold').text('Booking Details', 50, infoTop);
        doc.font('Helvetica')
            .text(`Booking ID: ${booking._id}`, 50, infoTop + 15)
            .text(`Date of Issue: ${new Date().toLocaleDateString()}`, 50, infoTop + 30)
            .text(`Status: ${booking.status || 'Confirmed'}`, 50, infoTop + 45)
            .text(`Payment: ${booking.paymentStatus || 'Paid/Advance'}`, 50, infoTop + 60);

        doc.font('Helvetica-Bold').text('Bill To', 300, infoTop);
        doc.font('Helvetica')
            .text(booking.user?.fullName || 'Valued Guest', 300, infoTop + 15)
            .text(booking.user?.email || '', 300, infoTop + 30)
            .text(booking.user?.phoneNumber || '+ (Guest Phone)', 300, infoTop + 45);

        // Stay Details
        const stayTop = 240;
        doc.rect(50, stayTop, 495, 20).fill(lightGray);
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('Stay Details', 60, stayTop + 5);

        doc.fillColor(textColor).font('Helvetica').fontSize(10);
        doc.text(`Room Type: ${booking.room?.type || booking.room?.name || 'Luxury Suite'}`, 60, stayTop + 35);
        doc.text(`Location: ${booking.location?.city || booking.location?.name || 'LuxeStay Branch'}`, 300, stayTop + 35);

        const checkInStr = booking.checkIn ? new Date(booking.checkIn).toDateString() : 'TBD';
        const checkOutStr = booking.checkOut ? new Date(booking.checkOut).toDateString() : 'TBD';
        doc.text(`Check-in: ${checkInStr}`, 60, stayTop + 55);
        doc.text(`Check-out: ${checkOutStr}`, 300, stayTop + 55);

        // Guest Details
        let contentTop = stayTop + 85;
        doc.rect(50, contentTop, 495, 20).fill(lightGray);
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text(`Guests (${booking.guests?.adults || 1} Adults, ${booking.guests?.children || 0} Children)`, 60, contentTop + 5);

        doc.fillColor(textColor).font('Helvetica').fontSize(10);
        contentTop += 35;
        if (booking.guestDetails && booking.guestDetails.length > 0) {
            booking.guestDetails.forEach((g, i) => {
                doc.text(`${i + 1}. ${g.name} (${g.age} yrs, ${g.gender || 'N/A'})`, 60, contentTop);
                contentTop += 15;
            });
        } else {
            doc.text('Primary Guest Record.', 60, contentTop);
            contentTop += 15;
        }

        // Exclusive Benefits
        if (booking.user?.membershipTier && booking.user.membershipTier !== 'None') {
            contentTop += 10;
            doc.rect(50, contentTop, 495, 20).fill(lightGray);
            doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(12).text(`${booking.user.membershipTier} Member Privileges`, 60, contentTop + 5);
            doc.fillColor(textColor).font('Helvetica').fontSize(10);
            contentTop += 35;

            if (booking.user.membership && booking.user.membership.benefits && booking.user.membership.benefits.length > 0) {
                booking.user.membership.benefits.forEach(b => {
                    doc.text(`• ${b}`, 60, contentTop);
                    contentTop += 15;
                });
            } else {
                // Default fallback
                doc.text('• Priority Check-in & Dedicated Concierge Access', 60, contentTop);
                contentTop += 15;
                if (['Gold', 'Platinum', 'Diamond', 'Black Card'].includes(booking.user.membershipTier)) {
                    doc.text('• Complimentary Spa Voucher & Late Checkout', 60, contentTop);
                    contentTop += 15;
                }
            }
        }

        // Pricing Table
        contentTop += 15;
        doc.rect(50, contentTop, 495, 20).fill(primaryColor);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
        doc.text('Description', 60, contentTop + 5);
        doc.text('Amount (INR)', 450, contentTop + 5, { align: 'right' });

        doc.fillColor(textColor).font('Helvetica');
        contentTop += 35;

        // Base Room Price calculation
        let originalPrice = booking.originalPrice || booking.totalPrice;
        if (!booking.originalPrice && booking.discountAmount) originalPrice += booking.discountAmount;
        if (booking.addOns && booking.addOns.length > 0) {
            let addOnTotal = booking.addOns.reduce((sum, a) => sum + (a.price || 0), 0);
            originalPrice -= addOnTotal;
        }

        doc.text(`Accommodation Charges (${booking.room?.type || booking.room?.name || 'Room'})`, 60, contentTop);
        doc.text(`Rs ${Math.max(0, originalPrice).toLocaleString('en-IN')}`, 450, contentTop, { align: 'right' });
        contentTop += 20;

        // Add Ons
        if (booking.addOns && booking.addOns.length > 0) {
            booking.addOns.forEach(addon => {
                doc.text(`Add-On: ${addon.name}`, 60, contentTop);
                doc.text(`Rs ${(addon.price || 0).toLocaleString('en-IN')}`, 450, contentTop, { align: 'right' });
                contentTop += 20;
            });
        }

        // Discounts
        if (booking.discountAmount > 0) {
            doc.fillColor('#d9534f');
            doc.text(`Discount Applied ${booking.couponCode ? '(' + booking.couponCode + ')' : ''}`, 60, contentTop);
            doc.text(`- Rs ${booking.discountAmount.toLocaleString('en-IN')}`, 450, contentTop, { align: 'right' });
            contentTop += 20;
            doc.fillColor(textColor);
        }

        doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, contentTop).lineTo(545, contentTop).stroke();
        contentTop += 15;

        doc.font('Helvetica-Bold').fontSize(12).text('Total Paid/Payable:', 200, contentTop, { align: 'right', width: 230 });
        doc.fillColor(primaryColor).text(`Rs ${(booking.totalPrice || 0).toLocaleString('en-IN')}`, 440, contentTop, { align: 'right' });

        // Footer
        doc.fillColor(accentColor).font('Times-Italic').fontSize(14).text('Thank you for choosing LuxeStay. We look forward to your arrival!', 50, doc.page.height - 80, { align: 'center' });

        doc.end();
    });
};

/**
 * Generate a PDF buffer for a food order bill
 */
const generateFoodOrderPDF = (order) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const primaryColor = '#0f1626';
        const accentColor = '#d4af37';
        const textColor = '#333333';
        const lightGray = '#f5f5f5';

        // Background Header Box
        doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

        // Logo
        try {
            const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
            doc.image(logoPath, 50, 20, { width: 60 });
        } catch (err) {
            console.warn('Logo not found, skipping.');
        }

        // Header Text
        doc.fillColor(accentColor)
            .font('Times-BoldItalic')
            .fontSize(28)
            .text('LuxeStay Resort & Spa', 120, 35);

        doc.fillColor('#ffffff')
            .font('Helvetica')
            .fontSize(10)
            .text('In-Room Dining Services', 50, 40, { align: 'right' })
            .text('Contact: +1 234 567 890 | email: dining@luxestay.com', 50, 55, { align: 'right' });

        doc.moveDown(4);

        // Invoice Title
        doc.fillColor(primaryColor)
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Food & Beverage Invoice', 50, 130);

        doc.fontSize(10).font('Helvetica');
        const infoTop = 160;

        doc.font('Helvetica-Bold').text('Order Details', 50, infoTop);
        doc.font('Helvetica')
            .text(`Order ID: ${order._id}`, 50, infoTop + 15)
            .text(`Date of Issue: ${new Date().toLocaleDateString()}`, 50, infoTop + 30)
            .text(`Room Number: ${order.roomNumber || 'N/A'}`, 50, infoTop + 45)
            .text(`Status: ${order.status || 'Delivered'}`, 50, infoTop + 60);

        // Pricing Table
        let contentTop = 250;
        doc.rect(50, contentTop, 495, 20).fill(primaryColor);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
        doc.text('Item Description', 60, contentTop + 5);
        doc.text('Qty', 350, contentTop + 5, { align: 'center', width: 40 });
        doc.text('Amount (INR)', 450, contentTop + 5, { align: 'right' });

        doc.fillColor(textColor).font('Helvetica');
        contentTop += 35;

        let totalSurcharge = 0;
        if (order.items && order.items.length > 0) {
            order.items.forEach((item, index) => {
                doc.text(`${item.name}`, 60, contentTop);
                doc.text(`${item.quantity}`, 350, contentTop, { align: 'center', width: 40 });
                doc.text(`Rs ${(item.price * item.quantity).toLocaleString('en-IN')}`, 450, contentTop, { align: 'right' });
                contentTop += 20;

                // Add pagination protection
                if (contentTop > 700) {
                    doc.addPage();
                    contentTop = 50;
                }
            });
        }

        doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, contentTop).lineTo(545, contentTop).stroke();
        contentTop += 15;

        doc.font('Helvetica-Bold').fontSize(12).text('Total Amount Paid:', 200, contentTop, { align: 'right', width: 230 });
        doc.fillColor(primaryColor).text(`Rs ${(order.totalAmount || 0).toLocaleString('en-IN')}`, 440, contentTop, { align: 'right' });

        // Footer
        doc.fillColor(accentColor).font('Times-Italic').fontSize(14).text('Thank you for dining with LuxeStay!', 50, doc.page.height - 80, { align: 'center' });

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
