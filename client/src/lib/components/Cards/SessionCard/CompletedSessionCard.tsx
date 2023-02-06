import React, {useCallback, useMemo} from 'react';

import {CompletedSession} from '../../../user/state/state';

import useExerciseById from '../../../content/hooks/useExerciseById';

import {formatExerciseName} from '../../../utils/string';

import WalletCard from '../WalletCard';

type CompletedSessionCardProps = {
  session: CompletedSession;
  hasCardBefore: boolean;
  hasCardAfter: boolean;
};

const CompletedSessionCard: React.FC<CompletedSessionCardProps> = ({
  session,
  hasCardBefore,
  hasCardAfter,
}) => {
  const {contentId, hostProfile} = session;
  const exercise = useExerciseById(contentId);

  const onContextPress = useCallback(() => {}, []);

  const image = useMemo(
    () => ({
      uri: exercise?.card?.image?.source,
    }),
    [exercise],
  );

  const lottie = useMemo(
    () =>
      exercise?.card?.lottie?.source
        ? {
            uri: exercise?.card?.lottie?.source,
          }
        : undefined,
    [exercise],
  );

  return (
    <WalletCard
      title={formatExerciseName(exercise)}
      image={image}
      lottie={lottie}
      hostPictureURL={hostProfile?.photoURL}
      hostName={hostProfile?.displayName}
      onPress={onContextPress}
      hasCardBefore={hasCardBefore}
      hasCardAfter={hasCardAfter}
    />
  );
};

export default CompletedSessionCard;
