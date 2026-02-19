package hashpassword

import (
	"strings"
	"testing"
)

func TestHashPassword(t *testing.T) {
	secretKey := "my-super-secret-key"
	
	tests := []struct {
		name        string
		password    string
		secretKey   string
		wantErr     bool
		errContains string
	}{
		{
			name:      "valid password and key",
			password:  "mypassword123",
			secretKey: secretKey,
			wantErr:   false,
		},
		{
			name:        "empty password",
			password:    "",
			secretKey:   secretKey,
			wantErr:     true,
			errContains: "password cannot be empty",
		},
		{
			name:        "empty secret key",
			password:    "mypassword123",
			secretKey:   "",
			wantErr:     true,
			errContains: "secret key cannot be empty",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password, tt.secretKey)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("HashPassword() expected error but got none")
					return
				}
				if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("HashPassword() error = %v, want error containing %v", err, tt.errContains)
				}
				return
			}
			
			if err != nil {
				t.Errorf("HashPassword() unexpected error = %v", err)
				return
			}
			
			if hash == "" {
				t.Errorf("HashPassword() returned empty hash")
			}
			
			// Verify format
			parts := strings.Split(hash, separator)
			if len(parts) != 3 {
				t.Errorf("HashPassword() invalid format, expected 3 parts, got %d", len(parts))
			}
			if parts[0] != algorithm {
				t.Errorf("HashPassword() algorithm = %v, want %v", parts[0], algorithm)
			}
		})
	}
}

func TestVerifyPassword(t *testing.T) {
	secretKey := "my-super-secret-key"
	password := "mypassword123"
	
	// Create a valid hash for testing
	validHash, err := HashPassword(password, secretKey)
	if err != nil {
		t.Fatalf("Failed to create hash: %v", err)
	}

	tests := []struct {
		name        string
		password    string
		hash        string
		secretKey   string
		wantMatch   bool
		wantErr     bool
		errContains string
	}{
		{
			name:      "valid password matches hash",
			password:  password,
			hash:      validHash,
			secretKey: secretKey,
			wantMatch: true,
			wantErr:   false,
		},
		{
			name:      "wrong password does not match",
			password:  "wrongpassword",
			hash:      validHash,
			secretKey: secretKey,
			wantMatch: false,
			wantErr:   false,
		},
		{
			name:      "wrong secret key does not match",
			password:  password,
			hash:      validHash,
			secretKey: "wrong-secret-key",
			wantMatch: false,
			wantErr:   false,
		},
		{
			name:        "empty password",
			password:    "",
			hash:        validHash,
			secretKey:   secretKey,
			wantMatch:   false,
			wantErr:     true,
			errContains: "password cannot be empty",
		},
		{
			name:        "empty hash",
			password:    password,
			hash:        "",
			secretKey:   secretKey,
			wantMatch:   false,
			wantErr:     true,
			errContains: "hash cannot be empty",
		},
		{
			name:        "empty secret key",
			password:    password,
			hash:        validHash,
			secretKey:   "",
			wantMatch:   false,
			wantErr:     true,
			errContains: "secret key cannot be empty",
		},
		{
			name:        "invalid hash format",
			password:    password,
			hash:        "invalid-hash",
			secretKey:   secretKey,
			wantMatch:   false,
			wantErr:     true,
			errContains: "invalid hash format",
		},
		{
			name:        "unsupported algorithm",
			password:    password,
			hash:        "md5$abc$def",
			secretKey:   secretKey,
			wantMatch:   false,
			wantErr:     true,
			errContains: "unsupported algorithm",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			match, err := VerifyPassword(tt.password, tt.hash, tt.secretKey)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("VerifyPassword() expected error but got none")
					return
				}
				if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("VerifyPassword() error = %v, want error containing %v", err, tt.errContains)
				}
				return
			}
			
			if err != nil {
				t.Errorf("VerifyPassword() unexpected error = %v", err)
				return
			}
			
			if match != tt.wantMatch {
				t.Errorf("VerifyPassword() match = %v, want %v", match, tt.wantMatch)
			}
		})
	}
}

func TestHashPasswordUniqueness(t *testing.T) {
	secretKey := "my-super-secret-key"
	password := "mypassword123"
	
	// Hash the same password twice
	hash1, err := HashPassword(password, secretKey)
	if err != nil {
		t.Fatalf("Failed to create hash1: %v", err)
	}
	
	hash2, err := HashPassword(password, secretKey)
	if err != nil {
		t.Fatalf("Failed to create hash2: %v", err)
	}
	
	// Hashes should be different (due to random salt)
	if hash1 == hash2 {
		t.Error("HashPassword() should produce different hashes for the same password (random salt)")
	}
	
	// But both should verify correctly
	match1, err := VerifyPassword(password, hash1, secretKey)
	if err != nil {
		t.Errorf("VerifyPassword() hash1 error = %v", err)
	}
	if !match1 {
		t.Error("VerifyPassword() hash1 should match")
	}
	
	match2, err := VerifyPassword(password, hash2, secretKey)
	if err != nil {
		t.Errorf("VerifyPassword() hash2 error = %v", err)
	}
	if !match2 {
		t.Error("VerifyPassword() hash2 should match")
	}
}

func TestVerifyPasswordWrongSalt(t *testing.T) {
	secretKey := "my-super-secret-key"
	password := "mypassword123"
	
	// Create valid hash
	validHash, _ := HashPassword(password, secretKey)
	
	// Modify the salt part
	parts := strings.Split(validHash, separator)
	parts[1] = "modified_salt"
	modifiedHash := strings.Join(parts, separator)
	
	// Should not match
	match, _ := VerifyPassword(password, modifiedHash, secretKey)
	if match {
		t.Error("VerifyPassword() should not match with modified salt")
	}
}
