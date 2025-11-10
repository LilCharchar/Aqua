import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

function Input(props: InputProps) {
  const { className, ...rest } = props;

  const baseClasses =
    "flex items-center pl-5 shadow-2xl bg-[var(--options)] w-full max-w-[393px] h-[45px] sm:h-[55px] placeholder:[var(--text-primary)] text-sm rounded-lg manrope-regular";
  const finalClasses = className ? `${baseClasses} ${className}` : baseClasses;
  return <input className={finalClasses} {...rest} />;
}

export default Input;
