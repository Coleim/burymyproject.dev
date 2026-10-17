import { z } from "zod";

export const graveSchema = z
  .object({
    name: z.string().min(1, "Project name is required").max(100),
    description: z.string().max(1000).optional().or(z.literal("")),
    epitaph: z.string().min(1, "Epitaph is required").max(280),
    born: z.string().min(1, "Date of birth is required"),
    died: z.string().min(1, "Date of death is required"),
    cause: z.string().min(1, "Cause of death is required").max(200),
    tech_stack: z.array(z.string().max(50)).max(20),
    is_public: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.born && data.died) return data.died >= data.born;
      return true;
    },
    {
      message: "Date of death must be after the date of birth",
      path: ["died"],
    },
  );

export type GraveFormValues = z.infer<typeof graveSchema>;
