import auth from "../services/auth";
import { useLocation, useNavigate } from 'react-router-dom';

const GroupSettingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { groupId } = location.state || {};

    return (
        <div>
            {/* top bar */}
            <div className="flex items-center justify-between">
                {/* left */}
                <button
                    onClick={() => navigate('/groupDetail', {
                        state: { groupId }
                    })}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                {/* title */}
                <h1 className="text-lg font-medium">Group settings</h1>

                <div className="w-6 h-6" ></div>
            </div>

            {/* content */}
            <div className="p-4">
                <div>Group settings</div>
            </div>
        </div>
    );
};

export default auth(GroupSettingPage);