/**
 * seedLocationSpecialRooms.js
 * Adds "Location Special" themed rooms to each hub.
 * These rooms showcase the local culture, heritage, and character of each city.
 * Run: node scripts/seedLocationSpecialRooms.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Room = require('../models/Room');
const Location = require('../models/Location');

const LOCATION_SPECIAL_ROOMS = {
    Mumbai: {
        roomNumber: 'MUM-LS1',
        floor: 'Location Special',
        type: 'Themed Room',
        price: 18000,
        capacity: { adults: 2, children: 1 },
        amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker'],
        benefits: ['Bollywood Studio Tour', 'Irani Café Breakfast', 'Dabba-Wala Experience', 'Marine Drive Sunset Cruise'],
        description: 'A love letter to India\'s City of Dreams. The Mumbai Legends Room is adorned with vintage Bollywood posters, Art Deco architectural accents inspired by the Gateway of India, and handcrafted Warli tribal art panels from the Sahyadri belt. Your morning begins with a bespoke Irani café experience — cutting chai, bun maska, and the warm chaos of Bombay rising outside your window.',
        viewType: 'Sea View',
        bedType: 'King Size',
        area: '60 m²',
        luxuryLevel: 4,
        images: [
            'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200',
        ],
    },
    Delhi: {
        roomNumber: 'DEL-LS1',
        floor: 'Location Special',
        type: 'Themed Room',
        price: 20000,
        capacity: { adults: 2, children: 1 },
        amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
        benefits: ['Mughal Miniature Art Display', 'Old Delhi Haveli Walk', 'Chandni Chowk Breakfast Tour', 'Personal Historian Guide'],
        description: 'Delhi\'s paradox of ancient grandeur and modern power is encapsulated in this extraordinary Mughal-inspired room. Jali lattice panels cast golden light across hand-embroidered Zardozi cushions. Every fixture is a nod to the Shahjahani era — from the inlaid marble flooring to the hand-painted ceiling medallion depicting the Red Fort. The room includes a dedicated haveli-style alcove study, perfect for the diplomat or the dreamer.',
        viewType: 'Garden View',
        bedType: 'King Size',
        area: '65 m²',
        luxuryLevel: 4,
        images: [
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1200',
        ],
    },
    Goa: {
        roomNumber: 'GOA-LS1',
        floor: 'Location Special',
        type: 'Themed Room',
        price: 16000,
        capacity: { adults: 2, children: 0 },
        amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker'],
        benefits: ['Portuguese Azulejo Tile Art', 'Feni Tasting Experience', 'Old Goa Church Walking Tour', 'Spice Plantation Picnic'],
        description: 'Goa\'s 451 years of Portuguese heritage breathes through every tile in this unique room. Handpainted Azulejo blue-and-white ceramic panels line the walls, depicting the caravel ships that first brought Portuguese explorers to these shores. The open-air rain shower is enclosed by centuries-old laterite stone walls, and the balcony overlooks a centuries-old cashew orchard. Sip a complimentary Feni cocktail as the breeze carries the scent of jasmine and sea salt.',
        viewType: 'Garden View',
        bedType: 'King Size',
        area: '55 m²',
        luxuryLevel: 4,
        images: [
            'https://images.unsplash.com/photo-1515362778563-6a8d0e44bc0b?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1200',
        ],
    },
    Bangalore: {
        roomNumber: 'BLR-LS1',
        floor: 'Location Special',
        type: 'Themed Room',
        price: 14000,
        capacity: { adults: 2, children: 0 },
        amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
        benefits: ['Mysore Silk Bedlinen', 'Coorg Planter Breakfast', 'Cubbon Park Morning Walk', 'Craft Brew Experience'],
        description: 'Where the Garden City meets the Silicon Valley of India. The Bangalore Culture Room celebrates the city\'s unique identity — Kannadiga heritage filtered through a startup lens. Hand-loomed Mysore silk drapes in deep purple and gold cover the four-poster bed. The "Bengaluru Brew Corner" stocks five local craft beers alongside a Bisi Bele Bath breakfast kit for a truly authentic morning. The workspace features a standing desk, ambient lighting, and zero distractions — perfect for builders and creators.',
        viewType: 'Garden View',
        bedType: 'King Size',
        area: '58 m²',
        luxuryLevel: 4,
        images: [
            'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1200',
        ],
    },
    Chennai: {
        roomNumber: 'CHN-LS1',
        floor: 'Location Special',
        type: 'Themed Room',
        price: 15000,
        capacity: { adults: 2, children: 1 },
        amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker'],
        benefits: ['Bharatanatyam Performance', 'Kanjivaram Silk Décor', 'Kapaleeshwarar Temple Visit', 'Filter Kaapi Ritual', 'Madras Music Academy Pass'],
        description: 'A profound celebration of Dravidian civilisation and Tamil artistic heritage. The Chennai Dravidian Heritage Room features a hand-carved Chettinad stone archway entrance, genuine Tanjore gold-leaf paintings of Lord Murugan, and walls dressed in hand-woven Kanjivaram silk panels in crimson and emerald. The room\'s "Film City Corner" pays homage to Tamil cinema\'s global influence with vintage movie posters from Rajinikanth and Kamal Haasan masterpieces. Begin your day with a traditional paanai (clay pot) Filter Kaapi service.',
        viewType: 'City View',
        bedType: 'King Size',
        area: '62 m²',
        luxuryLevel: 5,
        images: [
            'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?auto=format&fit=crop&q=80&w=1200',
        ],
    },
    Coimbatore: {
        roomNumber: 'CBE-LS1',
        floor: 'Location Special',
        type: 'Themed Room',
        price: 11000,
        capacity: { adults: 2, children: 1 },
        amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker'],
        benefits: ['Toda Tribal Art Décor', 'Nilgiri Tea Estate Visit', 'Loom Weaving Workshop', 'Western Ghats Forager Walk'],
        description: 'Coimbatore\'s rich Kongu Nadu heritage meets Nilgiri highlands mystique in this extraordinary room. The walls are adorned with Toda tribal embroidery art — geometric patterns in the traditional puther style, commissioned directly from the indigenous Toda artisan community. The room features a traditional Kongu Nadu wooden cot frame with a hand-spun cotton mattress infused with jasmine and vetiver. Handloom Coimbatore cotton towels and locally harvested Nilgiri Chamomile bath oils complete the experience.',
        viewType: 'Garden View',
        bedType: 'King Size',
        area: '52 m²',
        luxuryLevel: 4,
        images: [
            'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=1200',
        ],
    },
    Dubai: {
        roomNumber: 'DXB-LS1',
        floor: 'Location Special',
        type: 'Themed Room',
        price: 55000,
        capacity: { adults: 2, children: 0 },
        amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
        benefits: ['Bedouin Falconry Experience', 'Al Seef Heritage Quarter Tour', 'Traditional Abra Ride', 'Arabic Calligraphy Class', 'Oud & Resin Scent Kit'],
        description: 'Dubai existed long before the skyline — this room celebrates that story. The Arabian Bedouin Heritage Suite pays homage to the original desert tribes who navigated the Empty Quarter by starlight. Hand-knotted Persian carpets in saffron and lapis, ornate brass dhow lanterns casting warm patterns on the walls, and a majlis seating area draped in embroidered camel wool create an atmosphere of timeless Emirati hospitality. Sleep under a vaulted ceiling adorned with 99-pointed star mosaic inlay — one for each name of Allah in the Sufi tradition.',
        viewType: 'City View',
        bedType: 'King Size',
        area: '85 m²',
        luxuryLevel: 5,
        images: [
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1602343168117-bb8ced3d2f76?auto=format&fit=crop&q=80&w=1200',
        ],
    },
};

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let created = 0, skipped = 0;

    for (const [cityName, tpl] of Object.entries(LOCATION_SPECIAL_ROOMS)) {
        const location = await Location.findOne({ city: cityName });
        if (!location) {
            console.warn(`⚠️  Location "${cityName}" not found – skipping.`);
            continue;
        }

        const exists = await Room.findOne({ location: location._id, roomNumber: tpl.roomNumber });
        if (exists) {
            console.log(`   ↩  ${cityName} ${tpl.roomNumber} already exists – skipping.`);
            skipped++;
            continue;
        }

        await Room.create({ ...tpl, location: location._id, status: 'Available' });
        console.log(`   ✅ Created ${cityName} – ${tpl.roomNumber} (Location Special) @ ₹${tpl.price}/night`);
        created++;

        // Update location room count
        const cnt = await Room.countDocuments({ location: location._id });
        await Location.findByIdAndUpdate(location._id, { rooms: cnt });
    }

    console.log(`\n🎉 Done! Created ${created} Location Special rooms, skipped ${skipped}.`);
    process.exit(0);
};

seed().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
