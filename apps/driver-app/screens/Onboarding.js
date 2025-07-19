import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { ErrorContext } from '../App';
import apiService from '../utils/api';

export default function Onboarding(props) {
  const { setError } = useContext(ErrorContext);
  const [submitting, setSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState(null);

  const handleSubmit = async (onboardingData) => {
    setSubmitting(true);
    setOnboardingError(null);
    try {
      await apiService.request('/onboarding/submit', { method: 'POST', body: JSON.stringify(onboardingData) }, "Failed to submit onboarding info. Please try again.");
      // ...success logic
    } catch (error) {
      setOnboardingError("Failed to submit onboarding info. Please try again.");
      setError("Failed to submit onboarding info. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding</Text>
      {onboardingError && <Text style={{ color: 'red', margin: 8 }}>{onboardingError}</Text>}
      <Button title={submitting ? "Submitting..." : "Submit"} onPress={handleSubmit} disabled={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 22, fontWeight: 'bold', color: '#2196F3' },
}); 