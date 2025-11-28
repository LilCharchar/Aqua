import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

function Button(props: ButtonProps) {
    const { className, children, ...rest } = props;
    
    const baseClasses = "flex items-center justify-center shadow-2xl bg-[var(--primary)] w-[256px] h-[40px] text-[var(--options)] text-sm rounded-lg  cursor-pointer manrope-regular transition duration-150 ease-in-out hover:shadow-inner hover:shadow-black/20 hover:scale-[0.99] active:scale-[0.98]";
    const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;
    return(
        <button className={finalClasses} {...rest}>
            {children}
        </button>
    );
}

export default Button;