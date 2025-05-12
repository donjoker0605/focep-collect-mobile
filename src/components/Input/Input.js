// src/components/Input/Input.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  editable = true,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  labelStyle,
  required = false,
  helper,
  prefix,
  suffix,
  maxLength,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.requiredAsterisk}>*</Text>}
          </Text>
        </View>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        !editable && styles.inputContainerDisabled,
      ]}>
        {icon && (
          <View style={styles.iconContainer}>
            {typeof icon === 'string' ? (
              <Ionicons name={icon} size={20} color={theme.colors.textLight} />
            ) : (
              icon
            )}
          </View>
        )}
        
        {prefix && (
          <View style={styles.prefixContainer}>
            <Text style={styles.prefix}>{prefix}</Text>
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.gray}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable}
          maxLength={maxLength}
          {...props}
        />
        
        {suffix && (
          <View style={styles.suffixContainer}>
            <Text style={styles.suffix}>{suffix}</Text>
          </View>
        )}
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={togglePasswordVisibility}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {typeof rightIcon === 'string' ? (
              <Ionicons name={rightIcon} size={20} color={theme.colors.textLight} />
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {helper && !error && (
        <Text style={styles.helperText}>{helper}</Text>
      )}
      
      {maxLength && value && (
        <Text style={styles.charCountText}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  requiredAsterisk: {
    color: theme.colors.error,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: 8,
    backgroundColor: theme.colors.lightGray,
    minHeight: 50,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.lightGray,
    opacity: 0.7,
  },
  iconContainer: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixContainer: {
    paddingLeft: 16,
  },
  prefix: {
    color: theme.colors.text,
    fontSize: 16,
  },
  suffixContainer: {
    paddingRight: 16,
  },
  suffix: {
    color: theme.colors.text,
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: theme.colors.textLight,
    fontSize: 12,
    marginTop: 4,
  },
  charCountText: {
    fontSize: 10,
    color: theme.colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
});

export default Input;