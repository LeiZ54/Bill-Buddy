import { Alert } from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/TopBar';
import { useGroupStore } from '../stores/groupStore';
import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';

export default function GroupDetailPage() {
    const {
        activeGroup,
        clearActiveGroup,
        resetError,
        error,
        isLoading
    } = useGroupStore();
    const { groupType } = useAuthStore();

    const navigate = useNavigate();

    if (!activeGroup) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                <Topbar
                    leftType="back"
                    leftOnClick={() => {
                        navigate("/groups");
                    }}
                    rightOnClick={() => {
                        navigate("/groups/setting");
                    }}
                />
                <Alert message="Something Wrong!" type="error" className="m-4" />;
            </motion.div>
        )
    }

    useEffect(() => {
        resetError();
    }, []);


    const owesYou = activeGroup.items.filter(item => item.type === 'get');
    const youOwe = activeGroup.items.filter(item => item.type === 'owe');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <Topbar
                leftType="back"
                leftOnClick={() => {
                    navigate("/groups");
                    clearActiveGroup();
                }}
                title={activeGroup.name}
                rightOnClick={() => { navigate("/groups/setting") }}
            />


            <div className="max-w-2xl mx-auto mt-6">
                {/* group */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
                    <img
                        src={groupType[activeGroup.type]}
                        alt={activeGroup.type}
                        className="w-16 h-16 object-contain"
                    />
                    <div>
                        <h2 className="text-xl font-semibold">{activeGroup.name}</h2>
                        <p className={`text-lg ${activeGroup.netBalance >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                            }`}>
                            Net Balance: ${Math.abs(activeGroup.netBalance).toFixed(2)}
                            {activeGroup.netBalance >= 0 ? ' You get' : ' You owe'}
                        </p>
                    </div>
                </div>

                {/* detail */}
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/*  */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4 text-green-600">
                            Owes You (${owesYou.reduce((sum, item) => sum + item.amount, 0).toFixed(2)})
                        </h3>
                        {owesYou.length > 0 ? (
                            owesYou.map((item, index) => (
                                <div key={index} className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">{item.person}</span>
                                    <span className="text-green-600">
                                        +${item.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400 text-center py-4">
                                No one owes you
                            </div>
                        )}
                    </div>

                    {/*  */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-medium mb-4 text-red-600">
                            You Owe (${youOwe.reduce((sum, item) => sum + item.amount, 0).toFixed(2)})
                        </h3>
                        {youOwe.length > 0 ? (
                            youOwe.map((item, index) => (
                                <div key={index} className="flex justify-between py-2 border-b">
                                    <span className="text-gray-600">{item.person}</span>
                                    <span className="text-red-600">
                                        -${item.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400 text-center py-4">
                                You don't owe anyone
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}