import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HomeFilled, TeamOutlined, HistoryOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { Layout } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Content, Footer } = Layout;

const navItems = [
    { key: 'friends', path: 'friends', icon: <TeamOutlined />, label: 'Friends' },
    { key: 'groups', path: 'groups', icon: <HomeFilled />, label: 'Groups' },
    { key: 'add', path: 'add', icon: <PlusOutlined />, special: true },
    { key: 'history', path: 'history', icon: <HistoryOutlined />, label: 'History' },
    { key: 'account', path: 'account', icon: <UserOutlined />, label: 'Account' }
];

const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1],
            when: "beforeChildren",
            staggerChildren: 0.1
        }
    }
};

const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [indicatorWidth, setIndicatorWidth] = useState(0);
    const [indicatorLeft, setIndicatorLeft] = useState(0);
    const [lastGroupsPath, setLastGroupsPath] = useState('/groups');


    const getActiveIndex = () => {
        const currentPath = location.pathname;
        const exactMatchIndex = navItems.findIndex(item =>
            currentPath === `/${item.path}`
        );
        if (exactMatchIndex !== -1) return exactMatchIndex;
        const parentMatchIndex = navItems.findIndex(item =>
            currentPath.startsWith(`/${item.path}/`)
        );
        return parentMatchIndex !== -1 ? parentMatchIndex : 0;
    };

    useEffect(() => {
        const activeIndex = getActiveIndex();
        const itemWidth = 100 / navItems.length;
        setIndicatorLeft(itemWidth * activeIndex);
        setIndicatorWidth(itemWidth);
        if (location.pathname.startsWith('/groups')) {
            setLastGroupsPath(location.pathname);
        }
    }, [location]);

    const handleTabClick = (path: string, index: number) => {
        if (path === 'groups') {
            navigate(lastGroupsPath);
        } else {
            navigate(path);
        }
        const itemWidth = 100 / navItems.length;
        setIndicatorLeft(itemWidth * index);
        setIndicatorWidth(itemWidth);
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={pageVariants}
            className="h-screen flex flex-col"
        >
            <Layout className="flex-1 flex flex-col">
                <Content className="bg-white flex-1 overflow-y-auto">
                    <motion.div
                        variants={contentVariants}
                        className="p-4  min-h-full"
                    >
                        <Outlet />
                    </motion.div>
                </Content>

                <Footer className="h-16 p-0 bg-white border-t border-gray-200 overflow-hidden fixed bottom-0 w-full z-50">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative flex h-full"
                    >
                        {navItems.map((item, index) => {
                            const isActive = getActiveIndex() === index;
                            const isSpecial = item.special;

                            return (
                                <div
                                    key={item.key}
                                    className="flex-1 flex flex-col items-center justify-center cursor-pointer"
                                    onClick={() => handleTabClick(item.path, index)}
                                >
                                    <motion.div
                                        className={
                                            isSpecial
                                                ? "w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white"
                                                : "text-xl"
                                        }
                                        animate={{
                                            scale: isActive ? 1.2 : 1,
                                            color: !isSpecial ? (isActive ? '#3B82F6' : '#6B7280') : undefined
                                        }}
                                        transition={{ scale: { duration: 0.2 }, color: { duration: 0.3 } }}
                                    >
                                        {item.icon}
                                    </motion.div>
                                    {!isSpecial && (
                                        <span className={`text-xs mt-1 ${isActive ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>
                                            {item.label}
                                        </span>
                                    )}
                                </div>
                            );
                        })}

                        <motion.div
                            className="absolute top-0 h-1 bg-blue-500"
                            style={{
                                width: `${indicatorWidth}%`,
                                left: `${indicatorLeft}%`
                            }}
                            initial={false}
                            animate={{
                                width: `${indicatorWidth}%`,
                                left: `${indicatorLeft}%`
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 15,
                                delay: 0.1
                            }}
                        />
                    </motion.div>
                </Footer>
            </Layout>
        </motion.div>
    );
}