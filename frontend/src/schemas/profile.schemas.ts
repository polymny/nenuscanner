import vine, { SimpleMessagesProvider } from '@vinejs/vine';
import type { Infer } from '@vinejs/vine/types';

export const upsertProfileSchema = vine.create(
  vine.object({
    id: vine.number().withoutDecimals().positive().optional(),
    name: vine
      .string()
      .minLength(1)
      .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_()]+$/)
      .trim(),
    ownerName: vine.string().trim().nullable(),
    employer: vine.string().trim().nullable(),
    contact: vine.string().trim().nullable(),
    project: vine.string().trim().nullable(),
    isActive: vine.boolean(),
  })
);

upsertProfileSchema.messagesProvider = new SimpleMessagesProvider({
  'name.minLength': 'Le nom est requis',
  'name.regex': 'Le nom contient des caractères non autorisés',
});

export type UpsertProfilePayload = Infer<typeof upsertProfileSchema>;
