import { Search } from "lucide-react";
import React from "react";



type SearchBarProps = React.InputHTMLAttributes<HTMLInputElement>;

function SearchBar(props: SearchBarProps) {
  const { className, ...rest } = props;

  const baseClasses =
    "flex items-center p-4 shadow-2xl bg-[var(--options)] w-full h-[20px] sm:h-[20px] placeholder:[var(--text-primary)] text-sm rounded-lg manrope-regular border border-[var(--text-primary)]";
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;
  return(
    <div className={finalClasses}>
        <Search className="w-h h-4 text-[var(--text-primary)]"/>
        <input {...rest}
            className="bg-transparent flex-1 outline-none placeholder:text-[var(--text-primary)]"
            type="text"
        />
    </div>
  );
}

export default SearchBar;