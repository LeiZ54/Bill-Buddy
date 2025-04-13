import { motion } from 'framer-motion';
import Topbar from '../components/TopBar';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const AddPage = () => {
    const navigate = useNavigate();
    const [hideMask, setHideMask] = useState(false);

    return (
        <div className="relative w-full h-full min-h-screen overflow-hidden bg-white">
            {!hideMask && (
                <motion.div
                    initial={{
                        clipPath: 'circle(0% at 50% 100%)',
                        backgroundColor: '#3B82F6'
                    }}
                    animate={{
                        clipPath: 'circle(150% at 50% 100%)',
                        backgroundColor: '#3B82F6'
                    }}

                    onAnimationComplete={() => setHideMask(true)}
                    className="absolute inset-0 z-10"
                />
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="relative z-20"
            >
                <Topbar leftType="back" leftOnClick={() => navigate(-1)} />
                <div className="p-4 text-center text-gray-600">
                    <p>Add something here...</p>
                </div>
            </motion.div>
        </div>
    );
};

export default AddPage;
