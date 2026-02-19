package hashpassword

import (
	"crypto/rand"
	"errors"
	"math/big"
)

// Character sets for password generation
const (
	upperChars   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	lowerChars   = "abcdefghijklmnopqrstuvwxyz"
	numberChars  = "0123456789"
	specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
)

// GeneratePassword generates a random password of the specified length
// using all character sets (upper, lower, numbers, special)
func GeneratePassword(length int) (string, error) {
	return GeneratePasswordWithOptions(length, true, true, true, true)
}

// GeneratePasswordDefault generates a 30-character random password
// using all character sets
func GeneratePasswordDefault() (string, error) {
	return GeneratePassword(30)
}

// GeneratePasswordWithOptions generates a random password with customizable character sets
func GeneratePasswordWithOptions(length int, useUpper, useLower, useNumbers, useSpecial bool) (string, error) {
	if length <= 0 {
		return "", errors.New("password length must be greater than 0")
	}

	// Build the character set based on options
	var charset string
	if useUpper {
		charset += upperChars
	}
	if useLower {
		charset += lowerChars
	}
	if useNumbers {
		charset += numberChars
	}
	if useSpecial {
		charset += specialChars
	}

	if charset == "" {
		return "", errors.New("at least one character set must be selected")
	}

	// Generate password using crypto/rand for secure random generation
	password := make([]byte, length)
	charsetLen := big.NewInt(int64(len(charset)))

	for i := 0; i < length; i++ {
		// Get a random index into the charset
		randomIndex, err := rand.Int(rand.Reader, charsetLen)
		if err != nil {
			return "", err
		}
		password[i] = charset[randomIndex.Int64()]
	}

	return string(password), nil
}
