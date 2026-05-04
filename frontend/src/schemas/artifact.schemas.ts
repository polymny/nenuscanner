import vine, { SimpleMessagesProvider } from '@vinejs/vine';
import type { Infer } from '@vinejs/vine/types';

export const upsertArtifactSchema = vine.create(
  vine.object({
    id: vine.number().withoutDecimals().positive().optional(),
    name: vine
      .string()
      .minLength(1)
      .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_()]+$/)
      .trim(),
  })
);

upsertArtifactSchema.messagesProvider = new SimpleMessagesProvider({
  'name.minLength': 'Le nom est requis',
  'name.regex': 'Le nom contient des caractères non autorisés',
});

export type UpsertArtifactPayload = Infer<typeof upsertArtifactSchema>;
