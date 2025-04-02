import { useNavigate } from 'react-router-dom';
import Topbar from "../components/Topbar";

const GroupDetailPage = () => {
    const navigate = useNavigate();
    const groupId = Number(sessionStorage.getItem("groupId"));
    const groupName = sessionStorage.getItem("groupName");

    return (
        <div  className="mx-auto max-w-md space-y-6">
            {/* top bar */}
            <Topbar
                leftIcon="/group/back.png"
                leftOnClick={() => {
                    navigate('/groups');
                    sessionStorage.removeItem("groupId");
                    sessionStorage.removeItem("groupPage");
                    sessionStorage.removeItem("groupType");
                    sessionStorage.removeItem("groupName");
                }}
                title={groupName||''}
                rightIcon="/group/set_button.png"
                rightOnClick={() => {
                    navigate('/groupSetting');
                    sessionStorage.setItem("groupPage", "setting");
                }}
            />

            {/* content */}
            <div className="p-4">
                <div>Group Detail Content Here</div>
            </div>
        </div>
    );
};

export default GroupDetailPage;