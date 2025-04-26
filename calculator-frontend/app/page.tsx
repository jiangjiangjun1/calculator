'use client';
import { useState } from 'react';
import { createPromiseClient } from "@bufbuild/connect";
import { createConnectTransport } from "@bufbuild/connect-web";
import { CalculatorService } from '../calculator/v1/calculator_connectweb';
import { CalculateRequest, CalculateResponse } from '../calculator/v1/calculator_pb';

const transport = createConnectTransport({
  baseUrl: "http://localhost:8088",

});
const client = createPromiseClient(CalculatorService, transport);

export default function Home() {
  const [operand1, setOperand1] = useState('');
  const [operand2, setOperand2] = useState('');
  const [operator, setOperator] = useState('+');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 使用类型断言创建请求对象
      const req = {
        operand1: parseFloat(operand1) || 0,
        operand2: parseFloat(operand2) || 0,
        operator,
      } as CalculateRequest;

      const response = await client.calculate(req) as CalculateResponse;
      setResult(response.result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      console.error('计算请求失败:', err);
      setError(`计算失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      padding: '2rem',
      fontFamily: 'Arial',
      maxWidth: '800px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h1 style={{ textAlign: 'center' }}>Connect 协议计算器</h1>
      <div style={{
        marginBottom: '1rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '600px'
      }}>
        <input
          type="number"
          step="any"
          value={operand1}
          onChange={(e) => setOperand1(e.target.value)}
          placeholder="第一个数"
          style={{
            padding: '0.8rem',
            fontSize: '1.2rem',
            minWidth: '200px',
            flex: '1'
          }}
        />
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          style={{
            padding: '0.8rem',
            fontSize: '1.2rem',
            minWidth: '80px'
          }}
        >
          <option value="+">+</option>
          <option value="-">−</option>
          <option value="*">×</option>
          <option value="/">÷</option>
        </select>
        <input
          type="number"
          step="any"
          value={operand2}
          onChange={(e) => setOperand2(e.target.value)}
          placeholder="第二个数"
          style={{
            padding: '0.8rem',
            fontSize: '1.2rem',
            minWidth: '200px',
            flex: '1'
          }}
        />
        <button
          onClick={handleCalculate}
          disabled={loading}
          style={{
            padding: '0.8rem 1.5rem',
            fontSize: '1.2rem',
            minWidth: '120px'
          }}
        >
          {loading ? '计算中...' : '计算'}
        </button>
      </div>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {result !== null && <h2 style={{ textAlign: 'center' }}>结果：{result}</h2>}
    </main>
  );
}