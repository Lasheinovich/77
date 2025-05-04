import { z } from "zod"

// Common validation schemas
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(5, "Email must be at least 5 characters")
  .max(255, "Email must be less than 255 characters")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, apostrophes, and hyphens")

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number")
  .optional()

export const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .max(2048, "URL must be less than 2048 characters")
  .optional()

export const dateSchema = z.coerce.date()

// Sanitization functions
export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
}

export function sanitizeFilename(input: string): string {
  // Remove potentially dangerous characters from filenames
  return input.replace(/[^a-zA-Z0-9_.-]/g, "_")
}

export function sanitizeForUrl(input: string): string {
  // Convert string to URL-friendly slug
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Rate limiting helper
const rateLimits: Record<string, { count: number; resetTime: number }> = {}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()

  // Initialize or reset if window has passed
  if (!rateLimits[key] || now > rateLimits[key].resetTime) {
    rateLimits[key] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return true
  }

  // Increment count and check against limit
  rateLimits[key].count++

  return rateLimits[key].count <= limit
}

// Input validation middleware for API routes
export async function validateInput<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const validatedData = await schema.parseAsync(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Get the first error message
      const errorMessage = error.errors[0]?.message || "Invalid input"
      return { success: false, error: errorMessage }
    }
    return { success: false, error: "Validation failed" }
  }
}

// Create validation schemas for specific forms
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: urlSchema,
})

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(100, "Subject must be less than 100 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
})
