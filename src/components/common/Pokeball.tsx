import clsx from 'clsx';

interface PokeballProps {
    size: string;
    fainted?: boolean;
    transparent?: boolean;
    orientation?: string;
    animation?: string;
    direction?: string;
    position?: 'absolute' | 'relative';
}

const pokeballSizeStyles: Record<string, string> = {
    tiny: 'w-6 h-6',
    small: 'w-20 h-20',
    medium: 'w-36 h-36',
    large: 'w-72 h-72' 
};

const centerballSizeStyles: Record<string, string> = {
    tiny: 'w-3.5 h-3.5',
    small: 'w-5 h-5',
    medium: 'w-10 h-10',
    large: 'w-15 h-15'
};

export function Pokeball({ 
    size = 'large', 
    fainted = false, 
    transparent = false, 
    orientation, 
    animation, 
    direction = 'normal',
    position = 'absolute'
}: PokeballProps) {
    return (
        <div className={clsx(
                'pointer-events-none',
                pokeballSizeStyles[size],
                fainted && 'grayscale',
                transparent && 'opacity-10',
                orientation,
                animation,
                position
            )}
            style={{ animationDirection: direction }}
        >
            <div className='absolute w-full h-1/2 bg-primary-red rounded-t-full top-0' />
            <div className='absolute w-full h-1/2 bg-slate-100 rounded-b-full bottom-0' />
            <div className='absolute w-full h-1 md:h-1.5 bg-gray-800 top-1/2 -translate-y-1/2' />
            <div className={clsx(
                'absolute bg-slate-100 border-2 md:border-4 border-gray-800 rounded-full top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2',
                centerballSizeStyles[size]
            )}/>
        </div>
    );
}