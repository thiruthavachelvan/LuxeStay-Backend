/**
 * fixBookingReviews.js
 * Re-creates reviews with correct star ratings and proper location linking.
 * Fixes the issue where seedReviewsV2 cleared reviews but couldn't rebuild
 * them because booking.location was not populated (no .city field).
 * Run: node scripts/fixBookingReviews.js
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

// Star-matched review text by city and rating
const REVIEW_TEXT = {
    5: {
        Mumbai: "Woke up to the Arabian Sea glittering outside — the Marine Drive view is absolutely unreal. The butler remembered I take my coffee black without being asked. Five star stay, zero hesitation.",
        Delhi: "The Lutyens Presidential Suite is the most dignified room I've ever had. Every Rajasthani marble tile tells a story. The in-suite dinner under the Delhi stars was simply extraordinary.",
        Goa: "Three steps from the Beach-connected Room to sand between my toes. The Mango Mojito at golden hour while watching the sun dissolve into the Arabian Sea was one of my top travel memories ever.",
        Bangalore: "The Exclusive Suite rooftop infinity pool at midnight over Bangalore's skyline was the single best hotel moment of my year. The tech concierge arranged a helicopter tour between sessions. Extraordinary.",
        Chennai: "The Marina Presidential Suite is staggering. The Carnatic music performance arranged in the suite was a genuinely once-in-a-lifetime experience. Perfect from check-in to checkout.",
        Coimbatore: "The Exclusive Suite eco-architecture, the sunrise naturalist meditation, the Ayurvedic spa with locally sourced Nilgiri herbs — exceptional at every level. Coimbatore's hidden treasure.",
        Dubai: "The Burj-View Presidential Suite is not a hotel room — it's an art installation. 400 sqm, rooftop infinity pool, and the Burj Khalifa at sunset. No words do it justice.",
    },
    4: {
        Mumbai: "Great stay at LuxeStays Mumbai. The Marine Drive views were gorgeous and breakfast was excellent. Check-in took longer than expected but service inside was warm and attentive throughout.",
        Delhi: "Solid Delhi experience. The heritage-inspired décor was tasteful and the Lutyens location is unbeatable for business. Breakfast variety could be better but overall a strong four-star stay.",
        Goa: "Beach-connected Room exceeded expectations. Direct beach access is rare at this quality level in North Goa. Cocktail hour was a lovely touch. Checkout process a bit slow but no major issues.",
        Bangalore: "Perfect for business — fast wifi, great shuttle, lovely garden view. The breakfast menu lacked South Indian options which felt like a miss for Bangalore, but otherwise very comfortable.",
        Chennai: "Lovely heritage touches, especially the Tanjore painting display. The temple visit was very well organised. Dinner service was slow one evening but overall food quality was high.",
        Coimbatore: "A very pleasant stay. The Western Ghats views are soothing, breakfast was fresh, and staff arranged a last-minute trek guide. WiFi was patchy outdoors but indoors it was fine.",
        Dubai: "The Gold Souk Family Room gave us plenty of room. The Desert Safari they arranged was spectacular. The room was impeccably maintained. Billing process was slightly confusing.",
    },
    3: {
        Mumbai: "Decent stay but expectations were set high by the marketing. Sea view is lovely but the room felt slightly dated for the price. Staff were pleasant but slow on service requests at weekends.",
        Delhi: "Comfortable, nothing more. Heritage décor in common areas is beautiful but the in-room experience felt generic. Breakfast variety was disappointing for a property of this calibre.",
        Goa: "Beach access is the main selling point and it delivers. However the room is quite small for the price and water pressure was genuinely poor. Cocktail hour was a saving grace.",
        Bangalore: "Fine for a business trip. Room service app kept crashing and ordering by phone was slow. Room was clean and comfortable but minibar prices are absurd compared to market rates.",
        Chennai: "The heritage elements are beautiful but service quality doesn't match the price tag. Our breakfast order was wrong on two of three mornings. Marina view was spectacular.",
        Coimbatore: "Pleasant enough but overpriced for what Coimbatore offers. Garden views are lovely and breakfast was good. Room facilities are fairly standard for the price charged.",
        Dubai: "A plumbing issue in the bathroom took 3 hours to resolve. The room itself was luxurious and the Burj view was incredible but service let the overall experience down.",
    },
    2: {
        Mumbai: "Disappointing for the price. The room had visible ceiling wear, a non-functional bedside lamp, and slow service. The sea view was lovely but not enough to justify the cost.",
        Delhi: "Terrible value. Room looked like it hadn't been updated in years. AC rattled through both nights and housekeeping missed our room entirely on day two. Heritage lobby is all show.",
        Goa: "The listing photos are clearly not representative. Our room had a mouldy smell from the AC. When we raised this, we were offered a perfume spray. Extremely disappointing.",
        Bangalore: "WiFi was down for nearly 12 hours during a critical work trip. For a property targeting tech workers in India's Silicon Valley, this is completely unacceptable.",
        Chennai: "The room service menu had no relation to what was actually available. Three dinner orders were 'unavailable'. Heritage décor is lovely but operational standards are very poor.",
        Coimbatore: "Nice location but the room needs renovation. Bathroom fixtures are old, lighting is dim, and breakfast service was chaotic. Staff were friendly but facilities don't match the pricing.",
        Dubai: "Paid a premium expecting premium. Room wasn't ready on arrival (2 hour wait), Rolls Royce transfer replaced with a regular sedan without notice. A hugely disappointing stay.",
    },
};

// distribute ratings: 40% 5★, 35% 4★, 15% 3★, 10% 2★
const pickRating = () => {
    const r = Math.random();
    if (r < 0.40) return 5;
    if (r < 0.75) return 4;
    if (r < 0.90) return 3;
    return 2;
};

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all reviews and rebuild them from existing bookings
    await Review.deleteMany({});
    console.log('🗑  Cleared all reviews — rebuilding from bookings...\n');

    // Fetch all CheckedOut bookings with room and location populated
    const bookings = await Booking.find({ status: 'CheckedOut' })
        .populate('location', 'city')
        .populate('room', 'price')
        .populate('user', 'fullName email loyaltyPoints');

    console.log(`📋 Found ${bookings.length} CheckedOut bookings\n`);

    let created = 0, skipped = 0;
    for (const booking of bookings) {
        const city = booking.location?.city;
        if (!city) { skipped++; continue; }

        // assign rating based on user tier (higher loyalty = more likely 5★)
        const loyalty = booking.user?.loyaltyPoints || 500;
        let stars;
        if (loyalty > 4000) stars = Math.random() > 0.2 ? 5 : 4;
        else if (loyalty > 2000) stars = pickRating();
        else stars = Math.random() > 0.5 ? 4 : 3;

        const textBank = REVIEW_TEXT[stars];
        const comment = textBank?.[city] || textBank?.Mumbai || `A ${stars >= 4 ? 'great' : stars === 3 ? 'decent' : 'disappointing'} stay in ${city}.`;

        await Review.create({
            user: booking.user._id,
            booking: booking._id,
            location: city,
            overallRating: stars,
            categoryRatings: {
                cleanliness: stars >= 4 ? stars : Math.max(1, stars - 1),
                service: stars >= 4 ? stars : Math.max(1, stars - 1),
                location: Math.min(5, stars + 0),
                foodQuality: stars >= 5 ? 5 : Math.max(1, stars),
                valueForMoney: stars >= 4 ? stars - 1 : Math.max(1, stars - 1),
            },
            comment,
            status: 'Approved',
            createdAt: booking.checkOut || new Date(),
        });

        console.log(`   ⭐${stars} ${booking.user?.fullName || 'User'} @ ${city} (room: ${booking.room?._id || 'n/a'})`);
        created++;
    }

    console.log(`\n🎉 Done! Created ${created} reviews (${skipped} skipped — no city)`);
    console.log('Rating distribution: ~40% 5★, ~35% 4★, ~15% 3★, ~10% 2★');
    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
