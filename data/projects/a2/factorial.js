/**
 * Factorial Function
 * ฟังก์ชั่นคำนวณ Factorial
 */

/**
 * คำนวณ Factorial แบบ iterative
 * @param n - จำนวนเต็มที่ต้องการคำนวณ
 * @returns n! (factorial ของ n)
 */
function factorial(n) {
  if (n < 0) {
    throw new Error('Factorial is not defined for negative numbers')
  }
  if (n === 0 || n === 1) {
    return 1
  }
  
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

/**
 * คำนวณ Factorial แบบ recursive
 * @param n - จำนวนเต็มที่ต้องการคำนวณ
 * @returns n! (factorial ของ n)
 */
function factorialRecursive(n) {
  if (n < 0) {
    throw new Error('Factorial is not defined for negative numbers')
  }
  if (n === 0 || n === 1) {
    return 1
  }
  return n * factorialRecursive(n - 1)
}

// ==================== ตัวอย่างการใช้งาน ====================

console.log('=== Factorial Calculator ===\n')

// ทดสอบค่าต่างๆ
const testValues = [0, 1, 5, 10]

console.log('แบบ Iterative:')
testValues.forEach(n => {
  console.log(`${n}! = ${factorial(n)}`)
})

console.log('\nแบบ Recursive:')
testValues.forEach(n => {
  console.log(`${n}! = ${factorialRecursive(n)}`)
})

// Export สำหรับใช้งานในโมดูลอื่น
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    factorial,
    factorialRecursive
  }
}
