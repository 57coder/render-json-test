import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const catalog = defineCatalog(schema, {
  components: {
    Form: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
      description: "A form container",
    },
    Input: {
      props: z.object({
        label: z.string(),
        name: z.string(),
        type: z.enum(["text", "email", "password", "number"]).default("text"),
        placeholder: z.string().optional(),
      }),
      description: "Text input field",
    },
    Select: {
      props: z.object({
        label: z.string(),
        name: z.string(),
        options: z.array(z.object({ label: z.string(), value: z.string() })),
      }),
      description: "Select dropdown",
    },
    Button: {
      props: z.object({
        label: z.string(),
        action: z.string(),
        variant: z.enum(["primary", "secondary"]).default("primary"),
      }),
      description: "Action button",
    },
  },
  actions: {
    submit: { description: "Submit the form" },
  },
});
