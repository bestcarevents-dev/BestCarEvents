import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TagInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  helperText?: string;
}

export default function TagInput({ value, onChange, placeholder, disabled, helperText }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const tags: string[] = useMemo(() => {
    if (!value) return [];
    // Accept comma or newline separated string
    return value
      .split(/[\n,]+/)
      .map(t => t.trim())
      .filter(Boolean);
  }, [value]);

  const emit = (nextTags: string[]) => {
    // Join as comma+space for readability; keeps Firestore schema as string
    onChange?.(nextTags.join(", "));
  };

  const addTag = (raw: string) => {
    const parts = raw
      .split(/[\n,]+/)
      .map(t => t.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...tags, ...parts]));
    emit(next);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    emit(tags.filter(t => t !== tag));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm border border-gray-200">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-gray-500 hover:text-red-600"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(inputValue);
          }
        }}
        onBlur={() => addTag(inputValue)}
        placeholder={placeholder || "Type and press Enter"}
        disabled={disabled}
        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
      />
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
} 