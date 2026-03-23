import { useState, useEffect, useRef } from "react";
import { Renderer, VisibilityProvider, StateProvider, ActionProvider, ValidationProvider } from "@json-render/react";
import { registry } from "./registry";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Element {
  type: string;
  props: Record<string, any>;
  children?: string[];
}

interface Spec {
  root: string;
  elements: Record<string, Element>;
}

const initialSpec: Spec = {
  root: "form-1",
  elements: {
    "form-1": {
      type: "Form",
      props: {},
      children: [],
    },
  },
};

// 深度清理并校验残缺的 Spec 结构，防止由于 props 缺失或 children 引用无效导致的渲染引擎崩溃
function cleanSpec(spec: any): Spec | null {
  if (!spec || typeof spec !== 'object') return null;
  if (!spec.root || !spec.elements || typeof spec.elements !== 'object') return null;

  const cleanElements: Record<string, Element> = {};
  for (const key in spec.elements) {
    const el = spec.elements[key];
    // 确保 element 存在且拥有 type，否则判定为尚未完整流式传输出来的残缺节点
    if (el && typeof el === 'object' && typeof el.type === 'string') {
      cleanElements[key] = {
        type: el.type,
        props: (el.props && typeof el.props === 'object') ? el.props : {},
        children: Array.isArray(el.children) ? el.children : []
      };
    }
  }

  // 剔除 children 中指向尚未传输过来的节点的引用
  for (const key in cleanElements) {
    const el = cleanElements[key];
    if (el.children) {
      el.children = el.children.filter((childId: string) => cleanElements[childId]);
    }
  }

  return { root: spec.root, elements: cleanElements };
}

// 简单的 Partial JSON 修复工具，用于在流式传输未完成时，补全闭合括号以便 JSON.parse 能够解析
function repairJSON(str: string) {
  let out = '';
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      out += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      out += char;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      out += char;
      continue;
    }
    if (!inString) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') stack.pop();
    }
    out += char;
  }

  // 补全引号
  if (escape) out = out.slice(0, -1);
  if (inString) out += '"';

  out = out.trim();
  // 移除尾部多余的逗号
  if (out.endsWith(',')) out = out.slice(0, -1);
  // 如果以冒号结尾，补全 null 防止语法错误
  if (out.endsWith(':')) out += 'null';

  // 补全所有未闭合的括号
  while (stack.length > 0) {
    out += stack.pop();
  }

  return out;
}

export function StreamingForm() {
  const [spec, setSpec] = useState<Spec>(initialSpec);
  const [rawText, setRawText] = useState("");
  const bufferRef = useRef("");

  useEffect(() => {
    // 建立 SSE 连接
    const eventSource = new EventSource('/api/stream-form');

    eventSource.onmessage = (event) => {
      // 每次收到的 data 只是 JSON 字符串的一个小切片（如 3个字符）
      const chunk = JSON.parse(event.data);
      bufferRef.current += chunk;
      
      // 更新原始文本状态，让用户能直观看到打字机效果
      setRawText(bufferRef.current);
      
      try {
        // 尝试修复并解析部分 JSON
        const repaired = repairJSON(bufferRef.current);
        const parsed = JSON.parse(repaired);
        
        // 深度清洗不完整的数据结构，防止传递给渲染引擎时报错
        const cleaned = cleanSpec(parsed);
        if (cleaned) {
          setSpec(cleaned);
        }
      } catch {
        // 如果某个瞬间的内容确实无法修复为合法 JSON（比如布尔值正好卡在一半 "tr"），则忽略本次渲染，等待下一个切片到来
      }
    };

    eventSource.addEventListener('done', () => {
      eventSource.close();
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="container mx-auto p-8 flex flex-col md:flex-row gap-8">
      {/* 左侧：表单渲染区域 */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">流式表单渲染器</h1>
        <div className="mb-4 text-sm text-gray-500">
          模拟 LLM 流式传输...
        </div>
        <StateProvider>
          <VisibilityProvider>
            <ActionProvider>
              <ValidationProvider>
                <Renderer spec={spec} registry={registry} />
              </ValidationProvider>
            </ActionProvider>
          </VisibilityProvider>
        </StateProvider>
      </div>
      
      {/* 右侧：原始 JSON 数据流展示区域 */}
      <div className="flex-1 max-w-lg">
        <h2 className="text-lg font-bold mb-2 text-gray-700">当前流式传输的 JSON 数据</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto h-[600px] font-mono text-xs whitespace-pre-wrap shadow-inner">
          {rawText}
          <span className="animate-pulse">_</span>
        </div>
      </div>
    </div>
  );
}
