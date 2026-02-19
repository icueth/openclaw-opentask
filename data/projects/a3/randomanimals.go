package randomanimals

import (
	"crypto/rand"
	"errors"
	"math/big"
)

// animals is the list of 10 animal types
var animals = []string{
	"Lion",
	"Tiger",
	"Elephant",
	"Giraffe",
	"Monkey",
	"Bear",
	"Wolf",
	"Fox",
	"Deer",
	"Rabbit",
}

// GetRandomAnimal returns one random animal from the 10 types
// Uses crypto/rand for secure random selection
func GetRandomAnimal() (string, error) {
	max := big.NewInt(int64(len(animals)))
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return animals[n.Int64()], nil
}

// GetRandomAnimals returns multiple unique random animals
// count: number of unique animals to return (max 10)
// Returns error if count <= 0 or count > 10
func GetRandomAnimals(count int) ([]string, error) {
	if count <= 0 {
		return nil, errors.New("count must be greater than 0")
	}
	if count > len(animals) {
		return nil, errors.New("count cannot exceed available animal types")
	}

	// Create a copy of animals slice to shuffle
	shuffled := make([]string, len(animals))
	copy(shuffled, animals)

	// Fisher-Yates shuffle using crypto/rand
	for i := len(shuffled) - 1; i > 0; i-- {
		max := big.NewInt(int64(i + 1))
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return nil, err
		}
		j := n.Int64()
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	}

	// Return the first 'count' elements
	return shuffled[:count], nil
}

// GetAllAnimals returns all 10 animal types
func GetAllAnimals() []string {
	// Return a copy to prevent external modification
	result := make([]string, len(animals))
	copy(result, animals)
	return result
}
