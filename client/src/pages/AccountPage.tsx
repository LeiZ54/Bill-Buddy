import {Steps, Avatar, Button, Divider, Input, Modal, message, Form, Alert, Spin, Row, Col} from 'antd';
import {LockOutlined, LogoutOutlined, MailOutlined, SafetyOutlined} from '@ant-design/icons';
import useAuthStore from '../stores/authStore';
import {useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useEffect, useState} from 'react';
import api from "../util/axiosConfig.ts";
import {Typography} from 'antd';


export default function AccountPage() {
    const [inforForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [isInforFormValid, setIsInforFormValid] = useState(false);
    const [isPasswordFormValid, setIsPasswordFormValid] = useState(false);
    const {logout, familyName, givenName, email, isLoading, updateUserInfo} = useAuthStore();
    const navigate = useNavigate();
    const {Text} = Typography;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);

    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    const {Step} = Steps;

    const values1 = Form.useWatch([], inforForm);
    useEffect(() => {
        inforForm.validateFields({validateOnly: true}).then(
            () => setIsInforFormValid(true),
            () => setIsInforFormValid(false)
        );
    }, [inforForm, values1]);

    useEffect(() => {
        if (isModalOpen) {
            inforForm.setFieldsValue({
                familyName,
                givenName,
                email,
            });
        }
    }, [isModalOpen]);

    const values2 = Form.useWatch([], passwordForm);

    useEffect(() => {
        passwordForm.validateFields({validateOnly: true}).then(
            () => setIsPasswordFormValid(true),
            () => setIsPasswordFormValid(false)
        );
    }, [passwordForm, values2]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    const sendCode = async () => {
        try {
            await api.post(`auth/forgot-password?email=${email}`);
            setCountdown(60);
            message.success('Verification successful');
        } catch (error) {
            message.error('Verification failed');
        }
    };
    const handleSubmit = async (values: any) => {
        setIsLoadingPassword(true);
        try {
            switch (currentStep) {
                case 0: {
                    const {data} = await api.post('/auth/verify-code', {
                        email,
                        code: values.code
                    });
                    setToken(data.token);
                    setCurrentStep(1);
                    break;
                }
                case 1:
                    await api.post('/auth/reset-password', {
                        email,
                        newPassword: values.password,
                        token
                    });
                    setIsChangePasswordModalOpen(false);
                    message.success('Password updated!');
                    passwordForm.resetFields();
                    setCurrentStep(0);
                    break;
            }
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Network Error!');
        } finally {
            setIsLoadingPassword(false);
        }
    };
    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3, delay: 0.2}}
        >
            <div className="relative pb-72">
                <img
                    src="/Account/images.jpg"
                    className="w-full h-64 object-cover"
                />
                <Avatar
                    src="/Account/images.jpg"
                    className="w-24 h-24 rounded-full ring-4 ring-gray-200 absolute left-1/2 -translate-x-1/2 top-[11rem] shadow-xl"
                />
                <div className="mt-10 text-center">
                    <Text className="text-4xl font-bold text-gray-800">{familyName+" "+givenName || 'Guest User'}</Text>
                </div>
                <div className="mt-1 text-center">
                    <Text className="text-lg text-gray-500 mt-1 text-center">{email || 'Guest User'}</Text>
                </div>

                <div className="mt-10 px-4">
                    <div className="w-[100%] mx-auto border-t border-gray-200 my-0"/>
                    <Button
                        type="text"
                        block
                        className="font-bold text-xl h-auto leading-none py-3"
                        onClick={() => {
                            setIsModalOpen(true);
                        }}
                    >
                        Edit Information
                    </Button>
                    <div className="w-[100%] mx-auto border-t border-gray-200 my-0"/>


                    <Button
                        type="text"
                        block
                        className="font-bold text-xl h-auto leading-none py-3"
                        onClick={() => {
                            setIsChangePasswordModalOpen(true);
                        }}
                    >
                        Change Password
                    </Button>
                    <div className="w-[100%] mx-auto border-t border-gray-200 my-0"/>

                </div>

                <Button
                    type="default"
                    icon={<LogoutOutlined/>}
                    onClick={()=>{
                        logout();
                        navigate('/login');
                    }}
                    className="w-[80%] py-1  font-semibold absolute left-1/2 -translate-x-1/2 mt-40 bg-transparent  rounded-md border-2 border-green-500 text-green-500 text-xl h-auto"
                >
                    Log Out
                </Button>

                <Modal
                    style={{
                        top: '20%',
                    }}
                    title={<span className="text-2xl font-bold">Edit Information</span>}
                    open={isModalOpen}
                    onCancel={() => {setIsModalOpen(false);}}
                    footer={null}
                >
                    <Form
                        form={inforForm}
                        onFinish={(values)=>{
                            updateUserInfo(values.familyName,values.givenName,values.email);
                            setIsModalOpen(false);
                        }}
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
                                        if(value != email){
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

                        <Form.Item>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="givenName"
                                        name="givenName"
                                        rules={[{ required: true, message: 'Please input your given name!' }]}
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
                                        label="familyName"
                                        name="familyName"
                                        rules={[{ required: true, message: 'Please input your family name!' }]}
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

                        <Form.Item>
                            <Button
                                htmlType="submit"
                                block
                                size="large"
                                type="primary"
                                loading={isLoading}
                                disabled={!isInforFormValid || isLoading}
                            >
                                Update
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    open={isChangePasswordModalOpen}
                    onCancel={() => {
                        setIsChangePasswordModalOpen(false);
                        setCurrentStep(0);
                        passwordForm.resetFields();
                        setError("");
                    }}
                    footer={null}
                    title={
                        <div className="text-center text-4xl font-bold">
                            Change Password
                        </div>
                    }
                >

                    <motion.div
                        className="flex justify-center "
                    >
                        <div className="mt-5 w-full max-w-xl rounded-xl p-8">
                            <Steps current={currentStep} className="mb-8">
                                <Step title="Input verification code"/>
                                <Step title="Reset password"/>
                            </Steps>

                            <Form
                                form={passwordForm}
                                onFinish={handleSubmit}
                                layout="vertical"
                                autoComplete="off"
                                initialValues={{email}}
                            >
                                {currentStep === 0 && (
                                    <motion.div>
                                        <Form.Item label="Email">
                                            <Input.Group compact>
                                                <Input
                                                    prefix={<MailOutlined />}
                                                    value={email}
                                                    disabled
                                                    size="large"
                                                    style={{ width: 'calc(100% - 30%)' }}
                                                />
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    disabled={countdown > 0}
                                                    onClick={sendCode}
                                                    style={{ width: '30%' }}
                                                >
                                                    {countdown > 0 ? `${countdown}s` : 'Send'}
                                                </Button>
                                            </Input.Group>
                                        </Form.Item>

                                        <Form.Item
                                            label="Verification Code"
                                            name="code"
                                            rules={[
                                                {required: true, message: 'Please input the verification code'},
                                                {len: 6, message: 'The verification code must be a 6-digit number'}
                                            ]}
                                        >
                                            <Input
                                                prefix={<SafetyOutlined/>}
                                                size="large"
                                                maxLength={6}
                                            />
                                        </Form.Item>

                                    </motion.div>
                                )}

                                {currentStep === 1 && (
                                    <motion.div>
                                        <Form.Item label="Email">
                                            <Input
                                                prefix={<MailOutlined/>}
                                                value={email}
                                                disabled
                                                size="large"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="New Password"
                                            name="password"
                                            rules={[
                                                {required: true, message: 'Please input your new password!'},
                                                {min: 6, message: 'Password must be at least 6 characters!'}
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<LockOutlined/>}
                                                size="large"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Confirm Password"
                                            name="confirmPassword"
                                            dependencies={['password']}
                                            rules={[
                                                {required: true, message: 'Please confirm your password!'},
                                                ({getFieldValue}) => ({
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
                                                prefix={<LockOutlined/>}
                                                size="large"
                                            />
                                        </Form.Item>
                                    </motion.div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                    >
                                        <Alert message={error} type="error" className="mb-4"/>
                                    </motion.div>
                                )}

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    size="large"
                                    loading={isLoadingPassword}
                                    disabled={!isPasswordFormValid || isLoadingPassword }
                                >
                                    {currentStep === 0 && 'Verify'}
                                    {currentStep === 1 && 'Reset password'}
                                </Button>


                            </Form>
                        </div>
                    </motion.div>
                </Modal>
            </div>


        </motion.div>
    );
}