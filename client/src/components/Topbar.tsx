import React from 'react';

interface TopbarProps {
    leftIcon?: string;
    leftOnClick?: () => void;
    title?: string;
    rightIcon?: string;
    rightText?: string;
    rightOnClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({
    leftIcon,
    leftOnClick,
    title,
    rightIcon,
    rightText,
    rightOnClick,
}) => {
    return (
        <div className={`flex items-center justify-between`}>
            {/* left */}
            <button
                onClick={leftOnClick}
                className="p-2 hover:bg-gray-100 rounded-full"
            >
                {leftIcon && (
                    <img
                        src={leftIcon}
                        className="w-6 h-6 rounded-full"
                        alt="Navigation icon"
                    />
                )}
            </button>

            {/* mid */}
            {title && <h1 className="text-lg font-medium">{title}</h1>}

            {/* right */}
            <div>
                {rightText ? (
                    <button
                        onClick={rightOnClick}
                        className="text-green-600 hover:text-green-700 font-medium"
                    >
                        {rightText}
                    </button>
                ) : (
                        rightIcon ? (
                            <button
                                onClick={rightOnClick}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <img
                                    src={rightIcon}
                                    className="w-6 h-6 rounded-full"
                                    alt="Action icon"
                                />
                            </button>
                        ) : (
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <div className="w-6 h-6 rounded-full"></div>
                            </button>
                        )
                )}
            </div>
        </div>
    );
};

export default Topbar;