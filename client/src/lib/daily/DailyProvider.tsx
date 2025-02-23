import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import Daily, {
  DailyEvent,
  DailyEventObject,
  DailyCall,
  DailyCallOptions,
} from '@daily-co/react-native-daily-js';
import useDailyState from './state/state';
import Sentry from '../sentry';

export type DailyProviderTypes = {
  call?: DailyCall;
  hasCameraPermissions: () => boolean;
  hasMicrophonePermissions: () => boolean;
  preJoinMeeting: (url: string, token: string) => Promise<void>;
  joinMeeting: (options?: DailyCallOptions) => Promise<void>;
  leaveMeeting: () => Promise<void>;
  toggleAudio: (enabled: boolean) => void;
  toggleVideo: (enabled: boolean) => void;
  muteAll: () => void;
  setUserName: (userName: string) => Promise<void>;
  setUserData: (userData: {[key: string]: unknown}) => Promise<void>;
  setSubscribeToAllTracks: () => void;
  sendMessage: (message: object) => void;
};

export const DailyContext = createContext<DailyProviderTypes>({
  hasCameraPermissions: () => false,
  hasMicrophonePermissions: () => false,
  preJoinMeeting: () => Promise.resolve(),
  joinMeeting: () => Promise.resolve(),
  leaveMeeting: () => Promise.resolve(),
  toggleAudio: () => {},
  toggleVideo: () => {},
  muteAll: () => {},
  setUserName: () => Promise.resolve(),
  setUserData: () => Promise.resolve(),
  setSubscribeToAllTracks: () => {},
  sendMessage: () => {},
});

const DailyProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [daily] = useState(() => Daily.createCallObject());

  const resetState = useDailyState(state => state.reset);
  const setParticipant = useDailyState(state => state.setParticipant);
  const setHasFailed = useDailyState(state => state.setHasFailed);
  const setHasEjected = useDailyState(state => state.setHasEjected);
  const removeParticipant = useDailyState(state => state.removeParticipant);
  const setParticipantsSortOrder = useDailyState(
    state => state.setParticipantsSortOrder,
  );

  const eventHandlers = useMemo<Array<[DailyEvent, (obj: any) => void]>>(() => {
    const onParticipantJoined = ({
      participant,
    }: DailyEventObject<'participant-joined'>) => {
      setParticipant(participant.session_id, participant);
    };

    const onParticipantUpdated = ({
      participant,
    }: DailyEventObject<'participant-updated'>) => {
      setParticipant(participant.session_id, participant);
    };

    const onParticipantLeft = ({
      participant,
    }: DailyEventObject<'participant-left'>) => {
      removeParticipant(participant.session_id);
    };

    const onActiveSpeakerChange = ({
      activeSpeaker,
    }: DailyEventObject<'active-speaker-change'>) => {
      const {peerId} = activeSpeaker;
      setParticipantsSortOrder(peerId);
    };

    const onError = async (errorEvent: DailyEventObject<'error'>) => {
      //Seems we only get here when it has totally failed
      if (errorEvent.error.type === 'ejected') {
        setHasEjected();
      } else {
        setHasFailed();
        Sentry.captureException(
          new Error('Error from Daily', {cause: errorEvent.errorMsg}),
        );
      }
    };

    return [
      ['participant-joined', onParticipantJoined],
      ['participant-left', onParticipantLeft],
      ['participant-updated', onParticipantUpdated],
      ['active-speaker-change', onActiveSpeakerChange],
      ['error', onError],
      //   ['network-quality-change', connect(networkQualityChange)],
    ];
  }, [
    setParticipant,
    removeParticipant,
    setParticipantsSortOrder,
    setHasFailed,
    setHasEjected,
  ]);

  const leaveMeeting = useCallback(async () => {
    if (!daily) {
      return;
    }

    await daily.leave();
  }, [daily]);

  const prepareMeeting = useCallback(
    async (url: string, token: string) => {
      if (daily.meetingState() !== 'joined-meeting') {
        await daily.preAuth({
          url,
          token,
        });
      }
    },

    [daily],
  );

  const setSubscribeToAllTracks = useCallback(() => {
    if (!daily) {
      return;
    }
    daily.setSubscribeToTracksAutomatically(true);
  }, [daily]);

  const toggleAudio = useCallback(
    (enabled = true) => {
      if (!daily) {
        return;
      }
      daily.setLocalAudio(enabled);
    },
    [daily],
  );

  const toggleVideo = useCallback(
    (enabled = true) => {
      if (!daily) {
        return;
      }

      daily.setLocalVideo(enabled);
    },
    [daily],
  );

  const muteAll = useCallback(() => {
    if (!daily) {
      return;
    }

    const updates = Object.keys(daily.participants()).reduce(
      (acc, id) => ({...acc, [id]: {setAudio: false}}),
      {},
    );

    daily.updateParticipants(updates);
  }, [daily]);

  const preJoinMeeting = useCallback(
    async (url: string, token: string) => {
      if (daily.meetingState() === 'new') {
        await prepareMeeting(url, token);
        await daily.startCamera({url});
      }
    },
    [daily, prepareMeeting],
  );

  const joinMeeting = useCallback(
    async (options?: DailyCallOptions) => {
      await daily.join(options);
    },
    [daily],
  );

  const setUserData = useCallback(
    async (userData: {[key: string]: unknown}) => {
      await daily.setUserData({
        ...(daily.participants()?.local?.userData as {[key: string]: unknown}),
        ...userData,
      });
    },
    [daily],
  );

  const setUserName = useCallback(
    async (userName: string) => {
      await setUserData({userName});
    },
    [setUserData],
  );

  const hasCameraPermissions = useCallback(
    () =>
      daily.participants().local?.tracks.video.blocked?.byPermissions !== true,
    [daily],
  );

  const hasMicrophonePermissions = useCallback(
    () =>
      daily.participants().local?.tracks.audio.blocked?.byPermissions !== true,
    [daily],
  );

  const sendMessage = useCallback(
    (message: object) => {
      if (!daily) {
        return;
      }
      daily.sendAppMessage(message);
    },
    [daily],
  );

  useEffect(() => {
    eventHandlers.forEach(([event, handler]) => {
      daily.on(event, handler);
    });

    return () => {
      eventHandlers.forEach(([event, handler]) => {
        daily.off(event, handler);
      });

      resetState();

      daily?.destroy();
    };
  }, [daily, eventHandlers, resetState]);

  return (
    <DailyContext.Provider
      value={{
        call: daily,
        hasCameraPermissions,
        hasMicrophonePermissions,
        preJoinMeeting,
        joinMeeting,
        leaveMeeting,
        toggleAudio,
        toggleVideo,
        muteAll,
        sendMessage,
        setUserName,
        setUserData,
        setSubscribeToAllTracks,
      }}>
      {children}
    </DailyContext.Provider>
  );
};

export default DailyProvider;
