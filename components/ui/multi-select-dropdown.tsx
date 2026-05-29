"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  className?: string;
  labelPrefix?: string;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder,
  className,
  labelPrefix,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    return options.filter(option =>
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const displayText = React.useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return `All ${labelPrefix || "Items"}`;
    if (selectedValues.length <= 2) {
      return selectedValues.join(", ");
    }
    return `${selectedValues.length} Selected`;
  }, [selectedValues, options, placeholder, labelPrefix]);

  return (
    <div className={cn("relative w-full xl:w-48", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3 flex items-center justify-between text-left text-sm rounded-md border border-border bg-background hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
          isOpen && "ring-1 ring-ring border-ring"
        )}
      >
        <span className="truncate text-foreground max-w-[85%]">
          {displayText}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg backdrop-blur-md bg-opacity-95 p-2 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[300px] flex flex-col min-w-[200px]">
          {/* Search Box */}
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 w-full bg-background border-border text-xs focus-visible:ring-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between items-center px-1 mb-2 text-2xs border-b border-border pb-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto space-y-1 max-h-[180px] pr-1">
            {filteredOptions.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                No items found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isChecked = selectedValues.includes(option);
                return (
                  <div
                    key={option}
                    onClick={() => handleToggle(option)}
                    className="flex items-center space-x-2 rounded-lg px-2 py-1.5 hover:bg-muted/70 transition-colors cursor-pointer text-xs"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => {}} // Controlled via container click
                      className="pointer-events-none"
                    />
                    <span className="text-foreground truncate select-none flex-1">
                      {option}
                    </span>
                    {isChecked && <Check className="h-3 w-3 text-primary shrink-0 ml-auto" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
