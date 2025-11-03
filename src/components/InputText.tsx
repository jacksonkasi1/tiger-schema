interface InputTextProps {
  type?: string;
  name?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function InputText({
  type = 'text',
  name = '',
  placeholder = 'placeholder',
  value,
  onChange,
}: InputTextProps) {
  return (
    <div className="mb-2">
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full dark:bg-dark-900 dark:text-white-700 dark:placeholder-dark-500 rounded-md px-4 py-2 h-10 flex-grow border border-green-300 dark:border-dark-border focus:border-green-500 focus:ring-green-500 focus:outline-none"
      />
    </div>
  );
}
