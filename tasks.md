## 运程管家 MVP 分步构建计划（可测试微任务）

> 说明：  
> - 一次只执行一个任务。  
> - 每个任务都能在完成后做「小范围验证」。  
> - 任务顺序从基础设施 → 后端 → 前端 → 集成 → 管理端。  

---

### 阶段 0：基础脚手架与环境（保证项目能跑起来）

**任务 0-1：初始化 Next.js + TypeScript 项目**
- 目标：在本地创建一个使用 App Router 的 Next.js 15 + TS 项目，`npm run dev` 可正常启动。
- 步骤要点：
  - 使用 `pnpm`/`npm`/`yarn` 任意一项初始化（如 `npx create-next-app@latest`，开启 TypeScript）。
  - 确认生成 `tsconfig.json`、`app/` 目录。
  - 运行开发服务器，在浏览器能看到默认首页。
- 验收方式：
  - `npm run dev` 启动成功，访问 `http://localhost:3000/` 正常展示默认页面。

**任务 0-2：集成 Tailwind CSS**
- 目标：在项目中正确配置 Tailwind，并在页面上看到样式生效。
- 步骤要点：
  - 安装 Tailwind 依赖，生成 `tailwind.config.ts`、`postcss.config.mjs`。
  - 在 `app/layout.tsx` 引入 `globals.css` 并配置基础样式。
  - 在首页加一个带 Tailwind class 的按钮进行测试。
- 验收方式：
  - 页面上的按钮样式（颜色、间距、圆角）明显来自 Tailwind。

**任务 0-3：集成 shadcn/ui 并生成第一个组件**
- 目标：完成 shadcn/ui 初始化，并生成一个 `Button` 组件用于后续复用。
- 步骤要点：
  - 安装 shadcn/ui CLI，执行初始化命令。
  - 生成 `components/ui/button.tsx`。
  - 在首页使用该 Button。
- 验收方式：
  - 页面中渲染的是 shadcn 的 Button，具有预期的 hover / focus 效果。

**任务 0-4：配置基础配色和圆角风格**
- 目标：将 Design.TXT 中的主色、辅色、背景色和圆角需求落地到 Tailwind/shadcn 主题。
- 步骤要点：
  - 在 `tailwind.config.ts` 或 CSS 变量中定义主色 `#3A5AFE`、辅色 `#7A8CFF`、背景 `#F6F7FB`。
  - 设置 shadcn button、card 等组件的默认圆角（如 `rounded-2xl`）。
- 验收方式：
  - 一个简单的测试页面中，Card/按钮使用主色、辅色，圆角为 12px 左右，背景为浅灰。

---

### 阶段 1：数据库与 Prisma（能连上 Supabase）

**任务 1-1：在 Supabase 创建 PostgreSQL 项目**
- 目标：在 Supabase 后台创建一个新项目，获得数据库连接串。
- 步骤要点：
  - 登录 Supabase，创建项目。
  - 在 Project Settings 中找到 `DATABASE_URL`（或等价连接串）。
- 验收方式：
  - 在本地记录下连接串（先不要提交到代码仓库），确认可用于后续 Prisma 配置。

**任务 1-2：添加 Prisma 并连接 Supabase**
- 目标：在项目中安装 Prisma，配置 schema，并连接 Supabase。
- 步骤要点：
  - 安装 Prisma 及相关依赖。
  - 运行 `npx prisma init`，生成 `prisma/schema.prisma` 和 `.env`。
  - 在 `.env` 中填入 Supabase 的 `DATABASE_URL`（本地测试用）。
- 验收方式：
  - 运行 `npx prisma db pull` 或简单的 `npx prisma migrate dev` 不报连接错误。

**任务 1-3：定义 User/Trip/TripImage 模型**
- 目标：在 Prisma schema 中按架构文档定义三个核心模型和枚举。
- 步骤要点：
  - 在 `schema.prisma` 中添加 `User`, `Trip`, `TripImage`, `Role`, `TripStatus`, `TripImageType`。
  - 确保字段类型和关系与架构文档保持一致。
- 验收方式：
  - 运行 `npx prisma validate` 无错误。

**任务 1-4：执行第一次数据库迁移**
- 目标：将 Prisma 模型迁移到 Supabase 数据库。
- 步骤要点：
  - 执行 `npx prisma migrate dev --name init_schema`。
  - 连接 Supabase 控制台查看表是否创建成功。
- 验收方式：
  - Supabase 中能看到 `User`, `Trip`, `TripImage` 三张表和相应列。

**任务 1-5：封装 PrismaClient 单例**
- 目标：创建 `lib/db/client.ts`，导出可复用的 PrismaClient 实例。
- 步骤要点：
  - 避免在 dev 环境重复实例化（常规的 `globalThis.prisma` 写法）。
  - 导出 `prisma` 对象供其他模块使用。
- 验收方式：
  - 写一个简单的测试 script（或 API route）调用 `prisma.$queryRaw\``SELECT 1\``，不报错即通过。

---

### 阶段 2：基础领域层与数据访问（Repo + Service 雏形）

**任务 2-1：创建 UserRepository**
- 目标：在 `lib/db/repositories/user-repository.ts` 中封装基础用户操作。
- 步骤要点：
  - 方法：`findByPhone(phone)`, `createUser(data)`, `upsertByPhone(data)` 等。
- 验收方式：
  - 写一个临时 API（或 script）调用 `upsertByPhone` 创建一个用户，然后用 `findByPhone` 查到该用户。

**任务 2-2：创建 TripRepository**
- 目标：在 `lib/db/repositories/trip-repository.ts` 中封装基础 Trip 操作。
- 步骤要点：
  - 方法示例：
    - `createTrip(data)`
    - `findTripsByDriverAndDateRange(driverId, from, to)`
    - `getMonthlySummary(driverId, month)`
- 验收方式：
  - 在测试 script 中：
    - 插入一条 Trip。
    - 再用 `findTripsByDriverAndDateRange` 读回这条记录。

**任务 2-3：创建 TripImageRepository**
- 目标：在 `lib/db/repositories/trip-image-repository.ts` 封装图片记录操作。
- 步骤要点：
  - 方法：`createImage(data)`, `findByTripId(tripId)`。
- 验收方式：
  - 插入一条 TripImage，并通过 `findByTripId` 查回。

**任务 2-4：实现 AuthService 的用户查找/创建能力**
- 目标：在 `lib/services/auth-service.ts` 中封装基于手机号的用户查找与创建逻辑。
- 步骤要点：
  - 使用 `UserRepository`，实现：
    - `findOrCreateUserByPhone(phone, name?)`。
- 验收方式：
  - 临时 API 调用该方法：
    - 若用户不存在则创建，存在则返回。
    - 多次调用不会创建重复用户。

---

### 阶段 3：认证与会话（手机号 + 验证码）

**任务 3-1：定义 Auth 相关类型与校验 Schema**
- 目标：在 `types/api.ts` 和 `lib/validators/auth-schemas.ts` 中定义登录相关类型和校验规则。
- 步骤要点：
  - 定义：
    - `LoginRequest { phone: string }`
    - `VerifyOtpRequest { phone: string; code: string; name?: string }`
  - 使用 zod 等库声明校验。
- 验收方式：
  - 单元测试或简单脚本验证：不合法的手机号/验证码会被 schema 拒绝。

**任务 3-2：实现 Session/JWT 工具（session.ts）**
- 目标：在 `lib/auth/session.ts` 中封装会话的签发与解析。
- 步骤要点：
  - 函数示例：
    - `createSession(user) -> { token or cookie string }`
    - `getUserFromRequest(request) -> User | null`
  - 使用一个简单的 JWT 或自定义签名方案。
- 验收方式：
  - 对同一用户：
    - 调用 `createSession` 获得 token。
    - 再通过 `getUserFromRequest` 能正确解析出用户信息。

**任务 3-3：实现权限守卫（guards.ts）**
- 目标：在 `lib/auth/guards.ts` 中实现基础守卫函数。
- 步骤要点：
  - `requireAuth(request)`：无用户则抛异常或返回特定错误。
  - `requireAdmin(user)`：user.role !== ADMIN 时拒绝。
- 验收方式：
  - 在临时 API 中使用守卫，未登录访问时返回 401，普通司机访问管理员接口时返回 403。

**任务 3-4：实现 POST /api/auth/login（生成验证码，先用伪实现）**
- 目标：完成 `app/api/auth/login/route.ts`，先只用假验证码（例如固定 `123456`）便于开发。
- 步骤要点：
  - 使用 `LoginRequest` 校验手机号。
  - 返回 `{ success: true, devCode: '123456' }`（开发环境）。
- 验收方式：
  - 使用 Postman 或浏览器 `fetch` 调用接口，返回 json 且包含 `devCode`。

**任务 3-5：实现 POST /api/auth/verify-otp（校验验证码 + 创建会话）**
- 目标：完成 `app/api/auth/verify-otp/route.ts`，使用固定验证码实现完整登录流程。
- 步骤要点：
  - 只接受 code === '123456'（后续再替换为真实短信逻辑）。
  - 调用 `AuthService.findOrCreateUserByPhone`。
  - 调用 `createSession` 写入 Cookie。
- 验收方式：
  - 请求成功后：
    - 返回当前用户信息。
    - 响应头带有 Set-Cookie（浏览器会自动保存）。

**任务 3-6：实现 GET /api/auth/me（返回当前登录用户）**
- 目标：完成 `app/api/auth/me/route.ts`。
- 步骤要点：
  - 使用 `getUserFromRequest` 或 `requireAuth` 获取当前用户。
- 验收方式：
  - 未登录访问返回 401。
  - 登录后访问返回当前用户 JSON。

---

### 阶段 4：司机「今日出车」最小闭环（后端 + 前端）

**任务 4-1：定义 Trip 相关类型与校验 Schema**
- 目标：在 `types/domain.ts` 和 `lib/validators/trip-schemas.ts` 中定义 `DriverData` 与创建 Trip 的入参类型。
- 步骤要点：
  - TypeScript 类型：
    - 与架构文档中的 `DriverData` / `ImageData` 对齐。
  - zod schema：
    - 必填字段：司机名、车牌号、日期、出发地、目的地、运输品类、车数、总吨数、状态。
- 验收方式：
  - 对不完整的 payload，schema 能给出具体错误信息。

**任务 4-2：实现 TripService.createTrip**
- 目标：在 `lib/services/trip-service.ts` 中实现创建出车记录逻辑。
- 步骤要点：
  - 入参：校验通过的 `DriverData` + 当前用户。
  - 内部：
    - 确保当前用户为司机。
    - 使用 `TripRepository` 创建 Trip。
    - 若包含图片 URL，则使用 `TripImageRepository` 创建图片记录。
- 验收方式：
  - 写一个临时 API 调用该 service，能在数据库中看到对应 Trip 和 TripImage。

**任务 4-3：实现 POST /api/trips/create**
- 目标：完成 `app/api/trips/create/route.ts`，将 HTTP 请求接入 TripService。
- 步骤要点：
  - 使用 `requireAuth` 获取当前用户。
  - 使用 `trip-schemas.ts` 校验请求体。
  - 调用 `TripService.createTrip`。
- 验收方式：
  - 登录后通过 Postman 调用，能创建一条 Trip 记录。

**任务 4-4：实现 GET /api/trips/list（按日期过滤 + 当前司机）**
- 目标：完成 `app/api/trips/list/route.ts` 的最小版本，只支持当前司机和指定日期。
- 步骤要点：
  - Query 参数：`date=YYYY-MM-DD`（可选）。
  - 使用 `requireAuth` 获取当前用户。
  - 调用 `TripRepository.findTripsByDriverAndDateRange`。
- 验收方式：
  - 创建几条不同日期的记录，查询时只返回对应日期的数据。

**任务 4-5：「今日出车」页面 UI 骨架**
- 目标：在 `app/home/today/page.tsx` 搭建基础布局（不连真实 API）。
- 步骤要点：
  - 上方：今天统计信息占位（用假数据）。
  - 下方：出车表单（使用 shadcn 的 Input/Select 等组件）。
- 验收方式：
  - 访问 `/home/today`，看到表单和占位信息，无 TypeScript 报错。

**任务 4-6：「今日出车」表单提交到 /api/trips/create**
- 目标：将前端表单与后端 Trip 创建接口打通。
- 步骤要点：
  - 在 Client Component 中监听提交，调用 `fetch('/api/trips/create')`。
  - 简单的 loading / 成功 / 错误提示。
- 验收方式：
  - 在页面提交一次表单，数据库中新增一条 Trip 记录。

**任务 4-7：「今日出车」列表展示当天记录**
- 目标：在页面中展示当天已经录入的出车记录列表。
- 步骤要点：
  - 使用 Server Component 或 Client fetch 调用 `/api/trips/list?date=today`。
  - 使用简洁的卡片组件展示每条记录。
- 验收方式：
  - 新增记录后刷新页面，列表立即显示该条记录。

---

### 阶段 5：当月总结与我的页面（司机视角）

**任务 5-1：实现 TripRepository.getMonthlySummary**
- 目标：实现按天聚合某司机当月出车数据的方法。
- 步骤要点：
  - 入参：`driverId`, `month(YYYY-MM)`。
  - 返回：数组，元素包含 `{ date, tripsCount, totalWeight }`。
- 验收方式：
  - 插入多天数据，调用该方法检查聚合结果是否正确。

**任务 5-2：实现 GET /api/trips/summary**
- 目标：对外暴露当月总结接口。
- 步骤要点：
  - Query 参数：`month=YYYY-MM`。
  - 使用 `requireAuth` 获取当前司机。
  - 调用 `getMonthlySummary`。
- 验收方式：
  - 调用接口能拿到指定月份每天的统计数组。

**任务 5-3：「当月总结」柱状图组件**
- 目标：在 `components/charts/` 创建可复用的柱状图组件。
- 步骤要点：
  - 接受 props：`data`（每日统计数组）。
  - 使用任意图表库或简单自绘（先用简单 div 模拟高度即可）。
- 验收方式：
  - 传入假数据，能正常以柱状图形式渲染。

**任务 5-4：「当月总结」页面接入真实数据**
- 目标：在 `app/home/monthly/page.tsx` 使用 `/api/trips/summary` 数据渲染图表。
- 步骤要点：
  - 默认展示当前月份。
  - 点击柱子时，记录被选中的日期（UI 层先简单高亮）。
- 验收方式：
  - 为不同日期插入测试数据，柱状图高度随数据变化。

**任务 5-5：点击柱子展示当日列表**
- 目标：完成点击柱状图某一天时在页面下方展示该日所有出车记录列表。
- 步骤要点：
  - 点击柱子时，触发请求 `/api/trips/list?date=选中日期`。
  - 使用列表卡片组件展示。
- 验收方式：
  - 在 UI 上点击不同柱子，下面展示对应日期的记录。

**任务 5-6：「我的」页面 Tabs + 列表**
- 目标：实现 `/home/me` 页面结构与基本交互。
- 步骤要点：
  - 顶部展示当前用户信息（从 `/api/auth/me` 获取）。
  - 使用 shadcn Tabs：`全部 / 正在运输 / 运输完成`。
  - 每个 Tab 下调用 `/api/trips/list?status=...` 展示对应记录。
- 验收方式：
  - 创建不同状态的 Trip，切换 Tab 时列表正确过滤。

---

### 阶段 6：Profile / History / 管理端最小版本

**任务 6-1：Profile 页面读取与更新姓名**
- 目标：在 `/profile` 页面读取当前用户信息并允许修改姓名。
- 步骤要点：
  - 显示当前姓名、电话（只读）。
  - 添加更新姓名的表单 + API（如 `PATCH /api/users/me`）。
- 验收方式：
  - 成功修改姓名后，再次刷新页面仍显示新姓名。

**任务 6-2：History 页面按时间倒序列表**
- 目标：在 `/history` 页面展示当前司机所有历史出车记录。
- 步骤要点：
  - 调用 `/api/trips/list`，默认不加过滤，按日期倒序。
  - 支持基础的分页或「加载更多」。
- 验收方式：
  - 能看到过去所有记录，按时间从新到旧排序。

**任务 6-3：管理员查询全部 Trip 的接口**
- 目标：扩展 `/api/trips/list` 或新增 `/api/admin/trips`，支持管理员查看所有司机数据。
- 步骤要点：
  - 使用 `requireAdmin` 校验角色。
  - 支持 query 参数：`driverId?`, `status?`, `from?`, `to?`。
- 验收方式：
  - 管理员用户可拉取所有 Trip，司机用户访问该接口则被拒绝。

**任务 6-4：管理员后台页面基础表格**
- 目标：在 `/admin` 页面实现最小可用的记录表格。
- 步骤要点：
  - 顶部筛选区：司机下拉（可先用假数据）、状态、日期范围。
  - 下方表格：展示 Trip 记录行。
- 验收方式：
  - 根据不同筛选条件重新请求数据，表格内容随之变化。

**任务 6-5：管理员查看单条记录详情（含图片）**
- 目标：在 `/admin` 页面中，点击某一行打开详情抽屉或弹窗。
- 步骤要点：
  - 详情中展示所有字段 + 已上传图片预览。
- 验收方式：
  - 点击任一记录行，能看到详情和图片。

---

### 阶段 7：图片上传流程 MVP

**任务 7-1：选择对象存储方案并配置 SDK**
- 目标：确定使用 Supabase Storage 或其他对象存储，并在项目中配置客户端。
- 步骤要点：
  - 在 `lib/config/env.ts` 中添加相关环境变量（如存储桶名称）。
  - 在 `lib/utils` 中封装一个简单上传工具。
- 验收方式：
  - 使用脚本/临时 API 将本地一张图片上传到存储桶，获得可访问 URL。

**任务 7-2：实现 /api/trips/upload-image 与存储打通**
- 目标：完成真正可用的图片上传接口。
- 步骤要点：
  - 解析 `multipart/form-data`。
  - 使用上一步封装的上传工具，将文件上传到对象存储。
  - 返回 `imageUrl`。
- 验收方式：
  - 通过 Postman 上传图片，接口返回的 URL 可以在浏览器直接访问。

**任务 7-3：「今日出车」表单接入图片上传**
- 目标：将前端图片上传组件接入 `/api/trips/upload-image`。
- 步骤要点：
  - 出发地/目的地各一个上传按钮。
  - 上传成功后，将返回的 `imageUrl` 存入本地表单状态。
  - 在提交 `/api/trips/create` 时携带这两个 URL。
- 验收方式：
  - 提交有图片的出车记录后，在管理员详情页中能看到图片预览。

---

### 阶段 8：Vercel + Supabase 部署验证

**任务 8-1：将项目推到代码仓库**
- 目标：在 GitHub/GitLab 创建仓库并推送当前项目。
- 步骤要点：
  - 初始化 git。
  - 创建远程仓库并推送。
- 验收方式：
  - 远程仓库能正常查看所有代码。

**任务 8-2：在 Vercel 创建项目并连接仓库**
- 目标：在 Vercel 面板中创建项目并关联刚刚的仓库。
- 步骤要点：
  - 选择正确的根目录。
  - 使用默认的 Next.js 构建设置。
- 验收方式：
  - 首次部署完成，能打开 Vercel 提供的预览域名看到首页。

**任务 8-3：在 Vercel 配置环境变量并连上 Supabase**
- 目标：在 Vercel 环境中正确配置 `DATABASE_URL` 和认证相关变量。
- 步骤要点：
  - 将 Supabase 的连接串设置为 `DATABASE_URL`。
  - 设置 JWT secret 等（与本地保持一致）。
- 验收方式：
  - 再次部署后，线上环境能正常执行简单的用户创建/Trip 创建操作，无数据库连接错误。

**任务 8-4：线上环境端到端验证 MVP**
- 目标：在 Vercel 部署的线上环境上完成一次完整流程。
- 流程：
  - 新用户通过手机号 + 测试验证码登录。
  - 在「今日出车」录入一条含图片的出车记录。
  - 在「当月总结」中看到统计柱状图反映这条记录。
  - 在「我的」/「历史记录」中看到列表。
  - 使用管理员账号在 `/admin` 查看该记录详情。
- 验收方式：
  - 整个链路无严重错误，数据在 Supabase 中可查，图片可正常访问。

### CODING PROTOCOL ###
开发守则：
- 严格用最少的代码完成当前任务
- 不进行大规模改动
- 不做无关编辑，专注于你正在开发的任务
- 代码必须精确、模块化、可测试
- 不破坏现有功能
- 如果需要我做任何配置（例如Supabase/AWS），请明确告诉我
	