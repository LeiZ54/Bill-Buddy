import auth from "../services/auth";
import { useLocation, useNavigate } from 'react-router-dom';

const GroupDetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { groupId, groupName } = location.state || {};

    return (
        <div  className="mx-auto max-w-md space-y-6">
            {/* top bar */}
            <div className="flex items-center justify-between">
                {/* left */}
                <button
                    onClick={() => navigate('/groups')}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <img src="/group/back.png" className="w-6 h-6 rounded-full" />
                </button>

                {/* mid */}
                <h1 className="text-lg font-medium">{groupName}</h1>

                {/* right */}
                <button
                    onClick={() => navigate('/groupSetting', {
                        state: {
                            groupId,
                            groupName
                        }
                    })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <img src="/group/set_button.png" className="w-6 h-6 rounded-full" />
                </button>
            </div>

            {/* content */}
            <div className="p-4">
                <div>Group Detail Content Here</div>
            </div>
        </div>
    );
};

export default auth(GroupDetailPage);