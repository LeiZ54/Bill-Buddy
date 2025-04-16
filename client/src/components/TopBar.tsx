import { motion } from 'framer-motion';
import { Button } from 'antd';
import { LeftOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import {ReactNode} from "react";

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
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`relative flex items-center justify-between h-12 ${className}`}
        >
            {/* left */}
            <div className="flex">
                {leftType && (
                    <motion.div whileHover={{ scale: 1.05 }}>
                        <Button
                            type="text"
                            onClick={leftOnClick}
                            shape="circle"
                            className="flex items-center justify-center w-8 h-8"
                            icon={
                                leftType === 'back' ? (
                                    <LeftOutlined className="text-lg" />
                                ) : (
                                    <SearchOutlined className="text-lg" />
                                )
                            }
                        />
                    </motion.div>
                )}
            </div>

            {/* mid */}
            {title && (
                <motion.div
                    key={title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-gray-800 truncate max-w-[70%]"
                >
                    {title}
                </motion.div>
            )}

            {/* right */}
            <div className="flex">
                {(rightText || rightOnClick) && (
                    <motion.div whileHover={{ scale: 1.05 }}>
                        {rightText ? (
                            <Button
                                type="link"
                                onClick={rightOnClick}
                                className="font-medium"
                            >
                                <div className="text-blue-500">{rightText}</div>
                            </Button>
                        ) : (
                            <Button
                                type="text"
                                onClick={rightOnClick}
                                shape="circle"
                                className="flex items-center justify-center w-8 h-8"
                                icon={<SettingOutlined className="text-lg" />}
                            />
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};
export default Topbar;