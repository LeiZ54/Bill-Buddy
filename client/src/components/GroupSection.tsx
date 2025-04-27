import { motion } from 'framer-motion';
import {  Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { GroupData } from '../util/util';
import useAuthStore from '../stores/authStore';
import { useGroupDetailStore } from '../stores/groupDetailStore';

const { Text } = Typography;


const GroupSection = ({ id, name, type, items, netBalance, currency }: GroupData) => {
    const navigate = useNavigate();
    const { groupType, currencies } = useAuthStore();
    const { setActiveGroup } = useGroupDetailStore();
    return (
        <motion.section
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.98}}
            onClick={() => {
                setActiveGroup(id);
                navigate('detail');
            }}
            className="pt-4"
        >
            <div className="flex items-center justify-between px-4 py-2 bg-white">
                <div className="flex items-center space-x-4">
                    {/* icon */}
                    <div className="flex items-center justify-center">
                        <img src={groupType[type]} alt="icon" className="rounded-2xl w-14 h-14"/>
                    </div>

                    {/* name */}
                    <Text className={`text-xl`}> {name} </Text>
                </div>

                {/* money */}
                <div className="text-right">
                    {netBalance === 0 ? (
                        <Text className="text-sm text-gray-500">settled up</Text>
                    ) : (
                        <>
                            <Text
                                className={`text-sm block ${netBalance > 0 ? 'text-green-600' : 'text-orange-600'}`}
                            >
                                {netBalance > 0 ? 'You lent' : 'You owe'}
                            </Text>
                            <Text
                                className={`text-lg block ${netBalance > 0 ? 'text-green-600' : 'text-orange-600'}`}
                            >
                                {currency}{currencies[currency]}{Math.abs(netBalance).toFixed(2)}
                            </Text>
                        </>
                    )}
                </div>
            </div>

            <div className="pl-20">
                {items.map((item, index) => (
                    <div key={`${index}`} className="relative pl-1 whitespace-nowrap">
                        <Text className="text-sm text-gray-600">
                            {item.type === 'get'
                                ? `${item.person} owes you `
                                : `You owe ${item.person} `}
                            <Text
                                className={item.type === 'get' ? 'text-green-600' : 'text-orange-600'}
                            >
                                {currency}{currencies[currency]}{item.amount.toFixed(2)}
                            </Text>
                        </Text>
                    </div>
                ))}
            </div>


        </motion.section>
    );
};

export default GroupSection;