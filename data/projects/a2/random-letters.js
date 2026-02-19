/**
 * Random Alphabet Generator
 * สุ่มตัวอักษร a-z
 */

/**
 * สุ่มตัวอักษร a-z
 * @returns ตัวอักษรที่สุ่มได้ (a-z)
 */
function randomLetter() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  return letters[Math.floor(Math.random() * letters.length)]
}

/**
 * สุ่มตัวอักษร a-z จำนวน n ตัว
 * @param count - จำนวนตัวอักษรที่ต้องการ
 * @returns สตริงของตัวอักษรที่สุ่มได้
 */
function randomLetters(count) {
  let result = ''
  for (let i = 0; i < count; i++) {
    result += randomLetter()
  }
  return result
}

// ==================== ตัวอย่างการใช้งาน ====================

console.log('=== สุ่มตัวอักษร a-z ===\n')

// สุ่ม 10 ตัว
console.log('สุ่ม 10 ตัว:', randomLetters(10))

// สุ่ม 10 ตัว อีกครั้ง
console.log('สุ่ม 10 ตัว:', randomLetters(10))

// สุ่ม 10 ตัว อีกครั้ง
console.log('สุ่ม 10 ตัว:', randomLetters(10))

// Export สำหรับใช้งานในโมดูลอื่น
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    randomLetter,
    randomLetters
  }
}
