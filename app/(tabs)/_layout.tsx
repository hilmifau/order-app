import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/hooks/use-theme';
import { RootState } from '@/store/store';

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isInitialized]);
  
  const isDark = colorScheme === 'dark';
  
  // Colors for different states
  const tabBarBg = isDark ? '#1a1a1a' : '#ffffff';
  const tabBarBorder = isDark ? '#333' : '#e5e5e5';
  const inactiveTint = isDark ? '#666' : '#999';
  const activeTint = isDark ? '#FFD700' : '#FF9800';
  const inactiveLabelColor = isDark ? '#999' : '#666';
  const activeLabelColor = isDark ? '#FFD700' : '#FF9800';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 28, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keranjang',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 28, color }}>🛒</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 28, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
