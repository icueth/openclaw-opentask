/**
 * Password Hash Function
 * ฟังก์ชั่นแฮชรหัสผ่าน
 */

/**
 * แฮชรหัสผ่านด้วย SHA-256
 * @param password - รหัสผ่านที่ต้องการแฮช
 * @returns ค่าแฮช
 */
function hashPassword(password) {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * แฮชรหัสผ่านด้วย salt
 * @param password - รหัสผ่าน
 * @param salt - ค่า salt (ถ้าไม่ระบุจะสร้างใหม่)
 * @returns { hash, salt }
 */
function hashPasswordWithSalt(password, salt) {
  const crypto = require('crypto')
  
  // สร้าง salt ถ้าไม่ได้ระบุ
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex')
  }
  
  // แฮชด้วย salt
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  
  return {
    hash,
    salt
  }
}

/**
 * ตรวจสอบรหัสผ่าน
 * @param password - รหัสผ่านที่ต้องการตรวจสอบ
 * @param hash - ค่าแฮชที่เก็บไว้
 * @param salt - ค่า salt
 * @returns boolean
 */
function verifyPassword(password, hash, salt) {
  const result = hashPasswordWithSalt(password, salt)
  return result.hash === hash
}

// ==================== ตัวอย่างการใช้งาน ====================

console.log('=== แฮชรหัสผ่าน ===\n')

// แฮชแบบธรรมดา SHA-256
const password1 = 'mySecretPassword123'
const hash1 = hashPassword(password1)
console.log('รหัสผ่าน:', password1)
console.log('SHA-256 Hash:', hash1)
console.log()

// แฮชแบบมี salt
const password2 = 'anotherPassword456'
const { hash: hash2, salt } = hashPasswordWithSalt(password2)
console.log('รหัสผ่าน:', password2)
console.log('Hash with salt:', hash2)
console.log('Salt:', salt)
console.log()

// ตรวจสอบรหัสผ่าน
const isValid = verifyPassword(password2, hash2, salt)
console.log('รหัสผ่านถูกต้อง:', isValid)

const isInvalid = verifyPassword('wrongPassword', hash2, salt)
console.log('รหัสผ่านผิด:', isInvalid)

// Export สำหรับใช้งานในโมดูลอื่น
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    hashPassword,
    hashPasswordWithSalt,
    verifyPassword
  }
}
