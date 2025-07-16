import { ZodSchema, ZodError, ZodIssue } from "zod";

export function customZodResolver(schema: ZodSchema) {
  return (values: any) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return {};
    }
    // Map Zod errors to Mantine's error format
    const errors: Record<string, string> = {};
    (result.error as ZodError<any>).issues.forEach((err: ZodIssue) => {
      if (err.path.length) {
        errors[err.path[0] as string] = err.message;
      }
    });
    return errors;
  };
}