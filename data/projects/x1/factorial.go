package main

import (
	"errors"
	"fmt"
)

// Factorial calculates the factorial of a non-negative integer n.
// Returns an error if n is negative.
// Note: For large values of n, this may overflow int.
func Factorial(n int) (int, error) {
	if n < 0 {
		return 0, errors.New("factorial is not defined for negative numbers")
	}
	
	// Base case: 0! = 1
	if n == 0 {
		return 1, nil
	}
	
	// Calculate factorial iteratively
	result := 1
	for i := 1; i <= n; i++ {
		result *= i
	}
	
	return result, nil
}

func main() {
	// Test cases: 0, 1, 5, 10
	testCases := []int{0, 1, 5, 10}
	
	fmt.Println("=== Factorial Function Demonstration ===")
	fmt.Println()
	
	for _, n := range testCases {
		result, err := Factorial(n)
		if err != nil {
			fmt.Printf("Factorial(%d) -> Error: %v\n", n, err)
		} else {
			fmt.Printf("Factorial(%d) = %d\n", n, result)
		}
	}
	
	// Demonstrate error handling with negative input
	fmt.Println()
	fmt.Println("=== Error Handling Demo ===")
	negativeInput := -5
	result, err := Factorial(negativeInput)
	if err != nil {
		fmt.Printf("Factorial(%d) -> Error: %v\n", negativeInput, err)
	} else {
		fmt.Printf("Factorial(%d) = %d\n", negativeInput, result)
	}
}
