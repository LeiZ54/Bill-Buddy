import { useEffect, useState, useCallback } from 'react';
import api from "../services/axiosConfig";
import TopActionBar from "../components/TopActionBar";
import CreateGroupModal from "../components/CreateGroupModal";
import { useNavigate } from 'react-router-dom';

interface Group {
    groupId: number;
    groupName: string;
    owesCurrentUser: Record<string, number>;
    currentUserOwes: Record<string, number>;
}

interface ExpenseItem {
    person: string;
    amount: number;
    type: 'owe' | 'get';
}

interface GroupData {
    id: number;
    name: string;
    items: ExpenseItem[];
    netBalance: number;
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [page, setPage] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);


    const transformGroups = useCallback((data: Group[]): GroupData[] => {
        return data.map(group => {
            const sumGet = Object.values(group.owesCurrentUser).reduce((a, b) => a + b, 0);
            const sumOwe = Object.values(group.currentUserOwes).reduce((a, b) => a + b, 0);
            const netBalance = sumGet - sumOwe;

            return {
                id: group.groupId,
                name: group.groupName,
                netBalance,
                items: [
                    ...Object.entries(group.owesCurrentUser).map(([person, amount]) => ({
                        person,
                        amount,
                        type: "get" as const,
                    })),
                    ...Object.entries(group.currentUserOwes).map(([person, amount]) => ({
                        person,
                        amount,
                        type: "owe" as const,
                    })),
                ],
            };
        });
    }, []);
    const getData = useCallback(async (pageNumber: number, isLoadMore = false) => {
        try {
            const response = await api.get(`/groups/my?page=${pageNumber}&size=10`);
            const result = response.data;

            const transformedData = transformGroups(result.content);

            setGroups(prev => isLoadMore
                ? [...prev, ...transformedData]
                : transformedData);

            setHasMore(!result.last);
        } catch (err) {
            setError('Failed to get data');
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    }, [transformGroups]);


    useEffect(() => {
        getData(0);
    }, [getData]);

    // get new page
    useEffect(() => {
        const scrollContainer = document.querySelector('.fixed.overflow-y-auto'); 

        const handleScroll = () => {
            if (!scrollContainer) return;

            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

            if (
                scrollTop + clientHeight == scrollHeight &&
                !isLoadingMore &&
                hasMore &&
                !error
            ) {
                setIsLoadingMore(true);

                setPage(prev => {
                    const nextPage = prev + 1;
                    getData(nextPage, true);
                    return nextPage;
                });
            }

        };

        scrollContainer?.addEventListener('scroll', handleScroll);
        return () => scrollContainer?.removeEventListener('scroll', handleScroll);
    }, [isLoadingMore, hasMore, error, page, getData]);


    if (loading) return <LoadingSpinner />;

    const handleCreateGroup = async (groupName: string) => {
        try {
            if (!groupName.trim()) {
                setError('Group name can not be empty!');
                return;
            }

            await api.post('/groups', { groupName });
            // reflash
            setPage(0);
            setGroups([]);
            getData(0);
            setShowCreateModal(false);
        } catch (err) {
            setError('Failed to create group');
        }
    };

    return (
        <div className="">
            <div className="mx-auto max-w-md">
                {/* creat group */}
                <CreateGroupModal
                    mode="create"
                    open={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        setError("");
                    }}
                    onSubmit={handleCreateGroup}
                    error={error}
                />

                {/* topbar */}
                <TopActionBar
                    onCreateGroup={() => setShowCreateModal(true)}
                />

                {/* group list */}
                {error == "Failed to create group" ? (
                    <div className="text-center p-4">
                        <span className="text-red-500 text-xl block">{error}</span>
                        <button
                            onClick={() => {
                                getData(0);
                                setError("");
                            }}
                            className="mt-2 text-blue-600 hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center p-4">You do not have any group</div>
                ) : (
                    <>
                        {groups.map((group) => (
                            <GroupSection key={group.id} {...group} />
                        ))}

                        {/* loading */}
                        {isLoadingMore && (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {/* no more */}
                        {!hasMore && (
                            <div className="text-center text-gray-500 p-4">
                                No more groups to load
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}


const GroupSection = ({ id, name, items, netBalance }: GroupData) => {
    const navigate = useNavigate();
    return (
        <section className="flex justify-between relative mb-6 group-section cursor-pointer hover:bg-gray-50 transition-colors p-2"
            onClick={() => navigate('/groupDetail', {
                state: {
                    groupId: id,
                    groupName: name
                }
            })}
        >
            {/* left */}
            <div className="relative z-10">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {/* img */}
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
                </div>
            </div>

            {/* mid */}
            <div className="flex-1 ml-4 text-xs">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">{name}</h2>
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={`${item.person}-${item.type}`}
                            className="relative"
                        >
                            {/* content */}
                            <span className="text-gray-600">
                                {item.type === 'get'
                                    ? `${item.person} owes you `
                                    : `you owe ${item.person} `}
                            </span>
                            <span className={`font-medium ${item.type === 'get' ? 'text-green-600' : 'text-red-600'}`}>
                                US${item.amount.toFixed(2)}
                            </span>

                            {/* line */}
                            {index !== items.length && (
                                <div
                                    className="absolute left-[-37px] top-3 h-px w-[30px] bg-gray-300
                                after:absolute after:left-0 after:top-[-40px] after:w-px after:h-10 after:bg-gray-200"

                                    style={{ transform: 'translateY(50%)' }}
                                >
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* right */}
            <div className="text-right">
                <p className="text-xs text-gray-500">
                    {netBalance >= 0 ? 'you are owed' : 'you owe'}
                </p>
                <p className={`font-medium ${netBalance >= 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                    US${Math.abs(netBalance).toFixed(2)}
                </p>
            </div>
        </section>
    );
}

const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);