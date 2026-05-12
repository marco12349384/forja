import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const base = 'rounded-2xl px-6 py-4 items-center justify-center flex-row gap-2';
  const variants = {
    primary: 'bg-orange-500 active:bg-orange-600',
    secondary: 'bg-zinc-800 active:bg-zinc-700',
    ghost: 'bg-transparent border border-zinc-700',
  };
  const textVariants = {
    primary: 'text-white font-bold text-base',
    secondary: 'text-white font-semibold text-base',
    ghost: 'text-zinc-300 font-semibold text-base',
  };

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && <ActivityIndicator size="small" color="white" />}
      <Text className={textVariants[variant]}>{label}</Text>
    </TouchableOpacity>
  );
}
