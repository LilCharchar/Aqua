import React from "react";

 interface LogoProps {
     size?: number;
     color?: string;
     className?: string;
 }

 const Logo: React.FC<LogoProps> = ({
     size = 32,
     color = "var(--text-primary)",
    className = ""
    }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={className}
            fill={color}
        >
                <path
                    fill={color}
                    fillOpacity={1}
                    d="M415 2.17749C591.5 -16.8641 918.5 94.6772 992 115.177C1065.5 135.678 1206 250.93 1386 283.177C1408.57 287.222 1439.86 304.992 1440 305.07V596.678H1.43051e-06C1.43051e-06 596.678 -1.43051e-06 159.178 1.43051e-06 135.677C4.29153e-06 112.177 238.5 21.2191 415 2.17749Z"
                    ></path>
        </svg>
    );
    export default Logo;