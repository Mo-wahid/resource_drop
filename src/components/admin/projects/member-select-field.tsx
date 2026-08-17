"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type EligibleMember = {
  id: string;
  username: string;
  email: string;
};

export function MemberSelectField({
  eligibleMembers,
  selectedIds,
  onChange,
}: {
  eligibleMembers: EligibleMember[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggleMember = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    onChange(newSelected);
  };

  return (
    <div className="flex items-center gap-3">
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger 
          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
          role="combobox"
          aria-expanded={open}
        >
          <span className="flex items-center truncate">
            <Users className="mr-2 size-4 text-muted-foreground shrink-0" />
            {selectedIds.length > 0
              ? `${selectedIds.length} member${selectedIds.length === 1 ? '' : 's'} selected`
              : "Select members..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search members..." />
            <CommandList className="max-h-60 overflow-y-auto">
              <CommandEmpty>No members found.</CommandEmpty>
              <CommandGroup>
                {eligibleMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <CommandItem
                      key={member.id}
                      value={`${member.username} ${member.email}`}
                      onSelect={() => toggleMember(member.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <div className="flex flex-col">
                        <span>{member.username}</span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
