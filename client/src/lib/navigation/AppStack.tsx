import React from 'react';
import KillSwitch from '../../routes/KillSwitch/KillSwitch';
import useKillSwitchState from '../killSwitch/state/state';
import Tabs from './Tabs';
import useNavigationState from './state/state';
import SessionStackWrapper from './SessionStack';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import {AppStackProps} from './constants/routes';
import Welcome from '../../routes/Onboarding/Welcome';
import useAppState from '../appState/state/state';

const AppStack = createNativeStackNavigator<AppStackProps>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
};

const slideScreenOptions: NativeStackNavigationOptions = {
  ...screenOptions,
  animation: 'slide_from_bottom',
  gestureEnabled: false,
};

const fadeScreenOptions: NativeStackNavigationOptions = {
  ...screenOptions,
  animation: 'fade',
  animationDuration: 2000,
  gestureEnabled: false,
};

const AppStackWrapper = () => {
  const isBlocking = useKillSwitchState(state => state.isBlocking);
  const fade = useNavigationState(state => state.navigateWithFade);
  const settings = useAppState(state => state.settings);

  return (
    // set this state using useNavigationWithFade to change animation to fade
    <AppStack.Navigator screenOptions={slideScreenOptions}>
      {isBlocking ? (
        <AppStack.Screen name={'KillSwitch'} component={KillSwitch} />
      ) : settings.showWelcome ? (
        <AppStack.Screen name={'Welcome'} component={Welcome} />
      ) : (
        <AppStack.Group
          screenOptions={fade ? fadeScreenOptions : screenOptions}>
          <AppStack.Screen name={'Tabs'} component={Tabs} />
          <AppStack.Screen
            name={'SessionStack'}
            component={SessionStackWrapper}
            options={{gestureEnabled: false}}
          />
        </AppStack.Group>
      )}
    </AppStack.Navigator>
  );
};

export default AppStackWrapper;
