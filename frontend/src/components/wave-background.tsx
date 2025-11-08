import React from "react";

interface WaveBackgroundProps {
    color?: string;
    position?: "top" | "bottom";
    flip?: boolean;
    className?: string;
}

const WaveBackground: React.FC<WaveBackgroundProps> = ({
    color = "var(--primary)",
    position = "bottom",
    flip = false,
    className = "",
}) => {
    return (
        <div
            className={`fixed ${position}-0 left-0 w-full overflow-hidden leading-none pointer-events-none z-[-1] ${className}`}
            style={{ bottom: '-1px'}}
        >
            <svg
                viewBox="0 0 1440 462"
                xmlns="http://www.w3.org/2000/svg"
                className={`w-full h-[50vh] sm:h-[55vh] md:h-[60vh] ${flip ? "rotate-180" : ""}`}
                preserveAspectRatio="none"
            >
                <path
                    fill={color}
                    fillOpacity={1}
                    d="M415 2.17749C591.5 -16.8641 918.5 94.6772 992 115.177C1065.5 135.678 1206 250.93 1386 283.177C1408.57 287.222 1439.86 304.992 1440 305.07V596.678H1.43051e-06C1.43051e-06 596.678 -1.43051e-06 159.178 1.43051e-06 135.677C4.29153e-06 112.177 238.5 21.2191 415 2.17749Z"
                    ></path>
            </svg>
        </div>
    );
};

export default WaveBackground;