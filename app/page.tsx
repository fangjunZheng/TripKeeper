import { redirect } from "next/navigation";

export default function HomePage() {
  // 司机首页：直接进入「今日出车」表单页面
  redirect("/home/today");
}

