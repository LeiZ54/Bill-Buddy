import { Link } from "react-router-dom";
import { motion } from 'framer-motion';

const NotFoundPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
        >
            <div className="flex flex-col items-center justify-center h-screen text-center">
                <h1 className="text-6xl font-bold text-red-500">404</h1>
                <p className="text-xl mt-4">Oops! The page you're looking for doesn't exist.</p>
                <Link to="/" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Go Home
                </Link>
            </div>
        </motion.div>
    );
};

export default NotFoundPage;
