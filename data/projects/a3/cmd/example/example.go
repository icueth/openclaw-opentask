package main

import (
	"fmt"
	"log"

	hashpassword "github.com/example/hashpassword"
)

func main() {
	fmt.Println("=== Golang HMAC-SHA256 Password Hashing Demo ===")
	fmt.Println()

	// Configuration
	secretKey := "my-super-secret-key-at-least-32-chars-long!!"
	password := "mySecurePassword123"

	// Example 1: Basic hashing
	fmt.Println("1. Basic Password Hashing")
	fmt.Println("-------------------------")
	hash, err := hashpassword.HashPassword(password, secretKey)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}
	fmt.Printf("Password: %s\n", password)
	fmt.Printf("Hash:     %s\n\n", hash)

	// Example 2: Verify correct password
	fmt.Println("2. Verify Correct Password")
	fmt.Println("--------------------------")
	isValid, err := hashpassword.VerifyPassword(password, hash, secretKey)
	if err != nil {
		log.Fatalf("Failed to verify password: %v", err)
	}
	fmt.Printf("Password '%s' is valid: %v\n\n", password, isValid)

	// Example 3: Verify wrong password
	fmt.Println("3. Verify Wrong Password")
	fmt.Println("------------------------")
	wrongPassword := "wrongPassword456"
	isValid, err = hashpassword.VerifyPassword(wrongPassword, hash, secretKey)
	if err != nil {
		log.Fatalf("Failed to verify password: %v", err)
	}
	fmt.Printf("Password '%s' is valid: %v\n\n", wrongPassword, isValid)

	// Example 4: Verify with wrong secret key
	fmt.Println("4. Verify With Wrong Secret Key")
	fmt.Println("-------------------------------")
	wrongKey := "different-secret-key-not-the-same!!!"
	isValid, err = hashpassword.VerifyPassword(password, hash, wrongKey)
	if err != nil {
		log.Fatalf("Failed to verify password: %v", err)
	}
	fmt.Printf("Password with wrong key is valid: %v\n\n", isValid)

	// Example 5: Custom salt length
	fmt.Println("5. Custom Salt Length (64 bytes)")
	fmt.Println("--------------------------------")
	longSaltHash, err := hashpassword.HashPasswordWithSaltLength(password, secretKey, 64)
	if err != nil {
		log.Fatalf("Failed to hash with custom salt: %v", err)
	}
	fmt.Printf("Hash with 64-byte salt: %s\n", longSaltHash)
	isValid, err = hashpassword.VerifyPassword(password, longSaltHash, secretKey)
	if err != nil {
		log.Fatalf("Failed to verify: %v", err)
	}
	fmt.Printf("Verification result: %v\n\n", isValid)

	// Example 6: Each hash is unique (different salt)
	fmt.Println("6. Each Hash is Unique (Different Salt)")
	fmt.Println("---------------------------------------")
	hash1, _ := hashpassword.HashPassword(password, secretKey)
	hash2, _ := hashpassword.HashPassword(password, secretKey)
	fmt.Printf("Hash 1: %s\n", hash1)
	fmt.Printf("Hash 2: %s\n", hash2)
	fmt.Printf("Hashes are different: %v\n\n", hash1 != hash2)

	// Example 7: Algorithm info
	fmt.Println("7. Algorithm Information")
	fmt.Println("------------------------")
	info := hashpassword.GetAlgorithmInfo()
	for key, value := range info {
		fmt.Printf("  %s: %v\n", key, value)
	}
	fmt.Println()

	// Example 8: Error handling
	fmt.Println("8. Error Handling Examples")
	fmt.Println("--------------------------")

	// Empty password
	_, err = hashpassword.HashPassword("", secretKey)
	if err != nil {
		fmt.Printf("Empty password error: %v\n", err)
	}

	// Empty secret key
	_, err = hashpassword.HashPassword(password, "")
	if err != nil {
		fmt.Printf("Empty secret key error: %v\n", err)
	}

	// Invalid hash format
	_, err = hashpassword.VerifyPassword(password, "invalid-hash", secretKey)
	if err != nil {
		fmt.Printf("Invalid hash error: %v\n", err)
	}

	// Too short salt
	_, err = hashpassword.HashPasswordWithSaltLength(password, secretKey, 8)
	if err != nil {
		fmt.Printf("Short salt error: %v\n", err)
	}

	fmt.Println("\n=== Demo Complete ===")
}
