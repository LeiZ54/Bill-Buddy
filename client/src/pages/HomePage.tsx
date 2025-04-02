import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { auth } from "../services/auth";

type Tab = 'friends' | 'groups' | 'add' | 'history' | 'account';

const iconConfig = {
    friends: {
        active: '/bottomBar/friends_selected.png',
        inactive: '/bottomBar/friends.png'
    },
    groups: {
        active: '/bottomBar/groups_selected.png',
        inactive: '/bottomBar/groups.png'
    },
    add: {
        active: '/bottomBar/add.png',
        inactive: '/bottomBar/add.png'
    },
    history: {
        active: '/bottomBar/history_selected.png',
        inactive: '/bottomBar/history.png'
    },
    account: {
        active: '/bottomBar/account_selected.png',
        inactive: '/bottomBar/account.png'
    }
};

const HomePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<Tab>('groups');
    const [indicatorStyle, setIndicatorStyle] = useState({ left: '20%', width: '20%' });

    const tabs = [
        { id: 'friends', label: 'Friends', path: '/friends' },
        { id: 'groups', label: 'Groups', path: '/groups' },
        { id: 'add', label: '', path: '/add' },
        { id: 'history', label: 'History', path: '/history' },
        { id: 'account', label: 'Account', path: '/account' }
    ];

    useEffect(() => {
        const currentTab = tabs.find(tab => location.pathname.startsWith(tab.path))?.id;
        if (currentTab) {
            const tabIndex = tabs.findIndex(tab => tab.id === currentTab);
            updateIndicator(tabIndex);
            setActiveTab(currentTab as Tab);
        }
    }, [location]);

    const updateIndicator = (tabIndex: number) => {
        const position = tabIndex * 20;
        setIndicatorStyle({
            left: `${position}%`,
            width: '20%'
        });
    };

    const handleTabClick = (tab: Tab, index: number, path: string) => {
        switch (tab) {
            case 'groups':
                const groupPage = sessionStorage.getItem("groupPage");
                switch (groupPage) {
                    case 'detail':
                        navigate('/groupDetail');
                        setActiveTab(tab);
                        updateIndicator(index);
                        break;
                    case 'setting':
                        navigate('/groupSetting');
                        setActiveTab(tab);
                        updateIndicator(index);
                        break;
                    default:
                        navigate('/groups');
                        setActiveTab(tab);
                        updateIndicator(index);
                        break;
                }
                break;
            case 'add':
                const groupId = sessionStorage.getItem("groupPage");
                if (groupId) {
                    navigate('/addExpense');
                } else {
                    navigate('/chooseGroup');
                }
                break;
            default:
                navigate(path);
                setActiveTab(tab);
                updateIndicator(index);
        }
    };

    return (
        <>
            {/* Outlet */}
            <div className="fixed inset-x-0 top-0 bottom-16 overflow-y-auto p-4">
                <Outlet />
            </div>

            <div className="fixed inset-x-0 bottom-0 bg-white shadow-lg">
                <nav className="relative h-16 border-t border-gray-200">
                    <div
                        className="absolute top-0 h-1 bg-green-500 transition-all duration-300 ease-out"
                        style={indicatorStyle}
                    />

                    <div className="flex h-full items-center justify-around">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id as Tab, index, tab.path)}
                                className={`flex flex-1 flex-col items-center justify-center h-full
                                ${tab.id === 'add' ? 'scale-125 -mt-2' : ''}`}
                            >
                                <img
                                    src={activeTab === tab.id
                                        ? iconConfig[tab.id as keyof typeof iconConfig].active
                                        : iconConfig[tab.id as keyof typeof iconConfig].inactive}
                                    alt={tab.label}
                                    className={`${tab.id === 'add' ? 'h-14 w-14' : 'h-6 w-6'} mb-1`}
                                />
                                <span
                                    className={`text-xs ${activeTab === tab.id
                                        ? 'text-green-500 font-medium'
                                        : 'text-gray-500'
                                        }`}
                                >
                                    {tab.label}
                                </span>
                            </button>

                        ))}
                    </div>
                </nav>
            </div>
        </>
    );
}

export default auth(HomePage);