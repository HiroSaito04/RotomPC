const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Connect cleanly using your updated .env URI string
        const conn = await mongoose.connect(process.env.MONGO_URI, {});

        console.log(`MongoDB connected : ${conn.connection.host}`);

        // Use the connection handle directly to reliably extract the active DB driver reference
        const dbInstance = conn.connection.db;
        
        if (dbInstance) {
            const collections = await dbInstance.listCollections().toArray();
            console.log('Collections accessed successfully:', collections.map(c => c.name));
        } else {
            console.log('Database connected, initializing collection stream...');
        }

    }
    catch (error) {
        console.error(`Database Access Denied: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;