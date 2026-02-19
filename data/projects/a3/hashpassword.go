package hashpassword

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

const (
	// DefaultSaltLength is the default length of the random salt in bytes
	DefaultSaltLength = 32
	// AlgorithmIdentifier is the prefix for the hash format
	AlgorithmIdentifier = "hmac_sha256"
	// Separator is used to separate parts in the hash string
	Separator = "$"
)

var (
	// ErrInvalidHash is returned when the hash format is invalid
	ErrInvalidHash = errors.New("invalid hash format")
	// ErrInvalidAlgorithm is returned when the algorithm identifier doesn't match
	ErrInvalidAlgorithm = errors.New("invalid algorithm identifier")
	// ErrEmptyPassword is returned when the password is empty
	ErrEmptyPassword = errors.New("password cannot be empty")
	// ErrEmptySecretKey is returned when the secret key is empty
	ErrEmptySecretKey = errors.New("secret key cannot be empty")
)

// HashPassword hashes a password using HMAC-SHA256 with a random salt and secret key.
// Returns a string in the format: hmac_sha256$salt$hash (both base64 encoded)
func HashPassword(password, secretKey string) (string, error) {
	return HashPasswordWithSaltLength(password, secretKey, DefaultSaltLength)
}

// HashPasswordWithSaltLength hashes a password with configurable salt length.
func HashPasswordWithSaltLength(password, secretKey string, saltLength int) (string, error) {
	if err := validateInputs(password, secretKey); err != nil {
		return "", err
	}

	if saltLength < 16 {
		return "", errors.New("salt length must be at least 16 bytes")
	}

	// Generate random salt
	salt := make([]byte, saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// Compute HMAC-SHA256
	hash := computeHMAC(password, secretKey, salt)

	// Encode salt and hash to base64
	saltB64 := base64.URLEncoding.EncodeToString(salt)
	hashB64 := base64.URLEncoding.EncodeToString(hash)

	// Format: hmac_sha256$salt$hash
	result := fmt.Sprintf("%s%s%s%s%s", AlgorithmIdentifier, Separator, saltB64, Separator, hashB64)
	return result, nil
}

// VerifyPassword verifies a password against a hash using the secret key.
// Returns true if the password matches, false otherwise.
func VerifyPassword(password, hash, secretKey string) (bool, error) {
	if err := validateInputs(password, secretKey); err != nil {
		return false, err
	}

	if hash == "" {
		return false, ErrInvalidHash
	}

	// Parse the hash string
	parts := strings.Split(hash, Separator)
	if len(parts) != 3 {
		return false, ErrInvalidHash
	}

	algorithm := parts[0]
	saltB64 := parts[1]
	expectedHashB64 := parts[2]

	// Verify algorithm identifier
	if algorithm != AlgorithmIdentifier {
		return false, ErrInvalidAlgorithm
	}

	// Decode salt
	salt, err := base64.URLEncoding.DecodeString(saltB64)
	if err != nil {
		return false, fmt.Errorf("failed to decode salt: %w", err)
	}

	// Decode expected hash
	expectedHash, err := base64.URLEncoding.DecodeString(expectedHashB64)
	if err != nil {
		return false, fmt.Errorf("failed to decode hash: %w", err)
	}

	// Compute HMAC with provided password
	computedHash := computeHMAC(password, secretKey, salt)

	// Constant-time comparison to prevent timing attacks
	if subtle.ConstantTimeCompare(computedHash, expectedHash) == 1 {
		return true, nil
	}

	return false, nil
}

// computeHMAC computes HMAC-SHA256 of password + salt using secret key
func computeHMAC(password, secretKey string, salt []byte) []byte {
	// Create HMAC with secret key
	h := hmac.New(sha256.New, []byte(secretKey))
	
	// Write password + salt
	h.Write([]byte(password))
	h.Write(salt)
	
	return h.Sum(nil)
}

// validateInputs checks that password and secret key are not empty
func validateInputs(password, secretKey string) error {
	if password == "" {
		return ErrEmptyPassword
	}
	if secretKey == "" {
		return ErrEmptySecretKey
	}
	return nil
}

// GetAlgorithmInfo returns information about the algorithm used
func GetAlgorithmInfo() map[string]interface{} {
	return map[string]interface{}{
		"algorithm":       AlgorithmIdentifier,
		"hash_function":   "SHA-256",
		"hmac":            true,
		"default_salt_length": DefaultSaltLength,
		"hash_format":     "algorithm$salt$hash",
		"encoding":        "base64url",
	}
}
