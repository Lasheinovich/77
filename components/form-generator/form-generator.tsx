"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export type FormField = {
  id: string
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "switch"
    | "slider"
    | "date"
    | "file"
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  step?: number
  multiple?: boolean
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    custom?: string
  }
}

export type FormConfig = {
  id: string
  title: string
  description?: string
  fields: FormField[]
  submitText?: string
  cancelText?: string
  successMessage?: string
  onSubmit?: (data: any) => void | Promise<void>
  onCancel?: () => void
  className?: string
}

export function FormGenerator({
  id,
  title,
  description,
  fields,
  submitText = "Submit",
  cancelText = "Cancel",
  successMessage = "Form submitted successfully!",
  onSubmit,
  onCancel,
  className,
}: FormConfig) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [schema, setSchema] = useState<z.ZodObject<any> | null>(null)

  // Generate Zod schema from fields
  useEffect(() => {
    const schemaFields: Record<string, any> = {}

    fields.forEach((field) => {
      let fieldSchema: any = z.any()

      // Base type validation
      switch (field.type) {
        case "text":
          fieldSchema = z.string()
          break
        case "email":
          fieldSchema = z.string().email()
          break
        case "password":
          fieldSchema = z.string()
          break
        case "number":
          fieldSchema = z.number()
          break
        case "textarea":
          fieldSchema = z.string()
          break
        case "select":
          fieldSchema = z.string()
          break
        case "checkbox":
          fieldSchema = z.boolean()
          break
        case "radio":
          fieldSchema = z.string()
          break
        case "switch":
          fieldSchema = z.boolean()
          break
        case "slider":
          fieldSchema = z.number()
          break
        case "date":
          fieldSchema = z.string()
          break
        case "file":
          fieldSchema = z.instanceof(FileList)
          break
        default:
          fieldSchema = z.any()
      }

      // Additional validation
      if (field.validation) {
        if (field.type === "text" || field.type === "email" || field.type === "password" || field.type === "textarea") {
          if (field.validation.minLength) {
            fieldSchema = fieldSchema.min(field.validation.minLength, {
              message: `Must be at least ${field.validation.minLength} characters`,
            })
          }
          if (field.validation.maxLength) {
            fieldSchema = fieldSchema.max(field.validation.maxLength, {
              message: `Must be at most ${field.validation.maxLength} characters`,
            })
          }
          if (field.validation.pattern) {
            fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern), {
              message: "Invalid format",
            })
          }
        }

        if (field.type === "number" || field.type === "slider") {
          if (field.validation.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation.min, {
              message: `Must be at least ${field.validation.min}`,
            })
          }
          if (field.validation.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation.max, {
              message: `Must be at most ${field.validation.max}`,
            })
          }
        }
      }

      // Required fields
      if (field.required) {
        fieldSchema = fieldSchema.refine(
          (val: any) => {
            if (field.type === "file") {
              return val && val.length > 0
            }
            return val !== undefined && val !== null && val !== ""
          },
          {
            message: "This field is required",
          },
        )
      } else {
        fieldSchema = fieldSchema.optional()
      }

      schemaFields[field.id] = fieldSchema
    })

    setSchema(z.object(schemaFields))
  }, [fields])

  // Create form with react-hook-form
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: fields.reduce(
      (acc, field) => {
        acc[field.id] =
          field.defaultValue !== undefined
            ? field.defaultValue
            : field.type === "checkbox" || field.type === "switch"
              ? false
              : field.type === "slider"
                ? field.min || 0
                : ""
        return acc
      },
      {} as Record<string, any>,
    ),
  })

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit(data)
      }

      toast({
        title: "Success",
        description: successMessage,
      })

      // Reset form if submission was successful
      form.reset()
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: "There was an error submitting the form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render form fields based on type
  const renderField = (field: FormField) => {
    const {
      register,
      formState: { errors },
      control,
      setValue,
      watch,
    } = form

    switch (field.type) {
      case "text":
      case "email":
      case "password":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              {...register(field.id)}
              aria-invalid={!!errors[field.id]}
            />
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              {...register(field.id)}
              aria-invalid={!!errors[field.id]}
            />
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      case "select":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select onValueChange={(value) => setValue(field.id, value)} defaultValue={field.defaultValue}>
              <SelectTrigger id={field.id} aria-invalid={!!errors[field.id]}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      case "checkbox":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={watch(field.id)}
                onCheckedChange={(checked) => setValue(field.id, checked)}
                aria-invalid={!!errors[field.id]}
              />
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      case "radio":
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              defaultValue={field.defaultValue}
              onValueChange={(value) => setValue(field.id, value)}
              aria-invalid={!!errors[field.id]}
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      case "switch":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id={field.id}
                checked={watch(field.id)}
                onCheckedChange={(checked) => setValue(field.id, checked)}
                aria-invalid={!!errors[field.id]}
              />
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      case "slider":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <span className="text-sm">{watch(field.id)}</span>
            </div>
            <Slider
              id={field.id}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              defaultValue={[field.defaultValue || field.min || 0]}
              onValueChange={(value) => setValue(field.id, value[0])}
              aria-invalid={!!errors[field.id]}
            />
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      case "date":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input id={field.id} type="date" {...register(field.id)} aria-invalid={!!errors[field.id]} />
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      case "file":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="file"
              multiple={field.multiple}
              {...register(field.id)}
              aria-invalid={!!errors[field.id]}
            />
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {errors[field.id] && <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form id={id} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {fields.map((field) => (
            <div key={field.id}>{renderField(field)}</div>
          ))}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {cancelText}
          </Button>
        )}
        <Button type="submit" form={id} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : submitText}
        </Button>
      </CardFooter>
    </Card>
  )
}
