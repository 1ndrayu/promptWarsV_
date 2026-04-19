import { z } from 'zod';

// Strict schema for QR code payload parsing
export const qrPayloadSchema = z.object({
  uid: z.string().min(1, 'User ID is required').max(128, 'User ID too long'),
  eventId: z.string().min(1, 'Event ID is required').max(128, 'Event ID too long'),
  timestamp: z.number().int().positive('Timestamp must be a valid positive integer'),
});

// User profile update schema
export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  role: z.enum(['VIP', 'Guest', 'Staff', 'Lecturer']),
  company: z.string().optional(),
});
