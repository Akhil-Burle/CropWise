import { z } from 'zod';

export const LangSchema = z.enum(['en', 'hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ml', 'pa', 'or']);
export const AreaUnitSchema = z.enum(['acre', 'hectare']);
export const QuantitySchema = z.object({ value: z.number().finite(), unit: z.string() });
export const DoseSchema = z.object({ perArea: QuantitySchema, total: QuantitySchema });

export const AppErrorSchema = z.object({
  code: z.string(),
  message: z.string().nullish(),
  retryable: z.boolean().nullish(),
  fieldErrors: z.record(z.string()).nullish(),
});

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().nullish(),
    pageSize: z.number().int().nullish(),
    total: z.number().int().nullish(),
    hasMore: z.boolean().nullish(),
  });
}

export type AppErrorDto = z.infer<typeof AppErrorSchema>;
