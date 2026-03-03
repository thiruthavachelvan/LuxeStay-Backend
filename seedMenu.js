const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const MenuItem = require('./models/MenuItem');
const Location = require('./models/Location');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedMenu = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const activeLocations = await Location.find({ status: 'Active' });
        const locationIds = activeLocations.map(l => l._id);

        await MenuItem.deleteMany({});

        const menuItems = [
            // --- BREAKFAST ---
            {
                name: "Ghee Roast Masala Dosa",
                description: "Crispy rice and lentil crepe with a spiced potato filling, served with coconut chutney and tangy sambar.",
                price: 350,
                category: "Breakfast",
                dietaryType: "Veg",
                image: "https://images.unsplash.com/photo-1630406184470-7fd4440e626a?auto=format&fit=crop&q=80",
                calories: 420,
                preparationTime: "12 mins",
                availableAt: locationIds
            },
            {
                name: "Fluffy Idli & Medu Vada",
                description: "Steamed rice cakes and crispy lentil donuts served with a trio of chutneys.",
                price: 280,
                category: "Breakfast",
                dietaryType: "Veg",
                image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80",
                calories: 320,
                preparationTime: "10 mins",
                availableAt: locationIds
            },
            {
                name: "Amritsari Aloo Paratha",
                description: "Whole wheat flatbread stuffed with spiced mashed potatoes, served with white butter and house-made pickle.",
                price: 320,
                category: "Breakfast",
                dietaryType: "Veg",
                image: "https://images.unsplash.com/photo-1606491956689-2ea8c5369512?auto=format&fit=crop&q=80",
                calories: 550,
                preparationTime: "15 mins",
                availableAt: locationIds
            },
            {
                name: "Ven Pongal",
                description: "A South Indian classic: Peppery rice and moong dal mash tempered with cashews and ghee.",
                price: 290,
                category: "Breakfast",
                dietaryType: "Veg",
                calories: 380,
                preparationTime: "12 mins",
                availableAt: locationIds
            },
            {
                name: "Rava Upma",
                description: "Semolina cooked with mustard seeds, curry leaves, and crunchy cashews.",
                price: 240,
                category: "Breakfast",
                dietaryType: "Veg",
                calories: 220,
                preparationTime: "8 mins",
                availableAt: locationIds
            },
            {
                name: "Chole Bhature",
                description: "Spiced chickpeas served with large, fluffy fried bread and spicy onion salad.",
                price: 380,
                category: "Breakfast",
                dietaryType: "Veg",
                calories: 650,
                preparationTime: "15 mins",
                availableAt: locationIds
            },

            // --- LUNCH ---
            {
                name: "Hyderabadi Dum Biryani",
                description: "Slow-cooked long-grain basmati rice with succulent pieces of chicken and 32 aromatic spices.",
                price: 650,
                category: "Lunch",
                dietaryType: "Non-Veg",
                isSpecial: true,
                image: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?auto=format&fit=crop&q=80",
                calories: 820,
                preparationTime: "25 mins",
                availableAt: locationIds
            },
            {
                name: "Old Delhi Butter Chicken",
                description: "Tandoori chicken pieces simmered in a rich tomato and butter gravy with a hint of honey.",
                price: 580,
                category: "Lunch",
                dietaryType: "Non-Veg",
                image: "https://images.unsplash.com/photo-1603894584202-933259bb499b?auto=format&fit=crop&q=80",
                calories: 740,
                preparationTime: "20 mins",
                availableAt: locationIds
            },
            {
                name: "Paneer Lababdar",
                description: "Cubes of cottage cheese in a thick, onion-tomato gravy flavored with cashews and melon seeds.",
                price: 480,
                category: "Lunch",
                dietaryType: "Veg",
                calories: 520,
                preparationTime: "18 mins",
                availableAt: locationIds
            },
            {
                name: "Malai Kofta",
                description: "Deep-fried potato and paneer balls in a silky smooth, sweetened cashew nut gravy.",
                price: 520,
                category: "Lunch",
                dietaryType: "Veg",
                calories: 580,
                preparationTime: "22 mins",
                availableAt: locationIds
            },
            {
                name: "Chicken Chettinad",
                description: "Fiery South Indian chicken curry made with a fresh blend of roasted spices and coconut.",
                price: 590,
                category: "Lunch",
                dietaryType: "Non-Veg",
                calories: 610,
                preparationTime: "25 mins",
                availableAt: locationIds
            },

            // --- DINNER ---
            {
                name: "Kashmiri Mutton Rogan Josh",
                description: "Tender lamb cooked with alkanet root and authentic Kashmiri spices in a yogurt-based gravy.",
                price: 720,
                category: "Dinner",
                dietaryType: "Non-Veg",
                isSpecial: true,
                image: "https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&q=80",
                calories: 680,
                preparationTime: "30 mins",
                availableAt: locationIds
            },
            {
                name: "Malabar Fish Curry",
                description: "Seer fish simmered in a coconut milk gravy with tamarind and curry leaves.",
                price: 640,
                category: "Dinner",
                dietaryType: "Non-Veg",
                calories: 450,
                preparationTime: "25 mins",
                availableAt: locationIds
            },
            {
                name: "Dal Makhani '24H'",
                description: "Black lentils slow-cooked overnight with cream and butter on coal embers.",
                price: 420,
                category: "Dinner",
                dietaryType: "Veg",
                isComplimentary: true,
                calories: 410,
                preparationTime: "10 mins",
                availableAt: locationIds
            },
            {
                name: "Palak Paneer",
                description: "Creamy spinach puree with chunks of cottage cheese and a dash of cream.",
                price: 460,
                category: "Dinner",
                dietaryType: "Veg",
                calories: 430,
                preparationTime: "15 mins",
                availableAt: locationIds
            },
            {
                name: "Tandoori Platter (Premium)",
                description: "Assortment of Malai Tikka, Seekh Kebab, and Fish Amritsari.",
                price: 1150,
                category: "Dinner",
                dietaryType: "Non-Veg",
                isSpecial: true,
                calories: 890,
                preparationTime: "25 mins",
                availableAt: locationIds
            },

            // --- WEEKEND BUFFET ---
            {
                name: "Royal Indian Veg Buffet",
                description: "A grand selection of 40+ vegetarian delights including live chaat counters and regional specialties.",
                price: 1299,
                category: "Weekend Buffet",
                dietaryType: "Veg",
                isSpecial: true,
                availableAt: locationIds
            },
            {
                name: "Majestic Non-Veg Buffet",
                description: "Extensive spread featuring coastal seafood, Tandoori meats, and Mughal desserts.",
                price: 1599,
                category: "Weekend Buffet",
                dietaryType: "Non-Veg",
                isSpecial: true,
                availableAt: locationIds
            },

            // --- BEVERAGES ---
            {
                name: "Kumbakonam Filter Coffee",
                description: "Strong decoction mixed with frothed milk, served in a traditional brass dhabara.",
                price: 150,
                category: "Beverages",
                dietaryType: "Veg",
                calories: 120,
                preparationTime: "5 mins",
                availableAt: locationIds
            },
            {
                name: "Kesar Pista Lassi",
                description: "Thick beaten yogurt with saffron, pistachios, and a touch of rose water.",
                price: 220,
                category: "Beverages",
                dietaryType: "Veg",
                calories: 280,
                preparationTime: "8 mins",
                availableAt: locationIds
            },
            {
                name: "Cutting Masala Chai",
                description: "Street-style ginger and cardamom infusion with premium tea leaves.",
                price: 120,
                category: "Beverages",
                dietaryType: "Veg",
                calories: 80,
                preparationTime: "5 mins",
                availableAt: locationIds
            },

            // --- DESSERTS ---
            {
                name: "Warm Gulab Jamun",
                description: "Milk solids dumplings deep-fried and soaked in a rose-scented sugar syrup.",
                price: 180,
                category: "Desserts",
                dietaryType: "Veg",
                calories: 320,
                preparationTime: "5 mins",
                availableAt: locationIds
            },
            {
                name: "Royal Rasmalai",
                description: "Soft cottage cheese dumplings immersed in chilled, sweetened saffron milk.",
                price: 240,
                category: "Desserts",
                dietaryType: "Veg",
                calories: 260,
                preparationTime: "5 mins",
                availableAt: locationIds
            },

            // --- BAR MENU ---
            {
                name: "The Masala Martini",
                description: "Vodka infusion with green chillies, curry leaves, and a dash of chaat masala.",
                price: 450,
                category: "Bar Menu",
                dietaryType: "Veg",
                availableAt: locationIds
            },
            {
                name: "Indian Pale Ale (IPA)",
                description: "Local craft beer with citrusy notes and a bitter finish.",
                price: 380,
                category: "Bar Menu",
                dietaryType: "Veg",
                availableAt: locationIds
            },

            // --- IN-ROOM DINING ---
            {
                name: "Midnight Biryani Box",
                description: "Our signature biryani available for those late-night luxury cravings.",
                price: 550,
                category: "In-Room Dining",
                dietaryType: "Non-Veg",
                preparationTime: "30 mins",
                availableAt: locationIds
            },
            {
                name: "Vikas Khanna's Dal Tadka",
                description: "Comforting yellow lentils with a double temper of garlic and cumin. Served with steamed rice.",
                price: 380,
                category: "In-Room Dining",
                dietaryType: "Veg",
                preparationTime: "20 mins",
                availableAt: locationIds
            }
        ];

        await MenuItem.insertMany(menuItems);
        console.log(`Successfully integrated ${menuItems.length} Indian culinary assets.`);
        process.exit();
    } catch (error) {
        console.error('Error seeding menu:', error);
        process.exit(1);
    }
};

seedMenu();
