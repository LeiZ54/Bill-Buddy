import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGroupStore } from '../stores/groupStore';

const InviteLinkPage = () => {
    const [searchParams] = useSearchParams();
    const { setInviteToken } = useGroupStore();
    const navigate = useNavigate();
    useEffect(() => {
        const inviteToken = searchParams.get('token');
        setInviteToken(inviteToken || '');
        navigate("/groups");


    }, []);
    return null;
}

export default InviteLinkPage;