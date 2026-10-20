import type { GraveFormValues } from "@/lib/schemas/grave";

export function toGraveRow(values: GraveFormValues) {
  return {
    name: values.name,
    description: values.description || null,
    epitaph: values.epitaph || null,
    born: values.born || null,
    died: values.died || null,
    cause: values.cause || null,
    tech_stack: values.tech_stack,
    project_url: values.project_url || null,
  };
}
