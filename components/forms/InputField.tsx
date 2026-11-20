import React from 'react'
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";

const InputField = ({ name, label, placeholder, type = "text", register, error, validation, disabled, value }: FormInputProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="text-[#A1A1AA] text-sm font-medium">
                {label}
            </Label>
            <Input
                type={type}
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                value={value}
                className={cn(
                    'h-11 px-3 py-3 text-white text-sm bg-[#0A0A0A] border border-[#27272A] placeholder:text-[#71717A] focus:border-[#3F3F46] focus:ring-0 rounded-lg transition-colors duration-200',
                    { 'opacity-50 cursor-not-allowed': disabled }
                )}
                {...register(name, validation)}
            />
            {error && <p className="text-sm text-red-500">{error.message}</p>}
        </div>
    )
}
export default InputField
