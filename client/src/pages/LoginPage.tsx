import { useState, useEffect } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { motion } from 'framer-motion';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/authStore';
import AuthHeader from '../components/AuthHeader';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from "@react-oauth/google";



//motion
const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};


export default function LoginPage() {
    const [form] = Form.useForm();
    const { login, loginWithGoogle, isLoading, error } = useAuthStore();
    const [isFormValid, setIsFormValid] = useState(false);
    const navigate = useNavigate();


    // form check
    const values = Form.useWatch([], form);
    useEffect(() => {
        form.validateFields({ validateOnly: true }).then(
            () => setIsFormValid(true),
            () => setIsFormValid(false)
        );
    }, [form, values]);

    const handleSubmit = async (values: { email: string; password: string }) => {
        const success = await login(values.email, values.password);
        if (success) {
            navigate("/");
        }
    };

    const handleGoogleLogin = async (response: any) => {
        const googleId = response.credential;
        const success =  await loginWithGoogle(googleId); 
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
            className="h-screen w-scree"
        >
            <AuthHeader />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex justify-center p-8"
            >
                <div className="mt-12 w-full max-w-md rounded-xl p-8 border-2 border-black">

                    <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
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
                                { required: true, message: 'Please input your email!' },
                                {
                                    type: 'email',
                                    message: 'Please input a valid email!',
                                },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined className="text-gray-300" />}
                                size="large"
                                allowClear
                            />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: true, message: 'Please input your password!' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-300" />}
                                size="large"
                            />
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
                                Login
                            </Button>
                        </Form.Item>

                        <Form.Item className="text-center">
                            <Button
                                type="link"
                                className="p-0"
                                onClick={() => {
                                    navigate('/forgot');
                                }}
                            >
                                Forgot your password?
                            </Button>
                        </Form.Item>

                        <Form.Item>
                            <div>
                                <GoogleLogin
                                    onSuccess={handleGoogleLogin}
                                    onError={() => console.error('Google Login Error!')}
                                />
                            </div>
                        </Form.Item>

                    </Form>
                </div>
            </motion.div>
        </motion.div>
    );
}