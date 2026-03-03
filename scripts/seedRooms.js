/**
 * seedRooms.js
 * Creates location-specific rooms for all LuxeStays hubs.
 * Run: node scripts/seedRooms.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Room = require('../models/Room');
const Location = require('../models/Location');

const ROOM_IMAGES = {
    presidential: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200',
    ],
    suite: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=1200',
    ],
    deluxe: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1560347876-aeef00ee58a1?auto=format&fit=crop&q=80&w=1200',
    ],
    double: [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1200',
    ],
    single: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=1200',
    ],
    pool: [
        'https://images.unsplash.com/photo-1602343168117-bb8ced3d2f76?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1200',
    ],
    beach: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1200',
    ],
    honeymoon: [
        'https://images.unsplash.com/photo-1515362778563-6a8d0e44bc0b?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=1200',
    ],
};

const ROOM_TEMPLATES = {
    Mumbai: [
        {
            roomNumber: 'MUM-101', floor: 'Ground Floor', type: 'Double Room',
            price: 8500, capacity: { adults: 2, children: 1 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Coffee Maker'],
            benefits: ['Sea-view Terrace', 'Complimentary Breakfast', 'Airport Transfer'],
            description: 'An elegant double room overlooking the magnificent Marine Drive, Mumbai\'s iconic Queen\'s Necklace. Floor-to-ceiling windows frame the Arabian Sea in breathtaking glory.',
            viewType: 'Sea View', bedType: 'King Size', area: '42 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.double,
        },
        {
            roomNumber: 'MUM-201', floor: '2nd Floor', type: 'Deluxe Room',
            price: 14500, capacity: { adults: 2, children: 2 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Marine Drive View', 'Evening Turndown', 'Yoga Mat & Classes'],
            description: 'The Marine Drive Deluxe is a sanctuary of urban luxury, bedecked with handpicked art and custom-blended bath amenities. Watch the sunset paint Mumbai gold from your private balcony.',
            viewType: 'Sea View', bedType: 'King Size', area: '58 m²', luxuryLevel: 4,
            images: ROOM_IMAGES.deluxe,
        },
        {
            roomNumber: 'MUM-301', floor: '3rd Floor', type: 'Executive Room',
            price: 22000, capacity: { adults: 2, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Executive Club Access', 'Bespoke Butler Service', 'Express Laundry'],
            description: 'Designed for the discerning business traveller, the Bandra Executive features a private study, lightning-fast internet, and direct access to Bandra\'s trendiest corridors.',
            viewType: 'City View', bedType: 'Double Bed', area: '52 m²', luxuryLevel: 4,
            images: ROOM_IMAGES.suite,
        },
        {
            roomNumber: 'MUM-LW1', floor: 'Luxury Wing', type: 'Presidential Suite',
            price: 65000, capacity: { adults: 4, children: 2 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Private Pool', 'Dedicated Butler', '24hr Concierge', 'Helipad Access', 'Rolls Royce Transfer'],
            description: 'The crown jewel of LuxeStays Mumbai — a palatial penthouse spanning 280 sqm with a heated infinity pool cantilevered over the skyline. Pure, unapologetic grandeur.',
            viewType: 'Sea View', bedType: 'King Size', area: '280 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.presidential,
        },
    ],
    Delhi: [
        {
            roomNumber: 'DEL-101', floor: 'Ground Floor', type: 'Single Room',
            price: 5500, capacity: { adults: 1, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Coffee Maker'],
            benefits: ['Heritage District Access', 'Welcome Drink'],
            description: 'A refined single retreat in the heart of Lutyens\' Delhi. Subtle colonial accents meet modern comforts in this thoughtfully designed room.',
            viewType: 'Garden View', bedType: 'Single Bed', area: '30 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.single,
        },
        {
            roomNumber: 'DEL-201', floor: '2nd Floor', type: 'Double Room',
            price: 12000, capacity: { adults: 2, children: 1 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Workspace', 'Coffee Maker'],
            benefits: ['Mughal Garden View', 'Complimentary Breakfast', 'Heritage City Tour'],
            description: 'Inspired by the grandeur of the Mughal empire, the Heritage Double features hand-painted murals, antique wooden furniture, and a curated scent library from the Spice Route.',
            viewType: 'Garden View', bedType: 'King Size', area: '48 m²', luxuryLevel: 4,
            images: ROOM_IMAGES.double,
        },
        {
            roomNumber: 'DEL-301', floor: '3rd Floor', type: 'Executive Room',
            price: 19500, capacity: { adults: 2, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Parliament View', 'Business Lounge Access', 'Private Dining'],
            description: 'Commanding panoramic views of the Rajpath and Parliament House, this executive suite is the preferred choice of diplomats and dignitaries visiting the capital.',
            viewType: 'City View', bedType: 'King Size', area: '65 m²', luxuryLevel: 4,
            images: ROOM_IMAGES.suite,
        },
        {
            roomNumber: 'DEL-LW1', floor: 'Luxury Wing', type: 'Presidential Suite',
            price: 75000, capacity: { adults: 4, children: 2 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Rooftop Jacuzzi', 'Personal Chef', 'Helipad Access', 'Diplomatic Quarter View', 'Exclusive Spa Access'],
            description: 'Named after the storied Lutyens tradition, this 320 sqm masterpiece is adorned with rare Rajasthani marble, hand-knotted silk carpets, and museum-grade artwork.',
            viewType: 'City View', bedType: 'King Size', area: '320 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.presidential,
        },
    ],
    Goa: [
        {
            roomNumber: 'GOA-101', floor: 'Ground Floor', type: 'Beach-connected Room',
            price: 11000, capacity: { adults: 2, children: 1 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony'],
            benefits: ['Direct Beach Access', 'Surfboard Rental', 'Complimentary Cocktail Hour'],
            description: 'Step directly from your room onto the warm golden sands of North Goa. The Beach-connected Room blends barefoot luxury with the raw energy of the Arabian Sea.',
            viewType: 'Sea View', bedType: 'King Size', area: '45 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.beach,
        },
        {
            roomNumber: 'GOA-201', floor: '1st Floor', type: 'Honeymoon Suite',
            price: 28000, capacity: { adults: 2, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker'],
            benefits: ['Champagne on Arrival', 'Sunset Cruise', 'Couples Spa', 'Flower Petal Turndown'],
            description: 'Celebrate love in absolute seclusion. The Sunset Honeymoon Suite features a four-poster canopy bed, open-air rain shower, and a private terrace with the finest Goa sunset views.',
            viewType: 'Sea View', bedType: 'King Size', area: '72 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.honeymoon,
        },
        {
            roomNumber: 'GOA-LW1', floor: 'Luxury Wing', type: 'Private Pool Room',
            price: 42000, capacity: { adults: 2, children: 2 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker'],
            benefits: ['Private Plunge Pool', 'Daily Fresh Coconuts', 'Personal Yoga Instructor', 'Kayak Access'],
            description: 'A lagoon-edged private villa with a personal plunge pool merging seamlessly with Goa\'s turquoise waters. Portuguese heritage architecture meets ultra-modern luxury.',
            viewType: 'Sea View', bedType: 'King Size', area: '110 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.pool,
        },
    ],
    Bangalore: [
        {
            roomNumber: 'BLR-101', floor: 'Ground Floor', type: 'Single Room',
            price: 4500, capacity: { adults: 1, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Coffee Maker', 'Workspace'],
            benefits: ['Tech Park Shuttle', 'High-Speed Fibre Internet', '24hr Business Centre'],
            description: 'The perfect productivity pod for Silicon Valley professionals in India\'s tech capital. Ergonomic furniture, ultra-fast connectivity, and a soundproofed workspace await.',
            viewType: 'City View', bedType: 'Single Bed', area: '32 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.single,
        },
        {
            roomNumber: 'BLR-201', floor: '2nd Floor', type: 'Double Room',
            price: 9500, capacity: { adults: 2, children: 1 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker'],
            benefits: ['Lal Bagh Garden View', 'Weekend Cycling Tours', 'Organic Breakfast'],
            description: 'Surrounded by the lush Lal Bagh Botanical Garden, this double room is a tranquil escape from the city\'s startup frenzy. Wake up to birdsong and fresh Coorg coffee.',
            viewType: 'Garden View', bedType: 'King Size', area: '46 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.double,
        },
        {
            roomNumber: 'BLR-LW1', floor: 'Luxury Wing', type: 'Exclusive Suite',
            price: 38000, capacity: { adults: 2, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Rooftop Infinity Pool', 'Helicopter City Tour', 'Dedicated Tech Concierge', 'Private Meeting Room'],
            description: 'The apex of Bangalore luxury — a penthouse suite designed by award-winning architect Sanjay Puri, with a rooftop that merges Bangalore\'s glittering skyline with an infinity pool.',
            viewType: 'City View', bedType: 'King Size', area: '200 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.presidential,
        },
    ],
    Chennai: [
        {
            roomNumber: 'CHN-101', floor: 'Ground Floor', type: 'Double Room',
            price: 7500, capacity: { adults: 2, children: 1 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Coffee Maker', 'Mini Bar'],
            benefits: ['Marina Promenade Walk', 'Complimentary South Indian Breakfast', 'Temple Tours'],
            description: 'Overlooking the world\'s longest urban beach, the Marina View suite captures Chennai\'s timeless charm. Authentic Chettinad art adorns the walls, narrating a thousand years of Tamil heritage.',
            viewType: 'Sea View', bedType: 'King Size', area: '44 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.double,
        },
        {
            roomNumber: 'CHN-201', floor: '2nd Floor', type: 'Deluxe Room',
            price: 13000, capacity: { adults: 2, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Heritage Guided Tour', 'Tanjore Painting Display', 'Silk Weaving Demonstration'],
            description: 'A deep dive into South India\'s regal past. The Chettinad Heritage Room features antique Athangudi floor tiles, hand-carved teak headboards, and a curated collection of vintage Tamil literature.',
            viewType: 'City View', bedType: 'King Size', area: '55 m²', luxuryLevel: 4,
            images: ROOM_IMAGES.deluxe,
        },
        {
            roomNumber: 'CHN-LW1', floor: 'Luxury Wing', type: 'Presidential Suite',
            price: 55000, capacity: { adults: 4, children: 2 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Private Rooftop Pool', 'Carnatic Music Performance', 'Personal Butler', 'Export-Quality Silk Gift'],
            description: 'Inspired by the grandeur of the Chola empire, this presidential suite spans a magnificent 260 sqm, housing museum-quality bronze sculptures, a private rooftop pool, and uninterrupted bay views.',
            viewType: 'Sea View', bedType: 'King Size', area: '260 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.presidential,
        },
    ],
    Coimbatore: [
        {
            roomNumber: 'CBE-101', floor: 'Ground Floor', type: 'Single Room',
            price: 3800, capacity: { adults: 1, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Coffee Maker'],
            benefits: ['Nilgiri Hills View', 'Organic Farm Breakfast', 'Bird Watching Trail Pass'],
            description: 'Nestled between the Western Ghats and the Nilgiris, this cosy single room is a gateway to Coimbatore\'s serene highland landscape. Breathe in the cool mountain air and let the world slow down.',
            viewType: 'Garden View', bedType: 'Single Bed', area: '30 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.single,
        },
        {
            roomNumber: 'CBE-201', floor: '1st Floor', type: 'Double Room',
            price: 8000, capacity: { adults: 2, children: 1 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker'],
            benefits: ['Western Ghats Trekking', 'Kalyana Pongal Breakfast', 'Textile Market Tour'],
            description: 'The Kovai Garden Double opens onto a private balcony brimming with Coimbatore\'s signature jasmine and marigold garlands. A perfect base for exploring the textile capital of Tamil Nadu.',
            viewType: 'Garden View', bedType: 'King Size', area: '45 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.double,
        },
        {
            roomNumber: 'CBE-301', floor: '3rd Floor', type: 'Family Room',
            price: 14000, capacity: { adults: 4, children: 2 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Ooty Day Trip Shuttle', 'Kids Activity Centre', 'Family Bonfire Night', 'Waterfall Hike'],
            description: 'Designed for family adventures in Tamil Nadu\'s gateway to the hills. Spacious, airy living areas and a dedicated kids\' activity corner ensure every age group is captivated.',
            viewType: 'Garden View', bedType: 'Double Bed', area: '80 m²', luxuryLevel: 3,
            images: ROOM_IMAGES.deluxe,
        },
        {
            roomNumber: 'CBE-LW1', floor: 'Luxury Wing', type: 'Exclusive Suite',
            price: 32000, capacity: { adults: 2, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Private Jacuzzi', 'Nilgiris Sunrise Meditation', 'Ayurvedic Spa Package', 'Personal Naturalist Guide'],
            description: 'The crown of the Coimbatore Hub — an eco-luxe retreat suite elevated 1,100m above sea level with timber-and-glass architecture designed to harmonise with the Nilgiri biosphere.',
            viewType: 'Garden View', bedType: 'King Size', area: '150 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.presidential,
        },
    ],
    Dubai: [
        {
            roomNumber: 'DXB-101', floor: '1st Floor', type: 'Family Room',
            price: 25000, capacity: { adults: 4, children: 2 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Coffee Maker'],
            benefits: ['Desert Safari Booking', 'Gold Souk Van Transfer', 'Kids Club Access'],
            description: 'A palatial family sanctuary in the heart of New Dubai. 24-carat gold accents, hand-stitched silk cushions, and a bespoke Arabian scent set the tone for an extraordinary family holiday.',
            viewType: 'City View', bedType: 'King Size', area: '95 m²', luxuryLevel: 4,
            images: ROOM_IMAGES.deluxe,
        },
        {
            roomNumber: 'DXB-201', floor: '2nd Floor', type: 'Exclusive Suite',
            price: 48000, capacity: { adults: 2, children: 0 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Burj Khalifa View', 'Desert Rose Dinner', 'Gold-Plated Bath Fixtures', 'Rolls Royce Airport Transfer'],
            description: 'The Desert Rose Suite commands breathtaking sightlines of the Burj Khalifa. Every detail — from the 24ct gold-plated fittings to the Amouage-filled amenity set — speaks of pure opulence.',
            viewType: 'City View', bedType: 'King Size', area: '120 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.suite,
        },
        {
            roomNumber: 'DXB-LW1', floor: 'Luxury Wing', type: 'Presidential Suite',
            price: 150000, capacity: { adults: 6, children: 4 },
            amenities: ['Wifi', 'AC', 'Smart TV', 'Mini Bar', 'Balcony', 'Coffee Maker', 'Workspace'],
            benefits: ['Private Infinity Pool', 'Michelin Chef on-call', 'Personal Shopper at Dubai Mall', 'Yacht Charter', 'Butler Service'],
            description: 'The Burj-View Presidential Suite is the pinnacle of global luxury. Spanning 400sqm with a private rooftop infinity pool perfectly framing the Burj Khalifa at sunset. No superlative suffices.',
            viewType: 'City View', bedType: 'King Size', area: '400 m²', luxuryLevel: 5,
            images: ROOM_IMAGES.presidential,
        },
    ],
};

const seedRooms = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Ensure Coimbatore location exists
        let cbeLocation = await Location.findOne({ city: 'Coimbatore' });
        if (!cbeLocation) {
            cbeLocation = await Location.create({
                city: 'Coimbatore',
                description: 'Gateway to the Nilgiri Hills — where Western Ghats flair meets Tamil Nadu heritage in a serene highland escape.',
                price: '₹3,800',
                status: 'Active',
                rooms: 0,
                category: 'India',
            });
            console.log('🏨 Created Coimbatore Location');
        }

        let totalCreated = 0;
        let totalSkipped = 0;

        for (const [cityName, templates] of Object.entries(ROOM_TEMPLATES)) {
            const location = await Location.findOne({ city: cityName });
            if (!location) {
                console.warn(`⚠️  Location "${cityName}" not found in DB – skipping.`);
                continue;
            }

            for (const tpl of templates) {
                const exists = await Room.findOne({ location: location._id, roomNumber: tpl.roomNumber });
                if (exists) {
                    console.log(`   ↩  ${cityName} ${tpl.roomNumber} already exists – skipping.`);
                    totalSkipped++;
                    continue;
                }

                await Room.create({ ...tpl, location: location._id, status: 'Available' });
                console.log(`   ✅ Created ${cityName} – ${tpl.roomNumber} (${tpl.type}) @ ₹${tpl.price}/night`);
                totalCreated++;
            }

            // Update location room count
            const roomCount = await Room.countDocuments({ location: location._id });
            await Location.findByIdAndUpdate(location._id, { rooms: roomCount });
            console.log(`📍 ${cityName}: ${roomCount} total rooms`);
        }

        console.log(`\n🎉 Done! Created ${totalCreated} rooms, skipped ${totalSkipped} existing.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

seedRooms();
