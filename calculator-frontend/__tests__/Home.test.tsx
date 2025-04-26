import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../app/page';
import '@testing-library/jest-dom';

const ERROR_MESSAGES = {
  INVALID_NUMBER: '请输入有效的数字',
  SERVER_ERROR: '计算出错',
  DIVIDE_BY_ZERO: '除数不能为0'
} as const;

const mockCalculate = jest.fn();

// Mock calculator service
jest.mock('../calculator/v1/calculator_pb.ts', () => ({
  CalculatorService: {}
}));

// Mock Home page component
jest.mock('../app/page', () => {
  const originalModule = jest.requireActual('../app/page');
  return {
    ...originalModule,
    __esModule: true,
    default: originalModule.default,
    createCalculatorClient: () => ({
      calculate: mockCalculate
    })
  };
});

describe('计算器组件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculate.mockResolvedValue({ result: '42' });
  });

  describe('基础功能测试', () => {
    it('应该正确渲染初始状态', () => {
      render(<Home />);

      expect(screen.getByPlaceholderText('第一个数')).toHaveValue('');
      expect(screen.getByPlaceholderText('第二个数')).toHaveValue('');
      expect(screen.getByRole('combobox')).toHaveValue('+');
    });

    it('应该能够处理输入变化', () => {
      render(<Home />);

      const firstInput = screen.getByPlaceholderText('第一个数');
      const secondInput = screen.getByPlaceholderText('第二个数');
      const operatorSelect = screen.getByRole('combobox');

      fireEvent.change(firstInput, { target: { value: '10' } });
      fireEvent.change(secondInput, { target: { value: '5' } });
      fireEvent.change(operatorSelect, { target: { value: '+' } });

      expect(firstInput).toHaveValue('10');
      expect(secondInput).toHaveValue('5');
      expect(operatorSelect).toHaveValue('+');
    });
  });

  describe('计算操作测试', () => {
    const testCases = [
      { op1: '10', op2: '5', operator: '+', expected: '15' },
      { op1: '10', op2: '5', operator: '-', expected: '5' },
      { op1: '6', op2: '7', operator: '*', expected: '42' },
      { op1: '10', op2: '2', operator: '/', expected: '5' }
    ];

    testCases.forEach(({ op1, op2, operator, expected }) => {
      it(`应该正确执行${operator}运算`, async () => {
        mockCalculate.mockResolvedValueOnce({ result: expected });
        render(<Home />);

        fireEvent.change(screen.getByPlaceholderText('第一个数'), {
          target: { value: op1 }
        });
        fireEvent.change(screen.getByPlaceholderText('第二个数'), {
          target: { value: op2 }
        });
        fireEvent.change(screen.getByRole('combobox'), {
          target: { value: operator }
        });

        fireEvent.click(screen.getByText('计算'));

        await waitFor(() => {
          expect(mockCalculate).toHaveBeenCalledWith({
            operand1: op1,
            operand2: op2,
            operator
          });
          expect(screen.getByText(expected)).toBeInTheDocument();
        });
      });
    });
  });

  describe('错误处理测试', () => {
    it('应该处理无效输入', async () => {
      render(<Home />);

      fireEvent.change(screen.getByPlaceholderText('第一个数'), {
        target: { value: 'abc' }
      });
      fireEvent.click(screen.getByText('计算'));

      await waitFor(() => {
        expect(screen.getByText(ERROR_MESSAGES.INVALID_NUMBER)).toBeInTheDocument();
      });
    });

    it('应该处理除零错误', async () => {
      mockCalculate.mockRejectedValueOnce(new Error(ERROR_MESSAGES.DIVIDE_BY_ZERO));
      render(<Home />);

      fireEvent.change(screen.getByPlaceholderText('第一个数'), {
        target: { value: '10' }
      });
      fireEvent.change(screen.getByPlaceholderText('第二个数'), {
        target: { value: '0' }
      });
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: '/' }
      });

      fireEvent.click(screen.getByText('计算'));

      await waitFor(() => {
        expect(screen.getByText(ERROR_MESSAGES.DIVIDE_BY_ZERO)).toBeInTheDocument();
      });
    });

    it('应该处理服务器错误', async () => {
      mockCalculate.mockRejectedValueOnce(new Error('服务器错误'));
      render(<Home />);

      fireEvent.change(screen.getByPlaceholderText('第一个数'), {
        target: { value: '1' }
      });
      fireEvent.change(screen.getByPlaceholderText('第二个数'), {
        target: { value: '1' }
      });

      fireEvent.click(screen.getByText('计算'));

      await waitFor(() => {
        expect(screen.getByText(ERROR_MESSAGES.SERVER_ERROR)).toBeInTheDocument();
      });
    });
  });

  describe('特殊数值测试', () => {
    it('应该正确处理小数运算', async () => {
      render(<Home />);

      fireEvent.change(screen.getByPlaceholderText('第一个数'), {
        target: { value: '1.5' }
      });
      fireEvent.change(screen.getByPlaceholderText('第二个数'), {
        target: { value: '2.5' }
      });

      fireEvent.click(screen.getByText('计算'));

      await waitFor(() => {
        expect(mockCalculate).toHaveBeenCalledWith({
          operand1: '1.5',
          operand2: '2.5',
          operator: '+'
        });
      });
    });

    it('应该正确处理负数运算', async () => {
      render(<Home />);

      fireEvent.change(screen.getByPlaceholderText('第一个数'), {
        target: { value: '-10' }
      });
      fireEvent.change(screen.getByPlaceholderText('第二个数'), {
        target: { value: '-5' }
      });

      fireEvent.click(screen.getByText('计算'));

      await waitFor(() => {
        expect(mockCalculate).toHaveBeenCalledWith({
          operand1: '-10',
          operand2: '-5',
          operator: '+'
        });
      });
    });
  });
});