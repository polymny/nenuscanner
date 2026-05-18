import vine, { SimpleMessagesProvider } from '@vinejs/vine';
import type { Infer } from '@vinejs/vine/types';

export const createAcquisitionSchema = vine.create(
  vine.object({
    name: vine
      .string()
      .minLength(1)
      .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_()]+$/)
      .trim(),
    artifactId: vine.number().withoutDecimals().positive(),
    scenarioId: vine.number().withoutDecimals().positive().nullable(),
    calibrationId: vine.number().withoutDecimals().positive().nullable(),
    withRotationAutofocus: vine.boolean(),
  })
);

createAcquisitionSchema.messagesProvider = new SimpleMessagesProvider({
  'name.minLength': 'Le nom est requis',
  'name.regex': 'Le nom contient des caractères non autorisés',
});

export type CreateAcquisitionPayload = Infer<typeof createAcquisitionSchema>;
