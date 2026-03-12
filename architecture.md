## 运程管家 · 司机出车记录系统架构设计

本架构设计以 **Next.js 15 + TypeScript** 为基础，前后端同仓、同技术栈，使用 **shadcn/ui** 构建 UI，使用 **Supabase PostgreSQL** 作为数据库，部署在 **Vercel**。

---

## 1. 顶层架构概览

- **客户端（浏览器/移动 Web）**
  - 使用 Next.js App Router 的 React 组件渲染 UI。
  - 与后端交互方式：
    - Server Components 直接在服务端取数渲染。
    - `fetch` 调用 Next.js Route Handlers（`app/api/**`）。
- **Web 应用服务（Next.js 应用）**
  - 路由和 UI：`app/` 目录。
  - API 层：`app/api/**/route.ts`（基于 Next.js Route Handlers）。
  - 领域逻辑层：`lib/services/**`。
  - 数据访问层：`lib/db/**` 使用 Prisma 连接 Supabase PostgreSQL。
  - 认证与授权：`lib/auth/**`，手机号 + 验证码登录，Session/JWT 存在 Cookie 中。
- **数据库与存储**
  - Supabase PostgreSQL：存储用户、出车记录、图片信息等业务数据。
  - 对象存储（Supabase Storage / 其他）：存储上传图片文件，仅在数据库中保存访问 URL。
- **部署**
  - 整个 Next.js 项目部署在 Vercel 上，通过环境变量连接 Supabase。

---

## 2. 文件与文件夹结构

> 下面结构以当前空文件夹为项目根目录（project root），所有路径均相对该根目录。

```plaintext
.
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  ├─ home/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  ├─ today/
│  │  │  └─ page.tsx
│  │  ├─ monthly/
│  │  │  └─ page.tsx
│  │  └─ me/
│  │     └─ page.tsx
│  ├─ profile/
│  │  └─ page.tsx
│  ├─ history/
│  │  └─ page.tsx
│  ├─ admin/
│  │  └─ page.tsx
│  └─ api/
│     ├─ auth/
│     │  ├─ login/route.ts
│     │  ├─ verify-otp/route.ts
│     │  └─ me/route.ts
│     └─ trips/
│        ├─ create/route.ts
│        ├─ list/route.ts
│        ├─ summary/route.ts
│        └─ upload-image/route.ts
│
├─ components/
│  ├─ ui/                    # shadcn/ui 生成组件（Button、Input、Dialog 等）
│  ├─ layout/                # 布局相关组件（导航栏、TabBar、PageShell 等）
│  ├─ trip/                  # 出车表单、出车卡片等业务组件
│  └─ charts/                # 当月总结用的柱状图等图表组件
│
├─ lib/
│  ├─ db/
│  │  ├─ client.ts           # PrismaClient 单例，连接 Supabase PostgreSQL
│  │  └─ repositories/       # 领域仓储（UserRepo、TripRepo 等）
│  ├─ services/
│  │  ├─ auth-service.ts     # 登录、验证码校验、用户查找/创建
│  │  └─ trip-service.ts     # 出车记录增删改查、统计汇总
│  ├─ auth/
│  │  ├─ session.ts          # 读取/写入 Session/JWT，封装 cookie 操作
│  │  └─ guards.ts           # 权限校验（司机/管理员）辅助函数
│  ├─ validators/
│  │  ├─ auth-schemas.ts     # 登录/验证码接口的参数校验（zod 等）
│  │  └─ trip-schemas.ts     # 出车数据的参数校验
│  ├─ config/
│  │  ├─ env.ts              # 环境变量读取与校验（Supabase、密钥等）
│  │  └─ constants.ts        # 角色枚举、状态枚举等常量
│  └─ utils/
│     ├─ dates.ts            # 日期范围、月份计算工具
│     ├─ numbers.ts          # 吨数/车数计算工具
│     └─ api-helpers.ts      # API 返回格式、错误处理辅助
│
├─ prisma/
│  └─ schema.prisma          # Prisma 数据模型（User、Trip、TripImage 等）
│
├─ public/
│  └─ (static assets)        # 静态资源：logo、占位图、图标等
│
├─ styles/
│  ├─ globals.css
│  └─ tailwind.css
│
├─ types/
│  ├─ domain.ts              # 领域 TS 类型（DriverData、ImageData 等）
│  └─ api.ts                 # API 请求/响应类型
│
├─ architecture.md           # 本架构文档
├─ package.json
├─ tsconfig.json
├─ next.config.mjs
├─ tailwind.config.ts
├─ postcss.config.mjs
└─ README.md
```

---

## 3. 各部分职责说明

### 3.1 `app/`（路由与页面）

- `app/layout.tsx`
  - 应用级布局，注入全局样式、字体、基础 UI（如全局 Toaster、主题 Provider）。
- `app/page.tsx`
  - 根路由 `/`，展示手机号登录/验证码输入界面，登录成功后重定向到 `/home`。
- `app/home/layout.tsx`
  - 司机主区域布局：
    - 顶部：头像入口（进入 Profile/History）。
    - 中部：渲染当前 Tab 内容。
    - 底部：TabBar（今日出车/当月总结/我的）。
- `app/home/today/page.tsx`
  - 「今日出车」页面，包含：
    - 今日数据概览（卡片 + 简单图表）。
    - 出车录入表单（含图片上传）。
    - 当天已提交记录列表。
- `app/home/monthly/page.tsx`
  - 「当月总结」页面：
    - 月份选择控件。
    - 当月柱状图。
    - 点击某天查看该日所有出车记录列表。
- `app/home/me/page.tsx`
  - 「我的」页面：
    - 显示电话、姓名、角色。
    - Tabs：全部 / 运输中 / 已完成，对应出车记录列表。
    - 入口：历史记录、退出登录等。
- `app/profile/page.tsx`
  - 个人中心：编辑司机姓名等基础信息。
- `app/history/page.tsx`
  - 历史记录：按时间轴或列表展示所有历史出车，支持筛选。
- `app/admin/page.tsx`
  - 管理后台页面：管理员查看所有司机记录，提供筛选和统计。

### 3.2 `app/api/**`（后端 API 层）

- `app/api/auth/login/route.ts`
  - `POST /api/auth/login`：根据手机号生成验证码，调用短信服务发送，或在开发环境直接返回验证码。
- `app/api/auth/verify-otp/route.ts`
  - `POST /api/auth/verify-otp`：校验验证码，创建或查找用户，生成 Session/JWT，写入 Cookie。
- `app/api/auth/me/route.ts`
  - `GET /api/auth/me`：返回当前登录用户信息（司机/管理员）。
- `app/api/trips/create/route.ts`
  - `POST /api/trips/create`：创建新的出车记录，写入 `Trip` 和 `TripImage` 数据。
- `app/api/trips/list/route.ts`
  - `GET /api/trips/list`：根据日期、状态、司机等条件查询出车记录。
- `app/api/trips/summary/route.ts`
  - `GET /api/trips/summary`：按天聚合统计当月出车次数、总吨数等，用于柱状图。
- `app/api/trips/upload-image/route.ts`
  - `POST /api/trips/upload-image`：接收表单文件，上传到对象存储，返回可访问的 `imageUrl`。

> 这些 Route Handlers 只做：
> - 参数解析与校验（调用 `lib/validators`）。
> - 调用 `lib/services` 中的业务逻辑。
> - 统一格式返回结果（调用 `lib/utils/api-helpers.ts`）。

### 3.3 `components/`（UI 组件层）

- `components/ui/`
  - 由 shadcn/ui 生成的基础组件，如 `Button`, `Input`, `Select`, `Tabs`, `Dialog` 等。
- `components/layout/`
  - 布局级组件，如顶部导航、底部 TabBar、通用 Page 容器。
- `components/trip/`
  - 出车业务组件：出车表单、出车记录卡片、状态 Tag 等。
- `components/charts/`
  - 图表组件：当月总结柱状图、当日出车分布等。

### 3.4 `lib/`（领域逻辑与基础设施）

- `lib/db/client.ts`
  - 封装 PrismaClient 单例，从 `process.env.DATABASE_URL`（Supabase 提供）创建数据库连接。
- `lib/db/repositories/**`
  - 每个核心实体一个 Repository，例如：
    - `user-repository.ts`：封装用户增删改查。
    - `trip-repository.ts`：封装出车记录查询、按日期聚合统计等。
- `lib/services/auth-service.ts`
  - 业务逻辑：
    - 生成/校验短信验证码（可对接 Supabase 或第三方短信网关）。
    - 创建/查找用户。
    - 登录成功后创建 Session/JWT。
- `lib/services/trip-service.ts`
  - 业务逻辑：
    - 新建出车记录（含校验司机身份）。
    - 修改状态（运输中 → 已完成）。
    - 按条件分页查询。
    - 按月/天维度聚合统计。
- `lib/auth/session.ts`
  - 管理 Session/JWT：
    - 从请求中解析 Cookie，读取当前用户。
    - 写入或清除 Session Cookie。
- `lib/auth/guards.ts`
  - 封装权限判断：
    - `requireAuth()`：未登录则抛错/重定向。
    - `requireDriver()` / `requireAdmin()`：限制接口或页面访问。
- `lib/validators/**`
  - 使用 zod 等库定义 API 入参/出参的 schema。
- `lib/config/env.ts`
  - 统一读取和校验环境变量：Supabase URL、Key、JWT Secret 等。

### 3.5 其他目录

- `prisma/schema.prisma`
  - 定义 `User`, `Trip`, `TripImage` 等数据模型及枚举（司机/管理员角色、运输状态、图片类型等）。
- `types/domain.ts`
  - 领域模型 TypeScript 类型，如 `DriverData`, `ImageData`，与数据库模型解耦，适合前后端共享。
- `types/api.ts`
  - 各 API 路由的请求体与响应体类型定义，方便前端强类型调用。

---

## 4. 状态存储位置设计

### 4.1 持久化状态（数据库）

全部业务关键数据持久化在 **Supabase PostgreSQL** 中：

- 用户（司机/管理员）：
  - `User` 表：`id`, `phone`, `name`, `role`, `createdAt`, `updatedAt`。
- 出车记录：
  - `Trip` 表：`driverId`, `driverName`, `licensePlate`, `date`, `departureLocation`, `destination`, `cargoType`, `numberOfLoads`, `totalWeight`, `status` 等。
- 图片记录：
  - `TripImage` 表：`tripId`, `type`, `imageUrl`, `uploadTime`。
- 短信验证码（可选表）：
  - 例如 `OtpCode` 表：`phone`, `code`, `expiredAt`，用于服务端校验登录验证码。

### 4.2 会话状态（Session/JWT）

- **存储位置**：HTTP-only Cookie。
- **内容**：
  - 用户 ID。
  - 角色（司机/管理员）。
  - 过期时间等。
- **读取方式**：
  - 通过 `lib/auth/session.ts` 在 Route Handlers 和 Server Components 中读取当前用户。

### 4.3 UI/交互状态（前端）

- 短期表单状态、当前选中的 Tab、当前选中的日期/月份等：
  - 使用 React 组件内状态（`useState`）或基础 Context。
- 网络请求获取的服务端数据：
  - 在 Server Components 中直接获取并渲染，或在 Client Components 中使用 `useSWR` 等工具缓存。

### 4.4 缓存层（可选）

- 初期可以直接从数据库读取，不单独引入 Redis 等缓存。
- 后期如需优化可在：
  - Vercel Edge / Next.js 中使用数据缓存。
  - 对统计类查询添加缓存失效策略。

---

## 5. 服务与模块之间的连接方式

### 5.1 客户端 → Next.js API（Route Handlers）

- 页面/组件通过两种方式调用后端：
  1. 在 Server Components 中直接调用 `lib/services/**`（服务端渲染，减少一次 HTTP 跳转）。
  2. 在 Client Components 中通过 `fetch('/api/...')` 调用 `app/api/**/route.ts`。
- 所有对数据库有写操作的行为（如创建出车记录）推荐通过 Route Handlers 或 Server Actions 进行，避免在客户端暴露敏感逻辑。

### 5.2 Route Handlers → 领域服务层（`lib/services`）

- 每个 API Handler 只负责：
  - 解析 HTTP 请求。
  - 调用对应 Service 函数。
  - 将结果转换为 HTTP 响应。
- 真实业务规则集中在 `lib/services`：
  - 例如 `trip-service.createTrip(input, currentUser)` 内部会：
    - 校验当前用户是否司机。
    - 校验输入参数合法性。
    - 调用 `TripRepository` 写入数据库。

### 5.3 领域服务层 → 数据访问层（`lib/db` + Prisma）

- `lib/services` 不直接操作 PrismaClient，而是调用 `lib/db/repositories/**` 提供的仓储方法：
  - 如 `TripRepository.create()`、`TripRepository.findByDateRange()`。
- 仓储层封装了所有具体 SQL 查询/ORM 操作，使业务逻辑不依赖数据库具体实现。

### 5.4 与 Supabase PostgreSQL 的连接

- 在 `lib/db/client.ts` 中：
  - 从 `process.env.DATABASE_URL` 读取 Supabase 提供的连接串。
  - 创建并导出 PrismaClient 单例。
- Prisma 迁移与生成：
  - 本地开发时使用 `npx prisma migrate dev`。
  - 部署前使用 `npx prisma migrate deploy` 同步到 Supabase。

### 5.5 与对象存储/图片服务的连接

- 上传图片流程：
  1. 前端通过 `POST /api/trips/upload-image` 发送 `multipart/form-data`。
  2. Route Handler 解析文件并调用对象存储 SDK（如 Supabase Storage 或 S3 客户端）。
  3. 上传成功后返回图片的公开访问 URL。
  4. 前端在创建/更新 Trip 时，将该 URL 作为 `images` 字段的一部分提交。
- 数据库中只保存 `imageUrl` 和元数据，不直接保存二进制内容。

### 5.6 认证/授权链路

1. **登录**
   - 用户在登录页提交手机号 → `POST /api/auth/login` 生成验证码并发送。
   - 用户输入验证码 → `POST /api/auth/verify-otp`：
     - 校验成功后，通过 `auth-service` 创建或查找用户。
     - 生成 Session/JWT，并使用 `session.ts` 写入 Cookie。
2. **访问受保护资源**
   - 在 API Handler 或 Server Component 中，调用 `requireAuth()` 从 Cookie 中解析当前用户，没有则返回 401 或重定向到登录。
   - 需要管理员权限的路由调用 `requireAdmin()`，司机访问则返回 403。

---

## 6. 总结

本架构将 **Next.js 15 + TypeScript** 作为统一技术栈，前后端同仓，利用 App Router 的 Server Components 和 Route Handlers 简化数据流动；通过 **Supabase PostgreSQL + Prisma** 统一管理持久数据；利用分层目录划分页面/UI、API、领域服务、数据访问和工具层，使司机端和管理员端都能在同一项目中清晰地扩展和维护。该架构完全适配 Vercel 部署和 Supabase 托管数据库，方便快速上线和迭代。

