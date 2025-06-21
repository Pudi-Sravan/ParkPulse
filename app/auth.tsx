import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { sendOtp, verifyOtpAndRegister, loginUser } from '@/services/appwrite';

const LoginRegisterScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');

  const handleSendOtp = async () => {
    try {
      if (!email) return Alert.alert('Please enter your email');
      const id = await sendOtp(email);
      setUserId(id);
      Alert.alert('OTP sent to your email.');
    } catch (error: unknown) {
      const err = error as Error;
      Alert.alert('Error sending OTP', err.message);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifyOtpAndRegister(userId, otp, email, username, password);
      Alert.alert('Registration successful');
      router.replace('/(user)/UserHome');
    } catch (error: unknown) {
      const err = error as Error;
      Alert.alert('Invalid OTP', err.message);
    }
  };

  const handleLogin = async () => {
    try {
      const user = await loginUser(email, password);
      const path = user.role === 'admin' ? '/(admin)/AdminHome' : '/(user)/UserHome';
      router.replace(path);
    } catch (error: unknown) {
      const err = error as Error;
      Alert.alert('Login failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Register' : 'Login'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {isRegistering && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          onChangeText={setUsername}
          value={username}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />

      {isRegistering ? (
        userId ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor="#888"
              keyboardType="numeric"
              onChangeText={setOtp}
              value={otp}
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
              <Text style={styles.buttonText}>Verify OTP & Register</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        )
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => {
        setIsRegistering(!isRegistering);
        setOtp('');
        setUserId('');
      }}>
        <Text style={styles.switchText}>
          {isRegistering
            ? 'Already have an account? Login'
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0F0D23',
  },
  title: {
    color: '#00FFFF',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#181636',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#00FFFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#0F0D23',
    fontWeight: 'bold',
  },
  switchText: {
    color: '#A8B5DB',
    textAlign: 'center',
    marginTop: 14,
  },
});

export default LoginRegisterScreen;
