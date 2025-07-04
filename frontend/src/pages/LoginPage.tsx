import React, { useState, useContext } from 'react';
import { Form, Input, Button, Typography, Row, Col, Card, Alert } from 'antd';
import { AuthContext } from '../context/AuthContext';
import { login, getProfile } from '../services/auth.service';
import { setupAuthAutoRefresh } from '../services/api';

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const authContext = useContext(AuthContext);

  const onFinish = async (values: any) => {
    setLoading(true);
    setError('');
    try {
      const data = await login({ email: values.email, password: values.password }, { withCredentials: true });
      const profile = await getProfile(data.access_token);
      authContext?.setAuthData(data.access_token, profile);
      setupAuthAutoRefresh();
    } catch (err: any) {
      let msg = 'Failed to login. Please check your credentials.';
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
      <Col xs={24} sm={16} md={12} lg={8} xl={6}>
        <Card>
          <Title level={2} style={{ textAlign: 'center' }}>Realtor Platform Login</Title>
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
            >
              <Input autoFocus />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password />
            </Form.Item>

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                Log in
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginPage; 