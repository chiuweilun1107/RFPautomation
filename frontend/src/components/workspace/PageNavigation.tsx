import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PageNavigationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function PageNavigation({ currentPage, totalPages, onPageChange }: PageNavigationProps) {
    const [inputValue, setInputValue] = useState(String(currentPage));

    useEffect(() => {
        setInputValue(String(currentPage));
    }, [currentPage]);

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
    };

    const handleInputBlur = () => {
        const pageNum = parseInt(inputValue);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            onPageChange(pageNum);
        } else {
            setInputValue(String(currentPage));
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        }
    };

    const handleSelectChange = (value: string) => {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum)) {
            onPageChange(pageNum);
        }
    };

    return (
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3 mb-3 font-mono select-none">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-none border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-30"
                    onClick={handlePrevious}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-none border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-30"
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                >
                    <ChevronRight className="w-3 h-3" />
                </Button>
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
                <span className="text-gray-500">PAGE</span>
                <Input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="h-7 w-12 text-center text-[10px] px-1 rounded-none border-black dark:border-white uppercase font-bold"
                />
                <span className="text-gray-500">OF {totalPages}</span>
            </div>

            <div className="w-24">
                <Select value={String(currentPage)} onValueChange={handleSelectChange}>
                    <SelectTrigger className="h-7 text-[10px] rounded-none border-black dark:border-white uppercase tracking-wider font-bold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="rounded-none border-black dark:border-white font-mono !z-[99999] !max-h-[260px] overflow-y-auto">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <SelectItem
                                key={page}
                                value={String(page)}
                                className="text-[10px] uppercase tracking-wider rounded-none focus:bg-black focus:text-white dark:focus:bg-white dark:focus:text-black"
                            >
                                PAGE {page}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
