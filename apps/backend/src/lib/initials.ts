/**
 * Generate initials from a full name
 *
 * Rules:
 * - For a single word: return first letter (e.g., "John" -> "J")
 * - For multiple words: return first letter of first word + first letter of last word (e.g., "John Doe" -> "JD")
 * - Always return uppercase
 * - Handle extra spaces
 * - Skip special characters and find first alphabetic character
 *
 * @param fullName - The full name to generate initials from
 * @returns The generated initials (1-2 characters)
 *
 * @example
 * generateInitials("John Doe") // => "JD"
 * generateInitials("John") // => "J"
 * generateInitials("John Middle Doe") // => "JD"
 * generateInitials("  John   Doe  ") // => "JD"
 * generateInitials("@John #Doe") // => "JD"
 * generateInitials("123 John Doe") // => "JD"
 */
export function generateInitials(fullName: string): string {
  // Handle invalid input
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  // Trim and split by whitespace, filter out empty strings
  const words = fullName.trim().split(/\s+/).filter(Boolean);

  // Handle empty or no words
  if (words.length === 0) {
    return '';
  }

  // Helper function to get first alphabetic character from a word
  const getFirstAlphaChar = (word: string | undefined): string => {
    if (!word) return '';
    const match = word.match(/[a-zA-Z]/);
    return match ? match[0].toUpperCase() : '';
  };

  // Filter out words that have no alphabetic characters
  const alphabeticWords = words.filter(word => /[a-zA-Z]/.test(word));

  // If no words with alphabetic characters, return empty
  if (alphabeticWords.length === 0) {
    return '';
  }

  // Single word: return first alphabetic letter
  if (alphabeticWords.length === 1) {
    return getFirstAlphaChar(alphabeticWords[0]);
  }

  // Multiple words: first letter of first word + first letter of last word
  const firstInitial = getFirstAlphaChar(alphabeticWords[0]);
  const lastInitial = getFirstAlphaChar(alphabeticWords[alphabeticWords.length - 1]);

  return firstInitial + lastInitial;
}
