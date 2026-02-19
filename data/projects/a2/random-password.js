/**
 * Random Password Generator
 * สร้างรหัสผ่านแบบสุ่ม
 */

/**
 * สร้างรหัสผ่านสุ่ม
 * @param length - ความยาวรหัสผ่าน (default: 12)
 * @param options - ตัวเลือกเพิ่มเติม
 * @returns รหัสผ่านที่สร้างขึ้น
 */
function generatePassword(length = 12, options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options
  
  let charset = ''
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (numbers) charset += '0123456789'
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  if (charset === '') {
    throw new Error('At least one character type must be enabled')
  }
  
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  return password
}

/**
 * สร้างรหัสผ่านที่มีความปลอดภัยสูง
 * บังคับให้มีตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์
 * @param length - ความยาวรหัสผ่าน (default: 16)
 * @returns รหัสผ่านที่สร้างขึ้น
 */
function generateStrongPassword(length = 16) {
  if (length < 4) {
    throw new Error('Length must be at least 4')
  }
  
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  // Ensure at least one of each type
  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest
  const allChars = lowercase + uppercase + numbers + symbols
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return shuffleString(password)
}

/**
 * สลับตำแหน่งตัวอักษรในสตริง
 */
function shuffleString(str) {
  const arr = str.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

// ==================== ตัวอย่างการใช้งาน ====================

console.log('=== สร้างรหัสผ่าน ===\n')

// รหัสผ่านแบบง่าย 8 ตัว
console.log('รหัสผ่าน 8 ตัว:', generatePassword(8))

// รหัสผ่านแบบง่าย 12 ตัว
console.log('รหัสผ่าน 12 ตัว:', generatePassword(12))

// รหัสผ่านที่มีความปลอดภัยสูง
console.log('รหัสผ่านปลอดภัย 16 ตัว:', generateStrongPassword(16))

// รหัสผ่านที่มีเฉพาะตัวเลข
console.log('รหัส PIN 6 หลัก:', generatePassword(6, { uppercase: false, lowercase: false, symbols: false }))

// รหัสผ่านที่ไม่มีสัญลักษณ์พิเศษ
console.log('รหัสผ่านไม่มีสัญลักษณ์:', generatePassword(10, { symbols: false }))

// Export สำหรับใช้งานในโมดูลอื่น
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generatePassword,
    generateStrongPassword
  }
}
