# Password Hashing Comparison: bcrypt vs scrypt vs PBKDF2-SHA256

## Overview

This project provides three password hashing implementations:
- **V1**: `hashPassword.js` - Uses bcrypt (external dependency)
- **V2**: `hashPassword-v2.js` - Uses Node.js native crypto.scrypt (no dependencies)
- **V3**: `hashPassword-v3.js` - Uses PBKDF2 with SHA256 (FIPS-compliant, widely supported)

## Quick Comparison

| Feature | bcrypt (V1) | crypto.scrypt (V2) | PBKDF2-SHA256 (V3) |
|---------|-------------|---------------------|---------------------|
| **Dependencies** | Requires `bcrypt` package | Native Node.js `crypto` | Native Node.js `crypto` |
| **Algorithm Type** | Blowfish-based | Memory-hard | CPU-hard (iterative) |
| **Memory Hard** | No | Yes (~16MB) | No |
| **GPU Resistant** | Partial | Strong | Partial |
| **Storage Format** | `$2b$10$...` | `scrypt$N$salt$hash` | `pbkdf2_sha256$iter$salt$hash` |
| **Default Work Factor** | 10 rounds | N=16384 | 100,000 iterations |
| **Timing Safe** | Yes | Yes | Yes |
| **Bundle Size** | Larger (native addon) | Zero additional | Zero additional |
| **FIPS Compliant** | No | No | Yes |
| **Industry Standard** | Widely used | Modern alternative | NIST recommended |

## When to Use Which

### Use bcrypt (V1) when:
- **Industry standard compliance** is required (bcrypt is widely audited)
- **Maximum compatibility** with other systems (bcrypt hashes are recognizable)
- **Team familiarity** - most developers know bcrypt
- **Production systems** where battle-tested solutions are preferred

### Use crypto.scrypt (V2) when:
- **Zero dependencies** is a priority (embedded systems, strict security reviews)
- **Memory-hard hashing** is needed (resistance to GPU/ASIC attacks)
- **Bundle size** matters (no native addons to compile)
- **Future-proofing** - scrypt is designed to be more resistant to hardware attacks
- **Modern Node.js** environments (scrypt available since Node 10.5.0)

### Use PBKDF2-SHA256 (V3) when:
- **FIPS compliance** is required (PBKDF2 is NIST-approved)
- **Interoperability** with systems that expect PBKDF2 (e.g., Django, some enterprise systems)
- **Widely supported** - PBKDF2 is available in virtually every crypto library
- **Configurable iteration count** - easy to adjust as hardware improves
- **Educational purposes** - understanding key stretching concepts

## Security Considerations

### bcrypt
- **Pros**: Extensively audited, time-tested (since 1999), widely supported
- **Cons**: Not memory-hard, vulnerable to GPU attacks (though still expensive)
- **Best for**: General purpose, maximum compatibility

### scrypt
- **Pros**: Memory-hard, designed specifically to resist hardware attacks, tunable memory cost
- **Cons**: Newer (less audit history), requires more memory
- **Best for**: High-security applications, environments where memory is cheaper than CPU

### PBKDF2-SHA256
- **Pros**: FIPS/NIST compliant, widely supported, easy to understand and implement
- **Cons**: Not memory-hard, vulnerable to GPU attacks, requires high iterations to be secure
- **Best for**: FIPS compliance, interoperability with existing systems

## Performance

| Metric | bcrypt (10 rounds) | scrypt (N=16384) | PBKDF2 (100k iter) |
|--------|-------------------|------------------|---------------------|
| Hash time | ~50-100ms | ~20-30ms | ~30-50ms |
| Memory usage | Low (~4KB) | Medium (~16MB) | Low (~4KB) |
| Parallel hashing | Good | Limited by memory | Excellent |

## Migration Notes

- All three versions use **different hash formats** - they are NOT interchangeable
- You cannot verify a bcrypt hash with scrypt/PBKDF2 or vice versa
- Each version can detect and reject hashes from other versions (algorithm check)
- For migration: hash new passwords with preferred method, maintain all for verification

## Recommendation

For **new projects**:
- Choose **V2 (scrypt)** if you want zero dependencies and maximum GPU resistance
- Choose **V1 (bcrypt)** if you need maximum compatibility and battle-tested history
- Choose **V3 (PBKDF2)** if you need FIPS compliance or specific interoperability

**Security ranking**: V2 (scrypt) > V1 (bcrypt) ≥ V3 (PBKDF2 with sufficient iterations)

All are secure choices when configured properly.
