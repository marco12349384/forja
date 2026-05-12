import { TextInput, View, Text } from 'react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  className?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  className = '',
}: InputProps) {
  return (
    <View className={`gap-1 ${className}`}>
      {label && (
        <Text className="text-zinc-400 text-sm font-medium">{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71717a"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        className={`bg-zinc-900 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 py-3 text-white text-base`}
      />
      {error && <Text className="text-red-400 text-xs">{error}</Text>}
    </View>
  );
}
