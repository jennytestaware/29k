import {StackNavigationOptions} from '@react-navigation/stack';
import React from 'react';
import {createSharedElementStackNavigator} from 'react-navigation-shared-element';
import Welcome from '../../routes/Onboarding/Welcome';
import Profile from '../../routes/Profile/Profile';
import {ProfileStackProps} from './constants/routes';

const screenOptions: StackNavigationOptions = {
  headerShown: false,
};

/*
  This needs to be sharedElementStackNavigator because of an issue with react-navigation-shared-element
  not working properly inside of a @react-navigation/bottom-tabs.
  https://github.com/IjzerenHein/react-navigation-shared-element/issues/77#issuecomment-782101611
  It does however function identicakl to a @react-navigation/stack navigator.
*/
const ProfileStack = createSharedElementStackNavigator<ProfileStackProps>();

const ProfileStackWrapper = () => (
  <ProfileStack.Navigator screenOptions={screenOptions}>
    <ProfileStack.Screen name="Profile" component={Profile} />
    <ProfileStack.Screen
      name={'EarlyAccessInfo'}
      component={Welcome}
      initialParams={{showBack: true}}
    />
  </ProfileStack.Navigator>
);

export default ProfileStackWrapper;
