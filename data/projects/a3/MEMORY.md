# A3 - Project Memory

Project-specific memory shared among agents.

## Key Decisions
<!-- Important decisions made during development -->
- Decision 1
- Decision 2

## Learnings
<!-- Lessons learned, best practices -->
- Learning 1
- Learning 2

## Context
<!-- Ongoing context, current state -->
- Current focus:
- Blockers:
- Next steps:

## References
<!-- Links to relevant docs, designs, etc. -->

## 2026-02-19 - Task: สร้าง hashPassword function
- Summary: Implemented secure password hashing using bcrypt with salt rounds 10. Created hashPassword() and comparePassword() functions with proper error handling and input validation.
- Files: 
  - hashPassword.js - Main module with hashPassword and comparePassword functions
  - example.js - Usage examples and test cases
  - package.json - Project configuration with bcrypt dependency
- Key Points:
  - Uses bcrypt (industry standard) with 10 salt rounds
  - Minimum password length validation (6 characters)
  - Async/await pattern for non-blocking operations
  - Includes comparePassword function for verification
  - Example file demonstrates all use cases successfully

## 2026-02-19 - Task: Create Hash Password Function v2
- Summary: Implemented alternative password hashing using Node.js native crypto.scrypt() module. Zero external dependencies, memory-hard algorithm resistant to GPU/ASIC attacks.
- Files:
  - hashPassword-v2.js - Native crypto implementation with hashPassword() and comparePassword()
  - comparison.md - Detailed comparison: bcrypt vs crypto approach
- Key Points:
  - Uses crypto.scrypt() with N=16384, r=8, p=1 (~16MB memory usage)
  - Hash format: algorithm$iterations$salt$hash (base64url encoded)
  - Same API as v1 for drop-in compatibility
  - Configurable options: saltLength, keyLength, iterations, blockSize, parallelization
  - timingSafeEqual used to prevent timing attacks
  - When to use v1: Industry standard compliance, maximum compatibility
  - When to use v2: Zero dependencies, memory-hard security, smaller bundle size

---
*Created: 2026-02-19T13:07:06.474Z*
