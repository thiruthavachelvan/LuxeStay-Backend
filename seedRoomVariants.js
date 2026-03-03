require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Room = require('./models/Room');


// ─── Tier definitions per room type ─────────────────────────────────────────
const VARIANTS = {
    'Single Room': [
        {
            tier: 'Base', priceMult: 1, price: 1200,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV'],
            benefits: ['Welcome Drinks', 'Express Check-in'],
            description: 'A comfortable single room with essential modern amenities perfect for solo travellers seeking value.'
        },
        {
            tier: 'Mid', priceMult: 1.5, price: 1800,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker'],
            benefits: ['Welcome Drinks', 'Express Check-in', 'High Speed Internet'],
            description: 'An upgraded single room featuring a mini bar and coffee maker — ideal for extended solo stays.'
        },
        {
            tier: 'Premium', priceMult: 2, price: 2500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine'],
            benefits: ['Welcome Drinks', 'Express Check-in', 'High Speed Internet', 'Laundry Service'],
            description: 'Our finest single room with premium toiletries, Nespresso machine, and complimentary laundry service for the discerning solo guest.'
        },
    ],
    'Accessible Room': [
        {
            tier: 'Base', price: 1200,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Wheelchair Access'],
            benefits: ['Welcome Drinks', 'Express Check-in', 'Accessibility Assistance'],
            description: 'A thoughtfully designed accessible room ensuring comfort and independence for guests with mobility needs.'
        },
        {
            tier: 'Mid', price: 1800,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Wheelchair Access', 'Mini Bar', 'Coffee Maker'],
            benefits: ['Welcome Drinks', 'Express Check-in', 'Accessibility Assistance', 'High Speed Internet'],
            description: 'Enhanced accessible room with extra conveniences including a mini bar and high-speed internet.'
        },
        {
            tier: 'Premium', price: 2500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Wheelchair Access', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries'],
            benefits: ['Welcome Drinks', 'Express Check-in', 'Accessibility Assistance', 'High Speed Internet', 'Laundry Service'],
            description: 'Our premium accessible suite with all the luxury comforts adapted for complete accessibility.'
        },
    ],
    'Double Room': [
        {
            tier: 'Base', price: 2500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker'],
            benefits: ['Welcome Drinks', 'Express Check-in', 'High Speed Internet', 'Laundry Service'],
            description: 'A well-appointed double room offering essential comforts for couples or friends travelling together.'
        },
        {
            tier: 'Mid', price: 3500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service'],
            description: 'An elevated double with Nespresso coffee, premium bath products, and complimentary breakfast — perfect for a romantic getaway.'
        },
        {
            tier: 'Premium', price: 4500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine', 'Bose Sound System'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access'],
            description: 'Our finest double room with a Bose sound system, executive lounge access, and a full luxury service package.'
        },
    ],
    'Family Room': [
        {
            tier: 'Base', price: 3500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service'],
            description: 'A spacious family room offering generous space and essential amenities for families of up to 4.'
        },
        {
            tier: 'Mid', price: 5000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine', 'Bose Sound System'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Express Check-in'],
            description: 'An upgraded family suite with entertainment-ready Bose sound system and Nespresso station for the whole family to enjoy.'
        },
        {
            tier: 'Premium', price: 6500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Express Check-in', 'Lounge Access'],
            description: 'Our deluxe family suite with luxury silk robes, lounge access, and a full luxury service package for the perfect family vacation.'
        },
    ],
    'Deluxe Room': [
        {
            tier: 'Base', price: 5000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Express Check-in', 'Lounge Access'],
            description: 'Experience elevated comfort in our Deluxe Room with premium furnishings, Nespresso coffee, and executive lounge access.'
        },
        {
            tier: 'Mid', price: 7000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Express Check-in', 'Lounge Access', 'Butler Service 24/7'],
            description: 'Enhanced Deluxe Room with 24/7 butler service, Bose sound system, and luxury silk robes for a truly indulgent stay.'
        },
        {
            tier: 'Premium', price: 9500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Jacuzzi Bath'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Express Check-in', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer'],
            description: 'Our finest Deluxe room with a private jacuzzi, VIP airport transfer, and full butler service — a complete luxury statement.'
        },
    ],
    'Executive Room': [
        {
            tier: 'Base', price: 7500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine', 'Bose Sound System'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Express Check-in', 'Lounge Access', 'VIP Airport Transfer'],
            description: 'Designed for business travellers and executives, featuring premium tech, fast connectivity, and VIP transfers.'
        },
        {
            tier: 'Mid', price: 10000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Express Check-in', 'Lounge Access', 'VIP Airport Transfer', 'Butler Service 24/7'],
            description: 'An elevated executive suite with personal butler, luxury robes, and full business-class services.'
        },
        {
            tier: 'Premium', price: 13000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Coffee Maker', 'Premium Toiletries', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Jacuzzi Bath', 'Private Sunbed'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Express Check-in', 'Lounge Access', 'VIP Airport Transfer', 'Butler Service 24/7', 'Evening Cocktails'],
            description: 'Our premier executive suite — the pinnacle of business luxury, with jacuzzi, private sunbed, and evening cocktail service.'
        },
    ],
    'Themed Room': [
        {
            tier: 'Base', price: 6000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Silk Robes'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service'],
            description: 'Escape into a uniquely designed themed room that creates an atmosphere unlike any standard room.'
        },
        {
            tier: 'Mid', price: 8500,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7'],
            description: 'Our premium themed room with immersive décor, butler service, and a curated luxury amenity set.'
        },
        {
            tier: 'Premium', price: 12000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer'],
            description: 'The ultimate themed experience — a fully immersive luxury universe complete with jacuzzi, butler, and VIP arrival.'
        },
    ],
    'Honeymoon Suite': [
        {
            tier: 'Base', price: 12000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'Evening Cocktails'],
            description: 'A romantic getaway suite featuring jacuzzi, silk robes, and evening cocktails to celebrate your special occasion.'
        },
        {
            tier: 'Mid', price: 16000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Evening Cocktails'],
            description: 'A premium honeymoon retreat with private sunbed, Bose sound, VIP airport transfer, and a full romance package.'
        },
        {
            tier: 'Premium', price: 22000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed', 'Beach Kit'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Evening Cocktails', 'Personal Concierge'],
            description: 'The grandest honeymoon experience — complete with private beach kit, personal concierge, and an unforgettable luxury ambiance.'
        },
    ],
    'Beach-connected Room': [
        {
            tier: 'Base', price: 10000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Silk Robes', 'Beach Kit', 'Private Sunbed'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7'],
            description: 'Step directly onto the beach from your elegantly appointed room with beach kit and private sunbed included.'
        },
        {
            tier: 'Mid', price: 14000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Beach Kit', 'Private Sunbed', 'Premium Toiletries'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer'],
            description: 'An elevated beachfront room with Bose entertainment system, VIP arrival, and curated beach luxury amenities.'
        },
        {
            tier: 'Premium', price: 18000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Beach Kit', 'Private Sunbed', 'Premium Toiletries', 'Jacuzzi Bath'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Evening Cocktails'],
            description: 'Our premium beachfront sanctuary with jacuzzi overlooking the sea, evening cocktails, and a full luxury beach package.'
        },
    ],
    'Private Pool Room': [
        {
            tier: 'Base', price: 18000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer'],
            description: 'Your own private plunge pool, jacuzzi, and butler service — an exclusive retreat for the most discerning guests.'
        },
        {
            tier: 'Mid', price: 24000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Beach Kit', 'Private Sunbed', 'Premium Toiletries', 'Jacuzzi Bath'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Exclusive Lounge Access', 'Evening Cocktails'],
            description: 'An elevated private pool villa with beach kit, Bose entertainment, exclusive lounge, and evening cocktails in paradise.'
        },
        {
            tier: 'Premium', price: 30000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Beach Kit', 'Private Sunbed', 'Premium Toiletries', 'Jacuzzi Bath'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Exclusive Lounge Access', 'Evening Cocktails', 'Personal Concierge'],
            description: 'The ultimate private pool paradise — every detail curated, every luxury included, with personal concierge at your service.'
        },
    ],
    'Exclusive Suite': [
        {
            tier: 'Base', price: 20000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Exclusive Lounge Access'],
            description: 'An exclusive suite of unparalleled elegance, designed for guests who accept nothing less than perfection.'
        },
        {
            tier: 'Mid', price: 28000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed', 'Beach Kit'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Exclusive Lounge Access', 'Evening Cocktails'],
            description: 'An elevated exclusive suite with beach kit, evening cocktail service, and an immersive luxury experience at every turn.'
        },
        {
            tier: 'Premium', price: 38000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed', 'Beach Kit'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Exclusive Lounge Access', 'Evening Cocktails', 'Personal Concierge'],
            description: 'The crown jewel of our exclusive suites — personal concierge, full beach setup, and the finest luxury amenities curated for royalty.'
        },
    ],
    'Presidential Suite': [
        {
            tier: 'Base', price: 25000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Exclusive Lounge Access', 'Evening Cocktails'],
            description: 'The Presidential Suite — an iconic luxury experience with full butler service, jacuzzi, and VIP arrival in every detail.'
        },
        {
            tier: 'Mid', price: 35000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed', 'Beach Kit'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Exclusive Lounge Access', 'Evening Cocktails', 'Personal Concierge'],
            description: 'Our signature Presidential Suite with personal concierge, private beach kit, and a legacy of unmatched hospitality.'
        },
        {
            tier: 'Premium', price: 50000,
            amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Nespresso Machine', 'Bose Sound System', 'Silk Robes', 'Premium Toiletries', 'Jacuzzi Bath', 'Private Sunbed', 'Beach Kit'],
            benefits: ['Welcome Drinks', 'Complimentary Breakfast', 'High Speed Internet', 'Laundry Service', 'Lounge Access', 'Butler Service 24/7', 'VIP Airport Transfer', 'Exclusive Lounge Access', 'Evening Cocktails', 'Personal Concierge'],
            description: 'LuxeStay\'s magnum opus — the ultra-premium Presidential Suite with every conceivable luxury, reserved for the world\'s most distinguished guests.'
        },
    ],
};

/**
 * Assigns a tier index based on position within a sorted group.
 * Distribution: first ~50% → Base (0), next ~33% → Mid (1), last ~17% → Premium (2)
 */
function assignTierIndex(positionInGroup, totalInGroup) {
    const baseCount = Math.ceil(totalInGroup * 0.5);
    const midCount = Math.ceil(totalInGroup * 0.33);
    if (positionInGroup < baseCount) return 0;
    if (positionInGroup < baseCount + midCount) return 1;
    return 2;
}

async function seedVariants() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        const allRooms = await Room.find({}).sort({ type: 1, roomNumber: 1 });
        console.log(`Found ${allRooms.length} rooms total`);

        // Group by type
        const groups = {};
        for (const room of allRooms) {
            if (!groups[room.type]) groups[room.type] = [];
            groups[room.type].push(room);
        }

        let updated = 0;
        for (const [type, rooms] of Object.entries(groups)) {
            const variants = VARIANTS[type];
            if (!variants) { console.log(`  ⚠ No variant config for "${type}", skipping.`); continue; }

            console.log(`\n  [${type}] — ${rooms.length} rooms`);
            for (let i = 0; i < rooms.length; i++) {
                const tierIdx = assignTierIndex(i, rooms.length);
                const variant = variants[Math.min(tierIdx, variants.length - 1)];
                await Room.findByIdAndUpdate(rooms[i]._id, {
                    price: variant.price,
                    amenities: variant.amenities,
                    benefits: variant.benefits,
                    description: variant.description,
                    luxuryLevel: tierIdx + 1,
                });
                console.log(`    Room ${rooms[i].roomNumber} → Tier ${tierIdx + 1} (${variant.tier}) ₹${variant.price}`);
                updated++;
            }
        }

        console.log(`\n✅ Done! Updated ${updated} rooms.`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

seedVariants();
