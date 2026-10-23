'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
    value?: number[]
    defaultValue?: number[]
    onValueChange?: (value: number[]) => void
    min?: number
    max?: number
    step?: number
    className?: string
}

export function Slider({
    className,
    value,
    defaultValue,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    disabled,
    ...props
}: SliderProps) {
    const currentValue = value ? value[0] : (defaultValue ? defaultValue[0] : min)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = parseFloat(e.target.value)
        if (!isNaN(num)) {
            onValueChange?.([num])
        }
    }

    const percentage = max > min ? Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100)) : 0

    return (
        <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
            <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-200">
                <div
                    className="absolute h-full bg-blue-600 transition-all rounded-full"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={currentValue}
                onChange={handleChange}
                disabled={disabled}
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                {...props}
            />
            <div
                className="pointer-events-none absolute h-3.5 w-3.5 rounded-full border border-slate-300 bg-white shadow-sm transition-transform -translate-x-1/2"
                style={{ left: `${percentage}%` }}
            />
        </div>
    )
}
