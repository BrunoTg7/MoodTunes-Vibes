import { forwardRef } from "react";

interface InputEmocaoProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
}

const InputEmocao = forwardRef<HTMLInputElement, InputEmocaoProps>(
  ({ onEnter, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        className={className || "w-full p-4 bg-gray-800 text-white rounded-lg"}
        onKeyPress={(e) => e.key === "Enter" && onEnter?.()}
        {...props}
      />
    );
  }
);

export default InputEmocao;
