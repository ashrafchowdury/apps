import React from 'react';
import dynamic from 'next/dynamic';
import { LazyModal } from './common/types';

export type CloseModalFunc = (
  e: React.MouseEvent | React.KeyboardEvent | React.FormEvent,
) => void;

const SquadMemberModal = dynamic(
  () => import(/* webpackChunkName: "squadMemberModal" */ './SquadMemberModal'),
);
const UpvotedPopupModal = dynamic(
  () =>
    import(/* webpackChunkName: "upvotedPopupModal" */ './UpvotedPopupModal'),
);
const SquadTourModal = dynamic(
  () => import(/* webpackChunkName: "squadTourModal" */ './SquadTourModal'),
);
const SquadPromotionModal = dynamic(
  () =>
    import(
      /* webpackChunkName: "squadPromotionModal" */ './squads/SquadPromotionModal'
    ),
);

const ReadingHistoryModal = dynamic(
  () =>
    import(
      /* webpackChunkName: "readingHistoryModal" */ './post/ReadingHistoryModal'
    ),
);

const CreateSharedPostModal = dynamic(
  () =>
    import(
      /* webpackChunkName: "createSharedPostModal" */ './post/CreateSharedPostModal'
    ),
);

const ReportPostModal = dynamic(
  () =>
    import(
      /* webpackChunkName: "reportPostModal" */ './report/ReportPostModal'
    ),
);

const ReportCommentModal = dynamic(
  () =>
    import(
      /* webpackChunkName: "reportCommentModal" */ './report/ReportCommentModal'
    ),
);

const SquadNotificationsModal = dynamic(
  () =>
    import(
      /* webpackChunkName: "squadNotificationsModal" */ './squads/SquadNotificationsModal'
    ),
);

export const modals = {
  [LazyModal.SquadMember]: SquadMemberModal,
  [LazyModal.UpvotedPopup]: UpvotedPopupModal,
  [LazyModal.SquadTour]: SquadTourModal,
  [LazyModal.ReadingHistory]: ReadingHistoryModal,
  [LazyModal.SquadPromotion]: SquadPromotionModal,
  [LazyModal.CreateSharedPost]: CreateSharedPostModal,
  [LazyModal.ReportPost]: ReportPostModal,
  [LazyModal.ReportComment]: ReportCommentModal,
  [LazyModal.SquadNotifications]: SquadNotificationsModal,
};

type GetComponentProps<T> = T extends
  | React.ComponentType<infer P>
  | React.Component<infer P>
  ? P
  : never;

export type ModalsType = typeof modals;

export type LazyPropTypes = Partial<
  {
    [K in keyof ModalsType]: GetComponentProps<ModalsType[K]>;
  }[keyof ModalsType]
>;

type LazyModalComponentType<K extends LazyModal> = Omit<
  GetComponentProps<ModalsType[K]>,
  'isOpen' | 'onRequestClose'
>;

type RequiredKeys<T> = {
  [K in keyof T]: Record<string, never> extends { [P in K]: T[K] } ? never : K;
}[keyof T];

type NonOptional<T> = Pick<T, RequiredKeys<T>>;

export type LazyModalType<T extends keyof ModalsType> = {
  [K in keyof ModalsType]: NonOptional<
    LazyModalComponentType<K>
  > extends Record<string, never>
    ? {
        type: K;
        props?: LazyModalComponentType<K>;
      }
    : {
        type: K;
        props: LazyModalComponentType<K>;
      };
}[T];
