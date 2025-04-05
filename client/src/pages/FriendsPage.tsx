import { motion } from 'framer-motion';
const FriendsPage = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
    >
        <div>Friends Content</div>
    </motion.div>
);
export default FriendsPage;