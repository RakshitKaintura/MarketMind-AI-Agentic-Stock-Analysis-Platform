import {Label} from "@/components/ui/label";
import {Controller} from "react-hook-form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const SelectField = ({ name, label, placeholder, options, control, error, required = false }: SelectFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="text-[#A1A1AA] text-sm font-medium">{label}</Label>

            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `Please select ${label.toLowerCase()}` : false,
                }}
                render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-11 px-3 py-3 text-sm border border-[#27272A] bg-[#0A0A0A] text-white rounded-lg focus:border-[#3F3F46] focus:ring-0">
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111111] border border-[#27272A] text-white rounded-lg">
                            {options.map((option) => (
                                <SelectItem value={option.value} key={option.value} className="text-[#A1A1AA] hover:text-white focus:bg-[#161616] focus:text-white cursor-pointer">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        {error && <p className="text-sm text-red-500">{error.message}</p>}
                    </Select>
                )}
            />
        </div>
    )
}
export default SelectField