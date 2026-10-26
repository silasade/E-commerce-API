import z from "zod";

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name is required"),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
});

const categoryIdSchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, "Category id is required"),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    categoryId: z.string().min(1, "Category id is required"),
  }),
});

export type CreateCategorySchemaType = z.infer<typeof createCategorySchema>;
export type CategoryIdSchemaType = z.infer<typeof categoryIdSchema>;
export type UpdateCategorySchemaType = z.infer<typeof updateCategorySchema>;
