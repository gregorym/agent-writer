import { PlusCircle, Trash2 } from "lucide-react";
import {
  ArrayPath, // Import ArrayPath
  Control,
  FieldArrayWithId,
  FieldValues,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import { z } from "zod";
import { Button } from "./ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

// Define the schema for a single backlink item, matching the one in CreateArticleForm
const backlinkSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
  title: z.string().min(1, { message: "Title cannot be empty." }),
});

// Define the schema for the form data containing backlinks
// This schema is only used internally for type inference within this component if needed,
// but the props will accept a more general Control type.
const internalFormSchema = z.object({
  backlinks: z.array(backlinkSchema).optional(),
});

// Define the props for the BacklinksInput component using generic FieldValues and ArrayPath types
interface BacklinksInputProps<
  TFieldValues extends FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>, // Add generic for name
> {
  name: TName; // Add name prop
  control: Control<TFieldValues>; // Accept a generic Control type
  fields: FieldArrayWithId<TFieldValues, TName, "id">[]; // Use TName
  append: UseFieldArrayAppend<TFieldValues, TName>; // Use TName
  remove: UseFieldArrayRemove;
  disabled?: boolean;
}

// Use generic types for the component function as well
export function BacklinksInput<
  TFieldValues extends FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>, // Add generic for name
>({
  name, // Destructure name
  control,
  fields,
  append,
  remove,
  disabled,
}: BacklinksInputProps<TFieldValues, TName>) {
  return (
    <div>
      <FormLabel>Backlinks (Optional)</FormLabel>
      <div className="space-y-2 mt-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end space-x-2">
            <FormField
              control={control}
              // Use type assertion to satisfy Path<TFieldValues>
              name={`${name}.${index}.url` as any}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              // Use type assertion to satisfy Path<TFieldValues>
              name={`${name}.${index}.title` as any}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Link Title"
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="text-destructive hover:text-destructive"
              aria-label="Remove backlink"
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ url: "", title: "" } as any)} // Use type assertion for append
        className="mt-2"
        disabled={disabled}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Backlink
      </Button>
    </div>
  );
}
