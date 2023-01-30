import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useCallback} from 'react';

import {
  ModalStackProps,
  LiveSessionStackProps,
  TabNavigatorProps,
} from '../../lib/navigation/constants/routes';

import useLeaveSession from '../../lib/session/hooks/useLeaveSession';
import useIsSessionHost from '../../lib/session/hooks/useIsSessionHost';
import usePreventGoingBack from '../../lib/navigation/hooks/usePreventGoingBack';
import useUpdateSessionState from '../../lib/session/hooks/useUpdateSessionState';
import useSubscribeToSessionIfFocused from '../../lib/session//hooks/useSusbscribeToSessionIfFocused';
import useSessionExercise from '../../lib/session//hooks/useSessionExercise';
import IntroPortalComponent from '../../lib/session/components/IntroPortal/IntroPortal';
import PortalStatus from '../../lib/session/components/PortalStatus/PortalStatus';
import useLogInSessionMetricEvents from '../../lib/session/hooks/useLogInSessionMetricEvents';

const IntroPortal: React.FC = () => {
  const {
    params: {session},
  } = useRoute<RouteProp<LiveSessionStackProps, 'IntroPortal'>>();

  const exercise = useSessionExercise();
  const isHost = useIsSessionHost();
  const {navigate} =
    useNavigation<
      NativeStackNavigationProp<
        LiveSessionStackProps & TabNavigatorProps & ModalStackProps
      >
    >();
  const {startSession} = useUpdateSessionState(session.id);
  const {leaveSessionWithConfirm} = useLeaveSession(session.type);
  const isFocused = useIsFocused();
  const {logLiveSessionMetricEvent} = useLogInSessionMetricEvents();
  useSubscribeToSessionIfFocused(session);

  usePreventGoingBack(leaveSessionWithConfirm);

  useEffect(() => {
    logLiveSessionMetricEvent('Enter Intro Portal');
  }, [logLiveSessionMetricEvent]);

  const onStartSession = useCallback(() => {
    startSession();
    logLiveSessionMetricEvent('Start Sharing Session');
  }, [startSession, logLiveSessionMetricEvent]);

  const navigateToSession = useCallback(
    () => navigate('Session', {session}),
    [navigate, session],
  );

  return (
    <IntroPortalComponent
      exercise={exercise}
      isFocused={isFocused}
      isHost={isHost}
      onStartSession={onStartSession}
      onLeaveSession={leaveSessionWithConfirm}
      onNavigateToSession={navigateToSession}
      statusComponent={<PortalStatus />}
    />
  );
};

export default IntroPortal;
