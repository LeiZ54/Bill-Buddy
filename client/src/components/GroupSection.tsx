import { motion } from 'framer-motion';
import { Avatar, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { GroupData } from '../util/util';
import { useGroupStore } from '../stores/groupStore';

const { Text } = Typography;

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const GroupSection = ({ id, name, type, items, netBalance }: GroupData) => {
    const navigate = useNavigate();
    const { getUrlByType, setActiveGroup, resetError } = useGroupStore();
    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex justify-between items-start p-4 mb-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
                setActiveGroup({ id, name, type, items, netBalance });
                navigate('detail');
                resetError();
            }}
        >
            {/* left */}
            <Avatar
                src={getUrlByType(type)}
                size={40}
                className="flex-shrink-0 mr-4"
            />

            {/* mid */}
            <div className="flex-1 min-w-0">
                <Text strong className="text-lg block mb-2 truncate">{name}</Text>

                <motion.div
                    className="space-y-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    {items.map((item) => (
                        <motion.div
                            key={`${item.person}-${item.type}`}
                            variants={itemVariants}
                            className="relative pl-6"
                        >
                            <div className="absolute left-0 top-2 w-4 h-px bg-gray-200" />
                            <div className="absolute left-0 -top-3 w-px h-6 bg-gray-200" />

                            <Text className="text-sm">
                                {item.type === 'get'
                                    ? `${item.person} owes you `
                                    : `You owe ${item.person} `}
                                <Text
                                    type={item.type === 'get' ? 'success' : 'warning'}
                                    strong
                                >
                                    ${item.amount.toFixed(2)}
                                </Text>
                            </Text>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* right */}
            <div className="flex-shrink-0 ml-4 text-right">
                <Text type="secondary" className="text-xs">
                    {netBalance >= 0 ? 'You are owed' : 'You owe'}
                </Text>
                <Text
                    type={netBalance >= 0 ? 'success' : 'warning'}
                    strong
                    className="text-lg block"
                >
                    ${Math.abs(netBalance).toFixed(2)}
                </Text>
            </div>
        </motion.section>
    );
};

export default GroupSection;