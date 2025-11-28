import { computed, type Ref } from 'vue';

export interface PasswordStrength {
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
  errors: string[];
  color: string;
  label: string;
}

/**
 * Password strength composable
 * Matches backend validation requirements
 */
export function usePasswordStrength(password: Ref<string>) {
  const strength = computed<PasswordStrength>(() => {
    const pwd = password.value;
    const errors: string[] = [];
    let score = 0;

    if (!pwd) {
      return {
        level: 'weak',
        score: 0,
        errors: ['Password is required'],
        color: 'text-gray-400',
        label: 'No password',
      };
    }

    // Length checks
    if (pwd.length < 8) {
      errors.push('At least 8 characters');
    } else {
      score++;
    }

    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;

    // Character variety checks
    if (!/[a-z]/.test(pwd)) {
      errors.push('One lowercase letter');
    } else {
      score++;
    }

    if (!/[A-Z]/.test(pwd)) {
      errors.push('One uppercase letter');
    } else {
      score++;
    }

    if (!/\d/.test(pwd)) {
      errors.push('One number');
    } else {
      score++;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push('One special character (!@#$%^&* etc.)');
    } else {
      score++;
    }

    // Check for common patterns
    if (hasSequentialCharacters(pwd)) {
      errors.push('No sequential characters (123, abc)');
    } else {
      score++;
    }

    if (hasRepeatedCharacters(pwd)) {
      errors.push('No repeated characters (aaa, 111)');
    } else {
      score++;
    }

    if (isCommonPassword(pwd)) {
      errors.push('Password is too common');
    } else {
      score++;
    }

    // Determine level and styling
    let level: PasswordStrength['level'];
    let color: string;
    let label: string;

    if (score <= 3) {
      level = 'weak';
      color = 'text-red-600';
      label = 'Weak';
    } else if (score <= 6) {
      level = 'medium';
      color = 'text-orange-500';
      label = 'Medium';
    } else if (score <= 8) {
      level = 'strong';
      color = 'text-blue-600';
      label = 'Strong';
    } else {
      level = 'very-strong';
      color = 'text-green-600';
      label = 'Very Strong';
    }

    return {
      level,
      score,
      errors,
      color,
      label,
    };
  });

  const isValid = computed(() => strength.value.errors.length === 0);

  const progressPercent = computed(() => {
    const maxScore = 10;
    return Math.min((strength.value.score / maxScore) * 100, 100);
  });

  const progressColor = computed(() => {
    const level = strength.value.level;
    if (level === 'weak') return 'bg-red-500';
    if (level === 'medium') return 'bg-orange-500';
    if (level === 'strong') return 'bg-blue-500';
    return 'bg-green-500';
  });

  return {
    strength,
    isValid,
    progressPercent,
    progressColor,
  };
}

// Helper functions matching backend logic
function hasSequentialCharacters(password: string): boolean {
  const lower = password.toLowerCase();
  for (let i = 0; i < lower.length - 2; i++) {
    const charCode1 = lower.charCodeAt(i);
    const charCode2 = lower.charCodeAt(i + 1);
    const charCode3 = lower.charCodeAt(i + 2);

    if (
      (charCode2 === charCode1 + 1 && charCode3 === charCode2 + 1) ||
      (charCode2 === charCode1 - 1 && charCode3 === charCode2 - 1)
    ) {
      return true;
    }
  }
  return false;
}

function hasRepeatedCharacters(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true;
    }
  }
  return false;
}

function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    'password123',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
    'admin',
    'login',
  ];
  return commonPasswords.includes(password.toLowerCase());
}
