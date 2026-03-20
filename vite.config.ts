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
            props: { title: "User Registration", description: "Fill in your details below." },
            children: ["input-name", "input-email", "select-role", "btn-submit"],
          },
          "input-name": {
            type: "Input",
            props: { label: "Full Name", name: "fullName", placeholder: "John Doe" },
          },
          "input-email": {
            type: "Input",
            props: { label: "Email Address", name: "email", type: "email", placeholder: "john@example.com" },
          },
          "select-role": {
            type: "Select",
            props: {
              label: "Role",
              name: "role",
              options: [
                { label: "Developer", value: "dev" },
                { label: "Designer", value: "design" },
                { label: "Manager", value: "pm" },
              ],
            },
          },
          "btn-submit": {
            type: "Button",
            props: { label: "Register Now", action: "submit" },
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
