/**
 * seedReviewsV2.js
 * Updates/adds reviews with text that MATCHES the star rating.
 * Adds some genuine 2-3★ critical reviews for realism.
 * Run: node scripts/seedReviewsV2.js
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

// Review text is now grouped by star rating AND city — matching tone/star accurately
const REVIEWS = {
    5: {
        Mumbai: [
            "Woke up to the Arabian Sea glittering at my feet — I've never had a more cinematic morning. The Marine Drive view is absolutely unreal. The butler remembered I take my coffee black without being asked. Five stars, no hesitation.",
            "LuxeStays Mumbai is the only hotel that genuinely makes Mumbai feel intimate. Slept with the windows open to the summer sea breeze. Zero complaints — the suite was immaculate and the service was invisible perfection.",
        ],
        Delhi: [
            "The Lutyens Presidential Suite is the most dignified room I've ever had the privilege of inhabiting. Every Rajasthani marble tile tells a story. The in-suite dinner under the Delhi stars was simply extraordinaire.",
            "From the Parliament view to the museum-worthy Mughal murals — every inch of this room is considered. The team anticipated every need before I voiced it. This is what five-star should feel like.",
        ],
        Goa: [
            "I took exactly three steps from the Beach-connected Room to have my toes in the sand. The cocktail served at golden hour with a Mango Mojito in hand while watching the sun melt into the Arabian Sea — I'm booking again for December.",
            "The Sunset Honeymoon Suite was beyond our wildest anniversary expectations. Champagne on arrival, fragrant flower turndown, couples' spa, and that breathtaking private terrace view. Pure, romantic perfection.",
        ],
        Bangalore: [
            "The Exclusive Suite rooftop infinity pool at midnight, overlooking Bangalore's glittering skyline, was the single best hotel moment of my year. The tech concierge arranged a helicopter tour between our conference sessions. Extraordinary.",
            "Lal Bagh view from the balcony, organic breakfast, Coorg cold brew — I came for a summit and left feeling like I'd had a retreat. Bangalore's hub is the best-kept secret in this city.",
        ],
        Chennai: [
            "The Marina Presidential Suite is staggering — the longest urban beach in the world bathed in amber sunset, complemented by a Carnatic music performance in the suite itself. A genuine, unrepeatable luxury experience.",
            "The Chettinad Heritage Room's Athangudi tile floors and hand-carved teak furniture made me feel I was in a living museum. The Filter Kaapi served in a traditional paanai each morning was the perfect authentic touch.",
        ],
        Coimbatore: [
            "I expected a nice stay — I did not expect a transformative experience. The eco-architecture, the sunrise naturalist meditation, the Ayurvedic spa using locally harvested Nilgiri herbs — exceptional at every level.",
            "The Kovai Garden Double's jasmine-scented balcony genuinely woke me up better than any alarm clock. The Ooty Day Trip shuttle was perfectly arranged. A magical base for exploring the hills.",
        ],
        Dubai: [
            "The Burj-View Presidential Suite is not a hotel room — it is an art installation. 400 sqm, a rooftop infinity pool, and the Burj Khalifa at sunset reflected perfectly in the still water. No words do it justice.",
            "The Desert Rose Suite: Amouage amenities, 24ct gold-plated fixtures, Michelin chef on call, Rolls Royce to the airport. I have stayed at the Burj Al Arab and Atlantis. This was better in every way that matters.",
        ],
    },
    4: {
        Mumbai: [
            "Really enjoyed our 3-night stay at LuxeStays Mumbai. The Marine Drive views were gorgeous and the breakfast was excellent. The check-in took a little longer than expected but once inside, service was warm and attentive.",
            "Great location, comfortable room, helpful staff. The balcony sea view was worth every rupee. Would dock a star only for the slightly slow room service during busy evenings — otherwise a strong four-star stay.",
        ],
        Delhi: [
            "A very solid Delhi experience. The heritage-inspired décor was tasteful without being theatrical, and the location in Lutyens' zone is unbeatable for business travellers. The breakfast could have had more variety.",
            "Really impressed by the room quality and the curated Mughal art. The Old Delhi tour added by the concierge was a brilliant suggestion. Slight delay in housekeeping but nothing that spoiled an otherwise lovely stay.",
        ],
        Goa: [
            "The Beach-connected Room exceeded expectations for the price. Direct beach access is genuinely rare in North Goa at this quality level. The cocktail hour was a nice touch. Checkout process a bit slow but no major issues.",
            "Beautiful property with great sea views. Room was clean and well-appointed. The Feni tasting was a fun local touch. Service is occasionally inconsistent but the overall experience is very good.",
        ],
        Bangalore: [
            "Perfect for business travellers — fast wifi, ergonomic setup, great shuttle to tech parks. Garden view was lovely. Breakfast menu lacked South Indian options which felt like a miss for a Bangalore property.",
            "Comfortable and well-located room with a great Lal Bagh view from the balcony. Staff were helpful and professional. Gym facilities are a bit dated compared to the room quality. Good value overall.",
        ],
        Chennai: [
            "Lovely heritage touches throughout the room — the Tanjore painting display was a personal highlight. The complimentary temple visit was very well organised. Dinner service was slow one evening but the food quality was high.",
            "The Marina View suite had an incredible outlook. Clean, well-maintained, helpful staff. The Filter Kaapi service in the morning was delightful. Would have loved a pool on-site to give it that extra edge.",
        ],
        Coimbatore: [
            "A very pleasant stay in a property that clearly loves its location. The Western Ghats views are soothing, the breakfast was fresh, and the staff went out of their way to arrange a last-minute trek guide.",
            "Good quality property in Coimbatore. The room was cosy and comfortable with a beautiful garden view. Nilgiri tea in the evening was a lovely touch. WiFi signal was weak in the garden area though.",
        ],
        Dubai: [
            "The Gold Souk Family Room gave us plenty of space for the whole family. The Desert Safari they arranged was spectacular and the kids loved it. The room itself was impeccably maintained. Billing process slightly confusing but resolved quickly.",
            "Dubai LuxeStays delivered a thoroughly impressive stay. Burj view from the suite was world-class. Butler service was attentive. The yacht charter coordination took longer than advertised but the experience itself was excellent.",
        ],
    },
    3: {
        Mumbai: [
            "Decent stay overall but expectations were set high by the marketing. The sea view is real and beautiful, but the room felt slightly dated for the price point. Staff were pleasant but response times for service requests were slow during weekends.",
            "Good location, mediocre execution. The room had a musty smell when we first checked in that took a few hours to clear. Marine Drive views saved the experience. Would stay again at a lower rate, not at this premium.",
        ],
        Delhi: [
            "Comfortable enough but not truly luxury-grade for the price they charge. The heritage décor in the common areas is beautiful but the in-room experience felt generic. The breakfast variety was disappointing for a property of this calibre.",
            "Serviceable stay, nothing more. The room was clean and the location is excellent, but we encountered some noise from adjacent rooms and the AC was inconsistent. Staff were helpful when approached but not proactively attentive.",
        ],
        Goa: [
            "The beach access is the main selling point — and it delivers. However, the room itself is quite small for the price, and the water pressure in the bathroom was genuinely poor. The cocktail hour was a nice touch.",
            "Three nights in Goa and the experience was mixed. The location is beautiful, staff were friendly, but there were small quality issues — chipped tiles in the bathroom, a TV remote that didn't work, and slow housekeeping.",
        ],
        Bangalore: [
            "Fine for a business trip but nothing special. The room service app kept crashing and ordering via phone took too long. The room itself was clean and comfortable but the minibar prices are absurd for what's offered.",
            "Functional and reasonably comfortable room. The garden view is pleasant but the gym facilities are quite dated for a property marketing itself as luxury. WiFi was patchy near the bathroom.",
        ],
        Chennai: [
            "The heritage elements in the room are beautiful but the overall service quality doesn't match the price tag. Our breakfast order was wrong on two of three mornings. The Marina view is genuinely spectacular though.",
            "Decent stay with some clear gaps. The turn-down service felt rushed, and our request for extra pillows took almost an hour. The Filter Kaapi ritual is a lovely concept but the coffee itself was only average.",
        ],
        Coimbatore: [
            "Pleasant enough but overpriced for what Coimbatore is as a destination. The garden views are lovely, but the room facilities are fairly standard. Breakfast was good. Would recommend at a lower tier of pricing.",
            "Nice location but the room needs renovation. The bathroom fixtures felt old and the lighting in the room was quite dim. Staff were friendly and the Nilgiri views from the balcony were genuinely beautiful.",
        ],
        Dubai: [
            "Dubai's room service and butler expectations are high and this property occasionally struggles to meet them. The room itself was luxurious but a plumbing issue in the bathroom took 3 hours to resolve. Beautiful suite otherwise.",
            "Honestly expecting a bit more for this price in Dubai. The room was immaculate and the Burj view was wow-worthy, but the airport transfer was nearly 20 minutes late, and the check-in took way too long.",
        ],
    },
    2: {
        Mumbai: [
            "Disappointing stay for the premium price. The room had visible wear on the ceiling, a non-functional bedside lamp, and the TV remote kept losing connection. The sea view was lovely but that alone does not justify the cost. Staff were apologetic but slow to resolve issues.",
            "Spent two nights here expecting a luxury experience. What we got was a tired room with an average bed and slow service. The famous Marine Drive view is real but the rest of the experience felt overpriced and under-delivered.",
        ],
        Delhi: [
            "Terrible value for money. The room looked like it hadn't been refurbished in several years. AC made a loud rattling noise through both nights, and housekeeping missed our room entirely on day two. The heritage-inspired lobby is beautiful but it's all show.",
        ],
        Goa: [
            "The listing photos are clearly not representative of current room condition. The beach access is real but our room had a mouldy smell from the AC that ruined the experience. When we raised this, we were offered a perfume spray. Extremely disappointed.",
        ],
        Bangalore: [
            "WiFi was down for almost 12 hours during a critical work trip. The tech concierge took 3 hours to acknowledge the issue. For a property targeting business travellers in India's tech capital, this is simply unacceptable.",
        ],
        Chennai: [
            "The room service menu online bore no relation to what was actually available. Three of our dinner orders were 'unavailable.' The heritage décor is lovely but the operational standards are very below par for this price.",
        ],
        Dubai: [
            "We paid a premium expecting premium treatment. Instead: our room wasn't ready on arrival (2 hr wait), the Rolls Royce transfer was replaced with a regular sedan without notification, and the Michelin chef 'wasn't available' the whole trip. A hugely disappointing stay.",
        ],
    },
};

// Extra users for bad reviews
const BAD_REVIEW_USERS = [
    { fullName: 'Arun Krishnamurthy', email: 'arun.k@luxestays.com', phone: '+91 99001 11013' },
    { fullName: 'Meena Iyer', email: 'meena.iyer@luxestays.com', phone: '+91 99001 11014' },
    { fullName: 'Kartik Aryan', email: 'kartik.aryan@luxestays.com', phone: '+91 99001 11015' },
];

const pastDate = (monthsAgo, days) => {
    const out = new Date();
    out.setMonth(out.getMonth() - monthsAgo);
    out.setDate(out.getDate() - Math.floor(Math.random() * 5));
    const inn = new Date(out);
    inn.setDate(inn.getDate() - days);
    return { checkIn: inn, checkOut: out };
};

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Delete ALL existing reviews and rebuild them correctly
    await Review.deleteMany({});
    console.log('🗑  Cleared all previous reviews');

    const locations = await Location.find({});
    const locMap = {};
    for (const l of locations) locMap[l.city] = l;

    const roomsByCity = {};
    for (const city of Object.keys(locMap)) {
        const rooms = await Room.find({ location: locMap[city]._id });
        if (rooms.length > 0) roomsByCity[city] = rooms;
    }

    // 2. Rebuild existing user bookings with correct rating-matched reviews
    const users = await User.find({ role: 'resident', email: /@luxestays\.com$/ });
    let bookingsChecked = 0, reviewsCreated = 0;

    for (const user of users) {
        const bookings = await Booking.find({ user: user._id, status: 'CheckedOut' }).populate('location');
        for (const booking of bookings) {
            const city = booking.location?.city;
            if (!city) continue;

            // Assign rating: known users get 4-5, others 4-5 or 3
            let stars = 5;
            if (user.loyaltyPoints < 1000) stars = 4;  // lower tier users get 4
            if (user.email === 'arun.k@luxestays.com' || user.email === 'meena.iyer@luxestays.com' || user.email === 'kartik.aryan@luxestays.com') {
                stars = Math.random() > 0.5 ? 2 : 3;
            }

            const bankForCity = REVIEWS[stars]?.[city] || REVIEWS[stars]?.Mumbai || [];
            const comment = bankForCity[Math.floor(Math.random() * bankForCity.length)] ||
                `A ${stars >= 4 ? 'wonderful' : stars === 3 ? 'decent' : 'disappointing'} stay in ${city}.`;

            await Review.create({
                user: user._id,
                booking: booking._id,
                location: city,
                overallRating: stars,
                categoryRatings: {
                    cleanliness: stars >= 4 ? stars : Math.max(1, stars - 1),
                    service: stars >= 4 ? stars : Math.max(1, stars - 1),
                    location: stars,
                    foodQuality: stars >= 5 ? 5 : stars,
                    valueForMoney: stars >= 4 ? stars - 1 : Math.max(1, stars - 1),
                },
                comment,
                status: 'Approved',
                createdAt: booking.checkOut,
            });
            reviewsCreated++;
            bookingsChecked++;
        }
    }

    // 3. Create bad review users and their bookings
    const cities = Object.keys(roomsByCity);
    for (const [idx, ud] of BAD_REVIEW_USERS.entries()) {
        let user = await User.findOne({ email: ud.email });
        if (!user) {
            user = await User.create({
                fullName: ud.fullName, email: ud.email,
                password: 'LuxeTest@123', role: 'resident',
                phoneNumber: ud.phone, loyaltyPoints: 100, membershipTier: 'None',
            });
        }

        const city = cities[idx % cities.length];
        const rooms = roomsByCity[city];
        if (!rooms || rooms.length === 0) continue;
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const { checkIn, checkOut } = pastDate(7 + idx, 2);

        let booking = await Booking.findOne({ user: user._id, room: room._id });
        if (!booking) {
            booking = await Booking.create({
                user: user._id, room: room._id,
                location: locMap[city]._id,
                checkIn, checkOut,
                totalPrice: room.price * 2,
                status: 'CheckedOut',
                guests: { adults: 2, children: 0 },
                paymentStatus: 'Paid',
            });
        }

        const stars = 2;
        const bankForCity = REVIEWS[stars]?.[city] || REVIEWS[stars]?.Mumbai || [];
        const comment = bankForCity[Math.floor(Math.random() * bankForCity.length)] || `Disappointing stay in ${city}. Not worth the price.`;

        const dupReview = await Review.findOne({ booking: booking._id });
        if (!dupReview) {
            await Review.create({
                user: user._id, booking: booking._id,
                location: city,
                overallRating: stars,
                categoryRatings: { cleanliness: 2, service: 1, location: 3, foodQuality: 2, valueForMoney: 1 },
                comment, status: 'Approved',
                createdAt: checkOut,
            });
            reviewsCreated++;
        }
        console.log(`   ⭐${stars} Review: ${ud.fullName} @ ${city}`);
    }

    console.log(`\n🎉 Done! Processed ${bookingsChecked} bookings, created ${reviewsCreated} reviews.`);
    console.log('Reviews now correctly match their star ratings (5★=glowing, 4★=good, 3★=average, 2★=poor)');
    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
