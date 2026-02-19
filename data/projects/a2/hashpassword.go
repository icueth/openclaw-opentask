package hashpassword

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

const (
	algorithm   = "hmac_sha256"
	saltSize    = 32
	separator   = "$"
)

var (
	ErrInvalidHashFormat = errors.New("invalid hash format")
	ErrInvalidAlgorithm  = errors.New("unsupported algorithm")
)

// HashPassword creates an HMAC-SHA256 hash of the password with a random salt
// Format: hmac_sha256$salt$hash (base64 encoded)
func HashPassword(password, secretKey string) (string, error) {
	if password == "" {
		return "", errors.New("password cannot be empty")
	}
	if secretKey == "" {
		return "", errors.New("secret key cannot be empty")
	}

	// Generate random salt
	salt := make([]byte, saltSize)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// Create HMAC-SHA256 hash
	hash := computeHMAC(password, secretKey, salt)

	// Encode to base64
	saltB64 := base64.RawStdEncoding.EncodeToString(salt)
	hashB64 := base64.RawStdEncoding.EncodeToString(hash)

	// Format: algorithm$salt$hash
	result := fmt.Sprintf("%s%s%s%s%s", algorithm, separator, saltB64, separator, hashB64)
	
	return result, nil
}

// VerifyPassword verifies a password against a hash
func VerifyPassword(password, hash, secretKey string) (bool, error) {
	if password == "" {
		return false, errors.New("password cannot be empty")
	}
	if hash == "" {
		return false, errors.New("hash cannot be empty")
	}
	if secretKey == "" {
		return false, errors.New("secret key cannot be empty")
	}

	// Parse the hash
	parts := strings.Split(hash, separator)
	if len(parts) != 3 {
		return false, ErrInvalidHashFormat
	}

	algo := parts[0]
	saltB64 := parts[1]
	hashB64 := parts[2]

	// Verify algorithm
	if algo != algorithm {
		return false, ErrInvalidAlgorithm
	}

	// Decode salt
	salt, err := base64.RawStdEncoding.DecodeString(saltB64)
	if err != nil {
		return false, fmt.Errorf("failed to decode salt: %w", err)
	}

	// Compute expected hash
	expectedHash := computeHMAC(password, secretKey, salt)
	expectedHashB64 := base64.RawStdEncoding.EncodeToString(expectedHash)

	// Constant-time comparison
	return hmac.Equal([]byte(expectedHashB64), []byte(hashB64)), nil
}

// computeHMAC computes HMAC-SHA256 of password + salt with secret key
func computeHMAC(password, secretKey string, salt []byte) []byte {
	// Create message: password + salt
	message := append([]byte(password), salt...)

	// Compute HMAC-SHA256
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write(message)
	
	return mac.Sum(nil)
}
