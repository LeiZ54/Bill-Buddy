import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Image, Typography } from 'antd';
import useAuthStore from '../stores/authStore';
import { motion } from 'framer-motion';

function AuthHeader() {
    const location = useLocation();
    const navigate = useNavigate();
    const { Title } = Typography;
    const { resetError } = useAuthStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, duration: 0.3 }}
            className="w-full p-4 flex items-center justify-between border-b border-black"
        >
                {/* Logo + Title */}
                <div
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Image
                        src={'/logo.png'}
                        preview={false}
                        width={32}
                        height={32}
                        alt="logo"
                    />
                    <Title level={4} style={{ margin: 0 }}>
                        Bill Buddy
                    </Title>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                    <Button
                        type={location.pathname === '/login' ? 'primary' : 'default'}
                        onClick={() => {
                            navigate('/login');
                            resetError();
                        }}
                    >
                        Login
                    </Button>
                    <Button
                        type={location.pathname === '/register' ? 'primary' : 'default'}
                        onClick={() => {
                            navigate('/register');
                            resetError();
                        }}
                    >
                        Sign up
                    </Button>
                </div>
        </motion.div>
    );
}

export default AuthHeader;
