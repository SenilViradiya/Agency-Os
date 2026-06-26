import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export default function LoadingSpinner() {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%', 
            minHeight: 200 
        }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
        </div>
    );
}
