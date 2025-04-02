import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../services/auth";
import { getUrlByType } from "../services/util";
import api from "../services/axiosConfig";
import Topbar from "../components/Topbar";
import SimpleList from "../components/SimpleList";

interface GroupData {
    groupId: number;
    groupName: string;
    type: string | null;
}

interface ApiResponse {
    content: GroupData[];
    last: boolean;
    totalPages: number;
}

const ChooseGroup = () => {
    ;
    const navigate = useNavigate();

    const [groups, setGroups] = useState<GroupData[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getData = useCallback(async (pageNumber: number, isLoadMore = false) => {
        try {
            const response = await api.get<ApiResponse>(`/groups?page=${pageNumber}&size=10`);
            const result = response.data;

            setGroups(prev => isLoadMore
                ? [...prev, ...result.content]
                : result.content);

            setHasMore(!result.last);
            setError(null);
        } catch (err) {
            setError('Failed to load groups. Please try again later.');
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

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

    return (
        <div className="fixed inset-x-0 top-0 bottom-16 overflow-y-auto p-4">
            <div className="mx-auto max-w-md space-y-6">
                {/* top bar */}
                <Topbar
                    leftIcon="/group/back.png"
                    leftOnClick={() => {
                        navigate(-1);
                        sessionStorage.removeItem("addExpenseGroupId");
                        sessionStorage.removeItem("addExpenseGroupName");
                        sessionStorage.removeItem("addExpenseGroupType");
                    }}
                    title='Choose group'
                />
                <div>
                    {/* group list */}
                    {error == "Failed to get data!" ? (
                        <div className="text-center p-4">
                            <span className="text-red-500 text-xl block">{error}</span>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center p-4">You do not have any group</div>
                    ) : (
                        <>
                            {groups.map((group) => (
                                <SimpleList
                                    key={group.groupId}
                                    img={getUrlByType(group.type||'')}
                                    name={group.groupName}
                                    handleClick={() => {
                                        navigate(`/addExpense`);
                                        sessionStorage.setItem("addExpenseGroupId", group.groupId.toString());
                                        sessionStorage.setItem("addExpenseGroupName", group.groupName.toString());
                                        sessionStorage.setItem("addExpenseGroupType", group.type!.toString());
                                    }}
                                />
                            ))}

                            {isLoadingMore && (
                                <div className="flex justify-center p-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                                </div>
                            )}

                            {!hasMore && (
                                <div className="text-center text-gray-500 p-4">
                                    No more groups to show
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default auth(ChooseGroup);
