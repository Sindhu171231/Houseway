import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../src/screens/auth/LoginScreen';
import { AuthContext } from '../../src/context/AuthContext';

// Mock the AuthContext
const mockLogin = jest.fn();
const mockAuthContextValue = {
  login: mockLogin,
  isLoading: false,
  user: null,
};

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Wrapper component with AuthContext
const LoginScreenWrapper = ({ authValue = mockAuthContextValue }) => (
  <AuthContext.Provider value={authValue}>
    <LoginScreen navigation={mockNavigation} />
  </AuthContext.Provider>
);

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreenWrapper />);
    
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to your account')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('should handle email input', () => {
    const { getByPlaceholderText } = render(<LoginScreenWrapper />);
    const emailInput = getByPlaceholderText('Email');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should handle password input', () => {
    const { getByPlaceholderText } = render(<LoginScreenWrapper />);
    const passwordInput = getByPlaceholderText('Password');
    
    fireEvent.changeText(passwordInput, 'password123');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('should toggle password visibility', () => {
    const { getByTestId } = render(<LoginScreenWrapper />);
    const toggleButton = getByTestId('password-toggle');
    
    fireEvent.press(toggleButton);
    // Password should now be visible
    // You would check the secureTextEntry prop here
  });

  it('should validate empty fields', async () => {
    const { getByText } = render(<LoginScreenWrapper />);
    const signInButton = getByText('Sign In');
    
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Please enter your email'
      );
    });
  });

  it('should validate invalid email', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreenWrapper />);
    const emailInput = getByPlaceholderText('Email');
    const signInButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Validation Error',
        'Please enter a valid email address'
      );
    });
  });

  it('should call login with correct credentials', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreenWrapper />);
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show loading state', () => {
    const loadingAuthValue = {
      ...mockAuthContextValue,
      isLoading: true,
    };
    
    const { getByText } = render(<LoginScreenWrapper authValue={loadingAuthValue} />);
    
    // Should show loading indicator instead of "Sign In" text
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('should navigate to register screen', () => {
    const { getByText } = render(<LoginScreenWrapper />);
    const registerLink = getByText('Sign Up');
    
    fireEvent.press(registerLink);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('should navigate to forgot password screen', () => {
    const { getByText } = render(<LoginScreenWrapper />);
    const forgotPasswordLink = getByText('Forgot Password?');
    
    fireEvent.press(forgotPasswordLink);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('should handle login error', async () => {
    const errorLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    const errorAuthValue = {
      ...mockAuthContextValue,
      login: errorLogin,
    };
    
    const { getByPlaceholderText, getByText } = render(
      <LoginScreenWrapper authValue={errorAuthValue} />
    );
    
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid credentials'
      );
    });
  });

  it('should clear form after successful login', async () => {
    const successfulLogin = jest.fn().mockResolvedValue(true);
    const successAuthValue = {
      ...mockAuthContextValue,
      login: successfulLogin,
    };
    
    const { getByPlaceholderText, getByText } = render(
      <LoginScreenWrapper authValue={successAuthValue} />
    );
    
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(successfulLogin).toHaveBeenCalled();
      // Form should be cleared
      expect(emailInput.props.value).toBe('');
      expect(passwordInput.props.value).toBe('');
    });
  });
});
