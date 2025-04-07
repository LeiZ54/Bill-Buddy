import { Card, Typography, Button, Row, Col } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

export default function AccountPage() {
    const { logout, id, name, email } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            <div className="max-w-2xl mx-auto p-4">
                <Card
                    title={
                        <Title level={3} className="!mb-0">
                            Account
                        </Title>
                    }
                    extra={
                        <Button
                            type="primary"
                            danger
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    }
                >
                    <div className="space-y-4">
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Text strong className="text-gray-500">
                                    User ID
                                </Text>
                            </Col>
                            <Col span={16}>
                                <Text code>{id || 'N/A'}</Text>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Text strong className="text-gray-500">
                                    Name
                                </Text>
                            </Col>
                            <Col span={16}>
                                <Text className="text-lg">{name || 'Guest User'}</Text>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Text strong className="text-gray-500">
                                    Email
                                </Text>
                            </Col>
                            <Col span={16}>
                                <Text className="text-lg">{email || 'N/A'}</Text>
                            </Col>
                        </Row>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}