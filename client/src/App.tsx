import { Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
export default function App() {
    return (
        <ConfigProvider>
        <div className="app-container">
            <Outlet />
        </div>
        </ConfigProvider>
    );
}