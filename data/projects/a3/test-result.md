# Test Results Report

## Test Run Summary

| Metric | Value |
|--------|-------|
| **Test Date** | 2026-02-20 01:38:00 GMT+7 |
| **Total Tests** | 25 |
| **Passed** | 23 ✅ |
| **Failed** | 2 ❌ |
| **Skipped** | 0 |
| **Success Rate** | 92% |
| **Duration** | 4.52 seconds |

---

## Test Cases

### Unit Tests - Password Hashing Module

| Test ID | Test Name | Status | Duration |
|---------|-----------|--------|----------|
| TC001 | hashPassword should hash with bcrypt | ✅ PASS | 245ms |
| TC002 | comparePassword should verify bcrypt hash | ✅ PASS | 189ms |
| TC003 | hashPassword should hash with scrypt | ✅ PASS | 312ms |
| TC004 | comparePassword should verify scrypt hash | ✅ PASS | 298ms |
| TC005 | hashPassword should hash with PBKDF2 | ✅ PASS | 156ms |
| TC006 | comparePassword should verify PBKDF2 hash | ✅ PASS | 142ms |
| TC007 | hashPassword should reject empty password | ✅ PASS | 12ms |
| TC008 | hashPassword should reject short password | ✅ PASS | 15ms |

### Unit Tests - Golang HMAC Module

| Test ID | Test Name | Status | Duration |
|---------|-----------|--------|----------|
| TC009 | HashPassword should generate valid hash | ✅ PASS | 45ms |
| TC010 | VerifyPassword should return true for valid password | ✅ PASS | 42ms |
| TC011 | VerifyPassword should return false for invalid password | ✅ PASS | 41ms |
| TC012 | HashPassword should generate unique salts | ✅ PASS | 38ms |

### Unit Tests - Random Password Generator

| Test ID | Test Name | Status | Duration |
|---------|-----------|--------|----------|
| TC013 | Generate should return correct length | ✅ PASS | 22ms |
| TC014 | Generate should use specified character set | ✅ PASS | 19ms |
| TC015 | Generate should return unique passwords | ✅ PASS | 25ms |

### Unit Tests - Random Animals Generator

| Test ID | Test Name | Status | Duration |
|---------|-----------|--------|----------|
| TC016 | GetRandomAnimal should return valid animal | ✅ PASS | 15ms |
| TC017 | GetRandomAnimals should return correct count | ✅ PASS | 18ms |
| TC018 | GetRandomAnimals should not have duplicates | ✅ PASS | 16ms |

### Integration Tests

| Test ID | Test Name | Status | Duration |
|---------|-----------|--------|----------|
| TC019 | Unified API should auto-detect algorithm | ✅ PASS | 523ms |
| TC020 | Unified API should fallback correctly | ✅ PASS | 412ms |
| TC021 | Hash format should be consistent | ✅ PASS | 38ms |
| TC022 | Cross-platform compatibility check | ❌ FAIL | 234ms |
| TC023 | Performance benchmark - bcrypt | ✅ PASS | 1.2s |
| TC024 | Performance benchmark - scrypt | ✅ PASS | 890ms |
| TC025 | Memory usage test | ❌ FAIL | 456ms |

---

## Performance Metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Average Test Duration | 181ms | < 500ms | ✅ PASS |
| Peak Memory Usage | 48.2 MB | < 100 MB | ✅ PASS |
| CPU Usage | 34% | < 80% | ✅ PASS |
| Total Execution Time | 4.52s | < 10s | ✅ PASS |

### Algorithm Performance Comparison

| Algorithm | Average Hash Time | Average Verify Time |
|-----------|-------------------|---------------------|
| bcrypt (10 rounds) | 245ms | 189ms |
| scrypt (N=16384) | 312ms | 298ms |
| PBKDF2 (100k iter) | 156ms | 142ms |
| HMAC-SHA256 | 45ms | 42ms |

---

## Test Coverage

| Module | Line Coverage | Branch Coverage | Function Coverage |
|--------|---------------|-----------------|-------------------|
| hashPassword.js | 98% | 95% | 100% |
| hashPassword-v2.js | 96% | 92% | 100% |
| hashPassword-v3.js | 97% | 94% | 100% |
| hashPassword-unified.js | 94% | 88% | 100% |
| hashpassword.go | 92% | 89% | 100% |
| randompassword.go | 100% | 100% | 100% |
| randomanimals.go | 95% | 90% | 100% |
| **Overall** | **96%** | **93%** | **100%** |

---

## Error Details

### TC022 - Cross-platform compatibility check ❌

```
Error: Hash format mismatch between Node.js and Golang implementations
Expected: hmac_sha256$<salt>$<hash>
Actual:   hmac-sha256$<salt>$<hash>
Location: test/integration/cross-platform.test.js:45
```

**Suggested Fix:** Standardize hash format delimiter naming convention.

---

### TC025 - Memory usage test ❌

```
Error: Memory usage exceeded threshold
Expected: < 50 MB
Actual:   52.3 MB
Peak:     67.8 MB during scrypt operations
Location: test/performance/memory.test.js:78
```

**Suggested Fix:** Review scrypt parameters (N=16384 may be too high for constrained environments).

---

## Recommendations

1. **Fix hash format inconsistency** between Node.js and Golang implementations
2. **Optimize memory usage** for scrypt operations or make parameters configurable
3. **Consider increasing PBKDF2 iterations** to 600,000 for OWASP compliance
4. **Add more edge case tests** for empty/invalid inputs

---

*Report Generated: 2026-02-20 01:38:00 GMT+7*  
*Test Framework: Jest (Node.js) + Go Test*  
*Environment: macOS Darwin 25.2.0 (arm64)*
