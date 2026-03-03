/**
 * seedUsersAndReviews.js
 * Creates 12 named test users, historical bookings (CheckedOut), and authentic reviews.
 * All accounts use password: LuxeTest@123
 * Run: node scripts/seedUsersAndReviews.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Room = require('../models/Room');
const Location = require('../models/Location');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// ============================================================
//  USER ROSTER
// ============================================================
const USER_ROSTER = [
    { fullName: 'Tony Stark', email: 'tony.stark@luxestays.com', phone: '+91 98100 11001', dietary: 'Non-Veg', loyalty: 4800, tier: 'Platinum' },
    { fullName: 'Steve Rogers', email: 'steve.rogers@luxestays.com', phone: '+91 98100 11002', dietary: 'Non-Veg', loyalty: 3200, tier: 'Gold' },
    { fullName: 'Bruce Wayne', email: 'bruce.wayne@luxestays.com', phone: '+91 98100 11003', dietary: 'Non-Veg', loyalty: 7500, tier: 'Diamond' },
    { fullName: 'Vijay Kumar', email: 'vijay.kumar@luxestays.com', phone: '+91 98100 11004', dietary: 'Veg', loyalty: 1500, tier: 'Silver' },
    { fullName: 'Dhanush', email: 'dhanush@luxestays.com', phone: '+91 98100 11005', dietary: 'Non-Veg', loyalty: 2800, tier: 'Gold' },
    { fullName: 'Trisha', email: 'trisha@luxestays.com', phone: '+91 98100 11006', dietary: 'Veg', loyalty: 2100, tier: 'Gold' },
    { fullName: 'Anirudh Ravichander', email: 'anirudh@luxestays.com', phone: '+91 98100 11007', dietary: 'Veg', loyalty: 1900, tier: 'Silver' },
    { fullName: 'Ranveer Singh', email: 'ranveer.singh@luxestays.com', phone: '+91 98100 11008', dietary: 'Non-Veg', loyalty: 3600, tier: 'Gold' },
    { fullName: 'Deepika Padukone', email: 'deepika.padukone@luxestays.com', phone: '+91 98100 11009', dietary: 'Veg', loyalty: 3400, tier: 'Gold' },
    { fullName: 'Priyanka Chopra', email: 'priyanka.chopra@luxestays.com', phone: '+91 98100 11010', dietary: 'Non-Veg', loyalty: 5200, tier: 'Diamond' },
    { fullName: 'Ranbir Kapoor', email: 'ranbir.kapoor@luxestays.com', phone: '+91 98100 11011', dietary: 'Non-Veg', loyalty: 2700, tier: 'Gold' },
    { fullName: 'Nayanthara', email: 'nayanthara@luxestays.com', phone: '+91 98100 11012', dietary: 'Veg', loyalty: 2200, tier: 'Silver' },
];

// ============================================================
//  REVIEW TEMPLATES  { locationKey: [ ...reviewTexts ] }
// ============================================================
const REVIEW_BANK = {
    Mumbai: [
        "Woke up to the Arabian Sea glittering at my feet. The Marine Drive view is absolutely unreal. The butler remembered I take my coffee black without being asked — that's five-star intuition right there.",
        "LuxeStays Mumbai is the only hotel in the city that genuinely feels like a home at 65,000 feet. Slept with the windows open to the sea breeze. Zero complaints; ten out of ten.",
        "The breakfast was a masterpiece — freshly squeezed pomegranate juice, vada pav reimagined as a gourmet slider. The staff went out of their way to arrange a last-minute Mumbai Darshan tour. Truly special.",
        "Stayed in the Bandra Executive during a board-level conference. Internet was faster than our office, the meeting room was perfectly set up, and the evening sundowner was a cherry on top.",
        "Marine Drive from the suite balcony at 6 AM is one of the top three sights I've ever witnessed in my life. The hospitality here is warm, intelligent, and wonderfully unobtrusive.",
    ],
    Delhi: [
        "The Lutyens Presidential Suite is the most dignified room I've ever had the privilege of inhabiting. Every Rajasthani marble tile tells a story. The in-suite dinner under the Delhi stars was simply unforgettable.",
        "From the Parliament view alone, this stay earns its price. The Heritage Double's Mughal murals are museum-worthy. Loved the complimentary Old Delhi heritage walk — a brilliant touch.",
        "Checked in exhausted from a 14-hour flight and checked out completely restored. The executive lounge, the impeccable pressing service, and the chai served at exactly 4 PM — all perfection.",
        "Came for a conference, stayed for the experience. The Capital team is remarkably professional. The rooftop Jacuzzi after a gruelling day in Parliament corridors was the stuff of legend.",
        "Delhi in January is cold, but the Heritage Double was incredibly warm — both in temperature and in character. The personalised welcome note with a Mughal-inspired artwork gift was a lovely gesture.",
    ],
    Goa: [
        "I took exactly three steps from the Beach-connected Room to have my feet in the Atlantic. The cocktail hour as the sun dipped below the horizon with a perfectly mixed Mango Mojito in hand — I'll be back for sure.",
        "The Sunset Honeymoon Suite was beyond expectation for our anniversary. The flower petal turndown, champagne on arrival, and the couple's spa — every single detail screamed romance. Cannot recommend enough.",
        "Our Private Pool Room in Goa is what heaven looks like. The plunge pool merging with the resort's lagoon is breathtaking. Daily fresh coconuts delivered to the pool? Sign me up for life.",
        "Goa's LuxeStays understands what beach luxury means. It's not just sun and sand — it's the freshness of the towels, the timing of the cocktails, the knowledge of the concierge about the very best beach shacks.",
        "The personal yoga instructor at sunrise was an unexpected and deeply appreciated touch. Ending the day with a private bonfire dinner on the beach completed what was a genuinely perfect Goa week.",
    ],
    Bangalore: [
        "The Tech Park Shuttle alone pays for itself if you're here for business. Fast wifi, pristine workspace, and the Garden Villa view of Lal Bagh makes remote work feel like a privilege.",
        "Stayed in the Exclusive Suite for a startup summit. The helicopter city tour they arranged between sessions was the highlight of the entire trip. The rooftop infinity pool at night is absolutely surreal.",
        "The Lal Bagh view from the balcony was extraordinary. Woke up to birdsong and Coorg coffee. The organic breakfast menu was as thoughtful as any I've had at a 5-star in Europe.",
        "Bangalore's LuxeStays strikes the ideal balance between startup efficiency and luxury indulgence. Everything works, everything arrives on time, and the concierge knew every restaurant worth visiting in Indiranagar.",
        "Checked out of the Garden Double feeling like I'd had a mini-retreat. The cycling tours, the organic breakfast, and the staff's genuine warmth — Bangalore's hub is a hidden gem.",
    ],
    Chennai: [
        "The Marina View from the Presidential Suite is staggering — the longest urban beach in the world, bathed in the amber light of a Madras sunset. The Carnatic music performance in the suite was a magical personal concert.",
        "The Chettinad Heritage Room is a genuine love letter to Tamil culture. The Tanjore painting on the wall is apparently a commissioned original. I asked to take it home — they kindly declined.",
        "Fantastic service from a team that clearly loves Chennai and wants every guest to love it too. The marina promenade walk at dusk, followed by a Filter Kaapi back in the room, was the perfect Chennai evening.",
        "The silk gift and heritage guided tour were remarkable value-adds. The room's Athangudi tile floors and hand-carved teak furniture made me feel I was staying in a genuine Chettinad palace.",
        "First time in Chennai and LuxeStays made it extraordinary. The in-room South Indian thali for dinner was some of the best food I've had on any trip. Truly authentic and beautifully presented.",
    ],
    Coimbatore: [
        "I came to Coimbatore for a textile conference and left having fallen in love with the Nilgiris. The Kovai Garden Double's balcony jasmine scent wakes you up better than any alarm clock ever could.",
        "The Exclusive Suite eco-architecture is stunning — timber, glass, and the Western Ghats as living wallpaper. The sunrise meditation led by the naturalist guide was a transformative experience.",
        "The Ooty Day Trip shuttle from the Nilgiri Suite made our family holiday effortlessly organised. The kids' activity centre kept the little ones occupied while we explored the Botanical Garden.",
        "What I didn't expect was the sheer quality of the Ayurvedic spa package included with the Exclusive Suite. The Nilgiri herbs used in the treatments are grown right on the property. Exceptional.",
        "Coimbatore's hub is the most underrated in the entire LuxeStays portfolio. Quiet, breathtakingly scenic, and staffed by people who know every trail, waterfall, and organic farm within 50 km.",
    ],
    Dubai: [
        "The Burj-View Presidential Suite in Dubai is not a hotel room — it's an art installation. 400 sqm, a rooftop infinity pool, and the Burj Khalifa at sunset reflected in it. I genuinely had no words.",
        "The Desert Rose Suite lives up to every syllable of its name. The gold-plated fittings, the Amouage amenity set, the Rolls Royce airport transfer — this is what it means to travel without compromise.",
        "The Michelin chef on call in the Presidential Suite prepared a six-course Emirati-French fusion dinner. Paired with a custom wine selection flown in from Bordeaux. I plan to make this an annual pilgrimage.",
        "Dubai LuxeStays' concierge arranged a private yacht charter and a personal shopper tour of Dubai Mall, timed perfectly so we avoided the weekend crowds. The attention to detail is staggering.",
        "Gold Souk Family Room was fantastic for our family trip — spacious, thoughtfully designed, and the kids were thrilled by the desert safari experience arranged by the concierge within hours.",
    ],
};

// ============================================================
//  PAST BOOKING DATE GENERATOR
// ============================================================
const pastDate = (monthsAgo, daysStay) => {
    const checkOut = new Date();
    checkOut.setMonth(checkOut.getMonth() - monthsAgo);
    checkOut.setDate(checkOut.getDate() - Math.floor(Math.random() * 10));
    const checkIn = new Date(checkOut);
    checkIn.setDate(checkIn.getDate() - daysStay);
    return { checkIn, checkOut };
};

// ============================================================
//  MAIN SEED
// ============================================================
const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch all locations and rooms
    const locations = await Location.find({});
    const locMap = {};
    for (const loc of locations) {
        locMap[loc.city] = loc;
    }

    const roomsByCity = {};
    for (const city of Object.keys(locMap)) {
        const rooms = await Room.find({ location: locMap[city]._id });
        if (rooms.length > 0) roomsByCity[city] = rooms;
    }

    const cities = Object.keys(roomsByCity);
    if (cities.length === 0) {
        console.error('❌ No rooms found. Run seedRooms.js first!');
        process.exit(1);
    }

    console.log(`📍 Found rooms in: ${cities.join(', ')}\n`);

    // Assign bookings: each user gets 2 bookings in different cities
    const bookingPlan = [
        // [userIdx, cityA, cityB, stayA, stayB, monthsAgoA, monthsAgoB]
        [0, 'Mumbai', 'Dubai', 3, 2, 3, 1],   // Tony Stark
        [1, 'Delhi', 'Goa', 4, 3, 5, 2],   // Steve Rogers
        [2, 'Dubai', 'Mumbai', 5, 3, 4, 1],   // Bruce Wayne
        [3, 'Chennai', 'Coimbatore', 3, 4, 6, 2],   // Vijay Kumar
        [4, 'Coimbatore', 'Chennai', 4, 3, 5, 2],   // Dhanush
        [5, 'Goa', 'Bangalore', 3, 4, 4, 2],   // Trisha
        [6, 'Bangalore', 'Delhi', 3, 3, 5, 1],   // Anirudh
        [7, 'Mumbai', 'Goa', 4, 3, 3, 1],   // Ranveer Singh
        [8, 'Delhi', 'Dubai', 3, 4, 4, 2],   // Deepika Padukone
        [9, 'Mumbai', 'Chennai', 5, 3, 6, 2],   // Priyanka Chopra
        [10, 'Bangalore', 'Coimbatore', 3, 4, 3, 1],   // Ranbir Kapoor
        [11, 'Chennai', 'Goa', 4, 3, 5, 2],   // Nayanthara
    ];

    let usersCreated = 0, bookingsCreated = 0, reviewsCreated = 0;

    for (const plan of bookingPlan) {
        const [userIdx, cityA, cityB, stayA, stayB, moA, moB] = plan;
        const userData = USER_ROSTER[userIdx];

        // Create or find user
        let user = await User.findOne({ email: userData.email });
        if (!user) {
            user = await User.create({
                fullName: userData.fullName,
                email: userData.email,
                password: 'LuxeTest@123',
                role: 'resident',
                phoneNumber: userData.phone,
                loyaltyPoints: userData.loyalty,
                membershipTier: userData.tier,
                preferences: { dietary: userData.dietary, roomType: 'Suite' },
            });
            usersCreated++;
            console.log(`👤 Created: ${userData.fullName} (${userData.email})`);
        } else {
            console.log(`👤 Exists: ${userData.fullName}`);
        }

        // Helper to create ONE booking + review
        const makeBookingAndReview = async (city, stayDays, monthsAgo) => {
            if (!roomsByCity[city] || roomsByCity[city].length === 0) {
                console.warn(`   ⚠️  No rooms for ${city}, skipping.`);
                return;
            }

            const rooms = roomsByCity[city];
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const { checkIn, checkOut } = pastDate(monthsAgo, stayDays);
            const totalPrice = room.price * stayDays;

            // Check for duplicate booking
            const dupBooking = await Booking.findOne({ user: user._id, room: room._id, checkIn });
            if (dupBooking) {
                console.log(`   ↩  Booking for ${userData.fullName} @ ${city} already exists.`);
                return;
            }

            const booking = await Booking.create({
                user: user._id,
                room: room._id,
                location: locMap[city]._id,
                checkIn,
                checkOut,
                totalPrice,
                status: 'CheckedOut',
                guests: { adults: 2, children: 0 },
                paymentStatus: 'Paid',
            });
            bookingsCreated++;

            // Review
            const dupReview = await Review.findOne({ booking: booking._id });
            if (!dupReview) {
                const reviewBank = REVIEW_BANK[city] || [];
                const comment = reviewBank[Math.floor(Math.random() * reviewBank.length)] || `A wonderful stay at ${city}. Truly exceptional service and comfort.`;
                const overall = Math.random() > 0.15 ? 5 : 4;
                await Review.create({
                    user: user._id,
                    booking: booking._id,
                    location: city,
                    overallRating: overall,
                    categoryRatings: {
                        cleanliness: overall === 5 ? 5 : 4,
                        service: overall,
                        location: overall === 5 ? 5 : 4,
                        foodQuality: overall === 5 ? 5 : (Math.random() > 0.5 ? 5 : 4),
                        valueForMoney: overall === 5 ? 4 : 4,
                    },
                    comment,
                    status: 'Approved',
                    createdAt: checkOut,
                });
                reviewsCreated++;
            }

            console.log(`   ✅ ${userData.fullName}: ${city} (${checkIn.toDateString()} → ${checkOut.toDateString()}) ₹${totalPrice.toLocaleString()}`);
        };

        if (cities.includes(cityA)) await makeBookingAndReview(cityA, stayA, moA);
        if (cities.includes(cityB)) await makeBookingAndReview(cityB, stayB, moB);
    }

    console.log(`\n🎉 Done!`);
    console.log(`   👤 Users created:   ${usersCreated}`);
    console.log(`   📅 Bookings created: ${bookingsCreated}`);
    console.log(`   ⭐ Reviews created:  ${reviewsCreated}`);
    console.log(`\n🔑 All accounts → password: LuxeTest@123\n`);

    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Fatal:', err.message);
    process.exit(1);
});
