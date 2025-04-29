import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountPage from '@/pages/AccountPage';
import { MemoryRouter } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { message } from 'antd';
import '@testing-library/jest-dom';

vi.mock('@/stores/authStore', () => {
    return {
        default: vi.fn(() => ({
            logout: vi.fn(),
            familyName: 'John',
            givenName: 'Doe',
            email: 'test@example.com',
            updateUserInfo: vi.fn(),
            uploadImg: vi.fn(),
            avatar: '',
        })),
    };
});

vi.mock('antd', async () => {
    const antd = await vi.importActual('antd');
    return {
        ...antd,
        message: {
            error: vi.fn(),
            success: vi.fn(),
        },
    };
});

describe('🧪 AccountPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('渲染用户基本信息', () => {
        render(<AccountPage />, { wrapper: MemoryRouter });

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('点击 Edit Information 应弹出 Modal', async () => {
        render(<AccountPage />, { wrapper: MemoryRouter });

        const editButtons = screen.getAllByText('Edit Information');
        const modalTrigger = editButtons.find((el) =>
            el.closest('div')?.className?.includes('transition')
        );
        expect(modalTrigger).toBeDefined();
        fireEvent.click(modalTrigger!);

        await waitFor(() => {
            expect(screen.getByText('Update')).toBeInTheDocument();
        });
    });

    it('上传非图片文件应显示错误', async () => {
        render(<AccountPage />, { wrapper: MemoryRouter });

        const fakeFile = new File(['dummy content'], 'not-image.txt', { type: 'text/plain' });

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        if (!input) throw new Error('找不到 input[type="file"]');

        fireEvent.change(input, {
            target: { files: [fakeFile] },
        });

        await waitFor(() => {
            expect(message.error).toHaveBeenCalledWith('Please upload a image!');
        });
    });
});
