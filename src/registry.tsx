import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";

export const { registry } = defineRegistry(catalog, {
  components: {
    Form: ({ props, children }) => (
      <div className="p-4 border rounded shadow-md max-w-md mx-auto bg-white">
        <h2 className="text-xl font-bold mb-2">{props.title}</h2>
        {props.description && <p className="text-gray-600 mb-4">{props.description}</p>}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {children}
        </form>
      </div>
    ),
    Input: ({ props }) => (
      <div className="flex flex-col">
        <label className="mb-1 font-medium">{props.label}</label>
        <input
          type={props.type}
          name={props.name}
          placeholder={props.placeholder}
          className="border rounded p-2"
        />
      </div>
    ),
    Select: ({ props }) => (
      <div className="flex flex-col">
        <label className="mb-1 font-medium">{props.label}</label>
        <select name={props.name} className="border rounded p-2">
          {(props.options || []).map((opt: { label: string; value: string }) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    ),
    Button: ({ props, emit }) => (
      <button
        onClick={() => {
          console.log('点击了');
          emit(props.action)
        }}
        className={`px-4 py-2 rounded text-white ${
          props.variant === "secondary" ? "bg-gray-500 hover:bg-gray-600" : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {props.label}
      </button>
    ),
  },
  actions: {
    submit: async (ctx) => {
      console.log("Form submitted!", ctx);
      alert("Form submitted!");
    },
  },
});
