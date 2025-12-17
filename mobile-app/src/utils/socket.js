import { io } from 'socket.io-client';
import { Platform } from 'react-native';

// Socket URL - Update this to match your backend server
const getSocketURL = () => {
  // Use your local IP address for mobile devices to connect to your development machine
  const LOCAL_IP = '192.168.1.2';
  
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  } else {
    // For mobile devices, use your local IP
    return `http://${LOCAL_IP}:5000`;
  }
};

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || getSocketURL();

// Create socket instance
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

export default socket;