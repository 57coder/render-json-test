import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const mockStreamPlugin = () => ({
  name: 'mock-stream',
  configureServer(server) {
    server.middlewares.use('/api/stream-form', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 这是最终生成的完整 Form 结构
      const finalSpec = {
        root: "form-1",
        elements: {
          "form-1": {
            type: "Form",
            props: { title: "用户注册", description: "请填写您的详细信息。" },
            children: ["input-name", "input-email", "select-role", "btn-submit"],
          },
          "input-name": {
            type: "Input",
            props: { label: "姓名", name: "fullName", placeholder: "请输入您的姓名" },
          },
          "input-email": {
            type: "Input",
            props: { label: "邮箱", name: "email", type: "email", placeholder: "请输入您的邮箱地址" },
          },
          "select-role": {
            type: "Select",
            props: {
              label: "角色",
              name: "role",
              options: [
                { label: "开发人员", value: "dev" },
                { label: "设计师", value: "design" },
                { label: "项目管理", value: "pm" },
              ],
            },
          },
          "btn-submit": {
            type: "Button",
            props: { label: "注册", action: "submit" },
          },
        },
      };

      // 模拟大模型：将 JSON 对象转为带格式的字符串，然后切分成几个字符的 chunk
      const jsonStr = JSON.stringify(finalSpec, null, 2);
      const chunks = [];
      const chunkSize = 3; // 每次蹦 3 个字符
      for (let i = 0; i < jsonStr.length; i += chunkSize) {
        chunks.push(jsonStr.slice(i, i + chunkSize));
      }

      let currentChunkIndex = 0;

      const timer = setInterval(() => {
        if (currentChunkIndex >= chunks.length) {
          clearInterval(timer);
          res.write('event: done\ndata: {}\n\n');
          res.end();
          return;
        }

        const chunk = chunks[currentChunkIndex];
        // 将 chunk 作为普通的字符串片段发送
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        currentChunkIndex++;
      }, 30); // 30ms 的打字间隔

      req.on('close', () => {
        clearInterval(timer);
      });
    });
  }
});

export default defineConfig({
  plugins: [react(), tailwindcss(), mockStreamPlugin()],
})
