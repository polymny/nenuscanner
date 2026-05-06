import vine, { SimpleMessagesProvider } from '@vinejs/vine';
import type { Infer } from '@vinejs/vine/types';
import { LED_VALUES } from '@/types/led.types';

export const upsertScenarioSchema = vine.create(
  vine.object({
    id: vine.number().withoutDecimals().positive().optional(),
    name: vine
      .string()
      .minLength(1)
      .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_()]+$/)
      .trim(),
    leds: vine
      .array(
        vine.object({
          value: vine.enum(LED_VALUES),
          power: vine.number().min(0).max(1),
        })
      )
      .minLength(1),
    rotationsCount: vine.number().withoutDecimals().min(0).max(12),
    shutterSpeeds: vine.array(vine.number().positive()).minLength(1),
  })
);

upsertScenarioSchema.messagesProvider = new SimpleMessagesProvider({
  'name.minLength': 'Le nom est requis',
  'name.regex': 'Le nom contient des caractères non autorisés',
});

export type UpsertScenarioPayload = Infer<typeof upsertScenarioSchema>;
