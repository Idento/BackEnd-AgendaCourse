import crypto from 'crypto';

export default function generatePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:",.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomByte = crypto.randomBytes(1);
        const index = randomByte[0] % charset.length;
        password += charset[index];
    }
    return password;
}
