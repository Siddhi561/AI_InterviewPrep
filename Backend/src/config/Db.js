import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB is successfully connected')
    } catch (error) {
        console.log(`This error is coming from connectDB, error -> ${error}`)
    }
}