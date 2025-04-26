import { motion } from 'framer-motion';
import Topbar from '../components/TopBar';
import { useNavigate } from 'react-router-dom';
import { useFriendStore } from '../stores/friendStore';


export default function FriendDetailPage() {
    const navigate = useNavigate();
    const { activeFriend } = useFriendStore();
    console.log(activeFriend);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}

        >
        <Topbar title="Friend Detail" leftType="back"/>

        </motion.div>
    )
}