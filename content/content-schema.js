// Content schema definitions for validation and documentation

export const heroSchema = {
  title: { type: 'string', required: true, maxLength: 100 },
  subtitle: { type: 'string', required: true, maxLength: 200 },
  cta: { type: 'string', required: true, maxLength: 50 },
  ctaLink: { type: 'string', required: true },
  description: { type: 'string', required: false, maxLength: 300 }
};

export const aboutSchema = {
  title: { type: 'string', required: true, maxLength: 100 },
  subtitle: { type: 'string', required: true, maxLength: 200 },
  description: { type: 'string', required: true, maxLength: 500 },
  mission: { type: 'string', required: true, maxLength: 300 },
  vision: { type: 'string', required: true, maxLength: 300 }
};

export const featuresSchema = {
  title: { type: 'string', required: true, maxLength: 100 },
  subtitle: { type: 'string', required: true, maxLength: 200 },
  features: {
    type: 'array',
    required: true,
    items: {
      title: { type: 'string', required: true, maxLength: 100 },
      description: { type: 'string', required: true, maxLength: 200 },
      icon: { type: 'string', required: true, maxLength: 50 }
    }
  }
};

export const contactSchema = {
  title: { type: 'string', required: true, maxLength: 100 },
  subtitle: { type: 'string', required: true, maxLength: 200 },
  description: { type: 'string', required: true, maxLength: 300 },
  email: { type: 'string', required: true, format: 'email' },
  phone: { type: 'string', required: false },
  address: { type: 'string', required: false },
  cta: { type: 'string', required: true, maxLength: 50 },
  ctaLink: { type: 'string', required: true }
};

// Validation function
export const validateContent = (content, schema) => {
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    if (rules.required && !content[key]) {
      errors.push(`${key} is required`);
    }
    
    if (content[key] && rules.maxLength && content[key].length > rules.maxLength) {
      errors.push(`${key} exceeds maximum length of ${rules.maxLength}`);
    }
    
    if (content[key] && rules.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content[key])) {
      errors.push(`${key} must be a valid email address`);
    }
  }
  
  return errors;
};