/**
 * Random Number Generator System
 * ระบบสุ่มตัวเลข JavaScript
 */

/**
 * สุ่มตัวเลขระหว่าง min และ max (รวมทั้ง min และ max)
 * @param min - ค่าต่ำสุด
 * @param max - ค่าสูงสุด
 * @returns ตัวเลขที่สุ่มได้
 */
function randomRange(min, max) {
  if (min > max) {
    throw new Error('min ต้องน้อยกว่าหรือเท่ากับ max')
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * สุ่มตัวเลขหลายตัวพร้อมกัน
 * @param count - จำนวนตัวเลขที่ต้องการ
 * @param min - ค่าต่ำสุด
 * @param max - ค่าสูงสุด
 * @param unique - ต้องการให้ตัวเลขไม่ซ้ำกันหรือไม่
 * @returns อาร์เรย์ของตัวเลขที่สุ่มได้
 */
function randomMultiple(count, min, max, unique = false) {
  if (unique && (max - min + 1) < count) {
    throw new Error('ช่วงตัวเลขไม่เพียงพอสำหรับการสุ่มไม่ซ้ำ')
  }
  
  const results = []
  const used = new Set()
  
  while (results.length < count) {
    const num = randomRange(min, max)
    if (unique && used.has(num)) {
      continue
    }
    results.push(num)
    used.add(num)
  }
  
  return results
}

/**
 * สุ่มตัวเลขแบบมีน้ำหนัก (weighted random)
 * @param weights - อาร์เรย์ของน้ำหนัก {value, weight}
 * @returns ค่าที่ถูกสุ่มเลือก
 */
function randomWeighted(weights) {
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const item of weights) {
    random -= item.weight
    if (random <= 0) {
      return item.value
    }
  }
  
  return weights[weights.length - 1].value
}

/**
 * สุ่มจากอาร์เรย์
 * @param array - อาร์เรย์ที่ต้องการสุ่ม
 * @returns สมาชิกที่ถูกสุ่มเลือก
 */
function randomFromArray(array) {
  if (array.length === 0) {
    throw new Error('อาร์เรย์ว่างเปล่า')
  }
  return array[randomRange(0, array.length - 1)]
}

/**
 * สลับอาร์เรย์แบบสุ่ม (Shuffle)
 * @param array - อาร์เรย์ที่ต้องการสลับ
 * @returns อาร์เรย์ที่ถูกสลับแล้ว
 */
function shuffleArray(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomRange(0, i)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ==================== ตัวอย่างการใช้งาน ====================

console.log('=== ระบบสุ่มตัวเลข ===\n')

// สุ่มเลข 1-100
console.log('สุ่มเลข 1-100:', randomRange(1, 100))

// สุ่มเลข 6 หลัก (เหมือนล็อตเตอรี่)
console.log('สุ่มเลขล็อตเตอรี่ 6 ตัว:', randomMultiple(6, 0, 9, false).join(''))

// สุ่มเลขไม่ซ้ำ 5 ตัวจาก 1-50
console.log('สุ่มเลขไม่ซ้ำ 5 ตัว (1-50):', randomMultiple(5, 1, 50, true).join(', '))

// สุ่มจากอาร์เรย์
const colors = ['แดง', 'เขียว', 'น้ำเงิน', 'เหลือง', 'ชมพู']
console.log('สุ่มสี:', randomFromArray(colors))

// สลับอาร์เรย์
const numbers = [1, 2, 3, 4, 5]
console.log('สลับอาร์เรย์:', shuffleArray(numbers).join(', '))

// สุ่มแบบมีน้ำหนัก
const prizes = [
  { value: 'รางวัลที่ 1', weight: 1 },
  { value: 'รางวัลที่ 2', weight: 5 },
  { value: 'รางวัลที่ 3', weight: 10 },
  { value: 'รางวัลชมเชย', weight: 50 }
]
console.log('สุ่มรางวัล:', randomWeighted(prizes))

// Export สำหรับใช้งานในโมดูลอื่น
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    randomRange,
    randomMultiple,
    randomWeighted,
    randomFromArray,
    shuffleArray
  }
}
