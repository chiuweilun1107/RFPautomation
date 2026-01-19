import React from 'react'
import { cn } from '@/lib/utils'

interface ImageFormat {
    width?: number
    height?: number
    alignment?: 'left' | 'center' | 'right'
}

interface ImageData {
    url: string
    width?: number
    height?: number
    index: number
    format?: ImageFormat
}

interface EditableImageProps {
    image: ImageData
    isSelected: boolean
    onClick: () => void
    onEdit?: (data: ImageData) => void
    className?: string
}

export const EditableImage: React.FC<EditableImageProps> = ({
    image,
    isSelected,
    onClick,
    onEdit,
    className
}) => {
    return (
        <div
            className={cn(
                "relative group transition-all duration-200 cursor-pointer border border-transparent",
                isSelected ? "ring-1 ring-[#FA4028]" : "hover:bg-gray-50/30",
                className
            )}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
        >
            <div
                className={cn(
                    "w-full flex",
                    image.format?.alignment === 'center' ? 'justify-center' :
                        image.format?.alignment === 'right' ? 'justify-end' : 'justify-start'
                )}
            >
                <img
                    src={image.url}
                    alt={`Parsed Image ${image.index}`}
                    className="h-auto shrink-0 max-w-none"
                    style={{
                        width: image.width ? `${image.width}pt` : 'auto',
                    }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                    }}
                />
            </div>

            {isSelected && (
                <div className="absolute top-2 right-2 flex gap-1">
                    <div className="bg-[#FA4028] text-white text-[10px] px-2 py-0.5 rounded shadow font-semibold">
                        圖片
                    </div>
                </div>
            )}
        </div>
    )
}
