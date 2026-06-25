import bcrypt from "bcryptjs";
import crypto from "crypto";

// Encryption configuration
const algorithm = 'aes-256-ctr';
const secretKey = process.env.JWT_SECRET || 'your-32-chars-secret-key-here!123456';
const iv = crypto.randomBytes(16);

// Reversible Encryption Functions (NOT RECOMMENDED FOR PRODUCTION)
export const encryptPassword = (password) => {
  try {
    const cipher = crypto.createCipher(algorithm, secretKey);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Password encryption failed');
  }
};

export const decryptPassword = (encryptedPassword) => {
  try {
    const decipher = crypto.createDecipher(algorithm, secretKey);
    let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Password decryption failed');
  }
};

// Secure Hashing Functions (Recommended for login)
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed);
};

// Utility Functions
export const randomPerformance = () => Math.floor(Math.random() * 31) + 70;
export const randomAttendance = () => Math.floor(Math.random() * 21) + 80;

// Generate strong random password
export const generateStrongPassword = (length = 12) => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Validate password strength
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};