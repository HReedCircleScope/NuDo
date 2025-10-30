import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Import screens
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import TrophyRoadScreen from './screens/TrophyRoadScreen';
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';

// Import colors
import { Colors } from './constants/Colors';

// Create bottom tab navigator
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: Colors.black,
            borderTopColor: Colors.gray,
            borderTopWidth: 1,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarActiveTintColor: Colors.gold,
          tabBarInactiveTintColor: Colors.gray,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: Colors.black,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
            headerTitle: 'NuDo',
          }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="leaderboard" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Trophy"
          component={TrophyRoadScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="emoji-events" size={size} color={color} />
            ),
            headerTitle: 'Trophy Road',
          }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="place" size={size} color={color} />
            ),
            headerTitle: 'Study Zones',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
