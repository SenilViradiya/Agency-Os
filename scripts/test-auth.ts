import { auth } from './lib/auth';
import dbConnect from './lib/db';
import User from './models/User';
import bcrypt from 'bcryptjs';

async function testAuth() {
    try {
        console.log('Testing authentication logic...');
        await dbConnect();
        
        const email = 'admin@agencyos.com';
        const password = 'Admin@123';
        
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found in DB');
            return;
        }
        
        console.log('User found:', user.email);
        const isValid = await bcrypt.compare(password, user.password!);
        console.log('Password is valid:', isValid);
        
        if (isValid) {
            console.log('Test PASSED');
        } else {
            console.log('Test FAILED');
        }
    } catch (error) {
        console.error('Test error:', error);
    } finally {
        process.exit(0);
    }
}

testAuth();
