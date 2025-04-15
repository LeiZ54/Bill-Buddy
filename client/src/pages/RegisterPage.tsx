import { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Row, Col, Spin } from 'antd';
import { motion } from 'framer-motion';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import AuthHeader from '../components/AuthHeader';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import api from '../util/axiosConfig';

const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function RegisterPage() {
    const [form] = Form.useForm();
    const { register, isLoading, error } = useAuthStore();
    const [isFormValid, setIsFormValid] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const navigate = useNavigate();

    // form check
    const values = Form.useWatch([], form);
    useEffect(() => {
        form.validateFields({ validateOnly: true }).then(
            () => setIsFormValid(true),
            () => setIsFormValid(false)
        );
    }, [form, values]);

    const handleSubmit = async (values: {email: string; password: string; confirmPassword: string; givenName: string; familyName: string }) => {
        const success = await register(values.email, values.password, values.givenName, values.familyName);
        if (success) {
            navigate("/");
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={formVariants}
            transition={{ duration: 0.5 }}
            className="h-screen w-screen"
        >
            <AuthHeader />
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex justify-center p-8"
            >
                <div className="mt-12 w-full max-w-md rounded-xl p-8 border-2 border-black">

                    <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
                    <Form
                        form={form}
                        onFinish={handleSubmit}
                        layout="vertical"
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: '' },
                                {
                                    validator: async (_, value) => {
                                        if (!value) {
                                            return Promise.reject(new Error('Please input your email!'));
                                        }
                                        else if (!/^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
                                            return Promise.reject(new Error('Please input a valid email!'));
                                        }
                                        return;
                                    },
                                },
                                {
                                    validator: async (_, value) => {
                                        if (!value || !/^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
                                            return;
                                        }

                                        try {
                                            setCheckingEmail(true);
                                            const res = await api.get(`/auth/check-email?email=${value}`);
                                            if (!res.data.available) {
                                                return Promise.reject(new Error('This email is already registered.'));
                                            }
                                        } catch (err) {
                                        } finally {
                                            setCheckingEmail(false);
                                        }

                                        return Promise.resolve();
                                    },
                                },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined className="text-gray-300" />}
                                size="large"
                                allowClear
                                suffix={checkingEmail ? <Spin size="small" /> : null}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: true, message: 'Please input your password!' },
                                { min: 6, message: 'Password must be at least 6 characters!' }
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-300" />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Confirm Password"
                            name="confirmPassword"
                            rules={[
                                { required: true, message: 'Please confirm your password!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('The two passwords do not match!'));
                                    },
                                })
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-300" />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item label="Name" required>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="givenName"
                                        rules={[{ required: true, message: 'Please input your given name!' }]}
                                        noStyle
                                    >
                                        <Input
                                            size="large"
                                            allowClear
                                            placeholder="Given Name"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="familyName"
                                        rules={[{ required: true, message: 'Please input your family name!' }]}
                                        noStyle
                                    >
                                        <Input
                                            size="large"
                                            allowClear
                                            placeholder="Family Name"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mb-4"
                            >
                                <Alert message={error} type="error" showIcon />
                            </motion.div>
                        )}

                        <Form.Item>
                            <Button
                                htmlType="submit"
                                block
                                size="large"
                                type="primary"
                                loading={isLoading}
                                disabled={!isFormValid || isLoading}
                            >
                                Register
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </motion.div>
        </motion.div>
    );
}
