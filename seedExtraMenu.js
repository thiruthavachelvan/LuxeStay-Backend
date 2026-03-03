const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MenuItem = require('./models/MenuItem');

const itemsToSeed = [
    {
        name: "Truffle Eggs Benedict",
        description: "Poached organic eggs, black truffle shavings, wilted spinach, and hollandaise on toasted artisanal brioche.",
        price: 28,
        category: "Chef's Specials",
        dietaryType: "Non-Veg",
        isSpecial: true,
        image: "https://images.unsplash.com/photo-1608039755401-74207904c97eb?auto=format&fit=crop&q=80",
        calories: 650,
        preparationTime: "20m"
    },
    {
        name: "Wagyu Ribeye A5",
        description: "Sourced from the Kagoshima prefecture, aged for 45 days. Served with roasted marrow, shallot confit, and red wine reduction.",
        price: 145,
        category: "Chef's Specials",
        dietaryType: "Non-Veg",
        isSpecial: true,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80",
        calories: 950,
        preparationTime: "35m"
    },
    {
        name: "Lobster Tagliolini",
        description: "Handmade pasta tossed with butter-poached Maine lobster, cherry tomatoes, and a hint of saffron chili oil.",
        price: 68,
        category: "Chef's Specials",
        dietaryType: "Non-Veg",
        isSpecial: true,
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80",
        calories: 620,
        preparationTime: "25m"
    },
    {
        name: "Artisanal Pastry Basket",
        description: "Baked fresh every morning with organic flour and cultured butter.",
        price: 15,
        category: "Breakfast",
        isComplimentary: true,
        dietaryType: "Veg",
        image: "https://images.unsplash.com/photo-1626082895617-2c6ad3ed2801?auto=format&fit=crop&q=80"
    },
    {
        name: "Organic Berry Parfait",
        description: "With local honey, Greek yogurt, and house-made granola.",
        price: 12,
        category: "Breakfast",
        isComplimentary: true,
        dietaryType: "Veg",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80"
    },
    {
        name: "Seasonal Fruit Elixir",
        description: "Cold-pressed daily selection of seasonal fruits.",
        price: 8,
        category: "Beverages",
        isComplimentary: true,
        dietaryType: "Vegan",
        image: "https://images.unsplash.com/photo-1622597467836-f3ec0041d08ba?auto=format&fit=crop&q=80"
    },
    {
        name: "The Luxe Martini",
        description: "Premium artisan gin, dry vermouth, served perfectly chilled.",
        price: 24,
        category: "Bar Menu",
        dietaryType: "Vegan",
        image: "https://images.unsplash.com/photo-1575037614876-c38556f2e82b?auto=format&fit=crop&q=80"
    },
    {
        name: "Smoked Old Fashioned",
        description: "Aged bourbon, maple, oak smoke, bitters.",
        price: 22,
        category: "Bar Menu",
        dietaryType: "Vegan",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80"
    },
    {
        name: "Weekend Grand Buffet",
        description: "A lavish spread of international cuisines, live carving stations, fresh seafood, and exquisite desserts.",
        price: 65,
        category: "Weekend Buffet",
        dietaryType: "Non-Veg",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80",
        calories: 1200,
        preparationTime: "11 AM - 3 PM"
    }
];

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hotel-booking")
    .then(async () => {
        console.log("Connected. Seeding extra menu items...");
        for (const item of itemsToSeed) {
            await MenuItem.updateOne({ name: item.name }, { $set: item }, { upsert: true });
            console.log("Upserted", item.name);
        }
        console.log("Database seeded successfully.");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    })
