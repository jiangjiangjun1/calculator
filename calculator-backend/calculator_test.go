package main

import (
	"context"
	"testing"


	"calculator-backend/calculator/v1"
	"connectrpc.com/connect"
	"github.com/stretchr/testify/require"
)

// 测试服务结构体需要实现完整的 Connect 服务接口
type calculatorServiceServer struct {
	CalculatorHandler
}

// 如果生成代码中有嵌套接口需要实现，添加空方法
// func (s *calculatorServiceServer) SomeOtherMethod() {}

func TestCalculate(t *testing.T) {
	s := &calculatorServiceServer{}

	tests := []struct {
		name        string
		req         *calculatorv1.CalculateRequest
		want        float64
		expectError bool
		errorCode   connect.Code // 新增错误代码验证
	}{
		{"Addition", &calculatorv1.CalculateRequest{Operand1: 1, Operand2: 2, Operator: "+"}, 3, false, 0},
		{"Subtraction", &calculatorv1.CalculateRequest{Operand1: 5, Operand2: 2, Operator: "-"}, 3, false, 0},
		{"Multiplication", &calculatorv1.CalculateRequest{Operand1: 2, Operand2: 3, Operator: "*"}, 6, false, 0},
		{"Division", &calculatorv1.CalculateRequest{Operand1: 6, Operand2: 2, Operator: "/"}, 3, false, 0},
		{"DivideByZero", &calculatorv1.CalculateRequest{Operand1: 1, Operand2: 0, Operator: "/"}, 0, true, connect.CodeInvalidArgument},
		{"UnknownOperator", &calculatorv1.CalculateRequest{Operand1: 1, Operand2: 1, Operator: "%"}, 0, true, connect.CodeInvalidArgument},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 创建 Connect 请求对象
			connectReq := connect.NewRequest(tt.req)

			// 调用服务方法
			resp, err := s.Calculate(context.Background(), connectReq)

			// 错误处理验证
			if tt.expectError {
				require.Error(t, err)
				if connectErr, ok := err.(*connect.Error); ok {
					require.Equal(t, tt.errorCode, connectErr.Code())
				}
				return
			}

			// 正常结果验证
			require.NoError(t, err)
			require.Equal(t, tt.want, resp.Msg.Result) // 访问 Msg 字段获取响应体
		})
	}
}