import { motion, AnimatePresence } from 'framer-motion';
import { LeftOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { ReactNode, useState } from "react";

interface TopbarProps {
    leftType?: 'back' | 'search';
    leftOnClick?: () => void;
    title?: ReactNode;
    rightText?: string;
    rightOnClick?: () => void;
    className?: string;
}

const Topbar = ({
    leftType,
    leftOnClick,
    title,
    rightText,
    rightOnClick,
    className = "",
}: TopbarProps) => {
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const handleSearchClick = () => {
        if (leftType === 'search') {
            setShowSearchInput(true);
        }
        leftOnClick?.();
    };

    const handleBackClick = () => {
        if (showSearchInput) {
            setShowSearchInput(false);
            setSearchValue("");
        } else {
            leftOnClick?.();
        }
    };

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative flex items-center justify-between h-12 px-1 overflow-hidden"
        >
            {/* left */}
            <div className="flex z-10">
                <motion.div whileHover={{ scale: 1.05 }}>
                    <div
                        onClick={showSearchInput ? handleBackClick : handleSearchClick}
                        className="flex items-center justify-center w-8 h-8 cursor-pointer"
                    >
                        {showSearchInput ? (
                            <LeftOutlined className={`text-3xl ${className}`} />
                        ) : (
                            leftType === 'back' ? (
                                <LeftOutlined className={`text-3xl ${className}`} />
                            ) : (
                                <SearchOutlined className={`text-3xl ${className}`} />
                            )
                        )}
                    </div>
                </motion.div>
            </div>

            {/* mid */}
            <div className="absolute left-0 right-0 flex justify-center items-center h-full">
                <AnimatePresence mode="wait">
                    {showSearchInput ? (
                        <motion.input
                            key="searchInput"
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "80%", opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            autoFocus
                            placeholder="search..."
                            className="h-8 px-3 py-1 rounded-md border border-gray-300 text-base outline-none"
                        />
                    ) : (
                        title && (
                            <motion.div
                                key="title"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-lg font-semibold text-gray-800 truncate max-w-[70%]"
                            >
                                {title}
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </div>

            {/* right */}
            {!showSearchInput && (
                <div className="flex z-10">
                    {(rightText || rightOnClick) && (
                        <motion.div whileHover={{ scale: 1.05 }}>
                            {rightText ? (
                                <div
                                    onClick={rightOnClick}
                                    className="font-medium"
                                >
                                    <div className="text-blue-500 text-lg">{rightText}</div>
                                </div>
                            ) : (
                                <div
                                    onClick={rightOnClick}
                                    className="flex items-center justify-center w-12 h-12 cursor-pointer"
                                >
                                    <SettingOutlined className={`text-3xl ${className}`} />
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default Topbar;
