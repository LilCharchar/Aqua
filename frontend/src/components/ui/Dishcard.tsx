import React from 'react'

interface DishCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    name: string;
    precio: number;
    imageURL?: string;
    disponible: boolean;
    cantidadPreparable?: number;
    hasIngredients?: boolean;
}

const DishCard: React.FC<DishCardProps> = ({
    name,
    precio,
    disponible,
    imageURL,
    cantidadPreparable = 0,
    hasIngredients = false,
    className = "",
    ...props
}) => {

    const baseClasses = `
        relative 
        flex flex-col items-center 
        p-4 
        bg-[var(--secondary-accent)] 
        rounded-3xl
        shadow-lg
        transition-all duration-200 ease-in-out 
        text-[var(--text-primary)]
        h-full w-[266px] 
    `;
    const disabledClasses = disponible
        ? `
            hover:scale-[1.03] 
            active:scale-[1] 
        `
        : `
            opacity-70 
            transform scale-95
            cursor-pointer
        `;

    const disponibilidadTexto = disponible
        ? `${cantidadPreparable} platos disponibles`
        : (cantidadPreparable === 0 && hasIngredients ? `0 platos disponibles` : `Faltan ingredientes`);

    return (
        <button
            className={`${baseClasses} ${disabledClasses} ${className}`}
            {...props}
        >
            {/*Imagen plato*/}
            <div className="w-24 h-24 sm:w-32 sm:h-32 -mt-16 mb-2 rounded-full overflow-hidden shadow-xl z-10">

                <img src={imageURL}
                    alt={name}
                    className={"object-cover object-center w-full h-full"}
                    loading="lazy"
                />
            </div>
            {/* Contenido de la Card */}
            <div className="flex flex-col items-center text-center mt-4">
                {/* Nombre del Plato */}
                <h3 className="text-lg sm:text-lg font-bold leading-tight">
                    {name}
                </h3>

                {/* Precio */}
                <p className="text-s sm:text-s font-medium text-[var(--text-primary)] mb-2">
                    ${precio}
                </p>

                {/* Disponibilidad */}
                <p className={`text-sm mt-1 font-light mb-1 ${disponible ? 'text-[var(--text-secondary)]' : 'text-[var(--warning)]'}`}>
                    {disponibilidadTexto}
                </p>
            </div>
        </button>
    )
}

export default DishCard