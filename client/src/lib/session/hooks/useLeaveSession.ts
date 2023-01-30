import {useCallback, useContext} from 'react';
import {Alert} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {DailyContext} from '../../../lib/daily/DailyProvider';
import useSessionState from '../state/state';
import {
  ModalStackProps,
  TabNavigatorProps,
} from '../../../lib/navigation/constants/routes';
import useSessions from '../../../lib/sessions/hooks/useSessions';
import useSessionNotificationsState from '../state/sessionNotificationsState';
import useLogInSessionMetricEvents from './useLogInSessionMetricEvents';
import useIsSessionHost from './useIsSessionHost';
import {SessionType} from '../../../../../shared/src/types/Session';

type ScreenNavigationProps = NativeStackNavigationProp<
  TabNavigatorProps & ModalStackProps
>;

const useLeaveSession = (sessionType: SessionType) => {
  const {t} = useTranslation('Component.ConfirmExitSession');
  const {leaveMeeting} = useContext(DailyContext);
  const {navigate} = useNavigation<ScreenNavigationProps>();
  const sessionState = useSessionState(state => state.sessionState);
  const isHost = useIsSessionHost();
  const {fetchSessions} = useSessions();
  const {logLiveSessionMetricEvent, logAsyncSessionMetricEvent} =
    useLogInSessionMetricEvents();

  const resetSession = useSessionState(state => state.reset);
  const resetSessionNotifications = useSessionNotificationsState(
    state => state.reset,
  );

  const leaveSession = useCallback(async () => {
    if (sessionType !== 'async') {
      await leaveMeeting();
    }

    resetSession();
    resetSessionNotifications();

    fetchSessions();

    navigate('Sessions');

    if (sessionState?.started) {
      navigate('SessionFeedbackModal', {
        sessionId: sessionState?.id,
        completed: Boolean(sessionState?.completed),
        isHost,
      });
    }
  }, [
    sessionType,
    sessionState?.id,
    sessionState?.started,
    sessionState?.completed,
    isHost,
    leaveMeeting,
    resetSession,
    resetSessionNotifications,
    navigate,
    fetchSessions,
  ]);

  const leaveSessionWithConfirm = useCallback(
    () =>
      Alert.alert(t('header'), t('text'), [
        {
          text: t('buttons.cancel'),
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: t('buttons.confirm'),
          style: 'destructive',

          onPress: () => {
            leaveSession();
            if (!sessionState?.completed) {
              if (sessionType === 'async') {
                logAsyncSessionMetricEvent('Leave Sharing Session');
              } else {
                logLiveSessionMetricEvent('Leave Sharing Session');
              }
            }
          },
        },
      ]),
    [
      sessionType,
      t,
      leaveSession,
      sessionState?.completed,
      logLiveSessionMetricEvent,
      logAsyncSessionMetricEvent,
    ],
  );

  return {leaveSession, leaveSessionWithConfirm};
};

export default useLeaveSession;
