package randomanimals

import (
	"testing"
)

func TestGetRandomAnimal(t *testing.T) {
	animal, err := GetRandomAnimal()
	if err != nil {
		t.Errorf("GetRandomAnimal() returned error: %v", err)
	}

	// Check that returned animal is in the list
	found := false
	for _, a := range animals {
		if a == animal {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("GetRandomAnimal() returned invalid animal: %s", animal)
	}

	// Test that we can get an animal (not empty)
	if animal == "" {
		t.Error("GetRandomAnimal() returned empty string")
	}
}

func TestGetRandomAnimals(t *testing.T) {
	// Test normal case
	count := 5
	result, err := GetRandomAnimals(count)
	if err != nil {
		t.Errorf("GetRandomAnimals(%d) returned error: %v", count, err)
	}
	if len(result) != count {
		t.Errorf("GetRandomAnimals(%d) returned %d animals, expected %d", count, len(result), count)
	}

	// Test uniqueness
	seen := make(map[string]bool)
	for _, animal := range result {
		if seen[animal] {
			t.Errorf("GetRandomAnimals() returned duplicate animal: %s", animal)
		}
		seen[animal] = true
	}

	// Test all returned animals are valid
	for _, animal := range result {
		found := false
		for _, a := range animals {
			if a == animal {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("GetRandomAnimals() returned invalid animal: %s", animal)
		}
	}

	// Test error cases
	_, err = GetRandomAnimals(0)
	if err == nil {
		t.Error("GetRandomAnimals(0) should return error")
	}

	_, err = GetRandomAnimals(-1)
	if err == nil {
		t.Error("GetRandomAnimals(-1) should return error")
	}

	_, err = GetRandomAnimals(11)
	if err == nil {
		t.Error("GetRandomAnimals(11) should return error")
	}

	// Test getting all 10 animals
	all, err := GetRandomAnimals(10)
	if err != nil {
		t.Errorf("GetRandomAnimals(10) returned error: %v", err)
	}
	if len(all) != 10 {
		t.Errorf("GetRandomAnimals(10) returned %d animals, expected 10", len(all))
	}
}

func TestGetAllAnimals(t *testing.T) {
	all := GetAllAnimals()

	// Test that we get exactly 10 animals
	if len(all) != 10 {
		t.Errorf("GetAllAnimals() returned %d animals, expected 10", len(all))
	}

	// Test that all expected animals are present
	expectedAnimals := map[string]bool{
		"Lion":     false,
		"Tiger":    false,
		"Elephant": false,
		"Giraffe":  false,
		"Monkey":   false,
		"Bear":     false,
		"Wolf":     false,
		"Fox":      false,
		"Deer":     false,
		"Rabbit":   false,
	}

	for _, animal := range all {
		if _, exists := expectedAnimals[animal]; !exists {
			t.Errorf("GetAllAnimals() returned unexpected animal: %s", animal)
		}
		expectedAnimals[animal] = true
	}

	for animal, found := range expectedAnimals {
		if !found {
			t.Errorf("GetAllAnimals() missing expected animal: %s", animal)
		}
	}

	// Test that modifying returned slice doesn't affect original
	all[0] = "Modified"
	original := GetAllAnimals()
	if original[0] == "Modified" {
		t.Error("GetAllAnimals() returned slice that affects internal state")
	}
}

func TestGetRandomAnimalDistribution(t *testing.T) {
	// Run multiple times to ensure we're getting variety
	// This is a basic sanity check, not a statistical test
	results := make(map[string]int)
	iterations := 100

	for i := 0; i < iterations; i++ {
		animal, err := GetRandomAnimal()
		if err != nil {
			t.Fatalf("GetRandomAnimal() returned error: %v", err)
		}
		results[animal]++
	}

	// We should see at least a few different animals in 100 iterations
	if len(results) < 3 {
		t.Errorf("GetRandomAnimal() seems biased, only got %d unique animals in %d iterations", len(results), iterations)
	}
}
