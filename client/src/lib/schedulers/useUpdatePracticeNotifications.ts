import {useCallback} from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {
  DEFAULT_NUMBER_OF_PRACTICE_REMINDERS,
  NOTIFICATION_CHANNELS,
} from '../notifications/constants';
import usePinnedCollections from '../user/hooks/usePinnedCollections';
import useGetCollectionById from '../content/hooks/useGetCollectionById';
import useUserEvents from '../user/hooks/useUserEvents';
import useTriggerNotifications from '../notifications/hooks/useTriggerNotifications';
import {calculateNextReminderTime} from './utils';
import {IntervalEnum} from '../user/types/Interval';
import {useTranslation} from 'react-i18next';
import {Collection} from '../../../../shared/src/types/generated/Collection';
import {PracticeReminderConfig} from '../user/state/state';

dayjs.extend(utc);

const useUpdatePracticeNotifications = () => {
  const {t} = useTranslation('Notifications.PracticeReminders');
  const {pinnedCollections} = usePinnedCollections();
  const {completedCollectionEvents} = useUserEvents();
  const getCollectionById = useGetCollectionById();
  const {removeTriggerNotifications, setTriggerNotification} =
    useTriggerNotifications();

  const reCreateNotifications = useCallback(
    async (
      collection: Collection | null,
      config: PracticeReminderConfig | null,
    ) => {
      await removeTriggerNotifications(
        NOTIFICATION_CHANNELS.PRACTICE_REMINDERS,
      );
      if (config) {
        const nextReminderTime = calculateNextReminderTime(
          dayjs().utc(),
          config,
        );
        for (
          let index = 0;
          index < DEFAULT_NUMBER_OF_PRACTICE_REMINDERS;
          index++
        ) {
          console.log(
            'setRminder',
            index,
            nextReminderTime
              .add(
                index,
                config.interval === IntervalEnum.everyDay ? 'day' : 'week',
              )
              .local()
              .toString(),
          );

          await setTriggerNotification(
            index.toString(),
            NOTIFICATION_CHANNELS.PRACTICE_REMINDERS,
            t('title'),
            collection
              ? t(`notifications.collection.${index}`, {title: collection.name})
              : t(`notifications.general.${index}`),
            collection?.link,
            collection?.image?.source,
            nextReminderTime
              .add(
                index,
                config.interval === IntervalEnum.everyDay ? 'day' : 'week',
              )
              .valueOf(),
          );
        }
      }
    },
    [t, removeTriggerNotifications, setTriggerNotification],
  );

  const updatePracticeNotifications = useCallback(
    async (config: PracticeReminderConfig | null) => {
      const pinnedCollection = pinnedCollections
        .sort(
          (a, b) =>
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
        )
        .find(
          c =>
            !completedCollectionEvents.find(
              cc =>
                cc.payload.id === c.id &&
                dayjs(c.startedAt).isBefore(cc.timestamp),
            ),
        );

      const collection = pinnedCollection
        ? getCollectionById(pinnedCollection.id)
        : null;

      await reCreateNotifications(collection, config);
    },
    [
      completedCollectionEvents,
      pinnedCollections,
      getCollectionById,
      reCreateNotifications,
    ],
  );

  return {
    updatePracticeNotifications,
  };
};

export default useUpdatePracticeNotifications;
