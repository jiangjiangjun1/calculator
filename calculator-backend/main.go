package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	pb "calculator-backend/calculator/v1"
	"calculator-backend/calculator/v1/calculatorv1connect"
	"connectrpc.com/connect" // 添加 Connect 核心依赖
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

type CalculatorHandler struct{}

// 修改方法签名，使用 Connect 的请求/响应类型
func (s *CalculatorHandler) Calculate(
	ctx context.Context,
	req *connect.Request[pb.CalculateRequest], // 使用 Connect 的请求包装类型
) (*connect.Response[pb.CalculateResponse], error) {
	// 从请求中获取原始消息
	request := req.Msg

	fmt.Println("服务端被调用了")
	fmt.Println("request.Operator:", request.Operator)
	fmt.Println("request.Operand1:", request.Operand1)
	fmt.Println("request.Operand2:", request.Operand2)

	var result float64
	switch request.Operator {
	case "+":
		result = request.Operand1 + request.Operand2
	case "-":
		result = request.Operand1 - request.Operand2
	case "*":
		result = request.Operand1 * request.Operand2
	case "/":
		if request.Operand2 == 0 {
			// 使用 Connect 的错误类型返回更丰富的错误信息
			return nil, connect.NewError(
				connect.CodeInvalidArgument,
				fmt.Errorf("division by zero"),
			)
		}
		result = request.Operand1 / request.Operand2
	default:
		return nil, connect.NewError(
			connect.CodeInvalidArgument,
			fmt.Errorf("unknown operator: %s", request.Operator),
		)
	}

	// 使用 Connect 的响应包装类型
	return connect.NewResponse(&pb.CalculateResponse{
		Result: result,
	}), nil
}

func main() {
    calculator := &CalculatorHandler{}
    mux := http.NewServeMux()

    // 注册服务时类型现在匹配了
    path, handler := calculatorv1connect.NewCalculatorServiceHandler(calculator)

    // 配置 CORS
    corsMiddleware := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost:3000"},
        AllowedMethods:   []string{"POST", "GET", "OPTIONS", "PUT", "DELETE"},
        AllowedHeaders:   []string{
            "Accept",
            "Content-Type",
            "Content-Length",
            "Accept-Encoding",
            "Authorization",
            "Connect-Protocol-Version",
            "Connect-Timeout-Ms",
            "X-Requested-With",
        },
        ExposedHeaders:   []string{"Connect-Protocol-Version"},
        AllowCredentials: true,
    })

    // 只注册一次处理器，使用 CORS 包装后的处理器
    wrappedHandler := corsMiddleware.Handler(handler)
    mux.Handle(path, wrappedHandler)

    // 配置 HTTP/2 服务器
    h2s := &http2.Server{}
    finalHandler := h2c.NewHandler(mux, h2s)

    log.Println("Connect 服务运行在 :8088")
    if err := http.ListenAndServe(":8088", finalHandler); err != nil {
        log.Fatalf("服务启动失败: %v", err)
    }
}
