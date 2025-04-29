import { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Steps } from 'antd';
import { motion } from 'framer-motion';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import AuthHeader from '../components/AuthHeader';
import api from '../util/axiosConfig';
import { useNavigate } from 'react-router-dom';

const { Step } = Steps;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

export default function ForgotPasswordPage() {
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [isFormValid, setIsFormValid] = useState(false);
    const values = Form.useWatch([], form);
    useEffect(() => {
        form.validateFields({ validateOnly: true }).then(
            () => setIsFormValid(true),
            () => setIsFormValid(false)
        );
    }, [form, values]);

    //timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    const handleSubmit = async (values: any) => {
        setIsLoading(true);
        try {
            switch (currentStep) {
                case 0:
                    await api.post(`auth/forgot-password?email=${values.email}`);
                    setEmail(values.email);
                    setCountdown(60);
                    setCurrentStep(1);
                    break;
                case 1:
                    const { data } = await api.post('/auth/verify-code', {
                        email,
                        code: values.code
                    });
                    setToken(data.token);
                    setCurrentStep(2);
                    break;
                case 2:
                    await api.post('/auth/reset-password', {
                        email,
                        newPassword: values.password,
                        token
                    });
                    navigate('/login');
                    break;
            }
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Network Error!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <AuthHeader />

            <motion.div
                className="flex justify-center p-8"
                variants={containerVariants}
            >
                <div className="mt-12 w-full max-w-md rounded-xl p-8 border-2 border-black">
                    <Steps current={currentStep} className="mb-8">
                        <Step title="Input email" />
                        <Step title="Input verification code" />
                        <Step title="Reset password" />
                    </Steps>

                    <Form
                        form={form}
                        onFinish={handleSubmit}
                        layout="vertical"
                        autoComplete="off"
                        initialValues={{ email }}
                    >

                        {currentStep === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Form.Item
                                    label="Register email"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Please input your email!' },
                                        { type: 'email', message: 'Please input a valid email!' }
                                    ]}
                                >
                                    <Input
                                        prefix={<MailOutlined />}
                                        size="large"
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </Form.Item>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                initial={{ x: 20 }}
                                animate={{ x: 0 }}
                            >
                                <Form.Item label="Email">
                                    <Input
                                        prefix={<MailOutlined />}
                                        value={email}
                                        disabled
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Verification Code"
                                    name="code"
                                    rules={[
                                        { required: true, message: 'Please input the verification code' },
                                        { len: 6, message: 'The verification code must be a 6-digit number' }
                                    ]}
                                >
                                    <Input
                                        prefix={<SafetyOutlined />}
                                        size="large"
                                        maxLength={6}
                                    />
                                </Form.Item>

                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                initial={{ x: -20 }}
                                animate={{ x: 0 }}
                            >
                                <Form.Item label="Email">
                                    <Input
                                        prefix={<MailOutlined />}
                                        value={email}
                                        disabled
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="New Password"
                                    name="password"
                                    rules={[
                                        { required: true, message: 'Please input your new password!' },
                                        { min: 6, message: 'Password must be at least 6 characters!' }
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined />}
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    dependencies={['password']}
                                    rules={[
                                        { required: true, message: 'Please confirm your password!' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('The two passwords do not match!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined />}
                                        size="large"
                                    />
                                </Form.Item>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Alert message={error} type="error" className="mb-4" />
                            </motion.div>
                        )}

                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            loading={isLoading}
                            disabled={!isFormValid || isLoading || (currentStep === 0 && countdown > 0)}
                        >
                            {currentStep === 0 && (countdown > 0 ? `Try again in ${countdown} seconds` : 'Send verification code')}
                            {currentStep === 1 && 'Verify'}
                            {currentStep === 2 && 'Reset password'}
                        </Button>


                    </Form>
                </div>
            </motion.div>

        </motion.div>
    );
}