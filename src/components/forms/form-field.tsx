"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input, type InputProps } from "@/components/ui/input";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FormFieldProps {
  /** Field name for form registration */
  name: string;
  /** Label text */
  label: string;
  /** Error message from form validation */
  error?: string;
  /** Helper text below the field */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Additional class name */
  className?: string;
  /** Children (custom input) */
  children?: React.ReactNode;
}

/**
 * Form Field wrapper with consistent label and error handling
 */
export function FormField({
  name,
  label,
  error,
  helperText,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}

/**
 * Form Input Field - combines FormField with Input
 */
export interface FormInputProps extends Omit<InputProps, "error"> {
  /** Field name */
  name: string;
  /** Label text */
  label: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether required */
  required?: boolean;
  /** Container class */
  containerClassName?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      name,
      label,
      error,
      helperText,
      required,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <FormField
        name={name}
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        className={containerClassName}
      >
        <Input
          ref={ref}
          id={name}
          name={name}
          error={error}
          className={className}
          {...props}
        />
      </FormField>
    );
  }
);
FormInput.displayName = "FormInput";

/**
 * Form Textarea Field
 */
export interface FormTextareaProps extends Omit<TextareaProps, "error"> {
  name: string;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(
  (
    {
      name,
      label,
      error,
      helperText,
      required,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <FormField
        name={name}
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        className={containerClassName}
      >
        <Textarea
          ref={ref}
          id={name}
          name={name}
          error={error}
          className={className}
          {...props}
        />
      </FormField>
    );
  }
);
FormTextarea.displayName = "FormTextarea";

/**
 * Form Select Field
 */
export interface FormSelectProps {
  name: string;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function FormSelect({
  name,
  label,
  error,
  helperText,
  required,
  containerClassName,
  placeholder = "Select...",
  options,
  value,
  onValueChange,
  disabled,
}: FormSelectProps) {
  return (
    <FormField
      name={name}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      className={containerClassName}
    >
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={name} error={!!error}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
