import { Alert as RNAlert } from 'react-native';

// Polyfill for Alert to ensure compatibility with React Native 0.79.4
const Alert = {
  alert: (title, message, buttons, options) => {
    try {
      return RNAlert.alert(title, message, buttons, options);
    } catch (error) {
      console.warn('Alert polyfill fallback:', error);
      // Fallback to console.log if Alert fails
      console.log(`[ALERT] ${title}: ${message}`);
      return null;
    }
  },
  prompt: (title, message, buttons, type, defaultValue) => {
    try {
      return RNAlert.prompt(title, message, buttons, type, defaultValue);
    } catch (error) {
      console.warn('Alert prompt polyfill fallback:', error);
      console.log(`[PROMPT] ${title}: ${message}`);
      return null;
    }
  }
};

export default Alert; 