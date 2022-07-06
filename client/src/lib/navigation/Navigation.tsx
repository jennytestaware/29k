import React from 'react';
import {useRecoilValue} from 'recoil';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

import Home from '../../routes/Home/Home';
import {ROUTES} from '../../common/constants/routes';
import {HomeIcon, ProfileIcon} from '../../common/components/Icons';
import {COLORS} from '../../common/constants/colors';
import {SPACINGS} from '../../common/constants/spacings';
import {killSwitchFields} from '../killSwitch/state/state';
import Video from '../../routes/Video/Video';
import Profile from '../../routes/Profile/Profile';
import KillSwitch from '../../routes/KillSwitch/KillSwitch';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const tabBarOptions = {
  headerShown: false,
  tabBarShowLabel: true,
  tabBarHideOnKeyboard: true,
  tabBarAllowFontScaling: false,
  tabBarActiveTintColor: COLORS.PEACH100,
  tabBarInactiveTintColor: COLORS.GREY600,
  tabBarItemStyle: {
    paddingVertical: SPACINGS.EIGHT,
    height: SPACINGS.SIXTY,
  },
  tabBarStyle: {
    marginBottom: 5,
    elevation: 0,
  },
};

const stackOptions = {
  headerShown: false,
};

const Navigation = () => {
  const isBlocking = useRecoilValue(killSwitchFields('isBlocking'));

  return (
    <NavigationContainer>
      {isBlocking ? (
        <Stack.Navigator screenOptions={stackOptions}>
          <Stack.Screen name={ROUTES.KILL_SWITCH} component={KillSwitch} />
        </Stack.Navigator>
      ) : (
        <Tab.Navigator screenOptions={tabBarOptions}>
          <Tab.Screen
            name={ROUTES.HOME}
            component={Home}
            options={{
              tabBarIcon: () => <HomeIcon fill={COLORS.GREY600} />,
            }}
          />
          <Tab.Screen
            name={ROUTES.PROFILE}
            component={Profile}
            options={{
              tabBarIcon: () => <ProfileIcon fill={COLORS.GREY600} />,
            }}
          />
          <Tab.Screen name={ROUTES.VIDEO} component={Video} />
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
};

export default Navigation;
