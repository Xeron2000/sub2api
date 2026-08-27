.PHONY: build build-backend build-frontend test test-backend test-frontend test-frontend-critical

# frontend-new: all vitest are critical (no legacy subset); keep variable for CI compatibility
FRONTEND_CRITICAL_VITEST :=

# 一键编译前后端
build: build-backend build-frontend

# 编译后端（复用 backend/Makefile）
build-backend:
	@$(MAKE) -C backend build

# 编译前端（需要已安装依赖）— 默认 React (frontend-new)
build-frontend:
	@pnpm --dir frontend-new run build
	@rm -rf backend/internal/web/dist
	@mkdir -p backend/internal/web/dist
	@cp -r frontend-new/dist/client/* backend/internal/web/dist/
	@cp backend/internal/web/dist/_shell.html backend/internal/web/dist/index.html

# legacy Vue 构建（rollback/reference）
build-frontend-legacy:
	@pnpm --dir frontend run build

# 运行测试（后端 + 前端）
test: test-backend test-frontend

test-backend:
	@$(MAKE) -C backend test

test-frontend:
	@pnpm --dir frontend-new run lint
	@pnpm --dir frontend-new run typecheck
	@pnpm --dir frontend-new run test

test-frontend-critical:
	@pnpm --dir frontend-new test
