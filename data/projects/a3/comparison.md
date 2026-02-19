# bcrypt vs crypto.scrypt Comparison

## Overview

This project provides two password hashing implementations:
- **V1**: `hashPassword.js` - Uses bcrypt (external dependency)
- **V2**: `hashPassword-v2.js` - Uses Node.js native crypto.scrypt (no dependencies)

## Quick Comparison

| Feature | bcrypt (V1) | crypto.scrypt (V2) |
|---------|-------------|---------------------|
| **Dependencies** | Requires `bcrypt` package | Native Node.js `crypto` module |
| **Algorithm Type** | Blowfish-based | Memory-hard (PBKDF2 successor) |
| **Memory Hard** | No | Yes (resistant to GPU/ASIC) |
| **Storage Format** | `$2b$10$...` | `scrypt$N$salt$hash` |
| **Salt Rounds** | Configurable (default: 10) | Configurable N (default: 16384) |
| **Timing Safe** | Yes | Yes (crypto.timingSafeEqual) |
| **Bundle Size** | Larger (native addon) | Zero additional size |

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

## Security Considerations

### bcrypt
- **Pros**: Extensively audited, time-tested (since 1999), widely supported
- **Cons**: Not memory-hard, vulnerable to GPU attacks (though still expensive)
- **Best for**: General purpose, maximum compatibility

### scrypt
- **Pros**: Memory-hard, designed specifically to resist hardware attacks, tunable memory cost
- **Cons**: Newer (less audit history), requires more memory
- **Best for**: High-security applications, environments where memory is cheaper than CPU

## Performance

| Metric | bcrypt (10 rounds) | scrypt (N=16384) |
|--------|-------------------|------------------|
| Hash time | ~50-100ms | ~20-30ms |
| Memory usage | Low (~4KB) | Medium (~16MB) |
| Parallel hashing | Good | Limited by memory |

## Migration Notes

- Both versions use **different hash formats** - they are NOT interchangeable
- You cannot verify a bcrypt hash with scrypt or vice versa
- For migration: hash new passwords with preferred method, maintain both for verification

## Recommendation

For **new projects**:
- Choose **V2 (scrypt)** if you want zero dependencies and modern security
- Choose **V1 (bcrypt)** if you need maximum compatibility and audit history

Both are secure choices when configured properly.
