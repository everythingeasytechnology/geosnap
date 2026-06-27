import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Oops!',
          headerShown: true,
          headerStyle: { backgroundColor: '#0B0D1A' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Screen not found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D1A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 20, color: '#FFFFFF', fontWeight: '700', marginBottom: 16 },
  link: { marginTop: 8 },
  linkText: { fontSize: 16, color: '#F5C518', fontWeight: '600' },
});
