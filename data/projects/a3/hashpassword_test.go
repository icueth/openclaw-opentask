package hashpassword

import (
	"strings"
	"testing"
)

func TestHashPassword(t *testing.T) {
	secretKey := "test-secret-key-at-least-32-bytes-long!"
	password := "testPassword123"

	// Test basic hashing
	hash, err := HashPassword(password, secretKey)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	// Verify hash format
	if !strings.HasPrefix(hash, AlgorithmIdentifier+Separator) {
		t.Errorf("Hash doesn't have correct prefix: %s", hash)
	}

	parts := strings.Split(hash, Separator)
	if len(parts) != 3 {
		t.Errorf("Hash doesn't have 3 parts: %v", parts)
	}
}

func TestVerifyPassword(t *testing.T) {
	secretKey := "test-secret-key-at-least-32-bytes-long!"
	password := "testPassword123"

	hash, err := HashPassword(password, secretKey)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	// Test correct password
	valid, err := VerifyPassword(password, hash, secretKey)
	if err != nil {
		t.Fatalf("VerifyPassword failed: %v", err)
	}
	if !valid {
		t.Error("Correct password should be valid")
	}

	// Test wrong password
	valid, err = VerifyPassword("wrongPassword", hash, secretKey)
	if err != nil {
		t.Fatalf("VerifyPassword failed: %v", err)
	}
	if valid {
		t.Error("Wrong password should be invalid")
	}

	// Test wrong secret key
	valid, err = VerifyPassword(password, hash, "wrong-secret-key-not-same!!")
	if err != nil {
		t.Fatalf("VerifyPassword failed: %v", err)
	}
	if valid {
		t.Error("Wrong secret key should be invalid")
	}
}

func TestHashPasswordUniqueness(t *testing.T) {
	secretKey := "test-secret-key-at-least-32-bytes-long!"
	password := "samePassword"

	hash1, _ := HashPassword(password, secretKey)
	hash2, _ := HashPassword(password, secretKey)

	if hash1 == hash2 {
		t.Error("Hashes should be unique (different salts)")
	}
}

func TestEmptyInputs(t *testing.T) {
	// Test empty password
	_, err := HashPassword("", "valid-secret-key")
	if err != ErrEmptyPassword {
		t.Errorf("Expected ErrEmptyPassword, got: %v", err)
	}

	// Test empty secret key
	_, err = HashPassword("validPassword", "")
	if err != ErrEmptySecretKey {
		t.Errorf("Expected ErrEmptySecretKey, got: %v", err)
	}

	// Test empty hash in verify
	_, err = VerifyPassword("password", "", "secret")
	if err != ErrInvalidHash {
		t.Errorf("Expected ErrInvalidHash, got: %v", err)
	}
}

func TestInvalidHashFormat(t *testing.T) {
	secretKey := "test-secret-key-at-least-32-bytes-long!"

	// Test invalid format
	_, err := VerifyPassword("password", "invalid", secretKey)
	if err != ErrInvalidHash {
		t.Errorf("Expected ErrInvalidHash, got: %v", err)
	}

	// Test wrong algorithm
	_, err = VerifyPassword("password", "bcrypt$salt$hash", secretKey)
	if err != ErrInvalidAlgorithm {
		t.Errorf("Expected ErrInvalidAlgorithm, got: %v", err)
	}
}

func TestCustomSaltLength(t *testing.T) {
	secretKey := "test-secret-key-at-least-32-bytes-long!"
	password := "testPassword123"

	// Test valid custom salt length
	hash, err := HashPasswordWithSaltLength(password, secretKey, 64)
	if err != nil {
		t.Fatalf("HashPasswordWithSaltLength failed: %v", err)
	}

	valid, err := VerifyPassword(password, hash, secretKey)
	if err != nil {
		t.Fatalf("VerifyPassword failed: %v", err)
	}
	if !valid {
		t.Error("Password with custom salt should be valid")
	}

	// Test too short salt
	_, err = HashPasswordWithSaltLength(password, secretKey, 8)
	if err == nil {
		t.Error("Should fail with too short salt")
	}
}

func TestGetAlgorithmInfo(t *testing.T) {
	info := GetAlgorithmInfo()
	
	if info["algorithm"] != AlgorithmIdentifier {
		t.Errorf("Expected algorithm %s, got %v", AlgorithmIdentifier, info["algorithm"])
	}
	
	if info["hash_function"] != "SHA-256" {
		t.Errorf("Expected SHA-256, got %v", info["hash_function"])
	}
}
