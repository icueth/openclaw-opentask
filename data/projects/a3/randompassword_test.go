package password

import (
	"strings"
	"testing"
)

func TestGeneratePassword(t *testing.T) {
	tests := []struct {
		name        string
		length      int
		wantErr     bool
		errContains string
	}{
		{
			name:    "Generate 30 character password",
			length:  30,
			wantErr: false,
		},
		{
			name:    "Generate 8 character password",
			length:  8,
			wantErr: false,
		},
		{
			name:    "Generate 64 character password",
			length:  64,
			wantErr: false,
		},
		{
			name:        "Generate password with zero length",
			length:      0,
			wantErr:     true,
			errContains: "must be greater than 0",
		},
		{
			name:        "Generate password with negative length",
			length:      -5,
			wantErr:     true,
			errContains: "must be greater than 0",
		},
		{
			name:    "Generate 1 character password",
			length:  1,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			password, err := GeneratePassword(tt.length)

			if tt.wantErr {
				if err == nil {
					t.Errorf("GeneratePassword() expected error but got none")
					return
				}
				if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("GeneratePassword() error = %v, should contain %v", err, tt.errContains)
				}
				return
			}

			if err != nil {
				t.Errorf("GeneratePassword() unexpected error = %v", err)
				return
			}

			if len(password) != tt.length {
				t.Errorf("GeneratePassword() length = %v, want %v", len(password), tt.length)
			}

			// Verify password contains characters from expected sets
			hasUpper := false
			hasLower := false
			hasNumber := false
			hasSpecial := false

			for _, char := range password {
				switch {
				case strings.ContainsRune(uppercaseLetters, char):
					hasUpper = true
				case strings.ContainsRune(lowercaseLetters, char):
					hasLower = true
				case strings.ContainsRune(numbers, char):
					hasNumber = true
				case strings.ContainsRune(specialChars, char):
					hasSpecial = true
				}
			}

			if !hasUpper {
				t.Error("Generated password should contain uppercase letters")
			}
			if !hasLower {
				t.Error("Generated password should contain lowercase letters")
			}
			if !hasNumber {
				t.Error("Generated password should contain numbers")
			}
			if !hasSpecial {
				t.Error("Generated password should contain special characters")
			}
		})
	}
}

func TestGeneratePasswordDefault(t *testing.T) {
	t.Run("Generate default 30 character password", func(t *testing.T) {
		password, err := GeneratePasswordDefault()
		if err != nil {
			t.Errorf("GeneratePasswordDefault() unexpected error = %v", err)
			return
		}

		if len(password) != 30 {
			t.Errorf("GeneratePasswordDefault() length = %v, want 30", len(password))
		}

		// Verify it contains all character types
		hasUpper := false
		hasLower := false
		hasNumber := false
		hasSpecial := false

		for _, char := range password {
			switch {
			case strings.ContainsRune(uppercaseLetters, char):
				hasUpper = true
			case strings.ContainsRune(lowercaseLetters, char):
				hasLower = true
			case strings.ContainsRune(numbers, char):
				hasNumber = true
			case strings.ContainsRune(specialChars, char):
				hasSpecial = true
			}
		}

		if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
			t.Error("Default password should contain all character types")
		}
	})
}

func TestGeneratePasswordWithOptions(t *testing.T) {
	tests := []struct {
		name        string
		length      int
		useUpper    bool
		useLower    bool
		useNumbers  bool
		useSpecial  bool
		wantErr     bool
		errContains string
		checkFunc   func(string) bool
	}{
		{
			name:       "Uppercase only",
			length:     20,
			useUpper:   true,
			useLower:   false,
			useNumbers: false,
			useSpecial: false,
			wantErr:    false,
			checkFunc: func(s string) bool {
				return strings.ContainsAny(s, uppercaseLetters) &&
					!strings.ContainsAny(s, lowercaseLetters) &&
					!strings.ContainsAny(s, numbers) &&
					!strings.ContainsAny(s, specialChars)
			},
		},
		{
			name:       "Lowercase only",
			length:     20,
			useUpper:   false,
			useLower:   true,
			useNumbers: false,
			useSpecial: false,
			wantErr:    false,
			checkFunc: func(s string) bool {
				return !strings.ContainsAny(s, uppercaseLetters) &&
					strings.ContainsAny(s, lowercaseLetters) &&
					!strings.ContainsAny(s, numbers) &&
					!strings.ContainsAny(s, specialChars)
			},
		},
		{
			name:       "Numbers only",
			length:     20,
			useUpper:   false,
			useLower:   false,
			useNumbers: true,
			useSpecial: false,
			wantErr:    false,
			checkFunc: func(s string) bool {
				return !strings.ContainsAny(s, uppercaseLetters) &&
					!strings.ContainsAny(s, lowercaseLetters) &&
					strings.ContainsAny(s, numbers) &&
					!strings.ContainsAny(s, specialChars)
			},
		},
		{
			name:       "Special chars only",
			length:     20,
			useUpper:   false,
			useLower:   false,
			useNumbers: false,
			useSpecial: true,
			wantErr:    false,
			checkFunc: func(s string) bool {
				return !strings.ContainsAny(s, uppercaseLetters) &&
					!strings.ContainsAny(s, lowercaseLetters) &&
					!strings.ContainsAny(s, numbers) &&
					strings.ContainsAny(s, specialChars)
			},
		},
		{
			name:       "Uppercase and Lowercase only",
			length:     20,
			useUpper:   true,
			useLower:   true,
			useNumbers: false,
			useSpecial: false,
			wantErr:    false,
			checkFunc: func(s string) bool {
				return strings.ContainsAny(s, uppercaseLetters) &&
					strings.ContainsAny(s, lowercaseLetters) &&
					!strings.ContainsAny(s, numbers) &&
					!strings.ContainsAny(s, specialChars)
			},
		},
		{
			name:       "All character types",
			length:     30,
			useUpper:   true,
			useLower:   true,
			useNumbers: true,
			useSpecial: true,
			wantErr:    false,
			checkFunc: func(s string) bool {
				return strings.ContainsAny(s, uppercaseLetters) &&
					strings.ContainsAny(s, lowercaseLetters) &&
					strings.ContainsAny(s, numbers) &&
					strings.ContainsAny(s, specialChars)
			},
		},
		{
			name:        "No character sets enabled",
			length:      20,
			useUpper:    false,
			useLower:    false,
			useNumbers:  false,
			useSpecial:  false,
			wantErr:     true,
			errContains: "at least one character set",
		},
		{
			name:        "Zero length with valid options",
			length:      0,
			useUpper:    true,
			useLower:    true,
			useNumbers:  false,
			useSpecial:  false,
			wantErr:     true,
			errContains: "must be greater than 0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			password, err := GeneratePasswordWithOptions(tt.length, tt.useUpper, tt.useLower, tt.useNumbers, tt.useSpecial)

			if tt.wantErr {
				if err == nil {
					t.Errorf("GeneratePasswordWithOptions() expected error but got none")
					return
				}
				if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("GeneratePasswordWithOptions() error = %v, should contain %v", err, tt.errContains)
				}
				return
			}

			if err != nil {
				t.Errorf("GeneratePasswordWithOptions() unexpected error = %v", err)
				return
			}

			if len(password) != tt.length {
				t.Errorf("GeneratePasswordWithOptions() length = %v, want %v", len(password), tt.length)
			}

			if tt.checkFunc != nil && !tt.checkFunc(password) {
				t.Errorf("GeneratePasswordWithOptions() password %q does not match expected character set constraints", password)
			}
		})
	}
}

func TestGeneratePasswordUniqueness(t *testing.T) {
	// Generate multiple passwords and ensure they're not all identical
	// (very low probability of collision with crypto/rand)
	passwords := make(map[string]bool)
	for i := 0; i < 100; i++ {
		password, err := GeneratePassword(30)
		if err != nil {
			t.Fatalf("GeneratePassword() unexpected error = %v", err)
		}
		passwords[password] = true
	}

	// With crypto/rand, we should have 100 unique passwords
	if len(passwords) != 100 {
		t.Errorf("Expected 100 unique passwords, got %d (possible weak randomness)", len(passwords))
	}
}

func TestGeneratePasswordDefaultMultiple(t *testing.T) {
	// Test multiple default passwords are 30 characters
	for i := 0; i < 10; i++ {
		password, err := GeneratePasswordDefault()
		if err != nil {
			t.Fatalf("GeneratePasswordDefault() unexpected error = %v", err)
		}
		if len(password) != 30 {
			t.Errorf("GeneratePasswordDefault() iteration %d: length = %v, want 30", i, len(password))
		}
	}
}
