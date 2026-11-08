import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* Dark theme input — left icon + password show/hide */
const AuthInput = ({ label, icon: Icon, type = "text", id, hint, ...props }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        )}
        <input
          id={id}
          type={inputType}
          {...props}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} ${isPassword ? "pr-11" : "pr-4"} py-3 rounded-xl bg-[#05061A]/60 border border-white/[0.1] text-[#F8FAFC] placeholder:text-slate-600 outline-none transition-all focus:border-[#22D3EE]/70 focus:ring-4 focus:ring-[#22D3EE]/10 disabled:opacity-60`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint}
    </div>
  );
};

export default AuthInput;
