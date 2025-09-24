"use client";

import { Controller, Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ConsentCheckboxProps<T> = {
  control: Control<T>;
  name?: any; // keep flexible across forms; default used
  label?: string;
  className?: string;
};

export default function ConsentCheckbox<T>({ control, name, label, className }: ConsentCheckboxProps<T>) {
  const fieldName = (name as any) || ("mediaConsent" as any);
  const text =
    label ||
    "I have consent from depicted persons and hold rights to any audio/music used.";
  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field }) => (
        <div className={`rounded-md border bg-muted p-3 ${className || ""}`}>
          <div className="flex items-start gap-2">
            <Checkbox
              id="mediaConsent"
              checked={!!field.value}
              onCheckedChange={(checked) => field.onChange(!!checked)}
            />
            <Label htmlFor="mediaConsent" className="text-sm font-normal leading-5">
              {text}
            </Label>
          </div>
        </div>
      )}
    />
  );
}


